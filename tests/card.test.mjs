import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
let parseHTML;
try {({parseHTML}=require('linkedom'));}catch(error){if(!process.env.MUSIC_TEST_DOM_MODULE)throw error;({parseHTML}=require(process.env.MUSIC_TEST_DOM_MODULE));}
const bundle=await readFile(new URL('../dist/music-manager-card.js',import.meta.url),'utf8');
const ROOT='media-source://radio_browser';
const station=(id,title='SWR3')=>({media_content_id:ROOT+'/'+id,media_content_type:'audio/mpeg',title,can_play:true});
const features=1|2|4|8|16|32|512|4096|16384|32768;
const flush=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
function setup() {
 const {window}=parseHTML('<!doctype html><html><body></body></html>');
 const {document}=window;
 window.HTMLElement.prototype.showModal=function(){this.open=true;};
 window.HTMLElement.prototype.close=function(){this.open=false;this.dispatchEvent(new window.Event('close'));};
 const context=vm.createContext({window,document,HTMLElement:window.HTMLElement,customElements:window.customElements,MutationObserver:window.MutationObserver,CustomEvent:window.CustomEvent,queueMicrotask,console,setTimeout,clearTimeout,URL,Promise});
 vm.runInContext(bundle.replace(/^export /gm,''),context);
 vm.runInContext("customElements.define('music-manager-engine-test-card',class extends MusicPlayerBase {});",context);
 const calls=[],wsCalls=[];
 let failService=false,failBrowse=false,wsHook=null,serviceHook=null;
 const registry=[{entity_id:'media_player.a',platform:'sonos',unique_id:'RINCON_AABBCCDDEEFF01400'},{entity_id:'media_player.b',platform:'sonos',unique_id:'RINCON_11223344556601400'},{entity_id:'media_player.tv',platform:'cast'},{entity_id:'media_player.ma_a',platform:'music_assistant',unique_id:'RINCON_AABBCCDDEEFF01400'},{entity_id:'media_player.ma_b',platform:'music_assistant',unique_id:'RINCON_11223344556601400'}];
 let states=Object.fromEntries(registry.map(e=>[e.entity_id,{entity_id:e.entity_id,state:'playing',attributes:{friendly_name:e.entity_id,volume_level:0.25,supported_features:features,media_title:'Titel'}}]));
 const cards=[];
let currentUser='manuel',failFavorites=false;
const favoriteData=new Map(),favoriteSubscribers=new Map(),alarmSongData=new Map(),alarmSongSubscribers=new Map(),connections=new Map();
const dataForKey=key=>key==='music_manager_alarm_songs'?alarmSongData:favoriteData;
const subscribersForKey=key=>key==='music_manager_alarm_songs'?alarmSongSubscribers:favoriteSubscribers;
const notifyAlarmSongs=user=>{for(const cb of alarmSongSubscribers.get(user)||[])cb({value:alarmSongData.get(user)||[]});};
const notifyFavorites=user=>{for(const cb of favoriteSubscribers.get(user)||[])cb({value:favoriteData.get(user)||[]});};
const connectionFor=user=>{
 if(!connections.has(user))connections.set(user,{async subscribeMessage(cb,message){
  if(failFavorites)throw new Error('Favoriten nicht verfügbar');
  const subscribers=subscribersForKey(message.key),data=dataForKey(message.key);
  if(!subscribers.has(user))subscribers.set(user,new Set());
  subscribers.get(user).add(cb);cb({value:data.get(user)||[]});
  return ()=>subscribers.get(user).delete(cb);
 }});
 return connections.get(user);
};

const navigationData=new Map();
 const makeHass=(user=currentUser)=>({user:{id:user},connection:connectionFor(user),states,entities:Object.fromEntries(registry.map(e=>[e.entity_id,e])),
  async callService(domain,service,data){calls.push({domain,service,data});if(serviceHook)await serviceHook();if(failService)throw new Error('Keine Berechtigung');},
  async callWS(message){wsCalls.push(message);if(wsHook){const result=await wsHook(message);if(result!==undefined)return result;}
   if(message.type==='config/entity_registry/list')return registry;
   if(message.type==='music_manager/player_navigation'){
    const can_select=['manuel','vera'].includes(user),key=message.navigation_id||message.source_entity;
    if(!can_select&&message.action==='select')throw new Error('Box festgelegt');
    const players=can_select?registry.filter(e=>e.platform==='sonos'&&!e.disabled_by&&states[e.entity_id]).map(e=>({entity_id:e.entity_id,name:states[e.entity_id].attributes.friendly_name,available:true})):[];
    if(!navigationData.has(user))navigationData.set(user,{});
    if(message.action==='select'){if(!players.some(p=>p.entity_id===message.entity_id))throw new Error('Box nicht verfügbar');navigationData.get(user)[key]=message.entity_id;}
    return {can_select,players,version:'2.2.1',show_alarm_songs:['maximilian','paul','manuel','vera'].includes(user),entity_id:can_select?navigationData.get(user)[key]||message.source_entity:message.source_entity};
   }
   if(message.type==='music_manager/apple_music')throw {code:'unknown_command'};
   if(message.type==='frontend/get_user_data'){if(failFavorites)throw new Error('Favoriten nicht verfügbar');return {value:dataForKey(message.key).get(user)||[]};}
   if(message.type==='frontend/set_user_data'){if(failFavorites)throw new Error('Speichern verweigert');dataForKey(message.key).set(user,JSON.parse(JSON.stringify(message.value)));(message.key==='music_manager_alarm_songs'?notifyAlarmSongs:notifyFavorites)(user);return null;}

   if(failBrowse)throw new Error('Radio Browser nicht verfügbar');
   if(message.type==='media_source/search_media')return {result:message.search_query==='leer'?[]:[station('swr3')]};
   return {can_search:true,children:message.media_content_id===ROOT?[{title:'Popular',can_expand:true,media_content_id:ROOT+'/popular'}]:[station('swr3')]};}
 });
 const add=(entity='media_player.a',controls)=>{const card=document.createElement('music-manager-engine-test-card');card.setConfig({entity,controls});document.body.append(card);cards.push(card);card.hass=makeHass();return card;};
 const update=(entity,changes)=>{const old=states[entity];states={...states,[entity]:{...old,...changes,attributes:{...old.attributes,...changes.attributes}}};for(const card of cards)card.hass=makeHass();};
 const click=(element,action)=>{const button=element.shadowRoot.querySelector(`[data-action="${action}"]`);assert(button,action+' exists');assert(!button.disabled,action+' enabled');button.click();};
 const addPlayer=(entity='media_player.a',config={})=>{const card=document.createElement('music-manager-card');card.setConfig({entity,...config});document.body.append(card);cards.push(card);card.hass=makeHass();return card;};
 return {navigationData,addPlayer,window,document,calls,wsCalls,add,update,click,makeHass,favoriteData,alarmSongData,notifyFavorites,notifyAlarmSongs,connections,
 switchUser(user){currentUser=user;for(const card of cards)card.hass=makeHass();},set failFavorites(v){failFavorites=v},set failService(v){failService=v},set failBrowse(v){failBrowse=v},set wsHook(v){wsHook=v},set serviceHook(v){serviceHook=v}};
}
test('actual card controls call HA media services and preserve per-card targets',async()=>{
 const env=setup(),a=env.add(),b=env.add('media_player.b');
 for(const [action,service] of [['previous','media_previous_track'],['next','media_next_track'],['play-pause','media_pause']]){env.click(a,action);await flush();assert.equal(env.calls.at(-1).service,service);assert.equal(env.calls.at(-1).data.entity_id,'media_player.a');}
 env.update('media_player.b',{state:'paused'});env.click(b,'play-pause');await flush();assert.equal(env.calls.at(-1).service,'media_play');assert.equal(env.calls.at(-1).data.entity_id,'media_player.b');
 assert.equal(a.shadowRoot.querySelector('[data-action="mute"]'),null);
});
test('UI Kit slider emits volume_set once on change, never on input',async()=>{
 const env=setup(),card=env.add();const slider=card.shadowRoot.querySelector('input[type=range]');
 slider.value='57';slider.dispatchEvent(new env.window.Event('input',{bubbles:true}));await flush();assert.equal(env.calls.length,0);
 slider.dispatchEvent(new env.window.Event('change',{bubbles:true}));await flush();assert.equal(env.calls.length,1);assert.equal(env.calls[0].data.volume_level,0.57);
});
test('Radio Browser search and selection use supported HA websocket and service payloads',async()=>{
 const env=setup(),card=env.add();env.click(card,'open-radio');await flush();
 assert(env.wsCalls.some(c=>c.type==='media_source/browse_media'&&c.media_content_id===ROOT));
 card.shadowRoot.querySelector('#music-radio-query').value='SWR3';env.click(card,'search');await flush();
 assert.equal(env.wsCalls.at(-1).type,'media_source/search_media');assert.equal(env.wsCalls.at(-1).search_query,'SWR3');
 env.click(card,'play-station');await flush();
 const call=env.calls.at(-1);assert.equal(call.service,'play_media');assert.equal(call.data.entity_id,'media_player.a');assert.equal(call.data.media_content_id,ROOT+'/swr3');assert.equal(call.data.media_content_type,'audio/mpeg');assert.equal(card.shadowRoot.querySelector('dialog').open,false);
});
test('failed playback leaves the station picker open and displays the service error',async()=>{
 const env=setup(),card=env.add();env.click(card,'open-radio');await flush();env.click(card,'popular');await flush();env.failService=true;env.click(card,'play-station');await flush();
 assert.equal(card.shadowRoot.querySelector('dialog').open,true);assert.match(card.shadowRoot.querySelector('#music-radio-status').textContent,/Keine Berechtigung/);assert.equal(card._selectedStation,null);
});
test('missing Radio Browser, empty search, categories and retry are handled',async()=>{
 const env=setup(),card=env.add();env.failBrowse=true;env.click(card,'open-radio');await flush();assert.match(card.shadowRoot.querySelector('#music-radio-status').textContent,/Geräte & Dienste/);
 env.failBrowse=false;env.click(card,'root');await flush();env.click(card,'browse-item');await flush();assert.equal(env.wsCalls.at(-1).media_content_id,ROOT+'/popular');
 card.shadowRoot.querySelector('#music-radio-query').value='leer';env.click(card,'search');await flush();assert.match(card.shadowRoot.querySelector('#music-radio-results').textContent,/Keine passenden Sender/);
});
test('out-of-order asynchronous responses and closed-dialog results are discarded',async()=>{
 const env=setup(),card=env.add();env.click(card,'open-radio');await flush();let finishOld;
 env.wsHook=msg=>msg.media_content_id===ROOT+'/popular'?new Promise(r=>{finishOld=()=>r({children:[station('old','Alt')]})}):undefined;
 env.click(card,'popular');await flush();card.shadowRoot.querySelector('#music-radio-query').value='Neu';env.click(card,'search');await flush();finishOld();await flush();assert.equal(card._browserItems[0].media_content_id,ROOT+'/swr3');
 env.click(card,'popular');await flush();card.shadowRoot.querySelector('dialog').close();finishOld();await flush();assert.equal(card.shadowRoot.querySelector('dialog').open,false);assert.equal(card._browserItems[0].media_content_id,ROOT+'/swr3');
});
test('changing configured box during a pending command cannot overwrite the new card state',async()=>{
 const env=setup(),card=env.add();let finish;
 env.serviceHook=()=>new Promise(r=>{finish=r});env.click(card,'next');await flush();card.setConfig({entity:'media_player.b'});card.hass=env.makeHass();finish();await flush();assert.equal(card._config.entity,'media_player.b');assert.equal(card._busy,false);assert.equal(card._error,'');assert.equal(env.calls[0].data.entity_id,'media_player.a');
});
test('unsupported features and unavailable states disable controls, configuration hides switches',async()=>{
 const env=setup(),card=env.add();env.update('media_player.a',{state:'unavailable'});
 for(const action of ['next','previous','play-pause'])assert.equal(card.shadowRoot.querySelector(`[data-action="${action}"]`).disabled,true);
 env.update('media_player.a',{state:'playing',attributes:{supported_features:4096}});assert.equal(card.shadowRoot.querySelector('[data-action="next"]').disabled,true);assert.equal(card.shadowRoot.querySelector('[data-action="play-pause"]').getAttribute('aria-label'),'Pause');
 env.click(card,'play-pause');await flush();assert.equal(env.calls.at(-1).service,'media_stop');
 card.setConfig({entity:'media_player.a',controls:{next:false,previous:false,volume:false,mute:false}});for(const selector of ['[data-action="next"]','[data-action="previous"]','[data-action="mute"]','input[type=range]'])assert.equal(card.shadowRoot.querySelector(selector),null);
});
test('Sonos-only visual editor emits entity and independent control configuration',async()=>{
 const env=setup(),editor=env.document.createElement('music-manager-card-editor');editor.setConfig({entity:'media_player.a'});editor.hass=env.makeHass();env.document.body.append(editor);await flush();const events=[];editor.addEventListener('config-changed',e=>{events.push(e.detail.config);editor.setConfig(e.detail.config);});
 const options=[...editor.shadowRoot.querySelectorAll('#music-entity-options [data-ui-option]')];assert.equal(options.length,2);assert(options.every(e=>e.dataset.value!=='media_player.tv'));
 options.find(e=>e.dataset.value==='media_player.b').click();await flush();assert.equal(events.at(-1).entity,'media_player.b');
 assert.equal(editor.shadowRoot.querySelector('#music-name'),null);
 editor.shadowRoot.querySelector('[data-key="next"]').click();assert.equal(events.at(-1).controls.next,false);assert.equal(events.at(-1).controls.volume,true);
});
test('external text stays escaped; reconnecting does not duplicate event handlers',async()=>{
 const env=setup(),card=env.add();card.setConfig({entity:'media_player.a',name:'<img src=x onerror=alert(1)>'});assert.equal(card.shadowRoot.querySelector('img'),null);
 card.remove();env.document.body.append(card);env.click(card,'next');await flush();assert.equal(env.calls.length,1);
 env.wsHook=msg=>msg.type==='media_source/search_media'?{result:[station('bad','<script>bad()</script>')]}:undefined;
 env.click(card,'open-radio');await flush();card.shadowRoot.querySelector('#music-radio-query').value='bad';env.click(card,'search');await flush();assert.equal(card.shadowRoot.querySelector('script'),null);assert.match(card.shadowRoot.querySelector('#music-radio-results').textContent,/<script>/);
});
test('favorites belong to the HA user, sync across boxes and survive recreation',async()=>{
 const env=setup(),a=env.add(),b=env.add('media_player.b');await flush();
 env.click(a,'open-radio');await flush();env.click(a,'popular');await flush();env.click(a,'toggle-favorite');await flush();
 assert.equal(env.favoriteData.get('manuel').length,1);
 assert.equal(a.shadowRoot.querySelectorAll('[data-action="play-favorite"]').length,1);
 assert.equal(b.shadowRoot.querySelectorAll('[data-action="play-favorite"]').length,1);
 assert(env.wsCalls.some(c=>c.type==='frontend/set_user_data'&&c.key==='music_manager_favorites'&&!('entity_id' in c)&&!('user_id' in c)));
 env.click(b,'play-favorite');await flush();assert.equal(env.calls.at(-1).data.entity_id,'media_player.b');
 a.remove();const c=env.add();await flush();assert.equal(c.shadowRoot.querySelectorAll('[data-action="play-favorite"]').length,1);
 env.switchUser('paul');await flush();assert.equal(b.shadowRoot.querySelectorAll('[data-action="play-favorite"]').length,0);
 env.switchUser('manuel');await flush();assert.equal(b.shadowRoot.querySelectorAll('[data-action="play-favorite"]').length,1);
 env.click(c,'open-radio');await flush();env.click(c,'popular');await flush();env.click(c,'toggle-favorite');await flush();
 assert.equal(env.favoriteData.get('manuel').length,0);assert.equal(b.shadowRoot.querySelectorAll('[data-action="play-favorite"]').length,0);
});
test('favorite subscription updates render other-device changes and unsubscribe on removal',async()=>{
 const env=setup(),a=env.add();await flush();
 env.favoriteData.set('manuel',[{...station('swr3'),thumbnail:'https://example.org/logo.png'}]);env.notifyFavorites('manuel');
 assert.equal(a.shadowRoot.querySelector('[data-action="play-favorite"] img').getAttribute('src'),'https://example.org/logo.png');
 assert.equal(a.shadowRoot.querySelector('.music-box').textContent,'media_player.a');
 assert.equal(a.shadowRoot.querySelector('nav'),null);
 a.remove();env.favoriteData.set('manuel',[]);env.notifyFavorites('manuel');
 env.document.body.append(a);await flush();assert.equal(a.shadowRoot.querySelectorAll('[data-action="play-favorite"]').length,0);
});
test('failed favorite writes retain existing shortcuts and offer retry',async()=>{
 const env=setup(),a=env.add();await flush();env.click(a,'open-radio');await flush();env.click(a,'popular');await flush();
 env.failFavorites=true;env.click(a,'toggle-favorite');await flush();
 assert.match(a.shadowRoot.querySelector('#music-radio-status').textContent,/nicht gespeichert/);assert.equal(a._favorites.length,0);
 env.failFavorites=false;env.click(a,'toggle-favorite');await flush();assert.equal(a._favorites.length,1);
});
test('concurrent favorites from two cards preserve both stations',async()=>{
 const env=setup(),a=env.add(),b=env.add('media_player.b');await flush();
 await Promise.all([a._toggleFavorite(station('swr3')),b._toggleFavorite(station('rock','Rock'))]);await flush();
 assert.deepEqual(env.favoriteData.get('manuel').map(s=>s.title),['SWR3','Rock']);
 assert.equal(a._favorites.length,2);assert.equal(b._favorites.length,2);
});
test('late favorite load cannot leak the previous user into the new session',async()=>{
 const env=setup();let deliver,finish;
 env.connections.set('manuel',{subscribeMessage(cb){deliver=cb;return new Promise(r=>{finish=()=>r(()=>{});});}});
 const a=env.add();env.switchUser('paul');await flush();deliver({value:[station('private','Privat')]});finish();await flush();
 assert.equal(a._favorites.length,0);assert(!a.shadowRoot.querySelector('#player').textContent.includes('Privat'));
});
test('volume zero silences and a positive slider value releases external mute',async()=>{
 const env=setup(),a=env.add();await flush();
 env.update('media_player.a',{attributes:{is_volume_muted:true}});
 assert.equal(a.shadowRoot.querySelector('#music-volume').getAttribute('value'),'0');
 await a._action({action:'volume',phase:'change',value:43});
 assert.equal(env.calls.at(-2).service,'volume_set');assert.equal(env.calls.at(-2).data.volume_level,.43);
 assert.equal(env.calls.at(-1).service,'volume_mute');assert.equal(env.calls.at(-1).data.is_volume_muted,false);
 await a._action({action:'volume',phase:'change',value:0});assert.equal(env.calls.at(-1).data.volume_level,0);
});
test('station logos reject executable URLs and safely fall back after image errors',async()=>{
 const env=setup(),a=env.add();await flush();
 env.favoriteData.set('manuel',[{...station('bad','<img src=x onerror=alert(1)>'),thumbnail:'javascript:alert(1)'},{...station('logo','Logo'),thumbnail:'https://example.org/missing.png'}]);env.notifyFavorites('manuel');
 assert.equal(a.shadowRoot.querySelectorAll('img').length,1);assert.equal(a.shadowRoot.querySelector('script'),null);
 const img=a.shadowRoot.querySelector('img');img.dispatchEvent(new env.window.Event('error',{bubbles:true}));assert.equal(img.hidden,true);
});

