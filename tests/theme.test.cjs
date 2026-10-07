const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const header=fs.readFileSync(path.join(__dirname,'../template/header.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../template/header.css'),'utf8');
const paletteSource=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/images/qa-0.9.0/figma-theme-tokens.json'),'utf8'));
const presets=['red','orange','yellow','lime','aloe','cyan','blue','purple','pink','monochrome'];
// Parse only the shipped primitive/semantic token rules, applying selector specificity.
function tokens(preset,theme){
 const variables={},priorities={};
 for(const rule of css.replace(/\/\*[\s\S]*?\*\//g,'').matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  let specificity=-1;
  for(let selector of rule[1].split(',')){
   selector=selector.trim();
   if(selector===':root'){specificity=Math.max(specificity,0);continue;}
   if(!/^body(?:\[[^\]]+\])*$/.test(selector))continue;
   const attrs=[...selector.matchAll(/\[([^=]+)=([^\]]+)\]/g)];
   if(attrs.every(([,name,value])=>({ 'data-ui-preset':preset,'data-theme':theme })[name]===value))specificity=Math.max(specificity,attrs.length*10+1);
  }
  if(specificity<0)continue;
  for(const [,name,value] of rule[2].matchAll(/(--[\w-]+)\s*:\s*([^;{}]+)/g))if(specificity>=(priorities[name]??-1)){variables[name]=value.trim();priorities[name]=specificity;}
 }
 function resolve(name,seen=[]){
  assert.ok(!seen.includes(name),'cyclic token '+name);
  assert.ok(variables[name],'missing token '+name);
  const value=variables[name];
  return value.replace(/var\((--[\w-]+)\)/g,(_,target)=>resolve(target,[...seen,name]));
 }
 return Object.fromEntries(Object.keys(variables).map(name=>[name,resolve(name)]));
}
function luminance(hex){
 assert.match(hex,/^#[0-9a-f]{6}$/i);
 const c=hex.slice(1).match(/../g).map(value=>parseInt(value,16)/255).map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4);
 return .2126*c[0]+.7152*c[1]+.0722*c[2];
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
const semanticRoles=['--page-background','--surface-card','--surface-field','--content-primary','--content-secondary','--border-control','--accent-default','--accent-hover','--accent-pressed','--content-on-accent','--surface-accent-subtle','--content-on-accent-subtle','--focus-ring','--selection-indicator','--accent-ink','--content-on-accent-hover','--content-on-accent-pressed','--surface-hover','--content-on-surface-hover','--surface-pressed','--content-on-surface-pressed'];
function matrix(){
 const combinations=[];
 for(const preset of presets)for(const theme of ['light','dark']){
  const t=tokens(preset,theme),rows=[],advisoryRows=[];
  const add=(component,state,foreground,background,minimum)=>rows.push({component,state,foreground,background,foregroundHex:t[foreground],backgroundHex:t[background],ratio:contrast(t[foreground],t[background]),minimum});
  for(const background of ['--page-background','--surface-card','--surface-field','--surface-accent-subtle']){
   add('body / card / field / guide text','default','--content-primary',background,4.5);
   add('secondary label / help / gradient value','default','--content-secondary',background,4.5);
   add('link / tick label','default','--accent-ink',background,4.5);
   add('outer focus ring / selection outline','focus / selected','--focus-ring',background,3);
   for(const [state,role] of [['default','--accent-default'],['hover','--accent-hover'],['pressed','--accent-pressed']])advisoryRows.push({component:'button fill / native range accent / checked switch fill',state,foreground:role,background,foregroundHex:t[role],backgroundHex:t[background],ratio:contrast(t[role],t[background]),referenceMinimum:3,meetsReference:contrast(t[role],t[background])>=3,required:false});
  }
  for(const [state,bg,fg] of [['default','--accent-default','--content-on-accent'],['hover','--accent-hover','--content-on-accent-hover'],['pressed','--accent-pressed','--content-on-accent-pressed']]){
   add('header title / icon / version, filled action / guide / sample button',state,fg,bg,4.5);
   add('header inset keyboard focus',state,fg,bg,3);
  }
  add('checked switch thumb / position cue','checked','--content-on-accent','--accent-default',3);
  add('unchecked switch thumb / position cue','default','--content-primary','--surface-field',3);
  add('guide code / kbd / control highlight','default','--content-on-accent','--accent-default',4.5);
  add('preset selected text','selected','--content-on-accent-subtle','--surface-accent-subtle',4.5);
  add('preset selected check icon','selected','--content-on-accent-subtle','--surface-accent-subtle',3);
  for(const [state,bg,fg] of [['hover','--surface-hover','--content-on-surface-hover'],['pressed','--surface-pressed','--content-on-surface-pressed']]){
   add('popover / gradient row text',state,fg,bg,4.5);
   add('FAQ / unselected preset row inverse text',state,'--surface-card','--content-primary',4.5);
   add('selected preset row inverse text',state,'--surface-accent-subtle','--content-on-accent-subtle',4.5);
   add('FAQ / unselected preset focus / swatch border',state,'--surface-card','--content-primary',3);
   add('selected preset focus / swatch border',state,'--surface-accent-subtle','--content-on-accent-subtle',3);
   add('popover inset focus / selected gradient inset / swatch border',state,fg,bg,3);
  }
  for(const status of ['warning','error','success','info']){
   add(status+' text',status,'--status-'+status,'--surface-'+status,4.5);
  }
  add('gradient remove inverse text','hover / pressed','--surface-error','--status-error',4.5);
  add('guide parent frame boundary','default','--guide-frame-neutral','--surface-field',3);
  add('guide child frame boundary','default',theme==='light'?'--neutral-white':'--neutral-black','--guide-frame-neutral',3);
  add('fullscreen title / unselected panel label','default','--preview-label-content','--preview-background',4.5);
  add('fullscreen action outer focus','focus','--preview-label-content','--preview-background',3);
  combinations.push({preset,theme,semanticValues:Object.fromEntries(semanticRoles.map(role=>[role,t[role]])),tokens:t,rows,advisoryRows,minimumTextRatio:Math.min(...rows.filter(row=>row.minimum===4.5).map(row=>row.ratio)),minimumControlRatio:Math.min(...rows.filter(row=>row.minimum===3).map(row=>row.ratio))});
 }
 return {source:'template/header.css (shipped tokens synchronized with approved figma-theme-tokens.json)',semanticRoles,method:'WCAG sRGB relative luminance; (Lmax+0.05)/(Lmin+0.05); no rounding before pass/fail',backgrounds:'Opaque semantic text surfaces. Permanent button borders and native range outlines were removed by explicit user request. Button fill / raw accent contrast is measured separately and is not falsely counted as a passing outline.',limits:['Source role matrix; the opt-in isolated headless browser regression verifies actual CSS bindings separately.','Advisory rows below 3:1 are known fill/adjacent-surface contrast limitations. Labels, position, checks and keyboard focus remain independent cues; full nontext WCAG conformance is not claimed.','Native range rail/thumb painting and OS dialogs are browser-owned; removing artificial outlines preserves the requested native geometry. Raw accent vs field is reported, not a complete native raster measurement.','User media, gradient and broadcast colors are excluded. Approved Figma colors are exact; required contrast failures remain failures.'],combinations};
}
const report=matrix();
test('all twenty user UI palettes preserve essential text 4.5 and focus/position/selection cues 3 without artificial button borders',()=>{
 const failures=report.combinations.flatMap(combination=>combination.rows.filter(row=>row.ratio<row.minimum).map(row=>`${combination.preset}/${combination.theme} ${row.component} ${row.state}: ${row.ratio.toFixed(3)} < ${row.minimum}`));
 assert.deepEqual(failures,[],'Required contrast failures:\n'+failures.join('\n'));
});

test('narrow settings keeps brand and action button dimensions',{skip:!process.env.KMG_THEME_RENDER_URL},async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage();
  await page.goto(new URL('settings.html',process.env.KMG_THEME_RENDER_URL).href);
  await page.waitForSelector('html[data-i18n-ready]');
  for(const width of [1200,760,380,320]){
   await page.setViewportSize({width,height:900});
   const size=await page.evaluate(()=>{const brand=document.querySelector('.app-header .brand h1'),button=document.querySelector('.action-button'),icon=button.querySelector('.button-svg');return {brand:getComputedStyle(brand).fontSize,button:getComputedStyle(button).fontSize,height:button.getBoundingClientRect().height,icon:icon.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth>innerWidth};});
   assert.deepEqual(size,{brand:'32px',button:'20px',height:48,icon:24,overflow:false},`viewport ${width}px`);
  }
 }finally{await browser.close();}
});
test('semantic role aliases and status meaning remain independent of preset',()=>{
 for(const theme of ['light','dark']){
  const reference=tokens('aloe',theme);
  for(const preset of presets){
   const t=tokens(preset,theme);
   for(const [alias,role] of Object.entries({'--page':'--page-background','--field':'--surface-field','--text':'--content-primary','--muted':'--content-secondary','--accent':'--accent-default'}))assert.equal(t[alias],t[role]);
   assert.equal(t['--glass'],theme==='light'?'rgba(0,0,0,.12)':'rgba(255,255,255,.2)');
   assert.equal(t['--line'],theme==='light'?'rgba(0,0,0,.24)':'rgba(255,255,255,.28)');
   for(const status of ['warning','error','success','info'])for(const prefix of ['--status-','--surface-'])assert.equal(t[prefix+status],reference[prefix+status]);
   assert.notEqual(t['--accent-default'],tokens(preset,theme==='light'?'dark':'light')['--accent-default']);
  }
 }
});
function runUI(saved={},blocked=false){
 const store=new Map(Object.entries(saved)),writes=[],removals=[],events={};
 const themeButton={setAttribute(){},addEventListener(name,handler){events['theme-'+name]=handler;}};
 const presetMenu={open:false,addEventListener(name,handler){events['preset-'+name]=handler;},contains(target){return inputs.includes(target);}};
 const presetToggle={focus(){events.focused=true;}};
 const inputs=presets.map(value=>({value,checked:false}));
 const body={dataset:{},style:{removeProperty(name){removals.push('body:'+name);}}};
 const document={body,documentElement:{dataset:{},style:{removeProperty(name){removals.push('root:'+name);}}},addEventListener(name,handler){events['document-'+name]=handler;}};
 const localStorage={getItem(key){if(blocked)throw Error('blocked');return store.get(key)??null;},setItem(key,value){if(blocked)throw Error('blocked');store.set(key,value);writes.push([key,value]);}};
 const header={querySelector(selector){return ({'.accent-presets':presetMenu,'#accent-preset-toggle':presetToggle})[selector];},querySelectorAll(){return inputs;}};
 const script=headerSource();
 vm.runInNewContext(script,{header,document,localStorage,themeButton,window:{}});
 return {store,writes,removals,events,inputs,body,root:document.documentElement,presetMenu};
}
function headerSource(){return header.slice(header.indexOf('  function setTheme('),header.indexOf('  const settingsLink='));}
test('first visit, legacy HEX and unsupported IDs default to Aloe without altering broadcast or legacy data',()=>{
 for(const saved of [{},{'overlay-ui-accent':'#ff0000'},{'overlay-ui-preset':'unsupported'},{'overlay-ui-preset':'#91c9a0'}]){
  const original={...saved,'overlay-config':'preserved broadcast config','other-data':'preserved'};
  const ui=runUI(original);
  assert.equal(ui.body.dataset.uiPreset,'aloe');assert.equal(ui.store.get('overlay-ui-preset'),'aloe');
  assert.equal(ui.store.get('overlay-config'),original['overlay-config']);assert.equal(ui.store.get('other-data'),'preserved');
  assert.equal(ui.store.get('overlay-ui-accent'),saved['overlay-ui-accent']);
  assert.deepEqual(ui.removals,['root:--accent','body:--accent']);
  assert.equal(ui.store.get('overlay-ui-preset-migrated'),'1');
 }
});
test('valid preset survives reload, guide roundtrip and theme changes; migration runs once',()=>{
 for(const value of presets){
  const ui=runUI({'overlay-ui-preset':value,'overlay-ui-theme':'light','overlay-ui-accent':'#ee00ff','overlay-ui-preset-migrated':'1'});
  assert.equal(ui.body.dataset.uiPreset,value);assert.equal(ui.body.dataset.theme,'light');assert.equal(ui.root.dataset.uiPreset,value);assert.equal(ui.root.dataset.theme,'light');assert.deepEqual(ui.removals,['root:--accent','body:--accent']);assert.ok(!ui.writes.some(([key])=>key==='overlay-ui-preset-migrated'));
  ui.events['theme-click']();assert.equal(ui.body.dataset.theme,'dark');assert.equal(ui.root.dataset.theme,'dark');assert.equal(ui.body.dataset.uiPreset,value);
  ui.events['theme-click']();assert.equal(ui.body.dataset.theme,'light');assert.equal(ui.body.dataset.uiPreset,value);
  for(let i=0;i<2;i++){const reloaded=runUI(Object.fromEntries(ui.store));assert.equal(reloaded.body.dataset.uiPreset,value);assert.deepEqual(reloaded.removals,['root:--accent','body:--accent']);assert.ok(!reloaded.writes.some(([key])=>key==='overlay-ui-preset-migrated'));}
  const next=ui.inputs.find(input=>input.value!==value);ui.events['preset-change']({target:next});assert.equal(ui.body.dataset.uiPreset,next.value);assert.equal(ui.root.dataset.uiPreset,next.value);assert.equal(ui.store.get('overlay-ui-preset'),next.value);assert.equal(ui.store.get('overlay-ui-accent'),'#ee00ff');
  ui.presetMenu.open=true;let prevented=false,eventsStopped=false;ui.events['preset-keydown']({key:'Escape',preventDefault(){prevented=true;},stopPropagation(){eventsStopped=true;}});assert.equal(ui.presetMenu.open,false);assert.equal(ui.events.focused,true);assert.equal(prevented,true);assert.equal(eventsStopped,true);
 }
 const blocked=runUI({},true);assert.equal(blocked.body.dataset.uiPreset,'aloe');blocked.events['preset-change']({target:blocked.inputs.find(input=>input.value==='blue')});assert.equal(blocked.body.dataset.uiPreset,'blue');
});
test('chooser uses named native radio controls and keeps broadcast configuration separate',()=>{
 let markup='';vm.runInNewContext(header.split(/\r?\n\r?\n/)[0],{document:{currentScript:{insertAdjacentHTML(_,html){markup=html;}}}});
 assert.doesNotMatch(markup,/id="accent-color"|type="color"/);
 assert.equal((markup.match(/name="ui-accent-preset"/g)||[]).length,10);
 for(const value of presets)assert.match(markup,new RegExp('type="radio" name="ui-accent-preset" value="'+value+'"'));
 assert.match(markup,/<legend[^>]*>UI 색상 프리셋<\/legend>/);assert.match(markup,/class="preset-check" aria-hidden="true">✓/);
 assert.doesNotMatch(headerSource(),/OVERLAY_CONFIG|config\.|removeItem/);
 for(const filename of ['overlay.css','events.js','pack.js','OBS-script.lua'])assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'../template',filename),'utf8'),/overlay-ui-preset|data-ui-preset/);
});

