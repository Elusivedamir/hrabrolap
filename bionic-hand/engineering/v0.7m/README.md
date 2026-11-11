# v0.7m — replaceable cable anchor: angular packaging rejection gate (2026-11-11)

**DESIGN SCREEN ONLY.** No cable termination was built, no load or fatigue test was performed, and no load-bearing anchor is approved.

Following v0.7l, screen whether a captive replaceable cable termination could even have angular room on a one-layer drum. Assume a hand-serviceable termination outside the winding arc, with captive standard fasteners and a hand-cut bracket; do not specify a tension-bearing clamp until the cable maker's approved termination and pull-out strength are known. An ordinary screw crushing polymer or wire cable, a knot, glue, and FDM-printed clamps are NOT presumed safe under load.

### Reproducible model
Run `python anchor_screen.py` and `python -m unittest -v test_anchor_screen.py` from this directory. 12/12 stdlib tests passed locally on 2026-11-11. This is a **2D angular budget**, not 3D CAD, FEA, physical anchoring, or a verified minimum bend ratio.

Inputs: CAD-derived unmeasured stroke 21.7613901229636 mm; cable diameter 1.2 mm; effective centerline radius = bare hub radius + 0.6 mm. Hypothetical angular allocations: **30° reserve**, **60° anchor access**, **15° exit/guard**. These sectors are *design assumptions*, not dimensions derived from hardware.

| Bare hub radius | Cable sweep | Remaining angle after all assumed sectors | Result |
|---|---:|---:|---|
| 4 mm | 271.05° | −16.05° | REJECT (negative budget) |
| 5 mm | 222.65° | +32.35° | Conditional angular space only |
| 6 mm | 188.91° | +66.09° | Conditional angular space only |
| 8 mm | 144.98° | +110.02° | Conditional angular space only |

**Important:** a positive angular remainder does not prove anchor clearance, manufacturability, strength, wrap retention or cable-maker-approved bend life. Larger hubs also increase required motor torque; re-run v0.7k with actual centerline radius. A 60° access sector may be physically too small for a screw head and one-handed tool.

### Low-cost concept to test (UNLOADED ONLY)
- Stock metal hub/shaft and washers; captive fasteners; hand-cut/drilled metal mounting strip; optional FDM *alignment gauge only*.
- Route a sacrificial soft cord into an accessible, guarded, removable service termination; do not rely on an unverified pinch clamp for any significant tension.
- Use bench vise with soft jaws, screw tray and oversized accessible tool handle to test one-handed service. Keep fingers outside the winding and pinch path.
- Mark drum angular zero and end; verify the complete measured stroke, spare winding sector, and clearance for the guard and dust boot, then record discrepancies.
- Cable manufacturer minimum D/d, termination method, verified rated breaking/pull-out strength and dynamic fatigue must precede any loaded test. No final cable/anchor purchase approved.

### Acceptance gates (all NOT RUN physically)
A1 real 3D anchor and exit path with screw-head envelope; A2 actual stroke measurement and no second-layer winding; A3 one-handed unloaded service with captive parts; A4 guarded physical pull-out and cyclic fatigue by suitable test personnel after rating verification; A5 independent emergency release even on downstream jam; A6 four-finger uneven-load case, fifth-finger packaging, dust boot; A7 motor, electronics, EMG isolation and socket safety review. No 10 kg or wearable claim.

Next: build and check an actual **3D non-load-bearing anchor envelope**, using selected off-the-shelf fastener head dimensions and five-finger spacing. Do not confuse the hypothetical angular clearance with a safe tendon anchor.
