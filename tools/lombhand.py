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
# Second pass ("more confident, less pieced together"): the body is redrawn as STROKES (tools/lombmat.py's reading of the face:
# medial axis cut at forks, line and width fitted with splines; a stroke's width held to its own where it meets a fork), each
# a single stroke whose width is a monotone function of the face's (heavy members to his full paint S x FULL, hairlines left
# thin; a counter kept open, CTR), drawn as a chain of convex capsules; joined with the face's own outline (its serif wedges
# and crisp tips) and the terminals by GEOS's union (shapely); fitted with cubic Beziers (Schneider). No raster threshold in
# the output path (rasters only MEASURE the face). Most free ends finish in a drop whose width only widens (no neck); HOOKS
# (1) end in a curl. Per-letter edits (EDIT): his J = I, V = U, uncial N from M, M's foot-bar cut, Y's tail cut at the line,
# L's foot made heavy, no terminals on O and Q.
# usage: uv run --with pillow --with numpy --with scipy --with scikit-image --with fonttools --with skia-pathops --with shapely python -I
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
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from lombmat import strokes_of, fit   # (his strokes' reader, reused)
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

# ---- the letters he writes otherwise than the face does (units of H; boxes x0, y0, x1, y1) ------------------------------------
BOX = lambda x0, y0, x1, y1: np.array([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], float)
EDIT = {
    'J': {'src': 'I'},                                               # his J is his I (research/choirbook/lombards.json)
    'V': {'src': 'U'},                                               # his V is the U form
    'N': {'src': 'M', 'cut': [BOX(-1, -1, .69, 3), BOX(-1, .918, 3, 3)]},   # his uncial N: the M's middle stem and right bow
    'M': {'cut': [BOX(-1, .918, 3, 3)]},                             # (the face's hairline bar under the feet: he has none)
    'Y': {'cut': [BOX(-1, 1.03, 3, 3)]},                             # the tail ends at the line, in a drop (a drop's ink must)
    'L': {'bold': [(BOX(.25, .74, .78, 1.08), .052)]},               # his L's foot is its heaviest member
    'O': {'ends': 0}, 'Q': {'ends': 0},                              # (no terminals: the face's crown and foot nibs left alone)
}
def to_path(polys):
    P = pathops.Path(); pen = P.getPen()
    for c in polys:
        pen.moveTo(tuple(c[0]))
        for q in c[1:]: pen.lineTo(tuple(q))
        pen.closePath()
    return P
def from_path(P): return [np.array([q for verb, ps in cnt.segments for q in ps], float) for cnt in P.contours]

