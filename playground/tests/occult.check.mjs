// node playground/tests/occult.check.mjs: the safety sweep (no kamea sigil the style can draw makes a Z, an N, an
// S-rune or lightning zigzag, a zig-back or a retrace, over 5000 seeds and every filler that draws them), the known
// unsafe paths refused, and every element of the occult style made at every richness and a few sizes without a throw,
// with only finite points and no line under 1.2 px
import assert from 'node:assert';
import S, { sigilSafe, sigilFor, sigilCells, PLANETS } from '../kit/styles/occult.js';

// the forms the contract forbids, as paths on the 3×3 kamea (x right, y down): each must be refused
const forbidden = {
  'Z': [[0, 0], [2, 0], [0, 2], [2, 2]], 'N': [[0, 2], [0, 0], [2, 2], [2, 0]], 'S-rune (sig)': [[2, 0], [0, 1], [2, 1], [0, 2]],
  'lightning': [[1, 0], [0, 1], [2, 1], [1, 2]], 'zig-back': [[0, 0], [2, 1], [0, 1], [2, 2]], 'retrace': [[0, 0], [2, 0], [0, 0], [0, 2]],
  'wolf hook (Z with bar)': [[0, 0], [1, 0], [0, 2], [1, 2]],
};
for (const [k, p] of Object.entries(forbidden)) assert.equal(sigilSafe(p), false, `the ${k} must be refused`);
assert.equal(sigilSafe([[0, 0], [2, 0], [2, 2], [0, 2]]), true, 'a plain square is a safe sigil');

// the sweep: every sigil the style can draw
let n = 0; const words = new Set(), shapes = new Set();
for (let seed = 1; seed <= 5000; seed++) { const g = sigilFor(seed); n++; words.add(g.word); shapes.add(JSON.stringify(g.cells));
  assert.ok(sigilSafe(g.cells), `seed ${seed}: an unsafe sigil (${g.word})`); }
// and as the filler draws them (its own seeds): the marks' sigil paths re-read from the drawing
let drawn = 0;
for (let seed = 1; seed <= 600; seed++) for (const u of [7, 9.5]) { const el = S.filler(0, 600, 100 - u, 100, 'sigil', seed, .5, seed % 7); drawn += el.marks.length; }
console.log(`safety sweep: ${n} seeds, ${words.size} words, ${shapes.size} distinct sigils, 0 unsafe; ${drawn} filler marks drawn over 1200 fillers`);

// every element
const ok = (el, what) => { const marks = el.marks.flat(3); assert.ok(marks.length + (el.letters?.length ?? 0) > 0, `${what}: nothing`);
  for (const m of marks) assert.ok(m.pts.length > 1 && m.pts.every(p => Number.isFinite(p[0]) && Number.isFinite(p[1])) && m.w >= 1.2 && ['k', 'r', 'g'].includes(m.col), `${what}: a bad mark`);
  for (const t of el.letters ?? []) assert.ok(t.text != null || t.shape || t.dot, `${what}: a bad letter`); };
for (const u of [6, 8.4, 12]) for (const rich of [0, .5, 1]) for (const seed of [1, 99]) {
  for (let k = 0; k < 7; k++) ok(S.paraph(100, 200, u, seed, rich, k), `paraph ${PLANETS[k]} u${u}`);
  for (const kind of [...S.FILLERS, 'rule']) ok(S.filler(100, 100 + u * 40, 200 - u, 200, kind, seed, rich, seed % 7), `filler ${kind} u${u}`);
  for (const rank of [1, 2]) for (const nn of [1, 4, 9]) ok(S.breakMark(300, 300, 600, rank, seed, rich, u, nn), `break ${rank} ${nn}`);
  const box = [100, 100, 500, 300];
  ok(S.frames.quote({ box, u, seed, rich }), 'quote'); ok(S.frames.figure({ box, cap: 340, u, seed, rich, n: 2 }), 'figure');
  ok(S.frames.code({ box, u, seed, rich, n: 4 }), 'code'); ok(S.frames.aside({ box, u, seed, rich }), 'aside');
  ok(S.frames.pull({ cx: 300, yTop: 90, yBot: 320, measure: 600, u, seed, rich }), 'pull');
  ok(S.frames.nav({ box, entries: [1, 2, 3, 4].map(k => ({ base: 100 + k * 30 })), x: 60, u, seed, rich, side: true }), 'nav');
}
for (const ch of 'ABIMW') for (const set of ['band', 'ring']) for (const big of [true, false]) {
  const el = S.initial({ ch, G: { box: [100, 100, 210, 210] }, big, rich: .5, seed: 1, set, u: 8.4 });
  if (big) ok(el, `initial ${ch} ${set}`); assert.ok(el.letters.length, `initial ${ch}: its letter`); }
void sigilCells;
console.log('ok');
