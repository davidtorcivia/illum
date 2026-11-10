// The duplicator's press (research/26-riso.md, stage 1): a stencil-duplicator print of two drums, one pass.
// A piece is drawn once per drum as plain vector shapes (its stencil), each drum's shapes laid through that drum's one
// page-wide transform (its miss), and the inks composited by a film law. Every variation in the result has a cause:
//   the stencil      a 1-bit master: solids are solid; an edge is the shape's own (its 42 µm roughness is below a pixel)
//   the miss         one rigid transform per drum for the whole page (shift, a rotation of a hundredth of a degree, a
//                    stretch along the feed), so neighbouring marks miss alike and the miss grows down the sheet
//   the film         translucent inks filter (Beer-Lambert in linear light, t^τ per channel, t = the swatch on white);
//                    opaque inks hide what is under them by 1 - exp(-σ τ) (Cornflower, Bubblegum, Mint, White: the
//                    inks that show on dark stock)
//   the trap         wet on wet: the second drum's ink takes less well on the first's wet film (τ × trap there), so
//                    the overprint is lighter than a plain multiply
//   starving         a large solid draws the drum's ink down: the film thins behind it along the feed (lead edge
//                    fullest), recovering over ~60 CSS px of bare sheet [U: the guides report uneven large solids; the
//                    direction is our reasoning]. look.starve adds a symmetric thinning in a solid's middle (off by default:
//                    it reads as a vignette)
//   the pass         ?draw: each drum lays its ink along a straight front moving down the piece (the nip, the feed
//                    direction), the second a beat behind the first. Nothing fades.
// No noise, no grain, no texture: nothing in here is random per pixel. The seed sets the page's drums (their miss) only.
//   press(piece, look, o) -> { img: ImageData, cw, ch, pad }     writer(piece, look, o, canvas) -> { at(f), done(), dur }
//   piece: { W, H, pad?, draw: { [role]: g => … } }   (CSS px; g is a 2D context already transformed for the drum: fill shapes)
//   look: { stock: hex, order: [role, role], ink: { [role]: INK key }, density?: { [role]: τ0 }, trap? }
//   o: { d (device px per CSS px), at: [x, y] (the piece's place on the page), pageW, drums (drumSet), ink: 'flat' | 'textured' |
//        'poured' | 'auto' (poured if large, else textured), seed, pourMin? }
// Ink colours: stencil.wiki's ink pages (CC BY-NC-SA 4.0; values used as facts, with credit), the few inks used here.

import { createMedium } from '../medium.js';
import { noise2, hash2 } from '../marks.js';

export const MM = 96 / 25.4;
export const PROF = { raster: 0, film: 0, pour: 0, texture: 0, tiles: 0, composite: 0, pours: 0 };   // (ms, for the specimens' timing line)
const now = () => performance.now();
export const rng = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const lin = v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
const hexRGB = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const L2S = new Uint8ClampedArray(4097); for (let i = 0; i <= 4096; i++) { const v = i / 4096; L2S[i] = Math.round(255 * (v <= .0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - .055)); }
const S2L = new Float32Array(256); for (let i = 0; i < 256; i++) S2L[i] = lin(i / 255);

// op: the hiding power σ of an opaque ink (1 - exp(-σ) of what is under it hidden by a full film)
export const INKS = {
  federal:    { name: 'Federal Blue', hex: '#3D5588' },
  pink:       { name: 'Fluorescent Pink', hex: '#FF48B0' },
  teal:       { name: 'Teal', hex: '#00838A' },
  red:        { name: 'Bright Red', hex: '#F15060' },
  mblue:      { name: 'Medium Blue', hex: '#3255A4' },
  sunflower:  { name: 'Sunflower', hex: '#FFB511' },
  black:      { name: 'Black', hex: '#000000' },
  cornflower: { name: 'Cornflower', hex: '#62A8E5', op: 1.5 },
  bubblegum:  { name: 'Bubblegum', hex: '#F984CA', op: 1.5 },
  mint:       { name: 'Mint', hex: '#82D8D5', op: 1.5 },
  bisque:     { name: 'Bisque', hex: '#F2CDCF', op: 1.5 },
  white:      { name: 'White', hex: '#FFFFFF', op: 1.9 },
  lgray:      { name: 'Light Gray', hex: '#88898A', op: 2 },
};
const TQ = 256, TMAX = 1.6;   // the film's thickness, quantised for the transmission tables
for (const k in INKS) { const I = INKS[k]; I.lin = hexRGB(I.hex).map(v => S2L[v]);
  // a translucent ink's solid on white is its swatch: two passes through the film, t² = swatch, so a film τ passes t^τ… as
  // one table per channel (τ in [0, TMAX])
  I.t = I.lin.map(v => Float32Array.from({ length: TQ }, (_, q) => Math.max(.004, v) ** (q / (TQ - 1) * TMAX)));
  if (I.op) I.h = Float32Array.from({ length: TQ }, (_, q) => 1 - Math.exp(-I.op * q / (TQ - 1) * TMAX)); }

