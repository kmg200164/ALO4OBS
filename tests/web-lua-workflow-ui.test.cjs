const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const siteDirectory=process.env.ALO4OBS_SITE_DIR,base=process.env.ALO4OBS_SITE_URL||(siteDirectory?'https://alo4obs.test/':null);
async function serveSite(context){
 if(!siteDirectory)return;
 const root=path.resolve(siteDirectory),types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2','.json':'application/json'};
 await context.route(new URL('**',base).href,async route=>{
  const target=path.resolve(root,'.'+decodeURIComponent(new URL(route.request().url()).pathname));
  if(!target.startsWith(root+path.sep)){await route.abort();return;}
  try{await route.fulfill({status:200,contentType:types[path.extname(target)]||'text/plain',body:fs.readFileSync(target)});}
  catch{await route.fulfill({status:404,body:'Missing static file'});}
 });
}
test('editor exposes Lua download and import while retaining advanced ZIP export',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../template/settings.html'),'utf8');
 assert.match(html,/id="import-lua"/);
 assert.match(html,/id="bundle-legacy"/);
 assert.match(html,/lua-preset\.js/);
});
const playwright=()=>require(process.env.KMG_PLAYWRIGHT_PATH||path.join(require('node:os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
async function settings(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('obs-overlay-config')));}
async function settle(page){await page.waitForFunction(()=>document.querySelector('[data-layout-choice=bento]')?.disabled===false);}
test('hosted Lua round trip, durable Undo, defaults, autosave and atomic rejected import',{skip:!base},async()=>{
 const browser=await playwright().chromium.launch({headless:true,channel:'chrome'});
 try{
  const context=await browser.newContext({locale:'ko-KR',acceptDownloads:true});await serveSite(context);const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.goto(new URL('settings.html',base).href);await settle(page);
  assert.equal(await page.locator('#first-use').evaluate(n=>n.open),false);
  await page.locator('[data-layout-choice=bento]').click();await page.locator('.editor-workspace').waitFor({state:'visible'});
  await page.locator('[name=panelGap]').evaluate(n=>{for(let p=n.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  await page.locator('[name=panelGap]').focus();await page.locator('[name=panelGap]').press('End');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.panelGap===48);
  const before=await settings(page),downloadPromise=page.waitForEvent('download');await page.locator('#bundle').click();
  const download=await downloadPromise;assert.equal(download.suggestedFilename(),'script-bento.lua');
  const lua=fs.readFileSync(await download.path());assert.equal(lua.subarray(0,2).toString(),'--');
  await page.locator('#reset').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.panelGap===32);
  await page.locator('#lua-file').setInputFiles({name:'mine.lua',mimeType:'text/plain',buffer:lua});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.panelGap===48);
  assert.equal((await settings(page)).layoutMode,'bento');
  await page.reload();await settle(page);await page.locator('.editor-workspace').waitFor({state:'visible'});
  assert.equal((await settings(page)).panelGap,48);assert.equal(await page.locator('#undo-preset').isDisabled(),false);
  await page.locator('#undo-preset').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.panelGap===32);
  assert.equal(await page.locator('#status').getAttribute('role'),'status');
  const stable=await settings(page);
  await page.locator('#lua-file').setInputFiles({name:'bad.lua',mimeType:'text/plain',buffer:Buffer.from('-- bad Lua\nos.execute("never")')});
  await page.locator('#status[role=alert]').waitFor();assert.deepEqual(await settings(page),stable);
  await page.locator('#lua-file').setInputFiles({name:'data-only.lua',mimeType:'text/plain',buffer:Buffer.concat([lua,Buffer.from('\nwindow.__luaExecuted=true;')])});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.panelGap===48);
  assert.equal(await page.evaluate(()=>window.__luaExecuted),undefined);
  await page.locator('.builtin-presets > summary').click();await page.locator('[data-built-in=overlap-camera]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.layoutMode==='overlap');
  assert.equal((await settings(page)).panelGap,24);
  assert.equal((await settings(page)).globalStyle.fill.blur,0);
  await page.reload();await settle(page);assert.equal((await settings(page)).globalStyle.fill.blur,0);
  assert.deepEqual(errors,[]);assert.equal(before.panelGap,48);await context.close();
 }finally{await browser.close();}
});
test('storage quota failure prevents preset application and preserves current draft',{skip:!base},async()=>{
 const browser=await playwright().chromium.launch({headless:true,channel:'chrome'});
 try{
  const context=await browser.newContext({locale:'ko-KR'});await serveSite(context);const page=await context.newPage();await page.goto(new URL('settings.html',base).href);await settle(page);
  await page.locator('[data-layout-choice=bento]').click();await page.waitForFunction(()=>localStorage.getItem('obs-overlay-config'));
  const before=await settings(page);
  await page.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='obs-overlay-config')throw new DOMException('Quota exceeded','QuotaExceededError');return set.call(this,key,value);};});
  await page.locator('.builtin-presets > summary').click();await page.locator('[data-built-in=overlap-camera]').click();await page.locator('#status[role=alert]').waitFor();
  assert.deepEqual(await settings(page),before);
  assert.equal(await page.locator('#preview-fullscreen').getAttribute('data-layout'),'bento');
 }finally{await browser.close();}
});

