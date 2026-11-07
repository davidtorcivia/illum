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
| drop initial | six-line white-vine B, T, N, P, S | B n313 [990,773,1640,1421]; T n104 [639,4201,1263,4804]; N n213 [4137,1648,4737,2304]; P n245 [3590,868,4665,1972]; S n313 [3652,872,4234,1530] |
| line / small initial | two-line L, B, M, A, S, N, P, T | L n116 [3042,5232,3406,5552]; B n125 [3636,2244,3978,2556]; M n158 [373,2816,735,3128]; A n158 [357,4872,751,5172]; S n221 [1683,2024,2015,2336]; N n299 [3604,3500,3934,3816]; P n313 [975,5104,1331,5412]; T n313 [975,7256,1327,7560] |
| paraph | the hedera, red (or black) | Met DP322254 [3216,998,3272,1038] |
| heading filler | 1–2 sprigs, red | Met DP322255 [2991,395,3042,432] |
| paragraph filler (?fill=knot) | the running head's knots, closed up to the measure | Met DP322254 [3082,361,3258,411] |
| breaks | the band on its side, centred on the point where it meets its own mirror image; rank 2 wider and longer | Commons GAP [3688,640,3793,1560] |
| quote, aside | the band down the left side | the same |
| figure | the band all round, the side bands over the corners; on a phone (no room) a heavy and a light rule | the same |
| code | the band all round, inside the block's padding, narrowed to keep off the code | the same |
| pull | the band above and below | the same |
| nav | a red hedera at each entry | the hedera |

- A drop takes the six-line block when it is over 6 x-heights deep, else the two-line one; a letter with neither is set
  in the page's face in red (Q, for now). The line initial defaults to a two-line drop (?line=inline keeps it in the line).
- A strip longer than its source continues as its mirror image (each copy filled on its own), so a stem runs on into
  itself with no seam; a cut end is closed by a black rule.
- **Dark.** By default ('positive') the dark page is the block's black and what the graver left standing is printed in
  the pale ink, so the vine reads light on dark, as the woodcut does; the type ornaments print in their inks.
  ?cut=negative prints the block pale with its cut dark.
- **?draw, engraved.** A block's face is inked from its middle out (letterWriter along the face's skeleton), then its
  white is cut into it along its stems (letterWriter walking the white's skeleton, in the paper's own colour), then the
  ink is pressed once more; in dark, the white is written in pale ink along its stems. A drop takes ~5 s, a band ~1–2 s, a
  stamp a beat; each case as it scrolls into view; the page never scrolls itself.

## Measured on the specimen

- Timings (headless, Arc A770): still, 1440: in view 20–35 ms, all 73–135 ms; 390: in view 19–45 ms, all 50–170 ms.
- Drawn end vs still (the B, 1440 light, dpr 1): mean difference 7/255, p99 26; the drawn block's black is ~4 % heavier
  (it is pressed twice). Dark (after the face's rim trim): mean 1/255, p99 8.
- No horizontal scroll at 390 (scrollWidth 390).

## What falls short

- **The alphabet.** Five six-line and eight two-line initials are traced; the rest fall back (a six-line letter without its
  own block takes its two-line one; with neither, a red capital of the page's face). The Chaucer has every letter; the
  next step is tracing them (the leaf index from the scan's contact sheets is in the scratchpad's look/ini.json).
- **Weight.** The traces are inline polygons, ~250 KB of the module. They should load per letter (or be packed into an
  OFL initials font, which compresses well and is drawn with fillText).
- **The knots** at a line's height (~12 px) lose the gaps between their strands; they are off by default. Drawn again as
  continuous strokes with true over/under (occult.js's sketch / occlude) they would hold at that size.
- **The two-line initials** are traced from the ~150 ppi scan: their edges are a little ragged; in dark (positive) their
  outline reads as an outlined letter, and a few specks of the scan's grain survive at their scalloped edge.
- **The band on its side.** Morris's top borders are their own designs; the breaks and the heads of frames use the side
  band turned. The vine grows sideways, which it does in his horizontals, but it is not one of them.
- **The two-line initials at 46 px** have their white opened by ~.4 px. The Chaucer prints them ~0.52 in tall (310 px at
  the scan's nominal 600 ppi), ~50 px at 96 dpi: the specimen sets them at about their own size, which is finer than a
  screen likes. (The six-line B is 1.08 in, ~104 px at 96 dpi; the specimen's 173 px drop is ~1.7× its printed size,
  which is why it keeps all its white.)
- Not done: shoulder notes in red, the Golden/Troy/Chaucer types (no OFL digitisation was found and the host's text is
  not ours to restyle), the Well's border (too fine for any margin).
