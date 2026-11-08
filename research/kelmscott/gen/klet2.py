# klet2: Morris's white-vine capitals, all 26 in one hand. Units: the block's height (the block is A wide).
# Character measured from his 16 blocks (meas_strokes.py, notch.py, rough.py; see klet.py's header): stems .10-.13 at the
# waist, a second stem .05-.07, feet .17-.32 wide, bars ~.075, bowls thickest at the lower left (.10-.15), notches ~1 per
# unit of outline. Drawn for beauty over strict match (the user's rule): flares are cut in a few straight facets, each side
# its own, tips blunt and uneven; bars flat on top and bellied beneath; hooks curl off the ends as his tails do.
import numpy as np, math, sys
from PIL import Image, ImageDraw
from scipy import ndimage as nd

R = 1400; A = .95; RW = int(R * A)
W, H_, S2, B, BW = .11, .13, .06, .075, .13
RNG = np.random.default_rng(0)
def J(a, b): return float(RNG.uniform(a, b))

def resample(P, step=.003):
    P = np.asarray(P, float); d = np.r_[0, np.cumsum(np.hypot(*np.diff(P, axis=0).T))]; t = np.arange(0, d[-1] + 1e-9, step)
    return np.stack([np.interp(t, d, P[:, 0]), np.interp(t, d, P[:, 1])], 1), d[-1]

def bez(*P, n=80):
    P = np.array(P, float); t = np.linspace(0, 1, n)[:, None]
    if len(P) == 3: return (1 - t) ** 2 * P[0] + 2 * (1 - t) * t * P[1] + t ** 2 * P[2]
    return (1 - t) ** 3 * P[0] + 3 * (1 - t) ** 2 * t * P[1] + 3 * (1 - t) * t ** 2 * P[2] + t ** 3 * P[3]

class Stroke:
    def __init__(s, P):
        s.Q, s.S = resample(P); n = len(s.Q); s.s = np.linspace(0, s.S, n); s.u = s.s / max(s.S, 1e-9)
        d = np.gradient(s.Q, axis=0); d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-12
        s.d = d; s.nv = np.stack([d[:, 1], -d[:, 0]], 1); s.l = np.zeros(n); s.r = np.zeros(n); s.caps = [None, None]; s.clip = None
    def tip(s, end, side):
        i = 0 if end == 0 else -1; o = s.l[i] if side > 0 else s.r[i]
        return s.Q[i] + side * s.nv[i] * o, s.d[i]
    def at(s, t, side):
        i = min(len(s.Q) - 1, int(t * (len(s.Q) - 1))); o = s.l[i] if side > 0 else s.r[i]
        return s.Q[i] + side * s.nv[i] * o, s.d[i], s.nv[i] * side
    def poly(s):
        Lp = s.Q + s.nv * s.l[:, None]; Rp = s.Q - s.nv * s.r[:, None]; out = list(Lp)
        if s.caps[1]: out += s.caps[1](Lp[-1], Rp[-1], s.d[-1])
        out += list(Rp[::-1])
        if s.caps[0]: out += s.caps[0](Rp[0], Lp[0], -s.d[0])
        return out

def wobble(s, amt=.04):
    """the cutter's hand: the width drifts a little along the stroke"""
    k = np.cumsum(RNG.normal(size=len(s.s))); k = nd.gaussian_filter1d(k - k.mean(), 25); k /= (np.abs(k).max() + 1e-9)
    s.l *= 1 + amt * k; s.r *= 1 + amt * k[::-1]

def cut_cap(lift=-.008):
    """a flared end: each tip cut off blunt by its own short face; the foot between bowed up a little"""
    b1, b2 = J(.007, .018), J(.007, .018)
    def f(a, b, d):
        a2, b2_ = a + d * b1, b + d * b2; m = (a2 + b2_) / 2 + d * lift
        return [a2, a2 + (m - a2) * .5 + d * J(-.003, .003), m, m + (b2_ - m) * .5 + d * J(-.003, .003), b2_]
    return f

