# 11 · Blackletter: what makes a page read as Gothic

The user's Gothic is the blackletter book: textura and Fraktur, bold black and red, cadel capitals of interlaced
broad-pen strokes, dense and dark (illum-taste, 2026-11-06). The Italian choir-book penwork we had called Gothic
stays, renamed. This note is what was studied before kit/styles/blackletter.js was written.

## Sources, studied at full size

All public domain / CC0 unless noted. Raw downloads live in the session scratchpad, not the repo.

| what | where | used for |
|---|---|---|
| Johann Neudörffer the Elder, *Eine gute Ordnung*, Nuremberg 1538–41 (etched writing book, 105 images) | Met 354468 | the title-page cadel E (doubled broad strokes with colour laid between them, crossbands, hairline loops, lozenge dots); Fraktur capitals with flourishes, pp. 33–34, 88–91 |
| Wolfgang Fugger, *Formular*, Nuremberg 1553 | Met 350138 | (looked at: a labyrinth of Fraktur text, not knotwork; not used) |
| Urban Wyss, *Libellus*, Zurich 1549 | Met 349675 | textura alphabet on black: the lozenge foot and head, the ruled double frame |
| Winter Breviary, Constance 1476–78 (26 images) | Met 910582 | textura with red rubrics; red and green lombards; **cord-twist bands** (two strands, red and green, interlaced) between the initial and the text, used as line-fillers and frame bands; the pen staff in the margin |
| Missal, German 1472 | Met 469038 | large textura quadrata, red rubrics, red crosses, red capitals with hairline cadel strokes |
| Missal, 15th c. | Met 469828 | red-and-blue penwork, rubrication |
| Peter Schöffer, *Gart der Gesundheit*, Mainz 1485 | Met 343820 | incunable: printed textura, red capital strokes added by hand |
| Antiphonary leaf, Germany (Augsburg?) c. 1480 | CMA 2014.25.b | **the black cadel G** with a red pen-drawn face in its counter; textura minuscule at a size we can measure (below); red staff rules |
| Book of Hours leaf, Rouen c. 1510 | CMA 2001.79.b | text block **ruled in red, thick and thin rules** running full height — the printed-book frame |
| Book of Hours leaf, Delft c. 1475 | CMA 1999.133 | textura, red rubric, flourished initial (Dutch red/blue penwork) |
| Marco Antonio Rossi, cadel alphabet, 1598 | Commons, "Cadels by Marco Antonio Rossi, 1598.jpg" | **the cadel construction**: each stroke of the letter written two to four times side by side with a hairline of paper between; bundles cross over and under; hooked, curled terminals; lozenge chains and small crosses on the hairlines; fringes of fine strokes |
| Paulus Franck, *Schatzkammer*, 1601 (initials s, v, w) | Commons | the extreme Fraktur cadel: swelling bundles, lozenge knots of strapwork, ladders across bundles. Too dense beside 20 px text; taken only for the knot and the ladder (a band of short strokes across a bundle) |
| Gutenberg Bible, Mainz c. 1455 (OT and NT details, Library of Congress) | Commons (Flickr, no known restrictions) | red rubric lines set in the text; capitals touched with a red stroke; the gold-outlined textura M (a doubled-stroke capital) |
| Mainz Psalter, Fust & Schöffer 1457 | Commons, "Mainz psalter detail" | red text lines, red lombards, the great B printed in two colours |
| David Aubert, *Croniques abregies*, Burgundy | Commons, BnF Arsenal 5089 f. 532 | the Burgundian *bâtarde*: lighter than textura; set aside as the wrong register |

Not reached this pass: e-codices and the BL viewer (no API used); a dated rubricated ¶ at full size (the Gutenberg
details are 600 px). The paraph form below is from the printed ¶ of Schöffer's type and the red capitulum of the
Missal and Breviary, at the resolution available.

## Measurements

From CMA 2014.25.b at the print image's resolution (the minuscule "excelsis"), by dark-pixel runs:

- x-height 83 px; stem (horizontal width of a vertical pull) 19.5 px → **stem ≈ 0.235 × x-height** (x-height ≈ 4¼ stems).
- gap between stems 21–23 px → **counter ≈ 1.1 × stem**: white and black in equal measure; that evenness *is* the
  "dense and dark" the user asked for.
