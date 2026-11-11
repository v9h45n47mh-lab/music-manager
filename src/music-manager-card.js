import {
  UI_CSS, UI_VERSION, row, button, iconButton, field, combobox,
  section, toggle, rangeControl, dialog, notice, versionInfo, emptyState,
  loadingState, bindUI, escapeHtml, programOrderButtons
} from './family-ui/1.2.2/family-ui.js';
import {
  MUSIC_VERSION, RADIO_ROOT, CONTROL_DEFAULTS, normalizeConfig, hasFeature,
  isAvailable, volumePercent, normalizeMedia, isRadioId, stationPayload,
  playbackAction, errorText, sonosOptions, musicAssistantOptions, FAVORITES_KEY, normalizeFavorites, stationLogo, saveFavorite,
  formatTime, playbackProgress, mediaIdentity, appleFavorite, moveFavorite
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
  .music-volume{min-width:0}
  .music-volume ha-control-slider{display:block;width:100%}
  .music-apple-playback{display:grid;gap:8px;min-width:0}
  .music-shuffle{display:flex;justify-content:flex-end}
  .music-shuffle button[aria-pressed="true"]{color:var(--primary-color,#03a9f4);background:color-mix(in srgb,var(--primary-color,#03a9f4) 14%,transparent)}
  .music-shuffle .music-icon{margin-inline-end:6px}
  .music-favorites:empty,#music-favorite-status:empty,#music-player-status:empty{display:none}
  .music-station-row [aria-pressed="false"] .music-icon{fill:none;stroke:currentColor;stroke-width:1.7}
  .music-favorites{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:12px;min-width:0}
  .music-favorite{display:grid;gap:6px;align-content:start;justify-items:center;min-width:0;min-height:80px;padding:8px;border-radius:12px;background:var(--secondary-background-color,#f2f2f2)}
  .music-favorite span{max-width:100%;overflow-wrap:anywhere}
  .music-station-logo{position:relative;display:grid;place-items:center;width:48px;height:48px;flex-shrink:0;border-radius:8px;background:var(--card-background-color,#fff);color:var(--secondary-text-color,#727272);overflow:hidden}
  .music-station-logo img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:var(--card-background-color,#fff)}
  .music-station-row{display:flex;align-items:center;gap:12px;min-width:0}
  .music-station-row>.setting-row{flex:1;min-width:0}
  .music-favorite-actions{display:flex;align-items:center;gap:4px;flex-wrap:nowrap}
  .music-apple-logo{display:block;width:48px;height:48px;flex-shrink:0;border-radius:10px}
  .music-apple-results .setting-row{min-width:0}
  .music-results{max-height:50dvh;overflow:auto;overscroll-behavior:contain}
`;
const APPLE_MUSIC_LOGO = `<svg class="music-apple-logo" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="apple-music-gradient" x2="0" y2="1"><stop stop-color="#fa586a"/><stop offset="1" stop-color="#e82948"/></linearGradient></defs><rect width="48" height="48" rx="10" fill="url(#apple-music-gradient)"/><path fill="#fff" d="M33.7 9.1 20.2 12c-.8.2-1.2.7-1.2 1.5v19.1c-1.1-.6-2.6-.5-4 .1-2.3.8-3.7 2.7-3.2 4.3.5 1.6 2.7 2.2 5 1.4 2.1-.7 3.6-2.3 3.6-4V20.1l12.1-2.6v11.6c-1.1-.5-2.5-.4-3.9.1-2.3.8-3.8 2.7-3.2 4.3.5 1.6 2.7 2.2 5 1.4 2.2-.8 3.6-2.4 3.6-4V10.2c0-.8-.3-1.2-.9-1.1Z"/></svg>`;
const APPLE_SETUP = 'Für Apple Music: Music Manager im Marketplace als Integration installieren und unter Geräte & Dienste → Music Manager → Konfigurieren Music Assistant und deinen HA-Benutzer zuordnen. Die jeweilige Sonos-Box wird automatisch in Music Assistant gefunden. Alle gewünschten Boxen müssen dort über den Sonos-Player-Anbieter eingerichtet und für deinen Benutzer freigegeben sein.';
const MUSIC_ICONS = {
  previous:'M6 5h2v14H6zM18 5v14l-9-7z',next:'M16 5h2v14h-2zM6 5l9 7-9 7z',
  play:'M8 5v14l11-7z',pause:'M6 5h4v14H6zM14 5h4v14h-4z',stop:'M6 6h12v12H6z',
  star:'m12 2.5 2.9 5.9 6.5 1-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-1z',
  radio:'M4 7h16v13H4zM6 3l13-2v2L6 5zM6 9v3h12V9zM7 14h5v4H7zM15 14h3v2h-3z',
  shuffle:'m16 3 5 4-5 4V8h-2l-4 5-4 5H3v-2h2l4-5 4-5h3V3ZM3 6h3l3 4-1.3 1.6L5 8H3V6Zm9 7.4 2 2.6h2v-3l5 4-5 4v-3h-3l-2.3-3 1.3-1.6Z'
};
const musicIcon = name => `<svg class="music-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${MUSIC_ICONS[name]}"></path></svg>`;
function musicButton({label,action,icon,disabled=false,data={},pressed}) {
  return button({label,action,disabled,data}).replace('<button ',`<button aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"${pressed===undefined?'':` aria-pressed="${pressed}"`} `).replace(`<span>${escapeHtml(label)}</span>`,musicIcon(icon));
}
function logoMarkup(station) {
  const src=stationLogo(station.thumbnail);
  return `<span class="music-station-logo" aria-hidden="true">${station.kind==='apple_music'?APPLE_MUSIC_LOGO:musicIcon('radio')}${src?`<img src="${escapeHtml(src)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}</span>`;
}

class MusicManagerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this._favorites = [];
    this._favoriteMode = false;
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
    this._volumeInteracting = false;
    this._appleRequest=0;this._appleItems=[];this._appleAccount='';this._appleError='';
    this._appleLoading=false;this._appleView='playlist';this._appleMore=false;
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
    const changed = this._config?.entity !== next.entity || this._config?.music_assistant_entity !== next.music_assistant_entity;
    this._config = next;
    if (changed) {
      this._playbackSource=null;this._radioSnapshot=null;this._cancelSeek();
      this._epoch++;
      this._request++;
      this._busy = false;
      this._error = '';
      this._selectedStation = null;
      this._dialog?.close();
      this._resetApple();
    }
    this._ensureDOM();
    this._loadNativeVolume();
    this._renderPlayer();
    this._resolveApplePlayer();
  }

  set hass(hass) {
    const previous = this._state;
    const userChanged=this._hass && (this._hass.user?.id!==hass.user?.id || this._hass.connection!==hass.connection);
    this._hass = hass;
    if (!this._config) return;
    this._ensureDOM();
    if(userChanged){this._epoch++;this._busy=false;this._playbackSource=null;this._selectedStation=null;this._radioSnapshot=null;this._cancelSeek();this._resetApple();}
    if(mediaIdentity(previous)!==mediaIdentity(this._state))this._cancelSeek();
    if(this._hass.states?.[this._musicAssistantEntity]?.attributes?.active_queue)this._applePreferred=false;
    this._connectFavorites();
    this._loadNativeVolume();
    if (previous !== this._state || !this._player.firstChild) this._renderPlayer();
    this._resolveApplePlayer();
  }
  get _controlEntity() {
    if(this._playbackSource==='radio')return this._config?.entity;
    const entity=this._musicAssistantEntity, state=this._hass?.states?.[entity];
    return isAvailable(state) && (state.attributes?.active_queue || this._applePreferred) ? entity : this._config?.entity;
  }
  get _musicAssistantEntity() { return this._appleEntity || this._config?.music_assistant_entity; }
  get _state() { return this._hass?.states?.[this._controlEntity]; }

  connectedCallback() { this._ensureDOM(); this._bind(); this._connectFavorites(); this._loadNativeVolume(); this._renderPlayer(); this._resolveApplePlayer(); }
  disconnectedCallback() {
    clearTimeout(this._progressTimer);this._cancelSeek();
    this._unbind?.(); this._unbind = null;
    this._disconnectFavorites();
    this._volumeInteracting=false;
    this._nativeVolumeLoader?.remove();
    this._request++;
    this._epoch++;
    this._busy = false;
    this._browseLoading = false;
    this._dialog?.close();
    this._resetApple();
    this._appleResolution=null;
  }

  _ensureDOM() {
    if (this._player) return;
    this.shadowRoot.innerHTML = `<style>${UI_CSS}\n${MUSIC_CSS}</style><ha-card>
      <main><div id="player" class="music-stack"></div></main></ha-card>
      ${dialog({id:'music-radio-dialog',title:'Radio Browser',content:`<div class="music-browser">
        <form id="music-search-form" class="music-browser">
          <div id="search-field">${field({id:'music-radio-query',label:'Sender suchen',type:'search',placeholder:'z. B. SWR3 oder Rock',maxLength:200,autocomplete:'off'})}</div>
          <div class="toolbar">${button({label:'Suchen',action:'search',variant:'primary'})}${button({label:'Beliebt',action:'popular'})}${button({label:'Deutschland',action:'germany'})}${button({label:'Kategorien',action:'root'})}${button({label:'Favoriten verwalten',action:'manage-favorites'})}</div>
        </form>
        <div id="music-radio-status" aria-live="polite"></div>
        <div id="music-radio-path"></div>
        <div id="music-radio-results" class="music-results" aria-label="Radiosender und Kategorien"></div>
      </div>`})}
      ${dialog({id:'music-apple-dialog',title:'Apple Music',content:`<div class="music-browser">
        <div id="music-apple-account"></div>
        <form id="music-apple-search-form" class="music-browser">
          ${field({id:'music-apple-query',label:'Apple Music durchsuchen',type:'search',placeholder:'Titel, Album oder Playlist',maxLength:200,autocomplete:'off'})}
          <div class="toolbar">${button({label:'Suchen',action:'apple-search',variant:'primary'})}${button({label:'Playlists',action:'apple-library',data:{view:'playlist'}})}${button({label:'Alben',action:'apple-library',data:{view:'album'}})}${button({label:'Titel',action:'apple-library',data:{view:'track'}})}${button({label:'Favoriten verwalten',action:'manage-favorites'})}</div>
        </form>
        <div id="music-apple-status" aria-live="polite"></div>
        <div id="music-apple-results" class="music-results music-apple-results" aria-label="Apple-Music-Einträge"></div>
        <div id="music-apple-more"></div>
      </div>`})}`;
    this._player = this.shadowRoot.getElementById('player');
    this._dialog = this.shadowRoot.getElementById('music-radio-dialog');
    this._searchInput = this.shadowRoot.getElementById('music-radio-query');
    this._appleDialog=this.shadowRoot.getElementById('music-apple-dialog');
    this._appleQuery=this.shadowRoot.getElementById('music-apple-query');
    this.shadowRoot.getElementById('music-apple-search-form').addEventListener('submit',event=>{event.preventDefault();void this._loadApple('search');});
    this._appleDialog.addEventListener('close',()=>{
      this._appleRequest++;this._appleLoading=false;
      const active=this.shadowRoot.activeElement;
      if(!active || this._appleDialog.contains(active))this._player.querySelector('[data-action="open-apple"]')?.focus();
    });
    this.shadowRoot.addEventListener('change',event=>{
      const input=event.target;
      if(!input.matches?.('input[data-managed-favorite-id]') || input.checked || input.disabled)return;
      const station=this._favorites.find(s=>s.media_content_id===input.dataset.managedFavoriteId);
      if(!station)return;
      this._pendingFavoriteFocus={id:station.media_content_id,index:this._favorites.indexOf(station)};
      void this._toggleFavorite(station,false);
    });
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
    this._player.addEventListener('focusout',event=>{
      // A button receiving focus is still between pointerdown and click.
      // Keep it in place when leaving the timeline so its click is delivered.
      if(event.target.id==='music-seek'&&event.relatedTarget?.closest('button')&&this._player.contains(event.relatedTarget))return;
      queueMicrotask(()=>{if(this._deferredPlayer && !this._editingVolume())this._renderPlayer();});
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
    this._favoriteRemovingId=null;this._pendingFavoriteFocus=null;
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
    this._renderPlayer();if(this._dialog.open)this._renderBrowser();
    if(!user)return;
    const apply=response=>{
      if(epoch!==this._favoriteEpoch)return;
      this._favorites=normalizeFavorites(response?.value);
      this._favoriteLoading=false;this._favoriteError='';
      this._renderPlayer();if(this._dialog.open)this._renderBrowser();if(this._appleDialog.open)this._renderApple();
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

  async _toggleFavorite(station,enabled) {
    if(this._favoriteBusy || this._favoriteLoading || !station?.can_play)return;
    const epoch=this._favoriteEpoch, hass=this._hass;
    enabled??=!this._favorites.some(s=>s.media_content_id===station.media_content_id);
    this._favoriteRemovingId=enabled?null:station.media_content_id;
    this._favoriteBusy=true;this._favoriteError='';this._renderBrowser();this._renderApple();
    try {
      const favorites=await saveFavorite(hass,station,enabled);
      if(epoch===this._favoriteEpoch)this._favorites=favorites;
    } catch(error) {
      if(epoch===this._favoriteEpoch)this._favoriteError='Favoriten konnten nicht gespeichert werden: '+errorText(error);
    } finally {
      if(epoch===this._favoriteEpoch){this._favoriteBusy=false;this._favoriteRemovingId=null;this._renderPlayer();this._renderBrowser();this._renderApple();}
    }
  }

  async _moveFavorite(id,direction) {
    if(this._favoriteBusy||this._favoriteLoading)return;
    const epoch=this._favoriteEpoch;
    this._favoriteBusy=true;this._favoriteError='';this._renderBrowser();
    try {
      const favorites=await moveFavorite(this._hass,id,direction);
      if(epoch===this._favoriteEpoch)this._favorites=favorites;
    } catch(error) {
      if(epoch===this._favoriteEpoch)this._favoriteError='Favoriten konnten nicht sortiert werden: '+errorText(error);
    } finally {
      if(epoch===this._favoriteEpoch){
        this._favoriteBusy=false;this._pendingFavoriteFocus={id,direction};
        this._renderPlayer();this._renderBrowser();
      }
    }
  }

  _editingVolume() {
    const active=this.shadowRoot.activeElement;
    return this._volumeInteracting || this._seekInteracting || this._player?.querySelector('ha-control-slider')?.pressed || Boolean(active && this._player?.contains(active) &&
      (active.type==='range' || active.localName==='ha-control-slider'));
  }

  async _loadNativeVolume() {
    if(!this.isConnected || !this._hass || !this._config?.controls.volume)return;
    if(customElements.get('ha-control-slider')){
      if(this.shadowRoot.getElementById('music-volume')?.localName!=='ha-control-slider')this._renderPlayer();
      return;
    }
    if(this._nativeVolumeRequested || !window.loadCardHelpers)return;
    this._nativeVolumeRequested=true;
    let timer;
    try {
      // Ask HA's own card loader to register its volume feature and slider.
      // The hidden tile only loads frontend code; it sends no player commands.
      const helpers=await window.loadCardHelpers();
      if(!this.isConnected)return;
      if(!customElements.get('ha-control-slider')) {
        const loader=helpers.createCardElement({type:'tile',entity:this._config.entity,features:[{type:'media-player-volume-slider',show_mute_button:false}]});
        loader.hidden=true;loader.setAttribute('aria-hidden','true');loader.hass=this._hass;
        this._nativeVolumeLoader=loader;this.shadowRoot.append(loader);
        await Promise.race([customElements.whenDefined('ha-control-slider'),new Promise(resolve=>{timer=setTimeout(resolve,8000);})]);
      }
      if(this.isConnected)this._renderPlayer();
    } catch {
      // The standard UI Kit range remains fully usable while HA loads.
    } finally {
      clearTimeout(timer);this._nativeVolumeLoader?.remove();this._nativeVolumeLoader=null;
    }
  }

  _volumeMarkup(value,disabled) {
    return customElements.get('ha-control-slider')
      ? `<ha-control-slider id="music-volume" min="0" max="100" step="1" value="${value}" label="Lautstärke" unit="%" show-handle tooltip-mode="interaction"${disabled?' disabled':''}></ha-control-slider>`
      : rangeControl({id:'music-volume',label:'Lautstärke',value,action:'volume',allowKeep:false,disabled});
  }

  _bindNativeVolume(value,disabled) {
    const slider=this.shadowRoot.getElementById('music-volume');
    if(slider?.localName!=='ha-control-slider')return;
    Object.assign(slider,{value,min:0,max:100,step:1,unit:'%',label:'Lautstärke',
      locale:this._hass?.locale,showHandle:true,tooltipMode:'interaction',disabled});
    slider.addEventListener('slider-moved',event=>{
      event.stopPropagation();
      if(slider!==this.shadowRoot.getElementById('music-volume'))return;
      if(Number.isFinite(event.detail?.value))this._volumeInteracting=true;
      else queueMicrotask(()=>{this._volumeInteracting=false;if(this._deferredPlayer&&!this._editingVolume())this._renderPlayer();});
    });
    slider.addEventListener('value-changed',event=>{
      event.stopPropagation();
      if(slider!==this.shadowRoot.getElementById('music-volume'))return;
      this._volumeInteracting=false;
      const value=event.detail?.value;
      if(!slider.disabled && Number.isFinite(value))void this._action({action:'volume',phase:'change',value});
    });
  }

  get _isApplePlayback() { return Boolean(this._musicAssistantEntity && this._controlEntity===this._musicAssistantEntity); }

  _cancelSeek() {
    this._seekInteracting=false;this._seekSnapshot=null;this._seekPending=null;
    if(this.shadowRoot?.activeElement?.id==='music-seek')this.shadowRoot.activeElement.blur();
  }

  _updateProgress(position) {
    const slider=this.shadowRoot.getElementById('music-seek');
    const progress=this._isApplePlayback?playbackProgress(this._state):null;
    if(!slider||!progress)return;
    if(position===undefined&&this._seekInteracting)return;
    const anchor=JSON.stringify([this._state.attributes.media_position,this._state.attributes.media_position_updated_at]);
    if(this._seekPending){
      if(this._seekPending.anchor!==anchor || Date.now()-this._seekPending.at>10000)this._seekPending=null;
      else if(position===undefined)position=this._seekPending.position+(this._state.state==='playing'?(Date.now()-this._seekPending.at)/1000:0);
    }
    const current=Math.max(0,Math.min(progress.duration,position??progress.position));
    slider.value=String(Math.round(current));
    const text=formatTime(current)+' / '+formatTime(progress.duration);
    slider.setAttribute('aria-valuetext',text);
    const control=slider.closest('[data-ui-range]');
    control.querySelector('output').textContent=text;
    slider.style.setProperty('--range-percent',String(current/progress.duration*100)+'%');
  }

  _scheduleProgress() {
    clearTimeout(this._progressTimer);
    if(!this.isConnected||!this._isApplePlayback||this._state?.state!=='playing'||!playbackProgress(this._state))return;
    this._progressTimer=setTimeout(()=>{this._updateProgress();this._scheduleProgress();},1000);
  }

  async _seek(value,phase) {
    if(!this._isApplePlayback||!hasFeature(this._state,'seek')||!Number.isFinite(value))return;
    const progress=playbackProgress(this._state);
    if(!progress||this._busy)return;
    const current={entity:this._controlEntity,track:mediaIdentity(this._state),epoch:this._epoch};
    this._seekSnapshot ||= current;
    if(phase==='input'){this._seekInteracting=true;this._updateProgress(value);return;}
    if(phase!=='change')return;
    const captured=this._seekSnapshot;
    this._seekSnapshot=null;this._seekInteracting=false;
    if(Object.keys(current).some(key=>current[key]!==captured[key]))return;
    const position=Math.round(Math.max(0,Math.min(progress.duration,value)));
    this._seekPending={position,at:Date.now(),anchor:JSON.stringify([this._state.attributes.media_position,this._state.attributes.media_position_updated_at])};
    const ok=await this._service('media_seek',{seek_position:position},undefined,current.entity);
    if(this._epoch!==current.epoch||mediaIdentity(this._state)!==current.track)return;
    if(!ok)this._seekPending=null;
    this._updateProgress(ok?position:undefined);
    const status=this.shadowRoot.getElementById('music-player-status');
    if(status)status.innerHTML=this._error?notice(this._error,{error:true}):'';
  }

  _renderPlayer() {
    if (!this._player || !this._config) return;
    // HA state updates must not replace an input while the user drags it.
    const active = this.shadowRoot.activeElement;
    if (this._editingVolume()) { this._deferredPlayer=true;return; }
    this._deferredPlayer=false;
    const focusedAction = this._player.contains(active) ? active?.dataset?.action : null;
    const state=this._state, attrs=state?.attributes || {}, controls=this._config.controls;
    const available=isAvailable(state), disabled=!available || this._busy;
    const action=playbackAction(state,this._selectedStation);
    const playing=['playing','buffering'].includes(state?.state);
    const playbackLabel=playing ? (action==='media_stop'?'Stop':'Pause') : 'Play';
    const stateLabel={playing:'Wiedergabe',paused:'Pausiert',idle:'Bereit',off:'Aus',buffering:'Wird geladen',unavailable:'Nicht erreichbar',unknown:'Status unbekannt'}[state?.state] || 'Nicht gefunden';
    const radio=this._playbackSource==='radio' && this._selectedStation;
    const radioFresh=!this._radioSnapshot || mediaIdentity(state)!==this._radioSnapshot;
    const title=radio?((radioFresh&&attrs.media_channel) || this._selectedStation.title):(attrs.media_title || attrs.media_channel || 'Keine Wiedergabe');
    const detail=radio?['Radio',radioFresh&&attrs.media_title!==title?attrs.media_title:'',stateLabel].filter(Boolean).join(' · '):[attrs.media_artist || attrs.media_album_name, attrs.media_channel && attrs.media_channel!==title ? attrs.media_channel : '', stateLabel].filter(Boolean).join(' · ');
    const apple=this._isApplePlayback,progress=apple?playbackProgress(state):null;
    const transport=[];
    if (controls.previous) transport.push(musicButton({label:'Zurück',icon:'previous',action:'previous',disabled:disabled||!hasFeature(state,'previous')}));
    if (controls.play_pause) transport.push(musicButton({label:playbackLabel,icon:playing?(action==='media_stop'?'stop':'pause'):'play',action:'play-pause',disabled:disabled||!action}));
    if (controls.stop) transport.push(musicButton({label:'Stop',icon:'stop',action:'stop',disabled:disabled||!hasFeature(state,'stop')}));
    if (controls.next) transport.push(musicButton({label:'Weiter',icon:'next',action:'next',disabled:disabled||!hasFeature(state,'next')}));
    const vol=attrs.is_volume_muted?0:volumePercent(attrs.volume_level);
    this._player.innerHTML = `
      <div class="music-box">${row({title:this._hass?.states?.[this._config.entity]?.attributes?.friendly_name || this._config.entity})}</div>
      ${row({title,description:detail})}
      ${!state ? notice('Die konfigurierte Sonos-Box wurde nicht gefunden. Bitte prüfe die Entität im Karteneditor.',{error:true}) : !available ? notice('Die Sonos-Box ist momentan nicht erreichbar.') : ''}
      <div class="music-controls">
        ${transport.length ? `<div class="music-transport" aria-label="Wiedergabe">${transport.join('')}</div>` : ''}
        ${apple?`<div class="music-apple-playback">
          ${progress?rangeControl({id:'music-seek',label:'Titelposition',value:Math.round(progress.position),min:0,max:progress.duration,step:1,unit:'',action:'seek',allowKeep:false,disabled:disabled||!hasFeature(state,'seek')}):''}
          ${hasFeature(state,'shuffle')?`<div class="music-shuffle">${button({label:'Shuffle',action:'shuffle',disabled}).replace('<button ',`<button aria-label="${attrs.shuffle?'Shuffle ausschalten':'Shuffle einschalten'}" aria-pressed="${Boolean(attrs.shuffle)}" `).replace('<span>',musicIcon('shuffle')+'<span>')}</div>`:''}
        </div>`:''}
        ${controls.volume ? `<div class="music-volume">${this._volumeMarkup(vol??0,disabled||vol===null||!hasFeature(state,'volume'))}</div>` : ''}
      </div>
      <div id="music-favorites" class="music-favorites" aria-label="Persönliche Favoriten">${this._favorites.map((station,index)=>button({label:station.title,action:'play-favorite',data:{index},disabled:this._busy||(station.kind!=='apple_music'&&(!isAvailable(this._hass?.states?.[this._config.entity])||!hasFeature(this._hass?.states?.[this._config.entity],'playMedia')))}).replace('class=""','class="music-favorite"').replace('<button ',`<button aria-label="${escapeHtml(station.title+' abspielen')}" `).replace('<span>',logoMarkup(station)+'<span>')).join('')}</div>
      <div class="toolbar">${button({label:'Sender wählen',action:'open-radio',disabled:this._busy})}${button({label:'Apple Music',action:'open-apple',disabled:this._busy})}${button({label:'Favoriten',action:'manage-favorites',disabled:this._busy})}</div>
      <div id="music-favorite-status" aria-live="polite">${this._favoriteError?notice(this._favoriteError,{error:true})+button({label:'Favoriten neu laden',action:'reload-favorites'}):this._favoriteLoading?loadingState('Favoriten werden geladen …'):!this._favorites.length?notice('Sender, Alben und Playlists über den Stern zu deinen Favoriten hinzufügen.'):''}</div>
      <div id="music-player-status" aria-live="polite">${this._error ? notice(this._error,{error:true}) : this._busy ? loadingState(this._pendingService==='media_next_track'?'Nächster Titel wird geladen …':'Befehl wird gesendet …') : ''}</div>`;
    this._bindNativeVolume(vol??0,disabled||vol===null||!hasFeature(state,'volume'));
    this._updateProgress();this._scheduleProgress();
    // The shared range initializes after DOM replacement; then restore the
    // timeline's clock formatting without changing the shared component.
    queueMicrotask(()=>this._updateProgress(this._seekInteracting?Number(this.shadowRoot.getElementById('music-seek')?.value):undefined));
    if (focusedAction) this._player.querySelector(`[data-action="${focusedAction}"]`)?.focus();
  }

  async _action({action,data,value,phase,checked}) {
    switch(action) {
      case 'seek': await this._seek(value,phase);break;
      case 'shuffle': if(this._isApplePlayback&&hasFeature(this._state,'shuffle'))await this._service('shuffle_set',{shuffle:!Boolean(this._state.attributes?.shuffle)});break;
      case 'open-apple': await this._openApple();break;
      case 'apple-search': await this._loadApple('search');break;
      case 'apple-library': this._appleView=data.view;await this._loadApple('library');break;
      case 'apple-more': await this._loadApple('library',true);break;
      case 'apple-play': await this._playApple(this._appleItems[Number(data.index)]);break;
      case 'apple-favorite': {const item=appleFavorite(this._appleItems[Number(data.index)]);if(item)await this._toggleFavorite(item);break;}
      case 'move-favorite': await this._moveFavorite(data.program,data.direction);break;
      case 'manage-favorites':
        this._appleDialog.close();this._request++;this._browseLoading=false;this._favoriteMode=true;this._radioError='';this._error='';
        if(!this._dialog.open)this._dialog.showModal();this._renderBrowser();break;
      case 'reload-favorites': this._disconnectFavorites();this._connectFavorites();break;
      case 'toggle-favorite': await this._toggleFavorite(this._browserItems[Number(data.index)]);break;
      case 'play-favorite': {const station=this._favorites[Number(data.index)];if(station?.kind==='apple_music')await this._playApple(station);else if(station)await this._playStation(station);break;}
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

  async _service(service,payload={},onSuccess,entityOverride) {
    if(this._busy || !this._hass || !isAvailable(this._state))return false;
    const epoch=this._epoch, hass=this._hass, entity=entityOverride||this._controlEntity;
    this._busy=true;this._pendingService=service;this._error='';this._renderPlayer();
    if(this._dialog.open)this._renderBrowser();
    try {
      if(service==='media_next_track'&&entity===this._musicAssistantEntity)await this._appleCommand('next');
      else await hass.callService('media_player',service,{...payload,entity_id:entity});
      if(epoch!==this._epoch)return false;
      onSuccess?.();
      return true;
    } catch(error) {
      if(epoch===this._epoch)this._error='Befehl fehlgeschlagen: '+errorText(error);
      return false;
    } finally {
      if(epoch===this._epoch) {
        this._busy=false;this._pendingService=null;this._renderPlayer();
        if(this._dialog.open)this._renderBrowser();
      }
    }
  }

  async _playStation(station) {
    if(!hasFeature(this._hass?.states?.[this._config.entity],'playMedia'))return;
    let payload;
    try {payload=stationPayload(station);} catch(error) {this._radioError=errorText(error);this._renderBrowser();return;}
    const previousMedia=mediaIdentity(this._hass?.states?.[this._config.entity]);
    await this._service('play_media',payload,()=>{
      this._playbackSource='radio';this._radioSnapshot=previousMedia;this._cancelSeek();
      this._selectedStation={...station};
      this._applePreferred=false;
      this._dialog.close();
    },this._config.entity);
  }

  _resetApple() {
    this._appleRequest++;this._appleItems=[];this._appleAccount='';this._appleError='';
    this._appleLoading=false;this._appleMore=false;this._applePreferred=false;this._appleEntity='';
    this._appleDialog?.close();
    if(this._appleQuery)this._appleQuery.value='';
    this._renderApple();
  }

  _appleCommand(action,data={}) {
    return this._hass.callWS({type:'music_manager/apple_music',action,
      ...(this._config.music_assistant_entity?{entity_id:this._config.music_assistant_entity}:{}),
      source_entity:this._config.entity,...data});
  }

  _resolveApplePlayer() {
    if(!this.isConnected || !this._hass || !this._config)return;
    const key={epoch:this._epoch,connection:this._hass.connection,user:this._hass.user?.id};
    if(this._appleResolution && Object.keys(key).every(k=>this._appleResolution[k]===key[k]))return;
    this._appleResolution=key;
    // Restore queue controls after a reload, before opening the music picker.
    // Setup errors are shown when opening Apple Music; radio remains usable.
    Promise.resolve(this._appleCommand('status')).then(status=>{
      if(this._appleResolution!==key || this._epoch!==key.epoch)return;
      if(status.entity_id){this._appleEntity=status.entity_id;this._renderPlayer();}
    }).catch(()=>{});
  }

  _appleFailure(error) {
    return ['unknown_command','not_found'].includes(error?.code)
      ? 'Der Music-Manager-Connector ist noch nicht eingerichtet. Installiere Music Manager im Marketplace mit Typ Integration. '+APPLE_SETUP
      : 'Apple Music: '+errorText(error);
  }

  async _openApple() {
    this._resetApple();
    if(!this._appleDialog.open)this._appleDialog.showModal();
    const request=++this._appleRequest;
    this._appleLoading=true;this._renderApple();
    try {
      const status=await this._appleCommand('status');
      if(request!==this._appleRequest)return;
      this._appleEntity=status.entity_id||this._config.music_assistant_entity||'';
      this._appleAccount=status.account||'Dein Konto';
      this._renderPlayer();
      this._appleView='playlist';
      await this._loadApple('library');
      if(this._appleDialog.open)this._appleQuery.focus();
    } catch(error) {
      if(request!==this._appleRequest)return;
      this._appleError=this._appleFailure(error);this._appleLoading=false;this._renderApple();
    }
  }

  async _loadApple(action,append=false) {
    if(this._busy || !this._musicAssistantEntity)return;
    const query=this._appleQuery.value.trim().slice(0,200);
    if(action==='search'&&!query){this._appleError='Bitte einen Suchbegriff eingeben.';this._renderApple();return;}
    const request=++this._appleRequest;
    this._appleLoading=true;this._appleError='';this._appleSearch=action==='search';
    const offset=append?this._appleOffset||0:0;
    if(!append)this._appleItems=[];
    this._appleMore=false;this._renderApple();
    try {
      const response=await this._appleCommand(action,action==='search'?{query}:{media_type:this._appleView,offset});
      if(request!==this._appleRequest)return;
      const items=(Array.isArray(response.items)?response.items:[]).filter(item=>typeof item.uri==='string'&&typeof item.title==='string');
      this._appleItems=append?[...this._appleItems,...items]:items;
      this._appleMore=Boolean(response.more);this._appleOffset=response.next_offset;
    } catch(error) {
      if(request!==this._appleRequest)return;
      this._appleError=this._appleFailure(error);
    } finally {
      if(request===this._appleRequest){this._appleLoading=false;this._renderApple();}
    }
  }

  async _playApple(item) {
    if(this._busy||this._appleLoading||!item)return;
    const epoch=this._epoch;
    this._busy=true;this._appleError='';this._error='';this._renderApple();this._renderPlayer();
    try {
      if(!this._musicAssistantEntity){
        const status=await this._appleCommand('status');
        if(epoch!==this._epoch)return;
        this._appleEntity=status.entity_id||'';
      }
      await this._appleCommand('play',{uri:item.uri});
      if(epoch!==this._epoch)return;
      this._playbackSource='apple';this._radioSnapshot=null;this._cancelSeek();
      this._applePreferred=true;this._selectedStation=null;this._appleDialog.close();
    } catch(error) {
      if(epoch===this._epoch){this._appleError=this._appleFailure(error);if(!this._appleDialog.open)this._error=this._appleError;}
    } finally {
      if(epoch===this._epoch){this._busy=false;this._renderApple();this._renderPlayer();}
    }
  }

  _renderApple() {
    if(!this._appleDialog)return;
    const configured=Boolean(this._musicAssistantEntity), disabled=this._busy||this._appleLoading||!configured;
    for(const control of this._appleDialog.querySelectorAll('form button,form input'))control.disabled=disabled;
    for(const control of this._appleDialog.querySelectorAll('[data-action="apple-library"]'))control.setAttribute('aria-pressed',String(!this._appleSearch&&control.dataset.view===this._appleView));
    this.shadowRoot.getElementById('music-apple-account').innerHTML=this._appleAccount?row({title:this._appleAccount,description:'Dein Apple-Music-Konto'}):'';
    this.shadowRoot.getElementById('music-apple-status').innerHTML=(this._appleError?notice(this._appleError,{error:true}):'')+(this._favoriteError?notice(this._favoriteError,{error:true}):'')+(this._appleLoading?loadingState('Apple Music wird geladen …'):this._busy?loadingState('Wiedergabe wird gestartet …'):this._favoriteBusy?loadingState('Favoriten werden gespeichert …'):'');
    const results=this.shadowRoot.getElementById('music-apple-results');
    results.setAttribute('aria-busy',String(this._appleLoading));
    results.innerHTML=this._appleItems.map((item,index)=>{
      const favorite=appleFavorite(item),saved=favorite&&this._favorites.some(f=>f.media_content_id===favorite.media_content_id);
      const star=favorite?musicButton({label:(saved?'Favorit entfernen: ':'Als Favorit speichern: ')+item.title,icon:'star',action:'apple-favorite',data:{index},pressed:Boolean(saved),disabled:disabled||this._favoriteBusy||this._favoriteLoading||!this._hass?.user?.id}):'';
      return `<div class="music-station-row">${favorite?logoMarkup(favorite):''}${row({title:item.title,description:item.description||'',trailing:star+button({label:'Abspielen',action:'apple-play',data:{index},disabled})})}</div>`;
    }).join('')||(!this._appleLoading&&!this._appleError?emptyState(this._appleSearch?'Keine passenden Einträge gefunden.':'Keine Einträge. Du kannst Apple Music durchsuchen oder eine andere Mediathekansicht öffnen.'):'');
    this.shadowRoot.getElementById('music-apple-more').innerHTML=this._appleMore?button({label:'Mehr laden',action:'apple-more',disabled}):'';
  }

  async _openRadio() {
    this._favoriteMode=false;
    if(!this._dialog.open)this._dialog.showModal();
    this._error='';this._radioError='';
    if(!this._browseReady&&!this._favoriteMode)await this._browse(RADIO_ROOT,'Kategorien',true);
    else this._renderBrowser();
    if(this._dialog.open&&!this._favoriteMode)this._searchInput.focus();
  }

  async _browse(id,title,reset=false,explicitPath) {
    if(!this._hass || !isRadioId(id))return;
    this._favoriteMode=false;this._pendingFavoriteFocus=null;
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
    this._favoriteMode=false;this._pendingFavoriteFocus=null;
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
    const manager=this._favoriteMode;
    this.shadowRoot.getElementById('music-radio-dialog-title').textContent=manager?'Favoriten verwalten':'Radio Browser';
    this.shadowRoot.getElementById('search-field').hidden=manager;
    this._dialog.querySelector('[data-action="search"]').hidden=manager;
    this._dialog.querySelector('[data-action="manage-favorites"]').setAttribute('aria-pressed',String(manager));
    for(const control of this._dialog.querySelectorAll('form button'))control.disabled=this._busy;
    this._searchInput.disabled=this._busy||manager;
    status.innerHTML=(this._favoriteError?notice(this._favoriteError,{error:true})+button({label:'Favoriten neu laden',action:'reload-favorites'}):'')+(this._radioError?notice(this._radioError,{error:true}):'')+(this._error?notice(this._error,{error:true}):'')+(manager&&this._favoriteLoading?loadingState('Favoriten werden geladen …'):this._favoriteBusy?loadingState('Favoriten werden gespeichert …'):this._browseLoading?loadingState('Radiosender werden geladen …'):this._busy?loadingState('Sender wird gestartet …'):'');
    results.setAttribute('aria-label',manager?'Favoriten verwalten':'Radiosender und Kategorien');
    if(manager) {
      path.innerHTML=row({title:`${this._favorites.length} Favoriten`,description:'Mit den Pfeilen sortieren. Häkchen entfernen, um einen Favoriten aus der Kurzwahl zu entfernen.'});
      results.setAttribute('aria-busy',String(this._favoriteBusy||this._favoriteLoading));
      results.innerHTML=this._favoriteLoading?'':this._favorites.length?this._favorites.map((item,index)=>`<div class="music-station-row">${logoMarkup(item)}${row({
        title:item.title,description:item.kind==='apple_music'?(item.media_type==='album'?'Album':'Playlist'):'Radiosender',
        trailing:`<div class="music-favorite-actions">${programOrderButtons({programId:item.media_content_id,index,count:this._favorites.length,action:'move-favorite',desktopOnly:false,disabled:this._favoriteBusy||!this._hass?.user?.id,upLabel:'Nach oben: '+item.title,downLabel:'Nach unten: '+item.title})}<label class="check"><input type="checkbox" data-managed-favorite-id="${escapeHtml(item.media_content_id)}" aria-label="${escapeHtml('Favorit behalten: '+item.title)}"${this._favoriteRemovingId===item.media_content_id?'':' checked'}${this._favoriteBusy||!this._hass?.user?.id?' disabled':''}><span class="visually-hidden">${escapeHtml(item.title)}</span></label></div>`
      })}</div>`).join(''):emptyState('Keine Favoriten vorhanden. Über den Stern bei Sendern, Alben oder Playlists kannst du Favoriten hinzufügen.');
      if(this._pendingFavoriteFocus&&!this._favoriteBusy) {
        const {id,index=0,direction}=this._pendingFavoriteFocus,inputs=[...results.querySelectorAll('input[data-managed-favorite-id]')];
        const moved=direction&&[...results.querySelectorAll('[data-action="move-favorite"]')].find(b=>!b.disabled&&b.dataset.program===id&&b.dataset.direction===direction);
        (moved||inputs.find(input=>input.dataset.managedFavoriteId===id)||inputs[Math.min(index,inputs.length-1)]||this._dialog.querySelector('[data-action="manage-favorites"]')).focus();
        this._pendingFavoriteFocus=null;
      }
      return;
    }
    const pathLabel=this._searchMode ? `Suchergebnisse: ${this._resultQuery}` : this._path.map(p=>p.title).join(' / ');
    path.innerHTML=row({title:pathLabel||'Radio Browser',description:this._browseLoading?'':`${this._browserItems.length} Einträge`,trailing:this._path.length>1||this._searchMode?iconButton({icon:'left',label:'Zurück zu den Kategorien',action:'back',disabled:this._busy}):''});
    results.setAttribute('aria-busy',String(this._browseLoading));
    results.innerHTML=this._browseLoading?'':this._browserItems.length?this._browserItems.map((item,index)=>`<div class="music-station-row">${item.can_play?logoMarkup(item):''}${row({
      title:this._translateCategory(item.title),
      description:item.can_expand?'Kategorie':'Radiosender',
      trailing:item.can_expand ? iconButton({icon:'right',label:'Kategorie öffnen: '+item.title,action:'browse-item',data:{index},disabled:this._busy}) : musicButton({label:(this._favorites.some(s=>s.media_content_id===item.media_content_id)?'Favorit entfernen: ':'Als Favorit speichern: ')+item.title,icon:'star',action:'toggle-favorite',data:{index},pressed:this._favorites.some(s=>s.media_content_id===item.media_content_id),disabled:this._favoriteBusy||this._favoriteLoading||!this._hass?.user?.id})+button({label:'Abspielen',action:'play-station',data:{index},disabled:this._busy||!isAvailable(this._state)||!hasFeature(this._state,'playMedia')})
    })}</div>`).join(''):this._radioError?'':emptyState(this._searchMode?'Keine passenden Sender gefunden. Versuche einen anderen Namen.':'Keine Einträge in dieser Kategorie.');
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
        this._registry=entries;this._options=sonosOptions(this._hass,entries);this._registryError='';this._renderPreservingInput();
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
    const maOptions=[{value:'',label:'Automatisch – dieselbe Sonos-Box'},...musicAssistantOptions(this._hass,this._registry,this._config.entity)];
    this._maOptions=maOptions;
    let maSelected=maOptions.find(o=>o.value===(this._config.music_assistant_entity||''));
    if(!maSelected && this._config.music_assistant_entity){maSelected={value:this._config.music_assistant_entity,label:this._config.music_assistant_entity,description:'Zuordnung zur Sonos-Box prüfen'};maOptions.push(maSelected);}
    if(this._config.entity&&!selected)options.push({value:this._config.entity,label:this._hass?.states?.[this._config.entity]?.attributes?.friendly_name||this._config.entity,description:'Aktuell konfiguriert – Sonos-Zuordnung prüfen'});
    this.shadowRoot.innerHTML=`<style>${UI_CSS}\n${MUSIC_CSS}</style><div class="music-editor">
      ${combobox({id:'music-entity',label:'Sonos-Box',items:options,value:selected?.label||this._config.entity||'',selected:this._config.entity||'',action:'entity-select',placeholder:'Sonos-Box auswählen …',required:true,emptyLabel:'Keine Sonos-Box gefunden.'})}
      ${this._registryError?notice(this._registryError,{error:true}):''}
      ${combobox({id:'music-ma-entity',label:'Apple Music: Music-Assistant-Player',items:maOptions,value:maSelected?.label||'',selected:this._config.music_assistant_entity||'',action:'ma-entity-select',placeholder:'Automatisch – dieselbe Sonos-Box',emptyLabel:'Keine passende Music-Assistant-Box gefunden.'})}
      ${section({id:'music-editor-controls',title:'Bedienelemente anzeigen',content:Object.entries(names).map(([key,label])=>row({title:label,trailing:toggle({label,action:'control-toggle',checked:this._config.controls[key],iconOnly:true,data:{key}})})).join('')})}
      ${notice('Die Box wird pro Karte festgelegt. Favoriten gehören deinem angemeldeten HA-Benutzer und erscheinen bei allen Boxen. Oberfläche und Music-Manager-Connector werden gemeinsam über den Marketplace installiert. Apple Music findet den Music-Assistant-Player derselben Box automatisch. Die Apple-Music-Kontozuordnung erfolgt einmal pro HA-Benutzer unter Geräte & Dienste → Music Manager → Konfigurieren.')}
      ${versionInfo({frontend:MUSIC_VERSION,ui:UI_VERSION})}
    </div>`;
    if(!this._unbind)this._unbind=bindUI(this.shadowRoot,({action,data,value,checked})=>{
      if(action==='entity-select' && (this._options.some(o=>o.value===value)||value===this._config.entity)) {
        this._config={...this._config,entity:value,music_assistant_entity:''};
        // Selection is complete: preserving focus on the replaced search input
        // would reopen the in-flow list and shift the next clicked control.
        this.shadowRoot.activeElement?.blur?.();
        this._emit();
        this.shadowRoot.querySelector('[data-ui-combo-toggle]')?.focus();
      }
      if(action==='ma-entity-select' && this._maOptions.some(o=>o.value===value)) {
        this._config={...this._config,music_assistant_entity:value};
        this.shadowRoot.activeElement?.blur?.();this._emit();
        this.shadowRoot.querySelector('#music-ma-entity')?.focus();
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
  type:'music-manager-card',name:'Music Manager',description:'Sonos, persönliche Radiofavoriten und Apple Music. Mit HA UI Kit.',preview:true
});
