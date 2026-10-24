# QA and device handoff

## Windows patch candidate (2026-10-24; not released)

### Production setup follow-up (2026-10-24)

- User approved production installation and restart. Program Files write was denied before a plugin file was written. The same verified official v1.6.0 Legacy x64 files were installed to the OBS-documented ProgramData plugin structure instead; all 37 file hashes match and the DLL signature is valid. Production OBS 32.2.2 log confirms the plugin loaded. See https://obsproject.com/kb/plugins-guide .
- Existing Music Widget local-file source was reused unchanged at 500 by 160. YouTube test playback was actually detected as playing, with the public stream title and Lofi Girl artist/channel metadata. Its card was visually confirmed in native OBS in both layouts, including after restart.
- HTML saved personal ZIPs with contain fit and crop right 60, bottom 25. Bento Sub 2 keeps x892/y837/759x227. Overlap adds Panel 1-1 at x24/y928/355.2x128; its existing Panel 4-1 and Panel 5-1 content and geometry match the old settings. Height 128 follows the existing UI minimum. Original source transforms/CSS were not used to work around HTML settings.
- New files were added beside the old delivery without overwriting old files. OBS registration now contains only script-bento.lua and script-overlap.lua. Main mappings remain the original game capture; music maps to custom2 and panel1_1 respectively. Apply saved settings succeeded for both; serialized panel crop/bounds and both mappings survived a normal OBS restart. Original Music Widget, game, window and display-capture settings/filters and protected profile hashes match the pre-apply state.
- Private evidence: production-plugin-install.json, personal-bento-delivery.json, personal-overlap-delivery.json, production-music-verification.json and memory-log-comparison.json in the ignored live-blur-20261024 QA directory. Personal ZIPs contain private user settings and must not be published. Neutral candidate-editor-v2.zip still matches all 65 current compiled source entries.
- Memory scope: the shutdown allocator count was one; an older production log, 2026-10-22 09-36-03.txt, also reports one with no Composite Blur and zero loaded Lua scripts. The log does not identify an object, byte count or allocation stack. This is evidence of pre-patch occurrence, not proof of a specific cause or a clean shutdown. The earlier QA no-Lua comparison also had stale saved-group warnings and is not a clean baseline.
- No stream or recording was started. Current OBS remains open on Bento with both output controls stopped. A running physical game capture was not verified; live-input blur evidence remains the moving synthetic QA test. No commit/push/tag/Release occurred.
- Cleanup blocker: Chrome tab operations became debugger-unattached after download tooling reset. Native getApp for the exact test Chrome window (3541576) then timed out waiting for app approval. No new access request or alternate control was attempted afterward. Test music is still reported playing; stop it after Chrome access is confirmed. This limitation must not be described as restored playback state.

The older checkpoint below describes the state before this follow-up.


- Root cause: browser panel fill blurred its copied wallpaper, without any OBS capture input. Both layouts now use separate references to Main with Composite Blur before each exported alpha mask. Main and the original source's filters stay sharp and unchanged. Fill visibility and rollback preserve the generated groups' visibility intent.
- Dependency: Composite Blur v1.6.0 Legacy x64 was verified by official SHA-256 and valid DLL signature, then installed only in the isolated OBS 32.2.2 portable QA directory. The user's installed OBS has not been changed. Missing plugin/input/masks or reserved-name collisions stop Apply before scene changes. Zero blur works without the plugin.
- Actual native verification: both newly exported ZIPs were extracted and applied/reapplied in separate QA scenes using a moving synthetic browser input. 235 checks passed; pixel checks confirmed motion in all 21 auxiliary panels, Main sharpness, blur attenuation, rounded mask boundaries, sizing, placement, filter order and source/filter/sentinel preservation. Streaming and recording stayed off. Evidence: ignored `.qa-private/live-blur-20261024/run5/` native and pixel JSON reports and screenshots. Shutdown reported one memory allocation; a comparison launch with no Lua scripts also reported one. This does not establish its cause or a clean shutdown. That comparison reused saved QA collection metadata and emitted missing-reference warnings, so a fully clean baseline is still required.
- Packages: actual browser exports contain only `script-bento.lua` or `script-overlap.lua` at root; ancillary files occur once under `files/bento/` or `files/overlap/`. This follows the published distribution's existing root-file plus `files` convention. The source template remains `OBS-script.lua`. Both extracted scripts loaded and applied in native OBS. Existing user's registered script paths have not been replaced.
- Source framing: HTML offers contain/cover/stretch and source-pixel cropping, persisted through reload, layout switching and ZIP export. Lua changes the panel's source reference only. Python native-Lua model tests preserve another scene's crop/transform. The existing Music Widget already targets the verified MSIX local file; index.html, script.js and style.css exist. Widget app launched, but its live data remains stopped with no track metadata. A separate headless render with synthetic metadata measured a 440 by 135 widget in the existing 500 by 160 browser size (right margin 60, bottom 25); it is a sizing fixture, not actual song playback or native OBS music-panel verification. No MSIX file was edited, no duplicate production source created, and no manual-only OBS transform fix was applied.
- First use: the `obs-overlay-first-use` browser record distinguishes guide-in-progress from done. No record asks Yes/No; Yes opens the existing localized guide and its Settings hint; No or arrival from the guide completes onboarding and opens settings. The existing Settings link is reused. file:// Chrome checks cover both choices, unfinished-guide reopening, completion/reopening, keyboard focus, hint placement and blocked local/session storage. With both storage APIs blocked, navigation works via URL fragments, but reopening cannot remember completion; file storage also depends on browser and path.
- Automated results: full Node suite 319 passed, zero failed/skipped; Python 44 passed. After final onboarding adjustments, 28 focused UI/i18n/guide/source-framing checks passed, plus the expanded blocked-storage branch. `git diff --check` passed. Production OBS protected config hashes: all seven unchanged.
- Candidate files only: `.qa-private/live-blur-20261024/candidate-editor-v2.zip` and `package-v2/Settings-{Bento,Overlap}.zip`. Product version remains 0.10.3. Published dist/download ZIPs were not replaced. No commit, push, tag or Release was performed.
- Remaining gates: separate approval for production plugin installation; native music-panel sizing and real playback; registered production script update and saved-settings application. Physical game capture, camera and real broadcast performance are not claimed. Main push is excluded by the latest instruction. Music FAQ remains a proposal using a generalized LOCALAPPDATA path, not a username-specific public path.

