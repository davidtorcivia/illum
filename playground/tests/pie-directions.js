// PIE direction studies (research/24-pie.md): the palettes, set for wekwos.com's grounds (its paper #efe7d6 and its ink
// sections #0e0d0b), and the printer that turns a piece (a list of marks) into a canvas.
import { field, render, writer } from '../kit/styles/pie-relief.js';
import { renderRock, rockWriter } from '../kit/styles/pie-paint.js';
import * as potter from '../kit/styles/pie-potter.js';
import * as rock from '../kit/styles/pie-rock.js';
import * as smith from '../kit/styles/pie-smith.js';

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
export const GROUND = { light: '#efe7d6', dark: '#0e0d0b' }, TEXT = { light: '#0e0d0b', dark: '#f6f1e4' };
const BRONZE = [[.1, .08, .05], [.2, .16, .09], [.32, .26, .15], [.46, .37, .21], [.62, .51, .31], [.82, .72, .5]];
const GOLD = [[.36, .25, .07], [.62, .46, .16], [.84, .67, .3], [.97, .87, .55]];
// a look's depth references are in units of the piece's own measure (u: the bead pitch, the pit, the ridge pitch)
export const LOOKS = {
  potter: { light: u => ({ kind: 'clay', shadow: hex('#2a2219'), lip: [1, .985, .95], ks: 1.7, kh: .65, kc: .7, dref: .5 * u }),
            // in the ink: the dark burnished clay the beakers were fired to, its impressions filled with white lime paste
            dark: u => ({ kind: 'clay', paste: hex('#f6f1e4'), pk: .9, shadow: [0, 0, 0], lip: [.62, .56, .48], ks: .6, kh: .55, kc: 0, dref: .5 * u }) },
  // the rock (stage 2): iron-oxide red, a little warmer and brighter than the site's oxblood where the brush laid it thick,
  // pooled dark in the pits, thin and dry paler; on the ink, the same rock and a brighter paint
  rock: { light: () => ({ paper: hex('#efe7d6'), lift: .5, tone: [1.04, .99, .95], pecked: [.88, .84, .8], paint: [hex('#cf7652'), hex('#a5361e'), hex('#561810')] }),
          dark: () => ({ paper: hex('#0e0d0b'), lift: .55, tone: [.9, .86, .84], pecked: [.82, .78, .74], paint: [hex('#d27159'), hex('#c4432a'), hex('#6a1d11')] }) },
  smith: { light: u => ({ kind: 'metal', ramp: BRONZE, gold: GOLD, base: .45, kd: 1.1, spec: .3, patina: hex('#2e5b3a').map(v => v * 1.3), pk: .7, pref: .12 * u }),
           dark: u => ({ kind: 'metal', ramp: BRONZE, gold: GOLD, base: .5, kd: 1.1, spec: .35, patina: hex('#2e5b3a').map(v => v * 1.4), pk: .65, pref: .12 * u }) },
};
export const DIRS = { potter, rock, smith };
export const NAMES = { potter: 'A · the potter', rock: 'B · the rock', smith: 'C · the smith' };

// a piece printed onto its own canvas at zoom; live: returned empty with its writer (?draw)
// (stage 10) a rock piece's raster is sized from its paint, not its layout box: every pit's reach plus the paint's
// margin (the groove-depth and settle blurs), so nothing the carver laid outside the box is cut off. The canvas is then
// shifted back so the piece's own origin stays where the page put it.
const SHIFTED = new WeakMap();
function painted(piece) { let v = SHIFTED.get(piece); if (v) return v;
  const ms = piece.marks({}), pad = Math.max(2, 3 * (piece.g ?? 1)); let x0 = 0, y0 = 0, x1 = piece.W, y1 = piece.H;
  for (const m of ms) if (m.k === 'pit') { const e = m.r * 1.35; x0 = Math.min(x0, m.x - e); y0 = Math.min(y0, m.y - e); x1 = Math.max(x1, m.x + e); y1 = Math.max(y1, m.y + e); }
  const ox = Math.ceil(Math.max(0, -x0 + pad)), oy = Math.ceil(Math.max(0, -y0 + pad)), W = Math.ceil(Math.max(piece.W, x1 + pad) + ox), H = Math.ceil(Math.max(piece.H, y1 + pad) + oy);
  const sh = ms.map(m => m.k === 'pit' ? { ...m, x: m.x + ox, y: m.y + oy } : m.p ? { ...m, p: m.p.map(([x, y]) => [x + ox, y + oy]) } : m);
  v = { ...piece, W, H, ox, oy, marks: () => sh }; SHIFTED.set(piece, v); return v; }
// average SS x SS blocks of a supersampled ImageData down to w x h (colour weighted by its alpha)
function down(img, w, h, SS) { const { width: W, data: A } = img, Hh = img.height, out = new ImageData(w, h), O = out.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let r = 0, gg = 0, b = 0, a = 0, n = 0;
    for (let j = 0; j < SS; j++) { const yy = y * SS + j; if (yy >= Hh) continue; for (let i = 0; i < SS; i++) { const xx = x * SS + i; if (xx >= W) continue; const k = (yy * W + xx) * 4, al = A[k + 3]; r += A[k] * al; gg += A[k + 1] * al; b += A[k + 2] * al; a += al; n++; } }
    const o = (y * w + x) * 4; if (a) { O[o] = r / a; O[o + 1] = gg / a; O[o + 2] = b / a; } O[o + 3] = n ? a / n : 0; }
  return out; }
export function print(key, theme, piece0, { zoom = 1, dpr = Math.min(2, devicePixelRatio || 1), live = false } = {}) {
  const piece = key === 'rock' ? painted(piece0) : piece0;
  const d = dpr * zoom, F = field(piece.W, piece.H, d), cv = document.createElement('canvas');
  cv.width = F.cw; cv.height = F.ch; cv.style.width = piece.W * zoom + 'px'; cv.style.height = piece.H * zoom + 'px';
  if (piece.ox || piece.oy) { cv.style.transform = `translate(${-piece.ox * zoom}px, ${-piece.oy * zoom}px)`; cv.dataset.ox = piece.ox; cv.dataset.oy = piece.oy; }
  const g = cv.getContext('2d'), look = LOOKS[key][theme](piece.u ?? 4);
  if (key === 'rock') { if (live) return { cv, w: rockWriter(F, piece, look, g, { dur: piece.dur ?? 2400 }) };
    // (stage 12) on a 1x screen, printed at twice the device's resolution and averaged down, so a painted edge is antialiased: the paint's
    // own edge is a threshold of the pecked hollow, a hard step in a single pixel otherwise. The edge zone still opens by
    // the screen's own size (zdpr), so a 1x page stays as crisp as stage 6.
    // (only below 1.5 device px a CSS px: at 2x a step is half a CSS px, and supersampling there would double the cost)
    const SS = d < 1.5 ? 2 : 1; if (SS === 1) { g.putImageData(renderRock(F, piece, look), 0, 0); return cv; }
    const S2 = field(piece.W, piece.H, d * SS), img = (S2.zdpr = d, renderRock(S2, piece, look)); g.putImageData(down(img, F.cw, F.ch, SS), 0, 0); return cv; }
  const marks = piece.marks(F);
  if (live) return { cv, w: writer(F, marks, look, g, { dur: piece.dur ?? 1800 }) };
  g.putImageData(render(F, marks, look), 0, 0); return cv;
}
