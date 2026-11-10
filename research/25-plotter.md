# 25 · Plotter: the pen on the carriage

Pen-plotter drawing, c. 1960 to now, as a rubricate style. HP 7475A, Calcomp, Zuse Graphomat and Benson flatbeds, then the AxiDraw. The artists are Molnár, Nake, Nees, Mohr, Cohen, Kawano, and today Hobbs, Gachadoat and Licia He. This is stage 1: sources, mechanics, algorithms, letters, mark proposals, palette, risks. Nothing is built. Facts marked `[unverified]` were not confirmed in a primary source during this pass; facts marked `[inferred]` are reasoning, not citation. Raw downloads (the 7475A service manual, the EMS and Hershey font files) are in the session scratchpad, not the repo.

## Sources, as read

| what | where | licence | used for |
|---|---|---|---|
| HP 7475A Service Manual 07475-90000 (Aug 1987) | archive.decromancer.ca/bitsavers.org/pdf/hp/plotter/7475A/07475-90000_7475A_Service_Manual_198708.pdf | HP document, bitsavers mirror; cite, do not redistribute | the only primary spec read in full: step 0.025 mm, 38.1 cm/s, about 2 g, pen force, repeatability, stock pens |
| Evil Mad Scientist forum, "Pen 'pooling'" (Windell Oskay) | evilmadscientist.com/?p=20560 | forum text, quote briefly | the cause of line-end blobs |
| EMS wiki, *Pens for AxiDraw* | wiki.evilmadscientist.com/Pens_for_AxiDraw | wiki text | gel pens on dark paper, plot-twice-reversed, felt-tip wear, technical pens |
| EMS `svg-fonts` repository | gitlab.com/oskay/svg-fonts | per font, embedded in each SVG's metadata: OFL for EMS and Twin Sans; Hershey licence for the Hershey SVGs | the single-line font survey (font files read) |
| `kamalmostafa/hershey-fonts` | github.com/kamalmostafa/hershey-fonts | Hershey licence for the data (COPYING), GPL-2 for the tools | the `.jhf` files, glyph counts, the licence text |
| Fedora wiki, Hershey Font License | fedoraproject.org/wiki/Licensing/HersheyFontLicense | the licence text as quoted | the exact use restriction |
| Frank Grießhammer, "History of the Hershey Fonts" | productiontype.com/article/history-of-the-hershey-fonts | article; quote briefly | the 1967 report, the S-C 4020, the 21-unit grid |
| Relief SingleLine | github.com/isdat-type/Relief-SingleLine | OFL-1.1 (OFL.txt in repo) | modern single-line face |
| V&A, Nake *Hommage à Paul Klee 13/9/65 Nr.2*, E.951-2008 | collections.vam.ac.uk/item/O211685/ | record text citable; images non-commercial only, up to 768 px online, 5 years | canon; link, never embed |
| V&A, Nees *Schotter*, E.217-2008 | collections.vam.ac.uk/item/O221321/ | same V&A terms | canon |
| V&A, Molnár *Interruptions* (1969), E.269-2011; *(Des)Ordres* (1974), E.271-2011 [number from a search summary]; *Structures of Squares* | collections.vam.ac.uk/item/O1193775/ , /O1193781/ , /O1193777/ | same V&A terms | canon |
| V&A Research Journal, "Computer art at the V&A" | research.vam.ac.uk/journals/research-journal/issue-2/computer-art-at-the-v-and-a/ | article | accession numbers, Prince gift, Graphomat, Mohr *P-021* E.977:6-2008, Molnár *Letters from my Mother* E.1079-2008 |
| Mohr's own page, *P-021/A+B band-structure* | emohr.com/mohr_algo_021b.html | artist's site; text citable | how P-021 was made, machines, holdings |
| Digital Art Museum, Molnár early plotter drawings | dam.org/museum/artists_ui/artists/molnar-vera/early-plotter-drawings | © VG Bild-Kunst on images | dates, Sorbonne lab |
| UvA Computer Museum, Calcomp 565 | ub.fnwi.uva.nl/computermuseum/calcomp565.html | museum page | 0.1 mm step, 250 steps/s |
| Tyler Hobbs, *Flow Fields* | tylerxhobbs.com/words/flow-fields | essay; cite | the flow-field algorithm |
| mrmrs, "An Introduction to Pen Plotting" | mrmrs-src.pages.dev/writing/pen-plotting-intro | essay | pens, paper, ink drying, line merging |
| ZKM pages for Kawano, Nees, Nake | zkm.de/en/node/47078 , /48652 , /47645 | not read; listed by search only | to be read before quoting |

**Gaps.**
- Compart's database (dada.compart-bremen.de) refused the connection, so no Compart record was read. The URL pattern is `dada.compart-bremen.de/item/artwork/<id>` and the ids were not found.
- Both Hobbs essay URLs for "Executing Generative Art with a Plotter" returned 404 and the Wayback Machine is blocked to the fetch tool. What is said of that essay below (Bristol paper, textured paper gumming the nib) comes from a search-result summary only. `[unverified]`
- Nees's 1969 thesis *Generative Computergraphik* is on archive.org (`generative_computergraphik`) and was not opened. The Schotter grid size is from memory. `[unverified]`
- The Graphomat Z64 and Benson step sizes were not found. The Calcomp 565 figure is from one museum page for one unit.
- The HP 7475A's year of introduction was not found. The manual edition read is August 1987.
- Whitney's AARON page, Mohr's other pages and the Spalter records were surfaced by search and not read in full.
- Paper cockling under dense hatching: no direct source found. The account in §2.6 is inferred.
- Osifont's licence was not verified (§4.6).

---

## 1. History and canon

The word "plotter" covers three different looks, and the engine should know which one it is drawing.

**The first look (1960 to c. 1975): stepper drum and flatbed machines, coarse steps, small drawings.** The Calcomp 565 drum plotter dates from 1959 to 1966 depending on the source; one page says introduced 1959, another says developed 1958, and a company history says its 1961 sales were strong enough to take Calcomp public. IBM sold it as the 1627. The UvA museum page describes a drum-type XY plotter driven by step motors with a solenoid-lifted pen, 0.1 mm per step, 250 steps per second, dated 1966. That is a pen speed of 25 mm/s, slow enough to watch. The Zuse Graphomat Z64 was a punched-tape-controlled flatbed; the V&A journal names it as Nake's output device in Stuttgart, and a Spalter record names it for Nees's 1968 to 1970 work. Benson flatbeds drew Molnár's and Mohr's drawings in Paris. This look has visible stair-stepping in diagonals, a pen that is a real ink pen (a technical pen or ballpoint), and drawings 20 to 50 cm square.

**The second look (c. 1980 to 1995): the desk plotter.** The HP 7475A is the type specimen: six-pen carousel, A3/A4, fibre-tip pens, 0.025 mm addressable step. The step is far below the pen's own width, so quantization stops being visible and the character shifts to pen behaviour: line-end pooling, pen-to-pen misregistration, bleed on cheap paper.

**The third look (2015 to now): the AxiDraw and its kin.** Software-controlled acceleration, a servo pen lift, any pen, vpype for path optimisation. Hobbs, Gachadoat and Licia He work here, with pens, gel, fountain pens, watercolour and paint.

### Works and people

