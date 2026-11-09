// Insular's pieces built off the page's thread (kit/styles/insular.js starts a few of these): the face loaded here as well,
// the code warmed on a small letter, then each job built and painted as on the page and handed back as a bitmap.
// init { font, kind } -> (warmed) ; { id, b, res, theme } -> { id, canvas (ImageBitmap), T, w, h, dx, dy, tb, tp } | { id, error }
// A worker that cannot load the face says { fail } and is not asked again.
import { makePiece } from './insular.js';

let ready = null, busy = 0;
const WARM = [['paraph', 14, 1, 0], ['filler', 120, 12, 1], ['band', 160, 24, 1, 2, 0], ['drop', 'B', 44, 1, .5, 0]];
onmessage = async ({ data }) => {
  if (data.init) { ready = (async () => {
      if (!self.fonts || typeof FontFace === 'undefined') throw new Error('no fonts in a worker');
      self.fonts.add(await new FontFace('InsularUncial', `url(${data.init.font})`).load()); })().catch(e => { postMessage({ fail: String(e) }); throw e; });
    // (the warming: small pieces built and thrown away, one a task, so a job that comes meanwhile waits for one at most)
    const k = data.init.kind === 'durrow' ? 'durrow' : 'lind';
    ready.then(async () => { for (const job of WARM) { if (busy) return; makePiece({ job, kind: k, seed: 1, rot: 0 }, 1, 'light'); await new Promise(r => setTimeout(r)); } }, () => {});
    return; }
  busy++;
  try { await ready; } catch { return; }
  try { const m = makePiece(data.b, data.res, data.theme), canvas = m.canvas.transferToImageBitmap();
    postMessage({ id: data.id, canvas, T: null, w: m.w, h: m.h, dx: m.dx, dy: m.dy, tb: m.tb, tp: m.tp }, [canvas]); }
  catch (e) { postMessage({ id: data.id, error: String(e) }); }
  busy--;
};
