// Rubricate (research/10-rubricate.md): one walk over the host's markup finds the cases (drop and line initials, the
// six framed boxes), each is made by its style in the registry (STYLES in kit/wayfinding.js, with kit/initials.js and
// kit/frames.js), and drawn. Stage one: the measuring walk and a still, stamped-pen drawing; the score (now / read),
// the ink medium (kit/writer.js), paraphs, fillers and breaks join this walk in stage two.
import { pen, dot, paintField, PIGMENTS } from './marks.js';
import { STYLES, paletteOf, grammar, lift } from './wayfinding.js';
import './initials.js';
import './frames.js';

export const SELECT = { initial: '.ini', drop: '.ini.drop', quote: 'blockquote', figure: 'figure', code: 'pre', pull: '.pull', aside: 'aside', nav: 'nav' };
const FONT = (w, px) => `${w} ${px}px "EB Garamond"`;
const metric = (() => { let m; return () => m ??= (() => { const c = document.createElement('canvas').getContext('2d'); c.font = FONT(600, 100); const H = c.measureText('H'), x = c.measureText('x');
  return { asc: H.fontBoundingBoxAscent / 100, desc: H.fontBoundingBoxDescent / 100, cap: H.actualBoundingBoxAscent / 100, x: x.actualBoundingBoxAscent / 100 }; })(); })();
const styleOf = (el, root, def) => el.closest('[data-style]')?.dataset.style ?? root.dataset.style ?? def;

// ---- measuring (after 03 and 07) -------------------------------------------------------------------------------------
// a drop initial sized so its top meets the first line's cap height and its foot sits on the last line's baseline; the
// float cut to exactly n lines (wider on the text side by the style's own amount at a lavish budget)
export function setInitials(root, { style, rich = .5 } = {}) {
  const M = metric();
  for (const s of root.querySelectorAll(SELECT.drop)) {
    const p = s.closest('p') ?? s.parentElement, cs = getComputedStyle(p), fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight);
    const bodyCap = fs * M.cap, base = (lh - (M.asc + M.desc) * fs) / 2 + M.asc * fs, n = +s.dataset.lines || 3, F = ((n - 1) * lh + bodyCap) / M.cap, top = (n - 1) * lh + base - F * ((1 - M.asc - M.desc) / 2 + M.asc);
    const S = STYLES[styleOf(s, root, style)], lv = levelOf(s.dataset.rich ?? rich);
    Object.assign(s.style, { fontSize: F + 'px', marginTop: top + 'px', height: (n * lh - 2 - top) + 'px', marginRight: Math.round(lh * .42 + (S.initial?.wider?.[lv] ?? 0)) + 'px', marginLeft: '-1px' });
  }
}
export const levelOf = rich => Math.max(0, Math.min(4, Math.round(+rich * 4)));
// the letter as a coverage mask at `res` cells per px, its top-left on the page, and its ink box
export function glyphOf(span, origin, res = 4) {
  const M = metric(), F = parseFloat(span.style.fontSize || getComputedStyle(span).fontSize), rg = document.createRange(); rg.selectNodeContents(span);
  const rc = rg.getClientRects()[0], x = rc.left - origin.left, baseline = rc.top - origin.top + M.asc * F;
  const c = document.createElement('canvas').getContext('2d', { willReadFrequently: true }); c.font = FONT(600, F);
  const m = c.measureText(span.textContent), pad = 4, x0 = Math.floor(x - m.actualBoundingBoxLeft - pad), y0 = Math.floor(baseline - m.actualBoundingBoxAscent - pad);
  const w = Math.ceil((x + m.actualBoundingBoxRight + pad - x0) * res), h = Math.ceil((baseline + m.actualBoundingBoxDescent + pad - y0) * res);
  c.canvas.width = w; c.canvas.height = h; c.setTransform(res, 0, 0, res, -x0 * res, -y0 * res); c.font = FONT(600, F); c.fillStyle = '#000'; c.fillText(span.textContent, x, baseline);
  const d = c.getImageData(0, 0, w, h).data, A = new Float32Array(w * h); for (let i = 0; i < w * h; i++) A[i] = d[i * 4 + 3] / 255;
  return { M: A, w, h, x0, y0, res, box: [x - m.actualBoundingBoxLeft, baseline - m.actualBoundingBoxAscent, x + m.actualBoundingBoxRight, baseline + m.actualBoundingBoxDescent], F };
}
// the words, as rects to keep clear of (every line box of every text node, the initials excepted)
export function wordRects(root, origin, pad) {
  const out = [], tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) { if (n.parentElement.closest(SELECT.initial) || !n.textContent.trim()) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    for (const r of rg.getClientRects()) out.push([r.left - origin.left - pad, r.top - origin.top + 2 - pad * .5, r.right - origin.left + pad, r.bottom - origin.top - 2 + pad * .5]); }
  return out;
}
// an element's lines as the browser laid them out: one rect per line box, with its baseline
export const linesOf = (el, o) => { const rg = document.createRange(); rg.selectNodeContents(el); const fs = parseFloat(getComputedStyle(el).fontSize), out = [];
  for (const r of rg.getClientRects()) { if (r.width < 1) continue; const t = r.top - o.top, last = out.at(-1);
    if (last && Math.abs(last.top - t) < 3) { last.right = Math.max(last.right, r.right - o.left); continue; }
    out.push({ top: t, base: t + metric().asc * fs, left: r.left - o.left, right: r.right - o.left }); }
  return out; };
