# QA in Work — PR #5, 16 October 2026

## Attic correction
- The live house cutaway now selects a separate `port_rest_empty_attic.png`.
- Removed only the old helmeted kitten and its painted Z letters. Original scene, 6 sleep PNG frames, attack/hurt PNGs and ten swords retained byte-exact.
- Used imagegen precise-object edit, then composited only two local masks into the original scene with ImageMagick. Prompt: remove only the helmeted attic kitten and three Z symbols; restore empty pillow and wooden wall; preserve all rooms, blanket, furniture and waterfront.
- Pixel check confirms every pixel outside the two masks (+1px antialiased edge) is unchanged.
- Real Chromium 153, Playwright 1.62.1, 390×844 touch viewport: rest shows a single animated kitten in the existing attic. This is desktop mobile emulation, not a physical Android acceptance.
- `npm test`: 52 tests and art/pixel checks pass. `qa:balance`: 12 scenarios executed; balanced sword+armor reaches wave 100; exhaustive equipment purchasing stalls at 89 within 180 simulated minutes. No balance changes made.

Further browser checks and skeleton/golem acceptance remain in progress. No merge or release approval.

## Skeleton and golem
- Added editable SVG models and 48 articulated frames (2 species × normal/boss × attack/hurt × 6). Independent head, jaw/stone head, shoulders, elbows and knees; golem has impact chips.
- Both use the same 320×320 canvas as archived frames, with corrected idle scale. Crown is embedded on the moving head for boss and idle poses, so it cannot float at chest height or duplicate.
- All ten species tested in real Chromium for every attack/hurt phase 1–6, five HP hearts and ten boss waves. Screenshots inspected, including skeleton/golem bosses. The two new SVG drawings remain subject to user visual acceptance.
- Baseline browser run: all 22 scenarios passed assertions. Teardown exposed single-process Chromium closing all contexts when the first context closes; fixed by closing the browser once. Final suite rerun underway.