test('native HA slider uses standard properties and commits only value-changed',async()=>{
 const env=setup();env.window.customElements.define('ha-control-slider',class extends env.window.HTMLElement {});
 const a=env.add();await flush();const slider=a.shadowRoot.querySelector('ha-control-slider');
 assert(slider);assert.equal(a.shadowRoot.querySelector('input[type=range]'),null);
 assert.equal(slider.value,25);assert.equal(slider.unit,'%');assert.equal(slider.tooltipMode,'interaction');assert.equal(slider.showHandle,true);
 slider.value=57;slider.dispatchEvent(new env.window.CustomEvent('slider-moved',{detail:{value:57},bubbles:true}));await flush();assert.equal(env.calls.length,0);
 env.update('media_player.a',{attributes:{volume_level:.1}});assert.equal(a.shadowRoot.querySelector('ha-control-slider'),slider);assert.equal(slider.value,57);
 slider.dispatchEvent(new env.window.CustomEvent('value-changed',{detail:{value:57},bubbles:true}));await flush();
 assert.equal(env.calls.length,1);assert.equal(env.calls[0].data.volume_level,.57);
 env.update('media_player.a',{state:'unavailable'});const disabled=a.shadowRoot.querySelector('ha-control-slider');assert.equal(disabled.disabled,true);
 disabled.dispatchEvent(new env.window.CustomEvent('value-changed',{detail:{value:90},bubbles:true}));await flush();assert.equal(env.calls.length,1);
});
test('standard fallback shows percentage immediately during input without a service call',async()=>{
 const env=setup(),a=env.add();await flush();const slider=a.shadowRoot.querySelector('input[type=range]');slider.value='64';
 slider.dispatchEvent(new env.window.Event('input',{bubbles:true}));await flush();
 assert.equal(a.shadowRoot.querySelector('output').textContent,'64 %');assert.equal(slider.getAttribute('aria-valuetext'),'64 %');assert.equal(env.calls.length,0);
});
test('favorite management lists every user favorite and removes it from all cards without Radio Browser',async()=>{
 const env=setup(),a=env.add(),b=env.add('media_player.b');await flush();
 env.favoriteData.set('manuel',[station('one','Eins'),station('two','Zwei'),station('three','Drei')]);env.notifyFavorites('manuel');
 env.failBrowse=true;env.update('media_player.a',{state:'unavailable'});env.click(a,'open-radio');await flush();env.click(a,'manage-favorites');
 const boxes=()=>[...a.shadowRoot.querySelectorAll('[data-managed-favorite-id]')];
 assert.equal(boxes().length,3);assert(boxes().every(input=>input.hasAttribute('checked')&&!input.disabled));assert.equal(a.shadowRoot.querySelector('#search-field').hidden,true);
 for(let remaining=3;remaining>0;remaining--){const input=boxes()[0];input.checked=false;input.dispatchEvent(new env.window.Event('change',{bubbles:true}));await flush();assert.equal(boxes().length,remaining-1);assert.equal(b._favorites.length,remaining-1);}
 assert.match(a.shadowRoot.querySelector('#music-radio-results').textContent,/Keine Favoriten/);assert.equal(env.calls.length,0);
 env.favoriteData.set('manuel',[station('private','Privater Sender')]);env.notifyFavorites('manuel');env.switchUser('paul');
 assert(!a.shadowRoot.querySelector('#music-radio-results').textContent.includes('Privater Sender'));await flush();assert.equal(boxes().length,0);
});
test('favorite management ignores late browse results and retains checked favorite after write failure',async()=>{
 const env=setup(),a=env.add();await flush();env.favoriteData.set('manuel',[station('one','Eins')]);env.notifyFavorites('manuel');
 env.click(a,'open-radio');await flush();let finish;
 env.wsHook=msg=>msg.media_content_id===ROOT+'/popular'?new Promise(r=>{finish=()=>r({children:[station('other','Anderer Sender')]})}):undefined;
 env.click(a,'popular');await flush();env.click(a,'manage-favorites');finish();await flush();
 assert.equal(a._favoriteMode,true);assert(!a.shadowRoot.querySelector('#music-radio-results').textContent.includes('Anderer Sender'));
 env.failFavorites=true;let input=a.shadowRoot.querySelector('[data-managed-favorite-id]');input.checked=false;input.dispatchEvent(new env.window.Event('change',{bubbles:true}));await flush();
 assert.match(a.shadowRoot.querySelector('#music-radio-status').textContent,/nicht gespeichert/);assert.equal(a._favorites.length,1);assert(a.shadowRoot.querySelector('[data-managed-favorite-id]').hasAttribute('checked'));
 env.failFavorites=false;input=a.shadowRoot.querySelector('[data-managed-favorite-id]');input.checked=false;input.dispatchEvent(new env.window.Event('change',{bubbles:true}));await flush();assert.equal(a._favorites.length,0);
});

