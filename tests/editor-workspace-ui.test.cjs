const test=require('node:test'),assert=require('node:assert/strict');
test('equal workspace keeps sticky preview, inline actions and a full-width contextual inspector without scroll jumps',{skip:!process.env.KMG_THEME_RENDER_URL},async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({locale:'ko-KR',viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await require('./helpers/existing-entry.cjs')(page);await page.goto(new URL('settings.html',process.env.KMG_THEME_RENDER_URL).href);await page.locator('[data-layout-choice=overlap]').click();
  assert.equal(await page.locator('#send,#clear,#event-target,.sample-card').count(),0);assert.equal(await page.locator('.panel-card').isVisible(),true);assert.equal(await page.locator('#panel-selection-hint').isVisible(),true);assert.equal(await page.locator('#panel-editor').isVisible(),false);
  assert.equal(await page.locator('[name=overlapColumn2Wide],[name=overlapColumn4Wide]').count(),0);
  for(const width of [1920,1440,1401,1400,1100,760,390,320]){
   await page.setViewportSize({width,height:1000});await page.waitForTimeout(50);
   const boxes=await page.evaluate(()=>{const p=document.querySelector('.preview-section'),s=document.querySelector('.settings-section'),a=p.getBoundingClientRect(),b=s.getBoundingClientRect();return {a:{left:a.left,right:a.right,top:a.top,bottom:a.bottom},b:{left:b.left,right:b.right,top:b.top},position:getComputedStyle(p).position,overflow:document.documentElement.scrollWidth>innerWidth};});
   assert.equal(boxes.overflow,false);
   assert.equal(boxes.position,'sticky');assert.ok(boxes.b.left>=boxes.a.right);assert.ok(Math.abs((boxes.a.right-boxes.a.left)-(boxes.b.right-boxes.b.left))<1);assert.ok(Math.abs(boxes.a.top-boxes.b.top)<1);
   assert.equal(await page.locator('.settings-columns').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),width<=1400?1:2);
  }
  await page.setViewportSize({width:1440,height:1000});
  for(const section of ['.preview-section','.settings-section']){
   const header=await page.locator(section+' > .section-bar').evaluate(el=>{const a=el.querySelector('.section-heading').getBoundingClientRect(),b=el.querySelector('.action-group').getBoundingClientRect();return {right:a.right,top:a.top,actionLeft:b.left,actionTop:b.top,height:el.getBoundingClientRect().height};});
   assert.ok(header.actionLeft>=header.right);assert.ok(Math.abs(header.actionTop-header.top)<9);assert.equal(header.height,48);
  }
  await page.locator('[data-hit=panel1_1] .panel-number').click();assert.equal(await page.locator('.panel-card').isVisible(),true);
  const cards=await page.locator('.panel-card,.global-card,.placement-card').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,bottom:b.bottom};}));
  assert.ok(Math.abs(cards[0].width-(cards[1].width+cards[2].width+16))<1);assert.ok(cards[1].y>=cards[0].bottom);assert.ok(Math.abs(cards[1].y-cards[2].y)<1);assert.ok(cards[2].x>cards[1].x);
  await page.locator('[data-hit=panel1_1] .panel-number').click();assert.equal(await page.locator('#panel-editor').isVisible(),false);
  await page.locator('.placement-list > details').evaluateAll(els=>els.forEach(el=>el.open=true));await page.evaluate(()=>scrollTo(0,1000));await page.waitForTimeout(100);
  assert.ok(Math.abs((await page.locator('.preview-section').boundingBox()).y-96)<1);
  const label=await page.locator('[data-hit=panel1_1] .panel-number').boundingBox(),before=await page.evaluate(()=>scrollY);
  await page.mouse.move(label.x+label.width/2,label.y+label.height/2);await page.mouse.down();await page.mouse.move(label.x+label.width/2,label.y+label.height/2+24,{steps:3});
  assert.equal(await page.evaluate(()=>scrollY),before);await page.mouse.up();await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>scrollY),before);
  await page.locator('[data-hit=panel3_1] .panel-number').click();await page.waitForTimeout(100);assert.ok((await page.locator('.panel-card').boundingBox()).y>=95);assert.equal(await page.locator('#selected-panel-tag').textContent(),'Panel 3-1');
  const wide=page.locator('[name=overlapColumn1Wide]');assert.equal(await wide.getAttribute('role'),'switch');await wide.check();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config')).overlapColumns[1].widthBasis===3);assert.equal(await page.locator('[data-hit=panel2_1]').count(),0);
  await page.locator('#change-layout').click();assert.equal(await page.locator('.editor-workspace').isVisible(),false);await page.locator('[data-layout-choice=bento]').click();assert.equal(await page.locator('.editor-workspace').isVisible(),true);assert.equal(await page.locator('#panel-editor').isVisible(),false);assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
