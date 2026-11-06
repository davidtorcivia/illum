# 07 — Gold: gilding that holds up over large areas

**Why our large gold looks digital, what real gold grounds measure, and a pipeline (Canvas2D still, WebGL2 lit) with numbers taken from those measurements.**

Research date: 2026-11-06. Citation tags follow 05-the-bar:

- `[fetched]`: the page was fetched on 2026-11-06 and checked.
- `[search]`: the fact came only from a web-search summary.
- `[403]`: the page refused the fetch.
- `[unverified]`: background knowledge, not checked in this session.
- `[measured]`: computed by me from Met Open Access images (method in §1.1).

Reference crops are in `research/gold-refs/`. All four are Met Open Access images in the public domain:

| File | Object |
|---|---|
| `met-477838-raised-burnished-ground.webp` | raised, burnished manuscript ground |
| `met-437649-halo-punches-craquelure-bole.webp` | punched halo, fine craquelure, worn edge showing bole |
| `met-437290-panel-sky-incised-rays.webp` | panel gold with large crack cells, incised rays and angel wings |
| `met-466330-manuscript-tooled-gold.webp` | manuscript gold incised and punched with pomegranate patterns |

---

## 0. The answer in one paragraph

Real gold over a large area is **not a texture. It is a mirror bent over a cushion.**

Measured over an intact burnished ground (Met 477838):
- The interior is almost flat: L ≈ 0.78, std 0.037.
- Most of the variation is **tied to the geometry**:
  - broad, soft, warm-olive dark sweeps where the gesso cushion slopes away from the lights;
  - bright margins where it slopes toward them;
  - an ink outline.
- What remains is sparse and **darker** than the field: scratches, specks, cracks and punches. Its high-pass skew is −0.3 to −1.5.
- Colour runs along a measured ramp. Hue rotates from h≈72 (dark) through 85 (body) to 95–100 (near-white highlight). Chroma peaks at about 0.105 and *falls* in the highlights.

Our `paintField` metal branch does the opposite: a stationary, symmetric, isotropic texture at 3–9 px, hue fixed at 83°, nothing darker than about L 0.55, and chroma rising to 0.137 in the highlights (§3).

The fix is to stop painting gold:
1. Bake a **height field**: a cushion over the distance field, gesso waves, then tooling.
2. **Light it**:
   - once, with a fixed copy-stand environment, for the still;
   - per frame in WebGL2, with a reader-driven light.
3. Look the result up in a **measured colour ramp**.

The small shell-gold ivy that works stays as it is. Historically that *is* painted gold, and §3 explains why the same code fails at 100 px.

---

## 1. Findings from real objects

### 1.1 Objects and method

All objects come from the Met Collection API. Search used `v1.1/search` (the v1 endpoint was retired on 2026-10-01). Metadata and `primaryImage` came from `v1/objects/{id}`, and all objects are `isPublicDomain: true`.

