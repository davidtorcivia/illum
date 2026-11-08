# the 26 from his own letters: his 16 completed (his16_done.npz) refitted as clean vector outlines, the other 10 cut from
# his strokes and set together, then a light hand (knife facets, eased corners, a slow edge wander). Block units, y down.
import numpy as np, sys, string
from PIL import Image, ImageDraw
from scipy import ndimage as nd
import potrace
from shapely.geometry import Polygon, box
from shapely.ops import unary_union
from shapely import affinity
A = .95; H = 700

def vec(m, up=2, sig=2.2):
    """mask (700) -> shapely, via potrace on a smoothed 2x raster (his grain kept, the trace's pixel steps gone)"""
    big = np.asarray(Image.fromarray(m.astype(np.uint8) * 255).resize((m.shape[1] * up, m.shape[0] * up), Image.BILINEAR)).astype(float)
    big = nd.gaussian_filter(big, sig) > 127; S = H * up
    paths = potrace.Bitmap(~big).trace(turdsize=40, alphamax=1.0, opticurve=False)
    g = None
    for c in paths:
        P_ = lambda q: (q.x, q.y) if hasattr(q, 'x') else tuple(q)
        pts = [P_(c.start_point)]
        for sgm in c.segments:
            if sgm.is_corner: pts += [P_(sgm.c), P_(sgm.end_point)]
            else:
                p0 = np.array(pts[-1]); a, b, e = (np.array(P_(q)) for q in (sgm.c1, sgm.c2, sgm.end_point))
                pts += [tuple((1-t)**3*p0 + 3*(1-t)**2*t*a + 3*(1-t)*t**2*b + t**3*e) for t in np.linspace(0, 1, 10)[1:]]
        p = Polygon([(x / S, y / S) for x, y in pts]).buffer(0)
        g = p if g is None else g.symmetric_difference(p)
    return g

def cut(g, x0, y0, x1, y1): return g.intersection(box(x0, y0, x1, y1))
def mv(g, dx, dy): return affinity.translate(g, dx, dy)
def sc(g, fx, fy, o): return affinity.scale(g, fx, fy, origin=o)