test('all twenty approved Figma palettes match all 21 semantic roles, public aliases and swatches exactly',()=>{
 assert.equal(paletteSource.combinations.length,20);
 assert.deepEqual([...new Set(paletteSource.combinations.map(item=>item.preset))],presets);
 assert.equal(new Set(paletteSource.combinations.map(item=>item.preset+'/'+item.theme)).size,20);
 for(const entry of paletteSource.combinations){
  const t=tokens(entry.preset,entry.theme);
  assert.deepEqual(Object.keys(entry.semanticValues).sort(),[...semanticRoles].sort());
  for(const role of semanticRoles)assert.equal(t[role],entry.semanticValues[role],entry.preset+'/'+entry.theme+' '+role);
  assert.equal(t['--accent'],entry.semanticValues['--accent-default']);assert.equal(t['--swatch-'+entry.preset],entry.semanticValues['--accent-default']);
 }
});
test('the ten named choices preserve order, scrolling and native slider/switch geometry',()=>{
 let markup='';vm.runInNewContext(header.split(/\r?\n\r?\n/)[0],{document:{currentScript:{insertAdjacentHTML(_,html){markup=html;}}}});
 assert.deepEqual([...markup.matchAll(/name="ui-accent-preset" value="([^"]+)"/g)].map(match=>match[1]),presets);
 for(const name of ["체리","오렌지","바나나","라임","알로에","솜사탕","블루베리","포도","풍선껌","모노"])assert.ok(markup.includes('>'+name+'</span>'));
 assert.match(css,/\.accent-preset-option:has\(:checked\)\{background:var\(--surface-accent-subtle\)/);
 assert.match(css,/\.preset-check\{[^}]*color:currentColor\}/);
 assert.match(css,/max-height:calc\(100dvh - 80px\);overflow-y:auto/);
 assert.match(css,/@media\(max-width:920px\)\{\.accent-preset-options\{position:fixed;right:72px;top:72px;/);
 const previewCss=fs.readFileSync(path.join(__dirname,'../template/preview.css'),'utf8');
 assert.match(previewCss,/input\[type=range\]\{width:100%;height:24px;margin:0;padding:0;accent-color:var\(--accent\)\}/);
 assert.doesNotMatch(previewCss,/input\[type=range\]\{[^}]*appearance:none|slider-thumb\{[^}]*(?:width:|height:|appearance:)|translateY\(var\(--space-2\)\)|gradient-edit::before/);
 assert.match(previewCss,/input:is\(\[name=placementSwap\],\[name=sidePosition\]\)/);
 assert.match(previewCss,/panel-hit\[aria-pressed=true\] \.panel-number::after\{content:" ✓"\}/);
});
test('interaction roles really swap fill and ink while native geometry stays free of permanent outlines',()=>{
 for(const preset of presets)for(const theme of ['light','dark']){
  const t=tokens(preset,theme);
  assert.equal(t['--accent-hover'],t['--content-on-accent']);assert.equal(t['--content-on-accent-hover'],t['--accent-default']);
  assert.equal(t['--accent-pressed'],t['--content-on-accent']);assert.equal(t['--content-on-accent-pressed'],t['--accent-default']);
  assert.ok(contrast(tokens(preset,'light')['--page-background'],tokens(preset,'dark')['--page-background'])>=7,'approved light/dark backgrounds must remain visibly distinct');
  assert.ok(luminance(tokens(preset,'light')['--page-background'])>luminance(tokens(preset,'dark')['--page-background']),'light page must be brighter than dark page');
 }
 const previewCss=fs.readFileSync(path.join(__dirname,'../template/preview.css'),'utf8');
 assert.doesNotMatch(previewCss,/slider-(?:thumb|runnable-track)\{|moz-range-(?:thumb|track)\{|background-image:linear-gradient\(45deg/);
 assert.match(previewCss,/panel-hit\[aria-pressed=true\],\.panel-hit:hover\{outline:3px solid var\(--accent-default\);outline-offset:0/);
 const guideCss=fs.readFileSync(path.join(__dirname,'../template/guide-layout.css'),'utf8');
 assert.match(guideCss,/\.step-card \.step-content code,[^{}]*kbd[^{}]*\{background:var\(--accent-default\);color:var\(--content-on-accent\)\}/);
 assert.doesNotMatch(guideCss.replace(/\/\*[\s\S]*?\*\//g,''),/strong[^{}]*\{background:/);
});

// Optional real cascade regression: isolated headless Chrome, with no user-window input.
test('rendered settings and three guides bind theme/preset backgrounds, inverse hover and borderless native controls',{skip:!process.env.KMG_THEME_RENDER_URL},async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const color=hex=>'rgb('+hex.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')+')';
  for(const filename of ['settings.html','guide.html','guide-en.html','guide-ja.html']){
   await page.goto(new URL(filename,process.env.KMG_THEME_RENDER_URL).href);await page.waitForSelector('html[data-i18n-ready]');
   for(const preset of presets)for(const theme of ['light','dark']){
    await page.evaluate(({preset,theme})=>{document.body.dataset.uiPreset=preset;document.documentElement.dataset.uiPreset=preset;document.body.dataset.theme=theme;document.documentElement.dataset.theme=theme;for(const input of document.querySelectorAll('input[name="ui-accent-preset"]'))input.checked=input.value===preset;},{preset,theme});
    const t=tokens(preset,theme);
    const backgrounds=await page.evaluate(()=>[getComputedStyle(document.body).backgroundColor,getComputedStyle(document.documentElement).backgroundColor,getComputedStyle(document.querySelector('.glass-card,.step-card')).backgroundColor]);
    assert.deepEqual(backgrounds,[color(t['--page-background']),color(t['--page-background']),theme==='light'?'rgba(0, 0, 0, 0.12)':'rgba(255, 255, 255, 0.2)'],filename+' '+preset+'/'+theme+' actual backgrounds');
    if(filename==='settings.html'){
     const controls=await page.evaluate(()=>{const sw=document.querySelector('input[name=placementSwap]');return {divider:getComputedStyle(document.querySelector('.divider')).display,rail:getComputedStyle(sw).backgroundColor,thumb:getComputedStyle(sw,'::before').backgroundColor,marks:getComputedStyle(document.querySelector('.size-ratio-marks')).color,gap:getComputedStyle(document.querySelector('.property-row--count .size-controls')).gap};});
     assert.deepEqual(controls,{divider:'block',rail:color(t['--content-primary']),thumb:color(t['--surface-field']),marks:color(t['--accent-default']),gap:'4px'},filename+' '+preset+'/'+theme+' borderless controls');
     const side=page.locator('.panel-hit[data-hit=translation]');await side.hover();
     assert.deepEqual(await side.evaluate(el=>({color:getComputedStyle(el).outlineColor,offset:getComputedStyle(el).outlineOffset})),{color:color(t['--accent-default']),offset:'0px'},'Side hover outline uses preset accent outside the tile');
     await page.mouse.move(0,800);
    }
    const button=page.locator(filename==='settings.html'?'.action-button':'#theme-toggle').first();
    await page.mouse.move(0,800);
    const before=await button.evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor==='rgba(0, 0, 0, 0)'?getComputedStyle(el.closest('.app-header')).backgroundColor:s.backgroundColor,color:s.color,border:s.borderTopWidth};});
    await button.hover();
    const hover=await button.evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,color:s.color,border:s.borderTopWidth};});
    assert.equal(hover.background,before.color);assert.equal(hover.color,before.background);assert.equal(hover.border,'0px');assert.equal(before.border,'0px');
    await page.mouse.down();
    const pressed=await button.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color}));
    assert.deepEqual(pressed,{background:before.color,color:before.background});
    await page.mouse.move(0,800);await page.mouse.up();
    const headerButton=page.locator('#theme-toggle');await headerButton.hover();
    assert.deepEqual(await headerButton.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color})),{background:color(t['--content-on-accent']),color:color(t['--accent-default'])});
    await page.mouse.move(0,800);

    await page.locator('.accent-presets').evaluate(el=>el.open=true);
    for(const choice of [presets.find(value=>value!==preset),preset]){
     await page.locator('.accent-presets').evaluate(el=>el.open=true);
     const option=page.locator('.accent-preset-option').filter({has:page.locator('input[value="'+choice+'"]')});
     await page.mouse.move(0,800);
     const beforeOption=await option.evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor==='rgba(0, 0, 0, 0)'?getComputedStyle(el.closest('fieldset')).backgroundColor:s.backgroundColor,color:s.color};});
     await option.hover();
     assert.deepEqual(await option.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color})),{background:beforeOption.color,color:beforeOption.background},'preset '+choice+' exact actual inverse');
     await page.mouse.down();
     assert.deepEqual(await option.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color})),{background:beforeOption.color,color:beforeOption.background},'preset '+choice+' pressed inverse');
     await page.mouse.move(0,800);await page.mouse.up();
    }
    await page.locator('.accent-presets').evaluate(el=>el.open=false);
    if(filename!=='settings.html'){
     const highlight=await page.locator('.step-content code').first().evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color}));
     assert.deepEqual(highlight,{background:color(t['--accent-default']),color:color(t['--content-on-accent'])});
     const card=page.locator('.faq-item').first(),faq=card.locator('summary');
     await card.evaluate(el=>el.open=false);
     const beforeFAQ=await card.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color}));
     await faq.hover();
     assert.deepEqual(await card.evaluate(el=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color})),{background:beforeFAQ.color,color:color(t['--surface-card'])});
     if(preset==='aloe'&&theme==='dark'){
      await faq.click();
      assert.equal(await card.evaluate(el=>el.open),true);
      await card.locator('.faq-body').click();
      assert.equal(await card.evaluate(el=>el.open),false,'FAQ body click closes the whole card');
     }
     await page.mouse.move(0,800);
    }
   }
   if(filename==='settings.html'){
    const range=await page.locator('input[type=range]').first().evaluate(el=>{document.activeElement?.blur();el.blur();return {height:getComputedStyle(el).height,outlineStyle:getComputedStyle(el).outlineStyle,focusVisible:el.matches(':focus-visible')};});
    assert.deepEqual(range,{height:'24px',outlineStyle:'none',focusVisible:false});
    await page.locator('#theme-toggle').click();
    assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),await page.evaluate(()=>document.body.dataset.theme));
    assert.deepEqual(await page.evaluate(()=>({pointer:document.querySelector('.app-header').classList.contains('pointer-focus'),outline:getComputedStyle(document.querySelector('#theme-toggle')).outlineStyle})),{pointer:true,outline:'none'},'pointer click has no focus box');
    await page.keyboard.press('Tab');
    assert.deepEqual(await page.evaluate(()=>({pointer:document.querySelector('.app-header').classList.contains('pointer-focus'),visible:document.activeElement.matches(':focus-visible'),outline:getComputedStyle(document.activeElement).outlineStyle})),{pointer:false,visible:true,outline:'solid'},'Tab restores keyboard focus box');
    await page.locator('.panel-hit[data-hit=custom2]').click();
    const select=await page.locator('.property-row--size select[name=panelWidthMode]').evaluate(el=>{
     const row=el.closest('.property-row'),shell=el.closest('.select-shell');
     const arrow=shell.querySelector('svg.lucide-chevron-down');
     const right=element=>element.getBoundingClientRect().right;
     return {appearance:getComputedStyle(el).appearance,arrow:arrow&&{name:arrow.getAttribute('data-lucide'),path:arrow.querySelector('path')?.getAttribute('d'),rightInset:right(shell)-right(arrow)+arrow.getBoundingClientRect().width/4},pseudo:getComputedStyle(shell,'::after').content,rowInset:right(row)-right(el),shellOffset:right(shell)-right(el)};
    });
    assert.equal(select.appearance,'none');
    assert.equal(select.arrow?.name,'chevron-down');
    assert.equal(select.arrow.path,'m6 9 6 6 6-6');
    assert.ok(select.arrow.rightInset>=16&&select.arrow.rightInset<=20,'Lucide arrow is visibly inset about 18px');
    assert.equal(select.pseudo,'none','selector has no CSS-drawn arrow');
    assert.ok(Math.abs(select.rowInset-8)<1,'selector retains the row’s 8px outer inset');
    assert.ok(Math.abs(select.shellOffset)<1,'arrow wrapper does not move the selector');
    await page.locator('[name=panelWidthMode]').selectOption('fixed');
    const snap=await page.locator('[data-fixed-size=width]').evaluate(el=>({labels:[...el.querySelectorAll('[data-ratio-marks] span')].map(node=>[node.textContent,node.style.left]),dots:el.querySelectorAll('[data-snap-points] span').length}));
    assert.ok(snap.labels.some(([label])=>label==='16:9'),'16:9 snap is in the available width range');
    assert.equal(snap.dots,0,'the slider has no white snap dots');
    const cards=await page.locator('.settings-card').evaluateAll(els=>els.map(el=>({height:el.getBoundingClientRect().height,scroll:el.scrollHeight})));
    assert.ok(cards[1].height<cards[2].height,'settings cards keep their own content height');
    assert.ok(cards.every(card=>card.scroll<=card.height+1),'content is not clipped by a fixed card height');
    const globalFill=page.locator('.global-card details.property-section').filter({has:page.locator('summary').filter({hasText:'패널 채우기'})}).first();
    const heading=globalFill.locator('summary h4');
    assert.equal(await heading.textContent(),'패널 채우기');
    assert.deepEqual(await globalFill.locator('summary').evaluate(el=>({justify:getComputedStyle(el).justifyContent,gap:getComputedStyle(el).gap,chevron:getComputedStyle(el,'::after').content})),{justify:'flex-start',gap:'12px',chevron:'""'},'heading and chevron stay adjacent');
    const beforeCollapse=await page.locator('.global-card').evaluate(el=>el.getBoundingClientRect().height);
    await heading.click();
    assert.equal(await globalFill.evaluate(el=>el.open),false);
    assert.ok(await page.locator('.global-card').evaluate(el=>el.getBoundingClientRect().height)<beforeCollapse,'closing fill reduces the card height');
   }
  }
 }finally{await browser.close();}
});
if(process.env.KMG_THEME_REPORT){fs.writeFileSync(process.env.KMG_THEME_REPORT,JSON.stringify(report,null,2)+'\n');console.log('Contrast source matrix: '+process.env.KMG_THEME_REPORT);}
