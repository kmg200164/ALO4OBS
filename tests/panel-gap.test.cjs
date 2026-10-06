const test=require('node:test');
const assert=require('node:assert/strict');
const api=require('../template/events.js');
const pack=require('../template/pack.js');
const keys=Object.keys(api.resolveLayout());
const content=Object.fromEntries(keys.map(key=>[key,{type:'none',url:''}]));
const fixed=width=>({widthMode:'fixed',width});
function exported(input){return JSON.parse(new TextDecoder().decode(pack.settingsEntries({layoutVersion:4,panelContent:content,...input})[0].bytes));}
// Every edge and neighbor distance equals the gap, and nothing overlaps or clips.
function assertSpacing(layout,gap){
 api.validateLayout(layout);
 const {game,custom1,custom2,custom3,chat,translation,hand}=layout;
 assert.equal(game.x,gap);assert.equal(game.y,gap);assert.equal(chat.y,gap);
 assert.equal(chat.x+chat.width,1920-gap);assert.equal(hand.y+hand.height,1080-gap);assert.equal(custom1.y+custom1.height,1080-gap);
 assert.equal(game.x+game.width+gap,chat.x);assert.equal(custom3.x+custom3.width+gap,chat.x);
 assert.equal(game.y+game.height+gap,custom1.y);
 assert.equal(custom1.x+custom1.width+gap,custom2.x);assert.equal(custom2.x+custom2.width+gap,custom3.x);
 assert.equal(chat.y+chat.height+gap,translation.y);assert.equal(translation.y+translation.height+gap,hand.y);
}
test('every gap step spaces panels and canvas edges by exactly that value',()=>{
 assert.deepEqual(api.panelGaps,[8,16,24,32,48]);
 for(const gap of api.panelGaps)for(const aspect of [undefined,'16:9']){
  const layout=api.autoLayout({placement:api.defaultPlacement(),sizing:aspect?{game:{aspect}}:undefined,gap});
  assertSpacing(layout,gap);
  assert.equal(layout.chat.width,440);
  if(aspect)assert.equal(layout.game.height,Math.floor(layout.game.width*9/16));
 }
});
test('wide (32) keeps the existing geometry and missing or invalid values restore it',()=>{
 for(const gap of [32,undefined,7,'32',null])assert.deepEqual(api.autoLayout({placement:api.defaultPlacement(),gap}),api.resolveLayout());
 assert.equal(api.normalizeGap(undefined),32);assert.equal(api.normalizeGap(12),32);
});
test('extra narrow (8) neither clips nor overlaps, including fixed sizes and hidden panels',()=>{
 const layout=api.autoLayout({placement:api.defaultPlacement(),gap:8,sizing:{game:{aspect:'16:9'}}});
 assert.deepEqual(layout.game,{x:8,y:8,width:1456,height:819});
 assert.deepEqual(layout.chat,{x:1472,y:8,width:440,height:349});
 for(let bits=0;bits<128;bits++){
  const enabled=Object.fromEntries(keys.map((key,i)=>[key,!!(bits&(1<<i))]));
  const boxes=api.autoLayout({placement:api.defaultPlacement(),enabled,gap:8,sizing:{custom1:fixed(700)}});api.validateLayout(boxes);
  const active=keys.filter(key=>enabled[key]);
  for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){const a=boxes[active[i]],b=boxes[active[j]];assert.ok(a.x+a.width+8<=b.x||b.x+b.width+8<=a.x||a.y+a.height+8<=b.y||b.y+b.height+8<=a.y);}
 }
});
test('extra wide (48) Sub auto widths, limits and warnings follow the gap',()=>{
 const layout=api.autoLayout({placement:api.defaultPlacement(),gap:48,sizing:{custom1:fixed(500)}});
 assertSpacing(layout,48);
 assert.equal(layout.custom1.width,500);assert.equal(layout.custom2.width+layout.custom3.width,1336-96-500);
 const bounds=api.sizingBounds({placement:api.defaultPlacement(),gap:48,sizing:{custom1:fixed(500),custom2:fixed(300)}},'custom3','width');
 assert.equal(bounds.max,1336-96-800);
 assert.equal(api.subWidthWarning({panelGap:48,panelSizing:{custom1:fixed(500),custom2:fixed(300),custom3:fixed(440)}}),null);
 assert.equal(api.subWidthWarning({panelGap:48,panelSizing:{custom1:fixed(500),custom2:fixed(300),custom3:fixed(400)}}),'gap');
 assert.equal(api.subWidthWarning({panelGap:48,panelSizing:{custom1:fixed(500),custom2:fixed(300),custom3:fixed(441)}}),'overflow');
});
test('settings export validates the gap and gives OBS boxes that reflect it',()=>{
 for(const gap of api.panelGaps){
  const saved=exported({panelGap:gap,panelPlacement:api.defaultPlacement()});
  assert.equal(saved.panelGap,gap);
  assert.deepEqual(saved.layout,api.autoLayout({placement:api.defaultPlacement(),gap}));
  assertSpacing(saved.layout,gap);
 }
 const old=exported({panelPlacement:api.defaultPlacement()});
 assert.equal(old.panelGap,32);assert.deepEqual(old.layout,api.resolveLayout());
 for(const gap of [0,12,'16',null])assert.throws(()=>exported({panelGap:gap}),/Invalid panel gap/);
});
