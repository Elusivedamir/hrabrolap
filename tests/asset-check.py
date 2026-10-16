#!/usr/bin/env python3
from pathlib import Path
import xml.etree.ElementTree as ET
import re,sys
root=Path(__file__).resolve().parents[1]
files=list((root/'art').rglob('*.svg'))
assert len(files)>=22,len(files)
for f in files:
 t=f.read_text();ET.parse(f)
 assert 'http://' not in t.replace('http://www.w3.org/2000/svg','').replace('http://www.w3.org/1999/xlink',''), f
 if 'art/weapons/' in str(f) or 'art/armor/' in str(f):assert '<image' not in t, f
 if f.name!='bare-kitten.svg':assert 'data:image' not in t, f
for kind,nums in [('weapons',10),('armor',10),('monsters',6)]:assert len(list((root/'art'/kind).glob('*.svg')))>=nums,kind
assert len(list((root/'assets/battle').glob('attack_*.png')))==6
for f in ('index.html','game.mjs','game-core.mjs'):assert (root/f).is_file(),f
assert 'id="rate"' not in (root/'index.html').read_text(), 'unwanted coin/min counter'
for item in ('id="inventory"','id="shop"','id="hero-rig"','id="weapon-slot"','id="hero-armor"','id="mini-shop"','id="bucket"'):assert item in (root/'index.html').read_text(),item
print(f'Art/package tests: passed — {len(files)} SVG, pure-vector weapons & armor, original six attack frames archived, no coin/min')
