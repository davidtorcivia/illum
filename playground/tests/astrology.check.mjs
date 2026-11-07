// tests/astrology.check.mjs: the drop initial's writing never crosses its ruling. Opens tests/astrology-check.html (which
// measures every label's ink against the drawn rules and its house, over seeds × data-lines 4–8 × the 1440 and 390 type
// sizes) and fails unless there are no violations. usage: node playground/tests/astrology.check.mjs [base-url]
import { launch, open } from '../../tools/chrome.mjs';
const base = process.argv[2] ?? 'http://localhost:8000', b = await launch(), p = await open(b);
await p.goto(base + '/playground/tests/astrology-check.html?seeds=12', { waitUntil: 'load' });
await p.waitForFunction(() => document.body.dataset.result, { timeout: 120000 });
const r = JSON.parse(await p.evaluate(() => document.body.dataset.result)); await b.close();
console.log(JSON.stringify(r, null, 1));
if (r.violations) { console.error(`FAIL: ${r.violations} labels cross a rule, leave their house or touch another`); process.exit(1); }
console.log(`ok: ${r.labels} labels in ${r.charts} figures, none crossing (least clearance beyond the rule width + 1.5 px: ${r.minClear} px)`);
