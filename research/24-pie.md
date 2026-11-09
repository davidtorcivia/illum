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
