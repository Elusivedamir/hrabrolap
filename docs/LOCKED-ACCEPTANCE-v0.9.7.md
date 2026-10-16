# Hrabrolap — protected acceptance contract (v0.9.7)

Approved main layout remains **100 waves**, single surface with fishing knight to the left, original house at right, dungeon and four upgrade buttons below. DO NOT substitute old assets or redesign UI.

## Locked gameplay/art (must regress-test on every PR)
1. Cat attack/hurt: six reference PNGs each in `assets/canonical/`, exact files by SHA, untouched. The original 10 exchangeable SVG swords under `art/weapons/` untouched. No changes to current cat positions, expression, flower, paws, sword grip.
2. Ten DISTINCT monster definitions, including skeleton and golem, each with its own six-frame attack and six-frame hurt sequence. A boss uses **the same model** with fitted crown.
3. Every monster has heart-based health UI, colored hearts as appropriate; the old red bar is hidden rather than controlling gameplay.
4. Attack effects: poison applies persistent green contamination, lightning visibly sparks/shocks, vampirism shows a red lifedrain connection and healing. The enchantment must have real combat effects and feedback; visuals alone are not sufficient.
5. Manual combat is free by tapping the monster; **auto-combat starts locked**, purchased once for exactly 1 gold, then player can switch auto/manual freely. Persist ownership and selected combat mode in save data without harming older saves.
6. Original knight/port and actual fishing bucket on the left. Fish flight MUST terminate precisely in the bucket, not at the house.
7. During rest cat disappears from dungeon; only ONE sleeping cat without equipment appears on **second floor** of existing house. Original embedded painted cat on that floor must not duplicate the moving cat.
8. More quests tied to real completed waves, collected loot, kills, fishing and upgrades; claim once; preserve old quest IDs/claims. No fabricated rewards.
9. Every iteration: commit on separate GitHub branch, test in mobile Chromium, review screenshots, merge to main only if green. Tag completed version; do not silently overwrite assets or regress to old ones.

**Asset gate:** Existing monster SVGs in repo may be legacy placeholders. New animation states can initially use these only as provisional motion rigs. DO NOT state that 120 approved hand-drawn monster sprite frames exist until they are actually authored and visually reviewed. Do not replace any earlier approved character design without explicit user confirmation.

## UX + attack-speed rules locked on 16 October 2026

- Bite countdown remains in simulation, but is **never displayed** to players. Top status may say "Рыцарь рыбачит" or "Ведро заполнено", never show seconds to the next fish.
- Manual tapping is strictly bounded by a 1/3 second interval: at most **3 attacks/s**. The cooldown must not store a large idle-time burst of clicks.
- Autocombat purchase costs exactly **1 gold** and permanently unlocks only the auto/manual mode switch. **«Скорость атаки» is a fifth upgrade card visible immediately, separate from buying autobattle, and purchasable before auto mode is unlocked**. Its bonuses apply solely to auto mode. Levels persist in `autoLevel` (integer 0–100, default 0, clamp invalid saves), independent of `autoUnlocked`. Current provisional per-level cost = `round(12 × 1.06^level)`; prices can be tuned without changing frequency.
- Do not call the speed-upgrade card «Автобой» or «Улучшение автобоя». Call it **«Скорость атаки»**. Its upgrade price is distinct from the permanent 1-gold auto unlock.
- Auto attack speed is stepwise: level 0–19 = 1/s; 20–39 = 2/s; 40–59 = 3/s; 60–79 = 4/s; 80–99 = 5/s; **100 = 6/s max**. This overrides the earlier preliminary cap of 5.
- Shop icon stays as the SAME approved illustration, but grounded to the left of `#merchant-status` rather than floating over the text.
- Fishing catch count/icon changes *after* the knight's 10-frame depositing animation, not on the first bite.
- Empty monster hearts must look dark/empty even on colorful monsters, and the stale red HP bar remains invisible.
- Manual combat message must never claim the kitten "fights on its own". Android touch highlights must not show translucent blue boxes over enemies.
- Locked cat attack/hurt source PNGs, ten SVG swords, unchanged game scene composition. The house cutaway must show ONE sleeping kitten in the attic.

## Visual defects still requiring approval (do not call complete)
1. In `art/animated/port_rest_clean.webp`, the old helmeted sleeping kitten is **baked into the attic background**. A new sleeping character over it produces two cats. Must accurately remove only the embedded kitten without altering the existing rooms.
2. Skeleton/golem remain dependent on interim/legacy artwork and require full visual acceptance at 6 attack + 6 hurt frames each (and fitted boss crown).
3. Inspect pixel-accurate landing of the knight's catch into the grounded bucket and verify sprites/controls on the user's own Android, not only Playwright.
4. Investigate residual large blue translucent rectangles if disabling native Android tap highlight does not fully fix the recorded issue.

### Release gate
Working commits always go to `fix/v0.9.7-approved-mobs-and-controls`. Keep `main` tagged v0.9.6 intact; do not merge/label v0.9.7 finished before green browser QA *and* explicit visual approval of the unresolved issues.

## Clarification: separate speed upgrade below the four existing cards
- Auto-battle is a separate one-off unlock beside the wave count, for **1 coin**, with free subsequent switching. Keep that original control in place.
- A distinct **SPEED OF AUTO-ATTACK** paid upgrade is available IMMEDIATELY, including before unlocking auto-battle; it must NOT unlock the auto-battle mode. Save all levels independently.
- Place speed as a visible, **fifth, full-width card in the lower "УЛУЧШЕНИЯ" area**, physically underneath Sword, Armor, Rod, House. Do NOT put it beside the top battle-mode switch.
- Level 0/20/40/60/80/100 still equals 1/2/3/4/5/6 AUTO hits/sec; manual remains 3 hits/sec. The speed bonus only applies when the separate auto-battle mode is switched on.
