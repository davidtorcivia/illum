# tools/trace.py: trace a woodcut's line and stencil colours from a scan, for a style that redraws them with the ink
# engine (kit/styles/tarot.js's TRACE data came from here).
# usage: uv run --with pillow --with scikit-image --with scipy python -I tools/trace.py IMG x0 y0 x1 y1 NAME [THR]
# env: MINL (shortest line kept, px), SPUR (spur length pruned, px). Tarot's elements, from BnF Conver 1760 scans:
#   plant   MINL=6 SPUR=5  c089 600 1770 780 1975  THR .05  keep lines with mean x < .46, mean y < .88, length >= .03, then
#                                                            mirror them about x = .46 (the right half is under its bud)
#   ground  MINL=16        c089 545 1890 840 2090  THR .08  keep lines with length >= .08
#   tear    MINL=12        c125 295 1090 415 1300  THR .1   keep only its red fill polygon
import warnings, os; warnings.filterwarnings('ignore')
# trace.py img x0 y0 x1 y1 name [linethr] -> JSON on stdout: a woodcut's lines (skeleton polylines, with width) and its
# stencil colours (polygons), in units of the crop's height, origin at its top left
import sys, json, numpy as np
from PIL import Image
from skimage.morphology import skeletonize, remove_small_objects, binary_closing, binary_opening, disk
from skimage.measure import find_contours, approximate_polygon
from scipy import ndimage as ndi
f, x0, y0, x1, y1, name = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]; thr = float(sys.argv[7]) if len(sys.argv) > 7 else .18
X = np.asarray(Image.open(f).convert('RGB').crop((x0, y0, x1, y1))).astype(float) / 255
mx, mn = X.max(2), X.min(2); s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0); v = mx; r, g, b = X[..., 0], X[..., 1], X[..., 2]
d = np.maximum(mx - mn, 1e-6); h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
H = y1 - y0
vs = ndi.gaussian_filter(v, 1.3); bg = ndi.median_filter(vs, 31); line = (vs < bg - thr) & (ndi.gaussian_filter(s, 1.3) < .3)
line = remove_small_objects(binary_closing(line, disk(1)), 40)
line = ndi.binary_fill_holes(line) if False else line
from skimage.morphology import remove_small_holes
line = remove_small_holes(line, 30)
dt = ndi.distance_transform_edt(line); sk = skeletonize(line)
import os
if os.environ.get('DBG'): Image.fromarray((np.stack([line * 255, sk * 255, sk * 0], 2)).astype(np.uint8)).save(os.environ['DBG'])
# walk the skeleton into polylines (end to end, junction to junction)
P = set(zip(*np.nonzero(sk))); N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
nb = lambda p: [(p[0] + a, p[1] + c) for a, c in N8 if (p[0] + a, p[1] + c) in P]
deg = {p: len(nb(p)) for p in P}; seen = set(); paths = []
def walk(a, b):
    path = [a, b]; seen.add(frozenset((a, b)))
    while deg[path[-1]] == 2:
        nx = [q for q in nb(path[-1]) if frozenset((path[-1], q)) not in seen]
        if not nx: break
        seen.add(frozenset((path[-1], nx[0]))); path.append(nx[0])
    return path
for p in sorted(P, key=lambda p: deg[p] != 1):
    if deg[p] == 2: continue
    for q in nb(p):
        if frozenset((p, q)) not in seen: paths.append(walk(p, q))
for p in P:   # closed loops
    if deg[p] == 2 and not any(frozenset((p, q)) in seen for q in nb(p)): paths.append(walk(p, nb(p)[0]))
# a spur (a short path from a junction to a free end) is the knife's ragged edge, not a stroke
MINL = int(os.environ.get('MINL', 10)); SPUR = int(os.environ.get('SPUR', 9))
paths = [pa for pa in paths if not ((deg[pa[0]] == 1) != (deg[pa[-1]] == 1) and len(pa) < SPUR)]
lines = []
for pa in paths:
    if len(pa) < MINL: continue
    a = np.array(pa, float); k = 4
    if len(a) > 2 * k: a = np.array([a[max(0, i - k):i + k + 1].mean(0) for i in range(len(a))]); a[0], a[-1] = pa[0], pa[-1]
    a = approximate_polygon(a, .7); w = float(np.median([dt[int(y), int(x)] for y, x in pa])) * 2
    lines.append({ 'w': round(w / H, 4), 'free': [deg[pa[0]] == 1, deg[pa[-1]] == 1], 'pts': [[round(x / H, 4), round(y / H, 4)] for y, x in a] })
cls = { 'r': ((h < 22) | (h > 340)) & (s > .35) & (v > .4), 'y': (h > 40) & (h < 66) & (s > .4) & (v > .55), 'p': (h > 160) & (h < 230) & (s > .08) & (v > .5) & ~line,
        'b': (h > 200) & (h < 240) & (s > .3) & (v < .6), 'g': (h > 80) & (h < 170) & (s > .2) & (v < .75) }
fills = {}
for c, m in cls.items():
    m = remove_small_objects(binary_opening(binary_closing(m, disk(2)), disk(2)), 200)
    if m.sum() < 200: continue
    polys = []
    for ct in find_contours(np.pad(m, 1).astype(float), .5):
        ct = approximate_polygon(ct - 1, 1.2)
        if len(ct) >= 4 and abs(((ct[:-1, 0] - ct[0, 0]) * (ct[1:, 1] - ct[0, 1]) - (ct[:-1, 1] - ct[0, 1]) * (ct[1:, 0] - ct[0, 0])).sum()) / 2 > 150: polys.append([[round(x / H, 4), round(y / H, 4)] for y, x in ct])
    if polys: fills[c] = polys
print(json.dumps({ 'name': name, 'src': f.split('/')[-1] + f' [{x0},{y0},{x1},{y1}]', 'aspect': round((x1 - x0) / H, 4), 'lines': lines, 'fills': fills }))
