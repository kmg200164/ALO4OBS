const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const preview=fs.readFileSync(path.join(root,'preview.js'),'utf8');
const html=fs.readFileSync(path.join(root,'preview.html'),'utf8');
const css=fs.readFileSync(path.join(root,'preview.css'),'utf8');
const overlay=fs.readFileSync(path.join(root,'overlay.js'),'utf8');
const background=fs.readFileSync(path.join(root,'background.js'),'utf8');
const keys=['game','custom1','custom2','custom3','chat','translation','hand'];
const start=preview.indexOf('  function migratePanelContent(');
const end=preview.indexOf('  function normalize(input)',start);
const context={keys};
vm.runInNewContext(preview.slice(start,end),context);
const migrate=input=>JSON.parse(JSON.stringify(context.migratePanelContent(input)));

test('seven independent content entries preserve a version-4 configuration',()=>{
  const panelContent=Object.fromEntries(keys.map((key,index)=>[key,{type:index%2?'web':'source',url:index%2?`https://example.com/${index}`:''}]));
  const result=migrate({layoutVersion:4,panelContent});
  assert.deepEqual(result,panelContent);
  assert.equal(Object.keys(result).length,7);
});

test('version-3 URLs and media migrate to their existing panel geometry keys',()=>{
  const result=migrate({layoutVersion:3,chatUrl:'https://example.com/chat',translationUrl:'https://example.com/subtitles',cameraMode:'camera',slotContent:{custom1:'image',custom2:'browser',custom3:'source'},customSlotMedia:{custom1:{url:'assets/promo.png'},custom2:{url:'https://example.com/widget'}}});
  assert.deepEqual(result.game,{type:'source',url:''});
  assert.deepEqual(result.custom1,{type:'media',url:'assets/promo.png'});
  assert.deepEqual(result.custom2,{type:'web',url:'https://example.com/widget'});
  assert.deepEqual(result.custom3,{type:'source',url:''});
  assert.deepEqual(result.chat,{type:'web',url:'https://example.com/chat'});
  assert.deepEqual(result.translation,{type:'web',url:'https://example.com/subtitles'});
  assert.deepEqual(result.hand,{type:'source',url:''});
});

test('settings preview numbers all seven panels without adding numbers to the OBS overlay',()=>{
  for(let index=1;index<=7;index++)assert.match(html,new RegExp(`<option value="[^"]+">패널 ${index}<\\/option>`));
  assert.match(preview,/class="panel-number"/);
  assert.match(css,/\.panel-number\{/);
  assert.doesNotMatch(fs.readFileSync(path.join(root,'overlay.html'),'utf8'),/패널 [1-7]/);
  assert.match(overlay,/document\.body\.classList\.contains\('preview-mode'\)/);
  assert.match(background,/config\.layoutVersion>=3\?OverlayEvents\.validateLayout/);
});