test('Apple Music opens beside radio below the favorites and missing setup stays actionable',async()=>{
 const env=setup(),card=env.add();await flush();
 const favorites=card.shadowRoot.querySelector('#music-favorites'),toolbar=favorites.nextElementSibling;
 assert.equal(favorites.children.length,0);assert.equal(favorites.querySelector('[data-action="open-apple"]'),null);
 assert.deepEqual([...toolbar.querySelectorAll('button')].map(b=>b.dataset.action),['open-radio','open-apple','manage-favorites','open-alarm-songs']);
 const before=env.wsCalls.length;toolbar.querySelector('[data-action="open-apple"]').click();await flush();
 assert.equal(card._appleDialog.open,true);assert.match(card._appleDialog.textContent,/Music-Manager-Connector/);assert.equal(env.wsCalls.length,before+1);
 assert.equal(card._appleQuery.disabled,true);assert.equal(Boolean(card._dialog.open),false);
});
test('Apple Music automatically resolves every card box without a manual MA entity',async()=>{
 const env=setup(),a=env.add(),b=env.add('media_player.b');
 env.wsHook=msg=>msg.type==='music_manager/apple_music'?msg.action==='status'?{account:'Manuel',entity_id:msg.source_entity==='media_player.a'?'media_player.ma_a':'media_player.ma_b'}:msg.action==='play'?{started:true}:{items:[{uri:'apple_music--a://track/42',title:'Ein Titel'}],more:false}:undefined;
 for(const [card,source,target] of [[a,'media_player.a','media_player.ma_a'],[b,'media_player.b','media_player.ma_b']]){
  env.click(card,'open-apple');await flush();assert.equal(card._appleItems.length,1);assert.equal(card._appleEntity,target);
  env.click(card,'apple-play');await flush();assert.equal(env.wsCalls.at(-1).source_entity,source);assert.equal(env.wsCalls.at(-1).entity_id,undefined);
  env.click(card,'next');await flush();assert.equal(env.wsCalls.at(-1).action,'next');assert.equal(env.wsCalls.at(-1).source_entity,source);
 }
 a.setConfig({entity:'media_player.b'});assert.equal(a._appleEntity,'');assert.equal(a._controlEntity,'media_player.b');
 env.switchUser('maximilian');assert.equal(b._appleEntity,'');assert.equal(b._appleAccount,'');
});
test('filtered Apple status stays actionable without a player fallback and retries after access is granted',async()=>{
 for(const manual of [false,true])for(const response of [null,{},[],{entity_id:null}]){
  const env=setup();env.wsHook=msg=>msg.type==='music_manager/apple_music'?response:undefined;
  const card=env.add();if(manual)card.setConfig({entity:'media_player.a',music_assistant_entity:'media_player.ma_a'});
  env.switchUser('paul');await flush();
  env.click(card,'open-apple');await flush();
  assert.equal(card._appleDialog.open,true);assert.equal(card._appleLoading,false);assert.equal(card._appleReady,false);
  assert.equal(card._appleEntity,'');assert.equal(card._appleAccount,'');assert.equal(card._appleItems.length,0);
  assert.match(card._appleDialog.textContent,/Music-Assistant-Entität.*Access Control.*Label/);
  assert(!card._appleDialog.textContent.includes('Cannot read properties'));
  assert.equal(card._appleQuery.disabled,true);assert.equal(card._controlEntity,'media_player.a');
  assert(env.wsCalls.filter(m=>m.type==='music_manager/apple_music').every(m=>m.action==='status'));
  assert.equal(env.calls.length,0);
  env.wsHook=msg=>msg.type==='music_manager/apple_music'?msg.action==='status'?{account:'Paul',entity_id:'media_player.ma_a'}:{items:[{uri:'apple_music--paul://playlist/42',title:'Pauls Playlist'}]}:undefined;
  card._appleDialog.close();env.click(card,'open-apple');await flush();
  assert.equal(card._appleAccount,'Paul');assert.equal(card._appleReady,true);assert.equal(card._appleQuery.disabled,false);
  assert.equal(card._appleItems[0].title,'Pauls Playlist');assert.equal(card._appleError,'');card.remove();
 }
});
test('filtered Apple catalog and play results never become a false empty library or successful start',async()=>{
 const env=setup();env.wsHook=msg=>msg.type==='music_manager/apple_music'?msg.action==='status'?{account:'Paul',entity_id:'media_player.ma_a'}:null:undefined;
 const card=env.add();env.click(card,'open-apple');await flush();
 assert.match(card._appleError,/leer oder unvollständig/);assert.equal(card._appleLoading,false);assert.equal(card._appleItems.length,0);
 env.wsHook=msg=>msg.type==='music_manager/apple_music'?msg.action==='status'?{account:'Paul',entity_id:'media_player.ma_a'}:msg.action==='play'?null:{items:[null,{uri:'apple_music--paul://playlist/42',title:'Pauls Playlist'}]}:undefined;
 card._appleDialog.close();env.click(card,'open-apple');await flush();assert.equal(card._appleItems.length,1);
 env.click(card,'apple-play');await flush();
 assert.equal(card._appleDialog.open,true);assert.equal(card._applePreferred,false);assert.notEqual(card._playbackSource,'apple');
 assert.match(card._appleError,/Access Control/);assert.equal(card._busy,false);assert.equal(env.calls.length,0);card.remove();
});
test('album and playlist tracks preserve navigation, retry pagination and save wake songs separately',async()=>{
 const env=setup(),a=env.add(),b=env.add('media_player.b');let failPage=true;
 const containers=['album','playlist'].map(media_type=>({uri:`apple_music--a://${media_type}/collection`,media_type,title:media_type+' collection'}));
 env.wsHook=msg=>{
  if(msg.type!=='music_manager/apple_music')return;
  if(msg.action==='status')return {account:'Manuel',entity_id:msg.source_entity==='media_player.a'?'media_player.ma_a':'media_player.ma_b'};
  if(msg.action==='tracks'){
   if(msg.offset&&failPage)throw new Error('Temporär nicht verfügbar');
   return {items:[{uri:'apple_music--a://track/'+(msg.offset||0),media_type:'track',title:'Song '+(msg.offset||0)}],more:!msg.offset,next_offset:(msg.offset||0)+50};
  }
  return {items:containers,more:false};
 };
 env.click(a,'open-apple');await flush();a._appleQuery.value='Kollektion';env.click(a,'apple-search');await flush();
 await a._action({action:'apple-tracks',data:{index:0}});assert.equal(env.wsCalls.at(-1).uri,containers[1].uri);
 assert.equal(env.wsCalls.at(-1).action,'tracks');assert.equal(env.wsCalls.at(-1).user_id,undefined);
 env.click(a,'apple-alarm-song');await flush();assert.equal(a._favorites.length,0);assert.equal(b._favorites.length,0);
 assert.equal(a._alarmSongs.length,1);assert.equal(b._alarmSongs.length,1);assert.equal(env.alarmSongData.get('manuel').length,1);
 assert.equal(env.wsCalls.filter(m=>m.type==='frontend/set_user_data'&&m.key==='music_manager_favorites').length,0);assert.equal(env.calls.length,0);
 env.click(a,'apple-more');await flush();assert.equal(a._appleItems.length,1);assert.match(a._appleError,/Temporär/);
 failPage=false;env.click(a,'apple-retry');await flush();assert.equal(env.wsCalls.at(-1).offset,50);assert.equal(a._appleItems.length,2);
 env.click(a,'apple-songs');await flush();assert.equal(a._appleItems.length,1);assert.equal(a._appleOwnSongs,true);
 env.click(a,'apple-back');await flush();assert.equal(a._appleContainer.uri,containers[1].uri);assert.equal(a._appleItems.length,2);
 env.click(a,'apple-back');await flush();assert.equal(a._appleSearch,true);assert.equal(a._appleQuery.value,'Kollektion');assert.equal(a._appleItems[0].uri,containers[1].uri);
 await a._action({action:'apple-library',data:{view:'album'}});env.click(a,'apple-tracks');await flush();assert.equal(env.wsCalls.at(-1).uri,containers[0].uri);a.remove();b.remove();
});
test('late private album tracks are discarded after a user or box change',async()=>{
 const env=setup();let finish;
 const album={uri:'apple_music--a://album/collection',media_type:'album',title:'Privates Album'};
 env.wsHook=msg=>msg.type==='music_manager/apple_music'?(msg.action==='status'?{account:'Manuel',entity_id:'media_player.ma_a'}:msg.action==='tracks'?new Promise(resolve=>{finish=()=>resolve({items:[{uri:'apple_music--a://track/private',title:'Privates Lied',media_type:'track'}]});}):{items:[album]}):undefined;
 const card=env.add();env.click(card,'open-apple');await flush();const pending=card._showAppleTracks(album);await flush();
 env.switchUser('paul');finish();await pending;await flush();
 assert.equal(card._appleDialog.open,false);assert.equal(card._appleItems.length,0);assert.equal(card._appleContainer,null);assert(!card._appleDialog.textContent.includes('Privates Lied'));card.remove();
});
test('legacy wake-song markers migrate out of shortcuts and remain private to each HA user',async()=>{
 const env=setup(),song={kind:'apple_music',uri:'apple_music--a://track/old',media_type:'track',title:'Old wake song',alarm_song:true};
 env.favoriteData.set('manuel',[station('radio'),song]);env.alarmSongData.set('paul',[{...song,uri:'apple_music--b://track/paul',title:'Pauls Lied'}]);
 const a=env.add(),b=env.add('media_player.b');await flush();
 assert.deepEqual(env.favoriteData.get('manuel').map(f=>f.title),['SWR3']);assert.equal(env.alarmSongData.get('manuel').length,1);
 assert.equal(a.shadowRoot.querySelectorAll('[data-action="play-favorite"]').length,1);assert.equal(a._alarmSongs[0].title,'Old wake song');
 env.switchUser('paul');assert.equal(a._alarmSongs.length,0);await flush();assert.equal(a._favorites.length,0);assert.equal(a._alarmSongs[0].title,'Pauls Lied');assert.equal(b._alarmSongs[0].title,'Pauls Lied');
 env.switchUser('manuel');await flush();assert.equal(a._alarmSongs[0].title,'Old wake song');a.remove();b.remove();
});
test('automatic MA queue controls are restored without opening the Apple Music picker',async()=>{
 const env=setup();
 env.wsHook=msg=>msg.type==='music_manager/apple_music'?(msg.action==='status'?{account:'Manuel',entity_id:'media_player.ma_a'}:{skipped:true}):undefined;
 env.update('media_player.ma_a',{attributes:{active_queue:'queue-a'}});
 const card=env.add();await flush();assert.equal(card._controlEntity,'media_player.ma_a');assert(!card._appleDialog.open);
 env.click(card,'next');await flush();assert.equal(env.wsCalls.at(-1).action,'next');assert.equal(env.wsCalls.at(-1).source_entity,'media_player.a');
 const before=env.wsCalls.filter(m=>m.type==='music_manager/apple_music').length;
 env.update('media_player.a',{attributes:{media_title:'Neuer Titel'}});await flush();
 assert.equal(env.wsCalls.filter(m=>m.type==='music_manager/apple_music').length,before);
});
test('Apple Music catalog and library use the authenticated gateway and selected speaker, never a user ID',async()=>{
 const env=setup(),card=env.add();card.setConfig({entity:'media_player.a',music_assistant_entity:'media_player.ma_a'});
 env.wsHook=msg=>msg.type==='music_manager/apple_music'?msg.action==='status'?{account:'Manuel',entity_id:'media_player.ma_a'}:msg.action==='play'?{started:true}:{items:[{uri:'apple_music--a://track/42',title:'Ein Titel',description:'Interpret · Titel'}],more:false}:undefined;
 env.click(card,'open-apple');await flush();assert.equal(card._appleAccount,'Manuel');assert.equal(card._appleItems.length,1);
 await card._action({action:'apple-library',data:{view:'track'}});card._appleQuery.value='Mein Titel';env.click(card,'apple-search');await flush();
 const search=env.wsCalls.at(-1);assert.equal(search.action,'search');assert.equal(search.query,'Mein Titel');assert.equal(search.entity_id,'media_player.ma_a');assert.equal(search.source_entity,'media_player.a');assert.equal(search.user_id,undefined);assert.equal(search.provider_id,undefined);
 env.click(card,'apple-play');await flush();assert.equal(env.wsCalls.at(-1).action,'play');assert.equal(env.wsCalls.at(-1).uri,'apple_music--a://track/42');assert.equal(card._appleDialog.open,false);
 env.click(card,'next');await flush();assert.equal(env.wsCalls.at(-1).action,'next');assert.equal(env.wsCalls.at(-1).source_entity,'media_player.a');
 await card._playStation(station('swr3'));assert.equal(env.calls.at(-1).data.entity_id,'media_player.a');assert.equal(card._applePreferred,false);
});
test('Apple Music user changes and box changes discard pending private catalog results',async()=>{
 const env=setup(),card=env.add();card.setConfig({entity:'media_player.a',music_assistant_entity:'media_player.ma_a'});
 let finish;
 env.wsHook=msg=>msg.type==='music_manager/apple_music'?msg.action==='status'?{account:'Manuel',entity_id:'media_player.ma_a'}:new Promise(resolve=>{finish=()=>resolve({items:[{uri:'apple_music--a://track/1',title:'Privater Titel'}]});}):undefined;
 env.click(card,'open-apple');await flush();assert.equal(card._appleLoading,true);env.switchUser('maximilian');finish();await flush();
 assert.equal(card._appleDialog.open,false);assert.equal(card._appleItems.length,0);assert.equal(card._appleAccount,'');assert(!card._appleDialog.textContent.includes('Privater Titel'));
 env.click(card,'open-apple');await flush();card.setConfig({entity:'media_player.b',music_assistant_entity:'media_player.ma_b'});finish();await flush();assert.equal(card._appleItems.length,0);assert.equal(card._appleDialog.open,false);
});
test('Apple Music setup and playback errors keep the picker open, escaped and retriable',async()=>{
 const env=setup(),card=env.add();card.setConfig({entity:'media_player.a',music_assistant_entity:'media_player.ma_a'});
 env.wsHook=msg=>{if(msg.type==='music_manager/apple_music')throw {code:'unknown_command'};};
 env.click(card,'open-apple');await flush();assert.match(card._appleDialog.textContent,/Connector/);assert.equal(card._appleLoading,false);
 env.wsHook=msg=>{if(msg.type!=='music_manager/apple_music')return;if(msg.action==='status')return {account:'Manuel',entity_id:'media_player.ma_a'};if(msg.action==='play')throw new Error('Box nicht erreichbar');return {items:[{uri:'apple_music--a://track/1',title:'<img src=x onerror=bad()>',description:'<script>bad()</script>'}]};};
 env.click(card,'open-apple');await flush();assert.equal(card._appleDialog.querySelector('img,script'),null);env.click(card,'apple-play');await flush();assert.equal(card._appleDialog.open,true);assert.match(card._appleDialog.textContent,/Box nicht erreichbar/);assert.equal(card._busy,false);assert.equal(card._appleItems.length,1);
});
test('Apple Music library pagination preserves items and editor offers only the same Sonos hardware',async()=>{
 const env=setup(),card=env.add();card.setConfig({entity:'media_player.a',music_assistant_entity:'media_player.ma_a'});
 env.wsHook=msg=>msg.type==='music_manager/apple_music'?msg.action==='status'?{account:'Manuel',entity_id:'media_player.ma_a'}:{items:[{uri:'apple_music--a://playlist/'+(msg.offset||0),title:'Playlist '+(msg.offset||0)}],more:!msg.offset,next_offset:50}:undefined;
 env.click(card,'open-apple');await flush();env.click(card,'apple-more');await flush();assert.equal(card._appleItems.length,2);assert.equal(env.wsCalls.at(-1).offset,50);
 const editor=env.document.createElement('music-manager-card-editor');editor.setConfig({entity:'media_player.a'});editor.hass=env.makeHass();env.document.body.append(editor);await flush();
 assert.deepEqual([...editor.shadowRoot.querySelectorAll('#music-ma-entity-options [data-ui-option]')].map(o=>o.dataset.value),['','media_player.ma_a']);
 const events=[];editor.addEventListener('config-changed',e=>{events.push(e.detail.config);editor.setConfig(e.detail.config);});editor.shadowRoot.querySelector('#music-ma-entity-options [data-value="media_player.ma_a"]').click();await flush();assert.equal(events.at(-1).music_assistant_entity,'media_player.ma_a');
 editor.shadowRoot.querySelector('#music-entity-options [data-value="media_player.b"]').click();await flush();assert.equal(events.at(-1).music_assistant_entity,'');
});

