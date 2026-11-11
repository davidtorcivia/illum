# 29 · Performance: the first paint

How soon a first-time visitor (cold HTTP cache, no IndexedDB record) sees the page's text and its finished ornament, without
layout shift, pop-in or a blank. The owner's bar: a page's ornament in ≤200 ms; growth, never a fade or a pop; a still page
has its ornament when it first shows; every approved look pixel-identical.

## 0. Method

- **The site as built**: `BAKE_PORT=… bash tools/build-site.sh` in a worktree, every page baked (1440 and 390, light and
  dark, dpr 1 and 2).
- **Served as Cloudflare serves it**: one HTTP/2 connection over TLS, brotli for text (tools/serve-h2.mjs; `python3 -m
  http.server` is HTTP/1.0 without compression and makes every request its own connection, which hides the very waterfall
  being measured). bake.json is 115 kB raw, 7 kB brotli. It does not schedule by priority, as Cloudflare does.
- **Measured by tools/firstpaint.mjs** (the same Chromium as tools/chrome.mjs, launched to accept the local certificate).
- **Two profiles**, each load a fresh browser (no HTTP, V8, GPU or
  IndexedDB cache), median of 3 loads:
  - *desk*: 1440×900, dpr 1, no throttling (the local machine: Arc A770, ANGLE/Vulkan);
  - *phone*: 390×844, dpr 2, CPU 4× slower, Slow 4G (562.5 ms RTT, 1.44 Mbps down; DevTools' preset, the old "Fast 3G").
- **Columns**: `fcp` first contentful paint (the text); `fonts` document.fonts.ready; `orn` the first ink laid on an
  ornament canvas (what the reader first sees of it); `drawn` rubricate's illum:drawn (all of it, below the fold too); `vis`
  the frame after drawn; `bake?` loads drawn from the bake; `cls` cumulative layout shift; `lt` long tasks (n, sum, max,
  TBT); `ctx` WebGL2 contexts made, ms making them, ms in shader compile and link; bytes transferred (kB: all, JS, fonts,
  bake bands and manifest); `dep` the module waterfall's depth; when the last module, face, bake.json and band arrived.

## 1. Baseline (b8a8044)

ms from navigation start; median of 3 cold loads. "long-form" is use.html.

**desk**

| page | fcp | fonts | orn | drawn | bake | cls | long tasks n/sum/max | GL ctx/ms/compile | req | kB | JS | fonts kB | bake kB | depth | bake.json | last band |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| index.html | 56 | 61 | 95 | 96 | 3/3 | 0.031 | 0/0/0 | 0/0/0 | 24 | 487 | 102 | 335 | 41 | 3 | 66 | 81 |
| see plotter | 48 | 59 | 103 | 106 | 3/3 | 0.011 | 0/0/0 | 0/0/0 | 33 | 661 | 119 | 346 | 185 | 5 | 73 | 91 |
| see riso | 56 | 59 | 90 | 92 | 3/3 | 0.015 | 0/0/0 | 0/0/0 | 30 | 542 | 99 | 346 | 86 | 3 | 61 | 81 |
| see rock | 52 | 84 | 154 | 155 | 3/3 | 0.008 | 0/0/0 | 0/0/0 | 34 | 567 | 132 | 346 | 78 | 4 | 98 | 141 |
| see deco | 56 | 66 | 122 | 124 | 3/3 | 0.018 | 0/0/0 | 0/0/0 | 31 | 622 | 108 | 346 | 158 | 6 | 90 | 111 |
| see nouveau | 84 | 95 | 244 | 248 | 3/3 | 0.011 | 0/0/0 | 0/0/0 | 33 | 622 | 124 | 346 | 142 | 5 | 169 | 217 |
| see insular | 52 | 56 | 108 | 110 | 3/3 | 0.018 | 0/0/0 | 0/0/0 | 32 | 704 | 133 | 346 | 215 | 6 | 80 | 100 |
| see choirbook | 76 | 83 | 575 | 677 | 0/3 | 0.008 | 1/467/467 | 2/12/6 | 35 | 640 | 169 | 348 | 112 | 4 | 107 | 136 |
| use.html | 72 | 146 | 191 | 194 | 3/3 | 0.052 | 0/0/0 | 0/0/0 | 26 | 507 | 119 | 346 | 34 | 3 | 113 | 171 |
| see typewriter | 116 | 108 | 138 | 141 | 3/3 | 0.020 | 0/0/0 | 0/0/0 | 30 | 544 | 101 | 346 | 87 | 3 | 80 | 126 |

**phone**

| page | fcp | fonts | orn | drawn | bake | cls | long tasks n/sum/max | GL ctx/ms/compile | req | kB | JS | fonts kB | bake kB | depth | bake.json | last band |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| index.html | 1576 | 4288 | 5028 | 5047 | 3/3 | 0.096 | 0/0/0 | 0/0/0 | 26 | 523 | 102 | 335 | 77 | 3 | 3377 | 5002 |
| see plotter | 1496 | 3932 | 8403 | 8414 | 3/3 | 0.061 | 0/0/0 | 0/0/0 | 38 | 763 | 120 | 346 | 287 | 5 | 5591 | 8366 |
| see riso | 1460 | 4015 | 5711 | 5715 | 3/3 | 0.063 | 1/80/80 | 0/0/0 | 35 | 616 | 100 | 346 | 160 | 3 | 3585 | 5688 |
| see rock | 1492 | 4056 | 5646 | 5653 | 3/3 | 0.049 | 2/147/94 | 0/0/0 | 39 | 613 | 132 | 346 | 124 | 4 | 3595 | 5620 |
| see deco | 1500 | 3938 | 8727 | 8730 | 3/3 | 0.067 | 0/0/0 | 0/0/0 | 35 | 728 | 109 | 346 | 263 | 6 | 6062 | 8687 |
| see nouveau | 1492 | 3944 | 8531 | 8547 | 3/3 | 0.063 | 0/0/0 | 0/0/0 | 38 | 749 | 124 | 346 | 269 | 5 | 5593 | 8479 |
| see insular | 1476 | 3890 | 9463 | 9468 | 3/3 | 0.069 | 0/0/0 | 0/0/0 | 37 | 872 | 133 | 346 | 382 | 6 | 6128 | 9434 |
| see choirbook | 1464 | 4096 | 9175 | 9597 | 0/3 | 0.066 | 3/998/800 | 2/26/10 | 40 | 729 | 169 | 348 | 202 | 4 | 5602 | 7903 |
| use.html | 1444 | 4151 | 4777 | 4781 | 3/3 | 0.073 | 0/0/0 | 0/0/0 | 27 | 521 | 119 | 346 | 48 | 3 | 3337 | 4754 |
| see typewriter | 1476 | 4030 | 5549 | 5562 | 3/3 | 0.080 | 1/79/79 | 0/0/0 | 35 | 563 | 101 | 346 | 106 | 3 | 3595 | 5487 |

### What the waterfalls say

- **Desk is already inside the bar** (100-170 ms to the finished ornament on every baked page): no latency, so the
  waterfall costs little. The one exception is **Choir book (~680 ms), never drawn from its bake**: its record is found and
  then refused, because the page's drop is fingerprinted before the style has loaded its Lombards (kit/styles/choirbook.js
  adds them with the FontFace API, only once its module is in); the letter is measured in EB Garamond, the fingerprint
  misses, and the page is drawn live (a 470 ms long task, two WebGL contexts). Declaring the faces in the host's CSS
  (`@font-face` per letter, by `unicode-range`) is enough: with them, the same page is drawn from its bake in ~100 ms.