// the page's drums: drum 1 is the key (registered to the text), drum 2 misses it by one rigid transform
// (research §2.5: 0.3–1.8 mm, dy larger than dx; ±0.1°; stretch along the feed up to a few tenths of a percent).
// mag scales the miss (the bench's slider); the default keeps it near a millimetre, the middle of what the guides report
export function drumSet(seed, mag = 1) {
  const r = rng((seed | 0) * 7919 + 13), m = (.45 + .5 * r()) * MM * mag, a = (r() < .5 ? 1 : -1) * (.35 + .8 * r());
  return [null, { dx: m * Math.sin(a) * .7, dy: m * Math.cos(a) * (r() < .25 ? -1 : 1), th: (r() * 2 - 1) * .07 * Math.PI / 180, e: (r() * 2 - 1) * .002 * mag }];
}
// a drum's transform in a piece's own frame (CSS px): page P' = c + R S (P - c) + d, c the lead edge's middle
export function affine(D, at = [0, 0], pageW = 1000) {
  if (!D) return [1, 0, 0, 1, 0, 0];
  const c = Math.cos(D.th), s = Math.sin(D.th), sy = 1 + D.e, a = c, b = s, cc = -s * sy, dd = c * sy, X = at[0] - pageW / 2, Y = at[1];
  return [a, b, cc, dd, pageW / 2 + a * X + cc * Y + D.dx - at[0], b * X + dd * Y + D.dy - at[1]];
}

let SCR = null;
const scratch = (w, h) => { SCR ??= document.createElement('canvas'); if (SCR.width < w || SCR.height < h) { SCR.width = Math.max(SCR.width, w); SCR.height = Math.max(SCR.height, h); SCR._g = null; }
  return SCR._g ??= SCR.getContext('2d', { willReadFrequently: true }); };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// one drum's stencil as coverage (0..1) at device resolution, and its film τ
