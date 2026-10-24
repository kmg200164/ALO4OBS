const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../template/preview.js'),'utf8');
const start=source.indexOf("  byId('bundle').onclick=async()=>{"),end=source.indexOf("  frame.addEventListener('load'",start);

function harness(options={}){
 let releaseMasks,captured,downloadName;
 const maskGate=new Promise(resolve=>{releaseMasks=resolve;});
 const oldFile={async arrayBuffer(){return Uint8Array.from([10,20,30]).buffer;}};
 const uploads=new Map([['whole',{path:'assets/background-whole.png',file:oldFile}]]);
 const keys=['game','custom1','custom2','custom3','chat','translation','hand'];
 const data={layoutMode:options.layoutMode||'bento',backgroundImage:'assets/background-whole.png',layout:Object.fromEntries(keys.map(key=>[key,{}]))};
 if(options.restored)uploads.clear();
 const bundle={},status={};
 const context={OverlayEvents:require('../template/events.js'),showStatus:(message,error)=>{status.textContent=message;status.error=error;},fetch:options.fetch,uploads,status,keys,localized:s=>s,Uint8Array,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){},
  byId:id=>id==='bundle'?bundle:null,current:()=>structuredClone(data),
  alphaMask:async(_,name)=>{await maskGate;return {name,bytes:new Uint8Array([1])};},
  OverlayPack:{scriptNames:require('../template/pack.js').scriptNames,isolateRuntime:entries=>entries,settingsEntries:input=>[{name:'obs-settings.json',bytes:new TextEncoder().encode(JSON.stringify(input))}],zip:entries=>{captured=entries;return new Uint8Array([0]);}},
  document:{createElement:()=>({click(){downloadName=this.download;}})},window:{OBS_EXPORT_RUNTIME:{},showSaveFilePicker:options.showSaveFilePicker}
 };
 vm.runInNewContext(source.slice(start,end),context);
 return {uploads,bundle,status,data,releaseMasks,get captured(){return captured;},get downloadName(){return downloadName;}};
}

test('reset during mask generation cannot remove assets referenced by the captured ZIP config',async()=>{
 const h=harness(),exporting=h.bundle.onclick();h.uploads.clear();h.releaseMasks();await exporting;
 const image=h.captured.find(entry=>entry.name==='assets/background-whole.png');
 assert.ok(image,'captured configuration must retain its uploaded image');
 assert.deepEqual(Array.from(image.bytes),[10,20,30]);
});

test('a replacement upload during export cannot substitute bytes for the captured configuration',async()=>{
 const h=harness(),exporting=h.bundle.onclick();
 h.uploads.set('whole',{path:'assets/background-whole.png',file:{async arrayBuffer(){return Uint8Array.from([90,91]).buffer;}}});
 h.releaseMasks();await exporting;
 assert.deepEqual(Array.from(h.captured.find(entry=>entry.name==='assets/background-whole.png').bytes),[10,20,30]);
});


test('re-export includes restored local assets that are no longer in the upload map',async()=>{
 const h=harness({restored:true,fetch:async path=>{assert.equal(path,'assets/background-whole.png');return {ok:true,async arrayBuffer(){return Uint8Array.from([7,8,9]).buffer;}};}});
 h.releaseMasks();await h.bundle.onclick();
 assert.deepEqual(Array.from(h.captured.find(entry=>entry.name==='assets/background-whole.png').bytes),[7,8,9]);
});

test('unreadable restored media prevents an incomplete ZIP download',async()=>{
 const h=harness({restored:true,fetch:async()=>{throw new Error('blocked');}});
 h.releaseMasks();await h.bundle.onclick();
 assert.equal(h.captured,undefined);
 assert.match(h.status.textContent,/Re-upload local files/);
 assert.equal(h.status.error,true);
});

test('native picker is not opened before the complete ZIP download',async()=>{
 let pickerCalls=0;
 const h=harness({showSaveFilePicker:async()=>{pickerCalls++;throw new Error('Native save must not create an empty file');}});
 const exporting=h.bundle.onclick();assert.equal(h.downloadName,undefined);
 h.releaseMasks();await exporting;
 assert.equal(pickerCalls,0);assert.equal(h.downloadName,'Settings-Bento.zip');
});

test('failed asset collection never opens a picker or downloads an empty ZIP',async()=>{
 let pickerCalls=0;
 const h=harness({restored:true,showSaveFilePicker:async()=>{pickerCalls++;},fetch:async()=>{throw new Error('blocked');}});
 h.releaseMasks();await h.bundle.onclick();
 assert.equal(pickerCalls,0);assert.equal(h.downloadName,undefined);assert.equal(h.captured,undefined);assert.equal(h.status.error,true);
});

test('Bento to Overlap to Bento export captures the type before asynchronous ZIP generation',async()=>{
 for(const mode of ['bento','overlap','bento']){
  const h=harness({layoutMode:mode}),exporting=h.bundle.onclick();
  h.data.layoutMode=mode==='bento'?'overlap':'bento';
  h.releaseMasks();await exporting;
  assert.equal(h.downloadName,mode==='bento'?'Settings-Bento.zip':'Settings-Overlap.zip');
  assert.equal(JSON.parse(new TextDecoder().decode(h.captured[0].bytes)).layoutMode,mode);
 }
});

test('completion message names the layout-specific OBS script',async()=>{
 for(const [mode,script] of [['bento','script-bento.lua'],['overlap','script-overlap.lua']]){
  const h=harness({layoutMode:mode});h.releaseMasks();await h.bundle.onclick();
  assert.ok(h.status.textContent.includes(script),mode);assert.ok(!h.status.textContent.includes('OBS-script.lua'),mode);
 }
});
