const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const events=require('../template/events.js');
test('fresh and reset Overlap retain five fixed columns and fifteen pinned panels across edits, reload and export',{skip:!process.env.KMG_THEME_RENDER_URL},async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'ko-KR'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await require('./helpers/expanded-sections.cjs')(page);await page.goto(new URL('settings.html',process.env.KMG_THEME_RENDER_URL).href);await page.locator('[data-layout-choice=overlap]').click();
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('obs-overlay-config')));
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.layoutMode==='overlap');
  async function checkDefault(){
   assert.equal(await page.locator('[data-hit]').count(),16);const config=await saved();
   for(let c=1;c<=5;c++){assert.equal(await page.locator(`[name=overlapColumn${c}Count]`).inputValue(),'3');assert.equal(await page.locator(`[name=overlapColumn${c}Enabled]`).isChecked(),true);assert.equal(config.overlapColumns[c].widthBasis,5);if(c%2)assert.equal(await page.locator(`[name=overlapColumn${c}Wide]`).isChecked(),false);}
   for(const key of events.overlapPanelKeys.slice(1)){assert.equal(config.panelEnabled[key],true);assert.equal(config.overlapSizing[key].heightMode,'fixed');assert.equal(config.overlapPositions[key].mode,'fixed');assert.equal(config.layout[key].height,328);}
   assert.deepEqual(events.overlapCollisions(config.layout,config.panelEnabled),[]);return config;
  }
  const original=await checkDefault();await page.locator('[data-hit=panel1_1] .panel-number').click();
  assert.equal(await page.locator('[name=panelHeightMode]').isChecked(),true);assert.equal(await page.locator('[name=panelPositionMode]').isChecked(),true);
  await page.locator('[name=panelHeight]').fill('200');await page.locator('[name=panelHeight]').dispatchEvent('change');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config')).overlapSizing.panel1_1.height===200);
  assert.deepEqual((await saved()).layout.panel1_2,original.layout.panel1_2);
  await page.locator('[name=overlapColumn2Enabled]').uncheck();assert.equal((await saved()).layout.panel3_1.width,original.layout.panel3_1.width);
  await page.reload();await page.locator('[data-layout-choice=overlap]').click();assert.equal((await saved()).overlapColumns[2].enabled,false);
  await page.locator('#reset').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config')).overlapColumns[2].enabled);await checkDefault();
  const output=await page.evaluate(()=>JSON.parse(new TextDecoder().decode(OverlayPack.settingsEntries(JSON.parse(localStorage.getItem('obs-overlay-config')))[0].bytes)));assert.deepEqual(output.layout,original.layout);assert.deepEqual(output.overlapPositions,original.overlapPositions);
  await page.locator('#change-layout').click();await page.locator('[data-layout-choice=bento]').click();assert.equal(await page.locator('[data-hit]').count(),7);
  await page.locator('#change-layout').click();await page.locator('[data-layout-choice=overlap]').click();await checkDefault();assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(__dirname,'../.qa-private/0.10.0/overlap-default-grid.png')});
 }finally{await browser.close();}
});