| who | work | date | machine, medium | where to look |
|---|---|---|---|---|
| Frieder Nake | *Hommage à Paul Klee, 13/9/65 Nr. 2* | 1965 | screenprint after a plotter drawing, 49.2 × 49.2 cm, edition 40, Zuse Graphomat at Stuttgart; analyses Klee's *Highroads and Byroads* (1929) | V&A E.951-2008, collections.vam.ac.uk/item/O211685/ ; history.siggraph.org/?p=6194 |
| Georg Nees | *Schotter* (Gravel) | 1968 to 1970 | lithograph from a plotter drawing, 28 × 21.8 cm; Siemens 4004, ALGOL, Graphomat Z64 [machines from Spalter via search] | V&A E.217-2008, collections.vam.ac.uk/item/O221321/ |
| Georg Nees | *Generative Computergraphik* (doctoral thesis under Max Bense) | 1969 | | archive.org `generative_computergraphik` |
| Vera Molnár | first plotter drawings; *Interruptions* | 1968 to 1969 | Benson plotter, black ink; a Sorbonne experimental-psychology lab; V&A example is "crayon and watercolour on paper" with a plotted base | V&A E.269-2011; dam.org (early plotter drawings); Morgan Library record |
| Vera Molnár | *(Dés)Ordres* | 1974 | coloured nested squares on a 20 × 20 grid, Benson plotter [Spalter via search] | V&A, collections.vam.ac.uk/item/O1193781/ ; spalterdigital.com/artworks/140 |
| Vera Molnár | *Letters from my Mother* | 1988 | screenprint after two plotter drawings | V&A E.1079-2008 |
| Manfred Mohr | *P-021/A+B band-structure* | 1969; print in *Scratch Code* 1970 to 1976 | ink on paper, 50 × 50 cm. Mohr had no output device, so he plotted the first by hand from printouts, about 20 hours a drawing; later on a Zuse plotter (Darmstadt) and a Benson flatbed with a CDC machine (Météo Nationale, Paris) | emohr.com/mohr_algo_021b.html ; V&A E.977:6-2008. Holdings listed there: Whitney, Museum Abteiberg, Spalter |
| Harold Cohen | AARON plotter drawings | V&A has a 1969 untitled (E.319-2009) and a 1989 AARON drawing (E.1047-2008) | the early abstract drawings were first shown at LACMA in 1972 [Whitney page, via search]; the 1982 work in the Whitney show is watercolour and plotter pen | whitney.org/exhibitions/harold-cohen-aaron/art |
| Hiroshi Kawano | *Artificial Mondrian* | 1964 | OKITAC 5090A, Markov chains; not a pen plotter piece in the strict sense, included for the probability model | ZKM, zkm.de/en/node/47078 |
| Tyler Hobbs | plotter works, plotter paintings | 2018 on | plotter with pens, pencil, paint; hybrid with hand painting | tylerxhobbs.com |
| Julien Gachadoat (v3ga) | *Structures* (Plottables, 2023); a unique plotter drawing made with Molnár in Nov 2023 | | | galerie Data; spalterdigital.com/?p=6692 |
| Licia He | plotter and watercolour via AxiDraw; Gazelli Art House solo show *I Have To Talk To A Plotter* (2024) | | | gazelliarthouse.com ; dirtalleydesign.com interview |

**Provenance note for Opus.** The 1960s drawings were mostly shown as prints (screenprint, lithograph) after plotter originals. The V&A's Molnár *Interruptions* is hand-coloured. What the canon shows is therefore partly a printed rendering of a plotter drawing, which is a fair precedent for "pen drawing rendered through the medium".

**Image licences.** V&A images are non-commercial only: up to 768 px online for five years, A5 in print. The Digital Art Museum shows © VG Bild-Kunst on Molnár. SIGGRAPH's history archive reserves all rights. The house rule is no image assets, so none are used; this table is for looking only. Public-domain plotter output exists in NASA and US-government technical reports (Hershey's own NWL reports are government works) but none was located and verified here.

---

## 2. The physical mechanics

A short summary first. A plotter mark is **exact geometry executed by a carriage with inertia**. It is not a hand. Corners are sharp unless the controller rounds them. Lines are one width. The things that vary are all consequences of speed, dwell and pen: ink gathers where the carriage slows, the pen deposits at touch-down and lift-off, gel pens skip, felt wears, a second pen lands 0.2 mm from where the first did.

### 2.1 Pens and widths

| pen | width | behaviour | source |
|---|---|---|---|
| HP fibre-tip, supplied | 0.3 mm and 0.7 mm | ten named colours (§5); the 7475A ships these | 7475A manual Table 1-4 |
| Koh-I-Noor Rapidograph, Rotring Isograph (technical pens, tubular nib) | ISO 128 series 0.10, 0.13, 0.18, 0.25, 0.35, 0.50, 0.70, 1.0, 1.4, 2.0 mm | constant-width line, long life; held vertical on a plotter | retailer lists via search; EMS pens wiki. Makers had their own width series historically, so the list is the ISO one only |
| Sakura Pigma Micron | 005 = 0.20, 01 = 0.25, 02 = 0.30, 03 = 0.35, 05 = 0.45, 08 = 0.50 mm (barrel codes are brand codes, not measurements) | pigment ink, "much more consistent flow"; plotter-community favourite | retailer lists via search; mrmrs praises the 005 |
| Gel (Gelly Roll, Signo, G2) | roughly 0.3 to 1.0 mm by size [unverified] | opaque; works on dark paper; "may skip on certain paper textures"; plot each path twice, reversed, for a consistent opaque line | EMS pens wiki |
| Felt-tip / marker (Sharpie Ultra Fine) | about 0.4 to 1.0 mm [unverified] | colourful, "surprisingly short life"; the tip wears from a cone to a flat, hurting flow | EMS pens wiki |
| Fountain pen (Lamy Safari EF) | EF is about a Pilot medium | "extraordinarily consistent ink flow"; fine at varied speeds. "Difficult to get even ink flow over an entire plot" with others | EMS pens wiki; mrmrs |
| Paint marker (Posca) | 0.7 to 8 mm [unverified] | opaque, dries out in a long plot | EMS pens wiki |
| Calcomp ballpoint or wet-ink pens | no figure found | | |

**On screen.** 1 mm is 3.78 CSS px. A 0.3 mm fibre-tip is 1.13 px; a 0.7 mm tip is 2.65 px; a 0.13 mm technical pen is 0.5 px, which only exists at DPR 2 and above. The sensible range for body-adjacent marks is 0.25 to 0.5 mm (about 1 to 1.9 px); initials and rules can use 0.7 mm and the double-pass heavy weight.

### 2.2 What a pen does at the ends of a line

Windell Oskay on pooling: the machine slows as it nears the end of a path, and the pen takes time to lift, and "slowing down takes time, and can lead to pooling of ink there." His fixes are constant speed while the pen is down, a faster lift, and a small gap (about 1 to 2 mm) between the pen-up and pen-down positions, since a larger gap adds delay before the lift starts. (evilmadscientist.com/?p=20560.)

Causes the engine can model, each with its observable result:

| cause | result | note |
|---|---|---|
| deceleration into a stop or corner | ink per unit length rises as speed falls; a darker, slightly wider terminus | medium.js already lays ink per unit time (header comment), so this comes for free once the path is driven by a plotter velocity profile |
| servo lift delay at pen-up | the pen sits on the paper after the carriage has stopped; a dot at the end | extra dwell time in the profile |
| lowering delay at pen-down | a dot at the start if the carriage starts moving after contact | HP: a solenoid; AxiDraw: a servo |
| gel pen resting in its holder | ink gathers at the tip; the first millimetre of a stroke is a blob | AxiDraw users rest pens on cardboard first (EMS pens page, via search) |
| refilled pens | a droplet around the nib | softsolder.com on HP 7475A refills (via search) |
| dashed lines | each dash is a pen-up/pen-down cycle, so each dash end carries a small pool | `[inferred]` from the above; true to how plotters make dashes |

**Magnitude.** No measured blob diameter was found. The model should take a pen-down dwell time and turn it into a dot radius by the pen's flow rate; choose parameters by eye against the Hobbs and Gachadoat work and record them. `[inferred]`

**Drying.** Slow-drying ink "can pool and bleed through some types of paper easily" (mrmrs). The time constant was not found. Fountain-pen inks dry in seconds to tens of seconds on sized paper; for animation the practical effect is that a wet line is darker and glossier for the first second or two. `[inferred]`, not measured.

### 2.3 Speed and acceleration

HP 7475A, measured and quoted from the service manual Table 1-1:

- pen-down velocity maximum 38.1 cm/s, programmable 1 to 38 cm/s in 1 cm/s steps; pen-up 50.8 cm/s;
- acceleration "approximately 2 g";
- addressable step 0.025 mm;
- repeatability: same pen 0.1 mm, different pen 0.2 mm;
- pen-down force: the service check is that the pen just starts to lift with 19 ± 10 grams on a gram gauge.

