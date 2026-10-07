(function(root){
 const events=typeof module!=='undefined'&&module.exports?require('./events.js'):root.OverlayEvents;
 function crc32(bytes){let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
 function zip(entries){
  const locals=[],centrals=[];let offset=0;
  for(const entry of entries){
   const name=new TextEncoder().encode(entry.name),bytes=entry.bytes,crc=crc32(bytes);
   if(bytes.length>0xffffffff||name.length>65535)throw new Error('File is too large for ZIP');
   const local=new Uint8Array(30+name.length+bytes.length),lv=new DataView(local.buffer);
   lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x800,true);lv.setUint32(14,crc,true);lv.setUint32(18,bytes.length,true);lv.setUint32(22,bytes.length,true);lv.setUint16(26,name.length,true);local.set(name,30);local.set(bytes,30+name.length);locals.push(local);
   const central=new Uint8Array(46+name.length),cv=new DataView(central.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint32(16,crc,true);cv.setUint32(20,bytes.length,true);cv.setUint32(24,bytes.length,true);cv.setUint16(28,name.length,true);cv.setUint32(42,offset,true);central.set(name,46);centrals.push(central);offset+=local.length;
  }
  const size=centrals.reduce((n,c)=>n+c.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,entries.length,true);ev.setUint16(10,entries.length,true);ev.setUint32(12,size,true);ev.setUint32(16,offset,true);
  const output=new Uint8Array(offset+size+22);let pos=0;for(const part of [...locals,...centrals,end]){output.set(part,pos);pos+=part.length;}return output;
 }
 function validHttp(value){try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password;}catch{return false;}}
 function validImage(value){return typeof value==='string'&&(/^assets\/(?!.*\.\.)[\w./-]+$/i.test(value)||validHttp(value));}
 function validMedia(value){return typeof value==='string'&&(/^assets\/(?!.*\.\.)[\w./-]+\.(?:png|jpe?g|webp|gif|mp4|webm)$/i.test(value)||validHttp(value));}
 function validateGradient(part,label){
  if(!part||!Object.prototype.hasOwnProperty.call(part,'gradient'))return;
  const gradient=part.gradient,validColor=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
  if(!gradient||typeof gradient!=='object'||Array.isArray(gradient)||gradient.type!=='linear'||!Number.isFinite(gradient.angle)||!Array.isArray(gradient.stops)||gradient.stops.length<2||gradient.stops.length>12)throw new Error('Invalid gradient: '+label);
  for(const stop of gradient.stops)if(!stop||typeof stop!=='object'||!Number.isFinite(stop.position)||stop.position<0||stop.position>100||!validColor(stop.color)||!Number.isFinite(stop.opacity)||stop.opacity<0||stop.opacity>100)throw new Error('Invalid gradient stop: '+label);
  // Validate raw data directly so normalization cannot conceal malformed user input.
 }
 function opaqueStroke(part){
  if(!part||typeof part!=='object')return part;
  const result={...part,opacity:100};
  if(Object.prototype.hasOwnProperty.call(part,'borderOpacity'))result.borderOpacity=100;
  const source=part.gradient&&typeof part.gradient==='object'?part.gradient:part;
  if(Array.isArray(source.stops)){const gradient={...source,stops:source.stops.map(stop=>({...stop,opacity:100}))};if(source===part)Object.assign(result,gradient);else result.gradient=gradient;}
  return result;
 }
 function settingsEntries(input){
  const config={...input};
  const generic=config.layoutVersion===4;
  const panelKeys=['game','custom1','custom2','custom3','chat','translation','hand'];
  if(config.layoutVersion===3||generic){
   if(config.panelPlacement!==undefined)config.panelPlacement=events.normalizePlacement(config.panelPlacement);
   if(config.sidePosition!==undefined&&!['left','right'].includes(config.sidePosition))throw new Error('Invalid Side position');
   config.sidePosition=events.normalizeSidePosition(config.sidePosition);
   config.panelSizing=events.normalizeSizing(config.panelSizing);
   if(config.panelGap===undefined)config.panelGap=32;
   else if(!events.panelGaps.includes(config.panelGap))throw new Error('Invalid panel gap');
   config.layout=events.autoLayout({order:config.layoutOrder,placement:config.panelPlacement,enabled:config.panelEnabled,sizing:config.panelSizing,gap:config.panelGap,sidePosition:config.sidePosition});
   events.validateLayout(config.layout);
  }else config.layout=events.resolveLayout(config.layoutVersion===2?config.layout:undefined);
  config.layoutVersion=generic?4:config.layoutVersion===3?3:2;
  if(generic){
   const panelContent={};
   for(const key of panelKeys){
    const part=config.panelContent?.[key];
    if(!part||typeof part!=='object'||Array.isArray(part)||!['none','source','web','media'].includes(part.type))throw new Error('Invalid panel content: '+key);
    const url=String(part.url||'').trim();
    const active=config.panelEnabled?.[key]!==false;
    if(active&&part.type==='web'&&url&&!validHttp(url))throw new Error(key+': HTTP(S) web URL required');
    if(active&&part.type==='media'&&url&&!validMedia(url))throw new Error(key+': image/video assets path or HTTP(S) media URL required');
    panelContent[key]={type:part.type,url:part.type==='web'||part.type==='media'?url:''};
   }
   config.panelContent=panelContent;
   for(const key of ['cameraMode','handcam','slotContent','customSlotMedia','custom1Source','custom2Source','custom3Source','chatUrl','translationUrl','donationChzzk','donationTwitch','donationYoutube','donationSoop','reactiveUrl','showSponsor','showSubtitles','showChat','showAlerts','sponsor','sponsorType','platforms'])delete config[key];
  }else{
   config.cameraMode=config.cameraMode??(config.handcam===true?'camera':'none');
   if(!['camera','reactive','none'].includes(config.cameraMode))throw new Error('Invalid camera mode');
   config.slotContent=events.resolveSlots(input.layoutVersion>=2?config.slotContent:undefined);
   config.customSlotMedia=Object.fromEntries(['custom1','custom2','custom3'].map(key=>[key,{url:String(config.customSlotMedia?.[key]?.url||'').trim()}]));
   for(const key of ['custom1','custom2','custom3']){
    const role=config.slotContent[key],url=config.customSlotMedia[key].url;
    if(['image','video'].includes(role)&&!url)throw new Error(key+': media path or URL required');
    if(['image','video'].includes(role)&&!validImage(url))throw new Error(key+': assets path or HTTP(S) URL required');
    if(role==='browser'&&(!url||!validHttp(url)))throw new Error(key+': HTTP(S) OBS URL required');
    config[key+'Source']=String(config[key+'Source']||'').trim();
   }
   config.handcam=config.cameraMode==='camera';
  }
  const color=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value);
  const image=value=>!value||validImage(value);
  const enabled={};
  for(const key of Object.keys(events.resolveLayout()))enabled[key]=config.panelEnabled?.[key]!==false;
  config.panelEnabled=enabled;
  const overrides={};
  for(const key of Object.keys(events.resolveLayout()))if(config.regionStyleOverrides?.[key]===true)overrides[key]=true;
  config.regionStyleOverrides=overrides;
  if(config.globalStyle){
   const style={...config.globalStyle};config.globalStyle=style;
   const mode=(part,choices)=>!part||choices.includes(part.mode);
   const percentage=value=>Number.isFinite(value)&&value>=0&&value<=100;
   const blur=value=>Number.isFinite(value)&&value>=0&&value<=64;
   if(!mode(style.background,['solid','gradient','file','url'])||!mode(style.fill,['none','solid','gradient'])||!mode(style.stroke,['none','solid','gradient']))throw new Error('Invalid global style mode');
   for(const [label,part] of [['background',style.background],['fill',style.fill],['stroke',style.stroke]])validateGradient(part,'global '+label);
   for(const part of [style.background,style.fill,style.stroke])if(part&&(!color(part.color||'#000000')||!color(part.color2||'#000000')))throw new Error('Invalid global style color');
   if(style.background?.mode==='url'&&!validHttp(style.background.url))throw new Error('Invalid background URL');
   if(style.background?.mode==='file'&&!validImage(style.background.url))throw new Error('Invalid background file');
   if(style.fill&&(style.fill.opacity!==undefined&&!percentage(style.fill.opacity)||style.fill.blur!==undefined&&!blur(style.fill.blur)))throw new Error('Invalid panel fill');
   if(style.stroke&&style.stroke.width!==undefined&&(!Number.isFinite(style.stroke.width)||style.stroke.width<0||style.stroke.width>32))throw new Error('Invalid panel stroke');
   if(style.stroke)style.stroke=opaqueStroke(style.stroke);
   if(style.background){config.backgroundColor=style.background.color||'#000000';config.backgroundImage=['file','url'].includes(style.background.mode)?style.background.url:'';}
  }
  if(!color(config.backgroundColor||'#000000')||!image(config.backgroundImage))throw new Error('Invalid background');
  config.backgroundColor=config.backgroundColor||'#000000';config.backgroundImage=config.backgroundImage||'';
  if(Object.prototype.hasOwnProperty.call(config,'borderOpacity'))config.borderOpacity=100;
  config.regionBackgrounds=config.regionBackgrounds||{};
  for(const key of Object.keys(events.resolveLayout())){const region={...(config.regionBackgrounds[key]||{})},glass=!!config.backgroundImage,fill=region.color||(glass?'#000000':config.panel||'#1a1a1a');const opacity=region.opacity??(glass?20:100),blurValue=region.blur??(glass?16:0);if(!color(fill)||!image(region.image)||!Number.isInteger(opacity)||opacity<0||opacity>100||!Number.isInteger(blurValue)||blurValue<0||blurValue>64||!color(region.borderColor||'#ffffff'))throw new Error('Invalid region background: '+key);for(const part of ['fill','stroke'])if(region[part]){if(!['none','solid','gradient'].includes(region[part].mode))throw new Error('Invalid region '+part+': '+key);validateGradient(region[part],'region '+key+' '+part);if(region[part].color!==undefined&&!color(region[part].color)||region[part].color2!==undefined&&!color(region[part].color2)||part==='fill'&&region[part].opacity!==undefined&&(!Number.isFinite(region[part].opacity)||region[part].opacity<0||region[part].opacity>100)||part==='fill'&&region[part].blur!==undefined&&(!Number.isFinite(region[part].blur)||region[part].blur<0||region[part].blur>64)||part==='stroke'&&region[part].width!==undefined&&(!Number.isFinite(region[part].width)||region[part].width<0||region[part].width>32))throw new Error('Invalid region '+part+': '+key);}if(region.stroke)region.stroke=opaqueStroke(region.stroke);if(Object.prototype.hasOwnProperty.call(region,'borderOpacity'))region.borderOpacity=100;config.regionBackgrounds[key]={...region,color:fill,image:region.image||'',opacity,blur:blurValue,borderColor:region.borderColor||'#ffffff',borderVisible:region.borderVisible!==false};}
  if(!generic){
   for(const key of ['chatUrl','translationUrl','donationChzzk','donationTwitch','donationYoutube','donationSoop','reactiveUrl']){
    const value=String(config[key]||'').trim();config[key]=value;if(!value)continue;
    if(!validHttp(value))throw new Error(key+': HTTP(S) OBS URL required');
   }
   if(config.cameraMode==='reactive'&&!config.reactiveUrl)throw new Error('Discord Reactive OBS URL required');
  }
  const json=JSON.stringify(config,null,2),bytes=value=>new TextEncoder().encode(value);
  return [{name:'config.json',bytes:bytes(json)},{name:'obs-settings.json',bytes:bytes(json)}];
 }
 const api={zip,settingsEntries};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OverlayPack=api;
})(typeof window!=='undefined'?window:globalThis);
