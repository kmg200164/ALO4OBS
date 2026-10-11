
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const events=require('../template/events.js'),shape=require('../template/panel-shape.js'),pack=require('../template/pack.js');
const fresh=()=>({layoutVersion:4,layoutMode:'bento',panelContent:Object.fromEntries(events.allPanelKeys.map(key=>[key,{type:'none',url:''}]))});
const exported=input=>JSON.parse(new TextDecoder().decode(pack.settingsEntries(input).find(entry=>entry.name==='config.json').bytes));

test('global shadow inherits across both layouts; only enabled individual styles consume local values',()=>{
 for(const globalShadow of events.panelShadowStrengths)for(const key of events.allPanelKeys){
  for(const local of events.panelShadowStrengths){
   const input={globalShadow,panelShadows:{[key]:local},regionStyleOverrides:{[key]:false}};
   assert.equal(events.effectivePanelShadow(input,key),globalShadow);
   assert.equal(shape.styleFor(input,key).shadow,globalShadow);
   input.regionStyleOverrides[key]=true;assert.equal(events.effectivePanelShadow(input,key),local);assert.equal(shape.styleFor(input,key).shadow,local);
  }
  assert.equal(events.effectivePanelShadow({globalShadow,regionStyleOverrides:{[key]:true}},key),globalShadow,'missing local shadow inherits');
 }
 assert.equal(events.effectivePanelShadow({},'chat'),0);
 assert.equal(events.effectivePanelShadow({layoutMode:'overlap',globalShadow:64,regionStyleOverrides:{game:true},panelShadows:{game:48}},'game'),0);
});

test('legacy migration keeps switches, fills, strokes and dormant per-panel shadows without mutation',()=>{
 const old={...fresh(),panelShadows:{chat:48,custom1:32},regionStyleOverrides:{chat:false,custom1:true},
  regionBackgrounds:{chat:{fill:{mode:'solid',color:'#abcdef',opacity:70},stroke:{mode:'solid',color:'#123456',width:6}}}};
 const before=structuredClone(old),migrated=events.migrateOverlapPanels(old);
 assert.equal(migrated.globalShadow,0);assert.equal(migrated.panelShadows.chat,48);assert.equal(migrated.panelShadows.panel4_1,48);
 assert.equal(migrated.regionStyleOverrides.chat,false);assert.equal(migrated.regionStyleOverrides.panel4_1,false);
 assert.equal(events.effectivePanelShadow(migrated,'chat'),0,'legacy OFF switch now inherits; stored local value remains recoverable');
 assert.equal(events.effectivePanelShadow(migrated,'custom1'),32);
 migrated.regionStyleOverrides.chat=true;assert.equal(events.effectivePanelShadow(migrated,'chat'),48);
 assert.deepEqual(old,before);assert.deepEqual(migrated.regionBackgrounds.chat,before.regionBackgrounds.chat);
 const legacyV3=events.migrateOverlapPanels({layoutVersion:3,panelShadows:{chat:48}});
 assert.equal(Object.hasOwn(legacyV3,'globalShadow'),false);
});

test('exports and preset switches preserve independent local shadows and global shadow intent',()=>{
 const input={...fresh(),globalShadow:32,panelShadows:{chat:64,custom1:0},regionStyleOverrides:{chat:false,custom1:true}};
 const before=structuredClone(input),saved=exported(input),again=exported(saved);
 assert.equal(saved.globalShadow,32);assert.equal(saved.panelShadows.chat,64);assert.equal(saved.panelShadows.custom1,0);
 assert.notEqual(saved.regionStyleOverrides.chat,true,'export retains OFF as inheritance');
 assert.equal(events.effectivePanelShadow(saved,'chat'),32);assert.equal(events.effectivePanelShadow(saved,'custom1'),0);
 assert.deepEqual(again,saved);assert.deepEqual(input,before);
 const overlap=events.switchLayoutPreset(saved,'overlap'),back=events.switchLayoutPreset(overlap,'bento');
 assert.equal(back.globalShadow,32);assert.equal(back.panelShadows.chat,64);assert.equal(back.regionStyleOverrides.custom1,true);
});

test('export rejects global shadow values outside the same six supported tokens',()=>{
 for(const globalShadow of [-1,1,9,65,'32',null,{},[]])assert.throws(()=>exported({...fresh(),globalShadow}));
 for(const globalShadow of events.panelShadowStrengths)assert.equal(exported({...fresh(),globalShadow}).globalShadow,globalShadow);
});

test('current overlay config and actual background renderer apply global shadow inheritance',async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await require('./helpers/expanded-sections.cjs')(page);await page.goto(require('node:url').pathToFileURL(require.resolve('../template/overlay.html')).href+'?preview=1');
  const state=await page.evaluate(()=>{
   const keys=OverlayEvents.overlapPanelKeys,config={layoutVersion:4,layoutMode:'overlap',globalShadow:32,
    panelEnabled:Object.fromEntries(keys.map(key=>[key,['game','panel2_1','panel4_1'].includes(key)])),panelShadows:{panel2_1:0,panel4_1:64},
    regionStyleOverrides:{panel2_1:true,panel4_1:false},regionBackgrounds:{},globalStyle:{fill:{mode:'none'},stroke:{mode:'none'}}};
   Overlay.applyConfig(config);
   const first=[...document.querySelectorAll('.panel-shadow-layer feGaussianBlur')].map(node=>Number(node.getAttribute('stdDeviation')));
   Overlay.applyConfig({...config,globalShadow:16});
   const second=[...document.querySelectorAll('.panel-shadow-layer feGaussianBlur')].map(node=>Number(node.getAttribute('stdDeviation')));
   Overlay.applyConfig({...config,globalShadow:16,regionStyleOverrides:{panel2_1:true,panel4_1:true}});
   const third=[...document.querySelectorAll('.panel-shadow-layer feGaussianBlur')].map(node=>Number(node.getAttribute('stdDeviation')));
   return {first,second,third,current:Overlay.getConfig()};
  });
  assert.deepEqual(state.first,[16]);assert.deepEqual(state.second,[8]);assert.deepEqual(state.third,[32]);
  assert.equal(state.current.globalShadow,16);assert.equal(state.current.panelShadows.panel2_1,0);assert.equal(state.current.panelShadows.panel4_1,64);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});

