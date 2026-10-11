const test=require('node:test'),assert=require('node:assert/strict');
const enabled=process.env.KMG_RUN_OVERLAP_COLUMN_UI==='1';
const playwright=()=>require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const url=()=>new URL('settings.html',process.env.KMG_THEME_RENDER_URL||'http://127.0.0.1:8783/review/files/').href;
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('obs-overlay-config')));
async function choose(page,mode){await page.locator('[data-layout-choice='+mode+']').click();}
async function number(page,name,value){await page.locator('[name='+name+']').fill(String(value));await page.locator('[name='+name+']').dispatchEvent('change');const valueNow=Number(await page.locator('[name='+name+']').inputValue());await page.waitForFunction(({name,valueNow})=>{const c=JSON.parse(localStorage.getItem('obs-overlay-config')),key=document.querySelector('#selected-panel-tag')?.textContent?.replace('Panel ','panel').replace('-','_');return name==='panelY'?Math.round(c.layout[key].y)===valueNow:c.overlapSizing[key].height===valueNow;},{name,valueNow});}
async function range(page,name,value){await page.locator('[name='+name+']').evaluate((el,value)=>el.value=String(value),value);await page.locator('[name='+name+']').dispatchEvent('input');if(name==='overlapColumnAlignment')await page.waitForFunction(value=>JSON.parse(localStorage.getItem('obs-overlay-config')).overlapColumnAlignment['2']===['top','center','bottom'][value],value);}
test('Main has an external keyboard and pointer selector; size modes are switches in both presets',{skip:!enabled},async()=>{
 const browser=await playwright().chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'en-US'});page.setDefaultTimeout(4000);
  await require('./helpers/expanded-sections.cjs')(page);await page.goto(url());await choose(page,'overlap');
  const main=page.locator('#select-main');assert.equal(await main.isVisible(),true,'Main selector is visible outside the canvas');
  assert.equal(await main.evaluate(el=>!!el.closest('#preview-fullscreen')),false);await main.click();assert.equal(await page.locator('#selected-panel-tag').textContent(),'Main');
  await main.focus();await page.keyboard.press('Space');assert.equal(await main.getAttribute('aria-pressed'),'false');
  await page.locator('[data-hit=panel2_1] .panel-number').click();const height=page.locator('[name=panelHeightMode]');
  assert.notEqual(await height.evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)','switch track stays filled beside hidden numeric inputs');assert.equal(await height.getAttribute('role'),'switch');assert.equal(await height.isChecked(),true);await height.uncheck();assert.equal(await height.isChecked(),false);await height.check();assert.equal(await page.locator('[data-fixed-size=height]').isVisible(),true);
  await number(page,'panelHeight',200);await height.uncheck();assert.equal(await page.locator('[data-fixed-size=height]').isVisible(),false);await height.check();
  await page.locator('#change-layout').click();await choose(page,'bento');await page.locator('[data-hit=custom1] .panel-number').click();
  const width=page.locator('[name=panelWidthMode]');assert.equal(await width.getAttribute('role'),'switch');await width.check();assert.equal(await page.locator('[data-fixed-size=width]').isVisible(),true);
  await width.uncheck();assert.equal(await page.locator('[data-fixed-size=width]').isVisible(),false);
 }finally{await browser.close();}
});
test('column group alignment and dynamic Y bounds survive presets, reload and settings ZIP',{skip:!enabled},async()=>{
 const browser=await playwright().chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'en-US'});page.setDefaultTimeout(4000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await require('./helpers/expanded-sections.cjs')(page);await page.goto(url());await choose(page,'overlap');await range(page,'overlapColumn2Count',2);
  for(const [key,height] of [['panel2_1',200],['panel2_2',100]]){await page.locator('[data-hit='+key+'] .panel-number').click();await page.locator('[name=panelHeightMode]').check();await number(page,'panelHeight',height);await page.locator('[name=panelPositionMode]').uncheck();}
  await range(page,'overlapColumnAlignment',1);let config=await saved(page);assert.equal(config.overlapColumnAlignment['2'],'center');assert.equal(config.layout.panel2_2.height,128);assert.equal(config.overlapSizing.panel2_2.height,128);assert.equal(config.layout.panel2_1.y,364);assert.equal(config.layout.panel2_2.y,588);
  await range(page,'overlapColumnAlignment',2);config=await saved(page);assert.equal(config.layout.panel2_1.y,704);assert.equal(config.layout.panel2_2.y,928);
  await page.locator('[name=panelPositionMode]').check();await number(page,'panelY',9999);config=await saved(page);assert.equal(config.layout.panel2_2.height,128);assert.equal(config.layout.panel2_2.y,928);assert.equal(await page.locator('[name=panelYSlider]').getAttribute('max'),'928');
  await number(page,'panelHeight',300);config=await saved(page);assert.equal(config.layout.panel2_2.height,300);assert.equal(config.layout.panel2_2.y,756);assert.equal(await page.locator('[name=panelYSlider]').getAttribute('max'),'756');
  await number(page,'panelY',650);assert.equal((await saved(page)).layout.panel2_2.y,756,'upper neighbour prevents moving through the bottom-aligned first panel');await page.locator('[name=panelPositionMode]').uncheck();await range(page,'overlapColumnAlignment',0);assert.equal((await saved(page)).layout.panel2_1.y,24);
  await page.locator('[name=panelPositionMode]').check();await number(page,'panelY',650);
  await page.locator('#change-layout').click();await choose(page,'bento');await page.locator('#change-layout').click();await choose(page,'overlap');
  await page.reload();await choose(page,'overlap');config=await saved(page);assert.equal(config.overlapColumnAlignment['2'],'top');assert.equal(config.layout.panel2_2.y,650);
  const exported=await page.evaluate(()=>new TextDecoder().decode(OverlayPack.settingsEntries(JSON.parse(localStorage.getItem('obs-overlay-config')))[0].bytes));
  const output=JSON.parse(exported);assert.equal(output.layout.panel2_2.y,650);assert.deepEqual(output.overlapColumnAlignment,config.overlapColumnAlignment);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
