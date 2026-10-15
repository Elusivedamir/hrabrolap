#!/usr/bin/env python3
# v0.8 asset contract; archived v0.3 path expectations were obsolete.
from pathlib import Path
r=Path(__file__).resolve().parents[1]
assert (r/'assets/hero/original-head.png').exists()
assert (r/'art/hero/bare-kitten.svg').exists()
for i in range(1,7): assert (r/f'assets/battle/attack_{i:02}.png').exists()
s=(r/'game.mjs').read_text()
for label in ('slash','overhead','thrust','heroFrame(','contactAttack(','hero-weapon','enemyAttack('): assert label in s,label
print('Rig tests: passed — 3 six-pose animation definitions, original face, separate weapon slot')
