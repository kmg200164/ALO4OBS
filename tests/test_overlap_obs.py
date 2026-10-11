"""Execute overlap validation and layer ordering in OBS LuaJIT without touching OBS."""
import ctypes
import json
import math
import subprocess
from pathlib import Path
import unittest

DLL = Path(r"C:\Program Files\obs-studio\bin\64bit\lua51.dll")
SOURCE = Path(__file__).resolve().parents[1] / "template" / "OBS-script.lua"
BENTO_KEYS = ['game', 'custom1', 'custom2', 'custom3', 'chat', 'translation', 'hand']
OVERLAP_KEYS = ['game'] + [f'panel{column}_{row}' for column in range(1,6) for row in range(1,4)]


def lua_table(value):
    if isinstance(value, dict):
        return "{" + ",".join("[" + json.dumps(k) + "]=" + lua_table(v) for k, v in value.items()) + "}"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, float) and not math.isfinite(value):
        return '(0/0)' if math.isnan(value) else ('-math.huge' if value < 0 else 'math.huge')
    return 'nil' if value is None else json.dumps(value)


def config(mode='overlap'):
    keys = BENTO_KEYS if mode=='bento' else OVERLAP_KEYS
    layout = {'game': dict(x=0, y=0, width=1920, height=1080)}
    for i, key in enumerate(keys[1:]):
        layout[key] = dict(x=24 + (i // 3) * 374.4, y=24 + (i % 3) * 352,
                           width=350.4, height=328)
    return dict(layoutMode=mode, layout=layout,
                panelContent={k: dict(type='none', url='') for k in keys})


@unittest.skipUnless(DLL.exists(), 'OBS LuaJIT runtime is not installed')
class OverlapObsTests(unittest.TestCase):
    def run_lua(self, script):
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
            status = dll.luaL_loadstring(state, script.encode())
            if status == 0:
                status = dll.lua_pcall(state, 0, 0, 0)
            error = dll.lua_tolstring(state, -1, None) if status else b''
            self.assertEqual(status, 0, (error or b'').decode(errors='replace'))
        finally:
            dll.lua_close(state)

    def validate(self, settings, error=None):
        code = SOURCE.read_text(encoding='utf-8')
        generic = code[code.index('local function apply_generic('):code.index('local function apply(props')]
        validation = generic[generic.index(' local content='):generic.index(" for _,name in ipairs({'overlay.html'")]
        model = """
obs={}
function obs.obs_data_get_obj(d,k) return d[k] end
function obs.obs_data_get_string(d,k) return d[k] or '' end
function obs.obs_data_get_double(d,k) return d[k] or 0 end
function obs.obs_data_get_bool(d,k) return d[k] or false end
function obs.obs_data_has_user_value(d,k) return d[k]~=nil end
function obs.obs_data_release() end
local cfg={panelSource_game='User Camera',english=false}
local panel_keys={'game','custom1','custom2','custom3','chat','translation','hand'}
local panel_names={'Main','Sub 1','Sub 2','Sub 3','Side 1','Side 2','Side 3'}
local function validate(settings)
 local function fail(message) return message end
"""
        expected = 'nil' if error is None else json.dumps(error)
        self.run_lua(model + validation + "\nreturn nil end\nlocal result=validate(" + lua_table(settings) +
                     ')\nassert(result==' + expected + ',tostring(result))\n' +
                     "assert(cfg.panelSource_game=='User Camera' and cfg.english==false)")

    def test_preflight_probes_never_publish_transient_sources_to_the_frontend(self):
        code = SOURCE.read_text(encoding='utf-8')
        start = code.index(' local needs_canvas=false')
        end = code.index(' -- Reuse the current ALO scene', start)
        preflight = code[start:end]
        for missing, expected in [(None, None), ('browser_source', 'OBS Browser Source is unavailable.'),
                                  ('mask_filter', 'OBS mask filter is unavailable for Panel 1-1.'),
                                  ('color_source_v3', 'OBS color source is unavailable.')]:
            with self.subTest(missing=missing):
                model = """
local queued_public_sources=0;local outstanding=0;local created={}
obs={}
function obs.obs_data_create() return {} end
function obs.obs_data_set_int() end
function obs.obs_data_set_string() end
function obs.obs_data_release() end
local missing=MISSING
local function create(kind,private)
 if kind==missing then return nil end
 outstanding=outstanding+1;created[#created+1]=kind
 if not private then queued_public_sources=queued_public_sources+1 end
 return {}
end
function obs.obs_source_create(kind) return create(kind,false) end
function obs.obs_source_create_private(kind) return create(kind,true) end
function obs.obs_source_release() outstanding=outstanding-1 end
function script_path() return 'isolated/' end
local panel_keys={'panel1_1','panel2_1'}
local panels={panel1_1={active=true,kind='source',source='Camera',name='Panel 1-1'},panel2_1={active=true,kind='web',url='https://example.test',name='Panel 2-1'}}
local function validate()
 local function fail(message) return message end
""".replace('MISSING', lua_table(missing))
                scenario = """
return nil end
local result=validate()
assert(result==EXPECTED,tostring(result))
assert(outstanding==0,'every preflight exit releases its temporary sources')
assert(queued_public_sources==0,'temporary probes must not queue frontend mixer/source events')
""".replace('EXPECTED', lua_table(expected))
                self.run_lua(model+preflight+scenario)

    def test_overlap_allows_fractional_auxiliary_geometry_under_full_main(self):
        self.validate(config())

    def test_exported_overlap_coordinates_apply_across_all_gap_presets(self):
        configs = json.loads(subprocess.check_output(['node', '-e', """
const e=require('./template/events.js'),p=require('./template/pack.js');
const panelContent=Object.fromEntries(e.allPanelKeys.map(k=>[k,{type:'none',url:''}]));
console.log(JSON.stringify(e.panelGaps.map(panelGap=>JSON.parse(new TextDecoder().decode(p.settingsEntries({layoutVersion:4,layoutMode:'overlap',panelGap,panelContent})[0].bytes)))));
"""], cwd=SOURCE.parents[1], text=True))
        for settings in configs:
            with self.subTest(gap=settings['panelGap']):
                self.assertEqual(settings['layout']['game'], dict(x=0,y=0,width=1920,height=1080))
                self.assertIn('bento', settings['layoutPresets'])
                self.assertIn('overlap', settings['layoutPresets'])
                self.validate(settings)

    def test_main_must_cover_the_canvas_in_overlap(self):
        settings = config()
        settings['layout']['game']['width'] = 1919
        self.validate(settings, 'Overlap Main must cover the full 1920 x 1080 canvas.')

    def test_invalid_mode_and_nonfinite_geometry_are_rejected(self):
        self.validate(config('invalid'), 'Invalid layout preset.')
        for value in [float('nan'), float('inf'), float('-inf')]:
            settings = config()
            settings['layout']['panel1_1']['width'] = value
            self.validate(settings, 'Invalid Panel 1-1 position.')

    def test_only_main_may_overlap_and_auxiliary_height_and_bounds_are_enforced(self):
        self.validate(config())  # Full-canvas Main intentionally intersects auxiliary panels.
        settings = config()
        settings['layout']['panel1_2'] = dict(settings['layout']['panel1_1'])
        self.validate(settings, 'Panels overlap: Panel 1-1 and Panel 1-2.')
        settings = config()
        settings['layout']['panel1_1']['height'] = 127
        self.validate(settings, 'Panel height must be at least 128 px: Panel 1-1')
        settings['panelEnabled'] = {'panel1_1': False}
        self.validate(settings)  # Dormant old sizes do not block application.
        settings = config()
        settings['layout']['panel1_1']['x'] = 1920
        self.validate(settings, 'Invalid Panel 1-1 position.')

    def test_all_fifteen_independent_panels_are_required_in_overlap(self):
        settings = config()
        del settings['panelContent']['panel5_3']
        self.validate(settings, 'Missing Panel 5-3 settings.')

    def test_bento_requires_nonoverlapping_panels(self):
        self.validate(config('bento'), 'Panels overlap: Main and Sub 1.')
        settings = config('bento')
        for i, key in enumerate(BENTO_KEYS):
            settings['layout'][key] = dict(x=i*200, y=24, width=180, height=100)
        self.validate(settings)
        del settings['layoutMode']
        self.validate(settings)

    def test_overlap_orders_fill_above_main_and_below_auxiliary_sources(self):
        code = SOURCE.read_text(encoding='utf-8')
        start = code.index(' -- Overlap fills and shadows sit above Main')
        end = code.index(' if result then\n  -- Commit removals', start)
        ordering = code[start:end]
        model = """
local scene={items={}}
local function add(name) scene.items[#scene.items+1]={name=name} end
obs={OBS_ORDER_MOVE_TOP=1}
function obs.obs_scene_find_source(s,n) for _,i in ipairs(s.items) do if i.name==n then return i end end end
function obs.obs_sceneitem_set_order(item) for index,i in ipairs(scene.items) do if i==item then table.remove(scene.items,index);break end end;scene.items[#scene.items+1]=item end
local panel_keys={'game'};local names={'Main'}
for column=1,5 do for row=1,3 do panel_keys[#panel_keys+1]='panel'..column..'_'..row;names[#names+1]='Panel '..column..'-'..row end end
local panels={}
for i,k in ipairs(panel_keys) do panels[k]={name=names[i]} end
add('ALO · Background');add('Unrelated User Item');add('ALO · Panel Fill');add('ALO · Overlay');add('ALO · Panel Stroke')
for _,name in ipairs(names) do add('ALO · '..name..' Group') end
local result=true;local layout_mode='overlap'
"""
        scenario = """
assert(scene.items[1].name=='ALO · Background' and scene.items[2].name=='Unrelated User Item')
assert(scene.items[3].name=='ALO · Main Group' and scene.items[4].name=='ALO · Panel Fill')
for i=2,16 do assert(scene.items[i+3].name=='ALO · '..names[i]..' Group') end
assert(scene.items[20].name=='ALO · Overlay' and scene.items[21].name=='ALO · Panel Stroke')
assert(#scene.items==21)
"""
        self.run_lua(model + ordering + scenario)

    def assert_safe_overlap(self, settings):
        gap=settings.get('panelGap',24)
        enabled=settings.get('panelRenderEnabled',settings.get('panelEnabled',{}))
        layout=settings['layout']
        for column in range(1,6):
            active=[f'panel{column}_{row}' for row in range(1,4) if enabled.get(f'panel{column}_{row}',True)]
            for index,key in enumerate(active):
                box=layout[key]
                self.assertGreaterEqual(box['height'],128)
                self.assertGreaterEqual(box['y'],gap)
                self.assertLessEqual(box['y']+box['height'],1080-gap)
                if index:
                    upper=layout[active[index-1]]
                    self.assertGreaterEqual(box['y'],upper['y']+upper['height']+gap)

    def apply_native_sources(self, settings, second_settings=None):
        code=SOURCE.read_text(encoding='utf-8')
        helpers=code[code.index('local function place('):code.index('local panel_keys=')]
        generic=code[code.index('local function apply_generic('):code.index('local function apply(props')]
        validation=generic[generic.index(' local content='):generic.index(" for _,name in ipairs({'overlay.html'")]
        start=generic.index(' for _,key in ipairs(panel_keys) do',generic.index(' local pending_removals={}'))
        loop=generic[start:generic.index(' if result then\n  result=browser',start)]
        model="""
local sources={};local scene={items={}};local cfg={panelSource_custom1='Keep Bento Choice'}
obs={OBS_BOUNDS_SCALE_INNER=1,OBS_ORDER_MOVE_BOTTOM=2,OBS_ORDER_MOVE_TOP=3,OBS_SOURCE_VIDEO=1,LOG_WARNING=4}
local function template_owned(n) return n:match('^ALO') end
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
function obs.obs_source_create(kind,n,data) local s={name=n,kind=kind,data=data};if kind~='mask_filter' then sources[n]=s end;return s end
function obs.obs_source_get_name(s) return s.name end
function obs.obs_source_release() end
function obs.obs_source_update(s,data) s.data=data;s.updates=(s.updates or 0)+1 end
function obs.obs_scene_from_source() return nil end
function obs.obs_source_is_group(s) return s.kind=='group' end
function obs.obs_source_get_output_flags() return 1 end
function obs.obs_scene_find_source(s,n) return s.items[n] end
function obs.obs_scene_add(s,source) local i={source=source};s.items[source.name]=i;return i end
function obs.obs_scene_get_group(s,n) return s.items[n] end
function obs.obs_scene_add_group(s,n) local source={name=n,kind='group'};sources[n]=source;local i=obs.obs_scene_add(s,source);i.nested={items={}};return i end
function obs.obs_sceneitem_get_private_settings() return {} end
function obs.obs_sceneitem_group_get_scene(i) return i.nested end
function obs.obs_sceneitem_get_source(i) return i.source end
function obs.obs_source_get_filter_by_name(s) return s.filter end
function obs.obs_source_filter_add(s,filter) s.filter=filter end
function obs.obs_scene_enum_items() return {} end
function obs.sceneitem_list_release() end
function obs.vec2() return {} end
function obs.obs_sceneitem_set_alignment() end
function obs.obs_sceneitem_set_bounds_type() end
function obs.obs_sceneitem_set_bounds_alignment() end
function obs.obs_sceneitem_set_order() end
function obs.obs_sceneitem_set_visible(i,v) i.visible=v end
function obs.obs_sceneitem_set_locked() end
function obs.obs_sceneitem_set_pos(i,p) i.pos=p end
function obs.obs_sceneitem_set_bounds(i,b) i.bounds=b end
function obs.script_log(_,message) error(message) end
function script_path() return 'isolated/' end
io.open=function() return {close=function() end} end
local function fail(message) error(message) end
for column=1,5 do for row=1,3 do local key='panel'..column..'_'..row;local name='User '..key
 sources[name]={name=name,kind='capture',data={device=name},filters={'keep'}};cfg['panelSource_'..key]=name
end end
sources['User Main']={name='User Main',kind='capture',data={device='Main'},filters={'keep'}};cfg.panelSource_game='User Main'
"""
        init="\nlocal settings="+lua_table(settings)+"\nlocal second_settings="+lua_table(second_settings or settings)+"\n"
        before="\nlocal original_settings=settings;local original_groups={};local original_captures={};local result=true;local unused_groups={};local retained_sources={};local pending_removals={}\nfor pass=1,3 do\nif pass==2 then settings=second_settings elseif pass==3 then settings=original_settings end\n"
        after="""
assert(result)
for index,key in ipairs(panel_keys) do
 local group=scene.items['ALO \u00b7 '..panel_names[index]..' Group']
 local enabled=settings.panelRenderEnabled or settings.panelEnabled
 assert(group and group.visible==(enabled==nil or enabled[key]~=false))
 local capture=group.nested.items[cfg['panelSource_'..key]]
 if pass==1 then original_groups[key]=group;original_captures[key]=capture
 else assert(group==original_groups[key] and capture==original_captures[key],'count changes must reuse groups and inputs') end
 local box=settings.layout[key]
 if group.visible then
 assert(capture.pos.x==box.x and capture.pos.y==box.y)
 assert(capture.bounds.x==box.width and capture.bounds.y==box.height)
 end
 assert(group.source.filter.data.image_path=='isolated/assets/'..key..'-alpha-mask.png')
 assert(capture.source.data.device~=nil and capture.source.updates==nil and capture.source.filters[1]=='keep')
end
assert(#unused_groups==0,'count changes must retain existing groups')
end
local count=0;for _ in pairs(scene.items) do count=count+1 end;assert(count==16)
assert(cfg.panelSource_custom1=='Keep Bento Choice')
"""
        self.run_lua(model+helpers+init+before+validation+loop+after)

    def test_sixteen_native_sources_reuse_groups_and_keep_capture_settings(self):
        settings=config()
        settings['panelContent']={k:dict(type='source',url='') for k in OVERLAP_KEYS}
        self.apply_native_sources(settings)

    def test_exported_column_counts_hide_and_reuse_original_sources_and_apply_manual_heights(self):
        variants=json.loads(subprocess.check_output(['node','-e',"""
const e=require('./template/events.js'),p=require('./template/pack.js');
const panelContent=Object.fromEntries(e.allPanelKeys.map(k=>[k,{type:'source',url:''}]));
const saved=extra=>JSON.parse(new TextDecoder().decode(p.settingsEntries({layoutVersion:4,layoutMode:'overlap',panelContent,...extra})[0].bytes));
const enabled=count=>({game:true,...Object.fromEntries(e.overlapPanelKeys.slice(1).map(k=>[k,Number(k.split('_')[1])<=count]))});
console.log(JSON.stringify(e.panelGaps.map(panelGap=>({full:saved({panelGap,panelEnabled:enabled(3)}),cases:[0,1,2,3].map(count=>saved({panelGap,panelEnabled:enabled(count),overlapSizing:{panel1_1:{heightMode:'fixed',height:120}}}))}))));
"""],cwd=SOURCE.parents[1],text=True))
        for variant in variants:
            for reduced in variant['cases']:
                with self.subTest(gap=reduced['panelGap'],count=sum(reduced['panelEnabled'][f'panel1_{row}'] for row in range(1,4))):
                    self.apply_native_sources(variant['full'], reduced)

    def test_column_widths_and_switches_reapply_without_losing_manual_y_or_sources(self):
        variants=json.loads(subprocess.check_output(['node','-e',"""
const e=require('./template/events.js'),p=require('./template/pack.js');
const panelContent=Object.fromEntries(e.allPanelKeys.map(k=>[k,{type:'source',url:''}]));
const panelEnabled=Object.fromEntries(e.overlapPanelKeys.map(k=>[k,true]));
const saved=extra=>JSON.parse(new TextDecoder().decode(p.settingsEntries({layoutVersion:4,layoutMode:'overlap',panelContent,panelEnabled,overlapSizing:{panel2_1:{heightMode:'fixed',height:200},panel2_2:{heightMode:'fixed',height:128},panel2_3:{heightMode:'fixed',height:120}},overlapPositions:{panel2_3:{mode:'fixed',y:700}},...extra})[0].bytes));
console.log(JSON.stringify({full:saved({}),hidden:saved({overlapColumns:{1:{widthBasis:3},2:{enabled:false}}}),wide:saved({overlapColumns:{1:{widthBasis:3}}})}));
"""],cwd=SOURCE.parents[1],text=True))
        self.assertTrue(variants['hidden']['panelEnabled']['panel2_3'])
        self.assertFalse(variants['hidden']['panelRenderEnabled']['panel2_3'])
        self.assertEqual(variants['hidden']['layout']['panel3_1']['width'],355.2)
        self.assertEqual(variants['hidden']['layout']['panel3_1'],variants['wide']['layout']['panel3_1'])
        self.assertEqual(variants['full']['layout']['panel2_3']['y'],700)
        self.assertFalse(variants['wide']['panelRenderEnabled']['panel2_3'])
        self.assertEqual(variants['wide']['layout']['panel2_3']['y'],728)
        self.assertEqual(variants['wide']['overlapPositions']['panel2_3']['y'],700)
        self.assertEqual(variants['wide']['overlapSizing']['panel2_3']['height'],120)
        self.assert_safe_overlap(variants['full'])
        self.assert_safe_overlap(variants['wide'])
        self.apply_native_sources(variants['full'],variants['hidden'])
        self.apply_native_sources(variants['full'],variants['wide'])

    def test_exported_manual_y_projects_ordered_bounds_and_retains_requests_for_native_sources(self):
        variants=json.loads(subprocess.check_output(['node','-e',"""
const e=require('./template/events.js'),p=require('./template/pack.js');
const panelContent=Object.fromEntries(e.allPanelKeys.map(k=>[k,{type:'source',url:''}]));
const panelEnabled=Object.fromEntries(e.overlapPanelKeys.map(k=>[k,true]));
const saved=extra=>JSON.parse(new TextDecoder().decode(p.settingsEntries({layoutVersion:4,layoutMode:'overlap',panelContent,panelEnabled,...extra})[0].bytes));
console.log(JSON.stringify(e.panelGaps.map(panelGap=>({full:saved({panelGap}),manual:saved({panelGap,overlapSizing:{panel2_1:{heightMode:'fixed',height:200},panel2_2:{heightMode:'fixed',height:100},panel2_3:{heightMode:'fixed',height:100}},overlapPositions:{panel2_2:{mode:'fixed',y:650},panel2_3:{mode:'fixed',y:650}}})}))));
"""],cwd=SOURCE.parents[1],text=True))
        for variant in variants:
            with self.subTest(gap=variant['manual']['panelGap']):
                self.assertEqual(variant['manual']['layout']['panel2_2']['y'],650)
                layout=variant['manual']['layout']
                self.assertEqual(layout['panel2_3']['y'],650+128+variant['manual']['panelGap'])
                self.assertEqual(layout['panel2_2']['height'],128)
                self.assertEqual(variant['manual']['overlapPositions']['panel2_3']['y'],650)
                self.assertEqual(variant['manual']['overlapSizing']['panel2_3']['height'],100)
                self.assert_safe_overlap(variant['manual'])
                self.apply_native_sources(variant['full'],variant['manual'])

    def test_exported_alignment_and_clamped_y_apply_without_shrinking_native_bounds(self):
        variants=json.loads(subprocess.check_output(['node','-e',"""
const e=require('./template/events.js'),p=require('./template/pack.js');
const panelContent=Object.fromEntries(e.allPanelKeys.map(k=>[k,{type:'source',url:''}]));
const panelEnabled=Object.fromEntries(e.overlapPanelKeys.map(k=>[k,true]));
const overlapSizing=Object.fromEntries(e.overlapPanelKeys.slice(1).map(k=>[k,{heightMode:'fixed',height:100}]));
const saved=extra=>JSON.parse(new TextDecoder().decode(p.settingsEntries({layoutVersion:4,layoutMode:'overlap',panelContent,panelEnabled,overlapSizing,...extra})[0].bytes));
console.log(JSON.stringify(e.panelGaps.flatMap(panelGap=>['top','center','bottom'].map(alignment=>({full:saved({panelGap}),aligned:saved({panelGap,overlapColumnAlignment:Object.fromEntries([1,2,3,4,5].map(c=>[c,alignment])),overlapPositions:{panel2_2:{mode:'fixed',y:1079}}}),alignment})))));
"""],cwd=SOURCE.parents[1],text=True))
        for variant in variants:
            settings=variant['aligned'];gap=settings['panelGap']
            factor={'top':0,'center':.5,'bottom':1}[variant['alignment']]
            with self.subTest(gap=gap,alignment=variant['alignment']):
                self.assertEqual(settings['layout']['panel1_1']['y'],gap+round((1080-4*gap-384)*factor))
                self.assertEqual(settings['layout']['panel2_2']['y'],1080-2*gap-256)
                self.assertEqual(settings['layout']['panel2_2']['height'],128)
                self.assertEqual(settings['overlapPositions']['panel2_2']['y'],1079)
                self.assertEqual(settings['overlapSizing']['panel2_2']['height'],100)
                self.assert_safe_overlap(settings)
                self.apply_native_sources(variant['full'],settings)

    def test_lua_properties_expose_sixteen_choices_and_keep_bento_selections(self):
        code = SOURCE.read_text(encoding='utf-8')
        model = """
obslua={OBS_COMBO_TYPE_LIST=1,OBS_COMBO_FORMAT_STRING=1}
function obslua.obs_data_get_bool(d,k) return d[k] or false end
function obslua.obs_data_get_int(d,k) return d[k] or 0 end
function obslua.obs_data_get_string(d,k) return d[k] or '' end
function obslua.obs_data_release() end
function obslua.obs_data_addref() end
local saved={layoutVersion=4,layoutMode='overlap'}
function obslua.obs_data_create_from_json() return saved end
function obslua.obs_properties_create() return {lists={}} end
function obslua.obs_properties_add_bool() end
function obslua.obs_properties_add_list(p,key,label) local list={key=key,label=label};p.lists[#p.lists+1]=list;return list end
function obslua.obs_property_list_add_string() end
function obslua.obs_enum_sources() return {} end
function obslua.source_list_release() end
function obslua.obs_properties_add_button() end
function script_path() return 'isolated/' end
io.open=function() return {read=function() return '{}' end,close=function() end} end
"""
        scenario = """
local selection={english=true,panelSource_custom1='Keep Bento Camera',panelSource_panel5_3='Keep Overlap Camera'}
script_update(selection)
local props=script_properties()
assert(#props.lists==16)
assert(props.lists[1].key=='panelSource_game' and props.lists[1].label=='Main OBS source')
for column=1,5 do for row=1,3 do local index=2+(column-1)*3+row-1
 assert(props.lists[index].key=='panelSource_panel'..column..'_'..row)
 assert(props.lists[index].label=='Panel '..column..'-'..row..' OBS source')
end end
saved.layoutMode='bento'
props=script_properties();assert(#props.lists==7)
assert(props.lists[2].key=='panelSource_custom1' and props.lists[2].label=='Sub 1 OBS source')
assert(selection.panelSource_custom1=='Keep Bento Camera' and selection.panelSource_panel5_3=='Keep Overlap Camera')
"""
        self.run_lua(model + code + scenario)

    def test_preset_switch_hides_inactive_groups_without_deleting_user_sources(self):
        code=SOURCE.read_text(encoding='utf-8')
        start=code.index("  -- Keep inactive preset groups")
        end=code.index('  for _,name in ipairs(unused_groups)',start)
        switch=code[start:end]
        catalog=code[code.index('local panel_keys='):code.index('-- Hold original sources')]
        model="""
obs={}
local scene={groups={}}
function obs.obs_scene_get_group(s,n) return s.groups[n] end
function obs.obs_sceneitem_set_visible(item,visible) item.visible=visible end
"""
        setup="""
for index,key in ipairs(all_panel_keys) do scene.groups['ALO \u00b7 '..all_panel_names[index]..' Group']={visible=true,userSource={settings={device='retain'},filters={}}} end
local original=scene.groups['ALO \u00b7 Sub 1 Group']
local panels={game={}}
for column=1,5 do for row=1,3 do panels['panel'..column..'_'..row]={} end end
"""
        scenario="""
assert(scene.groups['ALO \u00b7 Sub 1 Group']==original and original.visible==false)
assert(original.userSource.settings.device=='retain' and original.userSource.filters~=nil)
assert(scene.groups['ALO \u00b7 Panel 5-3 Group'].visible)
"""
        self.run_lua(model+catalog+setup+switch+scenario)

class OverlapPackageTests(unittest.TestCase):
    def test_shape_algorithm_and_license_travel_with_saved_obs_runtime(self):
        import base64
        import importlib.util
        spec = importlib.util.spec_from_file_location('overlap_builder', SOURCE.parents[1] / 'build.py')
        builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(builder)
        self.assertIn('internal/panel-shape.js', builder.entries)
        self.assertIn('assets/figma-squircle-LICENSE.txt', builder.entries)
        runtime = json.loads(builder.entries['internal/export-runtime.js'].decode().removeprefix('window.OBS_EXPORT_RUNTIME = ').strip().removesuffix(';'))
        self.assertIn('assets/figma-squircle-LICENSE.txt', runtime)
        for key in OVERLAP_KEYS[1:]:
            filename = 'panel-media-' + key + '.html'
            self.assertIn(filename, runtime)
            html = base64.b64decode(runtime[filename]).decode()
            self.assertIn('data-panel="'+key+'"', html)
        for filename in ['settings.html','guide.html','README.txt']:
            self.assertNotIn(filename, runtime)
        lua = base64.b64decode(runtime['OBS-script.lua']).decode()
        self.assertIn("script_path()..'internal/panel-shape.js'", lua)
        for filename in ['overlay.html', 'background.html', 'frame.html']:
            html = builder.entries[filename].decode()
            self.assertIn('internal/panel-shape.js', html)
