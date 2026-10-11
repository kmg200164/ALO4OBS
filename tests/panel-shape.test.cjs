const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const shape=require('../template/panel-shape.js');
const events=require('../template/events.js');
const gradient=require('../template/gradient.js');

function documentMock(){
 const nodes=[];
 function node(tag){
  const item={tag,style:{setProperty(key,value){this[key]=value;}},dataset:{},attributes:{},children:[],className:'',
   setAttribute(key,value){this.attributes[key]=value;},append(...items){this.children.push(...items);},prepend(...items){this.children.unshift(...items);},
   replaceChildren(...items){this.children=items;},addEventListener(){},closest(){return null;},
   querySelector(selector){return this.children.find(child=>'.'+child.className===selector)||null;}};
  nodes.push(item);return item;
 }
 const canvas=node('main');
 return {canvas,nodes,body:{dataset:{}},getElementById(){return canvas;},createElement:node,createElementNS(namespace,tag){return node(tag);}};
}
test('Figma smoothing choices stay finite at all radius presets and small-panel boundaries',()=>{
 const curves=new Set();
 for(const radius of [8,16,24,32,48])for(const smoothing of [0,.6,1]){
  const d=shape.path(292,240,radius,smoothing);assert.doesNotMatch(d,/NaN|Infinity|undefined/);
  assert.match(d,/^M /);assert.match(d,/ Z$/);curves.add(d);
  for(const [width,height] of [[20,12],[1,1],[0,0],[1920,1080]])assert.doesNotMatch(shape.path(width,height,radius,smoothing),/NaN|Infinity/);
 }
 assert.equal(curves.size,15,'every visible choice has distinct geometry on the Figma sample size');
 assert.equal(shape.path(200,100,0,1),'M 0 0 H 200 V 100 H 0 Z');
 assert.equal(shape.path(20,12,48,1),shape.path(20,12,6,1),'oversized corners obey half-short-side boundary');
 assert.equal(shape.path(292,240,16,.6),'M 266.4 0 c 8.9608 0 13.4413 0 16.8638 1.7439 a 16.0000 16.0000 0 0 1 6.9923 6.9923 c 1.7439 3.4226 1.7439 7.9030 1.7439 16.8638 L 292 214.4 c 0 8.9608 0 13.4413 -1.7439 16.8638 a 16.0000 16.0000 0 0 1 -6.9923 6.9923 c -3.4226 1.7439 -7.9030 1.7439 -16.8638 1.7439 L 25.6 240 c -8.9608 0 -13.4413 0 -16.8638 -1.7439 a 16.0000 16.0000 0 0 1 -6.9923 -6.9923 c -1.7439 -3.4226 -1.7439 -7.9030 -1.7439 -16.8638 L 0 25.6 c 0 -8.9608 0 -13.4413 1.7439 -16.8638 a 16.0000 16.0000 0 0 1 6.9923 -6.9923 c 3.4226 -1.7439 7.9030 -1.7439 16.8638 -1.7439 Z');
});
test('one shared curve controls clip and strictly exterior stroke/shadow',()=>{
 const doc=documentMock(),style={radius:24,smoothing:.6,shadow:32,stroke:{mode:'solid',width:8,color:'#abcdef'}},d=shape.path(292,240,24,.6);
 const panel=doc.createElement('section');shape.apply(panel,292,240,style);
 assert.equal(panel.style.clipPath,"path('"+d+"')");assert.equal(panel.style.border,'0');assert.equal(panel.style.outline,'0');
 const stroke=shape.strokeNode(292,240,style,doc),shadow=shape.shadowNode(292,240,style,doc);
 const paths=doc.nodes.filter(node=>node.tag==='path');assert.ok(paths.every(node=>node.attributes.d===d));
 const ring=stroke.children[0].children[0];
 assert.equal(ring.children[0].attributes['stroke-width'],'16','centered double-width stroke produces requested outward width');
 assert.equal(ring.children[1].attributes.fill,'#000000','the mask removes the entire inside of the panel');
 const exterior=shadow.children[0].children[1];
 assert.equal(exterior.children[1].attributes.fill,'#000000','shadow is removed from panel interior');
 assert.equal(shadow.children[0].children[0].children[1].attributes.dy,'0');assert.equal(shadow.children[1].children[0].attributes['fill-opacity'],'0.25');
 assert.equal(shadow.style.left,'-96px');assert.equal(shadow.style.top,'-96px');
 assert.equal(shape.strokeNode(200,100,{stroke:{mode:'none'}},doc),null);
 assert.equal(shape.shadowNode(200,100,{shadow:0},doc),null);
});
test('legacy defaults and regional stroke choices survive without mutating config',()=>{
 const config={cornerRadius:32,cornerSmoothing:.6,panelShadows:{chat:48},globalStyle:{stroke:{mode:'solid',width:6,color:'#123456'}},regionStyleOverrides:{chat:true},regionBackgrounds:{chat:{stroke:{mode:'gradient',width:4,color:'#abcdef'}}}};
 const before=JSON.stringify(config),chat=shape.styleFor(config,'chat');
 assert.equal(chat.radius,32);assert.equal(chat.smoothing,.6);assert.equal(chat.shadow,48);assert.equal(chat.stroke.mode,'gradient');
 assert.equal(shape.styleFor(config,'game').stroke.color,'#123456');assert.equal(JSON.stringify(config),before);
 assert.equal(shape.styleFor({},'game').radius,16);assert.equal(shape.styleFor({},'game').smoothing,0);
 const game=shape.styleFor({...config,layoutMode:'overlap',panelShadows:{game:64}},'game');
 assert.equal(game.radius,0);assert.equal(game.shadow,0);assert.equal(game.stroke.mode,'none');
});
test('OBS fill/frame use resolved preset boxes and the identical shape path; full-screen Main has no fill',()=>{
 const config={layoutVersion:4,layoutMode:'overlap',cornerRadius:32,cornerSmoothing:.6,panelShadows:{panel4_1:32},regionStyleOverrides:{panel4_1:true},globalStyle:{fill:{mode:'solid',color:'#ffffff',opacity:20},stroke:{mode:'solid',color:'#ff0000',width:4}},regionBackgrounds:{},panelEnabled:Object.fromEntries(events.overlapPanelKeys.map(key=>[key,true]))};
 function render(mode){
  const doc=documentMock();doc.body.dataset.mode=mode;
  const context={document:doc,OverlayEvents:events,window:{OVERLAY_CONFIG:config,KMGPanelShape:shape,KMGGradient:gradient},innerWidth:1920,innerHeight:1080,addEventListener(){}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../template/background.js'),'utf8'),context);return doc;
 }
 const fill=render('fill'),frame=render('frame'),box=events.resolveConfigLayout(config).panel4_1;
 assert.equal(fill.canvas.children.filter(node=>node.dataset.region&&node.style.display==='block').length,15);
 assert.equal(frame.canvas.children.filter(node=>node.dataset.region&&node.style.display==='block').length,16);
 for(const key of events.bentoPanelKeys.slice(1)){
  assert.equal(fill.canvas.children.find(node=>node.dataset.region===key).style.display,'none');
  assert.equal(frame.canvas.children.find(node=>node.dataset.region===key).style.display,'none');
 }
 const tile=fill.canvas.children.find(node=>node.dataset.region==='panel4_1'),stroke=frame.canvas.children.find(node=>node.dataset.region==='panel4_1');
 assert.equal(tile.style.left,box.x+'px');assert.equal(tile.style.clipPath,"path('"+shape.path(box.width,box.height,32,.6)+"')");
 assert.equal(stroke.style.outline,'0');assert.equal(stroke.children[0].children[0].children[0].children[0].attributes.d,shape.path(box.width,box.height,32,.6));
 assert.equal(fill.canvas.children.find(node=>node.dataset.region==='game').style.display,'none');
 assert.equal(frame.canvas.children.find(node=>node.dataset.region==='game').children.length,0);
 const shadows=fill.canvas.children.find(node=>node.className==='panel-shadow-layer');assert.equal(shadows.children.length,1);
});

test('Chrome paints exterior strokes/shadows and respects smoothed content hit boundaries',async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:450}});
  await page.setContent('<body style="margin:0;background:#dfe3e7"><div id="stage" style="position:relative;width:1100px;height:450px"></div></body>');
  await page.addScriptTag({path:require.resolve('../template/gradient.js')});
  await page.addScriptTag({path:require.resolve('../template/panel-shape.js')});
  const result=await page.evaluate(async()=>{
   const shape=window.KMGPanelShape;
   async function pixels(svg,points){
    svg=svg.cloneNode(true);svg.removeAttribute('style');const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));await image.decode();
    const canvas=document.createElement('canvas');canvas.width=Number(svg.getAttribute('width'));canvas.height=Number(svg.getAttribute('height'));
    const context=canvas.getContext('2d');context.drawImage(image,0,0);
    return points.map(([x,y])=>Array.from(context.getImageData(x,y,1,1).data));
   }
   const checks=[];
   for(const radius of [8,16,24,32,48])for(const smoothing of [0,.6,1]){
    const svg=shape.strokeNode(292,240,{radius,smoothing,stroke:{mode:'solid',width:4,color:'#ff0000'}});
    checks.push(await pixels(svg,[[150,2],[150,6],[150,120],[2,2]]));
   }
   const shadow=shape.shadowNode(292,240,{radius:32,smoothing:.6,shadow:32});
   const shadowPixels=await pixels(shadow,[[242,216],[242,90]]);
   const stage=document.getElementById('stage');
   const hits=[];
   for(const [index,smoothing] of [0,.6,1].entries()){
    const holder=document.createElement('div');Object.assign(holder.style,{position:'absolute',left:(35+index*355)+'px',top:'80px',width:'292px',height:'240px'});
    const style={radius:48,smoothing,shadow:32,stroke:{mode:'solid',width:4,color:'#3366cc'}};
    holder.append(shape.shadowNode(292,240,style));
    const content=document.createElement('div');content.dataset.panel=index;Object.assign(content.style,{position:'absolute',inset:'0',background:'#ffffff'});
    shape.apply(content,292,240,style);holder.append(content);holder.append(shape.strokeNode(292,240,style));
    const label=document.createElement('span');label.textContent='Smoothing '+Math.round(smoothing*100)+'%';Object.assign(label.style,{position:'absolute',left:'20px',top:'100px',font:'bold 22px Arial',pointerEvents:'none'});content.append(label);
    stage.append(holder);
    hits.push([document.elementFromPoint(36+index*355,81)?.dataset.panel,document.elementFromPoint(181+index*355,200)?.dataset.panel]);
   }
   return {checks,shadowPixels,hits};
  });
  for(const checks of result.checks){assert.deepEqual(checks[0],[255,0,0,255]);assert.equal(checks[1][3],0,'stroke does not intrude inside');assert.equal(checks[2][3],0);assert.equal(checks[3][3],0,'no rectangular stroke at corner');}
  assert.equal(result.shadowPixels[0][3],0,'shadow does not tint panel interior');assert.ok(result.shadowPixels[1][3]>0,'shadow is visible outside');
  for(const [index,hits] of result.hits.entries()){assert.equal(hits[0],undefined);assert.equal(hits[1],String(index));}
  if(process.env.KMG_SHAPE_SCREENSHOT)await page.screenshot({path:process.env.KMG_SHAPE_SCREENSHOT});
 }finally{await browser.close();}
});

