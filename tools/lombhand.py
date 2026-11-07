# tools/lombhand.py: the choir-book Lombard as a designed typeface's letter (the SHAPE) painted by the rubricator's HAND (Free
# Library of Philadelphia, Lewis E 73, Gradual, Bologna?, c. 1425; research/17 §4h). The face gives the skeleton: its outline
# is read as vectors from the font file; the hand is applied to that outline, as vectors, by the rules tools/lombgen.py
# measured on his letters (units of the letter's height H):
#   weight   his heavy strokes are fuller than the face's: a heavy member's half-width is carried toward S = .085 (stems) /
#            B = .095 (bows) and his hairline h = .016 stays a hairline (the gain grows with the face's own half-width)
#   swell    a heavy stem waisted a little above its middle (~.92) and flaring to its ends (lombgen's stem profile)
#   brush    set down and lifted: the edge facing up-left swells where a stroke begins (top), the edge facing down-right
#            where it ends (foot), as a broad brush held at his angle lays and lifts a stroke
#   hooks    every free hairline end (a serif's tip, a hairline's end) drawn on into a hook whose end swells into a ball
#            (lombgen's curl): a pendant ball off a short turn, a hook, or a curl run on until it nearly closes; sizes varied
#            (r .6-1.35 × .038), turning either way; a fifth of the ends (and all past the fifth hook) left as the face drew them; a serif's two arms' hooks
#            never alike (each its own size, sweep and turn; the arms' lengths stay the face's)
#   hand     the painter's edge wanders off the true curve (a slow drift of ~.25 % of H over ~6 %), seeded per letter
# Everything is done on the outline as polygons (displaced along the normal; hooks added as offset outlines; joined by
# skia-pathops' boolean union) and the result fitted with cubic Beziers (Schneider), so the glyph is smooth vectors: no
# raster threshold anywhere in the output path. (A raster of the face is used only to MEASURE its half-widths and free ends.)
# usage: uv run --with pillow --with numpy --with scipy --with scikit-image --with fonttools --with skia-pathops python -I
#          tools/lombhand.py FONT OUTDIR [LETTERS] [SEED]      env: REF=I (the letter whose ink band is the cap height)
#   writes OUTDIR/<L>.json ({ name, char, src, a, curves, polys }): curves = contours of cubic segments in units of H
#   (x from the ink's left, y down, 0 = the cap line, 1 = the baseline: tails may pass below), for tools/lombfont.py
import sys, os, json, math
import numpy as np
from scipy import ndimage as nd
from skimage.morphology import medial_axis
from PIL import Image, ImageDraw
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
import pathops
S, B, h, r = .085, .095, .016, .038   # (tools/lombgen.py's measures of his hand)

class Flat(BasePen):   # a glyph's outline as polygons (curves flattened finely)
    def __init__(s, gs): super().__init__(gs); s.C = []; s.c = None
    def _moveTo(s, p): s.c = [p]; s.C.append(s.c)
    def _lineTo(s, p): s.c.append(p)
    def _curveToOne(s, a, b, c):
        p0 = np.array(s.c[-1]); P = np.array([p0, a, b, c], float)
        for t in np.linspace(0, 1, 24)[1:]: s.c.append(tuple((1 - t) ** 3 * P[0] + 3 * (1 - t) ** 2 * t * P[1] + 3 * (1 - t) * t * t * P[2] + t ** 3 * P[3]))
    def _qCurveToOne(s, a, b):
        p0 = np.array(s.c[-1]); P = np.array([p0, a, b], float)
        for t in np.linspace(0, 1, 16)[1:]: s.c.append(tuple((1 - t) ** 2 * P[0] + 2 * (1 - t) * t * P[1] + t * t * P[2]))
    def _closePath(s): pass
    _endPath = _closePath

def resample(P, step):   # a closed polygon at even arc steps
    P = np.vstack([P, P[:1]]); d = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(P, axis=0).T))]); n = max(12, int(d[-1] / step))
    s = np.linspace(0, d[-1], n, endpoint=False); return np.stack([np.interp(s, d, P[:, 0]), np.interp(s, d, P[:, 1])], 1)
def area(P): return .5 * np.sum(P[:, 0] * np.roll(P[:, 1], -1) - np.roll(P[:, 0], -1) * P[:, 1])
def gsmooth(v, sig, closed=True):   # gaussian along a closed contour (sig in samples)
    return nd.gaussian_filter1d(v, sig, axis=0, mode='wrap' if closed else 'nearest') if sig > 0 else v

