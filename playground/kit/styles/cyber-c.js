// Cyber, direction C: THE PRINTOUT (a study; research/15-cyber.md). The paper a computer room gave back, 1960s–80s: the
// line printer's listing on continuous greenbar forms, the job's banner page, punched paper tape. Two media, honestly
// apart: the ribbon's ink, struck by a hammer through a cloth ribbon (laid by the ink engine, kit/inkletter.js: each
// character a little off its line, a little lighter or darker, heavier on the side the hammer hit), and the paper itself
// (tape, forms), cut and printed, drawn flat (the holes are holes: the page shows through them).
//   drop initial: the banner page's letter, 5 × 7 cells, each cell the letter itself, struck one print line at a time
//   paraph: the lone asterisk a listing's comment begins with (the 3211's six-armed star, its centre struck twice)
//   filler: a strip of five-level Teletype tape punched with the paragraph's last word (ITA2)
//   frame (pre): the greenbar form under the code: bands three lines deep with their edge rules, the sprocket margins
// Impact type: IBM Plex Mono Medium (OFL; IBM's own type, standing in for the print train's gothic).
const fnv = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.codePointAt(0), 16777619); return h >>> 0; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rng = (seed, name) => mulberry(fnv(name + ':' + seed));
const TAU = Math.PI * 2;
const FACE = { family: 'illum printout', file: 'IBMPlexMono-Medium.woff2' };
let loaded = false;
export async function loadFace() { if (loaded) return; const f = new FontFace(FACE.family, `url(${new URL('../../fonts/' + FACE.file, import.meta.url)})`); await f.load(); document.fonts.add(f); loaded = true; }

// ---- the strike ------------------------------------------------------------------------------------------------------------------
// Characters struck through the ribbon, as coverage for the ink engine: { M, w, h, x0, y0, res, col, order }.
// strikes: [{ ch, x, base, size, line }] (line: the print line it was struck on: the order the page is written in).
// Per character (research/15, the IBM 3211 listing): the baseline off by up to ±10 % of the cap height, the density
// 75–100 %, one side heavier (the hammer's face does not land flat), and the ribbon's weave in the ink (a fine cloth,
// ~0.7 px a thread, at 45°); the edge is the ink engine's own fuzz.
export function strike(strikes, { res = 2, seed = 1, col = 'k', drift = .1, weave = .22 } = {}) {
  const r = rng(seed, 'strike');
  let bb = [Infinity, Infinity, -Infinity, -Infinity];
  for (const s of strikes) bb = [Math.min(bb[0], s.x - s.size), Math.min(bb[1], s.base - s.size * 1.2), Math.max(bb[2], s.x + s.size * 1.2), Math.max(bb[3], s.base + s.size * .5)];
  const gx = Math.floor(bb[0]), gy = Math.floor(bb[1]), w = Math.ceil((bb[2] - gx) * res), h = Math.ceil((bb[3] - gy) * res);
  const M = new Float32Array(w * h), T = new Float32Array(w * h), c = new OffscreenCanvas(8, 8).getContext('2d', { willReadFrequently: true });
  const lines = Math.max(1, ...strikes.map(s => s.line ?? 0) ) + 1;
  for (const s of strikes) {
    const dy = (r() - .5) * 2 * drift * s.size * .72, dx = (r() - .5) * .08 * s.size, dens = .75 + r() * .25, side = r() < .5 ? -1 : 1, tilt = (r() - .5) * .03;
    const S = Math.ceil(s.size * 1.6 * res); c.canvas.width = c.canvas.height = S; c.clearRect(0, 0, S, S);
    c.setTransform(res, 0, 0, res, S / 2, S * .7); c.rotate(tilt); c.font = `500 ${s.size / .7}px "${FACE.family}"`; c.textAlign = 'center'; c.fillStyle = '#000';
    if (s.draw) s.draw(c, s.size); else c.fillText(s.ch, 0, 0);
    const d = c.getImageData(0, 0, S, S).data, ox = Math.round((s.x + dx - gx) * res - S / 2), oy = Math.round((s.base + dy - gy) * res - S * .7);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const a = d[(j * S + i) * 4 + 3] / 255; if (a < .02) continue;
      const X = ox + i, Y = oy + j; if (X < 0 || Y < 0 || X >= w || Y >= h) continue; const q = Y * w + X;
      const px = (X / res + gx), py = (Y / res + gy), wv = 1 - weave * (.5 + .5 * Math.sin((px + py) * TAU / 1) * Math.sin((px - py) * TAU / 1.4));
      const hammer = 1 - .22 * Math.max(0, side * (i / S - .5) * 2);
      M[q] = Math.min(1, M[q] + a * dens * wv * hammer); T[q] = ((s.line ?? 0) + (i / S) * .05 + (s.x - bb[0]) / (bb[2] - bb[0]) * .9) / lines; } }
  const ink = []; for (let q = 0; q < w * h; q++) if (M[q] > .01) ink.push(q); ink.sort((a, b) => T[a] - T[b]);
  return { M, w, h, x0: gx, y0: gy, res, col, order: { T, order: Int32Array.from(ink) }, wet: .05, dry: .4 };
}