# ---- the hand -------------------------------------------------------------------------------------------------------------------
DBGL = []; CUTS = []
def hand(font, ch, seed, ref='I'):
    rng = np.random.default_rng([seed, ord(ch)]); f = TTFont(font); gs = f.getGlyphSet(); cm = f.getBestCmap(); E = EDIT.get(ch, {})
    pen = Flat(gs); gs[cm[ord(ref)]].draw(pen); Rf = np.vstack([np.array(c) for c in pen.C]); top, bot = Rf[:, 1].max(), Rf[:, 1].min(); U = top - bot
    pen = Flat(gs); gs[cm[ord(E.get('src', ch))]].draw(pen)
    C = [np.stack([(np.array(c)[:, 0]) / U, (top - np.array(c)[:, 1]) / U], 1) for c in pen.C if len(c) > 2]   # units of H, y down
    if E.get('cut'):   # (vector cuts, before anything is measured, so the cut ends are ends like any other)
        P = to_path(C); P.simplify(fix_winding=True)
        for bx in E['cut']: P = pathops.op(P, to_path([bx]), pathops.PathOp.DIFFERENCE)
        C = [c for c in from_path(P) if len(c) > 2]
    C = [c[np.concatenate([[True], np.hypot(*np.diff(c, axis=0).T) > 1e-6])] for c in C]
    x0 = min(c[:, 0].min() for c in C); y0 = min(c[:, 1].min() for c in C); y1 = max(c[:, 1].max() for c in C); x1 = max(c[:, 0].max() for c in C)
    # MEASURE (raster, analysis only): the face's half-width field and its medial axis
    R = 700; pad = .3; W, Hh = int((x1 - x0 + 2 * pad) * R), int((y1 - y0 + 2 * pad) * R); ox, oy = pad - x0, pad - y0
    acc = np.zeros((Hh, W), bool)
    for c in C:
        m = Image.new('1', (W, Hh), 0); ImageDraw.Draw(m).polygon([((x + ox) * R, (y + oy) * R) for x, y in c], fill=1); acc ^= np.asarray(m)
    sk, dist = medial_axis(acc, return_distance=True); dist = dist / R
    # THE BODY as strokes (tools/lombmat.py's reading: the medial axis cut at its forks, each stroke's line and half-width fitted
    # with smoothing splines), each redrawn as one stroke of the brush: its half-width carried by the gain toward his full paint,
    # smoothly along the stroke, so a member swells and thins as a single sure stroke and a hairline leaves the body in one taper
    full = S * float(os.environ.get('FULL', 1.12)); hair_ = float(os.environ.get('HAIR', .010))
    def gain(rr):   # monotone in the face's half-width: ~.045 H and over to his full paint, under ~.02 H the face's line
        sm = np.clip((rr - .035) / .02, 0, 1); sm = sm * sm * (3 - 2 * sm); return rr + sm * np.maximum(0, full - rr) + (1 - sm) * np.maximum(0, hair_ - rr) * .7
    out = []
    nb = nd.convolve(sk.astype(int), np.ones((3, 3), int), mode='constant') - 1; bg = nd.distance_transform_edt(~acc) / R
    def unfork(p_, r_):   # a stroke's width where it meets a fork is the joint's inscribed disc, not its own: held to its own
        r_ = r_.copy(); d_ = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(p_, axis=0).T))])
        for e in (0, -1):
            x_, y_ = int(round(p_[e][0])), int(round(p_[e][1]))
            if nb[y_, x_] == 1: continue   # (a free end)
            de = d_ if e == 0 else d_[-1] - d_; k = np.searchsorted(np.sort(de), r_[e] * 1.1); idx = np.argsort(de)[min(k, len(de) - 1)]
            r_ = np.where(de < r_[e] * 1.1, np.minimum(r_, r_[idx]), r_)
        return p_, r_
    for pts, rad in [fit(*unfork(p_, r_), 1.2) for p_, r_ in strokes_of(acc)]:
        P = pts / R - [ox, oy]; rr = rad / R; rw = gain(rr)
        for bx, tw in E.get('bold', []):   # (a member he paints heavier than the face draws it)
            inb = (P[:, 0] >= bx[0, 0]) & (P[:, 0] <= bx[1, 0]) & (P[:, 1] >= bx[0, 1]) & (P[:, 1] <= bx[2, 1]); rw = np.where(inb, np.maximum(rw, tw), rw)
        if len(P) > 4: rw = gsmooth(rw, max(1, len(P) * .04), closed=False)
        L_ = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(P, axis=0).T))]); fu = L_ / max(L_[-1], 1e-9); heavy = float(np.clip((np.median(rr) - .035) / .02, 0, 1))
        # a heavy stroke waisted a little above its middle and flaring to its ends (lombgen's stem), its edge drifting slowly
        rw = rw * (1 + heavy * (-.05 * np.exp(-((fu - .45) / .25) ** 2)))   # (the flare to its ends is the face's own serif)
        rw = rw * (1 + heavy * .006 * np.sin(fu * L_[-1] / .09 * math.pi + rng.uniform(0, 6.3)))
        t = np.gradient(P, axis=0); t /= np.maximum(np.hypot(*t.T)[:, None], 1e-12); n = np.stack([-t[:, 1], t[:, 0]], 1); yy = P[:, 1]
        # brush set down (the top: its up-left edge swells) and lifted (the foot: its down-right edge)
        def brush(nn): return heavy * S * .07 * (np.clip((-nn[:, 0] - nn[:, 1]) * .7, 0, None) * np.exp(-((yy - .1) / .16) ** 2) + np.clip((nn[:, 0] + nn[:, 1]) * .7, 0, None) * np.exp(-((yy - .9) / .16) ** 2))
        rL, rR = rw + brush(n), rw + brush(-n)
        # (a counter is kept open: on each side the stroke grows at most CTR of the counter's half-width beyond it)
        def room(nn):
            best = np.zeros(len(P))
            for t_ in np.arange(.004, .16, .006):
                Q_ = P + nn * (rr + t_)[:, None]; ii = np.clip(((Q_[:, 1] + oy) * R).astype(int), 0, Hh - 1); jj = np.clip(((Q_[:, 0] + ox) * R).astype(int), 0, W - 1)
                best = np.maximum(best, bg[ii, jj])
            return gsmooth(best, max(1, len(P) * .03), closed=False)
        ctr = float(os.environ.get('CTR', .45))
        rL = np.minimum(rL, rr + np.maximum(0, ctr * room(n))); rR = np.minimum(rR, rr + np.maximum(0, ctr * room(-n)))
        rL, rR = np.maximum(rL, rr), np.maximum(rR, rr)
        out += chain(P, rL, rR)
        if os.environ.get('DBG'): DBGL.append((P, rw))
    # TERMINALS at the free hairline ends (the medial axis's ends where the stroke is thin and runs a while): most finish in his
    # fat round drop, grown out of the stroke (its width only ever widening, so no neck); one or two are hooks
    nb = nd.convolve(sk.astype(int), np.ones((3, 3), int), mode='constant') - 1
    ends = [(i, j) for i, j in zip(*np.nonzero(sk & (nb == 1))) if dist[i, j] < .02]
    cx, cy = ((x0 + x1) / 2 + ox) * R, ((y0 + y1) / 2 + oy) * R; ends.sort(key=lambda e: -((e[1] - cx) ** 2 + (e[0] - cy) ** 2))
    # Third pass ("too many small knobby balls on thin stalks; his ends are fewer, fuller drops that belong to the stroke"):
    # at most MAXEND ends a letter finish in a full drop (never two within SEP: a serif's two arms take one), one of them
    # a hook; every other free hairline end is LIFTED: thickened to a blunt round end, as a brush lifting off, not a pin
    cand = []; full = []; SEP = float(os.environ.get('SEP', .2)); NF = int(E.get('ends', os.environ.get('MAXEND', 3)))
    for i, j in ends:
        p = np.array([j / R - ox, i / R - oy])
        if any(np.hypot(*(p - c_[0])) < .05 for c_ in cand): continue
        path = [(i, j)]   # back along the axis while the stroke stays thin: the spur's run
        for _ in range(int(.06 * R)):
            cur = path[-1]; nx = [(cur[0] + a, cur[1] + b) for a in (-1, 0, 1) for b in (-1, 0, 1) if (a or b) and 0 <= cur[0] + a < Hh and 0 <= cur[1] + b < W and sk[cur[0] + a, cur[1] + b] and (cur[0] + a, cur[1] + b) not in path]
            if not nx or dist[nx[0]] > .028: break
            path.append(nx[0])
        if len(path) < .022 * R: continue   # (a nub, not a hairline: left as the face drew it)
        q = np.array([path[min(len(path) - 1, 12)][1] / R - ox, path[min(len(path) - 1, 12)][0] / R - oy]); v = p - q; v /= np.hypot(*v)
        tip = p.copy()   # (the axis stops short of a pointed tip: run on to the face's real end)
        for s_ in np.arange(0, .06, .002):
            qq = p + v * s_; ii, jj = int((qq[1] + oy) * R), int((qq[0] + ox) * R)
            if not (0 <= ii < Hh and 0 <= jj < W) or not acc[ii, jj]: break
            tip = qq
        isfull = len(full) < NF and not any(np.hypot(*(p - q_)) < SEP for q_ in full)
        if isfull: full.append(p)
        cand.append((p, v, tip, path, isfull))
    if os.environ.get('NOTERM'): cand = []
    # the hook (HOOKS, default 1): of the full ends, the one reaching most sideways out of the letter (a serif's outer arm)
    fk = [k for k in range(len(cand)) if cand[k][4]]
    side_ = sorted(fk, key=lambda k: -abs(cand[k][1][0]) * (abs(cand[k][2][0] - (x0 + x1) / 2) + .2))
    hk = set(side_[:int(os.environ.get('HOOKS', 1))])
    terms = []; FP = []; cen = np.array([(x0 + x1) / 2, (y0 + y1) / 2])
    for k, (p, v, tip, path, isfull) in enumerate(cand):
        st = path[-1]; s0 = np.array([st[1] / R - ox, st[0] / R - oy]); w0 = dist[st]   # (from where the spur leaves the body)
        a0 = math.atan2(v[1], v[0])
        if k in hk:   # a hook: the hairline drawn on, turning away from the letter, filling steadily into the ball where the pen stops
            w_ = cen - tip; turn = -(np.sign(v[0] * w_[1] - v[1] * w_[0]) or 1); rb = r * rng.uniform(1.2, 1.45); Rr = rb * rng.uniform(1.0, 1.25); sweep = math.pi * rng.uniform(.7, .95)
            Lp = [s0 + (tip - s0) * u for u in np.linspace(0, 1, 10)]; c0 = tip + Rr * np.array([-math.sin(a0), math.cos(a0)]) * turn
            for u in np.linspace(0, 1, 40)[1:]: ang = a0 - turn * math.pi / 2 + turn * sweep * u; Lp.append(c0 + Rr * (1 - .3 * u) * np.array([math.cos(ang), math.sin(ang)]))
            Lp = np.array(Lp); fu = np.linspace(0, 1, len(Lp)); hw = max(w0, h * 1.8)
            wid = hw + (rb - hw) * np.clip((fu - .15) / .85, 0, 1) ** 1.2
        elif isfull:   # a drop: his full teardrop, belonging to the stroke: it fattens at once from where it leaves the body,
            # its ball near the face's tip, sinking a little (gravity in the brush)
            rb = r * rng.uniform(1.25, 1.6); L_ = max(np.hypot(*(tip - s0)), rb * 1.3) + rb * rng.uniform(0, .25)
            bend = np.array([0, 1]) * L_ * rng.uniform(.08, .2) * (1 if abs(v[0]) > .5 else 0)
            Lp = np.array([s0 + v * L_ * u + bend * u * u for u in np.linspace(0, 1, 30)])
            fu = np.linspace(0, 1, len(Lp)); wid = w0 + (rb - w0) * np.sin(fu * math.pi / 2) ** .7
        else:   # lifted: the spur thickened toward its tip into a blunt round end (no ball, no pin)
            # (the spur is cut back by CUTB of its run first, so it stops short and blunt: CUTS, applied after the union)
            Ls = np.hypot(*(tip - s0)); cb = min(Ls * float(os.environ.get('CUTB', .4)), .035); e_ = tip - v * cb; CUTS.append((tip + v * .025, cb + .025))   # (wide enough to take a tip that curls off the line)
            re_ = max(w0, h * 1.1); Lp = np.array([s0 + (e_ - s0) * u for u in np.linspace(0, 1, 20)])
            fu = np.linspace(0, 1, len(Lp)); wid = re_ * (1 - .15 * fu)   # (its own width, easing off: no knob)
        terms += chain(Lp, np.maximum(wid, w0 * .98))
        if isfull: FP.append(np.column_stack([Lp, wid]))
    if FP:   # (a cut never takes the bridge to a drop or hook)
        A_ = np.vstack(FP); CUTS[:] = [(c, rr) for c, rr in CUTS if np.min(np.hypot(*(A_[:, :2] - c).T) - A_[:, 2]) > rr + .004]
    # the face's own outline joined in, so what the strokes cannot draw (a serif's flared wedge, a crisp tip) stays the face's
    fp = to_path(C); fp.fillType = pathops.FillType.EVEN_ODD; fp.simplify(fix_winding=True)   # (even-odd, as the face was measured: its W's contours overlap)
    fa = abs(sum(area(np.array([pt for verb, ps in c_.segments for pt in ps], float)) for c_ in fp.contours if len(list(c_.segments)) > 2))
    if fa > acc.sum() / R ** 2 * 1.03: fp = None   # (a face contour that touches itself, as its W's does, fills its counters: strokes alone)
    return out + ([fp] if fp is not None else []), terms, (x0, y0, x1, y1)

