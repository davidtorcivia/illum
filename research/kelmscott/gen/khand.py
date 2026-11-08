# khand: a designed face's capital (OFL) cut by Morris's hand, all in vector (shapely), rasterised only to look at.
#   weight  -> the outline offset until the main stem is his .105 of the block (his strokes are sturdy, moderate contrast)
#   feet    -> his broad concave flares: a closing (offset out, then in, by r) kept only near the foot and head lines,
#              which fills the angle between stem and serif with a concave bracket of radius r
#   facets  -> the outline simplified to straight knife cuts, convex corners just eased
#   notches -> small triangular bites from the long sides, ~1 per unit of outline (his median)
#   edge    -> a slow wander of the vertices along the normal, his amplitude
import sys, math, numpy as np
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from shapely.geometry import Polygon, MultiPolygon, box, LineString
from shapely.ops import unary_union
from shapely import affinity
from PIL import Image, ImageDraw

A = .95
P = dict(cap=.78, base=.885, stem=.105, flare_r=.07, band=.15, facet=.004, ease=.003, notch=1.0, edge=.0012, seed=1)

class Flat(BasePen):
    def __init__(s, gs): super().__init__(gs); s.cs = []; s.cur = []
    def _moveTo(s, p): s.cur = [p]
    def _lineTo(s, p): s.cur.append(p)
    def _curveToOne(s, a, b, c):
        p0 = np.array(s.cur[-1]); a, b, c = map(np.array, (a, b, c))
        for t in np.linspace(0, 1, 14)[1:]: s.cur.append(tuple((1-t)**3*p0 + 3*(1-t)**2*t*a + 3*(1-t)*t**2*b + t**3*c))
    def _qCurveToOne(s, a, b):
        p0 = np.array(s.cur[-1]); a, b = map(np.array, (a, b))
        for t in np.linspace(0, 1, 10)[1:]: s.cur.append(tuple((1-t)**2*p0 + 2*(1-t)*t*a + t**2*b))
    def _closePath(s):
        if len(s.cur) > 2: s.cs.append(s.cur)
        s.cur = []
    _endPath = _closePath

def outline(font, ch):
    f = TTFont(font); gs = f.getGlyphSet(); name = f.getBestCmap()[ord(ch)]
    pen = Flat(gs); gs[name].draw(pen); g = None
    for c in pen.cs:
        p = Polygon(c).buffer(0); g = p if g is None else g.symmetric_difference(p)
    ph = Flat(gs); gs[f.getBestCmap()[ord('H')]].draw(ph); capH = max(y for c in ph.cs for x, y in c)
    return g, capH, gs[name].width