// ---- the drop initial: the banner letter ---------------------------------------------------------------------------------------
// The job's banner page (VAX/VMS, 1991; research/15): a letter 5 cells wide and 7 tall, each cell the letter itself, the
// strokes one character thick, the round corners left empty; cells square (10 characters to the inch, 6 lines... of a
// printer set to square them). Struck one print line at a time, top to bottom.
const BANNER = {
  A: ['.AAA.', 'A...A', 'A...A', 'AAAAA', 'A...A', 'A...A', 'A...A'], B: ['BBBB.', 'B...B', 'B...B', 'BBBB.', 'B...B', 'B...B', 'BBBB.'],
  C: ['.CCC.', 'C...C', 'C....', 'C....', 'C....', 'C...C', '.CCC.'], D: ['DDDD.', 'D...D', 'D...D', 'D...D', 'D...D', 'D...D', 'DDDD.'],
  L: ['L....', 'L....', 'L....', 'L....', 'L....', 'L....', 'LLLLL'], T: ['TTTTT', '..T..', '..T..', '..T..', '..T..', '..T..', '..T..'],
  Y: ['Y...Y', 'Y...Y', '.Y.Y.', '..Y..', '..Y..', '..Y..', '..Y..'],
};
export function initial({ ch, G, seed = 1, res = 2 }) {
  const [x0, y0, x1, y1] = G.box, p = (y1 - y0) / 6.75, rows = BANNER[ch] ?? BANNER.B, size = p * .78, strikes = [];
  rows.forEach((row, j) => [...row].forEach((c, i) => { if (c !== '.') strikes.push({ ch: c, x: x0 + p * (i + .5), base: y0 + p * j + size * .98, size, line: j }); }));
  return { letters: [strike(strikes, { res, seed, drift: .07 })] };
}
initial.width = () => 5 / 6.75;
initial.lines = 4;

// ---- the paraph: the comment's asterisk ------------------------------------------------------------------------------------------
// The print train's asterisk: six arms (three bars through one centre), the centre struck darkest where the bars cross
export function paraph(x, base, u, seed, rich = .5, n = 1, res = 2) {
  const size = u * 1.5, star = (c, s) => { c.lineWidth = s * .16; c.lineCap = 'butt'; c.strokeStyle = '#000';
    for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + Math.PI / 2, r = s * .42; c.beginPath(); c.moveTo(Math.cos(a) * r, -s * .55 + Math.sin(a) * r); c.lineTo(-Math.cos(a) * r, -s * .55 - Math.sin(a) * r); c.stroke(); }
    c.beginPath(); c.arc(0, -s * .55, s * .13, 0, TAU); c.fill(); };
  return { letters: [strike([{ ch: '*', x: x + u * .85, base: base - u * .05, size, draw: star }], { res, seed, drift: .05 })] };
}

// ---- the filler: punched tape ------------------------------------------------------------------------------------------------------
// Five-level Teletype tape (11/16" wide, 0.1" a frame; data holes 0.072", feed holes 0.046"; research/15 measured the same
// pitch and holes on the 8-level), drawn at about half its size: the tape across the gap, punched with `word` in the
// Baudot–Murray code (ITA2, letters shift; track 1 at the top, the feed track between tracks 2 and 3), a leader of feed
// holes alone before and after. -> { tape: { x0, x1, y0, h, p, frames } }
const ITA2 = { A: '11000', B: '10011', C: '01110', D: '10010', E: '10000', F: '10110', G: '01011', H: '00101', I: '01100', J: '11010', K: '11110', L: '01001', M: '00111',
  N: '00110', O: '00011', P: '01101', Q: '11101', R: '01010', S: '10100', T: '00001', U: '11100', V: '01111', W: '11001', X: '10111', Y: '10101', Z: '10001' };
export function filler(x0, x1, yTop, yBase, word = 'STONES', seed = 1) {
  const u = yBase - yTop, p = u * .44, h = p * 6.875, n = Math.floor((x1 - x0) / p) - 1, y0 = yBase - u * .5 - h / 2, frames = [];
  const codes = [...word.toUpperCase()].filter(c => ITA2[c]).map(c => [...ITA2[c]].reduce((v, b, k) => v | (+b << k), 0));
  const lead = Math.max(2, Math.floor((n - codes.length) / 2));
  for (let i = 0; i < n; i++) frames.push(i >= lead && i < lead + codes.length ? codes[i - lead] : 0);
  return { tape: { x0, x1: x0 + (n + 1) * p, y0, h, p, frames, seed } };
}

