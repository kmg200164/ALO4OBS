const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {create}=require('../template/upload-storage.js');
const scope='file:///template/settings.html';
function fixture(){
  const records=new Map(),local=new Map(),warnings=[];let sharedQueue=Promise.resolve();
  const locks={request(_name,job){const result=sharedQueue.then(job);sharedQueue=result.catch(()=>{});return result;}};
  return {records,local,warnings,locks,storage:{setItem:(key,value)=>local.set(key,value)},assets:{
    async putMany(entries){for(const [key,value] of entries)records.set(key,structuredClone(value));},
    async get(key){return records.get(key);},async remove(ids){for(const id of ids)records.delete(id);}
  }};
}
function draft(){return {layoutVersion:4,globalStyle:{background:{mode:'file',url:'assets/background-whole.png'}},backgroundImage:'assets/background-whole.png',panelContent:{custom1:{type:'media',url:'assets/custom1.webm'}},regionBackgrounds:{game:{image:'assets/background-game.png'}}};}
function files(){return new Map([['whole',{path:'assets/background-whole.png',file:new Blob([Uint8Array.from([1,2,3])],{type:'image/png'}),url:'data:image/png;base64,AQID'}],['custom1',{path:'assets/custom1.webm',file:new Blob([Uint8Array.from([4,5,6])],{type:'video/webm'})}],['region-game',{path:'assets/background-game.png',file:new Blob([Uint8Array.from([7,8,9])],{type:'image/png'})}]]);}
function controller(f,overrides={}){return create({...f,scope,onWarning:message=>f.warnings.push(message),...overrides});}
test('reopening restores image, video and region bytes; config keeps file mode and no data URLs',async()=>{
  const f=fixture(),first=controller(f),input=draft();
  assert.equal(await first.save(input,files(),'source'),true);
  const saved=JSON.parse(f.local.get('obs-overlay-config'));
  assert.equal(saved.globalStyle.background.mode,'file');assert.equal(saved._sourceFingerprint,'source');
  assert.equal(JSON.stringify(saved).includes('data:'),false);assert.equal(input._localUploads,undefined);
  const reopened=controller(f),restored=await reopened.restore(saved);
  assert.deepEqual(restored.missing,[]);assert.equal(restored.entries.size,3);
  for(const [key,bytes] of [['whole',[1,2,3]],['custom1',[4,5,6]],['region-game',[7,8,9]]])assert.deepEqual(Array.from(new Uint8Array(await restored.entries.get(key).file.arrayBuffer())),bytes);
});
test('ZIP export after reopening uses restored bytes and preserves its snapshot through reset',async()=>{
  const f=fixture(),first=controller(f);await first.save(draft(),files(),'source');
  const saved=JSON.parse(f.local.get('obs-overlay-config')),restored=await controller(f).restore(saved);
  const preview=fs.readFileSync(require.resolve('../template/preview.js'),'utf8');
  const start=preview.indexOf("  byId('bundle').onclick=async()=>{"),end=preview.indexOf("  frame.addEventListener('load'",start);
  let entries;const bundle={},status={},keys=['game','custom1','custom2','custom3','chat','translation','hand'];
  const data={...saved,layout:Object.fromEntries(keys.map(key=>[key,{}]))};
  const context={uploads:restored.entries,keys,status,current:()=>structuredClone(data),byId:()=>bundle,window:{OBS_EXPORT_RUNTIME:{}},
    alphaMask:async(_,name)=>({name,bytes:new Uint8Array([0])}),OverlayPack:{settingsEntries:()=>[],zip:input=>{entries=input;return new Uint8Array([0]);}},
    Uint8Array,Blob,URL:{createObjectURL:()=> 'blob:zip',revokeObjectURL(){}},document:{createElement:()=>({click(){}})},setTimeout(){}};
  vm.runInNewContext(preview.slice(start,end),context);const exporting=bundle.onclick();restored.entries.clear();await exporting;
  assert.equal(entries.filter(entry=>/^assets\/(background|custom1)/.test(entry.name)&&!entry.name.endsWith('-alpha-mask.png')).length,3);
  assert.deepEqual(Array.from(entries.find(entry=>entry.name==='assets/custom1.webm').bytes),[4,5,6]);
});
test('quota failure keeps the previous complete draft and reports session-only persistence',async()=>{
  const f=fixture(),first=controller(f);await first.save(draft(),files(),'original');
  const prior=f.local.get('obs-overlay-config'),failed=controller(f,{assets:{...f.assets,putMany:async()=>{throw new Error('QuotaExceededError');}}});
  assert.equal(await failed.save({...draft(),name:'new'},files(),'new'),false);
  assert.equal(f.local.get('obs-overlay-config'),prior);assert.match(f.warnings.at(-1),/현재 창에서만/);
});
test('serial commits prevent delayed older uploads from overwriting a newer file or reset',async()=>{
  const f=fixture();let release;const gate=new Promise(resolve=>{release=resolve;});let writes=0;
  const api=controller(f,{assets:{...f.assets,async putMany(entries){if(++writes===1)await gate;await f.assets.putMany(entries);}}});
  const first=api.save(draft(),files(),'source'),second=api.save({...draft(),name:'replacement'},files(),'source');
  api.reset();const reset=api.save({layoutVersion:4,backgroundImage:'',globalStyle:{background:{mode:'solid'}}},new Map(),'source');
  release();await Promise.all([first,second,reset]);
  const saved=JSON.parse(f.local.get('obs-overlay-config'));
  assert.equal(saved.globalStyle.background.mode,'solid');assert.equal(saved._localUploads,undefined);assert.equal(f.records.size,0);
});
test('missing stored bytes are reported so the editor cannot silently overwrite the complete draft',async()=>{
  const f=fixture(),api=controller(f);await api.save(draft(),files(),'source');
  const saved=JSON.parse(f.local.get('obs-overlay-config'));f.records.delete(saved._localUploads[0].id);
  const restored=await controller(f).restore(saved);assert.deepEqual(restored.missing,['whole']);
  assert.equal(f.local.get('obs-overlay-config'),JSON.stringify(saved));
  const preview=fs.readFileSync(require.resolve('../template/preview.js'),'utf8');assert.match(preview,/draftReady&&!missingUploads\.size/);
});
test('new exported source takes precedence over a durable browser draft without applying its upload manifest',async()=>{
  const f=fixture(),api=controller(f);await api.save(draft(),files(),'old source');
  const saved=JSON.parse(f.local.get('obs-overlay-config')),preview=fs.readFileSync(require.resolve('../template/preview.js'),'utf8');
  const start=preview.indexOf('  function restoredSettings('),end=preview.indexOf('  function propertyRow(',start);
  const exported={layoutVersion:4,layout:{},name:'exported'},context={defaults:{},OverlayEvents:{validateLayout(){}}};
  vm.runInNewContext(preview.slice(start,end),context);
  assert.equal(context.restoredSettings(exported,saved,saved._sourceFingerprint),exported);
  assert.match(preview,/if\(restored===saved\)/);
});
test('failed localStorage commit does not delete bytes referenced by the previous draft',async()=>{
  const f=fixture(),api=controller(f);await api.save(draft(),files(),'source');
  const prior=f.local.get('obs-overlay-config'),ids=JSON.parse(prior)._localUploads.map(item=>item.id);
  const broken=controller(f,{storage:{setItem(){throw new Error('storage blocked');}}});
  await broken.restore(JSON.parse(prior));assert.equal(await broken.save({layoutVersion:4},new Map(),'source'),false);
  assert.ok(ids.every(id=>f.records.has(id)));assert.equal(f.local.get('obs-overlay-config'),prior);
});

