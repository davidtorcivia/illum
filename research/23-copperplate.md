# 23 · Copperplate: the burin, the quill and the command of hand

The English writing-masters and their engravers, c. 1700–1800, as a rubricate style. Stage 1 is research, the medium, the
letter source and three direction studies (tests/copperplate-directions.html, drawn by tests/copperplate-directions.js and
printed by kit/styles/copperplate-print.js); the medium bench is tests/copperplate-medium.html. The style waits for the
user's choice. Raw downloads, measurement scripts and screenshots are in the session scratchpad (copperplate/raw, py, shots,
LOG.md), not the repo.

## Sources, studied at full size

| what | where | licence | used for |
|---|---|---|---|
| George Bickham, *The Universal Penman* (1733–41, this copy 1743), 426 leaves, 1737×3000 (~8 px/mm) | archive.org `gri_33125008538056` (Getty Research Institute; colour photographs) | not in copyright (IA: NOT_IN_COPYRIGHT) | everything: p. 0040 (Chambers' command of hand, *Bickham sculp.*), 0124 (WIT, John Bickham sculp.: flourished bands, oval cartouches), 0400 (Joseph Champion's round-hand capitals A–Z), 0414 (the ABC headpiece: capitals in rosettes), the plate mark and plate tone. Crops in tests/copperplate-refs/ |
| Joseph Champion, trade card of John Brown (1742–61), 2067×2585 (16 px/mm) | Met 779212 (DP880172) | CC0 | the engraved hairline and shade in mm; hatching; a worn impression on laid paper |
| Jan van de Velde, *Spieghel der Schrijfkonste* (1605), plates ~12 px/mm | Met 358328 (DP161559–64, MM11845, DP372403) | CC0 | the Dutch comparison: shaded thorn hooks, nested ovals |
| Conrad Baumann after van de Velde | Met 345657 (DP372397) | CC0 | looked at |
| H. E. Forbes, *Ornamental Lion Composed of Scrolls, Holding Pens* (18th c. per the Met; pen, blue ink), ~7 px/mm | Met 363599 (DP820962) | CC0 | the pen against the burin: pooling, blunt ends, pale hairlines |
| Carington Bowles, penmanship school piece (1786) | Met 888341 | CC0 | looked at |
| Bickham-ABC.png, Bickham-letter.png (pp. 209, 194; bitonal reprint scans, 2550×3675) | Commons | public domain | the slant of the text; Bickham's line-end tildes |

