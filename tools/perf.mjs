// Load cost of rubricate, measured: cold (a fresh browser: no HTTP, V8 or GPU program cache) and warm (the same page
// loaded again), at a viewport, dpr and CPU throttle (Chrome's CDP throttling, to stand in for a laptop or a phone).
// Times are ms from navigation start:
//   fcp     first contentful paint (the text)
//   orn     the first draw call on an ornament layer (an aria-hidden canvas); +1 frame to be seen
//   atf     the above-the-fold ornament done (rubricate's first requestIdleCallback: it asks for one right after)
//   all     the page says it has drawn (body.dataset.timing set to anything but 'reading')
//   lt      main-thread long tasks: count, total, worst; tbt: sum of their time past 50 ms
//   gl      WebGL2 contexts made; ms spent synchronously in shader compile + link + status checks
//   bytes   transferred (and requests): fonts, modules, other
// usage: node tools/perf.mjs <url> [url...]   env: W=1440 H=900 DPR=1 CPU=1 RUNS=1 WARM=1 PROFILE=out.json
import { launch } from './chrome.mjs';
import { writeFileSync } from 'node:fs';
const urls = process.argv.slice(2), W = +(process.env.W ?? 1440), H = +(process.env.H ?? 900), DPR = +(process.env.DPR ?? 1), CPU = +(process.env.CPU ?? 1);
const RUNS = +(process.env.RUNS ?? 1), WARM = process.env.WARM !== '0';

const PROBE = () => {
  const P = window.__perf = { lt: [], orn: 0, atf: 0, all: 0, gl: 0, glms: 0, ctx: 0, ricN: 0 };
  new PerformanceObserver(l => { for (const e of l.getEntries()) P.lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true });
  const ric = self.requestIdleCallback; self.requestIdleCallback = function (...a) { if (!P.atf) P.atf = performance.now(); P.ricN++; return ric.apply(this, a); };
  const mark = function () { if (!P.orn && this.canvas?.getAttribute?.('aria-hidden') === 'true' && this.canvas.isConnected) P.orn = performance.now(); };
  for (const m of ['drawImage', 'stroke', 'fill', 'putImageData', 'fillRect']) { const f = CanvasRenderingContext2D.prototype[m];
    CanvasRenderingContext2D.prototype[m] = function (...a) { mark.call(this); return f.apply(this, a); }; }
  const G = WebGL2RenderingContext.prototype;
  for (const m of ['compileShader', 'linkProgram', 'getShaderParameter', 'getProgramParameter']) { const f = G[m];
    G[m] = function (...a) { const t = performance.now(); const r = f.apply(this, a); P.glms += performance.now() - t; return r; }; }
  // GPU work, as fragments: a full-quad pass's rect (its uRect), an instanced sweep's count; and per program
  P.frag = {}; const rectOf = new WeakMap(), u4 = G.uniform4f;
  G.uniform4f = function (loc, ...v) { if (loc && rectOf.get(loc)) this.__rect = v; return u4.call(this, loc, ...v); };
  const gul = G.getUniformLocation; G.getUniformLocation = function (p, n) { const l = gul.call(this, p, n); if (l && n === 'uRect') rectOf.set(l, 1); (p.__n ??= new Set()).add(n); return l; };
  const up = G.useProgram; G.useProgram = function (p) { this.__p = p; return up.call(this, p); };
  const kind = p => { const n = p?.__n ?? new Set(); return n.has('uDecay') ? 'flow' : n.has('uOver') ? 'render' : n.has('uRough') ? 'paper' : n.has('uDst') ? 'pour' : 'other'; };
  const da = G.drawArrays; G.drawArrays = function (...a) { const r = this.__rect; const k = kind(this.__p);
    P.frag[k] = (P.frag[k] ?? 0) + (r ? r[2] * r[3] : 0); P.passes = (P.passes ?? 0) + 1; return da.apply(this, a); };
  const di = G.drawArraysInstanced; G.drawArraysInstanced = function (...a) { P.inst = (P.inst ?? 0) + a[3]; return di.apply(this, a); };
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (k, ...a) { const t = performance.now(), r = gc.call(this, k, ...a); if (k === 'webgl2' && r && !this.__c) { this.__c = 1; P.ctx++; P.ctxms = (P.ctxms ?? 0) + performance.now() - t; } return r; };
  addEventListener('DOMContentLoaded', () => new MutationObserver(() => { const t = document.body.dataset.timing; if (t && t !== 'reading' && !P.all) { P.all = performance.now(); P.timing = t; } })
    .observe(document.body, { attributes: true, attributeFilter: ['data-timing'] }));
};

