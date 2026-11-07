# 12 · Tarot: what makes a page read as the Tarot de Marseille

The second style done deep, after Blackletter (research/11). The user's set is Tarot / Occult / Astrology; this note is
Tarot. A breadth-first Tarot was rejected (cases.html?style=tarot; kit/wayfinding.js, initials.js, frames.js): a red
Garamond B in a round-cornered double box, pips a few pixels high in hairline, frames of round-cornered double rules.
None of that is in the cards: Marseille cards have square frames of one heavy rule, no round corners, no double box,
and nothing drawn in hairline. This is what was studied before kit/styles/tarot.js was written.

## Sources, studied at full size

All public domain unless noted. Raw downloads live in the session scratchpad (tarot-raw/), not the repo. Wikimedia
throttles originals; the BnF scans were read at Commons' 1280 px renditions (the 600 dpi originals are ~1560 px wide, so
1280 is ~490 dpi), two of them (images 9 and 13) at full 600 dpi.

| what | where | used for |
|---|---|---|
| Nicolas Conver, Tarot de Marseille, Marseille 1760 (BnF, Département des Estampes; 78 cards, 132 images) | BnF Gallica btv1b10520316w, via Commons category "Jeu de tarot … dit "tarot Conver" … btv1b10520316w" | everything below: the line, the stencil palette and its misregistration, the frame, the cartouches, the numerals, the four suits and the flowers between them. Cards read closely: III, VIII, VIIII batons (images 13, 23, 25), ace of batons (9), ace, II, VIII, X coins (37, 39, 43, 47), ace, II, V cups (57, 59, 65), II swords (87), I Le Bateleur (89), IIII L'Empereur (95), VIIII L'Hermite (105), XVII, XVIIII, XX (121, 125, 127) |
| Jean Noblet, Tarot, Paris c. 1650 (BnF btv1b105109641) | Commons category "… dit "tarot Noblet" … btv1b105109641" | 25 trumps and courts as thumbnails; I Le Bateleur, XVIIII Le Soleil, Roy de Denier at 1280: the earlier, heavier line; the numeral cartouche with **pointed numerals** (X·I, X·II, X·V); a second palette (no blue, no green: black-navy, brick red, ochre, flesh) |
| Jean Dodal, Tarot, Lyon c. 1701 | Commons "Tarot de Marseille - Jean Dodal" (78 cards, ~840 px) | listed and looked at in the category grid only (the 429s stopped further downloads); its titles in the same cartouche, LE·BATELEVR |
| Bembo (attr.), Visconti-Sforza tarot, Milan c. 1450–80 (Morgan Library & Museum MS M.630; Accademia Carrara, Bergamo) | Commons "Pierpont Morgan-Bergamo Visconti-Sforza Tarot" (512 px scans): II coins, II cups, III staves, II swords, I the Magician; XXI The World (Brera scan 2025) | the ancestor: hand-painted on a punched gold ground, a red border, the **motto scroll** (*amor myo*, *a bon droyt*) wound round the crossed staves and swords, flowering vines between pips. A different idiom (gold, miniature painting); studied for the pip arrangements and the scroll, not blended in: the style is Marseille |
| Conver's printing blocks ("Moule des lames majeures …", BnF btv1b55010984h) | Commons category of that name | seen in listing only; not downloaded this pass |

Not reached: the Beinecke Cary-Yale Visconti (no IIIF used), the Met and Cleveland (no Marseille tarots in their open
access sets that the search APIs returned), Gallica directly (Cloudflare challenge to scripts).

## Measurements

On Conver at 1280 px across a card of ~2340 px (the card is ~62 × 116 mm, so 1 px ≈ 0.05 mm), by dark-pixel runs:

- **The line**: 4–7 px cores, 6–9 px with their soft edge: **≈ 0.3 % of the card's height, ≈ 0.35 mm**. At life size on a
  screen (a card 116 mm ≈ 440 CSS px) that is **1.3–1.6 CSS px**, so the frames and the drop initial can carry the card's
  own line at life size. A paraph pip is ~1/6 of a card pip (a card pip is ~25 mm, ~95 px; ours ~16 px), so its line
  (kept ≥ 1.3 px, nothing finer: the aliasing rule) is relatively ~5× heavier than the card's. That departure is
  deliberate and is the same one a cartier made cutting the small numerals: the small things are cut heavier.
