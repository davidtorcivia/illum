// The audit of a rubricated page (06's, lifted): from the strokes as they were drawn (rubricate(...).state), count
//   text   points of ornament inside a word's box (an initial in the line excepted against its own word, which it begins),
//   cross  pixels where marks of two different ornaments overlap,
//   self   pixels where two strokes of one ornament run over each other away from their ends: a doubling. Join-aware:
//          where the two meet at an angle (a crossing, an interlace, a T standing on a line) the overlap is the join
//          the design meant, and is not counted; only strokes lying along each other (under ~30°) double,
// and the joins: every stroke end and point lying near another stroke of its own ornament is meant to meet it, and must,
// within 0.3 px, with no gap and no hair's overrun; points set apart by design are marked free.
//   import { audit } from './kit/audit.js'; document.body.dataset.audit = JSON.stringify(audit(r.state));
export function audit({ drawn, words, scale = 1, dropped = {}, sr }, { where: keepWhere = false } = {}) {
  const W = Math.ceil(sr.width), H = Math.ceil(sr.height), own = new Int32Array(W * H), st = new Int32Array(W * H), ang = new Float32Array(W * H), hit = new Uint8Array(W * H);
  const res = { text: 0, cross: 0, self: 0, byType: {} }, bump = (t, k) => { res.byType[t] ??= { text: 0, cross: 0, self: 0 }; res.byType[t][k]++; res[k]++; };
  drawn.forEach((d, si) => {
    const R = d.dot ? d.r : d.w / 2, samples = d.dot ? [d.dot] : resampleLine(d.pts, .5);
    samples.forEach(([x, y], k) => {
      const a = samples[Math.max(0, k - 2)], b = samples[Math.min(samples.length - 1, k + 2)], th = Math.atan2(b[1] - a[1], b[0] - a[0]);
      // the ink at a sample lies across the stroke, not in a disc round it (a wide stroke's cut end is square)
      const across = d.dot ? null : [-1, -.5, 0, .5, 1].map(f => [x - Math.sin(th) * R * f, y + Math.cos(th) * R * f]);
      // (an initial in the line touches its own word, the rest of the word it begins, by design)
      if (!(d.own && x > d.own[0] - R - 1 && x < d.own[2] + R + 1 && y > d.own[1] - R && y < d.own[3] + R)) { const hitR = words.find(r => across ? across.some(([qx, qy]) => qx > r.l && qx < r.r && qy > r.t + 2 && qy < r.b - 2) : x + R > r.l && x - R < r.r && y + R > r.t + 2 && y - R < r.b - 2); if (hitR) { bump(d.type, 'text'); if ((res.where ??= []).length < 6) res.where.push([d.type, Math.round(x), Math.round(y), Math.round(hitR.l), Math.round(hitR.t), Math.round(hitR.r), Math.round(hitR.b)]); } }
      for (let j = Math.floor(y - R); j <= Math.ceil(y + R); j++) for (let i = Math.floor(x - R); i <= Math.ceil(x + R); i++) {
        if (i < 0 || j < 0 || i >= W || j >= H || Math.hypot(i + .5 - x, j + .5 - y) > R + .25) continue; const c = j * W + i;
        if (!own[c]) { own[c] = d.mi + 1; st[c] = si + 1; ang[c] = th; continue; }
        if (own[c] !== d.mi + 1) { if (!(hit[c] & 1)) { hit[c] |= 1; bump(d.type, 'cross'); } continue; }
        if (st[c] !== si + 1 && !(hit[c] & 2)) { const o = drawn[st[c] - 1], near = e => e && Math.hypot(e[0] - i, e[1] - j) < Math.max(3, (o.w ?? 1) * 3 + 2);
          // under 30° the two lie along each other; but a print's two drums overprint by design, and a laid (solid) stroke
          // merging into its fellow, or a hairline lying in its body, shows no doubling
          const along = Math.abs(Math.sin(th - ang[c])) < .5 && o.plate === d.plate && !o.solid && !d.solid;
          if (!d.dot && !o.dot && along && !near(d.ends[0]) && !near(d.ends[1]) && !near(o.ends?.[0]) && !near(o.ends?.[1])) { hit[c] |= 2; bump(d.type, 'self'); } } } });
  });
  return { ...res, dropped, joins: joins(drawn, scale, keepWhere) };
}