def stroke_poly(P, w):   # a stroke's outline: its line offset by the half-width either side, a round cap at the end
    t = np.gradient(P, axis=0); t /= np.maximum(np.hypot(*t.T)[:, None], 1e-12); n = np.stack([-t[:, 1], t[:, 0]], 1)
    cap = [P[-1] + w[-1] * np.array([math.cos(a), math.sin(a)]) for a in np.linspace(math.atan2(n[-1, 1], n[-1, 0]), math.atan2(n[-1, 1], n[-1, 0]) - math.pi, 24)]
    return np.vstack([P + n * w[:, None], cap, (P - n * w[:, None])[::-1]])

def chain(P, rL, rR=None, step=.004):
    """a stroke as the union of tapered capsules between discs along it (each the convex hull of two discs; the brush's
    asymmetry by setting each disc off-centre toward its fuller side): convex pieces, all one winding, so their union is
    exact and never folds over itself however tight the curve"""
    from scipy.spatial import ConvexHull
    P = np.asarray(P, float); rR = rL if rR is None else rR
    d = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(P, axis=0).T))]); m = max(2, int(d[-1] / step) + 1); u = np.linspace(0, d[-1], m)
    Q = np.stack([np.interp(u, d, P[:, 0]), np.interp(u, d, P[:, 1])], 1); a_ = np.interp(u, d, rL); b_ = np.interp(u, d, rR)
    t = np.gradient(Q, axis=0) if m > 2 else np.repeat([Q[1] - Q[0]], 2, 0); t /= np.maximum(np.hypot(*t.T)[:, None], 1e-12); n = np.stack([-t[:, 1], t[:, 0]], 1)
    C = Q + n * ((a_ - b_) / 2)[:, None]; rad = (a_ + b_) / 2; ang = np.linspace(0, 2 * math.pi, 28, endpoint=False); ring = np.stack([np.cos(ang), np.sin(ang)], 1)
    out = []
    for i in range(max(1, m - 1)):
        j = min(i + 1, m - 1)
        if np.hypot(*(Q[j] - Q[i])) > step * 3: continue   # (a jump in a fitted line: not a stroke)
        pts = np.vstack([C[i] + ring * rad[i], C[j] + ring * rad[j]]); hp = pts[ConvexHull(pts).vertices]
        out.append(hp if area(hp) > 0 else hp[::-1])
    return out

