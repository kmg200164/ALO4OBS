const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
const folder=path.join(__dirname,'../template');
test('web guide reuses existing guide tokens/components and header-only settings navigation',()=>{
 const html=fs.readFileSync(path.join(folder,'web-guide.html'),'utf8'),js=fs.readFileSync(path.join(folder,'web-guide.js'),'utf8');
 assert.match(html,/guide-base\.css/);assert.match(html,/guide-layout\.css/);assert.doesNotMatch(html,/<style>/);
 assert.doesNotMatch(js,/className='primary-link'/);assert.match(js,/className='step-card'/);assert.match(js,/className='faq-item'/);
 const css=fs.readFileSync(path.join(folder,'guide-base.css'),'utf8');assert.match(css,/@font-face\{font-family:Inter/);assert.match(css,/assets\/InterVariable\.woff2/);
 for(const name of ['guide.html','guide-en.html','guide-ja.html'])assert.match(fs.readFileSync(path.join(folder,name),'utf8'),/guide-base\.css/);
});
const directory=process.env.ALO4OBS_SITE_DIR;
test('guide settings tooltip uses keyboard focus below the header; bundled Inter loads offline',{skip:!directory},async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||path.join(require('node:os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
 const browser=await chromium.launch({headless:true,channel:'chrome'}),evidence=path.join(__dirname,'../dist/site-qa');fs.mkdirSync(evidence,{recursive:true});
 try{
  const report={};
  for(const name of ['settings.html','guide.html','guide-en.html','guide-ja.html']){
   const locale=name==='guide-en.html'?'en-US':name==='guide-ja.html'?'ja-JP':'ko-KR',label=locale==='en-US'?'Open settings':locale==='ja-JP'?'設定を開く':'설정 열기';
   const context=await browser.newContext({locale});await context.setOffline(true);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.join(directory,name)).href);await page.evaluate(()=>document.fonts.ready.then(()=>true));
   const fonts=await page.evaluate(()=>[...document.fonts].map(f=>({family:f.family,status:f.status})));assert.ok(fonts.some(f=>f.family==='Inter'&&f.status==='loaded'),name);
   const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');const {root}=await cdp.send('DOM.getDocument');
   async function actualFonts(selector){const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:root.nodeId,selector});return (await cdp.send('CSS.getPlatformFontsForNode',{nodeId})).fonts;}
   const latin=await actualFonts('.brand-full');assert.ok(latin.some(f=>f.isCustomFont&&/Inter/.test(f.familyName)&&f.glyphCount>0),name+' actual Latin font');
   report[name]={latin};
   if(name!=='settings.html'){
    assert.equal(await page.locator('#web-guide .primary-link').count(),0);assert.equal(await page.locator('#web-guide .step-card').count(),4);
    await page.locator('#github-link').focus();await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.id),'settings-link');
    await page.locator('#icon-tooltip').waitFor({state:'visible'});assert.equal(await page.locator('#icon-tooltip').textContent(),label);
    const link=await page.locator('#settings-link').boundingBox(),tip=await page.locator('#icon-tooltip').boundingBox();assert.ok(tip.y>=link.y+link.height);
    report[name].body=await actualFonts('#web-guide .step-content p');
    if(name==='guide.html'){
     assert.ok(report[name].body.some(f=>!f.isCustomFont&&f.glyphCount>0),'Hangul uses an installed fallback');
     await page.screenshot({path:path.join(evidence,'guide-settings-tooltip.png')});
     await page.keyboard.press('Enter');await page.waitForURL(/settings\.html$/);
    }
   }
   await cdp.detach();assert.deepEqual(errors,[]);await context.close();
  }
  fs.writeFileSync(path.join(evidence,'font-platform-report.json'),JSON.stringify(report,null,2));
 }finally{await browser.close();}
});
