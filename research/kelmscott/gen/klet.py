# klet: Morris's white-vine capitals as strokes held to his measured profiles (units: the block's height; width A).
# Measured (meas_strokes.py, rays from hand-placed centre-lines through his letter white, 700 px blocks):
#   main stem waist .10-.11 (K .105, P .110, L .102), heavy .12-.13 (I, H); secondary stem .05-.07 (L's right upright)
#   foot flare: width climbs from the waist over the last ~.14 of the stem, concave (z^2.2), to .17-.22 (K .216, P .193,
#     I .171; L .32 is his widest), tips lifted ~.015 above the foot's middle (a concave foot)
#   bars (L head): a lozenge peaking .07-.08 at ~.6 of its length, .04 at the tips; T's head heavy at the root .16-.22
#   bowls: crescents, thickest at the lower left (O .13-.14, C .10-.11, T .15), .02-.05 at the tips
#   diagonals: K arm .085-.10, leg ~.10; V's thick stroke .15-.17 under its head wedge
#   notches + hairline cuts: dips to ~.6 of the stem's width (I, H), a black hairline inside the edge joined to it by bites
import numpy as np, math, sys, os
from PIL import Image, ImageDraw
from scipy import ndimage as nd

R = 1400; A = .95; RW = int(R * A)
P0 = dict(waist=.105, heavy=.125, second=.06, foot=.20, lf=.17, fp=1.9, cave=-.008, bar=.075, bowl=.12, diag=.10, edge=.0009, edge_s=.035, facet=.0035)

def resample(P, step=.003):
    P = np.asarray(P, float); d = np.r_[0, np.cumsum(np.hypot(*np.diff(P, axis=0).T))]; t = np.arange(0, d[-1] + 1e-9, step)
    return np.stack([np.interp(t, d, P[:, 0]), np.interp(t, d, P[:, 1])], 1), d[-1]

def bez(*P, n=80):
    P = np.array(P, float); t = np.linspace(0, 1, n)[:, None]
    if len(P) == 3: return (1 - t) ** 2 * P[0] + 2 * (1 - t) * t * P[1] + t ** 2 * P[2]
    return (1 - t) ** 3 * P[0] + 3 * (1 - t) ** 2 * t * P[1] + 3 * (1 - t) * t ** 2 * P[2] + t ** 3 * P[3]

class Stroke:
    def __init__(s, P):
        s.Q, s.S = resample(P); n = len(s.Q); s.s = np.linspace(0, s.S, n)
        d = np.gradient(s.Q, axis=0); d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-12
        s.d = d; s.nv = np.stack([d[:, 1], -d[:, 0]], 1)   # left of travel (y down)
        s.l = np.zeros(n); s.r = np.zeros(n); s.caps = [None, None]
    def at(s, t, side, inset=0.):
        i = min(len(s.Q) - 1, int(t * (len(s.Q) - 1))); o = (s.l[i] if side > 0 else s.r[i]) - inset
        return s.Q[i] + side * s.nv[i] * o, s.d[i], s.nv[i] * side
    def poly(s):
        Lp = s.Q + s.nv * s.l[:, None]; Rp = s.Q - s.nv * s.r[:, None]
        out = list(Lp)
        if s.caps[1] is not None: out += list(s.caps[1](Lp[-1], Rp[-1], s.d[-1]))
        out += list(Rp[::-1])
        if s.caps[0] is not None: out += list(s.caps[0](Rp[0], Lp[0], -s.d[0]))
        return out

def concave_cap(c):
    """the end of a flared stroke: a chord bowed inward by c (his foot: tips lifted, middle down)"""
    def f(a, b, d):
        bl = .013; a2, b2 = a + d * bl, b + d * bl   # his tips are blunt: cut off by a short face, not needles
        m = (a2 + b2) / 2 + d * c
        return [a2] + [a2 + (m - a2) * k for k in np.linspace(.2, 1, 4)] + [m + (b2 - m) * k for k in np.linspace(0, .8, 4)] + [b2]
    return f

