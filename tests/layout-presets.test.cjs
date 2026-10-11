const test=require('node:test'),assert=require('node:assert/strict');
const events=require('../template/events.js'),pack=require('../template/pack.js');
const keys=events.allPanelKeys;
const generic=()=>({layoutVersion:4,panelContent:Object.fromEntries(keys.map(key=>[key,{type:'none',url:''}]))});
const saved=config=>JSON.parse(new TextDecoder().decode(pack.settingsEntries(config)[0].bytes));

function assertSafe(layout,enabled,gap){
 for(let column=1;column<=5;column++){
  const active=[1,2,3].map(row=>'panel'+column+'_'+row).filter(key=>enabled[key]!==false);
  for(let index=0;index<active.length;index++){
   const box=layout[active[index]];assert.ok(box.height>=128);assert.ok(Number.isInteger(box.height)&&Number.isInteger(box.y));
   assert.ok(box.y>=gap&&box.y+box.height<=1080-gap);
   if(index){const upper=layout[active[index-1]];assert.ok(box.y>=upper.y+upper.height+gap);}
  }
 }
 assert.deepEqual(events.overlapCollisions(layout,enabled),[]);
}

test('Overlap has a full-canvas Main and bounded fractional five-column cells',()=>{
 const layout=events.overlapLayout();
 assert.deepEqual(layout.game,{x:0,y:0,width:1920,height:1080});
 assert.deepEqual(layout.panel2_3,{x:403.2,y:728,width:355.2,height:328});
 assert.equal(events.overlapSafetyGrid.length,15);
 assert.equal(events.overlapSafetyGrid.filter(cell=>cell.safety==='red').length,6);
 assert.equal(events.overlapSafetyGrid.filter(cell=>cell.safety==='yellow').length,5);
 for(const column of [1,5])assert.equal(events.overlapSafetyGrid.find(cell=>cell.column===column&&cell.row===2).safety,'yellow');
 for(const gap of events.panelGaps)events.validateLayout(events.overlapLayout({gap}),{allowDecimals:true});
});
test('legacy configs migrate without changing Bento layout or shared settings',()=>{
 const input={...generic(),panelGap:32,sidePosition:'left',panelEnabled:{custom2:false},name:'user',globalStyle:{fill:{mode:'solid',color:'#abcdef'}}};
 const original=structuredClone(input),presets=events.normalizeLayoutPresets(input);
 assert.deepEqual(input,original);
 assert.equal(presets.bento.panelGap,32);assert.equal(presets.overlap.panelGap,24);
 const overlap=events.switchLayoutPreset(input,'overlap');
 assert.equal(overlap.layoutMode,'overlap');assert.equal(overlap.panelGap,24);
 assert.deepEqual(overlap.panelContent,input.panelContent);assert.deepEqual(overlap.globalStyle,input.globalStyle);
 const back=events.switchLayoutPreset({...overlap,panelGap:48,overlapPlacement:{...overlap.overlapPlacement,panel4_1:{column:2,row:2,columnSpan:2,rowSpan:1}}},'bento');
 assert.equal(back.panelGap,32);assert.equal(back.sidePosition,'left');assert.equal(back.panelEnabled.custom2,false);
 const again=events.switchLayoutPreset(back,'overlap');assert.equal(again.panelGap,48);assert.equal(again.overlapPlacement.panel4_1.columnSpan,1);assert.equal(again.overlapPlacement.panel4_1.column,4);
 assert.deepEqual(events.resolveConfigLayout(back),events.autoLayout({placement:input.panelPlacement,enabled:input.panelEnabled,sizing:input.panelSizing,gap:32,sidePosition:'left'}));
});
test('export roundtrip preserves presets, decimals and intentional full-canvas overlaps',()=>{
 const input=events.switchLayoutPreset({...generic(),cornerRadius:24,cornerSmoothing:.6,panelShadows:{chat:32}},'overlap');
 const exported=saved(input),roundtrip=saved(exported);
 assert.equal(exported.layoutVersion,4);assert.equal(exported.layoutMode,'overlap');
 assert.deepEqual(roundtrip,exported);assert.equal(exported.layout.panel2_3.x,403.2);
 assert.equal(exported.cornerRadius,24);assert.equal(exported.cornerSmoothing,.6);assert.equal(exported.panelShadows.chat,32);
 assert.deepEqual(events.switchLayoutPreset(exported,'bento').panelContent,input.panelContent);
});
test('untrusted modes, placements, presets and appearance are rejected',()=>{
 for(const layoutMode of ['unknown',null,{},0])assert.throws(()=>events.normalizeLayoutMode(layoutMode));
 for(const value of [null,[],{panel1_1:null},{chat:{column:6,row:1}},{chat:{column:4,row:1,columnSpan:3,rowSpan:1}},{chat:{column:2.5,row:1}},{constructor:{column:1,row:1}}])assert.throws(()=>events.overlapLayout({placement:value}));
 for(const layoutPresets of [null,[],{other:{}},{bento:null},{overlap:{panelGap:5}},{bento:{panelEnabled:{game:'false'}}},JSON.parse('{"__proto__":{}}')])assert.throws(()=>events.normalizeLayoutPresets({layoutPresets}));
 for(const extra of [{cornerRadius:64},{cornerSmoothing:60},{panelShadows:{chat:9}},{panelShadows:{other:8}},{layoutMode:'bad'},{overlapPlacement:{chat:{column:5,row:3,columnSpan:2}}}])assert.throws(()=>saved({...generic(),...extra}));
 assert.throws(()=>pack.settingsEntries({layoutVersion:2,layoutMode:'overlap'}));
 assert.throws(()=>pack.settingsEntries({cornerRadius:64}));
 assert.equal({}.polluted,undefined);
});

