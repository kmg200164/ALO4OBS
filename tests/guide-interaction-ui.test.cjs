const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
test('all guide cards keep symbols and inline elements consistent in base hover and keyboard focus',{skip:!process.env.KMG_GUIDE_STATE_QA},async()=>{
 const {chromium}=require(path.join(require('node:os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
 const b=await chromium.launch({headless:true,channel:'chrome'});let cards=0;
 try{for(const lang of ['','-en','-ja'])for(const theme of ['dark','light']){
  const p=await b.newPage({viewport:{width:1280,height:1000}});await p.goto(pathToFileURL(path.resolve('template/guide'+lang+'.html')).href);
  await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.body.dataset.theme=t;document.querySelectorAll('.faq-item').forEach(n=>n.open=true)},theme);
  const count=await p.locator('.faq-item').count();
  for(let i=0;i<count;i++){
   const card=p.locator('.faq-item').nth(i),summary=card.locator('summary');
   for(const state of ['base','hover','focus']){
    await p.mouse.move(0,0);await p.evaluate(()=>document.activeElement?.blur());
    if(state==='hover')await summary.hover();
    if(state==='focus'){await p.keyboard.press('Tab');await summary.focus();assert.equal(await summary.evaluate(n=>n.matches(':focus-visible')),true);}
    const errors=await card.evaluate((n,state)=>{
     const c=getComputedStyle(n),errors=[];const interactive=state!=='base';
     const lum=color=>{const v=color.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return v[0]*.2126+v[1]*.7152+v[2]*.0722};const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
     if(interactive&&contrast(c.color,c.backgroundColor)<4.5)errors.push('card text contrast below 4.5');
     for(const li of n.querySelectorAll('li'))if(getComputedStyle(li,'::marker').color!==getComputedStyle(li).color)errors.push('list marker differs');
     if(interactive){
      for(const el of n.querySelectorAll('p,strong,a,li,.level-chip b,.guide-process-number'))if(getComputedStyle(el).color!==c.color)errors.push(el.tagName+' foreground differs');
      for(const el of n.querySelectorAll('svg'))if(getComputedStyle(el).color!==c.color)errors.push('icon color differs');
      for(const el of n.querySelectorAll('.privacy-note'))if(getComputedStyle(el).borderLeftColor!==c.color)errors.push('notice border differs');
     }
     for(const el of n.querySelectorAll('code,kbd,.control-label')){const s=getComputedStyle(el);if(contrast(s.color,s.backgroundColor)<4.5)errors.push('inline highlight contrast below 4.5');}
     return errors;
    },state);
    assert.deepEqual(errors,[],`${lang||'ko'} ${theme} card ${i} ${state}`);
   }
   cards++;
  }
  await p.close();
 }console.log('guide cards checked:',cards,'states:',cards*3);}finally{await b.close();}
});