From these, a derived figure: reaching 38 cm/s at 2 g takes v²/2a = 0.38² / (2 × 19.6) = 3.7 mm. So a line shorter than about 7.4 mm never reaches full speed on the HP; its profile is a triangle. This matters for hatching: short hatch strokes are slower, and so heavier per length, than long ones, which gives a visible tone effect near the edges of a hatched shape. `[derived]`, assuming the 2 g applies along the axis; the manual does not say.

The 7475A moves the paper for one axis and the pen for the other (pinch rollers appear in the manual's removal procedures). Paper slip and feed give a small Y-axis error that grows with the number of passes. `[inferred]` from the roller design.

Calcomp 565: 250 steps/s × 0.1 mm = 25 mm/s. That is a speed at which a viewer can follow the line, so it is the right animation speed regardless of what the actual plotter did.

AxiDraw: acceleration is a software setting with a constant-speed pen-down mode that removes it. Speeds are given as percentages; no absolute figure was read.

### 2.4 Stepper quantization

At the Calcomp's 0.1 mm step, any line that is not horizontal, vertical or 45 degrees is a staircase of steps of at most 0.1 mm, visible under a loupe and barely at arm's length. At 0.025 mm (HP) it is invisible. Quantization is therefore a mark of the 1960s sub-look only. Zuse and Benson step sizes were not found. Implementation: snap generated coordinates to a grid of N × step in plotter units before drawing; the effect shows at 400% zoom only, which is exactly where the bar protocol looks.

### 2.5 Overdraw and layer order

Overlaps darken: ink on ink, with fibre and pigment pens close to additive until saturation, gel less so. medium.js already does this for crossings (header: "crossing an earlier stroke lays ink on ink, darker"). Two specific plotter cases:

- **Boustrophedon turn-arounds.** A hatch that is drawn back and forth without lifting overprints itself at each turn, and the carriage decelerates there. The result is a dark bead at each end of each row. This is a tell of an authentic plotted hatch.
- **Gel doubled for opacity.** The EMS pens page advises duplicating all paths and reversing them. The first pass leaves a thin or translucent line on dark paper and the second completes it. For dark mode this gives a physical mechanism for a slightly irregular line edge where the passes disagree by repeatability (0.1 mm).

**Pen-change order.** The 7475A's carousel draws a layer at a time: all of pen 1, then all of pen 2 and so on (programming order is the user's, but the plotter does not return to pen 1 efficiently). Later pens lie over earlier ones, so colour order is layer order. Misregistration between layers is 0.2 mm by specification. For rubricate this means: the black line first, the red rubric after, with the red off by up to 0.2 mm from the black where they meet.

### 2.6 Paper buckling under hatching