test('Overlap preview paints auxiliary fill and shadow above opaque Main media, matching OBS source order',async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const {PNG}=require(process.env.KMG_PNGJS_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  await require('./helpers/expanded-sections.cjs')(page);await page.goto(require('node:url').pathToFileURL(require.resolve('../template/overlay.html')).href+'?preview=1');
  const box=await page.evaluate(async()=>{
   const source=document.createElement('canvas');source.width=source.height=1;const context=source.getContext('2d');context.fillStyle='#0033ff';context.fillRect(0,0,1,1);
   const keys=OverlayEvents.overlapPanelKeys,config={layoutVersion:4,layoutMode:'overlap',panelGap:24,cornerRadius:32,cornerSmoothing:.6,globalShadow:32,panelShadows:{panel4_1:0},panelEnabled:Object.fromEntries(keys.map(key=>[key,['game','panel4_1'].includes(key)])),regionStyleOverrides:{},regionBackgrounds:Object.fromEntries(keys.map(key=>[key,{}])),globalStyle:{background:{mode:'solid',color:'#000000'},fill:{mode:'solid',color:'#ffffff',opacity:50,blur:0},stroke:{mode:'none',width:4,color:'#ffffff'}},panelContent:Object.fromEntries(keys.map(key=>[key,key==='game'?{type:'media',url:source.toDataURL('image/png')}:{type:'none',url:''}]))};
   Overlay.applyConfig(config);await document.querySelector('[data-region=game] .generic-media img').decode();
   return OverlayEvents.resolveConfigLayout(config).panel4_1;
  });
  const image=PNG.sync.read(await page.screenshot()),pixel=(x,y)=>Array.from(image.data.subarray((Math.floor(y)*image.width+Math.floor(x))*4,(Math.floor(y)*image.width+Math.floor(x))*4+4));
  assert.deepEqual(pixel(1900,1000),[0,51,255,255],'opaque Main is still visible outside auxiliary regions');
  const fill=pixel(box.x+40,box.y+80);assert.ok(fill[0]>=126&&fill[0]<=129&&fill[1]>=152&&fill[1]<=154&&fill[2]===255,'50% white auxiliary fill must paint above Main: '+fill);
  const shadow=pixel(box.x-8,box.y+box.height/2);assert.equal(shadow[0],0);assert.ok(shadow[2]<255&&shadow[2]>180,'exterior black shadow must paint above Main: '+shadow);
  if(process.env.KMG_OVERLAP_EFFECTS_SCREENSHOT)await page.screenshot({path:process.env.KMG_OVERLAP_EFFECTS_SCREENSHOT});
 }finally{await browser.close();}
});

