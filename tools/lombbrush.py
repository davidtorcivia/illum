# tools/lombbrush.py: the choir-book Lombard, fourth pass ("blobby, bad ends and joins; computer assembly, not intentional
# strokes"). The third pass (tools/lombhand.py) redrew every member as a chain of capsules and took the union with the face and
# the terminals: wherever two pieces overlapped the outline bulged, joins were lumpy and drops sat stuck on. Here nothing is
# united as pieces. The letter is ONE signed distance field, shaped as a brush shapes paint:
#   body     the face's own outline (George Williams' Lombardic: the designed skeleton, joins and serif wedges), its distance
#            field moved out by a smooth weight field: each heavy member carried toward his full paint (.095 H half-width),
#            hairlines left as drawn, the gain spread smoothly along the member (so a stroke swells and thins as one sure
#            stroke) and held back where a counter or gap is narrow (so nothing closes)
#   ends     every free hairline end decided once: a full drop (the brush turned and lifted: a teardrop whose width grows from the
#            hairline's own, laid along the end's run and sinking a little), at most MAXEND a letter, never two within SEP; one
#            hook at most (the hairline drawn on round a turn into its drop); the rest a blunt brush end, the spur cut back; short
#            spurs and whiskers (the face's small nibs) cut away
#   joins    every addition is joined by a smooth minimum (Inigo Quilez's polynomial smin) of radius K: a fillet of controlled
#            radius where a drop leaves its hairline, never a crease or a bump where outlines cross
#   finish   the field smoothed once at the scale of the brush's edge (so its outline has no pixel steps), its zero set taken
#            with subpixel marching squares at R px per H, and fitted with cubic Beziers (Schneider, tolerance .0007 H)
# The rasters are fields sampled at 1/R H; the output is the fitted vector outline, as lombfont.py takes it ('curves').
# usage: uv run --with pillow --with numpy --with scipy --with scikit-image --with fonttools --with skia-pathops --with shapely
#          python -I tools/lombbrush.py FONT OUTDIR [LETTERS] [SEED]     env: R=1100 MAXEND=3 SEP=.22 K=.014 FULL=1.1
import sys, os, json, math
import numpy as np
from scipy import ndimage as nd
from skimage.morphology import medial_axis
from skimage import measure
from PIL import Image, ImageDraw
from fontTools.ttLib import TTFont
import pathops
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lombhand import Flat, EDIT, to_path, from_path, fit_contour, resample, gsmooth, area
S, h, r0 = .085, .016, .038
E_ = lambda k, d: float(os.environ.get(k, d))

def smin(a, b, k):   # polynomial smooth minimum (Quilez): the union of two fields with a fillet of radius ~k
    hh = np.clip(.5 + .5 * (b - a) / k, 0, 1); return b * (1 - hh) + a * hh - k * hh * (1 - hh)
def smax(a, b, k): return -smin(-a, -b, k)

# (the face's own J, a hook curving left below the line, and its uncial Y, forked arms on a stem whose tail descends and turns:
# the third pass wrote J as I and cut Y's tail at the line, so they read as I and V)
EDIT2 = {**EDIT, 'J': {}, 'Y': {}}
def outline(font, ch, ref='I'):
    f = TTFont(font); gs = f.getGlyphSet(); cm = f.getBestCmap(); E = EDIT2.get(ch, {})
    pen = Flat(gs); gs[cm[ord(ref)]].draw(pen); Rf = np.vstack([np.array(c) for c in pen.C]); top, bot = Rf[:, 1].max(), Rf[:, 1].min(); U = top - bot
    pen = Flat(gs); gs[cm[ord(E.get('src', ch))]].draw(pen)
    C = [np.stack([np.array(c)[:, 0] / U, (top - np.array(c)[:, 1]) / U], 1) for c in pen.C if len(c) > 2]
    if E.get('cut'):
        P = to_path(C); P.simplify(fix_winding=True)
        for bx in E['cut']: P = pathops.op(P, to_path([bx]), pathops.PathOp.DIFFERENCE)
        C = [c for c in from_path(P) if len(c) > 2]
    return C, E

