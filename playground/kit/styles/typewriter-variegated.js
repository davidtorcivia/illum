// Variegated typewriting: the office typist's two-colour ribbon (research/27-typewriter.md, stages 1 and 2).
// Black for text, red for emphasis (Pitman, 1897), and the typist's own display: the rank ladder (Walker 2017), leaders,
// the dash rule, the caption's column of colons with its star (the Utah complaint of 1886, tests/typewriter-refs), and
// for the end of a part, nested squares typed from the heading's word (Houédard's Sonic Water, 1964). Every mark is
// typed on the machine's lattice: a cell 0.6 em wide, the half-space key, the platen's half and quarter rows.
//   initial  the capital reserved as paper in a typed field, three ways (c.drop, else the seed's; see DROPS below)
//   paraph   the pilcrow in red, struck once or twice
//   filler   the leader to the margin, a typed line (- = _ or -=: the machine's, by the budget; never points)
//   run-out  the heading's underscore carried to the margin in red, once or twice, or an = rule
//   breaks   1 three or five stars, the middle red; 2 the dash rule with a red star; 3 nested squares typed from the
//            heading's word, red and black rings about a red cross-in-circle
//   quote    the caption: a bar a line in red, a black star at the middle line
// Each returns a piece for typewriter-machine.js: { W, H, em, lh, strikes, mask?, stencil? } in its own CSS px.
import { rngOf } from './typewriter-machine.js';

const cellW = em => .6 * em;
const at = (ch, x, y, col = 'k', o = {}) => ({ ch, x, y, col, ...o });
export const NAME = 'Variegated typewriting';
export const NOTE = 'The office typist’s two-colour ribbon as rubrication: black for text, red for emphasis (Pitman’s “variegated typewriting”, 1897), and the typist’s own display: the rank ladder of the typing manuals, the leader, the dash rule, and a legal caption’s column of colons with its star (a Salt Lake City complaint, 1886). Drop: the capital reserved as paper in a typed field (a card laid on the sheet), the field typed three ways (the seed picks one), below. Paraph: the pilcrow in red. Filler: the leader to the margin. Run-out: the heading’s underscore carried to the margin in red. Breaks: stars; the dash rule with a red star; nested squares typed from the heading’s word. Quotation: the caption’s colon column. The seed sets the machine (every key’s faults, the ribbon’s load) and every one of the typist’s choices.';

// the page's hand (the typist's choices, from the seed): one draw for every mark, so each seed changes each of them
export function hand(seed) { const r = rngOf(seed, 'variegated'), pick = a => a[r() * a.length | 0];
  return { quiet: pick(['=', '=', '-']), mix: pick([['=', '-'], ['-', '='], ['=', '=', '-'], ['=', '-', '-']]), lead: r(), bold: r() < .6 ? 2 : 1,
    run: pick(['_', '__', '=']), star: pick(['*', '*', 'x', '+']), stars: r() < .65 ? 3 : 5, dash: pick(['-', '-', '=', '_']), mid: pick(['*', 'x', '+']),
    rings: pick([5, 7, 9]), pu: r() < .45, outer: r() < .5 ? 'r' : 'k', col: (r(), '|'), mark: pick(['*', '*', 'x']), under: pick(['_', '_', '=', '-']) }; }

// a capital of the face (bold) sized so its cap height is cap px: its box at that size
const MC = {};
function capOf(family, ch, cap) {
  const g = MC.g ??= new OffscreenCanvas(4, 4).getContext('2d'); g.font = `700 100px "${family}"`;
  const H = g.measureText('H').actualBoundingBoxAscent, px = 100 * cap / H; g.font = `700 ${px}px "${family}"`; const m = g.measureText(ch);
  return { px, l: m.actualBoundingBoxLeft, w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent, hcap: H * px / 100 };
}

// The drop: the capital (Courier Prime Bold) reserved as paper in a typed field, a card laid on the sheet over the
// letter's shape while the field is typed, so its edge cuts the struck glyphs clean (the typing manuals' cut-outs). A
// key whose cell the card would all but cover is not struck (the typist sees the card and spaces over it), so the edge
// keeps no slivers of half-cut glyphs. One family, three fields; the page's machine (the seed) picks one, the richer
// page favouring the words:
//   words   the paragraph's own words typed on in red capitals, run together (as Sonic Water runs its letters), line
//           after line on even feeds just over a capital's height (no glyph overlaps the next), so the field is dense and
//           still reads as typing; a capital the card would mostly cover is not struck, so its edge keeps no fragments
//           (Houédard and Finlay reserved shapes in fields of text)
//   graded  a quiet key on the pitch grid over the field; the carriage returned for a second pass over its lower two
//           thirds a half space over (between the first pass's strikes), and a third on the grid over its lowest
//           third: darker toward the foot, the tone built rather than striped
//   tone    = and - a row each on quarter-line feeds, every other row a half space over: an even tone (no / to
//           hatch, no : or . to dot)
// (Tried and dropped: the contour typed in keys that run its way, a scatter of bars at drop size; underscores on
// sixth-line feeds, rules the owner did not want.)
export const DROPS = { words: 'the paragraph’s words typed as a field, the capital reserved', graded: 'a quiet field darkened toward the foot by extra passes', tone: 'quiet keys a row each, an even tone' };
export function dropOf(seed, rich = .5) { const R = rngOf(seed, 'drop'); R(); R(); const r = R(), w = 1 + 2 * rich;   // (the third draw: the first of a stream follows its seed too closely)
  return r < w / (w + 2) ? 'words' : r < (w + 1) / (w + 2) ? 'graded' : 'tone'; }
