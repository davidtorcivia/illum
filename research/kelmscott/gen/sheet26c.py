import numpy as np, sys, string
from PIL import Image, ImageDraw
d = np.load(sys.argv[1]); tag = sys.argv[2]; HIS = set('ABCFHIKLMNOPTV'); REB = set('SZ')
for dark in (0, 1):
    bg = 22 if dark else 255; sh = Image.new('L', (7 * 300, 4 * 315), bg); dr = ImageDraw.Draw(sh)
    for n, c in enumerate(string.ascii_uppercase):
        v = d[c].astype(float) / 255; img = (22 + v * 210) if dark else (255 - v * 255)
        im = Image.fromarray(img.astype(np.uint8)).resize((285 * v.shape[1] // v.shape[0], 285), Image.LANCZOS)
        x, y = (n % 7) * 300 + 5, (n // 7) * 315 + 5; sh.paste(im, (x, y))
        dr.text((x + 3, y + 290), c + ('  his, completed' if c in HIS else '  his, rebuilt from his C/K/L' if c in REB else '  NEW, from his strokes'), fill=140)
    sh.save(f'out4/{tag}-{"dark" if dark else "light"}.png')
