const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url'),events=require('../template/events.js');
const enabled=process.env.KMG_RUN_OVERLAP_COLUMN_UI==='1';
const url=()=>process.env.KMG_THEME_RENDER_URL?new URL('settings.html',process.env.KMG_THEME_RENDER_URL).href:pathToFileURL(process.env.KMG_SETTINGS_HTML||require.resolve('../template/settings.html')).href;
const playwright=()=>require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('obs-overlay-config')));
async function choose(page,mode){await page.locator('[data-layout-choice='+mode+']').click();await page.waitForFunction(mode=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.layoutMode===mode,mode);}
async function range(page,name,value){const node=page.locator('[name='+name+']');await node.evaluate((node,value)=>node.value=String(value),value);await node.dispatchEvent('input');const match=name.match(/^overlapColumn([1-5])Count$/);if(match)await page.waitForFunction(({column,count})=>{const config=JSON.parse(localStorage.getItem('obs-overlay-config'));return [1,2,3].every(row=>config.panelEnabled['panel'+column+'_'+row]===(row<=count));},{column:match[1],count:value});}
async function number(page,name,value){const node=page.locator('[name='+name+']');await node.fill(String(value));await node.dispatchEvent('change');}
async function positionSaved(page,key,y){await page.waitForFunction(({key,y})=>{const position=JSON.parse(localStorage.getItem('obs-overlay-config'))?.overlapPositions?.[key];return position?.mode==='fixed'&&position.y===y;},{key,y});}
async function open(browser){
 const context=await browser.newContext({locale:'en-US',viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{if(window!==window.top)return;window.draftWrites=0;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='obs-overlay-config')window.draftWrites++;return original.call(this,key,value);};});
 await require('./helpers/expanded-sections.cjs')(page);await page.goto(url());await choose(page,'overlap');return {context,page,errors};
}
function assertSafeLayout(config){
 const gap=config.panelGap;for(let column=1;column<=5;column++){
  const boxes=[1,2,3].map(row=>'panel'+column+'_'+row).filter(key=>config.panelEnabled[key]&&config.overlapColumns?.[column]?.enabled!==false).map(key=>config.layout[key]);
  for(let index=0;index<boxes.length;index++){const box=boxes[index];assert.ok(box.height>=128-1e-6,'active panel height >=128');assert.ok(box.y>=gap-1e-6&&box.y+box.height<=1080-gap+1e-6,'panel remains inside canvas gap');if(index)assert.ok(box.y>=boxes[index-1].y+boxes[index-1].height+gap-1e-6,'ordered neighbouring panels never collide');}
 }
}
async function editSecond(page){
 await range(page,'overlapColumn2Count',2);
 await page.locator('[data-hit=panel2_1] .panel-number').click();await page.locator('[name=panelHeightMode]').check();await number(page,'panelHeight',200);
 await page.locator('[data-hit=panel2_2] .panel-number').click();
 await page.locator('[name=panelHeightMode]').check();await number(page,'panelHeight',200);
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.overlapSizing?.panel2_2?.height===200);
}

