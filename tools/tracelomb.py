# tools/tracelomb.py: a painted Lombard capital (a choir book's red-and-blue initial) traced as the shapes a painter laid:
# its LETTER (every place the paint covers, the white-worked panels inside it included) and its PANELS (the parts of the
# letter worked with white filigree, as against its solid body), for kit/styles/choirbook.js (research/17-choirbook.md).
# The penwork round the letter is fine line on bare parchment, the panels are paint broken by fine white line, the body is
# solid paint: so the three are told apart by how much of a small window is paint. The paint is what is coloured (red or
# blue: saturation over SAT, lightness over DARK, so the brown text and black notes are left out); its share in a window of
# WIN (of the letter's height) over LET is the letter, over BODY in a window of WINB is the solid body; the panels are the
# letter less the body, opened by OPEN. The largest pieces of the letter are kept (over KEEP of the largest), holes under
# HOLE (of the height, squared) filled.
# usage: uv run --with pillow --with scipy --with numpy --with scikit-image python -I tools/tracelomb.py IMG NAME x0,y0,x1,y1
#   env: SAT=.26 DARK=.3 WINB=.022 BODY=.8 BOPEN=.006 KEEP=.12 CLOSE=.03 WIN=.05 LET=.38 OPEN=.012 ERASE='x0,y0,x1,y1;...' (px of IMG)
#        COL=red|blue (only that paint)  CENTER=.3 (keep only pieces reaching the middle)  DBG=out.png (the crop, the letter in cyan, the panels in magenta)
# Output (JSON): { name, src, a (width / height of the letter's ink box), polys (the letter, even-odd, units of the box's
# height, origin its top left), panels (the same, for the panels) } — tools/kfont.py reads polys; lombfont.py both.
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from skimage.measure import find_contours, approximate_polygon
E = lambda k, d: float(os.environ.get(k, d))
f, name = sys.argv[1], sys.argv[2]; x0, y0, x1, y1 = map(int, sys.argv[3].split(','))
X = np.asarray(Image.open(f).convert('RGB').crop((x0, y0, x1, y1))).astype(float) / 255
for r in filter(None, os.environ.get('ERASE', '').split(';')):
    a, b, c, d = map(int, r.split(',')); X[max(0, b - y0):max(0, d - y0), max(0, a - x0):max(0, c - x0)] = [.9, .87, .8]
mx, mn = X.max(2), X.min(2); sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
r, g, b = X[..., 0], X[..., 1], X[..., 2]
red = (r > g + .12) & (r > b + .12); blue = (b > r + .04) & (b >= g - .02)
hue = {'red': red, 'blue': blue}.get(os.environ.get('COL', ''), red | blue)   # COL=red|blue: the letter is in that colour alone
paint = nd.gaussian_filter(((sat > E('SAT', .26)) & (mx > E('DARK', .3)) & hue).astype(float), .7) > .5
h0 = y1 - y0
def share(m, win): k = max(3, int(win * h0) | 1); return nd.uniform_filter(m.astype(float), k)
# the body: solid paint (its share in a small window), its largest pieces; the letter: the body and every hole it closes
# (closed by CLOSE of the height, so a hairline joint does not leak) that is mostly paint: a worked panel, not a counter
body = share(paint, E('WINB', .022)) > E('BODY', .8)
body = nd.binary_opening(body, iterations=max(1, int(E('BOPEN', .006) * h0)))
if os.environ.get('STAFF'):   # the staff's rules: long thin horizontal runs that reach the crop's side, taken out where they are thin
    hh, ww = body.shape; long_ = nd.binary_opening(body, structure=np.ones((1, max(3, int(ww * .3)))))
    lab, n = nd.label(long_); edge = np.unique(np.concatenate([lab[:, :3].ravel(), lab[:, -3:].ravel()])); long_ = np.isin(lab, edge[edge > 0])
    thick = nd.uniform_filter(body.astype(float), size=(max(3, int(hh * .07)), 1)) * hh * .07   # ink rows round each cell, in a window of 7 % of the height
    body &= ~(long_ & (thick < hh * float(os.environ['STAFF'])))
lab, n = nd.label(body); sz = nd.sum(body, lab, range(1, n + 1)); body = np.isin(lab, [i + 1 for i in range(n) if sz[i] >= sz.max() * E('KEEP', .12)])
if os.environ.get('CENTER'):   # only pieces centred in the crop's middle (a neighbour's letter, a rubric left out), and no long thin run (a staff line)
    c = float(os.environ['CENTER']); hh, ww = body.shape; lab, n = nd.label(body); keep = []
    for i, sl in enumerate(nd.find_objects(lab)):
        ys_, xs_ = np.nonzero(lab[sl] == i + 1); cy, cx = (ys_.mean() + sl[0].start) / hh, (xs_.mean() + sl[1].start) / ww
        bh, bw = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if c <= cx <= 1 - c * .3 and .08 <= cy <= .92 and not (bw > bh * 7 and bh < hh * .06): keep.append(i + 1)
    body = np.isin(lab, keep)
c = max(1, int(E('CLOSE', .03) * h0)); shut = nd.binary_closing(np.pad(body, c), iterations=c)[c:-c, c:-c] | body
holes = nd.binary_fill_holes(shut) & ~body; hl, hn = nd.label(holes); fr = share(paint, E('WIN', .05))
pan = np.zeros_like(body)
for i in range(1, hn + 1):
    m = hl == i
    if m.sum() > (h0 * .02) ** 2 and fr[m].mean() > E('LET', .38): pan |= m
let = body | pan | (shut & ~nd.binary_fill_holes(shut) )
let = nd.binary_closing(let, iterations=1) | body | pan
ys, xs = np.nonzero(let); bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1; H = by1 - by0
o = max(1, int(E('OPEN', .012) * H)); pan = nd.binary_opening(pan, iterations=o)
def polys(m):
    sm = nd.gaussian_filter(m.astype(float), max(.8, H * .004)); out = []
    for ct in find_contours(np.pad(sm, 1), .5):
        ct = approximate_polygon(ct - 1, max(.5, H * .0025))
        if len(ct) >= 4: out.append([[round((x - bx0) / H, 4), round((y - by0) / H, 4)] for y, x in ct])
    return out
if os.environ.get('DBG'):
    D = (X * 255).astype(np.uint8).copy(); D[let & ~pan] = (D[let & ~pan] * .5 + np.array([0, 200, 220]) * .5).astype(np.uint8); D[pan] = (D[pan] * .5 + np.array([230, 0, 200]) * .5).astype(np.uint8)
    Image.fromarray(D).save(os.environ['DBG'])
print(json.dumps({'name': name, 'src': f.split('/')[-1] + f' [{x0},{y0},{x1},{y1}]', 'a': round((bx1 - bx0) / H, 4), 'polys': polys(let), 'panels': polys(pan)}))
