# objective checks for a white-vine block: ink (bool, True = black), H = block height in px.
# local thickness (Hildebrand: diameter of the largest disc inside the shape that covers the pixel), area-weighted.
import numpy as np
from scipy import ndimage as nd
from skimage.morphology import skeletonize

M = .045   # margin cut off (frame)
BINS = np.r_[0:.20:.01, 1.]

def local_thickness(mask):
    dt = nd.distance_transform_edt(mask); out = np.zeros(mask.shape, float)
    for r in range(int(dt.max()), 0, -1):
        core = dt >= r
        if not core.any(): continue
        cov = (nd.distance_transform_edt(~core) <= r) & mask & (out == 0)
        out[cov] = 2 * r
    out[mask & (out == 0)] = 1
    return out

def inner(a, H):
    m = int(H * M); return a[m:-m, m:-m]

def measure(ink, let=None):
    H = ink.shape[0]; ink = inner(ink, H); white = ~ink
    lt = local_thickness(white) / H; ltb = local_thickness(ink) / H
    r = dict(white=float(white.mean()))
    r['hist_all'] = np.histogram(lt[white], BINS)[0] / white.sum()
    r['med_all'] = float(np.median(lt[white]))
    if let is not None:
        L = nd.binary_dilation(inner(let, H), iterations=3); vw = white & ~L
        r['hist_vine'] = np.histogram(lt[vw], BINS)[0] / max(1, vw.sum()); r['med_vine'] = float(np.median(lt[vw]))
        r['vine_frac'] = float(vw.mean())
    r['gap_med'] = float(np.median(ltb[ink])); r['gap_p90'] = float(np.percentile(ltb[ink], 90))
    r['gap_hist'] = np.histogram(ltb[ink], BINS)[0] / ink.sum()
    # terminals: endpoints of the white skeleton, spurs shorter than .012 H pruned; dots (small blobs) counted apart
    lab, n = nd.label(white); sizes = nd.sum(white, lab, range(1, n + 1))
    dotmax = (.02 * H) ** 2
    r['dots'] = int(((sizes > 4) & (sizes < dotmax)).sum())
    big = np.isin(lab, 1 + np.nonzero(sizes >= dotmax)[0])
    sk = skeletonize(big)
    for _ in range(int(.012 * H)):   # prune short spurs
        nb = nd.convolve(sk.astype(int), np.ones((3, 3), int), mode='constant') - sk
        sk = sk & ~((nb == 1) & sk) if _ < int(.012 * H) - 1 else sk
    nb = nd.convolve(sk.astype(int), np.ones((3, 3), int), mode='constant') - sk
    r['terminals'] = int(((nb == 1) & sk).sum())
    return r
