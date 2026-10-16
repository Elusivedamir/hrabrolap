#!/usr/bin/env python3
"""Recover the EXACT painted knight animation from approved v0.9.3 archive.

No existing approved port or character assets are modified.
All 10 frame SVGs and four source cutouts are verified against original SHA-256.
"""
from pathlib import Path
import base64, hashlib, json, re, zlib
root=Path(__file__).resolve().parents[1]
packed=(root/'assets/legacy-v093-fishing.manifest.b64').read_text().strip()
model=json.loads(zlib.decompress(base64.b64decode(packed)))
assets=model['assets'];frames=model['frames']
allow={
 'art/animated/knight-upper.png','art/animated/knight-lower.png',
 'art/animated/port_active_clean.webp','art/animated/port_rest_clean.webp'}
assert set(assets)==allow
assert len(frames)==10
for path,encoded in assets.items():
    data=base64.b64decode(encoded)
    assert hashlib.sha256(data).hexdigest()==model['sha256'][path]
    dest=root/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
for path,entry in frames.items():
    assert re.fullmatch(r'animations/fishing/(0[1-9]|10)\.svg',path)
    body=entry['template'].replace('__LOWER__',assets['art/animated/knight-lower.png']).replace('__UPPER__',assets['art/animated/knight-upper.png']).encode()
    assert hashlib.sha256(body).hexdigest()==entry['sha256'],f'frame mismatch: {path}'
    dest=root/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(body)
print('RESTORED 10 original fishing knight SVG frames and 4 scene-layer source files, byte exact')
