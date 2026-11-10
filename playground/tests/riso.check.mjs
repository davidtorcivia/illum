// node playground/tests/riso.check.mjs [base-url]: Duplicator on its specimen (tests/riso.html) never lays ink on a word, and
// no piece is cut off by the page's edge. At every budget (0, .25, .5, .75, 1), several seeds, 1440 and 390, light and dark,
// the page drawn still: every text line on the page (its full line box: body, headings, contents, quotation, caption,
// pull quote, aside, code; the drop's own letter excepted) against every inked pixel of the ornament's canvases; and every
// inked pixel inside the page's width. Fails on any. Needs the playground served (default http://localhost:8000).
// env: RICH=0,.25,.5,.75,1  SEEDS=1,2,3,7  W=1440,390  THEMES=light,dark  SITE=http://127.0.0.1:port (a built site's see page too)
import { launch, open, load } from '../../tools/chrome.mjs';
const base = process.argv[2] ?? 'http://localhost:8000', b = await launch(), env = (k, d) => (process.env[k] ?? d).split(',');
let bad = 0;
try {
  const pages = [];
  for (const width of env('W', '1440,390').map(Number)) for (const theme of env('THEMES', 'light,dark')) for (const rich of env('RICH', '0,.25,.5,.75,1')) for (const seed of env('SEEDS', '1,2,3,7')) {
    pages.push([width, theme, `${base}/playground/tests/riso.html?rich=${rich}&theme=${theme}#seed=${seed}`, `rich ${rich} seed ${seed}`]);
    if (process.env.SITE) pages.push([width, theme, `${process.env.SITE}/see.html?style=riso&rich=${rich}#seed=${seed}`, `site rich ${rich} seed ${seed}`]); }
  for (const [width, theme, url, tag] of pages) {
    const p = await open(b, { width, height: 900, dpr: 1, dark: theme === 'dark' });
    await load(p, url, { timeout: 240000 }); await new Promise(r => setTimeout(r, 300));
    const hits = await p.evaluate(() => { const lines = [], out = [], PW = document.documentElement.clientWidth;
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim() && !n.parentElement.closest('.ini, script, style, button') ? 1 : 2 });
      for (let n; (n = tw.nextNode());) { const rg = document.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) if (r.width > 1) lines.push([r.left + scrollX, r.top + scrollY, r.right + scrollX, r.bottom + scrollY, n.textContent.trim().slice(0, 24)]); }   // (the full line box)
      for (const cv of document.querySelectorAll('canvas')) { const w = cv.width, h = cv.height; if (!w || !h) continue; let d; try { d = cv.getContext('2d').getImageData(0, 0, w, h).data; } catch { continue; }
        const B = cv.getBoundingClientRect(), sx = B.width / w, sy = B.height / h;
        for (const L of lines) { const x0 = Math.max(0, Math.floor((L[0] - B.left - scrollX) / sx)), x1 = Math.min(w - 1, Math.ceil((L[2] - B.left - scrollX) / sx)), y0 = Math.max(0, Math.floor((L[1] - B.top - scrollY) / sy)), y1 = Math.min(h - 1, Math.ceil((L[3] - B.top - scrollY) / sy)); let n = 0;
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (d[(y * w + x) * 4 + 3] > 40) n++;
          if (n > 2) out.push(`${n} px on "${L[4]}" at (${Math.round(L[0])}, ${Math.round(L[1])})`); }
        // (cut off: ink at the page's right edge or past it, or at the left edge)
        let edge = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (d[(y * w + x) * 4 + 3] <= 40) continue; const X = B.left + x * sx; if (X < 1 || X > PW - 1) edge++; }
        if (edge) out.push(`${edge} px of ink at the page's edge (canvas at ${Math.round(B.left)}, ${Math.round(B.top + scrollY)})`); }
      return out; });
    if (hits.length) bad++;
    console.log(`${width} ${theme} ${tag}: ${hits.length ? hits.slice(0, 6).join('; ') + (hits.length > 6 ? ` (+${hits.length - 6})` : '') : 'ok'}`); await p.close();
  }
} finally { await b.close(); }
if (bad) { console.log(`${bad} pages with ink on words or cut off`); process.exitCode = 1; }
