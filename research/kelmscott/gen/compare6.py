import io, numpy as np
from fontTools.ttLib import TTFont
from PIL import Image, ImageFont, ImageDraw
def font(path, size):
    t = TTFont(path); t.flavor = None; b = io.BytesIO(); t.save(b); b.seek(0); return ImageFont.truetype(b, size), chr(list(t.getBestCmap().keys())[0])
def block(path, h, dark):
    f, ch = font(path, h); w = int(h * 1.0); im = Image.new('L', (w, h + 2), 22 if dark else 246)
    ImageDraw.Draw(im).text((0, h), ch, font=f, fill=232 if dark else 20, anchor='ls'); return im
ini = Image.open('/nvme-mirror/temp/claude/tmp/claude-1000/-nvme-mirror-DEV-illum/b7e44ace-1102-4b61-9be0-601ecc122043/scratchpad/final7/initialis-ours-morris-4x-light.png').convert('L')
k = 1880 / 1456; rows = [(50, 476), (553, 980), (1058, 1484), (1560, 1987), (2066, 2492)]
INI = {c: ini.crop((int(27 * k), int(a * k), int(453 * k), int(b * k))) for c, (a, b) in zip('EGRXY', rows)}
F = '/nvme-mirror/DEV/illum/playground/fonts/kelmscott/'
for dark in (0, 1):
    for h, tag in ((173, 'pagesize'), (692, '4x')):
        ours = [block(f'fonts6/kelmscott-vine-next-n{c}.woff2', h, dark) for c in 'EGRXY']
        his = [block(F + f'kelmscott-vine-v{c}.woff2', h, dark) for c in 'CKLPV']
        ini_ = [(INI[c].point(lambda v: 255 - v) if dark else INI[c]).resize((h, h), Image.LANCZOS) for c in 'EGRXY']
        cols = 5 if h < 300 else 5
        sh = Image.new('L', (5 * (h + 16) + 16, 3 * (h + 34) + 10), 22 if dark else 246); d = ImageDraw.Draw(sh)
        for r, (row, lab) in enumerate(((ours, 'ours (vector, kfont): E G R X Y'), (his, "Morris's own: C K L P V"), (ini_, 'initialis "Kelmscott" preset: E G R X Y'))):
            d.text((16, r * (h + 34) + 4), lab, fill=150)
            for i, im in enumerate(row): sh.paste(im, (16 + i * (h + 16), r * (h + 34) + 22))
        sh.save(f'out6/blocks-{tag}-{"dark" if dark else "light"}.png')