function drum(piece, role, k, look, o, cw, ch, pad) {
  // (the key drum, registered to the text, is look.key, else the first laid; any other takes the sheet's miss)
  const { d } = o, key = look.key ?? look.order[0], T = affine(role !== key ? o.drums?.[1] : null, o.at, o.pageW), g = scratch(cw, ch);
  const lay = f => { g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cw, ch); g.setTransform(d * T[0], d * T[1], d * T[2], d * T[3], d * (T[4] + pad), d * (T[5] + pad));
    g.fillStyle = g.strokeStyle = '#fff'; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; f(g); return g.getImageData(0, 0, cw, ch).data; };
  const n = cw * ch, cov = new Float32Array(n); let t0 = now();
  // (and the box its ink lies in, so every later pass keeps to it: bb [x0, y0, x1, y1), empty: x1 <= x0)
  const bb = [cw, ch, 0, 0];
  if (piece.draw[role]) { const A = lay(piece.draw[role]);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const i = y * cw + x, a = A[i * 4 + 3]; if (!a) continue; cov[i] = a / 255;
      if (x < bb[0]) bb[0] = x; if (x >= bb[2]) bb[2] = x + 1; if (y < bb[1]) bb[1] = y; if (y >= bb[3]) bb[3] = y + 1; } }
  PROF.raster += now() - t0; t0 = now();
  // the film: starving in large solids (the coverage blurred over ~5 mm, on a grid of 5 CSS px: the drum's ink supply
  // varies over centimetres, so a letter cut from a flood leaves no halo), and along the feed
  // (a small piece holds no solid large enough to draw the drum down: its film is the density alone)
  const dens = look.density?.[role] ?? .95;
  if (Math.min(piece.W, piece.H) < 40) { const tau = new Float32Array(n); for (let y = bb[1]; y < bb[3]; y++) for (let x = bb[0]; x < bb[2]; x++) { const i = y * cw + x; if (cov[i]) tau[i] = dens; } return finish(cov, tau); }
  const gs = Math.max(1, Math.round(5 * d)), gw = Math.ceil(cw / gs), gh = Math.ceil(ch / gs), G = new Float32Array(gw * gh);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) G[((y / gs) | 0) * gw + ((x / gs) | 0)] += cov[y * cw + x];
  for (let i = 0; i < G.length; i++) G[i] /= gs * gs;
  const r = 3, blur = (S, horiz) => { const O = new Float32Array(S.length), L = horiz ? gw : gh, M = horiz ? gh : gw;
    for (let m = 0; m < M; m++) { let acc = 0; const at = j => S[horiz ? m * gw + j : j * gw + m];
      for (let j = -r; j <= r; j++) acc += at(Math.min(L - 1, Math.max(0, j)));
      for (let j = 0; j < L; j++) { O[horiz ? m * gw + j : j * gw + m] = acc / (2 * r + 1); acc += at(Math.min(L - 1, j + r + 1)) - at(Math.max(0, j - r)); } } return O; };
  let B = G; for (let p = 0; p < 3; p++) B = blur(blur(B, true), false);
  // the drawn-down ink: the drum's supply, run down by the heavy solid it has just printed (over ~60 CSS px of feed), recovering after
  const F = new Float32Array(gw * gh), kf = Math.exp(-gs / (60 * d));
  // (from the cells' own coverage, not the blur: the drawdown runs along the feed only, so a solid gets no rim at its sides)
  for (let x = 0; x < gw; x++) { let f = 0; for (let y = 0; y < gh; y++) { f = f * kf + smooth(.2, .55, G[y * gw + x]) * (1 - kf); F[y * gw + x] = f; } }
  // (softened across the feed, over the roller's own width: below a cut the ink is drawn down less, a soft ghost along the feed)
  // (a blur normalised by the inked cells, so a solid's sides are not lightened by the bare sheet beside them)
  { let H2 = F, M = G.map(v => v > .2 ? 1 : 0); for (let p = 0; p < 2; p++) { H2 = blur(H2, true); M = blur(M, true); } for (let i = 0; i < F.length; i++) F[i] = M[i] > .02 ? H2[i] / M[i] : F[i]; }
  const starve = look.starve ?? 0, feed = look.feed ?? .14, tau = new Float32Array(n);
  for (let y = 0; y < ch; y++) { const gy = Math.min(gh - 1.001, Math.max(0, y / gs - .5)), y0 = gy | 0, fy = gy - y0;
    for (let x = 0; x < cw; x++) { const i = y * cw + x; if (!cov[i]) continue; const gx = Math.min(gw - 1.001, Math.max(0, x / gs - .5)), x0 = gx | 0, fx = gx - x0, j = y0 * gw + x0;
      const bl = (S) => (S[j] * (1 - fx) + S[j + 1] * fx) * (1 - fy) + (S[j + gw] * (1 - fx) + S[j + gw + 1] * fx) * fy;
      tau[i] = dens * (1 - starve * smooth(.6, 1, bl(B)) - feed * bl(F)); } }
  // (poured through the engine; 'auto': only a piece large enough for the engine's creep and levelling to show, ~0.5 Mpx
  // and up at the device's resolution; smaller ones take the same drum streaks, mottle and tooth here, on the CPU)
  return finish(cov, tau);
  function finish(cov, tau) {
    PROF.film += now() - t0; t0 = now();
    if (o.ink === 'poured' || (o.ink === 'auto' && cw * ch > (o.pourMin ?? 140000))) { pour(cov, tau, dens, cw, ch, pad, o, k, look); PROF.pour += now() - t0; PROF.pours++; }
    else if (o.ink === 'auto' || o.ink === 'textured') { texture(cov, tau, cw, ch, pad, o, k, look, bb); PROF.texture += now() - t0; }
    return { cov, tau, ink: INKS[look.ink[role]], role, bb };
  }
}

