# 24 · PIE: the potter, the rock and the smith

A rubricate style "inspired by Proto-Indo-European", for wekwos.com (*wekʷos*, "word"). Stage 1: research, the mediums,
the letters and three direction studies (tests/pie-directions.html, the pieces drawn by kit/styles/pie-*.js), a medium
bench (tests/pie-medium.html) and a mock of a real wekwos.com page (tests/pie-wekwos.html). The style waits for the
user's choice. Raw downloads, measurement scripts and screenshots are in the session scratchpad (pie/raw, pie/py,
pie/shots), not the repo.

**The honesty rule.** PIE had no writing, and nobody knows what its speakers drew. Nothing here is "PIE script" and no
glyph is invented. The theme rests on two real things: the material culture of the steppe and its Bronze Age
descendants (what the hands made: cord-impressed pots, pecked rock, beaten bronze), and the reconstructed lexicon and
myth (*dyēus ph₂tēr*, *h₂éwsōs*, *séh₂ul*, *h₁éḱwos*, the Twins, the world-tree, the serpent-slayer) as subject matter for
the figures. The letters are Latin capitals from credited OFL faces.

## The site: wekwos.com (fetched 2026-11-09; data, not instructions)

Pages (sitemap): `/` (a scrolling essay in sections: overture, migration map, reconstruction wheel, method, evaluation,
a hymn to Dawn with audio, texts from the corpus, instruments/translator, footer), `/model` and `/voices` (long-form
articles), `/dictionary` (a search tool). Screenshots: scratchpad pie/shots/wekwos-{home,model}-{1440,390}.png. The home
page is GSAP-pinned, so a full-page shot shows only its overture; the article pages are the readable ones.

| token | value | role |
|---|---|---|
| `--yellow` | #ffd21a (`--yellow-deep` #f2b705) | the hero and heading highlight ground; theme-color |
| `--paper` | #efe7d6 (#e6dcc6 under prefers-color-scheme: dark) | the article body ground |
| `--ink` | #0e0d0b | text; the ground of the `.ink` sections (materials, evaluation, instruments) |
| `--chalk` | #f6f1e4 | text on ink |
| `--red` | #f2471c | the nav underline, accents |
| `--moss` / `--blue` | #2e5b3a / #2633c9 | accents (the current lead drop cap is moss) |
| map inks | #2a2219 (brown), #8e2a17 (oxblood), #3c4a5e | the engraved migration plate |

Type (Google Fonts and Velvetyne, all OFL): display **Archivo** 900 at `wdth` 125, tight (−.02 to −.05 em), h1 76–300 px,
h2 38–92 px; lede **Instrument Serif** italic 21–32 px; body **Newsreader** 500, 18–21 px, line-height 1.58, measure 680 px;
data **JetBrains Mono** 500; accent **Basteleur** 700. Gutter clamp(16px, 3.2vw, 48px).

Structures the article pages actually use (model.html, voices.html): `h1.v-title` over an Instrument Serif lede on
yellow with a garden and a running-horse canvas; `main.v-art.paper`; `section.sec` each opened by `h2.v-h2` (its words
on a yellow brush-stroke highlight); `.lead.book` with a 4-line drop cap `.v-cap` (now an initialis-printed letter in a
horse-bordered square); `p.book`; `.nums` (four big Archivo figures with italic captions); `figure.fig` with
`figcaption` (“Figure 1.” in mono caps); `table.mx`; `ol.ladder`, `ol.pipe-row`; `dl.recipes`; a closing
`section.v-mat.ink` (materials); `nav.colo-nav`. The footer credits "Margins grown with florilegium, initials printed with
initialis": the pieces this theme would replace are the `.v-cap` lead drops and the hero's P. illum should go past those
libraries, not copy them.

