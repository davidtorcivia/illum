# Image quilting (Efros & Freeman, SIGGRAPH 2001): grow a larger, seamless sheet of a material from small samples of
# the real thing, by laying overlapping blocks chosen to agree with what is already laid, each joined along the
# cheapest seam through the overlap. Used for gold from public-domain photographs of burnished grounds.
# usage: uv run --with pillow --with numpy python -I tools/quilt.py <out.webp> <size> <block> <overlap> <seed> <in.webp>...
import sys
import numpy as np
from PIL import Image

out, size, B, O, seed, *srcs = [a for a in sys.argv[1:] if not a.startswith('--')]
size, B, O, seed = int(size), int(B), int(O), int(seed)
rng = np.random.default_rng(seed)
S = [np.asarray(Image.open(p).convert('RGB')).astype(np.float32) for p in srcs]
# every block of every source, upright and half-turned
cands = []
for im in S:
    for t in ((0, 2) if '--turn4' not in sys.argv else (0, 1, 2, 3)):   # upright and half-turned only (mirrored or quarter-turned blocks make a kaleidoscope), unless asked
        a = np.rot90(im, t)
        h, w, _ = a.shape
        st = max(2, min(10, (h - B) // 6 or 2))
        for y in range(0, h - B + 1, st):
            for x in range(0, w - B + 1, st):
                cands.append(a[y:y + B, x:x + B])
cands = np.stack(cands)
# keep the field, not the shadows: blocks brighter than the darker third, and not split by a hard dark edge
lum = cands.mean(3)
keep = (lum.mean((1, 2)) > np.percentile(lum.mean((1, 2)), 40)) & (lum.std((1, 2)) < np.percentile(lum.std((1, 2)), 70))
cands = cands[keep]
print('blocks', len(cands))
step = B - O
n = (size - O) // step + 1
N = step * (n - 1) + B
res = np.zeros((N, N, 3), np.float32)

def min_cut(err):  # err: (rows, O) -> mask (rows, O) True where the new block wins
    rows = err.shape[0]
    E = err.copy()
    for i in range(1, rows):
        for j in range(O):
            E[i, j] += min(E[i - 1, max(0, j - 1):min(O, j + 2)])
    path = np.zeros(rows, int)
    path[-1] = int(np.argmin(E[-1]))
    for i in range(rows - 2, -1, -1):
        j = path[i + 1]
        lo, hi = max(0, j - 1), min(O, j + 2)
        path[i] = lo + int(np.argmin(E[i, lo:hi]))
    m = np.zeros((rows, O), bool)
    for i in range(rows):
        m[i, path[i]:] = True
    return m

for by in range(n):
    for bx in range(n):
        y, x = by * step, bx * step
        if by == 0 and bx == 0:
            res[y:y + B, x:x + B] = cands[rng.integers(len(cands))]
            continue
        cost = np.zeros(len(cands), np.float32)
        if bx > 0: cost += ((cands[:, :, :O] - res[y:y + B, x:x + O]) ** 2).sum((1, 2, 3))
        if by > 0: cost += ((cands[:, :O, :] - res[y:y + O, x:x + B]) ** 2).sum((1, 2, 3))
        # choose among the thirty best, not the best: always taking the best lays the same quiet block again and
        # again, which shows as a honeycomb
        pick = rng.choice(np.argpartition(cost, 30)[:30])
        blk = cands[pick].copy()
        mask = np.ones((B, B), bool)
        if bx > 0: mask[:, :O] &= min_cut(((blk[:, :O] - res[y:y + B, x:x + O]) ** 2).sum(2))
        if by > 0: mask[:O, :] &= min_cut(((blk[:O, :] - res[y:y + O, x:x + B]) ** 2).sum(2).T).T
        region = res[y:y + B, x:x + B]
        region[mask] = blk[mask]
Image.fromarray(np.clip(res[:size, :size], 0, 255).astype(np.uint8)).save(out, quality=90)
print(out, size)
