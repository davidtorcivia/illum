# the ten, fixed (E fuller and joined, G with his curl, D clean), and his 16 refitted, all as smooth vector; pickle -> set26.pkl
import numpy as np, pickle, sys, math
from shapely.geometry import Polygon, box, Point, LineString
from shapely.ops import unary_union
from shapely import affinity
sys.path.insert(0, '.'); import two2six as T
A = .95
ten = pickle.load(open('ten.pkl', 'rb'))
def parts(g): return sorted(getattr(g, 'geoms', [g]), key=lambda p: -p.area)

def curl(p0, a0, length, w0, w1, k0, k1, n=120):
    """a stroke that turns ever tighter (curvature k0 -> k1 per unit length): his curls; tapering w0 -> w1, smooth"""
    pts = [np.array(p0, float)]; a = a0; ds = length / n
    for i in range(n):
        t = i / n; a += (k0 + (k1 - k0) * t ** 1.5) * ds; pts.append(pts[-1] + ds * np.array([math.cos(a), math.sin(a)]))
    P = np.array(pts); d = np.gradient(P, axis=0); d /= np.linalg.norm(d, axis=1, keepdims=True); nv = np.stack([-d[:, 1], d[:, 0]], 1)
    w = (w0 + (w1 - w0) * np.linspace(0, 1, len(P)) ** .8) / 2
    ring = np.vstack([P + nv * w[:, None], (P - nv * w[:, None])[::-1]])
    return Polygon(ring).buffer(0).union(Point(P[-1]).buffer(w[-1] * 1.05, quad_segs=16))

# E: the bowl fuller, the bar run into it (as his two-line E's)
bowl, bar = parts(ten['E'])
bowl = bowl.buffer(.012, join_style='round', quad_segs=16)
bb = bar.bounds; bar = affinity.scale(bar, 1, 1.2, origin=(bb[2], (bb[1] + bb[3]) / 2)); bb = bar.bounds
yc = (bb[1] + bb[3]) / 2; row = bowl.intersection(LineString([(0, yc), (bb[0], yc)]))
xl = max(q.bounds[2] for q in getattr(row, 'geoms', [row])) if not row.is_empty else bowl.bounds[0] + .1
join = Polygon([(xl - .03, bb[1] - .012), (bb[0] + .03, bb[1]), (bb[0] + .03, bb[3]), (xl - .03, bb[3] + .012)])
E = unary_union([bowl, bar, join])

# G: his two-line G's bowl, its lower end running on and curling up inside, as his two-line G does
gb = parts(ten['G'])[0]; c = np.array(gb.exterior.coords)
low = c[(c[:, 1] > .62)]; end = low[np.argmax(low[:, 0])]
G = unary_union([gb, curl(end + np.array([-.045, -.01]), math.radians(-100), .42, .085, .03, 4.5, 16)])

# D: the stub off the stem opened away (features under ~.03 wide); the stroke weights are far wider
V2 = pickle.load(open('two_vec.pkl', 'rb'))
O, K = V2['O'], V2['K']; bo, bk = O.bounds, K.bounds
stem = K.intersection(box(bk[0], bk[1], bk[0] + .25 * (bk[2] - bk[0]), bk[3]))
stem = stem.buffer(-6).buffer(6)   # (any root of the arm opened off: its stroke is ~90 px)
half = O.intersection(box((bo[0] + bo[2]) / 2 - .05 * (bo[2] - bo[0]), bo[1], bo[2], bo[3])); sb = stem.bounds
half = affinity.scale(half, 1, (sb[3] - sb[1]) / (bo[3] - bo[1]), origin=(bo[0], bo[1])); hb = half.bounds
half = affinity.translate(half, sb[2] - .03 * (bk[2] - bk[0]) - hb[0], sb[1] - hb[1])
D = T.six(unary_union([stem, half])).buffer(-.03, join_style='round').buffer(.03, join_style='round', quad_segs=16)
SET = dict(ten); SET.update(E=E, G=G, D=D)

# his 16, refitted as smooth vector (the same potrace settings), at his own place in the block
his = np.load('his16_done.npz')
for ch in his.files:
    m = his[ch]; g = T.vec(m); g = affinity.scale(g, 1 / 700, 1 / 700, origin=(0, 0))
    g = g.buffer(.035, join_style='round', quad_segs=16).buffer(-.035, join_style='round', quad_segs=16)   # his notches and the vine's bridges closed: a clean reference
    g = g.buffer(-.013, join_style='round', quad_segs=16).buffer(.013, join_style='round', quad_segs=16)  # stubs and flakes opened
    SET[ch] = g
pickle.dump(SET, open('set26.pkl', 'wb'))
print(sorted(SET))
