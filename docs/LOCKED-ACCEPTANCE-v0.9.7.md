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
