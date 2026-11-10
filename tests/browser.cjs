const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
let chromium;try{({chromium}=require('playwright'));}catch(error){if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw error;({chromium}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright')));}
const root=path.resolve(__dirname,'..'),screens=path.join(root,'test-results');fs.mkdirSync(screens,{recursive:true});
const server=http.createServer((req,res)=>{
 const target=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
 if(!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.html')?'text/html':'text/plain');res.end(fs.readFileSync(target));}catch{res.writeHead(404);res.end();}
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
 const dialog=()=>card().locator('dialog');
 await check('Play/Pause, previous and next use the configured player',async()=>{
  await action('play-pause').click();await page.waitForFunction(()=>demo.calls.length===1);
  assert.equal(await page.evaluate(()=>demo.calls[0].service),'media_pause');
  await action('play-pause').click();await action('previous').click();await action('next').click();
  const calls=await page.evaluate(()=>demo.calls);
  assert.deepEqual(calls.map(c=>c.service),['media_pause','media_play','media_previous_track','media_next_track']);
  assert(calls.every(c=>c.domain==='media_player'&&c.data.entity_id==='media_player.wohnzimmer'));
 });
 await check('volume changes on commit only, as fractional 0..1; mute is targeted',async()=>{
  await card().locator('#music-volume').evaluate(input=>{input.value='47';input.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>demo.calls.length),4);
  await card().locator('#music-volume').evaluate(input=>input.dispatchEvent(new Event('change',{bubbles:true})));
  await page.waitForFunction(()=>demo.calls.length===5);
  assert.equal(await page.evaluate(()=>demo.calls[4].data.volume_level),0.47);
  await action('mute').click();assert.equal(await page.evaluate(()=>demo.calls.at(-1).data.is_volume_muted),true);
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
  await page.keyboard.press('Escape');
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
  assert(await action('play-pause').isDisabled());assert(await action('open-radio').isDisabled());assert(await card().locator('#music-volume').isDisabled());
  await page.evaluate(()=>demo.update('media_player.wohnzimmer',{state:'playing',attributes:{supported_features:4096}}));
  assert(await action('next').isDisabled());assert(await action('previous').isDisabled());assert.equal(await action('play-pause').innerText(),'Stop');
  await action('play-pause').click();assert.equal(await page.evaluate(()=>demo.calls.at(-1).service),'media_stop');
 });
 await check('per-card switches hide controls and registry editor only lists Sonos',async()=>{
  await reset();await page.evaluate(()=>{
   const card=demo.cards[1];card.setConfig({entity:'media_player.maximilian_sonos',controls:{next:false,previous:false,mute:false}});
   const editor=document.createElement('music-manager-card-editor');editor.setConfig({type:'custom:music-manager-card',entity:'media_player.wohnzimmer'});editor.hass=demo.makeHass();window.editorEvents=[];editor.addEventListener('config-changed',e=>{editorEvents.push(e.detail.config);editor.setConfig(e.detail.config);});document.querySelector('#editor-host').append(editor);
  });
  assert.equal(await page.locator('music-manager-card').nth(1).locator('[data-action="next"]').count(),0);
  const editor=page.locator('music-manager-card-editor');await editor.locator('[data-ui-option]').first().waitFor({state:'attached'});
  const options=await editor.locator('[data-ui-option]').evaluateAll(nodes=>nodes.map(e=>e.dataset.value));
  assert.deepEqual(options.sort(),['media_player.maximilian_sonos','media_player.wohnzimmer']);
  await editor.locator('#music-entity').fill('Maximilian');await editor.locator('[data-ui-option]').filter({hasText:'Sonos Maximilian'}).click();
  assert.equal(await page.evaluate(()=>editorEvents.at(-1).entity),'media_player.maximilian_sonos');
  await editor.locator('#music-name').fill('Musik im Zimmer');await editor.locator('#music-name').press('End');await editor.locator('#music-name').pressSequentially('!');
  assert.equal(await page.evaluate(()=>editorEvents.at(-1).name),'Musik im Zimmer!');
  await editor.getByRole('switch',{name:'Nächster Titel',exact:true}).click();assert.equal(await page.evaluate(()=>editorEvents.at(-1).controls.next),false);
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
 await check('desktop/mobile light/dark layouts and exact UI Kit typography',async()=>{
  await reset();
  // A separate untouched UI Kit reference ensures local styles do not alter shared components.
  await page.evaluate(async()=>{
   const kit=await import('/src/family-ui/1.2.2/family-ui.js');const ref=document.querySelector('#reference').attachShadow({mode:'open'});
   ref.innerHTML=`<style>${kit.UI_CSS}</style>${kit.row({title:'Referenz',description:'Beschreibung',trailing:kit.button({label:'Abspielen',action:'ref'})})}`;
  });
  for(const width of [375,390,430,1100])for(const dark of [false,true]){
   await page.setViewportSize({width,height:900});await page.evaluate(d=>document.body.classList.toggle('dark',d),dark);
   const report=await page.evaluate(()=>{
    const c=demo.cards[0].shadowRoot,ref=document.querySelector('#reference').shadowRoot;
    const props=['fontFamily','fontSize','fontWeight','lineHeight','color','paddingTop','paddingRight','paddingBottom','paddingLeft'];
    const styles=(root,selector)=>Object.fromEntries(props.map(p=>[p,getComputedStyle(root.querySelector(selector))[p]]));
    const overflow=[...c.querySelectorAll('#player *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<0||r.right>innerWidth+1)}).map(e=>e.outerHTML.slice(0,100));
    return {pageOverflow:document.documentElement.scrollWidth>innerWidth,overflow,card:styles(c,'.row-text strong'),ref:styles(ref,'.row-text strong')};
   });
   assert(!report.pageOverflow,`${width} page overflow`);assert.deepEqual(report.overflow,[]);assert.deepEqual(report.card,report.ref);
   await page.screenshot({path:path.join(screens,`card-${width}-${dark?'dark':'light'}.png`),fullPage:true});
   await action('open-radio').click();await dialog().locator('[data-action="popular"]').click();await dialog().locator('[data-action="play-station"]').first().waitFor();
   const bounds=await dialog().boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width+1);
   const dialogOverflow=await dialog().evaluate(e=>e.scrollWidth>e.clientWidth);assert(!dialogOverflow,`${width} dialog overflow`);
   await page.screenshot({path:path.join(screens,`radio-${width}-${dark?'dark':'light'}.png`),fullPage:true});await page.keyboard.press('Escape');
  }
 });
 assert.deepEqual(errors,[]);console.log(`${checks} browser scenarios passed; no JavaScript errors.`);
 await browser.close();server.close();
})().catch(async error=>{console.error(error);if(page)await page.screenshot({path:path.join(screens,'failure.png'),fullPage:true}).catch(()=>{});await browser?.close();server.close();process.exitCode=1});