0.9.0 release verification. JavaScript tests passed 212/212 including 20 light/dark palette render states, three guides, and 320–1200 px responsive checks; Python tests passed 12/12. Isolated Chrome confirmed translucent cards, aligned dividers, an accent-colored exterior panel selection ring, available manual 1:1/16:9 labels without white track dots, and collapsible content-sized settings cards. Sub minimum width matches the square row height below a 16:9 Main at each gap. Section chevrons sit beside names and the whole heading toggles each section. Select fields use Lucide chevron-down icons with visible right padding while property rows retain 8 px outer padding. The distribution ZIP was rebuilt and CRC/source verified; native OBS, direct-file export/reopen, and platform checks remain open. Older sections below preserve version-specific evidence.

## Lower-panel minimum width correction (0.7.1)

- All 152 JavaScript checks pass. The lower panels retain a 206 px default minimum across Auto, 16:9, 21:9 and 32:9 main-panel modes; widths above the minimum remain adjustable. Active-panel combinations, input clamping and frame boundaries are covered.
- All seven Python packaging checks pass; the neutral 0.7.1 ZIP was rebuilt and copied to downloads/.
- Actual Chrome HTTP inspection confirmed that a 100 px entry clamps to 206 px and is square at 16:9; switching to 32:9 retains the 206 px minimum and still permits a 500 px width.
- The square reference minimum is capped by the automatic width if a different placement cannot accommodate a square. Historical live OBS evidence below remains scoped to the tested versions.

## Main-panel aspect choices and simplified sizing (0.7.0)

- All 151 JavaScript checks and seven Python packaging checks pass. New checks cover Auto, 16:9, 21:9 and 32:9 with the lower panels enabled or disabled, matching exported geometry and retained aspect choices. A regression check also covers Panel 1 sharing a left-side row or moving to the right parent; ratio height uses its actual allocated width and preserves minimum space for row peers.
- Actual Chrome HTTP source inspection confirmed that Panel 1 has an aspect selector and no height slider; 21:9 and 32:9 apply correctly. With Panels 2–4 disabled, Auto fills the 1384 × 1016 left parent, while explicit ratios remain unchanged. Panels 2–4 have no height control; their width control remains.
- Saved manual heights on Panels 2–4 normalize to automatic. Existing configurations without an aspect choice open with 16:9 in the settings editor; stored explicit choices are preserved.
- README support and bug reporting now follow the core explanation, with the optional 360 px Buy Me a Coffee button retained.
- The neutral 0.7.0 ZIP is built in dist/ and copied to downloads/; the README download link identifies its package commit.
- Live OBS application of 0.7.0, direct-file browser storage and the native Save as ZIP dialog were not exercised in this run. Historical evidence below remains scoped to its named versions.

## Auto and Manual sizing, uploaded-file restoration (0.6.0)

- All 149 JavaScript checks pass, including all-auto legacy geometry, fixed dimensions, active-panel limits, input clamping, export geometry, durable file bytes, failed saves and concurrent-tab recovery.
- Actual Chrome HTTP inspection of the built 0.6.0 ZIP confirmed synchronized numeric fields and native sliders, independent width/height choices, automatic correction of out-of-range values, updated limits after disabling a sibling, and retained fixed sizes after reload.
- Earlier source Chrome inspection before the width restrictions confirmed independent Panel 1 dimensions (1000 × 500), recalculated ratio marks, actual pointer snapping to 16:9, a 440 px right-frame width cap, and the unchanged 1384 px left parent after hiding every right-side panel.
- Each sizing card now contains its axis label on the left and Auto / Manual selector on the right, with flexible space between them. Numeric input and the full-width slider sit below that header and collapse in Auto mode. Internal padding is 16 px, control spacing 12 px and card spacing 16 px. The actual unchanged Chrome viewport showed no control overflow; an independent reviewer inspected the captured rendering and CSS. Numeric commit followed immediately by a different-panel click was also verified after preserving the selection button nodes.
- Follow-up Chrome inspection confirmed that Panels 1, 5, 6 and 7 have no width controls, Panels 2–4 retain them, and height controls work on every panel. Saved fixed widths on locked panels normalize to automatic.
- All seven Python packaging checks pass.
- A generated neutral PNG was uploaded through the file chooser, then the settings page was reloaded. Its background file mode and visible image were restored from browser storage.
- This run did not change the live OBS scene or broadcast. Direct-file browser storage, the native Save as ZIP dialog and application of the new fixed-size package in OBS remain separate checks. Earlier live Windows evidence below applies to the versions tested then.
- The neutral 0.6.0 ZIP is built in dist/ and copied to downloads/ for distribution. Its README download link identifies the package commit.

