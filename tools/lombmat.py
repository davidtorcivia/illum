# tools/lombmat.py: the choir-book Lombard as STROKES fitted to the rubricator's own letters (research/17 §4g). Each traced
# letter of Lewis E 73 (research/choirbook/set/) is read as its medial axis (the centre-lines of its strokes, and at every
# point the stroke's half-width: how the heavy stroke swells and waists, how a hairline leaves the body, how a ball grows
# at a hairline's end), the axis cut into strokes at its forks, each stroke's line and width fitted with a smoothing
# spline (the scan's grain and the trace's lumps fall away; the hand's real swell, being slow, is kept). A letter is then
# drawn from strokes as smooth contours: each stroke's outline is its spline offset by its width either side, closed with
# round caps (where the width is large at an end that cap is the ball, grown out of the hairline), the strokes filled
# together. Letters he painted are redrawn from their own strokes (the check: tools/lombmat.py --compare); the letters he
# did not paint are drawn from strokes of his others, named in research/choirbook/strokes.json.
# usage: uv run --with pillow --with numpy --with scipy --with scikit-image python -I tools/lombmat.py SRCDIR OUTDIR [--map DIR] [--compose SPEC]
#   --map DIR: a picture of each letter's strokes, numbered (for writing the compose spec)
#   --compose SPEC: { L: [[src, [rects] | 'all', {dx, dy, s, fx, fy, w, not: [rects]}]...] }: letters drawn from others' strokes,
#     a stroke taken when its middle lies in one of the rects (units of the source letter's height, its mask's 20 px pad in)
import sys, os, json, math
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from scipy.interpolate import splprep, splev, UnivariateSpline
from skimage.morphology import medial_axis
from skimage.measure import find_contours, approximate_polygon
R = 600
def mask(d, h=R):
    w = round(d['a'] * h) + 40; acc = np.zeros((h + 40, w), bool)
    for p in d['polys']:
        im = Image.new('1', (w * 2, (h + 40) * 2), 0); ImageDraw.Draw(im).polygon([((x * h + 20) * 2, (y * h + 20) * 2) for x, y in p], fill=1); a = np.asarray(im)[::2, ::2]; acc ^= a
    return acc
N8 = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
def strokes_of(m):
    """the medial axis cut at forks into strokes: [(pts [[x, y]...] px, radii px)], spurs (shorter than their own width) dropped"""
    sk, dist = medial_axis(m, return_distance=True); P = set(zip(*np.nonzero(sk)))
    nb = lambda p: [(p[0] + a, p[1] + b) for a, b in N8 if (p[0] + a, p[1] + b) in P]
    deg = {p: len(nb(p)) for p in P}; nodes = {p for p in P if deg[p] != 2}; seen = set(); out = []
    def walk(a, b):
        path = [a, b]; seen.add(frozenset((a, b)))
        while path[-1] not in nodes:
            nx = [q for q in nb(path[-1]) if q != path[-2] and frozenset((path[-1], q)) not in seen]
            if not nx: break
            seen.add(frozenset((path[-1], nx[0]))); path.append(nx[0])
        return path
    for a in nodes:
        for b in nb(a):
            if frozenset((a, b)) not in seen: out.append(walk(a, b))
    for p in P:   # closed loops with no node (an O's ring)
        if deg[p] == 2 and not any(frozenset((p, q)) in seen for q in nb(p)):
            path = [p]; prev = None; cur = p
            while True:
                nx = [q for q in nb(cur) if q != prev and frozenset((cur, q)) not in seen]
                if not nx: break
                seen.add(frozenset((cur, nx[0]))); prev, cur = cur, nx[0]; path.append(cur)
                if cur == p: break
            if len(path) > 8: out.append(path)
    res = []
    for path in out:
        pts = np.array([[c, r] for r, c in path], float); rad = np.array([dist[r, c] for r, c in path], float)
        L = np.sum(np.hypot(*np.diff(pts, axis=0).T)) if len(pts) > 1 else 0
        if L < max(6, rad.max() * .9) and (deg[path[0]] == 1 or deg[path[-1]] == 1): continue   # a spur of the trace, not a stroke
        res.append((pts, rad))
    return res
def fit(pts, rad, smooth=1.0):
    """a stroke's line and width as smoothing splines; returns a dense polyline and its radii"""
    if len(pts) < 5: return pts, rad
    d = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(pts, axis=0).T))]); keep = np.concatenate([[True], np.diff(d) > 1e-6]); pts, rad, d = pts[keep], rad[keep], d[keep]
    if len(pts) < 5: return pts, rad
    closed = np.hypot(*(pts[0] - pts[-1])) < 2.5
    try: tck, u = splprep([pts[:, 0], pts[:, 1]], u=d / d[-1], s=len(pts) * smooth * 1.6, per=int(closed), k=3)
    except Exception: return pts, rad
    uu = np.linspace(0, 1, max(20, int(d[-1] / .7))); x, y = splev(uu, tck)
    rs = UnivariateSpline(d / d[-1], rad, s=len(rad) * (smooth * .9) ** 2, k=3)(uu)
    return np.stack([x, y], 1), np.maximum(rs, .8)
