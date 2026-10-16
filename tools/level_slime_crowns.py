#!/usr/bin/env python3
"""Level boss slime crowns to screen while preserving their per-frame body anchors."""
from pathlib import Path
from lxml import etree
import re
ROOT=Path(__file__).resolve().parents[1]
ns='{http://www.w3.org/2000/svg}'
for file in sorted((ROOT/'animations/slime/boss').glob('*/*.svg')):
 doc=etree.parse(str(file));top=doc.getroot();motion=next(x for x in top if x.tag==ns+'g')
 m=re.search(r'rotate\(([-\d.]+)\)',motion.attrib['transform'])
 angle=float(m.group(1)) if m else 0
 existing=[x for x in motion if x.get('data-crown-level')=='true']
 if existing:existing[0].set('transform',f'rotate({-angle:g} 155 108)')
 else:
  crown=next((x for x in motion if x.tag==ns+'image' and x.get('x')=='115'),None)
  if crown is None:raise ValueError(f'No crown sprite in {file}')
  idx=list(motion).index(crown)
  motion.remove(crown)
  wrap=etree.Element(ns+'g',{'data-crown-level':'true','transform':f'rotate({-angle:g} 155 108)'})
  wrap.append(crown);motion.insert(idx,wrap)
 file.write_bytes(etree.tostring(doc,encoding='utf-8',xml_declaration=False))
print('12 slime boss frames: crowns counter-rotated by body tilt.')
