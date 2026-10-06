const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../template/preview.js'),'utf8');
test('extra-narrow selection recommends global border removal; acceptance, cancel and other controls preserve scope',()=>{
 for(const [name,value,mode,accept,prompts,expected] of [
  ['panelGap','0','solid',true,1,'none'],['panelGap','0','gradient',false,1,'gradient'],
  ['panelGap','1','solid',true,0,'solid'],['panelGap','0','none',true,0,'none'],
  ['globalFillMode','solid','solid',true,0,'solid']]){
  let handler,calls=0;const radio={value:mode},gap={value};
  const region={game:{stroke:{mode:'solid',color:'#abcdef'}}};
  const config={globalStyle:{stroke:{mode}},regionBackgrounds:structuredClone(region),regionStyleOverrides:{game:true}};
  const context={config,form:{addEventListener(event,callback){handler=callback;}},control:field=>field==='panelGap'?gap:radio,OverlayEvents:{panelGaps:[8,16,24,32,48]},
   presetRangeValue:(_name,values,fallback)=>values[Number(gap.value)]??fallback,
   localized:message=>'translated:'+message,window:{confirm(message){calls++;assert.match(message,/^translated:/);return accept;}},
   apply(){config.globalStyle.stroke.mode=radio.value;},paintGradientControls(){}};
  const start=source.indexOf("  form.addEventListener('change',event=>{");
  const end=source.indexOf("  form.addEventListener('click'",start);
  vm.runInNewContext(source.slice(start,end),context);
  handler({target:{name,value,matches:()=>false}});
  assert.equal(calls,prompts,`${name}/${value}/${mode}: prompt count`);
  assert.equal(config.globalStyle.stroke.mode,expected);
  assert.deepEqual(config.regionBackgrounds,region);
  assert.deepEqual(config.regionStyleOverrides,{game:true});
 }
});
