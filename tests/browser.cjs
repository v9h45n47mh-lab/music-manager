const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
let chromium;try{({chromium}=require('playwright'));}catch(error){if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;({chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright')));}
const root=path.resolve(__dirname,'..'),screens=path.join(root,'test-results');fs.mkdirSync(screens,{recursive:true});
const server=http.createServer((req,res)=>{
 const target=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.html')?'text/html':target.endsWith('.png')?'image/png':target.endsWith('.svg')?'image/svg+xml':'text/plain');res.end(fs.readFileSync(target));}catch{res.writeHead(404);res.end();}
});
let browser,page;let checks=0;
async function check(name,fn){await fn();checks++;console.log('PASS '+name);}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 browser=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),headless:true,args:['--no-sandbox']});
 page=await browser.newPage({viewport:{width:1100,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url=`http://127.0.0.1:${server.address().port}/tests/fixture.html`;
 const reset=async()=>{await page.goto(url);await page.waitForFunction(()=>window.demo?.cards.length===2);};
 await reset();
 const card=()=>page.locator('music-manager-card').first();
 const action=(name)=>card().locator(`[data-action="${name}"]`);
 const dialog=()=>card().locator('#music-radio-dialog');
 await check('Play/Pause, previous and next use the configured player',async()=>{
  await action('play-pause').click();await page.waitForFunction(()=>demo.calls.length===1);
  assert.equal(await page.evaluate(()=>demo.calls[0].service),'media_pause');
  await action('play-pause').click();await action('previous').click();await action('next').click();
  const calls=await page.evaluate(()=>demo.calls);
  assert.deepEqual(calls.map(c=>c.service),['media_pause','media_play','media_previous_track','media_next_track']);
  assert(calls.every(c=>c.domain==='media_player'&&c.data.entity_id==='media_player.wohnzimmer'));
 });
 await check('volume changes on commit only; no mute control',async()=>{
  await card().locator('#music-volume').evaluate(input=>{input.value='47';input.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>demo.calls.length),4);
  assert.equal(await card().locator('output').innerText(),'47 %');
  await card().locator('#music-volume').evaluate(input=>input.dispatchEvent(new Event('change',{bubbles:true})));
  await page.waitForFunction(()=>demo.calls.length===5);
  assert.equal(await page.evaluate(()=>demo.calls[4].data.volume_level),0.47);
  assert.equal(await action('mute').count(),0);
 });
 await check('radio search uses Home Assistant and station playback targets Sonos',async()=>{
  await action('open-radio').click();await dialog().locator('#music-radio-results .setting-row').first().waitFor();
  await dialog().locator('#music-radio-query').fill('SWR3');
  await dialog().locator('#music-radio-query').press('Enter');
  await dialog().locator('[data-action="play-station"]').first().waitFor();
  assert.deepEqual(await page.evaluate(()=>demo.wsCalls.find(c=>c.type==='media_source/search_media')),{type:'media_source/search_media',media_content_id:'media-source://radio_browser',search_query:'SWR3'});
  await dialog().locator('[data-action="play-station"]').first().click();
  await page.waitForFunction(()=>!demo.cards[0].shadowRoot.querySelector('dialog').open);
  const call=await page.evaluate(()=>demo.calls.at(-1));
  assert.equal(call.service,'play_media');assert.equal(call.data.media_content_id,'media-source://radio_browser/swr3');assert.equal(call.data.media_content_type,'audio/mpeg');assert.equal(call.data.entity_id,'media_player.wohnzimmer');
 });
 await check('category navigation, empty results and no cross-card targeting',async()=>{
  await action('open-radio').click();await dialog().locator('[data-action="root"]').click();
  await dialog().getByRole('button',{name:'Kategorie öffnen: By Category',exact:true}).click();
  await dialog().getByRole('button',{name:'Kategorie öffnen: Rock',exact:true}).click();
  await dialog().locator('[data-action="play-station"]').first().waitFor();
  assert((await page.evaluate(()=>demo.wsCalls)).some(c=>c.media_content_id==='media-source://radio_browser/tag/rock'));
  await dialog().locator('#music-radio-query').fill('leer');await dialog().locator('[data-action="search"]').click();
  await dialog().getByText('Keine passenden Sender gefunden.',{exact:false}).waitFor();
  await page.keyboard.press('Escape');
  await page.locator('music-manager-card').nth(1).locator('[data-action="play-pause"]').click();
  assert.equal(await page.evaluate(()=>demo.calls.at(-1).data.entity_id),'media_player.maximilian_sonos');
 });
 await check('service rejection stays visible and does not close sender dialog',async()=>{
  await page.evaluate(()=>{demo.failService=true});
  await action('open-radio').click();await dialog().locator('[data-action="popular"]').click();
  await dialog().locator('[data-action="play-station"]').first().click();
  await dialog().getByRole('alert').waitFor();assert(await dialog().isVisible());
  assert.match(await dialog().getByRole('alert').innerText(),/Befehl fehlgeschlagen/);
  await page.keyboard.press('Escape');await page.evaluate(()=>{demo.failService=false});
 });
 await check('missing Radio Browser is actionable; retry succeeds',async()=>{
  await reset();await page.evaluate(()=>{demo.failBrowse=true});await action('open-radio').click();
  await dialog().getByRole('alert').waitFor();assert.match(await dialog().getByRole('alert').innerText(),/Geräte & Dienste/);
  await page.evaluate(()=>{demo.failBrowse=false});await dialog().locator('[data-action="root"]').click();
  await dialog().locator('[data-action="browse-item"]').first().waitFor();await page.keyboard.press('Escape');
 });
 await check('HA updates preserve radio search focus, text and in-progress slider',async()=>{
  await action('open-radio').click();await dialog().locator('#music-radio-query').fill('langer Suchtext');
  await page.evaluate(()=>demo.update('media_player.wohnzimmer',{attributes:{media_title:'Neuer Titel'}}));
  assert.equal(await dialog().locator('#music-radio-query').inputValue(),'langer Suchtext');
  assert(await dialog().locator('#music-radio-query').evaluate(e=>e.getRootNode().activeElement===e));
  // A focused native search input may consume the first Escape to clear its
  // text. Close explicitly before testing controls outside the modal.
  await dialog().getByRole('button',{name:'Schließen',exact:true}).click();
  await dialog().waitFor({state:'hidden'});
  await card().locator('#music-volume').focus();
  await card().locator('#music-volume').evaluate(input=>{input.value='63';input.dataset.preserved='yes';input.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.evaluate(()=>demo.update('media_player.wohnzimmer',{attributes:{volume_level:0.1}}));
  assert.equal(await card().locator('#music-volume').getAttribute('data-preserved'),'yes');assert.equal(await card().locator('#music-volume').inputValue(),'63');
  await action('open-radio').focus();assert.equal(await card().locator('#music-volume').inputValue(),'10');
 });
 await check('late browse responses cannot replace newer search results or reopen a dialog',async()=>{
  await reset();await action('open-radio').click();
  await page.evaluate(()=>{demo.wsHook=msg=>msg.media_content_id?.endsWith('/popular')?new Promise(r=>window.finishOld=()=>r({children:[demo.station('old','Alter Sender')]})):undefined});
  await dialog().locator('[data-action="popular"]').click();
  await dialog().locator('#music-radio-query').fill('SWR3');await dialog().locator('[data-action="search"]').click();
  await dialog().locator('[data-action="play-station"]').first().waitFor();await page.evaluate(()=>finishOld());
  assert(!await dialog().getByText('Alter Sender',{exact:true}).count());
  await page.keyboard.press('Escape');assert(!await dialog().isVisible());
 });
 await check('unavailable entity and unsupported actions are disabled; stop fallback',async()=>{
  await reset();await page.evaluate(()=>demo.update('media_player.wohnzimmer',{state:'unavailable'}));
  assert(await action('play-pause').isDisabled());assert(!await action('open-radio').isDisabled());assert(await card().locator('#music-volume').isDisabled());
  await page.evaluate(()=>demo.update('media_player.wohnzimmer',{state:'playing',attributes:{supported_features:4096}}));
  assert(await action('next').isDisabled());assert(await action('previous').isDisabled());assert.equal(await action('play-pause').getAttribute('aria-label'),'Pause');
  await action('play-pause').click();assert.equal(await page.evaluate(()=>demo.calls.at(-1).service),'media_stop');
 });
 await check('per-card switches hide controls and registry editor only lists Sonos',async()=>{
  await reset();await page.evaluate(()=>{
   const card=demo.cards[1];card.setConfig({entity:'media_player.maximilian_sonos',controls:{next:false,previous:false,mute:false}});
   const editor=document.createElement('music-manager-card-editor');editor.setConfig({type:'custom:music-manager-card',entity:'media_player.wohnzimmer'});editor.hass=demo.makeHass();window.editorEvents=[];editor.addEventListener('config-changed',e=>{editorEvents.push(e.detail.config);editor.setConfig(e.detail.config);});document.querySelector('#editor-host').append(editor);
  });
  assert.equal(await page.locator('music-manager-card').nth(1).locator('[data-action="next"]').count(),0);
  const editor=page.locator('music-manager-card-editor');await editor.locator('#music-entity-options [data-ui-option]').first().waitFor({state:'attached'});
  const options=await editor.locator('#music-entity-options [data-ui-option]').evaluateAll(nodes=>nodes.map(e=>e.dataset.value));
  assert.deepEqual(options.sort(),['media_player.maximilian_sonos','media_player.wohnzimmer']);
  await editor.locator('#music-entity').fill('Maximilian');await editor.locator('#music-entity-options [data-ui-option]').filter({hasText:'Sonos Maximilian'}).click();
  assert.equal(await page.evaluate(()=>editorEvents.at(-1).entity),'media_player.maximilian_sonos');
  assert.equal(await editor.locator('#music-name').count(),0);
  assert.equal(await editor.getByRole('switch',{name:'Stummschalten',exact:true}).count(),0);
  assert.equal(await editor.locator('#music-entity-options').isVisible(),false);
  await editor.getByRole('switch',{name:'Nächster Titel',exact:true}).click();
  assert.equal(await page.evaluate(()=>editorEvents.at(-1).controls.next),false);
 });
 await check('station labels and configured names are escaped, duplicate binds avoided on reconnect',async()=>{
  await reset();await page.evaluate(()=>{
   demo.cards[0].setConfig({entity:'media_player.wohnzimmer',name:'<img src=x onerror="window.injected=1">'});
   demo.wsHook=msg=>msg.type==='media_source/search_media'?{result:[demo.station('x','<script>window.injected=1</script>')]}:undefined;
   const c=demo.cards[0];c.remove();document.querySelector('#cards').prepend(c);c.hass=demo.makeHass();
  });
  assert.equal(await card().locator('img').count(),0);
  await action('play-pause').click();assert.equal(await page.evaluate(()=>demo.calls.length),1);
  await action('open-radio').click();await dialog().locator('#music-radio-query').fill('x');await dialog().locator('[data-action="search"]').click();await dialog().locator('[data-action="play-station"]').waitFor();
  assert.equal(await dialog().locator('script').count(),0);assert.equal(await page.evaluate(()=>window.injected),undefined);await page.keyboard.press('Escape');
 });
 await check('compact transport without Stop and user favorites on every box',async()=>{
  await reset();assert.equal(await card().locator('.music-transport button').count(),3);
  assert.deepEqual(await card().locator('.music-transport button').evaluateAll(nodes=>nodes.map(e=>e.dataset.action)),['previous','play-pause','next']);
  assert.equal(await card().locator('.music-box').innerText(),'Sonos Wohnzimmer');assert.equal(await card().locator('nav').count(),0);
  assert.equal(await action('stop').count(),0);
  await action('open-radio').click();await dialog().locator('[data-action="popular"]').click();
  await dialog().locator('[data-action="toggle-favorite"]').first().click();
  await page.waitForFunction(()=>demo.cards.every(c=>c.shadowRoot.querySelectorAll('[data-action="play-favorite"]').length===1));
  assert.equal(await dialog().locator('[data-action="toggle-favorite"]').first().getAttribute('aria-pressed'),'true');
  await dialog().getByRole('button',{name:'Schließen',exact:true}).click();
  const second=page.locator('music-manager-card').nth(1);await second.locator('[data-action="play-favorite"]').click();
  assert.equal(await page.evaluate(()=>demo.calls.at(-1).data.entity_id),'media_player.maximilian_sonos');
  await page.evaluate(()=>demo.switchUser('paul'));assert.equal(await action('play-favorite').count(),0);
  await page.evaluate(()=>demo.switchUser('manuel'));await action('play-favorite').waitFor();
  // Recreate the card, as on dashboard reload; server-side favorites remain.
  await page.evaluate(()=>{const c=demo.cards[0];c.remove();document.querySelector('#cards').prepend(c);});await action('play-favorite').waitFor();
  await action('open-radio').click();await dialog().locator('[data-action="toggle-favorite"]').first().click();
  await page.waitForFunction(()=>demo.cards.every(c=>!c.shadowRoot.querySelector('[data-action="play-favorite"]')));await page.keyboard.press('Escape');
 });
 await check('other-device favorites update live, unsafe/broken logos fall back, errors remain visible',async()=>{
  await reset();await page.evaluate(()=>demo.seedFavorites('manuel',[
   {...demo.station('safe','Logo'),thumbnail:'/brand/icon.png'},
   {...demo.station('broken','Fehlendes Logo'),thumbnail:'/missing.png'},
   {...demo.station('bad','<script>bad()</script>'),thumbnail:'javascript:alert(1)'}
  ]));
  assert.equal(await card().locator('[data-action="play-favorite"] img').count(),2);
  await page.waitForFunction(()=>demo.cards[0].shadowRoot.querySelector('img[src="/missing.png"]').hidden);
  assert.equal(await card().locator('script').count(),0);assert.equal(await card().locator('[data-action="play-favorite"]').count(),3);
  await action('open-radio').click();await dialog().locator('[data-action="popular"]').click();await page.evaluate(()=>demo.failFavorites=true);
  await dialog().locator('[data-action="toggle-favorite"]').first().click();await dialog().getByRole('alert').waitFor();
  assert.match(await dialog().getByRole('alert').innerText(),/nicht gespeichert/);
  await page.evaluate(()=>demo.failFavorites=false);await dialog().locator('[data-action="toggle-favorite"]').first().click();await page.keyboard.press('Escape');
 });
 await check('slider silences at zero and releases external mute, with keyboard access',async()=>{
  await reset();await page.evaluate(()=>demo.update('media_player.wohnzimmer',{attributes:{is_volume_muted:true}}));
  assert.equal(await card().locator('#music-volume').inputValue(),'0');
  await card().locator('#music-volume').focus();await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>demo.calls.some(c=>c.service==='volume_mute'));
  assert.equal(await page.evaluate(()=>demo.calls.find(c=>c.service==='volume_mute').data.is_volume_muted),false);
  await page.keyboard.press('Home');await page.waitForFunction(()=>demo.calls.at(-1).data.volume_level===0);
  await action('open-radio').focus();
 });
 await check('desktop/mobile light/dark layouts and exact UI Kit typography',async()=>{
  await reset();
  await page.evaluate(()=>demo.seedFavorites('manuel',Array.from({length:7},(_,i)=>({...demo.station('favorite-'+i,i===6?'Ein besonders langer Favoritensendername':'Sender '+(i+1)),thumbnail:'/brand/icon.png'}))));
  await action('open-radio').click();await dialog().locator('[data-action="popular"]').click();await dialog().locator('[data-action="play-station"]').first().waitFor();await page.keyboard.press('Escape');
  // A separate untouched UI Kit reference ensures local styles do not alter shared components.
  await page.evaluate(async()=>{
   const kit=await import('/src/family-ui/1.4.0/family-ui.js');const ref=document.querySelector('#reference').attachShadow({mode:'open'});
   ref.innerHTML=`<style>${kit.UI_CSS}</style>${kit.row({title:'Referenz',description:'Beschreibung',trailing:kit.button({label:'Abspielen',action:'ref'})})}`;
  });
  for(const width of [320,375,390,430,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:900});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   await page.evaluate(w=>demo.update('media_player.wohnzimmer',{attributes:{friendly_name:w===320?'Büro Manuel – Sonos im Arbeitszimmer':'Büro Manuel',media_title:w===320?'SWR dasding – Live aus Baden-Württemberg':'SWR dasding'}}),width);
   const report=await page.evaluate(()=>{
    const c=demo.cards[0].shadowRoot,ref=document.querySelector('#reference').shadowRoot;
    const props=['fontFamily','fontSize','fontWeight','lineHeight','color','paddingTop','paddingRight','paddingBottom','paddingLeft'];
    const styles=(root,selector)=>Object.fromEntries(props.map(p=>[p,getComputedStyle(root.querySelector(selector))[p]]));
    const overflow=[...c.querySelectorAll('#player *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<0||r.right>innerWidth+1)}).map(e=>e.outerHTML.slice(0,100));
    return {pageOverflow:document.documentElement.scrollWidth>innerWidth,overflow,card:styles(c,'#music-radio-results .row-text strong'),ref:styles(ref,'.row-text strong')};
   });
   assert(!report.pageOverflow,`${width} page overflow`);assert.deepEqual(report.overflow,[]);assert.deepEqual(report.card,report.ref);
   const layout=await card().evaluate(el=>{const r=el.shadowRoot;return {controls:r.querySelector('.music-controls').getBoundingClientRect().bottom,favorites:r.querySelector('#music-favorites').getBoundingClientRect().top,buttons:[...r.querySelectorAll('.music-transport button')].map(e=>e.getBoundingClientRect().width),slider:r.querySelector('#music-volume').getBoundingClientRect().height,header:r.querySelector('.music-header').getBoundingClientRect().toJSON(),box:r.querySelector('.music-box').getBoundingClientRect().toJSON(),title:r.querySelector('.music-title').getBoundingClientRect().toJSON(),titleSize:parseFloat(getComputedStyle(r.querySelector('.music-title')).fontSize),boxSize:parseFloat(getComputedStyle(r.querySelector('.music-box')).fontSize)};});
   assert(layout.favorites>=layout.controls);assert(layout.buttons.every(w=>Math.abs(w-layout.buttons[0])<1));assert.equal(layout.slider,4);
   assert(layout.title.x<layout.box.x);assert(layout.title.right<=layout.box.x);assert(Math.abs(layout.box.right-layout.header.right)<1);assert(Math.abs(layout.box.y-layout.title.y)<1);assert(layout.titleSize>=layout.boxSize+6);
   await page.screenshot({path:path.join(screens,`card-${width}-${dark?'dark':'light'}.png`),fullPage:true});
   await action('open-radio').click();await dialog().locator('[data-action="popular"]').click();await dialog().locator('[data-action="play-station"]').first().waitFor();
   const bounds=await dialog().boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width+1);
   const dialogOverflow=await dialog().evaluate(e=>e.scrollWidth>e.clientWidth);assert(!dialogOverflow,`${width} dialog overflow`);
   await page.screenshot({path:path.join(screens,`radio-${width}-${dark?'dark':'light'}.png`),fullPage:true});await page.keyboard.press('Escape');
  }
 });
 await check('favorite management lists checked favorites, persists removal and works without Radio Browser',async()=>{
  await reset();await page.evaluate(()=>{
   demo.seedFavorites('manuel',[{...demo.station('swr3','SWR3'),thumbnail:'/brand/icon.png'},demo.station('bigfm','bigFM Deutschland'),demo.station('energy','Radio Energy Stuttgart')]);
   demo.failBrowse=true;demo.update('media_player.wohnzimmer',{state:'unavailable'});
  });
  await action('open-radio').click();await dialog().getByRole('alert').waitFor();
  await dialog().getByRole('button',{name:'Favoriten verwalten',exact:true}).click();
  assert.equal(await dialog().getByRole('checkbox').count(),3);assert(await dialog().getByRole('checkbox').first().isChecked());
  for(const width of [375,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:900});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   assert(!await dialog().evaluate(el=>el.scrollWidth>el.clientWidth));
   await page.screenshot({path:path.join(screens,`favorites-${width}-${dark?'dark':'light'}.png`),fullPage:true});
  }
  await dialog().getByRole('checkbox',{name:'Favorit behalten: SWR3',exact:true}).click();
  await page.waitForFunction(()=>demo.cards.every(c=>c._favorites.length===2));
  assert.equal(await dialog().getByRole('checkbox').count(),2);assert.equal(await page.evaluate(()=>demo.favoriteData.get('manuel').length),2);
  await page.evaluate(()=>demo.failFavorites=true);await dialog().getByRole('checkbox').first().click();await dialog().getByRole('alert').waitFor();
  assert(await dialog().getByRole('checkbox').first().isChecked());
  await page.evaluate(()=>demo.failFavorites=false);
  for(let remaining=2;remaining>0;remaining--){await dialog().getByRole('checkbox').first().click();await page.waitForFunction(n=>demo.cards[0]._favorites.length===n,remaining-1);}
  await dialog().getByText('Keine Favoriten vorhanden.',{exact:false}).waitFor();assert.equal(await page.evaluate(()=>demo.calls.length),0);
  await page.keyboard.press('Escape');
 });
 await check('Apple Music footer button opens personal playlists, catalog search and selected-box playback',async()=>{
  await reset();const apple=card().locator('#music-apple-dialog');
  assert.equal(await card().locator('#music-favorites [data-action="open-apple"]').count(),0);
  assert.equal(await card().locator('#music-favorites > :not([data-action="play-favorite"])').count(),0);
  await action('open-apple').click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();
  assert.match(await apple.locator('#music-apple-account').innerText(),/Manuel/);
  await apple.locator('#music-apple-query').fill('Liebling');await apple.locator('#music-apple-query').press('Enter');
  await apple.getByText('Beispieltitel: Liebling',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Abspielen',exact:true}).click();await apple.waitFor({state:'hidden'});
  const command=await page.evaluate(()=>demo.wsCalls.filter(m=>m.type==='music_manager/apple_music').at(-1));
  assert.equal(command.action,'play');assert.equal(command.entity_id,undefined);assert.equal(command.source_entity,'media_player.wohnzimmer');assert.equal(command.user_id,undefined);
  await action('next').click();assert.equal(await page.evaluate(()=>demo.wsCalls.at(-1).action),'next');assert.equal(await page.evaluate(()=>demo.wsCalls.at(-1).source_entity),'media_player.wohnzimmer');
 });
 await check('one user can play Apple Music on each box without manual MA configuration',async()=>{
  await reset();
  for(const [index,source,target] of [[0,'media_player.wohnzimmer','media_player.ma_wohnzimmer'],[1,'media_player.maximilian_sonos','media_player.ma_maximilian']]){
   const box=page.locator('music-manager-card').nth(index),apple=box.locator('#music-apple-dialog');
   await box.locator('[data-action="open-apple"]').click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();
   assert.match(await apple.locator('#music-apple-account').innerText(),/Manuel/);
   await apple.getByRole('button',{name:'Abspielen',exact:true}).click();await apple.waitFor({state:'hidden'});
   const command=await page.evaluate(()=>demo.wsCalls.filter(m=>m.type==='music_manager/apple_music').at(-1));
   assert.equal(command.source_entity,source);assert.equal(command.entity_id,undefined);
   await box.locator('[data-action="next"]').click();assert.equal(await page.evaluate(()=>demo.wsCalls.at(-1).action),'next');assert.equal(await page.evaluate(()=>demo.wsCalls.at(-1).source_entity),source);
  }
 });
 await check('Apple Music dialog handles missing setup, account changes and rejected playback',async()=>{
  await reset();await page.evaluate(()=>{demo.wsHook=msg=>{if(msg.type==='music_manager/apple_music')throw {code:'unknown_command'};};});await action('open-apple').click();
  const apple=card().locator('#music-apple-dialog');assert.match(await apple.innerText(),/Connector/);assert(await apple.locator('#music-apple-query').isDisabled());
  await apple.getByRole('button',{name:'Schließen',exact:true}).click();
  await page.evaluate(()=>{demo.wsHook=null;});
  await action('open-apple').click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();
  await page.evaluate(()=>{demo.wsHook=msg=>{if(msg.type==='music_manager/apple_music'&&msg.action==='play')throw new Error('Box nicht erreichbar');};});
  await apple.getByRole('button',{name:'Abspielen',exact:true}).click();await apple.getByRole('alert').waitFor();assert(await apple.isVisible());
  await page.evaluate(()=>demo.switchUser('maximilian'));await apple.waitFor({state:'hidden'});assert.equal(await apple.locator('#music-apple-results .setting-row').count(),0);
 });
 await check('hidden MA player gives a permission hint and recovers after the label is granted',async()=>{
  await reset();await page.evaluate(()=>{demo.switchUser('paul');demo.wsHook=msg=>msg.type==='music_manager/apple_music'?null:undefined;});
  await action('open-apple').click();const apple=card().locator('#music-apple-dialog');
  await apple.getByRole('alert').waitFor();assert.match(await apple.getByRole('alert').innerText(),/Music-Assistant-Entität.*Access Control.*Label/);
  assert(await apple.locator('#music-apple-query').isDisabled());assert.equal(await apple.locator('[data-action="apple-play"]').count(),0);
  assert.equal(await page.evaluate(()=>demo.wsCalls.filter(m=>m.type==='music_manager/apple_music'&&m.action!=='status').length),0);
  for(const width of [375,1100]){
   await page.setViewportSize({width,height:900});const bounds=await apple.boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width+1);
   assert(!await apple.evaluate(el=>el.scrollWidth>el.clientWidth));
   await page.screenshot({path:path.join(screens,`apple-permission-${width}.png`),fullPage:true});
  }
  await apple.getByRole('button',{name:'Schließen',exact:true}).click();await page.evaluate(()=>demo.wsHook=null);
  await action('open-apple').click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();assert(await apple.locator('#music-apple-query').isEnabled());
 });
 await check('Apple Music footer and picker fit desktop/mobile and light/dark themes',async()=>{
  await reset();const apple=card().locator('#music-apple-dialog');
  for(const width of [320,375,390,430,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:900});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   const radioBounds=await action('open-radio').boundingBox(),appleBounds=await action('open-apple').boundingBox();
   assert(Math.abs(radioBounds.y-appleBounds.y)<1);assert(appleBounds.x>=radioBounds.x+radioBounds.width);assert(appleBounds.x+appleBounds.width<=width);
   assert.equal(await card().locator('#music-favorites > :not([data-action="play-favorite"])').count(),0);
   await action('open-apple').click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();
   const bounds=await apple.boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width+1);assert(!await apple.evaluate(el=>el.scrollWidth>el.clientWidth));
   await page.screenshot({path:path.join(screens,`apple-music-${width}-${dark?'dark':'light'}.png`),fullPage:true});
   await apple.getByRole('button',{name:'Schließen',exact:true}).click();
  }
 });
 await check('Apple timeline seeks forwards and backwards only on release, and shuffle stays on the selected box',async()=>{
  await reset();const apple=card().locator('#music-apple-dialog');
  await action('open-apple').click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Abspielen',exact:true}).click();await apple.waitFor({state:'hidden'});
  await page.evaluate(()=>demo.update('media_player.ma_wohnzimmer',{state:'paused'}));
  for(const position of [120,30]){
   const before=await page.evaluate(()=>demo.calls.length),seek=card().locator('#music-seek');
   await seek.focus();await seek.evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},String(position));
   assert.equal(await page.evaluate(()=>demo.calls.length),before);
   await seek.evaluate(el=>el.dispatchEvent(new Event('change',{bubbles:true})));
   await page.waitForFunction(n=>demo.calls.length===n,before+1);
   const call=await page.evaluate(()=>demo.calls.at(-1));assert.equal(call.service,'media_seek');assert.equal(call.data.seek_position,position);assert.equal(call.data.entity_id,'media_player.ma_wohnzimmer');
  }
  await action('shuffle').click();await page.waitForFunction(()=>demo.states['media_player.ma_wohnzimmer'].attributes.shuffle===true);
  assert.equal(await action('shuffle').getAttribute('aria-pressed'),'true');
  const call=await page.evaluate(()=>demo.calls.at(-1));assert.equal(call.service,'shuffle_set');assert.equal(call.data.shuffle,true);assert.equal(call.data.entity_id,'media_player.ma_wohnzimmer');
  await action('shuffle').click();await page.waitForFunction(()=>demo.states['media_player.ma_wohnzimmer'].attributes.shuffle===false);
 });
 await check('radio selection releases stale MA metadata, timeline, shuffle and command routing',async()=>{
  await reset();const apple=card().locator('#music-apple-dialog');await action('open-apple').click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Abspielen',exact:true}).click();await apple.waitFor({state:'hidden'});
  await page.evaluate(()=>demo.cards[0]._playStation(demo.station('swr3','SWR3')));
  await page.evaluate(()=>demo.update('media_player.ma_wohnzimmer',{attributes:{active_queue:'old-queue',media_title:'Alter Apple-Titel'}}));
  assert.match(await card().locator('#player').innerText(),/SWR3/);assert(!((await card().locator('#player').innerText()).includes('Alter Apple-Titel')));
  assert.equal(await card().locator('#music-seek').count(),0);assert.equal(await action('shuffle').count(),0);
  await action('next').click();assert.equal(await page.evaluate(()=>demo.calls.at(-1).data.entity_id),'media_player.wohnzimmer');
 });
 await check('radio survives stale MA updates, a recreated card and a different HA user',async()=>{
  await reset();const apple=card().locator('#music-apple-dialog');await action('open-apple').click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Abspielen',exact:true}).click();await apple.waitFor({state:'hidden'});
  await page.evaluate(()=>demo.cards[0]._playStation(demo.station('swr3','SWR3')));
  await page.evaluate(()=>{demo.cards[0].remove();demo.cards.shift();const c=demo.addCard('media_player.wohnzimmer','Neue Karte');document.querySelector('#cards').prepend(c);demo.cards.unshift(demo.cards.pop());});
  await page.waitForFunction(()=>demo.cards[0]._musicAssistantEntity==='media_player.ma_wohnzimmer');
  for(let i=0;i<3;i++)await page.evaluate(n=>{demo.update('media_player.ma_wohnzimmer',{attributes:{active_queue:'old-queue',media_title:'Alter Apple-Titel '+n}});demo.update('media_player.wohnzimmer',{attributes:{volume_level:0.2+n/10}});},i);
  await page.evaluate(()=>demo.switchUser('vera'));
  assert.match(await card().locator('#player').innerText(),/SWR3/);assert(!((await card().locator('#player').innerText()).includes('Alter Apple-Titel')));
  assert.equal(await card().locator('#music-seek').count(),0);assert.equal(await action('shuffle').count(),0);
  await action('next').click();assert.equal(await page.evaluate(()=>demo.calls.at(-1).data.entity_id),'media_player.wohnzimmer');
  await page.screenshot({path:path.join(screens,'radio-after-reload.png'),fullPage:true});
 });
 await check('partial old radio metadata cannot replace the selected station and external Apple playback is detected',async()=>{
  await reset();await page.evaluate(()=>demo.cards[0]._playStation(demo.station('swr3','SWR3')));
  await page.evaluate(()=>{demo.update('media_player.wohnzimmer',{attributes:{media_channel:'Apple Music',media_title:'Alter Apple-Titel',media_artist:'Alter Interpret'}});demo.update('media_player.ma_wohnzimmer',{state:'playing',attributes:{active_queue:'old-queue',media_title:'Alter Apple-Titel',media_duration:240}});});
  assert.match(await card().locator('#player').innerText(),/SWR3/);assert(!((await card().locator('#player').innerText()).includes('Alter Apple-Titel')));
  await page.evaluate(()=>demo.update('media_player.wohnzimmer',{attributes:{media_content_id:'http://music-assistant.example:8095/single/session/queue/item/player.flac',media_channel:'Music Assistant'}}));
  await card().locator('#music-seek').waitFor();assert.equal(await page.evaluate(()=>demo.cards[0]._controlEntity),'media_player.ma_wohnzimmer');
 });
 await check('Apple timeline and shuffle fit narrow mobile and desktop views in both themes',async()=>{
  await reset();const apple=card().locator('#music-apple-dialog');await action('open-apple').click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Abspielen',exact:true}).click();await apple.waitFor({state:'hidden'});
  for(const width of [320,390,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:900});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   assert(!(await card().evaluate(el=>el.scrollWidth>el.clientWidth)));
   assert.match(await card().locator('#music-seek').getAttribute('aria-valuetext'),/\d+:\d{2} \/ 4:00/);
   await page.screenshot({path:path.join(screens,`apple-playback-${width}-${dark?'dark':'light'}.png`),fullPage:true});
  }
 });
 await check('albums, playlists and radio share sortable personal favorites on every box',async()=>{
  await reset();await page.evaluate(()=>demo.seedFavorites('manuel',[demo.station('swr3','SWR3')]));
  const apple=card().locator('#music-apple-dialog');await action('open-apple').click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Als Favorit speichern: Meine Lieblingsmusik',exact:true}).click();
  await page.waitForFunction(()=>demo.favoriteData.get('manuel').length===2);
  await apple.locator('[data-action="apple-library"][data-view="album"]').click();await apple.getByText('Mein Lieblingsalbum',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Als Favorit speichern: Mein Lieblingsalbum',exact:true}).click();
  await page.waitForFunction(()=>demo.favoriteData.get('manuel').length===3);
  await apple.getByRole('button',{name:'Favoriten verwalten',exact:true}).click();await apple.waitFor({state:'hidden'});
  const manager=dialog();await manager.getByRole('checkbox',{name:'Favorit behalten: Mein Lieblingsalbum',exact:true}).waitFor();
  await manager.getByRole('button',{name:'Nach oben: Mein Lieblingsalbum',exact:true}).click();
  await page.waitForFunction(()=>demo.favoriteData.get('manuel')[1].title==='Mein Lieblingsalbum');
  await manager.getByRole('button',{name:'Nach oben: Mein Lieblingsalbum',exact:true}).click();
  await page.waitForFunction(()=>demo.favoriteData.get('manuel')[0].title==='Mein Lieblingsalbum');
  assert(await manager.getByRole('button',{name:'Nach oben: Mein Lieblingsalbum',exact:true}).isDisabled());
  assert.deepEqual(await page.evaluate(()=>demo.favoriteData.get('manuel').map(f=>f.title)),['Mein Lieblingsalbum','SWR3','Meine Lieblingsmusik']);
  for(const width of [320,390,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:900});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   assert(!(await manager.evaluate(el=>el.scrollWidth>el.clientWidth)));
   assert(!(await manager.locator('#music-radio-results').evaluate(el=>el.scrollWidth>el.clientWidth)));
   await page.screenshot({path:path.join(screens,`mixed-favorites-${width}-${dark?'dark':'light'}.png`),fullPage:true});
  }
  await manager.getByRole('checkbox',{name:'Favorit behalten: Meine Lieblingsmusik',exact:true}).click();
  await page.waitForFunction(()=>demo.cards.every(c=>c._favorites.length===2));
  await manager.getByRole('button',{name:'Schließen',exact:true}).click();
  const second=page.locator('music-manager-card').nth(1);
  await second.getByRole('button',{name:'Mein Lieblingsalbum abspielen',exact:true}).click();
  await page.waitForFunction(()=>demo.wsCalls.filter(m=>m.type==='music_manager/apple_music').at(-1).action==='play');
  const play=await page.evaluate(()=>demo.wsCalls.filter(m=>m.type==='music_manager/apple_music').at(-1));
  assert.equal(play.uri,'apple_music--demo://album/123');assert.equal(play.source_entity,'media_player.maximilian_sonos');
  await page.evaluate(()=>demo.switchUser('vera'));await page.waitForFunction(()=>demo.cards.every(c=>c._favorites.length===0));
 });
 await check('favorite management opens without radio setup and sorting failures preserve the saved order',async()=>{
  await reset();await page.evaluate(()=>{demo.seedFavorites('manuel',[demo.station('one','Eins'),demo.station('two','Zwei')]);demo.failBrowse=true;});
  await card().locator('#player [data-action="manage-favorites"]').click();
  await dialog().getByRole('checkbox',{name:'Favorit behalten: Eins',exact:true}).waitFor();
  await page.evaluate(()=>demo.failFavorites=true);
  await dialog().getByRole('button',{name:'Nach unten: Eins',exact:true}).click();await dialog().getByRole('alert').waitFor();
  assert.deepEqual(await page.evaluate(()=>demo.favoriteData.get('manuel').map(f=>f.title)),['Eins','Zwei']);
  assert.equal(await page.evaluate(()=>demo.wsCalls.filter(m=>m.type==='media_source/browse_media').length),0);
 });
 await check('album and playlist tracks offer separate wake songs, pagination retry and back navigation',async()=>{
  await reset();await page.waitForFunction(()=>demo.cards.every(c=>!c._alarmSongLoading));
  await page.evaluate(()=>{let failed=false;demo.wsHook=msg=>{
   if(msg.type!=='music_manager/apple_music'||msg.action!=='tracks')return;
   if(msg.offset===50&&!failed){failed=true;throw new Error('Titel vorübergehend nicht verfügbar');}
   const kind=msg.uri.includes('://album/')?'Album':'Playlist';
   return {items:[{uri:'apple_music--demo://track/'+kind+'-'+(msg.offset||0),title:kind+' Lied '+(msg.offset||0),description:'Interpret · Ein einzelner Titel',media_type:'track'}],more:!msg.offset,next_offset:(msg.offset||0)+50};
  };});
  const apple=card().locator('#music-apple-dialog');await action('open-apple').click();
  await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Titel anzeigen',exact:true}).click();await apple.getByText('Playlist Lied 0',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Als Wecklied markieren: Playlist Lied 0',exact:true}).click();
  await page.waitForFunction(()=>demo.cards.every(c=>c._alarmSongs.length===1));
  assert.equal(await card().locator('#player .music-favorite').count(),0);
  assert.equal(await page.evaluate(()=>demo.favoriteData.get('manuel')?.length||0),0);
  assert.equal(await page.evaluate(()=>demo.calls.length),0);
  await apple.getByRole('button',{name:'Mehr laden',exact:true}).click();await apple.getByRole('alert').filter({hasText:'vorübergehend'}).waitFor();
  await apple.getByText('Playlist Lied 0',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Erneut laden',exact:true}).click();await apple.getByText('Playlist Lied 50',{exact:true}).waitFor();
  assert.deepEqual(await page.evaluate(()=>demo.wsCalls.filter(m=>m.action==='tracks').map(m=>m.offset)),[0,50,50]);
  for(const width of [320,390,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:900});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   assert(!await apple.evaluate(el=>el.scrollWidth>el.clientWidth));
   assert(await apple.locator('#music-apple-results .row-text').first().evaluate(el=>el.getBoundingClientRect().width>=120));
   await page.screenshot({path:path.join(screens,`album-playlist-tracks-${width}-${dark?'dark':'light'}.png`),fullPage:true});
  }
  await apple.getByRole('button',{name:'Wecklieder',exact:true}).click();assert.equal(await apple.locator('[data-action="apple-play"]').count(),1);
  await apple.getByRole('button',{name:'Zurück',exact:true}).click();await apple.getByText('Playlist Lied 50',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Zurück',exact:true}).click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Alben',exact:true}).click();await apple.getByText('Mein Lieblingsalbum',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Titel anzeigen',exact:true}).click();await apple.getByText('Album Lied 0',{exact:true}).waitFor();
  await apple.getByRole('button',{name:'Als Wecklied markieren: Album Lied 0',exact:true}).click();
  await page.waitForFunction(()=>demo.cards.every(c=>c._alarmSongs.length===2));
  await apple.getByRole('button',{name:'Schließen',exact:true}).click();
  const second=page.locator('music-manager-card').nth(1),otherApple=second.locator('#music-apple-dialog');
  await second.locator('[data-action="open-apple"]').click();await otherApple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();await otherApple.getByRole('button',{name:'Wecklieder',exact:true}).click();
  await otherApple.getByText('Album Lied 0',{exact:true}).waitFor();await otherApple.getByText('Playlist Lied 0',{exact:true}).waitFor();
  await page.evaluate(()=>demo.switchUser('paul'));await page.waitForFunction(()=>demo.cards.every(c=>c._alarmSongs.length===0));
  assert.equal(await page.evaluate(()=>demo.calls.length),0);
 });
 await check('old wake markers migrate out of favorites and wake-song lists remain personal',async()=>{
  await reset();await page.waitForFunction(()=>demo.cards.every(c=>!c._alarmSongLoading));
  await page.evaluate(()=>{
   demo.switchUser('paul');demo.seedAlarmSongs('paul',[{kind:'apple_music',uri:'apple_music--demo://track/paul',media_type:'track',title:'Pauls Wecklied'}]);
   demo.seedFavorites('manuel',[demo.station('radio','Mein Radio'),{kind:'apple_music',uri:'apple_music--demo://track/legacy',media_type:'track',title:'Bisheriges Wecklied',alarm_song:true}]);demo.switchUser('manuel');
  });
  await page.waitForFunction(()=>demo.cards.every(c=>!c._alarmSongLoading&&c._alarmSongs.length===1&&c._favorites.length===1));
  assert.deepEqual(await page.evaluate(()=>demo.favoriteData.get('manuel').map(f=>f.title)),['Mein Radio']);
  await action('open-apple').click();const apple=card().locator('#music-apple-dialog');await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();await apple.getByRole('button',{name:'Wecklieder',exact:true}).click();
  await apple.getByText('Bisheriges Wecklied',{exact:true}).waitFor();assert.equal(await apple.getByText('Pauls Wecklied',{exact:true}).count(),0);
  await page.evaluate(()=>demo.switchUser('paul'));await page.waitForFunction(()=>demo.cards.every(c=>!c._alarmSongLoading&&c._alarmSongs[0]?.title==='Pauls Wecklied'));
  await action('open-apple').click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();await apple.getByRole('button',{name:'Wecklieder',exact:true}).click();await apple.getByText('Pauls Wecklied',{exact:true}).waitFor();
  assert.equal(await apple.getByText('Bisheriges Wecklied',{exact:true}).count(),0);
 });
 await check('single songs are explicitly marked as alarm songs and only these appear in the alarm picker',async()=>{
  await reset();await page.evaluate(()=>{demo.switchUser('maximilian');demo.seedFavorites('maximilian',[
   {kind:'apple_music',uri:'apple_music--demo://album/old',media_type:'album',title:'Normales Album'},
   {kind:'apple_music',uri:'apple_music--demo://playlist/old',media_type:'playlist',title:'Normale Playlist'},
   {kind:'apple_music',uri:'apple_music--demo://track/normal',media_type:'track',title:'Normaler Titel'}]);});
  const apple=card().locator('#music-apple-dialog');await action('open-apple').click();
  await apple.getByRole('button',{name:'Titel',exact:true}).click();await apple.getByText('Mein Lieblingstitel',{exact:true}).waitFor();
  await apple.locator('[data-action="apple-favorite"]').click();await page.waitForFunction(()=>demo.favoriteData.get('maximilian').length===4);
  assert(!await page.evaluate(()=>demo.favoriteData.get('maximilian').some(f=>f.alarm_song)));
  await apple.getByRole('button',{name:'Als Wecklied markieren: Mein Lieblingstitel',exact:true}).click();
  await page.waitForFunction(()=>demo.cards.every(c=>c._alarmSongs.length===1));
  for(const width of [320,390,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:900});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   assert(!await apple.evaluate(el=>el.scrollWidth>el.clientWidth));
   assert(await apple.locator('#music-apple-results .row-text').first().evaluate(el=>el.getBoundingClientRect().width>=120),'song titles must keep a readable width beside the cover');
   await page.screenshot({path:path.join(screens,`alarm-song-marking-${width}-${dark?'dark':'light'}.png`),fullPage:true});
  }
  await apple.getByRole('button',{name:'Schließen',exact:true}).click();await page.evaluate(()=>demo.addAlarmRow());
  const alarm=page.locator('music-manager-alarm-row').first(),picker=alarm.locator('#alarm-dialog');
  await alarm.getByRole('button',{name:'Auswählen',exact:true}).click();
  assert.equal(await picker.locator('[data-action="alarm-select"]').count(),1);assert.equal(await picker.getByText('Normales Album',{exact:true}).count(),0);assert.equal(await picker.getByText('Normaler Titel',{exact:true}).count(),0);
  await picker.getByRole('button',{name:'Wecklied auswählen: Mein Lieblingstitel',exact:true}).click();await picker.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>demo.calls.length),0);
  await action('open-apple').click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();await apple.getByRole('button',{name:'Wecklieder',exact:true}).click();
  await apple.getByRole('button',{name:'Wecklied entfernen: Mein Lieblingstitel',exact:true}).click();
  await page.waitForFunction(()=>demo.alarmSongData.get('maximilian').length===0);
  assert.equal(await page.evaluate(()=>demo.favoriteData.get('maximilian').length),4);await apple.getByRole('button',{name:'Schließen',exact:true}).click();
  await alarm.getByRole('button',{name:'Auswählen',exact:true}).click();await picker.getByText('Die bisherige Weckmusik bleibt gespeichert.',{exact:false}).waitFor();
  assert.equal(await picker.locator('[data-action="alarm-select"]').count(),0);await picker.getByRole('button',{name:'Auswahl zurücksetzen',exact:true}).click();await picker.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>demo.alarmSelections.get('school_alarm')),null);
 });
 await check('wake-song management is searchable and removable on small phones without nested scroll areas',async()=>{
  await reset();await page.waitForFunction(()=>demo.cards.every(c=>!c._alarmSongLoading));
  await page.evaluate(()=>{demo.seedAlarmSongs('manuel',Array.from({length:20},(_,n)=>({kind:'apple_music',uri:'apple_music--demo://track/wake-'+n,media_type:'track',title:'Wecklied '+n+' mit einem langen Namen zum sanften Aufwachen'})));demo.seedFavorites('manuel',[demo.station('swr3','SWR3')]);});
  const manager=card().locator('#music-apple-dialog');
  for(const size of [{width:320,height:568},{width:390,height:844},{width:430,height:932},{width:1100,height:800}])for(const dark of [false,true]){
   await page.setViewportSize(size);await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   await action('open-alarm-songs').click();await manager.getByRole('heading',{name:'Wecklieder verwalten',exact:true}).waitFor();
   assert.equal(await manager.locator('[data-action="remove-alarm-song"]').count(),20);
   assert(!await manager.evaluate(el=>el.scrollWidth>el.clientWidth));
   if(size.width<=600)assert(await manager.evaluate(el=>Math.abs(el.getBoundingClientRect().height-innerHeight)<2));
   assert(await manager.locator('.modal-body').evaluate(el=>el.scrollHeight>el.clientHeight));
   assert(await manager.locator('#music-apple-results').evaluate(el=>!['auto','scroll'].includes(getComputedStyle(el).overflowY)));
   const remove=manager.locator('[data-action="remove-alarm-song"]').first();assert((await remove.boundingBox()).height>=44);
   await page.screenshot({path:path.join(screens,`wake-song-management-${size.width}-${dark?'dark':'light'}.png`),fullPage:true});
   await manager.getByRole('button',{name:'Schließen',exact:true}).click();
  }
  await action('open-alarm-songs').click();const search=manager.locator('#music-alarm-song-query');await search.fill('19');
  assert.equal(await manager.locator('[data-action="remove-alarm-song"]').count(),1);assert(await search.evaluate(el=>el.getRootNode().activeElement===el));
  await page.evaluate(()=>demo.failFavorites=true);await manager.locator('[data-action="remove-alarm-song"]').click();await manager.getByRole('alert').waitFor();
  assert.equal(await page.evaluate(()=>demo.alarmSongData.get('manuel').length),20);
  await page.evaluate(()=>demo.failFavorites=false);await manager.locator('[data-action="remove-alarm-song"]').click();await page.waitForFunction(()=>demo.cards.every(c=>c._alarmSongs.length===19));
  assert.equal(await page.evaluate(()=>demo.favoriteData.get('manuel').length),1);assert.equal(await page.evaluate(()=>demo.calls.length),0);
  await manager.getByText('Keine passenden Wecklieder.',{exact:false}).waitFor();await search.fill('');
  await manager.getByRole('button',{name:'Lieder in Apple Music hinzufügen',exact:true}).click();await manager.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();
  await page.evaluate(()=>demo.switchUser('paul'));await page.waitForFunction(()=>demo.cards.every(c=>c._alarmSongs.length===0));
 });
 await check('selected wake clocks and favorite stars have matching filled states on phone and desktop',async()=>{
  await reset();await page.waitForFunction(()=>demo.cards.every(c=>!c._alarmSongLoading));
  await page.evaluate(()=>{
   const song={kind:'apple_music',uri:'apple_music--demo://track/selected',media_type:'track',title:'Ausgewähltes Wecklied'};
   demo.seedAlarmSongs('manuel',[song]);demo.seedFavorites('manuel',[song]);
   demo.wsHook=msg=>msg.type==='music_manager/apple_music'&&msg.action==='library'&&msg.media_type==='track'?{items:[song,{kind:'apple_music',uri:'apple_music--demo://track/other',media_type:'track',title:'Noch nicht ausgewähltes Lied'}],more:false}:undefined;
  });
  const apple=card().locator('#music-apple-dialog');await action('open-apple').click();await apple.getByText('Meine Lieblingsmusik',{exact:true}).waitFor();await apple.getByRole('button',{name:'Titel',exact:true}).click();await apple.getByText('Ausgewähltes Wecklied',{exact:true}).waitFor();
  assert.equal(await apple.locator('[data-action="apple-alarm-song"][aria-pressed="true"] svg').getAttribute('data-music-icon'),'alarmFilled');
  assert.equal(await apple.locator('[data-action="apple-alarm-song"][aria-pressed="false"] svg').getAttribute('data-music-icon'),'alarm');
  for(const width of [320,390,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:800});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   assert(!await apple.evaluate(el=>el.scrollWidth>el.clientWidth));
   assert(await apple.locator('#music-apple-results .row-text').first().evaluate(el=>el.getBoundingClientRect().width>=120));
   await page.screenshot({path:path.join(screens,`wake-song-icons-${width}-${dark?'dark':'light'}.png`),fullPage:true});
  }
 });
 await check('alarm selection is a visible searchable list with large targets and preserves failed saves',async()=>{
  await reset();await page.evaluate(()=>{demo.seedAlarmSongs('maximilian',Array.from({length:15},(_,n)=>({kind:'apple_music',uri:'apple_music--demo://track/wake-'+n,media_type:'track',title:'Wecklied '+n+' mit langem Namen für den Morgen'})));demo.addAlarmRow();});
  const alarm=page.locator('music-manager-alarm-row').first(),picker=alarm.locator('#alarm-dialog');
  for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1100,height:800}])for(const dark of [false,true]){
   await page.setViewportSize(size);await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   await alarm.getByRole('button',{name:'Auswählen',exact:true}).click();await picker.locator('[data-action="alarm-select"]').first().waitFor();
   assert.equal(await picker.getByRole('combobox').count(),0);assert(!await picker.evaluate(el=>el.scrollWidth>el.clientWidth));
   assert((await picker.locator('[data-action="alarm-select"]').first().boundingBox()).height>=64);
   await page.screenshot({path:path.join(screens,`alarm-song-list-${size.width}-${dark?'dark':'light'}.png`),fullPage:true});
   await picker.getByRole('button',{name:'Schließen',exact:true}).click();
  }
  await alarm.getByRole('button',{name:'Auswählen',exact:true}).click();await picker.locator('[data-action="alarm-select"]').first().waitFor();
  const search=picker.locator('#alarm-song-query');await search.fill('14');assert.equal(await picker.locator('[data-action="alarm-select"]').count(),1);assert(await search.evaluate(el=>el.getRootNode().activeElement===el));
  await page.evaluate(()=>demo.failAlarmSave=true);await picker.locator('[data-action="alarm-select"]').click();await picker.getByRole('alert').waitFor();assert.equal(await page.evaluate(()=>demo.alarmSelections.get('school_alarm')||null),null);
  await page.evaluate(()=>demo.failAlarmSave=false);await picker.locator('[data-action="alarm-select"]').click();await picker.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>demo.alarmSelections.get('school_alarm').uri),'apple_music--demo://track/wake-14');
  assert.equal(await page.evaluate(()=>demo.calls.length),0);
 });
 await check('alarm row selects and persists the configured owners Apple Music favorite without playback',async()=>{
  await reset();await page.evaluate(()=>{demo.seedAlarmSongs('maximilian',[{kind:'apple_music',uri:'apple_music--demo://track/wake',media_type:'track',alarm_song:true,title:'Meine Weckmusik'},{kind:'apple_music',uri:'apple_music--demo://track/morning',media_type:'track',alarm_song:true,title:'Guten Morgen'}]);demo.addAlarmRow();});
  let alarm=page.locator('music-manager-alarm-row').first();await alarm.locator('#alarm-row').getByText('Letzte Sonos-Wiedergabe',{exact:true}).waitFor();
  await alarm.getByRole('button',{name:'Auswählen',exact:true}).click();let picker=alarm.locator('#alarm-dialog');await picker.getByText('Maximilian',{exact:true}).waitFor();
  await picker.getByRole('button',{name:'Wecklied auswählen: Meine Weckmusik',exact:true}).click();await picker.waitFor({state:'hidden'});
  await alarm.locator('#alarm-row').getByText('Meine Weckmusik',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>demo.calls.length),0);
  const command=await page.evaluate(()=>demo.wsCalls.filter(m=>m.type==='music_manager/alarm'&&m.action==='select').at(-1));assert.equal(command.alarm_id,'school_alarm');assert.equal(command.uri,'apple_music--demo://track/wake');assert.equal(command.user_id,undefined);assert.equal(command.source_entity,undefined);
  await page.evaluate(()=>{demo.alarmRows[0].remove();demo.alarmRows.shift();demo.addAlarmRow();});alarm=page.locator('music-manager-alarm-row').first();await alarm.locator('#alarm-row').getByText('Meine Weckmusik',{exact:true}).waitFor();
  await alarm.getByRole('button',{name:'Auswählen',exact:true}).click();picker=alarm.locator('#alarm-dialog');await picker.getByText('Maximilian',{exact:true}).waitFor();
  await page.evaluate(()=>demo.failAlarmSave=true);await picker.getByRole('button',{name:'Wecklied auswählen: Guten Morgen',exact:true}).click();await picker.getByRole('alert').waitFor();assert.equal(await page.evaluate(()=>demo.alarmSelections.get('school_alarm').title),'Meine Weckmusik');
  await page.keyboard.press('Escape');await page.evaluate(()=>demo.switchUser('paul'));await alarm.locator('#alarm-row').getByText('Dieser Wecker gehört einem anderen Benutzer.',{exact:true}).waitFor();assert(!(await alarm.locator('#alarm-row').innerText()).includes('Meine Weckmusik'));
 });
 await check('alarm entities row keeps the untouched UI Kit button inline and within a narrow HA card',async()=>{
  await reset();await page.evaluate(async()=>{
   const song={kind:'apple_music',uri:'apple_music--demo://track/long',media_type:'track',title:'Skifahrt (Chicken Fajita) und ein sehr langer zusammenhängender Liedname'};demo.seedAlarmSongs('maximilian',[song]);demo.alarmSelections.set('school_alarm',song);demo.addAlarmRow();
   const host=document.querySelector('#alarm-host');host.style.display='grid';host.style.gridTemplateColumns='40px minmax(0,1fr)';host.style.gap='16px';host.style.overflow='hidden';host.prepend(document.createElement('span'));
   const kit=await import('/src/family-ui/1.4.0/family-ui.js');const holder=document.querySelector('#reference');holder.style.cssText='display:block;position:absolute;left:-10000px;top:0;width:300px;visibility:hidden';const ref=holder.attachShadow({mode:'open'});
   ref.innerHTML=`<style>${kit.UI_CSS}</style>${kit.row({title:'Weckmusik',description:'Lied',trailing:kit.button({label:'Auswählen',action:'reference'})})}`;
  });
  const alarm=page.locator('music-manager-alarm-row').first();await alarm.getByRole('button',{name:'Auswählen',exact:true}).waitFor();
  for(const width of [320,375,390,430,768,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:800});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   await page.mouse.move(0,0);
   const report=await alarm.evaluate(el=>{
    const root=el.shadowRoot,ref=document.querySelector('#reference').shadowRoot;
    const props=['fontFamily','fontSize','fontWeight','lineHeight','color','paddingTop','paddingRight','paddingBottom','paddingLeft','borderRadius','minHeight','backgroundColor'];
    const styles=(r,s)=>Object.fromEntries(props.map(p=>[p,getComputedStyle(r.querySelector(s))[p]]));
    const button=root.querySelector('#alarm-row button').getBoundingClientRect(),text=root.querySelector('#alarm-row .row-text').getBoundingClientRect(),host=el.getBoundingClientRect(),row=root.querySelector('#alarm-row .setting-row').getBoundingClientRect();
    return {inline:button.left>=text.right&&button.top>=row.top&&button.bottom<=row.bottom,contained:button.right<=host.right+1&&host.right<=document.querySelector('#alarm-host').getBoundingClientRect().right,button:styles(root,'#alarm-row button'),reference:styles(ref,'button'),row:styles(root,'#alarm-row .setting-row'),referenceRow:styles(ref,'.setting-row')};
   });
   assert(report.inline,`${width}: select button must remain to the right of the text`);assert(report.contained,`${width}: select button must not be clipped`);assert.deepEqual(report.button,report.reference);assert.deepEqual(report.row,report.referenceRow);
   await alarm.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(screens,`alarm-inline-ui-kit-${width}-${dark?'dark':'light'}.png`),fullPage:false});
  }
 });
 await check('alarm picker fits mobile desktop and both themes with long favorite names',async()=>{
  await reset();await page.evaluate(()=>{demo.seedAlarmSongs('maximilian',[{kind:'apple_music',uri:'apple_music--demo://track/wake',media_type:'track',alarm_song:true,title:'Mein Lieblingslied zum sanften Aufwachen am Morgen'}]);demo.addAlarmRow();});
  const alarm=page.locator('music-manager-alarm-row').first(),picker=alarm.locator('#alarm-dialog');
  for(const width of [320,390,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:900});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   await alarm.getByRole('button',{name:'Auswählen',exact:true}).click();await picker.getByText('Maximilian',{exact:true}).waitFor();
   const bounds=await picker.boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width+1);assert(!await picker.evaluate(el=>el.scrollWidth>el.clientWidth));
   assert(await picker.evaluate(el=>{const parent=el.querySelector('#alarm-content').getBoundingClientRect();return [...el.querySelectorAll('.alarm-song-list,.alarm-song-list button')].every(node=>{const box=node.getBoundingClientRect();return box.left>=parent.left-1&&box.right<=parent.right+1;});}),`${width} alarm choices must fit inside the dialog body`);
   await page.screenshot({path:path.join(screens,`alarm-music-${width}-${dark?'dark':'light'}.png`),fullPage:true});await picker.getByRole('button',{name:'Schließen',exact:true}).click();
  }
 });
 await check('integration bundle and compatibility resource coexist without duplicate cards or service calls',async()=>{
  await reset();await page.evaluate(async()=>{
   window.integrationCardClass=customElements.get('music-manager-card');
   demo.seedFavorites('manuel',[demo.station('swr3','SWR3')]);
   await import('/dist/music-manager-card.js?legacy-resource');
  });
  assert(await page.evaluate(()=>customElements.get('music-manager-card')===window.integrationCardClass));
  assert.equal(await page.evaluate(()=>window.customCards.filter(c=>c.type==='music-manager-card').length),1);
  assert.equal(await action('play-favorite').count(),1);
  await action('next').click();assert.equal(await page.evaluate(()=>demo.calls.length),1);
 });
 await check('native HA slider adapter uses the public event contract (test double)',async()=>{
  await reset();await page.evaluate(()=>{
   customElements.define('ha-control-slider',class extends HTMLElement {});
   demo.cards[0].setConfig({entity:'media_player.wohnzimmer'});
  });
  const native=card().locator('ha-control-slider');await native.waitFor({state:'attached'});
  const config=await native.evaluate(el=>({unit:el.unit,tooltip:el.tooltipMode,value:el.value,handle:el.showHandle}));
  assert.deepEqual(config,{unit:'%',tooltip:'interaction',value:28,handle:true});
  await native.evaluate(el=>{el.value=61;el.dispatchEvent(new CustomEvent('slider-moved',{detail:{value:61},bubbles:true}));});
  assert.equal(await page.evaluate(()=>demo.calls.length),0);
  await page.evaluate(()=>demo.update('media_player.wohnzimmer',{attributes:{volume_level:.1}}));assert.equal(await native.evaluate(el=>el.value),61);
  await native.evaluate(el=>el.dispatchEvent(new CustomEvent('value-changed',{detail:{value:61},bubbles:true})));
  await page.waitForFunction(()=>demo.calls.length===1);assert.equal(await page.evaluate(()=>demo.calls[0].data.volume_level),.61);
 });

 const beta=()=>page.locator('music-manager-beta-card').first();
 const setupBeta=async()=>{await reset();await page.evaluate(()=>{
  for(const [id,name,uid] of [['office','Büro Manuel','RINCON_ABC001'],['bedroom','Sonos Schlafzimmer','RINCON_ABC002']]){
   demo.registry.push({entity_id:'media_player.'+id,platform:'sonos',unique_id:uid});
   demo.update('media_player.'+id,{state:'playing',attributes:{friendly_name:name,media_title:'Musik in '+name,volume_level:0.2,supported_features:1|2|4|8|16|32|512|4096|16384|32768}});
  }
  demo.seedFavorites('manuel',[demo.station('manuel','Manuels Radio')]);demo.seedFavorites('vera',[demo.station('vera','Veras Radio')]);demo.addBeta();
 });await beta().locator('#music-beta-box').waitFor();};
 await check('beta remembers Manuel office and Vera bedroom independently while favorites stay personal',async()=>{
  await setupBeta();await beta().getByLabel('Box',{exact:true}).selectOption('media_player.office');
  await page.waitForFunction(()=>demo.cards.at(-1)._config.entity==='media_player.office');
  await beta().getByRole('button',{name:'Weiter',exact:true}).click();assert.equal(await page.evaluate(()=>demo.calls.at(-1).data.entity_id),'media_player.office');
  assert.equal(await beta().locator('[data-action="play-favorite"]').getAttribute('title'),'Manuels Radio');assert.equal(await beta().locator('[data-action="play-favorite"]').innerText(),'');
  await page.evaluate(()=>demo.switchUser('vera'));await page.waitForFunction(()=>demo.cards.at(-1)._navigationReady&&!demo.cards.at(-1)._navigationLoading);
  assert.equal(await beta().getByLabel('Box',{exact:true}).inputValue(),'media_player.wohnzimmer');
  await beta().getByLabel('Box',{exact:true}).selectOption('media_player.bedroom');await page.waitForFunction(()=>demo.cards.at(-1)._config.entity==='media_player.bedroom');
  assert.equal(await beta().locator('[data-action="play-favorite"]').getAttribute('title'),'Veras Radio');
  await page.evaluate(()=>demo.switchUser('manuel'));await page.waitForFunction(()=>demo.cards.at(-1)._config.entity==='media_player.office');
  assert.equal(await beta().getByLabel('Box',{exact:true}).inputValue(),'media_player.office');
  await page.evaluate(()=>{const old=demo.cards.at(-1);old.remove();demo.addBeta();});
  await page.waitForFunction(()=>demo.cards.at(-1)._config.entity==='media_player.office');
  assert.equal(await card().locator('.music-box').innerText(),'Sonos Wohnzimmer');
 });
 await check('beta children have no dropdown and use the configured speaker after an adult session',async()=>{
  await setupBeta();await beta().getByLabel('Box',{exact:true}).selectOption('media_player.office');await page.waitForFunction(()=>demo.cards.at(-1)._config.entity==='media_player.office');
  for(const user of ['maximilian','paul']){
   await page.evaluate(user=>demo.switchUser(user),user);await page.waitForFunction(()=>demo.cards.at(-1)._navigationReady&&!demo.cards.at(-1)._navigationLoading);
   assert.equal(await beta().locator('#music-beta-box').count(),0);assert.equal(await beta().locator('.fui-player-name').innerText(),'Sonos Wohnzimmer');
   await beta().getByRole('button',{name:'Weiter',exact:true}).click();assert.equal(await page.evaluate(()=>demo.calls.at(-1).data.entity_id),'media_player.wohnzimmer');
  }
 });
 await check('beta keeps the current speaker on failed save and never edits Lovelace configuration',async()=>{
  await setupBeta();await page.evaluate(()=>{demo.wsHook=msg=>{if(msg.type==='music_manager/player_navigation'&&msg.action==='select')throw new Error('Speichern fehlgeschlagen');};window.betaConfigEvents=[];document.querySelector('music-manager-beta-card').addEventListener('config-changed',e=>betaConfigEvents.push(e.detail));});
  await beta().getByLabel('Box',{exact:true}).selectOption('media_player.office');await beta().getByRole('alert').waitFor();
  assert.equal(await beta().getByLabel('Box',{exact:true}).inputValue(),'media_player.wohnzimmer');assert.deepEqual(await page.evaluate(()=>betaConfigEvents),[]);
 });
 await check('beta selector keeps native UI Kit styling and the player fits phone desktop light and dark',async()=>{
  await setupBeta();await page.evaluate(async()=>{
   const kit=await import('/src/family-ui/1.4.0/family-ui.js'),holder=document.querySelector('#reference');holder.style.cssText='display:block;position:absolute;left:-10000px;top:0;width:300px;visibility:hidden';holder.attachShadow({mode:'open'}).innerHTML=`<style>${kit.UI_CSS}</style>${kit.selectField({id:'ref-box',label:'Box',options:[{value:'one',label:'Wohnzimmer'}]})}`;
   demo.update('media_player.wohnzimmer',{attributes:{media_title:'Ein sehr langer Titel für einen responsiven Musicplayer',entity_picture:'/missing-cover.png'}});
  });
  await page.waitForFunction(()=>!document.querySelector('music-manager-beta-card').shadowRoot.querySelector('.fui-player-heading img'));
  for(const width of [320,390,430,768,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:900});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);await page.mouse.move(0,0);
   const report=await beta().evaluate(el=>{
    const root=el.shadowRoot,ref=document.querySelector('#reference').shadowRoot;
    const properties=['fontFamily','fontSize','fontWeight','color','backgroundColor','paddingTop','paddingRight','paddingBottom','paddingLeft','borderRadius'];
    const style=el=>Object.fromEntries(properties.map(p=>[p,getComputedStyle(el)[p]]));
    return {over:[...root.querySelectorAll('#player *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.left<0||r.right>innerWidth+1)}).map(e=>e.outerHTML.slice(0,80)),select:style(root.querySelector('select')),reference:style(ref.querySelector('select'))};
   });
   assert.deepEqual(report.over,[],`${width} beta overflow`);assert.deepEqual(report.select,report.reference);await beta().scrollIntoViewIfNeeded();await beta().screenshot({path:path.join(screens,`beta-player-${width}-${dark?'dark':'light'}.png`)});
  }
 });

 await check('beta settings gear replaces footer, dropdown is left compact unlabeled, favorite tiles have icons only',async()=>{
  await setupBeta();
  assert.equal(await beta().locator('#player .music-source-actions').count(),0);assert(!await beta().locator('#player').innerText().then(t=>t.includes('Beta')));
  for(const action of ['open-radio','open-apple','manage-favorites','open-alarm-songs'])assert.equal(await beta().locator(`#player [data-action="${action}"]`).count(),0);
  const geometry=await beta().evaluate(el=>{const root=el.shadowRoot,select=root.querySelector('#music-beta-box'),gear=root.querySelector('[data-action="beta-settings"]'),a=select.getBoundingClientRect(),b=gear.getBoundingClientRect();return {left:a.right<b.left,width:a.width,label:getComputedStyle(select.closest('label').querySelector('span')).position};});assert(geometry.left);assert(geometry.width<=190);assert.equal(geometry.label,'absolute');
  assert.equal(await beta().locator('[data-action="play-favorite"]').innerText(),'');assert.equal(await beta().locator('[data-action="play-favorite"]').getAttribute('aria-label'),'Manuels Radio abspielen');
  await beta().getByRole('button',{name:'Einstellungen',exact:true}).click();const settings=beta().locator('#music-beta-settings');await settings.waitFor();assert(!await settings.innerText().then(t=>t.includes('Weck')));assert.equal(await settings.locator('.setting-row').count(),3);
  await settings.getByRole('button',{name:'Apple Music öffnen',exact:true}).click();await beta().locator('#music-apple-dialog [data-action="apple-play"]').first().waitFor();assert(!await settings.isVisible());assert.equal(await beta().locator('[data-action="apple-songs"],[data-action="apple-alarm-song"]').count(),0);
  await beta().locator('#music-apple-dialog').getByRole('button',{name:'Alben',exact:true}).click();await beta().getByRole('button',{name:'Titel anzeigen',exact:true}).click();await beta().locator('#music-apple-results [data-action="apple-play"]').waitFor();assert.equal(await beta().locator('[data-action="apple-alarm-song"]').count(),0);assert(!await beta().locator('#music-apple-location').innerText().then(t=>t.includes('Weck')));
 });
 await check('beta children combine favorites and wake songs with search remove and independent storage',async()=>{
  await setupBeta();await page.evaluate(()=>{demo.seedFavorites('paul',[demo.station('kid','Pauls Sender')]);demo.seedAlarmSongs('paul',[{kind:'apple_music',uri:'apple_music--demo://track/wake1',media_type:'track',title:'Erstes Wecklied'},{kind:'apple_music',uri:'apple_music--demo://track/wake2',media_type:'track',title:'Zweites Wecklied'}]);demo.switchUser('paul');});await page.waitForFunction(()=>demo.cards.at(-1)._showWakeSongs&&!demo.cards.at(-1)._alarmSongLoading);
  await beta().getByRole('button',{name:'Einstellungen',exact:true}).click();await beta().getByRole('button',{name:'Favoriten und Wecklieder verwalten',exact:true}).click();const manager=beta().locator('#music-radio-dialog');await manager.waitFor();assert.equal(await manager.locator('#music-radio-dialog-title').innerText(),'Favoriten & Wecklieder');assert.equal(await manager.locator('#beta-wake-list .music-station-row').count(),2);
  await manager.getByLabel('Wecklieder durchsuchen', {exact:true}).fill('Zweites');assert.equal(await manager.locator('#beta-wake-list .music-station-row').count(),1);assert(await manager.getByLabel('Wecklieder durchsuchen',{exact:true}).evaluate(e=>e.getRootNode().activeElement===e));await manager.getByLabel('Wecklieder durchsuchen',{exact:true}).fill('');
  await manager.getByRole('button',{name:'Wecklied entfernen: Erstes Wecklied',exact:true}).click();await page.waitForFunction(()=>demo.alarmSongData.get('paul').length===1);assert.equal(await page.evaluate(()=>demo.favoriteData.get('paul')[0].title),'Pauls Sender');
  await manager.getByRole('checkbox',{name:'Favorit behalten: Pauls Sender',exact:true}).click();await page.waitForFunction(()=>demo.favoriteData.get('paul').length===0);assert.equal(await page.evaluate(()=>demo.alarmSongData.get('paul')[0].title),'Zweites Wecklied');
  for(const width of [320,390,1100])for(const dark of [false,true]){await page.setViewportSize({width,height:850});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);assert(!await manager.evaluate(e=>e.scrollWidth>e.clientWidth));await page.screenshot({path:path.join(screens,`beta-combined-${width}-${dark?'dark':'light'}.png`),fullPage:false});}
  await manager.getByRole('button',{name:'Schließen',exact:true}).click();await page.evaluate(()=>demo.switchUser('vera'));await page.waitForFunction(()=>demo.cards.at(-1)._navigationReady&&!demo.cards.at(-1)._navigationLoading);await beta().getByRole('button',{name:'Einstellungen',exact:true}).click();assert(!await beta().locator('#music-beta-settings').innerText().then(t=>t.includes('Weck')));
 });
 await check('beta radio has play pause only and Apple restores track navigation and shuffle',async()=>{
  await setupBeta();await beta().getByRole('button',{name:'Einstellungen',exact:true}).click();await beta().getByRole('button',{name:'Sender wählen',exact:true}).click();const radio=beta().locator('#music-radio-dialog');await radio.getByRole('button',{name:'Beliebt',exact:true}).click();await radio.locator('[data-action="play-station"]').first().click();await page.waitForFunction(()=>demo.cards.at(-1)._playbackSource==='radio');assert.equal(await beta().locator('#player [data-action="previous"],#player [data-action="next"]').count(),0);assert(await beta().getByRole('button',{name:'Pause',exact:true}).isVisible());
  await beta().getByRole('button',{name:'Einstellungen',exact:true}).click();await beta().getByRole('button',{name:'Apple Music öffnen',exact:true}).click();await beta().locator('#music-apple-dialog [data-action="apple-play"]').first().click();await page.waitForFunction(()=>demo.cards.at(-1)._isApplePlayback);assert(await beta().getByRole('button',{name:'Weiter',exact:true}).isVisible());assert(await beta().getByRole('button',{name:'Zurück',exact:true}).isVisible());assert.equal(await beta().locator('#player [data-action="shuffle"]').count(),1);
 });
 await check('beta round hover and zero through fifty use the full slider width and exact shared player styles',async()=>{
  await setupBeta();
  for(const width of [320,390,430,768,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:850});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   for(const button of await beta().locator('.fui-music-transport button').all()){await button.hover();const box=await button.boundingBox();assert.equal(box.width,box.height);assert.equal(await button.evaluate(e=>getComputedStyle(e).borderRadius),'50%');}
   const slider=beta().locator('#music-volume');assert.equal(await slider.getAttribute('max'),'50');await slider.evaluate(e=>{e.value='50';e.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await slider.evaluate(e=>e.style.getPropertyValue('--range-percent')),'100%');await slider.dispatchEvent('change');await page.waitForFunction(()=>demo.calls.at(-1).data.volume_level===.5);assert.equal(await beta().locator('output').innerText(),'50 %');await page.mouse.move(0,0);await beta().screenshot({path:path.join(screens,`beta-fifty-${width}-${dark?'dark':'light'}.png`)});
  }
  assert(await beta().evaluate(async el=>{const kit=await import('/src/family-ui/1.4.0/family-ui.js');return el.shadowRoot.querySelectorAll('style').length===1&&el.shadowRoot.querySelector('style').textContent===kit.UI_CSS+'\n'+kit.MUSIC_PLAYER_CSS;}));
  await page.evaluate(()=>demo.cards.at(-1)._action({action:'volume',phase:'change',value:99}));assert.equal(await page.evaluate(()=>demo.calls.at(-1).data.volume_level),.5);
 });
 await check('beta native slider caps a public committed volume event at fifty',async()=>{
  await reset();await page.evaluate(()=>{customElements.define('ha-control-slider',class extends HTMLElement{});demo.addBeta();});await page.waitForFunction(()=>demo.cards.at(-1)._navigationReady&&!demo.cards.at(-1)._navigationLoading);const slider=beta().locator('ha-control-slider');assert.equal(await slider.evaluate(e=>e.max),50);await slider.evaluate(e=>e.dispatchEvent(new CustomEvent('value-changed',{detail:{value:95},bubbles:true})));await page.waitForFunction(()=>demo.calls.length===1);assert.equal(await page.evaluate(()=>demo.calls[0].data.volume_level),.5);
 });
 const configURL=url.replace('fixture.html','configuration-fixture.html');
 const openConfiguration=async()=>{await page.goto(configURL);await page.waitForFunction(()=>window.configurationDemo?.panel._data);};
 const panel=()=>page.locator('music-manager-panel');
 const editor=()=>panel().locator('#configuration-dialog');
 await check('UI Kit configuration edits and removes selected rows through the native HA options flow',async()=>{
  await openConfiguration();await panel().getByText('Benutzer (2)',{exact:true}).waitFor();
  await panel().locator('[data-action="edit"][data-id="ha-one"]').click();await editor().locator('#config-provider_id').waitFor();
  assert.equal(await editor().locator('#config-ha_user_id').inputValue(),'ha-one');assert.equal(await editor().locator('#config-provider_id').inputValue(),'apple--one');
  await editor().locator('#config-provider_id').selectOption('apple--two');await page.evaluate(()=>{configurationDemo.failSave=true;configurationDemo.push();});
  assert.equal(await editor().locator('#config-provider_id').inputValue(),'apple--two');await editor().getByRole('button',{name:'Speichern',exact:true}).click();await editor().getByRole('alert').waitFor();
  assert.equal(await page.evaluate(()=>configurationDemo.data.accounts[0].provider_id),'apple--one');
  await page.evaluate(()=>configurationDemo.failSave=false);await editor().locator('#config-provider_id').selectOption('apple--one');await editor().getByRole('button',{name:'Speichern',exact:true}).click();await editor().waitFor({state:'hidden'});
  const calls=await page.evaluate(()=>configurationDemo.requests.filter(r=>r.method==='POST'));assert(calls.filter(r=>!r.body.handler).every(r=>/\/flow\/flow-\d+$/.test(r.path)),'flow IDs must never be replaced by row IDs');
  await panel().locator('[data-action="remove"][data-id="ha-two"]').click();await editor().getByRole('button',{name:'Entfernen',exact:true}).waitFor();assert.equal(await page.evaluate(()=>configurationDemo.data.accounts.length),2);
  await editor().getByRole('button',{name:'Abbrechen',exact:true}).click();await editor().waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>configurationDemo.data.accounts.length),2);
  await panel().locator('[data-action="remove"][data-id="ha-two"]').click();await editor().getByRole('button',{name:'Entfernen',exact:true}).click();await editor().waitFor({state:'hidden'});
  assert.deepEqual(await page.evaluate(()=>configurationDemo.data.accounts.map(a=>a.ha_user_id)),['ha-one']);assert.equal(await page.evaluate(()=>configurationDemo.data.alarms.length),1);
  await panel().locator('[data-action="alarm_edit"]').click();await editor().locator('#config-source_entity').waitFor();assert.equal(await editor().locator('#config-alarm_id').inputValue(),'school_alarm');
  await editor().locator('#config-source_entity').selectOption('media_player.office');await editor().getByRole('button',{name:'Speichern',exact:true}).click();await editor().waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>configurationDemo.data.alarms[0].source_entity),'media_player.office');
 });
 await check('configuration adds separate alarms for two people and never replaces an existing alarm',async()=>{
  await openConfiguration();const original=await page.evaluate(()=>JSON.parse(JSON.stringify(configurationDemo.data.alarms[0])));
  await panel().getByRole('button',{name:'Wecker hinzufügen',exact:true}).click();await editor().locator('#config-alarm_id').waitFor();
  assert.equal(await editor().locator('#config-alarm_id').inputValue(),'school_alarm_2');
  await editor().locator('#config-ha_user_id').selectOption('ha-two');await editor().locator('#config-source_entity').selectOption('media_player.office');
  await editor().locator('#config-alarm_id').fill('school_alarm');await editor().getByRole('button',{name:'Speichern',exact:true}).click();
  await editor().getByRole('alert').waitFor();assert.match(await editor().getByRole('alert').innerText(),/bereits vergeben/);
  assert.deepEqual(await page.evaluate(()=>configurationDemo.data.alarms),[original]);
  await editor().locator('#config-alarm_id').fill('school_alarm_2');await editor().getByRole('button',{name:'Speichern',exact:true}).click();await editor().waitFor({state:'hidden'});
  await panel().getByText('Wecker (2)',{exact:true}).waitFor();assert.deepEqual(await page.evaluate(()=>configurationDemo.data.alarms[0]),original);
  assert.equal(await page.evaluate(()=>configurationDemo.data.alarms[1].ha_user_id),'ha-two');
  assert.equal(await page.evaluate(()=>configurationDemo.data.alarms[1].source_entity),'media_player.office');
  for(const width of [375,1100]){
   await page.setViewportSize({width,height:900});assert(!await panel().evaluate(el=>el.scrollWidth>el.clientWidth));
   await page.screenshot({path:path.join(screens,`configuration-two-alarms-${width}.png`),fullPage:true});
  }
  await panel().getByRole('button',{name:'Wecker hinzufügen',exact:true}).click();await editor().locator('#config-alarm_id').waitFor();
  assert.equal(await editor().locator('#config-alarm_id').inputValue(),'school_alarm_3');await editor().getByRole('button',{name:'Abbrechen',exact:true}).click();
  await panel().locator('[data-action="alarm_edit"][data-id="school_alarm_2"]').click();await editor().locator('#config-source_entity').selectOption('media_player.bedroom');await editor().getByRole('button',{name:'Speichern',exact:true}).click();await editor().waitFor({state:'hidden'});
  assert.deepEqual(await page.evaluate(()=>configurationDemo.data.alarms[0]),original);assert.equal(await page.evaluate(()=>configurationDemo.data.alarms[1].source_entity),'media_player.bedroom');
  await panel().locator('[data-action="alarm_remove"][data-id="school_alarm_2"]').click();await editor().getByRole('button',{name:'Entfernen',exact:true}).click();await editor().waitFor({state:'hidden'});
  assert.deepEqual(await page.evaluate(()=>configurationDemo.data.alarms),[original]);
 });
 await check('configuration connection changes require explicit confirmation and late responses do not leak after user switch',async()=>{
  await openConfiguration();await panel().locator('[data-action="connect"]').click();await editor().locator('#config-music_assistant_entry').selectOption('');
  await editor().getByRole('button',{name:'Speichern',exact:true}).click();await editor().getByRole('button',{name:'Verbindung wechseln',exact:true}).waitFor();assert.equal(await page.evaluate(()=>configurationDemo.data.accounts.length),2);
  await editor().getByRole('button',{name:'Verbindung wechseln',exact:true}).click();await editor().waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>configurationDemo.data.accounts.length),0);await panel().locator('#connection-content').getByText('Nur Radio',{exact:true}).waitFor();
  await openConfiguration();await page.evaluate(()=>{configurationDemo.delayCreate=new Promise(resolve=>window.releaseConfigFlow=resolve);});await panel().locator('[data-action="edit"][data-id="ha-one"]').click();await editor().getByText('Einstellung wird geladen …',{exact:true}).waitFor();
  await page.evaluate(()=>{configurationDemo.switchUser(false);window.releaseConfigFlow();});await panel().getByRole('alert').waitFor();
  assert(!(await panel().innerText()).includes('Erster Benutzer'));assert(!await editor().isVisible());
 });
 await check('beta speaker users are visible and editable with the shared multi selection',async()=>{
  await openConfiguration();await panel().getByText('Manuel, Vera',{exact:true}).waitFor();
  await panel().getByRole('button',{name:'Box-Auswahl bearbeiten',exact:true}).click();
  await editor().locator('#config-speaker_selection_users').waitFor();
  await editor().getByLabel('Vera',{exact:true}).uncheck();
  await editor().getByRole('button',{name:'Speichern',exact:true}).click();
  await page.waitForFunction(()=>configurationDemo.data.speaker_users.length===1);
  assert.deepEqual(await page.evaluate(()=>configurationDemo.data.speaker_users),[{id:'manuel',name:'Manuel'}]);
 });
 await check('configuration follows UI Kit typography and fits desktop mobile and both themes',async()=>{
  await openConfiguration();await page.evaluate(async()=>{const kit=await import('/src/family-ui/1.4.0/family-ui.js');const root=document.querySelector('#reference').attachShadow({mode:'open'});root.innerHTML=`<style>${kit.UI_CSS}</style>${kit.row({title:'Referenz',description:'Text'})}`;});
  for(const width of [320,390,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:900});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   const report=await panel().evaluate(el=>{const root=el.shadowRoot,ref=document.querySelector('#reference').shadowRoot;const styles=e=>{const s=getComputedStyle(e);return [s.fontFamily,s.fontSize,s.fontWeight,s.color];};return {over:[...root.querySelectorAll('#configuration *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.left<0||r.right>innerWidth+1)}).map(e=>e.outerHTML.slice(0,100)),actual:styles(root.querySelector('.row-text strong')),reference:styles(ref.querySelector('.row-text strong'))};});
   assert.deepEqual(report.over,[],`${width} configuration overflow`);assert.deepEqual(report.actual,report.reference);
   await page.screenshot({path:path.join(screens,`configuration-${width}-${dark?'dark':'light'}.png`),fullPage:true});
   await panel().locator('[data-action="edit"][data-id="ha-one"]').click();await editor().locator('#config-provider_id').waitFor();assert(!await editor().evaluate(el=>el.scrollWidth>el.clientWidth),`${width} editor overflow`);
   await page.screenshot({path:path.join(screens,`configuration-editor-${width}-${dark?'dark':'light'}.png`),fullPage:true});await editor().getByRole('button',{name:'Schließen',exact:true}).click();
  }
 });
 assert.deepEqual(errors,[]);console.log(`${checks} browser scenarios passed; no JavaScript errors.`);
 await browser.close();server.close();
})().catch(async error=>{console.error(error);if(page)await page.screenshot({path:path.join(screens,'failure.png'),fullPage:true}).catch(()=>{});await browser?.close();server.close();process.exitCode=1});
