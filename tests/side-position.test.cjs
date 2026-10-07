const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const events=require('../template/events.js');
const pack=require('../template/pack.js');
const keys=Object.keys(events.panelLabels),subs=keys.slice(1,4),sides=keys.slice(4);
const content=Object.fromEntries(keys.map(key=>[key,{type:'none',url:''}]));
const source=fs.readFileSync(require.resolve('../template/preview.js'),'utf8');
function exported(input){return JSON.parse(new TextDecoder().decode(pack.settingsEntries({layoutVersion:4,panelContent:content,...input})[0].bytes));}
function assertSeparate(layout,enabled,gap){
 events.validateLayout(layout);
 const active=keys.filter(key=>enabled[key]!==false);
 for(const key of active){const b=layout[key];assert.ok(b.x>=gap&&b.y>=gap&&b.x+b.width<=1920-gap&&b.y+b.height<=1080-gap,key+' bounds');}
 for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
  const a=layout[active[i]],b=layout[active[j]];
  assert.ok(a.x+a.width+gap<=b.x||b.x+b.width+gap<=a.x||a.y+a.height+gap<=b.y||b.y+b.height+gap<=a.y,active[i]+' / '+active[j]);
 }
}
function normalizer(){
 const publicContext={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../template/config.public.js'),'utf8'),publicContext);
 const defaults=publicContext.window.OVERLAY_PUBLIC_CONFIG;
 const context={keys,panelGroups:{sub:subs,side:sides},defaults,OverlayEvents:events,structuredClone,initialPlacement:events.defaultPlacement()};
 vm.runInNewContext(source.slice(source.indexOf('  const defaultStyle='),source.indexOf('  function restoredSettings(')),context);
 vm.runInNewContext(source.slice(source.indexOf('  function restoredSettings('),source.indexOf('  let nextPropertyLabelId=')),context);
 return context;
}
test('Side column moves as a unit for four swaps, counts, gaps, aspects and manual Sub widths',()=>{
 for(const sidePosition of ['left','right'])for(const swapped of [false,true])for(const gap of [8,48])for(let sub=0;sub<=3;sub++)for(let side=0;side<=3;side++)for(const aspect of ['auto','16:9','21:9','32:9']){
  const enabled=Object.fromEntries(keys.map(key=>[key,key==='game'||subs.indexOf(key)>=0&&subs.indexOf(key)<sub||sides.indexOf(key)>=0&&sides.indexOf(key)<side]));
  const placement=events.defaultPlacement();placement.game.level2=swapped?'bottom':'top';
  const sizing={game:{aspect},custom1:{widthMode:'fixed',width:500}};
  const layout=events.autoLayout({placement,enabled,sizing,gap,sidePosition});assertSeparate(layout,enabled,gap);
  const expectedX=sidePosition==='left'?gap:1920-gap-440;
  for(const key of sides.filter(key=>enabled[key])){assert.equal(layout[key].x,expectedX);assert.equal(layout[key].width,440);}
  assert.equal(layout.game.x,sidePosition==='left'?440+2*gap:gap);
  if(sub){const top=swapped?layout.custom1:layout.game,bottom=swapped?layout.game:layout.custom1;assert.ok(top.y+top.height+gap<=bottom.y);}
  const right=events.autoLayout({placement,enabled,sizing,gap,sidePosition:'right'});
  for(const key of keys.filter(key=>enabled[key])){assert.equal(layout[key].width,right[key].width);assert.equal(layout[key].height,right[key].height);assert.equal(layout[key].y,right[key].y);}
 }
});
test('all disabled subsets stay bounded and separated with either Side position',()=>{
 for(const sidePosition of ['left','right'])for(const gap of [8,48])for(let bits=0;bits<128;bits++){
  const enabled=Object.fromEntries(keys.map((key,index)=>[key,!!(bits&(1<<index))]));
  assertSeparate(events.autoLayout({placement:events.defaultPlacement(),enabled,gap,sidePosition}),enabled,gap);
 }
});
test('moving Side keeps Sub auto widths, sizing bounds and manual-width warnings unchanged',()=>{
 for(const gap of [8,48])for(const swapped of [false,true]){
  const placement=events.defaultPlacement();placement.game.level2=swapped?'bottom':'top';
  const options={placement,gap,sizing:{custom1:{widthMode:'fixed',width:500},custom2:{widthMode:'fixed',width:300}}};
  for(const key of keys)for(const axis of ['width','height'])assert.deepEqual(events.sizingBounds({...options,sidePosition:'left'},key,axis),events.sizingBounds({...options,sidePosition:'right'},key,axis));
  const left=events.autoLayout({...options,sidePosition:'left'}),right=events.autoLayout({...options,sidePosition:'right'});
  assert.equal(left.custom3.width,right.custom3.width);
  const config={panelSizing:options.sizing,panelGap:gap};assert.equal(events.subWidthWarning({...config,sidePosition:'left'}),events.subWidthWarning({...config,sidePosition:'right'}));
 }
});
test('legacy per-Side placement defaults right while the new key survives export and reload',()=>{
 const context=normalizer(),legacy={panelPlacement:{...events.defaultPlacement(),chat:{level1:'left',level2:'bottom'}}};
 const old=context.normalize(legacy);assert.equal(old.sidePosition,'right');
 for(const sidePosition of ['left','right'])for(const gap of [8,48])for(const swapped of [false,true]){
  const placement=events.defaultPlacement();placement.game.level2=swapped?'bottom':'top';
  const saved=exported({sidePosition,panelGap:gap,panelPlacement:placement});assert.equal(saved.sidePosition,sidePosition);
  assert.deepEqual(saved.layout,events.autoLayout({placement,gap,sidePosition}));
  const reload=context.normalize(context.restoredSettings(saved,saved,JSON.stringify(saved)));assert.equal(reload.sidePosition,sidePosition);
  assert.deepEqual(JSON.parse(JSON.stringify(reload.panelPlacement)),events.normalizePlacement(placement));
 }
 const oldExport=exported(legacy);assert.equal(oldExport.sidePosition,'right');assert.deepEqual(oldExport.layout,events.resolveLayout());
 assert.equal(context.normalize({sidePosition:'unsupported'}).sidePosition,'right');
 assert.throws(()=>exported({sidePosition:'unsupported'}),/Invalid Side position/);
});
test('horizontal Side switch updates one key without changing row placement',()=>{
 const html={},context={config:{sidePosition:'right',panelPlacement:events.defaultPlacement(),panelEnabled:{}},panelGroups:{sub:subs,side:sides},OverlayEvents:events,structuredClone,sizeConstraintTarget:null,byId:()=>html,propertyRow:(label,c,name,v,checked,type,variant)=>`<toggle ${name} ${checked?'on':'off'} class="${variant}">${c}`};
 vm.runInNewContext(source.slice(source.indexOf('  function renderPlacement(){'),source.indexOf('  const editorRow=')),context);
 context.renderPlacement();assert.match(html.innerHTML,/<toggle sidePosition off class="[^"]*property-row--side-switch/);
 const original=JSON.stringify(context.config.panelPlacement);assert.equal(context.updatePlacement({name:'sidePosition',checked:true}),true);
 assert.equal(context.config.sidePosition,'left');assert.equal(JSON.stringify(context.config.panelPlacement),original);assert.match(html.innerHTML,/<toggle sidePosition on/);
 context.updatePlacement({name:'sidePosition',checked:false});assert.equal(context.config.sidePosition,'right');
});


