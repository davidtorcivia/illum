# Self-check for segment.py on a synthetic stroke: a tapered ink stroke on toned paper with a shading gradient.
# usage: uv run --with pillow --with numpy --with scikit-image python -I tools/strokes/test_segment.py
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from scipy import ndimage as ndi
import segment as sg

H, W = 300, 500
yy, xx = np.mgrid[:H, :W]
paper = np.array([.92, .87, .76]) * (1 - .08 * xx[..., None] / W)          # toned, shaded across the sheet
ink = np.array([.12, .10, .09])
# a stroke from (60,150) to (440,150), wide at the start (half-width 22) tapering to 3, bowed a little
t = np.clip((xx - 60) / 380, 0, 1); cy = 150 + 30 * np.sin(np.pi * t); hw = 22 - 19 * t
a = ((xx >= 60) & (xx <= 440) & (np.abs(yy - cy) <= hw)).astype(float)
a = ndi.gaussian_filter(a, 1.0)
rgb = (a[..., None] * ink + (1 - a[..., None]) * paper).astype(np.float32)

G = sg.ground_of(rgb, 14)
assert np.abs(G - paper).max() < .05, 'ground estimate should recover the paper under the stroke'
from skimage import color
d = color.rgb2lab(rgb) - color.rgb2lab(G); mag = np.linalg.norm(d, axis=-1)
assert list(sg.TEMPL)[np.bincount(sg.classify(d)[mag > 14]).argmax()] == 'ink'
comp = ndi.gaussian_filter(mag, 1.2) > 14
body = ndi.gaussian_filter(comp.astype(np.float32), 2) > .5
edt = ndi.distance_transform_edt(body)
strokes = sg.strokes_of(body, edt)
assert len(strokes) == 1 and not strokes[0][2], 'one unbranched stroke'
c = sg.one(strokes[0][0], comp, body, edt, False, rgb, G, mag, 60)
C, hwp = np.array(c['centerline']) + c['crop_offset'], np.array(c['halfwidth'])
assert C[0][0] < C[-1][0], 'the centerline starts at the loaded (wide) end'
assert hwp[3] > 15 and hwp[-4] < 6, f'half-width tapers: {hwp[3]:.1f} -> {hwp[-4]:.1f}'
assert 330 < c['length'] < 440, c['length']
assert np.abs(np.array(c['mean_colour']) / 255 - ink).max() < .06, f"unmixed colour {c['mean_colour']}"
im = np.asarray(c['im']); assert im[0, 0, 3] == 0 and im[..., 3].max() == 255, 'ground transparent, paint opaque'
print('ok')
