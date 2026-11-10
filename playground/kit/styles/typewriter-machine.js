// The typewriter (research/27-typewriter.md, stage 1): one machine per page, its strikes poured through the ink engine.
// A page is typed on one machine, and the machine is the seed's fingerprint: every key has its own faults, the same on
// every strike of that key. What varies from strike to strike is only what varies in the making:
//   the key       fixed per key per page: its slug sits high or low (dy), off-centre (dx), leans (rot); a slug that meets
//                 the platen out of true prints one side fainter (tilt); a slug whose counter has filled with ink and lint
//                 prints it closed (clog); its spring (a little more or less force). Never per-strike jitter.
//   the force     the typist's touch drifts slowly over the run (a smooth curve, not noise). The ink taken is force over
//                 the glyph's contact area: a full stop prints dense, an M paler (US 2,868,345).
//   the ribbon    the type strikes the ribbon where the last strike did, less one feed step, so a fast run of heavy
//                 keys draws the patch down and the print fades; between strikes the cloth wicks ink back (recovery over
//                 ~1 s; a carriage return is a long rest). The red half is its own band with its own load.
//   the weave     the ribbon is cloth, ~150 threads an inch each way (NBS LC 597): the ink lies heavier on the threads and
//                 lighter in the gaps. A continuous modulation, area-filtered to the pixel (at reading size it is only a
//                 slight loss of density; it opens as a soft weave at 4x), stronger as the ribbon runs dry. Never specks.
//   overstrike    the carriage backspaced and the key struck again: a little off (the rack's slop, fixed per column), the
//                 ink of both passes added in the deposit (the engine's pour only merges).
// Each colour's deposit (coverage, ink) is poured into the ink engine (kit/medium.js: the ink levels and creeps into the
// fibre a fraction of a pixel, and dries); the film is read back and laid on the stock by a film law: in light, the ribbon
// inks filter the paper (Beer-Lambert in linear light); in dark, the strike lays an opaque cover-up film (the Correcting
// Selectric's white tape) and a vermilion film on black card, density as opacity.
// No noise, no grain, nothing random per pixel: the seed sets the machine and the ribbon only.
//   machine(seed, { family, ribbon }) -> M
//   press(M, piece, look, o) -> { img, cw, ch, pad, ms }           writer(M, piece, look, o, cv) -> { dur, at(s), done() }
//   piece: { W, H, em, lh, pad?, strikes: [{ ch, x, y, col: 'k'|'r', bold? }] (x: the cell's left, y: its baseline, CSS px;
//          in typing order), mask?: g => fill (a card laid over the sheet: where it lies nothing prints), stencil?: g => fill }
//   look: { theme: 'light'|'dark', stock: hex }   o: { d (device px per CSS px), at: [x, y] (on the page), cap (s) }
// Letters: Courier Prime (Alan Dague-Greene, OFL) or Cutive Mono (Vernon Adams, OFL), loaded by the page.
import { createMedium } from '../medium.js';
import { fnv, mulberry, noise1, noise2 } from '../marks.js';

// the shipped face (fonts/typewriter/: Courier Prime subset and renamed, its licence beside it), loaded by loadFace
export const FACE = { family: 'Illum Typewriter Courier', credit: 'Courier Prime (Alan Dague-Greene, Quote-Unquote Apps; OFL 1.1)' };
let FACEP = null;
export const loadFace = () => FACEP ??= typeof FontFace === 'undefined' ? Promise.resolve() : Promise.all(['regular', 'bold'].map(w =>
  new FontFace(FACE.family, `url(${new URL(`../../fonts/typewriter/illum-typewriter-courier-${w}.woff2`, import.meta.url)})`, { weight: w === 'bold' ? '700' : '400' }).load().then(f => document.fonts.add(f))))
  .catch(e => console.warn('typewriter:', e));
export const FACES = {
  prime: { family: 'Courier Prime', credit: 'Courier Prime (Alan Dague-Greene, Quote-Unquote Apps; OFL 1.1)' },
  cutive: { family: 'Cutive Mono', credit: 'Cutive Mono (Vernon Adams; OFL 1.1)' },
};
const MM_EM = 25.4 / 6;                 // a pica face at 12 pt: one em is a sixth of an inch (4.23 mm)
const THREAD = 25.4 / 150;              // the ribbon's thread pitch, mm (NBS LC 597: ~150 a side an inch)
const lin = v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
const S2L = new Float32Array(256); for (let i = 0; i < 256; i++) S2L[i] = lin(i / 255);
const L2S = new Uint8ClampedArray(4097); for (let i = 0; i <= 4096; i++) { const v = i / 4096; L2S[i] = Math.round(255 * (v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055)); }
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const gauss = r => { let s = 0; for (let i = 0; i < 4; i++) s += r(); return (s - 2) * 1.732; };
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;

