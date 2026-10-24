const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const events=require('../template/events.js');
const source=fs.readFileSync(path.join(__dirname,'../template/preview.js'),'utf8');
const keys=events.allPanelKeys;
function normalizeHarness(platform='Windows'){
 const publicContext={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../template/config.public.js'),'utf8'),publicContext);
 const defaults=structuredClone(publicContext.window.OVERLAY_PUBLIC_CONFIG);
 const context={defaults,keys,window:{},OverlayEvents:events,structuredClone,initialPlacement:events.defaultPlacement(),panelGroups:{sub:events.bentoPanelKeys.slice(1,4),side:events.bentoPanelKeys.slice(4)},freshSmoothing:platform==='Mac'?.6:0};
 const start=source.indexOf('  const defaultStyle='),end=source.indexOf('  function restoredSettings(',start);
 vm.runInNewContext(source.slice(start,end)+'\nthis.normalizeConfig=normalize;',context);
 return {normalize:input=>JSON.parse(JSON.stringify(context.normalizeConfig(input))),defaults};
}
test('Overlap reload normalizes saved panel counts to prefix rows and keeps both snapshots',()=>{
 const {normalize}=normalizeHarness();
 const input=events.switchLayoutPreset({layoutVersion:4,panelContent:Object.fromEntries(keys.map(key=>[key,{type:'source',url:''}]))},'overlap');
 input.panelEnabled=Object.fromEntries(events.overlapPanelKeys.map((key,index)=>[key,index%2===0]));input.panelEnabled.game=true;
 input.layoutPresets=events.normalizeLayoutPresets(input);
 const restored=normalize(input);
 assert.deepEqual(restored.panelEnabled,events.normalizeOverlapEnabled(input.panelEnabled));
 assert.deepEqual(restored.layoutPresets.bento,input.layoutPresets.bento);
 assert.deepEqual(restored.layoutPresets.overlap.panelEnabled,events.normalizeOverlapEnabled(input.panelEnabled));
});
test('preset-only saved configuration restores active snapshot before public defaults',()=>{
 const {normalize}=normalizeHarness();
 const layouts=events.normalizeLayoutPresets({layoutMode:'overlap',panelGap:48,overlapPlacement:{panel4_1:{column:1,row:2,columnSpan:2,rowSpan:1}}});
 const restored=normalize({layoutVersion:4,layoutMode:'overlap',layoutPresets:layouts});
 assert.equal(restored.panelGap,48);
 assert.deepEqual(restored.overlapPlacement.panel4_1,{column:4,row:1,columnSpan:1,rowSpan:1});
 assert.deepEqual(restored.layoutPresets.overlap.overlapPlacement.panel4_1,layouts.overlap.overlapPlacement.panel4_1);
});
test('saved smoothing wins over OS defaults in both directions',()=>{
 for(const platform of ['Windows','Mac'])for(const cornerSmoothing of [0,.6,1]){
  const {normalize}=normalizeHarness(platform),restored=normalize({layoutVersion:4,cornerSmoothing});
  assert.equal(restored.cornerSmoothing,cornerSmoothing);
 }
 for(const platform of ['Windows','Mac']){const h=normalizeHarness(platform);assert.equal(h.normalize(h.defaults).cornerSmoothing,platform==='Mac'?.6:0);}
});
test('chooser returns to each independent layout while preserving shared content and styles',()=>{
 const elements=new Map(),choices=['bento','overlap'].map(mode=>({dataset:{layoutChoice:mode}})),sections=[{hidden:true},{hidden:true}];
 const byId=id=>{if(!elements.has(id))elements.set(id,{focus(){},addEventListener(){},querySelectorAll:()=>choices,querySelector:()=>({textContent:""})});return elements.get(id);};
 const config=events.switchLayoutPreset({layoutVersion:4,panelGap:48,panelContent:{game:{type:'source',url:''}},globalStyle:{fill:{color:'#abcdef'}}},'bento');
 const context={window:{location:{href:'file:///settings.html'}},uploadStorage:{flush:async()=>{}},config,selected:'chat',draftReady:true,OverlayEvents:events,byId,reset(){},readEditor(){},readGlobal(){},renderGlobal(){},renderPlacement(){},renderEditor(){},localized:value=>value,requestAnimationFrame:fn=>fn(),syncHitAreaScale(){},apply(){},document:{querySelectorAll:()=>sections},current(){context.config.layout=events.resolveConfigLayout(context.config);context.config.layoutPresets=events.normalizeLayoutPresets(context.config);return structuredClone(context.config);}};
 const start=source.indexOf("  byId('reset').onclick=reset;"),end=source.indexOf("  const fullscreenButton=",start);
 vm.runInNewContext(source.slice(start,end),context);
 byId('change-layout').onclick();assert.equal(byId('layout-chooser').hidden,false);
 choices[1].onclick();assert.equal(context.config.layoutMode,'overlap');assert.equal(context.config.panelGap,24);
 assert.ok(sections.every(section=>!section.hidden));assert.equal(context.selected,null);
 context.config.panelGap=8;
 byId('change-layout').onclick();choices[0].onclick();assert.equal(context.config.panelGap,48);
 choices[1].onclick();assert.equal(context.config.panelGap,8);
 assert.deepEqual(context.config.panelContent,config.panelContent);assert.deepEqual(context.config.globalStyle,config.globalStyle);
});
test('rendered package chooser, sixteen-panel switching, restore and ZIP export preserve both presets',{skip:!process.env.KMG_THEME_RENDER_URL},async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({locale:'ko-KR',viewport:{width:1440,height:1000},acceptDownloads:true});
  const failures=[];page.on('pageerror',error=>failures.push(error.message));await page.addInitScript(()=>{window.showSaveFilePicker=undefined;});
  await require('./helpers/expanded-sections.cjs')(page);await page.goto(new URL('settings.html',process.env.KMG_THEME_RENDER_URL).href);
  assert.equal(await page.locator('#layout-chooser').isVisible(),true);assert.equal(await page.locator('.settings-section').isVisible(),false);
  assert.equal(await page.locator('.preset-thumbnail--overlap i').count(),15);assert.equal(await page.locator('.preset-thumbnail--overlap .safety-cell--red').count(),6);assert.equal(await page.locator('.preset-thumbnail--overlap .safety-cell--yellow').count(),5);
  const choose=async mode=>{await page.locator(`[data-layout-choice=${mode}]`).click();await page.waitForFunction(mode=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.layoutMode===mode,mode);};
  const persisted=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('obs-overlay-config')));
  const setRange=async(name,index)=>{const slider=page.locator(`[name=${name}]`);await slider.evaluate((el,value)=>{el.value=String(value);},index);await slider.dispatchEvent('input');};
  await page.screenshot({path:path.join(__dirname,'../.qa-private/0.10.0/entry.png'),fullPage:true});await choose('overlap');
  await page.waitForFunction(()=>document.querySelectorAll('.panel-hit').length===16);
  assert.equal(await page.locator('[name=overlapPanel]').count(),0);
  assert.equal(await page.locator('[name^=overlap-]').count(),0);
  await page.screenshot({path:path.join(__dirname,'../.qa-private/0.10.0/overlap-default.png'),fullPage:true});
  for(let column=1;column<=5;column++)await setRange('overlapColumn'+column+'Count',3);
  await page.waitForFunction(()=>document.querySelectorAll('.panel-hit').length===16);
  assert.equal(await page.locator('.panel-hit').count(),16);assert.equal(await page.locator('#event-target').count(),0);assert.equal(await page.locator('[data-panel-enabled]').count(),0);assert.equal(await page.locator('[data-overlap-column]').count(),5);
  assert.equal(await page.locator('#overlap-safety-guide .safety-cell').count(),15);assert.equal(await page.locator('#overlap-safety-guide .safety-cell--red').count(),6);
  const initial=await persisted();assert.deepEqual(initial.layout.game,{x:0,y:0,width:1920,height:1080});assert.equal(Object.keys(initial.layout).length,16);
  for(const key of events.overlapPanelKeys.slice(1)){assert.ok(initial.panelContent[key]);assert.ok(initial.panelShadows[key]===0);assert.ok(initial.panelEnabled[key]);}
  for(const key of events.overlapPanelKeys.slice(1)){await page.locator(`[data-hit=${key}] .panel-number`).click();await page.locator('[name=panelPositionMode]').uncheck();}
  await setRange('panelGap',4);await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.panelGap===48);await setRange('cornerRadius',4);await setRange('cornerSmoothing',1);
  for(const [key,warning] of [['panel1_1','빨간 영역'],['panel2_2','노란 영역']]){await page.locator(`.panel-hit[data-hit=${key}] .panel-number`).click();assert.match(await page.locator('#overlap-warning').textContent(),new RegExp(warning));}
  await page.locator('.panel-hit[data-hit=panel2_3] .panel-number').click();
  assert.equal(await page.locator('[name=panelHeightMode]').isChecked(),true);
  assert.equal(await page.locator('[name=panelWidthMode]').count(),0,'column width stays canonical');
  await page.locator('[name=panelHeightMode]').check();
  await page.locator('[name=panelHeight]').fill('200');await page.locator('[name=panelHeight]').dispatchEvent('change');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.overlapSizing?.panel2_3?.height===200);
  assert.equal(await page.locator('[name=panelHeightSlider]').inputValue(),'200');
  await page.locator('[name=panelContentType]').selectOption('source');await page.locator('[name=regionOverride]').check();await page.locator('[name=panelShadowEnabled]').check();await setRange('panelShadow',4);
  const childCounts=await page.locator('.panel-hit').evaluateAll(hits=>hits.map(hit=>[hit.querySelectorAll('.hit-surface').length,hit.querySelectorAll('.hit-outline').length]));assert.ok(childCounts.every(([surface,outline])=>surface===1&&outline===1));
  await page.locator('.panel-hit[data-hit=panel5_3] .panel-number').click();await page.locator('[name=panelContentType]').selectOption('web');await page.locator('[name=panelContentUrl]').fill('https://example.invalid/panel5-3');await page.locator('[name=panelContentUrl]').dispatchEvent('change');await setRange('overlapColumn5Count',2);
  assert.equal(await page.locator('.panel-hit').count(),15);
  await page.locator('#change-layout').click();await choose('bento');assert.equal((await persisted()).panelGap,32);assert.equal(await page.locator('.panel-hit').count(),7);
  await setRange('panelGap',1);await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.panelGap===16);await page.locator('#change-layout').click();await choose('overlap');
  const active=await persisted();assert.equal(active.panelGap,48);assert.deepEqual(active.overlapPlacement.panel2_3,{column:2,row:3,columnSpan:1,rowSpan:1});assert.deepEqual(active.overlapSizing.panel2_3,{heightMode:'fixed',height:200});assert.equal(active.layout.panel2_3.height,200);assert.deepEqual(events.overlapCollisions(active.layout,active.panelEnabled),[]);assert.equal(active.panelContent.panel2_3.type,'source');assert.equal(active.panelShadows.panel2_3,64);assert.equal(active.panelContent.panel5_3.url,'https://example.invalid/panel5-3');assert.equal(active.panelEnabled.panel5_3,false);
  await page.reload();assert.equal(await page.locator('#layout-chooser').isVisible(),true);await choose('overlap');const reloaded=await persisted();
  assert.deepEqual(reloaded.layoutPresets.bento,active.layoutPresets.bento);for(const field of ['panelGap','panelEnabled','panelPlacement','sidePosition','overlapPlacement','overlapSizing'])assert.deepEqual(reloaded.layoutPresets.overlap[field],active.layoutPresets.overlap[field]);assert.deepEqual(reloaded.panelContent,active.panelContent);
  const downloadPromise=page.waitForEvent('download');await page.locator('#bundle').click();const download=await downloadPromise,bytes=fs.readFileSync(await download.path()),entries={};let offset=0;
  while(bytes.readUInt32LE(offset)===0x04034b50){const size=bytes.readUInt32LE(offset+18),nameLength=bytes.readUInt16LE(offset+26),extraLength=bytes.readUInt16LE(offset+28),name=bytes.subarray(offset+30,offset+30+nameLength).toString(),start=offset+30+nameLength+extraLength;entries[name]=bytes.subarray(start,start+size);offset=start+size;}
  const exported=JSON.parse(entries['files/overlap/obs-settings.json'].toString());assert.equal(exported.layoutMode,'overlap');assert.equal(exported.layoutPresets.bento.panelGap,16);assert.equal(exported.layoutPresets.overlap.panelGap,48);assert.equal(Object.keys(exported.panelContent).length,22);assert.equal(Object.keys(exported.layout).length,16);assert.equal(exported.cornerRadius,48);assert.equal(exported.cornerSmoothing,.6);assert.deepEqual(exported.overlapSizing.panel2_3,{heightMode:'fixed',height:200});assert.equal(exported.layout.panel2_3.height,200);assert.equal(exported.panelShadows.panel2_3,64);assert.equal(exported.panelContent.panel5_3.url,'https://example.invalid/panel5-3');assert.equal(exported.panelEnabled.panel5_3,false);
  assert.ok(entries['script-overlap.lua']);assert.equal(entries['OBS-script.lua'],undefined);assert.equal(Object.keys(entries).filter(name=>name.endsWith('-alpha-mask.png')).length,16);for(const key of events.overlapPanelKeys){assert.ok(entries[`files/overlap/assets/${key}-alpha-mask.png`]);assert.equal(entries[`assets/${key}-alpha-mask.png`],undefined);}
  const maskResult=await page.evaluate(async({mask,box,radius,smoothing})=>{const bitmap=await createImageBitmap(new Blob([new Uint8Array(mask)],{type:'image/png'})),canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);const data=ctx.getImageData(0,0,1920,1080).data,p=new Path2D(KMGPanelShape.path(box.width,box.height,radius,smoothing));let checked=0,mismatch=0;for(let y=Math.floor(box.y)-2;y<box.y+radius*2;y+=3)for(let x=Math.floor(box.x)-2;x<box.x+radius*2;x+=3){const alpha=data[(y*1920+x)*4+3];if(alpha>0&&alpha<255)continue;const inside=ctx.isPointInPath(p,x+.5-box.x,y+.5-box.y);if((alpha===255)!==inside)mismatch++;checked++;}return {checked,mismatch,center:data[(Math.floor(box.y+box.height/2)*1920+Math.floor(box.x+box.width/2))*4+3],origin:data[3]};},{mask:[...entries['files/overlap/assets/panel2_3-alpha-mask.png']],box:exported.layout.panel2_3,radius:exported.cornerRadius,smoothing:exported.cornerSmoothing});
  assert.ok(maskResult.checked>100);assert.equal(maskResult.mismatch,0);assert.equal(maskResult.center,255);assert.equal(maskResult.origin,0);
  // The settings ZIP is OBS-only. Emulate its documented Lua runtime-install
  // and generated config.js stages, then reopen its actual overlay via HTTP.
  const extracted=process.env.KMG_PRESET_EXPORT_DIR||path.join(__dirname,'../.qa-private/0.10.0/preset-export');fs.mkdirSync(extracted,{recursive:true});fs.writeFileSync(path.join(extracted,'../preset-export.zip'),bytes);
  const write=(name,data)=>{assert.ok(!name.includes('..')&&!path.isAbsolute(name)&&!name.includes('\\'));const target=path.join(extracted,name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);};
  for(const [name,data] of Object.entries(entries))write(name,data);assert.equal(entries['settings.html'],undefined);
  let installed=0;const lua=entries['script-overlap.lua'].toString(),pattern=/do local f=assert\(io.open\(script_path\(\)\.\.'([^']+)', 'wb'\)\);assert\(f:write\(\[(=*)\[([\s\S]*?)\]\2\]\)\);assert\(f:close\(\)\) end/g;
  for(const match of lua.matchAll(pattern)){write('files/overlap/'+match[1],match[3]);installed++;}assert.ok(installed>5);write('files/overlap/config.js','window.OVERLAY_CONFIG = '+JSON.stringify(exported)+';\n');
  const http=require('node:http'),mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png','.css':'text/css'},server=http.createServer((req,res)=>{const requested=new URL(req.url,'http://localhost').pathname.slice(1),target=path.resolve(extracted,requested||'overlay.html');if(!target.startsWith(extracted+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);res.end();return;}res.writeHead(200,{'content-type':mime[path.extname(target)]||'application/octet-stream'});res.end(fs.readFileSync(target));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const reopened=await browser.newContext({viewport:{width:1920,height:1080}});try{const restoredPage=await reopened.newPage();restoredPage.on('pageerror',error=>failures.push(error.message));await restoredPage.goto(`http://127.0.0.1:${server.address().port}/files/overlap/overlay.html?preview=1`);await restoredPage.waitForFunction(()=>window.Overlay&&window.OverlayEvents);assert.deepEqual(await restoredPage.evaluate(()=>window.OVERLAY_CONFIG),exported);assert.equal(await restoredPage.locator('.overlay section[data-region^=panel]').count(),15);}finally{await reopened.close();await new Promise(resolve=>server.close(resolve));}
  assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});
