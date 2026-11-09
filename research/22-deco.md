# 22 · Art Deco: the cut, the gold and the rule

Paris and beyond, c. 1920–1935, as a rubricate style. Stage 1 is research, the medium, the letter source and three direction
studies (tests/deco-directions.html, drawn by tests/deco-directions.js and printed by kit/styles/deco-print.js). The style
waits for the user's choice. Raw downloads, measurement scripts and screenshots are in the session scratchpad (deco/raw,
deco/py, deco/shots, deco/LOG.md), not the repo.

## Sources, studied at full size

| what | where | licence | used for |
|---|---|---|---|
| Anna de Noailles, *Les Climats*, ill. François-Louis Schmied (Société du livre contemporain, 1924), 167 pp., 4267×5788 | Commons, *Noailles - Les climats, 1924.djvu* (from Gallica bpt6k852384k); pages at `thumb.wikimedia.org/…/page{N}-3840px-…`; crops in *Category:Illustrations for Les Climats by François-Louis Schmied* | public domain (Schmied d. 1941; PD-old-auto-expired) | the book page: gold bars, the gold-square initial, the paraph square, the inverted-triangle culs-de-lampe, rays and stars (pp. 21, 23, 36, 50, 94, 120, 124, 137) |
| E.-A. Séguy, *Prismes: 40 planches de dessins et coloris nouveaux* (Charles Moreau, 1930), 2301×3174 | archive.org `prismes40planche00segu` (Glasgow School of Art Library) | the scan CC BY-SA 3.0; the plates PD in the EU (Séguy 1877–1951); three crops in tests/deco-refs/ with attribution | pochoir: pl. 27 (n044: concentric bands, stepped clouds, gold powder, seams), pl. 1 (n004: the tampon), pl. n006, n008, n022, n058 |
| Serge Gladky, *Fleurs: texte et vingt-six planches en couleurs* (Synthe, 1929) | archive.org `fleurstexteetvin00glad` (GSA) | scan CC BY-SA 3.0; Gladky's dates unknown, so studied only and not reproduced | the geometric pochoir flower: arcs, sawtooth, stacked segments (n016, n054) |
| George Barbier, *Falbalas et fanfreluches* 1925 | archive.org `falbalasetfanfre00barb` (GSA) | scan CC BY-SA 3.0 (Barbier d. 1932: PD in the EU) | pochoir plates with lettered titles; text pages |
| *Gazette du Bon Ton* 1922, no. 8 and 10, lay-out pages (RP-P-2009-1962-19/20, -1964-19) | Commons (Rijksmuseum) | CC0 | text set beside two-colour pochoir (black and coral pink); Cochin type |
| Chrysler Building, lift doors (1930) | Commons: *Elevator doors of Chrysler Building (1927-30).jpg* (CC BY-SA 4.0), *Chrysler Building elevator doors closed.jpg*, *Lift door Chrysler Building Lobby.jpg* (CC BY 2.0) | photographs, in copyright (CC BY / BY-SA); looked at only, not reproduced | the lotus fan: petal count, scalloped tips, the collar; inlaid metal line |
| Deberny & Peignot, *Spécimen des caractères en bois* (1930), *Caractères d'affiches* (1937) | archive.org `deberny-et-peignot-specimen-des-caracteres-bois`, `specimen-caracteres-d-affiches-deberny-et-peignot-1937` | scans CC BY-NC-SA 4.0 (looked at only) | display letters of the period (the letter survey's overlays) |
| Bénédictus, *Nouvelles variations* (1924), *Relais* (1930); Saudé, *Traité d'enluminure d'art au pochoir* (1925) | Smithsonian Libraries records (CC0 metadata) | no images online that we could reach | **gap: Bénédictus, named in the brief, has not been seen at full size.** NYPL Digital Collections and Cooper Hewitt are the next places to look; Gallica returned 403 to the letter survey |

## The book page (Schmied, *Les Climats*, p. 23; units of the line pitch, 117.7 px at 3840 wide)

