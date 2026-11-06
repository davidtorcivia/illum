# 02 — Analog: making digital marks look physically made

Research for **illum**, a library and playground for procedural illustration, brushwork and ornament. The bar is "would this be in the permanent collection of a major institution?" This file covers the literature and the practical techniques, mapped to what a browser can do. Each technique follows the same order: Principle → Why → How → Browser → Sources.

**Source tags** (all accessed 2026-11-06):
- **[F]** fetched and read; parameters are quoted from it.
- **[S]** search abstract or snippet only. The paper exists and the gist is right; details are from memory.
- **[U]** unverified: domain knowledge or first principles.
- **[L]** local code read in `/nvme-mirror/DEV/illum/refs/`.

Costs marked "est." are order-of-magnitude engineering estimates, not measurements.

---

## 0. Thesis: the tells of the digital mark

1. **Edges are too clean, or rough in the wrong way.**
   - A vector edge has no wet rim, no fibre bleed and no skip on the paper tooth.
   - A noise-displaced edge is rough at one frequency and for no material reason.
2. **Variation is uncorrelated.**
   - White-noise jitter makes clumps and voids.
   - Real variation is either spatially *correlated* (the hand's slow drift, wash mottle) or *evenly spread* (stipples, fibres). A hand is never i.i.d.
3. **Colour behaves like light, not matter.**
   - An RGB lerp of blue and yellow gives grey.
   - Alpha-over makes layered paint look like cellophane.
4. **Texture is not causal.** A grain multiplied over ink and paper alike is a photo laid over a drawing. In a real object the grain *decided where the ink went*:
   - granulation sits in the valleys;
   - dry brush skips the peaks;
   - feathering runs along the fibres.

   The top-ranked techniques below all make the substrate an *input to deposition*, not an overlay.

---

## 1. Imperfection theory

### 1.1 Noise colour: white, blue, 1/f

- **Principle.**
  - **White noise** has equal power at all frequencies, so it clumps at every scale.
  - **Blue noise** suppresses low frequencies: random, but evenly spread.
  - **1/f noise** has slow, large drifts carrying small, fast ripples. These are the statistics of natural processes and of a moving hand.
  - **Rule:**
    - *Placement* of discrete marks (stipples, speckles, fibre seeds, foxing, hatch seeds) is **blue**.
    - *Trajectories and fields* (line wander, wash mottle, toning) are **1/f or low-passed**.
    - **White** is reserved for sub-pixel dither only.
- **Why.**
  - Peters: white noise's "large-scale clumps survive blurring". Blue noise has weak low frequencies, so local averages match true brightness, and its tile repetition is hard to spot.
  - Voss & Clarke drove melodies from noise sources:
    - white noise "sounded too random";
    - 1/f² "too correlated";
    - 1/f was pleasing.
  - Voss's fBm landscapes were the first convincing fractal "forgeries".
- **How.**
  - Use Peters' void-and-cluster textures:
    - CC0, sizes 16²–1024², 1–4 channels; he recommends 64² 8-bit.
    - Tile with `coord & 63`.
    - To animate: pick a random slice of a 64-slice array plus a random offset per frame, and never reuse a channel within a frame.
  - Point sets: Bridson Poisson-disk [U] or a few Lloyd iterations.
  - A jittered grid is blue-ish only if jitter ≤ ±0.5 cell. pie-site `hatch.js` `field()` jitters by ±1 cell × `jitter`, which re-clumps [L].
  - For 1/f, use fBm with lacunarity 2 and gain 0.5.
- **Browser.**
  - Blue-noise lookup: one tap, free.
  - fBm with 3–5 octaves: est. <0.5 ms full-screen in WebGL2; prebake for Canvas2D.
  - SVG `feTurbulence` is fBm but CPU-rasterised and re-run on invalidation. Use it for static, element-sized areas only [U].
- **Sources.**
  - https://momentsingraphics.de/BlueNoise.html [F]
  - Ulichney void-and-cluster via https://blog.demofox.org/2019/06/25/generating-blue-noise-textures-with-void-and-cluster/ [S]
  - https://gauss.math.yale.edu/fractals/Panorama/OneOverFMusic/VossMusic/VossMusic.html [S]

### 1.2 Correlated jitter and determinism

- **Principle.**
  - Every random choice about a mark is a pure function of its position or id, never of a running RNG stream. Otherwise resizes, frames and growth steps reshuffle strokes and the page "boils".
  - Neighbouring marks get *correlated* jitter: hatch lines drift together, as the hand's posture drifts.
- **Why.**
  - Bousseau et al. 2006 is titled *…Temporal Coherence…*: shimmer is the first tell of NPR in motion.
  - pie-site `tools/paintpass.js` derives every stroke's jitter, length, opacity and width from `hash(gx, gy, k)` of its cell, "so a stroke is the same in every frame of a growth animation" [L].
  - Counter-example: `painter.js` `grain()` uses `Math.random()` over a regular 3-px weave tile. It is non-deterministic and periodic at once [L].
- **How.**
  - Use an integer hash keyed by (cell, pass, attribute), as `paintpass.js` does.
  - Correlated jitter = low-frequency noise sampled at the mark's anchor: `angle += 0.3·noise(x·0.03, y·0.03)` (`painter.js`) [L].
  - Derive child seeds by hashing: initialis `rng(seed*7+1)` per effect [L].
- **Browser.** Free; it is API discipline.
- **Sources.** `refs/pie-site/tools/paintpass.js`, `js/painter.js` [L]; https://hal.science/inria-00510223/document [F]

### 1.3 The hand's trajectory: minimum jerk, squiggle, tremor

- **Principle.**
  - A human line is a smooth trajectory with a bell-shaped speed profile.
  - It deviates by a few independent offsets at control points, not by per-pixel noise.
  - Tremor exists but is tiny.
- **Why.**
  - AlMeraj, Wyvill, Isenberg, Gooch & Guy (2009) built lines from the Flash–Hogan (1985) minimum-jerk arm model plus a "squiggle". A user study rated them "perceptually indistinguishable from … a hand-drawn straight pencil line".
  - Physiological tremor is 8–12 Hz, with a resonance component up to ~20–25 Hz. Parkinsonian tremor is 3–8 Hz.
- **How.**
  - Path: `x(τ) = x0 + (xf − x0)(10τ³ − 15τ⁴ + 6τ⁵) + D`, likewise for y, with τ = t/tf and tf = 2. The paper prints a sign-flipped equivalent.
  - Control points at Δt = 0.5 for lines ≤200 px (≤5 cm), then 0.3 and 0.2 for longer lines.
  - Squiggle D ∈ [−5, 5] px, independent per control point.
  - Catmull-Rom through the points.
  - Their observations:
    - width varies with pressure on long lines;
    - short dashes stay near-constant width;
    - ends do *not* always taper.
  - **Speed → deposit.** Speed ∝ `30τ²(1−τ)²`. Deposit per unit length ∝ 1/speed, clamped, which gives heavier starts and stops (§4.6).
  - **Tremor.** Spatial wavelength = speed / frequency, e.g. 5 cm/s at 10 Hz is 5 mm. Amplitude is sub-0.1 mm [U]. Add it only to slow, careful strokes (engraving, outlines), never to fast gestures.
- **Browser.**
  - Canvas2D: free, tens of points per line.
  - SVG: emit cubic Béziers once.
  - Use it for every rule, frame and hatch. pie-site `hatchRect()`, with perfectly parallel constant-gap lines, is a textbook tell [L].
- **Sources.**
  - https://tobias.isenberg.cc/personal/papers/Meraj_2009_AMU.pdf [F]
  - https://pmc.ncbi.nlm.nih.gov/articles/PMC5739030, https://imeko.info/publications/wc-2003/PWC-2003-TC13-014.pdf [S]

### 1.4 Workmanship of risk; the economics of the hand

- **Principle.**
  - Pye (*The Nature and Art of Workmanship*, 1968) distinguishes:
    - *workmanship of risk*: the result depends on the maker's "judgment, dexterity and attention" during making;
    - *workmanship of certainty*: the result is fixed in advance by a jig or program.
  - We read objects as crafted when they carry **evidence of decisions under risk**:
    - pentimenti;
    - corner overshoot;
    - the gap or overlap where two washes almost meet;
    - a stroke that ran dry and was left.
  - Since hand labour is costly, these traces also signal value [U].
  - Wabi-sabi is the same evidence read aesthetically: the irregular, worn and incomplete as marks of a made thing [U].
- **Why.**
  - Pye's split is not hand versus machine. A programmed tool that leaves room for drift sits nearer to risk. That is illum's position: a program that *simulates* risk.
  - Montesdeoca (NPAR 2017) adds "gaps & overlaps" and "dry-brush" as watercolour effects. Both are residues of risk.
- **How (design rules).**
  1. Per-edge registration error: fills under or over their outline by 0.5–2 px, varying slowly along the edge.
  2. Ruled corners overshoot or undershoot by hashed amounts.
  3. About 1 in 50–200 repeated ornaments carries a "mistake".
  4. Repeats are seeded variants, never copies.
  5. Reservoir depletion and "dips" are visible across runs of strokes (§4.1).
- **Browser.** Free.
- **Sources.**
  - https://luminous-landscape.com/inspired-by-david-pye-art-of-risk-and-certainty/, https://blog.lostartpress.com/2018/12/02/deflating-david-pye-50-years-later/ [S]
  - https://diglib.eg.org/handle/10.2312/npar2017a02 [S]

### 1.5 The uncanny valley of fake texture

- **Principle.** Fake texture fails in four ways:
  1. **Visible period** in tiles.
  2. **Non-causality**: the same overlay on ink and paper.
  3. **Scale lies**: the grain is not at physical scale across DPR and zoom, or aliases when small.
  4. **Uniform ageing**: wear with no history.
- **Why.**
  - Heitz & Neyret 2018: linear blending of randomised tiles kills contrast and invents colours. A histogram-preserving blend (Gaussianise → blend → invert) gives infinite non-repeating texture from a small exemplar.
  - Mikkelsen 2022 simplifies this to real-time hex tiling.
  - Initialis gates every fine feature through `detail(size) = smoothstep(0.7, 2.2, size/pixel)`, so sub-pixel detail fades to its mean [L].
- **How.**
  - Prefer analytic texture in physical units (initialis: `MM = 5.65` page units per mm) [L].
  - For scans, use hex or histogram-preserving tiling, or at least two non-commensurate, rotated tiles.
  - LOD-gate every octave.
  - Drive ageing from geometry: edges, folds, handled corners (§7).
- **Browser.**
  - Hex tiling: 3 taps, est. <0.3 ms in WebGL2.
  - CSS tiling cannot do this. Use ≥1024² non-periodic scans, or two layers with coprime sizes [U].
- **Sources.**
  - https://hal.archives-ouvertes.fr/LJK/hal-01824773v1 [S]
  - https://jcgt.org/published/0011/03/05/paper-lowres.pdf [S]
  - Initialis `shader.js` [L]

---

## 2. Watercolour and wash

### 2.1 Curtis et al. 1997, the physical model

- **Principle.** Watercolour is an ordered set of translucent glazes. Each glaze is a fluid simulation of pigment-laden water on rough, sized paper, composited with Kubelka–Munk (KM).
- **Why.**
  - Canonical. It reproduces dry-brush, edge darkening, backruns, granulation and separation, flow patterns and glazing, each explained physically.
  - Edge darkening is the coffee-ring effect: "the contact line of a drop is pinned… liquid evaporating near the boundary must be replenished by liquid from the interior, resulting in outward flow".
- **How.**
  - Three layers:
    - shallow water (u, v, p), inside the wet mask M;
    - pigment deposition (suspended g^k, deposited d^k);
    - capillary saturation s, used for backruns only.
  - Paper is a height field h ∈ [0, 1]. Each pigment has density ρ, staining ω and granulation γ.
  - **Edge darkening:** blur M with a K×K Gaussian to get M′, then `p ← p − η(1 − M′)M`, with K = 10 and 0.01 ≤ η ≤ 0.05.
  - **Granulation:**
    - `down = g(1 − hγ)ρ`
    - `up = d(1 + (h − 1)γ)ρ/ω`
    - Clamp, then `d += down − up`.
    - High γ settles pigment in valleys; high ω makes it stick.
  - **Backruns:** water absorbs into the capillary layer at rate α and diffuses. Past a saturation threshold, the wet mask grows into damp cells, pushing pigment into dark-edged "cauliflowers".
  - **Dry-brush:** exclude pixels with h below a threshold from M.
  - **Pigment authoring (browser-friendly).** Choose each pigment's RGB at unit thickness over white (R_w) and over black (R_b), then invert KM:
    - `a = ½(R_w + (R_b − R_w + 1)/R_b)`
    - `b = √(a² − 1)`
    - `S = (1/b)·coth⁻¹[(b² − (a − R_w)(a − 1))/(b(1 − R_w))]`
    - `K = S(a − 1)`
  - **Layer of thickness x:**
    - `c = a·sinh(bSx) + b·cosh(bSx)`
    - `R = sinh(bSx)/c`
    - `T = b/c`
  - **Stacking:**
    - `R = R1 + T1²R2/(1 − R1R2)`
    - `T = T1T2/(1 − R1R2)`
  - Opaque, transparent-staining and "interference" (white on white, coloured on black) paints all fall out.
- **Browser.**
  - The full sim is feasible as ping-pong float textures in WebGL2/WebGPU, but costs tens of iterations per stroke. **Prebake** hero pieces.
  - The **KM layering and R_w/R_b authoring** are cheap per pixel and worth using at runtime for glazes.
- **Sources.** https://grail.cs.washington.edu/projects/watercolor/ and https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/curtis97.pdf [F; text extracted, Greek symbols reconstructed]

### 2.2 Bousseau et al. 2006, image-space watercolour

- **Principle.** Skip physics. Watercolour is colour modified by *pigment density*, driven by grey textures, plus edge darkening and edge wobble.
- **Why.**
  - Washes vary at two scales:
    - low-frequency "turbulent flow" (uneven water);
    - high-frequency "pigment dispersion".
  - Paper grain modulates both, and edges darken and "wobble due to paper grain".
  - Bousseau gets all of it in a pixel shader, coherently over time.
- **How.**
  - **`C′ = C − (C − C²)(d − 1)`**, where d = 1 is nominal and d > 1 is denser.
  - Three layers in sequence, each a grey texture T mapped to `d = 1 + β(T − 0.5)`:
    - Perlin noise for turbulence;
    - summed multi-scale Gaussian noise for dispersion;
    - scanned paper.
  - **Edge darkening:** gradient magnitude `|p(x−1) − p(x+1)| + |p(y−1) − p(y+1)|`, averaged over channels, fed into the same formula.
  - **Wobble:** offset the lookup by the paper gradient (x from horizontal, y from vertical), using a *lower-resolution* paper so wobble frequency is below grain frequency.
  - Abstraction (mean-shift plus morphology) is needed only for photos; illum shapes are already flat.
- **Browser.** **Best look per millisecond here.**
  - WebGL2: 3–4 taps and ~20 ALU, est. <0.5 ms full-screen.
  - SVG: the formula maps to `feComposite operator="arithmetic"` (`k1·i1·i2 + k2·i1 + k3·i2 + k4`), and wobble to `feDisplacementMap` plus `feTurbulence`. Set `color-interpolation-filters="sRGB"`, because the default is linearRGB.
  - Canvas2D: prebake.
- **Sources.**
  - https://hal.science/inria-00510223/document [F]
  - https://tympanus.net/codrops/2019/02/19/svg-filter-effects-creating-texture-with-feturbulence/ [S]

### 2.3 Tyler Hobbs, layered deformed polygons

- **Principle.**
  - A wash is many near-identical, very transparent copies of a recursively deformed polygon.
  - Overlap density gives soft, darker-centred, blooming tone.
  - Low-variance edges stay crisp; high-variance edges bloom.
- **Why.** It produces wet-in-wet edge character without simulation. It is the standard generative-art technique.
- **How.**
  - Deform: for each edge A→C, take midpoint B, sample B′ ~ Gaussian(B), replace with A→B′→C.
  - Per-segment variance is inherited by children (reduced, slightly randomised).
  - Base polygon: ~7 deformations. Each layer: ~4–5 more.
  - **30–100 layers at ~4% opacity.**
  - Per-layer mask: ~900–1000 circles, radius ~ N(3%, 2%) of canvas width, intersected darkest-wins.
  - Interleave colours: 5 red, 5 yellow, 5 red.
- **Browser.**
  - Canvas2D prebake: 10 vertices × 2⁷ ≈ 1,300 vertices × 50 layers, est. 10–60 ms per wash. Cache as a bitmap.
  - Make it causal: replace the circle mask with `h + blue < τ_i` (paper height plus blue noise).
  - WebGL2 instanced accumulation, then a density → colour pass (§2.2) [U].
- **Sources.** https://www.tylerxhobbs.com/words/a-guide-to-simulating-watercolor-paint-with-generative-art [F]

### 2.4 Montesdeoca, MNPR

- **Principle.** A real-time filter stack whose parameters are *painted fields* (stylisation maps). They are grouped as:
  - pigment (variation, application, density);
  - substrate (distortion, U/V inclination);
  - edge (intensity, width, transition);
  - abstraction (detail, shape, blending).
- **Why.**
  - NPAR 2017 improved edge darkening and granulation and introduced dry-brush and gaps & overlaps, "locally controllable in real-time".
  - The control-map model is the right API for illum.
- **How [S].**
  - Edge darkening: a blurred colour difference (DoG-like) with a control exponent, applied as density.
  - Granulation: paper height × dilution.
  - Dry-brush: height threshold.
  - Gaps & overlaps: push edges along the normal by a control value, so neighbours either leave paper showing or overlap in a darker seam.
- **Browser.** WebGL2 multi-pass, est. 1–2 ms. Control maps are a per-element value or an offscreen control canvas.
- **Sources.**
  - https://github.com/semontesdeoca/MNPR [F] (MIT, Maya; MNPRX is the maintained successor)
  - https://diglib.eg.org/handle/10.2312/npar2017a02 [S]

### 2.5 Wet edge, pooled rim, granulation: the cheap recipe

- **Principle.** Three effects carry most of the "real watercolour" read:
  1. a dark rim ~0.3–1.5 mm inside the edge;
  2. pigment in the paper valleys;
  3. low-frequency mottle.
- **Why.** Curtis gives the physics of the rim; Bousseau shows texture-driven density is perceptually sufficient.
- **How.** With signed distance s (negative inside) and paper height h:
  - `d = 1 + a·exp(−|s|/0.5mm) + β_g(0.5 − h)·dilution + β_t(fbm_low − 0.5)`
  - then apply §2.2.
  - SDF sources:
    - WebGPU: JFA (initialis already has `init/jump/resolve` compute passes [L]);
    - Canvas2D: a blurred mask is a monotone distance proxy, Curtis' own trick.
- **Browser.**
  - Shader: <0.5 ms.
  - SVG: `feGaussianBlur(SourceAlpha)` → `feComposite out` → multiply.
  - Canvas2D: `ctx.filter='blur()'` plus `source-atop`, prebaked.
- **Sources.** As §2.1–2.2 [F]; initialis `gpu.js` [L].

---

## 3. Pigment and colour

### 3.1 Why RGB lerp is wrong; Kubelka–Munk mixing

- **Principle.**
  - Paint absorbs (K) and scatters (S) per wavelength, and a mixture's K/S is the concentration-weighted sum.
  - RGB lerp mixes *light*, so blue + yellow → grey. Multiply fails for scattering paints such as white tints.
- **Why.**
  - Sochorová & Jamriška 2021 show RGB, RYB and plain subtractive models failing cobalt blue + hansa yellow → green, where KM succeeds.
  - Phthalo blue shifts purple → turquoise as it is tinted with white, which no RGB model reproduces.
- **How.**
  - **Mixbox:**
    - A 7-D latent: 4 pigment concentrations, from phthalo blue, quinacridone magenta, hansa yellow and titanium white, replaced by gamut-fitted surrogates; plus a 3-D RGB residual, for an exact round-trip.
    - Mix by linear ops on latents.
    - Encode and decode via 256³ LUTs, 48 MB each uncompressed. The GLSL path samples a LUT texture.
  - **spectral.js:**
    - RGB → 380–750 nm reflectance (10 nm steps) as weights over 7 primary curves.
    - Single-constant KM with concentration `C = f²·T²·L`.
    - Sum, invert, then CIE 1931 / D65.
    - GLSL mixes 2–4 colours.
  - **Curtis R_w/R_b** (§2.1): authored per pigment.
- **Browser and licence (decision).**
  - **Mixbox is CC BY-NC 4.0** and needs a commercial licence to ship, so it is not a default dependency.
  - **spectral.js is MIT: use it.**
  - Run KM at build time to **prebake ramps and glaze tables**, then interpolate in Oklab at runtime.
  - Per-pixel GLSL KM is affordable in a playground: est. a few dozen ALU per mix.
- **Sources.**
  - https://scrtwpns.com/mixbox/ [F]
  - https://dcgi.fel.cvut.cz/wp-content/wpallimport-dist/publications/pdf/publications-2021-sochorova-tog-pigments-paper.pdf [F]
  - https://github.com/rvanwijnen/spectral.js [F]

### 3.2 Oklab / OKLCH

- **Principle.** Build ramps and interpolations in a perceptually uniform space.
- **Why.**
  - HSV: "Yellow, magenta and cyan appear much lighter than red and blue".
  - CIELAB mispredicts blue, so white→blue drifts purple.
  - Oklab's RMS hue error is ~0.49, against 0.69 for CIELAB and 1.10 for HSV (Ottosson 2020).
- **How.**
  - Store palettes as OKLCH.
  - Step L for tonal ramps, and drift H warm in the lights and cool in the shadows [U].
  - Gamut-map by lowering C.
  - In CSS, `oklch()` and `color-mix(in oklab, …)` are native [U].
- **Browser.** Native, or two 3×3 matrices plus a cube root.
- **Sources.** https://bottosson.github.io/posts/oklab/ [F]

### 3.3 Subtractive glazing

- **Principle.** Transparent layers *filter* what lies beneath. Composite them by multiply in linear light, or by KM, never by alpha-over.
- **Why.**
  - Curtis composites glazes with KM.
  - Riso and offset overprint are multiplicative: "paper colour is multiplied by each ink in turn".
  - Alpha-over of yellow on blue *lightens* toward grey-yellow, where a real glaze goes green.
- **How.**
  - `out = paper · Π(1 − a_i(1 − C_i))` in linear RGB, each layer first passed through the density formula (§2.2).
  - Body colour (gouache, lead white): lerp by coverage, i.e. KM with high S.
- **Browser.** Free: CSS `mix-blend-mode: multiply`, Canvas `multiply` (sRGB, acceptable), or exact in WebGL.
- **Sources.** Curtis [F]; https://effect.app/effects/risograph [S]

### 3.4 Historical pigments and limited palettes

- **Principle.**
  - Museum objects use a small, specific set of materials, each with its own hue, transparency, granulation and *failure mode*.
  - Model behaviour, not just RGB.
- **Why.** Coherence of material reads as "period", and each pigment ages recognisably.
  - **Ultramarine (lapis lazuli):**
    - Lazurite Na₇Al₆Si₆O₂₄S₃; the blue is the S₃⁻ radical.
    - Cennini (~1400): the first extracts are best, and finer grinding gives a paler colour, less "rich and deep".
    - Coarse and granulating: use high γ.
    - Decomposes in dilute acid.
  - **Vermilion (HgS):**
    - Antiquity onward.
    - "Can darken considerably" by turning into black HgS.
  - **Verdigris (copper acetates):**
    - Blue-green → green within about a month.
    - Darkens with sulfur pigments (ultramarine, orpiment).
    - Copper-resinate glazes brown with age; copper greens can burn through paper [U].
  - **Orpiment (As₂S₃):**
    - "King's yellow". Toxic.
    - Incompatible with lead and copper pigments. Can darken.
    - Used as a gold substitute [U].
  - **Lead white:**
    - The principal white until the 19th century.
    - H₂S turns it to black lead sulfide, so manuscript highlights go grey-black.
  - **Iron-gall ink:**
    - Goes on pale, oxidises black, then browns.
    - Excess Fe(II) drives Fenton oxidation plus acid hydrolysis of cellulose.
    - Brown **halos** are the earliest visible sign, then cracks, then letters fall out as holes.
  - **Carbon black:** stable; it only greys with abrasion.
- **How.**
  - Palettes as material records: `{oklch, Rw, Rb, γ, ω, opacity, ageing:{rgbRate, mode}}`.
  - Initialis fade constants (`ink *= 1 − e·rate`) are good starting points [L]:
    - iron gall (0.52, 0.38, 0.16), browning;
    - aniline (0.62, 0.22, 0.55), violet;
    - lamp black (0.55, 0.55, 0.52), grey;
    - blue-black (0.18, 0.40, 0.62).
  - Example sets [U]:
    - Carolingian: ultramarine, vermilion, orpiment, verdigris, lead white, iron gall, gold.
    - Dürer: lamp black on laid paper.
    - Ukiyo-e: indigo, Prussian blue (after 1829), fugitive safflower.
  - 3–5 pigments plus paper give automatic harmony, because every mix stays inside a small KM gamut.
- **Browser.** Data only; prebake tints.
- **Sources.**
  - ColourLex https://colourlex.com/project/vermilion/, …/verdigris/, …/orpiment/, …/ultramarine/, …/lead-white/ [F]
  - https://www.tobunken.go.jp/image-gallery/conservation/15e/HTML/index51.html, https://cool.culturalheritage.org/coolaic/sg/bpg/annual/v19/bp19-09.html [S]

---

## 4. Brush and pen

### 4.1 Hairy brushes: Strassmann 1986, and pie-site `brush.js`

- **Principle.** A brush is a bundle of bristles, each with its own tuft position, ink load and contact. The stroke is the union of their trails.
- **Why.**
  - Strassmann's sumi-e strokes come from:
    - ink depletion;
    - "scratchiness" (some bristles run dry early);
    - ink stealing between neighbours;
    - colour as a function of pressure, distance or remaining ink.
  - A 1997 critique notes it ignores ink pooled on paper.
- **How (`brush.js` [L]).**
  - 420 hairs, each a polyline stepped 6 px.
  - Lateral v ∈ [−1, 1] × a half-width with:
    - a swell near the start;
    - a `sin`-drifting midline;
    - slant;
    - taper `(1 − 0.3x³)`.
  - Edge hairs start later, so the start is ragged.
  - Per-hair tint ±13, alpha 0.55–1, width 1.2–4.4.
  - **Dry tail:** past `tail = 0.62–0.87`, skip segments with probability `(u − tail)·1.8`.
  - A loaded touch-down ellipse at the start.
  - Upgrades:
    - Make the skip causal (`h < τ(u)`, as `painter.js` does with `tooth > 0.55`).
    - Deplete per hair, with edge hairs first.
    - Drive pressure from minimum-jerk speed.
- **Browser.**
  - ~60k `stroke()` calls per stroke, est. 30–100 ms.
  - pie-site **prebakes 64 variants** to `art/brush/NN.webp` and never repeats one per page (`BRUSHES = 64`, `brushUrl()`). That is the right call: a free `background-image` afterward.
- **Sources.**
  - https://history.siggraph.org/?p=116042, https://www.sambuz.com/doc/hairy-brushes-ppt-presentation-699975, https://cs-web.bu.edu/fac/sclaroff/courses/cs680-97/commentary/r1.html [S]
  - `refs/pie-site/js/brush.js` [L]

### 4.2 Calligraphy brushes (Xu et al.) and ink diffusion (Chu & Tai, MoXi)

- **Principle.**
  - Xu et al. (2002–05) model the brush as a deformable solid whose tuft bends, splits and presses a pressure- and direction-dependent footprint.
  - MoXi (SIGGRAPH 2005) runs ink percolating through absorbent paper as a **lattice-Boltzmann** fluid on the GPU, with fibre-dependent blocking and pinning, producing feathery branching edges and dark boundary deposits.
- **Why.** Eastern ink painting's character is the paper's absorbency. MoXi reproduces real flow patterns in real time.
- **How (MoXi sketch).**
  - Fields in RGBA float textures:
    - VelDen [u, v, density, seep];
    - Misc [blocking, f0, last density, surface water];
    - Dist1 f[N, E, W, S];
    - Dist2 f[NE, SE, NW, SW] (D2Q9).
  - Each step: derive blocking → deposit → collide → stream → derive velocity and density → receive surface water.
  - Deposition renders the *stretched* tuft geometry that penetrates the paper plane, giving a continuous footprint.
  - Pinning sites get ∞ blocking, so any interpolation across them is ∞, a free boundary test.
- **Browser.**
  - WebGL2 (`EXT_color_buffer_float`) or WebGPU compute: 4 RGBA32F textures, ~6 passes per step. Real-time at 512² for a playground "ink drop".
  - Prebake for pages. The cheap imitation is initialis feathering (§5.4).
- **Sources.**
  - https://history.siggraph.org/wp-content/uploads/2023/01/2005-Talsk-Chu_MoXi-Real-Time-Ink-Dispersion-in-Absorbent-Paper.pdf [F]
  - https://history.siggraph.org/?p=113877 [S]
  - https://diglib.eg.org/handle/10.2312/8908 [S]

### 4.3 Painterly strokes: Hertzmann 1998, and `painter.js` / `paintpass.js`

- **Principle.**
  - Paint coarse to fine with long curved splines that follow the image-gradient *normal*.
  - Smaller brushes paint only where the canvas still differs from a blurred reference by more than T.
- **Why.** Detail lands where the source has spatial energy, and long strokes along structure read as decisions.
- **How.**
  - For each radius R_i: blur by f_σ·R_i, then on a grid of spacing f_g·R_i, start at the max-error pixel above T.
  - Grow the stroke with filtered direction `D′ = f_c·D + (1 − f_c)·D′_prev`, until maxLength, or after minLength when colour error rises.
  - Presets, verbatim:
    - **Impressionist:** T=100, R=(8,4,2), f_c=1, f_s=.5, a=1, f_g=1, minLength=4, maxLength=16
    - **Expressionist:** T=50, R=(8,4,2), f_c=.25, f_s=.5, a=.7, f_g=1, minLength=10, maxLength=16, j_v=.5
    - **Colorist Wash:** T=200, R=(8,4,2), f_c=1, f_s=.5, a=.5, f_g=1, minLength=4, maxLength=16, j_r=j_g=j_b=.3
    - **Pointillist:** T=100, R=(4,2), f_c=1, f_s=.5, a=1, f_g=.5, minLength=0, maxLength=0, j_v=1, j_h=.3
  - **`painter.js` [L]**, for silhouettes:
    - Chamfer distance field of the mask; the structure tensor of its blur, smoothed wide, gives each limb's axis.
    - Coherence `√((Jxx−Jyy)² + 4Jxy²)/(Jxx+Jyy)` falls back to a default axis where it is ambiguous.
    - Layers: aura blur → ground silhouette → ~W·H/90 underpainting dabs → mids pass (density 0.6) → lights pass (0.16, shorter and thinner).
    - Width `sin(πt)`; alpha falls near edges; dry-brush skip where tooth > 0.55.
  - **`paintpass.js`:** the same idea as a post-pass on any canvas:
    - luminance structure tensor;
    - two passes of hashed, slightly bowed quadratic strokes;
    - then crisp pixels restored on thin features (an erosion test), so hairlines survive.
- **Browser.**
  - CPU: est. 50–300 ms per 1 MP figure, so prebake or use a Worker with OffscreenCanvas.
  - GPU: a tensor in 3 passes plus instanced textured quads (est. 100k strokes <5 ms) [U].
- **Sources.**
  - https://mrl.cs.nyu.edu/publications/painterly98/, https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/hertzmann98.pdf [F]
  - `painter.js`, `paintpass.js` [L]

### 4.4 Pen-and-ink: Winkenbach & Salesin 1994; orientable textures

- **Principle.**
  - Tone comes from *prioritised stroke textures*: outline, then hatch, then cross-hatch, then stipple, added in priority order until the target darkness is reached. The same texture is therefore correct at any tone and scale.
  - *Indication*: draw texture only near selected edges and let the eye complete the rest.
  - Salisbury, Wong, Hughes & Salesin 1997 [U], *Orientable Textures for Image-Based Pen-and-Ink Illustration*, rotate textures by a direction field and match tone to a reference.
  - (The brief's "orientable textures" is this 1997 paper.)
- **Why.** It formalises illustrators' rules: tone by density, texture as material, economy of indication. Indication is pure workmanship of risk.
- **How [U, detail].**
  - Per region:
    - a hatch generator (θ, spacing, AlMeraj lines);
    - add strokes greedily until blurred coverage reaches the target tone;
    - multiply the target by an indication mask, high at chosen edges and decaying inward with noise.
  - θ comes from a painted field, a structure tensor (§4.3) or an SDF gradient.
- **Browser.**
  - Canvas2D or SVG, generated once, with a low-res Float32 coverage buffer.
  - For animated use, prebake tonal art maps (Praun et al. 2001 [U]).
- **Sources.**
  - https://grail.cs.washington.edu/projects/cg-illus/ [F, overview only]
  - https://history.siggraph.org/?p=119683 [S]

### 4.5 Stippling: Secord 2002

- **Principle.** Stipples form a *centroidal Voronoi* distribution weighted by darkness: blue, and denser in the darks.
- **Why.** "Stipples do not clump together, leave holes…". Weighted Lloyd relaxation delivers this.
- **How.**
  - Dither ρ = 1 − tone to initialise.
  - Iterate: Voronoi → move each point to `∫xρ dA / ∫ρ dA`.
  - Integrals are fast via precomputed row sums `P(x, y) = ∫₀ˣ ρ(s, y) ds`.
  - Secord **precomputes stipple sets for constant tones and stitches them** for interactive rates.
- **Browser.**
  - WebGPU JFA Voronoi (initialis already has JFA [L]): est. 2–5 ms per iteration at 1 MP, 20–50 iterations, prebaked.
  - CPU: d3-delaunay, est. 20–50 ms per iteration for 10k points [U].
  - **Runtime shortcut:** a progressive blue-noise point list (void-and-cluster rank order). Draw point r if r/N < local darkness. One pass, no relaxation.
- **Sources.** https://www.cs.ubc.ca/labs/imager/tr/2002/secord2002b/secord.2002b.pdf [F]

### 4.6 Ink pooling, pressure and speed

- **Principle.**
  - Deposit follows *dwell*: more ink where the pen slows (start, stop, corners, reversals).
  - Surface tension then beads it into a dark blob with a darker rim. This is the same pinned-contact-line physics as edge darkening.
  - Pressure sets width; speed sets density.
- **Why.**
  - AlMeraj saw slightly higher pressure at dash ends and width tracking pressure.
  - The Strassmann critique names the missing pooled-ink effect.
  - Darker terminals and corner nodes are visible in any dip-pen sample [U].
- **How [U].**
  - Width: `w(u) = w0·p(u)`.
    - Brush: fast attack, slow release, `sin(πu)^0.6`, skewed.
    - Pen: a plateau.
  - Density: `min(ρmax, k/speed)`.
  - Pools at u = 0, u = 1 and at curvature/speed peaks: a disc of r ≈ 0.6w, +30–60% density, 1-px darker rim.
  - Reservoir: L decreases by ∫wρ du. Below a threshold, switch to dry-brush; a "dip" resets it.
  - A flexible nib under pressure with low ink "railroads" into two tine lines [U].
- **Browser.** Canvas2D variable-width polygons. Negligible cost.
- **Sources.** AlMeraj [F]; Strassmann critique [S]; Curtis [F].

### 4.7 Dry-brush

- **Principle.** A nearly dry brush touches only the tooth peaks.
- **Why.** This is Curtis' definition; Montesdeoca makes it directable.
- **How.**
  - `deposit = cov·smoothstep(τ − ε, τ + ε, h)`, where τ rises with dryness along the stroke and toward its edges.
  - Use the **same h** as granulation, so they anti-correlate as in life: wet pigment in the valleys, dry pigment on the peaks.
- **Browser.** One tap per pixel. Canvas2D: `destination-in` with a thresholded paper canvas.
- **Sources.** Curtis [F]; Montesdeoca [S]; `painter.js` [L].

---

## 5. Substrate

### 5.1 Paper fibre and tooth: the height field

- **Principle.** Paper is a height field `h` built from three scales:
  1. *formation*: cloudy flocs, ~3–10 mm;
  2. *tooth*: ~0.3–1 mm, strong on cold-press and rough papers;
  3. *fibres*: ~0.02 × 1–3 mm, anisotropic, with a grain direction in machine-made paper [U].

  It feeds colour (subtly), lighting (raking) and **every deposit**.
- **Why.**
  - Bousseau uses paper for density *and* wobble; Curtis uses it for granulation and dry-brush.
  - Initialis builds formation from `fbm(q/3.2mm)·0.65 + noise(q/0.9mm)·0.35` (±3.5% brightness) and lights the sheet's height with `lit = dot(n, L)/L.z` [L].
- **How.**
  - `h = 0.5·fbm(q/6mm) + 0.35·noise(q/0.6mm) + 0.15·fibres`.
  - Fibres = max over 3–4 rotated copies of `1 − smoothstep(0, 0.18, |noise(x/0.09mm, y/0.7mm)|)`, the initialis "hair" field [L].
  - Colour `*= 1 + 0.03(h − 0.5)`.
  - Normals from finite differences give ±5–10% shading.
- **Browser.**
  - Analytic shader: est. 0.3–1 ms.
  - Canvas2D: prebake a 1024² non-periodic tile per DPR.
  - SVG: `feTurbulence fractalNoise` → `feDiffuseLighting` (low distant light) → multiply. Static only [U].
- **Sources.** Bousseau [F]; Curtis [F]; initialis `paperColor()` [L].

### 5.2 Laid and chain lines, watermark, deckle

- **Principle.**
  - Mould-made laid paper has dense *laid lines* (fine wires) and sparse *chain lines* (support wires).
  - Watermarks are wire shapes that thin the sheet.
  - All three are density variations, not ink: strong in transmitted light, faint in reflected light.
  - The **deckle** edge is feathery and thin, where pulp seeped under the frame.
- **Why.**
  - It immediately reads as "old book".
  - Glossaries give laid lines at ≤ ~1 mm and chain lines at ~25–35 mm (≈1 in). Initialis uses 0.95 mm and 25 mm [L].
- **How.**
  - Laid: `0.5 + 0.5·sin(2π(y + 0.25mm·noise(q/6mm))/0.95mm)`.
  - Chain: Gaussian ridges every 25 mm (σ ≈ 0.7 mm) plus a faint σ ≈ 3 mm halo.
  - Combine: `paper *= 1 − amt(0.022·laid + 0.03·chain)` [L].
  - Watermark: an SDF brightening paper by 3–5%, stronger in a "held to the light" mode [U].
  - Deckle [U]:
    - alpha = smoothstep(edge SDF + 2–4 mm·fbm);
    - opacity thins over the last 1–3 mm;
    - stray fibres cross the edge (initialis `fray`) [L].
- **Browser.** Free in the paper shader. CSS repeating gradients are too regular unless displaced.
- **Sources.**
  - https://millsarchive.org/glossary/a-z-glossary/2794, https://maltamapsociety.mt/glossary/chain-lines-chain-marks/, https://www.ioba.org/laid-paper [S]
  - Initialis [L]

### 5.3 Vellum and parchment [U]

- **Principle.**
  - Skin: warm, translucent where thin.
  - The hair side is yellower with follicle dots.
  - Humidity cockles it into broad smooth waves.
  - Ink sits on top and does **not** feather; thick paint and gold flake.
- **How.**
  - Cream base with translucency mottle.
  - Follicles: clustered blue-noise dots, −3 to −6%, ~0.2 mm.
  - 2–4 broad cockle waves, lit raking (initialis `cockle` [L]).
  - Feathering off; flaking on.
- **Browser / Sources.** Same cost as paper. [U]; initialis [L].

### 5.4 Ink bleed and feathering

- **Principle.** Ink wicks along fibres into a hairy halo, and letters fatten.
- **Why.** MoXi simulates it physically. Initialis fakes it analytically and convincingly [L].
- **How (initialis `inkAt`).**
  - From the JFA ink SDF, the outside halo is `near = exp(−sdf/(0.35·reach))` plus `far = exp(−sdf/(1.6·reach))·hair`.
  - `hair` is the max of 4 rotated anisotropic noises (strands ~0.09 × 0.7 mm).
  - A blurred, higher-LOD ink copy fattens the body.
  - `reach = (0.08 + 0.55k) mm × bleed`.
- **Browser.**
  - WebGPU as written. WebGL2 needs JFA as fragment ping-pong (~10 passes).
  - Canvas2D approximation: a low-alpha blurred redraw multiplied by thresholded fibres.
- **Sources.** Initialis `shader.js` [L]; MoXi [F].

### 5.5 Letterpress: impression and squash

- **Principle.**
  - Type debosses damp paper: the letter sits in a well with a soft shoulder.
  - Ink is squeezed toward the edges ("squash").
  - Inking is uneven, and worn sorts break.
  - Deep impression is modern taste; historic printers aimed for a kiss [U].
- **Why.** Tactility through light. Initialis' `press` effect has exactly these knobs: uneven, squash, rough edges, broken sorts [L].
- **How.**
  - Height: `−depth·blur(cov)` plus a shoulder `0.2·depth·(blur_wide − blur_narrow)`, with normals from the gradient.
  - Ink: `cov·(0.85 + 0.15·rim)·(1 − uneven·fbm)`.
  - Rough edge: coverage thresholded against fine noise.
  - Broken sorts: Worley dropouts.
- **Browser.**
  - SVG classic: `feGaussianBlur(SourceAlpha)` → `feSpecularLighting`/`feDiffuseLighting` + `feDistantLight` → `feComposite in`.
  - It works on live text via CSS `filter: url(#press)`. Static is cheap; avoid it on large scrolling areas [U].
- **Sources.** Initialis [L]; SVG lighting [U].

### 5.6 Risograph

- **Principle.**
  - Stencil printing with semi-transparent soy inks, one drum per colour.
  - Characteristics: misregistration, multiply overprint, mottled solids, light roller banding, grain or halftone in the tints.
- **Why.** Every convincing simulator reduces to:
  - spot-ink separation;
  - per-drum offset, with ≈1 mm called realistic;
  - multiply overprint;
  - Floyd–Steinberg grain or AM screens at 15°/75°/0°/45°.
- **How.**
  - Per drum:
    - `cov_i` offset by a hashed 0.2–1 mm, rotated ≤0.2°;
    - thresholded by blue noise (FM) or an angled screen (AM);
    - solids `× (1 − 0.15·fbm(q/2mm))`;
    - banding along the feed direction.
  - `out = paper·Π(1 − cov_i(1 − ink_i))`.
- **Browser.**
  - Shader: est. <0.5 ms.
  - CSS-only for vectors: stacked layers with `mix-blend-mode: multiply`, `translate` offsets and an SVG grain mask.
- **Sources.** https://effect.app/effects/risograph, https://jonathanstephens.us/play/riso/, https://www.shutterstock.com/blog/photoshop-tutorial-mimic-risograph-effect [S]

### 5.7 Halftone and screen printing [U]

- **Principle.**
  - AM halftone: dot area tracks tone on a rotated grid, with classic CMYK angles C15 M75 Y0 K45 to avoid moiré.
  - Dot gain and misregistration make it analog.
  - Screen printing: flat opaque inks, a mesh sawtooth at the edges, a slight film relief.
- **How.**
  - `cell = fract(rot(θ)·q/pitch) − 0.5`; `dot = length(cell) < pitch·√(tone/π)`, anti-aliased.
  - Dot gain: blur, then lower the threshold.
  - Screen print: posterise, threshold edges with mesh-frequency noise, light the ink film (§5.5).
- **Browser.** A free shader. SVG `<pattern>` dots are costly at scale.
- **Sources.** Angles as reported by riso tools [S]; the rest [U].

### 5.8 Line engraving: Ostromoukhov 1999

- **Principle.**
  - Copperplate engraving is **dithering against a threshold structure** shaped like the plate.
  - A "universal copperplate" of saw-profile furrows, cut at the height of the tone signal, makes lines that **swell** in the darks and taper away in the lights, for free.
- **Why.**
  - "The art of digital copperplate engraving may be resumed as the art of building appropriate threshold structures… the rendering may be done using conventional dithering".
  - Swelling burin lines are the signature of the medium.
- **How.**
  - Each layer is a threshold function T(u, v): uniformly spaced saw-profile waves, in any direction, over a parameterisation that follows the form.
  - For illum, the parameterisation can be SDF iso-lines, streamlines or a structure-tensor axis.
  - Range transforms `T′ = T·S + D` (scale and shift masks).
  - Merge modes (min, max, alternate…).
  - Local equilibration so that a flat input gives a flat perceived grey, including dot gain.
  - Mezzotint regions use blue-noise thresholds.
  - Output: `ink = tone > T′`, anti-aliased, with low-frequency line perturbation (§1.3).
- **Browser.**
  - **One fragment shader**, est. <0.5 ms, and far cheaper than strokes. `u = sdf/spacing` gives contour-parallel lines.
  - Static SVG via `feComponentTransfer` thresholds [U].
  - The highest-leverage "museum print" technique in this file.
- **Sources.**
  - https://lspwww.epfl.ch/publications/microstructureimaging/dfe.html [F]
  - https://www.cs.princeton.edu/courses/archive/fall00/cs597b/papers/SIGGRAPH99_FacialEngraving_1200dpi.pdf [F]

### 5.9 Woodcut and linocut [U]

- **Principle.**
  - A relief print: cut areas are white.
  - Marks: bold tapering gouges, chipped edges, **salting** (white specks where ink missed), plank grain in woodcut solids. Lino is grainless and softer.
- **How.**
  - The §5.8 machinery with inverted polarity and a rounder gouge profile.
  - Solids `× (1 − salting)`, where salting = blue-noise threshold × pressure noise.
  - Grain: stretched fbm, 0.9–1×.
  - Edges thresholded against Worley.
- **Browser / Sources.** One shader [U].

### 5.10 Cyanotype

- **Principle.**
  - Herschel 1842: ferric ammonium citrate plus potassium ferricyanide. UV reduces Fe(III) to Fe(II), which forms Prussian blue; develop in water.
  - Deep blue ground, white where shaded (Atkins' botanicals, blueprints).
- **Why.** One pigment means coherence by construction. Lifted contact edges blur, and brushed sensitiser leaves brush-marked borders.
- **How [U].**
  - `mix(paper, prussian, 1 − blur(mask, lift))`.
  - Brush-mask border (§4.1), fbm blotch, paper texture.
  - Prussian blue ≈ #0b3c6e–#1f4e86.
- **Browser.** Free.
- **Sources.** https://en.wikipedia.org/wiki/Cyanotype, https://new.graphicsatlas.org/cyanotype [S]

---

## 6. Gold and metallic

### 6.1 Leaf versus shell gold versus gold ink

- **Principle.**
  - **Water-gilded leaf:**
    - Laid on red or ochre **bole**, which warms it and removes the green cast leaf has over white.
    - Burnished to a near-mirror, so it reflects the environment: dark at most angles, blazing at the specular angle.
    - Leaf squares leave faint seams [U].
  - **Shell gold:** leaf ground into a binder for fine detail; a granular, broad, sparkly lobe with no mirror.
  - **Gold ink or print:** flat with mica glitter. On screen, a flat ochre reads as "mustard".
- **Why.**
  - Gold grounds' power is **view-dependence**: burnished gold on gesso seems "a solid block of shining metal" (Cennini).
  - On screen, gold needs:
    - a *dark* base with *narrow bright* highlights (contrast, not hue);
    - highlight motion with the viewer.
- **How.**
  - Specular-only for leaf, diffuse ≈ 0. F0 ≈ (1.0, 0.77, 0.33) in linear light [U, PBR tables].
  - Environment: a warm studio "matcap" sampled by the reflected vector. It reads better than physically correct lighting [U].
  - Normals:
    - leaf: flat plus faint gesso waves and seam ridges;
    - shell gold: high-frequency noise, roughness 0.4–0.6.
  - **Wear:** `mix(gold, bole_red, edgeDist × noise)`. This single trick sells old gilding [U].
  - Light driver:
    - pointer (desktop);
    - scroll (all devices, no permission);
    - `deviceorientation` on mobile, where **iOS requires `DeviceOrientationEvent.requestPermission()`**, which needs a tap (transient activation) and HTTPS. Feature-detect.
    - Spring-ease the light.
    - Under `prefers-reduced-motion` or print, freeze the light at a baked angle [U].
- **Browser.**
  - WebGL2 quad per element: est. <0.2 ms.
  - CSS fallback [U]:
    - layered `linear-gradient`s (dark ochre → pale gold → dark) with `background-position` driven by a custom property on `pointermove` or scroll;
    - `mix-blend-mode: color-dodge`;
    - or SVG `feSpecularLighting` + `fePointLight` moved from JS, for normal-mapped punchwork at CPU raster cost.
- **Sources.**
  - https://naturalfeb24upgrade.naturalpigments.com/artist-materials/water-bole-gilding, https://artcons.artsci.udel.edu/kress/historical-materials-techniques/entry/7163, https://noteaccess.com/Texts/Cennini/6a.htm [S]
  - https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static [F]

### 6.2 Punchwork and tooling

- **Principle.**
  - Halos and borders on burnished grounds are incised and *punched* (rings, rosettes, stars).
  - Each dent is a tiny concave mirror, so tooling *glitters* while the flat burnish flares.
- **Why.**
  - Tooling creates "textured surfaces to catch the light".
  - Punch shapes are specific enough (Skaug, Frinta) to attribute workshops: punchwork is authorship.
- **How.**
  - Punches along SDF offset curves every 1.5–3 mm.
  - Spacing jittered ±5%, depth ±15% (a hand-held hammer).
  - Ring stamp: `−depth·exp(−((r − r0)/σ)²)`. Rosette = a ring of dots. Incisions = V-grooves.
  - Normal map, specular per §6.1, plus a dark occlusion term in the dents.
- **Browser.** Prebake the normal map, then light it at runtime in WebGL2 or with SVG `feSpecularLighting` (alpha as height).
- **Sources.** https://smarthistory.org/gold-ground-panel-painting, https://publications.artgallery.yale.edu/italian-paintings/catalogue/volume-1/the-florentine-school/13 [S]

### 6.3 Craquelure

- **Principle.**
  - Gesso, paint and varnish crack in **hierarchical** networks: secondary cracks meet primary ones near-orthogonally.
  - Islands cup, which shows in raking light.
- **Why.**
  - Recent work generates drying-film crack networks by recursive Voronoi partitioning or crack growth, citing craquelure.
  - Theran wall-painting fragments split recursively along near-orthogonal cracks.
- **How.**
  - Base: Worley `F2 − F1 < width`.
  - Better:
    - two-level Worley (fine cells seeded per coarse cell), domain-warped by fbm;
    - width ∝ level;
    - cupping height `−k(F1/F2)²`, lit raking;
    - dirt in the cracks −20–40%.
  - Initialis uses `worley` `w.y − w.x` for ink crazing and iron-gall cracks [L].
- **Browser.** Shader est. 0.3–0.8 ms; prebake for Canvas2D.
- **Sources.**
  - https://arxiv.org/html/2603.24171 [S]
  - https://pixl.cs.princeton.edu/pubs/Shin_2012_AAS/index.php [S]
  - Initialis [L]

---

## 7. Ageing: initialis as the reference implementation

The most complete local example is `/nvme-mirror/DEV/illum/refs/initialis/ageing/src/` (`effects.js`, `fields.js`, `gpu.js`, `page.js`, `shader.js`) [L]. It is worth adopting structurally.

**Architecture.**
- **Effects are data.**
  - 28 effects in 5 groups: paper, stains, handling, damage, ink.
  - Each has an `amount` plus ≤7 knobs, packed into two vec4s.
  - An `ages` flag scales the effect by a master `age` slider. Manufacture properties (printing, folds) hold still.
- **Recipes are partial states**, e.g. "folded letter" = thirds folds + iron-gall fade 0.75 + corrosion + worn edges + thumbing.
- `vary()` makes coherent random mixes, with yellowing as the base 85% of the time.
- **One WGSL compose pass** over these textures:
  - ink coverage with mips;
  - ghost texts (the mirrored back of the leaf for show-through, the facing page for offset);
  - the drop-cap colour;
  - a JFA-built ink SDF.
- **Analytic and zoom-proof.** Everything is evaluated in MM units and LOD-gated by `detail()`.
- **Arrival-time maps** (`fields.js`): for things that spread (mould, worm tunnels), each texel stores *when* (0..1 of amount) it is first reached. One static texture animates growth smoothly as age is scrubbed.
- **Geometry buffer:** coffee rings, folds, creases, tape and tears generated from seeds on the CPU as vec4 records.

**Techniques to lift.**
- **Foxing:**
  - three hashed-grid layers (1.7, 6, 26 mm cells);
  - each spot has a birth time `pow(hash, 0.8)·0.85` and grows as `√grow`;
  - noisy edges;
  - 35% are lacy "snowflakes", the rest "bullseyes" with dark cores and a faint stop-ring;
  - clustered by slow fbm, and denser toward the edges.
- **Toning:**
  - `e·(0.72 + mottle) + edge band`, with an fbm-modulated exponential edge browning;
  - mapped through a 6-stop cream → straw → ochre → tan ramp.
- **Tide lines:**
  - a water front (from the bottom, a corner or a spill) perturbed by fbm at 32, 6 and 1.1 mm;
  - a sharp dark current front decaying inward (0.55 mm);
  - older fronts at `0.5 + 0.15k` of the reach;
  - a faint wash behind;
  - ink "running" sampled downstream inside the wet area.
- **Folds and rubbing:**
  - creases enter the lit height field;
  - ink loss along the crease, `exp(−|d|/1.2mm)`;
  - rubbing loss is patchy noise *protected by ink depth*, so thin strokes go first, which is physically right.
- **Iron-gall burn:**
  - an SDF halo;
  - Worley cracks gated by depth;
  - holes where `w.z < amount`, which cut alpha and cast a shadow on the page below.
- **Light:** the height field (cockle, crumple, folds, emboss) → normals → a Lambert-like term at a user light angle.

**Constraints and gaps.**
- WebGPU only: `navigator.gpu` is checked, and it throws otherwise. For illum, either:
  - port the compose shader to GLSL ES 3.0 (one fragment pass plus JFA as fragment ping-pong); or
  - prebake aged sheets and keep WebGPU in the playground.
- Cost scales with enabled effects (each is gated by `on(FX)`). A 5–8 effect recipe is est. 1–4 ms at 1080p [U].
- Missing: paint craquelure (only ink flaking exists) and *pigment* ageing (lead-white blackening, vermilion darkening, verdigris browning, gilding wear). These would be natural additions as a `pigment` effect group reading the palette records of §3.4.

---

## 8. Top 15 techniques: best look per millisecond

The ranking weighs perceptual gain against runtime cost and implementation risk on a typical static or lightly animated page.

| # | Technique | Gain | Cost / where |
|---|---|---|---|
| 1 | **Causal paper height field**: one `h` feeding granulation, dry-brush, wobble and raking light (§5.1, §4.7) | Marks move from "on screen" to "on paper" | 1 tap or ~1 ms analytic; WebGL2 runtime, Canvas2D prebake |
| 2 | **Bousseau density** `C′ = C − (C−C²)(d−1)` with turbulence, dispersion and paper layers (§2.2) | Flat fills become washes | <0.5 ms shader; SVG `feComposite arithmetic` |
| 3 | **Wet-edge rim** from SDF or blurred mask (§2.5; Curtis K=10, η 0.01–0.05) | Strongest single watercolour cue | <0.5 ms; SVG blur+composite; prebake |
| 4 | **Subtractive glazing**: multiply in linear light, never alpha-over (§3.3) | Layers read as pigment | Free (CSS blend modes, Canvas `multiply`) |
| 5 | **Human lines**: minimum-jerk quintic, squiggle D∈[−5,5] px, Catmull-Rom (§1.3) | Rules and hatches stop looking plotted | Free; Canvas2D/SVG, once |
| 6 | **Deterministic hashed seeding** (§1.2, `paintpass.js`) | No shimmer; reproducible | Free |
| 7 | **Blue-noise placement and dither**: Peters CC0 64², progressive point lists (§1.1, §4.5) | Stipple, speckle and grain stop clumping | 1 tap |
| 8 | **Edge wobble by low-res paper gradient** (§2.2) | Edges acquire tooth | 2 taps; WebGL2 or SVG `feDisplacementMap` |
| 9 | **Engraving by threshold structures** in SDF or flow coordinates (§5.8) | Swelling burin lines; a museum-print look | 1 shader, <0.5 ms; cheaper than strokes |
| 10 | **Historical limited palettes**, OKLCH plus KM-prebaked ramps via spectral.js, MIT (not Mixbox, CC BY-NC) (§3) | Coherent, period-true colour | Build-time only |
| 11 | **Hobbs layered polygons**, masked by paper plus blue noise (§2.3) | Blooming washes for shapes | 10–60 ms per shape, prebake |
| 12 | **Toning, edge browning, foxing, tide lines** (§7) | Instant age and provenance | 0.5–2 ms shader, or prebake |
| 13 | **Raking-light relief**: deboss, cockle, folds, punch dents (§5.5, §6.2) | The page becomes an object | ~0.3 ms shader; static SVG lighting |
| 14 | **Gold as specular-only + matcap + moving light**, bole showing at wear (§6.1) | Gold that reads as metal | <0.2 ms per element; CSS gradient fallback |
| 15 | **Oriented painterly strokes** (`painter.js` / Hertzmann) and prebaked bristle strokes (`brush.js`, 64 variants) (§4.1, §4.3) | Painterly figures and grounds | 50–300 ms per figure; prebake or Worker |

**Next tier:**
- riso misregistration (§5.6), a style rather than a finish;
- SDF feathering and iron-gall halos (§5.4), which need JFA;
- Secord stippling (§4.5), prebake;
- MoXi and full Curtis simulation, playground or prebake;
- histogram-preserving tiling, only if using scans.

**Do not ship:**
- `Math.random()` per render;
- uniform grain overlays;
- periodic 256-px tiles;
- RGB lerp for paint;
- perfectly parallel hatching;
- alpha-over for transparent media;
- animated `feTurbulence` over large areas.

---

## 9. Implications for illum

1. **The substrate is the root object.** It holds `h(q)`, absorbency, colour, px-per-mm at the current DPR and zoom, and age state. Every mark queries it, which makes texture causal.
2. **Marks are records**, `{path, pressure(u), speed(u), load, pigment, seed}`. Renderers turn them into pixels, so one drawing can render as watercolour, engraving or riso.
3. **Two tiers.**
   - *Runtime*: WebGL2 finishing passes (density, rim, wobble, glazing, engraving thresholds, gold, ageing).
   - *Prebake*: stroke systems and simulations, shipped as 2× WebP/AVIF with blue-noise dither.
   - Canvas2D fallback: multiply-composited prebakes plus SVG filters.
4. **Art direction by control fields** (MNPR): any parameter can be a constant, a per-element value or a painted or SDF-derived field.
5. **Determinism is a contract**: same seed, same pixels, across reloads, resizes and frames.