// the capital as the card covers it: coverage summed over areas (a summed-area table at 2 px a CSS px)
function cardOf(family, ch, cap, cx, by, W, H) {
  const R = 2, w = Math.ceil(W * R) + 1, h = Math.ceil(H * R) + 1, g = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true });
  g.scale(R, R); g.font = `700 ${cap.px}px "${family}"`; g.fillText(ch, cx, by);
  const A = g.getImageData(0, 0, w, h).data, S = new Float64Array((w + 1) * (h + 1));
  for (let j = 0; j < h; j++) { let row = 0; for (let i = 0; i < w; i++) { row += A[(j * w + i) * 4 + 3] / 255; S[(j + 1) * (w + 1) + i + 1] = S[j * (w + 1) + i + 1] + row; } }
  // the share of the box [x0, y0, x1, y1] (CSS px) the card covers
  return (x0, y0, x1, y1) => { const a = Math.max(0, Math.min(w, Math.round(x0 * R))), b = Math.max(0, Math.min(h, Math.round(y0 * R))), c = Math.max(0, Math.min(w, Math.round(x1 * R))), d = Math.max(0, Math.min(h, Math.round(y1 * R)));
    const n = (c - a) * (d - b); return n <= 0 ? 0 : (S[d * (w + 1) + c] - S[b * (w + 1) + c] - S[d * (w + 1) + a] + S[b * (w + 1) + a]) / n; };
}
// c.W, c.H: the box the host gives it (rubricate's float), else sized to the letter; c.ink: the ribbon ('r', or 'k' for a
// one-colour page); c.drop: the field, else the seed's (dropOf)
export function initial(ch, H, c) {
  const { em, lh, seed, family } = c, cw = cellW(em), hs = cw / 2, h = hand(seed), kind = DROPS[c.drop] ? c.drop : dropOf(seed, c.rich), ink = c.ink ?? 'r', strikes = [];
  H = c.H ?? H; const cap = capOf(family, ch, H * .84), cols = c.W ? Math.max(4, Math.floor(c.W / cw + .02)) : Math.max(5, Math.ceil((cap.w + 1.4 * cw) / cw)), W = cols * cw;
  // the rows: the first's glyph tops on the box's top, the last's feet on its foot
  const feed = kind === 'words' ? .66 * em : lh / 4, top = kind === 'words' ? .58 * em : .42 * em, rows = Math.max(5, Math.floor((H - top) / feed + .001) + 1);
  const Hf = Math.max(H, top + (rows - 1) * feed), cx = (W - cap.w) / 2 + cap.l, by = (H + cap.asc) / 2, card = cardOf(family, ch, cap, cx, by, W, Hf + em);
  // a key is struck unless the card covers nearly all of its glyph's place (it would leave only a sliver; the keys the
  // card cuts part way are what draw the letter's clean edge) (its cell, x-height to baseline for a quiet key)
  const strike = (k, x, y) => { const top = k >= 'A' && k <= 'Z' ? .58 * em : k >= 'a' && k <= 'z' ? .45 * em : .4 * em; if (card(x + .08 * cw, y - top, x + .92 * cw, y) < cut) strikes.push(at(k, x, y, ink)); }, cut = kind === 'words' ? .7 : .8;   // (a capital the card would mostly cover is left out: its fragment would read as a broken letter)
  if (kind === 'words') {
    const text = (c.words?.text ?? 'but our higher instincts are not deceived').toUpperCase().replace(/[^A-Z]/g, '') || 'TYPE';
    let k = 0; for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) strike(text[k++ % text.length], i * cw, top + r * feed);
  } else if (kind === 'graded') {
    // pass 1 on the pitch grid over the whole field; pass 2 a half space over, on its lower two thirds (between the
    // first pass's strikes); pass 3 on the grid again over its lowest third (on them: the darkest)
    const pass = [[0, 0], [hs, 1 / 3], [0, 2 / 3]];
    for (const [dx, from] of pass) for (let r = Math.floor(rows * from); r < rows; r++) for (let i = 0; i < cols - (dx ? 1 : 0); i++) strike(h.quiet, i * cw + dx, top + r * feed);
  } else {
    for (let r = 0; r < rows; r++) { const k = h.mix[r % h.mix.length]; for (let i = 0; i < cols - (r % 2 ? 1 : 0); i++) strike(k, i * cw + (r % 2 ? hs : 0), top + r * feed); }
  }
  return { W, H: Hf, em, lh, strikes, mask: g => { g.font = `700 ${cap.px}px "${family}"`; g.fillText(ch, cx, by); }, kind };
}

