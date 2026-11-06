# 08 — Paint: making a painted Lombardic capital read as real paint

Research for **illum**. The question: how do we paint a Lombardic capital (lapis or vermilion on parchment, as in Met 466773 and 463605) so that a demanding eye accepts it as paint? Rejected so far: noise in a mask, bristle brushwork, pie-site's paint pass, a Strassmann hairy brush, and Krita-style output in general.

**Source tags** (all accessed 2026-11-06):
- **[F]** fetched and read; numbers are quoted from it.
- **[S]** search abstract or snippet only.
- **[U]** unverified: domain knowledge or first principles.
- **[L]** local code read.
- **[M]** measured in this study, on the Met open-access scans.

**Measurement scripts** (reproducible; run with `uv run --with pillow --with numpy --with scipy python -I <script> <image> blue|red x0 y0 x1 y1 px_per_mm`):
- `/nvme-mirror/temp/claude/tmp/claude-1000/-nvme-mirror-DEV-illum/b7e44ace-1102-4b61-9be0-601ecc122043/scratchpad/scripts/measure2.py` (luma-segmented statistics)
- `/nvme-mirror/temp/claude/tmp/claude-1000/-nvme-mirror-DEV-illum/b7e44ace-1102-4b61-9be0-601ecc122043/scratchpad/scripts/aniso_light.py` (directional-shading test)

The scans are in `.../scratchpad/gold/`.

---

## 0. The answer, first

1. **The bar is a photograph of real paint, not a painting app.** Commercial engines are evidence of technique only. Most of their output reads as digital because it simulates a medium in general and never matches measured photographs of one particular object.

2. **Lighting is not the missing ingredient for this medium.** Met 466773 and 463605 appear to be diffuse copy-stand photographs (no directional term is measurable). In them, gum-tempera lapis and vermilion show **no directional shading measurable above noise** (§1.3, item 6). A paint height field lit from one side would *add* a feature the reference does not have. On this the user's "shader that inherits lighting" hypothesis is wrong for the paint. It is right for gold (02-gold), and it is a legitimate optional raking-light *mode*, but only if that mode is measured from a raking-lit capture.

