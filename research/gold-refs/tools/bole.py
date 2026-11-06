import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from ok import oklch, srgb_to_lin
for a in sys.argv[1:]:
    f, box = a.split(':'); box = tuple(map(int, box.split(',')))
    im = np.asarray(Image.open(f).convert('RGB').crop(box)); L,C,h = oklch(im)
    m = (h<58)&(C>0.05)&(L>0.25)
    lin = srgb_to_lin(im.astype(float))[m].mean(0)
    print(f, box, 'red px frac', round(float(m.mean()),3), 'L', np.percentile(L[m],[10,50,90]).round(3).tolist(), 'C', round(float(np.median(C[m])),3), 'h', round(float(np.median(h[m])),1), 'lin', lin.round(3).tolist(), 'sRGB', (np.where(lin<=0.0031308, lin*12.92, 1.055*lin**(1/2.4)-0.055)*255).round().astype(int).tolist())
