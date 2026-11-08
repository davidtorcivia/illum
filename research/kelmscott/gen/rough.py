import numpy as np, sys
from scipy import ndimage as nd
def rough(m, H=700):
    per = (m ^ nd.binary_erosion(m)).sum(); out = []
    for s in (.004, .008, .016):
        sm = nd.gaussian_filter(m.astype(float), s * H) > .5
        out.append((m ^ sm).sum() / per / H)
    return out
if __name__ == '__main__':
    sys.path.insert(0, '.'); import klet
    L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz')
    allh = []
    for c in 'ABCFHIKLMNOPSTVZ':
        r = rough(L[c+'_let'] & ~L[c+'_ink']); allh.append(r)
    print('his  ', np.round(np.median(allh, 0) * 1000, 2), np.round(np.min(allh, 0) * 1000, 2), np.round(np.max(allh, 0) * 1000, 2))
    for c in 'LKPC': print('mine', c, np.round(np.array(rough(klet.render(c))) * 1000, 2))
