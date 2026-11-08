// Nouveau by hand: the whiplash written with the ink engine's pen, and the plant's colour laid as watercolour washes in the
// same medium (kit/medium.js) — research/19-nouveau.md.
//   inkWrite(bake, strokes, rgb, { dpr, box, seed })  each stroke { p (evenly spaced points), w (half-widths) } as made by
//     nouveau-line.js stroke(): a pointed pen follows it at a hand's pace (slowing into turns and at its ends, quick through
//     the long runs), its designed swell given as pressure (the clubs, the eye), so the ink pools where the hand slows
//     and runs thinner and a little dry where it is quick. A spiral's eye is wound in by the same movement and pools.
//   washPour(bake, L, rgb, { dpr, seed, ink, edge, bloom })  a mask L ({ M, w, h, x0, y0, res }) laid as one wash: a
//     transparent coat (the paper's tooth showing through and catching the pigment: granulation), the pigment drawn to
//     the wash's edge as it dries (the dark rim of a watercolour), a slow unevenness, a back-run or two (a bloom: a pale
//     cauliflower with a dark lip) where water crept back into a drying wash; the water levels and creeps a little.
// bake: a 2D context whose device px are page px × dpr, with no transform (as rubricate's bake).
import { createMedium, Pen } from '../medium.js';
import { boxBlur as blur } from '../inkletter.js';
import { supported } from '../writer.js';
import { noise2, stream } from '../marks.js';

let shared = null;
function mediumFor(w, h, dpr) {
  if (shared && shared.cv.width >= w && shared.cv.height >= h && shared.dpr === dpr && !shared.Md.gl.isContextLost()) return shared;
  // (a larger window: the sheet made anew at its size, in the same context; kit/inkletter.js mediumFor)
  if (shared && shared.dpr === dpr && !shared.Md.gl.isContextLost()) { shared.Md.resize(Math.max(w, 640), Math.max(h, 640)); shared.Md.settings.over = true; return shared; }
  shared?.Md.gl.getExtension('WEBGL_lose_context')?.loseContext();
  const cv = document.createElement('canvas'); cv.width = Math.max(w, 640); cv.height = Math.max(h, 640);
  const Md = createMedium(cv, { dpr, paper: [255, 255, 255] }); Md.settings.over = true;
  return shared = { cv, Md, dpr };
}
// the medium made ahead (its context and shaders), while the page's letters load, as kit/inkletter.js warmInk
export function warmWash(dpr = Math.min(2, globalThis.devicePixelRatio || 1)) { if (!supported()) return; try { mediumFor(1, 1, dpr); } catch {} }
// the window [x0, y0, x1, y1] (page px) on the medium: clear it, make its paper, run f(Md, ox, oy), dry it, press it
function inWindow(bake, box, dpr, rgb, wet, f) {
  const ox = Math.floor(box[0]), oy = Math.floor(box[1]), cw = Math.ceil((box[2] - ox) * dpr), ch = Math.ceil((box[3] - oy) * dpr);
  const { cv, Md } = mediumFor(cw, ch, dpr);
  Md.clear(); Md.wetness(wet); Md.settings.ink = rgb; Md.makePaper([ox * dpr, oy * dpr], [0, 0, cw, ch]);
  f(Md, ox, oy, cw, ch);
  Md.finish(); Md.render([0, 0, cw, ch]);
  bake.save(); bake.setTransform(1, 0, 0, 1, 0, 0); bake.drawImage(cv, 0, 0, cw, ch, Math.round(ox * dpr), Math.round(oy * dpr), cw, ch); bake.restore();
}