test('radio selection immediately replaces stale MA and Sonos track metadata and control target',async()=>{
 const env=setup(),card=env.add();card.setConfig({entity:'media_player.a',music_assistant_entity:'media_player.ma_a'});
 env.update('media_player.a',{attributes:{media_title:'Alter Apple-Titel',media_artist:'Alter Interpret',media_channel:'Alter Apple-Kanal'}});
 env.update('media_player.ma_a',{attributes:{active_queue:'old-queue',media_title:'Alter Apple-Titel',media_duration:240,media_position:20}});
 assert.equal(card._controlEntity,'media_player.ma_a');
 await card._playStation(station('swr3'));assert.equal(card._controlEntity,'media_player.a');
 assert.match(card.shadowRoot.querySelector('#player').textContent,/SWR3/);assert(!card.shadowRoot.querySelector('#player').textContent.includes('Alter Apple-'));
 env.update('media_player.ma_a',{attributes:{active_queue:'old-queue',media_title:'Später alter Apple-Titel'}});
 assert.equal(card._controlEntity,'media_player.a');assert(!card.shadowRoot.querySelector('#player').textContent.includes('Apple-Titel'));
 assert.equal(card.shadowRoot.querySelector('#music-seek'),null);assert.equal(card.shadowRoot.querySelector('[data-action="shuffle"]'),null);
 env.click(card,'next');await flush();assert.equal(env.calls.at(-1).data.entity_id,'media_player.a');
 env.update('media_player.a',{attributes:{media_title:'Neuer Radio-Titel',media_channel:'SWR3'}});
 assert.match(card.shadowRoot.querySelector('#player').textContent,/Neuer Radio-Titel/);card.remove();
});
test('failed radio switch preserves Apple playback and a successful Apple start releases radio mode',async()=>{
 const env=setup(),card=env.add();card.setConfig({entity:'media_player.a',music_assistant_entity:'media_player.ma_a'});
 env.update('media_player.ma_a',{attributes:{active_queue:'queue'}});
 env.failService=true;await card._playStation(station('swr3'));assert.equal(card._controlEntity,'media_player.ma_a');
 env.failService=false;await card._playStation(station('swr3'));assert.equal(card._controlEntity,'media_player.a');
 env.wsHook=msg=>msg.type==='music_manager/apple_music'?{started:true}:undefined;
 await card._playApple({uri:'apple_music--a://track/42'});assert.equal(card._controlEntity,'media_player.ma_a');assert.equal(card._selectedStation,null);card.remove();
});
test('native radio wins over stale MA queues after recreation, user changes and late updates',async()=>{
 const env=setup();
 env.wsHook=msg=>msg.type==='music_manager/apple_music'&&msg.action==='status'?{entity_id:'media_player.ma_a'}:undefined;
 env.update('media_player.a',{attributes:{media_content_id:'x-rincon-mp3radio://radio.example/swr3',media_channel:'SWR3',media_title:'Aktueller Radiotitel',media_duration:null}});
 env.update('media_player.ma_a',{attributes:{active_queue:'old-queue',media_title:'Alter Apple-Titel',media_duration:240,media_position:30}});
 const first=env.add(),second=env.add();await flush();
 for(const card of [first,second]){assert.equal(card._controlEntity,'media_player.a');assert.match(card._player.textContent,/SWR3/);assert(!card._player.textContent.includes('Alter Apple'));assert.equal(card.shadowRoot.querySelector('#music-seek'),null);}
 for(let i=0;i<3;i++){env.update('media_player.ma_a',{attributes:{media_title:'Später Apple-Titel '+i}});env.update('media_player.a',{attributes:{volume_level:0.2+i/10}});assert.equal(second._controlEntity,'media_player.a');assert(!second._player.textContent.includes('Apple-Titel'));}
 first.remove();const recreated=env.add();await flush();env.switchUser('vera');await flush();
 assert.equal(recreated._controlEntity,'media_player.a');assert.match(recreated._player.textContent,/SWR3/);
 env.click(recreated,'next');await flush();assert.equal(env.calls.at(-1).data.entity_id,'media_player.a');
 second.remove();recreated.remove();
});
test('radio station stays pinned through partial old Sonos metadata and follows later external source changes',async()=>{
 const env=setup(),card=env.add();card.setConfig({entity:'media_player.a',music_assistant_entity:'media_player.ma_a'});
 const flow='http://ma.example:8095/flow/session/queue/item/player.aac';
 env.update('media_player.a',{attributes:{media_content_id:flow,media_channel:'Apple Music',media_title:'Alter Apple-Titel',media_duration:null}});
 env.update('media_player.ma_a',{attributes:{active_queue:'queue',media_title:'Alter Apple-Titel',media_duration:240}});
 await card._playStation(station('swr3'));
 env.update('media_player.a',{attributes:{media_artist:'Noch alter Interpret',media_duration:240}});
 assert.equal(card._controlEntity,'media_player.a');assert.match(card._player.textContent,/SWR3/);assert(!card._player.querySelector('.music-now-playing').textContent.includes('Apple Music'));assert(!card._player.textContent.includes('Alter Apple-Titel'));
 env.update('media_player.a',{attributes:{media_content_id:'https://radio.example/swr3'}});
 assert.match(card._player.textContent,/SWR3/);assert(!card._player.querySelector('.music-now-playing').textContent.includes('Apple Music'));
 env.update('media_player.a',{attributes:{media_channel:'SWR3'}});assert(!card._player.textContent.includes('Alter Apple-Titel'));
 env.update('media_player.a',{attributes:{media_duration:null,media_title:'Neuer Radiotitel'}});assert.match(card._player.textContent,/Neuer Radiotitel/);
 env.update('media_player.a',{attributes:{media_content_id:flow,media_channel:'Music Assistant'}});assert.equal(card._controlEntity,'media_player.ma_a');
 env.update('media_player.a',{attributes:{media_content_id:'https://radio.example/energy',media_channel:'Energy',media_title:'Energy Song'}});assert.match(card._player.textContent,/Energy/);assert(!card._player.textContent.includes('SWR3'));
 env.update('media_player.a',{attributes:{media_content_id:flow,media_channel:'Music Assistant'}});assert.equal(card._controlEntity,'media_player.ma_a');assert(card.shadowRoot.querySelector('#music-seek'));card.remove();
});
test('a real MA flow remains controllable after recreation and a new Apple start tolerates old radio transport briefly',async()=>{
 const env=setup(),card=env.add();card.setConfig({entity:'media_player.a',music_assistant_entity:'media_player.ma_a'});
 env.update('media_player.a',{attributes:{media_content_id:'x-rincon-mp3radio://ma.example:8095/flow/session/queue/item/player.aac',media_channel:'Music Assistant',media_duration:null}});
 env.update('media_player.ma_a',{attributes:{active_queue:'queue',media_title:'Aktueller Apple-Titel',media_duration:240}});
 assert.equal(card._controlEntity,'media_player.ma_a');assert(card.shadowRoot.querySelector('#music-seek'));
 env.update('media_player.a',{attributes:{media_content_id:'https://radio.example/swr3',media_channel:'SWR3'}});assert.equal(card._controlEntity,'media_player.a');
 env.wsHook=msg=>msg.type==='music_manager/apple_music'&&msg.action==='play'?{started:true}:undefined;
 await card._playApple({uri:'apple_music--a://album/42'});assert.equal(card._controlEntity,'media_player.ma_a');
 card._playbackIntent.until=0;env.update('media_player.ma_a',{attributes:{media_title:'Nur alter Queue-Titel'}});assert.equal(card._controlEntity,'media_player.a');
 env.update('media_player.a',{attributes:{media_content_id:'http://ma.example:8095/single/session/queue/item/player.flac'}});assert.equal(card._controlEntity,'media_player.ma_a');card.remove();
});
test('Apple shuffle controls the selected MA player and reflects confirmed state and service errors',async()=>{
 const env=setup(),card=env.add(),other=env.add('media_player.b');card.setConfig({entity:'media_player.a',music_assistant_entity:'media_player.ma_a'});
 env.update('media_player.ma_a',{attributes:{active_queue:'queue',shuffle:false}});
 assert.equal(card.shadowRoot.querySelector('[data-action="stop"]'),null);assert.deepEqual([...card.shadowRoot.querySelectorAll('.music-transport button')].map(b=>b.dataset.action),['previous','play-pause','next','shuffle']);assert.equal(card.shadowRoot.querySelector('[data-action="shuffle"]').textContent,'');env.click(card,'shuffle');await flush();assert.equal(env.calls.at(-1).service,'shuffle_set');assert.equal(env.calls.at(-1).data.shuffle,true);assert.equal(env.calls.at(-1).data.entity_id,'media_player.ma_a');
 env.update('media_player.ma_a',{attributes:{shuffle:true}});assert.equal(card.shadowRoot.querySelector('[data-action="shuffle"]').getAttribute('aria-pressed'),'true');
 env.failService=true;env.click(card,'shuffle');await flush();assert.equal(env.calls.at(-1).data.shuffle,false);assert.match(card.shadowRoot.querySelector('#music-player-status').textContent,/Keine Berechtigung/);
 assert.equal(other.shadowRoot.querySelector('[data-action="shuffle"]'),null);card.remove();other.remove();
});
test('Apple timeline preserves a drag, formats time, seeks once on release and restores failed positions',async()=>{
 const env=setup(),card=env.add();card.setConfig({entity:'media_player.a',music_assistant_entity:'media_player.ma_a'});
 env.update('media_player.ma_a',{state:'paused',attributes:{active_queue:'queue',media_content_id:'track-a',media_duration:240,media_position:20}});
 let slider=card.shadowRoot.querySelector('#music-seek');assert(slider);slider.value='125';slider.dispatchEvent(new env.window.Event('input',{bubbles:true}));await flush();assert.equal(env.calls.length,0);
 assert.equal(slider.getAttribute('aria-valuetext'),'2:05 / 4:00');
 env.update('media_player.ma_a',{attributes:{media_position:33}});assert.equal(card.shadowRoot.querySelector('#music-seek'),slider);assert.equal(slider.value,'125');
 slider.dispatchEvent(new env.window.Event('change',{bubbles:true}));await flush();assert.equal(env.calls.length,1);assert.equal(env.calls[0].service,'media_seek');assert.equal(env.calls[0].data.seek_position,125);assert.equal(env.calls[0].data.entity_id,'media_player.ma_a');
 env.failService=true;slider=card.shadowRoot.querySelector('#music-seek');slider.value='200';slider.dispatchEvent(new env.window.Event('input',{bubbles:true}));slider.dispatchEvent(new env.window.Event('change',{bubbles:true}));await flush();
 assert.equal(card.shadowRoot.querySelector('#music-seek').value,'33');assert.match(card.shadowRoot.querySelector('#music-player-status').textContent,/Keine Berechtigung/);card.remove();
});
test('a track or box change cancels an in-progress seek and live radio has no timeline',async()=>{
 const env=setup(),card=env.add();card.setConfig({entity:'media_player.a',music_assistant_entity:'media_player.ma_a'});
 env.update('media_player.ma_a',{state:'paused',attributes:{active_queue:'queue',media_content_id:'a',media_duration:200,media_position:10}});
 const slider=card.shadowRoot.querySelector('#music-seek');slider.value='100';slider.dispatchEvent(new env.window.Event('input',{bubbles:true}));
 env.update('media_player.ma_a',{attributes:{media_content_id:'b',media_position:0}});slider.dispatchEvent(new env.window.Event('change',{bubbles:true}));await flush();assert.equal(env.calls.length,0);
 env.update('media_player.ma_a',{attributes:{media_duration:0}});assert.equal(card.shadowRoot.querySelector('#music-seek'),null);
 card.setConfig({entity:'media_player.b'});assert.equal(card.shadowRoot.querySelector('#music-seek'),null);card.remove();
});
test('next-track feedback appears immediately and repeated clicks do not duplicate a pending skip',async()=>{
 const env=setup(),card=env.add();card.setConfig({entity:'media_player.a',music_assistant_entity:'media_player.ma_a'});
 env.update('media_player.ma_a',{attributes:{active_queue:'queue'}});let finish;
 env.wsHook=msg=>msg.type==='music_manager/apple_music'&&msg.action==='next'?new Promise(resolve=>{finish=()=>resolve({skipped:true});}):undefined;
 env.click(card,'next');await flush();assert.match(card.shadowRoot.querySelector('#music-player-status').textContent,/Nächster Titel wird geladen/);
 await card._action({action:'next'});assert.equal(env.wsCalls.filter(m=>m.action==='next').length,1);finish();await flush();assert.equal(card._busy,false);card.remove();
});

