# QA and device handoff

Development prerelease: 0.4.2. Automated checks do not establish live platform compatibility.

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

macOS QA is in progress. Use the independent repository on `dev`; do not develop in an old Vault checkout. The observations below are scoped to the tested Mac and do not establish complete platform compatibility.

1. Open `template/guide-en.html` or `template/guide.html` directly from the extracted files, then configure `template/preview.html`.
2. Verify file upload, settings ZIP export/extraction, and restoration after reopening the page.
3. In OBS, test a Shogun Showdown game-window capture alongside neutral image/video sources. Request only the specific macOS capture or camera permission needed for each test.
4. Add `template/obs-setup.lua`, select distinct individual video sources, apply twice, and verify rendering, rounded masks, locks, collapsed groups, and no duplicate sources.
5. Check capture/camera permission rejection and recovery, source changes, and safe preservation when a panel is disabled.

Keep personal widget links and exported settings private. Record the commit ID, device, observed result, and remaining limitations rather than calling untested platforms complete.

## Release

Continue fixes on `dev`. After the required checks pass, merge the verified version into `main`, tag the release, build `dist/OBS-Streaming-Template.zip`, and attach the neutral ZIP to a GitHub Release. No production-ready claim or release tag has been made yet.

## macOS evidence (2026-10-04, in progress)

Baseline: `a75e518`, version 0.4.1, OBS Studio 32.2.2. The independent clone matched `origin/dev` at handoff. Original OBS configuration was backed up and the backup CRC verified before starting; tests use a separate scene collection. The original scene-collection JSON remained byte-identical to its backup during this check. Private settings, fixtures, screenshots and backups stay outside this repository.

- The shared header now lists English, 한국어, 日本語 in that order. Fresh HTTP settings opened in English. Korean and Japanese selections survived reload, and all three localized guide pages displayed the same option order and selection. The restored GitHub icon was preserved.
- Automated checks: 111 JavaScript tests and six Python build tests passed. The deployment ZIP built successfully with neutral defaults.
- Chrome HTTP: a neutral PNG and a two-second MP4 were uploaded, previewed and exported using Save as ZIP. The actual export passed ZIP CRC checks, contained config.js, obs-settings.json, seven masks and both uploaded assets, and preserved the uploaded bytes. Extracting that export into source and built-package entry points restored both media panels. In the built-package browser preview, the restored MP4 had readyState 4 and was playing.
- A second export from an extracted package originally kept media paths but omitted their bytes (nine ZIP entries). Reproduced in Chrome and fixed: restored local assets are read into the export; missing assets now stop the download with a clear re-upload message. The corrected Chrome export has eleven entries, passes CRC and contains byte-identical PNG and MP4 assets. Direct-file re-export is still unverified.
- The actual exported source settings were applied in isolated OBS. Repeated application produced one template scene and unique source names. The screen showed seven panel positions, rounded media corners, outside strokes, locked generated items and collapsed groups. These observations do not yet complete source-swap, permission or populated-scene failure checks.
- Direct file launch: the user reported English startup before the menu fix. The browser connection explicitly blocks file:// access even after the user enabled extension file access. Agent verification of direct-file upload, export and restoration remains unverified; HTTP results do not substitute for it.
- Shogun Showdown launched through Steam after the user closed the active Windows Steam session. The game window was visible and listed in OBS macOS window capture. Selecting that window and confirming its rendered output remains pending; launch alone is not a capture pass.

Remaining: actual game capture inside the template, built-package OBS application, source swapping/disabling and duplicate rejection, capture/camera permission rejection and recovery, camera availability, populated-scene injected failure/reapplication, and cleanup with original-content comparison. No full transactional rollback or 1.0.0 readiness claim is established.
