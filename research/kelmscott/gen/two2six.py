# the ten missing six-line capitals from Morris's own two-line initials (E G R W Y Q; U = his two-line N turned; J = his
# two-line I with the tail of his two-line Y), D and X from his two-line strokes. Each: the letter's own black body cut
# from its block, refitted as smooth Béziers (potrace, kfont.py's settings), taken down to six-line weight by a vector
# offset, set at six-line proportions (cap ~.80 of the block, foot on .89). Block units, y down; the block is A wide.
import numpy as np, io, sys, pickle
from fontTools.ttLib import TTFont
from PIL import Image, ImageFont, ImageDraw
from scipy import ndimage as nd
import potrace
from shapely.geometry import Polygon, box, LineString
from shapely.ops import unary_union
from shapely import affinity
A = .95; S = 1000; STEM6 = .105; CAP = .80; BASE = .89

def ink(ch):
    t = TTFont(f'/nvme-mirror/DEV/illum/playground/fonts/kelmscott/kelmscott-two-s{ch}.woff2'); t.flavor = None; b = io.BytesIO(); t.save(b); b.seek(0)
    cp = list(t.getBestCmap().keys())[0]; fo = ImageFont.truetype(b, S); bb = fo.getbbox(chr(cp))
    im = Image.new('L', (bb[2] - bb[0] + 20, bb[3] - bb[1] + 20), 0); ImageDraw.Draw(im).text((10 - bb[0], 10 - bb[1]), chr(cp), font=fo, fill=255)
    return np.asarray(im) > 127

def body(ch, r=7):
    """the letter's black: the largest piece not joined to the frame once thin joins are opened, grown back inside the ink,
    with any solid separate piece of it (E's bar)"""
    k = ink(ch); e = nd.binary_erosion(k, iterations=r); lab, n = nd.label(e); sz = nd.sum(e, lab, range(1, n + 1))
    edge = set(np.unique(np.r_[lab[:20].ravel(), lab[-20:].ravel(), lab[:, :20].ravel(), lab[:, -20:].ravel()])) - {0}
    ids = [i + 1 for i in np.argsort(-sz) if i + 1 not in edge]
    main = lab == ids[0]; keep = main.copy()
    for i in ids[1:4]:
        c = lab == i; ys, xs = np.nonzero(c)
        if c.sum() < .02 * main.sum(): continue
        hull_fill = c.sum() / ((ys.max() - ys.min() + 1) * (xs.max() - xs.min() + 1))
        if hull_fill > .55: keep |= c   # a solid bar, not a counter's leafwork
    m = keep
    for _ in range(r + 1): m = nd.binary_dilation(m) & k
    holes = nd.binary_fill_holes(m) & ~m; return m | (holes & ~big_holes(m))

def big_holes(m):
    h = nd.binary_fill_holes(m) & ~m; lab, n = nd.label(h); sz = nd.sum(h, lab, range(1, n + 1))
    return np.isin(lab, 1 + np.nonzero(sz > 400)[0])

def vec(m):
    def P_(q): return (q.x, q.y) if hasattr(q, 'x') else tuple(q)
    big = nd.gaussian_filter(m.astype(float), 1.5) > .5
    try: paths = potrace.Bitmap(~big).trace(turdsize=2, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.2, opticurve=True, opttolerance=1.5)
    except ValueError: paths = potrace.Bitmap(~big).trace(turdsize=2, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.2, opticurve=False)
    g = None; H = m.shape[0]
    for c in paths:
        pts = [P_(c.start_point)]
        for sg in c.segments:
            if sg.is_corner: pts += [P_(sg.c), P_(sg.end_point)]
            else:
                p0 = np.array(pts[-1]); a, b, e = (np.array(P_(q)) for q in (sg.c1, sg.c2, sg.end_point))
                pts += [tuple((1-t)**3*p0 + 3*(1-t)**2*t*a + 3*(1-t)*t**2*b + t**3*e) for t in np.linspace(0, 1, 18)[1:]]
        p = Polygon(pts).buffer(0); g = p if g is None else g.symmetric_difference(p)
    return g   # in pixels of the two-line raster

