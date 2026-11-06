# Contact sheet of downloaded images (to choose which leaves/scrolls to segment).
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
    S.paste(im, (x, y + 16)); dr.text((x + 2, y + 2), f'{os.path.basename(d.rstrip("/"))} {w}x{h}', fill='black')
S.save(out, quality=85)