# ---- Bezier fitting (Schneider 1990): a run of points between corners as few cubics within a tolerance ---------------------------
def fit_cubics(P, tol):
    def chord(P): d = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(P, axis=0).T))]); return d / max(d[-1], 1e-12)
    def bez(C, t): t = t[:, None]; return (1 - t) ** 3 * C[0] + 3 * (1 - t) ** 2 * t * C[1] + 3 * (1 - t) * t * t * C[2] + t ** 3 * C[3]
    def gen(P, u, t1, t2):   # least-squares tangent lengths
        A1 = (3 * (1 - u) ** 2 * u)[:, None] * t1; A2 = (3 * (1 - u) * u * u)[:, None] * t2
        C = np.array([[np.sum(A1 * A1), np.sum(A1 * A2)], [np.sum(A1 * A2), np.sum(A2 * A2)]])
        tmp = P - bez(np.array([P[0], P[0], P[-1], P[-1]]), u); X = np.array([np.sum(A1 * tmp), np.sum(A2 * tmp)])
        det = C[0, 0] * C[1, 1] - C[0, 1] ** 2; seg = np.hypot(*(P[-1] - P[0]))
        a1, a2 = ((X[0] * C[1, 1] - X[1] * C[0, 1]) / det, (C[0, 0] * X[1] - C[0, 1] * X[0]) / det) if abs(det) > 1e-12 else (seg / 3, seg / 3)
        if a1 < seg * 1e-3 or a2 < seg * 1e-3: a1 = a2 = seg / 3
        return np.array([P[0], P[0] + t1 * a1, P[-1] + t2 * a2, P[-1]])
    def reparam(C, P, u):   # one Newton step per point
        d = bez(C, u) - P; t = u[:, None]
        d1 = 3 * ((1 - t) ** 2 * (C[1] - C[0]) + 2 * (1 - t) * t * (C[2] - C[1]) + t * t * (C[3] - C[2])); d2 = 6 * ((1 - t) * (C[2] - 2 * C[1] + C[0]) + t * (C[3] - 2 * C[2] + C[1]))
        den = np.sum(d1 * d1 + d * d2, 1); return np.clip(u - np.where(np.abs(den) > 1e-12, np.sum(d * d1, 1) / np.where(den == 0, 1, den), 0), 0, 1)
    def unit(v): return v / max(np.hypot(*v), 1e-12)
    def rec(P, t1, t2):
        if len(P) == 2: d = np.hypot(*(P[1] - P[0])) / 3; return [np.array([P[0], P[0] + t1 * d, P[1] + t2 * d, P[1]])]
        u = chord(P); C = gen(P, u, t1, t2)
        for _ in range(5):
            e = np.hypot(*(bez(C, u) - P).T); k = int(np.argmax(e))
            if e[k] < tol: return [C]
            u = reparam(C, P, u); C = gen(P, u, t1, t2)
        e = np.hypot(*(bez(C, u) - P).T); k = int(np.clip(np.argmax(e), 1, len(P) - 2))
        if e.max() < tol: return [C]
        tc = unit(P[k - 1] - P[k + 1]); return rec(P[:k + 1], t1, tc) + rec(P[k:], -tc, t2)
    t1 = unit(P[min(2, len(P) - 1)] - P[0]); t2 = unit(P[max(-3, -len(P))] - P[-1])
    return rec(P, t1, t2)
def fit_contour(P, tol, corner=48):   # a closed polygon: cut at its corners (turn > corner degrees), each run fitted
    n = len(P); a = P - np.roll(P, 1, 0); b = np.roll(P, -1, 0) - P
    ang = np.degrees(np.abs(np.arctan2(a[:, 0] * b[:, 1] - a[:, 1] * b[:, 0], np.sum(a * b, 1))))
    K = [i for i in range(n) if ang[i] > corner]
    if not K: K = [0]; P = np.vstack([P, P[:1]]); return fit_cubics(P, tol)
    out = []
    for j, i0 in enumerate(K):
        i1 = K[(j + 1) % len(K)]; idx = list(range(i0, i1 + 1)) if i1 > i0 else list(range(i0, n)) + list(range(0, i1 + 1))
        out += fit_cubics(P[idx], tol)
    return out

