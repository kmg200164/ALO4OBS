"""Run rollback helpers in real LuaJIT with a small OBS state model."""
import ctypes
import pathlib
import unittest

DLL = pathlib.Path(r"C:\Program Files\obs-studio\bin\64bit\lua51.dll")
SOURCE = pathlib.Path(__file__).resolve().parents[1] / "template" / "obs-setup.lua"

@unittest.skipUnless(DLL.exists(), "OBS LuaJIT runtime is not installed")
class RollbackTests(unittest.TestCase):
    def test_partial_populated_apply_restores_items_sources_filters_and_refs(self):
        code = SOURCE.read_text(encoding="utf-8")
        helpers = code[code.index("local function copy_source_settings"):code.index("local function apply_generic")]
        model = r"""
local function copy(t) if type(t)~='table' then return t end local n={} for k,v in pairs(t) do n[k]=copy(v) end return n end
local function array(t) local n={} for i,v in ipairs(t) do n[i]=v end return n end
obs={}
local function template_owned(n) return n:match('^OST') end
function obs.obs_source_get_ref(s) s.refs=(s.refs or 0)+1;return s end
function obs.obs_source_release(s) s.refs=s.refs-1 end
function obs.obs_source_get_name(s) return s.name end
function obs.obs_source_get_settings(s) return s.settings end
function obs.obs_data_get_json(d) return d end
function obs.obs_data_create_from_json(d) return copy(d) end
function obs.obs_source_update(s,d) for k,v in pairs(d) do s.settings[k]=copy(v) end;s.updates=(s.updates or 0)+1 end
function obs.obs_source_reset_settings(s,d) s.settings=copy(d);s.updates=(s.updates or 0)+1 end
function obs.obs_data_release(d) end
function obs.obs_scene_enum_items(s) return array(s.items) end
function obs.sceneitem_list_release(d) end
function obs.source_list_release(d) end
function obs.obs_sceneitem_addref(i) i.refs=(i.refs or 0)+1 end
function obs.obs_sceneitem_release(i) i.refs=i.refs-1 end
function obs.obs_sceneitem_get_id(i) return i.id end
function obs.obs_sceneitem_get_source(i) return i.source end
function obs.obs_transform_info() return {} end
function obs.obs_sceneitem_crop() return {} end
function obs.obs_sceneitem_get_info2(i,t) for k,v in pairs(i.info) do t[k]=v end end
function obs.obs_sceneitem_get_crop(i,t) for k,v in pairs(i.crop) do t[k]=v end end
function obs.obs_sceneitem_get_private_settings(i) return i.private end
function obs.obs_data_get_bool(d,k) return d[k] or false end
function obs.obs_data_set_bool(d,k,v) d[k]=v end
function obs.obs_sceneitem_visible(i) return i.visible end
function obs.obs_sceneitem_locked(i) return i.locked end
function obs.obs_sceneitem_is_group(i) return i.source.nested~=nil end
function obs.obs_sceneitem_group_get_scene(i) return i.source.nested end
function obs.obs_sceneitem_remove(i) for k,v in ipairs(i.parent.items) do if i==v then table.remove(i.parent.items,k);break end end end
function obs.obs_scene_find_source(s,n) for _,i in ipairs(s.items) do if i.source.name==n then return i end end end
local nextId=0
function obs.obs_scene_add(s,source) nextId=nextId+1;local i={id=nextId,source=source,parent=s,info={},crop={},private={},visible=true,locked=false};s.items[#s.items+1]=i;return i end
function obs.obs_sceneitem_set_info2(i,d) i.info=copy(d) end
function obs.obs_sceneitem_set_crop(i,d) i.crop=copy(d) end
function obs.obs_sceneitem_set_visible(i,v) i.visible=v end
function obs.obs_sceneitem_set_locked(i,v) i.locked=v end
function obs.obs_sceneitem_set_order_position(i,k) obs.obs_sceneitem_remove(i);table.insert(i.parent.items,k+1,i) end
function obs.obs_source_enum_filters(s) return array(s.filters or {}) end
function obs.obs_source_enabled(s) return s.enabled end
function obs.obs_source_set_enabled(s,e) s.enabled=e end
function obs.obs_source_filter_remove(s,f) for k,v in ipairs(s.filters) do if v==f then table.remove(s.filters,k);break end end end
function obs.obs_source_filter_add(s,f) s.filters[#s.filters+1]=f end
function obs.obs_source_get_filter_by_name(s,n) for _,f in ipairs(s.filters) do if f.name==n then return obs.obs_source_get_ref(f) end end end
"""
        scenario = r"""
local root={items={}};local nested={items={}}
local capture={name='User Capture',settings={device='keep'},filters={},refs=0}
local mask={name='OST Mask',settings={path='old-mask'},enabled=false,refs=0}
local group={name='OST Group',settings={value='old'},filters={mask},nested=nested,refs=0}
local item=obs.obs_scene_add(root,group);item.info={x=10,crop_to_bounds=true};item.crop={left=2};item.locked=true;item.visible=false;item.private.collapsed=true
local original=obs.obs_scene_add(nested,capture);original.info={x=20};original.crop={left=3};original.locked=true
-- Original deletion is deferred until commit, keeping IDs and extra state.
local duplicate=obs.obs_scene_add(nested,capture);duplicate.info={x=30};duplicate.crop={left=4};duplicate.locked=false
local baseline=snapshot_layout(root)
-- Model a successful first panel mutation followed by another panel failure.
item.info.x=99;item.visible=true;item.private.collapsed=false
original.scale_filter=3;original.blend_mode=2;original.blend_method=1;original.selected=true;original.hotkey=42
obs.obs_scene_add(nested,{name='OST New Media',settings={},filters={}})
obs.obs_scene_add(root,capture) -- temporary hidden retention item
obs.obs_scene_add(root,{name='OST New Group',settings={},filters={}})
obs.obs_source_update(group,{value='new',introduced=true});obs.obs_source_update(mask,{path='new-mask',introduced=true});mask.enabled=true
obs.obs_source_filter_add(group,{name='OST New Filter',settings={},enabled=true})
restore_layout(baseline)
assert(#root.items==1 and root.items[1].source==group)
assert(item.info.x==10 and item.crop.left==2 and item.locked and not item.visible and item.private.collapsed)
assert(#nested.items==2 and nested.items[1]==original and nested.items[2]==duplicate)
assert(duplicate.info.x==30 and duplicate.crop.left==4 and not duplicate.locked)
assert(original.scale_filter==3 and original.blend_mode==2 and original.blend_method==1 and original.selected and original.hotkey==42)
assert(item.info.crop_to_bounds==true)
assert(nested.items[1].info.x==20 and nested.items[1].crop.left==3 and nested.items[1].locked)
assert(group.settings.value=='old' and group.settings.introduced==nil and #group.filters==1 and group.filters[1]==mask)
assert(mask.settings.path=='old-mask' and mask.settings.introduced==nil and mask.enabled==false)
assert(capture.settings.device=='keep' and capture.updates==nil)
release_layout(baseline)
assert(group.refs==0 and capture.refs==0 and mask.refs==0)
"""
        dll = ctypes.CDLL(str(DLL))
        dll.luaL_newstate.restype = ctypes.c_void_p
        dll.luaL_openlibs.argtypes = [ctypes.c_void_p]
        dll.luaL_loadstring.argtypes = [ctypes.c_void_p, ctypes.c_char_p]
        dll.lua_pcall.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int]
        dll.lua_tolstring.argtypes = [ctypes.c_void_p, ctypes.c_int, ctypes.c_void_p]
        dll.lua_tolstring.restype = ctypes.c_char_p
        dll.lua_close.argtypes = [ctypes.c_void_p]
        state = dll.luaL_newstate()
        try:
            dll.luaL_openlibs(state)
            result = dll.luaL_loadstring(state, (model+helpers+scenario).encode())
            if result == 0:
                result = dll.lua_pcall(state, 0, 0, 0)
            error = dll.lua_tolstring(state, -1, None) if result else b""
            self.assertEqual(result, 0, (error or b"").decode(errors="replace"))
        finally:
            dll.lua_close(state)
