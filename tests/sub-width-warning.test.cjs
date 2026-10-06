const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const api=require('../template/events.js');
const pack=require('../template/pack.js');
const keys=Object.keys(api.resolveLayout());
const fixed=width=>({widthMode:'fixed',width});
const subs=(a,b,c)=>({custom1:fixed(a),custom2:fixed(b),custom3:fixed(c)});
test('exact fit, empty space and overflow are reported only when every enabled Sub is manual',()=>{
 assert.equal(api.subWidthWarning({panelSizing:subs(440,440,440)}),null);
 assert.equal(api.subWidthWarning({panelSizing:subs(220,300,400)}),'gap');
 assert.equal(api.subWidthWarning({panelSizing:subs(500,500,400)}),'overflow');
 assert.equal(api.subWidthWarning({panelSizing:{...subs(220,300,400),custom2:{widthMode:'auto',width:300}}}),null);
 assert.equal(api.subWidthWarning({panelSizing:{custom1:fixed(220)}}),null);
 assert.equal(api.subWidthWarning({panelSizing:{...subs(220,300,400),custom2:{widthMode:'auto',width:300}},panelEnabled:{custom2:false}}),'gap');
 assert.equal(api.subWidthWarning({panelSizing:subs(660,692,400),panelEnabled:{custom3:false}}),null);
 assert.equal(api.subWidthWarning({panelEnabled:{custom1:false,custom2:false,custom3:false}}),null);
});
test('warnings never block saving or applying: overflow renders fitted and empty space stays',()=>{
 const content=Object.fromEntries(keys.map(key=>[key,{type:'none',url:''}]));
 for(const [sizing,kind] of [[subs(220,300,400),'gap'],[subs(600,600,600),'overflow']]){
  const config={layoutVersion:4,panelPlacement:api.defaultPlacement(),panelSizing:sizing,panelContent:content};
  assert.equal(api.subWidthWarning(config),kind);
  const saved=JSON.parse(new TextDecoder().decode(pack.settingsEntries(config)[0].bytes));
  assert.equal(saved.panelSizing.custom1.width,sizing.custom1.width);
  const {custom1,custom2,custom3}=saved.layout;
  assert.ok(custom1.x+custom1.width+32<=custom2.x&&custom2.x+custom2.width+32<=custom3.x&&custom3.x+custom3.width<=1416);
  if(kind==='gap')assert.equal(custom3.x+custom3.width,32+220+32+300+32+400);
  else assert.equal(custom3.x+custom3.width,1416);
 }
});
test('editor keeps an overfull all-manual Sub row for the warning instead of shrinking peers',()=>{
 const source=fs.readFileSync(require.resolve('../template/preview.js'),'utf8');
 const config={panelSizing:api.normalizeSizing(subs(600,600,600)),panelPlacement:api.defaultPlacement(),panelEnabled:{},panelGap:32};
 const context={config,keys,selected:'custom1',sizeConstraintTarget:null,OverlayEvents:api};
 vm.runInNewContext(source.slice(source.indexOf('  function clampPanelSizes(){'),source.indexOf('  // Warnings never block')),context);
 context.clampPanelSizes();
 assert.deepEqual(['custom1','custom2','custom3'].map(key=>config.panelSizing[key].width),[600,600,600]);
 assert.equal(api.subWidthWarning(config),'overflow');
 assert.match(source,/data-sub-width-warning role="status"/);
});
