# v0.7o — neighboring finger / screwdriver access rejection screen (2026-11-11)

**Scope:** simple 3D axis-aligned bounding-box (AABB) *screening*, NOT a real CAD assembly, no physical parts, no structural rating. Follow-up to v0.7n, which already rejected hypothetical slot and axial dimensions.

## Reproduce
Run `python clearance.py` and `python -m unittest -v test_clearance.py` using Python stdlib. **14/14 tests passed locally on 2026-11-11**. Code includes AABB overlap predicate, a service-tool swept *bounding box* and a pitch/width arithmetic gate. These are illustrative inputs, NOT measured finger spacing.

Assumptions: neighboring nominal finger width 12 mm; center pitch 15/17/19/21 mm; screwdriver body Ø6 mm, fastener head Ø5.4 mm, lateral allowance 0.5 mm per side, access reach 20 mm along +z. A service cylinder's conservative bounding box requires width max(6,5.4)+2×0.5 = **7 mm**. This is a tool-body envelope only, NOT the real path of a human hand.

| Pitch mm | Nominal gap mm | Margin to Ø6 tool + allowance mm | Screening |
|---:|---:|---:|---|
| 15 | 3 | -4 | FAIL |
| 17 | 5 | -2 | FAIL |
| 19 | 7 | 0 | Boundary only, NOT clearance approval |
| 21 | 9 | +2 | Conditional arithmetic pass |

**Finding:** the assumed 17 mm pitch and 12 mm adjacent widths cannot provide a straight Ø6 mm tool path with assumed clearance. A positive 2D anchor angular budget (v0.7m) and a larger hypothetical service slot do NOT fix tool access. At 19 mm pitch the result is exactly zero margin; actual tolerances, boot and cable make this unsafe to approve. The total 85 mm palm width does NOT determine actual per-finger pitch or service geometry; no 5-finger fit claim.

## Low-cost next options (NOT approved)
1. Relocate a captive anchor screw to a **dorsal or palmar removable service hatch**, outside the adjacent finger gap; evaluate screwdriver approach and moving boot.
2. Use a replaceable cassette removable only when unloaded and de-energized, with captive ordinary screws and hand-cut metal brackets. No untested load-bearing printed anchor.
3. For the unpowered shape fixture only, use a soft dummy cord, stock M3 fasteners, washers, a bench clamp and a printed alignment gauge. One-handed maintenance requires actual test.

## Explicit blockers
Actual 3D anchor geometry and screw head/tool SKU; measured finger pitch and moving MCP envelope; five-finger assembly; axial stack failure from v0.7n; tool hand-access and dust boot; cable termination pull-out and fatigue; emergency release under jam; strength and 10 kg; EMG/electrical/socket safety. **No human use.**
