const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const events=require('../template/events.js'),pack=require('../template/pack.js');
const source=fs.readFileSync(path.join(__dirname,'../template/preview.js'),'utf8');
const clean=value=>JSON.parse(JSON.stringify(value));
function harness(extra={}){
 const publicContext={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../template/config.public.js'),'utf8'),publicContext);
 const defaults=structuredClone(publicContext.window.OVERLAY_PUBLIC_CONFIG),keys=events.allPanelKeys;
 const context={defaults,keys,window:{},OverlayEvents:events,structuredClone,initialPlacement:events.defaultPlacement(),panelGroups:{sub:events.bentoPanelKeys.slice(1,4),side:events.bentoPanelKeys.slice(4)},freshSmoothing:0,...extra};
 const start=source.indexOf('  const defaultStyle='),end=source.indexOf('  function restoredSettings(',start);
 vm.runInNewContext(source.slice(start,end),context);return context;
}
const exported=input=>JSON.parse(new TextDecoder().decode(pack.settingsEntries(input)[0].bytes));
const legacy={layoutVersion:3,donationChzzk:' https://example.org/chzzk?token=synthetic ',donationTwitch:'https://example.org/twitch',donationYoutube:'https://example.org/youtube',donationSoop:'https://example.org/soop',slotContent:{custom2:'alerts'},customSlotMedia:{custom1:{url:'assets/old-promo.png'},custom3:{url:'https://example.org/unused-media'}},chatUrl:'https://example.org/chat',translationUrl:'https://example.org/translation',reactiveUrl:'https://example.org/reactive',sponsor:'https://example.org/promo'};
test('all legacy connection values survive normalize, personal export, reload and re-export',()=>{
 const context=harness(),input=structuredClone(legacy),normalized=clean(context.normalize(input));
 const originalInputs={...Object.fromEntries(['donationChzzk','donationTwitch','donationYoutube','donationSoop','chatUrl','translationUrl','reactiveUrl','sponsor'].map(key=>[key,input[key]])),custom1MediaUrl:input.customSlotMedia.custom1.url,custom3MediaUrl:input.customSlotMedia.custom3.url};
 assert.deepEqual(normalized.legacyConnections,{version:1,inputs:originalInputs});
 assert.equal(normalized.panelContent.custom2.url,input.donationChzzk);
 const first=exported(normalized),second=exported(clean(context.normalize(structuredClone(first))));
 assert.deepEqual(first.legacyConnections,normalized.legacyConnections);assert.deepEqual(second.legacyConnections,normalized.legacyConnections);assert.deepEqual(input,legacy);
 for(const field of ['donationChzzk','donationTwitch','donationYoutube','donationSoop','customSlotMedia'])assert.equal(first[field],undefined);
 assert.ok(context.unmappedLegacyConnections(second).some(([key])=>key==='donationTwitch'));
 assert.ok(!context.unmappedLegacyConnections(second).some(([key])=>key==='donationChzzk'));
});
test('explicit populated panels win over legacy roles in v3 and v4; dormant mappings remain assigned',()=>{
 const context=harness();
 for(const layoutVersion of [3,4]){
  const input={...legacy,layoutVersion,panelContent:{custom2:{type:'web',url:'https://example.org/already-configured'}},panelEnabled:{custom2:false}};
  const normalized=clean(context.normalize(input)),saved=exported(normalized);
  assert.equal(saved.panelContent.custom2.url,input.panelContent.custom2.url);
  assert.equal(saved.legacyConnections.inputs.donationTwitch,input.donationTwitch);
 }
 const entries=context.unmappedLegacyConnections({panelEnabled:{custom2:false},panelContent:{custom2:{type:'web',url:legacy.donationTwitch}},legacyConnections:{version:1,inputs:{donationTwitch:legacy.donationTwitch,donationYoutube:legacy.donationTwitch}}});
 assert.equal(entries.length,0);
});
test('direct generic exports also retain raw legacy input without changing populated content',()=>{
 const panelContent=Object.fromEntries(events.allPanelKeys.map(key=>[key,{type:'none',url:''}]));panelContent.custom2={type:'web',url:'https://example.org/current'};
 const saved=exported({...legacy,layoutVersion:4,panelContent});
 assert.equal(saved.panelContent.custom2.url,panelContent.custom2.url);assert.equal(saved.legacyConnections.inputs.donationSoop,legacy.donationSoop);
});
test('malformed legacy snapshots are rejected rather than silently exported or coerced',()=>{
 const context=harness(),valid=clean(context.normalize(legacy));
 for(const snapshot of [null,[],{version:2,inputs:{}},{version:1,inputs:[]},{version:1,inputs:{unknown:'value'}},{version:1,inputs:{donationTwitch:{url:'value'}}},{version:1,inputs:{},execute:'bad'}]){
  assert.throws(()=>context.normalize({...valid,legacyConnections:snapshot}),/이전 연결/);
  assert.throws(()=>exported({...valid,legacyConnections:snapshot}),/Invalid legacy connection/);
 }
});
test('unassigned legacy values remain inert even when they contain invalid URLs or markup',()=>{
 const context=harness(),valid=clean(context.normalize(legacy)),value='<img src=x onerror=alert(1)>javascript:synthetic';
 const saved=exported({...valid,legacyConnections:{version:1,inputs:{donationTwitch:value}}});assert.equal(saved.legacyConnections.inputs.donationTwitch,value);
 class Element{constructor(tag){this.tag=tag;this.children=[];this.attributes={};}append(...items){this.children.push(...items);}replaceChildren(...items){this.children=items;}setAttribute(key,value){this.attributes[key]=value;}}
 let notice;const dom=harness({byId:()=>notice,form:{before:element=>{notice=element;}},document:{createElement:tag=>new Element(tag)},window:{KMGI18n:{localize:text=>'localized:'+text}}});
 dom.renderLegacyConnections(saved);
 assert.equal(notice.hidden,false);assert.equal(notice.children[0].textContent,'localized:연결되지 않은 이전 URL');
 const input=notice.children[2].children[1];assert.equal(input.readOnly,true);assert.equal(input.value,value);assert.equal(input.type,'text');assert.equal(input.innerHTML,undefined);
 dom.renderLegacyConnections({...saved,panelContent:{custom2:{type:'web',url:value}}});assert.equal(notice.hidden,true);
});
