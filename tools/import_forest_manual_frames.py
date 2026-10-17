#!/usr/bin/env python3
"""Losslessly export Damir's 12 complete, manually fitted PSD character frames.

Usage: python3 tools/import_forest_manual_frames.py /path/to/uploaded/psds
No background removal, registration, resampling or drawing is performed.
The two 2x hurt canvases keep their original resolution; SVG scales the whole
canvas to the same display rectangle as every other frame.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/costumes/forest_guardian"
# Match the actual unarmored face/paw poses to the canonical animation.
# PSD export numbers reflect the editing order, not the animation order.
SOURCE_ORDER = {"attack": (12, 11, 9, 10, 8, 7),
                "hurt": (12, 11, 10, 8, 9, 7)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    sources = []
    for kind in ("attack", "hurt"):
        for index, source_index in enumerate(SOURCE_ORDER[kind], start=1):
            candidates = sorted(args.source.glob(f"{kind}_{source_index:02}_*.psd"))
            if len(candidates) != 1:
                raise ValueError(f"Expected one {kind}_{source_index:02} PSD, got {candidates}")
            sources.append((kind, index, candidates[0]))
    frames = []
    OUT.mkdir(parents=True, exist_ok=True)
    for kind, index, source in sources:
        with Image.open(source) as psd:
            frame = psd.convert("RGBA")
        if frame.size not in ((279, 370), (558, 740)):
            raise ValueError(f"Unexpected canvas: {source.name}: {frame.size}")
        if frame.getchannel("A").getextrema() != (0, 255):
            raise ValueError(f"Expected transparent character frame: {source.name}")
        target = OUT / f"{kind}_{index:02}.png"
        temporary = target.with_suffix(".png.tmp")
        frame.save(temporary, format="PNG", optimize=True)
        with Image.open(temporary) as check:
            if check.size != frame.size or check.convert("RGBA").tobytes() != frame.tobytes():
                raise RuntimeError(f"Export changed pixels: {source.name}")
        temporary.replace(target)
        frames.append({
            "kind": kind, "index": index, "file": target.name,
            "source": source.name, "width": frame.width, "height": frame.height,
            "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "png_sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
            "rgba_sha256": hashlib.sha256(frame.tobytes()).hexdigest(),
        })
    manifest = {"armor_id": "forest_guardian", "price": 50,
                "content": "complete-character", "pixel_changes": False,
                "frames": frames}
    temporary_manifest = OUT / "manifest.json.tmp"
    temporary_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    temporary_manifest.replace(OUT / "manifest.json")
    print("Exported and pixel-verified 6 attack + 6 hurt frames; native canvases preserved.")


if __name__ == "__main__":
    main()
