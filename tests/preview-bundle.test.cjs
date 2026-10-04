const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../preview.js'),'utf8');
const start=source.indexOf("  byId('bundle').onclick=async()=>{"),end=source.indexOf("  frame.addEventListener('load'",start);

function harness(){
 let releaseMasks,captured;
 const maskGate=new Promise(resolve=>{releaseMasks=resolve;});
 const oldFile={async arrayBuffer(){return Uint8Array.from([10,20,30]).buffer;}};
 const uploads=new Map([['whole',{path:'assets/background-whole.png',file:oldFile}]]);
 const keys=['game','custom1','custom2','custom3','chat','translation','hand'];
 const data={backgroundImage:'assets/background-whole.png',layout:Object.fromEntries(keys.map(key=>[key,{}]))};
 const bundle={},status={};
 const context={uploads,status,keys,Uint8Array,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout(){},
  byId:id=>id==='bundle'?bundle:null,current:()=>structuredClone(data),
  alphaMask:async(_,name)=>{await maskGate;return {name,bytes:new Uint8Array([1])};},
  OverlayPack:{settingsEntries:input=>[{name:'obs-settings.json',bytes:new TextEncoder().encode(JSON.stringify(input))}],zip:entries=>{captured=entries;return new Uint8Array([0]);}},
  document:{createElement:()=>({click(){}})},window:{}
 };
 vm.runInNewContext(source.slice(start,end),context);
 return {uploads,bundle,status,releaseMasks,get captured(){return captured;}};
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