3. **The user's second hypothesis is right: anchor it to how a real painter works.** That leads to the data. At the sizes we render, a real stroke's look comes from:
   - an edge as sharp as the camera allows;
   - low-amplitude mottle;
   - a *one-sided* (light) tail of thin spots and losses where the parchment shows through;
   - almost no along-stroke streaking.

   None of these is a bristle and none is noise. Every rejected method added a feature the reference lacks (bristle tracks, symmetric blotches, oil daubs) or missed one it has (light-tailed coverage, losses, the substrate's own texture showing through).

4. **The most reliable route is data-driven synthesis from real strokes.** That means RealBrush-style piecewise matching and warping of *real* painted exemplars along our ductus. RealBrush's single strokes were indistinguishable from photographs in a forced-choice test: 49% correct, against 63% for a naively stretched single exemplar [F].
   - The exemplars have to be painted by a person in the real pigments on a real skin, and scanned at ≥1200 dpi.
   - The Met scans (8–10 px/mm, 4:2:0 JPEG, fills crossed by penwork) are good for statistics and as blind-test ground truth. They cannot supply strokes that survive the 400% gate.

5. **Emulate as film grain is emulated (§2).** Measure the medium, model the residual as a function of the signal, share one optical pipeline with the page, and test blind.

---

## 1. What real paint looks like in the reference photographs [M]

### 1.1 Material and method

**Objects.**
- **Met 466773.** Leaf, psalter, early 15th century; "tempera, gold, and ink on parchment", 46 × 35.1 cm [F: Met API].
  - Scan 2811 × 3666 px, giving **≈ 8.0 px/mm** (≈ 200 dpi).
  - Crops: the blue Lombardic **O** (x 280–470, y 860–1110) and the blue **C** of *Custodi* (x 1540–1760, y 1540–1730).
- **Met 463605.** Leaf, 1501–2, "tempera, ink, and gold on parchment", 23 × 17.8 cm [F: Met API].
  - Scan 1806 × 2430 px, giving **≈ 10.6 px/mm**.
  - Crop: vermilion rubrics and the red *P* (x 180–1050, y 0–450).
- Enlarged crops for inspection: `.../scratchpad/meas/c_O.png`, `z_O.png`, `r_top.png`.

Met API: https://collectionapi.metmuseum.org/public/collection/v1/objects/466773 and …/463605 [F].

**Capture caveat.** 466773 is JPEG with **4:2:0 chroma subsampling**, so colour is blurred about 2× and is unreliable within ~2 px of an edge. 463605 is 4:4:4. Everything below is measured on **CIE L\***, and the paint is segmented on luma: inside means L\* below the midpoint between core paint and paper. A first chroma-segmented pass seemed to show a dark, greyish rim. That was the subsampling, and it is discarded.

### 1.2 Numbers

| Quantity | Blue O (466773) | Blue C (466773) | Vermilion (463605) | Parchment |
|---|---|---|---|---|
| Core L\* | 38.7 | 37.3 | 51.8 | 83–89 |
| Interior sd L\* (>0.3 mm from edge) | 4.5 | 4.4 | 3.2 | 2.5–4.3 |
| Slow component (>1 mm) sd | 2.4 | 1.8 | 1.3 | — |
| Fine residual (<1 mm) sd | 3.1 | 2.9 | 1.8 | — |
| Skew of interior L\* | **+0.96** | **+1.39** | −0.55 | — |
| p5 / p50 / p95 L\* | 33 / 39 / 48 | 33 / 38 / 48 | 48 / 52 / 56 | — |
| Detrended autocorrelation at 1 px / 2 px | 0.33 / 0.19 | 0.14 / 0.09 | 0.70 / 0.45 | — |
| Anisotropy of fine residual (across ÷ along stroke) | 1.17 | 1.05 | 1.07 | — |
| Anisotropy before detrending (mm-scale streaks) | 1.35 | 1.25 | 1.33 | — |
| Edge 10–90% width (read from the printed profile; see note) | ≈0.35 mm ≈ 3 px | ≈3 px | ≈0.27 mm ≈ 3 px | — |
| Rim: L\* at 0.19–0.5 mm inside vs core | +0.6 to +2 (no dark rim) | +2 (no dark rim) | 0.0 | — |
| Cross-stroke profile (edge → centre quarters) | flat ±0.3 | centre −1.5 (thicker) | edge +1 | — |
| Gaps or losses inside the paint | 0.08% | 0.10% | **1.36%, 22 spots** | — |
| Contour raggedness vs a 0.5 mm-smoothed outline | 0.136 | 0.108 | 0.132 | — |
| Directional shading at edges (8 normal bins) | ±5 L\*, no cosine pattern | inconsistent | none | — |

**Note on edge width.** The script's automatic 10–90% value (nan, 7.5 px, 9.7 px) is wrong. It normalises to the global paper L\* (83–89), but the plateau just outside these edges is ~75, darkened by red penwork and stains. Normalised to that local plateau, the printed luma profiles give ≈3 px.

Band-pass energy of L\* per octave, from 0.125 to 1 mm, is ≈1.0 L\* inside the lapis and ≈0.6 L\* on the parchment. Vermilion is ≈0.5, *smoother than the parchment around it*. (These figures come from a first pass, `measure.py`, before detrending.)

### 1.3 What the numbers say

**1. The edge is as sharp as the camera.** The 10–90% transition is about 3 px at both resolutions, which is the camera's PSF plus JPEG. Real tempera on parchment does not feather or bleed (Cennini: parchment colours "must be ground very fine", tempered "with gum arabic" [F]). Its edge wobble is small: about 0.1 mm against a smoothed outline, i.e. a hand following a drawn contour.

**2. No measurable pooled rim.** Watercolour's dark wet edge (02-analog §2.5) is absent here at 8–10 px/mm. Any rim is at most 1–2 L\*. The user approved "flat wash pooled at edge", so keep a rim **≤ 2 L\*** or drop it.

**3. The variation is one-sided.** Lapis has positive skew (+1.0 to +1.4): a light tail where the paint is thin and parchment shows through, or where colourless grains of the lapis matrix sit. The dark side is bounded, because the paint can only be as dark as full coverage.
- Vermilion is dense and opaque. Its interior is nearly symmetric; its departures are **discrete losses** (1.4% of area, 22 flakes showing bare parchment).
- Symmetric noise, the default of every procedural texture, is the wrong distribution for either pigment.

**4. Low amplitude, two scales.**
- A slow mottle (>1 mm) of sd 1.3–2.4 L\*.
- A fine residual of 1.8–3.1 L\*. In the lapis this is nearly uncorrelated at 1 px, i.e. **at the capture floor**. Lapis particles are 5–10 µm in a well-ground medieval pigment [S: Vienna Genesis study], so granulation is unresolved at 8 px/mm and cannot be "seen" there.
- In vermilion the fine variation is correlated over ~0.2–0.4 mm.

**5. Almost no along-stroke streaking.** After removing the slow component, the fine residual is close to isotropic (1.05–1.17). Some mm-scale streaks run along the bowl of the O: visible pale drags where the brush laid less, ratio 1.25–1.35 before detrending. They are a few broad, irregular tracks per stroke, not dozens of parallel hairs.

**6. No directional lighting.** Edge-band lightness by edge-normal direction varies by ±5 L\* with no cosine dependence, in both letters. These are diffuse copy photographs, and the paint layer is thin (gum or glair tempera, typically tens of µm [U]). There is no impasto to light.

**7. The substrate is part of the image.** Parchment sd is 2.5–4.3 L\*, with follicle dots and stains. It is as textured as the lapis and *more* textured than the vermilion. Paint reads as paint partly because it sits on, and occasionally fails to cover, a surface that is visibly a surface.

### 1.4 Scale: what is visible where

A Lombardic capital on our page is 2–3 lines tall, ≈ 50–85 CSS px. A real one such as the O is ≈ 24 mm. So:

| Sampling | px/mm |
|---|---|
| 100% at DPR 1 | ≈ 2–3.5 |
| 100% at DPR 2 | ≈ 4–7 (≈ the Met scan) |
| **400% gate** at DPR 2 | ≈ 16–28 (above the Met scan; ≈ 400–700 dpi) |

| Feature | Physical size | Visible from | Consequence |
|---|---|---|---|
| Lapis particles | 5–20 µm | ≥ 100 px/mm | Never. Do not draw grains. |
| Colourless matrix specks, clusters | 50–150 µm | ≥ 15–20 px/mm | 400% only; must come from real data. |
| Bristle tracks | 50–100 µm | ≥ 20 px/mm | 400% only. At 100% they alias to noise. |
| Parchment follicles | ~0.2 mm | ≥ 10 px/mm | Faint at 100% on DPR 2. |
| Edge wobble | ~0.1 mm | ≥ 10 px/mm | Sub-pixel at 100%, visible at 400%. |
| Mottle, pale drags | 0.3–2 mm | ≥ 3 px/mm | **Visible at 100%: the main signal.** |
| Losses or flakes | 0.3–1 mm | ≥ 3 px/mm | Visible at 100%. |
| Edge PSF | ~0.3 mm (scan) | — | Match the parchment layer's blur, not a vector edge. |

**Consequence.** Exemplars that must survive the 400% gate need ≥ 30 px/mm at the letter's physical size, so **scan at 1200 dpi** (47 px/mm). At 100%, what matters is the right mottle amplitude, the right skew, losses, and a substrate-consistent edge, all at low contrast.

---

## 2. Analog emulation in other domains: what the successful ones do

The best emulations do not invent artifacts. They **measure the medium and synthesize the residual.**

**Film grain in AV1** (Norkin & Birkbeck, DCC 2018) [S: abstract + search summary]:
- The encoder denoises the source, takes the residual, and fits an **autoregressive model** (lag 0–3) to it.
- Grain **strength is a function of signal intensity**; the authors note that a multiplicative model does not represent grain well.
- The decoder generates a 64 × 64 grain template and places 32 × 32 blocks at **pseudo-random offsets**.
- Even so, a later SMPTE 2024 paper is titled "AV1 Repetitive Film Grain Pattern Detection" [S]. Template repetition is a known tell even in a measured model.
- **Lesson:** fit the residual's spectrum and its intensity dependence from data, and never let a template repeat visibly.

**Film emulation (Dehancer, FilmConvert)** [S: vendor statements]:
- Dehancer builds profiles from instrument measurements (spectrophotometer, densitometer) of real stock. It argues a LUT holds only a colour-contrast transform, and that grain, halation, bloom and gate weave are separate measured effects.
- FilmConvert's grain is varied "in every part of the image" by tonal level, from 6K ArriScan grain scans.
- **Lesson:** decompose the look into separately measured effects, each driven by the local signal. Do not add one texture over everything.

**VFX plate integration** [U]: an inserted element passes through the plate's lens blur, grain and colour pipeline, so both share one PSF and one noise floor. Our version: the paint edge must carry the *same* blur and noise as the parchment around it. A vector edge on a textured, slightly soft parchment reads as a sticker.

**Audio tape and console emulation** [U]: credible plugins model measured transfer curves and noise spectra of specific units. "Generic warmth" (fixed saturation plus white hiss) reads fake.

**Sources.** https://norkin.org/pdf/DCC_2018_AV1_film_grain.pdf; https://summit.smpte.org/2024/session/2477673/av1-repetitive-film-grain-pattern-detection-and-quality-assessment; https://blog.dehancer.com/articles/how-we-build-film-profiles/; https://www.provideocoalition.com/achieve-that-film-look-with-digital-by-using-filmconvert/ [all S].

**The common rule.** A medium's character is a *conditional* residual: it depends on signal level, on position in the stroke, and on the substrate. Measure it on the real thing, synthesize it without repeats, and pass everything through one optical model.

---

## 3. Approaches, ranked by analog faithfulness

### 3.1 Data-driven strokes from real exemplars: RealBrush and successors (rank 1)

**What it is.** RealBrush (Lu, Barnes, DiVerdi, Finkelstein, SIGGRAPH 2013) synthesizes new strokes by matching and warping pieces of photographed real strokes, with no physical simulation [F: PDF].

**Why it reads as real.** Every pixel of texture, every end, every edge irregularity was made by a real brush in real paint. Only the path is new. Their user study (Mechanical Turk, 139 subjects, filtered by attention checks) asked people to pick the real stroke from a real/synthetic pair:

| Condition | Correct |
|---|---|
| Naive: stretch one exemplar along the path | 462/736 (**63%**) |
| RealBrush: piecewise matching + warp | 360/736 (**49%**), i.e. chance |

For single strokes the method "appears to have been indistinguishable from real photographs". Smears and smudges, where colours mix, were less convincing (60–64%) [F].

**Algorithm (from the paper, adapted to us).**
1. **Capture.** 20–30 isolated strokes per medium "of different shape, curvature and thickness", shot with a tripod DSLR. Overhead light avoids shadows and highlights, which would be wrong once the stroke is rotated [F].
2. **Process each exemplar.**
   - A hand-marked spine, smoothed to 30–100 samples.
   - The outline, with a margin "to preserve boundary effects".
   - Ribs from the spine to the outline.
   - Coordinates u ∈ [0, 1] along the spine and v ∈ [−1, 1] across it, interpolated per pixel (multilevel B-splines) [F].
3. **Match.** Split the query path into overlapping segments. Find k-NN candidates on turning angle, width, distance to the endpoints (so ends match ends), and appearance across the width. Pick the best chain by **dynamic programming** [F].
4. **Warp.** Resample each match by (u, v). The pieces are already close in shape, so the warp barely distorts the texture. That is why piecewise matching beats stretching one exemplar [F].
5. **Merge.**
   - A cross-dissolve, which suffices for "watercolor and oil paint".
   - Otherwise a graph-cut seam plus gradient-domain blend.
   - Offline, constrained image melding: interior patches come only from exemplar interiors (more than ¼ of the max distance from the edge) [F].
6. **Colour.** RealBrush keeps only lightness and recolours a\*b\* by (100 − L)/100. The authors call this a limitation [F]. **We don't copy it.** We capture in the real pigments and store a KM thickness map (§6.1).

**Successors.**
- **HelpingHand** (2012) is the matching backbone [S].
- **DecoBrush** (SIGGRAPH 2014) fits *structured* decorative exemplars along a path with graph cuts and synthesis. It suits penwork, not fills [S].
- **Ciallo** (SIGGRAPH 2024) is fast GPU rendering of vector *stamp* and airbrush strokes, i.e. the Krita model (§4.5). It is not a source of realism. Its project page acknowledges a parameterization error [S].

**Browser.**
- **Bake** the matching and dynamic programming, and ship only indices.
- **At runtime**, each stroke is a WebGL2 triangle strip along the ductus. Its (u, v) samples an exemplar **atlas** per colour: ~40 strokes need ≈4096² at 47 px/mm, or 2048² at ~24 px/mm, which already covers the 400% gate at DPR 2 (AVIF/WebP, mip per DPR), and the shader cross-dissolves the overlaps. That is one draw per stroke, ≪ 1 ms.
- Canvas2D can approximate it with quads drawn by `drawImage` under `setTransform`.
- **The "draw" animation survives:** reveal along the strip by a u threshold.

**Risks.**
- A small library forces big warps. Fix: capture the Lombardic vocabulary (§6.2).
- Repeats on a page. Fix: a no-repeat allocator, like pie-site's 64 prebaked brushes [L].
- Joins need overlap exemplars.

**Sources.**
- https://gfx.cs.princeton.edu/pubs/Lu_2013_RPW/Lu_2013_RPW.pdf [F]
- https://gfx.cs.princeton.edu/pubs/Lu_2014_DDS/Lu_2014_DDS.pdf [S]
- https://research.adobe.com/publication/ciallo-gpu-accelerated-rendering-of-vector-brush-strokes [S]
- https://www.sourcepulse.org/projects/2181002 [S]

### 3.2 Guided synthesis from real whole letters: StyLit-style (rank 2)

**What it is.** StyLit (Fišer et al., SIGGRAPH 2016) transfers a hand-made exemplar onto a new target patch by patch. **Guidance channels** put source and target in correspondence, and a uniform patch-usage constraint stops it washing the texture out by reusing a few patches [S].

**Why it reads as real.** The patches are copied, so the light tail, flakes and specks arrive intact.

**For us.**
- Guides: signed distance to the contour (mm), arc length u along the ductus stroke, local width, and stroke id or overlap.
- Run multiscale PatchMatch with these guides, offline at seconds per letter, so prebake.
- Use it when the user has painted whole Lombardic letters: any new letter can then borrow edge, end, join and interior texture from the matching places.

**Sources.**
- https://dcgi.fel.cvut.cz/en/publications/2016/fiser-tog-stylit/ [S]
- https://dcgi.fel.cvut.cz/wp-content/wpallimport-dist/publications/pdf/publications-2016-fiser-tog-stylit-paper.pdf (downloaded; not read in full)

### 3.3 Measured-statistics fill: the film-grain route (rank 3, no assets)

**What it is.** A fill whose residual is synthesized to match §1.2, coupled to the parchment, with the page's PSF on the edge. It reproduces what a viewer sees at 100% and nothing more. At 400% it looks like an enlarged museum scan: honest, but not macro quality.

**Algorithm.**
1. **Thickness τ(x)**, in units of full hiding (mean ≈ 1.2).
   - A slow field in stroke coordinates, with correlation ~2 mm along u and ~1 mm across v. This gives an anisotropy of ≈1.3, with amplitude set so that L\* sd ≈ 2.
   - Plus 1–3 **drag tracks** per stroke: bands 0.3–0.8 mm wide of thinner paint, wandering slowly.
2. **Colour = KM reflectance of a layer of thickness τ over the parchment's own reflectance at x.** Thin paint shows the parchment's texture, which gives the **light tail for free**. Fit K/S to the measured core and paper colours, with spectral.js (MIT) or an own 3-band KM. Not Mixbox, which is CC BY-NC [S].
3. **Fine residual.** An AR or blue-noise field at sd 1.8–3 L\*, applied to τ so that it is stronger where the paint is thin. Conditional, like AV1 grain.
4. **Losses.** A 0.3–1 mm field thresholded to 0.5–1.5% of the area, biased to edges and ends. Inside each, bare parchment with a crisp, irregular border.
5. **Edge.** The ductus contour plus ~0.1 mm of low-frequency hand drift, then **the same blur as the parchment** (≈0.5–1 device px at DPR 2). Rim ≤ 2 L\*.

**Browser.** One WebGL2 fragment shader, or Canvas2D at bake time. <1 ms.

**Risk.** It is procedural, and the user has rejected one procedural fill already. Ship it only if it passes the §6.4 gates.

### 3.4 Height field and lighting: Hertzmann 2002, Fluid Paint, Painter, Rebelle (off by default)

**What it is.** Render every stroke into a height map and light it through a normal map.
- **Hertzmann, "Fast Paint Texture" (NPAR 2002)** [F]:
  - Each stroke has an opacity map and a height map.
  - The height field starts at zero. Strokes are drawn into it **with alpha blending, not added**, with a constant offset that grows with the number of strokes drawn, so stroke boundaries become height steps. Adding heights instead made hidden strokes show through.
  - Normals come from height derivatives; lighting is Phong.
  - The author's caveat: it has "the shiny, static appearance of viscous oil paint". He suggests "scanning real strokes" for other media.
- **Fluid Paint** (David Li, WebGL, MIT) [L]:
  - Up to 100 bristles × 10 vertices, with constraint dynamics.
  - The bristles splat paint into a 2D fluid grid (advect, Jacobi pressure, project) for 60 frames.
  - The paint texture holds RYB colour plus height in alpha. Shading uses a Sobel normal (`NORMAL_SCALE = 7`), only 15% diffuse, GGX specular (`ROUGHNESS = 0.075`, `F0 = 0.05`, `SPECULAR_SCALE = 0.5`), and `LIGHT_DIRECTION = [0, 1, 1]`.
  - **What sells it is glossy specular on relief. It reads as wet oil**, the wrong material for matte gum tempera.
- **Corel Painter impasto** derives depth from the luminance of a control medium and lights it with global lights [S].
- **Rebelle** combines an impasto engine, a "RealShader with SoftShadows" lit by environment maps, spectral pigment mixing and watercolour granulation [F].
- **IMPaSTo** (Baxter et al., NPAR 2004) [F]:
  - Height-field layers of pigment concentrations, advected on the GPU.
  - Bump-mapped, with **8-wavelength Kubelka–Munk** (K and S measured at 101 wavelengths, sampled by Gaussian quadrature).
  - Its resolution note: bristle-scale features (~80 µm) need "probably 500 DPI or more".

**Does our paint need it?** No: §1.3, item 6 measured no relief under copy lighting. Height and light belong in three places:
1. gold (02-gold);
2. broad parchment cockle (02-analog §5.3);
3. an opt-in raking-light mode that moves only with the reader.

Build the raking mode **only from a raking-lit capture** of the same exemplars, using photometric stereo from 4 azimuths [U]. Gum or glair sheen is faint and broad (roughness ≈ 0.4–0.6 [U]), far from 0.075.

**Sources.**
- https://www.dgp.toronto.edu/papers/ahertzmann_NPAR2002.pdf [F]
- https://github.com/dli/paint [L]
- https://gamma.cs.unc.edu/IMPASTO/publications/Baxter-IMPaSTo_Print-NPAR04.pdf [F]
- https://product.corel.com/help/Painter/540111162/Corel-Painter-en/Corel-Painter-Thick-Paint.html [S]
- https://www.escapemotions.com/products/rebelle/about [F]

### 3.5 Physical simulation: WetBrush/Fresco, MoXi, Curtis (not for this)

**What it is.**
- **WetBrush** (Chen, Kim, Ito, Wang, SIGGRAPH Asia 2015) simulates at the bristle level. Liquid near the brush is particles; liquid away from it is a density field. It runs in CUDA at 30–110 FPS [F].
- It became Fresco's oil Live Brushes, through Byungmoon Kim's faster iPad collision code [S].
- MoXi and Curtis simulate ink and watercolour flow (02-analog §2.1, §4.2).

**Why not.** These simulate media that *flow*. Gum tempera on sized parchment barely does. Its look comes from the hand, the grind and the skin. A simulator must also be tuned until it matches photographs, and when photographs are the target, using them directly (§3.1) is cheaper and more faithful. RealBrush's authors make the same argument [F].

**Keep only subtractive colour** (Kubelka–Munk) for thin paint over the substrate, and for white over blue in large initials.

**Sources.**
- https://wanghmin.github.io/publication/chen-2015-wgb/Chen-2015-WGB.pdf [F]
- https://research.adobe.com/news/fresco-the-future-of-painting-born-of-a-union-of-art-and-science [S]

### 3.6 Stamp-and-grain engines: Procreate, Krita, ArtRage (evidence only)

- **Procreate** [S, third-party]: a brush is a stamp **shape** times a greyscale **grain**. "Moving" grain follows the stroke; "texturized" grain is fixed to the canvas.
- **Krita** [F, manual]:
  - Tips are stamped at a set spacing.
  - The texture mode combines a greyscale pattern into the dab's alpha by multiply, subtract, height, darken, burn and so on.
  - Its **random offset is chosen per stroke**.
  - Colour smudge mixes canvas colour into the dab.
- **ArtRage** [U]: lit thick paint, in the Hertzmann family.

- **Web painting apps** such as Kleki and Sketchpad are Canvas2D dab stamping, i.e. the Krita family. Shadertoy "oil" shaders are typically Hertzmann-style lit height fields [U]. Both fall under the §6.3 avoid list.

These are vocabulary, not a quality bar (§4.5). Learning-based painters (Stylized Neural Painting, Paint Transformer) only fit stroke parameters to a parametric renderer, so they add no material realism [U].

**Sources.**
- https://docs.krita.org/en/reference_manual/brushes/brush_settings/texture.html [F]
- https://paperlike.com/blogs/paperlikers-insights/procreate-brush-studio-explained [S]

---

## 4. Why our attempts read as digital

Each rejected method is checked against §1.

### 4.1 Noise in a mask ("blotches")
- **Wrong distribution.** Value or fBm noise is symmetric about its mean. Real lapis variation is **light-tailed** (skew +1 to +1.4), because the paint has a floor of full coverage and departs from it only by thinning. Symmetric blotches create *darker-than-full-coverage* areas that cannot exist physically.
- **Wrong amplitude.** The measured slow mottle is only 1.3–2.4 L\* sd, barely perceptible. Anything that reads as "blotches" at 100% is several times too strong. Check this with `measure2.py` on the old render.
- **Not causal.** The noise is laid in screen or page space with no relation to stroke direction, ends, width, or the parchment underneath. Real variation follows the stroke weakly (anisotropy 1.25–1.35) and lets the substrate through where thin.
- **Alpha-over, not subtractive.** Thin paint should show the parchment's own texture (KM over substrate), not a lighter flat blue.

### 4.2 Bristle hair brushwork ("digital paint")
- It adds a feature the reference **does not have at that scale**. The fine residual of real lapis is nearly isotropic (1.05–1.17). Visible parallel hair tracks are a sumi-e or oil feature.
- **Scale.** At 100% on DPR 2, a 3 mm stroke with 40+ hairs puts each hair at ~0.3 px. They alias into a uniform shimmer that reads as filter noise. At 400% they become evenly spaced ruled lines.
- **Per-hair alpha jitter** gives symmetric variation, again the wrong distribution.

### 4.3 Pie-site paint pass ("feels like Krea")
- It re-renders an image as **oil daubs** along the image's structure tensor (`kit/paintpass.js` [L]): a *filter* of uniform stroke density everywhere.
- A medieval letter was not built from daubs. It was drawn, crisped with the pen, and filled with fine-ground colour (Cennini [F]).
- Uniform daubs over smooth gradients is the visual signature of image-to-painting filters and AI painterly stylizers. Hence "Krea".

### 4.4 Strassmann hairy brush along the ductus ("no texture or depth"; "awful")
Following the ductus was right. The renderer was wrong in five ways (`kit/brushstroke.js` [L]):
1. **Edges.** Alpha-blended line segments with round caps give a stroke edge made of overlapping antialiased circles. It is soft and lumpy at the wrong scale and does not share the parchment's PSF.
2. **Interior.** Per-bristle tint and alpha (±13 tint, alpha 0.55–1 in pie-site's `brush.js`; `own`/`streak` in `kit/brushstroke.js`) give dozens of fine *parallel* lines of symmetric variation. That is the wrong anisotropy and the wrong distribution.
3. **No substrate interaction.** Paint is composited over the page by `globalAlpha`. Thin areas do not reveal parchment texture, so there is "no depth": the paint is a cellophane layer, not a film on a surface.
4. **Dry-brush skipping on `tooth`.** That is a paper or watercolour behaviour. Parchment has no tooth to skip on at this scale. The real departures are drags and flakes.
5. **All of it is invented.** No quantity was fitted to a photograph, so the amplitudes are guesses, and the eye reads guessed amplitudes as "made up".

### 4.5 Krita-style output (the user's named negative reference)
What makes stamp-and-grain engines read digital, as a design checklist to build against:
1. **Fixed dab spacing.** A stroke is a stamp repeated at fixed spacing (a % of tip size). At the edge this leaves scalloping or periodic beads, and in the interior a periodic accumulation pattern.
2. **One tip, repeated.** RGBA or photographed tips are a single image stamped hundreds of times, rotated at best. Every stroke has the same "cross-section".
3. **Grain ignores the stroke.** The texture is a canvas-anchored (or per-stroke randomly offset) greyscale pattern multiplied or subtracted into alpha.
   - It does not follow stroke direction, load or pressure history.
   - It is the *same* texture under every stroke and colour.
   - Krita's random offset *per stroke* breaks continuity at stroke boundaries.
4. **Grain lives in pixels, not millimetres.** It is sized per brush, not at the physical scale of a substrate, so it lies at zoom and DPR (02-analog §1.5).
5. **Flat compositing.** Alpha or "normal" blending, sometimes multiply. No pigment model and no substrate under thin paint. Smudge mixes in RGB, so blue + yellow → grey [U].
6. **No shared optics.** The dab is antialiased to a vector-perfect edge, while the canvas texture has a different blur and noise. Element and plate don't match.
7. **Symmetric grain contrast.** The texture subtracts and adds evenly. Real paint departs from full coverage only one way.

---

## 5. How a medieval illuminator painted a Lombardic capital (what we are emulating)

### 5.1 Sequence [F where marked, else U]
1. **Ruling and spacing.** The scribe leaves a space of n lines for the initial.
2. **Drawing.** Cennini's illuminator draws "with a little lead on parchment" and then must "crisp up our drawing carefully with a pen" [F: Cennini CLVII]. For a Lombardic capital this is the letter's contour: a pen-drawn outline of swelling bowls and stems.
3. **Gilding first, if any.** Gold always goes before colour, because burnishing would smear paint (02-gold) [U].
4. **Filling.** Colour is laid into the outline with a small brush, *one coat* for small capitals [U].
   - Colours for parchment are tempered "with gum arabic", and "must be ground very fine" [F: Cennini].
   - The English recipe "Vorte temprene asure" washes azure with glair, then mixes it with gum-water before use [S: Harley 2253 edition].
   - Pigment-to-binder trials for azurite on parchment used ~0.5 g pigment to 300–400 µl of glair or gum solution [S: Heritage Science 2019].
   - Blue was either azurite (lighter, used for small initials and line-fillers in the Fitzwilliam's Pontifical of Renaud de Bar) or ultramarine (darker, reserved for robes and details) [F: Fitzwilliam]. A Fitzwilliam XRF study found more calcium in the ultramarine of small text initials: calcite from the lapis matrix, i.e. a less refined grade [S].
   - Lombardic capitals in mid-tier choir books therefore plausibly use lower-grade lapis or azurite. That fits the light-tailed, speckled variation measured in §1.3 [U].
5. **Penwork.** Flourishing in the *other* colour (red for a blue letter and vice versa) goes around and into the letter [S: Free Library and Cornell catalogue descriptions]. This is 03-penwork's domain.
6. **Larger initials only:** white hairlines and darker or lighter modelling (the user's verdict: never on small capitals).

### 5.2 What a stroke of gum-tempera lapis looks like [U, consistent with M]
- **Matte, slightly velvety.** The film is thin, so the parchment's surface reads through at grazing light.
- **Opaque where full, with a light tail** where thin.
- **Colour depends on the grind.** Coarser lapis is darker and more saturated; finer is paler (Cennini grades his yields from the first, strongest, extraction down to grey "ultramarine ash" [S]).
- **Crisp edge** set by the pen outline and the brush following it, with no capillary feathering on sized parchment.
- **Brush.** Miniver or squirrel rounds with a fine point, loaded and dragged along the bowl. Where the load runs short, a few broad pale drags follow the stroke. The ends are wherever the painter stopped inside the outline, so they are **invisible as stroke ends**: the outline, not the brush, defines the letter's terminals [U]. This is why a bristle-ended stroke looks wrong for a Lombardic fill.
- **Vermilion** is dense and covers in one coat. It is flatter than the parchment, with flakes where it has lost adhesion [M]. In rubrics it is written with a broad pen, not a brush.

### 5.3 What a macro photograph would show that our renders lack
1. The **substrate showing through** thin paint (parchment fibres, follicle dots) in the paint's own colour, not under a uniform blue.
2. **Discrete, irregular departures** (drags, specks, flakes) rather than continuous noise.
3. **An edge set by a drawn line**: crisp, hand-wavering at ~0.1 mm, with the same optical softness as everything else in the photograph.
4. **At 400% and above:** the paint film's micro-surface (tiny matrix crystals, dried binder ridges at the very edge). This is unknowable without a real capture, and cannot be procedurally guessed to a demanding eye's satisfaction.

**Sources.**
- https://noteaccess.com/Texts/Cennini/9TM.htm [F]
- https://qi.fitzmuseum.cam.ac.uk/illuminated/manuscript/discover/the-pontifical-of-renaud-de-bar/material/blue-pigments [F]
- https://link.springer.com/article/10.1186/s40494-019-0262-1 [S]
- https://d.lib.rochester.edu/teams/text/fein-harley2253-volume-2-article-11 [S]
- https://cool.culturalheritage.org/jaic/articles/jaic30-02-001.html [S]
- https://austria-forum.org/web-books/viennagenesis00en2020isds/000211 [S]
- de Hamel, *Scribes and Illuminators* (1992); Alexander, *Medieval Illuminators and Their Methods of Work* (1992) [unverified: not consulted]

---

## 6. Recommended method

### 6.1 Ranked options

**Option A (recommended): a real painted exemplar library, warped along our ductus, RealBrush-style.**

Keep: the ductus (`kit/ductus.js`), the stroke records, the "draw" animation, the parchment.
Replace: only the stroke renderer.

Pipeline:
1. **The user paints and scans the library** (§6.2).
2. **Calibrate** (offline):
   - Flat-field the scan using the blank substrate region and the grey card.
   - Fit per-pixel **thickness τ** by inverting KM against the measured blank substrate.
   - Store τ (16-bit) plus a small colour residual. Keep τ, not RGB, so the paint recomposites onto *our* parchment, in any palette, including dark-mode re-inking.
3. **Library processing** (offline): spine, outline with margin, ribs, (u, v) by MBA or a simple Coons patch per rib pair, features (turning angle, width, distance to ends, appearance).
4. **Bake per letter:**
   - Split each ductus stroke into segments.
   - Match by k-NN + DP. Prefer exemplars whose *painted direction* matches (clockwise vs anticlockwise bowls), because pale drags carry direction.
   - Warp by (u, v). Cross-dissolve, or graph-cut where ghosting appears.
   - Joins come from overlap exemplars, or for a fill letter from the **whole-letter exemplars via guided synthesis** (§3.2).
   - Output a τ-map per letter (prebaked WebP or AVIF, ~2× DPR), or indices for runtime WebGL2.
5. **Render:**
   - colour = KM(τ, pigment K/S, parchment(x));
   - convolve the edge with the page's PSF;
   - optional losses, from the vermilion exemplars' own flakes;
   - **no lighting.**
6. **Gate:**
   - Run `measure2.py` on our render at matched px/mm. All §1.2 numbers should fall within ±25%.
   - Run a **two-alternative forced-choice test**, RealBrush-style: pairs of a Met crop against ours, both resampled to the same px/mm and the same JPEG, randomly flipped. Target ≈ 50–55% correct. Also a 400% pair against the user's own scanned whole letters.

Risks:
- Library coverage and repeats (see §3.1). Capture at least 2 instances per stroke class.
- Scanner lamp direction shows up as fake relief once an exemplar is rotated. Scan at 0° and 180° (§6.2).
- Effort: one afternoon of painting, plus a scanner.

**Option B: whole letters plus guided synthesis (§3.2).** Synthesize new letters from the 12–16 whole letters of §6.2. It combines with A: A for strokes, B for joins and fills. Risks: seams on long uniform stems, and seconds of bake per letter.

**Option C: the measured-statistics fill (§3.3).** The fallback while the library is being made. It passes at 100% but looks like an enlarged scan at 400%. Ship it only if it passes §6.4.

**Option D: quilting from the Met scans.** Statistics and blind-test ground truth only.
- The scans are 8–10 px/mm and 4:2:0 JPEG, with fills crossed by penwork and no isolated stroke ends.
- Upsampled patches turn compression and sensor noise into "texture". The fine white flecks in `playground/materials/paint/lapis-sheet.webp` are plausibly this [U, inference].
- It cannot pass the 400% gate.

### 6.2 What to ask the user to paint and photograph

**Materials (as close to the real thing as is practical):**
- **Substrate:** a real parchment or vellum offcut, calfskin or goat, sized/pounced, ≥ A5. Fallback: hot-press watercolour paper. Its tooth is wrong, so mark the library as "paper" and don't mix the two.
- **Blue:** genuine lapis ultramarine in gum arabic, at 2 grades if possible (fine/pale and coarse/deep). Second choice: azurite. Last resort: ultramarine gouache, marked as such.
- **Red:** vermilion (or cadmium-free vermilion hue gouache) in gum arabic.
- **Optionally:** glair-tempered versions of a few strokes, to see whether the sheen differs.
- **Brushes:** a sable or squirrel round, size 0–2, with a good point (the miniver analogue), plus a fine dip pen for outlines.

**Scale.** Paint at true size. Letters 20–35 mm tall, stems 2–4 mm wide, like the Met O. The brush physics only transfers at the real scale.

**The set, per colour (blue and red):**

| Class | What | Count |
|---|---|---|
| Bowl crescents | Swelling curved strokes, thick in the middle, thin at both ends, ~90–180° of arc. Both clockwise and anticlockwise, 3 widths (2, 3, 4 mm). | 12 |
| Stems | Straight verticals with slight swell, 3 widths, painted top-down; 2 bottom-up | 8 |
| Diagonals and hairline tapers | Thin to thick and back, e.g. the tail of a Q, the arm of a K | 6 |
| Ball terminals / dabs | Round blobs 2–4 mm | 6 |
| Fills inside a pen outline | Draw a bowl contour with the pen first, then fill it with the brush. This is the real Lombardic method, and gives contour and fill together. | 8 |
| Overlaps and joins | Stem meeting bowl, one painted over the other while wet and while dry; note which went on top | 8 |
| Flat swatches | 15 × 15 mm of full coverage, 2 grades | 2 |
| **Whole Lombardic letters** | e.g. A, C, D, E, M, O, P, S (some in red) | 6–8 |

That gives **~50 strokes plus 6–8 letters per colour; ≈ 115 marks in total.** Lay them out with ≥ 10 mm between marks, number them in pencil, and photograph the sheet before scanning as a record.

**Capture:**
- Flatbed scanner, **1200 dpi**, **48-bit** (16 bits per channel).
- Every auto-correction, sharpening and descreening **off**. Save as TIFF.
- Include a grey card or a ColorChecker strip, plus a **blank region of the same substrate**.
- Scan each sheet **twice, rotated 180°**. A flatbed's single-sided lamp gives a weak directional relief; comparing the two scans measures it, and averaging cancels it.
- **Optional raking set**, only if we want a raking-light mode: a camera on a copy stand with one light at ~15–20° elevation from 4 azimuths (N, E, S, W). That is enough for photometric-stereo normals [U].
- The parchment will cockle. Weight its edges, or scan under glass only if no glare appears.

**Why these classes.** The matcher needs exemplars that resemble the query in turning angle, width and place along the stroke [F]. Lombardic letters use only a few stroke types. The outline-then-fill class records the true Lombardic edge: a drawn line with paint brought up to it.

### 6.3 What to avoid (software-style approaches)

- **Stamp-and-grain brushes** (Krita, Procreate, Photoshop, Ciallo-style stamp strokes): fixed spacing, one repeated tip, canvas-anchored greyscale grain, alpha compositing (§4.5).
- **Bristle simulation for the look** (Strassmann, pie-site `brush.js`, Fluid Paint bristles, WetBrush): it adds hair tracks the reference doesn't show, and aliases at our scale.
- **Height field + specular "thick paint"** (Hertzmann 2002, Painter impasto, Rebelle RealShader, Fluid Paint's GGX at roughness 0.075, ArtRage): it reads as wet oil. Tempera on parchment in the reference shows no relief under copy lighting.
- **Image-to-painting filters** (pie-site paint pass, structure-tensor daubs, neural stylizers): uniform daubs everywhere, a filter's signature.
- **Fluid simulation** (Curtis, MoXi, Rebelle watercolour, Fresco watercolour): it models flow that gum tempera on sized parchment doesn't have.
- **Symmetric noise anything** (value noise, fBm, `feTurbulence` overlays): the wrong distribution, darker than full coverage is impossible.
- **RGB or alpha mixing of paint over parchment.** Use KM over the substrate.
- **Mixbox in the shipped library:** CC BY-NC. Use spectral.js (MIT) or our own KM.

### 6.4 Definition of done

Every condition must hold, judged by the user, not by a self-score (illum-taste):
1. The §1.2 statistics of our render are within ±25% of the Met letters at 8 px/mm.
2. A blind 2AFC against Met crops at 100% scores ≤ 55% correct over ≥ 40 pairs.
3. At 400%, a blind 2AFC against the user's own scanned whole letters scores ≤ 60%.
4. No exemplar repeats on one page. The draw animation reveals strokes along u.
5. Light never moves the paint. Only gold responds to the reader.

---

## 7. Not consulted, and unverified

Unverified [U]: paint film thickness; gum sheen roughness; brush habits of Lombardic fillers; ArtRage internals; learning-based painters; VFX and audio emulation practice; photometric-stereo set-up. Not consulted: the Getty manuscript-technique pages; de Hamel, *Scribes and Illuminators* (1992); Alexander, *Medieval Illuminators and Their Methods of Work* (1992); the MINIARE publications. Higher-resolution open scans (Digital Walters, e-codices) have not been checked for resolution, so they are not recommended here.
