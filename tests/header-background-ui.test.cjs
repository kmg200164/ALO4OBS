const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const enabled=!!process.env.KMG_GUIDE_STATE_QA;
const pw=()=>require(path.join(require('node:os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
test('shared header retains geometry across guide and editor; guide layout button is disabled',{skip:!enabled},async()=>{
 const b=await pw().chromium.launch({headless:true,channel:'chrome'});let comparisons=0;
 try{for(const width of [320,800,1280,1886])for(const lang of ['','-en','-ja']){
  const c=await b.newContext({viewport:{width,height:1000}});await c.addInitScript(()=>localStorage.setItem('obs-overlay-first-use','done'));const p=await c.newPage();let reference;
  for(const name of ['guide'+lang+'.html','settings.html','guide'+lang+'.html','settings.html']){
   await p.goto(pathToFileURL(path.resolve('template',name)).href);await p.locator('#app-version:not([hidden])').waitFor({state:'attached'});await p.evaluate(()=>document.fonts.ready);
   if(width<=920)await p.locator('.header-menu--right').evaluate(e=>e.open=true);
   const guide=name.startsWith('guide');assert.equal(await p.locator('#change-layout').isDisabled(),guide);
   assert.ok(await p.locator('#change-layout').getAttribute('aria-label'));
   if(guide){const url=p.url();await p.locator('#change-layout').evaluate(n=>n.click());assert.equal(p.url(),url);await p.locator('#change-layout').evaluate(n=>n.focus());assert.notEqual(await p.evaluate(()=>document.activeElement.id),'change-layout');}
   const boxes=await p.evaluate(()=>Object.fromEntries(['.app-header','.brand','#app-version','.header-menu--left','.header-menu--right','#change-layout','#theme-toggle'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [s,[r.x,r.y,r.width,r.height]]})));
   if(reference)for(const s in boxes)for(let j=0;j<4;j++)assert.ok(Math.abs(boxes[s][j]-reference[s][j])<1,`${width} ${lang} ${name} ${s} ${j}: ${boxes[s]} vs ${reference[s]}`);
   reference=boxes;comparisons++;
  }await c.close();
 }console.log('Header page samples:',comparisons);}finally{await b.close();}
});
test('background width-fit preserves aspect ratio in preview and exported wallpaper without repetition',{skip:!enabled},async()=>{
 const b=await pw().chromium.launch({headless:true,channel:'chrome'});
 try{const p=await b.newPage({viewport:{width:1920,height:1080}});
 const images=await p.evaluate(()=>[ [100,100],[100,200],[400,100],[160,90] ].map(([w,h])=>{const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').fillRect(0,0,w,h);return {w,h,url:c.toDataURL()}}));
 for(const filename of ['wallpaper.html','overlay.html?preview']){
  const [name,query]=filename.split('?');await p.goto(pathToFileURL(path.resolve('template',name)).href+(query?'?'+query:''));
  for(const img of images){await p.evaluate(img=>{const data={...window.OVERLAY_PUBLIC_CONFIG,backgroundImage:img.url,backgroundColor:'#123456',globalStyle:{...window.OVERLAY_PUBLIC_CONFIG.globalStyle,background:{mode:'file',url:img.url,color:'#123456'}}};window.postMessage({channel:'kmg-preview',action:'apply',data},'*')},img);
   const selector=name==='wallpaper.html'?'#image':'#preview-wallpaper';await p.waitForFunction(({s,w})=>{const i=document.querySelector(s);return i.complete&&i.naturalWidth===w},{s:selector,w:img.w});
   const box=await p.locator(selector).evaluate(i=>({w:i.offsetWidth,h:i.offsetHeight,nw:i.naturalWidth,nh:i.naturalHeight,count:document.querySelectorAll(i.id?'#'+i.id:'.backdrop').length}));
   assert.equal(box.w,1920);assert.ok(Math.abs(box.h-1920*img.h/img.w)<1,JSON.stringify(box));assert.equal(box.count,1);
  }
 }
 }finally{await b.close();}
});
