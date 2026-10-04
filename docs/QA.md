# QA and device handoff

Development prerelease: 0.4.1. Automated checks do not establish live platform compatibility.

## Windows evidence

Confirmed during the current QA run: seven-panel rendering, live external widget output including translation, repeated OBS application, source locking, collapsed groups, source swapping, and preservation of sources removed from panels. These results apply to the tested Windows setup; they are not macOS evidence.

Remaining Windows checks, in order:

1. In Chrome, open `template/preview.html`, upload an image/video, save the settings ZIP, extract it beside the Lua script, and verify its actual OBS output. Earlier Chrome file-chooser automation timed out; an in-app browser upload is separate evidence.
2. Exercise a Lua apply failure in an isolated QA scene, verify the existing layout and original sources survive, then restore and reapply successfully.

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