# ends he finishes blunt, where a drop would stand beside the face's beak or float on a stalk (boxes x0, y0, x1, y1 in H, the
# face's own coordinates)
BLUNT = {'S': [(.45, -.2, 1.3, .4)], 'G': [(.55, -.2, 1.4, .4)], 'F': [(.5, -.2, 1.3, .35)], 'C': [(.55, -.2, 1.4, .4)], 'P': [(.3, -.3, .75, .12)], 'K': [(.55, -.2, 1.4, .3)]}
def letter(font, ch, seed):
    rng = np.random.default_rng([seed, ord(ch)]); C, E = outline(font, ch)
    R = int(E_('R', 1100)); pad = .3
    x0 = min(c[:, 0].min() for c in C) - pad; y0 = min(c[:, 1].min() for c in C) - pad; x1 = max(c[:, 0].max() for c in C) + pad; y1 = max(c[:, 1].max() for c in C) + pad + .1
    W, Hh = int((x1 - x0) * R), int((y1 - y0) * R)
    acc = np.zeros((Hh, W), bool)
    for c in C:   # (even-odd, as the face is drawn; supersampled edges come from the field, not the mask)
        m = Image.new('1', (W, Hh), 0); ImageDraw.Draw(m).polygon([((x - x0) * R, (y - y0) * R) for x, y in c], fill=1); acc ^= np.asarray(m)
    # 1. THE FACE CLEANED: its hairline spurs (the nibs, flicks and serif hairs that end free) parted from its hairline joins.
    # The face opened by a disc of radius RO keeps only its members; what the opening took is hairline. A piece of it that
    # meets the members in two places (or more) is a join and stays; one that meets them once is a spur: it goes, and the
    # longest of them are where the drops will be painted.
    RO = E_('RO', .013); din0 = nd.distance_transform_edt(acc) / R
    opened = nd.distance_transform_edt(~(din0 > RO)) / R <= RO
    thin = acc & ~opened; lab, n = nd.label(thin, structure=np.ones((3, 3)))
    near = nd.binary_dilation(opened, iterations=2); keep = opened.copy(); spurs = []; holes0 = nd.label(~acc)[1]
    for k in range(1, n + 1):
        comp = lab == k; touch = comp & near; tl, tn = nd.label(touch, structure=np.ones((3, 3)))
        if tn >= 2: keep |= comp; continue
        # (a hairline that closes a counter is a join, however it meets the members: taking it would open the counter)
        if nd.label(~(acc & ~comp))[1] != holes0: keep |= comp; continue
        ys, xs = np.nonzero(comp); 
        if tn == 0: continue
        ty, tx = np.nonzero(touch); base = np.array([tx.mean() / R + x0, ty.mean() / R + y0])
        P = np.stack([xs / R + x0, ys / R + y0], 1); dd = np.hypot(*(P - base).T); far = P[np.argmax(dd)]; ext = dd.max()
        if ext < .012: continue   # (a nib or a sliver: gone, the member's edge is the brush's)
        spurs.append((base, far, ext))
    acc = keep
    din = nd.distance_transform_edt(acc) / R; dout = nd.distance_transform_edt(~acc) / R
    F = np.where(acc, -din + .5 / R, dout - .5 / R)   # the cleaned face's signed distance (negative inside), in H
    F = nd.gaussian_filter(F, 1.2)
    # 2. THE WEIGHT: the face's half-width along its medial axis, carried toward his full paint where it is heavy
    sk, dist = medial_axis(acc, return_distance=True); dist = dist / R
    full = S * E_('FULL', 1.22)
    t = np.clip((dist - .028) / .02, 0, 1); t = t * t * (3 - 2 * t)
    gain = np.where(sk, t * np.maximum(0, full - dist), 0)
    for bx, tw in E.get('bold', []):   # (a member he paints heavier than the face draws it)
        yy, xx = np.nonzero(sk); px, py = xx / R + x0, yy / R + y0
        inb = (px >= bx[0, 0]) & (px <= bx[1, 0]) & (py >= bx[0, 1]) & (py <= bx[2, 1]); gain[yy[inb], xx[inb]] = np.maximum(gain[yy[inb], xx[inb]], tw - dist[yy[inb], xx[inb]])
    _, (iy, ix) = nd.distance_transform_edt(~sk, return_indices=True); G = gain[iy, ix]
    G = nd.gaussian_filter(G, .07 * R)
    room = nd.maximum_filter(dout, size=int(.09 * R)); room = nd.gaussian_filter(room, .06 * R)
    G = np.minimum(G, E_('CTR', .42) * room)
    yy = (np.arange(Hh)[:, None] / R + y0); G = G * (1 - .06 * np.exp(-((yy - .42) / .22) ** 2))
    D = F - G
    # (no hairline thinner than the pen's: every member at least HMIN wide about its axis, so a fine join never breaks)
    D = np.minimum(D, nd.distance_transform_edt(~sk) / R - E_('HMIN', .0072))
    # 3. THE ENDS: of the spurs, at most MAXEND (never two within SEP, none where he finishes blunt) painted as full drops
    # grown out of the member they left, one of them a hook; the rest are gone (the member's own end is the brush's finish)
    NF = int(E.get('ends', E_('MAXEND', 3))); SEP = E_('SEP', .22); K = E_('K', .014)
    cx_ = (x0 + x1) / 2; spurs.sort(key=lambda q: -(abs(q[1][0] - cx_) + abs(q[1][1] - .5)))
    chosen = []; bb = [min(c[:, 0].min() for c in C), min(c[:, 1].min() for c in C), max(c[:, 0].max() for c in C), max(c[:, 1].max() for c in C)]
    edge = lambda q: min(q[0] - bb[0], bb[2] - q[0], q[1] - bb[1], bb[3] - q[1])
    # (a drop is painted only where a spur reaches out to the letter's edge, never inside it; the head and the foot by turns,
    # so a letter with drops above has one below too)
    top = [q for q in spurs if edge(q[1]) < .12 and q[1][1] < .5]; bot = [q for q in spurs if edge(q[1]) < .12 and q[1][1] >= .5]
    spurs = [q for pair in zip(top + [None] * len(bot), bot + [None] * len(top)) for q in pair if q is not None]
    for base, far, ext in spurs:
        if ext < .03 or len(chosen) >= NF or any(np.hypot(*(far - c[1])) < SEP for c in chosen): continue
        if any(bx[0] <= far[0] <= bx[2] and bx[1] <= far[1] <= bx[3] for bx in BLUNT.get(ch, [])): continue
        chosen.append((base, far, ext))
    if os.environ.get('DBG'): print(ch, 'spurs', [(np.round(f, 2).tolist(), round(e, 3)) for b_, f, e in spurs], 'chosen', len(chosen))
    side = sorted(range(len(chosen)), key=lambda k: -abs(chosen[k][1][0] - chosen[k][0][0]) / (chosen[k][2] + 1e-9)); hook = set(side[:int(E_('HOOKS', 0))]) if E.get('hook', True) else set()
    X = (np.arange(W) / R + x0)[None, :]; Y = (np.arange(Hh) / R + y0)[:, None]
    def stroke_sdf(pts, wid):   # a tapered stroke's distance (negative inside), as the envelope of its discs
        out = np.full((Hh, W), 9.0); m = wid.max() + .05; b0 = [pts[:, 0].min() - m, pts[:, 1].min() - m, pts[:, 0].max() + m, pts[:, 1].max() + m]
        j0, j1 = max(0, int((b0[0] - x0) * R)), min(W, int((b0[2] - x0) * R)); i0, i1 = max(0, int((b0[1] - y0) * R)), min(Hh, int((b0[3] - y0) * R))
        sub = out[i0:i1, j0:j1]; Xs, Ys = X[:, j0:j1], Y[i0:i1, :]
        for (px, py), w in zip(pts, wid): np.minimum(sub, np.hypot(Xs - px, Ys - py) - w, out=sub)
        return out
    w0 = h * .55
    for k, (base, far, ext) in enumerate(chosen):
        v = (far - base) / ext; tip = far; a0 = math.atan2(v[1], v[0])
        if k in hook:   # the hairline drawn on round a turn, filling steadily into its drop
            w_ = np.array([cx_, (y0 + y1) / 2]) - tip; turn = -(np.sign(v[0] * w_[1] - v[1] * w_[0]) or 1)
            rb = r0 * rng.uniform(1.2, 1.4); Rr = rb * rng.uniform(1.05, 1.2); sweep = math.pi * rng.uniform(.75, .95)
            c0 = tip + Rr * np.array([-math.sin(a0), math.cos(a0)]) * turn
            pts = [base + (tip - base) * u for u in np.linspace(0, 1, 30)] + [c0 + Rr * (1 - .3 * u) * np.array([math.cos(a0 - turn * math.pi / 2 + turn * sweep * u), math.sin(a0 - turn * math.pi / 2 + turn * sweep * u)]) for u in np.linspace(0, 1, 120)[1:]]
            pts = np.array(pts); fu = np.linspace(0, 1, len(pts)); wid = w0 * 1.3 + (rb - w0 * 1.3) * np.clip((fu - .2) / .8, 0, 1) ** 1.3
        else:   # a full drop: out of the member along the spur's way, swelling at once, its ball at the spur's end, sinking a little
            rb = r0 * rng.uniform(1.3, 1.6); L_ = max(ext, rb * 1.5)
            bend = np.array([0, 1]) * L_ * rng.uniform(.06, .16) * (1 if abs(v[0]) > .5 else 0)
            pts = np.array([base + v * L_ * u + bend * u * u for u in np.linspace(0, 1, 90)]); fu = np.linspace(0, 1, len(pts))
            wid = w0 + (rb - w0) * np.sin(fu * math.pi / 2) ** .85
        D = smin(D, stroke_sdf(pts, wid), K)
    D = nd.gaussian_filter(D, E_('SMOOTH', .0045) * R)   # (the brush's edge: no pixel steps, no crease)
    cs = measure.find_contours(D, 0.0)
    cont = []
    for c in cs:
        P = np.stack([c[:, 1] / R + x0, c[:, 0] / R + y0], 1)
        if len(P) < 8 or abs(area(P)) < 2e-4: continue
        cont.append(resample(P[:-1], .002))
    return cont

