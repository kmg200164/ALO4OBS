const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const api = fs.existsSync(require('node:path').join(__dirname,'../template/events.js')) ? require('../template/events.js') : {};
test('same source event is deduplicated; other platforms remain distinct', () => {
 assert.equal(typeof api.createEventStore,'function');
 const store = api.createEventStore(3);
 const event = {platform:'chzzk',channelId:'a',id:'1',type:'chat',text:'hi'};
 assert.equal(store.accept(event),true); assert.equal(store.accept(event),false);
 assert.equal(store.accept({...event,platform:'twitch'}),true);
 assert.equal(store.items().length,2);
});
test('idless messages remain distinct and retained history is bounded', () => {
 assert.equal(typeof api.createEventStore,'function');
 const store = api.createEventStore(2);
 for (let i=0;i<3;i++) assert.equal(store.accept({platform:'youtube',type:'chat',text:'same'}),true);
 assert.equal(store.items().length,2);
});
test('normalizer rejects unknown types and preserves literal text', () => {
 assert.equal(typeof api.normalizeEvent,'function');
 assert.equal(api.normalizeEvent({type:'unknown',text:'x'}),null);
 assert.equal(api.normalizeEvent({type:'chat',platform:'soop',text:'<img onerror=alert(1)>'}).text,'<img onerror=alert(1)>');
});
test('fixed camera follows the new right rail', () => {
 assert.equal(typeof api.handcamLayout,'function');
 assert.deepEqual(api.handcamLayout(),{handHeight:318,chatHeight:317,handY:730});
 const boxes=api.resolveLayout();
 assert.deepEqual(boxes.game,{x:32,y:32,width:1384,height:778});
 assert.deepEqual(boxes.custom3,{x:976,y:842,width:440,height:206});
 assert.deepEqual(boxes.chat,{x:1448,y:32,width:440,height:317});
 assert.deepEqual(boxes.translation,{x:1448,y:381,width:440,height:317});
 assert.deepEqual(boxes.hand,{x:1448,y:730,width:440,height:318});
});

test('auto layout preserves the seven-panel Figma geometry by default', () => {
 assert.deepEqual(api.autoLayout(),api.resolveLayout());
 assert.deepEqual(api.autoLayout({placement:api.defaultPlacement()}),api.resolveLayout());
});

test('hierarchical levels move and resize panels without disturbing their peers', () => {
 const placement=api.defaultPlacement();
 placement.custom3.level1='right';placement.custom3.level2='bottom';
 const moved=api.autoLayout({placement});
 assert.deepEqual(moved.custom1,{x:32,y:842,width:676,height:206});
 assert.deepEqual(moved.custom2,{x:740,y:842,width:676,height:206});
 assert.equal(moved.custom3.x,1448);
 assert.equal(moved.custom3.width,440);
 assert.deepEqual(api.autoLayout({placement:api.defaultPlacement(),enabled:{custom2:false}}).chat,api.resolveLayout().chat);
 assert.throws(()=>api.autoLayout({placement:{game:{level1:'middle',level2:'top',level3:'left'}}}),/frame level/);
});

test('left game and custom band normalize to opposite rows, with game retaining the large row',()=>{
 const top=api.defaultPlacement();top.game.level2='top';
 const topPlacement=api.normalizePlacement(top);
 assert.equal(topPlacement.game.level2,'top');
 for(const key of ['custom1','custom2','custom3'])assert.equal(topPlacement[key].level2,'bottom');
 const bottom=api.defaultPlacement();bottom.game.level2='bottom';
 const bottomPlacement=api.normalizePlacement(bottom);
 for(const key of ['custom1','custom2','custom3'])assert.equal(bottomPlacement[key].level2,'top');
 assert.equal(bottomPlacement.game.level2,'bottom');
 const boxes=api.autoLayout({placement:bottom});
 assert.equal(boxes.game.height,778);assert.equal(boxes.game.y,270);
 for(const key of ['custom1','custom2','custom3'])assert.equal(boxes[key].height,206);
 api.validateLayout(boxes);
 const keys=Object.keys(bottom);
 for(let bits=0;bits<1<<keys.length;bits++){
  const enabled=Object.fromEntries(keys.map((key,index)=>[key,!!(bits&(1<<index))]));
  const layout=api.autoLayout({placement:bottom,enabled});api.validateLayout(layout);
  const active=keys.filter(key=>enabled[key]);
  for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
   const a=layout[active[i]],b=layout[active[j]];
   assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);
  }
 }
});

test('explicit custom vertical change syncs the left band and puts game opposite',()=>{
 const placement=api.defaultPlacement();placement.custom2.level2='top';
 const next=api.normalizePlacement(placement,'custom2');
 assert.equal(next.game.level2,'bottom');
 for(const key of ['custom1','custom2','custom3'])assert.equal(next[key].level2,'top');
 const boxes=api.autoLayout({placement:next});
 assert.equal(boxes.game.height,778);assert.equal(boxes.game.y,270);
 api.validateLayout(boxes);
});

test('left center canonicalizes to its default row while right center remains valid',()=>{
 const placement=api.defaultPlacement();
 placement.game.level2='center';placement.custom2.level2='center';placement.translation.level2='center';
 const normalized=api.normalizePlacement(placement);
 assert.equal(normalized.game.level2,'top');
 assert.equal(normalized.custom2.level2,'bottom');
 assert.equal(normalized.translation.level2,'center');
 assert.throws(()=>api.normalizePlacement({...placement,game:{...placement.game,level2:'sideways'}}),/frame level/);
});