test('preset-only saved configs retain active values and independent object snapshots',()=>{
 const presets=events.normalizeLayoutPresets({panelGap:48});
 const config={...generic(),layoutMode:'bento',layoutPresets:presets};
 const switched=events.switchLayoutPreset(config,'bento');
 assert.equal(switched.panelGap,48);assert.equal(saved(config).panelGap,48);
 assert.deepEqual(events.resolveConfigLayout(config),saved(config).layout);
 switched.panelEnabled.custom1=false;
 assert.equal(config.layoutPresets.bento.panelEnabled.custom1,true);
 assert.equal(switched.layoutPresets.bento.panelEnabled.custom1,true);
 for(const value of [null,undefined,'8',NaN]){
  if(value===undefined)continue;
  assert.throws(()=>saved({...generic(),panelShadows:{chat:value}}));
 }
 assert.throws(()=>events.normalizeLayoutPresets({layoutPresets:{bento:{panelSizing:{game:JSON.parse('{"__proto__":{},"width":400}')}}}}));
});
test('legacy valid spans normalize to canonical anchors for every gap',()=>{
 let count=0;
 for(const gap of events.panelGaps)for(let column=1;column<=5;column++)for(let row=1;row<=3;row++)for(let columnSpan=1;columnSpan<=6-column;columnSpan++)for(let rowSpan=1;rowSpan<=4-row;rowSpan++){
  const layout=events.overlapLayout({gap,placement:{panel4_1:{column,row,columnSpan,rowSpan}}});
  assert.ok(layout.panel4_1.x>=gap&&layout.panel4_1.y>=gap);
  assert.ok(layout.panel4_1.x+layout.panel4_1.width<=1920-gap+1e-9);
  assert.ok(layout.panel4_1.y+layout.panel4_1.height<=1080-gap+1e-9);
  count++;
 }
 assert.equal(count,450);
});

