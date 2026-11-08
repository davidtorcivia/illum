import numpy as np, sys
from PIL import Image
sys.path.insert(0, '.'); import khand
font = sys.argv[1]; L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz')
tiles = []
for c in 'CKLP':
    ours = khand.raster(khand.hand(font, c)); W = ours.shape[1]
    his = (L[c+'_let'] & ~L[c+'_ink']); hb = np.zeros((700, W), np.uint8); w = min(W, his.shape[1]); hb[:, :w] = his[:, :w] * 255
    full = np.zeros((700, W), np.uint8); fw = ~L[c+'_ink']; full[:, :w] = fw[:, :w] * 255
    tiles.append((full, hb, ours))
for dark in (0, 1):
    for scale, tag in ((173, 'pagesize'), (692, '4x')):
        row = []
        for full, hb, ours in tiles:
            for a in (hb, ours):
                v = a.astype(float) / 255; img = (22 + v * 210) if dark else (255 - v * 255)
                im = Image.fromarray(img.astype(np.uint8)).resize((round(173 * a.shape[1] / 700), 173), Image.LANCZOS)
                if scale != 173: im = im.resize((round(scale * a.shape[1] / 700), scale), Image.BICUBIC)
                row.append(im)
        sh = Image.new('L', (sum(i.width + 12 for i in row) + 12, row[0].height + 24), 22 if dark else 255)
        x = 12
        for i in row: sh.paste(i, (x, 12)); x += i.width + 12
        sh.save(f'out3/CKLP-{tag}-{"dark" if dark else "light"}.png')
