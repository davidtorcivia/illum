// Cyber, direction B: THE PHOSPHOR SCREEN (a study; research/15-cyber.md). Not ink: light. The medium is a phosphor struck by
// an electron beam, so the marks are made as the beam makes them: a path walked in time, its energy laid where the beam
// is (more where it slows: the turning ends of a Lissajous figure, the corners of a vector, the dwell before a stroke;
// almost none on a square wave's fast edge, which a scope shows as a ghost), then spread as a phosphor spreads it (a sharp
// core and a wide faint bloom) and mapped to colour as a phosphor saturates (the core goes to white, the bloom keeps the hue).
// A storage tube (Tektronix 4010/4014) keeps what it was written with: the writing beam flashes bright, and the stored trace
// settles to a steady glow; ?draw shows that. Dark: the light itself, added to the page. Light: the hard copy the
// Tektronix 4631 made of the stored screen (a raster scan of it onto grey dry-silver paper: dark lines, the scan visible).
//   drop initial: the capital written by the beam (Hershey Roman Simplex, the vector letter of the NBS, 1967), dwell at
//     every stroke's ends; paraph: a Lissajous figure (the frequency ratio of the paragraph's place); filler: a scope sweep
//     across the gap (a sine, a ringing square edge, a damped burst); frame (pre): the graticule of a Tektronix scope
//     (8 × 10 divisions, the centre lines ticked in fifths) round the code.
// Elements return { beams: [{ pts (page px), time?: true (pts already spaced in equal time), w (beam σ, px), e?, grat? }] }.
import { HERSHEY, smooth } from './cyber-a.js';

const fnv = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.codePointAt(0), 16777619); return h >>> 0; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const rng = (seed, name) => mulberry(fnv(name + ':' + seed));
const TAU = Math.PI * 2;

// ---- the beam's walk -------------------------------------------------------------------------------------------------------------
// A vector beam: deflection settles into and out of every stroke (the beam slows: speed falls to a quarter over `ramp` px at
// each end), and dwells at the ends (`dwell`, in px of travel at full speed). A traced beam (time: true): the points are
// already where the beam is at equal steps of time (a sweep, a Lissajous), each its share of energy.
// -> samples: Float32Array [x, y, e, t] (t: 0..1 over the element, in writing order; e: energy, 1 per px at full speed)
export function walk(beams) {
  const out = []; let T = 0;
  const push = (x, y, e, w) => { out.push(x, y, e, T, w); };
  for (const b of beams) {
    const P = b.pts, w = b.w, g = b.e ?? 1;
    if (b.time) { for (let i = 0; i < P.length; i++) { push(P[i][0], P[i][1], (P[i][2] ?? 1) * g, w); T += P[i][2] ?? 1; } continue; }
    // each straight run of the polyline is a vector of its own (a character generator's strokes are straight segments):
    // the beam settles into and out of each, and lingers a little at every vertex, so the corners burn brighter
    const ramp = b.ramp ?? Math.max(2, w * 4), dwell = b.dwell ?? w * 6;
    push(P[0][0], P[0][1], dwell * g, w); T += dwell;
    for (let i = 1; i < P.length; i++) { const [x0, y0] = P[i - 1], [x1, y1] = P[i], l = Math.hypot(x1 - x0, y1 - y0); let s = 0;
      while (s < l) { const v = Math.max(.3, Math.min(1, Math.min(s, l - s) / ramp)), ds = .35 * v; s += ds; if (s >= l) break; const f = s / l;
        push(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, .35 * g, w); T += .35; }
      if (i < P.length - 1) { push(x1, y1, dwell * .12 * g, w); T += dwell * .12; } }
    push(P.at(-1)[0], P.at(-1)[1], dwell * .8 * g, w); T += dwell * .8;
  }
  const S = new Float32Array(out); for (let k = 3; k < S.length; k += 5) S[k] /= Math.max(T, 1e-6);
  return S;
}

