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
  rock: { light: () => ({ paper: hex('#efe7d6'), lift: .5, tone: [1.04, .99, .95], pecked: [.88, .84, .8], paint: [hex('#b9624b'), hex('#a5361e'), hex('#561810')] }),
          dark: () => ({ paper: hex('#0e0d0b'), lift: .55, tone: [.9, .86, .84], pecked: [.82, .78, .74], paint: [hex('#d27159'), hex('#c4432a'), hex('#6a1d11')] }) },
  smith: { light: u => ({ kind: 'metal', ramp: BRONZE, gold: GOLD, base: .45, kd: 1.1, spec: .3, patina: hex('#2e5b3a').map(v => v * 1.3), pk: .7, pref: .12 * u }),
           dark: u => ({ kind: 'metal', ramp: BRONZE, gold: GOLD, base: .5, kd: 1.1, spec: .35, patina: hex('#2e5b3a').map(v => v * 1.4), pk: .65, pref: .12 * u }) },
};
export const DIRS = { potter, rock, smith };
export const NAMES = { potter: 'A · the potter', rock: 'B · the rock', smith: 'C · the smith' };

// a piece printed onto its own canvas at zoom; live: returned empty with its writer (?draw)
export function print(key, theme, piece, { zoom = 1, dpr = Math.min(2, devicePixelRatio || 1), live = false } = {}) {
  const d = dpr * zoom, F = field(piece.W, piece.H, d), cv = document.createElement('canvas');
  cv.width = F.cw; cv.height = F.ch; cv.style.width = piece.W * zoom + 'px'; cv.style.height = piece.H * zoom + 'px';
  const g = cv.getContext('2d'), look = LOOKS[key][theme](piece.u ?? 4);
  if (key === 'rock') { if (live) return { cv, w: rockWriter(F, piece, look, g, { dur: piece.dur ?? 2400 }) }; g.putImageData(renderRock(F, piece, look), 0, 0); return cv; }
  const marks = piece.marks(F);
  if (live) return { cv, w: writer(F, marks, look, g, { dur: piece.dur ?? 1800 }) };
  g.putImageData(render(F, marks, look), 0, 0); return cv;
}
