const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../template/preview.js'),'utf8');
const pack=require('../template/pack.js');
const presets=source.slice(source.indexOf('  const opacityPresets='),source.indexOf('  function migratePanelContent('));
const scales={regionOpacity:[10,20,40,70,100],regionBlur:[4,8,16,32,64],regionStrokeWidth:[1,2,4,6,8]};

function editor(values,region={}){
 const inputs=Object.fromEntries(Object.entries({regionFillMode:'solid',regionStrokeMode:'solid',regionColor:'#123456',regionBorderColor:'#abcdef',regionOpacity:'1',regionBlur:'2',regionStrokeWidth:'2',regionImage:'assets/card.png',panelContentType:'none',...values}).map(([name,value])=>[name,{name,value:String(value)}]));
 inputs.regionOverride={checked:true};
 const context={selected:'custom1',config:{panelSizing:{custom1:{width:300,height:150}},regionBackgrounds:{custom1:region},regionStyleOverrides:{},panelContent:{}},control:name=>inputs[name]};
 vm.runInNewContext(presets,context);
 const start=source.indexOf('  function readEditor(){'),end=source.indexOf('  function readGlobal(){',start);
 vm.runInNewContext(source.slice(start,end),context);
 context.readEditor();return context;
}

test('regional slider indices save real strengths in nested and legacy fields, and survive export',()=>{
 for(const [name,values] of Object.entries(scales))for(let index=0;index<values.length;index++){
  const context=editor({[name]:index});
  const region=context.config.regionBackgrounds.custom1;
  const read=value=>name==='regionOpacity'?value.fill.opacity:name==='regionBlur'?value.fill.blur:value.stroke.width;
  assert.equal(read(region),values[index],`${name} index ${index}`);
  assert.equal(region.opacity,region.fill.opacity);assert.equal(region.blur,region.fill.blur);
  const saved=JSON.parse(new TextDecoder().decode(pack.settingsEntries(context.config)[1].bytes));
  assert.equal(read(saved.regionBackgrounds.custom1),values[index]);
  assert.equal(saved.regionStyleOverrides.custom1,true);
  assert.equal(saved.regionBackgrounds.custom1.image,'assets/card.png');
 }
});

test('regional ranges retain saved defaults and use the same ascending five-step presentation',()=>{
 const context={window:{},editorRow:(_label,html,variant)=>`<row class="${variant}">${html}</row>`};
 vm.runInNewContext(presets,context);
 const start=source.indexOf('  const editorPreset='),end=source.indexOf('  const fieldHtml=',start);
 vm.runInNewContext(source.slice(start,end)+';this.renderPreset=editorPreset;',context);
 for(const [label,name,value,descending,fallback,index,unit] of [
  ['불투명도','regionOpacity',20,[100,70,40,20,10],20,1,'%'],
  ['흐림','regionBlur',16,[64,32,16,8,4],16,2,'px'],
  ['두께','regionStrokeWidth',4,[8,6,4,2,1],4,2,'px']
 ]){
  const html=context.renderPreset(label,name,value,descending,fallback);
  assert.match(html,new RegExp(`name="${name}" type="range" min="0" max="4" step="1" value="${index}"`));
  assert.match(html,/property-row--size property-row--preset/);
  assert.ok(html.includes(`(${value}${unit})`));assert.equal((html.match(/<span style=/g)||[]).length,5);
  assert.doesNotMatch(html,/<select/);
 }
 const render=source.slice(source.indexOf('  function renderEditor(){'),source.indexOf('  function renderContentExtra(){'));
 assert.doesNotMatch(render,/region(?:Opacity|Blur|StrokeWidth):nearestPreset/,'actual values must not overwrite slider indices after rendering');
});

test('regional slider input updates translated labels before change with global handler',()=>{
 let handler,applies=0;const label={};
 const context={selected:'custom1',OverlayEvents:{panelGaps:[8,16,24,32,48]},form:{querySelector:()=>label,addEventListener(_event,callback){handler=callback;}},apply(){applies++;},paintGradientControls(){},window:{KMGI18n:{localize:value=>({'매우 강함':'Very strong'}[value]||value)}}};
 vm.runInNewContext(presets,context);
 const start=source.indexOf("  form.addEventListener('input',event=>{"),end=source.indexOf("  form.addEventListener('change'",start);
 vm.runInNewContext(source.slice(start,end),context);
 for(const [name,values] of Object.entries(scales)){
  handler({target:{name,value:'4',matches:()=>false}});
  assert.equal(label.innerHTML,`<span data-preset-strength>Very strong</span> (${values[4]}${name==='regionOpacity'?'%':'px'})`);
 }
 assert.equal(applies,3);
});

