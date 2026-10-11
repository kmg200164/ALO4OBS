const test=require('node:test'),assert=require('node:assert/strict');
const pack=require('../template/pack.js');
test('type snapshots keep both layouts independent when extracted to the same directory',()=>{
 const files=new Map();
 for(const [mode,value] of [['bento','Bento config'],['overlap','Overlap config'],['bento','Updated Bento']]){
  const entries=[{name:'OBS-script.lua',bytes:new TextEncoder().encode('return script_path()')},{name:'config.json',bytes:new TextEncoder().encode(value)},{name:'assets/game-alpha-mask.png',bytes:new Uint8Array([value.length])}];
  pack.isolateRuntime(entries,mode);
  for(const entry of entries)files.set(entry.name,entry.bytes);
  assert.match(new TextDecoder().decode(files.get('OBS-script.lua')),new RegExp('layouts/'+mode+'/'));
 }
 assert.equal(new TextDecoder().decode(files.get('layouts/bento/config.json')),'Updated Bento');
 assert.equal(new TextDecoder().decode(files.get('layouts/overlap/config.json')),'Overlap config');
 assert.ok(files.has('layouts/overlap/assets/game-alpha-mask.png'));
 assert.throws(()=>pack.isolateRuntime([],'invalid'));
});