# ---- the hand -------------------------------------------------------------------------------------------------------------------
def hand(font, ch, seed, ref='I'):
    rng = np.random.default_rng([seed, ord(ch)]); f = TTFont(font); gs = f.getGlyphSet(); cm = f.getBestCmap()
    pen = Flat(gs); gs[cm[ord(ref)]].draw(pen); Rf = np.vstack([np.array(c) for c in pen.C]); top, bot = Rf[:, 1].max(), Rf[:, 1].min(); U = top - bot
    pen = Flat(gs); gs[cm[ord(ch)]].draw(pen)
    C = [np.stack([(np.array(c)[:, 0]) / U, (top - np.array(c)[:, 1]) / U], 1) for c in pen.C if len(c) > 2]   # units of H, y down
    C = [c[np.concatenate([[True], np.hypot(*np.diff(c, axis=0).T) > 1e-6])] for c in C]
    x0 = min(c[:, 0].min() for c in C); y0 = min(c[:, 1].min() for c in C); y1 = max(c[:, 1].max() for c in C); x1 = max(c[:, 0].max() for c in C)
    # MEASURE (raster, analysis only): the face's half-width field and its medial axis
    R = 700; pad = .3; W, Hh = int((x1 - x0 + 2 * pad) * R), int((y1 - y0 + 2 * pad) * R); ox, oy = pad - x0, pad - y0
    im = Image.new('L', (W, Hh), 0); dr = ImageDraw.Draw(im); acc = np.zeros((Hh, W), bool)
    for c in C:
        m = Image.new('1', (W, Hh), 0); ImageDraw.Draw(m).polygon([((x + ox) * R, (y + oy) * R) for x, y in c], fill=1); acc ^= np.asarray(m)
    sk, dist = medial_axis(acc, return_distance=True); dist = dist / R
    # the heavy members: what survives an opening by a disc of ~his hairline's 2x (serif wedges, spurs and hairlines do not)
    rd = int(.032 * R); yy_, xx_ = np.mgrid[-rd:rd + 1, -rd:rd + 1]; op = nd.binary_opening(acc, structure=xx_ ** 2 + yy_ ** 2 <= rd * rd)
    dop = nd.distance_transform_edt(~op) / R
    # smooth fields over the plane (so the outline moves as one painted edge, never point by point): the face's half-width
    # at the nearest medial point, the heavy weight, and the gain toward his stem; each blurred over ~2.5 % of H
    near = nd.distance_transform_edt(~sk, return_distances=False, return_indices=True); Rf = dist[near[0], near[1]]
    Wf = nd.gaussian_filter(np.clip(1 - (dop - .004) / .016, 0, 1), .012 * R)
    k_ = np.clip((Rf - h * 1.3) / .02, 0, 1); Gf = nd.gaussian_filter(Wf * np.maximum(0, S - Rf) * float(os.environ.get('GAIN', .6)) * k_ * k_ * (3 - 2 * k_), .025 * R)
    Rs = nd.gaussian_filter(Rf, .02 * R)
    def at(F, p): i, j = int(np.clip((p[1] + oy) * R, 0, Hh - 1)), int(np.clip((p[0] + ox) * R, 0, W - 1)); return float(F[i, j])
    drift = lambda n: gsmooth(rng.normal(0, 1, n), n * .03) / max(gsmooth(rng.normal(0, 1, 4096), 4096 * .03).std(), 1e-9)
    out = []
    for c in C:
        P = resample(c, .003); t = np.roll(P, -1, 0) - np.roll(P, 1, 0); t /= np.hypot(*t.T)[:, None]; n = np.stack([t[:, 1], -t[:, 0]], 1)
        Q = P + n * .006; ins = np.mean([0 <= int((y + oy) * R) < Hh and 0 <= int((x + ox) * R) < W and acc[int((y + oy) * R), int((x + ox) * R)] for x, y in Q])
        if ins > .5: n = -n   # (the normal pointing out of the ink, whichever way the contour runs)
        n = gsmooth(n, 1.5); n /= np.hypot(*n.T)[:, None]
        Pin = P - n * .004; rr = np.array([at(Rs, q) for q in Pin]); heavy = np.array([at(Wf, q) for q in Pin]); yy = P[:, 1]
        d = np.array([at(Gf, q) for q in Pin])
        # the stem's waist (a little above the middle) and its flare toward the ends, on heavy parts only
        d += heavy * rr * (-.08 * np.exp(-((yy - .42) / .2) ** 2) + .06 * np.clip((np.abs(yy - .5) - .3) / .2, 0, 1))
        # brush set down (the top, its up-left edge) and lifted (the foot, its down-right edge)
        d += heavy * S * .14 * (np.clip(-n[:, 0] - n[:, 1], 0, None) * np.exp(-((yy - .1) / .14) ** 2) + np.clip(n[:, 0] + n[:, 1], 0, None) * np.exp(-((yy - .9) / .14) ** 2))
        # the painter's edge, a slow drift (more on the heavy, a whisper on the hair)
        d += drift(len(P)) * .0025 * (.35 + .65 * heavy)
        d = gsmooth(d, 4); out.append(P + n * d[:, None])
    # hooks at the free hairline ends: the medial axis's end points where the stroke is thin
    nb = nd.convolve(sk.astype(int), np.ones((3, 3), int), mode='constant') - 1
    ends = [(i, j) for i, j in zip(*np.nonzero(sk & (nb == 1))) if dist[i, j] < .02]
    # (the outermost first: where the letter reaches out, a hook; at most MAXHOOK, so a letter is not hung with curls)
    cx, cy = ((x0 + x1) / 2 + ox) * R, ((y0 + y1) / 2 + oy) * R; ends.sort(key=lambda e: -((e[1] - cx) ** 2 + (e[0] - cy) ** 2)); nh = 0
    hooks = []; seen = []
    for i, j in ends:
        p = np.array([j / R - ox, i / R - oy])
        if any(np.hypot(*(p - q)) < .07 for q in seen): continue
        # the hairline's direction: back along the axis a few px
        path = [(i, j)]; prev = None
        for _ in range(int(.035 * R)):
            cur = path[-1]; nx = [(cur[0] + a, cur[1] + b) for a in (-1, 0, 1) for b in (-1, 0, 1) if (a or b) and 0 <= cur[0] + a < Hh and 0 <= cur[1] + b < W and sk[cur[0] + a, cur[1] + b] and (cur[0] + a, cur[1] + b) not in path]
            if not nx: break
            path.append(nx[0])
        if len(path) < 6: continue
        q = np.array([path[-1][1] / R - ox, path[-1][0] / R - oy]); v = p - q; v /= np.hypot(*v)
        # the tip of the face's outline past the axis end (the axis stops short of a pointed tip): extend to the real end
        tip = p.copy()
        for s in np.arange(0, .06, .002):
            qq = p + v * s; ii, jj = int((qq[1] + oy) * R), int((qq[0] + ox) * R)
            if not (0 <= ii < Hh and 0 <= jj < W) or not acc[ii, jj]: break
            tip = qq
        seen.append(p)
        if rng.random() < .2 or nh >= int(os.environ.get('MAXHOOK', 5)): continue   # a few ends left as the face drew them
        # the hook: the hairline drawn on, turning (either way; the side away from the letter's centre more often), the ball
        # where the pen stops; sweep from barely turned to nearly closed
        cen = np.array([(x0 + x1) / 2, (y0 + y1) / 2]); w_ = cen - tip; side = np.sign(v[0] * w_[1] - v[1] * w_[0]) or 1
        nh += 1; turn = -side if rng.random() < .7 else side; kind = rng.random()
        # three kinds, as his ends are: a pendant ball dropped off a short turn, a hook, a curl run on until it nearly closes
        if kind < .5: rb, Rr, sweep = r * rng.uniform(.95, 1.35), r * rng.uniform(1.0, 1.6), math.pi * rng.uniform(.25, .6)
        elif kind < .9: rb, Rr, sweep = r * rng.uniform(.75, 1.15), r * rng.uniform(1.1, 1.7), math.pi * rng.uniform(.7, 1.1)
        else: rb, Rr, sweep = r * rng.uniform(.6, .9), r * rng.uniform(1.2, 1.8), math.pi * rng.uniform(1.1, 1.4)
        a0 = math.atan2(v[1], v[0]); k = np.linspace(0, 1, 40); lead = rb * rng.uniform(.2, .9)
        # centre-line: a short straight lead, then an arc of radius Rr turning by `sweep`, tightening a little (a spiral)
        Lp = [p + (tip - p) * s for s in np.linspace(0, 1, 6)[:-1]] + [tip + v * lead * s for s in np.linspace(0, 1, 8)]   # (from inside the face's end)
        c0 = Lp[-1] + Rr * np.array([-math.sin(a0), math.cos(a0)]) * turn
        for s in k[1:]:
            ang = a0 - turn * math.pi / 2 + turn * sweep * s; rad_ = Rr * (1 - .35 * s)
            Lp.append(c0 + rad_ * np.array([math.cos(ang), math.sin(ang)]))
        Lp = np.array(Lp); m = len(Lp); w0 = max(dist[i, j], h * .55); f_ = np.linspace(0, 1, m)
        wid = np.minimum(w0, h * .75) + (h * 1.05 - min(w0, h * .75)) * f_ + (rb - h * 1.05) * np.clip((f_ - .55) / .45, 0, 1) ** 1.8
        hooks.append((Lp, wid))
    return out, hooks, (x0, y0, x1, y1)

