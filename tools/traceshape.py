# tools/traceshape.py: a printed or written sign's ink as its outline, for a style to pour as a letter's coverage with the
# ink engine (kit/inkletter.js). Like tools/tracesign.py's `shape`, but for a clean crop where the ink is heavier than
# the local-median test can see (a woodcut's solid stems, 40+ px wide): the ink is everything darker than the paper by
# THR (the paper being the crop's 90th percentile), inside BOX, less the ERASE rectangles (a ring's tick, a pointer laid
# over the sign); specks under 0.2 % of the box dropped; the mask smoothed SOFT px and its contours simplified to TOL px.
# usage: uv run --with pillow --with scikit-image --with scipy python -I tools/traceshape.py IMG NAME x0,y0,x1,y1 [THR]
#   env: ERASE='x0,y0,x1,y1;...' (crop px)  SOFT=1.5  TOL=.8  RED=1 (red ink: redness instead of darkness)  DBG=mask.png
# Output (JSON): { name, src, a (width / height of the ink's box), polys: [[[x, y]...]...] } in units of the ink's height,
# its top left at 0, 0 (fill even-odd).
import sys, os, json, warnings; warnings.filterwarnings('ignore')
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage.measure import find_contours, approximate_polygon
from skimage.morphology import remove_small_objects, remove_small_holes
f, name = sys.argv[1], sys.argv[2]; x0, y0, x1, y1 = map(int, sys.argv[3].split(',')); thr = float(sys.argv[4]) if len(sys.argv) > 4 else .22
X = np.asarray(Image.open(f).convert('RGB')).astype(float) / 255
if os.environ.get('RED'): v = X[..., 0] - (X[..., 1] + X[..., 2]) / 2; ink = ndi.gaussian_filter(v, 1) > thr
else: v = ndi.gaussian_filter(X.mean(2), 1); ink = v < np.percentile(v, 90) - thr
keep = np.zeros_like(ink); keep[y0:y1, x0:x1] = True
for r in filter(None, os.environ.get('ERASE', '').split(';')): a, b, c, d = map(int, r.split(',')); keep[b:d, a:c] = False
ink &= keep; ink = remove_small_holes(remove_small_objects(ink, int((x1 - x0) * (y1 - y0) * .002)), 12)
if os.environ.get('DBG'): Image.fromarray((ink * 255).astype(np.uint8)).save(os.environ['DBG'])
ys, xs = np.nonzero(ink); bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1; H = by1 - by0
sm = ndi.gaussian_filter(ink.astype(float), float(os.environ.get('SOFT', 1.5)))
polys = []
for ct in find_contours(np.pad(sm, 1), .5):
    ct = approximate_polygon(ct - 1, float(os.environ.get('TOL', .8)))
    if len(ct) >= 4: polys.append([[round((x - bx0) / H, 4), round((y - by0) / H, 4)] for y, x in ct])
print(json.dumps({'name': name, 'src': f.split('/')[-1] + f' [{x0},{y0},{x1},{y1}]', 'a': round((bx1 - bx0) / H, 4), 'polys': polys}))
