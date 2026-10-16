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
# Rebuild original wall from a CLEAN region of the SAME attic painting.
# Clone gradients and wood grains, not a blurry 100px Telea hole.
# The sample is above the helmet, inside the triangular timber interior.
left,top,right,bottom=658,140,772,240
texture=image[77:141,678:784]
texture=cv2.resize(texture,(right-left,bottom-top),interpolation=cv2.INTER_CUBIC)
local=mask[top:bottom,left:right]
# Seamless clone avoids hard borders and preserves source lighting.
out=cv2.seamlessClone(texture,image,local,(int((left+right)/2),int((top+bottom)/2)),cv2.NORMAL_CLONE)
# Restore original white mattress ledge (only where the sleeping helmet sat):
# Painted matching simple cushion from original colors under the new sleeping cat.
cv2.ellipse(out,(719,230),(50,9),0,0,360,(184,204,217),-1,lineType=cv2.LINE_AA)
cv2.ellipse(out,(719,230),(50,9),0,0,360,(49,51,60),2,lineType=cv2.LINE_AA)
cv2.line(out,(668,234),(765,234),(198,206,205),2,cv2.LINE_AA)
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
