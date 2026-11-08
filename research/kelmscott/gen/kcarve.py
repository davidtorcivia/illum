# kcarve: the block as a woodcutter makes it. The ground starts white; a network of curves is designed (main stems that
# sweep behind/through the letter, branches, leaf spines leaving tangentially and bending with the growth, tendril
# curls); then the black is CUT: a channel round the letter, round each stem, and between the rooms the ground divides
# into (each leaf owns the ground nearest its spine, within its leaf envelope). So every leaf is the white left between
# cuts and takes the shape of its room. Lobes are scallop cuts, midribs and veins fine cuts, dots only where the black
# pools. Computed on a fine raster, refitted to smooth vector (potrace) at the end.
import numpy as np, math, pickle, sys
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from shapely import affinity
sys.path.insert(0, '.')
import kvine2 as K2
from kvine import A, FR
RES = 1000; W = int(RES * A)
CH = .016    # his narrow channel (the black between white shapes), units of the block
CHL = .020   # round the letter

def draw_poly(d, g, v):
    for p in getattr(g, 'geoms', [g]):
        if p.is_empty: continue
        d.polygon([(x * RES, y * RES) for x, y in p.exterior.coords], fill=v)
        for r in p.interiors: d.polygon([(x * RES, y * RES) for x, y in r.coords], fill=0 if v else 255)

def mask(geoms):
    im = Image.new('L', (W, RES), 0); d = ImageDraw.Draw(im)
    for g in geoms: draw_poly(d, g, 255)
    return np.asarray(im) > 127

def profile(t):
    return np.sin(np.clip(t, 0, 1) ** .7 * math.pi) ** 1.0 * (1 - .2 * t)

