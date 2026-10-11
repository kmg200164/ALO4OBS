# ALO4OBS 0.10.0 development verification

Status: local development candidate, not published. Base: main commit `74d590284242d2e14a82a862e62a9328d7bfd85e`. The public download remains 0.9.1. No commit, push, tag or Release was created for this development work.

## Implemented scope

- Open settings with the Bento / Overlap chooser and return through Switch layout. Bento retains its four-column, seven-panel layout; Overlap uses five columns and three rows, with full-screen Main plus 15 independent panels.
- Use the Figma names `Panel 1-1` through `Panel 5-3`, ordered by column and then row. Each has independent content, regional fill/stroke and shadow. Fresh settings enable all 15 panels with the 5-column width basis, Manual heights and Y positions; five Enabled switches control visibility and count sliders support 1–3, enabling rows 1 through the selected count. Media pages, exported configuration and Lua source selectors use the same names.
- Save each layout's gap, enabled panels, size and placement independently. Retain both panel sets' content/overrides across switching and reopening; Main and global appearance are shared. The stored union contains 22 unique panel keys. Existing 0.9.1 settings restore as Bento. Earlier six-panel Overlap development data is copied to corresponding new panels only where the new value is absent; original fields remain preserved.
- Show all 15 reference cells in the Overlap chooser and safety guide. Red: columns 1, 3 and 5 in rows 1 and 3. Yellow: all five columns in row 2. Others are green. Warnings use the actual panel rectangle intersecting these reference cells and never block editing, export or Apply. The game-dependent guide is advisory and never appears in broadcast output.
- Add radius 8 / 16 / 24 / 32 / 48 px and a three-step smoothing slider for 0 / 60 / 100%. Fresh macOS settings choose 60%; other platforms choose 0%. Saved values take precedence. Shared geometry clips HTML content, paints exterior strokes/selection and generates native-source alpha masks.
- Add a global panel-shadow section and individual shadow controls within the regional-style override, alongside fill and stroke. With the override off, panels inherit the global shadow and retain their dormant local value; explicit local zero disables shadow when the override is on. Shadow strengths: off or blur 8 / 16 / 32 / 48 / 64 px, centered at x=0/y=0 with black at 25% opacity. Overlap Main remains full-canvas and square, with fill, stroke and shadow suppressed.
- Layer Overlap Main below auxiliary fills/shadows and auxiliary content. Lua accepts fractional Overlap coordinates, applies the active layout, and hides inactive layout groups while preserving their source settings and mappings. Repeated application reuses groups.
- Replace arbitrary Overlap placement with fixed named columns and default top-to-bottom stacking. Panel 2-3 is the third panel in column 2. Auto height shares remaining column space; Manual sets pixels, constrained by enabled peers. An overfull legacy manual column is fitted during rendering without deleting stored height values. Hidden panels retain content, styles and sizing. Remove the duplicate panel picker; select visible panels directly in the preview. Main has a clickable tag outside the preview.
- Correct legacy development placement collisions during normalization, using one shared layout calculation for preview, package and OBS. The earlier report incorrectly attributed the collision to intentional user movement; legacy six-panel migration can reproduce it. Before normalizing an old browser draft, retain its raw value once under `obs-overlay-before-fixed-columns`. If backup access/quota fails, restore the content for session-only editing and ZIP export without replacing the original durable draft.
- Place the icon-only reset button in the right-aligned Settings action group; remove the Preview sample-reset action; invert their fill and ink on hover. Place Switch layout in the header right group with the stock Lucide arrow-left-right icon, retained after reset and layout changes. Chooser corners are 4 px; visible horizontal, vertical and exterior gaps match the previous narrowest Overlap vertical gap.
- Preserve the 0.9.1 themes, progressive guides, regional controls, support links and update-preservation instructions. Update the development introduction and panel instructions in Korean, English and Japanese guides. Canonical README, bundled README and this report are English.