test('legacy custom level3 choices normalize to fixed numeric order and disabled slots expand',()=>{
 const placement=api.defaultPlacement();
 placement.custom1.level3='right';placement.custom2.level3='left';placement.custom3.level3='center';
 const normalized=api.normalizePlacement(placement);
 assert.deepEqual(['custom1','custom2','custom3'].map(key=>normalized[key].level3),['left','center','right']);
 const layout=api.autoLayout({placement});
 assert.ok(layout.custom1.x<layout.custom2.x&&layout.custom2.x<layout.custom3.x);
 const withoutMiddle=api.autoLayout({placement,enabled:{custom2:false}});
 assert.equal(withoutMiddle.custom1.x,32);assert.equal(withoutMiddle.custom3.x,740);
 assert.equal(withoutMiddle.custom1.width,676);assert.equal(withoutMiddle.custom3.width,676);
});

test('fixed custom order survives game-bottom band placement',()=>{
 const placement=api.defaultPlacement();
 placement.game.level2='bottom';
 placement.custom1.level3='right';placement.custom2.level3='right';placement.custom3.level3='left';
 const normalized=api.normalizePlacement(placement);
 assert.equal(normalized.game.level2,'bottom');
 assert.deepEqual(['custom1','custom2','custom3'].map(key=>normalized[key].level3),['left','center','right']);
 const layout=api.autoLayout({placement});
 assert.equal(layout.game.y,270);assert.equal(layout.game.height,778);
 assert.ok(layout.custom1.x<layout.custom2.x&&layout.custom2.x<layout.custom3.x);
});

test('hierarchical layout keeps active panels separate for every visibility combination', () => {
 const keys=Object.keys(api.defaultPlacement());
 for(let bits=0;bits<1<<keys.length;bits++){
  const enabled=Object.fromEntries(keys.map((key,index)=>[key,!!(bits&(1<<index))]));
  const layout=api.autoLayout({placement:api.defaultPlacement(),enabled});
  api.validateLayout(layout);
  const active=keys.filter(key=>enabled[key]);
  for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){
   const a=layout[active[i]],b=layout[active[j]];
   assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);
  }
 }
});

test('auto layout fills vacated bottom and right space', () => {
 const six=api.autoLayout({enabled:{custom2:false}});
 assert.deepEqual(six.custom2,api.resolveLayout().custom2);
 assert.deepEqual(six.custom1,{x:32,y:842,width:676,height:206});
 assert.deepEqual(six.custom3,{x:740,y:842,width:676,height:206});
 assert.deepEqual(six.chat,{x:1448,y:32,width:440,height:317});
 assert.deepEqual(six.translation,{x:1448,y:381,width:440,height:317});
 assert.deepEqual(six.hand,{x:1448,y:730,width:440,height:318});
 const four=api.autoLayout({enabled:{custom3:false,translation:false,hand:false}});
 assert.deepEqual(four.custom1,{x:32,y:842,width:676,height:206});
 assert.deepEqual(four.custom2,{x:740,y:842,width:676,height:206});
 assert.deepEqual(four.chat,{x:1448,y:32,width:440,height:1016});
});

test('auto layout gives the remaining panels all usable space', () => {
 const two=api.autoLayout({enabled:{custom1:false,custom2:false,custom3:false,translation:false,hand:false}});
 assert.deepEqual(two.game,{x:32,y:32,width:1384,height:1016});
 assert.deepEqual(two.chat,{x:1448,y:32,width:440,height:1016});
 const one=api.autoLayout({enabled:{custom1:false,custom2:false,custom3:false,chat:false,translation:false,hand:false}});
 assert.deepEqual(one.game,{x:32,y:32,width:1856,height:1016});
});

test('moving a panel into the lead position changes its dimensions', () => {
 const moved=api.autoLayout({order:['chat','game','custom1','custom2','custom3','translation','hand']});
 assert.deepEqual(moved.chat,{x:32,y:32,width:1384,height:778});
 assert.deepEqual(moved.game,{x:32,y:842,width:440,height:206});
 assert.throws(()=>api.autoLayout({order:['game','game']}),/order/);
});

test('full-box validator accepts generated geometry and rejects clipped boxes', () => {
 const boxes=api.autoLayout();
 assert.equal(api.validateLayout(boxes),boxes);
 assert.throws(()=>api.validateLayout({...boxes,chat:{...boxes.chat,width:473}}),/chat/);
 assert.throws(()=>api.validateLayout({...boxes,game:{...boxes.game,height:0}}),/game/);
});

test('nickname colors use platform colors or stable per-user colors',()=>{
 assert.notEqual(api.nicknameColor('chzzk','a'),api.nicknameColor('twitch','a'));
 assert.equal(api.nicknameColor('chzzk','a','user'),api.nicknameColor('chzzk','a','user'));
 assert.notEqual(api.nicknameColor('chzzk','a','user'),api.nicknameColor('chzzk','b','user'));
});
test('independent custom media may repeat while sponsor and alerts remain unique',()=>{
 assert.deepEqual(api.resolveSlots({custom1:'image',custom2:'image',custom3:'browser'}),{custom1:'image',custom2:'image',custom3:'browser'});
 assert.throws(()=>api.resolveSlots({custom1:'alerts',custom2:'alerts',custom3:'none'}));
});
