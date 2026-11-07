// node playground/tests/tarot.check.mjs: the cards' numerals are additive, and every element of the tarot style is made
// at every richness and a few sizes without a throw, with some line and only finite points
import assert from 'node:assert';
import S, { roman } from '../kit/styles/tarot.js';
assert.deepEqual([4, 9, 14, 19, 21].map(roman), ['IIII', 'VIIII', 'XIIII', 'XVIIII', 'XXI'], 'IIII, VIIII: additive, as on the cards');
const ok = (el, what) => { const marks = el.marks.flat(3); assert.ok(marks.length > 0, `${what}: no line`);
  for (const m of marks) assert.ok(m.pts.length > 1 && m.pts.every(p => Number.isFinite(p[0]) && Number.isFinite(p[1])) && m.w >= 1.2, `${what}: a bad mark`);
  for (const f of el.fills) for (const P of [...f.polys, ...f.lines.map(l => l.pts)]) assert.ok(P.every(p => Number.isFinite(p[0]) && Number.isFinite(p[1])), `${what}: a bad fill`); };
for (const u of [6, 8.4, 12]) for (const rich of [0, .5, 1]) for (const seed of [1, 99]) {
  for (let k = 0; k < 4; k++) ok(S.paraph(100, 200, u, seed, rich, k), `paraph ${k} u${u}`);
  for (const kind of [...S.FILLERS, 'rule']) ok(S.filler(100, 100 + u * 30, 200 - u, 200, kind, seed, rich), `filler ${kind} u${u}`);
  for (const rank of [1, 2]) for (const n of [1, 4, 9]) ok(S.breakMark(300, 300, 600, rank, seed, rich, u, n), `break ${rank} ${n}`);
  const box = [100, 100, 500, 300], lines = [{ top: 100, base: 120, left: 100, right: 500 }];
  ok(S.frames.quote({ box, foot: 280, u, seed, rich }), 'quote'); ok(S.frames.figure({ box, cap: 340, u, seed, rich, n: 2 }), 'figure');
  ok(S.frames.code({ box, u, seed, rich, n: 4 }), 'code'); ok(S.frames.aside({ box, u, seed, rich }), 'aside');
  ok(S.frames.pull({ cx: 300, yTop: 90, yBot: 320, measure: 600, lines, u, seed, rich }), 'pull');
  ok(S.frames.nav({ box, entries: [1, 2, 3, 4].map(k => ({ base: 100 + k * 30 })), x: 60, u, seed, rich, side: true }), 'nav');
}
for (const ch of 'ABIMW') for (const set of ['solid', 'contour']) for (const big of [true, false]) {
  const el = S.initial({ ch, G: { box: [100, 100, 160, 210] }, big, rich: .5, seed: 1, set, u: 8.4, n: 1 });
  if (big) ok(el, `initial ${ch} ${set}`); assert.ok(el.letters.length && el.letters.every(t => Number.isFinite(t.x) && t.size > 0), `initial ${ch}: its letter`); }
console.log('ok');
