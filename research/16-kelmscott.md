# 16 · Kelmscott: the white line cut out of the black

William Morris's Kelmscott Press (1891–98), above all the Chaucer (1896) and The Well at the World's End (1896). The
breadth-first Kelmscott (kit/wayfinding.js's entry: hedera paraphs and vine fillers drawn as black pen line on paper) is
superseded: it had none of the press's idiom. A Kelmscott ornament is a **wood block**. Its black is the block's face
and its white is what the graver took away, so the vine, the leaf and the letter are the paper left standing in the ink.
Nothing in it is a line drawn on paper.

Built: kit/styles/kelmscott.js; tests/kelmscott.html (the specimen, the same text as the other styles);
tests/kelmscott-letters.html (every traced initial at three sizes); tools/tracecut.py (the tracer). Raw downloads are in
the session scratchpad (kelm-raw/), not the repo.

## Sources, studied at full size

| what | where | licence | used for |
|---|---|---|---|
| The Works of Geoffrey Chaucer, Kelmscott 1896, the whole book (578 leaves, 6461×9900) | archive.org `MorrisChaucer` (leaf images at `/download/MorrisChaucer/page/nN.jpg`) | Public Domain Mark | every initial, the red and black, the page |
| The Kelmscott Chaucer, the Boston Public Library's copy (568 leaves, 2105×3000, sharp: ~180 ppi true, against the other scan's ~150 upsampled) | archive.org `worksofgeoffreyc00chau_0` (`/download/…/page/nN.jpg`) | PD (1896) | the alphabet: 12 white-vine and 18 two-line initials |
| The Water of the Wondrous Isles, Kelmscott 1897 (4582×6620) | archive.org `MorrisWaterWondrousIsles` | PD (1897) | the column vines: the stem, its leaf head, the rose and grape feet, the rose head |
| Six more Kelmscott books searched for initials (page thumbnails, detected, the following word OCR'd to name the letter): Godefrey of Boloyne, Reynard the Foxe, Sidonia, Sigurd, The Sundering Flood, The Well (IA), The Glittering Plain, The Wood beyond the World | archive.org (their Kelmscott scans) | PD | the two-line series in use beyond the Chaucer (the Water's V); no white-vine D E G Q R W X Y anywhere |
| The Chaucer's opening spread (4501×3304, a photograph) | Commons, *William Morris – The Works of Geoffrey Chaucer – Google Art Project.jpg* | PD | the picture-frame band, the woodcut line at its sharpest |
| The Well at the World's End, Kelmscott 1896, four spreads (4000×~2750) | the Met, 354288 (DP322253–DP322256) | CC0 | the hedera, the sprig, the knot, the red heads, the Well's border |
| Chaucer p. 483 (Houghton, 1277×1015) | Commons, *Houghton Typ 805K.96.275 … pg. 483.jpg* | PD | looked at; not traced (too small) |
| Kelmscott Chaucer, a museum photograph | Commons, *Kelmscott Chaucer.jpg* | CC BY-SA 3.0 | looked at only; nothing traced from it |

Found and not used yet: archive.org's Glittering Plain, Wood beyond the World and Laudes Beatae Mariae Virginis scans
(all PD Mark), the Cleveland Museum's CC0 Morris textiles. The Met's other Kelmscott records are photographs of the
manor, not books.

**The IA Chaucer is not 600 ppi.** Its pixels come in blocks of 4 (the profile of a block's edge steps every 4 px): it is
~150 ppi upsampled. Good enough for a six-line initial (~160 effective px tall), crude for a type ornament (a hedera is
~28 effective px), so the small ornaments were traced from the Met's photographs, which are sharp at ~40 px.

## What makes it Kelmscott (measured)

- **The initials.** Two families in the Chaucer, found by scanning all 578 leaves for dense square blocks
  (374 candidates; contact sheets in the scratchpad's look/):
  - *White-vine initials*, three to six lines deep (the large ones six): a black square; the capital in white, a little
    gothic in its forms (the B's bowls, the T's curled stem); vine, leaves, flowers and seeds in white round it, and a
    sprinkling of white dots in the black. The block's edge is the black itself, no rule.
  - *Two-line initials*: the capital in **black**, edged in white, with a white leaf in its counter, on a black ground
    whose edge is scalloped and outlined. They open most paragraphs; they read in the text as dark spots.
- **The white line.** The 5th percentile of a block's white widths (tools/tracecut.py measures it along the white's
  medial axis) as a fraction of its height: six-line initials .007–.010; two-line initials .015–.022; the Chaucer's
  picture-frame band .0032 of its length (.028 of its width); the Well's border .0020 of its length (.0086 of its width).
  So at a 1.25 px floor a six-line B must be ≥ 129 px tall (it is 173 px at 1440, 152 px at 390: it keeps all its white),
  a two-line initial ≥ 60–80 px (it is ~46 px: its finest white is opened by ~.4 px), the band ≥ 45 px wide (it is ~31:
  opened by ~.35 px), the Well's border ≥ 145 px wide (impossible in a margin; it fell apart at 42 px and was dropped).
- **The ink.** The scan's black (median) 47 39 33 on paper 230 210 180; the Met photographs, lifted by their exposure,
  65 61 57 / 72 69 65 on 241 236 225. Morris's black is dense and even across a block; the white edges are crisp, the
  black spread into them a little.
- **The red.** Vermilion: 179 56 50 on the scan, 229 111 73 / 225 106 73 in the Met's photographs. Red is for the shoulder
  notes, the "Here endeth / Here bigynneth" heads, and the sprigs that end them. **No initial in the Chaucer is red.**
- **The hedera.** In the Well's text, a solid leaf with white veins and a curled stem, set in the line (between
  sentences, "each word ❧ She led …") in **black**, about as tall as a capital. The brief asked for red: the specimen
  defaults to red and offers black (?paraph=black).
