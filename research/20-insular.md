# 20 · Insular: the knot that closes

The Hiberno-Saxon gospel books, c. 650–850, as a rubricate style: the Book of Durrow (TCD MS 57), the Lindisfarne
Gospels (BL Cotton MS Nero D IV), the Lichfield (St Chad) Gospels, the Echternach Gospels (BnF lat. 9389), the Book of
Armagh (TCD MS 52) and the Book of Kells (TCD MS 58). Stage 1 is research, the letter source and three direction studies
(tests/insular-directions.html, drawn by tests/insular-directions.js on kit/styles/insular-knot.js). The style itself waits
for the user's choice. Raw downloads, measurements and screenshots are in the session scratchpad (insular/raw,
insular/shots, insular/LOG.md), not the repo.

## Sources, studied at full size

| what | where | licence | used for |
|---|---|---|---|
| Lindisfarne Gospels, the whole book: 538 photographs with the BL's colour target and a cm rule in frame, 5543×6918 | Commons, *BL Cotton MS Nero D IV.djvu*; a page at any width from `thumb.wikimedia.org/…/BL_Cotton_MS_Nero_D_IV.djvu/pageN-3840px-…`. **Page N = 2·folio + 10 for a recto, + 11 for a verso** (p. 63 = f. 26v; p. 64 = f. 27r; p. 288 = f. 139r) | public domain (BL, Commons PD) | everything measured here: f. 2v, 26v, 138v (carpet pages), 3r, 27r, 29r, 95r, 139r, 211r (incipits), 10r (canon table), 90r, 140r (text) |
| Book of Durrow, TCD MS 57, photographs 6000×8200 | Commons, *IE TCD MS 57 f.NNN.jpg* (fol. 3v, 85v, 86r, 124v, 125v, 192v used) | CC BY 4.0 (Trinity College Dublin) | the broad ribbon and its reserved margin, the spiral carpet page (fol. 3v), three pigments on black (the dark mode's model) |
| Book of Kells, TCD MS 58, fol. 2r, 29r, 33r, 34r, 188r, 200r, 203r, 292r, 309r, at 760–2220 px | Commons, *KellsFol…* files (TCD's own IIIF viewer sits behind a reCAPTCHA) | public domain | the saturated palette, density, zoomorphic interlace, line-end beasts; too small for line measurement |
| Echternach Gospels, Lichfield Gospels, Book of Armagh | Commons (2117×3009, 1800×1023, 600×842) | PD / CC BY-SA (photographs) | looked at; nothing measured (Armagh is too small to measure its pen) |
| J. Romilly Allen, *The Early Christian Monuments of Scotland* (1903), Part II, pp. 140–146 (interlace), 308 ff. (key patterns), 363 ff. (spirals) | archive.org `earlychristianmo12alle` (leaf n = page + 151, e.g. `/download/…/page/n295_w1600.jpg` = p. 144) | public domain | the construction: the plait on diagonal setting-out squares, and breaks (below) |
| J. Romilly Allen, *Celtic Art in Pagan and Christian Times* (1904) | archive.org `celticartinpagan00alle_0` | public domain | the divergent spiral and trumpet; read, not measured |
| George Bain, *Celtic Art: The Methods of Construction* (1951) | (not reproduced) | in copyright (UK, to 2038) | cited for method only; nothing taken from its plates |

Kells at full size (TCD) and the BL's own viewer were not reachable from here; every number below comes from the
Lindisfarne photographs (calibrated: the colour target's white patch reads neutral, 221 221 221) or from Durrow.

## Construction (Allen 1903, pp. 143–146)

A plait is drawn on setting-out squares placed diagonally to the margin. The bands go over the lines, over and under
alternately; at the plait's edges they are bent back at right angles to join the other series. Every Insular knot is a
plait with **breaks**: take a crossing, cut both cords, and join the four loose ends two and two the other way, so two cords
turn back instead of crossing ("vertical" or "horizontal" by the way they turn). The family of a pattern is fixed by the
number of cords, the kind of break, the interval between breaks (every crossing, every other, every third) and the rows
they fall in. Knots always close: there are no loose ends unless a beast's head takes one.

This is Mercat's formulation, which the code uses: a grid of setting-out points; a crossing at the middle of every edge
between two points; a break is a wall on an edge, which turns the cords back. On that graph the over/under assignment is
alternating by construction: on a horizontal edge the cord running down-right is over, on a vertical edge the cord running
down-left. A wall changes neither rule, so no crossing can come out wrong, and a knot of any shape (a band, a corner, the
cells inside a letter) is correct everywhere.

## What makes it work (measured)

- **Scale.** f. 27r carries a cm rule: 12.25 px/mm at 3840 px. The text's majuscule is ~4.1 mm tall on a 9.8 mm line.
- **The diminuendo** (f. 27r, heights in mm): the LIB monogram 267; ER 34; GENERATI 42; ONISXPI 33; XPI FILII 16; the red
  *incipit* ~10; the text 4.1. The giant letter is ~6× the first display line, which is ~10× the text. Each display line
  then steps down by about 0.8, then 0.5, into the text. The giant letters are ligatures, their bodies divided into panels.
- **The display capitals** (GENERATI) are not a script: thin, straight-sided, angular capitals drawn in black outline, wedge
  feet, their counters filled with flat red lead, orpiment or verdigris in rounded insets that leave a hair of vellum
  inside the black. The ground between them is a **diaper of red dots in a lozenge lattice**.
- **Red dots, two uses.** (1) the *field*, a lozenge trellis of dots between display letters: diameter 8–8.7 px (0.7 mm),
  nearest-neighbour pitch 15–16.6 px (1.3 mm), pitch/diameter ≈ 1.9; (2) the *contour row* hugging a letter: diameter
  6–8 px, pitch along the contour 14 px (≈ 1.8 diameters), the dot's centre 0.8–1 diameters from the ink edge (a gap of a
  third of a dot). The large initials carry two or three rows. Against the text: a dot is 0.07 of the line pitch and the
  pitch 0.13 of it, so at a 32 px line a dot is 2.3 px and the pitch 4.3 px. Dots are red lead thinned: 161 97 75 on the
  vellum. They are placed by measure (constant pitch along an offset contour, or on a lattice), never scattered; the
  earlier note in 01-canon §1.3 (±8% jitter, Poisson counters) is superseded.
- **Interlace in panels** (f. 138v, a knot panel on black): the light strand 5.8 px (0.47 mm), the dark between 4.5 px
  (0.37 mm), strand : dark ≈ 1.3 : 1. Each strand is outlined in ink, and the ink merges with the black ground, so the
  ground reads as thin dark slivers. Panels are framed by a coloured band (blue or verdigris) between two dark rules.
  f. 139r's curved band carries small closed knots (blue) in a row along the curve, alternating with denser interlace.
- **The Durrow ribbon** (fol. 125v, 192v): broad, the pigment fill ~26 px, with a **reserved margin of bare vellum** ~4–5 px
  each side and a fine dark pen line at its outer edge. The fill is ~74% of the ribbon, each margin ~13%, the pen line
  ~3%. At an under-crossing the fill and margin both stop at the over-ribbon's pen line. A ribbon changes colour along its
  length (red lead, orpiment, verdigris in turn), the change falling under a crossing. Coils end in spirals. The ground is
  a brown-black (59–64 54 46).
- **Key (step) patterns** (f. 138v): keys in lozenges, orpiment or blue with dark key lines, set in a stepped red ground.
- **Spirals** (Durrow fol. 3v, Lindisfarne f. 139r): roundels each holding a triskele of smaller roundels (two or three
  levels). Each small spiral is two strands winding together three or four turns into a small eye (often a bird's head);
  they leave the roundel as C-curves that widen into trumpets, and the trumpet mouths meet at lentoid voids. The black
  between them holds small triangles and pale dots. Lentoids gather in fours as crosses at the junctions.
- **The hierarchy of a page.** Carpet page (pure ornament) → the incipit (giant panel letter, display lines on dotted grounds,
  framed by a panel band) → the chapter initial (one or two lines, coloured counters, a dot row) → the line initial (the
  first letter of a sense, enlarged a little, outdented, its counter washed with one colour) → pauses marked by positurae
  (`·,` `:~` `·:·` in red or ink). Kells adds line-end fillers: small beasts and knots that run to the margin.

## The palette (sampled; BL photographs calibrated by the target)

| pigment | Lindisfarne f. 27r / 26v | Durrow fol. 125v | Kells (Commons, uncalibrated) |
|---|---|---|---|
| vellum | 192 175 147 (204 186 161 in the display) | 172 158 132 | 196–206 178–182 145–155 |
| ink (brown-black) | 25 8 5 | ground 59–64 51–54 41–46 | 54–61 29–44 25–31 |
| red lead | 155 67 57 (dots 161 97 75) | 154 92 57 | 186 93 62 |
| orpiment | 185 148 91 | 176 146 88 | 218 167 70 |
| verdigris | 135 147 110 | 96 113 77 (shadowed) | 65 82 46 |
| blue (indigo/woad) | 51 88 129 (f. 26v) | — | 76 102 127 |
| folium purple | 56 31 45 (deep), mauve in f. 139r | — | 72 40 50 |

Lindisfarne is light: vellum carries most of the page, colour sits in panels, the dots make the air. Durrow is three
pigments and black. Kells is saturated orpiment and red with purple and blue. Gold appears nowhere; orpiment does gold's work.

**Dark mode has a historical model: Durrow.** Red lead, orpiment and verdigris on a black ground is Durrow's carpet page,
so the dark palette is the same pigments on the page's dark ground, the vellum becoming the black, and the ribbon's reserved
margin becoming a pale line. Red dots on black read as Durrow's red-on-black panel fills.

## Letters

The standing rule: letter shapes from a credited open face, shortlisted by overlay against the master's letters; the
generator applies the hand. A subagent surveyed Google Fonts, the Open Font Library, Font Squirrel, dafont, GitHub and CTAN
(licence of each read from its file and name table). **No open-licence face reproduces Insular majuscule.** The only digital
Insular majuscule found, CTAN `inslrmaj`, is METAFONT under the LPPL.

Overlay (scratchpad tools/overlay.py: the master's ink thresholded, each face's glyph scaled to its height and slid for best
overlap; IoU, mean of 10 letters):

| face | licence | text majuscule (f. 140r) | display capitals (f. 27r) |
|---|---|---|---|
| **Uncial Antiqua** (Astigmatic, 2011) | OFL 1.1, RFN "Uncial Antiqua"; already in fonts/ | **.524** (best) | .218 |
| Celtica (W. Kalinowski) | OFL 1.1, RFN "Celtica-Book" | .505 | .220 |
| Balgruf (P. J. Miller) | OFL 1.1, RFN "Balgruf" | .497 | .235 |
| **Trathnona** (Dominic Stanley, after Seán Ó Briain 1738) | OFL 1.1, RFN "Trathnona" | .439 | .212 |
| Gaeilge 2 (P. McCarthy 1993) | "Public Domain" (a name-table string only; weak provenance) | .427 | .170 |
| Segotia (D. Stanley) | OFL 1.1, RFN "Segotia" | .368 | — |

Sheets: scratchpad insular/shots/overlay-text.png, overlay-display.png. Rejected: Scriptorium (no licence in the file;
CC BY on the author's page), Kells SD (own freeware licence), Vincent Morley's Gaelchló faces (no redistribution),
Andron (custom), every commercial Lindisfarne/Kells face.

Two conclusions:
- **Uncial Antiqua is the face** for the letters that show their shape (the in-line initial, the small initials). Trathnona
  second (closest in weight and wedge serif to the scribe, but an 18th-century hand). Both have reserved names: if the
  outlines are exported, the files are named generically (`insular-X.json`) with the OFL beside them.
- **No face matches the display capitals** (.17–.24: they are thin outline capitals, not a script), so the showpiece is
  built the way Lindisfarne built its giant letters: the **panel letter**. The face supplies only the stroke region; its
  outline becomes a double contour, the body is filled with generated panels (plait, spiral, key), the counters washed,
  and red dots set round it. The face's own character is mostly under the ornament, so the choice of face matters most where
  the letter is naked.

## Scale arithmetic (why the knot must coarsen)

A panel strand is ~1.1% of a display capital's height (0.47 mm on 42 mm). A four-line drop at a 32 px line is ~116 px,
so a strand would be ~1.3 px, at the project's 1.25 px floor; a three-line phone drop would put it under. So the plait
takes its cord count from the band it fills, not a fixed count: the setting-out square is held at ≥ ~6 device px, and
a narrower letter or a phone gets fewer, broader cords (as Kelmscott pared its white back). Durrow's broad ribbon (a
strand ~4% of the panel) survives any size.

## What to avoid

Celtic clip-art (the symmetric four-fold "Celtic knot" corner, the triquetra logo); uniform monoline bands with round caps;
any crossing wrong; a knot that does not close, or a strand cut by the panel's edge; knots clipped to a shape; random or
Poisson dots; gradients; neon or pastel versions of the pigments; full animals (they are where it turns to clip-art: a
strand may end in a biting head, one per strand); spirals of constant pitch made of single lines.

## Stage 1: the three directions (tests/insular-directions.html)

The engine (kit/styles/insular-knot.js): `plait` (Mercat's form of Allen's construction, over/under by parity; checked by
tests/insular-knot.check.mjs: every crossing met twice with one over, alternation along every cord, for bands, breaks, a
ring of cells and an L), `cords` (each cord a smooth closed centreline: straight between crossings, a Hermite loop at each
turn), `knot` (a cord drawn as nested bands, outermost first; at each crossing the gap is cut round the over cord and the over
cord laid again, so occlusion is true; a cord may change colour where it goes under), `Sheet` (per-ink coverage, opaque
layering with a trap, poured one ink at a time through kit/inkletter.js inkLetter, with a pigment grain). The letter is
Uncial Antiqua's capital, grown by 3% of its height (the panel letter is broader than the type), its skeleton cut into
strokes (Zhang–Suen thinning; serif spurs pruned; strokes joined straight through a fork), and **each stroke carries a plait
band laid along its own curve**, as many rows as its width holds, pressed to no less than 0.6 of itself where the pen thins,
stopped where it cannot fit. The square-grid fit (cells inside the letter) was tried first and rejected: on a curved stroke
it gave staircase scraps (measured: 1–3 cells across the E's bowl at 116 px, 1 on a phone).

- **A · Lindisfarne.** Ink contour, orpiment band, hairline; body a black panel, orpiment cords with one cord per panel in
  verdigris or blue (f. 138v); counters with the lozenge diaper of dots (lines of dots on the diagonals, three in each
  lozenge, f. 27r); two rows of contour dots. Paraph: a closed two-cord knot in a ring of dots. Filler: a twist. Break: a
  ruled panel of plait. Frame: a plait fitted to a ring of cells, so it turns its own corners. Dark: the ink contour becomes
  the pale vellum line; the panels merge with the page.
- **B · Kells.** Red lead contour, purple body with a fine orpiment plait; the triple spiral in roundels (three arms from
  the middle, curvature rising to the eye) in the body's broadest place and each counter. Paraph: a roundel. Filler: the
  running spiral. Break: roundels joined by running spirals on purple. Frame: plait on purple with corner roundels.
- **C · Durrow.** The broad ribbon: pigment inside a reserved vellum margin with a fine pen line, colour changing under
  crossings (red lead, orpiment, verdigris), on brown-black; the letter outlined in vellum between pen lines; one close row
  of dots. Dark mode is the book's own palette.

Timing (page-size set: drop, paraph, filler, break, frame; headless Chrome, Arc A770): 120–220 ms per theme at dpr 1,
220–320 ms at dpr 2, first pour included. Over the 200 ms goal at dpr 2; the levers are fewer pours per piece (the dot red
and the red lead as one ink; grain only on the large pieces) and one pour for all of a piece's inks.

Self-scores against 05-the-bar (Beauty first, honest):

| | Beauty | Craft | Viewport | Text | Behaviour | System | Imperfection | Restraint | History | Longevity | POV | Provenance | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A Lindisfarne | 2 | 2 | 2 | 2 | 1 | 2 | 1 | 2 | 2 | 3 | 2 | 2 | 27 |
| B Kells | 1 | 2 | 2 | 2 | 1 | 1 | 1 | 2 | 2 | 3 | 1 | 2 | 22 |
| C Durrow | 2 | 2 | 2 | 2 | 1 | 2 | 1 | 2 | 3 | 3 | 2 | 2 | 28 |

Behaviour is 1 everywhere because ?draw is not built; the cords are closed polylines in growth order, so a cord can be
written along its length later. Imperfection is 1: the hand is only in the pour and the dots' radii. Nothing here is museum
yet. Weak points: the letter body outside the plait bands is flat (A black, B purple); B's body plait is sparse and its
roundels are its only strength; frames are heavy at page size; no beast heads yet.

## Stage 2 (A and C refined; B dropped at the user's word)

The user: "I like A and C, let's refine and make them look beautiful, painted, inked, crafted, intentional, bespoke."

- **The hand, by cause:**
  - The quill outline of the letter is heavy where the edge runs across the nib (35°) and a hair along it.
  - Each cord breathes. Its band is fuller on straight runs and leaner through tight turns, and its pen line follows the nib.
  - Each dot is a brush touch. The touch is fuller after a reload (one every dozen), a little long in the direction of travel, and the pitch opens on the outside of a bend.
  - Each pigment has its own coat: orpiment dense with a coarse tooth, verdigris thin and granulating, red lead dense and even.
- **Full bodies:**
  - Free stroke-ends are wound into spirals.
  - Each stroke carries a broad plait along it.
  - A second, finer plait fills what is left: red lead in A, a narrow ribbon in C.
- **Bespoke small pieces:**
  - Break and frame are strips of panels, knot and key (step) pattern in turn, between rules, with a knot at each corner.
  - The filler is a short panel that closes on itself, followed by the three-dot positura.
  - Paraph A is a knot broken at its heart beside the positura. Paraph C is the triple spiral as a ribbon.
- **Side by side with the masters** (scratchpad shots/cmp-lind.png, cmp-durrow.png):
  - Lindisfarne f. 139r's Q and Durrow fol. 86r are far denser.
  - Every part of their letters is worked: panels, spirals, birds, many colours.
  - Ours still leaves black ground between bands, and has no zoomorphic work. A beast head was not attempted: a clumsy one would be worse than none.
- **Timing at dpr 2** for the page-size set: 290–375 ms per theme, over budget.
