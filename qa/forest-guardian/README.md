# Forest Guardian — stage 1 immutable canonical extraction

Base `main` commit: `52f637a00148e1580f3e8e281e95177ed12fcf99`.

The 12 copies in `original/` reuse **the exact same Git blobs** as the game runtime assets in `assets/canonical/`. No conversion, resizing, redrawing, or re-encoding was performed. The original 12 sources are not changed.

`manifest.json` records the original pixels, resolution, SHA-256 recorded in the project's canonical frame manifest, Git SHA, frame order, and the live per-frame weapon/armor anchor coordinates from `canonical-sprites.mjs`.

The renderer's source reference plane is 279x370. All frames are actually 370 pixels tall; frames 02 and 05 in each set are 278 pixels wide, others 279. The renderer places each original image at x=114, y=-22, width=260, height=346 in SVG world coordinates. The anchor conversion in the renderer uses the fixed 279x370 reference plane, not a per-frame rescale.

## Verify exact bytes

`node qa/forest-guardian/verify-extraction.mjs`

## Produce diagnostic original sheet

`python3 -m pip install Pillow` (if missing), then `python3 qa/forest-guardian/make-original-contact-sheet.py`.

The PNG sheet is 1536×864, six columns by two rows; ONLY the preview is scaled to fit each 256-pixel-wide cell. The 12 original PNG copies retain native sizes and exact bytes.

## Fitting gate

The outfit is NOT implemented or approved by this extraction commit. Asset `art/armor-designs/leaf.svg` is a standalone green leaf design already in the repo; it is not proof that it matches the separately approved green armor reference. Do not silently substitute a different costume or merge to main. The final 12 full-body pose-fitted transparent armor overlays and graphical/browser QA remain to be completed.
