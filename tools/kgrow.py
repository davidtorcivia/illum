# tools/kgrow.py: a Kelmscott white-vine initial generated, not traced. Round two: everything it draws is held to a
# grammar measured from Morris's own sixteen traced white-vine blocks (research/16-kelmscott.md, "the generator").
# Seeded and deterministic. Output: tracecut's JSON (polys, even-odd, units of the block's height), so tools/kfont.py
# builds it into a per-letter WOFF2 like his own blocks.
#
# Measured (scratchpad py/measure2.py over A B C F H I K L M N O P S T V Z, inside a 4.5 % margin; skeleton runs >= 40 px):
#   vine stem across: median .023, 80th .033, 95th .048 (his main stems are the 95th, his shoots the median and below)
#   stem curvature |k| (1/heights): 25th 3.2, median 8.1, 75th 16.8, 90th 33 (r = .31, .12, .06, .03 of the height)
#   a run between forks: median .10, 90th .21
#   his capital's stem (K, I): waisted ~.10-.12 across, flaring into the ends to ~.19-.23; notches bitten from its sides
#   white .52 of the block; black between letter and vine .023; a frame ~.036
# The LETTER: centre-lines, width waisted along the stroke and flared concave into each end (his K and I profile), the
#   arms' ends turned into his wedge serifs, his notches bitten from the stems and a black hairline cut down the thick ones.
# The VINE, our own grower (initialis by Azlen Elza was studied as a reference; nothing of its code is used):
#   - a few MAIN stems at his main-stem weight (.042 tapering to .024), rooted behind the letter or at the frame, steered
#     by a curvature process sampled from his measured distribution: runs of his run length, each bending one way with
#     a curvature drawn from his quartiles, the sign flipping run to run (his long S), bent away from what is ahead;
#   - OVER/UNDER: a main stem that meets an earlier one across (> 45°) goes over or under it, alternately, and the one
#     beneath is cut by a black break either side, as his are;
#   - SHOOTS, alternately each side every ~.07, at his median weight tapering to a point, their curvature rising along
#     them into his 90th-percentile hook (the flame-tipped shoots that fill his blocks);
#   - his own vocabulary at its own size: 22 leaves, tulips, buds and flowers traced from his blocks (scratchpad
#     q/vocab-pick.npz; VOCAB env), set on the ends of the shoots with room, turned along the shoot;
#   - his grape clusters and dots in the black that is left;
#   - the cut edge: every outline displaced by low-frequency noise of ~.0015 of the height (the wander of his traced edges).
# usage: VOCAB=q/vocab-pick.npz uv run --with pillow --with numpy --with scipy --with scikit-image python -I tools/kgrow.py LETTER SEED OUT.json [PNG]
import sys, os, json, math
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from skimage.measure import find_contours, approximate_polygon
from skimage.morphology import skeletonize

G = dict(stem_main=(.042, .024), stem_shoot=.022, gap=.021, vgap=.015, frame=.036, curv_q=(3.2, 8.1, 16.8), hook=33., run=(.10, .21),
         shoot_every=.07, edge=.0015, white=.52)
R = 1400; A = .97; RW = int(R * A)

# ---- strokes -------------------------------------------------------------------------------------------------------------
def resample(pts, step=.004):
    pts = np.asarray(pts, float); d = np.r_[0, np.cumsum(np.hypot(*np.diff(pts, axis=0).T))]
    t = np.arange(0, d[-1], step); return np.stack([np.interp(t, d, pts[:, 0]), np.interp(t, d, pts[:, 1])], 1)

def cubic(*P, n=60):
    P = np.array(P, float); t = np.linspace(0, 1, n)[:, None]
    return (1 - t) ** 3 * P[0] + 3 * (1 - t) ** 2 * t * P[1] + 3 * (1 - t) * t ** 2 * P[2] + t ** 3 * P[3]

