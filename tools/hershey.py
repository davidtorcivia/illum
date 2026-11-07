# tools/hershey.py: the Hershey vector fonts (A. V. Hershey, U.S. National Bureau of Standards, 1967: single-stroke letters
# made for plotters and vector CRTs) as pen strokes, for kit/styles/cyber-*.js to write with the ink engine (or a beam).
# usage: python3 -I tools/hershey.py FONT.jhf [CHARS] > out.json
#   FONT.jhf: one of the .jhf files of the public distribution (futural = Roman Simplex, the Leroy-like single-stroke
#   roman; rowmand = Roman Duplex; ...). Get them without running anyone's code: the pip package Hershey-Fonts carries
#   them as a base64 tar inside HersheyFonts.py; decode that string (base64, then tar) into a folder of its own.
#   CHARS: the characters wanted (default printable ASCII); a .jhf's glyphs are in ASCII order from 32.
# Output: { "font", "h": 21 (cap height in Hershey units: the roman caps run from y -12 to +9), "glyphs": { ch: { "l",
#   "r" (the advance's left and right, units), "s": [[[x, y]...]...] (strokes, units; y down, the baseline at y = 9) } } }.
# Hershey's own notice (usenet distribution): "The Hershey Fonts ... are in the public domain ... This distribution is not
# in the NTIS format, and thus is only subject to the simple restriction" that the credit to Hershey and the U.S. NBS be kept.
import sys, json

def glyphs(text):
    # a glyph record: 5 cols number, 3 cols vertex count, then pairs of chars (coordinate = ord - ord('R')); lines wrap at 72
    lines, cur = [], ''
    for raw in text.splitlines():
        if raw.startswith("#") or not raw.strip(): continue   # (this distribution heads each file with a JSON comment)
        if cur and len(cur) - 8 < int(cur[5:8]) * 2: cur += raw; continue
        if cur: lines.append(cur)
        cur = raw
    if cur: lines.append(cur)
    for ln in lines:
        n, body = int(ln[5:8]), ln[8:]
        pairs = [body[i:i + 2] for i in range(0, n * 2, 2)]
        l, r = ord(pairs[0][0]) - 82, ord(pairs[0][1]) - 82
        strokes, s = [], []
        for p in pairs[1:]:
            if p == ' R': strokes.append(s); s = []; continue
            s.append([ord(p[0]) - 82, ord(p[1]) - 82])
        strokes.append(s)
        yield l, r, [s for s in strokes if s]

if __name__ == '__main__':
    path = sys.argv[1]; want = sys.argv[2] if len(sys.argv) > 2 else ''.join(map(chr, range(32, 127)))
    out = {}
    for k, (l, r, s) in enumerate(glyphs(open(path, encoding='latin-1').read())):
        ch = chr(32 + k)
        if ch in want: out[ch] = {'l': l, 'r': r, 's': s}
    json.dump({'font': path.rsplit('/', 1)[-1], 'h': 21, 'glyphs': out}, sys.stdout, separators=(',', ':'))
    # self-check: Roman Simplex's I is one vertical stroke, cap height 21
    if 'I' in out and path.endswith('futural.jhf'): assert out['I']['s'] == [[[0, -12], [0, 9]]], out['I']