## Windows evidence

Confirmed during the current QA run: seven-panel rendering, live external widget output including translation, repeated OBS application, source locking, collapsed groups, source swapping, and preservation of sources removed from panels. These results apply to the tested Windows setup; they are not macOS evidence.

Remaining Windows checks, in order:

1. Verify direct `file://` execution in Chrome, then apply the actual browser-exported settings ZIP in OBS and inspect its output. HTTP Chrome upload, settings ZIP export, and restoration after reopening already passed independently on snapshot `cb4c2a8`: a 73-byte PNG was uploaded in source and built-package entry points, and ZIP CRC, asset SHA, settings JSON, and restoration on a fresh origin were checked. The separate neutral-fixture OBS tests do not prove the actual browser-exported ZIP-to-OBS step.
2. Verify rollback when a previously populated template is changed and an apply fails; the isolated new-scene test below does not establish that guarantee.

## Isolated Lua failure and recovery (Windows)

On the 0.4.1 QA snapshot, an instrumented copy created Panel 1 in a new, separately named scene and deliberately failed before Panel 2. The expected failure log was observed. OBS API inspection showed the partial QA group/input cleanup and unchanged original scene items and input settings. A recovery copy then applied successfully: two distinct media groups, locked groups/children, one alpha mask per group, and all four rendering layers. Broadcast and recording stayed off. The successful QA scene was removed and the original scene selected again. The temporary QA script registration was removed, the isolated scene and all QA inputs were cleaned up, and a final OBS API check confirmed original content unchanged with broadcasting and recording off.

This proves recovery from the tested clean new-scene failure, not transactional rollback of arbitrary changes to an existing populated template. Private fixture settings and API evidence remain outside the repository.

Independent Chrome QA also verified that exported local settings override neutral defaults in both source and built-package entry points after the 0.4.1 restore fix. This is separate from the complete Chrome upload-to-OBS check above.

## macOS checks

macOS QA stopped at the user’s request on 2026-10-04 because Windows is the only planned broadcasting and gaming platform. Use the independent repository on `dev`; do not develop in an old Vault checkout. The observations below are partial Mac evidence, not complete platform compatibility. Mac-only checks are not a release gate for a Windows-only release.

1. Open `template/guide-en.html` or `template/guide.html` directly from the extracted files, then configure `template/preview.html`.
2. Verify file upload, settings ZIP export/extraction, and restoration after reopening the page.
3. In OBS, test a Shogun Showdown game-window capture alongside neutral image/video sources. Request only the specific macOS capture or camera permission needed for each test.
4. Add `template/obs-setup.lua`, select distinct individual video sources, apply twice, and verify rendering, rounded masks, locks, collapsed groups, and no duplicate sources.
5. Check capture/camera permission rejection and recovery, source changes, and safe preservation when a panel is disabled.

Keep personal widget links and exported settings private. Record the commit ID, device, observed result, and remaining limitations rather than calling untested platforms complete.

## Release

Continue fixes on `dev`. After the required checks pass, replace the README patch notes with the released-version notes, paste the same notes into the GitHub Release body, merge the verified version into `main`, tag the release, build `dist/ALO4OBS-v{version}.zip`, and attach the neutral ZIP to a GitHub Release. No production-ready claim or release tag has been made yet.

## macOS evidence (2026-10-04, partial and stopped)

Baseline: `a75e518`, version 0.4.1, OBS Studio 32.2.2. The independent clone matched `origin/dev` at handoff. Original OBS configuration was backed up and the backup CRC verified before starting; tests use a separate scene collection. The original scene-collection JSON remained byte-identical to its backup during this check. Private settings, fixtures, screenshots and backups stay outside this repository.

- The shared header now lists English, Korean, Japanese in that order. Fresh HTTP settings opened in English. Korean and Japanese selections survived reload, and all three localized guide pages displayed the same option order and selection. The restored GitHub icon was preserved.
- Automated checks: 111 JavaScript tests and six Python build tests passed. The deployment ZIP built successfully with neutral defaults.
- Chrome HTTP: a neutral PNG and a two-second MP4 were uploaded, previewed and exported using Save as ZIP. The actual export passed ZIP CRC checks, contained config.js, obs-settings.json, seven masks and both uploaded assets, and preserved the uploaded bytes. Extracting that export into source and built-package entry points restored both media panels. In the built-package browser preview, the restored MP4 had readyState 4 and was playing.
- A second export from an extracted package originally kept media paths but omitted their bytes (nine ZIP entries). Reproduced in Chrome and fixed: restored local assets are read into the export; missing assets now stop the download with a clear re-upload message. The corrected Chrome export has eleven entries, passes CRC and contains byte-identical PNG and MP4 assets. Direct-file re-export is still unverified.
- The actual exported source settings were applied in isolated OBS. Repeated application produced one template scene and unique source names. The screen showed seven panel positions, rounded media corners, outside strokes, locked generated items and collapsed groups. These observations do not yet complete source-swap, permission or populated-scene failure checks.
- Direct file launch: the user reported English startup before the menu fix. The browser connection explicitly blocks file:// access even after the user enabled extension file access. Agent verification of direct-file upload, export and restoration remains unverified; HTTP results do not substitute for it.
- Shogun Showdown launched through Steam after the user closed the active Windows Steam session. The game window was visible and listed in OBS macOS window capture. Selecting that window and confirming its rendered output remains pending; launch alone is not a capture pass.

At handoff, the isolated QA scene collection was removed after its JSON was copied to a private backup. The original scene-collection JSON and OBS global.ini remained byte-identical to the pre-test backup; broadcasting and recording were never started. Shogun Showdown was closed.

