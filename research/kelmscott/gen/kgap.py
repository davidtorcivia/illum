# kgap: a white-vine initial as Morris cut them. Paint the square, apply the letter, grow a vine in the gaps.
#   square  black, its cut edge a touch irregular
#   letter  GL-Morris (Morris's Troy capitals; licence ../gl-morris/LICENSE.txt) in white, with his hairline cut (cuts.py)
#   vine    stems grown in the clear space: each step follows the largest circle that fits ahead (capped, and shrinking
#           with age, so stems sweep, reverse into S-curves and end in tightening curls); width from the room; branches
#           into the larger side; leaves on the outer side of curves; a leaf, bud, tulip or curl at each end; new stems
#           seeded at the largest gap left until the white balances; dots in the last pools.
# All block units (height 1, width A, y down). The clearance field is a raster; every shape is vector (shapely).
# usage (from this dir): python kgap.py LETTER SEED OUTDIR   -> OUTDIR/LETTER-SEED.{png,json}  (json: tools/kfont.py's)
import sys, math, json
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from shapely import affinity
from shapely.geometry import Point, Polygon, box
from shapely.ops import unary_union
import shapely, shapely.ops
sys.path.insert(0, '.')
import khand, cuts, kleaf

A = .95                 # the block's width / height
RES = 500               # the clearance field's px per block height
MARG = .032             # the black border round everything
CHL = .024              # the channel round the letter
CH = .019               # the channel between vine shapes
HWMAX = .03             # a stem's greatest half-width
HWCOR = .012            # in a corridor (no room to sweep)
HWMIN = .0045           # a stem's tip
DS = .005               # growth step
DEBUG = 0
CORMAX = .09            # the longest run down a corridor
SEEDMIN = .03           # the least room a new stem is seeded in (less: a leaf)
VMAX = .27              # the vine's greatest share of the block (his: .28-.40 round a lighter letter)
RC = .035               # the least circle a stem sweeps round (less: it runs a corridor)
FONT = '../gl-morris/GL-Morris.ttf'
W = int(A * RES)

def letter(ch, cap=.79, base=.89, stem=.104):
    P = dict(khand.P, cap=cap, base=base)
    gi, ci, _ = khand.outline(FONT, 'I'); sw = khand.stem_width(khand.place(gi, ci, P), 1)
    g, capH, _ = khand.outline(FONT, ch); g = khand.place(g, capH, P).buffer((stem - sw) / 2, join_style='round', quad_segs=16)
    b = g.bounds; f = min(.8 / (b[3] - b[1]), .82 / (b[2] - b[0]))   # (the letter in the block: .8 tall, or .82 wide if it is wide; centred)
    g = affinity.scale(g, f, f, origin=((b[0] + b[2]) / 2, (b[1] + b[3]) / 2)); b = g.bounds
    g = affinity.translate(g, A / 2 - (b[0] + b[2]) / 2, .5 - (b[1] + b[3]) / 2)
    g0, d = g, 0.
    while g.area < .11 and d < .012: d += .002; g = g0.buffer(d, join_style='round', quad_segs=16)   # (a slight letter, J or Y, made as sturdy as his I)
    return cuts.cut(g)

def square(rng):
    sq = box(0, 0, A, 1).buffer(-.004, join_style='round').buffer(.002, join_style='round').segmentize(.004)
    return khand.wander(sq, .0016, rng, wl=.07)

def raster(g, res=RES, w=W, h=None):
    im = Image.new('L', (w, h or res), 0); d = ImageDraw.Draw(im)
    for p in getattr(g, 'geoms', [g]):
        if p.is_empty or p.geom_type != 'Polygon': continue
        d.polygon([(x * res, y * res) for x, y in p.exterior.coords], fill=255)
        for r in p.interiors: d.polygon([(x * res, y * res) for x, y in r.coords], fill=0)
    return np.asarray(im) > 127

def stroke(P, hw):
    """a variable-width stem: discs at the points joined by their hulls"""
    c = [Point(p).buffer(w, quad_segs=10) for p, w in zip(P, hw)]
    return unary_union([c[i].union(c[i + 1]).convex_hull for i in range(len(c) - 1)] or c)

