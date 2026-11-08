# knet: the stems as a planned network (step 9). The ground round the letter (kept a channel's width off it) has a medial
# axis; split at its junctions into branches, the longest few (the top band given its share) become his scroll: smoothed,
# thickened to the room (his .03-.05), swelling where they fork, their free ends curling. Then kcarve's leaves are carved
# into the rooms between, tendrils and dots as before.
import numpy as np, math, pickle, sys, json
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from skimage.morphology import skeletonize
from shapely import affinity
sys.path.insert(0, '.')
import kvine2 as K2, kcarve as KC
from kvine import A, FR
RES, W = KC.RES, KC.W

def graph(sk):
    """skeleton -> list of pixel paths between junctions/ends"""
    nb = nd.convolve(sk.astype(int), np.ones((3, 3), int), mode='constant') - sk
    node = sk & (nb != 2); seen = np.zeros_like(sk); paths = []
    def nbrs(p):
        y, x = p
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if (dy or dx) and 0 <= y + dy < sk.shape[0] and 0 <= x + dx < sk.shape[1] and sk[y + dy, x + dx]: yield (y + dy, x + dx)
    for st in map(tuple, np.argwhere(node)):
        for n0 in nbrs(st):
            if seen[n0] and not node[n0]: continue
            path = [st, n0]; prev = st; cur = n0
            while not node[cur]:
                seen[cur] = True; nxt = [q for q in nbrs(cur) if q != prev and q not in path[-3:]]
                if not nxt: break
                prev, cur = cur, nxt[0]; path.append(cur)
            if len(path) > 3: paths.append(np.array(path))
    # dedupe (each path found from both ends)
    uniq = {};
    for p in paths:
        key = tuple(sorted([tuple(p[0]), tuple(p[-1])])) + (len(p),)
        uniq[key] = p
    return list(uniq.values())

class Net(KC.Carve):
    def network(s, n=6, wmax=.05, wmin=.024):
        Lm = KC.mask([s.letter]); fr = s.frame
        ground = ~(Lm | fr); clear = nd.distance_transform_edt(ground) / RES
        g2 = clear > .03                                  # (stems a channel off the letter and frame)
        sk = skeletonize(g2)
        for _ in range(int(.04 * RES)):                   # spurs off
            nb = nd.convolve(sk.astype(int), np.ones((3, 3), int), mode='constant') - sk; sk &= ~((nb <= 1) & sk)
        paths = graph(sk)
        cand = []
        for p in paths:
            P = p[:, ::-1].astype(float) / RES
            L = np.hypot(*np.diff(P, axis=0).T).sum()
            if L < .12: continue
            top = (P[:, 1] < .3).mean()
            cand.append((L * (1 + .8 * top), P))
        cand.sort(key=lambda z: -z[0]); s.net_paths = []
        for _, P in cand[:n * 2]:
            if len(s.net_paths) >= n: break
            P = np.asarray(P); P = KC.nd.gaussian_filter1d(P, 6, axis=0, mode='nearest')
            Q, ang = K2.resample(P) if hasattr(K2, 'resample') else KC.K2.resample(P)
            if len(Q) < 20: continue
            # thickness from the room it runs in, tapering to its ends
            c = np.array([clear[min(RES - 1, int(y * RES)), min(W - 1, int(x * RES))] for x, y in Q])
            t = np.linspace(0, 1, len(Q)); taper = np.minimum(1, np.minimum(t, 1 - t) / .2) ** .5
            w = np.clip(c * .75, wmin, wmax) * (.55 + .45 * taper)
            s.net_paths.append((Q, ang, w))
        # draw: bands of varying width; forks swell where paths meet
        s.net_geoms = []
        ends = []
        for Q, ang, w in s.net_paths:
            d = np.gradient(Q, axis=0); d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-12; nv = np.stack([-d[:, 1], d[:, 0]], 1)
            from shapely.geometry import Polygon, Point
            g = Polygon(np.vstack([Q + nv * w[:, None] / 2, (Q - nv * w[:, None] / 2)[::-1]])).buffer(0)
            s.net_geoms.append(g); s.bands.append((Q, ang, float(w.max()), float(w.min()), 'stem'))
            ends += [(Q[0], ang[0] + math.pi, w[0]), (Q[-1], ang[-1], w[-1])]
        # forks: an end that meets another path swells into it; a free end curls
        from shapely.geometry import Point
        allg = s.net_geoms
        for p, a, w in ends:
            hit = sum(1 for g in allg if g.distance(Point(p)) < .02) > 1
            if hit: s.forks = getattr(s, 'forks', []) + [Point(p).buffer(w * 1.1, quad_segs=12)]
            else:
                sg = s.rng.choice([-1, 1]); C, ca = K2.spiral(p, a, .12, sg * 8, sg * 30, n=40)
                cc = np.array([clear[min(RES - 1, int(y * RES)), min(W - 1, int(x * RES))] for x, y in C[4:]])
                if (cc > w * .5 + .012).all(): s.bands.append((C, ca, w, .006, 'branch'))
        s.forks = getattr(s, 'forks', []) + s.net_geoms

if __name__ == '__main__':
    import cuts as CU
    Lt = pickle.load(open('glm26.pkl', 'rb')); seed = int(sys.argv[2]) if len(sys.argv) > 2 else 1   # (our own scratch pickle)
    scale = float(sys.argv[3]) if len(sys.argv) > 3 else .78; out = sys.argv[4] if len(sys.argv) > 4 else 'out9'
    for ch in sys.argv[1]:
        g = affinity.scale(Lt[ch], scale, scale, origin=(A / 2, .5)).buffer(-.005, join_style='round')   # smaller, a touch lighter
        letter = CU.cut(g)
        C = Net(letter, seed); C.forks = []; C.network(6)
        C.leaves(); C.ends(); C.flowers(2)
        w = C.carve(.42); w = C.tendrils(60)
        print(ch, seed, scale, 'white %.3f stems %d spines %d' % (w[45:-45, 45:-45].mean(), len(C.net_paths), len(C.spines)), flush=True)
        np.save(f'{out}/c-{ch}-{seed}.npy', w)
        Image.fromarray((w * 255).astype(np.uint8)).save(f'{out}/c-{ch}-{seed}.png')
        polys = KC.smooth_vec(w); json.dump({'name': 'c' + ch, 'a': A, 'polys': polys}, open(f'{out}/c-{ch}-{seed}.json', 'w'))
