// node playground/tests/typewriter.check.mjs [base-url]: Typewriter on its specimen (tests/typewriter.html) never lays ink on a word, and
// no piece is cut off by the page's edge. At every budget (0, .25, .5, .75, 1), several seeds, 1440 and 390, light and dark,
// the page drawn still: every text line on the page (its full line box: body, headings, contents, quotation, caption,
// pull quote, aside, code; the drop's own letter excepted) against every inked pixel of the ornament's canvases; and every
// inked pixel inside the page's width. Fails on any. Needs the playground served (default http://localhost:8000).
// env: RICH=0,.25,.5,.75,1  SEEDS=1,2,3,7  W=1440,390  THEMES=light,dark  SITE=http://127.0.0.1:port (a built site's see page too)
// Drawn (?draw, DRAW=0 skips; DRAWS=rich:theme,...): pages typed as you read, no piece in whole (frame-sampled), and every
// kind of piece's window just before it is laid showing what its strikes have laid (without the clock), with a control.
import { launch, open, load } from '../../tools/chrome.mjs';
const base = process.argv[2] ?? 'http://localhost:8000', b = await launch(), env = (k, d) => (process.env[k] ?? d).split(',');
let bad = 0;
try {
  const pages = [];
  for (const width of env('W', '1440,390').map(Number)) for (const theme of env('THEMES', 'light,dark')) for (const rich of env('RICH', '0,.25,.5,.75,1')) for (const seed of env('SEEDS', '1,2,3,7')) {
    pages.push([width, theme, `${base}/playground/tests/typewriter.html?rich=${rich}&theme=${theme}#seed=${seed}`, `rich ${rich} seed ${seed}`]);
    if (process.env.SITE) pages.push([width, theme, `${process.env.SITE}/see.html?style=typewriter&rich=${rich}#seed=${seed}`, `site rich ${rich} seed ${seed}`]); }
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
  // drawn (?draw, the pages typed as you read): every piece must come in as its keys strike, in its colours. The page scrolled through a
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
    await load(p, `${base}/playground/tests/typewriter.html?rich=${rich}&theme=${theme}&draw#seed=3`, { reading: true, timeout: 240000 });
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= H; y += 300) { await p.evaluate(y => scrollTo(0, y), y); await new Promise(r => setTimeout(r, 2200)); }
    await new Promise(r => setTimeout(r, 6000));
    // (a piece laid in a frame that came more than 150 ms after the last one: the page itself was starved of frames, by the
    // machine's load, and its window's last frames were never drawn; reported, not failed. Whether the drawing itself shows
    // all of a piece before it is laid is tested below, frame by frame, without the clock.)
    const all = await p.evaluate(() => window.__pops), seenAny = await p.evaluate(() => !!document.querySelector('canvas')), pops = all.filter(q => q.gap <= 150), starved = all.length - pops.length; if (pops.length || !seenAny) bad++;
    console.log(`drawn rich ${rich} ${theme}: ${pops.length ? pops.length + ' pieces came in whole: ' + pops.slice(0, 5).map(q => `${q.laid} px laid, ${q.grown} grown${q.at ? ' at' + q.at : ''} (frame gap ${q.gap} ms)`).join('; ') : 'ok'}${starved ? ` (${starved} laid after a starved frame, over 150 ms: load, not counted)` : ''}`); await p.close(); }
  // the drawing itself, without the clock: each kind of piece at every budget, light and dark, its window at f = .995 must show
  // the still (black and red alike) as fully as the typist has struck it by then: the share of the still's ink shown, against
  // the share of the piece's ink its strikes have laid by that moment (the writer's own film), within 3 points. A strike still
  // to come may land when the piece is laid (a key strikes at once); ink already struck shown paler and made whole at the end
  // is a pop. Control: the same measure with the window drawn as the typed ink itself (its colour's own opacity, as before
  // this test) must fail, or the measure proves nothing.
  if (process.env.DRAW !== '0') for (const theme of env('THEMES', 'light,dark')) { const p = await open(b, { width: 1440, height: 900, dpr: 1, dark: theme === 'dark' });
    await load(p, `${base}/playground/tests/typewriter.html?rich=.5&theme=${theme}#seed=3`, { timeout: 240000 });
    const res = await p.evaluate(async () => { const S = (await import('../kit/styles/typewriter.js')).default, Mod = await import('../kit/styles/typewriter-machine.js'); await S.initial.load(); const out = [], ctl = [];
      const dark = document.documentElement.dataset.theme === 'dark', pv = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim(), nums = pv.match(/\d+(\.\d+)?/g), look = { theme: dark ? 'dark' : 'light', stock: /^#[0-9a-f]{6}$/i.test(pv) ? pv : nums && nums.length >= 3 ? '#' + nums.slice(0, 3).map(v => Math.round(+v).toString(16).padStart(2, '0')).join('') : dark ? '#17161A' : '#F2EEE4' };
      const sum = c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let s = 0; for (let q = 3; q < d.length; q += 4) s += d[q]; return s; };
      for (const rich of [0, .25, .5, .75, 1]) for (const seed of [3, 4]) { S.setup(seed); const M = Mod.machine(seed, { family: Mod.FACE.family });
        const cases = [['drop', S.initial({ ch: 'B', G: { box: [300, 200, 420, 330] }, big: true, seed: 11, rich, keep: [], u: 9 })], ['line', S.initial({ ch: 'L', G: { box: [300, 280, 320, 300] }, big: false, seed: 12, rich, keep: [], u: 9 })],
          ['paraph', S.paraph(300, 300, 9, 8, rich)], ['filler', S.filler(300, 900, 291, 300, 'row', 9, rich)], ['runout', S.filler(300, 900, 291, 300, 'rule', 10, rich)],
          ['break1', S.breakMark(500, 300, 600, 1, 7, rich, 9)], ['break3', S.breakMark(500, 300, 600, 3, 6, rich, 9, 1, [200, 400])], ['break2', S.breakMark(500, 300, 600, 2, 5, rich, 9, 1, [100, 500])],
          ['quote', S.frames.quote({ box: [300, 200, 800, 320], lines: [{ left: 340, right: 800, top: 200, base: 240 }, { left: 340, right: 800, top: 260, base: 300 }, { left: 340, right: 800, top: 300, base: 330 }], u: 9, seed: 12, rich })],
          ['pull', S.frames.pull({ cx: 500, yTop: 200, yBot: 300, measure: 600, u: 9, seed: 13, rich })], ['figure', S.frames.figure({ box: [300, 200, 800, 320], u: 9, seed: 13, rich })]];
        for (const [name, made] of cases) { const prs = S.print(made, { dpr: 1, animate: true }).pours, bs = (made.letters ?? []).filter(b => b.shape === 'typewriter');
          prs.forEach((pour, i) => { const bx = bs[i], W = Math.ceil(pour.w) + 4, H = Math.ceil(pour.h) + 4, full = new OffscreenCanvas(W, H), fg = full.getContext('2d'), mask = new OffscreenCanvas(W, H), mg = mask.getContext('2d');
            fg.translate(-pour.x0, -pour.y0); pour.paint(fg); mg.translate(-pour.x0, -pour.y0); pour.grow.fn(mg, .995);
            const a = fg.getImageData(0, 0, W, H).data, m = mg.getImageData(0, 0, W, H).data; let tot = 0, shown = 0; for (let q = 3; q < a.length; q += 4) { tot += a[q]; shown += a[q] * m[q] / 255; }
            // the strikes landed by then: the writer's own typed ink at .995 against its whole
            const cv = document.createElement('canvas'), w = Mod.writer(M, bx.pc, look, { d: 1, at: [bx.x, bx.y], cap: name === 'drop' ? 4 : 2.2 }, cv); w.at(.995 * w.dur); const s1 = sum(cv); w.done(); const s2 = sum(cv), landed = s2 ? s1 / s2 : 1;
            const sh = tot ? shown / tot : 1; if (sh < landed - .03) out.push(`${name} rich ${rich} seed ${seed}: ${(sh * 100).toFixed(0)}% shown, ${(landed * 100).toFixed(0)}% struck`);
            // the control: the typed ink itself as the window
            if (rich === .5 && seed === 3 && name === 'drop') { w.reset(); w.at(.995 * w.dur); const c2 = new OffscreenCanvas(W, H), cg = c2.getContext('2d'); cg.translate(-pour.x0, -pour.y0); cg.drawImage(cv, pour.x0, pour.y0);
              const m2 = cg.getImageData(0, 0, W, H).data; let s3 = 0; for (let q = 3; q < a.length; q += 4) s3 += a[q] * m2[q] / 255; ctl.push(tot ? s3 / tot < landed - .03 : false); } }); } }
      return { out, ctl }; });
    const okCtl = res.ctl.length && res.ctl.every(Boolean); if (res.out.length || !okCtl) bad++;
    console.log(`drawn ${theme}, the window just before it is laid: ${res.out.length ? res.out.slice(0, 8).join('; ') + (res.out.length > 8 ? ` (+${res.out.length - 8})` : '') : 'ok (every kind of piece, five budgets, two seeds)'}; control ${okCtl ? 'fails as it should' : 'DID NOT FAIL: the measure proves nothing'}`); await p.close(); }
} finally { await b.close(); }
if (bad) { console.log(`${bad} pages with ink on words, cut off, or a piece in whole`); process.exitCode = 1; }
