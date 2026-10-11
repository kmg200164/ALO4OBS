const test=require('node:test'),assert=require('node:assert/strict');
const events=require('../template/events.js'),pack=require('../template/pack.js');
const content=()=>Object.fromEntries(events.allPanelKeys.map(key=>[key,{type:'none',url:''}]));
const input=extra=>({layoutVersion:4,layoutMode:'overlap',panelContent:content(),...extra});
const exportConfig=config=>JSON.parse(new TextDecoder().decode(pack.settingsEntries(config)[0].bytes));
function prefixCounts(counts){return {game:true,...Object.fromEntries(events.overlapPanelKeys.slice(1).map(key=>{const [column,row]=key.slice(5).split('_').map(Number);return [key,row<=counts[column-1]];}))};}

test('Overlap export defaults to all fifteen fixed named panels with all dormant data retained',()=>{
 const config=input({panelContent:{...content(),panel2_3:{type:'media',url:'assets/retained.png'}},panelShadows:{panel2_3:48}}),before=structuredClone(config);
 const saved=exportConfig(config);
 assert.deepEqual(saved.panelEnabled,prefixCounts([3,3,3,3,3]));
 assert.deepEqual(saved.layout,events.resolveConfigLayout(saved));
 assert.equal(Object.keys(saved.layout).length,16);assert.equal(Object.keys(saved.overlapSizing).length,15);
 assert.deepEqual(saved.layoutPresets.overlap.overlapSizing,saved.overlapSizing);
 assert.deepEqual(saved.panelContent.panel2_3,config.panelContent.panel2_3);assert.equal(saved.panelShadows.panel2_3,48);
 assert.deepEqual(config,before,'export does not mutate the input');
});

test('Overlap export canonicalizes named cells and prefix counts while preserving height values through preset switches',()=>{
 for(const count of [0,1,2,3])for(const gap of events.panelGaps){
  const enabled=prefixCounts([count,3,2,1,0]),config=input({overlapColumns:Object.fromEntries([1,2,3,4,5].map(c=>[c,{enabled:true,widthMode:'auto'}])),overlapPositions:{},panelGap:gap,panelEnabled:enabled,overlapPlacement:{panel2_3:{column:5,row:1,columnSpan:1,rowSpan:1}},overlapSizing:{panel2_1:{heightMode:'fixed',height:120},panel2_3:{heightMode:'fixed',height:90}}});
  const saved=exportConfig(config),back=events.switchLayoutPreset(saved,'bento'),again=events.switchLayoutPreset(exportConfig(back),'overlap');
  assert.deepEqual(saved.panelEnabled,enabled);assert.deepEqual(again.panelEnabled,enabled);
  assert.deepEqual(saved.overlapPlacement.panel2_3,{column:2,row:3,columnSpan:1,rowSpan:1});
  assert.equal(saved.layout.panel2_1.height,128);assert.equal(saved.layout.panel2_3.height,128);assert.equal(saved.overlapSizing.panel2_1.height,120);assert.equal(saved.overlapSizing.panel2_3.height,90);
  assert.deepEqual(again.overlapSizing,saved.overlapSizing);assert.deepEqual(events.resolveConfigLayout(again),events.resolveConfigLayout(saved));
  assert.deepEqual(events.overlapCollisions(saved.layout,saved.panelEnabled),[]);
  for(const key of events.overlapPanelKeys.slice(1)){const column=Number(key[5]);assert.equal(saved.layout[key].x,gap+(column-1)*((1920-6*gap)/5+gap));}
 }
 const saved=exportConfig(input({panelEnabled:{panel2_1:false,panel2_2:false,panel2_3:true}}));
 assert.deepEqual([saved.panelEnabled.panel2_1,saved.panelEnabled.panel2_2,saved.panelEnabled.panel2_3],[true,false,false]);
});

