ALO4OBS
Auto Layout Overlay for OBS — 0.9.1

ALO4OBS-v0.9.1.zip is the distribution archive. OBS-settings.zip is your personal saved application package.

1. Use OBS Studio 30.1 or newer with Browser Source and Tools > Scripts. The script needs obs_sceneitem_get_info2 / obs_sceneitem_set_info2 (30.1 APIs); isolated Windows OBS 32.2.2 migration checks passed in the scope below. macOS is unverified for this version.
2. Use a 1920 x 1080 base canvas (Settings > Video). Choose a separate profile if your production profile uses another size; do not overwrite it arbitrarily.
3. Extract the entire distribution. Open root settings.html (it opens files/settings.html), never a page inside the ZIP.
4. Select Main, Sub or Side and Content type: None, OBS source, Web URL or Image/video.
5. For OBS source, create and verify the original capture or camera in OBS first. Scenes/groups are not panel source choices. For web widgets use the OBS display URL; for media upload a file or enter its direct URL.
6. Set panel counts, layout, sizes, spacing and styles. Main is always enabled; Sub runs left to right and Side top to bottom. The Main/Sub rows and Side column can move. Main offers Auto, 16:9, 21:9 and 32:9. UI theme colors do not change broadcast colors.
7. Click Save as ZIP (Korean: ZIP 파일로 저장). Save your personal OBS-settings.zip.
8. Extract the entire personal ZIP to a permanent folder. Keep OBS-script.lua with configuration, masks, media/assets and runtime files. Moving only Lua breaks relative paths.
9. In OBS, Tools > Scripts > +, select that folder's OBS-script.lua. Enable English UI (reload after changing) and reload if needed.
10. Reselect a distinct original OBS source for each panel you want to show; a blank selector intentionally leaves it empty. Click Apply saved settings / Auto layout (Korean: 저장한 설정 / 자동 배치 적용).
11. Open the ALO4OBS scene and verify real capture, camera, widgets and media. The browser preview cannot show your real OBS content.

Browser edits do not update OBS automatically. Export again, extract the whole package, register the new path or update the application folder and reload, check source selections, and Apply again.

UPDATING
Export your OBS scene collection, back up the entire old application folder, and record script source selections. Keep old packages intact; use a new distribution folder.
The editor reads config.js, not JSON imports. After old-script Apply, copy its generated config.js into the new distribution files/ folder, plus only personal media referenced by assets/... paths, preserving those paths. Keep the new config.public.js, internal scripts and fonts. If config.js is missing, Apply once in the old version to generate it, or manually reconfigure while keeping the old environment. Do not rename JSON to simulate an import. Browser drafts at a new path are not guaranteed.
Check the new settings page, export a new OBS-settings.zip and extract to a new permanent folder. Remove only the old Lua registration after recording selections. Add the new Lua path, reselect original sources before Apply, and verify in OBS. A new registration does not import old selector mappings from JSON. Apply reuses ALO4OBS and ALO · items and intentionally restores template layout. Original source settings/filters are intended to remain, while template scene-item transforms are reset. Other scenes are not edited directly, but reused ALO · sources/groups share content updates. Disabled groups retain originals as hidden root items. Reserved-name collisions abort Apply; inspect conflicts instead of blindly deleting sources. The isolated Windows OBS 32.2.2 migration/preservation checks below passed; recovery after a real failure remains unverified.
For legacy OST, keep OBS Streaming Template, OST · groups, original sources and the complete old script folder. Stop/remove only the old script registration. Configure new panels with the same originals; apply builds a separate ALO4OBS scene. Verify before switching. No automatic OST migration or blanket source/group deletion.
For an ALO4OBS update rollback, import the pre-update scene-collection backup into a separate recovery collection without overwriting the current collection. Restore the matching old Lua script and entire old application folder, then verify original source mappings. The update reuses ALO4OBS and changes generated browser-source local_file paths; selecting the same scene and registering old Lua alone does not restore the previous setup. Switching directly to the preserved old scene applies only to parallel legacy OST migration, where the OST scene remains separate. Full recovery is not guaranteed without the previous scene-collection and full application-folder backups. Recovery after a real failure remains unverified. A live rollback snapshot works only with the same running script/version.

VERIFICATION
Windows OBS 32.2.2 was checked in an isolated portable copy with a QA profile and scene collection: a 0.9.0 personal ZIP was applied, its generated config.js and referenced uploaded PNG were transferred into the 0.9.1 distribution, and a new personal ZIP was applied. The checks confirmed original color-source settings and a user color filter, another scene’s item position, legacy OST scene/groups, ALO4OBS scene reuse, Main source reconnection, no duplicate items on reapply, and the media source’s new local_file path. The uploaded PNG rendered as an orange region in the actual OBS view. Chrome HTTP checks also confirmed save/reopen and all ten settings groups. These checks do not verify personal web widgets, physical cameras, real captures, broadcasting, macOS, the file:// settings editor, OS file pickers, or recovery after a real failure.

Open guide-en.html, guide.html (Korean) or guide-ja.html for the full guide. Keep personal widget links, config.js, obs-settings.json and exported settings ZIPs private.
