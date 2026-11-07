# tools/kcompose.py: a Kelmscott white-vine initial for a letter Morris never cut in that series (research/16-kelmscott.md,
# "composed by us"), made only from his own cutting. Two sources, both traced (tools/tracecut.py):
#   the LETTER: the same letter in his two-line series (a black capital, edged in white, a white leaf in its counter), or a
#     capital of his Chaucer type from a printed page. The two-line letter is taken with its colours turned, as his white-
#     vine capitals are cut: the black body becomes the white letter, and its white leaf becomes a black leaf cut into it.
#   the GROUND: a white-vine block of his whose letter the new one most nearly covers (E and G on C, Q and D on O, R on P,
#     W on M, Y on V, X on K). Its own letter is cut away (the thick white mass the vine grows from, found by its width),
#     the new letter laid in its place with a black line round it, as his letters stand clear of their vine; a stem the
#     old letter fed and the new one does not is left to end in the black, and a short stub of it is filled; where the
#     old letter leaves a bare patch of black, it is seeded with the donor's own white dots, as his grounds are.
# usage: uv run --with pillow --with numpy --with scipy --with scikit-image python -I tools/kcompose.py NAME DONOR.json LETTER.json
#          OUT.json [--type] [--box x0,y0,x1,y1] [DBG.png]
#   --type: LETTER is a type capital (its black is the letter, no colours turned). --box: where the letter stands in the block
#   (units of the block's height; default its old letter's box). Output: tracecut's JSON, with "composed": true.
import sys, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from skimage.measure import find_contours, approximate_polygon

a = sys.argv[1:]; name, donor, letter, out = a[:4]; typ = '--type' in a; box = None; dbg = None
if '--box' in a: box = [float(v) for v in a[a.index('--box') + 1].split(',')]
rest = [x for i, x in enumerate(a[4:]) if not x.startswith('--') and (i == 0 or not a[4 + i - 1] == '--box')]
dbg = rest[-1] if rest and rest[-1].endswith('.png') else None
H = 900
THIN = float(__import__('os').environ.get('THIN', .012))   # the letter thinned by this (units of the height): the type is heavier than his cut capitals
def bitmap(f, h):
    d = json.load(open(f)); w = max(1, round(d['a'] * h)); ss = 2; acc = np.zeros((h * ss, w * ss), bool)
    for p in d['polys']:
        im = Image.new('1', (w * ss, h * ss), 0); ImageDraw.Draw(im).polygon([(x * h * ss, y * h * ss) for x, y in p], fill=1); acc ^= np.asarray(im)
    return np.asarray(Image.fromarray(acc.astype(np.uint8) * 255).resize((w, h), Image.LANCZOS)) > 127, d
ink, D = bitmap(donor, H); W0 = ~ink; h, w = ink.shape
# the old letter: the white whose width is a letter's (over ~3.2 % of the height), grown back over its own white to its edge;
# its largest piece (a flower or a leaf can be as wide, but is small)
dt = nd.distance_transform_edt(W0); core = dt > H * .016
lab, k = nd.label(core); sz = nd.sum(core, lab, range(1, k + 1)); keep = np.isin(lab, [i + 1 for i in np.argsort(sz)[::-1][:3] if sz[i] > sz.max() * .12])
old = nd.binary_dilation(keep, iterations=int(H * .018)) & W0
oy, ox = np.nonzero(old); obox = [ox.min() / H, oy.min() / H, ox.max() / H, oy.max() / H]
if box is None: box = obox
# the new letter's silhouette (white) and what is cut into it (black)
L, _ = bitmap(letter, 700)
if typ:   # the type capital: its largest piece (a neighbour's edge in the crop dropped), its counters the ground
    lab, k = nd.label(L); sz = nd.sum(L, lab, range(1, k + 1)); body = lab == (np.argmax(sz) + 1); cut = nd.binary_fill_holes(body) & ~body; body = body | cut
else:
    # the two-line block: the letter's body is its thick black (the scalloped ground is thin), grown back to its edge
    t = L.shape[0] * .019; dtb = nd.distance_transform_edt(L); core = dtb > t
    lab, k = nd.label(core); sz = nd.sum(core, lab, range(1, k + 1)); core = np.isin(lab, [i + 1 for i in range(k) if sz[i] > sz.max() * .08])
    body0 = nd.binary_dilation(core, iterations=int(t * 1.35)) & L
    body0 = nd.binary_opening(body0, iterations=2)
    body = nd.binary_fill_holes(body0); cut = body & ~body0   # the leaf (and any white in the body)
