# kgap: a white-vine initial as Morris cut them. Paint the square, apply the letter, grow a vine in the gaps.
#   square  black, its cut edge a touch irregular
#   letter  GL-Morris (Morris's Troy capitals; licence ../gl-morris/LICENSE.txt) in white, with his hairline cut (cuts.py)
#   vine    first two to four main stems, from behind the letter into the largest rooms; their clearance ignores the
#           letter, so they sweep big and pass behind it (what shows is cut by its channel). Each step follows the largest
#           circle that fits ahead (capped, shrinking with age; curvature eased), so stems sweep in S-curves and end in
#           curls. Off them branches, off those shoots, each rank thinner; width from the room, tapering. Leaves on the
#           outer side of a branch's curves; a tulip at one or two main ends. Then calm: a large room by a stem takes one
#           big lobed leaf, else a shoot; small pockets stay open black with dots.
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
import khand, cuts

A = .95                 # the block's width / height
RES = 500               # the clearance field's px per block height
MARG = .032             # the black border round everything
CHL = .024              # the channel round the letter
CH = .019               # the channel between vine shapes
HWMAX = .03             # a stem's greatest half-width
HWG = (.036, .022, .013)   # by rank: main stem, branch, shoot (each thinner)
BUDGET = (1.6, .55, .26)   # how far each rank may grow
HWCOR = .012            # in a corridor (no room to sweep)
HWMIN = .0045           # a stem's tip
DS = .005               # growth step
DEBUG = 0
CORMAX = .09            # the longest run down a corridor
FILLMIN = .036          # the least room filled after the main stems (the rest: open black and dots)
VMAX = .27              # the vine's greatest share of the block (his: .28-.40 round a lighter letter)
KR = 300                # how fast a stem's curvature may change (per unit length, per unit length)
RC = .035               # the least circle a stem sweeps round (less: it runs a corridor)
FONT = '../gl-morris/GL-Morris.ttf'
W = int(A * RES)

def letter(ch, cap=.79, base=.89, stem=.104):
    P = dict(khand.P, cap=cap, base=base)
    gi, ci, _ = khand.outline(FONT, 'I'); sw = khand.stem_width(khand.place(gi, ci, P), 1)
    g, capH, _ = khand.outline(FONT, ch); g = khand.place(g, capH, P).buffer((stem - sw) / 2, join_style='round', quad_segs=16)
    b = g.bounds; f = min(.8 / (b[3] - b[1]), .86 / (b[2] - b[0]))   # (the letter in the block: .8 tall, or .86 wide if it is wide; centred)
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

# his plant forms (kvocab.py: cut from his blocks and refitted), each normalised: attachment at 0, axis +x, length 1
VOCAB = json.load(open('../vocab-forms.json'))
for _f in VOCAB: _f['rings'] = [np.array(r)[::2] for r in _f['rings']]   # (every other point: smooth enough at any size drawn)

def form(f, base, a, L, k=0., mirror=False):
    """his form f laid at base, its axis at angle a, L long, bent along an arc that turns k radians over its length (it
    curls with the growth), mirrored if asked"""
    g = None
    for r in f['rings']:
        u, v = r[:, 0], r[:, 1] * (-1 if mirror else 1)
        th = a + k * u; kk = k if abs(k) > 1e-4 else 1e-4
        sx = (np.sin(a + kk * u) - np.sin(a)) / kk; sy = -(np.cos(a + kk * u) - np.cos(a)) / kk   # (the spine: an arc)
        x = base[0] + L * (sx - v * np.sin(th)); y = base[1] + L * (sy + v * np.cos(th))
        p = Polygon(np.stack([x, y], 1)).buffer(0)
        g = p if g is None else g.symmetric_difference(p)
    return g

