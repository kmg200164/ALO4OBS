# 0.10.1 correction verification

## Scope

Personal ZIP names reflect the actual layout selected at export start. Internal names and relative paths stay unchanged. Shared guide/settings navigation uses the current header layout. Guide return restores the same-page/same-source editor and valid selected panel; a first visit retains the chooser. Korean, English and Japanese instructions describe type-specific scenes and runtime folders.

## Checks

- Node: 288 passed, 23 existing broader UI checks skipped, zero failures. Python: 35 passed.
- Installed Chrome engine with isolated contexts: 24 conditions covering Bento/Overlap, Korean/English/Japanese, light/dark, 768/1920 px. Header position, order, style, localized tooltips, no horizontal overflow, editor/panel return and retained values passed.
- Narrow-screen guide language sequence Korean → English → Japanese → Korean → Settings retained Overlap, Panel 5-2 and source content.
- Real downloads Bento → Overlap → Bento matched Settings-Bento.zip / Settings-Overlap.zip, root/scoped configuration, media and type-specific runtime paths; ZIP inventory and CRC passed.
- Isolated Windows OBS 32.2.2: six real Apply callbacks passed exported geometry and browser runtime-path checks. The counterpart layout scene, legacy-name sentinel and synthetic original source were retained.
- Baseline guide return showed the chooser while values were still stored: editing context failure, not demonstrated data loss.
- Fresh folder and same-path reopen had no file warning. Missing browser file records or a synthetic carried draft at a different path produced the warning without changing the durable draft; background re-selection cleared it. The recording-time browser state is unknown.

## Preservation and boundaries

The existing 0.10.0 archive is retained unchanged: SHA-256 `413e1060a8f342c0ac1418c73009c4ba32c226d61eba98563fce4b7bde5e81c5`.

Production OBS and the user's recorder were not controlled or written to. Six production profile files retained their hashes. Two live production scene JSON files changed during the task while production OBS was running; their cause was not established. They contain no unique QA markers, and no rollback or overwrite was attempted. Byte-for-byte scene preservation cannot be certified.

The original recording and sensitive frames were not opened, uploaded or copied into tests. Only synthetic media and source names were used. The separate music widget's INACTIVE state was excluded.

macOS, real devices, authenticated personal widgets, native save-dialog interaction and broadcasting remain unverified. The native save-picker snapshot is covered by automated tests; actual downloads used the browser fallback. Repeated Apply success does not certify every device/plugin combination or resolve the original intermittent mutex crash.

## Delivery

Use a new `downloads/ALO4OBS-v0.10.1.zip` through the existing repository distribution, preserving older ZIPs. No tag, GitHub Release or curated streaming presets. Verify the final package against the builder's exact entries, version and CRC, then verify an actual anonymous README-button download against its SHA-256.
