import numpy as np, json, sys
from scipy import ndimage as nd
sys.path.insert(0, '.'); from prof import profile, cubic
L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz')
S = {  # (letter, kind, centre-line) hand-read from the gridded blocks
 'K.stem': ('K', [(.22, .32), (.225, .845)]),
 'P.stem': ('P', [(.20, .40), (.22, .862)]),
 'L.stem': ('L', [(.215, .40), (.22, .842)]),
 'L.stem2': ('L', [(.665, .48), (.67, .855)]),
 'I.stem': ('I', [(.385, .07), (.38, .50), (.355, .885)]),
 'H.stem': ('H', [(.12, .06), (.12, .92)]),
 'K.leg': ('K', [(.40, .44), (.74, .845)]),
 'K.arm': ('K', [(.70, .12), (.40, .44)]),
 'V.left': ('V', [(.14, .07), (.29, .58), (.395, .935)]),
 'L.bar': ('L', [(.09, .12), (.28, .13), (.47, .12)]),
 'T.bar': ('T', [(.08, .135), (.45, .12), (.84, .11)]),
 'O.bowl': ('O', cubic([(.36, .09), (-.05, .25), (.05, .95), (.68, .85)])),
 'C.bowl': ('C', cubic([(.17, .42), (.08, .62), (.25, .88), (.59, .915)])),
 'T.bowl': ('T', cubic([(.25, .17), (.08, .45), (.08, .86), (.57, .945)])),
}
res = {}
for k, (c, P) in S.items():
    M = ~L[c + '_ink'] & nd.binary_dilation(L[c + '_let'], iterations=4)
    o, Sl = profile(M, P); w = o.sum(1)
    n = len(w); mid = slice(n // 3, 2 * n // 3)
    res[k] = dict(len=Sl, l=o[:, 0].tolist(), r=o[:, 1].tolist())
    f = lambda a: '%.3f' % a if np.isfinite(a) else '  nan'
    print(f'{k:8s} len {Sl:.2f} waist {f(np.nanmedian(w[mid]))} min {f(np.nanmin(w[mid]))} | start L{f(np.nanmean(o[:3,0]))} R{f(np.nanmean(o[:3,1]))} | end L{f(np.nanmean(o[-3:,0]))} R{f(np.nanmean(o[-3:,1]))} | w by tenths', ' '.join(f(np.nanmedian(w[i*n//10:(i+1)*n//10])) for i in range(10)))
json.dump(res, open('strokes.json', 'w'))