test('manual Overlap Y edits stay bounded and survive height/count/gap, preset switching and reload',{skip:!enabled},async()=>{
 const browser=await playwright().chromium.launch({headless:true,channel:'chrome'});
 try{
  const {context,page,errors}=await open(browser);await editSecond(page);await page.locator('[name=panelPositionMode]').uncheck();
  assert.equal(await page.locator('[name=panelPositionMode]').isChecked(),false);
  assert.equal(await page.locator('[name=panelY]').isVisible(),false);
  await page.locator('[name=panelPositionMode]').check();
  await number(page,'panelY',350);await positionSaved(page,'panel2_2',350);
  let config=await saved(page);assert.equal(config.layout.panel2_2.y,350);assert.equal(config.layout.panel2_2.x,config.layout.panel2_1.x);
  const guide=page.locator('#overlap-safety-guide .safety-cell');assert.equal(await guide.count(),15);
  assert.deepEqual(await guide.allTextContents(),Array(15).fill(''),'safety colors contain no panel coordinate labels');
  const safetyBefore=await guide.evaluateAll(nodes=>nodes.map(node=>node.style.cssText));
  await page.locator('[data-hit=panel2_1] .panel-number').click();await page.locator('[name=panelHeightMode]').check();await number(page,'panelHeight',100);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.overlapSizing?.panel2_1?.height===128);
  assert.equal((await saved(page)).layout.panel2_2.y,350,'upper panel height does not move manual Y');
  assert.deepEqual(await guide.evaluateAll(nodes=>nodes.map(node=>node.style.cssText)),safetyBefore,'safety grid stays fixed while panels move');
  await range(page,'overlapColumn2Count',3);assertSafeLayout(await saved(page));await range(page,'overlapColumn2Count',2);await range(page,'panelGap',4);
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.panelGap===48);
  assert.equal((await saved(page)).layout.panel2_2.y,350);
  await page.locator('[data-hit=panel2_2] .panel-number').click();await number(page,'panelY',-10);await positionSaved(page,'panel2_2',224);
  await number(page,'panelY',9999);await positionSaved(page,'panel2_2',832);
  assert.equal(await page.locator('[name=panelY]').inputValue(),'832');assert.equal(await page.locator('[name=panelYSlider]').getAttribute('max'),'832');
  await range(page,'panelYSlider',500);await positionSaved(page,'panel2_2',500);
  config=await saved(page);const original=structuredClone(config.overlapPositions),content=structuredClone(config.panelContent);
  await page.locator('[name=overlapColumn2Enabled]').uncheck();assert.equal(await page.locator('[data-hit=panel2_2]').count(),0);await page.locator('[name=overlapColumn2Enabled]').check();await range(page,'overlapColumn2Count',2);
  assert.deepEqual((await saved(page)).overlapPositions,original,'hidden positions remain stored');
  await page.locator('#change-layout').click();await choose(page,'bento');assert.equal(await page.locator('[name=panelPositionMode]').count(),0);
  await page.locator('#change-layout').click();await choose(page,'overlap');assert.deepEqual((await saved(page)).overlapPositions,original);
  await page.reload();await choose(page,'overlap');config=await saved(page);assert.deepEqual(config.overlapPositions,original);assert.deepEqual(config.panelContent,content);assert.equal(config.layout.panel2_2.y,500);
  assert.deepEqual(config.overlapPlacement.panel2_2,{column:2,row:2,columnSpan:1,rowSpan:1});assertSafeLayout(config);const exported=await page.evaluate(()=>JSON.parse(new TextDecoder().decode(OverlayPack.settingsEntries(JSON.parse(localStorage.getItem('obs-overlay-config'))).find(e=>e.name==='config.json').bytes)));assert.equal(exported.layout.panel2_2.y,500);assertSafeLayout(exported);assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(__dirname,'../.qa-private/0.10.0/overlap-position-regression.png')});await context.close();
 }finally{await browser.close();}
});

test('vertical dragging keeps column X, commits once on release, and rolls back cancellation',{skip:!enabled},async()=>{
 const browser=await playwright().chromium.launch({headless:true,channel:'chrome'});
 try{
  const {context,page,errors}=await open(browser);await editSecond(page);
  await page.locator('[name=panelPositionMode]').check();await number(page,'panelY',400);await positionSaved(page,'panel2_2',400);
  await page.locator('[name=panelY]').blur();await page.waitForTimeout(100); // Finish the preceding typed-field blur commit before measuring drag writes.
  const panel=page.locator('[data-hit=panel2_2]'),surface=panel.locator('.hit-surface');await page.locator('#preview-fullscreen').evaluate(node=>node.scrollIntoView({block:'center'}));
  let box=await panel.boundingBox(),config=await saved(page);const originalX=config.layout.panel2_2.x,scale=await page.locator('#preview').evaluate(frame=>Math.min(frame.clientWidth/1920,frame.clientHeight/1080));
  const point={x:box.x+box.width/2,y:box.y+box.height/2};await page.mouse.move(point.x,point.y);assert.equal(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest('[data-hit]')?.dataset.hit,point),'panel2_2',JSON.stringify({point,box}));await page.evaluate(()=>window.draftWrites=0);await page.mouse.down();
  await page.mouse.move(point.x+35,point.y+40,{steps:5});
  assert.equal((await saved(page)).overlapPositions.panel2_2.y,400,'pointer movement has no durable draft writes');
  assert.equal(await page.evaluate(()=>window.draftWrites),0);assert.equal(await panel.getAttribute('data-dragging'),'true');
  await page.mouse.up();const expected=Math.round(400+40/scale);await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>window.draftWrites),1,'one completed drag writes one draft');config=await saved(page);assert.equal(config.layout.panel2_2.x,originalX);assert.equal(config.layout.panel2_2.y,expected);assertSafeLayout(config);
  const beforeCancel=structuredClone(config.overlapPositions),beforeBox=await panel.boundingBox();await page.evaluate(()=>window.draftWrites=0);
  await page.mouse.move(beforeBox.x+beforeBox.width/2,beforeBox.y+beforeBox.height/2);await page.mouse.down();await page.mouse.move(beforeBox.x+beforeBox.width/2,beforeBox.y+beforeBox.height/2-35,{steps:3});
  await surface.dispatchEvent('pointercancel',{pointerId:1,pointerType:'mouse',isPrimary:true});await page.mouse.move(1400,950);await page.mouse.up();
  assert.deepEqual((await saved(page)).overlapPositions,beforeCancel);assert.equal(await page.evaluate(()=>window.draftWrites),0);
  const restored=await panel.boundingBox();assert.ok(Math.abs(restored.y-beforeBox.y)<.1,'cancel restores displayed position');
  const boundedStart=await panel.boundingBox();await page.mouse.move(boundedStart.x+boundedStart.width/2,boundedStart.y+boundedStart.height/2);await page.mouse.down();await page.mouse.move(boundedStart.x+boundedStart.width/2,boundedStart.y+boundedStart.height/2-300,{steps:4});await page.mouse.up();await positionSaved(page,'panel2_2',248);assert.equal((await saved(page)).layout.panel2_2.x,originalX);assertSafeLayout(await saved(page));
  await panel.locator('.panel-number').click();assert.equal(await page.locator('#selected-panel-tag').isVisible(),false,'non-drag click retains normal selection toggle');
  const main=page.locator('#select-main');await main.click();assert.equal(await page.locator('#selected-panel-tag').textContent(),'Main');assert.equal(await page.locator('[name=panelPositionMode]').count(),0);
  const beforeMain=await saved(page),mainBox=await main.boundingBox();await page.mouse.move(mainBox.x+mainBox.width/2,mainBox.y+mainBox.height/2);await page.mouse.down();await page.mouse.move(mainBox.x+mainBox.width/2,mainBox.y+mainBox.height/2-20);await page.mouse.up();assert.deepEqual((await saved(page)).overlapPositions,beforeMain.overlapPositions);
  await page.locator('#change-layout').click();await choose(page,'bento');const bentoBefore=await saved(page),label=page.locator('[data-hit=chat] .panel-number');await label.scrollIntoViewIfNeeded();box=await label.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y+box.height/2+20);await page.mouse.up();assert.deepEqual((await saved(page)).layout,bentoBefore.layout);assert.equal(await page.locator('[name=panelPositionMode]').count(),0);
  assert.deepEqual(errors,[]);await context.close();
 }finally{await browser.close();}
});