- **On the phone the ornament comes 4.8-9.6 s after the text (fcp ~1.5 s).** Bandwidth and round trips, not the CPU (long
  tasks are under 100 ms on every baked page). Three things decide it:
  1. *The lookup is three round trips in a row*: bake.json, then hash.json (asked only once the manifest is in), then the
     bands. Riso: bake.json 2682-3503 ms, hash.json 3508-4078, the bands 4082-5545.
  2. *Every band is fetched and awaited together*: 9 bands at dpr 2 (260 kB on Deco) share 1.44 Mbps; the two in view arrive
     only with the seven below the fold.
  3. *rubricate() is called late on the four styles with settings of their own* (Plotter, Deco, Nouveau, Insular: 8.4-9.5 s):
     site/js/specimen.js awaited the style's module graph before calling it, five or six levels deep (deco.js, deco-pieces,
     the ink engine's inkletter, then medium and writer), one round trip each, so the early lookup could not start until
     ~5.4 s. A baked page needs none of those modules.
- **The module waterfall is three levels before rubricate can start** (HTML; see.js; specimen.js and catalogue.js; then
  illum.js's own cache.js, marks.js, registry.js: Chrome's modulepreload fetches the module, not its imports). Each level is
  a round trip (560 ms on the phone).
- **The ink engine and the style's modules load beside the bake** on a baked page (60-130 kB of JS, brotli), sharing the
  line with its bands, though a page drawn from the bake never runs them.
