# kvine: a Morris white-vine block designed in white, all vector (shapely), block units (height 1, width A), y down.
#   axes   two or three sweeping stems (curvature rising along them: his spirals), rooted at the block's corners and at the
#          letter, one of them may pass OVER the letter (a band of white, its black outline cut across the letter);
#   masses his own leaves, tulips and buds (vectorised from his blocks), .09-.15 of the block, set alternately along each
#          axis on short tapering stalks, each leaf with a black midrib and side veins cut into it;
#   ends   a curl or one of his flowers; then the larger black left: small buds on shoots, then berries in threes, then dots;
#   the black is whatever narrow channel is left (his gap ~.02).
import numpy as np, math, pickle, sys
from PIL import Image, ImageDraw
from scipy import ndimage as nd
import potrace
from shapely.geometry import Polygon, Point, LineString, box
from shapely.ops import unary_union
from shapely import affinity
from shapely.prepared import prep
A = .95; FR = .036; GAP = .019

# ---- his vocabulary, vectorised -------------------------------------------------------------------------------------
def vec_mask(m, up=4, sig=3):
    big = np.asarray(Image.fromarray(m.astype(np.uint8) * 255).resize((m.shape[1] * up, m.shape[0] * up), Image.BILINEAR)).astype(float)
    big = nd.gaussian_filter(big, sig) > 127
    def P_(q): return (q.x, q.y) if hasattr(q, 'x') else tuple(q)
    try: paths = potrace.Bitmap(~big).trace(turdsize=20, alphamax=1.1, opticurve=True, opttolerance=1.5)
    except ValueError: paths = potrace.Bitmap(~big).trace(turdsize=20, alphamax=1.1, opticurve=False)
    g = None
    for c in paths:
        pts = [P_(c.start_point)]
        for sg in c.segments:
            if sg.is_corner: pts += [P_(sg.c), P_(sg.end_point)]
            else:
                p0 = np.array(pts[-1]); a, b, e = (np.array(P_(q)) for q in (sg.c1, sg.c2, sg.end_point))
                pts += [tuple((1-t)**3*p0 + 3*(1-t)**2*t*a + 3*(1-t)*t**2*b + t**3*e) for t in np.linspace(0, 1, 12)[1:]]
        p = Polygon(pts).buffer(0); g = p if g is None else g.symmetric_difference(p)
    return affinity.scale(g, 1 / up, 1 / up, origin=(0, 0))

def vocab():
    V = np.load('/nvme-mirror/DEV/illum/research/kelmscott/vocab-pick.npz'); out = []
    for k in sorted({k[1:] for k in V.files if k[0] == 'p'}, key=int):
        m = V['p' + k]; oy = float(V['o' + k][0]); g = vec_mask(m)
        g = max(getattr(g, 'geoms', [g]), key=lambda q: q.area)
        L = m.shape[1]; g = affinity.translate(g, 0, -oy); g = affinity.scale(g, 1 / L, 1 / L, origin=(0, 0))   # stalk at (0,0), grows along +x, length 1
        c = np.array(g.exterior.coords); tip = c[np.argmax(np.hypot(c[:, 0], c[:, 1]))]
        w = (g.bounds[3] - g.bounds[1]); kind = 'leaf' if w < .75 else 'flower'
        out.append(dict(id=k, g=g, tip=tip, kind=kind))
    return out

def veins(piece, s):
    """black cuts in a placed leaf: a midrib from the stalk toward the tip, and side veins, tapering, kept inside"""
    g = piece['g']; tip = piece['tip']; inner = g.buffer(-.07)
    if inner.is_empty or inner.area < .03: return None
    cuts = []
    def taper(a, b, w0, w1, n=10):
        a, b = np.array(a), np.array(b); d = b - a; L = np.hypot(*d)
        if L < 1e-6: return None
        nv = np.array([-d[1], d[0]]) / L; t = np.linspace(0, 1, n)[:, None]; P = a + d * t; w = (w0 + (w1 - w0) * t) / 2
        return Polygon(np.vstack([P + nv * w, (P - nv * w)[::-1]]))
    base = tip * .10; end = tip * .86
    mid = taper(base, end, .045, .012)
    if mid is not None: cuts.append(mid)
    for f, side in ((.32, 1), (.45, -1), (.58, 1), (.70, -1)):
        p = base + (end - base) * f; d = (end - base) / (np.hypot(*(end - base)) + 1e-9); nv = np.array([-d[1], d[0]]) * side
        q = p + (d * .55 + nv * .85) * .22
        v = taper(p, q, .03, .008)
        if v is not None: cuts.append(v)
    c = unary_union(cuts).intersection(inner)
    return c if not c.is_empty else None

