const test=require('node:test'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const enabled=!!process.env.KMG_SETTINGS_HTML;
test('first-use branches, unfinished guide, settings return, keyboard focus and blocked file storage',{skip:!enabled},async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||require('node:path').join(require('node:os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
 const browser=await chromium.launch({headless:true,channel:'chrome'}),url=pathToFileURL(process.env.KMG_SETTINGS_HTML).href;
 try{
  for(const blocked of [false,true]){
   const context=await browser.newContext();if(blocked)await context.addInitScript(()=>{for(const key of ['localStorage','sessionStorage'])Object.defineProperty(window,key,{get(){throw new DOMException('Blocked','SecurityError');}});});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);await page.locator('#first-use[open]').waitFor();
   for(const width of [320,1886]){
    await page.setViewportSize({width,height:1200});
    for(const title of ['처음 사용하시나요?','Is this your first time?']){
     await page.locator('#first-use-title').evaluate((n,text)=>{n.textContent=text;},title);
     const layout=await page.locator('#first-use').evaluate(n=>{const b=n.getBoundingClientRect(),h=n.querySelector('h2').getBoundingClientRect(),a=n.querySelector('.first-use-actions').getBoundingClientRect();return {height:b.height,left:b.left,right:b.right,gap:a.top-h.bottom,overflow:n.scrollWidth>n.clientWidth,buttons:[...n.querySelectorAll('button')].map(b=>b.getBoundingClientRect().height)};});
     assert.ok(layout.height<240,'question dialog must hug content');assert.ok(layout.left>=0&&layout.right<=width);assert.equal(layout.gap,24);assert.equal(layout.overflow,false);assert.ok(layout.buttons.every(h=>h>=44));
    }
   }
   assert.equal(await page.evaluate(()=>document.activeElement.id),'first-use-yes');
   await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'first-use-no');await page.keyboard.press('Enter');
   await page.locator('.editor-workspace').waitFor({state:'visible'});assert.equal(await page.locator('#first-use').evaluate(n=>n.open),false);
   await page.reload();if(blocked){await page.locator('#first-use[open]').waitFor();await page.locator('#first-use-yes').click();await page.locator('#first-guide-note').waitFor();await page.locator('#settings-link').click();await page.locator('.editor-workspace').waitFor({state:'visible'});assert.equal(await page.locator('#first-use').evaluate(n=>n.open),false);}else{await page.locator('.editor-workspace').waitFor({state:'visible'});assert.equal(await page.locator('#first-use').evaluate(n=>n.open),false);}
   assert.deepEqual(errors,[]);await context.close();
  }
  const context=await browser.newContext(),page=await context.newPage();await page.goto(url);await page.locator('#first-use[open]').waitFor();await page.locator('#first-use-yes').click();
  await page.locator('#first-guide-note').waitFor();assert.match(page.url(),/guide(?:-en|-ja)?\.html#first-use$/);const guideURL=page.url();
  const note=await page.locator('#first-guide-note').boundingBox(),header=await page.locator('.app-header').boundingBox();assert.ok(note.y>=header.y+header.height-1);
  await page.goto(url);await page.locator('#first-guide-note').waitFor();assert.equal(page.url(),guideURL);
  await page.locator('#settings-link').click();await page.locator('.editor-workspace').waitFor({state:'visible'});assert.equal(await page.locator('#first-use').evaluate(n=>n.open),false);
  await page.reload();await page.locator('.editor-workspace').waitFor({state:'visible'});assert.equal(await page.locator('#first-use').evaluate(n=>n.open),false);
  await page.locator('#guide-link').click();await page.waitForURL(/guide(?:-en|-ja)?\.html$/);assert.equal(await page.locator('#first-guide-note').count(),0);await context.close();
 }finally{await browser.close();}
});
