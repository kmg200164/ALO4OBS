# QA and device handoff

Current implementation: 0.7.0. The sections below preserve evidence from their named versions; automated checks do not establish live platform compatibility.

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

Continue fixes on `dev`. After the required checks pass, merge the verified version into `main`, tag the release, build `dist/OBS-Streaming-Template.zip`, and attach the neutral ZIP to a GitHub Release. No production-ready claim or release tag has been made yet.

## macOS evidence (2026-10-04, partial and stopped)

Baseline: `a75e518`, version 0.4.1, OBS Studio 32.2.2. The independent clone matched `origin/dev` at handoff. Original OBS configuration was backed up and the backup CRC verified before starting; tests use a separate scene collection. The original scene-collection JSON remained byte-identical to its backup during this check. Private settings, fixtures, screenshots and backups stay outside this repository.

- The shared header now lists English, 한국어, 日本語 in that order. Fresh HTTP settings opened in English. Korean and Japanese selections survived reload, and all three localized guide pages displayed the same option order and selection. The restored GitHub icon was preserved.
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
