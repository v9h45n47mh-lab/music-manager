// Home Assistant's MediaPlayerEntityFeature flags, verified against core 2026.11.1.
export const FEATURES = Object.freeze({pause:1,volume:4,mute:8,previous:16,next:32,playMedia:512,stop:4096,play:16384});
export const RADIO_ROOT = 'media-source://radio_browser';
export const MUSIC_VERSION = '1.1.1';
export const CONTROL_DEFAULTS = Object.freeze({play_pause:true,previous:true,stop:true,next:true,volume:true});

export function normalizeConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Die Kartenkonfiguration muss ein Objekt sein.');
  if (typeof config.entity !== 'string' || !/^media_player\.[a-z0-9_]+$/.test(config.entity)) throw new Error('Bitte eine Sonos-Box als media_player auswählen.');
  if (config.name !== undefined && typeof config.name !== 'string') throw new Error('Der Kartenname muss ein Text sein.');
  if (config.controls !== undefined && (!config.controls || typeof config.controls !== 'object' || Array.isArray(config.controls))) throw new Error('controls muss ein Objekt sein.');
  const controls = {...CONTROL_DEFAULTS};
  for (const key of Object.keys(controls)) {
    if (config.controls?.[key] !== undefined) {
      if (typeof config.controls[key] !== 'boolean') throw new Error(`controls.${key} muss true oder false sein.`);
      controls[key] = config.controls[key];
    }
  }
  return {...config,type:'custom:music-manager-card',entity:config.entity,name:config.name ?? '',controls};
}

export function hasFeature(state, name) { return Boolean((Number(state?.attributes?.supported_features) || 0) & FEATURES[name]); }
export function isAvailable(state) { return Boolean(state && !['unknown','unavailable'].includes(state.state)); }
export function volumePercent(value) { return Number.isFinite(value) ? Math.round(Math.max(0,Math.min(1,value))*100) : null; }
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

// HA authenticates these commands as the current user; no entity/card/user ID
// is included in the storage key or payload.
export const FAVORITES_KEY = 'music_manager_favorites';
export function stationLogo(value) {
  if (typeof value !== 'string' || value.length > 4096) return '';
  try {
    const url = new URL(value, 'https://home-assistant.local');
    return ['http:','https:'].includes(url.protocol) && !url.username && !url.password ? value : '';
  } catch { return ''; }
}
export function normalizeFavorites(value) {
  return normalizeMedia(value).filter(s=>s.can_play && s.media_content_id!==RADIO_ROOT).map(s=>({
    media_content_id:s.media_content_id,media_content_type:String(s.media_content_type||'audio/mpeg'),
    title:s.title,thumbnail:stationLogo(s.thumbnail),can_play:true,can_expand:false
  }));
}
const favoriteQueues = new WeakMap();
export async function saveFavorite(hass, station, enabled) {
  const item = normalizeFavorites([station])[0];
  if (!item || !hass.user?.id) throw new Error('Bitte mit einem Home-Assistant-Benutzer anmelden.');
  // Serialize changes across this user's cards, and read immediately before
  // each write so another card's favorites are preserved.
  const session=hass.connection || hass;
  let users=favoriteQueues.get(session);
  if(!users){users=new Map();favoriteQueues.set(session,users);}
  const key=hass.user.id, previous=users.get(key)||Promise.resolve();
  const operation=previous.catch(()=>{}).then(async()=>{
    const response=await hass.callWS({type:'frontend/get_user_data',key:FAVORITES_KEY});
    const favorites=normalizeFavorites(response?.value);
    const next=favorites.filter(s=>s.media_content_id!==item.media_content_id);
    if(enabled)next.splice(favorites.findIndex(s=>s.media_content_id===item.media_content_id) < 0 ? next.length : favorites.findIndex(s=>s.media_content_id===item.media_content_id),0,item);
    await hass.callWS({type:'frontend/set_user_data',key:FAVORITES_KEY,value:next});
    return next;
  });
  users.set(key,operation);
  try{return await operation;}finally{if(users.get(key)===operation)users.delete(key);}
}
