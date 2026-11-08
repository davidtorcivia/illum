# kvine2: Morris's white vine as growth, all vector (shapely); block units (height 1, width A), y down.
#   STEMS   3-5 main stems with real thickness rise from the block's foot and corners and from the letter's ends, sweeping
#           in long S-curves THROUGH the counters and BEHIND the strokes (the letter is transparent to them; where one
#           passes behind, it is cut away with his black gap either side); none runs along the frame.
#   BRANCHES leave the stems tangentially and taper, curling at the end; his leaves on short curving side-shoots and at
#           branch ends, his flowers at a few prominent ends.
#   TENDRILS the many thin curling shoots off the branches fill the black to his white; dots only in leftover pockets.
import numpy as np, math, pickle, sys
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from shapely.geometry import Polygon, Point, LineString, box
from shapely.ops import unary_union
from shapely import affinity
sys.path.insert(0, '.')
from kvine import spiral, band, place, veins, raster_ink, vocab, A, FR
GAP = .02

def bez(p0, p1, p2, p3, n=200):
    t = np.linspace(0, 1, n)[:, None]; P = (1-t)**3*p0 + 3*(1-t)**2*t*p1 + 3*(1-t)*t**2*p2 + t**3*p3
    d = np.gradient(P, axis=0); return P, np.arctan2(d[:, 1], d[:, 0])

def resample(P, step=.004):
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(P, axis=0).T))]; t = np.arange(0, d[-1], step)
    Q = np.stack([np.interp(t, d, P[:, 0]), np.interp(t, d, P[:, 1])], 1); g = np.gradient(Q, axis=0); return Q, np.arctan2(g[:, 1], g[:, 0])

