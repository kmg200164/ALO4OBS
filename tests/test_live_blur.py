"""Execute the real live-blur planning and graph helpers in OBS LuaJIT."""
import unittest
import test_overlap_obs as obs_tests

lua_table = obs_tests.lua_table
SOURCE = obs_tests.SOURCE


@unittest.skipUnless(obs_tests.DLL.exists(), "OBS LuaJIT runtime is not installed")
class LiveBlurTests(unittest.TestCase):
    run_lua = obs_tests.OverlapObsTests.run_lua
    def helpers(self):
        source=SOURCE.read_text(encoding='utf-8')
        marker='-- Live panel blur uses a separate reference; original capture filters stay untouched.'
        clip=source[source.index('local function apply_source_view('):source.index("local panel_keys={'game','custom1'")]
        return clip+source[source.index(marker):source.index('-- ALO names identify generated items')] if marker in source else ''

    def model(self):
        return r"""
obs={LOG_WARNING=1};local refs=0
function obs.obs_data_get_obj(d,k) local v=d and d[k];if v then refs=refs+1 end;return v end
function obs.obs_data_release() refs=refs-1 end
function obs.obs_data_get_string(d,k) return d and d[k] or '' end
function obs.obs_data_get_double(d,k) return d and d[k] or 0 end
function obs.obs_data_get_bool(d,k) return d and d[k]==true end
function obs.obs_data_has_user_value(d,k) return d and d[k]~=nil end
function obs.obs_data_create() refs=refs+1;return {} end
function obs.obs_data_set_int(d,k,v) d[k]=v end
function obs.obs_data_set_double(d,k,v) d[k]=v end
function obs.obs_data_set_string(d,k,v) d[k]=v end
function obs.obs_data_set_bool(d,k,v) d[k]=v end
local function finish() assert(refs==0,'OBS data references leaked: '..refs) end
"""

    def test_bento_background_never_depends_on_main_but_overlap_does(self):
        for mode in ['bento','overlap']:
            for background in [{'mode':'file','url':'assets/fixed.png'},{'mode':'solid','color':'#123456'}]:
                config=dict(layoutMode=mode,backgroundImage='assets/fixed.png',globalStyle=dict(background=background,fill=dict(mode='solid',blur=16)),regionStyleOverrides=dict(aux2=True,none=True),regionBackgrounds=dict(aux2=dict(fill=dict(mode='gradient',blur=32)),none=dict(fill=dict(mode='none',blur=64))))
                self.run_lua(self.model()+self.helpers()+r"""
local panels={game={active=true,kind='source',source='Game capture'},aux1={active=true},aux2={active=true},none={active=true},hidden={active=false}}
for _,input in ipairs({'','Game frame A','Game frame B'}) do
 panels.game.source=input
 local plan,message=plan_live_blur(CONFIG,panels,{'game','aux1','aux2','none','hidden'})
 if MODE=='bento' then
  assert(plan and plan.input==nil and next(plan.radii)==nil,'Bento must retain the configured static backdrop, never Main')
 elseif input=='' then assert(plan==nil and message:find('Main OBS source',1,true))
 else
  assert(plan.input==input and plan.radii.aux1==16 and plan.radii.aux2==32)
  assert(plan.radii.none==nil and plan.radii.game==nil and plan.radii.hidden==nil)
 end
end
finish()
""".replace('CONFIG',lua_table(config)).replace('MODE',lua_table(mode)))

    def test_disabled_fill_zero_blur_and_no_main_have_safe_explicit_behavior(self):
        self.run_lua(self.model()+self.helpers()+r"""
assert(type(plan_live_blur)=='function','live panel blur planning is missing')
local panels={game={active=true,kind='source',source=''},aux={active=true}}
local plan,message=plan_live_blur({layoutMode='overlap',globalStyle={fill={mode='solid',blur=16}}},panels,{'game','aux'})
assert(plan==nil and message:find('Main OBS source',1,true),'missing live input must not silently blur a static image')
for _,fill in ipairs({{mode='none',blur=16},{mode='solid',blur=0}}) do
 local safe,err=plan_live_blur({layoutMode='overlap',globalStyle={fill=fill}},panels,{'game','aux'})
 assert(safe and next(safe.radii)==nil and not err)
end
finish()
""")

    def test_missing_plugin_is_reported_before_creating_public_sources(self):
        self.run_lua(self.model()+self.helpers()+r"""
assert(type(check_live_blur)=='function','live blur dependency check is missing')
local public=0;function obs.obs_source_create() public=public+1;return {} end
function obs.obs_source_create_private(kind,name,data) assert(kind=='obs_composite_blur');return nil end
local ok,message=check_live_blur({input='Game capture',radii={aux=16}})
assert(not ok and message:find('Composite Blur',1,true) and public==0)
local ok2=check_live_blur({radii={}});assert(ok2)
finish()
""")

    def test_blur_precedes_panel_mask_and_never_filters_original_capture(self):
        self.run_lua(self.model()+self.helpers()+r"""
assert(type(place_live_blur)=='function','live panel blur graph is missing')
local raw,canvas,group,item={name='Game capture',filters={}},{name='Layout Clip Canvas'},{name='Layout Aux Live Blur',filters={}},{}
local nested={};local placements={};local source_refs=0
function script_path() return 'runtime/' end
function obs.obs_get_source_by_name(name) source_refs=source_refs+1;return name=='Game capture' and raw or canvas end
function obs.obs_source_release() source_refs=source_refs-1 end
local created=false
function obs.obs_scene_get_group() return created and item or nil end
function obs.obs_scene_add_group() created=true;return item end
function obs.obs_sceneitem_get_source() return group end
function obs.obs_sceneitem_group_get_scene() return nested end
function obs.obs_source_get_filter_by_name(source,name) for _,f in ipairs(source.filters) do if f.name==name then source_refs=source_refs+1;return f end end end
function obs.obs_source_create(kind,name,data) source_refs=source_refs+1;return {kind=kind,name=name,data=data} end
function obs.obs_source_filter_add(source,filter) source.filters[#source.filters+1]=filter end
function obs.obs_source_update(filter,data) filter.data=data end
function obs.obs_sceneitem_get_private_settings() refs=refs+1;item.private=item.private or {};return item.private end
function obs.obs_sceneitem_set_visible(_,visible) item.visible=visible end
function place(scene,source,x,y,w,h) placements[#placements+1]={source=source,x=x,y=y,w=w,h=h};return true end
io.open=function() return {close=function() end} end
function obs.obs_sceneitem_set_locked() end
function obs.obs_sceneitem_crop() return {} end
function obs.obs_sceneitem_set_crop(item,crop) item.crop=crop end
function obs.obs_sceneitem_set_bounds_type() end
function obs.obs_scene_find_source() return item end
function obs.obs_scene_enum_items() return {} end
function obs.sceneitem_list_release() end
function obs.obs_source_get_name(source) return source.name end
local result=place_live_blur({},'Layout ','Aux','aux','Game capture',24)
assert(result and #raw.filters==0,'the original capture must stay sharp')
assert(#group.filters==2 and group.filters[1].kind=='obs_composite_blur' and group.filters[2].kind=='mask_filter','blur must run before the exact panel mask')
assert(group.filters[1].data.radius==24 and group.filters[1].data.blur_algorithm==1 and group.filters[1].data.blur_type==1)
assert(group.filters[2].data.image_path=='runtime/assets/aux-alpha-mask.png')
assert(placements[1].source==canvas and placements[2].source==raw and placements[2].w==1920 and placements[2].h==1080)
assert(place_live_blur({},'Layout ','Aux','aux','Game capture',8))
assert(#group.filters==2 and group.filters[1].data.radius==8,'reapply must reuse the blur and mask filters')
assert(#raw.filters==0 and item.private.alo4obs_live_blur,'original must remain sharp and generated group must retain ownership')
assert(source_refs==0,'source references leaked');finish()
""")


    def test_apply_refuses_missing_plugin_before_any_scene_mutation(self):
        config=obs_tests.config()
        config['panelContent']['game']['type']='source'
        config['regionBackgrounds']={'panel1_1':{'blur':16}}
        code=SOURCE.read_text(encoding='utf-8')
        generic=code[code.index('local function apply_generic('):code.index('local function apply(props')]
        model=r"""
local logs={};local cfg={panelSource_game='Game capture'}
obs.OBS_SOURCE_VIDEO=1
function obs.script_log(_,message) logs[#logs+1]=message end
function obs.obs_get_source_by_name(name) assert(name=='Game capture','scene must not be looked up yet');return {} end
function obs.obs_source_release() end
function obs.obs_scene_from_source() return nil end
function obs.obs_source_is_group() return false end
function obs.obs_source_get_output_flags() return 1 end
local function template_owned() return false end
function obs.obs_source_create_private(kind) assert(kind=='obs_composite_blur');return nil end
function obs.obs_scene_create() assert(false,'scene was mutated before dependency check') end
function script_path() return 'runtime/' end
io.open=function() return {close=function() end} end
"""
        self.run_lua(self.model()+model+self.helpers()+generic+r"""
local settings=CONFIG
refs=refs+1
assert(apply_generic(settings)==false)
assert(#logs==1 and logs[1]:find('Composite Blur',1,true))
finish()
""".replace('CONFIG',lua_table(config)))

    def test_both_layouts_order_live_layers_between_main_and_auxiliary_content(self):
        code=SOURCE.read_text(encoding='utf-8')
        start=code.index(' -- Overlap fills and shadows sit above Main')
        ordering=code[start:code.index(' if result then\n  -- Commit removals',start)]
        for mode,count in [('bento',6),('overlap',15)]:
            model=r"""
obs={OBS_ORDER_MOVE_TOP=1}
local scene={items={}};local prefix='Layout ';local result=true
local live_plan={input='Game capture'};local layout_mode=MODE
local panel_keys={'game'};local panels={game={name='Main'}}
local function add(name) scene.items[#scene.items+1]={name=prefix..name} end
function obs.obs_scene_find_source(s,n) for _,i in ipairs(s.items) do if i.name==n then return i end end end
function obs.obs_sceneitem_set_order(item) for k,v in ipairs(scene.items) do if v==item then table.remove(scene.items,k);break end end;scene.items[#scene.items+1]=item end
add('Panel Fill');add('Overlay');add('Panel Stroke');add('Main Group')
for n=1,COUNT do local key='aux'..n;panel_keys[#panel_keys+1]=key;panels[key]={name=key};add(key..' Group');add(key..' Live Blur') end
""".replace('MODE',lua_table(mode)).replace('COUNT',str(count))
            scenario=r"""
local order={};for n,item in ipairs(scene.items) do order[item.name]=n end
for n=1,COUNT do
 assert(order[prefix..'Main Group']<order[prefix..'aux'..n..' Live Blur'])
 assert(order[prefix..'aux'..n..' Live Blur']<order[prefix..'Panel Fill'])
 assert(order[prefix..'Panel Fill']<order[prefix..'aux'..n..' Group'])
 assert(order[prefix..'aux'..n..' Group']<order[prefix..'Panel Stroke'])
end
""".replace('COUNT',str(count))
            self.run_lua(model+ordering+scenario)

    def test_fill_visibility_only_toggles_enabled_generated_blur_groups(self):
        code=SOURCE.read_text(encoding='utf-8')
        functions=code[code.index('local function panel_backdrop('):code.index('local function sync_panel_fill(')]
        model=r"""
local browser_css='body{}';local prefix='ALO4OBS · BENTO · '
local fill={data={}};local active={private={alo4obs_live_blur=true,alo4obs_live_blur_enabled=true}}
local disabled={private={alo4obs_live_blur=true,alo4obs_live_blur_enabled=false}}
local user={private={},visible=true};local scene={active,disabled,user}
function obs.obs_get_source_by_name(name) return name==prefix..'Panel Fill' and fill or scene end
function obs.obs_source_get_settings(source) refs=refs+1;return source.data end
function obs.obs_source_update(source,data) source.data=data end
function obs.obs_source_release() end
function obs.obs_scene_from_source(source) return source end
function obs.obs_scene_enum_items(source) return source end
function obs.sceneitem_list_release() end
function obs.obs_sceneitem_get_private_settings(item) refs=refs+1;return item.private end
function obs.obs_sceneitem_set_visible(item,visible) item.visible=visible end
"""
        self.run_lua(self.model()+model+functions+r"""
panel_backdrop(true,prefix,true)
assert(fill.data.css:find('.backdrop{display:none!important;}',1,true))
assert(fill.data.css:find('.tile[data-region="game"]{display:none!important;}',1,true))
panel_backdrop(false,prefix);panel_backdrop(true,prefix)
assert(fill.data.css:find('.backdrop{display:none!important;}',1,true),'background toggles must not restore a static fake backdrop')
sync_live_blur_visibility(prefix,false);assert(not active.visible and not disabled.visible and user.visible)
sync_live_blur_visibility(prefix,true);assert(active.visible and not disabled.visible and user.visible)
finish()
""")


    def test_game_capture_availability_does_not_trust_stale_dimensions(self):
        code=SOURCE.read_text(encoding='utf-8')
        start=code.find('local function live_input_ready(')
        helper=code[start:code.index('local function panel_backdrop(')] if start>=0 else ''
        self.run_lua(self.model()+r"""
local input={hooked=false,removed=false};local released=0
function obs.obs_source_removed(source) return source.removed end
function obs.obs_get_source_by_name(name) return name=='Game' and input or nil end
function obs.obs_source_get_width() return 1920 end
function obs.obs_source_get_height() return 1080 end
function obs.obs_source_get_id() return 'game_capture' end
function obs.obs_source_release() released=released+1 end
function obs.obs_source_get_proc_handler(source) return source end
function obs.calldata_create() return {} end
function obs.calldata_destroy() end
function obs.proc_handler_call(source,name,data) assert(name=='get_hooked');data.hooked=source.hooked;return true end
function obs.calldata_bool(data,key) return data[key]==true end
"""+helper+r"""
assert(type(live_input_ready)=='function','missing capture availability check')
assert(not live_input_ready('Game'),'stale nonzero dimensions must keep static fallback')
input.hooked=true;assert(live_input_ready('Game'),'capture initialization must enable live blur')
input.hooked=false;assert(not live_input_ready('Game'),'disconnect must restore static fallback')
input.hooked=true;assert(live_input_ready('Game'),'reconnect must enable live blur again')
input.removed=true;assert(not live_input_ready('Game'),'removed source must not remain live just because dimensions persist')
input.removed=false;assert(live_input_ready('Game'))
assert(not live_input_ready('Missing'));assert(released==6)
finish()
""")


    def test_empty_live_reconnect_switches_backdrop_and_owned_groups(self):
        code=SOURCE.read_text(encoding='utf-8')
        functions=code[code.index('local function live_input_ready('):code.index('local function sync_panel_fill(')]
        model=r"""
local browser_css='body{}';local prefix='ALO4OBS · OVERLAP · '
local input={hooked=false};local fill={data={alo4obs_live_source='Game',alo4obs_live_fill=true}}
local active={private={alo4obs_live_blur=true,alo4obs_live_blur_enabled=true}}
local disabled={private={alo4obs_live_blur=true,alo4obs_live_blur_enabled=false}}
local user={private={},visible=true};local fillItem={visible=true};local background={visible=true}
local scene={active,disabled,user}
function obs.obs_get_source_by_name(name) if name=='Game' then return input elseif name==prefix..'Panel Fill' then return fill else return scene end end
function obs.obs_source_get_width() return 1920 end
function obs.obs_source_get_height() return 1080 end
function obs.obs_source_get_id() return 'game_capture' end
function obs.obs_source_get_proc_handler(source) return source end
function obs.calldata_create() return {} end
function obs.calldata_destroy() end
function obs.proc_handler_call(source,name,data) data.hooked=source.hooked;return true end
function obs.calldata_bool(data,key) return data[key]==true end
function obs.obs_source_get_settings(source) refs=refs+1;return source.data end
function obs.obs_source_update(source,data) source.data=data end
function obs.obs_source_release() end
function obs.obs_scene_from_source(source) return source end
function obs.obs_scene_enum_items(source) return source end
function obs.sceneitem_list_release() end
function obs.obs_sceneitem_get_private_settings(item) refs=refs+1;return item.private end
function obs.obs_sceneitem_set_visible(item,visible) item.visible=visible end
function obs.obs_sceneitem_visible(item) return item.visible end
function obs.obs_scene_find_source(scene,name) if name==prefix..'Panel Fill' then return fillItem elseif name==prefix..'Background' then return background end end
"""
        self.run_lua(self.model()+model+functions+r"""
refresh_live_blur(prefix)
assert(fill.data.css=='body{}','empty capture must preserve static browser blur')
assert(not active.visible and not disabled.visible and user.visible)
input.hooked=true;refresh_live_blur(prefix)
assert(fill.data.css:find('.backdrop{display:none!important;}',1,true))
assert(active.visible and not disabled.visible and user.visible)
input.hooked=false;refresh_live_blur(prefix)
assert(fill.data.css=='body{}' and not active.visible,'disconnect must restore static blur')
input.hooked=true;refresh_live_blur(prefix)
assert(active.visible and not disabled.visible,'none/disabled panel must remain excluded')
fillItem.visible=false;refresh_live_blur(prefix);assert(not active.visible)
input.hooked=false;background.visible=false;refresh_live_blur(prefix)
assert(fill.data.css:find('.backdrop{display:none!important;}',1,true),'background off must stay off')
prefix=prefix:gsub('OVERLAP','BENTO');background.visible=true;fillItem.visible=true;input.hooked=true
fill.data.alo4obs_live_fill=true;active.visible=true
refresh_live_blur(prefix)
assert(fill.data.css=='body{}' and not active.visible,'old Bento live references must restore static background even with a hooked Main')
input.hooked=false;refresh_live_blur(prefix);assert(fill.data.css=='body{}' and not active.visible)

finish()
""")


if __name__=='__main__':
    unittest.main()