def derive(L):
    C, O, P, K, I, T, V, F, Lt = (L[c] for c in 'COPKITVFL')
    out = {}
    hb = cut(Lt, .05, .07, .50, .21)                                                            # his L's head bar
    out['E'] = unary_union([C, mv(hb, .08, .385)])                                             # his C, his L's bar at the middle
    out['G'] = unary_union([C, mv(cut(Lt, .55, .46, .86, .97), .02, -.02)])                     # his C, his L's right upright for a beard
    leg = sc(cut(K, .36, .43, .88, .90), 1, .72, (.40, .44))
    out['R'] = unary_union([P, mv(leg, -.06, .155)])                                           # his P, his K's leg from the bowl's foot
    out['Q'] = unary_union([O, mv(sc(cut(K, .50, .55, .88, .90), .7, .6, (.5, .55)), .10, .24)])     # his O, the end of his K's leg
    out['D'] = unary_union([cut(P, 0, 0, .33, 1), mv(cut(O, .42, 0, 1, 1), -.12, 0), mv(cut(O, .30, 0, .45, .2), -.06, .02), mv(cut(O, .30, .8, .45, 1), -.06, -.02)])
    lowC = affinity.scale(cut(C, 0, .52, .62, 1), -1, 1, origin=(A / 2, 0))
    out['J'] = unary_union([cut(I, 0, 0, 1, .66), mv(lowC, -.44, -.02)])                        # his I, his C's lower bowl turned
    stemI = sc(cut(I, .2, .05, .6, .95), .85, .92, (.38, .9))
    out['U'] = unary_union([cut(T, 0, .14, .70, 1), mv(stemI, .40, 0)])                         # his T's bowl, his I's stem
    v = sc(V, .62, 1, (0, 0)); out['W'] = unary_union([mv(v, .02, 0), mv(v, .34, 0)])            # two of his V
    j = (.395, .44)   # his K's junction: arm up-right (thin), leg down-right (thick); each turned about it for the other half
    arm = cut(K, .36, .08, .84, .455); legk = cut(K, .37, .43, .88, .90)
    rot = lambda g: affinity.rotate(g, 180, origin=j)
    X = unary_union([arm, legk, rot(arm), rot(legk)]); bx = X.bounds
    X = sc(X, 1, .80 / (bx[3] - bx[1]), j); bx = X.bounds; out['X'] = mv(X, A / 2 - (bx[0] + bx[2]) / 2, .5 - (bx[1] + bx[3]) / 2)
    Yh = unary_union([arm, rot(legk)]); stem = cut(K, .08, .50, .36, .90)
    yb = Yh.bounds; Yh = mv(Yh, A / 2 - j[0] - .02, .52 - j[1])
    st = mv(stem, A / 2 - .225 - .02, 0)
    Y = unary_union([Yh, st, box(A / 2 - .07, .47, A / 2 + .03, .56)]); by = Y.bounds; out['Y'] = sc(Y, 1, .82 / (by[3] - by[1]), (A / 2, by[3]))
    by = out['Y'].bounds; out['Y'] = mv(out['Y'], 0, .91 - by[3])
    diag = affinity.scale(unary_union([legk, rot(legk)]), -1, 1, origin=j)                       # the thick stroke, turned to run / as Z's
    db = diag.bounds; diag = sc(diag, 1, .74 / (db[3] - db[1]), j); db = diag.bounds; diag = mv(diag, A / 2 - (db[0] + db[2]) / 2, .5 - (db[1] + db[3]) / 2)
    out['Z'] = unary_union([diag, mv(sc(hb, 1.45, 1, (.27, .14)), .10, .0), mv(sc(hb, 1.55, 1, (.27, .14)), .08, .73)])  # his L's bar above and below
    c2 = sc(C, .74, .5, (A / 2, .07)).buffer(.016, join_style='mitre'); out['S'] = unary_union([c2, affinity.rotate(c2, 180, origin=(A / 2, .5))])  # his C over his C turned
    return out

def hand(g, rng, facet=.0028, ease=.0025, amp=.0008):
    g = g.simplify(facet, preserve_topology=True)
    g = g.buffer(-ease, join_style='round').buffer(ease, join_style='round')
    def one(ring):
        c = np.array(ring.coords)[:-1]
        if len(c) < 4: return c
        d = np.r_[0, np.cumsum(np.hypot(*np.diff(c, axis=0).T))]; ph = rng.uniform(0, 6.3, 3)
        off = sum(np.sin(d / .05 * m + ph[m - 1]) / m for m in (1, 2, 3)) * amp
        t = np.roll(c, -1, 0) - np.roll(c, 1, 0); nv = np.stack([t[:, 1], -t[:, 0]], 1); nv /= np.linalg.norm(nv, axis=1, keepdims=True) + 1e-12
        return c + nv * off[:, None]
    return unary_union([Polygon(one(p.exterior), [one(r) for r in p.interiors]).buffer(0) for p in getattr(g, 'geoms', [g]) if p.area > 2e-5])

def raster(g, h=700, ss=4):
    W = round(h * A); im = Image.new('L', (W * ss, h * ss), 0); d = ImageDraw.Draw(im)
    for p in getattr(g, 'geoms', [g]):
        if p.is_empty: continue
        d.polygon([(x * h * ss, y * h * ss) for x, y in p.exterior.coords], fill=255)
        for r in p.interiors: d.polygon([(x * h * ss, y * h * ss) for x, y in r.coords], fill=0)
    return np.asarray(im.resize((W, h), Image.LANCZOS))

if __name__ == '__main__':
    D = np.load('his16_done.npz'); L = {c: vec(D[c]) for c in D.files}
    L.update(derive(L)); rng = np.random.default_rng(3)
    G = {c: hand(L[c], rng) for c in string.ascii_uppercase}
    np.savez_compressed('k26v.npz', **{c: raster(G[c]) for c in G})
    import pickle; pickle.dump(G, open('k26v.pkl', 'wb'))