def outline(pts, w):
    d = np.gradient(pts, axis=0); d /= np.linalg.norm(d, axis=1, keepdims=True) + 1e-12; nv = np.stack([-d[:, 1], d[:, 0]], 1)
    return np.vstack([pts + nv * w[:, None] / 2, (pts - nv * w[:, None] / 2)[::-1]])

LS = .9   # the letter's scale about the block's centre (his letters leave the vine about half the block)
def fill(draw, poly, v=255): draw.polygon([(x * R, y * R) for x, y in poly], fill=v)
def lfill(draw, poly, v=255): draw.polygon([((A / 2 + (x - A / 2) * LS) * R, (.5 + (y - .5) * LS) * R) for x, y in poly], fill=v)

def letter_stroke(draw, pts, base, flare=(1.9, 1.9), waist=.82):
    p = resample(pts); t = np.linspace(0, 1, len(p))
    w = base * (waist + (1 - waist) * np.abs(2 * t - 1) ** 2)                          # waisted, as his stems
    for end, f in ((t, flare[0]), (1 - t, flare[1])):                                 # concave flare into each end
        z = np.clip(1 - end / .13, 0, 1); w = w * (1 + (f - 1) * z ** 2.6)
    lfill(draw, outline(p, w * 1.06)); return p, w

# ---- the letters: centre-lines (units of the height; the block is A wide) -------------------------------------------------
def notch(draw, p, side, size=.013):
    x, y = p; lfill(draw, [(x, y - size), (x + side * size * 1.1, y), (x, y + size * .4)], 0)

def L_E(d):
    s, _ = letter_stroke(d, [(.30, .15), (.305, .85)], .118, (2.0, 2.0))
    letter_stroke(d, cubic((.25, .165), (.40, .155), (.55, .15), (.68, .14)), .07, (1.2, 2.3))
    letter_stroke(d, [(.34, .50), (.58, .495)], .062, (1.0, 2.2))
    letter_stroke(d, cubic((.25, .835), (.40, .845), (.56, .84), (.72, .83)), .08, (1.2, 2.4))
    lfill(d, [(.62, .13), (.71, .12), (.69, .27), (.655, .2)]); lfill(d, [(.655, .87), (.74, .86), (.73, .70), (.685, .79)])
    notch(d, (.36, .34), -1); notch(d, (.36, .66), -1); notch(d, (.245, .42), 1)
    return [((.30, .28), (.30, .44)), ((.30, .56), (.305, .74))]

def L_G(d):
    letter_stroke(d, cubic((.64, .2), (.40, .05), (.12, .25), (.17, .55)), .118, (1.9, 1.0), waist=.9)
    letter_stroke(d, cubic((.17, .55), (.20, .86), (.52, .92), (.66, .74)), .118, (1.0, 1.4), waist=.9)
    letter_stroke(d, [(.66, .80), (.665, .53)], .1, (1.3, 1.9))
    letter_stroke(d, [(.50, .53), (.76, .525)], .06, (2.0, 2.0))
    lfill(d, [(.58, .14), (.70, .12), (.69, .32), (.64, .22)])
    notch(d, (.13, .45), 1); notch(d, (.22, .70), -1)
    return [((.21, .36), (.19, .66))]

def L_R(d):
    letter_stroke(d, [(.27, .15), (.275, .85)], .118, (2.0, 2.0))
    letter_stroke(d, cubic((.25, .16), (.62, .10), (.78, .28), (.58, .47)), .085, (1.3, 1.0), waist=.8)
    letter_stroke(d, [(.58, .47), (.32, .49)], .06, (1.0, 1.0))
    letter_stroke(d, cubic((.44, .49), (.58, .55), (.62, .72), (.76, .85)), .105, (1.0, 2.2))
    notch(d, (.33, .32), -1); notch(d, (.215, .62), 1)
    return [((.27, .28), (.27, .44)), ((.62, .62), (.70, .76))]

