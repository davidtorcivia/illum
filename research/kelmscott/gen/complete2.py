# his 16 completed: the bridged fragments plus the parts the vine hides, drawn by eye in his strokes (klet2 primitives)
import numpy as np, sys
from PIL import Image, ImageDraw
from scipy import ndimage as nd
sys.path.insert(0, '.'); import klet2 as k
from klet2 import stem, crescent, bar, wedge, bez, tail
B = np.load('his16_bridged.npz'); H = 700
k.RNG = np.random.default_rng(7)
ADD = {
 'A': lambda: [crescent(bez((.62, .10), (.36, .08), (.14, .40), (.20, .92)), .10, peak=.6, tips=(.06, .09)),
               stem([(.22, .70), (.21, .925)], .09, foot=(.10, .08), lf=.15), bar(bez((.36, .09), (.55, .075), (.80, .085)), .07)],
 'B': lambda: [stem([(.225, .10), (.23, .70)], .105, head=(.07, .05), lf0=.06),
               crescent(bez((.25, .09), (.62, -.02), (.72, .36), (.30, .46)), .085, peak=.5, tips=(.04, .05)),
               crescent(bez((.30, .45), (.92, .40), (.92, .98), (.30, .885)), .11, peak=.55, tips=(.05, .05))],
 'C': lambda: [crescent(bez((.12, .45), (.16, .06), (.55, .02), (.78, .12)), .09, peak=.3, tips=(.09, .05))],
 'F': lambda: [stem(bez((.12, .55), (.13, .72), (.20, .84), (.33, .93)), .10, foot=(.07, .09), lf=.12),
               stem([(.58, .12), (.585, .62)], .085, point=(False, True))],
 'H': lambda: [],
 'I': lambda: [], 'K': lambda: [], 'L': lambda: [], 'T': lambda: [],
 'M': lambda: [stem([(.12, .14), (.12, .92)], .06, head=(.06, .05), foot=(.08, .08), lf=.14),
               stem(bez((.45, .88), (.55, .62), (.66, .35), (.78, .10)), .045)],
 'N': lambda: [stem(bez((.18, .28), (.40, .48), (.60, .68), (.77, .88)), .05),
               stem(bez((.72, .30), (.77, .55), (.78, .75), (.775, .90)), .10, foot=(.08, .09), lf=.14)],
 'O': lambda: [crescent(bez((.10, .40), (.14, .20), (.25, .10), (.40, .08)), .10, peak=.4, tips=(.10, .09)),
               crescent(bez((.88, .58), (.84, .72), (.78, .82), (.66, .88)), .10, peak=.5, tips=(.10, .10))],
 'P': lambda: [stem([(.21, .12), (.21, .45)], .10, head=(.07, .05), lf0=.06),
               crescent(bez((.24, .12), (.32, .10), (.40, .11), (.49, .13)), .075, peak=.5, tips=(.07, .075)),
               crescent(bez((.85, .26), (.86, .32), (.86, .37), (.84, .42)), .10, peak=.5, tips=(.09, .10)),
               crescent(bez((.84, .55), (.80, .64), (.55, .66), (.26, .60)), .09, peak=.3, tips=(.10, .05))],
 'S': lambda: [crescent(bez((.10, .30), (.05, .05), (.60, .00), (.78, .18)), .08, peak=.35, tips=(.10, .05)),
               crescent(bez((.86, .52), (.92, .80), (.70, .98), (.40, .92)), .085, peak=.5, tips=(.09, .06))],
 'V': lambda: [stem(bez((.74, .25), (.68, .45), (.62, .62), (.56, .78)), .05), stem(bez((.22, .22), (.30, .45), (.38, .65), (.46, .90)), .11, point=(False, True))],
 'Z': lambda: [bar(bez((.04, .17), (.20, .15), (.37, .19)), .075), bar(bez((.09, .93), (.40, .935), (.66, .915)), .075), stem(bez((.34, .20), (.26, .45), (.18, .70), (.12, .92)), .10)],
}
def T(q): return [(x * H, y * H) for x, y in q]
out = {}
for c in 'ABCFHIKLMNOPSTVZ':
    m = B[c].copy(); im = Image.new('L', (m.shape[1], H), 0); d = ImageDraw.Draw(im)
    for s in ADD[c](): d.polygon(T(s.poly() if isinstance(s, k.Stroke) else s), fill=255)
    m |= np.asarray(im) > 127
    m = nd.binary_closing(m, iterations=3) | m
    holes = nd.binary_fill_holes(m) & ~m; lab, n = nd.label(holes); sz = nd.sum(holes, lab, range(1, n + 1))
    m |= np.isin(lab, 1 + np.nonzero(sz < 900)[0])   # (only the specks the vine left: counters stay open)
    out[c] = m
np.savez_compressed('his16_done.npz', **out)
S = 300; sh = Image.new('L', (8 * (S + 10), 2 * (S + 10)), 255)
for n, c in enumerate('ABCFHIKLMNOPSTVZ'):
    sh.paste(Image.fromarray(np.where(out[c], 0, 255).astype(np.uint8)).resize((S * out[c].shape[1] // 700, S), Image.LANCZOS), ((n % 8) * (S + 10), (n // 8) * (S + 10)))
sh.save('out4_done.png')
