# ALO4OBS 0.10.0

## Two layout types

- **Bento:** arrange all panels separately.
- **Overlap:** place up to 15 auxiliary panels over full-screen Main, across five fixed columns.

Switch layout from the header. Each layout retains its content and settings; Main and global appearance are shared.

## What's new

- Overlap column enable switches, 1–3 panel counts and **Wider width** on columns 1/3/5. Temporarily hidden neighbors retain their settings.
- Automatic stack alignment and manual height/Y controls, including vertical preview dragging. Applied values fit panel order, gaps, bounds and a 128 px minimum while preserving saved requests.
- A sticky preview beside compact settings, consistent icon buttons and Korean/English/Japanese tooltips. The panel-settings section always shows where to select a panel.
- An editor-only safety guide, shared panel corners, fill, stroke and shadow settings, and separate image URL/file fill choices.
- Simplified guides, exclusive on/off switches and consistent controls across both layouts.

## Data preservation and Apply recovery

- Preserve every legacy connection URL through migration and re-export; show unassigned URLs for reassignment.
- Restore the prior layout and config.js after false returns or thrown Apply exceptions, and report recovery failures.
- Retain hidden panels and both layout snapshots when saving personal packages.

## Install or update

Download **[ALO4OBS-v0.10.0.zip](https://github.com/kmg200164/ALO4OBS/raw/refs/heads/main/downloads/ALO4OBS-v0.10.0.zip)** and extract the entire archive. Open **settings.html**, configure panels and save **OBS-settings.zip**. Extract that entire personal ZIP into a permanent folder, add its **OBS-script.lua** in OBS, select your sources and Apply.

For updates, back up the complete old application folder, OBS scene collection and source mappings first. Follow the [README update procedure](https://github.com/kmg200164/ALO4OBS#how-to-update); moving only the Lua script is insufficient.

## Tested scope

- 305 HTTP and 305 direct-file browser tests; 35 Python checks.
- 96 language/theme/layout/width combinations; 139 actual height-control states and 20,000 generated geometry configurations.
- Isolated Windows OBS 32.2.2: 52 Apply calls and 2,164 assertions, including controlled failure, rollback and reapplication. Production configuration hashes remained unchanged.

macOS, real camera/capture devices, personal widget authentication and native save dialogs remain unverified. The original intermittent mutex crash has not been uniquely attributed.

Curated streaming presets are planned for **0.10.1** and will be prepared by the project owner. UI color themes remain available.
