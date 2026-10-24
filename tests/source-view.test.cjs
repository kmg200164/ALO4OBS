const test=require('node:test'),assert=require('node:assert/strict');
const events=require('../template/events.js'),pack=require('../template/pack.js');
const contents=()=>Object.fromEntries(events.allPanelKeys.map(key=>[key,{type:key==='game'?'source':'none',url:''}]));
test('OBS source fit and transparent crop survive settings ZIP export and both layout snapshots',()=>{
 const view={fit:'contain',crop:{left:0,top:0,right:60,bottom:30}},panelContent=contents();panelContent.custom2={type:'source',url:'',sourceView:view};
 const input={layoutVersion:4,layoutMode:'bento',panelContent};
 const saved=JSON.parse(new TextDecoder().decode(pack.settingsEntries(input)[0].bytes));
 assert.deepEqual(saved.panelContent.custom2.sourceView,view);
 const switched=events.switchLayoutPreset(saved,'overlap'),restored=events.switchLayoutPreset(switched,'bento');
 assert.deepEqual(restored.panelContent.custom2.sourceView,view);assert.deepEqual(input.panelContent.custom2.sourceView,view);
});
test('source view validates explicit fit and bounded integer crop values',()=>{
 for(const sourceView of [{fit:'invalid'},{crop:{left:-1}},{crop:{right:1.5}},{crop:{top:8193}}]){
  const panelContent=contents();panelContent.game.sourceView=sourceView;
  assert.throws(()=>pack.settingsEntries({layoutVersion:4,panelContent}),/source view|source crop/i);
 }
 const panelContent=contents();assert.deepEqual(JSON.parse(new TextDecoder().decode(pack.settingsEntries({layoutVersion:4,panelContent})[0].bytes)).panelContent.game,{type:'source',url:''});
});


test('HTML source framing survives reload, layout switch and exported ZIP',{skip:!process.env.KMG_SETTINGS_HTML},async()=>{
 const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||require('node:path').join(require('node:os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')),{pathToFileURL}=require('node:url');
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{const context=await browser.newContext({acceptDownloads:true}),page=await context.newPage();await require('./helpers/expanded-sections.cjs')(page);
 await page.goto(pathToFileURL(process.env.KMG_SETTINGS_HTML).href);await page.locator('[data-layout-choice=bento]:enabled').click();await page.locator('[data-hit=custom2]').click();
 await page.locator('[name=panelContentType]').selectOption('source');await page.locator('[name=panelSourceFit]').selectOption('cover');
 await page.locator('[name=panelSourceCropright]').fill('60');await page.locator('[name=panelSourceCropbottom]').fill('30');await page.locator('[name=panelSourceCropbottom]').press('Tab');
 const expected={fit:'cover',crop:{left:0,top:0,right:60,bottom:30}};
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config')).panelContent.custom2.sourceView?.crop.bottom===30);
 await page.reload();await page.locator('[data-layout-choice=bento]:enabled').click();await page.locator('[data-hit=custom2]').click();assert.equal(await page.locator('[name=panelSourceCropright]').inputValue(),'60');assert.equal(await page.locator('[name=panelSourceFit]').inputValue(),'cover');
 await page.locator('#change-layout').click();await page.locator('[data-layout-choice=overlap]').click();await page.locator('#change-layout').click();await page.locator('[data-layout-choice=bento]').click();await page.locator('[data-hit=custom2]').click();assert.equal(await page.locator('[name=panelSourceCropbottom]').inputValue(),'30');
 const downloaded=page.waitForEvent('download');await page.locator('#bundle').click();const download=await downloaded,fs=require('node:fs'),zip=fs.readFileSync(await download.path());let saved;
 for(let o=0;zip.readUInt32LE(o)===0x04034b50;){const size=zip.readUInt32LE(o+18),nl=zip.readUInt16LE(o+26),el=zip.readUInt16LE(o+28),start=o+30+nl+el,name=zip.toString('utf8',o+30,o+30+nl);if(name==='files/bento/obs-settings.json')saved=JSON.parse(zip.subarray(start,start+size));o=start+size;}
 assert.deepEqual(saved.panelContent.custom2.sourceView,expected);await context.close();
 }finally{await browser.close();}
});
