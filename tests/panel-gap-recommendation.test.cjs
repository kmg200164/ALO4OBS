const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../src/preview.js'),'utf8');
test('extra-narrow selection recommends global border removal; acceptance, cancel and other controls preserve scope',()=>{
 for(const [name,value,width,accept,prompts,expected] of [
  ['panelGap','0',4,true,1,'0'],['panelGap','0',4,false,1,'3'],
  ['panelGap','1',4,true,0,'3'],['panelGap','0',0,true,0,'3'],
  ['globalFillMode','solid',4,true,0,'3']]){
  let handler,calls=0;const slider={value:'3',dispatchEvent(){}},gap={value};
  const region={game:{stroke:{mode:'solid',color:'#abcdef'}}};
  const config={globalStyle:{stroke:{mode:'solid',width}},regionBackgrounds:structuredClone(region),regionStyleOverrides:{game:true}};
  const context={Event:class{},config,form:{addEventListener(event,callback){handler=callback;}},control:field=>field==='panelGap'?gap:slider,OverlayEvents:{panelGaps:[0,8,16,24,32,48]},
   presetRangeValue:(_name,values,fallback)=>values[Number(gap.value)]??fallback,
   localized:message=>'translated:'+message,window:{confirm(message){calls++;assert.match(message,/^translated:/);return accept;}},
   apply(){},paintGradientControls(){}};
  const start=source.indexOf("  form.addEventListener('change',event=>{");
  const end=source.indexOf("  form.addEventListener('click'",start);
  vm.runInNewContext(source.slice(start,end),context);
  handler({target:{name,value,matches:()=>false}});
  assert.equal(calls,prompts,`${name}/${value}/${width}: prompt count`);
  assert.equal(slider.value,expected);
  assert.deepEqual(config.regionBackgrounds,region);
  assert.deepEqual(config.regionStyleOverrides,{game:true});
 }
});
