# tools/tracesign.py: trace a pen-written sign (a planetary sign, a seal, a Monas) from a manuscript or print scan as
# the pen strokes that made it, for kit/styles/occult.js to write again with the ink engine.
# usage: uv run --with pillow --with scikit-image --with scipy python -I tools/tracesign.py IMG x0 y0 x1 y1 NAME [MODE] [THR]
#   MODE: red (a red ink: redness r - (g + b) / 2 above THR, default .12) | dark (an iron-gall or printer's black: darker
#   than the local paper by THR, default .2). env: MINL (shortest stroke kept, px, default 8), SPUR (spurs pruned, px, 7),
#   SMOOTH (half-window of the moving average, px, 3), TURN (largest bend, degrees, at which two skeleton branches that meet
#   at a fork are one stroke, default 35), DBG=path.png (the mask and skeleton).
# Output (JSON on stdout): { name, src, a (crop width / height), strokes: [{ p: [[x, y]...], w: [width...] }] } in units of
# the crop's height, origin top left; each stroke's width per point (twice the distance to the ink's edge, smoothed), so
# a pen's swell, a flared serif and a solid arrowhead come back as the stroke's own press. Strokes are ordered as a hand
# would write them: top to bottom, left to right by their starts, each run from its upper-left end. shape: the ink's
# outline and holes as polygons (fill even-odd), from the mask smoothed by SOFT px (default 1.5), simplified to TOL px
# (default .8): the sign's own form, to pour as a letter's coverage (kit/inkletter.js) at any size.
import warnings, os, sys, json, math; warnings.filterwarnings('ignore')
import numpy as np
from PIL import Image
from skimage.morphology import skeletonize, remove_small_objects, remove_small_holes, binary_closing, disk
from skimage.measure import approximate_polygon, find_contours
from scipy import ndimage as ndi
f, x0, y0, x1, y1, name = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
mode = sys.argv[7] if len(sys.argv) > 7 else 'red'; thr = float(sys.argv[8]) if len(sys.argv) > 8 else (.12 if mode == 'red' else .2)
X = np.asarray(Image.open(f).convert('RGB').crop((x0, y0, x1, y1))).astype(float) / 255
r, g, b = X[..., 0], X[..., 1], X[..., 2]; H = y1 - y0
if mode == 'red': ink = ndi.gaussian_filter(r - (g + b) / 2, 1.2) > thr
else: v = ndi.gaussian_filter(X.mean(2), 1.2); ink = v < ndi.median_filter(v, 41) - thr
ink = remove_small_holes(remove_small_objects(binary_closing(ink, disk(1)), 30), 20)
dt = ndi.distance_transform_edt(ink); sk = skeletonize(ink)
if os.environ.get('DBG'): Image.fromarray(np.stack([ink * 255, sk * 255, sk * 0], 2).astype(np.uint8)).save(os.environ['DBG'])
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
for p in sorted(P):
    if deg[p] == 2 and not any(frozenset((p, q)) in seen for q in nb(p)): paths.append(walk(p, nb(p)[0]))
SPUR = int(os.environ.get('SPUR', 7)); MINL = int(os.environ.get('MINL', 8)); SM = int(os.environ.get('SMOOTH', 3)); TURN = math.radians(float(os.environ.get('TURN', 35)))
free = lambda p: deg.get(p, 0) == 1
paths = [pa for pa in paths if not (free(pa[0]) != free(pa[-1]) and len(pa) < SPUR)]
# join branches that run on through a fork (the pen went straight on; the fork is where another stroke crossed it)
def heading(pa, end):   # the direction a path leaves its end `end` (0 start, 1 end), looking a few px in
    q = pa if end else pa[::-1]; k = min(len(q) - 1, 6); return math.atan2(q[-1][0] - q[-1 - k][0], q[-1][1] - q[-1 - k][1])
def near(a, b): return abs(a[0] - b[0]) <= 2 and abs(a[1] - b[1]) <= 2
changed = True
while changed:
    changed = False
    for i in range(len(paths)):
        for j in range(len(paths)):
            if i == j: continue
            A, B = paths[i], paths[j]
            for ea in (0, 1):
                for eb in (0, 1):
                    pa, pb = (A[-1] if ea else A[0]), (B[-1] if eb else B[0])
                    if free(pa) or free(pb) or not near(pa, pb): continue
                    d = abs((heading(A, ea) - (heading(B, eb) + math.pi) + math.pi) % (2 * math.pi) - math.pi)
                    if d < TURN:
                        a2 = A if ea else A[::-1]; b2 = B[::-1] if eb else B
                        paths[i] = a2 + b2; paths.pop(j); changed = True; break
                if changed: break
            if changed: break
        if changed: break
out = []
for pa in paths:
    if len(pa) < MINL: continue
    a = np.array(pa, float); w = np.array([dt[int(y), int(x)] * 2 for y, x in pa])
    if len(a) > 2 * SM: a = np.array([a[max(0, i - SM):i + SM + 1].mean(0) for i in range(len(a))]); a[0], a[-1] = pa[0], pa[-1]
    w = np.array([w[max(0, i - SM):i + SM + 1].mean() for i in range(len(w))])
    keep = approximate_polygon(a, .6); idx = [int(np.argmin(((a - q) ** 2).sum(1))) for q in keep]
    pts = [[round(x / H, 4), round(y / H, 4)] for y, x in keep]; ws = [round(float(w[k]) / H, 4) for k in idx]
    if (pts[0][1] + pts[0][0] * .3) > (pts[-1][1] + pts[-1][0] * .3) and not (free(pa[0]) and not free(pa[-1])): pts, ws = pts[::-1], ws[::-1]
    out.append({'p': pts, 'w': ws})
out.sort(key=lambda s: (round(s['p'][0][1] * 6), s['p'][0][0]))
# and the ink itself as a shape: its outline (and its holes) as polygons, to fill even-odd, from the mask smoothed a little
# (the paper's tooth in the stroke's edge is the scan's, not the pen's: the ink engine lays its own)
sm = ndi.gaussian_filter(ink.astype(float), float(os.environ.get('SOFT', 1.5)))
shape = []
for ct in find_contours(np.pad(sm, 1), .5):
    ct = approximate_polygon(ct - 1, float(os.environ.get('TOL', .8)))
    if len(ct) >= 4: shape.append([[round(x / H, 4), round(y / H, 4)] for y, x in ct])
print(json.dumps({'name': name, 'src': f.split('/')[-1] + f' [{x0},{y0},{x1},{y1}] {mode}', 'a': round((x1 - x0) / H, 4), 'strokes': out, 'shape': shape}))
