# ALO4OBS

Auto Layout Overlay for OBS: an open-source overlay that places panels so stream content never overlaps.

Latest release: 0.10.5.

## Use in your browser

Open https://kmg200164.github.io/alo4obs/. Nothing needs to be downloaded or extracted first. Choose a layout, configure your panels, and click Save as ZIP. You download only your personal `Settings-Bento.zip` or `Settings-Overlap.zip`, which contains the OBS script. Then continue from step 3 of [Install](#install).

Your settings and uploaded files stay in your browser on this site.

## What's new in 0.10.5

- The guide and README now follow the browser flow: open the site, configure, save the personal ZIP, add the script in OBS. The old "download, extract, open `settings.html`" steps are now the optional offline route.
- New quick-start picture for the browser flow.
- When Overlap is chosen, the settings page asks once whether the Composite Blur plugin is installed and offers an installer ZIP for your OS. The plugin is also in the distribution ZIP and the official releases.

The full list of changes is in [CHANGELOG.md](CHANGELOG.md).

## Offline use and the blur plugin

The Composite Blur plugin that Overlap live blur needs is not part of your Settings ZIP; the settings page offers an installer on request. Bento and blur 0 work without it. The distribution ZIP `ALO4OBS-v0.10.5.zip` bundles the plugin and install helpers, and also runs the editor offline:

https://github.com/kmg200164/alo4obs/releases/latest

For the bundled plugin, see [docs/PLUGIN-SUPPORT.md](docs/PLUGIN-SUPPORT.md). Official plugin releases: https://github.com/FiniteSingularity/obs-composite-blur/releases

## Requirements

- OBS Studio 30.1 or newer, with Browser Source and Tools → Scripts.
- A 1920 × 1080 base canvas (Settings → Video). If your production profile uses another size, use a separate profile; do not overwrite it arbitrarily.
- macOS is unverified for this version.

## Install

1. Open https://kmg200164.github.io/alo4obs/ (or, offline: extract the entire distribution ZIP and open its root `settings.html`; it opens `files/settings.html`. Do not open pages inside the ZIP).
2. Choose Bento (4 columns) or Overlap (5 columns), then configure panels and content.
3. Click Save as ZIP. The personal package is `Settings-Bento.zip` or `Settings-Overlap.zip`.
4. Extract that entire personal ZIP into a permanent folder. Keep `script-bento.lua` or `script-overlap.lua` with its `files/` folder; moving only the Lua file breaks relative paths.
5. In OBS, Tools → Scripts → +, add that script, select a distinct original source for each panel you want to show, then click Apply saved settings / Auto layout.
6. Open the `ALO4OBS · BENTO` or `ALO4OBS · OVERLAP` scene and check capture, camera, widgets and media in OBS. The browser preview cannot show your real OBS content.

The guide is in the page header (한국어, English, 日本語). The distribution ZIP also includes `README.txt` and the guide pages `guide.html`, `guide-en.html` and `guide-ja.html`.

## Updating

Export your OBS scene collection, back up the entire old application folder, and record script source selections. Keep old packages intact and use a new distribution folder.

The editor reads `config.js`, not JSON imports. After Apply in the old script, copy the generated `config.js` (from `files/bento/` or `files/overlap/` in type-specific packages) into the new distribution `files/` folder, plus only personal media from the matching runtime folder referenced by `assets/...` paths, preserving those paths. Keep the new `config.public.js`, internal scripts and fonts. If `config.js` is missing, Apply once in the old version to generate it, or reconfigure manually while keeping the old environment. Do not rename JSON to simulate an import.

Check the new settings page, export a new `Settings-Bento.zip` / `Settings-Overlap.zip`, and extract to a new permanent folder. Remove only the old Lua registration after recording selections. Earlier packages named this script `OBS-script.lua`; new packages use `script-bento.lua` or `script-overlap.lua`, so do not keep the old-name registration in the Scripts list. Add the new Lua path, reselect original sources before Apply, and verify in OBS.

For legacy OBS Streaming Template (OST), keep the old template, `OST ·` groups, original sources and the complete old script folder. Stop or remove only the old script registration. Configure new panels with the same originals; Apply builds a separate `ALO4OBS · BENTO` or `ALO4OBS · OVERLAP` scene. There is no automatic OST migration.

A full rollback needs the pre-update scene-collection backup and the complete old application folder. Import the backup into a separate recovery collection; do not overwrite the current collection.

## License

MIT License. See [LICENSE](LICENSE). Copyright (c) 2026 KMG.

## Credits

kmg200164
