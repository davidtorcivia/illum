// Crops of a page's elements, one load: each selector's box (padded) screenshotted at the page's DPR, for 4× looking
// (DPR=2 and view the PNG doubled, or DPR=4). usage: node tools/crops.mjs <url> <out-prefix> 'sel1|sel2|...'
// env: W=1440 H=1000 DPR=2 DARK=1 PAD=40 (px round each box; PADL=px on the left only, for margin ornament) READING=1
// writes <out-prefix>-<k>.png per selector (the first match; 'sel@2' takes the third)
import { launch, open, load } from './chrome.mjs';
const [url, out, sels] = process.argv.slice(2), b = await launch();
const p = await open(b, { width: +(process.env.W ?? 1440), height: +(process.env.H ?? 1000), dpr: +(process.env.DPR ?? 2), dark: !!process.env.DARK });
console.log(await load(p, url, { reading: !!process.env.READING })); await new Promise(r => setTimeout(r, 300));
const pad = +(process.env.PAD ?? 40), padl = +(process.env.PADL ?? pad);
let k = 0;
for (const s of sels.split('|')) { const [sel, nth] = s.split('@');
  const r = await p.evaluate((sel, nth) => { const e = document.querySelectorAll(sel)[+(nth ?? 0)]; if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + scrollX, b.top + scrollY, b.width, b.height]; }, sel, nth);
  if (!r) { console.log('missing', s); continue; }
  const f = `${out}-${k++}.png`; await p.screenshot({ path: f, clip: { x: Math.max(0, r[0] - padl), y: Math.max(0, r[1] - pad), width: r[2] + padl + pad, height: r[3] + pad * 2 } }); console.log(f, s); }
await b.close();
