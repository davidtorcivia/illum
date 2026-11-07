# 15 · Draft (the user's Cyber): the drawing office, grounded in the material culture of computing

The breadth-first Cyber (cases.html?style=cyber: neon HUD brackets, tick scales, glitch doubles) was rejected as thin
trope decoration. The approved styles worked because each was read off real objects at full size. So Cyber is grounded
the same way, in the real paper, film and glass of computing and electronics engineering, and not in film pastiche.
This file is for choosing a direction. Three short studies were made, each with only four elements (a drop initial, a
paraph, a filler and one frame), on the opening of tests/blackletter.html's text, in light and dark:

- **A · the drawing office:** now **Draft** (tests/draft.html, kit/styles/draft.js)
- **B · the phosphor screen** and **C · the printout**, since removed (they are in commit ce07318)

**Decision (the user, 2026-11-07):** "A for sure, the other two are terrible. A needs to rework the drop caps though."
B and C were deleted:

- **B (beam light):** the stroke capital as slanted vectors, Lissajous paraphs, scope sweeps and a graticule frame. In
  dark mode it was only striking; light mode, a guessed Tektronix hard copy, had no source; the frame read as a ruler.
- **C (ribbon ink and paper):** the banner letter, the comment asterisk, punched tape and greenbar. It was quiet, and the
  tape did not read at line height.

The record of both stays below.

Every page takes `?draw` and `?theme=light|dark`. None of the three is in the registry. Raw downloads are in the session
scratchpad (cyber-raw/), not the repo.

## Sources, studied at full size

| direction | what | where | licence | used for |
|---|---|---|---|---|
| A | Apollo G&N engineering drawings, MIT Instrumentation Lab, 1963–66 (aperture cards; 10592×7392, 371 px a sheet inch) | archive.org `aperturecardbox432naraswimages`, pages n0524 (1001544, PC board), n0662 (schematic), n0506 (4:1 pattern), n0623, n0651 | NARA / US Gov PD | title block, item balloons, dimension lines and arrowheads, zone border, line weights, lettering |
| A | AGC logic flow diagrams A13, A5 (2005061) | ibiblio.org/apollo | NASA PD | ink and ground of a photographic print and of a xerographic copy |
| B | Sine wave 10 kHz on an analog scope (P31, 1333×1076) | Commons, Pittigrilli | CC BY-SA 4.0 | beam profile, dwell at slow points, the graticule, stroke readout characters |
| B | Tektronix 4010 storage tube (2048×1536) | Commons, David Gesswein | CC BY-SA 4.0 | storage-tube line profile, the glass, dot-matrix text |
| B | Spacewar! on the PDP-1 Type 30 at the CHM (3916×2634) | Commons, Joi Ito | CC BY 2.0 | P7 dots (white core, cyan ring, blue rim), yellow-green persistence |
| B | NASA Polaroid of a curve-tracer screen, 1996 | Commons (NASA) | PD | graticule ticks, overexposure where the beam is slow |
| B | VT100 User Guide EK-VT100-UG-002, 1979 | bitsavers.org | (archival) | 7×9 matrix, P4 white, 10 scan lines a row (not used: raster) |
| C | IBM 3211 listing on greenbar, OS/VS1 SYSGEN, 1978–79 (4032×3024) | Commons, Jonathan Schilling | CC BY-SA 4.0 | bands, edge rules, sprocket holes, impact type, asterisks |
| C | VAX/VMS banner page, 1991 | Commons, Jonathan Schilling | CC BY-SA 4.0 | the banner letter |
| C | 5- and 8-hole paper tapes (3484×2323) | Commons, TedColes | PD | hole sizes and pitch |
| C | *Programming CalComp Pen Plotters*, 1968 | bitsavers.org | (archival) | plotted lettering, centred symbols (not used yet) |

Not reached: no 1970s crepe-tape PCB artwork (the only artwork found is filled pad-and-land art with 90° turns: the
"45° taped traces" in the brief are **not** grounded and were not drawn). No colour Tek 4631 hard copy, so B's light
palette is a guess. No real Teletype 33 output, IBM 5081 card, or coding sheet. All of A comes from one source and one era.

