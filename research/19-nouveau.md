# 19 · Nouveau: the line that swells where it ends

Art Nouveau's book and print ornament, 1895–1905, as a rubricate style. The breadth-first pilot (kit/wayfinding.js's
`nouveau` entry, after Obrist and Guimard) is superseded. Stage 1 is three direction studies
(tests/nouveau-directions.html, drawn by tests/nouveau-directions.js on kit/styles/nouveau-line.js); the style itself
waits for the user's choice. Raw downloads and screenshots are in the session scratchpad (nouveau/raw, nouveau/shots),
not the repo.

## Sources, studied at full size

| what | where | licence | used for |
|---|---|---|---|
| Verneuil, Auriol, Mucha, *Combinaisons ornementales* (Paris, Librairie centrale des beaux-arts, 1901), 60 plates, ~3600×3150 | archive.org `CombinaisonsOrnementales` (`/download/…/page/nN_w2000.jpg`) | public domain (IA: publicdomain) | the line: pl. 11, 17, 58 (whiplash, spiral, hairpin, club ends), pl. 30 (bundled stems, umbels, the frame that curls at a corner), pl. 3, 31, 46, 48, 53 (plants) |
| Eugène Grasset (dir.), *La plante et ses applications ornementales* (1896), 72 plates, 2519×3530 | archive.org `planteetsesappl00Gras` | PD (1896) | the iris (pl. 1, 2), poppy, fritillary; how a plant is turned into flat colour inside a contour |
| Mucha, *Documents décoratifs* (1902), pl. 40 (friezes) and studies | Wikimedia Commons, *Alfons Mucha – Documents décoratifs 02/05/24* | photographs CC BY-SA (the works are PD); looked at only | frieze structure: bands, heavy contour, flat fills, stems arching between flowers |
| Hermann Obrist, *Peitschenhieb* (embroidery, 1895), Münchner Stadtmuseum | Commons, *T-49-63 3 Obrist-H-Peitschenhieb-A4-ONLINE.jpg* | photograph CC BY-SA; looked at only | the long taut loop, thorn-like side shoots, gold silk on grey (a model for the dark palette) |
| *Ver Sacrum* 1900, Heft 3 (Vienna Secession) | archive.org `ver-sacrum-1900-3` | Public Domain Mark | Auchentaller's and König's *Randzeichnungen* (a margin line that rises and blooms over the head), the squared outlined initial, ◎◎◎ at a paragraph's end |
| *Jugend* 1896, no. 1 | archive.org `01-01_20250609` | (not stated; PD by date) | looked at: vignettes and heads; nothing measured |

Still to study in the deep pass: Eckmann's *Neue Formen* (1897) and his Jugend vignettes; Beardsley's *Morte Darthur*
borders (archive.org has the Dent edition); Guimard's Métro cast iron (Commons) for the branching stem; *Art et
Décoration* 1897–1905 (archive.org `art-et-decoration-*`) for book pages set with Nouveau initials.

## What makes it work (measured on the Combinaisons)

