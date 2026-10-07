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
 for(const [raw,expected] of [[-4,206],[0,206],[2.5,206],[9999,660]]){
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
 const end=source.indexOf("    if(input.matches('[data-panel-count]'))",start);
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

test('placement card has no level selects and one swap toggle that flips Main and Sub rows',()=>{
 const start=source.indexOf('  function renderPlacement(){'),end=source.indexOf('  const editorRow=');
 const html={};
 const context={config:{panelPlacement:events.defaultPlacement(),panelEnabled:{}},panelGroups:{sub:keys.slice(1,4),side:keys.slice(4)},keys,names:Object.fromEntries(keys.map(k=>[k,k])),OverlayEvents:events,structuredClone,sizeConstraintTarget:null,
  byId:()=>html,propertyRow:(label,c,name,v,checked)=>`<toggle ${name} ${checked?'on':'off'}>${c}`};
 vm.runInNewContext(source.slice(start,end),context);
 context.renderPlacement();
 assert.ok(!/<select|data-placement-level/.test(html.innerHTML));
 assert.equal((html.innerHTML.match(/type="checkbox"/g)||[]).length,0);
 assert.equal((html.innerHTML.match(/type="range"/g)||[]).length,2);
 assert.match(html.innerHTML,/<toggle placementSwap off>/);
 context.updatePlacement({name:'placementSwap',checked:true});
 const p=context.config.panelPlacement;
 assert.equal(p.game.level2,'bottom');
 for(const k of ['custom1','custom2','custom3'])assert.equal(p[k].level2,'top');
 assert.match(html.innerHTML,/<toggle placementSwap on>/);
 context.updatePlacement({name:'placementSwap',checked:false});
 assert.equal(context.config.panelPlacement.game.level2,'top');
});

test('per-panel style separates labeled Fill and Stroke groups without changing controls or override visibility',()=>{
 const sectionStart=source.indexOf('    const section=(title,html)=>'),sectionEnd=source.indexOf('    const content=',sectionStart);
 const regionStart=source.indexOf("    const regionInputs=section('영역 스타일',"),regionEnd=source.indexOf("    byId('panel-editor').innerHTML=",regionStart);
 for(const override of [false,true]){
  const context={config:{regionStyleOverrides:{custom1:override}},key:'custom1',useRegionOverride:override,region:{},fill:{mode:'solid'},stroke:{mode:'solid'},opacityPresets:[],blurPresets:[],strokeWidthPresets:[],
   propertyRow:(_label,html,name,value)=>`<input name="${name}" value="${value}">${html}`,
   color:name=>`<input name="${name}">`,gradientControl:name=>`<button data-gradient="${name}"></button>`,
   editorToggle:(_label,name)=>`<input name="${name}">`,editorPreset:(_label,name)=>`<input name="${name}">`,fieldHtml:(_label,name)=>`<input name="${name}">`,editorFile:()=>'<input type="file" data-upload="region">'};
  vm.runInNewContext(source.slice(sectionStart,sectionEnd)+source.slice(regionStart,regionEnd)+';this.markup=regionInputs;',context);
  const html=context.markup,fill=html.indexOf('<h4>채우기</h4>'),stroke=html.indexOf('<h4>테두리</h4>'),divider=html.indexOf('<div class="divider"></div>',fill);
  assert.ok(fill>=0&&fill<html.indexOf('name="regionFillMode"')&&html.indexOf('name="regionBlur"')<divider&&divider<stroke&&stroke<html.indexOf('name="regionStrokeMode"'));
  assert.equal((html.match(/name="regionFillMode"/g)||[]).length,3);assert.equal((html.match(/name="regionStrokeMode"/g)||[]).length,3);
  for(const name of ['regionOverride','regionColor','regionOpacity','regionBlur','regionBorderColor','regionStrokeWidth','regionImage'])assert.equal((html.match(new RegExp('name="'+name+'"','g'))||[]).length,1,name);
  assert.equal(/class="property-group region-style-details" hidden/.test(html),!override);
 }
});
