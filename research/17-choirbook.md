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

## 4b. The filigree (second pass, the user's call: "keep the staff, add a true filigree")

Read at 4× in 467763's K and X: the letter's body is worked, not flat. Down the straight stem a channel of the other colour
(red in blue), pointed at both ends, with a hair of bare parchment reserved between it and the blue; in the broad members
white work: double lines following the stroke, S-scrolls ending in spirals, trefoils of points (each with a red dot), all
of it parchment left bare by the painter (it has the parchment's grain; the white lines are ~1/150 of the letter's height,
a scroll's period about four half-widths of its member). The K is a block Lombard (stem ≈ a quarter of the letter's
width); our Garamond B's members are 10–13 px at a desktop drop, so the panel scrolls do not fit. Built:
- the stem's channel: a broad-nib stroke in minium, laid after the paint and before the penwork, set down and lifted to a
  point; the reserve round it cut from the paint's mask to the stroke's own width profile plus ~0.65 px.
- each curved member: a white vine down its middle waving gently with it, curls at its ends where the member still has
  room (else a point), points either side in turn. Cut from the paint (a reserve): the page's colour, light and dark.
- it thins itself: nothing is worked where a member's half-width is under ~3 px, the curl only where ~2 px of paint
  remains round it, so on a phone it comes down to a shorter channel and plainer vines.
- the counters, when wide enough, keep their hairlines as one central column with an eye beside it (466773); the domes
  are drawn lumpy and leaning, studded with small loops with points.

## 4c. The Lombards (third pass: a real Lombardic alphabet, at 467763's density)

**Sources.** The whole of Met 467763 (Gradual, Italian, c. 1310–15: 34 open-access images, `lomb-raw/`), one book and one
hand of red-and-blue filigree Lombards (A ×4, B, D, E, G ×2, I, K ×3, L, O, S, V ×2, X on g00/g03/g04/g05; the great P with its
roundel panel on g07), with Met 466790 (D, uncial h) and CMA 1985.60.a/b (F, h, L) of the same century for letters it lacks.

**How they are built** (at 4×): body solid azurite or minium, often parted (a stem split in the two colours, a red
channel down a blue stem); the counters are not bare but *worked panels*: a double white line just inside the edge, then a
field of roundels (rings, doubled when large) each holding a trefoil of white points, red points in them, small white points
between (the P's bowl: ~25 roundels, each ~1/9 of the letter's height). The white is reserved parchment.

**Tracing** (`tools/tracelomb.py`): paint = saturated red or blue (brown text and black notes out); the solid body is
where paint fills a small window (over .8), its largest pieces kept; worked panels and fine penwork fall away by the same test,
so a trace gives the body's silhouette. Clean traces: B, E, F, G, h, I, K, O, V (the U form), X, A's stem and bar, D (466790).
Failed: the darker S (its blue-black band is lost by the paint test), the P (too pale a scan), the panel-heavy A/K/L/X variants.

**Completing the set** (`tools/lombcompose.py`, `research/choirbook/lombards.json`): only from the traced letters' own
strokes, cropped, erased, mirrored, placed. A = A's stem and bar + the X's main stroke mirrored as its leg; C = G less its
tongue; D = the O's bowl + 466790's ascender; J = I; L = I + F's arm as foot; M = G's back + I + h's leg; N = I + h's leg;
P = I + O's bowl; Q = O + X's arm as tail; R = P + K's leg; S = G's back and its turn rotated, joined by X's stroke (the weakest:
re-trace from another S when one is found); T = E's bar + I; U = V; W = V + V; Y = X's arms + I; Z = E's bar twice + X's stroke.
The O's head lay under a staff line in the scan; its foot, turned over, stands for it (O, Q, D).

**Fonts** (`tools/lombfont.py`): one WOFF2 per letter (~1 kB each, 27.8 kB all), with EB Garamond's vertical metrics and cap
height, so kit/illum.js's drop measure (Garamond's) places a Lombard exactly; the float is the Lombard's own width. The host
sets `.ini { font-family: "Choir Lombard", "EB Garamond" }`; `initial.load()` fetches the letters the page uses. The letter's
coverage is drawn from the face at the drop's measure; which letter it is, the registry does not say (it hands a registry
style only Garamond's coverage): it is read back from that coverage (`identify`).

