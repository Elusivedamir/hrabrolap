# v0.7n — replaceable tendon anchor: independent envelope rejection screen (2026-11-11)

**Scope:** follow v0.7m's angular budget with an independent conservative cross-sectional fastener-head and axial-stack arithmetic screen. **NOT 3D CAD**, not a selected screw or real anchor, not FEA, not a physical test, not a 10 kg or wearable rating.

## Reproduction
Run `python anchor_envelope.py` and `python -m unittest -v test_anchor_envelope.py` with Python stdlib. On 2026-11-11 local run: **13/13 tests PASS**. Inputs are illustrative, not measured: CAD-only tendon stroke 21.7613901229636 mm; cable Ø1.2 mm; bare hub radii 4/5/6/8 mm; angular reserve 30°, access 60°, guard 15°; head diameter 5.4 mm; assumed assembly error 0.5 mm **per side**, clearance 0.5 mm **per side**; illustrative metal plate 2 mm, washer 0.8 mm and head height 3 mm each side; hypothetical slot 7 mm and available z 9 mm.

| Bare hub R (mm) | Angular remainder (°) | Slot margin (mm) | Axial stack (mm) | Axial margin (mm) | Screen |
|---:|---:|---:|---:|---:|---|
| 4 | -16.051 | -0.4 | 9.6 | -0.6 | FAIL |
| 5 | +32.351 | -0.4 | 9.6 | -0.6 | FAIL |
| 6 | +66.085 | -0.4 | 9.6 | -0.6 | FAIL |
| 8 | +110.019 | -0.4 | 9.6 | -0.6 | FAIL |

**Finding:** positive 2D angular margin in v0.7m is insufficient: the illustrative fastener head needs 7.4 mm of access width; a two-sided 2+2×(0.8+3)=9.6 mm dry stack exceeds a hypothetical 9 mm bay. These are screening assumptions; the 9 mm bay is NOT a confirmed actual CAD dimension. Actual v0.6c moving-boot envelope already fails around other fasteners; no inference of five-finger fit is permitted.

## Fabrication decision
Do NOT make or buy a tension-bearing cable anchor yet. For an **unloaded, power-free demonstration** only, use an ordinary metal strip cut and drilled by hand, stock washers and captive screws, a soft dummy cord and a vise/bench clamp. Printed PETG may only serve as a shape/alignment gauge. Avoid crushed cable under a bare screw, knots or glue as an unverified loaded termination. Keep hands out of the release path and both cord ends captive. One-handed access requires actual fixture tests.

## Blocking work
1. Obtain measured head/washer/shaft sizes and actual 3D drum, MCP, five-finger and boot models; test continuous motion and accessible screw-driver path.
2. Select maker-rated tendon and termination, check bend-life, pull-out, fatigue and unequal load on a guarded bench fixture.
3. Integrate independent guarded controlled release and jam scenarios; prove safe release without power.
4. Confirm dust/water, EMG, electronics, socket interface and professional safety assessment before any body contact.