- **The sprig** (a six-petalled flower on a leafy stem) ends the red chapter heads, one to three of them, in red; in the
  running heads, black.
- **The knot** (a three-strand plait, 3.5 : 1) fills the running heads of the Well to the measure, two to a line.
- **The page.** Text pages are dense, justified, with tight word spacing; paragraphs run on (a hedera, or a two-line
  initial) and **short last lines are left open**: no line-fillers in the text.
- **The borders.** Undulating stems with leaves and flowers in white on black, a black rule on each long edge; partial
  borders run down the inner margin; the Chaucer's pictures are framed all round by a narrower band with bolder leaves.

## What was made (kit/styles/kelmscott.js)

Every form is Morris's, traced (tools/tracecut.py: upsampled 2–8×, cut at the midpoint of the box's own ink and paper,
contoured, simplified) and printed through the ink engine (kit/inkletter.js inkLetter: the black poured as a coverage
mask, its edge feathering into the white as a press's ink does). A block too small to keep its white has its black pared
back evenly (a distance transform from the white) until the finest white is 1.25 px, as an engraver cutting a small
block cuts the white wider.

| element | form | source (IA leaf / photo, box in px) |
|---|---|---|
| drop initial | white-vine B C F H K L M N O P S T V (B from the IA scan, the rest the BPL's) | B IA n313 [990,773,1640,1421]; BPL leaves: C n421 [1299,973,1489,1164], F n428 [62,1253,220,1437], H n101 [1065,312,1373,623], K n415 [1279,1221,1460,1410], L n421 [583,1124,760,1310], M n103 [385,1604,548,1791], N n212 [83,1422,235,1613], O n98 [163,556,355,748], P n248 [804,2042,985,2228], S n137 [393,1217,706,1532], T n95 [1113,1482,1295,1665], V n276 [830,1903,1015,2092] |
| line / small initial | two-line A B E F G H I K L M N O P Q R S T W Y (B from the IA scan) | B IA n125 [3636,2244,3978,2556]; BPL: A n21, E n235, F n43, G n342, H n75, I n37, K n62, L n46, M n29, N n36, O n27, P n156, Q n315, R n75, S n37, T n23, W n31, Y n30 (boxes in kit/styles/kelmscott.js's GLYPHS) |
| paraph | the hedera, red (or black) | Met DP322254 [3216,998,3272,1038] |
| heading filler | 1–2 sprigs, red | Met DP322255 [2991,395,3042,432] |
| paragraph filler (?fill=knot) | the running head's knots, closed up to the measure | Met DP322254 [3082,361,3258,411] |
| breaks | the foot of a column vine, its stem cut where it meets the foot: rank 1 the rose foot (a figure-of-eight with a bud and a rose), rank 2 the grape foot; ?break=rose, grape, mirror (the rose foot mirrored about its stem: symmetrical, not Morris's composition) | Water n22 [1100,4800]+[155,215,2331,616]; n21 [1000,4877]+[107,80,3371,683] |
| quote, aside | the column vine down the left: the stem in outline curling as it goes, its leaf head above the first line, cut below the last as Morris draws a cut stem | Water n21 [2150,250]+[29,46,900,2750] |
| pull | the column vine's rose head above, its rose foot below | Water n22 [950,200]+[77,112,2277,440] and the foot |
| figure | a heavy rule and a light one inside it, as his woodcut pictures are framed | — |
| code | a single light rule (?code=none: plain) | — |
| nav | a red hedera at each entry | the hedera |

**Rejected by the user (2026-11-07):** the picture-frame band laid on its side as the break ("uneven in a bad way") and
reused down the side of quotations and asides and round figures, code and pull quotes ("the dividers and left line
thing are bad"). Both replaced by Morris's own late vine drawings, used as he composed them.

- A drop takes the six-line block when it is over 6 x-heights deep, else the two-line one; J is set as I, U as V; a
  letter with neither (D, X, Z: the Chaucer has no initial for them in either series found) is set in the page's face in red. The line initial defaults to a two-line drop (?line=inline keeps it in the line).
- A strip longer than its source continues as its mirror image (each copy filled on its own), so a stem runs on into
  itself with no seam; a cut end is closed by a black rule.
- **Dark.** By default ('positive') the dark page is the block's black and what the graver left standing is printed in
  the pale ink, so the vine reads light on dark, as the woodcut does; the type ornaments print in their inks.
  ?cut=negative prints the block pale with its cut dark.
- **?draw, engraved.** A block's face is inked from its middle out (letterWriter along the face's skeleton), then its
  white is cut into it along its stems (letterWriter walking the white's skeleton, in the paper's own colour), then the
  ink is pressed once more; in dark, the white is written in pale ink along its stems. A drop takes ~5 s, a band ~1–2 s, a
  stamp a beat; each case as it scrolls into view; the page never scrolls itself.

## Round three: the whole alphabet, the breaks, the vine

**Traced (Morris's own):** white-vine A (BPL n16, "A Shipman", [279,364,466,554]), I (n362, "It sufficeth", [78,344,354,661]),
Z (n96, "Zenobia", [931,1289,1121,1473]); two-line V (Water of the Wondrous Isles n72, "Viridis", [424,3547,774,3857]).
Found by detecting every initial block in eleven Kelmscott scans and reading the word that follows it (tesseract on the
line beside the block; the letter is the one that makes the word). The two-line series turns up in all the later books;
the white-vine series only in the Chaucer, and in it no D, E, G, Q, R, W, X or Y was found.

**Round four (the user: the composed letters "jumped out ... messy and undetailed").** The type-capital-on-vine method
(tools/kcompose.py, removed) is replaced:

- **W is Morris's own:** the Chaucer's large white-vine W (BPL n375, Boece, "WEESTOW", [569,343,887,657]), found by sweeping
  the Chaucer's other initial series. It is his gothic W (the same form as his two-line W); there is no Roman-form W in
  his initials.
- **D E G Q R X Y are grafted** (tools/kgraft.py; GLYPHS m: 1): each made only of whole pieces of his six-line blocks, a
  letter's part with the vine that grows round it, joined along seams of least difference run through the black (Efros &
  Freeman's quilting seam), at 700 px a block, then refitted into the font like his own. Nothing is drawn, smoothed or
  outlined; the spurs, hairlines, stems ending in buds and the dots are all his.

| letter | made from (Chaucer, BPL leaf) |
|---|---|
| X | K's arm and leg with their vine (n415), and their mirror, joined at the crossing; brought back to his width (×.73) |
| Y | the head of that X over I's stem and its vine (n362) |
| D | K's stem and the vine left of it (n415), and C's bowl turned to face it (n421) |
| E | C (n421) with A's cross-bar and the vine round it (n16) |
| G | C (n421) with the foot of P's stem and its vine for its beard (n248) |
| Q | O (n98) with K's leg and its vine for its tail (n415) |
| R | P (n248) with K's leg and its vine (n415) |

Tried and dropped: guided image quilting (Efros & Freeman's texture transfer from all sixteen blocks onto a drawn letter
guide, tools/kquilt.py, removed): the vine came out in fragments, not stems.

What still shows (blind sheet test-pagesize-*.png): X and Y are mirror-symmetric where Morris's blocks never are; E's bar
is a short ragged bar crossed by vine; G's beard reads weakly (it can read as C); D's bowl carries C's inner curl.

**Breaks:** all three kept, by role (?break=all, the default): a book's break the grape foot; a chapter's the rose foot and
the rose foot mirrored in turn (n odd: the rose, n even: the mirror). tests/kelmscott-long.html shows five.

**The vine down a quotation** is now the full traced stem (n21, 4,550 source px tall, ~1,100 px at 1440 px) and goes on
past its length through a loop of itself: rows .256 and .747 of the glyph, where the stem's outline stands at the same x
with the same lean (found by matching the stem's left and right edges and their slope 15 rows on, across all row pairs
900+ rows apart), so the second length joins the first with no step; a taller block repeats the loop. The vine font is
3.3 KB (not smoothed: its line is thin against its height).

## Size: the blocks as webfonts

The first build carried the traces as polygons in the module (~250 KB for 13 blocks; the whole alphabet would have been
~1 MB). Weighed: (a) compact curves, quantised and delta/varint-coded in a blob; (b) a library of Morris's motifs plus
placements (his vine reuses leaves, berries and curls, but each block is cut by hand, so matching motifs costs more than it
saves at this size); (c) a low-resolution SDF atlas (crisp at any size, but a white line of .007 of the height needs ~150 px
per block before it survives, which is no smaller); (d) **a webfont per block** — the browser's native compact vector
format: the outline refitted as Béziers (potrace, its tolerance tied to the largest size drawn, the scan's sub-pixel grain
smoothed away), turned to TrueType quadratics with implied on-curve points (cu2qu), the glyf table transformed and brotli-
compressed by WOFF2. (d) does (a) better than hand-coding it, and is drawn with fillText, so it is chosen
(tools/kfont.py; playground/fonts/kelmscott/, OFL, outlines from PD woodcuts).

| | before (polygons in the module) | after (fonts) |
|---|---|---|
| kit/styles/kelmscott.js | 270 705 B (113 KB gzipped), 13 blocks | 29 418 B (10.6 KB gzipped), no outlines |
| one white-vine initial | B: ~55 KB | 2.5–5.5 KB (B 4.8 KB) |
| one two-line initial | ~14 KB | 1.8–3.0 KB |
| the whole set | — | 31 blocks 85 KB; 7 ornaments 38 KB (the grape foot 15.7 KB, the rose head and foot ~8 KB each, the vine 2 KB, the leaf and the sprig under 1 KB each) |
| what the specimen fetches | everything (the module) | 48 KB (B, L in both series, leaf, sprig, vine, rose head and foot, grape foot) |

The build (tools/kfont.py, from the scratchpad's traces; the boxes are in GLYPHS): white-vine and two-line, RES=600
SMOOTH=1.2 ALPHA=1.2 OPT=1.5 ERR=1.5, one font per glyph; ornaments SMOOTH=1.2 ALPHA=1.1 OPT=1 ERR=.8, the leaf, sprig and
knot at RES 300, the grape foot 700, the rose foot 600, the rose head 500, the vine 2700. Traces: tools/tracecut.py, the
white-vine and two-line blocks with BIAS=.08 TOL=.35 U=4 SIGMA=.8 SPECK=3 HOLE=1.5, the vines with BIAS=.05 TOL=.5 U=2
SIGMA=1 SPECK=8 HOLE=2 on the page isolated (the text round the ornament made paper, its stem cut where it meets a foot).

Each block is its own font file and the style fetches only those its page uses (initial.load reads the page's initials
and frames before it is measured). At 4× the font B is indistinguishable from the polygon B (its edges a little smoother:
the scan's grain is gone). Short of the target "a few tens of KB for the alphabet": 85 KB for 31 blocks; the floor is
the cutting itself (a white-vine block has ~80 separate black islands).

## Measured on the specimen

- Timings (headless, Arc A770): still, 1440: in view 20–35 ms, all 73–135 ms; 390: in view 19–45 ms, all 50–170 ms.
- Drawn end vs still (the B, 1440 light, dpr 1; re-measured on the font build): mean difference 7/255, p99 26; the drawn
  block's black is ~4 % heavier (it is pressed twice). Dark: mean 1/255, p99 8.
- No horizontal scroll at 390 (scrollWidth 390).

## What falls short

- **The alphabet (superseded).** Five six-line and eight two-line initials were traced in the first build; the rest fell back (a six-line letter without its
  own block takes its two-line one; with neither, a red capital of the page's face). The Chaucer has every letter; the
  next step is tracing them (the leaf index from the scan's contact sheets is in the scratchpad's look/ini.json).
- **Weight (superseded: fonts, above).** The traces were inline polygons, ~250 KB of the module. They should load per letter (or be packed into an
  OFL initials font, which compresses well and is drawn with fillText).
- **The knots** at a line's height (~12 px) lose the gaps between their strands; they are off by default. Drawn again as
  continuous strokes with true over/under (occult.js's sketch / occlude) they would hold at that size.
- **The two-line initials in the dark** are printed pale (negative) by design: flooded for the positive, their scalloped
  edge leaves their white in specks.
- **The alphabet now.** Every letter has a block (round three): 16 white-vine and 20 two-line by Morris, 8 white-vine
  composed by us; U and J borrow V and I. The BPL scan is ~180 ppi: a white-vine block is ~190 px tall in it, so its finest white is
  1–1.5 px of the scan; the two-line ones are ~88 px.
- **The feet's cut stems** read as Morris's open tube, but they are cut by us, not by him.
- **The two-line initials at 46 px** have their white opened by ~.4 px. The Chaucer prints them ~0.52 in tall (310 px at
  the scan's nominal 600 ppi), ~50 px at 96 dpi: the specimen sets them at about their own size, which is finer than a
  screen likes. (The six-line B is 1.08 in, ~104 px at 96 dpi; the specimen's 173 px drop is ~1.7× its printed size,
  which is why it keeps all its white.)
- Not done: shoulder notes in red, the Golden/Troy/Chaucer types (no OFL digitisation was found and the host's text is
  not ours to restyle), the Well's border (too fine for any margin).