test('rendered settings gates individual shadows with Fill and Stroke and preserves inheritance on reopen',async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const url=process.env.KMG_THEME_RENDER_URL?new URL('settings.html',process.env.KMG_THEME_RENDER_URL).href:
   require('node:url').pathToFileURL(require.resolve('../template/settings.html')).href;
  await require('./helpers/expanded-sections.cjs')(page);await page.goto(url);await page.locator('[data-layout-choice=bento]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.layoutMode==='bento');
  await page.evaluate(()=>{
   const config=JSON.parse(localStorage.getItem('obs-overlay-config'));
   config.globalShadow=32;config.panelShadows.chat=64;config.regionStyleOverrides.chat=false;
   localStorage.setItem('obs-overlay-config',JSON.stringify(config));
  });
  await page.reload();await page.locator('[data-layout-choice=bento]').click();
  await page.locator('[data-hit=chat] .panel-number').click();
  const local=page.locator('#panel-editor .region-style-details'),saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('obs-overlay-config')));
  assert.equal(await local.isVisible(),false);
  assert.equal(await local.locator('[name=panelShadowEnabled]').count(),1);
  assert.equal(await local.locator('[name=regionFillMode]').count(),5);
  assert.equal(await local.locator('[name=regionStrokeMode]').count(),3);
  assert.equal(await page.locator('#global-settings [name=globalShadowEnabled]').isChecked(),true);
  assert.equal(await page.locator('#global-settings [name=globalShadow]').inputValue(),'2');
  const waitSaved=async(field,value)=>page.waitForFunction(({field,value})=>{const data=JSON.parse(localStorage.getItem('obs-overlay-config'));return field.split('.').reduce((node,key)=>node?.[key],data)===value;},{field,value});
  const range=async(name,index)=>{const control=page.locator('[name='+name+']');await control.evaluate((node,value)=>node.value=String(value),index);await control.dispatchEvent('input');await waitSaved(name==='globalShadow'?'globalShadow':'panelShadows.chat',[8,16,32,48,64][index]);};
  await range('globalShadow',3);
  let config=await saved();assert.equal(config.globalShadow,48);assert.equal(config.panelShadows.chat,64);assert.equal(events.effectivePanelShadow(config,'chat'),48);
  await page.locator('[name=regionOverride]').check();await waitSaved('regionStyleOverrides.chat',true);assert.equal(await local.isVisible(),true);
  config=await saved();assert.equal(events.effectivePanelShadow(config,'chat'),64);
  await range('panelShadow',1);
  config=await saved();assert.equal(config.panelShadows.chat,16);assert.equal(events.effectivePanelShadow(config,'chat'),16);
  await page.locator('[name=regionOverride]').uncheck();await waitSaved('regionStyleOverrides.chat',false);assert.equal(await local.isVisible(),false);
  await range('globalShadow',2);config=await saved();assert.equal(events.effectivePanelShadow(config,'chat'),32);assert.equal(config.panelShadows.chat,16);
  await page.locator('[name=globalShadowEnabled]').uncheck();await waitSaved('globalShadow',0);config=await saved();assert.equal(config.globalShadow,0);assert.equal(events.effectivePanelShadow(config,'chat'),0);
  await page.locator('[name=regionOverride]').check();await waitSaved('regionStyleOverrides.chat',true);config=await saved();assert.equal(events.effectivePanelShadow(config,'chat'),16);
  await page.reload();await page.locator('[data-layout-choice=bento]').click();await page.locator('[data-hit=chat] .panel-number').click();
  assert.equal(await local.isVisible(),true);assert.equal(await page.locator('[name=globalShadowEnabled]').isChecked(),false);
  assert.equal(await page.locator('[name=panelShadow]').inputValue(),'1');
  const exported=await page.evaluate(()=>{
   const config=JSON.parse(localStorage.getItem('obs-overlay-config'));
   return JSON.parse(new TextDecoder().decode(OverlayPack.settingsEntries(config).find(entry=>entry.name==='config.json').bytes));
  });
  assert.equal(exported.globalShadow,0);assert.equal(exported.panelShadows.chat,16);assert.equal(exported.regionStyleOverrides.chat,true);
  await page.locator('#change-layout').click();await page.locator('[data-layout-choice=overlap]').click();
  await page.locator('#select-main').click();
  assert.equal(await page.locator('[name=overlapPanel]').count(),0);
  assert.equal(await page.locator('#panel-editor [name=panelShadowEnabled]').count(),0,'fullscreen Main suppresses local shadow controls');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
