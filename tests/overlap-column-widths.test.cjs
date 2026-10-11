const test=require('node:test'),assert=require('node:assert/strict'),events=require('../template/events.js'),pack=require('../template/pack.js');
const all=Object.fromEntries(events.overlapPanelKeys.map(k=>[k,true]));
const saved=c=>JSON.parse(new TextDecoder().decode(pack.settingsEntries({panelContent:Object.fromEntries(events.allPanelKeys.map(k=>[k,{type:"none",url:""}])),...c})[0].bytes));
test('Overlap column switches preserve row counts and disabled column settings',()=>{
 const config={layoutVersion:4,layoutMode:'overlap',panelEnabled:all,overlapColumns:{2:{enabled:false}},overlapSizing:{panel2_2:{heightMode:'fixed',height:120}},overlapPositions:{panel2_2:{mode:'fixed',y:650}}};
 const flags=events.effectivePanelEnabled(config),layout=events.resolveConfigLayout(config);
 assert.equal(flags.panel2_2,false);assert.equal(config.panelEnabled.panel2_2,true);assert.equal(layout.panel1_1.width,355.2);
 const out=saved(config);assert.equal(out.panelEnabled.panel2_2,true);assert.equal(out.panelRenderEnabled.panel2_2,false);
 const back=events.switchLayoutPreset(events.switchLayoutPreset(out,'bento'),'overlap');
 assert.equal(back.overlapColumns[2].enabled,false);assert.equal(back.overlapSizing.panel2_2.height,120);assert.equal(back.overlapPositions.panel2_2.y,650);
});
test('five/three column bases anchor wide columns and retain hidden settings through export',()=>{
 const base=events.switchLayoutPreset({layoutVersion:4,panelContent:{...Object.fromEntries(events.allPanelKeys.map(key=>[key,{type:'none',url:''}])),panel2_2:{type:'web',url:'https://example.invalid/retained'}}},'overlap');
 for(const gap of events.panelGaps)for(let mask=0;mask<8;mask++)for(let enableMask=0;enableMask<32;enableMask++){
  const config=structuredClone(base);config.panelGap=gap;
  [1,3,5].forEach((c,i)=>config.overlapColumns[c].widthBasis=mask&(1<<i)?3:5);
  for(let c=1;c<=5;c++)config.overlapColumns[c].enabled=!!(enableMask&(1<<(c-1)));
  const before=structuredClone(config),columns=events.effectiveOverlapColumns(config.overlapColumns,config.panelEnabled),flags=events.effectivePanelEnabled(config),layout=events.resolveConfigLayout(config);
  assert.deepEqual(config,before);events.validateLayout(layout,{allowDecimals:true});assert.deepEqual(events.overlapCollisions(layout,flags),[]);
  for(const c of [2,4])assert.equal(columns[c].enabled,config.overlapColumns[c].enabled&&![c-1,c+1].some(peer=>config.overlapColumns[peer].enabled&&config.overlapColumns[peer].widthBasis===3));
  for(const c of [1,3,5])if(columns[c].enabled&&columns[c].widthBasis===3){
   assert.equal(layout['panel'+c+'_1'].width,(1920-4*gap)/3);
   const b=layout['panel'+c+'_1'];assert.ok(Math.abs(c===1?b.x-gap:c===3?b.x+b.width/2-960:b.x+b.width-(1920-gap))<1e-9);
  }
 }
 base.overlapSizing.panel2_1={heightMode:'fixed',height:200};base.overlapSizing.panel2_3={heightMode:'fixed',height:128};base.overlapSizing.panel2_2={heightMode:'fixed',height:120};base.overlapPositions.panel2_2={mode:'fixed',y:650};
 base.overlapColumns[1].widthBasis=3;base.overlapColumns[3].widthBasis=3;
 let out=saved(base);assert.equal(out.panelRenderEnabled.panel2_2,false);assert.equal(out.panelEnabled.panel2_2,true);
 const back=events.switchLayoutPreset(events.switchLayoutPreset(out,'bento'),'overlap');assert.equal(back.panelContent.panel2_2.url,base.panelContent.panel2_2.url);
 back.overlapColumns[1].widthBasis=5;assert.equal(events.effectivePanelEnabled(back).panel2_2,false);
 back.overlapColumns[3].widthBasis=5;out=saved(back);assert.equal(out.panelRenderEnabled.panel2_2,true);assert.equal(out.layout.panel2_2.height,128);assert.equal(out.overlapSizing.panel2_2.height,120);assert.equal(out.layout.panel2_2.y,650);
 back.overlapColumns[2].enabled=false;back.overlapColumns[1].widthBasis=3;back.overlapColumns[1].widthBasis=5;assert.equal(events.effectivePanelEnabled(back).panel2_2,false);
 const legacy={...base,overlapColumns:{1:{widthMode:'fixed',width:600}}};assert.equal(events.resolveConfigLayout(legacy).panel1_1.width,355.2);assert.equal(saved(legacy).overlapColumns[1].width,600);
});

test('legacy zero-count columns migrate to disabled without rewriting drafts and invalid columns fail',()=>{
 const raw={...all,panel2_1:false,panel2_2:false,panel2_3:false};assert.equal(events.normalizeOverlapColumns(undefined,raw)[2].enabled,false);
 for(const cols of [null,[],{6:{}},{1:{enabled:'yes'}},{1:{widthMode:'bad'}},{1:{width:0}},{1:{width:1857}},{1:{unknown:true}},{1:{widthBasis:4}},{1:{widthBasis:'3'}},{2:{widthBasis:3}}])assert.throws(()=>events.normalizeOverlapColumns(cols));
 for(const panelGap of events.panelGaps)for(let mask=0;mask<32;mask++){
  const overlapColumns=Object.fromEntries([1,2,3,4,5].map((c,i)=>[c,{enabled:!!(mask&(1<<i))}]));
  const config={layoutVersion:4,layoutMode:'overlap',panelEnabled:all,panelGap,overlapColumns};events.validateLayout(events.resolveConfigLayout(config),{allowDecimals:true});
 }
});

 test('disabling any columns never changes other columns x or width, including exports',()=>{
 const base=events.switchLayoutPreset({layoutVersion:4},'overlap'),original=events.resolveConfigLayout(base);
 for(let mask=0;mask<32;mask++){
  const config=structuredClone(base);for(let c=1;c<=5;c++)config.overlapColumns[c].enabled=!!(mask&(1<<(c-1)));
  const layout=events.resolveConfigLayout(config),output=saved(config);
  for(let c=1;c<=5;c++)if(config.overlapColumns[c].enabled){assert.equal(layout['panel'+c+'_1'].x,original['panel'+c+'_1'].x);assert.equal(layout['panel'+c+'_1'].width,original['panel'+c+'_1'].width);assert.deepEqual(output.layout['panel'+c+'_1'],layout['panel'+c+'_1']);}
 }
 });
