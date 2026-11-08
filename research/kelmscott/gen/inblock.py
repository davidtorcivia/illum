# our letter in a block with kgrow's current vine grown round it (context only; vine unchanged)
import sys, numpy as np
from PIL import Image
sys.path.insert(0, '/nvme-mirror/DEV/illum/tools'); sys.path.insert(0, '.')
import kgrow, klet2
ch = sys.argv[1]
m = klet2.render(ch, res=1400)
def f(d):
    d.bitmap(((kgrow.RW - m.shape[1]) // 2, 0), Image.fromarray(m.astype(np.uint8) * 255).convert('1'), fill=255); return []
kgrow.LETTERS[ch] = f
ink = kgrow.make(ch, 3, np.load('/nvme-mirror/DEV/illum/research/kelmscott/vocab-pick.npz'))
Image.fromarray(((~ink) * 255).astype(np.uint8)).save(f'out2/block-{ch}.png')
