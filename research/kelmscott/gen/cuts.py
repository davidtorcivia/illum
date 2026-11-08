# his black hairline cut down the white stroke: inset from the stroke's left (shadow-side) edge, only on strokes thick
# enough to hold it, only where it runs a fair length; crisp vector
from shapely import affinity
from shapely.ops import unary_union
def hairlines(g, inset=.024, w=.0065, minlen=.12):
    s = g.buffer(-inset, join_style='round', quad_segs=16)
    if s.is_empty: return s
    strip = s.difference(affinity.translate(s, w, 0))
    keep = [p for p in getattr(strip, 'geoms', [strip]) if p.bounds[3] - p.bounds[1] > minlen and p.area > w * minlen * .5]
    lines = unary_union(keep)
    # each hairline's ends drawn to a point: shave it where it nears the ends of the inset stroke
    return lines.intersection(s.buffer(-.004))
def cut(g, **k):
    h = hairlines(g, **k); return g.difference(h) if not h.is_empty else g