**Gaps.** Snell, Seddon (*The Penman's Paradise*), Shelley, Cocker, Snow and Bland were not seen at full size: Commons has only
ECCO "Fleuron" crops of Seddon/Shelley (T114389, T056772), small bitonal microfilm PNGs (looked at, small). The Rijksmuseum
lists 136 van de Velde objects (CC0) that were not fetched (its Linked Art API needs several hops to an image); the Met's
Spieghel plates cover the comparison. Getty's scans are at ~8 px/mm, so anything below ~0.25 mm on them is unresolved.

## Measured (scripts: scratchpad copperplate/py/measure.py, overlay.py)

- **Slant.** Round-hand text and capitals: 54.3° from the horizontal (Bickham's text, sd 4.0° stroke to stroke), 57.0° (the
  ABC page, sd 4.2°), 57.0° (Champion's card, sd 3.8°).
- **The shade of a flourish is a lens on a sweep.** Opening the ink (hairlines gone) leaves each shade as one lens: on 0040,
  15–22 times as long as its peak width (median 21.8, p25/75 14.6/29.8; 0124: 15.3), its peak .39 of the way from its nearer
  end, full-bodied (mean width .77 of the peak over the part ≥ 3 px), its centroid within 2 % of its middle.
- **Where the shade sits.** On 0040 (a plate printed turned on the page) .55 of the stroke within 15° of one axis is shaded,
  .17–.22 at 45°, none past 60°; on 0124's bands the shades are on the near-level sweeps. For *flourishes* the shade is a press
  laid on the composition's chosen sweeps, not a function of the 55° slant. For *letters* it is the pen's: the down-stroke on
  the slant. (So the pilot's `shadeCP` in kit/wayfinding.js, a swell by the dot of the direction with the slant, is the wrong
  model for flourishes; the user rejected that pilot as "template-ish hairline decoration".)
- **Hairline and shade.** On Champion's card (16 px/mm) the hairline's equivalent width (ink integrated across it, which holds
  below a pixel) is 0.14–0.15 mm (median), p10 0.08 mm; its ink is .86–.93 of the full black. The Getty hairline is at the scan's
  floor (<0.25 mm, unresolved). Shades: the card ~1.0 mm; 0040's lenses to ~2 mm. Ratio shade:hairline ≥ 8:1, ~10:1 on
  Champion's capitals (shade 6–7 % of the cap height, ~0.85 mm, over ~0.08 mm). The engraver's hairline is even along its length.
- **Capitals' weight** (Champion, 0400): shade peak 5.7–7.4 % of the cap height (C 11 %), ink 6–11 % of H². Pinyon Script:
  7.8–10.3 %, 13–25 %; Imperial Script 7.6–11 %. The faces are ~1.4× the master's weight, with about twice his ink.
- **Terminal curl** (0040, read about its eye by hand): radius 93, 105, 79, 62, 35, 24 px by quarter turns from the outside;
  ×0.38 a turn (quarters .75 .78 .56 .69), ~1.4 turns, ending in a hairline point. That loop carries two lenses, heavier at its
  foot, lighter at its head, both on its near-level parts. Van de Velde's "spirals" are not spirals: rays from a hook's eye cross
  several separate nested ovals.
- **Terminals at 4×.** Engraved: the hairline runs to a point; a shaded hook (a lens ending in a sharp beak: the comma or
  thorn); a ball 3–4 hairlines across (0.5–1 mm) at the end of a curl. Pen (Forbes): blunt ends where the nib closes, the ink's
  colour changing along the stroke, pale broken hairlines.
- **The engraving as a print.** Edges 10–90 % in 1.4–1.6 px on the crisp scans (the scan's own sharpness); the ink's core is flat
  (sd 8–9 L; the worn card 15). Plate tone: inside the plate mark the paper is ~3 L darker and a touch cooler (R −2, B +2); the
  plate mark itself a ~5 L shadow over ~1 mm. These are page-level effects; by the library contract (a style colours only its own
  marks) they are not the ornament's medium and are at most an opt-in page look. The engraving's realness has to be in the line.
- **The burin's waver** (one isolated 211-px hairline on 0040, its centreline against itself smoothed at 25 px): residual sd
  0.17 px (p95 1.7 px at its ends), half-wave ~60 px. That is at the skeleton's quantisation floor, so it is an upper bound: the
  engraver's line drifts by at most ~0.02 mm over ~8 mm. `burin()` uses 0.16 px over ~70 px at page size, at that bound.
- **Crossings: observed, not measured.** On 0040 and 0124 shades cross hairlines, at large angles (by eye 40–90°); a shade
  crossing a shade at its swell was not seen. Used as a design rule ("a shade is crossed only by a hairline"), not a number.
- **Hatching** (Champion's card): 0.24 mm pitch (≈4 lines a mm), the lines swelling where the tone is darker; frame rules heavier
  on the shadow side; a row of dots.

## The medium first (kit/styles/copperplate-print.js; bench tests/copperplate-medium.html)

The lesson of Insular was that geometry, not paint, makes "digital". So the medium is cheap and exact, and the hand is in the
geometry at the master's amplitude.

| medium | how it was made | what we do |
|---|---|---|
| **intaglio** (A, C) | ink wiped into the cut and pressed out whole | every stroke a union of discs along its path (filled once, so a crossing never darkens), the capital poured into the same coverage, all through the ink engine's `inkLetter` at wet .03, dry .04: crisp, almost no creep, no rim |
| **the quill** (B) | a pointed quill in iron-gall ink | the approved Pen of kit/medium.js driven as nouveau-ink's `inkWrite` is (pattern copied, not imported): a hand's pace (slower into turns and at the ends), the swell given as pressure, so the ink pools where the hand slows; dots poured as a little pool |

**The engine's floor.** Hairlines drawn .4 .6 .8 1.0 1.2 1.4 css px at dpr 2 render (equivalent width) 0.09 (broken), 1.03,
1.18, 1.40, 1.50, 1.60 px: the engine adds ~0.4 px and loses anything under ~0.5. So the drawn hairline is never under 1.2 device
px (0.6 css px at dpr 2), and opens toward the master's tenth of a shade where there is room (`hairOf(peak, d)`). **The
compression rule:** the shade stays at the master's share of the letter (6–7 % of the cap height); at page size the hairline is
floored, so the ratio shrinks to ~6:1; enlarged (4×) the hairline drops toward the master's and the ratio opens to ~10:1.

**The hand in the geometry** (all in copperplate-print.js):
- `shade()` lays one lens on each run of a stroke that heads within ±32° of the composition's shade axis, its length setting
  its weight (aspect ~20, up to the peak), its peak .4 along it, `sin^.7` (the measured fullness), never within 10 % of the
  stroke's ends: the burin goes in and comes out as a hairline.
- `burin()`: a long curve drifts sideways ~0.16 px over ~70 px and comes back, at the measured upper bound (the engraver is
  steadier than any pen; the waver is small and slow, never noise on the edge).
- `curl()`: the measured terminal curl (×0.38 a turn, 1.4 turns). `stroke()`: ends as a point (tapered over ~8 hairlines), a
  ball (1.75–1.9 hairlines' radius) or blunt (the pen).
- `thinShades()`: the face's shades cut back by 30 % of their thickness over the hairline (thickness carried across each
  stroke from its ridge, never along a hairline into the shade it grows from), so Pinyon's capital is engraved at Champion's
  weight and its hairlines are untouched.
- The rosette (C) is never perfect: each loop its own size (±9 %), larger toward the head and foot, the ring breathing 2 %.

## Letters

The user's rule: shapes from a credited open face, chosen by overlay against the period letters; the generator applies the hand.
28 candidates surveyed (each licence file read; all Google Fonts faces SIL OFL 1.1). Overlays scale the candidate to Champion's
capital (B C L R S T, Universal Penman p. 0400), search scale .9–1.1 and offset, never stretch; IoU = shared/combined ink;
skel = mean distance between the centrelines, % of the letter's height. Evidence: research/copperplate/overlay-champion.jpg,
specimen-caps.jpg.

| face | designer | licence, RFN | IoU / skel | verdict |
|---|---|---|---|---|
| **Pinyon Script** | Nicole Fally (Sorkin Type), 2024 | OFL, no RFN | .212 / 6.9 % (L .32/5.5) | the closest structure: the shaded stem where Champion's is, oval bowls, hairline lead-ins; heavier (fixed by the hand). **A and C** |
| **Imperial Script** | Robert Leuschke, 2008 | OFL, no RFN | .190 / 6.7 % | strong shade, true hairline loops; more looped than Champion. **B** |
| Herr Von Muellerhoff | Sudtipos | OFL, RFN | .224 / 7.7 % | top IoU is an artefact of its straight, minimal strokes: no ovals; rejected on the sheet |
| Parisienne | Astigmatic | OFL, RFN | .180 / 6.6 % | modern formal script, near monoline |
| Mea Culpa, Lovers Quarrel | Robert Leuschke | OFL | .148, .135 | Bickham in spirit, loose and busy |
| Petit Formal, Rouge Script | Impallari; S. M. Lopez | OFL, RFN | .159, .128 | 19th-c. business hand; modern wedding script |
| Great Vibes, Alex Brush, Allura, Italianno, Tangerine, Corinthia, Qwigley, WindSong, Water Brush, Birthstone Bounce, Lavishly Yours, Ballet, Meddon, Monsieur La Doulaise, Mrs Saint Delafield | various | OFL | ≤ .17 | brush, modern, chancery or too ornate |
| Hershey Script, EMS Allure/Felix (single-line) | Hershey (NBS, use notice); S. B. Michaels | not OFL / OFL | ≤ .07 | centrelines, but coarse and not round hand. Not needed: `letterWriter` (kit/inkletter.js) already thins any glyph and writes it along its skeleton in hand order |

Shipped (fonts/copperplate/): `illum-copper-pinyon-caps.woff2` (12 076 B) and `illum-copper-imperial-caps.woff2` (12 816 B),
A–Z cut with pyftsubset and renamed (neither has an RFN; renamed so a subset is never mistaken for the original), each with a
README and the original's OFL beside it. Exclusions: Bickham Script, Edwardian Script (commercial).

## Stage 1: the three directions (tests/copperplate-directions.html)

- **A · The plate** (Bickham and Champion, engraved). The drop: Pinyon's capital at the master's weight, an underscore (a line of
  beauty with one lens on its long run, curling up at its end) and a head stroke (a lighter lens leftward into a curl and a ball).
  Paraph: Bickham's line opener, a tilde with a ball where the burin went in. Filler: a fine rule out to the measure ending in
  Bickham's shaded tilde ("Language~"). Break: two lines of beauty crossing, each shaded away from the crossing (a shade is crossed
  only by a hairline), the four ends curled. Quotation: a flourished head-rule turning down into the margin with its lens on the
  turn (Bickham frames with flourished rules and ovals, not mitred corners). Dark: the copper plate itself, its cuts bright copper.
- **B · The writing master's pen.** The same grammar written: Imperial's capital poured in iron-gall ink (its rim pooling), one
  slant oval written round it, shaded where the pen is pulled down the slant; the copybook oval for the paraph; a compound curve
  closing in a small oval for the filler; a running oval for the break; a head-rule into an oval for the quotation. Dark: white
  ink on a dark card.
- **C · Command of hand** (Bickham's ABC headpiece, p. 209; the WIT bands, p. 46). The capital inside a ring of nine loops
  written as one stroke, each loop swelling on its outer arc; a trefoil knot (three loops, three crossings) for the paraph;
  running loops, smaller toward the end, closing in a curl and a ball, for the filler; a band of loops swelling to its middle for
  the break; a curl down the margin and loops along the head for the quotation. Engraved. Dark: an ivory ink.

**?draw (planned, not built).** Every mark here is a path in the order the hand made it, so writing it is the path revealed along
its length: for A and C the burin cutting (the coverage grown along each stroke's arc length, one stroke after another, the
lens arriving as the front passes, never a fade), the capital by `letterWriter` (its skeleton in hand order) before its
flourishes; the rosette is one stroke and is written round once. For B, the Pen itself is the animation: `quill` already writes
in time (pen.update(t)), so ?draw shows the medium window live as the strokes are made, as kit/inkletter.js letterWriter does.

**Speed** (Chrome, the five pieces of one panel, load average 4–7 on a shared machine; the first panel includes the engine's
warm-up and the font): plate light 81/97 ms (dpr 1/2), dark 35/47; pen 78/95, 50/47; hand 99/114, 45/61. Within the 200 ms page
budget.

## Scores (research/05-the-bar.md; my read at 1440 and 390, 1× and 4×, light and dark)

| # | criterion | A plate | B pen | C hand |
|---|---|---|---|---|
| 1 | Beauty (×3) | 2 | 2 (lowest of the three: the break and quotation are plain) | 2 (closest to 3: the rosette at 4× reads as engraved work) |
| 2 | Craft at every scale | 2 (4× crisp; the head stroke's lens still ends heavily where it meets the letter) | 2 (real pen pooling; the long hairlines run dry and grainy) | 2 |
| 3 | Holds at every viewport | 3 | 3 | 3 |
| 4 | Integration with the text | 2 | 2 | 2 (the filler's loops are as busy as a line of text) |
| 5 | Behaviour | 1 (no ?draw yet) | 1 | 1 |
| 6 | The system is the work | 2 | 2 | 2 |
| 7 | Living imperfection | 2 (lens placement, curl, slow waver) | 3 (the pen's own pace, pooling and drying) | 2 (loops ±9 %, the ring breathing) |
| 8 | Restraint and the void | 3 | 2 | 1 (every element loops) |
| 9 | History without pastiche | 2 | 2 | 2 |
| 10 | Longevity | 2 | 2 | 2 |
| 11 | Point of view | 2 | 2 | 2 |
| 12 | Provenance | 2 | 2 | 2 |
| | total /42 | 29 | 29 | 27 |

All three are "good work, not yet museum": Beauty is the gap. Beside Champion's B at 1× (true scale: the scan is ~8 px/mm, about
a 4-line drop's) and 4× (an upscaled scan, so soft; the true 4× check was the trade card at 16 px/mm and van de Velde at 12 px/mm,
in the scratchpad), our capital is still heavier and rounder than his, whose B is slender with a long hairline entry; his
flourishes are fewer and longer. The compression rule (hairline opening at 4×) applies to A and C; B's hairline is the pen's,
fixed at 0.6 css px.

**Recommendation:** A, the plate, as the style: its page grammar (the tilde opener and filler, the crossing break, the flourished
head-rule) is Bickham's own, the most restrained, and its medium reads truest beside the master; with C's rosette as the drop's
richer form at the higher richness levels (it is the most beautiful single piece at 4×, but a page of loops is too busy). B's real
pen is the most alive surface but its pieces are the plainest; it could be a later option (the quill as an alternative medium for
the same paths).

## What to avoid

The pilot's model (a swell by the dot of the direction with the slant, every stroke shaded the same way); perfect rosettes (the
same loop nine times); lenses that start at a stroke's end (a blunt club); a hairline under the engine's floor (it breaks into
beads); plate tone or a plate mark painted onto the host's page; grain or noise in the ink (the master's black is flat); birds
and command-of-hand figures that we have no measured model for (pastiche risk); Bickham Script and Edwardian Script (commercial).

## Stage 2: B and C (the user's verdict: "I like A the least. B is good and C could be good if we make the loops dynamic")

A (the plate) is dropped; tests/copperplate-directions.html now shows B and C, both drawn from one flourish generator,
kit/styles/copperplate-hand.js. B writes it with the ink engine's pen; C cuts it as engraved, shaded strokes.

**A correction to stage 1.** Plate 0040 is printed turned 90° on the page. So its shaded "near-level" sweeps are the plate's
down-strokes, at 75–105° in the plate's own frame. Bickham's shade sits on the down-sweep, as the pen's does. The bands on 0124
also carry lenses on their long level sweeps.

### The flourish grammar, measured on the refs (scratchpad copperplate/py/holes.py; LOG.md)
- **Chains of loops riding a sweep** (the dove's wings, 0220, ~8 px/mm). The loop eyes along the upper wing measure 48, 63, 46,
  67, 66 px, then 36 px at the end: a spindle whose largest loops fall past the middle, with the last about .55 of the largest.
  Loop pitch is 50–61 px, so each loop is 1.0–1.2 pitches long and overlaps its neighbours. The loops are 2.3–2.5 times as long
  as they are wide and lie within ~10° of the sweep. The left wing's loops measure 44, 44, 41 and 39 px.
- **Rosettes** (the ABC headpiece, 0414; read by eye on a 25 px grid, not by script). B's rosette is about six overlapping ovals.
  Each is .4–.7 of the rosette across and overlaps its neighbours by 20–40 %. The largest sit at the foot, so the silhouette is
  scalloped and never a circle. Inner arcs pass behind the letter. There are small curls with dots and thorn accents between
  them, all hairline; the shade belongs to the letter.
- **Composition.** Asymmetric but balanced: a sweeping entry, a cluster, and a long exit tail ending in a curl, a hairline point
  or a ball (0040, the WIT bands of 0124, the dove's tail).
- **Movement.** Each loop is entered and left the way the hand was already going. Its size changes with where it sits (the
  arm's free swing at the foot and outer right), not with jitter.

### The generator (kit/styles/copperplate-hand.js)
The chains' loops are true ellipses (`loop` with `aspect`, the turning of an ellipse a/b), at 2.2 in the filler and break and
1.8 in the paraph. The measured 2.3–2.5 is taken a little rounder, so the loops still read as loops at text size. An earlier
version modulated the radius with the heading (`oval`); that saturates near an aspect of 1.6. The rosette's ovals and the
quotation's knot keep it.

A flourish is a plan of intentions executed by a pen with momentum. The heading turns at a curvature that follows the
intention through a lag, so direction and bend carry from one step into the next.
- **Steps:** `go` (steer for a point with a look-ahead), `loop` (an oval turn), `curl` (the measured terminal curl, ×.38 a turn),
  `run`, `path` (a planned path laid as it is) and `follow` (a planned path followed with momentum).
- **Chains:** `chain(a, b, n, size)` lays a chain of loops on a sweep with the measured spindle and overlap.
- **Rosettes:** `rosettePlan(c, stations, {A, B, rho, size})` plans the rosette's ovals. Its joins are rounded by `smooth()`, as a
  hand rounds them.
- **What failed:** a ring of copies (stage 1) and pure pursuit round the stations (it scribbled). A planned rosette followed with
  a short look-ahead oscillated, because the look-ahead was shorter than the lag.

### The pieces (both directions)
- **Drop:** Pinyon's capital (C) or Imperial's (B), with six overlapping ovals round it. Their sizes come from the arm's reach,
  so the largest is about 1.6× the smallest (scale factors .86–1.37), and the stations fall where the hand puts them (±7°). The ovals are written as one movement,
  entered by a short sweep and left by a tail under the letter closing in a curl and a ball. Only the tail's swell is shaded, as
  Bickham's flourish is hairline round a shaded letter.
- **Paraph:** two loops riding a rising hairline, then a curl and a ball.
- **Filler:** one gesture: a fine run that swells as it reaches one to three loops (by the room, spindle-sized), then a curl and a
  ball. The rest of the line is left quiet.
- **Break:** an entry from a curl, a cluster of four loops a little right of the middle, and an exit sweep down and up into a curl.
  The sweeps carry the lenses.
- **Quotation:** in along the head from its far end, a single knot at the corner, then down the margin into a curl and a ball.

### B · the pen, refined
The quill keeps its charge along a long hairline: the slit feeds ink down as the hand goes (`use` 1.2, the charge drawn back
toward .7). The long rules no longer run dry and grainy. The break and quotation now use the same movements as C.

### ?draw (built)
Each panel is written as it comes into view (IntersectionObserver), and never under reduced motion. The order:
1. The capital is written along its skeleton by `letterWriter`, in the hand's order.
2. Then the flourish:
   - C: `engraveWriter` makes the finished print at once and gives every device pixel the time of the nearest point of the stroke
     that cut it, then lays the pixels as their time comes. The cut runs along the line with a crisp front, each pixel laid once,
     nothing fading.
   - B: `quillWriter` runs the ink engine's pen in real time, with the medium's window shown live over the page.
3. Then the paraph, filler, break and quotation, each at the hand's pace: quick on long runs, slower into turns (the two-thirds
   power law), easing at the ends.

A panel takes about 10 s to write. The page has one hand: panels that come into view together join one queue in reading order,
and a single runner writes the queue, so two pieces never share the ink media at once (frames in the scratchpad:
shots/dh-*.png, dp-*.png, dpp-*.png).

### Speed
Chrome, a panel's five pieces, load average 9–10 on the shared machine, the first panel including the engine's warm-up:

| direction | light, dpr 1 / 2 | dark, dpr 1 / 2 |
|---|---|---|
| pen | 113 / 120 ms | 54 / 56 ms |
| hand | 132 / 159 ms | 70 / 74 ms |

### Where it stands (my read, beside the master at 1× and 4×)
C's drop now reads in Bickham's idiom: varied, overlapping, scalloped ovals round a legible capital. What it still lacks
against his:
- the small inner curls with dots and the thorn accents among the ovals;
- his finer hairline at page size (ours is floored at 1.2 device px).

The filler and break are restrained single gestures. Bickham's dove wing runs its chain along a strong shaded sweep, and ours
runs it more lightly.

B is the same composition in iron-gall ink. The pen's pale hairlines make its drop the lighter and more legible of the two.

## Stage 3: the flexible pen's weight; B and C kept apart

The user's verdict on stage 2: the iron-gall pen's loops vary in weight, and ours read as "random circle digital lines";
the shades are missing; B and C must stay independent ("what happened to B's circle, which was distinct and interesting?").

### Measured: the width round one of Bickham's ovals
The stroke is the loop with a terminal curl on 0040. It was traced through its crossings by `walk.py` (a skeleton walk that
takes the straightest way on at each junction, with widths at crossings dropped) and plotted by `plotw.py`. The evidence is
research/copperplate/width-bickham-oval-vs-model.png: the master's widths in black, the model on the master's own path in red,
the stroke's direction as a band of colour under the plot.
- **Two swells, one on each side of the loop's turn.** In writing order, 7–8 px heading one way and 6 px heading the other,
  on a 2 px hairline (the scan's floor). The far side is ~.75 as heavy.
- **How the width falls off the axis:** about .8 of the peak 30° off it, .55 at 45°, .25 at 60°, and hairline past ~65°.
- **Timing:** the swell sits nearly in phase with the direction, building and releasing over about a quarter of the loop's
  radius.
- **Scale:** the peak is ~.085 of the local radius (8 px on a ~95 px loop).
- **The pen refs** (Forbes' lion, by direction): the pen's shade lies on the down-slant strokes (~60° in the image) and only
  that way.

### The model: `press()` in kit/styles/copperplate-print.js
1. The target pressure at each point is how nearly the stroke heads along the shade axis, (cos d − cos 62°)/(1 − cos 62°).
   Heading the other way, it presses `reverse` as hard: 0 for the pen, .7 for the engraver.
2. The hand's pressure follows that target with a lag of a quarter of the local radius, so the swell builds and releases
   smoothly and is fullest a little past the middle of the sweep.
3. A tight turn holds the peak to .09 of its radius.
4. The hairline swells a little where the hand slows and thins where it is quick, so no line is drawn at a constant width.

Run on the master's traced path, the model lays both swells in place, at the right heights and widths (the plot). For the pen
(B), the same pressure is the Pen's width multiplier, so the ink engine pools at the swell's end and in slow turns. For C,
it is the engraved stroke's outline.

### B · the writing master's pen (its own grammar again)
- **The drop:** stage 1's composition, which the user liked: one great oval on the slant round Imperial's capital, entered as a
  hairline from below left and run once round and a little more. The quill opens down its left side, where the hand pulls
  down the slant, and nowhere else. Two dot-curls sit inside.
- **The other pieces:** the copybook's oval (paraph), a compound curve into a small oval (filler, break), and a rule into an
  oval at the quotation's corner.
- **The quill's hairline** is held at 1.1 device px or more; under that, the paper's tooth breaks it into beads at dpr 1.

### C · command of hand
- **The rosette's ovals:** the generator turns a second, smaller oval inside the larger ones at the foot (`nest`), so ovals sit
  within and through one another. Every oval swells on both sides of its turn, the far side lighter.
- **The accents:** three dot-curls in the gaps, and two thorns (small shaded commas ending in a hooked point) beside the letter.
- **The capital:** Bickham's rosettes hold a heavy text capital, so C now uses UnifrakturMaguntia (OFL, the unmodified file
  already in fonts/) at its own weight. It anchors the ovals, and it keeps C clearly apart from B's script.
- **The other pieces:** C keeps its loop chains (paraph, filler, break) and the knot at the quotation's corner, now weighted by
  the engraver's pressure.

### Speed
Chrome, a panel's five pieces, load average 9–16, the first panel including the engine's warm-up:

| direction | light, dpr 1 / 2 | dark, dpr 1 / 2 |
|---|---|---|
| B (pen) | 176 / 158 ms | 72 / 55 ms |
| C (hand) | 100 / 152 ms | 60 / 91 ms |

### Where it stands
**C.** At 4×, beside Bickham's B, C now reads as his kind of work: shaded ovals within and through one another round a heavy
text capital, dot-curls, and a tail. It falls short in two ways:
- At page size the rosette is dense and dark, because the hairline is floored at 1.2 device px where his is finer.
- The Fraktur capitals (L, S) are harder for a modern reader.

**B.** It is distinct again: one shaded oval in iron-gall ink, clearly a pen.

**Both.** The shade now comes from the pen's pressure along the stroke rather than from lenses laid by hand.

## Stage 4: B made by a hand; C lighter, lace not knot

The user on stage 3: "refine both, now we're cooking. B needs to feel more drawn/engraved/etched — it's too digital still."

### B, term by term (before/after on the B drop at 4×; scratchpad shots/t4-*.png)
Each term was tested alone against stage 3. Only the terms that moved the picture toward the refs were kept.

| term | what was tried | what it did | kept |
|---|---|---|---|
| 1 geometry | The oval no longer closes on itself: it turns in ~×.9 over the turn. Champion's O is written as a spiral, its inner turn well inside its outer (scratchpad walk-O.json). The slant drifts ~3° through the turn (the stroke-to-stroke slant sd is 4°), the middle is carried on ~3 % by the arm, and one side is ~5 % fuller. All of it follows the turn's own progress; none of it is noise. The oval now begins at its foot, moving right, so the hairline entry runs straight into it with no corner. | The end passes inside the start, as a written oval's does, and the entry is one movement. This is the largest change. | yes |
| 2 ink: wetter | iron-gall wetness .3 → .45 | more pooling at the swell's end and slow turns; small | yes |
| 2 ink: rails | the engine's rim term (the flexed tines draw the ink to the swell's two edges), .7 | the swell's edges are darker than its middle, as the Forbes lion's are; visible at 4×, faint at 1× | yes |
| 3 paper tooth | rough .6 → 1 | nothing visible at 1× or 4× | no |
| 4 the letter written by the pen | the face's skeleton walked into strokes and written by the same pen, at the face's own half-widths (`glyphStrokes`) | The capital broke into separate strokes with gaps at the joins and lost the face's swells: worse | no (the code stays, off) |

The ellipse fit (py/ellfit.py) did not give a usable number: at the scan's 8 px/mm the walk stops at the O's crossing, and the
0040 loop is a spiral, not an ellipse. The geometry term's amplitudes are therefore set from the spiral read by eye and from the
slant's measured sd, not from a residual. They are marked so in the code.

### C, lighter
- **Fine hairlines.** C is now laid flat: the coverage itself, anti-aliased, not through the ink engine, which breaks a line under
  ~1.2 device px into beads. Its hairline is the master's tenth of a shade, never under .55 of a device px. Seen small, that is a
  fine grey thread, as an engraved hairline is.
- **Swells only on the down-sweeps.** The engraver's second side is off (reverse 0, falloff 55°), so most of each oval is hairline
  and each swells once, where the hand pulls down.
- **A lighter capital.** UnifrakturMaguntia with its shades cut back 42 % (`thinShades`). The other OFL blackletters, compared on
  a specimen (scratchpad shots/blackletters.png): Grenze Gotisch at 200–400 (light, but a narrow textura and less like Bickham's
  curved Fraktur), Texturina, Pirata One, Fruktur, UnifrakturCook (all heavier).
- **Unchanged:** the nesting, the dot-curls and the thorns. In ?draw the capital is cut along its skeleton's order (letterWriter's
  walk), then the ring.

### Speed
Chrome, a panel's five pieces, load average 12–23 on the shared machine:

| direction | light, dpr 1 / 2 | dark, dpr 1 / 2 |
|---|---|---|
| B (pen) | 136 / 152 ms | 69 / 86 ms |
| C (hand) | 121 / 123 ms | 51 / 86 ms |

## Stage 5: B's line made crisp; C's crescents eased

The lead's review of stage 4, beside Champion's B: the gap is the line itself, not the movement.
- **Champion:** hairlines that are a single crisp, near-black thread; shades with sharp edges that enter and leave the hairline in
  a clean cusp; black ink.
- **Ours:** soft-edged, brown and broad. The ink engine's spread is what reads as digital.

### B (?line=engine shows stage 4 for comparison)
- **Line.** B is now laid flat, as C is: the pressure-weighted strokes' own coverage, anti-aliased, crisp, with no engine spread.
  - The shade's edges are sharp, and its ends run to points through the pressure's taper.
  - The hairline is a twelfth of the piece's shade, as Champion's is about a tenth, and never under .6 of a device px. At 4× it
    is a single crisp thread.
  - The hairline's speed term is eased (.3 → .12), so the oval's thin side runs steady.
- **Ink.** Black-brown iron gall, 46 32 24, in place of the milk-chocolate 64 41 28. It goes deeper (22 14 10) where the ink
  pooled. `poolMap()` places the pools from the stroke's own causes: where the hand was slow (time per px over 1.3× the stroke's
  median, into turns and at the swell's let-go) and at the touch-down and the lift. The engine itself is kept nowhere: at the
  page's size its pooling was the softness.
- **The capital.** Imperial's shades are cut back 40 % (was 30 %). `thinShades` now also clears the face's own anti-aliased
  fringe outside a cut-back edge, which had left a faint ghost of the old outline (visible at 4×).
- **Composition and movement:** unchanged.
- **?draw.** B is revealed along each stroke at the hand's pace (engraveWriter, flat, with the pool tint), the capital first in
  its skeleton's order.

### C
The heaviest crescents are eased: the oval peak goes from .03 to .024 of the drop, and a tight turn's shade is held to .07 of its
radius.

### Speed
Chrome, a panel's five pieces, load average ~10–12. B is faster now, without the engine:

| direction | light, dpr 1 / 2 | dark, dpr 1 / 2 |
|---|---|---|
| B (pen) | 77 / 109 ms | 36 / 50 ms |
| C (hand) | 119 / 122 ms | 56 / 77 ms |

## Stage 6: B as one written gesture; C's capital clean up close

### B: one gesture
The user on stage 5: "B everything needs to be more connected". The parts sat near one another: the oval, the capital, two
loose curls, and an entry crossing in on its own. Now every element grows out of another:
- **Touch-down into the capital.** The pen sets down in a small curl just outside the capital's free end that lies farthest up
  and right, and runs into the letter along the letter's own stroke.
- **The capital.** The face's body is the pen's next stroke (letterAfter). The face is kept whole: writing all of it with the pen
  broke it in stage 4.
- **The capital's last end into the oval.** The capital leaves by its free end farthest down and left, in one smooth sweep out
  and round the foot. It arrives along the way the oval sets off, so there is no corner. This sweep's pressure is eased to .3,
  so it does not drown the oval's swell.
- **The oval's terminal.** The great oval turns, opening down its left side, and closes inside itself into an inward curl and
  a ball.
- **How the joins are found.** The capital's free ends come from its skeleton (`letterEnds()`): the ends of
  glyphStrokes' walk, each with the way into the letter.

?draw follows the pen in order: the touch-down curl, then the capital along its skeleton, then the sweep, the oval and the curl.

B's other pieces were already single strokes, each ending in a point or a ball: the copybook oval, the compound curve into a
small oval, the oval in the break, and the rule into an oval at the quotation's corner.

Ways tried first, which made a hairpin below the letter:
- running the oval's end on into the nearest free end of the capital;
- choosing the end jointly with where the oval should leave off.

The capital's ends all point back against the oval's direction there.

### C's capital (tests/copperplate-caps.html: the capital alone at 1×, 4× and 8×, by cut)
- **Stage 4's cut was what read as wonky.** `thinShades` works on the grid itself, so at 4× its edges stepped and waved, and the
  joins pinched and bit. Eroding an outline rounds its reflex corners, and Maguntia's joins are sharp reflex corners.
- **Tried: a vector offset** (`cutShades`, the glyph's outline stroked away at a ladder of widths). The edges were smoother, but
  the joins still bit. The face's contours overlap inside the letter, and stroking the outline cuts along the internal overlaps
  too. Kept in the code, not used.
- **Used: `thinShadesFine`.** The cut is worked at twice the grid and box-filtered back down, so its steps fall below a cell. The
  cut letter is then closed back over its own body: dilated and eroded by the cut's depth, never past the face's own outline.
  Notches narrower than the cut fill, and each stroke keeps its new weight. B, L, R and S at 4× now have smooth edges and whole
  joins (scratchpad shots/caps3-4x.png).
- **At page size** the weight is a touch heavier than stage 5's (the closing gives back the joins).

### Speed
Chrome, a panel's five pieces, load average 5–9:

| direction | light, dpr 1 / 2 | dark, dpr 1 / 2 |
|---|---|---|
| B (pen) | 77 / 96 ms | 37 / 47 ms |
| C (hand) | 141 / 184 ms | 91 / 115 ms |

The fine cut costs C about 20–60 ms, which puts C's light page at dpr 2 near the 200 ms line.

## Stage 7: on the page

Copperplate joined rubricate as a written style (`kit/styles/copperplate.js`, kinds `pen` (B) and `hand` (C)), registered in `WRITTEN` and `all.js`. The pieces moved to `kit/styles/copperplate-pieces.js`. Every rank of the page is covered: drop and line initials, paraphs, fillers and heading run-outs, three breaks, quote, aside, pull quote, figure, code and contents. There are five rich levels and seeded pages, and `?draw` writes along each path in the hand's order. Each stroke is laid as one ribbon outline rather than a run of discs, which takes about a tenth of the work. Test page: `tests/copperplate.html` (`?kind`, `?theme`, `?rich`, `?lines`, `?draw`, `#seed=`).

## Stage 8: B's line, B's forms; C's seeds and levels

User: "the lines on B are too thin and are aliasing. C looks good and is ready for the seed/speed/richness pass".

**B's hairline.** The crisp hairline is now a tenth of the piece's shade (a twelfth for the drop, whose shade is large), with a floor of 1.1 device px: `penHair(d, pk, ratio)`.
- Under about 1 device px, the coverage of a shallow line falls between rows and reads as steps and beads.
- At 1.1 px the thread is continuous at dpr 1, 2 and 2.75, and the line's edge, points and colour are unchanged.

**B's forms vary down the page.** Each form is chosen by a hash of the piece's own seed, which carries its index.
- Paraph:
  - the copybook oval;
  - the oval turned on into itself (a ring and a half, closing to a dot);
  - a knot of two loops rising across the slant.
- Line end:
  - the compound curve closing in an oval;
  - the curve rising into a curl and a dot;
  - the curve with one oval turned in its run.
- The drop's capital is larger in its oval (cap .74 H, from .66), so it fills the four lines it stands in.
- The aside is no longer a bracket. A hairline falls down the margin from a dot and turns once through an oval on the slant at its middle. The oval carries the only shade, and the fall stays a hairline: as one shaded gesture, the long downstroke took the shade and read as a parenthesis.

**C, seeded pages.** These choose only on a page given its own seed. The unseeded page at usual (the approved page) is pixel-identical to stage 7: light and dark at dpr 1 after all edits, and dpr 2 earlier in the pass. Plain and modest were changed on purpose (five and six ovals, no nesting).
- The rosette: five to seven ovals; where the ring begins; the nesting (at the foot, none, all round); the side the hand comes in from (mirrored entry and exit).
- The end rosette chooses the same way.
- Paraph:
  - two loops on a rising hairline;
  - the trefoil knot to a dot;
  - one loop and a long curl.
- Filler:
  - the fine run with loops at its end;
  - the dove's wing (the loops riding a lightly shaded sweep of their own);
  - one loop and a tightening curl.
- Break:
  - the band;
  - the wing across the measure;
  - the twin (two clusters facing about a dot-curl).

**C, richness.**
- Plain: five ovals, no nesting, no accents, no fillers or frames.
- Modest: six ovals, no nesting.
- Usual: the approved stage 7 page.
- Fine: nested round the lower half, the end rosette larger (10u), some fillers are wings.
- Lavish: seven ovals, a third thorn, the end rosette 12u, paraphs and fillers in all three forms.

I tried wings of loops either side of the lavish end and dropped them: the turned wing put its heavy sweep against the rosette.

**Figure corners** are held inside the viewport, which matters on a phone where the figure's box runs to the gutter.

**Speed** (in view / whole page, ms, 1440 wide, measured on a shared machine; worst of light and dark):

| | dpr 1 | dpr 2 |
|---|---|---|
| B usual | 82 / 127 | 101 / 151 |
| B lavish | 78 / 123 | 85 / 154 |
| C usual | 105 / 176 | 140 / 240 |
| C lavish | 111 / 182 | 143 / 224 |
| C lavish, seeds 1/3/5 | | 117–152 / 187–232 |

**Checks.**
- `?draw` finished pages equal the still pages for the pages below. Each differs by the same 212 px, all at the fixed theme toggle on the right edge: B; C seeds 1 and 3; C lavish; C fine with seed 5.
- At 390 wide nothing crosses the page edge.
