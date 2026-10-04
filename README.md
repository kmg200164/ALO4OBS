# OBS Streaming Template

Version: **0.4.2 — development prerelease**

A local OBS template that arranges seven independent panels in a bento grid. Cameras, chat, captions, and other content stay beside the game instead of covering it. No panel has a fixed role: each can contain None, an OBS source, a Web address, or Image/Video content.

English is the default interface language. Korean and Japanese remain available in the language menu, and your saved selection is preserved. This is not a production-ready release: macOS and Chrome upload verification are still in progress. See [QA and device handoff](docs/QA.md).

## Quick start

1. Choose **Code → Download ZIP** on GitHub and extract the archive. Open [template/guide-en.html](template/guide-en.html) for the full setup guide.
2. Open [template/preview.html](template/preview.html). Configure Panel 1–7, their enabled state, parent/child frame positions, and global or individual styles. Changes appear immediately in the preview.
3. Click **Save ZIP** and extract `OBS-settings.zip` into the folder containing `obs-setup.lua` and `overlay.html`, replacing the generated settings files together. The ZIP includes configuration, uploaded assets, and rounded-corner masks. Keep personal settings ZIPs private.
4. Set the OBS base canvas to **1920 × 1080**. Open **Tools → Scripts → +** and add `obs-setup.lua`. For each panel configured as an OBS source, choose a distinct existing individual video source in its numbered selector. Scenes and groups are not supported, and one source cannot be assigned to two panels. Seven camera panels require seven distinct camera sources.
5. Click **Apply saved settings / Auto layout**. For later changes, replace the settings ZIP files and apply again. If you previously selected Korean script controls, enable **English UI (reload after changing)** and reload the script to switch.

The template creates its own scene and automatically locks its items. It does not start a broadcast, alter stream keys, or change capture-device settings. Source content keeps its original aspect ratio. Rounded masks apply to template groups rather than changing the original source in other scenes.

## Layout and preview

Parent and child frames control placement. Disabling a panel redistributes space among the remaining panels. The preview shows Panel 1–7 labels for navigation; those labels are not part of the OBS output.

| Panel | x | y | Width | Height |
| --- | ---: | ---: | ---: | ---: |
| 1 | 32 | 32 | 1384 | 778 |
| 2 | 32 | 842 | 440 | 206 |
| 3 | 504 | 842 | 440 | 206 |
| 4 | 976 | 842 | 440 | 206 |
| 5 | 1448 | 32 | 440 | 317 |
| 6 | 1448 | 381 | 440 | 317 |
| 7 | 1448 | 730 | 440 | 318 |

These are the default seven-panel coordinates; configuration changes recalculate them. The background, panel fill, content, and outside stroke are separate layers. Defaults are a black background, white fill at 20% opacity with 32px blur, and a fully opaque white 4px stroke. Disabling the stroke keeps fill and content visible.

**Show sample** displays the single sample entered in the test form. **Clear sample** clears only the sample; resetting settings is a separate action. **Fullscreen view** enlarges the current preview; press `Esc` or use the return button to leave it. Samples do not prove a live widget connection: verify actual content in OBS.

## Content and external services

OBS sources are selected in the OBS script, not in the browser preview. Web addresses must be provider-supplied HTTP(S) display/widget URLs. Ordinary management pages and video watch-page URLs are not automatically converted into widgets or media files.

Any compatible chat, translation, alert, donation, or reactive-image provider can be used in any panel. WEFLAB and Speech Translator are optional examples, not dependencies. Widget fonts, timestamps, nicknames, sound, and connection state belong to the provider; panel styles do not restyle a widget's internals. Providers must remain running when their content depends on a live service. Separate providers' alerts are not merged into one queue.

Images, GIF, MP4, and WebM may be uploaded or supplied as direct media URLs. Upload processing is local. Template media playback loops muted; external widget audio follows the provider's settings. Use assets and sources you have permission to share.

## Settings and privacy

Do not publish personal `config.js`, `obs-settings.json`, or `OBS-settings.zip`: they may contain private widget tokens. Neutral defaults are stored in `template/config.public.js`. `build.py` uses those defaults as the distributable's `config.js` and includes only an explicit file allowlist. Private configuration and original artwork are excluded from this repository and its build.

Browser draft settings are not shared with OBS; extract the settings ZIP into the real installation folder. A newly exported configuration takes precedence over older browser drafts. Reset uses neutral defaults. Restore uploaded assets together with configuration; if the page no longer has an uploaded file available for a new export, select it again.

## Windows and macOS

Extract the entire archive before opening the pages or loading the Lua script. Source ZIP runtime files are in `template/`; a built distributable uses the `streaming-template/` folder. Extract your settings ZIP beside the Lua file. Paths are relative to that file's folder.

Camera/capture permissions and available OBS sources differ by OS. macOS live execution has not yet been verified. Some browsers may restrict local iframe content; a localhost preview can help development but does not prove direct-file compatibility. For development, run the server below and open `http://127.0.0.1:8873/template/preview.html` on that same computer.

## Development and build

```sh
node --test tests/*.test.cjs
python -m unittest discover -s tests -p test_build.py
python build.py
python -m http.server 8873 --bind 127.0.0.1
```

Use `python3` on systems that require it, or `py` on Windows. Node's built-in test runner and Python's standard library are sufficient. The builder verifies internal references, ZIP inventory, content, and CRC before replacing `dist/OBS-Streaming-Template.zip`; a failed verification preserves the previous ZIP.

This project uses two permanent branches: `main` for verified snapshots and `dev` for ongoing development and QA. Work on `dev` and review/test changes before merging into `main`.

The `layoutVersion 4` schema uses internal keys `game`, `custom1`, `custom2`, `custom3`, `chat`, `translation`, and `hand` for Panel 1–7. Each `panelContent` entry has `{type, url}`, with type `none`, `source`, `web`, or `media`. Internal key names do not restrict panel roles.

## Repository layout

- `template/`: runtime HTML, scripts, styles, OBS Lua, and assets.
- `tests/`: regression checks.
- `docs/QA.md`: device evidence and remaining verification.
- `build.py`: neutral distributable builder.
- Root README, CHANGELOG, and LICENSE: project documentation.

## License and feedback

Original code is [MIT licensed](LICENSE), copyright 2026 KMG. Figma Simple Design System icons (CC BY 4.0), Lucide (ISC), and Inter (OFL) retain their own terms; see [third-party notices](template/assets/THIRD-PARTY-NOTICES.md). The GitHub header link uses the restored Figma icon. This repository starts with independent history and does not contain personal Vault history.

Report bugs and feedback through GitHub Issues. Include the version, platform, steps, and observed result; remove private URLs and tokens before attaching files. Release notes are in [CHANGELOG.md](CHANGELOG.md).

## Version policy

Versions use three numbers only: `MAJOR.MINOR.PATCH`, currently `0.4.2`. Development status is described separately; `dev` is a branch name, not a version suffix. The UI adds a `v` prefix and release tags use `vX.Y.Z`.

`template/version.js` is the single version source for the UI and the build's `VERSION` file. During `0.x` development, fixes increment the patch number and new features increment the minor number. Once a version is released, publish changes under a new version instead of replacing the same release.
