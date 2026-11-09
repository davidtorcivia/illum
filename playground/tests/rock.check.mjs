// node playground/tests/rock.check.mjs [base-url]: Rock carving on its specimen (tests/rock.html) never lays paint on a word.
// At every budget (0, .25, .5, .75, 1), several seeds, 1440 and 390, the page drawn still; every text line on the page (its
// body, headings, contents, quotation, caption, pull quote, aside, code; the drop's own letter excepted) against every
// painted pixel of the ornament's canvases. Fails on any. Needs the playground served (default http://localhost:8000).
// env: RICH=0,.25,.5,.75,1  SEEDS=1,2,3,7  W=1440,390  THEMES=light
import { launch, open, load } from '../../tools/chrome.mjs';
const base = process.argv[2] ?? 'http://localhost:8000', b = await launch(), env = (k, d) => (process.env[k] ?? d).split(',');
let bad = 0;
try {
  for (const width of env('W', '1440,390').map(Number)) for (const theme of env('THEMES', 'light')) for (const rich of env('RICH', '0,.25,.5,.75,1')) for (const seed of env('SEEDS', '1,2,3,7')) {
    const p = await open(b, { width, height: 900, dpr: 1, dark: theme === 'dark' });
    await load(p, `${base}/playground/tests/rock.html?rich=${rich}&theme=${theme}#seed=${seed}`, { timeout: 120000 }); await new Promise(r => setTimeout(r, 300));
    const hits = await p.evaluate(() => { const lines = [], out = [];
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim() && !n.parentElement.closest('.ini, script, style') ? 1 : 2 });
      for (let n; (n = tw.nextNode());) { const rg = document.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) if (r.width > 1) lines.push([r.left + scrollX, r.top + scrollY + r.height * .12, r.right + scrollX, r.bottom + scrollY - r.height * .12, n.textContent.trim().slice(0, 24)]); }
      for (const cv of document.querySelectorAll('canvas')) { const w = cv.width, h = cv.height; if (!w || !h) continue; let d; try { d = cv.getContext('2d').getImageData(0, 0, w, h).data; } catch { continue; }
        const B = cv.getBoundingClientRect(), sx = B.width / w, sy = B.height / h;
        for (const L of lines) { const x0 = Math.max(0, Math.floor((L[0] - B.left - scrollX) / sx)), x1 = Math.min(w - 1, Math.ceil((L[2] - B.left - scrollX) / sx)), y0 = Math.max(0, Math.floor((L[1] - B.top - scrollY) / sy)), y1 = Math.min(h - 1, Math.ceil((L[3] - B.top - scrollY) / sy)); let n = 0;
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (d[(y * w + x) * 4 + 3] > 40) n++;
          if (n > 2) out.push(`${n} px on "${L[4]}" at (${Math.round(L[0])}, ${Math.round(L[1])})`); } }
      return out; });
    if (hits.length) bad++;
    console.log(`${width} ${theme} rich ${rich} seed ${seed}: ${hits.length ? hits.join('; ') : 'ok'}`); await p.close();
  }
} finally { await b.close(); }
if (bad) { console.log(`${bad} pages with paint on words`); process.exitCode = 1; }