- The line is **even**: a knife cut both sides of it, so there is no thick and thin by direction as a pen has. It swells
  and thins slowly (±10–15 % over a few mm) and tapers to a point where a petal or a leaf curls to its end. Inside
  corners too small to clear are left solid (black fills the crotch where two lines meet at an acute angle). Ends that
  are not points are blunt.
- **Solid black** is used for the ends of the batons (a flared cap, c013), the sword hilts' shading, the hat brims and
  the ground (Noblet) — always as a shape, never as a hatching.
- **Frame**: one rule round the card, 6–9 px (≈ the line, a little heavier), square corners, inset ~2 % from the paper's
  edge. The top 7 % and the bottom 8 % are cut off by a second rule across the card, making the **numeral band** and the
  **title band**; the band rule is the frame's weight.
- **Numerals**: Roman, tall and narrow, with bracketed serifs: **IIII** for 4, **VIIII** for 9, XIIII, XVIIII (additive,
  never subtractive); height ≈ 2.6 % of the card (≈ 0.55 of the band), stems ≈ 1/8 of their height. Noblet sets points
  between them (X·I, X·V). On pip cards the numeral stands in **both side margins, turned 90° and mirrored** (VIII on
  c023 reads up the left margin and down the right); trumps carry it centred in the top band.
- **Title lettering**: Roman capitals with serifs, as wide as the measure allows, words parted by a middle point
  (LE·BATELEUR on c089; LE·SOLEIL); cap height ≈ 0.5 of the band. A cartier's Roman of the 17th c., closest among free
  faces to **IM FELL** (the Fell types, Oxford, 1670s–80s, digitised from prints by Igino Marini, OFL) — chosen for the
  drop initial and the numerals.
- **Colour** (median of each hue class, 8 Conver cards at 1280, aged paper [218 197 160]): red **[179 97 73]**
  (vermilion gone dull), yellow **[201 176 78]**, deep blue **[65 77 112]**, pale blue **[118 132 152]**, flesh **[205 177
  142]**, green **[80 99 80]**; line **[87 92 85]** (a grey-black: the ink is thin and dry). Noblet: red [137 80 61]
  (brick), ochre [192 161 72], line [62 65 65] (darker), no blue, no green.
- **Misregistration**: each colour is one stencil laid over the print, and the whole stencil sits off the line by
  **~1–1.5 % of the card's width** in one direction (c043's coin: the yellow overruns the ring at upper left and leaves a
  sliver of paper inside it at lower right). Under the line on one side, a sliver of paper on the other; **never a gap all
  round**, which is what a digital inset would make (the user's "white halo").
- **Stencil texture**: matte and flat at arm's length, at 4× mottled and streaked along the brush (dabs and drags, a
  few strokes past the stencil's edge). The edge of a colour is the stencil's cut edge: crisp but not ruled, and not
  darker than its middle (no watercolour ring).
- **The print's texture**: at 600 dpi the black is speckled where the paper's tooth missed the ink. At screen scale that
  is below a pixel; it reads as a slight greyness of the line, which is why the line colour is a grey-black.

## What makes it read as Tarot (the checklist the style is judged by)

1. **The print under the paint.** An even black line cut in wood, printed first; colour laid over it afterwards by
   stencil, flat, a little off the line. Never colour without a line round it, never a line that changes weight by
   direction.
2. **Five colours and paper.** Red, yellow, blue (deep and pale), flesh, green, on the paper itself; no gradients, no
   gold, no shading other than the line.
3. **The card's frame.** One square rule; the numeral band at the head, the title band at the foot; the numerals Roman
   and additive; the title in Roman capitals with middle points.
4. **The suits**: coins (deniers) are discs of concentric rings with a scalloped band and a four-petalled rose in the
   middle, yellow; cups (coupes) are footed goblets, yellow with a red lip; swords (épées) are curved blades, interlaced
   into a mandorla on the pip cards, the straight sword of the ace standing through them; batons (bâtons) are turned
   staves, red, banded yellow at the grip, their ends flared caps of solid black, crossing as a saltire, many of them
   bound at the crossing into a **woven lozenge** (pale blue lattice, red points in its cells, c023/c025).
5. **The flowers between the pips**: a stem (red) with two yellow leaves and a flower of curling blue petals round a
   red bud (c023); on the coins and cups, the long scrolling leaves of a vine, blue-grey and yellow, crossing
   symmetrically between the pips (c043, c047). Everything symmetric about the card's vertical axis.
6. **Order**: the card is symmetrical and frontal; pips stand in fixed arrangements (two, three, a saltire, a column),
   mirrored left to right and often top to bottom.

Deviations from the brief, after the cards: Marseille pip cards have **no corner pips** (that is the French-suited
playing card); the card idiom used for the frames is the frame rule, the bands, the side-margin numerals and the title
band. Lettering and numerals are never coloured on the cards; the drop initial is shown both ways (a contoured letter
with a stencilled body, and a black letter on a stencilled panel) for the user to choose.

## What was made from it (kit/styles/tarot.js, playground/tests/tarot.html)

Every element is a small print: a woodcut line, written by the ink engine's pen (kit/writer.js) with a near-square nib
(hair 0.9 × width, so the line is even in every direction; a slow ±10 % swell; tapered ends only where a petal or a leaf
curls; nothing under 1.2 px); the print's solids (a baton's bell, a pommel) poured black in register; and the stencils,
one mask per colour, grown to run under the line, slipped as a whole off the print by ~0.14 x-height in a seeded
direction (past the line on one side, under it on the other, no paper all round), ragged at the cut edge and mottled
along the brush, and poured into the medium (kit/inkletter.js) before the line is written over them. The medium's rim
pooling is taken back out of the stencil masks (gouache through a stencil has no ring).

