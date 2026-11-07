# Morris's vine grammar from the 16 traced white-vine blocks: stem width along long skeleton runs, curvature, run lengths
import numpy as np, json
from scipy import ndimage as nd
from skimage.morphology import skeletonize
L = np.load('q/lib700.npz'); H = 700; res = {}
allw, allk, alllen, bw = [], [], [], {}
for c in 'ABCFHIKLMNOPSTVZ':
    ink = L[c + '_ink']; let = L[c + '_let']; m = int(H * .045)
    W = ~ink & ~nd.binary_dilation(let, iterations=3); W[:m] = W[-m:] = False; W[:, :m] = W[:, -m:] = False
    dt = nd.distance_transform_edt(W); sk = skeletonize(W)
    nb = nd.convolve(sk.astype(int), np.ones((3, 3)), mode='constant') - 1
    runs = sk & (nb == 2); lab, n = nd.label(runs, structure=np.ones((3, 3)))
    ws = []
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        if len(ys) < 40: continue
        w = 2 * dt[ys, xs] / H
        # order the pixels along the run
        P = np.stack([xs, ys], 1).astype(float); order = [int(np.argmin(P[:, 0] + P[:, 1]))]; left = set(range(len(P))) - set(order)
        # endpoint: pixel with one neighbour
        ends = [j for j in range(len(P)) if sum(abs(P[j] - P[k]).max() <= 1 for k in range(len(P))) == 2]
        if not ends: continue
        order = [ends[0]]; left = set(range(len(P))) - {ends[0]}
        while left:
            j = min(left, key=lambda k: np.abs(P[k] - P[order[-1]]).max())
            if np.abs(P[j] - P[order[-1]]).max() > 1.5: break
            order.append(j); left.discard(j)
        Q = nd.gaussian_filter1d(P[order], 4, axis=0)
        if len(Q) < 40: continue
        d = np.diff(Q, axis=0); a = np.unwrap(np.arctan2(d[:, 1], d[:, 0])); ds = np.hypot(*d.T)
        k = np.diff(a) / ds[1:] * H   # curvature in 1/heights
        allk += list(np.abs(k[5:-5])); alllen.append(len(Q) / H); ws += list(w[5:-5])
    allw += ws; bw[c] = [round(float(np.median(ws)), 4), round(float(np.percentile(ws, 80)), 4)] if ws else None
    res[c] = dict(white=round(float(W.sum() / W[m:-m, m:-m].size), 3))
out = dict(stem_med=float(np.median(allw)), stem_p80=float(np.percentile(allw, 80)), stem_p95=float(np.percentile(allw, 95)),
           curv_med=float(np.median(allk)), curv_p25=float(np.percentile(allk, 25)), curv_p75=float(np.percentile(allk, 75)), curv_p90=float(np.percentile(allk, 90)),
           run_med=float(np.median(alllen)), run_p90=float(np.percentile(alllen, 90)), per_block=bw)
json.dump(out, open('q/grammar.json', 'w'), indent=1); print(json.dumps(out, indent=0)[:900])