test('Malformed active and inactive Overlap sizing is rejected before user data changes',()=>{
 const invalid=[null,[],{unknown:{}},{game:{heightMode:'auto',height:100}},{panel1_1:null},{panel1_1:[]},{panel1_1:{heightMode:'random'}},{panel1_1:{heightMode:'fixed',height:0}},{panel1_1:{heightMode:'fixed',height:1065}},{panel1_1:{heightMode:'fixed',height:'120'}},{panel1_1:{heightMode:'fixed',height:NaN}},{panel1_1:{heightMode:'fixed',height:Infinity}},{panel1_1:{heightMode:'fixed',height:100,width:20}}];
 for(const overlapSizing of invalid)for(const mode of ['active','inactive']){
  const config=mode==='active'?input({overlapSizing}):input({layoutMode:'bento',layoutPresets:{overlap:{overlapSizing}}}),before=structuredClone(config);
  assert.throws(()=>exportConfig(config),/Overlap|overlap|size|height/);assert.deepEqual(config,before);
 }
 assert.throws(()=>exportConfig({...input(),layoutVersion:3,overlapSizing:{}}),/layout version 4/);
});


test('Manual Overlap Y survives upper height, count and preset changes while dormant data remains intact',()=>{
 const positions={panel2_3:{mode:'fixed',y:650},panel5_3:{mode:'fixed',y:890}},sizing={panel2_1:{heightMode:'fixed',height:150},panel2_2:{heightMode:'fixed',height:128},panel5_1:{heightMode:'fixed',height:128},panel5_2:{heightMode:'fixed',height:128},panel2_3:{heightMode:'fixed',height:120},panel5_3:{heightMode:'fixed',height:90}};
 const draft=input({panelEnabled:prefixCounts([1,3,1,1,2]),overlapSizing:sizing,overlapPositions:positions,panelContent:{...content(),panel5_3:{type:'media',url:'assets/retain.png'}}}),before=structuredClone(draft);
 const first=exportConfig(draft);
 assert.equal(first.layout.panel2_3.y,650);const hiddenHeight=events.resolveConfigLayout({...first,overlapPositions:undefined}).panel5_3.height;assert.equal(first.layout.panel5_3.y,Math.floor(1080-first.panelGap-hiddenHeight));assert.equal(first.layout.panel5_3.height,hiddenHeight);
 assert.equal(first.panelEnabled.panel5_3,false);assert.deepEqual(first.overlapPositions.panel5_3,positions.panel5_3);
 assert.deepEqual(first.layoutPresets.overlap.overlapPositions,first.overlapPositions);
 const resized=exportConfig({...first,overlapSizing:{...first.overlapSizing,panel2_1:{heightMode:'fixed',height:300}}});assert.equal(resized.layout.panel2_3.y,650);
 const reduced=exportConfig({...resized,panelEnabled:prefixCounts([1,1,1,1,2])});assert.equal(reduced.panelEnabled.panel2_3,false);assert.equal(reduced.layout.panel2_3.y,728);assert.equal(reduced.overlapPositions.panel2_3.y,650);
 const bento=exportConfig(events.switchLayoutPreset(reduced,'bento'));
 assert.deepEqual(bento.layoutPresets.overlap.overlapPositions,reduced.overlapPositions);
 const restored=exportConfig({...events.switchLayoutPreset(bento,'overlap'),panelEnabled:prefixCounts([1,3,1,1,3])});
 assert.equal(restored.layout.panel2_3.y,650);assert.equal(restored.layout.panel5_3.y,890);
 assert.deepEqual(restored.overlapPositions,first.overlapPositions);assert.deepEqual(restored.panelContent.panel5_3,draft.panelContent.panel5_3);assert.deepEqual(draft,before);
 const collision=exportConfig(input({panelEnabled:prefixCounts([3,1,1,1,1]),overlapSizing:{panel1_1:{heightMode:'fixed',height:100},panel1_2:{heightMode:'fixed',height:100},panel1_3:{heightMode:'fixed',height:128}},overlapPositions:{panel1_1:{mode:'fixed',y:300},panel1_2:{mode:'fixed',y:300}}}));
 assert.equal(collision.layout.panel1_1.y,300);assert.equal(collision.layout.panel1_2.y,452);assert.deepEqual(events.overlapCollisions(collision.layout,collision.panelEnabled),[]);assert.equal(collision.overlapPositions.panel1_2.y,300);assert.equal(collision.overlapSizing.panel1_2.height,100);
});

