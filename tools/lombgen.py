# tools/lombgen.py: the choir-book Lombard GENERATED from a stroke model of one rubricator's hand (Free Library of Philadelphia,
# Lewis E 73, Gradual, Bologna?, c. 1425; research/17 §4e). The 17 letters traced from the book (research/choirbook/le073,
# set/) are the measurement source and the blind-test reference, not the output.
# The model, measured on the traced letters (half-widths along their skeletons, units of the letter's height H):
#   stem    a straight heavy stroke, half-width S = .085 (p90 of the stems .07-.09), waisted: .92 S at the middle, flaring
#           to ~1.09 S where it meets its serif
#   bow     a curved heavy stroke (a crescent): hairline H_ at its ends, B = .095 at its fullest (p100 of the bows .09-.10),
#           the swell a sine (the painter's outline drawn with two curves meeting at the ends)
#   hair    joints, bars, serifs and arms: half-width h = .016 (p10 .012-.021), a little fuller in the middle
#   ball    the terminals: a round of radius r = .038 (the traced balls .035-.045), set at the end of a hair (every free end of this hand ends in one)
#   wedge   a heavy stroke tapering along its length (an L's or Q's foot, a T's bar): from S to h
# Proportions (the traced letters' width / height): most letters ~1.0 (A 1.12, B 1.12, D 1.26, E 1.13, G 1.03, I .66, K 1.04,
# L .80, M 1.07, O .93, P 1.0, R .94, S 1.29, T 1.0, V .99, X 1.06): wide, round-shouldered.
# Each letter is a list of strokes on centre-lines (units of H, y down, the cap line at 0, the baseline at 1), rasterised by
# stamping discs of the stroke's half-width along it (the painter's outline, filled), then faired. Every letter A-Z comes
# from the same model; nothing is pasted from a trace. A small seeded irregularity (the hand: a stroke's line off true by a
# fraction of a percent, a width by a few percent) keeps two letters from being mechanically alike.
# usage: uv run --with pillow --with numpy --with scipy --with scikit-image python -I tools/lombgen.py OUTDIR [LETTERS] [SEED]
#   writes OUTDIR/<L>.json ({ name, char, src, a, polys }, as tools/lombcompose.py) for tools/lombfont.py
import sys, os, json, math
import numpy as np
from scipy import ndimage as nd
from skimage.measure import find_contours, approximate_polygon
S, B, h, r = .085, .095, .016, .038
out = sys.argv[1]; want = sys.argv[2] if len(sys.argv) > 2 else 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; seed = int(sys.argv[3]) if len(sys.argv) > 3 else 7
os.makedirs(out, exist_ok=True); rng = np.random.default_rng(seed)

def bez(*P, n=60):   # a cubic (or quadratic) Bezier through control points, as a polyline
    P = np.array(P, float); t = np.linspace(0, 1, n)[:, None]
    if len(P) == 3: return (1 - t) ** 2 * P[0] + 2 * (1 - t) * t * P[1] + t ** 2 * P[2]
    return (1 - t) ** 3 * P[0] + 3 * (1 - t) ** 2 * t * P[1] + 3 * (1 - t) * t ** 2 * P[2] + t ** 3 * P[3]
def arc(c, rx, ry, a0, a1, n=80):
    t = np.linspace(a0, a1, n); return np.stack([c[0] + rx * np.cos(t), c[1] + ry * np.sin(t)], 1)
def line(a, b, n=40): return np.linspace(a, b, n)
# width profiles over f in 0..1 along the stroke
stem = lambda f: S * (.93 + .16 * (2 * f - 1) ** 6)
bow = lambda wmax=B, w0=h * 1.1, w1=None: (lambda f: (w0 if f < .5 else (w1 if w1 is not None else w0)) + (wmax - (w0 if f < .5 else (w1 if w1 is not None else w0))) * math.sin(math.pi * f) ** 1.15)
hair = lambda f: h * (1 + .25 * math.sin(math.pi * f))
wedge = lambda w0=S, w1=h: (lambda f: w0 + (w1 - w0) * f ** 1.3)
def ballhair(p, q, rr=r):   # a hair from p to its ball at q
    return [(line(p, q), hair), ('ball', q, rr)]
