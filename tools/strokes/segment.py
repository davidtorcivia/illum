# Segment real brush/pen strokes out of a museum image and extract per-stroke data (candidates, to be hand-curated).
#
# usage: uv run --with pillow --with numpy --with scikit-image python -I tools/strokes/segment.py \
#            <rawdir> <workdir> [--box x0,y0,x1,y1 (fractions)]... [--classes ink,lapis,...] [--min LEN] [--t T]
#   rawdir  holds image.jpg + meta.json (tools/strokes/fetch.py get)
#        or: ... segment.py --resheet <workdir>/<name>   (contact sheets again, without ruled lines; numbers kept)
#   writes  <workdir>/<name>/cands.json, c###.png (RGBA crop, ground made transparent), sheet-#.jpg (numbered contact sheets)
#
# Method:
#  1 ground: the local paper colour, estimated per region (a high per-channel percentile over a window wider than any
#    stroke, then re-estimated as the Gaussian mean of the pixels that are not marks), so toned silk, foxing and the
#    shading of a photographed page all drop out.
#  2 marks: each pixel's Lab difference from its ground; |d| > T is a mark, and the direction of d says which pigment
#    it is (lapis darkens and blues, vermilion reddens and yellows, ink only darkens...). Each pigment class is labelled
#    into connected components separately, so blue penwork round a red letter comes apart from it.
#  3 per component: skeleton -> its longest path (the centerline), extended to the tips along the end tangents; the
#    half-width profile from the distance transform; which end is loaded (wider x denser = the start); whether the
#    skeleton is one stroke (the path covers most of it) or a junction of several; how much it touches other marks.
#  4 matte: alpha = how far each pixel lies from its ground towards the stroke's own dense colour (linear unmixing),
#    colour = the unmixed paint colour, so granulation and pooling survive and the paper goes transparent.
import json, os, sys
from collections import deque
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from skimage import color, morphology

Image.MAX_IMAGE_PIXELS = None
MAXSIDE = 600
# pigment directions in Lab (paint minus ground, over parchment or paper), for classifying pixels and components
TEMPL = {'lapis': (-45, 8, -60), 'vermilion': (-30, 53, 35), 'carmine': (-40, 48, -5), 'ink': (-60, 0, -4),
         'gold': (-12, 4, 32), 'green': (-35, -35, 10)}

def arg(name, default=None, many=False):
    a = sys.argv; vals = [a[i + 1] for i in range(len(a) - 1) if a[i] == name]
    return vals if many else (vals[0] if vals else default)

def ground_of(rgb, mark_t):
    """Local paper colour per pixel: a coarse percentile pass, then the mean of the non-mark pixels."""
    H, W, _ = rgb.shape
    f = max(1, int(max(H, W) / 600))
    small = rgb[:H // f * f, :W // f * f].reshape(H // f, f, W // f, f, 3).mean((1, 3))
    win = max(15, int(max(small.shape) / 9) | 1)
    g0 = np.stack([ndi.percentile_filter(small[..., c], 80, size=win) for c in range(3)], -1)
    g = g0
    for _ in range(2):
        d = np.linalg.norm(color.rgb2lab(small) - color.rgb2lab(g), axis=-1)
        paper = ndi.binary_erosion(d < mark_t * .7, iterations=2).astype(np.float32)
        s = win / 2.5
        num = np.stack([ndi.gaussian_filter(small[..., c] * paper, s) for c in range(3)], -1)
        den = ndi.gaussian_filter(paper, s)[..., None]
        g = np.where(den > 1e-3, num / np.maximum(den, 1e-6), g0)
    zoom = (H / g.shape[0], W / g.shape[1], 1)
    return np.clip(ndi.zoom(g, zoom, order=1)[:H, :W], 0, 1)

def classify(d):
    """d: (..., 3) Lab differences -> index into TEMPL by direction (cosine)."""
    T = np.array(list(TEMPL.values()), np.float32); T /= np.linalg.norm(T, axis=1, keepdims=True)
    return np.argmax(d @ T.T, -1)

def longest_path(skel):
    pts = np.argwhere(skel)
    if len(pts) == 0: return [], 0
    idx = {tuple(p): i for i, p in enumerate(pts)}
    nb = [[idx[(y + dy, x + dx)] for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy or dx) and (y + dy, x + dx) in idx] for y, x in pts]
    def bfs(s):
        dist = [-1] * len(pts); prev = [-1] * len(pts); dist[s] = 0; q = deque([s]); last = s
        while q:
            u = q.popleft(); last = u
            for v in nb[u]:
                if dist[v] < 0: dist[v] = dist[u] + 1; prev[v] = u; q.append(v)
        return last, prev
    ends = [i for i in range(len(pts)) if len(nb[i]) == 1] or [0]
    a, _ = bfs(ends[0]); b, prev = bfs(a)
    path = [b]
    while path[-1] != a: path.append(prev[path[-1]])
    return pts[path][:, ::-1].astype(np.float32), len(pts)   # (x, y)

