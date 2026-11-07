// Bake a page's ornament at build time, so a reader's first visit is drawn from it too (kit/cache.js; rubricate's
// `baked` option, or data-baked on the text). Each page is drawn in headless Chrome at every width, theme and density
// asked for; what it remembers is written out as PNG bands and one manifest, keyed exactly as the page will look it up.
// A key holds the library's hash, so bake against the files as they will be served (a built site/ ships kit/hash.json),
// and bake again after any change to the library: a stale bake is never used, only ignored.
// usage: node tools/bake.mjs <out-dir> <url>...    env: W=1440,390 THEMES=light,dark DPR=1,2
//   then: rubricate(text, { baked: '<out-dir as served>/bake.json' })
import { launch, open, load } from './chrome.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const [out, ...urls] = process.argv.slice(2);
if (!out || !urls.length) { console.log('usage: node tools/bake.mjs <out-dir> <url>...'); process.exit(1); }
const list = (v, d) => (process.env[v] ?? d).split(',');
mkdirSync(out, { recursive: true });
const mf = `${out}/bake.json`, manifest = existsSync(mf) ? JSON.parse(readFileSync(mf)) : {};
const b = await launch(); let n = 0, bytes = 0;
for (const url of urls) for (const width of list('W', '1440,390').map(Number)) for (const theme of list('THEMES', 'light,dark')) for (const dpr of list('DPR', '1,2').map(Number)) {
  const p = await open(b, { width, height: 1000, dpr, dark: theme === 'dark' }), since = Date.now();
  await load(p, url);
  // the newest record stored since the page was opened, its bands as base64
  const rec = await p.evaluate(async since => {
    const db = await new Promise((ok, no) => { const r = indexedDB.open('illum', 1); r.onupgradeneeded = () => r.result.createObjectStore('bake'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
    const newest = () => new Promise(ok => { const q = db.transaction('bake').objectStore('bake').openCursor(); let best = null;
      q.onsuccess = () => { const c = q.result; if (!c) return ok(best); if ((c.value.t ?? 0) >= since && (!best || c.value.t > best.value.t)) best = { key: c.key, value: c.value }; c.continue(); }; });
    for (let k = 0; k < 200; k++) { const r = await newest(); if (r) { const b64 = async blob => { const u8 = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode(...u8.subarray(i, i + 32768)); return btoa(s); };
      return { key: r.key, value: { ...r.value, bands: await Promise.all(r.value.bands.map(async x => ({ y: x.y, png: await b64(x.blob) }))) } }; } await new Promise(r => setTimeout(r, 100)); }
    return null; }, since);
  await p.close();
  const tag = `${url} ${width} ${theme} dpr ${dpr}`;
  if (!rec) { console.log(`${tag}: nothing remembered (not a still, ?nocache, or the cache is off)`); continue; }
  const id = createHash('sha1').update(rec.key).digest('hex').slice(0, 16), { t, ...v } = rec.value;
  manifest[rec.key] = { ...v, bands: v.bands.map(x => { const src = `${id}-${x.y}.png`, buf = Buffer.from(x.png, 'base64'); writeFileSync(`${out}/${src}`, buf); bytes += buf.length; return { y: x.y, src }; }) };
  n++; console.log(`${tag}: ${v.bands.length} bands`);
}
await b.close();
writeFileSync(mf, JSON.stringify(manifest));
console.log(`${mf}: ${n} baked now, ${Object.keys(manifest).length} in all, ${(bytes / 1024).toFixed(0)} kB written`);