// ---- the pen -------------------------------------------------------------------------------------------------------------------
// the hand's pace along a stroke (px per ms): quick on the long runs, slower into a turn (as sqrt of its radius), easing
// in at the start and out at the end
function pace(S, vmax) {
  const { p } = S, n = p.length, t = [0];
  for (let i = 1; i < n; i++) {
    const a = p[Math.max(0, i - 4)], b = p[i], c = p[Math.min(n - 1, i + 4)];
    const h1 = Math.atan2(b[1] - a[1], b[0] - a[0]), h2 = Math.atan2(c[1] - b[1], c[0] - b[0]); let dh = h2 - h1; dh -= Math.round(dh / (2 * Math.PI)) * 2 * Math.PI;
    const R = Math.hypot(c[0] - a[0], c[1] - a[1]) / 2 / (Math.abs(dh) + 1e-4), f = i / (n - 1);
    const v = vmax * Math.min(1, Math.sqrt(R / 60)) * (.25 + .75 * Math.sin(Math.min(1, f * 6, (1 - f) * 5) * Math.PI / 2));
    t.push(t[i - 1] + Math.hypot(b[0] - p[i - 1][0], b[1] - p[i - 1][1]) / Math.max(.02, v));
  }
  return t;
}
export function inkWrite(bake, strokes, rgb, { dpr = 2, box, seed = 1, wet = .42, speed = .8, drift = 0, brush = 0 } = {}) {
  if (!supported()) return false;
  const r = stream(seed, 'hand'), wob = noise2(seed ^ 0x5e);
  inWindow(bake, box, dpr, rgb, wet, (Md, ox, oy) => {
    const pen = new Pen(Md, { exact: true, flex: 0, use: 4, angle: .62 }), eyes = [];
    for (const S of strokes) {
      if (brush) { brushStroke(Md, S, ox, oy, r, wob, speed, brush, dpr, eyes); continue; }
      const hair = Math.max(.3, S.hair ?? Math.min(...S.w)), T = pace(S, speed * (.9 + r() * .2)), ph = r() * 50;
      pen.dip(); pen.width = .15; pen.hairline = hair * 2;
      // (a pointed pen: its edge as thin as its thickness, so the width is all pressure; the hand never quite even)
      // (the hand drifts a little off the drawn line and back, slowly, and its pressure is never quite even)
      for (let i = 0; i < S.p.length; i++) { const a = S.p[Math.max(0, i - 1)], b = S.p[Math.min(S.p.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, f = Math.min(1, i / 12, (S.p.length - 1 - i) / 12);
        const off = drift * f * (wob(i * .012 + ph, 3 + ph) - .5) * 2;
        pen.hand(S.p[i][0] - dy / l * off - ox, S.p[i][1] + dx / l * off - oy, .5, T[i], S.w[i] / hair * (1 + .1 * (wob(i * .01 + ph, ph) - .5))); }
      // the eye: where the pen stops, turning, it rests, and the ink it carries drops and spreads into a pool
      if (S.eye) { const [cx, cy, er0] = S.eye, er = er0 * 1.1, R = Math.ceil((er + 1) * dpr), n = 2 * R + 1, D = new Uint8Array(n * n * 4);
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const d = Math.hypot(i - R, j - R) / dpr, c = Math.max(0, Math.min(1, er - d + .5)); if (!c) continue;
          const q = (j * n + i) * 4; D[q] = c * 255; D[q + 1] = Math.min(255, (.62 + .25 * (d / er) ** 3) * 255); D[q + 2] = 0; }
        eyes.push([D, n, [(cx - ox) * dpr - R, (cy - oy) * dpr - R, n, n]]); }
      const end = T.at(-1) + 60;
      for (let t = 0; t <= end; t += 8) { pen.update(t); Md.step(8); }
      pen.lift(); for (const [D, n, rect] of eyes.splice(0)) Md.pour(D, n, n, rect); Md.step(16);
    }
    for (let k = 0; k < 20; k++) Md.step(16);
  });
  return true;
}

// ---- the brush ----------------------------------------------------------------------------------------------------------------
// A pointed watercolour brush: n hairs side by side across the stroke's width, all moving together (one hand), each its own
// line of ink in the same wet medium (so they merge where they touch, as a loaded brush lays one stroke). Where the stroke
// swells the hairs spread to its width; where it is quick, a hair runs short of ink and catches only the paper's tooth (dry
// brush); at the lift-off the hairs part and end one by one (split hairs). Each hair's own load and length differ.
function brushStroke(Md, S, ox, oy, r, wob, speed, n, dpr, eyes) {
  const { p, w } = S, m = p.length, wmax = Math.max(...w), T = pace(S, speed * (.9 + r() * .2)), N = [];
  for (let i = 0; i < m; i++) { const a = p[Math.max(0, i - 2)], b = p[Math.min(m - 1, i + 2)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; N.push([-dy / l, dx / l]); }
  const pens = [];
  for (let k = 0; k < n; k++) {
    const u = (k + .5) / n * 2 - 1 + (r() - .5) * .25, load = .55 + r() * .45, cut = 1 - r() * r() * .16, split = (r() - .5) * 2;
    const pen = new Pen(Md, { exact: true, flex: 0, use: 6 + r() * 6, angle: .62 }); pen.dip(); pen.charge = load; pen.width = .12;
    const hw = Math.max(.32, wmax / n * 1.35); pen.hairline = hw * 2;
    const last = Math.max(4, Math.round((m - 1) * cut));
    for (let i = 0; i <= last; i++) { const f = i / (m - 1), lift = Math.max(0, (f - .86) / .14), sp = 1 + lift * lift * 1.4 + .25 * (wob(i * .02 + k * 3, k) - .5);
      const off = w[i] * u * sp * .92 + split * lift * lift * wmax * .6;
      pen.hand(p[i][0] + N[i][0] * off - ox, p[i][1] + N[i][1] * off - oy, .5, T[i], Math.max(.35, Math.min(1.6, w[i] / wmax * 1.2 + .25)) * (1 - .5 * lift)); }
    pens.push(pen);
  }
  if (S.eye) { const [cx, cy, er0] = S.eye, er = er0 * 1.05, R = Math.ceil((er + 1) * dpr), nn = 2 * R + 1, D = new Uint8Array(nn * nn * 4);
    for (let j = 0; j < nn; j++) for (let i = 0; i < nn; i++) { const d = Math.hypot(i - R, j - R) / dpr, c = Math.max(0, Math.min(1, er - d + .5)); if (!c) continue;
      const q = (j * nn + i) * 4; D[q] = c * 255; D[q + 1] = Math.min(255, (.55 + .3 * (d / er) ** 2) * 255); D[q + 2] = 0; }
    eyes.push([D, nn, [(cx - ox) * dpr - R, (cy - oy) * dpr - R, nn, nn]]); }
  const end = T.at(-1) + 60;
  for (let t = 0; t <= end; t += 8) { for (const pen of pens) pen.update(t); Md.step(8); }
  for (const pen of pens) pen.lift(); for (const [D, nn, rect] of eyes.splice(0)) Md.pour(D, nn, nn, rect); Md.step(16);
}

// ---- the line into the wash ---------------------------------------------------------------------------------------------------
// The key line laid in the same sheet as the water still standing in some washes: the water is poured first (coverage,
// no pigment: it only lends the ink somewhere to go), then the line; where the line lies in damp wash its ink runs out
// into it along the fibres and settles soft and dark beside it; on dry paper it spreads only a little, more where the
// pen paused (its ends and its heaviest parts). damp: { M } on the line's grid (0 dry .. 1 wet).
export function lineInto(bake, L, damp, rgb, { dpr = 2, wet = .9, ink = 1.3, onlyDamp = false } = {}) {
  if (!supported()) return false;
  const { M, w, h, x0, y0, res } = L, D = new Uint8Array(w * h * 4);
  for (let q = 0; q < w * h; q++) { const m = M[q], d = damp ? damp[q] : 0; if (!m && !d) continue;
    D[q * 4] = Math.round(Math.max(m, d * .95) * 255); D[q * 4 + 1] = Math.round(Math.min(1, m * ink * (onlyDamp ? d : 1 + .35 * d)) / 2 * 255 * (m > .02 ? 1 : 0)); D[q * 4 + 2] = Math.round(.08 * m * 255); }   // (onlyDamp: only the line's ink that lies in a wet wash runs out into it; the line itself is laid crisp after)
  inWindow(bake, [x0, y0, x0 + w / res, y0 + h / res], dpr, rgb, wet, (Md, ox, oy) => {
    // (the ink runs through the water by diffusion, so a bleed some 2–3 px wide takes time in proportion to the square of
    // the device px it crosses: the steps scale with dpr, the level is set as fast as the scheme stays stable)
    Md.settings.level = .1; Md.settings.creep = .02;
    Md.pour(D, w, h, [(x0 - ox) * dpr, (y0 - oy) * dpr, w / res * dpr, h / res * dpr]);
    for (let k = 0, n = Math.round(14 * dpr); k < n; k++) Md.step(16);
  });
  return true;
}

// ---- the wash -----------------------------------------------------------------------------------------------------------------
export function washPour(bake, L, rgb, { dpr = 2, seed = 1, ink = .42, edge = 1, bloom = .5, soft = 0, wet = .35, gran = .42, pool = .3, lifts = .5, glaze = null, steps = 18 } = {}) {
  const { M, w, h, x0, y0, res } = L;
  if (!supported()) { const c = new OffscreenCanvas(w, h), g = c.getContext('2d'), im = g.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { im.data.set([rgb[0], rgb[1], rgb[2], Math.round(Math.min(1, M[i]) * 150)], i * 4); } g.putImageData(im, 0, 0); bake.drawImage(c, x0 * dpr, y0 * dpr, w / res * dpr, h / res * dpr); return; }
  const rag = noise2(seed ^ 0x13), slow = noise2(seed ^ 0x2b), bl = noise2(seed ^ 0x47);
  // the wash's own edge: a little uneven (the brush's load and the paper), softened where it ran wet into wet
  const S = blur(M, w, h, Math.max(1, Math.round((.6 + soft) * res))), C = new Float32Array(w * h), [a0, b0, a1, b1] = S.reach;   // (outside S.reach, S, C and all after are empty)
  for (let j = b0; j < b1; j++) for (let i = a0; i < a1; i++) { const q = j * w + i; if (S[q] <= 0) continue; const x = x0 + i / res, y = y0 + j / res;
    C[q] = soft ? Math.min(1, S[q] * 1.15) * Math.min(1, M[q] * 1.5) : Math.max(0, Math.min(1, (S[q] - .5 + .06 * (rag(x / 3, y / 3) - .5)) * 3 + .5)); }
  const R = Math.round(2.2 * res), Bl = blur(blur(C, w, h, R), w, h, R), D = new Uint8Array(w * h * 4);
  // the wash's own extent, so it can pool toward one side (the board tilted: the pigment runs down and right and settles)
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; for (let j = b0; j < b1; j++) for (let i = a0; i < a1; i++) if (C[j * w + i] > .3) { bx0 = Math.min(bx0, i); bx1 = Math.max(bx1, i); by0 = Math.min(by0, j); by1 = Math.max(by1, j); }
  const lift = noise2(seed ^ 0x6d), Gz = glaze ? blur(glaze, w, h, Math.max(1, Math.round(.6 * res))) : null;
  for (let j = b0; j < b1; j++) for (let i = a0; i < a1; i++) { const q = j * w + i, m = C[q]; if (m <= .01) continue; const x = x0 + i / res, y = y0 + j / res;
    const rim = Math.max(0, 1 - Bl[q]) * 1.7;   // 0 inside .. ~1 at the edge: the pigment drawn there as it dried
    // a back-run: a pale cauliflower where the noise rises past a level, its lip darker
    const b = bl(x / 26, y / 26), lip = Math.exp(-Math.pow((b - .72) / .02, 2)), pale = b > .72 ? .8 : 1;
    const gx = (i - bx0) / Math.max(1, bx1 - bx0), gy = (j - by0) / Math.max(1, by1 - by0), tone = 1 + pool * ((gx * .45 + gy * .9) / 1.35 - .5) * 2;
    const lifted = 1 - lifts * Math.max(0, lift(x / 30 + y / 90, y / 14 - x / 60) - .62) * 2.2;   // where the brush ran dry and lifted
    const gz = Gz ? 1 + 1.05 * Gz[q] : 1;   // (the shade glazed in wet: the same pigment, denser, its inner edge soft)
    const k = ink * gz * tone * lifted * (1 + .28 * (slow(x / 16, y / 16) - .5) * 2) * (1 + edge * 1.5 * rim * rim) * (bloom ? (1 - bloom * (1 - pale) + bloom * .7 * lip) : 1);
    D[q * 4] = Math.round(m * 255); D[q * 4 + 1] = Math.round(Math.min(1, k / 2) * 255); D[q * 4 + 2] = Math.round(gran * 255); }
  const box = [x0, y0, x0 + w / res, y0 + h / res];
  inWindow(bake, box, dpr, rgb, wet, (Md, ox, oy, cw, ch) => {
    Md.pour(D, w, h, [(x0 - ox) * dpr, (y0 - oy) * dpr, w / res * dpr, h / res * dpr]);
    for (let k = 0; k < steps; k++) Md.step(16);
  });
}