class Block:
    def __init__(s, letter, seed):
        s.rng = np.random.default_rng(seed); s.letter0 = letter; s.R = 360
        s.inner = box(FR + .01, FR + .01, A - FR - .01, 1 - FR - .01)
        s.stems = []      # (P, angs, w0, w1) main stems (drawn behind the letter)
        s.white = []      # everything else, in front, kept clear of the letter and each other
        s.cuts = []; s.ends = 0; s.paths = []   # paths: centre-lines branches/tendrils may leave from
    # -- rasters for fast clearance ---------------------------------------------------------------------------------
    def _mask(s, geoms):
        R = s.R; im = Image.new('L', (int(R * A) + 1, R), 0); d = ImageDraw.Draw(im)
        for g in geoms:
            for p in getattr(g, 'geoms', [g]):
                if p.is_empty: continue
                d.polygon([(x * R, y * R) for x, y in p.exterior.coords], fill=255)
                for r in p.interiors: d.polygon([(x * R, y * R) for x, y in r.coords], fill=0)
        m = np.asarray(im) > 127; b = int((FR + .01) * R); m[:b] = m[-b:] = True; m[:, :b] = m[:, -b:] = True; return m
    def refresh(s):
        s.cl_all = nd.distance_transform_edt(~s._mask([s.letter0] + s.white + [band(P, w0, w1) for P, a, w0, w1 in s.stems])) / s.R
        s.cl_stem = nd.distance_transform_edt(~s._mask([band(P, w0, w1) for P, a, w0, w1 in s.stems])) / s.R
        s._fw = {}
        fr = np.ones_like(s.cl_all, bool); b = int((FR + .01) * s.R); fr[b:-b, b:-b] = False
        s.cl_frame = nd.distance_transform_edt(~fr) / s.R
    def field_without(s, P, w0, w1):
        key = id(P)
        if getattr(s, '_fw', None) is None: s._fw = {}
        if key not in s._fw:
            par = band(P, w0, w1)
            geoms = [s.letter0] + [g for g in s.white if not g.equals(par)] + [band(Q, a, b) for Q, an, a, b in s.stems if Q is not P]
            s._fw[key] = nd.distance_transform_edt(~s._mask(geoms)) / s.R
        return s._fw[key]
    def at(s, F, p):
        i, j = int(p[0] * s.R), int(p[1] * s.R)
        return F[j, i] if 0 <= j < F.shape[0] and 0 <= i < F.shape[1] else 0.

    # -- main stems ---------------------------------------------------------------------------------------------------
    def main_stems(s, n=4):
        s.holes = [Polygon(r) for p in getattr(s.letter0, 'geoms', [s.letter0]) for r in p.interiors if Polygon(r).area > .004]
        s.refresh(); m = FR + .05
        lc = np.array(max(getattr(s.letter0, 'geoms', [s.letter0]), key=lambda q: q.area).exterior.coords); cen = np.array([A / 2, .5])
        lroots = lc[np.argsort(-np.hypot(*(lc - cen).T))[:80:16]]
        roots = [np.array([x, 1 - m]) for x in (m + .05, A / 2, A - m - .05)] + [np.array(p) for p in ((m, m), (A - m, m))] + list(lroots)
        tries = 0
        while len(s.stems) < n and tries < 12:
            tries += 1; best = None
            for _ in range(500):
                p0 = roots[s.rng.integers(len(roots))]; p3 = np.array([s.rng.uniform(m + .08, A - m - .08), s.rng.uniform(m + .08, 1 - m - .08)])
                if np.hypot(*(p3 - p0)) < .45: continue
                d = p3 - p0; nrm = np.array([-d[1], d[0]]) / np.hypot(*d); bend = s.rng.uniform(.18, .38)
                p1 = p0 + d * .33 + nrm * bend * s.rng.choice([-1, 1]) * np.hypot(*d) * .8
                p2 = p0 + d * .66 - nrm * bend * s.rng.choice([-1, 1]) * np.hypot(*d) * .8     # an S when the signs differ
                P, ang = bez(p0, p1, p2, p3); P, ang = resample(P)
                if not all(s.inner.contains(Point(q)) for q in P[::12]): continue
                fr = np.array([s.at(s.cl_frame, q) for q in P]); st = np.array([s.at(s.cl_stem, q) for q in P])
                if (fr[15:] < .055).mean() > .08 or (st[8:] < .075).any(): continue                 # off the frame; clear of the other stems
                line = LineString(P)
                if any(line.intersects(h) and any(LineString(Q).intersects(h) for Q, _, _, _ in s.stems) for h in getattr(s, 'holes', [])): continue   # never two through one counter
                turn = np.abs(np.diff(np.unwrap(ang))).sum()
                if turn > 4.5: continue
                behind = np.mean([s.letter0.contains(Point(q)) for q in P[::6]])
                score = len(P) * .004 + min(behind, .15) * 1.5 + (fr.clip(0, .2).mean())          # long, through the letter, in the open
                if best is None or score > best[0]: best = (score, P, ang)
            if best is None: continue
            _, P, ang = best
            sg = s.rng.choice([-1, 1]); C, ca = spiral(P[-1], ang[-1], .14, sg * 6, sg * 26, n=36)   # it closes in a curl
            P = np.vstack([P, C[1:]]); ang = np.r_[ang, ca[1:]]
            s.stems.append((P, ang, .038, .016)); s.paths.append((P, ang, .038, .016)); s.ends += 1; s.refresh()

    # -- shoots: tangential departure, curvature rising (his curl) ----------------------------------------------------
    def shoot(s, P, ang, w0, w1, j, side, L, kmax, wfrac=.6, need=None, front=True):
        """a shoot off a path: leaves it tangentially, curvature rising into a curl; the longest that fits of a few"""
        p = P[j]; wb = max(.008, (w0 + (w1 - w0) * j / len(P)) * wfrac); wpar = w0 + (w1 - w0) * j / len(P)
        need = need if need is not None else wb / 2 + .012
        F = s.field_without(P, w0, w1); par = LineString(P)
        for LL in (L, L * .75, L * .55, L * .4):
            if LL < .03: break
            a0 = ang[j] + side * s.rng.uniform(.3, .6)
            B, ba = spiral(p + np.array([math.cos(a0), math.sin(a0)]) * .003, a0, LL, side * s.rng.uniform(.5, 2), side * kmax * (L / LL) ** .5, n=max(12, int(LL / .004)))
            c = np.array([s.at(F, q) for q in B[4:]])
            if (c < need).any() or not s.inner.contains(LineString(B)): continue
            far = np.array([par.distance(Point(q)) for q in B[len(B) // 3:]])
            if (far < wpar / 2 + need * .8).any(): continue
            return B, ba, wb
        return None

    def branches(s, V):
        lv = [v for v in V if v['kind'] == 'leaf']; fl = [v for v in V if v['kind'] == 'flower']; flowers_left = 3
        for P, ang, w0, w1 in list(s.stems):
            n = len(P); side = s.rng.choice([-1, 1]); j = int(n * .1)
            while j < n - 40:
                side = -side
                # where the stem is behind the letter there is nothing to branch from
                if s.letter0.buffer(.03).contains(Point(P[j])): j += 5; continue
                r = s.shoot(P, ang, w0, w1, j, side, s.rng.uniform(.14, .32), s.rng.uniform(12, 22), wfrac=.62)
                if r:
                    B, ba, wb = r; s.white.append(band(B, wb, wb * .45)); s.paths.append((B, ba, wb, wb * .45)); s.refresh()
                    # its end: a leaf, or (a few) one of his flowers, else the curl stays
                    if not s.end_piece(B, ba, lv, fl if flowers_left > 0 else [], (.13, .11, .09)): s.ends += 1
                    elif s.last_kind == 'flower': flowers_left -= 1
                    j += int(n * s.rng.uniform(.09, .14))
                else: j += 5
        # leaves on short curving side-shoots off stems and branches
        for P, ang, w0, w1 in list(s.paths):
            n = len(P); side = s.rng.choice([-1, 1]); j = int(n * .15)
            while j < n - 20:
                side = -side
                if s.letter0.buffer(.03).contains(Point(P[j])): j += 4; continue
                r = s.shoot(P, ang, w0, w1, j, side, s.rng.uniform(.025, .05), s.rng.uniform(4, 9), wfrac=.5, need=.012)
                if r and s.end_piece(r[0], r[1], lv, [], (.12, .10, .085, .07)):
                    s.white.append(band(r[0], r[2], r[2] * .7)); j += int(n * s.rng.uniform(.12, .2))
                else: j += 4
            s.refresh()

    def end_piece(s, B, ba, lv, fl, sizes):
        for size in sizes:
            for _ in range(4):
                use_fl = fl and size >= .11 and s.rng.random() < .5
                pc = (fl if use_fl else lv)[s.rng.integers(len(fl if use_fl else lv))]
                g = place(pc, B[-1], ba[-1] + s.rng.uniform(-.2, .2), size * (1.1 if use_fl else 1))
                if s.inner.contains(g) and not g.buffer(GAP).intersects(s.front_taken(B)):
                    s.white.append(g); s.ends += 1; s.last_kind = 'flower' if use_fl else 'leaf'
                    if not use_fl:
                        v = veins(pc, size)
                        if v is not None: s.cuts.append(place(dict(g=v), B[-1], ba[-1], size))
                    return True
        return False

    def front_taken(s, own=None):
        geoms = [s.letter0] + s.white + [band(P, w0, w1) for P, a, w0, w1 in s.stems]
        g = unary_union(geoms)
        if own is not None: g = g.difference(LineString(own[-6:]).buffer(.02))
        return g

    # -- tendrils fill -------------------------------------------------------------------------------------------------
    def tendrils(s, target=.52):
        for it in range(160):
            if it % 6 == 0 and s.white_frac() >= target: break
            F = s.cl_all; j, i = np.unravel_index(np.argmax(F), F.shape); c = F[j, i]; q = np.array([i, j]) / s.R
            if c < .024: break
            # from the nearest point of any path (not behind the letter), a thin shoot curling into the pocket
            best = None
            for P, ang, w0, w1 in s.paths:
                d = np.hypot(*(P - q).T); k = int(np.argmin(d))
                if best is None or d[k] < best[0]: best = (d[k], P, ang, w0, w1, k)
            ok = False
            if best and best[0] < c + .18:
                _, P, ang, w0, w1, k = best
                for side in (1, -1):
                    if s.letter0.buffer(.03).contains(Point(P[k])): break
                    L = best[0] + c * s.rng.uniform(.6, 1.2)
                    r = s.shoot(P, ang, w0, w1, k, side, L, s.rng.uniform(25, 45), wfrac=.38, need=.006 + GAP * .7)
                    if r:
                        B, ba, wb = r; wb = min(wb, .012); s.white.append(band(B, wb, .004)); s.paths.append((B, ba, wb, .004)); s.ends += 1; ok = True; break
            if not ok:
                rr = .0075 if c > .035 else .006; kk = 3 if c > .045 else 1; rot = s.rng.uniform(0, 6.3)
                s.white.append(unary_union([Point(q + (rr * 2.15 * np.array([math.cos(rot + m * 2.094), math.sin(rot + m * 2.094)]) if kk > 1 else 0)).buffer(rr, quad_segs=12) for m in range(kk)]))
            s.refresh()

    # -- the cut ---------------------------------------------------------------------------------------------------------
    def ink(s):
        stems = unary_union([band(P, w0, w1) for P, a, w0, w1 in s.stems]).intersection(s.inner)
        behind = stems.difference(s.letter0.buffer(GAP))            # the stems pass behind: cut away where the letter is, with his gap
        W = unary_union([s.letter0, behind] + s.white)
        if s.cuts: W = W.difference(unary_union(s.cuts))
        return box(0, 0, A, 1).difference(W)
    def white_frac(s):
        ink = s.ink(); inner = box(.045, .045, A - .045, 1 - .045); return 1 - ink.intersection(inner).area / inner.area

if __name__ == '__main__':
    import cuts as CU
    V = pickle.load(open('vocab_vec.pkl', 'rb'))   # (our own scratch pickle, written by kvine.vocab())
    L = pickle.load(open('glm26.pkl', 'rb')); out = {}; seed = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    for ch in sys.argv[1]:
        letter = CU.cut(affinity.scale(L[ch], .86, .86, origin=(A / 2, .5)))
        B = Block(letter, seed); B.main_stems(4); B.branches(V); B.tendrils()
        ink = B.ink(); out[ch] = ink
        print(ch, 'white %.3f stems %d ends %d' % (B.white_frac(), len(B.stems), B.ends), flush=True)
        Image.fromarray(255 - raster_ink(ink)).save(f'out7/block-{ch}.png')
    pickle.dump(out, open(f'blocks2_{sys.argv[1]}_{seed}.pkl', 'wb'))