test('editing regional strengths preserves gradient stops, images, content and stroke opacity rule',()=>{
 const gradient={type:'linear',angle:37,stops:[{position:0,color:'#112233',opacity:25},{position:45,color:'#445566',opacity:80},{position:100,color:'#778899',opacity:100}]};
 const region={image:'assets/card.png',fill:{mode:'gradient',gradient:structuredClone(gradient),color2:'#778899'},stroke:{mode:'gradient',gradient:structuredClone(gradient),color2:'#778899'}};
 const context=editor({regionFillMode:'gradient',regionStrokeMode:'gradient',panelContentType:'media',panelContentUrl:'assets/movie.webm'},region);
 assert.deepEqual(region.fill.gradient,gradient);
 assert.equal(region.stroke.opacity,100);assert.ok(region.stroke.gradient.stops.every(stop=>stop.opacity===100));
 assert.deepEqual(region.stroke.gradient.stops.map(stop=>[stop.position,stop.color]),gradient.stops.map(stop=>[stop.position,stop.color]));
 assert.equal(region.stroke.gradient.angle,37);
 assert.equal(context.config.panelContent.custom1.url,'assets/movie.webm');
 const saved=JSON.parse(new TextDecoder().decode(pack.settingsEntries(context.config)[1].bytes));
 assert.deepEqual(saved.regionBackgrounds.custom1.fill.gradient,gradient);
});

