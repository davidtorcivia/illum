# The 26 GL-Morris letters for kit/styles/kelmscott-garden.js, placed in the block exactly as kgap.py places them (block
# units: height 1, width .95, y down) with Morris's hairline cut (cuts.py), as polygon rings (vector, from the font's
# outlines via shapely; nothing rasterised). usage (from this dir): python kgarden_letters.py OUTDIR  -> OUTDIR/garden-A.json ... (one per letter, fetched as needed)
import sys, json
sys.path.insert(0, '.')
import kgap
for ch in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
    g = kgap.letter(ch).simplify(.0004)
    rings = []
    for p in getattr(g, 'geoms', [g]):
        for r in [p.exterior, *p.interiors]:
            rings.append([v for x, y in list(r.coords)[:-1] for v in (round(x * 1e4), round(y * 1e4))])
    json.dump(rings, open(f'{sys.argv[1]}/garden-{ch}.json', 'w'), separators=(',', ':'))
