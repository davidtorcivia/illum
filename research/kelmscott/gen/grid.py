import numpy as np, sys
from PIL import Image, ImageDraw
L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz')
for c in sys.argv[1]:
    ink = L[c+'_ink']; let = L[c+'_let']; S = 1000 / 700
    a = np.full(ink.shape+(3,), 255, np.uint8); a[ink] = 0; a[let] = (255, 190, 170)
    im = Image.fromarray(a).resize((int(ink.shape[1]*S), 1000)); d = ImageDraw.Draw(im)
    for k in range(1, 20):
        v = k * 50; col = (0, 160, 255) if k % 2 == 0 else (0, 90, 160)
        d.line([(v, 0), (v, 1000)], fill=col, width=1); d.line([(0, v), (im.width, v)], fill=col, width=1)
        d.text((v + 2, 2), f'{k*5}', fill=(255, 255, 0)); d.text((2, v + 2), f'{k*5}', fill=(255, 255, 0))
    im.save(f'grid_{c}.png')
