# kleaf: Morris's foliage drawn, not stamped. A leaf is a curved blade grown along a spine that inherits its stem's
# curvature and curls at the tip; its width rises from a narrow stalk to its fullest about a third along and runs to a
# point; one side fuller than the other; lobes cut as smooth scallops; a black midrib and a few side veins cut into it.
# A tulip is three sculpted petals and a calyx. A tendril is a tapering hairline curl. All shapely, block units.
import numpy as np, math
from shapely.geometry import Polygon, Point, LineString
from shapely.ops import unary_union

def spine(p, a, L, k0, k1, n=None, curl=0.):
    n = n or max(16, int(L / .003)); pts = [np.array(p, float)]; angs = [a]; ds = L / n
    for i in range(n):
        t = i / n; a += (k0 + (k1 - k0) * t + curl * max(0, t - .7) / .3 * 3) * ds
        pts.append(pts[-1] + ds * np.array([math.cos(a), math.sin(a)])); angs.append(a)
    return np.array(pts), np.array(angs)

def profile(t, kind='leaf'):
    """his leaf: narrow at the stalk, fullest ~.33, a long point (from the widths of his traced leaves)"""
    if kind == 'leaf': return np.sin(np.clip(t, 0, 1) ** .75 * math.pi) ** 1.15 * (1 - .25 * t)
    if kind == 'petal': return np.sin(np.clip(t, 0, 1) ** .9 * math.pi) ** .8
    return np.sin(np.clip(t, 0, 1) * math.pi)

