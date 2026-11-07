# tools/penmeasure.py: how densely a Lombard's box is worked in hairline, measured the same way on a manuscript scan and on
# a screenshot of ours (research/17 §4f). The letter is the red paint (RED=0: blue); the work is the other colour's line.
# Inside the letter's ink box, the letter's own paint taken out:
#   coverage   the share of the box's free area covered by hairline
#   gap        the paper between neighbouring hairlines: twice the median distance from a free cell to the nearest line,
#              in units of the letter's height H (and its 25th/75th percentiles)
#   width      the hairlines' width: twice the median depth along their skeleton, in units of H
# usage: uv run --with pillow --with numpy --with scipy --with scikit-image python -I tools/penmeasure.py IMG [RED=1] [x0,y0,x1,y1]
import sys, numpy as np
from PIL import Image
from scipy import ndimage as nd
from skimage.morphology import skeletonize
f = sys.argv[1]; red_letter = (sys.argv[2] if len(sys.argv) > 2 else '1') != '0'
X = np.asarray(Image.open(f).convert('RGB')).astype(float) / 255
if len(sys.argv) > 3: a, b, c, d = map(int, sys.argv[3].split(',')); X = X[b:d, a:c]
r, g, bl = X[..., 0], X[..., 1], X[..., 2]; mx, mn = X.max(2), X.min(2); s = (mx - mn) / np.maximum(mx, 1e-6)
red = (r > g + .15) & (r > bl + .12) & (s > .35); blue = (bl > r + .05) & (s > .12) & (mx < .95)
paint, line = (red, blue) if red_letter else (blue, red)
paint = nd.binary_opening(paint, iterations=3); lab, n = nd.label(paint); sz = nd.sum(paint, lab, range(1, n + 1)); paint = lab == (np.argmax(sz) + 1)
ys, xs = np.nonzero(paint); y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max(); H = y1 - y0
box = np.zeros_like(paint); box[y0:y1, x0:x1] = True; free = box & ~nd.binary_dilation(paint, iterations=2)
ln = line & free; cov = ln.sum() / free.sum()
dist = nd.distance_transform_edt(~ln)[free & ~ln]; gap = 2 * np.percentile(dist, [25, 50, 75]) / H
sk = skeletonize(ln); depth = nd.distance_transform_edt(ln)[sk]; width = 2 * np.median(depth) / H if depth.size else 0
print(f"{f.split('/')[-1]}: H {H}px  coverage {cov:.3f}  gap p25/50/75 {gap[0]:.4f}/{gap[1]:.4f}/{gap[2]:.4f} H  width {width:.4f} H")
