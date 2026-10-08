# ALO4OBS 0.9.0 — Implementation and QA Report

2026-10-08. **Record of local candidate implementation and ZIP verification before the main push.**

## Work completed

- Applied the user-approved Figma accent and background colors for ten palettes across light and dark modes (20 combinations), with 21 semantic UI roles. The specified color values were not adjusted.
- Added Aloe as the default preset, theme-specific backgrounds, a left/right switch for the Side column, and the `ALO4OBS-v0.9.0.zip` download name.
- Restored translucent cards and the planned dividers. Settings cards resize to their content; layout, background, panel fill, panel stroke, and panel-specific details can be expanded or collapsed.
- Manual width and height sliders show available 1:1 and 16:9 positions as accent-colored labels below the track. Removed the white dots while keeping snapping. Each Sub panel's minimum width equals the row height remaining below a 16:9 Main at the selected gap, making that minimum square.
- Panel hover and selection use an exterior outline in the selected accent color. Removed the duplicate white preview highlight. Broadcast stroke settings remain independent.
- Restored 8 px outer padding on property rows and placed Lucide chevron-down icons inside select fields. Increased switch contrast. A clicked header no longer retains a persistent focus box, while keyboard Tab focus remains visible.
- Placed section chevrons beside their titles, using the text color and a 3 px stroke. Clicking the whole heading expands or collapses the section.
- In all three guides, each additional-information card changes hover color as a whole and opens or closes when its title or body is clicked. Links inside the body keep their normal behavior.
- `node --test tests/*.test.cjs`: **212/212 passed; 0 failures or skips**. Coverage includes 20 theme states, rendered settings and guides, FAQ cards, 16:9 ratio labels, flexible card heights, and button sizes at 320–1200 px.
- `python -m unittest discover -s tests -p 'test_*.py'`: **12/12 passed**. `git diff --check` found no errors.
- Isolated Chrome inspection confirmed selection-outline pixels and the position of the 16:9 label. There were no white dots on the track or white rims outside selected panels, and collapsing a card reduced its rendered height.
- `python build.py` created and self-checked the neutral distribution ZIP. The `dist` and `downloads` ZIPs were byte-identical. **48 ZIP entries, valid CRCs, version 0.9.0, and matching guide, settings, and changelog sources** were verified.
- Canonical ZIP at the time of this report: `W:\Project\OBS-streaming-template\downloads\ALO4OBS-v0.9.0.zip`; SHA-256: `13328E0BDFD73A85B85945834A377A09622056B815D3AD9E9667061DE43827DA0`
- When this report was written, no commit, push, tag, GitHub Release, or social post had occurred. Check the repository history for later publication status.

## Verification scope

This candidate was checked through isolated Chrome rendering over local HTTP and source/ZIP validation. Direct `file://` launch and ZIP save/restore, native OBS application, operating-system save dialogs, and macOS operation were not verified in this run. Native OBS evidence from earlier versions does not establish a 0.9.0 pass.

Earlier detailed reports are preserved locally at `.qa-private/0.9.0/historical-work-report-2026-10-07.md` and are not part of the public repository.
