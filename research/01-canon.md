# 01 — The Canon: Illumination & Ornament, Mined for a Procedural Renderer

Research date: 2026-11-06. "Fetched" = retrieved and checked on that date (HTTP 200 and the content confirmed). "[unverified]" = the source is cited from knowledge or search snippets, or was blocked (Cloudflare challenge, captcha, 403), so it could not be fetched. Met object pages were resolved through the Met Collection API on 2026-11-06 (`isPublicDomain: true` unless noted).

Every entry follows this order: **Principle → Why it works (object) → How to make it procedural → Implication for a browser renderer → Sources.**

Some rules recur across traditions. They are collected in §0 so the sections can refer back to them.

---

## §0 Cross-cutting laws (the parts that transfer)

1. **Hierarchy of decoration tracks the hierarchy of text.** Every manuscript culture grades ornament by textual rank. In Gothic books the order runs from full-page miniature to historiated initial, then a 4-line or 2-line illuminated initial, a 1-line penwork initial, and finally line-fillers and paraphs. In Qur'ans it runs from the double frontispiece to the *sarlawh/unwan* headpiece, the sura heading, the verse markers and the marginal *hizb/juz'* medallions. Ornament is *navigation*. A renderer should derive ornament level from DOM semantics (h1/h2/p/li) and never decorate at random.
2. **Ornament is sized in text units.** Initials are specified as "N lines high". Islamic sura headings take one text line plus margins. Size ornament in `lh`/`em` units and snap it to the baseline grid.
3. **Generate from a stem.** Rinceaux, rumi/hatayi scrolls, Morris acanthus and Art Nouveau whiplash all grow from a continuous parent stem with tangential junctions. Owen Jones states this as Propositions 11–12 (§13).
4. **Two strokes: a fixed outline and a free fill.** Insular red dots, Ottoman *tahrir* outlines, Jones Props 29–34 and Rinpa's ink-over-pooled-colour all separate colour fields with an edge stroke. The edge carries the crafted quality. The fill can be flat.
5. **Gold is a material, not a colour.** It reads as light: specular, view-dependent, raised or matte. Fake it with lighting, not with a yellow hex value.
6. **Repetition with variation.** No two Kells zoomorphs are identical. Kelmscott borders repeat blocks, but the type around them changes. Marbling repeats only statistically. Use a seeded PRNG that is deterministic per element and varies between elements.
7. **Negative space is budgeted per tradition.** Insular carpet pages leave roughly 0% void. A Book of Hours leaves a calm text block inside a dense border. Rinpa leaves about 40–70% void, as gold or paper. Make density an explicit parameter.

---

## §1 Insular (c. 650–900): Book of Kells, Lindisfarne Gospels, St Gall Gospels

### 1.1 Interlace (knotwork) on a hidden grid
- **Principle.** A ribbon (or several) weaves strictly over-under-over across a square or diagonal grid. "Breaks" in the plait redirect it and generate the motif vocabulary. Every crossing alternates, and loose ends are absent or terminate in a beast head.
- **Why it works.** In the Lindisfarne carpet pages (BL Cotton MS Nero D IV, c. 715–720) the eye cannot find an error, and the logical closure reads as devotion and as labour. Construction marks (pricking and ruling on the versos) show these pages were laid out on grids with compass and ruler, so the result is algorithmic before it is artistic. The St Gall Irish Gospels (Cod. Sang. 51, c. 750) show the same system in a cruder, bolder register.
- **How to make it procedural.** Start with a plait on an N×M lattice. Each cell edge is either *open* (crossing) or *broken* (a wall that turns the strand back). The Bain/Cromwell "break" method is a 2-bit edge mask. Trace the strands as closed loops and assign over/under by parity, (i+j) mod 2 at each crossing. Render each strand as a band: two offset Bézier contours plus a gap where it passes under, typically 0.15–0.25 of the band width. Corner-break rules produce the classic Lindisfarne knot families. Optional: substitute a zoomorph head or tail at strand ends.
- **Implication for a browser renderer.** Use SVG paths, not canvas, so the knot scales to any border width and stays selectable. Seed it from the element id so it is stable on reload. The lattice should be computed to fill the container exactly, with no clipped half-knots. Insular knots always close.

### 1.2 Zoomorphic interlace and the "beast fills the space" rule
- **Principle.** Elongated animals (birds, dogs, lions, snakes) take the place of ribbons. Their bodies stretch to fill whatever shape is left, and they bite their own or each other's limbs to close loops.
- **Why it works.** The Kells Chi-Rho (TCD MS 58, fol. 34r, c. 800) hides cats, mice, otters and moths in the interstices of the monogram. Reward at magnification is part of the design, a 3-distance reading in the sense of Jones Prop. 7.
- **How to make it procedural.** Treat a zoomorph as a decorated strand. The head, leg and tail glyphs are attached at strand parameters t=0, t≈0.3 and t=1, and the strand is deformed along the interlace path. A small library of 6–10 head and foot SVG glyphs plus random pairing gives enough variety.
- **Implication for a browser renderer.** Detail beyond the reading distance means rendering finer sub-ornament only at higher zoom or devicePixelRatio (LOD), like a map tile pyramid.

### 1.3 Red-dot outlining (stippled halos)
- **Principle.** Initial letters and display capitals are surrounded by one or more rows of minium (red lead) dots at near-constant spacing. The dots also fill counters and ground areas.
- **Why it works.** The Lindisfarne incipit pages (e.g. the Luke incipit; folio not verified) surround letters with thousands of red dots. The letter glows without any gold, which makes this the poor monastery's gilding.
- **How to make it procedural.** Offset the glyph outline by d (`paper.js` offset or Clipper), sample the offset path at constant arc length s≈1.6×dot diameter, add ±8% jitter to radius and position, and repeat for k rings at d, 2d, ... Fill the counters with Poisson-disk dots.
- **Implication for a browser renderer.** This is cheap and very legible. It applies to any drop cap via `opentype.js` glyph paths, and it is a strong default "first illum effect" because it needs no gold.

### 1.4 Carpet pages and display-script hierarchy
- **Principle.** A full page of pure ornament, built on a cross or rectangle armature, precedes each Gospel. The opening words then decrease in size line by line ("diminuendo": huge initial, then large capitals, then text).
- **Why it works.** Lindisfarne's carpet pages work as a threshold, and the diminuendo choreographs the transition from image to text.
- **How to make it procedural.** Partition a rectangle by a cross or medallion armature, then fill each cell with a different interlace family (knot, zoomorph, key/fret, spiral trumpet). The palette is restricted to about 6 pigments. Diminuendo means font-size following a geometric decay, e.g. 6, 3, 2, 1.5, 1 lines.
- **Implication for a browser renderer.** A "carpet" section divider or hero. Diminuendo maps directly onto the first paragraph of an article: `::first-letter` plus `::first-line` plus a span-wrapped second line.
- **Palette.** Orpiment yellow, verdigris green, minium red, woad/indigo blue, kermes/folium purple, carbon black and gypsum white, on vellum. Lindisfarne uses essentially no gold.
- **Sources.** e-codices Cod. Sang. 51: https://www.e-codices.unifr.ch/en/list/one/csg/0051 (fetched, 2026-11-06); IIIF https://www.e-codices.unifr.ch/metadata/iiif/csg-0051/manifest.json (fetched, 200, IIIF Presentation 2). Book of Kells, TCD Digital Collections https://digitalcollections.tcd.ie/concern/works/hm50tr726 (captcha wall, [unverified]; TCD imposes a single-academic-use restriction per an Edinburgh record, [unverified]). Lindisfarne Gospels: https://www.bl.uk/collection-items/lindisfarne-gospels (fetched; page states "recovering from a cyber-attack… limited digital content", so the manuscript viewer is [unverified]). Knotwork method: G. Bain, *Celtic Art: The Methods of Construction* (1951); P. Cromwell, "Celtic knotwork: mathematical art", *Math. Intelligencer* 15 (1993) [unverified].