- Add independent Auto / Manual Overlap Y coordinates with numeric and slider controls and vertical preview dragging. Columns stay fixed; feasible Manual Y is preserved; unsafe requests are clamped during rendering without deleting the stored request. Cancelled drags restore the previous height and position. Main and Bento cannot drag. Both snapshots, hidden panels and exported geometry retain the position. Auxiliary collisions are prevented; fixed safety cells show color without panel numbers.

## Earlier requested changes retained

- Complete: light/dark translucent surfaces and increased separation; pure white/black selects and text fields; Cherry/Bubblegum light-mode accent ink; accent guide hover with inverse highlighted filename pills.
- Complete: borderless slider rails and readable ratio labels/snapping; Bento lower-panel square minimum at the 16:9 Main reference; stable header/action sizes at narrow widths; internal select padding and stock Lucide icons.
- Complete: individual fill/stroke controls consistent with global controls, override separator/spacing, named collapsible sections and automatic card height; quick-start illustration followed by six collapsed essential cards and eleven collapsed tips in all three guides.
- Complete: all fifteen independent Overlap panels, warning-only safety cells, smaller/equally spaced chooser cells, toolbar placement, filled reset controls, five column-count sliders and global/individual shadow behavior.
- Completed bounded Windows OBS Apply/reapply, rapid repetition and saved Manual Y checks below. Removed the confirmed transient public-probe mixer event path. The original native mutex fault was intermittent and has not been uniquely reproduced; actual macOS and the other runtime paths remain unverified.

## Design reference

