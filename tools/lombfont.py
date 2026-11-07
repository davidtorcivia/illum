# tools/lombfont.py: the choir book's Lombardic capitals (tools/lombcompose.py's JSON) as webfonts, one per letter, so a page
# fetches only the letters it uses (unicode-range per @font-face, or FontFace per letter). As tools/kfont.py (potrace's
# curves, cu2qu, WOFF2), but with EB Garamond's vertical metrics (em 1000, typo ascender 1007, descender -298, USE_TYPO_
# METRICS) and the capital set to Garamond's cap height (650) on the baseline: so a drop initial set in this face is
# sized and placed by kit/illum.js (which measures the drop by Garamond's metrics) exactly as a Garamond capital would be,
# and it floats as wide as the Lombard itself. Side bearings: SB units each side.
# usage: uv run --with potracer --with fonttools --with brotli --with skia-pathops --with pillow --with numpy python -I
#          tools/lombfont.py OUTDIR FAMILY JSON...      env: RES=900 ALPHA=1.0 OPT=.35 ERR=.6 SB=24 CAP=650 CREDIT=(copyright record)
# A letter given as 'curves' (tools/lombhand.py: cubic contours, units of the cap height, y down from the cap line) is drawn
# as it is; one given as 'polys' is traced by potrace as before.
import sys, os, json, re
import numpy as np
from PIL import Image, ImageDraw
import potrace, pathops
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
E = lambda k, d: float(os.environ.get(k, d))
RES = int(E('RES', 900)); CAP = E('CAP', 650); SB = E('SB', 24)
out, family, files = sys.argv[1], sys.argv[2], sys.argv[3:]; slug = re.sub(r'[^a-z0-9]+', '-', family.lower()).strip('-'); os.makedirs(out, exist_ok=True)
def glyph_path(d):
    if 'curves' in d:   # smooth vectors already (tools/lombhand.py): drawn as they are, no trace
        P = pathops.Path(); pen = P.getPen(); T = lambda x, y: (SB + x * CAP, (1 - y) * CAP)
        for cc in d['curves']:
            pen.moveTo(T(*cc[0]))
            for s in cc[1:]: pen.curveTo(T(s[0], s[1]), T(s[2], s[3]), T(s[4], s[5]))
            pen.closePath()
        P.simplify(fix_winding=True, keep_starting_points=False); return P, round(d['a'] * CAP + 2 * SB)
    H = RES; W = max(1, round(d['a'] * H)); acc = np.zeros((H * 2, W * 2), bool)
    for p in d['polys']:
        im = Image.new('1', (W * 2, H * 2), 0); ImageDraw.Draw(im).polygon([(x * H * 2, y * H * 2) for x, y in p], fill=1); acc ^= np.asarray(im)
    bm = np.asarray(Image.fromarray(acc.astype(np.uint8) * 255).resize((W, H), Image.LANCZOS)) > 127
    paths = potrace.Bitmap(~bm).trace(turdsize=2, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=E('ALPHA', 1.0), opticurve=True, opttolerance=E('OPT', .35))
    k = CAP / H; P = pathops.Path(); pen = P.getPen(); T = lambda p: (SB + p.x * k, (H - p.y) * k)
    for c in paths:
        pen.moveTo(T(c.start_point))
        for s in c.segments:
            if s.is_corner: pen.lineTo(T(s.c)); pen.lineTo(T(s.end_point))
            else: pen.curveTo(T(s.c1), T(s.c2), T(s.end_point))
        pen.closePath()
    P.fillType = pathops.FillType.EVEN_ODD; P.simplify(fix_winding=True, keep_starting_points=False)
    return P, round(d['a'] * CAP + 2 * SB)
total = 0
for f in files:
    d = json.load(open(f)); ch = d['char']; name = 'L' + ch; P, adv = glyph_path(d)
    fb = FontBuilder(1000, isTTF=True); fb.setupGlyphOrder(['.notdef', name]); fb.setupCharacterMap({ord(ch): name})
    pen = TTGlyphPen(None); P.draw(Cu2QuPen(pen, E('ERR', .6), reverse_direction=True)); g = pen.glyph()
    fb.setupGlyf({'.notdef': TTGlyphPen(None).glyph(), name: g}); fb.setupHorizontalMetrics({'.notdef': (500, 0), name: (adv, g.xMin if g.numberOfContours else 0)})
    fb.setupHorizontalHeader(ascent=1007, descent=-298, lineGap=0)
    fb.setupOS2(version=4, sTypoAscender=1007, sTypoDescender=-298, sTypoLineGap=0, usWinAscent=1047, usWinDescent=390, sCapHeight=int(CAP), fsSelection=0x40 | 0x80)
    fb.setupNameTable({'familyName': family, 'styleName': 'Regular', 'copyright': os.environ.get('CREDIT') or f'Outlines traced from Italian choir-book Lombards (public domain: {d.get("src", "")[:180]}); font OFL-1.1'})
    fb.setupPost(); fb.setupMaxp(); fb.font.flavor = 'woff2'; path = f'{out}/{slug}-{ch}.woff2'; fb.save(path); n = os.path.getsize(path); total += n; print(path.split('/')[-1], n, 'B', 'adv', adv)
print('total', total, 'B')