test('all fifteen cells start enabled with fixed five-column geometry',()=>{
 const input=events.switchLayoutPreset(generic(),'overlap');
 assert.equal(Object.keys(input.panelEnabled).length,16);assert.equal(Object.values(input.panelEnabled).filter(Boolean).length,16);
 assert.equal(Object.keys(events.resolveConfigLayout(input)).length,16);
 for(const key of events.overlapPanelKeys.slice(1)){const [column,row]=key.slice(5).split('_').map(Number);assert.equal(input.overlapPlacement[key].column,column);assert.equal(input.overlapPlacement[key].row,row);}
 const old={...generic(),panelContent:{custom1:{type:'web',url:'https://example.org/custom'},panel2_3:{type:'source',url:''}},regionBackgrounds:{custom1:{color:'#123456'}},panelShadows:{custom1:48},overlapPlacement:{custom1:{column:3,row:3}}};
 const migrated=events.migrateOverlapPanels(old);assert.equal(migrated.panelContent.panel2_3.type,'source');assert.equal(migrated.panelContent.custom1.type,'web');assert.equal(migrated.regionBackgrounds.panel2_3.color,'#123456');assert.equal(migrated.panelShadows.panel2_3,48);assert.equal(old.panelShadows.panel2_3,undefined);
 assert.equal(events.normalizeOverlapPlacement(old.overlapPlacement).panel2_3.column,2);
 const config=events.switchLayoutPreset(generic(),'overlap');config.overlapPlacement.panel1_1={...config.overlapPlacement.panel2_1};const exported=saved(config);assert.equal(exported.overlapPlacement.panel1_1.column,1);assert.deepEqual(events.overlapCollisions(exported.layout,exported.panelEnabled),[]);
});

test('all safety classifications remain advisory and exportable without auxiliary collisions',()=>{
 for(const cell of events.overlapSafetyGrid){
  const overlap=events.switchLayoutPreset(generic(),'overlap'),key=`panel${cell.column}_${cell.row}`;
  const exported=saved(overlap);assert.equal(exported.overlapPlacement[key].column,cell.column);assert.equal(exported.overlapPlacement[key].row,cell.row);
 }
});