export function paraph(c) { const { em, lh, seed } = c, h = hand(seed), s = Array.from({ length: h.bold }, () => at('¶', 0, em * .95, 'r'));
  return { W: cellW(em), H: lh * .8, em, lh, strikes: s, base: em * .95 }; }

const LEADS = { 2: ['- ', '-', '_'], 3: ['-', '=', '_', '-='], 4: ['=', '-=', '_'] };
export function filler(gw, c) {
  // the leader reads as a line, never as a row of points: the machine's choice among the budget's keys (c.lv)
  const { em, lh, seed } = c, cw = cellW(em), n = Math.floor(gw / cw), h = hand(seed), strikes = [], set = LEADS[Math.max(2, Math.min(4, c.lv ?? 2))], L = set[Math.floor(h.lead * set.length)];
  for (let i = 0; i < n - 1; i++) { const k = L[(i + 1) % L.length]; if (k !== ' ') strikes.push(at(k, (i + 1) * cw, em * .8)); }
  return { W: n * cw, H: em, em, lh, strikes, base: em * .8 };
}

export function runout(w, c) {
  const { em, lh, seed } = c, cw = cellW(em), n = Math.floor(w / cw), strikes = [], h = hand(seed), k = h.run === '=' ? '=' : '_';
  for (let i = 0; i < n; i++) strikes.push(at(k, i * cw, em * .8, 'r'));
  if (h.run === '__') for (let i = 0; i < n; i++) strikes.push(at('_', i * cw, em * .8 + lh / 6, 'r'));   // (the platen turned a third of a half-row)
  return { W: n * cw, H: em * 1.1 + (h.run === '__' ? lh / 6 : 0), em, lh, strikes, base: em * .8 };
}

// square rings of letters on cells × half-rows: ring k typed from word[k], about a red cross-in-circle
function rings(word, cols, rows, c, outer) {
  const { em, lh } = c, cw = cellW(em), hr = lh / 2, out = [], inner = Math.min((cols - 1) / 2, (rows - 1) / 2);
  for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) { const k = Math.min(i, r, cols - 1 - i, rows - 1 - r); if (k >= inner - .01) continue;
    out.push(at(word[k % word.length], i * cw, em * .8 + r * hr, (k % 2 === 0) === (outer === 'r') ? 'r' : 'k')); }
  const i = (cols - 1) / 2, r = (rows - 1) / 2; out.push(at('o', i * cw, em * .8 + r * hr, 'r'), at('x', i * cw, em * .8 + r * hr, 'r'));
  return out;
}
const lettersOf = (s, f = 'type') => { const l = (s || f).toLowerCase().replace(/[^a-z]/g, ''); return l.length ? l : f; };

export function brk(rank, Wm, c) {
  const { em, lh, seed, words } = c, cw = cellW(em), hr = lh / 2, strikes = [], h = hand(seed);
  if (rank === 1) { const n = h.stars, gap = n === 3 ? 4 : 3; for (let k = 0; k < n; k++) strikes.push(at(h.star, k * gap * cw, em, k === (n - 1) / 2 ? 'r' : 'k')); return { W: ((n - 1) * gap + 1) * cw, H: em * 1.3, em, lh, strikes }; }
  if (rank === 2) { const n = 2 * Math.floor(Math.min(Wm * .42, 30 * cw) / cw / 2) + 1, mid = (n - 1) / 2;
    for (let i = 0; i < n; i += 2) if (Math.abs(i - mid) > 2) strikes.push(at(h.dash, i * cw, em)); strikes.push(at(h.mid, mid * cw, em, 'r'));
    return { W: n * cw, H: em * 1.3, em, lh, strikes }; }
  const rows = h.rings, cols = 2 * Math.round(rows * hr / cw / 2) + 1;
  return { W: cols * cw, H: em * .8 + (rows - 1) * hr + .3 * em, em, lh, strikes: rings(lettersOf(words?.head), cols, rows, c, h.outer) };
}

// the quotation: the caption's column, one colon (or bar) a line on the text's own lines, the star at the middle line
export function frame(w, hgt, c) {
  const { em, lh, seed } = c, h = hand(seed), n = Math.max(2, Math.round(hgt / lh)), mid = Math.floor((n - 1) / 2), strikes = [];
  for (let k = 0; k < n; k++) strikes.push(at(k === mid ? h.mark : h.col, 0, em * .95 + k * lh, k === mid ? 'k' : 'r'));
  return { W: cellW(em), H: n * lh, em, lh, strikes };
}
