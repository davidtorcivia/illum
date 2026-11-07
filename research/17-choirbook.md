# 17 · The Italian choir book (style `choirbook`)

The deep pass over 03's penwork initial: the red-and-blue pen-flourishing ("filigrana", French *fleuronnée*) of Italian
Gothic choir books (antiphonaries and graduals, 13th–15th c.). 03 stays as approved; this is its successor, drawn by
`kit/styles/choirbook.js` (registry style, same render path as 03) and shown in `playground/tests/choirbook.html`.

## 1. Sources read at full size

Downloaded to the session scratchpad (`choir-raw/`, `penwork/`, `gold/`); all open access / public domain.

| id | object | used for |
|---|---|---|
| Met 466773 | psalter leaf, North Italian, early 15th c. (already 03's source) | the O and M Lombards: bundles, capitals, pendants, lobed eyes, hairline gap |
| Met 467763 | Gradual, Italian, c. 1310–15 (whole book) | K and X: parted blue body with red, pearled contour, rosettes, cross of points, the stave |
| Met 466790, 466792, 469050, 469051, 467419, 467420, 476564 | Italian antiphonary / gradual leaves, 14th–15th c. | scale of the page, stave and square notation, painted (not pen) initials for contrast |
| Met 469041, 466179, 467422 | (03's sources) | contour-hugging penwork, the staff down the margin |
| CMA 1985.60.a/b (Bologna, c. 1320–40), 1950.391 (Siena?, c. 1300), 1954.145.b (Naples), 2022.134 (c. 1475), 1943.386 | Cleveland open access leaves | small red/blue Lombards with filigree among chant; late leaves show the filigree giving way to painted foliage |

## 2. Measurements

- **Pigments** (darkest 20 % of a stroke, scan white-balanced paper ≈ 220 212 190): azurite letter body 56 83 136 to 76 109 162
  (466773 O); minium/vermilion letter 199 83 46 (466773 M); red hairline over parchment reads 162 96 66 (thin, mixed with
  the ground). 03's paints (azurite 38 70 160, minium 212 76 42) sit inside that range: kept.
- **Hairline gap / letter height**: 466773 O, ~178 px tall, ~8 hairlines across a ~42 px counter bundle → gap ≈ 5.3 px ≈
  **0.03 H**. 03 (g = 2.6 px on a ~85 px drop) is the same ratio: kept. Hairline width ≈ 0.008 H (1.5 px at 178 px).
- **Hairline ends**: they stop a little short of the letter, each at its own height (never a ruled edge); they start under
  a capital or a cross-hair, and are slightly wavy, unevenly spaced, a few converging.
- **Scale**: choir-book leaves are 48–72 cm tall; a Lombard spans one stave + one text line (≈ 6–8 cm); filigree is
  drawn at the same absolute pen size as in a small book, so it is relatively finer: the reason a drop initial can carry
  dense hairlines at web size.

## 3. The vocabulary (what the flourisher made, in order)

1. **Columns and capitals** (466773): hairlines stand in *bundles* — one each side of the letter, one in each counter. A
   bundle beside the letter is capped by a dome with a ring-and-point inside it, its feet curling out into small loops with
   a bead, sometimes a bud on top. 03 had a low arch with an eye standing on it, margin side only.
2. **Lobed eyes**: a ring, a point, 4–6 small lobes; set where hairlines part (03 had these).
3. **Pendants**: small closed loops hung on a bundle's outer hairline, a tick or point inside, among open scallops.
4. **Teardrop hooks** at the top between the capitals (03 had hooks with beads).
5. **Pearled contour** (467763, 469041): where nothing stands against the letter, a string of fine points a gap off it.
6. **Parted body** (467763 K, 466790): the blue body split by a reserved/red channel, often with white filigree inside.
7. **Cross of points** (467763): a small hairline cross with points, in the margin.
8. **The staff** running down the margin (466179, 467422), scallops in runs, eyes hung on stalks, a curl at its foot.
9. **The stave**: four red rules, square notation in brown-black, C clef, custos, finalis (double bar). Every leaf.

Line-fillers in choir books are rare (the chant fills the line); where text-only antiphon cues end short, rubricators used
red/blue hairline runs with scallops or points — the 06 fillers plus a pendant chain are within idiom.

## 4. What was built (choirbook.js)

- Drop initial: 03 kept whole (letter painted, quill-written penwork, opposite colour, five budgets). Added: domed
  capitals with an inner eye, abacus and curled feet (usual+), a crowned text-side bundle (usual+), pendants on bundle edges
  (usual+), buds and a cross of points (fine+), pearled contour and the parted body (lavish; `?body=1` for study at any
  budget). Dark mode: the paint's opacity pools at the rim (designed, still lifted by the registry).
- Line initial: 03's, the same budget at its size.
- Paraph: 06's (approved). Fillers: 06's four plus `pendants`.
- Breaks: chapter = the stave (four red rules, C clef, a cadence of square notes, finalis, blue eyes beyond its ends);
  book = 06's great device.
- Frames: quotation = the column of 466773 (bundle down the gutter, crowned, pendants); figure, code, aside, contents =
  07's (approved); pull quote = the stave above and below.

## 5. The letter

No OFL Lombardic face is good enough. Checked: Metamorphous, MedievalSharp, Lancelot, Almendra Display, Jacquard 24,
Grenze Gotisch, Uncial Antiqua (rejected earlier). The closest (Metamorphous) has the round E and D but a modern, even
stroke. And kit/illum.js's registry path measures the letter with EB Garamond metrics, so a face swap needs a written-style
port. EB Garamond 600 painted stays (approved; humanist precedent).

## 6. Short of the sources

The capitals are cleaner and more geometric than 466773's lumpy, loop-studded domes; bundles in the counters are still 03's
full ruling, not the source's central column flanked by eyes; the parted body is a parchment hair, not red-filled; no
rosettes of concentric rings yet; no zigzag motif.
