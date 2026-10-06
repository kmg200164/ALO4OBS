const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const api=fs.existsSync(path.join(__dirname,'../template/pack.js'))?require('../template/pack.js'):{};
test('disabled generic panels preserve invalid drafts without blocking export, then validate on enable',()=>{
 const keys=['game','custom1','custom2','custom3','chat','translation','hand'];
 for(const key of keys)for(const type of ['web','media']){
  const panelContent=Object.fromEntries(keys.map(k=>[k,{type:'none',url:''}]));
  panelContent[key]={type,url:'not-a-url'};
  const input={layoutVersion:4,panelContent,panelEnabled:{[key]:false}};
  const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries(input)[1].bytes));
  assert.deepEqual(saved.panelContent[key],panelContent[key]);
  assert.equal(saved.panelEnabled[key],false);
  assert.throws(()=>api.settingsEntries({...input,panelEnabled:{[key]:true}}));
 }
});
test('seven generic panels export without legacy provider data',()=>{
 const keys=['game','custom1','custom2','custom3','chat','translation','hand'];
 const panelContent=Object.fromEntries(keys.map(key=>[key,{type:'none',url:''}]));
 panelContent.game={type:'source',url:''};
 panelContent.chat={type:'web',url:' https://example.org/widget '};
 panelContent.translation={type:'media',url:'assets/card.png'};
 const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries({layoutVersion:4,panelContent,chatUrl:'https://private.example.org/widget',slotContent:{custom1:'sponsor'},panelEnabled:{custom2:false}})[1].bytes));
 assert.equal(saved.layoutVersion,4);
 assert.deepEqual(Object.keys(saved.panelContent),keys);
 assert.equal(saved.panelContent.chat.url,'https://example.org/widget');
 assert.equal(saved.panelContent.translation.url,'assets/card.png');
 assert.equal(saved.panelEnabled.custom2,false);
 assert.equal(saved.chatUrl,undefined);
 assert.equal(saved.slotContent,undefined);
 assert.throws(()=>api.settingsEntries({layoutVersion:4,panelContent:{...panelContent,chat:{type:'web',url:'javascript:alert(1)'}}}));
 assert.throws(()=>api.settingsEntries({layoutVersion:4,panelContent:{...panelContent,chat:{type:'web',url:'https://person:password@example.org'}}}));
 assert.throws(()=>api.settingsEntries({layoutVersion:4,panelContent:{...panelContent,translation:{type:'media',url:'assets/unsafe.svg'}}}));
 assert.throws(()=>api.settingsEntries({layoutVersion:4,panelContent:{...panelContent,translation:{type:'media',url:'assets/../unsafe.png'}}}));
 assert.throws(()=>api.settingsEntries({layoutVersion:4,panelContent:{game:{type:'source',url:''}}}));
});
test('ZIP keeps nested asset path and file content',()=>{assert.equal(typeof api.zip,'function');const data=api.zip([{name:'assets/test.gif',bytes:new Uint8Array([71,73,70])}]);const view=new DataView(data.buffer);assert.equal(view.getUint32(0,true),0x04034b50);const nameLen=view.getUint16(26,true);assert.equal(new TextDecoder().decode(data.slice(30,30+nameLen)),'assets/test.gif');assert.deepEqual([...data.slice(30+nameLen,33+nameLen)],[71,73,70]);assert.equal(view.getUint32(data.length-22,true),0x06054b50);});
test('settings export carries all provider links to OBS and rejects executable URLs',()=>{
 const config={name:'PLAYER',chatUrl:' https://weflab.com/example?token=a%26b ',translationUrl:'https://example.org/stream',donationChzzk:'https://example.org/chzzk',donationTwitch:'https://example.org/twitch',donationYoutube:'https://example.org/youtube',donationSoop:'https://example.org/soop',showChat:true};
 const entries=api.settingsEntries(config),saved=JSON.parse(new TextDecoder().decode(entries.find(e=>e.name==='obs-settings.json').bytes));
 assert.equal(saved.chatUrl,'https://weflab.com/example?token=a%26b');
 for(const k of ['translationUrl','donationChzzk','donationTwitch','donationYoutube','donationSoop'])assert.equal(saved[k],config[k]);
 assert.equal(saved.showChat,true);assert.equal(config.chatUrl.startsWith(' '),true);
 assert.throws(()=>api.settingsEntries({...config,chatUrl:'javascript:alert(1)'}));
 assert.throws(()=>api.settingsEntries({...config,translationUrl:'chrome-extension://id/options.html'}));
 assert.throws(()=>api.settingsEntries({...config,donationSoop:'https://user:secret@example.org'}));
 assert.equal(api.settingsEntries({...config,translationUrl:''}).length,2);
});
test('custom positions and camera mode survive export; invalid settings are rejected',()=>{
 const input={layoutVersion:2,layout:{game:{x:100,y:50},hand:{x:1400,y:700}},cameraMode:'reactive',reactiveUrl:' https://example.org/reactive '};
 const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries(input)[1].bytes));
 assert.equal(saved.layout.game.x,100);assert.equal(saved.layout.chat.y,32);
 assert.equal(saved.reactiveUrl,'https://example.org/reactive');assert.equal(saved.handcam,false);
 assert.deepEqual(saved.slotContent,{custom1:'sponsor',custom2:'alerts',custom3:'none'});
 const swapped=JSON.parse(new TextDecoder().decode(api.settingsEntries({layoutVersion:2,slotContent:{custom1:'none',custom2:'sponsor',custom3:'alerts'}})[1].bytes));
 assert.equal(swapped.cameraMode,'none');assert.equal(swapped.slotContent.custom2,'sponsor');
 assert.throws(()=>api.settingsEntries({layoutVersion:2,slotContent:{custom1:'sponsor',custom2:'sponsor',custom3:'none'}}));
 assert.throws(()=>api.settingsEntries({layoutVersion:2,slotContent:{custom1:'camera',custom2:'alerts',custom3:'none'}}));
 for(const x of [-1,537,NaN,1.5,'20'])assert.throws(()=>api.settingsEntries({...input,layout:{game:{x,y:0}}}));
 assert.throws(()=>api.settingsEntries({...input,reactiveUrl:'javascript:alert(1)'}));
 assert.throws(()=>api.settingsEntries({...input,reactiveUrl:''}));
 assert.throws(()=>api.settingsEntries({...input,cameraMode:'invalid'}));
 assert.equal(JSON.parse(new TextDecoder().decode(api.settingsEntries({handcam:false})[1].bytes)).cameraMode,'none');
 assert.equal(input.reactiveUrl.startsWith(' '),true);
});
test('standalone OBS HTML loads exported positions and reactive mode from config.js',()=>{
 const vm=require('node:vm'),elements=new Map();
 function element(key){if(!elements.has(key))elements.set(key,{style:{setProperty(){}},classList:{add(){},contains(){return false}},addEventListener(){},replaceChildren(){},pause(){this.pauses=(this.pauses||0)+1;},load(){this.loads=(this.loads||0)+1;},play(){return Promise.resolve();},removeAttribute(){},querySelector:child=>element(key+' '+child)});return elements.get(key);}
 const config={layoutVersion:2,platforms:[],layout:{custom1:{x:100,y:100}},cameraMode:'reactive',handcam:false};
 const context={window:{OVERLAY_CONFIG:config},document:{getElementById:element,querySelector:selector=>element(selector.replace(/^\.overlay section(?=\[data-region=)/,'')),body:element('body')},OverlayEvents:require('../template/events.js'),innerWidth:1920,innerHeight:1080,addEventListener(){},location:{search:''},URL,URLSearchParams,clearTimeout};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../template/overlay.js'),'utf8'),context);
 assert.equal(element('[data-region="sponsor"]').style.left,'100px');
 assert.equal(element('[data-region="sponsor"]').style.top,'100px');
 assert.equal(element('sponsor-image').hidden,true);
 assert.equal(element('alert-default').hidden,true);
 context.window.Overlay.applyConfig({...config,name:'Streamer',logo:'assets/custom-logo.svg'});
 assert.equal(element('alert-default').hidden,true);
 assert.equal(element('.hand .preview-label').textContent,'DISCORD REACTIVE · OBS');
 assert.equal(element('[data-region="hand"]').style.visibility,'visible');
 context.window.Overlay.applyConfig({handcam:false});assert.equal(element('[data-region="hand"]').style.visibility,'hidden');
 context.window.Overlay.applyConfig({layoutVersion:2,slotContent:{custom1:'none',custom2:'sponsor',custom3:'alerts'}});
 assert.equal(element('[data-region="sponsor"]').style.left,'504px');
 assert.equal(element('[data-region="hand"]').style.left,'1448px');
 context.window.Overlay.applyConfig({layoutVersion:2,slotContent:{custom1:'video',custom2:'sponsor',custom3:'alerts'},customSlotMedia:{custom1:{url:'https://example.org/custom.mp4'}},sponsor:'https://example.org/promo.mp4',sponsorType:'video'});
 const customVideo=element('[data-region="custom1"] video'),sponsorVideo=element('sponsor-video');
 const before=[customVideo.pauses,sponsorVideo.pauses];
 context.window.Overlay.applyConfig({layoutVersion:2,slotContent:{custom1:'video',custom2:'sponsor',custom3:'alerts'},customSlotMedia:{custom1:{url:'https://example.org/custom.mp4'}},sponsor:'https://example.org/promo.mp4',sponsorType:'video',name:'NEW NAME',layout:{custom1:{x:60,y:842}}});
 assert.deepEqual([customVideo.pauses,sponsorVideo.pauses],before);
 assert.equal(element('[data-region="custom1"]').style.left,'60px');
 context.window.Overlay.applyConfig({layoutVersion:2,slotContent:{custom1:'video',custom2:'sponsor',custom3:'alerts'},customSlotMedia:{custom1:{url:'https://example.org/other.mp4'}},sponsor:'https://example.org/other-promo.mp4',sponsorType:'video'});
 assert.deepEqual([customVideo.pauses,sponsorVideo.pauses],before.map(count=>count+1));
});
test('background colors and image paths survive settings export',()=>{
 const input={backgroundColor:'#000000',backgroundImage:'assets/background-whole.png',regionBackgrounds:{game:{color:'#222222',image:'assets/background-game.gif'}}};
 const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries(input)[1].bytes));
 assert.equal(saved.backgroundImage,'assets/background-whole.png');assert.deepEqual(saved.regionBackgrounds.game,{color:'#222222',image:'assets/background-game.gif',opacity:20,blur:16,borderColor:'#ffffff',borderVisible:true});
 assert.equal(saved.regionBackgrounds.hand.color,'#000000');assert.equal(saved.regionBackgrounds.hand.opacity,20);assert.equal(saved.regionBackgrounds.hand.blur,16);
 const plain=JSON.parse(new TextDecoder().decode(api.settingsEntries({})[1].bytes));assert.equal(plain.regionBackgrounds.hand.color,'#1a1a1a');assert.equal(plain.regionBackgrounds.hand.opacity,100);assert.equal(plain.regionBackgrounds.hand.blur,0);
 assert.equal(JSON.parse(new TextDecoder().decode(api.settingsEntries({...input,backgroundImage:'https://example.org/images/bg.png'})[1].bytes)).backgroundImage,'https://example.org/images/bg.png');
 assert.throws(()=>api.settingsEntries({...input,backgroundImage:'javascript:alert(1)'}));
 assert.throws(()=>api.settingsEntries({...input,backgroundImage:'https://name:secret@example.org/bg.png'}));
 assert.throws(()=>api.settingsEntries({...input,regionBackgrounds:{game:{color:'#12345g'}}}));
});
test('three custom slots export independent media and validate browser URLs',()=>{
 const input={layoutVersion:2,slotContent:{custom1:'image',custom2:'video',custom3:'browser'},customSlotMedia:{custom1:{url:'assets/custom1.gif'},custom2:{url:'assets/custom2.mp4'},custom3:{url:'https://weflab.com/widget?id=1'}}};
 const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries(input)[1].bytes));
 assert.deepEqual(saved.slotContent,input.slotContent);assert.equal(saved.customSlotMedia.custom3.url,input.customSlotMedia.custom3.url);
 assert.throws(()=>api.settingsEntries({...input,customSlotMedia:{...input.customSlotMedia,custom3:{url:'javascript:alert(1)'}}}));
 assert.throws(()=>api.settingsEntries({...input,customSlotMedia:{...input.customSlotMedia,custom1:{url:'assets/../secret.gif'}}}));
 assert.equal(JSON.parse(new TextDecoder().decode(api.settingsEntries({layoutVersion:2,slotContent:{custom1:'source',custom2:'none',custom3:'none'}})[1].bytes)).custom1Source,'');
});
test('preset fill and stroke values survive export with opaque bounded stroke',()=>{
 const input={panelEnabled:{game:false,chat:false},globalStyle:{background:{mode:'gradient',color:'#112233',color2:'#445566'},fill:{mode:'gradient',color:'#111111',color2:'#222222',opacity:40,blur:16},stroke:{mode:'solid',color:'#abcdef',opacity:75,width:6}}};
 const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries(input)[1].bytes));
 assert.equal(saved.panelEnabled.game,false);assert.equal(saved.panelEnabled.chat,false);assert.equal(saved.panelEnabled.hand,true);
 assert.equal(saved.globalStyle.stroke.width,6);assert.equal(saved.globalStyle.stroke.opacity,100);assert.equal(saved.globalStyle.fill.opacity,40);assert.equal(saved.globalStyle.fill.blur,16);
 assert.throws(()=>api.settingsEntries({...input,globalStyle:{...input.globalStyle,stroke:{...input.globalStyle.stroke,width:33}}}));
 assert.throws(()=>api.settingsEntries({...input,globalStyle:{...input.globalStyle,background:{mode:'url',url:'javascript:bad',color:'#ffffff'}}}));
});
test('stroke opacity and gradient stop alpha normalize to 100 while fill alpha is preserved',()=>{
 const gradient={type:'linear',angle:27,stops:[{position:0,color:'#112233',opacity:0},{position:100,color:'#AABBCC',opacity:35}]};
 const input={borderOpacity:-7,globalStyle:{stroke:{mode:'gradient',opacity:-1,gradient},fill:{mode:'gradient',opacity:60,gradient}},regionStyleOverrides:{game:true},regionBackgrounds:{game:{borderOpacity:17,stroke:{mode:'gradient',opacity:'legacy',gradient}}}};
 const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries(input)[1].bytes));
 assert.equal(saved.globalStyle.stroke.opacity,100);
 assert.equal(saved.borderOpacity,100);
 assert.deepEqual(saved.globalStyle.stroke.gradient.stops.map(stop=>stop.opacity),[100,100]);
 assert.deepEqual(saved.globalStyle.fill.gradient.stops.map(stop=>stop.opacity),[0,35]);
 assert.equal(saved.regionBackgrounds.game.borderOpacity,100);
 assert.equal(saved.regionBackgrounds.game.stroke.opacity,100);
 assert.deepEqual(saved.regionBackgrounds.game.stroke.gradient.stops.map(stop=>stop.opacity),[100,100]);
});
test('auto layout export gives OBS the same resized boxes as the preview',()=>{
 const order=['chat','custom1','game','custom2','custom3','translation','hand'];
 const enabled={custom2:false,hand:false};
 const input={layoutVersion:3,layoutOrder:order,panelEnabled:enabled};
 const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries(input)[1].bytes));
 const expected=require('../template/events.js').autoLayout({order,enabled});
 assert.equal(saved.layoutVersion,3);
 assert.deepEqual(saved.layout,expected);
 assert.equal(saved.layout.chat.x,32);
 assert.equal(saved.layout.chat.width,1384);
 assert.equal(saved.layout.custom1.width,676);
 assert.equal(saved.panelEnabled.custom2,false);
});
test('legacy right-frame Sub placement exports the fixed Sub row as OBS boxes',()=>{
 const events=require('../template/events.js'),placement=events.defaultPlacement();
 placement.custom2.level1='right';placement.custom2.level2='bottom';
 const enabled={custom3:false};
 const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries({layoutVersion:3,panelPlacement:placement,panelEnabled:enabled})[1].bytes));
 assert.deepEqual(saved.layout,events.autoLayout({placement,enabled}));
 assert.equal(saved.layout.custom1.width,676);
 assert.equal(saved.layout.custom2.x,740);
 assert.equal(saved.panelPlacement.custom2.level1,'left');
 assert.equal(saved.panelPlacement.chat,undefined);
});
test('opposite game and custom rows export the canonical geometry for OBS',()=>{
 const events=require('../template/events.js'),placement=events.defaultPlacement();
 placement.game.level2='bottom';
 const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries({layoutVersion:3,panelPlacement:placement})[1].bytes));
 const expected=events.autoLayout({placement});
 assert.deepEqual(saved.layout,expected);
 assert.equal(saved.layout.game.y,270);assert.equal(saved.layout.game.height,778);
 for(const key of ['custom1','custom2','custom3']){
  assert.equal(saved.layout[key].y,32);assert.equal(saved.layout[key].height,206);
 }
});
test('OBS export ignores legacy custom level3 ordering and expands enabled numeric slots',()=>{
 const placement=require('../template/events.js').defaultPlacement();
 placement.game.level2='bottom';
 placement.custom1.level3='right';placement.custom2.level3='left';placement.custom3.level3='center';
 const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries({layoutVersion:3,panelPlacement:placement})[1].bytes));
 assert.equal(saved.layout.game.height,778);
 assert.ok(saved.layout.custom1.x<saved.layout.custom2.x&&saved.layout.custom2.x<saved.layout.custom3.x);
 assert.deepEqual(['custom1','custom2','custom3'].map(key=>saved.panelPlacement[key].level3),['left','center','right']);
 const compact=JSON.parse(new TextDecoder().decode(api.settingsEntries({layoutVersion:3,panelPlacement:placement,panelEnabled:{custom2:false}})[1].bytes));
 assert.equal(compact.layout.custom1.x,32);assert.equal(compact.layout.custom3.x,740);
 assert.equal(compact.layout.custom1.width,676);assert.equal(compact.layout.custom3.width,676);
});
test('version 2 export preserves legacy placement fields and free coordinates',()=>{
 const panelPlacement={custom1:{level3:'right'},custom2:{level3:'left'},custom3:{level3:'center'}};
 const input={layoutVersion:2,layout:{game:{x:80,y:90}},panelPlacement};
 const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries(input)[1].bytes));
 assert.deepEqual(saved.layout.game,{x:80,y:90,width:1384,height:778});
 assert.deepEqual(saved.panelPlacement,panelPlacement);
});
test('fill gradient stops stay unchanged, stroke stop alpha is locked, and malformed gradients are rejected',()=>{
 const gradient={type:'linear',angle:27,stops:[{position:0,color:'#112233',opacity:100},{position:68,color:'#AABBCC',opacity:42},{position:100,color:'#FFFFFF',opacity:0}]};
 const input={regionStyleOverrides:{game:true},globalStyle:{background:{mode:'gradient',gradient},fill:{mode:'gradient',gradient,opacity:75},stroke:{mode:'gradient',gradient,width:6}},regionBackgrounds:{game:{fill:{mode:'gradient',gradient},stroke:{mode:'gradient',gradient,width:5}}}};
 const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries(input)[1].bytes));
 const opaqueGradient={...gradient,stops:gradient.stops.map(stop=>({...stop,opacity:100}))};
 assert.deepEqual(saved.globalStyle.background.gradient,gradient);
 assert.deepEqual(saved.globalStyle.fill.gradient,gradient);
 assert.deepEqual(saved.globalStyle.stroke.gradient,opaqueGradient);
 assert.deepEqual(saved.regionBackgrounds.game.fill.gradient,gradient);
 assert.deepEqual(saved.regionBackgrounds.game.stroke.gradient,opaqueGradient);
 for(const bad of [null,{}, {type:'radial',angle:0,stops:gradient.stops},{type:'linear',angle:NaN,stops:gradient.stops},{type:'linear',angle:0,stops:[gradient.stops[0]]},{type:'linear',angle:0,stops:Array(13).fill(gradient.stops[0])},{type:'linear',angle:0,stops:[{...gradient.stops[0],position:-1},gradient.stops[1]]},{type:'linear',angle:0,stops:[gradient.stops[0],{...gradient.stops[1],color:'red'}]},{type:'linear',angle:0,stops:[gradient.stops[0],{...gradient.stops[1],opacity:101}]}]){
  assert.throws(()=>api.settingsEntries({...input,globalStyle:{...input.globalStyle,fill:{mode:'gradient',gradient:bad}}}));
 }
 assert.throws(()=>api.settingsEntries({...input,regionBackgrounds:{game:{fill:{mode:'gradient',gradient:{...gradient,stops:[gradient.stops[0]]}}}}}));
});