---

## §2 Romanesque & Gothic (c. 1100–1530)

### 2.1 Historiated and inhabited initials
- **Principle.** The letter is architecture. Its bowl or counter frames a narrative scene (historiated) or holds figures and beasts climbing scrolls (inhabited). The letterform stays legible and the scene is subordinate to its geometry.
- **Why it works.** In Jean Pucelle's *Hours of Jeanne d'Evreux* (Met 54.1.2, c. 1324–28), grisaille initials open each Hour and the figures obey the letter's frame.
- **How to make it procedural.** Take the glyph path and compute counters (holes) with even-odd fill. Inscribe a content rectangle in the largest counter by distance-transform maximum. Place either a supplied image or a generated vignette inside it, then fill the remaining letter body with diaper or rinceau.
- **Implication for a browser renderer.** A `<illum-initial letter="A" scene="url|generator">` component. Graceful fallback is a plain styled first letter. Keep the real letter as text with `aria-hidden` on the ornament.
- **Sources.** Met 470309 https://www.metmuseum.org/art/collection/search/470309 (fetched via API).

### 2.2 Penwork filigree and puzzle initials
- **Principle.** These are the workhorse levels. *Puzzle initials* split the letter into interlocking red and blue pieces separated by a reserved white hairline. *Penwork (filigree) initials* are a solid letter in one colour, flourished in the *opposite* colour (red letter with blue penwork, and vice versa). The flourishing is fine hairline spirals, beads, and long tendrils running down the margin. Initials of 1, 2 or 4 lines alternate red and blue down the page.
- **Why it works.** These are found from 12th-century England to 16th-century Italy. A Library of Congress Dutch Book of Hours (c. 1450–1500) has Utrecht-type puzzle initials. Alternation gives rhythm, and the opposite-colour rule guarantees contrast without a third pigment.
- **How to make it procedural.** *Puzzle.* Partition the glyph polygon with a meandering cut curve (a sine-perturbed polyline with interlocking tabs), assign red and blue alternately, and inset each region by a hairline gap. *Filigree.* From seed points on the letter boundary, grow recursive fiddlehead spirals (logarithmic spirals with r=a·e^{bθ}, 1.5–3 turns), branch at 30–60°, terminate in beads (filled circles of 1.5–2× line width), and constrain growth to the margin box. Add a vertical "tail" tendril extending k lines. Line width is constant and thin (0.3–0.5 px at 1×). The quality comes from even spacing, which a repulsion/space-colonization step provides.
- **Implication for a browser renderer.** This is the single most useful pattern for paragraphs and lists. A `--illum-alt` counter alternates colour by element index. Spirals must avoid text, so the margin box comes from layout (ResizeObserver).
- **Sources.** Europeana, "Lighting the way: how illuminated initials guided medieval readers" https://www.europeana.eu/en/blog/lighting-the-way-how-illuminated-initials-guided-medieval-readers-through-books (search result, [unverified fetch]); LoC Bibliomania, Dutch Book of Hours https://blogs.loc.gov/bibliomania/2023/06/28/dutch-book-of-hours/ ([unverified fetch]); HMML lexicon "Penwork initial" https://hmmlschool.org/lexicon/14666/ ([unverified fetch]).

### 2.3 Bas-de-page marginalia and drolleries
- **Principle.** The lower margin holds unframed scenes on a ground line, often comic or subversive (apes, snail-jousts, hybrids, rabbits hunting hunters). Drolleries sit *on* the border's branches and treat the frame as a stage.
- **Why it works.** In the *Hours of Jeanne d'Evreux* bas-de-page there are games and hybrids under sacred scenes. The Luttrell Psalter (BL Add MS 42130, c. 1325–40; BL viewer degraded, [unverified]) has agricultural labour and grotesques. The margin is the place where the authority of the text is relaxed.
- **How to make it procedural.** A sprite grammar: [actor] + [action] + [prop] composed on a ground line anchored to the bottom border stem. Characters perch on border tendrils at endpoints from the rinceau generator.
- **Implication for a browser renderer.** These are "easter eggs" in footers and empty states. They must be sparse, at most 1 per viewport. Treat them as a content layer, not a texture.
- **Sources.** Met 470309 https://www.metmuseum.org/art/collection/search/470309 (fetched via API); Luttrell Psalter, BL Add MS 42130 [unverified].

### 2.4 Books of Hours borders: ivy-leaf rinceaux, acanthus, strewn borders
- **Principle.** The border sequence runs from **French ivy-leaf (*vignette*)**: hairline black stems bearing small gold (burnished) and coloured trilobed ivy leaves, c. 1380–1450. It continues to **acanthus** (broad painted curling leaves in blue, red, green, gold, with fruit and flowers) and ends with the **Ghent-Bruges strewn border** (c. 1470–1530): trompe-l'oeil flowers, insects and pilgrim badges casting shadows on a coloured or gold ground. Borders bracket the text block on 1–4 sides, and their density marks the textual rank.
- **Why it works.** The Limbourg Brothers' *Belles Heures* (Met 54.1.1, 1405–09) has ivy-and-gold vinets around text pages, giving even grey value with a sparkle of burnished gold. The *Prayer Book of Bonne of Luxembourg* (Met 69.86) shows the earlier Pucelle style.
- **How to make it procedural.** For ivy: a space-filling stem in the margin band (a random walk with curvature limits, or an L-system), with leaves placed at nodes with alternating phyllotaxy. Each leaf is a 3-lobed glyph rotated tangent to the stem, about 40% gold and 60% blue/red/green. Stem width is uniform black hairline. Strict rule: stems never cross, and all spring from the border bar or the initial (§0.3). Strewn border: Poisson-disk placement of botanical sprites with a drop-shadow offset at a consistent light angle.
- **Implication for a browser renderer.** Use an SVG `border-image` substitute or an absolutely positioned SVG gutter. Regenerate on resize with the same seed. Leaves at hairline width need to stay ≥0.75 CSS px or they alias, so add a `vector-effect: non-scaling-stroke` fallback.
- **Sources.** Met 470306 Belles Heures https://www.metmuseum.org/art/collection/search/470306 (fetched via API); Met 470309 Hours of Jeanne d'Evreux https://www.metmuseum.org/art/collection/search/470309 (fetched via API); Met 471883 Prayer Book of Bonne of Luxembourg https://www.metmuseum.org/art/collection/search/471883 (fetched via API); Met 467518 leaf from a Book of Hours, c. 1500 (fetched via API).

