// Screenshot a page once it says it has drawn (document.body.dataset.timing), at 2x, real time.
// usage: node tools/snap.mjs <url> <out.png> [width=1440] [height=1200]
import puppeteer from 'puppeteer-core';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
const [url, out, w = 1440, h = 1200] = process.argv.slice(2);
const pw = homedir() + '/.cache/ms-playwright', dir = readdirSync(pw).filter(d => /^chromium-\d+$/.test(d)).sort().pop();
const b = await puppeteer.launch({ executablePath: process.env.ILLUM_CHROME ?? `${pw}/${dir}/chrome-linux64/chrome`, args: ['--no-sandbox', '--use-angle=vulkan', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('error:', e.message));
await p.goto(url, { waitUntil: 'load' }); await p.waitForFunction(() => document.body.dataset.timing, { timeout: 60000 });
await new Promise(r => setTimeout(r, 300)); await p.screenshot({ path: out, fullPage: true }); console.log(out, await p.evaluate(() => document.body.dataset.timing));
await b.close();