Dark: **wekwos has no dark mode.** Under prefers-color-scheme: dark only the paper deepens (#efe7d6 → #e6dcc6). Its dark
ground is the `.ink` section (#0e0d0b, chalk text). So the "dark" panels here are designed on #0e0d0b / #f6f1e4, not
illum's usual rgb(24 22 20).

Rank map onto those structures: drop = `.v-cap` (4 lines, first paragraph of each `.sec`); line initial = a later
paragraph that opens a subsection (`h3`); heading run-out = after `h2.v-h2`; minor break = between paragraphs where the
argument turns; section break = between `.sec`s; end = the close of the article before `.v-mat`; paraph and line filler in
`.book` text; frames: quote (the corpus texts and the hymn), aside, pull quote (one of the `.nums`), figure (`.fig`),
code (the IPA / data lines), contents (`nav.colo-nav`).

## Sources, studied at full size

Rights per file in playground/tests/pie-refs/SOURCES.md. What is genuinely open: the Met (CC0) has the Hallstatt cuirass
248133, the Irish gold disc 468176, a Hallstatt diadem 468340 and La Tène bronzes, but no Corded Ware or Yamnaya pottery
and no rock art. Wikimedia Commons has public-domain photographs of the Trundholm disc (Marie-Lan Nguyen), the Nebra
disc (Frank Vincentz), Gundestrup details (Marie-Lan Nguyen) and one Tanumshede panel; the best pottery and Tanum
photographs are CC BY-SA (Zde, Bjoertvedt, Västgöten, the PAS/Royal Institution of Cornwall). Nationalmuseet's own
images on Commons are CC BY-SA 3.0. The Met's search API v1 was retired on 2026-10-01; v1.1 (paginated) works.

| what | where | licence | used for |
|---|---|---|---|
| Corded Ware beaker, Prague City Museum P0000486, 2678×3570 | Commons (Zde) | CC BY-SA 4.0 | A: the cord measured (pitch, slant, plies, wander), the banding |
| Beaker body sherd, impressed twisted cord, with a scale bar | Commons, PAS FindID 179546 | CC BY-SA 4.0 | A: absolute scale (bead ~2 mm) |
| Yamnaya pottery of the Azov–Black Sea steppes (drawing) | Commons (S. Ivanova after Shaposhnikova 1985) | CC BY 4.0 | A: the steppe repertoire (comb, hanging triangles, herringbone) |
| Andronovo pottery (svg) | Commons | public domain | looked at: stepped meanders (not used: see What to avoid) |
| Tanumshede rock carvings 7, 1632×1232 | Commons | public domain | B: figure widths and edges measured |
| Vitlycke ships and crew; the rider | Commons (Bjoertvedt) | CC BY-SA 3.0 | B: the figure grammar, the paint |
| Herrebro, unpainted, raking light | Commons (Västgöten) | CC BY-SA 3.0 | B: what the carving is without paint (grey furrows, cup marks) |
| Trundholm sun disc, 3840 px | Commons (Marie-Lan Nguyen) | public domain | C: the rings measured |
| Hallstatt cuirass 248133 | Met | CC0 | C: bosses, pointillé |
| Irish gold disc 468176 | Met | CC0 | C: the disc's zones; gold kept small |
| Nebra disc, Gundestrup details | Commons | public domain | looked at (the Nebra disc's inlay, Gundestrup's repoussé figures) |

## Measured (scratchpad pie/py: cord.py, cord2.py, wander2.py, rings.py, peck.py)

**The cord (A), Prague beaker, in units of the bead pitch p.** Autocorrelation along a row: p = 34–39 px (a first peak
of .55–.65, the second .35–.5: the pitch spreads ~8 % bead to bead, and differs ~10 % row to row, a different cord or
pressure). Bead (2-D autocorrelation's central lobe): long axis 26° off the row, aspect 2.8, σ 5.5 px along, so a bead
~.62 p long by its gaussian width (the visible bead, with its shadow, is longer: we use .72 p). Across a band: the two
plies of a cord ~.75–.85 p apart, a dark (shadow) then bright (lip) pair each, contrast about −20 % / +15 % of the ground.
A ply tracked along the pot wanders .04–.08 p rms, mostly bead to bead (step-to-step .05–.07 p). Bead depth: the
measurement was not clean (the ground's own shading); by eye a slow swell along the cord and ±10 % bead to bead, used as
.22 sine over 6–10 beads + .1 gaussian. Absolute scale: the PAS sherd's scale bar gives ~41 px/mm, its cord segments
~2 mm, consistent with the beaker at ~16 px/mm (a ~16 cm pot). Banding: impressions in groups of 2–4 cords with smooth
clay between (by eye).

**The rock (B), Tanumshede 7 (painted).** Red mask, medial axis: a figure's width runs p10→p90 from 8–14 px to 40–90 px
(3–7× along a figure: thin limbs, a heavy keel); ends blunt and round; the painted edge's deviation from its own 15 px
running mean is .019–.027 of the median width rms, i.e. smooth. **That smoothness is the paint, not the peck**: the pit
itself is not measurable from these photographs. The pit grammar used is **by eye and from the literature
[unverified]**: pecks ~4–8 mm across in lines 1.5–3 cm wide (≈5 across), overlapping ~half, the edge scalloped at the
pit's size; Herrebro, unpainted, shows the furrows as soft grey shadows, the cup marks as crisp dark hollows.

**The disc (C), Trundholm's central motif, in units of the ridge pitch q.** Radial gradient peaks in 8 sectors: ridge
flanks in pairs, q ≈ 23.5 px, a ridge ~.5 q wide, the boss r ≈ 1.3 q, then 4–5 rings, a ring of punched beads one pitch
further out (beads ~.8 q apart, long radially), then two more rings. Each ring's radius holds to ±2–3 px (±.1 q) round
the motif: concentric rings laid with a guide, not a lathe and not a spiral.

## Letters (tests/pie-letters.html; subsets in playground/fonts/pie/, licences beside them)

No PIE letter exists, so there is no master to overlay against. The test is what each medium asks of a letter, set in
all three drops beside the plain letter, with the stem measured from each face's I:

| face | stem / cap | in A (cord zone) | in B (pecked) | in C (raised line) | verdict |
|---|---|---|---|---|---|
| **Archivo** 900 wdth 125 (Omnibus-Type, OFL; wekwos.com's own display setting) | .357 | three or more cord rows across every stem: the zone reads at 1× | pecked full it is the Tanum figure's own weight; corners rounded by the pits | heavy, the line round it crowds the counters | **A and B.** It is the site's voice: "a plain, strong capital that the ornament carries" |
| **Cinzel** 700 (Natanael Gama, OFL) | .214 | thin stems hold one or two rows: the zone breaks up | readable, but serifs pecked are a contradiction | **the raised line round a Roman capital reads at once** | **C** (bronze inscriptions are Roman; honest in the metal) |
| Noto Sans Old Italic (OFL) | .126 | — | — | — | **rejected.** Of A–Z only I, O, X read as Latin; its T is a cross |
| Runic, Ogham | — | — | — | — | not tested as capitals: mapped letter for letter onto English they are a pseudo-script in another hat |

Archivo is subset to A–Z at the site's instance (2.6 KB woff2), Cinzel to A–Z (3.4 KB). The faces are renamed (Illum
PIE …) only so no subset is mistaken for its original.

## The mediums (kit/styles/pie-relief.js; bench tests/pie-medium.html)

One new engine, no shared file touched: a height field at device resolution built from **marks**, each one thing a hand
did (a bead, a pit, a groove, a ridge, a boss, a punch, a cut sheet, a touch of pigment), summed in the order they were
made and lit once from the upper left. Every variation in the result is a mark's property (its pitch, pressure, wander,
the stone's give), drawn from the measured spread; nothing is noise, texture or image. kit/gold.js was looked at and not
used: its fields are a gesso cushion with chance specks under a fixed gold ramp. The letters come from
kit/styles/copperplate-print.js's `glyph` (imported, unchanged).

- **Clay (A).** An impression is cast shadow on its sunward wall and a burnished lip on the far side, the ground the
  page's own paper; an incised line the same, narrower. In the ink: dark-fired clay with the impressions filled with
  **white lime paste**, which the Corded Ware and Beaker potters did (the Prague beaker still has it).
- **Rock (B).** Pits by the carver's passes (a figure filled in rows across it, a line with pits across its width at
  every step), the furrow filled with red, thinner on the pits' steep walls. The red is wekwos's own map oxblood
  (#8e2a17) in the light, a brighter ochre on ink. The red is the modern Tanum convention, said so on the page.
- **Bronze (C).** A cut plate (sheared edges that wander, planishing dents too shallow to see as more than a breath),
  ridges chased up, punched dots, bosses; the colour from the slope through a bronze ramp, verdigris (the site's moss)
  only in the punches, gold only on the bosses' crowns.

Speed (Chrome, this machine): a drop 5–22 ms. A specimen page with **every** piece (drop, line initial, paraph, filler,
run-out, three breaks, six frames): at dpr 1 potter 48 / rock 55 / smith 105 ms (light); at dpr 2 potter 133 / rock 151 /
smith 200 ms. A real wekwos page carries far fewer pieces (the model-page mock: 65 / 76 / 98 ms at dpr 1). Smith is at
the budget; its cost is the plate's area (every sheet pixel is lit). Sizes (unminified source): pie-relief 14 KB, each direction 13 KB,
the two subsets 6 KB.

?draw (built, kit/styles/pie-relief.js `writer`): each mark lands at its own moment and only the touched part is
relit: A is pressed bead by bead along each cord (the stick's lines first, the letter's outline drawn down it, then the
cords); B is pecked pass by pass, every pit a blow, the red already in each pit; C is cut, punched round the border, its
line raised down the letter, the body dotted, the rings chased. Nothing fades or pops whole.

## Stage 1: the three directions (tests/pie-directions.html; the mock tests/pie-wekwos.html)

Each is a complete page grammar on the specimen (text quoted from wekwos.com/model) and on a mock of the model page
itself (its h1, lede, `.v-h2` headings, `.lead` drop, `.nums`, `.fig`, section and end breaks, the closing ink colophon).

| rank | A · the potter | B · the rock | C · the smith |
|---|---|---|---|
| drop | Archivo zone filled with cord rows, a cord band above and below between guide lines | Archivo pecked full; sun-wheel at its shoulder; two cup marks | Cinzel raised in a line, its body pointillé, on a cut plate; ring motifs in free corners |
| line initial | the zone alone | pecked letter | a little disc |
| paraph | hanging triangle, comb-hatched | a cup mark | a disc with the ring motif |
| filler | one cord, lighter where set down | a ship as long as the gap | a belt-plate of bosses |
| breaks 1/2/3 | cord between strokes / two cords + comb zigzag / the neck band with hanging triangles | three cups / sun-wheel between cups / sun-ship with a horse | boss strip / diadem of rings / the sun disc |
| run-out | two cords, the lower lifted sooner | a groove thinning to a cup | a strip of diminishing bosses |
| quote | a cord down the margin | the world-tree | a boss strip down the margin |
| pull | bands with hanging triangles | the Twins: two horses facing | ring diadems above and below |
| aside / figure / code / contents | stick frame with comb corners / cord bands / comb rows / herringbone | corner cups / pecked rules / double rule / cup-and-channel | corner discs / strips / plain punched strips / ring strip |

The myth enters only as figures the Bronze Age carved or beat: the sun-wheel and sun-ship (*séh₂ul*), the horse
(*h₁éḱwos*), the Twins as paired horses, the world-tree. *dyēus ph₂tēr*, *h₂éwsōs* and the serpent-slayer have no
honest figure in these mediums yet; they are left out rather than invented.

## Scores (research/05-the-bar.md; my read at 1440 and 390, 1× and 4×, paper and ink)

| | Beauty ×3 | Craft | Viewport | Integration | Behaviour | System | Imperfection | Restraint | Pastiche | Longevity | POV | Provenance | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A · potter | 2 | 2 | 2 | 3 | 2 | 2 | 2 | 3 | 2 | 2 | 3 | 3 | **32** |
| B · rock | 2 | 2 | 2 | 3 | 2 | 2 | 2 | 2 | 2 | 2 | 3 | 2 | **30** |
| C · smith | 1 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 2 | 3 | **25** |

- **A** is the quietest and the most honest medium: at 1× the drops read as a hatched letter in a band, the same
  weight as Newsreader's colour, and the run-outs and breaks sit like the beaker's neck. At 4× its beads are too alike
  and too crisp-edged beside the beaker's soft, merged impressions; the incised outline round the letter is cleaner
  than a stick makes it. Good work, not museum.
- **B** is the boldest and the most on-subject: oxblood figures against the site's paper and yellow, Archivo pecked into
  the Tanum figure's own weight, the sun-wheel, ship and horses carrying the lexicon. At 4× the pit edge reads stippled
  where the master's painted edge is smooth (the paint hides the pecks: our fill should close over them), and the horse
  is crude beside the Tanum horses. Good work, not museum.
- **C** reads as metal, and that is its problem: lit relief with even slopes edges toward the embossed-plastic look the
  user rejected as "1999 WordArt". The Trundholm motif at 2× (the sun disc) is the best single piece in it, but the
  plates are heavy on the wekwos page and the rings sit like stamped coins. Demo by the arithmetic.

## What to avoid
- Pseudo-PIE glyphs, runes or Ogham as English initials.
- Andronovo stepped meanders and the swastika family of sun signs: real, but on a modern page they read as something else.
- Big metal grounds, and gold beyond the bosses' crowns.
- Making the red look like the carvings' own colour.

## Recommendation
**B**, the rock, for wekwos.com, with **A** a close second. The rubric's own tie-break (Beauty equal, then the total) puts A first; I put B ahead on fit to the site, which the rubric does not weigh. B harmonises with what the site already has (its oxblood
migration plate, its running horses, Archivo's weight) and is the only one that can carry the myth as figures. A is the
finer, quieter grammar if the user wants ornament subordinate to the page. C should be dropped unless the user wants
metal; if kept, its relief must be re-measured against the disc (sharper ridges, broader flats, specular breaks) before
it is shown again. Next for B: close the paint over the pits so the edge is smooth at 4×; draw the horse from a traced
Tanum horse's proportions; give the ships the double line and comb crew of tanumshede-7.

## Stage 2: B, the rock, as paint on rock (the user: "it needs to feel like paint texture on rock and not blobs … push it hard, make it beautiful"; A and C parked)

Stage 1's B was a flat oxblood fill with a stippled edge. Stage 2 builds the three surfaces from their causes and lays
the paint by them (kit/styles/pie-paint.js, new; kit/styles/pie-rock.js rewritten; nothing shared touched).

### Measured (scratchpad pie/py/grain.py, paint.py)
- **Granite grain**: autocorrelation of the rock between figures gives a grain ~.10 W (Vitlycke) to ~.13 W
  (Tanumshede) across, W the figure's stroke width; luminance p10/50/90 128/161/192 (Tanumshede): ±20 % about the
  median. Used: grains at ~.12 W, four minerals (pink and white feldspar, grey quartz, dark mica) within that range,
  quartz weathered proud and mica sunk (hardness), facets with their own tilt.
- **Striations**: the structure tensor of the coarse rock found no strong direction in these photographs (coherence
  .05–.21); the striations are therefore **by eye**: shallow parallel grooves ~1.1 W apart at one angle, about half of
  them cut, deep enough only to hold paint.
- **The paint**: inside a painted figure 12–15 % of the surface still reads as rock (Vitlycke .12, Tanumshede .15);
  the red varies at the grain's scale (Vitlycke) and at a stroke's (~.3 W, Tanumshede); weathered red p10/50/90
  #6d3632 / #884a46 / #a06560, fresh and wet much brighter (the Vitlycke rider, added to pie-refs); the edge goes from
  rock to full red over ~.1 W, one grain.
- **The pit** is still by eye and from the literature [unverified] (~5 across a line).

### The model (every variation one of these)
- **Granite**: per-crystal facets (precomputed per grain, so cheap), grain boundaries opened a little, crystals'
  colours shared at their edges; the panel under the drop and the end break is this rock with a weathered outline;
  smaller pieces show rock only where it was pecked.
- **Pecking**: the hammer-stone's pits (the stage 1 carver, kept), crushing the crystal faces paler.
- **Brush**: strokes follow the figure (a ship's keel, a horse's legs); a letter is painted along and across its own
  strokes (the direction in which the region runs longest, of horizontal and vertical). The load runs down along each
  stroke (over ~18 brush widths); bristle lanes carry ±6 %; a full brush skips only the lowest grains (the measured
  ~15 %), a dry one only the high points; the paint pools in the pit floors and striations; a second stroke over wet
  paint lays a coat, it does not darken it; paint off the pecked figure does not take.
- **Colour**: Beer's-law cover from thin/dry (#b9624b) through fresh body (#a5361e, a little warmer and brighter than
  the site's #8e2a17) to pooled (#561810); on the ink sections the same rock, the paint brighter (#c4432a).
- **?draw**: the figure pecked pass by pass (the floor paling as it is worked), then painted stroke by stroke along each
  stroke's length, pigment settling as the brush passes. Nothing fades or pops.

### Liberties (named on the page)
The capital carved and painted on a rock panel with a ship under it and the sun-wheel in its counter or at its
shoulder; the Twins as two horses facing under the wheel (the pull quote); the world-tree (quotation); dawn,
*h₂éwsōs*: a sun-wheel rising, rayed, from a ship; the serpent-slayer: an axe-bearer facing a serpent line; the
sky-father, *dyēus ph₂tēr*: an adorant, arms raised under the wheel, between the Twins. The end break chooses among
these and a fleet under the sun by seed. Ships, horses, footsoles, cup marks and the wheel are Tanum's own vocabulary,
drawn by eye from the photographs in pie-refs (not traced).

### Speed
The mock (pie-wekwos.html?dir=rock) prints each piece when its place nears the view: the first view's pieces in
45–71 ms at dpr 1 and 2 (1440 and 390); every piece at once (`&all`) 135–160 ms at dpr 1, ~260–320 ms at dpr 2. The
specimen page (every piece, eagerly) 150 ms dpr 1, 280 ms dpr 2. A worker could take the granite and the stroke
rasterising off the main thread if eager printing is wanted; not built.

### Engine note (not done: shared file)
kit/medium.js's paper is generated inside its own shader (PAPER_FS: tooth and fibre). Accepting an external paper field
(a texture of height and a second channel) would let the WebGL ink engine lay this paint with its LAY catch, wetness
and pour, on the GPU; pie-paint.js is the CPU bench of that idea.

### Where it stands (honest)
At 1× the pieces read as red paint on pecked granite, and the panels hold a page. At 4× the drop reads as paint on
rock, but the granite's crystals are still a little too regular (a Voronoi mosaic you can see as such), the letter's
paint reads flatter than the master's (its strokes are straight runs), and the horse is better but still a sketch.
Beauty 2, not yet 3.

## Stage 3: B with its own alphabet and a wider vocabulary (the user: "lose the granite background, add more variation of figures and designs … design real letters … a page with all 26 letters and all the design elements")

- **No rock ground anywhere.** The panels, outcrops and tiles are gone (`ground` is 'none' throughout; ?ground=outcrop|slab
  still shows the stage 2 options on the mock for comparison). The granite field is kept only as the surface the paint
  takes on: where the brush skipped a low grain the pecked floor shows as a pale fleck inside the figure, which is caused,
  and the pits, the pooled rim and the brush direction stay.
- **The alphabet** (kit/styles/pie-letters.js): A–Z as data, each capital a few strokes with a skeleton and a width
  profile, pecked and then painted along each stroke (so ?draw carves and paints it stroke by stroke). Family logic:
  - strokes swell from ~.075 to ~.22 of the cap height (about 3×: the low end of the figures' measured 3–7×, so the
    letters stay letters);
  - blunt round ends, heavier at the foot; no serifs and no square corners (a corner is two strokes meeting);
  - proportions informed by Archivo only;
  - the hand's wander added to every stroke (~.03 of its width off its line, its width breathing ±6 %).

  Tanum's vocabulary is used where it serves the form: O and Q are sun-wheels (ring and spokes), U is a hull with its
  ends curled up, C G J S end in cup marks, Y forks like the world-tree. The Archivo-glyph drops of stages 1–2 and the
  skeleton-carving experiment are gone.
- **The drop** is the carved capital with a figure composed into the room it leaves, chosen by letter and seed: a ship
  under it whose crew reach up into the letter (sharing its line), a deer, horse or crane walking away from its foot, the
  sun (wheel or rayed) at its shoulder over a row of cups, or a rider with a spiral or rings.
- **The vocabulary** (tests/pie-alphabet.html, "The figures"):
  - ships: plain, high prow and stern, double hull, sun-ship;
  - horse, rider;
  - **the Tanum chariot** (Bronze Age Scandinavia: seen from above, its four-spoked wheels laid flat beside the axle, a
    horse each side of the pole, backs to it);
  - **the ox cart** with solid disc wheels (the older, **PIE-era** layer: the Yamnaya wagon burials; spoked chariots
    come later, with Sintashta c. 2000 BCE);
  - sun-wheel, rayed sun, cup marks, footsoles, hands, spiral, concentric rings;
  - axe-bearer, lur-blower, adorant, serpent, world-tree, deer, crane.

  All are drawn by eye from the panels' proportions, not traced.
- **Variation down a page and between seeds:**
  - paraph: a cup, a ringed cup or a footsole;
  - filler: ship types, a serpent, or a rider and a deer;
  - break 1: cups, cups joined by a channel, or footsoles;
  - break 2: a sign between a pair (wheel and footsoles, rayed sun and cups, spiral and hands, rings and cranes);
  - break 3: seven panels (a fleet under the sun, dawn, the serpent-slayer, the sky-father, a chariot and a rider, the
    ox cart, two lur-blowers under the sun);
  - frames: the world-tree or a serpent beside quotations; the Twins as horses or as two lur-blowers over the pull
    quote; cups or spirals at an aside's corners;
  - the heading run-out: an uneven row of cups (spacing, size and depth varying); rules: pecked grooves swelling along
    their length.
- **Liberties** (unchanged and named): the drop compositions, the Twins, the world-tree, dawn, the serpent-slayer, the
  sky-father, the letters' Tanum details.
- **Speed.** Mock (pie-wekwos.html?dir=rock), the pieces in the first view: 36–50 ms at dpr 1 and 2 (1440 and 390);
  every piece at once 158 ms (dpr 1) / 294 ms (dpr 2). The alphabet specimen prints everything (26 drops, 26 line
  initials, 22 figures, all breaks and panels, twice) in ~1.2 s at dpr 1.
- **Where it stands (honest).** The alphabet is legible and reads as one carved family. At 1× the pages hold, and the
  vocabulary is broad enough for a page to vary. At 4× the paint is mottled (pit by pit) where the Vitlycke paint is a
  smoother, glossier film. Some figures are still sketches beside the panels: the horse's head, the chariot's horses, the
  lur's horn. The drop compositions sometimes crowd, a figure close to a letter's leg. Beauty 2.

## Stage 4: the figures made by a hand (the user: "the figures are too neat and even: perfect circles, perfect straight lines")

The letters were kept; the figures and the paint film changed.
- **Every figure groove carries the hand** (`handed()` in kit/styles/pie-rock.js): resampled along its length, its course
  wanders off the drawn line by ~.07 of its width over two wavelengths (the arm's reach, the hammer-stone's angle), its
  width breathes ±12 %, and its ends stay blunt. The amplitude is measured: a Tanumshede keel departs from a smooth
  cubic by .066 of the hull band, rms (scratchpad pie/py/fig.py). The letters keep their own, lighter hand.
- **Nothing round or square.** Rings (`loop()`) swell and dip in radius (two and three lobes, ~6 % and ~3.5 %), sit a
  little off-centre, are slightly oval, and overlap where they were closed. A sun-wheel's rim breathes in width; its
  spokes cross neither at 90° nor at the centre, and each overruns or falls short of the rim. Rays are uneven; spirals
  open unevenly and are oval. The rings', rims' and spirals' amplitudes are **by eye** (no clean sun-wheel photograph
  among the open sources).
- **Fleshy forms.**
  - Horses: the body 2–2.6 lw, the neck 2.2 tapering to 1.3, the head long and dropped, the legs 1.35 tapering to .6,
    each with its own length and lean.
  - Deer and cranes: likewise heavier.
  - People: a heavy torso (2.3), bulging calves (2.3 against .95 at the ankle), big feet and hands.
  - Ship hulls: a thick band (1.3 to 2.6 lw, thickening toward the prow); the crew vary in spacing, height and lean,
    with heavier tops.

  Widths are by eye from tanumshede-7 and the Vitlycke warrior (my automatic medial-width measurement of the deer and
  the crew failed on the joined figures).
- **Scale and collisions.** A drop's figure is up to ~.42 of the drop's height: a partner, not a footnote. Every figure
  is checked against the letter's strokes (its pits kept a groove's width clear) and made smaller until it fits, or
  left out. The ship's crew stop clear of a letter above them, except one in three, which reaches up into it and shares
  its line on purpose.
- **The paint film.**
  - Under a coat, the pits' relief is softened to ~12 %; the pooling in each pit floor is cut to a third; the darker rim
    at the groove's wall is kept.
  - A gloss: the film's own surface catches the light (a narrow specular term).
  - A long groove's brush is reloaded every ~9 widths, so loops and keels don't run dry halfway.
  - Skips are subtler: a grain the brush missed lightens the film rather than opening it.
- **Speed (mock).** In view: 37 ms at dpr 1, 56–67 ms at dpr 2. Every piece at once: 130 ms (dpr 1), 269 ms (dpr 2).
  Alphabet specimen ~1.6 s.
- **Where it stands (honest).**
  - The figures are fleshier and no longer geometric. The paint reads as a smooth red film with organic edges.
  - Beside the panels at 4×, our horse is still leaner and longer in the leg than Tanum's animals.
  - Our ship's crew comb is sparser and less regular than the master's dense comb of rounded strokes, and the oval
    openings between keel and gunwale are missing.
  - Some drop animals come out small where the collision fit had to shrink them.
  - Beauty 2, closer to 3 at 1× than before.

## Stage 5: traced masses and pecked edges (the user: "lots of hard even flat/straight edges which looks artificial")

- **Traced figures** (kit/styles/pie-traced.js, from scratchpad pie/py/trace.py):
  - The painted area of three figures was traced as outline rings and normalised to height 1:
    - the Tanumshede ship: hull band, crew comb and the 27 oval openings between keel and gunwale;
    - the Tanumshede antlered animal (used as the deer);
    - the Vitlycke warrior with sword and shield.
  - Ours are those outlines placed with the seed's hand: a stretch of up to ±15 % that keeps the traced proportions, a
    slant, a slow bend, and a mirror.
  - The horse, the other people's poses, the sun-wheel and the rest have no clean open photograph (Fossum's photograph
    is too faded to segment; the Vitlycke ships photograph is too noisy). They are drawn in the traced figures' manner,
    and the page says so.
- **One carver for everything** (`carve()` in pie-rock.js): a piece's grooves (paths with widths, including the
  letters') and traced outlines are laid as one area.
  - Drawn grooves get fillets where they merge (a blur-and-threshold ~1.1 pits across) and round blunt ends.
  - Traced outlines keep their own gaps and holes.
  - The area is then pecked in the carver's passes, so every edge is the outermost pits' scallop, never a cut line.
  - Traced figures are pecked at their own finer scale so their openings stay open.
  - Long grooves bow a little with the arm's arc.
  - Cup marks are pecked ovals of their own size and roundness.
  - The paint closes over the pits' scallops by half a pit (`settle()` in pie-paint.js): the edge is soft where it
    thinned and crisp where it pooled.
- **The ship** is now the traced Tanumshede hull (thick band, dense comb, the row of ovals), never squashed: a short
  slot gets a smaller ship, centred.
- **Drops reflow** instead of shrinking the figure:
  - the ship under the letter, across the full width;
  - an animal beside it (drop 1.4× its height wide);
  - the sun beside it over cups (1.3×);
  - the warrior beside it (1.5×).
- **Speed.** Mock, in view: 82–108 ms at dpr 1 and 2 (1440), 66 ms at 390. Every piece at once: 440 ms (dpr 1) /
  650 ms (dpr 2): the carver's area raster and pitting is now the cost. Print-on-approach keeps the page within budget;
  eager printing would want a worker.
- **Where it stands (honest).**
  - At 4× and 8× the traced ship and warrior read as the panels' own figures, organic and smoothly painted, with their
    openings.
  - The drawn-in-manner figures (horse, wheel, people) are still more regular than the traced ones.
  - At 1× the traced ship is a thin band under the drop's letter.
  - Some thin traced parts (the warrior's spear) take paint unevenly.
  - Beauty 2+.

## Stage 6: speed first, then the edges, the ship and more tracing

**Speed (profiled per piece in the browser, scratchpad pie/prof.mjs).** Stage 5's jump came from the carver:
- It iterated the pecking lattice over the whole piece's box, drawing every blow's jitter from one random sequence (a
  rule at the top of a frame and another at the bottom paid for everything between; a traced ship's fine pits ran over
  the whole filler).
- It also blurred the whole box.

Fixes:
- Pieces and their carving are cached, keyed by what made them. This alone is pixel-identical: 0 % of pixels differ on
  the specimen, 0.0001 % (max 1/255) on the mock.
- The carver works per cluster of touching grooves over that cluster's box, its lattice bounded to the box, each blow's
  jitter a hash of its lattice place. This step is not pixel-identical, by necessity: the pits are re-rolled with the
  same statistics. 0.36 % of the mock's pixels and 0.65 % of the specimen's differ, all at pit scale.

Per-piece carving times:

| piece | before | after |
|---|---|---|
| filler | 149 ms | 2 ms |
| aside | 116 ms | 0 ms |
| figure frame | 143 ms | 28 ms |
| code frame | 95 ms | 17 ms |
| drop | 54 ms | 14 ms |

| | before | after |
|---|---|---|
| Mock, every piece at once, dpr 1 | 503 ms | 231 ms |
| Mock, every piece at once, dpr 2 | 646 ms | 368 ms |
| Mock, in view | 106 ms | 52–86 ms |
| Specimen page | 420 ms | 209 ms |

(The after numbers include the look changes below.)

**Edges.** The paint now closes over a whole pit at the pits' own size (`settle()`, radius = the lower-quartile pit
radius), so only a faint ripple is left. And a pit lands only where the whole blow stays inside the figure, so the pecked
area keeps the figure's own outline instead of swelling by a pit all round. The traced rings are smoothed twice
(corner-cutting) to lose the photograph's pixel steps and highlights.

**The ship.** With pits kept inside the outline at the ship's finer scale, its crew comb stays separate rounded strokes
and its oval openings stay open, at 8×. The ship under a drop letter is taller: the drop is 1.45× wide and the letter
shorter.

**More tracing.**
- An **adorant** from Vitlyckehällen (RAÄ Kulturmiljöbild, Bengt A. Lundberg, CC BY 2.5) traced: hands raised, a staff
  beside him. It replaces the drawn adorant in the sheet and the sky-father panel.
- A **horse** from Tanum (Tulipasylvestris, CC0): it is unpainted, its pale grooves would not segment, so its
  centrelines and widths were read off the photograph by eye. The horse (and the rider and chariot) are now built on it:
  the long rising neck, small forward head, thin back and long legs, filled out a little for paint.
- A **ring** on Vitlyckehällen (KMB 16000300015074) measured: it departs from its circle by .055 of its radius (sd), which
  matches the drawn wheels' rims.
- **No clean four-spoked sun-wheel** was found among the open photographs (Commons' Tanum, Vitlycke, Aspeberget,
  Litsleby, Kalleby, Fossum; the RAÄ KMB images on Commons); it stays drawn in the traced figures' manner.
- SHFA's archive was not searched (no open licence confirmed in this session).
- Credits are in tests/pie-refs/SOURCES.md and kit/styles/pie-traced.js.

**Where it stands.**
- The traced figures at 8× (warrior, ship) have smooth, confident painted edges, their openings and separate crew.
- Thin traced parts can break where no pit fits inside them (part of the warrior's spear).
- The traced horse is slender, as the master's is: beside the bold letters it is lighter than the other figures.
- Beauty 2+.