def stem(P, w=P0['waist'], foot=(P0['foot'], P0['foot']), head=(None, None), lf=P0['lf'], lf0=None, fp=P0['fp'], waist=.92, cave=P0['cave'], point=(False, False), asym=.22):
    """an upright or diagonal: waisted, flared concave into its ends. foot/head: (left, right) total half-widths at that end"""
    s = Stroke(P); u = s.s / s.S
    h = w / 2 * (waist + (1 - waist) * np.abs(2 * u - 1) ** 2); s.l[:] = h; s.r[:] = h
    lf0 = lf0 or lf
    for end, fl, L_ in ((0, head, lf0), (1, foot, lf)):
        if fl is None or fl[0] is None: continue
        dist = s.s if end == 0 else s.S - s.s; zl = np.clip(1 - dist / (L_ * (1 - asym)), 0, 1) ** fp; zr = np.clip(1 - dist / (L_ * (1 + asym)), 0, 1) ** fp
        s.l += (fl[0] - h) * zl; s.r += (fl[1] - h) * zr   # (his two sides flare from different heights)
        s.caps[end] = concave_cap(cave)
    for end in (0, 1):
        if point[end]:
            dist = s.s if end == 0 else s.S - s.s; k = np.clip(dist / .05, 0, 1) ** .7; s.l *= k; s.r *= k; s.caps[end] = None
    return s

def crescent(P, wmax=P0['bowl'], peak=.6, tips=(.012, .012), shape=1.):
    """a bowl or bar: thickest at `peak` (fraction of its length), tapering to its tips"""
    s = Stroke(P); u = s.s / s.S
    a = np.where(u < peak, u / peak, (1 - u) / (1 - peak)); a = np.sin(a * math.pi / 2) ** shape
    t0 = np.where(u < peak, tips[0], tips[1]); h = (t0 + (wmax - t0) * a) / 2; s.l[:] = h; s.r[:] = h
    return s

def widen(s, side, t0, t1, amt, p=2.):
    """push one side out between t0 and t1 (a bowl's stress set off-centre)"""
    u = s.s / s.S; z = np.clip((u - t0) / (t1 - t0), 0, 1); z = np.sin(z * math.pi) ** p
    if side > 0: s.l += amt * z
    else: s.r += amt * z

def wedge(a, b, c, bow=.25):
    """a detached head (K's inverted triangle, a serif): three corners, sides bowed inward"""
    P = []
    for p, q, o in ((a, b, c), (b, c, a), (c, a, b)):
        p, q, o = map(np.array, (p, q, o)); m = (p + q) / 2; m = m + (o - m) * bow * .5
        P += list(bez(p, m, q, n=20))[:-1]
    return P

# ---- the letters (centre-lines read in his idiom; L C P K read off his blocks, E G R X Y composed from his strokes) ------
def L_L(p):
    S = []
    s = stem([(.215, .40), (.222, .842)], p['waist'], foot=(p['foot'] * .7, p['foot'] * .95), head=(.07, .06), lf0=.05); S.append(s)
    S.append(crescent(bez((.09, .125), (.25, .14), (.47, .115)), p['bar'], peak=.6, tips=(.03, .02), shape=.45))
    s2 = stem([(.665, .48), (.668, .855)], p['second'], foot=(p['foot'] * .75, p['foot'] * .8), point=(True, False)); S.append(s2)
    D = [('cut', 0, .30, .62, -1, .03), ('notch', 0, .08, 1, .016), ('notch', 2, .35, -1, .012)]
    return S, D

def L_K(p):
    S = []
    S.append(stem([(.22, .32), (.225, .845)], p['waist'], foot=(p['foot'] * .58, p['foot'] * .55), head=(.065, .07), lf0=.05))
    S.append(wedge((.10, .115), (.35, .108), (.29, .245)))
    S.append(stem([(.745, .118), (.385, .435)], p['diag'], head=(p['foot'] * .55, p['foot'] * .45), foot=(None, None), lf0=.12))
    S.append(clip(stem(bez((.39, .44), (.56, .55), (.67, .68), (.75, .865)), p['diag'] * 1.05, foot=(p['foot'] * .5, p['foot'] * .45), lf=.13), None, .845))
    D = [('notch', 0, .2, -1, .014), ('cut', 0, .52, .80, 1, .028), ('notch', 3, .45, 1, .012)]
    return S, D

def L_P(p):
    S = []
    S.append(stem([(.20, .40), (.22, .862)], p['waist'], foot=(p['foot'] * .55, p['foot'] * .55), head=(.05, .045), lf0=.04))
    b = crescent(bez((.47, .13), (.70, .12), (.86, .20), (.83, .30)), p['bar'] * 1.1, peak=.45, tips=(.05, .02)); S.append(b)
    S.append(crescent(bez((.80, .40), (.88, .46), (.87, .53), (.84, .58)), p['waist'] * .95, peak=.5, tips=(.07, .04)))
    D = [('notch', 0, .55, 1, .014), ('cut', 0, .25, .5, -1, .028)]
    return S, D

