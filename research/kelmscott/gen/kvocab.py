# kvocab: Morris's plant forms, cut from his own blocks (morris-blocks-700.npz; public domain) and refitted as smooth
# vector outlines, each with its attachment (where his stem enters it) and its axis (attachment -> farthest point).
# A form is named by its block and a box round it, drawn so only its stem leaves the box: the white inside the box
# (largest piece) is the form, the stem's cut at the box edge its attachment. Refit: potrace (smooth Beziers), then
# normalised: attachment at (0, 0), axis along +x, length 1 (width in the same units). Kind: what it may be used as.
# usage: python kvocab.py OUTDIR   -> OUTDIR/vocab.json (forms) and OUTDIR/vocab-sheet.png (his beside the refit)
import sys, json, math, numpy as np
from scipy import ndimage as nd
from PIL import Image, ImageDraw
import potrace
FORMS = [   # name, block, box (x0, y0, x1, y1 in his 700 px block), kind
    ('P-tulip', 'P', (355, 225, 470, 345), 'flower'), ('P-bud', 'P', (220, 395, 295, 480), 'bud'), ('P-sprig', 'P', (455, 535, 560, 650), 'leaf'),
    ('P-curl', 'P', (560, 55, 668, 105), 'leaf'), ('K-ring', 'K', (350, 95, 415, 170), 'bud'),
    ('C-lobe', 'C', (300, 460, 435, 595), 'flower'), ('C-trefoil', 'C', (470, 195, 590, 295), 'leaf'),
    ('C-curl', 'C', (545, 490, 645, 560), 'leaf'), ('S-vine1', 'S', (220, 70, 405, 235), 'leaf'),
    ('S-vine2', 'S', (205, 280, 435, 470), 'leaf'),  ('S-vine3', 'S', (550, 525, 690, 685), 'leaf'),
    ('S-vine4', 'S', (95, 465, 220, 580), 'leaf'), ('B-leaf1', 'B', (8, 155, 95, 220), 'leaf'), ('B-leaf2', 'B', (22, 238, 112, 300), 'leaf'),
    ('B-leaf3', 'B', (575, 25, 640, 122), 'leaf'), ('B-leaf4', 'B', (630, 15, 695, 90), 'leaf'), ('B-rose', 'B', (272, 62, 478, 262), 'flower'),
    ('O-tri', 'O', (245, 340, 405, 505), 'flower'), ('O-flame', 'O', (145, 140, 310, 240), 'leaf'),
    ('H-vine1', 'H', (340, 70, 482, 216), 'leaf'), ('H-vine3', 'H', (322, 343, 442, 452), 'leaf'),
]

def cut(ink, box):
    x0, y0, x1, y1 = box; w = ~ink[y0:y1, x0:x1]
    lab, n = nd.label(w); m = lab == (np.argmax(nd.sum(w, lab, range(1, n + 1))) + 1)
    edge = np.zeros_like(m); edge[0] = edge[-1] = True; edge[:, 0] = edge[:, -1] = True
    e = m & edge
    inner = np.setdiff1d(np.arange(1, n + 1), np.unique(lab[edge & w]))
    near = nd.binary_dilation(m, iterations=13); m0 = m.copy()
    for i in inner:   # (the pieces wholly inside the box and close to it belong to the form: petals, berries, a flower's eye)
        if (lab == i).sum() > 25 and (near & (lab == i)).any(): m |= lab == i
    for _ in range(2):   # (petals reach further: a second ring)
        near = nd.binary_dilation(m, iterations=13)
        for i in inner:
            if (lab == i).sum() > 60 and (near & (lab == i)).any(): m |= lab == i
    if e.any():   # the stem's cut: the largest run of the form along the box edge
        el, en = nd.label(e, structure=np.ones((3, 3))); big = el == (np.argmax(nd.sum(e, el, range(1, en + 1))) + 1)
        ys, xs = np.nonzero(big); a = np.array([xs.mean(), ys.mean()])
    else: ys, xs = np.nonzero(m); a = np.array([xs.mean(), ys.max()])
    ml, mn = nd.label(m); sz = nd.sum(m, ml, range(1, mn + 1)); m = np.isin(ml, 1 + np.nonzero(sz >= 60)[0])   # (no specks)
    ys, xs = np.nonzero(m); dd = np.hypot(xs - a[0], ys - a[1]); t = np.array([xs[dd.argmax()], ys[dd.argmax()]])
    return m, a, t

