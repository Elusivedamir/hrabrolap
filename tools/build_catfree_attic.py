#!/usr/bin/env python3
"""Remove ONLY the old helmeted kitten baked into the v0.9.3 house attic background.
Source asset is immutable. Output is a new separate webp for visual acceptance.
Careful: this is a localized image restoration, not an alternative game screen.
"""
from pathlib import Path
import hashlib
import cv2
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/"art/animated/port_rest_clean.webp"
DST=ROOT/"art/animated/port_rest_no_old_cat.webp"
EXPECTED_SHA256="REPLACE_AT_WORKFLOW"  # Gold source is retained, no write to SRC
data=SRC.read_bytes()
image=cv2.imdecode(np.frombuffer(data,dtype=np.uint8),cv2.IMREAD_COLOR)
if image is None:
    raise SystemExit("Unable to decode original approved house")
H,W=image.shape[:2]
if W!=941 or H!=425:
    raise SystemExit(f"Unexpected source scene dimensions: {W}x{H} (refuse pixel guesswork)")
# Precise mask around OLD silver helmet + old sleeping face and paws at x~670-757.
# Preserve red quilt from x~763 on and all nearby furniture, windows, roof and flowers.
mask=np.zeros((H,W),dtype=np.uint8)
outline=np.array([
 [683,154],[693,145],[718,143],[744,153],[756,164],
 [757,182],[756,204],[767,216],[761,230],
 [743,236],[714,238],[688,233],[666,225],
 [664,205],[666,178],[673,161]
],dtype=np.int32)
cv2.fillPoly(mask,[outline],255)
mask=cv2.dilate(mask,np.ones((3,3),np.uint8),iterations=1)
# Restore the wood behind the old sprite using surrounding intact painted material.
# Inpaint keeps every pixel outside the former sprite mask unchanged.
out=cv2.inpaint(image,mask,7,cv2.INPAINT_TELEA)
cv2.imwrite(str(DST),out,[cv2.IMWRITE_WEBP_QUALITY,97])
if not DST.is_file() or DST.stat().st_size<10000:
    raise SystemExit("Attic output missing")
# Pixel fidelity gate; wood/roof/shop/fireplace outside mask must be untouched
restored=cv2.imread(str(DST))
diff=cv2.absdiff(restored,image)
outside=cv2.bitwise_not(mask)
outside_change=float(np.mean(diff[outside>0]))
if outside_change>4:
    raise SystemExit(f"Unintended changes outside old-cat area: {outside_change:.2f}")
print(f"Cat-free attic scene: {W}x{H}, original SHA256 {hashlib.sha256(data).hexdigest()}, "
      f"output {DST.name} ({DST.stat().st_size} bytes), outside change {outside_change:.2f}")
