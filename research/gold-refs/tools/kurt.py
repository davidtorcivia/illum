import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from scipy.stats import kurtosis
from ok import oklch
for a in sys.argv[1:]:
    f, box = a.split(':'); box = tuple(map(int, box.split(',')))
    L,C,h = oklch(np.asarray(Image.open(f).convert('RGB').crop(box)))
    for sg in (1,2,4):
        hp = (L - nd.gaussian_filter(L, sg))[8:-8,8:-8]
        print(f, box, f'σ{sg}: hp std {hp.std():.3f} kurtosis {kurtosis(hp.ravel()):.1f}  skew {float(((hp-hp.mean())**3).mean()/hp.std()**3):.2f}')
