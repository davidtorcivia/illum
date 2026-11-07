// One screenshot of a page once it says it has drawn, for looking at before claiming anything (and 4× crops).
// usage: node tools/shot.mjs <url> <out.png>
// env: W=1440 H=1000 (viewport)  DPR=1  DARK=1 (prefers-color-scheme: dark)  CLIP=x,y,w,h (page px; default the full
// page)  READING=1 (accept a page still writing as it is read)  SETTLE=ms
import { launch, open, load } from './chrome.mjs';
const [url, out] = process.argv.slice(2), b = await launch();
const p = await open(b, { width: +(process.env.W ?? 1440), height: +(process.env.H ?? 1000), dpr: +(process.env.DPR ?? 1), dark: !!process.env.DARK });
const t = await load(p, url, { reading: !!process.env.READING }); await new Promise(r => setTimeout(r, +(process.env.SETTLE ?? 300)));
const c = process.env.CLIP?.split(',').map(Number);
await p.screenshot({ path: out, ...(c ? { clip: { x: c[0], y: c[1], width: c[2], height: c[3] } } : { fullPage: true }) });
console.log(out, t); await b.close();
