import {selectField, statusBadge, notice, button, escapeHtml} from './family-ui/1.3.1/family-ui.js';
import {normalizeConfig, stationLogo, errorText} from './core.js';
import {MusicManagerCard, MusicManagerCardEditor} from './music-manager-card.js';

const BETA_CSS = `
  .beta-heading{display:flex;align-items:center;justify-content:space-between;gap:16px;min-width:0}
  .beta-box{width:220px;max-width:70%;min-width:0}.beta-box select{width:100%;min-width:0}
  .beta-fixed-box{min-width:0;overflow-wrap:anywhere;text-align:right;color:var(--secondary-text-color,#727272)}
  .beta-playing{display:grid;grid-template-columns:88px minmax(0,1fr);align-items:center;gap:16px;padding:8px 0 16px;border-bottom:1px solid var(--divider-color,#ddd)}
  .beta-art{position:relative;width:88px;height:88px;display:grid;place-items:center;overflow:hidden;border-radius:12px;background:var(--secondary-background-color,#f2f2f2);color:var(--primary-color,#03a9f4)}
  .beta-art img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.beta-art svg{width:44px;height:44px;fill:currentColor}
  .beta-navigation-status:empty{display:none}.beta-navigation-status{min-width:0}
  .music-transport{align-items:center;justify-content:center}.music-transport button{flex:0 1 64px;background:transparent;border-radius:50%}
  .music-transport [data-action="play-pause"]{height:56px;flex-basis:56px;background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff)}
  .music-transport [data-action="play-pause"]:hover:enabled{background:var(--primary-color,#03a9f4);filter:brightness(.95)}
  @media(max-width:360px){.beta-playing{grid-template-columns:72px minmax(0,1fr);gap:12px}.beta-art{width:72px;height:72px}}
`;

