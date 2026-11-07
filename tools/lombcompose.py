# tools/lombcompose.py: the choir book's Lombardic alphabet (research/17-choirbook.md §6) cleaned and completed from its own
# traced letters (tools/tracelomb.py). Each output letter is a union of pieces of traced letters: a piece is a traced
# letter (its silhouette), cropped, with rectangles erased (a penwork stub, a neighbour's stroke), placed, scaled and
# mirrored; nothing is drawn that a scribe did not paint. A traced letter kept whole is one piece; a missing letter is
# made from strokes of the set (P from I's stem and O's bowl, R from P and K's leg, and so on: the spec says which).
# usage: uv run --with pillow --with numpy --with scipy --with scikit-image python -I tools/lombcompose.py SPEC.json SRCDIR OUTDIR
#   SPEC: { NAME: { char, pieces: [{ src, crop?: [x0, y0, x1, y1], erase?: [[x0, y0, x1, y1]...] (src units: its height = 1),
#           at?: [x, y] (where the crop's top left goes, output units), s?: scale, fx?: mirror, fy?: flip }], note } }
#   SRCDIR/<src>.json: tracelomb.py's output. Output: OUTDIR/<NAME>.json in the same form ({ name, char, src, a, polys }),
#   its height the letter's ink height (cap line to baseline).
import sys, json, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from skimage.measure import find_contours, approximate_polygon
spec, srcdir, outdir = sys.argv[1:4]; R = 600; os.makedirs(outdir, exist_ok=True)
def raster(d, h=R):
    w = max(1, round(d['a'] * h)); acc = np.zeros((h * 2, w * 2), bool)
    for p in d['polys']:
        im = Image.new('1', (w * 2, h * 2), 0); ImageDraw.Draw(im).polygon([(x * h * 2, y * h * 2) for x, y in p], fill=1); acc ^= np.asarray(im)
    return np.asarray(Image.fromarray(acc.astype(np.uint8) * 255).resize((w, h), Image.LANCZOS)) > 127
for name, L in json.load(open(spec)).items():
    if name.startswith('_'): continue
    canvas = np.zeros((R * 2, R * 4), bool); oy, ox = R // 2, R // 2
    for pc in L['pieces']:
        m = raster(json.load(open(f"{srcdir}/{pc['src']}.json"))).copy()
        for e in pc.get('erase', []): x0, y0, x1, y1 = [round(v * R) for v in e]; m[max(0, y0):y1, max(0, x0):x1] = False
        c = pc.get('crop'); m = m[round(c[1] * R):round(c[3] * R), round(c[0] * R):round(c[2] * R)] if c else m
        if pc.get('fx'): m = m[:, ::-1]
        if pc.get('fy'): m = m[::-1]
        s = pc.get('s', 1)
        if s != 1: m = np.asarray(Image.fromarray(m.astype(np.uint8) * 255).resize((max(1, round(m.shape[1] * s)), max(1, round(m.shape[0] * s))), Image.LANCZOS)) > 127
        x, y = [round(v * R) for v in pc.get('at', [0, 0])]; h, w = m.shape
        canvas[oy + y:oy + y + h, ox + x:ox + x + w] |= m
    canvas = nd.binary_closing(canvas, iterations=2) | canvas   # pieces meet without a seam
    # faired: the scan's grain and a join's step smoothed away (a Gaussian of FAIR of the height, then cut at half), small
    # notches filled and burrs taken off at the same scale; the strokes' swell, being larger, is kept
    ys_, xs_ = np.nonzero(canvas); Hc = ys_.max() - ys_.min() + 1; f = float(os.environ.get('FAIR', .009)) * Hc
    if f > 0:
        k = max(1, int(f * .8)); canvas = nd.binary_opening(nd.binary_closing(np.pad(canvas, k + 2), iterations=k), iterations=k)[k + 2:-k - 2, k + 2:-k - 2]
        canvas = nd.gaussian_filter(canvas.astype(float), f) > .5
    ys, xs = np.nonzero(canvas); bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1; H = by1 - by0
    sm = nd.gaussian_filter(canvas.astype(float), 1.2); polys = []
    for ct in find_contours(np.pad(sm, 1), .5):
        ct = approximate_polygon(ct - 1, .6)
        if len(ct) >= 4: polys.append([[round((x - bx0) / H, 4), round((y - by0) / H, 4)] for y, x in ct])
    json.dump({'name': name, 'char': L['char'], 'src': L.get('note', ' + '.join(p['src'] for p in L['pieces'])), 'a': round((bx1 - bx0) / H, 4), 'polys': polys}, open(f'{outdir}/{name}.json', 'w'))
    print(name, L['char'], round((bx1 - bx0) / H, 3))