test('Chrome renders all 15 independent Overlap panels and switches to Bento without stale content',async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await require('./helpers/expanded-sections.cjs')(page);await page.goto(require('node:url').pathToFileURL(require.resolve('../template/overlay.html')).href+'?preview=1');
  const result=await page.evaluate(async()=>{
   const keys=OverlayEvents.allPanelKeys,overlap=OverlayEvents.overlapPanelKeys,aux=overlap.slice(1);
   const image=document.createElement('canvas');image.width=image.height=1;image.getContext('2d').fillRect(0,0,1,1);
   const colors=Object.fromEntries(aux.map((key,index)=>[key,'#'+(0x102030+index*0x010101).toString(16)]));
   const config={layoutVersion:4,layoutMode:'overlap',panelGap:24,cornerRadius:24,cornerSmoothing:.6,panelEnabled:Object.fromEntries(keys.map(key=>[key,true])),
    panelShadows:Object.fromEntries(aux.map(key=>[key,16])),regionStyleOverrides:Object.fromEntries(aux.map(key=>[key,true])),
    regionBackgrounds:Object.fromEntries(aux.map(key=>[key,{fill:{mode:'solid',color:colors[key],opacity:100,blur:0},stroke:{mode:'solid',width:4,color:colors[key]}}])),
    globalStyle:{background:{mode:'solid',color:'#000000'},fill:{mode:'solid',color:'#ffffff',opacity:20},stroke:{mode:'solid',color:'#ffffff',width:4}},
    panelContent:Object.fromEntries(keys.map(key=>[key,{type:key==='panel5_3'?'media':'source',url:key==='panel5_3'?image.toDataURL():'',sourceName:key}]))};
   Overlay.applyConfig(config);await document.querySelector('[data-region=panel5_3] .generic-media img').decode();
   const content=document.querySelectorAll('.overlay section[data-region]');
   const shown=()=>Array.from(content).filter(node=>!node.hidden&&getComputedStyle(node).visibility!=='hidden').map(node=>node.dataset.region);
   const first={shown:shown(),fill:document.querySelectorAll('#canvas .tile[style*="display: block"]').length,strokes:document.querySelectorAll('#preview-strokes .panel-shape-stroke').length,
    shadows:document.querySelectorAll('.panel-shadow-layer .panel-shape-shadow').length,
    hints:aux.filter(key=>!document.querySelector('.overlay section[data-region='+key+'] .generic-source-hint').hidden),
    colors:aux.map(key=>document.querySelector('#canvas .tile[data-region='+key+'] .surface').style.backgroundColor)};
   const accepted=Overlay.receive({target:'panel5_3',nickname:'Last panel',text:'Independent sample'});
   const bento={...config,layoutMode:'bento',panelGap:32};Overlay.applyConfig(bento);
   const second={shown:shown(),shadows:document.querySelectorAll('.panel-shadow-layer .panel-shape-shadow').length,
    sampleHidden:document.querySelector('[data-region=panel5_3] .generic-sample').hidden,accepted:Overlay.receive({target:'panel5_3',text:'Inactive'})};
   Overlay.applyConfig(config);await document.querySelector('[data-region=panel5_3] .generic-media img').decode();
   return {first,second,accepted,returned:shown(),sourceName:Overlay.getConfig().panelContent.panel5_3.sourceName,
    nodeCount:document.querySelectorAll('.overlay section[data-region]').length};
  });
  assert.deepEqual(errors,[]);
  assert.deepEqual(result.first.shown.sort(),[...events.overlapPanelKeys].sort());
  assert.equal(result.first.fill,15);assert.equal(result.first.strokes,15);assert.equal(result.first.shadows,15);
  assert.equal(result.first.hints.length,14);assert.equal(new Set(result.first.colors).size,15);
  assert.equal(result.accepted,true);assert.equal(result.second.accepted,false);assert.equal(result.second.sampleHidden,true);
  assert.deepEqual(result.second.shown.sort(),[...events.bentoPanelKeys].sort());assert.equal(result.second.shadows,0);
  assert.deepEqual(result.returned.sort(),[...events.overlapPanelKeys].sort());assert.equal(result.sourceName,'panel5_3');
  assert.equal(result.nodeCount,events.allPanelKeys.length+2,'legacy sponsor/alerts stay hidden; preset switching adds no duplicate nodes');
  if(process.env.KMG_OVERLAP_PANELS_SCREENSHOT)await page.screenshot({path:process.env.KMG_OVERLAP_PANELS_SCREENSHOT});
 }finally{await browser.close();}
});

