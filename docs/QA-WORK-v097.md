# QA in Work — PR #5, 16 October 2026

## Attic correction
- The live house cutaway now selects a separate `port_rest_empty_attic.png`.
- Removed only the old helmeted kitten and its painted Z letters. Original scene, 6 sleep PNG frames, attack/hurt PNGs and ten swords retained byte-exact.
- Used imagegen precise-object edit, then composited only two local masks into the original scene with ImageMagick. Prompt: remove only the helmeted attic kitten and three Z symbols; restore empty pillow and wooden wall; preserve all rooms, blanket, furniture and waterfront.
- Pixel check confirms every pixel outside the two masks (+1px antialiased edge) is unchanged.
- Real Chromium 153, Playwright 1.62.1, 390×844 touch viewport: rest shows a single animated kitten in the existing attic. This is desktop mobile emulation, not a physical Android acceptance.
- `npm test`: 52 tests and art/pixel checks pass. `qa:balance`: 12 scenarios executed; balanced sword+armor reaches wave 100; exhaustive equipment purchasing stalls at 89 within 180 simulated minutes. No balance changes made.

Further browser checks and skeleton/golem acceptance remain in progress. No merge or release approval.