def union(polys, cuts=(), after=()):
    """the pieces' union, by GEOS (shapely): robust where skia's boolean is not, on hundreds of small overlapping pieces.
    A piece is a polygon (array) or a pathops.Path (its contours combined even-odd, as the face was measured)"""
    from shapely.geometry import Polygon
    from shapely.ops import unary_union
    from shapely.validation import make_valid
    G = []
    for P in polys:
        if isinstance(P, pathops.Path):
            g = None
            for c_ in P.contours:
                q_ = np.array([pt for verb, ps in c_.segments for pt in ps], float)
                if len(q_) > 2: r_ = make_valid(Polygon(q_)); g = r_ if g is None else g.symmetric_difference(r_)
            if g is not None: G.append(g)
        elif len(P) > 2: G.append(make_valid(Polygon(np.asarray(P, float))))
    U = unary_union(G); res = []
    if cuts:
        from shapely.geometry import Point
        U = U.difference(unary_union([Point(*c).buffer(rr, 32) for c, rr in cuts])).union(unary_union(G[-len(after):]) if after else Polygon())
    big = max((g.area for g in getattr(U, 'geoms', [U])), default=0)
    for poly in getattr(U, 'geoms', [U]):
        if poly.geom_type != 'Polygon' or poly.area < max(1e-7, big * .03): continue   # (no stray islands)
        res.append(np.array(poly.exterior.coords[:-1])); res += [np.array(r.coords[:-1]) for r in poly.interiors if len(r.coords) > 3]
    return res

