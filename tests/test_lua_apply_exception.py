"""Fault injection in actual v4 Apply code, using OBS LuaJIT and in-memory files."""
import unittest
from test_lua_rollback import DLL, SOURCE

@unittest.skipUnless(DLL.exists(), "OBS LuaJIT runtime is not installed")
class ApplyExceptionTests(unittest.TestCase):
    def run_lua(self, code):
        import ctypes
        from test_lua_rollback import DLL
        dll=ctypes.CDLL(str(DLL))
        dll.luaL_newstate.restype=ctypes.c_void_p
        dll.luaL_openlibs.argtypes=[ctypes.c_void_p]
        dll.luaL_loadstring.argtypes=[ctypes.c_void_p,ctypes.c_char_p]
        dll.lua_pcall.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.c_int,ctypes.c_int]
        dll.lua_tolstring.argtypes=[ctypes.c_void_p,ctypes.c_int,ctypes.c_void_p]
        dll.lua_tolstring.restype=ctypes.c_char_p
        dll.lua_close.argtypes=[ctypes.c_void_p]
        state=dll.luaL_newstate()
        try:
            dll.luaL_openlibs(state)
            result=dll.luaL_loadstring(state,code.encode())
            if result==0: result=dll.lua_pcall(state,0,0,0)
            message=dll.lua_tolstring(state,-1,None) if result else b""
            self.assertEqual(result,0,(message or b"").decode(errors="replace"))
        finally: dll.lua_close(state)

    def test_config_transaction_catches_thrown_apply_and_restores_previous_bytes(self):
        code=SOURCE.read_text(encoding="utf-8")
        branch=code[code.index(" if obs.obs_data_get_int(settings,'layoutVersion')==4 then"):code.index(" -- Copy visibility before checking live dependencies.")]
        model=r"""
obs={LOG_WARNING=1};local released=0;local logs={};local files={['isolated/config.js']='previous bytes'}
function obs.obs_data_get_int() return 4 end
function obs.obs_data_get_json() return '{}' end
function obs.obs_data_release() released=released+1 end
function obs.script_log(_,message) logs[#logs+1]=message end
function script_path() return 'isolated/' end
local open_count=0
io.open=function(path,mode)
 if mode=='rb' then if files[path]==nil then return nil end;return {read=function() return files[path] end,close=function() return true end} end
 open_count=open_count+1
 if restore_failure and open_count>1 then return nil end
 files[path]=''
 return {write=function(_,bytes)
  if open_count==1 and write_failure=='throw' then error('injected write failure') end
  if open_count==1 and write_failure=='false' then return nil end
  files[path]=bytes;return true
 end,close=function()
  if open_count==1 and close_failure=='throw' then error('injected close failure') end
  if open_count==1 and close_failure=='false' then return nil end
  return true
 end}
end
os.remove=function(path) files[path]=nil;return true end
local function apply_generic(settings)
 if failure=='throw' then error('injected native operation failure') end
 obs.obs_data_release(settings)
 return failure=='success'
end
local function apply(settings)
"""
        for failure in ['false','throw','success']:
            for original in [True,False]:
                with self.subTest(failure=failure,original=original):
                    setup="local failure="+repr(failure)+"; local restore_failure=false\n"
                    absence="" if original else "files['isolated/config.js']=nil\n"
                    expected="'window.OVERLAY_CONFIG = {};\\n'" if failure=='success' else ("'previous bytes'" if original else "nil")
                    scenario="\nend\nassert(apply({})=="+('true' if failure=='success' else 'false')+");assert(files['isolated/config.js']=="+expected+");assert(released==1,'settings reference leaks or is released twice')"
                    self.run_lua(setup+model.replace('local function apply(settings)',absence+'local function apply(settings)')+branch+scenario)
        self.run_lua("local failure='throw';local restore_failure=true\n"+model+branch+"\nend\nassert(not apply({}));assert(released==1);assert(logs[#logs]:find('restore'),'restoration failure must be logged')")
        for operation in ['write','close']:
            for failure in ['false','throw']:
                with self.subTest(operation=operation,failure=failure):
                    setup="local failure='success';local "+operation+"_failure="+repr(failure)+"\n"
                    self.run_lua(setup+model+branch+"\nend\nassert(not apply({}));assert(files['isolated/config.js']=='previous bytes');assert(released==1)")


    def test_mutation_exception_restores_snapshot_and_releases_even_if_restore_throws(self):
        code=SOURCE.read_text(encoding="utf-8")
        transaction=code[code.index(' local previous_layout='):code.index('local function apply(props')]
        model=r"""
obs={LOG_WARNING=1};local logs={};local restores=0;local released=0
function obs.script_log(_,message) logs[#logs+1]=message end
function obs.obs_source_release() released=released+1 end
function obs.obs_data_release() released=released+1 end
local scene={value='old'};local source={};local settings={};local created=false
local panel_keys={'game'};local panels={game={name='Main',kind='source',source='Capture',active=true,box={0,0,1920,1080}}}
local layout_mode='bento'
function script_path() return 'isolated/' end
local function snapshot_layout() return {value=scene.value,held=true} end
local function restore_layout(snapshot) restores=restores+1;if restore_failure then error('injected restore failure') end;scene.value=snapshot.value end
local function release_layout(snapshot) assert(snapshot.held);snapshot.held=false;released=released+1 end
local function clip() scene.value='mutated';if failure=='throw' then error('injected operation failure') end;return false end
local function apply()
"""
        for failure in ['false','throw']:
            for restore_failure in [True,False]:
                with self.subTest(failure=failure,restore_failure=restore_failure):
                    setup="local failure="+repr(failure)+";local restore_failure="+('true' if restore_failure else 'false')+"\n"
                    checks="\nassert(not apply());assert(restores==1);assert(released==3,'snapshot, source and settings must be released')\n"
                    checks+="assert(logs[#logs]:find('Could not restore'))" if restore_failure else "assert(scene.value=='old')"
                    self.run_lua(setup+model+transaction+checks)

    def test_clip_and_browser_release_transient_refs_before_rethrowing(self):
        code=SOURCE.read_text(encoding="utf-8")
        helpers=code[code.index('local function browser('):code.index('local panel_keys=')]
        model=r"""
obs={};local refs=0
function obs.obs_data_create() refs=refs+1;return {} end
function obs.obs_data_release() refs=refs-1 end
function obs.obs_data_set_int() end
function obs.obs_data_set_bool() end
function obs.obs_data_set_string() end
function obs.obs_get_source_by_name() refs=refs+1;return {} end
function obs.obs_source_update() end
function obs.obs_source_release() refs=refs-1 end
function obs.obs_scene_get_group() return {} end
function obs.obs_sceneitem_set_locked() end
function obs.obs_sceneitem_group_get_scene() return {} end
function obs.obs_sceneitem_get_source() return {} end
io.open=function() return {close=function() end} end
local browser_css=''
error=function() end -- OBS replaces error() with a logger.
local function place() assert(false,'injected placement failure') end
"""
        self.run_lua(model+helpers+r"""
assert(not pcall(browser,{},'Web','https://example.test',false,0,0,1,1));assert(refs==0,'browser references leaked')
assert(not pcall(clip,{},'Group','Capture','mask',{0,0,1,1}));assert(refs==0,'clip canvas references leaked')
local placements=0
place=function() placements=placements+1;if placements==2 then assert(false,'injected capture placement failure') end;return true end
assert(not pcall(clip,{},'Group','Capture','mask',{0,0,1,1}));assert(refs==0,'clip capture references leaked')
""")

    def test_snapshot_release_attempts_remaining_refs_when_one_release_throws(self):
        code=SOURCE.read_text(encoding="utf-8")
        release=code[code.index('local function release_layout('):code.index('-- ALO names identify generated items')]
        model=r"""
obs={};local released=0
error=function() end -- OBS replaces error() with a logger.
function obs.obs_sceneitem_release() assert(false,'injected item release failure') end
function obs.obs_data_release() released=released+1 end
function obs.obs_source_release() released=released+1 end
"""
        self.run_lua(model+release+r"""
local snapshot={scenes={{items={{item={}}}}},sources={{source={},settings={},filters={{source={},settings={}}}}}}
assert(not pcall(release_layout,snapshot));assert(released==4,'one release failure must not skip remaining references')
""")

    def test_restore_readds_original_item_removed_before_later_exception(self):
        code=SOURCE.read_text(encoding="utf-8")
        restore=code[code.index('local function restore_layout('):code.index('local function release_layout(')]
        model=r"""
obs={};local scene={items={}};local source={name='User capture'};local old={id=1,source=source}
function obs.obs_sceneitem_get_id(i) return i.id end
function obs.obs_scene_enum_items(s) return s.items end
function obs.sceneitem_list_release() end
function obs.obs_sceneitem_remove(i) for k,v in ipairs(scene.items) do if i==v then table.remove(scene.items,k);break end end end
function obs.obs_scene_add(s,source) local i={id=2,source=source};s.items[#s.items+1]=i;return i end
function obs.obs_sceneitem_set_info2(i,info) i.info=info end
function obs.obs_sceneitem_set_crop(i,crop) i.crop=crop end
function obs.obs_sceneitem_set_visible(i,v) i.visible=v end
function obs.obs_sceneitem_set_locked(i,v) i.locked=v end
function obs.obs_sceneitem_set_order_position() end
function obs.obs_sceneitem_get_private_settings(i) i.private=i.private or {};return i.private end
function obs.obs_data_set_bool(d,k,v) d[k]=v end
function obs.obs_data_release() end
"""
        self.run_lua(model+restore+r"""
local snapshot={sources={},scenes={{scene=scene,items={{item=old,source=source,info={x=42},crop={left=3},visible=false,locked=true,collapsed=true,index=0}}}}}
restore_layout(snapshot)
assert(#scene.items==1,'removed original must be restored to its scene')
local restored=scene.items[1];assert(restored.source==source and restored.info.x==42 and restored.crop.left==3 and not restored.visible and restored.locked and restored.private.collapsed)
""")

        self.run_lua(model+restore+r"""
error=function() end -- OBS replaces error() with a logger.
obs.obs_scene_add=function() return nil end
local snapshot={sources={},scenes={{scene=scene,items={{item=old,source=source,info={},crop={},index=0}}}}}
assert(not pcall(restore_layout,snapshot),'failed reattachment must raise even when host error() only logs')
""")