def place(piece, p, ang, s):
    g = affinity.scale(piece['g'], s, s, origin=(0, 0)); g = affinity.rotate(g, ang, origin=(0, 0), use_radians=True)
    return affinity.translate(g, p[0], p[1])

# ---- strokes -------------------------------------------------------------------------------------------------------
def spiral(p0, a0, L, k0, k1, n=160):
    pts = [np.array(p0, float)]; a = a0; ds = L / n; angs = [a]
    for i in range(n):
        t = i / n; a += (k0 + (k1 - k0) * t ** 1.6) * ds; pts.append(pts[-1] + ds * np.array([math.cos(a), math.sin(a)])); angs.append(a)
    return np.array(pts), np.array(angs)

def band(P, w0, w1, round_end=True):
    d = np.gradient(P, axis=0); d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-12; nv = np.stack([-d[:, 1], d[:, 0]], 1)
    w = (w0 + (w1 - w0) * np.linspace(0, 1, len(P)) ** .9) / 2
    g = Polygon(np.vstack([P + nv * w[:, None], (P - nv * w[:, None])[::-1]])).buffer(0)
    if round_end: g = g.union(Point(P[-1]).buffer(w[-1], quad_segs=12)).union(Point(P[0]).buffer(w[0], quad_segs=12))
    return g

def stalk(p, ang, L, w0, w1, bend):
    P, _ = spiral(p, ang, L, bend, bend, n=20); return band(P, w0, w1), P[-1], ang + bend * L