test('all range families paint progress from their current bounds without changing values',()=>{
 const inputs=[{min:'0',max:'4',value:'1'},{min:'1',max:'3',value:'3'},{min:'100',max:'900',value:'500'},{min:'4',max:'4',value:'4'}];
 for(const input of inputs)input.style={setProperty(name,value){this[name]=value;}};
 const context={form:{querySelectorAll:()=>inputs}};
 const start=source.indexOf('  function syncRangeProgress(){'),end=source.indexOf('  function paintGradientControls(){',start);
 vm.runInNewContext(source.slice(start,end),context);context.syncRangeProgress();
 assert.deepEqual(inputs.map(input=>input.style['--range-progress']),['25%','100%','50%','0%']);
 assert.deepEqual(inputs.map(input=>input.value),['1','3','500','4']);
 const css=fs.readFileSync(require.resolve('../template/preview.css'),'utf8');
 for(const pseudo of ['webkit-slider-runnable-track','webkit-slider-thumb','moz-range-track','moz-range-progress','moz-range-thumb'])assert.match(css,new RegExp(`::-${pseudo}\\{[^}]*border:0;outline:0;box-shadow:none`));
 assert.match(css,/::-webkit-slider-runnable-track\{height:6px/);assert.match(css,/::-webkit-slider-thumb\{[^}]*width:16px;height:16px/);
});

// The optional browser check uses an isolated page so personal drafts remain untouched.
test('rendered regional controls share global slider, gradient and collapsible section geometry',{skip:!process.env.KMG_THEME_RENDER_URL},async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(new URL('settings.html',process.env.KMG_THEME_RENDER_URL).href);
  await page.waitForSelector('html[data-i18n-ready]');
  await page.locator('.panel-hit[data-hit=custom1]').click();
  await page.locator('[name=regionOverride]').check();
  const region=page.locator('.region-style-details');
  const fillSection=region.locator('details.property-section').first(),strokeSection=region.locator('details.property-section').last();
  assert.equal(await fillSection.locator('[name=regionImage]').count(),1);assert.equal(await fillSection.locator('[data-upload=region]').count(),1);
  assert.equal(await strokeSection.locator('[name=regionImage],[data-upload=region]').count(),0);
  assert.equal(await fillSection.locator('summary h4').textContent(),'패널 채우기');assert.equal(await strokeSection.locator('summary h4').textContent(),'패널 테두리');
  assert.equal(await region.evaluate(el=>getComputedStyle(el).gap),'24px');
  assert.equal(await region.locator(':scope>.divider').count(),2);
  assert.equal(await region.evaluate(el=>getComputedStyle(el.parentElement).gap),'24px');
  await page.locator('[name=regionOverride]').uncheck();assert.equal(await region.locator(':scope>.divider').first().isVisible(),false);await page.locator('[name=regionOverride]').check();
  const ranges=await page.locator('#settings input[type=range]').evaluateAll(els=>els.map(el=>({name:el.name,appearance:getComputedStyle(el).appearance,height:getComputedStyle(el).height,border:getComputedStyle(el).borderTopWidth,progress:el.style.getPropertyValue('--range-progress')})));
  assert.ok(ranges.every(range=>range.appearance==='none'&&range.height==='24px'&&range.border==='0px'&&range.progress.endsWith('%')));
  for(const name of ['subCount','sideCount']){const count=page.locator(`[name=${name}]`);await count.evaluate(el=>el.value='2');await count.dispatchEvent('input');assert.equal(await count.evaluate(el=>el.style.getPropertyValue('--range-progress')),'50%');await count.evaluate(el=>el.value='3');await count.dispatchEvent('input');}
  await page.locator('[name=panelWidthMode]').selectOption('fixed');
  const sizeSlider=page.locator('[name=panelWidthSlider]');await sizeSlider.evaluate(el=>el.value=el.min);await sizeSlider.dispatchEvent('input');
  assert.equal(await sizeSlider.evaluate(el=>el.style.getPropertyValue('--range-progress')),'0%');
  await page.locator('[name=panelWidthMode]').selectOption('auto');
  for(const [regional,global] of [['regionOpacity','globalFillOpacity'],['regionBlur','globalFillBlur'],['regionStrokeWidth','globalStrokeWidth']]){
   const geometry=el=>{const row=el.closest('.property-row'),s=getComputedStyle(el);return {type:el.type,min:el.min,max:el.max,step:el.step,height:s.height,marks:row.querySelectorAll('.size-ratio-marks span').length};};
   assert.deepEqual(await page.locator(`[name=${regional}]`).evaluate(geometry),await page.locator(`[name=${global}]`).evaluate(geometry));
  }
  const opacity=page.locator('[name=regionOpacity]');
  await opacity.evaluate(el=>el.value='4');await opacity.dispatchEvent('input');await opacity.dispatchEvent('change');
  assert.match(await page.locator('[data-preset-label=regionOpacity]').textContent(),/100%/);
  assert.equal(await opacity.evaluate(el=>el.style.getPropertyValue('--range-progress')),'100%');
  await opacity.focus();await page.keyboard.press('ArrowLeft');assert.equal(await opacity.evaluate(el=>getComputedStyle(el).outlineWidth),'3px');await page.keyboard.press('ArrowRight');
  await page.locator('.panel-hit[data-hit=custom2]').click();await page.locator('.panel-hit[data-hit=custom1]').click();
  assert.equal(await opacity.inputValue(),'4','switching panels retains the actual strength');
  const fill=region.locator('details.property-section').first(),summary=fill.locator('summary');
  const globalSummary=page.locator('#global-settings details.property-section').nth(2).locator('summary');
  const chevron=el=>({gap:getComputedStyle(el).gap,shape:getComputedStyle(el,'::after').content,transform:getComputedStyle(el,'::after').transform});
  assert.deepEqual(await summary.evaluate(chevron),await globalSummary.evaluate(chevron));
  await summary.click();assert.equal(await fill.evaluate(el=>el.open),false);
  await summary.click();assert.equal(await fill.evaluate(el=>el.open),true);
  const button=page.locator('[data-gradient-edit=regionFill]');
  assert.equal(await button.evaluate(el=>el.tagName),'BUTTON');
  await button.click();await page.locator('.kmg-gradient-popover').waitFor();
  assert.equal(await page.locator('[name=regionFillMode][value=gradient]').isChecked(),true);
  await page.locator('.kmg-gradient-angle').fill('37');await page.locator('.kmg-gradient-angle').dispatchEvent('input');
  assert.match(await button.evaluate(el=>el.style.backgroundImage),/37deg/);
  await page.keyboard.press('Escape');await page.locator('.kmg-gradient-popover').waitFor({state:'detached'});
  await page.locator('[data-gradient-edit=regionStroke]').click();await page.locator('.kmg-gradient-popover').waitFor();
  assert.equal(await page.locator('.kmg-gradient-details>label').last().isVisible(),false,'stroke hides the alpha editor');
  await page.keyboard.press('Escape');
 }finally{await browser.close();}
});