def L_C(p):
    S = []
    b = crescent(bez((.88, .30), (.86, .02), (.25, .02), (.12, .40)), p['bowl'] * .85, peak=.8, tips=(.02, .09)); S.append(b)
    b2 = crescent(bez((.12, .40), (.03, .66), (.22, .93), (.59, .915)), p['bowl'] * 1.15, peak=.3, tips=(.07, .03)); S.append(b2)
    S.append(wedge((.03, .95), (.145, .785), (.17, .935), bow=.08))   # his spur at the foot of the bowl
    D = [('over', 0, .25, .9), ('over', 1, .62, -.5), ('notch', 1, .22, 1, .014)]
    return S, D

# composed in his idiom from his own strokes
def L_E(p):   # uncial: his C's bowl, the bar of his L at its middle, his C's top hook
    S, D = L_C(p)
    S.append(stem([(.10, .505), (.53, .50)], p['bar'] * .95, foot=(.075, .06), lf=.10, waist=.85))   # his bar, flared into a wedge
    return S, D + [('notch', 2, .45, 1, .011)]

def L_G(p):   # his C, and from the end of its lower bowl a short upright (his L's right upright) capped with his bar
    S, D = L_C(p)
    S[1] = crescent(bez((.12, .40), (.03, .66), (.22, .93), (.66, .89)), p['bowl'] * 1.15, peak=.3, tips=(.07, .06))
    S.append(stem([(.70, .55), (.69, .90)], p['second'] * 1.3, head=(.075, .05), foot=(.04, .035), lf0=.09, lf=.06))
    S.append(wedge((.57, .52), (.78, .515), (.70, .585), bow=.2))
    return S, D

def L_R(p):   # his P with his K's leg from the foot of the bowl
    S = []
    S.append(stem([(.21, .26), (.22, .862)], p['waist'], foot=(p['foot'] * .55, p['foot'] * .55), head=(.07, .06), lf0=.06))
    S.append(crescent(bez((.27, .14), (.64, .06), (.98, .32), (.40, .47)), p['bar'] * 1.25, peak=.62, tips=(.03, .05)))
    widen(S[-1], -1, .3, .85, .025)
    S.append(clip(stem(bez((.40, .46), (.56, .56), (.68, .70), (.78, .88)), p['diag'] * 1.05, foot=(p['foot'] * .5, p['foot'] * .45), lf=.13), None, .862))
    D = [('notch', 0, .45, 1, .014), ('cut', 0, .2, .45, -1, .028), ('over', 1, .55, .6), ('notch', 2, .5, 1, .012)]
    return S, D

def L_X(p):   # the broad nib's pair: his V's heavy stroke \ and a thin / , both flared
    S = []
    S.append(clip(stem(bez((.12, .08), (.38, .42), (.55, .66), (.82, .89)), p['diag'] * 1.2, head=(.14, .05), foot=(.06, .13), lf=.15, lf0=.16, fp=3.2), .10, .86))
    S.append(clip(stem(bez((.82, .08), (.62, .35), (.36, .64), (.13, .89)), p['second'] * .9, head=(.04, .09), foot=(.10, .05), lf=.12, lf0=.12), .11, .86))
    D = [('over', 1, .5, 1.2), ('notch', 0, .3, 1, .013), ('notch', 0, .7, -1, .013)]
    return S, D

def L_Y(p):   # his V's head (heavy \ and the thin arm) on his I's stem
    S = []
    S.append(clip(stem(bez((.13, .07), (.28, .26), (.40, .42), (.475, .56)), p['diag'] * 1.2, head=(.14, .05), foot=None, lf0=.16, fp=3.2), .09, None))
    S.append(clip(stem(bez((.84, .07), (.70, .22), (.56, .38), (.47, .56)), p['second'] * .9, head=(.04, .09), foot=None, lf0=.12), .10, None))
    S.append(stem([(.475, .50), (.47, .862)], p['waist'], foot=(p['foot'] * .58, p['foot'] * .58), lf=.14))
    D = [('notch', 2, .35, 1, .013), ('cut', 2, .3, .6, -1, .028)]
    return S, D

