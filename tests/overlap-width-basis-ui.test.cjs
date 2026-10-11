const test=require('node:test'),assert=require('node:assert/strict');
test('width bases suppress adjacent columns, restore saved choices, and survive reload/export',{skip:!process.env.KMG_THEME_RENDER_URL},async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({locale:'ko-KR',viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await require('./helpers/expanded-sections.cjs')(page);await page.goto(new URL('settings.html',process.env.KMG_THEME_RENDER_URL).href);await page.waitForFunction(()=>!document.querySelector('[data-layout-choice=overlap]').disabled);await page.locator('[data-layout-choice=overlap]').click();
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('obs-overlay-config')));
  const basis=async(c,n)=>{await page.locator(`[name=overlapColumn${c}Wide]`).setChecked(n===3);await page.waitForFunction(([c,n])=>JSON.parse(localStorage.getItem('obs-overlay-config')).overlapColumns[c].widthBasis===n,[c,n]);};
  assert.equal(await page.locator('[name=overlapColumn2Wide],[name=overlapColumn4Wide],[data-column-width-number]').count(),0);
  const original=await saved();await page.locator('[data-hit=panel2_2] .panel-number').click();await basis(1,3);
  assert.equal(await page.locator('#selected-panel-tag').isVisible(),false);assert.equal(await page.locator('[data-hit=panel2_2]').count(),0);assert.equal(await page.locator('[name=overlapColumn2Enabled]').isChecked(),false);assert.equal(await page.locator('[name=overlapColumn2Enabled]').isDisabled(),true);assert.equal((await saved()).overlapColumns[2].enabled,true);
  await basis(3,3);await basis(5,3);let config=await saved();assert.equal(config.layout.panel1_1.width,608);assert.equal(config.layout.panel3_1.x,656);assert.equal(config.layout.panel5_1.x,1288);assert.equal(await page.locator('[data-hit]').count(),10);
  const output=await page.evaluate(()=>JSON.parse(new TextDecoder().decode(OverlayPack.settingsEntries(JSON.parse(localStorage.getItem('obs-overlay-config')))[0].bytes)));assert.deepEqual(output.layout,config.layout);assert.equal(output.panelRenderEnabled.panel2_2,false);assert.equal(output.panelRenderEnabled.panel4_2,false);assert.equal(output.panelEnabled.panel2_2,true);
  const strokes=page.frameLocator('#preview').locator('#preview-strokes .preview-stroke-tile');await page.waitForTimeout(100);assert.equal(await strokes.count(),9);
  await basis(1,5);assert.equal(await page.locator('[name=overlapColumn2Enabled]').isDisabled(),true);
  await basis(3,5);assert.equal(await page.locator('[name=overlapColumn2Enabled]').isChecked(),true);assert.equal(await page.locator('[name=overlapColumn4Enabled]').isDisabled(),true);
  await basis(5,5);assert.equal(await page.locator('[data-hit]').count(),16);assert.deepEqual((await saved()).overlapPositions,original.overlapPositions);
  await page.locator('[name=overlapColumn2Enabled]').uncheck();await basis(1,3);await basis(1,5);assert.equal(await page.locator('[name=overlapColumn2Enabled]').isChecked(),false);assert.equal(await page.locator('[name=overlapColumn2Enabled]').isDisabled(),false);
  await basis(3,3);await page.locator('#change-layout').click();await page.locator('[data-layout-choice=bento]').click();await page.locator('#change-layout').click();await page.locator('[data-layout-choice=overlap]').click();assert.equal(await page.locator('[name=overlapColumn3Wide]').isChecked(),true);
  await page.reload();await page.waitForFunction(()=>!document.querySelector('[data-layout-choice=overlap]').disabled);await page.locator('[data-layout-choice=overlap]').click();assert.equal(await page.locator('[name=overlapColumn3Wide]').isChecked(),true);assert.equal(await page.locator('[name=overlapColumn4Enabled]').isDisabled(),true);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