export const rel = (el, o) => { const r = el.getBoundingClientRect(); return [r.left - o.left, r.top - o.top, r.right - o.left, r.bottom - o.top]; };

// ---- the walk ------------------------------------------------------------------------------------------------------------
// every case under root, made by its style: { el, kind, style, a (the pair colour 'a' stands for), letter?, ground?, marks }
export function collect(root, sheet, { style = 'gothic', rich = .5, seed = 1 } = {}) {
  const o = sheet.getBoundingClientRect(), text = root.getBoundingClientRect(), fs = parseFloat(getComputedStyle(root).fontSize), u = fs * metric().x, g = u * .3;
  const keep = wordRects(root, o, 3), out = [], s = k => (seed + k * 7919) >>> 0, edge = 14;
  root.querySelectorAll(SELECT.initial).forEach((span, k) => {
    const key = styleOf(span, root, style), S = STYLES[key], big = span.matches(SELECT.drop), G = glyphOf(span, o, 4), lh = parseFloat(getComputedStyle(span.closest('p') ?? root).lineHeight);
    const rk = span.dataset.rich ?? rich, args = { G, keep, lh, u, big, level: levelOf(rk), rich: +rk, seed: s(k), room: Math.max(0, G.box[0] - edge), bottom: o.height - 30 };
    const made = S.initial ? S.initial(args) : { letter: { M: G, col: 'a' }, marks: [] };
    out.push({ el: span, kind: big ? 'drop' : 'initial', style: key, a: S.pair[0], seed: args.seed, ...made });
  });
  const F = key => STYLES[key].frames;
  const frame = (el, kind, k, make) => { const key = styleOf(el, root, style); if (F(key)?.[kind]) out.push({ el, kind, style: key, marks: make(F(key)[kind]) }); };
  root.querySelectorAll(SELECT.nav).forEach((nav, k) => { const list = nav.querySelector('ol, ul') ?? nav, nb = rel(list, o), side = nb[0] > 46;
    frame(nav, 'nav', k, f => f({ box: nb, entries: [...nav.querySelectorAll('li')].map(li => linesOf(li, o)[0]), x: nb[0] - u * 2.2, u, g, seed: s(1 + k), rich, side })); });
  root.querySelectorAll(SELECT.quote).forEach((bq, k) => { const b = rel(bq, o); frame(bq, 'quote', k, f => f({ x: b[0] + u * .9, lines: linesOf(bq, o), u, g, seed: s(10 + k), rich })); });
  root.querySelectorAll(SELECT.figure).forEach((fg, k) => frame(fg, 'figure', k, f => f({ box: rel(fg.querySelector('svg, img, canvas') ?? fg, o), u, g, seed: s(20 + k), rich })));
  root.querySelectorAll(SELECT.aside).forEach((a, k) => frame(a, 'aside', k, f => f({ box: rel(a, o), u, g, seed: s(30 + k), rich })));
  root.querySelectorAll(SELECT.pull).forEach((p, k) => { const L = linesOf(p, o), m = [text.left - o.left, 0, text.right - o.left];
    frame(p, 'pull', k, f => f({ cx: (m[0] + m[2]) / 2, yTop: L[0].top - u * 2.2, yBot: L.at(-1).base + u * 2.6, measure: m[2] - m[0], u, seed: s(40 + k), rich })); });
  root.querySelectorAll(SELECT.code).forEach((p, k) => frame(p, 'code', k, f => f({ box: rel(p, o), u, g, seed: s(50 + k), rich })));
  // reading order; the frames' colours alternate down the page (07)
  out.sort((x, y) => x.el.getBoundingClientRect().top - y.el.getBoundingClientRect().top);
  let n = 0; for (const it of out) if (!it.letter) { const P = STYLES[it.style].pair; it.a = P[n++ % P.length]; }
  return out;
}

