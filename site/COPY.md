# illum site: copy for review

Every word on the site, page by page. Second version, after the author's verdict on the first ("way too busy with
links"): the work is almost all there is. Markup notes are in [brackets]. The specimen text on the five style pages
(Ruskin, *The Stones of Venice*, with short notes on how medieval pages were arranged) is the same as
playground/tests/*.html and is not repeated here.

Checked against research/18-tells.md: vocabulary grep, dashes, exclamations, and the constructions read by hand.

---

## On every page

**Top line:** illum · see · use · [theme switch, "dark" / "light", in the Fell like the rest of the line; on See it is in
the viewer instead]

**Foot:** illum, by David Torcivia, 2026. [Home: ] Sources [Use: ] Seed [n].

---

## Home (index.html)

[One rubricated text, in Blackletter. Its contents list links to See, one style each.]

**illum**
*Ornament for web pages, written by a simulated pen*

[contents]
- Blackletter, from German books of the fifteenth century
- Tarot, from the Tarot de Marseille of Nicolas Conver, 1760
- Occult, from French copies of the Key of Solomon
- Astrology, from William Lilly's Christian Astrology, 1647
- Draft, from the Apollo drawings of the MIT Instrumentation Lab

[drop initial] Once a scribe had finished a book, a rubricator went over it with red ink and a finer pen. illum does
the same for a web page. It finds the openings, paragraphs, breaks and quotations in the page's markup, and a
simulated pen writes a mark for each in ink.

[paraph] The text is shown first and left as it is. The ornament is drawn behind it a moment later, and the same text
always gets the same ornament.

[break]

> You must either make a tool of the creature, or a man of him. You cannot make both.
> *John Ruskin, The Stones of Venice, 1853*

[book break]

---

## See (see.html)

[The Ruskin specimen, the whole width, in the chosen style. A bar fixed to the foot of the window is the viewer.]

**The bar:** Blackletter Tarot Occult Astrology Draft · Still / Written · New seed · Dark [or Light] · Adjust

**Adjust** [folds open above the bar]: Richness: plain modest usual [fine lavish, Blackletter only] · Size [slider, px]
· Seed [n] · and the style's own:
- Tarot: Initial: Red letter / Black letter; Card title [Le Livre]
- Occult: Initial: Solid ring / Lettered band; Ring [ALPHA ET OMEGA PRINCIPIVM ET FINIS]
- Astrology: Initial: Square figure / Volvelle; Figure: Octagon / Houses; Middle square [Anno Dom: 1853]
- Draft: Initial: In section / Two views / Lettering

**One line of credit under the specimen, ending in a link to its sources:**
- Blackletter: After German books of the fifteenth century, among them Johann Neudörffer's *Eine gute Ordnung*,
  1538, and the Winter Breviary of Constance, 1476–78. The Metropolitan Museum of Art. Sources
- Tarot: After the Tarot de Marseille of Nicolas Conver, 1760. Bibliothèque nationale de France. Sources
- Occult: After French copies of the *Clavicules de Salomon*, Wellcome MS 4670 and MS 4666, and John Dee's *Monas
  hieroglyphica*, 1564. Wellcome Collection. Sources
- Astrology: After William Lilly's *Christian Astrology*, 1647, and the volvelle of the *Clavis astrologiae
  elimata*. Wellcome Collection. Sources
- Draft: After the Apollo guidance drawings of the MIT Instrumentation Laboratory, 1963–66. National Archives.
  Sources

[The old addresses styles/<style>.html send the reader on to see.html?style=<style>.]

---

## Use (use.html)

[Rubricated in Draft.]

**Use**
*Written in Draft*

[drop initial] The library is a set of JavaScript modules with no dependencies, not yet published as a package. Copy
the `kit` and `fonts` folders from this site into yours, side by side, and call `rubricate` on the element that
holds your text.

```js
import { rubricate } from './kit/illum.js';

const r = rubricate(article, { style: 'tarot', draw: 'read' });
r.redraw({ rich: 0.25 });
r.destroy();
```

**Markup** [table: It draws / where it finds]
- a drop initial | `<span class="ini drop">` round the first letter
- a paraph | `<p class="par">`
- a line-filler | the free end of a paragraph's last line
- a break | `<hr>`, or `<hr data-rank="2">` between books
- a frame | `blockquote`, `figure`, `pre`, `aside`, `nav`

**Options** [table: option / values]
- `style` | 'blackletter', 'tarot', 'occult', 'astrology', 'draft'
- `draw` | 'still', or 'read' to write each mark as its line comes into view
- `rich` | 0 to 1; default 0.5
- `seed` | a whole number; default a hash of the text
- `initial` | the style's drop initial, such as `{ set: 'solid' }`

The page sets `--paper`, `--ink` and `--rubric`, and illum draws in its own inks to suit them, light or dark. The
element that holds the text must be positioned. Frames are drawn in the padding of their boxes; this site's
stylesheet has working values for each style. The text is never covered, and with reduced motion nothing is written
as the reader watches.

---

## Sources (sources.html)

[Not in the top line; reached from each credit line and from the home page's foot.]

**Sources**

Each style was drawn from these objects, studied at full size in the institutions' scans.

[Then, for each style, its name (linking to its page) and its list of sources, each with a link to the object where
one exists: Met, Cleveland, Gallica, Wellcome, Internet Archive, Virtual AGC.]

**This site**
- The specimen text: John Ruskin, *The Stones of Venice*, volume II, chapter VI, 1853. Project Gutenberg 30755.
- Set in Junicode (Peter S. Baker) and IM Fell Great Primer (Igino Marini); the specimens in EB Garamond (Georg
  Duffner); code in Courier Prime. All under the SIL Open Font License; the licences are in the site's `faces` and
  `fonts` folders.

---

## Removed in this version

The Principles and Engine pages, the penwork forerunner, the "What each mark is" notes, the long source lists under
each specimen, the captions and notes in the margin, the long colophons. type.html (the type options sheet) and
nav-options.html (the three navigation treatments) stay in the site folder for the author, linked from nowhere.
Third version: the five style pages became one viewer, See; the navigation is see and use.
