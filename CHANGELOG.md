# Changelog

## 0.9.0 — 2026-10-08 (local release candidate)

- Move the entire Side column left or right with a horizontal switch; older settings default to the right and keep their panel data.
- Apply the ten approved Figma UI palettes to HTML in dark and light modes: Cherry, Orange, Banana, Lime, Aloe, Cotton Candy, Blueberry, Grape, Bubblegum, and Mono. Theme choices do not change broadcast media or output styles.
- Replace the free UI accent color picker with named, keyboard-operable preset choices, swatches, and selection checks; preserve saved theme and migrate legacy arbitrary accent colors without deleting them.
- Name the public download ALO4OBS-v0.9.0.zip and update its references.
- Keep native range sliders; place Lucide chevron-down icons inside select fields with visible right padding and invert text and background colors on hover while retaining keyboard focus cues.
- Place restore warnings below the shared header, add fill/stroke subheadings, and make each guide FAQ card invert as one clickable surface.
- Restore translucent settings cards and aligned section dividers; return property-row outer padding to 8 px and strengthen switch contrast.
- Keep slider numbers close to their tracks in the chosen accent color, show available 1:1 and 16:9 labels beneath manual size sliders without white track dots, and let settings cards grow or shrink with whole-heading collapsible sections and name-adjacent chevrons.
- Size each Sub panel's minimum width as a square using the row height left by a 16:9 Main at the chosen gap; keep the brand, action text, icons, and button height steady on narrow screens.
- Keep panel hover/selection outlines outside the broadcast stroke in the chosen accent color. Remove the duplicate preview stroke highlight so no white rim extends beyond selection.
- The 0.9.0 source and distribution ZIP passed local automated and package checks. Native OBS and macOS verification are documented separately.

## 0.8.0 — 2026-10-07

- Rename the current product interface and OBS scene namespace to ALO4OBS / `ALO ·`.
- Use Main, Sub 1–3, and Side 1–3 as the shared panel-role names.
- Replace individual Sub and Side enable switches with panel-count sliders; exports keep the existing `panelEnabled` keys.
- Keep Main enabled, retain the Main/Sub row swap, and normalize older non-contiguous or disabled panel settings.
- Change gap, fill opacity, blur, and stroke width controls to five-step sliders.
- When 8 px is selected with global stroke enabled, ask before disabling that global stroke; cancel preserves it and regional overrides are unchanged.
- Update language selection, header navigation, and panel-size warnings for the current layout.
- Use official Lucide 0.468.0 icons throughout the UI; retain ISC and Feather MIT notices.
- Update slider values immediately while moving, with weaker values on the left and stronger values on the right; localize strength labels in English and Japanese.
- Align card names left, current values right, and the vertical Main/Sub switch to the right of its label.

## 0.7.1 — 2026-10-05 23:39:36 +09:00

- Set the minimum width of Panels 2–4 from their 16:9 reference row height (206 px in the default layout), capped by the available automatic width.
- Keep this minimum unchanged when Panel 1 switches to 21:9 or 32:9, without locking the actual panel width.
- Apply the same minimum in layout validation, numeric clamping and slider ranges; update the guides.

## 0.7.0 — 2026-10-05 23:20:19 +09:00

- Replace Panel 1's height slider with Auto, 16:9 (default), 21:9, and 32:9 aspect choices.
- Keep the selected aspect ratio when Panels 2–4 are disabled; Auto instead fills the remaining parent-frame height.
- Remove height controls from Panels 2–4 and normalize their saved manual heights to automatic, while retaining their width controls.
- Move the optional Buy Me a Coffee button and bug-report link directly after the README's core explanation.
- Update English, Korean and Japanese guides to describe the available dimensions and aspect choices.

## 0.6.0 — 2026-10-05 21:58:01 +09:00

