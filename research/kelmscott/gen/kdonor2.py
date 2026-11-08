# kdonor2 (step 11): his whole vine as the composition (his stems at his weight, his leaves, buds, tulips, his open
# black and dots, his rounded fluid edges), fitted to our letter: mapped (his letter's box onto ours, eased halfway),
# cut away behind our letter with its channel; where his letter stood and ours does not, the gap is grown over by
# tendrils off his stems. Refitted as smooth curves.
import numpy as np, math, pickle, sys, json
from PIL import Image
from scipy import ndimage as nd
from shapely import affinity
sys.path.insert(0, '.')
import kcarve as KC, kdonor as KD
from kvine import A, FR
RES, W = KC.RES, KC.W

def warped_vine(c, ob, H=700):
    ink = KD.MB[c + '_ink']; let = KD.MB[c + '_let']; m = int(.04 * H)
    vine = (~ink & ~nd.binary_dilation(let, iterations=2)).astype(float); vine[:m] = vine[-m:] = 0; vine[:, :m] = vine[:, -m:] = 0
    ys, xs = np.nonzero(let); hb = (xs.min() / H, ys.min() / H, xs.max() / H, ys.max() / H)
    sx, sy = (ob[2] - ob[0]) / (hb[2] - hb[0]), (ob[3] - ob[1]) / (hb[3] - hb[1])
    yy, xx = np.mgrid[0:RES, 0:W] / RES
    # inverse of Q = P*(.5+.5s) + .5*(ob0 - hb0*s)
    px = (xx - .5 * (ob[0] - hb[0] * sx)) / (.5 + .5 * sx); py = (yy - .5 * (ob[1] - hb[1] * sy)) / (.5 + .5 * sy)
    v = nd.map_coordinates(nd.gaussian_filter(vine, 1.2), [py * H, px * H], order=1, cval=0)
    l = nd.map_coordinates(let.astype(float), [py * H, px * H], order=1, cval=0)
    return v > .5, l > .5

if __name__ == '__main__':
    import cuts as CU
    Lt = pickle.load(open('glm26.pkl', 'rb')); ch, don = sys.argv[1], sys.argv[2]   # (our own scratch pickle)
    scale = float(sys.argv[3]) if len(sys.argv) > 3 else .78; seed = 1
    letter = CU.cut(affinity.scale(Lt[ch], scale, scale, origin=(A / 2, .5)).buffer(-.005, join_style='round'))
    vine, hislet = warped_vine(don, letter.bounds)
    Lm = KC.mask([letter]); chan = nd.distance_transform_edt(~Lm) / RES < KC.CHL
    vine &= ~chan
    # the vine's own ends left square where our letter cut it: round them (an opening, then the channel again)
    vine = nd.binary_opening(vine, iterations=3) & ~chan
    C = KD.Donor(letter, seed); C.from_donor(don)
    w = (vine | Lm) & ~C.frame
    C.white = w; w = C.tendrils(40)
    print(ch, don, 'white %.3f' % w[45:-45, 45:-45].mean(), flush=True)
    tag = f'{ch}-{don}'
    Image.fromarray((w * 255).astype(np.uint8)).save(f'out11/c-{tag}.png')
    json.dump({'name': f'{ch}{don}', 'a': A, 'polys': KC.smooth_vec(w)}, open(f'out11/c-{tag}.json', 'w'))