test('Apple albums and playlists can be starred, share shortcuts across boxes and play on the selected box',async()=>{
 const env=setup(),a=env.add(),b=env.add('media_player.b');await flush();
 env.favoriteData.set('manuel',[station('radio','Radio')]);env.notifyFavorites('manuel');
 env.wsHook=msg=>{
  if(msg.type!=='music_manager/apple_music')return;
  if(msg.action==='status')return {account:'Manuel',entity_id:msg.source_entity==='media_player.a'?'media_player.ma_a':'media_player.ma_b'};
  if(msg.action==='play')return {started:true};
  const kind=msg.media_type||'playlist';return {items:[{uri:'apple_music--a://'+kind+'/42',media_type:kind,title:kind==='album'?'Mein Album':'Meine Playlist',description:kind}],more:false};
 };
 env.click(a,'open-apple');await flush();env.click(a,'apple-favorite');await flush();assert.equal(env.favoriteData.get('manuel')[1].kind,'apple_music');
 await a._action({action:'apple-library',data:{view:'album'}});await flush();env.click(a,'apple-favorite');await flush();
 assert.deepEqual(env.favoriteData.get('manuel').map(f=>f.title),['Radio','Meine Playlist','Mein Album']);assert.equal(b._favorites.length,3);
 a._appleDialog.close();await b._action({action:'play-favorite',data:{index:1}});await flush();
 assert.equal(env.wsCalls.at(-1).action,'play');assert.equal(env.wsCalls.at(-1).uri,'apple_music--a://playlist/42');assert.equal(env.wsCalls.at(-1).source_entity,'media_player.b');assert.equal(env.calls.length,0);
 env.wsHook=msg=>{if(msg.type==='music_manager/apple_music'&&msg.action==='play')throw {code:'invalid_media',message:'Dieser Eintrag gehört nicht zu deinem Apple-Music-Konto.'};};
 await b._action({action:'play-favorite',data:{index:2}});await flush();assert.match(b.shadowRoot.querySelector('#music-player-status').textContent,/gehört nicht/);assert.equal(env.calls.length,0);
 env.switchUser('vera');await flush();assert.equal(a._favorites.length,0);assert.equal(b._favorites.length,0);a.remove();b.remove();
});
test('mixed favorites can be reordered and removed without Radio Browser and failed sorting retains their order',async()=>{
 const env=setup(),a=env.add(),b=env.add('media_player.b');await flush();
 const album={kind:'apple_music',uri:'apple_music--a://album/42',media_type:'album',title:'Album'};
 env.favoriteData.set('manuel',[station('one','Eins'),album,station('two','Zwei')]);env.notifyFavorites('manuel');env.failBrowse=true;
 env.click(a,'manage-favorites');await flush();assert.equal(a._dialog.open,true);assert.equal(a.shadowRoot.querySelectorAll('[data-managed-favorite-id]').length,3);
 assert(a.shadowRoot.querySelector('[data-action="move-favorite"][data-direction="up"]').disabled);
 await a._moveFavorite(album.uri,'up');await flush();assert.deepEqual(env.favoriteData.get('manuel').map(f=>f.title),['Album','Eins','Zwei']);assert.equal(b._favorites[0].title,'Album');
 env.failFavorites=true;await a._moveFavorite(album.uri,'down');await flush();assert.equal(a._favorites[0].title,'Album');assert.match(a._dialog.textContent,/nicht sortiert/);
 env.failFavorites=false;const checkbox=[...a.shadowRoot.querySelectorAll('[data-managed-favorite-id]')].find(el=>el.dataset.managedFavoriteId===album.uri);checkbox.checked=false;checkbox.dispatchEvent(new env.window.Event('change',{bubbles:true}));await flush();
 assert.deepEqual(env.favoriteData.get('manuel').map(f=>f.title),['Eins','Zwei']);assert.equal(b._favorites.length,2);assert(!env.wsCalls.some(m=>m.type==='media_source/browse_media'));a.remove();b.remove();
});
test('Apple tracks can be marked as alarm songs while failed writes preserve favorites',async()=>{
 const env=setup(),card=env.add();await flush();
 env.wsHook=msg=>msg.type==='music_manager/apple_music'?msg.action==='status'?{account:'Manuel',entity_id:'media_player.ma_a'}:{items:[{uri:'apple_music--a://'+msg.media_type+'/42',media_type:msg.media_type,title:'Titel'}]}:undefined;
 env.click(card,'open-apple');await flush();env.failFavorites=true;env.click(card,'apple-favorite');await flush();assert.match(card._appleDialog.textContent,/nicht gespeichert/);assert.equal(card._favorites.length,0);
 env.failFavorites=false;await card._action({action:'apple-library',data:{view:'track'}});await flush();env.click(card,'apple-alarm-song');await flush();assert.equal(card._favorites.length,0);assert.equal(card._alarmSongs[0].media_type,'track');assert.equal(env.alarmSongData.get('manuel').length,1);assert.equal(card._appleDialog.querySelector('[data-action="apple-alarm-song"]').getAttribute('aria-pressed'),'true');env.click(card,'apple-alarm-song');await flush();assert.equal(card._alarmSongs.length,0);assert.equal(card._favorites.length,0);card.remove();
});


