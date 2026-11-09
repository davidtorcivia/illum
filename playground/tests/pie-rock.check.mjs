// node playground/tests/pie-rock.check.mjs [base-url]: every rock piece type, at several seeds and the sizes a 1440 and a 390
// page give them, at dpr 1 and 2, printed and its raster's border scanned for paint (tests/pie-check.html). Fails if any
// piece is cut off. Then the mock page (tests/pie-wekwos.html, B, every piece printed) at 1440 and 390: every piece's
// painted pixels against the text's line boxes; fails if any paint lies on a line of text. Needs the playground served
// (default http://localhost:8000).
import assert from 'node:assert';
import { launch, open, load } from '../../tools/chrome.mjs';
const base = process.argv[2] ?? 'http://localhost:8000', b = await launch();
try {
  for (const dpr of process.env.TEXT_ONLY ? [] : [1, 2]) {   // (TEXT_ONLY=1: only the text check)
    const p = await open(b, { width: 1440, height: 900, dpr }); await load(p, `${base}/playground/tests/pie-check.html`, { timeout: 240000 });
    const r = await p.evaluate(() => document.body.dataset.check);
    console.log(`dpr ${dpr}: ${r === 'ok' ? 'ok' : r}`); assert.equal(r, 'ok', `pieces cut off at dpr ${dpr}`);
  }
  for (const [width, seed] of (process.env.SEEDS ?? '7,3,1,5').split(',').flatMap(sd => [[1440, +sd], [390, +sd]])) {
    const p = await open(b, { width, height: 900, dpr: 1 }); await load(p, `${base}/playground/tests/pie-wekwos.html?dir=rock&all#seed=${seed}`, { timeout: 120000 });
    const hits = await p.evaluate(() => { const art = document.body, lines = [], out = [];
      const tw = document.createTreeWalker(art, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim() && n.parentElement.closest('p,h1,h2,h3,li,figcaption,blockquote,td,dd,dt,span,a,em,strong') ? 1 : 2 });
      for (let n; (n = tw.nextNode());) { const rg = document.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) if (r.width > 1) lines.push([r.left + scrollX, r.top + scrollY + r.height * .12, r.right + scrollX, r.bottom + scrollY - r.height * .12, n.textContent.trim().slice(0, 24)]); }
      for (const cv of document.querySelectorAll('canvas')) { const w = cv.width, h = cv.height; if (!w || !h) continue; const d = cv.getContext('2d').getImageData(0, 0, w, h).data, B = cv.getBoundingClientRect(), sx = B.width / w, sy = B.height / h;
        for (const L of lines) { const x0 = Math.max(0, Math.floor((L[0] - B.left - scrollX) / sx)), x1 = Math.min(w - 1, Math.ceil((L[2] - B.left - scrollX) / sx)), y0 = Math.max(0, Math.floor((L[1] - B.top - scrollY) / sy)), y1 = Math.min(h - 1, Math.ceil((L[3] - B.top - scrollY) / sy)); let n = 0;
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (d[(y * w + x) * 4 + 3] > 40) n++;
          if (n > 2) out.push(`${n} px of a ${Math.round(B.width)}x${Math.round(B.height)} piece at (${Math.round(B.left + scrollX)}, ${Math.round(B.top + scrollY)}) on "${L[4]}"`); } }
      return out; });
    console.log(`text ${width} seed ${seed}: ${hits.length ? hits.join('; ') : 'ok'}`); if (hits.length) process.exitCode = 1;
  }
} catch (e) { console.error(e.message); process.exitCode = 1; } finally { await b.close(); }
