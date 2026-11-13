import {UI_CSS, row, button, dialog, field, selectField, notice, loadingState, bindUI, escapeHtml} from './family-ui/1.4.1/family-ui.js';
import {MUSIC_DIALOG_CSS} from './music-layout.js';

/** An entities-card row. The backend resolves the configured owner and box. */
class MusicManagerAlarmRow extends HTMLElement {
  constructor() { super();this.attachShadow({mode:'open'});this._epoch=0;this._data=null;this._error=''; }
  static get supportsPlaybackSettings(){return true;}
  /** The owning alarm integration persists playback policy; this row owns its draft. */
  set playbackSettings(settings){this._playback=settings;if(!this._dialog?.open)this._playbackDraft=settings?{...settings.value}:null;this._render();}
  setConfig(config) {
    if(!/^[a-z0-9][a-z0-9_]{0,63}$/.test(config?.alarm_id||''))throw new Error('Bitte eine gültige Weckerkennung angeben.');
    this._config={...config};this._reset();this._ensure();this._load();
  }
  set hass(hass) {
    const changed=this._hass?.user?.id!==hass.user?.id||this._hass?.connection!==hass.connection;
    this._hass=hass;
    if(changed){this._reset();this._ensure();this._load();}
  }
  connectedCallback() { this._ensure();if(!this._unbind)this._unbind=bindUI(this.shadowRoot,event=>this._action(event));this._load(); }
  disconnectedCallback() { this._reset();this._unbind?.();this._unbind=null; }
  _reset() { this._epoch++;this._loading=false;this._saving=false;this._data=null;this._loadedKey=null;this._error='';this._query='';this._dialog?.close(); }
  _ensure() {
    if(!this._config)return;
    if(!this._dialog){
      this.shadowRoot.innerHTML=`<style>${UI_CSS}${MUSIC_DIALOG_CSS}
        :host{min-width:0;width:100%;max-width:100%}
        .alarm-row{min-width:0;max-width:100%}
        .alarm-row>.setting-row{min-width:0;width:100%}
        .alarm-browser{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;min-width:0}
        .alarm-song-list{display:grid;gap:8px;list-style:none;margin:0;padding:0;min-width:0}
        .alarm-song-list button{display:flex;align-items:center;gap:12px;text-align:start;width:100%;min-height:64px;padding:12px;border:1px solid var(--divider-color,#ddd);border-radius:12px;color:var(--primary-text-color,#212121)}
        .alarm-song-list button[aria-pressed="true"]{border-color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 10%,transparent)}
        .alarm-choice-mark{display:grid;place-items:center;flex:0 0 22px;width:22px;height:22px;border:2px solid var(--divider-color,#ddd);border-radius:50%;color:transparent}
        [aria-pressed="true"] .alarm-choice-mark{border-color:var(--primary-color,#03a9f4);background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff)}
        .alarm-choice-name{min-width:0;overflow-wrap:anywhere}.alarm-choice-name small{display:block}
        #alarm-current .setting-row{align-items:flex-start;flex-wrap:wrap;gap:8px}#alarm-current .row-text{flex-basis:200px}
        @media(max-width:600px){#alarm-current button{width:100%}}
      </style><div class="alarm-row" id="alarm-row"></div>${dialog({id:'alarm-dialog',title:'Weckmusik auswählen',content:'<div class="alarm-browser" id="alarm-content"></div>'})}`;
      this._dialog=this.shadowRoot.getElementById('alarm-dialog');
      this.shadowRoot.addEventListener('input',event=>{if(event.target.id==='alarm-song-query'){this._query=event.target.value;this._renderChoices();}if(event.target.id==='alarm-playback-minutes'&&this._playbackDraft)this._playbackDraft.minutes=Number(event.target.value);});
      this.shadowRoot.addEventListener('change',event=>{if(event.target.id==='alarm-playback-mode'&&this._playbackDraft){this._playbackDraft.mode=event.target.value;this._render();}});
      this._dialog.addEventListener('close',()=>{this._epoch++;this._loading=false;this._saving=false;this._render();this.shadowRoot.querySelector('[data-action="alarm-open"]')?.focus();});
    }
    this._render();
  }
  _isChoice(item) { return item?.media_type==='track'||(item?.kind==='radio'&&/^media-source:\/\/radio_browser\/[a-zA-Z0-9_-]{1,128}$/.test(item.uri)); }
  _request(action,extra={}) { return this._hass.callWS({type:'music_manager/alarm',action,alarm_id:this._config.alarm_id,...extra}); }
  async _load(force=false) {
    if(!this.isConnected||!this._hass?.user?.id||!this._config||this._loading||this._saving)return;
    const key=this._hass.connection, user=this._hass.user.id;
    if(!force&&this._loadedKey?.connection===key&&this._loadedKey?.user===user&&this._loadedKey?.id===this._config.alarm_id)return;
    const epoch=++this._epoch;this._loading=true;this._error='';this._render();
    try {
      const data=await this._request('get');if(epoch!==this._epoch)return;
      this._data=data;this._loadedKey={connection:key,user,id:this._config.alarm_id};
    } catch(error) { if(epoch===this._epoch)this._error=String(error?.message||error?.code||error); }
    finally { if(epoch===this._epoch){this._loading=false;this._render();} }
  }
  async _action({action,value,data}) {
    if(action==='alarm-open'){
      this._query='';this._playbackDraft=this._playback?{...this._playback.value}:null;this._dialog.showModal();await this._load(true);return;
    }
    if(action==='alarm-retry'){await this._load(true);return;}
    if(action==='alarm-clear')value='';
    if(action==='alarm-select')value??=data?.uri;
    if(!['alarm-select','alarm-clear','alarm-playback-save'].includes(action)||this._saving||this._loading)return;
    const current=this._data;
    const choice=action==='alarm-playback-save'?current?.selection:(current?.songs||current?.favorites)?.find(f=>this._isChoice(f)&&f.uri===value);
    if(action!=='alarm-playback-save'&&value!==''&&!choice)return;
    if(this._playbackDraft){
      const p=this._playbackDraft;
      if(p.mode==='track_end'&&(!choice||choice.kind==='radio'||choice.media_type!=='track')){this._error='„Wenn Titel endet“ benötigt einen einzelnen Titel. Für Radio oder die letzte Sonos-Wiedergabe bitte eine feste Dauer wählen.';this._render();return;}
      if(!['duration','track_end'].includes(p.mode)||p.mode==='duration'&&(!Number.isInteger(p.minutes)||p.minutes<1||p.minutes>1440)){this._error='Bitte eine Dauer von 1 bis 1440 Minuten wählen.';this._render();return;}
    }
    const epoch=++this._epoch;this._saving=true;this._error='';this._render();
    try {
      if(action!=='alarm-playback-save'){const data=await this._request('select',{uri:value});if(epoch!==this._epoch)return;this._data=data;}
      if(this._playback&&this._playbackDraft){await this._playback.save({...this._playbackDraft});if(epoch!==this._epoch)return;}
      this._saving=false;this._dialog.close();
    } catch(error) { if(epoch===this._epoch)this._error=String(error?.message||error?.code||error); }
    finally { if(epoch===this._epoch){this._saving=false;this._render();} }
  }
  _render() {
    if(!this._dialog)return;
    const busy=this._loading||this._saving,selected=this._data?.selection;
    this.shadowRoot.getElementById('alarm-row').innerHTML=row({title:this._config.name||'Weckmusik',description:this._error||selected?.title||(this._loading?'Wird geladen …':'Letzte Sonos-Wiedergabe'),trailing:button({label:'Auswählen',action:'alarm-open',disabled:busy||!this._hass?.user?.id})});
    const items=(this._data?.songs||this._data?.favorites||[]).filter(f=>this._isChoice(f));
    // The list contains marked songs only. Keep an older saved selection in
    // the status text, without adding albums or removed songs to the list.
    this.shadowRoot.getElementById('alarm-content').innerHTML=
      (this._data?row({title:this._data.owner,description:this._data.source}):'')+
      (this._error?notice(this._error,{error:true})+button({label:'Erneut laden',action:'alarm-retry',disabled:busy}):'')+
      (busy?loadingState(this._saving?'Weckmusik wird gespeichert …':'Weckmusik wird geladen …'):'')+
      (this._data?`<div id="alarm-current">${selected?row({title:selected.title,description:'Gespeicherte Weckmusik',trailing:button({label:'Auswahl zurücksetzen',action:'alarm-clear',disabled:busy})}):notice('Ohne ausgewählte Weckmusik wird wie bisher die letzte Sonos-Wiedergabe fortgesetzt.')}</div>`+
        (this._playbackDraft?selectField({id:'alarm-playback-mode',label:'Weckmusik beenden',value:this._playbackDraft.mode,disabled:busy,options:[{value:'duration',label:'Nach einer festen Dauer'},{value:'track_end',label:'Wenn Titel endet'}]})+(this._playbackDraft.mode==='duration'?field({id:'alarm-playback-minutes',label:'Dauer in Minuten',type:'number',value:String(this._playbackDraft.minutes),min:1,max:1440,step:1,disabled:busy,required:true})+notice('Ist die Dauer länger als der Titel, wird er bis zum Ablauf wiederholt.'):notice('Der gewählte Titel wird einmal vollständig abgespielt. Für Live-Radio eine feste Dauer wählen.'))+button({label:'Dauer übernehmen',action:'alarm-playback-save',disabled:busy}):'')+
        (selected&&this._data.selection_compatible===false?notice('Die gespeicherte Weckmusik gehört nicht mehr zum zugeordneten Apple-Music-Konto. Bitte neu auswählen.',{error:true}):selected&&!(this._data.in_songs??this._data.in_favorites)?notice('Die bisherige Weckmusik bleibt gespeichert. Für eine neue Auswahl markiere einen einzelnen Titel oder Radiosender zum Wecken.'):!items.length?notice('Markiere zuerst einen einzelnen Titel oder Radiosender in Music Manager über das Weckersymbol.'):'')+
        field({id:'alarm-song-query',label:'Weckmusik suchen',type:'search',value:this._query||'',placeholder:'Titel oder Radiosender',maxLength:200,autocomplete:'off',disabled:busy})+
        '<div id="alarm-song-count" class="hint" aria-live="polite"></div><ul class="alarm-song-list" id="alarm-song-list" aria-label="Verfügbare Wecklieder"></ul>':'');
    this._renderChoices();
  }
  _renderChoices() {
    const list=this.shadowRoot.getElementById('alarm-song-list');if(!list)return;
    const songs=(this._data?.songs||this._data?.favorites||[]).filter(f=>this._isChoice(f));
    const query=(this._query||'').trim().toLocaleLowerCase(),items=songs.filter(f=>f.title.toLocaleLowerCase().includes(query));
    this.shadowRoot.getElementById('alarm-song-count').textContent=`${items.length} von ${songs.length} Weckinhalten · Antippen zum Auswählen`;
    list.setAttribute('aria-busy',String(this._loading||this._saving));
    list.innerHTML=items.map(song=>{
      const selected=song.uri===this._data.selection?.uri;
      return `<li>${button({label:song.title,action:'alarm-select',data:{uri:song.uri},disabled:this._loading||this._saving}).replace('<button ',`<button aria-pressed="${selected}" aria-label="${escapeHtml('Wecklied auswählen: '+song.title)}" `).replace(`<span>${escapeHtml(song.title)}</span>`,`<span class="alarm-choice-mark" aria-hidden="true">✓</span><span class="alarm-choice-name">${escapeHtml(song.title)}${song.kind==='radio'?'<small>Radiosender</small>':''}${selected?'<small>Ausgewählt</small>':''}</span>`)}</li>`;
    }).join('')||`<li>${notice('Keine passenden Wecklieder.')}</li>`;
  }
}
if(!customElements.get('music-manager-alarm-row'))customElements.define('music-manager-alarm-row',MusicManagerAlarmRow);