test('wake-song management opens without MA setup, filters and removes independently of favorites',async()=>{
 const env=setup(),songs=[{kind:'apple_music',uri:'apple_music--a://track/morning',media_type:'track',title:'Guten Morgen'},{kind:'apple_music',uri:'apple_music--a://track/sun',media_type:'track',title:'Sonne'}];
 env.alarmSongData.set('manuel',songs);env.favoriteData.set('manuel',[station('swr3')]);
 const a=env.add(),b=env.add('media_player.b');await flush();const before=env.wsCalls.filter(m=>m.type==='music_manager/apple_music').length;
 env.click(a,'open-alarm-songs');await flush();
 assert.equal(a._appleDialog.open,true);assert.match(a._appleDialog.textContent,/Wecklieder verwalten/);
 assert.equal(a._appleDialog.querySelectorAll('[data-action="remove-alarm-song"]').length,2);
 assert.equal(env.wsCalls.filter(m=>m.type==='music_manager/apple_music').length,before);
 const search=a._alarmSongInput;search.focus();search.value='morgen';search.dispatchEvent(new env.window.Event('input',{bubbles:true}));
 assert.equal(a._appleDialog.querySelectorAll('[data-action="remove-alarm-song"]').length,1);assert.equal(a.shadowRoot.querySelector('#music-alarm-song-query'),search);
 env.failFavorites=true;env.click(a,'remove-alarm-song');await flush();assert.equal(a._alarmSongs.length,2);assert.match(a._appleDialog.textContent,/nicht gespeichert/);
 env.failFavorites=false;env.click(a,'remove-alarm-song');await flush();assert.equal(a._alarmSongs.length,1);assert.equal(b._alarmSongs.length,1);assert.equal(env.favoriteData.get('manuel').length,1);assert.equal(env.calls.length,0);
 assert.match(a.shadowRoot.getElementById('music-apple-results').textContent,/Keine passenden/);
 env.switchUser('paul');await flush();assert.equal(a._alarmSongs.length,0);assert.equal(a._alarmSongInput.value,'');assert.equal(a._appleDialog.open,false);
 a.remove();b.remove();
});

test('wake-song clocks use an outline when off and a filled face when selected, like favorite stars',async()=>{
 const env=setup(),card=env.add();env.wsHook=msg=>msg.type==='music_manager/apple_music'?msg.action==='status'?{account:'Manuel',entity_id:'media_player.ma_a'}:{items:[{uri:'apple_music--a://track/song',media_type:'track',title:'Lied'}]}:undefined;
 await flush();env.click(card,'open-apple');await flush();
 const clock=()=>card._appleDialog.querySelector('[data-action="apple-alarm-song"]');
 assert.equal(clock().getAttribute('aria-pressed'),'false');assert.equal(clock().querySelector('svg').dataset.musicIcon,'alarm');
 env.click(card,'apple-alarm-song');await flush();assert.equal(clock().getAttribute('aria-pressed'),'true');assert.equal(clock().querySelector('svg').dataset.musicIcon,'alarmFilled');
 assert.equal(card._appleDialog.querySelector('[data-action="apple-favorite"]').getAttribute('aria-pressed'),'false');
 env.click(card,'apple-favorite');await flush();assert.equal(card._appleDialog.querySelector('[data-action="apple-favorite"]').getAttribute('aria-pressed'),'true');assert.equal(clock().querySelector('svg').dataset.musicIcon,'alarmFilled');
 env.click(card,'apple-alarm-song');await flush();assert.equal(clock().querySelector('svg').dataset.musicIcon,'alarm');assert.equal(card._favorites.length,1);card.remove();
});

test('alarm row searches a visible list without replacing its focused input and saves only an owned song',async()=>{
 const env=setup(),row=env.document.createElement('music-manager-alarm-row');let selected=null;
 const songs=[{uri:'apple_music--a://track/morning',media_type:'track',title:'Guten Morgen'},{uri:'apple_music--a://track/sun',media_type:'track',title:'Sonne'}];
 env.wsHook=msg=>msg.type==='music_manager/alarm'?(msg.action==='select'&&(selected=songs.find(s=>s.uri===msg.uri)),{owner:'Maximilian',source:'Sonos',songs,selection:selected,in_songs:true}):undefined;
 row.setConfig({alarm_id:'school_alarm'});env.document.body.append(row);row.hass=env.makeHass();await flush();env.click(row,'alarm-open');await flush();
 assert.equal(row._dialog.querySelectorAll('[data-action="alarm-select"]').length,2);assert.equal(row._dialog.querySelector('[role="combobox"]'),null);
 const search=row.shadowRoot.getElementById('alarm-song-query');search.focus();search.value='son';search.dispatchEvent(new env.window.Event('input',{bubbles:true}));
 assert.equal(row.shadowRoot.querySelector('#alarm-song-query'),search);assert.equal(row._dialog.querySelectorAll('[data-action="alarm-select"]').length,1);
 env.click(row,'alarm-select');await flush();assert.equal(row._data.selection.uri,songs[1].uri);assert.equal(row._dialog.open,false);assert.equal(env.calls.length,0);row.remove();
});

test('alarm row loads its configured owner, persists an exact favorite and keeps the previous choice after save errors',async()=>{
 const env=setup(), row=env.document.createElement('music-manager-alarm-row');
 const favorite={uri:'apple_music--a://track/wake',title:'Aufwachen',media_type:'track'};
 let selected=null,fail=false;
 env.wsHook=msg=>{if(msg.type==='music_manager/alarm'){
  if(msg.action==='select'){if(fail)throw new Error('Speichern fehlgeschlagen');selected=msg.uri?favorite:null;}
  return {alarm_id:msg.alarm_id,owner:'Maximilian',source:'Maximilians Sonos',selection:selected,favorites:[favorite],in_favorites:true};
 }};
 row.setConfig({alarm_id:'school_alarm',name:'Weckmusik'});env.document.body.append(row);row.hass=env.makeHass();await flush();
 assert.equal(env.wsCalls.filter(m=>m.type==='music_manager/alarm').length,1);assert.match(row.shadowRoot.querySelector('#alarm-row').textContent,/Letzte Sonos-Wiedergabe/);
 env.click(row,'alarm-open');await flush();assert.match(row._dialog.textContent,/Maximilian/);
 await row._action({action:'alarm-select',value:favorite.uri});assert.equal(row._dialog.open,false);assert.equal(row._data.selection.title,'Aufwachen');
 const call=env.wsCalls.at(-1);assert.equal(call.uri,favorite.uri);assert.equal(call.alarm_id,'school_alarm');assert.equal(call.user_id,undefined);assert.equal(call.source_entity,undefined);
 env.click(row,'alarm-open');await flush();fail=true;await row._action({action:'alarm-select',value:''});
 assert.equal(row._dialog.open,true);assert.equal(row._data.selection.title,'Aufwachen');assert.match(row._dialog.textContent,/Speichern fehlgeschlagen/);
 fail=false;await row._action({action:'alarm-select',value:''});assert.equal(row._data.selection,null);assert.equal(env.calls.length,0);row.remove();
});
test('alarm row never leaks a late previous users choice or saves arbitrary catalog URIs',async()=>{
 const env=setup(),row=env.document.createElement('music-manager-alarm-row');let finish;
 env.wsHook=msg=>msg.type==='music_manager/alarm'?new Promise(resolve=>{finish=()=>resolve({owner:'Maximilian',selection:{title:'Private Weckmusik',uri:'apple_music--a://album/42'},favorites:[]});}):undefined;
 row.setConfig({alarm_id:'school_alarm'});env.document.body.append(row);row.hass=env.makeHass();await flush();const old=finish;
 const hass=env.makeHass('paul');hass.callWS=async()=>{throw new Error('Dieser Wecker gehört einem anderen Benutzer.');};row.hass=hass;old();await flush();
 assert.equal(row._data,null);assert(!row.shadowRoot.querySelector('#alarm-row').textContent.includes('Private Weckmusik'));assert.match(row.shadowRoot.querySelector('#alarm-row').textContent,/anderen Benutzer/);
 const before=env.wsCalls.length;await row._action({action:'alarm-select',value:'apple_music--a://album/not-favorited'});assert.equal(env.wsCalls.length,before);row.remove();
});
test('alarm row retains an unstarred saved favorite and handles missing assignment without creating a mapping',async()=>{
 const env=setup(),row=env.document.createElement('music-manager-alarm-row');
 env.wsHook=msg=>msg.type==='music_manager/alarm'?{owner:'Maximilian',source:'Sonos',selection:{uri:'apple_music--a://album/42',title:'Gespeichertes Album'},favorites:[],in_favorites:false}:undefined;
 row.setConfig({alarm_id:'school_alarm'});env.document.body.append(row);row.hass=env.makeHass();await flush();env.click(row,'alarm-open');await flush();
 assert.match(row._dialog.textContent,/Weckmusik bleibt gespeichert/);assert.equal(row._dialog.querySelectorAll('[data-ui-option]').length,0);assert.match(row._dialog.textContent,/Gespeichertes Album/);row._dialog.close();
 env.wsHook=()=>{throw new Error('Wecker unter Konfigurieren zuordnen.');};await row._load(true);assert.match(row.shadowRoot.querySelector('#alarm-row').textContent,/zuordnen/);
 assert(env.wsCalls.every(m=>m.type==='music_manager/alarm'&&m.action==='get'));row.remove();
});

test('player saves one box per authenticated user without changing configured entity or favorites',async()=>{
 const env=setup();env.favoriteData.set('manuel',[station('m','Manuels Sender')]);env.favoriteData.set('vera',[station('v','Veras Sender')]);
 const card=env.addPlayer();await flush();assert(card.shadowRoot.querySelector('#music-player-box'));
 await card._selectBox('media_player.b');assert.equal(card._config.entity,'media_player.b');assert.equal(card._initialConfig.entity,'media_player.a');
 env.click(card,'next');await flush();assert.equal(env.calls.at(-1).data.entity_id,'media_player.b');assert.equal(card._favorites[0].title,'Manuels Sender');
 env.switchUser('vera');await flush();assert.equal(card._config.entity,'media_player.a');assert.equal(card._favorites[0].title,'Veras Sender');
 await card._selectBox('media_player.b');env.switchUser('manuel');await flush();assert.equal(card._config.entity,'media_player.b');assert.equal(card._favorites[0].title,'Manuels Sender');
 const second=env.addPlayer();await flush();assert.equal(second._config.entity,'media_player.b');
 assert(env.wsCalls.filter(m=>m.type==='music_manager/player_navigation').every(m=>!('user_id' in m)));
});
test('player children cannot change the initial box even if a previous user selected a different one',async()=>{
 const env=setup(),card=env.addPlayer();await flush();await card._selectBox('media_player.b');
 for(const user of ['maximilian','paul']){env.switchUser(user);await flush();assert.equal(card._config.entity,'media_player.a');assert.equal(card.shadowRoot.querySelector('#music-player-box'),null);await card._selectBox('media_player.b');assert.equal(card._config.entity,'media_player.a');env.click(card,'next');await flush();assert.equal(env.calls.at(-1).data.entity_id,'media_player.a');}
});
test('player navigation rejects stale user responses, invalid choices and failed saves',async()=>{
 const env=setup(),card=env.addPlayer();await flush();let finish;
 env.wsHook=msg=>msg.type==='music_manager/player_navigation'&&msg.action==='select'?new Promise(resolve=>{finish=resolve}):undefined;
 const changing=card._selectBox('media_player.b');env.switchUser('paul');await flush();finish({can_select:true,entity_id:'media_player.b',players:[{entity_id:'media_player.b',name:'B'}]});await changing;
 assert.equal(card._config.entity,'media_player.a');assert.equal(card._canSelectBox,false);
 env.wsHook=null;env.switchUser('manuel');await flush();const count=env.wsCalls.length;await card._selectBox('media_player.tv');assert.equal(env.wsCalls.length,count);
 env.wsHook=msg=>{if(msg.type==='music_manager/player_navigation'&&msg.action==='select')throw new Error('Offline');};
 await card._selectBox('media_player.b');assert.equal(card._config.entity,'media_player.a');assert.match(card.shadowRoot.querySelector('.fui-player-navigation-status').textContent,/nicht gespeichert/);
});
test('player switching clears old radio and MA state and resolves Apple against the new box',async()=>{
 const env=setup();env.wsHook=msg=>msg.type==='music_manager/apple_music'&&msg.action==='status'?{entity_id:msg.source_entity==='media_player.a'?'media_player.ma_a':'media_player.ma_b',account:'Personal'}:undefined;
 const card=env.addPlayer('media_player.a',{music_assistant_entity:'media_player.ma_a'});await flush();card._selectedStation=station('swr3');card._playbackSource='radio';card._radioContentId='old';
 await card._selectBox('media_player.b');await flush();assert.equal(card._selectedStation,null);assert.equal(card._radioContentId,null);assert.equal(card._musicAssistantEntity,'media_player.ma_b');assert.equal(card._config.music_assistant_entity,'');
 assert(env.wsCalls.some(m=>m.type==='music_manager/apple_music'&&m.source_entity==='media_player.b'&&!m.entity_id));
});
test('player navigation is isolated by card id and regular card keeps its configured target',async()=>{
 const env=setup(),regular=env.add(),first=env.addPlayer('media_player.a',{navigation_id:'one'}),second=env.addPlayer('media_player.a',{navigation_id:'two'});await flush();
 await first._selectBox('media_player.b');assert.equal(second._config.entity,'media_player.a');assert.equal(regular._config.entity,'media_player.a');
 first.remove();env.document.body.append(first);await flush();assert.equal(first._config.entity,'media_player.b');assert.equal(second._config.entity,'media_player.a');
 assert.throws(()=>env.addPlayer('media_player.a',{navigation_id:'../invalid'}));
});
test('regular player visual editor emits the canonical card type and player explanation',async()=>{
 const env=setup(),editor=env.document.createElement('music-manager-card-editor');editor.setConfig({type:'custom:music-manager-card',entity:'media_player.a'});editor.hass=env.makeHass();env.document.body.append(editor);await flush();
 let changed;editor.addEventListener('config-changed',e=>{changed=e.detail.config});editor.shadowRoot.querySelector('[data-key="next"]').click();assert.equal(changed.type,'custom:music-manager-card');assert.match(editor.shadowRoot.querySelector(".music-editor").textContent,/Ausgangsbox/);
 assert.equal(env.window.customCards.filter(c=>c.type==='music-manager-card').length,1);assert.equal(env.window.customCards.some(c=>c.type.includes('beta')),false);
});

