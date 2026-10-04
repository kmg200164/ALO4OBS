# OBS Streaming Template

This is a ready-made screen layout for live broadcasting. It gives your stream seven separate spaces. Put your game, camera, chat, or captions in them. They line up automatically, so chat and cameras do not cover your game.

<details>
<summary>New words? GitHub, README, OBS, ZIP, and MIT explained</summary>

- **GitHub** is the website you are viewing. People use it to share programs and keep their updates in one place. You do not need an account to download this template.
- **README** means this instruction page. Start here; you do not need to understand programming.
- **OBS Studio** is a free program that puts your game, camera, and other pictures together for recording or live broadcasting. This template arranges those pictures; OBS does the broadcasting.
- **ZIP** is a folder packed into one downloadable file. **Extract** means unpack it into a normal folder before using it.
- **[MIT license](https://opensource.org/license/mit)** is the permission statement for this project's original code. It allows you to use, change, and share the code, including commercially, while keeping the copyright and license notice. It does not promise that the software is error-free. Included fonts and icons have their own terms.

</details>

## First time here? Start here

**[Download the template ZIP](https://github.com/kmg200164/OBS-streaming-template/archive/refs/heads/dev.zip)**

![Setup flow: download the ZIP, extract it, open guide-en.html, configure seven panels, extract OBS-settings.zip into the template folder, then add obs-setup.lua through OBS Tools > Scripts > + and apply.](docs/images/setup-workflow.png)

Follow these six steps.

1. Click **Download the template ZIP** above. This link downloads the current `dev` test version. Find the downloaded file in **Downloads**.
2. Unpack it: on Windows, right-click the ZIP and choose **Extract All → Extract**; on macOS, double-click it. Open the unpacked folder, then open **template**. Do not open pages while they are still inside the ZIP.
3. Double-click **guide-en.html** in **template**. It opens the full setup guide in your browser. Click the gear-shaped settings icon at the top to open **preview.html**, or double-click **preview.html** in the same folder.
4. In the preview, choose the content and position of Panels 1–7. Click **Save as ZIP**. This downloads `OBS-settings.zip`.
5. Unpack `OBS-settings.zip` **into the same template folder**. Its files, including `obs-settings.json`, must sit beside `obs-setup.lua` and `overlay.html`, not inside another subfolder. Replace the older generated settings files if asked. Keep this settings ZIP private if it contains personal widget links.
6. In [OBS Studio](https://obsproject.com/) **30.1 or newer**, set the base canvas to **1920 × 1080**. Open **Tools → Scripts → +** and add that folder's `obs-setup.lua`. For every panel set to **OBS source**, choose a different existing individual source in its numbered selector. Then click **Apply saved settings / Auto layout**. The template scene appears in OBS; the guide explains these OBS controls in detail.

### OBS buttons

Open **Tools → Scripts**. These screenshots show OBS on macOS; Windows uses the same menu and button names.

![Actual English OBS Tools menu with Scripts selected.](docs/images/obs-tools-scripts.png)

Use the **+** button at the bottom left of the Scripts window to add `obs-setup.lua`.

![Actual OBS Scripts window with the plus button at the bottom left.](docs/images/obs-add-script.png)

After selecting each required OBS source, click **Apply saved settings / Auto layout** on the right.

Keep the unpacked folder where you want to store the template. OBS will continue to use files in that folder.

The template starts in English. You can select Korean or Japanese from its language button.

Version: **0.4.2 — test version**. This download is for trying the template and reporting problems. Installation and recovery checks are still in progress; see [QA results](docs/QA.md).

To change the layout later, save a new settings ZIP, replace its files in **template**, and click **Apply saved settings / Auto layout** again. OBS scenes and groups cannot be selected as a panel's OBS source, and the same source cannot be assigned to two panels. Seven camera panels need seven distinct camera sources. If the script controls appear in Korean, enable **English UI (reload after changing)** and reload the script.

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

## Who made this, and how?

KMG set the product direction, design, and requirements, and evaluates how it works in real use. The code implementation was produced with **OpenAI Codex**, using a **vibe coding** workflow.

<details>
<summary>What are Codex and vibe coding?</summary>

**[Codex](https://openai.com/codex/)** is an AI coding assistant: you describe what you want in everyday words, and it helps write, change, and test the program's code.

**Vibe coding** means building software by describing the desired result to an AI and iterating on what it produces. It does not mean every result is correct. Human review and real installation and broadcasting tests are still necessary. This project's current verification results and unfinished checks are recorded in [QA results](docs/QA.md).

</details>

## License and feedback

Original code is [MIT licensed](LICENSE), copyright 2026 KMG. Figma Simple Design System icons (CC BY 4.0), Lucide (ISC), and Inter (OFL) retain their own terms; see [third-party notices](template/assets/THIRD-PARTY-NOTICES.md). The GitHub header link uses the restored Figma icon. This repository starts with independent history and does not contain personal Vault history.

Report bugs and feedback through GitHub Issues. Include the version, platform, steps, and observed result; remove private URLs and tokens before attaching files. Release notes are in [CHANGELOG.md](CHANGELOG.md).

## Version policy

Versions use three numbers only: `MAJOR.MINOR.PATCH`, currently `0.4.2`. Development status is described separately; `dev` is a branch name, not a version suffix. The UI adds a `v` prefix and release tags use `vX.Y.Z`.

`template/version.js` is the single version source for the UI and the build's `VERSION` file. During `0.x` development, fixes increment the patch number and new features increment the minor number. Once a version is released, publish changes under a new version instead of replacing the same release.
