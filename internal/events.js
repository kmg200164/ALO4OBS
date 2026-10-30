(function (root) {
  const types = new Set(['chat','subtitle','donation','subscription']);
  const platforms = new Set(['chzzk','twitch','youtube','soop','external']);
  function normalizeEvent(input) {
    if (!input || typeof input !== 'object' || !types.has(input.type)) return null;
    return {platform: platforms.has(input.platform) ? input.platform : 'external',
      channelId: String(input.channelId ?? ''), id: input.id == null ? '' : String(input.id),
      type: input.type, nickname: String(input.nickname ?? ''), text: String(input.text ?? ''),
      timestamp: Number.isFinite(input.timestamp) ? input.timestamp : Date.now()};
  }
  function createEventStore(limit = 100) {
    const capacity = Number.isFinite(limit) ? Math.max(1, Math.floor(limit)) : 100;
    const history = [], seen = new Map();
    return {accept(input) {
      const event = normalizeEvent(input); if (!event) return false;
      const key = event.id ? JSON.stringify([event.platform,event.channelId,event.id,event.type]) : null;
      if (key && seen.has(key)) return false;
      if (key) {seen.set(key,true); if (seen.size > capacity * 10) seen.delete(seen.keys().next().value);}
      history.push(event); if (history.length > capacity) history.shift(); return true;
    }, items() {return history.slice();}};
  }
  function handcamLayout() {return {handHeight:318,chatHeight:317,handY:730};}
  const panelKeys=['game','custom1','custom2','custom3','chat','translation','hand'];
  const bentoPanelKeys=Object.freeze([...panelKeys]),overlapPanelKeys=Object.freeze(['game',...Array.from({length:5},(_,c)=>Array.from({length:3},(_,r)=>`panel${c+1}_${r+1}`)).flat()]),allPanelKeys=Object.freeze([...panelKeys,...overlapPanelKeys.slice(1)]);
  const legacyOverlapKeys=Object.freeze({custom1:'panel2_3',custom2:'panel4_3',custom3:'panel2_1',chat:'panel4_1',translation:'panel5_2',hand:'panel1_2'});
  function activePanelKeys(config={}){return normalizeLayoutMode(config.layoutMode)==='overlap'?overlapPanelKeys:bentoPanelKeys;}
  // Role names are product terms shared by the editor, overlay and OBS script.
  const panelLabels={game:'Main',custom1:'Sub 1',custom2:'Sub 2',custom3:'Sub 3',chat:'Side 1',translation:'Side 2',hand:'Side 3',...Object.fromEntries(overlapPanelKeys.slice(1).map(key=>[key,'Panel '+key.slice(5).replace('_','-')]))};
  function baseLayout() {
    return {game:{x:32,y:32,width:1384,height:778},custom1:{x:32,y:842,width:440,height:206},custom2:{x:504,y:842,width:440,height:206},custom3:{x:976,y:842,width:440,height:206},chat:{x:1448,y:32,width:440,height:317},translation:{x:1448,y:381,width:440,height:317},hand:{x:1448,y:730,width:440,height:318}};
  }
  // One spacing value is both the outer margin and the gap between panels.
  // The Side frame keeps its width; the Main/Sub frame takes what remains.
  const panelGaps=[8,16,24,32,48],sideWidth=440;
  function normalizeGap(value){return panelGaps.includes(value)?value:32;}
  function normalizeSidePosition(value){return value==='left'?'left':'right';}
  function frameSize(gap,sidePosition){const left=normalizeSidePosition(sidePosition)==='left';return {left:1920-3*gap-sideWidth,height:1080-2*gap,mainX:left?sideWidth+2*gap:gap,sideX:left?gap:1920-gap-sideWidth};}
  function defaultPlacement() {
    return {game:{level1:'left',level2:'top',level3:'left'},
      custom1:{level1:'left',level2:'bottom',level3:'left'},
      custom2:{level1:'left',level2:'bottom',level3:'center'},
      custom3:{level1:'left',level2:'bottom',level3:'right'}};
  }
  // Only Main and the Sub band swap rows. Side panels fill their column
  // top to bottom; legacy per-panel Side or left/right values are ignored.
  function normalizePlacement(input,changedKey) {
    if(input!==undefined&&(!input||typeof input!=='object'||Array.isArray(input)))throw new Error('Invalid panel placement');
    const placement=defaultPlacement(),rows={};
    for(const key of Object.keys(placement)){
      const supplied=input?.[key];
      if(supplied!==undefined&&(!supplied||typeof supplied!=='object'||Array.isArray(supplied)))throw new Error(key+': invalid frame level');
      if(supplied?.level2!==undefined&&!['top','center','bottom'].includes(supplied.level2))throw new Error(key+': invalid frame level');
      rows[key]=supplied?.level1!=='right'&&['top','bottom'].includes(supplied?.level2)?supplied.level2:null;
    }
    const changed=['custom1','custom2','custom3'].includes(changedKey)&&rows[changedKey];
    const gameRow=changed?(changed==='top'?'bottom':'top'):rows.game||'top';
    placement.game.level2=gameRow;
    for(const key of ['custom1','custom2','custom3'])placement[key].level2=gameRow==='top'?'bottom':'top';
    return placement;
  }
  function canResizeWidth(key){return ['custom1','custom2','custom3'].includes(key);}
  function canResizeHeight(key){return !canResizeWidth(key);}
  function normalizeSizing(input) {
    if(input!==undefined&&(!input||typeof input!=='object'||Array.isArray(input)))throw new Error('Invalid panel size');
    if(input&&Object.keys(input).some(key=>!panelKeys.includes(key)))throw new Error('Invalid panel size: unknown panel');
    const defaults=baseLayout(),result={};
    for(const key of panelKeys){
      const value=input?.[key];
      if(value!==undefined&&(!value||typeof value!=='object'||Array.isArray(value)))throw new Error('Invalid panel size: '+key);
      const entry=result[key]={widthMode:'auto',width:defaults[key].width,heightMode:'auto',height:defaults[key].height,...(value||{})};
      for(const axis of ['width','height']){
        if(!['auto','fixed'].includes(entry[axis+'Mode']))throw new Error('Invalid panel size: '+key+' '+axis+' mode');
        const maximum=axis==='width'?1856:1016;
        if(!Number.isInteger(entry[axis])||entry[axis]<1||entry[axis]>maximum)throw new Error('Invalid panel size: '+key+' '+axis+' must be an integer from 1 to '+maximum);
      }
      if(key==='game'&&entry.aspect!==undefined){
        if(!['auto','16:9','21:9','32:9'].includes(entry.aspect))throw new Error('Invalid panel size: game aspect');
        entry.heightMode='auto';
      }
      if(!canResizeWidth(key)){entry.widthMode='auto';entry.width=defaults[key].width;}
      if(!canResizeHeight(key)){entry.heightMode='auto';entry.height=defaults[key].height;}
    }
    return result;
  }
  // Each frame reserves fixed sizes first; automatic peers divide the remainder.
  // Minimums include descendant fixed sizes, so an automatic frame never clips them.
  function allocateSizes(entries,extent,axis,gap,fit=false) {
    const available=extent-gap*(entries.length-1);
    // Rendering never fails on an overfull Sub row: fixed widths are clamped to
    // their range and, if they still overflow, shrink in proportion. Stored sizes
    // stay untouched, so the editor warns instead of rewriting them.
    if(fit){
      entries=entries.map(entry=>entry.fixed===undefined?entry:{...entry,fixed:Math.min(entry.maximum??extent,Math.max(entry.minimum??1,entry.fixed))});
      if(entries.reduce((sum,entry)=>sum+(entry.fixed??entry.minimum??1),0)>available)entries=entries.map(entry=>entry.fixed===undefined?entry:{...entry,fixed:undefined,weight:entry.fixed});
    }
    const sizes=entries.map(entry=>entry.fixed??null);
    const required=entries.reduce((sum,entry)=>sum+(entry.fixed??entry.minimum??1),0);
    if(entries.some(entry=>entry.fixed!==undefined&&(entry.fixed<(entry.minimum??1)||entry.fixed>(entry.maximum??extent))))throw new Error('Fixed panel sizes exceed available '+axis+': keep each panel within its usable range');
    if(required>available)throw new Error('Fixed panel sizes exceed available '+axis+': sizes and gaps must fit');
    let remaining=available-sizes.reduce((sum,size)=>sum+(size??0),0);
    let automatic=entries.map((entry,index)=>index).filter(index=>sizes[index]===null);
    while(automatic.length){
      const weight=automatic.reduce((sum,index)=>sum+(entries[index].weight??1),0);
      const constrained=automatic.filter(index=>Math.floor(remaining*(entries[index].weight??1)/weight)<(entries[index].minimum??1));
      if(constrained.length){
        for(const index of constrained){sizes[index]=entries[index].minimum??1;remaining-=sizes[index];}
        automatic=automatic.filter(index=>!constrained.includes(index));
        continue;
      }
      let used=0;
      automatic.forEach((index,position)=>{
        sizes[index]=position===automatic.length-1?remaining-used:Math.floor(remaining*(entries[index].weight??1)/weight);
        used+=sizes[index];
      });
      break;
    }
    return sizes;
  }
  function sizingMinimum(reference,key,axis,gap=32,sidePosition='right'){
    // The Sub minimum is a square at the height left by a 16:9 Main.
    if(axis==='width'&&canResizeWidth(key)){
      const frame=frameSize(gap,sidePosition);
      return Math.max(1,frame.height-gap-Math.floor(frame.left*9/16));
    }
    // A Side panel at its full 440 px width must be able to reach 16:9.
    if(axis==='height'&&['chat','translation','hand'].includes(key))return Math.min(Math.ceil(reference[key].height/2),Math.round(reference[key].width*9/16));
    return Math.ceil(reference[key][axis]/2);
  }
  function sizedLayout(leftRows,right,sizing,gap,strict,constrained=true,sidePosition='right') {
    const layout=baseLayout(),frame=frameSize(gap,sidePosition);
    const reference=constrained?sizedLayout(leftRows,right,normalizeSizing(),gap,strict,false,sidePosition):null;
    const limits=(key,axis)=>key==='game'&&axis==='height'&&sizing[key].aspect&&sizing[key].aspect!=='auto'?{minimum:1,maximum:frame.height}:reference?{minimum:sizingMinimum(reference,key,axis,gap,sidePosition),maximum:Math.floor(reference[key][axis]*1.5)}:{minimum:1};
    const rowWidths=row=>allocateSizes(row.items.map(key=>({fixed:fixed(key,'width'),...limits(key,'width')})),frame.left,'width',gap,!strict);
    const fixed=(key,axis)=>{
      if(constrained&&key==='game'&&axis==='height'&&sizing[key].aspect&&sizing[key].aspect!=='auto'){
        const row=leftRows.find(row=>row.items.includes(key));
        const width=row?rowWidths(row)[row.items.indexOf(key)]:sideWidth;
        return Math.floor(width*9/Number(sizing[key].aspect.split(':')[0]));
      }
      return sizing[key][axis+'Mode']==='fixed'?sizing[key][axis]:undefined;
    };
    // Outer margins and gaps all use the chosen gap; empty frames stay
    // reserved and fixed children never resize these parents.
    if(leftRows.length){
      const heights=allocateSizes(leftRows.map(row=>{
        const values=row.items.map(key=>fixed(key,'height')).filter(value=>value!==undefined);
        for(const key of row.items){const value=fixed(key,'height'),range=limits(key,'height');if(value!==undefined&&(value<range.minimum||value>(range.maximum??frame.height)))throw new Error('Fixed panel sizes exceed available height: keep each panel within its usable range');}
        const minimum=Math.max(...row.items.map(key=>limits(key,'height').minimum));
        const reservePeerSpace=row.items.includes('game')&&sizing.game.aspect&&sizing.game.aspect!=='auto';
        return {fixed:values.length?Math.max(...values,reservePeerSpace?minimum:0):undefined,minimum,weight:row.weight};
      }),frame.height,'height',gap);
      let y=gap;
      leftRows.forEach((row,rowIndex)=>{
        const height=heights[rowIndex],widths=rowWidths(row);
        let x=frame.mainX;
        row.items.forEach((key,index)=>{
          layout[key]={x,y,width:widths[index],height:fixed(key,'height')??height};x+=widths[index]+gap;
        });
        y+=height+gap;
      });
    }
    if(right.length){
      const heights=allocateSizes(right.map(key=>({fixed:fixed(key,'height'),...limits(key,'height')})),frame.height,'height',gap);
      let y=gap;
      right.forEach((key,index)=>{
        const width=fixed(key,'width')??sideWidth,range=limits(key,'width');
        if(width<range.minimum||width>Math.min(sideWidth,range.maximum??sideWidth))throw new Error('Fixed panel sizes exceed available width: Side frame stays one column wide');
        layout[key]={x:frame.sideX,y,width,height:heights[index]};y+=heights[index]+gap;
      });
    }
    return layout;
  }
  function hierarchicalLayout(placement,enabled,sizing,gap,strict,sidePosition) {
    placement=normalizePlacement(placement);
    const active=panelKeys.filter(key=>enabled[key]!==false);
    const left=active.filter(key=>placement[key]),right=active.filter(key=>!placement[key]);
    const rows=['top','bottom'].map(level=>({items:left.filter(key=>placement[key].level2===level),weight:1})).filter(row=>row.items.length);
    if(rows.length===2)for(const row of rows)row.weight=row.items.includes('game')?778:206;
    return sizedLayout(rows,right,sizing,gap,strict,true,sidePosition);
  }
  function resolveLayout(positions = {}) {
    const layout=baseLayout();
    if(!positions || typeof positions!=='object' || Array.isArray(positions))throw new Error('Invalid layout');
    for(const [key,box] of Object.entries(layout)) {
      const position=positions[key];
      if(position!==undefined) {
        if(!position || !Number.isInteger(position.x) || !Number.isInteger(position.y) || position.x<0 || position.y<0 || position.x+box.width>1920 || position.y+box.height>1080)throw new Error(key+': position must fit the 1920 × 1080 canvas');
        box.x=position.x;box.y=position.y;
      }
    }
    return layout;
  }
  // strict rejects an overfull Sub row (used to find limits); rendering fits it.
  function autoLayout({order=panelKeys,placement,enabled={},sizing,gap,strict=false,sidePosition='right'}={}) {
    if(!Array.isArray(order)||!enabled||typeof enabled!=='object'||Array.isArray(enabled))throw new Error('Invalid auto layout');
    sizing=normalizeSizing(sizing);gap=normalizeGap(gap);
    if(placement!==undefined)return hierarchicalLayout(placement,enabled,sizing,gap,strict,sidePosition);
    const seen=new Set();
    for(const key of order){if(!panelKeys.includes(key)||seen.has(key))throw new Error('Invalid panel order');seen.add(key);}
    const ordered=[...order,...panelKeys.filter(key=>!seen.has(key))],active=ordered.filter(key=>enabled[key]!==false);
    if(!active.length)return baseLayout();
    const lead=active[0],bottom=ordered.slice(1,4).filter(key=>key!==lead&&enabled[key]!==false),right=ordered.slice(4).filter(key=>key!==lead&&enabled[key]!==false);
    const rows=[{items:[lead],weight:778}];if(bottom.length)rows.push({items:bottom,weight:206});
    return sizedLayout(rows,right,sizing,gap,strict,true,sidePosition);
  }
  function sizingBounds(options={},key,axis) {
    if(!panelKeys.includes(key)||!['width','height'].includes(axis))throw new Error('Invalid panel size: unknown panel or axis');
    const enabled={...options.enabled,[key]:true},reference=autoLayout({...options,enabled,sizing:undefined});
    const sizing=normalizeSizing(options.sizing),otherAxis=axis==='width'?'height':'width',frame=frameSize(normalizeGap(options.gap),options.sidePosition);
    // Stored heights are capped at 1016 px by normalizeSizing.
    const cap=panel=>axis==='width'?((normalizeSidePosition(options.sidePosition)==='left'?reference[panel].x<frame.mainX:reference[panel].x>=frame.sideX)?sideWidth:frame.left):Math.min(frame.height,1016);
    // Reference the all-automatic layout, so dragging never moves its own limits.
    for(const panel of panelKeys){
      sizing[panel][otherAxis+'Mode']='auto';
      sizing[panel][axis]=Math.min(Math.min(Math.floor(reference[panel][axis]*1.5),cap(panel)),Math.max(sizingMinimum(reference,panel,axis),sizing[panel][axis]));
    }
    sizing[key][axis+'Mode']='fixed';
    function fits(value){
      sizing[key][axis]=value;
      try{autoLayout({...options,enabled,sizing,strict:true});return true;}
      catch(error){if(error.message.startsWith('Fixed panel sizes exceed available'))return false;throw error;}
    }
    const minimum=sizingMinimum(reference,key,axis,normalizeGap(options.gap),options.sidePosition);
    let low=minimum,high=Math.min(Math.floor(reference[key][axis]*1.5),cap(key));
    while(low<high){const middle=Math.ceil((low+high)/2);if(fits(middle))low=middle;else high=middle-1;}
    return {min:minimum,max:low};
  }
  // When every enabled Sub is manual, report a row that is narrower ('gap') or
  // wider ('overflow') than the left frame. Nothing is resized automatically.
  function subWidthWarning({panelEnabled={},panelSizing,panelGap}={}) {
    const sizing=normalizeSizing(panelSizing),subs=['custom1','custom2','custom3'].filter(key=>panelEnabled?.[key]!==false);
    if(!subs.length||subs.some(key=>sizing[key].widthMode!=='fixed'))return null;
    const gap=normalizeGap(panelGap),total=subs.reduce((sum,key)=>sum+sizing[key].width,gap*(subs.length-1)),frame=frameSize(gap).left;
    return total<frame?'gap':total>frame?'overflow':null;
  }
  function aspectStops(box,axis,bounds) {
    const other=axis==='width'?box.height:box.width;
    return [[1,'1:1'],[16/9,'16:9']].map(([ratio,label])=>({label,value:Math.round(axis==='width'?other*ratio:other/ratio)}))
      .filter(stop=>stop.value>=bounds.min&&stop.value<=bounds.max);
  }
  const cornerRadii=[8,16,24,32,48],cornerSmoothings=[0,.6,1],panelShadowStrengths=[0,8,16,32,48,64];
  // Shadows share the same individual-style switch as fill and stroke.
  // Missing local values inherit; an explicit zero disables an overridden shadow.
  function effectivePanelShadow(config={},key){
    if(config.layoutMode==='overlap'&&key==='game')return 0;
    const global=panelShadowStrengths.includes(config.globalShadow)?config.globalShadow:0;
    const local=config.regionStyleOverrides?.[key]===true?config.panelShadows?.[key]:undefined;
    return local===undefined?global:panelShadowStrengths.includes(local)?local:global;
  }
  function migratePanelAppearance(config={}){
    const result={...config};
    if(result.globalShadow===undefined)result.globalShadow=0;
    if(config.panelShadows)result.panelShadows={...config.panelShadows};
    if(config.regionStyleOverrides)result.regionStyleOverrides={...config.regionStyleOverrides};
    // Preserve dormant legacy values and explicit switches. Auto-enabling an
    // override for an old shadow would also change/freeze its fill and stroke.
    return result;
  }
  const auxiliaryKeys=overlapPanelKeys.slice(1);
  function normalizeLayoutMode(value){if(value===undefined)return 'bento';if(!['bento','overlap'].includes(value))throw new Error('Invalid layout mode');return value;}
  function objectFields(value,allowed,label){
    if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid '+label);
    const names=Object.keys(value);
    if(names.length>allowed.length||names.some(key=>!allowed.includes(key)))throw new Error('Invalid '+label+': unknown field');
    return value;
  }
  const overlapSafetyGrid=Object.freeze(Array.from({length:15},(_,index)=>{
    const column=index%5+1,row=Math.floor(index/5)+1;
    const safety=(row===1||row===3)&&[1,3,5].includes(column)?'red':row===2?'yellow':'green';
    return Object.freeze({column,row,safety});
  }));
  function defaultOverlapPlacement(){
    return Object.fromEntries(auxiliaryKeys.map(key=>{const [column,row]=key.slice(5).split('_').map(Number);return [key,{column,row,columnSpan:1,rowSpan:1}];}));
  }
  function normalizeOverlapPlacement(input){
    if(input!==undefined)objectFields(input,[...auxiliaryKeys,...Object.keys(legacyOverlapKeys)],'Overlap placement');
    const result=defaultOverlapPlacement();
    for(const key of auxiliaryKeys){
      const legacy=Object.keys(legacyOverlapKeys).find(old=>legacyOverlapKeys[old]===key),supplied=input?.[key]!==undefined?input[key]:input?.[legacy];
      if(supplied===undefined)continue;
      objectFields(supplied,['column','row','columnSpan','rowSpan'],'Overlap placement: '+key);
      const entry={...result[key],...supplied};
      for(const field of ['column','row','columnSpan','rowSpan'])if(!Number.isInteger(entry[field])||entry[field]<1)throw new Error('Invalid Overlap placement: '+key);
      if(entry.column+entry.columnSpan-1>5||entry.row+entry.rowSpan-1>3)throw new Error('Invalid Overlap placement: '+key+' exceeds grid');
    }
    return result;
  }
  // Development-era six-panel data remains available to Bento and fills only
  // previously absent Overlap cells; an explicit new cell always wins.
  function migrateOverlapPanels(config={}){
    const result={...config};
    for(const field of ['panelContent','regionBackgrounds','regionStyleOverrides','panelShadows']){
      const value=config[field];if(value===undefined)continue;
      objectFields(value,allPanelKeys,field);result[field]={...value};
      for(const [old,key] of Object.entries(legacyOverlapKeys))if(!Object.prototype.hasOwnProperty.call(value,key)&&Object.prototype.hasOwnProperty.call(value,old))result[field][key]=typeof value[old]==='object'&&value[old]!==null?JSON.parse(JSON.stringify(value[old])):value[old];
    }
    return config.layoutVersion===4?migratePanelAppearance(result):result;
  }
  function normalizeOverlapEnabled(input){
    if(input!==undefined){objectFields(input,allPanelKeys,'enabled panels');for(const [key,value] of Object.entries(input))if(typeof value!=='boolean')throw new Error('Invalid enabled panel: '+key);}
    const result={game:true};
    for(let column=1;column<=5;column++){
      const keys=[1,2,3].map(row=>'panel'+column+'_'+row);
      const count=keys.filter((key,index)=>{const legacy=Object.keys(legacyOverlapKeys).find(old=>legacyOverlapKeys[old]===key);return input?.[key]??(legacy?input?.[legacy]:undefined)??(index===0);}).length;
      keys.forEach((key,index)=>result[key]=index<count);
    }
    return result;
  }
  function normalizeOverlapSizing(input){
    if(input!==undefined)objectFields(input,auxiliaryKeys,'Overlap size');
    const result={};
    for(const key of auxiliaryKeys){
      const supplied=input?.[key];if(supplied!==undefined)objectFields(supplied,['heightMode','height'],'Overlap size: '+key);
      const entry={heightMode:'auto',height:328,...supplied};
      if(!['auto','fixed'].includes(entry.heightMode)||!Number.isInteger(entry.height)||entry.height<1||entry.height>1064)throw new Error('Invalid Overlap size: '+key);
      result[key]=entry;
    }
    return result;
  }
  function normalizeOverlapPositions(input){
    if(input!==undefined)objectFields(input,auxiliaryKeys,'Overlap position');
    const result={};
    for(const key of auxiliaryKeys){
      const supplied=input?.[key];if(supplied!==undefined)objectFields(supplied,['mode','y'],'Overlap position: '+key);
      const entry={mode:'auto',y:0,...supplied};
      if(!['auto','fixed'].includes(entry.mode)||!Number.isInteger(entry.y)||entry.y<0||entry.y>1079)throw new Error('Invalid Overlap position: '+key);
      result[key]=entry;
    }
    return result;
  }
  function normalizeOverlapColumnAlignment(input){
    if(input!==undefined)objectFields(input,['1','2','3','4','5'],'Overlap column alignment');
    const result={};
    for(let column=1;column<=5;column++){
      const value=input?.[column]===undefined?'top':input[column];
      if(!['top','center','bottom'].includes(value))throw new Error('Invalid Overlap column alignment: '+column);
      result[column]=value;
    }
    return result;
  }
  function normalizeOverlapColumns(input,enabled){
    if(input!==undefined)objectFields(input,['1','2','3','4','5'],'Overlap columns');
    const flags=normalizeOverlapEnabled(enabled),result={};
    for(let column=1;column<=5;column++){
      const supplied=input?.[column];if(supplied!==undefined)objectFields(supplied,['enabled','widthBasis','widthMode','width'],'Overlap column: '+column);
      const entry={enabled:[1,2,3].some(row=>flags['panel'+column+'_'+row]),widthMode:'auto',width:355,widthBasis:5,...supplied};
      if(![3,5].includes(entry.widthBasis)||(column%2===0&&entry.widthBasis!==5)||typeof entry.enabled!=='boolean'||!['auto','fixed'].includes(entry.widthMode)||!Number.isInteger(entry.width)||entry.width<1||entry.width>1856)throw new Error('Invalid Overlap column: '+column);
      result[column]=entry;
    }
    return result;
  }
  function effectiveOverlapColumns(input,enabled){
    const columns=normalizeOverlapColumns(input,enabled);
    // Keep saved enable choices; adjacent wide columns only suppress rendering.
    for(const column of [2,4])if([column-1,column+1].some(peer=>columns[peer].enabled&&columns[peer].widthBasis===3))columns[column].enabled=false;
    return columns;
  }
  function effectivePanelEnabled(config={}){
    if(normalizeLayoutMode(config.layoutMode)!=='overlap')return {...config.panelEnabled};
    const enabled=normalizeOverlapEnabled(config.panelEnabled),columns=effectiveOverlapColumns(config.overlapColumns,enabled);
    for(const key of auxiliaryKeys)if(!columns[Number(key[5])].enabled)enabled[key]=false;
    return enabled;
  }
  function overlapPositionBounds(config={},key){
    if(!auxiliaryKeys.includes(key))throw new Error('Invalid Overlap panel');
    const layout=overlapLayout({placement:config.overlapPlacement,gap:config.panelGap??24,enabled:config.panelEnabled,sizing:config.overlapSizing,positions:config.overlapPositions,columnAlignment:config.overlapColumnAlignment,columns:config.overlapColumns});
    const enabled=effectivePanelEnabled({...config,layoutMode:'overlap'}),column=key.split('_')[0],row=Number(key.split('_')[1]);
    const before=auxiliaryKeys.filter(peer=>enabled[peer]&&peer.split('_')[0]===column&&Number(peer.split('_')[1])<row),after=auxiliaryKeys.filter(peer=>enabled[peer]&&peer.split('_')[0]===column&&Number(peer.split('_')[1])>row),gap=config.panelGap??24;
    return {min:before.length?Math.ceil(layout[before.at(-1)].y+layout[before.at(-1)].height+gap):gap,max:Math.floor((after.length?layout[after[0]].y-gap:1080-gap)-layout[key].height)};
  }
  function overlapSizingBounds(config={},key){
    if(!auxiliaryKeys.includes(key))throw new Error('Invalid Overlap panel');
    const gap=config.panelGap??24;if(!panelGaps.includes(gap))throw new Error('Invalid panel gap');
    const enabled=normalizeOverlapEnabled(config.panelEnabled),sizing=normalizeOverlapSizing(config.overlapSizing),column=key.split('_')[0];
    const peers=auxiliaryKeys.filter(peer=>peer!==key&&peer.split('_')[0]===column&&enabled[peer]);
    const available=1080-2*gap-peers.length*gap;
    const reserved=peers.reduce((sum,peer)=>sum+(sizing[peer].heightMode==='fixed'?Math.max(128,sizing[peer].height):128),0);
    return {min:128,max:Math.max(128,Math.min(1064,Math.floor(available-reserved)))};
  }
  function overlapLayout({placement,gap=24,enabled,sizing,positions,columnAlignment,columns}={}){
    if(!panelGaps.includes(gap))throw new Error('Invalid panel gap');
    normalizeOverlapPlacement(placement);
    enabled=normalizeOverlapEnabled(enabled);sizing=normalizeOverlapSizing(sizing);positions=normalizeOverlapPositions(positions);columnAlignment=normalizeOverlapColumnAlignment(columnAlignment);
    const width=(1920-6*gap)/5,guideHeight=(1080-4*gap)/3,result={game:{x:0,y:0,width:1920,height:1080}};
    columns=effectiveOverlapColumns(columns,enabled);
    const columnBoxes={};
    for(let column=1;column<=5;column++){
      const wide=columns[column].widthBasis===3,w=wide?(1920-4*gap)/3:width;
      const x=wide?({1:gap,3:(1920-w)/2,5:1920-gap-w}[column]):gap+(column-1)*(width+gap);
      columnBoxes[column]={x,width:w};
    }

    // Hidden panels retain bounded guide boxes for exports; only enabled boxes are rendered.
    for(const key of auxiliaryKeys){const [column,row]=key.slice(5).split('_').map(Number);result[key]={x:gap+(column-1)*(width+gap),y:gap+(row-1)*(guideHeight+gap),width,height:guideHeight};}
    for(let column=1;column<=5;column++){
      if(!columns[column].enabled)continue;
      const keys=[1,2,3].map(row=>'panel'+column+'_'+row).filter(key=>enabled[key]);if(!keys.length)continue;
      const available=1080-2*gap-(keys.length-1)*gap,automatic=keys.filter(key=>sizing[key].heightMode==='auto');
      const fixed=keys.filter(key=>sizing[key].heightMode==='fixed'),heights={};
      for(const key of fixed)heights[key]=Math.max(128,Math.min(sizing[key].height,available-(keys.length-1)*128));
      const fixedSum=fixed.reduce((sum,key)=>sum+heights[key],0),fixedBudget=available-automatic.length*128;
      if(fixedSum>fixedBudget){const scale=(fixedBudget-fixed.length*128)/(fixedSum-fixed.length*128);for(const key of fixed)heights[key]=128+(heights[key]-128)*scale;}
      for(const key of fixed)heights[key]=Math.floor(heights[key]);
      const remainder=available-fixed.reduce((sum,key)=>sum+heights[key],0);
      automatic.forEach((key,index)=>heights[key]=Math.floor(remainder/automatic.length)+(index<remainder%automatic.length?1:0));
      const spare=Math.max(0,available-keys.reduce((sum,key)=>sum+heights[key],0));
      let y=gap+Math.round(spare*({top:0,center:0.5,bottom:1}[columnAlignment[column]]));for(const key of keys){result[key]={...columnBoxes[column],y,height:heights[key]};y+=heights[key]+gap;}
    }
    // Project requested Y positions into an ordered stack with space reserved for every peer.
    for(let column=1;column<=5;column++){
      if(!columns[column].enabled)continue;
      const keys=[1,2,3].map(row=>'panel'+column+'_'+row).filter(key=>enabled[key]);
      let floor=gap;
      for(let index=0;index<keys.length;index++){
        const key=keys[index],box=result[key],remaining=keys.slice(index+1).reduce((sum,peer)=>sum+result[peer].height+gap,0),ceiling=1080-gap-box.height-remaining;
        box.y=Math.max(floor,Math.min(positions[key].mode==='fixed'?positions[key].y:box.y,ceiling));floor=box.y+box.height+gap;
      }
    }
    return validateLayout(result,{allowDecimals:true});
  }
  function overlapCollisions(layout,enabled={}){
    validateLayout(layout,{allowDecimals:true});
    enabled=normalizeOverlapEnabled(enabled);
    const collisions=[];
    for(let index=0;index<auxiliaryKeys.length;index++)for(let peer=index+1;peer<auxiliaryKeys.length;peer++){
      const first=auxiliaryKeys[index],second=auxiliaryKeys[peer];
      if(enabled[first]===false||enabled[second]===false)continue;
      const a=layout[first],b=layout[second];
      if(a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height)collisions.push([first,second]);
    }
    return collisions;
  }
  function normalizeLayoutSnapshot(input,mode){
    if(input===undefined)input=mode==='overlap'?{
      panelEnabled:Object.fromEntries(overlapPanelKeys.map(key=>[key,true])),
      overlapColumns:Object.fromEntries([1,2,3,4,5].map(column=>[column,{enabled:true,widthMode:'fixed',width:column===3?356:355}])),
      overlapSizing:Object.fromEntries(auxiliaryKeys.map(key=>[key,{heightMode:'fixed',height:328}])),
      overlapPositions:Object.fromEntries(auxiliaryKeys.map(key=>[key,{mode:'fixed',y:24+(Number(key.split('_')[1])-1)*352}]))
    }:{};
    objectFields(input,['panelGap','panelEnabled','panelPlacement','panelSizing','sidePosition','overlapPlacement','overlapSizing','overlapPositions','overlapColumnAlignment','overlapColumns'],'layout preset');
    const panelGap=input.panelGap===undefined?(mode==='overlap'?24:32):input.panelGap;
    if(!panelGaps.includes(panelGap))throw new Error('Invalid panel gap');
    if(input.sidePosition!==undefined&&!['left','right'].includes(input.sidePosition))throw new Error('Invalid Side position');
    if(input.panelEnabled!==undefined){objectFields(input.panelEnabled,allPanelKeys,'enabled panels');for(const [key,value] of Object.entries(input.panelEnabled))if(typeof value!=='boolean')throw new Error('Invalid enabled panel: '+key);}
    const panelEnabled=mode==='overlap'?normalizeOverlapEnabled(input.panelEnabled):Object.fromEntries(bentoPanelKeys.map(key=>[key,input.panelEnabled?.[key]!==false]));
    if(input.panelPlacement!==undefined){
      objectFields(input.panelPlacement,panelKeys,'panel placement');
      for(const key of panelKeys){const entry=input.panelPlacement[key];if(entry===undefined)continue;objectFields(entry,['level1','level2','level3'],'panel placement: '+key);
        // Legacy Side placement values are ignored by the canonical Bento normalizer.
        if(!['game','custom1','custom2','custom3'].includes(key))continue;
        if(entry.level1!==undefined&&!['left','right'].includes(entry.level1)||entry.level2!==undefined&&!['top','center','bottom'].includes(entry.level2)||entry.level3!==undefined&&!['left','center','right'].includes(entry.level3))throw new Error('Invalid panel placement: '+key);
      }
    }
    if(input.panelSizing!==undefined){
      objectFields(input.panelSizing,panelKeys,'panel size');
      for(const key of panelKeys)if(input.panelSizing[key]!==undefined)objectFields(input.panelSizing[key],['widthMode','width','heightMode','height','aspect'],'panel size: '+key);
    }
    return {panelGap,panelEnabled,panelPlacement:normalizePlacement(input.panelPlacement),panelSizing:normalizeSizing(input.panelSizing),sidePosition:normalizeSidePosition(input.sidePosition),overlapPlacement:normalizeOverlapPlacement(input.overlapPlacement),overlapSizing:normalizeOverlapSizing(input.overlapSizing),overlapPositions:normalizeOverlapPositions(input.overlapPositions),overlapColumnAlignment:normalizeOverlapColumnAlignment(input.overlapColumnAlignment),overlapColumns:normalizeOverlapColumns(input.overlapColumns,panelEnabled)};
  }
  function activeLayoutSnapshot(config,mode,previous={}){return normalizeLayoutSnapshot({...previous,...Object.fromEntries(['panelGap','panelEnabled','panelPlacement','panelSizing','sidePosition','overlapPlacement','overlapSizing','overlapPositions','overlapColumnAlignment','overlapColumns'].filter(key=>config[key]!==undefined).map(key=>[key,config[key]]))},mode);}
  function normalizeLayoutPresets(config={}){
    const mode=normalizeLayoutMode(config.layoutMode),input=config.layoutPresets;
    if(input!==undefined)objectFields(input,['bento','overlap'],'layout presets');
    const result={bento:normalizeLayoutSnapshot(input?.bento,'bento'),overlap:normalizeLayoutSnapshot(input?.overlap,'overlap')};
    // Active editor fields win over its last saved snapshot; inactive layouts remain intact.
    result[mode]=activeLayoutSnapshot(config,mode,result[mode]);
    return result;
  }
  function switchLayoutPreset(config,mode){
    mode=normalizeLayoutMode(mode);
    const layoutPresets=normalizeLayoutPresets(config);
    return {...migrateOverlapPanels(config),...normalizeLayoutSnapshot(layoutPresets[mode],mode),layoutMode:mode,layoutPresets};
  }
  function resolveConfigLayout(config={}){
    const mode=normalizeLayoutMode(config.layoutMode);
    if(config.layoutVersion===4)config={...config,...normalizeLayoutPresets(config)[mode]};
    if(mode==='overlap')return overlapLayout({placement:config.overlapPlacement,gap:config.panelGap,enabled:config.panelEnabled,sizing:config.overlapSizing,positions:config.overlapPositions,columnAlignment:config.overlapColumnAlignment,columns:config.overlapColumns});
    if(config.layoutVersion===3||config.layoutVersion===4)return autoLayout({order:config.layoutOrder,placement:config.panelPlacement,enabled:config.panelEnabled,sizing:config.panelSizing,gap:config.panelGap,sidePosition:config.sidePosition});
    return resolveLayout(config.layoutVersion===2?config.layout:undefined);
  }
  function validateLayout(layout,{allowDecimals=false,keys:requiredKeys}={}) {
    if(!layout || typeof layout!=='object' || Array.isArray(layout))throw new Error('Invalid layout');
    const expected=requiredKeys||(Object.prototype.hasOwnProperty.call(layout,'panel1_1')?overlapPanelKeys:bentoPanelKeys);
    for(const key of expected){
      const box=layout[key];
      if(!box || typeof box!=='object' || Array.isArray(box) ||
         ![box.x,box.y,box.width,box.height].every(allowDecimals?Number.isFinite:Number.isInteger) ||
         box.x<0 || box.y<0 || box.width<1 || box.height<1 ||
         box.x+box.width>1920 || box.y+box.height>1080)throw new Error(key+': box must fit the 1920 × 1080 canvas');
    }
    return layout;
  }
  function resolveSlots(input) {
    const slots=input??{custom1:'sponsor',custom2:'alerts',custom3:'none'};
    if(!slots || typeof slots!=='object' || Array.isArray(slots))throw new Error('Invalid small regions');
    const result={},used=new Set();
    for(const key of ['custom1','custom2','custom3']){
      const role=slots[key];
      if(!['sponsor','alerts','image','video','browser','source','none'].includes(role))throw new Error('Invalid small region: '+key);
      if(['sponsor','alerts'].includes(role)&&used.has(role))throw new Error('홍보와 알림은 한 칸씩만 선택하세요');
      used.add(role);result[key]=role;
    }
    return result;
  }
  function nicknameColor(platform,nickname,mode='platform') {
    if(mode==='user'){let hash=0;for(const c of platform+':'+nickname)hash=(Math.imul(hash,31)+c.codePointAt(0))|0;return `hsl(${(hash>>>0)%360} 72% 75%)`;}
    return {chzzk:'#00ffa3',twitch:'#bf94ff',youtube:'#ff6464',soop:'#55cfff'}[platform]||'#dddddd';
  }
  function normalizeSourceView(value){
    if(value===undefined)value={};
    if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid source view');
    const fit=value.fit??'contain',input=value.crop??{};
    if(!['contain','cover','stretch'].includes(fit)||!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid source view');
    const crop={};
    for(const edge of ['left','top','right','bottom']){
      const pixels=input[edge]??0;
      if(!Number.isInteger(pixels)||pixels<0||pixels>8192)throw new Error('Invalid source crop: '+edge);
      crop[edge]=pixels;
    }
    return {fit,crop};
  }
  const api = {normalizeSourceView,effectivePanelShadow,migratePanelAppearance,bentoPanelKeys,overlapPanelKeys,allPanelKeys,activePanelKeys,legacyOverlapKeys,migrateOverlapPanels,cornerRadii,cornerSmoothings,panelShadowStrengths,normalizeLayoutMode,overlapSafetyGrid,defaultOverlapPlacement,normalizeOverlapPlacement,normalizeOverlapEnabled,normalizeOverlapSizing,normalizeOverlapPositions,normalizeOverlapColumnAlignment,normalizeOverlapColumns,effectiveOverlapColumns,effectivePanelEnabled,overlapPositionBounds,overlapSizingBounds,overlapLayout,overlapCollisions,normalizeLayoutPresets,switchLayoutPreset,resolveConfigLayout,panelLabels,panelGaps,normalizeGap,normalizeSidePosition,subWidthWarning,normalizeEvent,createEventStore,handcamLayout,resolveLayout,defaultPlacement,normalizePlacement,normalizeSizing,canResizeWidth,canResizeHeight,sizingBounds,aspectStops,autoLayout,validateLayout,resolveSlots,nicknameColor};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OverlayEvents = api;
})(typeof window !== 'undefined' ? window : globalThis);