async function once(b, url) {
  const p = await b.newPage(), cdp = await p.createCDPSession();
  await p.setViewport({ width: W, height: H, deviceScaleFactor: DPR });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU }); await cdp.send('Network.enable');
  const net = new Map(); cdp.on('Network.responseReceived', e => net.set(e.requestId, { url: e.response.url, type: e.type }));
  cdp.on('Network.loadingFinished', e => { const r = net.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.evaluateOnNewDocument(PROBE);
  if (process.env.PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 }); await cdp.send('Profiler.start'); }
  const res = [];
  for (let pass = 0; pass < (WARM ? 2 : 1); pass++) {
    for (const r of net.values()) r.old = true;
    await p.goto(url, { waitUntil: 'load' });
    await p.waitForFunction(() => window.__perf.all, { timeout: 180000, polling: 50 });
    await new Promise(r => setTimeout(r, +(process.env.SETTLE ?? 300)));
    const m = await p.evaluate(() => { const P = window.__perf, fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
      const lt = P.lt.filter(([s]) => s <= P.all + 50); return { fcp, orn: P.orn, atf: P.atf, all: P.all, n: lt.length, ltsum: lt.reduce((a, [, d]) => a + d, 0), ltmax: Math.max(0, ...lt.map(([, d]) => d)), tbt: lt.reduce((a, [, d]) => a + Math.max(0, d - 50), 0), ctx: P.ctx, ctxms: P.ctxms ?? 0, glms: P.glms, timing: P.timing, frag: Object.fromEntries(Object.entries(P.frag).map(([k, v]) => [k, Math.round(v / 1e6)])), mfrag: Object.values(P.frag).reduce((a, b) => a + b, 0) / 1e6, passes: P.passes ?? 0, inst: P.inst ?? 0 }; });
    const fresh = [...net.values()].filter(r => !r.old), by = k => fresh.filter(r => k(r)).reduce((a, r) => a + (r.bytes ?? 0), 0);
    m.req = fresh.length; m.kb = by(() => 1) / 1024; m.font = by(r => r.type === 'Font' || /woff2?$/.test(r.url)) / 1024; m.js = by(r => r.type === 'Script' || /\.m?js$/.test(r.url)) / 1024;
    res.push({ pass: pass ? 'warm' : 'cold', ...m });
  }
  if (process.env.PROFILE) { const { profile } = await cdp.send('Profiler.stop'); writeFileSync(process.env.PROFILE, JSON.stringify(profile)); }
  await p.close(); return res;
}

const f = x => String(Math.round(x)).padStart(6);
console.log(`# ${W}x${H} dpr ${DPR} cpu x${CPU}`);
console.log('page                         pass     fcp    orn    atf    all | lt n    sum    max    tbt | ctx ctxms  glms |  req     kB  font    js |  Mfrag passes  inst');
for (const url of urls) for (let k = 0; k < RUNS; k++) {
  const b = await launch(); let rs; try { rs = await once(b, url); } catch (e) { console.log(url, 'failed', e.message); await b.close(); continue; } await b.close();
  const name = url.replace(/^.*playground\//, '').slice(0, 28).padEnd(28);
  for (const r of rs) console.log(`${name} ${r.pass.padEnd(5)} ${f(r.fcp)} ${f(r.orn)} ${f(r.atf)} ${f(r.all)} | ${String(r.n).padStart(4)} ${f(r.ltsum)} ${f(r.ltmax)} ${f(r.tbt)} | ${String(r.ctx).padStart(3)} ${f(r.ctxms)} ${f(r.glms)} | ${String(r.req).padStart(4)} ${f(r.kb)} ${f(r.font)} ${f(r.js)} | ${f(r.mfrag)} ${f(r.passes)} ${f(r.inst)}`);
  if (process.env.JSON) console.log('JSON', JSON.stringify({ url, W, H, DPR, CPU, rs }));
}