test('custom media is stopped when disabled and restored when the same panel is enabled',()=>{
 const vm=require('node:vm'),elements=new Map();
 function element(key){
  if(!elements.has(key))elements.set(key,{style:{setProperty(){}},classList:{add(){},contains(){return key==='body';}},addEventListener(){},replaceChildren(){},append(){},pause(){this.pauses=(this.pauses||0)+1;},load(){},play(){this.plays=(this.plays||0)+1;return Promise.resolve();},removeAttribute(name){delete this[name];},querySelector:child=>element(key+' '+child)});
  return elements.get(key);
 }
 const input={layoutVersion:2,platforms:[],showSponsor:false,slotContent:{custom1:'video',custom2:'browser',custom3:'image'},customSlotMedia:{custom1:{url:'https://example.org/a.mp4'},custom2:{url:'https://example.org/widget'},custom3:{url:'assets/example.png'}},panelEnabled:{custom1:false,custom2:false,custom3:false}};
 const context={window:{OVERLAY_PUBLIC_CONFIG:input,OVERLAY_CONFIG:input},document:{getElementById:element,querySelector:selector=>element(selector.replace(/^\.overlay section(?=\[data-region=)/,'')),body:element('body'),createElement:()=>element('new')},OverlayEvents:require('../template/events.js'),innerWidth:1920,innerHeight:1080,addEventListener(){},location:{search:'?preview=1'},URL,URLSearchParams,clearTimeout};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../template/overlay.js'),'utf8'),context);
 const video=element('[data-region="custom1"] video'),embed=element('[data-region="custom2"] iframe'),image=element('[data-region="custom3"] img');
 assert.equal(video.src,undefined);assert.equal(embed.src,undefined);assert.equal(image.src,undefined);
 context.window.Overlay.applyConfig({...input,panelEnabled:{}});
 assert.equal(element('[data-region="custom1"]').hidden,false);
 assert.equal(video.src,input.customSlotMedia.custom1.url);assert.equal(embed.src,input.customSlotMedia.custom2.url);assert.equal(image.src,input.customSlotMedia.custom3.url);
 const plays=video.plays,pauses=video.pauses;
 context.window.Overlay.applyConfig({...input,panelEnabled:{}});
 assert.equal(video.plays,plays);assert.equal(video.pauses,pauses);
 context.window.Overlay.applyConfig(input);
 assert.equal(element('[data-region="custom1"]').hidden,true);
 assert.equal(video.src,undefined);assert.equal(embed.src,undefined);assert.equal(image.src,undefined);
 assert.equal(video.pauses,pauses+1);
 context.window.Overlay.applyConfig({...input,panelEnabled:{}});
 assert.equal(element('[data-region="custom1"]').hidden,false);assert.equal(video.plays,plays+1);
});

test('promotion media follows its active slot and stops across disabled or replaced roles',()=>{
 const vm=require('node:vm'),elements=new Map();
 function element(key){if(!elements.has(key))elements.set(key,{style:{setProperty(){}},classList:{add(){},contains(){return false}},addEventListener(){},replaceChildren(){},pause(){this.pauses=(this.pauses||0)+1;},load(){},play(){this.plays=(this.plays||0)+1;return Promise.resolve();},removeAttribute(name){delete this[name];},querySelector:child=>element(key+' '+child)});return elements.get(key);}
 const input={layoutVersion:2,platforms:[],showSponsor:true,sponsor:'https://example.org/promo.mp4',sponsorType:'video',slotContent:{custom1:'sponsor',custom2:'none',custom3:'none'},panelEnabled:{}};
 const context={window:{OVERLAY_CONFIG:input},document:{getElementById:element,querySelector:selector=>element(selector.replace(/^\.overlay section(?=\[data-region=)/,'')),body:element('body')},OverlayEvents:require('../template/events.js'),innerWidth:1920,innerHeight:1080,addEventListener(){},location:{search:''},URL,URLSearchParams,clearTimeout};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../template/overlay.js'),'utf8'),context);
 const video=element('sponsor-video'),embed=element('sponsor-embed');
 assert.equal(video.src,input.sponsor);
 context.window.Overlay.applyConfig({...input,panelEnabled:{custom1:false}});assert.equal(video.src,undefined);
 context.window.Overlay.applyConfig(input);assert.equal(video.src,input.sponsor);
 context.window.Overlay.applyConfig({...input,slotContent:{custom1:'none',custom2:'sponsor',custom3:'none'},panelEnabled:{custom2:false}});assert.equal(video.src,undefined);
 context.window.Overlay.applyConfig({...input,sponsorType:'embed',sponsor:'https://example.org/widget'});assert.equal(embed.src,'https://example.org/widget');
 context.window.Overlay.applyConfig({...input,sponsorType:'embed',sponsor:'https://example.org/widget',showSponsor:false});assert.equal(embed.src,undefined);
 context.window.Overlay.applyConfig({...input,slotContent:{custom1:'none',custom2:'none',custom3:'none'}});assert.equal(video.src,undefined);assert.equal(embed.src,undefined);
});

test('settings ZIP contains data rather than executable JavaScript',()=>{const entries=api.settingsEntries({});assert.equal(entries.some(entry=>/\.(js|html|exe|ps1|bat)$/i.test(entry.name)),false);assert.deepEqual(JSON.parse(new TextDecoder().decode(entries[0].bytes)),JSON.parse(new TextDecoder().decode(entries[1].bytes)));});
