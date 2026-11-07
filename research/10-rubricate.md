# 10 · Rubricate: one library

The drop initial (03), the paraphs, line-fillers and breaks (06) and the frames (07) are one act:
the rubricator's pass over a finished text. They become one system. (The ivy border, gold and the letter
painting are separate tools and are not part of this.)

## Contract

```js
import { rubricate } from './kit/illum.js';
const r = rubricate(root, {
  style: 'gothic',          // any key of STYLES; data-style on root or any element overrides locally
  rich: .5, scale: 1,       // the budget and the ornament's size, as in 06; data-rich / data-scale per element
  theme: 'auto',            // 'auto' | 'light' | 'dark'; the host owns --paper --ink --rubric
  draw: 'still',            // 'still' | 'now' (write it all, in reading order) | 'read' (write as it scrolls in)
  ink: 'medium',            // 'medium' (the ink engine) | 'pen' (the stamped pen; and the fallback without WebGL2)
  seed,                     // default: a hash of the text
});
r.redraw(opts); r.destroy();
```

It walks the host markup once and finds the cases (selectors configurable):

| element | host markup | made by |
|---|---|---|
| drop initial, big / small | `.ini.drop[data-lines]`, `.ini` | the style's initial panel (03's flourish for Gothic) |
| paraph | `p` that begins a new sense within a chapter (`p.par`, or rule) | `paraph` |
| line-filler | the free end of a heading's or paragraph's last line (short, long, none) | `filler` |
| chapter break, book break | `hr`, `.break[data-rank]` | `breakMark` |
| frames | `blockquote`, `figure`, `pre`, `.pull`, `aside`, `nav` | the style's frame forms (07) |

## Parts

- **Registry.** `STYLES` (now in `wayfinding.js`) becomes the one registry. Every style defines every element:
  paraph, fillers, breaks, *initial panel*, *frames*. "All cases in all styles": a Cyber initial and an Occult
  blockquote frame exist, not only Gothic ones. Each keeps its light and dark palette and its grammar.
- **Score.** One draw machinery: parts with `t0, t1, at(f), done()`, written in reading order. `read` mode is 06's
  (IntersectionObserver, ~15% into the viewport, a hurried hand on fast scroll, nothing when idle, finished marks
  kept across relayout); 03 and 07 move onto it. Reduced motion means `still`.
- **Mark layer, two writers.** Line work goes through the medium's `Pen` (exact tracing, round quill, dry ink:
  as approved on 03). Fills (Tarot pips, Kelmscott solid leaves, Riso overprint, gold points) stay with `marks`. The
  stamped `pen` remains the fallback.
- **Medium pooling.** One medium per initial worked for 03 (two initials). A long page has hundreds of marks and
  browsers allow ~16 WebGL contexts, so the writer keeps one medium per page, sized to a *working window* (the region
  being written; in read mode, the viewport), and bakes dried ink into a plain 2D layer, one per ink colour, before
  the window moves on. Until this exists, 06's marks stay on the stamped pen.

## Acceptance

A `cases` page: every element above (initial big and small; paraph; heading filler; paragraph filler at short,
zero and long gaps; chapter and book breaks; the six frames) × every style × light and dark × scale 0.5, 1, 2 ×
1440 and 390 × still, now and read. The audit runs over all of it (text collisions, overlaps, connectivity, the
shape sweep), plus a pixel diff against the approved output of 03, 06 and 07 for whatever is not meant to change.
The pages migrate one at a time against it: a refactor that drifts an approved look is a regression.
