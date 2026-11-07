# tools/tracecut.py: a woodcut block (a Kelmscott initial, a border's bar, a hedera) as the outline of its black, for a
# style to pour as a coverage mask with the ink engine (kit/inkletter.js). Like tools/traceshape.py, but for a print whose
# white line is as much the design as its black (the white-line woodcut): the scan is upsampled (U×, bicubic) and
# smoothed before it is cut, so the contour follows the block's curves and not the scan's pixel stairs; the ink/paper
# threshold is the midpoint between the box's own ink and paper (its 4th and 96th percentiles of lightness, + BIAS), not
# a fixed distance below the page's paper, so a soft scan's grey rims split evenly between the black and the white
# instead of thinning every white line. Specks of ink under SPECK px² (source) dropped; white holes under HOLE px² filled.
# usage: uv run --with pillow --with scipy --with numpy --with scikit-image python -I tools/tracecut.py IMG NAME x0,y0,x1,y1
#   env: U=3  SIGMA=1.1 (source px)  BIAS=0 (+ keeps more white)  TOL=.45 (source px)  SPECK=6  HOLE=4  RED=1 (red ink: its
#        redness instead of its darkness)  ERASE='x0,y0,x1,y1;...' (source px, made paper)  DBG=mask.png
# Output (JSON): { name, src, a (width / height of the box), polys: [[[x, y]...]...] (even-odd, units of the box's height,
# origin its top left), white: { p5, p25, p50 } } where white is the width of the white lines (twice the distance to the
# black along the white's medial axis) as a fraction of the box's height: the gate for how small the block may be laid
# before its finest white line falls under a pixel (Kelmscott's research, research/16-kelmscott.md).
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.measure import find_contours, approximate_polygon
from skimage.morphology import remove_small_objects, remove_small_holes, skeletonize

f, name = sys.argv[1], sys.argv[2]; x0, y0, x1, y1 = map(int, sys.argv[3].split(','))
U = int(os.environ.get('U', 3)); sig = float(os.environ.get('SIGMA', 1.1)); bias = float(os.environ.get('BIAS', 0))
im = Image.open(f).convert('RGB').crop((x0, y0, x1, y1))
X = np.asarray(im).astype(float) / 255
for r in filter(None, os.environ.get('ERASE', '').split(';')):
    a, b, c, d = map(int, r.split(',')); X[max(0, b - y0):max(0, d - y0), max(0, a - x0):max(0, c - x0)] = 1
v = X[..., 0] - (X[..., 1] + X[..., 2]) / 2 if os.environ.get('RED') else 1 - X.mean(2)   # how much ink
v = np.asarray(Image.fromarray((v * 65535).astype(np.uint16).astype(np.int32)).resize((im.width * U, im.height * U), Image.BICUBIC), float) / 65535
v = ndi.gaussian_filter(v, sig * U)
lo, hi = np.percentile(v, 4), np.percentile(v, 96); thr = (lo + hi) / 2 + bias * (hi - lo)
ink = v > thr
def drop(f, a, n):   # (scikit-image >= 0.26 names the size max_size, inclusive; older ones min_size / area_threshold)
    try: return f(a, max_size=max(0, n - 1))
    except TypeError: return f(a, n)
ink = drop(remove_small_objects, ink, int(float(os.environ.get('SPECK', 6)) * U * U))
ink = drop(remove_small_holes, ink, int(float(os.environ.get('HOLE', 4)) * U * U))
if os.environ.get('DBG'): Image.fromarray(((~ink) * 255).astype(np.uint8)).resize((im.width, im.height), Image.LANCZOS).save(os.environ['DBG'])
H = im.height * U
# the white's line widths, along its medial axis (inside the block's ink box only: the paper round it is not a line)
ys, xs = np.nonzero(ink); box = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1)); wt = ~ink[box]
dt = ndi.distance_transform_edt(wt); sk = skeletonize(wt) & (dt > U * .5)
inner = np.zeros_like(wt); inner[U * 3:-U * 3, U * 3:-U * 3] = True; w = 2 * dt[sk & inner] / H
white = {k: round(float(np.percentile(w, p)), 5) for k, p in (('p5', 5), ('p25', 25), ('p50', 50))} if w.size else {}
polys = []
for ct in find_contours(np.pad(ink.astype(float), 1), .5):
    ct = approximate_polygon(ct - 1, float(os.environ.get('TOL', .45)) * U)
    if len(ct) >= 4: polys.append([[round(x / H, 4), round(y / H, 4)] for y, x in ct])
print(json.dumps({'name': name, 'src': f.split('/')[-1] + f' [{x0},{y0},{x1},{y1}]', 'a': round(im.width / im.height, 4), 'polys': polys, 'white': white}))
