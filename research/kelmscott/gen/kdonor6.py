# kdonor3 (step 12): his vine as the STARTING composition, varied per seed so each block is new in his grammar:
#   - mirrored or not (his compositions read either way), and bent by a smooth field within his curvature (~.015 of the block)
#   - his stems carried on across the room his letter left (straight on along their tangent, at their own width) and
#     behind our strokes (cut by our letter's channel, as his pass behind his)
#   - a share of his terminals re-grown: the leaf/bud head at a stem's end cleared and one of ours drawn there (a leaf
#     with lobes and veins, a bud, or a tulip) along the stem's last direction
#   - tendrils into the black that is left; refitted as smooth curves
import numpy as np, math, pickle, sys, json
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from skimage.morphology import skeletonize
from shapely import affinity
sys.path.insert(0, '.')
import kcarve as KC, kdonor as KD, kleaf as KL
from knet import graph
from kvine import A, FR
RES, W = KC.RES, KC.W

def warp(c, ob, rng, mirror, H=700):
    ink = KD.MB[c + '_ink']; let = KD.MB[c + '_let']; m = int(.04 * H)
    vine = (~ink & ~nd.binary_dilation(let, iterations=2)).astype(float); vine[:m] = vine[-m:] = 0; vine[:, :m] = vine[:, -m:] = 0
    letf = let.astype(float)
    if mirror: vine = vine[:, ::-1].copy(); letf = letf[:, ::-1].copy()
    ys, xs = np.nonzero(letf > .5); hb = (xs.min() / H, ys.min() / H, xs.max() / H, ys.max() / H)
    sx, sy = (ob[2] - ob[0]) / (hb[2] - hb[0]), (ob[3] - ob[1]) / (hb[3] - hb[1])
    yy, xx = np.mgrid[0:RES, 0:W] / RES
    # a smooth bend: two low-frequency fields, amplitude ~.015
    fx = nd.gaussian_filter(rng.normal(size=(RES // 8, W // 8)), 30) ; fy = nd.gaussian_filter(rng.normal(size=(RES // 8, W // 8)), 30)
    fx = np.kron(fx / (np.abs(fx).max() + 1e-9), np.ones((8, 8)))[:RES, :W] * .015; fy = np.kron(fy / (np.abs(fy).max() + 1e-9), np.ones((8, 8)))[:RES, :W] * .015
    fx = np.pad(fx, ((0, RES - fx.shape[0]), (0, W - fx.shape[1])), mode='edge'); fy = np.pad(fy, ((0, RES - fy.shape[0]), (0, W - fy.shape[1])), mode='edge')
    px = (xx + fx - .5 * (ob[0] - hb[0] * sx)) / (.5 + .5 * sx); py = (yy + fy - .5 * (ob[1] - hb[1] * sy)) / (.5 + .5 * sy)
    v = nd.map_coordinates(nd.gaussian_filter(vine, 1.2), [py * H, px * H], order=1, cval=0) > .5
    l = nd.map_coordinates(letf, [py * H, px * H], order=1, cval=0) > .5
    return v, l

def build(ch, don, seed, scale=.86, out='out15'):
    import cuts as CU
    rng = np.random.default_rng(seed)
    Lt = pickle.load(open('glm26.pkl', 'rb'))   # (our own scratch pickle)
    letter = CU.cut(affinity.scale(Lt[ch], scale, scale, origin=(A / 2, .5)).buffer(-.004, join_style='round'))
    mirror = bool(rng.random() < .5) if ch not in 'L' else False
    vine, hisl = warp(don, letter.bounds, rng, mirror)
    Lm = KC.mask([letter]); frame = np.ones((RES, W), bool); b = int((FR + .008) * RES); frame[b:-b, b:-b] = False
    near_letter = nd.distance_transform_edt(~Lm) / RES < KC.CHL
    # his stems carried across the room his letter left: each skeleton end on his letter's edge goes straight on
    sk = skeletonize(vine & ~near_letter); dt = nd.distance_transform_edt(vine)
    nb = nd.convolve(sk.astype(int), np.ones((3, 3), int), mode='constant') - sk; ends = np.argwhere(sk & (nb == 1))
    hisl_d = nd.binary_dilation(hisl, iterations=int(.02 * RES))
    im = Image.new('L', (W, RES), 0); d = ImageDraw.Draw(im)
    for y, x in ends:
        if not hisl_d[y, x]: continue
        # its direction: from 12 px back along the skeleton
        ys, xs = np.nonzero(sk[max(0, y - 14):y + 15, max(0, x - 14):x + 15]);
        if len(xs) < 4: continue
        cy, cx = ys.mean() + max(0, y - 14), xs.mean() + max(0, x - 14); u = np.array([x - cx, y - cy]); u /= np.hypot(*u) + 1e-9
        wpx = int(dt[y, x] * 2)
        if wpx < .018 * RES: continue   # (only his real stems are carried; thin shoots end where they ended)
        p = np.array([x, y], float); pts = [tuple(p)]
        bend = rng.uniform(-.012, .012)
        for k in range(int(.16 * RES / 3)):
            ca, sa = math.cos(bend), math.sin(bend); u = np.array([u[0] * ca - u[1] * sa, u[0] * sa + u[1] * ca]); p = p + u * 3; i, j = int(p[0]), int(p[1])
            if not (0 <= j < RES and 0 <= i < W) or frame[j, i]: break
            pts.append(tuple(p))
            if k > 10 and vine[j, i] and not hisl_d[j, i]: break   # it reaches his vine again
        if len(pts) > 6: d.line(pts, fill=255, width=wpx, joint='curve')
    carried = np.asarray(im) > 127
    vine = vine | carried
    vine &= ~near_letter; vine = nd.binary_opening(vine, iterations=3) & ~near_letter
    # re-grow a share of his terminals: heads at skeleton ends
    sk = skeletonize(vine); nb = nd.convolve(sk.astype(int), np.ones((3, 3), int), mode='constant') - sk; dt = nd.distance_transform_edt(vine)
    ends = [tuple(p) for p in np.argwhere(sk & (nb == 1))]; rng.shuffle(ends); new = []
    for y, x in ends[:max(1, len(ends) // 3)]:
        r = dt[y, x]
        if r < .008 * RES: continue
        ys, xs = np.nonzero(sk[max(0, y - 20):y + 21, max(0, x - 20):x + 21])
        cy, cx = ys.mean() + max(0, y - 20), xs.mean() + max(0, x - 20); a = math.atan2(y - cy, x - cx)
        p = np.array([x, y]) / RES
        clearr = r * 2.2 / RES; yy, xx = np.ogrid[:RES, :W]
        hole = (xx - x) ** 2 + (yy - y) ** 2 < (clearr * RES) ** 2
        kind = rng.choice(['leaf', 'leaf', 'bud', 'tulip'])
        base = p - np.array([math.cos(a), math.sin(a)]) * clearr * .6
        if kind == 'tulip': g, c, _, _ = KL.tulip(base, a, clearr * 2.6)
        elif kind == 'bud': g = KL.blade(KL.spine(base, a, clearr * 1.8, 0, 0)[0], clearr * 1.3, 0, kind='petal'); c = None
        else:
            g, c, _, _ = KL.leaf(base, a + rng.uniform(-.3, .3), clearr * 2.8, k=rng.uniform(-3, 3), lobes=int(rng.choice([0, 2, 3])), depth=.5, curl=rng.uniform(-4, 4))
        gm = KC.mask([g]); free = ~(vine & ~hole) & ~Lm & ~frame
        room = nd.distance_transform_edt(free) / RES
        if (gm & ~(room > KC.CH * .6)).sum() > gm.sum() * .08: continue
        vine &= ~hole; vine |= gm & (room > KC.CH * .6)
        if c is not None: vine &= ~(KC.mask([c]) & nd.binary_erosion(gm, iterations=4))
        new.append(kind)
    # fewer, bolder shapes: fragments rejoin their stems (a small closing), slivers go, the white a touch fuller
    vine = nd.binary_closing(vine, iterations=5) & ~near_letter
    lab, n = nd.label(vine); sz = nd.sum(vine, lab, range(1, n + 1))
    keep = np.zeros(n + 1, bool); keep[1:] = sz >= .0011 * RES * RES
    for i in np.nonzero(sz < .0011 * RES * RES)[0]:   # (his dots stay: small and round)
        ys, xs = np.nonzero(lab[max(0,0):] == i + 1) if False else (None, None)
    small = (lab > 0) & ~keep[lab]
    dots = small & (nd.distance_transform_edt(small) / RES > .004)
    dots = nd.binary_dilation(dots, iterations=3) & small
    vine = (vine & keep[lab]) | dots
    vine = nd.binary_dilation(vine, iterations=3) & ~near_letter
    # coherence: every piece must belong to the growth. A piece is kept if it is big (a main scroll), or rooted: it
    # touches the letter's channel (a stem coming from behind the letter), the block's edge (rising from the foot or a
    # side), or is one of his round dots. Orphans and slivers go.
    lab, n = nd.label(vine); sz = nd.sum(vine, lab, range(1, n + 1))
    root_zone = (nd.distance_transform_edt(~Lm) / RES < KC.CHL + .006) | (nd.distance_transform_edt(~frame) / RES < .02)
    rooted = np.zeros(n + 1, bool); rooted[np.unique(lab[root_zone & vine])] = True
    dt_ = nd.distance_transform_edt(vine) / RES
    keepc = np.zeros(n + 1, bool)
    for i in range(1, n + 1):
        a = sz[i - 1] / RES / RES
        if a > .012 or rooted[i]: keepc[i] = True
        elif a < .0004:   # a dot if round: its area near that of the largest disc it holds
            r = dt_[lab == i].max(); keepc[i] = math.pi * r * r > .55 * a
    vine &= keepc[lab]
    w = (vine | Lm) & ~frame
    # (no tendrils: rooted on his network's centre-lines, they curled out of pieces the coherence pass had removed)
    tag = f'{ch}-{don}-{seed}'
    print(tag, 'mirror' if mirror else '', 'white %.3f regrown %d' % (w[45:-45, 45:-45].mean(), len(new)), flush=True)
    Image.fromarray((w * 255).astype(np.uint8)).save(f'{out}/c-{tag}.png')
    json.dump({'name': f'{ch}{don}{seed}', 'a': A, 'polys': KC.smooth_vec(w)}, open(f'{out}/c-{tag}.json', 'w'))

if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2], int(sys.argv[3]))
