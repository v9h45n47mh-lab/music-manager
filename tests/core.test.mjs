import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeConfig,volumePercent,normalizeMedia,stationPayload,playbackAction,sonosOptions,hasFeature,isRadioId,RADIO_ROOT} from '../src/core.js';
test('per-card configuration validates entity and independent control switches',()=>{
 const input={entity:'media_player.sonos',controls:{next:false}};
 const result=normalizeConfig(input);
 assert.equal(result.controls.next,false);assert.equal(result.controls.previous,true);assert.equal(result.controls.volume,true);
 assert.equal(input.controls.volume,undefined);
 for(const entity of ['light.sonos','media_player.<script>',null,''])assert.throws(()=>normalizeConfig({entity}));
 assert.throws(()=>normalizeConfig({entity:'media_player.sonos',controls:{volume:'false'}}));
 assert.throws(()=>normalizeConfig({entity:'media_player.sonos',controls:[]}));
});
test('volume safely maps Sonos fractional levels and unknown values',()=>{
 assert.equal(volumePercent(0.284),28);assert.equal(volumePercent(-1),0);assert.equal(volumePercent(2),100);
 for(const v of [NaN,null,undefined,'0.5',Infinity])assert.equal(volumePercent(v),null);
});
test('radio browsing removes malformed, duplicate and unrelated media items',()=>{
 const good={media_content_id:RADIO_ROOT+'/swr3',title:'SWR3',can_play:true};
 const result=normalizeMedia([good,good,null,{...good,media_content_id:'media-source://spotify/station'},{...good,media_content_id:'javascript:alert(1)'},{...good,media_content_id:RADIO_ROOT+'/empty',can_play:false}]);
 assert.deepEqual(result,[good]);assert.equal(isRadioId(RADIO_ROOT+'evil/station'),false);
});
test('station playback preserves the HA media source ID and MIME type',()=>{
 const station={media_content_id:RADIO_ROOT+'/abc',media_content_type:'audio/aac',title:'Sender',can_play:true};
 assert.deepEqual(stationPayload(station),{media_content_id:station.media_content_id,media_content_type:'audio/aac',extra:{title:'Sender'}});
 assert.throws(()=>stationPayload({...station,can_play:false}));
 assert.throws(()=>stationPayload({...station,media_content_id:'https://untrusted.test'}));
});
test('playback chooses pause, stop and resume based on current capabilities',()=>{
 const state=(s,f)=>({state:s,attributes:{supported_features:f}});
 assert.equal(playbackAction(state('playing',1)), 'media_pause');
 assert.equal(playbackAction(state('buffering',4096)), 'media_stop');
 assert.equal(playbackAction(state('paused',16384)), 'media_play');
 assert.equal(playbackAction(state('idle',512),{title:'station'}),'play_media');
 assert.equal(playbackAction(state('playing',0)),null);
 assert.equal(hasFeature(state('idle',32),'next'),true);
});
test('Sonos selection uses registry platform, not names or speaker device class',()=>{
 const hass={states:{'media_player.a':{attributes:{friendly_name:'Symfonisk'}},'media_player.b':{attributes:{friendly_name:'Sonos-looking TV'}},'media_player.c':{attributes:{}}}};
 assert.deepEqual(sonosOptions(hass,[{entity_id:'media_player.a',platform:'sonos'},{entity_id:'media_player.b',platform:'cast'},{entity_id:'media_player.c',platform:'sonos',disabled_by:'user'}]),[{value:'media_player.a',label:'Symfonisk',description:'media_player.a'}]);
});
