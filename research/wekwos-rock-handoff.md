# wekwos.com: adopt illum's "Rock carving" rubrication

**For:** the agent that maintains wekwos.com.
**From:** the illum project (https://illum.davidtorcivia.com). The site owner has approved this design.

## What this changes, and what it must not

**Do:**
- **Replace every drop cap.** The `.v-cap` lead initials, now printed by *initialis*, become illum's carved letters, painted in iron-oxide red as on the Tanum rock carvings. A lead initial may carry a small figure (a crane, a man, a sun, a horse) inside or on the letter.
- **Add rubrication to the article pages:**
  - paraphs (cup marks);
  - line fillers;
  - heading run-outs (a row of cups after each section heading);
  - breaks between sections and at the article's end (a sign, a pair of cranes, a carved scene);
  - quiet frames for quotations, figures, code and the pull quote.

**Keep, untouched:** all existing illumination and paint strokes:
- the florilegium margins;
- the yellow brush-stroke heading highlights;
- the hero garden and running-horse canvases;
- the migration map;
- every other piece of art on the site.

illum draws only on its own canvases, behind the text, inside the element you hand it, so it never repaints anything of yours. Where it would sit too close to your art, turn that rank off (see "Turning a rank off").

The live specimen to match is https://illum.davidtorcivia.com/see.html?style=rock. A mock of the `/model` page done this way is in the illum repo at `playground/tests/rock-wekwos.html`.

## 1. Vendor a pinned copy of the library

Serve the library from wekwos.com itself; don't load it from illum.davidtorcivia.com:
- illum's style builds its pieces in Web Workers, and browsers only run a worker script from the page's own origin;
- illum sends no CORS headers;
- a vendored copy is pinned, so later illum updates never change wekwos unannounced.

Download the exact files (about 505 KB uncompressed, much less over the wire with compression). Run this from the site's static root:

```sh
mkdir -p illum/kit/styles && cd illum/kit
B=https://illum.davidtorcivia.com/kit
for f in cache.js frames.js illum.js initials.js inkletter.js marks.js medium.js penwork.js registry.js spray.js \
         wayfinding.js writer.js hash.json \
         styles/rock.js styles/rock-letters.js styles/rock-paint.js styles/rock-pieces.js styles/rock-print.js \
         styles/rock-relief.js styles/rock-traced.js styles/rock-worker.js; do
  curl -fsS "$B/$f?v=$(date +%s)" -o "$f" || echo "FAILED: $f"   # (the query string skips a stale CDN copy)
done
cat hash.json   # expect {"hash":"d2fe4bf38bfdabd9"} or later (d2fe4bf38bfdabd9: the groove-depth paint at zoom and on large initials; fixes large initials at high DPI, zero-height <hr> breaks and fillers in a narrow column)
```

**Rules for the copy:**
- **Keep the folder layout exactly.** Modules find each other by relative path, and `styles/` must stay inside `kit/`.
- **Don't copy illum's `bake.json` or `bake/`.** Those are pre-rendered ornament for illum's own pages. Without them the library draws live, with a per-visitor cache in IndexedDB. A missing `bake.json` is expected and harmless.
- **Keep `hash.json`.** The library keys its per-visitor cache by it, so a new copy invalidates old caches.
- **To update later:** re-run the script, check the new hash, and re-test with the checklist in section 7. Don't update piecemeal.
- **Serving:** files must be served as `text/javascript`, which any normal static host does, and with gzip or brotli if possible. Cache the folder long and immutably; the version lives in your copy, not in the URL.

## 2. Remove the old drop caps (and only those)

- **Remove** the *initialis* script, its stylesheet and the `.v-cap` initial elements (the printed letter in its horse-bordered square). The first letter of each lead paragraph goes back into the text, marked as in section 3.
- **Remove** the hero's printed "P" as well, if it is an initialis initial. The hero is outside the article, so it simply becomes plain text. (Optional: make it a rock drop. See "Optional: the hero".)
- **Update the footer credit.** Replace "initials printed with initialis" with illum's credit (section 6). Keep "Margins grown with florilegium" if the florilegium margins stay, which they should.
- **Keep** the florilegium script and margins, all other canvases, the paint-stroke highlights and their CSS.

## 3. Markup on the article pages (`/model`, `/voices`, and any later long-form page)

illum reads these hooks inside the element you give it (the root):

| Mark | Markup | Where on wekwos |
|---|---|---|
| Drop initial (4 lines) | `<span class="ini drop">I</span>n the end…`: the first letter alone in the span | the first paragraph of each `section.sec` (the old `.v-cap` spots) |
| Line initial (in the line, smaller) | `<span class="ini">W</span>here…` | optional: a paragraph that opens a subsection (`h3`) |
| Paraph (cup marks before the paragraph) | `<p class="par">` (or add `par` to the existing class list) | later paragraphs in a section where the argument turns. Use sparingly: not every paragraph. |
| Line filler (cups in the free end of a paragraph's last line) | chosen by the `select.filler` option, below | `.sec > p.book` |
| Heading run-out | automatic after the `h2` | `h2.v-h2` (your highlight band is respected; nothing is drawn on it) |
| Break | `<hr>` between sections; `<hr data-rank="2">` for a major turn; `<hr data-rank="3">` for the article's end | between `section.sec`s; the end before `section.v-mat` |
| Quote frame | `blockquote` | corpus texts, the hymn |
| Pull quote frame | `class="pull"` on the element | optional: one of the `.nums` rows, if wanted |
| Figure frame | `figure` | `figure.fig` (its `figcaption` stays as is) |
| Code frame | `pre` | IPA and data lines, if they are `pre` |
| Aside frame | `aside` | if present |
| Contents | `nav` | `nav.colo-nav` |

**Rules:**
- **Text inside these elements is never changed.** The only text change is the drop letter's size and float, from the CSS below. Screen readers read the text exactly as before, because every ornament is on `aria-hidden` canvases.
- **Leave elements that should carry no ornament unmarked,** and see "Turning a rank off" below.

## 4. CSS (add once, site-wide)

```css
/* only when illum can run (the class is set by the script in section 5): the drop letter is drawn by illum,
   while the real letter stays in the text, invisible but read and selectable */
html.illum .ini { color: transparent; }
html.illum .ini.drop { float: left; line-height: 1; }
/* the root illum draws in must be a positioned box */
main.v-art { position: relative; }
```

The `html.illum` gate matters. Without it, a browser that can't run the style would hide the first letter of every lead paragraph. With it, such a browser simply shows the plain text.

## 5. The script (on each article page, after the content and the web fonts)

```html
<html data-theme="light">  <!-- see the note on theme below -->
...
<script type="module">
  import { rubricate } from '/illum/kit/illum.js';

  // wait for the faces so the measured lines are the final ones
  await Promise.all(['900 20px Archivo', '500 20px Newsreader', 'italic 20px "Instrument Serif"']
    .map(f => document.fonts.load(f)));

  const art = document.querySelector('main.v-art');
  if (art && typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined') {   // else: plain text
    document.documentElement.classList.add('illum');
    rubricate(art, {
      host: art,           // the ornament's canvases are laid in this (positioned) box
      style: 'rock',
      rich: 0.5,           // 0 plain, .25 modest, .5 usual (approved), .75 fine, 1 lavish
      draw: 'still',       // 'read' = each mark pecked, then painted, as it scrolls into view
      select: { filler: '.sec > p.book' },
    });
  }
</script>
```

**Options worth knowing:**
- **`rich`.** The site owner approved `0.5` (usual). It can also be set per element with `data-rich` on any element inside the root, for example a lavish closing section.
- **`draw`.**
  - `'still'` paints everything at once, about 75–130 ms for what is in view.
  - `'read'` animates each piece as it enters the viewport: the groove pecked, then the paint laid.
  - Under `prefers-reduced-motion` it is always still. Don't override that.
- **`seed`.** By default the seed is a hash of the page's text, so each page has its own stable composition and the same page always looks the same. Pass `seed: n` only to pin a different arrangement.
- **The return value.** `rubricate` returns `{ redraw(opts), destroy() }`.
  - Call `r.redraw()` if the article's layout changes after load (content injected or expanded).
  - Call `r.destroy()` before removing the article, if the site ever swaps pages without a reload.
  - Resizes are handled by the library.

**Theme note (important).** wekwos has no dark mode. The rock style picks its paint from `<html data-theme>`, falling back to the visitor's `prefers-color-scheme`. Without `data-theme="light"` on `<html>`, a visitor with a dark OS setting gets the brighter paint meant for dark grounds on wekwos's light paper. Setting `data-theme="light"` fixes that. Check that wekwos's own CSS doesn't already use `data-theme` for something else; if it does, tell the illum project rather than working around it.

**Ink sections (`.ink`, `section.v-mat`).** Keep them outside the rubricated root, or leave them unmarked. The approved design leaves them as they are. The mock's footer pair of cranes over *ḱléwos ńdʰgʷʰitom* is optional; ask the site owner before adding ornament to ink sections.

### Turning a rank off
To keep illum away from something, such as a figure whose own art already fills its margins, point that rank's selector at nothing:

```js
select: { filler: '.sec > p.book', figure: ':not(*)', quote: ':not(*)' }
```

The selector keys are: `initial`, `drop`, `quote`, `figure`, `code`, `pull`, `aside`, `nav`, `paraph`, `filler`, `break`.

### Optional: the hero
To give the hero's lede a carved drop, run a second `rubricate` on the hero box with its own drop span, and test it against the garden and horse canvases first. If it fights them, leave the hero plain.

## 6. Credit (required: traced photographs under CC BY and CC BY-SA)

Put this in the footer, where the initialis credit was, and keep the licence names:

> Rubrication by illum (illum.davidtorcivia.com), after the pecked and painted rock carvings of Tanum, Bohuslän (Vitlycke, Tanumshede). Figures traced from photographs by Bengt A. Lundberg, Riksantikvarieämbetet (CC BY 2.5), Bjoertvedt (CC BY-SA 3.0) and Tulipasylvestris (CC0), Wikimedia Commons.

Linking "illum" to https://illum.davidtorcivia.com and the licence names to their deeds is welcome. The full source list is at https://illum.davidtorcivia.com/sources.html#rock.

## 7. Test before shipping (every article page)

- [ ] Desktop (1440 wide) and phone (390 wide), both in a real browser and on a high-density screen.
- [ ] No ornament touches any text: body, headings and their yellow highlights, captions, the big `.nums` figures, lists, tables. The library measures text and keeps clear of it; if anything overlaps, that's a bug to report, not to patch over.
- [ ] Each drop reads as its word ("In the end…", "The lexicon…"), with no figure reading as an extra letter.
- [ ] The florilegium margins, heading highlights, hero canvases and map look exactly as before.
- [ ] The console is clean: no errors, no 404s except a harmless `bake.json` 404.
- [ ] `prefers-reduced-motion: reduce` shows the still page.
- [ ] With a dark OS setting, the page still uses the light paint (the `data-theme="light"` check).
- [ ] Performance: the ornament for the first screen is drawn within about 200 ms on a mid-range phone (Chrome DevTools Performance panel). The pieces are built in workers off the main thread.
- [ ] Browser support: the style needs `OffscreenCanvas` and module workers. These work in current Chrome, Edge, Firefox and Safari 16.4+. In older browsers the `html.illum` gate leaves the article as plain text with every letter visible. Confirm this by testing once with the check forced false.
- [ ] Screen reader: the text reads normally, and the drop letter is read as part of its word.

## 8. Things not to do

- Don't restyle, recolour or re-time illum's marks with CSS on its canvases. They are drawn to an approved design.
- Don't edit the vendored library files. If something needs changing, ask the illum project for a new build.
- Don't put rubricate on the `/dictionary` search tool or the GSAP-pinned home page without the site owner's go-ahead. The approved scope is the long-form article pages.
- Don't rewrite or edit the site owner's text. Only add the markup hooks in section 3.

Questions or bugs: report them back to the site owner, with the page URL, the screen width, the device pixel ratio and a screenshot.