// ---- the ink poured (o.ink === 'poured') ----------------------------------------------------------------------------------
// The drum's stencil laid as a deposit into the ink engine (kit/medium.js, its own sheet: the shared one in kit/inkletter.js
// renders over a ground, and the overprint needs the film itself), which lets the soy ink creep a little into the paper's
// fibre at every edge, level, and dry; the film it leaves is read back and goes through the same film law. The deposit:
//   coverage   the stencil, through the drum's miss
//   ink        the drum's supply (the drawdown above) × the drum's own unevenness: streaks along the feed where the
//              squeegee feeds the screen unevenly across the drum's width (~5 px across, ~70 px along, ±7 %) and a slow
//              mottle (±4 %, ~25 px) [measured on the studio sheet, research/26-riso.md stage 1b]
//   dryness    none (stage 4): the engine's catch on the tooth skips cells, which reads as flecks; the tooth is in the film
// Seeded by the page and the drum (a drum's unevenness is the same everywhere on the sheet), in page coordinates.
const K0 = 64, KL = Math.log(255 / K0);   // the engine renders a neutral ink by multiply: its film d is read back from it
let MED = null;
function mediumFor(cw, ch, d) {
  if (!MED || MED.d !== d || MED.Md.gl.isContextLost()) { const cv = document.createElement('canvas'); cv.width = Math.max(cw, 1024); cv.height = Math.max(ch, 512);
    MED = { cv, d, Md: createMedium(cv, { dpr: d, paper: [255, 255, 255], ink: [K0, K0, K0], rough: .6 }) }; }
  else if (MED.Md.W < cw || MED.Md.H < ch) MED.Md.resize(Math.max(cw, MED.Md.W), Math.max(ch, MED.Md.H));
  return MED.Md;
}
// the drum's own unevenness (streaks along the feed, ~5 px across and ~70 along, and a slow mottle, ~25 px): both slow,
// so made on a grid of 2 CSS px and read between its points; a factor per pixel of the piece, 1 ± a few per cent
function drumField(o, look, k, ox, oy, cw, ch) {
  const { d } = o, sd = ((o.seed ?? 1) * 31 + k * 977) | 0, st = noise2(sd ^ 0x5157), mo = noise2(sd ^ 0x0a77), A = look.streak ?? .05, B = look.mottle ?? .04;
  const gs = Math.max(1, Math.round(2 * d)), gw = Math.ceil(cw / gs) + 2, gh = Math.ceil(ch / gs) + 2, G = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) { const Y = oy + j * gs / d; for (let i = 0; i < gw; i++) { const X = ox + i * gs / d; G[j * gw + i] = 1 + A * 2 * (st(X / 5, Y / 70) - .5) + B * 2 * (mo(X / 25, Y / 25) - .5); } }
  return (x, y) => { const gx = x / gs, gy = y / gs, i = gx | 0, j = gy | 0, fx = gx - i, fy = gy - j, q = j * gw + i;
    return (G[q] * (1 - fx) + G[q + 1] * fx) * (1 - fy) + (G[q + gw] * (1 - fx) + G[q + gw + 1] * fx) * fy; };
}
// the drum's unevenness and the tooth, on the film here (a piece too small for the engine)
function texture(cov, tau, cw, ch, pad, o, k, look, bb = [0, 0, cw, ch]) {
  const { d } = o, ox = o.at[0] - pad, oy = o.at[1] - pad, df = drumField(o, look, k, ox, oy, cw, ch), gr = grainOf(o, look, k);
  for (let y = bb[1]; y < bb[3]; y++) for (let x = bb[0]; x < bb[2]; x++) { const i = y * cw + x; if (!cov[i]) continue;
    let t = tau[i] * df(x, y); if (gr) t = gr(ox * d + x, oy * d + y, t); tau[i] = t; }
}
function pour(cov, tau, dens, cw, ch, pad, o, k, look) {
  const { d } = o, n = cw * ch, Md = mediumFor(cw, ch, d), gl = Md.gl, dry0 = look.dry ?? 0;
  const ox = o.at[0] - pad, oy = o.at[1] - pad, df = drumField(o, look, k, ox, oy, cw, ch);
  const D = new Uint8Array(n * 4);
  for (let y = 0; y < ch; y++) { for (let x = 0; x < cw; x++) { const i = y * cw + x, c = cov[i]; if (c <= .002) continue;
    const sup = tau[i] / dens, ink = sup * df(x, y);
    D[i * 4] = Math.round(c * 255); D[i * 4 + 1] = Math.round(Math.min(1, ink / 2) * 255); D[i * 4 + 2] = Math.round(Math.min(1, dry0) * 255); } }
  Md.clear(); Md.wetness(look.wet ?? .14); Object.assign(Md.settings, { ink: [K0, K0, K0], paper: [255, 255, 255], over: false });
  Md.makePaper([Math.round(ox * d), Math.round(oy * d)], [0, 0, cw, ch]);   // (the paper's tooth anchored to the page)
  Md.pour(D, cw, ch, [0, 0, cw, ch]);
  for (let s = 0; s < (o.steps ?? 8); s++) Md.step(16);
  Md.finish(); Md.render([0, 0, cw, ch]);
  const px = new Uint8Array(n * 4); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.readPixels(0, Md.H - ch, cw, ch, gl.RGBA, gl.UNSIGNED_BYTE, px);
  // (read bottom-up: the sheet's row y is the read's row ch - 1 - y); the film relative to a full coat (d ≈ 1.07)
  const gr = grainOf(o, look, k);
  for (let y = 0; y < ch; y++) { const r = (ch - 1 - y) * cw; for (let x = 0; x < cw; x++) { const i = y * cw + x, v = px[(r + x) * 4];
    let F = v >= 254 ? 0 : Math.log(255 / Math.max(1, v)) / KL / 1.07; if (F > 0 && gr) F = gr(ox * d + x, oy * d + y, F);
    const c = Math.min(1, F); cov[i] = c; tau[i] = c > 0 ? dens * F / c : 0; } }
}