test('canonical anchors repair old collisions without changing independent content or appearance',()=>{
 const input={...generic(),layoutMode:'overlap',overlapPlacement:{custom1:{column:5,row:1,columnSpan:1,rowSpan:1}},panelContent:{custom1:{type:'web',url:'https://example.invalid/legacy'},panel2_3:{type:'media',url:'assets/my.png'}},panelShadows:{panel2_3:32},regionStyleOverrides:{panel2_3:true},regionBackgrounds:{panel2_3:{color:'#123456'}}};
 const original=structuredClone(input),normalized=events.switchLayoutPreset(input,'overlap');
 assert.deepEqual(normalized.overlapPlacement.panel2_3,{column:2,row:3,columnSpan:1,rowSpan:1});assert.deepEqual(input,original);
 for(const field of ['panelContent','panelShadows','regionStyleOverrides','regionBackgrounds'])for(const [key,value] of Object.entries(input[field]))assert.deepEqual(normalized[field][key],value);
 assert.deepEqual(events.overlapCollisions(events.resolveConfigLayout(normalized),normalized.panelEnabled),[]);
});
test('all column count combinations have ordered bounded noncolliding active rectangles',()=>{
 let combinations=0;
 for(const gap of events.panelGaps)for(let code=0;code<1024;code++){
  let bits=code;const enabled={game:true};for(let column=1;column<=5;column++){const count=bits%4;bits=Math.floor(bits/4);for(let row=1;row<=3;row++)enabled['panel'+column+'_'+row]=row<=count;}
  const layout=events.overlapLayout({gap,enabled});assert.equal(Object.keys(layout).length,16);assert.deepEqual(events.overlapCollisions(layout,enabled),[]);
  for(let column=1;column<=5;column++){const active=[1,2,3].map(row=>'panel'+column+'_'+row).filter(key=>enabled[key]);if(!active.length)continue;
   assert.equal(layout[active[0]].y,gap);const last=layout[active.at(-1)];assert.ok(Math.abs(last.y+last.height-(1080-gap))<1e-8);
   for(let i=1;i<active.length;i++)assert.ok(Math.abs(layout[active[i]].y-layout[active[i-1]].y-layout[active[i-1]].height-gap)<1e-8);
  }combinations++;
 }assert.equal(combinations,5120);
});
test('fixed heights reserve peer minima; oversized imports project without changing requested sizes',()=>{
 const enabled=Object.fromEntries(events.overlapPanelKeys.map(key=>[key,true])),sizing={panel2_1:{heightMode:'fixed',height:200},panel2_2:{heightMode:'fixed',height:300}};
 let layout=events.overlapLayout({enabled,sizing,gap:24});assert.equal(layout.panel2_1.height,200);assert.equal(layout.panel2_2.height,300);assert.equal(layout.panel2_3.height,484);assert.equal(layout.panel2_3.y,572);
 sizing.panel2_3={heightMode:'fixed',height:100};layout=events.overlapLayout({enabled,sizing,gap:24});assert.equal(layout.panel2_3.height,128);assert.equal(layout.panel2_3.y+layout.panel2_3.height,700);assert.equal(sizing.panel2_3.height,100);assertSafe(layout,enabled,24);
 for(const key of ['panel2_1','panel2_2','panel2_3'])sizing[key].height=1064;const original=structuredClone(sizing);layout=events.overlapLayout({enabled,sizing,gap:48});assert.deepEqual(sizing,original);assertSafe(layout,enabled,48);
 sizing.panel2_3.heightMode='auto';layout=events.overlapLayout({enabled,sizing,gap:48});assert.ok(layout.panel2_3.height>=128);assertSafe(layout,enabled,48);
});
test('size bounds reserve fixed peers and enabled holes normalize to an identical prefix count',()=>{
 const config={panelGap:24,panelEnabled:{panel2_1:true,panel2_2:false,panel2_3:true},overlapSizing:{panel2_1:{heightMode:'fixed',height:200}}};
 assert.deepEqual(events.normalizeOverlapEnabled(config.panelEnabled),{...events.normalizeOverlapEnabled(),panel2_2:true});
 assert.deepEqual(events.overlapSizingBounds(config,'panel2_2'),{min:128,max:808});assert.deepEqual(events.overlapSizingBounds(config,'panel2_3'),{min:128,max:656});
 const sizing=events.normalizeOverlapSizing(config.overlapSizing);assert.deepEqual(sizing.panel2_3,{heightMode:'auto',height:328});assert.equal(Object.keys(sizing).length,15);
 for(const invalid of [null,[],{game:{heightMode:'auto',height:328}},{panel2_1:null},{panel2_1:{heightMode:'bad'}},{panel2_1:{height:0}},{panel2_1:{height:1065}},{panel2_1:{height:1.5}},{panel2_1:{width:123}}])assert.throws(()=>events.normalizeOverlapSizing(invalid));
 assert.throws(()=>events.normalizeOverlapEnabled({panel2_1:1}));assert.throws(()=>events.overlapSizingBounds(config,'game'));
});
test('preset switching and export preserve per-preset heights and every hidden panel setting',()=>{
 const initial=events.switchLayoutPreset(generic(),'overlap');initial.panelEnabled=events.normalizeOverlapEnabled();initial.overlapSizing=events.normalizeOverlapSizing();initial.overlapPositions=events.normalizeOverlapPositions();initial.overlapSizing.panel3_1={heightMode:'fixed',height:420};initial.panelContent.panel3_3={type:'web',url:'https://example.invalid/hidden'};
 const bento=events.switchLayoutPreset(initial,'bento'),back=events.switchLayoutPreset(bento,'overlap');assert.deepEqual(back.overlapSizing.panel3_1,initial.overlapSizing.panel3_1);assert.deepEqual(back.panelContent.panel3_3,initial.panelContent.panel3_3);assert.equal(back.panelEnabled.panel3_3,false);
 const exported=saved(back);assert.deepEqual(exported.overlapSizing,back.overlapSizing);assert.equal(exported.layout.panel3_1.height,420);assert.equal(Object.keys(exported.layout).length,16);assert.deepEqual(saved(exported),exported);
});

