# ALO4OBS 0.9.0 — Release notes draft

ALO4OBS auto-arranges panels so they never overlap.

- Place the Side column on either side; Main/Sub row swapping remains independent.
- Choose from ten approved Figma palettes, now applied to HTML in dark and light modes: Cherry, Orange, Banana, Lime, Aloe, Cotton Candy, Blueberry, Grape, Bubblegum, and Mono. Broadcast colors and media stay unchanged.
- Use matching horizontal Main/Sub and Side placement switches, native range-slider shapes with available 1:1 and 16:9 labels below the track and no white dots, collapsible settings sections with name-adjacent chevrons and whole-heading click areas, content-sized cards, and a gradient editor without the unused stop-count badge.
- Set each Sub minimum width to the square height left by a 16:9 Main at the selected gap; keep brand and action-button text, icon, and height consistent as the window narrows.
- Keep translucent cards, aligned section dividers, 8 px property-row outer padding, readable text, and keyboard focus cues. Hover exchanges text and background colors; range sliders use native shapes, while select fields use Lucide chevron-down icons with visible right padding.
- Show restore warnings below the shared header, make the full guide FAQ card invert and toggle on click, and group regional fill/stroke controls under subheadings. Panel selection outlines use the chosen accent outside the broadcast stroke, including when that stroke is disabled; the duplicate white preview highlight is removed.
- The distribution filename is ALO4OBS-v0.9.0.zip; personal exports remain OBS-settings.zip. The ZIP passed local checks.

## Updating from 0.7.x

Remove the old `OST ·` scene and its template sources/groups, extract the new package, configure the panels again, and load its OBS-script.lua. Preserve your original OBS scene collection and personal sources before removal; the new `ALO ·` namespace does not migrate the old scene automatically. Rollback is only supported within the same version.

## Included 0.8.0 changes

- Renames the current interface and OBS scene namespace to ALO4OBS / `ALO ·`, with Main, Sub 1–3, and Side 1–3 shared across all languages.
- Keeps Main enabled and replaces individual Sub/Side enable switches with count sliders; older disabled or non-contiguous settings normalize without changing exported `panelEnabled` keys.
- Adds a vertical Main/Sub row switch, full-width sliders, a selected-panel tag beside the section heading, and matching size/content selector widths.
- Places repository, issue and donation links on the left, product/version in the center, and page/language/theme/accent tools on the right; narrow screens fold both tool groups into menus.
- Uses five-step sliders for gap, fill opacity, blur and stroke width. Selecting 8 px with global stroke enabled asks before removing that stroke; cancel and regional overrides remain unchanged.
- Updates automatic language selection, localized guides and non-blocking manual Sub-width warnings.
- Uses one official Lucide icon set throughout the UI, immediate localized slider values, and consistent left-to-right strength ordering.

These are source release notes; a GitHub Release, tag and social post are separate steps. Approved themes are applied to HTML, and local source/package checks passed. See [QA evidence](QA.md) and the [work report](work-report-0.9.0.md) for tested scope and platform limits.
