// node playground/tests/blackletter.check.mjs: interlace breaks the under strand at each crossing, alternating along a hairline
import assert from 'node:assert';
import { interlace, hairline, strap, resample } from '../kit/styles/blackletter.js';
const line = (a, b) => resample([a, b], .5);
// a hairline crossing two vertical straps: over the first, under the second
const H = hairline(line([0, 50], [200, 50]), 1.5), A = strap(line([60, 0], [60, 100]), { n: 2, W: 6, g: 3 }), B = strap(line([140, 0], [140, 100]), { n: 2, W: 6, g: 3 });
const m = interlace([H, A, B], 1.5), runs = c => m.filter(s => s.col === c);
const hair = m.filter(s => s.w === 1.5), aParts = m.filter(s => s.w === 6 && s.pts[0][0] < 100), bParts = m.filter(s => s.w === 6 && s.pts[0][0] > 100);
assert.equal(hair.length, 2, 'the hairline is broken once (under the second strap)');
assert.equal(aParts.length, 4, 'the first strap is broken where the hairline passes over it (2 copies × 2 runs)');
assert.equal(bParts.length, 2, 'the second strap is whole');
assert.ok(runs('r').length >= 2, 'the red between the copies is broken with them');
console.log('ok');
