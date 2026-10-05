obs = obslua
local cfg=nil
local scene_name='OBS Streaming Template'
local panel_signal_source=nil
local browser_css='body { background: transparent; margin: 0; overflow: hidden; }'
local boxes={game={32,32,1384,778},custom1={32,842,440,206},custom2={504,842,440,206},custom3={976,842,440,206},chat={1448,32,440,317},translation={1448,381,440,317},hand={1448,730,440,318}}
local function template_owned(name) return name:match('^OST · ') or name:match('^OBS Template · ') or name:match('^KMG · ') end
local areas={{'chatUrl','OBS Template · Chat','chat','showChat'},
 {'translationUrl','OBS Template · Translation','translation','showSubtitles'},
 {'donationChzzk','OBS Template · CHZZK Alerts','alerts','showAlerts'},
 {'donationTwitch','OBS Template · Twitch Alerts','alerts','showAlerts'},
 {'donationYoutube','OBS Template · YouTube Alerts','alerts','showAlerts'},
 {'donationSoop','OBS Template · SOOP Alerts','alerts','showAlerts'},
 {'reactiveUrl','OBS Template · Discord Reactive','hand','reactive'}}
function script_description()
 return 'OBS Streaming Template: configure seven panels in preview.html, extract OBS-settings.zip beside this script, select a different existing OBS source for each panel that needs one, then Apply. Existing scenes and capture settings are preserved.'
end
function script_defaults(settings)
 obs.obs_data_set_default_bool(settings,'english',true)
end
function script_update(settings)
 if cfg~=nil then obs.obs_data_release(cfg) end
 cfg=settings;obs.obs_data_addref(cfg)
end
local function panel_backdrop(visible,prefix)
 local source=obs.obs_get_source_by_name((prefix or 'OBS Template · ')..'Panel Fill')
 if source==nil then return end
 local data=obs.obs_source_get_settings(source)
 obs.obs_data_set_string(data,'css',browser_css..(visible and '' or '.backdrop{display:none!important;}'))
 obs.obs_source_update(source,data)
 obs.obs_data_release(data);obs.obs_source_release(source)
end
local function sync_panel_fill(calldata)
 local item=obs.calldata_sceneitem(calldata,'item')
 if item==nil then return end
 local name=obs.obs_source_get_name(obs.obs_sceneitem_get_source(item))
 local prefix=name:match('^(OST · )Background$') or name:match('^(OBS Template · )Background$')
 if prefix~=nil then panel_backdrop(obs.obs_sceneitem_visible(item),prefix) end
end
local function connect_panel_signal()
 if panel_signal_source~=nil then
  obs.signal_handler_disconnect(obs.obs_source_get_signal_handler(panel_signal_source),'item_visible',sync_panel_fill)
  obs.obs_source_release(panel_signal_source)
 end
 panel_signal_source=obs.obs_get_source_by_name(scene_name)
 if panel_signal_source~=nil then obs.signal_handler_connect(obs.obs_source_get_signal_handler(panel_signal_source),'item_visible',sync_panel_fill) end
end
function script_unload()
 if panel_signal_source~=nil then
  obs.signal_handler_disconnect(obs.obs_source_get_signal_handler(panel_signal_source),'item_visible',sync_panel_fill)
  obs.obs_source_release(panel_signal_source);panel_signal_source=nil
 end
 if cfg~=nil then obs.obs_data_release(cfg);cfg=nil end
end
local function place(scene,source,x,y,w,h,bottom)
 local item=obs.obs_scene_find_source(scene,obs.obs_source_get_name(source))
 if item==nil then item=obs.obs_scene_add(scene,source) end
 if item==nil then return false end
 local pos=obs.vec2();pos.x=x;pos.y=y
 local bounds=obs.vec2();bounds.x=w;bounds.y=h
 obs.obs_sceneitem_set_alignment(item,5)
 obs.obs_sceneitem_set_pos(item,pos)
 obs.obs_sceneitem_set_bounds_type(item,obs.OBS_BOUNDS_SCALE_INNER)
 obs.obs_sceneitem_set_bounds_alignment(item,0)
 obs.obs_sceneitem_set_bounds(item,bounds)
 obs.obs_sceneitem_set_order(item,bottom and obs.OBS_ORDER_MOVE_BOTTOM or obs.OBS_ORDER_MOVE_TOP)
 obs.obs_sceneitem_set_visible(item,true)
 obs.obs_sceneitem_set_locked(item,true)
 return true
end
local function remove(scene,name)
 local item=obs.obs_scene_find_source(scene,name)
 if item~=nil then obs.obs_sceneitem_remove(item) end
end
local function retain_user_source(scene,source,retained_sources)
 local name=obs.obs_source_get_name(source)
 if template_owned(name) or obs.obs_scene_find_source(scene,name)~=nil then return true end
 local retained=obs.obs_scene_add(scene,source)
 if retained==nil then return false end
 obs.obs_sceneitem_set_visible(retained,false)
 obs.obs_sceneitem_set_locked(retained,true)
 if retained_sources~=nil then retained_sources[name]=retained end
 return true
end
local function preserve_and_remove_old_group(scene,name,current_sources)
 local group=obs.obs_scene_get_group(scene,name)
 if group==nil then return end
 local nested=obs.obs_sceneitem_group_get_scene(group)
 if nested==nil then obs.obs_sceneitem_set_visible(group,false);obs.obs_sceneitem_set_locked(group,true);return end
 local items=obs.obs_scene_enum_items(nested)
 if items==nil then obs.obs_sceneitem_set_visible(group,false);obs.obs_sceneitem_set_locked(group,true);return end
 local preserved=true
 for _,item in ipairs(items) do
  local source=obs.obs_sceneitem_get_source(item)
  local source_name=obs.obs_source_get_name(source)
  if not template_owned(source_name) and not current_sources[source_name] and obs.obs_scene_find_source(scene,source_name)==nil then
   if not retain_user_source(scene,source) then preserved=false end
  end
 end
 obs.sceneitem_list_release(items)
 if preserved then obs.obs_sceneitem_remove(group)
 else
  obs.obs_sceneitem_set_visible(group,false)
  obs.obs_sceneitem_set_locked(group,true)
  obs.script_log(obs.LOG_WARNING,'An old panel group was hidden because its user source could not be retained: '..name)
 end
