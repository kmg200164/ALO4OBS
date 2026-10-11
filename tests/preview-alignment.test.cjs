const test=require('node:test');
const assert=require('node:assert/strict');
test('preview hit areas follow the iframe uniform scale after fractional resizes',{skip:!process.env.KMG_THEME_RENDER_URL},async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();
  await require('./helpers/expanded-sections.cjs')(page);await page.goto(new URL('settings.html',process.env.KMG_THEME_RENDER_URL).href);
  await page.locator('[data-layout-choice=bento]').click();
  await page.waitForSelector('.panel-hit');
  for(const width of [1278,1440,969,760,390]){
   await page.setViewportSize({width,height:1248});
   await page.waitForTimeout(150);
   // Measure each browsing context directly: file:// frames have opaque origins.
   const areas=await page.evaluate(()=>{
    const origin=document.querySelector('#preview').getBoundingClientRect();
    return [...document.querySelectorAll('.panel-hit')].map(hit=>{
     const area=hit.getBoundingClientRect();return {key:hit.dataset.hit,left:area.left-origin.left,right:area.right-origin.left,top:area.top-origin.top,bottom:area.bottom-origin.top};
    });
   });
   const child=await (await page.locator('#preview').elementHandle()).contentFrame();
   const regions=await child.evaluate(()=>Object.fromEntries([...document.querySelectorAll('[data-region]')].map(node=>{const r=node.getBoundingClientRect();return [node.dataset.region,{left:r.left,right:r.right,top:r.top,bottom:r.bottom}];})));
   const errors=areas.map(area=>{const actual=regions[area.key];assert.ok(actual,`Rendered region ${area.key}`);return Math.max(...['left','right','top','bottom'].map(axis=>Math.abs(area[axis]-actual[axis])));});
   assert.ok(errors.every(error=>error<0.06),`${width}px: ${errors}`);
  }
 }finally{await browser.close();}
});
