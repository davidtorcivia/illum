# tools/kgraft.py: a Kelmscott white-vine initial for a letter Morris never cut in that series, made as a block-cutter
# would make it from his own blocks: whole pieces of his traced blocks (tools/tracecut.py), each a letter's part with the vine
# that grows round it, grafted together. Each piece is a rectangle of one of his blocks (mirrored or scaled if asked), laid
# over the block so far; its four edges are not straight cuts but the paths of least difference through a band either side
# (dynamic programming, as Efros & Freeman's quilting seams), run through the black where they can, so a stem passes from
# one block into the other. Nothing is drawn: every cell is his. The specks a seam leaves are cleared.
# usage: uv run --with pillow --with numpy --with scipy --with scikit-image python -I tools/kgraft.py LIB.npz SPEC.json OUT.json [DBG.png]
#   LIB.npz: { C_ink } per letter C at height H (booleans; the scratchpad's py/qlib.py). SPEC: { "name", "W" (width, of H),
#   "base": { "src": "O", "flipX"?, "sx"?, "x"? }, "pieces": [ { "src": "K", "box": [x0, y0, x1, y1] (of the source, units
#   of H), "at": [x, y] (its top left in the new block, of H), "flipX"?, "flipY"?, "sx"?, "sy"?, "band"?: .03 } ], "resize"?: (the
#   final width, of H), "note" }
# Output: tracecut's JSON, "composed": true.
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from skimage.measure import find_contours, approximate_polygon

lib_f, spec_f, out_f = sys.argv[1:4]; dbg = sys.argv[4] if len(sys.argv) > 4 else None
L = np.load(lib_f); spec = json.load(open(spec_f)); H = L['A_ink'].shape[0]; W = round(spec.get('W', 1) * H)
def get(p):
    m = (np.asarray(Image.open(p['src']).convert('L').resize((round(Image.open(p['src']).width * H / Image.open(p['src']).height), H))) < 128) if p['src'].endswith('.png') else L[p['src'] + '_ink'].copy()   # (a block made before, as its white-on-black png)
    if p.get('flipX'): m = m[:, ::-1]
    if p.get('flipY'): m = m[::-1]
    sx, sy = p.get('sx', 1), p.get('sy', 1)
    if sx != 1 or sy != 1: m = np.asarray(Image.fromarray(m.astype(np.uint8) * 255).resize((round(m.shape[1] * sx), round(m.shape[0] * sy)), Image.LANCZOS)) > 127
    return m
def seam(cost):
    # a path down the rows of cost (h x b) of least total: its column per row
    h, b = cost.shape; C = cost.copy(); back = np.zeros((h, b), int)
    for i in range(1, h):
        prev = np.stack([np.r_[np.inf, C[i - 1, :-1]], C[i - 1], np.r_[C[i - 1, 1:], np.inf]]); k = np.argmin(prev, 0); C[i] += prev[k, np.arange(b)]; back[i] = k - 1
    j = int(np.argmin(C[-1])); path = [j]
    for i in range(h - 1, 0, -1): j = j + back[i, j]; path.append(j)
    return np.array(path[::-1])
B = get(spec['base']); out = np.ones((H, W), bool); bx = round(spec['base'].get('x', 0) * H); w = min(W - max(0, bx), B.shape[1])
out[:, max(0, bx):max(0, bx) + w] = B[:H, max(0, -bx):max(0, -bx) + w]
for p in spec['pieces']:
    S = get(p); x0, y0, x1, y1 = [round(v * H) for v in p['box']]; piece = S[y0:y1, x0:x1]; ax, ay = [round(v * H) for v in p['at']]
    h, w = piece.shape; h = min(h, H - ay); w = min(w, W - ax); piece = piece[:h, :w]; cur = out[ay:ay + h, ax:ax + w]
    b = max(4, round(H * p.get('band', .03))); cost = (piece != cur).astype(float) + .35 * (~piece | ~cur)
    inside = np.ones((h, w), bool); yy, xx = np.mgrid[:h, :w]
    if ax > 0: c = seam(cost[:, :b]); inside &= xx >= c[:, None]
    if ax + w < W: c = seam(cost[:, -b:]); inside &= xx < (w - b + c)[:, None]
    if ay > 0: c = seam(cost[:b].T); inside &= yy >= c[None, :]
    if ay + h < H: c = seam(cost[-b:].T); inside &= yy < (h - b + c)[None, :]
    cur[inside] = piece[inside]
ink = out
if spec.get('resize'): W2 = round(spec['resize'] * H); ink = np.asarray(Image.fromarray(ink.astype(np.uint8) * 255).resize((W2, H), Image.LANCZOS)) > 127; W = W2   # (a block made wider than his, brought back to his width)
lab, k = nd.label(ink); sz = nd.sum(ink, lab, range(1, k + 1)); ink[np.isin(lab, np.nonzero(sz < H * H * 4e-5)[0] + 1)] = False
lab, k = nd.label(~ink); sz = nd.sum(~ink, lab, range(1, k + 1)); ink[np.isin(lab, np.nonzero(sz < H * H * 4e-5)[0] + 1)] = True
if dbg: Image.fromarray(((~ink) * 255).astype(np.uint8)).save(dbg)
polys = []
for ct in find_contours(np.pad(ink.astype(float), 1), .5):
    ct = approximate_polygon(ct - 1, .45)
    if len(ct) >= 4: polys.append([[round(x / H, 4), round(y / H, 4)] for y, x in ct])
json.dump({'name': spec['name'], 'src': 'composed: ' + spec.get('note', ''), 'a': round(W / H, 4), 'polys': polys, 'white': {'p5': .011}, 'composed': True}, open(out_f, 'w'))
print(spec['name'], 'ok')
