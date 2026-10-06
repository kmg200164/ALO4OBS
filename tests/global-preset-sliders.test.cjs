const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../template/preview.js'),'utf8');

function controls(values){return name=>({value:String(values[name]??'')});}
function reader(values){
 const config={panelGap:32,globalStyle:{background:{},fill:{opacity:20,blur:32},stroke:{width:4,opacity:100}}};
 const context={config,control:controls(values),OverlayEvents:{panelGaps:[8,16,24,32,48],normalizeGap:value=>value}};
 const presets=source.slice(source.indexOf('  const opacityPresets='),source.indexOf('  function migratePanelContent('));
 vm.runInNewContext(presets,context);
 const start=source.indexOf('  function readGlobal(){'),end=source.indexOf('  function liveConfig(',start);
 vm.runInNewContext(source.slice(start,end),context);
 context.readGlobal();return context;
}

test('every global slider index saves its actual preset value',()=>{
 const cases=[['panelGap',[8,16,24,32,48],value=>value.panelGap],['globalFillOpacity',[10,20,40,70,100],value=>value.globalStyle.fill.opacity],['globalFillBlur',[4,8,16,32,64],value=>value.globalStyle.fill.blur],['globalStrokeWidth',[1,2,4,6,8],value=>value.globalStyle.stroke.width]];
 for(const [name,presets,read] of cases)for(let index=0;index<presets.length;index++){
  const context=reader({panelGap:3,globalFillOpacity:3,globalFillBlur:1,globalStrokeWidth:2,[name]:index});
  assert.equal(read(context.config),presets[index],`${name} index ${index}`);
 }
});

test('global sliders choose the nearest supported initial preset and show its semantic label',()=>{
 const context={window:{}};
 const start=source.indexOf('  function nearestPreset('),end=source.indexOf('  function forceStrokeAlpha(',start);
 vm.runInNewContext(source.slice(start,end)+';globalThis.presetRange=presetRange;',context);
 for(const [name,value,values,fallback,label,labels] of [
  ['panelGap',30,[8,16,24,32,48],32,'넓음',['매우 좁음','좁음','보통','넓음','매우 넓음']],['globalFillOpacity',66,[10,20,40,70,100],20,'강함',['매우 약함','약함','중간','강함','매우 강함']],
  ['globalFillBlur',18,[4,8,16,32,64],32,'중간',['매우 약함','약함','중간','강함','매우 강함']],['globalStrokeWidth',3,[1,2,4,6,8],4,'약함',['매우 약함','약함','중간','강함','매우 강함']]
 ]){
  const html=context.presetRange(name,value,values,fallback,labels,'px');
  assert.match(html,new RegExp(`name="${name}"[^>]+value="${values.indexOf(values.reduce((best,candidate)=>Math.abs(candidate-value)<Math.abs(best-value)||Math.abs(candidate-value)===Math.abs(best-value)&&candidate<best?candidate:best,values[0]))}"`));
  assert.match(html,new RegExp(`data-preset-strength>${label}<\\/span> \\(`));
  assert.equal((html.match(/<span style=/g)||[]).length,5);
 }
});

test('global preset labels are translated in Korean, English, and Japanese',()=>{
 const i18n=fs.readFileSync(require.resolve('../template/i18n.js'),'utf8');
 for(const [ko,en,ja] of [['매우 좁음','Extra narrow','とても狭い'],['좁음','Narrow','狭い'],['보통','Medium','標準'],['넓음','Wide','広い'],['매우 넓음','Extra wide','とても広い']]){
  assert.match(i18n,new RegExp(`'${ko}':'${en}'`));assert.match(i18n,new RegExp(`'${ko}':'${ja}'`));
 }
});

test('dragging a global slider updates its visible English and Japanese label before change',()=>{
 let handler,applies=0;const label={textContent:''};
 const context={OverlayEvents:{panelGaps:[8,16,24,32,48]},form:{querySelector:()=>label,addEventListener(_event,callback){handler=callback;}},selected:null,apply(){applies++;},paintGradientControls(){},window:{KMGI18n:{localize:value=>({ '매우 강함':'Very strong'}[value]||value)}}};
 const presets=source.slice(source.indexOf('  const opacityPresets='),source.indexOf('  function migratePanelContent('));
 vm.runInNewContext(presets,context);
 const start=source.indexOf("  form.addEventListener('input',event=>{"),end=source.indexOf("  form.addEventListener('change'",start);
 vm.runInNewContext(source.slice(start,end),context);
 handler({target:{name:'globalFillOpacity',value:'4',matches:()=>false}});
 assert.equal(label.innerHTML,'<span data-preset-strength>Very strong</span> (100%)');
 context.window.KMGI18n.localize=value=>({'매우 강함':'非常に強い'}[value]||value);
 handler({target:{name:'globalFillOpacity',value:'4',matches:()=>false}});
 assert.equal(label.innerHTML,'<span data-preset-strength>非常に強い</span> (100%)');
 assert.equal(applies,2);
});

test('global sliders use only custom number marks, and restoration never prompts',()=>{
 const global=source.slice(source.indexOf('  function renderGlobal(){'),source.indexOf('  function renderPlacement(){'));
 assert.doesNotMatch(global,/presetSelect\('(panelGap|globalFillOpacity|globalFillBlur|globalStrokeWidth)/);
 assert.doesNotMatch(global,/\blist=|<datalist/);
 assert.equal((global.match(/property-row--preset/g)||[]).length,4);
 const restoreStart=source.indexOf('  async function restoreDraft('),restoreEnd=source.indexOf('  function recoverDraft(',restoreStart);
 assert.ok(restoreStart>=0&&restoreEnd>restoreStart,'draft restoration exists');
 assert.doesNotMatch(source.slice(restoreStart,restoreEnd),/confirm\(/);
});
