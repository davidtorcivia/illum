# kdonor (step 10): his composition, our fitting. The stem network of one of his blocks (skeleton of his vine white,
# pruned to stems and branches, with his widths) is mapped onto our letter (his letter's box onto ours), drawn behind our
# letter where it now passes under a stroke (as his do), then kcarve carves leaves into the rooms, tendrils and dots.
import numpy as np, math, pickle, sys, json
from PIL import Image
from scipy import ndimage as nd
from skimage.morphology import skeletonize
from shapely.geometry import Polygon, Point
from shapely import affinity
sys.path.insert(0, '.')
import kvine2 as K2, kcarve as KC
from knet import graph
from kvine import A, FR
RES, W = KC.RES, KC.W
MB = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz')

def donor_network(c, minw=.016, minlen=.05):
    ink = MB[c + '_ink']; let = MB[c + '_let']; H = 700
    m = int(.045 * H); inner = np.zeros_like(ink); inner[m:-m, m:-m] = True
    vine = ~ink & ~nd.binary_dilation(let, iterations=3) & inner
    vine = nd.binary_opening(vine, iterations=2)
    dt = nd.distance_transform_edt(vine); sk = skeletonize(vine)
    for _ in range(8):
        nb = nd.convolve(sk.astype(int), np.ones((3, 3), int), mode='constant') - sk; sk &= ~((nb <= 1) & sk)
    out = []
    for p in graph(sk):
        P = p[:, ::-1].astype(float) / H; w = 2 * dt[p[:, 0], p[:, 1]] / H
        L = np.hypot(*np.diff(P, axis=0).T).sum()
        if L < minlen or np.median(w) < minw: continue
        out.append((P, w))
    ys, xs = np.nonzero(let); box = (xs.min() / H, ys.min() / H, xs.max() / H, ys.max() / H)
    return out, box

class Donor(KC.Carve):
    def from_donor(s, c):
        net, hb = donor_network(c); ob = s.letter.bounds
        sx, sy = (ob[2] - ob[0]) / (hb[2] - hb[0]), (ob[3] - ob[1]) / (hb[3] - hb[1])
        # his letter's box onto ours, eased halfway toward the identity (his stems belong to the whole block, not only to the letter)
        f = lambda P: np.stack([.5 * P[:, 0] + .5 * (ob[0] + (P[:, 0] - hb[0]) * sx), .5 * P[:, 1] + .5 * (ob[1] + (P[:, 1] - hb[1]) * sy)], 1)
        s.forks = []; s.net_paths = []
        for P, w in net:
            Q = nd.gaussian_filter1d(f(P), 3, axis=0, mode='nearest'); w = nd.gaussian_filter1d(w, 3, mode='nearest')
            d = np.gradient(Q, axis=0); d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-12; nv = np.stack([-d[:, 1], d[:, 0]], 1)
            g = Polygon(np.vstack([Q + nv * w[:, None] / 2, (Q - nv * w[:, None] / 2)[::-1]])).buffer(0)
            g = g.union(Point(Q[0]).buffer(w[0] / 2, quad_segs=10)).union(Point(Q[-1]).buffer(w[-1] / 2, quad_segs=10))
            s.forks.append(g); ang = np.arctan2(d[:, 1], d[:, 0])
            s.bands.append((Q, ang, float(np.median(w)), float(np.median(w)) * .8, 'stem')); s.net_paths.append((Q, w))

if __name__ == '__main__':
    import cuts as CU
    Lt = pickle.load(open('glm26.pkl', 'rb')); ch, don = sys.argv[1], sys.argv[2]   # (our own scratch pickle)
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1; scale = float(sys.argv[4]) if len(sys.argv) > 4 else .78; out = 'out10'
    letter = CU.cut(affinity.scale(Lt[ch], scale, scale, origin=(A / 2, .5)).buffer(-.005, join_style='round'))
    C = Donor(letter, seed); C.from_donor(don); C.leaves(every=.09); C.ends(); C.flowers(2)
    w = C.carve(.42); w = C.tendrils(60)
    tag = f'{ch}-{don}-{seed}-{scale}'
    print(tag, 'white %.3f stems %d spines %d' % (w[45:-45, 45:-45].mean(), len(C.net_paths), len(C.spines)), flush=True)
    Image.fromarray((w * 255).astype(np.uint8)).save(f'{out}/c-{tag}.png')
    json.dump({'name': 'c' + ch, 'a': A, 'polys': KC.smooth_vec(w)}, open(f'{out}/c-{tag}.json', 'w'))
