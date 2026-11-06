# Contact sheet of downloaded images with a 10% grid (to choose which to segment, and the boxes to segment).
# usage: uv run --with pillow python -I tools/strokes/sheet.py <out.jpg> <cell px> <dir>...
import sys, os
from PIL import Image, ImageDraw
Image.MAX_IMAGE_PIXELS = None
out, cell, dirs = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
cols = 6; rows = (len(dirs) + cols - 1) // cols
S = Image.new('RGB', (cols * cell, rows * (cell + 16)), 'white'); dr = ImageDraw.Draw(S)
for k, d in enumerate(dirs):
    im = Image.open(os.path.join(d, 'image.jpg')); im.draft('RGB', (cell, cell)); im = im.convert('RGB'); w, h = im.size
    im.thumbnail((cell, cell))
    x, y = k % cols * cell, k // cols * (cell + 16)
    g = ImageDraw.Draw(im)   # a 10% grid, for choosing the --box of segment.py
    for i in range(1, 10):
        g.line([(im.width * i / 10, 0), (im.width * i / 10, im.height)], fill=(255, 0, 0) if i == 5 else (0, 160, 255)); g.line([(0, im.height * i / 10), (im.width, im.height * i / 10)], fill=(255, 0, 0) if i == 5 else (0, 160, 255))
    S.paste(im, (x, y + 16)); dr.text((x + 2, y + 2), f'{os.path.basename(d.rstrip("/"))} {w}x{h}', fill='black')
S.save(out, quality=85)