Unverified on Mac: actual game capture inside the template, built-package OBS application, source swapping/disabling and duplicate rejection, capture/camera permission rejection and recovery, camera availability, and populated-scene injected failure/reapplication. These checks are not required for a Windows-only release but cannot be claimed as passed. The remaining Windows checks above still gate 1.0.0 readiness.

## Windows follow-up (2026-10-05, without Computer Use)

Baseline: `a077dca`, version 0.4.2. The complete OBS configuration was backed up before inspection. At the user's request, no Computer Use or live scene/capture changes were performed while the user was gaming.

Read-only OBS WebSocket inspection confirmed the template and Full Game scenes, exactly one group for each of Panel 1–7, locked generated groups and children, one enabled alpha mask per group, a game_capture source assigned to Panel 1, media in Panels 2–4, web sources in Panels 5–7, and all four rendering layers. Broadcasting and recording were off. Private backup and API evidence remain outside this repository.

This does not establish rendered capture output, outside-stroke appearance, collapsed UI state, latest browser-exported ZIP installation, a fresh repeated application, source swap/disable preservation, or populated-scene failure rollback. Those live checks remain pending; main is unchanged and no tag or GitHub Release is authorized by this run.

A Windows-only test portability defect was reproduced: the shared-header language-order test split source on LF-only blank lines, so CRLF checkouts also executed the subsequent DOM initializer and failed. The test now recognizes both LF and CRLF; product code is unchanged by this correction.
Automated verification after the CRLF test correction: all 111 JavaScript tests and six Python build tests passed. The existing human-readable source naming was retained at the user's direction; cosmetic separator changes are not a release blocker.

## Populated-scene rollback repair (Windows, live retest passed)

Code review found that failure after an earlier panel changed could leave partial existing-group updates and temporary retained items. The repair captures original scene/group items and source references before mutation, restores transforms, crop, order, visibility, locks, collapsed state and template source/filter settings on failure, and releases held references. Original user capture settings are not updated during rollback.

An automated test executes these Lua helpers in the installed OBS LuaJIT runtime against a controlled OBS state model. Existing scene items remain intact until successful commit, preserving their IDs and properties, including duplicate items referencing the same source. The test checks added media/group/retention items, changed transforms and mask settings, exact settings restoration after newly introduced keys, and reference release. This automated result is Lua runtime/model evidence. The separate live test below establishes the bounded OBS failure/recovery path. Native accessibility input targeting was inaccurate in the file dialog; fresh screenshot-bound coordinate input completed the workflow without manually resizing windows.

## Windows actual export and live Lua follow-up (2026-10-05)

The actual Chrome Save as ZIP download passed CRC validation and was extracted beside the current Lua script. Its settings contained one existing game-capture source and six neutral HTTP image URLs; it did not contain uploaded local media bytes. A private copy changed only the generated scene/source namespace to isolate this test from the user's template.

- Native OBS added the script, selected the existing game capture, and applied the exported settings. API evidence confirmed seven groups, four rendering layers, locked generated groups/children, and one enabled mask per group. Visible OBS output showed the six red media panels with rounded corners and strokes; the game was closed, so this run does not re-prove rendered game capture.
- Repeating Apply preserved the complete scene-item/group/ID/transform/filter state without duplicate groups or inputs.
- In the already populated test scene, two earlier panels were changed before an injected failure at Panel 3. The actual OBS log reported the injected failure and restoration. Both immediate and settled API snapshots matched the baseline scene state and all input settings exactly. Restoring the normal script and applying again succeeded.
- Disabling Panels 1 and 2 reduced the active groups from seven to five. Changing Panel 1 from the existing capture to neutral media and then back succeeded. The user's original two scenes and original input settings remained unchanged at every checkpoint. This verifies content-type replacement and disable preservation; selecting between two distinct existing capture sources was not tested in this run.
- The test script registration was removed, its isolated scene/inputs were deleted, and the original current scene was restored. After settling, only the original two scenes remained and their item state and input settings matched the pre-test baseline. Broadcasting and recording were never started; audio settings were not changed. Private snapshots and backups remain outside the public repository. Sanitized screenshots of the OBS installation buttons are included in the README.

Remaining separate proof: direct-file browser startup/upload/export, the complete local-uploaded-media ZIP-to-OBS chain, and the macOS items listed above. HTTP URL-image export and OBS application do not substitute for local media packaging or direct-file launch. Arbitrary Lua exceptions outside the guarded apply failure path are not claimed to be recovered by this test.
## Download package correction (2026-10-05)

The user reproduced stale 0.4.1 UI in the public download. The 0.4.3 package now includes English-first language ordering and preview highlighting that recolors the actual stroke tiles, using the maximum UI width (8) without saving highlight styles. The archive exposes settings.html plus a files folder. Automated checks pass; rendered direct-file highlighting and complete local-upload-to-OBS validation remain pending. This is a test package, not a production release.

## Data-only settings export (0.4.4)

Windows extraction of a browser-generated settings ZIP was blocked at config.js; its Zone.Identifier was ZoneId=4. Exports now contain JSON and media/masks, with no executable JavaScript. The OBS v4 apply path generates browser config locally from parsed JSON and restores the previous file on guarded apply failure. Automated packaging checks pass; native Windows extraction and live OBS application of this new export remain unverified.

## Independent saved OBS package (0.4.8)

