const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const events=require('../template/events.js');
const pack=require('../template/pack.js');
const source=fs.readFileSync(require.resolve('../template/preview.js'),'utf8');
const keys=Object.keys(events.panelLabels);
const panelGroups={sub:keys.slice(1,4),side:keys.slice(4)};
const publicContext={window:{}};
vm.runInNewContext(fs.readFileSync(require.resolve('../template/config.public.js'),'utf8'),publicContext);
const defaults=publicContext.window.OVERLAY_PUBLIC_CONFIG;
const plain=value=>JSON.parse(JSON.stringify(value));
function normalizer(){
 const context={keys,panelGroups,defaults,OverlayEvents:events,structuredClone,initialPlacement:events.defaultPlacement()};
 const start=source.indexOf('  const defaultStyle='),end=source.indexOf('  function restoredSettings(');
 vm.runInNewContext(source.slice(start,end),context);
 return context;
}
function countEditor(config,selected=null){
 const context={config,selected,panelGroups,sizeConstraintTarget:null,reads:0,renders:0,
  readEditor(){context.reads++;},renderEditor(){context.renders++;}};
 const start=source.indexOf('  function updatePanelCount('),end=source.indexOf('  function updatePlacement(',start);
 assert.ok(start>=0,'count handler exists');
 vm.runInNewContext(source.slice(start,end),context);
 return context;
}
test('each slider value activates a prefix and preserves the other panel group',()=>{
 for(const group of ['sub','side'])for(let count=1;count<=3;count++){
  const context=countEditor(normalizer().normalize(defaults));
  assert.equal(context.updatePanelCount({dataset:{panelCount:group},value:String(count)}),true);
  assert.equal(context.config.panelEnabled.game,true);
  for(const [name,groupKeys] of Object.entries(panelGroups))groupKeys.forEach((key,index)=>assert.equal(context.config.panelEnabled[key],name===group?index<count:true));
 }
});
test('count reduction saves and deselects a hidden editor while retaining its content',()=>{
 const config=normalizer().normalize(defaults);
 config.panelContent.custom3={type:'web',url:'https://example.com/widget'};
 const context=countEditor(config,'custom3');
 context.updatePanelCount({dataset:{panelCount:'sub'},value:'1'});
 assert.equal(context.reads,1);assert.equal(context.selected,null);assert.equal(context.renders,1);
 assert.equal(config.panelContent.custom3.url,'https://example.com/widget');
 context.updatePanelCount({dataset:{panelCount:'sub'},value:'3'});
 assert.equal(config.panelEnabled.custom3,true);assert.equal(context.selected,null);
});
test('legacy holes and Main off normalize to counted prefixes including empty groups',()=>{
 const normalize=normalizer().normalize;
 for(let bits=0;bits<128;bits++){
  const old=Object.fromEntries(keys.map((key,index)=>[key,!!(bits&(1<<index))]));
  const restored=normalize({...defaults,panelEnabled:old});
  assert.equal(restored.panelEnabled.game,true);
  for(const group of Object.values(panelGroups)){
   const count=Math.max(1,group.filter(key=>old[key]).length);
   group.forEach((key,index)=>assert.equal(restored.panelEnabled[key],index<count));
  }
  assert.deepEqual(Object.keys(restored.panelEnabled),keys);
 }
});
test('draft and imported configuration restore Main off and holes before layout',()=>{
 const context=normalizer();
 const start=source.indexOf('  function restoredSettings('),end=source.indexOf('  let nextPropertyLabelId=',start);
 vm.runInNewContext(source.slice(start,end),context);
 const imported={...defaults,layout:events.autoLayout(),panelEnabled:{game:false,custom1:false,custom2:true,custom3:false,chat:false,translation:true,hand:true}};
 const draft=structuredClone(imported);
 for(const restored of [context.restoredSettings(imported,null,null),context.restoredSettings(imported,draft,JSON.stringify(imported))]){
  const enabled=plain(context.normalize(restored).panelEnabled);
  assert.deepEqual(enabled,{game:true,custom1:true,custom2:false,custom3:false,chat:true,translation:true,hand:false});
 }
});
test('all nine count combinations export unchanged individual panelEnabled keys',()=>{
 let schema;
 for(let sub=1;sub<=3;sub++)for(let side=1;side<=3;side++){
  const config=normalizer().normalize(defaults),context=countEditor(config);
  context.updatePanelCount({dataset:{panelCount:'sub'},value:String(sub)});
  context.updatePanelCount({dataset:{panelCount:'side'},value:String(side)});
  const entries=pack.settingsEntries(config),saved=JSON.parse(new TextDecoder().decode(entries[0].bytes));
  assert.deepEqual(saved.panelEnabled,plain(config.panelEnabled));assert.deepEqual(Object.keys(saved.panelEnabled),keys);
  const currentSchema=Object.keys(saved).sort();schema??=currentSchema;assert.deepEqual(currentSchema,schema);
  assert.ok(!currentSchema.some(key=>/count/i.test(key)));
  assert.equal(new TextDecoder().decode(entries[0].bytes),new TextDecoder().decode(entries[1].bytes));
 }
});
test('all nine counts remain in bounds and nonoverlapping with every gap, Main aspect and swap',()=>{
 for(let sub=1;sub<=3;sub++)for(let side=1;side<=3;side++)for(const gap of events.panelGaps)for(const swap of [false,true])for(const aspect of ['auto','16:9','21:9','32:9']){
  const config=normalizer().normalize(defaults),context=countEditor(config);
  context.updatePanelCount({dataset:{panelCount:'sub'},value:String(sub)});context.updatePanelCount({dataset:{panelCount:'side'},value:String(side)});
  config.panelSizing.game.aspect=aspect;
  const placement=events.defaultPlacement();placement.game.level2=swap?'bottom':'top';
  const layout=events.autoLayout({placement,enabled:config.panelEnabled,sizing:config.panelSizing,gap});events.validateLayout(layout);
  const active=keys.filter(key=>config.panelEnabled[key]);
  for(let a=0;a<active.length;a++)for(let b=a+1;b<active.length;b++){
   const first=layout[active[a]],second=layout[active[b]];
   assert.ok(first.x+first.width<=second.x||second.x+second.width<=first.x||first.y+first.height<=second.y||second.y+second.height<=first.y,`${sub}/${side}/${gap}/${swap}/${aspect}: ${active[a]} overlaps ${active[b]}`);
  }
  for(let index=1;index<sub;index++)assert.ok(layout[panelGroups.sub[index]].x>layout[panelGroups.sub[index-1]].x);
  for(let index=1;index<side;index++)assert.ok(layout[panelGroups.side[index]].y>layout[panelGroups.side[index-1]].y);
 }
});
test('placement card reuses property rows and range marks with one swap checkbox',()=>{
 const context=normalizer(),html={};
 Object.assign(context,{config:context.normalize(defaults),byId:()=>html,nextPropertyLabelId:0});
 vm.runInNewContext(source.slice(source.indexOf('  function bindRowLabel('),source.indexOf('  const color=')),context);
 vm.runInNewContext(source.slice(source.indexOf('  function renderPlacement(){'),source.indexOf('  function updatePanelCount(')),context);
 context.renderPlacement();
 assert.equal((html.innerHTML.match(/type="checkbox"/g)||[]).length,1);
 assert.match(html.innerHTML,/<input type="checkbox" name="placementSwap" role="switch">/);
 assert.equal((html.innerHTML.match(/type="range"/g)||[]).length,2);
  for(const group of ['sub','side']){
  assert.match(html.innerHTML,new RegExp(`name="${group}Count"[^>]+min="1" max="3" step="1"`));
 }
 assert.doesNotMatch(html.innerHTML,/data-enabled|placement-heading|<select|datalist/);
 assert.equal((html.innerHTML.match(/class="size-ratio-marks"/g)||[]).length,2);
 assert.doesNotMatch(fs.readFileSync(require.resolve('../template/preview.css'),'utf8'),/#placement-list \.size-ratio-marks/);
});

test('vertical Main and Sub switch maps checked to the bottom row and unchecked to the top row',()=>{
 const config=normalizer().normalize(defaults),context={config,sizeConstraintTarget:null,OverlayEvents:events,structuredClone,renderPlacement(){}};
 const start=source.indexOf('  function updatePlacement('),end=source.indexOf('  const editorRow=',start);
 vm.runInNewContext(source.slice(start,end),context);
 assert.equal(context.updatePlacement({name:'placementSwap',checked:true}),true);
 assert.equal(config.panelPlacement.game.level2,'bottom');
 assert.equal(context.updatePlacement({name:'placementSwap',checked:false}),true);
 assert.equal(config.panelPlacement.game.level2,'top');
});
