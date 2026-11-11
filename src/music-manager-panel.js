import {UI_CSS, UI_VERSION, panelHeader, section, row, button, iconButton, field, selectField, dialog, notice, feedback, formError, emptyState, loadingState, busyButton, versionInfo, bindUI} from './family-ui/1.3.1/family-ui.js';

/** Configuration panel: all writes go through HA's existing validated options flows. */
class MusicManagerPanel extends HTMLElement {
  constructor() { super();this.attachShadow({mode:'open'});this._epoch=0;this._editorEpoch=0;this._data=null;this._error='';this._message=''; }
  set hass(hass) {
    const changed=this._hass?.user?.id!==hass.user?.id||this._hass?.user?.is_admin!==hass.user?.is_admin||this._hass?.connection!==hass.connection;
    if(changed){this._epoch++;this._cancelEditor();this._data=null;this._error='';this._message='';this._loading=false;}
    this._hass=hass;if(changed&&this.isConnected){this._ensure();this._load();}
  }
  connectedCallback() { this._ensure();this._unbind ||= bindUI(this.shadowRoot,event=>this._action(event));this._load(); }
  disconnectedCallback() { this._epoch++;this._cancelEditor();this._unbind?.();this._unbind=null;this._loading=false; }
  _ensure() {
    if(!this.shadowRoot.getElementById('configuration'))this.shadowRoot.innerHTML=`<style>${UI_CSS}:host{display:block;height:100%;overflow:auto;background:var(--primary-background-color,var(--secondary-background-color,#fafafa))}.configuration-shell{max-width:960px;margin:0 auto}.configuration-card{margin:16px 0}.configuration-fields{display:grid;grid-template-columns:minmax(0,1fr);gap:16px}.configuration-dialog{margin:24px auto auto;max-height:calc(100dvh - 48px)}</style><div id="configuration"></div><div id="configuration-editor"></div>`;
    this._render();
  }
  _render() {
    const host=this.shadowRoot.getElementById('configuration');if(!host)return;
    if(!this._hass?.user?.is_admin){host.innerHTML=feedback('Die Konfiguration ist nur für Administratoren verfügbar.',{kind:'error'});return;}
    const busy=this._loading||this._editorBusy||this._saving;
    let content=this._data?'':loadingState('Konfiguration wird geladen …');
    if(this._error)content+=feedback(this._error,{kind:'error'});
    if(this._message)content+=feedback(this._message,{kind:'success'});
    if(this._data){
      const {connection,accounts,alarms}=this._data;
      const edit=(action,id,label)=>iconButton({icon:'edit',label,action,data:{id},disabled:busy});
      const remove=(action,id,label)=>iconButton({icon:'trash',label,action,data:{id},disabled:busy,danger:true});
      content+=`<ha-card class="configuration-card"><main>`+
        section({id:'connection',title:'Music Assistant',content:row({title:connection.name||'Nur Radio',description:!connection.id?'Apple Music kann später verbunden werden.':connection.reachable?'Verbindung verfügbar':'Verbindung derzeit nicht erreichbar',trailing:edit('connect','','Verbindung bearbeiten')})})+
        section({id:'accounts',title:`Benutzerzuordnungen (${accounts.length})`,trailing:button({label:'Zuordnung',icon:'add',action:'add',disabled:busy}),content:accounts.length?accounts.map(a=>row({title:a.ha_name,description:`Music Assistant: ${a.ma_name} · Apple Music: ${a.provider_name}`,trailing:edit('edit',a.ha_user_id,`Zuordnung bearbeiten: ${a.ha_name}`)+remove('remove',a.ha_user_id,`Zuordnung entfernen: ${a.ha_name}`)})).join(''):emptyState('Noch keine Benutzer zugeordnet. Verbinde persönliche HA- und Apple-Music-Konten.')})+
        section({id:'alarms',title:`Wecker (${alarms.length})`,trailing:button({label:'Wecker',icon:'add',action:'alarm',disabled:busy||!accounts.length}),content:alarms.length?alarms.map(a=>row({title:`${a.owner_name} · ${a.alarm_id}`,description:`${a.source_name} · ${a.music_readable?(a.music_title||'Letzte Sonos-Wiedergabe'):'Weckmusik derzeit nicht lesbar'}`,trailing:edit('alarm_edit',a.alarm_id,`Wecker bearbeiten: ${a.alarm_id}`)+remove('alarm_remove',a.alarm_id,`Wecker entfernen: ${a.alarm_id}`)})).join(''):emptyState(accounts.length?'Noch keine Wecker zugeordnet.':'Ordne zuerst ein persönliches Apple-Music-Konto zu.')})+
        `</main></ha-card>`+versionInfo({frontend:MUSIC_VERSION,backend:this._data.version,ui:UI_VERSION});
    }
    host.innerHTML=panelHeader({title:'Music Manager',busy,save:false})+`<main class="configuration-shell">${content}</main>`;
  }
  async _load() {
    if(!this.isConnected||!this._hass?.user?.is_admin||this._loading)return;
    const epoch=++this._epoch;this._loading=true;this._error='';this._render();
    try{const data=await this._hass.callWS({type:'music_manager/configuration'});if(epoch===this._epoch)this._data=data;}
    catch{if(epoch===this._epoch)this._error='Die Konfiguration konnte nicht geladen werden. Bitte neu laden.';}
    finally{if(epoch===this._epoch){this._loading=false;this._render();}}
  }
  _text(part,key,fallback) { return this._hass?.localize?.(`component.music_manager.options.${part}.${key}`)||fallback; }
  _flowError(step) {
    const code=step.reason||step.errors?.base;
    return this._text(step.reason?'abort':'error',code,({invalid_alarm:'Weckerkennung, Benutzer, Apple-Music-Zuordnung und Boxfreigaben prüfen.',invalid_account:'Bitte gültige Konten aus den Listen wählen.',duplicate_account:'Dieses Konto ist bereits einem anderen Benutzer zugeordnet.',account_filter:'Im MA-Benutzer muss genau die zugehörige Apple-Music-Quelle freigegeben sein.',no_accounts:'Ordne zuerst ein persönliches Apple-Music-Konto zu.',cannot_connect:'Music Assistant ist nicht erreichbar oder darf keine Benutzer lesen.'})[code]||'Die Einstellung konnte nicht übernommen werden. Bitte Verbindung und Auswahl prüfen.');
  }
  _deleteFlow(flow) { if(flow?.id)flow.hass.callApi('DELETE',`config/config_entries/options/flow/${encodeURIComponent(flow.id)}`).catch(()=>{}); }
  _cancelEditor() {
    this._editorEpoch++;this._deleteFlow(this._flow);this._flow=null;this._editorBusy=false;this._saving=false;
    if(this._dialog?.open)this._dialog.close();
  }
  async _open(action,id='') {
    if(!this._data||this._editorBusy||this._saving)return;
    this._cancelEditor();const epoch=++this._editorEpoch,hass=this._hass;this._editorBusy=true;this._message='';this._render();
    this._makeDialog(action,loadingState('Einstellung wird geladen …'));
    let flow;
    try{
      let step=await hass.callApi('POST','config/config_entries/options/flow',{handler:this._data.entry_id});
      flow={id:step.flow_id,hass,action,target:id};
      if(epoch!==this._editorEpoch){this._deleteFlow(flow);return;}
      if(step.type!=='menu'||!step.menu_options?.includes(action))throw new Error('Unavailable action');
      this._flow=flow;
      step=await hass.callApi('POST',`config/config_entries/options/flow/${encodeURIComponent(flow.id)}`,{next_step_id:action});
      if(epoch!==this._editorEpoch)return;
      if((action==='edit'||action==='alarm_edit')&&step.type==='form')step=await hass.callApi('POST',`config/config_entries/options/flow/${encodeURIComponent(flow.id)}`,{[action==='edit'?'ha_user_id':'alarm_id']:id});
      if(epoch!==this._editorEpoch)return;
      this._editorBusy=false;this._acceptStep(step);
    }catch{if(epoch===this._editorEpoch){this._deleteFlow(flow);this._flow=null;this._editorBusy=false;this._dialog.querySelector('.modal-body').innerHTML=formError('Die Einstellung konnte nicht geladen werden. Bitte schließen und erneut versuchen.');}}
    finally{if(epoch===this._editorEpoch)this._render();}
  }
  _makeDialog(action,content) {
    const titles={connect:'Music Assistant verbinden',add:'Benutzer zuordnen',edit:'Benutzerzuordnung bearbeiten',remove:'Benutzerzuordnung entfernen',alarm:'Wecker zuordnen',alarm_edit:'Wecker bearbeiten',alarm_remove:'Wecker entfernen'};
    this.shadowRoot.getElementById('configuration-editor').innerHTML=dialog({id:'configuration-dialog',title:titles[action]||'Einstellung bearbeiten',content});
    this._dialog=this.shadowRoot.getElementById('configuration-dialog');this._dialog.classList.add('configuration-dialog');
    this._dialog.addEventListener('close',()=>{this._cancelEditor();this._render();this.shadowRoot.querySelector(`[data-action="${action}"]`)?.focus();});
    this._dialog.addEventListener('cancel',event=>{if(this._saving)event.preventDefault();});this._dialog.showModal();
  }
  _acceptStep(step,submitted={}) {
    if(step.type==='abort'){this._dialog.querySelector('.modal-body').innerHTML=formError(this._flowError(step));this._deleteFlow(this._flow);this._flow=null;return;}
    if(step.type!=='form')throw new Error('Unsupported options flow step');
    this._flow.step=step;this._draft={...submitted};
    const removing=['remove','alarm_remove'].includes(this._flow.action);
    const labels={ha_user_id:'Home-Assistant-Benutzer',ma_user_id:'Music-Assistant-Benutzer',provider_id:'Apple-Music-Konto',alarm_id:'Weckerkennung',source_entity:'Sonos-Box',music_assistant_entry:'Music-Assistant-Verbindung'};
    const fields=step.data_schema.map(item=>{
      const name=item.name,options=item.selector?.select?.options;
      const normalized=options?.map(o=>typeof o==='string'?{value:o,label:o}:o);
      const value=Object.hasOwn(submitted,name)?submitted[name]:Object.hasOwn(item,'default')?item.default:normalized?.[0]?.value||'';
      this._draft[name]=value;
      const label=this._text('step',`${step.step_id}.data.${name}`,labels[name]||name),id='config-'+name;
      if(removing)return '';
      return normalized?selectField({id,name,label,value,options:normalized,disabled:this._saving||(normalized.length===1&&['ha_user_id','alarm_id'].includes(name))}):field({id,name,label,value,required:!!item.required,maxLength:64,disabled:this._saving});
    }).join('');
    if(removing){const key=this._flow.action==='remove'?'ha_user_id':'alarm_id';this._draft[key]=this._flow.target;}
    const descriptions={connect:'Wähle die Music-Assistant-Verbindung. Bei einer anderen Verbindung oder Nur Radio werden die Apple-Music-Benutzerzuordnungen entfernt.',add:'Ordne einen HA-Benutzer seinem MA-Benutzer und persönlichen Apple-Music-Konto zu. In MA muss genau diese Musikquelle für den Benutzer freigegeben sein.',edit:'Die gespeicherten Konten sind vorausgefüllt. Der HA-Benutzer bleibt fest zugeordnet.',remove:'Der Benutzer verliert den Apple-Music-Zugang über Music Manager. Seine Radiofavoriten bleiben erhalten.',alarm:'Lege eine feste Kennung fest und wähle den Benutzer und seine Sonos-Box. Dieselbe Kennung gehört in die Weckerkarte und die Automation.',alarm_edit:'Benutzer und Sonos-Box sind vorausgefüllt. Die Weckerkennung bleibt erhalten.',alarm_remove:'Die Weckerzuordnung wird entfernt. Zugehörige Automationen können diese Kennung danach nicht mehr starten.'};
    const description=this._text('step',`${step.step_id}.description`,descriptions[this._flow.action]);
    const selected=removing?(this._flow.action==='remove'?this._data.accounts.find(a=>a.ha_user_id===this._flow.target)?.ha_name:this._flow.target):'';
    this._dialog.querySelector('.modal-body').innerHTML=(step.errors?.base?formError(this._flowError(step)):'')+notice(description)+(removing?row({title:selected||'Zuordnung entfernen'}):`<div class="configuration-fields">${fields}</div>`);
    this._dialog.querySelector('footer').innerHTML=button({label:'Abbrechen',action:'editor-cancel',disabled:this._saving})+busyButton({label:removing?'Entfernen':'Speichern',busy:this._saving,action:'editor-save',variant:removing?'danger':'primary'});
    this._dialog.querySelector('[data-ui="close-dialog"]').disabled=!!this._saving;
  }
  async _submit(confirmed=false) {
    if(!this._flow||this._saving)return;
    const flow=this._flow,step=flow.step,removing=['remove','alarm_remove'].includes(flow.action);
    if(!removing&&!confirmed)for(const item of step.data_schema){const input=this.shadowRoot.getElementById('config-'+item.name);if(!input?.reportValidity())return;this._draft[item.name]=input.value;}
    const submitted={...this._draft};
    if(flow.action==='connect'&&submitted.music_assistant_entry!==this._data.connection.id&&this._data.accounts.length&&!confirmed){
      this._dialog.querySelector('.modal-body').innerHTML=notice('Beim Wechsel der Music-Assistant-Verbindung werden alle Apple-Music-Benutzerzuordnungen entfernt. Sie müssen für die neue Verbindung erneut eingerichtet werden.');
      this._dialog.querySelector('footer').innerHTML=button({label:'Zurück',action:'editor-back'})+button({label:'Verbindung wechseln',action:'editor-confirm',variant:'danger'});return;
    }
    const epoch=this._editorEpoch;this._saving=true;this._render();this._acceptStep(step,submitted);
    try{
      const result=await flow.hass.callApi('POST',`config/config_entries/options/flow/${encodeURIComponent(flow.id)}`,submitted);
      if(epoch!==this._editorEpoch)return;
      if(result.type==='create_entry'){this._flow=null;this._saving=false;this._dialog.close();this._message=removing?'Zuordnung entfernt.':'Einstellung gespeichert.';await this._load();}
      else {this._saving=false;this._acceptStep(result,submitted);}
    }catch{if(epoch===this._editorEpoch){this._saving=false;this._acceptStep(step,submitted);this._dialog.querySelector('.modal-body').insertAdjacentHTML('afterbegin',formError('Speichern konnte nicht bestätigt werden. Lade die Übersicht neu, um den gespeicherten Stand zu prüfen.'));}}
    finally{if(epoch===this._editorEpoch)this._render();}
  }
  async _action({action,data}) {
    if(action==='menu'){this.dispatchEvent(new CustomEvent('hass-toggle-menu',{bubbles:true,composed:true}));return;}
    if(action==='reload'){await this._load();return;}
    if(action==='editor-cancel'){if(!this._saving)this._dialog.close();return;}
    if(action==='editor-save'){await this._submit();return;}
    if(action==='editor-confirm'){await this._submit(true);return;}
    if(action==='editor-back'){this._acceptStep(this._flow.step,this._draft);return;}
    if(['connect','add','edit','remove','alarm','alarm_edit','alarm_remove'].includes(action)){this._targetId=data.id||'';await this._open(action,this._targetId);}
  }
}
if(!customElements.get('music-manager-panel'))customElements.define('music-manager-panel',MusicManagerPanel);