### 2.5 Gilding: raised burnished gold vs shell gold, punchwork
- **Principle.** There are two golds with opposite optics. **Raised burnished gold**: a gesso cushion (gypsum/chalk + lead white + glue + sugar/honey, often tinted with bole), applied with a quill, breathed on, gold leaf laid, then burnished with agate or dog's tooth. The result is a mirror that goes dark or bright as the page tilts, with a soft 3D edge. **Shell gold**: powdered gold in gum arabic, brushed on like paint. It is matte and granular, used for hatching highlights and fine lines. **Punchwork/tooling**: patterns impressed with metal punches into burnished gold (manuscripts less often than panel paintings). Points, rosettes and rings scatter light into a sparkle texture.
- **Why it works.** Belles Heures and other Parisian work use burnished gold dots and leaves against matte paint. Burnished gold reads as a light source, not a colour (§0.5). Cennino Cennini's *Il Libro dell'Arte* (c. 1400) gives the recipes.
- **How to make it procedural.** Raised gold = a height field (distance transform of the shape, smoothstep-rounded) → normal map → shade with an environment of a dark room with one window. Gold reads correctly only when much of it is *dark brown/olive* with sharp highlight, not uniform yellow. Add burnish streak noise (anisotropic along one axis) and edge crackle. Shell gold = granular noise × warm ochre, low specular. Punchwork = stamp a circle/rosette brush in a lattice or along an offset contour; each punch is a tiny concave normal.
- **Implication for a browser renderer.** A WebGL fragment shader on an SVG-derived mask. Tie the light direction to `deviceorientation`/pointer for the tilt sparkle, under `prefers-reduced-motion: reduce` → static. CSS-only fallback: layered `linear-gradient` with sharp stops + `mix-blend-mode`.
- **Sources.** Cennino Cennini, *Il Libro dell'Arte*, ch. 157–159 on manuscript gilding (D.V. Thompson trans. 1933) [unverified]; Met 470306 (fetched).

---

## §3 Islamic illumination

### 3.1 Qur'an frontispieces, shamsa, unwan, sarlawh; the page as nested frames
- **Principle.** The page is a set of nested rectangles. Text panel, then rule frames (*jadval*: multiple coloured rules, often gold between black), then cloud-band cartouches above and below the text, then the illuminated headpiece (*unwan/sarlawh*, often with a domed or crenellated top extending into the margin), then marginal *ansa* (tabs/palmettes) projecting outward. The **shamsa** ("little sun") is a radiating rosette medallion on opening leaves, with a ring of petal or finial rays. Double-page frontispieces are mirror-symmetric across the gutter. Colours are dominated by gold and lapis blue (ultramarine), with accents of red, white, green and black. The gold ground carries fine black outlining.
- **Why it works.** In the Shah Jahan Album *'Unwan* (Met 55.121.10.38, recto c. 1630–40), the unwan is dense polychrome above calm calligraphy. The *Mantiq al-Tayr* frontispiece (Met 63.210.1, illumination c. 1600) is a full-page architecture of cartouches. The Mamluk Qur'an section (Met 2006.212, c. 1320) shows geometric frontispiece logic. Symmetry plus gold gives a threshold effect like Insular carpet pages.
- **How to make it procedural.** A recursive box model. `frame(depth) = rule(colour[depth]) + band(pattern[depth]) + frame(depth+1)`. Cartouches are lobed shapes made from a rectangle with semicircular or ogival ends, or a polylobed outline via Minkowski sum. Shamsa: n-fold polar repeat (n=16–32) of a petal unit plus a concentric band, with finials as outward rays. Mirror the result across the axis for the spread.
- **Implication for a browser renderer.** Maps naturally onto CSS nested boxes: the component is a frame stack around `<header>`. Typesetting stays native, and the illuminated frame is SVG sized from the content box. Shamsa = a lone section marker or avatar frame.
- **Sources.** Met 451285 https://www.metmuseum.org/art/collection/search/451285 (fetched via API; medium "ink, opaque watercolor, and gold on paper"); Met 455250 https://www.metmuseum.org/art/collection/search/455250 (fetched via API); Met 455270 https://www.metmuseum.org/art/collection/search/455270 (fetched via API).

### 3.2 Rumi and hatayi: the two-family scroll grammar
- **Principle.** Ottoman and Persian floral ornament uses two motif families on spiral stems. **Rumi** are split-leaf, bifurcated, hook-shaped palmette half-leaves (arabesque, of Seljuk origin). **Hatayi** are stylised lotus/peony blossoms seen frontally or in profile (Chinese "Cathay" origin), with *pençe* (five-petal rosettes) and buds. They run on separate spiral systems that overlap ("two-layer scroll"), each with its own stem. Spirals are equal-pitched, junctions tangential, and the field is filled evenly without crowding. Further styles: *saz* (long serrated dagger leaves, after Şahkulu, 16th c.), *halkâr* (gold-only painting with gold of different tones), *şükûfe* (naturalistic bouquets, 18th c.).
- **Why it works.** The tughra of Süleyman (Met 38.149.1, c. 1555–60) has blue and gold spiral scrolls with tiny hatayi blossoms inside the tughra's loops. It is the textbook demonstration of two superimposed spiral layers in contrasting colours, and the calligraphy remains dominant.
- **How to make it procedural.** Generate an Archimedean or log spiral network by recursively spawning sub-spirals tangent to parent spirals (one generator per layer). Layer A carries rumi tips at terminals. Layer B carries hatayi/pençe at nodes. Render A in gold with black outline and B in blue/white, A over B, with layers crossing but never touching within a layer. The space-filling constraint is enforced with a minimum distance field.
- **Implication for a browser renderer.** The best "luxury background" generator. Present it in a bounded field (a cartouche), never as an infinite wallpaper, because tezhip is always framed.
- **Sources.** Met 449533 https://www.metmuseum.org/art/collection/search/449533 and 449534 (fetched via API). Motif vocabulary (rumi, hatayi, pençe, münhani, halkâr, saz, şükûfe): Wikipedia "Ottoman illumination" https://en.wikipedia.org/wiki/Ottoman_illumination; akmb.gov.tr article (search snippets, [unverified fetch]). Şahkulu dating is disputed between sources (16th vs 17th c.); the 16th-century attribution is the standard one.

### 3.3 Geometric strapwork (girih)
- **Principle.** Interlaced straps form star polygons ({n/m}, commonly 8, 10, 12 and 16-fold) on a periodic or locally quasi-periodic lattice. Straps weave over and under (as in §1.1), and the cells between them are filled with arabesque or solid colour. Construction is by compass and straightedge from a circle grid, or by the girih-tile method (five tiles: decagon, pentagon, hexagon, bowtie, rhombus with line decorations).
- **Why it works.** Mamluk Qur'an frontispieces (e.g. Met 2006.212, c. 1320) build a whole page from one star rosette radiating into a polygonal net, which gives total coherence from a single seed.
- **How to make it procedural.** Kaplan's "polygons-in-contact" (Hankin) method: take a tiling (e.g. 4.8.8 or 3.12.12). At each edge midpoint emit two rays at contact angle θ (typically 54–72°), clip where rays meet, and the resulting line set *is* the strapwork. Then offset to bands and assign over/under by traversal parity.
- **Implication for a browser renderer.** Fully deterministic and tile-able, so it is a good CSS `background` via a pre-rendered SVG tile, or live SVG for hover/animation. Contact angle θ is a single slider that gives a large design space.
- **Sources.** C. S. Kaplan, "Islamic star patterns from polygons in contact", *Graphics Interface* 2005 [unverified]; P. Lu & P. Steinhardt, *Science* 315 (2007) on girih tiles [unverified]; Met 455270 (fetched via API).