## Measurements

**A, the MIT sheets.** These are binarized scans, so every line is ~2 px heavy. Lines as a fraction of the 0.154" note
cap height:

| line | fraction of cap |
|---|---|
| border | 0.25 |
| title-block frame | 0.28 |
| cell lines | 0.21 |
| lettering | 0.19 |
| wires and extension lines | 0.15 |
| dimension line | 0.12 |

- **Weights:** thick to thin is only ~2:1 (pens ≈ 0.8 / 0.5 / 0.35 mm, inferred).
- **Lettering:** single-stroke, vertical (Leroy). The drawing number is 0.21" with its stroke at 1/8 of the cap height.
  Glyphs are 0.65 of the cap height wide (0 and 4: 0.77). Leroy is set **~24 % wider than Hershey Simplex** (add ~0.2
  cap of tracking).
- **The title block's headings** are a pre-printed heavy grotesque; only the fill-ins are template lettering.
- **Arrowheads:** filled, **1.4 : 1**, concave sides, a blob of ink at the base.
- **Item balloon:** ring ~0.09 of its diameter, the figure 0.36 of the diameter.
- **Junction dots:** 4× the wire's width.
- **Freehand slanted lettering** appears in approvals, dates and pin numbers.
- **Colour:** a xerographic copy is ground (250 248 244), ink (72 66 65); a photographic print is ground 252, ink 52.

**B, phosphor.**

- **Beam profile:** on a P31 scope the halo is ~2× the core at full width at half maximum (7 px), widening to 15 px at
  10 %. On the storage tube the profile is tighter (4–5 px at half maximum, 9 px at 10 %).
- **Colour with brightness:** the core clips toward white mint (150 255 188) where the beam is slow, and the halo stays
  saturated (40 90 40).
- **Dwell:** endpoints and dwell points are 2–3× brighter than mid-stroke.
- **Glass:** never black. Olive (46 56 35) on the scope; the 4010 is teal (1 103 81) with ~13 % vignetting.
- **Graticule:** an internal dull red (50 8 2), darker than the lit glass, 8 × 10 divisions with the centre lines
  ticked in fifths.
- **Scope readout characters:** stroked from straight vectors, slanted, with bright dots at the stroke ends.
- **The 4010's text** is dot matrix.
- **P7:** a white core, a cyan ring, a blue rim, and a yellow-green tail.

**C, paper.**