test('another open tab can save a previously restored file after replacement',async()=>{
  const f=fixture(),a=controller(f);await a.save(draft(),files(),'source');
  const old=JSON.parse(f.local.get('obs-overlay-config')),b=controller(f),restored=await b.restore(old);
  await a.save({...draft(),name:'new file'},files(),'source');
  assert.ok(old._localUploads.every(item=>f.records.has(item.id)));
  assert.equal(await b.save({...old,name:'old tab edit'},restored.entries,'source'),true);
  assert.deepEqual((await controller(f).restore(JSON.parse(f.local.get('obs-overlay-config')))).missing,[]);
});
test('stale restored tab repersists its bytes after another tab resets',async()=>{
  const f=fixture(),a=controller(f);await a.save(draft(),files(),'source');
  const old=JSON.parse(f.local.get('obs-overlay-config')),b=controller(f),restored=await b.restore(old);
  a.reset();await a.save({layoutVersion:4},new Map(),'source');assert.equal(f.records.size,0);
  assert.equal(await b.save(old,restored.entries,'source'),true);
  const reopened=await controller(f).restore(JSON.parse(f.local.get('obs-overlay-config')));
  assert.deepEqual(reopened.missing,[]);assert.deepEqual(Array.from(new Uint8Array(await reopened.entries.get('whole').file.arrayBuffer())),[1,2,3]);
});
test('reset without shared locks clears references but retains bytes for other open tabs',async()=>{
  const f=fixture(),a=controller(f,{locks:null});await a.save(draft(),files(),'source');
  const prior=f.local.get('obs-overlay-config');a.reset();await a.save({layoutVersion:4},new Map(),'source');
  assert.equal(JSON.parse(f.local.get('obs-overlay-config'))._localUploads,undefined);assert.equal(f.records.size,3);
  assert.deepEqual((await controller(f,{locks:null}).restore(JSON.parse(prior))).missing,[]);
});
test('empty bytes cannot replace the last durable draft and empty stored files are missing',async()=>{
  const f=fixture(),a=controller(f);await a.save(draft(),files(),'source');
  const prior=f.local.get('obs-overlay-config'),bad=files();bad.get('whole').file=new Blob([],{type:'image/png'});
  assert.equal(await a.save(draft(),bad,'source'),false);assert.equal(f.local.get('obs-overlay-config'),prior);
  const saved=JSON.parse(prior);f.records.set(saved._localUploads[0].id,new Blob([]));
  assert.deepEqual((await controller(f).restore(saved)).missing,['whole']);
});
test('empty selected upload is rejected before reading or replacing a valid file',async()=>{
  const preview=fs.readFileSync(require.resolve('../template/preview.js'),'utf8'),start=preview.indexOf('  async function handleUpload('),end=preview.indexOf('  async function alphaMask(',start);
  const existing={file:new Blob(['valid']),path:'assets/background-whole.png'},uploads=new Map([['whole',existing]]);let warning,reads=0;
  const context={uploads,showStatus:(message,error)=>{warning={message,error};},readUpload:()=>{reads++;}};
  vm.runInNewContext(preview.slice(start,end),context);await context.handleUpload({files:[{size:0,name:'empty.png'}],dataset:{upload:'whole'}});
  assert.equal(reads,0);assert.equal(uploads.get('whole'),existing);assert.equal(warning.error,true);assert.match(warning.message,/빈 파일/);
});
test('malformed draft recovery enables export and reset without overwriting the stored draft',()=>{
  const preview=fs.readFileSync(require.resolve('../template/preview.js'),'utf8'),start=preview.indexOf('  function recoverDraft('),end=preview.indexOf('  void restoreDraft()',start);
  const bundle={disabled:true},reset={disabled:true},form={inert:true},oldFile={path:'bad'},uploads=new Map([['whole',oldFile]]),missingUploads=new Set(['whole']);let writes=0,status;
  const context={config:{invalid:true},selected:'game',defaults:{layout:{game:{}}},normalize:value=>structuredClone(value),uploads,missingUploads,draftReady:false,form,
    byId:id=>id==='bundle'?bundle:reset,renderGlobal(){},renderPlacement(){},renderEditor(){},drawHits(){},send(){},frame:{},liveConfig:value=>value,
    showStatus:(message,error)=>{status={message,error};},uploadStorage:{save(){writes++;}}};
  vm.runInNewContext(preview.slice(start,end),context);context.recoverDraft(new Error('invalid sizing'));
  assert.equal(context.draftReady,true);assert.equal(bundle.disabled,false);assert.equal(reset.disabled,false);assert.equal(form.inert,false);assert.equal(writes,0);assert.equal(status.error,true);
});
test('reset after failed boot always enables persistence and export',()=>{
  const preview=fs.readFileSync(require.resolve('../template/preview.js'),'utf8'),start=preview.indexOf('  function reset(){'),end=preview.indexOf("  form.addEventListener('input'",start);
  const bundle={disabled:true},button={disabled:true};let resets=0,applied;
  const context={draftReady:false,form:{inert:true},byId:id=>id==='bundle'?bundle:button,uploadStorage:{reset(){resets++;}},uploadRequests:new Map(),missingUploads:new Set(['whole']),storageWarning:'failed',uploads:new Map(),cameraActive:false,cameraController:null,
    defaults:{},normalize:value=>value,selected:null,renderGlobal(){},renderPlacement(){},renderEditor(){},apply:message=>{applied=message;}};
  vm.runInNewContext(preview.slice(start,end),context);context.reset();
  assert.equal(context.draftReady,true);assert.equal(context.form.inert,false);assert.equal(bundle.disabled,false);assert.equal(button.disabled,false);assert.equal(resets,1);assert.ok(applied);
});

test('denied shared lock reports session-only persistence without an unhandled rejection',async()=>{
  const f=fixture(),api=controller(f,{locks:{request(){return Promise.reject(new Error('SecurityError'));}}});
  assert.equal(await api.save(draft(),files(),'source'),false);assert.equal(f.local.size,0);assert.match(f.warnings.at(-1),/현재 창에서만/);
});
