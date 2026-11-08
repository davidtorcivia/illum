import numpy as np, sys
from PIL import Image
from scipy import ndimage as nd
sys.path.insert(0, '.'); import klet
L = np.load('/nvme-mirror/DEV/illum/research/kelmscott/morris-blocks-700.npz')
row = []
for ch in sys.argv[1]:
    m = klet.render(ch); H, W = m.shape
    a = np.full((700, 700, 3), 255, np.uint8)
    if ch + '_let' in L.files:
        his = L[ch + '_let'] & ~L[ch + '_ink']; his = his[:, :W] if his.shape[1] >= W else np.pad(his, ((0, 0), (0, W - his.shape[1])))
        b = np.full((700, 700, 3), 255, np.uint8); b[:, :W][~L[ch + '_ink'][:, :W] if L[ch+'_ink'].shape[1] >= W else np.pad(~L[ch+'_ink'], ((0,0),(0,W-L[ch+'_ink'].shape[1])))] = (225, 225, 225)
        b[:, :W][his] = 0
        o = np.full((700, 700, 3), 255, np.uint8); o[:, :W][his & m] = 0; o[:, :W][his & ~m] = (220, 40, 40); o[:, :W][~his & m] = (40, 90, 220)
        row += [b, o]
    a[:, :W][m] = 0; row.append(a)
im = np.concatenate([np.pad(r, ((10, 10), (10, 10), (0, 0)), constant_values=255) for r in row], 1)
Image.fromarray(im).save(sys.argv[2])
