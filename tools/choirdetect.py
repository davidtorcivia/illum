# tools/choirdetect.py: find the Lombards on a book's page images (research/17 §4d): solid blobs of blue or red paint, staff lines and
# hairlines opened away; writes a padded crop of each and an index (page, colour, box) for contact sheets and tracing.
# usage: uv run --with pillow --with numpy --with scipy python -I tools/choirdetect.py PAGEDIR OUTDIR
# detect.py PAGEDIR OUTDIR: Lombards on each page: large solid blobs of blue or red paint; crops (padded) + an index
import sys, os, json, glob, numpy as np
from PIL import Image
from scipy import ndimage as nd
src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True); idx = []
for f in sorted(glob.glob(src + '/n*.jpg'), key=lambda s: int(s.split('/n')[-1][:-4])):
    try: im = Image.open(f).convert('RGB')
    except Exception: continue
    X = np.asarray(im).astype(float) / 255; r, g, b = X[..., 0], X[..., 1], X[..., 2]; mx = X.max(2); mn = X.min(2); s = (mx - mn) / np.maximum(mx, 1e-6)
    blue = (b > r + .06) & (s > .25) & (mx > .2); red = (r > g + .2) & (r > b + .15) & (s > .4)
    for col, m in (('b', blue), ('r', red)):
        m = nd.binary_opening(m, iterations=2)          # hairlines and staff lines fall away
        m = nd.binary_closing(m, iterations=4)
        lab, n = nd.label(m)
        for i, sl in enumerate(nd.find_objects(lab)):
            h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start; area = (lab[sl] == i + 1).sum()
            if h < 55 or w < 25 or h > 600 or area < 900: continue
            y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop; p = int(h * .35)
            box = [max(0, x0 - p), max(0, y0 - p), min(im.width, x1 + p * 2), min(im.height, y1 + p)]
            name = f"{os.path.basename(f)[:-4]}_{col}{i}"; im.crop(box).save(f'{out}/{name}.jpg', quality=85)
            idx.append({'name': name, 'page': os.path.basename(f)[:-4], 'col': col, 'box': box, 'size': [im.width, im.height], 'h': h})
json.dump(idx, open(out + '/index.json', 'w')); print(len(idx))
