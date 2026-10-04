# QA and device handoff

Development prerelease: 0.4.1. Automated checks do not establish live platform compatibility.

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

macOS live execution is not yet verified. Clone this repository separately and check out `dev`; do not merge it into an old Vault checkout.

1. Open `template/guide-en.html` or `template/guide.html` directly from the extracted files, then configure `template/preview.html`.
2. Verify file upload, settings ZIP export/extraction, and restoration after reopening the page.
3. In OBS, use a neutral capture or camera source and grant the required macOS permissions yourself. Running a game is not required.
4. Add `template/obs-setup.lua`, select distinct individual video sources, apply twice, and verify rendering, rounded masks, locks, collapsed groups, and no duplicate sources.
5. Check capture/camera permission rejection and recovery, source changes, and safe preservation when a panel is disabled.

Keep personal widget links and exported settings private. Record the commit ID, device, observed result, and remaining limitations rather than calling untested platforms complete.

## Release

Continue fixes on `dev`. After the required checks pass, merge the verified version into `main`, tag the release, build `dist/OBS-Streaming-Template.zip`, and attach the neutral ZIP to a GitHub Release. No production-ready claim or release tag has been made yet.
