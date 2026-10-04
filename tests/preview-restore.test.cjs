const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const events=require('../events.js');
const gradientApi=require('../gradient.js');
const source=fs.readFileSync(path.join(__dirname,'../preview.js'),'utf8');
const start=source.indexOf('  function restoredSettings('),end=source.indexOf('  function propertyRow(',start);
const defaults={name:'NEUTRAL',layoutVersion:2};
const context={defaults,OverlayEvents:events};vm.runInNewContext(source.slice(start,end),context);
const restore=context.restoredSettings;
const exported={name:'EXPORTED',layoutVersion:3,layout:events.autoLayout(),globalStyle:{background:{mode:'gradient',gradient:{type:'linear',angle:225,stops:[{position:0,color:'#123456',opacity:100},{position:100,color:'#ABCDEF',opacity:25}]}}}};
const draft={...exported,name:'DRAFT'};
const styleStart=source.indexOf('  const opacityPresets='),styleEnd=source.indexOf('  function normalize(input)',styleStart),styleContext={};
vm.runInNewContext(source.slice(styleStart,styleEnd)+'\nthis.normalizeStylePresets=normalizeStylePresets;',styleContext);
const backgroundStart=source.indexOf('  const defaultStyle='),backgroundEnd=source.indexOf('  const opacityPresets=',backgroundStart),backgroundContext={};
vm.runInNewContext(source.slice(backgroundStart,backgroundEnd)+'\nthis.backgroundStyle=backgroundStyle;',backgroundContext);

test('new exported config beats stale browser settings and preserves its gradient',()=>{
 assert.equal(restore(exported,draft,'old-file'),exported);
 assert.deepEqual(restore(exported,null,null).globalStyle,exported.globalStyle);
});
test('browser draft remains editable when the applied config file has not changed',()=>{
 assert.equal(restore(exported,draft,JSON.stringify(exported)),draft);
});
test('neutral and older private configuration do not become public reset defaults',()=>{
 assert.equal(restore({name:'PRIVATE',layoutVersion:2},null,null),defaults);
 assert.equal(restore(defaults,draft,null),draft);
});
test('malformed saved and exported geometry falls back to neutral defaults',()=>{
 assert.equal(restore({...exported,layout:{}},{...draft,layout:{}},null),defaults);
});

test('extracted settings restore uploaded asset paths and gradient through config.js',()=>{
 const pack=require('../pack.js');
 const input={...exported,
  slotContent:{custom1:'image',custom2:'none',custom3:'none'},
  customSlotMedia:{custom1:{url:'assets/custom1.png'}},
  globalStyle:{...exported.globalStyle,background:{...exported.globalStyle.background,mode:'file',url:'assets/background-whole.png'}},
  regionBackgrounds:{game:{color:'#FFFFFF',image:'assets/background-game.png',opacity:20,blur:16,borderColor:'#FFFFFF'}}
 };
 const entry=pack.settingsEntries(input).find(item=>item.name==='config.js');
 const fileContext={window:{}};vm.runInNewContext(new TextDecoder().decode(entry.bytes),fileContext);
 const fromFile=JSON.parse(JSON.stringify(fileContext.window.OVERLAY_CONFIG));
 const restored=restore(fromFile,draft,'previous-file');
 assert.equal(restored.customSlotMedia.custom1.url,'assets/custom1.png');
 assert.equal(restored.globalStyle.background.url,'assets/background-whole.png');
 assert.equal(restored.regionBackgrounds.game.image,'assets/background-game.png');
 assert.deepEqual(restored.globalStyle.background.gradient,exported.globalStyle.background.gradient);
 assert.equal(restore(fromFile,{...restored,name:'LATER DRAFT'},JSON.stringify(fromFile)).customSlotMedia.custom1.url,'assets/custom1.png');
});

test('style presets choose the nearest value with lower tie-break and force stroke alpha',()=>{
 const gradient={type:'linear',angle:45,stops:[{position:0,color:'#112233',opacity:15},{position:100,color:'#AABBCC',opacity:60}]};
 const config={globalStyle:{fill:{opacity:30,blur:12},stroke:{width:5,opacity:20,gradient}},regionBackgrounds:{game:{opacity:35,blur:12,fill:{opacity:35,blur:12},borderOpacity:5,stroke:{opacity:25,gradient:structuredClone(gradient)}}}};
 styleContext.normalizeStylePresets(config);
 assert.equal(config.globalStyle.fill.opacity,20);assert.equal(config.globalStyle.fill.blur,8);
 assert.equal(config.globalStyle.stroke.width,4);assert.equal(config.globalStyle.stroke.opacity,100);
 assert.deepEqual(config.globalStyle.stroke.gradient.stops.map(stop=>stop.opacity),[100,100]);
 assert.equal(config.regionBackgrounds.game.opacity,40);assert.equal(config.regionBackgrounds.game.blur,8);
 assert.equal(config.regionBackgrounds.game.borderOpacity,100);assert.equal(config.regionBackgrounds.game.stroke.opacity,100);
 assert.deepEqual(config.regionBackgrounds.game.stroke.gradient.stops.map(stop=>stop.opacity),[100,100]);
});

test('fresh and empty backgrounds retain solid black while first gradient edit starts neutral',()=>{
 const publicContext={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../config.public.js'),'utf8'),publicContext);
 const publicBackground=publicContext.window.OVERLAY_PUBLIC_CONFIG.globalStyle.background;
 assert.equal(publicBackground.mode,'solid');assert.equal(publicBackground.color,'#000000');
 assert.equal(gradientApi.normalize(publicBackground).stops[0].color,'#303030');
 assert.equal(gradientApi.normalize(publicBackground).stops.at(-1).color,'#909090');
 for(const saved of [undefined,{}]){
  const background=backgroundContext.backgroundStyle(saved);
  assert.equal(background.mode,'solid');assert.equal(background.color,'#000000');
  assert.equal(gradientApi.normalize(background).stops[0].color,'#303030');
  assert.equal(gradientApi.normalize(background).stops.at(-1).color,'#909090');
 }
});

test('saved legacy background colors and explicit gradients override the new neutral seed',()=>{
 for(const saved of [
  {mode:'solid',color:'#112233',color2:'#445566'},
  {mode:'gradient',color:'#112233',color2:'#445566'}
 ]){
  const background=backgroundContext.backgroundStyle(saved);
  assert.equal(background.gradient,undefined);
  assert.deepEqual(gradientApi.normalize(background).stops.map(stop=>stop.color),['#112233','#445566']);
 }
 for(const explicit of [
  {type:'linear',angle:210,stops:[{position:0,color:'#010203',opacity:100},{position:100,color:'#A0B0C0',opacity:100}]},
  {type:'linear',angle:135,stops:[{position:0,color:'#000000',opacity:100},{position:100,color:'#101010',opacity:100}]}
 ]){
  const background=backgroundContext.backgroundStyle({mode:'gradient',color:'#112233',color2:'#445566',gradient:explicit});
  assert.equal(gradientApi.normalize(background).angle,explicit.angle);
  assert.equal(gradientApi.normalize(background).stops[0].color,explicit.stops[0].color);
  assert.equal(gradientApi.normalize(background).stops.at(-1).color,explicit.stops.at(-1).color);
 }
});