def stem(P, w=W, foot=None, head=None, lf=.16, lf0=None, waist=.9, point=(False, False)):
    """waisted, each end flared in straight facets, left and right on their own (foot/head: (left, right) half-widths)"""
    s = Stroke(P); u = s.u
    h = w / 2 * (waist + (1 - waist) * np.abs(2 * u - 1) ** 2); s.l[:] = h; s.r[:] = h; wobble(s)
    for end, fl, L_ in ((0, head, lf0 or lf), (1, foot, lf)):
        if not fl: continue
        dist = s.s if end == 0 else s.S - s.s
        for side, F in ((1, fl[0]), (-1, fl[1])):
            Ls = L_ * J(.75, 1.25); F = F * J(.95, 1.2); a1, a2 = J(.05, .16), J(.32, .55)
            z = np.interp(np.clip(1 - dist / Ls, 0, 1), [0, .45, .8, 1], [0, a1, a2, 1])
            if side > 0: s.l += (F - s.l) * z
            else: s.r += (F - s.r) * z
        s.caps[end] = cut_cap()
    for end in (0, 1):
        if point[end]:
            dist = s.s if end == 0 else s.S - s.s; k = np.clip(dist / .06, 0, 1) ** .8 * .9 + .1; s.l *= k; s.r *= k; s.caps[end] = None
    return s

def crescent(P, wmax=BW, peak=.6, tips=(.02, .02), shape=1.):
    s = Stroke(P); u = s.u
    a = np.where(u < peak, u / peak, (1 - u) / (1 - peak)); a = np.sin(np.clip(a, 0, 1) * math.pi / 2) ** shape
    t0 = np.where(u < peak, tips[0], tips[1]); h = (t0 + (wmax - t0) * a) / 2; s.l[:] = h; s.r[:] = h; wobble(s, .05); return s

def bar(P, w=B, peak=.55, tips=(.022, .016)):
    """his bars: flat on top, bellied beneath, the ends cut on a slant (P runs left to right: l is the top)"""
    s = Stroke(P); u = s.u
    a = np.where(u < peak, u / peak, (1 - u) / (1 - peak)); a = np.sin(np.clip(a, 0, 1) * math.pi / 2) ** .55
    s.l[:] = np.interp(u, [0, .12, .88, 1], [tips[0] * .4, w * .3, w * .3, tips[1] * .4])
    s.r[:] = tips[0] * .6 + (w * .72 - tips[0] * .6) * a; wobble(s, .06); return s

def hook(p0, a0, size, w, turn=1, sweep=.75):
    size *= 1.6; w *= 1.4
    """a curled tail: off p0 heading a0, curling (turn +1 clockwise on screen) ever tighter, tapering to a blunt end"""
    n = 50; step = size / n; pts = [np.array(p0, float)]; a = a0
    for i in range(n):
        t = i / n; a += turn * sweep * math.pi / size * step * (.5 + 1.0 * t); pts.append(pts[-1] + step * np.array([math.cos(a), math.sin(a)]))
    s = Stroke(pts); h = w / 2 * (1 - .5 * s.u ** 1.5); s.l[:] = h; s.r[:] = h; return s

def tail(st, end, size, turn=1, outward=False):
    """his tail: the stroke itself running on from its end and curling, at that end's own width and heading"""
    i = 0 if end == 0 else -1; d = st.d[i] * (-1 if end == 0 else 1); w = max(st.l[i] + st.r[i], .03); p = st.Q[i] - d * .004
    if outward:   # off the outer tip of a flared foot, heading out sideways
        side = 1 if (st.nv[i] * 1)[0] > 0 else -1; p = st.Q[i] + side * st.nv[i] * (st.l[i] if side > 0 else st.r[i]) * .8; d = side * st.nv[i]; w = .045
    return hook(p, math.atan2(d[1], d[0]), size, w / 1.4, turn)

