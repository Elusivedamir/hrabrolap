"""The edit may change only the erased kitten and painted Z regions."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageFilter
root=Path(__file__).resolve().parents[1]
a=Image.open(root/'art/animated/port_rest_clean.webp').convert('RGB')
b=Image.open(root/'art/animated/port_rest_empty_attic.png').convert('RGB')
assert a.size==b.size==(941,425)
mask=Image.new('L',a.size);d=ImageDraw.Draw(mask)
d.polygon([(666,239),(662,199),(668,164),(689,145),(720,141),(748,150),(762,169),(763,239)],fill=255)
d.polygon([(760,110),(824,110),(824,164),(760,164)],fill=255)
mask=mask.filter(ImageFilter.MaxFilter(3)) # one antialiased boundary pixel
diff=ImageChops.difference(a,b)
assert ImageChops.multiply(diff,ImageChops.invert(mask).convert('RGB')).getbbox() is None,'Room or scenery outside erasure changed'
assert diff.getbbox() is not None
print('PASS: attic edit leaves every pixel outside the kitten/Z masks unchanged')