def refit(m, a, t, ss=4):
    """the form as smooth curves (potrace at 4x, Gaussian-softened), normalised: a at 0, axis +x, length 1"""
    im = Image.fromarray(np.pad(m, 4).astype(np.uint8) * 255).resize(((m.shape[1] + 8) * ss, (m.shape[0] + 8) * ss), Image.BICUBIC)
    g = nd.gaussian_filter(np.asarray(im, float), ss * .9) > 127
    paths = potrace.Bitmap(~g).trace(turdsize=20, alphamax=1.15, opticurve=True, opttolerance=.4)
    L = np.hypot(*(t - a)); u = (t - a) / L; R = np.array([[u[0], u[1]], [-u[1], u[0]]])
    P = lambda q: (np.array([q.x, q.y]) / ss - 4 - a) @ R.T / L
    rings = []
    for c in paths:
        pts = [P(c.start_point)]
        for sg in c.segments:
            if sg.is_corner: pts += [P(sg.c), P(sg.end_point)]
            else:
                p0 = pts[-1]; c1, c2, e = P(sg.c1), P(sg.c2), P(sg.end_point)
                pts += [(1 - s) ** 3 * p0 + 3 * (1 - s) ** 2 * s * c1 + 3 * (1 - s) * s ** 2 * c2 + s ** 3 * e for s in np.linspace(0, 1, 10)[1:]]
        rings.append([[round(float(x), 4), round(float(y), 4)] for x, y in pts])
    return rings, L

if __name__ == '__main__':
    out = sys.argv[1]; d = np.load('../morris-blocks-700.npz'); V = []
    S = 200; sh = Image.new('RGB', (len(FORMS) * 0 + 6 * 2 * (S + 8), ((len(FORMS) + 5) // 6) * (S + 24)), (30, 30, 30)); dr = ImageDraw.Draw(sh)
    for i, (name, k, box, kind) in enumerate(FORMS):
        m, a, t = cut(d[k + '_ink'], box); rings, L = refit(m, a, t)
        V.append(dict(name=name, kind=kind, rings=rings, size=round(float(L) / 700, 4)))
        x, y = (i % 6) * 2 * (S + 8), (i // 6) * (S + 24) + 18; sc = (S - 10) / max(m.shape)
        im = Image.fromarray(np.where(m, 235, 0).astype(np.uint8)).resize((int(m.shape[1] * sc), int(m.shape[0] * sc)), Image.LANCZOS).convert('RGB'); sh.paste(im, (x, y))
        dr.ellipse((x + a[0] * sc - 4, y + a[1] * sc - 4, x + a[0] * sc + 4, y + a[1] * sc + 4), fill=(230, 50, 50)); dr.line((x + a[0] * sc, y + a[1] * sc, x + t[0] * sc, y + t[1] * sc), fill=(80, 160, 255))
        # the refit, drawn in its own frame (axis left to right)
        r2 = Image.new('L', (S * 2, S * 2), 0); d2 = ImageDraw.Draw(r2); f = S * 1.6
        allp = np.concatenate([np.array(r) for r in rings]); cy = (allp[:, 1].min() + allp[:, 1].max()) / 2
        acc = np.zeros((S * 2, S * 2), bool)
        for r in rings:
            ri = Image.new('1', (S * 2, S * 2), 0); ImageDraw.Draw(ri).polygon([(S * .2 + px * f, S - (py - cy) * f) for px, py in r], fill=1); acc ^= np.asarray(ri)
        sh.paste(Image.fromarray((acc * 235).astype(np.uint8)).resize((S, S), Image.LANCZOS).convert('RGB'), (x + S + 8, y))
        dr.text((x, y - 15), f'{i} {name} ({kind})', fill=(255, 210, 0))
    json.dump(V, open(f'{out}/vocab.json', 'w')); sh.save(f'{out}/vocab-sheet.png'); print(len(V), 'forms')
