import {
  UI_CSS, UI_VERSION, navigation, row, button, iconButton, field, combobox,
  section, toggle, rangeControl, dialog, notice, versionInfo, emptyState,
  loadingState, bindUI, escapeHtml
} from './family-ui/1.2.2/family-ui.js';
import {
  MUSIC_VERSION, RADIO_ROOT, CONTROL_DEFAULTS, normalizeConfig, hasFeature,
  isAvailable, volumePercent, normalizeMedia, isRadioId, stationPayload,
  playbackAction, errorText, sonosOptions
} from './core.js';

// Only music-specific arrangement; all shared typography, fields, buttons,
// rows, slider, dialog, colors and spacing come from the unchanged UI Kit.
const MUSIC_CSS = `
  :host{min-width:0}
  .music-stack{display:grid;gap:16px;min-width:0}
  .music-transport{justify-content:center}
  .music-browser{display:grid;gap:16px;min-width:0}
  .music-results{max-height:50dvh;overflow:auto;overscroll-behavior:contain}
  .music-editor{display:grid;gap:16px;min-width:0}
`;

class MusicManagerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this._page = 'player';
    this._epoch = 0;
    this._request = 0;
    this._browserItems = [];
    this._path = [];
    this._query = '';
    this._busy = false;
    this._error = '';
    this._radioError = '';
    this._browseLoading = false;
    this._browseReady = false;
    this._canSearch = true;
    this._searchMode = false;
  }

  static getConfigElement() { return document.createElement('music-manager-card-editor'); }
  static getStubConfig(hass) {
    const entity = sonosOptions(hass)[0]?.value || '';
    return {type:'custom:music-manager-card',entity,name:'Music Manager',controls:{...CONTROL_DEFAULTS}};
  }
  getCardSize() { return 6; }
  getGridOptions() { return {columns:12,rows:'auto',min_columns:6,min_rows:3}; }

  setConfig(config) {
    const next = normalizeConfig(config);
    const changed = this._config?.entity !== next.entity;
    this._config = next;
    if (changed) {
      this._epoch++;
      this._request++;
      this._busy = false;
      this._error = '';
      this._selectedStation = null;
      this._dialog?.close();
    }
    this._ensureDOM();
    this._renderPlayer();
  }

  set hass(hass) {
    const previous = this._hass?.states?.[this._config?.entity];
    this._hass = hass;
    if (!this._config) return;
    this._ensureDOM();
    if (previous !== this._state || !this._player.firstChild) this._renderPlayer();
  }
  get _state() { return this._hass?.states?.[this._config?.entity]; }

  connectedCallback() { this._ensureDOM(); this._bind(); this._renderPlayer(); }
  disconnectedCallback() {
    this._unbind?.(); this._unbind = null;
    this._request++;
    this._epoch++;
    this._busy = false;
    this._browseLoading = false;
    this._dialog?.close();
  }

  _ensureDOM() {
    if (this._player) return;
    this.shadowRoot.innerHTML = `<style>${UI_CSS}\n${MUSIC_CSS}</style><ha-card>
      <div id="navigation"></div><main>
        <div id="player" class="music-stack"></div>
        <div id="help" hidden class="music-stack">
          ${section({id:'music-help',title:'So verwendest du den Music Manager',content:
            row({title:'Sonos-Box wählen',description:'Im Karteneditor legst du die Box und die sichtbaren Bedienelemente fest. Jede Karte kann eine andere Box steuern.'})+
            row({title:'Radio hören',description:'„Sender wählen“ öffnet den Radio Browser. Suche einen Sendernamen oder öffne ein Land, eine Sprache oder ein Genre. „Abspielen“ startet den Sender auf der gewählten Box.'})+
            row({title:'Play/Pause und Titelwechsel',description:'Zurück und Weiter steuern Titel in der Sonos-Warteschlange. Live-Radio kann keine Titel überspringen. Je nach Quelle unterstützt Sonos Pause oder nur Stop; Live-Radio setzt beim Fortsetzen am aktuellen Live-Programm an.'})+
            row({title:'Lautstärke und Gruppen',description:'Der Regler steuert die gewählte Box. Gehört sie zu einer Sonos-Gruppe, folgt die Wiedergabe dem normalen Sonos-Gruppenverhalten. Die Karte ändert keine Gruppierung.'})+
            row({title:'Voraussetzungen',description:'Die offiziellen Integrationen Sonos und Radio Browser müssen in Home Assistant eingerichtet sein. Die Karte verwendet die vorhandenen Home-Assistant-Berechtigungen.'})})}
          ${versionInfo({frontend:MUSIC_VERSION,ui:UI_VERSION})}
        </div>
      </main></ha-card>
      ${dialog({id:'music-radio-dialog',title:'Radio Browser',content:`<div class="music-browser">
        <form id="music-search-form" class="music-browser">
          <div id="search-field">${field({id:'music-radio-query',label:'Sender suchen',type:'search',placeholder:'z. B. SWR3 oder Rock',maxLength:200,autocomplete:'off'})}</div>
          <div class="toolbar">${button({label:'Suchen',action:'search',variant:'primary'})}${button({label:'Beliebt',action:'popular'})}${button({label:'Deutschland',action:'germany'})}${button({label:'Kategorien',action:'root'})}</div>
        </form>
        <div id="music-radio-status" aria-live="polite"></div>
        <div id="music-radio-path"></div>
        <div id="music-radio-results" class="music-results" aria-label="Radiosender und Kategorien"></div>
      </div>`})}`;
    this._player = this.shadowRoot.getElementById('player');
    this._dialog = this.shadowRoot.getElementById('music-radio-dialog');
    this._searchInput = this.shadowRoot.getElementById('music-radio-query');
    this._searchInput.addEventListener('input',()=>{this._query=this._searchInput.value;});
    this.shadowRoot.getElementById('music-search-form').addEventListener('submit',event=>{event.preventDefault();void this._search();});
    this._dialog.addEventListener('close',()=>{
      this._request++;
      this._browseLoading=false;
      // Restore a removed opener, but do not steal focus if the user has
      // already moved to another control before the native close event arrives.
      const active=this.shadowRoot.activeElement;
      if(!active || this._dialog.contains(active))this._player.querySelector('[data-action="open-radio"]')?.focus();
    });
    this._player.addEventListener('focusout',()=>{
      queueMicrotask(()=>{if(this._deferredPlayer && this.shadowRoot.activeElement?.type!=='range')this._renderPlayer();});
    });
    this._bind();
  }

  _bind() {
    if (this._unbind || !this._player || !this.isConnected) return;
    this._unbind = bindUI(this.shadowRoot,event=>{void this._action(event);});
  }

  _renderPlayer() {
    if (!this._player || !this._config) return;
    // HA state updates must not replace an input while the user drags it.
    const active = this.shadowRoot.activeElement;
    if (active?.type === 'range' && this._player.contains(active)) { this._deferredPlayer=true;return; }
    this._deferredPlayer=false;
    const focusedAction = this._player.contains(active) ? active?.dataset?.action : null;
    this.shadowRoot.getElementById('navigation').innerHTML = navigation({label:'Music Manager',items:[{id:'player',label:'Musik'}],active:this._page,settings:false});
    this._player.hidden = this._page !== 'player';
    this.shadowRoot.getElementById('help').hidden = this._page !== 'help';
    const state=this._state, attrs=state?.attributes || {}, controls=this._config.controls;
    const available=isAvailable(state), disabled=!available || this._busy;
    const action=playbackAction(state,this._selectedStation);
    const playing=['playing','buffering'].includes(state?.state);
    const playbackLabel=playing ? (action==='media_stop'?'Stop':'Pause') : 'Play';
    const stateLabel={playing:'Wiedergabe',paused:'Pausiert',idle:'Bereit',off:'Aus',buffering:'Wird geladen',unavailable:'Nicht erreichbar',unknown:'Status unbekannt'}[state?.state] || 'Nicht gefunden';
    const title=attrs.media_title || attrs.media_channel || 'Keine Wiedergabe';
    const detail=[attrs.media_artist || attrs.media_album_name, attrs.media_channel && attrs.media_channel!==title ? attrs.media_channel : '', stateLabel].filter(Boolean).join(' · ');
    const transport=[];
    if (controls.previous) transport.push(button({label:'Zurück',action:'previous',disabled:disabled||!hasFeature(state,'previous')}));
    if (controls.play_pause) transport.push(button({label:playbackLabel,action:'play-pause',variant:'primary',disabled:disabled||!action}));
    if (controls.next) transport.push(button({label:'Weiter',action:'next',disabled:disabled||!hasFeature(state,'next')}));
    const vol=volumePercent(attrs.volume_level);
    this._player.innerHTML = `
      ${row({title:this._config.name || 'Music Manager',description:attrs.friendly_name || this._config.entity})}
      ${row({title,description:detail})}
      ${!state ? notice('Die konfigurierte Sonos-Box wurde nicht gefunden. Bitte prüfe die Entität im Karteneditor.',{error:true}) : !available ? notice('Die Sonos-Box ist momentan nicht erreichbar.') : ''}
      ${transport.length ? `<div class="toolbar music-transport" aria-label="Wiedergabe">${transport.join('')}</div>` : ''}
      ${controls.volume ? rangeControl({id:'music-volume',label:'Lautstärke',value:vol??0,action:'volume',allowKeep:false,disabled:disabled||vol===null||!hasFeature(state,'volume')}) : ''}
      <div class="toolbar">
        ${controls.mute ? toggle({label:'Stumm',action:'mute',checked:Boolean(attrs.is_volume_muted),disabled:disabled||!hasFeature(state,'mute')}) : ''}
        ${button({label:'Sender wählen',action:'open-radio',disabled:disabled||!hasFeature(state,'playMedia')})}
      </div>
      <div id="music-player-status" aria-live="polite">${this._error ? notice(this._error,{error:true}) : this._busy ? loadingState('Befehl wird gesendet …') : ''}</div>`;
    if (focusedAction) this._player.querySelector(`[data-action="${focusedAction}"]`)?.focus();
  }

  async _action({action,data,value,phase,checked}) {
    switch(action) {
      case 'navigate': this._page=data.page==='help'?'help':'player';this._renderPlayer();break;
      case 'open-radio': await this._openRadio();break;
      case 'search': await this._search();break;
      case 'root': await this._browse(RADIO_ROOT,'Kategorien',true);break;
      case 'popular': await this._browse(RADIO_ROOT+'/popular','Beliebte Sender',true);break;
      case 'germany': await this._browse(RADIO_ROOT+'/country/DE','Deutschland',true);break;
      case 'back': {
        const path=this._path.slice(0,-1), parent=path.at(-1);
        await this._browse(parent?.id||RADIO_ROOT,parent?.title||'Kategorien',false,path);break;
      }
      case 'browse-item': {
        const item=this._browserItems[Number(data.index)];
        if(item?.can_expand)await this._browse(item.media_content_id,this._translateCategory(item.title));break;
      }
      case 'play-station': {
        const station=this._browserItems[Number(data.index)];
        if(station?.can_play)await this._playStation(station);break;
      }
      case 'previous': if(hasFeature(this._state,'previous'))await this._service('media_previous_track');break;
      case 'next': if(hasFeature(this._state,'next'))await this._service('media_next_track');break;
      case 'play-pause': {
        const service=playbackAction(this._state,this._selectedStation);
        if(service==='play_media')await this._playStation(this._selectedStation);
        else if(service)await this._service(service);break;
      }
      case 'mute': if(hasFeature(this._state,'mute'))await this._service('volume_mute',{is_volume_muted:checked});break;
      case 'volume':
        if (phase==='change' && hasFeature(this._state,'volume') && Number.isFinite(value)) {
          await this._service('volume_set',{volume_level:Math.max(0,Math.min(100,value))/100});
          // Preserve the focused slider, then reflect a rejected command on blur.
          this._deferredPlayer=true;
          const status=this.shadowRoot.getElementById('music-player-status');
          if(status)status.innerHTML=this._error?notice(this._error,{error:true}):'';
        }
        break;
    }
  }

  async _service(service,payload={},onSuccess) {
    if(this._busy || !this._hass || !isAvailable(this._state))return false;
    const epoch=this._epoch, hass=this._hass, entity=this._config.entity;
    this._busy=true;this._error='';this._renderPlayer();
    if(this._dialog.open)this._renderBrowser();
    try {
      await hass.callService('media_player',service,{...payload,entity_id:entity});
      if(epoch!==this._epoch)return false;
      onSuccess?.();
      return true;
    } catch(error) {
      if(epoch===this._epoch)this._error='Befehl fehlgeschlagen: '+errorText(error);
      return false;
    } finally {
      if(epoch===this._epoch) {
        this._busy=false;this._renderPlayer();
        if(this._dialog.open)this._renderBrowser();
      }
    }
  }

  async _playStation(station) {
    if(!hasFeature(this._state,'playMedia'))return;
    let payload;
    try {payload=stationPayload(station);} catch(error) {this._radioError=errorText(error);this._renderBrowser();return;}
    await this._service('play_media',payload,()=>{
      this._selectedStation={...station};
      this._dialog.close();
    });
  }

  async _openRadio() {
    if(!this._dialog.open)this._dialog.showModal();
    this._error='';this._radioError='';
    if(!this._browseReady)await this._browse(RADIO_ROOT,'Kategorien',true);
    else this._renderBrowser();
    if(this._dialog.open)this._searchInput.focus();
  }

  async _browse(id,title,reset=false,explicitPath) {
    if(!this._hass || !isRadioId(id))return;
    const token=++this._request;
    this._browseLoading=true;this._radioError='';this._error='';
    this._query='';this._searchInput.value='';
    this._renderBrowser();
    try {
      const response=await this._hass.callWS({type:'media_source/browse_media',media_content_id:id});
      if(token!==this._request)return;
      this._browserItems=normalizeMedia(response.children);
      this._browseReady=true;
      this._searchMode=false;
      if(id===RADIO_ROOT)this._canSearch=Boolean(response.can_search);
      this._path=explicitPath ?? (reset ? [{id,title}] : [...this._path,{id,title}]);
    } catch(error) {
      if(token!==this._request)return;
      this._browserItems=[];
      this._radioError='Radio Browser konnte nicht geladen werden. Prüfe unter Einstellungen → Geräte & Dienste, ob Radio Browser eingerichtet und verfügbar ist. '+errorText(error);
    } finally {
      if(token===this._request){this._browseLoading=false;this._renderBrowser();}
    }
  }

  async _search() {
    const query=this._searchInput.value.trim().slice(0,200);
    this._query=query;
    if(!query){await this._browse(RADIO_ROOT,'Kategorien',true);return;}
    const token=++this._request;
    this._browseLoading=true;this._radioError='';this._error='';this._renderBrowser();
    try {
      if(!this._canSearch)throw new Error('Die globale Sendersuche benötigt Home Assistant 2026.11 oder neuer. Du kannst Sender über die Kategorien auswählen.');
      const response=await this._hass.callWS({type:'media_source/search_media',media_content_id:RADIO_ROOT,search_query:query});
      if(token!==this._request)return;
      this._browserItems=normalizeMedia(response.result);
      this._searchMode=true;
      this._resultQuery=query;
    } catch(error) {
      if(token!==this._request)return;
      this._browserItems=[];
      this._radioError='Sendersuche fehlgeschlagen: '+errorText(error);
    } finally {
      if(token===this._request){this._browseLoading=false;this._renderBrowser();}
    }
  }

  _translateCategory(title) {
    return {'Popular':'Beliebte Sender','By Category':'Genres und Themen','By Language':'Sprachen','Local stations':'Sender in der Nähe','Country list':'Länder','Radio Browser':'Kategorien'}[title] || title;
  }

  _renderBrowser() {
    if(!this._dialog)return;
    const status=this.shadowRoot.getElementById('music-radio-status');
    const results=this.shadowRoot.getElementById('music-radio-results');
    const path=this.shadowRoot.getElementById('music-radio-path');
    status.innerHTML=(this._radioError?notice(this._radioError,{error:true}):'')+(this._error?notice(this._error,{error:true}):'')+(this._browseLoading?loadingState('Radiosender werden geladen …'):this._busy?loadingState('Sender wird gestartet …'):'');
    const pathLabel=this._searchMode ? `Suchergebnisse: ${this._resultQuery}` : this._path.map(p=>p.title).join(' / ');
    path.innerHTML=row({title:pathLabel||'Radio Browser',description:this._browseLoading?'':`${this._browserItems.length} Einträge`,trailing:this._path.length>1||this._searchMode?iconButton({icon:'left',label:'Zurück zu den Kategorien',action:'back',disabled:this._busy}):''});
    results.setAttribute('aria-busy',String(this._browseLoading));
    results.innerHTML=this._browseLoading?'':this._browserItems.length?this._browserItems.map((item,index)=>row({
      title:this._translateCategory(item.title),
      description:item.can_expand?'Kategorie':'Radiosender',
      trailing:item.can_expand ? iconButton({icon:'right',label:'Kategorie öffnen: '+item.title,action:'browse-item',data:{index},disabled:this._busy}) : button({label:'Abspielen',action:'play-station',data:{index},disabled:this._busy||!isAvailable(this._state)})
    })).join(''):this._radioError?'':emptyState(this._searchMode?'Keine passenden Sender gefunden. Versuche einen anderen Namen.':'Keine Einträge in dieser Kategorie.');
    for(const control of this._dialog.querySelectorAll('form button'))control.disabled=this._busy;
    this._searchInput.disabled=this._busy;
  }
}

