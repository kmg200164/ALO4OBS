# ALO4OBS

Auto Layout Overlay for OBS

**[Download ALO4OBS 0.9.1](https://github.com/kmg200164/ALO4OBS/raw/refs/heads/main/downloads/ALO4OBS-v0.9.1.zip)**

**0.9.1** is the current distribution: `ALO4OBS-v0.9.1.zip`. The original 0.9.0 archive remains available unchanged. See [CHANGELOG.md](CHANGELOG.md).

An OBS overlay that auto-arranges your panels so they never overlap.

## Support and feedback

Found it useful? [Support continued improvements](https://buymeacoffee.com/kmg200164). Found a bug? [Report it here](https://github.com/kmg200164/ALO4OBS/issues/new?template=feedback.yml).

<p align="center">
  <a href="https://buymeacoffee.com/kmg200164">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy me a coffee — support KMG" width="360">
  </a>
</p>

<details>
<summary>Support and bug-report guidance</summary>

ALO4OBS is free, and support is entirely optional. For bug reports, include what you tried, what happened, your ALO4OBS and OBS versions, and a screenshot if possible. Hide personal widget links and stream keys before sharing screenshots.

</details>

## Features

- Automatically calculates a 1920 × 1080 layout for Main, Sub, and Side panels.
- Supports OBS sources, web URLs, and packaged image or video media.
- Exports a portable `OBS-settings.zip` with settings, masks, and selected media.
- Includes Korean, English, and Japanese settings and guides.
- Offers ten approved UI color presets in dark and light modes: Cherry, Orange, Banana, Lime, Aloe, Cotton Candy, Blueberry, Grape, Bubblegum, and Mono. UI themes do not change broadcast colors or media.
- Settings sections expand from the whole heading; selection arrows sit inside their fields.
- Free MIT-licensed code with no required account or subscription.

## Quick start

![Setup: download, extract, open settings.html, configure panels, unpack saved settings, add the OBS script.](docs/images/setup-workflow.png)

1. Install **OBS Studio 30.1 or newer** with Browser Source and **Tools → Scripts** available. The script uses the `obs_sceneitem_get_info2` / `obs_sceneitem_set_info2` APIs introduced in 30.1 ([official OBS API reference](https://docs.obsproject.com/reference-scenes#c.obs_sceneitem_get_info2)). Isolated Windows OBS 32.2.2 checks passed in the scope below; the minimum API version is not a claim that every supported version was tested.
2. Use a **1920 × 1080 base canvas** in **Settings → Video**. If your production profile uses another canvas, create or choose a separate profile for this setup; do not overwrite your production profile arbitrarily.
3. Extract the **entire distribution ZIP**. Open its root `settings.html`, which opens `files/settings.html`. Do not run pages inside the ZIP.
4. Select a **Main, Sub, or Side** panel and its **Content type**: **None**, **OBS source**, **Web URL**, or **Image/video**. Main stays enabled; Sub and Side counts decide how many slots appear.
5. For **OBS source**, create the original capture or camera source in OBS first and confirm that it works. Scenes and groups cannot be selected. For web content use the provider's OBS display URL; for media upload the file or enter its direct media URL.
6. Set panel counts, Main/Sub row order, Side position, sizes, spacing, fill and stroke. Review the layout preview; it cannot show your real OBS capture or prove a live widget connection.
7. Click **Save as ZIP** (Korean: **ZIP 파일로 저장**). The result is your personal **`OBS-settings.zip`**, not the distribution archive.
8. Extract the **whole personal ZIP** into a new permanent folder. Keep `OBS-script.lua`, `obs-settings.json`/configuration, masks, assets and runtime files together. Do not move just the Lua file: it resolves files relative to its own folder.
9. Open **Tools → Scripts → +** in OBS and select that folder's **`OBS-script.lua`**. If needed, enable **English UI (reload after changing)** and reload the script.
10. For each panel with **OBS source** content, choose its original OBS source in the matching script selector. Use distinct sources for different panels you want to show; a blank selector can intentionally leave a panel empty. Click **Apply saved settings / Auto layout** (Korean: **저장한 설정 / 자동 배치 적용**).
11. Open the generated **ALO4OBS** scene and check the actual capture, camera, web widgets and media in OBS before using it. The settings-page preview is a layout preview, not the OBS output.

Browser edits do not automatically update OBS. Save a new ZIP, extract the whole archive, register the new script path or update the existing application folder and reload its script, check the source selections, then apply again. Applying template settings intentionally restores the saved template layout; it does not start broadcasting or configure capture devices.

## Update an existing installation

Before updating, export your **OBS scene collection**, back up the entire old application folder, and record every panel's script source selection. Keep the old distribution and personal package intact. Work in a separate new distribution folder.

### Carry settings from an ALO4OBS installation

1. The settings editor reads **`config.js`**, not an imported `config.json` or `obs-settings.json`. After a successful old-script Apply, the old personal package has a generated `config.js`. Copy that file into the new distribution's **`files/`** folder. Copy only the personal media referenced by its `assets/...` paths, preserving those relative paths. Keep the new `config.public.js`, internal scripts and fonts.
2. If `config.js` is absent, return to the old version and click **Apply saved settings / Auto layout** once to generate it, or manually configure the new version while retaining the old environment. Renaming a JSON file is not an import procedure. Browser drafts may survive at the same path, but a new folder does not guarantee draft recovery.
3. Open the new root `settings.html`, check the restored values and media, and export a new `OBS-settings.zip`. Extract it into a **new permanent folder**.
4. After recording the source mapping, remove **only the old Lua registration** from Tools → Scripts. This does not delete its scenes. Add the new folder's Lua file and **reselect the original sources before Apply**; a new script entry does not inherit the old entry's selector values from the exported JSON.
5. Apply and check the **ALO4OBS** scene in OBS. The current apply path reuses that scene and `ALO ·` sources/groups and reapplies the template layout; it is designed to preserve original source settings/filters while intentionally resetting template scene-item transforms. Other scenes are not edited directly, but generated `ALO ·` sources/groups reused in them share content updates. Original sources from disabled groups remain as hidden root items. A reserved-name collision aborts Apply; inspect the reported item rather than blindly deleting sources. The isolated Windows OBS 32.2.2 migration/preservation checks below passed. Recovery after a real failure remains unverified; automated state checks are separate evidence.

### Move from legacy OBS Streaming Template / OST

Keep the old **OBS Streaming Template** scene, its **`OST ·`** groups, original sources and script folder. Record its source selections and back up the scene collection. Stop/remove the old script registration, preserving the Lua file and folder. Configure the new version using the same original sources, add the new Lua path, reselect sources, and apply. The new **ALO4OBS** scene is built separately. Check it before switching to it; the old scene remains available for rollback. There is no automatic OST scene migration. Do not blanket-delete old sources or groups.

For an **ALO4OBS update rollback**, import the pre-update scene-collection backup into a **separate recovery collection**; do not overwrite the current collection. Restore the **matching old Lua script and complete old application folder**, then check the original source mappings. Applying the update reuses the ALO4OBS scene and changes generated browser-source `local_file` paths to the new folder, so selecting that same scene and registering the old Lua alone does not restore the old setup. Returning directly to a preserved old scene applies only to **parallel legacy OST migration**, where the OST scene remains separate. Without the previous scene-collection and complete application-folder backups, full recovery cannot be guaranteed. Recovery after a real failure remains unverified. A running script's rollback snapshot is only for that same script/version; it is not a cross-version migration backup.

## FAQ

<details>
<summary>What do Main, Sub, and Side mean?</summary>

Main is the large panel. Sub panels run left to right below or above it. Side panels run top to bottom, on the right by default or on the left when selected. These English role names stay the same in every language.

</details>

<details>
<summary>Do uploaded files stay after reopening?</summary>

They can stay in the same browser and page origin. Clearing browser data, changing browsers, moving the file, or direct-file browser restrictions can remove access. Save `OBS-settings.zip` for a portable copy.

</details>

<details>
<summary>Can I use any web page or media URL?</summary>

Use a provider's HTTP(S) widget or display URL. Management pages and watch pages do not automatically become widgets or playable media. Use only assets you have permission to share.

</details>

<details>
<summary>What is not verified everywhere?</summary>

Windows OBS 32.2.2 was checked in an isolated portable copy with a QA profile and scene collection: a 0.9.0 personal ZIP was applied, its generated config.js and referenced uploaded PNG were transferred into the 0.9.1 distribution, and a new personal ZIP was applied. The checks confirmed original color-source settings and a user color filter, another scene’s item position, legacy OST scene/groups, ALO4OBS scene reuse, Main source reconnection, no duplicate items on reapply, and the media source’s new local_file path. The uploaded PNG rendered as an orange region in the actual OBS view. Chrome HTTP checks also confirmed save/reopen and all ten settings groups. These checks do not verify personal web widgets, physical cameras, real captures, broadcasting, macOS, the file:// settings editor, OS file pickers, or recovery after a real failure. Browser storage quota behavior was not exhaustively tested.

</details>

## Privacy and license

Keep personal `config.js`, `obs-settings.json`, and `OBS-settings.zip` private: they may contain widget tokens. Browser drafts do not update OBS; exports do.

Code: [MIT](LICENSE), copyright 2026 KMG. Inter and Lucide assets retain their own terms; see [third-party notices](template/assets/THIRD-PARTY-NOTICES.md).

KMG directs the product, design, requirements, and real-use evaluation. Code was implemented with [OpenAI Codex](https://openai.com/codex/) through vibe coding.

[Change log](CHANGELOG.md) · [QA evidence](docs/QA.md)

Before sharing screenshots, hide personal widget links and stream keys.

## Documentation language

ALO4OBS project documentation must be written in English. This includes README files, changelogs, QA records, work reports, development guidance and concept-explanation comments. English is the canonical documentation language. Explicitly localized product UI and Korean/Japanese user guides remain translated and must stay consistent with the English guide.
