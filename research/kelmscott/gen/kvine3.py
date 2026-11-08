# kvine3: stems that pass behind the letter (kvine2), foliage DRAWN along the growth (kleaf): leaves as curved blades
# leaving the stem with its flow, larger near the base; branches bearing their own leaves and ending in a leaf, a tulip
# or a curl; tendrils curling into the black that is left; dots only in what remains.
import numpy as np, math, pickle, sys
from PIL import Image
from shapely.geometry import Point, LineString, box
from shapely.ops import unary_union
from shapely.prepared import prep
from shapely import affinity
sys.path.insert(0, '.')
import kvine2 as K2, kleaf as KL
from kvine import raster_ink, A, FR
GAP = .018

class Vine(K2.Block):
    def taken_init(s):
        s.T = unary_union([s.letter0] + [K2.band(P, w0, w1) for P, a, w0, w1 in s.stems] + s.white); s.Tp = prep(s.T)
    def add(s, g, cut=None):
        s.white.append(g); s.T = s.T.union(g); s.Tp = prep(s.T)
        if cut is not None and not cut.is_empty: s.cuts.append(cut)
    def fits(s, g, near=None):
        if not s.inner.contains(g): return False
        b = g.buffer(GAP)
        if near is not None: b = b.difference(Point(near).buffer(.045))   # (where it leaves its parent)
        return not s.Tp.intersects(b)

    def try_leaf(s, p, a, Ls, k, side):
        for L in Ls:
            for da in (0, .3 * side, -.25 * side):
                lobes = int(s.rng.choice([0, 2, 2, 3])); curl = side * s.rng.uniform(0, 5)
                g, c, P, ang = KL.leaf(p, a + da, L, k=k, wfrac=s.rng.uniform(.42, .55), asym=side * s.rng.uniform(.1, .3), lobes=lobes, depth=s.rng.uniform(.4, .6), curl=curl)
                if s.fits(g, near=p): s.add(g, c); s.ends += 1; return L
        return 0

    def foliage(s):
        s.taken_init(); paths = []
        for P, ang, w0, w1 in list(s.stems):
            n = len(P); side = s.rng.choice([-1, 1]); j = int(n * .08)
            kk = np.gradient(np.unwrap(ang)) / .004
            while j < n - 30:
                side = -side; t = j / n
                if s.letter0.buffer(.025).contains(Point(P[j])): j += 4; continue
                w = w0 + (w1 - w0) * t; p = P[j] + np.array([-math.sin(ang[j]), math.cos(ang[j])]) * side * (w * .5 + .004)
                a = ang[j] + side * s.rng.uniform(.85, 1.2); k = -side * s.rng.uniform(1.5, 3.5)   # (it leaves wide, then sweeps back with the growth)
                if s.rng.random() < .35:   # a branch bearing its own
                    r = s.shoot(P, ang, w0, w1, j, side, s.rng.uniform(.18, .32), s.rng.uniform(10, 18), wfrac=.6, need=.012)
                    if r:
                        B, ba, wb = r; g = K2.band(B, wb, wb * .5)
                        if s.fits(g, near=P[j]):
                            s.add(g); paths.append((B, ba, wb, wb * .5))
                            # its end: a tulip at a few, else a leaf, else its curl
                            done = False
                            if s.rng.random() < .3:
                                for L in (.13, .11, .09):
                                    tg, tc, _, _ = KL.tulip(B[-1], ba[-1], L)
                                    if s.fits(tg, near=B[-1]): s.add(tg, tc); s.ends += 1; done = True; break
                            if not done and not s.try_leaf(B[-1], ba[-1], (.14, .12, .10, .08), float(np.clip(np.gradient(ba)[-1] / .004, -6, 6)), side): s.ends += 1
                            j += int(n * .1); continue
                Ls = tuple(L * (1.15 - .45 * t) for L in (.17, .15, .13, .11, .09, .075, .06))
                j += int(n * .06) if s.try_leaf(p, a, Ls, k, side) else 4
        # leaves along the branches too, smaller
        for B, ba, wb, we in paths:
            m = len(B); side = s.rng.choice([-1, 1])
            for j in range(int(m * .25), m - 15, max(8, int(m * .3))):
                side = -side; p = B[j] + np.array([-math.sin(ba[j]), math.cos(ba[j])]) * side * (wb * .5 + .003); a = ba[j] + side * 1.0
                s.try_leaf(p, a, (.10, .085, .07, .06), -side * 2.5, side)
        s.paths = [(P, a, w0, w1) for P, a, w0, w1 in s.stems] + paths

    def tendrils_fill(s, target=.52):
        s.refresh_from_T()
        for it in range(220):
            if it % 8 == 0 and s.frac() >= target: break
            F = s.cl; j, i = np.unravel_index(np.argmax(F), F.shape); c = F[j, i]; q = np.array([i, j]) / s.R
            if c < .022: break
            ok = False
            cands = []
            for P, ang, w0, w1 in s.paths:
                d = np.hypot(*(P - q).T); k = int(np.argmin(d)); cands.append((d[k], P, ang, w0, w1, k))
            cands.sort(key=lambda z: z[0])
            for dist, P, ang, w0, w1, k in cands[:3]:
                if dist > c + .25 or s.letter0.buffer(.025).contains(Point(P[k])): continue
                for side in (1, -1):
                    for L in (dist + c * .9, dist + c * .5, dist):
                        a = ang[k] + side * s.rng.uniform(.4, .8)
                        g, TP, ta = KL.tendril(P[k], a, max(.04, L), min(.014, (w0 + w1) * .3), side, k0=s.rng.uniform(1, 4), k1=s.rng.uniform(30, 55))
                        if s.fits(g, near=P[k]):
                            s.add(g); s.ends += 1; ok = True; break
                    if ok: break
                if ok: break
            if not ok:
                if True:
                    rr = .0075 if c > .035 else .006
                    s.add(Point(q).buffer(rr, quad_segs=12))
            s.refresh_from_T()

    def refresh_from_T(s):
        from scipy import ndimage as nd
        s.cl = nd.distance_transform_edt(~s._mask([s.T])) / s.R
    def frac(s):
        ink = s.ink(); inner = box(.045, .045, A - .045, 1 - .045); return 1 - ink.intersection(inner).area / inner.area

if __name__ == '__main__':
    import cuts as CU
    L = pickle.load(open('glm26.pkl', 'rb')); seed = int(sys.argv[2]) if len(sys.argv) > 2 else 1   # (our own scratch pickle)
    out = {}
    for ch in sys.argv[1]:
        letter = CU.cut(affinity.scale(L[ch], .86, .86, origin=(A / 2, .5)))
        B = Vine(letter, seed); B.main_stems(4); B.foliage(); B.tendrils_fill()
        ink = B.ink(); out[ch] = ink
        print(ch, seed, 'white %.3f stems %d ends %d' % (B.frac(), len(B.stems), B.ends), flush=True)
        Image.fromarray(255 - raster_ink(ink)).save(f'out7/v3-{ch}-{seed}.png')
    pickle.dump(out, open(f'v3_{sys.argv[1]}_{seed}.pkl', 'wb'))
