const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{spawnSync}=require('node:child_process');
const codec=require('../template/lua-preset.js'),events=require('../template/events.js');
const encode=value=>new TextEncoder().encode(value),raw=fs.readFileSync(path.join(__dirname,'../template/OBS-script.lua'));
function config(mode='bento'){
 const input={layoutVersion:4,layoutMode:mode,name:'한글 日本語 😀',panelContent:Object.fromEntries(events.allPanelKeys.map(key=>[key,{type:key==='game'?'source':'none',url:''}])),panelEnabled:{custom2:false},regionStyleOverrides:{chat:true},panelShadows:{chat:32},globalStyle:{background:{mode:'solid',color:'#123456',url:''},fill:{mode:'solid',color:'#abcdef',opacity:20,blur:32},stroke:{mode:'solid',color:'#fedcba',width:4,opacity:100}},backgroundColor:'#123456',backgroundImage:'',logo:'',showNicknames:true,nicknameColor:'platform',alertDuration:7000};
 input.panelContent.game.sourceView={fit:'cover',crop:{left:0,top:20,right:60,bottom:30}};
 input.layoutPresets=events.normalizeLayoutPresets(input);Object.assign(input,input.layoutPresets[mode]);input.layout=events.resolveConfigLayout(input);return input;
}
const entries=()=>[{name:'OBS-script.lua',bytes:new Uint8Array(raw)},{name:'overlay.html',bytes:encode('<p>runtime 한글</p>')},{name:'internal/events.js',bytes:encode('window.test=1;')},{name:'config.js',bytes:encode('NEUTRAL CONFIG MUST BE REPLACED')},{name:'assets/game-alpha-mask.png',bytes:new Uint8Array([137,80,78,71,0,255,13,10])}];
function metadata(value,extra=''){
 return '--[[ALO4OBS_PRESET_V1\n'+Buffer.from(JSON.stringify(value)).toString('base64')+'\n]]\n'+extra;
}
const wrap=input=>({format:'ALO4OBS-LUA-PRESET',schemaVersion:1,version:'0.11.0',config:input});
test('standalone Lua roundtrips full Bento and Overlap settings without modifying caller data',()=>{
 for(const mode of ['bento','overlap']){
  const input=config(mode),before=structuredClone(input),runtime=entries(),lua=codec.encode(input,runtime,{version:'0.11.0'}),restored=codec.decode(lua);
  assert.deepEqual(restored,input);assert.deepEqual(input,before);assert.deepEqual(restored.layoutPresets,input.layoutPresets);assert.deepEqual(restored.panelContent.game.sourceView,input.panelContent.game.sourceView);
  assert.equal(restored.regionStyleOverrides.chat,true);assert.equal(restored.panelShadows.chat,32);assert.notEqual(restored,input);assert.notEqual(restored.panelContent.game,input.panelContent.game);
  assert.match(lua,/^--\[\[ALO4OBS_PRESET_V1\n[A-Za-z0-9+/=]+\n\]\]\n/);assert.match(lua,/obslua\.os_mkdirs/);assert.match(lua,new RegExp('alo4obs-'+mode+'-[a-f0-9]{32}/'));assert.ok(lua.includes(raw.toString('utf8')));
  assert.ok(!lua.includes('NEUTRAL CONFIG MUST BE REPLACED'));assert.ok(!lua.includes('os.execute'));assert.ok(!lua.includes('loadstring'));assert.equal(runtime[0].name,'OBS-script.lua');
 }
});
test('decode ignores all Lua code without evaluating it and rejects legacy non-preset scripts',()=>{
 globalThis.presetExecuted=false;
 const input=config(),text=metadata(wrap(input),'globalThis.presetExecuted=true; throw Error("must not run"); os.execute("bad")');
 assert.deepEqual(codec.decode(text),input);assert.equal(globalThis.presetExecuted,false);delete globalThis.presetExecuted;
 assert.throws(()=>codec.decode(raw.toString('utf8')),/metadata/);assert.throws(()=>codec.decode('return '+JSON.stringify(wrap(input))),/metadata/);
});
test('metadata framing is anchored, unique, bounded, strict UTF-8 and canonical base64',()=>{
 const good=metadata(wrap(config()));
 for(const text of [' '+good,'-- other comment\n'+good,good+good,good.replace('ALO4OBS_PRESET_V1','ALO4OBS_PRESET_V2'),good.replace(/\n[A-Za-z0-9+/=]+\n/,'\n!!!!\n'),good.replace(/\n[A-Za-z0-9+/=]+\n/,'\nYQ=\n'),'--[[ALO4OBS_PRESET_V1\n/2E=\n]]\n','--[[ALO4OBS_PRESET_V1\nYR==\n]]\n','x'.repeat(codec.MAX_TEXT+1)])assert.throws(()=>codec.decode(text));
 assert.deepEqual(codec.decode(good.replace(/\n/g,'\r\n')),config());
 assert.throws(()=>codec.decode('--[[ALO4OBS_PRESET_V1\n'+Buffer.alloc(513*1024,32).toString('base64')+'\n]]\n'),/oversized/);
});
test('future schema, application and layout versions are rejected',()=>{
 for(const change of [m=>m.version='0.12.0',m=>m.version='0.11.1',m=>m.schemaVersion=2,m=>m.format='OTHER',m=>m.config.layoutVersion=5,m=>m.config.layoutVersion='4',m=>m.config.layoutMode='future']){
  const value=wrap(config());change(value);assert.throws(()=>codec.decode(metadata(value)));
 }
 assert.throws(()=>codec.encode(config(),entries(),{version:'0.12.0'}));
});
test('unsafe rendered URLs are rejected; region images retain the existing pack validation',()=>{
 for(const unsafe of ['javascript:alert(1)','data:image/png;base64,YQ==','file:///etc/passwd','blob:https://example.org/id','https://user:secret@example.org','https://example.org\\evil','assets/../photo.png','assets/%2e%2e/photo.png','C:\\photo.png','//example.org/image.png']){
  for(const change of [c=>c.panelContent.chat={type:'web',url:unsafe},c=>{c.globalStyle.background.mode='url';c.globalStyle.background.url=unsafe;},c=>c.regionBackgrounds={hand:{imageMode:'none',imageUrl:unsafe}},c=>c.logo=unsafe]){
   const input=config();change(input);assert.throws(()=>codec.decode(metadata(wrap(input))),/URL|path/);
  }
 }
 const input=config();input.panelContent.chat={type:'web',url:'https://example.org/widget?token=a%26b#x'};input.globalStyle.background.url='http://example.org/image.png';assert.deepEqual(codec.decode(metadata(wrap(input))),input);
});
test('disabled panel and dormant background URL drafts stay inert until rendered',()=>{
 for(const key of events.bentoPanelKeys)for(const type of ['web','media']){
  const input={layoutVersion:4,panelContent:Object.fromEntries(events.bentoPanelKeys.map(panel=>[panel,{type:'none',url:''}])),panelEnabled:{[key]:false}};
  input.panelContent[key]={type,url:'unfinished invalid draft'};
  assert.deepEqual(codec.decode(codec.encode(input,entries())),input);
  assert.deepEqual(codec.mediaReferences(input),[]);
  assert.throws(()=>codec.encode({...input,panelEnabled:{[key]:true}},entries()),/URL|path/);
 }
 const input=config();input.panelContent.panel5_3={type:'web',url:'javascript:inactive draft'};input.panelContent.custom2={type:'media',url:'not-a-url'};
 input.globalStyle.background.url='javascript:inactive background draft';input.globalStyle.fill.url='unused fill draft';input.backgroundImage='unused derived background draft';
 assert.deepEqual(codec.decode(codec.encode(input,entries())),input);assert.deepEqual(codec.mediaReferences(input),[]);
 const activeBackground=structuredClone(input);activeBackground.globalStyle.background.mode='url';assert.throws(()=>codec.encode(activeBackground,entries()),/URL|path/);
 const activeOtherLayout=events.switchLayoutPreset(input,'overlap');assert.throws(()=>codec.encode(activeOtherLayout,entries()),/URL|path/);
 const activePanel=structuredClone(input);activePanel.panelEnabled.custom2=true;assert.throws(()=>codec.encode(activePanel,entries()),/URL|path/);
});
test('legacy connection history roundtrips inert strings without becoming runtime media requirements',()=>{
 const input=config();input.legacyConnections={version:1,inputs:{chatUrl:'chrome-extension://old-provider/widget',reactiveUrl:'unfinished draft',sponsor:'javascript:inert old text',custom1MediaUrl:'assets/legacy-unassigned.png',translationUrl:'<img src=x onerror=alert(1)>'}};
 assert.deepEqual(codec.decode(codec.encode(input,entries())),input);assert.deepEqual(codec.mediaReferences(input),[]);
 for(const bad of [false,{},42]){const invalid=structuredClone(input);invalid.legacyConnections.inputs.chatUrl=bad;assert.throws(()=>codec.encode(invalid,entries()),/legacy connection/);}
});
test('strict types and allowlists stop normalization from concealing malformed data',()=>{
 for(const change of [c=>c.panelEnabled.chat='false',c=>c.regionStyleOverrides.chat=1,c=>c.panelShadows.chat='32',c=>c.panelContent.chat.url=5,c=>c.panelContent.game.sourceView.fit='future',c=>c.panelContent.game.sourceView.crop.left='0',c=>c.panelContent.game.sourceView.crop.unknown=1,c=>c.panelContent.game.surprise='value',c=>c.panelPlacement.game.level1='invalid',c=>c.panelSizing.game.width='1384',c=>c.panelSizing.game.width=-1,c=>c.layout.game.width=Infinity,c=>c.sidePosition=1,c=>c.cornerRadius='16',c=>c.name=4,c=>c.logo=false,c=>c.showNicknames='true',c=>c.layoutPresets.overlap.panelEnabled.panel1_3='false',c=>c.layoutPresets.overlap.overlapColumns['2'].widthMode='future',c=>c.layoutPresets.bento.panelPlacement.hand={level2:5},c=>c.regionBackgrounds={game:{borderVisible:'false'}},c=>c.globalStyle.stroke.width='4',c=>c.unknownField=1]){
  const input=config();change(input);assert.throws(()=>codec.encode(input,entries()));
 }
 const value=wrap(config());value.config=JSON.parse('{"layoutVersion":4,"__proto__":{"polluted":true}}');assert.throws(()=>codec.decode(metadata(value)),/unsafe object key/);assert.equal({}.polluted,undefined);
 const input=config();Object.defineProperty(input,'trap',{enumerable:true,get(){throw Error('getter executed');}});assert.throws(()=>codec.encode(input,entries()),/accessor/);
 const cyclic=config();cyclic.panelContent.game.cycle=cyclic;assert.throws(()=>codec.encode(cyclic,entries()),/non-JSON/);
 const deep=config();let cursor=deep;for(let i=0;i<26;i++)cursor=cursor.nest={};assert.throws(()=>codec.encode(deep,entries()),/nesting/);
});
test('runtime only accepts fixed internal files and generated mask names; no local media bytes',()=>{
 for(const name of ['../outside.js','/outside.js','C:/outside.js','internal/../../evil.js','assets/photo.png','assets/movie.mp4','assets/hand-alpha-mask.png/evil','script-bento.lua','internal/export-runtime.js','internal/preview.js','assets/%2e%2e.png'])assert.throws(()=>codec.encode(config(),[...entries(),{name,bytes:encode('bad')}]),/runtime file/);
 assert.throws(()=>codec.encode(config(),[...entries(),entries()[0]]),/duplicate/);assert.throws(()=>codec.encode(config(),[{name:'OBS-script.lua',bytes:encode('wrapped: '+raw)}]),/raw OBS/);assert.throws(()=>codec.encode(config(),[]),/missing raw/);
 const input=config();input.panelContent.hand={type:'media',url:'assets/local.png'};assert.deepEqual(codec.decode(codec.encode(input,entries())),input);assert.deepEqual(codec.decode(metadata(wrap(input))),input);
 assert.throws(()=>codec.encode(config(),[{name:'OBS-script.lua',bytes:raw},{name:'overlay.html',bytes:new Uint8Array(8*1024*1024+1)}]),/size/);
});
test('local media references remain data and only rendered media creates deduplicated OBS file pickers',()=>{
 const input=config();input.panelContent.hand={type:'media',url:'assets/picture.png'};input.panelContent.chat={type:'media',url:'assets/picture.png'};input.panelContent.custom2={type:'media',url:'assets/disabled.mp4'};input.panelContent.panel5_3={type:'media',url:'assets/inactive.mp4'};
 input.globalStyle.background={mode:'file',url:'assets/background.png',color:'#123456'};input.logo='assets/logo.png';
 input.regionBackgrounds={chat:{imageMode:'file',image:'assets/picture.png'},custom1:{imageMode:'none',image:'assets/hidden.png'},custom3:{imageMode:'file',image:'assets/no-override.png'}};
 const refs=['assets/background.png','assets/logo.png','assets/picture.png'];assert.deepEqual(codec.mediaReferences(input),refs);
 const lua=codec.encode(input,entries());assert.deepEqual(codec.decode(lua),input);assert.match(lua,/alo4obs_add_media_properties/);assert.match(lua,/alo4obs_prepare_media/);assert.match(lua,/file:read\(65536\)/);assert.ok(!lua.includes('advanced ZIP'));
 assert.ok(lua.includes("local alo_media={'assets/background.png','assets/logo.png','assets/picture.png'}"));assert.ok(!lua.includes("name='assets/picture.png'"));
 for(const value of ['assets/game-alpha-mask.png','assets/CON.png','assets/NUL.jpg','assets/LPT1.mp4']){const bad=config();bad.logo=value;assert.throws(()=>codec.encode(bad,entries()),/unsafe URL/);}
});
test('runtime directory changes with layout, settings and bundled runtime bytes',()=>{
 const dir=text=>text.match(/local alo_directory=alo_root\.\.'([^']+)'/)[1],input=config(),first=dir(codec.encode(input,entries()));assert.equal(dir(codec.encode(input,entries())),first);
 const changed=structuredClone(input);changed.panelContent.game.sourceView.crop.left=10;assert.notEqual(dir(codec.encode(changed,entries())),first);
 const runtime=entries();runtime[1].bytes=encode('changed runtime');assert.notEqual(dir(codec.encode(input,runtime)),first);assert.notEqual(dir(codec.encode(config('overlap'),entries())),first);
});
test('browser global API has the same data-only roundtrip',()=>{
 const context={window:{OverlayEvents:events,OverlayPack:require('../template/pack.js')},TextEncoder,TextDecoder,URL,Uint8Array,btoa,atob};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../template/lua-preset.js'),'utf8'),context);
 // JSON serialization crosses the VM boundary as the browser FileReader path would.
 context.presetText=metadata(wrap(config()));assert.equal(context.window.OverlayLuaPreset.decode(context.presetText).name,'한글 日本語 😀');
});
test('actual OBS LuaJIT extracts exact bytes, survives reload and refuses failures before scene access',{skip:!fs.existsSync('C:/Program Files/obs-studio/bin/64bit/lua51.dll')},()=>{
 const lua=codec.encode(config(),entries()),python=String.raw`
import ctypes,json,sys
dll=ctypes.CDLL(r'C:\Program Files\obs-studio\bin\64bit\lua51.dll')
dll.luaL_newstate.restype=ctypes.c_void_p
dll.luaL_openlibs.argtypes=[ctypes.c_void_p]
dll.luaL_loadstring.argtypes=[ctypes.c_void_p,ctypes.c_char_p]
dll.lua_pcall.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.c_int,ctypes.c_int]
dll.lua_tolstring.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.c_void_p]
dll.lua_tolstring.restype=ctypes.c_char_p
dll.lua_close.argtypes=[ctypes.c_void_p]
preset=sys.stdin.buffer.read().decode('utf8')
model=r'''
local files,dirs,logs={},{},{}
local failure=FAILURE
local read_fail=false
local accesses=0
obslua={LOG_WARNING=1,os_mkdirs=function(path) if failure=='mkdir' then return -1 end;dirs[path]=true;return 0 end,script_log=function(_,message) logs[#logs+1]=message end}
setmetatable(obslua,{__index=function(_,key) accesses=accesses+1;error('Unexpected OBS call: '..key) end})
function script_path() return 'C:/preset files/日本語/' end
io.open=function(path,mode)
 if mode=='rb' then if not files[path] then return nil end;return {read=function() return files[path] end,close=function() return true end} end
 if failure=='open' then return nil end
 assert(path:match('/alo4obs%-bento%-%x+/'),'unscoped write')
 local parent=path:match('^(.*)/[^/]+$')..'/'
 assert(dirs[parent],'parent directory missing')
 return {write=function(_,bytes) if failure=='write' then return nil end;files[path]=bytes;return true end,close=function() if failure=='close' then return nil end;return true end}
end
local function run_preset()
PRESET
end
run_preset()
if failure~='none' then assert(#logs==1,'failure must be logged');assert(accesses==0,'OBS touched on extraction failure');assert(script_properties==nil,'callbacks installed after failure');return end
assert(#logs==0)
local root=script_path()
assert(files[root..'overlay.html']=='<p>runtime 한글</p>')
assert(files[root..'internal/events.js']=='window.test=1;')
assert(files[root..'assets/game-alpha-mask.png']==string.char(137,80,78,71,0,255,13,10))
assert(files[root..'config.js']:find('window.OVERLAY_CONFIG = ',1,true)==1)
assert(not files[root..'config.js']:find('NEUTRAL CONFIG',1,true))
assert(files[root..'obs-settings.json']:find('sourceView',1,true))
assert(script_properties and script_update and script_load and script_tick)
script_load();script_tick(1);assert(accesses==0,'load or tick touched scenes before Apply')
assert(script_description():find('standalone Lua',1,true))
-- OBS resets its supplied script_path on reload. Existing matching files are not rewritten.
function script_path() return 'C:/preset files/日本語/' end
failure='write';run_preset();assert(#logs==0,'reload rewrote matching files')
-- A modified immutable file must stop setup before changing any other file.
files[root..'overlay.html']='previous different runtime'
function script_path() return 'C:/preset files/日本語/' end
failure='none';run_preset();assert(#logs==1);assert(files[root..'overlay.html']=='previous different runtime')
'''
for failure in ['none','mkdir','open','write','close']:
    code=model.replace('FAILURE',repr(failure)).replace('PRESET',preset)
    state=dll.luaL_newstate()
    try:
        dll.luaL_openlibs(state)
        result=dll.luaL_loadstring(state,code.encode('utf8'))
        if result==0: result=dll.lua_pcall(state,0,0,0)
        error=dll.lua_tolstring(state,-1,None) if result else b''
        if result: raise AssertionError(failure+': '+(error or b'').decode('utf8',errors='replace'))
    finally: dll.lua_close(state)
print('OBS LuaJIT: extraction, callbacks, reload, collision and four failure paths passed')
`;
 const result=spawnSync('python',['-c',python],{input:lua,encoding:'utf8',maxBuffer:1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
});
test('actual OBS LuaJIT resolves media only on Apply, copies in bounded chunks and preserves originals on failures',{skip:!fs.existsSync('C:/Program Files/obs-studio/bin/64bit/lua51.dll')},()=>{
 const input=config();input.panelContent.chat={type:'media',url:'assets/a.png'};input.panelContent.hand={type:'media',url:'assets/b.webm'};input.panelContent.custom2={type:'media',url:'assets/disabled.mp4'};
 const lua=codec.encode(input,entries());assert.ok(!lua.includes('C:/originals/'));
 const expanded=structuredClone(input);expanded.panelContent.custom1={type:'media',url:'assets/0-first.png'};const reordered=codec.encode(expanded,entries());
 const python=String.raw`
import ctypes,json,sys
dll=ctypes.CDLL(r'C:\Program Files\obs-studio\bin\64bit\lua51.dll')
dll.luaL_newstate.restype=ctypes.c_void_p
dll.luaL_openlibs.argtypes=[ctypes.c_void_p]
dll.luaL_loadstring.argtypes=[ctypes.c_void_p,ctypes.c_char_p]
dll.lua_pcall.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.c_int,ctypes.c_int]
dll.lua_tolstring.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.c_void_p]
dll.lua_tolstring.restype=ctypes.c_char_p
dll.lua_close.argtypes=[ctypes.c_void_p]
presets=json.loads(sys.stdin.buffer.read().decode('utf8'))
preset,reordered=presets['preset'],presets['reordered']
model=r'''
local failure=FAILURE
local files,logs,pickers={},{},{}
local accesses,stages,renames,largest_read=0,0,0,0
local image=string.rep(string.char(137,80,78,71,0,255,13,10),25000)
local video=string.rep('video chunk'..string.char(0,254),30000)
files['C:/originals/image.png']=image;files['C:/originals/movie.webm']=video
local function media_key(reference) return 'alo4obs_media_'..(reference:gsub('.',function(character) return string.format('%02x',string.byte(character)) end)) end
local selection={[media_key('assets/a.png')]='C:/originals/image.png',[media_key('assets/b.webm')]='C:/originals/movie.webm'}
local function temporary(path) return path:find('.alo4obs-stage-',1,true)~=nil end
obslua={LOG_WARNING=1,OBS_PATH_FILE=0,
 os_mkdirs=function() return 0 end,
 os_unlink=function(path) assert(not path:find('C:/originals/',1,true));files[path]=nil;return 0 end,
 os_rename=function(from,to)
  assert(not from:find('C:/originals/',1,true) and not to:find('C:/originals/',1,true),'original media mutated')
  if temporary(from) then renames=renames+1;if failure=='rename' or ((failure=='rename2' or failure=='rollback') and renames==2) then return -1 end end
  if failure=='rollback' and from:find('.alo4obs-backup-',1,true) then return -1 end
  assert(files[from]~=nil,'missing staged file');files[to]=files[from];files[from]=nil;return 0
 end,
 script_log=function(_,message) logs[#logs+1]=message end,
 obs_data_get_string=function(settings,key) return settings[key] or '' end,
 obs_properties_add_path=function(_,key,label,kind,filter,default) pickers[#pickers+1]={key=key,label=label,kind=kind,filter=filter};assert(default==nil) end
}
setmetatable(obslua,{__index=function(_,key) accesses=accesses+1;error('Unexpected scene or OBS operation: '..key) end})
function script_path() return 'C:/presets/' end
io.open=function(path,mode)
 if mode=='rb' then
  if files[path]==nil then return nil end
  local cursor=0
  return {
   read=function(_,amount)
    if amount=='*a' then assert(not path:find('C:/originals/',1,true),'unbounded original media read');return files[path] end
    assert(amount==65536,'media read must remain bounded');largest_read=math.max(largest_read,amount)
    if failure=='read' and path:find('C:/originals/',1,true) then return nil,'injected read failure' end
    local content=files[path]
    if failure=='verify' and temporary(path) then content=content:sub(1,#content-1) end
    if cursor>=#content then return nil end
    local chunk=content:sub(cursor+1,cursor+amount);cursor=cursor+#chunk;return chunk
   end,
   seek=function(_,origin,offset) assert(origin=='set' and offset==0);if failure=='seek' and path:find('C:/originals/',1,true) then return nil end;cursor=0;return 0 end,
   close=function() return true end
  }
 end
 assert(not path:find('C:/originals/',1,true),'original opened for writing')
 if temporary(path) then stages=stages+1;if failure=='open' then return nil end end
 files[path]=''
 return {
  write=function(_,bytes) if temporary(path) and failure=='write' then return nil end;files[path]=files[path]..bytes;return true end,
  close=function() if temporary(path) and failure=='close' then return nil end;return true end
 }
end
local function load_preset()
PRESET
end
load_preset()
local runtime=script_path()
assert(files[runtime..'assets/a.png']==nil and files[runtime..'assets/b.webm']==nil,'media materialized during load')
script_load();script_tick(1);assert(accesses==0)
alo4obs_add_media_properties({},nil,true)
assert(#pickers==2 and pickers[1].key==media_key('assets/a.png') and pickers[2].key==media_key('assets/b.webm'))
assert(pickers[1].label=='Local file: assets/a.png' and pickers[1].kind==obslua.OBS_PATH_FILE)
assert(pickers[2].label=='Local file: assets/b.webm')
local previous_image,previous_video='old image bytes','old video bytes'
files[runtime..'assets/a.png']=previous_image;files[runtime..'assets/b.webm']=previous_video
if failure=='missing' then selection[media_key('assets/b.webm')]='' end
if failure=='absent' then selection[media_key('assets/b.webm')]='C:/originals/missing.webm' end
if failure=='relative' then selection[media_key('assets/b.webm')]='assets/movie.webm' end
if failure=='traversal' then selection[media_key('assets/b.webm')]='C:/originals/../movie.webm' end
if failure=='managed' then selection[media_key('assets/b.webm')]=runtime..'assets/b.webm' end
local result=alo4obs_prepare_media(failure~='nil' and selection or nil)
assert(files['C:/originals/image.png']==image and files['C:/originals/movie.webm']==video,'original bytes changed')
assert(accesses==0,'media preparation changed an OBS scene or source')
if failure=='none' then
 assert(result==true and #logs==0)
 assert(files[runtime..'assets/a.png']==image and files[runtime..'assets/b.webm']==video)
 assert(largest_read==65536 and renames==2 and stages==2)
elseif failure=='rollback' then
 assert(result==false and #logs>=2)
 local retained=false;for name,bytes in pairs(files) do if name:find('.alo4obs-backup-',1,true) and bytes==previous_image then retained=true end end
 assert(retained,'rollback failure must retain previous media backup')
else
 assert(result==false and #logs>=1)
 assert(files[runtime..'assets/a.png']==previous_image and files[runtime..'assets/b.webm']==previous_video,'previous runtime media changed on preparation failure')
 if failure=='missing' or failure=='absent' or failure=='relative' or failure=='traversal' or failure=='managed' or failure=='nil' then assert(stages==0,'copy began before selections were validated') end
end
for name in pairs(files) do assert(not temporary(name),'staged bytes leaked after completion') end
if failure=='none' then
 -- Reloading a replacement Lua at the same script path retains OBS's existing settings.
 local old_a,old_b=pickers[1].key,pickers[2].key
 pickers={}
 function script_path() return 'C:/presets/' end
 local function replace_preset()
REORDERED
 end
 replace_preset()
 local next_runtime=script_path()
 alo4obs_add_media_properties({},selection,true)
 assert(#pickers==3 and pickers[2].key==old_a and pickers[3].key==old_b,'earlier asset shifted saved OBS media keys')
 assert(selection[pickers[2].key]=='C:/originals/image.png' and selection[pickers[3].key]=='C:/originals/movie.webm')
 files['C:/originals/new.png']='new earlier image';selection[pickers[1].key]='C:/originals/new.png'
 assert(alo4obs_prepare_media(selection))
 assert(files[next_runtime..'assets/0-first.png']=='new earlier image')
 assert(files[next_runtime..'assets/a.png']==image and files[next_runtime..'assets/b.webm']==video,'saved media mapping changed after replacement Lua reload')
 assert(accesses==0)
end
'''
for failure in ['none','nil','missing','absent','relative','traversal','managed','open','read','write','close','seek','verify','rename','rename2','rollback']:
    code=model.replace('FAILURE',repr(failure)).replace('PRESET',preset).replace('REORDERED',reordered)
    state=dll.luaL_newstate()
    try:
        dll.luaL_openlibs(state)
        result=dll.luaL_loadstring(state,code.encode('utf8'))
        if result==0: result=dll.lua_pcall(state,0,0,0)
        error=dll.lua_tolstring(state,-1,None) if result else b''
        if result: raise AssertionError(failure+': '+(error or b'').decode('utf8',errors='replace'))
    finally: dll.lua_close(state)
print('OBS LuaJIT: local pickers, chunked copy, byte verification and 15 failure/recovery cases passed')
`;
 const result=spawnSync('python',['-c',python],{input:JSON.stringify({preset:lua,reordered}),encoding:'utf8',maxBuffer:1024*1024});assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
});
