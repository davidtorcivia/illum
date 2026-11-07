// Contact sheets: one page in many styles, laid side by side, for each width and scheme. Full-page screenshots, scaled
// into a grid with each style's name under it; one PNG per width and scheme: <out>-<width>-<light|dark>.png
// usage: node tools/sheet.mjs <url (no style param)> <out-prefix>
// env: STYLES='gothic draft ...' (default all)  W=1440,390  THEMES=light,dark  COLS=6  THUMB=360 (px wide per page)
//      MAXH=0 (crop each page to this many page px; 0: whole)
import { launch, open, load } from './chrome.mjs';
import { writeFileSync } from 'node:fs';
const [url, out] = process.argv.slice(2), all = 'gothic hours cadel romanesque insular hypertext doodle draft swiss memphis riso deco carto score blueprint occult kelmscott copperplate nouveau botanical astrology tarot';
const styles = (process.env.STYLES ?? all).split(' '), widths = (process.env.W ?? '1440,390').split(',').map(Number), themes = (process.env.THEMES ?? 'light,dark').split(','), cols = +(process.env.COLS ?? 6), maxH = +(process.env.MAXH ?? 0);
const b = await launch();
for (const width of widths) for (const theme of themes) {
  const shots = [];
  for (const s of styles) { const p = await open(b, { width, dark: theme === 'dark' }); const sep = url.includes('?') ? '&' : '?';
    const t = await load(p, `${url}${sep}style=${s}`); await new Promise(r => setTimeout(r, 300));
    const h = await p.evaluate(() => document.documentElement.scrollHeight);
    shots.push({ s, t, png: await p.screenshot({ encoding: 'base64', ...(maxH ? { clip: { x: 0, y: 0, width, height: Math.min(h, maxH) } } : { fullPage: true }) }) }); await p.close(); }
  const thumb = +(process.env.THUMB ?? (width > 800 ? 360 : 260)), p = await open(b);
  const png = await p.evaluate(async (shots, cols, thumb, dark) => {
    const ims = await Promise.all(shots.map(async s => createImageBitmap(await (await fetch('data:image/png;base64,' + s.png)).blob())));
    const k = thumb / ims[0].width, rowH = Math.max(...ims.map(i => i.height)) * k + 22, rows = Math.ceil(ims.length / cols);
    const cv = new OffscreenCanvas(cols * (thumb + 8) + 8, rows * rowH + 8), g = cv.getContext('2d'); g.fillStyle = dark ? '#111' : '#ccc'; g.fillRect(0, 0, cv.width, cv.height);
    ims.forEach((im, i) => { const x = 8 + (i % cols) * (thumb + 8), y = 8 + Math.floor(i / cols) * rowH; g.imageSmoothingQuality = 'high'; g.drawImage(im, x, y, thumb, im.height * k);
      g.fillStyle = dark ? '#eee' : '#111'; g.font = '13px sans-serif'; g.fillText(`${shots[i].s} · ${shots[i].t}`, x, y + im.height * k + 15); });
    const u8 = new Uint8Array(await (await cv.convertToBlob()).arrayBuffer()); let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode(...u8.subarray(i, i + 32768)); return btoa(s);
  }, shots.map(({ s, t, png }) => ({ s, t, png })), cols, thumb, theme === 'dark');
  const f = `${out}-${width}-${theme}.png`; writeFileSync(f, Buffer.from(png, 'base64')); console.log(f); await p.close(); }
await b.close();