def stem_width(g, H):
    """the main stem: the most common horizontal run length at mid cap height"""
    xs = []
    for y in np.linspace(.35, .65, 7) * H:
        seg = g.intersection(LineString([(-1e4, y), (1e4, y)]))
        for s in getattr(seg, 'geoms', [seg]):
            if not s.is_empty: xs.append(s.length)
    xs = sorted(x for x in xs if x > .02); return float(np.median(xs[:max(1, len(xs) // 2)])) if xs else .1   # (the stems: the narrower half of the runs)

def place(g, capH, P):
    """font units (y up) -> block units (y down): cap height P['cap'], baseline P['base'], centred"""
    k = P['cap'] / capH; g = affinity.scale(g, k, -k, origin=(0, 0)); g = affinity.translate(g, 0, P['base'])
    b = g.bounds; f = min(1, .86 / (b[2] - b[0]), (.94 - (P['base'] - P['cap'])) / max(1e-6, b[3] - (P['base'] - P['cap'])))   # wide or descending: fit the block
    if f < 1: g = affinity.scale(g, f, f, origin=(A / 2, P['base'] - P['cap'] if b[3] > .945 else P['base'])); b = g.bounds
    return affinity.translate(g, A / 2 - (b[0] + b[2]) / 2, 0)

def wander(g, amp, rng, wl=.06):
    def one(ring):
        c = np.array(ring.coords)[:-1]; n = len(c)
        if n < 4: return c
        d = np.r_[0, np.cumsum(np.hypot(*np.diff(np.vstack([c, c[:1]]), axis=0).T))]; L = d[-1]
        k = max(2, int(L / wl)); ph = rng.uniform(0, 2 * np.pi, 3)
        off = sum(np.sin(2 * np.pi * d[:-1] / L * m * k / 3 + ph[m - 1]) / m for m in (1, 2, 3)) * amp / 1.5
        t = np.roll(c, -1, 0) - np.roll(c, 1, 0); nv = np.stack([t[:, 1], -t[:, 0]], 1); nv /= np.linalg.norm(nv, axis=1, keepdims=True) + 1e-12
        return c + nv * off[:, None]
    polys = getattr(g, 'geoms', [g]); out = []
    for p in polys:
        out.append(Polygon(one(p.exterior), [one(r) for r in p.interiors]).buffer(0))
    return unary_union(out)

def notches(g, density, rng, P):
    """small triangular bites from the long straight sides"""
    cuts = []
    for p in getattr(g, 'geoms', [g]):
        c = np.array(p.exterior.coords); seg = np.diff(c, axis=0); L = np.hypot(*seg.T); tot = L.sum()
        n = rng.poisson(density * tot)
        long_ = np.nonzero(L > .05)[0]
        if not len(long_): continue
        for _ in range(n):
            i = rng.choice(long_); t = rng.uniform(.25, .75); q = c[i] + seg[i] * t; u = seg[i] / L[i]
            nv = np.array([u[1], -u[0]])   # outward for a CCW exterior in y-down coords: check by a point test
            if p.contains(LineString([q, q + nv * .004]).interpolate(1)): nv = -nv
            s = rng.uniform(.010, .017)
            cuts.append(Polygon([q - u * s * .4, q + u * s * 1.1, q - nv * s + u * s * rng.uniform(-.1, .3)]))
    return g.difference(unary_union(cuts)) if cuts else g

def flares(g, foot, rng, spread=.10, h=.16):
    """his broad concave feet, drawn on each upright stem: from the stem's edge h above the line, a concave curve
    (a quadratic pulled toward the corner) out to a blunt tip `spread` beyond the edge, each side its own size"""
    yb = P['base'] if foot else P['base'] - P['cap']; sg = 1 if foot else -1; out = []
    def runs(y):
        seg = g.intersection(LineString([(-1, y), (2, y)])); return [q.bounds for q in getattr(seg, 'geoms', [seg]) if not q.is_empty and q.length > .02]
    for side_h in (1,):
        mids = runs(yb - sg * h * .5)
        for t in runs(yb - sg * h):
            tc = (t[0] + t[2]) / 2; m = [q for q in mids if q[0] < tc < q[2]]
            if not m or abs((m[0][0] + m[0][2]) / 2 - tc) > .015 or t[2] - t[0] > .17 or t[2] - t[0] < .05: continue   # upright stems only
            if abs((m[0][2] - m[0][0]) - (t[2] - t[0])) > .3 * (t[2] - t[0]): continue
            slab = [q for q in runs(yb - sg * .012) if q[0] < tc < q[2]]
            if not slab or slab[0][2] - slab[0][0] < (t[2] - t[0]) * 1.25: continue   # it must stand on a serif
            for xe, dx in ((t[0], -1), (t[2], 1)):
                H = h * rng.uniform(.8, 1.15); S = spread * rng.uniform(.75, 1.2); tip = rng.uniform(.008, .018)
                P0 = np.array([xe - dx * .004, yb - sg * H]); P2 = np.array([xe + dx * S, yb - sg * tip]); corner = np.array([xe, yb]); C = (P0 + P2) / 2 + .5 * (corner - (P0 + P2) / 2)
                tt = np.linspace(0, 1, 16)[:, None]; cur = (1 - tt) ** 2 * P0 + 2 * (1 - tt) * tt * C + tt ** 2 * P2
                poly = Polygon(list(map(tuple, cur)) + [(xe + dx * S, yb + sg * .002), (xe - dx * .004, yb + sg * .002)]).buffer(0)
                out.append(poly)
    return out

def hand(font, ch, P=P):
    rng = np.random.default_rng(P['seed'] * 1000 + ord(ch))
    g, capH, adv = outline(font, ch); g = place(g, capH, P)
    gi, ci, _ = outline(font, 'I'); sw = stem_width(place(gi, ci, P), 1); d = (P['stem'] - sw) / 2   # one weight for the face, from its I
    g = g.buffer(d, join_style='mitre', mitre_limit=3)                       # his weight
    g = unary_union([g] + flares(g, True, rng))   # his feet and heads
    g = g.simplify(P['facet'], preserve_topology=True)                        # the knife's straight cuts
    g = g.buffer(-P['ease'], join_style='round').buffer(P['ease'], join_style='round')
    g = notches(g, P['notch'], rng, P)
    g = wander(g, P['edge'], rng)
    return g

def raster(g, H=700, ss=4):
    W = round(H * A); im = Image.new('L', (W * ss, H * ss), 0); d = ImageDraw.Draw(im)
    for p in getattr(g, 'geoms', [g]):
        d.polygon([(x * H * ss, y * H * ss) for x, y in p.exterior.coords], fill=255)
        for r in p.interiors: d.polygon([(x * H * ss, y * H * ss) for x, y in r.coords], fill=0)
    return np.asarray(im.resize((W, H), Image.LANCZOS))   # coverage, antialiased (0-255)

if __name__ == '__main__':
    font = sys.argv[1]; out = {}
    for ch in sys.argv[2]: out[ch] = raster(hand(font, ch))
    np.savez_compressed(sys.argv[3], **out)
