const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const events=require('../template/events.js'),source=fs.readFileSync(path.join(__dirname,'../template/preview.js'),'utf8');
function countHarness(input){
 const context={config:structuredClone(input),selected:null,reads:0,readEditor(){context.reads++;},renderEditor(){}};
 const start=source.indexOf('  function updateOverlapColumnCount('),end=source.indexOf('  function updatePlacement(',start);
 vm.runInNewContext(source.slice(start,end),context);return context;
}
function configuration(){return events.switchLayoutPreset({panelContent:{panel2_3:{type:'web',url:'https://example.invalid/retained'}},panelShadows:{panel2_3:48},regionBackgrounds:{panel2_3:{color:'#123456'}}},'overlap');}
test('all five counts address fixed prefix names without clearing hidden content or sizes',()=>{
 for(let column=1;column<=5;column++)for(let count=1;count<=3;count++){
  const original=configuration(),h=countHarness(original),input={dataset:{overlapColumn:String(column)},value:String(count)};
  assert.equal(h.updateOverlapColumnCount(input),true);assert.equal(h.reads,1);assert.equal(h.config.panelEnabled.game,true);
  for(let c=1;c<=5;c++)for(let row=1;row<=3;row++)assert.equal(h.config.panelEnabled['panel'+c+'_'+row],row<=(c===column?count:3));
  for(const field of ['panelContent','panelShadows','regionBackgrounds','overlapSizing','overlapPlacement','layoutPresets'])assert.deepEqual(h.config[field],original[field],field);
 }
});
test('count changes canonicalize holes while retaining hidden row data',()=>{
 const input=configuration();input.panelEnabled.panel2_1=false;input.panelEnabled.panel2_3=true;const h=countHarness(input);
 h.updateOverlapColumnCount({dataset:{overlapColumn:'2'},value:'1'});assert.equal(h.config.panelEnabled.panel2_1,true);assert.equal(h.config.panelEnabled.panel2_3,false);
 h.updateOverlapColumnCount({dataset:{overlapColumn:'2'},value:'0'});assert.equal(h.config.panelContent.panel2_3.url,input.panelContent.panel2_3.url);
 h.updateOverlapColumnCount({dataset:{overlapColumn:'2'},value:'3'});assert.ok([1,2,3].every(row=>h.config.panelEnabled['panel2_'+row]));
});
test('invalid column IDs cannot create unrelated enabled keys',()=>{
 for(const column of ['0','6','NaN','__proto__']){const original=configuration(),h=countHarness(original);assert.equal(h.updateOverlapColumnCount({dataset:{overlapColumn:column},value:'2'}),false);assert.deepEqual(h.config,original);}
});
test('selection comes only from preview and smoothing uses three actual values',()=>{
 assert.doesNotMatch(source,/name="overlapPanel"|name="overlap-column"|name="overlap-row"|function arrangeOverlapLabels/);
 assert.match(source,/presetRange\('cornerSmoothing',config.cornerSmoothing,OverlayEvents.cornerSmoothings/);
 const globals=source.slice(source.indexOf('  function readGlobal(){'),source.indexOf('  function liveConfig('));
 assert.match(globals,/presetRangeValue\('cornerSmoothing',OverlayEvents.cornerSmoothings,0\)/);
});
test('legacy collision is repaired before editing; counts/manual heights/reload preserve content',{skip:process.env.KMG_RUN_OVERLAP_COLUMN_UI!=='1'},async()=>{
 const http=require('node:http'),base=path.resolve(__dirname,'../template'),server=http.createServer((req,res)=>{const relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,''),file=path.resolve(base,relative);if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const {chromium}=require(process.env.KMG_PLAYWRIGHT_PATH||'C:/Users/KMG/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'),browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const legacy=configuration();legacy.overlapColumns=events.normalizeOverlapColumns();legacy.overlapPositions=events.normalizeOverlapPositions();legacy.layoutVersion=4;legacy.panelEnabled=Object.fromEntries(events.overlapPanelKeys.map(key=>[key,true]));legacy.overlapPlacement.panel2_3={column:5,row:1,columnSpan:1,rowSpan:1};legacy.layout=events.overlapLayout({enabled:legacy.panelEnabled});legacy.layout.panel2_3={...legacy.layout.panel5_1};delete legacy.overlapSizing;delete legacy.layoutPresets.overlap.overlapSizing;delete legacy.layoutPresets.bento.overlapSizing;
  const context=await browser.newContext({locale:'en-US',viewport:{width:1440,height:1000}});
  await context.addInitScript(legacy=>{if(window!==window.top)return;if(!localStorage.getItem('obs-overlay-config'))localStorage.setItem('obs-overlay-config',JSON.stringify(legacy));},legacy);
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await require('./helpers/expanded-sections.cjs')(page);await page.goto('http://127.0.0.1:'+server.address().port+'/settings.html');await page.locator('[data-layout-choice=overlap]').click();
  const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('obs-overlay-config')));
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config'))?.overlapSizing);
  const backup=await page.evaluate(()=>JSON.parse(localStorage.getItem('obs-overlay-before-fixed-columns')));assert.deepEqual(backup,legacy);
  let before=await saved();assert.equal(before.overlapPlacement.panel2_3.column,2);assert.equal(before.overlapPlacement.panel2_3.row,3);
  assert.equal(await page.locator('[data-hit]').count(),16);assert.equal(await page.locator('[name=overlapPanel]').count(),0);
  const a=await page.locator('[data-hit=panel2_3]').boundingBox(),b=await page.locator('[data-hit=panel5_1]').boundingBox();assert.ok(a.x+a.width<=b.x);
  for(const key of ['panel2_1','panel2_2']){await page.locator('[data-hit='+key+'] .panel-number').click();await page.locator('[name=panelHeightMode]').check();await page.locator('[name=panelHeight]').fill('200');await page.locator('[name=panelHeight]').dispatchEvent('change');}
  await page.locator('[data-hit=panel2_3] .panel-number').click();assert.equal(await page.locator('#selected-panel-tag').textContent(),'Panel 2-3');
  assert.equal(await page.locator('[name=overlap-column]').count(),0);await page.locator('[name=panelHeightMode]').check();await page.locator('[name=panelHeight]').fill('200');await page.locator('[name=panelHeight]').dispatchEvent('change');
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config')).overlapSizing.panel2_3.height===200);
  assert.equal((await saved()).layout.panel2_3.height,200);
  const setCount=async(column,count)=>{const slider=page.locator('[data-overlap-column="'+column+'"]');await slider.evaluate((el,value)=>el.value=String(value),count);await slider.dispatchEvent('input');};
  await page.locator('[name=panelPositionMode]').check();await page.locator('[name=panelY]').fill('700');await page.locator('[name=panelY]').dispatchEvent('change');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config')).overlapPositions.panel2_3.y===700);
  before=await saved();await page.locator('[name=overlapColumn2Enabled]').uncheck();assert.equal(await page.locator('[data-hit=panel2_3]').count(),0);await page.locator('[name=overlapColumn2Enabled]').check();await setCount(2,3);
  assert.equal((await saved()).overlapColumns[2].enabled,true);assert.equal((await saved()).layout.panel2_3.y,700);
  await page.locator('[name=overlapColumn1Wide]').check();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config')).layout.panel1_1.width===608);
  assert.equal((await saved()).layout.panel1_1.width,608);assert.equal(await page.locator('[name=overlapColumn2Enabled]').isDisabled(),true);assert.equal(await page.locator('[name=overlapColumn2Enabled]').isChecked(),false);assert.equal(await page.locator('[name=overlapColumn2Count]').isDisabled(),true);assert.equal(await page.locator('[data-hit=panel2_3]').count(),0);
  await page.locator('[name=overlapColumn1Wide]').uncheck();assert.equal(await page.locator('[name=overlapColumn2Enabled]').isChecked(),true);assert.equal((await saved()).layout.panel2_3.y,700);
  const after=await saved();for(const field of ['panelContent','overlapPlacement','overlapSizing','overlapPositions','panelShadows'])assert.deepEqual(after[field],before[field],field+' retained');
  await page.locator('#select-main').click();assert.equal(await page.locator('#selected-panel-tag').textContent(),'Main');
  await page.locator('[name=cornerSmoothing]').evaluate(el=>el.value='1');await page.locator('[name=cornerSmoothing]').dispatchEvent('input');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('obs-overlay-config')).cornerSmoothing===.6);
  await page.reload();await page.locator('[data-layout-choice=overlap]').click();assert.equal((await saved()).layout.panel2_3.height,200);assert.equal(await page.locator('[name=cornerSmoothing]').inputValue(),'1');assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(__dirname,'../.qa-private/0.10.0/fixed-columns-regression.png')});await context.close();
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});

