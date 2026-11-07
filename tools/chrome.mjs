// The headless Chromium every tool here uses: Playwright's build, with the GPU (Intel Arc via ANGLE/Vulkan) so the
// ink medium's WebGL2 runs for real. --no-sandbox: AppArmor blocks user namespaces on this machine; only ever point
// these tools at our own pages. ILLUM_CHROME overrides the binary.
import puppeteer from 'puppeteer-core';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';

export function launch() {
  const pw = homedir() + '/.cache/ms-playwright', dir = readdirSync(pw).filter(d => /^chromium-\d+$/.test(d)).sort().pop();
  return puppeteer.launch({ executablePath: process.env.ILLUM_CHROME ?? `${pw}/${dir}/chrome-linux64/chrome`,
    args: ['--no-sandbox', `--use-angle=${process.env.ILLUM_ANGLE ?? 'vulkan'}`, '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'] });
}
// a page at a viewport, dark or light by the system's scheme, its errors printed
export async function open(b, { width = 1440, height = 1000, dpr = 1, dark = false } = {}) {
  const p = await b.newPage(); await p.setViewport({ width, height, deviceScaleFactor: dpr });
  await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }]);
  p.on('pageerror', e => console.log('pageerror:', e.message)); return p;
}
// load and wait until the page says it has drawn (body.dataset.timing, anything but 'reading' unless asked)
export async function load(p, url, { reading = false, timeout = 60000 } = {}) {
  await p.goto('about:blank'); await p.goto(url, { waitUntil: 'load' });
  await p.waitForFunction(r => { const t = document.body.dataset.timing; return t && (r || t !== 'reading'); }, { timeout }, reading);
  return p.evaluate(() => document.body.dataset.timing);
}