The built settings page embeds a neutral runtime manifest, so local-file export does not fetch the script. Saved ZIPs contain OBS-script.lua, HTML/CSS/fonts, JSON settings, masks and user media. The explicitly loaded Lua installs its bundled browser JavaScript locally; there are no downloaded .js entries in the settings ZIP. Package manifest checks and 113 JavaScript / 8 Python tests pass. Native Windows extraction and live OBS execution of this package remain pending.


### 0.5.1: Windows extraction warning

User screenshot identifies LICENSE as the blocked file. The user-generated ZIP has ZoneId=4 (restricted zone) and a file-origin HostUrl. This does not establish a malware detection. Rename the packaged license to LICENSE.txt and use the browser native save picker when available. Verify write/close and cancellation in automated checks. Actual Windows extraction of the new export remains unverified; do not claim this warning is resolved yet.


### User-reported live Windows broadcast — 2026-10-05

The user reports successful operation after the latest installation changes and provided an OBS screenshot showing an active broadcast, game capture, translation text, web widget content, rounded masks, and panel borders. The screenshot reports zero dropped frames at capture time. This is user-supplied evidence, not an independent audio, macOS, repeated-apply, or recovery verification. README describes the successful Windows broadcast without labeling the entire product a test version.

## 0.8.0 preparation — 2026-10-06

This is an unreleased working-tree check on dev at 3b44626. This initial check used source 0.7.1; the final 2026-10-07 source is 0.8.0. The public pinned download remains 0.7.1.

- Main stays enabled. Sub/Side counts are prefix selections, saved through the existing panelEnabled keys. Automated coverage includes legacy gaps, export keys and 360 layout combinations; Chrome checked all nine count combinations without overlaps.
- Gap, fill opacity, blur and stroke width are five-step sliders. Count and global sliders fill the card interior. The Main/Sub checkbox is a keyboard-operable vertical switch. The selected panel tag shares the section heading row; width/content selectors use the same label-width token and measured equal at wide and 480 px sizes.
- HTTP Chrome upload followed by tab close/reopen restored both the selected file path and actual decoded/rendered image. upload-storage.js was not changed. This proves tab-reopen persistence, not full browser-process restart, file:// or OBS browser-source persistence.
- The extra-narrow prompt appeared in Chrome. Confirm/dismiss control returned a browser-tool timeout, so end-to-end acceptance/cancel is not passed here; automated scoped tests cover both choices and preserve regional overrides. Restoration showed no dialog.
- Three localized guides rendered. Native OBS, real quota-warning UI, macOS and direct-file checks remain separate verification tasks. These limits prevent a complete release-readiness claim.

Initial integration: Node 187/187, Python 11/11, build verified 47 files in dist/ALO4OBS-v0.7.1.zip. Native details menus were checked in Chrome at 920/480/360 px; links, opposite-page navigation, mutual exclusion and Escape passed. Wide and 360 px brand center matched header center. The outer window size was preserved. Independent high-effort header review found no confirmed defect.

## Final 0.8.0 source verification — 2026-10-07

Node 189/189 and Python 11/11 passed; dist/ALO4OBS-v0.8.0.zip built and verified with 47 files. Actual Chrome origin 8765 loaded versioned CSS/JavaScript after an earlier cached-style mismatch. All UI icons use official Lucide 0.468.0 stock glyphs. Global sliders update labels on input; opacity, blur and stroke width increase left to right. English/Japanese labels, preview opacity/blur, reload persistence and final left-label/right-value alignment passed. Main/Sub text is left of the vertical switch. A 480px viewport has no horizontal overflow. Independent high-effort source review passed. Native/platform limits above remain open; this is not a public-release claim.

## Earlier 0.9.0 checkpoint — 2026-10-07 (superseded)

At this checkpoint, Figma cleanup was complete: Primitive 48 / Palette 6 / Semantic 21; 331 superseded variables were removed after full-page/style/alias dependency checks and preservation of recovery data. Exact 20 user accent colors were retained. The user requested color revisions at the review gate, so HTML theme application and final ZIP rebuild were pending then. The earlier ZIP and 205-test evidence below do not cover the newer changes.

At that checkpoint, source checks reported Node 208 passed, 0 failed, 1 opt-in rendered test skipped; Python 12/12 passed including two installed OBS LuaJIT checks. Independent focused UI checks 26/26 passed. Isolated Chrome verified full-width ranges, right-aligned live values, horizontal switches, select arrows, Fill/Stroke sections, selection outlines with broadcast strokes disabled, warning document order, five viewport widths and three languages. No new non-color regression was found. The local-only captures are not part of the public repository; work-report-0.9.0.md records the final tested scope.

At this checkpoint, file:// execution, native OBS setup/output and OS export-picker behavior remained separate unverified paths. No final ZIP, commit, push, tag, GitHub Release or SNS publication had occurred then.
## Earlier 0.9.0 candidate verification — 2026-10-07 (superseded)

Uncommitted main working tree; publication explicitly withheld. See [work report](work-report-0.9.0.md) and [draft release notes](release-notes-0.9.0.md).

Final source: Node 205/205, Python 12/12 plus 8 Lua subtests, build.py passed. User-defined 10 palettes / 20 exact accent HEX replace the provisional four. Source contrast: 1,660 passing essential role/state/background checks, with decorative fills recorded separately. Side source geometry covers 1,024 cases; Lua is tested against an OBS state model.

Isolated headless Chrome 154.0.8037.98 checked both source HTTP and the actual rebuilt ZIP on a fresh origin: 20 palette/theme combinations each, all computed tokens matching source, unchanged broadcast-preview styles, reload persistence, three localized guides, 480×600 and 320×480 scrollable menus, Escape retaining the outer menu, no horizontal overflow and no pageerrors. Current 20-mode contact sheets and mobile captures were visually inspected. No user keyboard/mouse/window/profile/tab was touched.

