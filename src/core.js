// Home Assistant's MediaPlayerEntityFeature flags, verified against core 2026.11.1.
export const FEATURES = Object.freeze({pause:1,seek:2,volume:4,mute:8,previous:16,next:32,playMedia:512,stop:4096,play:16384,shuffle:32768});
export const RADIO_ROOT = 'media-source://radio_browser';
export const MUSIC_VERSION = '1.12.2';
export const CONTROL_DEFAULTS = Object.freeze({play_pause:true,previous:true,next:true,shuffle:true,volume:true});

export function normalizeConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Die Kartenkonfiguration muss ein Objekt sein.');
  if (typeof config.entity !== 'string' || !/^media_player\.[a-z0-9_]+$/.test(config.entity)) throw new Error('Bitte eine Sonos-Box als media_player auswählen.');
  if (config.name !== undefined && typeof config.name !== 'string') throw new Error('Der Kartenname muss ein Text sein.');
  if (config.music_assistant_entity && (typeof config.music_assistant_entity !== 'string' || !/^media_player\.[a-z0-9_]+$/.test(config.music_assistant_entity))) throw new Error('Bitte die Music-Assistant-Entität derselben Sonos-Box auswählen.');
  if (config.controls !== undefined && (!config.controls || typeof config.controls !== 'object' || Array.isArray(config.controls))) throw new Error('controls muss ein Objekt sein.');
  const controls = {...CONTROL_DEFAULTS};
  for (const key of Object.keys(controls)) {
    if (config.controls?.[key] !== undefined) {
      if (typeof config.controls[key] !== 'boolean') throw new Error(`controls.${key} muss true oder false sein.`);
      controls[key] = config.controls[key];
    }
  }
  return {...config,type:'custom:music-manager-card',entity:config.entity,music_assistant_entity:config.music_assistant_entity||'',name:config.name ?? '',controls};
}

export function hasFeature(state, name) { return Boolean((Number(state?.attributes?.supported_features) || 0) & FEATURES[name]); }
export function isAvailable(state) { return Boolean(state && !['unknown','unavailable'].includes(state.state)); }
export function volumePercent(value) { return Number.isFinite(value) ? Math.round(Math.max(0,Math.min(1,value))*100) : null; }
export function formatTime(seconds) {
  const n=Math.max(0,Math.floor(Number.isFinite(seconds)?seconds:0));
  const mins=Math.floor(n/60),secs=String(n%60).padStart(2,'0');
  return mins>=60?`${Math.floor(mins/60)}:${String(mins%60).padStart(2,'0')}:${secs}`:`${mins}:${secs}`;
}
export function playbackProgress(state,now=Date.now()) {
  const a=state?.attributes||{},duration=a.media_duration;
  if(!Number.isFinite(duration)||duration<=0)return null;
  let position=Number.isFinite(a.media_position)?a.media_position:0;
  const anchor=typeof a.media_position_updated_at==='string'?Date.parse(a.media_position_updated_at):NaN;
  if(state.state==='playing'&&Number.isFinite(anchor))position+=Math.max(0,(now-anchor)/1000);
  return {duration,position:Math.max(0,Math.min(duration,position))};
}
export function mediaIdentity(state) {
  const a=state?.attributes||{};
  return JSON.stringify([a.media_content_id||'',a.media_title||'',a.media_artist||'',a.media_duration??null]);
}
// The native Sonos transport is stronger evidence than a cached MA queue.
// MA uses /flow/ and /single/ stream routes, also when Sonos wraps a flow
// stream in x-rincon-mp3radio. Group members expose only their coordinator.
export function sonosContentId(state) {
  return typeof state?.attributes?.media_content_id==='string'?state.attributes.media_content_id:'';
}
export function sonosPlaybackSource(state) {
  if(!isAvailable(state))return '';
  const a=state.attributes||{},id=sonosContentId(state);
  if(!id || /^x-rincon:/i.test(id))return '';
  if(/(?:^https?:|^x-rincon-mp3radio:).*\/(?:flow|single)\/[^/]+\/[^/]+/i.test(id))return 'apple';
  if(isRadioId(id) || /^(?:x-rincon-mp3radio|x-sonosapi-(?:stream|radio)):/i.test(id) ||
    (/^https?:/i.test(id) && !(Number.isFinite(a.media_duration)&&a.media_duration>0)))return 'radio';
  return 'native';
}
export function isRadioId(value) { return typeof value === 'string' && (value === RADIO_ROOT || value.startsWith(RADIO_ROOT + '/')); }
export function normalizeMedia(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter(item => {
    if (!item || !isRadioId(item.media_content_id) || seen.has(item.media_content_id)) return false;
    seen.add(item.media_content_id);
    return item.can_play || item.can_expand;
  }).map(item => ({...item,title:String(item.title || 'Unbekannter Sender')}));
}
export function errorText(error) { return String(error?.message || error?.code || error || 'Unbekannter Fehler'); }
export function stationPayload(station) {
  if (!station?.can_play || !isRadioId(station.media_content_id) || station.media_content_id === RADIO_ROOT) throw new Error('Ungültiger Radiosender.');
  return {media_content_id:station.media_content_id,media_content_type:station.media_content_type || 'audio/mpeg',extra:{title:station.title}};
}
export function playbackAction(state, station) {
  if (['playing','buffering'].includes(state?.state)) {
    if (hasFeature(state,'pause')) return 'media_pause';
    if (hasFeature(state,'stop')) return 'media_stop';
    return null;
  }
  if (hasFeature(state,'play')) return 'media_play';
  return station && hasFeature(state,'playMedia') ? 'play_media' : null;
}
export function sonosOptions(hass, entries) {
  // Registry platform identifies Sonos, including Symfonisk, without name guessing.
  const registry = entries || Object.values(hass?.entities || {});
  return registry.filter(e => e.platform === 'sonos' && e.entity_id?.startsWith('media_player.') && !e.disabled_by && hass?.states?.[e.entity_id])
    .map(e => ({value:e.entity_id,label:hass.states[e.entity_id].attributes?.friendly_name || e.entity_id,description:e.entity_id}))
    .sort((a,b)=>a.label.localeCompare(b.label));
}

