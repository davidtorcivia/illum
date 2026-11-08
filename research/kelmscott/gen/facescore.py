# score OFL faces' capitals against Morris's 16 letter masks: best placement (scale, shift, weight) of each glyph,
# F = harmonic mean of (his letter covered) and (glyph on his white, not his black)
import numpy as np, glob, os, sys, json
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as nd
from scipy.signal import fftconvolve
Hs = 175
L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz')
def small(a): return np.asarray(Image.fromarray(a.astype(np.uint8) * 255).resize((round(Hs * a.shape[1] / 700), Hs), Image.BILINEAR)) > 127
HIS = {c: (small(L[c+'_let'] & ~L[c+'_ink']), small(L[c+'_ink'])) for c in 'ABCFHIKLMNOPSTVZ'}
def glyph(font_path, ch, cap):
    f = ImageFont.truetype(font_path, 400); x0, y0, x1, y1 = f.getbbox('H'); hh = y1 - y0
    f = ImageFont.truetype(font_path, max(8, int(400 * cap / hh)))
    bb = f.getbbox(ch); im = Image.new('L', (bb[2] - bb[0] + 4, bb[3] - bb[1] + 4), 0); ImageDraw.Draw(im).text((2 - bb[0], 2 - bb[1]), ch, font=f, fill=255)
    return np.asarray(im) > 127
def score(font_path, ch):
    M, K = HIS[ch]; Mf = M.astype(float); Kf = (K & ~nd.binary_dilation(M, iterations=2)).astype(float)
    best = (-1, None)
    for cap in (.66, .72, .78, .84):
        g0 = glyph(font_path, ch, cap * Hs)
        if g0.shape[1] > M.shape[1] - 6: g0 = glyph(font_path, ch, cap * Hs * (M.shape[1] - 8) / g0.shape[1])
        if g0.shape[0] > M.shape[0] - 6: continue
        for wk in (-1, 0, 1, 2):
            g = nd.binary_dilation(g0, iterations=wk) if wk > 0 else (nd.binary_erosion(g0, iterations=-wk) if wk < 0 else g0)
            if g.sum() < 20 or g.shape[0] >= M.shape[0] or g.shape[1] >= M.shape[1]: continue
            gf = g[::-1, ::-1].astype(float)
            hit = fftconvolve(Mf, gf, mode='valid'); bad = fftconvolve(Kf, gf, mode='valid')
            sc = hit - 1.0 * bad; j = np.unravel_index(np.argmax(sc), sc.shape)
            R = hit[j] / M.sum(); P = 1 - bad[j] / g.sum(); F = 2 * P * R / (P + R + 1e-9)
            if F > best[0]: best = (F, (cap, wk, j, R, P))
    return best
if __name__ == '__main__':
    res = {}
    for fp in sorted(glob.glob('../kvfonts/*.ttf')):
        sc = [score(fp, c)[0] for c in 'ABCFHIKLMNOPSTVZ']; res[os.path.basename(fp)] = sc
        print(f'{os.path.basename(fp):32s} mean F {np.mean(sc):.3f}  ' + ' '.join(f'{c}{s:.2f}' for c, s in zip('ABCFHIKLMNOPSTVZ', sc)), flush=True)
    json.dump(res, open('facescore.json', 'w'))
