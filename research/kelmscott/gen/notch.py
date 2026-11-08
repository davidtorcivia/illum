import numpy as np, sys
from scipy import ndimage as nd
from skimage.morphology import disk, binary_closing
def notches(m, H=700):
    c = binary_closing(m, disk(int(.014 * H))); bites = c & ~m
    lab, n = nd.label(bites); sz = nd.sum(bites, lab, range(1, n + 1))
    k = int((sz > (.006 * H) ** 2).sum()); per = (m ^ nd.binary_erosion(m)).sum() / H
    return k, per, k / per
if __name__ == '__main__':
    sys.path.insert(0, '.'); import klet
    L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz'); d = []
    for c in 'ABCFHIKLMNOPSTVZ':
        k, per, r = notches(L[c+'_let'] & ~L[c+'_ink']); d.append(r); print(c, k, round(per, 2), round(r, 1))
    print('his per unit perimeter: median %.1f range %.1f-%.1f' % (np.median(d), min(d), max(d)))
    for c in 'LKPCEGRXY': k, per, r = notches(klet.render(c)); print('ours', c, k, round(r, 1))