def wedge(a, b, c, bow=.2):
    P = []
    for p, q, o in ((a, b, c), (b, c, a), (c, a, b)):
        p, q, o = map(np.array, (p, q, o)); m = (p + q) / 2 + (o - (p + q) / 2) * bow * .5
        P += list(bez(p, m, q, n=20))[:-1]
    return P

def clip(s, y0=None, y1=None): s.clip = (y0, y1); return s
def deg(a): return math.radians(a)

# ---- the alphabet -------------------------------------------------------------------------------------------------------
def C_parts(end=(.62, .90)):
    top = crescent(bez((.86, .32), (.87, .03), (.28, .02), (.13, .40)), BW * .8, peak=.8, tips=(.025, .09))
    low = crescent(bez((.13, .40), (.04, .66), (.22, .93), end), BW * 1.15, peak=.3, tips=(.09, .035))
    spur = wedge((.035, .95), (.145, .79), (.17, .935), bow=.1)
    return [top, low, spur]

def L_A():
    st = stem([(.72, .14), (.73, .905)], H_, foot=(.09, .10), head=(.06, .06), lf0=.05)
    hd = bar(bez((.38, .10), (.60, .08), (.86, .09)), B * 1.15)
    leg = stem(bez((.66, .15), (.53, .40), (.41, .65), (.31, .905)), S2 * 1.15, foot=(.08, .07), lf=.13)
    cb = bar(bez((.12, .50), (.40, .52), (.70, .47)), B * .85)
    return [st, hd, leg, cb, tail(cb, 0, .10, turn=1)], [(0, .35, 1, .014), (0, .6, -1, .012)]

def L_B():
    st = stem([(.20, .12), (.21, .895)], W, foot=(.09, .08), head=(.07, .05), lf0=.07)
    up = crescent(bez((.24, .11), (.64, .03), (.72, .38), (.30, .45)), BW * .72, peak=.5, tips=(.03, .03))
    lo = crescent(bez((.30, .44), (.94, .40), (.90, .97), (.26, .885)), BW * .95, peak=.5, tips=(.03, .04))
    return [st, up, lo], [(0, .3, 1, .013), (0, .7, -1, .013)]

def L_C():
    S = C_parts(); S.append(tail(S[1], 1, .09, turn=-1)); return S, [(1, .2, 1, .014)]

def L_D():
    st = stem([(.22, .12), (.22, .895)], W, foot=(.085, .07), head=(.07, .05), lf0=.07)
    bw = crescent(bez((.26, .11), (1.02, .02), (1.02, .98), (.27, .885)), BW, peak=.58, tips=(.03, .03))
    return [st, bw], [(0, .45, 1, .013)]

def L_E():
    S = C_parts()
    S.append(stem([(.13, .505), (.55, .50)], B * .95, foot=(.075, .055), lf=.11, waist=.85))
    return S, [(1, .2, 1, .014), (3, .5, 1, .011)]

def L_F():
    st = stem(bez((.16, .10), (.14, .45), (.15, .74), (.30, .905)), W, foot=(.08, .09), head=(.07, .05), lf0=.07)
    tb = bar(bez((.12, .10), (.45, .12), (.80, .10)), B * 1.05)
    dr = wedge((.70, .09), (.85, .085), (.77, .25), bow=.18)
    ma = stem([(.18, .46), (.58, .45)], B * .9, foot=(.06, .055), lf=.09, waist=.85)
    return [st, tb, dr, ma], [(0, .3, -1, .013), (0, .62, 1, .012)]

def L_G():
    S = C_parts(end=(.66, .89))
    S.append(stem([(.70, .56), (.69, .90)], S2 * 1.3, head=(.075, .05), foot=(.04, .035), lf0=.09, lf=.06))
    S.append(bar(bez((.56, .535), (.67, .535), (.81, .52)), B * .8))
    return S, [(1, .2, 1, .014)]

