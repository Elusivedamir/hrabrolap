# v0.7k — sensitivity of first-finger motor sizing (2026-11-11)

**Scope:** independent analytic follow-up to [v0.7j](../v0.7j/README.md) and [v0.7i](../v0.7i/README.md). **No new physical measurements, motor purchase, CAD geometry, powered test, FEA or human testing.** The input stroke 21.7613901229636 mm is CAD-derived, not measured. Hypothetical tendon forces are 1–4 N. This is a *bench finger without carried load*, not a 10 kg grip.

## Why this check matters
A larger spool radius reduces the necessary RPM but increases required motor torque. Therefore choosing a larger spool solely to make the 1.5 s target easier can make a weak inexpensive motor fail the torque screen. Conversely, a smaller spool can reduce torque demand but increases speed and may not physically fit the cable bend radius or anchor. Both constraints must be screened together.

## Reproduction
From this directory: `python uncertainty.py` and `python -m unittest -v test_uncertainty.py`. Python standard library only. The 12 local unit tests passed on 2026-11-11. The script evaluates 32 parameter combinations (4 hypothetical forces × 4 effective spool radii × 2 catalog motor models). It rejects NaN, negative force and invalid radii. It does not claim empirical performance.

Assumptions copied from v0.7j: Pololu 5139 220 no-load RPM, 0.94 kgf·cm extrapolated stall; Pololu 5141 150 RPM, 1.30 kgf·cm extrapolated stall; both at catalog 6 V; 1.5× torque reserve; torque screening limit 25% of stall; 80% no-load speed derate; linear speed–torque approximation; triangular speed profile (peak 2× average). **These are deliberately simple modeling assumptions, not a motor qualification, thermal limit, current cutoff, or proof of 1.5 s.**

## Selected numerical cases

| Hypothetical force | Effective radius | Pololu 5139 | Pololu 5141 |
|---|---|---|---|
| 3 N | 5 mm | conditional PASS (24.4% stall) | conditional PASS (17.6%) |
| 3 N | 6 mm | FAIL (29.3%) | conditional PASS (21.2%) |
| 3 N | 8 mm | FAIL (39.1%) | FAIL (28.2%) |
| 4 N | 5 mm | FAIL (32.5%) | conditional PASS (23.5%) |
| 4 N | 6 mm | FAIL (39.1%) | FAIL (28.2%) |
| 4 N | 8 mm | FAIL (52.1%) | FAIL (37.7%) |

At 5 mm effective radius, 21.7614 mm stroke in 1.5 s implies 27.71 RPM average and 55.42 RPM peak in the assumed triangular profile; at 6 mm, 23.09 and 46.18 RPM; at 8 mm, 17.32 and 34.63 RPM. At 4 N, R5, 5141 passes the **numerical** thresholds, but R5 geometry and minimum tendon bend radius have not been CAD-checked or physically built. It is NOT an approved replacement for v0.7j's R6.

## Findings / unresolved blockers
1. v0.7j's statement that 4 N fails both motors **at its two checked radii (R6 and R8)** remains true. Broadening the hypothetical search to R5 changes the numerical outcome, but not the physical readiness.
2. The radius used in calculation must be **effective cable centerline radius throughout the stroke**, not bare hub radius. Knot buildup, multilayer winding, cable wear, and guide friction are unmeasured. The model cannot decide the optimal spool without the real cable and anchor.
3. The 25%-of-stall rule, linear full-voltage speed–torque model, and triangular profile are not substitutes for thermal tests, dynamic acceleration, stall-current control, motor encoder calibration or an actual load-speed curve.
4. **No purchases approved.** Use common hardware, simple hand-cut bracket and replaceable fasteners for an unpowered guarded mock-up. The FDM drum may only be a shape prototype until load path is qualified.
5. Emergency mechanical release remains unproven even for one finger; power loss may not unlock the geartrain. Before powered operation, independent power disconnect, captive cable, guarded release and physical end stops must be verified. EMG contact and socket interface require separate electrical and professional review.

**Next experiment:** perform the three physical low-load measurements defined in v0.7j; then measure effective drum radius at start/end and tendon friction under the same fixture. Run this script with actual measured peak force and stroke, recheck fit and bend radius, then conduct guarded motor thermal/current and release tests **off-body**.
