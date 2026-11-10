import {
  UI_CSS, UI_VERSION, row, button, iconButton, field, combobox,
  section, toggle, rangeControl, dialog, notice, versionInfo, emptyState,
  loadingState, bindUI, escapeHtml
} from './family-ui/1.2.2/family-ui.js';
import {
  MUSIC_VERSION, RADIO_ROOT, CONTROL_DEFAULTS, normalizeConfig, hasFeature,
  isAvailable, volumePercent, normalizeMedia, isRadioId, stationPayload,
  playbackAction, errorText, sonosOptions, FAVORITES_KEY, normalizeFavorites, stationLogo, saveFavorite
} from './core.js';

// UI Kit components remain unchanged; the music controls have their own
// scoped presentation to match the supplied Home Assistant media controls.
const MUSIC_CSS = `
  :host{min-width:0}
  .music-stack,.music-browser,.music-editor{display:grid;gap:16px;min-width:0}
  .music-controls{display:grid;gap:12px;min-width:0}
  .music-transport{display:flex;gap:12px}
  .music-transport button{flex:1;min-width:0;height:44px;display:grid;place-items:center;padding:0;border-radius:12px;background:var(--secondary-background-color,#f2f2f2);color:var(--primary-text-color,#212121)}
  .music-transport button:disabled{color:var(--disabled-text-color,#bdbdbd);opacity:1}
  .music-transport button:hover:enabled{background:color-mix(in srgb,var(--primary-color,#03a9f4) 12%,var(--secondary-background-color,#f2f2f2))}
  .music-icon{width:20px;height:20px;fill:currentColor;vertical-align:middle}
  .music-volume .position-control{padding:0}
  .music-volume .slider-head{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%)}
  .music-volume input[type=range]{display:block;appearance:none;-webkit-appearance:none;box-sizing:border-box;width:100%;height:42px;margin:0;padding:0;border:0;border-radius:12px;cursor:pointer;background:linear-gradient(to right,var(--primary-color,#49a5ed) var(--range-percent),color-mix(in srgb,var(--primary-color,#49a5ed) 20%,var(--card-background-color,#fff)) var(--range-percent))}
  .music-volume input[type=range]::-webkit-slider-runnable-track{height:42px;border:0;border-radius:12px;background:transparent}
  .music-volume input[type=range]::-moz-range-track{height:42px;border:0;border-radius:12px;background:transparent}
  .music-volume input[type=range]::-moz-range-progress{background:transparent}
  .music-volume input[type=range]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:32px;height:42px;margin:0;border:0;border-radius:10px;box-shadow:none;background:var(--primary-color,#49a5ed) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='42'%3E%3Crect x='14' y='11' width='4' height='20' rx='2' fill='white'/%3E%3C/svg%3E") center no-repeat}
  .music-volume input[type=range]::-moz-range-thumb{width:32px;height:42px;border:0;border-radius:10px;box-shadow:none;background:var(--primary-color,#49a5ed) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='42'%3E%3Crect x='14' y='11' width='4' height='20' rx='2' fill='white'/%3E%3C/svg%3E") center no-repeat}
  .music-volume input:disabled{opacity:.45;cursor:default}
  .music-favorites:empty,#music-favorite-status:empty,#music-player-status:empty{display:none}
  .music-station-row [aria-pressed="false"] .music-icon{fill:none;stroke:currentColor;stroke-width:1.7}
  .music-favorites{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:12px;min-width:0}
  .music-favorite{display:grid;gap:6px;align-content:start;justify-items:center;min-width:0;min-height:80px;padding:8px;border-radius:12px;background:var(--secondary-background-color,#f2f2f2)}
  .music-favorite span{max-width:100%;overflow-wrap:anywhere}
  .music-station-logo{position:relative;display:grid;place-items:center;width:48px;height:48px;flex-shrink:0;border-radius:8px;background:var(--card-background-color,#fff);color:var(--secondary-text-color,#727272);overflow:hidden}
  .music-station-logo img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--card-background-color,#fff)}
  .music-station-row{display:flex;align-items:center;gap:12px;min-width:0}
  .music-station-row>.setting-row{flex:1;min-width:0}
  .music-results{max-height:50dvh;overflow:auto;overscroll-behavior:contain}
`;
const MUSIC_ICONS = {
  previous:'M6 5h2v14H6zM18 5v14l-9-7z',next:'M16 5h2v14h-2zM6 5l9 7-9 7z',
  play:'M8 5v14l11-7z',pause:'M6 5h4v14H6zM14 5h4v14h-4z',stop:'M6 6h12v12H6z',
  star:'m12 2.5 2.9 5.9 6.5 1-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-1z',
  radio:'M4 7h16v13H4zM6 3l13-2v2L6 5zM6 9v3h12V9zM7 14h5v4H7zM15 14h3v2h-3z'
};
const musicIcon = name => `<svg class="music-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${MUSIC_ICONS[name]}"></path></svg>`;
function musicButton({label,action,icon,disabled=false,data={},pressed}) {
  return button({label,action,disabled,data}).replace('<button ',`<button aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"${pressed===undefined?'':` aria-pressed="${pressed}"`} `).replace(`<span>${escapeHtml(label)}</span>`,musicIcon(icon));
}
function logoMarkup(station) {
  const src=stationLogo(station.thumbnail);
  return `<span class="music-station-logo" aria-hidden="true">${musicIcon('radio')}${src?`<img src="${escapeHtml(src)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}</span>`;
}

class MusicManagerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this._favorites = [];
    this._favoriteEpoch = 0;
    this._favoriteLoading = false;
    this._favoriteBusy = false;
    this._favoriteError = '';
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
    return {type:'custom:music-manager-card',entity,controls:{...CONTROL_DEFAULTS}};
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
    this._connectFavorites();
    if (previous !== this._state || !this._player.firstChild) this._renderPlayer();
  }
  get _state() { return this._hass?.states?.[this._config?.entity]; }

  connectedCallback() { this._ensureDOM(); this._bind(); this._connectFavorites(); this._renderPlayer(); }
  disconnectedCallback() {
    this._unbind?.(); this._unbind = null;
    this._disconnectFavorites();
    this._request++;
    this._epoch++;
    this._busy = false;
    this._browseLoading = false;
    this._dialog?.close();
  }

  _ensureDOM() {
    if (this._player) return;
    this.shadowRoot.innerHTML = `<style>${UI_CSS}\n${MUSIC_CSS}</style><ha-card>
      <main><div id="player" class="music-stack"></div></main></ha-card>
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
    this.shadowRoot.addEventListener('error',event=>{if(event.target.tagName==='IMG')event.target.hidden=true;},true);
    this._bind();
  }

  _bind() {
    if (this._unbind || !this._player || !this.isConnected) return;
    this._unbind = bindUI(this.shadowRoot,event=>{void this._action(event);});
  }

  _disconnectFavorites() {
    this._favoriteEpoch++;
    this._favoriteUnsubscribe?.();
    this._favoriteUnsubscribe=null;
    this._favoriteUser=null;
    this._favoriteConnection=null;
    this._favoriteBusy=false;
    this._favorites=[];
  }

  _connectFavorites() {
    if(!this.isConnected || !this._hass)return;
    const hass=this._hass, user=hass.user?.id, connection=hass.connection;
    if(this._favoriteUser===user && this._favoriteConnection===connection)return;
    this._disconnectFavorites();
    this._favoriteUser=user;
    this._favoriteConnection=connection;
    this._favoriteLoading=Boolean(user);
    this._favoriteError=user?'':'Favoriten benötigen einen angemeldeten Home-Assistant-Benutzer.';
    const epoch=this._favoriteEpoch;
    // Clear the previous user's shortcuts immediately, even during a drag.
    this.shadowRoot.activeElement?.blur?.();
    this._renderPlayer();
    if(!user)return;
    const apply=response=>{
      if(epoch!==this._favoriteEpoch)return;
      this._favorites=normalizeFavorites(response?.value);
      this._favoriteLoading=false;this._favoriteError='';
      this._renderPlayer();if(this._dialog.open)this._renderBrowser();
    };
    void (async()=>{
      try {
        if(connection?.subscribeMessage) {
          const unsubscribe=await connection.subscribeMessage(apply,{type:'frontend/subscribe_user_data',key:FAVORITES_KEY});
          if(epoch!==this._favoriteEpoch)unsubscribe();
          else this._favoriteUnsubscribe=unsubscribe;
        } else apply(await hass.callWS({type:'frontend/get_user_data',key:FAVORITES_KEY}));
      } catch(error) {
        if(epoch!==this._favoriteEpoch)return;
        this._favoriteLoading=false;
        this._favoriteError='Favoriten konnten nicht geladen werden: '+errorText(error);
        this._renderPlayer();if(this._dialog.open)this._renderBrowser();
      }
    })();
  }

  async _toggleFavorite(station) {
    if(this._favoriteBusy || this._favoriteLoading || !station?.can_play)return;
    const epoch=this._favoriteEpoch, hass=this._hass;
    const enabled=!this._favorites.some(s=>s.media_content_id===station.media_content_id);
    this._favoriteBusy=true;this._favoriteError='';this._renderBrowser();
    try {
      const favorites=await saveFavorite(hass,station,enabled);
      if(epoch===this._favoriteEpoch)this._favorites=favorites;
    } catch(error) {
      if(epoch===this._favoriteEpoch)this._favoriteError='Favoriten konnten nicht gespeichert werden: '+errorText(error);
    } finally {
      if(epoch===this._favoriteEpoch){this._favoriteBusy=false;this._renderPlayer();this._renderBrowser();}
    }
  }

  _renderPlayer() {
    if (!this._player || !this._config) return;
    // HA state updates must not replace an input while the user drags it.
    const active = this.shadowRoot.activeElement;
    if (active?.type === 'range' && this._player.contains(active)) { this._deferredPlayer=true;return; }
    this._deferredPlayer=false;
    const focusedAction = this._player.contains(active) ? active?.dataset?.action : null;
    const state=this._state, attrs=state?.attributes || {}, controls=this._config.controls;
    const available=isAvailable(state), disabled=!available || this._busy;
    const action=playbackAction(state,this._selectedStation);
    const playing=['playing','buffering'].includes(state?.state);
    const playbackLabel=playing ? (action==='media_stop'?'Stop':'Pause') : 'Play';
    const stateLabel={playing:'Wiedergabe',paused:'Pausiert',idle:'Bereit',off:'Aus',buffering:'Wird geladen',unavailable:'Nicht erreichbar',unknown:'Status unbekannt'}[state?.state] || 'Nicht gefunden';
    const title=attrs.media_title || attrs.media_channel || 'Keine Wiedergabe';
    const detail=[attrs.media_artist || attrs.media_album_name, attrs.media_channel && attrs.media_channel!==title ? attrs.media_channel : '', stateLabel].filter(Boolean).join(' · ');
    const transport=[];
    if (controls.previous) transport.push(musicButton({label:'Zurück',icon:'previous',action:'previous',disabled:disabled||!hasFeature(state,'previous')}));
    if (controls.play_pause) transport.push(musicButton({label:playbackLabel,icon:playing?(action==='media_stop'?'stop':'pause'):'play',action:'play-pause',disabled:disabled||!action}));
    if (controls.stop) transport.push(musicButton({label:'Stop',icon:'stop',action:'stop',disabled:disabled||!hasFeature(state,'stop')}));
    if (controls.next) transport.push(musicButton({label:'Weiter',icon:'next',action:'next',disabled:disabled||!hasFeature(state,'next')}));
    const vol=attrs.is_volume_muted?0:volumePercent(attrs.volume_level);
    this._player.innerHTML = `
      <div class="music-box">${row({title:attrs.friendly_name || this._config.entity})}</div>
      ${row({title,description:detail})}
      ${!state ? notice('Die konfigurierte Sonos-Box wurde nicht gefunden. Bitte prüfe die Entität im Karteneditor.',{error:true}) : !available ? notice('Die Sonos-Box ist momentan nicht erreichbar.') : ''}
      <div class="music-controls">
        ${transport.length ? `<div class="music-transport" aria-label="Wiedergabe">${transport.join('')}</div>` : ''}
        ${controls.volume ? `<div class="music-volume">${rangeControl({id:'music-volume',label:'Lautstärke',value:vol??0,action:'volume',allowKeep:false,disabled:disabled||vol===null||!hasFeature(state,'volume')})}</div>` : ''}
      </div>
      <div id="music-favorites" class="music-favorites" aria-label="Favoritensender">${this._favorites.map((station,index)=>button({label:station.title,action:'play-favorite',data:{index},disabled:disabled||!hasFeature(state,'playMedia')}).replace('class=""','class="music-favorite"').replace('<button ',`<button aria-label="${escapeHtml(station.title+' abspielen')}" `).replace('<span>',logoMarkup(station)+'<span>')).join('')}</div>
      <div class="toolbar">${button({label:'Sender wählen',action:'open-radio',disabled:this._busy})}</div>
      <div id="music-favorite-status" aria-live="polite">${this._favoriteError?notice(this._favoriteError,{error:true})+button({label:'Favoriten neu laden',action:'reload-favorites'}):this._favoriteLoading?loadingState('Favoriten werden geladen …'):!this._favorites.length?notice('Im Radio Browser mit dem Stern Sender zu deinen Favoriten hinzufügen.'):''}</div>
      <div id="music-player-status" aria-live="polite">${this._error ? notice(this._error,{error:true}) : this._busy ? loadingState('Befehl wird gesendet …') : ''}</div>`;
    if (focusedAction) this._player.querySelector(`[data-action="${focusedAction}"]`)?.focus();
  }

  async _action({action,data,value,phase,checked}) {
    switch(action) {
      case 'reload-favorites': this._disconnectFavorites();this._connectFavorites();break;
      case 'toggle-favorite': await this._toggleFavorite(this._browserItems[Number(data.index)]);break;
      case 'play-favorite': {const station=this._favorites[Number(data.index)];if(station)await this._playStation(station);break;}
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
      case 'stop': if(hasFeature(this._state,'stop'))await this._service('media_stop');break;
      case 'previous': if(hasFeature(this._state,'previous'))await this._service('media_previous_track');break;
      case 'next': if(hasFeature(this._state,'next'))await this._service('media_next_track');break;
      case 'play-pause': {
        const service=playbackAction(this._state,this._selectedStation);
        if(service==='play_media')await this._playStation(this._selectedStation);
        else if(service)await this._service(service);break;
      }
      case 'volume':
        if (phase==='change' && hasFeature(this._state,'volume') && Number.isFinite(value)) {
          const level=Math.max(0,Math.min(100,value))/100;
          const epoch=this._epoch;
          const ok=await this._service('volume_set',{volume_level:level});
          // A positive slider value must also release mute set in another app.
          if(ok && epoch===this._epoch && level>0 && this._state?.attributes?.is_volume_muted && hasFeature(this._state,'mute'))await this._service('volume_mute',{is_volume_muted:false});
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
    status.innerHTML=(this._favoriteError?notice(this._favoriteError,{error:true}):'')+(this._radioError?notice(this._radioError,{error:true}):'')+(this._error?notice(this._error,{error:true}):'')+(this._browseLoading?loadingState('Radiosender werden geladen …'):this._busy?loadingState('Sender wird gestartet …'):'');
    const pathLabel=this._searchMode ? `Suchergebnisse: ${this._resultQuery}` : this._path.map(p=>p.title).join(' / ');
    path.innerHTML=row({title:pathLabel||'Radio Browser',description:this._browseLoading?'':`${this._browserItems.length} Einträge`,trailing:this._path.length>1||this._searchMode?iconButton({icon:'left',label:'Zurück zu den Kategorien',action:'back',disabled:this._busy}):''});
    results.setAttribute('aria-busy',String(this._browseLoading));
    results.innerHTML=this._browseLoading?'':this._browserItems.length?this._browserItems.map((item,index)=>`<div class="music-station-row">${item.can_play?logoMarkup(item):''}${row({
      title:this._translateCategory(item.title),
      description:item.can_expand?'Kategorie':'Radiosender',
      trailing:item.can_expand ? iconButton({icon:'right',label:'Kategorie öffnen: '+item.title,action:'browse-item',data:{index},disabled:this._busy}) : musicButton({label:(this._favorites.some(s=>s.media_content_id===item.media_content_id)?'Favorit entfernen: ':'Als Favorit speichern: ')+item.title,icon:'star',action:'toggle-favorite',data:{index},pressed:this._favorites.some(s=>s.media_content_id===item.media_content_id),disabled:this._favoriteBusy||this._favoriteLoading||!this._hass?.user?.id})+button({label:'Abspielen',action:'play-station',data:{index},disabled:this._busy||!isAvailable(this._state)||!hasFeature(this._state,'playMedia')})
    })}</div>`).join(''):this._radioError?'':emptyState(this._searchMode?'Keine passenden Sender gefunden. Versuche einen anderen Namen.':'Keine Einträge in dieser Kategorie.');
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
    this._config={...config,name:config.name??'',controls:{...CONTROL_DEFAULTS,...config.controls}};
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
    const names={play_pause:'Play / Pause',previous:'Vorheriger Titel',stop:'Stop',next:'Nächster Titel',volume:'Lautstärke'};
    const options=[...this._options];
    const selected=options.find(o=>o.value===this._config.entity);
    if(this._config.entity&&!selected)options.push({value:this._config.entity,label:this._hass?.states?.[this._config.entity]?.attributes?.friendly_name||this._config.entity,description:'Aktuell konfiguriert – Sonos-Zuordnung prüfen'});
    this.shadowRoot.innerHTML=`<style>${UI_CSS}\n${MUSIC_CSS}</style><div class="music-editor">
      ${combobox({id:'music-entity',label:'Sonos-Box',items:options,value:selected?.label||this._config.entity||'',selected:this._config.entity||'',action:'entity-select',placeholder:'Sonos-Box auswählen …',required:true,emptyLabel:'Keine Sonos-Box gefunden.'})}
      ${this._registryError?notice(this._registryError,{error:true}):''}
      ${section({id:'music-editor-controls',title:'Bedienelemente anzeigen',content:Object.entries(names).map(([key,label])=>row({title:label,trailing:toggle({label,action:'control-toggle',checked:this._config.controls[key],iconOnly:true,data:{key}})})).join('')})}
      ${notice('Die Box wird pro Karte festgelegt. Radiosender wählst du direkt in der Karte. Favoriten gehören deinem angemeldeten HA-Benutzer und erscheinen bei allen Boxen. Für die globale Suche wird Home Assistant 2026.11 oder neuer benötigt.')}
      ${versionInfo({frontend:MUSIC_VERSION,ui:UI_VERSION})}
    </div>`;
    if(!this._unbind)this._unbind=bindUI(this.shadowRoot,({action,data,value,checked})=>{
      if(action==='entity-select' && (this._options.some(o=>o.value===value)||value===this._config.entity)) {
        this._config={...this._config,entity:value};
        // Selection is complete: preserving focus on the replaced search input
        // would reopen the in-flow list and shift the next clicked control.
        this.shadowRoot.activeElement?.blur?.();
        this._emit();
        this.shadowRoot.querySelector('[data-ui-combo-toggle]')?.focus();
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