def L_H():
    st = stem([(.14, .09), (.14, .905)], H_, foot=(.09, .09), head=(.08, .06), lf0=.07)
    bw = stem(bez((.46, .10), (.94, .10), (.88, .50), (.84, .905)), W, head=(.04, .045), foot=(.07, .08), lf0=.05)
    cb = bar(bez((.20, .34), (.40, .35), (.62, .31)), .04)
    return [st, bw, cb], [(0, .33, -1, .014), (0, .66, 1, .013)]

def L_I():
    st = stem([(.42, .08), (.41, .905)], H_, foot=(.115, .11), head=(.11, .10), lf=.19, lf0=.17)
    return [st], [(0, .33, 1, .014), (0, .5, -1, .013), (0, .66, 1, .013)]

def L_J():
    st = stem(bez((.52, .08), (.52, .45), (.52, .74), (.40, .87)), W * 1.1, head=(.09, .08), lf0=.15)
    return [st, tail(st, 1, .15, turn=1)], [(0, .4, 1, .013)]

def L_K():
    st = stem([(.22, .30), (.225, .895)], W, foot=(.07, .08), head=(.065, .07), lf0=.05)
    hd = wedge((.10, .115), (.36, .105), (.29, .25))
    arm = clip(stem([(.77, .10), (.39, .44)], .095, head=(.08, .09), lf0=.12), .11, None)
    leg = clip(stem(bez((.39, .44), (.56, .55), (.67, .68), (.76, .92)), .10, foot=(.06, .12), lf=.15), None, .895)
    return [st, hd, arm, leg], [(0, .25, -1, .014), (3, .45, 1, .012)]

def L_L():
    st = stem([(.215, .30), (.222, .895)], W, foot=(.12, .15), head=(.07, .06), lf0=.05)
    hd = bar(bez((.09, .125), (.25, .14), (.47, .115)), B * 1.1)
    up = stem([(.665, .46), (.668, .895)], S2 * 1.1, foot=(.13, .11), lf=.2, point=(True, False))
    return [st, hd, up, tail(up, 1, .08, turn=-1, outward=True)], [(0, .2, 1, .015), (2, .4, -1, .012)]

def L_M():
    lt = stem(bez((.12, .895), (.05, .40), (.18, .10), (.47, .19)), W, head=(.08, .07), lf0=.12)
    md = stem([(.47, .18), (.475, .895)], W * .85, foot=(.07, .07))
    rt = stem(bez((.47, .20), (.80, .05), (.93, .40), (.86, .895)), W, foot=(.08, .085))
    return [lt, md, rt], [(1, .5, 1, .012), (2, .7, -1, .012)]

def L_N():
    l = stem([(.17, .15), (.17, .895)], S2 * 1.2, foot=(.075, .07), head=(.06, .05))
    dg = clip(stem([(.15, .08), (.76, .93)], H_, head=(.12, .04), foot=(.04, .12), lf=.14), .10, .895)
    r = stem([(.76, .10), (.76, .86)], S2 * 1.2, head=(.065, .06), point=(False, True))
    return [l, dg, r], [(1, .35, 1, .013), (1, .62, -1, .013)]

def O_parts():
    lt = crescent(bez((.52, .07), (-.03, .10), (-.03, .93), (.52, .935)), BW * 1.15, peak=.6, tips=(.03, .04))
    rt = crescent(bez((.52, .935), (1.0, .90), (.99, .08), (.52, .07)), BW * .8, peak=.5, tips=(.04, .03))
    return [lt, rt]

def L_O(): return O_parts(), [(0, .7, 1, .013), (1, .4, -1, .012)]

def L_P():
    st = stem([(.21, .12), (.22, .895)], W, foot=(.085, .08), head=(.07, .05), lf0=.07)
    bw = crescent(bez((.25, .11), (.97, .02), (.97, .60), (.26, .53)), BW * .9, peak=.45, tips=(.03, .03))
    return [st, bw], [(0, .55, 1, .014)]

def L_Q():
    S = O_parts(); S.append(crescent(bez((.42, .86), (.60, .95), (.75, .96), (.86, .93)), B * 1.1, peak=.35, tips=(.04, .03))); S.append(tail(S[-1], 1, .07, turn=-1))
    return S, [(0, .7, 1, .013)]

