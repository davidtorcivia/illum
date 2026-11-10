// node playground/tests/plotter.check.mjs [base-url]: Plotter on its specimen (tests/plotter.html), both kinds, never lays
// ink on a word and never runs off its canvas. At every budget (0, .25, .5, .75, 1), several seeds, 1440 and 390, light and
// dark, the page drawn still; every text line on the page (its body, headings, contents, quotation, caption, pull quote,
// aside, code; the drop's own letter excepted) against every inked pixel of the ornament's canvases, and the canvases' own
// edges (ink there was cut off). Fails on any. Needs the playground served (default http://localhost:8000).
// env: RICH=0,.25,.5,.75,1  SEEDS=1,2,3,7  W=1440,390  THEMES=light,dark  KINDS=section,office  SITE=http://127.0.0.1:port (a built
// site: its see page as well, and cold loads of it, which must have their ornament from the moment they say they have drawn)
// COLD=plotter,copperplate,... (the cold loads of those styles' see pages; default plotter)
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
  // a cold load of the built site's see page (SITE=url, a baked build): in a fresh context (no store, no cache), the
  // ornament must be there when the page says it has drawn, and stay: sampled from then for 2 s, no sample may fall below
  // half the most ink seen, through a redraw (one that clears the baked ornament and draws it again is a pop)
  // (COLD=style,...: the same for other styles' see pages; the check is the library's, not the plotter's own)
  if (process.env.SITE) for (const style of env('COLD', 'plotter')) for (const width of env('W', '1440,390').map(Number)) for (const kind of style === 'plotter' ? env('KINDS', 'section,office') : ['']) for (const theme of env('THEMES', 'light,dark')) for (let run = 0; run < 3; run++) {
    const ctx = await b.createBrowserContext(), p = await open(ctx, { width, height: 900, dpr: 1, dark: theme === 'dark' });
    await load(p, `${process.env.SITE}/see.html?style=${style}${kind === 'office' ? '&kind=office' : ''}&x=${Math.random()}`, { timeout: 120000 });
    // (what the reader sees: the drop's float, its own letter transparent, screenshotted and its ink counted in the page)
    const R = await p.evaluate(() => { const r = document.querySelector('.ini.drop').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; });
    // (captureBeyondViewport off: a capture that resizes the page for itself fires its media queries and redraws it)
    const ink = async () => { const png = await p.screenshot({ clip: R, encoding: 'base64', captureBeyondViewport: false });
      return p.evaluate(async src => { const im = new Image(); im.src = 'data:image/png;base64,' + src; await im.decode(); const c = new OffscreenCanvas(im.width, im.height), g = c.getContext('2d'); g.drawImage(im, 0, 0);
        const d = g.getImageData(0, 0, im.width, im.height).data, P = [d[0], d[1], d[2]]; let n = 0; for (let k = 0; k < d.length; k += 4) if (Math.abs(d[k] - P[0]) + Math.abs(d[k + 1] - P[1]) + Math.abs(d[k + 2] - P[2]) > 90) n++; return n; }, png); };
    // (and a redraw with nothing changed, as a resize back or a setting put back asks for: it must keep what is shown)
    // (a baked page drawn from the bake must be drawn from it again by that redraw: the same key before the style's module
    // is loaded and after; drawn live instead, it is cleared and drawn again, the pop)
    const cached0 = await p.evaluate(() => !!window.R?.state.cached);
    const seen = [await ink()], again = p.evaluate(() => new Promise(ok => { const t = document.querySelector('.text, article') ?? document.body; addEventListener('illum:drawn', () => ok(!!window.R?.state.cached), { once: true, capture: true }); setTimeout(() => ok(!!window.R?.state.cached), 4000); window.R?.redraw({}); }));
    const t0 = Date.now(); while (Date.now() - t0 < 2000) seen.push(await ink());   // (as often as a capture allows: a blank lasts tens of ms)
    const still = cached0 ? await again : true, ok = still && Math.min(...seen) >= Math.max(...seen) * .5 && Math.max(...seen) > 0; if (!ok) bad++;
    console.log(`cold ${style} ${width} ${theme} ${kind} run ${run}: ${ok ? 'ok' + (cached0 ? '' : ' (not baked: drawn live)') : !still ? 'a redraw went live: the cache key moved' : 'ink over 2 s ' + seen.join(' ')}`); await ctx.close(); }
  // drawn (?draw, the pages plotted as you read): every piece must come in as the pen lays it. The page scrolled through a
  // step at a time; in the page, each frame, the ink on the page's canvas and on each piece's own window while it grows. A
  // piece laid on the page with no window grown first, or whose window had less than 80% of the ink it then lays, came in
  // whole: a pop. (DRAW=0 skips; DRAWS=kind:rich:theme,... chooses.)
  if (process.env.DRAW !== '0') for (const spec of env('DRAWS', 'section:.5:light,office:.5:light,section:1:dark,office:1:dark,section:.25:light')) {
    const [kind, rich, theme] = spec.split(':'), p = await open(b, { width: 1440, height: 900, dpr: 1, dark: theme === 'dark' });
    await p.evaluateOnNewDocument(() => { const log = window.__pops = [], grows = new Map(); let base = null, last = 0;
      const inkOf = c => { if (!c.width || !c.height) return 0; let n = 0, g; try { g = c.getContext('2d'); } catch {} if (!g) return 0; const d = g.getImageData(0, 0, c.width, c.height).data; for (let k = 3; k < d.length; k += 12) if (d[k] > 40) n++; return n; };
      const tick = () => { const cs = [...document.querySelectorAll('canvas')]; base ??= cs.find(c => !c.dataset.grow && c.width > 300 && c.height > 300 && (() => { try { return !!c.getContext('2d'); } catch { return false; } })());
        const now = new Set(cs.filter(c => c.dataset.grow));
        let gone = 0, at = ''; for (const [c, g] of grows) if (!now.has(c)) { gone += g.max; at += ` ${c.style.left},${c.style.top}`; grows.delete(c); }
        for (const c of now) { const v = inkOf(c), g = grows.get(c) ?? { max: 0, steps: 0 }; if (g.max && v - g.max > g.max * 0 && v > g.max) g.jump = Math.max(g.jump ?? 0, v - g.max); g.max = Math.max(g.max, v); grows.set(c, g); }
        if (base) { const v = inkOf(base); if (v - last > 40 && v - last > gone * 1.25 + 40) log.push({ t: Math.round(performance.now()), laid: v - last, grown: gone, at }); last = v; }
        requestAnimationFrame(tick); };
      addEventListener('load', () => requestAnimationFrame(tick)); });
    await load(p, `${base}/playground/tests/plotter.html?kind=${kind}&rich=${rich}&theme=${theme}&draw#seed=3`, { reading: true, timeout: 240000 });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= H; y += 300) { await p.evaluate(y => scrollTo(0, y), y); await new Promise(r => setTimeout(r, 2200)); }
    await new Promise(r => setTimeout(r, 6000));
    const pops = await p.evaluate(() => window.__pops), seenAny = await p.evaluate(() => !!document.querySelector('canvas')); if (pops.length || !seenAny) bad++;
    console.log(`drawn ${kind} rich ${rich} ${theme}: ${pops.length ? pops.length + ' pieces came in whole: ' + pops.slice(0, 5).map(q => `${q.laid} px laid, ${q.grown} grown${q.at ? ' at' + q.at : ''}`).join('; ') : 'ok'}`); await p.close(); }
} finally { await b.close(); }
if (bad) { console.log(`${bad} pages with paint on words`); process.exitCode = 1; }