// ---- the tooth (stage 4): the film's density at the scale of the paper's fibre, continuous ----------------------------------
// Measured on the macro (tests/riso-refs/cetrl-macro.jpg; its scale from the zine's own bitmap pixels, so [U] in mm): a
// solid's fine variation sd ~5–10 % of its value, correlated over ~0.05–0.1 mm, near isotropic. The cause kept: the
// sheet's surface, fibres ~0.07 × 0.15 mm along the paper's grain over a finer tooth; where a fibre stands high the film
// over it is thinner. Only that: the film's density varies continuously, nothing is taken out of it, so there is no
// pinhole, fleck or dot anywhere (the owner, stage 4: discrete speckle reads as "ugly dots"). The part finer than a
// device pixel is averaged away (a pixel sees several fibres). look.grain: 0 none, 1 the measured amount.
// (the field made once per sheet and resolution as two tiles of coprime sizes, read at the pixel's place on the page: their
// sum repeats only every ~60,000 px, and a tile's own seam is finer than the fibre it holds)
const TILES = new Map();
function tiles(seed, d) {
  const key = seed + ':' + d; let T = TILES.get(key); if (T) return T; const t0 = now();
  const ang = .6 + (hash2(seed, 7, 3) - .5) * .8, ca = Math.cos(ang), sa = Math.sin(ang), across = .07 * MM * d, along = .15 * MM * d, iso = .045 * MM * d;
  const vn = (u, v, sd) => { const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, a = fu * fu * (3 - 2 * fu), b = fv * fv * (3 - 2 * fv);
    const h00 = hash2(i, j, sd), h10 = hash2(i + 1, j, sd), h01 = hash2(i, j + 1, sd), h11 = hash2(i + 1, j + 1, sd); return h00 + (h10 - h00) * a + (h01 - h00) * b + (h00 - h10 - h01 + h11) * a * b; };
  const mk = (N, f) => { const A = new Float32Array(N * N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) A[y * N + x] = f(x + .5, y + .5); return A; };
  T = { N1: 251, N2: 241, T1: mk(251, (x, y) => vn((x * ca + y * sa) / along, (-x * sa + y * ca) / across, seed * 13 + 1)), T2: mk(241, (x, y) => vn(x / iso, y / iso, seed * 13 + 3)), amp: Math.min(1, Math.sqrt(.07 * MM * .15 * MM) * d) };
  if (TILES.size > 8) TILES.clear(); TILES.set(key, T); PROF.tiles += now() - t0; return T;
}
function grainOf(o, look, k) {
  const g = look.grain ?? 1; if (!g) return null;
  const { N1, N2, T1, T2, amp } = tiles((o.seed ?? 1) | 0, o.d), film = (look.film ?? .2) * g * amp;
  const md = (v, N) => ((v % N) + N) % N;
  // (X, Y: the pixel's place on the page in device px)
  return (X, Y, F) => { const x = Math.round(X), y = Math.round(Y), f1 = .6 * T1[md(y, N1) * N1 + md(x, N1)] + .4 * T2[md(y, N2) * N2 + md(x, N2)] - .5; return F * (1 + 2 * film * f1); };
}