if __name__ == '__main__':
    a = sys.argv[1:]; font, outd = a[0], a[1]; want = a[2] if len(a) > 2 else 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; seed = int(a[3]) if len(a) > 3 else 7
    os.makedirs(outd, exist_ok=True); fam = TTFont(font)['name'].getDebugName(1)
    for ch in want:
        CUTS.clear(); body, hooks, box = hand(font, ch, seed, os.environ.get('REF', 'I'))
        Uc = union(body + hooks, CUTS, hooks)   # (the cut-back spurs: the terminals are laid again after the cuts)
        cont = []
        for pts in Uc:   # (the strokes and terminals, all ink: their union makes the counters)
            if len(pts) > 2:
                c = resample(np.asarray(pts, float), .0025); a_ = c - np.roll(c, 1, 0); b_ = np.roll(c, -1, 0) - c
                turn = np.abs(np.arctan2(a_[:, 0] * b_[:, 1] - a_[:, 1] * b_[:, 0], np.sum(a_ * b_, 1)))
                keep = nd.maximum_filter1d((turn > math.radians(55)).astype(float), 3, mode='wrap')[:, None]
                cont.append(c * keep + gsmooth(c, 2.5) * (1 - keep))   # (creases where a drop meets the body rounded; real corners kept)
        # (a tail that would run into the next line of text, J's and Y's: the letter set a little smaller, so its ink ends
        # at most DESC below the baseline, as a drop's ink must)
        yb = max(c[:, 1].max() for c in cont); dsc = float(os.environ.get('DESC', .09))
        if yb > 1 + dsc: k = (1 + dsc) / yb; cont = [c * k for c in cont]
        xs = np.concatenate([c[:, 0] for c in cont]); xl, xr = xs.min(), xs.max()
        curves = []
        for c in cont:   # each contour: its start point, then each cubic as c1x c1y c2x c2y x y
            F = fit_contour(c, .0009); curves.append([[round(v, 5) for v in F[0][0] - [xl, 0]]] + [[round(v, 5) for v in (C[1:] - [xl, 0]).ravel()] for C in F])
        polys = [[[round(x - xl, 4), round(y, 4)] for x, y in c[::2]] for c in cont]
        json.dump({'name': ch, 'char': ch, 'src': f'{fam} (the shape) + the Lewis E 73 hand (tools/lombhand.py), seed {seed}', 'a': round(xr - xl, 4), 'curves': curves, 'polys': polys}, open(f'{outd}/{ch}.json', 'w'))
        print(ch, round(xr - xl, 3), sum(len(cc) - 1 for cc in curves), 'cubics', end='  ', flush=True)
    print()
