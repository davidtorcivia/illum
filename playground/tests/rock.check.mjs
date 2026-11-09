// node playground/tests/rock.check.mjs [base-url]: Rock carving on its specimen (tests/rock.html) never lays paint on a word.
// At every budget (0, .25, .5, .75, 1), several seeds, 1440 and 390, the page drawn still; every text line on the page (its
// body, headings, contents, quotation, caption, pull quote, aside, code; the drop's own letter excepted) against every
// painted pixel of the ornament's canvases. Fails on any. Needs the playground served (default http://localhost:8000).
// env: RICH=0,.25,.5,.75,1  SEEDS=1,2,3,7  W=1440,390  THEMES=light  NOSHEETS=1  SITE=http://127.0.0.1:port (a built site)
import { launch, open, load } from '../../tools/chrome.mjs';
const base = process.argv[2] ?? 'http://localhost:8000', b = await launch(), env = (k, d) => (process.env[k] ?? d).split(',');
let bad = 0;
try {
  // (and the specimen sheets: no figure on a label or a caption)
  const pages = [];
  for (const width of env('W', '1440,390').map(Number)) { for (const theme of env('THEMES', 'light')) for (const rich of env('RICH', '0,.25,.5,.75,1')) for (const seed of env('SEEDS', '1,2,3,7')) pages.push([width, theme, `rock.html?rich=${rich}&theme=${theme}#seed=${seed}`, `rich ${rich} seed ${seed}`]);
    if (!process.env.NOSHEETS) for (const sh of ['pie-alphabet.html', 'pie-directions.html?only=rock']) pages.push([width, 'light', sh, sh]);
    // (and the snippet on the wekwos.com mock, every budget: its words, stat numbers, captions and the headings' yellow bands)
    for (const rich of env('RICH', '0,.25,.5,.75,1')) for (const seed of env('SEEDS', '1,2,3,7')) pages.push([width, 'light', `rock-wekwos.html?rich=${rich}#seed=${seed}`, `wekwos rich ${rich} seed ${seed}`]);
    // SITE=url: the site's see page as well (its build served there), at every budget and seed
    if (process.env.SITE) for (const theme of env('THEMES', 'light')) for (const rich of env('RICH', '0,.25,.5,.75,1')) for (const seed of env('SEEDS', '1,2,3,7')) pages.push([width, theme, `${process.env.SITE}/see.html?style=rock&rich=${rich}#seed=${seed}`, `site rich ${rich} seed ${seed}`]); }
  for (const [width, theme, path, tag] of pages) {
    const p = await open(b, { width, height: 900, dpr: 1, dark: theme === 'dark' });
    await load(p, path.startsWith('http') ? path : `${base}/playground/tests/${path}`, { timeout: 240000 }); await new Promise(r => setTimeout(r, 300));
    const hits = await p.evaluate(() => { const lines = [], out = [];
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: n => n.textContent.trim() && !n.parentElement.closest('.ini, script, style') ? 1 : 2 });
      for (const el of document.querySelectorAll('.hl')) for (const r of el.getClientRects()) lines.push([r.left + scrollX, r.top + scrollY, r.right + scrollX, r.bottom + scrollY, 'highlight: ' + el.textContent.trim().slice(0, 14)]);
      for (let n; (n = tw.nextNode());) { const rg = document.createRange(); rg.selectNodeContents(n); for (const r of rg.getClientRects()) if (r.width > 1) lines.push([r.left + scrollX, r.top + scrollY + r.height * .12, r.right + scrollX, r.bottom + scrollY - r.height * .12, n.textContent.trim().slice(0, 24)]); }
      for (const cv of document.querySelectorAll('canvas')) { const w = cv.width, h = cv.height; if (!w || !h) continue; let d; try { d = cv.getContext('2d').getImageData(0, 0, w, h).data; } catch { continue; }
        const B = cv.getBoundingClientRect(), sx = B.width / w, sy = B.height / h;
        for (const L of lines) { const x0 = Math.max(0, Math.floor((L[0] - B.left - scrollX) / sx)), x1 = Math.min(w - 1, Math.ceil((L[2] - B.left - scrollX) / sx)), y0 = Math.max(0, Math.floor((L[1] - B.top - scrollY) / sy)), y1 = Math.min(h - 1, Math.ceil((L[3] - B.top - scrollY) / sy)); let n = 0;
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (d[(y * w + x) * 4 + 3] > 40) n++;
          if (n > 2) out.push(`${n} px on "${L[4]}" at (${Math.round(L[0])}, ${Math.round(L[1])})`); } }
      return out; });
    if (hits.length) bad++;
    console.log(`${width} ${theme} ${tag}: ${hits.length ? hits.slice(0, 6).join('; ') + (hits.length > 6 ? ` (+${hits.length - 6})` : '') : 'ok'}`); await p.close();
  }
} finally { await b.close(); }
if (bad) { console.log(`${bad} pages with paint on words`); process.exitCode = 1; }
