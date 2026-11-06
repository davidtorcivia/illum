import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from ok import oklch
f, box, target = sys.argv[1], tuple(map(int, sys.argv[2].split(','))), int(sys.argv[3])
im = Image.open(f).convert('RGB').crop(box); W = im.size[0]; s = target / W
im = im.resize((target, round(im.size[1]*s)), Image.LANCZOS); a = np.asarray(im); L,C,h = oklch(a)
m = (C>0.025)&(h>45)&(h<125)&(L>0.15); m = nd.binary_erosion(m, iterations=1)
# band std inside mask, using normalized convolution so mask edges don't leak
def blur(x, sg):
    w = nd.gaussian_filter(m.astype(float), sg); return nd.gaussian_filter(np.where(m,x,0), sg)/np.maximum(w,1e-6)
prev = L; out = []
for sg in [0.5,1,2,4,8,16]:
    g = blur(L, sg); out.append((sg, float((prev-g)[m].std()))); prev = g
out.append(('rest', float(prev[m].std())))
print(f'{f} @ {target}px wide (scale {s:.4f}); total L std {L[m].std():.3f}; band std (sigma px):', [(k, round(v,3)) for k,v in out])
