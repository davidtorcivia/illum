# 18 · The tells

What makes writing and web design read as machine-made, gathered so illum's site and docs can avoid all of it.
Sources: Wikipedia's *Signs of AI writing* (WikiProject AI Cleanup); the humanizer skill (blader, mirrored at
github.com/c-b-g-m/blader-humanizer: 25 patterns); Pangram's measured rates (em dashes ~10x, triads ~4x, "not just X,
but Y" ~3x the human rate); the ux-skill wiki *How to detect AI slop in your design*; practitioner write-ups on
"AI slop" web design. Plus the tells of Claude's own house style, from our own observation. No single tell proves
anything; a page that has several is read as generated, and that is the reader we are writing for.

## Writing

**Vocabulary.** delve, tapestry, testament, pivotal, intricate, garner, underscore, crucial, vibrant, enduring,
additionally, align with, fostering, showcasing, highlighting, enhance, leverage, multifaceted, prioritize,
seamless, effortless, elevate, unlock, empower, streamline, supercharge, transform, journey, landscape, realm,
nestled, breathtaking, timeless, meticulous, thoughtfully, carefully crafted, genuinely, honestly, quietly,
universally. Several in one passage is the strongest signal.

**Constructions.**
- Negative parallelism: "not just X, but Y"; "it's not X, it's Y"; "no X, no Y, just Z"; "Y rather than X".
- The rule of three: triplets of adjectives, benefits, nouns ("innovation, inspiration, and insights").
- Copula avoidance: "serves as", "stands as", "boasts", "features", "offers" where "is" or "has" would do.
- Significance inflation: "a pivotal moment", "an indelible mark", "deeply rooted", "setting the stage".
- Trailing -ing analysis: "..., highlighting its ...", "..., reflecting ...", "..., underscoring ...".
- Vague attribution: "experts believe", "observers note", "many say".
- Formulaic challenge and outlook: "despite challenges, it continues to thrive"; "the future looks bright".
- False ranges: "from X to Y" across unrelated things.
- Synonym cycling: renaming the same thing every sentence.
- Filler and hedging: "in order to", "due to the fact that", "could potentially".
- Claude's own: the aphorism ("The X is the Y."), the colon reveal ("Here's the thing:"), dramatic fragments
  ("Not decoration. Structure."), "a love letter to", "where X meets Y", "built for", "every pixel", openers that
  restate the question, closers that summarise what was just said, and the confident register that sounds like a
  brochure about a museum rather than the museum.

**Form.** Em dashes for asides (use commas, parentheses, or two sentences); bold scattered through prose; bullets
with a bold label that the bullet then repeats; Title Case Headings; emoji; headings in the "X and Y" pattern;
"Challenges", "Future outlook", "Key features" sections; chatbot residue ("I hope this helps", "let me know").

**What to do instead.** Name the real thing: the Kelmscott Chaucer, Wellcome MS 4670, Lilly's *Christian Astrology*
(1647), the Apollo guidance drawings. Say what something is with "is". One idea per sentence; vary the length because
the thought varies, not for rhythm. Cut every adjective a photograph would make unnecessary. Captions over claims.
A curator's label is the model: what it is, who made it, when, from what, and one thing worth looking at.

## Design

- Fonts: Inter, or the "editorial" default pair (Instrument Serif / Fraunces / Playfair with JetBrains Mono); a
  12/14/16/18/24/30/36/48 Tailwind scale; semibold body; long hero lines.
- Colour: purple-to-blue and other gradients, gradient text, gradient borders, blurred blobs; brand colour on
  everything; emerald success green; the warm off-white with a single terracotta accent used as a template; dark mode
  as a plain inversion.
- Layout: centred hero with one button; three equal cards in a row with an icon in a tinted circle; everything
  centred; every section the same height and padding; no asymmetry.
- Components: rounded-2xl on everything; shadow + border + tint on the same card; pill badges; "Get started ->";
  eyebrow labels in tracked small caps above every heading; "01 /" section numbering as decoration; keyboard-key
  badges; hairline dividers everywhere.
- Decoration: emoji; default icon sets at default size; decorative motion (drifting, pulsing, shimmer); the same
  hover on everything.
- Copy furniture: stock names, fake brands, round invented statistics, lorem ipsum.
- Accessibility failures read as carelessness: low contrast, small targets, colour-only meaning, no reduced motion,
  removed focus outlines.

**What to do instead.** Let the content decide the layout: the work is large, the words are few. A real typeface
with history, set at a real measure with its own features (small caps, old-style figures). A palette taken from the
work itself (iron-gall black, vermilion, verdigris, the paper). Asymmetry where the content is asymmetric. Motion only
where it shows something (the pen writing). Dark mode designed, not inverted.