def L_X(d):
    letter_stroke(d, cubic((.17, .15), (.35, .38), (.55, .62), (.76, .85)), .118, (2.0, 2.0))
    letter_stroke(d, cubic((.74, .15), (.58, .38), (.38, .62), (.18, .85)), .072, (2.4, 2.4))
    notch(d, (.36, .27), 1); notch(d, (.60, .74), -1)
    return [((.30, .30), (.40, .42)), ((.55, .58), (.65, .70))]

def L_Y(d):
    letter_stroke(d, cubic((.15, .14), (.28, .28), (.38, .40), (.45, .52)), .115, (2.0, 1.0))
    letter_stroke(d, cubic((.76, .14), (.64, .28), (.54, .40), (.47, .52)), .072, (2.3, 1.0))
    letter_stroke(d, [(.46, .50), (.465, .86)], .112, (1.0, 2.1))
    notch(d, (.41, .68), 1); notch(d, (.52, .62), -1)
    return [((.26, .24), (.36, .38)), ((.465, .58), (.465, .76))]

LETTERS = {'E': L_E, 'G': L_G, 'R': L_R, 'X': L_X, 'Y': L_Y}

# ---- the vine ------------------------------------------------------------------------------------------------------------
class Ground:
    """what is taken: hard (letter, frame, leaves) and stems, each with its clearance (distance, units) on a coarse grid"""
    def __init__(s, hard):
        s.hard = hard; s.stem = np.zeros_like(hard); s.k = 4; s.under = None; s.update()
    def update(s):
        k = s.k; s.dh = nd.distance_transform_edt(~s.hard[::k, ::k]) * k / R; s.ds = nd.distance_transform_edt(~s.stem[::k, ::k]) * k / R if s.stem.any() else np.full_like(s.dh, 9.)
    def at(s, p, which='all'):
        j, i = int(p[1] * R / s.k), int(p[0] * R / s.k)
        if not (0 <= j < s.dh.shape[0] and 0 <= i < s.dh.shape[1]): return 0., 0.
        return s.dh[j, i], s.ds[j, i]

def unit(a): return np.array([math.cos(a), math.sin(a)])

def grow_path(g, p, a, length, w0, w1, rng, curv=None, cross=False, own_skip=12, grace=0):
    """step a stem from p along angle a; curv(t, s) gives the wanted curvature; it turns from what is ahead"""
    step = .005; pts = [np.array(p, float)]; angs = [a]; crossings = []; s = 0.; crossing = None; turn = 0.
    n = int(length / step)
    for i in range(n):
        t = i / max(1, n - 1); w = w0 + (w1 - w0) * t; need = w / 2 + G['gap']; vneed = w / 2 + G['vgap']
        k = curv(t, s); best = None
        if cross and abs(turn) > 2.6 and np.sign(k) == np.sign(turn): k = -k   # his stems swing back; they don't loop
        # bend towards the open side when the way narrows (so a stem runs along a channel, as his do round the letter)
        nl = pts[-1] + unit(a - math.pi / 2) * need * 1.6; nr = pts[-1] + unit(a + math.pi / 2) * need * 1.6
        cl, cr = min(g.at(nl)), min(g.at(nr))
        if min(cl, cr) < need * 2: k += float(np.clip((cr - cl) / need, -1, 1)) * 7
        for dev in (0, .08, -.08, .16, -.16, .26, -.26, .38, -.38, .55, -.55):
            aa = a + k * step + (dev if k >= 0 else -dev)
            q = pts[-1] + unit(aa) * step; la = pts[-1] + unit(aa) * (step + need * .9)
            h, st = g.at(q); h2, st2 = g.at(la)
            own = min((np.linalg.norm(q - r) for r in pts[:-own_skip]), default = 9.)
            if h < need or own < need: continue
            if i < grace: st, st2 = 9., 9.
            if st < vneed or st2 < vneed * .6:
                if not cross or crossing is not None and np.linalg.norm(q - crossing) > .09: continue
                # across another stem: allowed when it goes straight over, and clear beyond
                beyond = pts[-1] + unit(aa) * (need * 2 + .05)
                if g.at(beyond)[0] < need or g.at(beyond)[1] < vneed: continue
                if crossing is None and len(crossings) >= 1: continue   # (one crossing a stem)
                if crossing is None: crossing = q.copy(); crossings.append(q.copy())
            elif crossing is not None and np.linalg.norm(q - crossing) > .06: crossing = None
            if h2 < need * .7: continue
            best = aa, q; break
        if best is None and cross and g.under is not None and len(pts) > 20:
            # his vine passes behind the letter: straight on beneath the stroke, if there is room the far side
            for far in np.arange(.08, .3, .01):
                q2 = pts[-1] + unit(a) * far; h2 = g.at(q2)
                if h2[0] < need * 1.3 or h2[1] < vneed * 1.3: continue
                mid = [pts[-1] + unit(a) * f for f in np.arange(step, far, step)]
                if all(g.under(m) for m in mid if g.at(m)[0] < need): best = a, q2; break
                break
            if best is not None:
                for m in mid: pts.append(m); angs.append(a)
                s += far - step
        if best is None: break
        da = best[0] - a; turn = turn + da if np.sign(da) == np.sign(turn) or turn == 0 else da
        a, q = best; pts.append(q); angs.append(a); s += step
    return np.array(pts), np.array(angs), crossings