Neutral defaults now contain the missing startup geometry; the same omission caused initial Invalid layout on the actual 0.8.0 ZIP. Strict validation remains. The regression check verifies neutral updates preserve durable drafts while genuinely different imported settings retain precedence.

At that checkpoint, local-only palette, contrast, render and ZIP audit files recorded 48 ZIP entries with no additions/removals and 21 changed entries versus 0.8.0. Those files describe an earlier candidate and are not linked as current release evidence. Older eight-color captures and audits remain historical local evidence.

Four Side-state captures were separately taken in stable 0.9.0 states. The older gap 8/48 eight-case DOM log has switch/coordinate mismatches; its browser-pass claim remains withdrawn. Palette preview invariance does not replace that check or live OBS output.

Direct file://, native OBS, macOS, actual OS export picker/reopen and held-pointer pixels remain unverified. HTTP/headless evidence is scoped accordingly. No commit, push, tag, Release, repository settings or SNS activity.


## 0.9.1 local patch evidence (2026-10-08)

See [the 0.9.1 work report](work-report-0.9.1.md) for the complete scope, package SHA-256, browser checks and limits. JavaScript: 220 passed with rendered candidate checks; Python: 13 passed. Follow-up: pure-white/pure-black selection/text fields checked in both actual Chrome modes; corrected light-white/dark-black translucent surfaces (55%/35%), borderless shared range paint and override separation; six-step visual quick start, six required/eleven extra collapsed guide sections and accent hover with inverted filename highlights. Later visual review requested white accent ink for Cherry/Bubblegum light mode; small-text ratios 3.972/3.380 are explicitly recorded below 4.5, not counted as WCAG passes. Three guide languages at 320/390/760/1440px passed initial-state, image load, overflow, keyboard and whole-card checks. Earlier in this patch session, before the final editor-only UI follow-up, a separate Windows OBS 32.2.2 portable QA environment verified a 0.9.0-to-0.9.1 config.js + uploaded-PNG migration, actual Apply/reapply and bounded source/filter/scene preservation. User OBS configuration hashes (25 files) were unchanged. Real failure rollback, physical captures/cameras, personal widgets, direct-file editor, native picker/extraction and macOS were not verified for this candidate. No commit, push or release was performed.

## Offline plugin bundle preparation (2026-10-24; incomplete)

- `build.build_windows(destination, plugin_archive, source_archive)` produces a separate Windows OBS 32 candidate. The ordinary build/release path is not switched yet. Root remains settings.html plus files. The root explains the one-time installer action; files/settings.html retains onboarding and the editor.
- Composite Blur official v1.6.0 Legacy x64 archive is pinned to SHA-256 8279b2ddc73947d7a864102b55eaf406443846267eb24ea0cdafb2f3dda9e4da. Full upstream source at commit 0783c13660a939143bb2d0c3b1f69310f413348a is included as source.zip, SHA-256 aa944119e4db957f5b2ed86d6511e453367d6f21a7fd06782e0f0cdb63dda2ed. This source has no git submodules or vendor directory. GPL v2 text, upstream source notices and a separate aggregation notice accompany all 37 unmodified binary/data files. No personal config enters this candidate.
- `files/Install-OBS-Plugin.cmd` verifies file hashes and OBS 32, refuses a different installed plugin, and refuses installation while obs64 runs. It copies missing files into the documented ProgramData layout without elevation, terminating OBS or changing execution policy. It then opens local settings. HTML does not execute it automatically: the user must close OBS and run this helper once. Browser links/downloads are not presented as automatic execution.
- Actual `/check` passed (exit 0), with no target changes. Initial check exposed Windows ProductMajorPart metadata and Get-FileHash module differences; fixed using ProductVersion string matching and .NET SHA-256. Python 46 tests passed before the final hash implementation change; the rebuilt helper then passed its actual check. Source/archive CRC and the sole-root-file inventory passed.
- Artifact: ignored `.qa-private/live-blur-20261024/ALO4OBS-Windows32-plugin-candidate.zip`. Not published. Remaining: fresh actual installer execution, rejection/upgrade/version coverage, release/default-build integration and localized installer presentation. Do not claim automatic deployment complete. No new installer write run or OBS/Chrome launch was performed during this bundle step.
- The user forbids Steam/game/launcher actions. Actual game execution is not a release-preparation gate. Current-background blur observation is still pending; do not infer it from game inactivity or from the already-passed moving synthetic input evidence.

## Offline bundle completion follow-up (2026-10-24)

This supersedes the incomplete bundle checkpoint above. The default build now automatically consumes the pinned official binary/source archives in vendor/obs-composite-blur-1.6.0, without a network request. The original root settings.html redirect remains unchanged; localized instructions were added to the existing first-user guides. Missing-plugin Lua guidance points to the included helper. Windows x64 / OBS 32 automatic installation is the explicit supported scope; macOS/Linux and other OBS versions are not automatically installed. This limits installer support, not HTML editor availability.

Fresh isolated portable OBS had no Composite Blur DLL. The helper installed all 37 official files (exit 0); a newly started isolated OBS loaded its local ../../obs-plugins/64bit/obs-composite-blur.dll and created the filter. Streaming/recording were false. The helper refused a running target, rejected a modified bundled DLL, rejected a different existing plugin without overwrite, and succeeded on identical reinstall. Restored QA fixture hashes all match. Only the completed empty QA process was terminated during cleanup; production OBS and plugin were untouched. This run does not claim clean native shutdown memory accounting.