### 3.4 Ebru (marbling)
- **Principle.** Pigment drops floated on a size (gum tragacanth or carrageenan) spread as concentric rings. A stylus or comb drags through them and the image is transferred to paper by contact. Patterns: *battal* (stone, raw drops), *gelgit* (back-and-forth combing), *taraklı* (combed), *bülbül yuvası* (spirals), and *çiçekli* (flower ebru, Necmeddin Okyay, early 20th c.). Every operation is area-preserving and topology-preserving, because the fluid is incompressible and nothing tears.
- **Why it works.** The Met's *Marbled Elephant* (2022.201, 1630–50, "marbling with gold and silver on paper") uses marbling *as a figure* via stencil resist. The Met's *Folio with Marbled Decoration* (2019.297.9) uses marbled paper as the border around calligraphy, which is the canonical album use. C. W. Woolnough's *The Whole Art of Marbling* (1881) has actual samples and is PD at Wellcome.
- **How to make it procedural.** Jaffer, Lu et al., "Mathematical marbling" (IEEE CG&A 2012) give closed forms. Ink drop at C with radius r: every point P maps to C + (P−C)·sqrt(1 + r²/|P−C|²). Tine line through point B with direction M: P' = P + z·u^{d}·M, where d is the distance of P from the line, z the displacement and u the falloff in (0,1). Represent each colour boundary as a polyline, apply drops and tines in sequence, and resample long edges. This is exact, fast and resolution-independent.
- **Implication for a browser renderer.** Polygons in SVG, or the inverse mapping per pixel in a fragment shader (the transforms are invertible), which allows infinite zoom. Endpapers, section backgrounds and hover "comb" interactions (pointer drags = tine strokes) are all possible. This is probably the most immediately delightful interaction in the whole canon.
- **Sources.** Met 825641 https://www.metmuseum.org/art/collection/search/825641 (fetched via API); Met 827573 https://www.metmuseum.org/art/collection/search/827573 (fetched via API); Wellcome, Woolnough *The Whole Art of Marbling*, work `bmtnccag`, licence PDM, IIIF https://iiif.wellcomecollection.org/presentation/v2/b29354213 (fetched via API); Jaffer et al. 2012 [unverified].

### 3.5 Mughal hashiya (borders)
- **Principle.** Album pages place a central painting or calligraphy panel in a wide border (*hashiya*) of gold-on-tinted-paper flowering plants, figures or animals in *gold only* (two or three gold tones) or in light colour. The border is much wider than the panel and carries a single motif repeated with variation. Rule frames (*jadval*) separate them.
- **Why it works.** The Shah Jahan Album folios (e.g. Met 55.121.10.21 "Shah Jahan on Horseback", c. 1630) put a jewel-like miniature in a calm field of gold flowering plants evenly spaced on buff paper. The border cools the eye, and the hierarchy is enforced by density contrast.
- **How to make it procedural.** Put a uniform jittered grid of plant sprites in the border band. Each sprite is a parametric plant (stem + 3–7 leaves + 1 bloom, mirrored or not), two gold tones plus a dark outline, with sprite orientation following the band. Corner resolution: rotate 45° or place a larger single plant.
- **Implication for a browser renderer.** Wide `padding` around `<figure>`/`<blockquote>`, with SVG in the padding box. Use `aspect-ratio` to preserve the album proportions.
- **Sources.** Met 451267 https://www.metmuseum.org/art/collection/search/451267 (fetched via API); Met 451259 (fetched via API).

---

## §4 East Asian brush & paper

### 4.1 Xie He's Six Principles (c. 550 CE), as rendering requirements
- **Principle.** From the preface to *Guhua pinlu* (古畫品錄, "Record of the Classification of Old Painters"):
  1. **气韵生动 qiyun shengdong**: "spirit resonance / vitality".
  2. **骨法用笔 gufa yongbi**: "bone method, the way of using the brush".
  3. **应物象形 yingwu xiangxing**: correspondence to the object, depicting form.
  4. **随类赋彩 suilei fucai**: suitability to type, applying colour.
  5. **经营位置 jingying weizhi**: division and planning, placement.
  6. **传移模写 chuanyi moxie**: transmission by copying models.
- **Why it works.** These are a spec. (1) Animation and life come from (2): a structural stroke with modulated pressure, entry and exit, speed, and dry-brush "flying white" (*feibai*). Placement (5) puts emptiness to work. (6) legitimises learning from exemplars, which is the case for a corpus.
- **How to make it procedural.** *gufa yongbi* = model a stroke as a centreline + pressure profile p(t) + speed v(t). Width w ∝ p. Ink load decays along t, and when load × pressure falls below a threshold the bristles separate into *feibai* (stripe mask of k bristle tracks with per-bristle noise). Stroke ends: *cangfeng* (hidden tip: the stroke starts with a reverse loop, giving a blunt rounded head) vs *lufeng* (exposed tip: sharp entry). *qiyun* is the hardest. In practice it means no uniform repetition, rhythmic variation in v(t), and slight overshoot. Use a physically motivated brush (bristle-particle or skeletal stroke) rather than variable-width offsets.
- **Implication for a browser renderer.** Canvas2D or WebGL with stroke-time animation (draw-on). The stroke order is information, so animating it is honest. Seed pressure curves from real stylus recordings where possible (principle 6).
- **Sources.** Wikipedia "Six principles of Chinese painting" https://en.wikipedia.org/wiki/Six_principles_of_Chinese_painting (fetched, 2026-11-06).

