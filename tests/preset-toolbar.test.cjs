
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const renderUrl=process.env.KMG_THEME_RENDER_URL;
const playwright=()=>require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const widths=[1440,760,390,320];
const close=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<.12,message+': '+actual+' vs '+expected);

test('rendered chooser shares equal visible grid gaps and four-pixel corners at four viewport widths',{skip:!renderUrl},async()=>{
 const browser=await playwright().chromium.launch({headless:true,channel:'chrome'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'en-US'});
  const failures=[];page.on('pageerror',error=>failures.push(error.message));
  await require('./helpers/expanded-sections.cjs')(page);await page.goto(new URL('settings.html',renderUrl).href);await page.waitForSelector('html[data-i18n-ready]');
  await page.waitForFunction(()=>!document.querySelector('[data-layout-choice=bento]').disabled);
  await page.screenshot({path:path.join(__dirname,'../.qa-private/0.10.0/entry-refined.png')});
  for(const width of widths){
   await page.setViewportSize({width,height:1000});
   const cards=await page.evaluate(()=>{
    function visibleRect(node){
     const b=node.getBoundingClientRect(),css=getComputedStyle(node),outline=css.outlineStyle==='none'?0:parseFloat(css.outlineWidth);
     return {left:b.left-outline,right:b.right+outline,top:b.top-outline,bottom:b.bottom+outline};
    }

    return ['dark','light'].flatMap(theme=>{document.documentElement.dataset.theme=theme;document.body.dataset.theme=theme;return ['bento','overlap'].map(mode=>{
     const thumb=document.querySelector('.preset-thumbnail--'+mode),css=getComputedStyle(thumb),items=[...thumb.children],rects=items.map(visibleRect),b=thumb.getBoundingClientRect();
     const [left,right,above,below]=mode==='bento'?[1,2,0,1]:[0,1,0,5];
     return {mode,theme,count:items.length,columns:css.gridTemplateColumns.split(' ').length,rows:css.gridTemplateRows.split(' ').length,
      x:rects[right].left-rects[left].right,y:rects[below].top-rects[above].bottom,
      edgeLeft:rects[0].left-b.left,edgeTop:rects[0].top-b.top,padding:parseFloat(css.paddingLeft),width:b.width,
      radius:css.borderRadius,itemRadii:items.map(i=>getComputedStyle(i).borderRadius),
      outline:getComputedStyle(items[0]).outlineStyle,background:css.backgroundColor,fills:items.map(i=>getComputedStyle(i).backgroundColor),opacities:items.map(i=>getComputedStyle(i).opacity),overflow:document.documentElement.scrollWidth>innerWidth};
    });
   });
   });
   const [bento,overlap]=cards;
   for(const card of cards){
    assert.equal(card.columns,card.mode==='bento'?4:5);assert.equal(card.rows,3);
    assert.equal(card.count,card.mode==='bento'?7:15);assert.equal(card.radius,'4px');
    assert.ok(card.itemRadii.every(radius=>radius==='4px'));assert.equal(card.overflow,false);
    close(card.x,card.y,width+' '+card.mode+' horizontal/vertical visible gaps');
    close(card.x,card.width*.016875,width+' '+card.mode+' 1.6875% visible gap');
    close(card.edgeLeft,card.padding,width+' '+card.mode+' visible left padding');
    close(card.edgeTop,card.padding,width+' '+card.mode+' visible top padding');
   }
   for(const card of cards){const main=(card.theme==='dark')!==(card.mode==='bento')?'rgb(255, 255, 255)':'rgb(0, 0, 0)',auxiliary=(card.theme==='dark')!==(card.mode==='bento')?'rgb(0, 0, 0)':'rgb(255, 255, 255)';assert.equal(card.outline,'none');assert.equal(card.background,main);if(card.mode==='bento'){assert.equal(card.fills[0],auxiliary);assert.equal(card.opacities[0],'1');assert.ok(card.fills.slice(1).every(fill=>fill===auxiliary));assert.ok(card.opacities.slice(1).every(opacity=>opacity==='0.4'));}else{assert.ok(card.fills.every(fill=>fill===auxiliary));assert.ok(card.opacities.every(opacity=>opacity==='0.4'));}}close(bento.x,overlap.x,width+' both thumbnails share visible gaps');
  }
  assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('right-aligned reset buttons stay accessible and functional across locales and widths',{skip:!renderUrl},async()=>{
 const browser=await playwright().chromium.launch({headless:true,channel:'chrome'});
 const labels={ko:['샘플 비우기','설정 초기화'],en:['Clear samples','Reset settings'],ja:['サンプルをクリア','設定をリセット']};
 try{
  for(const [language,expected] of Object.entries(labels)){
   const context=await browser.newContext({viewport:{width:1440,height:1000},locale:language});
   await context.addInitScript(language=>{if(window.top===window)localStorage.setItem('overlay-ui-language',language);},language);
   const page=await context.newPage(),failures=[];page.on('pageerror',error=>failures.push(error.message));
   await require('./helpers/expanded-sections.cjs')(page);await page.goto(new URL('settings.html',renderUrl).href);await page.waitForSelector('html[data-i18n-ready]');
   await page.waitForFunction(()=>!document.querySelector('[data-layout-choice=bento]').disabled);
   await page.locator('[data-layout-choice=bento]').click();
   await page.waitForFunction(()=>document.querySelectorAll('[data-hit]').length===7);
   if(language==='ko')await page.screenshot({path:path.join(__dirname,'../.qa-private/0.10.0/toolbar-refined.png')});
   for(const width of widths){
    await page.setViewportSize({width,height:1000});
    const state=await page.evaluate(()=>{
     return ['reset'].map(id=>{
      const node=document.getElementById(id),heading=node.closest('.section-bar'),title=heading.querySelector('h2'),b=node.getBoundingClientRect(),h=title.getBoundingClientRect(),icon=node.querySelector('svg'),g=icon.getBoundingClientRect();
      return {id,width:b.width,height:b.height,gap:b.left-h.right,centerDelta:(b.top+b.height/2)-(h.top+h.height/2),label:node.getAttribute('aria-label'),
       title:node.getAttribute('title'),text:node.textContent.trim(),iconWidth:g.width,iconHeight:g.height,iconName:icon.dataset.lucide,iconHidden:icon.getAttribute('aria-hidden'),
       parent:node.parentElement.classList.contains('action-group'),next:node.nextElementSibling.id==='bundle',textVisible:getComputedStyle(node.querySelector('span')).display!=='none',left:b.left,right:b.right,overflow:document.documentElement.scrollWidth>innerWidth,
       switchInSettings:!!document.querySelector('.settings-section>.section-bar>.action-group>#change-layout'),
       switchInHeader:!!document.querySelector('#header-right-tools>#change-layout'),switchInPreview:!!document.querySelector('.preview-section #change-layout')};
     });
    });
    for(const [index,button] of state.entries()){
     assert.equal(button.width,48);assert.equal(button.textVisible,false);assert.equal(button.height,48);assert.equal(button.iconWidth,24);assert.equal(button.iconHeight,24);
     assert.equal(button.iconName,'rotate-ccw');assert.equal(button.iconHidden,'true');assert.equal(button.text,{ko:'초기화',en:'Reset',ja:'リセット'}[language]);
     assert.equal(button.parent,true);assert.equal(button.next,true);if(width>760)assert.ok(button.gap>=8);if(width>760)close(button.centerDelta,0,width+' '+language+' title/icon alignment');
     assert.equal(button.label,expected[1]);assert.equal(button.title,expected[1]);
     assert.ok(button.left>=0&&button.right<=width);assert.equal(button.overflow,false);assert.equal(button.switchInSettings,false);assert.equal(button.switchInHeader,true);assert.equal(button.switchInPreview,false);
    }
   }
   // Check the existing action handlers, not just icon presence.
   await page.setViewportSize({width:1440,height:1000});
   assert.equal(await page.locator('#send,#clear,.sample-card').count(),0);
   await page.locator('[name=panelGap]').evaluate(input=>{input.value='4';input.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.panelGap===48);
   await page.locator('#reset').click();
   await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.panelGap===32);
   assert.equal(await page.locator('[name=panelGap]').inputValue(),'3');
   assert.equal(await page.locator('#change-layout [data-lucide=arrow-left-right]').count(),1);
   await page.locator('#change-layout').click();await page.locator('[data-layout-choice=overlap]').click();
   await page.waitForFunction(()=>document.querySelectorAll('[data-hit]').length===16);
   assert.equal(await page.locator('#change-layout [data-lucide=arrow-left-right]').count(),1);
   if(language==='ko')await page.screenshot({path:path.join(__dirname,'../.qa-private/0.10.0/toolbar-followup.png')});
   await page.locator('#change-layout').click();await page.locator('[data-layout-choice=bento]').click();
   await page.waitForFunction(()=>document.querySelectorAll('[data-hit]').length===7);
   assert.equal(await page.locator('#change-layout [data-lucide=arrow-left-right]').count(),1);
   assert.equal(await page.locator('#reset').getAttribute('aria-label'),expected[1]);
   assert.deepEqual(failures,[]);await context.close();
  }
 }finally{await browser.close();}
});
