// A frame strip of a page being written (?draw): screenshots of one clip at times after load, laid side by side.
// usage: node tools/strip.mjs <url> <out.png> x,y,w,h t1,t2,... (seconds after the page says it is reading)
// env: W=1440 H=1000 DPR=1 DARK=1 SCROLL=px (scroll there first, as a reader would) SCALE=1 (of each frame in the strip)
import { launch, open, load } from './chrome.mjs';
import { writeFileSync } from 'node:fs';
const [url, out, clip, times] = process.argv.slice(2), [x, y, w, h] = clip.split(',').map(Number), T = times.split(',').map(Number), b = await launch();
const p = await open(b, { width: +(process.env.W ?? 1440), height: +(process.env.H ?? 1000), dpr: +(process.env.DPR ?? 1), dark: !!process.env.DARK });
await load(p, url, { reading: true }); const t0 = Date.now();
if (process.env.SCROLL) await p.evaluate(s => scrollTo(0, s), +process.env.SCROLL);
const shots = [];
for (const t of T) { const wait = t * 1000 - (Date.now() - t0); if (wait > 0) await new Promise(r => setTimeout(r, wait));
  shots.push(await p.screenshot({ encoding: 'base64', clip: { x, y, width: w, height: h }, captureBeyondViewport: false })); }
const png = await p.evaluate(async (shots, T, dark) => { const ims = await Promise.all(shots.map(async s => createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob())));
  const W = ims[0].width, H = ims[0].height, cv = new OffscreenCanvas(ims.length * (W + 6), H + 18), g = cv.getContext('2d'); g.fillStyle = dark ? '#000' : '#888'; g.fillRect(0, 0, cv.width, cv.height);
  ims.forEach((im, i) => { g.drawImage(im, i * (W + 6), 0); g.fillStyle = '#fff'; g.font = '12px sans-serif'; g.fillText(T[i] + ' s', i * (W + 6) + 4, H + 13); });
  const u8 = new Uint8Array(await (await cv.convertToBlob()).arrayBuffer()); let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode(...u8.subarray(i, i + 32768)); return btoa(s); }, shots, T, !!process.env.DARK);
writeFileSync(out, Buffer.from(png, 'base64')); console.log(out); await b.close();