test('feasible manual positions retain named columns and fixed Y through peer heights, counts and gaps',()=>{
 const config=events.switchLayoutPreset(generic(),'overlap');config.panelEnabled=Object.fromEntries(events.overlapPanelKeys.map(key=>[key,true]));
 config.overlapPositions=events.normalizeOverlapPositions();config.overlapPositions.panel2_2={mode:'fixed',y:600};
 config.overlapSizing.panel2_1={heightMode:'fixed',height:200};config.overlapSizing.panel2_2={heightMode:'fixed',height:128};config.overlapSizing.panel2_3={heightMode:'fixed',height:128};
 const original=structuredClone(config),before=events.resolveConfigLayout(config);
 assert.equal(before.panel2_2.y,600);assert.equal(before.panel2_2.height,128);assert.equal(before.panel2_2.x,before.panel2_1.x);assert.deepEqual(config,original);assertSafe(before,config.panelEnabled,24);
 config.overlapSizing.panel2_1.height=300;config.panelGap=48;let after=events.resolveConfigLayout(config);assert.equal(after.panel2_2.y,600);assertSafe(after,config.panelEnabled,48);
 config.panelEnabled.panel2_3=false;after=events.resolveConfigLayout(config);assert.equal(after.panel2_2.y,600);assertSafe(after,config.panelEnabled,48);
});
test('manual positions project inside ordered neighbors and canvas gap without rewriting imports',()=>{
 const enabled=Object.fromEntries(events.overlapPanelKeys.map(key=>[key,true])),sizing={panel4_2:{heightMode:'fixed',height:900}},positions={panel4_2:{mode:'fixed',y:1079}},originalSizing=structuredClone(sizing),originalPositions=structuredClone(positions);
 const normal=events.overlapLayout({enabled,sizing}),bottom=events.overlapLayout({enabled,sizing,positions});
 assert.equal(bottom.panel4_2.y,176);assert.equal(bottom.panel4_2.height,728);assert.equal(bottom.panel4_2.height,normal.panel4_2.height);assert.deepEqual(sizing,originalSizing);assert.deepEqual(positions,originalPositions);assertSafe(bottom,enabled,24);
 positions.panel4_2.y=0;const top=events.overlapLayout({enabled,sizing,positions});assert.equal(top.panel4_2.y,176);assertSafe(top,enabled,24);
 assert.deepEqual(events.overlapSizingBounds({panelEnabled:enabled,overlapSizing:sizing},'panel4_2'),{min:128,max:728});
 assert.deepEqual(events.overlapPositionBounds({panelEnabled:enabled,overlapSizing:sizing,overlapPositions:{panel4_2:{mode:'fixed',y:1079}}},'panel4_2'),{min:176,max:176});
 const peers={panel4_1:{heightMode:'fixed',height:200},panel4_2:{heightMode:'fixed',height:200},panel4_3:{heightMode:'fixed',height:200}};
 assert.deepEqual(events.overlapPositionBounds({panelEnabled:enabled,overlapSizing:peers},'panel4_2'),{min:248,max:248});
});
test('positions validate malformed fields and omitted old drafts keep automatic stacking',()=>{
 const defaults=events.normalizeOverlapPositions();assert.equal(Object.keys(defaults).length,15);for(const value of Object.values(defaults))assert.deepEqual(value,{mode:'auto',y:0});
 assert.deepEqual(events.overlapLayout({positions:defaults}),events.overlapLayout());
 for(const invalid of [null,[],{game:{mode:'fixed',y:0}},{panel1_1:null},{panel1_1:{mode:'unknown'}},{panel1_1:{mode:null}},{panel1_1:{y:-1}},{panel1_1:{y:1080}},{panel1_1:{y:0.5}},{panel1_1:{y:NaN}},{panel1_1:{y:Infinity}},{panel1_1:{y:'300'}},{panel1_1:{x:10}},JSON.parse('{"__proto__":{}}')]){
  assert.throws(()=>events.normalizeOverlapPositions(invalid));assert.throws(()=>events.overlapLayout({positions:invalid}));assert.throws(()=>saved({...generic(),overlapPositions:invalid}));
 }
 assert.throws(()=>events.overlapPositionBounds({},'game'));
});
test('hidden positions and sizes survive count changes, preset switches and exported roundtrip',()=>{
 const input=events.switchLayoutPreset(generic(),'overlap');input.panelEnabled=events.normalizeOverlapEnabled();input.overlapSizing=events.normalizeOverlapSizing();input.overlapPositions=events.normalizeOverlapPositions();input.overlapPositions.panel3_3={mode:'fixed',y:1079};input.overlapSizing.panel3_3={heightMode:'fixed',height:500};input.panelContent.panel3_3={type:'web',url:'https://example.invalid/hidden-position'};
 const bento=events.switchLayoutPreset(input,'bento'),back=events.switchLayoutPreset(bento,'overlap');assert.deepEqual(back.overlapPositions,input.overlapPositions);assert.deepEqual(back.overlapSizing,input.overlapSizing);assert.deepEqual(back.panelContent,input.panelContent);
 const original=structuredClone(back),hidden=events.resolveConfigLayout(back),hiddenAllocated=events.resolveConfigLayout({...back,overlapPositions:undefined}).panel3_3.height;assert.equal(hidden.panel3_3.y,Math.floor(1080-back.panelGap-hiddenAllocated));assert.equal(hidden.panel3_3.height,hiddenAllocated);assert.deepEqual(back,original);
 back.panelEnabled.panel3_2=true;back.panelEnabled.panel3_3=true;const visible=events.resolveConfigLayout(back);assert.equal(visible.panel3_3.y,556);assert.equal(visible.panel3_3.height,500);assert.equal(back.overlapSizing.panel3_3.height,500);
 const output=saved(back);assert.deepEqual(output.overlapPositions,back.overlapPositions);assert.deepEqual(output.layoutPresets.overlap.overlapPositions,back.overlapPositions);assert.equal(output.layout.panel3_3.y,556);assert.equal(output.overlapPositions.panel3_3.y,1079);assert.deepEqual(saved(output),output);
 const presetOnly={...generic(),layoutMode:'overlap',layoutPresets:output.layoutPresets};assert.deepEqual(events.resolveConfigLayout(presetOnly),output.layout);
});


