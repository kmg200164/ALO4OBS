const test=require('node:test'),assert=require('node:assert/strict'),events=require('../template/events.js');
const enabled=process.env.KMG_RUN_OVERLAP_COLUMN_UI==='1';
const playwright=()=>require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
async function geometry(page,label){
 // Parent draft and child rectangles remain separate across opaque file origins.
 // Rendering is synchronous but draft persistence waits for the storage lock queue.
 // Take one snapshot only after the saved layout matches the current parent hit areas.
 const snapshot=await page.waitForFunction(()=>{
  const config=JSON.parse(localStorage.getItem('obs-overlay-config')||'null');if(!config?.layout)return false;
  const hits=[...document.querySelectorAll('[data-hit]')];if(!hits.length)return false;
  return hits.every(el=>{const b=config.layout[el.dataset.hit];return b&&Math.abs(parseFloat(el.style.top)*1080/100-b.y)<.01&&Math.abs(parseFloat(el.style.height)*1080/100-b.height)<.01;})?config:false;
 },null,{timeout:3000});
 const config=await snapshot.jsonValue();await snapshot.dispose();
 const child=await (await page.locator('#preview').elementHandle()).contentFrame();
 await child.waitForFunction(layout=>[...document.querySelectorAll('section[data-region]')].filter(e=>!e.hidden).every(e=>{const b=layout[e.dataset.region];return b&&Math.abs(parseFloat(e.style.height)-b.height)<.01&&Math.abs(parseFloat(e.style.top)-b.y)<.01;}),config.layout,{timeout:3000});
 assert.equal(await page.locator('#status').getAttribute('role'),'status',label+' apply succeeds');
 const nodes=await child.evaluate(()=>{const origin=document.querySelector('.overlay').getBoundingClientRect(),scale=origin.width/1920;return [...document.querySelectorAll('section[data-region]')].filter(e=>!e.hidden).map(e=>{const r=e.getBoundingClientRect();return {key:e.dataset.region,x:(r.left-origin.left)/scale,y:(r.top-origin.top)/scale,width:r.width/scale,height:r.height/scale};})});
 const data={config,nodes};
 const flags=events.effectivePanelEnabled(data.config),keys=events.activePanelKeys(data.config).filter(k=>flags[k]!==false&&(data.config.layoutMode!=='overlap'||k!=='game'));
 for(const key of keys){const box=data.config.layout[key],node=data.nodes.find(n=>n.key===key);assert.ok(node,label+' visible '+key);for(const axis of ['x','y','width','height'])assert.ok(Math.abs(node[axis]-box[axis])<.1,label+' rendered '+key+' '+axis);if(data.config.layoutMode==='overlap')assert.ok(box.height>=128,label+' usable height');}
 for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){const a=data.nodes.find(n=>n.key===keys[i]),b=data.nodes.find(n=>n.key===keys[j]);assert.ok(!(a.x<b.x+b.width-.01&&b.x<a.x+a.width-.01&&a.y<b.y+b.height-.01&&b.y<a.y+a.height-.01),label+' collision '+keys[i]+' / '+keys[j]);}
}
async function slider(page,key,mode){
 const slider=page.locator('[name=panelHeightSlider]');await slider.press(mode==='min'?'Home':'End');
 if(mode==='middle'){const track=await slider.boundingBox();await page.mouse.click(track.x+track.width/2,track.y+track.height/2);}
 await geometry(page,key+' slider '+mode);
}
test('every panel height mode and slider keeps actual rendered panels separate',{skip:!enabled},async()=>{
 const browser=await playwright().chromium.launch({headless:true,channel:'chrome'});let steps=0;
 try{const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(5000);await require('./helpers/expanded-sections.cjs')(page);await page.goto(new URL('settings.html',process.env.KMG_THEME_RENDER_URL||'http://127.0.0.1:8783/review/files/').href);await page.locator('[data-layout-choice=overlap]').click();
 for(const key of events.overlapPanelKeys.slice(1)){await page.locator('[data-hit='+key+'] .panel-number').click();await page.locator('[name=panelHeightMode]').uncheck();await geometry(page,key+' auto');steps++;}
 for(const key of events.overlapPanelKeys.slice(1)){await page.locator('[data-hit='+key+'] .panel-number').click();await page.locator('[name=panelHeightMode]').check();await geometry(page,key+' manual');steps++;for(const mode of ['min','middle','max']){await slider(page,key,mode);steps++;}await page.locator('[name=panelHeightMode]').uncheck();await geometry(page,key+' restored auto');steps++;}
 for(const column of [1,3,5]){await page.locator('[name=overlapColumn'+column+'Wide]').check();await geometry(page,'wide '+column);for(const row of [1,2,3]){const key='panel'+column+'_'+row;await page.locator('[data-hit='+key+'] .panel-number').click();await page.locator('[name=panelHeightMode]').check();await slider(page,key,'min');await slider(page,key,'max');await page.locator('[name=panelHeightMode]').uncheck();steps+=3;}}
 await page.locator('#change-layout').click();await page.locator('[data-layout-choice=bento]').click();
 for(const key of events.bentoPanelKeys){await page.locator('[data-hit='+key+'] .panel-number').click();if(await page.locator('[name=panelHeightMode]').count()){await page.locator('[name=panelHeightMode]').check();await geometry(page,key+' manual');steps++;for(const mode of ['min','middle','max']){await slider(page,key,mode);steps++;}await page.locator('[name=panelHeightMode]').uncheck();await geometry(page,key+' auto');steps++;}else if(key==='game'){for(const ratio of ['auto','16:9','21:9','32:9']){await page.locator('[name=panelAspect]').selectOption(ratio);await geometry(page,'Main '+ratio);steps++;}}else{await geometry(page,key+' shared automatic height');steps++;}}
 assert.deepEqual(errors,[]);console.log('Verified '+steps+' UI states and actual iframe geometry');await page.screenshot({path:'.qa-private/0.10.0/all-panel-height-controls.png'});
 }finally{await browser.close();}
});

test('20000 mixed height, Y, visibility, gap and wide-column configurations never collide',()=>{
 let seed=0x1002026;const next=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed>>>16)%n;};
 for(let index=0;index<20000;index++){
  const config={layoutMode:'overlap',panelGap:events.panelGaps[next(events.panelGaps.length)],panelEnabled:{game:true},overlapSizing:{},overlapPositions:{},overlapColumns:{}};
  for(let column=1;column<=5;column++)config.overlapColumns[column]={enabled:next(4)!==0,widthBasis:column%2&&next(2)?3:5};
  for(const key of events.overlapPanelKeys.slice(1)){config.panelEnabled[key]=next(4)!==0;config.overlapSizing[key]={heightMode:next(2)?'auto':'fixed',height:[1,128,328,653,1064][next(5)]};config.overlapPositions[key]={mode:next(2)?'auto':'fixed',y:[0,24,350,728,1079][next(5)]};}
  const before=JSON.stringify(config),layout=events.resolveConfigLayout(config),flags=events.effectivePanelEnabled(config);
  assert.equal(events.overlapCollisions(layout,flags).length,0,'mixed configuration '+index);assert.equal(JSON.stringify(config),before,'geometry preserves requested settings');
  for(const key of events.overlapPanelKeys.slice(1).filter(key=>flags[key])){const b=layout[key];assert.ok(b.height>=128&&b.y>=config.panelGap-.01&&b.y+b.height<=1080-config.panelGap+.01,'mixed configuration stays usable and bounded '+index);}
 }
});