- **document.fonts.ready gates the drawing**, and it waits for every face on the page: the site's Junicode (roman 98 kB,
  italic 107 kB), Fell Great Primer (67 kB) and Courier Prime, none of which the rubricated text uses. On the phone it
  resolves at ~4.0 s. 346 kB of the page's 520-870 kB are faces.
- **WebGL**: no context is made on a baked page (0 ms); Choir book's live draw makes two (12 ms, 6 ms compiling).
- **CLS** 0.01-0.1 everywhere: the drop initial's size and float set as the record is laid, and the faces swapping in
  (font-display: swap). (Rock read 0.695 once on the 657ab3d build, not reproduced on b8a8044: 0.049.)

## 2. The wins, in order of payoff

Each a commit of its own, with its numbers; every one pixel-identical to the HEAD before it (§3).

### 2.1 The bake in two round trips, its first screen first (kit/cache.js, 08b5eb6)

- kit/hash.json is asked for beside the manifest, as soon as rubricate asks for the manifest (it is the same folder on a
  built site), not a round trip after it. A host with no hash.json fetches nothing more early: the crawl that stands in
  for it still runs only when a record is found or a drawing is remembered (asking for it early made a playground page's
  live drawing 40 % slower: it shared the main thread with a crawl of every style).
- The bands a screen down the page are fetched first and alone; a canvas that shows nothing yet is given the bands in view
  together, in one task, as soon as they are in, and the rest follow below the fold, laid only on what that paint laid
  (not after a newer paint, nor once the canvas is cleared for a drawing, which resets its state). A canvas that already
  shows a record keeps 81f3893's decode-everything-then-lay-at-once, so a redraw never flashes. illum:drawn still means
  every band is laid.
- Phone, first ornament on screen: index 5028 → 4327 ms, use 4777 → 4298, riso 5711 → 4407, rock 5646 → 4312, typewriter
  5549 → 4383, plotter 8403 → 6375, deco 8727 → 6775, nouveau 8531 → 6471, insular 9463 → 7120. Desk: within noise.

### 2.2 Drawn from the record as soon as it fits; the engine after (kit/illum.js, 58c888b)

- **No longer waiting for every face on the page.** rubricate drew only once document.fonts.ready, which waits for the
  site's chrome faces too (~3.8-4.3 s on the phone). Now a first drawing from the store or the bake is tried as soon as its
  record is in; it is laid only if the text already falls where it fell (the fingerprint of every line, the test that was
  always applied), else it is left to the drawing asked for once the faces are in. Matching early is safe for the same
  reason matching late is: a face still missing moves some line and the record is refused.
- **The style's modules and the ink engine are loaded after a page drawn from the store or the bake** (at idle), not
  beside its bands: 50 kB of JS (brotli) off the line before the ornament on the phone, the waterfall one level shallower.
  A page the store has nothing for loads them at once, as before; a live drawing never waits on the store.
