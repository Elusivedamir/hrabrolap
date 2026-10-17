#!/usr/bin/env python3
"""Remove only exterior pale backdrop and ground shadow from kitten sprite copies.

Never alters original approved source PNGs or their lock hashes. Output lives in
assets/clean/ and is used by the battle renderer. Requires Pillow (CI environment).
"""
from collections import deque
from pathlib import Path
from PIL import Image
import hashlib, json

ROOT=Path(__file__).resolve().parents[1]
SERIES={
    'canonical': ROOT/'assets/canonical',
    'forest_guardian': ROOT/'assets/costumes/forest_guardian',
    'steel_knight': ROOT/'assets/costumes/steel_knight',
}
OUT=ROOT/'assets/clean'

def clean(source, target):
    image=Image.open(source).convert('RGBA')
    width,height=image.size
    px=image.load()
    exterior=bytearray(width*height)
    todo=deque()
    for x in range(width):
        todo.append((x,0)); todo.append((x,height-1))
    for y in range(height):
        todo.append((0,y)); todo.append((width-1,y))

    def is_flat_backdrop(x,y):
        r,g,b,a=px[x,y]
        if a<=18:
            return True
        return r>=226 and g>=224 and b>=221 and max(r,g,b)-min(r,g,b)<=26

    while todo:
        x,y=todo.popleft()
        if not (0<=x<width and 0<=y<height):
            continue
        index=y*width+x
        if exterior[index] or not is_flat_backdrop(x,y):
            continue
        exterior[index]=1
        if x>0: todo.append((x-1,y))
        if y>0: todo.append((x,y-1))
        if x+1<width: todo.append((x+1,y))
        if y+1<height: todo.append((x,y+1))

    for x in range(width):
        # Ground-shadow pixels never occur below the last outline of a real paw.
        # This is column-based, so the central gap between feet clears too.
        last_ink=-1
        for y in range(height):
            r,g,b,a=px[x,y]
            if a>170 and r<105 and g<80 and b<80:
                last_ink=y
        for y in range(height):
            if exterior[y*width+x] or (y>height*.61 and y>last_ink):
                px[x,y]=(0,0,0,0)
    target.parent.mkdir(parents=True,exist_ok=True)
    image.save(target, optimize=True)
    return image.getbbox()

def main():
    result={}
    for name,folder in SERIES.items():
        files=[folder/f'{kind}_{i:02}.png' for kind in ('attack','hurt') for i in range(1,7)]
        missing=[str(path) for path in files if not path.exists()]
        if missing: raise FileNotFoundError('missing approved frames: '+', '.join(missing))
        output=[]
        for path in files:
            dest=OUT/name/path.name
            rect=clean(path,dest)
            if not rect: raise RuntimeError('empty sprite: '+str(path))
            output.append({'file':path.name,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),
                           'size':list(Image.open(dest).size),'bbox':list(rect)})
        result[name]=output
        print(name,'transparent complete-character PNGs:',len(output))
    (OUT/'manifest.json').write_text(json.dumps({'source':'approved files unchanged',
                               'series':result},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if __name__=='__main__': main()
