# his 16 letters, completed: the fragments of each letter (X_let & white) joined across the vine that crosses them
import numpy as np, sys
from PIL import Image
from scipy import ndimage as nd
from scipy.spatial import ConvexHull
from skimage.draw import polygon as dpoly
L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz')
def bridge(M, maxd=70):
    lab, n = nd.labeling if False else nd.label(M); out = M.copy()
    sz = nd.sum(M, lab, range(1, n + 1))
    comps = [lab == i + 1 for i in range(n) if sz[i] > 60]
    dts = [nd.distance_transform_edt(~c) for c in comps]
    for i in range(len(comps)):
        for j in range(i + 1, len(comps)):
            d = dts[i][comps[j]].min()
            if d > maxd: continue
            ea = comps[i] & (dts[j] < d + 14); eb = comps[j] & (dts[i] < d + 14)
            pts = np.argwhere(ea | eb)
            if len(pts) < 4: continue
            try: h = ConvexHull(pts)
            except Exception: continue
            rr, cc = dpoly(pts[h.vertices, 0], pts[h.vertices, 1], M.shape); out[rr, cc] = True
    return out
if __name__ == '__main__':
    out = {}
    for c in 'ABCFHIKLMNOPSTVZ':
        M = L[c+'_let'] & ~L[c+'_ink']; out[c] = bridge(M)
    np.savez_compressed('his16_bridged.npz', **out)
    S = 300; sh = Image.new('L', (8 * (S + 10), 2 * (S + 10)), 255)
    for n, c in enumerate('ABCFHIKLMNOPSTVZ'):
        a = np.full(out[c].shape + (3,), 255, np.uint8)
        im = Image.fromarray(np.where(out[c], 0, np.where(L[c+'_ink'], 235, 255)).astype(np.uint8)).resize((S * out[c].shape[1] // 700, S))
        sh.paste(im, ((n % 8) * (S + 10), (n // 8) * (S + 10)))
    sh.save('out4_bridged.png')
