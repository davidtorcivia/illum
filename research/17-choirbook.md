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

## 4h. A typeface's shape, his hand (sixth pass: "still bad"; the user's call: the shape from a designed face)

Seven code-drawn letterforms were rejected; the one letter ever approved was a designed glyph (EB Garamond) with generated
ornament. So the bare SHAPE now comes from a credited open-licence typeface and the generator applies only his HAND.

**The search** (faces with Lombardic or Lombardic-adjacent capitals; licences read in the fonts' own files). Scored against his
17 traced letters: each face's capital at his height, its strokes grown or thinned (signed distance) to his mean stroke
thickness, IoU at the best horizontal shift; his V is the U form, so for the six leading faces it is also scored against the face's U (in the means below; the rest uncorrected).

| face | licence, source | mean IoU | by eye |
|---|---|---|---|
| **Lombardic**, George Williams (1988/98) | OFL-1.1-no-RFN or BSD-3 (Debian fonts-georgewilliams; the FontSpace zip carries the BSD-3 notice) | **.41** | the only one in the genre: flat-topped A, round E with closing spine, uncial h M W, U-form U, waisted stems, flared hairline serifs |
| Almendra Bold, Ana Sanfelippo | OFL, Google Fonts | .38 | strong weight, roman-gothic hybrid; E round, the rest roman |
| Berry Rotunda, Typo-Graf (2016) | Public Domain (name table) | .36 | rotunda capitals already at his weight, round and uncial; the hand's gain and hooks over-apply (untuned for it) and mangle it |
| Eagle Lake .39, Metamorphous .37, Grenze Gotisch 900 .37, Fondamento .35, Lancelot .34, Uncial Antiqua .34, Texturina .34, UnifrakturCook .32, MedievalSharp .32, Germania One .32, Rotunda Pommerania (Peter Wiegel, OFL) .32, UnifrakturMaguntia .31, Pirata One .29 … | OFL | — | chancery, roman or textura capitals: not Lombards |
| Yinit (Haralambous, PD), GotIn / Kinigcap (Steffmann, LPPL via CTAN) | as stated | — | boxed, foliated initials: no bare letter to take |
| Xiparos Lombard, Versal Gothic, Ornamental Versals, Kingthings Versalis, Lombardy, EasyLombardic, Missal Unciale … | personal-use / no-modify / no licence | — | reference only, never outlines |

The score gap is small (the method's resolution is ~.03); the pick is by genre and eye. The face is kept with its notice in
`research/choirbook/face/` (Lombardic.ttf, Lombardic-LICENSE.txt).

**The hand** (`tools/lombhand.py`; lombgen's measures, now applied to the face's outline, as vectors): the outline flattened
from the font; the face measured on a raster (analysis only: medial axis and half-widths, the heavy members as what survives an
opening by a disc of ~.032 H); then the outline displaced along its normal by smooth fields: each heavy member drawn toward his
stem half-width S = .085 (GAIN .6 of the shortfall; hairlines stay the face's), waisted a little above the middle and flaring to
its ends, the brush's entry (top, up-left edge) and exit (foot, down-right edge) swelling, a slow painted drift (~.25 % of H).
Every free hairline end (the face's serif tips and spurs, outermost first, at most 5 a letter, a fifth left bare) is drawn on
into a hook whose end swells into a ball: a pendant ball off a short turn (half), a hook (two in five), a curl run on until it
nearly closes (one in ten); r .6–1.35 × .038, turning either way. Joined by skia-pathops' boolean union; fitted with cubic
Beziers (Schneider, tolerance .0009 H, cut at corners); `tools/lombfont.py` draws such 'curves' directly (no potrace). A tail
that would run into the next text line (J, Y) sets its letter a little smaller (ink at most .07 H below the baseline).
Build: `tools/lombhand.py research/choirbook/face/Lombardic.ttf research/choirbook/hand` then `tools/lombfont.py
playground/fonts/choirbook/hand "Choir Lombard" research/choirbook/hand/*.json` (CREDIT=… sets the copyright record).

**Which set**: default `fonts/choirbook/hand/` (face + hand); `?lombard=gen` the previous generated set (`fonts/choirbook/`,
tools/lombgen.py); `?lombard=traced` his traced letters.

**Against his letters** (B O E L S at page size and 4×): the structure is his alphabet's; the face is cleaner and lighter
than his paint (his bows and an L's foot are heavier, his ends mostly fat round drops where ours more often curl); the hand
reads at 4× and nearly vanishes at page size, as his does. Short: a few hooks sprout from small spurs where he has none (Q's
crown, W's top, K's arm), joins of hairline to heavy keep a small pooled lump (E's spine, F's arms), Berry-weight pigment
blobs are not attempted. Penwork paused until the letters are judged.

**Second pass** (user: "needs to be more confident in strokes; feels too pieced together and scared"): the outline-displacement
hand made lumps wherever the gain changed along a stroke. Now each member of the face is redrawn as one stroke (lombmat's
medial-axis reading, width splined along it, held to its own width at forks), its width a monotone function of the face's
(heavy to his full paint, .095 H; hairlines untouched; counters kept open), as a chain of convex capsules, joined with the face's
own outline (keeps serif wedges and tips) by GEOS (shapely; skia's boolean silently failed on these unions). Terminals: drops
that only widen (no neck), one hook a letter. Letters he writes otherwise: J = I, V = U, uncial N from the M, M's foot-bar cut,
Y's tail cut at the line into a drop, L's foot heavy, no terminals on O/Q. Default `hand/`; the first pass at `?lombard=hand1`.

**Letter by letter, first pass** (face + hand, against his): good: A (his flat-topped A), D, G, H (uncial h), O, R, T, U, Z. Fair: B (his
structure, but the stem's foot stacks gain, flare and brush exit into a trapezoid; bowls lighter than his), C, E, F, S (a
small pooled lump where hairline meets heavy), I, P, X (the bottom-left hook dips low). Weak: L (the foot a thin wedge; his
is the heaviest member), M (the face's thin foot-bar hairline reads odd at 4×), K and W (hooks cluster at the top), Q (a hook
sprouts from the crown spur, where he has none). Off-genre in the skeleton: N (the face's is a roman diagonal N; his is
uncial) and V (a true V with a bare point; his V is the U form). J and Y are set at ~80 % so their tails stop .07 H below the
baseline; they look small beside the rest.

## 5. The letter (first and second passes)

(Superseded by §4h.) No OFL Lombardic face is good enough. Checked: Metamorphous, MedievalSharp, Lancelot, Almendra Display, Jacquard 24,
Grenze Gotisch, Uncial Antiqua (rejected earlier). The closest (Metamorphous) has the round E and D but a modern, even
stroke. And kit/illum.js's registry path measures the letter with EB Garamond metrics, so a face swap needs a written-style
port. EB Garamond 600 painted stays (approved; humanist precedent).

## 6. Short of the sources

The capitals are cleaner and more geometric than 466773's lumpy, loop-studded domes; bundles in the counters are still 03's
full ruling, not the source's central column flanked by eyes; the parted body is a parchment hair, not red-filled; no
rosettes of concentric rings yet; no zigzag motif. The filigree is far sparser than the K's (a narrow roman letter has no panels to fill): no double-line scrolls, no trefoils, no red points in the white.

## 4i. Third pass: the ends, the filigree grown, the dark page

**The ends** (user: "too many small knobby balls on thin stalks; his ends are fewer, fuller drops that belong to the stroke").
tools/lombhand.py now finishes at most MAXEND = 3 free hairline ends a letter in a full drop (never two within SEP = .2 H, so a
serif's two arms take one), one of them a hook (HOOKS = 1). A drop fattens at once from where the spur leaves the body (width
w0 → 1.25–1.6 × .038 H along sin^.7, so no stalk), its ball near the face's tip, sinking a little. A hook fills steadily into
its ball. Every other free end is cut back (a shapely difference of a disc at its tip, the terminals laid again after the cut,
never across a drop's bridge) and finished at its own width, so it stops blunt: no pin, no pinhead. Islands under 3 % of the
letter are dropped. Set: `research/choirbook/hand2`, fonts `playground/fonts/choirbook/hand2` (default); `?lombard=hand` the
second pass. Short: S, G and F keep a beak-and-drop pair at the top where the face's beak spur stands next to the drop.

**The filigree, grown** (choirbook.js `filigrana`, the default; `?work=le73` the paused field pass). Read at 4× in his B and P:
every bay is first contained, then filled by its shape. The box: the letter's ink box out by [1.1, .7, .75, .9] sp (sp = .05 H,
his spacing), its frame a double hairline. 1. Contained: two lines a hair apart (.15 and .62 sp into each bay: the level sets of
the bay's depth) hug the letter a reserve off its paint and run on as the frame's inner line; an outer frame line outside.
2. Filled, by shape: a closed round counter gets an eye (ring and point at its deepest place) with 6–12 spokes run up the depth
to the contour and small scrolls hung from the spokes in the sectors; every other bay gets its middle line (the core thinned,
Zhang–Suen, spurs pruned) as a spine where it is broad, with scrolls hung alternately either side, and pearls (small rings)
strung down it where it narrows; then a fringe of small scrolls hung off the inner contour wherever there is room; then any
attractor still clear (Poisson) reached by a scroll branching off the nearest line laid so far, so the work grows outward from
the structure. A scroll is one stroke: it leaves its parent 25–40° out, bends steadily (a cubic) into a circle entered along its
own direction, and winds in a turn as the radius closes; it is laid only if it keeps a gap from every other line. 3. The frame's
outer side: pearls and spikes in turn, a finial (tall spike, two small scrolls) at the middle of top and foot, a corner spike;
none on the margin's side or into words. Order written (?draw): contour and frame, spines, eyes and spokes, scrolls as they
grew, pearls, spikes. The margin's staff, domes and pendants are kept; the text-side panel and 03's top line give way to the box.

Measured (tools/penmeasure.py, inside the letter's ink box): ours coverage .24–.27, gap p25/50/75 .008/.012–.015/.024–.027 H,
width .0076 H; his B .135, .020/.042/.073, .0089 H. By the metric ours is tighter: the double contour hugging every edge
dominates it, and his pale, blurred hairlines in a JPEG scan read as less line than they are. By eye at page size and 4× the
density is close; his counters are fuller (more scrolls per sector) and his line paler and finer.

**Dark**: the letter in two coats, as on a stained leaf: a deep murrey ground coat (palette 'f', [74, 40, 74]) and the bright
pigment over it (vermilion [232, 98, 62], ultramarine [78, 118, 238]) whose opacity pools at the rim and is mottled over the
middle (.72–1), so its body varies between the two and never shows the page through. The penwork in dark carries inks of
lightness over .64 ([240, 126, 94], [112, 148, 242]) so kit/illum.js's `lift` leaves them as designed, and is written a little
thinner (light lines on dark read heavier).
**Hooks kit/illum.js would need**: (1) a mark's own dark ink without `lift` (illum.js lifts every `s.ink` on a dark page); (2) a
pigment letter painted on dark with texture (paintField composited for a dark ground, e.g. `letter.pigmentDark`), instead of a
flat colour or this two-coat workaround.

## 4j. Fourth pass: the letter as one brush field; the penwork finer; speed

**The letter** (user: "blobby, bad ends or areas where lines meet; computer assembly instead of intentional strokes").
The cause was tools/lombhand.py's method: every member redrawn as a chain of capsules and the union taken with the face and
the terminals, so outlines bulged wherever pieces overlapped and drops sat stuck on. tools/lombbrush.py makes each letter as
one signed distance field instead:
1. The face cleaned. George Williams' Lombardic is opened by a disc (radius .013 H). What the opening removes is hairline.
   A hairline piece that meets the members twice, or that closes a counter, is a join and stays. A piece that meets them once
   is a spur and goes. This removes every nib, flick and whisker (K, P, T, A, X), including the S/G/F beaks' hairs.
2. The weight. The cleaned face's distance field is moved out by a smooth field: heavy members are carried toward his full
   paint (.104 H half-width), hairlines are left alone, and nothing grows past .42 of a neighbouring gap. The field is spread
   from the medial axis and blurred along the member (.07 H), so a stroke swells and thins as one stroke. Every member stays
   at least .0144 H wide, so a fine join never breaks.
3. The ends. Of the spurs, at most 3 reach out to the letter's edge and become full drops, never two within .22 H and never
   where a drop would stand beside a beak or float on a stalk (S, G, F, C, K, P boxes). They are taken from the head and the
   foot in turn. A drop grows out of the member along the spur's own direction, swelling at once. Each drop is joined by a
   smooth minimum (fillet radius .014 H), never a union. No hooks.
4. The finish. The field is smoothed at .0045 H, its zero set is taken by marching squares at 1100 px per H, and it is fitted
   with cubic Beziers (tolerance .0007 H).

Set: `research/choirbook/hand3`, fonts `playground/fonts/choirbook/hand3` (27.6 kB, the default); `?lombard=hand2` gives the
third pass. Short: Q's tail and h's leg keep the face's small closing curl. A few stems keep the face's own slight waver.
B's upper bowl ends in its uncial curl, as his does.

**Penwork**:
- Finer and paler: line .24 (was .3); inks [102, 130, 200] blue and [222, 136, 112] red.
- Counters fuller: up to three scrolls a sector, hung from the nearer spoke; the fill spacing is 1.0 sp.
- Frame ornaments shrink to the room they have, rather than being dropped, when text stands beside or below the box.
- Corners and finials are his fleuron: a spike with two scrolls turning back from its foot.
- Measured: coverage .225, gap .008/.013/.024 H, width .0058 H (his B .135, .020/.042/.073, .0089).

**Dark channel**: a split letter's channel now carries no `ink` in dark. kit/illum.js then lays it in the palette's designed
dark solid ('a'/'b'), not a lifted pastel. No illum.js edit was needed.

**Speed**:
- The work is laid out at 2 cells a px (the mask is halved).
- Words are rasterised once into a mask, in filigrana and in flourish (they were tested per cell).
- filigrana is cached per letter, size, seed and the words around it, so a resize lays nothing again.
- Drop initial: 190 → ~118 ms (filigrana ~44, flourish ~48, drawn ~20). Whole page: grow ~190–245 ms.

**Fifth pass (the user: "the I seems to have two colours; J doesn't feel like a J; Y reads like V"; keep the staff as an option).**
- J and Y are the face's own: J's hook descends and curves left, and Y is the uncial y with its tail. The third pass had made J
  as I and cut Y's tail. A tail may now run .2 H below the line; letters that run past that are set smaller.
- The split is his occasional choice. It appears on about one large letter in six, and only on letters with a long upright
  stem (B D E F H K L M N P R). It is now a lens about two fifths of the stem's width, pointed at both ends, set in a hair of
  parchment. Before, it was the whole stem in the other colour, which read as two colours. `?split=1|0` forces it either way.
- The staff is a setting: `choirbook.staff = 'on' | 'off'` on the module (as Kelmscott's settings are), with `?staff=` over
  it. Off: a drop's box stands alone, worked and spiked on all four sides with corner fleurons, and the chapter break becomes
  06's device instead of the music stave. A line initial keeps its small panel but loses its staff. Catalogue entry for when
  the style joins the site: `['staff', 'Music staff', [['on', 'On'], ['off', 'Off']], { mod: true }]`.
- No stamped rows. Each fringe scroll has its own size (×.72–1.12) and spacing (1.05–1.65 sp). Its curl turns opposite to the
  last about three times in four. The spine scrolls vary in size too.

## 4k. Fifth pass: the page in the drop's hand; speed; the library and the site

**What the masters mark besides the initial** (read again at full size: Cleveland 1950.391 and 1985.60, Met 467763, Lewis
E 73). The rubrics' paraphs are Lombardic Cs (c1950.391: blue, a little taller than the text's capitals, the back swelled,
the head drawn out into a hair, a hair down the mouth), red and blue in turn. The small Lombards among the chant (467763's A,
B, K, X) carry at the text's size few and large pieces of the same penwork: a contour a gap off the letter with a row of
points, a roundel with a trefoil of points in a counter, and on the head a crest: two volutes springing from a short stem and
rolling outward and down, a spiral rising between them, a point in its eye. Line fillers are rare (the chant fills the
line); the stave is everywhere. Lesson from the first attempts (three were made and looked at at 1x and 4x before this one):
the box's small work shrunk to the text's size reads as dotted borders and tiny rings, "digital"; rows of points read as
dotted lines. What read as the same scribe at 1x was the drop's own margin staff (03's chain: scallops strung in runs,
pendants with a point, hooks turned over with a ball, eyes on stalks) and his crest at the size of a capital.

**What was built** (kit/styles/choirbook.js, "the page in his hand"): every mark at the drop's gap g = 2.6 px, in the drop's
penwork inks (the palette's hairline is now the drop's penwork ink, light and dark) and widths, written by the same quill.
- Paraph: the C laid with the broad nib held near level (the back full, head and foot thin) and a second stroke down the
  back, a drop at its head. Modest: a hairline round the bowl in the other colour, scallops on its back in runs; usual: the
  scallops full, pendants, the crest out into the margin from its back (over its head there is only the line above); fine:
  the crest's eye in the paraph's colour; lavish: larger, eyes on stalks.
- Fillers: one hairline from the last word to the measure, its end hooked over inside it; scallops over it in runs; kinds
  (the copy's): scallops, pendants hung under it, eyes on stalks. Plain: the hairline; lavish: the crest at the end.
- Breaks: rank 1, the stave (crests out from its ends; staff off, the staff laid level round an eye); rank 2, the column
  laid level as a band (two hairlines strung outside, 466773's dome over the middle, crests at the ends); rank 3, the band
  wider with domes over and under and crests from them.
- Frames: the quotation and aside, the column (a bundle crowned with the dome, the chain down its outer side); the figure,
  the box's frame (a double hairline, the chain outside, crests at the corners, the dome over its head at fine); the code,
  two corners of it; the pull quote, the part's break above and below; the contents, the staff with a stalk and an eye at
  each entry.
- The scroll and fleuron are the grown filigree's own code, lifted out of it unchanged (the drop pixel-identical).

**Speed** (all pixel-identical, checked by snapshots light, dark, staff off, plain and lavish at dpr 1 and 2): the clearance
stamped only as far as any query reads it (~40 ms a drop); the letter's waver measured only in the band its edge can move
(drawnNear: the same cells as penwork.js drawn, its distances searched ring by ring); the words near the letter only; the
letter read back among the page's own initials; the registry's guard (kit/illum.js hits) asks a stroke only of the words its
box could touch; the page's hairlines handed to the ink engine at a point every .75 px.

**Bytes**: the 26 Lombards are 27.6 kB in all (hand3, a letter to a file, ~1.0–1.3 kB each); a page fetches only its initials'.