Python 47 passed; focused first-use/guide/i18n/source-view browser checks 28 passed. The final notice-only edits were followed by Python checks. Actual candidate has 108 entries, verified CRC, exact source/runtime match, one root settings.html, plugin GPL text/notices and exact source archive. See ignored offline-bundle-verification.json for hashes and native module-path evidence. No published dist/download replacement, commit, push, tag or Release.

Current operational OBS was observed without launching any game: it shows the configured static wallpaper and an inactive game capture. Live blur cannot be established from that empty capture, and no current-background blur pass is claimed. The previously verified moving synthetic input remains the live-blur evidence. Game execution is excluded from release-preparation gates by user instruction; Steam/game actions were not performed. Chrome's previously blocked action was not retried.

## Final integration check (2026-10-24)

All 319 original Node test names passed on final source: initial full run passed 296 and skipped 23 opt-in cases; the opt-in run resolved every one of those 23 and rechecked four path-generalized tests. Its 61 reported passes include no-match file wrappers, so they are not added to the 296 count. Python 47 and focused UI 28 remain applicable; no product code changed during this integration check. New test account-specific cache paths were generalized. Final ZIP CRC/source/helper match passed. No personal settings, account paths or QA artifacts appear in the public ZIP or newly added diff lines. The only vendor archives are the deliberately bundled official binary and exact corresponding source. The OBS 32 limitation applies to the Windows installer only; no global HTML/Lua version check was added. See ignored final-integration-results.json for evidence.

## Empty capture fallback correction (2026-10-24)

User inspection supersedes the earlier completion checkpoint: a configured game source was enough to hide the static backdrop, even without a hooked capture. Both layouts now poll capture availability every 250 ms. Game capture uses its native get_hooked procedure as well as geometry; missing/removed/unhooked sources retain static background blur. Live availability switches to the existing live blur groups. Fill-none and disabled panels, original capture filters, and background/fill visibility intent remain unchanged. Reload reads the scoped saved settings; Apply saves the selected live input for subsequent transitions.

Regression-first empty/valid/disconnected game-session tests failed before the fix. Python 49 and focused Node 23 pass after the fix. Native isolated OBS verified get_hooked=false for a deliberately nonexistent target, static backdrop CSS retained, a moving browser source switches to live backdrop CSS, and removed input restores static CSS. Native removal initially failed because removed sources retained dimensions; checking obs_source_removed fixed it. The final native result has done=true and all nine checks true. The older error JSON is a retained first-run failure, not a final failure. Only the isolated test process was stopped; operating OBS, YouTube and Discord were not modified.

This narrow native run checks real source/procedure state and fallback CSS, not a fresh pixel comparison of the user's screen. Actual game hook/reconnect/minimize was not exercised; Steam/game execution is forbidden. A hooked session does not prove every frame is fresh. Other source kinds use geometry/removal checks, so transparent/frozen content is not universally detected. Prior moving-input blur pixel evidence remains separate. The supplied Library screenshot could not be materialized by the Windows helper (os.setxattr unavailable); it was not visually inspected.

Saved overrides exclude Bento custom1/custom2/custom3 and Overlap panel4_1 (fill.mode=none); no user choice was changed. The editor exposes per-panel override and Fill/None controls. Generated eligible groups still reference the selected game capture, not YouTube or Discord.

The public Windows candidate was rebuilt from current source. Separate ignored fallback-script-bento.zip and fallback-script-overlap.zip contain only the correctly named Lua, preserving existing private settings/assets if applied later. Deployment is pending: replace only the corresponding Lua in the existing settings folder, reload that script, then Apply saved settings and inspect the empty-capture backdrop. No operating application, commit, push, tag, or Release was performed.

## User onboarding visual approval (2026-10-24)

The user approved the revised first-use dialog spacing and layout ("어 딱 괜찮네"). Keep this design unchanged. This approval covers the onboarding screen only; empty-capture fallback deployment to operational OBS, complete release acceptance, and 0.10.4 commit/push remain pending. No further testing or packaging was performed for this checkpoint.

## Guide states, shared header and width-fit background (2026-10-24)

Guide symbols were CSS list ::marker and a privacy-note border, not Markdown syntax. Header CSS fixed their colors independently from the active FAQ card foreground. Shared guide rules now inherit the surrounding foreground for markers, text and the active note border; code keeps its intentionally inverse highlight. No warning/status tokens or approved spacing were changed. Three languages, dark/light, 96 cards / 288 base-hover-keyboard-focus states passed computed-color and 4.5:1 active/highlight contrast checks. Supplied Library images returned references/text only; their original pixels were not inspected.

Layout-switch markup now lives in the shared header instead of arriving from the settings body after editor initialization. Guides keep the same button position/size, real disabled semantics, dimmed appearance and accessible name. Stable scrollbar gutter removes the short/scrolling page width difference. Four viewport widths (320/800/1280/1886), three guide languages and repeated settings/guide navigation passed 48 bounding-box samples (under 1px tolerance). Disabled clicks/focus cannot activate navigation. No animation was added.

The user corrected the apparent tiling report: the supplied image was 16:9; no current tiling bug is claimed. Existing images used cover, which differs from the requested width-fit policy. Wallpaper, preview wallpaper and static panel backdrop now use full width with automatic aspect-ratio height, centered vertically under the existing clipping policy; gradients retain full canvas dimensions and explicit no-repeat. Square/portrait/ultrawide/16:9 geometry passed in preview and wallpaper rendering (8 cases). Images are single img elements, with no repeated CSS image paint. User assets/settings were not replaced. No operational OBS pixel check was performed.