- **The line is a hairline that swells where it ends.** Along its run the stroke is a hairline; it swells into a
  club where it stops (a round blob, or a long seed shape drawn out to a point), and a little at its tightest turn. On
  pl. 11 and 58 (skeleton widths over the stroke's medial axis, 3574 px plate): hairline ~10 px, club 60–85 px, so
  **hairline : club ≈ 1 : 6–8**; the hairline is ~1% of the ornament's height. The swell is never mid-run.
- **Continuous curvature.** No corner anywhere, and no visible join: a whiplash is one long curve whose curvature
  changes smoothly, tightening into a spiral at one end. A Catmull–Rom spline (our `spline`) is only C1 and shows a
  kink at 4×; the engine uses a clamped cubic B-spline (C2) and grows spirals on by integrating curvature from the
  value where the spline leaves off.
- **The spiral's eye is solid.** The line winds in and thickens into a comma at the centre (pl. 11, 58).
- **The hairpin and the return.** A stroke runs up and comes back down beside itself (pl. 17); stems run in parallel
  bundles and part (pl. 30). Growth branches off itself: a shoot leaves a stem at a shallow angle.
- **Balance is rotational, not mirrored.** Two whips in counterpoint, the second turned half round the first.
- **Plants are flattened, not drawn.** Grasset and Verneuil reduce an iris to three standards, two falls and a
  beard, a poppy to a cup of three petals round a crowned capsule, a seed head to rays ending in seeds; each is flat
  colour inside an even contour, as the lithographed plates were printed.
- **Inks** (median on the plates, paper 241 238 230): olive-brown 111 97 54 (pl. 11), grey-green 89 96 75 (pl. 58),
  orange-ochre 211 147 87 (pl. 17); Grasset's violet iris, sage blades, ochre beard; Ver Sacrum's brown-black with a
  red-brown. Obrist's gold silk on grey is the dark ground's model.
- **The Vienna page** is stricter: a squared initial in a double rule, the rule continuing as stems that end in rings
  and berry clusters; three ring-dots (◎◎◎) close a paragraph in Ver Sacrum's own text.

## What to avoid

Clip-art Mucha (haloed women, the poster cliché); uniform-width curls; S-curves that are just sine waves; spirals of
constant pitch (an Archimedean spiral reads as a machine); symmetric mirrored compositions everywhere; scattered dots
(every ring or seed hangs from a stalk); gradients; plants drawn botanically (the period flattened them); a stroke
whose inner edge folds at a tight turn (half-width is held under 0.85 of the radius of curvature); hairlines under
~1.25 device px.

## Letters

Shortlisted by eye from 39 open-licence faces (scratchpad nouveau/fonts/specimen*.png; licence of each read):

| face | designer | licence | verdict |
|---|---|---|---|
| **Bocklin** (Arnold Böcklin, Otto Weisert 1904) | George Williams digitisation | BSD-style (no reserved name); fonts/nouveau/Bocklin-LICENSE.txt | the real 1904 Jugendstil face: swelling strokes, hooked terminals. Used for A and B |
| Victoria CAT | Peter Wiegel | OFL, RFN "Vectoria CAT" | heavy poster Nouveau with spiral curls; second choice |
| Gloria | Peter Wiegel | GPL+FE / OFL per its name table only | soft, Eckmann-like; licence evidence weaker |
| **Luxembourg 1910** | Peter Wiegel | OFL, RFN "Luxembourg 1910"; shipped unmodified | Vienna Secession lettering. Used for C |

Rejected: Neue Rudelskopf (contradictory licence), Reclame, Steffmann's "Art Nouveau Caps" (FontShop copyright), Jugend,
Mucha, Rudelsberg, Eckmann Moderne (personal use only), CAT Eckmann (no trustworthy source found). If an OFL face with a
reserved name is subset later it must be renamed, or shipped as outlines.

## Stage 1: the three directions (tests/nouveau-directions.html)

- **A · Le fouet** (the line): Böcklin letter in ink; an ochre whip rises from a seed-shaped club at the letter's
  foot, loops over the letter and winds into a solid-eyed spiral at its shoulder; an olive stem from the same root
  crosses it and ends in an umbel; a shoot off the main stem ends in a pointed bud. Break: two whips in counterpoint,
  turned half about the centre. Filler: a short whip ending in a spiral.
- **B · La plante** (the plant in a panel): an arch-topped panel painted sage, the Böcklin letter applied in rose with
  its contour, then blades, a stem and an iris grown in the column the letter leaves (placed at the panel's largest
  clearance), a branch carrying a furled bud over the letter's shoulder; a channel round the letter keeps the growth
  off it. Break: a poppy with whips curling into nodding buds. Filler: a stem, one blade, a bud.
- **C · Vienne** (the Vienna page): Luxembourg 1910 letter in red-brown within a heavy rule and a rounded hairline
  rule; three stems bundled up the left side and over the top, ending in a spiral, a ring, and a hanging cluster of
  ring-berries. Break: two parallel stems lifting round a seed pod with ring-berries. Filler: ◎◎◎.

## Stage 2: A and B taken further (C dropped)

The user: "they all look very clip art still". What made them clip art: flat RGB inside uniform outlines, symmetric
generic shapes, characterless curves, nothing printed. What changed:

- **Printed as chromolithographs** (kit/styles/nouveau-print.js). Each ink is its own stone. Shapes are knocked out
  where a later shape lies over them and trapped a little so slipped colours never open a gap. Each stone is slipped a
  fraction of a px off register, given the stone's grain at a near-full coat (stronger grain read as scribble), and
  poured through the ink engine (inkLetter). The key line is printed last and crisp. In A the whips are printed like
  keys, crisp with no grain; a grainy ragged edge made them look like crayon.
- **A line with a hand** (nouveau-line.js `contour`). The contour is heavier on the side turned from the light (from the
  top left), fine into sharp tips, and lifts off where the light falls fullest. Overlaps of the face's own contours are
  not drawn (`solid`). The whip has pen pressure: heavier on pulls down and to the right, lighter on pushes. Spirals end
  on a held arc at the eye's radius, so the solid eye is a true circle the line wraps.
- **Plants drawn round their own axes** (nouveau-flora.js). Each half of an organ has its own width, so no petal is
  symmetric, and the shaded half is laid as a second, darker stone (as Grasset's plates do).
  - The iris follows pl. 1: narrow pale standards, frilled falls with a gold signal and veins, a front fall hanging
    toward us, and a spathe with a fold line.
  - The poppy is a cup with crumpled rims, a basal blotch, folds and a rayed crown.
  - Buds show the petals at the seam.
  - Blades have parallel veins and can twist to show their paler back.
  - The seed head has fine rays ending in small drops, with bracts at the node.
- **Relating to the letter.** The letter's right profile is traced at a fixed distance (an echo). In A the whip rises
  along that echo, so it follows the bowls, and a hairline doubles it for a stretch. In B the stem follows the bowls up
  to the iris. The letter is Böcklin's own outline (fonts/nouveau/bocklin-X.json, exported by tools/nouveau_glyphs.py),
  so its contour can take the hand.

## The style (kit/styles/nouveau.js; tests/nouveau.html)

Both directions are one style, chosen with `kind` (`plante`, the default, or `fouet`). Each has a paint setting:
`paint` for la plante (`watercolour`, the default, or `printed`) and `fpaint` for le fouet (`wash`, the default, or
`gouache`). The page reads them as ?kind=, ?paint= and ?fpaint=.

- **Pieces.** The style draws every rubrication case: the drop initial (four lines, three on a phone), the initial in
  the line, the paraph, the fillers (a paragraph's and a heading's), three break ranks (part, chapter or book, end),
  the quotation and aside margin, the pull quote's head and foot, the figure and code frames, and the contents marks.
  All of them are built in kit/styles/nouveau-pieces.js on the shared plant and line code.
- **Printing.** Every piece is printed through rubricate's own path. Each ink is a mask poured with inkLetter, and the
  paint lives in the mask's coverage:
  - the chromolithograph's grain;
  - the watercolour wash: pooled to one side and at its edge, lifted where the brush ran dry, a rare back-run, and its
    shade glazed into the same colour;
  - the gouache's even coat with a faint brush grain.
  - In wash, the key line feathers into the inks laid damp.
- **Animation (?draw).** Each pour is revealed in growth order: lines along their length, and leaves and petals out
  from their base, so the flowers open. Nothing fades, and the final frame equals the still.
- **Le fouet.** Its whiplash is walked by a hand (`setHand`) in both paints.

One limit, and the hook that would lift it. The watercolour shown on the direction page was laid by washPour and
lineInto in a medium of its own: the water and the line share one sheet, so the bleed is physical. Rubricate's pour
contract has only inkLetter, so the style encodes the wash in coverage instead. A small hook in illum.js would let a
pour paint itself, for example `pour.paint(bake, { dpr })` used in place of inkLetter when it is present. With it, the
style could hand washPour and lineInto through unchanged.