**The filigree, now**: closed counters become panels (painted, worked: double line, roundels with trefoils and red points,
small points); the stem's red channel as before; penwork round the letter as painted. Light: azurite paint (paintField).
Dark: the designed dark blue (inkDark), laid flat with its opacity pooled at the rim; the white is the dark ground.

**Hooks kit/illum.js would need** (not edited: shared): (1) a registry initial is not told its letter (`ch` in its args);
(2) a pigment letter in dark is `flat(lift(pigment))` (a pastel): a `letter.pigmentDark` or an unlifted flat; here the
letter is returned as `{ M, col }` in dark to get the style's designed `inkDark` (flat, no paint texture); (3) `initial.width`
routes a style to the written path, so a registry style cannot size its float itself: the font's metrics do it instead.

## 4d. Refinement (fourth pass: "very clumsy, but the direction is good")

**Sources, widened.** Searched the Met (v1.1 API), Cleveland open access, Wikimedia Commons, and the Free Library of
Philadelphia's Lewis E manuscripts on the Internet Archive. The find: **Lewis E 73, a complete Gradual, Bologna?, c. 1425**
(Internet Archive `lewis_e_073`, Public Domain Mark; 316 page images at 5609×7501), written and rubricated in one hand
throughout: hundreds of red and blue filigree Lombards, each about 500 px tall at full size. A detector (paint blobs per page,
`scratchpad/cb/detect.py`) found 720 candidates; read on contact sheets, they give real instances of A B D E G I K L M O P Q R
S T V X (and many of each). It is a little later than the 1280–1400 asked (c. 1425), but it is one hand with nearly the whole
alphabet, which no earlier book in reach offered; 467763 (c. 1310–15) has only ~15 letters and its S and P would not trace.