test('Malformed active and inactive manual Y fields fail without changing user data',()=>{
 const invalid=[null,[],{unknown:{}},{game:{mode:'fixed',y:20}},{panel1_1:null},{panel1_1:[]},{panel1_1:{mode:'manual',y:20}},{panel1_1:{mode:'fixed',y:-1}},{panel1_1:{mode:'fixed',y:1080}},{panel1_1:{mode:'fixed',y:1.5}},{panel1_1:{mode:'fixed',y:'20'}},{panel1_1:{mode:'fixed',y:NaN}},{panel1_1:{mode:'fixed',y:Infinity}},{panel1_1:{mode:'fixed',y:20,x:30}}];
 for(const overlapPositions of invalid)for(const mode of ['active','inactive']){
  const config=mode==='active'?input({overlapPositions}):input({layoutMode:'bento',layoutPresets:{overlap:{overlapPositions}}}),before=structuredClone(config);
  assert.throws(()=>exportConfig(config),/Overlap|overlap|position/);assert.deepEqual(config,before);
 }
 assert.throws(()=>exportConfig({...input(),layoutVersion:3,overlapPositions:{}}),/layout version 4/);
});


test('column alignment and imported overflow Y roundtrip independently for active and inactive presets',()=>{
 const alignment={'1':'bottom','2':'center','3':'top','4':'bottom','5':'center'};
 const draft=input({panelEnabled:prefixCounts([3,3,3,3,3]),overlapColumnAlignment:alignment,overlapSizing:{panel2_2:{heightMode:'fixed',height:200}},overlapPositions:{panel2_2:{mode:'fixed',y:1079}}});
 const before=structuredClone(draft),first=exportConfig(draft);
 assert.deepEqual(first.overlapColumnAlignment,alignment);assert.deepEqual(first.layoutPresets.overlap.overlapColumnAlignment,alignment);
 assert.equal(first.layout.panel2_2.y,440);assert.equal(first.layout.panel2_2.height,200);assert.equal(first.overlapPositions.panel2_2.y,1079);
 assert.equal(first.layoutPresets.overlap.overlapPositions.panel2_2.y,1079);assert.deepEqual(draft,before);
 const bento=exportConfig(events.switchLayoutPreset(first,'bento'));
 assert.deepEqual(bento.layoutPresets.overlap.overlapColumnAlignment,alignment);
 bento.overlapColumnAlignment={'1':'center','2':'top','3':'bottom','4':'center','5':'top'};
 const bentoSaved=exportConfig(bento),again=exportConfig(events.switchLayoutPreset(bentoSaved,'overlap'));
 assert.deepEqual(bentoSaved.layoutPresets.bento.overlapColumnAlignment,bento.overlapColumnAlignment);
 assert.deepEqual(again.overlapColumnAlignment,alignment);assert.equal(again.overlapPositions.panel2_2.y,1079);assert.equal(again.layout.panel2_2.height,200);
 assert.deepEqual(exportConfig(again),again);
 const presetOnly=input({layoutPresets:again.layoutPresets});assert.deepEqual(exportConfig(presetOnly).layout,again.layout);
});

test('malformed active and inactive column alignment fails before user config is changed',()=>{
 for(const overlapColumnAlignment of [null,[],{'0':'top'},{'6':'bottom'},{'1':'middle'},{'1':null},{'1':false},{'1':{}},JSON.parse('{"__proto__":"top"}')])for(const mode of ['active','inactive']){
  const config=mode==='active'?input({overlapColumnAlignment}):input({layoutMode:'bento',layoutPresets:{overlap:{overlapColumnAlignment}}}),before=structuredClone(config);
  assert.throws(()=>exportConfig(config),/Overlap|overlap|alignment/i);assert.deepEqual(config,before);
 }
 assert.throws(()=>exportConfig({...input(),layoutVersion:3,overlapColumnAlignment:{}}),/layout version 4/);
});
