import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from ok import oklch, srgb_to_lin
f, box = sys.argv[1], tuple(map(int, sys.argv[2].split(',')))
im = np.asarray(Image.open(f).convert('RGB').crop(box)); L,C,h = oklch(im)
m = (C>0.025)&(h>45)&(h<125)&(L>0.15)
m = nd.binary_opening(m, iterations=2)
lab,n = nd.label(m); sz = nd.sum(m, lab, range(1,n+1)); m = np.isin(lab, 1+np.where(sz > 0.01*m.size)[0])
lin = srgb_to_lin(im.astype(float))
qs = np.percentile(L[m], [0.5,2,10,25,50,75,90,98,99.5])
print('L pct .5/2/10/25/50/75/90/98/99.5:', qs.round(3).tolist())
for lo,hi in [(0.2,0.35),(0.35,0.45),(0.45,0.55),(0.55,0.65),(0.65,0.75),(0.75,0.82),(0.82,0.88),(0.88,0.95),(0.95,1.01)]:
    s = m&(L>=lo)&(L<hi)
    if s.sum()<30: continue
    r = lin[s].mean(0); print(f'L {lo:.2f}-{hi:.2f}: share {s.sum()/m.sum():.3f}  C {np.median(C[s]):.3f} h {np.median(h[s]):5.1f}  linRGB ({r[0]:.3f},{r[1]:.3f},{r[2]:.3f})  g/r {r[1]/r[0]:.2f} b/r {r[2]/r[0]:.2f}')
