#!/usr/bin/env python3
"""QA-only 1536x864 contact sheet. Never modify or overwrite the 12 canonical PNGs."""
import json
from pathlib import Path
from PIL import Image, ImageDraw
ROOT = Path(__file__).resolve().parents[2]
manifest=json.loads((ROOT/'qa/forest-guardian/manifest.json').read_text())
sheet=Image.new('RGBA',(1536,864),(245,244,237,255))
draw=ImageDraw.Draw(sheet)
for f in manifest['frames']:
    img=Image.open(ROOT/f['copy'])
    assert img.mode=='RGBA' and img.size==(f['native_width'],f['native_height'])
    # Downscale ONLY in this diagnostic sheet (six 256px columns), not the source.
    ratio=min(245/img.width,386/img.height,1)
    preview=img.resize((round(img.width*ratio),round(img.height*ratio)),Image.Resampling.LANCZOS)
    col=f['index']-1
    row=0 if f['kind']=='attack' else 1
    x=col*256+(256-preview.width)//2
    y=row*432+20+(386-preview.height)//2
    sheet.alpha_composite(preview,(x,y))
    draw.text((col*256+10,row*432+405),f["kind"]+" "+str(f['index']),fill=(40,40,40,255))
out=ROOT/'qa/forest-guardian/original-contact-sheet.png'
sheet.save(out)
print(out, sheet.size)
