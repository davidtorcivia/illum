# tools/kfont.py: traced woodcut blocks (tools/tracecut.py's JSON) packed as webfonts, one glyph per block, for a style
# to draw with fillText and pour as coverage (kit/styles/kelmscott.js). A font is the most compact vector form a browser
# reads natively: the outline refitted as curves (potrace: Béziers at a tolerance tied to the largest size the block is
# drawn), the curves turned to TrueType quadratics (cu2qu, implied on-curve points), the glyf table transformed and
# brotli-compressed by WOFF2. Each glyph is its own small font (so a page fetches only the letters it uses: unicode-range
# per face), or several glyphs share one (the ornaments).
# usage: uv run --with potracer --with fonttools --with brotli --with skia-pathops --with pillow --with numpy python -I
#          tools/kfont.py OUTDIR FAMILY SPEC... [--one NAME]
#   SPEC: file.json=CHAR[@RES] (CHAR: one character, or U+XXXX; RES: this glyph's raster height, for a tall one). Each spec makes OUTDIR/<slug(FAMILY)>-<name>.woff2, or with
#   --one NAME, all of them go into OUTDIR/<slug(FAMILY)>-NAME.woff2.
#   env: RES=900 (the block rasterised this many px tall before refitting)  ALPHA=1.0 (potrace's corner threshold)
#        OPT=.35 (potrace's curve-merging tolerance, px of RES)  ERR=.6 (cu2qu error, font units; the em is 1000 = the
#        block's height)  SMOOTH=0 (a Gaussian on the raster before it is refitted, px at a 600 px height)
# The glyph: the block's height is the em (1000 units), its left edge at x 0, its foot on the baseline; its advance is its
# width. So fillText(ch, x, y + h) at font-size h draws the block in the box [x, y, x + a h, y + h].
import sys, os, json, re
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import potrace, pathops
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.transformPen import TransformPen

RES = int(os.environ.get('RES', 900)); ALPHA = float(os.environ.get('ALPHA', 1.0)); OPT = float(os.environ.get('OPT', .35)); ERR = float(os.environ.get('ERR', .6)); SMOOTH = float(os.environ.get('SMOOTH', 0))
args = sys.argv[1:]; one = None
if '--one' in args: i = args.index('--one'); one = args[i + 1]; args = args[:i] + args[i + 2:]
out, family, specs = args[0], args[1], args[2:]
slug = re.sub(r'[^a-z0-9]+', '-', family.lower()).strip('-')

def glyph_path(d, res=RES):
    """The block's black as a pathops.Path in font units (y up, height 1000)."""
    H = res; W = max(1, round(d['a'] * H)); ss = 2
    acc = np.zeros((H * ss, W * ss), bool)
    for p in d['polys']:   # even-odd, as tracecut wrote it
        im = Image.new('1', (W * ss, H * ss), 0); ImageDraw.Draw(im).polygon([(x * H * ss, y * H * ss) for x, y in p], fill=1); acc ^= np.asarray(im)
    g = Image.fromarray(acc.astype(np.uint8) * 255).resize((W, H), Image.LANCZOS)
    if SMOOTH: g = g.filter(ImageFilter.GaussianBlur(SMOOTH * H / 600))   # (the scan's grain on the edge smoothed away: it is under a pixel at any size drawn)
    bm = np.asarray(g) > 127   # (potracer traces the False cells as the shape: it is handed the ink inverted)
    paths = potrace.Bitmap(~bm).trace(turdsize=2, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=ALPHA, opticurve=True, opttolerance=OPT)
    k = 1000 / H; P = pathops.Path(); pen = P.getPen(); T = lambda p: (p.x * k, (H - p.y) * k)
    for c in paths:
        pen.moveTo(T(c.start_point))
        for s in c.segments:
            if s.is_corner: pen.lineTo(T(s.c)); pen.lineTo(T(s.end_point))
            else: pen.curveTo(T(s.c1), T(s.c2), T(s.end_point))
        pen.closePath()
    P.fillType = pathops.FillType.EVEN_ODD; P.simplify(fix_winding=True, keep_starting_points=False)   # nonzero, outer contours clockwise as TrueType wants
    return P, round(d['a'] * 1000)

def build(glyphs, path):
    """glyphs: [(name, codepoint, pathops.Path, advance)] -> a WOFF2 at path."""
    names = ['.notdef'] + [g[0] for g in glyphs]
    fb = FontBuilder(1000, isTTF=True); fb.setupGlyphOrder(names); fb.setupCharacterMap({g[1]: g[0] for g in glyphs})
    tt = {'.notdef': TTGlyphPen(None).glyph()}; adv = {'.notdef': (500, 0)}
    for name, cp, P, a in glyphs:
        pen = TTGlyphPen(None); P.draw(Cu2QuPen(pen, ERR, reverse_direction=True)); g = pen.glyph(); tt[name] = g; adv[name] = (a, 0)
    fb.setupGlyf(tt); fb.setupHorizontalMetrics({n: (adv[n][0], tt[n].xMin if hasattr(tt[n], 'xMin') and tt[n].numberOfContours else 0) for n in names})
    fb.setupHorizontalHeader(ascent=1000, descent=0); fb.setupOS2(sTypoAscender=1000, sTypoDescender=0, usWinAscent=1000, usWinDescent=0)
    fb.setupNameTable({'familyName': family, 'styleName': 'Regular', 'copyright': 'Outlines traced from William Morris\'s Kelmscott Press woodcuts (public domain); font OFL-1.1'})
    fb.setupPost(); fb.setupMaxp()
    fb.font.flavor = 'woff2'; fb.save(path); return os.path.getsize(path)

items = []
for s in specs:
    f, ch = s.split('='); ch, _, r = ch.partition('@'); cp = int(ch[2:], 16) if ch.startswith('U+') else ord(ch)
    d = json.load(open(f)); name = re.sub(r'[^A-Za-z0-9]', '', d['name']) or f'g{cp:04x}'; P, a = glyph_path(d, int(r) if r else RES); items.append((name, cp, P, a))
os.makedirs(out, exist_ok=True); total = 0
if one: n = build(items, f'{out}/{slug}-{one}.woff2'); total = n; print(f'{slug}-{one}.woff2 {n} B ({len(items)} glyphs)')
else:
    for it in items: n = build([it], f'{out}/{slug}-{it[0]}.woff2'); total += n; print(f'{slug}-{it[0]}.woff2 {n} B')
print('total', total, 'B')