# ---- the block ------------------------------------------------------------------------------------------------------
class Block:
    def __init__(s, letter, seed=1):
        s.rng = np.random.default_rng(seed); s.letter = letter
        s.inner = box(FR + .012, FR + .012, A - FR - .012, 1 - FR - .012)
        s.white = []   # vine pieces (shapely), black cuts kept apart
        s.cuts = []; s.over = []; s.terminals = 0
        s.R = 400; s.update()
    def taken(s): return unary_union([s.letter] + s.white)
    def update(s):
        R = s.R; im = Image.new('L', (int(R * A), R), 0); d = ImageDraw.Draw(im)
        for g in [s.letter] + s.white:
            for p in getattr(g, 'geoms', [g]):
                if p.is_empty: continue
                d.polygon([(x * R, y * R) for x, y in p.exterior.coords], fill=255)
                for r in p.interiors: d.polygon([(x * R, y * R) for x, y in r.coords], fill=0)
        m = np.asarray(im) > 127; fr = np.ones_like(m); b = int((FR + .012) * R); fr[b:-b, b:-b] = False
        s.clear = nd.distance_transform_edt(~(m | fr)) / R
    def cl(s, p):
        i, j = int(p[0] * s.R), int(p[1] * s.R)
        if not (0 <= j < s.clear.shape[0] and 0 <= i < s.clear.shape[1]): return 0.
        return s.clear[j, i]
    def fits(s, g, gap=GAP, ignore=None):
        if not s.inner.contains(g): return False
        t = s.taken() if ignore is None else unary_union([s.letter] + [w for w in s.white if w is not ignore])
        return not g.buffer(gap).intersects(t)

    def clear_path(s, P, need, skip=0):
        c = np.array([s.cl(p) for p in P[skip:]]); return c, (c >= need)

    def axis(s, root, a0, allow_over):
        """the best sweeping stem from root among many tries: long, in the open, turning ever tighter into a curl"""
        best = None; need = .018 + GAP * .9
        for _ in range(420):
            L = s.rng.uniform(.5, 1.05); sg = s.rng.choice([-1, 1]); k0 = sg * s.rng.uniform(0, 2.2); k1 = sg * s.rng.uniform(7, 15)
            a = a0 + s.rng.uniform(-1.2, 1.2); P, angs = spiral(root, a, L, k0, k1)
            if not all(s.inner.contains(Point(p)) for p in P[::10]): continue
            c, ok = s.clear_path(P, need)
            over = None
            if not ok[4:].all():
                if not allow_over: continue
                idx = np.nonzero(~ok[4:])[0] + 4
                if idx[-1] - idx[0] > 50 or (np.diff(idx) > 1).any() or idx[-1] > len(P) - 30 or idx[0] < 20: continue
                seg = LineString(P[idx[0] - 4:idx[-1] + 5])
                if not seg.intersects(s.letter) or any(seg.intersects(w) for w in s.white): continue
                over = (idx[0] - 4, idx[-1] + 5)
            score = L + np.clip(c, 0, .12).mean() * 3 + (.3 if over else 0)
            if best is None or score > best[0]: best = (score, P, angs, over)
        return best

    def grow(s, n_axes=3):
        """his main stems run down the middle of the black: the free ground's medial lines, longest first, smoothed into
        sweeps, each ending in a curl where there is room; one is carried straight on over a stroke of the letter"""
        from skimage.morphology import skeletonize
        from collections import deque
        need = .018 + GAP
        free = s.clear >= need; sk = skeletonize(free)
        for _ in range(int(.03 * s.R)):   # spurs off
            nb = nd.convolve(sk.astype(int), np.ones((3, 3), int), mode='constant') - sk; sk &= ~((nb <= 1) & sk)
        s.axes = []; R = s.R; taken_sk = np.zeros_like(sk)
        for _ in range(n_axes):
            pts = np.argwhere(sk & ~taken_sk)
            if len(pts) < 40: break
            idx = {tuple(p): i for i, p in enumerate(pts)}
            def bfs(start):
                dist = {start: 0}; prev = {start: None}; dq = deque([start]); last = start
                while dq:
                    u = dq.popleft(); last = u
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            v = (u[0] + dy, u[1] + dx)
                            if v in idx and v not in dist: dist[v] = dist[u] + 1; prev[v] = u; dq.append(v)
                return last, prev, dist
            a_, _, _ = bfs(tuple(pts[s.rng.integers(len(pts))])); b_, prev, dist = bfs(a_)
            path = [];  u = b_
            while u is not None: path.append(u); u = prev[u]
            if len(path) < .35 * R: break
            P = np.array(path, float)[:, ::-1] / R; P = nd.gaussian_filter1d(P, 9, axis=0, mode='nearest')
            P = P[::2]; d = np.diff(P, axis=0); angs = np.r_[np.arctan2(d[:, 1], d[:, 0]), math.atan2(d[-1, 1], d[-1, 0])]
            for (y, x) in path:   # its neighbourhood is spent
                taken_sk[max(0, y - 12):y + 12, max(0, x - 12):x + 12] = True
            # the curl at its end, if it fits
            sg = s.rng.choice([-1, 1]); C, ca = spiral(P[-1], angs[-1], .16, sg * 4, sg * 22, n=40)
            if all(s.cl(q) >= .011 + GAP * .8 for q in C[5:]) and s.inner.contains(LineString(C)):
                P = np.vstack([P, C[1:]]); angs = np.r_[angs, ca[1:]]
            w = band(P, .034, .014); s.white.append(w); s.axes.append((P, angs)); s.terminals += 1; s.update()
        # one stem carried over the letter: from an axis's start, straight on across a stroke into the black beyond
        for P, angs in list(s.axes):
            for end, sgn in ((0, -1), (-1, 1)):
                p = P[end]; a = angs[end] + (math.pi if sgn < 0 else 0); u = np.array([math.cos(a), math.sin(a)])
                for L in np.arange(.06, .22, .01):
                    q = p + u * L
                    if not s.inner.contains(Point(q)): break
                    seg = LineString([p + u * .01, q])
                    if seg.intersects(s.letter) and s.cl(q) >= .045 and not any(seg.intersects(w) for w in s.white[:-0 or None] if w is not None and False):
                        cross = band(np.array([p + u * t for t in np.linspace(0, L, 20)]), .03, .026, round_end=False)
                        tail, ta = spiral(q, a, .12, 6 * s.rng.choice([-1, 1]), 20, n=30)
                        s.letter = s.letter.difference(cross.buffer(.011)).union(cross); s.over.append(cross)
                        s.white.append(band(tail, .026, .012)); s.terminals += 1; s.update(); return len(s.axes)
        return len(s.axes)

    def put_leaf(s, pcs, p, a, sizes, side=1, stalk_len=(.02, .04)):
        for size in sizes:
            pc = pcs[s.rng.integers(len(pcs))]
            st, q, aq = stalk(p, a, s.rng.uniform(*stalk_len), .02, .012, side * s.rng.uniform(0, 3))
            g = place(pc, q, aq, size * s.rng.uniform(.93, 1.07))
            if s.fits(g):
                s.white.append(unary_union([g, st])); s.terminals += 1
                v = veins(pc, size)
                if v is not None: s.cuts.append(place(dict(g=v), q, aq, size * 1.0))
                return True
        return False

    def leaves(s, V):
        lv = [v for v in V if v['kind'] == 'leaf']; fl = [v for v in V if v['kind'] == 'flower']; s.shoots = []
        for P, angs in list(getattr(s, 'axes', [])):
            n = len(P); side = s.rng.choice([-1, 1]); j = int(n * s.rng.uniform(.10, .18))
            while j < n - 15:
                side = -side; p = P[j]
                # a branch: his shoot curling away, bearing a leaf or a flower; else a leaf straight off the stem
                Lb = s.rng.uniform(.14, .30); B, ba = spiral(p, angs[j] + side * s.rng.uniform(.5, .8), Lb, side * s.rng.uniform(1, 3), side * s.rng.uniform(10, 18), n=60)
                br = band(B, .022, .011)
                c, ok = s.clear_path(B, .011 + GAP * .8, skip=10)
                if ok.all() and s.inner.contains(br):
                    s.white.append(br); s.shoots.append((B, ba)); s.update()
                    if not s.put_leaf(lv + fl, B[-1], ba[-1], (.13, .11, .09), side):
                        s.terminals += 1   # it ends in its curl
                    j += int(n * s.rng.uniform(.12, .17))
                elif s.put_leaf(lv, p, angs[j] + side * s.rng.uniform(.7, 1.1), (.14, .12, .10, .085), side):
                    s.update(); j += int(n * s.rng.uniform(.10, .14))
                else: j += 6
            s.update()
            for k in s.rng.permutation(len(fl)):
                g = place(fl[k], P[-1], angs[-1], .12)
                if s.fits(g): s.white.append(g); break
            s.update()

    def fill(s, V, target=.50):
        lv = [v for v in V if v['kind'] == 'leaf']
        stems = [P for P, _ in getattr(s, 'axes', [])] + [P for P, _ in getattr(s, 'shoots', [])]
        allp = np.vstack(stems) if stems else np.zeros((0, 2))
        for _ in range(70):
            if s.white_frac() >= target: break
            j, i = np.unravel_index(np.argmax(s.clear), s.clear.shape); c = s.clear[j, i]; q = np.array([i, j]) / s.R
            if c < .026: break
            ok = False
            if len(allp):
                d = np.hypot(*(allp - q).T); k = int(np.argmin(d))
                if d[k] < c + .22:
                    p = allp[k]; a = math.atan2(q[1] - p[1], q[0] - p[0])
                    for size in (min(.12, c * 1.7), min(.095, c * 1.3), .07):
                        L_ = max(.02, d[k] - size * .45)
                        B, ba = spiral(p, a, L_, 0, s.rng.uniform(-3, 3), n=30); br = band(B, .016, .010)
                        cc, okp = s.clear_path(B, .008 + GAP * .7, skip=6)
                        if not okp.all(): continue
                        if s.put_leaf(lv, B[-1], ba[-1], (size,), 1, stalk_len=(.008, .012)):
                            s.white.append(br); ok = True; break
            if not ok:
                r = .0085 if c > .045 else .0065; kk = 3 if c > .045 else 1; rot = s.rng.uniform(0, 6.3)
                berries = unary_union([Point(q + (r * 2.15 * np.array([math.cos(rot + m * 2.094), math.sin(rot + m * 2.094)]) if kk > 1 else 0)).buffer(r, quad_segs=12) for m in range(kk)])
                s.white.append(berries)
            s.update()

    def stems(s, n=3, maxlen=.6):
        """a few sweeping stems first, his scroll: down the middle of the black from a corner or a letter's end, at most
        maxlen long (so none runs round the frame), smoothed, closing in a curl where it can"""
        from skimage.morphology import skeletonize
        from collections import deque
        free = s.clear >= .018 + GAP; sk = skeletonize(free)
        pts = np.argwhere(sk); idx = {tuple(p): i for i, p in enumerate(pts)}; s.axes = []
        m = FR + .06; roots = [np.array(r) for r in [(m, m), (A - m, 1 - m), (A - m, m), (m, 1 - m)]]
        lc = np.array(max(getattr(s.letter, 'geoms', [s.letter]), key=lambda q: q.area).exterior.coords)
        cen = np.array([A / 2, .5]); roots += [q for q in lc[np.argsort(-np.hypot(*(lc - cen).T))[:30:10]]]
        order = list(s.rng.permutation(len(roots))); spent = np.zeros_like(sk)
        for k in order:
            if len(s.axes) >= n: break
            r = roots[k] * s.R; cand = [p for p in pts if not spent[p[0], p[1]]]
            if not cand: break
            cand = np.array(cand); d0 = np.hypot(cand[:, 1] - r[0], cand[:, 0] - r[1]); st = tuple(cand[np.argmin(d0)])
            if d0.min() > .15 * s.R: continue
            dist = {st: 0}; prev = {st: None}; dq = deque([st]); lim = int(maxlen * s.R)
            while dq:
                u = dq.popleft()
                if dist[u] >= lim: continue
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        v = (u[0] + dy, u[1] + dx)
                        if v in idx and v not in dist and not spent[v]: dist[v] = dist[u] + 1; prev[v] = u; dq.append(v)
            end = max(dist, key=dist.get)
            if dist[end] < .3 * s.R: continue
            path = []; u = end
            while u is not None: path.append(u); u = prev[u]
            P = np.array(path, float)[:, ::-1] / s.R; P = nd.gaussian_filter1d(P, 10, axis=0, mode='nearest')[::2]
            d = np.diff(P, axis=0); angs = np.r_[np.arctan2(d[:, 1], d[:, 0]), math.atan2(d[-1, 1], d[-1, 0])]
            sg = s.rng.choice([-1, 1]); C, ca = spiral(P[-1], angs[-1], .15, sg * 5, sg * 24, n=40)
            if all(s.cl(q) >= .011 + GAP * .8 for q in C[5:]) and s.inner.contains(LineString(C)):
                P = np.vstack([P, C[1:]]); angs = np.r_[angs, ca[1:]]
            for (y, x) in path: spent[max(0, y - 14):y + 14, max(0, x - 14):x + 14] = True
            s.white.append(band(P, .032, .013)); s.axes.append((P, angs)); s.terminals += 1; s.update()

    def masses(s, V, target=.50, min_size=.055):
        """design in white: his leaves and flowers set into the largest black first, each turned to run along its channel
        (the sweep of the ground there), sized to the room; flowers seldom, leaves mostly"""
        lv = [v for v in V if v['kind'] == 'leaf']; fl = [v for v in V if v['kind'] == 'flower']; s.bases = []
        gy, gx = np.gradient(nd.gaussian_filter(s.clear, 3)); fails = 0
        for it in range(200):
            if s.white_frac() >= target or fails > 25: break
            cl = s.clear.copy(); j, i = np.unravel_index(np.argmax(cl), cl.shape); c = cl[j, i]
            if c < min_size / 2.6: break
            q = np.array([i, j]) / s.R; gy, gx = np.gradient(nd.gaussian_filter(s.clear, 3))
            g = np.array([gx[j, i], gy[j, i]]); ch = np.array([-g[1], g[0]]); ch = ch / (np.hypot(*ch) + 1e-9) if np.hypot(*ch) > 1e-6 else np.array([1., 0])
            if getattr(s, 'axes', None):
                allp = np.vstack([P for P, _ in s.axes]); alla = np.concatenate([an for _, an in s.axes]); dd = np.hypot(*(allp - q).T); kq = int(np.argmin(dd))
                if dd[kq] < c * 2.2: ch = np.array([math.cos(alla[kq]), math.sin(alla[kq])])
            placed = False
            for size in (min(.17, c * 2.5), min(.15, c * 2.2), min(.12, c * 1.9), min(.10, c * 1.6), min(.08, c * 1.4)):
                if size < min_size: continue
                for _ in range(8):
                    pcs = fl if (s.rng.random() < .12 and size > .1) else lv
                    pc = pcs[s.rng.integers(len(pcs))]; sgn = s.rng.choice([-1, 1])
                    a = math.atan2(ch[1] * sgn, ch[0] * sgn) + s.rng.uniform(-.35, .35)
                    base = q - np.array([math.cos(a), math.sin(a)]) * size * .5
                    gg = place(pc, base, a, size)
                    if s.fits(gg):
                        s.white.append(gg); s.bases.append((base, a, size)); s.terminals += 1
                        v = veins(pc, size)
                        if v is not None and pc['kind'] == 'leaf': s.cuts.append(place(dict(g=v), base, a, size))
                        placed = True; break
                if placed: break
            if not placed:
                fails += 1; s.clear[max(0, j - 6):j + 6, max(0, i - 6):i + 6] = 0   # (no piece fits here: let it go to dots)
                continue
            s.update()

    def connect(s):
        """stems as his short tapering connectors: each piece's stalk run back to the nearest white behind it (another
        piece's, or the letter's), curving a little; none longer than .12"""
        for base, a, size in s.bases:
            back = np.array([-math.cos(a), -math.sin(a)]); best = None
            others = unary_union([s.letter] + [w for w in s.white if not w.contains(Point(base + np.array([math.cos(a), math.sin(a)]) * size * .3))])
            for da in np.linspace(-.9, .9, 13):
                u = np.array([math.cos(a + math.pi + da), math.sin(a + math.pi + da)])
                ray = LineString([base + u * .004, base + u * .13]); hit = ray.intersection(others)
                if hit.is_empty: continue
                dist = Point(base).distance(hit)
                if best is None or dist < best[0]: best = (dist, u)
            if best is None or best[0] < .006: continue
            L = best[0] + .006; u = best[1]; bend = s.rng.uniform(-2, 2)
            P, _ = spiral(base, math.atan2(u[1], u[0]), L, bend, -bend, n=20)
            st = band(P, .012, .02, round_end=False)
            if s.inner.contains(st): s.white.append(st)
        s.update()

    def dots(s):
        for _ in range(80):
            j, i = np.unravel_index(np.argmax(s.clear), s.clear.shape); c = s.clear[j, i]; q = np.array([i, j]) / s.R
            if c < .022: break
            r = .0085 if c > .04 else .0062; kk = 3 if c > .04 else 1; rot = s.rng.uniform(0, 6.3)
            s.white.append(unary_union([Point(q + (r * 2.15 * np.array([math.cos(rot + m * 2.094), math.sin(rot + m * 2.094)]) if kk > 1 else 0)).buffer(r, quad_segs=12) for m in range(kk)]))
            s.update()

    def white_frac(s):
        ink = s.ink(); inner = box(FR + .045, .045, A - .045, 1 - .045)
        return 1 - ink.intersection(inner).area / inner.area
    def ink(s):
        W = unary_union([s.letter] + s.white)
        if s.cuts: W = W.difference(unary_union(s.cuts))
        return box(0, 0, A, 1).difference(W)