Final scoped rendered test methods: 4 passed, tooltip test skipped because its separate URL opt-in was absent. Relevant existing static tests after updating expected title/shared-icon source: 39 passed / 2 opt-in skipped. The earlier full Node run exposed three obsolete expectations, subsequently corrected and rechecked; do not describe that initial run as a complete pass. git diff --check passed.

Relevant compiled files (including editor export-runtime for future exports) were copied to the existing W:/Streaming review folder with backups under the task workspace. Existing user Lua and saved configuration remained unchanged. User Chrome was not automated. No full ZIP repackaging, Library update, commit, push, tag or Release at this checkpoint; earlier ZIP candidates need final refresh before distribution.

## User blur appearance check (2026-10-24)

The user reported: "블러가 잘 적용된 모습이네". This confirms the blur appearance on the user’s observed screen only. It does not approve all functionality, distribution, every real-game state, or commit/push/tag/Release. No code changes, test reruns, packaging or operational app actions were performed for this record. Await further user inspection feedback.

## 0.10.4 preparation and corrected Bento semantics (2026-10-24)

Latest user clarification supersedes the earlier shared-live-blur interpretation: Bento panel backdrop is the independently configured full-canvas background image/color; Overlap backdrop follows Main. A regression first failed on Bento reading Main. Planner checks now cover both layouts, image/color background and empty/changing Main selections, including fill-none preservation; the reload-transition regression verifies old Bento live groups are hidden and its static backdrop is restored even when Main is hooked. Overlap availability/reconnect behavior remains covered. These are Lua runtime/model checks, not a fresh operational OBS pixel test. The earlier user statement that blur looked correct does not approve this subsequent Bento correction.

Version 0.10.4 is set in version.js, packaged VERSION/README, guide/settings references and changelog. Composite Blur remains 1.6.0. Actual isolated Chrome export from the user's existing review-folder HTML produced Settings-Bento.zip with root script-bento.lua, current layout separation/refresh code and scoped files/bento paths. User browser storage/assets and operational Lua were not modified. The user can refresh and re-export, then explicitly reload/apply the new Lua themselves. Operational validation of this final Bento correction is pending.

The 153-entry public 0.10.4 ZIP is prepared under downloads/ and ignored QA staging, with source/CRC/version/path/privacy checks passed. Plugin packages/source/licenses are official pinned artifacts. Native actual installation remains Windows OBS32; platform command-stub results are separate. OBS automatic mapping is 30-33, macOS/Linux actual install and Flatpak offline extension remain unverified/unavailable as documented. No commit/index staging/push/merge/tag/Release. Remote main advanced one README-only commit (dc7c3d9); its expanded product description is preserved locally. Normalized read-only README merge simulation has no content conflict, but remote ancestry still needs integration after pre-push review.

Final validation: Python 54 passed. Full opt-in Node run: 321 passed, 1 height-UI timeout, 0 skipped. The affected file was rerun alone: both tests passed, including 20,000 mixed configurations. Thus all 322 distinct tests have passing evidence, but the single full concurrent run was not clean; the timeout remains disclosed. No tests or runtime operations remain running from these checks.

## Height UI timeout diagnosis (2026-10-24)

Affected test: tests/all-panel-height-ui.test.cjs, every panel height mode and slider keeps actual rendered panels separate. The iframe match wait was 3000ms; the failing concurrent run ended at 14919ms total. A standalone rerun passed in 17389ms. The helper previously waited only for any saved config, then captured it once, while preview rendering happens before the asynchronous storage-lock save queue commits. A stale saved snapshot can therefore be compared forever against the newer rendered geometry. Failure-time snapshots were not logged, so this specific historical occurrence cannot be conclusively attributed to that race; no product geometry defect was reproduced.

Test-only correction: wait for persisted geometry to match the current parent hit-area geometry before capturing one snapshot and checking the iframe. Retain 3000ms limits and remove the arbitrary 30ms sleep. No timeout increase or product code change. The revised test passed all 139 UI states under the same concurrency=2 in 22483ms, with a separate 20,000-configuration test passing. Final whole-suite result is recorded after completion. ZIP bytes are unchanged, so this testing adjustment requires no new user Bento export.

Remote main change remains one README wording commit: Auto Layout Overlay for OBS -> Auto Layout Overlay for Open Broadcaster Software. No actual merge was performed.

Final full Node rerun after the test-only synchronization fix: 322 passed, 0 failed, 0 skipped, concurrency=2, total 107988ms. All opt-in browser checks were enabled. No product/bundle change was needed.

## Parent-observed user screenshot (2026-10-24)

At 08:21 UTC, the parent inspected actual pixels of user-provided Library image libfile_e50d9af20d548191ac7943f9fdee85ab. It observed THE FINALS sharp in Main, with the separate configured background image blurred behind chat. This supersedes the earlier latest-Bento-operational-screen-unobserved status for this still-image observation only. It is not verification of all dynamic/game states or final distribution/push approval. The child did not independently inspect those pixels. README installation instructions now follow the existing canonical English documentation policy and distinguish implemented helpers from actual installation coverage. Per-task tag/Release restrictions remain internal rather than product changelog items. No code/version changes or commit/push/tag/Release were performed for this documentation update. Packaged README/CHANGELOG in an already-built ZIP require a later documentation-only refresh; no ZIP was rebuilt in this step.