def stroke_poly(P, w):   # a stroke's outline: its line offset by the half-width either side, a round cap at the end
    t = np.gradient(P, axis=0); t /= np.maximum(np.hypot(*t.T)[:, None], 1e-12); n = np.stack([-t[:, 1], t[:, 0]], 1)
    cap = [P[-1] + w[-1] * np.array([math.cos(a), math.sin(a)]) for a in np.linspace(math.atan2(n[-1, 1], n[-1, 0]), math.atan2(n[-1, 1], n[-1, 0]) - math.pi, 24)]
    return np.vstack([P + n * w[:, None], cap, (P - n * w[:, None])[::-1]])

def union(polys):
    acc = None
    for P in polys:
        for q in (1e-6, 2e-4, 6e-4):   # (skia's boolean can fail on near-coincident edges: snap a little coarser and retry)
            Q = np.round(np.asarray(P) / q) * q; p = pathops.Path(); pen = p.getPen(); pen.moveTo(tuple(Q[0]))
            for v in Q[1:]: pen.lineTo(tuple(v))
            pen.closePath()
            try: p.simplify(fix_winding=True); acc = pathops.op(acc, p, pathops.PathOp.UNION) if acc is not None else p; break
            except pathops.PathOpsError: continue
        else: print('(a piece dropped: the union failed)', file=sys.stderr)
    res = []
    for cnt in acc.contours:
        pts = []
        for verb, ps in cnt.segments:
            pts += [list(q) for q in ps]
        if len(pts) > 2: res.append(np.array(pts, float))
    return res