// Joins: every stroke end and every point that lies near another stroke of its own ornament (closer than GAP px) is
// meant to meet it, and must: within 0.3 px of its centreline (or anywhere inside a heavier stroke's ink), with no gap
// and no overrun past it (an end may not stop a hair, 0.6 to 1.2 px, past a line it has crossed: further is a crossing by
// design). A free end further away is a lift of the pen, not a join. Dots: the point's edge or centre on the line. At a
// scale below 1 the bands shrink with the drawing, so a spacing designed at size is not read as a miss.
export function joins(drawn, SCALE = 1, keepWhere = false) {
  const GAP = 3 * Math.min(1, SCALE), HARD = 1.5 * Math.min(1, SCALE);   // gap: 0.3 to HARD px, a hair's miss, always a fault; near: HARD to GAP, a spacing to judge by eye
  const segD = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0;
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); };
  const lineD = (p, pts) => { let d = Infinity; for (let i = 1; i < pts.length; i++) d = Math.min(d, segD(p, pts[i - 1], pts[i])); return d; };
  const by = {}; drawn.forEach((d, i) => (by[d.mi + '/' + d.plate] ??= []).push(i));   // a print's second drum, out of register by design, is its own drawing
  const res = { gap: 0, near: 0, overrun: 0, ok: 0, byType: {}, where: [] }, flag = (k, d, info) => { if (k === 'gap' && info[2] > HARD) k = 'near'; res[k]++; (res.byType[d.type] ??= { gap: 0, near: 0, overrun: 0 })[k]++; res.where.push(k === 'overrun' ? [...info.slice(0, 5), 'over', info[5]] : info); };
  for (const ids of Object.values(by)) for (const i of ids) { const s = drawn[i];
    // a point against the lines only (a row of points is not a join)
    if (s.free) continue;   // set apart by design (a point in its cell, a seed's embryo)
    if (s.dot) { let best = Infinity, bw = 0; for (const j of ids) { const o = drawn[j]; if (j === i || o.dot) continue; const d = lineD(s.dot, o.pts); if (d < best) { best = d; bw = o.dot ? 0 : o.w; } }
      const edge = best - s.r - bw / 2; if (best > .3 && edge > .3 && edge < GAP) flag('gap', s, [s.type, 'dot', +edge.toFixed(2), Math.round(s.dot[0]), Math.round(s.dot[1])]); else if (best <= .3 || edge <= .3) res.ok++; continue; }
    if (Math.hypot(s.pts[0][0] - s.pts.at(-1)[0], s.pts[0][1] - s.pts.at(-1)[1]) < 1) continue;   // closed on itself
    for (const e of [0, 1]) { const P = e ? s.pts.at(-1) : s.pts[0], tail = e ? [...s.pts].reverse() : s.pts;
      let best = Infinity, bo = null; for (const j of ids) { if (j === i || drawn[j].free) continue; const o = drawn[j], d = o.dot ? Math.max(0, Math.hypot(o.dot[0] - P[0], o.dot[1] - P[1]) - o.r) : lineD(P, o.pts); if (d < best) { best = d; bo = o; } }
      if (!bo || best >= GAP) continue;
      const tol = Math.max(.3 * Math.max(1, SCALE), bo.dot ? .3 : bo.w / 2 - .2);   // on its centreline, or well inside a heavier stroke's ink
      // or it lies on its own line further along (a ring written a little past where it began)
      const own = (() => { let a = 0; const far = [], q = e ? [...s.pts].reverse() : s.pts; for (let k = 1; k < q.length; k++) { a += Math.hypot(q[k][0] - q[k - 1][0], q[k][1] - q[k - 1][1]); if (a > 3) far.push(q[k]); } return far.length > 1 ? lineD(P, far) : Infinity; })();
      if (best <= tol || own <= .3 * Math.max(1, SCALE) || ids.some(j => j !== i && !drawn[j].dot && drawn[j].w > s.w && lineD(P, drawn[j].pts) <= drawn[j].w / 2 - .2)) { res.ok++; continue; }   // met, or hidden in a heavier stroke's ink
      // ran past it: the line met it a little way back (but not at its own other end: that is a stroke standing on it)
      const total = arclen(s.pts); let run = 0, over = 0, back = best;
      for (let k = 1; k < tail.length; k++) { run += Math.hypot(tail[k][0] - tail[k - 1][0], tail[k][1] - tail[k - 1][1]); if (run > GAP * 2) break;
        const d = bo.dot ? Math.max(0, Math.hypot(bo.dot[0] - tail[k][0], bo.dot[1] - tail[k][1]) - bo.r) : lineD(tail[k], bo.pts); if (run <= 1) back = d;
        if (d <= tol) { if (total - run > 1.5 && run < total * .25 && run <= 1.2 * Math.min(1, SCALE) && (s.cap?.[e] !== 'taper' || run > .9 * Math.min(1, SCALE))) over = run; break; } }   // a hair's stub, not a crossbar run on by design
      if (over) flag('overrun', s, [s.type, e ? 'end' : 'start', +over.toFixed(2), Math.round(P[0]), Math.round(P[1]), s.cap?.[e]]);
      // an interlace passing under: the same line resumes on the far side of the strand it went under
      else if (back > best + .15 && !ids.some(j => { const o = drawn[j]; return j !== i && o !== bo && !o.dot && [o.pts[0], o.pts.at(-1)].some(F => Math.hypot(F[0] - P[0], F[1] - P[1]) < 2 * best + bo.w + 2 && lineD(F, bo.pts) < GAP && lineD(F, bo.pts) > tol); })) flag('gap', s, [s.type, e ? 'end' : 'start', +best.toFixed(2), Math.round(P[0]), Math.round(P[1])]);   // heading for it, and stopped short
    } }
  const rank = w => w[5] === 'over' ? 1 : w[2] <= HARD ? 0 : 2; res.where.sort((a, b) => rank(a) - rank(b) || b[2] - a[2]); if (!keepWhere) res.where = res.where.slice(0, 12); return res;
}
const resampleLine = (p, ds) => { const out = [p[0]]; for (let i = 1; i < p.length; i++) { const a = p[i - 1], b = p[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / ds);
  for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } return out; };
const arclen = p => p.reduce((a, q, i) => i ? a + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0);
