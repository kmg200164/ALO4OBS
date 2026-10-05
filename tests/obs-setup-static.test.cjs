const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../template/OBS-script.lua'),'utf8');
const legacy=source.slice(source.indexOf('local function apply(props,property)'));
const generic=source.slice(source.indexOf('local function apply_generic(settings)'),source.indexOf('local function apply(props,property)'));
// These are source guard checks, not an OBS or Lua runtime test.
test('static guard: panel visibility is copied and released before live-source preflight',()=>{
 const visibility=legacy.indexOf("obs.obs_data_get_obj(settings,'panelEnabled')");
 const release=legacy.indexOf('obs.obs_data_release(panel_settings)',visibility);
 const capture=legacy.indexOf("local game=panel_enabled('game')");
 assert.ok(visibility>=0&&release>visibility&&capture>release);
 assert.equal((legacy.match(/obs\.obs_data_get_obj\(settings,'panelEnabled'\)/g)||[]).length,1);
 assert.equal((legacy.match(/obs\.obs_data_release\(panel_settings\)/g)||[]).length,1);
 assert.doesNotMatch(legacy,/release_panel_settings/);
});
test('generic panels use independent OBS selectors and reject duplicate sources before scene mutation',()=>{
 assert.match(generic,/panelSource_.*raw_key|panelSource_.*key/);
 assert.match(generic,/if used\[selected\] then error_message=/);
 assert.ok(generic.indexOf('if used[selected]')<generic.indexOf('local source=obs.obs_get_source_by_name(scene_name)'));
 assert.match(generic,/assets\/.*alpha-mask\.png/);
});
test('v4 creates OST names and migrates only exact old template items after successful replacement',()=>{
 assert.match(generic,/local name='OST · Panel '\.\.panel\.index/);
 assert.match(generic,/browser\(scene,'OST · Background'/);
 assert.match(generic,/preserve_and_remove_old_group\(scene,'OBS Template · Panel '\.\.index\.\.' Group',current_sources\)/);
 assert.match(generic,/preserve_and_remove_old_group\(scene,'OBS Template · Custom '\.\.index\.\.' Group',current_sources\)/);
 assert.ok(generic.indexOf('-- Retain user sources')>generic.indexOf("browser(scene,'OST · Panel Fill'"));
 assert.doesNotMatch(generic,/local name='OBS Template · Panel '\.\.panel\.index/);
 assert.match(source,/name:match\('\^OST · '\)/);
});
test('v4 media panels use independent local browser sources in clipped groups',()=>{
 assert.match(generic,/panel\.kind=='media' and panel\.url~='' and name\.\.' Media'/);
 assert.match(generic,/panel\.kind=='media' and script_path\(\)\.\.'panel-media-'\.\.key\.\.'\.html'/);
 assert.match(generic,/clip\(scene,group,selected,[^\n]+panel\.kind=='media',retained_sources,pending_removals\)/);
 assert.match(source,/browser\(nested,selected,url,url_file==true,unpack\(box\)\)/);
 assert.match(generic,/elseif media_index then[\s\S]*local_file_matches\(occupied,'panel-media-'\.\.key\.\.'\.html'\)[\s\S]*known_group\(media_index\)/);
 assert.match(generic,/if needs_media then[\s\S]*panel-media\.js/);
});
test('existing local template sources can be migrated from another extracted folder',()=>{
 assert.match(generic,/local function local_file_matches\(candidate,filename\)/);
 assert.match(generic,/path:sub\(-#filename\)==filename/);
 assert.match(generic,/expected_type=local_file_matches\(occupied,local_files\[name\]\)/);
});
test('v4 refuses a new name already used outside the template scene',()=>{
 assert.match(generic,/local occupied=obs\.obs_get_source_by_name\(name\)/);
 assert.match(generic,/if placed==nil or not expected_type then[\s\S]*return fail\('An OST source name is occupied by another source:/);
 assert.match(source,/if not template_owned\(source_name\) and not current_sources\[source_name\]/);
});
test('v4 verifies generated source types before existing sources can be updated',()=>{
 const typeGuard=generic.indexOf('local expected_type');
 const firstClip=generic.indexOf('if not clip(scene,group,selected');
 assert.ok(typeGuard>=0&&typeGuard<firstClip);
 assert.match(generic,/if group_index then expected_type=obs\.obs_source_is_group\(occupied\) and known_group\(group_index\)/);
 assert.match(generic,/obs\.obs_source_get_id\(candidate\)~='browser_source' then return false/);
 assert.match(generic,/obs\.obs_data_get_bool\(data,'is_local_file'\)/);
 assert.match(generic,/web_index then[\s\S]*known_group\(web_index\)/);
 assert.match(generic,/if placed==nil or not expected_type then/);
});
test('v4 checks all seven group names before removing unused groups',()=>{
 const collision=generic.slice(generic.indexOf('local new_names='));
 assert.match(collision,/new_names\[#new_names\+1\]='OST · Panel '\.\.panel\.index\.\.' Group'/);
 assert.ok(collision.indexOf("new_names[#new_names+1]='OST · Panel '..panel.index..' Group'")<collision.indexOf('if panel.active and'));
 assert.match(collision,/local function known_group\(index\)[\s\S]*obs\.obs_source_get_id\(canvas_source\)/);
});
test('v4 excludes groups from OBS source selection and probes prerequisites before scene mutation',()=>{
 assert.match(generic,/obs\.obs_source_is_group\(chosen\)/);
 assert.match(source,/obs\.obs_source_is_group\(s\) and math\.floor\(obs\.obs_source_get_output_flags\(s\)/);
 const scene=generic.indexOf('local source=obs.obs_get_source_by_name(scene_name)');
 for(const probe of ["obs.obs_source_create('browser_source','OST · Browser Probe'", "obs.obs_source_create('mask_filter','OST · Mask Probe'", "obs.obs_source_create('color_source_v3','OST · Canvas Probe'"]){
  const at=generic.indexOf(probe);
  assert.ok(at>=0&&at<scene,`${probe} must precede scene mutation`);
 }
});
test('v4 retains existing groups on clip failure and delays removal of unused groups',()=>{
 const clip=source.slice(source.indexOf('local function clip('),source.indexOf('local panel_keys='));
 assert.match(clip,/local function fail_group\(\)[\s\S]*if existing==nil then obs\.obs_sceneitem_remove\(group\) end/);
 assert.doesNotMatch(clip,/obs\.obs_sceneitem_remove\(group\);return false/);
 assert.ok(clip.indexOf('local items=obs.obs_scene_enum_items(nested)')>clip.indexOf('if not ok then return fail_group() end'));
 const browser=generic.indexOf("result=browser(scene,'OST · Panel Fill'");
 const unused=generic.indexOf('for _,name in ipairs(unused_groups) do preserve_and_remove_old_group(scene,name,current_sources) end');
 assert.ok(browser>=0&&unused>browser);
});
test('panel outline visibility does not control panel fill visibility',()=>{
 const signal=source.slice(source.indexOf('local function sync_panel_fill(calldata)'),source.indexOf('local function connect_panel_signal()'));
 assert.match(signal,/panel_backdrop\(obs\.obs_sceneitem_visible\(item\),prefix\)/);
 assert.doesNotMatch(signal,/Panel Stroke|obs_sceneitem_set_visible\(fill/);
 assert.match(generic,/obs\.obs_sceneitem_set_visible\(obs\.obs_scene_find_source\(scene,'OST · Panel Fill'\),fill_visible\)/);
 assert.match(legacy,/obs\.obs_sceneitem_set_visible\(obs\.obs_scene_find_source\(scene,'OBS Template · Panel Fill'\),fill_visible\)/);
});
test('static guard: inactive captures, custom sources, and masks have no live dependency',()=>{
 assert.match(source,/local game=panel_enabled\('game'\) and obs\.obs_data_get_string\(cfg,'game'\) or ''/);
 assert.match(source,/local camera=panel_enabled\('hand'\) and mode=='camera' and obs\.obs_data_get_string\(cfg,'hand'\) or ''/);
 assert.match(source,/if panel_enabled\(slot\) and slots\[slot\]=='source' then/);
 assert.match(source,/local selected=panel_enabled\(slot\) and \(slots\[slot\]=='browser'/);
 assert.match(source,/if entry\[2\]~='' then[\s\S]*local mask=io\.open/);
});
test('static guard: widget URL preflight uses the same active-area gate as application',()=>{
 assert.match(source,/if area_enabled\(a\) and url~='' and/);
 assert.match(source,/local enabled,slot=area_enabled\(a\)/);
 assert.match(source,/if panel_enabled\(slot\) and slots\[slot\]=='browser' then/);
 assert.match(source,/if panel_enabled\('hand'\) and mode=='reactive' and obs\.obs_data_get_string\(settings,'reactiveUrl'\)=='' then/);
});
test('template placement locks each scene item after setting its transform and visibility',()=>{
 const place=source.slice(source.indexOf('local function place('),source.indexOf('local function remove('));
 assert.match(place,/obs\.obs_sceneitem_set_locked\(item,true\)/);
 assert.ok(place.indexOf('obs.obs_sceneitem_set_locked(item,true)')>place.indexOf('obs.obs_sceneitem_set_visible(item,true)'));
 assert.match(source,/local placed=source~=nil and place\(scene,source,x,y,w,h,bottom\)/);
 assert.match(source,/local canvas_placed=place\(nested,canvas,0,0,1920,1080,true\)/);
 assert.match(source,/local capture_placed=place\(nested,capture,unpack\(box\)\)/);
 assert.match(source,/if ok then ok=place\(scene,clip_source,0,0,1920,1080\) end/);
});
test('template groups and retained items are locked without changing shared OBS sources',()=>{
 const preserve=source.slice(source.indexOf('local function retain_user_source('),source.indexOf('local function browser('));
 const clip=source.slice(source.indexOf('local function clip('),source.indexOf('local panel_keys='));
 assert.match(clip,/local group=existing or obs\.obs_scene_add_group\(scene,name\)[\s\S]*obs\.obs_sceneitem_set_locked\(group,true\)/);
 assert.match(preserve,/obs\.obs_scene_add\(scene,source\)[\s\S]*obs\.obs_sceneitem_set_locked\(retained,true\)/);
 assert.match(preserve,/obs\.obs_sceneitem_set_locked\(group,true\)/);
 assert.doesNotMatch(source,/obs\.obs_source_set_locked|obs\.obs_scene_enum_items\(scene\)[\s\S]*obs\.obs_sceneitem_set_locked\(item,true\)/);
});
test('new template groups start collapsed while existing group state is preserved',()=>{
 const clip=source.slice(source.indexOf('local function clip('),source.indexOf('local panel_keys='));
 assert.match(clip,/if existing==nil then[\s\S]*obs\.obs_sceneitem_get_private_settings\(group\)[\s\S]*obs\.obs_data_set_bool\(private,'collapsed',true\)[\s\S]*obs\.obs_data_release\(private\)/);
});

test('populated apply snapshots before mutation and restores on failure before releasing references',()=>{
 const snapshot=generic.indexOf('local previous_layout=snapshot_layout(scene)');
 const firstClip=generic.indexOf('if not clip(scene,group,selected');
 const restore=generic.indexOf('restore_layout(previous_layout)');
 const release=generic.indexOf('release_layout(previous_layout)');
 assert.ok(snapshot>=0&&snapshot<firstClip);
 assert.ok(restore>firstClip&&release>restore);
 assert.match(generic.slice(restore-10,restore),/else\s*$/);
 assert.doesNotMatch(generic,/for _,name in ipairs\(new_groups\)/);
});