### 4.2 Rinpa: gold ground, tarashikomi, and the cut-out composition
- **Principle.** Flat gold-leaf ground (a grid of visible ~10 cm leaf squares with slight overlaps), large areas of void, motifs cropped by the frame edge, repetition of one motif in rhythmic rows (Kōrin's irises are stencil-like repeats in two blues and one green), and **tarashikomi**: dropping wet ink or colour into a still-wet wash so it pools and dries with dark crisp edges and granular blooms.
- **Why it works.** Kōrin's *Irises at Yatsuhashi* (Met 53.7.1-.2, after 1709) uses two-colour repetition on gold, and the bridge is implied by the zigzag. Sōtatsu's *Waves at Matsushima* (Freer F1906.231-232) has rhythmic gold and silver wave lines against gold. Tawaraya Sōri's *Morning Glories* (Met 36.100.27) and Sakai Hōitsu's *Persimmon Tree* (Met 57.156.3) are tarashikomi textbooks. Kōetsu–Sōtatsu poem scrolls (Met 1975.268.59, 2015.300.86) are calligraphy over gold- and silver-printed underpainting. *That* is the web-page model: text over decorated ground.
- **How to make it procedural.** *Gold ground*: a grid of leaf tiles with per-tile hue and value jitter (±3%), thin darker overlap seams, and occasional wrinkles or patches. *Tarashikomi*: simulate on a grid. Paper wetness W, pigment in suspension S, deposited D. Advect and diffuse S where W>0. Evaporation is faster at the edges, so capillary flow carries pigment outward (the coffee-ring effect, which gives the dark rim). Inject a second pigment into a still-wet region. Curtis et al., "Computer-Generated Watercolor" (SIGGRAPH 1997) is the reference model, and a simplified 2-pass version in WebGL runs interactively. *Composition*: crop motifs at frame edges on purpose, and repeat one motif with small variations along a diagonal.
- **Implication for a browser renderer.** Render the tarashikomi sim once offline or at idle into a texture (it is expensive), then cache it. Gold-leaf grid as a CSS background with a seeded SVG. Rinpa's composition breaks the "centred hero" habit of the web.
- **Sources.** Met 39664 https://www.metmuseum.org/art/collection/search/39664 (fetched via API); Freer F1906.231-232 https://asia.si.edu/object/F1906.231-232/ (fetched via SI API, `metadata_usage.access: CC0`); Met 48979, 45392, 44861, 53246 (fetched via API); Curtis et al. 1997 [unverified].

### 4.3 Karakami and ryōshi: decorated papers for writing
- **Principle.** *Karakami*: paper block-printed with mica (*kira*) or shell white (*gofun*) from carved woodblocks in small repeating motifs (arabesque, waves *seigaiha*, clouds, paulownia) on a tinted ground. The motif shimmers only at a raking angle, so text remains readable. *Ryōshi* (料紙) for Heian poetry anthologies (e.g. *Nishi Honganji Sanjūrokunin-kashū*, c. 1112) combine *tsugigami* (collaged torn and cut papers), *kirihaku* (cut gold/silver foil flakes), *sunago* (gold dust), and *suminagashi* (Japanese floating-ink marbling).
- **Why it works.** The decoration sits in a *different optical channel* from the text. Mica is near-invisible head-on and glows at an angle, so ornament and legibility never compete.
- **How to make it procedural.** Tile a motif SVG. Render it with low diffuse contrast (ΔL < 5) and high, angle-dependent specular. Torn-paper edges: a fractal displacement of the cut line plus a fibre fringe. *Kirihaku*: random small quads with lognormal sizes in clusters. *Sunago*: a density field (Perlin noise) of tiny gold dots, denser in corners.
- **Implication for a browser renderer.** *This is the correct model for page backgrounds behind body text.* Ornament lives in specularity and is lit by pointer or scroll, so it does not hurt WCAG contrast. Keep text contrast computed against the max-luminance state.
- **Sources.** Nishi Honganji *Sanjūrokunin-kashū* (no open image source found, [unverified]); Met 45505 netsuke depicting a letter on decorated paper (fetched via API, peripheral). Karakami workshop practice, e.g. Kyoto Karacho [unverified].

### 4.4 Chinese decorated letter papers (jianzhi / jianpu)
- **Principle.** Ming literati letter paper is printed in pale colour with *douban* (multi-block colour woodblock) and *gonghua* (blind embossing with an uninked block). Motifs: a single sprig, rock, antique bronze, or insect, placed off-centre and pale, or as an embossed white-on-white relief. The ornament occupies maybe 10–20% of the sheet, and the writer's text runs over or around it.
- **Why it works.** *Shizhuzhai jianpu / shuhua pu* (Ten Bamboo Studio, Hu Zhengyan, c. 1633–44): Cambridge University Library has the only complete copy in original binding. The blind-embossed cloud patterns are visible only as raking-light relief, the same separate optical channel as karakami.
- **How to make it procedural.** Use a single small vignette (sprig generator from §4.1 brush strokes) at 15–30% opacity in one corner. *Gonghua* = a heightmap of the motif → normal map → lit relief with zero albedo change.
- **Implication for a browser renderer.** This is the most restrained and probably most "museum" option for a reading page. Use CSS `filter: drop-shadow` pairs (one light, one dark, offset ±0.5px) on a same-colour SVG to fake embossing with no WebGL.
- **Sources.** Cambridge Digital Library, *Shi zhu zhai shu hua pu* https://cudl.lib.cam.ac.uk/view/PR-FH-00910-00083-00098/1 (fetched, page title confirmed); Fitzwilliam https://data.fitzmuseum.cam.ac.uk/id/object/223168 (search snippet, [unverified fetch]); RISD *Shizhuzhai jian pu* https://risdmuseum.org/art-design/collection/shizhuzhai-jian-pu-letterpapers-ten-bamboo-studio-200512 (search, [unverified fetch]). Dates differ between sources (1633 vs c. 1644).

### 4.5 Sutra frontispieces (paired)
- **Principle.** Gold and silver line on indigo-dyed paper (*kon-shi kindei*), with an illustrated frontispiece followed by text in the same gold.
- **Why it works.** The Lotus Sutra volume (Met 1994.207, c. 1340) is a full metallic monochrome on dark ground, with no colour hierarchy and only line weight. It is a ready-made dark-mode palette.
- **How to make it procedural / browser.** Dark mode = indigo ground, ornaments in two metals (gold for primary, silver for secondary), line-only.
- **Sources.** Met 36451 https://www.metmuseum.org/art/collection/search/36451 (fetched via API).

---

## §5 European revival & modern

### 5.1 Owen Jones, *The Grammar of Ornament* (1856): the 37 Propositions
- **Principle.** These are the most directly codable rules in the canon. The text below is cleaned from the 1856 OCR, with marginalia removed.

  **Architecture and form (1–13)**
  1. The Decorative Arts arise from, and should properly be attendant upon, Architecture.
  2. Architecture is the material expression of the wants, the faculties, and the sentiments, of the age in which it is created.
  3. As Architecture, so all works of the Decorative Arts should possess fitness, proportion, harmony, the result of all which is repose.
  4. True beauty results from that repose which the mind feels when the eye, the intellect, and the affections are satisfied from the absence of any want.
  5. Construction should be decorated. Decoration should never be purposely constructed.
  6. Beauty of form is produced by lines growing out one from the other in gradual undulations: there are no excrescences; nothing could be removed and leave the design equally good or better.
  7. The general forms being first cared for, these should be subdivided and ornamented by general lines; the interstices may then be filled in with ornament, which may again be subdivided and enriched for closer inspection.
  8. All ornament should be based upon a geometrical construction.
  9. …every assemblage of forms should be arranged on certain definite proportions; the whole and each particular member should be a multiple of some simple unit. Those proportions will be the most beautiful which it will be most difficult for the eye to detect (5:8 better than 4:8; 3:7 than 3:6; 3:8 than 3:9; 3:5 than 3:4).
  10. Harmony of form consists in the proper balancing and contrast of the straight, the inclined, and the curved.
  11. In surface decoration all lines should flow out of a parent stem. Every ornament, however distant, should be traced to its branch and root.
  12. All junctions of curved lines with curved or of curved lines with straight should be tangential to each other.
  13. Flowers or other natural objects should not be used as ornament, but conventional representations founded upon them sufficiently suggestive to convey the intended image to the mind, without destroying the unity of the object they are employed to decorate.

  **Colour (14–34)**
  14. Colour is used to assist in the development of form, and to distinguish objects or parts of objects one from another.
  15. Colour is used to assist light and shade, helping the undulations of form by the proper distribution of the several colours.
  16. These objects are best attained by the use of the primary colours on small surfaces and in small quantities, balanced and supported by the secondary and tertiary colours on the larger masses.
  17. The primary colours should be used on the upper portions of objects, the secondary and tertiary on the lower.
  18. (Field's chromatic equivalents.) Primaries of equal intensities harmonise in the proportions 3 yellow : 5 red : 8 blue (=16). Secondaries 8 orange : 13 purple : 11 green (=32). Tertiaries citrine 19 : russet 21 : olive 24 (=64). Each secondary is neutralised by the remaining primary (8 orange by 8 blue; 11 green by 5 red; 13 purple by 3 yellow). Each tertiary is neutralised by the remaining secondary (24 olive by 8 orange; 21 russet by 11 green; 19 citrine by 13 purple).
  19. When a full colour is contrasted with another of a lower tone, the volume of the latter must be proportionally increased.
  20. When a primary tinged with another primary is contrasted with a secondary, the secondary must have a hue of the third primary.
  21. On moulded surfaces place blue (which retires) on concave surfaces, yellow (which advances) on convex, and red on the undersides, separating the colours by white on the vertical planes. (Note: when proportions cannot be obtained, rebalance by shifting the hues: too much yellow → make red more crimson and blue more purple.)
  22. The various colours should be so blended that the objects coloured, when viewed at a distance, should present a neutralised bloom.
  23. No composition can ever be perfect in which any one of the three primary colours is wanting, either in its natural state or in combination.
  24. When two tones of the same colour are juxtaposed, the light colour will appear lighter, and the dark colour darker. (Chevreul)
  25. When two different colours are juxtaposed, they receive a double modification: in tone (light lighter, dark darker), and in hue (each tinged with the complementary of the other).
  26. Colours on white grounds appear darker; on black grounds, lighter.
  27. Black grounds suffer when opposed to colours which give a luminous complementary.
  28. Colours should never be allowed to impinge upon each other.
  29. When ornaments in a colour are on a ground of a contrasting colour, the ornament should be separated from the ground by an edging of lighter colour; as a red flower on a green ground should have an edging of lighter red.
  30. When ornaments in a colour are on a gold ground, the ornaments should be separated from the ground by an edging of a darker colour.
  31. Gold ornaments on any coloured ground should be outlined with black.
  32. Ornaments of any colour may be separated from grounds of any other colour by edgings of white, gold, or black.
  33. Ornaments in any colour, or in gold, may be used on white or black grounds, without outline or edging.
  34. In "self-tints," tones, or shades of the same colour, a light tint on a dark ground may be used without outline; but a dark ornament on a light ground requires to be outlined with a still darker tint.

  **Imitation and method (35–37)**
  35. Imitations, such as the graining of woods and of the various coloured marbles, [are] allowable only when the employment of the thing imitated would not have been inconsistent.
  36. The principles discoverable in the works of the past belong to us; not so the results. It is taking the end for the means.
  37. No improvement can take place in the Art of the present generation until all classes, Artists, Manufacturers, and the Public, are better educated in Art, and the existence of general principles is more fully recognised.
- **Why it works.** The 100 chromolithograph plates (e.g. Met 2023.671, "Nineveh and Persia No. 1") demonstrate each culture under these laws. Jones distilled the Alhambra and the Islamic and Indian work he saw at the 1851 Great Exhibition into these rules, which is why they agree with §3.
- **How to make it procedural.** Treat Props 6, 7, 8, 11 and 12 as *generator constraints*: one-root tree, tangential (G1) joins, a geometric scaffold, and 3-level LOD subdivision. Props 16–18 and 22 are a *palette solver*: area ratios by role (primaries on small areas, upper parts) and a check that the area-weighted mean hue approaches neutral at distance ("neutralised bloom" = blur the render and test chroma). Props 28–34 are an *edging rule table*. Given (ornament colour, ground colour/gold/black/white), output the outline colour automatically. Prop 9 is a *proportion picker*: prefer non-obvious ratios (5:8, 3:7) for border widths and panel splits. Prop 36 is the project's ethic: copy principles, not results.
- **Implication for a browser renderer.** Ship Props 28–34 as a pure function `edgeFor(fg, bg)` and Props 16–18 as CSS custom-property area budgets (`--illum-primary-area: 0.06`). Prop 22 doubles as an automated test: downsample a screenshot and assert low chroma variance.
- **Sources.** Internet Archive OCR https://archive.org/stream/grammarornament00Jone/grammarornament00Jone_djvu.txt (fetched, lines quoted above); IIIF https://iiif.archive.org/iiif/3/grammarornament00Jone/manifest.json (fetched, 200); Met 891631 https://www.metmuseum.org/art/collection/search/891631 (fetched via API).

### 5.2 William Morris & the Kelmscott Chaucer (1896)
- **Principle.** The *opening* (the two-page spread) is the unit, not the page. Margins increase inner < top < outer < bottom (Morris's stated principle, [unverified]; for a numeric canon use Tschichold's medieval 2:3:4:6, which is Tschichold's, not Morris's [unverified]). Heavy black type (Chaucer type, a gothic) is matched in "colour" (texture density) by heavy wood-engraved borders of dense acanthus and vine on a white-line ground. Woodcut initials sit in square blocks of foliage. Black dominates, red is for rubrics and shoulder notes, and there is no gold.
- **Why it works.** Kelmscott Chaucer: 87 Burne-Jones illustrations, 14 large borders, 18 frames, and 26 large initial words, all designed by Morris (counts from the colophon as commonly cited, [unverified]). Type and ornament share the same grey value, so the page reads as one woven textile.
- **How to make it procedural.** Match the ornament's mean ink coverage to the text block's measured coverage (render text, compute % black, set ornament density to the same). Acanthus: L-system stems with large lobed leaves that *turn over* (show underside), with white-line engraving (black ground, white stems) or black-line on white. Initials: square tile + letter + foliage fill-to-boundary.
- **Implication for a browser renderer.** The "grey value match" is a measurable rule. Compute text coverage from font metrics × line-height and auto-tune border density. Spread-based layout maps to two-column desktop reading. Borders must be black and sharp, which means SVG or high-DPI canvas.
- **Sources.** UBC Open Collections, Kelmscott Chaucer https://open.library.ubc.ca/collections/specialp/items/1.0366915 (fetched, 200); Morris, "A Note… on his Aims in Founding the Kelmscott Press" (1895) [unverified]; Tschichold, *The Form of the Book* (1975) on the 2:3:4:6 canon [unverified].

### 5.3 Arts & Crafts / Wiener Werkstätte: the grid as ornament
- **Principle.** The Wiener Werkstätte (1903–32; Hoffmann, Moser) used the square grid itself as ornament: chequer bands, black-white squares, compact stylised flowers inside squares, and severe rectangles with tiny bursts of dense pattern. The rule is "the frame is the decoration".
- **Why it works.** WW textile designs (Met 2021.16.31, 1914–20, *not* public domain at the Met) are dense floral motifs locked into a modular repeat.
- **How to make it procedural.** Quantise the generator outputs to a grid. Use square-band borders (alternating cells) and 1:1 tiles with a motif fitted to its cell.
- **Implication for a browser renderer.** CSS Grid is a native fit, with ornament per cell. This is the bridge to modern UI, with the lowest stylistic risk of all the traditions.
- **Sources.** Met 852003 https://www.metmuseum.org/art/collection/search/852003 (fetched via API; `isPublicDomain: false`, so use for reference only).

### 5.4 Art Nouveau: Mucha's halos, Beardsley's line
- **Principle.** **Mucha**: a figure set against a circular halo/mosaic disc with dense ornament, framed by a decorative panel, with hair as ornamental whiplash lines. The outline is a heavy, even contour around flat pastel colour. **Beardsley**: black-and-white only, large flat black masses against white, hairline uniform pen lines, extreme negative space, and dotted lines (stippled contours) at the edges of forms. Japanese influence shows in asymmetry and cropping.
- **Why it works.** Beardsley's *Salome* illustrations (1894) are near-binary images where the decorative interest is in the *ratio* of black mass to white field and in the single unbroken contour.
- **How to make it procedural.** *Whiplash*: curves with monotonically varying curvature (clothoid/Euler spiral segments) joined G2. This is the "S-curve that snaps". *Mucha halo*: concentric bands of polar-repeated motifs behind the subject. *Beardsley*: posterise to 2 levels, run a contour pass with constant-width stroke, replace some contours with dotted lines (arc-length spaced dots, as in §1.3).
- **Implication for a browser renderer.** Clothoid splines need custom code (no native SVG primitive). Fit them, then emit cubic Béziers. The 2-tone Beardsley mode is cheap and works well in dark mode.
- **Sources.** Met 283248 (Evans photograph of Beardsley, not PD); no PD image source for Salome or Mucha fetched ([unverified]). V&A holds Beardsley drawings; V&A API https://api.vam.ac.uk/v2/objects/search?q=marbled%20paper&page_size=1&images_exist=1 (fetched, 200, not in the requested list).

### 5.5 Ernst Haeckel, *Kunstformen der Natur* (1899–1904)
- **Principle.** 100 plates (lithographs by Adolf Giltsch) of radiolaria, medusae and diatoms arranged with *radial and bilateral symmetry*. Each specimen is centred in a cell and the plate is composed as a symmetric constellation around a central specimen. The background is plain or dark, and the line is fine, even and engraved-looking.
- **Why it works.** The plates sit at a meeting point of science and ornament. They directly influenced Art Nouveau (René Binet's 1900 Paris Exposition gate). The symmetry groups are explicit: radiolaria show cyclic C_n and dihedral D_n symmetry, and some show icosahedral symmetry projected.
- **How to make it procedural.** Use symmetry-group generators: a motif in a fundamental domain → apply D_n. Radiolarian lattices via Voronoi on a sphere with bars and spines. Plate composition: one large central specimen at the centre and 4–8 satellites on a mirrored layout.
- **Implication for a browser renderer.** Use for spot illustrations, loaders (a slowly rotating D_n form), and favicons. Fine lines need high-DPI handling.
- **Sources.** Internet Archive https://archive.org/details/KunstformenderN00Haec (fetched, 200; Smithsonian Libraries scan); BHL bibliography 102214 https://www.biodiversitylibrary.org/bibliography/102214 (Cloudflare challenge, [unverified]).

### 5.6 Redouté and botanical plate conventions
- **Principle.** The specimen sits centred on a blank ground with no setting. It is shown life-size where possible, and the plant is arranged to show habit, leaf both sides, flower open and in bud, and sometimes dissections. The Latin name and plate number are in small engraved type at the bottom. Stipple engraving printed *à la poupée* (several colours inked on one plate) and finished by hand gives soft tonal gradation with no hard outline.
- **Why it works.** Redouté's *Les Liliacées*, pl. 131 *Fritillaria imperialis* (Met 2019.282.43, 1802–16) shows the convention of single subject, white field and a caption system.
- **How to make it procedural.** *Stipple*: render tone as dot density (blue-noise dither with dot size varying by tone), with hue per region from a "poupée" palette. The plate layout is centred specimen, bottom caption and plate number in the top right corner.
- **Implication for a browser renderer.** This is the plate grammar for `<figure>` and `<figcaption>`. The stipple shader is a nice alternative to halftone for images.
- **Sources.** Met 828288 https://www.metmuseum.org/art/collection/search/828288 (fetched via API); Met 762064 and 762055 (fetched via API).

### 5.7 William Blake's illuminated books
- **Principle.** Relief etching. Text and image are written in reverse on the copper in acid resist, so text and image are *one* process and one hand. Vines and figures grow from and through the lines of text, and each copy was hand-coloured differently (watercolour over the printed line). The page is a single integrated field where image and text interpenetrate.
- **Why it works.** In *Songs of Innocence*, Title Page and "Introduction" (Met 17.10.3, 17.10.4, printed c. 1825), tendrils wind between stanzas. No two copies are coloured alike, which is the "seed per copy" principle in historical form.
- **How to make it procedural.** Use text-aware growth: compute line boxes, then grow tendrils in the inter-line gaps and margins (space colonisation with the text boxes as obstacles), so vines thread between stanzas. The colour pass is a watercolour wash with a per-render seed.
- **Implication for a browser renderer.** Use the Range API to get per-line rects (`getClientRects()`) and treat them as obstacles. This is the closest historical precedent for "ornament that reads the DOM".
- **Sources.** Met 347889 https://www.metmuseum.org/art/collection/search/347889 and 347901 (fetched via API); William Blake Archive https://www.blakearchive.org/ (connection failed, [unverified]).

### 5.8 Marbled endpapers (European)
- **Principle.** Combed patterns (Dutch, nonpareil, French curl, Spanish wave with diagonal shading) are regular and periodic, unlike Turkish battal. Use them at structural thresholds such as endpapers and covers, never behind text.
- **How to make it procedural.** Same engine as §3.4: drops, then a straight comb with N tines, then a second comb at half pitch (nonpareil), then curl via a rotational stroke.
- **Implication for a browser renderer.** Use for the page `<header>`/`<footer>` or for loading states.
- **Sources.** Wellcome PD marbling search https://api.wellcomecollection.org/catalogue/v2/works?query=marbled%20paper&items.locations.license=pdm&pageSize=2 (fetched, 2026-11-06); Woolnough IIIF https://iiif.wellcomecollection.org/presentation/v2/b29354213 (in fetched payload).

---

## §6 Other traditions (one paragraph each)

**Ethiopian (Ge'ez) manuscripts.** These have colourful *harag* (interlace frames, often red, yellow, blue and green chequer-plaits) around incipits, and bold flat figures with large eyes in a few saturated colours, outlined in black, with no modelling. The rule is *flatness plus strong outline*, and ornament bands are separate horizontal registers. Procedural: chequer-plait bands (§1.1 with a 2-cell lattice) as horizontal section separators. Source: Met 1998.66 *Book of the Gospels*, late 14th–early 15th c. https://www.metmuseum.org/art/collection/search/317618 (fetched via API), Met 2006.100 Double-Sided Gospel Leaf (fetched via API).

**Armenian (T'oros Roslin, Cilicia, fl. 1256–68).** Canon tables are framed as architecture (arches on columns), with birds and vases on top. Headpieces are rectangles crowded with rinceaux in blue, red and gold, and *marginal ornaments* are vertical floral trees in the outer margin marking text sections. These are a "marginal sign" system that a web renderer can use as a side-nav anchor. Source: Walters W.539, T'oros Roslin Gospels 1262, https://art.thewalters.org/object/W.539/ (fetched via curl, title confirmed); Met 38.171.2 *Title Page of the Gospel of John* (Sargis, 1300–10) https://www.metmuseum.org/art/collection/search/449536 and Met 2010.108 (fetched via API).

**Mexican codices (Borgia group, Mixtec).** Screenfold deer-skin with a gesso ground. Figures are flat, in thick even black outline (a "frame line"), with standardised glyph vocabularies. Reading follows red guide lines (boustrophedon in the Mixtec codices), and pages are divided into registers by red bands. Procedural principle: *a guide line that routes the reader*. Use for timelines and step flows. Source: Codex Borgia, Biblioteca Apostolica Vaticana, https://digi.vatlib.it/view/MSS_Borg.mess.1 (fetched, 200); Codex Mendoza, Bodleian Digital https://digital.bodleian.ox.ac.uk/objects/2fea788e-2aa2-4f08-b6d9-648c00486220/ (fetched, 200, object identity not confirmed from the page title, [unverified]).

**Indian Pichhwai (Nathdwara, Rajasthan).** Large cloth hangings behind the Shrinathji image. These are *seasonal* and festival-specific, with registers of cows, lotus ponds and gopis in repeated rows. The border is a dense floral band and the colour field is saturated (indigo night, pink lotus, gold). Principle: *the same frame with content swapped by calendar*, i.e. seasonal theming. Source: Met 2003.177 *Pichhwai for the Festival of Cows* https://www.metmuseum.org/art/collection/search/65576 and Met 2008.359.54 diagram for a Pichhwai (a construction diagram, which is a rare procedural primary source) https://www.metmuseum.org/art/collection/search/74741 (fetched via API).

---

## §7 Open-access sources for building a visual corpus

All probes were run 2026-11-06 from a headless client. **Practical finding:** ARTIC, Gallica, BHL, the Walters API and Getty search returned Cloudflare challenges or 403/404 to headless requests. A corpus builder should prefer bulk dumps (CSV/JSON/OAI) or browser-driven fetching for those, and should identify itself and rate-limit.

| Source | Licence (images / metadata) | API / IIIF | Auth | Example query (status) |
|---|---|---|---|---|
| **Met Open Access** | CC0 for `isPublicDomain: true` objects (verified per object). Bulk: Open Access CSV (named in API error). | REST JSON. **`/v1/search` was retired 2026-10-01**; use `/v1.1/search` (Elastic, `offset`/`limit`). No IIIF; `primaryImage` JPEG URLs. | None | `https://collectionapi.metmuseum.org/public/collection/v1.1/search?q=book%20of%20hours&isPublicDomain=true&hasImages=true&limit=2` → `{"total":7876,…}` (fetched). Object: `/public/collection/v1/objects/470306` (fetched). **Most online docs still show the dead v1 search.** |
| **Rijksmuseum** | Public domain images CC0 per the museum's policy (not found in the object payload fetched, [unverified]) | New Linked Art (JSON-LD) search API at `data.rijksmuseum.nl`; object IDs resolve at `id.rijksmuseum.nl`. IIIF [unverified]. | None (new API) | `https://data.rijksmuseum.nl/search/collection?description=ornament` → 1393 items (fetched); `type=drawing&description=ornament` → 32 (fetched). |
| **Art Institute of Chicago** | CC0 for PD works (published policy, [unverified]) | REST + IIIF Image API (`https://www.artic.edu/iiif/2/{image_id}/full/843,/0/default.jpg`) [unverified] | None [unverified] | `https://api.artic.edu/api/v1/artworks/search?q=illuminated&fields=id,title,image_id,is_public_domain` → 403 Cloudflare challenge ([unverified]). Data dumps on GitHub per AIC docs [unverified]. |
| **Smithsonian Open Access** | CC0 (`metadata_usage.access: "CC0"` in the payload, verified) | REST JSON (EDAN). IIIF via ids.si.edu [unverified]. | api.data.gov key (`DEMO_KEY` works for low volume) | `https://api.si.edu/openaccess/api/v1.0/search?q=ornament&api_key=DEMO_KEY` (fetched, 200). Includes Freer\|Sackler: Sōtatsu F1906.231-232 CC0 (fetched). |
| **Cooper Hewitt** | CC0 (in SI payload) | **Own API is gone**: `collection.cooperhewitt.org/api/` 301 → si.edu; `api.cooperhewitt.org/rest/` 404 (both fetched). Use the SI Open Access API with `unit_code:CHNDM`. | api.data.gov key | `https://api.si.edu/openaccess/api/v1.0/search?q=unit_code:CHNDM+AND+wallpaper&rows=1&api_key=DEMO_KEY` → "Design for Textile or Wallpaper", chndm_1992-149-1 (fetched). |
| **BnF Gallica** | Free non-commercial reuse; commercial reuse needs a licence (Gallica *conditions d'utilisation*, [unverified]). Partner-library items vary. | IIIF Image + Presentation 2: `https://gallica.bnf.fr/iiif/ark:/12148/{ark}/manifest.json`; SRU search API [unverified] | None | `https://gallica.bnf.fr/iiif/ark:/12148/btv1b8455783h/manifest.json` → 403 Cloudflare ([unverified]). |
| **British Library** | Web text CC-BY (footer, verified). PD manuscript images previously "public domain" on Digitised Manuscripts [unverified]. | IIIF (`iiif.bl.uk`, `bl.digirati.io`) → 403 after the 2023 cyber-attack. bl.uk states "only a limited amount of digital content is currently available" (fetched). | — | `https://iiif.bl.uk/uv/` viewer HTML loads (200), but the manifest `https://bl.digirati.io/iiif/ark:/81055/vdc_100022589158.0x000002` → 403 ([unverified]). Treat BL as unreliable for automated harvesting today. |
| **Biodiversity Heritage Library** | PD works with no added restrictions per BHL policy; many images also on Flickr [unverified] | API v3 (JSON); IIIF manifests `https://www.biodiversitylibrary.org/iiif/item/{id}/manifest` [unverified] | **API key required** (verified: 401 "invalid or unauthorized API key") | `https://www.biodiversitylibrary.org/api3?op=PublicationSearch&searchterm=haeckel&format=json&apikey=KEY` (401 without key, fetched). Mirror via Internet Archive. |
| **Wellcome Collection** | Per-item licence in `items.locations.license` (PDM, CC-BY, …, verified); site content CC-BY 4.0 | Catalogue API v2 + IIIF Presentation/Image | None | `https://api.wellcomecollection.org/catalogue/v2/works?query=marbled%20paper&items.locations.license=pdm&pageSize=2` → 175 results (fetched); Woolnough marbling IIIF `https://iiif.wellcomecollection.org/presentation/v2/b29354213` (in payload). |
| **Getty** | Open Content images CC0 (Getty news, [unverified fetch]) | Linked Art APIs at `data.getty.edu/museum/collection/`; docs page exists (200). No working search path found (`/object/search` → 404). | None [unverified] | `https://data.getty.edu/museum/collection/docs/` (fetched, 200). Search endpoint [unverified]. |
| **Walters Art Museum** | **Conflict:** OpenGLAM 2015 announces CC0 for images + metadata; `thedigitalwalters.org` manuscript pages still carry `DC.Rights` CC BY-NC-SA 3.0 (fetched). Check per object. | Old `api.thewalters.org` → 404/403 (fetched). Manuscript TEI + images on OPenn (`openn.library.upenn.edu/html/0054.html`) [unverified fetch]. No IIIF confirmed. | — | `https://art.thewalters.org/object/W.539/` (fetched, 200); `https://www.thedigitalwalters.org/Data/WaltersManuscripts/html/W539/` (fetched, 200). |
| **e-codices** | Per holding library: PDM or CC BY-NC 3.0 (terms page, fetched) | IIIF Presentation 2 manifests | None | `https://www.e-codices.unifr.ch/metadata/iiif/csg-0051/manifest.json` (fetched, 200). Pattern: `/metadata/iiif/{lib}-{ms}/manifest.json`. |
| **Internet Archive** | Per item (many PD scans; no blanket licence) | `advancedsearch.php` JSON + IIIF Presentation 3 | None | `https://archive.org/advancedsearch.php?q=title%3A%28grammar+of+ornament%29&fl%5B%5D=identifier&rows=3&output=json` (fetched); `https://iiif.archive.org/iiif/3/grammarornament00Jone/manifest.json` (fetched). |
| **Public Domain Review** | Labels the work (PD Worldwide / PD 70) separately from the digital copy (No Additional Rights / Attribution / Non-commercial); "guideline only" | **No API** (fetched rights page) | — | Curated discovery only; follow links back to source institutions. |
| **Library of Congress** | Varies; many "No known restrictions" [unverified] | loc.gov JSON API (`fo=json` on any page: `/search/`, `/item/{id}/`, `/collections/{slug}/`); IIIF image service [unverified] | None (rate-limited; deep paging stops at 100,000) | `https://www.loc.gov/search/?q=baseball&fo=json` (pattern from docs, fetched); live request `…?q=book+of+hours&fo=json` failed to connect from this host ([unverified]). |

Bonus, not requested: **V&A API v2** `https://api.vam.ac.uk/v2/objects/search?q=…&images_exist=1` (fetched, 200), which is strong for Beardsley, Morris and Owen Jones.

**Corpus priorities for illum.** (1) Met v1.1 + SI CC0 for clean licensing. (2) e-codices and Internet Archive IIIF for full manuscripts and books (Jones, Haeckel, Woolnough). (3) Wellcome PDM for marbling and decorated papers. Treat Gallica, BL, TCD and Walters as reference-only until their licences and access are re-verified.
