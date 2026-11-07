// Pixel diff of a page served from two places (say the committed HEAD on one port, the working tree on another):
// full-page screenshots of each, compared pixel by pixel; prints whether they are identical and, if not, how many
// pixels differ, by how much at most, and where. A refactor that drifts an approved look is a regression.
// usage: node tools/diff.mjs <baseA> <baseB> <path?query>...      e.g.
//   node tools/diff.mjs http://127.0.0.1:8003 http://127.0.0.1:8000 'playground/07-frames.html' 'playground/06-wayfinding.html?style=draft'
// env: W=1440,390 (viewport widths)  THEMES=light,dark (prefers-color-scheme)  DPR=1  OUT=dir (writes a.png, b.png and
// diff.png per case: differing pixels red over a faded b)  SETTLE=ms (wait after the page says it has drawn)
// CLIP=selector (compare that element only, e.g. '.sheet' when the colophons differ)
import { launch, open, load } from './chrome.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const [A, B, ...paths] = process.argv.slice(2);
const widths = (process.env.W ?? '1440,390').split(',').map(Number), themes = (process.env.THEMES ?? 'light').split(','), dpr = +(process.env.DPR ?? 1), out = process.env.OUT;
if (out) mkdirSync(out, { recursive: true });
const b = await launch(); let bad = 0;
for (const path of paths) for (const width of widths) for (const theme of themes) {
  const shots = [];
  for (const base of [A, B]) { const p = await open(b, { width, height: 1000, dpr, dark: theme === 'dark' });
    const t = await load(p, `${base}/${path}`); await new Promise(r => setTimeout(r, +(process.env.SETTLE ?? 300)));
    shots.push({ png: await (process.env.CLIP ? await p.$(process.env.CLIP) : p).screenshot({ fullPage: !process.env.CLIP, encoding: 'base64' }), t }); await p.close(); }
  const p = await open(b), r = await p.evaluate(async (a, c) => {
    const img = async s => { const bm = await createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob()), cv = new OffscreenCanvas(bm.width, bm.height), g = cv.getContext('2d'); g.drawImage(bm, 0, 0); return g.getImageData(0, 0, bm.width, bm.height); };
    const [x, y] = [await img(a), await img(c)];
    if (x.width !== y.width || x.height !== y.height) return { size: [x.width, x.height, y.width, y.height] };
    let n = 0, max = 0, bb = [1e9, 1e9, -1, -1]; const d = new ImageData(x.width, x.height);
    for (let i = 0; i < x.data.length; i += 4) { const m = Math.max(...[0, 1, 2].map(k => Math.abs(x.data[i + k] - y.data[i + k]))), j = i / 4, px = j % x.width, py = (j / x.width) | 0;
      if (m) { n++; max = Math.max(max, m); bb = [Math.min(bb[0], px), Math.min(bb[1], py), Math.max(bb[2], px), Math.max(bb[3], py)]; d.data.set([255, 0, 0, 255], i); }
      else d.data.set([...[0, 1, 2].map(k => 255 - (255 - y.data[i + k]) * .25), 255], i); }
    let diff = null; if (n) { const cv = new OffscreenCanvas(x.width, x.height); cv.getContext('2d').putImageData(d, 0, 0);
      const u8 = new Uint8Array(await (await cv.convertToBlob()).arrayBuffer()); let s = ''; for (let q = 0; q < u8.length; q += 32768) s += String.fromCharCode(...u8.subarray(q, q + 32768)); diff = btoa(s); }
    return { n, max, bb, w: x.width, h: x.height, diff };
  }, shots[0].png, shots[1].png); await p.close();
  const tag = `${path.replace(/^playground\//, '')} ${width} ${theme}`;
  if (r.size) { bad++; console.log(`${tag}: sizes differ ${r.size}`); }
  else if (!r.n) console.log(`${tag}: identical (${r.w}×${r.h})   [${shots[0].t} | ${shots[1].t}]`);
  else { bad++; console.log(`${tag}: ${r.n} px differ, max ${r.max}, in [${r.bb}]   [${shots[0].t} | ${shots[1].t}]`); }
  if (out) { const f = `${out}/${tag.replace(/[^\w.-]+/g, '_')}`; writeFileSync(f + '-a.png', Buffer.from(shots[0].png, 'base64')); writeFileSync(f + '-b.png', Buffer.from(shots[1].png, 'base64')); if (r.diff) writeFileSync(f + '-diff.png', Buffer.from(r.diff, 'base64')); }
}
await b.close(); process.exit(bad ? 1 : 0);
