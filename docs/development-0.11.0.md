# 0.11.0 development

The web editor prepares one `script-bento.lua` or `script-overlap.lua`. The same Lua is a personal preset: importing it restores its configuration panel and both stored layout geometries. No account, server upload, ZIP extraction or downloaded settings editor is required in the web flow.

## Build and inspect

```sh
python build_site.py
```

The output is `dist/site/`, with a stable `settings.html` and an `index.html` entry. The public editor URL is [GitHub Pages](https://kmg200164.github.io/ALO4OBS/), published from the generated `gh-pages` branch; source and README remain on `dev`. See [deployment operations](pages-deployment.md). The build command only builds locally and does not publish. The three site guides describe the Lua flow. Historical offline guides and ZIP export remain in the optional offline distribution.

The build verifies every relative reference before replacing an output directory. Only a directory bearing its generated site marker can be replaced. Generated manifests record the version, byte counts and SHA-256 hashes. The editor checks the Lua runtime version and file hashes before exporting. Preserve the origin for browser draft continuity.

## Lua and OBS behavior

The Lua starts with a bounded, base64 JSON comment containing schema version 1 settings metadata. The browser accepts only supported application/layout schemas, plain bounded data, known field names, valid geometry, typed controls and safe rendered content URLs. Disabled or inactive panel URL drafts and preserved legacy connections remain inert bounded strings, matching the existing editor; enabling an invalid draft prevents export. Import never evaluates Lua or reuses its executable body. A new export is generated from trusted application runtime files.

The executable part contains internal rendering code, licenses, font and generated layout masks. It contains no original image/video payload. Loading prepares a configuration-specific folder beside the Lua using the OBS directory API. It neither runs shell commands nor applies a scene. The user selects original sources and presses Apply as before. A new configuration gets an isolated runtime directory; old directories are retained rather than automatically deleted.

Referenced local images/videos receive **Local file** controls in OBS. Choose their originals on that computer. Apply validates all selections, stages and verifies copies in 64 KiB chunks, then installs them in the runtime assets folder. Original files are read only. Failed installation attempts restore previous runtime copies where possible, retain a recovery backup if restoration fails, and do not proceed to scene Apply. Actual OBS rendering still needs a manual acceptance test.

OBS owns source selections and original-file paths in its script entry. A new script path or computer can require selecting them again. Media previews on a different browser/computer require the original files to be selected again; the layout and media reference settings still import and re-export as one Lua.

Lua presets contain file references, not a backup of media bytes. An older Lua referencing a path reused by a later upload cannot recover the older file's bytes. Keep the originals and select the intended files when restoring. Legacy 0.10.x scripts have no preset metadata and are not accepted as new presets. Browser storage also does not migrate automatically from a local `file://` editor to an HTTPS origin.

Overlap live blur remains optional and requires Composite Blur. The **Enable blur** switches allow zero blur without losing panel fill. The game + camera preset starts with blur disabled. Installing plugins is outside this development change.

## Browser state

Existing `obs-overlay-config` localStorage and `obs-overlay-uploads` IndexedDB data remain in use. File bytes are durable before settings reference them. A preset transaction first retains the current settings/uploads, then publishes the candidate and per-layout Undo snapshot in one draft write. Storage failure prevents application. Prior assets are retained for Undo. Reset explicitly clears Undo along with the reset data.

Built-ins change the selected layout geometry and appearance while retaining connections and the other layout's geometry. Main content and global appearance keep their established shared behavior. Personal Lua import restores the complete saved settings, including widget URLs; a sanitized community-sharing exporter is not implemented. Keep personal files containing private widget URLs private.

Future layout versions are preserved without overwriting their durable browser draft. Supported stored configurations continue through the existing migration path. Saving during asynchronous export cannot race with form/reset/layout edits; controls are locked until the operation completes.

## Verification

Windows development verification on 2026-10-30: Node **311 passed, 33 skipped**, Python **63 passed**, and separately enabled web/design browser checks **7 passed**. The actual public HTTPS web workflow also passed all **5** checks before the guide-only refinement. Baseline Node was 294 passed / 28 skipped. Browser coverage includes decoded panel images/video, byte restoration after reload, cross-context Lua import, three languages at 1440/390 px, header tooltip keyboard navigation and disconnected local font loading. These results do not establish real OBS application acceptance.

```sh
node --test tests/*.test.cjs
python -m unittest discover -s tests -p 'test_*.py'
```

On this Windows sandbox, set Python's `tempfile.tempdir` to a directory beneath `dist/` if system TEMP cleanup is denied. This is a test environment accommodation, not an application dependency.

For an isolated browser check without starting a server:

```powershell
$env:ALO4OBS_SITE_DIR=(Resolve-Path dist/site).Path
node --test tests/web-lua-workflow-ui.test.cjs
```

The test fulfills an isolated HTTPS test origin from the exact built files. It exercises actual DOM controls, Lua downloads/imports, browser reopening, durable Undo, storage failure, local-media references and download locking. It does not access the user's browser or screen.

Codec tests execute generated scripts in the installed OBS LuaJIT DLL with an OBS state model. They cover both layouts, binary runtime extraction, reload isolation, invalid metadata, URL/type/schema rejection, no pre-Apply scene mutation, local-file copying and injected failures. A separate native-file test checks the installed libobs directory/replace/unlink APIs using workspace fixtures, including a Korean path.

Not yet verified: registration and rendering in the real OBS application, native file picker interaction, actual capture/camera output, macOS/Linux acceptance. The new one-image setup guide awaits that final flow verification; the old ZIP infographic is not presented by the web guides.