def serif(x, y, left=.15, right=.15, down=1):   # the bar across a stem's end, its two ends turned into balls
    a, b = (x - left, y), (x + right, y); return [(line(a, b), lambda f: h * 1.25), ('ball', (a[0], a[1] + down * r * .55), r), ('ball', (b[0], b[1] + down * r * .55), r)]

def letter(ch):
    L = []
    if ch in 'IJ':
        a = .66; x = .33; L += [(line((x, .04), (x, .96)), stem)] + serif(x, .045, .22, .22, 1) + serif(x, .955, .22, .22, -1)
    elif ch == 'L':
        a = .82; x = .24; L += [(line((x, .04), (x, .93)), stem)] + serif(x, .045, .16, .16, 1)
        L += [(bez((x, .95), (.45, .95), (.62, .92), (.76, .86)), wedge(S * .9, h * 1.6)), (bez((.76, .86), (.79, .78), (.78, .7)), hair), ('ball', (.78, .68), r * .8), (line((x - .16, .955), (x, .955)), hair), ('ball', (x - .16, .93), r)]
    elif ch == 'T':
        a = 1.0; x = .5; L += [(line((x, .1), (x, .95)), stem)] + serif(x, .955, .18, .18, -1)
        L += [(bez((.06, .12), (.2, .04), (.8, .04), (.94, .12)), lambda f: h + (S * .62 - h) * math.sin(math.pi * f) ** .5)]
        for s in (-1, 1): L += [(bez((.5 + s * .44, .12), (.5 + s * .47, .18), (.5 + s * .46, .3)), hair), ('ball', (.5 + s * .45, .33), r * .85)]
    elif ch == 'A':
        a = 1.1; xs = .74; L += [(line((xs, .05), (xs, .95)), stem)] + serif(xs, .955, .16, .16, -1)
        L += [(bez((.44, .07), (.36, .4), (.22, .75), (.1, .95)), lambda f: h * 1.3 + .02 * math.sin(math.pi * f)), ('ball', (.06, .93), r)]
        L += [(line((.04, .055), (1.04, .045)), lambda f: h * 1.2), ('ball', (.04, .085), r * .9), ('ball', (1.06, .05), r)]
        L += [(line((.3, .5), (xs, .5)), lambda f: .04 + .015 * f)]
    elif ch == 'B':
        a = 1.1; x = .3; L += [(line((x, .05), (x, .95)), stem)]
        L += [(arc((x + .22, .26), .26, .21, -math.pi / 2, math.pi / 2 * .98), bow(B * .82))]
        L += [(arc((x + .3, .7), .38, .27, -math.pi / 2 - .1, math.pi / 2), bow(B))]
        L += [(line((x, .47), (x + .26, .47)), lambda f: h * 1.3)]
        L += [(line((.05, .05), (x + .24, .05)), hair), ('ball', (.05, .08), r), (line((.05, .955), (x + .3, .97)), hair), ('ball', (.05, .93), r)]
    elif ch in 'CEG':
        a = {'C': .88, 'E': 1.06, 'G': 1.02}[ch]
        L += [(arc((.5, .5), .4, .46, math.pi * 1.48, math.pi * .52, 120), bow(B * 1.05, h * 1.1, h))]   # the back, from the head round to the foot
        L += [(bez((.5, .04), (.68, .03), (.8, .06), (.86, .14)), hair), ('ball', (.86, .17), r)]
        L += [(bez((.5, .96), (.66, .97), (.78, .94), (.86, .88)), hair), ('ball', (.88, .86), r * .85)] if ch == 'C' else []
        if ch == 'E':
            L += [(line((.12, .47), (.86, .45)), lambda f: .03 + .012 * math.sin(math.pi * f))]
            L += [(bez((.86, .14), (.84, .25), (.85, .35), (.86, .45)), hair)]
            L += [(bez((.5, .96), (.7, .97), (.86, .9), (.92, .76)), bow(B * .45, h, h)), (bez((.86, .45), (.9, .6), (.92, .68), (.92, .76)), hair)]
            L += [(bez((.86, .46), (.9, .7), (.98, .88), (1.02, .95)), lambda f: h + .025 * math.sin(math.pi * f)), ('ball', (1.02, .95), r)]
            L = L[:1] + L[1:2] + L[2:]
        if ch == 'G':
            L += [(arc((.6, .66), .3, .3, math.pi * .5, -math.pi * .25, 60), bow(B * .85, h, h * 1.6))]
            L += [(bez((.79, .45), (.66, .36), (.5, .4), (.5, .48)), hair), ('ball', (.52, .49), r * .9)]
    elif ch == 'D':
        a = 1.12; x = .3; L += [(line((x, .07), (x, .93)), stem)]
        L += [(arc((x + .25, .5), .5, .46, -math.pi / 2, math.pi / 2), bow(B * 1.05)), (line((x, .045), (x + .27, .04)), lambda f: h * 1.4), (line((x, .955), (x + .27, .96)), lambda f: h * 1.4)]
        L += [(bez((x, .07), (.2, .03), (.1, .03), (.06, .08)), hair), ('ball', (.06, .1), r)]
        L += [(bez((x, .9), (.2, .92), (.1, .9), (.06, .86)), hair), ('ball', (.05, .84), r * .9)]
    elif ch == 'F':
        a = .86; x = .28; L += [(line((x, .07), (x, .95)), stem)] + serif(x, .955, .16, .16, -1)
        L += [(bez((x - .14, .06), (.4, .03), (.65, .04), (.82, .06)), wedge(S * .7, h * 1.2)), (bez((.82, .06), (.86, .12), (.84, .2)), hair), ('ball', (.83, .23), r * .85), ('ball', (x - .15, .09), r)]
        L += [(line((x, .46), (.66, .45)), lambda f: .03 + .012 * (1 - f)), ('ball', (.68, .45), r * .85)]
    elif ch == 'H':
        a = .98; x = .26; L += [(line((x, .05), (x, .95)), stem)] + serif(x, .045, .16, .14, 1)
        L += [(bez((x, .36), (.45, .26), (.72, .3), (.76, .55)), bow(B * .7, h, B * .9)), (bez((.76, .55), (.78, .75), (.7, .9), (.62, .95)), lambda f: B * .9 * (1 - f) + h * f)]
        L += [(bez((.62, .95), (.74, .97), (.84, .95), (.9, .9)), hair), ('ball', (.92, .88), r), (line((x - .14, .955), (x + .14, .955)), hair), ('ball', (x - .15, .93), r)]
    elif ch == 'K':
        a = 1.02; x = .28; L += [(line((x, .07), (x, .95)), stem)] + serif(x, .955, .16, .16, -1)
        L += [(line((.04, .06), (.98, .06)), lambda f: h * 1.2), ('ball', (.04, .09), r), ('ball', (.98, .09), r)]
        L += [(bez((x + .06, .48), (.55, .38), (.72, .22), (.76, .07)), bow(B * .5, h, h))]
        L += [(bez((x + .06, .48), (.62, .5), (.8, .66), (.78, .92)), bow(B * .9, h, h * 1.4)), (bez((.78, .92), (.82, .97), (.9, .97), (.96, .92)), hair), ('ball', (.97, .9), r)]
    elif ch in 'MN':
        a = 1.08 if ch == 'M' else .8; x = .5 if ch == 'M' else .22
        L += [(line((x, .05), (x, .95)), stem)] + serif(x, .955, .14, .14, -1)
        if ch == 'M': L += [(bez((x, .06), (.18, .06), (.06, .4), (.1, .92)), bow(B * .95, h, S * .8)), (bez((.1, .92), (.08, .96), (.02, .96), (.0, .92)), hair), ('ball', (.0, .9), r * .9)]
        else: L += [(line((x - .14, .045), (x, .045)), hair), ('ball', (x - .15, .07), r)]
        L += [(bez((x, .06), (x + .4, .06), (x + .5, .4), (x + .46, .82)), bow(B * .95, h, S * .7)), (bez((x + .46, .82), (x + .46, .93), (x + .52, .97), (x + .58, .92)), hair), ('ball', (x + .6, .9), r)]
    elif ch in 'OQ':
        a = .95 if ch == 'O' else 1.22
        L += [(arc((.475, .5), .38, .45, math.pi * 1.5, math.pi * .5, 90), bow(B * 1.05)), (arc((.475, .5), .38, .45, -math.pi * .5, math.pi * .5, 90), bow(B * 1.05))]
        if ch == 'Q': L += [(bez((.6, .9), (.78, .99), (.98, .97), (1.12, .95)), wedge(S * .8, h * 1.4)), (bez((1.12, .95), (1.16, .9), (1.17, .85)), hair), ('ball', (1.17, .83), r * .85)]
    elif ch in 'PR':
        a = .98 if ch == 'P' else .96; x = .28; L += [(line((x, .05), (x, .95)), stem)] + serif(x, .955, .16, .16, -1)
        ry = .3 if ch == 'P' else .24
        L += [(arc((x + .26, .06 + ry), .4, ry, -math.pi / 2, math.pi / 2), bow(B))]
        L += [(line((.04, .05), (x + .26, .05)), hair), ('ball', (.04, .08), r)]
        if ch == 'R': L += [(bez((x + .2, .56), (.62, .6), (.76, .72), (.74, .92)), bow(B * .9, h, h * 1.4)), (bez((.74, .92), (.78, .97), (.86, .97), (.92, .92)), hair), ('ball', (.93, .9), r)]
    elif ch == 'S':
        a = 1.0
        L += [(bez((.82, .16), (.7, .03), (.2, .02), (.18, .25)), lambda f: h + (B * .55 - h) * math.sin(math.pi * f)), ('ball', (.84, .18), r)]
        L += [(bez((.18, .25), (.16, .48), (.84, .4), (.82, .72)), lambda f: B * .55 + (B * 1.08 - B * .55) * math.sin(math.pi * f) ** .7)]
        L += [(bez((.82, .72), (.84, .98), (.3, .98), (.16, .82)), lambda f: B * .55 * (1 - f) + h * f + .02 * math.sin(math.pi * f)), ('ball', (.15, .8), r)]
        L += [(bez((.82, .16), (.86, .12), (.86, .06)), hair)]
    elif ch in 'UVW':
        def u(dx):
            xs = dx + .78
            return [(line((xs, .05), (xs, .95)), stem)] + serif(xs, .955, .14, .12, -1) + \
                [(bez((dx + .32, .06), (dx + .1, .25), (dx + .06, .7), (dx + .3, .93)), bow(B * 1.05, h, h)), (bez((dx + .3, .93), (dx + .5, 1.0), (dx + .66, .97), (xs, .9)), hair),
                 (line((dx + .14, .045), (dx + .36, .045)), hair), ('ball', (dx + .13, .07), r)]
        a = 1.0 if ch != 'W' else 1.86; L += u(0) + (u(.86) if ch == 'W' else []); L += [(line((.62, .045), (.96, .045)), hair), ('ball', (.97, .07), r)] if ch != 'W' else []
    elif ch in 'XY':
        a = 1.04
        L += [(bez((.12, .07), (.4, .38), (.6, .6) if ch == 'X' else (.45, .45), (.88, .93) if ch == 'X' else (.52, .52)), stem if ch == 'X' else bow(B * .9, S * .9, S * .8))]
        L += [(bez((.9, .07), (.6, .4), (.4, .62) if ch == 'X' else (.55, .45), (.12, .93) if ch == 'X' else (.52, .52)), hair if ch == 'X' else bow(B * .45, h, h * 2))]
        L += [(line((.02, .05), (.36, .05)), hair), ('ball', (.01, .08), r), (line((.7, .05), (1.02, .05)), hair), ('ball', (1.03, .08), r)]
        if ch == 'X': L += [(line((.0, .955), (.3, .955)), hair), ('ball', (-.01, .93), r), (line((.7, .955), (1.04, .955)), hair), ('ball', (1.05, .93), r)]
        else: L += [(line((.52, .5), (.52, .95)), stem)] + serif(.52, .955, .16, .16, -1)
    elif ch == 'Z':
        a = .96
        L += [(bez((.08, .1), (.3, .05), (.7, .06), (.9, .07)), lambda f: h + (S * .55 - h) * math.sin(math.pi * f) ** .6), ('ball', (.06, .14), r)]
        L += [(line((.86, .1), (.14, .9)), stem)]
        L += [(bez((.1, .93), (.35, .97), (.65, .96), (.9, .9)), wedge(S * .7, h * 1.3)), (bez((.9, .9), (.93, .84), (.92, .76)), hair), ('ball', (.92, .74), r * .85)]
    else: raise ValueError(ch)
    return a, L