test('column alignment offsets spare space while manual requests remain ordered and latent',()=>{
 const enabled=Object.fromEntries(events.overlapPanelKeys.map(key=>[key,true]));
 const sizing=Object.fromEntries(events.overlapPanelKeys.slice(1).map(key=>[key,{heightMode:'fixed',height:100}]));
 const positions={panel2_2:{mode:'fixed',y:650}},originalSizing=structuredClone(sizing),originalPositions=structuredClone(positions);
 for(const gap of events.panelGaps)for(const [alignment,factor] of [['top',0],['center',.5],['bottom',1]]){
  const columnAlignment=Object.fromEntries([1,2,3,4,5].map(column=>[column,alignment]));
  const layout=events.overlapLayout({enabled,sizing,positions,gap,columnAlignment}),offset=Math.round((1080-4*gap-384)*factor);
  assert.equal(layout.panel1_1.y,gap+offset);assert.equal(layout.panel1_2.y,gap+offset+128+gap);assert.equal(layout.panel1_3.y,gap+offset+2*(128+gap));
  assert.equal(layout.panel2_2.y,Math.max(layout.panel2_1.y+128+gap,650));assertSafe(layout,enabled,gap);
  assert.equal(layout.panel1_1.height,128);assert.deepEqual(sizing,originalSizing);assert.deepEqual(positions,originalPositions);
 }
 const auto=events.overlapLayout({enabled,columnAlignment:{1:'bottom'}}),top=events.overlapLayout({enabled});assert.deepEqual(auto,top,'auto heights fill the column');
 const mixed=events.overlapLayout({enabled,sizing,gap:24,columnAlignment:{1:'top',2:'center',3:'bottom'}});assert.deepEqual([mixed.panel1_1.y,mixed.panel2_1.y,mixed.panel3_1.y],[24,324,624]);
});

