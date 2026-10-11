const test=require('node:test'),assert=require('node:assert/strict');
const events=require('../template/events.js');
test('sections start collapsed and column 5 alone keeps its place with no hidden-column strokes',{skip:!process.env.KMG_THEME_RENDER_URL},async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({locale:'ko-KR',viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(new URL('settings.html',process.env.KMG_THEME_RENDER_URL).href);await page.waitForFunction(()=>!document.querySelector('[data-layout-choice=overlap]').disabled);await page.locator('[data-layout-choice=overlap]').click();await page.waitForFunction(()=>document.querySelector('[data-layout-label]').textContent.includes('Overlap'));
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('obs-overlay-config')));
  assert.equal(await page.locator('details.property-section[open]').count(),0);
  assert.equal(await page.locator('#change-layout [data-layout-label]').textContent(),'레이아웃 전환 · 현재 Overlap');
  assert.equal(await page.locator('.placement-list > .divider').count(),5);
  assert.deepEqual(await page.locator('.global-stack > details > summary').allTextContents(),['배경','패널 간격','패널 모서리','패널 채우기','패널 테두리','패널 그림자']);
  const original=await saved();
  for(let c=1;c<=4;c++){await page.locator('.placement-list > details').nth(c-1).locator('summary').click();await page.locator(`[name=overlapColumn${c}Enabled]`).uncheck();}
  await page.locator('.placement-list > details').nth(4).locator('summary').click();
  await page.locator('[name=overlapColumn5Count]').evaluate(el=>el.value='2');await page.locator('[name=overlapColumn5Count]').dispatchEvent('input');
  async function check(){
   const config=await saved();assert.deepEqual(config.layout.panel5_1,original.layout.panel5_1);assert.deepEqual(config.layout.panel5_2,original.layout.panel5_2);
   assert.equal(await page.locator('[data-hit]').count(),3);
   const frame=page.frameLocator('#preview');await frame.locator('#preview-strokes .preview-stroke-tile').first().waitFor();
   const boxes=await frame.locator('#preview-strokes .preview-stroke-tile').evaluateAll(nodes=>nodes.map(node=>({x:parseFloat(node.style.left),y:parseFloat(node.style.top)})));
   assert.equal(boxes.length,2);for(const box of boxes)assert.equal(box.x,original.layout.panel5_1.x);
   const exported=await page.evaluate(()=>JSON.parse(new TextDecoder().decode(OverlayPack.settingsEntries(JSON.parse(localStorage.getItem('obs-overlay-config')))[0].bytes)));
   assert.deepEqual(exported.layout.panel5_1,config.layout.panel5_1);assert.equal(Object.values(exported.panelRenderEnabled).filter(Boolean).length,3);
  }
  await check();await page.reload();await page.waitForFunction(()=>!document.querySelector('[data-layout-choice=overlap]').disabled);await page.locator('[data-layout-choice=overlap]').click();await page.waitForFunction(()=>document.querySelector('[data-layout-label]').textContent.includes('Overlap'));assert.equal(await page.locator('details.property-section[open]').count(),0);await check();
  await page.locator('[data-hit=panel5_1] .panel-number').click();assert.equal(await page.locator('#panel-editor details[open]').count(),0);
  for(const [language,label] of [['en','Switch layout · Current Overlap'],['ja','レイアウト切り替え · 現在 Overlap'],['ko','레이아웃 전환 · 현재 Overlap']]){await page.locator('#ui-language').selectOption(language);await page.waitForFunction(label=>document.querySelector('[data-layout-label]').textContent===label,label);}
  await page.locator('#change-layout').click();await page.locator('[data-layout-choice=bento]').click();assert.equal(await page.locator('details.property-section[open]').count(),0);
  await page.locator('[data-hit=custom1] .panel-number').click();assert.equal(await page.locator('#panel-editor details[open]').count(),0);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
