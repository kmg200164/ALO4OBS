# Overlap width controls

Status: implemented in the 0.10.0 development build, following the approved two-basis design.

All five named columns remain stable. Columns 1, 3 and 5 have a Wider width switch: off uses the 5-column basis, on uses the 3-column basis. Wide column 1 suppresses 2; wide column 3 suppresses 2 and 4; wide column 5 suppresses 4. The wider anchors remain left, center and right.

Suppression preserves saved enabled choices, counts, content, styles, heights and Y positions. A suppressed column returns to its saved enabled state only when no enabled wide neighbor occupies it. Columns 2 and 4 always use the 5-column basis. The safety guide stays at its original 5-by-3 coordinates.

Global Panel gap controls spacing; Panel corners controls radius and smoothing. Select panels directly in the preview. The desktop editor uses equal-width, sticky preview and OBS settings areas, with two settings cards per row. Sample controls are removed; native sources are checked in OBS.
