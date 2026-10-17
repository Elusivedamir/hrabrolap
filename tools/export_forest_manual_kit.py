#!/usr/bin/env python3
"""Non-destructive 12-pose manual editing kit for the real Hrabrolap sprites."""
from __future__ import annotations
import hashlib
import io
import json
from pathlib import Path
import struct
import zipfile
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "downloads" / "forest_guardian_manual_kit.zip"
EXPECTED = (279, 370)

def psd2(cat: Image.Image, armor: Image.Image) -> bytes:
    """Minimal PSD with editable, separate ARMOR and CAT layers; bottom to top."""
    if cat.size != EXPECTED or armor.size != EXPECTED:
        raise ValueError("Layer geometry must be 279x370")
    w, h = EXPECTED
    b16 = lambda n: struct.pack(">H", n)
    b32 = lambda n: struct.pack(">I", n)
    s16 = lambda n: struct.pack(">h", n)
    s32 = lambda n: struct.pack(">i", n)
    records = bytearray()
    pixels = bytearray()
    for name, im in [("ARMOR_EDIT_ME", armor), ("ORIGINAL_CAT_DO_NOT_EDIT", cat)]:
        channels = [im.getchannel(k).tobytes() for k in ("R", "G", "B", "A")]
        rec = s32(0) + s32(0) + s32(h) + s32(w) + b16(4)
        for cid, blob in zip((0, 1, 2, -1), channels):
            rec += s16(cid) + b32(len(blob)+2)
        rec += b"8BIMnorm" + bytes((255, 0, 0, 0))
        raw_name = name.encode("ascii")
        pascal = bytes([len(raw_name)]) + raw_name
        pascal += b"\0" * (-len(pascal) % 4)
        extra = b32(0) + b32(0) + pascal
        records += rec + b32(len(extra)) + extra
        for blob in channels:
            pixels += b16(0) + blob
    layerinfo = s16(2) + records + pixels
    if len(layerinfo) % 2:
        layerinfo += b"\0"
    maskinfo = b32(len(layerinfo)) + layerinfo + b32(0)
    header = b"8BPS" + b16(1) + b"\0"*6 + b16(4) + b32(h) + b32(w) + b16(8) + b16(3)
    merged = Image.alpha_composite(cat, armor)
    result = header + b32(0) + b32(0) + b32(len(maskinfo)) + maskinfo + b16(0)
    result += b"".join(merged.getchannel(k).tobytes() for k in ("R","G","B","A"))
    return result

def to_279(im: Image.Image) -> Image.Image:
    if im.size == EXPECTED:
        return im.convert("RGBA")
    if im.height != 370 or im.width not in (278,279):
        raise ValueError(f"Unexpected canonical sprite dimensions {im.size}")
    canvas = Image.new("RGBA", EXPECTED, (0,0,0,0))
    canvas.alpha_composite(im.convert("RGBA"), (0,0))
    return canvas

def main() -> None:
    mf = json.loads((ROOT / "assets/canonical/frame-manifest.json").read_text(encoding="utf8"))
    records = []
    sheet = Image.new("RGB", (279*6, (370+26)*2), "#f0e5d2")
    draw = ImageDraw.Draw(sheet)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=7) as z:
        for row,kind in enumerate(("attack", "hurt")):
            for i in range(1,7):
                frame = f"{kind}_{i:02}"
                catfile = ROOT / "assets" / "canonical" / f"{frame}.png"
                armorfile = ROOT / "assets" / "armor" / "forest_guardian" / f"forest_{frame}.png"
                original_bytes = catfile.read_bytes()
                expected_sha = mf["frames"][catfile.name]["sha256"]
                digest = hashlib.sha256(original_bytes).hexdigest()
                if digest != expected_sha:
                    raise RuntimeError("Original kitten changed: " + catfile.name)
                if not armorfile.is_file():
                    raise RuntimeError("Missing armor layer: "+str(armorfile))
                armor_bytes = armorfile.read_bytes()
                original = Image.open(io.BytesIO(original_bytes)).convert("RGBA")
                armor = Image.open(io.BytesIO(armor_bytes)).convert("RGBA")
                if armor.size != EXPECTED or armor.getextrema()[3][0] == 255:
                    raise RuntimeError("Expected RGBA transparent 279x370 armor: "+str(armorfile))
                aligned_original = to_279(original)
                # Immutable original bytes in originals/ - no resizing or recompression.
                z.writestr(f"original_cat/{frame}.png", original_bytes)
                z.writestr(f"armor_to_edit/forest_{frame}.png", armor_bytes)
                psd = psd2(aligned_original, armor)
                # Verify flattened PSD can be decoded and exposes two layers.
                check = Image.open(io.BytesIO(psd))
                if check.size != EXPECTED or len(check.layers) != 2:
                    raise RuntimeError("PSD verification failed: "+frame)
                z.writestr(f"two_editable_layers/{frame}.psd", psd)
                composite = Image.alpha_composite(aligned_original, armor)
                sheet.paste(composite.convert("RGB"), ((i-1)*279,row*(370+26)))
                draw.text(((i-1)*279+9,row*(370+26)+370+5),frame,fill="#2f241d")
                records.append(dict(frame=frame,original=catfile.name,original_sha256=digest,
                                    armor=armorfile.name,original_dimensions=original.size,
                                    layer_dimensions=armor.size))
        thumb=io.BytesIO()
        sheet.save(thumb,"PNG")
        z.writestr("contact_sheet.png",thumb.getvalue())
        z.writestr("manifest.json",json.dumps(records,ensure_ascii=False,indent=2))
        z.writestr("README_RU.txt",
"""ЛЕСНОЙ СТРАЖ — РУЧНАЯ ПОДГОНКА НА ANDROID

12 оригинальных кадров котёнка + 12 независимых прозрачных слоёв брони.
Имена совпадают: attack_01--06 и hurt_01--06.

original_cat/          ОРИГИНАЛЫ из игры, byte-for-byte, проверены SHA-256.
armor_to_edit/         Броня 279x370 RGBA, заготовки для ручной чистки.
two_editable_layers/   12 готовых Photoshop PSD (2 слоя каждый).
contact_sheet.png      Сводка 12 кадров для удобства.

РЕКОМЕНДАЦИЯ: ibis Paint X на Android.
1. Распакуйте ZIP через Мои файлы/Files.
2. Откройте нужный файл из two_editable_layers/ как PSD в ibis Paint.
3. В слоях два слоя: верхний ARMOR_EDIT_ME и нижний ORIGINAL_CAT_DO_NOT_EDIT.
4. Нижний слой не меняйте. На верхнем стирайте контуры, перемещайте
   детали и дорисовывайте рукава/сапоги; сохраняйте PSD для продолжения.
5. Экспортируйте ТОЛЬКО верхний слой через «Save Layer as Transparent PNG».
6. Сохраняйте результат как forest_attack_01.png ... forest_hurt_06.png.
7. Не объединяйте котёнка и броню в один игровой спрайт!

Оба слоя PSD имеют холст 279x370. Для оригиналов шириной 278px в PSD
добавлена прозрачная колонка справа — исходный файл в original_cat/ нетронут.
Если PSD не открывается: создайте холст 279x370, импортируйте
original_cat/ как нижний слой, armor_to_edit/ как верхний.
""")
    print("Created",OUT,"size",OUT.stat().st_size,"bytes, frames",len(records))
if __name__ == "__main__":
    main()
