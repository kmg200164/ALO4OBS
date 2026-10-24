const test=require('node:test'),assert=require('node:assert/strict');
const pack=require('../template/pack.js');
test('type snapshots keep both layouts independent when extracted to the same directory',()=>{
 const files=new Map();
 for(const [mode,value] of [['bento','Bento config'],['overlap','Overlap config'],['bento','Updated Bento']]){
  const entries=[{name:'OBS-script.lua',bytes:new TextEncoder().encode('return script_path()')},{name:'config.json',bytes:new TextEncoder().encode(value)},{name:'assets/game-alpha-mask.png',bytes:new Uint8Array([value.length])}];
  pack.isolateRuntime(entries,mode);
  for(const entry of entries)files.set(entry.name,entry.bytes);
  assert.deepEqual(entries.filter(entry=>!entry.name.includes('/')).map(entry=>entry.name),[mode==='bento'?'script-bento.lua':'script-overlap.lua']);
  assert.ok(entries.every(entry=>!entry.name.includes('/')||entry.name.startsWith('files/'+mode+'/')));
  const scriptName=mode==='bento'?'script-bento.lua':'script-overlap.lua';
  assert.match(new TextDecoder().decode(files.get(scriptName)),new RegExp('files/'+mode+'/'));
  assert.ok(!entries.some(entry=>entry.name==='OBS-script.lua'),'the generic script name is no longer exported');
 }
 // Both scripts coexist in one extraction folder, each bound to its own runtime directory.
 assert.ok(files.has('script-bento.lua')&&files.has('script-overlap.lua'));
 assert.ok(!files.has('OBS-script.lua'));
 assert.doesNotMatch(new TextDecoder().decode(files.get('script-bento.lua')),/files\/overlap\//);
 assert.doesNotMatch(new TextDecoder().decode(files.get('script-overlap.lua')),/files\/bento\//);
 assert.equal(new TextDecoder().decode(files.get('files/bento/config.json')),'Updated Bento');
 assert.equal(new TextDecoder().decode(files.get('files/overlap/config.json')),'Overlap config');
 assert.ok(files.has('files/overlap/assets/game-alpha-mask.png'));
 assert.throws(()=>pack.isolateRuntime([],'invalid'));
});
