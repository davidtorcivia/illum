# Research: the one page

Seven files sit behind this page (about 57,000 words). This is what we will actually hold ourselves to and test. Where a line compresses a longer argument, the file and section are named.

## What illumination is for

Illumination is not decoration added to a page. It did six jobs, and each one is a requirement for us (06-purpose):

| Job | What it asks of illum |
|---|---|
| **Light** | Gold is lighting, not a colour. It moves only when the reader moves (pointer, tilt, scroll), and it is spent by rank. |
| **Memory** | The same text always gets the same illumination. Seeds come from the content, so editing one block changes only that block. A page is a place you can return to. |
| **Wayfinding** | Ornament marks the text's real structure: h1 gets a frame, h2 a historiated initial, h3 a penwork initial, then paraphs and line-fillers. Rank is never invented. Shrink the page to 10% and you should still see the sections. |
| **Commentary** | The margin is a second voice that answers the text beside it, sparingly: at most one marginal figure per screen, each traceable to a word. |
| **Breath** | The openings carry the weight and the reading runs stay clear. Every generator declares how much space it leaves empty. |
| **Care** | Every irregularity has a cause in the making. Every page is signed in a colophon: maker, tools, seed, date, dedication. |

Loos and Warde are right about the text column, and we concede it to them completely. Ornament never covers, crowds or dims a word, and the page is complete without it (06 §10).

## The bar

The rubric is 05-the-bar §0. There are 12 criteria, each scored 0–3. **Beauty is weighted ×3 and sorted first, so a concept can never outscore something more beautiful.** Beauty is the lowest of four sub-scores: colour harmony, line quality, rhythm and proportion. "Museum" means Beauty 3, no criterion below 2, and a total of at least 36 out of 42. The five-minute protocol:
1. a 2-second cold look at 1440 px;
2. zoom to 400% and out to 25%;
3. the page at 390 px;
4. take the ornament off, then change the text;
5. the 100-seed contact sheet;
6. the one-sentence statement;
7. re-score Beauty last, and only downward.

## Laws of the canon (01-canon §0, Owen Jones)

1. The hierarchy of decoration follows the hierarchy of the text.
2. Ornament is sized in text units (lines, `lh`) and sits on the baseline grid.
3. Everything grows from a stem, and junctions meet at tangents (Jones 11–12).
4. Two strokes: a fixed outline carries the craft, and the fill can be flat.
5. Gold is a material: burnished gold is specular and dark until the light finds it; shell gold is matte grain.
6. Repeat with variation: seeded per element, deterministic, never identical.
7. Empty space is budgeted per tradition: Insular ≈ 0%, a Book of Hours has a quiet block inside a dense border, Rinpa 40–70%.
8. Ornament behind reading text lives in a separate optical channel, like mica on karakami paper, visible when the light catches it.

## Making marks look made (02-analog)

- **The substrate is the root object.** One paper height field per site drives where pigment settles, where dry brush skips, how edges waver, and raking light. Texture is *causal*, never an overlay.
- **Marks are records** (`path, pressure(u), speed(u), load, pigment, seed`), so one drawing can render as wash, engraving or riso.
- The best look per millisecond comes from: Bousseau density, a wet-edge rim, multiply glazing in linear light, minimum-jerk human lines, blue-noise placement, edge wobble from the paper gradient, engraving by threshold structures, limited historical palettes (OKLCH plus Kubelka–Munk ramps baked with spectral.js, MIT).
- **Never:** `Math.random()` per render, uniform grain overlays, periodic tiles, RGB lerp for paint, perfectly parallel hatching, alpha-over for transparent media, animated `feTurbulence`.

## Generating with intention (03-procedural)

The ten rules, compressed: write the one-sentence instruction first; the container is an input; no bare random, every quantity has a chosen distribution; rank before you place (one hero); stop on emptiness, not exhaustion; order first, then 1% disorder on a gradient; make bad outputs impossible; judge a thousand at three sizes; seed everything with isolated streams; few inks, one surprise, real material.

The strongest pairings to explore: space colonization × Books of Hours ivy; Wong growth × Kelmscott; Hankin star patterns × Islamic bands (morphing as you scroll); knotwork with breaks × Insular initials; species genomes × herbal plates; engraving flow fields × guilloché.

## Architecture (04-web, 00-references)

- **Generator core**: pure, seeded, renderer-agnostic, `feature(params, seed, box) → scene`. **Renderers**: Canvas2D by default, WebGL2 for finishing passes (print pass, density, rim, gold, ageing), SVG strings for vector and print. A **bake CLI** runs the same modules headless. The **runtime** is custom elements plus a worker pool, with everything else lazy.
- **Hybrid by default.** A prebaked still is the floor and works without JS; live rendering enhances it. Text stays text, and art is `aria-hidden`.
- **Budgets:** ~15 KB core, 0 CLS, no main-thread task over 50 ms, DPR capped at 2, finite animations, nothing moving under reduced motion.
- **Mobile is a composition, not a shrink.** Margin gardens become headpieces and tailpieces, glosses become inline asides (container queries), pointer light becomes scroll light or opt-in tilt, and the worker pool drops to 1.
- **Public-library quality:** zero-dependency ESM shipped as source, SSR-safe core, strict-CSP worker, JSDoc types. Seeded output is API, checked by scene-hash and pixel-baseline tests.
- **Lift, don't reinvent:**
  - determinism kernel (`paintpass.js` hashing, florilegium's stream discipline)
  - OKLCH ink ramps (florilegium-ink)
  - the print pass (initialis `ink.js`)
  - clearance field and largest-hole growth (initialis `field.js`, florilegium-grow)
  - the structure-tensor orientation field (pie-site `painter.js`)
  - the bristle brush (pie-site `brush.js`)
- **Gaps nobody has filled yet, and which are our opening:** regrowing at runtime when the layout changes, avoidance at the level of lines and glyphs, one scene emitted as both vector and raster, dark mode as re-inking, and an automated test that output looks composed.

## Credo (06-purpose)

1. The text comes first. Ornament is the last coat, and a page without it is complete.
2. Every ornament serves a function it can name, or it is removed.
3. Illumination marks the text's own structure. Rank is never invented and never misapplied.
4. The same text always receives the same illumination.
5. Light moves only when the reader moves, and gold is spent by rank.
6. Ornament never covers, crowds or dims a word.
7. The thresholds carry the weight and the reading runs stay clear. Emptiness is designed.
8. The margin is a second voice that speaks to the text beside it.
9. Every irregularity has a cause in the making.
10. Take principles from the past, never results. Each piece must be native to the web.
11. The reader's time, device and privacy are what we spend, and we spend little.
12. Every illuminated page is signed and dedicated.

## Files

- `00-references.md`: pie-site, initialis, florilegium, blank-page, dissected
- `01-canon.md`: the traditions, Owen Jones's 37 propositions, open-access archives
- `02-analog.md`: wash, pigment, brush, paper, print, gold, ageing; the top 15
- `03-procedural.md`: algorithms, fitting, the craft of intention
- `04-web.md`: renderers, CSS, strategy, a11y, mobile, shipping as a library (`04-web-bench.html` runs on phones)
- `05-the-bar.md`: acquisitions evidence, Alexander's 15 properties, the rubric
- `06-purpose.md`: what illumination was for; the credo
- `99-seeds.md`: strange directions, collected and not yet built

Caveat: every file marks unverified sources `[unverified]`. Several primary pages blocked fetching (Compton, inconvergent, Wong 1998's body text, Book of Kells, the British Library). Re-check them before anything is quoted publicly.