| ID | Object | Date | Medium | Crop measured (px in original) |
|---|---|---|---|---|
| [477838](https://www.metmuseum.org/art/collection/search/477838) | Niccolò di Giacomo da Bologna, *Martyrdom of St Stephen* in an initial | c. 1394–1402 | tempera, gold, ink on parchment | whole ground (430,455)–(2030,2190); patches (1842,510)–(1991,660) and (448,1868)–(648,2118) |
| [466330](https://www.metmuseum.org/art/collection/search/466330) | Don Silvestro de' Gherarducci, *Birth of the Virgin* in an initial | c. 1375 | tempera, ink, gold on parchment | tooled ceiling (1636,412)–(2136,621) |
| [463605](https://www.metmuseum.org/art/collection/search/463605) | Girolamo dai Libri, *Singing Monks* in an initial D | 1501–2 | tempera, ink, gold on parchment | ground (180,972)–(361,1458) |
| [466757](https://www.metmuseum.org/art/collection/search/466757) | Initial A from a Gradual | 2nd q. 15th c. | tempera, ink, metal leaf | looked at only |
| [468975](https://www.metmuseum.org/art/collection/search/468975), [466773](https://www.metmuseum.org/art/collection/search/466773) | antiphonary and psalter leaves | c. 1400, early 15th c. | tempera, ink, gold | looked at only (gold too small to measure) |
| [437742](https://www.metmuseum.org/art/collection/search/437742) | Valencian, *St Michael and the Dragon* | c. 1405 | tempera on wood, gold ground | (389,1000)–(619,1600); bole in (120,150)–(700,900) |
| [437290](https://www.metmuseum.org/art/collection/search/437290) | Pietro di Domenico da Montepulciano, *Madonna and Child with Angels* | 1420 | tempera on wood, gold ground | sky (460,320)–(1228,520 or 680) |
| [459134](https://www.metmuseum.org/art/collection/search/459134) | Lippo Memmi, *Madonna and Child* | c. 1340 | tempera on wood, gold ground | gable (882,1190)–(1032,1440) |
| [437649](https://www.metmuseum.org/art/collection/search/437649) | Segna di Buonaventura, *Christ Blessing* | c. 1311 | tempera on wood, gold ground | halo (465,1071)–(595,1671); bole strip (365,971)–(425,1749) |
| [436908](https://www.metmuseum.org/art/collection/search/436908) | Pietro Lorenzetti, *St Catherine of Alexandria* | c. 1342 | tempera on wood, gold ground | (160,587)–(304,979) |

**Method.**
- Pixels were converted sRGB → linear → OKLab/OKLCH (Björn Ottosson's matrices).
- The gold mask is a hue/chroma gate (C > 0.03, 50° < h < 120°, L > 0.2), with small components removed.
- Measurements:
  - per-octave L detail as differences of Gaussians;
  - radially averaged power-spectrum slope;
  - autocorrelation length;
  - structure-tensor coherence;
  - skew and kurtosis of the high-pass L;
  - L as a function of distance to the gold's edge and of the edge's outward normal.
- "At 100 px" means the image was resampled with Lanczos so that the gold ground is 100 px wide, which matches our initial.
- Scripts are in `research/gold-refs/tools/` (`ok.py` colour maths; `measure.py`, `ramp.py`, `edge.py`, `edgedir.py`, `at100.py`, `kurt.py`, `bole.py`; `synth.py` for §4.6). Run them as `uv run --with pillow --with numpy --with scipy python -I <script> <image dir or file> <crop box>` against a folder of downloaded Met originals; the crop boxes are in the table above. All photographs were taken under museum copy lighting, which matters a great deal (§1.6).

### 1.2 What the gold looks like, concretely

**477838**, raised burnished gold on a manuscript cutting. This is the reference for an initial ground.
- **The field.** The four spandrels between the black frame and the pink letter are a smooth, pale, slightly greenish-lemon gold. It is almost featureless in the middle, with a faint lumpy sheen like satin.
- **The dark sweeps.** Along the curve of the letter, and along parts of the frame, runs a **broad, soft, olive-brown band**. It is up to about 4% of the ground's width and is not uniform: it swells, thins and disappears. It is the mirror image of the dark part of the photographer's room, seen in the slope of the gesso cushion.
- **The edge.** At the very edge facing the light there is often a thin bright line, then the dark band inside it (bottom-right spandrel).
- **Fine detail.** Faint long hairline scratches run in several directions. There are a few leaf wrinkles and creases, and a handful of dark specks and paint debris.
- **Outline.** A black ink rule surrounds the whole ground.
- **What is absent.** There is no grain, no mottling and no bole showing.

**466330**, flat manuscript gold.
- The design is incised and punched: scrolling stems, pomegranates hatched in a lattice, and dot rosettes.
- **The tooled lines read *lighter* than the field.** Under diffuse light, their walls catch light that the flat mirror sends elsewhere.
- The field itself is a single soft gradient from L 0.55 to 0.74 across 500 px.

**463605**:
- A gold ground flecked all over with orange-red at about 1–3 px. 50% of its L variance sits at 1 px, and its autocorrelation length is 3 px.
- Whether the flecks are abraded leaf over bole or a sprinkled red, **this is the one object that looks like our current digital gold.** It reads as *painted*, not as metal.

**437742**, a Valencian panel:
- A network of mostly horizontal cracks: primary cracks run along the wood grain and secondary cracks cross them at near-right angles.
- Wear spots where **red-brown bole** shows through, in patches and along cracks, not only at the edges.
- Punched dot-line arabesques.
- Its high-pass detail is dense and nearly Gaussian (kurtosis about 0.8). Panels with heavy craquelure are the exception to the "sparse detail" rule.

**437290**: large crack cells (2–5% of panel width), incised star-rays, angel wings drawn in incised and punched lines, a halo ringed by large punches; a fairly even bright gold under diffuse light.

**437649**:
- A halo ringed by about 20 px punches at about 38 px pitch, in a 2438-px image. That is about 1.4% and 2.7% of the halo's diameter (by eye).
- Each punch shows a bright spot on one side and a dark crescent on the other, like a tiny convex/concave mirror.
- Fine craquelure, with cells of about 10–20 px (0.4–0.8% of image width).
- A wide worn margin showing bole.

**459134**: an engraved gable with rows of punched rosettes and leaves, and incised parallel borders. The tooled bands carry much of the "glitter" in a flat photograph.

**436908**: brilliant lemon gold (median L 0.88, C 0.137, h 96), the most saturated in the set; possibly regilded or a warmer photograph `[unverified]`. Treat it as the upper bound, not the target.

### 1.3 Colour `[measured]`

L, C and h are OKLCH. `p` gives percentiles of L.

| Object | L p1 / p5 / p25 / p50 / p75 / p95 / p99.5 | C median | h median | L std |
|---|---|---|---|---|
| 477838 ground | .30 / .39 / .57 / **.69** / .78 / .84 / .87 | .094 | 85 | .139 |
| 477838 interior patch | .57 / .65 / .76 / .79 / .81 / .83 / .85 | .123 | 86 | .053 |
| 466330 tooled | .54 / .56 / .60 / .65 / .69 / .72 / .74 | .100 | 79 | .051 |
| 437742 panel | .34 / .47 / .63 / .74 / .81 / .90 / .95 | .098 | 79 | .131 |
| 437290 sky | .56 / .64 / .74 / .78 / .82 / .88 / .93 | .114 | 83 | .071 |
| 459134 gable | .53 / .64 / .73 / .75 / .77 / .80 / .86 | .122 | 86 | .052 |
| 437649 halo | .49 / .55 / .64 / .70 / .75 / .80 / .84 | .102 | 70 | .074 |
| 436908 | .68 / .77 / .84 / .88 / .91 / .93 / .95 | .137 | 96 | .055 |

**The ramp.** Binning the gold of 477838 by lightness gives one curve, and 437290 and 437742 agree within a few degrees. That curve is the colour of gold as a function of how much light it reflects:

| L band | share of 477838 | C | h | linear RGB | g/r | b/r |
|---|---|---|---|---|---|---|
| 0.20–0.35 | 3% | .047 | 74 | .048 .025 .006 | .52 | .13 |
| 0.35–0.45 | 6% | .067 | 81 | .108 .061 .012 | .56 | .11 |
| 0.45–0.55 | 12% | .079 | 84 | .203 .119 .026 | .59 | .13 |
| 0.55–0.65 | 22% | .086 | 84 | .327 .199 .052 | .61 | .16 |
| 0.65–0.75 | 22% | .104 | 85 | .517 .326 .077 | .63 | .15 |
| 0.75–0.82 | 24% | .106 | 86 | .687 .460 .129 | .67 | .19 |
| 0.82–0.88 | 12% | .105 | 87 | .816 .570 .187 | .70 | .23 |
| 0.88–0.95 | 0.3% | .088 | 87 (437290: 88–102) | .900 .682 .305 | .76 | .34 |

Four observations follow from this table.

1. **The brightest gold carries gold's F0.** Filament lists gold's F0 as sRGB (1.00, 0.85, 0.57) `[fetched]`. In linear light that is **(1.00, 0.69, 0.28)**, which agrees with the brief's (1.0, 0.71, 0.29). The 0.82–0.88 band measures g/r 0.70, b/r 0.23.
2. **The darks are about F0².** F0² = (1, 0.48, 0.08), and the measured dark bands have g/r 0.52–0.56, b/r 0.11–0.13. Light that reaches a dark region has been reflected more than once by gold (micro-cavities, the cushion's own concavity, a gilt surround) or is filtered by thin or porous leaf over bole. That explanation is mine `[unverified]`, but the numbers fit. An empirical model that fits every row is **colour ≈ E · F0^p**, with p ≈ 1.8 in the darks, ≈ 1.0 at L 0.85, and ≈ 0.8 near clipping.
3. **Hue rotates with lightness:** 72–74° → 84–86° → 87–102°. Dark gold is a warm brown-olive, about `#3d2a10` to `#60491f`. Low chroma at h ≈ 80 is what the eye calls "olive". The highlights go lemon and then white.
4. **Chroma is modest and caps at about 0.11.** It is lowest in the darks (0.05), flat from L 0.65 to 0.88 (0.104–0.106), and lower again at the top (0.088). Only 436908 exceeds 0.13. **Gold never gets more saturated as it gets brighter.**

**Bole.** Exposed bole measured the same on two panels (437649 left margin; 437742 wear): **L 0.49, C 0.087, h 52**, linear (0.25, 0.085, 0.03), sRGB ≈ `#87512f`. That is browner and less saturated than `PIGMENTS.bole` (168, 84, 52), which is L 0.54, C 0.12, h 41.

### 1.4 Spatial structure `[measured]`

**The spectrum is Brownian, the structure is not.**
- On raised, burnished gold the radially averaged power spectrum has slope −2.0 to −2.2 (477838: −2.03, −2.15, −2.20; 459134: −2.2). Craquelured panels are flatter (−1.3 to −1.4), because the cracks are 1-px lines.
- With the ground resampled to 100 px, the L detail per octave is nearly constant:

| at 100 px | σ0.5 | σ1 | σ2 | σ4 | σ8 | σ16 | rest | total |
|---|---|---|---|---|---|---|---|---|
| 477838 | .012 | .024 | .026 | .028 | .026 | .031 | .030 | .115 |
| 437290 | .017 | .033 | .029 | .028 | .031 | .023 | .012 | .117 |
| 437742 | .013 | .021 | .020 | .026 | .029 | .027 | .025 | .102 |

So there is **about 0.025–0.03 L per octave, every octave**. A *stationary noise* with this spectrum would still look wrong, because:

- **The energy is anchored, not spread.**
  - Inside 477838, more than 96 px (6% W) from any edge, L is 0.783 with **std 0.037**. Most of the ground's 0.115 std lives near edges.
  - L against distance to the edge runs:

    | distance from edge | L |
    |---|---|
    | 0–2 px (ink and burr) | 0.47 |
    | 4–48 px | 0.64–0.66 |
    | 64–96 px | 0.74 |
    | > 96 px | 0.78–0.80 |

    That is about 0.25–4% W of "slope zone", then a flat plateau.
- **The low frequencies are big but lumpy.** Low-passed at σ = 3% W, L still spans 0.52–0.80 (p5–p95) on 477838 and 0.42–0.68 on 437742. These are soft sweeps that follow the relief, never a straight ramp.
- **Fine detail is sparse and dark.**
  - High-pass L skew is **negative on every object**: −0.26 to −1.54. Scratches, cracks, specks and incisions are darker than the field.
  - Kurtosis is 1.2–4.4 on manuscript and gable gold (sparse features on a smooth field) and 9–11 on 436908 (rare specks). It is near Gaussian (0.1–0.8) only on the densely craquelured panels.
  - Symmetric grain has skew 0 by construction.
- **Anisotropy is weak.** Median structure-tensor coherence is 0.05–0.27 on manuscript gold and up to 0.39 where incised rays or cracks align. Burnishing does not leave visible streaks in a photograph, so **the anisotropy belongs in the specular lobe, not in the albedo.**
- **Correlation length.** It is 14–60 px on the 1600-px manuscript ground (about 1–4% W) and 2–6 px on craquelured panels.

### 1.5 Edges, and which way they face `[measured]`

For 477838, I took the band 3–48 px inside the gold edge and sorted it by the edge's outward normal (0° = right, 90° = down):

| outward normal | 0° | 45° | 90° | 135° | 180° | 225° | 270° | 315° |
|---|---|---|---|---|---|---|---|---|
| mean L | **.75** | .58 | **.54** | .60 | **.81** | .64 | .63 | .61 |

- Edges that slope toward the left or right are bright; edges that slope up or down are dark. That is the signature of a **copy stand with two lights at about 45° left and right**, seen in a domed mirror.
- **The rim is directional.** Uniform rim darkening (ours: `−.16·rim0` all round) is wrong. Real rims are bright on two sides and dark on two, with a 0.25 L difference.
- **Every manuscript ground has an ink outline**: black or dark brown, about 0.5–1% of the ground width on 477838's outer frame, thinner against the letter.
- **Gold and paint meet with a hard edge**, at the resolution of the photograph. Paint laps over the gold: the letter's pink is laid after the gold, and 477838 shows pink overlapping the gold by a hair.

### 1.6 What photography does to gold

The brief assumed that photographed burnished gold reads "dark, olive, brown with a few bright regions". **This set does not support that as a general rule.**
- Medians are L 0.65–0.80.
- The darks (more than 0.1 below the median) cover 6–29% of the area, and concentrate at edges and cracks.
- Near-white highlights (L > 0.88) cover less than 1%.
- The brownest median hue, 70° on 437649, is probably dirty varnish.

Museum copy photography uses large diffuse sources from two sides precisely so that gold does not go black. The flat interior reflects the room straight back to the camera. In a studio the room is grey, not black, so the field sits at L about 0.78, and only the slopes facing the dark ceiling and floor go olive.

The **single-light regime** is the one Cennini describes. The gold is burnished until it "becomes almost dark from its own brilliance", and "stamping amounts to making the gold lighter" `[fetched, Cennini: burnishing ch. CXXXVIII; stamping in the chapter the source heads "CXI", probably a typo]`. In that regime a mirror reflects a dark church and blazes only where the candle sits.

**Design consequence:**
- **The still should copy the museum-photo look.** That is the image everyone has learned as "gilding": a bright field, directional olive sweeps, hard edges and tooling.
- **The lit WebGL2 mode may go Cennini-dark**, because there motion supplies the proof that it is metal.

### 1.7 Tooling, cracks, leaf, wear: sizes

- **Punches.**
  - Round punches on halos are about 1–1.5% of halo diameter, at a pitch of about 2.5–3%; on 437649 they are about 20 px at 38 px pitch.
  - Rosette punches (459134) are about 0.6% of panel width.
  - The punches carry the sparkle in a flat photo.
- **Incisions** are 2–3 px wide in a 3746-px image (466330), or about 0.06% W. Under diffuse light they read lighter; under a single raking light they read as a dark/bright pair.
- **Craquelure.**
  - Coarse: 2–5% of panel width (437290).
  - Fine: 0.4–0.8% (437649).
  - Primary cracks follow the wood grain, and secondaries cross at near-right angles (437742).
  - Cracks read as dark 1-px lines with bole colour inside.
  - Manuscripts on parchment show only occasional fine cracks in the raised gesso (477838).
- **Leaf seams.** Panels were gilded in leaf squares about 8 cm on a side, with an overlap that is consistent within a workshop (*Heritage Science* 2019, doi 10.1186/s40494-019-0271-0) `[search; 403]`. A manuscript initial is usually smaller than one leaf, so **no seams on initials.** On panels, seams are faint straight lines at a fixed pitch.
- **Wear** exposes bole:
  - at edges and high points (437649 margin);
  - along cracks (437742);
  - as a fine speckle where leaf is thin (463605).

  It is never random holes in the middle of an intact burnish.

---

## 2. Physics

### 2.1 Materials

- **Water-gilded leaf on gesso and bole.**
  - Leaf is "metal hammered into tissue-thin sheets". Bole is a red earth "usually mixed with gypsum", applied in "several layers … to create the illusion of thick gold", and the leaf is "generally polished to produce a brilliant burnished surface" `[fetched, Fitzwilliam]`.
  - On raised manuscript gold, 3–5 layers of leaf are laid on a gesso dome and burnished with a dog's tooth or agate. The relief "enables the gold to catch light coming from every direction", and large raised burnished areas are the hardest to execute `[search, Gilding101/Renart; 403]`.
  - Cennini burnishes "first in one direction, then, holding the stone quite flat, in the other direction". If the gold "is not as even as a mirror", he lays more gold and burnishes again `[fetched]`. So the target is a **mirror**, and the micro-texture is two crossed strokes, below visibility.
- **Shell gold.** This is "powdered metal mixed with glue … applied like paint" `[fetched, Fitzwilliam]`. It is granular, with a broad sparkly lobe and no mirror. RTI of the St Andrews cutting shows that shell gold "seems to lie lower than the pigment and was seemingly painted first", and that it wears to show "the base red ocher" `[fetched, St Andrews]`. **Our current code is a decent shell-gold model.** It belongs on sprays, ivy, hairlines and highlights, which is where the user likes it.
- **Mosaic gold** (aurum musivum) is tin(IV) sulfide, a yellow scaly powder used as a cheap gold-look paint. It is listed by the Fitzwilliam alongside brass powder and tin `[fetched]`. It is not a metal, so it renders as a granular warm-yellow paint with a weak sheen. We probably do not need it.

### 2.2 A mirror is the colour of what it reflects

- Metals have **no diffuse term**. Their specular is tinted by F0: base colour × metallic = F0, and diffuse = (1 − metallic) × base = 0 `[fetched, Filament]`.
- Gold F0:
  - linear ≈ (1.00, 0.69, 0.28) from Filament's sRGB (1.00, 0.85, 0.57) `[fetched]`;
  - glTF spec-gloss examples use (1.0, 0.766, 0.336) `[search]`.

  The spread between sources is smaller than the spread between photographs.
- **Fresnel is nearly irrelevant here.** Schlick's (1 − cos θ)⁵ is under 0.001 at the 40° slopes of a gesso cushion. Gold only goes white toward grazing angles that a page seen face-on never shows. The whitening in our highlights comes from exposure and multiple reflection (§1.3), so it belongs in the **ramp**, not in a Fresnel term.
- **So the look is set by the environment.** A flat burnished area seen face-on reflects whatever is straight in front of it: the viewer, the room, the camera. That is "dark until the light finds it". Every gold-ground painting relied on this: in a dim chapel the gold is dark and blazes where the candle sits.
- An environment indexed by the reflected direction is a **matcap / lit sphere**: cheap, and it carries the whole look `[search, clicktorelease]`. Ours is a function, not a texture: a dim room, two copy-stand softboxes for the still, and the reader's light for the lit mode.

### 2.3 Relief: why domes, edges and punches catch light

A normal map comes from the height field by finite differences: n = normalize(−∂h/∂x, −∂h/∂y, 1), with h in the same px units as x.

- **The cushion.** A gesso dome is flat on top and rolls off at its edge over a few percent of its width. The roll-off sweeps the reflected vector through 30–60°. Across that band the mirror shows first the bright softbox and then the dark ceiling, hence the directional bright/olive rim of §1.5. **That band is the gold's whole "drawing".**
- **Spectrum arithmetic.** Shading responds to slope, the derivative of height. A height field with octave amplitude ∝ cell size (fbm gain 0.5, the usual) therefore gives **equal L detail per octave**, which is the measured −2 spectral slope. Lighting a standard fbm height field reproduces the measured spectrum. Painting fbm straight into albedo does not: it gives an f⁻² amplitude spectrum, which looks blotchy at the bottom and silent at the top.
- **Punches and incisions** are tiny concave mirrors with steep walls. Under diffuse light their walls catch light the flat mirror misses, which is why tooled gold reads *lighter* (466330; Cennini: stamping "makes the gold lighter", "a great deal in the reliefs", none "in the folds and in the shadows" `[fetched]`). Under a moving point light each dent glints as an individual star. That glint is how tooling looks alive.
- **Cracks** are V-grooves. They shadow themselves, show bole, and cup the islands between them. Cupping is visible only in raking light.

### 2.4 What RTI shows

Reflectance transformation imaging photographs an object under dozens of light directions from a dome, fits a per-pixel reflectance model and relights it interactively.
- For gilded manuscripts the reports agree that "the glittering gold that changes with the angle of light is the first thing that leaps out", and that RTI exposes where gold "is diminishing and where the base red ocher shows" `[fetched, St Andrews]`.
- An RTI capture of a Cincinnati vellum prayer book showed the gilding "raised from the surface of the parchment", consistent with gesso `[search, UCL/Cincinnati video]`.
- Gold-foil BRDF measurements find Cook–Torrance adequate, with a sharp specular peak and, in some samples, two specular peaks from the layered structure `[search, CVCS 2022, PDF too large to fetch]`.
- The low-order fits RTI viewers use (PTM, HSH) smear specular peaks `[unverified]`.

**Implication.** Our WebGL2 mode is *an RTI viewer for an object that does not exist*, and since we have the true height field we can afford a sharp lobe. As the light orbits:
- the cushion rim brightens on the side facing the light;
- the flat field flips from dark to bright in one broad flash when the light passes the mirror angle;
- punches glint individually;
- bole and cracks stay matte.

---

## 3. What reads as fake

Each tell is set against the measured value and against what `paintField` does now.

| # | Tell | Real (measured) | `paintField` metal branch now | Fix |
|---|---|---|---|---|
| 1 | **Stationary isotropic mottling** | interior std 0.037; variance anchored to edges | `mottle(u/9, v/3)·.6 + mottle(u/4, v/4)·.4` gives the same statistics everywhere, energy at 3–9 px | variation comes from *lit relief*: cushion + fbm height, never albedo noise |
| 2 | **Symmetric grain** | high-pass skew −0.3 to −1.5, kurtosis 1–4 | `tooth`/`tooth2` granulation, `fine` term: skew 0 | sparse *dark* features only: specks, cracks, tooling; no grain on leaf |
| 3 | **Linear or monotonic gradient** | low-pass spans 0.52–0.80, but in lumpy sweeps that follow the relief | (the earlier CSS attempt) | no gradient primitives; low frequency comes from the cushion and the top two fbm octaves |
| 4 | **No dark reflections** | p2 0.32, p10 0.47; 15–25% of area below L 0.55 | k ≥ 0.86 → L ≥ 0.63 inside, about 0.55 at the rim | the environment must contain dark; olive sweeps on slopes facing away |
| 5 | **Constant hue; chroma rising with light** | h 72→87→100; C peaks at 0.106 and falls to 0.088 | RGB × k keeps h = 83; hot-boost toward (190, 160, 60) lifts C to 0.137 | look up the measured ramp; whiten (never saturate) the top |
| 6 | **Too-saturated yellow (mustard)** | C ≤ 0.11 except one outlier | C up to 0.137 | cap C at 0.11; flat L 0.70 / C 0.10 / h 83 *alone* is "ochre paint" |
| 7 | **Uniform rim** | directional: L 0.54–0.81 by edge normal | `−.16·rim0` all round | the rim is the cushion's slope, lit by the environment |
| 8 | **Detail at the wrong scale** | at 100 px, scratches and leaf texture are sub-pixel | 0.6–3 px grain at any size | add features by element size (§4.4) |
| 9 | **Wear as random holes** | at edges, high points and cracks; bole L .49 C .087 h 52 | noise threshold anywhere | wear mask = edge distance × cushion height × noise; measured bole colour |
| 10 | **Banding in smooth sweeps** | — (photographs have sensor noise) | — | ±0.5/255 blue-noise dither after encoding |
| 11 | **Subtractive paint model for metal** | metal has no diffuse | `paper·exp(−K·d)` base | gold is not a pigment; no K-M for leaf |

The single strongest cue for "this is metal" in a still is **one material spanning L 0.3–0.9 in large, smooth, geometry-driven shapes, next to matte paint that spans 0.1 L.** No paint does that.

---

## 4. Recommended pipeline

### 4.1 Separation of concerns

```
generator (pure, seeded)  →  coverage M  +  relief H  +  cavity K  +  wear W     (CPU, worker; Float32, device px)
                          →  still:  light(M,H,K,W, copy-stand env)  → pixels      (Canvas2D putImageData, or bake)
                          →  lit:    same textures → WebGL2 quad, env(light)        (per frame, only while light moves)
```

The generator never knows how the result will be lit, and the light never generates anything. The same four fields feed the still, the lit mode and the print bake, so the light can move without anything changing shape, and a seed always gives the same gold (README: Memory).

### 4.2 Building the fields (per element, seed from content)

W is the element's gold width in device px. Every size below is a fraction of W, so a 100 px initial and a 400 px panel get the same *look* at their own scale.

1. **Coverage M.** This is the mask we already build. Keep its slight registration wobble at the paint boundary. Paint, the letter and the outline are drawn *over* the gold afterwards.
2. **Cushion** (raised gold only; flat panel gold has none):
   - `b(σ) = clamp((blur(M, σ) − 0.5) / 0.45, 0, 1)`
   - `dome(σ) = σ · b(2 − b)`
   - Mix two widths, σ₁ = 0.025 W and σ₂ = 0.07 W, by a low-frequency noise (cell W/2.5), and multiply by `1 + 0.45·noise(W/3)`. Then `H = 1.1 · amp · mix(dome(σ₁), dome(σ₂))`.

   A blurred mask, not a distance transform: a distance transform puts a sharp mitre ridge at every corner, which reads as a stamped brass plate. I tried it.
3. **Gesso waves.** Value-noise fbm *added to height*, cells and amplitudes:

   | cell | amplitude |
   |---|---|
   | W/1.5 | 0.015·cell |
   | W/3 | 0.012·cell |
   | W/6 | 0.006·cell |
   | W/12 | 0.003·cell |
   | W/24 | 0.0015·cell |

   Then blur H by 0.008 W. There must be no creases: gesso is poured and burnished.
4. **Cavity K** (darkening only, in reflectance, with a little of it subtracted from H). Add these by element size:
   - **rim burr:** `0.4·exp(−d / 1.2 px)`, the dark lip where leaf breaks over the gesso edge (the shader has no `d`, so bake it here);
   - **specks:** W²/8000 dots, 1–2 px;
   - **burnish striations:** only for W ≳ 400 px. They are short (1–5% W), nearly straight, tapered, in two crossing directions (60/40). Contrast is at most −0.01 to −0.02 L; my test at −0.03 to −0.08 already read as cross-hatching (§4.6);
   - **craquelure** (panels; rare on parchment): two-level Worley `F2 − F1` as in 02 §6.3. Coarse cells are 2–5% W along a grain direction, with secondaries orthogonal and fine cells 0.4–0.8% W. Width is 1 device px, K ≈ 0.25–0.4;
   - **incisions and punches** (W ≳ 250 px): dents of depth about 0.3 px along SDF offset curves. Punch Ø ≈ 1.2% and pitch ≈ 2.7% of the tooled figure (halo) diameter, with ±5% spacing and ±15% depth jitter (02 §6.2). They go in H, not K, so that the light finds them.
5. **Wear W** = `smoothstep(0.55, 0.75, noise(W/40)·0.6 + (1 − d/0.04W)·0.3 + highness·0.2)`, plus crack dilation. Use it sparingly: zero to 0.03 of the area on an "intact" setting.

### 4.3 The environment and the ramp

Use the reflected view vector r = 2(n·v)n − v, with v = (0, 0, 1), θ = acos r.z and φ = atan2(r.y, r.x).

**Still (copy stand):**
```
E = 0.66 + 0.30·exp(−((θ−38°)/22°)²)·cos²φ − 0.55·exp(−((θ−35°)/25°)²)·sin²φ − 0.6·K − 0.25·exp(−d/1.2px)
```
- The flat field gives E = 0.66 → L ≈ 0.75–0.78.
- Slopes facing left and right reach the softboxes (L 0.83–0.88).
- Slopes facing up and down reflect the dark ceiling and floor (L 0.35–0.5, olive).

For a deliberately asymmetric still, rotate φ by 15–30° and drop the right lobe to 0.7×. The light should come from the upper left, the usual book convention `[unverified]`.

**Lit (WebGL2):**
- The room drops to `E_room = 0.34 + 0.10·r.z + 0.06·fbm_lowest`, so the field is L ≈ 0.45–0.52 when unlit: Cennini's "almost dark", still unmistakably gold.
- The reader's light adds a lobe around the mirror direction of light ℓ: `E += 0.62·exp(−(Δt²/αt² + Δb²/αb²))`, where Δ = r − ℓ is projected on the burnish tangent t and bitangent b.
  - Burnished leaf: αt = 0.10, αb = 0.18. The lobe is stretched *across* the stroke, about 1.8:1, which matches the weak measured coherence. This is roughly GGX roughness 0.08–0.12.
  - Shell gold: α ≈ 0.4 isotropic, plus a per-grain glint threshold.
- **Area budget while lit:** 10–30% of the gold above L 0.85 at any time, and never more than 50%. Never let the whole field fall below L 0.40.

**Ramp** (linear RGB keyframes; E ∈ [0, 1] indexes them evenly). These are the measured 477838 values, rounded:

| E | 0 | 1/6 | 2/6 | 3/6 | 4/6 | 5/6 | 1 |
|---|---|---|---|---|---|---|---|
| OKLCH | .30 .048 72 | .42 .066 80 | .55 .082 84 | .68 .100 85 | .78 .106 86.5 | .86 .105 87.5 | .93 .090 95 |
| linear | .046 .023 .005 | .117 .066 .014 | .247 .154 .035 | .460 .293 .069 | .666 .450 .127 | .857 .612 .209 | .960 .807 .364 |
| sRGB | `#3d2a10` | `#60491f` | `#886d35` | `#b5934a` | `#d5b364` | `#eecd7e` | `#fae8a2` |

- The bole is `#87512f` (linear .242 .083 .028), modulated ±10% by noise.
- In dark mode, re-ink rather than invert. Keep the ramp, drop the room term by 0.08, and keep gold brighter than its surround (README: dark mode as re-inking).

### 4.4 What to add at which size

The thresholds use the gold width W in CSS px.

| W | Use | Fields |
|---|---|---|
| ≤ 24 | leaves, sprays, line-fillers, hairlines | **shell gold**: the current `paintField` is fine, with C capped at 0.11 and no hot-boost |
| 24–60 | bar borders, small initials | leaf: cushion (σ₁ only) + ink outline; no fbm, no cavity |
| 60–160 | **initial grounds** (the 100 px case) | cushion (both σ) + 2 top fbm octaves + ≤ 3 specks + ink outline 0.75–1 px; **no scratches, no punches, no grain** |
| 160–400 | gilded panels, frames, big grounds | + all 5 fbm octaves, incised border lines, punched rows, craquelure if "panel" |
| ≥ 400 | hero panels | + faint striations, leaf seams on panels (straight lines at a fixed pitch, overlap ridge about 0.3% W) |

**Spelled out for a 100 px initial ground (W = 100):**
- cushion σ₁ = 2.5 px and σ₂ = 7 px, dome height about 3–11 px (1.1 × σ × amplitude jitter), so slopes of 40–50° at the rim;
- post-blur 0.8 px;
- fbm only the two top cells, 67 px and 33 px, at height amplitudes 1.0 px and 0.4 px;
- ink outline 0.75–1 px;
- at most 3 specks;
- nothing else.

At 100 px, check the result against the measured statistics: band std 0.024–0.031 L per octave at σ = 1–16 px; L p2 ≈ 0.32–0.40, p10 ≈ 0.47–0.52, p50 ≈ 0.69–0.73, p90 ≈ 0.82–0.83, p99.5 ≤ 0.91; 15–20% of the area below L 0.55 and less than 2% above 0.88; C ≤ 0.11.

### 4.5 Canvas2D (static), and the still fallback

- Compute the four fields in a worker as Float32Arrays at DPR ≤ 2, then run §4.3 "still" per pixel. It costs about 25 flops per pixel with no texture lookups, which is under 2 ms for a 200×200 device-px initial.
- Write the result with `putImageData` into an OffscreenCanvas and draw it, as `paintField` already does.
- Draw over it, in order:
  1. the paint (the letter, which overlaps the gold by about 0.5 px);
  2. the ink outline;
  3. wear exposing bole.
- **The still fallback is this same image**, baked by the CLI to WebP for SSR, no-JS, reduced motion and print. It reads as gold without motion because it contains a 0.3–0.9 L range in one material, directional dark sweeps, a flat bright field, hard edges and, where size allows, tooling.
- Do not use CSS `linear-gradient`, `color-dodge` or `feTurbulence` stand-ins (tells 1, 3 and 6).

### 4.6 Validation: a synthetic ground against 477838

I built §4.2–4.3 in numpy (`research/gold-refs/tools/synth.py`): a square ground with a round letter body, lit by the copy-stand environment and passed through the ramp. Then I ran the same measurement scripts on it.

| metric | 477838 | synthetic |
|---|---|---|
| L p0.5 / 2 / 10 / 25 / 50 / 75 / 90 / 98 / 99.5 | .27 .32 .47 .57 .69 .78 .83 .86 .87 | .28 .40 .51 .63 .72 .78 .82 .89 .91 |
| band std at 100 px, σ1 … σ16, rest | .024 .026 .028 .026 .031 .030 | .027 .029 .029 .029 .023 .029 |
| edge L by normal, right/down/left/up | .75 / .54 / .81 / .63 | .79 / .61 / .69 / .63 |
| high-pass skew (σ2, interior patch) | −0.34 to −0.63 | −2.0 |
| interior std (d > 6% W) | 0.037 | 0.13 |

**What matched.** Seen next to the real ground at 100 px, the result reads as burnished gold, not texture. The spectrum, the L distribution, the directional rims and the colours line up.

**What did not:**
- **Isotropic fbm normals at full amplitude** gave crumpled foil. The fbm amplitudes in §4.2 are about half of my first try.
- A **distance-transform dome** gave mitred brass.
- **Grain in reflectance** gave sandpaper: the "uniform noise" tell, reproduced on purpose.
- **Hairlines**, even straight and tapered, read as hair or cross-hatching at the density that matched the real high-pass std. Real fine detail is denser and softer than any line set I tried, so keep it below visibility until W ≥ 400.
- My interior is too varied: 0.13 against 0.037. The cushion mix should flatten faster inside, which means raising the `b` threshold or lowering the low-octave fbm.

**Lesson.** Matching first-order statistics was necessary but not sufficient. Every failure was a *structure* failure: stationary, isotropic or ruled.

---

## 5. WebGL2 fragment shader (sketch, 70 lines)

This draws one quad per gold element. The textures come from the worker (§4.2): `uField` is RGBA32F or RGBA16F, with r = height in device px, g = cavity, b = wear, a = coverage. Render only while the light is moving, and otherwise leave the last frame.

```glsl
#version 300 es
precision highp float;
uniform sampler2D uField;   // r: height (device px), g: cavity 0..1, b: wear 0..1, a: coverage 0..1
uniform vec2  uTexel;       // 1 / texture size
uniform vec3  uLight;       // unit mirror direction the reader's light occupies (page space, z toward viewer)
uniform float uLit;         // 0 = still (copy stand), 1 = lit by reader; spring-eased between
uniform vec2  uBurnish;     // unit tangent of the burnishing stroke, per element (seeded)
uniform vec2  uAlpha;       // lobe widths along/across the stroke: (0.10, 0.18) leaf, (0.4, 0.4) shell
uniform vec3  uRamp[7];     // linear RGB keyframes (§4.3 table)
uniform vec3  uBole;        // linear (0.242, 0.083, 0.028)
in vec2 vUv;
out vec4 outColor;

vec3 ramp(float e) {
  e = clamp(e, 0.0, 1.0) * 6.0;
  int i = min(int(e), 5);
  return mix(uRamp[i], uRamp[i + 1], e - float(i));
}
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); } // dither noise
vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }

void main() {
  vec4 f = texture(uField, vUv);
  if (f.a <= 0.0) discard;
  // normal from the height field (height and texels share device-px units, so the gradient is the slope)
  float hl = texture(uField, vUv - vec2(uTexel.x, 0)).r, hr = texture(uField, vUv + vec2(uTexel.x, 0)).r;
  float hu = texture(uField, vUv - vec2(0, uTexel.y)).r, hd = texture(uField, vUv + vec2(0, uTexel.y)).r;
  vec3 n = normalize(vec3(-(hr - hl) * 0.5, -(hd - hu) * 0.5, 1.0));
  vec3 r = reflect(vec3(0, 0, -1), n);                  // view straight on; r = what the mirror shows
  float th = acos(clamp(r.z, -1.0, 1.0)), ph = atan(r.y, r.x + 1e-6);   // atan(0,0) is undefined in GLSL

  // the still: a copy stand (bright softboxes left/right, dark ceiling/floor) — the museum-photo look
  float c2 = cos(ph) * cos(ph);
  float still = 0.66 + 0.30 * exp(-pow((th - 0.66) / 0.38, 2.0)) * c2
                     - 0.55 * exp(-pow((th - 0.61) / 0.44, 2.0)) * (1.0 - c2);
  // lit: a dim room ("almost dark from its own brilliance") plus the reader's light as an anisotropic lobe
  vec3 t = vec3(uBurnish, 0), b = normalize(cross(n, t)); t = cross(b, n);
  vec3 d = r - uLight;
  float lobe = exp(-(pow(dot(d, t) / uAlpha.x, 2.0) + pow(dot(d, b) / uAlpha.y, 2.0)));
  float lit = 0.34 + 0.10 * r.z + 0.62 * lobe;
  float e = mix(still, lit, uLit);

  e -= 0.6 * f.g;                                       // cavities: specks, cracks, dents shadow themselves
  vec3 col = ramp(e);                                   // measured gold: hue rotates, chroma never rises at the top
  col = mix(col, uBole * (0.9 + 0.2 * ign(gl_FragCoord.xy * 0.37)), f.b); // wear shows the bole, matte

  vec3 s = toSRGB(clamp(col, 0.0, 1.0)) + (ign(gl_FragCoord.xy) - 0.5) / 255.0;  // dither: no banding in sweeps
  outColor = vec4(s * f.a, f.a);                        // premultiplied
}
```

Notes on driving it:
- **`uLight`** comes from the pointer over the element, as a direction on the hemisphere with elevation 25–60°. On mobile it comes from scroll position, or from `deviceorientation` after the iOS permission tap. Spring-ease it with critical damping and a 250–400 ms settle. `uLit` eases 0 → 1 on the first interaction and back to 0 after about 3 s of stillness, so the page rests in the photograph look.
- **Punches** need no extra code: they are dents in `r`, so the lobe finds each one separately as the light passes.
- **Texture format.** Upload `uField` as RGBA16F with NEAREST filtering. WebGL2 samples half floats without an extension (linear filtering would need `OES_texture_half_float_linear`), and nearest is what the finite differences want anyway.
- **Cost.** One RGBA16F texture and five fetches per pixel, about 0.1–0.2 ms for a 200² device-px initial. Do not regenerate fields per frame.
- **Reduced motion and print.** Use `uLit = 0`, or the baked still.

---

## 6. Sources

Met Open Access objects, fetched 2026-11-06 through `collectionapi.metmuseum.org/public/collection/v1/objects/{id}` (`isPublicDomain: true`); `primaryImage` downloaded `[fetched]`:
- 477838: https://www.metmuseum.org/art/collection/search/477838 (image `CRDImages/md/original/DP162199.jpg`)
- 466330: https://www.metmuseum.org/art/collection/search/466330 (`DT5270.jpg`)
- 463605: https://www.metmuseum.org/art/collection/search/463605 (`sf12-56-4s1.jpg`)
- 466757: https://www.metmuseum.org/art/collection/search/466757 (`temp2822550v.jpg`)
- 468975: https://www.metmuseum.org/art/collection/search/468975 (`DP158501.jpg`)
- 466773: https://www.metmuseum.org/art/collection/search/466773 (`DP158477.jpg`)
- 437742: https://www.metmuseum.org/art/collection/search/437742 (`DP-24152-001.jpg`)
- 437290: https://www.metmuseum.org/art/collection/search/437290 (`DP-19500-001.jpg`)
- 459134: https://www.metmuseum.org/art/collection/search/459134 (`LC-1975_1_010_001.jpg`)
- 437649: https://www.metmuseum.org/art/collection/search/437649 (`DP367962.jpg`)
- 436908: https://www.metmuseum.org/art/collection/search/436908 (`SF Lorenzetti.jpg`)
- API search: https://collectionapi.metmuseum.org/public/collection/v1.1/search (the v1 endpoint returned a retirement notice dated 2026-10-01) `[fetched]`

Texts, fetched 2026-11-06:
- Cennino Cennini, *Il libro dell'arte*, tr. Thompson, ch. CXXXV–CXL, burnishing and stamping: https://noteaccess.com/Texts/Cennini/6a.htm `[fetched]`
- Fitzwilliam Museum, *Illuminated: Painting with metals*: https://fitzmuseum.cam.ac.uk/illuminated/lab/overview-of-artists-techniques/painting-with-metals/type/technique `[fetched]`
- University of St Andrews, *The St Andrew manuscript cutting and RTI* (2022): https://university-collections.wp.st-andrews.ac.uk/2022/06/17/the-st-andrew-manuscript-cutting-and-reflectance-transformation-imaging-rti/ `[fetched]`
- Google Filament, *Physically Based Rendering in Filament* (metal F0 table, no diffuse for metals, multiscatter compensation): https://google.github.io/filament/Filament.md.html `[fetched]`

From search summaries only:
- *Heritage Science* 7 (2019), doi 10.1186/s40494-019-0271-0 (title and authors not seen; "MacLennan et al." `[unverified]`). Leaf squares about 8 cm, workshop-specific overlap `[search; 403]`
- CVCS 2022, BRDF of gilding gold foils (Cook–Torrance; double specular peaks): https://ceur-ws.org/Vol-3271/Paper11_CVCS2022.pdf `[search; file > 10 MB]`
- Renart, *Gilding 101* (raised gesso catches light from every direction; 3–5 layers; dog's tooth or agate): https://dragonslaire.antir.org/wordpress/wp-content/uploads/2019/08/Gilding101_Renart.pdf `[search; 403]`
- Natural Pigments, *Gilding on Illuminated Manuscripts*: https://www.naturalpigments.com/artist-materials/gilding-illuminated-manuscripts-historical-methods `[search; 403]`
- UCL / Public Library of Cincinnati, RTI video of a vellum prayer book (raised gilding): https://ucl.mediaspace.kaltura.com/media/RTI_VideoCapture_VellumPrayerBook_PublicLibraryOfCincinnati/1_6kc82sq8 `[search]`
- Khronos, KHR_materials_pbrSpecularGlossiness (gold specular 1.0, 0.766, 0.336 linear): https://kcoley.github.io/glTF/extensions/2.0/Khronos/KHR_materials_pbrSpecularGlossiness `[search]`
- Matcap / spherical environment mapping: https://clicktorelease.com/blog/creating-spherical-environment-mapping-shader `[search]`
- Thornton, "All that glitters is not gold" (gold-like surfaces, mosaic gold): https://resources.culturalheritage.org/osg-postprints/v03/thornton `[search]`
- Chermain et al., real-time glints on anisotropic grids (if shell-gold sparkle needs a model): https://arxiv.org/pdf/2306.05051 `[search]`

Background knowledge, not checked in this session:
- Schlick's Fresnel approximation.
- PTM/HSH fits smoothing specular peaks.
- Upper-left light as a book convention.
- The F0² interpretation of the dark-gold colour.

All `[unverified]`.
