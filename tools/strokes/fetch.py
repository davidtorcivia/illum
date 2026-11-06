# Harvest open-access museum images for the stroke library: search, keep only CC0 / public-domain objects, download.
# usage:
#   python -I tools/strokes/fetch.py search met|cma|si "QUERY" [limit]     -> one line per CC0/PD object with an image
#   python -I tools/strokes/fetch.py get met|cma|si ID [ID...] --to RAWDIR  -> RAWDIR/<museum>-<id>/{image.jpg,meta.json}
# Sources: Met Open Access (v1.1 search, v1 objects; isPublicDomain), Cleveland Museum of Art Open Access (CC0 filter),
# Smithsonian Open Access (metadata_usage.access == CC0; api.data.gov key from $SI_KEY, else DEMO_KEY).
import json, os, sys, time, urllib.parse, urllib.request

UA = {'User-Agent': 'illum-strokes/0.1 (research; open-access harvest)'}
SI_KEY = os.environ.get('SI_KEY', 'DEMO_KEY')

def get(url, raw=False):
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                b = r.read()
                return b if raw else json.loads(b)
        except Exception as e:
            if i == 3: raise
            time.sleep(2 + 3 * i)

def met_obj(i):
    d = get(f'https://collectionapi.metmuseum.org/public/collection/v1/objects/{i}')
    if not d.get('isPublicDomain') or not d.get('primaryImage'): return None
    return dict(museum='met', id=str(i), title=d['title'], date=d['objectDate'], medium=d.get('medium', ''),
                url=d['objectURL'], licence='Public domain (Met Open Access, CC0)', image=d['primaryImage'],
                more=d.get('additionalImages', []))

def cma_rec(d):
    if d.get('share_license_status') != 'CC0' or not d.get('images'): return None
    im = d['images'].get('print') or d['images'].get('web')
    return dict(museum='cma', id=str(d['id']), title=d['title'], date=d.get('creation_date', ''), medium=d.get('technique', ''),
                url=d['url'], licence='CC0 (Cleveland Museum of Art Open Access)', image=im['url'], size=[im['width'], im['height']],
                more=[])

def si_rec(r):
    c = r.get('content', {}); dn = c.get('descriptiveNonRepeating', {})
    if dn.get('metadata_usage', {}).get('access') != 'CC0': return None
    media = dn.get('online_media', {}).get('media', [])
    res = [x for m in media for x in m.get('resources', []) if 'High-resolution' in x.get('label', '')] or \
          [{'url': m['content']} for m in media if m.get('type') == 'Images']
    if not res: return None
    ft = c.get('freetext', {})
    return dict(museum='si', id=r['id'], title=r.get('title', ''), date=' '.join(x['content'] for x in ft.get('date', [])),
                medium=' '.join(x['content'] for x in ft.get('physicalDescription', [])), url=dn.get('record_link', dn.get('guid', '')),
                licence='CC0 (Smithsonian Open Access)', image=res[0]['url'], more=[x['url'] for x in res[1:]])

def search(museum, q, limit=40):
    qq = urllib.parse.quote(q)
    if museum == 'met':
        ids = get(f'https://collectionapi.metmuseum.org/public/collection/v1.1/search?q={qq}&hasImages=true').get('objectIDs') or []
        for i in ids[:limit]:
            try: o = met_obj(i)
            except Exception: o = None
            if o: yield o
    elif museum == 'cma':
        for d in get(f'https://openaccess-api.clevelandart.org/api/artworks/?q={qq}&has_image=1&cc0=1&limit={limit}')['data']:
            o = cma_rec(d)
            if o: yield o
    elif museum == 'si':
        for r in get(f'https://api.si.edu/openaccess/api/v1.0/search?q={qq}+AND+online_media_type:Images&rows={limit}&api_key={SI_KEY}')['response']['rows']:
            o = si_rec(r)
            if o: yield o

def lookup(museum, i):
    if museum == 'met': return met_obj(i)
    if museum == 'cma': return cma_rec(get(f'https://openaccess-api.clevelandart.org/api/artworks/{i}')['data'])
    if museum == 'si': return si_rec(get(f'https://api.si.edu/openaccess/api/v1.0/content/{i}?api_key={SI_KEY}')['response'])

if __name__ == '__main__':
    cmd, museum, *rest = sys.argv[1:]
    if cmd == 'search':
        for o in search(museum, rest[0], int(rest[1]) if len(rest) > 1 else 40):
            print(f"{o['museum']} {o['id']}\t{o['date']}\t{o['title'][:70]}\t{o['medium'][:50]}\t{o.get('size', '')}")
    elif cmd == 'get':
        to = rest[rest.index('--to') + 1]; ids = rest[:rest.index('--to')]
        for i in ids:
            d = os.path.join(to, f'{museum}-{i}')
            if os.path.exists(os.path.join(d, 'image.jpg')): continue
            o = lookup(museum, i)
            if not o: print('skip (not CC0/PD or no image)', museum, i); continue
            os.makedirs(d, exist_ok=True)
            img = get(o['image'], raw=True)
            open(os.path.join(d, 'image.jpg'), 'wb').write(img)
            json.dump(o, open(os.path.join(d, 'meta.json'), 'w'), indent=1)
            print('got', museum, i, len(img) // 1024, 'KB', o['title'][:60])