if __name__ == '__main__':
    a = sys.argv[1:]; font, outd = a[0], a[1]; want = a[2] if len(a) > 2 else 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; seed = int(a[3]) if len(a) > 3 else 7
    os.makedirs(outd, exist_ok=True); fam = TTFont(font)['name'].getDebugName(1)
    for ch in want:
        body, hooks, box = hand(font, ch, seed, os.environ.get('REF', 'I'))
        big = max(body, key=lambda P: abs(area(P))); parts = [P for P in body if area(P) * area(big) > 0]; holes = [P for P in body if area(P) * area(big) <= 0]
        # (counters as holes: union the outer parts and hooks, then cut the counters)
        U = union(parts + [stroke_poly(Lp, w) for Lp, w in hooks])
        acc = pathops.Path()
        for P in U:
            pen = acc.getPen(); pen.moveTo(tuple(P[0]))
            for q in P[1:]: pen.lineTo(tuple(q))
            pen.closePath()
        for P in holes:
            hp = pathops.Path(); pen = hp.getPen(); pen.moveTo(tuple(P[0]))
            for q in P[1:]: pen.lineTo(tuple(q))
            pen.closePath(); hp.simplify(fix_winding=True); acc = pathops.op(acc, hp, pathops.PathOp.DIFFERENCE)
        cont = []
        for cnt in acc.contours:
            pts = [list(q) for verb, ps in cnt.segments for q in ps]
            if len(pts) > 2: cont.append(resample(np.array(pts, float), .0025))
        # (a tail that would run into the next line of text, J's and Y's: the letter set a little smaller, so its ink ends
        # at most DESC below the baseline, as a drop's ink must)
        yb = max(c[:, 1].max() for c in cont); dsc = float(os.environ.get('DESC', .07))
        if yb > 1 + dsc: k = (1 + dsc) / yb; cont = [c * k for c in cont]
        xs = np.concatenate([c[:, 0] for c in cont]); xl, xr = xs.min(), xs.max()
        curves = []
        for c in cont:   # each contour: its start point, then each cubic as c1x c1y c2x c2y x y
            F = fit_contour(c, .0009); curves.append([[round(v, 5) for v in F[0][0] - [xl, 0]]] + [[round(v, 5) for v in (C[1:] - [xl, 0]).ravel()] for C in F])
        polys = [[[round(x - xl, 4), round(y, 4)] for x, y in c[::2]] for c in cont]
        json.dump({'name': ch, 'char': ch, 'src': f'{fam} (the shape) + the Lewis E 73 hand (tools/lombhand.py), seed {seed}', 'a': round(xr - xl, 4), 'curves': curves, 'polys': polys}, open(f'{outd}/{ch}.json', 'w'))
        print(ch, round(xr - xl, 3), sum(len(cc) - 1 for cc in curves), 'cubics', end='  ', flush=True)
    print()