// ---- a still drawing with the stamped pen (the medium and the score come in stage two) ------------------------------------
const inkOf = (P, it, col, S) => { const other = it.a === S.pair[0] ? S.pair[1] ?? S.pair[0] : S.pair[0];
  const name = col === 'g' ? 'gold' : col === 'k' ? 'black' : col === 'f' ? 'flesh' : col === 'a' ? it.a : other; return P[name] ?? P[S.pair[0]]; };
function flat(g, L, rgb, dx = 0, dy = 0) {   // a letter laid flat in one colour, from its coverage
  const c = new OffscreenCanvas(L.w, L.h), k = c.getContext('2d'), img = k.createImageData(L.w, L.h);
  for (let i = 0; i < L.w * L.h; i++) { img.data.set(rgb, i * 4); img.data[i * 4 + 3] = Math.round(Math.min(1, L.M[i]) * 255); }
  k.putImageData(img, 0, 0); g.drawImage(c, L.x0 + dx, L.y0 + dy, L.w / L.res, L.h / L.res);
}
export function drawStill(g, items, { mode = 'light', paper = [244, 238, 226], seed = 1 } = {}) {
  const dark = mode === 'dark';
  items.forEach((it, mi) => {
    const S = STYLES[it.style], P = paletteOf(S, mode), ink = (m, solid) => m.ink ? (dark ? lift(m.ink) : m.ink) : inkOf(P, it, m.col, S)[solid ? 'solid' : 'hair'];   // a mark's own ink is lifted on dark as the palettes are
    const marks = list => (list ?? []).forEach((m, i) => {
      if (m.dot) return dot(g, m.p, m.r, ink(m, true), paper, .95, dark);
      pen(g, m.pts, { w: m.w * (m.broad ? 1 : 1.1), ink: ink(m, m.broad >= .5), paper, dark, seed: m.seed ?? (seed + mi * 131 + i * 7) >>> 0, start: m.start, end: m.end, load: m.load ?? .85, dry: m.dry ?? .3, broad: m.broad ?? .3, swell: m.swell ?? .25, nib: m.nib ?? .55, press: m.press });
    });
    marks(it.ground);
    const L = it.letter;
    // a brushed letter is laid subtractively, which on a dark ground would sink to black: there it is laid flat, lifted
    if (L?.pigment && dark) flat(g, L.M, lift(PIGMENTS[L.pigment].rgb));
    else if (L?.pigment) paintField(g, L.M.M, L.M.x0, L.M.y0, L.M.w, L.M.h, L.pigment, { dpr: L.M.res, seed: it.seed ?? seed, strength: 1 });
    else if (L) { const c = col => ink({ col }, true);
      if (L.ghost) flat(g, L.M, c(L.ghost.col), ...L.ghost.off);
      if (L.outline) for (let k = 0; k < 8; k++) flat(g, L.M, c(L.outline.col), Math.cos(k * Math.PI / 4) * L.outline.w, Math.sin(k * Math.PI / 4) * L.outline.w);
      flat(g, L.M, c(L.col)); }
    marks(it.marks);
  });
}
export { STYLES, grammar };
