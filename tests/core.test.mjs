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
test('favorite records keep only playable radio sources and safe logo URLs',async()=>{
 const {normalizeFavorites,stationLogo}=await import('../src/core.js');
 const s={media_content_id:RADIO_ROOT+'/swr3',title:'SWR3',can_play:true,thumbnail:'https://example.org/logo.png',entity_id:'media_player.a'};
 assert.equal(normalizeFavorites([s,s])[0].thumbnail,s.thumbnail);assert.equal(normalizeFavorites([s,s]).length,1);
 assert(!('entity_id' in normalizeFavorites([s])[0]));
 assert.equal(normalizeFavorites([{...s,can_play:false,can_expand:true}]).length,0);
 for(const url of ['javascript:alert(1)','data:image/svg+xml,evil','file:///etc/passwd','https://user:password@example.org'])assert.equal(stationLogo(url),'');
 assert.equal(stationLogo('/api/media_source_proxy/logo.png'),'/api/media_source_proxy/logo.png');
});

test('playback clock clamps positions and advances only playing items with a valid time anchor',async()=>{
 const {playbackProgress,formatTime}=await import('../src/core.js');
 const now=Date.parse('2026-11-11T08:00:10Z'),attrs={media_duration:240,media_position:20,media_position_updated_at:'2026-11-11T08:00:00Z'};
 assert.deepEqual(playbackProgress({state:'playing',attributes:attrs},now),{duration:240,position:30});
 assert.equal(playbackProgress({state:'paused',attributes:attrs},now).position,20);
 assert.equal(playbackProgress({state:'playing',attributes:{...attrs,media_position:239}},now).position,240);
 assert.equal(playbackProgress({state:'playing',attributes:{...attrs,media_position_updated_at:'invalid'}},now).position,20);
 assert.equal(playbackProgress({state:'playing',attributes:{...attrs,media_position_updated_at:'2026-11-11T09:00:00Z'}},now).position,20);
 for(const duration of [0,null,undefined,NaN,Infinity,'240'])assert.equal(playbackProgress({attributes:{media_duration:duration}}),null);
 assert.equal(formatTime(125),'2:05');assert.equal(formatTime(3605),'1:00:05');assert.equal(formatTime(-2),'0:00');
});

test('mixed favorites preserve legacy radio order and accept only exact Apple album or playlist URIs',async()=>{
 const {normalizeFavorites,appleFavorite}=await import('../src/core.js');
 const radio={media_content_id:RADIO_ROOT+'/old',title:'Radio',can_play:true};
 const album=appleFavorite({uri:'apple_music--a://album/42',media_type:'album',title:'Album',thumbnail:'javascript:bad()',private_token:'secret'});
 const playlist=appleFavorite({uri:'apple_music--a://playlist/pl.u-42',media_type:'playlist',title:'Playlist'});
 const result=normalizeFavorites([radio,album,playlist,album,null]);
 assert.deepEqual(result.map(f=>f.title),['Radio','Album','Playlist']);assert.equal(result[1].thumbnail,'');assert(!JSON.stringify(result).includes('secret'));
 assert.equal(result[0].media_content_id,radio.media_content_id);
 for(const uri of ['apple_music://album/42','library://album/42','spotify--a://album/42','apple_music--a://track/42','apple_music--a://album/42?token=x','apple_music--a://album/../../42'])assert.equal(appleFavorite({uri,media_type:'album',title:'Bad'}),null);
 assert.equal(appleFavorite({uri:'apple_music--a://album/42',media_type:'playlist',title:'Wrong type'}),null);
});
test('sorting merges with concurrent adds and removals without losing mixed favorites or resurrecting deletions',async()=>{
 const {appleFavorite,moveFavorite,saveFavorite}=await import('../src/core.js');
 const radio=id=>({media_content_id:RADIO_ROOT+'/'+id,title:id,can_play:true});
 const album=appleFavorite({uri:'apple_music--a://album/42',media_type:'album',title:'Album'});
 const playlist=appleFavorite({uri:'apple_music--a://playlist/42',media_type:'playlist',title:'Playlist'});
 let items=[radio('radio'),album,playlist];const connection={};
 const hass={user:{id:'manuel'},connection,async callWS(msg){if(msg.type==='frontend/get_user_data')return {value:items};items=msg.value;}};
 await Promise.all([saveFavorite(hass,radio('new'),true),moveFavorite(hass,playlist.uri,'up')]);
 assert.deepEqual(items.map(i=>i.title),['radio','Playlist','Album','new']);
 await saveFavorite(hass,{...album,title:'Renamed Album'},true);assert.equal(items[2].title,'Renamed Album');
 await Promise.all([saveFavorite(hass,album,false),moveFavorite(hass,album.uri,'up')]);assert.deepEqual(items.map(i=>i.title),['radio','Playlist','new']);
 await assert.rejects(moveFavorite(hass,playlist.uri,'invalid'));
});
test('wake songs are stored separately from favorites and migrated without loss',async()=>{
 const {appleFavorite,saveFavorite,saveAlarmSong,migrateAlarmSongs,ALARM_SONGS_KEY,FAVORITES_KEY}=await import('../src/core.js');
 const song=appleFavorite({uri:'apple_music--a://track/wake',media_type:'track',title:'Wake up'});
 const album=appleFavorite({uri:'apple_music--a://album/42',media_type:'album',title:'Album'});
 const data=new Map([[FAVORITES_KEY,[album]]]);let failPrune=false;
 const hass={user:{id:'child'},connection:{},async callWS(msg){if(msg.type==='frontend/get_user_data')return {value:data.get(msg.key)||[]};if(failPrune&&msg.key===FAVORITES_KEY)throw Error('Cannot prune');data.set(msg.key,msg.value);}};
 await saveAlarmSong(hass,song,true);assert.deepEqual(data.get(FAVORITES_KEY),[album]);assert.equal(data.get(ALARM_SONGS_KEY)[0].uri,song.uri);
 await saveFavorite(hass,song,true);await saveAlarmSong(hass,song,false);assert.equal(data.get(ALARM_SONGS_KEY).length,0);assert.equal(data.get(FAVORITES_KEY).length,2);
 data.set(FAVORITES_KEY,[album,{...song,alarm_song:true}]);failPrune=true;
 await assert.rejects(migrateAlarmSongs(hass));assert.equal(data.get(ALARM_SONGS_KEY).length,1);assert.equal(data.get(FAVORITES_KEY).length,2);
 failPrune=false;await Promise.all([migrateAlarmSongs(hass),migrateAlarmSongs(hass)]);
 assert.deepEqual(data.get(FAVORITES_KEY),[album]);assert.equal(data.get(ALARM_SONGS_KEY).length,1);assert.equal(data.get(ALARM_SONGS_KEY)[0].alarm_song,undefined);
 await assert.rejects(saveAlarmSong(hass,album,true));
});
