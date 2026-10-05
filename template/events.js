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
  function baseLayout() {
    return {game:{x:32,y:32,width:1384,height:778},custom1:{x:32,y:842,width:440,height:206},custom2:{x:504,y:842,width:440,height:206},custom3:{x:976,y:842,width:440,height:206},chat:{x:1448,y:32,width:440,height:317},translation:{x:1448,y:381,width:440,height:317},hand:{x:1448,y:730,width:440,height:318}};
  }
  function defaultPlacement() {
    return {game:{level1:'left',level2:'top',level3:'left'},
      custom1:{level1:'left',level2:'bottom',level3:'left'},
      custom2:{level1:'left',level2:'bottom',level3:'center'},
      custom3:{level1:'left',level2:'bottom',level3:'right'},
      chat:{level1:'right',level2:'top',level3:'left'},
      translation:{level1:'right',level2:'center',level3:'left'},
      hand:{level1:'right',level2:'bottom',level3:'left'}};
  }
  function normalizePlacement(input,changedKey) {
    if(input!==undefined&&(!input||typeof input!=='object'||Array.isArray(input)))throw new Error('Invalid panel placement');
    const defaults=defaultPlacement(),placement={};
    for(const key of panelKeys){
      const supplied=input?.[key];
      if(supplied!==undefined&&(!supplied||typeof supplied!=='object'||Array.isArray(supplied)))throw new Error(key+': invalid frame level');
      const path=placement[key]={...defaults[key],...(supplied||{})};
      if(!['left','right'].includes(path.level1)||!['top','center','bottom'].includes(path.level2)||!['left','center','right'].includes(path.level3))throw new Error(key+': invalid frame level');
    }
    // Keep level3 in the saved schema for compatibility, but custom panel
    // identity defines the band order regardless of legacy stored values.
    placement.custom1.level3='left';
    placement.custom2.level3='center';
    placement.custom3.level3='right';
    const vertical=value=>value==='top'||value==='bottom'?value:null;
    // Left-side rows only have top and bottom. Center resolves to the panel's
    // normal row so imported and partially edited settings remain deterministic.
    for(const key of panelKeys)if(placement[key].level1==='left'&&!vertical(placement[key].level2))
      placement[key].level2=defaults[key].level2==='top'?'top':'bottom';
    const game=placement.game;
    const customs=['custom1','custom2','custom3'].filter(key=>placement[key].level1==='left');
    if(game.level1==='left'){
      const changedCustom=customs.includes(changedKey)?changedKey:null;
      const gameRow=vertical(game.level2)||defaults.game.level2;
      if(changedCustom){
        const row=vertical(placement[changedCustom].level2)||'bottom';
        for(const key of customs)placement[key].level2=row;
        game.level2=row==='top'?'bottom':'top';
      }else{
        for(const key of customs)placement[key].level2=gameRow==='top'?'bottom':'top';
        game.level2=gameRow;
      }
    }else if(customs.length){
      const sourceKey=customs.includes(changedKey)?changedKey:customs[0];
      const row=vertical(placement[sourceKey].level2)||'bottom';
      for(const key of customs)placement[key].level2=row;
    }
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
  function allocateSizes(entries,extent,axis) {
    const available=extent-32*(entries.length-1),sizes=entries.map(entry=>entry.fixed??null);
    const required=entries.reduce((sum,entry)=>sum+(entry.fixed??entry.minimum??1),0);
    if(entries.some(entry=>entry.fixed!==undefined&&(entry.fixed<(entry.minimum??1)||entry.fixed>(entry.maximum??extent))))throw new Error('Fixed panel sizes exceed available '+axis+': keep each panel within its usable range');
    if(required>available)throw new Error('Fixed panel sizes exceed available '+axis+': sizes and 32-pixel gaps must fit');
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
  function sizedLayout(leftRows,right,sizing,constrained=true) {
    const layout=baseLayout();
    const reference=constrained?sizedLayout(leftRows,right,normalizeSizing(),false):null;
    const limits=(key,axis)=>key==='game'&&axis==='height'&&sizing[key].aspect&&sizing[key].aspect!=='auto'?{minimum:1,maximum:1016}:reference?{minimum:sizingMinimum(reference,key,axis),maximum:Math.floor(reference[key][axis]*1.5)}:{minimum:1};
    const fixed=(key,axis)=>{
      if(constrained&&key==='game'&&axis==='height'&&sizing[key].aspect&&sizing[key].aspect!=='auto'){
        const row=leftRows.find(row=>row.items.includes(key));
        const width=row?allocateSizes(row.items.map(panel=>({fixed:fixed(panel,'width'),...limits(panel,'width')})),1384,'width')[row.items.indexOf(key)]:440;
        return Math.floor(width*9/Number(sizing[key].aspect.split(':')[0]));
      }
      return sizing[key][axis+'Mode']==='fixed'?sizing[key][axis]:undefined;
    };
    // Four equal tracks, with 32 px outer margins and gaps: left spans three.
    // Empty frames stay reserved; fixed children never resize these parents.
    if(leftRows.length){
      const heights=allocateSizes(leftRows.map(row=>{
        const values=row.items.map(key=>fixed(key,'height')).filter(value=>value!==undefined);
        for(const key of row.items){const value=fixed(key,'height'),range=limits(key,'height');if(value!==undefined&&(value<range.minimum||value>(range.maximum??1016)))throw new Error('Fixed panel sizes exceed available height: keep each panel within its usable range');}
        const minimum=Math.max(...row.items.map(key=>limits(key,'height').minimum));
        const reservePeerSpace=row.items.includes('game')&&sizing.game.aspect&&sizing.game.aspect!=='auto';
        return {fixed:values.length?Math.max(...values,reservePeerSpace?minimum:0):undefined,minimum,weight:row.weight};
      }),1016,'height');
      let y=32;
      leftRows.forEach((row,rowIndex)=>{
        const height=heights[rowIndex];
        const widths=allocateSizes(row.items.map(key=>({fixed:fixed(key,'width'),...limits(key,'width')})),1384,'width');
        let x=32;
        row.items.forEach((key,index)=>{
          let width=widths[index],panelHeight=fixed(key,'height')??height;
          layout[key]={x,y,width,height:panelHeight};x+=widths[index]+32;
        });
        y+=height+32;
      });
    }
    if(right.length){
      const heights=allocateSizes(right.map(key=>({fixed:fixed(key,'height'),...limits(key,'height')})),1016,'height');
      let y=32;
      right.forEach((key,index)=>{
        const width=fixed(key,'width')??440,range=limits(key,'width');
        if(width<range.minimum||width>Math.min(440,range.maximum??440))throw new Error('Fixed panel sizes exceed available width: right frame stays one column wide');
        layout[key]={x:1448,y,width,height:heights[index]};y+=heights[index]+32;
      });
    }
    return layout;
  }
  function hierarchicalLayout(placement,enabled,sizing) {
    placement=normalizePlacement(placement);
    const active=panelKeys.filter(key=>enabled[key]!==false);
    const left=active.filter(key=>placement[key].level1==='left');
    const right=active.filter(key=>placement[key].level1==='right').sort((a,b)=>
      ['top','center','bottom'].indexOf(placement[a].level2)-['top','center','bottom'].indexOf(placement[b].level2)
      ||['left','center','right'].indexOf(placement[a].level3)-['left','center','right'].indexOf(placement[b].level3));
    const rows=['top','bottom'].map(level=>({items:left.filter(key=>placement[key].level2===level)
      .sort((a,b)=>['left','center','right'].indexOf(placement[a].level3)-['left','center','right'].indexOf(placement[b].level3)),weight:1})).filter(row=>row.items.length);
    if(rows.length===2&&left.includes('game'))for(const row of rows)row.weight=row.items.includes('game')?778:206;
    return sizedLayout(rows,right,sizing);
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
  function autoLayout({order=panelKeys,placement,enabled={},sizing}={}) {
    if(!Array.isArray(order)||!enabled||typeof enabled!=='object'||Array.isArray(enabled))throw new Error('Invalid auto layout');
    sizing=normalizeSizing(sizing);
    if(placement!==undefined)return hierarchicalLayout(placement,enabled,sizing);
    const seen=new Set();
    for(const key of order){if(!panelKeys.includes(key)||seen.has(key))throw new Error('Invalid panel order');seen.add(key);}
    const ordered=[...order,...panelKeys.filter(key=>!seen.has(key))],active=ordered.filter(key=>enabled[key]!==false);
    if(!active.length)return baseLayout();
    const lead=active[0],bottom=ordered.slice(1,4).filter(key=>key!==lead&&enabled[key]!==false),right=ordered.slice(4).filter(key=>key!==lead&&enabled[key]!==false);
    const rows=[{items:[lead],weight:778}];if(bottom.length)rows.push({items:bottom,weight:206});
    return sizedLayout(rows,right,sizing);
  }
  function sizingBounds(options={},key,axis) {
    if(!panelKeys.includes(key)||!['width','height'].includes(axis))throw new Error('Invalid panel size: unknown panel or axis');
    const enabled={...options.enabled,[key]:true},reference=autoLayout({...options,enabled,sizing:undefined});
    const sizing=normalizeSizing(options.sizing),otherAxis=axis==='width'?'height':'width';
    // Reference the all-automatic layout, so dragging never moves its own limits.
    for(const panel of panelKeys){
      sizing[panel][otherAxis+'Mode']='auto';
      sizing[panel][axis]=Math.min(Math.min(Math.floor(reference[panel][axis]*1.5),axis==='width'?reference[panel].x>=1448?440:1384:1016),Math.max(sizingMinimum(reference,panel,axis),sizing[panel][axis]));
    }
    sizing[key][axis+'Mode']='fixed';
    function fits(value){
      sizing[key][axis]=value;
      try{autoLayout({...options,enabled,sizing});return true;}
      catch(error){if(error.message.startsWith('Fixed panel sizes exceed available'))return false;throw error;}
    }
    const minimum=sizingMinimum(reference,key,axis);
    let low=minimum,high=Math.min(Math.floor(reference[key][axis]*1.5),axis==='width'?(reference[key].x>=1448?440:1384):1016);
    while(low<high){const middle=Math.ceil((low+high)/2);if(fits(middle))low=middle;else high=middle-1;}
    return {min:minimum,max:low};
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
  const api = {normalizeEvent,createEventStore,handcamLayout,resolveLayout,defaultPlacement,normalizePlacement,normalizeSizing,canResizeWidth,canResizeHeight,sizingBounds,aspectStops,autoLayout,validateLayout,resolveSlots,nicknameColor};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OverlayEvents = api;
})(typeof window !== 'undefined' ? window : globalThis);
