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
const features=1|4|8|16|32|512|4096|16384;
const flush=async()=>{for(let i=0;i<12;i++)await new Promise(resolve=>setImmediate(resolve));};
function setup() {
 const {window}=parseHTML('<!doctype html><html><body></body></html>');
 const {document}=window;
 window.HTMLElement.prototype.showModal=function(){this.open=true;};
 window.HTMLElement.prototype.close=function(){this.open=false;this.dispatchEvent(new window.Event('close'));};
 const context=vm.createContext({window,document,HTMLElement:window.HTMLElement,customElements:window.customElements,MutationObserver:window.MutationObserver,CustomEvent:window.CustomEvent,queueMicrotask,console,setTimeout,clearTimeout,URL,Promise});
 vm.runInContext(bundle.replace(/^export /gm,''),context);
 const calls=[],wsCalls=[];
 let failService=false,failBrowse=false,wsHook=null,serviceHook=null;
 const registry=[{entity_id:'media_player.a',platform:'sonos'},{entity_id:'media_player.b',platform:'sonos'},{entity_id:'media_player.tv',platform:'cast'}];
 let states=Object.fromEntries(registry.map(e=>[e.entity_id,{entity_id:e.entity_id,state:'playing',attributes:{friendly_name:e.entity_id,volume_level:0.25,supported_features:features,media_title:'Titel'}}]));
 const cards=[];
let currentUser='manuel',failFavorites=false;
const favoriteData=new Map(),favoriteSubscribers=new Map(),connections=new Map();
const notifyFavorites=user=>{for(const cb of favoriteSubscribers.get(user)||[])cb({value:favoriteData.get(user)||[]});};
const connectionFor=user=>{
 if(!connections.has(user))connections.set(user,{async subscribeMessage(cb,message){
  if(failFavorites)throw new Error('Favoriten nicht verfügbar');
  if(!favoriteSubscribers.has(user))favoriteSubscribers.set(user,new Set());
  favoriteSubscribers.get(user).add(cb);cb({value:favoriteData.get(user)||[]});
  return ()=>favoriteSubscribers.get(user).delete(cb);
 }});
 return connections.get(user);
};

 const makeHass=(user=currentUser)=>({user:{id:user},connection:connectionFor(user),states,entities:Object.fromEntries(registry.map(e=>[e.entity_id,e])),
  async callService(domain,service,data){calls.push({domain,service,data});if(serviceHook)await serviceHook();if(failService)throw new Error('Keine Berechtigung');},
  async callWS(message){wsCalls.push(message);if(wsHook){const result=await wsHook(message);if(result!==undefined)return result;}
   if(message.type==='config/entity_registry/list')return registry;
   if(message.type==='frontend/get_user_data'){if(failFavorites)throw new Error('Favoriten nicht verfügbar');return {value:favoriteData.get(user)||[]};}
   if(message.type==='frontend/set_user_data'){if(failFavorites)throw new Error('Speichern verweigert');favoriteData.set(user,message.value);notifyFavorites(user);return null;}

   if(failBrowse)throw new Error('Radio Browser nicht verfügbar');
   if(message.type==='media_source/search_media')return {result:message.search_query==='leer'?[]:[station('swr3')]};
   return {can_search:true,children:message.media_content_id===ROOT?[{title:'Popular',can_expand:true,media_content_id:ROOT+'/popular'}]:[station('swr3')]};}
 });
 const add=(entity='media_player.a',controls)=>{const card=document.createElement('music-manager-card');card.setConfig({entity,controls});document.body.append(card);cards.push(card);card.hass=makeHass();return card;};
 const update=(entity,changes)=>{const old=states[entity];states={...states,[entity]:{...old,...changes,attributes:{...old.attributes,...changes.attributes}}};for(const card of cards)card.hass=makeHass();};
 const click=(element,action)=>{const button=element.shadowRoot.querySelector(`[data-action="${action}"]`);assert(button,action+' exists');assert(!button.disabled,action+' enabled');button.click();};
 return {window,document,calls,wsCalls,add,update,click,makeHass,favoriteData,notifyFavorites,connections,
 switchUser(user){currentUser=user;for(const card of cards)card.hass=makeHass();},set failFavorites(v){failFavorites=v},set failService(v){failService=v},set failBrowse(v){failBrowse=v},set wsHook(v){wsHook=v},set serviceHook(v){serviceHook=v}};
}
test('actual card controls call HA media services and preserve per-card targets',async()=>{
 const env=setup(),a=env.add(),b=env.add('media_player.b');
 for(const [action,service] of [['previous','media_previous_track'],['next','media_next_track'],['play-pause','media_pause'],['stop','media_stop']]){env.click(a,action);await flush();assert.equal(env.calls.at(-1).service,service);assert.equal(env.calls.at(-1).data.entity_id,'media_player.a');}
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
 for(const action of ['next','previous','play-pause','stop'])assert.equal(card.shadowRoot.querySelector(`[data-action="${action}"]`).disabled,true);
 env.update('media_player.a',{state:'playing',attributes:{supported_features:4096}});assert.equal(card.shadowRoot.querySelector('[data-action="next"]').disabled,true);assert.equal(card.shadowRoot.querySelector('[data-action="play-pause"]').getAttribute('aria-label'),'Stop');
 env.click(card,'play-pause');await flush();assert.equal(env.calls.at(-1).service,'media_stop');
 card.setConfig({entity:'media_player.a',controls:{next:false,previous:false,volume:false,mute:false}});for(const selector of ['[data-action="next"]','[data-action="previous"]','[data-action="mute"]','input[type=range]'])assert.equal(card.shadowRoot.querySelector(selector),null);
});
test('Sonos-only visual editor emits entity and independent control configuration',async()=>{
 const env=setup(),editor=env.document.createElement('music-manager-card-editor');editor.setConfig({entity:'media_player.a'});editor.hass=env.makeHass();env.document.body.append(editor);await flush();const events=[];editor.addEventListener('config-changed',e=>{events.push(e.detail.config);editor.setConfig(e.detail.config);});
 const options=[...editor.shadowRoot.querySelectorAll('[data-ui-option]')];assert.equal(options.length,2);assert(options.every(e=>e.dataset.value!=='media_player.tv'));
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
