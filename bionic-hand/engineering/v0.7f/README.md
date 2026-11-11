# v0.7f — independent one-hand emergency control feasibility audit (2026-11-11)

**New negative finding, arithmetic only.** This independent review evaluates the published **v0.7d upstream screw cassette**, not the newer **v0.7e joint-side screw**. The latter reports **17.14 turns** for 60° release per finger, making the user-interface problem more acute. No physical tests, no new CAD, no user trials.

## Published v0.7d geometric parameters and screen

| Item | Value |
|---|---:|
| Stroke / M6×1 lead | 8 mm / 1 mm per revolution |
| Required manual turns | **8** |
| Knob radius | 19 mm |
| Ideal tangential hand path | **0.955 m** |
| 2-second hypothetical actuation | **240 rpm** |
| 5-second hypothetical actuation | **96 rpm** |
| 10-second hypothetical actuation | **48 rpm** |
| Index increment, six holes | **0.1667 mm** |
| Cable eccentricity reaction moment at hypothetical 281.8 N | **3.382 N·m** |
| Guide reaction per guide in ideal two-point statics, 22 mm spacing | **153.7 N** |

2, 5 and 10 seconds are only screening examples; the 1.5-second MASTER_PROMPT requirement concerns normal powered closing/opening, not an established emergency deadline. The tangential hand path assumes uninterrupted rotation and excludes regrasp, pin actuation, gloves, dust boot and load-induced effort. The guide reaction is not a strength result.

## Decision

**Neither v0.7d nor v0.7e screw-operated interface has demonstrated practical one-handed emergency accessibility.** In v0.7d the operator must retract the spring-loaded indexing pin and turn the wheel eight full turns, possibly while controlling an unstable object. v0.7e needs 17.14 turns per finger, with four loaded fingers potentially requiring separate access. These are **unresolved human-factors blockers**, not proof that a person cannot perform the action.

Do not make a coarser-pitch screw substitution without recalculating backdrive, friction, holding brake, axial reaction and load path. Do not convert the under-load mechanism into an unguarded spring-powered snap release.

## Next design target

Investigate **single-action, accessible mechanical command** separated from a **captive, independently controlled energy-dissipating payout**. Prefer ordinary purchased hardware, hand-drilled metal strip and FDM fit-only guides. Test on an unloaded guarded fixture first. Any distal jam requires a distinct joint-side solution; no upstream release can claim to solve it. The mechanism must not depend on electronics or the smartphone.

## Reproduce

`python actuation_gate.py` and `python -m unittest -v test_actuation_gate.py` from this directory. **8/8 local Python standard-library tests passed** (2026-11-11), verifying arithmetic and invalid-input handling only.

No physical release, FEA, measured force, human-factors assessment, five-finger packaging, IP or 10 kg qualification. No approval for wearing.
