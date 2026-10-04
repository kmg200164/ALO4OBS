const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../template/preview.js'),'utf8');
const start=source.indexOf('  async function readUpload('),end=source.indexOf('  async function handleUpload(',start);
function harness(){
 const pending=[],uploadRequests=new Map(),status={textContent:''};
 const context={uploadRequests,status,window:{KMGI18n:{localize:()=> 'Could not read the file. Select it again.'}},previewData:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))};
 vm.runInNewContext(source.slice(start,end),context);return {...context,pending};
}
test('reset prevents a late FileReader result from restoring an old upload',async()=>{
 const h=harness(),pending=h.readUpload('whole',{});h.uploadRequests.clear();h.pending[0].resolve('data:old');
 assert.equal(await pending,null);
});
test('the latest file selection wins even when reads finish out of order',async()=>{
 const h=harness(),first=h.readUpload('whole',{}),second=h.readUpload('whole',{});
 h.pending[1].resolve('data:new');assert.equal(await second,'data:new');
 h.pending[0].resolve('data:old');assert.equal(await first,null);
});
test('file read failures return a localized status without an unhandled rejection',async()=>{
 const h=harness(),pending=h.readUpload('custom1',{});h.pending[0].reject(new Error('read failed'));
 assert.equal(await pending,null);assert.equal(h.status.textContent,'Could not read the file. Select it again.');
});
test('a stale failed file read does not overwrite the newest operation status',async()=>{
 const h=harness(),first=h.readUpload('whole',{}),second=h.readUpload('whole',{});
 h.pending[1].resolve('data:new');await second;h.status.textContent='Current file ready';
 h.pending[0].reject(new Error('read failed'));await first;assert.equal(h.status.textContent,'Current file ready');
});
