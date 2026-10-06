const test = require('node:test');
const assert = require('node:assert/strict');
const api = require('../template/events.js');
const keys = Object.keys(api.resolveLayout());
const fixed = (axis, value) => ({[axis + 'Mode']:'fixed', [axis]:value});
function layout(sizing={},enabled={},placement=api.defaultPlacement()) {
 return api.autoLayout({placement,enabled,sizing});
}
function separate(boxes,enabled={}) {
 api.validateLayout(boxes);
 const active=keys.filter(key=>enabled[key]!==false);
 for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++) {
  const a=boxes[active[i]],b=boxes[active[j]];
  assert.ok(a.x+a.width+32<=b.x||b.x+b.width+32<=a.x||a.y+a.height+32<=b.y||b.y+b.height+32<=a.y,active[i]+' overlaps '+active[j]);
 }
}
test('automatic dimensions preserve legacy geometry and normalize complete defaults',()=>{
 const sizing=api.normalizeSizing();
 assert.equal(sizing.game.widthMode,'auto');assert.equal(sizing.game.width,1384);
 assert.equal(sizing.custom1.heightMode,'auto');assert.equal(sizing.custom1.height,206);
 assert.deepEqual(layout(sizing),api.resolveLayout());
 for(let bits=0;bits<128;bits++){
  const enabled=Object.fromEntries(keys.map((key,i)=>[key,!!(bits&(1<<i))]));
  assert.deepEqual(layout(sizing,enabled),api.autoLayout({placement:api.defaultPlacement(),enabled}));
 }
});
test('fixed bottom width leaves the rest to automatic siblings',()=>{
 const boxes=layout({custom1:fixed('width',600)});
 assert.equal(boxes.custom1.width,600);
 assert.equal(boxes.custom2.width,360);assert.equal(boxes.custom3.width,360);
 assert.equal(boxes.custom2.x,664);separate(boxes);
});
test('right panels ignore saved fixed widths and fill their parent',()=>{
 const boxes=layout({chat:fixed('width',400),translation:fixed('width',300)});
 assert.equal(boxes.chat.width,440);assert.equal(boxes.translation.width,440);
 assert.equal(boxes.hand.width,440);assert.equal(boxes.game.width,1384);
 assert.equal(boxes.chat.x,1448);separate(boxes);
});
test('panels 2-4 ignore saved heights and follow the main panel height',()=>{
 const boxes=layout({game:fixed('height',593),custom1:fixed('height',300),custom2:fixed('height',120)});
 assert.equal(boxes.game.height,593);
 for(const key of ['custom1','custom2','custom3'])assert.equal(boxes[key].height,391);
 separate(boxes);
});
test('fixed vertical siblings share remaining right height with automatic panels',()=>{
 const boxes=layout({chat:fixed('height',400),hand:fixed('height',200)});
 assert.equal(boxes.chat.height,400);assert.equal(boxes.translation.height,352);assert.equal(boxes.hand.height,200);
 assert.equal(boxes.translation.y,464);assert.equal(boxes.hand.y,848);separate(boxes);
});
test('disabled fixed panels do not reserve any width or height',()=>{
 const enabled={custom1:false,chat:false};
 assert.deepEqual(layout({custom1:{...fixed('width',1800),...fixed('height',1000)},chat:{...fixed('width',1800),...fixed('height',1000)}},enabled),layout({},enabled));
});
test('all fixed siblings keep their sizes and unused trailing space',()=>{
 const boxes=layout({custom1:fixed('width',220),custom2:fixed('width',300),custom3:fixed('width',400)});
 assert.equal(boxes.custom1.width,220);assert.equal(boxes.custom2.width,300);assert.equal(boxes.custom3.width,400);
 assert.equal(boxes.custom3.x,616);separate(boxes);
});
test('fixed sizes work in reversed rows and reordered legacy layouts',()=>{
 const placement=api.defaultPlacement();placement.game.level2='bottom';
 const reversed=layout({game:fixed('height',600)}, {},placement);
 assert.equal(reversed.game.height,600);assert.equal(reversed.game.y,448);assert.equal(reversed.custom1.height,384);separate(reversed);
 const reordered=api.autoLayout({order:['chat','game','custom1','custom2','custom3','translation','hand'],sizing:{game:fixed('width',600)}});
 assert.equal(reordered.game.width,440);assert.equal(reordered.custom1.width,440);separate(reordered);
});
test('height overflow and invalid sizing are rejected; an overfull Sub row renders fitted',()=>{
 const fitted=layout({custom1:fixed('width',1000),custom2:fixed('width',1000)});separate(fitted);
 assert.ok(fitted.custom3.x+fitted.custom3.width<=1416);
 assert.throws(()=>api.autoLayout({placement:api.defaultPlacement(),sizing:{custom1:fixed('width',660),custom2:fixed('width',660)},strict:true}),/Fixed panel sizes exceed available/);
 assert.throws(()=>layout({game:fixed('height',900),custom1:fixed('height',200)}),/Fixed panel sizes exceed available/);
 assert.throws(()=>layout({chat:fixed('height',1000)}),/Fixed panel sizes exceed available/);
 for(const input of [null,[],{game:null},{unknown:{}},{game:{widthMode:'fill'}},{game:fixed('width',0)},{game:fixed('width',2.5)},{game:fixed('width',Infinity)},{game:fixed('height',1017)}])assert.throws(()=>api.normalizeSizing(input),/siz|width|height|panel/i);
});
test('active-panel limits preserve readable automatic siblings over all visibility combinations',()=>{
 for(let bits=0;bits<128;bits++){
  const enabled=Object.fromEntries(keys.map((key,i)=>[key,!!(bits&(1<<i))]));
  const reference=layout({},enabled);
  for(const key of keys.filter(key=>enabled[key]))for(const axis of ['width','height']){
   const range=api.sizingBounds({placement:api.defaultPlacement(),enabled},key,axis);
   assert.equal(range.min,axis==='width'&&api.canResizeWidth(key)?Math.min(reference[key].height,reference[key].width):Math.ceil(reference[key][axis]/2));assert.ok(range.max>=range.min);
   for(const value of [range.min,range.max]){
    const boxes=layout({[key]:fixed(axis,value)},enabled);separate(boxes,enabled);
    for(const peer of keys.filter(peer=>enabled[peer])){
     assert.ok(boxes[peer][axis]>=(axis==='width'&&api.canResizeWidth(peer)?Math.min(reference[peer].height,reference[peer].width):Math.ceil(reference[peer][axis]/2)));
     if(['chat','translation','hand'].includes(peer)){assert.equal(boxes[peer].x,1448);assert.ok(boxes[peer].width<=440);}
     else assert.ok(boxes[peer].x+boxes[peer].width<=1416);
    }
   }
  }
 }
});
test('usable bounds stay within fixed parents and track sibling counts and fixed peers',()=>{
 const options={placement:api.defaultPlacement(),sizing:{custom1:fixed('width',500),custom2:fixed('width',300),chat:fixed('width',400)}};
 assert.deepEqual(api.sizingBounds(options,'custom3','width'),{min:206,max:520});
 assert.deepEqual(api.sizingBounds({},'game','width'),{min:692,max:1384});
 assert.deepEqual(api.sizingBounds({},'game','height'),{min:389,max:881});
 assert.deepEqual(api.sizingBounds({},'chat','width'),{min:220,max:440});
 assert.deepEqual(api.sizingBounds({placement:api.defaultPlacement(),enabled:{custom2:false}},'custom1','width'),{min:206,max:1014});
 assert.deepEqual(api.sizingBounds({placement:api.defaultPlacement(),enabled:{custom2:false,custom3:false}},'custom1','width'),{min:206,max:1384});
 assert.throws(()=>api.sizingBounds({},'unknown','width'),/Invalid panel size/);
 assert.throws(()=>api.sizingBounds({},'game','depth'),/Invalid panel size/);
});
test('main height stays adjustable and ratio marks follow the other dimension',()=>{
 const boxes=layout({game:{...fixed('width',1000),...fixed('height',500)}});
 assert.equal(boxes.game.width,1384);assert.equal(boxes.game.height,500);separate(boxes);
 assert.deepEqual(api.aspectStops({width:440,height:250},'width',{min:220,max:660}),[{label:'1:1',value:250},{label:'16:9',value:444}]);
 assert.deepEqual(api.aspectStops({width:500,height:250},'height',{min:103,max:309}),[{label:'16:9',value:281}]);
 assert.deepEqual(api.aspectStops({width:500,height:300},'width',{min:220,max:660}),[{label:'1:1',value:300},{label:'16:9',value:533}]);
});

