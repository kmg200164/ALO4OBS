const test=require('node:test'),assert=require('node:assert/strict');
const enabled=process.env.KMG_RUN_OVERLAP_COLUMN_UI==='1';
test('regional image radios, gradient defaults, switches and uniform vertical alignment preserve saved choices',{skip:!enabled},async()=>{
 const playwright=require('C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await playwright.chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();page.setDefaultTimeout(5000);
  await require('./helpers/expanded-sections.cjs')(page);await page.goto('http://127.0.0.1:8783/review/files/settings.html');await page.locator('[data-layout-choice=bento]').click();
  await page.locator('[data-hit=custom1] .panel-number').click();
  const override=page.locator('[name=regionOverride]');assert.equal(await override.getAttribute('role'),'switch');await override.check();
  assert.deepEqual(await page.locator('[name=regionFillMode]').evaluateAll(nodes=>nodes.map(node=>node.value)),['none','solid','gradient','url','file']);
  for(const name of ['regionFill','regionStroke'])assert.match(await page.locator('[data-gradient-preview='+name+']').getAttribute('style'),/255, 255, 255.*0, 0, 0/);
  assert.equal(await page.locator('[name=panelShadowEnabled]').getAttribute('role'),'switch');assert.equal(await page.locator('[name=globalShadowEnabled]').getAttribute('role'),'switch');
  assert.ok(await page.locator('[name=regionFillMode][value=file]').evaluate(el=>el.getBoundingClientRect().top<document.querySelector('[name=regionOpacity]').getBoundingClientRect().top));
  const url='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jX1sAAAAASUVORK5CYII=';
  await page.locator('[name=regionImage]').fill(url);await page.locator('[name=regionFillMode][value=url]').check();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config')).regionBackgrounds.custom1.imageMode==='url');
  const image=page.frameLocator('#preview').locator('[data-region=custom1] .panel-image');await image.waitFor({state:'visible'});
  await page.locator('[name=regionFillMode][value=none]').check();await image.waitFor({state:'hidden'});
  await page.locator('[data-upload=region]').setInputFiles({name:'pixel.png',mimeType:'image/png',buffer:Buffer.from(url.split(',')[1],'base64')});
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config')).regionBackgrounds.custom1.imageMode==='file');
  await image.waitFor({state:'visible'});await page.locator('[name=regionFillMode][value=solid]').check();await image.waitFor({state:'hidden'});
  await page.reload();await page.locator('[data-layout-choice=bento]').click();await page.locator('[data-hit=custom1] .panel-number').click();
  assert.equal(await page.locator('[name=regionFillMode][value=solid]').isChecked(),true);assert.equal(await page.locator('[name=regionImage]').inputValue(),url);
  await page.locator('[name=regionFillMode][value=file]').check();await image.waitFor({state:'visible'});
  await page.locator('#change-layout').click();await page.locator('[data-layout-choice=overlap]').click();assert.equal(await page.locator('.preview-section .action-group #safety-guide-toggle').count(),1);
  await page.locator('#safety-guide-toggle').click();assert.equal(await page.locator('#overlap-safety-guide').isVisible(),false);assert.equal(await page.locator('#safety-guide-toggle').getAttribute('aria-pressed'),'false');
  await page.locator('#safety-guide-toggle').click();assert.equal(await page.locator('#overlap-safety-guide').isVisible(),true);
  assert.equal(await page.locator('#safety-guide-toggle').evaluate(el=>getComputedStyle(el).color),await page.locator('#safety-guide-toggle').evaluate(el=>{const probe=document.createElement('span');probe.style.color='var(--content-on-accent)';el.append(probe);const color=getComputedStyle(probe).color;probe.remove();return color;}));
  const themeState=await page.evaluate(()=>[document.documentElement,document.body].map(el=>({theme:el.dataset.theme,preset:el.dataset.uiPreset})));
  for(const theme of ['dark','light'])for(const preset of ['red','orange','yellow','lime','aloe','cyan','blue','purple','pink','monochrome']){
    await page.evaluate(({theme,preset})=>{for(const el of [document.documentElement,document.body]){el.dataset.theme=theme;el.dataset.uiPreset=preset;}},{theme,preset});
    for(const pressed of [true,false]){
      if(await page.locator('#safety-guide-toggle').getAttribute('aria-pressed')!==String(pressed))await page.locator('#safety-guide-toggle').click();
      const colors=await page.locator('#safety-guide-toggle').evaluate(el=>({background:getComputedStyle(el).backgroundColor,icon:getComputedStyle(el.querySelector('svg')).color,accent:getComputedStyle(document.querySelector('.app-header')).backgroundColor,onAccent:getComputedStyle(document.querySelector('.app-header')).color}));
      assert.equal(colors.background,pressed?colors.accent:colors.onAccent,theme+' '+preset+' background');assert.equal(colors.icon,pressed?colors.onAccent:colors.accent,theme+' '+preset+' icon');
    }
  }
  await page.evaluate(states=>[document.documentElement,document.body].forEach((el,i)=>{el.dataset.theme=states[i].theme;el.dataset.uiPreset=states[i].preset;}),themeState);
  await page.locator('#safety-guide-toggle').click();
  for(const [language,on,off] of [['ko','안전영역 켜기','안전영역 끄기'],['en','Turn on safety guide','Turn off safety guide'],['ja','安全領域をオンにする','安全領域をオフにする']]){
    await page.locator('#ui-language').selectOption(language);
    for(const pressed of [true,false]){
      if(await page.locator('#safety-guide-toggle').getAttribute('aria-pressed')!==String(pressed))await page.locator('#safety-guide-toggle').click();
      const expected=pressed?off:on;await page.waitForFunction(expected=>document.querySelector('#safety-guide-toggle').getAttribute('aria-label')===expected,expected);
      await page.locator('#fullscreen').focus();await page.locator('#safety-guide-toggle').focus();assert.equal(await page.locator('#icon-tooltip').textContent(),expected);
    }
  }
  await page.locator('#ui-language').selectOption('en');await page.locator('#safety-guide-toggle').click();
  await page.locator('[data-hit=panel2_1] .panel-number').click();await page.locator('[name=panelPositionMode]').uncheck();
  const alignment=page.locator('[name=overlapColumnAlignment]');
  const style=await alignment.evaluate(el=>({accent:getComputedStyle(el).getPropertyValue('--accent-default').trim(),right:el.getBoundingClientRect().right,labelRight:document.querySelector('.column-alignment-labels').getBoundingClientRect().right}));
  assert.ok(style.right>style.labelRight);
 }finally{await browser.close();}
});