class Block:
    def __init__(s, ch, seed):
        s.rng = np.random.default_rng(seed * 7919 + ord(ch)); s.ch = ch; s.flip = bool(s.rng.random() < .5)
        s.L = letter(ch)
        slight = s.L.area < .14; s.chl = CHL * (1.3 if slight else 1); s.vmax = VMAX - (.04 if slight else 0)   # (a slight letter, J Y Q: more room round it, less vine)
        s.LC = s.L.buffer(s.chl)
        s.inner = box(MARG, MARG, A - MARG, 1 - MARG)
        s.occ = raster(s.LC) | ~raster(s.inner)      # taken: the letter and its channel, the border
        s.occv = ~raster(s.inner); s.ghost = False              # (the same without the letter: a main stem passes behind it)
        s.kind = np.where(raster(s.LC), 1, np.where(raster(s.inner), 0, 2))   # what a root grows from
        s.vine = []                                              # white shapes
        s.update()

    # ---- the clearance field
    def update(s):
        s.D = nd.distance_transform_edt(~s.occ) / RES; s.Dm = nd.distance_transform_edt(~s.occv) / RES
        j = np.argmax(s.D); s.far = np.array([j % W, j // W]) / RES
    def d(s, p):
        x, y = int(p[0] * RES), int(p[1] * RES)
        return (s.Dm if s.ghost else s.D)[y, x] if 0 <= y < RES and 0 <= x < W else 0.
    def take(s, g, ch=CH, kind=3):
        s.vine.append(g); m = raster(g.buffer(ch)); s.occ |= m; s.occv |= m; s.kind[m & (s.kind == 0)] = kind

    def circle(s, p, th, side, hw, rmax):
        """the largest circle tangent to the heading at p, on that side, that fits the clear space"""
        n = np.array([-math.sin(th), math.cos(th)]) * side; best = 0.
        for r in np.arange(.012, rmax, .004):
            if s.d(p + n * r) >= r + hw * 1.6: best = r
            elif best: break
        return best

    # ---- one stem
    def walk(s, p, th, side, budget, fused, gen=1):
        """grows a centreline from p: points, headings, turning sides (s.M: 0 sweeping, 1 corridor, 2 behind the letter)"""
        P = [np.array(p, float)]; T = [th]; S = [side]; M = [0]; turned = 0.; age = 0.; R0 = s.rng.uniform(.24, .34) if gen == 0 else s.rng.uniform(.16, .24)
        flip_at = s.rng.uniform(.35, .6) * math.pi; free_start = True; s.k0 = 0; run = 0.; jumped = 0; s.why = 'budget'; wave = 0.; flips = 0; kap = 0.; wlen = s.rng.uniform(.04, .08)
        def add(q, m): P.append(q); T.append(th); S.append(side); M.append(m)
        while age < budget:
            p = P[-1]; mode = 0
            if free_start and s.d(p) < HWMIN * 1.5:   # still inside what it springs from: straight out
                if age > .16: return None
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
                if s.dframe(p) < .06 and gen > 1: s.why = 'frame'; break   # (never along the frame; a main stem may run a strip, one stem)
                look = lambda a: min(s.d(p + k * DS * np.array([math.cos(th + a), math.sin(th + a)])) for k in (3, 6, 9))
                best = max(np.linspace(-.6, .6, 13), key=lambda a: look(a) - .004 * abs(a))   # (down the middle, no forced wave)
                if look(best) < HWMIN * 1.2: s.why = 'corridor-blocked'; break
                run += DS
                if run > (CORMAX * (3, 2, 1)[min(gen, 2)]): s.why = 'corridor-long'; break
                dth = DS * side / .09 + float(np.clip(best * .08, -DS / .08, DS / .08)); wave += DS; mode = 1   # (a slow wave down the middle, eased: never a straight run)
                if wave > wlen: side, wave, wlen = -side, 0., s.rng.uniform(.08, .13)
            else:
                if abs(turned) > 1.6 * math.pi: s.why = 'curl'; break   # a full curl: done
                dth = side * DS / r; run = 0.
            kap += float(np.clip(dth / DS - kap, -KR * DS, KR * DS)); dth = kap * DS   # (curvature eases from one sweep into the next: no kinks)
            th += dth; turned += dth * side
            u = np.array([math.cos(th), math.sin(th)]); q = p + DS * u
            hopped = False
            hit = next((t for t in np.arange(.01, .07, .01) if s.kind_at(p + u * t) != 0), None)
            if gen > 0 and not jumped and age > .04 and hit and s.kind_at(p + u * hit) == 1:   # the letter ahead: pass behind it, if there is room beyond
                for t in np.arange(hit, hit + .3, DS):
                    z = p + u * t
                    if s.kind_at(z) == 1: continue
                    if s.kind_at(z) == 0 and s.d(z + u * .02) >= .025:
                        for tt in np.arange(DS, t + 1e-9, DS): add(p + u * tt, 2)
                        age += t; jumped += 1; s.jumps += 1; hopped = True
                    break
                if hopped: continue
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
            if gen < 2 and s.tulips < 3 and age > budget * .35 and mode == 0 and s.d(q + u * .07) > .05 and s.rng.random() < .07:
                s.why = 'flower'; break   # (it stops in open room, to flower there)
        s.M = np.array(M)
        return np.array(P), np.array(T), np.array(S)

    def dframe(s, p):
        return min(p[0] - MARG, A - MARG - p[0], p[1] - MARG, 1 - MARG - p[1])

    def kind_at(s, p):
        x, y = int(p[0] * RES), int(p[1] * RES)
        return s.kind[y, x] if 0 <= y < RES and 0 <= x < W else 2

    def widths(s, P, hw0, gen=1):
        room = np.array([s.d(p) for p in P]); hid = nd.binary_dilation(s.M == 2, iterations=8)
        if hid.any(): room[hid] = np.interp(np.nonzero(hid)[0], np.nonzero(~hid)[0], room[~hid])   # (behind the letter: as wide as either side)
        k = min(s.k0 + 3, len(P) - 1); room[:k] = min(room[k], HWG[min(gen, 2)])   # (it springs from behind at full width)
        L = np.r_[0, np.cumsum(np.hypot(*np.diff(P, axis=0).T))]; tot = L[-1]
        hw = np.minimum(np.where(nd.maximum_filter1d(s.M, 9) == 1, HWCOR, HWG[min(gen, 2)]), room * .95)   # (thinner in a corridor)
        hw = nd.gaussian_filter1d(hw, 4, mode='nearest'); hw = np.minimum(hw, np.maximum(room, HWMIN))
        hw = np.minimum(hw, hw0 * (1 - .55 * L / max(tot, 1e-6)))                         # tapering all the way from its root
        hw = nd.gaussian_filter1d(hw, 7, mode='nearest')                                       # (no lumps: the width flows)
        tip = np.clip((tot - L) / min(.2 if gen == 0 else .12, tot * .6 + 1e-6), 0, 1) ** .7                 # taper to the tip
        x, y = int(P[0][0] * RES), int(P[0][1] * RES)
        if not (0 <= x < W and 0 <= y < RES) or s.kind[y, x] == 2: hw = hw * np.clip(.3 + L / .1, 0, 1)   # out of the border's corner: from a point
        hw = np.maximum(np.where(tip < 1, HWMIN, .0075), hw * (.18 + .82 * tip))   # (never a hairline but at the very tip)
        if s.fork:   # a branch swells out of its parent: from the parent's width down to its own over its first .06
            r = np.clip(L / .06, 0, 1); hw = np.maximum(hw, (s.fork * (1 - r) + hw * r) * (r < 1))
        return hw

    def grow(s, p, th, side, budget, hw0, gen, fused):
        s.ghost = gen == 0; w = s.walk(p, th, side, budget, fused, gen)
        if w is None or len(w[0]) < (.1 if fused else .06) / DS: s.ghost = False; return None   # (no stubs: a shoot is a real stem or nothing)
        s.fork = hw0 / .7 if fused and gen > 0 else 0.; P, T, S = w; hw = s.widths(P, hw0, gen); s.ghost = False; s.lens.append(round(len(P) * DS, 2))
        if DEBUG: print(f'  stem gen {gen} fused {int(fused)} len {len(P) * DS:.2f}/{budget:.2f} why {s.why} hw {hw.max():.3f}')
        g = stroke(P, hw)
        g = g.intersection(s.inner).difference(s.LC)
        s.take(g)
        tot = len(P) * DS
        # leaves on the outer side of curves, branches into the larger side
        # along it: branches (from a main stem mostly), leaves (on branches and shoots mostly), on the outer side of curves
        gap = (.12, .2) if gen == 0 else (.1, .16); pb = (.6, .35, 0)[min(gen, 2)]
        nxt = s.rng.uniform(*gap) * .7; slots = []
        for i in range(4, len(P) - 10):
            if i * DS < nxt or (s.M[max(0, i - 6):i + 7] == 2).any() or s.d(P[i]) < hw[i] * .5: continue   # (not where it is behind the letter)
            nxt = i * DS + s.rng.uniform(*gap); slots.append(i)
        for i in slots:
            nv = np.array([-math.sin(T[i]), math.cos(T[i])]); out = -S[i]
            o = hw[i] + CH + .03; big = 1 if s.d(P[i] + nv * o) > s.d(P[i] - nv * o) else -1   # (the room beyond its channel)
            if gen < 2 and s.rng.random() < pb and s.d(P[i] + big * nv * o) > .025:
                s.queue.append((P[i] + big * nv * hw[i] * .5, T[i] + big * s.rng.uniform(.7, 1.05), -big if s.rng.random() < .6 else big, BUDGET[gen + 1], hw[i] * .7, gen + 1))
            elif (s.M[max(0, i - 4):i + 5] == 0).all():   # (leaves on the curves of branches; not down a corridor)
                s.leaf(P[i], T[i], out, hw[i])
        s.gen = gen
        if tot > .12: s.terminal(P[-1], T[-1], S[-1], hw[-1], P[-6], gen)   # (a short shoot just ends in its curl)
        return g

    # ---- foliage
    def pick(s, kind):
        fs = [f for f in VOCAB if f['kind'] == kind]; return fs[s.rng.integers(len(fs))]

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

    def leaf(s, p, th, out, hw, Lmax=.32, fan=(.25, 1.45), Lmin=.12):
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
            k = -out * s.rng.uniform(.2, .7)   # (it curls with the growth)
            g = form(s.pick('leaf'), base, a, L, k, mirror=(out < 0) ^ s.flip)
            sw = max(hw * .8, .007); g = unary_union([g, stroke(np.array([p, base + u * L * .12]), [sw, sw * .8])])   # (a stalk as the stem goes on into it)
            if s.fits(g, p, hw + CH + .004):
                if DEBUG: print(f'    leaf {L:.3f}')
                s.take(g.difference(s.LC)); return True
            L *= .88
        if DEBUG: print('    leaf failed')
        return False

    def terminal(s, p, th, side, hw, back, gen=1):
        """a main stem ends in a flower (one or two to a block) or a big leaf; a branch in a leaf or its curl; a shoot in a
        bud or its curl"""
        u = np.array([math.cos(th), math.sin(th)])
        room = s.d(p + u * .05)
        if gen < 2 and s.tulips < 3 and room > .036 and (gen == 0 or s.rng.random() < .5):   # his flower, on the stem's line
            f = s.pick('flower'); L = min(.24, room * 3.6)
            while L > .1:
                g = form(f, p - u * .004, th, L, s.rng.uniform(-.3, .3), mirror=s.rng.random() < .5)
                if s.fits(g, p, hw + CH + .004): s.take(g.difference(s.LC)); s.tulips += 1; return True
                L *= .9
        if gen < 2 and room > .03: return s.leaf(p, th, -side, hw, Lmax=.26, fan=(-.3, .6))
        if room > .028 and s.rng.random() < .6:   # his bud
            f = s.pick('bud'); L = min(.12, room * 2.6)
            while L > .06:
                g = form(f, p - u * .004, th, L, 0, mirror=s.rng.random() < .5)
                if s.fits(g, p, hw + CH + .004): s.take(g.difference(s.LC)); return True
                L *= .88
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

    def root(s, g, letter_only=False):
        """where a shoot toward g springs from: the nearest stem (fused) or the letter's edge"""
        gx, gy = int(g[0] * RES), int(g[1] * RES)
        if getattr(s, '_rk', None) != len(s.vine):   # (the two fields once per change of the vine)
            s._rk = len(s.vine); s._dv = nd.distance_transform_edt(s.kind != 3); s._dl = nd.distance_transform_edt(s.kind != 1, return_indices=True)
        dv, (dl, (ly, lx)) = s._dv, s._dl
        if not letter_only and (s.kind == 3).any() and dv[gy, gx] < dl[gy, gx] + .05 * RES:
            return np.array(shapely.ops.nearest_points(unary_union(s.vine), Point(g))[0].coords[0]), True
        return np.array([lx[gy, gx], ly[gy, gx]]) / RES, False

    def run(s, target=.5):
        rng = s.rng; s.queue = []; s.jumps = 0; s.roots = 0; s.lens = []; s.tulips = 0
        # the main stems, two to four: each from behind the letter (or a lower corner) into the largest room left, long,
        # sweeping, passing behind the letter; everything else branches from them
        for _ in range(int(rng.integers(3, 5))):
            G = s.gaps(.06)
            if not G: break
            g, gap = G[rng.integers(min(2, len(G)))]
            q, _ = s.root(g, letter_only=True)
            v = g - q; v /= np.hypot(*v) + 1e-9; side = rng.choice([-1, 1]); th = math.atan2(v[1], v[0]) - side * rng.uniform(.5, .9)
            s.roots += 1; s.queue = [(q, th, side, BUDGET[0], HWG[0], 0, False)]
            while s.queue:
                p, th, side, budget, hw0, gen, *f = s.queue.pop(0)
                s.grow(p, th, side, budget, hw0, gen, f[0] if f else True); s.update()
        # then calm: a shoot off the nearest stem into a room still large, never into every pocket
        tried = []; far = lambda g: all(np.hypot(*(g - t)) > .05 for t in tried)
        for _ in range(40):
            if s.white() >= target or s.vinefrac() >= s.vmax: break
            G = [x for x in s.gaps(FILLMIN) if far(x[0])]
            if not G: break
            g, gap = G[0]; n0 = len(s.vine)
            q, fused = s.root(g)
            v = g - q; v /= np.hypot(*v) + 1e-9; side = rng.choice([-1, 1]); th = math.atan2(v[1], v[0]) - side * rng.uniform(.3, .6)
            # a large room by a stem: first one big leaf off the stem into it (his leaves are few and large)
            if fused and gap >= .04 and s.dframe(g) > .06 and s.leaf(q, math.atan2(v[1], v[0]), side, HWMIN * 2, Lmax=.34, fan=(-.6, .6), Lmin=.12): s.update(); continue
            s.queue = [(q, th, side, BUDGET[1], HWG[1], 1, fused)]
            while s.queue:
                p, th, side, budget, hw0, gen, *f = s.queue.pop(0)
                s.grow(p, th, side, budget, hw0, gen, f[0] if f else True); s.update()
            if len(s.vine) == n0:
                if s.dframe(g) > .07 and s.leaf(q, math.atan2(v[1], v[0]), 1, HWMIN * 1.5, Lmax=.18, fan=(-.5, .5), Lmin=.06): s.update()
                else: tried.append(g)
        s.dots()

    def dots(s):
        for _ in range(40):
            j = np.argmax(s.D); y, x = divmod(j, W); r = s.D[y, x]
            if r < .012: break
            s.take(Point(x / RES, y / RES).buffer(min(.009, r * .45), quad_segs=10), ch=CH * .8)
            s.update()

    def vinefrac(s):
        return raster(unary_union(s.vine)).mean() if s.vine else 0.

    def white(s):
        return (raster(s.L) | raster(unary_union(s.vine))).mean() if s.vine else raster(s.L).mean()

    def geometry(s):
        vine = unary_union(s.vine).buffer(.006, join_style='round').buffer(-.006, join_style='round')   # fillets at the forks
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
    print(f'{ch} {seed} white {wf:.3f} vine {vw:.3f} vwidth {vwid[0]:.3f}/{vwid[1]:.3f} channel med {cm:.3f} p90 {c9:.3f} roots {B.roots} stems {len(B.lens)} longest {sorted(B.lens)[-3:]} jumps {B.jumps} tulips {B.tulips}')
    json.dump({'name': f'w{ch}', 'a': A, 'polys': polys(black)}, open(f'{out}/{ch}-{seed}.json', 'w'))
