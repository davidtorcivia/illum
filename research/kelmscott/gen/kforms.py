# kforms: Morris's plant forms cut from his own blocks (morris-blocks-700.npz; public domain), as candidates for the
# vocabulary: the vine (white, off the letter) opened by a disc wider than his stems leaves the bodies (leaves, flowers,
# buds); each body, with the white round it, is one form; where his stem enters it is its attachment, the far end its tip.
# usage: python kforms.py OUTDIR -> OUTDIR/cands.npz (masks, attachment, tip, source) and OUTDIR/cands.png (numbered sheet)
import sys, numpy as np
from scipy import ndimage as nd
from PIL import Image, ImageDraw
from skimage.morphology import disk
H = 700
d = np.load('../morris-blocks-700.npz'); out = sys.argv[1]
C = []
for k in 'ABCFHIKLMNOPSTVZ':
    ink, let = d[k + '_ink'], d[k + '_let']
    vine = ~ink & ~nd.binary_dilation(let, iterations=3); vine[:12] = vine[-12:] = 0; vine[:, :12] = vine[:, -12:] = 0
    body = nd.binary_opening(vine, structure=disk(9))                     # (his stems are ~.02-.03 wide: 14-21 px; a body is wider)
    lab, n = nd.label(body)
    for i in range(1, n + 1):
        b = lab == i
        if b.sum() < 900: continue                                            # (too small to be a form)
        form = vine & nd.binary_dilation(b, iterations=6)                     # the body with its edges and points back
        stem = vine & nd.binary_dilation(form, iterations=3) & ~form          # where the rest of the vine meets it
        ys, xs = np.nonzero(form)
        if stem.any():
            sy, sx = np.nonzero(stem); a = np.array([sx.mean(), sy.mean()])
        else: a = np.array([xs.mean(), ys.mean()])
        dd = np.hypot(xs - a[0], ys - a[1]); t = np.array([xs[dd.argmax()], ys[dd.argmax()]])
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        C.append(dict(src=k, m=form[y0:y1, x0:x1], a=a - [x0, y0], t=t - [x0, y0], n=int(stem.sum() > 0)))
print(len(C), 'candidates')
np.savez_compressed(f'{out}/cands.npz', **{f'm{i}': c['m'] for i, c in enumerate(C)}, a=np.array([c['a'] for c in C]), t=np.array([c['t'] for c in C]), src=np.array([c['src'] for c in C]))
S = 130; cols = 12; rows = (len(C) + cols - 1) // cols
sh = Image.new('RGB', (cols * S, rows * S), (40, 40, 40)); dr = ImageDraw.Draw(sh)
for i, c in enumerate(C):
    m = c['m']; sc = (S - 20) / max(m.shape); im = Image.fromarray(np.where(m, 235, 0).astype(np.uint8)).resize((max(1, int(m.shape[1] * sc)), max(1, int(m.shape[0] * sc)))).convert('RGB')
    x, y = (i % cols) * S + 4, (i // cols) * S + 14; sh.paste(im, (x, y)); ax, ay = c['a'] * sc; tx, ty = c['t'] * sc
    dr.ellipse((x + ax - 3, y + ay - 3, x + ax + 3, y + ay + 3), fill=(220, 40, 40)); dr.line((x + ax, y + ay, x + tx, y + ty), fill=(60, 160, 255))
    dr.text((x, y - 13), f'{i} {c["src"]}', fill=(255, 220, 0))
sh.save(f'{out}/cands.png')