LETTERS = dict(L=L_L, K=L_K, P=L_P, C=L_C, E=L_E, G=L_G, R=L_R, X=L_X, Y=L_Y)

def T(q): return [(x * R, y * R) for x, y in q]

def clip(s, y0=None, y1=None):
    """his diagonals sit on the line: the flared end cut level (top at y0, foot at y1)"""
    s.clip = (y0, y1); return s

def render(ch, p=P0, seed=1, over=True):
    rng = np.random.default_rng(seed); S, D = LETTERS[ch](p)
    strokes = [s for s in S if isinstance(s, Stroke)]; layers = {}
    for s in S:
        lay = Image.new('L', (RW, R), 0); ImageDraw.Draw(lay).polygon(T(s.poly() if isinstance(s, Stroke) else s), fill=255)
        layers[id(s)] = lay
    hw = max(2, int(.0045 * R))
    for det in D:
        kind, i = det[0], det[1]; s = strokes[i] if i < len(strokes) else None
        if s is None: continue
        d = ImageDraw.Draw(layers[id(s)])
        if kind == 'cut':   # a black hairline just inside one edge, joined to it by a bite at its lower end
            _, _, t0, t1, side, inset = det; pts = [s.at(t, side, inset)[0] for t in np.linspace(t0, t1, 20)]
            w_ = np.maximum(1, hw * np.sin(np.linspace(.15, 3.0, 20)))
            for a, b, ww in zip(pts[:-1], pts[1:], w_): d.line(T([a, b]), fill=0, width=int(ww))
            p1, dd, nn = s.at(t1, side); q = p1 - nn * inset * 1.1
            d.polygon(T([p1 + dd * .004, p1 - dd * .004, q]), fill=0)
        elif kind == 'notch':   # a triangular bite from one edge
            _, _, t, side, sz = det; p1, dd, nn = s.at(t, side)
            d.polygon(T([p1 - dd * sz * .3, p1 + dd * sz * 1.2, p1 - nn * sz + dd * sz * .1]), fill=0)
        elif kind == 'over' and over:   # a vine passes over the stroke: a band (his vine and its outlines) cut from it
            _, _, t, ang = det; p1, dd, nn = s.at(t, 1, 0); c = p1 - nn * s.l[int(t * (len(s.Q) - 1))]
            a = math.atan2(dd[1], dd[0]) + math.pi / 2 + ang * .5; u = np.array([math.cos(a), math.sin(a)]); v = np.array([-u[1], u[0]])
            g = .028
            d.polygon(T([c - v * g - u * .2, c - v * g + u * .2, c + v * g + u * .2, c + v * g - u * .2]), fill=0)
    m = np.zeros((R, RW), bool)
    for s in S:
        a = np.asarray(layers[id(s)]) > 127
        cl = getattr(s, 'clip', None)
        if cl:
            if cl[0] is not None: a[:int(cl[0] * R)] = False
            if cl[1] is not None: a[int(cl[1] * R):] = False
        m |= a
    im = None
    # the cut edge: low-frequency wander of his amplitude
    sd = nd.distance_transform_edt(m) - nd.distance_transform_edt(~m)
    nz = nd.gaussian_filter(rng.normal(size=m.shape), p['edge_s'] * R); nz *= p['edge'] * R / (nz.std() + 1e-9)
    m = sd + nz > 0
    if p.get('facet'):
        from skimage.measure import find_contours, approximate_polygon
        im2 = Image.new('L', (RW, R), 0); d2 = ImageDraw.Draw(im2); acc = np.zeros_like(m)
        for ct in find_contours(np.pad(m.astype(float), 1), .5):
            ct = approximate_polygon(ct - 1, p['facet'] * R)
            if len(ct) < 3: continue
            lay = Image.new('L', (RW, R), 0); ImageDraw.Draw(lay).polygon([(x, y) for y, x in ct], fill=255); acc ^= np.asarray(lay) > 127
        m = nd.gaussian_filter(acc.astype(float), .0015 * R) > .5   # (the knife's corners just eased)
    return np.asarray(Image.fromarray(m.astype(np.uint8) * 255).resize((round(700 * A), 700), Image.LANCZOS)) > 127

if __name__ == '__main__':
    for ch in sys.argv[1]:
        m = render(ch); Image.fromarray(((~m) * 255).astype(np.uint8)).save(f'out_{ch}.png')