// ---- the phosphor --------------------------------------------------------------------------------------------------------------------
// Energy splatted at device px, spread twice (core σ = the beam, bloom σ ≈ 3 beams: research/15 measured the halo at ~2× the core's width at half height on a storage tube and on a P31 scope) and mapped to colour as a phosphor
// saturates: each channel 1 − exp(−I·gain), the green gaining fastest, so a bright core runs to white and the bloom keeps
// the hue. t: the beam's place (0..1) for ?draw (what it has passed is stored; what it passed just now still flashes).
function boxes(sigma, n = 3) { const wI = Math.floor(Math.sqrt(12 * sigma * sigma / n + 1)), wl = wI % 2 ? wI : wI - 1, wu = wl + 2, m = Math.round((12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4));
  return Array.from({ length: n }, (_, i) => ((i < m ? wl : wu) - 1) / 2); }
function blur1(A, B, w, h, r, horiz) { const n = horiz ? w : h, m = horiz ? h : w, k = 1 / (2 * r + 1);
  for (let j = 0; j < m; j++) { const at = i => horiz ? j * w + i : i * w + j; let acc = 0;
    for (let i = -r - 1; i < r; i++) acc += i >= 0 && i < n ? A[at(i)] : 0;
    for (let i = 0; i < n; i++) { const a = i + r, b = i - r - 1; acc += (a < n ? A[at(a)] : 0) - (b >= 0 ? A[at(b)] : 0); B[at(i)] = acc * k; } } }
function gauss(A, w, h, sigma) { if (sigma < .3) return A.slice(); let X = A.slice(), Y = new Float32Array(A.length);
  for (const r of boxes(sigma)) { const ri = Math.max(0, Math.round(r)); blur1(X, Y, w, h, ri, true); blur1(Y, X, w, h, ri, false); } return X; }

export const palette = {
  // P31 (the scopes' and the 4010's green): the bloom's hue, the gains that turn a strong core white
  dark: { gain: [.42, 1.0, .55], hue: 'P31', mode: 'light' },
  // the Tektronix 4631's dry-silver hard copy: a cool dark grey on the grey-white paper (sampled; research/15)
  light: { ink: [46, 46, 50], mode: 'copy' },
};

