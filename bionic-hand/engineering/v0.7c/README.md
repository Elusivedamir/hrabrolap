# v0.7c — emergency release architecture and failure screening (2026-11-11)

Status: **DESIGN STUDY ONLY — NO HARDWARE TESTED**. Based on v0.7b, v0.6b/c, MASTER_PROMPT_v4.2, LOW_COST_MANUFACTURING_RULES.

## Decision: reject a bare quick-unhook under load
v0.7b's 281.80 N is an assumed per-finger tendon force at 10 kg equally shared, 40 mm effective external lever, 5.8 mm tendon lever and efficiency 0.6. It is NOT measured. A freely released loaded tendon can recoil, release a hanging object, and strike a bystander. A bare hook, open clevis, cut-cable mechanism, or accessible pin carrying full tendon tension is **NOT an acceptable wearable release**.

## Two distinct failure modes
1. **Motor/gearbox locked, tendon intact**: a power-independent decoupler between gearbox and tendon take-up may allow controlled pay-out, but ONLY with a secondary energy dissipater / captive travel stop, proven at the actual maximum force.
2. **Tendon jammed downstream of decoupler**: decoupling the gearbox is insufficient. A separate accessible distal tendon disconnect could release the joint, but can also eject stored energy and drop the object. This needs guarded bench evaluation, and must not be advertised as a guaranteed release.

## Architecture candidates (not dimensioned or approved)
A. Captive, guarded clutch at tendon drum + controlled friction brake / torque limiter; use ordinary commercial fasteners, metal strip brackets, replaceable bearings and hand-drilled holes. Requires independent verification of release force, friction stability, backdrive and heat. 
B. Captive distal tendon termination accessible through a service hatch; only for **unloaded service**, not a safe under-load emergency release.
C. Independent joint-side release: concept only. Five-finger packaging, dust boot, pinch zones and strength are unsolved.

## Reproducible screening calculations (illustrative)
- W = m*g = 10*9.80665 = 98.0665 N.
- Equal 4-finger distribution = 24.516625 N/finger; **non-equal distribution can be much worse**.
- Assuming effective external moment arm 0.040 m: M = 0.980665 N m/finger.
- Assuming tendon effective radius 0.0058 m and efficiency 0.6: T = M/(r*eta) = 281.8003 N/finger.
- For a deliberately pessimistic **one-finger carries entire load** scenario with identical lever assumptions: M=3.92266 N m; T=1127.2011 N. This is an upper screening case for load share, NOT a verified operating force or a recommended test load.
- If tendon pays out 6.07375 mm at 281.8 N with constant tension, mechanical work = approx 1.712 J per finger; for four fingers approx 6.846 J. This is only an idealized force×travel estimate, excluding springs, gravity changes, backlash and impact. It is **not** the actual release energy or brake rating.

## Low-cost fabrication rule
First prototype: **unpowered, unloaded, bench-mounted, guarded mock-up** using stock fasteners, a hand-cut metal strip and 3D-printed NON-LOAD-BEARING alignment aids. No bespoke CNC or body interface. Never use FDM plastic as the assumed full-tension latch without test evidence. Build fixture that retains both cable ends, uses a physical barrier, and prevents accidental hand access to pinch zones. Keep the release accessible without opening sealed electronics; a replaceable flexible boot must not block it.

## Required pass/fail test plan (not performed)
R1: unloaded 20 repeated releases, power absent, with captive components and no pinch access.
R2: locked gearbox, progressive guarded bench loads; measure manual release force and tendon travel.
R3: simulated tendon jam; demonstrate actual joint liberation OR mark design FAIL, never assume success.
R4: record high-speed motion / recoil and object drop; reject uncontrolled snapback.
R5: repeat with five finger routing and moving dust boot; confirm accessibility with one-handed operation.
R6: wear, debris, water ingress, cleaning, corrosion and electronics isolation, independently tested.
R7: professional mechanical/electrical/socket safety review before any human use.

## Explicit remaining blockers
No actual release geometry, calibrated load sharing, measured cable friction, rated tendon anchor, selected clutch/brake, five-finger CAD integration, return spring, IP rating, 10 kg qualification, EMG electrical safety, or wearable approval. Do not purchase final hardware from this study.
