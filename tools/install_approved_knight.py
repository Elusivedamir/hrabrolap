#!/usr/bin/env python3
"""Install Damir's approved 12 complete-character kitten frames.
This is a full-costume character swap, never a separate armor overlay.
Expected input: incoming/approved_knight.zip
The existing steel_knight ID is reused to preserve 50-coin purchases and saves.
"""
from __future__ import annotations
import hashlib, json, struct, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "incoming/approved_knight.zip"
DEST = ROOT / "assets/costumes/steel_knight"
OLD_PREFIX = "assets/costumes/approved_knight/"
KINDS = ("attack", "hurt")
FILES = [f"{kind}_{i:02}.png" for kind in KINDS for i in range(1, 7)]


def verify_png(filename: str, blob: bytes) -> None:
    if not blob.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError(f"{filename}: not a PNG")
    width, height, depth, mode = struct.unpack(">IIBB", blob[16:26])
    if (width, height, depth, mode) != (279, 370, 8, 6):
        raise ValueError(f"{filename}: expected 279x370 RGBA8, got {width}x{height}/{depth}/{mode}")


def main() -> None:
    if not SOURCE.is_file():
        raise SystemExit(f"Approved sprite archive is not uploaded yet: {SOURCE}")
    if not DEST.is_dir():
        raise SystemExit(f"Existing costume directory missing: {DEST}")
    with zipfile.ZipFile(SOURCE) as archive:
        expected = {OLD_PREFIX + filename for filename in FILES}
        present = set(archive.namelist())
        if expected != present:
            raise ValueError(f"Archive must contain precisely 12 approved PNG frames; missing={sorted(expected-present)}, extra={sorted(present-expected)}")
        contents = {name: archive.read(OLD_PREFIX + name) for name in FILES}
    for name, blob in contents.items():
        verify_png(name, blob)
    for name, blob in contents.items():
        (DEST / name).write_bytes(blob)
    manifest = {
        "armor_id": "steel_knight",
        "name": "Золотой рыцарь",
        "price": 50,
        "content": "complete-character",
        "approved_source": True,
        "source_archive": "incoming/approved_knight.zip",
        "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        "sword": "separate-svg",
        "frames": [
            {"file": name, "sha256": hashlib.sha256(contents[name]).hexdigest(), "width": 279, "height": 370}
            for name in FILES
        ],
    }
    (DEST / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    catalog = ROOT / "equipment-catalog.mjs"
    s = catalog.read_text(encoding="utf-8")
    old = "id:'steel_knight',name:'Стальной рыцарь'"
    new = "id:'steel_knight',name:'Золотой рыцарь'"
    if old in s:
        catalog.write_text(s.replace(old, new), encoding="utf-8")
    elif new not in s:
        raise RuntimeError("steel_knight catalog entry not found; refusing to change game")
    print("INSTALLED: 12 user-approved full-character frames, 50-coin shop item, 1 separate SVG sword, same inventory ID")


if __name__ == "__main__":
    main()
