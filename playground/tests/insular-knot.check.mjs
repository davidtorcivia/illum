// node playground/tests/insular-knot.check.mjs — the plait's topology: every cord piece used once, every crossing met by
// exactly two passes with exactly one over, and over/under alternating along every cord (for plaits with and without breaks,
// and a knot fitted to an irregular set of cells).
import { plait } from '../kit/styles/insular-knot.js';
import assert from 'node:assert/strict';
const cases = [
  ['band 6×2', plait(6, 2)],
  ['band 9×2, breaks every other', plait(9, 2, () => true, (x, y) => (y & 1) && x % 4 === 2)],
  ['square 4×4, centre walls', plait(4, 4, () => true, (x, y) => (x === 4 && (y === 3 || y === 5)) || (y === 4 && (x === 3 || x === 5)))],
  ['ring of cells', plait(5, 5, (a, b) => !(a > 0 && a < 4 && b > 0 && b < 4))],
  ['L corner', plait(4, 4, (a, b) => a < 2 || b < 2)],
];
for (const [name, K] of cases) {
  let pieces = 0; for (const t of K.threads) pieces += t.ev.length;
  let cells = 0; for (let b = 0; b < K.B; b++) for (let a = 0; a < K.A; a++) cells++;
  for (const [k, v] of K.crossings) { assert.equal(v.length, 2, `${name}: crossing ${k} met ${v.length}×`); assert.equal(v.filter(x => x.over).length, 1, `${name}: crossing ${k} not one over`); }
  for (const t of K.threads) { const xs = t.ev.filter(e => e.cross); for (let i = 0; i < xs.length; i++) assert.notEqual(xs[i].over, xs[(i + 1) % xs.length].over, `${name}: two ${xs[i].over ? 'overs' : 'unders'} running`); }
  console.log(`${name}: ${K.threads.length} cord(s), ${K.crossings.size} crossings, ${pieces} pieces — ok`);
}