test('player parents have wake management and retain their personal speaker dropdown',async()=>{
 const env=setup(),card=env.addPlayer();await flush();
 assert(card.shadowRoot.querySelector('#player [data-action="player-settings"]'));
 for(const action of ['open-radio','open-apple','manage-favorites','open-alarm-songs'])assert.equal(card.shadowRoot.querySelector(`#player [data-action="${action}"]`),null);
 assert.equal(card.shadowRoot.querySelector('#player').textContent.includes('Beta'),false);
 assert.equal(card.shadowRoot.querySelector('#music-player-box').closest('label').querySelector('span').className,'visually-hidden');
 for(const user of ['manuel','vera']){
  env.switchUser(user);await flush();env.click(card,'player-settings');assert.equal(card._settingsDialog.open,true);assert.match(card._settingsDialog.textContent,/Sender/);assert.equal(card._settingsDialog.textContent.includes('Weck'),true);
  await card._action({action:'open-alarm-songs'});assert.equal(card._dialog.open,true);assert.equal(card._alarmSongUser,user);assert(card.shadowRoot.querySelector('#music-player-box'));card._dialog.close();
 }
 assert.equal(card._alarmSongUser,'vera');
});
test('player children manage separate favorites and wake songs in one dialog and do not leak to parents',async()=>{
 const env=setup(),song={kind:'apple_music',uri:'apple_music--demo://track/wake',media_type:'track',title:'Mein Wecklied',can_play:true,media_content_id:'apple_music--demo://track/wake'};
 env.favoriteData.set('maximilian',[song]);env.alarmSongData.set('maximilian',[song]);env.switchUser('maximilian');const card=env.addPlayer();await flush();
 env.click(card,'player-settings');assert.match(card._settingsDialog.textContent,/Favoriten & Wecklieder/);env.click(card,'manage-favorites');await flush();
 assert.equal(card._settingsDialog.open,true);assert.equal(card._dialog.open,true);assert.equal(card.shadowRoot.getElementById('music-radio-dialog-title').textContent,'Favoriten & Wecklieder');assert.match(card.shadowRoot.getElementById('player-wake-list').textContent,/Mein Wecklied/);
 await card._action({action:'remove-alarm-song',data:{uri:song.uri}});await flush();assert.equal(card._alarmSongs.length,0);assert.equal(card._favorites.length,1);assert.equal(env.favoriteData.get('maximilian').length,1);
 env.alarmSongData.set('maximilian',[song]);env.notifyAlarmSongs('maximilian');await flush();await card._toggleFavorite(card._favorites[0],false);await flush();assert.equal(card._favorites.length,0);assert.equal(card._alarmSongs.length,1);
 env.switchUser('manuel');await flush();assert.equal(card._showWakeSongs,true);assert.equal(card._alarmSongs.length,0);assert.equal(card._dialog.open,false);assert.equal(card._settingsDialog.textContent.includes('Weck'),true);
});
test('player adults and children have wake actions while keeping favorite stars',async()=>{
 const env=setup(),card=env.addPlayer();await flush();card._appleReady=true;card._appleEntity='media_player.ma_a';card._appleItems=[{uri:'apple_music--demo://track/song',title:'Lied',media_type:'track'}];card._appleParent={};card._renderApple();
 assert.equal(card.shadowRoot.querySelectorAll('[data-action="apple-alarm-song"]').length,1);assert(card.shadowRoot.querySelector('[data-action="apple-favorite"]'));assert.equal(card._appleDialog.querySelector('.music-manage-nav').textContent,'Favoriten & Wecklieder');
 env.switchUser('paul');await flush();card._appleReady=true;card._appleEntity='media_player.ma_a';card._appleItems=[{uri:'apple_music--demo://track/song',title:'Lied',media_type:'track'}];card._renderApple();assert.equal(card.shadowRoot.querySelectorAll('[data-action="apple-alarm-song"]').length,1);
});
test('player caps volume commands at fifty and maps the entire slider to zero through fifty',async()=>{
 const env=setup(),card=env.addPlayer();await flush();let slider=card.shadowRoot.querySelector('#music-volume');assert.equal(slider.getAttribute('max'),'50');slider.min=slider.getAttribute('min');slider.max=slider.getAttribute('max');slider.dispatchEvent(new env.window.Event('input',{bubbles:true}));assert.equal(slider.style.getPropertyValue('--range-percent'),'50%');
 slider.value='50';slider.dispatchEvent(new env.window.Event('input',{bubbles:true}));assert.equal(slider.style.getPropertyValue('--range-percent'),'100%');slider.dispatchEvent(new env.window.Event('change',{bubbles:true}));await flush();assert.equal(env.calls.at(-1).data.volume_level,.5);
 await card._action({action:'volume',phase:'change',value:95});assert.equal(env.calls.at(-1).data.volume_level,.5);await card._service('volume_set',{volume_level:1});assert.equal(env.calls.at(-1).data.volume_level,.5);assert.equal(await card._service('volume_set',{volume_level:NaN}),false);
 const original=env.add();assert.equal(original.shadowRoot.querySelector('#music-volume').getAttribute('max'),'100');
});
test('player native HA slider exposes a fifty maximum and clamps committed public events',async()=>{
 const env=setup();env.window.customElements.define('ha-control-slider',class extends env.window.HTMLElement{});const card=env.addPlayer();await flush();const slider=card.shadowRoot.querySelector('ha-control-slider');assert.equal(slider.max,50);assert.equal(slider.getAttribute('max'),'50');
 slider.dispatchEvent(new env.window.CustomEvent('value-changed',{detail:{value:100},bubbles:true}));await flush();assert.equal(env.calls.at(-1).data.volume_level,.5);
});
test('player radio only shows play pause while Apple keeps track navigation',async()=>{
 const env=setup();env.update('media_player.a',{attributes:{media_content_id:ROOT+'/swr3'}});const card=env.addPlayer();await flush();
 assert.equal(card.shadowRoot.querySelectorAll('#player [data-action="previous"],#player [data-action="next"]').length,0);assert(card.shadowRoot.querySelector('#player [data-action="play-pause"]'));
 env.update('media_player.a',{attributes:{media_content_id:'http://ma.example/flow/session/queue/item/player.aac'}});env.update('media_player.ma_a',{attributes:{active_queue:'queue',media_content_id:'apple_music--demo://track/song'}});card._appleEntity='media_player.ma_a';card._renderPlayer();assert(card.shadowRoot.querySelector('#player [data-action="next"]'));
});
test('player uses exactly the pinned kit styles and accessible icon-only favorite tiles',async()=>{
 const env=setup();env.favoriteData.set('manuel',[station('swr3','Mein Sender')]);const card=env.addPlayer();await flush();const kit=await import('../src/family-ui/1.4.1/family-ui.js');
 assert.equal(card.shadowRoot.querySelectorAll('style').length,1);assert.equal(card.shadowRoot.querySelector('style').textContent,kit.UI_CSS+'\n'+kit.MUSIC_PLAYER_CSS);const tile=card.shadowRoot.querySelector('[data-action="play-favorite"]');assert.equal(tile.textContent,'');assert.equal(tile.getAttribute('title'),'Mein Sender');assert.equal(tile.getAttribute('aria-label'),'Mein Sender abspielen');
});