def stemw(g):
    """its main stroke: the narrower half of horizontal runs across the middle"""
    b = g.bounds; xs = []
    for y in np.linspace(b[1] + .35 * (b[3] - b[1]), b[1] + .65 * (b[3] - b[1]), 9):
        s = g.intersection(LineString([(b[0] - 1, y), (b[2] + 1, y)]))
        xs += [q.length for q in getattr(s, 'geoms', [s]) if not s.is_empty and q.length > .02]
    xs = sorted(xs); return float(np.median(xs[:max(1, len(xs) // 2)]))

def six(g, capref=None):
    """to six-line proportions and weight: cap height CAP (its height, or capref's), foot on BASE, centred, stroke STEM6"""
    b = g.bounds; h = capref or (b[3] - b[1]); k = CAP / h
    g = affinity.scale(g, k, k, origin=(0, 0)); b = g.bounds
    g = affinity.translate(g, A / 2 - (b[0] + b[2]) / 2, BASE - b[3]); sw = stemw(g)
    g = g.buffer((STEM6 - sw) / 2, join_style='round', quad_segs=16)
    b = g.bounds
    if b[2] - b[0] > .88: g = affinity.scale(g, .88 / (b[2] - b[0]), 1, origin=(A / 2, BASE))
    return g

if __name__ == '__main__':
    RR = dict(Q=14, I=18, G=14)
    V = {c: vec(body(c, RR.get(c, 7))) for c in 'EGRWYQNIKO'}
    out = {}
    qb = V['Q'].bounds; V['Q'] = V['Q'].intersection(box(qb[0] + .12 * (qb[2] - qb[0]), qb[1], qb[2], qb[3]))   # (a leaf of its block left on)
    for c in 'ERWYQ': out[c] = six(V[c])
    # G: his two-line G's bowl (its block is cropped below, losing the curl), with a beard: his two-line I's lower stem
    Gb, Ib = V['G'], V['I']; gb, ib = Gb.bounds, Ib.bounds
    beard = Ib.intersection(box(ib[0], ib[1] + .5 * (ib[3] - ib[1]), ib[2], ib[3]))
    beard = affinity.scale(beard, .62, .62, origin=(ib[0], ib[3])); bb = beard.bounds
    beard = affinity.translate(beard, gb[0] + .80 * (gb[2] - gb[0]) - (bb[0] + bb[2]) / 2, gb[3] - bb[3])
    out['G'] = six(unary_union([Gb, beard]))
    out['U'] = six(affinity.rotate(V['N'], 180, origin='centroid'))                                   # his two-line n, turned: u
    I = V['I']; bi = I.bounds; Ur = affinity.rotate(V['N'], 180, origin='centroid'); ub = Ur.bounds
    curl = Ur.intersection(box(ub[0], ub[1] + .55 * (ub[3] - ub[1]), ub[0] + .55 * (ub[2] - ub[0]), ub[3]))   # the foot of his two-line n turned: a stroke curving off
    curl = affinity.scale(curl, -1, 1, origin='centroid'); cb = curl.bounds
    Itop = I.intersection(box(bi[0], bi[1], bi[2], bi[1] + .70 * (bi[3] - bi[1])))
    sx = (bi[0] + bi[2]) / 2; curl = affinity.translate(curl, sx - cb[2] + .17 * (cb[2] - cb[0]), bi[1] + .62 * (bi[3] - bi[1]) - cb[1])
    tail = curl
    out['J'] = six(unary_union([Itop, tail]))
    O, K = V['O'], V['K']; bo, bk = O.bounds, K.bounds
    stemK = K.intersection(box(bk[0], bk[1], bk[0] + .26 * (bk[2] - bk[0]), bk[3]))                   # his two-line K's stem
    half = O.intersection(box((bo[0] + bo[2]) / 2 - .05 * (bo[2] - bo[0]), bo[1], bo[2], bo[3]))
    sb = stemK.bounds; half = affinity.scale(half, 1, (sb[3] - sb[1]) / (bo[3] - bo[1]), origin=(bo[0], bo[1]))
    hb = half.bounds; half = affinity.translate(half, sb[2] - .02 * (bk[2] - bk[0]) - hb[0], sb[1] - hb[1])
    out['D'] = six(unary_union([stemK, half]))                                                        # his two-line K's stem, the right of his two-line O
    # X: his two-line K's arm and leg, each turned about their junction (thick \\, thin /), as in his broad pen
    arm = K.intersection(box(bk[0] + .38 * (bk[2] - bk[0]), bk[1], bk[2], bk[1] + .52 * (bk[3] - bk[1])))
    leg = K.intersection(box(bk[0] + .38 * (bk[2] - bk[0]), bk[1] + .48 * (bk[3] - bk[1]), bk[2], bk[3]))
    j = (bk[0] + .42 * (bk[2] - bk[0]), bk[1] + .52 * (bk[3] - bk[1]))
    rot = lambda q: affinity.rotate(q, 180, origin=j)
    out['X'] = six(unary_union([arm, leg, rot(arm), rot(leg)]))
    pickle.dump(out, open('ten.pkl', 'wb')); pickle.dump(V, open('two_vec.pkl', 'wb'))
    for c, g in out.items(): print(c, g.geom_type, round(g.area, 3), [round(v, 2) for v in g.bounds])