No source found. The account is inferred. Water-based fibre and gel inks add liquid; hatching deposits it in rows, and the paper takes up the moisture unevenly and cockles. Heavier, hard-sized, smooth paper (90 gsm or more is mentioned by a plotter-paper supplier; Hobbs reportedly uses thick, smooth Bristol) resists it. A fair visual consequence is a very low-frequency (3 to 15 mm wavelength) displacement of later passes by under 0.2 mm, strongest in dense hatched areas. Recommendation: keep it as an optional second-order effect, tied to ink load per area (so hatching causes it and empty paper doesn't). Do not draw wavy paper shading.

### 2.7 Mapping to the existing engine (medium.js header only; verify in code)

| plotter cause | medium.js | verdict |
|---|---|---|
| ink laid per unit time, heavier where the pen slows | yes | keep; drive it from a trapezoid velocity profile |
| crossing darkens, same stroke does not double | yes | keep; add partial self-darkening for retraced hatch turns |
| dry ink breaks at the paper's high points | yes | maps to gel skipping and to felt-tip running dry; keep |
| flexible nib spreads with pressure, broad-nib edge sweep | yes | wrong for a plotter. Add a fixed round tip (technical pen, fibre tip) with no pressure variation |
| **damped-spring hand: lag, overshoot, a true curve with a hand's drift** | yes, central | **wrong for this style.** A plotter's path is exact, its corners are sharp, its velocity is a trapezoid. The spring model must be bypassed: drive the nib along the path at the planned speed |
| pen-down and pen-up dwell blobs | partial (touch-down heavier) | add explicit dwell and lift delay |
| paper tooth and fibre height field | yes, root object | keep; it is the cause of gel skipping |
| stepper snap to a grid | no | trivial at generation time |
| pen-to-pen misregistration | no | one offset per pen, up to 0.2 mm |
| cockle displacement | no | optional |

---

## 3. The algorithms

None of these use scattered random dots. Each variation is a displacement, rotation, omission or length drawn from a distribution that is a function of position in a structure, which is the house "order first, then 1% disorder on a gradient" (03-procedural). The Schotter-class randomness is **seeded structural displacement**, deterministic per content hash. It passes the no-speckle rule because it moves whole shapes, along a gradient, with a stated cause (a program's variable). `[note]`: the phrase "one per cent disorder" is attributed to Molnár in 03-procedural; no primary quote for it was found in this pass, only the series titles *(Dés)Ordres* and the French pun on "des ordres". `[unverified]`

### 3.1 Hatching and cross-hatching

- Choose angle θ (45 degrees is the engineering section-line convention, ISO 128); for a polygon, intersect the family of parallel lines at spacing s with it by scanline.
- **Boustrophedon**: alternate the drawing direction on successive rows so the pen stays down along the zigzag. Fewer pen lifts, a bead at every turn (§2.5). For a convex shape, the turn happens on the outline or just inside.
- **Inset** the hatch ends by about half a pen width from the outline so the contour pen's line covers them; or let the hatch overshoot slightly (a plotter does not clip at the contour to the pixel).
- **Cross-hatch**: a second family at θ + 60 to 90 degrees. Two crossing passes darken at intersections (diamond-pattern tone).
- **Tone** by spacing: s from about 1.6× pen width (nearly solid; below that the lines merge) to 8× or more. Spacing as a function of position gives a gradient; hatch density is a legitimate place for "disorder on a gradient".
- **Direction field hatch** (Winkenbach and Salesin, *Rendering parametric surfaces in pen and ink*, SIGGRAPH 1996, history.siggraph.org/?p=117027) when the hatch should follow form; for a drop initial a straight hatch is the plotter look.
- Cost: a 50 × 50 mm fill at 0.6 mm spacing is about 85 strokes; cross-hatched, 170. Cheap against the 200 ms budget if emitted as path data and drawn as one polyline per row.

### 3.2 Molnár: *Interruptions* and *(Dés)Ordres*

- *Interruptions* (1968 to 1969): from a 25 × 25 grid, each line rotated by a random amount, then random interruptions erase sections. (As described in the Morgan Library and V&A records, via search.) The 'interrupt' is an omission: a line becomes two segments with a gap, each segment ending with a pen-lift mark.
- *(Dés)Ordres* (1974): a 20 × 20 grid of squares, each containing nested squares, with some displaced, so the nests appear to jostle. `[from V&A record via search]` A usable rule: for cell (i,j), draw k nested squares at inset d, 2d, ...; per nest, with a probability that depends on the cell's distance from a chosen centre of order, shift it by up to δ and/or omit one side.
- Molnár's own method is her stated "imaginary machine" (*machine imaginaire*, V&A blog). The V&A blog "Vera Molnar: Machine Imaginaire" (vam.ac.uk/blog/museum-life/…) was surfaced and not read.

### 3.3 Nake: *Hommage à Paul Klee*

From the V&A record: a screenprint from a 1965 plotter drawing that analyses Klee's 1929 *Highroads and Byroads*; the title's numbers are the date of creation (13 Sept 1965) and Nr. 2 is the second of several. Nake's program built Klee-like arrangements of horizontal and vertical bar structures with probabilities for position, length and direction, with colour assigned from a pen list `[from memory; unverified]`. For the engine: a row of parallel bars of varying length, vertical or horizontal, from a probability table that is a function of position, where each bar is a stroke or a hatch band.

### 3.4 Nees: *Schotter*

V&A: "introduces random variables into the program, so an orderly grid of squares breaks down into disorder." From memory (`[unverified]`, to be checked in the thesis): 12 columns by 22 rows of squares; rotation and displacement of each square drawn from a uniform distribution whose width grows with the row number, so order at the top dissolves toward the bottom. The key idea is a linear ramp of disorder, not a constant amount. Each square is four lines drawn separately, so corners overshoot or gap.

### 3.5 Flow fields

Hobbs (tylerxhobbs.com/words/flow-fields): a grid of angles, with the grid larger than the canvas by about 50%; start a curve, step in the angle of the nearest cell, step length 0.1% to 0.5% of image width; short curves look like fur, long ones fluid; seed starts on a regular grid, uniform random, or circle packing; "stop a curve when it gets too close to an existing curve" for a minimum line spacing; continuous distortions give smooth fields, quantised or per-row angle gives rocky ones. "Don't just use Perlin noise and call it a day." House anti-pattern 3 (05-the-bar §4) names uniform-length flow fields on dark as the 2015 Processing default. If used, use a field with structure: hatch direction following a form (the initial's own contour via distance-field gradient) with spacing-based termination, which is engraving hatch more than flow field.

### 3.6 Path ordering (TSP) and what it looks like

A plotter draws strokes in a chosen order. Un-optimised, it follows generation order, which "generally isn't correlated to physical proximity" (mrmrs); optimising cut hours on some plots. Method: greedy nearest-neighbour on stroke endpoints, allowing each stroke to be reversed, then 2-opt; vpype's `linesort` and `linemerge --tolerance 0.5mm` (Hobbs, via mrmrs) do this. **What the viewer sees as it draws**: the pen moves to the nearest unfinished stroke, so the drawing progresses in a wandering, locally-connected order, with a quick fly between strokes that is not inked. For growth animation the correct order within a pen layer is nearest-neighbour, not left to right and not random; between strokes, hold for the pen-up travel time at 50.8 cm/s-equivalent (a small beat), then start. Layers go pen by pen.

### 3.7 Hershey single-stroke fonts

**What it is.** Dr. Allen Vincent Hershey, theoretical physicist, U.S. Naval Weapons Laboratory, Dahlgren, Virginia. *Calligraphy for Computers*, NWL Report No. 2101, 1 Aug 1967; follow-up *Fortran IV Programming for Cartography and Typography*, 1969. The letters were drawn by connecting dots on a coarse grid up to 21 raster units high, three sizes (9 units for maps and equations, 13 or 21 for text), for the Stromberg-Carlson S-C 4020 microfilm recorder with a Charactron CRT. Calcomp was not involved; the association with pen plotters is later adoption (per Grießhammer's article, which does not mention Calcomp). The set covers Roman, Italic, Script, Greek, Cyrillic, Blackletter, plus mathematical, cartographic, meteorological, astrological and music symbols and some 2,000 Japanese ideographs as a proof. Data for 1,377 Occidental characters were published by the National Bureau of Standards (now NIST) in 1976 (Wikipedia).

**Variants.** Simplex (one stroke), Duplex, Complex, Triplex. Duplex and Triplex are heavier because strokes are doubled and offset. That is also how a plotter makes bold lettering, by repeated offset passes with the same thin pen. It is a physical cause the engine can reuse: **bold is more passes, and the passes disagree by the machine's repeatability**.

**Licence (read).** The text, as the Fedora wiki and the `kamalmostafa/hershey-fonts` COPYING file give it: "This distribution of the Hershey Fonts may be used by anyone for any purpose, commercial or otherwise, providing that" (1) these acknowledgements are distributed with the font data: "The Hershey Fonts were originally created by Dr. A. V. Hershey while working at the U. S. National Bureau of Standards" and "The format of the Font data in this distribution was originally created by James Hurt, Cognition, Inc., 900 Technology Park Drive, Billerica, MA 01821"; (2) the data "may be converted into any other format EXCEPT the format distributed by the U.S. NTIS". So: permissive, with attribution, and no conversion into the NTIS format. It is **not OFL**; under the project's "OFL or similar" wording it qualifies, but the attribution must ship with the data. The Hershey Text Inkscape extension is GPL-2 or later; no code from it is needed.

**Glyph data (read).** The `.jhf` files in `kamalmostafa/hershey-fonts` hold 96 records each, which is printable ASCII: `rowmans`, `rowmand`, `rowmant` (Roman simplex, duplex, triplex), `scripts`, `scriptc`, `gothiceng`, `timesr`, `timesi`, `cursive`, `futural`, `futuram`, plus Greek, Cyrillic, symbols, astrology, markers. **No accented Latin letters in these ASCII faces.** The EMS SVG Hershey set has 216 glyphs per face (`HersheySans1`, `HersheySerifMed` and so on), which suggests Latin-1; Twin Sans has 262. Accent coverage of the 216-glyph Hershey SVGs was not inspected glyph by glyph. `[unverified]` Quality: curves are polylines on a coarse grid; at body size they are invisible and at a 4-line initial the facets are visible. Both are period-true; choose to show facets or smooth by a single Chaikin pass, and keep the choice constant.

**Delivery constraint.** Browsers do not render SVG fonts or open-contour TTFs. These ship as path data that the engine strokes, so the licence notice must travel with the data file. This sits with the "letters come from credited open-licence fonts" rule: the credit is the file header.

### 3.8 Modern single-line and engraving fonts

| face | licence | glyphs | quality for this use |
|---|---|---|---|
| Hershey Roman Simplex / Duplex / Triplex, Script, Gothic English | Hershey licence (permissive, attribution) | 96 per `.jhf` (ASCII); 216 per EMS SVG | authentic; ASCII-only in the `.jhf`. Roman Complex is the best-proportioned text weight; Triplex bold by passes |
| EMS fonts (Evil Mad Scientist; Sheldon B. Michaels, Oskay) | OFL 1.1, derivatives of OFL fonts, credit in each file | 216, EMS Readability includes À to ã etc. (Latin-1 accented, verified in the file) | stroked derivatives of Source Sans Pro Light (Readability), Allura (Allure), Italianno (Swiss), Sacramento (Capitol), Tangerine (Invite), Mrs Saint Delafield (Society), Orbitron (Osmotron) and others. The scripts relate to the copperplate style (23) and are the nearest thing to a plotted hand. Note derivatives need credit lines |
| Twin Sans (Keith Packard, 2023) | OFL, derivative of Hershey Sans | 262 | a modern Hershey Sans with extended coverage; the best candidate for small text and nav; accent set to be confirmed |
| Relief SingleLine (isdaT Toulouse: Élisa Garzelli and Noëlie Dayma, with François Chastanet; Vectora influence) | OFL-1.1 | not listed on the repo page; a character-map PDF is in `documentation/` and was not read | Regular only; kerning; lowercase alternates for g, l, y; OTF-SVG, SVG and TTF open paths plus closed OTF/WOFF2. Designed for CNC, laser, and plotter. `[unverified]` coverage |
| Mistral SingleLine (isdaT) | OFL | | not assessed |
| Routed Gothic (dse) | OFL-1.1 (README states "now distributed under the terms of the SIL OFL 1.1") | not stated | an outline monoline face from engineering lettering; stroke width is fixed so it can be centre-lined |

**Recommendation.** Use **Hershey Roman (simplex, duplex, triplex) for display** (initials, headings, titles) and **Twin Sans for small text** that needs accents, with Relief SingleLine as a contrast candidate after its character map is read. Reasons: the Hershey faces are the canonical plotter letter and the weights are real plotting practice; Twin Sans is OFL and larger; both are open-path data that the engine strokes with its own pen. EMS Allure or Swiss gives a copperplate-hand plotted signature for the colophon.

### 3.9 Outline faces for a hatched drop initial

A pen drawing of a letter outline is a uniform-width line; the contrast of a Didone becomes a thin outline of two widths, which is a tell (it reads as a vector stroke of an outline). Three kinds of letter suit hatching:
1. **Heavy low-contrast faces with a generous stem**, where the hatch has room (4 to 8 hatch lines across a stem). Candidates with OFL licence on Google Fonts, `[licences not re-verified in this pass]`: Jost (Futura-like geometric; Futura is period-appropriate), Archivo Black, Josefin Sans Bold. The font file is only the source of outlines; the engine strokes the outline and fills with hatch.
2. **Plotter-native letters.** Hershey Triplex at large size is drawn as a single bold stroke by offset passes. No fill needed. Cheap and the most authentic.
3. **Engineering lettering**: Routed Gothic (OFL-1.1 verified), Osifont (ISO 3098 lettering; licence not verified, repositories list "Other"/LGPL/none, so do not use until read) are monoline; they can be centre-lined for single stroke or used as hairline outlines.

Mono for code: IBM Plex Mono, Space Mono, Courier Prime are OFL on Google Fonts `[not re-verified]`; code is text and stays a text font, with plotted rules around it.

---

## 4. Mark-by-mark proposals

Pen width scale: let one **pen unit** = 0.3 mm; text sizes are in `lh` as house style says (10-rubricate, 01-canon law 2). Colour names refer to §5. "Cost" is stroke count for the 200 ms budget; every proposal below is below about 400 strokes.

### 4.1 Drop initial (big, 3 to 5 lines)

- **A. The bold stroke.** Hershey Roman Triplex at 3 to 5 lines high, drawn by 3 offset passes in black fibre-tip, 0.7 mm, a little unregistered (0.1 mm). Cost 30 to 60 strokes. Ref: Hershey Triplex; HP sheet lettering. The least risk and the most authentic.
- **B. Contour and hatch.** An outline of a heavy geometric letter (Jost or Archivo Black) in black at 0.5 mm, hatched inside at 45 degrees in the rubric colour, spacing 0.8 mm, boustrophedon with beads, offset from the contour by pen-to-pen repeatability up to 0.2 mm. Cost 100 to 200. Ref: ISO section lines; Nake's *Hommage* for the idea of ink colour as layer.
- **C. Letter in a Molnár field.** The letter (Hershey) stands on a 6 × 6 block of nested squares, order breaking down toward the block's far corner (Schotter ramp). The letter stays legible because it is drawn in the darker pen over a lighter field. Cost 200 to 350. Ref: *(Dés)Ordres* 1974; Nees *Schotter*. Highest risk of "generative cliché"; legibility check at 25%.

### 4.2 Line initial (small drop, 1 to 2 lines)

- **A. Hershey Roman Duplex**, two passes, black. Ref as above.
- **B. EMS Swiss or Allure** (script derivative), one pass in the rubric pen. A plotted hand. Ref: EMS fonts, Italianno/Allura.
- **C. Hershey Simplex capital in a square frame** of one pen, the frame with a gap (an interruption) on one side. Ref: Molnár *Interruptions*.

### 4.3 Paraph (¶ before a paragraph)

- **A. ¶ in a single-line face** (Hershey, if the glyph exists in the set; `[unverified]`; else Twin Sans), red pen, with its lower bowl closing after the pen has lifted so the end carries a bead.
- **B. An interrupted small square**: 1 to 3 nested squares with one side omitted, pen-lift beads at the gap ends. Ref: *Interruptions* 1968 to 69.
- **C. A short square-wave** of 3 to 5 periods, horizontal, from the left margin. Ref: Mohr, *P-021* (square waves and zigzags with probabilities for width and length).

### 4.4 Line filler (the free end of the last line)

- **A. One row of Schotter.** Squares along the free space, disorder rising toward the margin. Ref: Nees. Length adapts, so it works at every gap; the gradient sets how much emptiness is left.
- **B. Hatch run.** A parallel hatch at 45 degrees, spacing fixed, in a long thin parallelogram, tone ramping (spacing opens toward the text). Ref: section lines.
- **C. Square wave.** Mohr's line, one pen, ends with beads. Cost under 30.
For a gap under about 2 em, draw nothing (house rule: filler has a length range).

### 4.5 Heading run-out

- **A. Double rule** in two pens (0.3 and 0.7 mm) that start together and stop at different lengths, the thick one with a pen-up bead. Ref: drafting rules; HP stock pens.
- **B. A sinusoid** whose amplitude is shaped by an envelope from the heading to the margin. Ref: Gachadoat, galerie Data sinusoids show (title only was seen; the work was not read). `[unverified]`
- **C. A dashed rule**, where every dash is a pen cycle with a bead at both ends. Ref: how a plotter makes dashes (§2.2). Cheap, and instantly recognised by plotter people.

### 4.6 Section breaks, by rank

- **Small (between runs of text):** one interrupted square, or three short ticks with beads. Ref: *Interruptions*.
- **Major (chapter):** a band of four to six rows of squares, ordered at the top and dissolving downward. Ref: *Schotter*, with the 12 × 22 proportion thinned to a band. Black with one red square displaced.
- **End (the end of the text):** a plot legend in single-line letters: date, seed, pen sizes, in the pattern of Nake's title "13/9/65 Nr. 2" (date and sheet number). It is a colophon (credo 12) and a plotter convention. A small registration cross may go beside it. Ref: Nake; plot headers on HP output.

### 4.7 Frames

- **Quote.** A: the four corners only, drawn as crop marks (an L each), thin black, with a gap in the left edge where the quotation begins. B: a Molnár nest of 2 or 3 rectangles with one side interrupted. C: a left margin bar drawn as a hatch band of 8 lines.
- **Figure.** An engineering sheet frame: border line, an inner border, a small title block under the figure with the caption in Twin Sans. Ref: the technical-drawing sheets that HP and Calcomp plotters made (ISO 5457). Cost under 20 strokes.
- **Code.** A margin ruler: tick marks every line down the left edge, longer every fifth, drawn in a 0.13 to 0.25 mm pen. Ref: graph paper and lineprinter listings; the line height is the grid. The code itself stays a monospace text font.
- **Pull quote.** A large Molnár nested-square or Schotter field behind and to one side of the quote; the quote's text stays in the page type. Ref: *(Dés)Ordres*. The bar item 4 (integration) requires that nothing cover a letter; keep the field in the margin-side third.
- **Aside.** A dashed rectangle with bead-ended dashes (§2.2), one colour. Ref: plotter dashed lines.
- **Nav.** A rule with tick marks at each link, the current one drawn twice (a doubled, darker tick). Ref: ruler scale; the doubled pass is the plotter's darkening.

---

## 5. Palette

All hexes are my approximations of the pen colour as it dries on white paper, not measured; check on the playground against photographs. They are values to tune, not specifications.

**HP 7475A fibre-tip set (0.3 mm), from Table 1-4:** blue, green, black, aqua, violet; and brown, yellow, orange, red, red-violet. The 0.7 mm pack is black only in the pack read.

| pen | approx. hex on white paper | role |
|---|---|---|
| black | `#1c1c1f` | all contour; text-adjacent marks |
| red | `#c4302b` | the rubric pen: paraph, initial hatch, accents |
| blue | `#27408f` | secondary, figures |
| green | `#2c7a4b` | sparing |
| violet | `#5a3a8c` | sparing |
| brown | `#6b4a30` | warm shadow line |
| aqua | `#1b9aa8` | figure captions or none |
| orange | `#e0701f` | one accent only |
| yellow | `#e3c02b` | weak on white; hatch on dark only |
| red-violet | `#a2285c` | alternative to red |

Rule: black plus one rubric pen, a third only on a figure. The Hobbs and Gachadoat work is also mostly black on white.

**Light stocks.**
- Plotter bond, bright white with a slight cool cast: `#f5f5f1`.
- Smooth Bristol or hard-sized cartridge (plotter-art practice): `#f3f1ea`.
- Drafting vellum or tracing paper, translucent with a faint warm tone: `#eee9dc`. Vellum is the one that feels most "1970s drawing office".

**Dark stock (designed, not inverted).** Plotter artists draw with opaque gel or paint pens on black card. Per the EMS pens page, many gel pens have opaque ink that works on dark paper; plot paths twice, reversed.
- Black card: `#111114`, with a faint blue-black bias.
- White gel: `#f1f0ea` (Sakura Gelly Roll white and Uni-ball Signo are named in the EMS guide).
- Silver gel: `#c3c7ce`.
- Gold gel: `#c9a24f`. Per the house taste notes, gold is for small things only: a single bead or one rubric element per page.
- Coloured gel, one accent: `#e86a5c` coral-red as the dark-mode rubric.
Both passes are drawn: pass 1 reads as a lighter, thinner line, pass 2 brings it to full density, so the pen draws twice on dark stock and the doubled line has a slightly irregular edge. This is a physical reason for the mode to look different, which the spec asks for.

---

## 6. Risks

| risk | why it reads as cheap or digital | what real plotter work does |
|---|---|---|
| **Monoline strokes with round caps** | House anti-pattern 8 names it directly: "drawn by a plotter, unsupervised". This style is monoline by nature, so it starts inside the anti-pattern | tie width to a pen (0.13 to 0.7 mm) and never use CSS round-cap lines; ends carry dwell beads; heavy weights from repeated passes; two or three pens at different widths on one page |
| **Perfect parallel hatching** | 02-analog lists "perfectly parallel hatching" under *Never* | a plotter's hatch is parallel in the plan, but lines differ by repeatability (0.1 mm), by short-stroke slowdown (§2.3), and by turn-around beads; vary spacing on a gradient. Do not add jitter |
| **Flow fields** | anti-pattern 3: the Processing default of 2015 | restrict to hatch directions from a form; never uniform-length curves on a dark background |
| **Random dots, stipple** | rule: no speckle. Plotter stippling is an established genre but is dot scatter | do not use stipple or TSP-art dots. The only dots are pen-down beads, each with a cause |
| **Hershey as novelty** | single-line fonts are everywhere in maker work and sign engraving | use it at the sizes and weights where it was designed (Simplex to Triplex), set on the baseline grid, in black and one rubric pen; avoid a text column set entirely in it |
| **Hand-wobble filters** | anti-pattern 9 | the geometry is exact; the only irregularities are in ink and in registration |
| **Too clean** | an exact path with no ink physics reads as an SVG | blobs, speed-dependent weight, dry skipping on gel, 0.2 mm layer offset. These are where the style's craft sits |
| **Retro computer-art pastiche (green terminals, scanlines)** | it would fail the pastiche test (anti-pattern 11) | the references are drawings in ink on paper, not screens |
| **Dark mode as invert** | anti-pattern in 18-tells | white and silver gel on black card, two passes |
| **Density over budget** | cross-hatched fills grow fast | stroke counts in §4; emit as one polyline per row; measure |
| **Compression at 390 px** | 0.13 mm pens vanish | minimum 1 CSS px at DPR 1; scale pen with the page, not the screen |
| **Overuse of Schotter** | the Nees gradient has become a stock image of generative art | use it once per page, as the major break; the filler is a single row, not a field |

---

## 7. Rule conflicts and open points

1. **Hershey is not OFL.** Its licence permits any use, commercial or not, with the attribution lines shipped with the data and no conversion to the NTIS format. It meets "OFL or similar", and the credit must live in the data file's header and the colophon.
2. **EMS and Twin Sans are OFL derivatives of OFL (EMS) or Hershey (Twin Sans) fonts.** Credits are required in each file. Twin Sans being OFL on a Hershey derivative is Keith Packard's licence statement, taken at face value.
3. **Hershey Text (GPL-2 or later) and the `hershey-fonts` tools (GPL-2) are code licences; vpype's licence was not checked.** No code from any of them is needed; the algorithms in §3 are short and standard.
4. **Browser limitation.** SVG fonts and open-contour TTFs do not render in browsers. All single-line text is path data stroked by the engine (the same as the stamped pen route).
5. **No textures.** Paper tooth already exists as the medium's causal substrate. Cockle (§2.6) is inferred and optional.
6. **No random dots.** Beads at pen-down and pen-up are dots with a cause (dwell). Stipple and scatter are excluded.
7. **Animation grows.** The pen draws at 25 mm/s (Calcomp 565 speed) in pen-layer order with nearest-neighbour stroke order. Nothing fades; on dark stock a second pass completes the line, and that is a new stroke, not a fade. Gel's first pass is drawn lighter and the second completes it. If this is read as fading, draw the pass as one doubled stroke.
8. **200 ms.** Cross-hatched initials are the heaviest items. Measure before choosing A/B/C in §4.1.
9. **Image licences.** V&A images are non-commercial and limited to 768 px; none are embedded. Compart, ZKM and Mohr's site were not checked for image terms.
10. **The medium's hand model is the wrong default** (§2.7). A plotter mode with rigid path following is required, and is the biggest piece of new work.
11. **Tension to resolve.** House guidance forbids perfectly parallel hatching and monoline round-cap strokes; the style's authentic form is both. §6 gives a way through (causal departures from perfect), but this needs a visual check by the user.

## 8. Reading list to finish before building

- Nees's thesis (archive.org `generative_computergraphik`): the Schotter parameters.
- Nake's own text on *Hommage à Paul Klee* (dam.org Nake page; digitalartarchive.siggraph.org/?p=6194).
- Compart: when the server is reachable.
- Hobbs's plotter essay in the Wayback Machine.
- Relief SingleLine character map (`documentation/` in the repo).
- ZKM pages for Nake, Nees, Kawano.
- A measured pen-down blob diameter against dwell, from a real HP or AxiDraw test, would replace the inferred model in §2.2.

---

## Stage 1: the machine, the bench and three directions

Built: `kit/styles/plotter-pen.js` (the machine), `plotter-draw.js` (the geometry sent to it), `plotter-letters.js` (the letters as data), `plotter-office.js`, `plotter-section.js`, `plotter-field.js` (the directions); `tests/plotter-medium.html` (the bench) and `tests/plotter-directions.html` (the directions). The style is not registered in `kit/illum.js`, and no shared file was changed: the machine drives `kit/medium.js` through its public `createMedium(...).sweep / step / finish / render` and never uses its `Pen` (the damped-spring hand). Licences: `fonts/plotter/README.txt`, `fonts/plotter/Jost-OFL.txt`, and the Hershey acknowledgements verbatim in the header of `plotter-letters.js`.

**Checked in this stage.** The HP 7475A figures in §2.3 were read in the service manual itself (07475-90000, Aug 1987, Table 1-1): pen-down to 38.1 cm/s (programmable 1 to 38 in 1 cm/s steps), pen-up 50.8 cm/s, step 0.025 mm, acceleration "approximately 2g", repeatability 0.1 mm same pen and 0.2 mm another pen. The parts list gives fibre tips at 0.3 mm (packs of 5) and 0.7 mm (black). The Hershey licence was read in `kamalmostafa/hershey-fonts` COPYING and matches §3.7. Still unverified: everything about dwell, bead size and ink response (below), the Calcomp figure (one museum page), the Schotter grid.

### The machine (every variation and its cause)

A stroke is planned as a carriage moves: a forward and a backward pass limit the speed at every vertex to what the acceleration can reach and what the corner allows (junction deviation: a straight run keeps its speed, a reversal stops), so each segment is a trapezoid or, if short, a triangle. The ink is laid by quads swept along the path, constant in width except as the speed sets it, with a disc of the tip's radius at each corner the tip turns through.

| what you see | its cause in the model | figure |
|---|---|---|
| a line a little finer and lighter in its middle, heavier toward its ends; a short stroke heavier all along | a fibre tip lays ink per unit of time; load = v0 / (v + v0) sets ink and width | HP: vmax 381 mm/s, 2 g (read); v0 70 mm/s, width +6 % at rest `[inferred, by eye]` |
| a dot at each end of a stroke, darker than the line | pen-down: the tip touches before the carriage moves; pen-up: it stays down while the lift happens; the ink of that dwell spreads radially | HP 30 / 35 ms, AxiDraw 140 / 110 ms, Calcomp 60 / 60 ms `[inferred]` |
| a dark turn at each end of a boustrophedon hatch row | the carriage stops to reverse (v → 0 in the profile), not an added mark | — |
| darker where lines cross | ink laid over settled ink adds; over wet ink it merges (the engine's wet/dry layers, given the plot's real elapsed time between strokes) | — |
| the hatch not quite on its contour | the second pen's layer sits off the first by up to 0.2 mm, one offset for the layer | 0.2 mm (read) |
| hatch rows not quite evenly spaced | each stroke returns within 0.1 mm: one rigid offset per stroke, never per vertex | 0.1 mm (read) |
| a page's later marks a little broader | the tip's wear, kept in a ledger across a page in plot order | +3 % width a metre for fibre `[inferred]` |
| on black card, an opaque line with a slightly irregular edge | gel plotted twice, the second pass reversed; the first is thinner and skips the paper's low points | — |
| a staircase on a drum plotter's diagonals at 2× and up; diagonals a little lighter | 0.1 mm steps in eight directions; a diagonal step moves both motors in one step time (√2 faster) | 0.1 mm, 25 mm/s (museum page) |

Not modelled: paper drag (the 7475A's grit wheels) and cockle under dense hatch; both would be sub-0.1 mm here and are left out rather than faked. The stepper's staircase is drawn only where a device pixel is finer than a step (2.65 device px per CSS px and up), the only place it can be seen.

The tone range comes from one engine setting per tip (`base`, the darkness of the thinnest full coat): fibre .3, liner .4, technical pen .48, gel .26. With the engine's default (.62) a black line saturates and neither the speed nor the overdraw shows.

### The directions

| | A · the drawing office | B · section lines | C · the field |
|---|---|---|---|
| machine, stock | HP 7475A, plotter bond `#f5f5f1` | AxiDraw, Bristol `#f3f1ea` | Calcomp 565, drafting vellum `#eee9dc` |
| pens (light / on black card `#141417`) | fibre 0.3 black, 0.3 red, 0.7 black / white and coral gel | 0.35 pigment liner, 0.3 red liner / white and coral gel | technical pen 0.18, 0.25, 0.35 red / white and coral gel, one square gold |
| drop | Hershey Roman Triplex in the rubric pen, at a size where its three strokes stand apart (titling) | Jost 800 (OFL) outlined in black, sectioned at 45° in red, back and forth; `cross` adds a second family | Hershey Simplex bold by three passes, red, over a block of Molnár nests that lifts 1.2 mm either side of the letter; disorder rising to the far corner |
| paraph | a square in HP-GL's solid fill (RA, fill type 1) | a lozenge in section | Interruptions: a square open toward the text round a solid red square |
| filler | HP-GL line type: dashes fitted to end on a dash, each a pen cycle | a strip between two rules, its hatch opening toward the margin | Interruptions: short strokes, upright by the text, turned and dropped more toward the margin |
| run-out | drafting double rule, 0.7 to the margin, 0.3 lifted sooner | a wedge in section | Mohr's band: a square wave, widths from a table, height falling to nothing |
| breaks 1 / 2 / 3 | three dwell dots / dash-dot rule round a filled square / the plot legend (date, sheet number) between registration marks | a lozenge / three, the middle crossed / the pen-test swatch, open to closed | an interrupted nest / a line of nests ordered at the middle / Schotter as a band, one square red (gold on black) |
| quote | crop marks at the box's corners | a bar in section down the margin | two rectangles, the outer interrupted at the quotation's first line |

Drawn (the page's "plot", or `?draw`): pen by pen, the nearest stroke next, each sweep at its machine time; the HP and AxiDraw at their own speed, a piece capped at 7 s (the Calcomp is quickened to fit). The pen changes take a beat. A plot's end state matches the still print (checked side by side on A).

### Timings (Chrome, this machine's GPU; a GPU readback inside the timer)

| | dpr 1 | dpr 2 |
|---|---|---|
| a page's ornament, all 8 pieces, the first panel on the page (includes making the GL context and compiling the engine, ~40 ms once a page) | 52–60 ms | 67–88 ms |
| the same, warm: A dark / B / C | 14–15 / 14–16 / 11–18 ms | 16–24 / 20–28 / 13–19 ms |
| the cross-hatched drop alone (B, `cross`) | 3–4 ms | 4–9 ms |
| a single 390 px panel, cold page | | 42–73 ms |
| the whole bench (every panel, both stocks, the 3× and 4× views) | | 203–228 ms |

The cost is the medium's flow passes, not the path count: ink waits in the stroke layer until a stroke would cross ink not yet poured, and only then is time let pass (a hatch family is one or two pen-downs; a field of nests rarely overlaps itself).

### Where it stands (my read)

- **A** is the most authentic and the quietest: at 1× it reads at once as a plotted document (Triplex titling, a line type, a legend), at 4× the Triplex serifs are Hershey's own fans of strokes. Its risk is that it is a document's furniture more than ornament; its seeds vary only in registration and the legend's number.
- **B** is the most beautiful at page size: the sectioned capital carries real colour and its turn-dots and red-off-black registration are visible craft at 4×. The hatch earns its regularity by its causes and has no jitter. Its seeds vary only in registration (the program is regular); stage 2 would want the section angle and density to answer rank and the letter.
- **C** is the canon cited most directly and the most at risk of generative cliché. The drop's field is busy at 1× (a 3–4 cell block), the Interruptions filler ends in scattered strokes, and Schotter, though used once as the end break, is the stock image of computer art. It is the only one whose seeds change the composition.

**Recommendation: B**, with A's lettering (Hershey for the legend and small capitals, Triplex for line initials) and A's dwell-dot break folded into it; C's Schotter end-break kept as the single cited canon mark if the user wants one. Next for B: rank-dependent density and cross-hatch; a figure and code frame (§4.7); the `writer` on the page's one working window (as `kit/writer.js`) instead of a sheet per scale; registration in `WRITTEN`.

---

## Stage 2: ink on paper, measured on masters (A and B kept, C dropped)

The owner kept A (the drawing office) and B (section lines) and dropped C; `plotter-field.js` and its section are gone. The goal: lines that read as ink on paper, held against real plots.

### The masters (tests/plotter-refs/, CREDITS.md)

Searched Commons, Openverse (Flickr CC) and the plotter communities. No openly licensed close-up of HP 7475A output was found, so the fibre-tip line is modelled from Calcomp plots made with contact pens of the same kind. Four crops, each measured with a script in the session scratchpad (numpy, on the originals):

| master | licence | scale | measured |
|---|---|---|---|
| Judson Rosebush, *Letter Field*, 1978, Calcomp, liquid inks on rag paper | CC BY-SA 3.0 | 11.72 px/mm (the 6253 px scan is the 21 in sheet) | fill rows 1.02 mm apart, one pen-down each, about 0.9 mm wide with a 0.15 mm paper gap; a darker dot at both ends of every row, 0.65–0.9 of the row's width, 1.5× its optical density; overlap of two inks close to additive |
| Digital Effects, *Cards, Cube, Bottle*, 1977, Calcomp | CC BY-SA 3.0 | ~15.7 px/mm, inferred (row pitch set equal to *Letter Field*'s) | each row darker at its two edges than in its middle (core density 0.77 of the rim's, each rim about a quarter of the width); a fringe beyond, about half of it paper showing (the tooth); flecks across the rows too; streaks along them (the tip's fibres) |
| fo.ol, a hobby servo plotter, felt pen | CC BY-SA 2.0 | ~18 px/mm, inferred (line taken as 0.5 mm) | a pen-down dot 2.6× the line's width, 2.2× its density (a photograph: its densities are not linear, so the density ratio is an upper bound) |
| Golan Levin's class, 2018, AxiDraw, white pen on black paper | CC BY 2.0 | ~22 px/mm, inferred (line taken as 1 mm) | opaque (242 on 22, 8-bit), a flat core and a soft edge about a tenth of the width; no visible pen-down dot |

### What changed in the machine (kit/styles/plotter-pen.js; medium.js untouched)

- **The line's cross-section.** Wherever a line is 5 device px or wider, the tip is drawn in bands. The rims are darker than the core, which is the paper drinking the ink. Across the bands lie the tip's own striae: a fixed share per band, the same in every stroke that pen draws. Beyond the bands is a fringe of thin ink that the paper's tooth breaks. Neighbouring bands overlap by a pixel, so antialiasing leaves no seam. Below 5 px the zones fall inside one pixel and the engine's antialiasing is the edge.
- **Tooth.** Each tip carries a little dryness, so the paper's low points show as flecks. The engine's grain is now laid at about 0.2 mm cells, the size of the masters' breaks, by giving the medium a smaller device scale. Pools (beads) are wet through and never break.
- **Beads come from the machine.** Each machine has three measured figures: `beadW` (width), `beadV` (ink) and `beadL` (length along the stroke). The tip's `pool` scales them, so gel hardly spreads. The Calcomp's beads are measured and the hobby servo's are fitted. The HP is set like the Calcomp, since both lower the pen by solenoid. The AxiDraw is set between the two `[inferred]`. A rounded end of the line's own width sits under every bead.
- **Tone has headroom.** Cruise lines sit at about 0.8 opacity, not near saturation. That leaves room above them for beads, overdraw and rims, as on the masters.
- **Gel.** Two passes with a light first-pass skip reach 0.98 opacity, with a flat core.
- **Felt tips run drier** along a long pen-down (`dry`, restored at rest) `[inferred]`. The figures still set by eye are `v0`, `spread`, wear and dryness.

### Calibrated on the bench

"the masters" on `plotter-medium.html` shows each crop beside ours at the same size on the sheet, at 1× and at 4×. It measures ours on the 4× print, live; `?set=` tries a value before it is written into the code.

| | master | ours |
|---|---|---|
| row-end dot / row, density | 1.5 | 1.41 |
| row-end dot / row, width | 0.78 | 0.74 |
| core / rim, density | 0.77 | 0.77 |
| fringe, paper showing | 0.5 | 0.58 |
| pen-down dot / line, density (hobby) | 2.2 | 1.29 |
| pen-down dot / line, width (hobby) | 2.6 | 2.99 |
| white pen opacity | 0.99 | 0.98 |

The hobby dot's density falls short. The photograph's densities are not linear, and our felt line would need to be lighter than the HP's to leave room. I left it rather than lighten A's lines to fit a photograph.

### Seeds and the page's hand

Each direction now has `hand(seed)`: what an operator sets once for a sheet, applied to every piece. Each piece then varies within that by its own seed. In both directions every mark now changes with the seed (checked on 6-seed contact sheets).

- **A.** The page sets:
  - the HP-GL line type (2–6) and a pattern length of 6–12 mm (HP-GL's default is 4 % of the plot's diagonal);
  - the fill type (FT 1 solid, FT 3 hatched, FT 4 crossed) and its angle;
  - the mark the fills take;
  - the rule (double, triple, or ticked as a scale);
  - the corner marks;
  - the drop's setting: alone, over a filled panel (silver gel on black card, so the coral letter keeps the light), or in a ruled box with corner ticks.

  The legend's last item changes with the seed.
- **B.** The page sets:
  - the section angle (±30, ±45, ±60°) and spacing (0.62–0.92 mm);
  - whether the drop is crossed;
  - the shape of the small marks;
  - the filler (a ramp, or steps);
  - the run-out (a wedge, steps, or a taper with an end tick);
  - the smallest break.

  From A: points of dwell as one choice for the smallest break, and Hershey Simplex numerals under the pen-test swatch giving each swatch's spacing. The two stay distinct: A is lettering, line types and fills in HP pens; B is contour and section in liners.

### Timings (Chrome, this machine's GPU, readback inside the timer)

| | dpr 1 | dpr 2 |
|---|---|---|
| a page's 8 pieces, the first panel (includes making the GL context) | 63–67 ms | 68–70 ms |
| warm panels, A dark / B | 20–23 / 10–22 ms | 23–24 / 12–21 ms |
| B's crossed drop alone | 3–5 ms | 3–6 ms |
| the bench with the masters (every panel, both stocks, 1×, 3×, 4×) | | 385 ms |

### Open

- An HP 7475A close-up under an open licence would replace the Calcomp stand-in for the fibre tip.
- So would a scanned gel plot with a known scale.
- `v0` (how much speed thins the line) is still by eye: the masters are all at constant speed.

---

## Stage 3: shipped as one rubricate style with two kinds

The owner: "refine it, optimize it, add levels of richness, ship it". `kit/styles/plotter.js` is a written style of the one library, registered in `kit/illum.js`'s WRITTEN map. B (section lines) is the default kind and A (the drawing office) the other; a page chooses with `STYLES.plotter.kind = 'office'`, which the site sets from the catalogue's Machine setting, as Copperplate's manner is set. Specimen: `tests/plotter.html?kind=section|office&rich=&theme=&draw`.

### Every mark rubricate asks for

| mark | B · section lines | A · the drawing office |
|---|---|---|
| drop | Jost capital, contour then section at the page's angle; sized by its own ink, from the cap height to the last baseline | Hershey Roman Triplex in the rubric pen, alone, on a filled panel, in a ruled box, or both (by budget and the page's hand) |
| line initial | Jost, sectioned finer; kept below the line above (the leading read from the rows above it) | Hershey Duplex, red |
| paraph | the page's mark, its outline at plain, sectioned from modest, crossed from fine | the page's mark, its outline at plain, filled solid (FT 1) from modest, ringed at lavish |
| filler (from modest) | ruled strip; the page's ramp or steps; denser at fine; closing mark at lavish | the page's line type in black, then red; a dwell dot from fine; the mark at lavish |
| run-out | a rule; a wedge outline; the page's wedge, steps or taper; a dwell dot at lavish | a 0.7 mm rule; the double rule; the page's rule |
| breaks (part, chapter, end) | dwell dots or the mark; three marks with the middle one crossed; the pen-test swatch with Hershey numerals | dwell dots; the line type round a filled mark; the plot legend, with a millimetre scale at lavish |
| quote | a bar in section beside its lines (from modest; ticked from fine) | crop marks round its lines (registration ticks at lavish) |
| aside (from usual) | two corners in section, four at lavish | crop marks; a line type across its head from fine |
| pull (from modest) | a lozenge in section above and below; crossed at lavish | rules above and below; second rules from usual; split by the filled mark from fine |
| figure (from usual) | a strip in section over the figure and under its caption; end ticks at lavish | a drawing sheet's border; an inner border from fine; "FIG. n" lettered at lavish |
| code (from usual) | a strip in section across its head | a ruler down its margin, a tick per row, every fifth longer |
| contents | the page's mark before each entry, sectioned from usual | a scale beside the entries, a tick at each |

The five budgets run from a proof (outlines, single rules, open hatch, no paragraph fillers) to an exhibition plot. Each step adds a second family, a second rule or a lettered block; nothing adds noise.

### Optimised

- **One sheet for a page's still pieces.** `plotter-pen.js` `printMany` gathers them while the host makes its cases and prints them into cells of one sheet, pen by pen. That is one render and one GPU copy per pen for the lot, not per pen per piece. Each cell is its own plot: its paper laid at its own origin, its ink settled before the next cell's, so a piece prints the same alone or among others.
- **Speed ramps** are sampled every 3 device px.
- **One shared change:** `kit/medium.js` `finish(rest)` lets the next pour's flow run only where it lies. It is additive; `finish()` is unchanged. Without it, every step ran over the union of all cells so far, and dark pages, with two gel passes, took 300–600 ms.

### Timings

The specimen's own `all` time, a fresh browser for each run, at 1440 px. Pieces: 15 at plain, 26 at modest, 29 from usual.

| | levels 0 / .25 / .5 / .75 / 1 |
|---|---|
| light, dpr 1, B | 93 / 68 / 85 / 87 / 142 ms |
| light, dpr 1, A | 53 / 88 / 85 / 66 / 79 |
| light, dpr 2, B | 57 / 79 / 91–105 / 85–136 / 94 |
| light, dpr 2, A | 65 / 88 / 99 / 77 / 86 |
| dark, dpr 1, B | 69 / 100 / 135–181 / 172 / 153 |
| dark, dpr 1, A | 74 / 107 / 106 / 143 / 103 |
| dark, dpr 2, B | 87 / 107 / 136 / 159 / 167 |
| dark, dpr 2, A | 76 / 93 / 74 / 99 / 139 |

Single runs vary by tens of ms with the GPU process's state. Two first runs read 279 and 370 ms; each was rerun five times and came in at 85–136 ms.

### Checked

`tests/plotter.check.mjs` covers both kinds, light and dark, every budget, seeds 1, 2, 3 and 7, at 1440 and 390 (160 pages). It checks every text line's full line box against every inked pixel of the ornament's canvases, and ink at a canvas's edge (a piece cut off). After the batching: 160 of 160 pages pass. With `SITE=` it also covers the built site's see page: both kinds, light and dark, budgets 0, .5 and 1, seeds 1 and 7, at 1440 and 390, 48 site pages alongside 48 specimen pages, all passing.