test('local media still downloads one Lua and imports layout without media bytes',{skip:!base},async()=>{
 const browser=await playwright().chromium.launch({headless:true,channel:'chrome'});
 try{
  const context=await browser.newContext({locale:'ko-KR',acceptDownloads:true});await serveSite(context);const page=await context.newPage();
  await page.goto(new URL('settings.html',base).href);await settle(page);await page.locator('[data-layout-choice=bento]').click();
  await page.locator('[data-hit=custom1]').click();
  await page.locator('[name=panelContentType]').evaluate(n=>{for(let p=n.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  await page.locator('[name=panelContentType]').selectOption('media');
  const png=Buffer.from(await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;canvas.getContext('2d').fillRect(0,0,1,1);return canvas.toDataURL('image/png').split(',')[1];}),'base64');
  await page.locator('input[data-upload=panel]').setInputFiles({name:'camera.png',mimeType:'image/png',buffer:png});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.panelContent?.custom1?.url==='assets/custom1.png');
  // Generated fixture: ffmpeg -f lavfi -i color=c=red:s=32x32:d=0.3 -c:v libvpx-vp9 -an tests/fixtures/panel-media.webm
  const video=fs.readFileSync(path.join(__dirname,'fixtures/panel-media.webm'));assert.ok(video.length>0);
  await page.locator('[data-hit=custom2]').click();
  await page.locator('[name=panelContentType]').evaluate(n=>{for(let p=n.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;});
  await page.locator('[name=panelContentType]').selectOption('media');await page.locator('input[data-upload=panel]').setInputFiles({name:'loop.webm',mimeType:'video/webm',buffer:video});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.panelContent?.custom2?.url==='assets/custom2.webm');
  await page.waitForFunction(()=>{const doc=document.querySelector('#preview').contentDocument;return doc?.querySelector('[data-region=custom1] .generic-media img')?.naturalWidth===1&&doc?.querySelector('[data-region=custom2] .generic-media video')?.readyState>=1;});
  assert.equal(await page.locator('.legacy-export').isVisible(),false);
  await page.evaluate(()=>{const digest=crypto.subtle.digest.bind(crypto.subtle);let once=true;crypto.subtle.digest=async(...args)=>{if(once){once=false;await new Promise(resolve=>window.__releaseDigest=resolve);}return digest(...args);};});
  const pending=page.waitForEvent('download');await page.locator('#bundle').click();await page.waitForFunction(()=>typeof window.__releaseDigest==='function');
  assert.equal(await page.locator('.editor-workspace').evaluate(n=>n.inert),true);assert.equal(await page.locator('#reset').isDisabled(),true);assert.equal(await page.locator('#change-layout').isDisabled(),true);
  await page.evaluate(()=>window.__releaseDigest());const download=await pending;assert.equal(download.suggestedFilename(),'script-bento.lua');
  const lua=fs.readFileSync(await download.path());assert.doesNotMatch(lua.toString(),/name='assets\/(?:custom1\.png|custom2\.webm)',data=/);assert.match(lua.toString(),/alo4obs_prepare_media/);
  await page.reload();await settle(page);
  await page.waitForFunction(()=>{const doc=document.querySelector('#preview').contentDocument;return doc?.querySelector('[data-region=custom1] .generic-media img')?.naturalWidth===1&&doc?.querySelector('[data-region=custom2] .generic-media video')?.readyState>=1;});
  const other=await browser.newContext({locale:'ko-KR',acceptDownloads:true});await serveSite(other);const imported=await other.newPage();await imported.goto(new URL('settings.html',base).href);await settle(imported);
  await imported.locator('#lua-file').setInputFiles({name:'personal.lua',mimeType:'text/plain',buffer:lua});
  await imported.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.panelContent?.custom1?.url==='assets/custom1.png');
  assert.equal((await settings(imported)).panelContent.custom2.url,'assets/custom2.webm');
  await imported.waitForFunction(()=>document.querySelector('#status').textContent.includes('원본 파일'));
  assert.equal(await imported.locator('#status').evaluate(n=>n.classList.contains('sr-only')),false);
  const again=imported.waitForEvent('download');await imported.locator('#bundle').click();assert.equal((await again).suggestedFilename(),'script-bento.lua');
 }finally{await browser.close();}
});

test('new web controls and guides fit desktop/mobile in all three languages',{skip:!base},async()=>{
 const browser=await playwright().chromium.launch({headless:true,channel:'chrome'});
 const evidence=path.join(__dirname,'../dist/site-qa');fs.mkdirSync(evidence,{recursive:true});
 try{
  for(const locale of ['ko-KR','en-US','ja-JP']){
   const context=await browser.newContext({locale});await serveSite(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});await page.goto(new URL('settings.html',base).href);await settle(page);
    if(await page.locator('#layout-chooser').isVisible())await page.locator('[data-layout-choice=bento]').click();
    const bounds=await page.locator('.preset-toolbar').evaluate(n=>({left:n.getBoundingClientRect().left,right:n.getBoundingClientRect().right,overflow:n.scrollWidth>n.clientWidth}));
    assert.ok(bounds.left>=0&&bounds.right<=width);assert.equal(bounds.overflow,false);
    assert.equal(await page.locator('.legacy-export').isVisible(),false);
    await page.screenshot({path:path.join(evidence,`${locale}-${width}-settings.png`)});
    const language=locale.slice(0,2),guide=language==='en'?'guide-en.html':language==='ja'?'guide-ja.html':'guide.html';
    await page.goto(new URL(guide,base).href);assert.equal(await page.locator('#web-guide section').count(),5);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:path.join(evidence,`${locale}-${width}-guide.png`)});
   }
   assert.deepEqual(errors,[]);await context.close();
  }
 }finally{await browser.close();}
});
