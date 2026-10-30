# Existing UI rules

Use the existing `settings.html` layout and components. UI changes extend that system; they do not introduce a separate skin, new palette or unrelated control styling.

## Direction decided 2026-10-30 (not implemented yet)

The owner is rebuilding the visual baseline in Figma (page `design-system` of file `PHYDbj9r5xSIRrcTWECX0D`). Until that page exists, do not treat the older Figma pages (`sample`, `html`, `theme color`) or `tests/fixtures/figma-theme-tokens.json` as the target for new UI. The current code still has the ten-palette theme and header toggles.

- One UI accent (aloe). Light and dark follow the operating system setting (`prefers-color-scheme`). The ten accent presets and the header palette and light/dark buttons are to be removed. Broadcast panel colors are a separate setting and stay.
- Bento and Overlap are to be merged into one model: the background is a panel, and the only difference is whether it is used as the main source. The first screen keeps only the first-use question, with no layout chooser.
- Header: name and version on the left; four buttons (guide/settings, language, bug report, donation) on the right. No GitHub button and no layout button in the header.
- The Composite Blur plugin install is the first step of the guide, because most streamers use Overlap.

Do not start these changes before the owner's Figma baseline exists; read it first, then rewrite this document and the token file from it.

## Sources and owners

- The project's 0.8.0 instructions require existing CSS tokens and components for new UI, with no new hardcoded colors or fixed-coordinate layout. Its 0.8.1 instructions define light/dark semantic color roles and component states.
- `tests/fixtures/figma-theme-tokens.json` records user-reviewed Figma variables from file `PHYDbj9r5xSIRrcTWECX0D`, review frame `51:215`. `tests/theme.test.cjs` checks those values against the implementation. Do not replace reviewed colors with a newly chosen palette.
- `template/header.css` owns primitive/semantic UI colors, the shared header and icon tooltip presentation. `template/header.js` owns navigation and hover/focus tooltip behavior.
- `template/preview.css` owns editor layout and controls. Preset/import/download actions reuse its action buttons and spacing tokens.
- `template/guide-base.css` holds the existing three guides' common styles, extracted without changing their component values. `template/guide-layout.css` consumes shared semantic colors and spacing. Both offline and Pages guides use these files.

## Typography

All settings/guide UI text and controls use **Inter first**, through `--ui-font-family`. Keep the packaged `assets/InterVariable.woff2` and its license. Load it locally; do not introduce a font CDN or rename another font to Inter. Code/file labels inherit the same UI font.

Inter has no Hangul or Japanese glyphs in the bundled build. Keep explicit system fallbacks for unsupported characters. On the tested Windows Chrome, actual platform font inspection reported Inter Variable for Latin, Malgun Gothic for Korean and Yu Gothic UI for Japanese. A disconnected `file://` test loaded the packaged Inter in settings and all three guides. This verifies local font availability; it does not promise that an uncached public website can load offline.

The general agent manual does not name Inter as a universal font. The selected-font preservation rule and the user's explicit Inter request apply here. Unsupported characters must remain readable, and fallback must be reported accurately.

## Guide navigation

The settings destination is the existing header gear link. Its localized accessible label and tooltip are **설정 열기 / Open settings / 設定を開く**. Show the tooltip below the icon on pointer hover and keyboard focus. The link remains keyboard-operable and navigates to settings.html. Do not add a duplicate settings button in the guide body.

## Verify changes

Run the theme/header tests, `tests/guide-design.test.cjs` and the hosted web workflow checks. Check the actual rendered guide at desktop and mobile widths in Korean, English and Japanese, including light/dark states. Keep user media/source settings separate from editor UI theme changes.
