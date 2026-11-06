import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from ok import oklch
f, box, W = sys.argv[1], tuple(map(int, sys.argv[2].split(','))), float(sys.argv[3])
im = np.asarray(Image.open(f).convert('RGB').crop(box)); L,C,h = oklch(im)
m = (C>0.03)&(h>50)&(h<120)&(L>0.2)
m = nd.binary_closing(nd.binary_opening(m, iterations=2), iterations=3)
lab,n = nd.label(m); sz = nd.sum(m, lab, range(1,n+1)); keep = np.isin(lab, 1+np.where(sz > 0.01*m.size)[0]); m = nd.binary_fill_holes(keep)
d = nd.distance_transform_edt(m)
print('gold px', int(m.sum()), 'max dist', round(float(d.max()),1))
edges = [0,2,4,8,12,16,24,32,48,64,96,128,192,256,400]
for a,b in zip(edges[:-1],edges[1:]):
    s = m&(d>a)&(d<=b)
    if s.sum()<50: continue
    print(f'd {a:>3}-{b:<3}px ({a/W*100:5.2f}-{b/W*100:5.2f}% W): L {L[s].mean():.3f} p10 {np.percentile(L[s],10):.3f} p90 {np.percentile(L[s],90):.3f}  C {C[s].mean():.3f} h {h[s].mean():.1f}  n {int(s.sum())}')
# large-scale smooth part: blur L inside mask at sigma = 3% W, measure its range
Lf = np.where(m, L, 0); wgt = nd.gaussian_filter(m.astype(float), 0.03*W); sm = nd.gaussian_filter(Lf, 0.03*W)/np.maximum(wgt,1e-6)
print('low-pass(3%W) L range p5..p95:', np.percentile(sm[m],[5,50,95]).round(3).tolist(), ' residual std:', round(float((L-sm)[m].std()),3))
Image.fromarray((np.where(m, np.clip(L,0,1), 0)*255).astype(np.uint8)).save(sys.argv[4])