export function layers(piece, look, o) {
  const pad = piece.pad ?? 8, cw = Math.ceil((piece.W + 2 * pad) * o.d), ch = Math.ceil((piece.H + 2 * pad) * o.d);
  const L = look.order.map((role, k) => drum(piece, role, k, look, o, cw, ch, pad)), bb = L.reduce((b, l) => [Math.min(b[0], l.bb[0]), Math.min(b[1], l.bb[1]), Math.max(b[2], l.bb[2]), Math.max(b[3], l.bb[3])], [cw, ch, 0, 0]);
  return { cw, ch, pad, L, bb, stock: hexRGB(look.stock), trap: look.trap ?? .8 };
}

// the inks laid on the stock, rows y0..y1, each drum only above its front (device rows; Infinity: all)
export function composite(P, img, y0 = 0, y1 = P.ch, fronts = null, raw = false) {
  const tc = now(); try { return compositeIn(P, img, y0, y1, fronts, raw); } finally { PROF.composite += now() - tc; } }
function compositeIn(P, img, y0, y1, fronts, raw) {
  const { cw, L, stock, trap } = P, D = img.data, sl = stock.map(v => S2L[v]), q = TQ - 1, bb = raw || !P.bb ? [0, 0, cw, P.ch] : P.bb;
  // (outside the ink's box a fresh ImageData is already transparent; a raw one is the stock everywhere)
  for (let y = Math.max(y0, bb[1]); y < Math.min(y1, bb[3]); y++) for (let x = bb[0]; x < bb[2]; x++) {
    const i = y * cw + x; let r = sl[0], g = sl[1], b = sl[2], acc = 0, any = false;
    for (let k = 0; k < L.length; k++) { const l = L[k]; let a = l.cov[i]; if (!a || (fronts && y >= fronts[k])) continue; any = true;
      const tq = Math.min(q, Math.max(0, Math.round(l.tau[i] * (1 - (1 - trap) * acc) / TMAX * q))), I = l.ink;
      if (I.h) { const h = I.h[tq] * a, [R, G, Bb] = I.lin; r = (1 - h) * r + h * R; g = (1 - h) * g + h * G; b = (1 - h) * b + h * Bb; }   // what shows of the stock through a thin film is the stock's own
      else { r *= 1 - a + a * I.t[0][tq]; g *= 1 - a + a * I.t[1][tq]; b *= 1 - a + a * I.t[2][tq]; }
      if (a > acc) acc = a; }
    const o = i * 4;
    if (raw) { D[o] = L2S[(r * 4096) | 0]; D[o + 1] = L2S[(g * 4096) | 0]; D[o + 2] = L2S[(b * 4096) | 0]; D[o + 3] = 255; continue; }   // (the colour itself, over the stock)
    if (!any) { D[o + 3] = 0; continue; }
    // as a colour with an alpha that gives exactly this over the stock (the page's own ground), and degrades gently elsewhere
    const R = L2S[(r * 4096) | 0], G = L2S[(g * 4096) | 0], B = L2S[(b * 4096) | 0], c = [R, G, B];
    let al = 0; for (let j = 0; j < 3; j++) { const p = stock[j], v = c[j], e = v < p ? (p - v) / p : v > p ? (v - p) / (255 - p) : 0; if (e > al) al = e; }
    if (al < .004) { D[o + 3] = 0; continue; }
    for (let j = 0; j < 3; j++) D[o + j] = (c[j] - (1 - al) * stock[j]) / al;
    D[o + 3] = al * 255;
  }
}