end
local function browser(scene,name,url,file,x,y,w,h,css,bottom)
 local data=obs.obs_data_create()
 obs.obs_data_set_int(data,'width',w);obs.obs_data_set_int(data,'height',h)
 obs.obs_data_set_string(data,'css',css or browser_css)
 obs.obs_data_set_bool(data,'is_local_file',file)
 obs.obs_data_set_string(data,file and 'local_file' or 'url',url)
 local source=obs.obs_get_source_by_name(name)
 if source==nil then source=obs.obs_source_create('browser_source',name,data,nil)
 else
  obs.obs_source_update(source,data)
  if file then
   local properties=obs.obs_source_properties(source)
   if properties~=nil then
    local refresh=obs.obs_properties_get(properties,'refreshnocache')
    if refresh~=nil then obs.obs_property_button_clicked(refresh,source) end
    obs.obs_properties_destroy(properties)
   end
  end
 end
 local placed=source~=nil and place(scene,source,x,y,w,h,bottom)
 if source~=nil then obs.obs_source_release(source) end
 obs.obs_data_release(data)
 return placed
end
local function clip(scene,name,selected,mask_path,box,url,internal_prefix,url_file,retained_sources,pending_removals)
 internal_prefix=internal_prefix or 'OBS Template · '
 local existing=obs.obs_scene_get_group(scene,name)
 if selected=='' then
  if existing~=nil then obs.obs_sceneitem_remove(existing) end
  return true
 end
 local mask=io.open(mask_path,'rb')
 if mask==nil then return false end
 mask:close()
 local group=existing or obs.obs_scene_add_group(scene,name)
 if group==nil then return false end
 if existing==nil then
  local private=obs.obs_sceneitem_get_private_settings(group)
  if private~=nil then
   obs.obs_data_set_bool(private,'collapsed',true)
   obs.obs_data_release(private)
  end
 end
 obs.obs_sceneitem_set_locked(group,true)
 local function fail_group()
  -- An existing group is the last known good output. Never discard it on failure.
  if existing==nil then obs.obs_sceneitem_remove(group) end
  return false
 end
 local nested=obs.obs_sceneitem_group_get_scene(group)
 local clip_source=obs.obs_sceneitem_get_source(group)
 if nested==nil or clip_source==nil then
  return fail_group()
 end
 local canvas_name=internal_prefix..'Clip Canvas'
 local canvas=obs.obs_get_source_by_name(canvas_name)
 local data=obs.obs_data_create()
 obs.obs_data_set_int(data,'color',0)
 obs.obs_data_set_int(data,'width',1920)
 obs.obs_data_set_int(data,'height',1080)
 if canvas==nil then canvas=obs.obs_source_create('color_source_v3',canvas_name,data,nil)
 else obs.obs_source_update(canvas,data) end
 obs.obs_data_release(data)
 if canvas==nil then return fail_group() end
 local canvas_placed=place(nested,canvas,0,0,1920,1080,true)
 obs.obs_source_release(canvas)
 if not canvas_placed then return fail_group() end
 if url~=nil then
  if not browser(nested,selected,url,url_file==true,unpack(box)) then return fail_group() end
 else
  local capture=obs.obs_get_source_by_name(selected)
  if capture==nil then return fail_group() end
  local capture_placed=place(nested,capture,unpack(box))
  obs.obs_source_release(capture)
  if not capture_placed then return fail_group() end
 end
 data=obs.obs_data_create()
 obs.obs_data_set_string(data,'type','mask_alpha_filter.effect')
 obs.obs_data_set_string(data,'image_path',mask_path)
 obs.obs_data_set_int(data,'opacity',100)
 obs.obs_data_set_bool(data,'stretch',true)
 local filter=obs.obs_source_get_filter_by_name(clip_source,internal_prefix..'Alpha Mask')
 if filter==nil then filter=obs.obs_source_create('mask_filter',internal_prefix..'Alpha Mask',data,nil);if filter~=nil then obs.obs_source_filter_add(clip_source,filter) end
 else obs.obs_source_update(filter,data) end
 obs.obs_data_release(data)
 local ok=filter~=nil
 if filter~=nil then obs.obs_source_release(filter) end
 if ok then ok=place(scene,clip_source,0,0,1920,1080) end
 if not ok then return fail_group() end
 -- Keep the previous contents until the replacement and its mask are ready.
 local items=obs.obs_scene_enum_items(nested)
 if items~=nil then
  for _,item in ipairs(items) do
   local item_name=obs.obs_source_get_name(obs.obs_sceneitem_get_source(item))
   if item_name~=selected and item_name~=canvas_name then
    if not retain_user_source(scene,obs.obs_sceneitem_get_source(item),retained_sources) then
     obs.sceneitem_list_release(items)
     obs.script_log(obs.LOG_WARNING,'Could not retain a user source; previous panel item was preserved.')
     return false
    end
    if pending_removals~=nil then pending_removals[#pending_removals+1]=item else obs.obs_sceneitem_remove(item) end
   end
  end
  obs.sceneitem_list_release(items)
 end
 return ok
end
local panel_keys={'game','custom1','custom2','custom3','chat','translation','hand'}
-- Hold original sources while groups are edited; a failed apply must not expose
-- a mixture of the previous layout and the partially applied next layout.
local function copy_source_settings(source)
 local original=obs.obs_source_get_settings(source)
 local copy=obs.obs_data_create_from_json(obs.obs_data_get_json(original))
 obs.obs_data_release(original)
 return copy
end
local function snapshot_layout(scene)
 local snapshot={sources={},scenes={}}
 local function capture(current)
  local state={scene=current,items={}}
  snapshot.scenes[#snapshot.scenes+1]=state
  local items=obs.obs_scene_enum_items(current)
  if items~=nil then
   for index,item in ipairs(items) do
    local source=obs.obs_sceneitem_get_source(item)
    local name=obs.obs_source_get_name(source)
    if snapshot.sources[name]==nil then
     local saved={source=obs.obs_source_get_ref(source),filters={}}
     if template_owned(name) then
      saved.settings=copy_source_settings(source)
      local filters=obs.obs_source_enum_filters(source)
      if filters~=nil then
       for _,filter in ipairs(filters) do
        saved.filters[#saved.filters+1]={source=obs.obs_source_get_ref(filter),name=obs.obs_source_get_name(filter),settings=copy_source_settings(filter),enabled=obs.obs_source_enabled(filter)}
       end
       obs.source_list_release(filters)
      end
     end
     snapshot.sources[name]=saved
    end
    local info=obs.obs_transform_info()
    local crop=obs.obs_sceneitem_crop()
    obs.obs_sceneitem_get_info2(item,info);obs.obs_sceneitem_get_crop(item,crop)
    obs.obs_sceneitem_addref(item)
    local private=obs.obs_sceneitem_get_private_settings(item)
    local collapsed=private~=nil and obs.obs_data_get_bool(private,'collapsed') or false
    if private~=nil then obs.obs_data_release(private) end
    state.items[#state.items+1]={item=item,source=source,name=name,info=info,crop=crop,visible=obs.obs_sceneitem_visible(item),locked=obs.obs_sceneitem_locked(item),collapsed=collapsed,index=index-1}
    if obs.obs_sceneitem_is_group(item) then capture(obs.obs_sceneitem_group_get_scene(item)) end
   end
   obs.sceneitem_list_release(items)
  end
 end
 capture(scene)
 return snapshot
end
local function restore_layout(snapshot)
 -- Restore children first so the original group transform is applied last.
 for index=#snapshot.scenes,1,-1 do
  local state=snapshot.scenes[index]
  local originals={}
  for _,saved in ipairs(state.items) do originals[obs.obs_sceneitem_get_id(saved.item)]=true end
  local items=obs.obs_scene_enum_items(state.scene)
  if items~=nil then
   for _,item in ipairs(items) do
    if not originals[obs.obs_sceneitem_get_id(item)] then obs.obs_sceneitem_remove(item) end
   end
   obs.sceneitem_list_release(items)
  end
  for _,saved in ipairs(state.items) do
   local item=saved.item
   if item~=nil then
    obs.obs_sceneitem_set_info2(item,saved.info);obs.obs_sceneitem_set_crop(item,saved.crop)
    obs.obs_sceneitem_set_visible(item,saved.visible);obs.obs_sceneitem_set_locked(item,saved.locked)
    obs.obs_sceneitem_set_order_position(item,saved.index)
    local private=obs.obs_sceneitem_get_private_settings(item)
    if private~=nil then obs.obs_data_set_bool(private,'collapsed',saved.collapsed);obs.obs_data_release(private) end
   end
  end
 end
 for _,saved in pairs(snapshot.sources) do
  if saved.settings~=nil then
   obs.obs_source_reset_settings(saved.source,saved.settings)
   local originals={}
   for _,filter in ipairs(saved.filters) do originals[filter.name]=true end
   local filters=obs.obs_source_enum_filters(saved.source)
   if filters~=nil then
    for _,filter in ipairs(filters) do if not originals[obs.obs_source_get_name(filter)] then obs.obs_source_filter_remove(saved.source,filter) end end
    obs.source_list_release(filters)
   end
   for _,filter in ipairs(saved.filters) do
    local current=obs.obs_source_get_filter_by_name(saved.source,filter.name)
    if current==nil then obs.obs_source_filter_add(saved.source,filter.source) else obs.obs_source_release(current) end
    obs.obs_source_reset_settings(filter.source,filter.settings);obs.obs_source_set_enabled(filter.source,filter.enabled)
   end
  end
 end
end
local function release_layout(snapshot)
 for _,state in ipairs(snapshot.scenes) do
  for _,saved in ipairs(state.items) do obs.obs_sceneitem_release(saved.item) end
 end
 for _,saved in pairs(snapshot.sources) do
  if saved.settings~=nil then obs.obs_data_release(saved.settings) end
  for _,filter in ipairs(saved.filters) do obs.obs_data_release(filter.settings);obs.obs_source_release(filter.source) end
  obs.obs_source_release(saved.source)
 end
end
local function apply_generic(settings)
 local function fail(message)
  obs.script_log(obs.LOG_WARNING,message)
  obs.obs_data_release(settings)
  return false
 end
 if cfg==nil then return fail('OBS script settings are unavailable.') end
 local content=obs.obs_data_get_obj(settings,'panelContent')
 local layout=obs.obs_data_get_obj(settings,'layout')
 local enabled=obs.obs_data_get_obj(settings,'panelEnabled')
 if content==nil or layout==nil then
  if content~=nil then obs.obs_data_release(content) end
  if layout~=nil then obs.obs_data_release(layout) end
  if enabled~=nil then obs.obs_data_release(enabled) end
  return fail('Export a fresh settings ZIP with all seven panel contents and positions.')
 end
 local panels,used={},{}
 local error_message=nil
 for index,key in ipairs(panel_keys) do
  local part=obs.obs_data_get_obj(content,key)
  local position=obs.obs_data_get_obj(layout,key)
  if part==nil or position==nil then
   if part~=nil then obs.obs_data_release(part) end
   if position~=nil then obs.obs_data_release(position) end
   error_message='Missing panel '..index..' settings.';break
  end
  local kind=obs.obs_data_get_string(part,'type')
  local url=obs.obs_data_get_string(part,'url')
  local active=enabled==nil or not obs.obs_data_has_user_value(enabled,key) or obs.obs_data_get_bool(enabled,key)
  local x=obs.obs_data_get_double(position,'x')
  local y=obs.obs_data_get_double(position,'y')
  local w=obs.obs_data_get_double(position,'width')
  local h=obs.obs_data_get_double(position,'height')
  obs.obs_data_release(part);obs.obs_data_release(position)
  if not ({none=true,source=true,web=true,media=true})[kind] then error_message='Invalid panel '..index..' content.';break end
  if x~=math.floor(x) or y~=math.floor(y) or w~=math.floor(w) or h~=math.floor(h) or x<0 or y<0 or w<=0 or h<=0 or x+w>1920 or y+h>1080 then error_message='Invalid panel '..index..' position.';break end
  local selected=kind=='source' and obs.obs_data_get_string(cfg,'panelSource_'..key) or ''
  if active and kind=='source' and selected~='' then
   if used[selected] then error_message='Select a different OBS source for each panel: '..used[selected]..' and '..index;break end
   used[selected]=index
   local chosen=obs.obs_get_source_by_name(selected)
   if chosen==nil or obs.obs_scene_from_source(chosen)~=nil or obs.obs_source_is_group(chosen) or template_owned(selected) or math.floor(obs.obs_source_get_output_flags(chosen)/obs.OBS_SOURCE_VIDEO)%2==0 then
    if chosen~=nil then obs.obs_source_release(chosen) end
    error_message='Select an existing non-template OBS source for panel '..index..'.';break
   end
   obs.obs_source_release(chosen)
  end
  if active and kind=='web' and url~='' and (not url:lower():match('^https?://[^/%s]+') or url:lower():match('^https?://[^/]*@')) then error_message='Panel '..index..' needs an HTTP(S) web address.';break end
  if active and kind=='media' and url~='' then
   local packaged=url:match('^assets/[%w%._/-]+$') and not url:find('..',1,true) and ({png=true,jpg=true,jpeg=true,webp=true,gif=true,mp4=true,webm=true})[url:lower():match('%.([%w]+)$')]
   local remote=url:lower():match('^https?://[^/%s]+') and not url:lower():match('^https?://[^/]*@')
   if not packaged and not remote then error_message='Panel '..index..' needs a packaged image/video path or HTTP(S) address.';break end
  end
  if active and ((kind=='source' and selected~='') or ((kind=='web' or kind=='media') and url~='')) then
   local mask=io.open(script_path()..'assets/'..key..'-alpha-mask.png','rb')
   if mask==nil then error_message='Export and extract a fresh settings ZIP for panel '..index..' mask.';break end
   mask:close()
  end
  panels[key]={index=index,kind=kind,url=url,active=active,source=selected,box={x,y,w,h}}
 end
 obs.obs_data_release(content);obs.obs_data_release(layout)
 if enabled~=nil then obs.obs_data_release(enabled) end
 if error_message~=nil then return fail(error_message) end
 for _,name in ipairs({'overlay.html','background.html','frame.html','wallpaper.html'}) do
  local file=io.open(script_path()..name,'r')
  if file==nil then return fail('Keep '..name..' beside obs-setup.lua.') end
  file:close()
 end
 local needs_media=false
 for _,key in ipairs(panel_keys) do
  local panel=panels[key]
  if panel.active and panel.kind=='media' and panel.url~='' then
   needs_media=true
   local entry=io.open(script_path()..'panel-media-'..key..'.html','r')
   if entry==nil then return fail('Keep panel-media-'..key..'.html beside obs-setup.lua.') end
   entry:close()
   if panel.url:match('^assets/') then
    local asset=io.open(script_path()..panel.url,'rb')
    if asset==nil then return fail('Packaged media is missing for panel '..panel.index..'.') end
    asset:close()
   end
  end
 end
 if needs_media then
  local renderer=io.open(script_path()..'panel-media.js','r') or io.open(script_path()..'internal/panel-media.js','r')
  if renderer==nil then return fail('Keep panel-media.js or internal/panel-media.js in the template folder.') end
  renderer:close()
 end
 local needs_canvas=false
 local probe_data=obs.obs_data_create()
 obs.obs_data_set_int(probe_data,'width',1920);obs.obs_data_set_int(probe_data,'height',1080)
 local browser_probe=obs.obs_source_create('browser_source','OST · Browser Probe',probe_data,nil)
 obs.obs_data_release(probe_data)
 if browser_probe==nil then return fail('OBS Browser Source is unavailable.') end
 obs.obs_source_release(browser_probe)
 for _,key in ipairs(panel_keys) do
  local panel=panels[key]
  if panel.active and ((panel.kind=='source' and panel.source~='') or ((panel.kind=='web' or panel.kind=='media') and panel.url~='')) then
   needs_canvas=true
   local filter_data=obs.obs_data_create()
   obs.obs_data_set_string(filter_data,'type','mask_alpha_filter.effect')
   obs.obs_data_set_string(filter_data,'image_path',script_path()..'assets/'..key..'-alpha-mask.png')
   local filter_probe=obs.obs_source_create('mask_filter','OST · Mask Probe',filter_data,nil)
   obs.obs_data_release(filter_data)
   if filter_probe==nil then return fail('OBS mask filter is unavailable for panel '..panel.index..'.') end
   obs.obs_source_release(filter_probe)
  end
 end
 if needs_canvas then
  local canvas_data=obs.obs_data_create()
  obs.obs_data_set_int(canvas_data,'width',1920);obs.obs_data_set_int(canvas_data,'height',1080)
  local canvas_probe=obs.obs_source_create('color_source_v3','OST · Canvas Probe',canvas_data,nil)
  obs.obs_data_release(canvas_data)
  if canvas_probe==nil then return fail('OBS color source is unavailable.') end
  obs.obs_source_release(canvas_probe)
 end
 local source=obs.obs_get_source_by_name(scene_name)
 local scene,created
 created=source==nil
 if created then scene=obs.obs_scene_create(scene_name);if scene~=nil then source=obs.obs_scene_get_source(scene) end
 else scene=obs.obs_scene_from_source(source) end
 if scene==nil or source==nil then
  if created then if scene~=nil then obs.obs_scene_release(scene) end
  elseif source~=nil then obs.obs_source_release(source) end
  return fail('Could not open the OBS Streaming Template scene.')
 end
 -- A name already used outside this scene may belong to the user. Never update it.
 local new_names={'OST · Panel Fill','OST · Background','OST · Overlay','OST · Panel Stroke'}
 local local_files={['OST · Panel Fill']='background.html',['OST · Background']='wallpaper.html',['OST · Overlay']='overlay.html',['OST · Panel Stroke']='frame.html'}
 local function local_file_matches(candidate,filename)
  if obs.obs_source_get_id(candidate)~='browser_source' then return false end
  local data=obs.obs_source_get_settings(candidate)
  local path=obs.obs_data_get_string(data,'local_file')
  local separator=path:sub(-#filename-1,-#filename-1)
  local matches=obs.obs_data_get_bool(data,'is_local_file') and path:sub(-#filename)==filename and (separator=='/' or separator=='\\')
  obs.obs_data_release(data)
  return matches
 end
 local function known_group(index)
  local group=obs.obs_scene_get_group(scene,'OST · Panel '..index..' Group')
  local nested=group~=nil and obs.obs_sceneitem_group_get_scene(group) or nil
  local canvas=nested~=nil and obs.obs_scene_find_source(nested,'OST · Clip Canvas') or nil
  local canvas_source=canvas~=nil and obs.obs_sceneitem_get_source(canvas) or nil
  return canvas_source~=nil and obs.obs_source_get_id(canvas_source)=='color_source_v3'
 end
 for _,key in ipairs(panel_keys) do
  local panel=panels[key]
  new_names[#new_names+1]='OST · Panel '..panel.index..' Group'
  if panel.active and ((panel.kind=='source' and panel.source~='') or ((panel.kind=='web' or panel.kind=='media') and panel.url~='')) then
   if panel.kind=='web' then new_names[#new_names+1]='OST · Panel '..panel.index..' Web' end
   if panel.kind=='media' then new_names[#new_names+1]='OST · Panel '..panel.index..' Media' end
  end
 end
 if needs_canvas then new_names[#new_names+1]='OST · Clip Canvas' end
 for _,name in ipairs(new_names) do
  local occupied=obs.obs_get_source_by_name(name)
  if occupied~=nil then
   local group_index=tonumber(name:match('^OST · Panel (%d+) Group$'))
   local web_index=tonumber(name:match('^OST · Panel (%d+) Web$'))
   local media_index=tonumber(name:match('^OST · Panel (%d+) Media$'))
   local expected_type
   if group_index then expected_type=obs.obs_source_is_group(occupied) and known_group(group_index)
   elseif name=='OST · Clip Canvas' then
    expected_type=obs.obs_source_get_id(occupied)=='color_source_v3'
    local in_existing_group=false
    for index=1,7 do if known_group(index) then in_existing_group=true;break end end
    expected_type=expected_type and in_existing_group
   elseif local_files[name] then
    expected_type=local_file_matches(occupied,local_files[name])
   elseif web_index then
    local group=obs.obs_scene_get_group(scene,'OST · Panel '..web_index..' Group')
    local nested=group~=nil and obs.obs_sceneitem_group_get_scene(group) or nil
    expected_type=obs.obs_source_get_id(occupied)=='browser_source' and known_group(web_index) and nested~=nil and obs.obs_scene_find_source(nested,name)~=nil
   elseif media_index then
    local key=panel_keys[media_index]
    local group=obs.obs_scene_get_group(scene,'OST · Panel '..media_index..' Group')
    local nested=group~=nil and obs.obs_sceneitem_group_get_scene(group) or nil
    expected_type=key~=nil and local_file_matches(occupied,'panel-media-'..key..'.html') and known_group(media_index) and nested~=nil and obs.obs_scene_find_source(nested,name)~=nil
   else expected_type=false end
   local placed=obs.obs_scene_find_source(scene,name) or obs.obs_scene_get_group(scene,name)
   if placed==nil then
    for index=1,7 do
     local group=obs.obs_scene_get_group(scene,'OST · Panel '..index..' Group')
     local nested=group~=nil and obs.obs_sceneitem_group_get_scene(group) or nil
     if nested~=nil then placed=obs.obs_scene_find_source(nested,name) end
     if placed~=nil then break end
    end
   end
   obs.obs_source_release(occupied)
   if placed==nil or not expected_type then
    if created then obs.obs_scene_release(scene) else obs.obs_source_release(source) end
    return fail('An OST source name is occupied by another source: '..name)
   end
  end
 end
 local existing_panels=obs.obs_scene_find_source(scene,'OST · Panel Stroke') or obs.obs_scene_find_source(scene,'OBS Template · Panel Stroke') or obs.obs_scene_find_source(scene,'OBS Template · Panels')
 local panels_visible=existing_panels==nil or obs.obs_sceneitem_visible(existing_panels)
 local existing_fill=obs.obs_scene_find_source(scene,'OST · Panel Fill') or obs.obs_scene_find_source(scene,'OBS Template · Panel Fill')
 local fill_visible=existing_fill==nil or obs.obs_sceneitem_visible(existing_fill)
 local existing_background=obs.obs_scene_find_source(scene,'OST · Background') or obs.obs_scene_find_source(scene,'OBS Template · Background')
 local background_visible=existing_background==nil or obs.obs_sceneitem_visible(existing_background)
 local previous_layout=snapshot_layout(scene)
 local result=true
 local unused_groups={}
 local retained_sources={}
 local pending_removals={}
 for _,key in ipairs(panel_keys) do
  local panel=panels[key]
  local name='OST · Panel '..panel.index
  local group=name..' Group'
  local selected=panel.kind=='source' and panel.source or panel.kind=='web' and panel.url~='' and name..' Web' or panel.kind=='media' and panel.url~='' and name..' Media' or ''
  local url=panel.kind=='web' and panel.url or panel.kind=='media' and script_path()..'panel-media-'..key..'.html' or nil
  if not panel.active then selected='' end
  if selected=='' then unused_groups[#unused_groups+1]=group
  else
   if not clip(scene,group,selected,script_path()..'assets/'..key..'-alpha-mask.png',panel.box,url,'OST · ',panel.kind=='media',retained_sources,pending_removals) then
    obs.script_log(obs.LOG_WARNING,'Could not mask panel '..panel.index..'. Check Browser Source and mask files.')
    result=false;break
   end
  end
 end
 if result then
  result=browser(scene,'OST · Panel Fill',script_path()..'background.html',true,0,0,1920,1080,nil,true)
   and browser(scene,'OST · Background',script_path()..'wallpaper.html',true,0,0,1920,1080,nil,true)
   and browser(scene,'OST · Overlay',script_path()..'overlay.html',true,0,0,1920,1080,browser_css)
   and browser(scene,'OST · Panel Stroke',script_path()..'frame.html',true,0,0,1920,1080)
  if not result then obs.script_log(obs.LOG_WARNING,'Could not create a required template browser source.') end
 end
 if result then
  -- Commit removals only once all panel and layer updates have succeeded.
  for _,item in ipairs(pending_removals) do obs.obs_sceneitem_remove(item) end
  -- Retain user sources that only existed inside an old panel group.
  local current_sources={}
  for _,panel in pairs(panels) do
   if panel.active and panel.kind=='source' and panel.source~='' then current_sources[panel.source]=true end
  end
  -- During swaps a hidden item keeps each source alive until all new groups exist.
  -- Remove only temporary items added by this application, never manual root items.
  for name,item in pairs(retained_sources) do
   if current_sources[name] then obs.obs_sceneitem_remove(item) end
  end
  for _,name in ipairs(unused_groups) do preserve_and_remove_old_group(scene,name,current_sources) end
  for index=1,7 do preserve_and_remove_old_group(scene,'OBS Template · Panel '..index..' Group',current_sources) end
  for _,name in ipairs({'OBS Template · Game Group','OBS Template · Camera Group'}) do preserve_and_remove_old_group(scene,name,current_sources) end
  for index=1,3 do preserve_and_remove_old_group(scene,'OBS Template · Custom '..index..' Group',current_sources) end
  for _,name in ipairs({'OBS Template · Panel Fill','OBS Template · Background','OBS Template · Overlay','OBS Template · Panel Stroke'}) do remove(scene,name) end
  -- Remove only known template items from older packages after replacement is ready.
  -- Shared OBS captures and manually added sources remain untouched.
  for _,name in ipairs({'OBS Template · Game Mask','OBS Template · Camera Mask','OBS Template · Game Clip','OBS Template · Camera Clip','OBS Template · Sponsor','OBS Template · Donation','OBS Template · Chat','OBS Template · Translation','OBS Template · CHZZK Alerts','OBS Template · Twitch Alerts','OBS Template · YouTube Alerts','OBS Template · SOOP Alerts','OBS Template · Discord Reactive'}) do remove(scene,name) end
  for index=1,3 do
   for _,suffix in ipairs({'',' Clip'}) do remove(scene,'OBS Template · Custom '..index..suffix) end
  end
  remove(scene,'OBS Template · Panels')
  obs.obs_sceneitem_set_visible(obs.obs_scene_find_source(scene,'OST · Panel Stroke'),panels_visible)
  obs.obs_sceneitem_set_visible(obs.obs_scene_find_source(scene,'OST · Panel Fill'),fill_visible)
  obs.obs_sceneitem_set_visible(obs.obs_scene_find_source(scene,'OST · Background'),background_visible)
  panel_backdrop(background_visible,'OST · ')
  connect_panel_signal()
  obs.obs_frontend_set_current_scene(source)
  obs.script_log(obs.LOG_INFO,'OBS Streaming Template applied: seven independent panels. No links are logged.')
 else
  restore_layout(previous_layout)
  obs.script_log(obs.LOG_WARNING,'Apply failed; the previous scene layout was restored.')
 end
 release_layout(previous_layout)
 if created then obs.obs_scene_release(scene) else obs.obs_source_release(source) end
 obs.obs_data_release(settings)
 return result
end
local function apply(props,property)
 local file=io.open(script_path()..'obs-settings.json','r')
 if file==nil then obs.script_log(obs.LOG_WARNING,'Save the OBS settings ZIP in preview.html and extract it into the overlay folder first.');return false end
 local json=file:read('*a');file:close()
 local settings=obs.obs_data_create_from_json(json)
 if settings==nil then obs.script_log(obs.LOG_WARNING,'Invalid obs-settings.json. Export settings again.');return false end
 if obs.obs_data_get_int(settings,'layoutVersion')==4 then return apply_generic(settings) end
 -- Copy visibility before checking live dependencies. Release the OBS data
 -- reference here so every later validation return has only settings to release.
 local panel_flags={}
 local panel_settings=obs.obs_data_get_obj(settings,'panelEnabled')
 for key in pairs(boxes) do
  panel_flags[key]=panel_settings==nil or not obs.obs_data_has_user_value(panel_settings,key) or obs.obs_data_get_bool(panel_settings,key)
 end
 if panel_settings~=nil then obs.obs_data_release(panel_settings) end
 local function panel_enabled(key)
  return key~=nil and panel_flags[key]~=false
 end
 local mode=obs.obs_data_get_string(settings,'cameraMode')
 if mode=='' then mode=obs.obs_data_get_bool(settings,'handcam') and 'camera' or 'none' end
 if mode~='camera' and mode~='reactive' and mode~='none' then obs.script_log(obs.LOG_WARNING,'Invalid camera mode.');obs.obs_data_release(settings);return false end
 local layout_version=obs.obs_data_get_int(settings,'layoutVersion')
 local slots={custom1='sponsor',custom2='alerts',custom3='none'}
 local saved_slots=obs.obs_data_get_obj(settings,'slotContent')
 if saved_slots~=nil and (layout_version==2 or layout_version==3) then
  local used={}
  for _,slot in ipairs({'custom1','custom2','custom3'}) do
   local role=obs.obs_data_get_string(saved_slots,slot)
   if not ({sponsor=true,alerts=true,image=true,video=true,browser=true,source=true,none=true})[role] or ((role=='sponsor' or role=='alerts') and used[role]) then
    obs.script_log(obs.LOG_WARNING,'Invalid small region content.');obs.obs_data_release(saved_slots);obs.obs_data_release(settings);return false
   end
   used[role]=true;slots[slot]=role
  end
 end
 if saved_slots~=nil then obs.obs_data_release(saved_slots) end
 local role_slot={}
 for slot,role in pairs(slots) do if role~='none' then role_slot[role]=slot end end
 local function area_enabled(area)
  local slot=area[3]
  if slot=='alerts' then slot=role_slot.alerts elseif slot=='hand' then slot=mode=='reactive' and 'hand' or nil end
  return panel_enabled(slot) and (area[4]=='reactive' or obs.obs_data_get_bool(settings,area[4])),slot
 end
 local positions={}
 local layout=obs.obs_data_get_obj(settings,'layout')
 for key,box in pairs(boxes) do
  local x,y,w,h=box[1],box[2],box[3],box[4]
  local position=layout~=nil and (layout_version==2 or layout_version==3) and obs.obs_data_get_obj(layout,key) or nil
  if layout_version==3 and position==nil then
   obs.script_log(obs.LOG_WARNING,'Missing auto layout region: '..key)
   if layout~=nil then obs.obs_data_release(layout) end
   obs.obs_data_release(settings);return false
  end
  if position~=nil then
   x=obs.obs_data_get_double(position,'x');y=obs.obs_data_get_double(position,'y')
   local valid=obs.obs_data_has_user_value(position,'x') and obs.obs_data_has_user_value(position,'y')
   if layout_version==3 then
    w=obs.obs_data_get_double(position,'width');h=obs.obs_data_get_double(position,'height')
    valid=valid and obs.obs_data_has_user_value(position,'width') and obs.obs_data_has_user_value(position,'height')
   end
   obs.obs_data_release(position)
   if not valid or x~=math.floor(x) or y~=math.floor(y) or w~=math.floor(w) or h~=math.floor(h) or x<0 or y<0 or w<=0 or h<=0 or x+w>1920 or y+h>1080 then
    obs.script_log(obs.LOG_WARNING,'Invalid region position: '..key);obs.obs_data_release(layout);obs.obs_data_release(settings);return false
   end
  end
  positions[key]={x,y,w,h}
 end
 if layout~=nil then obs.obs_data_release(layout) end
 for _,a in ipairs(areas) do
  local url=obs.obs_data_get_string(settings,a[1])
  if area_enabled(a) and url~='' and (not url:lower():match('^https?://[^/%s]+') or url:lower():match('^https?://[^/]*@')) then
   obs.script_log(obs.LOG_WARNING,'HTTP(S) widget URL required: '..a[1]);obs.obs_data_release(settings);return false
  end
 end
 local custom_urls={}
 local media=obs.obs_data_get_obj(settings,'customSlotMedia')
 for _,slot in ipairs({'custom1','custom2','custom3'}) do
  if panel_enabled(slot) and slots[slot]=='browser' then
   local item=media~=nil and obs.obs_data_get_obj(media,slot) or nil
   local url=item~=nil and obs.obs_data_get_string(item,'url') or ''
   if item~=nil then obs.obs_data_release(item) end
   if not url:lower():match('^https?://[^/%s]+') or url:lower():match('^https?://[^/]*@') then
    obs.script_log(obs.LOG_WARNING,'HTTP(S) browser URL required: '..slot)
    if media~=nil then obs.obs_data_release(media) end
    obs.obs_data_release(settings);return false
   end
   custom_urls[slot]=url
  end
 end
 if media~=nil then obs.obs_data_release(media) end
 if panel_enabled('hand') and mode=='reactive' and obs.obs_data_get_string(settings,'reactiveUrl')=='' then obs.script_log(obs.LOG_WARNING,'Discord Reactive OBS URL required.');obs.obs_data_release(settings);return false end
 local html=io.open(script_path()..'overlay.html','r')
 if html==nil then obs.script_log(obs.LOG_WARNING,'Keep the script and overlay.html in the same folder.');obs.obs_data_release(settings);return false end
 html:close()
 local background=io.open(script_path()..'background.html','r')
 if background==nil then obs.script_log(obs.LOG_WARNING,'Keep background.html in the overlay folder.');obs.obs_data_release(settings);return false end
 background:close()
 local frame=io.open(script_path()..'frame.html','r')
 if frame==nil then obs.script_log(obs.LOG_WARNING,'Keep frame.html in the overlay folder.');obs.obs_data_release(settings);return false end
 frame:close()
 local wallpaper=io.open(script_path()..'wallpaper.html','r')
 if wallpaper==nil then obs.script_log(obs.LOG_WARNING,'Keep wallpaper.html in the overlay folder.');obs.obs_data_release(settings);return false end
 wallpaper:close()
 local game=panel_enabled('game') and obs.obs_data_get_string(cfg,'game') or ''
 local camera=panel_enabled('hand') and mode=='camera' and obs.obs_data_get_string(cfg,'hand') or ''
 if game~='' and game==camera and mode=='camera' then
  obs.script_log(obs.LOG_WARNING,'Select separate game and camera sources.');obs.obs_data_release(settings);return false
 end
 for _,slot in ipairs({'custom1','custom2','custom3'}) do
  if panel_enabled(slot) and slots[slot]=='source' then
   local name=obs.obs_data_get_string(cfg,slot..'Source')
   if name~='' then
    local item=obs.obs_get_source_by_name(name)
    if item==nil or obs.obs_scene_from_source(item)~=nil or template_owned(name) then
     if item~=nil then obs.obs_source_release(item) end
     obs.script_log(obs.LOG_WARNING,'Select an existing non-template OBS source for '..slot)
     obs.obs_data_release(settings);return false
    end
    obs.obs_source_release(item)
   end
  end
 end
 local masked={{'game',game},{'camera',mode=='camera' and camera or ''}}
 for _,slot in ipairs({'custom1','custom2','custom3'}) do
  local selected=panel_enabled(slot) and (slots[slot]=='browser' and 'browser' or slots[slot]=='source' and obs.obs_data_get_string(cfg,slot..'Source') or '') or ''
  masked[#masked+1]={slot,selected}
 end
 for _,entry in ipairs(masked) do
  if entry[2]~='' then
   if entry[1]=='game' or entry[1]=='camera' then
    local selected=obs.obs_get_source_by_name(entry[2])
    if selected==nil or obs.obs_scene_from_source(selected)~=nil then
     if selected~=nil then obs.obs_source_release(selected) end
     obs.script_log(obs.LOG_WARNING,'Select an existing '..entry[1]..' source.');obs.obs_data_release(settings);return false
    end
    obs.obs_source_release(selected)
   end
   local mask=io.open(script_path()..'assets/'..entry[1]..'-alpha-mask.png','rb')
   if mask==nil then obs.script_log(obs.LOG_WARNING,'Export and extract a fresh settings ZIP to create the rounded '..entry[1]..' mask.');obs.obs_data_release(settings);return false end
   mask:close()
  end
 end
 local source=obs.obs_get_source_by_name(scene_name)
 local scene,created
 created=source==nil
 if created then scene=obs.obs_scene_create(scene_name);source=obs.obs_scene_get_source(scene)
 else scene=obs.obs_scene_from_source(source) end
 if scene==nil then obs.obs_source_release(source);obs.obs_data_release(settings);return false end
 local existing_panels=obs.obs_scene_find_source(scene,'OBS Template · Panel Stroke') or obs.obs_scene_find_source(scene,'OBS Template · Panels')
 local panels_visible=existing_panels==nil or obs.obs_sceneitem_visible(existing_panels)
 local existing_fill=obs.obs_scene_find_source(scene,'OBS Template · Panel Fill')
 local fill_visible=existing_fill==nil or obs.obs_sceneitem_visible(existing_fill)
 local existing_background=obs.obs_scene_find_source(scene,'OBS Template · Background')
 local background_visible=existing_background==nil or obs.obs_sceneitem_visible(existing_background)
 local css='body { background: transparent; margin: 0; overflow: hidden; }'
 local feeds={chatUrl='#chat-feed',translationUrl='#subtitles'}
 for key,selector in pairs(feeds) do
  if obs.obs_data_get_string(settings,key)~='' then css=css..selector..'{display:none!important;}' end
 end
 local has_alerts=false
 for _,a in ipairs(areas) do
  if a[4]=='showAlerts' and obs.obs_data_get_string(settings,a[1])~='' then has_alerts=true end
 end
 if has_alerts then css=css..'#alert-default,#alert-active{display:none!important;}' end
 -- Remove the old owned demo, never unrelated sources.
 local items=obs.obs_scene_enum_items(scene)
 if items~=nil then
  for _,item in ipairs(items) do
   local s=obs.obs_sceneitem_get_source(item)
   local data=obs.obs_source_get_settings(s)
   if obs.obs_data_get_string(data,'local_file')==script_path()..'demo.html' then obs.obs_sceneitem_remove(item) end
   obs.obs_data_release(data)
  end
  obs.sceneitem_list_release(items)
 end
 -- Replace old script sources in this scene when migrating.
 for _,name in ipairs({'OBS Template · Donation','OBS Template · Sponsor'}) do remove(scene,name) end
 -- The alpha mask is applied to template-owned groups, not shared capture sources.
 remove(scene,'OBS Template · Game Mask');remove(scene,'OBS Template · Camera Mask')
 remove(scene,'OBS Template · Game Clip')
 if panel_enabled('game') then
  if not clip(scene,'OBS Template · Game Group',game,script_path()..'assets/game-alpha-mask.png',positions.game) then obs.script_log(obs.LOG_WARNING,'Game mask filter unavailable.');obs.obs_data_release(settings);return false end
 else remove(scene,'OBS Template · Game Group') end
 remove(scene,'OBS Template · Camera Clip')
 if panel_enabled('hand') and mode=='camera' and camera~='' then
  if not clip(scene,'OBS Template · Camera Group',camera,script_path()..'assets/camera-alpha-mask.png',positions.hand) then obs.script_log(obs.LOG_WARNING,'Camera mask filter unavailable.');obs.obs_data_release(settings);return false end
 else remove(scene,'OBS Template · Camera Group') end
 -- Never remove a user source merely because it has the name selected for capture.
 -- A manually placed item in this scene may share that name.
 for _,a in ipairs(areas) do
  local url=obs.obs_data_get_string(settings,a[1])
  local enabled,slot=area_enabled(a)
  local box=slot and positions[slot] or nil
  if url~='' and enabled then browser(scene,a[2],url,false,box[1],box[2],box[3],box[4]) else remove(scene,a[2]) end
 end
 for i,slot in ipairs({'custom1','custom2','custom3'}) do
  local browser_name='OBS Template · Custom '..i
  local clip_name=browser_name..' Group'
  remove(scene,browser_name..' Clip')
  local mask=script_path()..'assets/'..slot..'-alpha-mask.png'
  local box=positions[slot]
  remove(scene,browser_name)
  if not panel_enabled(slot) then remove(scene,clip_name)
  elseif slots[slot]=='browser' then
   if not clip(scene,clip_name,browser_name,mask,box,custom_urls[slot]) then obs.script_log(obs.LOG_WARNING,'Custom browser mask unavailable: '..slot);obs.obs_data_release(settings);return false end
  elseif slots[slot]=='source' then
   local name=obs.obs_data_get_string(cfg,slot..'Source')
   if not clip(scene,clip_name,name,mask,box) then obs.script_log(obs.LOG_WARNING,'Custom source mask unavailable: '..slot);obs.obs_data_release(settings);return false end
  else remove(scene,clip_name) end
  obs.obs_data_set_string(cfg,'placed_'..slot,'')
 end
 browser(scene,'OBS Template · Panel Fill',script_path()..'background.html',true,0,0,1920,1080,nil,true)
 browser(scene,'OBS Template · Background',script_path()..'wallpaper.html',true,0,0,1920,1080,nil,true)
 browser(scene,'OBS Template · Overlay',script_path()..'overlay.html',true,0,0,1920,1080,css)
 remove(scene,'OBS Template · Panels')
 browser(scene,'OBS Template · Panel Stroke',script_path()..'frame.html',true,0,0,1920,1080)
 obs.obs_sceneitem_set_visible(obs.obs_scene_find_source(scene,'OBS Template · Panel Stroke'),panels_visible)
 obs.obs_sceneitem_set_visible(obs.obs_scene_find_source(scene,'OBS Template · Panel Fill'),fill_visible)
 obs.obs_sceneitem_set_visible(obs.obs_scene_find_source(scene,'OBS Template · Background'),background_visible)
 panel_backdrop(background_visible)
 connect_panel_signal()
 obs.obs_frontend_set_current_scene(source)
 if created then obs.obs_scene_release(scene) else obs.obs_source_release(source) end
 obs.obs_data_release(settings)
 obs.script_log(obs.LOG_INFO,'OBS Streaming Template applied. Base canvas must be 1920 x 1080. No links are logged.')
 return true
end
function script_properties()
 local p=obs.obs_properties_create()
 local en=cfg==nil or obs.obs_data_get_bool(cfg,'english')
 obs.obs_properties_add_bool(p,'english','English UI (reload after changing)')
 local file=io.open(script_path()..'obs-settings.json','r')
 local generic=false
 if file~=nil then
  local saved=obs.obs_data_create_from_json(file:read('*a'))
  file:close()
  if saved~=nil then generic=obs.obs_data_get_int(saved,'layoutVersion')==4;obs.obs_data_release(saved) end
 end
 local labels={game=en and 'Existing game source' or '기존 게임 소스',hand=en and 'Existing camera source' or '기존 캠 소스',custom1Source=en and 'Custom 1 OBS source' or '커스텀 1 OBS 소스',custom2Source=en and 'Custom 2 OBS source' or '커스텀 2 OBS 소스',custom3Source=en and 'Custom 3 OBS source' or '커스텀 3 OBS 소스'}
 local keys=generic and panel_keys or {'game','hand','custom1Source','custom2Source','custom3Source'}
 for index,raw_key in ipairs(keys) do
  local key=generic and 'panelSource_'..raw_key or raw_key
  local label=generic and ((en and 'Panel ' or '패널 ')..index..(en and ' OBS source' or ' OBS 소스')) or labels[key]
  local list=obs.obs_properties_add_list(p,key,label,obs.OBS_COMBO_TYPE_LIST,obs.OBS_COMBO_FORMAT_STRING)
  obs.obs_property_list_add_string(list,en and 'None' or '사용 안 함','')
  local sources=obs.obs_enum_sources()
  if sources~=nil then
   for _,s in ipairs(sources) do
    if obs.obs_scene_from_source(s)==nil and not obs.obs_source_is_group(s) and math.floor(obs.obs_source_get_output_flags(s)/obs.OBS_SOURCE_VIDEO)%2==1 then local name=obs.obs_source_get_name(s);if not template_owned(name) then obs.obs_property_list_add_string(list,name,name) end end
   end
   obs.source_list_release(sources)
  end
 end
 obs.obs_properties_add_button(p,'apply',en and 'Apply saved settings / Auto layout' or '저장한 설정 / 자동 배치 적용',apply)
 return p
end