- Add Auto / Manual height controls for every panel and width controls for Panels 2–4 while preserving automatic placement. Panels 1, 5, 6 and 7 keep automatic width and hide width controls.
- Keep the parent grid at three columns on the left and one on the right; size every panel independently without forcing Panel 1 to 16:9.
- Add synchronized number inputs and sliders with meaningful limits based on the active layout, parent boundaries and sibling space; clamp out-of-range values.
- Show eligible 1:1 and 16:9 slider marks recalculated from the other dimension, with optional snapping while dragging.
- Combine each axis label and Auto / Manual selector in one card header, with full-width sizing controls below and more internal spacing; preserve panel selection buttons when committing numeric input.
- Restore uploaded image and video files after reopening the same settings page, including their bytes in exported settings ZIPs.
- Keep the last saved draft intact when browser file storage is unavailable or restored files are missing.

## 0.5.2 — 2026-10-05 11:52:06 +09:00

- Remove manual resizing from the sample message field; scroll vertically when content exceeds its height.

## 0.5.1 — 2026-10-05 11:50:43 +09:00

- Save settings through the browser native file picker when available; retain download fallback for other browsers.
- Package the license as LICENSE.txt instead of an extensionless file.
- Native Windows extraction verification remains pending.

Dates with times identify the change's Git commit, in Korea Standard Time (UTC+09:00). Earlier entries retain their recorded dates; exact times are unavailable in this repository.

## 0.5.0 — 2026-10-05 11:40:05 +09:00

- Save a complete OBS package containing `OBS-script.lua`. Extract the ZIP and select that script from the extracted folder.

## 0.4.7 — 2026-10-05 11:32:35 +09:00

- Clarify the two ZIP files, settings extraction, and OBS script selection. The installation flow is replaced in 0.5.0.

## 0.4.6 — 2026-10-05 11:24:18 +09:00

- Rename the configuration page to `settings.html`; update navigation and package links.

## 0.4.5 — 2026-10-05 11:21:37 +09:00

- Hide panel selection and hover highlights in fullscreen preview; restore them on exit.

## 0.4.4 — 2026-10-05 11:19:45 +09:00

- Export JSON settings without JavaScript files; generate browser configuration locally in OBS.

## 0.4.3 — 2026-10-05 11:01:21 +09:00

- Synchronize the public download with the 0.4.3 test package.
- Highlight the actual panel stroke rather than a separate outline.

## 0.4.2 — 2026-10-04 22:42:16 +09:00 (development preview)

- Put English first in the language menu; preserve saved Korean and Japanese selections.
- Preserve restored image and video bytes when exporting again. Stop export if a required local asset cannot be read.
- Record partial macOS verification and remaining checks in `docs/QA.md`.

## 0.4.1 — 2026-10-04 21:07:41 +09:00

- Restore exported settings after replacing `config.js`. Source and built packages load neutral defaults before local settings; the demo remains neutral.

## 0.4.0 — 2026-10-04 21:04:20 +09:00 (pre-release review)

- Number all seven panels. Each supports None, OBS source, Web address, or Image/video. Show numbers in preview and hide them in OBS output.
- Select OBS sources independently; reject duplicate assignments. Replace fixed game/camera/chat roles and legacy source names with the `OST ·` structure.
- Lock generated scene items by default. Control panel fill and stroke independently; draw strokes outside content.
- Add fullscreen exit guidance and a return button. Replace platform logo badges with text; exclude favicons with uncertain redistribution rights.
- Preserve disabled panel inputs; validate their connections only when enabled. Show errors with the panel number and selected language.
- Preserve user OBS sources as hidden, locked items before replacing content or removing groups. Native verification of the new Lua script and collapsed groups remains pending.
- Code, Chrome, and OBS review was ongoing; this entry did not represent a verified release.

## 0.3.3 — 2026-10-04 (time unavailable)

- Hide placeholder promotion and notification cards in OBS; keep real media and events visible.
- Standardize new scene and source names. Hide internal capture scenes; retain existing user scenes.
- Include the MIT license and KMG copyright notice. Third-party assets retain their own terms.

## 0.3.2 — 2026-10-04 (time unavailable)

