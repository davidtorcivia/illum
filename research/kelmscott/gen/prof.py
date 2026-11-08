# measure his strokes: perpendicular rays from a hand-placed centre-line through his letter white
import numpy as np, json, sys
from scipy import ndimage as nd
H = 700

def resample(P, n):
    P = np.asarray(P, float); d = np.r_[0, np.cumsum(np.hypot(*np.diff(P, axis=0).T))]; t = np.linspace(0, d[-1], n)
    return np.stack([np.interp(t, d, P[:, 0]), np.interp(t, d, P[:, 1])], 1), d[-1]

def cubic(P, n=80):
    P = np.array(P, float); t = np.linspace(0, 1, n)[:, None]
    return (1 - t) ** 3 * P[0] + 3 * (1 - t) ** 2 * t * P[1] + 3 * (1 - t) * t ** 2 * P[2] + t ** 3 * P[3]

def profile(M, P, n=120, maxr=.25):
    """left/right offsets (units of H) along centre-line P (units of H) inside mask M; NaN where the ray starts outside"""
    Q, S = resample(P, n); d = np.gradient(Q, axis=0); d /= np.linalg.norm(d, axis=1, keepdims=True); nv = np.stack([d[:, 1], -d[:, 0]], 1)  # left of travel
    rs = np.arange(0, maxr, .5 / H); out = np.full((n, 2), np.nan)
    for i in range(n):
        for k, sg in enumerate((1, -1)):
            pts = Q[i] + sg * nv[i] * rs[:, None]; ij = np.round(pts * H).astype(int)
            ok = (ij[:, 0] >= 0) & (ij[:, 0] < M.shape[1]) & (ij[:, 1] >= 0) & (ij[:, 1] < M.shape[0])
            v = np.zeros(len(rs), bool); v[ok] = M[ij[ok, 1], ij[ok, 0]]
            if not v[0]: continue
            j = np.argmin(v) if not v.all() else len(v) - 1; out[i, k] = rs[j]
    return out, S
