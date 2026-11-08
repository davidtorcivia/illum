import numpy as np, sys, string
from PIL import Image, ImageDraw
d = np.load(sys.argv[1]); tag = sys.argv[2]
for dark in (0, 1):
    fg, bg = (232, 22) if dark else (0, 255)
    sh = Image.new('L', (7 * 300, 4 * 310), bg); dr = ImageDraw.Draw(sh)
    for n, c in enumerate(string.ascii_uppercase):
        m = d[c]; im = Image.fromarray(np.where(m, fg, bg).astype(np.uint8)).resize((285 * m.shape[1] // m.shape[0], 285), Image.LANCZOS)
        sh.paste(im, ((n % 7) * 300 + 5, (n // 7) * 310 + 5)); dr.text(((n % 7) * 300 + 8, (n // 7) * 310 + 292), c, fill=128)
    sh.save(f'out2/{tag}-{"dark" if dark else "light"}.png')
