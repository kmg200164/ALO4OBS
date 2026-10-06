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
  // Role names are product terms shared by the editor, overlay and OBS script.
  const panelLabels={game:'Main',custom1:'Sub 1',custom2:'Sub 2',custom3:'Sub 3',chat:'Side 1',translation:'Side 2',hand:'Side 3'};
  function baseLayout() {
    return {game:{x:32,y:32,width:1384,height:778},custom1:{x:32,y:842,width:440,height:206},custom2:{x:504,y:842,width:440,height:206},custom3:{x:976,y:842,width:440,height:206},chat:{x:1448,y:32,width:440,height:317},translation:{x:1448,y:381,width:440,height:317},hand:{x:1448,y:730,width:440,height:318}};
  }
  // One spacing value is both the outer margin and the gap between panels.
  // The right frame keeps its width; the left frame takes what remains.
  const panelGaps=[8,16,24,32,48],sideWidth=440;
  function normalizeGap(value){return panelGaps.includes(value)?value:32;}
  function frameSize(gap){return {left:1920-3*gap-sideWidth,height:1080-2*gap,sideX:1920-gap-sideWidth};}
  function defaultPlacement() {
    return {game:{level1:'left',level2:'top',level3:'left'},
      custom1:{level1:'left',level2:'bottom',level3:'left'},
      custom2:{level1:'left',level2:'bottom',level3:'center'},
      custom3:{level1:'left',level2:'bottom',level3:'right'}};
  }
  // Only Main and the Sub band swap rows. Side panels always fill the right
  // frame top to bottom, so legacy Side or left/right values are ignored.
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
  function sizingMinimum(reference,key,axis){
    // Lower-panel widths use the baseline row height, independent of the main aspect.
    if(axis==='width'&&canResizeWidth(key))return Math.min(reference[key].height,reference[key].width);
    return Math.ceil(reference[key][axis]/2);
  }
  function sizedLayout(leftRows,right,sizing,gap,strict,constrained=true) {
    const layout=baseLayout(),frame=frameSize(gap);
    const reference=constrained?sizedLayout(leftRows,right,normalizeSizing(),gap,strict,false):null;
    const limits=(key,axis)=>key==='game'&&axis==='height'&&sizing[key].aspect&&sizing[key].aspect!=='auto'?{minimum:1,maximum:frame.height}:reference?{minimum:sizingMinimum(reference,key,axis),maximum:Math.floor(reference[key][axis]*1.5)}:{minimum:1};
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
        let x=gap;
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
        if(width<range.minimum||width>Math.min(sideWidth,range.maximum??sideWidth))throw new Error('Fixed panel sizes exceed available width: right frame stays one column wide');
        layout[key]={x:frame.sideX,y,width,height:heights[index]};y+=heights[index]+gap;
      });
    }
    return layout;
  }
  function hierarchicalLayout(placement,enabled,sizing,gap,strict) {
    placement=normalizePlacement(placement);
    const active=panelKeys.filter(key=>enabled[key]!==false);
    const left=active.filter(key=>placement[key]),right=active.filter(key=>!placement[key]);
    const rows=['top','bottom'].map(level=>({items:left.filter(key=>placement[key].level2===level),weight:1})).filter(row=>row.items.length);
    if(rows.length===2)for(const row of rows)row.weight=row.items.includes('game')?778:206;
    return sizedLayout(rows,right,sizing,gap,strict);
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
  function autoLayout({order=panelKeys,placement,enabled={},sizing,gap,strict=false}={}) {
    if(!Array.isArray(order)||!enabled||typeof enabled!=='object'||Array.isArray(enabled))throw new Error('Invalid auto layout');
    sizing=normalizeSizing(sizing);gap=normalizeGap(gap);
    if(placement!==undefined)return hierarchicalLayout(placement,enabled,sizing,gap,strict);
    const seen=new Set();
    for(const key of order){if(!panelKeys.includes(key)||seen.has(key))throw new Error('Invalid panel order');seen.add(key);}
    const ordered=[...order,...panelKeys.filter(key=>!seen.has(key))],active=ordered.filter(key=>enabled[key]!==false);
    if(!active.length)return baseLayout();
    const lead=active[0],bottom=ordered.slice(1,4).filter(key=>key!==lead&&enabled[key]!==false),right=ordered.slice(4).filter(key=>key!==lead&&enabled[key]!==false);
    const rows=[{items:[lead],weight:778}];if(bottom.length)rows.push({items:bottom,weight:206});
    return sizedLayout(rows,right,sizing,gap,strict);
  }
  function sizingBounds(options={},key,axis) {
    if(!panelKeys.includes(key)||!['width','height'].includes(axis))throw new Error('Invalid panel size: unknown panel or axis');
    const enabled={...options.enabled,[key]:true},reference=autoLayout({...options,enabled,sizing:undefined});
    const sizing=normalizeSizing(options.sizing),otherAxis=axis==='width'?'height':'width',frame=frameSize(normalizeGap(options.gap));
    // Stored heights are capped at 1016 px by normalizeSizing.
    const cap=panel=>axis==='width'?(reference[panel].x>=frame.sideX?sideWidth:frame.left):Math.min(frame.height,1016);
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
    const minimum=sizingMinimum(reference,key,axis);
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
  function validateLayout(layout) {
    if(!layout || typeof layout!=='object' || Array.isArray(layout))throw new Error('Invalid layout');
    for(const key of panelKeys){
      const box=layout[key];
      if(!box || typeof box!=='object' || Array.isArray(box) ||
         !Number.isInteger(box.x) || !Number.isInteger(box.y) ||
         !Number.isInteger(box.width) || !Number.isInteger(box.height) ||
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
  const api = {panelLabels,panelGaps,normalizeGap,subWidthWarning,normalizeEvent,createEventStore,handcamLayout,resolveLayout,defaultPlacement,normalizePlacement,normalizeSizing,canResizeWidth,canResizeHeight,sizingBounds,aspectStops,autoLayout,validateLayout,resolveSlots,nicknameColor};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OverlayEvents = api;
})(typeof window !== 'undefined' ? window : globalThis);
