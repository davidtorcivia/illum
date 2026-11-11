// node playground/tests/restyle.check.mjs <site-url>: a page rubricated again in place ends exactly where a fresh page
// would. The built site's see page is opened in one style and moved to another in place (by the catalogue, as a reader
// does: rubricate destroyed and made again on the same text, the host's markup changed between, as Kelmscott's two-line
// initials are); once it has drawn and its faces are in, every initial's box and the sheet as seen must match a fresh cold
// load of that style: what one style left on the text (an initial's size, float or margins) must never be laid out, or
// drawn against, by the next. And on a cold load (FROM=settled), nothing in the text may move once the ornament has been
// laid on it unless it is drawn again: every element's box against the sheet as it stood at the page's last illum:drawn
// must be where it is once the faces are in and the page has settled. Fails on any difference.
// env: W=487,1440 (viewport widths; 487 is never baked, so drawn live)  DPR=1  FROM=kelmscott,next,settled (the style each
// is reached from: a named one, or `next`, the catalogue's previous style stepping on with ›; or settled, above)
// STYLES=all (or a list)
import { launch, open } from '../../tools/chrome.mjs';
const site = process.argv[2], env = (k, d) => (process.env[k] ?? d).split(','), b = await launch();
const settle = p => p.evaluate(async () => { await document.fonts.ready; await new Promise(r => setTimeout(r, 1200)); });
// (the page has drawn once more than it had: tools/chrome.mjs counts rubricate's illum:drawn)
const drawn = async (p, n = 0) => p.waitForFunction(n => (window.__illumDrawn ?? 0) > n, { timeout: 60000 }, n);
const count = p => p.evaluate(() => window.__illumDrawn ?? 0);
// what the reader sees: every initial's box relative to the sheet, and the sheet's pixels
const seen = async p => ({ boxes: await p.evaluate(() => { const s = document.querySelector('.sheet').getBoundingClientRect();
    return [...document.querySelectorAll('.sheet .text .ini')].map(e => { const r = e.getBoundingClientRect(); return [e.textContent, ...[r.left - s.left, r.top - s.top, r.width, r.height].map(v => Math.round(v))].join(' '); }); }),
  png: await (await p.$('.sheet')).screenshot({ encoding: 'base64' }) });
const differ = (p, a, c) => p.evaluate(async (a, c) => { const img = async s => { const im = new Image(); im.src = 'data:image/png;base64,' + s; await im.decode(); const k = new OffscreenCanvas(im.width, im.height).getContext('2d'); k.drawImage(im, 0, 0); return k.getImageData(0, 0, im.width, im.height); };
  const [x, y] = [await img(a), await img(c)]; if (x.width !== y.width || x.height !== y.height) return `sizes ${x.width}x${x.height} / ${y.width}x${y.height}`;
  let n = 0; for (let i = 0; i < x.data.length; i += 4) if (Math.abs(x.data[i] - y.data[i]) + Math.abs(x.data[i + 1] - y.data[i + 1]) + Math.abs(x.data[i + 2] - y.data[i + 2]) > 48) n++;
  return n > x.width * x.height * .002 ? `${n} px differ` : ''; }, a, c);   // (a live drawing may differ from itself by a level or two: only real moves count)
let bad = 0;
const keys = await (async () => { const p = await open(b); await p.goto(`${site}/see.html`); const k = await p.evaluate(async () => (await import('./js/catalogue.js')).CATALOGUE.map(c => c.key)); await p.close(); return k; })();
const styles = env('STYLES', 'all')[0] === 'all' ? keys : env('STYLES', '');
const dpr = +(process.env.DPR ?? 1);
for (const width of env('W', '487,1440').map(Number)) for (const style of styles) for (const from of env('FROM', 'kelmscott,next,settled')) {
  if (from === 'settled') { const ctx = await b.createBrowserContext(), p = await open(ctx, { width, height: 900, dpr });
    await p.evaluateOnNewDocument(() => { const at = () => { const s = document.querySelector('.sheet')?.getBoundingClientRect();
        return s ? [...document.querySelectorAll('.sheet .text *')].map(e => { const r = e.getBoundingClientRect(); return `${e.tagName}${e.className ? '.' + e.className : ''} ${[r.left - s.left, r.top - s.top, r.width, r.height].map(v => Math.round(v)).join(',')}`; }) : []; };
      window.__layout = at; addEventListener('illum:drawn', () => { window.__laid = at(); }); });
    await p.goto(`${site}/see.html?style=${style}`, { waitUntil: 'load' }); await drawn(p); await settle(p);
    const moved = await p.evaluate(() => { const now = window.__layout(); return now.filter((x, i) => x !== window.__laid[i]).slice(0, 4).concat(now.length !== window.__laid.length ? ['element count'] : []); });
    await ctx.close(); if (moved.length) bad++;
    console.log(`${width} ${style} cold, settled: ${moved.length ? `moved after it was drawn: ${moved.join('; ')}` : 'ok'}`); continue; }
  const prev = from === 'next' ? keys[(keys.indexOf(style) - 1 + keys.length) % keys.length] : from; if (prev === style) continue;
  const ctx = await b.createBrowserContext(), p = await open(ctx, { width, height: 900, dpr });
  await p.goto(`${site}/see.html?style=${prev}`, { waitUntil: 'load' }); await drawn(p); await settle(p);
  const n = await count(p);
  await p.evaluate((s, step) => { if (step) return document.querySelector('.step[data-step="1"]').click(); const i = document.querySelector(`#catalogue input[name=pick][value="${s}"]`); i.checked = true; i.dispatchEvent(new Event('change', { bubbles: true })); }, style, from === 'next');
  await drawn(p, n); await settle(p); const A = await seen(p); await ctx.close();
  const ctx2 = await b.createBrowserContext(), q = await open(ctx2, { width, height: 900, dpr });
  await q.goto(`${site}/see.html?style=${style}`, { waitUntil: 'load' }); await drawn(q); await settle(q); const B = await seen(q);
  const boxes = A.boxes.filter((x, i) => x !== B.boxes[i]), px = await differ(q, A.png, B.png); await ctx2.close();
  const ok = !boxes.length && !px; if (!ok) bad++;
  console.log(`${width} ${prev} -> ${style}: ${ok ? 'ok' : `initials moved: ${boxes.join('; ') || 'none'}; ${px || 'pixels same'}`}`);
}
await b.close(); console.log(bad ? `${bad} restyled pages differ from a fresh one` : 'every restyled page as a fresh one'); process.exit(bad ? 1 : 0);