test('direct-file settings expands default columns to 16 hit surfaces and preserves saved OS smoothing',async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  for(const platform of ['Win32','MacIntel']){
   const context=await browser.newContext({viewport:{width:1600,height:1000},acceptDownloads:true});
   await context.addInitScript(platform=>{
    Object.defineProperty(navigator,'platform',{get:()=>platform});
    Object.defineProperty(navigator,'userAgentData',{get:()=>undefined});
    Object.defineProperty(window,'showSaveFilePicker',{value:undefined,configurable:true});
   },platform);
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await require('./helpers/expanded-sections.cjs')(page);await page.goto(require('node:url').pathToFileURL(process.env.KMG_SETTINGS_HTML||require.resolve('../template/settings.html')).href);
   await page.waitForFunction(()=>!document.querySelector('[data-layout-choice=overlap]').disabled);
   await page.locator('[data-layout-choice=overlap]').click();
   await page.waitForFunction(()=>document.querySelectorAll('[data-hit]').length===16,{},{timeout:5000});
   for(let column=1;column<=5;column++){const slider=page.locator('[data-overlap-column="'+column+'"]');await slider.evaluate(node=>node.value='3');await slider.dispatchEvent('input');}
   await page.waitForFunction(()=>document.querySelectorAll('[data-hit]').length===16,{},{timeout:5000});
   assert.equal(await page.locator('.hit-surface').count(),16);assert.equal(await page.locator('#overlap-safety-guide .safety-cell').count(),15);
   assert.equal(await page.locator('#event-target').count(),0);
   assert.equal(await page.locator('[name=cornerSmoothing]').inputValue(),platform==='MacIntel'?'1':'0');
   await page.locator('[data-hit=panel5_3] .hit-surface').click();
   await page.locator('[data-overlap-column="5"]').evaluate(node=>node.value='2');
   await page.locator('[data-overlap-column="5"]').dispatchEvent('input');
   await page.locator('#change-layout').click();await page.locator('[data-layout-choice=bento]').click();
   await page.waitForFunction(()=>document.querySelectorAll('[data-hit]').length===7,{},{timeout:5000});
   await page.locator('#change-layout').click();await page.locator('[data-layout-choice=overlap]').click();
   await page.waitForFunction(()=>document.querySelectorAll('[data-hit]').length===15,{},{timeout:5000});
   assert.equal(await page.locator('.hit-surface').count(),15);
   assert.equal(await page.locator('[data-hit=panel5_3]').count(),0);
   await page.locator('[data-overlap-column="5"]').evaluate(node=>node.value='3');
   await page.locator('[data-overlap-column="5"]').dispatchEvent('input');
   await page.locator('[name=cornerSmoothing]').evaluate(node=>node.value='2');await page.locator('[name=cornerSmoothing]').dispatchEvent('input');
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.cornerSmoothing===1);
   await page.reload();await page.waitForFunction(()=>!document.querySelector('[data-layout-choice=overlap]').disabled);
   await page.locator('[data-layout-choice=overlap]').click();
   await page.waitForFunction(()=>document.querySelectorAll('[data-hit]').length===16,{},{timeout:5000});
   assert.equal(await page.locator('[name=cornerSmoothing]').inputValue(),'2','saved smoothing wins over OS default');
   if(await page.evaluate(()=>!!window.OBS_EXPORT_RUNTIME)){
    const downloaded=page.waitForEvent('download',{timeout:10000});await page.locator('#bundle').click();
    const download=await downloaded;assert.equal(download.suggestedFilename(),'OBS-settings.zip');
    const bytes=fs.readFileSync(await download.path()),entries=new Map();
    for(let offset=0;offset+30<bytes.length&&bytes.readUInt32LE(offset)===0x04034b50;){
     const size=bytes.readUInt32LE(offset+18),nameSize=bytes.readUInt16LE(offset+26),extraSize=bytes.readUInt16LE(offset+28),start=offset+30+nameSize+extraSize;
     const name=bytes.toString('utf8',offset+30,offset+30+nameSize);entries.set(name,bytes.subarray(start,start+size));offset=start+size;
    }
    assert.equal([...entries.keys()].filter(name=>name.endsWith('-alpha-mask.png')).length,16);
    for(const key of events.overlapPanelKeys)assert.ok(entries.has('assets/'+key+'-alpha-mask.png'));
    const exported=JSON.parse(entries.get('config.json').toString('utf8'));
    assert.equal(Object.keys(exported.layout).length,16);assert.equal(Object.keys(exported.panelContent).length,22);
    assert.ok(entries.has('OBS-script.lua'));assert.match(entries.get('OBS-script.lua').toString('utf8'),/internal\/panel-shape\.js/,'Lua installs the bundled shared geometry runtime');
   }
   assert.deepEqual(errors,[],'direct-file iframe access must not raise origin or stale-layout errors');
   await context.close();
  }
 }finally{await browser.close();}
});
