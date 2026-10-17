#!/usr/bin/env python3
"""Rebuild twelve forest armor display frames without altering the approved kitten.
The PSD-derived source remains in assets/costumes/forest_guardian.
The existing clean frame supplies authoritative alpha (no floor between the paws).
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/costumes/forest_guardian'
TARGET=ROOT/'assets/clean/forest_guardian'
MARKER=TARGET/'refined-v2.txt'
W,H,S=279,370,3

def green_mask(img):
    pixels=img.load()
    mask=Image.new('L',(W,H))
    output=mask.load()
    for y in range(234,H):
        for x in range(W):
            r,g,b,a=pixels[x,y]
            if a>=65 and g>r*.92 and g>b*1.15 and g-r>-8 and g>34 and r<164 and b<110:
                output[x,y]=min(a,242)
    return mask.filter(ImageFilter.GaussianBlur(.55))

def redraw(name):
    img=Image.open(SOURCE/name).convert('RGBA').resize((W,H),Image.Resampling.LANCZOS)
    original=Image.open(TARGET/name).convert('RGBA')
    original_alpha=original.getchannel('A')
    mask=green_mask(img)
    high=Image.new('RGBA',(W*S,H*S))
    draw=ImageDraw.Draw(high)
    # Engraved diagonal woven texture on original moss armor, not on kitten fur.
    for y in range(254,366,11):
        shift=4 if y//11%2 else 0
        for x in range(78+shift,259,12):
            X,Y=x*S,y*S
            draw.line(((X-4,Y+2),(X+3,Y-5)),fill=(193,177,92,95),width=2)
            draw.line(((X+5,Y-5),(X+8,Y-8)),fill=(10,43,25,120),width=2)
    veins=(
      ((106,295),(98,310),(104,328),(114,336)),
      ((205,296),(220,308),(215,324),(208,333)),
      ((119,274),(135,281),(141,298),(133,313)),
      ((198,272),(184,284),(181,298),(187,312)),
      ((128,330),(139,334),(144,348)),
      ((192,333),(185,341),(184,356))
    )
    for k,points in enumerate(veins):
        points=[(x*S,y*S) for x,y in points]
        draw.line(points,fill=(20,51,28,225),width=5,joint='curve')
        draw.line(points,fill=(224,188,93,215),width=2,joint='curve')
        for x,y in points[1:-1]:
            sign=1 if k%2 else -1
            draw.line(((x,y),(x+sign*7*S,y-3*S)),fill=(213,170,84,170),width=2)
    for x,y,rad in ((146,288,2.5),(190,292,2.2),(115,322,2.2),
                    (205,326,2.2),(130,347,2),(189,352,2)):
        x,y,r=x*S,y*S,int(rad*S)
        draw.ellipse((x-r,y-r,x+r,y+r),fill=(247,219,143,240),
                     outline=(73,58,34,230),width=2)
        draw.ellipse((x-2,y-3,x+1,y),fill=(255,250,206,230))
    layer=high.resize((W,H),Image.Resampling.LANCZOS)
    layer.putalpha(Image.composite(layer.getchannel('A'),
                                   Image.new('L',(W,H)),mask))
    result=Image.alpha_composite(img,layer)
    if result.size!=original.size:
        result=result.resize(original.size,Image.Resampling.LANCZOS)
    # Identical alpha mask: preserves ALL gaps under and between feet.
    result.putalpha(original_alpha)
    assert result.getchannel('A').tobytes()==original_alpha.tobytes()
    result.save(TARGET/name,optimize=True)

def main():
    if MARKER.exists() and MARKER.read_text().strip()=='forest-armor-refined-v2':
        print('Forest Guardian v2 already applied; skip the additive repaint')
        return
    for kind in ('attack','hurt'):
        for i in range(1,7):
            redraw(f'{kind}_{i:02}.png')
    MARKER.write_text('forest-armor-refined-v2\n')
    print('Refined Forest Guardian: 12 transparent character frames')

if __name__=='__main__':
    main()
