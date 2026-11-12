# ALO4OBS

Auto Layout Overlay for OBS: an open-source overlay that places panels so stream content never overlaps.

Latest release: 0.10.4.

## Use in your browser

Open https://kmg200164.github.io/alo4obs/ — no download or extraction needed. Configure your layout and click Save as ZIP; you download only your personal `Settings-Bento.zip` or `Settings-Overlap.zip`. Then continue from step 5 of [Install](#install).

The web page is the same editor as the distribution ZIP. It does not include the Composite Blur plugin: Overlap live blur needs that plugin, so install it from the distribution ZIP below or the official releases. Settings drafts and uploaded media stay in your browser on this site; they are not shared with folders where you opened an older ZIP copy.

## Download

The latest distribution is `ALO4OBS-v0.10.4.zip` from GitHub Releases:

https://github.com/kmg200164/alo4obs/releases/latest

## What's new in 0.10.4

- Windows, macOS and Linux install helpers now sit next to `settings.html` at the root of the distribution ZIP. Plugin packages stay under `files/`.
- Personal exports use `script-bento.lua` or `script-overlap.lua`.
- Bento panel blur uses the configured background image or color. Overlap blurs the live Main source, and keeps the static backdrop while capture is unavailable.
- Per-panel media fit and crop are saved in the editor and in the exported settings.
- Official Composite Blur 1.6.0 is bundled. Actual plugin installation is verified on Windows OBS 32 only; macOS and Linux installation remain unverified.

The full list of changes is in [CHANGELOG.md](CHANGELOG.md).

## Requirements

- OBS Studio 30.1 or newer, with Browser Source and Tools → Scripts.
- A 1920 × 1080 base canvas (Settings → Video). If your production profile uses another size, use a separate profile; do not overwrite it arbitrarily.
- macOS is unverified for this version.

## Install

1. Download the distribution ZIP and extract the entire archive.
2. Open the root `settings.html` (it opens `files/settings.html`). Do not open pages inside the ZIP.
3. Choose Bento (4 columns) or Overlap (5 columns), then configure panels and content.
4. Click Save as ZIP. The personal package is `Settings-Bento.zip` or `Settings-Overlap.zip`.
5. Extract that entire personal ZIP into a permanent folder. Keep `script-bento.lua` or `script-overlap.lua` with its `files/` folder; moving only the Lua file breaks relative paths.
6. In OBS, Tools → Scripts → +, add that script, select a distinct original source for each panel you want to show, then click Apply saved settings / Auto layout.
7. Open the `ALO4OBS · BENTO` or `ALO4OBS · OVERLAP` scene and check capture, camera, widgets and media in OBS. The browser preview cannot show your real OBS content.

The distribution ZIP also includes `README.txt` and the full guide: `guide.html` (한국어), `guide-en.html` (English), `guide-ja.html` (日本語).

For the bundled Composite Blur plugin, see [docs/PLUGIN-SUPPORT.md](docs/PLUGIN-SUPPORT.md). Official plugin releases: https://github.com/FiniteSingularity/obs-composite-blur/releases

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
