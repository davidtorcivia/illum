// The audit over the cases page (playground/cases.html ?audit, kit/audit.js): every style at each ornament scale and
// width, one line per style: text collisions, overlaps between ornaments (cross) and doublings within one (self, join-
// aware), the joins (gap: a hair's miss, always a fault; near: a spacing under 3 px, to judge by eye; over: a hair's
// overrun), and what the guard left out (DROP kind kept/whole).
// usage: node tools/audit.mjs [base=http://127.0.0.1:8000]
// env: STYLES='gothic draft ...' (default all)  SCALES='0.5 1 2'  W=1440,390  DARK=1  RICH=0.5  WHERE=n (print the n worst
// joins per style)  PAGE=playground/cases.html (06's page takes the same ?audit)  EXTRA='&specimen' (any more query)
// The shape sweep is a page too: DPR=4 CLIP=285,25,870,895 node tools/shot.mjs '<base>/playground/cases.html?sweep' out.png
import { launch, open, load } from './chrome.mjs';
const base = process.argv[2] ?? 'http://127.0.0.1:8000', page = process.env.PAGE ?? 'playground/cases.html';
const all = 'gothic hours cadel romanesque insular hypertext doodle draft swiss memphis riso deco carto score blueprint occult kelmscott copperplate nouveau botanical astrology tarot';
const styles = (process.env.STYLES ?? all).split(' '), scales = (process.env.SCALES ?? '0.5 1 2').split(' '), widths = (process.env.W ?? '1440,390').split(',').map(Number);
const b = await launch(), tot = { text: 0, cross: 0, self: 0, gap: 0, near: 0, over: 0 };
for (const width of widths) { const p = await open(b, { width, dark: !!process.env.DARK });
  for (const s of styles) { const row = [], where = [];
    for (const sc of scales) { await load(p, `${base}/${page}?style=${s}&scale=${sc}&rich=${process.env.RICH ?? .5}&ink=pen&audit${process.env.EXTRA ?? ''}`);
      const a = JSON.parse(await p.evaluate(() => document.body.dataset.audit)), j = a.joins, dr = Object.entries(a.dropped).map(([t, [x, y]]) => `${t}${x}/${y}`).join(',');
      const worst = Object.entries(a.byType).filter(([, v]) => v.cross || v.text || v.self > 10).map(([t, v]) => `${t}:${v.text}/${v.cross}/${v.self}`).join(' ');
      for (const [k, v] of [['text', a.text], ['cross', a.cross], ['self', a.self], ['gap', j.gap], ['near', j.near], ['over', j.overrun]]) tot[k] += v;
      row.push(`×${sc} text ${a.text} cross ${a.cross} self ${a.self} · gap ${j.gap} near ${j.near} over ${j.overrun}${dr ? ' DROP ' + dr : ''}${worst ? ' [' + worst + ']' : ''}`);
      where.push(...j.where.slice(0, 3).map(w => `×${sc}:${w.join(',')}`)); }
    console.log(`${width} ${s.padEnd(11)} ${row.join(' | ')}`); if (process.env.WHERE && where.length) console.log('    ', where.slice(0, +process.env.WHERE).join('  ')); }
  await p.close(); }
console.log('total', JSON.stringify(tot)); await b.close();
