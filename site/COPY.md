# illum site: copy for review

Every word that appears on the site, page by page, so it can be read and corrected in one place before it is set.
Markup notes are in [brackets]. The specimen text on the style pages (Ruskin, *The Stones of Venice*, and the short
notes about medieval page structure) is the same text as playground/tests/*.html and is not repeated here.

Checked against research/18-tells.md (vocabulary grep, dashes, constructions read by hand): no words from its list, no
em dashes, no "not X but Y", no "from X to Y" ranges, no headings in Title Case or the "X and Y" pattern, no eyebrow
labels, no numbering used as decoration.

---

## On every page

**Site name** (top left, links home): illum

**Navigation:** Blackletter · Tarot · Occult · Astrology · Draft · Use · Principles · Engine

**Theme switch** [a button; its label names the mode it switches to]: Dark / Light
[Screen-reader label: "Switch to dark mode" / "Switch to light mode". With no choice made, the page follows the
reader's system setting.]

**Colophon** (foot of every page; the home page's is the long form, the others name the style and seed):
Set in Junicode, Peter S. Baker's type for medievalists, with headings in IM Fell Great Primer, one of the types
Bishop John Fell bought for the Oxford press in the 1670s, digitised by Igino Marini. The rubricated text is in EB
Garamond. Ornament by illum, seed [n]. Made by David Torcivia, 2026. [link] Type.
Short form: Set in Junicode and IM Fell Great Primer; the specimen in EB Garamond. Ornament by illum, [style], seed
[n]. Made by David Torcivia, 2026. [link] Type.

---

## Home (index.html)

[The home page is itself a rubricated text. A row of controls above it chooses the style it is written in.]

**Margin, beside the text:** This page is written by illum. Choose the style it is written in.
Style: Blackletter / Tarot / Occult / Astrology / Draft. Show: Still / Written as you read

**Title:** illum

**Subtitle:** Ornament for web pages, written by a simulated pen

**Contents** [nav, framed by the style's contents frame]:
- Blackletter, from German books of the fifteenth century
- Tarot, from the Tarot de Marseille of Nicolas Conver, 1760
- Occult, from French copies of the Key of Solomon
- Astrology, from William Lilly's *Christian Astrology*, 1647
- Draft, from the Apollo guidance drawings of the MIT Instrumentation Lab

[Opening paragraph, with a drop initial:]
Once a scribe had finished a book, a rubricator went over it with red ink and a finer pen. illum does the same for a
web page. It puts a large initial where the text opens, a paraph where a paragraph turns to a new point, a filler in the empty end of a short
line, a mark between chapters, and a frame round a quotation, a figure or a block of code. It finds these places in
the page's own markup, and a simulated pen writes each mark in ink.

[par] Each style is taken from objects studied at full size in museum and library scans. The line in Tarot is traced
from Conver's cards in the Bibliothèque nationale de France. The planetary signs in Occult are the ones a scribe wrote
in Wellcome MS 4670, about 1725. The sources are listed on each style's page.

[par] The words are left alone. The text is laid out and shown first, and the ornament is drawn a moment later on a
layer behind it. Screen readers read the text and nothing else. The same text gets the same ornament on every visit.

[hr]

**h2:** Using it

One call, on the element that holds the text: [no filler on this line]

```js
import { rubricate } from './kit/illum.js';

rubricate(article, { style: 'tarot' });
```

[par] The options, the markup it looks for and the colours it reads are on the [Use] page.

**h2:** Why

[blockquote]
You must either make a tool of the creature, or a man of him. You cannot make both.
*John Ruskin, The Stones of Venice, 1853*

illum is a program, and so a tool in Ruskin's sense. Its lines keep the irregularities a hand makes, and each one
has a cause: the pen slowing at a turn, the ink running low, a stencil laid a little off the line. The [Principles] page
says what else we hold to.

[hr rank 2]

---

## Style pages (shared parts)

**Controls** [in the margin beside the specimen on a wide screen; on a phone folded under a "Controls" summary above the specimen]:
- Show: Still / Written as you read [with reduced motion: "Your system asks for reduced motion, so the ornament is
  shown still."]
- Richness: plain, modest, usual, fine, lavish [slider; the label shows the word. Blackletter goes to lavish; the
  other four stop at usual, because the library has no marks above usual for them yet]
- Type size: 15 to 26 px [slider; the ornament is measured from the text, so it follows]
- Seed: [number field] [button] Another
- Theme is in the header.
- [style options, below]

**Note under the caption:** The same passage is set in all five styles, so they can be compared: Ruskin on Gothic
workmanship, with a few notes on how medieval pages were arranged.

**Under the sources:** The specimen text is from John Ruskin, *The Stones of Venice*, volume II, chapter VI, "The
Nature of Gothic", 1853, Project Gutenberg 30755.

**Heading of the notes section:** What each mark is

**Heading of the sources section:** Sources

---

## Blackletter (styles/blackletter.html)

**Title:** Blackletter

**Caption:** Black and red, as in German books printed and written in the fifteenth century. The drop initial is a
Fraktur capital from the typeface UnifrakturMaguntia, written by the ink engine with its strokes split and red run in
between them, as the writing master Johann Neudörffer did in his copybook of 1538.

**Options:** none beyond the shared ones.

**What each mark is:**
- Drop initial: the Fraktur capital, split into straps with red laid between them, a broad-nib bar across the stem,
  hairline loops thrown into the margin, and a trefoil knot.
- Line initial: the same capital in the line, with a red stroke beside its stem.
- Paraph: a red capitulum, a C made of three broad strokes.
- Fillers: a red rule ending in a lozenge; a row of lozenges in black and red; the twisted cord of the Constance
  breviary.
- Chapter break: Solomon's knot in strapwork, with red rules and points either side.
- Book break: a braided band of two straps.
- Frames: a red bar edged in black round the figure, with the ruling running past its corners as in a Rouen book of
  hours; thick and thin red rules down the side of a quotation; a strap with a hairline wound round it beside the
  contents.

**Sources:**
- Johann Neudörffer the Elder, *Eine gute Ordnung*, Nuremberg, 1538–41. The Metropolitan Museum of Art, 354468.
  [link https://www.metmuseum.org/art/collection/search/354468]
- Winter Breviary, Constance, 1476–78. The Metropolitan Museum of Art, 910582.
  [link https://www.metmuseum.org/art/collection/search/910582]
- Missal, German, 1472. The Metropolitan Museum of Art, 469038.
  [link https://www.metmuseum.org/art/collection/search/469038]
- Peter Schöffer, *Gart der Gesundheit*, Mainz, 1485. The Metropolitan Museum of Art, 343820.
  [link https://www.metmuseum.org/art/collection/search/343820]
- Leaf from an antiphonary, Germany, about 1480. Cleveland Museum of Art, 2014.25.b.
  [link https://www.clevelandart.org/art/2014.25.b]
- Leaf from a book of hours, Rouen, about 1510. Cleveland Museum of Art, 2001.79.b.
  [link https://www.clevelandart.org/art/2001.79.b]
- Marco Antonio Rossi, cadel alphabet, 1598. Wikimedia Commons.
- Gutenberg Bible, Mainz, about 1455. Library of Congress, via Wikimedia Commons.
- UnifrakturMaguntia, by j. ‘mach’ wust, after Peter Wiegel. SIL Open Font License.

---

## Tarot (styles/tarot.html)

**Title:** Tarot

**Caption:** The Tarot de Marseille as Nicolas Conver printed it in Marseille in 1760: a line cut in wood and printed
in black, with red, yellow, blue, flesh and green laid over it through stencils, a little off register. The drop
initial is a trump card in small.

**Options:**
- Initial: Red letter (contour) / Black letter (solid)
- Card title: [text field, default "Le Livre"; empty leaves the band blank, as on the thirteenth trump]

**What each mark is:**
- Drop initial: a trump, with the frame rule, the numeral band and the title band. In the field, the capital in IM
  Fell French Canon among things traced from the cards: the hatched ground and tufts at the Magician's feet, and drops
  falling as round the Sun.
- Paraph: the chapter's suit, in the cards' order: cups, batons, swords, coins.
- Fillers: a baton laid along the line; a sword pointing back at the words; the vine from the coin cards.
- Chapter break: the numeral band, the chapter's number between two pips.
- Book break: two batons crossed and bound by a woven lozenge, as on the eight and nine of batons.
- Frames: the card's frame round a quotation, with the attribution in the title band; the pip card's composition
  round the code, the number turned in each side margin.

**Sources:**
- Nicolas Conver, Tarot de Marseille, Marseille, 1760. Bibliothèque nationale de France, Département des Estampes,
  btv1b10520316w. [link https://gallica.bnf.fr/ark:/12148/btv1b10520316w]
- Jean Noblet, Tarot, Paris, about 1650. Bibliothèque nationale de France, btv1b105109641.
  [link https://gallica.bnf.fr/ark:/12148/btv1b105109641]
- Jean Dodal, Tarot, Lyon, about 1701. Wikimedia Commons.
- Visconti-Sforza tarot, Milan, about 1450–80. The Morgan Library & Museum, MS M.630, and the Accademia Carrara,
  Bergamo.
- IM Fell French Canon, digitised by Igino Marini. SIL Open Font License.

---

## Occult (styles/occult.html)

**Title:** Occult

**Caption:** A leaf from a grimoire as eighteenth-century copyists made them: circles struck with a compass, rules,
names and signs in red, and verdigris green. Taken from French copies of the *Clavicules de Salomon* in the Wellcome
Collection and from John Dee's *Monas hieroglyphica* of 1564.

**Options:**
- Initial: Solid ring (ring) / Lettered band (band)
- Ring: [text field, default ALPHA ET OMEGA PRINCIPIVM ET FINIS]

**What each mark is:**
- Drop initial: a seal. A solid ring with its capitals cut out of the ink, after the Grand Pentacle in Wellcome MS
  4666, a verdigris cross within it, and the red capital at the centre.
- Paraph: the chapter's planet, in the order of the days of the week, in the forms the scribe of MS 4670 wrote them.
  Saturn is an italic h, Jupiter a 2 with a crossed tail.
- Fillers: the planetary hours in a ruled row; the planets' Latin names lettered between two rules; sigils drawn on
  the magic square of Saturn.
- Chapter break: a seal between the words CAPVT and the chapter's ordinal.
- Book break: Dee's Monas, with his motto QVI NON INTELLIGIT AVT TACEAT AVT DISCAT.
- Frames: a red double rule round a quotation; the table of planetary hours across the head of the code.

[note, small] Sigils are checked by a test that rejects any shape resembling a hate symbol.

**Sources:**
- *Clavicules de Salomon*, French, about 1725. Wellcome Collection, MS 4670.
  [link https://wellcomecollection.org/works/kvnptb24]
- *Les Clavicules de Salomon*, French, mid-eighteenth century. Wellcome Collection, MS 4666.
  [link https://wellcomecollection.org/works/zfwn4rng]
- *La Clavicule ou la Clef de Salomon*, French, mid-eighteenth century. Wellcome Collection, MS 4659.
  [link https://wellcomecollection.org/works/hwqdep8w]
- John Dee, *Monas hieroglyphica*, Antwerp, 1564. Wellcome Collection.
  [link https://wellcomecollection.org/works/rzge7jad]
- Heinrich Cornelius Agrippa, *De occulta philosophia libri III*, Paris, 1567. Wellcome Collection.
  [link https://wellcomecollection.org/works/qcxukubr]
- IM Fell Double Pica, digitised by Igino Marini. SIL Open Font License.

---

## Astrology (styles/astrology.html)

**Title:** Astrology

**Caption:** An astrologer's page of the sixteenth and seventeenth centuries. The drop initial is the square figure of
the heavens from William Lilly's *Christian Astrology* (London, 1647), with the capital in its middle square. The rules
are in brown-black; the signs, names and capitals in red.

**Options:**
- Initial: Square figure (square) / Volvelle (volvelle)
- Figure frame: Octagon (octagon) / Band of houses (houses)
- Middle square: [text field, default "Anno Dom: 1853"]

**What each mark is:**
- Drop initial: Lilly's square figure, six lines deep. Each of the twelve cusps carries its sign in red and its degree
  in black, and planets are written into the houses where there is room. A house with no room is left empty, as
  Lilly's are.
- Paraph: the chapter's zodiac sign, in the forms cut for the volvelle of the *Clavis astrologiae elimata*.
- Fillers: the aspects threaded on a rule; the twelve signs in a ruled band; Apian's checkered degree scale.
- Chapter break: a small volvelle on a lettered band.
- Book break: the *Clavis* volvelle, its turning plate and pointer laid over the fixed disc.
- Frames: Peter Apian's octagon round the figure; the head of Lilly's ephemeris over the code.

**Sources:**
- William Lilly, *Christian Astrology*, London, 1647. Wellcome Collection.
  [link https://wellcomecollection.org/works/s7z7c46y]
- Norris Purslow, astrological casebook, 1690s–1730s. Wellcome Collection.
  [link https://wellcomecollection.org/works/gk6pzbah]
- *Clavis astrologiae elimata* (Henry Coley), paper volvelle. Wellcome Collection.
  [link https://wellcomecollection.org/works/hx7ub4p5]
- Peter Apian, *Astronomicum Caesareum*, Ingolstadt, 1540. The Metropolitan Museum of Art.
- Astrological manuscript attributed to Philippus Knodius, 1589. Wellcome Collection.
  [link https://wellcomecollection.org/works/ejt5ebtj]
- Regiomontanus, *Kalendarium*, Augsburg, 1499. Wikimedia Commons.
- IM Fell Double Pica, digitised by Igino Marini. SIL Open Font License.

---

## Draft (styles/draft.html)

**Title:** Draft

**Caption:** The engineering drawing as the MIT Instrumentation Lab made it for the Apollo guidance computer,
1963–66: ink at two pen weights, template lettering, item balloons and dimension lines, construction in non-repro
blue. In dark mode the drawing is a reverse print. The drop initial is the capital drawn as a machined part, in
section.

**Options:**
- Initial: Part in section (part) / Two views (views) / Lettering layout (leroy)

**What each mark is:**
- Drop initial: the capital as a part, cut in section and hatched at 45°, with centre lines through its counters, a
  radius called out on a bowl and the stem's width dimensioned.
- Paraph: an item balloon numbered with the paragraph.
- Fillers: a dimension line stating its own length in inches; a centre line ending in its symbol; a long break line.
- Chapter break: a cutting-plane line with the section letters at its ends.
- Book break: the revision block.
- Frames: the zoned sheet border and title block round a quotation; a parts list under the code; a detail boundary
  round the figure, lettered DETAIL and SCALE 2:1.

**Sources:**
- Apollo guidance and navigation engineering drawings, MIT Instrumentation Laboratory, 1963–66 (aperture cards).
  National Archives, via the Internet Archive. [link https://archive.org/details/aperturecardbox432naraswimages]
- AGC logic flow diagrams. Virtual AGC project. [link https://www.ibiblio.org/apollo/]
- Hershey Roman Simplex, A. V. Hershey, National Bureau of Standards, 1967. Used for the template lettering.

---

## Use (use.html)

[Rubricated in Draft.]

**Title:** Use

**Subtitle:** Written in Draft, the style taken from engineering drawings

- Markup
- The call
- Options
- The host page
- What it costs

The library is a set of JavaScript modules with no dependencies. It is not yet published as a package. To use it now, copy the `kit` and `fonts` folders from this site into yours, keeping them side by side, and import `rubricate`.

**h2:** Markup

Write the text as you would without illum. rubricate reads ordinary elements and a few classes.

- It draws | where it finds
- a drop initial | <span class="ini drop" data-lines="4"> round the first letter
- an initial in the line | <span class="ini">
- a paraph | <p class="par">
- a line-filler | the free end of a last line, in the elements named by select.filler
- a break | <hr>, or <hr data-rank="2"> between books
- a frame | blockquote, figure, pre, .pull, aside, nav


[paraph] The initial’s letter stays in the text and is read once by a screen reader. Make it `color: transparent`, and give a drop initial `float: left`; the ink is drawn behind it.

**h2:** The call

```js
import { rubricate } from './kit/illum.js';

const r = rubricate(document.querySelector('article'), {
  style: 'astrology',
  rich: 0.5,
  draw: 'read',
  initial: { title: 'Anno Dom: 1853' },
});

r.redraw({ seed: 7 });
r.destroy();
```


[paraph] `r.redraw(options)` draws again with the new options. `r.destroy()` removes the ornament and leaves the text as it was.

**h2:** Options

- option | values
- style | 'blackletter', 'tarot', 'occult', 'astrology', 'draft'
- rich | 0 to 1, in five steps: plain, modest, usual, fine, lavish. Default 0.5. Only Blackletter has marks above usual so far.
- seed | a whole number. Default: a hash of the text, so the same text is always drawn the same way.
- draw | 'still' (default); 'read', each mark written as its line comes into view; 'now', the whole page written in order.
- theme | 'auto' (default), 'light' or 'dark'.
- initial | the style’s drop initial: { set, title } for Tarot, Occult and Astrology, { set } for Draft.
- frame | Astrology’s figure frame: { form: 'octagon' } or 'houses'.
- select | selectors that replace the defaults, such as { filler: 'h2, p' }.
- on | a function, called with 'drawn', 'reading' or 'written'.

**h2:** The host page

The page sets three CSS custom properties and illum reads them: `--paper` for the ground, `--ink` for the text, `--rubric` for the headings. Each style brings its own inks for light and dark grounds. It never paints the page’s ground or its text. With `theme: 'auto'` it follows `data-theme` on the `<html>` element, or else the reader’s system setting.

[paraph] The element that holds the text must be positioned. The ornament is drawn on two canvases inside it, marked `aria-hidden`. Frames are drawn in the padding of their boxes, so a quotation or a block of code needs room round it, and each style needs a different amount. This site’s specimen stylesheet has working values for all five.

**h2:** What it costs

The modules come to 667 KB, or 226 KB compressed with gzip, and a page loads all five styles. The faces a style draws its letters from are loaded only when that style is used. The ink engine needs WebGL2; without it a simpler pen draws the same marks. When the reader’s system asks for reduced motion, nothing is written as they watch. illum makes no network requests beyond its own files.

---

## Principles (principles.html)

[Rubricated in Blackletter; each rule is a paragraph opened by a paraph, in place of numbers.]

**Title:** Principles

**Subtitle:** Written in Blackletter. Each paraph marks one rule.

These are the rules the library is built to. They come from what illumination did for the readers of manuscripts, and from writers on books whose names are at the foot of the page.

[paraph] The text comes first. It is laid out and shown before any ornament is drawn, and a page without illum is complete.

[paraph] Ornament marks the structure the author wrote: an opening, a new paragraph, a quotation, a break. illum does not guess which sentences matter.

[paraph] Rank can be seen. The opening of a text gets the large initial and a paragraph gets a paraph, so a reader can tell the parts of a page apart at a glance, as readers of books without page numbers once did.

[paraph] The same text always gets the same ornament. Hugh of St Victor, about 1130, told students to remember a passage by where it stood on the page and the colour of its letters. A page that redraws itself at random gives a reader nothing to remember it by.

[paraph] Nothing covers a word or lowers its contrast. Frames go round the text; marks sit in the margins and in the gaps the text leaves.

[paraph] Every irregularity has a cause in the making: a pen running dry, a stencil laid off the line, a compass closing a little past its start. Ruskin found in Gothic carving “the life and liberty of every workman who struck the stone”; illum adds no noise that has no cause.

[paraph] Each style is taken from objects we could study at full size, and they are credited. We take how the work was made and leave its pictures where they are. Owen Jones put it this way in 1856: “The principles discoverable in the works of the past belong to us; not so the results.”

[paraph] The reader’s device pays for the ornament, so illum spends little. It sends nothing over the network, and nothing moves unless the reader asks to watch it written. The writing plays once and stops.

Cassiodorus, *Institutions*, about 560. Hugh of St Victor, preface to the *Chronicle*, about 1130, after Mary Carruthers, *The Book of Memory*, 1990. John Ruskin, *The Stones of Venice*, 1853. Owen Jones, *The Grammar of Ornament*, 1856. William Morris, “The Ideal Book”, 1893. Beatrice Warde, “The Crystal Goblet”, 1932.

---

## Engine (engine.html)

**Title:** The ink engine

Every mark on this site is written by a simulated pen into a simulated sheet, in the reader's browser, with WebGL2.

[par] The pen follows the hand through a damped spring, as a held pen does, so a curve has a real hand's slight lag
and overshoot. The nib's edge lays ink over exactly the area it sweeps, so a broad nib makes thick and thin strokes by
its angle. Ink flows with time: it lands heavier where the pen slows, at a touch-down or a turn, and finer in a quick
stroke. As the pen's charge runs down the ink catches only the high points of the paper and the line breaks dry.
Within one stroke the ink is one deposit; where a stroke crosses an earlier one the ink lies on ink and is darker.

[par] A typeface capital is laid into the same medium as a single pour, so its edge has the same feathering as the
pen's lines round it. Tarot's stencil colours go in the same way, beneath the line.

[par] A long page is written through one working window that moves down it. When the next mark falls outside the
window, the ink in it is dried and pressed into a flat layer, and the window moves on.

**h2:** The forerunner

[Caption above the frame:]
The penwork initial below was the first piece the engine wrote, after the Lombard initials of a North Italian
psalter leaf of the early fifteenth century (The Metropolitan Museum of Art, 466773
[link https://www.metmuseum.org/art/collection/search/466773]). It is still being reworked and is not yet one of the
styles. The slider at its foot sets how much penwork the scribe was paid for.

[iframe title: "Penwork initial, a working study"]
[link] Open it on its own page

---

## Type (type.html)

[The type options sheet, for the author: three pairings set side by side, with reasons. Not linked from the main
navigation; linked from the colophon.]

**Title:** Type

**Option A, Oxford.** Junicode for text and IM Fell Great Primer for headings, with Courier Prime for code.
Junicode is Peter S. Baker's face for medievalists, modelled on the Pica Roman that Oxford University bought in 1692
and used for George Hickes's *Thesaurus* of the northern languages (1703–05). The Fell types came to the same press
some twenty years before.
Junicode has true small caps, old-style figures and a weight axis, and its texture sits well beside the specimens'
EB Garamond without matching it. Courier Prime is a typewriter face with its serifs intact, closer to a fine-press
book's world than a programmer's mono.

**Option B, Fournier.** Source Serif 4 for text and for headings at its display size, with IBM Plex Mono for code.
Frank Grießhammer's design follows the types of Pierre-Simon Fournier, with an optical size axis drawn for the screen.
The clearest of the three to read; also the least particular to this subject.

**Option C, Garamond.** EB Garamond for text, IM Fell Great Primer for headings, IBM Plex Mono for code. Georg
Duffner's revival of the Egenolff-Berner specimen of 1592. It is the specimens' own face, so the site and the
ornament would share one voice and the site would not stand apart from the work.

**Chosen:** A.

**Licences:** all faces are under the SIL Open Font License 1.1. The licence files are in `faces/` and `fonts/`.
