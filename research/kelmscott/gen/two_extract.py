# his two-line initials (playground/fonts/kelmscott/kelmscott-two-s*.woff2): the letter's own black body, inside its white outline
import numpy as np, io, sys
from fontTools.ttLib import TTFont
from PIL import Image, ImageFont, ImageDraw
from scipy import ndimage as nd
S = 1000
def glyph(ch):
    t = TTFont(f'/nvme-mirror/DEV/illum/playground/fonts/kelmscott/kelmscott-two-s{ch}.woff2'); t.flavor = None; b = io.BytesIO(); t.save(b); b.seek(0)
    cp = list(t.getBestCmap().keys())[0]; fo = ImageFont.truetype(b, S); bb = fo.getbbox(chr(cp))
    im = Image.new('L', (bb[2] - bb[0] + 20, bb[3] - bb[1] + 20), 0); ImageDraw.Draw(im).text((10 - bb[0], 10 - bb[1]), chr(cp), font=fo, fill=255)
    return np.asarray(im) > 127   # True = ink
out = {}
for ch in sys.argv[1]:
    ink = glyph(ch); lab, n = nd.label(ink); sz = nd.sum(ink, lab, range(1, n + 1))
    edge = set(np.unique(np.r_[lab[:15].ravel(), lab[-15:].ravel(), lab[:, :15].ravel(), lab[:, -15:].ravel()]))
    cand = [(sz[i], i + 1) for i in range(n) if (i + 1) not in edge]
    cand.sort(reverse=True)
    out[ch] = lab; out[ch + '_cand'] = np.array([c[1] for c in cand[:6]]); out[ch + '_sz'] = np.array([c[0] for c in cand[:6]])
    print(ch, ink.shape, [(int(a), int(b)) for a, b in cand[:6]])
    a = np.zeros(ink.shape + (3,), np.uint8); a[ink] = (90, 90, 90)
    cols = [(220, 40, 40), (40, 160, 40), (40, 80, 220), (200, 160, 0), (160, 0, 160), (0, 160, 160)]
    for k, (_, i) in enumerate(cand[:6]): a[lab == i] = cols[k]
    Image.fromarray(a).resize((ink.shape[1] // 3, ink.shape[0] // 3)).save(f'two/lab_{ch}.png')
np.savez_compressed('two/labs.npz', **out)
