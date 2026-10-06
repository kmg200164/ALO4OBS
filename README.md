# ALO4OBS

Auto Layout Overlay for OBS

**[Download ALO4OBS 0.8.0](https://github.com/kmg200164/ALO4OBS/raw/refs/heads/main/downloads/OBS-Streaming-Template.zip)**

The current downloadable package is **0.8.0**. For patch notes, see [CHANGELOG.md](CHANGELOG.md).

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

![Setup: download, extract, open settings.html, configure panels, unpack saved settings, add the OBS script.](docs/images/setup-workflow.png)

## Features

- Automatically calculates a 1920 × 1080 layout for Main, Sub, and Side panels.
- Supports OBS sources, web URLs, and packaged image or video media.
- Exports a portable `OBS-settings.zip` with settings, masks, and selected media.
- Includes Korean, English, and Japanese settings and guides.
- Free MIT-licensed code with no required account or subscription.

## Quick start

1. Download and extract the ZIP. Do not open pages inside the ZIP.
2. Open `settings.html`, choose panel content and layout, then select **Save as ZIP**.
3. Extract `OBS-settings.zip` into a folder you will keep.
4. In OBS Studio 30.1 or newer, open **Tools → Scripts → +**, choose that folder's `OBS-script.lua`, select distinct existing OBS sources, then choose **Apply saved settings / Auto layout**.

Keep the extracted settings folder in place; OBS reads files beside the Lua script. Generated items are locked automatically. Applying settings does not start broadcasting, change stream keys, or alter capture-device settings.

## Update an existing installation

1. In OBS, delete the old `OST ·` sources and groups, and delete the old **OBS Streaming Template** scene.
2. Download and configure the new ZIP as above.
3. Remove the old script entry, then add the new extracted `OBS-script.lua` and apply settings.

Rollback is supported only within the same installed version. Keep the previous same-version settings folder until the new layout is confirmed.

## FAQ

<details>
<summary>What do Main, Sub, and Side mean?</summary>

Main is the large left panel. Sub panels run left to right below or above it. Side panels run top to bottom on the right. These English role names stay the same in every language.

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

Windows has live broadcast evidence. macOS verification is partial. HTTP preview does not prove direct `file://` compatibility, local-uploaded-media ZIP-to-OBS behavior, or every browser's storage quota behavior.

</details>

## Privacy and license

Keep personal `config.js`, `obs-settings.json`, and `OBS-settings.zip` private: they may contain widget tokens. Browser drafts do not update OBS; exports do.

Code: [MIT](LICENSE), copyright 2026 KMG. Inter and Lucide assets retain their own terms; see [third-party notices](template/assets/THIRD-PARTY-NOTICES.md).

KMG directs the product, design, requirements, and real-use evaluation. Code was implemented with [OpenAI Codex](https://openai.com/codex/) through vibe coding.

[Change log](CHANGELOG.md) · [QA evidence](docs/QA.md)

Before sharing screenshots, hide personal widget links and stream keys.
