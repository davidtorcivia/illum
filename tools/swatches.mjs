// The catalogue's swatches: each style's drop initial alone (site/swatch.html), cropped square, light and dark, saved as
// small WebP files in site/swatches/ so the catalogue never draws thirty initials live.
// usage (with the site served, e.g. python3 tools/serve.py 8110 from site/): node tools/swatches.mjs [base-url] [style ...]
// Run it again when a style's initial changes or a style is added (its key must be in site/js/catalogue.js).
import { launch, open, load } from './chrome.mjs';
import { mkdirSync } from 'node:fs';
const [base = 'http://127.0.0.1:8110/', ...only] = process.argv.slice(2);
const { CATALOGUE } = await import(new URL('../site/js/catalogue.js', import.meta.url));
const out = new URL('../site/swatches/', import.meta.url).pathname; mkdirSync(out, { recursive: true });
const b = await launch();
for (const dark of [false, true]) {
  const p = await open(b, { width: 1440, height: 1000, dpr: 1.5, dark });
  for (const s of CATALOGUE.filter(s => !only.length || only.includes(s.key))) {
    await load(p, `${base}swatch.html?style=${s.key}`); await new Promise(r => setTimeout(r, 300));
    // a square round the drop initial's ink: its own span, widened to whatever it threw into the margin (read off the
    // ornament's canvas), with a little paper round it
    const r = await p.evaluate(() => {
      const d = document.querySelector('.ini.drop').getBoundingClientRect(), c = document.querySelector('.sheet canvas'), cr = c.getBoundingClientRect(), k = c.width / cr.width;
      const sx = Math.max(0, Math.floor((d.left - cr.left - d.width) * k)), sy = Math.max(0, Math.floor((d.top - cr.top - d.height * .6) * k));
      const sw = Math.min(c.width - sx, Math.ceil(d.width * 3 * k)), sh = Math.min(c.height - sy, Math.ceil(d.height * 2.2 * k));
      const a = c.getContext('2d').getImageData(sx, sy, sw, sh).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) if (a[(y * sw + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const L = cr.left + (sx + x0) / k, T = cr.top + (sy + y0) / k, W = (x1 - x0) / k, H = (y1 - y0) / k, side = Math.max(W, H) * 1.12;
      return { x: L + W / 2 - side / 2 + scrollX, y: T + H / 2 - side / 2 + scrollY, width: side, height: side }; });
    const file = `${out}${s.key}-${dark ? 'dark' : 'light'}.webp`;
    await p.screenshot({ path: file, type: 'webp', quality: 82, clip: r }); console.log(file);
  }
  await p.close();
}
await b.close();