test('migration backup failure restores content without replacing the original durable draft',async()=>{
 for(const failure of ['read','write']){
  const legacy={layoutMode:'overlap',panelContent:{panel2_3:{type:'web',url:'https://example.invalid/original'}}},raw=JSON.stringify(legacy),stored=new Map([['obs-overlay-config',raw]]),bundle={disabled:true},reset={disabled:true};let saves=0,lastStatus;
  const context={pagePath:'file:///settings.html',guideReturnKey:'obs-overlay-guide-return',sessionStorage:{getItem:()=>null,removeItem(){}},structuredClone,sourceConfig:{},localStorage:{getItem(key){if(failure==='read'&&key==='obs-overlay-before-fixed-columns')throw new Error('SecurityError');return stored.get(key)??null;},setItem(){throw new Error('QuotaExceededError');}},restoredSettings:(_source,saved)=>saved,normalize:structuredClone,config:{},migrationBackupFailed:false,storageWarning:'',draftReady:false,missingUploads:new Set(),uploads:new Map(),uploadStorage:{restore:async()=>({missing:[],entries:new Map()}),save(){saves++;}},form:{inert:false},document:{querySelectorAll:()=>[]},byId:id=>id==='bundle'?bundle:reset,showStatus(message){lastStatus=message;},renderGlobal(){},renderPlacement(){},renderEditor(){},current(){return context.config;},liveConfig:value=>value,savedConfig:value=>value,renderLegacyConnections(){},syncRangeProgress(){},syncCamera(){},drawHits(){},send(){},frame:{},sourceFingerprint:''};
  const applyStart=source.indexOf('  function apply('),applyEnd=source.indexOf('  function selectPanel(',applyStart),restoreStart=source.indexOf('  async function restoreDraft('),restoreEnd=source.indexOf('  function recoverDraft(',restoreStart);
  vm.runInNewContext(source.slice(applyStart,applyEnd)+source.slice(restoreStart,restoreEnd),context);await context.restoreDraft();
  assert.deepEqual(context.config,legacy);assert.equal(context.migrationBackupFailed,true);assert.equal(context.draftReady,true);assert.equal(context.form.inert,false);assert.equal(bundle.disabled,false);assert.equal(reset.disabled,false);assert.equal(saves,0);assert.equal(stored.get('obs-overlay-config'),raw);assert.match(lastStatus,/ZIP/);
  context.config.panelContent.panel2_3.url='https://example.invalid/edited';context.apply();assert.equal(saves,0);assert.equal(stored.get('obs-overlay-config'),raw);
 }
});