[ALO4OBS Figma](https://www.figma.com/design/PHYDbj9r5xSIRrcTWECX0D/ALO4OBS?node-id=0-1): sample page `0:1`, Bento `12:51`, Overlap `80:145`.

The Overlap reference uses 1920 × 1080, gap 24, column origins 24 / 403.2 / 782.4 / 1161.6 / 1540.8, width 355.2, row origins 24 / 376 / 728 and height 328. The 5-column basis retains fractional 355.2 px widths; the optional 3-column basis uses 608 px widths, anchored left, center and right. The user's later red-cell correction takes precedence over an older Figma fill value.

The smoothed curve implementation vendors figma-squircle 1.1.0 under MIT, with its notice included. Geometry tests establish internal consistency; exact pixel equality with Figma and rendering equality in OBS CEF are not established. No game screenshot from the design was included in the distribution.

## Validation results

| Check | Result and boundary |
| --- | --- |
| Full JavaScript suite | 273 passed, 0 failures, 0 skipped. Sequential execution with `KMG_THEME_RENDER_URL`, `KMG_SETTINGS_HTML` and `KMG_RUN_OVERLAP_COLUMN_UI=1`; latest log: `obs-live/rapid-cause/js-fixed.log`. |
| Shared fixed-column geometry | All 5,120 combinations of five gap values and five 0–3 column counts remained bounded, ordered and free of active auxiliary collisions. Auto, Manual, mixed heights, unused space, overflow and legacy collision migration were checked. |
| Actual Chrome editor and ZIP regressions | Fresh settings start with Main plus five panels. Expanded counts expose all 15 named panels. Panel 2-3 stays in column 2; its 200px Manual height survives counts, switching, reopening and ZIP export. Hidden content/styles survive. Preview selection and 0/60/100 smoothing save actual values. |
| Manual position and drag regressions | Actual isolated Chrome checked Y number/slider limits, fixed Y after upper-height/count/gap changes, hidden-panel/preset/reload retention, vertical drag with unchanged column X, no draft writes during movement, one write on release, and cancellation rollback with no write. Three imported panels at Y=1079 retain stored height=500 while rendering allocated height=328 and bounded Y=752 after the 2026-10-11 alignment update; all labels remain distinct, bounded and clickable. Unrelated style edits preserve saved sizes. Screenshot: `overlap-position-regression.png`. |
| Direct-file and platform checks | Actual Chrome `file://` against extracted `files/settings.html`, alpha masks and runtime export passed. The final extracted candidate also passed all three new Manual Y/drag/bottom-edge preservation tests directly through file://; log: `position-file-tests.log`. Windows and emulated Mac defaults/saved values were checked; platform emulation is not an actual macOS check. Test-only fallback downloads bypass native OS Save pickers. |
| Theme/guide/toolbar/shadow checks | Actual installed Chrome verified three localized guides, themes, guide hover, narrow toolbar layouts, filled reset controls, stock transition icon, and inherited/individual shadows. These are included in the full JavaScript suite above. |
| Python packaging and modeled OBS tests | 28 passed; latest log: `obs-live/rapid-cause/python-fixed.log`. Instrumented Lua APIs checked group reuse, inactive Overlap group visibility, source/filter/mapping preservation, fractional transforms, count changes and package inventory. This is not live OBS verification. |
| Independent code review | A separate agent reviewed placement/presets/export and identified a backup quota/access failure. It was corrected: restored content remains available while automatic persistence is blocked until a reload can back up the old draft or the user explicitly resets it. A follow-up independent review identified Main drag entry, unintended stored-height changes and hidden labels during collisions; Main is excluded, stored heights clamp only on explicit edits, and labels remain clickable within the canvas. A read/write failure regression verifies original storage remains unchanged. |
| Actual visible Chrome review | Reloaded the existing draft without resetting counts, heights or content. Panel 1-2 retains its 200px height and was switched to Manual position at its existing Y=403. The new number/slider are visible. Safety cells have no panel numbers. No browser window size was changed. Screenshot: `overlap-position-live.jpg`. |
| Settings ZIP/overlay runtime | The actual browser export includes 16 masks/layout entries, 22 content entries and both snapshots. Tests explicitly enable all 15 auxiliaries before rendering the reopened runtime. The automated suite models the Lua embedded-JavaScript/config installation stage. Separate live Windows OBS checks are documented below. The personal ZIP does not contain the settings editor. |
| Build / CRC / references | Build verified 65 files plus the root launcher, 66 ZIP entries. CRC, package references/allowlist and private-settings exclusion passed. Git diff whitespace check passed. |

Private logs and screenshots are retained under `.qa-private/0.10.0/`, excluded from distribution. `overlap-position-live.jpg` is the actual existing Chrome draft; `overlap-position-regression.png` is an isolated manual-position regression. Earlier fixed-column screenshots remain historical evidence. Test browser contexts and owned helper scripts are temporary. The original main checkout remains clean; production OBS scenes were not modified.

## Live Windows OBS verification

Executed with OBS Studio 32.2.2 copied from the installed application into `.qa-private/0.10.0/obs-live/portable/`, using portable mode and fresh QA010/QA011 profiles and scene collections at 1920 x 1080. No production profile or scene collection was loaded. Sources were sixteen synthetic colors (Main plus fifteen auxiliary panels), with a QA Sentinel scene and an existing QA source filter. No streaming, recording, camera, game capture or personal widget was started.

Actual Chrome exports produced `initial.zip`, `changed.zip` and `restored.zip`. The initial configuration set Panel 2-2 to Manual Y=650 / height=120 and Panel 2-3 to Manual Y=890 / height=100. The changed configuration reduced the upper panel height from 200 to 100, changed the gap from 24 to 48 and reduced column 2 from three panels to two; the restored configuration enabled its third panel again. These changes used the actual editor and generated package geometry.

The paced run separated five real Lua Apply operations by eight seconds: initial, reapply, changed, restored and final reapply. All 651 assertions passed. Nested native-source positions retained Y=650 and Y=890; the hidden third panel retained its transform and resumed at Y=890. All sixteen group and child IDs were preserved, with twenty top-level scene items and no duplicate groups. Source settings, the QA User Filter and the Sentinel source's original position (51, 73) were preserved. Fractional X coordinates and bounds matched export within 0.01 px. The actual output screenshot was inspected: `obs-live/Screenshot 2026-10-10 23-11-36.png`.

After a restart with the actual product script registered in Tools > Scripts (without the test harness), all sixteen source mappings were present in the real dialog. The Apply button was clicked at 23:14:41.981 and again at 23:14:58.853 on 2026-10-10. Both calls completed without a crash. OBS was closed normally. All 120 post-shutdown assertions passed. The persisted scene retained all source/group UUIDs, group transforms, source settings/filters, twenty top-level items, sixteen mappings and both Manual Y values. Evidence: `obs-live/gui-reapply-report.json`, `gui-reapply-scene.json`, `gui-reapply.log` and `gui-reapply.jpg`. Production OBS configuration was hashed before and after: all 484 files were byte-identical, with no files added or removed. The isolated process was closed; diagnostic files and the portable copy are retained for crash investigation.

**Historical stress failure:** the first harness called Apply five times in one timer callback, approximately 400 ms total. Transform assertions passed, but OBS then crashed in the audio-mixer/source-attachment stack (`obs_volmeter_attach_source`, `VolumeMeter`, `AudioMixer`). The crash report remains `obs-live/portable/config/obs-studio/crashes/Crash 2026-10-10 23-08-34.txt`; the original harness and report remain `rapid-harness.lua` and `rapid-report-before-crash.json`. The paced results above predate the following fix and do not establish that rapid Apply was safe.

## Rapid Apply investigation and regression

The preflight checks created and immediately released public Browser, Mask and Canvas Probe sources. In the original-source 50-Apply trace, every Browser Probe published a public source-create notification with audio capability and active audio. At the end of the same Lua callback, all 100 public Browser/Canvas probes had already disappeared from UUID lookup while frontend notifications could still be queued. The private-probe comparison published zero temporary-probe notifications. This establishes an unnecessary short-lived source/frontend lifetime path matching the subsystem in the original crash stack.

Only the three temporary probe calls now use `obs_source_create_private`; the existing plugin checks, release calls, failure handling and persistent output-source creation remain intact. The API exists in the minimum supported OBS 30.1 as well as tested 32.2.2. Official implementation references: [OBS source creation](https://github.com/obsproject/obs-studio/blob/32.2.2/libobs/obs-source.c), [frontend mixer notifications](https://github.com/obsproject/obs-studio/blob/32.2.2/frontend/widgets/AudioMixer.cpp) and [OBS 30.1 source creation](https://github.com/obsproject/obs-studio/blob/30.1.0/libobs/obs-source.c).

The new preflight regression failed before the change on the success, missing-mask and missing-color paths because public probe events were queued. It now passes, including cleanup on all failure exits. Full suites after the fix: JavaScript 273 passed, zero failures/skips; Python 28 passed. The development ZIP was rebuilt, checked for CRC/inventory and extracted into the private review folder. Actual Chrome exported new initial, changed and restored personal ZIPs under `obs-live/rapid-fixed/`; the real generated Lua, including installed browser runtime, was used without substituting the source template.

The final exported product passed two fresh isolated OBS 32.2.2 runs, each with 50 consecutive Apply calls and 835 assertions. One traced source events; the other omitted the tracer. Both remained alive after a ten-second settling callback, with no additional crash report. Height/gap/count changes, hidden-panel restoration, Manual Y=650/890, group/child identity, filters, original source settings and Sentinel placement passed. Evidence: `obs-live/rapid-cause/fixed-export50/report.json` and `fixed-export50raw/report.json`.

QA018 was then restarted with only the actual exported product Lua registered in Tools > Scripts. All sixteen saved source mappings were visible. Five actual GUI Apply calls completed: 23:48:16.704, 23:49:35.591, 23:49:36.084, 23:49:36.590 and 23:49:37.090 on 2026-10-10. The final four were approximately 0.5 seconds apart. Actual rendered output was inspected and captured as `obs-live/rapid-cause/fixed-export50raw/gui-output.jpg`. OBS closed normally with zero reported memory leaks. All 122 final assertions passed: source/group UUIDs, source settings and filters, twenty top-level items without duplicates, sixteen mappings, Y=650/890 and heights=120/100 were retained. All 484 production OBS files were byte-identical to the pre-test manifest. Evidence: `fixed-export50raw/final-report.json`, `before-restart-scene.json`, `gui-reapply-scene.json`, `gui-reapply.log` and `production-after.json`. The isolated OBS process was closed; diagnostics and portable QA data remain outside the distribution.

**Causal boundary:** removal of the public-probe notification path is confirmed and independently reviewed. The original unmodified rapid tests also sometimes completed without a crash; the exact native mutex fault was not consistently reproduced or uniquely traced. `obs_volmeter_attach_source` has a null-source guard, so a missing UUID alone does not prove that particular access violation. The bounded passing tests support this mitigation; they do not prove the absence of every rapid-Apply crash on all systems.

## Column alignment and selection update — 2026-10-11

Overlap Main now has a clickable, keyboard-operable tag outside the preview, next to the Preview reset control. Its old inside label is hidden. Height/width Auto / Manual controls in both presets, and Overlap position mode, use toggle switches. The automatic column alignment is a vertical Top / Center / Bottom slider: it offsets the complete height-allocated stack without changing its gaps. Manual-position panels remain pinned. Alignment is retained in both snapshots and the exported settings.

Manual Y ranges from 0 to floor(1080 minus the allocated height). Increasing height clamps Y instead of truncating height. Existing imported out-of-bounds Y remains stored until the user changes position or size; rendering and export geometry clamp it safely. Hidden panel data and unrelated edits remain preserved.

Fresh validation: all 280 JavaScript tests passed with zero failures or skips (`alignment-node.log`), and all 29 Python packaging/modeled-Lua tests passed (`alignment-python.log`). All five new alignment/position regressions also passed directly through file:// against the extracted candidate (`alignment-file.log`). New actual Chrome regressions check Main pointer/Space selection, both presets' size switches, two-panel Center/Bottom alignment, height-aware Y bounds, preset switching, reload and exported settings. An independent read-only review found no blocking issues in geometry, persistence or control wiring. The actual existing Chrome tab was reloaded without changing its window size; filled mode switches, the vertical slider and external Main selection were inspected. Its original counts and Manual Y draft were retained. Evidence: `overlap-alignment-live.png`.

The initial rendered check caught a CSS conflict that made mode-switch tracks transparent beside numeric fields; the targeted selector now keeps them filled, with a regression assertion. The vertical slider also uses a vertical progress track.

This update has not been applied in real OBS. The previous isolated Windows OBS results above concern the earlier Manual Y/private-probe build; the new alignment behavior is verified in the browser and modeled Lua, not a fresh native OBS run. Production OBS scenes were not touched. macOS and other remaining boundaries still apply.

## Package identity and public archive preservation

| Archive | Bytes | SHA-256 |
| --- | ---: | --- |
| Local `dist/ALO4OBS-v0.10.0.zip` | 2,481,640 | `8c8be3455cf6a44daf784555b54a3ff24e4b210614f3bc404cff59298c850b9c` |
| Existing `downloads/ALO4OBS-v0.9.0.zip` | 955,839 | `3328e0bdfd73a85b85945834a377a09622056b815d3ad9e9667061de43827da0` |
| Existing `downloads/ALO4OBS-v0.9.1.zip` | 2,425,643 | `05a481e9068981bd38c04922d118838d24debed07f8e90536f83aa563cb1ef18` |

Hashes were calculated from the files after the final runtime build. Historical 0.9.0 and 0.9.1 ZIPs were not rebuilt or overwritten. The 0.9.0 value matches the corrected historical report. [CHANGELOG](../CHANGELOG.md) records this new-feature scope as 0.10.0 development, not additional 0.9.1 patch numbers.

## Remaining verification and approval

Remaining for 0.10.0: unique confirmation of the original native mutex fault and broader rapid-Apply environments, actual macOS/OBS CEF, real capture/camera devices, personal widgets, OS save dialogs/manual extraction, and failure rollback. Windows OBS 32.2.2 synthetic-source Apply/reapply, restarted GUI Apply and saved Manual Y are verified within the bounded scope above. Earlier 0.9.1 live OBS results remain historical evidence only.

Review the chooser, independent panel settings, game-specific safety guide, preset persistence and radius/smoothing/shadows. Local automated/browser/package checks, two 50-Apply Windows OBS runs and restarted GUI Apply pass after the private-probe mitigation. The causal and platform limits above prevent an unrestricted production-readiness claim. Committing, pushing, tagging, publishing and any production scene changes require separate approval.


## Style controls update — 2026-10-11

Move the vertical alignment slider to the far right and use the accent color over its full track. Replace boolean override, shadow and safety-guide checkboxes with accessible switches. Individual fill choices now include Image URL and Image file as mutually exclusive radio choices before opacity. Switching choices retains both sources and dormant uploaded files for reopening and ZIP export. Unused individual gradients initialize white to black; explicit saved gradient stops remain unchanged.

The existing Chrome tab visibly confirmed alignment, switches, radio order and gradient previews without resizing its window. The temporary individual override was restored to its original off state. Evidence: `.qa-private/0.10.0/style-controls-live.png`. Browser tests verify image choice switching and upload/reload retention; a package regression verifies retained sources and malformed-image rejection. Native OBS was not rerun for this control update, and production scenes were not touched. The development package remains local and unreleased.

Final control-update validation: all 282 JavaScript tests passed with zero failures or skips using sequential execution with both rendered-test flags enabled (`style-controls-node-final.log`). All 29 Python tests passed. Build verified 65 payload files plus the root launcher (66 ZIP entries), and ZIP CRC validation returned no corrupt entry. The final package identity is listed above. The first all-browser parallel run encountered shared-state interference; the isolated new regression and subsequent complete sequential run both passed. No commit, push, tag or publication was performed.

Safety-guide adjustment: Panel 1-2 and Panel 5-2 are yellow for secondary game UI (in-game chat and server warnings). All five middle-row guide cells are now yellow. Placement remains advisory and unrestricted. The chooser and preview share the updated classification; 24 targeted tests passed, with one optional rendered test skipped. Chrome chooser colors were visually confirmed. Development ZIP rebuilt; native OBS was not rerun.

Chooser appearance adjustment: Bento and Overlap thumbnails now use identical borderless 25% white fills. Actual Chrome appearance and responsive gaps/corners at 1440, 760, 390 and 320 px passed the rendered tests. Editor safety colors remain unchanged. Panel merging is deferred: the user clarified that wider columns, rather than merged panels, are the intended outcome. This was superseded by the five fixed column controls and theme-aware neutral chooser treatment described below.


## Fixed column widths and neutral chooser follow-up

The five named columns now have independent Enabled switches, 1–3 count sliders and Auto / Manual widths. Auto columns divide leftover canvas width; Manual values stay fixed when a peer is disabled. All-manual columns may leave trailing space. Disabled columns retain counts, panel content, regional styles, heights, Manual Y and widths. Legacy zero-count columns start disabled. Imported oversized width totals are fitted for rendering without replacing their stored values. Safety cells remain the original fixed 5 × 3 grid; Main remains full-canvas. Export retains raw row flags plus derived `panelRenderEnabled` so Lua and browser renderers hide a disabled column without losing its row count.

Chooser thumbnails are neutral in both modes: Bento uses a black canvas with white panels in dark mode and a white canvas with black panels in light mode; Overlap uses the opposite palette. Bento Main is opaque, auxiliary tiles are 40% opacity, and Overlap Main is the full thumbnail backdrop. Card hover keeps the accent color. The inexpensive delegated worker changed chooser CSS and its rendered test; root integrated and verified both live themes.

Validation: 285 Node tests passed with every optional browser test enabled and no skips; 30 Python tests passed. New checks cover width allocation, all 32 column-enable combinations at five gaps, legacy zero counts, retained drafts, height and Manual Y, visible controls/reload, export visibility and modeled Lua apply/change/reapply preserving all sixteen groups and source settings. Actual Chrome confirmed both chooser themes and the new column controls. Native OBS was not rerun for this follow-up; the earlier native mitigation evidence is not a live validation of the new width controls. Production OBS scenes were not touched. No commit, push or publication was performed.


## Fixed Overlap startup grid — 2026-10-11

Fresh selection and active-preset reset now enable all five columns and all 15 auxiliary panels. At gap 24, Manual column widths are 355 / 355 / 356 / 355 / 355 px; heights are 328 px and Manual Y positions are 24 / 376 / 728 px. This fills the original five-column frame symmetrically without changing the width validation schema. Auto widths, heights and positions remain available. Existing explicit saved choices and inactive presets are preserved.

The current user Chrome tab restored an earlier test draft with columns 1, 2 and 4 disabled; it was not a clean startup. Its debugger connection failed during a backup-download attempt, so the draft was left unchanged. Headless Chrome verified a fresh grid, unchanged peer Y after reducing a height, unchanged peer widths after disabling a column, restoration of customized drafts, reset, Bento switching and exported geometry. Screenshot: `.qa-private/0.10.0/overlap-default-grid.png`. The complete Node suite passed 287 tests with no skips; 30 Python tests passed, including modeled Lua Apply/reapply. Native OBS was not rerun for this defaults update. No production scene, commit, push or release was changed.

### Settings section organization — 2026-10-11

Overlap column controls now have separators and consistent spacing between columns. Global sections are ordered Background, Panel layout, Panel fill, Panel stroke, and Panel shadow, with matching Korean, English, and Japanese headings. Syntax checks and 10 targeted tests passed; one optional browser test was skipped. The rebuilt development ZIP was extracted for review, and the existing Chrome settings tab visually confirmed the collapsed section order and spacing. OBS was not re-tested for this presentation-only change.

### Collapsed controls and disabled-column geometry — 2026-10-11

All property sections now start collapsed in both presets and individual editors. Switch preset identifies the current layout in Korean, English and Japanese; long labels wrap within narrow screens. A separator now appears between Show safety guide and Column 1.

Previously, width allocation packed only enabled columns from the left. All five slots now participate in width allocation and retain their horizontal space when hidden. Preview strokes now use the same derived enabled flags as content and hit areas, suppressing disabled-column borders. Saved per-column widths and panel settings remain intact; no draft reset is required.

Verification: all 32 column visibility combinations retain visible column coordinates through export. A fresh headless browser verifies collapsed startup, Column 5 alone with two panels, exactly two auxiliary strokes, reload, settings export, both presets and language changes. The full Node run passed 288 of 289 tests; its one narrow-toolbar failure was fixed, then the toolbar and new visibility tests passed all 3 targeted checks. Python passed all 30 tests, including modeled native-source Apply/reapply and unchanged peer geometry. The existing Chrome tab visibly confirms Panel 5-1 and Panel 5-2 on the right with no disabled-column borders. The development archive was rebuilt and CRC-verified. Native OBS and production scenes were not touched; no push was performed.

### Panel corners section — 2026-10-11

Move corner radius and smoothing into a separate, initially collapsed Panel corners section immediately after Panel layout. Rename the 100% option Maximum smoothing in all three UI languages. Width behavior is unchanged. Five slider tests and the rendered section/visibility regression passed; the existing Chrome tab visually confirms the new section and label. Rebuilt and CRC-verified the development archive; no native OBS test or push.

### Panel gap label — 2026-10-11

Rename Panel layout to Panel gap in Korean, English, and Japanese. Width and position behavior is unchanged. The next-session design proposal is recorded in `overlap-controls-proposal.md`; it requires review before implementation. Five slider checks passed and the development archive was rebuilt and CRC-verified.


## Approved width basis and compact editor — 2026-10-11

Replace arbitrary Overlap width controls with a Wider width switch in columns 1, 3 and 5. Off uses the 5-column basis; on uses the 3-column basis. Wide column 1 suppresses 2; wide column 3 suppresses 2 and 4; wide column 5 suppresses 4. Suppression preserves saved enabled flags, counts, content, styles, heights and Y positions. A column returns to its saved choice when no enabled wide neighbor occupies it. Legacy pixel widths remain stored but no longer control geometry. Preview, configuration export and modeled OBS transforms use the same derived visibility and layout. Exhaustive width tests cover 1,280 gap/basis/visibility combinations.

Remove sample display, sample clearing and sample inputs. Desktop uses equal-width preview and OBS settings areas. The preview sticks at 96 px while scrolling. Section titles remain left and action buttons right on the same line. The selected panel inspector spans the full settings width at the top; global and column cards share the next row. Work areas stack at 1400 px and below; cards stack at 760 px and below. Explicit panel selection reveals an offscreen inspector; dragging does not trigger that scroll. Disable scroll anchoring in the settings grid so inserting an inspector during a drag does not move the page.

Verification: all 291 JavaScript checks passed with zero failures/skips, including rendered package tests and selection/drag scroll regressions; all 30 Python checks passed. Actual existing Chrome confirmed inline toolbars, equal work-area widths, sticky preview and the full-width inspector. The development ZIP contains 65 payload files plus the launcher, with CRC verified. Current log: `.qa-private/0.10.0/width-workspace-node.log`. Native OBS, production scenes and macOS were not exercised in this change. No commit, push, tag or publication was performed.


## Guide and geometry audit — 2026-10-11 (current candidate)

This section supersedes earlier audit geometry limits above. Active auxiliary panels never overlap each other; Overlap Main remains underneath them intentionally. Minimum active height is 128px. Manual Y is bounded by the outer gap and ordered neighbouring panels. Feasible manual coordinates remain unchanged; unsafe stored requests are retained while rendered/exported geometry is constrained safely. Integer allocation covers mixed automatic/manual heights.

All three guides remove language-switch instructions, redundant translated button aliases and duplicated explanation. They describe the wider-width switch, current header layout switch, safe Y limits and minimum height. Full extraction, distribution/personal ZIP distinction, complete-folder backup and recovery instructions remain. Intro-to-Quick-start spacing is 32px. Actual existing Chrome was inspected in Korean, English and Japanese; dynamic switch accessible names were additionally verified after English-to-Japanese switching. This is not a claim that every provider or platform was tested.

Current distribution SHA-256: D4BF71836C243881BD7DCDA3C8427CF2664A335C0E69420C52DBF276F5C766A8. Version remains 0.10.0. Adding a preset alone does not establish a stable 1.0.0 compatibility contract. No commit, push, tag or publication is authorized by this audit.

Final automated checks: 293/293 JavaScript tests, zero skips/failures; 30/30 Python checks. Independent geometry review covered 10,080 combinations. Fresh isolated OBS report `obs-live/rapid-cause/geometry-20261011a/report.json` records 50 Apply calls, 1,982 passed assertions, zero failed assertions, and a successful settling callback. Checks include minimum height, ordered non-collision geometry, native manual Y retention, source/group identity, filters and Sentinel placement.

Restart validation added one real OBS Apply callback and 329 passing assertions. The isolated run and restart total 51 calls. Before/after SHA-256 inventories of all 484 production OBS configuration files match exactly; no new crash report, and isolated OBS exited normally. Native tests used synthetic color sources and the actual Lua Apply callback, not a new GUI-button click sequence. Real camera/capture/provider widgets and macOS remain unverified. Final evidence: `obs-live/rapid-cause/geometry-20261011a/final-report.json`.

## 2026-10-11 release scope correction

Bento and Overlap are layout types; their chooser action is Switch layout. Curated streaming presets and their Settings selector are deferred to 0.10.1. The user will prepare the preset configurations; 0.10.0 does not offer the temporary Standard/Main focus/Three bottom panels choices or their Apply/Undo controls. UI color presets and internal layout snapshots are unchanged.

This supersedes earlier unconditional Manual Y and height-preservation claims: auxiliary panels never intersect, full-screen Main remains behind them, and applied height/Y fit available space while preserving panel order, gaps, outer margins and a minimum height of 128 px. Saved requested height/Y values are retained through unrelated edits; rendered values can differ.

### Setup illustration provenance confirmation

On 2026-10-11, the user confirmed that `template/assets/setup-workflow.png` was generated by the assistant in another session as project artwork. The original generation session has not been independently recovered. Missing owner confirmation is no longer a release blocker; this user confirmation does not establish an independently recovered generation record.


## Publication review: 2026-10-11

The owner selected Lucide panels-left-bottom for the future streaming-preset action because it resembles their Bento arrangement. Presets remain deferred to 0.10.1; no new preset action ships in 0.10.0. Public README, changelog and release notes were prepared for approval using the current two-layout workflow and bounded verification results. Publication remains conditional on the owner approving these drafts.
