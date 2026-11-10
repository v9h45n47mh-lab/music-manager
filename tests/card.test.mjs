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
 const makeHass=()=>({states,entities:Object.fromEntries(registry.map(e=>[e.entity_id,e])),
  async callService(domain,service,data){calls.push({domain,service,data});if(serviceHook)await serviceHook();if(failService)throw new Error('Keine Berechtigung');},
  async callWS(message){wsCalls.push(message);if(wsHook){const result=await wsHook(message);if(result!==undefined)return result;}
   if(message.type==='config/entity_registry/list')return registry;
   if(failBrowse)throw new Error('Radio Browser nicht verfügbar');
   if(message.type==='media_source/search_media')return {result:message.search_query==='leer'?[]:[station('swr3')]};
   return {can_search:true,children:message.media_content_id===ROOT?[{title:'Popular',can_expand:true,media_content_id:ROOT+'/popular'}]:[station('swr3')]};}
 });
 const add=(entity='media_player.a',controls)=>{const card=document.createElement('music-manager-card');card.setConfig({entity,controls});document.body.append(card);cards.push(card);card.hass=makeHass();return card;};
 const update=(entity,changes)=>{const old=states[entity];states={...states,[entity]:{...old,...changes,attributes:{...old.attributes,...changes.attributes}}};for(const card of cards)card.hass=makeHass();};
 const click=(element,action)=>{const button=element.shadowRoot.querySelector(`[data-action="${action}"]`);assert(button,action+' exists');assert(!button.disabled,action+' enabled');button.click();};
 return {window,document,calls,wsCalls,add,update,click,makeHass,set failService(v){failService=v},set failBrowse(v){failBrowse=v},set wsHook(v){wsHook=v},set serviceHook(v){serviceHook=v}};
}
test('actual card controls call HA media services and preserve per-card targets',async()=>{
 const env=setup(),a=env.add(),b=env.add('media_player.b');
 for(const [action,service] of [['previous','media_previous_track'],['next','media_next_track'],['play-pause','media_pause']]){env.click(a,action);await flush();assert.equal(env.calls.at(-1).service,service);assert.equal(env.calls.at(-1).data.entity_id,'media_player.a');}
 env.update('media_player.b',{state:'paused'});env.click(b,'play-pause');await flush();assert.equal(env.calls.at(-1).service,'media_play');assert.equal(env.calls.at(-1).data.entity_id,'media_player.b');
 env.click(a,'mute');await flush();assert.equal(env.calls.at(-1).data.is_volume_muted,true);
});
test('UI Kit slider emits volume_set once on change, never on input',async()=>{
 const env=setup(),card=env.add();const slider=card.shadowRoot.querySelector('input[type=range]');
 slider.value='57';slider.dispatchEvent(new env.window.Event('input',{bubbles:true}));await flush();assert.equal(env.calls.length,0);
 slider.dispatchEvent(new env.window.Event('change',{bubbles:true}));await flush();assert.equal(env.calls.length,1);assert.equal(env.calls[0].data.volume_level,0.57);
});
test('Radio Browser search and selection use supported HA websocket and service payloads',async()=>{
 const env=setup(),card=env.add();env.click(card,'open-radio');await flush();
 assert.equal(env.wsCalls[0].type,'media_source/browse_media');assert.equal(env.wsCalls[0].media_content_id,ROOT);
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
 for(const action of ['next','previous','play-pause','open-radio','mute'])assert.equal(card.shadowRoot.querySelector(`[data-action="${action}"]`).disabled,true);
 env.update('media_player.a',{state:'playing',attributes:{supported_features:4096}});assert.equal(card.shadowRoot.querySelector('[data-action="next"]').disabled,true);assert.match(card.shadowRoot.querySelector('[data-action="play-pause"]').textContent,/Stop/);
 env.click(card,'play-pause');await flush();assert.equal(env.calls.at(-1).service,'media_stop');
 card.setConfig({entity:'media_player.a',controls:{next:false,previous:false,volume:false,mute:false}});for(const selector of ['[data-action="next"]','[data-action="previous"]','[data-action="mute"]','input[type=range]'])assert.equal(card.shadowRoot.querySelector(selector),null);
});
test('Sonos-only visual editor emits entity, name and independent control configuration',async()=>{
 const env=setup(),editor=env.document.createElement('music-manager-card-editor');editor.setConfig({entity:'media_player.a'});editor.hass=env.makeHass();env.document.body.append(editor);await flush();const events=[];editor.addEventListener('config-changed',e=>events.push(e.detail.config));
 const options=[...editor.shadowRoot.querySelectorAll('[data-ui-option]')];assert.equal(options.length,2);assert(options.every(e=>e.dataset.value!=='media_player.tv'));
 options.find(e=>e.dataset.value==='media_player.b').click();await flush();assert.equal(events.at(-1).entity,'media_player.b');
 editor.shadowRoot.querySelector('#music-name').value='Zimmer';editor.shadowRoot.querySelector('#music-name').dispatchEvent(new env.window.Event('input',{bubbles:true}));assert.equal(events.at(-1).name,'Zimmer');
 editor.shadowRoot.querySelector('[data-key="next"]').click();assert.equal(events.at(-1).controls.next,false);assert.equal(events.at(-1).controls.volume,true);
});
test('external text stays escaped; reconnecting does not duplicate event handlers',async()=>{
 const env=setup(),card=env.add();card.setConfig({entity:'media_player.a',name:'<img src=x onerror=alert(1)>'});assert.equal(card.shadowRoot.querySelector('img'),null);
 card.remove();env.document.body.append(card);env.click(card,'next');await flush();assert.equal(env.calls.length,1);
 env.wsHook=msg=>msg.type==='media_source/search_media'?{result:[station('bad','<script>bad()</script>')]}:undefined;
 env.click(card,'open-radio');await flush();card.shadowRoot.querySelector('#music-radio-query').value='bad';env.click(card,'search');await flush();assert.equal(card.shadowRoot.querySelector('script'),null);assert.match(card.shadowRoot.querySelector('#music-radio-results').textContent,/<script>/);
});
