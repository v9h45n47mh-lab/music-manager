import {UI_CSS, MUSIC_PLAYER_CSS, musicPlayerHeader, musicTransport, musicFavoriteTile, musicActionButton, musicArtwork, notice, button, iconButton, field, section, row, dialog, loadingState, emptyState, versionInfo, UI_VERSION} from './family-ui/1.4.1/family-ui.js';
import {normalizeConfig, stationLogo, errorText, isAvailable, hasFeature, MUSIC_VERSION, sonosContentId, sonosPlaybackSource} from './core.js';
import {MusicManagerCard, MusicManagerCardEditor} from './music-manager-card.js';

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
    this._finishFavoritePointer?.();this._favoriteInteracting=false;this._playingFavorite=null;
    this._navigationRequest=(this._navigationRequest||0)+1;this._navigationReady=false;
    this._navigationLoading=false;this._navigationSaving=false;this._navigationError='';this._canSelectBox=false;this._boxes=[];
    this._showWakeSongs=false;this._backendVersion='';this._betaSongQuery='';this._settingsRenderKey='';this._settingsDialog?.close();this._dialog?.close();if(this._alarmSongUser)this._disconnectAlarmSongs();
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
  _ensureDOM(){
    super._ensureDOM();this.shadowRoot.querySelector('style').textContent=UI_CSS+'\n'+MUSIC_PLAYER_CSS;
    if(!this._favoritePointerBound){
      this._favoritePointerBound=true;
      this.shadowRoot.addEventListener('pointerdown',event=>{
        const control=event.target.closest?.('#music-favorites button');
        if(!control||control.disabled||event.button!==0)return;
        this._finishFavoritePointer?.();this._favoriteInteracting=true;
        const generation=this._favoritePointerGeneration=(this._favoritePointerGeneration||0)+1;
        const finish=()=>{
          window.removeEventListener('pointerup',finish);window.removeEventListener('pointercancel',finish);
          this._finishFavoritePointer=null;
          // Finish the native click before allowing metadata to move its target.
          setTimeout(()=>{if(generation!==this._favoritePointerGeneration)return;this._favoriteInteracting=false;if(this._favoriteDeferred&&this.isConnected){this._favoriteDeferred=false;this._renderPlayer();}},0);
        };
        this._finishFavoritePointer=finish;
        window.addEventListener('pointerup',finish);window.addEventListener('pointercancel',finish);
      });
    }
    if(!this._settingsDialog){const holder=document.createElement('div');holder.innerHTML=dialog({id:'music-beta-settings',title:'Einstellungen',content:'<div id="beta-settings-list" class="fui-player-settings-list"></div>'});this.shadowRoot.append(...holder.childNodes);this._settingsDialog=this.shadowRoot.getElementById('music-beta-settings');this._settingsDialog.addEventListener('close',()=>{const active=this.shadowRoot.activeElement;if(!active||this._settingsDialog.contains(active))this._player.querySelector('[data-action="beta-settings"]')?.focus();});}
  }
  _resolveApplePlayer(){if(!this._navigationTransition&&!this._navigationLoading)super._resolveApplePlayer();}
  _applyBox(entity){if(entity!==this._config?.entity)this._playingFavorite=null;if(this._initialConfig)super.setConfig({...this._initialConfig,entity,music_assistant_entity:entity===this._initialConfig.entity?this._initialConfig.music_assistant_entity:''});}
  _navigationMessage(action,entity){return {type:'music_manager/player_navigation',action,source_entity:this._initialConfig.entity,...(this._initialConfig.navigation_id?{navigation_id:this._initialConfig.navigation_id}:{}),...(entity?{entity_id:entity}:{})};}
  _acceptNavigation(result){
    if(!result||typeof result.can_select!=='boolean'||!Array.isArray(result.players))throw new Error('Die Box-Auswahl ist nicht verfügbar. Bitte die Integration aktualisieren.');
    this._canSelectBox=result.can_select;this._showWakeSongs=result.show_alarm_songs===true;this._backendVersion=typeof result.version==='string'?result.version:'';
    this._boxes=result.players.filter(p=>/^media_player\.[a-z0-9_]+$/.test(p.entity_id||'')&&typeof p.name==='string');
    const selected=this._canSelectBox&&this._boxes.some(p=>p.entity_id===result.entity_id)?result.entity_id:this._initialConfig.entity;
    this._applyBox(selected);this._connectAlarmSongs();
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

  _setPlayerMarkup(markup){
    const strip=this._player.querySelector('#music-favorites');
    if(!strip){super._setPlayerMarkup(markup);return;}
    const next=document.createElement('div');next.innerHTML=markup;
    const nextStrip=next.querySelector('#music-favorites');
    if(!nextStrip){super._setPlayerMarkup(markup);return;}
    const previous=new Map([...strip.children].map(button=>[button.dataset.favorite,button]));
    const wanted=[...nextStrip.children];
    for(let index=0;index<wanted.length;index++){
      const fresh=wanted[index],existing=previous.get(fresh.dataset.favorite);
      const control=existing||fresh;
      if(existing){
        if(existing.dataset.signature!==fresh.dataset.signature)existing.replaceChildren(...fresh.childNodes);
        for(const attr of [...existing.attributes])if(!fresh.hasAttribute(attr.name))existing.removeAttribute(attr.name);
        for(const attr of [...fresh.attributes])if(existing.getAttribute(attr.name)!==attr.value)existing.setAttribute(attr.name,attr.value);
        existing.disabled=fresh.disabled;
      }
      if(strip.children[index]!==control)strip.insertBefore(control,strip.children[index]||null);
      previous.delete(fresh.dataset.favorite);
    }
    for(const removed of previous.values())removed.remove();
    const before=[],after=[];let found=false;
    for(const node of [...next.childNodes]){if(node===nextStrip){found=true;continue;}(found?after:before).push(node);}
    for(const node of [...this._player.childNodes])if(node!==strip)node.remove();
    for(const node of before)this._player.insertBefore(node,strip);
    this._player.append(...after);
  }
  _musicButton(options){return musicActionButton(options);}
  _transportMarkup(controls,{radio}){return musicTransport({controls:radio?controls.filter(c=>!['previous','next'].includes(c.action)):controls});}
  _sourceActionMarkup(){return '';}
  _playbackStarted(item,source){this._playingFavorite={id:item.uri||item.media_content_id,source,queue:this._state?.attributes?.active_queue||''};}
  _activeFavoriteIds(){
    const state=this._state,ids=new Set();
    if(!['playing','buffering','paused'].includes(state?.state))return ids;
    if(this._isApplePlayback){
      ids.add(sonosContentId(state));
      const playing=this._playingFavorite;
      if(playing?.source==='apple'&&(!playing.queue||!state.attributes?.active_queue||playing.queue===state.attributes.active_queue))ids.add(playing.id);
      return ids;
    }
    if(this._playbackSource==='radio'&&this._selectedStation){ids.add(this._selectedStation.media_content_id);return ids;}
    const native=this._hass?.states?.[this._config.entity];
    if(sonosPlaybackSource(native)!=='radio')return ids;
    const id=sonosContentId(native);
    const exact=this._favorites.find(item=>item.kind!=='apple_music'&&item.media_content_id===id);
    if(exact){ids.add(exact.media_content_id);return ids;}
    const name=String(native.attributes?.media_channel||native.attributes?.media_title||'').trim().toLocaleLowerCase();
    if(name)for(const item of this._favorites)if(item.kind!=='apple_music'&&item.title.trim().toLocaleLowerCase()===name)ids.add(item.media_content_id);
    return ids;
  }
  _favoriteShortcutMarkup(){const active=this._activeFavoriteIds();return this._favorites.map((item,index)=>active.has(item.media_content_id)?'':musicFavoriteTile({label:item.title,data:{index,favorite:item.media_content_id,signature:JSON.stringify([item.title,stationLogo(item.thumbnail),item.kind||'radio'])},artwork:stationLogo(item.thumbnail),kind:item.kind==='apple_music'?'music':'radio',disabled:this._busy||(item.kind!=='apple_music'&&(!isAvailable(this._hass?.states?.[this._config.entity])||!hasFeature(this._hass?.states?.[this._config.entity],'playMedia')))})).join('');}
  get _volumeMax(){return 50;}
  _volumeMarkup(value,disabled){return super._volumeMarkup(Math.min(50,value),disabled);}
  _bindNativeVolume(value,disabled){super._bindNativeVolume(Math.min(50,value),disabled);}
  async _service(service,payload={},onSuccess,entityOverride){
    if(service==='volume_set'){if(!Number.isFinite(payload.volume_level))return false;payload={...payload,volume_level:Math.max(0,Math.min(.5,payload.volume_level))};}
    return super._service(service,payload,onSuccess,entityOverride);
  }
  _shortBoxName(name){return String(name||'').replace(/^Sonos\s+/i,'');}
  _boxName(entity=this._config?.entity){return this._shortBoxName(this._hass?.states?.[entity]?.attributes?.friendly_name||entity);}
  _playerHeader({title,detail,attrs,radio}){
    const current=this._config.entity,name=this._boxName(current);
    const choices=(this._boxes||[]).map(p=>({value:p.entity_id,label:this._shortBoxName(p.name)+(p.available===false?' · Nicht erreichbar':'')}));
    if(!choices.some(p=>p.value===current))choices.unshift({value:current,label:name});
    return musicPlayerHeader({title,description:detail,speaker:name,hideSpeaker:this._showWakeSongs||!this._navigationReady,speakerSelect:this._canSelectBox?{id:'music-beta-box',value:current,options:choices,compact:true,disabled:this._busy||this._navigationLoading||this._navigationSaving}:null,artwork:stationLogo(attrs.entity_picture||this._selectedStation?.thumbnail),radio,settingsAction:'beta-settings',disabled:this._busy||this._navigationLoading||this._navigationSaving})+
      `<div class="fui-player-navigation-status" aria-live="polite">${this._navigationError?notice(this._navigationError,{error:true})+button({label:'Erneut laden',action:'beta-reload'}):this._navigationLoading?loadingState('Persönliche Box wird geladen …'):this._navigationSaving?loadingState('Box wird gespeichert …'):''}</div>`;
  }
  _renderPlayer(){
    if(this._favoriteInteracting&&!this._navigationTransition){this._favoriteDeferred=true;return;}
    if(this.shadowRoot?.activeElement?.id==='music-beta-box'&&!this._navigationTransition&&!this._navigationSaving){this._betaDeferred=true;return;}
    if(this._editingVolume()){super._renderPlayer();return;}
    super._renderPlayer();
    this._boundCovers ||= new WeakSet();
    for(const cover of this._player?.querySelectorAll('.fui-music-artwork img')||[])if(!this._boundCovers.has(cover)){this._boundCovers.add(cover);cover.addEventListener('error',()=>cover.remove(),{once:true});}
    const select=this.shadowRoot?.getElementById('music-beta-box');
    select?.addEventListener('change',()=>{void this._selectBox(select.value);});
    select?.addEventListener('blur',()=>{if(this._betaDeferred){this._betaDeferred=false;queueMicrotask(()=>this._renderPlayer());}});
    if(this._navigationLoading||this._navigationSaving)for(const control of this._player?.querySelectorAll('button,input,ha-control-slider')||[])control.disabled=true;
    this._renderSettings();
  }
  _renderSettings(){
    if(!this._settingsDialog)return;
    const host=this.shadowRoot.getElementById('beta-settings-list'),speaker=this._boxName();
    const key=[this._hass?.user?.id,this._showWakeSongs,this._backendVersion,this._config?.entity,speaker].join(':');
    const busy=this._busy||this._navigationLoading||this._navigationSaving;
    if(key!==this._settingsRenderKey){
      this._settingsRenderKey=key;
      const items=[['Sender','open-radio','Sender wählen'],['Apple Music','open-apple','Apple Music öffnen'],[this._showWakeSongs?'Favoriten & Wecklieder':'Favoriten','manage-favorites',this._showWakeSongs?'Favoriten und Wecklieder verwalten':'Favoriten verwalten']];
      host.innerHTML=(this._showWakeSongs?row({title:'Box',description:speaker}):'')+items.map(([title,action,label])=>row({title,trailing:iconButton({icon:'right',label,action,disabled:busy})})).join('')+versionInfo({frontend:MUSIC_VERSION,backend:this._backendVersion,ui:UI_VERSION});
    }
    for(const button of host.querySelectorAll('button[data-action]'))button.disabled=busy;
  }
  _connectAlarmSongs(){
    if(this._showWakeSongs)super._connectAlarmSongs();else if(this._alarmSongUser)this._disconnectAlarmSongs();
  }
  async _toggleFavorite(item,enabled,alarmSong=false){if(alarmSong&&!this._showWakeSongs)return;return super._toggleFavorite(item,enabled,alarmSong);}
  _openAlarmSongs(){if(this._showWakeSongs)return super._action({action:'manage-favorites'});}
  _showAlarmSongs(){return this._openAlarmSongs();}
  _renderApple(){
    super._renderApple();if(!this._appleDialog)return;
    const enabled=this._showWakeSongs===true;
    this._appleDialog.querySelector('.music-manage-nav').innerHTML=button({label:enabled?'Favoriten & Wecklieder':'Favoriten',action:'manage-favorites',disabled:this._busy});
    const results=this.shadowRoot.getElementById('music-apple-results');results.classList.toggle('no-alarm-songs',!enabled);
    if(!enabled){
      for(const control of results.querySelectorAll('[data-action="apple-alarm-song"],[data-action="remove-alarm-song"]'))control.remove();
      if(this._appleParent){const description=this.shadowRoot.querySelector('#music-apple-location .row-text small');if(description)description.textContent='Einzelne Titel abspielen oder als Favorit speichern';}
    }
    if(this._showWakeSongs&&this._favoriteMode&&this._dialog?.open)this._renderBrowser();
  }
  _renderBrowser(){
    const active=this.shadowRoot.activeElement,searching=active?.id==='beta-wake-query',selection=searching?[active.selectionStart,active.selectionEnd]:null;
    super._renderBrowser();if(!this._dialog||!this._favoriteMode||!this._showWakeSongs)return;
    this.shadowRoot.getElementById('music-radio-dialog-title').textContent='Favoriten & Wecklieder';
    const results=this.shadowRoot.getElementById('music-radio-results');results.setAttribute('aria-label','Favoriten und Wecklieder verwalten');
    results.insertAdjacentHTML('beforeend',section({id:'beta-wake-group',title:`Wecklieder (${this._alarmSongs.length})`,content:`<div class="fui-player-song-tools">${field({id:'beta-wake-query',label:'Wecklieder durchsuchen',type:'search',value:this._betaSongQuery||'',placeholder:'Lied suchen',autocomplete:'off'})}${button({label:'Musik hinzufügen',action:'beta-add-songs',disabled:this._favoriteBusy||this._busy})}<div id="beta-wake-status" aria-live="polite"></div><div id="beta-wake-list" class="fui-player-song-list"></div></div>`}));
    const input=this.shadowRoot.getElementById('beta-wake-query');input.addEventListener('input',()=>{this._betaSongQuery=input.value;this._renderCombinedSongs();});this._renderCombinedSongs();
    if(searching){input.focus();input.setSelectionRange?.(...selection);}
  }
  _renderCombinedSongs(){
    const host=this.shadowRoot.getElementById('beta-wake-list');if(!host||!this._showWakeSongs)return;
    const status=this.shadowRoot.getElementById('beta-wake-status');
    status.innerHTML=this._alarmSongError?notice(this._alarmSongError,{error:true})+button({label:'Erneut laden',action:'reload-alarm-songs'}):this._alarmSongLoading?loadingState('Wecklieder werden geladen …'):this._appleError?notice(this._appleError,{error:true}):'';
    const query=(this._betaSongQuery||'').trim().toLocaleLowerCase(),items=this._alarmSongs.filter(item=>[item.title,item.description].join(' ').toLocaleLowerCase().includes(query));
    const disabled=this._favoriteBusy||this._busy||this._alarmSongLoading;
    host.innerHTML=items.map(item=>`<div class="music-station-row">${musicArtwork({src:stationLogo(item.thumbnail)})}${row({title:item.title,description:item.description||'',trailing:musicActionButton({label:'Wecklied abspielen: '+item.title,icon:'play',action:'beta-play-wake',data:{uri:item.uri},disabled})+iconButton({label:'Wecklied entfernen: '+item.title,icon:'trash',action:'remove-alarm-song',data:{uri:item.uri},danger:true,disabled})})}</div>`).join('')||(!this._alarmSongLoading?emptyState(query?'Keine passenden Wecklieder.':'Noch keine Wecklieder. In Apple Music kannst du einzelne Titel mit dem Weckersymbol markieren.'):'');
  }
  async _action(event){
    if(event.action==='beta-reload'){this._navigationReady=false;await this._loadNavigation();return;}
    if(this._navigationLoading||this._navigationSaving)return;
    if(event.action==='beta-settings'){this._renderSettings();if(!this._settingsDialog.open)this._settingsDialog.showModal();return;}
    const wakeActions=['open-alarm-songs','apple-songs','apple-alarm-song','remove-alarm-song','reload-alarm-songs','alarm-songs-add','beta-add-songs','beta-play-wake'];
    if(wakeActions.includes(event.action)&&!this._showWakeSongs)return;
    if(['open-alarm-songs','apple-songs'].includes(event.action)){await super._action({action:'manage-favorites'});return;}
    if(['beta-add-songs','alarm-songs-add'].includes(event.action)){this._dialog.close();await this._openApple();return;}
    if(event.action==='beta-play-wake'){const song=this._alarmSongs.find(item=>item.uri===event.data.uri);if(song)await this._playApple(song);return;}
    if(event.action==='play-favorite'&&event.data?.favorite){const index=this._favorites.findIndex(item=>item.media_content_id===event.data.favorite);if(index<0)return;event={...event,data:{...event.data,index:String(index)}};}
    await super._action(event);
  }
}
class MusicManagerBetaCardEditor extends MusicManagerCardEditor {
  _editorDescription(){return 'Die gewählte Sonos-Box ist die Ausgangsbox. Vera und Manuel können ihre Box persönlich wechseln. Weitere Benutzer bleiben auf der Ausgangsbox. Das Zahnrad öffnet Sender, Apple Music und Favoriten. Maximilian und Paul verwalten dort Favoriten und Wecklieder gemeinsam. Die Lautstärke der Karte ist auf 0–50 % begrenzt. Die bestehende Karte bleibt unverändert verfügbar.';}
  _emit(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config,type:'custom:music-manager-beta-card'}},bubbles:true,composed:true}));}
}
if(!customElements.get('music-manager-beta-card'))customElements.define('music-manager-beta-card',MusicManagerBetaCard);
if(!customElements.get('music-manager-beta-card-editor'))customElements.define('music-manager-beta-card-editor',MusicManagerBetaCardEditor);
window.customCards=window.customCards||[];
if(!window.customCards.some(card=>card.type==='music-manager-beta-card'))window.customCards.push({type:'music-manager-beta-card',name:'Music Manager – Player Beta',description:'Experimenteller Musicplayer mit persönlicher Box-Auswahl. Bestehende Karte bleibt erhalten.',preview:true});
