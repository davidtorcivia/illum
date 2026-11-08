# vertical stems in his letter masks: per-row runs chained across rows; left/right edge offsets from the fitted axis
import numpy as np, json
from scipy import ndimage as nd
L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz'); H = 700
res = []
for c in 'ABCFHIKLMNOPSTVZ':
    M = nd.binary_fill_holes(L[c+'_let'] & ~L[c+'_ink'])
    chains = []   # each: list of (y, x0, x1)
    open_ = []
    for y in range(H):
        row = M[y]; d = np.diff(np.r_[0, row.astype(int), 0]); s = np.nonzero(d == 1)[0]; e = np.nonzero(d == -1)[0]
        runs = [(a, b) for a, b in zip(s, e) if b - a >= 4]; nxt = []
        for a, b in runs:
            hit = [ch for ch in open_ if ch[-1][1] < b and a < ch[-1][2]]
            ch = hit[0] if len(hit) == 1 else None
            if ch is None or any(ch is n for n in nxt): ch = []; chains.append(ch)
            ch.append((y, a, b)); nxt.append(ch)
        open_ = nxt
    for ch in chains:
        if len(ch) < .22 * H: continue
        a = np.array(ch, float); y = a[:, 0]; x0, x1 = a[:, 1], a[:, 2]; w = (x1 - x0) / H; cx = (x0 + x1) / 2
        mid = (y > y[0] + .3 * (y[-1] - y[0])) & (y < y[-1] - .3 * (y[-1] - y[0]))
        k = np.polyfit(y[mid], cx[mid], 1)
        if abs(k[0]) > .25: continue   # (not upright)
        ax = np.polyval(k, y); lo = (ax - x0) / H; ro = (x1 - ax) / H
        res.append(dict(c=c, y0=y[0] / H, y1=y[-1] / H, slope=k[0], waist=float(np.median(w[mid])), wmin=float(w[mid].min()),
                        top=[float(lo[:3].mean()), float(ro[:3].mean())], foot=[float(lo[-3:].mean()), float(ro[-3:].mean())],
                        lo=lo.tolist(), ro=ro.tolist()))
for r in res: print(r['c'], 'y %.2f-%.2f waist %.3f min %.3f top L%.3f R%.3f foot L%.3f R%.3f' % (r['y0'], r['y1'], r['waist'], r['wmin'], *r['top'], *r['foot']))
json.dump(res, open('stems.json', 'w'))
