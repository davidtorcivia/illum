// PROTOTYPE (perf phase 1): rubricate's still, remembered. The output is a pure function of the text's layout, the
// options, the theme and the dpr, so the baked ornament layer is stored (IndexedDB: works on plain http too, where Cache
// Storage does not) under a key of those, with the drop initials' measured styles and a fingerprint of where every line
// of text fell. On the next visit, if the text falls in the same places, the layer is drawn from the store and the ink
// engine (and kit/illum.js itself) is never loaded; else it is drawn live and stored for next time.
// A shipped bake (tools/bake.mjs, phase 2) is the same record served as files: opts.baked = URL of its manifest.
//   const r = await rubricateCached(root, opts)    // opts as rubricate's; r.hit: true when drawn from the store
const VERSION = 'p1';                                   // the library's version: a new release never reuses an old bake
const BAND = 1024;                                      // device px: the layer is stored in bands, the fold's decoded first

const fnv = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
const db = () => new Promise((ok, no) => { const r = indexedDB.open('illum', 1); r.onupgradeneeded = () => r.result.createObjectStore('bake'); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });
const idb = async (mode, f) => { const d = await db(); return new Promise((ok, no) => { const t = d.transaction('bake', mode), q = f(t.objectStore('bake')); t.oncomplete = () => ok(q.result); t.onerror = () => no(t.error); }); };

// where every line of text fell, relative to the host (quarter px): if this matches, so does every measure the walk takes
function fingerprint(root, host) {
  const o = host.getBoundingClientRect(), tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), rg = document.createRange(), q = v => Math.round(v * 4);
  let s = `${q(o.width)},${q(o.height)}|`;
  for (let n; (n = tw.nextNode());) { if (!n.data.trim()) continue; rg.selectNodeContents(n); for (const r of rg.getClientRects()) s += `${q(r.left - o.left)},${q(r.top - o.top)},${q(r.width)};`; }
  return fnv(s) + s.length.toString(36);
}
const theme = o => o.theme && o.theme !== 'auto' ? o.theme : document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const keyOf = (root, o) => { const dpr = Math.min(2, devicePixelRatio || 1), { on, host, ...rest } = o;
  return [VERSION, location.pathname, fnv(root.textContent), JSON.stringify(rest), theme(o), dpr].join('|'); };
const INI = '.ini';

export async function rubricateCached(root, opts = {}) {
  const host = opts.host ?? root.offsetParent ?? root, key = keyOf(root, opts), t0 = performance.now();
  await document.fonts.ready;
  {
    const rec = (opts.draw ?? 'still') === 'still' ? await idb('readonly', s => s.get(key)).catch(() => null) ?? await shipped(opts.baked, key) : null;
    if (rec) {
      const inis = [...root.querySelectorAll(INI)], prev = inis.map(e => e.getAttribute('style'));
      inis.forEach((e, i) => rec.ini[i] == null ? e.removeAttribute('style') : e.setAttribute('style', rec.ini[i])); root.style.setProperty('--orn', rec.orn);
      if (fingerprint(root, host) === rec.fp) {
        const c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true'); Object.assign(c.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none', width: rec.w + 'px', height: rec.h + 'px' });
        c.width = rec.W; c.height = rec.H; host.prepend(c); const g = c.getContext('2d');
        // the bands in view first
        const fold = (innerHeight - host.getBoundingClientRect().top) * rec.W / rec.w, order = rec.bands.map((b, i) => i).sort((a, b) => (rec.bands[a].y > fold) - (rec.bands[b].y > fold));
        await Promise.all(order.map(async i => { const b = rec.bands[i], bm = await createImageBitmap(b.blob); g.drawImage(bm, 0, b.y); bm.close(); }));
        const ms = Math.round(performance.now() - t0); opts.on?.('drawn', { grow: 0, draw: ms, view: ms, all: ms, parts: 0, cached: true });
        return { hit: true, canvas: c, destroy: () => c.remove() };
      }
      inis.forEach((e, i) => prev[i] == null ? e.removeAttribute('style') : e.setAttribute('style', prev[i]));   // the layout moved: draw it live
    }
  }
  const { rubricate } = await import('../illum.js');
  const r = rubricate(root, { ...opts, on: (state, info) => { opts.on?.(state, info); if (state === 'drawn' && info && (opts.draw ?? 'still') === 'still') (self.requestIdleCallback ?? setTimeout)(() => store(root, host, key, opts)); } });
  return Object.assign(r, { hit: false });
}

async function store(root, host, key, opts) {
  const base = host.querySelector(':scope > canvas[aria-hidden]'); if (!base?.width) return;
  const bands = [];
  for (let y = 0; y < base.height; y += BAND) { const h = Math.min(BAND, base.height - y), c = new OffscreenCanvas(base.width, h); c.getContext('2d').drawImage(base, 0, y, base.width, h, 0, 0, base.width, h);
    bands.push({ y, blob: await c.convertToBlob({ type: 'image/png' }) }); }
  const rec = { fp: fingerprint(root, host), ini: [...root.querySelectorAll(INI)].map(e => e.getAttribute('style')), orn: root.style.getPropertyValue('--orn'), w: parseFloat(base.style.width), h: parseFloat(base.style.height), W: base.width, H: base.height, bands };
  await idb('readwrite', s => s.put(rec, key)); window.__stored = { key, bytes: bands.reduce((a, b) => a + b.blob.size, 0) };
}
// a bake shipped with the page: { [key]: { fp, ini, orn, w, h, W, H, bands: [{ y, src }] } }
async function shipped(url, key) {
  if (!url) return null; try { const m = await (await fetch(url)).json(), r = m[key]; if (!r) return null;
    return { ...r, bands: await Promise.all(r.bands.map(async b => ({ y: b.y, blob: await (await fetch(new URL(b.src, new URL(url, location.href)))).blob() }))) }; } catch { return null; }
}
