import numpy as np, sys, string
from PIL import Image, ImageDraw
d = np.load(sys.argv[1]); tag = sys.argv[2]
for dark in (0, 1):
    bg = 22 if dark else 255; sh = Image.new('L', (7 * 300, 4 * 310), bg); dr = ImageDraw.Draw(sh)
    for n, c in enumerate(string.ascii_uppercase):
        v = d[c].astype(float) / 255; img = (22 + v * 210) if dark else (255 - v * 255)
        im = Image.fromarray(img.astype(np.uint8)).resize((285 * v.shape[1] // v.shape[0], 285), Image.LANCZOS)
        sh.paste(im, ((n % 7) * 300 + 5, (n // 7) * 310 + 5)); dr.text(((n % 7) * 300 + 8, (n // 7) * 310 + 292), c, fill=128)
    sh.save(f'out3/{tag}-{"dark" if dark else "light"}.png')