// the print in two layers, for a piece laid drum by drum (rubricate's ?draw): a, drum 1 alone over the stock; b, what drum 2
// adds, as a colour and an alpha that over a give the whole print exactly (unmultiplied against a's own colour, not the
// stock's). Each is an ImageData of the piece's canvas.
export function pressSplit(piece, look, o) {
  const P = layers(piece, look, o), A = new ImageData(P.cw, P.ch), F = new ImageData(P.cw, P.ch);
  composite(P, A, 0, P.ch, P.L.map((_, k) => k ? -1 : Infinity), true); composite(P, F, 0, P.ch, null, true);
  const a = new ImageData(P.cw, P.ch), b = new ImageData(P.cw, P.ch), st = P.stock, Ad = A.data, Fd = F.data;
  const un = (out, o4, c, bg) => { let al = 0; for (let j = 0; j < 3; j++) { const p = bg[j], v = c[j], e = v < p ? (p - v) / p : v > p ? (v - p) / (255 - p) : 0; if (e > al) al = e; }
    if (al < .004) { out[o4 + 3] = 0; return; } for (let j = 0; j < 3; j++) out[o4 + j] = (c[j] - (1 - al) * bg[j]) / al; out[o4 + 3] = al * 255; };
  for (let i = 0; i < P.cw * P.ch; i++) { const o4 = i * 4, ca = [Ad[o4], Ad[o4 + 1], Ad[o4 + 2]], cf = [Fd[o4], Fd[o4 + 1], Fd[o4 + 2]];
    un(a.data, o4, ca, st); if (cf[0] !== ca[0] || cf[1] !== ca[1] || cf[2] !== ca[2]) un(b.data, o4, cf, ca); }
  return { a, b, cw: P.cw, ch: P.ch, pad: P.pad };
}
export function press(piece, look, o) {
  const P = layers(piece, look, o), img = new ImageData(P.cw, P.ch); composite(P, img); return { img, cw: P.cw, ch: P.ch, pad: P.pad };
}

// the pass: the sheet goes through once; each drum lays its ink at its nip, a straight line across the sheet moving down
// it (the feed), drum 2's nip a fixed distance behind drum 1's (the drums' spacing). front([y1, y2]) gives the two nips
// in page CSS px; only the rows a nip crossed are laid again.
export function writer(piece, look, o, cv) {
  const P = layers(piece, look, o), img = new ImageData(P.cw, P.ch), g = cv.getContext('2d'), n = P.L.length;
  cv.width = P.cw; cv.height = P.ch;
  let prev = new Array(n).fill(0);
  const rows = y => Math.round(Math.min(P.ch, Math.max(0, (y - o.at[1] + P.pad) * o.d)));
  const lay = fr => { const lo = Math.min(...prev.map((p, k) => Math.min(p, fr[k]))), hi = Math.max(...prev.map((p, k) => Math.max(p, fr[k])));
    if (hi > lo) { composite(P, img, lo, hi, fr); g.putImageData(img, 0, 0, 0, lo, P.cw, hi - lo); } prev = fr; };
  return { cw: P.cw, ch: P.ch, pad: P.pad, front(ys) { lay(P.L.map((_, k) => rows(ys[k] ?? -1e9))); }, done() { lay(P.L.map(() => P.ch)); } };
}

// a capital's measured box in a face (CSS px at size px): its ink's left, top (above the baseline), width and depth
const MC = {};
export function glyph(font, ch, px) {
  const g = MC.g ??= document.createElement('canvas').getContext('2d'); g.font = `${px}px ${font}`;
  const m = g.measureText(ch);
  return { l: -m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, w: m.actualBoundingBoxLeft + m.actualBoundingBoxRight, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent, adv: m.width };
}
// a capital sized so its cap height is cap px: the font size, and the box at that size
export function capFit(font, ch, cap) { const H = glyph(font, 'H', 100); const px = 100 * cap / H.asc; return { px, ...glyph(font, ch, px) }; }