- Localize the preview title in Korean, English, and Japanese (QA030-04).
- Initialize background gradients at 135 degrees, from `#303030` to `#909090`. Keep the solid default `#000000` and preserve saved colors and explicit gradients (QA030-05).

## 0.3.1 — 2026-10-04 (time unavailable)

- Associate accessible control names with row labels; include current color values (QA030-01).
- Log fullscreen failure diagnostics: error, permissions, user activation, focus, and visibility. Successful native fullscreen remained unverified (QA030-02).
- Localize custom-panel buttons and iframe accessibility labels. Verify Korean, English, and Japanese in Chrome (QA030-03).

## 0.3.0 — 2026-10-04 (time unavailable)

- Use five choices for fill opacity, blur, and stroke width; normalize imported numeric values to the nearest choice.
- Keep solid and gradient strokes fully opaque. Normalize gradient stops and legacy `borderOpacity`; preserve fill transparency.
- Arrange the four guide steps in one column with numbered titles. Keep the frame diagram; remove card background blur.

## 0.2.5 — 2026-10-04 (time unavailable)

- Use neutral demo players, public defaults, and a solid background; remove personal sponsor, tournament, and camera references.
- Exclude six personal media assets from distribution; retain originals locally.
- Standardize the product name and `OBS-Streaming-Template.zip`. Keep `OBS-settings.zip` for user settings.
- Simplify preview actions to Show sample, Clear samples, and View full screen. Show one sample in the selected panel; clearing preserves settings. Remove automatic sequences and duplicate buttons.

## 0.2.4 — 2026-10-04 (time unavailable)

- Standardize content section headings and explain selecting an existing game capture in OBS.
- Replace the personal demo name with a neutral example. Validate references, archive contents, and CRC before replacing the distribution ZIP; preserve the previous ZIP on failure.
- Record unresolved asset redistribution rights and code licensing. The asset allowlist was not yet approved for public release.
- Repair English help text, links, and accessible names after language changes.
- Fix camera refresh state, connections for disabled media/widgets, and stale source selections blocking OBS application.
- Restore exported configuration. Prevent resets and new uploads from overwriting settings during file reads or ZIP generation.
- Update gradients immediately and insert stops into the correct interval after crossing existing stops. Use 8px layout spacing. Native camera, OBS, macOS, and visual Chrome checks were outside this independent review.

## 0.2.3 — 2026-10-04 (time unavailable)

- Replace frame-selection chips with a shared diagram showing game/custom bands and chat/translation/camera frames. Add a color legend and light-theme inversion.

## 0.2.2 — 2026-10-04 (time unavailable)

- Remove custom HTML page backgrounds. Use `#1E1E1E` for dark mode and `#E8E8E8` for light mode; retain the header accent.
- Set Korean button weight to 600 and English/Japanese to 500.
- Name settings archives `OBS-settings.zip`, distribution archives `KMG-streaming-template.zip`, and their root folder `streaming-template`.
- Update preview immediately; remove the duplicate apply button.

## 0.2.1 — 2026-10-04 (time unavailable)

- Simplify layout to parent and child frames. Fix custom-panel order to 1, 2, 3; normalize older settings and divide available width evenly among enabled panels.

## 0.2.0 — 2026-10-04 (time unavailable)

- Add a shared header, Figma icons, theme/accent controls, background settings, loading feedback, and consistent button spacing.
- Align the 1920 x 1080 output and 16:9 preview across seven areas. Connect layout calculations and configuration validation to OBS Lua.
- Add panel activation and hierarchical layout. Recalculate available space when panels move or become disabled; support deselection and hide inactive style controls.
- Share gradient controls across backgrounds, fills, and strokes; support multiple stops, positions, opacity, angles, and legacy colors.
- Add Inter, system font fallbacks, and Korean, English, and Japanese guides.
- Request camera video only after explicit connection. Show connection and device errors; release streams on disconnect or preview exit. Physical camera verification was not recorded.
- Update setup and onboarding guidance.
- Validate gradient stops during export. Package allowlisted files with neutral `config.js` and a `VERSION` file; preserve legacy OBS settings compatibility.
