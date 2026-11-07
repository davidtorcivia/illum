// A CPU profile (tools/perf.mjs PROFILE=out.json) summed by function: self and total ms, and self ms by file.
// usage: node tools/prof.mjs out.json [top=40] [filter-regex]
import { readFileSync } from 'node:fs';
const [file, top = 40, filt] = process.argv.slice(2), P = JSON.parse(readFileSync(file)), byId = new Map(P.nodes.map(n => [n.id, n])), parent = new Map();
for (const n of P.nodes) for (const c of n.children ?? []) parent.set(c, n.id);
const self = new Map(), total = new Map(), files = new Map(), key = n => `${n.callFrame.functionName || '(anon)'} ${n.callFrame.url.replace(/^.*\//, '')}:${n.callFrame.lineNumber + 1}`;
P.samples.forEach((id, i) => { const dt = (P.timeDeltas[i] ?? 0) / 1000, n = byId.get(id), k = key(n);
  self.set(k, (self.get(k) ?? 0) + dt); const f = n.callFrame.url.replace(/^.*\//, '') || n.callFrame.functionName; files.set(f, (files.get(f) ?? 0) + dt);
  const seen = new Set(); for (let x = id; x; x = parent.get(x)) { const kk = key(byId.get(x)); if (!seen.has(kk)) { seen.add(kk); total.set(kk, (total.get(kk) ?? 0) + dt); } } });
const show = (m, t) => { console.log(`\n${t}`); [...m].filter(([k]) => !filt || new RegExp(filt).test(k)).sort((a, b) => b[1] - a[1]).slice(0, +top).forEach(([k, v]) => console.log(v.toFixed(1).padStart(8), k)); };
show(files, 'self ms by file'); show(self, 'self ms by function'); show(total, 'total ms by function');