export function musicAssistantOptions(hass, entries, sourceEntity) {
  const registry=entries || Object.values(hass?.entities || {});
  const uid=id=>String(id||'').toLowerCase().match(/rincon_[a-z0-9]+/)?.[0];
  const source=registry.find(e=>e.entity_id===sourceEntity), sourceUid=uid(source?.unique_id);
  return registry.filter(e=>e.platform==='music_assistant' && e.entity_id?.startsWith('media_player.') && !e.disabled_by && hass?.states?.[e.entity_id] && (!sourceUid || uid(e.unique_id)===sourceUid))
    .map(e=>({value:e.entity_id,label:hass.states[e.entity_id].attributes?.friendly_name||e.entity_id,description:e.entity_id}))
    .sort((a,b)=>a.label.localeCompare(b.label));
}

// HA authenticates these commands as the current user; no entity/card/user ID
// is included in the storage key or payload.
export const FAVORITES_KEY = 'music_manager_favorites';
export const ALARM_SONGS_KEY = 'music_manager_alarm_songs';
export function stationLogo(value) {
  if (typeof value !== 'string' || value.length > 4096) return '';
  try {
    const url = new URL(value, 'https://home-assistant.local');
    return ['http:','https:'].includes(url.protocol) && !url.username && !url.password ? value : '';
  } catch { return ''; }
}
export function normalizeFavorites(value) {
  const result=[],seen=new Set();
  for(const s of Array.isArray(value)?value:[]) {
    const item=s?.kind==='apple_music'?appleFavorite(s):normalizeMedia([s]).filter(s=>s.can_play&&s.media_content_id!==RADIO_ROOT).map(s=>({
      media_content_id:s.media_content_id,media_content_type:String(s.media_content_type||'audio/mpeg'),
      title:s.title,thumbnail:stationLogo(s.thumbnail),can_play:true,can_expand:false
    }))[0];
    if(item&&!seen.has(item.media_content_id)){result.push(item);seen.add(item.media_content_id);}
  }
  return result;
}
export function appleFavorite(item) {
  const uri=item?.uri,match=typeof uri==='string'&&uri.match(/^apple_music--[a-zA-Z0-9._-]{1,128}:\/\/(track|album|playlist)\/[a-zA-Z0-9._-]{1,256}$/);
  if(!match||item.media_type!==match[1]||typeof item.title!=='string'||!item.title.trim())return null;
  return {kind:'apple_music',uri,media_type:match[1],media_content_id:uri,media_content_type:match[1],
    title:item.title,description:String(item.description||''),thumbnail:stationLogo(item.thumbnail),can_play:true,can_expand:false,
    ...(match[1]==='track'&&item.alarm_song===true?{alarm_song:true}:{})};
}
const favoriteQueues = new WeakMap();
async function serializeUserData(hass, update) {
  if (!hass.user?.id) throw new Error('Bitte mit einem Home-Assistant-Benutzer anmelden.');
  // Serialize changes across this user's cards, and read immediately before
  // each write so another card's favorites are preserved.
  const session=hass.connection || hass;
  let users=favoriteQueues.get(session);
  if(!users){users=new Map();favoriteQueues.set(session,users);}
  const key=hass.user.id, previous=users.get(key)||Promise.resolve();
  const operation=previous.catch(()=>{}).then(update);
  users.set(key,operation);
  try{return await operation;}finally{if(users.get(key)===operation)users.delete(key);}
}
async function updateFavorites(hass, update) {
  return serializeUserData(hass,async()=>{
    const response=await hass.callWS({type:'frontend/get_user_data',key:FAVORITES_KEY});
    const next=update(normalizeFavorites(response?.value));
    await hass.callWS({type:'frontend/set_user_data',key:FAVORITES_KEY,value:next});
    return next;
  });
}
export function normalizeAlarmSongs(value) {
  return normalizeFavorites(value).filter(f=>f.kind==='apple_music'&&f.media_type==='track').map(f=>{const next={...f};delete next.alarm_song;return next;});
}
async function migrateLegacyAlarmSongs(hass) {
  const response=await hass.callWS({type:'frontend/get_user_data',key:FAVORITES_KEY});
  const raw=Array.isArray(response?.value)?response.value:[],legacy=raw.filter(f=>f?.alarm_song===true&&appleFavorite(f)?.media_type==='track');
  if(!legacy.length)return;
  const existing=await hass.callWS({type:'frontend/get_user_data',key:ALARM_SONGS_KEY});
  // Copy first. If pruning fails, the next attempt merges the same songs
  // without losing either the old markers or an already migrated selection.
  const songs=normalizeAlarmSongs([...(Array.isArray(existing?.value)?existing.value:[]),...legacy]);
  await hass.callWS({type:'frontend/set_user_data',key:ALARM_SONGS_KEY,value:songs});
  await hass.callWS({type:'frontend/set_user_data',key:FAVORITES_KEY,value:raw.filter(f=>!legacy.includes(f))});
}
export async function migrateAlarmSongs(hass) { return serializeUserData(hass,()=>migrateLegacyAlarmSongs(hass)); }
export async function saveFavorite(hass, favorite, enabled) {
  const item=normalizeFavorites([favorite])[0];
  if(!item)throw new Error('Ungültiger Favorit.');
  return updateFavorites(hass,favorites=>{
    const index=favorites.findIndex(s=>s.media_content_id===item.media_content_id);
    const next=favorites.filter(s=>s.media_content_id!==item.media_content_id);
    if(enabled)next.splice(index<0?next.length:index,0,{...favorites[index],...item});
    return next;
  });
}
export async function saveAlarmSong(hass,favorite,enabled) {
  const item=appleFavorite(favorite);
  if(item?.media_type!=='track')throw new Error('Nur einzelne Apple-Music-Titel können Wecklieder sein.');
  return serializeUserData(hass,async()=>{
    await migrateLegacyAlarmSongs(hass);
    const response=await hass.callWS({type:'frontend/get_user_data',key:ALARM_SONGS_KEY});
    const songs=normalizeAlarmSongs(response?.value),index=songs.findIndex(f=>f.uri===item.uri);
    const next=songs.filter(f=>f.uri!==item.uri);
    if(enabled)next.splice(index<0?next.length:index,0,normalizeAlarmSongs([item])[0]);
    await hass.callWS({type:'frontend/set_user_data',key:ALARM_SONGS_KEY,value:next});
    return next;
  });
}
export async function moveFavorite(hass,id,direction) {
  if(!['up','down'].includes(direction))throw new Error('Ungültige Sortierrichtung.');
  return updateFavorites(hass,favorites=>{
    const index=favorites.findIndex(s=>s.media_content_id===id),target=index+(direction==='up'?-1:1);
    if(index<0||target<0||target>=favorites.length)return favorites;
    const next=[...favorites];[next[index],next[target]]=[next[target],next[index]];return next;
  });
}