class MusicManagerCardEditor extends HTMLElement {
  constructor() {
    super();this.attachShadow({mode:'open'});this._options=[];
    this._registryRequested=false;this._registryError='';
  }
  setConfig(config) {
    this._config={...config,name:config.name??'Music Manager',controls:{...CONTROL_DEFAULTS,...config.controls}};
    this._renderPreservingInput();
  }
  set hass(hass) {
    this._hass=hass;
    if(!this._registryRequested) {
      this._registryRequested=true;
      const cached=sonosOptions(hass);
      if(cached.length){this._options=cached;this._render();}
      // Entity registry is read-only; no new access rights or custom services.
      Promise.resolve().then(()=>hass.callWS({type:'config/entity_registry/list'})).then(entries=>{
        this._options=sonosOptions(this._hass,entries);this._registryError='';this._renderPreservingInput();
      }).catch(()=>{
        this._registryError=this._options.length?'':'Die Sonos-Geräteliste ist nicht verfügbar. Prüfe die Sonos-Integration und deine Berechtigungen.';
        this._renderPreservingInput();
      });
    }
    if(!this.shadowRoot.firstChild)this._render();
  }
  connectedCallback() {this._render();}
  disconnectedCallback() {this._unbind?.();this._unbind=null;}
  _emit() {
    this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config,controls:{...this._config.controls}}},bubbles:true,composed:true}));
  }
  _renderPreservingInput() {
    const input=this.shadowRoot.activeElement;
    const saved=input?.tagName==='INPUT'?{id:input.id,value:input.value,start:input.selectionStart,end:input.selectionEnd}:null;
    this._render();
    if(saved){const next=this.shadowRoot.getElementById(saved.id);if(next){next.value=saved.value;next.focus();if(saved.start!==null)next.setSelectionRange(saved.start,saved.end);}}
  }
  _render() {
    if(!this._config)return;
    this._unbind?.();
    const names={play_pause:'Play / Pause',previous:'Vorheriger Titel',next:'Nächster Titel',volume:'Lautstärke',mute:'Stummschalten'};
    const options=[...this._options];
    const selected=options.find(o=>o.value===this._config.entity);
    if(this._config.entity&&!selected)options.push({value:this._config.entity,label:this._hass?.states?.[this._config.entity]?.attributes?.friendly_name||this._config.entity,description:'Aktuell konfiguriert – Sonos-Zuordnung prüfen'});
    this.shadowRoot.innerHTML=`<style>${UI_CSS}\n${MUSIC_CSS}</style><div class="music-editor">
      ${combobox({id:'music-entity',label:'Sonos-Box',items:options,value:selected?.label||this._config.entity||'',selected:this._config.entity||'',action:'entity-select',placeholder:'Sonos-Box auswählen …',required:true,emptyLabel:'Keine Sonos-Box gefunden.'})}
      ${this._registryError?notice(this._registryError,{error:true}):''}
      ${field({id:'music-name',label:'Kartenname',value:this._config.name,maxLength:100})}
      ${section({id:'music-editor-controls',title:'Bedienelemente anzeigen',content:Object.entries(names).map(([key,label])=>row({title:label,trailing:toggle({label,action:'control-toggle',checked:this._config.controls[key],iconOnly:true,data:{key}})})).join('')})}
      ${notice('Die Box wird pro Karte festgelegt. Radiosender wählst du anschließend direkt in der Karte. Für die globale Suche wird Home Assistant 2026.11 oder neuer benötigt.')}
      ${versionInfo({frontend:MUSIC_VERSION,ui:UI_VERSION})}
    </div>`;
    this.shadowRoot.getElementById('music-name').addEventListener('input',event=>{this._config={...this._config,name:event.target.value};this._emit();});
    this._unbind=bindUI(this.shadowRoot,({action,data,value,checked})=>{
      if(action==='entity-select' && options.some(o=>o.value===value)) {
        this._config={...this._config,entity:value};this._emit();
      }
      if(action==='control-toggle' && Object.hasOwn(CONTROL_DEFAULTS,data.key)) {
        this._config={...this._config,controls:{...this._config.controls,[data.key]:checked}};this._emit();this._renderPreservingInput();
      }
    });
  }
}

if(!customElements.get('music-manager-card'))customElements.define('music-manager-card',MusicManagerCard);
if(!customElements.get('music-manager-card-editor'))customElements.define('music-manager-card-editor',MusicManagerCardEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='music-manager-card'))window.customCards.push({
  type:'music-manager-card',name:'Music Manager',description:'Sonos steuern und Sender aus dem Radio Browser abspielen. Mit HA UI Kit.',preview:true
});
