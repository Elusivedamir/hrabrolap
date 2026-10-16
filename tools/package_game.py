#!/usr/bin/env python3
"""Package the existing game, including all dynamically selected animation frames."""
from pathlib import Path
import sys,zipfile
root=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]) if len(sys.argv)>1 else root/'hrabrolap-v0.9.7-visual-review.zip'
files=sorted(set([*root.glob('*.html'),*root.glob('*.mjs'),root/'style.css',root/'README.md',root/'docs/QA-WORK-v097.md']+[p for name in ('art','assets','animations') for p in (root/name).rglob('*') if p.is_file()]))
for report in ['docs/QA-ARMOR-v098.md']:
 if (root/report).is_file():files.append(root/report)
out.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in files:z.write(p,p.relative_to(root))
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 names=set(z.namelist())
 for p in ['fishing-frames.mjs','art/animated/port_rest_empty_attic.png','animations/fishing-deposit/09.svg','animations/skeleton/boss/hurt/06.svg','animations/golem/normal/attack/06.svg','animations/slime/normal/attack/01.svg']:
  assert p in names,'Missing runtime dependency: '+p
 if (root/'armor-frames.mjs').is_file():
  required=list((root/'art/armor-frames').rglob('*.svg'))
  assert len(required)==120,'Expected 10 armor sets × 12 poses'
  for p in required:assert str(p.relative_to(root)) in names
  assert {'armor-frames.mjs','armor-review.html','docs/QA-ARMOR-v098.md'}<=names
print(f'Packaged {len(files)} existing project files: {out} ({out.stat().st_size} bytes); ZIP CRC and runtime animation dependencies OK')
