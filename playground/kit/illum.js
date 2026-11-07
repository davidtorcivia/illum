// Rubricate (research/10-rubricate.md): the rubricator's pass over a finished text, as one act. One walk over the host's
// markup finds the cases (drop and line initials; paraphs, line-fillers and the breaks between parts; the six framed
// boxes), each is made by its style in the one registry (STYLES in kit/wayfinding.js, with kit/initials.js and
// kit/frames.js), and the whole is written as one score, in reading order, by one hand.
//
//   const r = rubricate(root, { style, rich, scale, theme, draw, ink, seed, host, select, on });
//   r.redraw(opts); r.destroy();
//
//   root    the text (an article); host: the positioned box the ink layers go in (default root.offsetParent)
//   style   a key of STYLES; data-style on root or any element inside overrides, as do data-rich and data-scale
//   rich    0..1, what the rubricator was paid to do; scale .5..2, the ornament's size independent of the text's
//   theme   'auto' (data-theme on <html>, else the reader's system) | 'light' | 'dark'. The host owns --paper, --ink and
//           --rubric; the ornament reads --paper and colours only its own marks. It sets --orn on root (the scale), for
//           a host that wants its paragraph indent to widen with a larger paraph
//   draw    'still' | 'now' (written in reading order, compressed to ~14 s) | 'read' (each ornament written when its
//           line comes 15% into the viewport). Under prefers-reduced-motion always still
//   ink     'medium' (the ink engine, kit/writer.js: the penwork's hairlines written with a round quill in a dry ink;
//           fills, points and the painted letter stay with kit/marks.js) | 'pen' (the stamped pen throughout; also
//           what 'medium' falls back to without WebGL2)
//   seed    default: a hash of the text. on(state, info): 'drawn' (still: { grow, draw } ms), 'reading', 'written'
//   view    'specimen' (the style as a pattern book) | 'sweep' (every style's paraph over thirty seeds); the text hidden
//
// Host markup: `.ini` (an initial in the line), `.ini.drop[data-lines]` (a drop initial); `section.book` and
// `section.chapter` (a book is opened by a rank-2 break above its heading, a chapter after its book's first by a rank-1
// break; within a chapter each paragraph after the first takes a paraph, and the heading and every paragraph a filler
// in the free end of its last line); outside chapters `p.par` (a paraph), `.fill` (a filler), `hr` and
// `.break[data-rank]` (a break); `blockquote`, `figure`, `pre`, `.pull`, `aside`, `nav` (the frames). All in SELECT.
// Every mark is on aria-hidden canvases behind the text (the medium's working window lies over it while it writes);
// the text is untouched apart from the drop initial's size and float.
import { pen, dot, paintField, PIGMENTS, fnv, stream } from './marks.js';
import { STYLES, paletteOf, grammar, lift } from './wayfinding.js';
import { createWriter, supported } from './writer.js';
import './initials.js';
import './frames.js';

export const SELECT = { initial: '.ini', drop: '.ini.drop', quote: 'blockquote', figure: 'figure', code: 'pre', pull: '.pull', aside: 'aside', nav: 'nav',
  book: '.book', chapter: '.chapter', paraph: 'p.par', filler: '.fill', break: 'hr, .break', text: 'h1, h2, h3, h4, h5, h6, p, li, figcaption, pre, dt, dd' };
const FONT = (w, px) => `${w} ${px}px "EB Garamond"`;
const metric = (() => { let m; return () => m ??= (() => { const c = document.createElement('canvas').getContext('2d'); c.font = FONT(600, 100); const H = c.measureText('H');
  c.font = FONT(400, 100); return { asc: H.fontBoundingBoxAscent / 100, desc: H.fontBoundingBoxDescent / 100, cap: H.actualBoundingBoxAscent / 100, x: c.measureText('x').actualBoundingBoxAscent / 100 }; })(); })();
const fontMetric = {}, metricOf = font => fontMetric[font] ??= (() => { const c = document.createElement('canvas').getContext('2d'); c.font = font; const m = c.measureText('x'), M = c.measureText('H');
  return { asc: M.fontBoundingBoxAscent, x: m.actualBoundingBoxAscent }; })();
const cssRgb = s => s.match(/\d+/g).slice(0, 3).map(Number);
const arclen = p => p.reduce((a, q, i) => i ? a + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0);
export const levelOf = rich => Math.max(0, Math.min(4, Math.round(+rich * 4)));

// ---- measuring (after 03, 06 and 07) ---------------------------------------------------------------------------------------
// a drop initial sized so its top meets the first line's cap height and its foot sits on the last line's baseline; the
// float cut to exactly n lines (wider on the text side by the style's own amount at a lavish budget)
export function setInitials(root, { style, rich = .5, select = SELECT } = {}) {
  const M = metric();
  for (const s of root.querySelectorAll(select.drop)) {
    const p = s.closest('p') ?? s.parentElement, cs = getComputedStyle(p), fs = parseFloat(cs.fontSize), lh = parseFloat(cs.lineHeight);
    const bodyCap = fs * M.cap, base = (lh - (M.asc + M.desc) * fs) / 2 + M.asc * fs, n = +s.dataset.lines || 3, F = ((n - 1) * lh + bodyCap) / M.cap, top = (n - 1) * lh + base - F * ((1 - M.asc - M.desc) / 2 + M.asc);
    const S = STYLES[s.closest('[data-style]')?.dataset.style] ?? STYLES[style], lv = levelOf(s.closest('[data-rich]')?.dataset.rich ?? rich);
    Object.assign(s.style, { fontSize: F + 'px', marginTop: top + 'px', height: (n * lh - 2 - top) + 'px', marginRight: Math.round(lh * .42 + (S.initial?.wider?.[lv] ?? 0)) + 'px', marginLeft: '-1px' });
  }
}
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
export function wordRects(root, origin, pad, select = SELECT) {
  const out = [], tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n; (n = tw.nextNode());) { if (n.parentElement.closest(select.initial) || !n.textContent.trim()) continue;
    const rg = document.createRange(); rg.selectNodeContents(n);
    for (const r of rg.getClientRects()) out.push([r.left - origin.left - pad, r.top - origin.top + 2 - pad * .5, r.right - origin.left + pad, r.bottom - origin.top - 2 + pad * .5]); }
  return out;
}
// an element's lines as the browser laid them out: one rect per line box, with its baseline (the frames' measure)
export const linesOf = (el, o) => { const rg = document.createRange(); rg.selectNodeContents(el); const fs = parseFloat(getComputedStyle(el).fontSize), out = [];
  for (const r of rg.getClientRects()) { if (r.width < 1) continue; const t = r.top - o.top, last = out.at(-1);
    if (last && Math.abs(last.top - t) < 3) { last.right = Math.max(last.right, r.right - o.left); continue; }
    out.push({ top: t, base: t + metric().asc * fs, left: r.left - o.left, right: r.right - o.left }); }
  return out; };