test('native Side checkbox change routes through the shared placement handler before applying',()=>{
 const handlers={},calls=[],context={form:{addEventListener:(name,handler)=>handlers[name]=handler},control(){},selected:null,snappingSlider:null,
  updatePresetLabel(){},updatePlacement(input){calls.push(['placement',input.name,input.checked]);},apply(){calls.push(['apply']);},paintGradientControls(){}};
 const start=source.indexOf("  form.addEventListener('input',event=>{"),end=source.indexOf("  form.addEventListener('click',event=>",start);
 vm.runInNewContext(source.slice(start,end),context);
 const input={name:'sidePosition',checked:true,matches:()=>false};
 handlers.input({target:input});assert.deepEqual(calls,[]);
 handlers.change({target:input});assert.deepEqual(calls,[['placement','sidePosition',true],['apply']]);
});


test('placement switches retain keyboard focus on their replacement through change and apply',()=>{
 for(const name of ['placementSwap','sidePosition'])for(const focused of [true,false]){
  const input={name,checked:true,matches:selector=>selector===':focus'&&document.activeElement===input},other={name:'unrelated'},document={activeElement:focused?input:other},handlers={},replacements={},focusedDuringApply=[];
  const context={document,config:{sidePosition:'right',panelPlacement:events.defaultPlacement()},sizeConstraintTarget:null,OverlayEvents:events,structuredClone,
   form:{addEventListener:(event,handler)=>handlers[event]=handler},selected:null,snappingSlider:null,updatePresetLabel(){},paintGradientControls(){},
   control:key=>replacements[key],renderPlacement(){
    if(document.activeElement===input)document.activeElement=null;
    for(const key of ['placementSwap','sidePosition'])replacements[key]={name:key,focus(options){assert.equal(options.preventScroll,true);document.activeElement=this;}};
   },apply(){focusedDuringApply.push(document.activeElement);}};
  vm.runInNewContext(source.slice(source.indexOf('  function updatePlacement('),source.indexOf('  const editorRow=')),context);
  const start=source.indexOf("  form.addEventListener('input',event=>{"),end=source.indexOf("  form.addEventListener('click',event=>",start);
  vm.runInNewContext(source.slice(start,end),context);
  handlers.change({target:input});
  assert.equal(focusedDuringApply[0],focused?replacements[name]:other,name+' keyboard focus');
  assert.equal(document.activeElement,focused?replacements[name]:other);
 }
});
