# 21 — Paint, physically: what we built for weathered Insular tempera, and how it compares

A synthesis of three research tracks (session scratchpad `paintres/`: `physics.md`, `practice.md`, `weathering.md`) and of
the bench built on them: `playground/tests/insular-paint.html` with `km-paint.js` (paint), `km-age.js` (weathering),
`km-bench.js` (subjects) and `km-smoke.js` (the control). Target: Lindisfarne f. 139r (BL photograph, 12.25 px/mm).

## What we build, and why

The user's verdict on every earlier pass: "none of this feels even a little like paint." The three reports agree on why:
the old engine (`kit/medium.js`) is an absorption-only ink renderer (`paper·exp(−K·d)`), so thin paint is only paler,
nothing scatters, the skin never shows through *in the paint's colour*, and every variation was noise laid on top. The
rule taken from all three: **every visible variation is the consequence of a state** (thickness, pigment, the skin, the
hand, time), never a texture or a sprinkle.

1. **Two-constant Kubelka–Munk over the parchment** (physics §3.1, §9.1). Per band, a layer of thickness d over what lies
   beneath:
   `a = 1 + K/S, b = √(a²−1), x = b·S·d; R = sinh x / (a sinh x + b cosh x), T = b / (a sinh x + b cosh x);`
   `R_tot = R + T²·R_below / (1 − R·R_below)`, bottom up from the parchment's reflectance; ink and carbon black as
   absorbing layers (`R ·= exp(−2·OD·τ)`); the surface by Saunderson `R' = (1−k1)(1−k2)R/(1−k2R)`, k1 .04, k2 .5.
2. **Thickness from brush loads, not noise** (practice §2, §5.1). A fill is a few loads following the stroke (a strand
   between crossings; a pocket of ground; a swath of a compartment along its axis or a band along its curve). Each load
   depletes along its length (`τ = t0(1 − dep·σ^1.5)`), its pressure varies slowly along it (1-D), overlapping loads lay
   a seam ~20 % heavier, now and then a pale drag runs in its second half. The practice report's numeric check showed this
   stack, composited by KM over the vellum, gives the measured one-sided light tail with no asymmetric noise term.
3. **Levelling against the skin** (physics §9.2): the wet film's top is flat over the skin's fine relief, so it lies
   thicker in hollows (`τ += min(1,τ)·dz/H`, dz the depth below the 0.6 mm mean, H 22 µm).
4. **The pen laid over time** (practice §5.3): ink per unit length ∝ 1/speed, the speed a minimum-jerk bell floored where
   the pen sets down and lifts and slowed in tight turns (v ∝ R^⅓), so lines pool at their ends and swell in turns without
   a special case; the strand's edge strokes stop where the strand goes under (pooling there); the ink runs down between
   dips. Carbon ink (Lindisfarne): no browning.
5. **Weathering as a function of those fields** (weathering §5): Paquette-lite cracks on a 0.05 mm grid — stress =
   brittleness × τ^1.2 × (1 + cockle crest), strength lower at the paint's edge and falling with age; cracks start at the
   worst flaw, run to extinction, meet earlier cracks square on (T-junctions), relax stress within D_r = 0.28 mm·τ (so
   thick paint breaks into few big islands, a wash below τc not at all); islands fall by detachment score until the
   pigment's budget × age is spent; a loss shows the vellum with ~12 % residual tint and whatever ran beneath (the pen
   line); orpiment crumbles one cell round its losses. Handling: one smooth field from the lower outer corner thins exposed
   paint (its own thick spots first) and soils the vellum; grime in the cockle's hollows and at every loss's step. Cracks
   render as area coverage (a quarter of a pixel at page size, a hairline at 400 %). `age = 0` changes nothing.

## Fitted pigments (f. 139r, white-balanced: vellum 201 189 152 → 241 232 213)

Fit (`paintv2/fit.py`, `uv run --with pillow --with numpy --with scipy python -I`): blur 1 px, five luma bins per region
= five thicknesses of one film over one vellum; least squares for K/S per band and one grey S·d (X), relative thicknesses
shared across bands. **The data says the films are translucent**: the error is flat up to X ≈ 0.3–0.6 and doubles by
X = 2 for every pigment (hiding films cannot produce the observed spread). X is therefore taken at the knee.

