// Drawing as you read (?draw=read), scripted: load, read the first screen, scroll on at a reader's pace, then jump far
// down (the hurried hand), and back; viewport shots along the way; then the per-frame cost while the hand was writing
// (the page's body.dataset.frames: median and worst ms of the work done in each animation frame) and whether anything
// ran when idle (once all is written, frames counted during a quiet second should not grow).
// usage: node tools/read.mjs <url with ?draw=read> [out-prefix]     env: W=1440 H=900 DARK=1
import { launch, open } from './chrome.mjs';
const [url, out] = process.argv.slice(2), b = await launch(), W = +(process.env.W ?? 1440), H = +(process.env.H ?? 900);
const p = await open(b, { width: W, height: H, dark: !!process.env.DARK }), wait = ms => new Promise(r => setTimeout(r, ms));
await p.goto(url, { waitUntil: 'load' }); await p.waitForFunction(() => document.body.dataset.timing === 'reading', { timeout: 30000 });
let k = 0; const shot = async label => { if (out) await p.screenshot({ path: `${out}-${String(k++).padStart(2, '0')}-${label}.png` }); console.log(label.padEnd(14), await p.evaluate(() => `y ${scrollY}  ${document.body.dataset.timing}`)); };
await wait(400); await shot('load-0.4s'); await wait(2000); await shot('load-2.4s');
const Hp = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = H * .6; y < Hp * .45; y += H * .6) { await p.evaluate(y => scrollTo(0, y), y); await wait(900); } await shot('read-half');
await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await wait(300); await shot('jump-0.3s'); await wait(2500); await shot('jump-2.8s');
await p.evaluate(() => scrollTo(0, 0)); await wait(400); await shot('back-top');
const t0 = Date.now(); await p.waitForFunction(() => document.body.dataset.timing === 'written', { timeout: 90000 }); console.log(`all written ${((Date.now() - t0) / 1000).toFixed(1)} s after returning to the top`);
const n0 = await p.evaluate(() => window.R?.state.frames?.length ?? 0); await wait(1200); const n1 = await p.evaluate(() => window.R?.state.frames?.length ?? 0);
console.log('frames', await p.evaluate(() => document.body.dataset.frames), `| idle: ${n1 - n0} frames ran in a quiet 1.2 s`);
await b.close();