def smooth(P, k):
    if len(P) < 3 or k < 2: return P
    pad = np.concatenate([np.repeat(P[:1], k, 0), P, np.repeat(P[-1:], k, 0)])
    ker = np.ones(2 * k + 1) / (2 * k + 1)
    S = np.stack([np.convolve(pad[:, i], ker, 'valid') for i in range(2)], 1)
    S[0], S[-1] = P[0], P[-1]
    return S

def resample(P, n):
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    if seg[-1] == 0: return np.repeat(P[:1], n, 0), 0.0
    t = np.linspace(0, seg[-1], n)
    return np.stack([np.interp(t, seg, P[:, i]) for i in range(2)], 1), float(seg[-1])

def extend(P, mask, back):
    """March from each end of the path along its tangent to the edge of the mask (the skeleton stops short of the tip)."""
    out = [P]
    for end in (0, 1):
        Q = P if end else P[::-1]
        p, q = Q[-1], Q[max(0, len(Q) - 1 - back)]
        d = p - q; n = np.linalg.norm(d)
        if n == 0: out.insert(0 if not end else 2, np.zeros((0, 2))); continue
        d /= n; ext = []; x = p.copy()
        while True:
            x = x + d; xi, yi = int(round(x[0])), int(round(x[1]))
            if not (0 <= yi < mask.shape[0] and 0 <= xi < mask.shape[1]) or not mask[yi, xi]: break
            ext.append(x.copy())
        ext = np.array(ext).reshape(-1, 2)
        if end: out.append(ext)
        else: out.insert(0, ext[::-1])
    return np.concatenate(out)

