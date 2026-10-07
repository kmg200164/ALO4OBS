"""Verify exported Side coordinates reach the real Lua clip/place helpers."""
import ctypes
import json
import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
DLL = pathlib.Path(r"C:\Program Files\obs-studio\bin\64bit\lua51.dll")


def lua_table(value):
    if isinstance(value, dict):
        return "{" + ",".join("[" + json.dumps(k) + "]=" + lua_table(v) for k, v in value.items()) + "}"
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return "nil"
    return json.dumps(value)


@unittest.skipUnless(DLL.exists(), "OBS LuaJIT runtime is not installed")
class SidePositionTests(unittest.TestCase):
    def test_exported_coordinates_apply_to_obs_browser_items(self):
        configs = json.loads(subprocess.check_output([
            "node", "-e", r"""
const e=require('./template/events.js'),p=require('./template/pack.js');
const panelContent=Object.fromEntries(Object.keys(e.panelLabels).map(k=>[k,{type:'web',url:'https://example.test/'+k}]));
const configs=[];
for(const sidePosition of ['left','right'])for(const swap of [false,true])for(const panelGap of [8,48]){
 const panelPlacement=e.defaultPlacement();panelPlacement.game.level2=swap?'bottom':'top';
 configs.push(JSON.parse(new TextDecoder().decode(p.settingsEntries({layoutVersion:4,panelContent,sidePosition,panelPlacement,panelGap})[0].bytes)));
}
console.log(JSON.stringify(configs));
"""], cwd=ROOT, text=True))
        code = (ROOT / "template/OBS-script.lua").read_text(encoding="utf-8")
        helpers = code[code.index("local function place("):code.index("local panel_keys=")]
        generic = code[code.index("local function apply_generic("):code.index("local function apply(props")]
        validation = generic[generic.index(" local content="):generic.index(" for _,name in ipairs({'overlay.html'")]
        loop_start = generic.index(" for _,key in ipairs(panel_keys) do", generic.index(" local pending_removals={}"))
        loop = generic[loop_start:generic.index(" if result then\n  result=browser", loop_start)]
        model = r"""
local sources={}
obs={OBS_BOUNDS_SCALE_INNER=1,OBS_ORDER_MOVE_BOTTOM=2,OBS_ORDER_MOVE_TOP=3,LOG_WARNING=4}
function obs.obs_data_get_obj(d,k) return d[k] end
function obs.obs_data_get_string(d,k) return d[k] or '' end
function obs.obs_data_get_double(d,k) return d[k] or 0 end
function obs.obs_data_get_bool(d,k) return d[k] or false end
function obs.obs_data_has_user_value(d,k) return d[k]~=nil end
function obs.obs_data_release() end
function obs.obs_data_create() return {} end
function obs.obs_data_set_int(d,k,v) d[k]=v end
function obs.obs_data_set_string(d,k,v) d[k]=v end
function obs.obs_data_set_bool(d,k,v) d[k]=v end
function obs.obs_get_source_by_name(n) return sources[n] end
function obs.obs_source_create(kind,n,data) local s={name=n,kind=kind,data=data};sources[n]=s;return s end
function obs.obs_source_get_name(s) return s.name end
function obs.obs_source_release() end
function obs.obs_source_update(s,data) s.data=data end
function obs.obs_scene_find_source(s,n) return s.items[n] end
function obs.obs_scene_add(s,source) local i={source=source};s.items[source.name]=i;return i end
function obs.obs_scene_get_group(s,n) return s.items[n] end
function obs.obs_scene_add_group(s,n) local i=obs.obs_scene_add(s,{name=n});i.nested={items={}};return i end
function obs.obs_sceneitem_get_private_settings() return {} end
function obs.obs_sceneitem_group_get_scene(i) return i.nested end
function obs.obs_sceneitem_get_source(i) return i.source end
function obs.obs_source_get_filter_by_name() return nil end
function obs.obs_source_filter_add() end
function obs.obs_scene_enum_items() return {} end
function obs.sceneitem_list_release() end
function obs.vec2() return {} end
function obs.obs_sceneitem_set_alignment() end
function obs.obs_sceneitem_set_bounds_type() end
function obs.obs_sceneitem_set_bounds_alignment() end
function obs.obs_sceneitem_set_order() end
function obs.obs_sceneitem_set_visible() end
function obs.obs_sceneitem_set_locked() end
function obs.obs_sceneitem_set_pos(i,p) i.pos=p end
function obs.obs_sceneitem_set_bounds(i,b) i.bounds=b end
function obs.script_log(_,message) error(message) end
function script_path() return 'test/' end
io.open=function() return {close=function() end} end
local function fail(message) error(message) end
local panel_keys={'game','custom1','custom2','custom3','chat','translation','hand'}
local panel_names={'Main','Sub 1','Sub 2','Sub 3','Side 1','Side 2','Side 3'}
local cfg={}
"""
        scenario = r"""
for index,key in ipairs(panel_keys) do
 local group=scene.items['ALO · '..panel_names[index]..' Group']
 assert(group,'missing group '..key)
 local item=group.nested.items['ALO · '..panel_names[index]..' Web']
 local box=settings.layout[key]
 assert(item.pos.x==box.x and item.pos.y==box.y,key..' position changed')
 assert(item.bounds.x==box.width and item.bounds.y==box.height,key..' bounds changed')
end
assert(result)
"""
        dll = ctypes.CDLL(str(DLL))
        dll.luaL_newstate.restype = ctypes.c_void_p
        dll.luaL_openlibs.argtypes = [ctypes.c_void_p]
        dll.luaL_loadstring.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
        dll.lua_pcall.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int]
        dll.lua_tolstring.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_void_p]
        dll.lua_tolstring.restype = ctypes.c_char_p
        dll.lua_close.argtypes = [ctypes.c_void_p]
        for config in configs:
            with self.subTest(side=config['sidePosition'], gap=config['panelGap'], row=config['panelPlacement']['game']['level2']):
                state = dll.luaL_newstate()
                try:
                    dll.luaL_openlibs(state)
                    data = "local settings=" + lua_table(config) + "\n"
                    init = "local scene={items={}};local result=true;local unused_groups={};local retained_sources={};local pending_removals={}\n"
                    script = model + helpers + data + validation + init + loop + scenario
                    result = dll.luaL_loadstring(state, script.encode())
                    if result == 0:
                        result = dll.lua_pcall(state, 0, 0, 0)
                    error = dll.lua_tolstring(state, -1, None) if result else b""
                    self.assertEqual(result, 0, (error or b"").decode(errors="replace"))
                finally:
                    dll.lua_close(state)
