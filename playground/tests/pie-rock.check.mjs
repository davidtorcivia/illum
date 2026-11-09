// node playground/tests/pie-rock.check.mjs [base-url]: every rock piece type, at several seeds and the sizes a 1440 and a 390
// page give them, at dpr 1 and 2, printed and its raster's border scanned for paint (tests/pie-check.html). Fails if any
// piece is cut off. Needs the playground served (default http://localhost:8000).
import assert from 'node:assert';
import { launch, open, load } from '../../tools/chrome.mjs';
const base = process.argv[2] ?? 'http://localhost:8000', b = await launch();
try {
  for (const dpr of [1, 2]) {
    const p = await open(b, { width: 1440, height: 900, dpr }); await load(p, `${base}/playground/tests/pie-check.html`, { timeout: 240000 });
    const r = await p.evaluate(() => document.body.dataset.check);
    console.log(`dpr ${dpr}: ${r === 'ok' ? 'ok' : r}`); assert.equal(r, 'ok', `pieces cut off at dpr ${dpr}`);
  }
} catch (e) { console.error(e.message); process.exitCode = 1; } finally { await b.close(); }