def build(letter, seed=1, target=.50):
    V = pickle.load(open('vocab_vec.pkl', 'rb')) if __import__('os').path.exists('vocab_vec.pkl') else None
    if V is None: V = vocab(); pickle.dump(V, open('vocab_vec.pkl', 'wb'))
    B = Block(letter, seed); B.stems(); B.masses(V, target); B.connect(); B.dots()
    return B

def raster_ink(ink, h=700, ss=3):
    W = round(h * A); im = Image.new('L', (W * ss, h * ss), 0); d = ImageDraw.Draw(im)
    for p in getattr(ink, 'geoms', [ink]):
        if p.is_empty: continue
        d.polygon([(x * h * ss, y * h * ss) for x, y in p.exterior.coords], fill=255)
        for r in p.interiors: d.polygon([(x * h * ss, y * h * ss) for x, y in r.coords], fill=0)
    return np.asarray(im.resize((W, h), Image.LANCZOS))

if __name__ == '__main__':
    sys.path.insert(0, '.'); import cuts as CU
    L = pickle.load(open('glm26.pkl', 'rb')); out = {}
    for ch in sys.argv[1]:
        letter = affinity.scale(L[ch], .88, .88, origin=(A / 2, .5))   # (his letters leave the vine a margin round them)
        B = build(letter, seed=int(sys.argv[2]) if len(sys.argv) > 2 else 1)
        # the letter's own hairline cuts, after the vine has crossed it
        hl = CU.hairlines(B.letter)
        if not hl.is_empty: B.cuts.append(hl)
        ink = B.ink(); out[ch] = ink
        print(ch, 'white %.3f' % B.white_frac(), 'axes', len(getattr(B, 'axes', [])), 'over', len(B.over), 'terminals', B.terminals, flush=True)
        Image.fromarray(255 - raster_ink(ink)).save(f'out6/block-{ch}.png')
    pickle.dump(out, open(f'blocks_{sys.argv[1]}.pkl', 'wb'))
