# v0.7b — emergency release: analytical rejection gate (2026-11-11)

**Scope:** isolated four-finger hook load and logic of release after power loss. No CAD, physical release, motor or human testing. Built on requirements in MASTER_PROMPT_v4.2 and v0.6a; does not change dimensions or certify 10 kg.

## Numerical screen
10 kg × 9.80665 = **98.0665 N**. Ideal equal four-way distribution = **24.516625 N per finger**; with a hypothetical 40 mm MCP lever, **0.980665 N·m per MCP**. At hypothetical 5.8 mm drum radius and **assumed** transmission efficiency 0.6, cable tension required is **281.80 N per finger**. This is a sensitivity calculation, **not a verified cable strength, motor requirement, or measured efficiency**. For 60° travel, ideal cable stroke **6.07375 mm**, at 1.5 s **4.04916 mm/s**. Real load sharing may be much worse than equal; this is not a design rating.

## Critical safety finding
**Software FAULT or removing motor power cannot release a self-locking gearbox.** A spring on the MCP also cannot open a joint if its tendon remains mechanically locked. If the cable jams, even a gearbox disconnect may not release. Therefore no powered holding mode or human use is approved until an independently accessible, power-independent mechanical release is physically demonstrated in each relevant fault state.

## Low-cost concept to investigate, not approved hardware
Explore an accessible **manual tendon-unhook / mechanically disengaged take-up** outside the sealed electronics bay, using ordinary replaceable fasteners and simple hand-drilled metal parts, with guarded edges and captive hardware. Do not cut a tensioned cable or place fingers in a pinch zone. A quick release under high tension can snap back violently; a **restrained bench fixture, unloaded tests first, then progressively guarded loads** are mandatory. No actual release geometry, force, hand accessibility, single-handed actuation, water seal or safe load-path is validated.

## Reproduce
From this folder: `python release_gate.py`; `python -m unittest -v test_release_gate.py`.
12/12 stdlib unit tests passed locally on 2026-11-11. They validate formulas and decision logic only, not safety. Tests include: equal share, moment, travel, efficiency sensitivity, invalid input, self-locking gearbox, inaccessible lever, jammed cable, possible backdrive, and software-only cases.

## Blocking gates
1. Define a **normally disengageable mechanical transmission** and captive, guarded release; validate actual dimensions and travel with all five fingers and dust boot.
2. Prove release under no power, failed controller, self-locking drive, and tendon jam, including no uncontrolled snapback.
3. Measure actual tendon friction, peak load, wear, fatigue and unequal finger load. Select and validate cable/anchor and metal force path; FEA then physical load tests.
4. Confirm motor, thermal, battery/BMS, EMG isolation, enclosure, socket interface with professionals. No IP or 10 kg claim.