test('imported colliding requests render as ordered bounded panels while retaining stored sizes',{skip:!enabled},async()=>{
 const browser=await playwright().chromium.launch({headless:true,channel:'chrome'});
 try{
  const config=events.switchLayoutPreset({layoutVersion:4,panelContent:Object.fromEntries(events.allPanelKeys.map(key=>[key,{type:'none',url:''}]))},'overlap');
  for(let row=1;row<=3;row++){const key='panel2_'+row;config.panelEnabled[key]=true;config.overlapSizing[key]={heightMode:'fixed',height:500};config.overlapPositions[key]={mode:'fixed',y:1079};}
  config.layout=events.resolveConfigLayout(config);
  const context=await browser.newContext({locale:'en-US',viewport:{width:1440,height:1000}});
  await context.addInitScript(config=>{if(window!==window.top)return;if(!localStorage.getItem('obs-overlay-config'))localStorage.setItem('obs-overlay-config',JSON.stringify(config));},config);
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await require('./helpers/expanded-sections.cjs')(page);await page.goto(url());await choose(page,'overlap');
  await page.locator('#preview-fullscreen').evaluate(node=>node.scrollIntoView({block:'center'}));
  assertSafeLayout(await saved(page));
  const preview=await page.locator('#preview-fullscreen').boundingBox(),labels=[];
  for(let row=1;row<=3;row++){
   const key='panel2_'+row,label=page.locator('[data-hit='+key+'] .panel-number'),rect=await label.boundingBox();labels.push(rect);
   assert.ok(rect.y>=preview.y&&rect.y+rect.height<=preview.y+preview.height+.2,'bottom-edge label remains inside preview');
  }
  for(let first=0;first<labels.length;first++)for(let second=first+1;second<labels.length;second++)assert.ok(labels[first].y+labels[first].height<=labels[second].y||labels[second].y+labels[second].height<=labels[first].y,'collision labels have distinct click targets');
  for(let row=1;row<=3;row++){
   const key='panel2_'+row;await page.locator('[data-hit='+key+'] .panel-number').click();assert.equal(await page.locator('[data-hit='+key+']').getAttribute('aria-pressed'),'true');
   let retained=await saved(page);assert.equal(retained.overlapSizing[key].height,500);assert.equal(retained.overlapPositions[key].y,1079);assert.equal(retained.layout[key].height,328);
   await page.locator('[name=regionOverride]').check();await page.waitForFunction(key=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.regionStyleOverrides?.[key]===true,key);
   retained=await saved(page);assert.equal(retained.overlapSizing[key].height,500,'unrelated style edit never rewrites imported height');assert.equal(retained.overlapPositions[key].y,1079);assert.equal(retained.layout[key].height,328);
  }
  assert.deepEqual(errors,[]);await context.close();
 }finally{await browser.close();}
});
