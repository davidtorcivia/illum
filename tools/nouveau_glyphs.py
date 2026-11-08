# Export Bocklin capitals as flattened contours (units: cap height = 1, y down, origin at the ink's left edge, baseline at y=0
# measured downward: y = -(font y)/cap). One JSON per letter: { a: advance/cap, b: [l, t, r, bot] ink box, c: [[x,y,...], ...] }
import json, sys
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
font, out = sys.argv[1], sys.argv[2]
f = TTFont(font); gs = f.getGlyphSet(); cmap = f.getBestCmap()
class P(BasePen):
    def __init__(s, gs): super().__init__(gs); s.C = []; s.cur = None
    def _moveTo(s, p): s.cur = [p]; s.C.append(s.cur)
    def _lineTo(s, p): s.cur.append(p)
    def _curveToOne(s, a, b, c):
        p0 = s.cur[-1]
        for i in range(1, 13):
            t = i / 12; u = 1 - t
            s.cur.append((u**3*p0[0]+3*u*u*t*a[0]+3*u*t*t*b[0]+t**3*c[0], u**3*p0[1]+3*u*u*t*a[1]+3*u*t*t*b[1]+t**3*c[1]))
    def _qCurveToOne(s, a, b):
        p0 = s.cur[-1]
        for i in range(1, 9):
            t = i / 8; u = 1 - t
            s.cur.append((u*u*p0[0]+2*u*t*a[0]+t*t*b[0], u*u*p0[1]+2*u*t*a[1]+t*t*b[1]))
    def _closePath(s): pass
    def _endPath(s): pass
hp = P(gs); gs[cmap[ord('H')]].draw(hp); cap = max(y for c in hp.C for x, y in c)
for ch in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
    p = P(gs); g = gs[cmap[ord(ch)]]; g.draw(p)
    xs = [x for c in p.C for x, y in c]; ys = [y for c in p.C for x, y in c]; l = min(xs)
    C = [[round(v, 4) for x, y in c for v in ((x - l) / cap, -y / cap)] for c in p.C if len(c) > 2]
    json.dump({'a': round(g.width / cap, 4), 'b': [0, round(-max(ys) / cap, 4), round((max(xs) - l) / cap, 4), round(-min(ys) / cap, 4)], 'c': C}, open(f'{out}/bocklin-{ch}.json', 'w'), separators=(',', ':'))