def blade(P, wmax, asym=.25, lobes=0, depth=.0, kind='leaf', side_lobes=(1, 1)):
    """the outline round a spine P: half-widths left/right from the profile, lobes scalloped into one or both edges"""
    d = np.gradient(P, axis=0); d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-12; nv = np.stack([-d[:, 1], d[:, 0]], 1)
    t = np.linspace(0, 1, len(P)); w = profile(t, kind) * wmax / 2
    wl, wr = w * (1 + asym), w * (1 - asym)
    if lobes:
        sc = (0.5 + 0.5 * np.cos(2 * math.pi * lobes * (t - .12))) ** 3   # sharp notches between round lobes
        zone = np.clip((t - .12) / .1, 0, 1) * np.clip((.92 - t) / .1, 0, 1)
        wl = wl * (1 - depth * sc * zone * side_lobes[0]); wr = wr * (1 - depth * np.roll(sc, len(t) // (2 * lobes)) * zone * side_lobes[1])
    ring = np.vstack([P + nv * wl[:, None], (P - nv * wr[:, None])[::-1]])
    return Polygon(ring).buffer(0)

def taper_line(P, w0, w1):
    d = np.gradient(P, axis=0); d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-12; nv = np.stack([-d[:, 1], d[:, 0]], 1)
    w = (w0 + (w1 - w0) * np.linspace(0, 1, len(P))) / 2
    return Polygon(np.vstack([P + nv * w[:, None], (P - nv * w[:, None])[::-1]])).buffer(0)

def leaf(p, a, L, k=0., wfrac=.46, asym=.22, lobes=0, depth=.45, curl=0., vein=True, rng=None):
    """a whole leaf: (white, black cuts)"""
    P, ang = spine(p, a, L, k, k * 1.8, curl=curl)
    g = blade(P, L * wfrac, asym, lobes, depth)
    cuts = []
    if vein:
        n = len(P); i0, i1 = int(n * .1), int(n * .82)
        cuts.append(taper_line(P[i0:i1], L * .022, L * .006))
        nl = max(2, lobes or 3)
        for m in range(nl):
            f = .28 + .5 * m / nl; i = int(n * f); s = 1 if m % 2 == 0 else -1
            Q, _ = spine(P[i], ang[i] + s * .75, L * .16 * (1 - .4 * f), s * -6 / L, s * -6 / L, n=10)
            cuts.append(taper_line(Q, L * .014, L * .004))
        c = unary_union(cuts).intersection(g.buffer(-L * .03))
    else: c = None
    return g, c, P, ang

def tulip(p, a, L, rng=None):
    """his tulip: a cup that swells from the stalk, crowned by three pointed petals (the outer two flaring), the black
    cut down between them; a calyx at its foot"""
    u = np.array([math.cos(a), math.sin(a)]); n = np.array([-u[1], u[0]]); p = np.array(p, float)
    t = np.linspace(0, 1, 30); half = L * .30 * np.sin(np.clip(t, 0, 1) * math.pi * .62) ** .8
    left = [p + u * L * .78 * ti + n * h for ti, h in zip(t, half)]
    right = [p + u * L * .78 * ti - n * h for ti, h in zip(t, half)][::-1]
    W = half[-1]; top = p + u * L * .78
    crown = [top + n * W * 1.25 + u * L * .26,   # left petal's tip, flaring
             top + n * W * .35 + u * L * .02,     # notch
             top + u * L * .30,                   # middle petal's tip
             top - n * W * .35 + u * L * .02,     # notch
             top - n * W * 1.25 + u * L * .26]    # right petal's tip
    g = Polygon(left + crown + right).buffer(L * .02).buffer(-L * .02)
    calyx = blade(spine(p - u * L * .02, a, L * .3, 0, 0)[0], L * .3, 0, kind='petal')
    g = unary_union([g, calyx])
    cuts = [taper_line(np.array([top + n * W * .35 * sg + u * L * .0, p + u * L * .4 + n * W * .2 * sg]), L * .028, L * .006) for sg in (1, -1)]
    return g, unary_union(cuts), None, None

def tendril(p, a, L, w0, side, k0=2., k1=40., n=None):
    P, ang = spine(p, a, L, side * k0, side * k1)
    w = w0 * (1 - .78 * np.linspace(0, 1, len(P)) ** .9) / 2
    d = np.gradient(P, axis=0); d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-12; nv = np.stack([-d[:, 1], d[:, 0]], 1)
    g = Polygon(np.vstack([P + nv * w[:, None], (P - nv * w[:, None])[::-1]])).buffer(0).union(Point(P[-1]).buffer(w[-1] * 1.1, quad_segs=10))
    return g, P, ang

if __name__ == '__main__':
    # a sheet: 12 generated beside 12 of his
    import sys
    from PIL import Image, ImageDraw
    rng = np.random.default_rng(4); items = []
    specs = [dict(L=.8, k=.6, lobes=0, curl=0), dict(L=.8, k=1.2, lobes=2, depth=.55, curl=2), dict(L=.8, k=-.8, lobes=3, depth=.55, curl=-3),
             dict(L=.8, k=.3, lobes=2, depth=.45, curl=4, wfrac=.55), dict(L=.75, k=1.6, lobes=0, curl=5, wfrac=.36), dict(L=.8, k=-.4, lobes=3, depth=.6, curl=0, wfrac=.55),
             dict(L=.7, k=2.0, lobes=2, depth=.5, curl=6), dict(L=.8, k=0, lobes=0, wfrac=.55, asym=.35), dict(L=.8, k=-1.4, lobes=3, depth=.5, curl=-4)]
    for sp in specs:
        sp = dict(sp); L = sp.pop('L'); g, c, _, _ = leaf((.1, .5), 0, L, **sp); items.append(g.difference(c) if c is not None else g)
    for k in range(3):
        g, c, _, _ = tulip((.12, .5), 0, .7 + .05 * k); items.append(g.difference(c))
    S = 220; sh = Image.new('L', (12 * (S + 10), 2 * (S + 10) + 20), 22); d = ImageDraw.Draw(sh)
    for n, g in enumerate(items):
        im = Image.new('L', (S * 3, S * 3), 22); dd = ImageDraw.Draw(im)
        for p in getattr(g, 'geoms', [g]):
            dd.polygon([(x * S * 3, y * S * 3) for x, y in p.exterior.coords], fill=232)
            for r in p.interiors: dd.polygon([(x * S * 3, y * S * 3) for x, y in r.coords], fill=22)
        sh.paste(im.resize((S, S), Image.LANCZOS), (n * (S + 10), 0))
    V = np.load('/nvme-mirror/DEV/illum/research/kelmscott/vocab-pick.npz'); ks = sorted({k[1:] for k in V.files if k[0] == 'p'}, key=int)
    for n, k in enumerate(ks[:12]):
        m = V['p' + k]; im = Image.fromarray(np.where(m, 232, 22).astype(np.uint8)); sc = S * .85 / max(m.shape)
        im = im.resize((int(m.shape[1] * sc), int(m.shape[0] * sc)), Image.LANCZOS); sh.paste(im, (n * (S + 10) + 10, S + 30))
    d.text((4, S + 12), "above: ours, drawn (leaves with lobes, curls, veins; tulips)    below: twelve of his, traced from his blocks", fill=160)
    sh.save('out7/leaves-sheet.png')