- **The title:** a gold bar from the left margin (it starts at the initial's left edge, so it hangs a column into the margin)
  to the title, set in widely spaced capitals at the right: bar 6.2 × 0.77 pitches.
- **The initial:** a black roman capital (a book face, not a display face) on a gold square three lines deep:
  2.5 × 2.8 pitches (W:H ≈ 0.9), the letter's cap ~80 % of the square's height, centred. No frame, no ornament.
- **Stanza breaks:** short gold bars, 3.4 × 0.68 pitches, aligned to the text's left edge.
- **The paraph:** a small gold rectangle in the line, 0.77 × 0.5 pitches, before the sentence it marks.
- **Culs-de-lampe:** an inverted triangle, ~1.04 as tall as wide, outlined in black at **1.7 % of its width**, holding a
  picture in flat planes (p. 21); roundels and squares elsewhere. Rays and gold stars on p. 137 (La Terre); three dots end
  a poem (pp. 36, 50).
- **The gold** (the scan's median) 173 130 72 on paper 232 219 198: a flat coat with a slow mottle (sd 19.6 L at mean 150,
  ~13 %) and a fine tooth (sd 2.4); soft at its edge.

## Pochoir, measured (Séguy, *Prismes*; scan px, the plate ~2300 px wide)

The scan's metadata says 300 ppi but the leaves are not that size at that resolution; the numbers are kept in px and as
fractions of the plate.

- **The coat is flatter than the paper.** Gouache red: fine sd 2.0, slow sd 0.7 L; bare paper: fine 4.5, slow 8.5. The
  colour carries no texture worth drawing. (nouveau-print.js's `pochoirTex` adds ±15 % dabs: 10–20× too much; it would read
  as a grunge filter.) Metallic is the exception: the gold-powder band, fine sd 4.4, slow 15 at mean 133 (~11 %).
- **The cut.** 19 straight horizontal runs of the stepped clouds (pl. 27): on the true straights the edge wanders sd
  0.3–0.5 px (~0.02 % of the plate: a knife cut), but **each step leans by its own angle, 0.3–2.2°** (slopes 5–38/1000,
  median ~14/1000 ≈ 0.8°). The hand is the angle of each cut, not noise on the edge. The 10–90 % edge is ~5 px (scan blur
  and the gouache's creep).
- **Registration.** Where red was laid over mint (pl. 27) there is a seam darker than the red by 18 L (p90 29), ~2 px wide:
  the films overlap. Between red and ochre neither a paper sliver nor a seam (min −0.6, max +1.8 L): those were trapped
  under each other. The rule: colours overlap, never gap; an overlap reads as a thin darker line on the later colour.
- **The tampon** (pl. 1). The white bands are solid from the stencil's cut for about two thirds of their depth and then
  dissolve into flecks (runs along a row: median 16 px, ~0.7 % of the plate) toward the open side. It is the period's one
  gradient, and it is a density of flecks, not an alpha ramp.
- **Palettes** (k-means). Pl. 27: mint 206 214 155, red 149 38 3, cream 224 230 181, ochre 196 124 28, blue 62 99 161,
  gold 243 198 92. Pl. 1: blues 118 169 184 / 92 145 161 / 50 94 103, cream 227 226 189, coral 217 68 15. Pl. n022 (a dark
  ground): ink blues 17 73 94 / 9 58 76, sky 105 162 189.
- **The vocabulary** of the plates: concentric bands (rainbows, fans) cut by stepped horizontal "clouds"; zigzags and
  chevrons as stepped bands; leaves and flowers reduced to stacked arcs and sawtooth (Gladky); white crystalline line over
  flat colour.

## The lotus fan (Chrysler lift doors)

Per door, five light petals between four or five dark, spreading ~90° from a bound waist (a collar of chevrons), each
petal's tip a concave scallop with a small spur where neighbours meet; concentric arcs behind; a constant-width metal line
(the inlay's strap) outlining every field. Angular pitch ~10° a petal.

## The medium first (kit/styles/deco-print.js)

The lesson of Insular: the paint will not read as real if the geometry is perfect, and noise in the paint is not the hand.
So the media are cheap and the hand is put in the geometry at the master's amplitude.

| medium | how it was made | what we do |
|---|---|---|
| **gouache** (pochoir) | opaque colour dabbed through a hand-cut stencil, one stencil a colour | a flat coat (.9 of coverage, ±1.5 % slow field: the engine lays a full coat above ~.55); each straight side of a cut leans ~0.8° (sd) by moving its ends (`cut`); arcs breathe 0.25 % of their radius; each stencil slipped ≤0.6 px and trapped 0.35 px; where its rim lies over an earlier colour a seam at 0.7 of its colour is poured (only there) |
| **stipple** | the tampon worked in from the cut and lifted | hard flecks from a two-scale dab field thresholded against the distance from the cut: solid to `solid`, then thinning to nothing |
| **metal** | gold or silver ink (or bronze powder) | a coat with a slow mottle (sd ~13 % of density at a third of the shape) and a fine tooth (~3 %); no gradient, no sheen, no bevel (the user's 1999 WordArt verdict) |
| **press** | letterpress, black and a second forme | the forme's edge pushed in and out by the paper's grain (≤.05 px at page size), in register |

Each ink is poured through the ink engine (kit/inkletter.js inkLetter), so every edge has the engine's creep and drying.
Speed (Chrome, DPR 2, a panel's five pieces: initial, paraph, filler, break, corner): pochoir 60–128 ms, l’or 31–69 ms,
le filet 30–62 ms; the first of each includes the engine's warm-up. Within the 200 ms page budget.

## Letters

(See the survey below; the letter shapes come from open-licence faces, applied by the medium. Never drawn from code.)

A survey of ~140 open-licence cuts (each licence file read; Saarland, HiLo-Deco, Zabatana, CutMeOut rejected for licence
evidence, Universalis and Plastik Deco for GPL/LGPL, Wiegel's Steffmann-derived faces for private-use terms) against period
letters cropped from the ATF *Book of American Types* (1934; published without notice, PD), the Bauer *Futura* booklet
(1931), Bifur (Letterform Archive scan, 1929), Peignot (1937, reference only) and the *Gazette du Bon Ton* title (1912, PD).
Overlays scale the candidate to the period letter's height, never stretch it; IoU = shared ink / combined ink, skel = mean
centreline offset in % of the cap height (the fair measure for hairline faces). Evidence in research/deco/ (the ATF overlays)
and the session scratchpad (deco/fonts/overlay, specimen-*.png, bigcaps-*.png).

| use | face | licence | what the overlay showed | shipped |
|---|---|---|---|---|
| A pochoir | **Italiana** (Santiago Orozco) | OFL, RFN "Italiana" | vs ATF Parisian: the same single-thick-stroke logic in A and M, skel 3.4 %, width ~1.0; lacks Parisian's looped B and R; vs Peignot: width 1.00, skel 2.9 %, hairlines ~5× finer. At drop-cap size it carries flat colour best | fonts/deco/Italiana-Regular.ttf + Italiana-OFL.txt |
| A alternate | Federo (Cyreal) | OFL, RFN "Federo" | vs Peignot: B IoU .75, R .74, thin ×.98; A crossbar low, M splayed | Federo-Regular.ttf (?fa=Federo-Regular.ttf) |
| B l'or | **Fanwood Text** (Barry Schwartz) | OFL | the master's letter is a book roman, not a display face; no open Cochin exists. Vs ATF Nicolas Cochin, Fanwood is the least bad: I .77, Q .66, E .48, M .12 (no splayed M, no spurred serifs) | FanwoodText-Regular.ttf + FanwoodText-OFL.txt |
| B alternate | Kalnia Bold (Frida Medrano), instanced to wght 700 (no RFN, so instancing is allowed) | OFL | vs ATF Ultra Bodoni: IoU .70–.78 on every letter, width ×.81–1.06, thin ×1.0: the 1928 fat face | Kalnia-Bold.ttf (?fb=Kalnia-Bold.ttf) |
| C le filet | **Limelight** (Nicole Fally, Sorkin) | OFL, RFN "Limelight" | vs ATF Broadway: O IoU .93, mean .70 (best of all tested), the same heavy-stem-and-hairline-bowl construction; 13–25 % narrower, hairlines 1.2–2.5× heavier | Limelight-Regular.ttf + Limelight-OFL.txt |

Not shipped but noted: FuturaRenner sits on Bauer's 1931 Futura (IoU .67–.90, skel .3–1.3 %) but is a ragged trace of metal
type and carries a trademark name (rename and smooth before use); Gudariak Regular + Txano is a two-layer face, the structural
analogue of Bifur (silhouette B .93, R .88), with a Spanish Civil War poster provenance; Dorsa (Benton's Empire), Big
Shoulders Inline and Imbue for a skyscraper direction. **No open revival exists** of Bifur, Acier, Cochin, Kabel, Peignot,
Parisian or Broadway. Bodoni Moda was tried for A and failed at page size: its hairlines vanish (shots in the scratchpad).

## Stage 1: the three directions (tests/deco-directions.html)

- **A · Pochoir** (Séguy, Gladky, Iribe). The drop initial is a stencilled plaque: a mint ground, a sky worked in with the
  tampon and lifted toward the foot, three bands over it (red, ochre, a thin gold-powder band), stepped clouds crossing the
  bands at the corners, the letter last in black (cream in dark, on a deep teal ground with a dusk-blue tampon). Paraph:
  Iribe's rose, a lobed red disc whose petal folds are the stencil's ties, two leaves with a tie for a vein. Filler: stepped
  cloud bars to the measure. Break: a rainbow fan between stepped clouds. Corner: a stepped band with a quarter fan.
- **B · L'or et le noir** (Schmied). The gold square with the black capital, its ground a fan of fifteen rays in a second,
  paler gold rising from the foot; paraph a gold rectangle at the master's proportion; filler Schmied's title bar run to
  the measure; break his inverted triangle (outline 1.7 % of its width) filled with rays in two golds, flanked by bars;
  corner a gold bar with a pair of hairlines stepped twice round the angle (an inlaid line). Dark: gold on black, the letter
  still black on its gold.
- **C · Le filet** (Deberny & Peignot's display specimens, Cassandre, the Chrysler doors). Letterpress rules in black and
  vermilion. The initial in a stepped (ziggurat) frame of two red rules, the letter solid with its shadow a ruling of
  horizontal lines; paraph the lotus fan (five petals, alternating colours, scalloped tips, a collar); filler three speed
  lines tapering in weight to the measure after a red square; break a ziggurat holding a fan, speed lines to both sides;
  corner a triple rule stepped round the angle. Dark: aluminium ink and a lighter vermilion on black.

Every rule is at least 1.2 px. Animation is designed for, not built: a pochoir colour is laid by sweepIn's stencil brush (one
stencil after another, as the plates were coloured), a printed piece by its press (the impression comes up as the platen
rolls), the rays of B and the fan of C can open from their centre. Nothing fades or pops.

## Scores (research/05-the-bar.md; my honest read of stage 1, at 1440 and 390, 1× and 4×)

| # | criterion | A pochoir | B l'or | C le filet |
|---|---|---|---|---|
| 1 | Beauty (×3) | 2 | 2 (closest to 3) | 2 |
| 2 | Craft at every scale | 2 (the tampon reads as sand at 4×) | 2 | 2 |
| 3 | Holds at every viewport | 2 | 3 | 2 |
| 4 | Integration with the text | 2 | 3 (Schmied's own page grammar) | 2 |
| 5 | Behaviour | 1 (no ?draw yet) | 1 | 1 |
| 6 | The system is the work | 2 | 2 | 2 |
| 7 | Living imperfection | 2 (lean of each cut, slip, seams, tampon) | 2 (mottle, lean) | 1 (press edge only) |
| 8 | Restraint and the void | 1 (the initial is busy) | 3 | 2 |
| 9 | History without pastiche | 2 | 2 | 1 (closest to poster pastiche) |
| 10 | Longevity | 2 | 3 | 2 |
| 11 | Point of view | 2 | 2 | 2 |
| 12 | Provenance | 2 | 2 | 2 |
| | total /42 | 28 | 34 | 27 |

B is "good work, not yet museum": Beauty is the gap (the rays meet at one exact point; the gold is right in colour and
mottle but has no light in dark mode; the paraph and filler are plain by design). A is the most colourful and its medium
reads truest beside the master (flat coats, seams), but its initial carries too much. C is the most poster-like and closest
to pastiche.

## What to avoid

Gradient gold and bevels; sunbursts as clip art (every ray the same, a perfect centre); noise in a flat coat (the master's
gouache is flatter than its paper); scattered dots; perfect geometry (each cut leans); a colour seam that gaps to paper (the
master overlaps); hairlines under ~1.2 px; Erté-style figures and cocktail-glass pastiche; neon (Monoton-style) and
"Great Gatsby" pastiche fonts.

## Stage 2: le filet, the style (the user's choice: "for art deco, only le filet")

A and B are dropped; the direction page stays as the stage-1 record. The style is kit/styles/deco.js (pieces in
kit/styles/deco-pieces.js, coverage and the press edge in kit/styles/deco-print.js), its specimen tests/deco.html.

**Measured on period letterpress** (ATF *Book of American Types*, 1934, p. 186: a box in Oxford rule, PD; the scan is the
HathiTrust page enlarged ~4×, so its numbers are in its own px): thick 32 : gap 16 : thin 10 (3.2 : 1.6 : 1); edge wander sd
~1 px on both (≈3 % of the thick rule); along the rule, the heavy rule's density is even (slow sd .018) and the hairline's
uneven (slow sd .06, width cv .2, partly the scan); no paper gap at the corners: mitred. No two-colour period job reachable
at full size, so the vermilion's register is set by hand (.32, .22 px, one forme for the page).

**The material, not the look.** Every rule is a piece of brass rule: one piece a side, mitred at a joint and cut a hair short
there (a seam of ~.1 px, seen at 4×), each piece laid ±.04° off true and inked at its own 94–100 %. Sizes are typographic:
the point is the text's (x-height ≈ 4.8 pt); no rule under 1.2 px. The Oxford rule is ATF's ratio; the end break's Scotch rule
thin–thick–thin. The stepped forms step by a constant unit (the initial's head 7 % of its height, twice; three times at the
richest). The sunburst behind the drop initial is set in rule, as a jobbing comp built one: lengths of fine rule radiating from
the frame's foot, long and short in turn, each run out to a hair inside the frame, a channel of paper round the letter's
silhouette (counters filled, so no ray shows through a bowl). The lotus is the Chrysler doors': petals flaring from a bound
waist to scalloped tips between spurs, alternately black and vermilion, a collar binding it to its plinth. The capital is
Limelight (OFL) with a solid vermilion shadow swept down-right (an extrusion, not an offset copy) kept a hairline off the letter,
and, from rich .75, an inline cut down its heaviest strokes (where it lies deepest in the ink).

**Printed.** Each piece's formes become coverage at the device's resolution and are poured by the ink engine (inkLetter: the
ink squeezed to the rim, the edge pushed by the paper's grain), at 84 % of a full coat so each piece's inking shows. On the light
page a third pour, the bite: the impression's shoulder, a shade a fraction of a px wide on the side away from the light (off with
?bite=off; none in the dark). ?draw prints each piece with sweepIn's press: the bite comes up first (a blind impression), then
the vermilion forme, then the black, each rolling along the piece's length. A frame round a box is printed as its four sides
(its middle has no ink and is never made).

**Every case.** Drop initial (4 lines, 3 on a phone) and line initial; paraph (the lotus; a vermilion square at rich 0);
fillers (speed lines after a vermilion square; a heading's Oxford rule); breaks at three ranks (a lozenge between speed lines;
a stepped portal holding a rising sun with speed lines; the lotus on a solid stepped plinth over the Scotch rule); frames:
quotation (an Oxford rule stood in the margin, turned in at head and foot), aside (two stepped brackets), pull (the sun between
speed lines, turned over at the foot), figure (an Oxford box with stepped corners), code (a fine rule, every corner stepped), nav
(a vermilion square on a hairline). Five levels of rich: 0 plain (a single rule round the letter, no fillers, a square for the
paraph), .25 (Oxford frame, one rule fillers, the quotation's rule, the figure's box), .5 default (stepped head, the sunburst,
two-rule fillers, code and aside frames), .75 (the inline, three rules, more petals, a stepped quotation rule), 1 (three steps,
25 rays, four rules, a part's break in a chapter's form, an extra step in every box).

**Speed** (tests/deco.html, Chrome, the whole page's ornament, three runs): light dpr 1 80–121 ms, dpr 2 180–190 ms; dark dpr 1
67–69 ms, dpr 2 131–150 ms. Inside the 200 ms budget, the light page at dpr 2 only just.
