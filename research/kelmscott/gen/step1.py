import numpy as np, json, sys
from PIL import Image
sys.path.insert(0, '.')
from measure import measure, BINS
L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz')
out = {}
for c in 'ABCFHIKLMNOPSTVZ':
    out['M' + c] = measure(L[c + '_ink'], L[c + '_let'])
for c in 'EGRXY':
    im = Image.open(f'kg/{c}.png').convert('L'); im = im.resize((round(im.width * 700 / im.height), 700), Image.LANCZOS)
    out['K' + c] = measure(np.asarray(im) < 128)
np.save('step1.npy', out, allow_pickle=True)
for k, r in out.items():
    print(k, 'white %.3f medAll %.3f medVine %s gap %.3f/%.3f dots %d term %d' % (r['white'], r['med_all'], '%.3f' % r['med_vine'] if 'med_vine' in r else '  -  ', r['gap_med'], r['gap_p90'], r['dots'], r['terminals']))