def L_R():
    st = stem([(.21, .12), (.22, .895)], W, foot=(.085, .08), head=(.07, .05), lf0=.07)
    bw = crescent(bez((.26, .11), (.66, .04), (.99, .32), (.40, .48)), BW * .8, peak=.6, tips=(.03, .05))
    leg = clip(stem(bez((.40, .46), (.56, .56), (.68, .70), (.79, .92)), .10, foot=(.06, .12), lf=.15), None, .895)
    return [st, bw, leg], [(0, .45, 1, .014), (2, .5, 1, .012)]

def L_S():
    top = crescent(bez((.82, .22), (.74, .02), (.10, .06), (.22, .36)), BW * .7, peak=.6, tips=(.07, .08))
    sp = crescent(bez((.20, .32), (.38, .46), (.62, .52), (.78, .68)), H_ * 1.15, peak=.5, tips=(.07, .07))
    low = crescent(bez((.76, .64), (.95, .99), (.24, .99), (.10, .76)), BW * .75, peak=.45, tips=(.08, .07))
    return [top, sp, low], [(1, .5, 1, .013)]

def L_T():
    tb = crescent(bez((.08, .14), (.30, .08), (.60, .13), (.86, .10)), .11, peak=.3, tips=(.03, .03))
    bw = crescent(bez((.30, .15), (.05, .45), (.09, .89), (.62, .93)), .15, peak=.45, tips=(.10, .03))
    return [tb, bw, tail(tb, 1, .07, turn=-1), tail(bw, 1, .09, turn=-1)], [(1, .5, 1, .013)]

def L_U():
    lt = stem(bez((.18, .10), (.13, .62), (.24, .92), (.78, .80)), W * 1.05, head=(.075, .06), lf0=.07, point=(False, True))
    rt = stem([(.77, .10), (.78, .895)], W * .85, head=(.065, .06), foot=(.07, .085), lf0=.07)
    return [lt, rt], [(0, .35, 1, .013), (1, .5, -1, .012)]

def V_head(x0=.14, bottom=(.43, .93), w=H_ * 1.15):
    return clip(stem(bez((x0, .07), (x0 + .11, .40), (bottom[0] - .08, .70), bottom), w, head=(.14, .05), lf0=.17, point=(False, True)), .085, None)

def L_V():
    hv = V_head()
    arm = crescent(bez((.36, .15), (.62, .05), (.86, .12), (.74, .33)), .085, peak=.45, tips=(.035, .04))
    hl = stem(bez((.74, .32), (.63, .55), (.52, .75), (.445, .92)), .035, waist=1.)
    return [hv, arm, hl, tail(arm, 1, .07, turn=1)], [(0, .45, 1, .013)]

def L_W():
    h1 = V_head(.06, (.29, .93), H_ * .95); h2 = V_head(.38, (.62, .93), H_ * .95)
    hl1 = stem(bez((.47, .22), (.40, .55), (.33, .78), (.295, .92)), .03, waist=1.)
    arm = crescent(bez((.58, .15), (.78, .06), (.94, .14), (.86, .33)), .075, peak=.45, tips=(.03, .035))
    hl2 = stem(bez((.86, .32), (.78, .55), (.69, .77), (.63, .92)), .03, waist=1.)
    return [h1, h2, hl1, arm, hl2, tail(arm, 1, .06, turn=1)], [(0, .5, 1, .012)]

def L_X():
    hv = clip(stem(bez((.13, .07), (.38, .42), (.55, .66), (.80, .92)), H_ * 1.05, head=(.14, .05), foot=(.06, .13), lf=.15, lf0=.17), .085, .895)
    hl = crescent(bez((.80, .17), (.56, .30), (.40, .70), (.16, .83)), .05, peak=.5, tips=(.025, .025))
    return [hv, hl, tail(hl, 0, .09, turn=-1), tail(hl, 1, .09, turn=-1)], [(0, .3, 1, .013)]