ys, xs = np.nonzero(body); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1; body = body[y0:y1, x0:x1]; cut = cut[y0:y1, x0:x1]
bx0, by0, bx1, by1 = [round(v * H) for v in box]; tw, th = bx1 - bx0, by1 - by0
s = min(tw / body.shape[1], th / body.shape[0]); nw, nh = round(body.shape[1] * s), round(body.shape[0] * s)
nw = min(tw, round(nw * 1.15)) if nw < tw * .9 else nw   # (a narrow letter widened a little toward the block's width, as his are cut to fill it)
rs = lambda m: np.asarray(Image.fromarray(m.astype(np.uint8) * 255).resize((nw, nh), Image.LANCZOS).filter(__import__('PIL.ImageFilter', fromlist=['x']).GaussianBlur(H / 260))) > 127
N = np.zeros_like(ink); C = np.zeros_like(ink); px, py = bx0 + (tw - nw) // 2, by0 + (th - nh) // 2
N[py:py + nh, px:px + nw] = rs(body); C[py:py + nh, px:px + nw] = rs(cut)
ring = nd.binary_erosion(N, iterations=int(H * THIN)) & ~C if THIN else N & ~C   # (thinned toward the weight of his letters' strokes)
# the letter's white (its counter and the leaf in it are the ground: his vine shows through, as in his letters)
gap = nd.binary_dilation(ring, iterations=max(2, int(H * .008)))   # the black line round the letter
white = W0 & ~old & ~gap
# stubs: white pieces left small by the cutting (a stem's end, a sliver), filled
lab, k = nd.label(white); sz = nd.sum(white, lab, range(1, k + 1)); touched = set(np.unique(lab[nd.binary_dilation(old | gap, iterations=2) & white])) - {0}
for i in touched:
    if sz[i - 1] < H * H * .0009: white[lab == i] = False
# bare black where the old letter stood: seeded with the donor's dots (its small round white islands), spaced as his are
lab, k = nd.label(W0); sz = nd.sum(W0, lab, range(1, k + 1)); objs = nd.find_objects(lab); rnd = lambda i: (lambda sl: .7 < (sl[1].stop - sl[1].start) / max(1, sl[0].stop - sl[0].start) < 1.4 and sz[i] > .55 * (sl[1].stop - sl[1].start) * (sl[0].stop - sl[0].start))(objs[i])
dots = [objs[i] for i in np.argsort(sz) if H * H * 2e-5 < sz[i] < H * H * 1.6e-4 and rnd(i)][-12:]   # (round ones only: his dots, not a stem's end)
far = nd.distance_transform_edt(~(white | gap | ring)) > H * .026
rng = np.random.default_rng(7); placed = 0
if dots:
    for _ in range(6000):
        y, x = rng.integers(0, h), rng.integers(0, w)
        if far[y, x] and old[y, x]:
            sl = dots[rng.integers(len(dots))]; dm = W0[sl]; dh, dw = dm.shape
            if y + dh < h and x + dw < w: white[y:y + dh, x:x + dw] |= dm & (lab[sl] > 0) if False else dm; far[max(0, y - int(H * .05)):y + int(H * .05), max(0, x - int(H * .05)):x + int(H * .05)] = False; placed += 1
white |= ring
ink = ~white
# the block's own frame kept (a black margin, as the donor's)
if dbg: Image.fromarray((white * 255).astype(np.uint8)).save(dbg)
polys = []
for ct in find_contours(np.pad(ink.astype(float), 1), .5):
    ct = approximate_polygon(ct - 1, .5)
    if len(ct) >= 4: polys.append([[round(x / H, 4), round(y / H, 4)] for y, x in ct])
json.dump({'name': name, 'src': f'composed: letter {letter.split("/")[-1]}{" (type)" if typ else " (two-line, colours turned)"} on the ground of {donor.split("/")[-1]}',
           'a': round(w / H, 4), 'polys': polys, 'white': D.get('white'), 'black': D.get('black'), 'composed': True}, open(out, 'w'))
print(name, 'old letter box', [round(v, 3) for v in obox], 'dots', placed)