- Phone, first ornament (on top of 2.1): index 4327 → 3987 ms, use 4298 → 3978, riso 4407 → 4196, rock 4312 → 4080,
  typewriter 4383 → 4168; JS before the ornament 100-103 → 50-53 kB. Here the bands, not the faces, are still last in:
  2.3 brings them forward. Desk: within noise.

### 2.3 The bake and the modules asked for from the page's head (site/*.html, 2a513d3)

- index, see and use name, in their heads, what rubricate will ask for a level or two later: `modulepreload` for
  kit/cache.js, marks.js, registry.js (Chrome's modulepreload fetches a module, not its imports), js/specimen.js and
  js/catalogue.js; `preload as=fetch crossorigin` for kit/bake.json and kit/hash.json (crossorigin, or the preload does
  not match rubricate's `fetch()`); and the sheet's EB Garamond italic beside its roman (every sheet sets its subtitle in
  it, and a fingerprint cannot match until it is in).
- bake.json now arrives at 1.65-1.85 s on the phone (was 3.3-6.1 s). First ornament (on top of 2.2): index 3987 → 3156 ms,
  use 3978 → 3029, riso 4196 → 3175, rock 4080 → 3226, typewriter 4168 → 3243, plotter 6307 → 5278, deco 6788 → 5998,
  nouveau 6414 → 5363, insular 7080 → 6026. Index's CLS 0.096 → 0 (the italic no longer swaps in).
- Cost: fcp ~130 ms later on the phone (1.42 → 1.55 s): the preloads share the first round trip with the stylesheets. My
  local server does not schedule by priority; Cloudflare's HTTP/2 does, and gives the stylesheets the line first.

### 2.4 The see page's styles with settings of their own not waited for (site/js/specimen.js, d40e773)

- For Plotter, Deco, Nouveau and Insular (styles with settings of their own: the Machine, Deco's richness-led drop),
  specimen.js imported the style's module and set its settings before calling rubricate, so the bake was not asked for
  until the style's whole module graph was in (five or six round trips). Now the settings are set on the module the moment
  it is in (at once if it already is), and rubricate is called without waiting: it draws nothing live before it has
  imported the same module itself, and a page drawn from the bake needs none of it.
- Phone, first ornament (on top of 2.3): plotter 5278 → 3233 ms, deco 5998 → 3495, nouveau 5363 → 4149, insular
  6026 → 4428.

### 2.5 Choir book drawn from its bake (site/css/specimen.css, 5826e03)

- The host declares the Lombards itself, a letter to a file by `unicode-range` (the same files the style loads), so the
  drop is in its face when the record is fitted. The page is drawn from its bake for the first time: desk 375 → 97 ms
  (and no 470 ms long task, no WebGL context); phone 9175 → 3732 ms (b8a8044 → all of §2), 998 ms of long tasks → 0, two WebGL contexts → none.

### 2.6 The bands cached for good (tools/bake.mjs, site/_headers, e6687ba)

- Bands are named by a hash of their bytes (they were named by their key, which outlives a change of library), and
  `/kit/bake/*` is served `Cache-Control: public, max-age=31536000, immutable`. A repeat visit (a page drawn from the bake
  is not remembered in IndexedDB) no longer revalidates each band: one round trip less, 560 ms on the phone. No effect on
  a first visit. The first build after this rebakes every page anyway (the library changed), so no band keeps a
  key-derived name under the immutable rule.

### 2.7 All of it, b8a8044 → now

Median of 5 cold loads on the desk, 3 on the phone; "ornament" is the first ink on screen (the bands in view), "all" every
band laid (illum:drawn).

| page | desk fcp | desk ornament | desk all drawn | phone fcp | phone ornament | phone all drawn | phone JS kB | phone CLS |
|---|---|---|---|---|---|---|---|---|
| index.html | 48 → 56 | 80 → 63 | 91 → 77 | 1576 → 1548 | **5028 → 3156** | 5104 → 4077 | 102 → 50 | 0.096 → 0.000 |
| see plotter | 64 → 60 | 97 → 82 | 108 → 93 | 1496 → 1552 | **8403 → 3233** | 8546 → 5752 | 120 → 110 | 0.061 → 0.037 |
| see riso | 52 → 56 | 94 → 84 | 105 → 96 | 1460 → 1544 | **5711 → 3170** | 5797 → 4774 | 100 → 53 | 0.063 → 0.054 |
| see rock | 52 → 60 | 91 → 76 | 103 → 88 | 1492 → 1628 | **5646 → 3226** | 5756 → 4564 | 132 → 53 | 0.049 → 0.709 |
| see deco | 48 → 48 | 98 → 71 | 109 → 85 | 1500 → 1620 | **8727 → 3495** | 8820 → 5682 | 109 → 110 | 0.067 → 0.055 |
| see nouveau | 56 → 52 | 106 → 83 | 116 → 95 | 1492 → 1636 | **8531 → 4149** | 8645 → 6213 | 124 → 125 | 0.063 → 0.053 |
| see insular | 60 → 60 | 105 → 89 | 120 → 104 | 1476 → 1580 | **9463 → 4428** | 9603 → 6889 | 133 → 134 | 0.069 → 0.045 |
| see choirbook | 56 → 64 | 291 → 84 | 375 → 97 | 1464 → 1568 | **9175 → 3732** | 9607 → 5465 | 169 → 138 | 0.066 → 0.045 |
| use.html | 52 → 56 | 74 → 74 | 87 → 87 | 1444 → 1528 | **4777 → 3029** | 4807 → 3871 | 119 → 50 | 0.073 → 0.073 |
| see typewriter | 52 → 60 | 88 → 81 | 98 → 97 | 1476 → 1564 | **5549 → 3243** | 5710 → 4433 | 101 → 53 | 0.080 → 0.059 |

- **Desk: 63-89 ms to the ornament on every page, Choir book included** (was 74-106 ms, Choir book 291 ms); every page now
  under 105 ms to the last band, well inside the 200 ms bar.
- **Phone: the ornament in view 3.0-4.4 s after navigation, 1.5-2.9 s after the text** (was 4.8-9.5 s, 3.3-8.0 s after),
  the whole page's 3.9-6.9 s (was 4.8-9.6 s).
- What still decides the phone: the line itself. ~470-880 kB come down at 180 kB/s; the faces are 346 kB of it (§4).
- Rock's phone CLS (0.709 here, 0.049 on b8a8044's median, ~1.0 on a single b8a8044 load) is the see page's viewer row
  wrapping and unwrapping (the style's name, longer than the HTML's "Blackletter", set in a fallback face and then in
  Fell): the sheet below moves 44 px three times. It is the site's layout, on HEAD too, and timing decides how often it
  lands in a run; not changed here (§4).

## 3. Verification

- **Pixels**: tools/diff.mjs, a worktree at the HEAD before each change served on one port and the change's own worktree on
  another, each built and baked from scratch: the built site's pages (index, use, and see for all 15 styles) drawn from
  their bakes, and every style's specimen (playground/tests/<style>.html) drawn live and, with PRIME=1, from the store; at
  1440 and 390, light and dark, dpr 1 and 2 (256 comparisons a change). All identical, bar Choir book's see page (below)
  and two nondeterminisms that HEAD shows against itself, the same pixels each time: tarot.html at 1440 dark dpr 2 (913 px at most 4 levels, 2 runs in 12)
  and Choir book's see page drawn live at 1440 light dpr 2 (142007 px at most 2 levels, 4 runs in 6). The bake (a record
  of a live drawing) is identical between the trees, band for band (840 bands).
- **Choir book's see page**, now drawn from its bake where HEAD drew it live, matches HEAD's ornament; it differs as every
  baked page differs from its live drawing (one level here and there, where a band is unpremultiplied and laid again: 390,
  ~31,000 px at most 1) and, at 1440, in the antialiasing of two glyphs of the text ('n', 'o': 242 px at most 54), which
  the live drawing itself shifts (live against baked within one tree shows the same two glyphs). The approved ornament is
  unchanged.
- **Cold loads, no pop**: playground/tests/plotter.check.mjs with SITE= and COLD= every style: each see page cold in a
  fresh context, 1440 and 390, light and dark, 3 runs; the drop's ink sampled for 2 s from the moment the page says it
  has drawn, and through a redraw, must never fall below half.
- **Overlap and clip checks**: every shipped style's tests/*.check.mjs.
- **Reproduce**: `BAKE_PORT=… bash tools/build-site.sh` in a worktree; `node tools/serve-h2.mjs site 8851`; `PROF=phone
  node tools/firstpaint.mjs https://127.0.0.1:8851/see.html?style=deco` (PROF=desk for the desk; JSON=1 prints each load's
  module depths and resource timings).

Results: the cold loads, 192 of 192 ok (every style and Plotter's two kinds; Choir book drawn from its bake in all 12 now,
Plotter's office kind, which the build does not bake, live);
astrology (1902 labels in 120 figures, none crossing), pie-rock, riso, rock, typewriter and plotter's overlap and clip
checks, and the node checks (blackletter, insular-knot, occult, tarot): all pass, on the tree with every change.

## 4. Found, not done

- **The site's own faces are most of the bytes.** 346 kB of faces on every page, 285 kB of them for the site's chrome
  (Junicode roman and italic, Fell Great Primer, Courier Prime), not the rubricated text. Since the ornament no longer
  waits for them (§2), they now only share the line with the bake. Subsetting further (Junicode 2 is a variable font with
  many features; the italic, 107 kB, sets one button and a few labels) would save ~150 kB a page on the phone, but they are
  the owner's choice of faces and their subsets were made by hand (fontTools is not installed here, and a re-instanced
  variable font is not guaranteed pixel-identical). Not done.
- **Lossless WebP at -z 9** makes the bands 4 % smaller for ~0.4 s more per band at build time (683 bands). Not worth it.
- **Shader compile**: only a page drawn live makes a WebGL context (Choir book, before §2's fix; any page on a setting
  the bake does not hold). Its compile and link take 6-10 ms of the 12-26 ms the contexts cost; compiling every program
  before checking any (KHR_parallel_shader_compile's pattern) would save a few ms there. Not done: no first visit pays it.
- **Immutable caching for the modules and faces** would save every repeat visit a revalidation per file, but their names
  do not change when they do (kit/illum.js, faces/junicode-roman.woff2), so a stale module beside a new one could break
  the page (tools/serve.py's note). Fingerprinted names would need a build step that rewrites every import. Not done; the
  bands, whose names are now their bytes' hash, are cached immutably (§2).
- **A page drawn from the bake is not remembered in IndexedDB**, so a repeat visit asks the bake again (now from the HTTP
  cache, immutably, with no round trip but the manifest's and hash's revalidation).
- **The chrome's own layout shift**: the viewer row and masthead move by a few px as Junicode and Fell swap in
  (font-display: swap). Preloading them would compete with the bake on the phone; `optional` would show the fallback on a
  slow first visit. Left as designed.
- **The see page's viewer row moves the sheet on the phone**: the style's name (set by see.js, "Rock carving" in place of
  the HTML's "Blackletter") and the swap from the fallback face to Fell make the row wrap and unwrap, and the sheet below
  jumps 44 px up to three times (CLS up to ~1 on Rock, on HEAD too). Reserving the row's height, or giving the name a line
  of its own, would fix it, but that is the site's layout, the owner's to choose.
- **A bake that remembered nothing stays empty**: tools/bake.mjs stamps a setting that remembered nothing (as
  sources.html rightly does) like any other, so a setting that missed once under load (a page that took over 8 s to draw)
  is skipped by every later build until its page or the library changes. Seen once in five builds here (Rock 1440 light
  dpr 2, while six other browsers were drawing). Not changed: rare, and any library change rebakes it.