def L_Y():
    hv = clip(stem(bez((.12, .07), (.28, .26), (.40, .42), (.48, .56)), H_ * 1.1, head=(.14, .05), lf0=.17), .085, None)
    arm = crescent(bez((.48, .52), (.62, .38), (.78, .26), (.83, .12)), .06, peak=.35, tips=(.05, .025))
    st = stem([(.475, .50), (.47, .895)], W, foot=(.10, .11), lf=.15)
    return [hv, arm, st, tail(arm, 1, .08, turn=1)], [(2, .4, 1, .013)]

def L_Z():
    tb = bar(bez((.15, .14), (.45, .11), (.82, .12)), B * 1.1)
    dg = clip(stem(bez((.82, .11), (.56, .40), (.40, .60), (.15, .90)), H_, waist=.95), .14, .87)
    bb = bar(bez((.14, .87), (.50, .89), (.84, .85)), B * 1.1)
    return [tb, dg, bb, tail(tb, 0, .08, turn=-1), tail(bb, 1, .08, turn=-1)], [(1, .5, 1, .013)]

LETTERS = {k[2]: v for k, v in globals().items() if k.startswith('L_') and len(k) == 3}

def T(q, sc): return [(x * sc, y * sc) for x, y in q]

def render(ch, seed=1, res=700, notch=True):
    global RNG
    RNG = np.random.default_rng(seed * 1000 + ord(ch)); S, D = LETTERS[ch]()
    im = Image.new('L', (RW, R), 0); d = ImageDraw.Draw(im); acc = np.zeros((R, RW), bool)
    for s in S:
        lay = Image.new('L', (RW, R), 0); ImageDraw.Draw(lay).polygon(T(s.poly() if isinstance(s, Stroke) else s, R), fill=255)
        a = np.asarray(lay) > 127
        if isinstance(s, Stroke) and s.clip:
            if s.clip[0] is not None: a[:int(s.clip[0] * R)] = False
            if s.clip[1] is not None: a[int(s.clip[1] * R):] = False
        acc |= a
    if notch:   # his bites: small triangles from an edge
        im = Image.fromarray(acc.astype(np.uint8) * 255); d = ImageDraw.Draw(im)
        for i, t, side, sz in D:
            if i >= len(S) or not isinstance(S[i], Stroke): continue
            p1, dd, nn = S[i].at(t, side); sz *= J(.8, 1.25)
            d.polygon(T([p1 - dd * sz * .3, p1 + dd * sz * 1.2, p1 - nn * sz + dd * sz * J(-.1, .3)], R), fill=0)
        acc = np.asarray(im) > 127
    m = acc
    sd = nd.distance_transform_edt(m) - nd.distance_transform_edt(~m)   # the cut edge: a slow wander
    nz = nd.gaussian_filter(RNG.normal(size=m.shape), .035 * R); nz *= .0009 * R / (nz.std() + 1e-9); m = sd + nz > 0
    from skimage.measure import find_contours, approximate_polygon   # the knife: straight cuts, corners just eased
    acc = np.zeros_like(m)
    for ct in find_contours(np.pad(m.astype(float), 1), .5):
        ct = approximate_polygon(ct - 1, .0035 * R)
        if len(ct) < 3: continue
        lay = Image.new('L', (RW, R), 0); ImageDraw.Draw(lay).polygon([(x, y) for y, x in ct], fill=255); acc ^= np.asarray(lay) > 127
    m = nd.gaussian_filter(acc.astype(float), .0015 * R) > .5
    if res == R: return m
    return np.asarray(Image.fromarray(m.astype(np.uint8) * 255).resize((round(res * A), res), Image.LANCZOS)) > 127

if __name__ == '__main__':
    import string
    letters = sys.argv[1] if len(sys.argv) > 1 else string.ascii_uppercase
    out = {c: render(c) for c in letters}
    np.savez_compressed(sys.argv[2] if len(sys.argv) > 2 else 'k26.npz', **out)
    for c, m in out.items(): print(c, round(float(m.mean()), 3))