// every inline box of an element as its own rect (the wayfinding's measure, 06), an initial in it left out
const boxes = (el, o, select = SELECT) => { const rg = document.createRange(); rg.selectNodeContents(el); const ini = el.querySelector(select.initial); if (ini) rg.setStartAfter(ini);
  return [...rg.getClientRects()].filter(r => r.width > .5).map(r => ({ l: r.left - o.left, t: r.top - o.top, r: r.right - o.left, b: r.bottom - o.top })); };
export const rel = (el, o) => { const r = el.getBoundingClientRect(); return [r.left - o.left, r.top - o.top, r.right - o.left, r.bottom - o.top]; };

// ---- marks at the ornament's scale --------------------------------------------------------------------------------------------
// A mark list made at unit size, scaled about an anchor (ax, ay) by the ornament scale (fx: where the anchor was
// generated, for a flush-left break). Strokes thicken in proportion when larger; when smaller they thin only by the
// square root, so a hairline stays a line a pen could draw
function scaled(list, ax, ay, S, fx = ax) {
  if (S === 1 && fx === ax) return list; const f = ([x, y]) => [ax + (x - fx) * S, ay + (y - ay) * S];
  return list.map(m => m.dot ? { ...m, p: f(m.p), r: Math.max(.45, m.r * S) } : { ...m, pts: m.pts.map(f), w: Math.max(.32, m.w * Math.sqrt(S) * (S > 1 ? Math.sqrt(S) : 1)) });
}
const thick = (list, S) => S === 1 ? list : list.map(m => m.dot ? { ...m, r: Math.max(.45, m.r * S) } : { ...m, w: Math.max(.32, m.w * Math.sqrt(S) * (S > 1 ? Math.sqrt(S) : 1)) });
// Curves are subdivided to under a pixel at their drawn size (Hermite through the points), so no corner shows on a
// curve at any scale; a vertex that turns sharply (a zigzag, a chevron, a star) stays a corner, as the pen made it.
export function refine(pts) {
  if (pts.length < 3) return pts; const n = pts.length, out = [pts[0]], sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const turn = i => { if (i <= 0 || i >= n - 1) return 9; const a = sub(pts[i], pts[i - 1]), b = sub(pts[i + 1], pts[i]), la = Math.hypot(...a), lb = Math.hypot(...b);
    return la < 1e-6 || lb < 1e-6 ? 0 : Math.acos(Math.max(-1, Math.min(1, (a[0] * b[0] + a[1] * b[1]) / (la * lb)))); };
  for (let i = 0; i < n - 1; i++) { const p1 = pts[i], p2 = pts[i + 1], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    if (L < 1.2) { out.push(p2); continue; }
    const d = sub(p2, p1), m1 = turn(i) < .75 ? sub(pts[i + 1], pts[i - 1]).map(c => c / 2) : d, m2 = turn(i + 1) < .75 ? sub(pts[i + 2], pts[i]).map(c => c / 2) : d, k = Math.ceil(L / .8);
    for (let j = 1; j <= k; j++) { const t = j / k, t2 = t * t, t3 = t2 * t, h1 = 2 * t3 - 3 * t2 + 1, h2 = t3 - 2 * t2 + t, h3 = -2 * t3 + 3 * t2, h4 = t3 - t2;
      out.push([0, 1].map(c => h1 * p1[c] + h2 * m1[c] + h3 * p2[c] + h4 * m2[c])); } }
  return out;
}
// A hairline's square-cut end is right only where it meets another stroke (a join, hidden in it) or closes on itself;
// anywhere else the pen lifts, so a free 'cut' end becomes a taper.
function freeEnds(s, list) {
  if (s.broad >= .5) return { start: s.start, end: s.end };
  const near = (p, self) => list.some(o => o !== self && !o.dot && o.pts.some(q => Math.hypot(q[0] - p[0], q[1] - p[1]) < (o.w ?? .5) + (s.w ?? .5) + .6));
  const closed = Math.hypot(s.pts[0][0] - s.pts.at(-1)[0], s.pts[0][1] - s.pts.at(-1)[1]) < 1;
  const fix = (e, p) => e === 'cut' && !closed && !near(p, s) ? 'taper' : e;
  return { start: fix(s.start, s.pts[0]), end: fix(s.end, s.pts.at(-1)) };
}

