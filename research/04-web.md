# 04 · Shipping illumination on the web (late 2026)

How illum gets painted grounds, drawn rules, illuminated initials, margin gardens, gilding, paper and growth onto real pages: fast, accessible, robust, desktop-first but whole on phones. Part A covers renderers, B the CSS that carries ornament, C strategy (prebake, runtime, caching, formats), D layout and DOM integration, E fonts, F accessibility, G mobile, H shipping it as a public library. Then the recommended architecture and the gotchas.

**Source legend.** "fetched 2026-11-06" means retrieved and read for this note. "[unverified]" means a search snippet, secondary source or prior knowledge; check before relying on it. Browser versions come from two machine-readable sources fetched today, cited as **[BCD]** and **[WF]**:
- [BCD] MDN browser-compat-data 8.1.8, data timestamp 2026-11-02, `https://unpkg.com/@mdn/browser-compat-data/data.json` (fetched 2026-11-06). Current stable that day: Chrome 156 (157 beta), Firefox 159 (released 2026-10-27; Firefox and Chrome now ship every two weeks), Safari 27.2 (2026-10-26).
- [WF] web-features (Baseline status), `https://unpkg.com/web-features/data.json` (fetched 2026-11-06).

Versions are written C/FF/Saf (Saf includes iOS unless noted).

**Local evidence.** Two working systems in `refs/` already make most of these calls, and are cited by path:
- `refs/initialis/lib/initialis.js` + `render/src/worker.js`: runtime rendering. A pool of `min(3, hardwareConcurrency/2)` module workers, each drawing with WebGL2 + OffscreenCanvas, returning `ImageBitmap`s by transfer. Lost GPU contexts are detected and retried. DPR is capped at 2, growth has a time budget, and nothing grows until an `IntersectionObserver` says it's visible.
- `refs/pie-site/`: prebaking. `tools/build_*.mjs` drives headless Chrome (puppeteer) to render brush strokes, initials and gardens to WebP, and growth to VP9-alpha WebM. `js/brush.js` hands out 64 prebaked strokes round-robin (the runtime painter is kept but unused). `js/main.js` plays alpha video only where VP9 alpha works and not under reduced motion, falls back to a still everywhere else, and keeps one decoder at a time on phones.

**Measurement rig (own numbers, "M:" below).** `research/04-web-bench.html` (kept beside this file so it can be rerun on real devices) was run on 2026-11-06 under Playwright 1.63 headless: Chromium 153 and Firefox 155. The machine is Linux, 20 cores, **software rasterization** (WebGL reports SwiftShader). GPU access was unavailable in the sandbox, and the WebKit build would not launch (missing system libraries), so there are no WebKit numbers. Read every M: figure as *relative* CPU cost on a fast desktop, not as phone or GPU timings. Each figure is a median of 3–5 runs, with Chromium | Firefox side by side. Chromium ranges span two separate invocations, and the spread is real run-to-run variance in software raster.

| Test (M:) | Chromium 153 | Firefox 155 |
|---|---|---|
| Brush stroke 900×180, 57,960 `stroke()` calls (pie-site `brushStroke` algorithm) | 58–105 ms | 132 ms |
| Same, one path per hair (420 `stroke()` calls) | 1.8–3.6 ms | 36 ms |
| 5,000 cubic Béziers 1600×900, one `stroke()` each | 226–349 ms | 242 ms |
| Same 5,000 in **one** `Path2D`, one `stroke()` | 679–940 ms | 687 ms |
| SVG DOM: 1k / 5k / 20k `<path>` (1200×400), insert → next frame | 9 / 30 / 188 ms | 13 / 84 / 406 ms |
| SVG-as-image rasterized to canvas 1200×400: plain / feTurbulence 1 oct / 5 oct / turb+displace+blur / feGaussianBlur σ10 | 1 / 7 / 17 / 16 / 7 ms | 4 / 14 / 25 / 32 / 10 ms |
| `ctx.filter='blur(10px)'` drawImage 1200×400 | 5 ms | 11 ms |
| `toDataURL` 900×180: PNG / WebP q.84 | 4–5 / 22–36 ms | 3 / 26 ms |
| Bytes 900×180 brush: PNG / WebP q.84 | 198 KB / 9.5 KB | 116 KB / 8.9 KB |
| `toBlob('image/webp')` 1600×900 | 210–250 ms | 249 ms |
| OffscreenCanvas worker: one brush, post → ImageBitmap back | 86–92 ms | 142 ms |
| 8 brushes on 4 workers | 399 ms | 1,899 ms |
| 50k soft dots: Canvas2D `arc` fills / WebGL2 instanced quads (SwiftShader) | 400 / 642 ms | 797 / n/a (no WebGL2 headless) |

---

## Part A · Renderers

