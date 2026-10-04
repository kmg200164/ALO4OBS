(() => {
 const canvas=document.getElementById('canvas');
 if(!canvas)return;
 const frame=document.body.dataset.mode==='frame';
 const transparentPixel='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
 const tiles=Object.fromEntries(Object.keys(OverlayEvents.resolveLayout()).map(key=>{const tile=document.createElement('div');tile.className='tile';tile.dataset.region=key;canvas.append(tile);if(frame)return [key,{tile}];const surface=document.createElement('div'),image=document.createElement('img'),glass=document.createElement('img');glass.className='backdrop';surface.className='surface';image.className='panel-image';tile.append(glass,surface,image);return [key,{tile,surface,image,glass}];}));
 function safeImage(value){return typeof value==='string'&&(/^(https?:\/\/|blob:|data:image\/(png|jpeg|webp|gif);base64,)/i.test(value)||/^assets\/(?!.*\.\.)[\w./-]+$/i.test(value))?value:'';}
 function applyConfig(config=document.body.classList?.contains('preview-mode')?window.OVERLAY_PUBLIC_CONFIG:window.OVERLAY_CONFIG){
  const layout=config.layoutVersion>=3?OverlayEvents.validateLayout(config.layout):OverlayEvents.resolveLayout(config.layoutVersion===2?config.layout:undefined),backdrop=safeImage(config.backgroundImage),style=config.globalStyle||{};
  const hex=value=>/^#[0-9a-f]{6}$/i.test(value||'');
  const pct=value=>Number.isFinite(value)?Math.max(0,Math.min(100,value))/100:1;
 const gradient=part=>window.KMGGradient.css(part);
 const opaqueStroke=part=>{if(!part||typeof part!=='object')return part;const result={...part,opacity:100};if(Object.prototype.hasOwnProperty.call(part,'borderOpacity'))result.borderOpacity=100;const source=part.gradient&&typeof part.gradient==='object'?part.gradient:part;if(Array.isArray(source.stops)){const gradient={...source,stops:source.stops.map(stop=>({...stop,opacity:100}))};if(source===part)Object.assign(result,gradient);else result.gradient=gradient;}return result;};
  for(const [key,{tile,surface,image,glass}] of Object.entries(tiles)){
   const box=layout[key],setting=config.regionBackgrounds?.[key]||{},src=safeImage(setting.image),gradientBackdrop=style.background?.mode==='gradient',hasBackdrop=!!backdrop||gradientBackdrop,override=config.regionStyleOverrides?.[key]===true;
   tile.style.display=config.panelEnabled?.[key]===false?'none':'block';
   if(frame){
    const local=override?setting.stroke:undefined,sourceStroke=local||(!override?style.stroke:undefined),stroke=opaqueStroke(sourceStroke),mode=stroke?.mode,width=Number.isFinite(stroke?.width)?Math.max(0,Math.min(32,stroke.width)):4;
    const gradientVisible=mode==='gradient'&&width>0;
    tile.className=gradientVisible?'tile gradient-stroke':'tile';
    Object.assign(tile.style,{left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px',outlineWidth:mode==='none'||(!mode&&setting.borderVisible===false)||gradientVisible?'0':width+'px',outlineColor:mode==='solid'&&hex(stroke.color)?stroke.color:hex(setting.borderColor)?setting.borderColor:'#ffffff',opacity:1});
    tile.style.setProperty?.('--stroke-width',width+'px');tile.style.setProperty?.('--stroke-gradient',gradient(stroke||{}));continue;}
   const fill=/^#[0-9a-f]{6}$/i.test(setting.color)?setting.color:(hasBackdrop?'#000000':config.panel||'#1a1a1a');
   const opacity=Number.isFinite(Number(setting.opacity))?Math.max(0,Math.min(100,Number(setting.opacity))):(hasBackdrop?20:100);
   const blur=Number.isFinite(Number(setting.blur))?Math.max(0,Math.min(64,Number(setting.blur))):(hasBackdrop?16:0);
   Object.assign(tile.style,{left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px'});
   Object.assign(glass.style,{left:-box.x+'px',top:-box.y+'px',filter:`blur(${blur}px)`,display:hasBackdrop?'block':'none',backgroundImage:gradientBackdrop?gradient(style.background):'none'});
   glass.src=gradientBackdrop?transparentPixel:backdrop;
   const local=override?setting.fill:undefined,panel=local||(!override?style.fill:undefined);
   const panelColor=panel?.mode==='solid'&&hex(panel.color)?panel.color:fill;
   Object.assign(surface.style,{backgroundColor:panel?.mode==='none'?'transparent':panel?.mode==='gradient'?'transparent':panelColor,backgroundImage:panel?.mode==='gradient'?gradient(panel):'none',opacity:panel?.mode==='none'?'0':String(panel?.opacity===undefined?opacity/100:pct(panel.opacity))});
   if(panel?.mode==='none'){glass.style.display='none';}
   else if(panel?.blur!==undefined)glass.style.filter=`blur(${Math.max(0,Math.min(64,panel.blur))}px)`;
   image.src=src;image.style.display=src?'block':'none';
  }
 }
 function scale(){canvas.style.transform=canvas.closest?.('.overlay')?'none':`scale(${Math.min(innerWidth/1920,innerHeight/1080)})`;}addEventListener('resize',scale);scale();
 window.Background={applyConfig};applyConfig();
 if(!frame)for(const {image,glass} of Object.values(tiles)){image.addEventListener('error',()=>{image.style.display='none';});glass.addEventListener('error',()=>{glass.style.display='none';});}
 addEventListener('message',event=>{if(event.source===parent&&event.data?.channel==='kmg-preview'&&event.data.action==='apply')applyConfig(event.data.data);});
})();