// The inks, measured on real sheets (tests/typewriter-refs/CREDITS.md): ribbon black on its paper (Teesdale, fresh),
// ribbon red: the heaviest strokes of Wichary's red ribbon (207 77 60 at its 97th percentile), taken on to the brick of a
// bichrome ribbon's lower band (an estimate: no open close-up of a bichrome sheet was found), so that a thin strike thins
// to a warm salmon and never to pink. The light law takes each as a transmittance relative to its paper. Dark: films.
export const INKS = {
  light: { k: { rgb: [30, 36, 37], on: [239, 240, 234] }, r: { rgb: [172, 52, 36], on: [240, 238, 232] } },
  dark: { k: { rgb: [236, 231, 219] }, r: { rgb: [226, 100, 70] } },
};
for (const th of ['light', 'dark']) for (const c of ['k', 'r']) { const I = INKS[th][c]; I.lin = I.rgb.map(v => S2L[v]); if (I.on) I.t = I.rgb.map((v, i) => Math.max(.003, S2L[v] / S2L[I.on[i]])); }

// ---- the machine: one per page -----------------------------------------------------------------------------------------
// ribbon: 'fresh' | 'worn' | a load 0.4..1.2 (the seed picks one in between when not given)
// off: causes switched off, for the bench ('keys', 'squash', 'tilt', 'clog', 'force', 'ribbon', 'paper', 'weave')
export function machine(seed, { family = FACE.family, ribbon, dirt, seam = 0, off = [] } = {}) {
  const r = mulberry(fnv('machine:' + seed)), load = ribbon === 'fresh' ? 1 : ribbon === 'worn' ? .55 : typeof ribbon === 'number' ? ribbon : .84 + .3 * r();
  const M = { seed: seed | 0, family, load, off: new Set(off), red: load * (.86 + .1 * r()), dirt: dirt ?? .25 + .6 * r(), seam,
    touch: .96 + .08 * r(), feed: .3 + .15 * r(), vib: r(), keys: new Map(), atlas: new Map(),
    nu: noise1(seed * 3 + 11), nv: noise1(seed * 3 + 23), drift: noise1(seed * 7 + 3), f1: noise2(seed * 13 + 5), f2: noise2(seed * 13 + 9), grain: .5 + (r() - .5) * .6,
    // the platen: a softer roller spreads the ink pressed between slug and paper wider (research §2.1 #7: 88-92 Shore A new)
    squash: .024 + .022 * r() };
  // a key's faults: drawn once from the machine's seed and the key (repairers' figures: a high or tilted slug on one key in
  // a few; magnitudes from the masters, foot sd ~.15 mm on a 2.45 mm capital, research §2.1 #5)
  M.key = ch => { let k = M.keys.get(ch); if (k) return k; const q = mulberry(fnv(seed + ':key:' + ch));
    const bad = q() < .22, lean = q() < .14;
    k = { dy: .016 * gauss(q) + (bad ? (q() < .5 ? -1 : 1) * (.03 + .03 * q()) : 0), dx: .01 * gauss(q),
      rot: (.45 * gauss(q) + (lean ? (q() < .5 ? -1 : 1) * (1 + q()) : 0)) * Math.PI / 180,
      tilt: q() < .25 ? { amt: .12 + .2 * q(), ang: q() < .7 ? (q() < .5 ? Math.PI / 2 : -Math.PI / 2) : (q() < .5 ? 0 : Math.PI) } : null,
      clog: /^[eoaBDOPQRgdbpq4689@&%#]$/.test(ch) ? clamp(M.dirt * (.3 + 1.1 * q()) - .25) : 0,   // (a display slug, cut deep, does not clog)
      spring: 1 + .03 * gauss(q) };
    if (M.off.has('keys')) Object.assign(k, { dy: 0, dx: 0, rot: 0, spring: 1 });
    if (M.off.has('tilt')) k.tilt = null; if (M.off.has('clog')) k.clog = 0;
    M.keys.set(ch, k); return k; };
  return M;
}

// ---- a key's slug, as it prints: the face's glyph moved by the key's faults, its counter clogged, its faint side --------
// where the time goes (ms, summed since load): the bench and the directions page print it
export const PROF = { slug: 0, deposit: 0, film: 0, composite: 0, pack: 0, gpu: 0, read: 0, sheet: 0 };
let G = null;
// key: the slug's own name when one character has two (a display slug: ch 'B', key 'display:B'), each with its faults
function slug(M, ch, bold, em, res, key = ch, size = 1) {
  const id = key + (bold ? 'b' : '') + em + ':' + res; let a = M.atlas.get(id); if (a) return a;
  const tp = performance.now();
  const S = em * res, w = Math.ceil(S * 1.3), h = Math.ceil(S * 1.6), ox = Math.round(S * .35), oy = Math.round(S * 1.1), k = M.key(key);
  G ??= new OffscreenCanvas(8, 8).getContext('2d', { willReadFrequently: true });
  if (G.canvas.width < w || G.canvas.height < h) { G.canvas.width = Math.max(G.canvas.width, w); G.canvas.height = Math.max(G.canvas.height, h); }
  G.setTransform(1, 0, 0, 1, 0, 0); G.clearRect(0, 0, w, h); G.font = `${bold ? 700 : 400} ${S}px "${M.family}"`; G.fillStyle = '#000'; G.textBaseline = 'alphabetic';
  // (the slug turns about the foot of its cell, where it meets the platen)
  // (a fault is a length on the paper, in the page's em: a display slug sits as far out of true as any other, no further)
  G.translate(ox + .3 * S + k.dx * S / size, oy + k.dy * S / size); G.rotate(k.rot / size); G.fillText(ch, -.3 * S, 0);
  const d = G.getImageData(0, 0, w, h).data, C = new Float32Array(w * h); let n = 0, sx = 0, sy = 0, x0 = w, x1 = 0, y0 = h, y1 = 0;
  for (let q = 0; q < w * h; q++) { const v = d[q * 4 + 3] / 255; if (!v) continue; C[q] = v; n += v; const x = q % w, y = q / w | 0; sx += x * v; sy += y * v; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  // the clogged counter: the closed spaces inside the glyph (paper the border cannot reach) fill from their walls inward (on the slug as cut, before the
  // squash and the cloth soften it, so the fill and the strokes soften together and no rim is left between them)
  if (k.clog > 0 && n) {
    const out = new Uint8Array(w * h), st = []; for (let x = 0; x < w; x++) st.push(x, (h - 1) * w + x); for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1);
    while (st.length) { const q = st.pop(); if (out[q] || C[q] > .5) continue; out[q] = 1; const x = q % w; if (x > 0) st.push(q - 1); if (x < w - 1) st.push(q + 1); if (q >= w) st.push(q - w); if (q < w * h - w) st.push(q + w); }
    const dist = new Float32Array(w * h).fill(1e9), fr = []; let maxd = 0;
    for (let q = 0; q < w * h; q++) if (!out[q] && C[q] > .5) { dist[q] = 0; fr.push(q); }
    for (let i = 0; i < fr.length; i++) { const q = fr[i], x = q % w;
      for (const o of [x > 0 ? q - 1 : -1, x < w - 1 ? q + 1 : -1, q - w, q + w]) if (o >= 0 && o < w * h && !out[o] && dist[o] > dist[q] + 1) { dist[o] = dist[q] + 1; if (dist[o] > maxd) maxd = dist[o]; fr.push(o); } }
    // (packed thickest at the walls and thinning inward, with no edge of its own: a clog has no outline)
    const reach = k.clog * (maxd + 1), soft = Math.max(2, .6 * reach);
    for (let q = 0; q < w * h; q++) if (!out[q] && C[q] <= .5 && dist[q] < 1e9) { const f = clamp((reach - dist[q]) / soft + .5); C[q] = Math.max(C[q], .72 * f * f * (3 - 2 * f)); }
  }
  // the squash: slug, ribbon and paper pressed together against the platen, the ink spreads past the slug's face (a
  // fraction of a stroke; corners round). The coverage grown by M.squash em: a soft dilation (a box blur, thresholded low)
  // (both are lengths on the paper, the page's em, whatever the slug's size: a display slug spreads no wider)
  if (!M.off.has('squash')) { const S0 = S / size, R = Math.max(1, Math.round(M.squash * S0)), B = blur(blur(C, w, h, R, 1), w, h, R, 0);
    for (let q = 0; q < w * h; q++) { const v = clamp((B[q] - .12) * 2.6); if (v > C[q]) C[q] = v; }
    // the cloth: the ribbon has a thickness (~0.1 mm), so the slug's edge reaches the paper through it softened
    const r = Math.round(.012 * S0); if (r >= 1) { const E = blur(blur(C, w, h, r, 1), w, h, r, 0); for (let q = 0; q < w * h; q++) C[q] = .5 * C[q] + .5 * E[q]; } }
  // the faint side: a plane across the glyph's box, the far side lighter by tilt.amt
  const T = new Float32Array(w * h).fill(1);
  if (k.tilt && n) { const cx = sx / n, cy = sy / n, R = Math.max(x1 - x0, y1 - y0) / 2 || 1, ux = Math.cos(k.tilt.ang), uy = Math.sin(k.tilt.ang);
    for (let q = 0; q < w * h; q++) if (C[q]) { const s = ((q % w - cx) * ux + ((q / w | 0) - cy) * uy) / R; T[q] = 1 - k.tilt.amt * clamp(s * .6 + .4); } }
  let A = 0; for (let q = 0; q < w * h; q++) A += C[q];
  // (the rows and columns that hold ink, so a strike is stamped over its glyph and not its whole slug's cell)
  let bx0 = w, bx1 = -1, by0 = h, by1 = -1; for (let q = 0; q < w * h; q++) if (C[q] > 0) { const x = q % w, y = q / w | 0; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; }
  a = { C, T, w, h, ox, oy, bb: [bx0, by0, bx1, by1], area: A / (S * S) }; M.atlas.set(id, a); PROF.slug += performance.now() - tp; return a;
}

// a box blur of radius r along x (horiz 1) or y
function blur(A, w, h, r, horiz) {
  const O = new Float32Array(w * h), L = horiz ? w : h, N = horiz ? h : w, k = 2 * r + 1;
  for (let m = 0; m < N; m++) { let acc = 0; const at = j => A[horiz ? m * w + j : j * w + m];
    for (let j = -r; j <= r; j++) acc += at(Math.min(L - 1, Math.max(0, j)));
    for (let j = 0; j < L; j++) { O[horiz ? m * w + j : j * w + m] = acc / k; acc += at(Math.min(L - 1, j + r + 1)) - at(Math.max(0, j - r)); } }
  return O;
}

// ---- the typist's clock: when each strike lands (s), and its pass (how many times this cell has been struck) ------------
// ~6 strikes a second; a repeated key faster (~10 a second); the space bar a beat a cell; a carriage return ~.5 s; a
// return for an overstrike pass (backspacing over the row) ~.35 s. (research §3.3: guesses for pacing, tested by eye)
export function clock(piece) {
  const S = piece.strikes, cw = .6 * piece.em, seen = new Map(); let t = 0, p = null;
  for (const s of S) {
    if (p) { const dy = Math.abs(s.y - p.y) > .5, back = s.x < p.x - .5 * cw, gap = Math.max(0, Math.round((s.x - p.x) / cw) - 1);
      t += dy ? .5 : back ? .35 : s.ch === p.ch ? .1 : .16; if (!dy && !back) t += .09 * gap; }
    s.t ??= t; const id = Math.round(s.x * 4) + ',' + Math.round(s.y * 4); s.pass = (seen.get(id) ?? 0) + 1; seen.set(id, s.pass); p = s;
  }
  return t;
}

// ---- the ribbon and the force, along the run ---------------------------------------------------------------------------
// The patch under the type guide is drawn down by each strike in proportion to the ink it gives (force x area) and refills
// by wicking (time constant TAU); the next strike lands on that patch less one feed step, so it shares most of it.
const TAU = 1.1, DRAW = .3;
function inkRun(M, piece, res) {
  const band = { k: { def: 0, t: -9 }, r: { def: 0, t: -9 } }, em = piece.em;
  piece.strikes.forEach((s, i) => {
    const b = band[s.col === 'r' ? 'r' : 'k'], a = slug(M, s.ch, s.bold, em * (s.size ?? 1), res, s.key, s.size).area * (s.size ?? 1) ** 2, k = M.key(s.key ?? s.ch);
    b.def *= Math.exp(-(s.t - b.t) / TAU); b.t = s.t; if (M.off.has('ribbon')) b.def = 0;
    const base = s.col === 'r' ? M.red : M.load, force = M.off.has('force') ? 1 : M.touch * k.spring * (1 + .05 * (M.drift(i / 9) * 2 - 1));
    s.force = force; s.ink = base * (1 - b.def);
    // ink taken: force over contact area (a small glyph prints dense, a big one pales); capped at the slug's own limits
    s.dens = M.off.has('force') ? s.ink : s.ink * clamp(force * (.1 / Math.max(.012, a)) ** .2, .8, 1.25);
    s.rib = M.feed * (i + (s.col === 'r' ? 300 : 0));                   // where on the ribbon this strike lands (mm)
    b.def = Math.min(.7, b.def + DRAW * a * force * (1 - b.def));
  });
}

// the weave under one strike at (u, v) mm from its cell's origin: heavier on the threads, lighter in the gaps; each
// thread carries its own load (spun yarn, research §2.1 #4); the gaps show more as the ribbon dries. att: the pixel's
// area filter (a weave finer than the pixel is seen only as its mean).
function weaveAt(u, v, s, M, att, dry) {
  if (M.off.has('weave') || att < .05) return 1;   // (a weave finer than the pixel is seen only as its mean)
  const U = (u + s.rib) / THREAD, V = (v + M.vib * 3) / THREAD;
  const gu = .5 - .5 * Math.cos(2 * Math.PI * U), gv = .5 - .5 * Math.cos(2 * Math.PI * V);
  const lu = M.nu(U * .7), lv = M.nv(V * .7);
  const A = (.05 + .17 * dry) * att, L = (.04 + .1 * dry) * Math.min(1, att * 2.5);
  return 1 - A * (gu + gv) * .5 - L * (lu + lv - 1);
}

// the paper under the platen: the type presses the ribbon into the sheet and the fibres standing high take more ink than
// the hollows between them (fibres and their clumps ~0.15-0.2 mm, a little longer along the sheet's grain, one direction per sheet). A continuous
// field, anchored to the page, area-filtered to the pixel; it is the sheet's, the same under every strike.
function fibreAt(X, Y, M, amp) {
  if (M.off.has('paper') || amp < .01) return 1;
  const ca = Math.cos(M.grain), sa = Math.sin(M.grain), u = (X * ca + Y * sa) / .22, v = (-X * sa + Y * ca) / .14;
  return 1 + amp * ((M.f1(u, v) - .5) * 1.3 + (M.f2(u * 2.1 + 17, v * 2.1 + 5) - .5) * .7);
}

// ---- the deposit: every strike stamped, overstrikes added -----------------------------------------------------------------
function deposit(M, piece, o, cw, ch, pad) {
  const { d } = o, em = piece.em, n = cw * ch, L = { k: { C: new Float32Array(n), I: new Float32Array(n), T: [] }, r: { C: new Float32Array(n), I: new Float32Array(n), T: [] } };
  const pxmm = d * em / MM_EM, att = (() => { const x = Math.PI / (pxmm * THREAD); return (Math.sin(x) / x) ** 2; })(), famp = .75 * clamp((Math.sqrt(.22 * .14) * pxmm - 1) / 2);
  // (famp: a fibre under ~2 device px is seen only as its mean, so at page size the strike is near-flat and the grain opens
  // as it is enlarged; the measured masters are at 18 px/mm, where it is whole)
  const PX = (o.at[0] - pad) * d, PY = (o.at[1] - pad) * d, FB = new Float32Array(n);   // (the fibre under each pixel, worked out once)   // (the sheet's own place, so its fibre is the page's)
  let mask = null, sten = null;
  const raster = f => { const g = new OffscreenCanvas(cw, ch).getContext('2d', { willReadFrequently: true }); g.setTransform(d, 0, 0, d, pad * d, pad * d); g.fillStyle = '#000'; f(g);
    const a = g.getImageData(0, 0, cw, ch).data, R = new Float32Array(n); for (let q = 0; q < n; q++) R[q] = a[q * 4 + 3] / 255; return R; };
  if (piece.mask) mask = raster(piece.mask); if (piece.stencil) sten = raster(piece.stencil);
  const slopX = noise1(M.seed * 5 + 1), slopY = noise1(M.seed * 5 + 2);
  for (const s of piece.strikes) {
    const a = slug(M, s.ch, s.bold, em * (s.size ?? 1), d, s.key, s.size), col = s.col === 'r' ? 'r' : 'k', dry = clamp(1 - s.ink);
    // an overstrike lands a little off: the rack's slop at this column, the same every time it is passed
    const col0 = Math.round(s.x / (.6 * em)), sx = s.pass > 1 ? .045 * .6 * em * (slopX(col0 * .73 + s.pass) * 2 - 1) : 0, sy = s.pass > 1 ? .03 * em * (slopY(col0 * .51 + s.pass) * 2 - 1) : 0;
    const X0 = Math.round((pad + s.x + sx) * d) - a.ox, Y0 = Math.round((pad + s.y + sy) * d) - a.oy;
    // (the bichrome seam: a mis-set vibrator lifts the ribbon short, and the glyph's top strikes the black half)
    const seamY = col === 'r' && M.seam > 0 ? a.oy - em * d * (.62 - 2 * M.seam) : -1e9;
    for (let j = a.bb[1]; j <= a.bb[3]; j++) { const y = Y0 + j; if (y < 0 || y >= ch) continue;
      for (let i = a.bb[0]; i <= a.bb[2]; i++) { const c0 = a.C[j * a.w + i]; if (!c0) continue; const x = X0 + i; if (x < 0 || x >= cw) continue; const q = y * cw + x;
        let c = c0; if (mask) c *= 1 - mask[q]; if (sten) c *= sten[q]; if (c <= .002) continue;
        const ink = s.dens * a.T[j * a.w + i] * weaveAt((i - a.ox) / pxmm, (j - a.oy) / pxmm, s, M, att, dry) * (FB[q] ||= fibreAt((PX + x) / pxmm, (PY + y) / pxmm, M, famp));
        let B = L[col]; if (j < seamY) B = L.k;
        B.I[q] += c * ink; B.C[q] = 1 - (1 - B.C[q]) * (1 - c);
        (B.T[s.pass - 1] ??= new Float32Array(n).fill(Infinity))[q] = Math.min(B.T[s.pass - 1][q], s.t); } }
  }
  return L;
}

// ---- the engine: a deposit poured, the film read back ---------------------------------------------------------------------
const K0 = 64, KL = Math.log(255 / K0), INK = .64;
const FILM = Float32Array.from({ length: 256 }, (_, v) => Math.log(255 / Math.max(1, v)) / KL / 1.07);   // (the film a read-back byte stands for)   // INK: a strike's deposit at full load, where the engine's coat is still filling (V ~ .55-.75) so the ink's variations show
let MED = null;
// (one medium for every resolution, made at the page's: a context for each zoom of the bench would run past the browser's
// ~16. The engine's own paper only rounds the edge a fraction of a pixel; the sheet's fibre is the deposit's, at any scale.)
function mediumFor(cw, ch, d) {
  if (!MED || MED.Md.gl.isContextLost()) { const cv = document.createElement('canvas'); cv.width = Math.max(cw, 1024); cv.height = Math.max(ch, 512);
    MED = { d, Md: createMedium(cv, { dpr: Math.min(2, globalThis.devicePixelRatio || 1), paper: [255, 255, 255], ink: [K0, K0, K0], rough: .5 }) }; }
  else if (MED.Md.W < cw || MED.Md.H < ch) MED.Md.resize(Math.max(cw, MED.Md.W), Math.max(ch, MED.Md.H));
  return MED.Md;
}
// the ink of a deposit: coverage C, ink I (summed over the strikes that hit, so I/C is the ink per unit of cover), dryness 0
// (a dry pour catches only the tooth's peaks: specks, which a ribbon does not make)
function film(Cv, I, cw, ch, o, pad) {
  const T0 = performance.now(); PROF.sheet += cw * ch / 1e6; const { d } = o, n = cw * ch, D = new Uint8Array(n * 4); let any = false;
  for (let q = 0; q < n; q++) { const c = Cv[q]; if (c <= .002) continue; any = true; D[q * 4] = Math.round(c * 255); D[q * 4 + 1] = Math.round(Math.min(1, I[q] / c * INK / 2) * 255); }
  if (!any) return null;
  let tq = performance.now(); PROF.pack += tq - T0; const Md = mediumFor(cw, ch, d), gl = Md.gl;
  Md.clear(); Md.wetness(o.wet ?? .06); Object.assign(Md.settings, { ink: [K0, K0, K0], paper: [255, 255, 255], over: false });
  // (the paper's fibre anchored to the page; on a sheet of many pieces, each cell's patch of it)
  if (o.papers) for (const [x, y, w, h, px, py] of o.papers) Md.makePaper([px - x, py - y], [x, y, w, h]);
  else Md.makePaper([Math.round((o.at[0] - pad) * d), Math.round((o.at[1] - pad) * d)], [0, 0, cw, ch]);
  Md.pour(D, cw, ch, [0, 0, cw, ch]); for (let s = 0; s < (o.steps ?? 4); s++) Md.step(16); Md.finish(); Md.render([0, 0, cw, ch]); PROF.gpu += performance.now() - tq; tq = performance.now();
  const px = new Uint8Array(n * 4); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.readPixels(0, Md.H - ch, cw, ch, gl.RGBA, gl.UNSIGNED_BYTE, px); PROF.read += performance.now() - tq;
  const F = new Float32Array(n);
  for (let y = 0; y < ch; y++) { const r = (ch - 1 - y) * cw, o = y * cw; for (let x = 0; x < cw; x++) { const v = px[(r + x) * 4]; if (v < 254) F[o + x] = FILM[v]; } }
  return F;
}
// the same without the engine (no WebGL2): the deposit as it lies
function flat(Cv, I) { const F = new Float32Array(Cv.length); for (let q = 0; q < F.length; q++) if (Cv[q] > .002) { const V = I[q] * INK; F[q] = Math.min(1, V / .55) * (.62 + .45 * Math.min(1.5, V)) / 1.07; } return F; }

// ---- the stock: films laid by the light or the dark law, as a colour and an alpha over the stock -------------------------
export function composite(P, img, show = null) {
  const { cw, ch, look } = P, D = img.data, S = hexRGB(look.stock), Sl = S.map(v => S2L[v]), dark = look.theme === 'dark', I = INKS[dark ? 'dark' : 'light'];
  const Fk = P.F.k, Fr = P.F.r, Q = 512, FM = 2, tab = C => { const T = new Float32Array((Q + 1) * 3);   // per film step: light, the transmittance; dark, the cover
    for (let i = 0; i <= Q; i++) { const f = i / Q * FM; for (let j = 0; j < 3; j++) T[i * 3 + j] = dark ? 1 - Math.exp(-2.4 * f) : C.t[j] ** f; } return T; };
  const TK = tab(I.k), TR = tab(I.r), fk0 = Fk && Fk[P.lv.k], fr0 = Fr && Fr[P.lv.r], c = [0, 0, 0], B = P.bb ?? [0, 0, cw - 1, ch - 1];
  // (only the rows and columns ink reaches, P.bb: a new ImageData is clear elsewhere)
  for (let yy = B[1]; yy <= B[3]; yy++) for (let q = yy * cw + B[0], qe = yy * cw + B[2]; q <= qe; q++) {
    const fk = !Fk ? 0 : show ? show(Fk, 'k', q) : fk0[q], fr = !Fr ? 0 : show ? show(Fr, 'r', q) : fr0[q], o = q * 4; if (fk <= .003 && fr <= .003) { D[o + 3] = 0; continue; }
    let r = Sl[0], g = Sl[1], b = Sl[2];
    for (let pass = 0; pass < 2; pass++) { const f = pass ? fr : fk; if (f <= 0) continue; const T = pass ? TR : TK, C = pass ? I.r : I.k, x = Math.min(Q, Math.round(f / FM * Q)) * 3;
      if (!dark) { r *= T[x]; g *= T[x + 1]; b *= T[x + 2]; } else { const h = T[x]; r += (C.lin[0] - r) * h; g += (C.lin[1] - g) * h; b += (C.lin[2] - b) * h; } }
    c[0] = L2S[Math.min(4096, r * 4096 | 0)]; c[1] = L2S[Math.min(4096, g * 4096 | 0)]; c[2] = L2S[Math.min(4096, b * 4096 | 0)];
    let al = 0; for (let j = 0; j < 3; j++) { const p = S[j], v = c[j], e = v < p ? (p - v) / p : v > p ? (v - p) / (255 - p) : 0; if (e > al) al = e; }
    if (al < .004) { D[o + 3] = 0; continue; }
    for (let j = 0; j < 3; j++) D[o + j] = (c[j] - (1 - al) * S[j]) / al;
    D[o + 3] = al * 255;
  }
}

// ---- a piece, typed --------------------------------------------------------------------------------------------------------
// films per colour and per pass level (level k: the strikes of pass <= k; a still needs only the last)
function typeset(M, piece, look, o, levels = false) {
  const t0 = performance.now(), pad = piece.pad ?? Math.ceil(piece.em * .6), d = o.d, cw = Math.ceil((piece.W + 2 * pad) * d), ch = Math.ceil((piece.H + 2 * pad) * d);
  const dur = clock(piece); inkRun(M, piece, d);
  const P = { cw, ch, pad, look, dur, F: {}, T: {}, lv: {} }, engine = o.ink !== 'flat', colOf = s => s.col === 'r' && !(M.seam > 0) ? 'r' : s.col === 'r' ? 'kr' : 'k';
  const top = { k: 0, r: 0 }; for (const s of piece.strikes) { const c = colOf(s); if (c.includes('k')) top.k = Math.max(top.k, s.pass); if (c.includes('r')) top.r = Math.max(top.r, s.pass); }
  const max = Math.max(top.k, top.r), ks = levels ? Array.from({ length: max }, (_, i) => i + 1) : [max];
  for (const col of ['k', 'r']) if (top[col]) { P.F[col] = []; P.lv[col] = top[col] - 1; }
  // one deposit per pass level (both colours at once), each colour's film poured from it
  for (const k of ks) { let tp = performance.now(); const L = deposit(M, k === max ? piece : { ...piece, strikes: piece.strikes.filter(s => s.pass <= k) }, o, cw, ch, pad); PROF.deposit += performance.now() - tp;
    for (const col of ['k', 'r']) { if (!top[col] || (levels && k > top[col])) continue; tp = performance.now();
      P.F[col][(levels ? k : top[col]) - 1] = engine ? film(L[col].C, L[col].I, cw, ch, o, pad) ?? new Float32Array(cw * ch) : flat(L[col].C, L[col].I); PROF.film += performance.now() - tp;
      if (levels && k === top[col]) P.T[col] = L[col].T; } }
  P.ms = performance.now() - t0; return P;
}

// Many pieces typed at once (a page's ornament): each piece's deposit laid in its own cell of one sheet, and each colour
// poured, levelled, dried and read back once for the lot, where piece by piece costs that per colour per piece (the
// engine's pour and its read back are what a page pays most for; as kit/styles/plotter-pen.js printMany does for pens).
// items: [{ piece, at }] -> [{ img, cw, ch, pad }] in the same order. Each cell is its own patch of the page's paper.
export function pressMany(M, items, look, o) {
  const d = o.d, cells = items.map(({ piece, at }) => { const pad = piece.pad ?? Math.ceil(piece.em * .6), cw = Math.ceil((piece.W + 2 * pad) * d), ch = Math.ceil((piece.H + 2 * pad) * d);
    clock(piece); inkRun(M, piece, d); const tp = performance.now(), L = deposit(M, piece, { ...o, at }, cw, ch, pad); PROF.deposit += performance.now() - tp; return { piece, at, pad, cw, ch, L }; });
  // a sheet per ribbon colour, holding only the pieces that colour inks (most pieces are one colour), each cut to the rows
  // and columns its ink reaches (a piece's pad is room for the ink's creep, not ink): shelves, left to right, 2 px apart
  const engine = o.ink !== 'flat', MAXW = 2048;
  for (const col of ['k', 'r']) {
    const use = []; for (const c of cells) { const A = c.L[col]; let i0 = c.cw, i1 = -1, j0 = c.ch, j1 = -1;
      for (let j = 0; j < c.ch; j++) { const r = j * c.cw; for (let i = 0; i < c.cw; i++) if (A.C[r + i] > .002) { if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; j1 = j; } }
      if (i1 < 0) continue; const m = Math.ceil(3 * d); i0 = Math.max(0, i0 - m); j0 = Math.max(0, j0 - m); i1 = Math.min(c.cw - 1, i1 + m); j1 = Math.min(c.ch - 1, j1 + m);
      use.push({ c, A, i0, j0, w: i1 - i0 + 1, h: j1 - j0 + 1 }); }
    for (const c of cells) (c.F ??= {})[col] = [new Float32Array(c.cw * c.ch)];
    if (!use.length) continue;
    let x = 0, y = 0, rowH = 0, SW = 0;
    for (const u of use) { if (x + u.w > MAXW && x > 0) { y += rowH + 2; x = 0; rowH = 0; } u.x = x; u.y = y; x += u.w + 2; rowH = Math.max(rowH, u.h); SW = Math.max(SW, x); }
    const SH = y + rowH, n = SW * SH, Cv = new Float32Array(n), I = new Float32Array(n);
    for (const u of use) for (let j = 0; j < u.h; j++) { const r0 = (u.j0 + j) * u.c.cw + u.i0, r1 = (u.y + j) * SW + u.x; Cv.set(u.A.C.subarray(r0, r0 + u.w), r1); I.set(u.A.I.subarray(r0, r0 + u.w), r1); }
    const tp = performance.now(), F = engine ? film(Cv, I, SW, SH, { ...o, papers: use.map(u => [u.x, u.y, u.w, u.h, Math.round((u.c.at[0] - u.c.pad) * d) + u.i0, Math.round((u.c.at[1] - u.c.pad) * d) + u.j0]) }, 0) : flat(Cv, I); PROF.film += performance.now() - tp;
    for (const u of use) { const b = u.c.bb ??= [u.i0, u.j0, u.i0 + u.w - 1, u.j0 + u.h - 1]; b[0] = Math.min(b[0], u.i0); b[1] = Math.min(b[1], u.j0); b[2] = Math.max(b[2], u.i0 + u.w - 1); b[3] = Math.max(b[3], u.j0 + u.h - 1); }
    if (F) for (const u of use) { const f = u.c.F[col][0]; for (let j = 0; j < u.h; j++) f.set(F.subarray((u.y + j) * SW + u.x, (u.y + j) * SW + u.x + u.w), (u.j0 + j) * u.c.cw + u.i0); }
  }
  return cells.map(c => { const P = { cw: c.cw, ch: c.ch, pad: c.pad, look, F: c.F ?? {}, lv: { k: 0, r: 0 }, bb: c.bb ?? [0, 0, -1, -1] }, img = new ImageData(c.cw, c.ch), tp = performance.now(); composite(P, img); PROF.composite += performance.now() - tp; return { img, cw: c.cw, ch: c.ch, pad: c.pad }; });
}
// the engine made ahead (its context and its programs), while the page's fonts are on their way
export function warm(d = Math.min(2, globalThis.devicePixelRatio || 1)) { try { mediumFor(1, 1, d); } catch {} }

export function press(M, piece, look, o) {
  const P = typeset(M, piece, look, o), img = new ImageData(P.cw, P.ch), tp = performance.now(); composite(P, img); PROF.composite += performance.now() - tp;
  return { img, cw: P.cw, ch: P.ch, pad: P.pad, ms: P.ms };
}

// Typed as you watch: strikes land in the typist's order and rhythm, held to o.cap seconds for the piece (the rests keep
// their proportion). A strike is instantaneous: a cell shows its film when its strike has landed, and a cell struck again
// shows the next pass's film. Nothing fades in.
export function writer(M, piece, look, o, cv) {
  const P = typeset(M, piece, look, o, true), img = new ImageData(P.cw, P.ch), g = cv.getContext('2d'), n = P.cw * P.ch;
  cv.width = P.cw; cv.height = P.ch;
  const k = o.cap && P.dur > o.cap ? o.cap / P.dur : 1, dur = P.dur * k;
  // each pixel's moment for each pass (a halo pixel, ink crept past the glyph, takes its neighbour's)
  for (const col in P.T) for (const T of P.T[col]) { if (!T) continue; for (let it = 0; it < 3; it++) for (let q = 0; q < n; q++) if (T[q] === Infinity) {
    const x = q % P.cw; let m = Infinity; if (x > 0) m = Math.min(m, T[q - 1]); if (x < P.cw - 1) m = Math.min(m, T[q + 1]); if (q >= P.cw) m = Math.min(m, T[q - P.cw]); if (q < n - P.cw) m = Math.min(m, T[q + P.cw]); if (m < Infinity) T[q] = m + 1e-6; } }
  let now = -1;
  const show = (Fs, col, q) => { const Ts = P.T[col] ?? []; let lv = -1; for (let i = 0; i < Ts.length; i++) if (Ts[i] && Ts[i][q] <= now) lv = i;
    return lv < 0 ? 0 : (Fs[lv] ?? Fs[Fs.length - 1])[q]; };
  const draw = () => { composite(P, img, show); g.putImageData(img, 0, 0); };
  return { cw: P.cw, ch: P.ch, pad: P.pad, dur, ms: P.ms,
    at(s) { const t = s / k; if (t <= now) return; now = t; draw(); }, done() { now = Infinity; draw(); }, reset() { now = -1; g.clearRect(0, 0, P.cw, P.ch); } };
}

// ---- helpers for composing -------------------------------------------------------------------------------------------------
// a run of text typed from cell x (CSS px) on baseline y: one strike a character, spaces skipped
export function typed(str, x, y, em, col = 'k', o = {}) { const out = []; [...str].forEach((c, i) => { if (c !== ' ') out.push({ ch: c, x: x + i * .6 * em, y, col, ...o }); }); return out; }
export const rngOf = (seed, name) => mulberry(fnv(name + ':' + seed));