- Drop initial: a trump in miniature, as tall as the drop and 0.6 of it wide: the frame rule, the numeral band with the
  book's number, the title band left empty (as XIII's is), and in the field IM FELL French Canon's capital standing on
  the cards' ground (a yellow strip under a wavering line, hatched). ?set=solid (default) prints the letter black as the
  cards letter their titles; ?set=contour cuts it as a contour with its body stencilled red. ?draw writes the frame, the
  numeral, then the letter along its skeleton (inkletter.js letterWriter), then lays the yellow beneath.
- Line initial: the capital as a contour with a red stencilled body.
- Paraph: a suit pip, the chapter's suit (cups, batons, swords, coins in the cards' order; the contents give each entry
  the same suit, so the marks are wayfinding): the coin with its rings and red heart (its scalloped band and rose when
  large enough to cut), the gadrooned cup with its red lip and faceted foot, the ace's sword, a short baton.
- Fillers: a baton laid along the line (bound at its middle when long); a sword, its point toward the words; the coin
  cards' vine (red stem, long leaves curling off it, yellow and pale blue in turn, the flower at its end). A heading's
  filler is the band's rule ending in a small coin.
- Breaks: chapter, the numeral band with the chapter's number, the chapter's suit standing either side; book, two
  batons crossed in a flat saltire running into the woven lozenge that binds them (strips over and under, pale blue,
  red points in the holes, yellow collars at its edges), the title band with the book's number below.
- Frames: quotation, the card's frame with the attribution in the title band; figure, the trump (frame, numeral band
  with the chapter's number, the caption in the title band); code, the pip card (frame, the number turned in each side
  margin, up the left and down the right); pull quote, the band's rules above and below with a coin on each; aside, the
  card's left edge and head band with a cup standing in it; contents, a baton down the margin, a suit at each entry
  (on a phone the baton lies across the head of the list).
- Palette: light, Conver's measured colours brought back toward their unaged values, the line a grey-black [64 61 57]
  (lighter than the text, as the print's thin ink is); dark, the line a warm pale ink and the stencil colours deepened
  toward their mass tones so they sit under it.

What falls short (at the 4× gate against the sources): a paraph-sized pip (~20 px) cannot carry the card's detail (the
coin loses its scallop and rose, the cup its gadroons), and its line is relatively ~5× heavier than the card's; the
stencil colour is more even than Conver's streaky lemon and vermilion; the drop initial is a bare card beside a printed
figure (a letter cannot be a figure; the contour setting brings colour in); long rules are written in lengths a dip
carries, and the pen pools a little where they join; a wide capital (M, W) is shrunk to fit the card's fixed 0.6 width;
the sword, the vine, the flower and five of the six frames were not set beside a source at 4×.