class Carve:
    def __init__(s, letter, seed):
        s.rng = np.random.default_rng(seed); s.letter = letter
        s.B = K2.Block(letter, seed)     # (its main stems: S-sweeps through and behind the letter)
        s.frame = np.ones((RES, W), bool); b = int((FR + .008) * RES); s.frame[b:-b, b:-b] = False
        s.spines = []   # (P, angs, Lenv) leaf spines: P points, envelope half-width at t = Lenv * profile
        s.bands = []    # (P, w0, w1) stems/branches/tendrils drawn as white bands

    def stems(s, n=4):
        s.forks = []
        s.B.main_stems(n)
        for P, ang, w0, w1 in s.B.stems: s.bands.append((P, ang, .05, .026, 'stem'))   # his scroll: thick, tapering

    def obstacles(s, extra=()):
        L = mask([s.letter]); S = mask([K2.band(P, w0, w1) for P, a, w0, w1, k in s.bands])
        sp = np.zeros_like(L)
        if s.spines:
            im = Image.new('L', (W, RES), 0); d = ImageDraw.Draw(im)
            for P, a, Le in s.spines: d.line([(x * RES, y * RES) for x, y in P], fill=255, width=3)
            sp = np.asarray(im) > 127
        return L, S, sp

    def grow_spine(s, p, a, side, Lmax, clear, kbend):
        """a leaf spine: leaves at angle a, bending back with the growth (curvature kbend), steering away from what is near"""
        pts = [np.array(p, float)]; angs = [a]; step = .004
        for i in range(int(Lmax / step)):
            best = None
            for dev in (0, .1, -.1, .2, -.2, .32, -.32):
                aa = angs[-1] + kbend * step + dev; q = pts[-1] + step * np.array([math.cos(aa), math.sin(aa)])
                c = clear(q)
                if c < (.022 if i > 3 else 0): continue
                score = -abs(dev) + min(c, .08) * 2
                if best is None or score > best[0]: best = (score, aa, q)
            if best is None: break
            pts.append(best[2]); angs.append(best[1])
        return np.array(pts), np.array(angs)

    def leaves(s, every=.12, only=None):
        """spines along every stem and branch, alternately each side, leaving at ~1 rad and bending back with the growth;
        each takes as much room as it can (up to .22 long)"""
        L, S, _ = s.obstacles()
        base = L | s.frame
        for P, ang, w0, w1, kind in (only if only is not None else list(s.bands)):
            if kind == 'tendril': continue
            n = len(P); side = s.rng.choice([-1, 1]); j = int(n * .06); step_j = max(4, int(every / .004))
            while j < n - 10:
                side = -side; t = j / n
                if s.letter.buffer(.02).contains(K2.Point(P[j])): j += 3; continue
                _, _, sp = s.obstacles()
                obst = base | S | sp
                # the stem it leaves is not in its way where it leaves
                own = mask([K2.band(P[max(0, j - 22):j + 23], w0 * 1.4, w0 * 1.4)])
                F = nd.distance_transform_edt(~(obst & ~own)) / RES
                def clear(q):
                    i_, k_ = int(q[0] * RES), int(q[1] * RES)
                    return F[k_, i_] if 0 <= k_ < RES and 0 <= i_ < W else 0.
                w = w0 + (w1 - w0) * t; p = P[j] + np.array([-math.sin(ang[j]), math.cos(ang[j])]) * side * w * .5
                a = ang[j] + side * s.rng.uniform(.8, 1.15); kb = -side * s.rng.uniform(4, 8)
                Q, qa = s.grow_spine(p, a, side, s.rng.uniform(.14, .20) * (1.1 - .4 * t), clear, kb)
                Lq = len(Q) * .004
                if Lq >= .05:
                    s.spines.append((Q, qa, Lq)); j += step_j
                else: j += 3

    def branches(s, k=2):
        """a few thinner branches off the stems, curling: more structure for leaves to hang from"""
        L, S, sp = s.obstacles(); F = nd.distance_transform_edt(~(L | S | s.frame)) / RES
        def clear(q):
            i_, k_ = int(q[0] * RES), int(q[1] * RES)
            return F[k_, i_] if 0 <= k_ < RES and 0 <= i_ < W else 0.
        for P, ang, w0, w1, kind in list(s.bands):
            if kind != 'stem': continue
            for _ in range(k):
                j = int(len(P) * s.rng.uniform(.2, .7))
                if s.letter.buffer(.03).contains(K2.Point(P[j])): continue
                side = s.rng.choice([-1, 1]); a = ang[j] + side * .5
                Q, qa = K2.spiral(P[j], a, s.rng.uniform(.25, .4), side * 1.5, side * 12, n=90)
                c = np.array([clear(q) for q in Q[10:]])
                if (c > .024).all():
                    s.bands.append((Q, qa, .034, .012, 'branch')); s.forks.append(K2.band(Q[:10], .06, .034))

    def covered(s):
        L, S, _ = s.obstacles(); env = mask([K2.band(P, Le * .45, Le * .2) for P, a, Le in s.spines]) if s.spines else np.zeros_like(L)
        return L | S | env | s.frame

    def field(s):
        L, S, sp = s.obstacles(); T = mask([g for g, _ in getattr(s, 'fixed', [])]) if getattr(s, 'fixed', None) else np.zeros_like(L)
        return nd.distance_transform_edt(~(L | S | s.frame | T)) / RES

    def steer(s, p0, a0, Lmax, side, F, target=None, need=.022, w=.016):
        """a branch grown, not tested: each step the gentlest turn that keeps it clear, its own bend an S that closes
        in a curl, drawn toward a target while it is far"""
        pts = [np.array(p0, float)]; angs = [a0]; step = .004; n = int(Lmax / step)
        for i in range(n):
            t = i / n; k = side * (8 if t < .4 else -9) + (-side * 26 * max(0, t - .7) / .3)   # (always turning: no straight run)
            want = angs[-1] + k * step
            best = None
            for dev in (0, .08, -.08, .16, -.16, .26, -.26, .4, -.4):
                aa = want + dev; q = pts[-1] + step * np.array([math.cos(aa), math.sin(aa)])
                i_, j_ = int(q[0] * RES), int(q[1] * RES)
                c = F[j_, i_] if 0 <= j_ < RES and 0 <= i_ < W else 0
                if c < (need if i > 5 else 0): continue
                best = (aa, q); break
            if best is None: break
            angs.append(best[0]); pts.append(best[1])
        return np.array(pts), np.array(angs)

    def cover(s, rounds=40):
        """every region gets a shape: into the largest bare black, a branch grown (steered) from the nearest stem, or
        rising from the block's foot or edge, with leaves along it"""
        from shapely.geometry import Point as Pt
        bad = np.zeros((RES, W), bool); s.foot = 0
        for _ in range(rounds):
            cov = s.covered() | bad; cl = nd.distance_transform_edt(~cov) / RES
            j, i = np.unravel_index(np.argmax(cl), cl.shape); c = cl[j, i]; q = np.array([i, j]) / RES
            if c < .04: break
            F = s.field(); srcs = []
            for P, ang, w0, w1, kind in s.bands:
                if kind == 'tendril': continue
                d = np.hypot(*(P - q).T); k = int(np.argmin(d))
                if not s.letter.buffer(.03).contains(Pt(P[k])): srcs.append((d[k], P[k], ang[k], max(.013, w0 * .55)))
            m = FR + .02
            for e in ((np.array([q[0], 1 - m]),) if s.foot < 3 else ()):   # from the foot, at most three (his vine rises from it)
                srcs.append((np.hypot(*(e - q)) * 1.15, e, math.atan2(q[1] - e[1], q[0] - e[0]), .02))
            srcs.sort(key=lambda z: z[0]); made = False
            for d0, p0, a_s, w in srcs[:4]:
                side = s.rng.choice([-1, 1]); a0 = math.atan2(q[1] - p0[1], q[0] - p0[0])
                Q, qa = s.steer(p0, a0 + side * s.rng.uniform(-.6, .2), s.rng.uniform(.28, .45), side, F, need=.02)
                if len(Q) * .004 > .09:
                    wb = .036 if d0 > .3 else .03
                    band = (Q, qa, wb, .010, 'branch'); s.bands.append(band); s.forks.append(K2.band(Q[:10], wb * 1.7, wb))
                    if p0[1] > 1 - FR - .03: s.foot += 1
                    if s.rng.random() < .5: s.leaves(only=[band])
                    made = True; break
            if not made: bad[max(0, j - 25):j + 25, max(0, i - 25):i + 25] = True

    def ends(s):
        """each branch's end: its curl (already), or a bud, or his flame-like tip"""
        import kleaf as KL
        s.fixed = getattr(s, 'fixed', [])
        for Q, qa, w0, w1, kind in s.bands:
            if kind != 'branch' or s.rng.random() < .4: continue
            p, a = Q[-1], qa[-1]
            if s.rng.random() < .5:   # a bud: a small swelling with a cut down its middle
                g = KL.blade(KL.spine(p, a, .055, 0, 0)[0], .042, 0, kind='petal'); c = KL.taper_line(KL.spine(p + np.array([math.cos(a), math.sin(a)]) * .012, a, .03, 0, 0)[0], .004, .0015)
            else:                     # a flame: a pointed lick curling back
                g = KL.blade(KL.spine(p, a, .07, 0, (1 if s.rng.random() < .5 else -1) * 30)[0], .03, .3, kind='leaf'); c = None
            M = mask([g]); F = s.field()
            if (F[M] > .008).all(): s.fixed.append((g, c))

    def flowers(s, n=2):
        """his tulip at a few prominent ends: the ends of the longest branches with room"""
        import kleaf as KL
        from shapely.geometry import Point as Pt
        s.fixed = getattr(s, 'fixed', [])
        br = sorted([b for b in s.bands if b[4] == 'branch'], key=lambda b: -len(b[0]))
        for Q, qa, w0, w1, kind in br:
            if len(s.fixed) >= n: break
            for L in (.14, .12, .10):
                g, c, _, _ = KL.tulip(Q[-1], qa[-1], L)
                M = mask([g]); F = s.field()
                if (F[M] > .006).all() and not (M & s.frame).any():
                    s.fixed.append((g, c)); break

    def carve(s, envk=.30):
        """the cut: everything white, then the black channels"""
        Lm = mask([s.letter]); Sm = mask([K2.band(P, w0, w1) for P, a, w0, w1, k in s.bands] + [g for g, _ in getattr(s, 'fixed', [])] + getattr(s, 'forks', []))
        Sm_vis = Sm & ~nd.binary_dilation(Lm, iterations=int(CHL * RES))      # stems pass behind the letter
        # rooms, curved: each spine claims the ground by its own leaf outline (distance over its envelope there), so the
        # cut between two leaves follows their edges
        best = np.full((RES, W), np.inf, np.float32); owner = np.zeros((RES, W), np.int32)
        for k, (P, a, Le) in enumerate(s.spines):
            if Le <= 0: continue
            im = Image.new('L', (W, RES), 0); ImageDraw.Draw(im).line([(x * RES, y * RES) for x, y in P], fill=255, width=2)
            m = np.asarray(im) > 127; ys, xs = np.nonzero(m)
            if not len(xs): continue
            # its box only (a leaf can't reach far): the distance field on a window round it
            x0, x1 = max(0, xs.min() - int(Le * RES * .5)), min(W, xs.max() + int(Le * RES * .5)); y0, y1 = max(0, ys.min() - int(Le * RES * .5)), min(RES, ys.max() + int(Le * RES * .5))
            sub = ~m[y0:y1, x0:x1]; dd, (iy, ix) = nd.distance_transform_edt(sub, return_indices=True)
            ny, nx = iy + y0, ix + x0; q = np.stack([nx, ny], -1).reshape(-1, 2) / RES
            dP = np.hypot(*(P[None, :, :] - np.unique(q, axis=0)[:, None, :]).transpose(2, 0, 1))
            uq, inv = np.unique(q, axis=0, return_inverse=True); ti = (np.argmin(np.hypot(*(P[None, :, :] - uq[:, None, :]).transpose(2, 0, 1)), 1) / max(1, len(P) - 1))[inv].reshape(dd.shape)
            env = Le * envk * profile(ti) * (1 - .45 * ((.5 + .5 * np.cos(2 * math.pi * 2.5 * (ti - .15))) ** 3) * (ti > .18) * (ti < .9)) + 1e-4
            r = (dd / RES / env).astype(np.float32)
            win = best[y0:y1, x0:x1]; better = r < win; win[better] = r[better]; owner[y0:y1, x0:x1][better] = k + 1
        leafw = best <= 1
        # channels between rooms of different owners, and round letter/stems/frame
        own2 = np.where(leafw, owner, 0); bnd = np.zeros_like(owner, bool); bnd[:, 1:] |= (own2[:, 1:] != own2[:, :-1]) & (own2[:, 1:] > 0) & (own2[:, :-1] > 0); bnd[1:, :] |= (own2[1:, :] != own2[:-1, :]) & (own2[1:, :] > 0) & (own2[:-1, :] > 0)
        ch = nd.distance_transform_edt(~bnd) / RES < CH / 2
        keep_off = (nd.distance_transform_edt(~(Lm)) / RES < CHL) | (nd.distance_transform_edt(~Sm_vis) / RES < CH) & ~Sm_vis | (nd.distance_transform_edt(~s.frame) / RES < CH)
        leafw &= ~ch & ~keep_off
        # midribs and veins: fine cuts
        cut = np.zeros_like(leafw); imc = Image.new('L', (W, RES), 0); dc = ImageDraw.Draw(imc)
        for P, a, Le in s.spines:
            if Le <= 0: continue
            n = len(P); i0, i1 = int(n * .12), int(n * .8)
            for i in range(i0, i1 - 1):
                wpx = max(1, int((Le * .028 * (1 - (i - i0) / (i1 - i0)) + .002) * RES))
                dc.line([tuple(P[i] * RES), tuple(P[i + 1] * RES)], fill=255, width=wpx)
            for f, sg in ((.35, 1), (.5, -1), (.62, 1)):
                i = int(n * f); u = np.array([math.cos(a[i] + sg * .8), math.sin(a[i] + sg * .8)])
                dc.line([tuple(P[i] * RES), tuple((P[i] + u * Le * .14) * RES)], fill=255, width=max(1, int(.003 * RES)))
        cut = np.asarray(imc) > 127
        white = (Lm | Sm_vis | leafw) & ~s.frame
        white &= ~(cut & nd.binary_erosion(leafw, iterations=int(.006 * RES)))
        # dots where the black pools
        ink = ~white
        cl = nd.distance_transform_edt(ink & ~s.frame) / RES
        dots = np.zeros_like(white); yy, xx = np.ogrid[:RES, :W]
        for _ in range(60):
            j, i = np.unravel_index(np.argmax(cl), cl.shape); c = cl[j, i]
            if c < .042: break
            r = .008; dots |= (xx - i) ** 2 + (yy - j) ** 2 < (r * RES) ** 2
            cl[max(0, j - int(c * RES * 1.4)):j + int(c * RES * 1.4), max(0, i - int(c * RES * 1.4)):i + int(c * RES * 1.4)] = 0
        white |= dots
        if getattr(s, 'fixed', None):
            fc = mask([c for _, c in s.fixed if c is not None]); white &= ~fc
        s.white = white; return white

    def tendrils(s, n=40):
        """thin curling shoots into the small black left, each with its own channel cut round it"""
        w = s.white
        for _ in range(n):
            ink = ~w & ~s.frame; cl = nd.distance_transform_edt(ink) / RES
            j, i = np.unravel_index(np.argmax(cl), cl.shape); c = cl[j, i]; q = np.array([i, j]) / RES
            if c < .024: break
            # nearest band (stem/branch) point not behind the letter
            best = None
            for P, ang, w0, w1, kind in s.bands:
                d = np.hypot(*(P - q).T); k = int(np.argmin(d))
                if s.letter.buffer(.03).contains(K2.Point(P[k])): continue
                if best is None or d[k] < best[0]: best = (d[k], P, ang, k)
            if best is None or best[0] > c + .2: w[max(0, j - 8):j + 8, max(0, i - 8):i + 8] |= False; cl[j, i] = 0; break
            _, P, ang, k = best
            Fb = nd.distance_transform_edt(~(w | s.frame)) / RES
            side = s.rng.choice([-1, 1]); a0 = math.atan2(q[1] - P[k][1], q[0] - P[k][0])
            pts = [P[k]]; a = a0; L = min(.11, best[0] + c * 1.2)
            for st in range(int(L / .003)):
                t = st / max(1, int(L / .003)); a += side * (9 + 50 * t ** 2) * .003
                qq = pts[-1] + .003 * np.array([math.cos(a), math.sin(a)]); ii, jj = int(qq[0] * RES), int(qq[1] * RES)
                if not (0 <= jj < RES and 0 <= ii < W): break
                if st > 8 and Fb[jj, ii] < .014: break
                pts.append(qq)
            if len(pts) < 12: Fb[j, i] = 0; w[j, i] = True; continue
            T = np.array(pts); tm = mask([K2.band(T, .011, .004)])
            ring = (nd.distance_transform_edt(~tm) / RES < CH * .7) & ~tm
            w = (w & ~ring) | tm
        s.white = w; return w