// ---- the frame (code): greenbar ------------------------------------------------------------------------------------------------------
// The continuous form under a listing: bands three print lines deep, green and white by turns, a thin darker rule along each
// green band's edges; at each side a margin strip, a perforation, and the sprocket holes, one every three lines (half an
// inch at 6 lines to the inch), 0.34 of their pitch across. The bands fall on the code's own lines.
export function code({ box, lineH, top }) {
  return { form: { box, lineH, top } };
}
export const frames = { code };

// ---- laying the paper ----------------------------------------------------------------------------------------------------------------
export const palette = {
  // light: the ribbon's cool near-black (research/15: (41–52, 44–55, 49–60)) on the page; the tape manila; the bands the
  // listing's mint-grey (band / paper ≈ 0.88, 0.92, 0.88)
  light: { k: [44, 46, 52], tape: [230, 205, 126], tapeEdge: 'rgb(150 130 90 / .5)', band: [0.88, 0.92, 0.88], rule: 'rgb(120 150 112 / .45)', hole: 'rgb(70 60 50 / .09)', wall: 'rgb(70 60 50 / .35)' },
  // dark: the listing as the microfiche reader shows it (computer output on microfilm, read as a negative): pale type, the
  // bands a shade lighter than the ground; the tape a dim manila under the lamp
  dark: { k: [214, 222, 214], tape: [92, 84, 62], tapeEdge: 'rgb(0 0 0 / .5)', band: [1.22, 1.32, 1.2], rule: 'rgb(130 160 130 / .3)', hole: 'rgb(0 0 0 / .3)', wall: 'rgb(0 0 0 / .6)' },
};
// tape: drawn flat into the page's layer; its holes cut through (destination-out), so the page is what shows in them, with
// the punched wall's shade on the far edge
export function layTape(g, t, P) {
  const { x0, x1, y0, h, p, frames, seed } = t, r = rng(seed, 'tape'), m = (h - p * 5) / 2, feedY = y0 + m + p * 2, ys = k => y0 + m + p * (k < 2 ? k : k + 1);
  g.save(); g.fillStyle = `rgb(${P.tape})`;
  // the ends cut at an angle (as a tape is torn off at the punch's knife)
  g.beginPath(); g.moveTo(x0 + p * .8, y0); g.lineTo(x1, y0); g.lineTo(x1 - p * .8, y0 + h); g.lineTo(x0, y0 + h); g.closePath(); g.fill();
  g.strokeStyle = P.tapeEdge; g.lineWidth = .6; g.stroke();
  g.globalCompositeOperation = 'destination-out';
  frames.forEach((v, i) => { const x = x0 + p * (i + 1);
    g.beginPath(); g.arc(x, feedY, p * .23, 0, TAU); g.fill();
    for (let k = 0; k < 5; k++) if (v >> k & 1) { g.beginPath(); g.arc(x + (r() - .5) * p * .04, ys(k), p * .36, 0, TAU); g.fill(); } });
  g.globalCompositeOperation = 'source-over'; g.strokeStyle = P.tapeEdge; g.lineWidth = .5;
  frames.forEach((v, i) => { const x = x0 + p * (i + 1); for (let k = 0; k < 5; k++) if (v >> k & 1) { g.beginPath(); g.arc(x, ys(k), p * .36, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); } });
  g.restore();
}
export function layForm(g, f, P, ground) {
  const [X0, Y0, X1, Y1] = f.box, L = f.lineH, m = L * 1.5, band = `rgb(${ground.map((c, i) => Math.round(Math.min(255, c * P.band[i])))})`;
  g.save();
  // bands: every other three lines from the first print line, inside the margins
  for (let y = f.top, k = 0; y < Y1 - 2; y += L * 3, k++) if (k % 2 === 0) { const yb = Math.min(Y1, y + L * 3);
    g.fillStyle = band; g.fillRect(X0 + m, y, X1 - X0 - m * 2, yb - y);
    g.fillStyle = P.rule; g.fillRect(X0 + m, y, X1 - X0 - m * 2, .8); g.fillRect(X0 + m, yb - .8, X1 - X0 - m * 2, .8); }
  // the margin strips: a perforation (short cuts), and the holes every three lines, centred in the strip
  g.strokeStyle = P.rule; g.lineWidth = .7; g.setLineDash([2.2, 2.2]);
  for (const x of [X0 + m, X1 - m]) { g.beginPath(); g.moveTo(x, Y0); g.lineTo(x, Y1); g.stroke(); }
  g.setLineDash([]);
  for (let y = f.top + L * 1.5; y < Y1; y += L * 3) for (const x of [X0 + m / 2, X1 - m / 2]) {
    g.fillStyle = P.hole; g.beginPath(); g.arc(x, y, L * 3 * .17, 0, TAU); g.fill();
    g.strokeStyle = P.wall; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, L * 3 * .17 - .6, Math.PI * 1.05, Math.PI * 1.95); g.stroke(); }
  g.restore();
}
export default { label: 'Cyber · the printout', initial, paraph, filler, frames, palette, loadFace, layTape, layForm };
