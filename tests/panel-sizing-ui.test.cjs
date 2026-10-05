const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const events=require('../template/events.js');
const pack=require('../template/pack.js');
const keys=Object.keys(events.resolveLayout());
const source=fs.readFileSync(require.resolve('../template/preview.js'),'utf8');
function clamp(sizing,selected='custom1',enabled={},target=null){
 const config={panelSizing:events.normalizeSizing(),panelPlacement:events.defaultPlacement(),panelEnabled:enabled};
 for(const [key,value] of Object.entries(sizing))Object.assign(config.panelSizing[key],value);
 const context={config,keys,selected,sizeConstraintTarget:target,OverlayEvents:events};
 vm.runInNewContext(source.slice(source.indexOf('  function clampPanelSizes(){'),source.indexOf('  function syncSizeControls(){')),context);
 context.clampPanelSizes();return config;
}
test('numeric input clamps before validation, with fixed peers preserved',()=>{
 for(const [raw,expected] of [[-4,220],[0,220],[2.5,220],[9999,660]]){
  const config=clamp({custom1:{widthMode:'fixed',width:raw}});
  assert.equal(config.panelSizing.custom1.width,expected);events.validateLayout(events.autoLayout({placement:config.panelPlacement,sizing:config.panelSizing}));
 }
 const config=clamp({game:{widthMode:'fixed',width:1400},custom1:{widthMode:'fixed',width:1500},custom2:{widthMode:'fixed',width:300},custom3:{widthMode:'fixed',width:300},chat:{widthMode:'fixed',width:400}});
 assert.equal(config.panelSizing.game.width,1384);assert.equal(config.panelSizing.custom1.width,660);
 assert.equal(config.panelSizing.custom2.width,300);assert.equal(config.panelSizing.chat.width,440);
});
test('reactivated fixed panels clamp first against already active fixed siblings',()=>{
 const config=clamp({chat:{heightMode:'fixed',height:600},translation:{heightMode:'fixed',height:600},hand:{heightMode:'fixed',height:200}},'chat',{},'translation');
 assert.equal(config.panelSizing.chat.height,475);assert.equal(config.panelSizing.hand.height,200);assert.equal(config.panelSizing.translation.height,277);
 events.validateLayout(events.autoLayout({placement:config.panelPlacement,sizing:config.panelSizing}));
});
test('settings JSON preserves fixed choices and exports the same boxes as preview',()=>{
 const config=clamp({custom1:{widthMode:'fixed',width:600},chat:{heightMode:'fixed',height:240}});
 config.layoutVersion=4;config.panelContent=Object.fromEntries(keys.map(key=>[key,{type:'none',url:''}]));
 const saved=JSON.parse(new TextDecoder().decode(pack.settingsEntries(config)[0].bytes));
 assert.deepEqual(saved.panelSizing,config.panelSizing);assert.deepEqual(saved.layout,events.autoLayout({placement:config.panelPlacement,sizing:config.panelSizing}));
 assert.equal(saved.layout.custom1.width,600);assert.equal(saved.layout.chat.height,240);
 assert.throws(()=>pack.settingsEntries({...config,panelSizing:{game:{widthMode:'fixed',width:9999}}}),/Invalid panel size/);
});

test('visibility changes repair all fixed sizes before saving geometry',()=>{
 for(let bits=0;bits<128;bits++){
  const enabled=Object.fromEntries(keys.map((key,i)=>[key,!!(bits&(1<<i))]));
  const sizing=Object.fromEntries(keys.map(key=>[key,{widthMode:'fixed',width:500,heightMode:'fixed',height:300}]));
  const config=clamp(sizing,'custom1',enabled);
  events.validateLayout(events.autoLayout({placement:config.panelPlacement,enabled,sizing:config.panelSizing}));
 }
});

test('pointer slider input snaps to recalculated aspect marks while keyboard input stays precise',()=>{
 const start=source.indexOf("  form.addEventListener('input',event=>{")+"  form.addEventListener('input',event=>{".length;
 const end=source.indexOf("    if(input.matches('[data-enabled]'))",start);
 function slide(value,height,pointer=true){
  const input={name:'panelWidthSlider',value:String(value),min:'220',max:'660'},number={value:'0'};
  const context={selected:'custom1',snappingSlider:pointer?input:null,config:{layout:{custom1:{width:440,height}}},OverlayEvents:events,control:()=>number};
  vm.runInNewContext('function slide(event){'+source.slice(start,end)+'} slide(event);',{...context,event:{target:input}});
  return Number(number.value);
 }
 assert.equal(slide(443,250),444);assert.equal(slide(443,250,false),443);
 assert.equal(slide(450,250),450);assert.equal(slide(530,300),533);assert.equal(slide(253,250),250);
});


test('committing a size preserves the panel button receiving the next click',()=>{
 const hits={children:[],append(button){this.children.push(button);button.parent=this;},querySelector(selector){return this.children.find(button=>selector===`[data-hit="${button.dataset.hit}"]`)||null;}};
 const document={createElement(){return {dataset:{},style:{},attributes:{},setAttribute(name,value){this.attributes[name]=value;},append(child){this.firstElementChild=child;},remove(){this.parent.children=this.parent.children.filter(button=>button!==this);}};}};
 const config={panelEnabled:Object.fromEntries(keys.map(key=>[key,true]))};
 const context={config,keys,names:Object.fromEntries(keys.map(key=>[key,key])),selected:'custom1',window:{},document,byId:id=>id==='panel-hit-areas'?hits:null,updateCameraOverlay(){},highlight(){}};
 vm.runInNewContext(source.slice(source.indexOf('  function drawHits(layout){'),source.indexOf('  function apply(message){')),context);
 const layout=events.resolveLayout();context.drawHits(layout);
 const original=[...hits.children];context.drawHits({...layout,custom1:{...layout.custom1,width:500}});
 assert.equal(hits.children.length,7);
 for(let i=0;i<original.length;i++)assert.equal(hits.children[i],original[i]);
 assert.equal(hits.querySelector('[data-hit="custom1"]').attributes['aria-pressed'],'true');
 assert.match(hits.querySelector('[data-hit="custom1"]').style.cssText,/width:26.041/);
 config.panelEnabled.chat=false;context.drawHits(layout);assert.equal(hits.children.length,6);assert.equal(hits.querySelector('[data-hit="chat"]'),null);
});
