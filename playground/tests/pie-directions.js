// PIE direction studies (research/24-pie.md): the palettes, set for wekwos.com's grounds (its paper #efe7d6 and its ink
// sections #0e0d0b), and the printer that turns a piece (a list of marks) into a canvas.
import { field, render, writer } from '../kit/styles/pie-relief.js';
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
  rock: { light: u => ({ kind: 'rock', paint: hex('#8e2a17'), pk: .96, shadow: hex('#2a2219'), light: [1, .985, .95], ks: .7, kh: .35, dref: .55 * u }),
          dark: u => ({ kind: 'rock', paint: hex('#c4472a'), pk: .95, shadow: [0, 0, 0], light: [.5, .46, .4], ks: .6, kh: .5, dref: .55 * u }) },
  smith: { light: u => ({ kind: 'metal', ramp: BRONZE, gold: GOLD, base: .45, kd: 1.1, spec: .3, patina: hex('#2e5b3a').map(v => v * 1.3), pk: .7, pref: .12 * u }),
           dark: u => ({ kind: 'metal', ramp: BRONZE, gold: GOLD, base: .5, kd: 1.1, spec: .35, patina: hex('#2e5b3a').map(v => v * 1.4), pk: .65, pref: .12 * u }) },
};
export const DIRS = { potter, rock, smith };
export const NAMES = { potter: 'A · the potter', rock: 'B · the rock', smith: 'C · the smith' };

// a piece printed onto its own canvas at zoom; live: returned empty with its writer (?draw)
export function print(key, theme, piece, { zoom = 1, dpr = Math.min(2, devicePixelRatio || 1), live = false } = {}) {
  const d = dpr * zoom, F = field(piece.W, piece.H, d), cv = document.createElement('canvas');
  cv.width = F.cw; cv.height = F.ch; cv.style.width = piece.W * zoom + 'px'; cv.style.height = piece.H * zoom + 'px';
  const g = cv.getContext('2d'), look = LOOKS[key][theme](piece.u ?? 4), marks = piece.marks(F);
  if (live) return { cv, w: writer(F, marks, look, g, { dur: piece.dur ?? 1800 }) };
  g.putImageData(render(F, marks, look), 0, 0); return cv;
}