def kinds(L, hw, dens, dry, coverage, P):
    """Heuristic stroke kinds (all that apply); the first is the primary one. Curation may override."""
    W = 2 * hw.max(); aspect = L / max(W, 1)
    chord = np.linalg.norm(P[-1] - P[0]); straight = chord / max(L, 1)
    t = np.diff(P, axis=0); ang = np.unwrap(np.arctan2(t[:, 1], t[:, 0])); turn = np.abs(np.diff(ang))
    n = len(turn); tail = max(turn[:n // 5].sum(), turn[-n // 5:].sum()) if n > 5 else 0
    tags = []
    if aspect < 2.2 and coverage == 1.0: tags.append('dab/ball')    # a compact piece cut out of a junction is a fragment, not a dab
    if hw.mean() < 3.2 and aspect > 6: tags.append('hairline')
    if dry > .28: tags.append('dry-brush')
    if tail > 1.0 and turn[n // 5: -n // 5].sum() < .8: tags.append('hook')
    if 2.2 <= aspect < 7 and hw[-6:].mean() < .3 * hw.max() and hw[:10].mean() > .6 * hw.max(): tags.append('flick')
    if 2.2 <= aspect < 5 and hw.mean() >= 5: tags.append('body stroke')
    tags.append('straight' if straight > .94 else 'curve')
    return tags

def strokes_of(body, edt):
    """One component -> [(path, region, split)]. A component whose skeleton is one path is one stroke. Otherwise the
    skeleton is cut at its junctions into branches, spurs shorter than the local width are dropped, and at each
    junction the branches that run on most nearly straight are joined (a stroke crossing another passes through), as
    stroke extraction does for Chinese characters. Each stroke's region is the union of discs of the local half-width
    along its path, so a crossing stroke keeps its full width through the crossing."""
    skel = morphology.skeletonize(body)
    P, n = longest_path(skel)
    if len(P) < 4: return []
    if len(P) / n >= .85: return [(P, body, False)]
    deg = ndi.convolve(skel.astype(np.uint8), np.ones((3, 3), np.uint8), mode='constant') - 1
    junc = skel & (deg >= 3)
    jl, nj = ndi.label(junc, np.ones((3, 3)))
    br, nb = ndi.label(skel & ~junc, np.ones((3, 3)))
    if nb < 2: return [(P, body, False)]
    # everything per junction and per branch works inside its own bounding box (a full-size pass each was quadratic)
    H, W = skel.shape
    grow = lambda sl, p: (slice(max(0, sl[0].start - p), min(H, sl[0].stop + p)), slice(max(0, sl[1].start - p), min(W, sl[1].stop + p)))
    jobj, bobj = ndi.find_objects(jl), ndi.find_objects(br)
    touch = {b: [] for b in range(1, nb + 1)}
    for j, sl in enumerate(jobj):
        g = grow(sl, 1)
        near = br[g][ndi.binary_dilation(jl[g] == j + 1, np.ones((3, 3), bool))]
        for b in np.unique(near[near > 0]): touch[int(b)].append(j)
    jmax = ndi.maximum(edt, jl, range(1, nj + 1))
    size = ndi.sum(np.ones_like(br), br, range(1, nb + 1))
    keep = {b for b in touch if not (len(touch[b]) == 1 and size[b - 1] < 1.3 * max(jmax[touch[b][0]], 2))}
    bpts = {b: np.argwhere(br[bobj[b - 1]] == b) + [bobj[b - 1][0].start, bobj[b - 1][1].start] for b in keep}
    parent = {b: b for b in keep}
    def find(b):
        while parent[b] != b: b = parent[b]
        return b
    for j in range(nj):
        sl = jobj[j]; cy, cx = (np.argwhere(jl[sl] == j + 1) + [sl[0].start, sl[1].start]).mean(0); r = max(6., 1.5 * jmax[j])
        dirs = []
        for b in keep:
            if j not in touch[b]: continue
            pts = bpts[b]; dd = np.hypot(pts[:, 0] - cy, pts[:, 1] - cx)
            far = pts[np.argmin(np.abs(dd - min(r, dd.max())))]
            v = np.array([far[0] - cy, far[1] - cx]); dirs.append((b, v / max(np.linalg.norm(v), 1e-6)))
        pairs = sorted(((float(u @ w), a, c) for i, (a, u) in enumerate(dirs) for c, w in dirs[i + 1:]))
        used = set()
        for dot, a, c in pairs:
            if dot > -.82: break                                   # within ~35 deg of straight on
            if a in used or c in used: continue
            used |= {a, c}; parent[find(a)] = find(c)
    groups = {}
    for b in keep: groups.setdefault(find(b), []).append(b)
    out = []
    for bs in groups.values():
        js = {j for b in bs for j in touch[b]}
        box = [bobj[b - 1] for b in bs] + [jobj[j] for j in js]
        g = grow((slice(min(t[0].start for t in box), max(t[0].stop for t in box)), slice(min(t[1].start for t in box), max(t[1].stop for t in box))), 2)
        m = np.isin(br[g], bs)
        for j in js:                                               # bridge the junctions the stroke passes through
            if sum(j in touch[b] for b in bs) >= 2: m |= jl[g] == j + 1
        m = ndi.binary_dilation(m, np.ones((3, 3), bool)) & skel[g]
        Q, _ = longest_path(m)
        if len(Q) < 4: continue
        Q = Q + [g[1].start, g[0].start]
        reg = np.zeros_like(body); yy, xx = np.ogrid[:body.shape[0], :body.shape[1]]
        rmax = 1.15 * np.median(edt[Q[:, 1].astype(int), Q[:, 0].astype(int)])   # a junction's blob is not the stroke's width
        for x, y in Q[::2]:
            r = min(edt[int(y), int(x)], rmax) + 1.5
            y0, y1, x0, x1 = int(max(0, y - r)), int(y + r + 1), int(max(0, x - r)), int(x + r + 1)
            reg[y0:y1, x0:x1] |= (yy[y0:y1] - y) ** 2 + (xx[:, x0:x1] - x) ** 2 <= r * r
        out.append((Q, reg & body, True))
    return out

def one(P, comp, body, edt, split, px, gr, mg, minlen):
    """Per-stroke data and its RGBA crop (see the header). comp: the stroke's pixels; body: its smoothed outline."""
    hwmax = max(edt[body].max(), 1)
    coverage = 1.0 if not split else .7
    P = smooth(P, int(max(2, min(12, hwmax / 2))))
    P = extend(P, body, int(max(3, min(15, len(P) // 4))))
    C, L = resample(P, 64)
    if L < minlen: return None
    edt = ndi.distance_transform_edt(body) if split else edt
    S, _ = resample(P, 32)
    hw = ndi.map_coordinates(edt, [S[:, 1], S[:, 0]], order=1)
    dense = comp & (mg >= np.percentile(mg[comp], 75))
    Pc = px[dense].mean(0)
    v = Pc - gr; a = ((px - gr) * v).sum(-1) / np.maximum((v * v).sum(-1), 1e-4)
    a = np.clip((a - .07) / .9, 0, 1)
    region = ndi.gaussian_filter(ndi.binary_dilation(comp, iterations=3).astype(np.float32), 1.5)
    alpha = a * np.clip(region * 1.4, 0, 1)
    unmixed = (px - (1 - alpha[..., None]) * gr) / np.maximum(alpha[..., None], 1e-3)
    wgt = np.clip((alpha[..., None] - .05) / .3, 0, 1)
    col = np.clip(wgt * unmixed + (1 - wgt) * Pc, 0, 1)
    dens = ndi.map_coordinates(ndi.uniform_filter(alpha, int(max(3, hwmax))), [S[:, 1], S[:, 0]], order=1)
    dry = float(1 - (alpha[body] > .45).mean())
    ls, le = (hw[:8] * dens[:8]).mean(), (hw[-8:] * dens[-8:]).mean()   # the loaded end (wider x denser) is the start
    if le > ls: C, S, hw, dens = C[::-1], S[::-1], hw[::-1], dens[::-1]
    dirconf = float(max(ls, le) / max(min(ls, le), 1e-3))
    tags = kinds(L, hw, dens, dry, coverage, C)
    # trim the crop to the stroke's own alpha
    ys, xs = np.nonzero(alpha > .02)
    y0, y1, x0, x1 = max(0, ys.min() - 3), ys.max() + 4, max(0, xs.min() - 3), xs.max() + 4
    rgba = np.dstack([col, alpha])[y0:y1, x0:x1]; C = C - [x0, y0]
    sc = min(1, MAXSIDE / max(rgba.shape[:2]))
    im = Image.fromarray((rgba * 255 + .5).astype(np.uint8), 'RGBA')
    if sc < 1:
        im = im.convert('RGBa').resize((max(1, round(im.width * sc)), max(1, round(im.height * sc))), Image.LANCZOS).convert('RGBA')
    mc = (col * alpha[..., None]).sum((0, 1)) / max(alpha.sum(), 1e-3)
    return dict(im=im, tags=tags, split=split, coverage=coverage, dry=round(dry, 3), dirconf=round(dirconf, 2),
                length=round(L * sc, 1), scale=round(sc, 4), crop_offset=[int(x0), int(y0)], size=[im.width, im.height],
                centerline=np.round(C * sc, 1).tolist(), halfwidth=np.round(hw * sc, 2).tolist(),
                mean_colour=[int(round(c * 255)) for c in mc])

def main():
    raw, work = sys.argv[1], sys.argv[2]
    meta = json.load(open(os.path.join(raw, 'meta.json')))
    name = f"{meta['museum']}-{meta['id']}"
    boxes = [tuple(map(float, b.split(','))) for b in arg('--box', many=True)] or [(0, 0, 1, 1)]
    classes = (arg('--classes') or 'ink').split(',')
    T = float(arg('--t', 14)); minlen = float(arg('--min', 60)); maxcontact = float(arg('--contact', .2))
    out = os.path.join(work, name); os.makedirs(out, exist_ok=True)
    full = Image.open(os.path.join(raw, 'image.jpg')).convert('RGB')
    cands = []
    for bi, (x0, y0, x1, y1) in enumerate(boxes):
        W0, H0 = full.size
        ox, oy = int(x0 * W0), int(y0 * H0)
        rgb = np.asarray(full.crop((ox, oy, int(x1 * W0), int(y1 * H0)))).astype(np.float32) / 255
        G = ground_of(rgb, T)
        d = color.rgb2lab(rgb) - color.rgb2lab(G)
        mag = np.linalg.norm(d, axis=-1)
        cls = classify(d)
        names = list(TEMPL)
        mark = ndi.gaussian_filter(mag, 1.2) > T
        allmarks = mark.copy()
        for cname in classes:
            ci = names.index(cname)
            m = mark & (ndi.median_filter(cls, 5) == ci)
            conn = ndi.binary_closing(m, iterations=3) | m       # dry-brush streaks stay one stroke for labelling
            lab, n = ndi.label(conn)
            objs = ndi.find_objects(lab)
            for k, sl in enumerate(objs, 1):
                if sl is None: continue
                h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
                if max(h, w) < minlen * .6: continue
                pad = max(6, int(.08 * max(h, w)))
                ys, xs = slice(max(0, sl[0].start - pad), min(lab.shape[0], sl[0].stop + pad)), slice(max(0, sl[1].start - pad), min(lab.shape[1], sl[1].stop + pad))
                comp = lab[ys, xs] == k
                body = ndi.gaussian_filter(comp.astype(np.float32), 2) > .5   # smoothed outline for skeleton and widths
                if body.sum() < 30: continue
                edt = ndi.distance_transform_edt(body)
                hwmax = edt.max()
                dout = ndi.distance_transform_edt(~comp)
                ring = (dout <= max(4, .6 * hwmax)) & (dout > 2)
                contact = float(allmarks[ys, xs][ring].mean()) if ring.any() else 0.
                if contact > maxcontact: continue
                for P, reg, split in strokes_of(body, edt):
                    c = one(P, reg & ndi.binary_dilation(comp, iterations=2) if split else comp, body if not split else reg, edt, split,
                            rgb[ys, xs], G[ys, xs], mag[ys, xs], minlen)
                    if c is None: continue
                    hwm = np.median(c['halfwidth']) or 1
                    if split and c['length'] < 6 * hwm: continue              # a junction's leftover, not a stroke
                    Cl = np.array(c['centerline'])
                    if np.linalg.norm(Cl[-1] - Cl[0]) / max(c['length'], 1) > .985 and c['length'] > 25 * 2 * hwm: continue   # a ruled line
                    lab_c = color.rgb2lab(np.array([[c['mean_colour']]], np.float32) / 255)[0, 0]
                    if cname == 'ink' and (np.hypot(lab_c[1], lab_c[2]) > 22 or lab_c[0] > 62): continue   # brocade, stains
                    c.update(cls=cname, contact=round(contact, 3), origin=[ox + xs.start + c['crop_offset'][0], oy + ys.start + c['crop_offset'][1]], id=f'{name}-{bi}{len(cands):03d}', cand=len(cands))
                    c['score'] = round(c['coverage'] * (1 - contact) * min(1, c['length'] / c['scale'] / 200) * (.6 if split else 1), 3)
                    c.pop('im').save(os.path.join(out, f"c{len(cands):03d}.png"))
                    cands.append(c)
    json.dump(dict(source=meta, cands=cands), open(os.path.join(out, 'cands.json'), 'w'))
    sheets(out, cands)
    print(name, len(cands), 'candidates')

def sheets(out, cands, cell=190, cols=8, per=64):
    order = sorted(cands, key=lambda c: -c['score'])
    for s in range(0, len(order), per):
        part = order[s:s + per]; rows = (len(part) + cols - 1) // cols
        S = Image.new('RGB', (cols * cell, rows * cell), (244, 238, 226)); dr = ImageDraw.Draw(S)
        for j, c in enumerate(part):
            im = Image.open(os.path.join(out, f"c{c['cand']:03d}.png")); f = min(1, (cell - 24) / max(im.size))
            im = im.resize((max(1, int(im.width * f)), max(1, int(im.height * f))))
            x, y = j % cols * cell + 4, j // cols * cell + 18
            S.paste(im, (x, y), im)
            pts = [(x + px * f, y + py * f) for px, py in c['centerline']]
            dr.line(pts, fill=(220, 40, 40), width=1); dr.ellipse([pts[0][0] - 3, pts[0][1] - 3, pts[0][0] + 3, pts[0][1] + 3], fill=(0, 150, 0))
            dr.text((x, y - 16), f"{c['cand']} {c['tags'][0][:6]} {c['coverage']:.2f} {c['length']:.0f}", fill=(0, 0, 0))
        S.save(os.path.join(out, f'sheet-{s // per}.jpg'), quality=82)

def resheet(out):
    """Re-draw a source's contact sheets without the ruled lines (staves, frame rules), keeping candidate numbers."""
    cands = json.load(open(os.path.join(out, 'cands.json')))['cands']
    def ruled(c):
        C = np.array(c['centerline']); hw = np.median(c['halfwidth']) or 1
        return np.linalg.norm(C[-1] - C[0]) / max(c['length'], 1) > .97 and c['length'] > 12 * 2 * hw
    sheets(out, [c for c in cands if not ruled(c)])

if __name__ == '__main__':
    resheet(sys.argv[2]) if sys.argv[1] == '--resheet' else main()
