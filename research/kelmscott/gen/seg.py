import numpy as np, sys
from PIL import Image
from scipy import ndimage as nd
sys.path.insert(0,'.'); from measure import local_thickness
L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz')
out = {}
for c in 'ABCFHIKLMNOPSTVZ':
    ink = L[c+'_ink']; let = L[c+'_let']; w = ~ink; H = 700
    lt = local_thickness(w) / H
    thick = w & (lt >= .062)
    lab, n = nd.label(thick); sz = nd.sum(thick, lab, range(1, n+1))
    # keep thick components touching the given letter mask
    keep = [i+1 for i in range(n) if (let & (lab == i+1)).sum() > 30 or sz[i] > 2500]
    seed = np.isin(lab, keep) | let
    out[c] = seed; out[c+'_lt'] = lt
    a = np.full(ink.shape+(3,), 255, np.uint8); a[ink] = 0; a[seed] = (200,60,40); a[let & seed] = (150,30,20)
    Image.fromarray(a).save(f'seg_{c}.png')
np.savez_compressed('seg.npz', **out)