def stem_mask(pts, w, pointed=False):
    im = Image.new('L', (RW, R), 0); d = ImageDraw.Draw(im)
    if len(pts) < 3: return np.asarray(im) > 0
    p = nd.gaussian_filter1d(pts, 10 if len(pts) > 60 else 4, axis=0, mode='nearest'); fill(d, outline(p, w))
    if not pointed: r = w[-1] / 2 * R; d.ellipse((p[-1][0] * R - r, p[-1][1] * R - r, p[-1][0] * R + r, p[-1][1] * R + r), fill=255)
    r = w[0] / 2 * R; d.ellipse((p[0][0] * R - r, p[0][1] * R - r, p[0][0] * R + r, p[0][1] * R + r), fill=255)
    return np.asarray(im) > 0

def runs_curv(rng, sign0=None):
    """his curvature process: runs of his run length, each one way with a curvature from his quartiles, alternating"""
    q1, q2, q3 = G['curv_q']; runs = []; s = 0.; sg = sign0 if sign0 else (1 if rng.random() < .5 else -1)
    while s < 4:
        L = rng.uniform(*G['run']) * 2.2; k = math.exp(rng.normal(math.log(q2), (math.log(q3) - math.log(q1)) / 2.7))
        runs.append((s, s + L, sg * min(k, 10))); s += L; sg = -sg
    def f(t, s):
        for a, b, k in runs:
            if a <= s < b: return k
        return 0.
    return f

def place_piece(img, ink_hard, piece, oy, p, a, length, gap_px):
    """a piece of his vocabulary, scaled to length (units), stalk at p, turned to angle a; False if it will not fit"""
    sc = length * R / piece.shape[1]
    im = Image.fromarray(piece.astype(np.uint8) * 255)
    im = im.resize((max(2, int(piece.shape[1] * sc)), max(2, int(piece.shape[0] * sc))), Image.BILINEAR)
    oy2 = oy * sc; big = Image.new('L', (im.width * 3, im.width * 3 + im.height * 2), 0); cx, cy = big.width // 2, big.height // 2
    big.paste(im, (cx, int(cy - oy2))); big = big.rotate(-math.degrees(a), resample=Image.BILINEAR, center=(cx, cy))
    m = np.asarray(big) > 127; ys, xs = np.nonzero(m)
    if not len(xs): return False
    X, Y = xs - cx + int(p[0] * R), ys - cy + int(p[1] * R)
    if X.min() < 0 or Y.min() < 0 or X.max() >= RW or Y.max() >= R: return False
    near = np.hypot(X - p[0] * R, Y - p[1] * R) > gap_px * 2.5
    if ink_hard[Y[near], X[near]].any(): return False
    img[Y, X] = True; return True

