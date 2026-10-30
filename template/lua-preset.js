(function(root){
 'use strict';
 const common=typeof module!=='undefined'&&module.exports;
 const events=common?require('./events.js'):root.OverlayEvents,pack=common?require('./pack.js'):root.OverlayPack;
 const VERSION='0.11.0',MARKER='ALO4OBS_PRESET_V1',MAX_METADATA=512*1024,MAX_FILE=8*1024*1024,MAX_TOTAL=24*1024*1024,MAX_TEXT=36*1024*1024;
 const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
 function fail(label){throw new Error('Invalid Lua preset: '+label);}
 function object(value,label){if(!value||typeof value!=='object'||Array.isArray(value))fail(label);}
 function fields(value,allowed,label){object(value,label);for(const key of Object.keys(value))if(!allowed.includes(key))fail(label+' field '+key);}
 function choice(value,allowed,label){if(!allowed.includes(value))fail(label);}
 function number(value,min,max,label,integer=false){if(!Number.isFinite(value)||value<min||value>max||integer&&!Number.isInteger(value))fail(label);}
 function string(value,label){if(typeof value!=='string'||value.length>16384||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))fail(label);}
 function optional(value,validator){if(value!==undefined)validator(value);}
 function bool(value){if(typeof value!=='boolean')fail('boolean setting');}
 function color(value){if(typeof value!=='string'||!/^#[0-9a-f]{6}$/i.test(value))fail('color');}
 function http(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password&&/^https?:\/\//i.test(value)&&!/[\s\\]/.test(value);}catch{return false;}}
 function reference(value,webOnly=false){
  string(value,'URL');if(value==='')return;
  if(value!==value.trim()||/[\u0000-\u0020\u007f\\]/.test(value))fail('URL');
  if(http(value))return;
  if(!webOnly&&/^assets\/[A-Za-z0-9_-][A-Za-z0-9_.-]*\.(?:png|jpe?g|webp|gif|mp4|webm)$/i.test(value)&&!value.includes('..')&&!/^assets\/(?:con|prn|aux|nul|com[1-9]|lpt[1-9])\./i.test(value)&&!/^assets\/(?:game|custom[123]|chat|translation|hand|camera|panel[1-5]_[1-3])-alpha-mask\.png$/i.test(value))return;
  fail('unsafe URL or media path');
 }
 // Inspect before cloning or normalization: JSON must never invoke getters or lose invalid numbers.
 function plain(value,depth=0,seen=new Set(),count={value:0}){
  if(depth>24||++count.value>40000)fail('data nesting or size');
  if(value===null||typeof value==='boolean')return;
  if(typeof value==='number'){if(!Number.isFinite(value))fail('non-finite number');return;}
  if(typeof value==='string'){string(value,'text');return;}
  if(typeof value!=='object'||seen.has(value))fail('non-JSON data');
  const proto=Object.getPrototypeOf(value);if(proto!==(Array.isArray(value)?Array.prototype:Object.prototype)&&proto!==null)fail('object prototype');
  seen.add(value);
  for(const key of Reflect.ownKeys(value)){
   if(typeof key!=='string'||['__proto__','prototype','constructor'].includes(key))fail('unsafe object key');
   const descriptor=Object.getOwnPropertyDescriptor(value,key);if(!('value'in descriptor))fail('accessor');
   if(Array.isArray(value)&&key==='length')continue;
   plain(descriptor.value,depth+1,seen,count);
  }
  seen.delete(value);
 }
 const panelKeys=events.allPanelKeys,bentoKeys=events.bentoPanelKeys,auxKeys=events.overlapPanelKeys.slice(1),columnKeys=['1','2','3','4','5'];
 function map(value,keys,validator,label){fields(value,keys,label);for(const [key,item] of Object.entries(value))validator(item,key);}
 function gradient(value){
  fields(value,['type','angle','stops'],'gradient');choice(value.type,['linear'],'gradient type');number(value.angle,-3600,3600,'gradient angle');
  if(!Array.isArray(value.stops)||value.stops.length<2||value.stops.length>12)fail('gradient stops');
  for(const stop of value.stops){fields(stop,['position','color','opacity'],'gradient stop');number(stop.position,0,100,'stop position');color(stop.color);number(stop.opacity,0,100,'stop opacity');}
 }
 function paint(value,kind){
  fields(value,['mode','color','color2','url','gradient','opacity','blur','width','angle','stops','type'],kind);
  optional(value.mode,v=>choice(v,kind==='background'?['solid','gradient','file','url']:['none','solid','gradient'],'paint mode'));
  for(const key of ['color','color2'])optional(value[key],color);
  optional(value.url,v=>kind==='background'&&['file','url'].includes(value.mode)?reference(v,value.mode==='url'):string(v,'inactive paint URL'));optional(value.gradient,gradient);
  optional(value.opacity,v=>number(v,0,100,'opacity'));optional(value.blur,v=>number(v,0,64,'blur'));optional(value.width,v=>number(v,0,32,'stroke width'));
  if(value.stops!==undefined||value.type!==undefined||value.angle!==undefined)gradient(Object.fromEntries(['type','angle','stops'].map(key=>[key,value[key]])));
 }
 function sourceView(value){
  fields(value,['fit','crop'],'source view');optional(value.fit,v=>choice(v,['contain','cover','stretch'],'source fit'));
  optional(value.crop,v=>map(v,['left','top','right','bottom'],n=>number(n,0,8192,'source crop',true),'source crop'));
  events.normalizeSourceView(value);
 }
 const layoutFields=['panelGap','panelEnabled','panelPlacement','panelSizing','sidePosition','overlapPlacement','overlapSizing','overlapPositions','overlapColumnAlignment','overlapColumns'];
 function layoutSettings(value){
  optional(value.panelGap,v=>choice(v,events.panelGaps,'panel gap'));optional(value.sidePosition,v=>choice(v,['left','right'],'side position'));
  optional(value.panelEnabled,v=>map(v,panelKeys,bool,'enabled panels'));
  optional(value.panelPlacement,v=>map(v,bentoKeys,entry=>{
   fields(entry,['level1','level2','level3'],'panel placement');optional(entry.level1,n=>choice(n,['left','right'],'placement level 1'));optional(entry.level2,n=>choice(n,['top','center','bottom'],'placement level 2'));optional(entry.level3,n=>choice(n,['left','center','right'],'placement level 3'));
  },'panel placement'));
  optional(value.panelSizing,v=>map(v,bentoKeys,entry=>{
   fields(entry,['widthMode','width','heightMode','height','aspect'],'panel size');for(const axis of ['width','height']){optional(entry[axis+'Mode'],n=>choice(n,['auto','fixed'],'size mode'));optional(entry[axis],n=>number(n,1,axis==='width'?1856:1016,'panel size',true));}optional(entry.aspect,n=>choice(n,['auto','16:9','21:9','32:9'],'aspect'));
  },'panel size'));
  for(const [key,normalize] of [['overlapPlacement',events.normalizeOverlapPlacement],['overlapSizing',events.normalizeOverlapSizing],['overlapPositions',events.normalizeOverlapPositions],['overlapColumnAlignment',events.normalizeOverlapColumnAlignment]])optional(value[key],normalize);
  optional(value.overlapColumns,v=>events.normalizeOverlapColumns(v,value.panelEnabled));
 }
 const legacyFields=['chatUrl','translationUrl','reactiveUrl','donationChzzk','donationTwitch','donationYoutube','donationSoop','sponsor','custom1MediaUrl','custom2MediaUrl','custom3MediaUrl'];
 const configFields=['layoutVersion','layoutMode','layoutPresets','layout',...layoutFields,'panelRenderEnabled','cornerRadius','cornerSmoothing','globalShadow','panelShadows','panelContent','globalStyle','regionBackgrounds','regionStyleOverrides','backgroundColor','backgroundImage','borderOpacity','name','accent','panel','text','logo','showNicknames','nicknameColor','alertDuration','uiLanguage','legacyConnections'];
 function validate(input){
  plain(input);fields(input,configFields,'settings');if(input.layoutVersion!==4)fail('unsupported layout version');optional(input.layoutMode,v=>choice(v,['bento','overlap'],'layout mode'));
  layoutSettings(input);
  optional(input.layoutPresets,v=>map(v,['bento','overlap'],preset=>{fields(preset,layoutFields,'layout preset');layoutSettings(preset);},'layout presets'));
  optional(input.layout,v=>{
   fields(v,panelKeys,'layout');for(const box of Object.values(v)){fields(box,['x','y','width','height'],'layout box');for(const field of ['x','y','width','height'])number(box[field],0,1920,'layout box');}
   events.validateLayout(v,{allowDecimals:input.layoutMode==='overlap'});
  });
  for(const [key,values] of [['cornerRadius',events.cornerRadii],['cornerSmoothing',events.cornerSmoothings],['globalShadow',events.panelShadowStrengths]])optional(input[key],v=>choice(v,values,key));
  optional(input.panelShadows,v=>map(v,panelKeys,n=>choice(n,events.panelShadowStrengths,'panel shadow'),'panel shadows'));
  for(const key of ['panelRenderEnabled','regionStyleOverrides'])optional(input[key],v=>map(v,panelKeys,bool,key));
  const mode=input.layoutMode||'bento',activeLayout={...input,...events.normalizeLayoutPresets(input)[mode],layoutMode:mode},activeKeys=new Set(events.activePanelKeys(activeLayout)),rendered=events.effectivePanelEnabled(activeLayout);
  optional(input.panelContent,v=>map(v,panelKeys,(part,key)=>{
   fields(part,['type','url','sourceView'],'panel content');choice(part.type,['none','source','web','media'],'panel type');string(part.url,'panel URL');
   // Match the established exporter: disabled/other-layout URL drafts stay inert until selected.
   if(activeKeys.has(key)&&rendered[key]!==false&&['web','media'].includes(part.type))reference(part.url,part.type==='web');
   optional(part.sourceView,sourceView);
  },'panel content'));
  optional(input.globalStyle,v=>{fields(v,['background','fill','stroke'],'global style');for(const kind of ['background','fill','stroke'])optional(v[kind],part=>paint(part,kind));});
  optional(input.regionBackgrounds,v=>map(v,panelKeys,region=>{
   fields(region,['color','image','imageMode','imageUrl','imageFile','opacity','blur','borderColor','borderOpacity','borderVisible','fill','stroke'],'region style');
   for(const key of ['color','borderColor'])optional(region[key],color);
   for(const key of ['image','imageUrl','imageFile'])optional(region[key],reference);
   optional(region.imageMode,n=>choice(n,['none','url','file'],'region image mode'));
   optional(region.opacity,n=>number(n,0,100,'region opacity',true));optional(region.blur,n=>number(n,0,64,'region blur',true));optional(region.borderOpacity,n=>number(n,0,100,'border opacity'));optional(region.borderVisible,bool);
   for(const kind of ['fill','stroke'])optional(region[kind],part=>paint(part,kind));
  },'region backgrounds'));
  for(const key of ['backgroundColor','accent','panel','text'])optional(input[key],color);
  optional(input.backgroundImage,v=>input.globalStyle?.background?string(v,'inactive background image'):reference(v));optional(input.logo,reference);
  optional(input.name,v=>string(v,'name'));optional(input.showNicknames,bool);optional(input.nicknameColor,v=>choice(v,['platform','user'],'nickname color'));
  optional(input.alertDuration,v=>number(v,0,3600000,'alert duration',true));optional(input.borderOpacity,v=>number(v,0,100,'border opacity'));optional(input.uiLanguage,v=>choice(v,['ko','en','ja'],'language'));
  // Retained legacy connections are inert history, never runtime URL inputs.
  optional(input.legacyConnections,v=>{fields(v,['version','inputs'],'legacy connections');if(v.version!==1)fail('legacy version');map(v.inputs,legacyFields,n=>string(n,'legacy connection'),'legacy inputs');});
  // The established pack validator owns geometry/content validation. Keep the editor's dormant settings intact.
  const copy=JSON.parse(JSON.stringify(input));pack.settingsEntries(copy);
  const neutralContent=Object.fromEntries(panelKeys.map(key=>[key,{type:'none',url:''}]));
  for(const mode of ['bento','overlap'])if(input.layoutPresets?.[mode])pack.settingsEntries({...copy,...input.layoutPresets[mode],layoutMode:mode,panelContent:neutralContent});
  return JSON.parse(JSON.stringify(input));
 }
 function base64(bytes){let out='';for(let i=0;i<bytes.length;i+=16384)out+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(out);}
 function unbase64(value){
  if(typeof value!=='string'||!value.length||value.length%4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))fail('base64 metadata');
  const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));if(base64(bytes)!==value)fail('noncanonical base64');return bytes;
 }
 function decode(text){
  if(typeof text!=='string'||text.length>MAX_TEXT)fail('file size');
  const match=/^--\[\[ALO4OBS_PRESET_V1\r?\n([A-Za-z0-9+/=]+)\r?\n\]\](?:\r?\n|$)/.exec(text);
  if(!match||match[1].length>Math.ceil(MAX_METADATA/3)*4||text.indexOf(MARKER,match[0].length)!==-1)fail('missing, duplicated, or oversized metadata block');
  let metadata;try{metadata=JSON.parse(decoder.decode(unbase64(match[1])));}catch{fail('malformed metadata');}
  plain(metadata);fields(metadata,['format','schemaVersion','version','config'],'metadata');
  if(metadata.format!=='ALO4OBS-LUA-PRESET'||metadata.schemaVersion!==1||metadata.version!==VERSION)fail('unsupported preset version');
  return validate(metadata.config);
 }
 const runtimeText=new Set(['background.html','frame.html','overlay.html','wallpaper.html','LICENSE.txt','assets/THIRD-PARTY-NOTICES.md','assets/Inter-LICENSE.txt','assets/Lucide-LICENSE.txt','assets/figma-squircle-LICENSE.txt']);
 const runtimeModules=['background','config.public','events','overlay','panel-media','panel-shape','gradient','version'];
 const runtimeStyles=['overlay','gradient'];
 function allowedEntry(name){
  return runtimeText.has(name)||runtimeModules.some(n=>name===n+'.js'||name==='internal/'+n+'.js')||runtimeStyles.some(n=>name===n+'.css'||name==='internal/'+n+'.css')||panelKeys.some(key=>name==='panel-media-'+key+'.html'||name==='assets/'+key+'-alpha-mask.png')||['OBS-script.lua','config.js','config.json','obs-settings.json','assets/InterVariable.woff2'].includes(name);
 }
 // The hash isolates configurations and bundled runtime versions; it is not an authenticity signature.
 function identity(parts){let a=2166136261,b=2246822507,c=3266489909,d=668265263;for(const part of parts){for(const byte of encoder.encode(part)){a=Math.imul(a^byte,16777619);b=Math.imul(b^byte,3266489917);c=Math.imul(c^byte,668265263);d=Math.imul(d^byte,374761393);}a^=255;b^=254;c^=253;d^=252;}return [a,b,c,d].map(n=>(n>>>0).toString(16).padStart(8,'0')).join('');}
 function requiredMedia(config){
  const refs=new Set(),add=value=>{if(typeof value==='string'&&value.startsWith('assets/'))refs.add(value);};
  add(config.logo);
  const background=config.globalStyle?.background;
  if(!background||['file','url'].includes(background.mode))add(background?.url||config.backgroundImage);
  const enabled=events.effectivePanelEnabled(config);
  for(const key of events.activePanelKeys(config)){
   if(enabled[key]===false)continue;
   const panel=config.panelContent?.[key];if(panel?.type==='media')add(panel.url);
   if(config.layoutMode==='overlap'&&key==='game')continue;
   const region=config.regionBackgrounds?.[key];
   if(region&&(region.imageMode===undefined||region.imageMode!=='none'&&config.regionStyleOverrides?.[key]===true))add(region.image);
  }
  return [...refs].sort();
 }
 function mediaReferences(input){const config=validate(input);return requiredMedia(JSON.parse(decoder.decode(pack.settingsEntries(config)[0].bytes)));}
 function encode(input,entries,options={}){
  fields(options,['version'],'options');const version=options.version??VERSION;if(version!==VERSION)fail('unsupported preset version');
  const config=validate(input),metadata=JSON.stringify({format:'ALO4OBS-LUA-PRESET',schemaVersion:1,version,config});
  if(encoder.encode(metadata).length>MAX_METADATA)fail('metadata size');
  if(!Array.isArray(entries)||entries.length>128)fail('runtime entries');
  const files=new Map();let total=0;
  for(const entry of entries){
   fields(entry,['name','bytes'],'runtime entry');if(typeof entry.name!=='string'||!allowedEntry(entry.name)||files.has(entry.name))fail('runtime file path or duplicate');
   if(!(entry.bytes instanceof Uint8Array)||entry.bytes.length>MAX_FILE||(total+=entry.bytes.length)>MAX_TOTAL)fail('runtime bytes or size');
   if(!entry.name.endsWith('.png')&&!entry.name.endsWith('.woff2')){try{decoder.decode(entry.bytes);}catch{fail('runtime text encoding');}}
   files.set(entry.name,new Uint8Array(entry.bytes));
  }
  if(!files.has('OBS-script.lua'))fail('missing raw OBS script');
  const script=decoder.decode(files.get('OBS-script.lua'));if(!/^obs\s*=\s*obslua\b/.test(script))fail('raw OBS script required');files.delete('OBS-script.lua');
  const settings=pack.settingsEntries(config);for(const entry of settings)files.set(entry.name,entry.bytes);
  const settingsJson=decoder.decode(settings.find(entry=>entry.name==='config.json').bytes);
  const media=requiredMedia(JSON.parse(settingsJson));
  files.set('config.js',encoder.encode('window.OVERLAY_CONFIG = '+settingsJson+';\n'));
  const sorted=[...files].sort(([a],[b])=>a.localeCompare(b)),encoded=sorted.map(([name,bytes])=>[name,base64(bytes)]);
  const id=identity([metadata,script,...encoded.flat()]),directory='alo4obs-'+(config.layoutMode||'bento')+'-'+id+'/';
  const table=encoded.map(([name,bytes])=>" {name='"+name+"',data='"+bytes+"'}").join(',\n');
  return '--[['+MARKER+'\n'+base64(encoder.encode(metadata))+'\n]]\n'+`-- ALO4OBS ${version}: add this script in OBS, select sources, then press Apply.
-- Local media bytes are excluded. Choose their original files in OBS before Apply.
local alo_root=script_path()
local alo_directory=alo_root..'${directory}'
local alo_files={
${table}
}
local function alo_decode(data)
 local alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
 local lookup={};for i=1,#alphabet do lookup[alphabet:sub(i,i)]=i-1 end
 local out={}
 for i=1,#data,4 do
  local a,b=lookup[data:sub(i,i)],lookup[data:sub(i+1,i+1)]
  local c,d=lookup[data:sub(i+2,i+2)],lookup[data:sub(i+3,i+3)]
  out[#out+1]=string.char(a*4+math.floor(b/16))
  if c then out[#out+1]=string.char((b%16)*16+math.floor(c/4)) end
  if d then out[#out+1]=string.char((c%4)*64+d) end
 end
 return table.concat(out)
end
local alo_ok,alo_error=pcall(function()
 assert(type(obslua.os_mkdirs)=='function','OBS directory API unavailable')
 local directories={['']=true}
 for _,entry in ipairs(alo_files) do
  entry.bytes=alo_decode(entry.data);entry.data=nil
  local parent=entry.name:match('^(.*)/[^/]+$');if parent then directories[parent..'/']=true end
 end
 for parent in pairs(directories) do
  local result=obslua.os_mkdirs(alo_directory..parent)
  assert(type(result)=='number' and result>=0,'Cannot create preset runtime directory')
 end
 -- Check every existing immutable file before any write, including accidental hash collisions.
 for _,entry in ipairs(alo_files) do
  local existing=io.open(alo_directory..entry.name,'rb')
  if existing then
   local bytes=existing:read('*a');assert(existing:close(),'Cannot close runtime file')
   assert(entry.name=='config.js' or bytes==entry.bytes,'Existing preset runtime differs; choose a clean script directory')
   entry.exists=true
  end
 end
 for _,entry in ipairs(alo_files) do
  if not entry.exists then
   local file=assert(io.open(alo_directory..entry.name,'wb'),'Cannot open preset runtime file')
   local written,problem=file:write(entry.bytes);local closed=file:close()
   assert(written and closed,problem or 'Cannot finish preset runtime file')
  end
 end
end)
if not alo_ok then
 function script_description() return 'ALO4OBS runtime extraction failed. Check the OBS script log and save the Lua in a writable directory.' end
 if obslua.script_log then obslua.script_log(obslua.LOG_WARNING,'ALO4OBS runtime extraction failed: '..tostring(alo_error)) end
 return
end
function script_path() return alo_directory end
local alo_media={${media.map(ref=>"'"+ref+"'").join(',')}}
local function alo_media_key(reference)
 return 'alo4obs_media_'..(reference:gsub('.',function(character) return string.format('%02x',string.byte(character)) end))
end
function alo4obs_add_media_properties(properties,settings,english)
 for index,reference in ipairs(alo_media) do
  obslua.obs_properties_add_path(properties,alo_media_key(reference),(english and 'Local file: ' or '로컬 파일: ')..reference,obslua.OBS_PATH_FILE,'Media files (*.png *.jpg *.jpeg *.webp *.gif *.mp4 *.webm);;All files (*.*)',nil)
 end
end
local function alo_media_path(path)
 if type(path)~='string' or #path==0 or #path>32768 or path:find('%c') then return false end
 local normalized=path:gsub('\\\\','/')
 if normalized:sub(3):find('//',1,true) or normalized:match('^//[?.]/') then return false end
 if not (normalized:match('^%a:/') or normalized:match('^/[^/]') or normalized:match('^//[^/]+/[^/]+/')) then return false end
 for segment in normalized:gmatch('[^/]+') do if segment=='..' or segment=='.' then return false end end
 -- Originals are always read only and must be outside the managed runtime tree.
 local runtime=alo_directory:gsub('\\\\','/'):lower()
 return normalized:lower():sub(1,#runtime)~=runtime
end
function alo4obs_prepare_media(settings)
 if #alo_media==0 then return true end
 local jobs,handles={},{}
 local function opened(path,mode)
  local file=assert(io.open(path,mode),'Cannot open a local media file or its staged copy')
  handles[file]=true;return file
 end
 local function closed(file)
  local result=file:close();handles[file]=nil;assert(result,'Cannot close a local media file')
 end
 local function read(file)
  local bytes,problem=file:read(65536);assert(not problem,'Cannot read a local media file');return bytes
 end
 local function copy_verified(source_path,target_path)
  local source,target=opened(source_path,'rb'),opened(target_path,'wb')
  local size=0
  while true do
   local bytes=read(source);if bytes==nil then break end
   assert(#bytes>0,'Local media read made no progress');size=size+#bytes
   assert(target:write(bytes),'Cannot write a staged local media file')
  end
  assert(size>0,'Selected local media file is empty');closed(target)
  assert(source:seek('set',0)==0,'Cannot verify original local media file')
  local staged=opened(target_path,'rb')
  while true do
   local original,copied=read(source),read(staged)
   assert(original==copied,'Staged local media verification failed')
   if original==nil then break end
  end
  closed(source);closed(staged)
 end
 local ok,problem=pcall(function()
  assert(settings~=nil,'Choose the original local files in this OBS script before Apply')
  assert(type(obslua.os_rename)=='function' and type(obslua.os_unlink)=='function','OBS media file APIs unavailable')
  -- Validate every selection before preparing any destination file.
  for index,reference in ipairs(alo_media) do
   local selected=obslua.obs_data_get_string(settings,alo_media_key(reference))
   assert(alo_media_path(selected),'Choose an existing absolute original file for '..reference)
   local source=opened(selected,'rb');closed(source)
   local target=alo_directory..reference
   local token=tostring(os.time())..'-'..tostring({}):gsub('[^%w]','')
   jobs[#jobs+1]={source=selected,target=target,stage=target..'.alo4obs-stage-'..token,backup=target..'.alo4obs-backup-'..token}
  end
  local directory_result=obslua.os_mkdirs(alo_directory..'assets/')
  assert(type(directory_result)=='number' and directory_result>=0,'Cannot create local media directory')
  -- Stage and verify in bounded chunks. No original file is opened for writing.
  for _,job in ipairs(jobs) do
   copy_verified(job.source,job.stage)
   local previous=io.open(job.target,'rb')
   if previous then
    handles[previous]=true;closed(previous)
    job.previous=true;copy_verified(job.target,job.backup)
   end
  end
  for _,job in ipairs(jobs) do
   assert(obslua.os_rename(job.stage,job.target)==0,'Cannot install a verified local media copy')
   job.committed=true
  end
 end)
 for file in pairs(handles) do pcall(function() file:close() end) end
 if not ok then
  for index=#jobs,1,-1 do
   local job=jobs[index]
   if job.committed then
    local restored,result=pcall(function() return job.previous and obslua.os_rename(job.backup,job.target) or obslua.os_unlink(job.target) end)
    if not restored or result~=0 then
     job.keep_backup=true
     obslua.script_log(obslua.LOG_WARNING,'ALO4OBS could not restore a previous local media copy; its backup was retained beside the runtime asset.')
    end
   end
  end
 end
 for _,job in ipairs(jobs) do
  pcall(function() obslua.os_unlink(job.stage) end)
  if not job.keep_backup then pcall(function() obslua.os_unlink(job.backup) end) end
 end
 if not ok then obslua.script_log(obslua.LOG_WARNING,'ALO4OBS local media preparation failed; Apply stopped: '..tostring(problem));return false end
 return true
end
`+script+`\n-- A standalone preset must not attach live refresh to a scene until Apply.
function script_load() end
function script_description()
 return 'ALO4OBS ${version}: this standalone Lua contains the saved ${config.layoutMode==='overlap'?'Overlap':'Bento'} layout. Select the original local files in the Local file controls and a different existing OBS source for each source panel, then press Apply. Loading only prepares internal runtime files. Local media stays on your computer and is copied into this preset runtime only when Apply is pressed.'
end
`;
 }
 const api={encode,decode,validate,mediaReferences,VERSION,MAX_TEXT};if(common)module.exports=api;else root.OverlayLuaPreset=api;
})(typeof window!=='undefined'?window:globalThis);
