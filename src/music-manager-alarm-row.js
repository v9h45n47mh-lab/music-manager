import {UI_CSS, row, button, dialog, combobox, notice, loadingState, bindUI} from './family-ui/1.3.1/family-ui.js';

/** An entities-card row. The backend resolves the configured owner and box. */
class MusicManagerAlarmRow extends HTMLElement {
  constructor() { super();this.attachShadow({mode:'open'});this._epoch=0;this._data=null;this._error=''; }
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
  _reset() { this._epoch++;this._loading=false;this._saving=false;this._data=null;this._loadedKey=null;this._error='';this._dialog?.close(); }
  _ensure() {
    if(!this._config)return;
    if(!this._dialog){
      this.shadowRoot.innerHTML=`<style>${UI_CSS}:host{display:block;min-width:0}.alarm-row .setting-row{border:0;padding:0;min-height:48px}.alarm-row .row-text{min-width:0}.alarm-row .row-text small{overflow-wrap:anywhere}.alarm-browser{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;min-width:0}#alarm-dialog{margin:24px auto auto;max-height:calc(100dvh - 48px)}</style><div class="alarm-row" id="alarm-row"></div>${dialog({id:'alarm-dialog',title:'Weckmusik auswählen',content:'<div class="alarm-browser" id="alarm-content"></div>'})}`;
      this._dialog=this.shadowRoot.getElementById('alarm-dialog');
      this._dialog.addEventListener('close',()=>{this._epoch++;this._loading=false;this._saving=false;this._render();this.shadowRoot.querySelector('[data-action="alarm-open"]')?.focus();});
    }
    this._render();
  }
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
  async _action({action,value}) {
    if(action==='alarm-open'){
      this._dialog.showModal();await this._load(true);return;
    }
    if(action==='alarm-retry'){await this._load(true);return;}
    if(action!=='alarm-select'||this._saving||this._loading)return;
    const current=this._data;
    if(value!==''&&!current?.favorites?.some(f=>f.uri===value))return;
    const epoch=++this._epoch;this._saving=true;this._error='';this._render();
    try {
      const data=await this._request('select',{uri:value});if(epoch!==this._epoch)return;
      this._data=data;this._saving=false;this._dialog.close();
    } catch(error) { if(epoch===this._epoch)this._error=String(error?.message||error?.code||error); }
    finally { if(epoch===this._epoch){this._saving=false;this._render();} }
  }
  _render() {
    if(!this._dialog)return;
    const busy=this._loading||this._saving,selected=this._data?.selection;
    this.shadowRoot.getElementById('alarm-row').innerHTML=row({title:this._config.name||'Weckmusik',description:this._error||selected?.title||(this._loading?'Wird geladen …':'Letzte Sonos-Wiedergabe'),trailing:button({label:'Auswählen',action:'alarm-open',disabled:busy||!this._hass?.user?.id})});
    const items=[{value:'',label:'Letzte Sonos-Wiedergabe',description:'Wie bisher: letzte Wiedergabe auf dieser Box fortsetzen.'},...(this._data?.favorites||[]).map(f=>({value:f.uri,label:f.title,description:f.media_type==='album'?'Album':'Playlist'}))];
    // A removed favorite remains the saved alarm choice; do not silently
    // switch to another source or discard the selection when opening it.
    if(selected&&!items.some(i=>i.value===selected.uri))items.push({value:selected.uri,label:selected.title,description:'Gespeichert · nicht mehr in den Favoriten',disabled:true});
    this.shadowRoot.getElementById('alarm-content').innerHTML=
      (this._data?row({title:this._data.owner,description:this._data.source}):'')+
      (this._error?notice(this._error,{error:true})+button({label:'Erneut laden',action:'alarm-retry',disabled:busy}):'')+
      (busy?loadingState(this._saving?'Weckmusik wird gespeichert …':'Weckmusik wird geladen …'):'')+
      (this._data?combobox({id:'alarm-music',label:'Weckmusik',items,selected:selected?.uri||'',value:'',placeholder:selected?.title||'Album oder Playlist suchen …',action:'alarm-select',disabled:busy,emptyLabel:'Keine passenden Apple-Music-Favoriten.'})+
        (selected&&this._data.selection_compatible===false?notice('Die gespeicherte Weckmusik gehört nicht mehr zum zugeordneten Apple-Music-Konto. Bitte neu auswählen.',{error:true}):selected&&!this._data.in_favorites?notice('Die Auswahl bleibt als Weckmusik gespeichert, auch wenn sie nicht mehr favorisiert ist.'):!this._data.favorites?.length?notice('Favorisiere zuerst ein Album oder eine Playlist in Music Manager.'):''):'');
  }
}
if(!customElements.get('music-manager-alarm-row'))customElements.define('music-manager-alarm-row',MusicManagerAlarmRow);