R = 900
for ch in want:
    a, L = letter(ch); W = int((a + .4) * R); Hh = int(1.3 * R); ox, oy = .2 * R, .15 * R; acc = np.zeros((Hh, W), bool)
    jit = rng.normal(0, .0025, 2); wj = 1 + rng.normal(0, .025)
    yy, xx = np.mgrid[0:Hh, 0:W]
    def disc(px, py, rad):
        x0, x1, y0, y1 = int(max(0, px - rad - 2)), int(min(W, px + rad + 3)), int(max(0, py - rad - 2)), int(min(Hh, py + rad + 3))
        acc[y0:y1, x0:x1] |= (xx[y0:y1, x0:x1] - px) ** 2 + (yy[y0:y1, x0:x1] - py) ** 2 <= rad * rad
    for s in L:
        if isinstance(s[0], str): (px, py), rad = s[1], s[2]; disc(ox + px * R, oy + py * R, rad * R * wj); continue
        P, prof = s; P = np.asarray(P, float); seg = np.hypot(*np.diff(P, axis=0).T); cum = np.concatenate([[0], np.cumsum(seg)]); Lt = cum[-1] or 1
        n = max(2, int(Lt * R / .7)); fs = np.linspace(0, 1, n); xs = np.interp(fs * Lt, cum, P[:, 0]); ys = np.interp(fs * Lt, cum, P[:, 1])
        bend = rng.normal(0, .002); 
        for f, px, py in zip(fs, xs, ys): disc(ox + (px + jit[0] * f + bend * math.sin(math.pi * f)) * R, oy + (py + jit[1] * f) * R, max(1.2, prof(f) * R * wj))
    # faired as the traced letters are (tools/lombcompose.py FAIR .009): the joins between strokes run smooth
    f = .009 * R; k = max(1, int(f * .8)); acc = nd.binary_opening(nd.binary_closing(np.pad(acc, k + 2), iterations=k), iterations=k)[k + 2:-k - 2, k + 2:-k - 2]
    acc = nd.gaussian_filter(acc.astype(float), f) > .5
    ys_, xs_ = np.nonzero(acc); bx0, by0, bx1, by1 = xs_.min(), ys_.min(), xs_.max() + 1, ys_.max() + 1; H = by1 - by0
    sm = nd.gaussian_filter(acc.astype(float), 1.0); polys = []
    for ct in find_contours(np.pad(sm, 1), .5):
        ct = approximate_polygon(ct - 1, .7)
        if len(ct) >= 4: polys.append([[round((x - bx0) / H, 4), round((y - by0) / H, 4)] for y, x in ct])
    json.dump({'name': ch, 'char': ch, 'src': f'generated (tools/lombgen.py, the Lewis E 73 hand model), seed {seed}', 'a': round((bx1 - bx0) / H, 4), 'polys': polys}, open(f'{out}/{ch}.json', 'w'))
    print(ch, round((bx1 - bx0) / H, 3), end='  ')
print()
