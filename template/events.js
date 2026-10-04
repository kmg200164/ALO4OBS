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
  function hierarchicalLayout(placement,enabled) {
    if(!placement || typeof placement!=='object' || Array.isArray(placement))throw new Error('Invalid panel placement');
    placement=normalizePlacement(placement);
    const layout=baseLayout(),active=[];
    for(const key of panelKeys){
      const path=placement[key];
      if(enabled[key]!==false)active.push({key,...path});
    }
    if(!active.length)return layout;
    const gap=32,outer=32,extentW=1856,extentH=1016;
    const left=active.filter(item=>item.level1==='left');
    const right=active.filter(item=>item.level1==='right');
    const leftWidth=left.length&&right.length?1384:extentW;
    const rightX=left.length?outer+leftWidth+gap:outer;
    const rightWidth=left.length&&right.length?440:extentW;
    function split(keys,x,y,width,height,axis){
      if(!keys.length)return;
      const span=axis==='x'?width:height;
      const first=Math.floor((span-gap*(keys.length-1))/keys.length);
      let offset=0;
      keys.forEach((item,index)=>{const size=index===keys.length-1?span-offset:first;
        layout[item.key]={x:x+(axis==='x'?offset:0),y:y+(axis==='y'?offset:0),width:axis==='x'?size:width,height:axis==='y'?size:height};
        offset+=size+gap;});
    }
    if(left.length){
      const rows=['top','bottom'].map(level=>({level,items:left.filter(item=>item.level2===level)
        .sort((a,b)=>['left','center','right'].indexOf(a.level3)-['left','center','right'].indexOf(b.level3))})).filter(row=>row.items.length);
      let y=outer;
      const gameBandLayout=rows.length===2&&rows.some(row=>row.items.some(item=>item.key==='game'));
      rows.forEach((row,index)=>{
        const remaining=extentH-gap*(rows.length-1);
        const height=gameBandLayout
          ?row.items.some(item=>item.key==='game')?778:206
          :index===rows.length-1?outer+extentH-y:Math.floor(remaining/rows.length);
        split(row.items,outer,y,leftWidth,height,'x');y+=height+gap;
      });
    }
    if(right.length){
      const rows=right.sort((a,b)=>['top','center','bottom'].indexOf(a.level2)-['top','center','bottom'].indexOf(b.level2)
        ||['left','center','right'].indexOf(a.level3)-['left','center','right'].indexOf(b.level3));
      split(rows,rightX,outer,rightWidth,extentH,'y');
    }
    return layout;
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
  function autoLayout({order=panelKeys,placement,enabled={}}={}) {
    if(!Array.isArray(order) || !enabled || typeof enabled!=='object' || Array.isArray(enabled))throw new Error('Invalid auto layout');
    if(placement!==undefined)return hierarchicalLayout(placement,enabled);
    const seen=new Set();
    for(const key of order){
      if(!panelKeys.includes(key) || seen.has(key))throw new Error('Invalid panel order');
      seen.add(key);
    }
    const ordered=[...order,...panelKeys.filter(key=>!seen.has(key))];
    const active=ordered.filter(key=>enabled[key]!==false);
    const layout=baseLayout();
    if(!active.length)return layout;
    const gap=32, outer=32, contentWidth=1920-outer*2, contentHeight=1080-outer*2;
    const lead=active[0];
    // Keep each panel in its chosen row when a peer is hidden. Only a deliberate
    // reorder changes rows; hiding a bottom panel cannot pull a right panel down.
    const bottom=ordered.slice(1,4).filter(key=>key!==lead&&enabled[key]!==false);
    const right=ordered.slice(4).filter(key=>key!==lead&&enabled[key]!==false);
    const leftWidth=right.length?1384:contentWidth;
    const topHeight=bottom.length?778:contentHeight;
    layout[lead]={x:outer,y:outer,width:leftWidth,height:topHeight};
    function distribute(keys,x,y,width,height,axis) {
      if(!keys.length)return;
      const extent=axis==='x'?width:height;
      const firstSize=Math.floor((extent-gap*(keys.length-1))/keys.length);
      let offset=0;
      keys.forEach((key,index)=>{
        const size=index===keys.length-1?extent-offset:firstSize;
        layout[key]={x:x+(axis==='x'?offset:0),y:y+(axis==='y'?offset:0),width:axis==='x'?size:width,height:axis==='y'?size:height};
        offset+=size+gap;
      });
    }
    distribute(bottom,outer,outer+topHeight+gap,leftWidth,contentHeight-topHeight-gap,'x');
    distribute(right,outer+leftWidth+gap,outer,contentWidth-leftWidth-gap,contentHeight,'y');
    return layout;
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
  const api = {normalizeEvent,createEventStore,handcamLayout,resolveLayout,defaultPlacement,normalizePlacement,autoLayout,validateLayout,resolveSlots,nicknameColor};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OverlayEvents = api;
})(typeof window !== 'undefined' ? window : globalThis);