| pigment (region) | K/S (R, G, B) | X = S·d (median film) | median seen | masstone R∞ |
|---|---|---|---|---|
| knot blue-grey (indigo + chalk; bluish pixels of the bowl's knot) | 2.29, 2.16, 1.49 | 0.3 | 113 115 129 | 81 83 95 |
| blue (indigo, little chalk; the O's keys) | 4.04, 3.04, 1.57 | 0.3 | 76 93 129 | 66 73 93 |
| indigo (roundels) | 7.91, 8.0, 4.19 | 0.3 | 54 52 77 | 50 50 65 |
| red lead (the O's keys) | 0.50, 1.42, 2.52 | 0.6 | 172 102 67 | 130 96 79 |
| orpiment (the O's ring) | 0.29, 0.63, 1.68 | 0.6 | 189 151 96 | 147 122 91 |
| vergaut (the Q's counter) | 0.43, 0.25, 0.44 | 0.6 | 173 189 159 | 135 152 134 |
| carbon ink (a letter stroke) | OD 1.74, 2.57, 2.39 | absorbing | 37 17 19 | — |
| black (the dark ring) | OD 2.63, 4.10, 4.09 | absorbing | 16 4 4 | — |

Rms error 0.5–1.7 /255 except red lead (5.5–8: its region holds vellum hairlines). The joint fit with X free ran to the
lower bound (a dye) for red lead, orpiment and the knot — the thickness/masstone trade-off is weakly identified from one
region; a thin-over-vellum sample per pigment would pin it.

## The control (smoke and mirrors)

At the user's challenge, the bench carries a control on the same geometry: flat colours pulled to the master's medians,
alpha over, one slow swell per region, the tint a hair off register, paint short of the line, a few hand-placed losses at
stroke ends and edges, a faint warm falloff, one soft optic. No simulation.

## How it compares (bench at 12.25 px/mm, the master white-balanced; camera PSF .06 mm on ours for matched views)

- **Page size (1×, the scan's own sampling):** the physical and the control are close; neither reads as the master. What
  separates both from the master at this size is not the paint model but the object: the master's busy context, its
  scuffed, abraded strands, its irregular reserve bands and heavier wobbling pen, its warm uneven vellum. Physical edges
  over control on the dots (load-driven size variation and per-touch aim read as hand-placed) and the keys (vellum
  hairlines beside every line, rounded corners where the brush did not reach); the control's blur makes it read soft
  rather than painted.
- **4× (matched sampling ×4):** the physical shows seams and depletion along loads, the pen's pooling, the skin through
  thin paint; the control is flat and blurred. Neither shows the master's abrasion (whitish scuffs along the strands'
  tops) — a gap in the weathering model (abrasion here is only toward the hand's corner).
- **Native 4× (49 px/mm):** orpiment shows a fine pale crazing; red-lead dots crack once or twice each (BL: "crackle");
  at age 1 a few dots and strand edges flake to the vellum with crisp borders.

## Speed (CPU, JS, Chrome; one piece)

At page size on DPR 2 (~12 px/mm, 30–90 kpx): physical 190–310 ms per piece (loads 60–110, weathering 110–190, KM 7–13);
control 26–45 ms. At 49 px/mm (0.5–1.4 Mpx): physical 0.8–1.4 s. **Not within the 200 ms page budget on the CPU.** Plan:
- parchment fields per page, once (the follicle loop is ~30 % of "loads");
- weathering is resolution-free on its mm grid: bake per (piece, seed, age) once, cache; only the loss/crack raster is
  per resolution;
- WebGL2 for every per-pixel stage: strand fields (instanced segment quads writing distance and arc length with a depth
  test for over/under — the z-buffer is already the algorithm), load τ (a fragment pass per piece reading a small uniform
  table of loads), levelling (one separable blur), KM compose (~70 ALU/px, one pass), loss and crack raster (textures from
  the bake). Expected ≤10 ms per piece; a page's ornament well inside 200 ms with the bake cached.

## Rejected

Bristle hairs, noise-in-mask, anisotropic brush-mark noise (it read as streaky noise), watercolour rims and blooms,
Voronoi crack textures (Y-junctions), random fissures, grunge masks, Mixbox (CC BY-NC), single-constant KM (no hiding),
fluid sims for paint, follicles as visible dots (kept faint, sub-visible at 1×), grime in follicle pits (it read as dots).

## The hand in the geometry (second pass, after the user's verdict)

User: "The dots look good, the knot still reads digital to me as does the gold and the grid." Decision: cheap paint at page
size (`km-smoke.js`: the loads and pen composed by KM over a flat vellum, losses placed by hand, a warm falloff, one soft
optic; ~25–65 ms per piece) with the touch-dots and the vellum hairline kept; the full physical path behind `?paint=physical`.
The effort moved into the geometry, measured on f. 139r at the scan's sampling with `paintv2/measure.py` (pen lines as
luma valleys, ink-mass width; reserve as the pale run beside a line; tracked row to row) and the same tool on our renders
blurred to the camera (σ 1.1 px):

| | master keys | master ring rules | ours keys before | ours keys after | ours band after |
|---|---|---|---|---|---|
| line ink-mass width (mm) | .16–.18 | .15 | unresolved | .11 | .11 |
| width cv / wavelength | .25–.27 / .85–1.1 mm | .25 / .7 mm | — | .23 / .7 mm | .38 / 1.5 mm |
| centre wander sd / wavelength | .026–.030 mm / ~.9–1 mm | .029 / 1.2 mm | — | .022 / .9 mm | .037 (bow) |
| reserve where present (mm) | .26–.31, sd .07–.09 | .50, sd .20 | unresolved | .27, sd .08 | .28, sd .06 |
| reserve absent | 18–27 % | 65 % | — | 23 % | 84 % |
| line angle error sd | 4.0° (h) / 6.9° (v) | — | 0.5° | 4.1° | — |

(Unblurred, the before keys measure line .20 mm with cv .13, reserve .09 mm, angle sd 1.0°: even, thin and square.)
Causes: weight from pressure and nib angle along the stroke (1-D), pooling at turns, set-downs and lifts; construction points
off by the hand's aim (±.14 mm), the ruling bowing as a whole (.25 mm over 9 mm), each step its own size (±6 %); the reserve
the brush's distance from the line, absent where the brush ran up to it; the band's rules each bowing (.17 mm over 5.5 mm),
its fill in ~8 mm loads whose stops are bowed chords with a pool; the knot's cords each a little wider or narrower (±9 %),
strand tops rubbed thin (broken, more on over-crossings and the outer loops), a dark red-brown ground (the master's median,
80 38 21) over a fine red knotwork that shows where the ground's load ran thin.

## The style (kit/styles/insular.js) and what ships

The page-size paint is the printer of every piece (kit/styles/insular-print.js), the pieces are the directions' Sheets
(kit/styles/insular-pieces.js on insular-knot.js), the paint's core is kit/styles/insular-paint.js; the bench's
physical-paint tools (parchment, levelling, strand fields, weathering) stay in tests/ (km-paint.js, km-age.js).

- **Making (?draw).** The geometry records beside its inks a clock (each cord in turn along its length) and the rubbing
  of each strand's raised middle; the printer writes knots by that clock, the pen first where an ink is thin, each colour
  pocket by pocket from where its brush touched down, the broad black after the colours, the dots touch by touch, a long
  red line (Durrow's scroll) along its length. The last frame is the still.
- **Richness.** plain: initials, paraphs, plain frames (rules and corners); modest: heading run-outs, pull-quote bands;
  usual; fine: knots closer and roundels in the drop, rank-1 breaks in rank-2 form, frames with knots on all sides;
  lavish: dot rows round the drop, pull-quote bands of knotwork, the aside framed, the figure's margin band, two rows of
  dots on frames.
- **Bytes** (uncompressed): insular.js 18 KB, insular-pieces.js 72 KB, insular-knot.js 28 KB, insular-paint.js 14 KB,
  insular-print.js 12 KB (≈144 KB; all lazy, loaded only when the style is used); the face, Illum Uncial Caps, 4 KB
  (Uncial Antiqua's A–Z, renamed as the OFL requires of a modified font with a Reserved Font Name).
- **Speed** (whole page's ornament, first visit, live; see the report for both kinds): ~350–450 ms at dpr 1, ~0.7–0.9 s at
  dpr 2, of which ~60 % is building the pieces' geometry (many Canvas2D fills, each knocking every other ink, then
  reading each ink back) and ~40 % the paint. The site bakes first visits (tools/bake.mjs), so live speed matters for
  unbaked settings. Done: frames built as four strips, compose only where there is ink, sRGB by table, pieces kept by
  what they are (kind, letter, size, seed). Not done: the WebGL2 port of the per-pixel paint (brush loads, compose,
  growth clock) — the plan above stands; with it, and the Sheet's knock-outs deferred to one pass per ink, the
  estimate is ≤200 ms at dpr 2.