if __name__ == '__main__':
    a = sys.argv[1:]; font, outd = a[0], a[1]; want = a[2] if len(a) > 2 else 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; seed = int(a[3]) if len(a) > 3 else 7
    os.makedirs(outd, exist_ok=True); fam = TTFont(font)['name'].getDebugName(1)
    for ch in want:
        cont = letter(font, ch, seed)
        yb = max(c[:, 1].max() for c in cont); dsc = E_('DESC', .2)   # (a tail may run a fifth of the letter below the line: J's hook, Y's tail; then the letter is set smaller)
        if yb > 1 + dsc: k = (1 + dsc) / yb; cont = [c * k for c in cont]
        xs = np.concatenate([c[:, 0] for c in cont]); xl, xr = xs.min(), xs.max()
        curves = []
        for c in cont:
            F = fit_contour(c, E_('TOL', .0007), corner=60); curves.append([[round(v, 5) for v in F[0][0] - [xl, 0]]] + [[round(v, 5) for v in (C_[1:] - [xl, 0]).ravel()] for C_ in F])
        polys = [[[round(x - xl, 4), round(y, 4)] for x, y in c[::2]] for c in cont]
        json.dump({'name': ch, 'char': ch, 'src': f'{fam} (the shape) + the Lewis E 73 hand as one brush field (tools/lombbrush.py), seed {seed}', 'a': round(xr - xl, 4), 'curves': curves, 'polys': polys}, open(f'{outd}/{ch}.json', 'w'))
        print(ch, round(xr - xl, 3), sum(len(cc) - 1 for cc in curves), 'cubics', end='  ', flush=True)
    print()
