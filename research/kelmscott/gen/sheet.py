import numpy as np, sys
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage as nd
sys.path.insert(0, '.'); import klet
L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz')
def fit(m, W=700):
    o = np.zeros((700, W), bool); w = min(W, m.shape[1]); o[:, :w] = m[:, :w]; return o
mine = {c: klet.render(c) for c in 'LKPCEGRXY'}
# numbers: recall of his letter, share of mine on his black
for c in 'LKPC':
    his = fit(L[c+'_let'] & ~L[c+'_ink']); blk = fit(L[c+'_ink']); m = fit(mine[c])
    print(c, 'covers %.2f of his letter; %.2f of mine on his black; mass his-mask %.3f mine %.3f' % ((his & m).sum() / his.sum(), (m & blk).sum() / m.sum(), his.mean(), m.mean()))
def tile(m, dark, label):
    a = np.where(m, 0, 255).astype(np.uint8)
    if dark: a = np.where(m, 232, 22).astype(np.uint8)
    im = Image.fromarray(a).convert('RGB'); im = im.resize((350, 350 * m.shape[0] // m.shape[1]) if False else (int(350 * m.shape[1] / 700), 350), Image.LANCZOS)
    t = Image.new('RGB', (360, 385), (22, 22, 22) if dark else (255, 255, 255)); t.paste(im, (5, 5))
    ImageDraw.Draw(t).text((8, 362), label, fill=(150, 150, 150)); return t
for dark in (0, 1):
    rows = [[tile(fit(L[c+'_let'] & ~L[c+'_ink']), dark, f'Morris {c} (his letter mask)') for c in 'ABCFHIKLMNOPSTVZ'][i:i+8] for i in (0, 8)]
    rows.append([tile(mine[c], dark, f'ours {c} (from his {c})') for c in 'LKPC'] + [tile(mine[c], dark, f'ours {c} (new)') for c in 'EGRX'])
    rows.append([tile(mine['Y'], dark, 'ours Y (new)')])
    sh = Image.new('RGB', (8 * 360, len(rows) * 385), (22, 22, 22) if dark else (255, 255, 255))
    for j, r in enumerate(rows):
        for i, t in enumerate(r): sh.paste(t, (i * 360, j * 385))
    sh.save(f'out1/letters-{"dark" if dark else "light"}.png')
# L vs his L: page size (173 px tall, the specimen's six-line drop) and 4x
for dark in (0, 1):
    hisL = fit(L['L_let'] & ~L['L_ink']); m = fit(mine['L'])
    fg, bg = ((232, 22) if dark else (0, 255))
    pair = [Image.fromarray(np.where(x, fg, bg).astype(np.uint8)) for x in (hisL, m)]
    ps = Image.new('L', (2 * 190, 180), bg); [ps.paste(p.resize((173, 173), Image.LANCZOS), (i * 190 + 5, 3)) for i, p in enumerate(pair)]
    ps.save(f'out1/L-pagesize-{"dark" if dark else "light"}.png')
    big = Image.new('L', (2 * 700, 700), bg); [big.paste(p.resize((692, 692), Image.LANCZOS), (i * 705, 4)) for i, p in enumerate([q.resize((173, 173), Image.LANCZOS) for q in pair])]
    big.save(f'out1/L-4x-{"dark" if dark else "light"}.png')