### A1 · Canvas2D is the default brush
- **Principle.** Paint strokes, washes and stamps in Canvas2D. Reach for GL only when a feature needs per-pixel shading (a paper's tooth catching the light, gold specular, wet-edge pigment pooling) or more than ~10⁴ stamps per frame.
- **Why.** Canvas2D works everywhere, works in workers (OffscreenCanvas: C69/FF105/Saf16.4 [BCD]; Baseline high 2025-09-27 [WF]), puts antialiasing, gradients and compositing modes behind one API, and its output drops straight into an `<img>`/CSS-background pipeline. Its cost is per *call*, not per pixel. The pie-site brush makes 57,960 `stroke()` calls and costs 58–132 ms (M:). Grouping one path per hair cuts that 16–32× (M:). The catch: `globalAlpha` composites once per `stroke()`, so batching makes overlapping segments of one hair merge instead of building up. Batch where the look survives it (one path per hair, per leaf, per hatch family), not across hairs.
- **How.** Precompute geometry from the seed; group by style; `ctx.beginPath()` … `stroke()` once per group. Avoid `getImageData` on the hot path, and when you must read back (texture synthesis) use `getContext('2d', { willReadFrequently: true })` (C99/FF28/Saf18 [BCD]). `ctx.reset()` (C99/FF113/Saf17.2) clears state cheaply when reusing a canvas.
- **Support & cost.** Universal. On iOS the limits are memory, not features (see G1).
- **Sources.** [BCD]; [WF]; M:; `refs/pie-site/js/brush.js`.

### A2 · Path2D: reuse, don't merge everything
- **Principle.** Use `Path2D` to *cache* geometry you redraw: a glyph outline, a vine segment drawn every growth frame, a hatch tile. Don't merge thousands of unrelated subpaths into one.
- **Why.** Stroking 5,000 Béziers held in one Path2D was **2.7–3× slower** than stroking them one by one, in both engines (M: 679–940 vs 226–349 ms). A huge self-overlapping path makes the stroker do far more work. On GPU-backed canvas this may come out differently; that wasn't measurable here.
- **How.** `const p = new Path2D(svgD)` (the SVG path-string constructor works everywhere [unverified for exact versions; Path2D C36/FF31/Saf8 BCD]); `ctx.stroke(p)`; `ctx.isPointInPath(p, x, y)` for hit-testing marginalia. Cache Path2D objects per seed in a `Map`.
- **Support & cost.** Universal [BCD].
- **Sources.** [BCD]; M:.

### A3 · SVG DOM for few, crisp, scalable, editable marks
- **Principle.** Use SVG for vector ornament that must scale with type, recolor with CSS (`currentColor`, `light-dark()`), be crisp at any zoom and print as vectors: rules, frames, fleurons, line-art initials. Keep each SVG to roughly ≤2k nodes if it animates and ≤5k if static.
- **Why.** SVG DOM cost scales with node count. M: 1k paths 9–13 ms, 5k 30–84 ms, 20k 188–406 ms to first frame (Firefox about 2× Chromium). Published rules of thumb agree: SVG starts falling behind around 10³–10⁴ elements, Canvas around 10⁴–10⁵, and WebGL holds up beyond (Horak et al. 2018 measured FPS loss from about 8,000 graphical elements for SVG and Canvas alike). A margin garden of tens of thousands of hatch strokes is not SVG-DOM material; a 300-path vine is.
- **How.** Generate the `d` strings at build time or in a worker, then insert once (`innerHTML` of one `<svg>` string beats per-node `createElementNS`). Use `vector-effect: non-scaling-stroke` for hairlines, and `pathLength="1"` + `stroke-dasharray`/`dashoffset` for "drawn" rules (animatable with CSS, works without JS).
- **Support & cost.** Universal.
- **Sources.** M:; Horak 2018 poster `https://mt.inf.tu-dresden.de/cnt/uploads/Horak-2018-Graph-Performance-Poster.pdf` (search snippet, [unverified] numbers); `https://chartts.pages.dev/blog/canvas-vs-svg-vs-webgl` (rule of thumb, [unverified]).

### A4 · SVG filters: bake them, never animate them
- **Principle.** feTurbulence, feDisplacementMap and feGaussianBlur are the quickest way to rough an edge, grain a ground or bleed a wash. Use them **once**, as a static filter, or to rasterize into a bitmap (prebake or one-time runtime). Never animate `baseFrequency`/`scale` over a large area.
- **Why.** Rasterizing a 1200×400 turbulence costs 7–14 ms at 1 octave and 17–25 ms at 5; turbulence + displacement + blur costs 16–32 ms (M:). That's a whole 16.7 ms frame or more, on a fast desktop CPU. Cost grows with filter-region area and `numOctaves` (Mozilla bug reports). GPU help is patchy: Chrome's Skia uses a GPU path for *animated* filters (old Chromium design doc); Firefox WebRender does not accelerate feDisplacementMap (bug 1845890, open); WebKit has no GPU path for SVG filters (bug 263848: "Safari is slow on animated SVG because filters don't use the GPU", with a tester measuring Safari about 5× slower than Chrome on a filtered SVG and crashes on older iPhones, bug 191197).
- **How.** Keep filter regions tight (`x/y/width/height` on `<filter>`, `filterUnits="userSpaceOnUse"`). Set `color-interpolation-filters="sRGB"` for predictable colour. Use displacement `scale` ≤ about 30 user units for "deckled" edges. Animate a static, filtered element with transform/opacity only. For runtime grain, draw an SVG-as-image to canvas once (`img.decode()` then `drawImage`) and reuse the bitmap.
- **Support & cost.** The filter primitives are universal; cost as above. Animated filters on iOS are a known jank source [unverified: GreenSock forum reports].
- **Sources.** M:; `https://bugzilla.mozilla.org/show_bug.cgi?id=1845890`; `https://bugs.webkit.org/show_bug.cgi?id=263848`; `https://bugs.webkit.org/show_bug.cgi?id=191197`; `https://www.chromium.org/developers/design-documents/image-filters/` (all via search snippet, [unverified] beyond the quoted lines).

### A5 · `ctx.filter` is not portable
- **Principle.** Don't depend on Canvas2D `filter` (`blur()`, `url(#svgFilter)`) for the core look.
- **Why.** C52/FF49; **Safari 18+ only behind a flag**, and `OffscreenCanvasRenderingContext2D.filter` is missing in Safari entirely [BCD]. It's cheap where it exists (M: blur 10px on 1200×400 = 5–11 ms).
- **How.** Blur washes with your own separable box blur in a worker (three box passes approximate a Gaussian), or with a WebGL pass, or bake it. Use `ctx.filter` only as a progressive nicety, behind `'filter' in CanvasRenderingContext2D.prototype` (and note that check passes on Safari even when the flag is off [unverified], so prefer a pixel test).
- **Sources.** [BCD]; M:.

### A6 · WebGL2 for shading, stamping and the "print pass"
- **Principle.** Use WebGL2 where a feature is per-pixel: paper height-map lighting, gold leaf specular/normal maps, pigment granulation, the "print" composite (ink spread, registration, paper tooth), or ≥10⁴ textured brush stamps.
- **Why.** WebGL2 is everywhere (C56/FF51/Saf15 [BCD]) and in workers via OffscreenCanvas everywhere since Saf17 [BCD], which is what initialis relies on ("It needs WebGL2 in web workers… Safari 17 or later"). Instanced stamps cost one draw call whatever the count. The SwiftShader figure (M: 642 ms for 50k stamps) is software emulation and says nothing about real GPUs. Real-GPU timing for 50k small blended quads is in the sub-millisecond-to-few-ms range [unverified; rerun `04-web-bench.html` on hardware].
- **How.** Draw stamps with `drawArraysInstanced` and a per-instance buffer (x, y, size, rotation, pigment). Use premultiplied alpha. Check `gl.isContextLost()` after each job and respawn (worker.js does exactly this: "a lost GPU… draws blank without a word").
- **Support & cost.** Context caps: about 16 active contexts on desktop and 8 on Android Chrome, after which the *oldest is lost* [unverified: Stack Overflow measurements; Chromium says the limit won't rise]. **One context per worker, never one per element.**
- **Sources.** [BCD]; `refs/initialis/render/src/worker.js`; `https://groups.google.com/a/chromium.org/g/graphics-dev/c/fmNedEEAYpA` (snippet).

### A7 · WebGPU: optional backend, not a requirement
- **Principle.** Don't require WebGPU for illum. Consider it later for compute work (fluid watercolour simulation, large reaction-diffusion margins) behind feature detection, with a WebGL2 fallback.
- **Why.** Shipping: Chrome desktop (BCD lists full support at C144, partial since 113), Chrome Android 121, **Safari 26 on macOS/iOS/iPadOS/visionOS** (WebKit Safari 26.0 post: "now shipping… for macOS, iOS, iPadOS, and visionOS"), Firefox 141 on Windows and 147 on Apple-Silicon macOS (release notes, 2026-01-13), with Linux/Android Firefox not confirmed. Not Baseline [WF]. Headless Chromium and Firefox in the rig had no adapter. Everything illum draws is 2D compositing that WebGL2 already does.
- **How.** `const a = await navigator.gpu?.requestAdapter()`; race it against a timeout. `OffscreenCanvas.getContext('webgpu')` works in workers (C144/Saf26 [BCD]).
- **Sources.** [BCD]; [WF]; `https://webkit.org/blog/17333/webkit-features-in-safari-26-0/` (fetched 2026-11-06); `https://www.firefox.com/firefox/147.0/releasenotes/` (snippet).

### A8 · OffscreenCanvas + workers + ImageBitmap: the runtime pipeline
- **Principle.** Do heavy painting off the main thread. Keep params in and pixels out, and keep the main thread to `drawImage` or setting a URL.
- **Why.** A brush at 58–132 ms on the main thread is a guaranteed long task (>50 ms) and an INP hit. In a worker it costs the page nothing. M: round-trip 86–142 ms for one brush, so transfer overhead is small next to the painting. Parallelism is real but sublinear: 8 brushes on 4 workers took 399 ms in Chromium (vs about 700 ms sequential) and did badly in Firefox's software path (1,899 ms). Pool size `min(3, hardwareConcurrency/2)` (initialis) is a sane default.
- **How.** Two shapes:
  1. *Job queue → ImageBitmap* (initialis): worker owns `new OffscreenCanvas(w,h)`, draws, `transferToImageBitmap()`, `postMessage({bitmap}, [bitmap])`; the page calls `drawImage(bm)` then `bm.close()`. Good for many small targets, and the only option when the result becomes a CSS background (then `convertToBlob()` in the worker → `URL.createObjectURL`).
  2. *`canvas.transferControlToOffscreen()`* (C69/FF105/Saf16.4 [BCD]): the worker drives a visible canvas directly, so animation keeps going even when the main thread is busy. Good for one live hero (growing initial, gold shimmer).
  Cross-origin library: a page can't `new Worker(crossOriginURL)`, so initialis starts a blob-URL shim that `import()`s the real worker and queues messages until it loads. Copy that.
- **Support & cost.** ImageBitmap C50/FF42/Saf15 [BCD]. Blob workers need CSP `worker-src blob:`.
- **Sources.** [BCD]; M:; `refs/initialis/lib/initialis.js` (`spawn`, `pump`).

### A9 · devicePixelRatio, resizing, caps
- **Principle.** Back buffers are `cssSize × min(dpr, 2)` and are resized only when the device-pixel size really changes.
- **Why.** DPR 3 means 9× the pixels of DPR 1 and 2.25× DPR 2. For painterly art the jump from 2 to 3 is invisible and costs memory and time (see G1). initialis caps with `Math.min(2, devicePixelRatio)` in both `fit()` and the custom element.
- **How.** One `ResizeObserver` for all illum hosts. Use `entry.devicePixelContentBoxSize` where present (C84/FF108; **not Safari** [BCD]), else `Math.round(contentRect.width * dpr)`. Listen to `matchMedia('(resolution: ' + dpr + 'dppx)')` change to catch zoom and monitor moves. Debounce re-renders (seeded art is deterministic, so a resize recomposes the same design at a new size). Prefer art that *recomposes to the box* over stretching: the pie-site brush uses `background-size: 100% 100%` and accepts the distortion, fine for a stroke and wrong for a garden.
- **Sources.** [BCD]; `refs/initialis/lib/initialis.js` (`fit`).

### A10 · CSS Houdini Paint API: still Chrome-only, don't build on it
- **Principle.** Don't make `paint()` the delivery path, even though "a painted ground behind a heading" is exactly what it was designed for.
- **Why.** `paint()` / `CSS.paintWorklet`: C65; **Firefox no, Safari no** in BCD 8.1.8, and marked experimental. Not Baseline [WF]. Eight years on, no movement. M: Playwright Chromium even reported `CSS.paintWorklet` absent in its headless build.
- **How.** Get the same effect with a worker-rendered blob URL fed to a CSS custom property (`el.style.setProperty('--illum-ground', 'url(blob:…)')`), so CSS still owns placement, `background-size` and media queries. If Paint is ever wanted as a Chrome enhancement, register the same seeded painter module in both places.
- **Sources.** [BCD]; [WF]; `https://web.dev/articles/houdini-how` (snippet, dated).

### A11 · Watch: HTML-in-canvas
- `drawElementImage()` (C157 experimental; origin trial from Chrome 148, attribute renamed from `layoutsubtree` to `content="drawable"`, and from C155 `drawElementImage` returns void) lets you draw live, accessible HTML text into a canvas. That would mean real text inside a painted, distorted, gilded composition with no loss of semantics. Chrome-only, unstable API: prototype only. Sources: [BCD]; `https://developer.chrome.com/blog/html-in-canvas-ot-changes` (snippet).

---

## Part B · CSS as the carrier of ornament

### B1 · Masks, borders, frames
- **Principle.** Let CSS place and clip the art, and let the art be a bitmap or SVG. Use `border-image` (9-slice) for drawn frames, `mask-image` for brush-edged grounds and torn edges, and avoid `mask-border`.
- **Why.** `mask-image` unprefixed C120/FF53/Saf15.4, Baseline high 2026-06-07 [WF]. `border-image` is universal. `mask-border` is **Safari 17.2 only** unprefixed, Chrome only via `-webkit-mask-box-image`, Firefox none [BCD]. pie-site already does brush-edged list bullets with `mask-image: url(art/brush/39.webp)` (`css/voices.css:135`).
- **How.** A painted ground behind a heading: `background: url(ground.webp) center/100% 100% no-repeat`, or a mask so the ground takes `currentColor`/theme colours: `background: var(--wash); mask: url(brush-alpha.webp) center/100% 100%`. The mask route recolors for dark mode with no second asset. Frames: `border-image: url(frame.svg) 40 / 40px / 0 round` (rounded repeats keep the corners whole).
- **Sources.** [BCD]; [WF]; `refs/pie-site/css/voices.css`.

### B2 · Gilding and inking text: `background-clip:text`, `paint-order`, blend modes
- **Principle.** Gold or ink texture *inside* real text with `background-clip: text`; outlined capitals with `paint-order: stroke fill` + `-webkit-text-stroke`; ink sinking into paper with `mix-blend-mode: multiply`.
- **Why.** `background-clip: text` C120/Saf14 unprefixed, FF49 partial [BCD]. Keep `-webkit-background-clip` too. `paint-order` on HTML text is Baseline high 2026-09-22 [WF]. `mix-blend-mode` is universal, but each blended element forces a compositing layer and isolation [unverified as a cost figure]; use it on a few large layers, not on hundreds of spans.
- **How.** `.gilt{background:url(gold.webp) 0 0/200px; -webkit-background-clip:text; background-clip:text; color:transparent}`. Always keep a solid `color` fallback under `@supports not (background-clip:text)`, and under forced colors (F3) put the real colour back. Animate the gold with `background-position` driven by a scroll timeline (B5), not a JS loop.
- **Sources.** [BCD]; [WF].

### B3 · Drop caps: `initial-letter`, `text-box-trim`, and the cap behind the letter
- **Principle.** The letter stays real text; the illumination is a decorative layer behind or around it. Size and align with `initial-letter` where it exists, with a float fallback.
- **Why.** `initial-letter`: C110; Safari only `-webkit-` and partial; **Firefox none** [BCD] (M: Firefox 155 `CSS.supports` false). `text-box-trim`/`text-box`: C133/Saf18.2/FF154 [BCD] (not yet flagged Baseline in [WF]), and it removes the half-leading that misaligns caps and rules. initialis's custom element is `role="img"` with `aria-label="drop cap Q"`. If the page also omits the Q from the text, a screen reader hears "drop cap Q, uick brown…". Better: keep `<span class="cap">Q</span>uick`, give the art `aria-hidden="true"`, and make the span transparent or visually replaced.
- **How.**
  ```css
  p.illum::first-letter { initial-letter: 3; -webkit-initial-letter: 3; color: transparent; }
  @supports not ((initial-letter: 3) or (-webkit-initial-letter: 3)) {
    p.illum::first-letter { float: left; font-size: calc(3 * 1lh); line-height: 1; margin-inline-end: .1em; }
  }
  ```
  The illuminated square sits behind `::first-letter` as a background (prebaked WebP, or blob URL from the worker). Or, if `<illum-cap>` wraps the letter, the element is the float and the letter inside is styled transparent. Put the layout CSS in the stylesheet so the cap's box exists before JS (CLS = 0).
- **Sources.** [BCD]; [WF]; M:; `refs/initialis/lib/initialis.js` (`InitialisCap`).

### B4 · Text wrapping round ornament: `shape-outside` with image masks
- **Principle.** A floated painted initial or vignette uses its own alpha as the wrap shape.
- **Why.** `shape-outside: url()` is universal (C37/FF62/Saf10.1, Baseline high [WF]). The image must be same-origin or CORS-enabled, or the shape silently falls back to the box.
- **How.** `float:left; shape-outside: url(cap-alpha.webp); shape-image-threshold:.3; shape-margin:.4em`. Use the prebaked art itself (or a small 1/4-resolution alpha twin). With runtime art, set `shape-outside` to the same blob URL; blob URLs are same-origin.
- **Sources.** [BCD]; [WF].

### B5 · Marginalia: anchor positioning, with a layout fallback
- **Principle.** A margin note or margin flower is *anchored to a word or line* and placed in the margin. When there's no margin it falls back into the flow (see G6).
- **Why.** `anchor-name`: C125/FF147/Saf26. The current-spec `position-anchor` arrived in full only at C151/FF151/Saf27; earlier versions are "partial" [BCD]. [WF] still doesn't call anchor positioning Baseline. So it works in every current engine, but behaviour differs in versions from a few months ago.
- **How.**
  ```css
  .gloss-ref { anchor-name: --g1; }
  .gloss { position: absolute; position-anchor: --g1; left: calc(anchor(right) + 2rem);
           top: anchor(top); position-try-fallbacks: flip-inline, --inline-below; }
  @container article (width < 60rem) { .gloss { position: static; } }  /* back into the flow */
  ```
  Fallback without anchor support: the JS measurer (D1) sets `top` from `range.getBoundingClientRect()`. Or use a Tufte-style grid where notes are floated siblings with negative margins.
- **Sources.** [BCD]; [WF].

### B6 · Motion without JS: scroll-driven animations, view transitions, `@property`, `sibling-index()`
- **Principle.** "Grows in as you reach it" should be CSS keyframes on a `view()` timeline wherever possible, with a JS IntersectionObserver fallback. Animating the custom properties the art reads (`--grow: 0→1`) needs `@property`.
- **Why.** Scroll-driven animations: C115/Saf26/**FF159**. That makes them Baseline newly available **2026-10-27** [WF], two weeks old. `@property`: Baseline 2024-07-09 [WF]. Same-document View Transitions: Baseline 2025-10-14; cross-document C126/Saf18.2, Firefox no [WF]. `sibling-index()` C138/FF154/Saf26.2 makes staggered petal or stroke delays CSS-only. `random()` C156/Saf26.2/FF preview [BCD], but per-element `random()` isn't tied to illum's seeds, so keep the randomness in the generator.
- **How.**
  ```css
  @property --grow { syntax: '<number>'; inherits: true; initial-value: 1; }
  @media (prefers-reduced-motion: no-preference) { @supports (animation-timeline: view()) {
    .garden { animation: grow linear both; animation-timeline: view(); animation-range: entry 10% cover 40%; }
    @keyframes grow { from { --grow: 0 } to { --grow: 1 } } } }
  .garden path { stroke-dashoffset: calc(1 - var(--grow)); }
  ```
  Default `initial-value: 1` means anything unsupported shows the finished art. Use View Transitions for the playground (morph one seed's initial into the next).
- **Sources.** [BCD]; [WF].

### B7 · Container queries choose the composition
- **Principle.** An ornament responds to *its box*, not the viewport: a heading ground in a sidebar is not a hero ground.
- **Why.** Container queries are Baseline high 2025-08-14 [WF]. `cqi` units size strokes and margins relative to the container.
- **How.** `.illum-host{container: illum / inline-size}`; `@container illum (width < 30rem){ .vine{display:none} }`. For runtime art, read the same breakpoints in JS from the ResizeObserver size and pick a *composition class* (narrow, medium, wide), not a pixel width. Then caching works (C3).
- **Sources.** [WF].

---

## Part C · Strategy: prebake, runtime, hybrid

### C1 · Hybrid by default: prebaked first paint, runtime as enhancement
- **Principle.** Every ornament has a static rendition shipped as a file (or inline SVG) that renders with no JS. Runtime rendering is an *upgrade*, for unique-per-element variety, live growth, interaction or the playground. It is never a prerequisite.
- **Why.** pie-site went from runtime to prebaked for the same art. `brush.js` keeps `brushStroke()` but the page uses `art/brush/NN.webp`, "one per element, none repeated". Prebaked art is 9–16 KB per stroke (pie-site 64 strokes = 1.2 MB total; M: one WebP 9.5 KB vs PNG 198 KB), costs 0 ms of main thread, is LCP-safe and is cached by the HTTP cache. Runtime art costs 60–130 ms per stroke on a desktop CPU (M:), more on phones, plus the JS and fonts. The playground needs runtime anyway, so one renderer serves both. Build in headless Chrome with the *same module* that runs in the browser (`tools/build_static.mjs` loads `static-render.html` and reads `window.OUT`).
- **How.** Pipeline: `illum bake` (Node + puppeteer/playwright) renders `{feature, seed, composition, theme, dpr}` → WebP/AVIF (and JXL, C4) + a JSON manifest (intrinsic size, dominant colour, alpha-bbox for `shape-outside`). The page markup references them directly. At runtime, if the element opts in (`live`, `grow`, or a seed the manifest doesn't have), the worker renders, the result fades in over the still, and the still is the fallback on any error or timeout. The build measures real layout on the live page before baking (as `build_growth.mjs` does with `getBoundingClientRect` for avoid-rects); keep that, it's how gardens avoid text.
- **Sources.** `refs/pie-site/js/brush.js`; `refs/pie-site/tools/build_static.mjs`, `build_growth.mjs`; M:.

### C2 · Deterministic seeding per element
- **Principle.** Same seed + same params + same composition class ⇒ the same pixels, at build time and at runtime, in every browser. Seeds come from content, not order.
- **Why.** Determinism makes prebake/runtime interchangeable and caching possible, and lets a ground keep its seed across a resize. pie-site's `uniqueSeed()` uses a page-load counter (`1000 + 7919 * ++counter`) and round-robin `brushUrl()`, so inserting one heading reshuffles every stroke below it.
- **How.** `seed = hash32(pageId + '#' + (el.id || headingText) + '/' + feature)` (FNV-1a or `crypto.subtle.digest` truncated), with an explicit `seed` attribute as override. One PRNG per element (sfc32/mulberry32; pie-site uses an LCG), split per sub-feature (`rng(seed ^ 0x51ED)`) so adding a flower doesn't shift every later leaf. Never use `Math.random()` in renderers. Canvas antialiasing can differ by a pixel between engines; that's fine. Geometry must not.
- **Sources.** `refs/pie-site/js/brush.js`.

### C3 · Caching runtime output
- **Principle.** Key = `hash(libVersion, feature, params, seed, composition, w×h@dpr, theme)`. Layers: in-memory `Map` → Cache API (or OPFS) → render.
- **Why.** OPFS is Baseline high 2025-09-27 [WF]; Cache API is universal [BCD]. Data URLs are the wrong currency. `toDataURL` is synchronous on the main thread (M: 22–36 ms for a 900×180 WebP), base64 adds 33%, and the string is copied wherever it's used. pie-site's runtime `brushStroke` did exactly this. A blob from `convertToBlob()` in a worker plus `URL.createObjectURL` is async and zero-copy, and works as `img.src`, CSS `url()`, `mask-image` and `shape-outside`.
- **How.** `cache.put(new Request('/__illum/'+key), new Response(blob, {headers:{'content-type':'image/webp'}}))`. On hit, `URL.createObjectURL(await res.blob())`. Revoke URLs when elements disconnect. Encoding WebP is the expensive step (M: 210–250 ms for 1600×900), so in-session keep the `ImageBitmap` and encode for persistence only on `requestIdleCallback`/idle, and only for large or slow renders (e.g. >50 ms render time, which initialis reports via `timed`).
- **Sources.** [BCD]; [WF]; M:.

### C4 · Image formats
- **Principle.** WebP (lossy with alpha) is the universal workhorse. AVIF for large opaque or soft-alpha grounds. JPEG XL newly possible as a first `<source>`. PNG only as a build intermediate.
- **Why.** WebP Baseline high since 2023; AVIF Baseline high **2026-07-25** [WF]. **JPEG XL now ships in all three engines**: Chrome **155** (decoding, Rust `jxl-rs`; Chrome blog 2026-10-06), Firefox 158, Safari 17 [WF]. It's not Baseline yet (Edge not listed), and the Chrome support is weeks old. M: the pie-site brush as WebP q.84 = 9.5 KB vs PNG 198 KB. pie-site's whole-page gardens are 234–517 KB WebP and initials average 67 KB (hero 357 KB). AVIF beats WebP on smooth washes, while WebP often holds up on high-frequency bristle detail [unverified, measure per asset]. Lossless JXL is the right archival/bake intermediate [unverified sizes].
- **How.** `<picture><source type="image/jxl" srcset=…><source type="image/avif" srcset=…><img src="x.webp" alt="" width height decoding="async" loading="lazy"></picture>`. Bake each asset at 1× and 2× of its composition width only. Set `fetchpriority="high"` on the one LCP-adjacent piece (C102+/FF132/Saf17.2 [BCD]).
- **Sources.** [WF]; `https://developer.chrome.com/blog/jpeg-xl-in-chrome` (fetched 2026-11-06); M:; `refs/pie-site/art/`.

### C5 · Animated assets: alpha video vs animated WebP vs Lottie/Rive vs live canvas
- **Principle.** Recorded growth (vines climbing, ink spreading) = alpha video with a still poster. Interactive or unique-per-seed growth = live canvas in a worker. Vector-only motion = SVG + CSS. Lottie/Rive only if a designer authors the motion in their tools.
- **Why.** Transparent video is still split: **VP9-alpha WebM in Chrome/Firefox; HEVC-alpha (`hvc1`) MP4/MOV in Safari**. Safari plays VP9 but ignores its alpha. "WebM transparency is coming to Safari" with Safari 27 per a vendor blog, but unconfirmed in Apple notes ([unverified], Rotato, updated 2026-08-19). pie-site sniffs this (`canPlayType('video/webm; codecs="vp9"')` and not Safari) and shows a still otherwise. Its 40-frame 12 fps growths are 53–635 KB WebM, the same order as the finished-garden still (234–517 KB), so motion costs about 2× bytes. Animated WebP has no seeking, no playback control and decodes on the main thread [unverified]. Lottie/Rive: dotLottie runtime ~150 KB (vendor claim), Rive WASM ~261 KB brotli (Rive docs) [unverified], and both are vector-first, so painterly raster texture balloons them. Live canvas: 0 bytes of asset, but CPU/battery per frame.
- **How.** `<video muted playsinline preload="none" poster="final.webp"><source src="g.mov" type='video/mp4; codecs="hvc1"'><source src="g.webm" type="video/webm"></video>`, HEVC first. Start on intersection. On `ended`, swap in the still and release the decoder (`removeAttribute('src'); load()`), as pie-site does. Encode with `libvpx-vp9 -pix_fmt yuva420p -crf 36 -b:v 0 -auto-alt-ref 0` (pie-site flags), and HEVC alpha via `avconvert`/`hevc_videotoolbox -alpha_quality` on a Mac [unverified flag]. The build host is a Mac (puppeteer path in `build_*.mjs`).
- **Sources.** `https://rotato.app/blog/transparent-videos-for-the-web` (fetched 2026-11-06); `https://jakearchibald.com/2024/video-with-transparency/` (snippet); `refs/pie-site/js/main.js` (gardens), `tools/build_growth.mjs`; `https://rive.app/docs/runtimes/web/canvas-vs-webgl.md`, `https://github.com/LottieFiles/dotlottie-web` (snippets).

### C6 · Budgets
- **Principle.** Ornament gets a fixed budget, and the library enforces it (it degrades to stills, not to jank).
- **Why/How (proposed numbers):**
  - **JS:** core + custom elements ≤ 15 KB brotli. Renderers lazy-loaded per feature (initialis fetches each "kind" module on demand) ≤ 40 KB each. No library on the critical path.
  - **Bytes per page view:** above-the-fold art ≤ 250 KB desktop / 150 KB phone. Total eager art ≤ 1 MB desktop / 500 KB phone. Video growth only on intersection, one at a time on phones. (pie-site's `art/` is 23 MB on disk but lazy and per-breakpoint, so a visit fetches a fraction.)
  - **Main thread:** no task > 50 ms from illum. Per element, ≤ 4 ms of main-thread work (attach, measure, `drawImage`). Everything else in workers.
  - **Worker time:** a render budget in ms (initialis `budget = 8000` for growth and `QUALITY = 0.6`; growth stops where it got to), smaller on phones.
  - **Layout:** decoration contributes **0** to CLS (D2). Decoration is never the LCP element unless it's the hero, and then it's prebaked with `fetchpriority=high`. pie-site gates page reveal on the hero image with a 1,200 ms race, which risks LCP. Cap it at about 300 ms or reveal text immediately.
- **Sources.** `refs/initialis/lib/initialis.js` (`QUALITY`, `BUDGET`); `refs/pie-site/js/main.js` (`boot`).

---

## Part D · Layout and DOM integration

### D1 · Measuring what to ornament: boxes, lines, words
- **Principle.** Ornament fits the real typeset text. Measure line boxes and word boxes, never estimate them from character counts.
- **Why/How.**
  - Element boxes: one shared `ResizeObserver` (universal [BCD]).
  - **Per line:** `el.getClientRects()` on an inline element returns one rect per line fragment. For a block, build a `Range` over its text (`range.selectNodeContents(p)`) and call `range.getClientRects()` (C4/FF4/Saf5 [BCD]). Rects with the same `top` (±1px) are the same line: union them. That gives line-length–aware rules under headings, the last line's end for a tailpiece, and a ragged edge for margin growth to hug.
  - **Per word:** `Intl.Segmenter(lang, {granularity:'word'})` over the text node → `range.setStart/End` per segment → `getBoundingClientRect()`. Use it to underline-paint one word or anchor a gloss.
  - Re-measure on `ResizeObserver`, `document.fonts.ready` / `loadingdone` (fonts change line breaks), and `@container` changes. Batch reads before writes. Do all measuring in one rAF.
  - The CSS Custom Highlight API (C105/FF140/Saf17.2 [BCD]) can style ranges without wrapping spans, but `::highlight()` only takes colour/decoration, not images. Use it for the accessible text tint and the canvas for the paint.
- **Sources.** [BCD]; `refs/pie-site/tools/build_growth.mjs` (avoid-rects from `getBoundingClientRect`).

### D2 · Zero layout shift
- **Principle.** Decoration never changes layout after first paint.
- **How.** (a) Ornament is a background, pseudo-element or absolutely positioned child of a `position: relative` host, so it has no flow box. (b) Anything that *does* take space (drop cap, vignette, margin column) gets its box from CSS at first paint (`initial-letter`, `aspect-ratio`, `width/height` on `<img>`/`<canvas>`), and the art fills it later. (c) Swapping still → live uses `opacity`, never a size change. (d) Font loading changes line breaks and moves measured ornament; render after `document.fonts.ready` or re-measure on it. pie-site awaits `document.fonts.ready` in `boot()`.
- **Sources.** `refs/pie-site/js/main.js`.

### D3 · Render only what's visible: IntersectionObserver + `content-visibility`
- **Principle.** Nothing renders, decodes or plays until it's near the viewport. Long illuminated pages skip off-screen layout and paint.
- **Why.** `content-visibility: auto` cut a long page's initial render from 232 ms to 30 ms (web.dev). Baseline newly available 2025-09-15 [WF] (Safari 26 for the `auto` keyword's full behaviour). Pair with `contain-intrinsic-size: auto 800px` so the scrollbar doesn't jump. pie-site and initialis both gate on IO: grow-on-visible, and pie-site's leaf gardens start loading with a sideways `rootMargin: '0px 60%'`.
- **How.** One IO per feature type, `rootMargin: '50% 0px'` to start rendering half a screen early, and `unobserve` after the first render. Use `contentvisibilityautostatechange` (C108/FF125/Saf18 [BCD]) to pause live canvases that are skipped. Don't call `getBoundingClientRect` on skipped subtrees; that forces their layout and loses the gain.
- **Sources.** `https://web.dev/articles/content-visibility` (fetched 2026-11-06); [WF]; [BCD]; `refs/pie-site/js/main.js`; `refs/initialis/lib/initialis.js`.

### D4 · Scheduling main-thread work
- **Principle.** Break attach and measure work into ≤ 5 ms slices and yield. Do non-urgent work (cache writes, prefetching the next composition) when idle.
- **Why.** `scheduler.yield()` C129/FF142, **Safari none**. `scheduler.postTask` same. `requestIdleCallback` C47/FF55, **Safari none** (preview behind a flag) [BCD]. M: both Playwright engines expose `scheduler.yield`.
- **How.**
  ```js
  const yieldNow = globalThis.scheduler?.yield?.bind(scheduler)
    ?? (() => new Promise(r => setTimeout(r, 0)));
  const idle = globalThis.requestIdleCallback ?? (cb => setTimeout(() => cb({ timeRemaining: () => 8 }), 50));
  ```
  Only the attach loop needs yielding; rendering is in workers.
- **Sources.** [BCD].

### D5 · API surface: custom elements over a small JS core
- **Principle.** `<illum-ground>`, `<illum-rule>`, `<illum-cap>`, `<illum-garden>` wrap real content, read declarative attributes (`seed`, `palette`, `grow`, `live`, `src` for a prebaked override) and upgrade progressively. An imperative core (`render(params) → ImageBitmap`, `draw(canvas, params)`, `grow(canvas, params, opts)`) underneath serves the playground and frameworks. This is initialis's shape (`draw/grow/settings/random` + `<initialis-cap>`), and it works.
- **Why.** Custom elements (C54/FF63/Saf10.1) and Declarative Shadow DOM (Baseline high 2026-08-20 [WF]) let the server send finished markup. Undefined elements just render their children, so the text is always there. `ElementInternals` (C77/FF93/Saf16.4) gives default ARIA semantics without sprouting attributes.
- **How.** Light DOM for content (headings stay in the document outline and are findable). Decoration lives in a shadow root or an `aria-hidden` child. Style `:not(:defined)` identically to the prebaked state, so upgrading is invisible. A `ticket` object per element (initialis: `const ticket = this.ticket = {}` … `if (this.ticket !== ticket) return`) cancels stale async renders when attributes change. Clean up in `disconnectedCallback`: IO, ResizeObserver, blob URLs, `bitmap.close()`.
- **Sources.** [BCD]; [WF]; `refs/initialis/lib/initialis.js`.

### D6 · Without JS, and on paper
- **Principle.** With no JS the page is fully illuminated from prebaked assets (only liveness is lost). In print, ornament is either high-resolution or absent, never a blurry 2× bitmap or a half-grown animation.
- **How.** No JS: prebaked `<img>`/CSS backgrounds in the server markup, and `@media (scripting: none)` (C120/FF113/Saf17 [BCD]) for any differences. Print: `@media print { .illum-live{display:none} .illum-print{display:block} }`, with print-specific SVG/high-res sources. `print-color-adjust: exact` (C136 unprefixed/FF97/Saf15.4 [BCD]) on grounds that carry meaning (browsers drop backgrounds by default). Animations are at their final state (`--grow: 1`). `beforeprint` can trigger a 300-dpi re-render of live canvases into `<img>` before printing [unverified that all engines wait]. `@page` margins (Saf18.2+) give marginalia a printed margin to live in.
- **Sources.** [BCD].

---

## Part E · Fonts as ornament

### E1 · OpenType alternates: swashes, ornaments, stylistic sets
- **Principle.** Use the typeface's own swash capitals, fleurons and ornaments before drawing any. They're crisp, selectable, searchable and nearly free.
- **Why/How.** `font-variant-alternates` + `@font-feature-values` (C111/FF34/Saf9.1 [BCD]): `@font-feature-values "Cormorant" { @swash { fancy: 1 } @ornaments { leaf: 3 } }` → `font-variant-alternates: swash(fancy)`. Fallback `font-feature-settings: "swsh" 1, "salt" 2, "ornm" 1`. Fleuron rules: `hr::after{content:"\2766"}` (❦) or an `ornm` glyph, with `aria-hidden` semantics by being in CSS content (CSS-generated content *is* read by some screen readers [unverified per engine]; use `content: "❦" / ""` alt syntax to silence it).
- **Sources.** [BCD].

### E2 · Color fonts: COLRv1 isn't portable, so ship fallbacks
- **Principle.** A COLRv1 font is the most elegant "illuminated letters as text" (gradients, layers, palettes switchable with `font-palette` for dark mode). Ship a COLRv0 or SVG-in-OT fallback for Safari.
- **Why.** COLRv1: C98/FF107; **Safari none**, with WebKit bug 233496 open since 2021 [WF; search]. `font-palette`/`@font-palette-values`: Baseline high 2025-05-15 [WF]; Safari applies palettes to COLRv0. Palette *animation* is Chrome-only [WF].
- **How.** `@font-palette-values --dark { font-family: Illum; override-colors: 0 #d9b45a, 1 #f1e6cf; }` + `@media (prefers-color-scheme: dark){ .cap{font-palette: --dark} }`. Build both COLRv1 and COLRv0 tables with nanoemoji/fontTools [unverified tooling details].
- **Sources.** [WF]; `https://bugs.webkit.org/show_bug.cgi?id=233496` (snippet); `https://blog.fontlab.com/2026/05/03/color-fonts-in-2026/` (snippet).

### E3 · Variable fonts and subsetting
- **Principle.** Variable axes (`wght`, `opsz`, custom ones like a "SWSH" amount) give display caps that respond to size. Subset hard: illuminated capitals need only A–Z per face.
- **How.** `font-variation-settings`/`font-optical-sizing: auto`. Subset with `pyftsubset --unicodes=U+0041-005A --layout-features='*' --flavor=woff2`. initialis serves "each face's capitals" this way (header comment). Expect a caps-only subset in the low tens of KB [unverified]. Use `unicode-range` to split caps-only display faces from text faces. Preload only the hero face.
- **Sources.** `refs/initialis/lib/initialis.js` (header); [unverified] sizes.

### E4 · Glyph outlines for shape-aware ornament
- **Principle.** Ornament that knows the letter (vines entering a counter, gold following a stroke, hatching clipped to the bowl) needs the glyph's outline as a path.
- **How.** In the worker: `opentype.parse(buf).charToGlyph('Q').getPath(x, y, size).toPathData()` → `new Path2D(d)` for clip, hit-test and distance fields. Load opentype.js (or a minimal glyf/CFF reader) only in the worker, only when a shape-aware feature is used [size unverified, roughly 170 KB min]. initialis does this inside its worker (`render/src/outline.js`, `fonts.js`; `loadFont(P.font)` before drawing). Alternative with no parser: draw the glyph with `ctx.fillText` into an OffscreenCanvas and trace or distance-transform the mask. That's cheaper to ship, less precise, and depends on `ctx.letterSpacing` (Saf18.4) / `fontKerning` (no Safari) [BCD] behaving the same everywhere.
- **Sources.** `refs/initialis/render/src/worker.js`; [BCD].

---

## Part F · Accessibility and ethics

### F1 · Decoration is invisible to assistive tech, content is untouched
- **Principle.** Every ornament is `aria-hidden="true"` (or `alt=""` / `role="presentation"`), sits outside the reading order, and is not focusable. Text is never *replaced* by an image of text.
- **How.** Canvases and SVG: `aria-hidden="true"`, and give SVG `focusable="false"`. Prebaked `<img alt="">` (pie-site does this for the hero and leaf initials). An illuminated initial: the letter stays in the text (B3). Only a *figurative* illumination with independent meaning (a historiated initial telling a story) gets a real `alt` or `<figure><figcaption>`. Custom elements set `internals.role = 'presentation'` / `ariaHidden = 'true'` on the art layer. Note the conflict with initialis's `role="img"` default. Pointer-reactive ornaments must not trap focus or capture scroll.
- **Sources.** `refs/pie-site/js/main.js` (`alt=""`); `refs/initialis/lib/initialis.js`.

### F2 · Motion: reduced-motion shows the finished art
- **Principle.** `prefers-reduced-motion: reduce` ⇒ no growth, shimmer or parallax. Show the *final* state, not nothing. WCAG 2.3.3 territory.
- **How.** CSS default is the finished state (`@property --grow initial-value: 1`), and motion is wrapped in `@media (prefers-reduced-motion: no-preference)`. JS checks `matchMedia` *and listens to changes*. pie-site checks once at load (`const reduce = matchMedia(...).matches`) and goes `still()` for gardens. Live loops pause on `visibilitychange` and when off-screen. Cap autoplay growth at ≤ 5 s and run it once (initialis `seconds: 2.4`, hold, no loop by default).
- **Sources.** [BCD] (`prefers-reduced-motion` universal); `refs/pie-site/js/main.js`.

### F3 · Contrast over painted grounds; `prefers-contrast`; forced colors
- **Principle.** Text on a painted ground meets WCAG 1.4.3 (4.5:1 body, 3:1 large) against the *worst* pixel under the glyphs, not the mean. Increase contrast on request; under forced colors, get out of the way.
- **Why.** Washes have dark bristles and light dry-brush gaps. In forced-colors mode (Windows High Contrast; media query Baseline high [WF]) browsers override `color`/`background-color`/SVG `fill`/`stroke`, force `box-shadow`/`text-shadow` to none, and keep **url() background images**, drawing "backplates" behind text. Canvas content is not adjusted (MDN). `forced-color-adjust` has no Safari support [BCD].
- **How.** Bake the ground with a "quiet zone" under the text box (the generator knows the text rect, D1: lower alpha, no dark bristles there). Verify by sampling the rendered ground under each line rect at build time: compute the min-contrast pixel against the text colour, fail the build below threshold, and auto-lighten. `contrast-color()` (C147/FF146/Saf26 [BCD]) picks black or white text over a known ground colour. `@media (prefers-contrast: more){ .illum-ground{opacity:.35} .illum-texture{display:none} }`. `@media (forced-colors: active){ .illum-art{display:none} .gilt{color:CanvasText; background:none} }`. Decoration has no meaning there, and gilt text with `color: transparent` would vanish.
- **Sources.** `https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors` (fetched 2026-11-06); [BCD]; [WF].

### F4 · Dark mode: re-ink, don't invert
- **Principle.** A manuscript in dark mode is either (a) a lit page, keeping the paper light as an object on a dark desk, or (b) a night page with luminous inks: gold on lampblack, vermilion lifted, blue lightened. Never a CSS `invert()`.
- **Why.** Ink assets made for paper assume `multiply` onto light. On a dark ground they vanish or turn muddy. pie-site takes route (a): in dark mode `--paper` stays `#e6dcc6` (`css/main.css:20`).
- **How.** Palettes as tokens with `light-dark()` (C123/FF120/Saf17.5 [BCD]). Mask-based grounds (B1) recolor for free. Prebaked colour art gets a dark twin: `<picture><source media="(prefers-color-scheme: dark)" srcset="cap-dark.webp">`. Runtime art includes `theme` in the cache key and re-renders on the `change` event. Gold on dark: lower saturation, a warmer highlight, and blend `screen`/`plus-lighter` rather than `multiply`. Respect `color-scheme` and the site's `[data-theme]` override.
- **Sources.** [BCD]; `refs/pie-site/css/main.css`.

### F5 · Battery, thermal, data
- **Principle.** Decoration must not cost the reader battery or data they didn't agree to spend. Default to finite animation, pause aggressively, and degrade to stills.
- **Why.** The direct signals are weak. Battery Status is Chrome-only (removed from Firefox 52). `PressureObserver` (Compute Pressure) is Chrome-only and experimental. `navigator.deviceMemory` and `saveData` are Chrome-only. `prefers-reduced-data` is behind a flag [BCD].
- **How.** Infer load from your own measurements. initialis passes a **time budget** to growth and reports `timed(ms)`. If renders exceed budget or frames drop (rAF delta > 25 ms over 30 frames), switch the session to stills. Use `PressureObserver` where present ('serious'/'critical' ⇒ stills). Stop rAF loops when off-screen, when `document.hidden`, and when `contentvisibilityautostatechange` says skipped. Loop nothing by default.
- **Sources.** [BCD]; `refs/initialis/lib/initialis.js`.

---

## Part G · Mobile (desktop-first, mobile-whole)

### G1 · Canvas and GPU memory limits
- **Principle.** On phones, budget *pixels in flight*, not elements. Keep few, small, short-lived canvases.
- **Why.** iOS Safari caps a single canvas at **16,777,216 px** (4096²). Past that it warns and draws nothing. Total canvas memory has been capped at 224 MB (iOS 12), 256 MB and **384 MB (iOS 15+)**, varying by device [unverified: pqina.nl, Apple forums, WebKit bug 190280]. Canvases held by JS references count until released. At DPR 3 a full-width 390-CSS-px × 300 garden is 1170×900 px ≈ 4.2 MB RGBA. Fifty of them is 210 MB. WebGL: about 8 active contexts on Android Chrome and 16 on desktop/iOS, with the oldest silently lost [unverified, 2020 measurements]. Phones under memory pressure also drop GPU contexts on their own, which is why initialis re-spawns a worker whose `gl.isContextLost()` is true and retries up to 3 times, the last attempt "without whatever it can't get".
- **How.** Render in workers into a *pooled* OffscreenCanvas per size (worker.js keeps `canvases` keyed by `w×h` and deletes one-off sizes), and hand bitmaps out. Display through `<img src=blob:>` or a single `drawImage`, then `bitmap.close()`. Release display canvases when they leave the viewport (set `width = height = 0`). Never keep hundreds of live canvases. Handle `webglcontextlost` (universal) and `contextlost` on 2D/Offscreen (C99/FF125, **not Safari** [BCD]).
- **Sources.** `https://www.pqina.nl/blog/total-canvas-memory-use-exceeds-the-maximum-limit/`, `https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/` (snippets); `https://github.com/mapbox/mapbox-gl-js/issues/5585` (snippet); [BCD]; `refs/initialis/render/src/worker.js`.

### G2 · WebGPU and WebGL on iOS 26/27
- WebGPU is on by default in Safari 26 for iOS/iPadOS (WebKit post; GPUWeb implementation-status wiki). It changes nothing in the recommendation (A7): WebGL2 in workers has been on iOS since Safari 17 and is what illum should target. Treat WebGPU as an optional backend, and expect device-loss events under memory pressure like WebGL. Sources: `https://webkit.org/blog/17333/webkit-features-in-safari-26-0/` (fetched 2026-11-06); `https://github.com/gpuweb/gpuweb/wiki/Implementation-Status` (snippet).

### G3 · DPR 3 and the cost curve
- **Principle.** Cap the backing DPR at 2 (1.5 for big fields on phones). Prebaked raster ships 1× and 2× only.
- **Why.** At DPR 3, 9×/2.25× the pixels of 1×/2× means 2.25× the paint time, memory and bytes over a 2× cap, for painterly art whose detail is the brush, not the display. pie-site's phone gardens are rendered at scale 2.2 (`SC = PHONE ? 2.2 : 1.25` in `build_growth.mjs`), i.e. about 2× of a narrow viewport, not 3×.
- **How.** `const dpr = Math.min(2, devicePixelRatio)` (initialis). `srcset="g-780.webp 780w, g-1170.webp 1170w"` with `sizes="100vw"` lets the browser choose. Hairline vector rules stay SVG, so they're crisp at DPR 3 for free.
- **Sources.** `refs/initialis/lib/initialis.js`; `refs/pie-site/tools/build_growth.mjs`.

### G4 · Thermal, battery and decoders on phones
- **Principle.** One heavy thing at a time on a phone.
- **Why.** Alpha video on phones is a software decoder per stream (pie-site: "one growth at a time on a phone (each alpha video is a software decoder there)"). Sustained canvas or GL animation throttles the SoC within minutes [unverified generalisation]. pie-site also disables Lenis smooth scrolling on `(pointer: coarse)` because "it would add work to every frame".
- **How.** A global phone queue for decoders and live renders (pie-site `queue/next`). Worker pool = 1 when `navigator.hardwareConcurrency <= 4` or on `(pointer: coarse)`. Growth runs once, ≤ 2.5 s. Stills after `ended`, and the decoder released. Live loops only for the element in view, at ≤ 30 fps (initialis growth plays at 15 fps, with frames rendered 4 ahead).
- **Sources.** `refs/pie-site/js/main.js`; `refs/initialis/lib/initialis.js` (`grow`).

### G5 · Touch replaces hover: what drives the "light"
- **Principle.** Cursor-driven effects (gold catching the light under the pointer, vines leaning toward the mouse) need a touch-native equivalent, or a gentle autonomous default. Never a hover-only reveal of content.
- **Why.** `@media (hover: none)` / `(pointer: coarse)` / `any-hover` are universal [BCD]. Device orientation needs **permission from a user gesture on iOS** (`DeviceOrientationEvent.requestPermission()` iOS 14.5+). BCD now also lists `requestPermission` in **Chrome 152**, so assume a gesture-gated prompt everywhere [BCD]. Desktop Safari exposes the event (Saf17) but has no sensor.
- **How.** Light source priority: (1) pointer position on `(hover: hover)`; (2) after an explicit tap on a small "tilt to catch the light" affordance, device orientation (β/γ → light vector, low-pass filtered, clamped); (3) otherwise a scroll-linked light (`view()` timeline driving `--light-x`, B6), so gold glints as the page moves under the thumb, which needs no permission and no JS; (4) reduced motion: fixed, flattering angle. Use `pointerdown`/`pointermove` (PointerEvent universal) so touch-drag on a cap tilts it. Never ask for orientation permission on load.
- **Sources.** [BCD].

### G6 · No margin on a phone: where marginalia go
- **Principle.** On narrow viewports, margin ornament becomes **inline or terminal ornament**, not squeezed margin art. Glosses go inline (after the paragraph, or behind a tap-to-open footnote marker). Margin gardens become head-pieces, tail-pieces or a field *around* the content. Rules go full-bleed.
- **Why.** pie-site's precedent: "on phones every garden is a field round the content" (`build_growth.mjs`, `side: 'field'`, separate avoid-rects per section, `keepTop` to grow only in the upper part), baked as separate `-m` assets. Anchor positioning (B5) has `position-try-fallbacks` for *small* overflow, not for a missing margin, so you need a container-query switch.
- **How.** `@container article (width < 40rem) { .gloss{position:static; margin-block:.5em 1em; font-size:.875em} .margin-garden{display:none} .tailpiece{display:block} }`. Glosses as `<aside>` right after their paragraph in source order, so both layouts read correctly with no JS (desktop lifts them into the margin with anchoring). Runtime gardens pick the composition class from the container size (narrow ⇒ field/tailpiece generator). Drop caps: 3 lines on desktop, 2 on phone (`initial-letter: 2`). A 3-line cap in a ~34-character phone measure takes roughly 15–20% of each of its lines [unverified estimate: ~4–5 characters' width plus gap], twice the share it takes in a 70-character desktop measure.
- **Sources.** `refs/pie-site/tools/build_growth.mjs`, `gardens-config.mjs` (`PHONE_AVOID`).

### G7 · Type size and measure change the ornament's geometry
- **Principle.** Ornament scales with *type*, not with viewport. Mobile body text is usually larger relative to the viewport and lines are shorter (≈35–45 characters vs 60–75), so line-anchored ornament must be re-measured, not scaled.
- **How.** Size strokes, cap boxes and rule weights in `em`/`lh`/`cqi`, not px. Regenerate line-based ornament (rules matching line length, tail-pieces at the last line's end) from D1 measurements per composition class. Respect user font-size settings (no `-webkit-text-size-adjust: none`), which means ornament can't assume a pixel size. Prebaked caps scale as images inside an `em`-sized box.

### G8 · Serving prebaked assets per breakpoint
- **Principle.** Resolution switching via `srcset`/`sizes`. Composition switching (desktop margin-garden vs phone field) via **art direction**: `<picture><source media>`, or per-container CSS for backgrounds.
- **How.**
  ```html
  <picture>
    <source media="(max-width: 699px)" type="image/avif" srcset="garden-open-m.avif 780w, garden-open-m@2.avif 1170w" sizes="100vw">
    <source media="(max-width: 699px)" srcset="garden-open-m.webp 780w, garden-open-m@2.webp 1170w" sizes="100vw">
    <source type="image/avif" srcset="garden-open.avif 1440w, garden-open@2.avif 2880w" sizes="(min-width:1440px) 1440px, 100vw">
    <img src="garden-open.webp" alt="" width="1440" height="900" loading="lazy" decoding="async">
  </picture>
  ```
  CSS backgrounds: `background-image: image-set(url(g.avif) type("image/avif") 1x, url(g.webp) type("image/webp") 1x)` (`image-set` unprefixed C113/FF89/Saf17 [BCD]) inside `@container`/`@media` blocks for the phone composition. Video: `<source media>` inside `<video>` came back in Chrome 120 / Firefox 120 (Safari never dropped it), but it's evaluated at load only [unverified: Scott Jehl]. Pick the variant in JS when the breakpoint matters after load. pie-site picks `-m` by `innerWidth < 700` at load. Cache `-m` and desktop separately (different URLs), and keep `max-age` short for rebuilt art (pie-site `_headers`: art one day, fonts one year `immutable`). Better: content-hash filenames + `immutable`.
- **Sources.** [BCD]; `https://scottjehl.com/posts/using-responsive-video/` (snippet); `refs/pie-site/_headers`, `js/main.js`.

---

## Part H · Shipping it as a public library

### H1 · Zero-dependency ESM, shipped as source
- **Principle.** The npm package *is* the source: plain ES modules, no runtime dependencies, no build step required to consume it, no bundler required to use it from a `<script type="module">`.
- **Why.** initialis already works this way: `lib/initialis.js` is imported straight from its site, and every module is plain ESM loaded by relative URL. Module workers are everywhere (C80/FF114/Saf15 [BCD]), and so are import maps (C89/FF108/Saf16.4 [BCD]), so consumers can alias `illum` with no tooling. Every dependency is a supply-chain and size liability for a decoration library. The candidates (a PRNG, a noise function, a font parser) are a few hundred lines each, or optional (E4).
- **How.** Relative imports with explicit `.js` extensions. No bare specifiers inside the package, so a raw CDN file works unbundled. No `?v=hash` query strings in the published package (initialis uses `?v=a8136959` on 14 imports for its own site's cache-busting). Versioned CDN/npm URLs are immutable, so the hash is redundant there and would break bundler dedupe. Keep `?v=` in the site's build, not the library's source. Target ES2022 syntax (class fields, top-level await only in entry points that need it).
- **Sources.** [BCD]; `refs/initialis/lib/initialis.js`.

### H2 · Tree-shaking and on-demand kinds
- **Principle.** Importing the core costs ~15 KB. Every feature, kind (pattern, frame, leaf, flower, texture) and renderer backend is its own module, fetched only when a scene uses it. Third parties can register their own.
- **Why.** initialis does exactly this: "Every pattern, texture, frame, band, corner, leaf and flower is a small module, fetched only when an initial uses it". `need(P)` dynamic-imports what a params object names, and `use(url)` registers a third-party kind in both the page and every worker (`lib/examples/chevrons.js` is the template). Static `import`s get tree-shaken by bundlers. `import()` by computed name does not, which here is a *feature*: kinds stay out of the main chunk.
- **How.** `kinds/index.js` exports a name → loader map: `{ vine: () => import('./vine.js'), … }`. That literal form is something Vite/Rollup/webpack can code-split, unlike `import('./' + name + '.js')`. Each kind module exports `{ name, family, params, draw(scene, rng, box) }`, plus a version (H6). Package `"sideEffects": ["./src/elements/*.js"]` so only element-defining modules are kept for their side effect.
- **Sources.** `refs/initialis/lib/initialis.js` (`use`), `render/src/kinds.js`, `lib/examples/chevrons.js`.

### H3 · Types without a TypeScript build
- **Principle.** Author in JS with JSDoc types, type-check in CI, and publish generated `.d.ts`. Users get full types; contributors need no compile step.
- **How.** `jsconfig.json`/`tsconfig.json` with `allowJs`, `checkJs`, `strict`; `tsc --noEmit` in CI; `tsc --declaration --emitDeclarationOnly --outDir types` at publish. Typedef the params per kind (`@typedef {{ seed?: number, palette?: string, density?: number }} GardenParams`). Augment `HTMLElementTagNameMap` so `document.querySelector('illum-cap')` is typed. Generate a `custom-elements.json` manifest (Custom Elements Manifest analyzer) so IDEs, Storybook and framework wrappers can read attributes and events [unverified tool specifics].
- **Sources.** [unverified]: standard TS/JSDoc practice.

### H4 · Framework-agnostic API and SSR/SSG safety
- **Principle.** Two layers only: plain functions (`render`, `draw`, `grow`, `bake`, `use`, `config`) and custom elements. React/Vue/Svelte/Astro consume both natively (custom elements with string attributes need no wrapper). **Importing any module must not touch `window`, `document`, `customElements`, `navigator` or start a worker.**
- **Why.** SSG/SSR frameworks import modules in Node to render HTML. A top-level `customElements.define` or `matchMedia` crashes the build. initialis defines at import (`if (!customElements.get('initialis-cap')) customElements.define(…)`), which is fine on a page and fatal in Node. It does spawn workers lazily (on first `pump()`), which is right.
- **How.** `illum` (core, pure: generators + scene → renderers, no DOM at import), `illum/elements` (side-effect module that guards `typeof customElements !== 'undefined'` and defines the tags), and `illum/define` exporting `define({ prefix })` for apps that want to rename tags or avoid clashes. Generators are pure, so they run in Node: SSG can call `scene(params)` to emit inline SVG for vector features, or compute layout reservations (cap box size, aspect ratio) at build time, and the bake CLI can drive headless Chrome for raster. Everything that measures does so in `connectedCallback` or later. Guard idempotent definition (`customElements.get(name)`) so two copies of the library on one page don't throw.
- **Sources.** `refs/initialis/lib/initialis.js` (`pump`, final `define`).

### H5 · CSP compatibility
- **Principle.** illum must work under a strict CSP (`script-src 'self'` or nonce-based, `style-src 'self'`, Trusted Types enforced) with at most *documented, optional* additions.
- **What strict CSPs break, and the fix:**
  - **Blob-URL workers** (initialis's cross-origin shim) need `worker-src blob:` (C59/FF58/Saf15.5 [BCD]). Default to `new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })`, which is same-origin when self-hosted and recognized by Vite/webpack/Rollup for bundling. Use the blob shim only when the library is loaded cross-origin from a CDN, and document `worker-src blob:` for that case. `config({ workerURL })` is the escape hatch. If the worker can't start, fall back to the prebaked still, never to main-thread rendering of heavy kinds.
  - **`eval`/`new Function`**: never. No runtime codegen of shaders-as-JS or templated functions. (WebGL shader strings are not script and aren't governed by `script-src`.)
  - **Inline styles**: a `style="…"` attribute in markup or `setAttribute('style', …)` is blocked without `'unsafe-inline'`. CSSOM writes (`el.style.setProperty('--illum-ground', …)`) are allowed [unverified per engine; this is the CSP spec's intent]. Ship component CSS as constructable stylesheets (`new CSSStyleSheet()` + `adoptedStyleSheets`, C73/FF101/Saf16.4 [BCD]) or a `<link>`able `illum.css`, never injected `<style>` text.
  - **Trusted Types** (`require-trusted-types-for 'script'`, now in all engines: C83/FF148/Saf26 [BCD]): `innerHTML` with SVG strings is a sink. Build SVG via `createElementNS`, or create one named policy (`trustedTypes.createPolicy('illum', …)`) the site can allow-list. Document the name.
  - **Images**: blob URLs need `img-src blob:` (and `media-src blob:` for video). `data:` URLs need `img-src data:`. Prefer blob (C3), and document both.
  - **CDN-loaded kinds and fonts** need `script-src`/`font-src`/`connect-src` for the CDN origin, and CORS from the CDN (jsDelivr and unpkg send `Access-Control-Allow-Origin: *` [unverified]).
- **Sources.** [BCD]; `refs/initialis/lib/initialis.js` (`spawn`).

### H6 · Seeded output is API: semver and visual stability
- **Principle.** For a given `(kind version, params, seed, composition class)`, the **scene** (geometry, colours, layer order) is a public contract. Changing it for existing inputs is a breaking change. Pixels are a softer contract: within a tolerance, per pinned engine.
- **Why.** People will paste seeds into pages, store share codes (initialis share links encode params: "only what differs from the defaults"), and prebake assets. If 1.4 silently re-grows every margin garden, every site changes under its owner, and a prebaked still no longer matches its runtime upgrade. Default changes are breaking too: initialis's params store only the diff from `DEFAULTS`, so moving a default changes every saved initial.
- **How.**
  - Each kind carries `version` (an integer). A changed algorithm is a new version, kept side by side. Params may pin `v`, and stored/shared params always do. Unpinned params get the latest *at the library's major*, so new looks arrive only on a major, or by opting in.
  - Defaults are frozen per major. Persisted params are written fully resolved (not "diff from defaults") or with the major they assume.
  - **Two test layers.** (1) *Scene snapshots* in Node: hash the scene JSON per (kind, seed, params) over a golden corpus. Exact and engine-independent, provided coordinates are rounded (e.g. to 1/1000 px) before hashing, because `Math.sin`/`Math.exp` are implementation-approximated and can differ in the last bits between V8, SpiderMonkey and JavaScriptCore [unverified in practice; spec says "implementation-approximated"]. (2) *Pixel snapshots* with Playwright `toHaveScreenshot` (per-browser/per-platform baselines named like `…-chromium-linux.png`; default per-pixel `threshold` 0.2, `maxDiffPixels` unset) in a **pinned** browser in a container. Chromium's default headless path is SwiftShader (the M: rig reported it), which is deterministic software raster and so the right CI baseline. Add Firefox/WebKit baselines with looser `maxDiffPixelRatio`. Freeze time and motion: `page.emulateMedia({ reducedMotion: 'reduce' })` plus `grow` at `time: 1`. initialis already has the manual version of this: `lib/check.html` "draws an initial for every kind… and compares each with the baseline kept in this browser… other GPUs differ by a pixel here and there" (`?auto=compare` leaves `window.check` for automation). Promote it to CI.
  - Any scene-hash change is a major unless it's behind a new kind version. Pixel diffs within tolerance are patch-safe.
- **Sources.** `https://playwright.dev/docs/test-snapshots` (fetched 2026-11-06); `refs/initialis/lib/check.html`, `lib/initialis.js` (`settings`, `full`); M:.

### H7 · npm/CDN distribution: exports map and subpaths
- **How.**
  ```json
  {
    "name": "illum", "version": "1.0.0", "type": "module", "license": "…",
    "exports": {
      ".":            { "types": "./types/index.d.ts",    "default": "./src/index.js" },
      "./elements":   { "types": "./types/elements.d.ts", "default": "./src/elements/index.js" },
      "./kinds/*":    { "types": "./types/kinds/*.d.ts",  "default": "./src/kinds/*.js" },
      "./worker":     "./src/worker.js",
      "./illum.css":  "./src/illum.css",
      "./package.json": "./package.json"
    },
    "sideEffects": ["./src/elements/*.js", "*.css"],
    "files": ["src", "types", "custom-elements.json"],
    "customElements": "custom-elements.json"
  }
  ```
  `types` comes first in each condition. CDN: document **exact-version** URLs (`https://cdn.jsdelivr.net/npm/illum@1.0.0/src/elements/index.js`, or unpkg). The raw source works there because H1 has no bare specifiers. jsDelivr's `/+esm` bundling is optional for users who want one request. Fonts and prebaked sample assets go in a separate `@illum/assets` package, so the code package stays small. Publish with npm provenance from CI [unverified flag name: `npm publish --provenance`].

### H8 · Bundle-size budgets, enforced in CI
- **How.** Fail CI on a gzip/brotli budget per entry: `illum` core ≤ 15 KB br, `illum/elements` ≤ 6 KB br on top, each kind ≤ 8 KB, each renderer backend (canvas2d, webgl2, svg) ≤ 15 KB, worker entry ≤ 20 KB excluding kinds. Use a size-limit-style checker or a 20-line script that brotlis each entry with its static import graph [unverified tool]. Track the budget table in the README so a PR shows its delta.

### H9 · Browser support policy and graceful fallback
- **Principle.** Support is tiered and feature-detected. Every tier renders the content, and lower tiers lose only liveness or polish. No UA sniffing in the library. (pie-site sniffs Safari for alpha video. Replace that with a real probe, e.g. decode one frame of a 2×2 VP9-alpha clip to canvas and read a transparent pixel [unverified approach cost].)
- **Tiers.**
  - **T0, any browser**: semantic HTML + prebaked WebP/SVG + CSS (`border-image`, `mask-image`, `float` caps). This is the floor.
  - **T1, CSS enhancements** under `@supports`: `initial-letter`, anchor positioning, `view()` timelines, `text-box`, `contrast-color()`.
  - **T2, runtime rendering**: module workers + OffscreenCanvas 2D + WebGL2 in workers ⇒ Chrome/Edge ≥ 80ish, Firefox ≥ 114, **Safari ≥ 17** (the binding constraint, per initialis). Detected at runtime. Failure ⇒ T0.
  - **T3, optional**: WebGPU, `ctx.filter`, HTML-in-canvas, Compute Pressure.
- **Policy.** "Last 2 years of each engine" for T2. Re-evaluated each major against [WF] Baseline. Documented as a table generated from BCD in CI.

### H10 · Docs and live examples
- **Principle.** The playground *is* the documentation. Every example is real markup with a copy button that yields exact-version CDN HTML, and it renders live from the published package, not a dev build.
- **How.** One page per element/kind: live element, attribute table (generated from `custom-elements.json`), seed scrubber, the T0 fallback shown next to the live version, and an "accessibility contract" box (what's `aria-hidden`, reduced-motion behaviour, forced-colors behaviour). A "bake" page shows the CLI producing the same asset. Ship `llms.txt` and an `AGENTS.md`, as initialis does: its `llms.txt` documents share links, `&format=json` and embeds for agents. A "check" page (H6) anyone can run in their own browser.
- **Sources.** `refs/initialis/llms.txt`, `AGENTS.md`, `lib/check.html`, `lib/example.html`.

---

## Recommended architecture for an illumination library

**Shape.** `illum` = (1) a **generator core**: pure, seeded, renderer-agnostic functions `feature(params, seed, box) → scene` (stroke lists, stamps, paths, layers); (2) **renderers** that draw a scene: Canvas2D (default), WebGL2 (shading passes), SVG-string (vector features, print); (3) a **bake CLI** that runs the same modules in headless Chrome and writes assets + manifest; (4) a **browser runtime**: custom elements + a worker pool, about 15 KB, with every renderer and "kind" module lazy-loaded; (5) the **playground**, which is just the runtime with live params.

**Renderer per feature.**

| Feature | First paint (no JS) | Live / runtime | Why |
|---|---|---|---|
| Painted ground behind heading | Prebaked WebP/AVIF alpha mask + `mask-image` over `background: var(--wash)` | Worker Canvas2D → blob URL → `--illum-ground` | Recolorable, CLS-free, Houdini unnecessary |
| Drawn rules, frames, fleurons | Inline SVG (`pathLength=1` dash draw-in) / `border-image` 9-slice / OpenType `ornm` | Same SVG regenerated per line length | Vector, crisp at DPR 3, prints |
| Illuminated initial | Letter as text + `initial-letter` (float fallback) + prebaked cap behind (`aria-hidden`) | Worker WebGL2+2D (initialis model) → ImageBitmap → canvas | Text stays text, art is deterministic |
| Margin garden | Prebaked per composition (desktop margin / phone field) via `<picture media>` | Worker Canvas2D, measured avoid-rects | Thousands of strokes: not SVG DOM |
| Growth animation | Still (final frame) | HEVC-alpha + VP9-alpha video once on intersection, or live worker canvas at ≤ 30 fps; CSS `view()` for vector draw-in | Video ≈ 2× still bytes, zero CPU paint |
| Gilding | `background-clip:text` with gold texture; solid fallback | WebGL2 normal-map specular, light from pointer / tapped orientation / scroll | Per-pixel lighting needs GL |
| Paper texture | Tiled 256–384 px WebP (pie-site `tooth()` is 384²) | Optional GL height-lit paper on the hero only | Tiling is free; lighting is a luxury |
| Marginal glosses | `<aside>` after paragraph | Anchor positioning into margin ≥ 60rem; inline below | Same source, two layouts |

**Runtime flow.** Element connects → read attributes, compute seed from content (C2) → show prebaked/`:not(:defined)` state → IO says near-visible → measure with RO + Range (D1) → pick composition class → cache lookup (memory → Cache API) → else enqueue to worker pool (≤ 3 desktop, 1 phone) → bitmap back → fade in over the still → `close()`. On error, timeout or context loss: respawn, retry twice, keep the still. Listen to theme, DPR, container size, reduced-motion and contrast changes → re-render or degrade.

**API surface.**
```html
<!-- autonomous elements that wrap content (customized built-ins like <h2 is="…"> never shipped in Safari) -->
<illum-ground seed="auto" palette="vermilion" src="/art/g/h2-intro.webp"><h2>Intro</h2></illum-ground>
<illum-cap letter-from="next" lines="3" grow><p>Quick brown…</p></illum-cap>
<illum-garden side="right" density=".8" grow><section>…</section></illum-garden>
<illum-rule kind="vine"></illum-rule>
```
```js
import { render, draw, grow, use, bake } from 'illum';   // render → ImageBitmap; use(url) registers kind modules
```
Attributes: `seed` (number | `auto` = content hash), `palette`, `theme` (`auto`), `src` (prebaked override), `grow`, `live`, `quality`, `budget`. Global `illum.config({ maxDpr: 2, workers: 'auto', motion: 'auto', cache: 'cache-api' })`.

**Budget (enforced).** JS ≤ 15 KB core + ≤ 40 KB per lazy renderer. Eager art ≤ 250 KB above the fold desktop / 150 KB phone, ≤ 1 MB / 500 KB per view. 0 CLS. No illum task > 50 ms on the main thread. Worker render budget 2 s desktop / 1 s phone per element before falling back to the still. One decoder and one live loop at a time on phones. DPR cap 2. Animations finite (≤ 5 s), paused off-screen and hidden, absent under reduced motion. Text contrast checked at bake time against the worst pixel under each line.

**Release quality, folded in (Part H).** Zero-dependency ESM published as source. `illum` (pure core, SSR-safe, no DOM at import) / `illum/elements` (side-effect define, guarded) / `illum/kinds/*` (on-demand, third-party `use(url)`) / `illum/worker`, all through an exports map with `types` first and JSDoc-generated `.d.ts` + `custom-elements.json`. Strict-CSP default: same-origin module worker via `new URL(…, import.meta.url)`, no eval, no inline style text, Trusted-Types-clean DOM building, blob shim documented as the opt-in CDN path. Seeded output is API: versioned kinds, defaults frozen per major, scene-hash tests in Node plus Playwright pixel baselines in pinned SwiftShader Chromium (initialis `check.html` promoted to CI). Size budgets fail CI. Support is tiered T0–T3 by feature detection, with T2 bound by Safari 17. Docs = playground on the published package, with exact-version CDN snippets and `llms.txt`.

**Mobile, folded in.** The same markup, with composition classes chosen by container query; `-m` prebaked variants via `<picture media>`; margin features become fields/tailpieces/inline asides; pointer light becomes scroll-light with opt-in tilt; worker pool 1; pooled canvases released off-screen; context-loss respawn.

---

## Gotchas

1. **`ctx.filter` is flag-only in Safari and missing from OffscreenCanvas there** [BCD]. Don't build the look on it.
2. **One giant Path2D is slower than many strokes** (M: 2.7–3× in both engines, software raster). Batch per style group, not per canvas.
3. **Batching strokes changes the look**: `globalAlpha` composites per `stroke()`.
4. **Animated SVG filters jank everywhere but Chrome-GPU**: WebKit has no GPU SVG filters, and Firefox doesn't accelerate feDisplacementMap. Bake.
5. **No `requestIdleCallback` or `scheduler.yield` in Safari** [BCD]. Use the `setTimeout` fallback.
6. **`toDataURL` blocks the main thread** (M: 22–36 ms per small WebP) and bloats by 33%. Use `convertToBlob` in a worker + blob URLs, and revoke them.
7. **Safari can't play VP9 alpha** (it plays VP9 and drops the alpha). HEVC-alpha `<source>` first, and test the alpha, not just `canPlayType`. Safari 27 WebM-alpha is unconfirmed.
8. **COLRv1 doesn't render in Safari**: ship a COLRv0/SVG table.
9. **Houdini `paint()` is Chrome-only** after 8 years [BCD].
10. **`initial-letter` is absent in Firefox and prefixed/partial in Safari**: keep the float fallback, and keep it in CSS (not JS) for CLS.
11. **`position-anchor` changed meaning**: full spec only since C151/FF151/Saf27. Test fallbacks on earlier versions.
12. **Scroll-driven animations reached Firefox only on 2026-10-27** (FF159). Default `@property` values must equal the *finished* art.
13. **`devicePixelContentBoxSize` is missing in Safari**: compute from `contentRect × dpr`.
14. **iOS canvas: 16.7 Mpx per canvas, ~384 MB total**; unreleased canvases count. Pool and release.
15. **WebGL contexts are capped (~8 Android, ~16 desktop) and the oldest dies silently**: one context per worker, check `isContextLost()` after each job (initialis does).
16. **Cross-origin library workers need a blob shim** (initialis `spawn`), and CSP must allow `worker-src blob:`.
17. **`shape-outside: url()` silently falls back to the box** without CORS.
18. **Forced colors keep url() backgrounds but strip text colour tricks**: `background-clip:text` + `color:transparent` text disappears unless restored. Hide decoration under `forced-colors: active`.
19. **Content-ordered seeds, not load-order counters**: pie-site's counter and round-robin reshuffle art whenever content is added.
20. **Fonts change line breaks**: measure after `document.fonts.ready` and re-measure on `loadingdone`, or line-anchored ornament lands on the wrong words.
21. **`getBoundingClientRect` inside `content-visibility: auto` subtrees forces their layout** and erases the gain.
22. **Gating page reveal on hero art hurts LCP** (pie-site races 1,200 ms). Reveal text at once and fade the art in.
23. **`<video><source media>` is evaluated once at load**. Pick variants in JS if the breakpoint can change.
24. **Headless build Chrome ≠ user Chrome**: pin the bake browser version, use `--use-angle` explicitly (pie-site passes `--use-angle=metal --enable-gpu` for static art but `--disable-gpu` for growth). Compare baked output against a golden image per release.
25. **Top-level `customElements.define`/`matchMedia` crash SSR/SSG imports** (initialis defines at import). Keep side effects in `illum/elements`, guarded.
26. **Changing a default is a breaking change** when persisted params store only the diff from defaults (initialis share codes do). Freeze defaults per major and version every kind.
27. **Scene hashes must round floats**: `Math.sin`/`exp` are implementation-approximated across JS engines.
28. **`?v=hash` imports in published source break bundler dedupe** and are redundant on versioned CDN URLs. Keep them in the site build only.
29. **Blob workers, `innerHTML` SVG and `style=""` strings each fail a different strict-CSP directive** (`worker-src`, Trusted Types, `style-src`). Test the demo under a strict CSP header in CI.
30. **These measurements are software-raster desktop numbers**: rerun `research/04-web-bench.html` on a real iPhone/Android before freezing budgets.