test('player hides the playing radio favorite while other keyed tiles survive metadata updates and filtering preserves their target',async()=>{
 const env=setup();env.favoriteData.set('manuel',[station('one','Eins'),station('two','Zwei'),station('three','Drei')]);const card=env.addPlayer();await flush();
 const tile=id=>card.shadowRoot.querySelector(`#music-favorites [data-favorite="${ROOT}/${id}"]`),second=tile('two');
 tile('one').click();await flush();assert.equal(tile('one'),null);assert.equal(tile('two'),second);assert.equal(card._favorites.length,3);
 env.update('media_player.a',{attributes:{media_title:'Metadaten zum laufenden Sender'}});second.click();await flush();assert.equal(env.calls.at(-1).data.media_content_id,ROOT+'/two');assert(tile('one'));assert.equal(tile('two'),null);
 env.favoriteData.set('manuel',[station('three','Neuer Name'),station('two','Zwei'),station('one','Eins')]);env.notifyFavorites('manuel');await flush();assert.equal(tile('three').getAttribute('title'),'Neuer Name');tile('three').click();await flush();assert.equal(env.calls.at(-1).data.media_content_id,ROOT+'/three');assert.equal(tile('three'),null);
 env.failService=true;tile('one').click();await flush();assert(tile('one'));assert.equal(tile('three'),null);env.failService=false;
 env.update('media_player.a',{state:'idle'});assert.equal(card.shadowRoot.querySelectorAll('#music-favorites button').length,3);
 env.switchUser('vera');await flush();assert.equal(card.shadowRoot.querySelectorAll('#music-favorites button').length,0);assert.equal(second.isConnected,false);card.remove();
});
test('player recognizes a radio favorite after reload from exact source or station channel and follows box changes',async()=>{
 const env=setup();env.favoriteData.set('manuel',[station('swr3','SWR3'),station('bigfm','bigFM')]);env.update('media_player.a',{attributes:{media_content_id:'x-rincon-mp3radio://https://radio.example/live',media_channel:'SWR3',media_title:'Aktueller Musiktitel'}});const card=env.addPlayer();await flush();
 assert.equal(card.shadowRoot.querySelectorAll('#music-favorites button').length,1);assert.equal(card.shadowRoot.querySelector('#music-favorites button').title,'bigFM');
 env.update('media_player.a',{attributes:{media_content_id:ROOT+'/bigfm',media_channel:'bigFM'}});assert.equal(card.shadowRoot.querySelector('#music-favorites button').title,'SWR3');
 await card._selectBox('media_player.b');await flush();assert.equal(card.shadowRoot.querySelectorAll('#music-favorites button').length,2);card.remove();
});
test('player keeps a playing Apple playlist hidden across its tracks and restores it after another source or queue',async()=>{
 const env=setup(),playlist={kind:'apple_music',uri:'apple_music--demo://playlist/list',media_type:'playlist',title:'Meine Playlist'};env.favoriteData.set('manuel',[playlist,station('swr3')]);
 env.wsHook=msg=>{if(msg.type==='music_manager/apple_music'){if(msg.action==='status')return {entity_id:'media_player.ma_a'};if(msg.action==='play'){env.update('media_player.a',{attributes:{media_content_id:'http://ma.example/flow/session/queue/item/player.aac'}});env.update('media_player.ma_a',{attributes:{active_queue:'queue',media_content_id:'apple_music--demo://track/one'}});return {started:true};}}};
 const card=env.addPlayer();await flush();env.click(card,'play-favorite');await flush();assert.equal(card.shadowRoot.querySelectorAll('#music-favorites button').length,1);assert.equal(card.shadowRoot.querySelector('#music-favorites button').title,'SWR3');assert.equal(card._favorites.length,2);
 env.update('media_player.ma_a',{attributes:{media_content_id:'apple_music--demo://track/two',media_title:'Zweiter Titel'}});assert.equal(card.shadowRoot.querySelectorAll('#music-favorites button').length,1);
 env.update('media_player.ma_a',{attributes:{active_queue:'different'}});assert.equal(card.shadowRoot.querySelectorAll('#music-favorites button').length,2);
 env.click(card,'play-favorite');await flush();await card._playStation(station('swr3'));assert.equal(card.shadowRoot.querySelector('#music-favorites button').title,'Meine Playlist');card.remove();
});
test('player Apple Music favorites and combined wake-song dialogs retain their parent settings',async()=>{
 const env=setup(),card=env.addPlayer();await flush();env.click(card,'player-settings');
 for(const action of ['open-apple','manage-favorites']){env.click(card,action);await flush();const child=action==='open-apple'?card._appleDialog:card._dialog;assert(child.open);assert(card._settingsDialog.open);child.close();await flush();assert(card._settingsDialog.open);}
 env.switchUser('paul');await flush();env.click(card,'player-settings');env.click(card,'manage-favorites');await flush();assert(card._settingsDialog.open);assert(card._dialog.open);card._dialog.close();assert(card._settingsDialog.open);card.remove();
});
test('player radio browser returns to the settings dialog and shows actual component versions',async()=>{
 const env=setup(),card=env.addPlayer();await flush();env.click(card,'player-settings');const sender=card._settingsDialog.querySelector('[data-action="open-radio"]');sender.click();await flush();assert(card._dialog.open);assert(card._settingsDialog.open);
 card._dialog.close();await flush();assert.equal(card._dialog.open,false);assert(card._settingsDialog.open);assert.match(card._settingsDialog.querySelector('.version-info').textContent,/Oberfläche 2\.2\.1 · Integration 2\.2\.1 · UI 1\.4\.1/);
});
test('player children show their fixed speaker only inside settings and adults use a compact room dropdown',async()=>{
 const env=setup(),card=env.addPlayer();await flush();assert(card.shadowRoot.querySelector('.fui-player-speaker-compact'));assert.equal(card.shadowRoot.querySelector('#music-player-box option').textContent.includes('Sonos '),false);
 for(const user of ['maximilian','paul']){env.switchUser(user);await flush();assert.equal(card.shadowRoot.querySelector('#player .fui-player-name'),null);assert.equal(card.shadowRoot.querySelector('#music-player-box'),null);env.click(card,'player-settings');assert.match(card._settingsDialog.textContent,/Box/);assert.match(card._settingsDialog.textContent,/media_player.a/);card._settingsDialog.close();}
});

test('the old beta type is an unlisted compatibility alias of the regular player and saves canonical YAML',async()=>{
 const env=setup(),Current=env.window.customElements.get('music-manager-card'),Legacy=env.window.customElements.get('music-manager-beta-card');
 assert.equal(Object.getPrototypeOf(Legacy.prototype),Current.prototype);
 env.navigationData.set('manuel',{hauptplayer:'media_player.b'});env.favoriteData.set('manuel',[station('one','Mein Sender')]);
 const legacy=env.document.createElement('music-manager-beta-card');legacy.setConfig({type:'custom:music-manager-beta-card',entity:'media_player.a',navigation_id:'hauptplayer'});env.document.body.append(legacy);legacy.hass=env.makeHass();await flush();
 assert.equal(legacy._config.entity,'media_player.b');assert(legacy.shadowRoot.querySelector('.fui-player-toolbar'));assert.equal(legacy._favorites.length,1);assert.equal(env.window.customCards.some(c=>c.type.includes('beta')),false);
 const editor=Current.getConfigElement();editor.setConfig({type:'custom:music-manager-beta-card',entity:'media_player.a',navigation_id:'hauptplayer'});env.document.body.append(editor);let saved;editor.addEventListener('config-changed',e=>saved=e.detail.config);editor.shadowRoot.querySelector('[data-key="next"]').click();assert.equal(saved.type,'custom:music-manager-card');assert.equal(saved.navigation_id,'hauptplayer');legacy.remove();editor.remove();
});

test('Apple categories browse the personal library without a query and filter the same catalog search with a query',async()=>{
 const env=setup();let searches=0;
 const record=(kind,label)=>({uri:`apple_music--a://${kind}/${label}`,media_type:kind,title:label});
 env.wsHook=msg=>{
  if(msg.type!=='music_manager/apple_music')return;
  if(msg.action==='status')return {account:'Manuel',entity_id:'media_player.ma_a'};
  if(msg.action==='search'){searches++;return {items:['playlist','album','track'].flatMap(kind=>[record(kind,'Suche '+kind),record(kind,'Weitere '+kind)]),more:false};}
  if(msg.action==='tracks')return {items:[record('track','Albumtitel')],more:false};
  return {items:[record(msg.media_type,'Eigene '+msg.media_type)],more:false};
 };
 const card=env.addPlayer();await flush();await card._action({action:'open-apple'});
 for(const view of ['playlist','album','track']){
  await card._action({action:'apple-library',data:{view}});assert.equal(env.wsCalls.at(-1).action,'library');assert.equal(env.wsCalls.at(-1).media_type,view);assert.equal(card._appleItems[0].title,'Eigene '+view);assert.match(card.shadowRoot.getElementById('music-apple-location').textContent,/Deine Mediathek/);
 }
 card._appleQuery.value='Meine Suche';await card._action({action:'apple-search'});
 for(const view of ['playlist','album','track','album']){
  await card._action({action:'apple-library',data:{view}});assert.equal(card._appleQuery.value,'Meine Suche');assert.equal(card._appleItems.length,2);assert(card._appleItems.every(item=>item.media_type===view));assert.equal(card._appleDialog.querySelector(`[data-view="${view}"]`).getAttribute('aria-pressed'),'true');assert.match(card.shadowRoot.getElementById('music-apple-location').textContent,/Suchergebnisse.*Meine Suche/);
 }
 assert.equal(searches,1);assert.equal(card._appleSearchResults.items.length,6);
 await card._action({action:'apple-tracks',data:{index:0}});assert.equal(card._appleItems[0].title,'Albumtitel');await card._action({action:'apple-back'});assert.equal(card._appleView,'album');assert.equal(card._appleQuery.value,'Meine Suche');assert.equal(card._appleItems[0].title,'Suche album');assert.equal(card._appleSearch,true);
 card._appleQuery.value='';card._appleQuery.dispatchEvent(new env.window.Event('input',{bubbles:true}));await flush();assert.equal(env.wsCalls.at(-1).action,'library');assert.equal(env.wsCalls.at(-1).media_type,'album');assert.equal(card._appleItems[0].title,'Eigene album');assert.equal(card._appleSearchResults,null);assert.equal(card._appleSearch,false);
 card._appleQuery.value='   ';await card._action({action:'apple-search'});assert.equal(env.wsCalls.at(-1).action,'library');assert.equal(card._appleError,'');card.remove();
});

test('category searches discard old queries and private results after an account switch and retry failed searches',async()=>{
 const env=setup();let resolveOld,fail=false;
 env.wsHook=msg=>{
  if(msg.type!=='music_manager/apple_music')return;
  if(msg.action==='status')return {account:'Manuel',entity_id:'media_player.ma_a'};
  if(msg.action==='search'){
   if(msg.query==='Alt')return new Promise(resolve=>{resolveOld=resolve;});
   if(fail)throw new Error('Vorübergehend nicht verfügbar');
   return {items:[{uri:'apple_music--a://album/new',media_type:'album',title:'Neues Album'}],more:false};
  }
  return {items:[],more:false};
 };
 const card=env.addPlayer();await flush();await card._action({action:'open-apple'});card._appleQuery.value='Alt';const old=card._action({action:'apple-search'});await flush();card._appleQuery.value='Neu';await card._action({action:'apple-library',data:{view:'album'}});
 resolveOld({items:[{uri:'apple_music--a://album/old',media_type:'album',title:'Altes Album'}]});await old;assert.equal(card._appleSearchResults.query,'Neu');assert.equal(card._appleItems[0].title,'Neues Album');
 fail=true;await card._action({action:'apple-search'});assert.match(card._appleError,/Vorübergehend/);assert.equal(card._appleSearchResults,null);fail=false;await card._action({action:'apple-retry'});assert.equal(card._appleItems[0].title,'Neues Album');assert.equal(card._appleError,'');
 card._appleQuery.value='Alt';const privateSearch=card._action({action:'apple-search'});await flush();env.switchUser('vera');resolveOld({items:[{uri:'apple_music--a://album/private',media_type:'album',title:'Privates Album'}]});await privateSearch;assert.equal(card._appleSearchResults,null);assert.equal(card._appleSearchQuery,'');assert.equal(card._appleItems.length,0);assert.equal(card._appleDialog.open,false);card.remove();
});

test('alarm playback draft saves with a song, supports duration-only changes and rejects track-end for radio',async()=>{
 const env=setup(),row=env.document.createElement('music-manager-alarm-row'),saved=[];
 const song={uri:'apple_music--a://track/wake',title:'Aufwachen',media_type:'track'},radio={uri:'media-source://radio_browser/swr3',kind:'radio',media_type:'radio',title:'SWR3'};let selected=song,fail=false;
 env.wsHook=msg=>msg.type==='music_manager/alarm'?(msg.action==='select'&&(selected=[song,radio].find(item=>item.uri===msg.uri)),{owner:'Maximilian',source:'Sonos',songs:[song,radio],selection:selected,in_songs:true}):undefined;
 row.setConfig({alarm_id:'school_alarm'});env.document.body.append(row);row.hass=env.makeHass();row.playbackSettings={value:{mode:'duration',minutes:5},save:async value=>{if(fail)throw Error('Dauer nicht gespeichert');saved.push({...value});}};await flush();env.click(row,'alarm-open');await flush();
 const minutes=row.shadowRoot.querySelector('#alarm-playback-minutes');minutes.value='9';minutes.dispatchEvent(new env.window.Event('input',{bubbles:true}));await row._action({action:'alarm-select',value:song.uri});assert.deepEqual(saved,[{mode:'duration',minutes:9}]);
 env.click(row,'alarm-open');await flush();row._playbackDraft.mode='track_end';row._render();const before=env.wsCalls.length;await row._action({action:'alarm-select',value:radio.uri});assert.equal(env.wsCalls.length,before);assert.match(row._dialog.textContent,/feste Dauer/);assert(row._dialog.open);
 fail=true;await row._action({action:'alarm-playback-save'});assert.match(row._dialog.textContent,/Dauer nicht gespeichert/);assert(row._dialog.open);
 fail=false;await row._action({action:'alarm-playback-save'});assert.equal(saved.at(-1).mode,'track_end');assert.equal(env.wsCalls.length,before);assert.equal(row._dialog.open,false);row.remove();
});