test('only panels 2, 3 and 4 can resize width; saved locked widths migrate to automatic',()=>{
 for(const key of keys){
  const editable=['custom1','custom2','custom3'].includes(key);
  assert.equal(api.canResizeWidth(key),editable);
  const sizing=api.normalizeSizing({[key]:{...fixed('width',300),...fixed('height',250)}});
  assert.equal(sizing[key].widthMode,editable?'fixed':'auto');
  assert.equal(api.canResizeHeight(key),!editable);
  assert.equal(sizing[key].heightMode,editable?'auto':'fixed');
  if(!editable)assert.equal(sizing[key].height,250);
 }
});

test('main aspect choices survive disabled lower panels and settings export',()=>{
 for(const aspect of ['auto','16:9','21:9','32:9'])for(const enabled of [{},{custom1:false,custom2:false,custom3:false}]){
  const sizing={game:{aspect}};
  const boxes=layout(sizing,enabled);
  assert.equal(boxes.game.width,1384);
  assert.equal(boxes.game.height,aspect==='auto'?(enabled.custom1===false?1016:778):Math.floor(1384*9/Number(aspect.split(':')[0])));
  separate(boxes,enabled);
  const pack=require('../template/pack.js');
  const saved=JSON.parse(new TextDecoder().decode(pack.settingsEntries({layoutVersion:4,panelPlacement:api.defaultPlacement(),panelEnabled:enabled,panelSizing:sizing,panelContent:Object.fromEntries(keys.map(key=>[key,{type:"none",url:""}]))})[0].bytes));
  assert.equal(saved.panelSizing.game.aspect,aspect);
  assert.deepEqual(saved.layout,boxes);
 }
 assert.throws(()=>api.normalizeSizing({game:{aspect:'4:3'}}),/aspect/);
});

test('main aspect uses its actual width in either row',()=>{
 for(const aspect of ['16:9','21:9','32:9'])for(const row of ['top','bottom']){
  const placement=api.defaultPlacement();placement.game.level2=row;
  const boxes=layout({game:{aspect}}, {}, placement);
  assert.equal(boxes.game.height,Math.floor(boxes.game.width*9/Number(aspect.split(':')[0])));
  separate(boxes);
 }
});

test('lower-panel minimum widths stay at the 16:9 baseline across main aspects',()=>{
 for(const aspect of ['auto','16:9','21:9','32:9'])for(const key of ['custom1','custom2','custom3']){
  const sizing={game:{aspect},[key]:fixed('width',206)};
  const options={placement:api.defaultPlacement(),sizing};
  assert.equal(api.sizingBounds(options,key,'width').min,206);
  const boxes=layout(sizing);assert.equal(boxes[key].width,206);separate(boxes);
  if(aspect==='16:9')assert.equal(boxes[key].height,206);
  const larger=layout({game:{aspect},[key]:fixed('width',500)});
  assert.equal(larger[key].width,500);
 }
});
