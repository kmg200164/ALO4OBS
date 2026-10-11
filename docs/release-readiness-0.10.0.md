# Release readiness: 0.10.0

Date: 2026-10-11. Decision: keep version **0.10.0**. Status: **Verified candidate prepared; public publication remains on hold pending the checks below.**.

This is a release audit, not permission to publish. No commit, push, tag or release was performed. Existing broadcast scenes were not modified. Independent agents reviewed runtime/migration, browser/export, and package/privacy/licenses in parallel; the coordinator reviewed their evidence and implemented the explicitly requested responsive layout correction.

## Latest audit: current 0.10.0 scope and candidate

This section supersedes earlier candidate hashes and unfinished P1/P2 statements below. Curated streaming presets are deferred to **0.10.1** for the owner to prepare. Their selector, preview/apply/undo UI and temporary factory settings have been removed; layout switching, hidden layout snapshots and UI color presets remain. Private recovery fragments are excluded from distribution. The placement heading now leads directly into its explanation without the requested divider; column separators remain.

The owner-selected future preset icon is Lucide [Panels Left Bottom](https://lucide.dev/icons/panels-left-bottom), representing a prepared layout rather than a folder. No preset icon or feature is shipped in 0.10.0.

| Final check | Result | Evidence / boundary |
| --- | --- | --- |
| Complete HTTP Node suite | **305/305 passed, zero skips** | `../.qa-private/0.10.0/final-node-http.log`; final Lua fix included; subsequent CSS edit removed only a trailing blank line |
| Complete direct-file Node suite | **305/305 passed, zero skips** | `../.qa-private/0.10.0/final-node-file.log`; final extracted ZIP and final Lua source; 80.6 seconds |
| Python packaging and OBS models | **35/35 passed** | Includes logs-only OBS global error() behavior and failure recovery regressions |
| Independent browser matrix | **96 conditions passed, zero page errors** | HTTP/file, Bento/Overlap, KO/EN/JA, dark/light, 320/768/1278/1920 px; `../.qa-private/0.10.0/final-layout-qa/matrix.json` |
| Height UI / geometry | **139 actual UI states and 20,000 generated configurations passed** | All auxiliary height modes/sliders, wide columns and Bento controls; zero auxiliary intersections; direct-file alignment passed at five widths |
| Legacy migration / export | **Four original provider URLs retained** | Three unassigned URLs shown read-only in KO/EN/JA; export -> reload -> re-export retains values; unassigned URLs cause no requests. `../.qa-private/0.10.0/release-review-20261011/legacy-browser-report.json` |
| Fresh isolated native OBS 32.2.2 | **52 Apply calls; 2,164 assertions passed** | QA023 synthetic populated scene; final Lua SHA-256 `09adc12cc727444abff13e9a37f0b993b3a903e1203fc74f0a3d30fac47b57b9`; `../.qa-private/0.10.0/obs-live/release-rollback-20261011/final-report.json` |
| Native controlled failure | **Recovered and reapplied** | Fault inside actual clip/place after native placement; previous transforms, IDs, visibility, item count and config.js bytes restored; user filter/other synthetic scene preserved. OBS error() only logs, while assert(false, message) throws; four product rethrows/guards now use assert |
| Production preservation | **484/484 file hashes unchanged** | Before/after production OBS configuration hashes; only verified portable QA PID launched/stopped; no streaming or recording |
| Artifact | **2,487,419 bytes; 66 entries; CRC/allowlist/version/source transformation checks passed** | `dist/ALO4OBS-v0.10.0.zip`; SHA-256 `0a8764ca758e912e5308f1700945daaa0841b65f8b6d56879eddfd695e8a144b`; `../.qa-private/0.10.0/final-package.json` |
| Actual user Chrome | **Requested layout visibly verified** | Existing 1278 x 1248 window, saved configuration and yellow accent preserved; placement divider absent; permanent inspector hint; actions right aligned. No temporary tabs opened |
| Bounded public-history scan | **No candidate secret/token/provider-URL hits** | 119 ancestor commits, 439 unique text blobs, 24 historical ZIPs. 53 historical binary blobs not fully OCR-reviewed; `../.qa-private/0.10.0/final-history-privacy.json` |
| Documentation and notices | **Corrected and packaged** | Constraint wording, preset deferral, figma-squircle MIT index, stock icon inventory and user-confirmed generated quickstart artwork |

**Still unverified:** macOS, supported-version/device/plugin matrix, real capture/camera and authenticated personal provider renders, native OS save-picker/write flow, full-resolution privacy review of every historical image and exact upstream font/tarball provenance. The current native run required stopping only its verified hidden QA process after requesting normal close, so this run does not establish leak-free shutdown. Earlier leak-free evidence belongs to an earlier run. The original intermittent mutex crash is not uniquely attributed, and the reported height overlap was not reproduced by bounded checks; neither is certified impossible.

Source, release notes and neutral ZIP are prepared for review. No commit, push, tag or public release has been made. See `release-notes-0.10.0.md` for the unpublished draft. Older follow-ups below are historical evidence, not current scope or current artifact identifiers.

## Historical audit: earlier candidate (before safety-toggle relocation)

- Checkout: `W:/Project/ALO4OBS-development`, branch `codex/overlap-development` (inherited uncommitted development changes retained).
- Archive: `dist/ALO4OBS-v0.10.0.zip`, 2,481,142 bytes, 66 entries.
- SHA-256: `cf0ded4637e135382ddf2916555c12bfd2b51b4639a7d881a2d9ebae551644bd`.
- Builder verification, archive CRC and all extracted-entry byte comparisons pass.
- The earlier package/license and file-origin audits inspected SHA-256 `d4bf71836c243881bd7dcda3c8427cf2664a335c0e69420c52dbf276f5c766a8`. The later candidate changes editor layout CSS, the settings title and its stylesheet cache key; runtime migration and OBS mutation logic are unchanged. Do not identify the earlier artifact as the final candidate.

## Verified evidence

| Check | Result | Boundary |
| --- | --- | --- |
| Latest responsive toolbar/workspace and localization targeted tests | 23 passed, 0 skipped | Sequential HTTP browser tests; first failed English 320 px overflow was corrected and retested |
| Latest complete HTTP Node suite | 293/293 passed, 0 failures, 0 skipped | Sequential browser files; 64.6 seconds |
| Python packaging/OBS model tests | 30 passed | Model tests, not native hardware or native failure recovery |
| Earlier complete direct-file Node suite | 292/293 passed, 0 skipped | One alignment fixture cannot read an opaque file-origin iframe via contentDocument; independent frame-scoped proof passed all five widths, maximum error 0.0271 px. Do not report 293/293 file-origin success |
| Uploaded PNG to editor reload, personal export, extraction, Lua-installed runtime and file media rendering | Passed in both presets | Same uploaded image SHA-256 preserved; 7 Bento and 16 Overlap masks. Synthetic media. Native OS save-picker/write flow not exercised |
| Content settings in Korean, English and Japanese | 24 content branches per locale/preset matrix passed | This does not imply authenticated provider widgets render in OBS |
| Actual user Chrome, latest layout | Passed at unchanged 1278 x 1248 viewport | Two equal work areas (587.333 px each), right settings one column, no horizontal overflow, Settings / 設定 / 설정. ScrollY 793.333 gives preview top 96 px. User window and zoom were not resized |
| Actual Chrome tooltip samples | English/dark and Japanese/light passed; Korean restored | Current preset included; dark white background/black text and light black background/white text |
| Windows isolated OBS 32.2.2 native success evidence | Prior run: 50 Apply callbacks + 1 after restart; 2,311 assertions passed | Current layout/export/Lua logic independently matched to this evidence; no fresh native run in this audit. Synthetic sources and actual Lua Apply callback, not repeated native GUI clicks |
| Production preservation in that native evidence | 484 file hashes unchanged | This audit did not launch or mutate production OBS |
| Distribution inventory/version/dependency closure | Passed | Neutral config, allowlist, VERSION/internal version 0.10.0; static closure is not every CEF/platform runtime |
| Bounded source/archive privacy scan | No actual credential/private widget URL identified | Current working text, current HEAD, added candidate text, distribution/embedded runtime and two old public ZIPs. Not all Git history or full-resolution OCR of every image |
| License files and pinned Lucide glyph check | Passed | License inclusion does not establish every asset's provenance |

## Historical findings: resolved in the current candidate

- [x] **P1 resolved: preserve every legacy alert URL during migration and personal export.** Actual normalize -> settingsEntries reproduction with four synthetic 0.9.1 provider donation URLs retains only the first and deletes the others. References: `template/preview.js:127-128,160`, `template/pack.js:81`. Keep original connection data in an exported migration snapshot and make unmapped inputs visible. Acceptance: all original values survive migration, reload and re-export without overwriting already populated target panels.
- [x] **P2 resolved: roll back thrown Lua exceptions as well as false returns.** An injected error after a modeled generic Apply mutation escapes the transaction and leaves new config.js bytes. References: `template/OBS-script.lua:574-656,685-688`. Protect mutation and outer config transaction, restore snapshot/previous bytes, release held references and report restoration failures. Acceptance: exception, false return and success paths verified; a populated isolated native scene recovers after a controlled failed Apply. The latest internal native placement fault passed 52 Apply calls and 2,164 assertions.

Independent report: `../.qa-private/0.10.0/release-review-20261011/independent-code-review.json`. These are reproducible data-preservation/recovery defects despite passing existing test suites. Both findings were fixed and reverified in the latest audit below; the descriptions above record the original defects.

## Remaining release checks

- [x] Correct stale README/template README/CHANGELOG claims: intentional auxiliary overlaps, unconditional Manual Y pinning and heights never being reduced. State feasible saved Y retention, requested-value preservation, 128 px minimum and applied collision/bounds constraints. Main remains beneath auxiliaries.
- [x] Reconcile historical development notes with current fifteen-panel default and ten guide tips without erasing labeled history.
- [x] Add figma-squircle to THIRD-PARTY-NOTICES dependency index (its MIT license file already ships).
- [x] Establish setup-workflow.png creator/source/generation and redistribution provenance. User confirmed on 2026-10-11 that the illustration was generated by the assistant in another session as project artwork. The original generation record has not been independently recovered.
- [ ] Authenticate exact Inter font provenance/checksum and declared figma-squircle tarball hash if presenting a complete dependency provenance audit.
- [ ] Complete all intended public Git history and full-resolution documentation-image privacy review before publication; current scan is bounded.
- [x] Re-run final rebuilt candidate after blocker fixes: complete HTTP and direct-file browser suites, Python packaging/OBS models, ZIP CRC/allowlist/source parity/version/hash and dependency closure.
- [x] Fix the direct-file iframe alignment test to use frame-scoped inspection, then run the complete suite without masking failures.
- [ ] Test native OS save dialog/writing and ordinary ZIP extraction/opening from a new permanent folder.
- [ ] Native isolated populated scenes: Bento/Overlap transitions, legacy source preservation, failure rollback, repeated Apply/restart and no reference leaks. Hash production configuration before/after; never select production scene collections or connect to a broadcasting OBS instance.
- [ ] macOS validation and supported OBS minimum/version matrix; record exact tested versions and narrow claims if unavailable.
- [ ] Real capture/camera and personal provider widgets with the user's actual authorized display URLs/authentication and OBS render. HTML preview/model success cannot substitute for these checks.

The original intermittent OBS mutex crash's unique root cause is still unproved. Private preflight probes mitigate transient source/mixer event exposure, and the bounded native success run produced no new crash and ended with zero leaks; neither result certifies all OBS/plugin/device combinations.

## Evidence locations

- Package, license, privacy and document audit: `../.qa-private/0.10.0/package-license-audit-20261011.md` (older artifact).
- Earlier direct-file/package/media report: `../.qa-private/0.10.0/rc-browser/result.json` and `../.qa-private/0.10.0/rc-browser-package.json`.
- Latest responsive diagnosis: `../.qa-private/0.10.0/rc-workspace-overflow.json`.
- Latest browser handoff: `../.qa-private/0.10.0/rc-browser-handoff.json`.
- Latest HTTP suite log: `../.qa-private/0.10.0/rc-browser-node-latest-http.log`.
- Prior isolated native geometry/production preservation: `../.qa-private/0.10.0/obs-live/rapid-cause/geometry-20261011a/final-report.json`.
- Actual Chrome images: coordinator visualization directory, `release-workspace-ko.png`, `release-workspace-sticky-ko.png`, `release-tooltip-en-dark.png`, `release-tooltip-ja-light.png`. These are temporary QA evidence; product source and distribution remain in the project checkout.

No external provider messages, publishing or production OBS actions were performed. The current candidate is reviewable, not release-approved.

## Follow-up: preview safety switch relocation

2026-10-11: moved the existing safety-guide switch from placement settings to the preview footer, retained form association and change behavior, and hides it for Bento. Latest rebuilt archive SHA-256: `6c0dcea3daa1f3b20a694ff89b0b8febc905c1ab183144b67285bbf1dc11dd3c`. Builder/CRC pass; targeted style/workspace/count/Side/localization tests 38/38 pass, zero skips. Actual unchanged user Chrome confirms footer placement and off/on behavior. Full 293-test suite and native OBS were not repeated for this presentation-only follow-up. Earlier complete-suite evidence belongs to the audited candidate above. Release HOLD and both runtime blockers remain unchanged.

## Follow-up: safety guide toolbar button

2026-10-11 supersedes the footer relocation: safety guide is an icon-only toggle next to fullscreen, with aria-pressed state, existing localized tooltip and hidden Bento behavior. Official pinned Lucide 0.468.0 grid-3x3 glyph reused from upstream. Latest archive SHA-256 `ae690759b45849f8d55ff12757f995b6f6a7c938dbdcd6e11531da553fbeedf9`; build and CRC pass. Targeted style/workspace/localization/stock-icon tests 23/23 pass. Actual user Chrome off/on and Korean/English/Japanese labels verified. Full suite and native OBS not repeated; release blockers unchanged.

2026-10-11 icon-only follow-up: replaced grid-3x3 with official Lucide 0.468.0 triangle-alert. Stock glyph test, build and CRC pass; actual Chrome icon/tooltip verified. Archive SHA-256 `3a868133aa97f16b31cc3ee731c6640e12df9be4f4eecea12e3576a02b02e981`. No runtime logic changes or native OBS retest. Release HOLD remains.

2026-10-11 appearance follow-up: enabled safety-guide button keeps its icon in the selected accent color on a neutral background. Toggle/style test and build/CRC pass; actual Chrome computed SVG color matches accent after off/on. Archive SHA-256 `fd6b80d5b86d9dd37568f94952fecd0a300f5165abc5bdbed065be8b6fd2ddcb`. No native OBS retest; release HOLD unchanged.

2026-10-11 superseding contrast rule: safety toggle uses existing content-on-accent rather than theme-fixed black/white. Off: accent background/on-accent icon. On: on-accent background/accent icon. All 10 presets x 2 themes x 2 states verified in the existing browser regression; user Chrome light-yellow both states verified and original dark-purple restored. Build/CRC pass, SHA-256 `63411c39b3d869567883c134af0a7a97d1572c66528cd3b7b19e7527f0f47f21`. No global palette changes or native OBS retest. Release HOLD unchanged.


## Follow-up: common components and complete height-control journeys

2026-10-11 supersedes the previous safety state rule: ON uses accent background/content-on-accent icon; OFF uses content-on-accent background/accent icon. The next-action tooltip says turn off/on in Korean, English and Japanese. Ten palettes x two themes x two states tested, and actual unchanged user Chrome confirms ON purple/black with Korean turn-off tooltip. Original Korean/dark/purple preferences retained.

Shared fixes cover all three file controls (real keyboard-operable icon buttons and localized common tooltips), five gradient execution actions (pinned official Lucide icons, common tooltips), gradient surface/field separation and narrow selected-panel title wrapping. Demo's stale seven-panel/four-placement-key consumer now uses shared layout and shape helpers; background/frame/wallpaper document titles use ALO4OBS. Guides audited across 12 locale/theme/width combinations and settings across 24. Independent evidence: `.qa-private/0.10.0/cross-screen-components/audit.md` and component audit files.

Actual browser automation manipulated every Overlap panel's height auto/manual and slider bounds/midpoint, the three wide columns, all Bento Side controls and four Main aspect modes: 139 UI states with actual iframe rectangle measurements, zero auxiliary intersections or application errors. Seeded mixed height/Y/visibility/gap/width tests covered 20,000 configurations, zero intersections. The user's reported intermittent overlap was NOT reproduced; its root cause remains unresolved and no new geometry fix is claimed.

Builder, 65-file allowlist and CRC pass; archive SHA-256 `9941310ca04560a2d44c1a61f2f60ab6be5466110ee12e6f7082a84668a56611`. Python package/Lua model tests: 30/30 pass. First complete JavaScript run: 299 tests, 297 pass, two fixture failures after shared component changes; targeted correction results follow below. No production OBS action, commit, push or release. Native OBS/macOS not repeated. Existing release HOLD blockers remain unchanged.

Terminology discussion: Bento/Overlap are layout types; a true preset would store prepared layout/size/style settings. No terminology migration or new preset feature was implemented in this audit.

Final targeted follow-up: corrected only the scrolling/hover test sequence and extracted shared fileControl definitions in the VM harness. Both failed files rerun by root: 11/11 pass, no skips. Combined with the first full run, all 299 distinct tests have passing evidence; the full suite was not repeated. Independent component/tooltip/gradient/stock checks also pass. No product source changed after the final package hash above.


## Follow-up: layout terminology and actual streaming presets

2026-10-11: Bento/Overlap UI and localized guides now say Switch layout, retaining internal snapshot APIs for compatibility. Settings exposes an icon-only preset selector, localized preview dialog, explicit apply and one-step undo until the next edit/reload. Bento offers Standard/Main focus; Overlap offers Standard/Three bottom panels. Presets alter current layout geometry and shared panel appearance while retaining content URLs, local asset paths, background images and the inactive layout snapshot. No user settings are applied merely by opening/selecting/canceling the preview.

The shared apply path invalidates Undo after all edits, including gradient callbacks and panel drag; preset Apply establishes its backup after that path completes. Independent review confirmed Cancel has no draft writes, Undo restores geometry, gradient edits hide Undo, and six KO/EN/JA dialog states at 320/390px have no internal horizontal overflow or clipped action controls. Actual existing user Chrome verified all three languages and is left with the Korean preview dialog; its saved layout was not replaced with a preset.

Complete JavaScript regression: 302/302 pass, no skips/failures; Python package/Lua model tests: 30/30 pass. Final targeted preset/column checks after undo-path correction: 8/8 pass, no skips. Browser proof includes six preset apply/cancel/undo locale journeys, reload and exported ZIP geometry/content retention. New source-side tests also check all four preset factories for geometry separation, content/image preservation, inactive snapshot retention and input immutability.

Builder/allowlist/CRC pass. Archive SHA-256 `eeae6590b7485ee3aa306756e34735ec58641c4f8405eb6f79bb53a9add0f5b8`. No native OBS/macOS retest, production scene edits, commit, push or release. Existing release HOLD blockers remain unchanged.


## Publication approval draft: 2026-10-11

README and release notes now contain the exact proposed public 0.10.0 copy and GitHub Release download route. Changelog and bundled README were synchronized. The archive was rebuilt and CRC/allowlist/version checks plus all 35 Python checks passed; the browser UI/runtime bytes match the previously verified candidate. GitHub main still matches the inspected base, write permission is available, and no v0.10.0 tag or release exists. No remote mutation has been performed. The owner will review the README, release notes and localized Discord copy before authorizing commit/push/tag/Release creation. The intended publication is an ordinary v0.10.0 release with ALO4OBS-v0.10.0.zip attached; prior public ZIPs stay unchanged. Untested boundaries above remain disclosed.
