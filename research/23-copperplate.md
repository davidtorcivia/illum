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
