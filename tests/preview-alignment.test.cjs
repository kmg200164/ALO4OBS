const test=require('node:test');
const assert=require('node:assert/strict');
test('preview hit areas follow the iframe uniform scale after fractional resizes',{skip:!process.env.KMG_THEME_RENDER_URL},async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage();
  await page.goto(new URL('settings.html',process.env.KMG_THEME_RENDER_URL).href);
  await page.waitForSelector('.panel-hit');
  for(const width of [1278,1440,969,760,390]){
   await page.setViewportSize({width,height:1248});
   await page.waitForTimeout(150);
   const errors=await page.evaluate(()=>{
    const frame=document.querySelector('#preview'),origin=frame.getBoundingClientRect();
    return [...document.querySelectorAll('.panel-hit')].map(hit=>{
     const actual=frame.contentDocument.querySelector(`[data-region="${hit.dataset.hit}"]`).getBoundingClientRect(),area=hit.getBoundingClientRect();
     return Math.max(...['left','right'].map(k=>Math.abs(area[k]-origin.left-actual[k])),...['top','bottom'].map(k=>Math.abs(area[k]-origin.top-actual[k])));
    });
   });
   assert.ok(errors.every(error=>error<0.06),`${width}px: ${errors}`);
  }
 }finally{await browser.close();}
});