test('column alignment defaults and schema reject malformed values without mutating inputs',()=>{
 assert.deepEqual(events.normalizeOverlapColumnAlignment(),{'1':'top','2':'top','3':'top','4':'top','5':'top'});
 for(const invalid of [null,[],{'0':'top'},{'6':'top'},{'1':'middle'},{'1':null},{'1':1},{'1':{}},JSON.parse('{"__proto__":"top"}')]){
  const original=structuredClone(invalid);assert.throws(()=>events.normalizeOverlapColumnAlignment(invalid));
  assert.throws(()=>events.overlapLayout({columnAlignment:invalid}));assert.deepEqual(invalid,original);
 }
});


test('alignment follows every column count and integer height allocations keep colliding Y bounded',()=>{
 for(const gap of events.panelGaps)for(const count of [1,2,3])for(const [alignment,factor] of [['top',0],['center',.5],['bottom',1]]){
  const enabled={game:true,...Object.fromEntries(events.overlapPanelKeys.slice(1).map(key=>[key,Number(key.split('_')[1])<=count]))};
  const sizing=Object.fromEntries(events.overlapPanelKeys.slice(1).map(key=>[key,{heightMode:'fixed',height:100}]));
  const layout=events.overlapLayout({enabled,sizing,gap,columnAlignment:{3:alignment}}),offset=Math.round((1080-2*gap-count*128-(count-1)*gap)*factor);
  assert.equal(layout.panel3_1.y,gap+offset);assert.equal(layout['panel3_'+count].y,gap+offset+(count-1)*(128+gap));assertSafe(layout,enabled,gap);
 }
 const enabled=Object.fromEntries(events.overlapPanelKeys.map(key=>[key,true])),sizing={panel1_1:{heightMode:'fixed',height:1064},panel1_2:{heightMode:'fixed',height:1064},panel1_3:{heightMode:'fixed',height:1064}};
 const normal=events.overlapLayout({enabled,sizing,gap:48}),clamped=events.overlapLayout({enabled,sizing,gap:48,positions:{panel1_2:{mode:'fixed',y:1079}}});
 assert.equal(clamped.panel1_2.height,normal.panel1_2.height);assert.equal(clamped.panel1_2.y,normal.panel1_2.y);assertSafe(clamped,enabled,48);
});


test('fresh Overlap and reset seed all rows with fixed sizes and pinned Y; saved custom choices survive',()=>{
 const fresh=events.switchLayoutPreset(generic(),'overlap'),layout=events.resolveConfigLayout(fresh);
 assert.deepEqual(layout.game,{x:0,y:0,width:1920,height:1080});
 for(let column=1;column<=5;column++){
  assert.equal(fresh.overlapColumns[column].enabled,true);assert.equal(fresh.overlapColumns[column].widthMode,'fixed');
  for(let row=1;row<=3;row++){const key=`panel${column}_${row}`;assert.equal(fresh.panelEnabled[key],true);assert.deepEqual(fresh.overlapSizing[key],{heightMode:'fixed',height:328});assert.deepEqual(fresh.overlapPositions[key],{mode:'fixed',y:24+(row-1)*352});}
 }
 assert.equal(layout.panel5_3.x+layout.panel5_3.width,1896);assert.deepEqual(events.overlapCollisions(layout,fresh.panelEnabled),[]);
 fresh.overlapSizing.panel2_1.height=120;fresh.panelEnabled.panel2_3=false;const changed=events.resolveConfigLayout(fresh);assert.deepEqual(changed.panel2_2,layout.panel2_2);
 fresh.overlapColumns[1].enabled=false;assert.equal(events.resolveConfigLayout(fresh).panel2_2.width,layout.panel2_2.width);
 fresh.overlapColumns[2].widthMode='auto';fresh.overlapPositions.panel2_2={mode:'auto',y:300};
 const returned=events.switchLayoutPreset(events.switchLayoutPreset(fresh,'bento'),'overlap');assert.deepEqual(returned.overlapColumns,fresh.overlapColumns);assert.deepEqual(returned.overlapPositions,fresh.overlapPositions);assert.deepEqual(saved(returned).panelEnabled,returned.panelEnabled);
 const clean=events.normalizeLayoutPresets(generic()).overlap;assert.equal(Object.values(clean.panelEnabled).filter(Boolean).length,16);assert.equal(clean.overlapColumns[1].widthMode,'fixed');
});