def make(letter, seed, vocab):
    rng = np.random.default_rng(seed)
    im = Image.new('L', (RW, R), 0); d = ImageDraw.Draw(im)
    cuts = LETTERS[letter](d); let = np.asarray(im) > 127
    fr = int(G['frame'] * R); frame = np.ones_like(let); frame[fr:-fr, fr:-fr] = False
    gap = int(G['gap'] * R)
    hard = frame | nd.binary_dilation(let, iterations=0) ; g = Ground(nd.binary_dilation(let, iterations=1) | frame)
    behind = nd.binary_dilation(let, iterations=gap + 4)
    g.under = lambda q: 0 <= int(q[1] * R) < R and 0 <= int(q[0] * R) < RW and behind[int(q[1] * R), int(q[0] * R)]
    white = let.copy(); taken = nd.binary_dilation(let, iterations=gap) | frame   # (for pieces: anything placed, grown by the gap)
    stems = []; unders = []
    # MAIN stems, one at a time into the biggest black left: rooted at whichever is nearer it, the letter (the stem comes
    # from behind it, so it starts across his gap from its edge) or the frame, set off towards the gap
    dl = nd.distance_transform_edt(~let) / R
    ly, lx = np.nonzero((dl > .002) & (dl < .004)); lpts = np.stack([lx, ly], 1) / R
    fin = np.zeros_like(let); fin[fr + 3:-fr - 3, fr + 3:-fr - 3] = True; fy, fx = np.nonzero(fin & ~nd.binary_erosion(fin)); fpts = np.stack([fx, fy], 1) / R
    w0, w1 = G['stem_main']
    for _ in range(int(os.environ.get('MAINS', 7))):
        free = ~white & ~frame; clear = nd.distance_transform_edt(free[::4, ::4]) * 4 / R
        j, i = np.unravel_index(np.argmax(clear), clear.shape)
        if clear[j, i] < .085: break
        q = np.array([i, j]) * 4 / R; best = None
        for kind, P in (('letter', lpts), ('frame', fpts)):
            dd = np.linalg.norm(P - q, axis=1); dd[(P[:, 0] < .08) | (P[:, 0] > A - .08) | (P[:, 1] < .08) | (P[:, 1] > .92)] += .2 if kind == 'letter' else 0
            k = int(np.argmin(dd)); best = min(best, (dd[k] + (.04 if kind == 'frame' else 0), kind, P[k]), key=lambda z: z[0]) if best else (dd[k], kind, P[k])
        _, kind, p = best; a = math.atan2(*(q - p)[::-1]) + rng.uniform(-.5, .5)
        p = p + unit(a) * ((G['gap'] + w0 / 2 + .004) if kind == 'letter' else .03)
        ln = rng.uniform(.8, 1.3); cands = [grow_path(g, p, a + da, ln, w0, w1, rng, runs_curv(rng), cross=True) for da in (0, 1.2, -1.2)]
        pts, angs, cr = max(cands, key=lambda z: len(z[0]))
        if len(pts) < 20:
            white |= np.zeros_like(white); g.hard[int(q[1] * R) - 6:int(q[1] * R) + 6, int(q[0] * R) - 6:int(q[0] * R) + 6] = True; continue
        w = np.linspace(w0, w1, len(pts)); m = stem_mask(pts, w) & ~nd.binary_dilation(let, iterations=gap)
        for c in cr:   # over/under, alternately: the one beneath gets a black break either side
            over_new = len(unders) % 2 == 0; unders.append(c)
            r = int((w0 + 2 * G['gap']) * R / 2 + 2); yy, xx = np.ogrid[:R, :RW]
            disk = (xx - c[0] * R) ** 2 + (yy - c[1] * R) ** 2 < (r * 2.2) ** 2
            if over_new: white &= ~(disk & nd.binary_dilation(m, iterations=gap // 2 + 2) & ~m)
            else: m &= ~(disk & nd.binary_dilation(white & ~let, iterations=gap // 2 + 2))
        white |= m; g.stem |= m; g.update(); stems.append((pts, angs, w))
    # SHOOTS off every stem, alternately each side, curling into his hook; his vocabulary on the ends with room
    pieces = [(vocab[f'p{i}'], int(vocab[f'o{i}'][0])) for i in json.loads(os.environ.get('PICK', '[]')) or sorted({int(k[1:]) for k in vocab.files if k[0] == 'p'})]
    every = int(G['shoot_every'] * 1.3 / .005); placed_runs = []
    def shoot(pts, angs, w, j, side, depth, ln, aim=None):
        nonlocal white, taken
        a0 = angs[j] + side * rng.uniform(.35, .65) if aim is None else aim
        p0 = pts[j] + unit(angs[j] + side * math.pi / 2) * w[j] * .45
        hook = G['hook'] * rng.uniform(.6, 1.1); k0 = rng.uniform(2, 7); w0 = G['stem_shoot'] * (1.15 if not depth else .9)
        curv = lambda t, s, k0=k0, hook=hook, sd=-side: sd * (k0 + (hook - k0) * t ** 2.2)
        sp, sa, _ = grow_path(g, p0 + unit(a0) * .004, a0, ln, w0, .006, rng, curv, grace=7)
        if len(sp) < 20: return None
        sw = .0035 + (w0 - .0035) * (1 - np.linspace(0, 1, len(sp)) ** 1.7); end_room = g.at(sp[-1]); put = False
        if pieces and len(sp) > 20 and min(end_room) > .03 and rng.random() < .8:
            pc, oy = pieces[rng.integers(len(pieces))]; cut = int(len(sp) * .6)
            sp, sa, sw = sp[:cut], sa[:cut], np.linspace(sw[0], G['stem_shoot'] * .55, cut)
            for f in (1.1, .9, .75, .6):
                if place_piece(white, taken | g.stem, pc, oy, sp[-1], sa[-1], pc.shape[1] / 700 * f, gap): put = True; break
        m = stem_mask(sp, sw, pointed=not put)
        white |= m; g.stem |= m; taken |= nd.binary_dilation(m, iterations=gap)
        if put: g.hard |= white & ~let & ~g.stem
        g.update(); placed_runs.append((sp, sa, sw)); return sp, sa, sw
    queue = [(s, 0) for s in stems]
    while queue:
        (pts, angs, w), depth = queue.pop(0)
        side = 1 if rng.random() < .5 else -1
        for j in range(int(every * rng.uniform(.4, 1)), len(pts) - 6, every):
            side = -side; r = shoot(pts, angs, w, j, side, depth, rng.uniform(.06, .14) if depth else rng.uniform(.1, .26))
            if r and depth < 1 and len(r[0]) > 40: queue.append((r, depth + 1))
    # then the biggest black left, one at a time: a shoot into it from the nearest stem, as he fills his ground
    allruns = stems + placed_runs
    for _ in range(int(os.environ.get('FILLS', 30))):
        ink0 = ~white & ~frame; clear = nd.distance_transform_edt(ink0[::4, ::4]) * 4 / R
        j, i = np.unravel_index(np.argmax(clear), clear.shape); c = clear[j, i]
        if c < .045: break
        q = np.array([i, j]) * 4 / R; best = None
        for k, (pts, angs, w) in enumerate(allruns):
            dd = np.linalg.norm(pts - q, axis=1); dd[:3] = 9; dd[-3:] = 9; jj = int(np.argmin(dd))
            if best is None or dd[jj] < best[0]: best = (dd[jj], k, jj)
        ok = None
        if best and best[0] < c * 3 + .1:
            pts, angs, w = allruns[best[1]]; jj = best[2]; to = q - pts[jj]
            nrm = unit(angs[jj] + math.pi / 2); side = 1 if to @ nrm > 0 else -1
            ok = shoot(pts, angs, w, jj, side, 1, min(.3, best[0] + c * 1.5), aim=math.atan2(to[1], to[0]))
        if not ok:   # nothing reaches it: a dot (his are single, and seldom a grape)
            yy, xx = np.ogrid[:R, :RW]; cc = np.array([i, j]) * 4
            rr = .0085 if c > .06 else .0065
            offs = [(0, 0), (1.15, 0), (-1.15, 0), (.57, 1), (-.57, 1), (0, 2)] if c > .07 else [(0, 0)]
            for ox, oy in offs: white |= (xx - cc[0] - ox * rr * 2.05 * R) ** 2 + (yy - cc[1] - oy * rr * 2.05 * R) ** 2 < (rr * R) ** 2
            g.hard |= white & ~let & ~g.stem; g.update()
        else: allruns.append(ok)
    ink = ~white; ink |= frame
    clear = nd.distance_transform_edt(ink & ~frame) / R
    yy, xx = np.ogrid[:R, :RW]
    for _ in range(int(os.environ.get('DOTS', 24))):
        j, i = np.unravel_index(np.argmax(clear), clear.shape); c = clear[j, i]
        if c < .018: break
        ink &= ~((xx - i) ** 2 + (yy - j) ** 2 < (.0062 * R) ** 2)
        clear[max(0, j - 30):j + 30, max(0, i - 30):i + 30] = 0
    # SHOOTS off every stem, alternately each side, curling into his hook; his vocabulary on the ends with room
    pieces = [(vocab[f'p{i}'], int(vocab[f'o{i}'][0])) for i in json.loads(os.environ.get('PICK', '[]')) or sorted({int(k[1:]) for k in vocab.files if k[0] == 'p'})]
    queue = [(s, 0) for s in stems]
    while queue:
        (pts, angs, w), depth = queue.pop(0)
        L = len(pts); side = 1 if rng.random() < .5 else -1; every = int(G['shoot_every'] / .005)
        for j in range(int(every * rng.uniform(.4, 1)), L - 6, every):
            side = -side; a0 = angs[j] + side * rng.uniform(.6, .95)
            p0 = pts[j] + unit(angs[j] + side * math.pi / 2) * w[j] * .45
            ln = rng.uniform(.06, .14) if depth else rng.uniform(.1, .26)
            hook = G['hook'] * rng.uniform(.6, 1.1); k0 = rng.uniform(2, 7)
            curv = lambda t, s, k0=k0, hook=hook, sd=-side: sd * (k0 + (hook - k0) * t ** 2.2)
            sp, sa, _ = grow_path(g, p0 + unit(a0) * .004, a0, ln, G['stem_shoot'] * (1.15 if not depth else .9), .006, rng, curv, grace=7)
            if len(sp) < 6: continue
            sw = np.linspace(G['stem_shoot'] * (1.15 if not depth else .9), .004, len(sp)); end_room = g.at(sp[-1])
            put = False
            if pieces and len(sp) > 12 and min(end_room) > .045 and rng.random() < .7:
                pc, oy = pieces[rng.integers(len(pieces))]; cut = int(len(sp) * .6)
                sp, sa, sw = sp[:cut], sa[:cut], np.linspace(sw[0], G['stem_shoot'] * .55, cut)
                for f in (1.1, .9, .75, .6):
                    if place_piece(white, taken | g.stem, pc, oy, sp[-1], sa[-1], pc.shape[1] / 700 * f, gap): put = True; break
            m = stem_mask(sp, sw, pointed=not put)
            white |= m; g.stem |= m; taken |= nd.binary_dilation(m, iterations=gap)
            if put: g.hard |= white & ~let & ~g.stem
            g.update()
            if depth < 1 and len(sp) > 40: queue.append(((sp, sa, sw), depth + 1))
    taken |= nd.binary_dilation(white, iterations=gap)
    # his grape clusters, then dots, in the black that is left
    ink = ~white; ink |= frame
    clear = nd.distance_transform_edt(ink & ~frame) / R
    yy, xx = np.ogrid[:R, :RW]; placed = 0
    for _ in range(40):
        j, i = np.unravel_index(np.argmax(clear), clear.shape); c = clear[j, i]
        if c < .022: break
        if c > .04:
            r = .0085; offs = [(0, 0), (1.15, 0), (-1.15, 0), (.57, 1), (-.57, 1), (0, 2)] if c > .05 else [(0, 0), (1.15, 0), (.57, 1)]
            rot = rng.uniform(0, math.pi)
            for ox, oy in offs:
                q = np.array([i, j]) / R + r * 2.05 * np.array([ox * math.cos(rot) - oy * math.sin(rot), ox * math.sin(rot) + oy * math.cos(rot)])
                ink &= ~((xx - q[0] * R) ** 2 + (yy - q[1] * R) ** 2 < (r * R) ** 2)
        else:
            ink &= ~((xx - i) ** 2 + (yy - j) ** 2 < (.0065 * R) ** 2)
        clear[max(0, j - int(c * R * 1.6)):j + int(c * R * 1.6), max(0, i - int(c * R * 1.6)):i + int(c * R * 1.6)] *= 0
        placed += 1
    # his black hairline cut down the thick strokes
    im2 = Image.fromarray(((~ink) * 255).astype(np.uint8)); d2 = ImageDraw.Draw(im2)
    T = lambda q: ((A / 2 + (q[0] - A / 2) * LS) * R, (.5 + (q[1] - .5) * LS) * R)
    for a, b in cuts: d2.line([T(a), T(b)], fill=0, width=max(2, int(.006 * R)))
    ink = np.asarray(im2) < 128
    # the cut edge: every outline wanders by low-frequency noise of his amplitude
    sd = nd.distance_transform_edt(ink) - nd.distance_transform_edt(~ink)
    nz = nd.gaussian_filter(rng.normal(size=ink.shape), 18); nz *= G['edge'] * R / (nz.std() * 1.5 + 1e-9)
    ink = sd + nz > 0
    return ink

def white_p5(ink):
    wt = ~ink; dt = nd.distance_transform_edt(wt); sk = skeletonize(wt) & (dt > 1); w = 2 * dt[sk] / ink.shape[0]
    return round(float(np.percentile(w, 5)), 5) if w.size else .011

if __name__ == '__main__':
    letter, seed, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    vocab = np.load(os.environ.get('VOCAB', 'research/kelmscott/vocab-pick.npz'))
    ink = make(letter, seed, vocab)
    small = np.asarray(Image.fromarray(ink.astype(np.uint8) * 255).resize((int(1000 * A), 1000), Image.LANCZOS)) > 127
    if len(sys.argv) > 4: Image.fromarray(((~small) * 255).astype(np.uint8)).save(sys.argv[4])
    polys = []
    for ct in find_contours(np.pad(small.astype(float), 1), .5):
        ct = approximate_polygon(ct - 1, .45)
        if len(ct) >= 4: polys.append([[round(x / 1000, 4), round(y / 1000, 4)] for y, x in ct])
    json.dump({'name': 'g' + letter, 'src': f'generated: tools/kgrow.py {letter} {seed}', 'a': A, 'polys': polys, 'white': {'p5': white_p5(small)}, 'composed': True, 'generated': True}, open(out, 'w'))
    print(letter, seed, 'white', round(1 - small[50:-50, 50:-50].mean(), 3))
