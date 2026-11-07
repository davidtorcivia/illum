# tools/upright.py: stand a sign that is printed round a ring (a volvelle's zodiac, a lettered band) upright, and crop it,
# so tools/tracesign.py can trace it as written. The scan is turned about the ring's centre until the point at `deg`
# (degrees, 0 = 3 o'clock, clockwise on screen, y down) stands at 12 o'clock with its foot toward the centre, as a sign
# printed upright to the centre would be read from outside; then a box `half` px either side of it, from radius r0 to r1,
# is cropped and saved.
# usage: uv run --with pillow python -I tools/upright.py IMG cx cy deg r0 r1 half OUT.png [flip]
#   flip: 1 to turn it a further 180° (a sign printed with its head toward the centre)
# (kit/styles/astrology.js's zodiac came from here: Wellcome L0089683, the volvelle of Clavis astrologiae elimata, at
# 4500 px across; centre 2574 2100.)
import sys
from PIL import Image
f, cx, cy, deg, r0, r1, half, out = sys.argv[1], *map(float, sys.argv[2:8]), sys.argv[8]
flip = len(sys.argv) > 9 and sys.argv[9] == '1'
im = Image.open(f).convert('RGB')
# PIL rotates counter-clockwise by its angle; the point at screen angle deg (clockwise) goes to -90 when turned by deg + 90
im = im.rotate(deg + 90, resample=Image.BICUBIC, center=(cx, cy), fillcolor=(235, 225, 205))
box = (int(cx - half), int(cy - r1), int(cx + half), int(cy - r0))
c = im.crop(box)
if flip: c = c.rotate(180)
c.save(out); print(out, c.size)
