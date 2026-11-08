# GL-Morris (Morris's Troy capitals, Gutenberg Labo, permissive licence) at six-line weight and proportion, smooth vector
import pickle, sys, string, numpy as np
sys.path.insert(0, '.'); import khand
from shapely import affinity
F = '../kvfonts2/gl-morris/GL-Morris.ttf'; P = dict(khand.P, cap=.80, base=.89)
gi, ci, _ = khand.outline(F, 'I'); sw = khand.stem_width(khand.place(gi, ci, P), 1)
out = {}
for c in string.ascii_uppercase:
    g, capH, _ = khand.outline(F, c); g = khand.place(g, capH, P)
    out[c] = g.buffer((.118 - sw) / 2, join_style='round', quad_segs=16)
print('stem', round(sw, 3)); pickle.dump(out, open('glm26.pkl', 'wb'))
import cuts; pickle.dump({c: cuts.cut(g) for c, g in out.items()}, open('glm26c.pkl', 'wb'))
