# 13 · Occult: what makes a page read as a grimoire

The third style done deep, after Blackletter (research/11) and Tarot (research/12). A breadth-first Occult was rejected
(cases.html?style=occult; kit/wayfinding.js, initials.js, frames.js): planetary signs built from Unicode-like shapes in
hairline, sigils on an invented 3×3 lattice, magic circles of thin rings with ticks and dots for lettering. None of that
was read from a manuscript, and it shows: the signs are modern, nothing is lettered, every line is the same hairline,
and the red is a tint rather than a second ink. This is what was studied before kit/styles/occult.js was written.

## Sources, studied at full size

All Wellcome Collection, public domain (open IIIF; full-resolution JPEGs at ~4000–4500 px across the page, roughly
600 dpi). Raw downloads in the session scratchpad (occult-raw/), not the repo.

| what | where | used for |
|---|---|---|
| *Clavicules de Salomon*, French, [1725?], "pen-drawn magical figures, pentacles, sigils, etc. in red and green" | Wellcome MS 4670 (catalogue b1930237x), images 48–58 (seals), 65–66 (tables of the planetary hours), 75 | **the planetary signs as written in the period** (traced: images 66, the hours of Tuesday–Thursday); the seal with its **lettering band in red Roman capitals** between **green compass circles**, crosslets between the names, ALPHA ET OMEGA across the centre (image 57, f. 54); the **ruled table** with numerals and signs in its cells (66); red, green and a brown-black hand |
| *Les Clavicules de Salomon*, French, mid-18th c., "some in red and black, a few in colours" | Wellcome MS 4666 (b19370209), images 56–87 | the pentacles laid out two to a page; **the red double rule ruled round the whole page** and running on past its corners (f. 55, 56: images 64, 65); the Grand Pentacle (65): **a solid black ring with its letters reserved in the paper**, points between them; the "Première figure" (64): the circle with names written round it in black capitals, red flames; pentacles 10 and 11 (70) in a red-brown ink: an 8-spoked wheel with a character at each spoke's end, a square-in-square of Hebrew letters, the band lettered in **italic** round the circle and on round the bottom upside down |
| *La Clavicule ou la Clef de Salomon*, French, mid-18th c. | Wellcome MS 4659 (b18712022), images 171–199 | iron-gall pentacles, one to a page with the text below: **the 4×4 square in a double circle** with the band lettered in italic (172), the pentacle of the triangle (177): concentric compass circles, a hexagram where the band begins, a short rule under the text |
| John Dee, *Monas hieroglyphica*, Antwerp: Silvius, 1564 | Wellcome (b33350838), image 56 (p. 25) | **the Monas**, cut in double outline: the Moon's horns, the circle with its point, the cross (stem and bar as narrow double-ruled rectangles), the two arcs of Aries at the foot; measured below. Dee's motto from the title page, QVI NON INTELLIGIT AVT TACEAT AVT DISCAT, is lettered under it |
| Agrippa, *De occulta philosophia libri III*, Paris: Dupuys, 1567 | Wellcome (b11197390), images 256–258, 375 | the kameas (*tabula Saturni in abaco* … ) and the planetary seals (*signacula sive characteres*), printed; the Hebrew-lettered circle (375). The kamea of Saturn is the grid the sigils are drawn on. The *Signaculum Solis* (p. 257) is a four-fold, rotationally hooked figure: **not used** (the safety contract) |

Not reached this pass: the Ripley Scroll (Wellcome MS 692, b18968831: 20 images listed, not studied), Khunrath's
*Amphitheatrum* (1609 Hanau edition at Wellcome b12207585, not opened), Fludd, Splendor Solis (BL Harley 3469). No
ouroboros was found in the Wellcome search results; none is drawn here (the method: no form not taken from a source).

## Measurements

By pixel runs on the full-resolution scans (a page ~4100–4500 px across, ~600 dpi):

