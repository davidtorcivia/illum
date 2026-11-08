import numpy as np, pickle, sys
from PIL import Image, ImageDraw
sys.path.insert(0, '.'); from two2six import ink, A
from k26 import raster
ten = pickle.load(open('ten.pkl', 'rb')); L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz'); his = np.load('his16_done.npz')
SRC = dict(D='K stem + O (two-line)', E='two-line E', G='two-line G', J='two-line I + foot of his n, turned', Q='two-line Q', R='two-line R', U='two-line n turned', W='two-line W', X='two-line K arm+leg', Y='two-line Y')
TWO = dict(D='O', E='E', G='G', J='I', Q='Q', R='R', U='N', W='W', X='K', Y='Y')
def tile(v, dark, h):   # v: coverage 0..1
    img = (22 + v * 210) if dark else (255 - v * 255)
    return Image.fromarray(img.astype(np.uint8)).resize((round(h * v.shape[1] / v.shape[0]), h), Image.LANCZOS)
for dark in (0, 1):
    bg = 22 if dark else 255
    for h, tag in ((173, 'pagesize'), (692, '4x')):
        rows = []
        for c in 'DEGJQRUWXY':
            ours = raster(ten[c]).astype(float) / 255
            two = ink(TWO[c]).astype(float)
            if dark: two = two   # (the two-line block printed as it is: ink light in dark)
            rows.append((c, tile(two, dark, h), tile(ours, dark, h)))
        ref = [tile(raster_ := (np.pad(his[c], ((0, 0), (0, max(0, 665 - his[c].shape[1]))))[:, :665]).astype(float), dark, h) for c in 'CKLP']
        W_ = 5 * (2 * (h + 10) + 30); sh = Image.new('L', (W_, 3 * (h + 30) + h + 60), bg); d = ImageDraw.Draw(sh)
        for n, (c, a, b) in enumerate(rows):
            x = (n % 5) * (2 * (h + 10) + 30); y = (n // 5) * (h + 30)
            sh.paste(a, (x, y + 5)); sh.paste(b, (x + a.width + 8, y + 5)); d.text((x + 2, y + h + 8), f'{c}: his {SRC[c]} | ours, six-line', fill=128)
        y = 2 * (h + 30) + 20; d.text((4, y), "his six-line C K L P (completed masks), for weight and proportion", fill=128)
        for i, im in enumerate(ref): sh.paste(im, (i * (h + 20), y + 16))
        sh.save(f'out5/ten-{tag}-{"dark" if dark else "light"}.png')