def draw(strokes, shape, ss=3):
    """the strokes as filled outlines (offset curves with round caps), at ss× supersampling, returned at shape"""
    H, W = shape; im = Image.new('L', (W * ss, H * ss), 0); dr = ImageDraw.Draw(im)
    for pts, rad in strokes:
        if len(pts) < 2: continue
        t = np.gradient(pts, axis=0); t /= np.maximum(np.hypot(t[:, 0], t[:, 1])[:, None], 1e-9); n = np.stack([-t[:, 1], t[:, 0]], 1)
        left, right = pts + n * rad[:, None], pts - n * rad[:, None]
        poly = np.concatenate([left, right[::-1]]) * ss; dr.polygon([tuple(p) for p in poly], fill=255)
        for e in (0, -1): c, rr = pts[e] * ss, rad[e] * ss; dr.ellipse([c[0] - rr, c[1] - rr, c[0] + rr, c[1] + rr], fill=255)
    a = np.asarray(im.resize((W, H), Image.LANCZOS)) > 127
    return nd.binary_closing(a, iterations=2) | a
def polys_of(a, name, char, src):
    a = nd.gaussian_filter(a.astype(float), 1.0) > .5; ys, xs = np.nonzero(a); bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1; H = by1 - by0; out = []
    for ct in find_contours(np.pad(nd.gaussian_filter(a.astype(float), .8), 1), .5):
        ct = approximate_polygon(ct - 1, .5)
        if len(ct) >= 4: out.append([[round((x - bx0) / H, 4), round((y - by0) / H, 4)] for y, x in ct])
    return {'name': name, 'char': char, 'src': src, 'a': round((bx1 - bx0) / H, 4), 'polys': out}
if __name__ == '__main__':
    a = sys.argv[1:]; src, outd = a[0], a[1]; os.makedirs(outd, exist_ok=True)
    mapdir = a[a.index('--map') + 1] if '--map' in a else None; spec = json.load(open(a[a.index('--compose') + 1])) if '--compose' in a else {}
    lib = {}
    for f in sorted(os.listdir(src)):
        if not f.endswith('.json'): continue
        d = json.load(open(f'{src}/{f}')); ch = d.get('char') or f[0]; m = mask(d); S = [fit(p, r) for p, r in strokes_of(m)]; lib[ch] = (S, m.shape)
        # every letter of the set redrawn from its own strokes: the traced ones (his), and the ones composed from his
        # (tools/lombcompose.py), whose seams the strokes now run through
        json.dump(polys_of(draw(S, m.shape), ch, ch, f'redrawn from its own strokes (tools/lombmat.py): ' + d.get('src', '')[:160]), open(f'{outd}/{ch}.json', 'w'))
        if mapdir:
            os.makedirs(mapdir, exist_ok=True); im = Image.fromarray((~m * 255).astype(np.uint8)).convert('RGB'); dr = ImageDraw.Draw(im)
            for k, (p, r) in enumerate(S): dr.line([tuple(q) for q in p], fill=(220, 40, 40), width=2); q = p[len(p) // 2]; dr.text((q[0] + 3, q[1] - 6), str(k), fill=(0, 0, 220))
            im.save(f'{mapdir}/{ch}.png')
    for ch, parts in spec.items():
        if ch.startswith('_'): continue
        W = 0; acc = []
        for srcch, ids, o in parts:
            S, shape = lib[srcch]; s = o.get('s', 1); fx = o.get('fx', False); fy = o.get('fy', False); w0 = shape[1]
            for k, (p, r) in enumerate(S):
                mid = p[len(p) // 2] / R   # (a selection by place: strokes whose middle lies in any of the rects, units of the letter's height)
                if ids != 'all' and not any(x0 <= mid[0] <= x1 and y0 <= mid[1] <= y1 for x0, y0, x1, y1 in ids): continue
                if any(x0 <= mid[0] <= x1 and y0 <= mid[1] <= y1 for x0, y0, x1, y1 in o.get('not', [])): continue
                q = p.copy()
                if fx: q[:, 0] = w0 - q[:, 0]
                if fy: q[:, 1] = shape[0] - q[:, 1]
                q = q * s + [o.get('dx', 0) * R, o.get('dy', 0) * R]; acc.append((q, r * s * o.get('w', 1)))
        allp = np.concatenate([p for p, _ in acc]); sh = (int(allp[:, 1].max() + 80), int(allp[:, 0].max() + 80))
        json.dump(polys_of(draw(acc, sh), ch, ch, 'drawn from the strokes of his ' + ', '.join(sorted({p[0] for p in parts})) + ' (tools/lombmat.py)'), open(f'{outd}/{ch}.json', 'w'))
    print('done', sorted(os.listdir(outd)))
