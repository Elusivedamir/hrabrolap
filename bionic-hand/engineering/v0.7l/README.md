# v0.7l — cable bend and single-layer spool geometry screen (2026-11-11)

**Scope:** follow-up to v0.7k, using v0.7j's **CAD-derived, not measured** 21.7613901229636 mm stroke. A pure geometric screen; no manufacturer-approved minimum bend radius, cable strength, fatigue, friction, anchoring, CAD integration or physical test.

## Method and reproducibility
`python cable_screen.py` and `python -m unittest -v test_cable_screen.py`; Python standard library only. 10/10 unit tests passed locally after correcting an initially wrong test expectation. The initial test assumed the 21.76 mm stroke would exceed one turn at hub R5, cable d1.2; actual calculated turn count is **0.618**, so that expectation was false. Corrected test now asserts the calculated outcome. This illustrates why tests must not simply hard-code an unsupported guess.

Cable centerline radius = bare hub radius + half cable diameter. One-layer ideal turn count = stroke/(2π centerline radius). Bend D/d = 2×centerline radius / cable diameter. These do NOT represent a cable-maker's safe D/d specification; for braided polymer and wire cables the required bend ratio, minimum pulley radius and fatigue life differ substantially.

| Cable diameter | Bare hub radius | Centerline radius | Turns for 21.7614 mm | Geometric bend D/d |
|---|---|---|---|---|
| 0.8 mm | 4 mm | 4.4 mm | 0.787 | 11.00 |
| 1.2 mm | 4 mm | 4.6 mm | 0.753 | 7.67 |
| 1.2 mm | 5 mm | 5.6 mm | 0.618 | 9.33 |
| 1.2 mm | 6 mm | 6.6 mm | 0.525 | 11.00 |
| 1.2 mm | 8 mm | 8.6 mm | 0.403 | 14.33 |
| 1.5 mm | 5 mm | 5.75 mm | 0.602 | 7.67 |

**Critical integration error caught:** v0.7k labels R5/R6 as *effective* radii, while this screen's R5/R6 are *bare hub* radii. They are NOT directly interchangeable. For a 1.2 mm cable and desired **effective R5**, bare hub must be R4.4. Re-run motor screen with the actual cable centerline radius and measured spool diameter before comparing candidate motors.

## Why 'less than one turn' is not sufficient
At bare R5 and d1.2, the cable sweeps 222.5° and leaves 137.5° nominal angular remainder. A safe captive anchor, initial preload, guards, termination bend, clearance to adjacent finger cables, flange wall, cable exit guide and any required reserve travel all consume space. **No anchor has been designed or approved.** A nominal 3.2 mm channel (d1.2 + 1 mm each side) is an illustrative width only; it is not a proven clearance or flange design. A single-layer winding calculation does not rule out cable crossing, slip or accidental second-layer build-up.

## Low-cost prototype and acceptance gates
Use standard stock shaft, washers, replaceable bolts, hand-cut bracket, simple FDM *non-load-bearing* gauge for an **unpowered, unloaded, guarded** spool fixture. Measure bare hub diameter, cable diameter and effective radius at start/end; mark 0°/end rotation; record stroke with a ruler/caliper. Inspect anchor retention without any hazardous load, then obtain cable maker's bend/fatigue/termination specification. No final purchase is authorized. Do not assume a knot, glued anchor or FDM groove can carry a 10 kg target load.

**Not done:** 3D cable exit path and five-finger packaging, dust boot, torque/thermal validation, tension/abrasion and cycles, safe mechanical release, 10 kg load path, EMG and medical/electrical/socket review. This is not a wearable or powered design.

Next: design a captive, replaceable **unloaded** cable termination and simple hand-drilled bracket; inspect cable-maker bend limits and demonstrate 21.76 mm stroke without multilayer winding on a guarded bench mock-up.