- **Greenbar:** 3 lines green, then 3 white, at 6 lpi (0.5"). The band is ≈ paper × (0.88, 0.92, 0.88), a pale
  mint-grey. **A thin darker rule runs along each band's edges.**
- **Sprocket holes:** 0.17" across at a 0.5" pitch.
- **Impact type:**
  - Each character is off its line by ±10 % of the cap height.
  - Density varies 15–25 % from character to character, and each is heavier on one side.
  - Edges are soft, with 1–2 px of fibre fuzz.
  - The ink is a cool near-black (41–52, 44–55, 49–60).
- **The banner:** 5 × 7 cells, each cell the letter itself, one character thick, the round corners left empty, the
  cells square. The ink is grey from a worn ribbon.
- **Tape:** 0.1" pitch, data holes 0.068–0.072", feed holes 0.039–0.046".
- **CalComp lettering:** single-stroke straight vectors, curves chamfered at 45°, stroke ~1/30 of the letter height.

## What was made

Line work is written by the ink engine (kit/writer.js) where the medium is a pen. Letters come from real forms: the
**Hershey Roman Simplex** (NBS 1967; extracted by the new **tools/hershey.py** without running the pip package's code)
and **IBM Plex Mono Medium** (OFL, playground/fonts/IBMPlexMono-Medium.woff2, with its licence) for impact type.

- **A, the drawing office (ink on vellum; dark: the reverse print's white line)**
  - *Drop:* the capital lettered with the template pen on fade-out blue grid vellum, in a heavy-ruled cell, its height
    dimensioned.
  - *Paraph:* an item balloon numbered with the paragraph's place.
  - *Filler:* a dimension line across the gap stating its own length in inches.
  - *Frame (blockquote):* the sheet border with lettered zones and a title block (THE NATURE OF GOTHIC / SV-II-VI /
    J. RUSKIN / 1853).
- **B, the phosphor screen (light, not ink)**
  - *The renderer:* each mark is a beam's walk in time. The beam deposits energy where it is, and more where it slows.
    The light is spread as a core plus a bloom ~2.6× the core, and mapped per channel as 1−exp(−I·gain), so cores
    saturate to white. In dark mode the light is added to the page; light mode is a guessed Tek 4631 dry-silver hard
    copy with a visible scan raster. `?draw` shows the storage tube's write flash settling to the stored glow.
  - *Drop:* the stroke capital as straight vectors, slanted 10°, as the Tektronix readout is, its vertices burning
    brighter.
  - *Paraph:* a Lissajous figure, brightest at its turning edges.
  - *Filler:* a scope sweep: a square wave with ringing, nearly dark on its fast edges; a sine; a damped burst.
  - *Frame (pre):* a graticule's edge ticks in the internal graticule's dull red.
- **C, the printout (ribbon ink by the ink engine; paper drawn flat, its holes cut through to the page; dark: the
  microfiche reader's negative)**
  - *Drop:* the banner letter, struck one print line at a time.
  - *Paraph:* the comment asterisk (six arms, a dark centre).
  - *Filler:* five-level Teletype tape punched in ITA2 with the paragraph's last word.
  - *Frame (pre):* greenbar under the code: bands on the code's own lines, their edge rules, the sprocket margins.

## What falls short (at the 4× gate against the sources)

- **A**
  - The drop's grid is regular where the scans show nothing comparable. The grid is the fade-out vellum the source
    cannot show (microfilm drops it).
  - The template letters are sharper and lighter than the scans' bloomed ink, and the arrowheads are smaller than the
    MIT ones.
  - No pre-printed grotesque in the title block.
- **B**
  - The frame is the weakest element: edge ticks read as a ruler. A screen frame grounded in the 4010's glass (teal,
    vignetted, a square bezel) would be more honest, but it would paint the host's ground.
  - Light mode has no source.
  - The ring filler is mush at line height.
  - No dot-matrix text was tried.
- **C**
  - The tape is the weakest element: at a third of its size inside a line, the holes are 1–2 px and do not read as tape.
    An asterisk or `-----` separator row (both in the listing) would be more legible.
  - The host's code is not struck in impact type (the host's text is not ours to restyle), so the greenbar holds clean
    screen type.
  - The sprocket holes read a little like buttons.

## The drop initial, reworked (A; three options for the user)

The first drop, a thin Simplex B in a grid cell with its height dimensioned, read as a placeholder. The capital is now
treated as the drawing office treats a part (`?set=part|views|leroy` on tests/cyber-a.html; 5 lines deep). All three
take the Leroy path (Hershey Simplex) swept by a round pen as the letter's body: a template letter inked with a heavy
pen, or a slot swept by an end mill.

- **part, the letter in section:**
  - The swept body's outline (marching squares over its coverage) is inked at the thick weight.
  - The body is section-lined at 45° in the thin weight. The lining stops a pen's width inside the outline and is
    broken where a figure sits.
  - Centre marks and chain centrelines (long dash, short dash) cross each counter.
  - A radius is called out on the upper bowl: a leader with its arrowhead on the arc, and "R" with the radius as the
    screen draws it, in decimal inches.
  - The stem's width is dimensioned from outside: arrows in to its edges, the figure beside them.
- **views, a detail in two views:**
  - The front view's outline.
  - The right side view: the plate's thickness, its counters' top and bottom edges projected across as hidden (dashed)
    lines.
  - "DETAIL A" underlined, with "SCALE 4:1" beneath.
- **leroy, the Leroy layout:**
  - Cap, waist and base guidelines and the Ames guide's verticals in non-repro blue.
  - The capital inked over them as the round template pen's sweep. It is laid by the ink engine as one deposit, so the
    joins merge.
  - The template's size in a balloon on a leader to the bowl. The size is the letter's height in thousandths of an inch,
    rounded to the series.

Every call-out's lettering is the notes' size and pen. Labels are placed where they clear the outline and the box, and
the lining leaves their patches clear. Dark mode is the reverse print. Weights follow the MIT sheets: outline : thin
≈ 2 : 1.

**What still falls short:**

- The radius is measured from the counter's centroid to the outer edge, not from a true arc centre.
- The Leroy series figure may name a size the series does not have (the large templates were not checked).
- The views option leaves the side view bare: no centreline, no projection.
- None of the three has been set beside a lettering-plate source; the Apollo sheets have no large letter.

**Decision (the user):** option 1, the part in section, which is now the default. The style is named **draft**, labelled
"Draft · the drawing office". Options 2 and 3 remain as `?set=views|leroy`.

The radius call-out now finds the arc's true centre. A circle is fitted by least squares (Kåsa) to the outline near
where the leader meets it. The leader is radial and its arrowhead stands on the arc. A few angles are tried, and the
first whose figure and leader clear the ink and stay in the cell is taken.

## The full style (kit/styles/draft.js, tests/draft.html)

The specimen has the same text as the other styles. It is standalone, on the pre-library harness of
tests/astrology.html (commit 75cd20f), and the style is not in the registry yet.

Every line is written by the ink engine's technical pen at the two weights. Thin is max(1.3 px, 0.12 x-height) and
thick is max(2.4, 0.25 x-height), so about 2 : 1, as on the MIT sheets. Lettering is Hershey Simplex at Leroy's
spacing. Under ?draw, the blue construction (the grid, and guidelines under lettering 9 px and up) is drawn first, then
the inking, case by case as each scrolls into view, never scrolling the page.

- **Drop initial:** the part in section. The line initial is the part alone at the line's height, its section lining
  coarser.
- **Paraph:** an item balloon numbered with the paragraph.
- **Fillers** (MIT sheets; ANSI Y14.2):
  - a dimension line stating its gap in inches;
  - a centreline (chain line) ending in the centreline symbol ℄: an L through a C;
  - a long break line: a thin rule with freehand Z-breaks.
- **Chapter break:** a cutting-plane line. It is thick, a long dash and two short; the ends are turned, with arrows
  pointing the viewing direction and the section letter at each (A, B, C …, skipping I, O, Q, S, X, Z).
- **Book break:** the revision block (REVISIONS / REV, DESCRIPTION, DATE, APPROVED / A, RELEASED, 1853, J. R.), after the
  MIT sheets' revision block.
- **Frames:**
  - **quote:** the zoned sheet border and title block.
  - **figure:** an enlarged detail: a phantom-line boundary, with "DETAIL D" underlined and "SCALE 2:1".
  - **code:** a parts list: ITEM / DESCRIPTION over the code's lines. One item is numbered per source line; a wrapped
    line runs on in its row, unruled.
  - **pull:** the general notes: "NOTES:" and the quotation as note 1.
  - **aside:** a flagged note box: a triangle flag with the note's number, standing on the box's broken top edge.
  - **contents:** the drawing list: SHEET / TITLE, a sheet number per entry.
- **Lettering points:** periods and colons are laid as round blots of ink (the pen set down), not as Hershey's tiny loops.

**Timings** (headless, Intel Arc, whole page still):

| dpr | light | dark |
|---|---|---|
| 1 | ~111 ms | ~101 ms |
| 2 | ~115 ms | ~105 ms |

Of that, prepare is ~35 ms and the writer ~55 ms.

**What falls short (at the 4× gate against the Apollo sheets):**

- The scans' ink is heavier and bloomed: microfilm thickens every line. Their arrowheads are bigger and blacker; ours are
  true to the 1.4 : 1 shape, but lighter.
- The item balloon is a circle. The MIT one is a stadium on a dog-leg leader to its part; a paraph has no part to point to.
- The title block's headings are pre-printed grotesque on the sheets. Ours are all template lettering.
- Under ?draw the arrowheads and points (laid as ink deposits) come after the case's lines, not as each line is drawn.
- No source was found for the parts list, the general notes, or the cutting-plane line. They follow the ANSI Y14 conventions
  of the period, not a measured sheet.
- The figure's detail letter follows the chapter, so the first detail reads D, not B.