def leafshape(base, a, L, k, lobes, side, rng):
    """his leaf: a blade along a spine that bends by k (radians over its length) and curls at the tip; fullest a third of
    the way; the outer side (side) cut into lobes whose points lean to the tip, the inner side whole; a black midrib.
    Returns the white."""
    n = 60; t = np.linspace(0, 1, n); ang = a + k * t + side * 1.2 * np.clip(t - .75, 0, 1) ** 2 * 6
    P = np.cumsum(np.stack([np.cos(ang), np.sin(ang)], 1), 0) * L / n + base
    nv = np.stack([-np.sin(ang), np.cos(ang)], 1)
    env = np.sin(np.clip(t, 0, 1) ** .75 * math.pi) ** .8 * L * .3
    wo, wi = env * 1.1, env * .85
    def lob(m, ph0, d):   # m lobes, each a rounded swell that ends in a point leaning to the tip
        u = (np.clip((t - .08) / .8, 0, 1) * m + ph0) % 1
        z = np.where((t > .1) & (t < .86), u ** .55 * (1 - u ** 12), 1)
        return 1 - d + d * z
    if lobes:
        wo = wo * lob(lobes, 0, .6); wi = wi * lob(max(1, lobes - 1), .5, .35)
    ring = np.vstack([P + side * nv * wo[:, None], (P - side * nv * wi[:, None])[::-1]])
    g = Polygon(ring).buffer(0).buffer(L * .015, join_style='round').buffer(-L * .015, join_style='round')
    rib = stroke(P[6:int(n * .72)], np.linspace(L * .016, L * .004, int(n * .72) - 6))
    return g.difference(rib) if L > .09 else g

