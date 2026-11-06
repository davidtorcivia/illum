import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from scipy.stats import kurtosis
from ok import oklch
f, box = sys.argv[1], tuple(map(int, sys.argv[2].split(',')))
im = np.asarray(Image.open(f).convert('RGB').crop(box)); L,C,h = oklch(im)
m = (C>0.03)&(h>50)&(h<120)&(L>0.2)
m = nd.binary_closing(nd.binary_opening(m, iterations=2), iterations=3)
lab,n = nd.label(m); sz = nd.sum(m, lab, range(1,n+1)); m = nd.binary_fill_holes(np.isin(lab, 1+np.where(sz > 0.01*m.size)[0]))
d = nd.distance_transform_edt(m); ds = nd.gaussian_filter(d, 3)
gy, gx = np.gradient(ds)  # points inward (away from edge)
ang = (np.degrees(np.arctan2(-gy, -gx)) % 360)  # outward normal of the edge, image coords (0=right, 90=down)
band = m & (d>3) & (d<48)
print('edge band 3-48px: L by outward-normal direction (0=right,90=down,180=left,270=up)')
for a in range(0,360,45):
    s = band & (((ang - a + 22.5) % 360) < 45)
    if s.sum()>200: print(f'  {a:3d}deg: L {L[s].mean():.3f} (p10 {np.percentile(L[s],10):.3f} p90 {np.percentile(L[s],90):.3f}) n {int(s.sum())}')
inner = m & (d>96)
hp = L - nd.gaussian_filter(L, 2)
print('interior (d>96) L', L[inner].mean().round(3), 'std', L[inner].std().round(3), ' high-pass(σ2) kurtosis', round(float(kurtosis(hp[inner])),1), '(gaussian=0)')