// ---- the walk -------------------------------------------------------------------------------------------------------------------
// Every case under root, made by its style. An item: { el, kind, style, y (its place in reading order), a (the colour
// its 'a' stands for), marks, line (a wayfinding mark: made at unit size, scaled, refined, kept off the words),
// letter?, ground?, ax/ay (a paraph's foot or a break's centre, about which it gives way), redo (a filler's smaller
// remakes) }. The measure for each kind is the one its page was approved with (06 for the wayfinding, 07 for the
// frames, 03 for the initials), so the three looks carry over to the pixel.
function walk(root, sheet, c) {
  const { SEED, sel } = c, o = sheet.getBoundingClientRect(), text = root.getBoundingClientRect(), out = [], s = k => (SEED + k * 7919) >>> 0;
  const at = (el, name, def) => { const h = el.closest(`[data-${name}]`); return h && h !== root && root.contains(h) ? h.dataset[name] : def; };
  const styleAt = el => STYLES[at(el, 'style', c.style)] ? at(el, 'style', c.style) : c.style, richAt = el => Math.max(0, Math.min(1, +at(el, 'rich', c.rich) || 0)),
    scaleAt = el => Math.max(.5, Math.min(2, +at(el, 'scale', c.scale) || 1));
  const fs = parseFloat(getComputedStyle(root).fontSize), u = fs * metric().x, g = u * .3, dropped = {};
  // initials (03): the letter and the marks round it
  const keep = wordRects(root, o, 3, sel);
  root.querySelectorAll(sel.initial).forEach((span, k) => {
    const key = styleAt(span), S = STYLES[key], big = span.matches(sel.drop), G = glyphOf(span, o, 4), lh = parseFloat(getComputedStyle(span.closest('p') ?? root).lineHeight), rk = richAt(span);
    const args = { G, keep, lh, u, big, level: levelOf(rk), rich: rk, seed: s(k), room: Math.max(0, G.box[0] - 14), bottom: o.height - 30 };
    const made = S.initial ? S.initial(args) : { letter: { M: G, col: 'a' }, marks: [] };
    out.push({ el: span, kind: big ? 'drop' : 'initial', style: key, a: S.pair[0], seed: args.seed, y: span.getBoundingClientRect().top - o.top, ...made });
  });
  // the words, to keep clear of
  const TEXT = [], words = []; root.querySelectorAll(sel.text).forEach(el => { const L = boxes(el, o, sel); TEXT.push(...L); words.push(...L); });
  const touches = (x, y, R) => words.some(b => x + R > b.l - 1.5 && x - R < b.r + 1.5 && y + R > b.t + .5 && y - R < b.b - .5);
  const hits = s => s.dot ? touches(s.p[0], s.p[1], s.r) : resampleLine(s.pts, .5).some(([x, y]) => touches(x, y, s.w / 2));
  // frames (07): each grown from its box; the ornament scale enlarges the hand (u) and thickens its line. A frame stands
  // in the room its box leaves, which is laid out for the hand at size: smaller, it keeps that room and only thins;
  // larger, it grows only as far as it stays off the words
  const frame = (el, kind, make) => { const key = styleAt(el), f = STYLES[key].frames?.[kind], S = scaleAt(el); if (!f) return;
    let k = Math.max(1, S), m; while (m = thick(make(f, u * k, g * k, richAt(el)), S), k > 1 && m.some(hits)) k = Math.max(1, k - .25);
    out.push({ el, kind, style: key, y: el.getBoundingClientRect().top - o.top, marks: m }); };
  root.querySelectorAll(sel.nav).forEach((nav, k) => { const list = nav.querySelector('ol, ul') ?? nav, nb = rel(list, o), side = nb[0] > 46;
    frame(nav, 'nav', (f, u, g, rich) => f({ box: nb, entries: [...nav.querySelectorAll('li')].map(li => linesOf(li, o)[0]), x: nb[0] - u * 2.2, u, g, seed: s(1 + k), rich, side })); });
  root.querySelectorAll(sel.quote).forEach((bq, k) => { const b = rel(bq, o); frame(bq, 'quote', (f, u, g, rich) => f({ x: b[0] + u * .9, lines: linesOf(bq, o), u, g, seed: s(10 + k), rich })); });
  root.querySelectorAll(sel.figure).forEach((fg, k) => frame(fg, 'figure', (f, u, g, rich) => f({ box: rel(fg.querySelector('svg, img, canvas') ?? fg, o), u, g, seed: s(20 + k), rich })));
  root.querySelectorAll(sel.aside).forEach((a, k) => frame(a, 'aside', (f, u, g, rich) => f({ box: rel(a, o), u, g, seed: s(30 + k), rich })));
  root.querySelectorAll(sel.pull).forEach((p, k) => { const L = linesOf(p, o), m = [text.left - o.left, 0, text.right - o.left];
    frame(p, 'pull', (f, u, g, rich) => f({ cx: (m[0] + m[2]) / 2, yTop: L[0].top - u * 2.2, yBot: L.at(-1).base + u * 2.6, measure: m[2] - m[0], lines: L, u, seed: s(40 + k), rich })); });
  root.querySelectorAll(sel.code).forEach((p, k) => frame(p, 'code', (f, u, g, rich) => f({ box: rel(p, o), u, g, seed: s(50 + k), rich })));

  // the wayfinding (06): paraphs, fillers and breaks, each made at unit size and scaled about its anchor
  const GRAM = c.gram, G = key => GRAM[key] ??= grammar(STYLES[key]), V = key => (c.setups[key] ??= G(key).setup(SEED));
  const pairAt = (k, key) => G(key).alternate ? G(key).pair[k % 2] : G(key).pair[0];
  // a part's opening is room kept for its break: a filler may not swing down into it
  root.querySelectorAll(`${sel.book}, ${sel.chapter}`).forEach(el => { const b = el.getBoundingClientRect(); TEXT.push({ l: b.left - o.left, r: b.right - o.left, t: b.top - o.top, b: b.top - o.top + 1 }); });
  const marks = []; let nFill = 0;
  const fillAfter = (el, col, seed) => {
    const key = styleAt(el), S = G(key), RICH = richAt(el), SCALE = scaleAt(el), cs = getComputedStyle(el), fs = parseFloat(cs.fontSize), mt = metricOf(`${cs.fontStyle} ${cs.fontWeight} ${fs}px "EB Garamond"`), L = boxes(el, o, sel);
    if (!L.length) return;
    const last = L.filter(r => Math.abs(r.t - L.at(-1).t) < 2), right = Math.max(...last.map(r => r.r)), er = el.getBoundingClientRect(), measure = er.right - o.left;
    const x0 = right + fs * .35, x1 = measure, base = last[0].t + mt.asc;
    if (x1 - x0 < fs * S.minGap) return;
    const kinds = S.kinds(V(key), RICH), r = stream(seed, 'kind'), h = mt.x, mid = base - h / 2, k = kinds[(r() * kinds.length) | 0];
    // the room below the line for a filler that swings under it: down to the next line's top over the gap (the filler
    // is drawn at unit size and scaled about its middle, so the room is handed over in its own units)
    const next = Math.min(o.height - base, ...TEXT.filter(b => b.t > base + 1 && b.l < x1 + fs && b.r > x0 - fs).map(b => b.t - base));
    const dip = Math.max(0, (next - 2 + h / 2) / SCALE - h / 2);
    const make = v => scaled(S.filler(x0, x0 + (x1 - x0) / SCALE, mid - h / 2, mid + h / 2, k, seed, RICH, { ...V(key), ...v }), x0, mid, SCALE);
    // redo: kept to its band; and if a larger ornament scale still will not fit, at its own size
    marks.push({ el, style: key, y: base, a: col, kind: 'filler', marks: make({ dip }), redo: [() => make({ dip: 0, tight: true }), () => S.filler(x0, x1, mid - h / 2, mid + h / 2, k, seed, RICH, { ...V(key), dip: 0, tight: true })] }); nFill++;
  };
  // a break at unit size about its centre, then scaled; a flush-left style keeps its left edge on the measure
  // index: the part's real number (a card's numeral)
  const brk = (el, cx, y, measure, rank, seed, index) => { const key = styleAt(el), S = G(key), SCALE = scaleAt(el), uw = fs * metricOf(FONT(400, 20)).x / 20;
    const L = S.breakMark(cx, y, measure / SCALE, rank, seed, richAt(el), uw, index ? { ...V(key), index } : V(key)); return scaled(L, S.flush ? cx - measure / 2 : cx, y, SCALE, S.flush ? cx - measure / (2 * SCALE) : cx); };
  const head = el => el.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
  const paraph = (p, k, seed) => { const key = styleAt(p), cs = getComputedStyle(p), fs = parseFloat(cs.fontSize), mt = metricOf(FONT(400, fs)), L = boxes(p, o, sel); if (!L.length) return;
    const pr = p.getBoundingClientRect(), x = pr.left - o.left + fs * .32, base = L[0].t + mt.asc;
    marks.push({ el: p, style: key, y: base, a: pairAt(k, key), kind: 'paraph', ax: x, ay: base, marks: scaled(G(key).paraph(x, base, mt.x, seed, richAt(p), V(key)), x, base, scaleAt(p)) }); };
  const books = [...root.querySelectorAll(sel.book)], loose = [...root.querySelectorAll(sel.chapter)].filter(ch => !ch.closest(sel.book));
  [...books, ...(loose.length ? [null] : [])].forEach((book, bi) => {
    const h2 = book && head(book);
    // the break above the book's head, in the room its padding leaves; the first book is opened by the title, so it
    // takes the device too: the same rank
    if (h2) { const hr = h2.getBoundingClientRect(), br = book.getBoundingClientRect(), cx = (hr.left + hr.right) / 2 - o.left, y = (br.top + hr.top) / 2 - o.top;
      marks.push({ el: book, style: styleAt(book), y: br.top - o.top, a: pairAt(bi + 1, styleAt(book)), kind: 'book', ax: cx, ay: y, marks: brk(book, cx, y, hr.width, 2, SEED + 101 * bi, bi + 1) }); }
    (book ? [...book.querySelectorAll(sel.chapter)] : loose).forEach((ch, ci) => {
      const h3 = head(ch), cr = ch.getBoundingClientRect(), key = styleAt(ch);
      if (h3) { const h3r = h3.getBoundingClientRect(), cx = (h3r.left + h3r.right) / 2 - o.left, y = (cr.top + h3r.top) / 2 - o.top + 2;
        if (ci > 0) marks.push({ el: ch, style: key, y: cr.top - o.top, a: pairAt(ci + 1, key), kind: 'chapter', ax: cx, ay: y, marks: brk(ch, cx, y, h3r.width, 1, SEED + 101 * bi + 7 * ci, ci + 1) });
        fillAfter(h3, pairAt(1, key), SEED + 31 * bi + 3 * ci); }
      // the paragraphs: a paraph in each one's indent but the first (red and blue in turn, starting again each chapter),
      // a filler after every one; a paragraph opened by an initial takes no paraph
      [...ch.querySelectorAll(':scope > p')].filter(p => !p.matches(sel.pull)).forEach((p, pi) => {
        if (pi > 0 && !p.querySelector(sel.initial)) paraph(p, pi, SEED + 997 * bi + 89 * ci + pi);
        fillAfter(p, pairAt(nFill, styleAt(p)), SEED + 1009 * bi + 113 * ci + 17 * pi);
      });
    });
  });
  // outside the chapters, by markup alone
  root.querySelectorAll(sel.paraph).forEach((p, k) => { if (!p.closest(sel.chapter)) paraph(p, k + 1, SEED + 503 * k); });
  root.querySelectorAll(sel.filler).forEach((el, k) => { if (!el.closest(sel.chapter)) fillAfter(el, pairAt(nFill, styleAt(el)), SEED + 607 * k); });
  root.querySelectorAll(sel.break).forEach((el, k) => { const b = rel(el, o), rank = +el.dataset.rank || 1, cx = (b[0] + b[2]) / 2, y = (b[1] + b[3]) / 2;
    marks.push({ el, style: styleAt(el), y: b[1], a: pairAt(rank, styleAt(el)), kind: rank > 1 ? 'book' : 'chapter', ax: cx, ay: y, marks: brk(el, cx, y, b[2] - b[0], rank, SEED + 211 * k) }); });

  // the guard: after scaling, a stroke or point that would touch a word's box is not drawn (a flourish gives way)
  for (const m of marks) {
    m.line = true;
    // a paraph is never broken: if it would touch a word it is drawn smaller about its foot until it does not
    // and a break likewise about its centre (cut, its pieces would no longer meet)
    if (m.ax !== undefined) for (let f = .92; m.marks.some(hits) && f > .4; f -= .08) m.marks = m.marks.map(s => { const g2 = ([x, y]) => [m.ax + (x - m.ax) * .92, m.ay + (y - m.ay) * .92];
      return s.dot ? { ...s, p: g2(s.p), r: s.r * .92 } : { ...s, pts: s.pts.map(g2), w: Math.max(.32, s.w * .92) }; });
    // a filler that would touch a word is made again kept to its band (no swing above or below), before anything is cut
    for (const again of m.redo ?? []) if (m.marks.some(hits)) m.marks = again();
    if (m.redo && m.marks.some(hits)) { m.marks = []; (dropped.filler ??= [0, 0])[1]++; continue; }   // still touching: no filler rather than a broken one
    const n0 = m.marks.length; m.marks = m.marks.filter(s => !hits(s)); if (m.marks.length < n0) (dropped[m.kind] ??= [0, 0])[m.marks.length ? 0 : 1]++; }
  out.push(...marks);
  // reading order; the frames' colours alternate down the page, the first in the second colour (07)
  out.sort((x, y) => x.y - y.y);
  let n = 0; for (const it of out) if (!it.letter && !it.line) { const P = STYLES[it.style].pair; it.a = P[(n++ + 1) % P.length]; }
  return { items: out, words, dropped };
}
const resampleLine = (p, ds) => { const out = [p[0]]; for (let i = 1; i < p.length; i++) { const a = p[i - 1], b = p[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.ceil(L / ds);
  for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } return out; };

// ?specimen: the style as a pattern book: twenty fillers of different lengths and twelve paraphs, all from one copy's
// grammar, so the variation within the style can be seen at once (the text is hidden, not changed); and its breaks
function specimen(c) {
  const key = c.style, S = c.gram[key] ??= grammar(STYLES[key]), V = c.setups[key] ??= S.setup(c.SEED), SCALE = c.scale, RICH = c.rich, SEED = c.SEED, out = [], r = stream(SEED, 'spec'), x0 = 40, y0 = 60;
  const kinds = c.kind ? [c.kind] : S.kinds(V, RICH), it = (y, a, kind, marks) => ({ y, a, kind, style: key, line: true, marks });
  for (let k = 0; k < 20; k++) { const w = 60 + r() * 200, y = y0 + k * 30;
    out.push(it(y, S.pair[k % 2] ?? S.pair[0], 'filler', scaled(S.filler(x0, x0 + w / SCALE, y - 8, y, kinds[k % kinds.length], SEED + 977 * k, RICH, V), x0, y - 4, SCALE))); }
  for (let k = 0; k < 12; k++) { const x = 400 + (k % 4) * 52, y = y0 + 12 + Math.floor(k / 4) * 46;   // a tidy grid of four by three
    out.push(it(y, S.alternate ? S.pair[k % 2] : S.pair[0], 'paraph', scaled(S.paraph(x, y, 8, SEED + 131 * k, RICH, V), x, y, SCALE))); }
  const brk = (cx, y, m, rank, seed) => scaled(S.breakMark(cx, y, m / SCALE, rank, seed, RICH, 8, V), cx, y, SCALE);
  out.push(it(0, S.pair[0], 'chapter', brk(500, y0 + 230, 360, 1, SEED + 5)), it(0, S.pair[1] ?? S.pair[0], 'book', brk(500, y0 + 360, 420, 2, SEED + 9)));
  return out.sort((a, b) => a.y - b.y);
}

// ---- the score ------------------------------------------------------------------------------------------------------------------
// Each mark becomes a part of the score, { t0, t1, at(g, f), done(g) }: shown part-way on the live layer while it is
// being written, laid on the page once finished. Down the page as the rubricator went, each mark at a hand's pace; an
// ornament is a group (read mode writes a group when its line comes up). With the medium, an ornament's hairlines are
// written by the quill (one part per ink, in turn) after its laid strokes and before its points.
const blended = (g, mode, f) => { if (!mode) return f(); g.save(); g.globalCompositeOperation = mode; f(); g.restore(); };
function stem(t0, t1, pts, o) {
  const S = [0]; for (let i = 1; i < pts.length; i++) S.push(S[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const upTo = f => { const L = f * S[S.length - 1]; let i = 1; while (i < S.length - 1 && S[i] < L) i++;
    const u = (L - S[i - 1]) / ((S[i] - S[i - 1]) || 1), a = pts[i - 1], b = pts[i]; return [...pts.slice(0, i), [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]]; };
  const { live = 'taper', blend, ...po } = o;
  return { t0, t1, at: (g, f) => { const p = upTo(f); if (p.length > 1 && S[S.length - 1] * f > .6) blended(g, blend, () => pen(g, p, { ...po, end: live })); }, done: g => blended(g, blend, () => pen(g, pts, po)) };
}
// a letter laid flat in one colour, from its coverage
function flat(g, L, rgb, dx = 0, dy = 0) {
  const c = new OffscreenCanvas(L.w, L.h), k = c.getContext('2d'), img = k.createImageData(L.w, L.h);
  for (let i = 0; i < L.w * L.h; i++) { img.data.set(rgb, i * 4); img.data[i * 4 + 3] = Math.round(Math.min(1, L.M[i]) * 255); }
  k.putImageData(img, 0, 0); g.drawImage(c, L.x0 + dx, L.y0 + dy, L.w / L.res, L.h / L.res);
}
// the letter, painted once into its own canvas at the page's resolution and laid by a sweep from the top (03)
function wiped(t0, t1, paint, [x, y, w, h], dpr, before) {
  let cv = null; const img = () => cv ??= (() => { const c = new OffscreenCanvas(Math.ceil(w * dpr), Math.ceil(h * dpr)), k = c.getContext('2d'); k.setTransform(dpr, 0, 0, dpr, -x * dpr, -y * dpr); paint(k); return c; })();
  const cx = x + w / 2, cy = y + h / 2, R = Math.hypot(w, h) / 2, dir = [0, 1], n = [-dir[1], dir[0]];
  return { t0, t1, make: img, done: g => { before(); g.drawImage(img(), x, y, w, h); },
    at: (g, f) => { const e = 1 - (1 - f) ** 2, d = -R + 2 * R * e; g.save(); g.beginPath();
      g.moveTo(cx - dir[0] * R - n[0] * R, cy - dir[1] * R - n[1] * R); g.lineTo(cx + dir[0] * d - n[0] * R, cy + dir[1] * d - n[1] * R);
      g.lineTo(cx + dir[0] * d + n[0] * R, cy + dir[1] * d + n[1] * R); g.lineTo(cx - dir[0] * R + n[0] * R, cy - dir[1] * R + n[1] * R); g.closePath();
      g.clip(); g.drawImage(img(), x, y, w, h); g.restore(); } };
}
function score(items, c) {
  const { SEED, PAPER, DARK, dpr, W } = c, parts = [], groups = [], drawn = [], hand = { open: null }; let clock = .3, li = 0;
  // a part written by the medium: never two at once (the window would move under the first), so a part that begins
  // finishes the one still open
  const written = (t0, t1, strokes, ink) => { const wp = W.part(t0, t1, strokes, ink, { width: 1.45 / 1.15, hair: 1.4 / 1.15 }); let fin = false;
    const take = () => { if (hand.open && hand.open !== me) hand.open.done(); hand.open = me; };
    const me = { t0, t1, at: (g, f) => { if (fin) return; take(); wp.at(f); }, done: () => { if (fin) return; take(); wp.done(); fin = true; hand.open = null; } };
    return me; };
  items.forEach((it, idx) => {
    const g0 = clock, from = parts.length, S = STYLES[it.style], P = paletteOf(S, c.mode, c.own), BLEND = DARK ? S.blendDark ?? (S.blend === 'multiply' ? 'screen' : S.blend) : S.blend;
    const other = col => { const [a, b] = S.pair; return col === a ? b ?? a : a; }, mi = it.line ? li++ : -1;
    const inkOf = s => { const col = s.col === 'g' ? 'gold' : s.col === 'k' ? 'black' : s.col === 'f' ? 'flesh' : s.col === 'a' ? it.a : other(it.a); return P[col] ?? P[S.pair[0]]; };
    const isLine = s => W && !s.dot && !s.press && !s.plate && !BLEND && (s.load ?? .85) < 1 && !(s.broad >= .5), later = [], quill = new Map();
    const mark = (s, i, list) => {
      const INK = inkOf(s), solid = s.ink ? (DARK ? lift(s.ink) : s.ink) : INK.solid;
      if (s.dot) { drawn.push({ mi: idx, type: it.kind, dot: s.p, r: s.r, free: s.free, plate: s.plate | 0 });
        const make = t => ({ t0: t, t1: t + .03, at: () => {}, done: g => blended(g, BLEND, () => dot(g, s.p, s.r, solid, PAPER, .95, DARK)) });
        if (W) later.push(make); else { parts.push(make(clock)); clock += .03; } return; }
      // a wayfinding mark (made at unit size) is refined and its free ends lifted; a frame or an initial is drawn as made
      const pts = it.line ? refine(s.pts) : s.pts, ends = it.line ? freeEnds(s, list) : s, w = s.w * (s.broad ? 1 : 1.1);
      const seed = it.line ? (SEED + mi * 131 + i * 7) >>> 0 : it.letter ? s.seed ?? (SEED + idx * 131 + i * 7) >>> 0 : (SEED + i * 13) >>> 0;
      drawn.push({ mi: idx, type: it.kind, pts, w, ends: [pts[0], pts.at(-1)], cap: [ends.start, ends.end], plate: s.plate | 0, free: s.free, solid: (s.load ?? .85) >= 1 || s.broad >= .5 || !!s.press });
      const ink = s.ink ? solid : s.broad ? INK.solid : INK.hair;
      if (isLine(s)) { const k = ink.join(); quill.has(k) || quill.set(k, { ink, strokes: [] }); quill.get(k).strokes.push({ pts, w, rho: s.rho });
        // the quill lifts clean, so a curl's finishing ball is set down after it, as the stamped pen makes it (03's
        // penwork, approved without, keeps its own points)
        if (!it.letter) for (const [e, q] of [[ends.start, pts[0]], [ends.end, pts.at(-1)]]) if (e === 'ball') { const r = Math.max(1.05, w * (.75 + .5 * stream(seed, 'ball')()));
          later.push(t => ({ t0: t, t1: t + .03, at: () => {}, done: g => dot(g, q, r, ink, PAPER, 1.3, DARK) })); }
        return; }
      const o = { w, ink, paper: PAPER, dark: DARK, blend: BLEND, seed, start: ends.start, end: ends.end, load: s.load ?? .85, dry: s.dry ?? .3, broad: s.broad ?? .3, swell: s.swell ?? .25, nib: s.nib ?? .55, press: s.press };
      const d = Math.max(.05, arclen(pts) / (s.broad ? 70 : 260)); parts.push({ ...stem(clock, clock + d, pts, { ...o, live: 'cut' }) }); clock += d * .8;
    };
    (it.ground ?? []).forEach((s, i, l) => mark(s, i, l));
    // the quill's ink: on a light ground as it multiplies into the paper (as 03 was approved: the medium's sheet laid
    // over the page in multiply), so ink laid as colour and opacity comes out the same; on a dark ground its own colour
    const flushQuill = () => { for (const { ink, strokes } of quill.values()) { const d = strokes.reduce((a, s) => a + arclen(s.pts) / 300, 0) * .75 + strokes.length * .05; parts.push(written(clock, clock + d, strokes, DARK ? ink : ink.map((v, j) => Math.round(v * PAPER[j] / 255)))); clock += d; } quill.clear();
      for (const make of later) { parts.push(make(clock)); clock += .03; } later.length = 0; };
    if (it.letter) { flushQuill(); const L = it.letter, M = L.M, pad = L.outline || L.ghost ? 3 : 0, box = [M.x0 - pad, M.y0 - pad, M.w / M.res + pad * 2, M.h / M.res + pad * 2];
      // a brushed letter is laid subtractively, which on a dark ground would sink to black: there it is laid flat, lifted
      const col = k => inkOf({ col: k }).solid, paint = k => {
        if (L.pigment && DARK) flat(k, M, lift(PIGMENTS[L.pigment].rgb));
        else if (L.pigment) paintField(k, M.M, M.x0, M.y0, M.w, M.h, L.pigment, { dpr: M.res, seed: it.seed ?? SEED, strength: 1 });
        else { if (L.ghost) flat(k, M, col(L.ghost.col), ...L.ghost.off);
          if (L.outline) for (let j = 0; j < 8; j++) flat(k, M, col(L.outline.col), Math.cos(j * Math.PI / 4) * L.outline.w, Math.sin(j * Math.PI / 4) * L.outline.w);
          flat(k, M, col(L.col)); } };
      parts.push(wiped(clock, clock + 1.1, paint, box, dpr, () => W?.flush())); clock += 1.4; }
    it.marks.forEach((s, i, l) => mark(s, i, l));
    flushQuill();
    if (it.letter) clock += .4;
    // as you read, no ornament keeps the reader waiting: the hand goes faster on a long one (3 s; 8 s for an initial)
    const own = parts.slice(from), len = Math.max(.1, ...own.map(p => p.t1 - g0)), kg = Math.min(1, (it.letter ? 8 : 3) / len);
    groups.push({ y: it.y, type: it.kind, parts: own.map(p => ({ ...p, t0: (p.t0 - g0) * kg, t1: (p.t1 - g0) * kg })) });
  });
  // the whole book is rubricated, compressed to ~14 s
  let end = Math.max(.1, ...parts.map(p => p.t1)); const k = Math.min(1, 14 / end);
  if (k < 1) { parts.forEach(p => { p.t0 *= k; p.t1 *= k; }); end *= k; }
  return { parts, end, groups, drawn };
}

// ---- rubricate ----------------------------------------------------------------------------------------------------------------
export function rubricate(root, opts = {}) {
  const host = opts.host ?? root.offsetParent ?? root, ds = root.dataset, still = matchMedia('(prefers-reduced-motion: reduce)');
  let o = { style: ds.style ?? 'gothic', rich: ds.rich ?? .5, scale: ds.scale ?? 1, theme: 'auto', draw: ds.draw ?? 'still', ink: ds.ink ?? 'medium', ...opts };
  const text = root.textContent.replace(/\s+/g, ' ').trim(), gram = {};
  const layer = () => { const c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true'); Object.assign(c.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none' }); return c; };
  const base = layer(), live = layer(); host.prepend(base, live);
  let raf = 0, io = null, sentinels = [], readDone = new Set(), W = null, mode = null, state = {}, alive = true;
  const themeMode = () => o.theme !== 'auto' ? o.theme : document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  function compose() {
    const key = STYLES[o.style] ? o.style : 'gothic', sel = { ...SELECT, ...o.select }, SEED = (o.seed ?? fnv(text) % 1e7) >>> 0, scale = Math.max(.5, Math.min(2, +o.scale || 1)), rich = Math.max(0, Math.min(1, +o.rich || 0));
    const tm = themeMode(), own = o.ground === 'style' && !!STYLES[key].theme?.dark, DARK = own || tm === 'dark', setups = {};
    const pv = getComputedStyle(root).getPropertyValue('--paper'), PAPER = pv ? cssRgb(pv) : DARK ? [29, 26, 23] : [244, 238, 226];
    root.style.setProperty('--orn', scale);
    root.style.visibility = o.view ? 'hidden' : '';
    if (!o.view) setInitials(root, { style: key, rich, select: sel });
    const sr = host.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    for (const c of [base, live]) { c.width = Math.round(sr.width * dpr); c.height = Math.round(sr.height * dpr); c.style.width = sr.width + 'px'; c.style.height = sr.height + 'px'; c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0); }
    W?.destroy(); W = o.ink !== 'pen' && supported() ? createWriter(host, base.getContext('2d'), { dpr, dark: DARK }) : null;
    const c = { SEED, sel, style: key, rich, scale, gram, setups, kind: o.kind, mode: tm, own, DARK, PAPER, dpr, W };
    const t0 = performance.now(), w = o.view === 'specimen' ? { items: specimen(c), words: [], dropped: {} } : walk(root, host, c);
    const sc = score(w.items, c);
    state = { ...w, ...sc, scale, sr, grow: performance.now() - t0, seed: SEED };
    return sc;
  }
  function render(m) {
    cancelAnimationFrame(raf); io?.disconnect(); sentinels.forEach(n => n.remove()); sentinels = []; if (!alive) return;
    if (o.view === 'sweep') return sweep();
    mode = still.matches ? 'still' : m;
    const sc = compose(), g = base.getContext('2d'), lv = live.getContext('2d');
    const clear = () => { lv.save(); lv.setTransform(1, 0, 0, 1, 0, 0); lv.clearRect(0, 0, live.width, live.height); lv.restore(); };
    if (mode !== 'still') sc.parts.forEach(p => p.make?.());   // the letters painted before the hand starts, not in a frame
    if (mode === 'read') return read(sc, g, lv, clear);
    if (mode !== 'now') { const t1 = performance.now(); sc.parts.forEach(p => p.done(g)); W?.flush(); state.draw = performance.now() - t1;
      return o.on?.('drawn', { grow: Math.round(state.grow), draw: Math.round(state.draw) }); }
    const start = performance.now(), fin = new Uint8Array(sc.parts.length);
    const tick = () => { const now = (performance.now() - start) / 1000; clear();
      sc.parts.forEach((p, i) => { if (fin[i]) return; if (now >= p.t1) { p.done(g); fin[i] = 1; } else if (now > p.t0) p.at(lv, (now - p.t0) / (p.t1 - p.t0)); });
      if (now < sc.end + .05) raf = requestAnimationFrame(tick); else { W?.flush(); o.on?.('drawn'); } };
    raf = requestAnimationFrame(tick);
  }
  // As you read: each ornament is its own small score, unwritten until its line comes up into the reading window (an
  // IntersectionObserver on a sentinel at that line, firing 15% into the viewport from the bottom). One hand writes them
  // in reading order, a short stagger between; an ornament scrolled past before its turn is written fast, or at once if
  // it is far above; nothing runs when nothing is being written. On relayout the finished ones are laid down at once and
  // the rest wait again.
  function read(sc, base, live, clear) {
    const groups = sc.groups, queue = [], active = [];
    groups.forEach((gr, i) => { if (readDone.has(i)) { gr.parts.forEach(p => p.done(base)); gr.state = 'done'; return; }
      const n = document.createElement('i'); n.setAttribute('aria-hidden', 'true'); n.dataset.g = i;
      Object.assign(n.style, { position: 'absolute', left: '0', top: Math.max(0, gr.y - 4) + 'px', width: '1px', height: '8px', pointerEvents: 'none' });
      host.append(n); sentinels.push(n); gr.state = 'waiting'; });
    W?.flush();
    let running = false, handFree = 0, firstBatch = true; state.frames = [];
    const kick = () => { if (!running) { running = true; raf = requestAnimationFrame(tick); } };
    const begin = (gr, now) => {   // its turn: start after the hand finishes the last one, a little overlapped
      const r = host.getBoundingClientRect(), y = r.top + gr.y, far = y < -innerHeight, past = y < innerHeight * .1;
      const len = Math.max(...gr.parts.map(p => p.t1)), behind = (handFree - now) / 1000;
      // what was in view on load is written at its pace; no long backlog: behind the reader, the hand hurries
      const speed = far || (!gr.initial && behind > 3) ? 0 : past || (!gr.initial && behind > 1.2) ? Math.min(1, .25 / len) : 1;
      gr.start = Math.max(now, handFree); gr.speed = speed; handFree = gr.start + (speed ? len * speed * 1000 * .7 + 120 : 0); gr.state = 'writing'; active.push(gr); };
    const tick = () => { const now = performance.now();
      while (queue.length) begin(queue.shift(), now);
      clear();
      for (let k = 0; k < active.length; k++) { const gr = active[k], t = gr.speed ? (now - gr.start) / 1000 / gr.speed : 1e9; if (t < 0) continue;
        gr.fin ??= new Uint8Array(gr.parts.length);
        gr.parts.forEach((p, i) => { if (gr.fin[i]) return; if (t >= p.t1) { p.done(base); gr.fin[i] = 1; } else if (t > p.t0) p.at(live, (t - p.t0) / (p.t1 - p.t0)); });
        if (gr.fin.every(Boolean)) { gr.state = 'done'; readDone.add(groups.indexOf(gr)); active.splice(k--, 1); } }
      if (state.frames.length < 2000) state.frames.push(performance.now() - now);
      if (active.length || queue.length) raf = requestAnimationFrame(tick);
      else { running = false; W?.flush(); if (groups.every(g => g.state === 'done')) o.on?.('written'); }
    };
    io = new IntersectionObserver(es => { es.filter(e => e.isIntersecting).map(e => groups[+e.target.dataset.g]).sort((a, b) => a.y - b.y)
        .forEach(gr => { if (gr.state === 'waiting') { gr.state = 'queued'; gr.initial = firstBatch; queue.push(gr); } }); firstBatch = false; es.forEach(e => e.isIntersecting && io.unobserve(e.target)); if (queue.length) kick(); },
      { rootMargin: '100000px 0px -15% 0px' });   // anything above the reading line counts as reached, so a fast scroll leaves no hole
    sentinels.forEach(n => io.observe(n));
    o.on?.('reading');
  }
  // every style's paraph across thirty seeds, one row a style, to look for unfortunate shapes
  function sweep() {
    root.style.visibility = 'hidden'; const o_ = host.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1), tm = themeMode(), DARK = tm === 'dark';
    base.width = Math.round(o_.width * dpr); base.height = Math.round(o_.height * dpr); base.style.width = o_.width + 'px'; base.style.height = o_.height + 'px';
    const g = base.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); const pv = getComputedStyle(root).getPropertyValue('--paper'), paper = pv ? cssRgb(pv) : [244, 238, 226], rich = +o.rich;
    Object.keys(STYLES).forEach((key, row) => { const GS = grammar(STYLES[key]), P = paletteOf(STYLES[key], tm);
      for (let i = 0; i < 30; i++) { const seed = 1000 + i * 7919, V = GS.setup(seed), x = 28 + i * 28, base = 30 + row * 40 + 28, a = GS.alternate ? GS.pair[i % 2] : GS.pair[0];
        for (const m of GS.paraph(x, base, 8, seed + 89, rich, V)) { const col = m.col === 'g' ? 'gold' : m.col === 'k' ? 'black' : m.col === 'f' ? 'flesh' : m.col === 'a' ? a : (GS.pair[0] === a ? GS.pair[1] : GS.pair[0]), INK = P[col] ?? P[GS.pair[0]];
          blended(g, DARK ? GS.blendDark ?? (GS.blend ? 'screen' : null) : GS.blend, () => m.dot ? dot(g, m.p, m.r, INK.solid, paper, .95, DARK) : pen(g, refine(m.pts), { dark: DARK, w: m.w * (m.broad ? 1 : 1.1), ink: m.broad ? INK.solid : INK.hair, paper, seed: seed + 3, start: m.start, end: m.end, load: m.load ?? .85, dry: m.dry ?? .3, broad: m.broad ?? .3, swell: m.swell ?? .25, nib: m.nib ?? .55, press: m.press })); } } });
    o.on?.('sweep');
  }

  // relayout: a change of width redraws (the finished marks of a reading kept); a change of the reader's scheme too
  let lastW = host.clientWidth, timer;
  const again = () => render(mode === 'read' ? 'read' : 'still');
  const ro = new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(() => { if (host.clientWidth !== lastW) { lastW = host.clientWidth; again(); } }, 150); }); ro.observe(host);
  const mq = matchMedia('(prefers-color-scheme: dark)'), onScheme = () => { if (o.theme === 'auto' && !document.documentElement.dataset.theme) again(); }; mq.addEventListener('change', onScheme);
  document.fonts.ready.then(() => render(o.draw));
  return {
    // new options redraw at once; a new `draw` starts the writing over, anything else keeps what a reading has written
    redraw(n = {}) { o = { ...o, ...n }; if (n.draw) { readDone.clear(); render(n.draw); } else again(); },
    destroy() { alive = false; cancelAnimationFrame(raf); io?.disconnect(); ro.disconnect(); mq.removeEventListener('change', onScheme); sentinels.forEach(n => n.remove()); W?.destroy(); base.remove(); live.remove(); },
    get state() { return state; }, get options() { return o; },
  };
}
export { STYLES, grammar };
