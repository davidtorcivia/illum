// First paint of a cold visit (a fresh browser: no HTTP, IndexedDB, V8 or GPU cache), on a desk or a throttled phone; serve
// the built site with tools/serve-h2.mjs (research/29-perf.md has the columns).
// usage: node tools/firstpaint.mjs <url>...   env: PROF=desk|phone RUNS=3 JSON=1 (each load's modules and resources)
//   desk:  1440x900 dpr 1, no throttling;  phone: 390x844 dpr 2, CPU x4, Slow 4G (562.5 ms RTT, 1.44 Mbps down)
import puppeteer from 'puppeteer-core';
import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
const PROF = process.env.PROF ?? 'desk', RUNS = +(process.env.RUNS ?? 3), phone = PROF === 'phone';
const W = phone ? 390 : 1440, H = phone ? 844 : 900, DPR = phone ? 2 : 1, CPU = phone ? 4 : 1;
const pw = homedir() + '/.cache/ms-playwright', dir = readdirSync(pw).filter(d => /^chromium-\d+$/.test(d)).sort().pop();
const launch = () => puppeteer.launch({ executablePath: `${pw}/${dir}/chrome-linux64/chrome`, acceptInsecureCerts: true,
  args: ['--no-sandbox', '--use-angle=vulkan', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars', '--ignore-certificate-errors'] });

const PROBE = () => {
  const P = window.__fp = { lt: [], cls: 0, orn: 0, drawn: 0, vis: 0, fonts: 0, ctx: 0, ctxms: 0, glms: 0 };
  new PerformanceObserver(l => { for (const e of l.getEntries()) P.lt.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true });
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) P.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  document.fonts.ready.then(() => { P.fonts = performance.now(); });
  const mark = function () { if (!P.orn && this.canvas?.getAttribute?.('aria-hidden') === 'true' && this.canvas.isConnected) P.orn = performance.now(); };
  for (const m of ['drawImage', 'stroke', 'fill', 'putImageData', 'fillRect']) { const f = CanvasRenderingContext2D.prototype[m];
    CanvasRenderingContext2D.prototype[m] = function (...a) { mark.call(this); return f.apply(this, a); }; }
  const G = WebGL2RenderingContext.prototype;
  for (const m of ['compileShader', 'linkProgram', 'getShaderParameter', 'getProgramParameter']) { const f = G[m];
    G[m] = function (...a) { const t = performance.now(); const r = f.apply(this, a); P.glms += performance.now() - t; return r; }; }
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (k, ...a) { const t = performance.now(), r = gc.call(this, k, ...a); if (k === 'webgl2' && r && !this.__c) { this.__c = 1; P.ctx++; P.ctxms += performance.now() - t; } return r; };
  addEventListener('illum:drawn', e => { if (P.drawn) return; P.drawn = performance.now(); P.detail = e.detail; requestAnimationFrame(() => { P.vis = performance.now(); }); });
};

async function once(url) {
  const b = await launch(), p = await b.newPage(), cdp = await p.createCDPSession();
  await p.setViewport({ width: W, height: H, deviceScaleFactor: DPR, isMobile: phone, hasTouch: phone });
  await cdp.send('Network.enable');
  if (phone) { await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 562.5, downloadThroughput: 1.6e6 / 8 * .9, uploadThroughput: 750e3 / 8 * .9 }); }
  const req = new Map();
  cdp.on('Network.requestWillBeSent', e => req.set(e.requestId, { url: e.request.url, type: e.type, init: e.initiator?.url ?? e.initiator?.stack?.callFrames?.[0]?.url ?? e.initiator?.stack?.parent?.callFrames?.[0]?.url, prio: e.request.initialPriority }));
  cdp.on('Network.loadingFinished', e => { const r = req.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });
  p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.evaluateOnNewDocument(PROBE);
  await p.goto(url, { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => window.__fp.vis, { timeout: 120000, polling: 50 });
  await new Promise(r => setTimeout(r, 500));
  const m = await p.evaluate(() => { const P = window.__fp, fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
    const rs = performance.getEntriesByType('resource').map(e => ({ u: e.name.replace(location.origin, ''), s: e.startTime, e: e.responseEnd }));
    const lt = P.lt.filter(([s]) => s <= P.vis + 50);
    return { fcp, fonts: P.fonts, orn: P.orn, drawn: P.drawn, vis: P.vis, cached: !!P.detail?.cached, cls: P.cls, n: lt.length, ltsum: lt.reduce((a, [, d]) => a + d, 0), ltmax: Math.max(0, ...lt.map(([, d]) => d)), tbt: lt.reduce((a, [, d]) => a + Math.max(0, d - 50), 0), ctx: P.ctx, ctxms: P.ctxms, glms: P.glms, rs }; });
  // the module waterfall: each script's depth along its chain of importers
  const all = [...req.values()], byUrl = new Map(all.map(r => [r.url, r])), depth = r => { let d = 0, x = r; const seen = new Set(); while (x?.init && byUrl.has(x.init) && !seen.has(x.init)) { seen.add(x.init); x = byUrl.get(x.init); d++; } return d; };
  m.depth = Math.max(0, ...all.filter(r => r.type === 'Script').map(depth));
  const sum = f => all.filter(f).reduce((a, r) => a + (r.bytes ?? 0), 0) / 1024;
  m.req = all.length; m.kb = sum(() => 1); m.js = sum(r => r.type === 'Script'); m.font = sum(r => r.type === 'Font'); m.bake = sum(r => /\/bake/.test(r.url)); m.css = sum(r => r.type === 'Stylesheet');
  const end = re => Math.max(0, ...m.rs.filter(r => re.test(r.u)).map(r => r.e));
  m.jsEnd = end(/\.js$/); m.fontEnd = end(/\.woff2$/); m.bakeJson = end(/bake\.json/); m.bands = end(/\/bake\//);
  m.scripts = all.filter(r => r.type === 'Script').map(r => `${depth(r)} ${r.url.replace(/^.*?\/\/[^/]+\//, '')}`).sort();
  await b.close(); return m;
}

const f = (x, n = 6) => String(Math.round(x)).padStart(n), med = a => [...a].sort((x, y) => x - y)[a.length >> 1];
console.log(`# ${PROF}: ${W}x${H} dpr ${DPR} cpu x${CPU}${phone ? ' Slow 4G' : ''}, median of ${RUNS} cold loads`);
console.log('page                        fcp  fonts    orn  drawn    vis  bake? |   cls |  lt  sum  max  tbt | ctx ctxms glms | req    kB   js font bake | dep  jsEnd fontEnd bjson bands');
for (const url of process.argv.slice(2)) {
  const rs = []; for (let k = 0; k < RUNS; k++) { try { rs.push(await once(url)); } catch (e) { console.log(url, 'failed', e.message); } }
  if (!rs.length) continue; const M = k => med(rs.map(r => r[k]));
  const name = url.replace(/^.*?\/\/[^/]+\//, '').slice(0, 24).padEnd(24);
  console.log(`${name} ${f(M('fcp'))} ${f(M('fonts'))} ${f(M('orn'))} ${f(M('drawn'))} ${f(M('vis'))} ${String(rs.filter(r => r.cached).length + '/' + rs.length).padStart(5)} | ${M('cls').toFixed(3)} | ${f(M('n'), 3)} ${f(M('ltsum'), 4)} ${f(M('ltmax'), 4)} ${f(M('tbt'), 4)} | ${f(M('ctx'), 3)} ${f(M('ctxms'), 5)} ${f(M('glms'), 4)} | ${f(M('req'), 3)} ${f(M('kb'), 5)} ${f(M('js'), 4)} ${f(M('font'), 4)} ${f(M('bake'), 4)} | ${f(M('depth'), 3)} ${f(M('jsEnd'))} ${f(M('fontEnd'))} ${f(M('bakeJson'))} ${f(M('bands'))}`);
  if (process.env.JSON) console.log('JSON', JSON.stringify(rs[0].scripts), JSON.stringify(rs[0].rs.map(r => [r.u, Math.round(r.s), Math.round(r.e)])));
}
