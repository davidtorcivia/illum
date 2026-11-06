# Build the curated stroke library from segment.py's candidates and the hand-made picks.
# usage: uv run --with pillow --with numpy python -I tools/strokes/build.py <workdir> <picks.txt> <outdir>
#   picks.txt: "<source>: n n n ..." per line; a pick may carry overrides: 12=hook (kind), 12! (reverse direction),
#   12=hook! (both). Writes <outdir>/<id>.webp (RGBA, lossy colour, exact alpha edges kept soft) and <outdir>/manifest.json.
import json, os, re, sys
from PIL import Image

KINDS = {'body', 'hairline', 'curve', 'straight', 'dab', 'flick', 'hook', 'dry'}
NAMES = {'body': 'body stroke', 'dab': 'dab/ball', 'dry': 'dry-brush'}

def main():
    work, picks, out = sys.argv[1:4]
    os.makedirs(out, exist_ok=True)
    lib, seen = [], set()
    for line in open(picks):
        line = line.split('#')[0].strip()
        if not line: continue
        src, nums = line.split(':', 1)
        data = json.load(open(os.path.join(work, src.strip(), 'cands.json')))
        meta, cands = data['source'], {c['cand']: c for c in data['cands']}
        for tok in nums.split():
            m = re.fullmatch(r'(\d+)(?:=(\w+))?(!?)', tok)
            if not m: sys.exit(f'bad pick {tok!r} in {src}')
            n, kind, flip = int(m[1]), m[2], m[3] == '!'
            c = dict(cands[n])
            if kind and kind not in KINDS: sys.exit(f'unknown kind {kind} ({src} {n})')
            cl, hw = c['centerline'], c['halfwidth']
            if flip: cl, hw = cl[::-1], hw[::-1]
            sid = f"{meta['museum']}-{meta['id']}-{n:03d}"
            if sid in seen: continue
            seen.add(sid)
            im = Image.open(os.path.join(work, src.strip(), f'c{n:03d}.png'))
            im.save(os.path.join(out, sid + '.webp'), 'WEBP', quality=86, alpha_quality=90, method=6)
            tags = c['tags'] if not kind else [NAMES.get(kind, kind)] + [t for t in c['tags'] if t != NAMES.get(kind, kind)]
            lib.append(dict(
                id=sid, file=sid + '.webp',
                source=dict(museum={'met': 'The Metropolitan Museum of Art', 'cma': 'Cleveland Museum of Art', 'si': 'Smithsonian'}[meta['museum']],
                            object_id=meta['id'], url=meta['url'], title=meta['title'], date=meta['date'], medium=meta.get('medium', ''),
                            licence=meta['licence'], image=meta['image']),
                **{'class': c['cls']}, kind=tags[0], tags=tags,
                size=c['size'], scale=c['scale'], origin=c['origin'], length=c['length'],
                centerline=cl, halfwidth=hw, mean_colour=c['mean_colour'],
                split=c['split'], dry=c['dry'], direction_confidence=c['dirconf'] if not flip else 'hand'))
    for f in os.listdir(out):                                     # strokes no longer picked
        if f.endswith('.webp') and f[:-5] not in seen: os.remove(os.path.join(out, f))
    json.dump(dict(
        about='Real brush and pen strokes cut from open-access museum images (CC0 / public domain), for exemplar-based stroke '
              'synthesis (warp an exemplar along a new path, after RealBrush, Lu et al. 2013). Each stroke: an RGBA WebP '
              '(paint colour unmixed from its ground, ground transparent), its centerline from the loaded end (start) to the '
              'lift (polyline, crop px), the half-width at 32 even steps along it (crop px), mean colour, length (crop px). '
              'scale = crop px per source px; origin = the crop\'s top-left in source px. split = cut out of a joined '
              'character at a junction (one end may be a cut, not a tip). Built by tools/strokes/.',
        strokes=lib), open(os.path.join(out, 'manifest.json'), 'w'), separators=(',', ':'))
    counts = {}
    for s in lib: counts.setdefault(s['class'], {}).setdefault(s['kind'], 0); counts[s['class']][s['kind']] += 1
    print(len(lib), 'strokes'); [print(' ', k, sum(v.values()), v) for k, v in counts.items()]

if __name__ == '__main__':
    main()