def smooth_vec(white):
    """the cut refitted as smooth curves (the knife's line), back to a raster for showing; the polygons for kfont"""
    import potrace
    from shapely.geometry import Polygon
    big = nd.gaussian_filter(white.astype(float), 1.2) > .5
    def P_(q): return (q.x, q.y) if hasattr(q, 'x') else tuple(q)
    paths = potrace.Bitmap(big).trace(turdsize=6, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.1, opticurve=True, opttolerance=1.0)
    polys = []
    for c in paths:
        pts = [P_(c.start_point)]
        for sg in c.segments:
            if sg.is_corner: pts += [P_(sg.c), P_(sg.end_point)]
            else:
                p0 = np.array(pts[-1]); a, b, e = (np.array(P_(q)) for q in (sg.c1, sg.c2, sg.end_point))
                pts += [tuple((1-t)**3*p0 + 3*(1-t)**2*t*a + 3*(1-t)*t**2*b + t**3*e) for t in np.linspace(0, 1, 8)[1:]]
        polys.append([[round(x / RES, 5), round(y / RES, 5)] for x, y in pts])
    return polys

if __name__ == '__main__':
    import cuts as CU, json
    Lt = pickle.load(open('glm26.pkl', 'rb')); seed = int(sys.argv[2]) if len(sys.argv) > 2 else 1   # (our own scratch pickle)
    for ch in sys.argv[1]:
        letter = CU.cut(affinity.scale(Lt[ch], .86, .86, origin=(A / 2, .5)))
        C = Carve(letter, seed); C.stems(5); C.branches(3); C.leaves(); C.cover(); C.flowers(2); C.ends()
        w = C.carve(.42); w = C.tendrils(60)
        inner = w[45:-45, 45:-45]
        print(ch, seed, 'white %.3f spines %d bands %d' % (inner.mean(), len(C.spines), len(C.bands)), flush=True)
        Image.fromarray(((~w) * 0 + w * 255).astype(np.uint8)).save(f'out8/c-{ch}-{seed}.png')
        np.save(f'out8/c-{ch}-{seed}.npy', w)
        polys = smooth_vec(w)
        json.dump({'name': 'c' + ch, 'a': A, 'polys': polys}, open(f'out8/c-{ch}-{seed}.json', 'w'))
        im = Image.new('L', (W * 2, RES * 2), 0); d = ImageDraw.Draw(im)
        for p in polys:
            if len(p) > 2: d.polygon([(x * RES * 2, y * RES * 2) for x, y in p], fill=255, outline=None)
        # (even-odd: potrace gives outer and hole contours; draw holes by XOR)
        acc = np.zeros((RES * 2, W * 2), bool)
        for p in polys:
            if len(p) < 3: continue
            l = Image.new('1', (W * 2, RES * 2), 0); ImageDraw.Draw(l).polygon([(x * RES * 2, y * RES * 2) for x, y in p], fill=1); acc ^= np.asarray(l)
        Image.fromarray((acc * 255).astype(np.uint8)).resize((W, RES), Image.LANCZOS).save(f'out8/cs-{ch}-{seed}.png')