- the cuts at the head and foot of every stem, and the hairline joins, run at **35–40°** above the line: one nib angle
  for everything. The writer's pen defaults to 0.62 rad (35.5°), inside the range; only the bars bound across a strap
  are written at another angle. The head and foot lozenges are not separate marks: the nib makes them when the pen enters and leaves a stem
  with a short stroke down and to the right (perpendicular to the edge).
- Neudörffer's title cadel: the main strokes are ~1/7 of the letter's height, doubled with a gap of ~1/4 of a stroke;
  the hairline loops run 2–3× the letter's height in the margin, but never into the words.
- Rossi's cadels: bundles of 2–4 strokes; each component ~1/12 of the letter's height; gaps ~1/3 of a component.

## What makes it read as Gothic (the checklist the style is judged by)

1. **One broad nib at a fixed angle.** Verticals heavy, the "/" diagonal a hairline, "\" heavy. Curves are broken:
   a bowl is two or three straight-ish strokes meeting at angles, not an ellipse.
2. **Lozenge terminals.** Every stem enters and leaves on the nib's diagonal; points in the text are lozenges, not discs.
3. **Strapwork.** A cadel stroke is a bundle: the same stroke written again beside itself, a hair of paper between.
   Where bundles cross, one goes under: the under bundle is broken a gap's width either side of the over one.
4. **Hairline cadels.** Loops of the nib's thin edge thrown out of the letter into the margin and back through it,
   knotted, ending in a lozenge or a small curl; a ladder (a band of short strokes) binds a bundle here and there.
5. **Black and red.** The letter black; red as the rubricator added it: laid between doubled strokes (Neudörffer's
   colour), a stroke through a capital, a filled counter written with the pen (hatched with adjacent broad strokes,
   never a flat wash), red lozenges. Red in small quantity beside a great deal of black.
6. **Rule and order.** Red ruling, thick and thin, that crosses at the corners and runs past them; cord-twist bands;
   everything square to the text block.
7. **Density.** Equal black and white inside the letter; no thin decoration floating in air.

## What was made from it (kit/styles/blackletter.js, playground/tests/blackletter.html)

- Drop initial: a Fraktur B written as a ductus (hand-authored in a unit box), its stem and bowls doubled into straps
  whose copies close to a point at the ends, red laid in the gap; the bowls run behind the stem; a band of three bars
  bound across the stem's red (the only stroke written at another nib angle); swelling hairline loops thrown into the
  margin and over the head, over and under what they cross, ending in curls; sprigs off the loops; red points in the
  counters. Richness 0..1 picks a budget (loops, sprigs, points, band, a red hairline doubling the lower bowl).
  Only B and L are drawn; any other letter falls back to B (to fix before use).
- Line initial: the same L, one copy, a red stroke beside its stem (the capital touched with red).
- Capitals touched with red: a red stroke down the first capital of each sentence in the running text (Fust–Schöffer
  Bible 1462; not in the plan, found in the 1462 leaf, and the cheapest strongly-Gothic mark there is).
- Paraph: a red capitulum, a C broken into three broad strokes and filled, two stems with lozenge feet. No dated
  rubricated ¶ was found at a usable size; its form is from the printed ¶ and the red capitulum, not measured.
- Fillers: a red rule ending in a lozenge; a row of lozenges black and red on a red hairline; the running-loop cord of
  the Constance breviary in red (a black second strand woven through it on a lavish page).
- Breaks: chapter, Solomon's knot in strap with red between, red rules out to three red points each side; book, a
  braided strapwork band of two red-cored straps with a knot and three points at each end.
- Frames: figure, a painted red bar edged in black with a thin red ruling inside it, the ruling running on past the
  corners (CMA 2001.79.b), the red cord along its head; code, single red rules crossing at the corners with black
  lozenges there; quotation, a thick and a thin red rule down the gutter, crossed at head and foot, a knot over it
  and three points under; aside, a thin red rule crossed at its head, three red points over it; pull quote, the
  chapter knot above and below; contents, a red-cored strap down the margin with a hairline wound round it over and
  under, a lozenge on a short rule at each entry (on a narrow page with no margin, cords over and under the list).