**Tracing** (tools/tracelomb.py, new: `STAFF` takes out the staff's rules where they run thin to the crop's side; `CENTER`
keeps only the pieces centred in the crop; and a thin setting, BOPEN .001 BODY .55 WINB .015, keeps the hairline joints this
hand paints). Traced from the book: A B D E G I K L M O P Q R S T V X (17). Composed from that hand's own strokes, as a last
resort, recorded per letter in research/choirbook/lombards.json: C (its E's bow), F (its L turned over + its E's bar), H (its
K's stem + its M's right bow: uncial h), J (= I), N (its M's stem and right bow: the hand's uncial N), U (= its V), W (VV, as
the Italian books write it), Y (its X's arms + its I's stem), Z (its T's bar, its X's main stroke turned, its L's foot).

**Fairing** (tools/lombcompose.py `FAIR`, default .009 of the height): every letter closed and opened at that scale (notches
filled, burrs off), then a Gaussian of that width cut at half, before potrace refits it as curves (tools/lombfont.py, OPT .6).
The strokes' swell and the ball terminals, being larger, are kept.

**Panels**: counters closed by the letter grown 6 % of its height (this hand leaves joints thin or a hair open), crevices
under ~1/9 of the height dropped; roundels up to 1/10 of the height, fewer small points, red points larger (they read at
1×). **Dark**: the letter's paint mottled at two scales and toothed, pooled at the rim (the designed dark blue).

**Short**: the closing that finds a counter also paints the joint it bridges, so a few letters (B, O, Q) gain a soft lump at a
joint; small staff-line remnants survive under some feet (O, Q, U, V); the composed letters (C F H N W Y Z) are less sure than
the traced; the panel filigree is still 467763's (white reserve on blue), while Lewis E 73's own counters are paper worked in
blue hairline (a truer pairing would be that hand's filigree, or 467763's letters, which are too few).

## 4e. Generated (fifth pass: "generate first and foremost")

**Letters** (tools/lombgen.py): a stroke model of the Lewis E 73 hand, measured on the 17 traced letters (half-widths along
their skeletons, units of the height H): stem S = .085, waisted and flaring a little to its serif; bow (crescent) B = .095 at
its fullest, a hairline at its ends; hair h = .016; ball terminals r = .038 at every free end; wedges (an L's or Q's foot, a
T's bar) from S to h; proportions ~1.0 wide. Each of A–Z is a list of strokes on centre-lines, rasterised by stamping discs
of the profile's half-width (the painter's outline filled), seeded with a small irregularity of line and width, and faired
as the traces were. The traced set is now the reference (fonts/choirbook/traced, ?lombard=traced) and the blind test.
**Colour**: red or blue body by the drop's seed, about three red to two blue as in his book; the work in the other colour.
Not done: the split body (two pigments in one letter: illum.js lays a letter in one pigment).
**The work in the box** (choirbook.js counterWork, his rules, not 467763's): the letter's box less the letter, each bay
worked by its shape in fine hairline: a double line following the bay's edge all round; then a rosette (an eye at the bay's
deepest place, 8–12 spokes radiating to the inner line, loops at alternate ends) in a round bay, a leaf (a stem down the long
axis, angled leaflets in pairs) in a long one, sometimes a lattice of diagonals with points at the crossings in a broad one.
Seeded: no two drops alike. The margin's staff, domes and pendants are kept; ?work=roundels brings back the 467763 panels.
**Where it still looks generated**: the balls are perfect discs, all one size, and the serif bars meet them as dumbbells (his
balls vary and are drawn into the hairline as a hook ends); the stroke edges are smoother and more even than his; the
rosettes are too regular (equal spokes, equal loops) and the leaf fills read as fishbones (his leaves are drawn, with
curvature and teardrop leaflets); his box frame of hairlines and the radiating spikes round the box are not made; C, O
wheels show the spokes' evenness most.

## 4f. The penwork as a field (paused)

Measured (tools/penmeasure.py, inside the letter's ink box, the paint taken out): his B covers .137 of the free parchment
with hairline, the gap between neighbouring hairlines a median .044 H (quartiles .020/.073), hairline .0098 H; his D .153,
.069; O .160, .047; P .079, .055. Our motif-placer (wheel, fishbone, lattice): coverage .168 but gap quartiles
.015/.050/.463 H: dense rings and bare ground. The field primitive (counterWork now: lines parallel to every bay's edges at
his spacing, rungs and fringe, rosettes and scrolls carved out of it, the frame's spikes ending in hooks): coverage .198,
gap .013/.026/.040 H, width .0093 H — no bare ground left, but tighter and heavier than his. Paused for the letters.

## 4g. The letters, measured and redrawn (letters first)

Two generators, checked against the letters he painted (IoU of the silhouettes, height and width normalised):
- the parametric stroke model (tools/lombgen.py, now drawn as smooth offset contours with round caps, the balls a hook's
  swelling end): B .40, O .70, E .41, L .33, S .23. Clean, but not his: narrower, symmetric, his stroke shapes not learned.
- strokes fitted to his own letters (tools/lombmat.py: medial axis cut at forks, line and width fitted with smoothing
  splines, redrawn as offset contours): B .92, O .94, E .91, L .93, S .88; aspect matches to .01. Faithful, smoother than
  the traces, but it inherits their faults: the traces lost some of his thinnest joints (the B's head, where his bowl meets
  the stem in a hairline, is missing), stray stubs survive, and the composed letters (C F H N Y Z) stay weak.
Next: mend the traces at their joints from the scans (his hairline joints), then use his fitted strokes as the model's
library, so the missing letters are drawn from his strokes with real joins.

## 5. The letter (first and second passes)

No OFL Lombardic face is good enough. Checked: Metamorphous, MedievalSharp, Lancelot, Almendra Display, Jacquard 24,
Grenze Gotisch, Uncial Antiqua (rejected earlier). The closest (Metamorphous) has the round E and D but a modern, even
stroke. And kit/illum.js's registry path measures the letter with EB Garamond metrics, so a face swap needs a written-style
port. EB Garamond 600 painted stays (approved; humanist precedent).

## 6. Short of the sources

The capitals are cleaner and more geometric than 466773's lumpy, loop-studded domes; bundles in the counters are still 03's
full ruling, not the source's central column flanked by eyes; the parted body is a parchment hair, not red-filled; no
rosettes of concentric rings yet; no zigzag motif. The filigree is far sparser than the K's (a narrow roman letter has no panels to fill): no double-line scrolls, no trefoils, no red points in the white.