class MusicManagerBetaCard extends MusicManagerCard {
  static getConfigElement(){return document.createElement('music-manager-beta-card-editor');}
  static getStubConfig(hass){return {...super.getStubConfig(hass),type:'custom:music-manager-beta-card'};}
  setConfig(config){
    const next=normalizeConfig(config);
    if(config.navigation_id!==undefined&&(typeof config.navigation_id!=='string'||!/^[a-zA-Z0-9_-]{1,64}$/.test(config.navigation_id)))throw new Error('navigation_id: 1–64 Buchstaben, Zahlen, Unterstriche oder Bindestriche verwenden.');
    const changed=this._initialConfig?.entity!==next.entity||this._initialConfig?.navigation_id!==next.navigation_id;
    this._initialConfig=next;
    if(changed)this._resetNavigation();
    this._applyBox(changed?next.entity:(this._config?.entity||next.entity));this._loadNavigation();
  }
  _resetNavigation(){
    this._navigationRequest=(this._navigationRequest||0)+1;this._navigationReady=false;
    this._navigationLoading=false;this._navigationSaving=false;this._navigationError='';this._canSelectBox=false;this._boxes=[];
  }
  set hass(hass){
    const changed=this._navigationUser!==hass.user?.id||this._navigationConnection!==hass.connection;
    this._navigationTransition=changed;
    if(changed){this._resetNavigation();this._navigationUser=hass.user?.id;this._navigationConnection=hass.connection;}
    super.hass=hass;
    if(changed&&this._initialConfig)this._applyBox(this._initialConfig.entity);
    this._navigationTransition=false;this._loadNavigation();
  }
  connectedCallback(){super.connectedCallback();this._loadNavigation();}
  disconnectedCallback(){this._resetNavigation();super.disconnectedCallback();}
  _ensureDOM(){super._ensureDOM();if(!this.shadowRoot.getElementById('music-beta-style')){const style=document.createElement('style');style.id='music-beta-style';style.textContent=BETA_CSS;this.shadowRoot.append(style);}}
  _resolveApplePlayer(){if(!this._navigationTransition&&!this._navigationLoading)super._resolveApplePlayer();}
  _applyBox(entity){if(this._initialConfig)super.setConfig({...this._initialConfig,entity,music_assistant_entity:entity===this._initialConfig.entity?this._initialConfig.music_assistant_entity:''});}
  _navigationMessage(action,entity){return {type:'music_manager/player_navigation',action,source_entity:this._initialConfig.entity,...(this._initialConfig.navigation_id?{navigation_id:this._initialConfig.navigation_id}:{}),...(entity?{entity_id:entity}:{})};}
  _acceptNavigation(result){
    if(!result||typeof result.can_select!=='boolean'||!Array.isArray(result.players))throw new Error('Die Box-Auswahl ist nicht verfügbar. Bitte die Integration aktualisieren.');
    this._canSelectBox=result.can_select;
    this._boxes=result.players.filter(p=>/^media_player\.[a-z0-9_]+$/.test(p.entity_id||'')&&typeof p.name==='string');
    const selected=this._canSelectBox&&this._boxes.some(p=>p.entity_id===result.entity_id)?result.entity_id:this._initialConfig.entity;
    this._applyBox(selected);
  }
  async _loadNavigation(){
    if(!this.isConnected||!this._hass?.user?.id||!this._initialConfig||this._navigationReady||this._navigationLoading)return;
    const request=++this._navigationRequest,hass=this._hass;
    this._navigationLoading=true;this._navigationError='';this._renderPlayer();
    try{const result=await hass.callWS(this._navigationMessage('get'));if(request!==this._navigationRequest)return;this._acceptNavigation(result);this._navigationReady=true;}
    catch(error){if(request===this._navigationRequest){this._navigationError='Box-Auswahl: '+errorText(error);this._navigationReady=true;}}
    finally{if(request===this._navigationRequest){this._navigationLoading=false;this._renderPlayer();this._resolveApplePlayer();}}
  }
  async _selectBox(entity){
    if(!this._canSelectBox||!this._navigationReady||this._navigationLoading||this._navigationSaving||this._busy||!this._boxes.some(p=>p.entity_id===entity)||entity===this._config.entity)return;
    const request=++this._navigationRequest,hass=this._hass;
    this._navigationSaving=true;this._navigationError='';this._renderPlayer();
    try{const result=await hass.callWS(this._navigationMessage('select',entity));if(request===this._navigationRequest)this._acceptNavigation(result);}
    catch(error){if(request===this._navigationRequest)this._navigationError='Box-Auswahl wurde nicht gespeichert: '+errorText(error);}
    finally{if(request===this._navigationRequest){this._navigationSaving=false;this._renderPlayer();}}
  }
  _playerHeader({title,detail,attrs}){
    const current=this._config.entity,name=this._hass?.states?.[current]?.attributes?.friendly_name||current;
    const choices=(this._boxes||[]).map(p=>({value:p.entity_id,label:p.name+(p.available===false?' · Nicht erreichbar':'')}));
    if(!choices.some(p=>p.value===current))choices.unshift({value:current,label:name});
    const box=this._canSelectBox?`<div class="beta-box">${selectField({id:'music-beta-box',label:'Box',value:current,options:choices,disabled:this._busy||this._navigationLoading||this._navigationSaving}).replace('<select ', '<select aria-label="Box" ')}</div>`:`<div class="beta-fixed-box" aria-label="Box">${escapeHtml(name)}</div>`;
    const picture=stationLogo(attrs.entity_picture||this._selectedStation?.thumbnail);
    const art=(picture?`<img src="${escapeHtml(picture)}" alt="" referrerpolicy="no-referrer">`:'')+`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3v11.6a4 4 0 1 0 2 3.4V7h4V3h-6ZM8 6H2v2h6V6Zm0 5H2v2h6v-2Zm-2 5H2v2h4v-2Z"/></svg>`;
    return `<div class="beta-heading">${statusBadge({label:'Beta'})}${box}</div><div class="beta-playing"><div class="beta-art" aria-hidden="true">${art}</div><div class="music-now-playing"><h2 class="music-title">${escapeHtml(title)}</h2><div class="music-detail">${escapeHtml(detail)}</div></div></div><div class="beta-navigation-status" aria-live="polite">${this._navigationError?notice(this._navigationError,{error:true})+button({label:'Erneut laden',action:'beta-reload'}):this._navigationLoading?'<small>Persönliche Box wird geladen …</small>':this._navigationSaving?'<small>Box wird gespeichert …</small>':''}</div>`;
  }
  _renderPlayer(){
    if(this.shadowRoot?.activeElement?.id==='music-beta-box'&&!this._navigationTransition&&!this._navigationSaving){this._betaDeferred=true;return;}
    super._renderPlayer();
    const cover=this._player?.querySelector('.beta-art img');
    cover?.addEventListener('error',()=>cover.remove(),{once:true});
    const select=this.shadowRoot?.getElementById('music-beta-box');
    select?.addEventListener('change',()=>{void this._selectBox(select.value);});
    select?.addEventListener('blur',()=>{if(this._betaDeferred){this._betaDeferred=false;queueMicrotask(()=>this._renderPlayer());}});
    if(this._navigationLoading||this._navigationSaving)for(const control of this._player?.querySelectorAll('button,input,ha-control-slider')||[])control.disabled=true;
  }
  async _action(event){
    if(event.action==='beta-reload'){this._navigationReady=false;await this._loadNavigation();return;}
    if(this._navigationLoading||this._navigationSaving)return;
    await super._action(event);
  }
}
class MusicManagerBetaCardEditor extends MusicManagerCardEditor {
  _editorDescription(){return 'Beta: Die gewählte Sonos-Box ist die Ausgangsbox. Vera und Manuel können eine eigene Box wählen; die Auswahl wird je HA-Benutzer gespeichert. Weitere Benutzer verwenden die Ausgangsbox. Die Benutzer für die Box-Auswahl werden in der Music-Manager-Konfiguration verwaltet. Favoriten und Apple-Music-Konto bleiben persönlich. Die bestehende Karte bleibt unverändert verfügbar.';}
  _emit(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config,type:'custom:music-manager-beta-card'}},bubbles:true,composed:true}));}
}
if(!customElements.get('music-manager-beta-card'))customElements.define('music-manager-beta-card',MusicManagerBetaCard);
if(!customElements.get('music-manager-beta-card-editor'))customElements.define('music-manager-beta-card-editor',MusicManagerBetaCardEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='music-manager-beta-card'))window.customCards.push({type:'music-manager-beta-card',name:'Music Manager – Player Beta',description:'Experimenteller Musicplayer mit persönlicher Box-Auswahl. Bestehende Karte bleibt erhalten.',preview:true});
