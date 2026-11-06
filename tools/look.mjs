// Look at a playground page the way the rubric asks: real render timings, and a contact sheet of many seeds.
// usage: node tools/look.mjs <url> [--seeds 16] [--w 700] [--h 900] [--out sheet.png]
// Seeds go in as #seed=N; the page reports `document.body.dataset.timing` when it has drawn.
import puppeteer from 'puppeteer-core';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';

const args = process.argv.slice(2), url = args[0], opt = k => { const i = args.indexOf('--' + k); return i > 0 ? args[i + 1] : undefined; };
const seeds = +(opt('seeds') ?? 16), W = +(opt('w') ?? 700), H = +(opt('h') ?? 900), out = opt('out') ?? 'sheet.png';
const pw = homedir() + '/.cache/ms-playwright', dir = readdirSync(pw).filter(d => /^chromium-\d+$/.test(d)).sort().pop();
const browser = await puppeteer.launch({ executablePath: process.env.ILLUM_CHROME ?? `${pw}/${dir}/chrome-linux64/chrome`,
  args: ['--no-sandbox', '--use-angle=vulkan', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
const shots = [];
for (let k = 0; k < seeds; k++) {
  const seed = 1000 + k * 7919;
  await page.goto('about:blank'); await page.goto(`${url}#seed=${seed}`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.timing, { timeout: 20000 });
  const timing = await page.evaluate(() => document.body.dataset.timing);
  console.log(`seed ${seed}: ${timing}`);
  shots.push({ seed, src: 'data:image/png;base64,' + await page.screenshot({ encoding: 'base64' }) });
}
const cols = Math.ceil(Math.sqrt(seeds)), cw = 360, ch = Math.round(cw * H / W);
await page.setViewport({ width: cols * (cw + 8) + 8, height: Math.ceil(seeds / cols) * (ch + 26) + 8, deviceScaleFactor: 1 });
await page.setContent(`<body style="margin:0;padding:4px;background:#ddd;font:12px sans-serif;display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:8px 8px;padding:8px">
  ${shots.map(s => `<figure style="margin:0"><img src="${s.src}" style="width:${cw}px;height:${ch}px;display:block"><figcaption>${s.seed}</figcaption></figure>`).join('')}</body>`);
await page.screenshot({ path: out, fullPage: true });
console.log(out);
await browser.close();