// region: [x0, y0, x1, y1] page px; returns a canvas (device px) to draw at x0, y0
export function expose(S, region, { dpr = 2, dark = true, t = Infinity, flash = 2.2, tau = .025, k = 2.4 } = {}) {
  const [x0, y0, x1, y1] = region, W = Math.ceil((x1 - x0) * dpr), H = Math.ceil((y1 - y0) * dpr), E = new Float32Array(W * H);
  let wmax = 0;
  for (let i = 0; i < S.length; i += 5) { const ts = S[i + 3]; if (ts > t) break;
    const fx = (S[i] - x0) * dpr - .5, fy = (S[i + 1] - y0) * dpr - .5, ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy;
    if (ix < 0 || iy < 0 || ix >= W - 1 || iy >= H - 1) continue;
    const e = S[i + 2] * dpr * (t === Infinity ? 1 : 1 + flash * Math.exp(-(t - ts) / tau)); wmax = Math.max(wmax, S[i + 4]);
    E[iy * W + ix] += e * (1 - ax) * (1 - ay); E[iy * W + ix + 1] += e * ax * (1 - ay); E[(iy + 1) * W + ix] += e * (1 - ax) * ay; E[(iy + 1) * W + ix + 1] += e * ax * ay; }
  const sc = wmax * dpr, core = gauss(E, W, H, sc * .7), halo = gauss(E, W, H, sc * 2.6), nrm = Math.sqrt(TAU) * sc;
  const c = new OffscreenCanvas(W, H), g = c.getContext('2d'), im = g.createImageData(W, H), d = im.data;
  if (dark) { const G = palette.dark.gain;
    for (let q = 0; q < W * H; q++) { const I = (core[q] * .62 + halo[q] * .38) * nrm / dpr * k; if (I < .002) continue;
      const r = 1 - Math.exp(-I * G[0]), gg = 1 - Math.exp(-I * G[1]), b = 1 - Math.exp(-I * G[2]), a = Math.max(r, gg, b);
      d[q * 4] = r / a * 255; d[q * 4 + 1] = gg / a * 255; d[q * 4 + 2] = b / a * 255; d[q * 4 + 3] = a * 255; } }
  else { const ink = palette.light.ink;
    // the hard copy: the stored trace scanned line by line (a scan line every 1.25 CSS px: a fine raster)
    for (let j = 0; j < H; j++) { const scan = .9 + .1 * Math.cos(TAU * (y0 + j / dpr) / 1.25);
      for (let i = 0; i < W; i++) { const q = j * W + i, I = core[q] * 1.15 * nrm / dpr * k; if (I < .004) continue;
        const a = (1 - Math.exp(-I * 1.6)) * scan; d[q * 4] = ink[0]; d[q * 4 + 1] = ink[1]; d[q * 4 + 2] = ink[2]; d[q * 4 + 3] = Math.min(1, a) * 255; } } }
  g.putImageData(im, 0, 0); return c;
}
// where an element's light falls: its samples' box, grown by the bloom
export function regionOf(S, pad = 0) { let a = [Infinity, Infinity, -Infinity, -Infinity], w = 0;
  for (let i = 0; i < S.length; i += 5) { a = [Math.min(a[0], S[i]), Math.min(a[1], S[i + 1]), Math.max(a[2], S[i]), Math.max(a[3], S[i + 1])]; w = Math.max(w, S[i + 4]); }
  const p = w * 3 * 3 + 2 + pad; return [Math.floor(a[0] - p), Math.floor(a[1] - p), Math.ceil(a[2] + p), Math.ceil(a[3] + p)]; }

// ---- the drop initial: the capital written by the beam ------------------------------------------------------------------------
// Hershey's Roman Simplex at the drop's height, each segment a vector (dwell and settle at its ends: the bright points where
// a vector letter's strokes begin and end). Beam σ: a 30th of the cap height (a big letter is a zoomed small one: on a 4014
// the beam is ~ 1/40 of a large character's height).
export function initial({ ch, G, u, seed = 1 }) {
  const [x0, y0, x1, y1] = G.box, cap = (y1 - y0) * .96, gl = HERSHEY[ch] ?? HERSHEY.B, k = cap / 21, base = y1;
  const xs = gl.s.flat().map(p => p[0]), cx = (x0 + x1) / 2 - (Math.min(...xs) + Math.max(...xs)) / 2 * k;
  // the character generator's letter is its straight vectors (Hershey's own segments, not rounded), slanted ~10° as the
  // Tektronix readout's characters are
  const sl = Math.tan(10 * Math.PI / 180);
  return { beams: gl.s.map(s => ({ pts: s.map(([gx, gy]) => [cx + gx * k - (gy - 9 + 10.5) * k * sl, base + (gy - 9) * k]), w: Math.max(.9, cap / 46) })) };
}
initial.width = () => .78;
initial.lines = 4;

// ---- the paraph: a Lissajous figure ---------------------------------------------------------------------------------------------
// x = sin(a·t + φ), y = sin(b·t): the scope's figure for two frequencies in the ratio a : b (1:1 a tilted ellipse, 1:2,
// 2:3, 3:4 ...), traced once round in equal time, so the beam lingers, and burns brighter, where it turns at the edges.
const RATIOS = [[3, 2], [3, 4], [5, 4], [2, 3], [4, 5]];
export function paraph(x, base, u, seed, rich = .5, n = 1) {
  const [a, b] = RATIOS[(n - 1) % RATIOS.length], r = u * 1.05, c = [x + u * .82, base - u * .55], ph = Math.PI / 2 / b + .35, N = 2400, pts = [];
  for (let i = 0; i <= N; i++) { const t = i / N * TAU; pts.push([c[0] + r * Math.sin(a * t + ph), c[1] - r * Math.sin(b * t), 2.2 * r * TAU / N]); }
  return { beams: [{ pts, time: true, w: Math.max(.6, u * .07) }] };
}

