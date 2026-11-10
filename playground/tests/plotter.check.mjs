// node playground/tests/plotter.check.mjs [base-url]: Plotter on its specimen (tests/plotter.html), both kinds, never lays
// ink on a word and never runs off its canvas. At every budget (0, .25, .5, .75, 1), several seeds, 1440 and 390, light and
// dark, the page drawn still; every text line on the page (its body, headings, contents, quotation, caption, pull quote,
// aside, code; the drop's own letter excepted) against every inked pixel of the ornament's canvases, and the canvases' own
// edges (ink there was cut off). Fails on any. Needs the playground served (default http://localhost:8000).
// env: RICH=0,.25,.5,.75,1  SEEDS=1,2,3,7  W=1440,390  THEMES=light,dark  KINDS=section,office  SITE=http://127.0.0.1:port (a built site)
import { launch, open, load } from '../../tools/chrome.mjs';
const base = process.argv[2] ?? 'http://localhost:8000', b = await launch(), env = (k, d) => (process.env[k] ?? d).split(',');
let bad = 0;
try {
  const pages = [];
  for (const width of env('W', '1440,390').map(Number)) for (const kind of env('KINDS', 'section,office')) for (const theme of env('THEMES', 'light,dark')) for (const rich of env('RICH', '0,.25,.5,.75,1')) for (const seed of env('SEEDS', '1,2,3,7')) {
    pages.push([width, theme, `plotter.html?kind=${kind}&rich=${rich}&theme=${theme}#seed=${seed}`, `${kind} rich ${rich} seed ${seed}`]);
    if (process.env.SITE) pages.push([width, theme, `${process.env.SITE}/see.html?style=plotter&kind=${kind}&rich=${rich}#seed=${seed}`, `site ${kind} rich ${rich} seed ${seed}`]); }
  for (const [width, theme, path, tag] of pages) {
    const p = await open(b, { width, height: 900, dpr: 1, dark: theme === 'dark' });
    await load(p, path.startsWith('http') ? path : `${base}/playground/tests/${path}`, { timeout: 240000 }); await new Promise(r => setTimeout(r, 300));
    const hits = await p.evaluate(() => { const lines = [], out = [];
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim() && !n.parentElement.closest('.ini, script, style') ? 1 : 2 });
      for (const el of document.querySelectorAll('.hl')) for (const r of el.getClientRects()) lines.push([r.left + scrollX, r.top + scrollY, r.right + scrollX, r.bottom + scrollY, 'highlight: ' + el.textContent.trim().slice(0, 14)]);
      for (let n; (n = tw.nextNode());) { const rg = document.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) if (r.width > 1) lines.push([r.left + scrollX, r.top + scrollY, r.right + scrollX, r.bottom + scrollY, n.textContent.trim().slice(0, 24)]); }   // (the full line box: its whole height, not the glyphs alone)
      for (const cv of document.querySelectorAll('canvas')) { const w = cv.width, h = cv.height; if (!w || !h) continue; let d; try { d = cv.getContext('2d').getImageData(0, 0, w, h).data; } catch { continue; }
        const B = cv.getBoundingClientRect(), sx = B.width / w, sy = B.height / h;
        // (ink against the canvas's left or right edge, or the page's: a piece cut off)
        let edge = 0; for (let y = 0; y < h; y += 2) for (const x of [0, w - 1]) if (d[(y * w + x) * 4 + 3] > 40) edge++;
        if (edge > 2) out.push(`${edge} px of ink at the canvas's edge`);
        for (const L of lines) { const x0 = Math.max(0, Math.floor((L[0] - B.left - scrollX) / sx)), x1 = Math.min(w - 1, Math.ceil((L[2] - B.left - scrollX) / sx)), y0 = Math.max(0, Math.floor((L[1] - B.top - scrollY) / sy)), y1 = Math.min(h - 1, Math.ceil((L[3] - B.top - scrollY) / sy)); let n = 0;
          let fx = 0, fy = 0; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (!n) { fx = x * sx + B.left + scrollX; fy = y * sy + B.top + scrollY; } n++; }
          if (n > 2) out.push(`${n} px on "${L[4]}" (line at ${Math.round(L[0])}, ${Math.round(L[1])}; ink from ${Math.round(fx)}, ${Math.round(fy)})`); } }
      return out; });
    if (hits.length) bad++;
    console.log(`${width} ${theme} ${tag}: ${hits.length ? hits.slice(0, 6).join('; ') + (hits.length > 6 ? ` (+${hits.length - 6})` : '') : 'ok'}`); await p.close();
  }
} finally { await b.close(); }
if (bad) { console.log(`${bad} pages with paint on words`); process.exitCode = 1; }
