// Bake pages' ornament at build time, so a reader's first visit is drawn from it too (kit/cache.js). Each page is drawn in
// headless Chrome at every width, theme and density asked for; what it remembers (every rubricated text on it) is written
// out as bands (lossless WebP where cwebp is installed and it is smaller, else PNG; bands with no ink are not kept) and
// one manifest, keyed exactly as the page will look it up. rubricate reads kit/bake.json beside kit/illum.js by default
// (or the page's own: its `baked` option, data-baked on the text).
// A record holds the library's hash, so bake the files as they will be served (a built site/ ships kit/hash.json) and bake
// again after any change to the library: a stale bake is never used, only ignored.
// usage: node tools/bake.mjs <manifest.json> <url>...    env: W=1440,390 THEMES=light,dark DPR=1,2
//   (the bands go in bake/ beside the manifest)
import { launch, open } from './chrome.mjs';
import { readdirSync, mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname } from 'node:path';
const [mf, ...urls] = process.argv.slice(2);
if (!mf?.endsWith('.json') || !urls.length) { console.log('usage: node tools/bake.mjs <manifest.json> <url>...'); process.exit(1); }
const list = (v, d) => (process.env[v] ?? d).split(','), dir = dirname(mf) + '/bake';
mkdirSync(dir, { recursive: true });
let webp = true; try { execFileSync('cwebp', ['-version'], { stdio: 'ignore' }); } catch { webp = false; }
const manifest = existsSync(mf) ? JSON.parse(readFileSync(mf)) : {};
const b = await launch(); let n = 0, bytes = 0, skipped = 0;
// Incremental: each page and setting is stamped with what its ornament depends on (STAMP from the build: the library and
// the site's shared css/js/faces) and the page's own HTML; one whose stamp has not changed keeps its records unbaked.
const stampsFile = dirname(mf) + '/bake-stamps.json', stamps = existsSync(stampsFile) ? JSON.parse(readFileSync(stampsFile)) : {};
const html = {}; for (const url of urls) html[url] = createHash('sha1').update((process.env.STAMP ?? '') + await (await fetch(url)).text()).digest('hex');
const jobs = []; for (const url of urls) for (const width of list('W', '1440,390').map(Number)) for (const theme of list('THEMES', 'light,dark')) for (const dpr of list('DPR', '1,2').map(Number)) {
  const tag = `${url} ${width} ${theme} dpr ${dpr}`, st = stamps[tag];
  if (st && st.stamp === html[url] && st.keys.every(k => manifest[k])) { skipped++; continue; }
  jobs.push({ url, width, theme, dpr, tag }); }
async function bake({ url, width, theme, dpr, tag }) {
  const ctx = await b.createBrowserContext();   // (its own store, so pages baked side by side do not see each other's records)
  const p = await open(ctx, { width, height: 1000, dpr, dark: theme === 'dark' }), since = Date.now();
  // the bake being made must not be drawn from the last one (the page would then remember nothing new)
  await p.setRequestInterception(true);
  p.on('request', r => /\/bake\.json(\?|$)/.test(r.url()) ? r.respond({ status: 404, body: '' }) : r.continue());
  await p.goto(url, { waitUntil: 'load' });   // (any page: its texts are remembered as each is drawn)
  // every record stored since the page was opened (once their number has held for 1.5 s; none after 8 s), bands as base64
  const recs = await p.evaluate(async since => {
    const db = await new Promise((ok, no) => { const r = indexedDB.open('illum', 1); r.onupgradeneeded = () => r.result.createObjectStore('bake'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
    const fresh = () => new Promise(ok => { const out = [], q = db.transaction('bake').objectStore('bake').openCursor();
      q.onsuccess = () => { const c = q.result; if (!c) return ok(out); if ((c.value.t ?? 0) >= since) out.push({ key: c.key, value: c.value }); c.continue(); }; });
    let last = -1, same = 0, rs = [];
    if (!performance.getEntriesByType('resource').some(e => /\/kit\/illum\.js/.test(e.name))) return [];   // (a page with no rubricated text)
    for (let k = 0; k < 600 && same < 15 && !(k >= 80 && !rs.length); k++) { rs = await fresh(); same = rs.length && rs.length === last ? same + 1 : 0; last = rs.length; await new Promise(r => setTimeout(r, 100)); }
    const b64 = async blob => { const u8 = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode(...u8.subarray(i, i + 32768)); return btoa(s); };
    return Promise.all(rs.map(async r => ({ key: r.key, value: { ...r.value, bands: await Promise.all(r.value.bands.map(async x => ({ y: x.y, png: await b64(x.blob) }))) } })));
  }, since);
  await ctx.close();
  for (const k of stamps[tag]?.keys ?? []) delete manifest[k];
  stamps[tag] = { stamp: html[url], keys: recs.map(r => r.key) };
  if (!recs.length) { console.log(`${tag}: nothing remembered (not a still, ?nocache, or the cache is off)`); return; }
  for (const rec of recs) {
    const id = createHash('sha1').update(rec.key).digest('hex').slice(0, 16), { t, ...v } = rec.value;
    manifest[rec.key] = { ...v, bands: v.bands.map(x => { const png = `${dir}/${id}-${x.y}.png`; writeFileSync(png, Buffer.from(x.png, 'base64')); let f = png;
      if (webp) { const w = png.replace(/png$/, 'webp'); execFileSync('cwebp', ['-quiet', '-lossless', '-exact', '-mt', png, '-o', w]);
        if (statSync(w).size < statSync(png).size) { unlinkSync(png); f = w; } else unlinkSync(w); }
      bytes += statSync(f).size; return { y: x.y, src: 'bake/' + f.split('/').pop() }; }) };
    n++; }
  console.log(`${tag}: ${recs.length} text${recs.length > 1 ? 's' : ''}, ${recs.reduce((a, r) => a + r.value.bands.length, 0)} bands`);
}
const pool = Array.from({ length: Number(process.env.JOBS ?? 6) }, async () => { while (jobs.length) await bake(jobs.shift()); });
await Promise.all(pool);
await b.close();
// band files no record names any more (a text that changed, a page gone)
const used = new Set(Object.values(manifest).flatMap(r => r.bands.map(x => x.src.slice(5))));
for (const f of readdirSync(dir)) if (!used.has(f)) unlinkSync(`${dir}/${f}`);
writeFileSync(mf, JSON.stringify(manifest)); writeFileSync(stampsFile, JSON.stringify(stamps));
console.log(`${mf}: ${n} baked now, ${skipped} settings unchanged, ${Object.keys(manifest).length} in all, ${(bytes / 1024).toFixed(0)} kB of bands written`);