// ---- the filler: a sweep ----------------------------------------------------------------------------------------------------------
// The time base sweeps the beam left to right at an even speed across the gap; the signal moves it up and down. Where the
// signal is fast the beam is fast, so a square wave's edges are all but dark. kinds: 'sine' | 'ring' (a square edge that
// overshoots and rings down) | 'burst' (a damped sine).
export const FILLERS = ['ring', 'sine', 'burst'];
export function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  const u = yBase - yTop, L = x1 - x0, A = u * .62, yc = yBase - u * .5, N = Math.ceil(L * 10), r = rng(seed, 'sweep'), pts = [];
  const cyc = Math.max(2, Math.round(L / (u * (kind === 'sine' ? 5.5 : kind === 'burst' ? 16 : 9)))), ph = r() * TAU;
  const sig = f => { const p = f * cyc;
    if (kind === 'sine') return Math.sin(TAU * p + ph);
    if (kind === 'burst') { const q = p % 1; return Math.exp(-q * 3) * Math.sin(TAU * q * 4.5); }
    // a square wave through a slightly underdamped amplifier: the edge rises in a 30th of a period, overshoots, rings
    const q = p % 1, half = q < .5 ? q : q - .5, sgn = q < .5 ? 1 : -1, rise = .012;
    const step = half < rise ? -1 + 2 * half / rise : 1 + .3 * Math.exp(-(half - rise) * 16) * Math.cos(TAU * (half - rise) * 8);
    return sgn * step * .8; };
  for (let i = 0; i <= N; i++) { const f = i / N; pts.push([x0 + f * L, yc - A * sig(f), L / N]); }
  return { beams: [{ pts, time: true, w: Math.max(.7, u * .075) }] };
}

// ---- the frame (code): the graticule ---------------------------------------------------------------------------------------------
// A scope's graticule round the code: the outer rule of the 8 × 10 division field (divisions square, as many as the box
// takes), a tick at every division along the edges, and the two centre lines' minor ticks (five to a division) along the
// edges, where they do not cross the text; the graticule is lit (edge-lit scribing: a thin even line, no bloom, the
// scale-illumination's warm tint), the code is what the screen shows.
export function code({ box, u }) {
  const [X0, Y0, X1, Y1] = box, nx = 10, div = (X1 - X0) / nx, ny = Math.max(2, Math.round((Y1 - Y0) / div)), Y1g = Y0 + ny * div, segs = [], t = u * .55, mt = u * .3;
  segs.push([[X0, Y0], [X1, Y0]], [[X1, Y0], [X1, Y1g]], [[X1, Y1g], [X0, Y1g]], [[X0, Y1g], [X0, Y0]]);
  for (let i = 1; i < nx; i++) { const x = X0 + i * div; segs.push([[x, Y0], [x, Y0 + t]], [[x, Y1g], [x, Y1g - t]]); }
  for (let j = 1; j < ny; j++) { const y = Y0 + j * div; segs.push([[X0, y], [X0 + t, y]], [[X1, y], [X1 - t, y]]); }
  for (let i = 0; i < nx * 5; i++) { if (i % 5) { const x = X0 + i * div / 5; segs.push([[x, Y0], [x, Y0 + mt]], [[x, Y1g], [x, Y1g - mt]]); } }
  for (let j = 0; j < ny * 5; j++) { if (j % 5) { const y = Y0 + j * div / 5; segs.push([[X0, y], [X0 + mt, y]], [[X1, y], [X1 - mt, y]]); } }
  return { grat: segs, box: [X0, Y0, X1, Y1g] };
}
export const frames = { code };
export default { label: 'Cyber · the phosphor screen', initial, paraph, filler, frames, palette, walk, expose, regionOf, FILLERS };
