// node playground/tests/sumi.check.mjs [base-url]: Sumi on its specimen (tests/sumi.html), never lays
// ink on a word and never runs off its canvas. At every budget (0, .25, .5, .75, 1), several seeds, 1440 and 390, light and
// dark, the page drawn still; every text line on the page (its body, headings, contents, quotation, caption, pull quote,
// aside, code; the drop's own letter excepted) against every inked pixel of the ornament's canvases, and the canvases' own
// edges (ink there was cut off). Fails on any. Needs the playground served (default http://localhost:8000).
// env: RICH=0,.25,.5,.75,1  SEEDS=1,2,3,7  W=1440,390  THEMES=light,dark  SITE=http://127.0.0.1:port (a built
// site: its see page as well, and cold loads of it, which must have their ornament from the moment they say they have drawn)
// COLD=sumi,copperplate,... (the cold loads of those styles' see pages; default sumi)
import { launch, open, load } from '../../tools/chrome.mjs';
const base = process.argv[2] ?? 'http://localhost:8000', b = await launch(), env = (k, d) => (process.env[k] ?? d).split(',');
let bad = 0;
try {
  const pages = [];
  for (const width of env('W', '1440,390').map(Number)) for (const kind of ['']) for (const theme of env('THEMES', 'light,dark')) for (const rich of env('RICH', '0,.25,.5,.75,1')) for (const seed of env('SEEDS', '1,2,3,7')) {
    pages.push([width, theme, `sumi.html?rich=${rich}&theme=${theme}#seed=${seed}`, `rich ${rich} seed ${seed}`]);
    if (process.env.SITE) pages.push([width, theme, `${process.env.SITE}/see.html?style=sumi&rich=${rich}#seed=${seed}`, `site rich ${rich} seed ${seed}`]); }
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
  // (COLD=style,...: the same for other styles' see pages; the check is the library's, not sumi's own)
  if (process.env.SITE) for (const style of env('COLD', 'sumi')) for (const width of env('W', '1440,390').map(Number)) for (const kind of ['']) for (const theme of env('THEMES', 'light,dark')) for (let run = 0; run < 3; run++) {
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
  // drawn (?draw, the pages written as you read): every piece must come in as the brush lays it (a seal as it is pressed). The page scrolled through a
  // step at a time; in the page, each frame, the ink on each piece's own window while it grows, and the ink the page lays
  // where the window stood when it goes. A piece laid on the page with no window grown first, or whose window had less than
  // 80% of the ink it then lays, came in whole: a pop. (DRAW=0 skips; DRAWS=rich:theme,... chooses.)
  if (process.env.DRAW !== '0') for (const spec of env('DRAWS', '.5:light,1:dark,.25:light,1:light')) {
    const [rich, theme] = spec.split(':'), p = await open(b, { width: 1440, height: 900, dpr: 1, dark: theme === 'dark' });
    await p.evaluateOnNewDocument(() => { const log = window.__pops = [], grows = new Map(); let base = null, last = -1, prevT = 0, n = 0, explained = 0;
      // (ink counted as rubricate's other checks count it: every third pixel's alpha over 40; the page's own canvas only where
      // a piece is laid, so the sampling does not itself slow the page's frames, and the whole of it every tenth frame)
      const count = (c, x = 0, y = 0, w = c.width, h = c.height) => { x = Math.max(0, Math.floor(x)); y = Math.max(0, Math.floor(y)); w = Math.min(c.width - x, Math.ceil(w)); h = Math.min(c.height - y, Math.ceil(h)); if (w <= 0 || h <= 0) return 0;
        let g; try { g = c.getContext('2d'); } catch {} if (!g) return 0; const d = g.getImageData(x, y, w, h).data; let k = 0; for (let q = 3; q < d.length; q += 12) if (d[q] > 40) k++; return k; };
      // (a window's ink taken the moment it is removed as well: under load its last frame may fall between two ticks)
      const watch = () => new MutationObserver(ms => { for (const m of ms) for (const c of m.removedNodes) { const g = grows.get(c); if (g) { g.max = Math.max(g.max, count(c)); g.gone = true; } } }).observe(document.documentElement, { childList: true, subtree: true });
      const tick = () => { const t = performance.now(), gap = prevT ? t - prevT : 0; prevT = t; n++;
        base ??= [...document.querySelectorAll('canvas')].find(c => !c.dataset.grow && c.width > 300 && c.height > 300 && (() => { try { return !!c.getContext('2d'); } catch { return false; } })());
        if (base) { const B = base.getBoundingClientRect(), k = base.width / B.width;
          for (const c of document.querySelectorAll('canvas[data-grow]')) { let g = grows.get(c);
            if (!g) { const r = c.getBoundingClientRect(), rect = [(r.left - B.left) * k, (r.top - B.top) * k, r.width * k, r.height * k]; g = { max: 0, rect, base0: count(base, ...rect), at: `${c.style.left},${c.style.top}` }; grows.set(c, g); }
            g.max = Math.max(g.max, count(c)); }
          // a window gone: what the page laid where it stood, against the most its window showed
          for (const [c, g] of grows) if (g.gone || !c.isConnected) { const laid = count(base, ...g.rect) - g.base0; explained += Math.max(0, laid);
            if (laid > 40 && laid > g.max * 1.25 + 40) log.push({ t: Math.round(t), laid, grown: g.max, at: ' ' + g.at, gap: Math.round(gap) }); grows.delete(c); }
          // ink laid with no window at all
          if (n % 10 === 0 || last < 0) { const v = count(base); if (last >= 0 && v - last - explained > 120) log.push({ t: Math.round(t), laid: v - last - explained, grown: 0, at: '', gap: Math.round(gap) }); last = v; explained = 0; } }
        requestAnimationFrame(tick); };
      addEventListener('DOMContentLoaded', watch); addEventListener('load', () => requestAnimationFrame(tick)); });
    await load(p, `${base}/playground/tests/sumi.html?rich=${rich}&theme=${theme}&draw#seed=3`, { reading: true, timeout: 240000 });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= H; y += 300) { await p.evaluate(y => scrollTo(0, y), y); await new Promise(r => setTimeout(r, 2200)); }
    await new Promise(r => setTimeout(r, 6000));
    // (a piece laid in a frame that came more than 150 ms after the last one: the page itself was starved of frames, by the
    // machine's load, and its window's last frames were never drawn; reported, not failed. Whether the drawing itself shows
    // all of a piece before it is laid is tested below, frame by frame, without the clock.)
    const all = await p.evaluate(() => window.__pops), seenAny = await p.evaluate(() => !!document.querySelector('canvas')), pops = all.filter(q => q.gap <= 150), starved = all.length - pops.length; if (pops.length || !seenAny) bad++;
    console.log(`drawn rich ${rich} ${theme}: ${pops.length ? pops.length + ' pieces came in whole: ' + pops.slice(0, 5).map(q => `${q.laid} px laid, ${q.grown} grown${q.at ? ' at' + q.at : ''} (frame gap ${q.gap} ms)`).join('; ') : 'ok'}${starved ? ` (${starved} laid after a starved frame, over 150 ms: load, not counted)` : ''}`); await p.close(); }
  // the drawing itself, without the clock: every kind of piece at every budget, its window at f = .995 (the last frame a page
  // at 60 frames a second draws before a piece of a second or more is laid) must already show at least 98% of the ink it is
  // then laid with (a stroke's edge or halo, or a seal's last corner, held back to the end is a pop however fast the frames)
  if (process.env.DRAW !== '0') { const p = await open(b, { width: 1440, height: 900, dpr: 1 });
    await load(p, `${base}/playground/tests/sumi.html?rich=.5#seed=3`, { timeout: 240000 });
    const res = await p.evaluate(async () => { const S = (await import('../kit/styles/sumi.js')).default; await S.initial.load(); const out = [];
      for (const rich of [0, .25, .5, .75, 1]) for (const seed of [3, 4, 5]) { S.setup(seed);
        const cases = [['end', S.breakMark(500, 300, 600, 2, 5, rich, 9, 1, [150, 450])], ['sweep', S.breakMark(500, 300, 600, 3, 6, rich, 9, 1, [230, 370])], ['point', S.breakMark(500, 300, 600, 1, 7, rich, 9)],
          ['paraph', S.paraph(300, 300, 9, 8, rich)], ['filler', S.filler(300, 900, 291, 300, 'row', 9, rich)], ['runout', S.filler(300, 900, 291, 300, 'rule', 10, rich)],
          ['drop', S.initial({ ch: 'B', G: { box: [300, 200, 400, 300] }, big: true, seed: 11, rich, keep: [], u: 9 })], ['line', S.initial({ ch: 'L', G: { box: [300, 280, 320, 300] }, big: false, seed: 12, rich, keep: [], u: 9 })],
          ['quote', S.frames.quote({ box: [300, 200, 800, 320], lines: [{ left: 340, right: 800, top: 200, base: 320 }], u: 9, seed: 12, rich })], ['pull', S.frames.pull({ cx: 500, yTop: 200, yBot: 300, measure: 600, u: 9, seed: 13, rich })],
          ['nav', S.frames.nav({ box: [300, 200, 800, 320], entries: [{ left: 340, base: 220 }], u: 9, seed: 14, rich })]];
        for (const [name, made] of cases) for (const pour of S.print(made, { dpr: 1, animate: true }).pours) {
          const W = Math.ceil(pour.w) + 4, H = Math.ceil(pour.h) + 4, full = new OffscreenCanvas(W, H), fg = full.getContext('2d'), mask = new OffscreenCanvas(W, H), mg = mask.getContext('2d');
          fg.translate(-pour.x0, -pour.y0); pour.paint(fg); mg.translate(-pour.x0, -pour.y0); pour.grow.fn(mg, .995);
          const a = fg.getImageData(0, 0, W, H).data, m = mg.getImageData(0, 0, W, H).data; let tot = 0, shown = 0;
          for (let k = 3; k < a.length; k += 4) if (a[k] > 40) { tot++; if (m[k] > 128) shown++; }
          if (tot && shown / tot < .98) out.push(`${name} rich ${rich} seed ${seed}: ${(shown / tot * 100).toFixed(1)}% shown at f .995`); } }
      return out; });
    if (res.length) bad++; console.log(`drawn, the window just before it is laid: ${res.length ? res.slice(0, 8).join('; ') + (res.length > 8 ? ` (+${res.length - 8})` : '') : 'ok (every kind of piece, five budgets, three seeds)'}`); await p.close(); }
} finally { await b.close(); }
if (bad) { console.log(`${bad} pages with paint on words`); process.exitCode = 1; }