class Block:
    def __init__(s, ch, seed):
        s.rng = np.random.default_rng(seed * 7919 + ord(ch)); s.ch = ch
        s.L = letter(ch)
        s.inner = box(MARG, MARG, A - MARG, 1 - MARG)
        s.occ = raster(s.L.buffer(CHL)) | ~raster(s.inner)      # taken: the letter and its channel, the border
        s.kind = np.where(raster(s.L.buffer(CHL)), 1, np.where(raster(s.inner), 0, 2))   # what a root grows from
        s.vine = []                                              # white shapes
        s.update()

    # ---- the clearance field
    def update(s):
        s.D = nd.distance_transform_edt(~s.occ) / RES
        j = np.argmax(s.D); s.far = np.array([j % W, j // W]) / RES
    def d(s, p):
        x, y = int(p[0] * RES), int(p[1] * RES)
        return s.D[y, x] if 0 <= y < RES and 0 <= x < W else 0.
    def take(s, g, ch=CH, kind=3):
        s.vine.append(g); m = raster(g.buffer(ch)); s.occ |= m; s.kind[m & (s.kind == 0)] = kind

    def circle(s, p, th, side, hw, rmax):
        """the largest circle tangent to the heading at p, on that side, that fits the clear space"""
        n = np.array([-math.sin(th), math.cos(th)]) * side; best = 0.
        for r in np.arange(.012, rmax, .004):
            if s.d(p + n * r) >= r + hw * 1.6: best = r
            elif best: break
        return best

    # ---- one stem
    def walk(s, p, th, side, budget, fused):
        """grows a centreline from p: points, headings, turning sides (s.M: 0 sweeping, 1 corridor, 2 behind the letter)"""
        P = [np.array(p, float)]; T = [th]; S = [side]; M = [0]; turned = 0.; age = 0.; R0 = s.rng.uniform(.18, .26)
        flip_at = s.rng.uniform(.35, .6) * math.pi; free_start = True; s.k0 = 0; run = 0.; jumped = False; s.why = 'budget'; wave = 0.; flips = 0
        def add(q, m): P.append(q); T.append(th); S.append(side); M.append(m)
        while age < budget:
            p = P[-1]; mode = 0
            if free_start and s.d(p) < HWMIN * 1.5:   # still inside what it springs from: straight out
                if age > .08: return None
                add(p + DS * np.array([math.cos(th), math.sin(th)]), 0); age += DS; continue
            if free_start: s.k0 = len(P) - 1
            free_start = False
            rmax = max(.016, R0 * math.exp(-age / (budget * .7)))
            r = s.circle(p, th, side, HWMIN, rmax)
            if abs(turned) > flip_at and age < budget * .6:            # an S: reverse if the other side has room
                r2 = s.circle(p, th, -side, HWMIN, rmax)
                if r2 > .03: side, r, turned, flip_at = -side, r2, 0., s.rng.uniform(.45, .8) * math.pi
            if r < RC:
                r2 = s.circle(p, th, -side, HWMIN, rmax)
                if r2 >= RC: side, r, turned = -side, r2, 0.
            if r < RC:   # no room to sweep: a corridor; keep to its middle, in a slow wave, or stop
                if s.dframe(p) < .06: s.why = 'frame'; break   # (never along the frame)
                look = lambda a: min(s.d(p + k * DS * np.array([math.cos(th + a), math.sin(th + a)])) for k in (3, 6, 9))
                best = max(np.linspace(-.6, .6, 13), key=lambda a: look(a) - .006 * abs(a - side * .3))
                if look(best) < HWMIN * 1.2: s.why = 'corridor-blocked'; break
                run += DS
                if run > CORMAX: s.why = 'corridor-long'; break
                dth = float(np.clip(best * .35, -DS / .03, DS / .03)); wave += DS; mode = 1
                if wave > s.rng.uniform(.07, .11): side, wave = -side, 0.
            else:
                if abs(turned) > 1.6 * math.pi: s.why = 'curl'; break   # a full curl: done
                dth = side * DS / r; run = 0.
            th += dth; turned += dth * side
            u = np.array([math.cos(th), math.sin(th)]); q = p + DS * u
            hit = next((t for t in np.arange(.01, .07, .01) if s.kind_at(p + u * t) != 0), None)
            if not jumped and age > .04 and hit and s.kind_at(p + u * hit) == 1:   # the letter ahead: pass behind it, if there is room beyond
                for t in np.arange(hit, hit + .3, DS):
                    z = p + u * t
                    if s.kind_at(z) == 1: continue
                    if s.kind_at(z) == 0 and s.d(z + u * .02) >= .025:
                        for tt in np.arange(DS, t + 1e-9, DS): add(p + u * tt, 2)
                        age += t; jumped = True; s.jumps += 1
                    break
                if jumped: continue
            if s.d(q) < HWMIN:   # about to touch: curl in tight if it can, else stop
                for rr in (.02, .014):
                    t2 = th - dth + side * DS / rr; q = p + DS * np.array([math.cos(t2), math.sin(t2)])
                    if s.d(q) >= HWMIN: th = t2; turned += DS / rr; break
                else: s.why = 'blocked'; break
            if len(P) > 12:   # not into itself: turn away toward the largest room left, while young; else end
                old = np.array(P[:-int(.05 / DS)] or P[:1])
                if np.min(np.hypot(*(old - q).T)) < .028:
                    v = s.far - p; ns = 1 if u[0] * v[1] - u[1] * v[0] > 0 else -1
                    if age < budget * .6 and flips < 3 and ns != side and s.circle(p, th, ns, HWMIN, rmax) >= RC:
                        th -= dth; side = ns; turned = 0.; flips += 1; continue
                    s.why = 'self'; break
            add(q, mode); age += DS
        s.M = np.array(M)
        return np.array(P), np.array(T), np.array(S)

    def dframe(s, p):
        return min(p[0] - MARG, A - MARG - p[0], p[1] - MARG, 1 - MARG - p[1])

    def kind_at(s, p):
        x, y = int(p[0] * RES), int(p[1] * RES)
        return s.kind[y, x] if 0 <= y < RES and 0 <= x < W else 2

    def widths(s, P, hw0):
        room = np.array([s.d(p) for p in P]); hid = nd.binary_dilation(s.M == 2, iterations=8)
        if hid.any(): room[hid] = np.interp(np.nonzero(hid)[0], np.nonzero(~hid)[0], room[~hid])   # (behind the letter: as wide as either side)
        k = min(s.k0 + 3, len(P) - 1); room[:k] = min(room[k], HWMAX * .75)   # (it springs from behind at full width)
        L = np.r_[0, np.cumsum(np.hypot(*np.diff(P, axis=0).T))]; tot = L[-1]
        hw = np.minimum(np.where(nd.maximum_filter1d(s.M, 9) == 1, HWCOR, HWMAX), room * .95)   # (thinner in a corridor)
        hw = nd.gaussian_filter1d(hw, 4, mode='nearest'); hw = np.minimum(hw, np.maximum(room, HWMIN))
        hw = np.minimum(hw, hw0 * (1 - .35 * L / max(tot, 1e-6)))                          # never wider than its root
        tip = np.clip((tot - L) / min(.14, tot * .6 + 1e-6), 0, 1) ** .7                 # taper to the tip
        x, y = int(P[0][0] * RES), int(P[0][1] * RES)
        if not (0 <= x < W and 0 <= y < RES) or s.kind[y, x] == 2: hw = hw * np.clip(.3 + L / .1, 0, 1)   # out of the border's corner: from a point
        return np.maximum(HWMIN, hw * (.18 + .82 * tip))

    def grow(s, p, th, side, budget, hw0, gen, fused):
        w = s.walk(p, th, side, budget, fused)
        if w is None or len(w[0]) < (.1 if fused else .06) / DS: return None   # (no stubs: a shoot is a real stem or nothing)
        P, T, S = w; hw = s.widths(P, hw0); s.lens.append(round(len(P) * DS, 2))
        if DEBUG: print(f'  stem gen {gen} fused {int(fused)} len {len(P) * DS:.2f}/{budget:.2f} why {s.why} hw {hw.max():.3f}')
        g = stroke(P, hw)
        g = g.intersection(s.inner).difference(s.L.buffer(CHL))
        s.take(g)
        tot = len(P) * DS
        # leaves on the outer side of curves, branches into the larger side
        nxt = s.rng.uniform(.06, .1); slots = []
        for i in range(4, len(P) - 8):
            if i * DS < nxt or (s.M[max(0, i - 6):i + 7] == 2).any(): continue
            nxt = i * DS + s.rng.uniform(.05, .09)
            slots.append(i)
        for i in slots:
            nv = np.array([-math.sin(T[i]), math.cos(T[i])])
            out = -S[i]   # the outer side
            big = 1 if s.d(P[i] + nv * (hw[i] + .03)) > s.d(P[i] - nv * (hw[i] + .03)) else -1
            if gen < 3 and s.rng.random() < .55 and s.d(P[i] + big * nv * (hw[i] + .035)) > .03:
                s.queue.append((P[i] + big * nv * hw[i] * .5, T[i] + big * s.rng.uniform(.6, .9), -big if s.rng.random() < .6 else big, tot * .6, hw[i] * .8, gen + 1))
            elif (s.M[max(0, i - 4):i + 5] == 0).all():   # (leaves on the curves, not down a corridor: a stem there would be beaded)
                s.leaf(P[i], T[i], out, hw[i])
        if tot > .12: s.terminal(P[-1], T[-1], S[-1], hw[-1], P[-6])   # (a short shoot just ends in its curl)
        return g

    # ---- foliage
    def fits(s, g, base, br):
        m = raster(g.difference(Point(base).buffer(br)))
        if DEBUG > 1: print('      fit', m.sum(), (m & s.occ).sum())
        return m.sum() > 0 and (m & s.occ).sum() <= m.sum() * .02

    def ray(s, p, a, t0, tmax=.24):
        """how far the clear space runs from p along a (from t0), and how wide it is on the way"""
        u = np.array([math.cos(a), math.sin(a)]); ds = []
        for t in np.arange(t0, tmax, .006):
            d = s.d(p + u * t)
            if d < .008: break
            ds.append(d)
        return (len(ds) * .006, np.mean(ds) if ds else 0.)

    def leaf(s, p, th, out, hw, Lmax=.15, fan=(.25, 1.45), Lmin=.065):
        """a leaf on that side of the stem, turned into the most room and sized to it"""
        best = None
        for a in th + out * np.linspace(*fan, 7):
            r, w = s.ray(p, a, hw + CH * 1.2, Lmax + hw + CH)
            sc = r * min(1, w / .035)
            if best is None or sc > best[0]: best = (sc, a, r)
        _, a, L = best; u = np.array([math.cos(a), math.sin(a)]); nv = np.array([-math.sin(th), math.cos(th)]) * out
        base = p + u * (hw + CH * 1.1)   # (a short stalk across the channel)
        L = min(Lmax, L * .95)
        while L >= Lmin:
            k = -out * s.rng.uniform(.2, .9) if s.rng.random() < .7 else out * s.rng.uniform(.2, .6)
            g = leafshape(base, a, L, k, int(s.rng.choice([2, 2, 3])) if L > .1 else 0, out, s.rng); c = None
            g = unary_union([g, stroke(np.array([p, base + u * .01]), [max(hw * .7, HWMIN * 1.3), HWMIN * 1.3])])
            if s.fits(g, p, hw + CH + .004):
                if DEBUG: print(f'    leaf {L:.3f}')
                s.take(g.difference(s.L.buffer(CHL))); return True
            L *= .88
        if DEBUG: print('    leaf failed')
        return False

    def terminal(s, p, th, side, hw, back):
        u = np.array([math.cos(th), math.sin(th)])
        room = s.d(p + u * .04)
        kind = s.rng.choice(['leaf', 'leaf', 'tulip', 'bud']) if room > .035 else 'curl'
        if kind == 'leaf': return s.leaf(p, th, -side, hw, Lmax=.15, fan=(-.3, .6))
        if kind in ('tulip', 'bud'):
            L = min(.13, room * 3)
            while L > (.1 if kind == 'tulip' else .06):   # (a tulip smaller than that is a splat)
                if kind == 'tulip': g, c, _, _ = kleaf.tulip(p - u * .004, th, L)
                else: g = kleaf.blade(kleaf.spine(p - u * .004, th, L * .8, 0, 0)[0], L * .55, 0, kind='petal'); c = None
                if s.fits(g, p, hw + CH + .004): s.take(g.difference(c) if c is not None else g); return True
                L *= .85
        return True

    def knob(s, p, hw):
        g = Point(p).buffer(max(hw, .006) * 1.2)
        s.take(g); return True

    # ---- the whole block
    def gaps(s, lo):
        """the centres of the clear rooms, largest first"""
        pk = (s.D == nd.maximum_filter(s.D, size=int(.08 * RES))) & (s.D >= lo)
        ys, xs = np.nonzero(pk); o = np.argsort(-s.D[ys, xs])
        return [(np.array([xs[i], ys[i]]) / RES, s.D[ys[i], xs[i]]) for i in o]

    def root(s, g):
        """where a shoot toward g springs from: the nearest stem (fused) or the letter's edge"""
        gx, gy = int(g[0] * RES), int(g[1] * RES)
        if getattr(s, '_rk', None) != len(s.vine):   # (the two fields once per change of the vine)
            s._rk = len(s.vine); s._dv = nd.distance_transform_edt(s.kind != 3); s._dl = nd.distance_transform_edt(s.kind != 1, return_indices=True)
        dv, (dl, (ly, lx)) = s._dv, s._dl
        if (s.kind == 3).any() and dv[gy, gx] < dl[gy, gx] + .05 * RES:
            return np.array(shapely.ops.nearest_points(unary_union(s.vine), Point(g))[0].coords[0]), True
        return np.array([lx[gy, gx], ly[gy, gx]]) / RES, False

    def run(s, target=.5):
        rng = s.rng; s.queue = []; s.jumps = 0; s.roots = 0; s.lens = []
        # roots: the foot and the corners, where there is room to grow from them
        for x, y, th in [(A * rng.uniform(.3, .7), 1 - MARG - .01, -math.pi / 2 + rng.choice([-1, 1]) * .6), (MARG + .02, MARG + .02, math.pi / 4), (A - MARG - .02, MARG + .02, 3 * math.pi / 4),
                         (MARG + .02, 1 - MARG - .02, -math.pi / 4), (A - MARG - .02, 1 - MARG - .02, -3 * math.pi / 4)]:
            th += rng.uniform(-.3, .3); p = np.array([x, y])
            if s.d(p + .1 * np.array([math.cos(th), math.sin(th)])) > .04: s.queue.append((p, th, rng.choice([-1, 1]), .9, HWMAX, 0, False))
        tried = []; far = lambda g: all(np.hypot(*(g - t)) > .04 for t in tried)
        for _ in range(150):
            n0 = len(s.vine)
            while s.queue:
                q = s.queue.pop(0)
                if len(q) == 6: q = q + (True,)
                p, th, side, budget, hw0, gen, fused = q
                if gen == 0 or not fused: s.roots += 1
                s.grow(p, th, side, budget, hw0, gen, fused); s.update()
            if s.white() >= target or s.vinefrac() >= VMAX: break   # (half the block white; the vine never more than his, or the letter drowns)
            G = [x for x in s.gaps(SEEDMIN) if far(x[0])] or [(g, d) for g, d in s.gaps(.022)[:20] if far(g) and s.root(g)[1]]   # (small rooms: only shoots off a stem)
            if not G: break
            g, gap = G[rng.integers(min(3, len(G)))]   # (one of the three largest: each seed its own block)
            q, fused = s.root(g)
            v = g - q; v /= np.hypot(*v) + 1e-9; th = math.atan2(v[1], v[0])
            side = rng.choice([-1, 1]); th -= side * rng.uniform(.3, .6)
            p0 = (q, th, side, min(.7, gap * 9), min(HWMAX, gap * .6), 2 if fused else 1, fused)
            s.queue.append(p0); s.roots += 0
            while s.queue:
                q_ = s.queue.pop(0); q_ = q_ + (True,) if len(q_) == 6 else q_
                s.grow(*q_); s.update()
            if len(s.vine) == n0:   # nothing grew there: a leaf, or leave it
                if not s.leaf(q, math.atan2(v[1], v[0]), 1, HWMIN * 1.5, Lmax=.12, fan=(-.5, .5), Lmin=.045): tried.append(g)
                else: s.update()
        # the pools left: a leaf each, from the nearest stem or from behind the letter
        for g, gap in s.gaps(.016)[:30]:
            if s.vinefrac() >= VMAX: break
            if s.d(g) < .016: continue
            q, fused = s.root(g); v = g - q; th = math.atan2(v[1], v[0])
            if s.leaf(q, th, 1, HWMIN * 1.5, Lmax=.12, fan=(-.5, .5), Lmin=.045): s.update()
        s.dots()

    def dots(s):
        for _ in range(25):
            j = np.argmax(s.D); y, x = divmod(j, W); r = s.D[y, x]
            if r < .012: break
            s.take(Point(x / RES, y / RES).buffer(min(.009, r * .45), quad_segs=10), ch=CH * .8)
            s.update()

    def vinefrac(s):
        return raster(unary_union(s.vine)).mean() if s.vine else 0.

    def white(s):
        return (raster(s.L) | raster(unary_union(s.vine))).mean() if s.vine else raster(s.L).mean()

    def geometry(s):
        vine = unary_union(s.vine).buffer(.004, join_style='round').buffer(-.004, join_style='round')   # fillets at the forks
        vine = vine.intersection(s.inner)
        keep = [p for p in getattr(vine, 'geoms', [vine]) if p.area > .0012 or 4 * math.pi * p.area / p.length ** 2 > .7]   # (no slivers left by the cuts; dots stay)
        white = unary_union([s.L] + keep)
        return s.sq.difference(white) if hasattr(s, 'sq') else square(s.rng).difference(white)

def show(black, H=700, ss=3):
    m = raster(black, H * ss, int(A * H * ss), H * ss)
    return Image.fromarray(np.where(m, 0, 255).astype(np.uint8)).resize((int(A * H), H), Image.LANCZOS)

def polys(black):
    out = []
    for p in getattr(black, 'geoms', [black]):
        for r in [p.exterior, *p.interiors]: out.append([[round(x, 5), round(y, 5)] for x, y in r.coords])
    return out

def measure(img):
    from skimage.morphology import skeletonize
    a = np.asarray(img) < 128; H = a.shape[0]; ink = a[int(H * .05):-int(H * .05), int(H * .05):-int(H * .05)]
    e = nd.distance_transform_edt(ink) * 2 / H; c = np.percentile(e[skeletonize(ink)], [50, 90])
    return 1 - a.mean(), c[0], c[1]

if __name__ == '__main__':
    ch, seed, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    import os; os.makedirs(out, exist_ok=True)
    B = Block(ch, seed); B.run(); black = B.geometry()
    im = show(black); im.save(f'{out}/{ch}-{seed}.png')
    wf, cm, c9 = measure(im)
    vw = raster(unary_union(B.vine).intersection(B.inner)).mean()
    from skimage.morphology import skeletonize
    vm = raster(unary_union(B.vine).intersection(B.inner)); vwid = np.percentile(nd.distance_transform_edt(vm)[skeletonize(vm)] * 2 / RES, [50, 90])
    print(f'{ch} {seed} white {wf:.3f} vine {vw:.3f} vwidth {vwid[0]:.3f}/{vwid[1]:.3f} channel med {cm:.3f} p90 {c9:.3f} roots {B.roots} stems {len(B.lens)} longest {sorted(B.lens)[-3:]} jumps {B.jumps}')
    json.dump({'name': f'w{ch}', 'a': A, 'polys': polys(black)}, open(f'{out}/{ch}-{seed}.json', 'w'))
