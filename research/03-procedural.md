# 03 · Procedural, intentionally

How illum generates ornament, growth and pattern so it reads as *made by someone* rather than *filled by something*. Part A is a field guide to algorithms; Parts B–C (fitting, then craft) matter more.

**Source legend.** "fetched 2026-11-06" means the page or PDF was retrieved and read for this note. "[unverified]" means the claim comes from a search snippet, a secondary source, or prior knowledge and should be checked before it goes into public copy. Blocked sources (403 or JS walls) are marked.

**Local evidence.** Two working systems in `refs/` already embody most of the principles below and are cited by path:
- `refs/florilegium/florilegium-grow.lua`: a Wong–Zongker–Salesin-style greedy growth loop for page margins (real parameter values below).
- `refs/florilegium/florilegium-species.lua`: a plant "genome" whose trait distributions make botany's hard rules hold by construction.
- `refs/initialis/src/breed.js`: a breeding field of decorated initials with distance-scaled mutation, restraint rules, legibility repair and a library of human-kept outputs.

---

## Part A · Algorithms

Every entry follows the same shape: **Principle → Why it works → How (algorithm, parameters, failure modes) → Browser implication (where on the page, cost) → Sources.**

### A1 · Growth

#### Wong, Zongker & Salesin, "Computer-Generated Floral Ornament" (SIGGRAPH 1998)
- **Principle.** Ornament is *grown into the free space of a given region*, not stamped. The region is the brief.
- **Why it works.** Traditional floral ornament obeys a small set of principles the paper names, chiefly repetition, balance and conformation to geometric constraints [unverified: from memory and secondary citations]. Growth guarantees the last of these for free: every element exists because there was room for it and a stem that could reach it, so the design visibly *belongs* to its rectangle, initial or frame. The paper's term "adaptive clip art" is the key idea for illum: one ornament definition, many containers.
- **How.** Seed one or more stems; repeatedly find the largest empty region still reachable from an existing stem; choose a motif (flower, leaf, spiral) that fits it; grow a connecting branch; mark the area occupied; stop when the remaining holes fall below a size floor; then fill small holes with small elements. `florilegium-grow.lua` is a working derivative: candidate grid `GRID = 0.2` cm; a motif must lie within `REACH = 3.0` cm of a stem; the branch loop stops when the largest free disc falls below `SMALLEST = 0.36` cm and the filler below `FILLMIN = 0.17` cm. Branches leave the parent *along the parent's direction* and arrive *along the motif's axis*, "so every flower can be traced back to the root", and branches become stems for later branches. Proxies (discs) may overlap slightly so leaves tuck under flowers. **Parameters:** reach, size floor, motif library and its size ladder, overlap tolerance, root position. **Failure modes:** uniform motif sizes (reads as packing, not growth); branches that kink at junctions (the tangent rules above fix this); filler that is the same density as the hero zone; untraceable floating motifs.
- **Browser.** Margins, header bands, around drop caps, card frames. Free space comes from a coarse occupancy grid or an SDF of the content box (see B1). Run once per layout breakpoint, cache the SVG, and re-grow only when a `ResizeObserver` reports a meaningful size change. Growth order doubles as an animation timeline (florilegium's `GROWSTEP`, `BLOOM`).
- **Sources.** DOI 10.1145/280814.280948 (paper not retrieved; is.muni.cz copy behind JS challenge, grail.cs.washington.edu 403) [unverified]. `refs/florilegium/florilegium-grow.lua` lines 1–60, 1400–1520 (read 2026-11-06). Related follow-up: Xu & Mould, "Magnetic Curves" (2009), for curvature-controlled spirals [unverified].

#### L-systems and *The Algorithmic Beauty of Plants* (Prusinkiewicz & Lindenmayer 1990)
- **Principle.** A plant is a rewriting rule run in parallel, interpreted by a turtle.
- **Why it works.** Self-similarity across scales is what makes a plant read as a plant; a grammar enforces it exactly while bracketed branching (`[`, `]`) gives the topology.
- **How.** Axiom + productions (e.g. `X → F[+X][-X]FX`, `F → FF`), iterate *n* times, then interpret: `F` draw forward, `+/-` turn by δ, `[` push, `]` pop. **Parameters:** iterations, branch angle δ, length decay per generation, stochastic rule weights, tropism vector. **Failure modes:** too-perfect symmetry ("fractal clip art"), exponential string growth, overlaps because L-systems are blind to space (they do not know about the content box), the "every plant is a fern" look.
- **Browser.** Small botanical spot illustrations, fleurons, tailpieces. Generate the string in a Worker, cap n at 5–6, emit an SVG path. For anything that must fit a region, prefer space colonization or Wong growth and use L-system rules only for the *local* organ (a leaf whorl, a frond).
- **Sources.** algorithmicbotany.org/papers/ index, which lists ABOP full PDF `abop/abop.pdf` (fetched 2026-11-06).

#### Phyllotaxis (Vogel 1979)
- **Principle.** The golden angle packs organs without ever aligning them.
- **Why it works.** The 137.5° spiral and its Fibonacci parastichies read as "alive" instantly.
- **How.** Point *n* at angle θ = n·137.508°, radius r = c·√n; scale each organ by n for a disc floret to ray floret transition. **Parameters:** c (spacing), divergence angle (deviations of ±0.5° break the spiral into visible spokes, a useful deliberate defect), organ size ramp. **Failure modes:** perfect discs everywhere look like a logo; the spiral needs organ shapes, not dots.
- **Browser.** Rosettes, medallions, flower heads inside larger growth, bullets and dingbats. Trivial cost, fine in SVG.
- **Sources.** florilegium README credits Vogel (Mathematical Biosciences 1979) for heads and daisy discs (read 2026-11-06). algorithmicbotany.org phyllotaxis papers listed (fetched 2026-11-06), including "A Collision-based Model of Spiral Phyllotaxis" (1992).

#### Space colonization (Runions et al. 2005 venation; Runions, Lane & Prusinkiewicz 2007 trees)
- **Principle.** Branches grow toward unclaimed space; the space *is* the design.
- **Why it works.** The form is an emergent property of the envelope, so a tree grown in a narrow cylinder has a clear trunk, a wide one ramifies; hedge plants compete; obstacles carve the crown. 
- **How.** Scatter N attraction points in an envelope. Each iteration, each point influences its nearest node if within radius of influence dᵢ; each influenced node v grows a new node at v + D·n̂ where n̂ is the normalized sum of unit vectors to its points (optionally biased by a tropism vector g). Points within kill distance d_k of any node are removed. Repeat until no points remain or no growth happens. **Parameters (from the paper's figures):** N (12000 vs 375), d_k (2D vs 20D: larger d_k gives sparser crowns and smoother branches), dᵢ (∞ vs 8D/17D: smaller dᵢ makes tips meander, "wiggly or gnarly"), envelope shape, point density (denser near the envelope gives denser surface twigs). Obstacles: delete points beyond collision surfaces. **Failure modes:** uniform point density gives uniform, characterless branching; too few points give erratic, jerky directions; it needs a pipe-model width pass or it looks like wire.
- **Browser.** Margin vines, a tree in a hero, venation inside leaf motifs, roots under footers. The DOM gives the envelope: sample points in the margin band and *not* inside text boxes; text becomes an obstacle for free. Grid-hash nearest-node lookups; a few thousand points runs in milliseconds in a Worker.
- **Sources.** algorithmicbotany.org/papers/colonization.egwnp2007.html and full PDF (fetched 2026-11-06); algorithmicbotany.org/papers/venation.sig2005.html (fetched 2026-11-06).

#### Differential growth
- **Principle.** A line that grows longer inside a fixed space must fold; the folding is the beauty.
- **Why it works.** It reproduces brain coral, lettuce leaf margins and gut folds, which are surface-area-in-limited-space solutions the eye recognises as organic. Nervous System's Floraform applies it to surfaces.
- **How.** A polyline of nodes. Each step: neighbours attract (spring to rest length), all nodes within radius R repel, edges longer than a split length get a new midpoint, and new nodes are inserted preferentially where curvature is high (inconvergent's description: insertion favours where the curve turns tightly; the line never self-intersects). **Parameters:** repulsion radius, attraction strength, split length, insertion rule, step count, boundary. **Failure modes:** unbounded growth fills everything to uniform grey; jitter without damping; O(n²) repulsion without a spatial hash.
- **Browser.** Torn or lace edges, section dividers that meander, a single hero line that wraps a heading. Canvas or SVG polyline; spatial hash essential; stop at a node budget, not a time.
- **Sources.** github.com/inconvergent/differential-line README (fetched 2026-11-06). inconvergent.net project page and n-e-r-v-o-u-s.com Floraform page returned 403 [unverified].

#### Diffusion-limited aggregation (Witten & Sander 1981)
- **Why it works.** Frost, mineral dendrites and lichen are DLA in nature, so the eye accepts it as a physical record of a process rather than a drawing.
- **Principle.** Random walkers that stick where they touch build frost, lichen and lightning.
- **How.** Seed a particle; release walkers one at a time; each walks randomly until it touches the cluster and sticks. Fractal dimension ≈ 1.71 in 2D off-lattice. **Parameters:** sticking probability (lower gives denser, bushier clusters [unverified]), seed shape (a line seed gives frost on a window edge), walker bias (drift). **Failure modes:** slow without spawning walkers near the cluster's bounding radius; results all look the same at a glance (low perceptual variety); hard to direct.
- **Browser.** Frost, crackle and crystalline grounds, the "rime" style in initialis. Precompute offline or grow small in a Worker; render to canvas.
- **Sources.** en.wikipedia.org/wiki/Diffusion-limited_aggregation (fetched 2026-11-06).

#### Reaction–diffusion (Gray–Scott)
- **Principle.** Two chemicals, one feeding the other, produce spots, stripes and mazes from a tiny parameter change.
- **How.** Grid of A and B; each step A += (D_A∇²A − AB² + f(1−A))Δt, B += (D_B∇²B + AB² − (k+f)B)Δt. Karl Sims's values: D_A = 1.0, D_B = 0.5, f = 0.055, k = 0.062, Δt = 1; Laplacian is a 3×3 kernel (centre −1, edge 0.2, diagonal 0.05). Mitosis f = 0.0367, k = 0.0649; coral f = 0.0545, k = 0.062. **Spatial control:** a style map varying f/k across the image, anisotropic diffusion for orientation, flow advection, speed versus diffusion for scale. **Failure modes:** only a crescent of the (f, k) map (k ≈ 0.045–0.07, f ≈ 0.01–0.1) is interesting; outside it everything goes solid A or B. Concave borders thin and die. Needs thousands of iterations.
- **Browser.** Backgrounds, endpapers, letter fills, maze-like borders. WebGL ping-pong framebuffers; or run once and threshold into an SVG via marching squares so it prints as crisp ink rather than a blurred texture.
- **Sources.** karlsims.com/rd.html (fetched 2026-11-06).

### A2 · Fields and sampling

#### Flow fields (Tyler Hobbs)
- **Principle.** A field of angles gives many lines one shared intention.
- **Why it works.** Lines that never cross and all obey one current read as weather, hair, water, wood grain: a single idea with infinite surface variety.
- **How.** A grid of angles extending well beyond the frame (so curves can turn back in); resolution about 0.5% of image width; angles from noise "about 90% of the time". Draw by stepping `step_length` (0.1–0.5% of width) along the local angle for `num_steps`. **Parameters:** starting-point distribution (regular grid "overly stiff"; uniform random gives "clumps and some sparse areas"; circle packing balances), curve length (short reads as fur, long reads as leading lines), quantising angles (multiples of π/10 give "sculpted, rocky forms"), minimum separation (stop a curve when too close to another), obstacles that deflect the field. **Colour:** short curves when colours vary widely; long curves only with close colours. **Failure modes:** plain Perlin ("Don't just use Perlin noise and call it a day"), uneven density, jagged tight turns, curves vanishing when grid bounds are too tight.
- **Browser.** Engraved hatching in grounds, hair/water in illustrations, a background current that bends around the content column (obstacles = DOM boxes). Canvas for thousands of lines; SVG if under ~2k paths.
- **Sources.** tylerxhobbs.com/words/flow-fields (fetched 2026-11-06); tylerxhobbs.com/words/fidenza (fetched 2026-11-06).

#### Poisson-disk and blue noise (Bridson 2007)
- **Why it works.** A hand scattering seeds or stipples avoids both clumps and grids; blue noise has that spectrum, so it reads as placed rather than computed.
- **Principle.** "Random but never clumped" is how a hand scatters.
- **How.** Background grid with cell size r/√n (one sample per cell); seed one sample, active list; pick an active sample, try k candidates (typically k = 30) in the annulus r to 2r, accept the first at least r from all neighbours (grid lookup), otherwise retire the active sample. O(N). Variable r driven by an image or SDF gives density gradients. **Failure modes:** perfectly even spacing reads mechanical; fix with variable radius or small jitter. Edge rows look different unless the domain is padded.
- **Browser.** Placement of everything: stars in a ground, florets, stipple, start points for flow lines, filler motifs. Cheap enough to run on the main thread for a few thousand points.
- **Sources.** Bridson, "Fast Poisson Disk Sampling in Arbitrary Dimensions", cs.ubc.ca/~rbridson/docs/bridson-siggraph07-poissondisk.pdf (fetched 2026-11-06).

#### Circle packing
- **Why it works.** Discs that touch but never overlap read as organs competing for room, the logic of pebbles, cells and flower heads.
- **Principle.** Non-overlapping discs of a power-law size range give hierarchy for free.
- **How.** Greedy: propose a centre (random or Poisson), compute the largest radius that fits against existing circles and the boundary (via SDF), accept if above a minimum; draw sizes so that few are large. Hoff's Hyphae grows circles "next to each other" without overlap to mimic roots [unverified]. **Failure modes:** every gap filled to the same minimum size gives froth; uniform radii read as bubbles.
- **Browser.** Layout of motifs within a region (the proxy discs of Wong growth are this), cluster arrangements, bokeh-free "specimen" plates. The largest-empty-disc query is the same SDF query used for fitting.
- **Sources.** Hobbs flow-fields essay recommends circle packing for start points (fetched 2026-11-06); Hyphae description via search snippet [unverified].

#### Voronoi and Lloyd relaxation
- **Why it works.** Cracks, scales, cells and giraffe patches are all nearest-site partitions, and stipple engravers spaced dots by tone exactly as weighted Lloyd does.
- **Principle.** Cells around sites make cracks, scales, cobbles and stipples; relaxing the sites makes them even.
- **How.** Compute the Voronoi diagram (Fortune or via Delaunay, e.g. d3-delaunay); Lloyd: move each site to its cell centroid, repeat 2–10 times. Weighted centroids give stippling that follows tone: Secord sets density ρ = 1 − image brightness, so dark regions "attract" more points, and stops when the change in the standard deviation of cell areas falls below 1e-4 (5,000–20,000 stipples per image). **Failure modes:** full relaxation converges to a hexagon honeycomb, which is dead; stop early. Raw Voronoi of uniform points has slivers.
- **Browser.** Crackle glaze, mosaic and tessera grounds (initialis has `ice`, `mosaic`, `cells`), stipple portraits of plates. Note initialis's warning: Voronoi cells at spacing 2 take "over two minutes", so it caps texture spacing (`FINEST.cells = 10`).
- **Sources.** Secord, "Weighted Voronoi Stippling", cs.ubc.ca/labs/imager/tr/2002/secord2002b/ (PDF fetched 2026-11-06). `refs/initialis/src/breed.js` `FINEST` (read 2026-11-06).

### A3 · Tiling, symmetry and grammar

#### Truchet tiles (Truchet 1704; Smith 1987; Carlson 2018)
- **Why it works.** Connection is the craft cue: every arc continues into its neighbour, so even a random field reads as one continuous drawn line.
- **Principle.** A single tile, randomly rotated, makes connected labyrinths: maximal pattern from minimal vocabulary.
- **How.** Grid; each cell picks one of two orientations of quarter-circle arcs joining edge midpoints (Smith) or a diagonal split (Truchet; the "10 PRINT" one-liner). Carlson's multi-scale Truchet subdivides cells into quarters recursively using "winged" tiles so scales nest seamlessly. **Parameters:** orientation probability (a bias produces directional drift), subdivision probability by region (put fine scale where attention should go), colouring of the two regions it creates. **Failure modes:** unbiased random everywhere is the definition of filler; it needs a density map or a motif to carry.
- **Browser.** Backgrounds, rule textures, letter fills. CSS or SVG `<pattern>`; trivial cost.
- **Sources.** en.wikipedia.org/wiki/Truchet_tiles (fetched 2026-11-06); Carlson, "Multi-Scale Truchet Patterns", archive.bridgesmathart.org/2018/bridges2018-39.html (search result only) [unverified].

#### Wave Function Collapse (Gumin 2016)
- **Why it works.** Traditional tile and quilt work is local rules plus a repertoire of approved neighbours, which is exactly what WFC encodes.
- **Principle.** Local adjacency rules learned from a sample generate globally coherent pattern.
- **How.** Each cell holds the set of still-possible patterns; repeatedly collapse the lowest-entropy cell to one pattern (weighted by sample frequency), then propagate constraints; stop when all collapsed or a contradiction occurs. Overlapping model learns N×N patterns (N = 3 typical) from a bitmap; tiled model uses explicit tile adjacency and dihedral symmetry classes. **Failure modes:** contradictions (no backtracking in the reference; DeBroglie adds it); "easy" tilesets where nothing is ever blocked produce structureless output because correlations fade with distance; output can look like its sample shredded and re-stitched.
- **Browser.** Panelled borders, quilt or lattice grounds, a band that must start and end on specified tiles (pre-collapse the ends and corners). Small grids are fast; seed the contradiction retry from the main seed so results stay reproducible.
- **Sources.** github.com/mxgmn/WaveFunctionCollapse (fetched 2026-11-06).

#### Shape grammars (Stiny & Gips 1972)
- **Why it works.** Architectural and lattice traditions were taught as rules of division and replacement, so grammar output inherits their proportions.
- **Principle.** Design as rules over shapes, applied to the shape so far.
- **How.** Rules LHS → RHS with markers locating the replacement; a start shape; match, pick, apply; terminate. Stiny's ice-ray grammar for Chinese lattice windows recursively splits a polygon with a straight line into smaller polygons (triangles, quads, pentagons) [unverified: Stiny 1977]. Mitchell's Palladian villa grammar has 69 rules in eight stages. **Failure modes:** rule explosion; subshape matching is hard to implement generally, so practical systems use set grammars or split grammars.
- **Browser.** Lattice screens, architectural panels, fretwork. The ice-ray is the best value: a recursive polygon split of any DOM rectangle, exactly fitted by construction.
- **Sources.** en.wikipedia.org/wiki/Shape_grammar (fetched 2026-11-06).

#### Islamic star patterns: Hankin's polygons-in-contact (Kaplan 2005)
- **Principle.** Choose a tiling, choose one angle; the pattern follows inevitably.
- **Why it works.** Kaplan's pairing goal is "minimizing the sum of the lengths of all of the line segments in the motif", which "reflects the sense of economy and inevitability in Islamic design". The design space is tiny (tiling × contact angle θ × optional split δ) yet every point in it is traditional.
- **How.** Take a polygon tiling. At each edge midpoint grow two rays into each adjacent tile, each at contact angle θ to the edge (half an X). Within each tile, pair the 2n rays greedily by shortest combined path, extending each pair to its intersection. Optional δ splits each contact point into two (two-point patterns). θ = 45° is typical; Kaplan's figures use 22.5°–75°. **Parquet deformation:** vary θ continuously across space (22.5° at the sides to 67.5° in the middle) and the star pattern morphs along a band. Then decorate: interlace over/under, offset to straps, fill regions. **Failure modes:** on irregular tiles the greedy pairing can leave unmatched rays or paths that wander outside the tile; fix by moving contact points off midpoints.
- **Browser.** Section grounds, footer bands, hero lattices, the parquet deformation as a horizontal rule that changes as you scroll. SVG lines with a stroke-offset strap.
- **Sources.** Kaplan, "Islamic Star Patterns from Polygons in Contact", GI 2005, cs.uwaterloo.ca/~csk/publications/Papers/kaplan_2005.pdf (fetched 2026-11-06). Kaplan, "Generative Zellij", isohedral.ca/generative-zellij/ (fetched 2026-11-06).

#### Celtic knotwork (Cromwell; Mercat; Kaplan & Cohen 2003)
- **Principle.** An over-under thread that alternates perfectly, broken only where the designer says.
- **How.** Start from a plait (a square grid of crossings). Mercat's approach places crossings at edge midpoints of an underlying graph and introduces "breaks" (barriers) along graph edges that turn threads back instead of crossing. Every crossing diagram derived from a planar 4-valent graph can be made alternating, so walk each thread and alternate over/under. Kaplan & Cohen add better thread smoothing and orientation, weaving images into knotwork and encapsulating knot patterns as reusable units. Cromwell treats knots as replacements of crossings in basic plaitwork [unverified]. **Parameters:** grid size, break placement (the actual design act), thread width, gap at under-crossings, corner treatment. **Failure modes:** random breaks yield many short closed loops (count components and prefer one or two threads); kinked corners; mismatched widths at crossings.
- **Browser.** Initials and their frames (knot grid fitted to the cell layout of the letter, breaks along the glyph boundary), corner pieces, rules. SVG paths with a background-coloured halo stroke to make the "under" gaps.
- **Sources.** Kaplan & Cohen, "Computer Generated Celtic Design", EGWR 2003, DOI 10.2312/EGWR/EGWR03/009-019 (diglib page 403; abstract via search) [unverified]; Gross & Tucker, "A Celtic Framework for Knots and Links" (2011) [unverified].

#### Meanders and Greek key
- **Why it works.** A single unbroken line demonstrates control; any break or clipped unit is instantly visible, which is why the form signals craft.
- **Principle.** A single unbroken path on a grid that turns at right angles in a fixed rhythm.
- **How.** Define one unit as a lattice path in a k×k cell (a turtle program: forward 3, left, forward 2, left, ...), translate along the band; corners need a dedicated unit (rotate the unit by 90° and pad). Frieze group choice (A3.8) decides whether units mirror. **Failure modes:** fractional units at band ends; corners improvised by clipping. Always compute the number of units that fit and stretch the gaps, or choose a band length from the unit.
- **Browser.** Rules (`<hr>`), table borders, footers, pottery-style bands. CSS `border-image` can carry a fixed unit; JS needed to fit an integer count to an arbitrary width.
- **Sources.** Frieze group page (below) [construction from general practice, unverified].

#### Guilloché and spirograph
- **Why it works.** Machine-engraved precision at a density no hand can match is itself the value signal (watch dials, Fabergé, banknotes).
- **Principle.** Phase-shifted rolling-circle curves layered by the dozen, the anti-forgery and watch-dial look.
- **How.** Hypotrochoid x = (R−r)cos t + d·cos((R−r)t/r), y = (R−r)sin t − d·sin((R−r)t/r); repeat with a phase offset and slightly varied d, 20–100 times; or modulate a base curve (circle, line, rectangle offset) with a sine whose phase rotates per copy (the rose-engine idea). **Failure modes:** moiré at screen resolution (keep stroke spacing above ~2 device px); too many layers turn grey.
- **Browser.** Certificate frames, "issued" badges, banknote hero backgrounds, pricing tiers. SVG, very cheap.
- **Sources.** en.wikipedia.org/wiki/Guilloché (fetched 2026-11-06).

#### Frieze (7) and wallpaper (17) groups
- **Why it works.** Every historic band and ground uses one of these groups; choosing the group deliberately is how a pattern looks designed rather than tiled.
- **Principle.** Choose the symmetry before the motif; then decide where to break it.
- **How.** Frieze groups: p1 (hop, translation), p1m1 (sidle, vertical mirrors), p11m (jump, horizontal mirror), p11g (step, glide), p2 (spinning hop, 180° rotation), p2mg (spinning sidle), p2mm (spinning jump). Wallpaper groups extend this to 17 2D lattices (p4m for Islamic squares, p6m for hexagonal stars). Generate one fundamental domain and apply the group. **When to break symmetry:** bilaterally symmetric frames with asymmetric content inside (manuscript practice: symmetric border, a drollery in one corner); break at the hierarchy peak only, never uniformly.
- **Browser.** A frieze is the natural unit for rules and borders; the 7 groups are a complete menu for a "band" generator. Use `<use>` with transforms in SVG.
- **Sources.** en.wikipedia.org/wiki/Frieze_group (fetched 2026-11-06).

### A4 · Signals as line

#### Fourier epicycles
- **Why it works.** Truncation keeps the gesture and drops the tremor, which is what a calligrapher's practised flourish does.
- **How.** Sample a closed path (a signature, a glyph outline), take its DFT as complex numbers, sort coefficients by magnitude, redraw with the first N terms. Low N rounds the path into a calligraphic flourish; animating the chain of circles shows the drawing. **Failure modes:** gimmick if the epicycles are shown for their own sake.
- **Browser.** Monograms, signatures, the stylised flourish (cadel) under a title. Trivial cost; SVG path from N terms.
- **Sources.** [unverified: standard technique].

#### Strange attractors as line (Clifford)
- **Why it works.** Density accumulated over millions of passes behaves like layered ink or silk thread, giving tonal depth from one equation.
- **How.** xₙ₊₁ = sin(a·yₙ) + c·cos(a·xₙ), yₙ₊₁ = sin(b·xₙ) + d·cos(b·yₙ); e.g. (−1.4, 1.6, 1.0, 0.7). Do not draw points directly: accumulate a density histogram over millions of iterations, then tone-map (log) and colour-map in a separate step. **Failure modes:** many (a, b, c, d) collapse to a few points or a cycle [unverified]; pre-screen by histogram coverage.
- **Browser.** Silk-like grounds, endpaper textures, a "watermark" behind a heading. WebGL or a Worker with a Float32 histogram, rendered once.
- **Sources.** paulbourke.net/fractals/clifford/ (fetched 2026-11-06).

### A5 · Genome and trait sampling

#### Species from a genome (florilegium)
- **Principle.** Sample *coherent individuals*, not independent parameters.
- **Why it works.** Independent parameters produce chimeras (a five-petalled orchid). Ordering the draws (body plan → pollination syndrome → flower → cluster → leaf → stem → fruit) and conditioning each on earlier traits makes "the hard rules of botany hold by construction": a lily has parts in threes; colour depends on syndrome (bee: blue 6, violet 3, white 3, yellow 2; bird: red 5, orange 3, pink 1).
- **How.** `florilegium-species.lua` defines tiny distribution constructors: `W(v1,w1,…)` weighted choice, `I(a,b)` integer, `R(a,b)` real, `C(v)` constant, `BY(trait, map)` conditional on an earlier trait. A fixed `TRAITS` order is drawn every time, so a seed always yields the same species. Invariants are asserted afterwards: `merovar == 0 or symmetry == "radial"` (only radial flowers vary their petal count, after Damerval & Nadot 2007), "one spur on a radial flower" is rejected.
- **Browser.** A site gets a *flora*: a pool of eight species from a site seed, of which a page uses four (hero, second, monocot, spray). Seeds per page from a hash of the URL; the genome is a JSON-able object so it can be shown, edited and bred.
- **Sources.** `refs/florilegium/florilegium-species.lua` lines 1–80, 460–490; `florilegium-grow.lua` header (read 2026-11-06).

---

## Part B · Ornament fitting: frames that know their content

Ornament is *about* what it surrounds: every generator takes its container as input, not a canvas size.

#### B1 · Medial axis and signed distance fields
- **Principle.** Fit ornament to a shape by asking two questions everywhere: how far am I from the edge (SDF), and where is the spine (medial axis)?
- **Why it works.** Engravers hatch along form, illuminators run vines along a margin's spine, calligraphers flourish into the largest open counters: all SDF/medial-axis queries. initialis's `contour` and `engrave` fills are this idea at letter scale.
- **How.** Rasterise the shape (text via canvas `fillText`, or DOM box rectangles) into a mask; run an exact Euclidean distance transform (Felzenszwalb & Huttenlocher 2012, linear time [unverified]) inside and outside to get the SDF. Uses: iso-lines of the SDF = offset rules and contour hatching; the SDF value at a point = the largest disc that fits there (Wong's "largest free disc", circle packing); ridges of the SDF = medial axis = where a stem should run; the SDF gradient = a flow field that wraps around text. **Failure modes:** raster resolution aliasing at small sizes (use 2× and smooth); medial axis branches are noisy (prune by the radius of the branch's tip disc).
- **Browser.** Compute at about 1/4 CSS resolution in a Worker on `OffscreenCanvas`; recompute on `ResizeObserver` and on `document.fonts.ready`. One SDF per decorated region feeds every algorithm in Part A.
- **Sources.** initialis pattern names (`contour`, `engrave`) in `refs/initialis/src/breed.js` (read 2026-11-06); EDT reference [unverified].

#### B2 · Text-aware layout: CSS `shape-outside` and Pretext
- **Principle.** Let the text yield to the ornament, not only the ornament to the text.
- **Why it works.** In manuscripts text and illumination negotiate (lines shorten around a historiated initial); on the web it is usually one-way.
- **How.** `shape-outside` makes inline content wrap around a non-rectangular float: `circle()`, `ellipse()`, `inset()`, `polygon()`, a shape box, or an image whose alpha channel (thresholded by `shape-image-threshold`, padded by `shape-margin`) defines the area. It applies to floats only, and images need CORS. Baseline widely available since January 2020. So: generate the ornament, export its silhouette as a polygon or an alpha PNG, float it, and the text wraps it. For full control, Pretext (chenglou) measures and lays out text without DOM reflow: `prepare()` then `layout()` for height; `layoutNextLine()` and `layoutNextLineRange()` let *each line have its own width*, which enables text flowing beside arbitrary shapes, rendered to DOM, Canvas or SVG. Limits: common white-space and word-break modes only, no bidi, fonts must be loaded first, px font sizes, no `font-feature-settings`.
- **Browser.** Drop caps with grown ornament that the paragraph wraps around (`shape-outside: polygon()` from the ornament hull); a vine entering the column with per-line widths from Pretext; a figure whose engraved frame shapes the caption.
- **Sources.** developer.mozilla.org/en-US/docs/Web/CSS/shape-outside (fetched 2026-11-06); github.com/chenglou/pretext (fetched 2026-11-06).

#### B3 · Fitting to arbitrary DOM boxes: corners, rules, initials
- **Principle.** Decompose every frame into corners, edges and an optional centre, and solve the *edges* to fit, never the corners.
- **Why it works.** Historic frames are fixed corner blocks plus repeatable edges: corners carry the design, edges are rhythm. The eye forgives an edge with 11 units instead of 12, never a clipped corner.
- **How.**
  1. Corners: generate at a fixed size relative to the box's short side (clamped), possibly with a frieze-group mirror between the four.
  2. Edges: choose the unit count n = round(L / u), then rescale the unit to L/n (allow ±8%); or grow edges with Wong/space colonization from the corners inward so they meet in the middle (a natural centre ornament where they meet hides the join, the "cartouche" solution).
  3. Rules: a frieze band with integer units, terminated by end caps.
  4. Initials: the letter's SDF is the obstacle, its bounding square is the frame, and the frame's corners are where growth roots.
  5. Responsive: below a size threshold change *kind*, not just scale (a full border becomes corner pieces, corners become a single rule).
- **Failure modes:** stretched units; ornament denser on small screens than large (keep density in absolute px, change count); frames that ignore the box's content type (a code block and a quotation should not get the same frame).
- **Browser.** A `<illum-frame>` custom element that reads its own `contentRect`, picks the band count, and redraws on resize with the same seed. CSS `border-image` covers fixed-unit 9-slice frames with zero JS.
- **Sources.** [practice-derived; unverified]. initialis `hold()` keeps the letter's place fixed across variations so frames adapt around it, `refs/initialis/src/breed.js` (read 2026-11-06).

---

## Part C · The craft of intention

Each principle is grounded in an artwork or text, then turned into a rule and a renderer consequence.

#### C1 · Curate the distribution, not the output
- **Principle.** Uniform randomness is the default nobody chose. Every random quantity gets a designed distribution.
- **Why it works.** Hobbs: uniform randomness in 2D "looks like static" and people expect it to be more even than it is, since true uniform samples clump. Gaussian is "the distribution that I use most frequently" for "values that should be approximately the same, but with some outliers for variety", bounded because it has no min or max. Power law (his pseudo-Pareto in *Community*) gives many tiny shapes, fewer medium ones and few large ones: the size ladder of every good composition. Fidenza ships weighted *categorical* distributions: Jumbo scale most common, Small "very rare"; 14 hand-picked palettes with per-colour weights.
- **How.** A small distribution vocabulary like florilegium's `W/I/R/C/BY`, plus `gauss(μ, σ, lo, hi)` and `pareto(min, α, max)`. Ban bare `Math.random()` in generator code.
- **Browser.** Parameters are declared with their distributions in one schema that drives both sampler and playground.
- **Sources.** tylerxhobbs.com/words/probability-distributions-for-algorithmic-artists (fetched 2026-11-06); tylerxhobbs.com/words/fidenza (fetched 2026-11-06).

#### C2 · Judge a thousand, not one ("nowhere to hide")
- **Principle.** The algorithm is the artwork; its *worst* output is part of it.
- **Why it works.** Hobbs on long-form: "the artist has nowhere to hide"; "The algorithm can't stumble across great results by luck anymore"; the average and worst outputs matter as much as the best; he spent about two months searching Fidenza's output space for weak cases. A website is long-form: every page, viewport and content length is a mint nobody curates.
- **How.** A contact-sheet harness: render seeds 0–999 at three container sizes in a grid, sort by cheap metrics (ink coverage, largest empty region, number of components, contrast against text), and look at the tails first. Fix the generator, never the seed.
- **Browser.** The playground's first feature after rendering should be the contact sheet. Ship with a regression set of "seeds that were once bad".
- **Sources.** tylerxhobbs.com/words/the-rise-of-long-form-generative-art (fetched 2026-11-06).

#### C3 · Perceptual difference over numerical difference (the oatmeal problem)
- **Principle.** Ten thousand outputs that are each mathematically unique can be perceptually identical, like bowls of oatmeal.
- **Why it works.** Compton's "10,000 bowls of oatmeal" problem: uniqueness that the eye cannot see is worthless; decide *which* attribute should be memorably different per output. Her generator essay frames the work as listing the qualities a human artist would vary and the constraints they would keep.
- **How.** For each generator, name 2–3 *character* parameters that change the silhouette or the story (species body plan, frame kind, symmetry group) and keep the rest as *texture* parameters with narrow ranges. Measure distinctness at thumbnail size: if two seeds look the same at 64 px, they are the same output.
- **Browser.** Pages differ in character parameters (a new plant); a component repeated across pages differs only in texture.
- **Sources.** galaxykate0.tumblr.com "So you want to build a generator" (403 to fetcher) [unverified]; oatmeal problem as summarised in CMU 60-212 course readings via search [unverified].

#### C4 · Unity: one idea, every part load-bearing
- **Principle.** Variety must come from inside one idea, never from adding unrelated features.
- **Why it works.** Hobbs: the work should express a single idea, and removing any component should hurt it; collectors should never get bored flipping through, but not because new gimmicks appear. Hoff's stated restriction: works should seem immediately complex, even chaotic, but the concepts should be easily understandable when explained.
- **How.** Write the idea as one sentence before coding ("a vine that grows from the bottom-left corner toward every free space in the margin"). Every parameter must change how that sentence plays out. initialis enforces the composite version: `restrain()` allows a ground at most two of {pattern, texture, grown ornament} and a letter at most two of {patterned fill, filigree, echoes, shadow, inline}.
- **Browser.** Each illum module has a one-line thesis in its docs; feature requests that do not serve it go into a different module.
- **Sources.** Hobbs long-form essay (fetched 2026-11-06); Hoff bio, 14.piksel.no (search snippet) [unverified]; `refs/initialis/src/breed.js` `restrain()` (read 2026-11-06).

#### C5 · Order with a measured dose of disorder
- **Principle.** Start from rigour and add the least disorder that makes it alive; vary the dose as a compositional gradient.
- **Why it works.** Vera Molnár's "1 % de désordre": the more she reduced disorder, the more the plastic beauty grew, but some small disorder (one percent, for example) is necessary to thwart rigidity. Georg Nees's *Schotter* (1968–70, ALGOL on a Zuse Graphomat) is the canonical gradient: an orderly grid of squares that random variables bring down into "a heap" as the rows descend. The disorder is a parameter with a direction, not a texture.
- **How.** Generate the ideal (grid, frieze, star pattern), then apply perturbation with amplitude driven by a field: position on the page, distance from the hero, scroll depth. Doses: ±0.5–2% of unit size reads as "hand", 5–15% as "weathered" [practice-derived].
- **Browser.** A global `disorder` uniform per module, plus a gradient map; "1%" as the default. The perturbation must be seeded per element so it does not shimmer on re-render.
- **Sources.** Molnár via spalterdigital.com and universalis.fr search snippets [unverified]; collections.vam.ac.uk/item/O221321/schotter-print-nees-georg/ (fetched 2026-11-06; the row-by-row gradient is from the work itself, not the V&A text).

#### C6 · Instructions as the work; the renderer as the drafter
- **Principle.** A good generator is a terse instruction that tolerates many faithful interpretations.
- **Why it works.** Sol LeWitt's wall drawings exist as instructions executed by others: Wall Drawing 46 "Vertical lines, not straight, not touching, covering the wall evenly"; Wall Drawing 86 "Ten thousand lines about 10 inches (25 cm) long, covering the wall evenly"; Wall Drawing 305 "The location of one hundred random specific points. (The locations are determined by the drafters.)" Each is a constrained distribution plus a container. Casey Reas's *Process* series extends this into software (elements, forms, behaviours in English first, then code) [unverified: reas.com page 404].
- **How.** Write each illum module's spec as a LeWitt-style sentence that names the container ("the wall"), the elements, the constraint ("not touching") and the density ("evenly"). This is also a test: if the sentence cannot be written, the module has no idea (C4).
- **Browser.** Show the instruction beside the output; it doubles as LLM-facing API documentation.
- **Sources.** massmoca.org/sol-lewitt/ (fetched 2026-11-06).

#### C7 · Knowledge over noise: rules that know what things are
- **Principle.** Encode what the artist knows about the subject (botany, ornament grammar, how a frame is built) instead of hoping noise approximates it.
- **Why it works.** Harold Cohen's AARON (conceived late 1960s at UCSD, named early 1970s; "the earliest artificial intelligence (AI) program for artmaking", per the Whitney 2024 retrospective) combined formal rules, such as working from foreground to background, with random events, drew first and decided colour afterwards [both unverified: search snippets], and was built on a "freehand line" generator [unverified]. florilegium's genome follows the same path: pollination syndromes and petal rules from botany, not from tuning. Kaplan's Generative Zellij randomises only the skeleton (random lines at multiples of 45°, then their dual) and fills it with traditional tile arrangements, which is what keeps the output faithful to tradition.
- **How.** Randomise structure where tradition allowed freedom; use fixed, sourced vocabularies where tradition was strict. Separate drawing from colouring, as AARON did.
- **Browser.** Module data files (species tables, tile vocabularies, frame anatomies) are sourced research artefacts, versioned separately from code.
- **Sources.** whitney.org/exhibitions/harold-cohen-aaron (fetched 2026-11-06); isohedral.ca/generative-zellij/ (fetched 2026-11-06); `refs/florilegium/florilegium-species.lua` (read 2026-11-06).

#### C8 · Parameter spaces that contain only good outputs
- **Principle.** Make bad outputs unrepresentable rather than filtering them.
- **Why it works.** Hankin's method has a tiny space (tiling, θ, δ) where every point is traditional. florilegium conditions traits so impossible flowers cannot be drawn and then asserts the invariants anyway.
- **How.** Three layers, all visible in initialis: (1) conditional sampling (`BY`), (2) *repair* passes that move an output back into the good region instead of rejecting it: `legible()` swaps the letter's ink when it would not show against its ground (luminance difference < 0.22 counts as faint), `coarse()` clamps patterns finer than their legibility threshold (`PAT_FINEST`, e.g. frets 5.5, frost 15) because they "read as a grey tint", `readable()` only lets letters inflate in faces whose strokes survive it, `tame()` caps cost; (3) asserted invariants as tests.
- **Browser.** Repair functions are pure and cheap and run on every sample, including in production; assertion failures in the contact-sheet harness are bugs.
- **Sources.** `refs/initialis/src/breed.js` (`legible`, `coarse`, `readable`, `tame`, `finish`) and `refs/florilegium/florilegium-species.lua` checks (read 2026-11-06); Kaplan 2005 (fetched 2026-11-06).

#### C9 · Hierarchy: hero, secondary, filler
- **Principle.** Every composition has one focus, a few supports and a quiet ground; size, detail and contrast fall off in that order.
- **Why it works.** Manuscript pages rank decoration (historiated initial, then decorated initials, then line fillers and penwork). florilegium plants a hero plant, a second showy plant and a monocot on the three main stems and a spray on the footer; the first stem ends in the largest flower at the top. Fidenza's scale classes are a hierarchy of sizes.
- **How.** Place the hero first (deterministically, at a compositional anchor: top of the margin, outer corner), then secondaries by Wong growth, then filler with a hard size cap and lower contrast (florilegium's pale "ghost flowers" behind). Use power-law sizes.
- **Browser.** Hierarchy is page-level too: one hero ornament per viewport; components below the fold get secondary or filler grade automatically. Expose `rank` as a prop.
- **Sources.** `refs/florilegium/florilegium-grow.lua` header (read 2026-11-06); tylerxhobbs.com/words/fidenza (fetched 2026-11-06).

#### C10 · Negative space is a parameter with a floor
- **Principle.** Decide how much stays empty before deciding what fills.
- **Why it works.** Fidenza's "Has Margin" trait keeps a border of negative space; Wong growth stops when the largest free disc falls below a threshold, leaving breathing holes rather than packing them. Filler is what happens when the stopping rule is "until full".
- **How.** Every fill algorithm stops on *coverage* or *largest empty region*, not on exhaustion: florilegium's `SMALLEST` and `FILLMIN`; Poisson radius; circle-packing minimum. Target ink coverage per rank (hero region 35–60%, ground 5–20%) and measure it.
- **Browser.** Text is always the dominant negative space: ornament density must fall to near zero within a guard distance of body text (an SDF threshold), protecting reading.
- **Sources.** tylerxhobbs.com/words/fidenza (fetched 2026-11-06); `florilegium-grow.lua` constants (read 2026-11-06).

#### C11 · Constraint and limited palettes
- **Principle.** Few inks, chosen as a set; colour weights, not colour lists.
- **Why it works.** Historic print and illumination worked in 2–5 inks (black, red, a blue, gold). Fidenza's palettes are weighted ("one palette might make about half the shapes blue"). Kjetil Golid's chromotome is a curated palette library (colours, stroke, background) rather than generated colour. initialis gives each initial a paper and three inks (A, B, C), and only 40% (`RECOLOUR = 0.4`) of wild initials take a named palette whole, so palettes season the field rather than take it over.
- **How.** Palettes are data, authored by hand, each with paper, inks and weights; generators sample *roles* (ink A, accent) not hex values.
- **Browser.** Palettes map to CSS custom properties, so a site's theme and its ornament share inks; dark mode is a separate authored palette, never an inversion.
- **Sources.** github.com/kgolid/chromotome (fetched 2026-11-06); `refs/initialis/src/breed.js` `recolour()` (read 2026-11-06).

#### C12 · One deliberate surprise
- **Principle.** Rare, designed deviations give a series memory; everything else stays disciplined.
- **Why it works.** Fidenza's rarest palette (Luxe-Derived) and rare scales are designed rarities; Hobbs admits of the rarest, "Sometimes they're great, sometimes they're not", a candid note that rarity must still pass quality review. Manuscript margins are disciplined vine scrolls with one drollery (a snail, a rabbit) per page.
- **How.** A surprise budget: at most one rare element per composition, probability per page 2–10%, drawn from an authored list (a visitor insect, a gilded bloom, a broken symmetry in one corner). initialis's `jump(d)` swaps in a part from another style with probability rising with distance from the root, capped at 0.55.
- **Browser.** Surprises keyed to the seed so they are stable and shareable ("the page with the snail").
- **Sources.** tylerxhobbs.com/words/fidenza (fetched 2026-11-06); `refs/initialis/src/breed.js` (read 2026-11-06).

#### C13 · Seeding, reproducibility and stream isolation
- **Principle.** Every output is a pure function of (seed, container, version); adding a feature must not reshuffle existing outputs.
- **Why it works.** Ornament that changes on every load reads as a screensaver; stable ornament reads as an object. initialis's `Field` makes each cell's initial "a pure function of the generation and the cell, so the field can be panned forever and come back the same". Crucially, `recolour()` draws from "its own random stream, so the rest of each initial comes out as it did before there were these". florilegium appends new genome traits after existing ones for the same reason, and uses mulberry32.
- **How.** Seed = hash(site seed, URL path, component id, instance index). Derive child streams with `hash(seed, 'palette')`, `hash(seed, 'growth')`, never share one stream across concerns. Snapshot tests on SVG output pin versions.
- **Browser.** Same SVG server-side and client-side (render at build time where possible; hydrate only for animation). Expose the seed in a `data-seed` attribute so a reader can share or reroll.
- **Sources.** `refs/initialis/src/breed.js` header and `recolour()` (read 2026-11-06); florilegium README credits (mulberry32) (read 2026-11-06).

#### C14 · Human-in-the-loop breeding
- **Principle.** The quickest path to a parameter space of only good outputs is to let a person keep what they like and breed from it.
- **Why it works.** initialis's breeding field: wild initials start "close to one that was kept", children cross two parents section by section (letter, frame, ornament, texture, ink), and mutation grows with distance from the root (`stray(d) = min(0.6, 0.09 + 0.055·d)`, part swap `jump(d) = min(0.55, 0.07·d)`) "until the edges are wild again". Kept outputs are deduplicated by a signature (font, frame, ornament, texture, fill, pattern, ink) and become sources for new initials; faces that looked bad "after a look through them all" are listed in `LEFT_OUT`. Human taste is captured as data, not as code.
- **How.** Contact sheet → keep/reject → kept list feeds the sampler's priors. Section-wise crossover keeps parts coherent. Pins let the user lock sections.
- **Browser.** The playground stores kept genomes (JSON) and exports them as presets; site owners breed their own house style. Build it to be played daily: Licia He's 100-day challenges (fetched) and Zach Lieberman's daily sketches since 2016 and advice "to build tools for the younger versions of themselves" [unverified: M+ interview via search] argue for hot reload, seed scrubbing, schema-bound sliders and one-click SVG export.
- **Sources.** `refs/initialis/src/breed.js` `child()`, `Field`, `setKept()` (read 2026-11-06); artblocks.io/article/in-conversation-with-licia-he (fetched 2026-11-06).

#### C15 · Material resistance and the analog signal
- **Principle.** Let a medium push back: the hand, the brush, the paper.
- **Why it works.** Licia He paints generative watercolours with a plotter and brush on cotton paper, builds her own toolkits rather than relying on graphics libraries, for control and understanding (paraphrased), and holds that quantity matters as much as quality because good ideas emerge from mediocre ones. Emily Xie's *Memories of Qilin* imitates handmade craft with textured grounds resembling aged paper or fabric with artificial water stains [unverified: Toledo Museum via search]. The craft signal is in the imperfection that a real process would have produced, not in random noise.
- **How.** Simulate the process, not the look: ink pooling at stroke ends, pressure from curvature, paper grain as a fixed texture the ink interacts with, registration error between ink layers (a per-ink offset, not per-element jitter). (Media simulation belongs to the brushwork and material research notes.)
- **Browser.** A shared "material" layer (paper, ink, registration) applied after geometry, as SVG filters or a canvas pass, consistent across all modules.
- **Sources.** artblocks.io/article/in-conversation-with-licia-he (fetched 2026-11-06); Emily Xie via search [unverified].

#### C16 · Cost as an aesthetic constraint
- **Principle.** A detail that takes minutes to grow is a detail nobody sees; cap density where perception and performance meet.
- **Why it works.** initialis records that textures packed finer than a threshold "take minutes to grow (Voronoi cells at spacing 2: over two minutes; truchet a minute)" and caps them (`FINEST`), and separately caps patterns that "read as a grey tint" at display size (`PAT_FINEST`). The two caps nearly coincide: below a certain scale, extra work is both slow and invisible.
- **How.** Every module declares its minimum feature size in CSS px and its node budget; the renderer clamps both.
- **Browser.** Budget per component (e.g. ≤ 4 ms main thread, ≤ 50 ms in a Worker, ≤ 3k SVG nodes), measured in the contact-sheet harness.
- **Sources.** `refs/initialis/src/breed.js` `FINEST`, `PAT_FINEST` (read 2026-11-06).

#### C17 · Further practitioners worth mining (not individually verified)
- **Principle.** A fixed vocabulary, exhaustively varied, beats an open one. Manfred Mohr (the cube, rotated and cut), Frieder Nake (*Hommage à Paul Klee*, 1965: random choices inside a borrowed composition), Dmitri Cherniak (*Ringers*: string wrapped around pegs, a tiny space with huge perceptual range), Kjetil Golid (curated palettes, subdivided grids), Lia, Matt DesLauriers, Manolo Gamboa Naón and Joshua Davis (personal toolkits that make iteration cheap), and Nervous System (growth tuned to each object's constraints, the nearest analogue to adaptive web ornament).
- **Sources.** github.com/kgolid/chromotome (fetched 2026-11-06); all others [unverified]; n-e-r-v-o-u-s.com 403.

---

## Ten rules for procedural that doesn't read as filler

1. **Write the instruction first.** One LeWitt-style sentence naming container, elements, constraint and density. No sentence, no module (C4, C6).
2. **The container is an input.** Every generator takes a box, an SDF or a glyph, and grows into it; nothing is stamped at a fixed size (A1 Wong, B1–B3).
3. **No bare `random()`.** Every quantity has a chosen distribution: Gaussian for "about the same", power law for sizes, weighted categories for kinds (C1).
4. **Rank before you place.** One hero per viewport, few secondaries, quiet filler; place the hero deterministically, then grow the rest from it (C9).
5. **Stop on emptiness, not exhaustion.** Fill until the largest free region drops below a floor, and keep a guard distance around text (C10).
6. **Order first, then 1% disorder, on a gradient.** Perturb a rigorous structure by a measured, directional dose (C5).
7. **Make bad outputs unrepresentable.** Conditional sampling, repair passes, asserted invariants; prefer construction to rejection (C8).
8. **Judge a thousand at three sizes.** Contact sheets sorted by worst-case metrics; fix the generator, never the seed (C2, C3).
9. **Seed everything, isolate streams.** Output = f(seed, container, version); each concern draws from its own derived stream so new features do not reshuffle old pages (C13).
10. **Few inks, one surprise, real material.** An authored palette by role, at most one designed rarity per composition, and a shared material layer that imitates process rather than adding noise (C11, C12, C15).

---

## Most promising algorithm × tradition pairings

1. **Space colonization × Books of Hours ivy borders (Flemish and French, 15th c.).** Attraction points sampled in the margin band, excluded from the text block; short d_k and moderate dᵢ for the wiry penwork stems; terminal *hedera* leaves and gold bezants (dots) at tips; one drollery as the surprise. The envelope is the page, exactly as on vellum. florilegium's `hedera` fleuron already exists.
2. **Wong greedy growth × Morris & Co. / Kelmscott borders and initials.** Largest-free-disc placement with a hero bloom, acanthus scrolls arriving along the motif axis, dense but with a disc floor; the Kelmscott initial is a frame that knows its letter (B3).
3. **Hankin polygons-in-contact × Islamic geometric bands (Alhambra, Mamluk Qur'ans).** Section grounds and rules; the parquet deformation (θ varying 22.5°→67.5° across the band) as a scroll-linked rule that morphs as the reader descends. Interlace from the same strands.
4. **Celtic knotwork with Mercat breaks × insular initials (Book of Kells, Lindisfarne).** The letter's SDF defines the cells; breaks placed along the glyph boundary; one or two continuous threads checked by component count; zoomorphic terminals as the surprise.
5. **Genome sampling × florilegium / herbal plates (Besler's *Hortus Eystettensis*, Redouté).** A site flora of eight species from one seed; each page shows a specimen with its "label"; L-systems or phyllotaxis for organs only.
6. **Flow fields over an SDF × steel engraving and banknote hatching.** Hatch lines follow the field derived from a shape's distance gradient, line weight from tone, quantised angles for a burin look; pair with guilloché rosettes for certificates and "issued" marks.
7. **Weighted Voronoi stippling × stipple engraving in natural-history plates.** Tone from an image or SDF; stop Lloyd early to keep a hand irregularity.
8. **Meander/frieze groups × Greek and Roman pottery bands.** Integer-fit units, authored corners, the seven frieze groups as the full menu for `<hr>`.
9. **Shape-grammar ice-ray × Chinese lattice windows.** Recursive straight cuts of any DOM rectangle; fitted by construction; superb as panel backgrounds at low contrast.
10. **Multi-scale Truchet × Roman mosaic and marquetry grounds.** Subdivision probability from a density map so fine tesserae gather around the focus.
11. **Reaction–diffusion thresholded to vector × marbled endpapers and "stone" grounds.** For true marbling (combed ebru) use advection by a designed flow field instead (deformations of ink drops), [unverified as a historical technique match].
12. **Differential growth × lace edges and coral-like borders.** One growing line constrained to a footer band, stopped at a node budget.
13. **Fourier truncation × calligraphic cadels; DLA/Voronoi crackle × frost and crackle glaze.** Small, specific moods; initialis's `frost` and `ice` show the scale floors.

Not recommended as primary engines: raw Perlin flow fields, uniform Truchet, unconstrained WFC, stock L-system ferns. They read as generative-art defaults; use them only as components inside a tradition.