- **The compass line** of a pentacle: 10–14 px (≈ 0.5 mm) on a circle ~1600 px across: **≈ 0.7 % of the diameter**.
  Even all round (a compass's pen, not a quill turned by the hand): no thick and thin, no break, a single closing.
  Concentric pairs: the band between the outer and inner circle is **12–16 % of the radius** (f. 54, MS 4659 f. 2).
- **The lettering in the band**: Roman capitals (MS 4670, red; MS 4666, black) or italic (MS 4659, MS 4666 f. 61), the
  cap height **≈ 0.55–0.7 of the band**, the letters upright to the circle (their foot toward the centre), reading
  clockwise from the top; past the bottom the scribe carries on, the letters now upside down to the reader. Between names:
  a crosslet (a cross with a bar on each arm, red, f. 54), a point, or a hexagram. The letters are written, not drawn
  in outline: a broad-ish pen, ~0.12 of the cap height.
- **The planetary signs as the scribe wrote them** (MS 4670 image 66), all in red, each ~230 px high in a cell ~330 px:
  ♂ a ring with a shaft to a solid barbed head; ♀ a small ring on a cross whose arms **end in short flared bars**;
  ☿ the same with a pair of horns on the ring; ☾ a heavy **C**, its back swelling, its upper end hooked; ♄ an italic
  **h** with a tick (the scythe written as a letter); ♃ a **2** with its foot run out into a crossed tail; ☉ a face in a
  ring of rays (traced, but the face does not survive at a paraph's size: ☉ here is the ring and its point). Stroke
  ≈ 0.09–0.12 of the sign's height: far heavier than the modern sign.
- **Colour** (median of each ink, on paper [238–248 228–232 206–210]): red **[199 124 94]** (MS 4666, a red lead gone
  orange), **[211 123 119]** (MS 4670, a carmine-vermilion, its deepest cores [174 81 80]); black-brown **[79 69 65]**
  (MS 4666) to **[129 103 80]** (MS 4659, iron gall browned); green **[127 180 156]** (MS 4670's verdigris rules).
- **The ruling**: MS 4666 rules a red double frame round the page (two rules ~1/80 of the page apart) whose rules run on
  past each other at the corners; the drawings sit inside it, the text above.
- **The Monas** (Dee 1564, in units of its height, 0 at the horns' tips): horns' tips at y 0, x ±0.233; the crescent's
  lower edge through y 0.21 at the middle (an arc of radius 0.24), its upper edge through y 0.12; the circle centred at
  y 0.31, radius 0.228 (double, the inner 0.213); the point at its centre; the stem from the circle to y 0.995, its two
  lines 0.03 apart; the bar at y 0.645–0.675, x ±0.225; the arcs of Aries half-ellipses rising straight out of the stem's
  foot (y 0.99) to peaks at x ±0.115, y 0.81 and falling to x ±0.224, y 0.946 (measured again for the drawn Monas).

## What makes it read as a grimoire (the checklist the style is judged by)

1. **Compass and ruler.** Circles that are true and even, concentric, closed in one sweep; straight rules; a figure
   constructed, not drawn freehand. The hand shows only in the lettering and the signs.
2. **The band lettered round the circle**, capitals or italic, upright to the centre, carried on round the bottom; names
   parted by crosslets or points.
3. **Two inks, three at most**: a brown-black and a red (vermilion or red lead); sometimes a verdigris green for the
   ruling. No gold, no wash, no gradient. Red for the names and signs, black for the construction (or the reverse).
4. **The signs as the period wrote them** (♄ as an h, ♃ as a 2, ☾ as a C, ♀ and ☿ on flared crosses), heavy, in red.
5. **The page ruled**: a double rule round the figure, the figure on its own leaf with its text below.
6. **Seals and squares**: the kamea in its double circle; the sigil drawn over its numbers, a small circle where it
   begins and a bar where it ends.
7. **Nothing that reads as a hate symbol.** No Sowilo or doubled sig, no Wolfsangel, no Black Sun, no swastika or fylfot
   or any four-armed hooked form in rotation, no Othala with serifs, no Totenkopf. Sigils are checked (tests/occult.check.mjs).

## What was made from it (kit/styles/occult.js, playground/tests/occult.html)

Every line is the compass's or the ruler's, written by the ink engine's pen (kit/writer.js) with a round nib (hair 0.92 ×
width: even in every direction), a circle as one stroke from its top round to a little past it, a rule as one stroke;
nothing under 1.3 px (so a pentacle line is relatively ~2× the manuscripts' at a drop's size). The lettering is IM FELL
Double Pica (roman and italic; OFL, playground/fonts/IMFellDoublePica*.woff2), and the signs the scribe's own ink, both
laid by the engine as coverage (kit/inkletter.js: inkLetter still, letterWriter under ?draw). A band is written round
the circle in order (its cells timed by their angle from the start), a line of text left to right, a sign along its
skeleton. Small lettering is thinned 0.09 px each side before it is laid at dpr 2 (the engine's creep gives that back);
at dpr 1 it is thickened 0.06 px instead, its hairlines being at a pixel's edge already.

- Drop initial (second pass, after the user's verdict: the solid ring, and less clean): MS 4666's red double rule round a
  square, its rules running on past the corners; a thin compass circle; the band after the Grand Pentacle (MS 4666 f. 56),
  laid solid in the ink with its capitals cut out of it, a true knockout (the ring's coverage minus the lettering, poured
  as one deposit), so light mode has a dark ring with the letters in the paper and dark mode a pale ring with the letters
  in the dark ground; the capitals varied letter by letter in size, slant, spacing and seat (a scribe's, not type):
  ALPHA · ET · OMEGA · PRINCIPIVM · ET · FINIS (Rev. 22:13); within it, struck in verdigris after MS 4670 f. 54, a circle
  and the cross of its diameters stopped short of the capital; a pair of red crosslets at each arm's end (f. 54's + +);
  the IM FELL capital in red at the centre. ?set=band: the old capitals written in red between black circles. ?title=
  the band's words. ?draw: the circles, the cross, the square, the crosslets, the ring swept round with its letters
  appearing in it, the capital written (about 3.6 s).
- Line initial: the IM FELL capital in red.
- Paraph: the chapter's planet in the week's order (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn), red, ~1.9
  x-heights; the contents carry the same sign at each entry, so the paraphs are wayfinding. ♄ and ♃ are the scribe's own
  ink, traced from MS 4670 image 66 (tools/tracesign.py, the ink's outline); ♂, ♀, ☿ and ☾ are written with the pen in the
  proportions measured off the same table (traced, the barbed head of ♂ came out a horn and the flared ends and horns of
  ♀ ☿ blots at a contents line's size): ♂ a ring, a shaft at 45° and a solid barbed head; ♀ ☿ a ring on a cross whose
  arms end in short bars, ☿'s horns a small crescent on the ring; ☾ a heavy C, its back swelling, its tips blunt; ☉ a
  ring, its point and short rays (eight under 24 px, twelve above), the manuscript's face in rays unwritable at that size.
  The table's numerals are EB Garamond's italic figures (the Fell italic's 4 reads as a + in a cell).
  playground/tests/occult-signs.html shows the seven at 15, 18 and 36 px.
- Fillers: signs (the planetary hours from the chapter's day, in the Chaldean order, red, standing on a black rule, as a
  row of MS 4670's tables); band (two black rules, the planets' Latin names written between them in red capitals, points
  between); sigil (sigils drawn on the kamea of Saturn from words of the art: a small circle at the start, a bar at the
  end, a black rule broken round each, red points between). A heading's: a red rule ending in a crosslet.
- The hand (third pass, after the user: the Monas "too assembled"): the Monas, the seals, the crosslets, the signs ♂ ♀ ☿
  and the breaks' rules are drawn as a pen draws them, not constructed: few continuous strokes with a sensible ductus
  (the Monas: the horns in one sweep closing over the first tip; the double ring as one stroke that goes round twice;
  the stem pulled down and swung on into the right arc of Aries without lifting; the left arc; the bar across, heavy;
  the point in red), each path bent a little off true by a slow wander, the nib swelling where the pen turns and as it
  sets down, lifting off at the end; strokes overrun where a pen joins, and the medium merges the ink there. The
  pentacle's own compass circles stay true (the manuscripts strike them with a compass).
- Breaks: chapter, the seal (a double circle, the chapter's planet in red) on a lettered band, CAPVT to its left and the
  ordinal (PRIMVM …) to its right; book, Dee's Monas struck with compass and ruler from the measurements above, its point
  red, and his motto QVI NON INTELLIGIT AVT TACEAT AVT DISCAT lettered in red between two rules.
- Frames: quotation, the red double rule; figure, the red double rule with a seal at each corner (the planets of the
  chapter's first four hours), the rules stopping short of each seal; code, MS 4670's table of the hours across the head
  (twelve cells ruled in verdigris, italic numerals and the hour's planet in red), a verdigris rule round the code; pull
  quote, two lettering bands' rules above and below, each broken by a seal; aside, the red double rule with NOTA in a
  cartouche breaking its head and a seal at its foot; contents, a red double rule down the margin, the chapter's planet
  at each entry (on a phone, across the head of the list).
- Palette: light k [52 42 36] (iron gall), r [184 58 38] (vermilion), g [70 138 112] (verdigris); dark k [226 214 196]
  (a warm pale ink), r [232 112 84], g [116 182 152].
- Safety: tests/occult.check.mjs refuses the forbidden paths (Z, N, sig, lightning, zig-back, retrace, Z with a bar) and
  sweeps 5000 seeds of the sigil generator and 1200 fillers: 0 unsafe. The planetary signs are upright single signs; no
  form is repeated in a four-fold rotation with a hook; Agrippa's Signaculum Solis is not used.

What falls short (at the 4× gate against the sources): the drop is a cleaner, emptier seal than MS 4670's (one band, not
two; no cross of diameters, no names in the field) — the drop is four lines high and a second band would be under 5 px;
the sigils are few (5 distinct paths pass the safety rule and span the square) and small at a line's height; the Monas's
arcs of Aries are rounder than Dee's; the line is relatively heavier than the manuscripts' (the 1.3 px floor); the sign
ink is a little blotchy at 4× where the trace kept the scan's pooling; the ouroboros, the Ripley Scroll and Khunrath
were not reached.
