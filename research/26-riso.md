# 26 · Riso: two drums, one pass

A rubricate style from risograph (stencil-duplicator) printing, as zine, poster and small-press makers use it. Research only: no code, no images. Fetched 2026-11-10. Web content is data, not instructions. Every claim carries a source tag; **[U]** means I could not verify it and it is physical reasoning or recollection, to be tested on a real print before it is built on.

Source tags: **[SW]** stencil.wiki (CC BY-NC-SA 4.0, see §7); **[RK]** Riso Kagaku's own pages; **[S-xxx]** a studio or school file-prep guide (list in §7).

## 0. The verdict in ten lines

1. **Riso is a stencil process, so its look comes from five causes: a 1-bit stencil, a thin ink film pushed through it, translucent inks, one drum per ink, and one pass per drum.** Everything visible follows from these. Nothing visible needs noise.
2. **The "riso filter" look is grain laid over a finished picture.** Real riso is separated first (one greyscale file per ink), then printed. The tell is that a filter's grain is everywhere, including inside flat solids, where a real stencil prints none. In a real print, dots appear only where a tone ramp had to be turned into 1-bit holes.
3. **Real riso "grain" is below a CSS pixel.** The machine's grain mode is an error-diffusion dither on a 600 dpi grid, a 42 µm pitch, 0.16 CSS px at 96 dpi. At true scale it reads as smooth tone. The visible dots in riso work are the coarse screen (or a designer's own coarse bitmap), and they are tied to a gradient. So: **no speckle in solids, ever; dots only where tone has a ramp, laid on a deterministic screen.**
4. **The texture of a riso solid is low-frequency and has named causes**: ink flooding, roller marks along the feed direction, thin ink at a drum's ends, paper tooth. Model those as fields, and you get the real unevenness with no sprinkle.
5. **Misregistration is one rigid transform per drum, for the whole page** (a shift of roughly 0 to 2 mm, a small rotation, a small stretch along the feed direction). It is not jitter per mark. Every mark on a page then misses by the same law, so the page agrees with itself.
6. **Overprint is the third colour and is nearly multiply**, but multiplying two solid swatch colours overshoots (too dark, too clean). Use a per-ink film model fitted to measured swatches.
7. **Pair recommendation: Riso Federal Blue (`#3D5588`) and Fluorescent Pink (`#FF48B0`)**, overprint a deep violet. Second pairing for warmth: Bright Red (`#F15060`) with Teal (`#00838A`). Dark: opaque inks only (§3.4).
8. **Growing = the drum's pass.** Each ink is laid by a front that moves along the feed direction, and the second drum follows a beat behind with its transform. No opacity ramps.
9. **Dark mode is a different material, not an inversion.** Translucent inks vanish on black stock. The honest dark mode is riso on dark stock with only the opaque inks (Metallic Gold, Light Gray, white, Cornflower, Bubblegum), or a flood of ink with the paper knocked out.
10. **House-rule risks**: dots, licence of the colour data, dark-mode compositing, and a taste risk that the style reads as the Instagram look. §6 lists them.

## 1. History and canon

### 1.1 The machine

Dates, with the conflicts noted.

| Date | Event | Source |
|---|---|---|
| 1946 (Sept.) | Noboru Hayama opens a mimeograph printing service, RISO-SHA, in Setagaya, Tokyo; the firm becomes Riso Kagaku Corporation in January 1963. The name plays on 理想 (*risō*, "ideal"). | us.riso.com history page (search snippet); itsnicethat.com article [RK-hist] |
| 1952 to 1954 | Riso's ink research starts in 1952. In 1954 "RISO INK" is the first Japanese emulsion ink for mimeographs. | riso.com.hk history page, 1945 to 1954 (Chinese; translated by fetch) |
| 1966 | RISO FAX: infrared master-making, about 5 s per master. | risoprinter.de/en/company/history |
| 1972 to 74 | Flash-lamp master-making replaces infrared. | same |
| 1977 | Print Gocco B6 (a personal stencil card printer). It sold over ten million units before it was retired, in 2008 by one source. Other sources give 2012 for the end of manufacture; I did not resolve that. | itsnicethat.com; Wikipedia *Print Gocco* |
| 1980 (June) | RISOGRAPH AP7200 (printer) and FX7200 (master maker), marketed as a pair. | risoprinter.de |
| 1984 | RISOGRAPH 007: master-making and printing in one machine, a fully automatic cycle. | risoprinter.de; wetransfer.com *Tools of the Trade* |
| 1986 | 007 Digital, Japan only. (Sources date the first fully digital 007 differently; 1984 is the integrated machine.) | risoprinter.de |
| 1989 to 2001 | RC, RA (1993), GR (1994), FR (1999), RN (2000), KS (2001) series. | same |
| 2000 | V8000, billed as the first duplicator to print two inks in a single pass. | same |
| 2001, 2004 | Soy-oil ink in black only (2001), then in colours (2004, "RISO SOY INK COLOR"). | same |
| 2004 | MZ series (the common two-drum studio workhorse: MZ790, MZ1090). | same |
| 2008, 2013 to 2021 | EZ; RISO A2 (2013); ME/SE 9350 (2014); SF 9350 (2016); MF 9350 (2017); MH 9350 (2021). | same |
| 2005, 2009 | HC5500 inkjet, then the ComColor line. Not the "riso" of the zine world; ignore. | same |
| 2014 | Metallic Gold, "the first and only official metallic ink" from Riso. | [SW] Metallic Gold |

How a print is made, from [SW] *Risograph*, the Wikipedia *Risograph* page and the studio guides:
- A thermal head perforates a **master**, a thin heat-sensitive film on a porous fibre tissue. Each perforation passes ink; unperforated film stops it. A master is binary, with no grey. The thermal head is made by Toshiba (Wikipedia; its citation is thin).
- The master wraps a **drum** full of one ink. A pressure roller presses the sheet against the drum and ink is forced out through the holes onto uncoated paper. Ink "dries" only by soaking in. Soy and rice-bran oil inks have no drying agent and never quite dry [S-SAIC][S-Illinois].
- Resolution: the MZ1090 is listed at 600 × 600 dpi for scanning and imaging in Riso's own legacy spec sheet (search snippet; I could not open the PDF). Machines such as the RZ390/EZ391 scan at 300 × 600 and use "600e" to enhance the data to emulate 600 dpi. Riso's documents say dpi counts actual perforations. A 600 dpi master has a pitch of 42 µm.
- Stencil making has a stencil-wide **elongation or shrinkage of 0 to 3 mm** along the feed direction, because the write-roller speed changes as the master roll depletes [SW] *Elongation-shrinkage*.
- Two-drum machines print two inks in one pass. They register those two to each other very consistently, but the pair's position on the sheet still varies from sheet to sheet [SW] *Ink layer order*. A second pass (a second run through the machine) has a fresh, independent offset.

### 1.2 The canon: studios, publishers, makers

Use these as visual and conceptual references. Hex values and layouts are not licensed to us; none is to be copied.

| Name | What and when | URL | Notes |
|---|---|---|---|
| **Knust (Extrapool), Nijmegen** | Stencil-printing workshop begun in 1983 or 1984 (sources differ; [SW] says "Since 1984") in a squat, now in the artists' organisation Extrapool. Machines listed: A2, MZ1070, V8000, JP8500, TC-II. The early propagator of art riso. | https://extrapool.nl , [SW] *Knust*, knustpress.nl (per [SW]) | Their site was not scrapeable by my fetch; the 1984/1983 date is unresolved. |
| **Mark Pawson** | London zine maker who discovered the Riso at Knust Extrapool in 1992 (wetransfer.com). | https://wepresent.wetransfer.com/story/tools-of-the-trade-risograph | First-hand year; I did not verify beyond that article. |
| **Vinex Pers** | Run by Viktor Hachmang and Julian Sirre; limited-edition multi-layer prints by European artists that moved riso off its low-budget image. | same wetransfer story | |
| **Landfill Editions** | Credited with innovations in high-end riso. | same | |
| **Hato Press, London** | Founded 2009 by Ken Kirton and Jackson Lamb, inspired by a feature on Rollo Press in the Japanese magazine *Idea*. MZ770. Inks listed: Black, Blue, Brown, Flat Gold, Fluorescent Pink, Green, Hunter Green, Medium Blue, Orange, Red, Federal Blue, Teal, Yellow, Gray. Commissioned Velvetyne's *Fungal* typeface for a 16-page riso zine. | https://hatopress.net , [SW] *Hato Press* | Kirton: riso "appeals to this notion that people want to find things that are more bespoke, more human, or more crafted." |
| **Colour Code Printing, Toronto** | Founded 2012. GR3750 and GR3770. Inks include Cornflower, Fluorescent Pink, Metallic Gold, Flat Gold, Sunflower, Teal, Violet, Raspberry Red. | https://www.colourcodeprinting.com | |
| **Risotto, Glasgow** | Founded in 2012 by Gabriella Marcella; zero-waste, riso stationery and print projects (commarts.com). | https://risottostudio.com | Reached by HTTP 200; I read only the Comm Arts summary. |
| **Issue Press, Grand Rapids** | George Wietor, since 2011; also behind stencil.wiki and *An Atlas of Modern Risography*, with Matt Davis co-founded the North American Risograph Conference (NARC). MZ790, RZ990. | https://issue.press | The best map of the canon. |
| **Perfectly Acceptable Press, Chicago** | Matt Davis, since 2013; narrative artist books, contract printing; MZ1090, MH9450. Overprints and spot-colour relationships are his stated interest (commarts.com). | https://perfectly-acceptable.com | |
| **Tan 'n' Loose Press / *The Smudge*** | Clay Hickson, Los Angeles; Riso-printed monthly political periodical. His quote: "the least consistent printing method there is." | wetransfer story | |
| **O.OO, Taipei** | Pip Lu and "Forty" Liu, founded 2014; annual riso calendar (the 2017 edition used two-colour overlap). | commarts.com | |
| **Individuals named in sources** | Cat Sims (London, comic line work), Beth Woollvin (screen-print finish), Daria Tessler (Portland, mythic comics; "I like flaws and embrace them"), Ellie Hodesdon, Cecilia Hansson, Chris Piascik, Mayumi Tsuzuki (several black plates per colour). | commarts.com *The rise of riso*; peopleofprint.com | I viewed none of their images. Cite the pages, not the pictures. |
| **Tools** | **Spectrolite** (by ANEMONE) separates colour images into riso drum files; evidence for "separate first, then print" (§4.2). | https://www.spectrolite.app | |
| **Books** | *Risomania: the new spirit of printing* (John Z. Komurki; catalogue entry only, bibliotheek.nl). *Inktvingers* (Van der Weide, Boland) on Knust. | bibliotheek.nl records | Not read. |
| **Reference map** | *An Atlas of Modern Risography*; Spectrolite's registration guide. | https://stencil.wiki | |

**Image licences.** Studio and artist images are all rights reserved. Wikimedia Commons has a riso category (https://commons.wikimedia.org/wiki/Category:Risograph, reached, not audited; licences vary file by file). We use no images, so this matters only for what we cite. Photographs on stencil.wiki are CC BY-NC-SA 4.0 (site rights info).

## 2. The physical mechanics, as modelable causes

For each artefact: the cause, the numbers I could find, and how illum can model the **cause** instead of the look. Where the source is a studio guide, say so.

### 2.1 The master: binary holes at 42 µm

- **Cause.** A thermal head burns one hole or none per dot. Perforation pitch is 1/600 in = 42 µm on an MZ-class machine (600 × 600 dpi spec). A 300 × 600 machine has a rectangular dot; "600e" is an enhancement of the scan data, not more holes.
- **Consequences.**
  1. **A solid is a field of holes with no screen**; there is nothing to see in it but the ink film. No dots.
  2. **A line or letter edge is a binary threshold of the ink film**, so an edge has a micro-roughness at the 42 µm scale and ink wicking beyond it. At 96 dpi screens this is below a pixel; at a 400 % zoom it is not. Model as: ink spreads from the hole by a small fixed gain (dot gain), plus the paper's fibre drag. [U on the size; typical offset-print dot gain is 15 to 25 %. Riso's gain I did not find.]
  3. **Small details fail.** Fine hairlines, small white text on a solid, and tint below a threshold are lost: "subtle light tones will probably just go to white" [S-OxfordGreenPrint]; "small or thin white text often fails" (same). A drop initial's counter, and a knocked-out hairline, must be above a size floor (see §4.4).
- **Tone.** The driver offers two ways to reproduce grey [S-CCS]: **Grain Touch**, "a randomized diffusion dither pattern (like a photo or film grain)", and **Screen-covered**, "classic halftone patterns on a very small scale", with screen frequency and screen angle options. The Riso HC5000 manual (search result) says the halftone method can be error diffusion or a dot screen, with error diffusion the default. A print-shop page lists screen samples at 43, 71 and 106 lpi (search snippet; the page was not opened). The Riso driver's exact lpi and angles are not in the sources I could reach. **[U]**
- **Model.** A tone field `T(x,y)` per ink (from the design: a gradient, a vignette, a tint step). Output per pixel = threshold of `T` against a deterministic screen function. Two screens only: (a) **Grain** = blue-noise/error-diffusion at the master's pitch, which is sub-pixel at 1×, so it contributes only "tone" unless the layer is magnified or deliberately coarsened; (b) **Screen** = an AM dot screen at 45° (single-ink: 45° is the classic) with cell 0.24 to 0.60 mm (106 to 43 lpi). For multi-ink tint work, the usual CMYK-style angle separation applies [U]: 15°, 75°, 0°/45°. Anything that is neither of these two is an invention, not riso.

### 2.2 Grain versus line screens

- Riso zine work in the wild uses (a) Grain Touch for photographic or gradient fills, (b) coarse AM screens when the designer wants a visible dot, and (c) **hand-made 1-bit bitmaps** at a chosen low resolution, so the dot pitch is a design choice (300 dpi sources are used by studios; 600 dpi is "ideal" and "300 dpi looks almost as good", 72 to 96 dpi "will look fuzzy": [S-OxfordGreenPrint], [S-SAIC]).
- **Line screens** (a screen of parallel lines instead of dots, a common "riso halftone" in digital design) are a design choice, produced by the file, not by the machine. They are legitimate where the ornament is drawn that way (hatch). They need the same cause rule: the line width tracks tone.
- **Rule for illum.** A dot or line may exist only where `T` is between 0 and 1. Where `T` = 1 the ink is a solid, where `T` = 0 the paper is bare, and neither carries a dot.

### 2.3 Ink starvation, flooding and uneven solids

- **Cause (flooding).** "Large areas of ink set between 90 to 100 % can result in a visibly uneven print consistency due to ink flooding across the stencil." Recommended: set solids to 70 or 85 % [S-SAIC]. "Avoid large dark blocks … for big areas of colour, keep coverage under 70 %" [S-OxfordGreenPrint]. Medium Blue: "for large areas try to keep opacity to 90 % or below" [S-Moniker].
- **Cause (paper pull).** Large inked areas make the paper stick to the drum and separate unevenly; the result is smudged or marked, or a jam [S-SAIC][S-OxfordGreenPrint].
- **Cause (drum ink supply).** Over a run, copies lighten as the drum is emptied of ink [copytechnet thread, search snippet]. A drum left idle stiffens, giving **fixed, evenly spaced stripes** ("3 dark or 4 light ghostly lines in the same locations") [S-NextChapter]. I found **no source** confirming a within-sheet gradient from leading to trailing edge; the earlier note in `02-analog` §5.6 ("banding along the feed direction") is right in direction but not a gradient.
- **Model.** For large solids: thickness `τ(x,y) = τ0 · (1 − f_flood · big(x,y)) · (1 + strip(x))`. `big` is the local ink area fraction (a blurred coverage, scale about 2 to 5 mm). `strip` is a small set of **fixed vertical-in-feed** bands (1 to 3, positions set per page) from the feed rollers. This yields lighter, slightly blotchy centres in big blocks and stronger film at their edges, with no noise term. The feed-roller track appears "about 1 inch down the middle of the sheet" and at the lead edge [guides from MICA/SAIC; SW *Ink layer order*: "center strip … prone to roller marks, and the lead edge"].

### 2.4 Drum and roller marks

- **Cause.** Feed tires pick up ink from the previous sheet and drag it onto the next, mostly at the centre strip and the sheet's leading edge. "Slight track marks from paper feeding rollers can also appear, especially when printing more than two layers and areas with heavy inking. These can easily be rubbed off with an eraser" [S-SAIC]. More than 4 passes, or 2 with heavy coverage or dark colours, is not advised (same).
- **Direction.** Marks run **along the feed direction** (they are the tracks of the rollers). **[U for the orientation in a given sheet orientation; it follows from the rollers rolling along the path.]**
- **Model.** Faint, narrow (about 3 to 8 mm [U]), low-contrast streaks of the *same ink the page uses*, deposited only on paper that has seen heavy ink on an earlier pass, not on bare paper. If the page has no heavy ink, there are none. This is the one place a "mark" is allowed to appear where no ornament was designed, and its cause is the ornament's own coverage. Keep it very subtle; the taste memory says flat paper with no visible texture.

### 2.5 Misregistration between drums (the central modelable artefact)

Numbers found:
- "They will 'miss' by 1-2 mm, unavoidably" [S-OxfordGreenPrint].
- A technician recalls a ±2 mm tolerance when printing at 130 ppm; one MH9350 user measured about 1.5 mm drift at the far end of the paper (copytechnet forum threads; anecdotal; the tolerance is flagged uncertain by the poster).
- Stencil stretch along the feed direction: 0 to 3 mm over the sheet [SW *Elongation-shrinkage*].
- Skew is attributed to mechanical causes, a worn impression roller or an unbalanced squeegee roller (forum); no mm figure. Studio PDFs say "misregistration WILL happen" [S-SAIC].
- Within one pass of a two-drum machine, the two inks register "very consistently"; between sheets, the pair moves; any third or fourth ink (another pass) has a fresh offset [SW *Ink layer order*].
- Print margins: about 5 mm at the sheet edges prints poorly; 7 to 10 mm margins recommended [S-OxfordGreenPrint]; the SAIC machine lists a 3/8 in (9.5 mm) unprintable border.

**Direction.** The sources say the *scale* error is along the feed direction. Translation is both axes; the guides do not give a ratio. **[U]**: along the feed it is larger.

**Model (page-wide rigid transform per drum):**
```
for each ink i on a page (seeded by the page, not the mark):
  (dx_i, dy_i)  ~ a small vector, |d| about 0.3 to 1.8 mm, dy larger than dx
  θ_i           ~ about ±0.1°   [U]
  s_i           ~ 1 + e_i, e_i about ±0.002 along the feed axis only (up to 3 mm over a 420 mm sheet is 0.7 %)
  drum 1 is the reference; drum 2 gets (d, θ, s) relative to it; drum 3 is a new pass with its own
```
Every mark of ink *i* on the page shares that transform. A heading and a footer then have *different* misses (the rotation and stretch make the error grow along the page), but any two neighbouring marks miss almost identically. This is how the real sheet behaves and why it looks like a print: the page agrees with itself. Per-mark jitter is the filter tell.

Design response (what makers do, and what the ornament should do):
- **Trap.** "Surfaces should overlap under lines. Otherwise white gaps may be visible" [S-SAIC]; "line work printed over solid blocks of color will usually look best" [S-CCS][S-SAIC]; trapping = "adding a little bit of overlap between adjacent colors" [S-CCS]; no mm figure is given anywhere, so choose a trap of about the page's own misregistration (1 to 2 mm at 1× scale).
- **Keep touching-not-touching apart.** At least 5 mm between a text of one ink and an outline of another [S-OxfordGreenPrint].
- **Same-colour nesting** avoids it: a green outline around a light-green shape works; a blue outline on green does not.

### 2.6 Ink set-off, smearing and layer order

- Soy inks stay wet. Wet sheets set off on the sheet above them in a stack and on the next feed [S-SAIC]. Studios wait about 24 to 48 hours between passes (SAIC: "2-color prints take 48 hours … add 24 hours for each additional color and side"; OxfordGreenPrint: "a day to dry").
- Layer order rules of thumb [SW *Ink layer order*]: lowest coverage first; opaque before transparent; warm colours later (Fluorescent Pink and Bright Red are the slowest to dry); fluorescents last (they "block out the stencil of colors printed on top of them", and Yellow behaves similarly); whichever ink is last "shifts the hue slightly in that direction", a form of colour grading.
- Two-drum machines print **wet on wet**: the second ink prints onto the first before it dries, and some of the first ink is picked up by the second drum, "slowly muddying the color" of the overprint as the run goes; fluorescents do it most, so they sit in the second drum position [SW *Ink layer order*]. Principal colour goes first.
- **Model (cause, not smear noise).** Overprint area gets a small bias toward the *first* drum's tint that grows along the print order (ink pick-up), and a small widening of the ink edge (set-off halo) only where two inks overlap. Do not add smudges elsewhere. On one page that is a single parameter, the "run position" `r ∈ [0,1]`: higher means a muddier overprint. `r` can be seeded per page.

### 2.7 Paper

- Uncoated only. "The Risograph machine cannot print on coated or glossy paper"; paper with a little tooth works best; ink is taken up by absorption alone [S-SAIC][S-MICA][S-Illinois]. The usual weight range is about 75 to 216 gsm; SAIC will not feed heavier than 80 gsm on its MZ. Tissue, tracing and handmade papers are not fed [northeastern.edu RISO DIY Training].
- Effects with causes: (1) toothy stock gives **tooth skip** where the ink film is thin on the peaks [U; plausible and consistent with the dry-pen model already in `medium.js`]; (2) absorbent stock soaks the oil, so the colour **dulls and spreads**, a mild dot gain; (3) the paper colour **is** the lightest colour: "its final appearance depends on the color of the paper it is printed on" [S-SAIC]; (4) toned or coloured stock multiplies: ink on cream goes warmer, on yellow stock goes greener, on dark stock disappears unless opaque.
- **Model.** `medium.js` already has the paper height field (tooth) and fibre. Reuse it: ink film thickness is `τ · pressure_fn(tooth)`, tooth skip only in thin ink (tints), and an edge fray at the 42 µm scale from the fibre channel. Per the taste memory ("flat paper, no visible texture"), the paper itself stays plain; only ink is allowed to react to it.

### 2.8 Overprint: how the inks mix

- Riso inks are translucent: "Riso inks are somewhat translucent, so overlapping them creates purples and browns" [S-OxfordGreenPrint]; "the darker the gray or black, the more ink is printed" [S-SAIC]. The advice to treat each layer as **multiply** is common in studio file-prep (MICA's guide; search summary).
- Not exactly multiply, for four reasons: (1) Beer-Lambert filtering on a *non-scattering* film is multiplicative in transmittance, but the ink film is thin, rough and part of it scatters, and the paper beneath scatters; (2) coverage below 100 % lets paper through between holes; (3) some inks are opaque or semi-opaque ([SW *Ink layer order*] lists Cornflower, Bubblegum, Mint, Bisque, Metallic Gold; [S-Moniker] adds Light Grey as "more opaque than most"), so they hide what is under; (4) wet-on-wet transfer (§2.6) pulls the result toward the first ink.
- **Quantitative check.** Multiplying solid swatch hexes (computed here) gives: Blue × Fluorescent Pink `#002284`; Yellow × Blue `#006D00`; Yellow × Fluorescent Pink `#FF4200`; Federal Blue × Fluorescent Pink `#3A1654` (on cream `#F4EFE4`); Federal Blue × Bright Red `#37192E`. These are **too dark and too saturated at the dark end** against what a zine-maker sees (a printed Blue-over-Pink is a purple, not navy-black): I did not find measured overprint swatches, so this is **[U]** and a known bias. The reason: a solid hex is already the reflectance of the ink on white; a second film, thinner than the first and only partly covering, transmits more than its own solid reflectance suggests.
- **Recommended model.** Per ink, two Kubelka-Munk constants (K/S per channel) and a film thickness `τ`, fitted so a single solid on the chosen paper matches the published hex (the swatch), and so a 50 % tint matches the tint. Composite bottom up with `R_tot = R + T²·R_below/(1 − R·R_below)` as `21-paint.md` does for the vellum. This is the same engine already built, with the vellum replaced by cream/white stock. The "mix" is then a result, not a constant. As a cheap fallback: `out = paper · Π (1 − a_i·(1 − C_i/paper))` with `a_i ≈ 0.75 to 0.92` for the *second* film [U].
- **Fluorescents.** Fluorescent Pink `#FF48B0` is out of the sRGB gamut as a print (CIELAB 71, 75, −16 [SW]); the screen hex understates it. Under UV it fades [U]. In design terms treat it as a vivid, light-valued ink (contrast against cream: 2.7:1; against `#141210`: 6.1:1, from the hex alone) that is *light in value*; it needs the darker ink to carry structure.

## 3. The official ink colours

### 3.1 The data and its limits

Source: [SW] ink pages, queried 2026-11-10 through the MediaWiki API (`Category:Riso inks`, 83 members, each with `hex`, `rgb`, `cmyk`, `cielab`, Pantone, and a `series`: *Standard*, *Special Edition*, *Custom*). stencil.wiki itself says hexes are approximations. Two other things:
- **Naming.** There is no `stencil.wiki/colors` page (404). It was the source for the MIT-licensed npm package `riso-colors` (Matt DesLauriers, 2019), which has 78 entries. The two disagree in places (for example *Mist* `#d5e4c0` in the package, `#B8C7C4` on the wiki; *Orchid* `#aa60bf` against `#BB76CF`; *Lagoon* `#2f6165` against `#2F6F65`). The wiki is current; the package is 2019. Use the wiki.
- **Licence.** The wiki is CC BY-NC-SA 4.0. Colour values are facts and a small subset used with credit is low-risk, but the whole table must not be vendored under illum's licence (§7).

The hexes below are from the wiki, `Standard` series first. "Studio stock" is judged from the ink lists of studios whose pages I read ([SW] Hato Press, Colour Code, Knust, Issue Press, Perfectly Acceptable; [S-Moniker]; SAIC).

### 3.2 The inks illum would use

| Ink | Hex | CIELAB | Series | Where it is common |
|---|---|---|---|---|
| **Black** | `#000000` | | Standard | everywhere |
| **Riso Federal Blue** | `#3D5588` | 37, 2, −38 | Standard | Hato, Knust, Issue, PAP |
| **Medium Blue** | `#3255A4` | 36, 14, −48 | Standard | Hato, Knust, Moniker |
| **Blue** | `#0078BF` | | Standard | Hato, Colour Code, Issue, PAP, SAIC |
| **Teal** | `#00838A` | 37, −30, −9 | Standard | Hato, Colour Code, Knust |
| **Fluorescent Pink** | `#FF48B0` | 71, 75, −16 | Standard | Hato, Colour Code, Knust, Issue, PAP, SAIC |
| **Bright Red** | `#F15060` | 55, 66, 35 | Standard | Colour Code, Knust, SAIC, Moniker (Hato lists plain Red `#FF665E`) |
| **Yellow** | `#FFE800` | 90, −3, 90 | Standard | everywhere |
| **Sunflower** | `#FFB511` | | Special Edition | Colour Code, Knust, Issue, PAP, SAIC |
| **Green** | `#00A95C` | 58, −52, 19 | Standard | Hato, Colour Code, Moniker |
| **Orange** | `#FF6C2F` | 67, 56, 63 | Standard | Hato, Colour Code, PAP |
| **Burgundy** | `#914E72` | 41, 23, 6 | Standard | Knust, Issue, PAP, SAIC |
| **Flat Gold** | `#BB8B41` | 44, 6, 30 | Standard | Hato, Colour Code, Knust, Issue |
| **Metallic Gold** | `#AC936E` | 67, 8, 20 | Special Edition (2014) | Colour Code, Issue, PAP, SAIC, Knust |
| **Light Gray** | `#88898A` | 65, 2, 0 | Standard | Issue, PAP, Moniker |
| **Cornflower** | `#62A8E5` | 64, −11, −36 | Special Edition | Colour Code, Knust, Issue, SAIC |
| **Mint** | `#82D8D5` | 82, −31, −7 | Custom | Knust, Issue, PAP, SAIC |
| **Bubblegum** | `#F984CA` | 71, 52, −13 | Special Edition | Knust |
| **White** | `#FFFFFF` | 95, 0, 0 | Custom | Knust, Colour Code, Issue, PAP |

Other standards, for the record: Brown `#925F52`, Hunter Green `#407060`, Marine Red `#D2515E`, Purple `#765BA7`, Red `#FF665E`, Violet `#9D7AD2`. Notable specials: Aqua `#5EC8E5`, Crimson `#E45D50`, Fluorescent Orange `#FF7477`, Fluorescent Yellow `#F7FF00`, Mahogany `#8E595A`, Midnight `#435060`, Indigo `#484D7A`, Copper `#BD6439`, Bisque `#F2CDCF`.

Notes on the inks:
- **Metallic Gold** has "excellent opacity" and "a visible shimmer, from tiny reflective pigments, especially when printed on dark or midtone paper", dries fast and clogs drums [SW]. "It does not matter what color is printed first, Metallic Gold will always look like it has been printed on top" and "we recommend not mixing it with other colors" [S-SAIC]. On cream it is a dull tan (`#AC936E`). Combined with the taste memory (gold only small), use it as a dark-mode accent only.
- **Flat Gold** `#BB8B41` is a mustard-ochre, a translucent standard ink, not a metal.
- **Fluorescent Pink and Orange** are the lightest inks and "weak for small text" [S-OxfordGreenPrint].
- Studios stock only 14 to 27 of the 80-odd inks; the common core is Black, Blue/Medium Blue/Federal Blue, Teal, Fluorescent Pink, Bright Red, Yellow, Orange, Green, a gold and a gray.

### 3.3 Overprint pairs, and the classic two-colour pairings

What I could source: Yellow + Teal = green; Fluo Pink + Yellow = orange (arts.ac.uk guide, search summary); Blue + Red = purple (Moniker, "a starting point for beginners"); the overprint is "a core part of the look" (Shutterstock tutorial). **I found no source that ranks pairs by popularity**, and I cannot confirm any pair is "the classic". Observations from studio ink lists, which are evidence of stock, not of taste:

| Pair | What the overprint gives | Notes |
|---|---|---|
| **Federal Blue + Fluorescent Pink** | deep violet-plum (multiply estimate `#3A1654`, probably lighter in print) | Federal Blue and Fluorescent Pink are on Hato, Knust, Issue, PAP lists. The pink is light in value, so the blue carries the structure. **Recommended.** |
| **Blue + Fluorescent Pink** | a stronger violet | the most-cited riso overprint; a Riso Club mockup uses misregistered blue and pink stripes (uxpilot labs, a generated demo, not evidence). |
| **Bright Red + Teal** | a dark brown-black | complements; warm and cool. Good for a "rubric on aged stock" feel. |
| **Yellow + Blue (or Teal)** | green | Sunflower + Teal is a warmer, more book-like green. |
| **Fluorescent Pink + Yellow** | orange-red | a lively third colour; the pair that makes "heat". |
| **Federal Blue + Bright Red** | near-black plum | nearly a black; useful for text-adjacent ornament that must look like ink. |
| **Black + one spot** | the single-spot tradition: "political parties often printed in black with an accent in their party color" (wetransfer) | Closest to a rubricator's black + red, the strongest link to illum's identity. |

### 3.4 Dark stock

- "Many of our inks, especially metallic gold and white, are only really opaque enough to show up on darker papers" [SAIC, search summary]. Light Gray "can print well on darker papers, such as black" [S-Moniker]. Metallic Gold "looks fantastic on black and any dark paper" [S-SAIC].
- Translucent inks (Fluorescent Pink, Blue, Teal, Bright Red, Yellow) on black multiply to black: invisible. A fluorescent pigment still re-emits light, but a sub-percent of the effect is on a black ground [U].
- Opaque set for dark: **Metallic Gold `#AC936E`, Light Gray `#88898A`, White `#FFFFFF`, Cornflower `#62A8E5`, Bubblegum `#F984CA`, Mint `#82D8D5`, Bisque `#F2CDCF`** (the [SW] opaque list plus Light Gray from Moniker). On `#141210`, from the hex alone: Mint 11.3:1, Bubblegum 8.2:1, Cornflower 7.3:1, Metallic Gold 6.4:1, Light Gray 5.3:1. Real prints of these over dark stock are dimmer than the hex.
- Two honest dark designs: (A) **dark stock + opaque inks** (compose with high-S Kubelka-Munk, not multiply); (B) **ink flood with paper knockout**: a big solid of Federal Blue or Black with the letter, rules and ornament left as bare cream paper (big solids go uneven: the mottle of §2.3 is the authentic texture here).

## 4. Riso design language

### 4.1 What riso makers do

All of it comes from the file-prep guides [S-SAIC][S-CCS][S-OxfordGreenPrint][S-Moniker][S-MICA]:
- **Design in separations.** One greyscale file per ink; the darker the grey, the more ink. A pastel file does not give a pale yellow; a *dark grey* gives a strong yellow [S-SAIC]. Art is built in layers.
- **Bold, flat shapes**, high contrast, large simple masses; reversing out to the paper is cheap. Orange and fluorescent pink are weak for small text.
- **Knockouts and trapping.** The colour shape beneath is drawn slightly larger than the line on top, or the lines over solids. Intentional misregistration appears *as a style*: an offset shadow, a "slipped" second colour.
- **Overprint as a third colour.** Two inks, three colours (plus paper = four values). Designers compose the overlap region as a shape.
- **Halftone gradients** from solid to paper, dots or grain; designers choose screen frequency for effect.
- **Hand-drawn separations**: Mayumi Tsuzuki draws several black-and-white plates per colour (peopleofprint); Daria Tessler's "I like flaws and embrace them".
- **Print furniture**: registration crosshairs, crop marks, colour bars and tint steps are real, usually trimmed off, but common in published zines [U on frequency].
- **Margins**: keep content 7 to 10 mm from the sheet edge. Not a decoration issue for a web page, but a rhythm one: riso pages carry a deep margin.

### 4.2 Good riso versus the Instagram filter

| | Real riso | The "riso filter" |
|---|---|---|
| Order of operations | Separate into inks (Spectrolite; the guides), then print each. | Take a finished picture and add noise and a colour cast. |
| Grain | Dither/screen only where tone ramps; flat solids are flat except for ink-flood mottle. | Uniform noise everywhere, including inside solids. |
| Misregistration | A rigid shift per drum, constant across the page; grows along the feed. | Per-element jitter, or an RGB channel split. |
| Overprint | A third colour from the translucent film; order matters. | Alpha blend or `screen`, or none. |
| Colour | A small spot set; Fluorescent Pink, Federal Blue; paper tone shows. | Teal-orange grade. |
| Content | Bold masses designed for two or three inks. | A photo with a texture. |
| Edges | Crisp 42 µm edges, a slight spread, ink pooled at the rim of heavy shapes [U]. | Blurry, or a hard bitmap threshold. |

No source I found states the filter critique outright; the table is synthesis from the sources on how files are prepared (Spectrolite's page, the Shutterstock tutorial that does "Filter > Noise > Add", CCS's trapping guide). **This is the main taste risk**, because the user's own verdicts reject uniform grain, value noise, and "digital paint".

### 4.3 Where the style sits against the house taste

- The user wants **flat paper, no visible texture**, ornament generated, letters from a credited face, every mark intentional, growth not fade. Riso fits better than most styles: its look is flat shapes in a few inks, and the texture it does have is where a cause puts it.
- **Tarot is already a "stencils slipped off register" style** (the approved Tarot, `playground/tests/tarot.html`, per the project taste notes). Riso must differ in kind: Tarot's slip is a pochoir over a woodcut line; riso's is a drum transform, plus multiply overprint, plus tint screens and a spot-colour palette. If the new style looks like Tarot with different colours, it fails.
- Proven pipeline for letters: **paint the ground, apply the OFL letter, grow in the gaps.** In riso terms: drum 1 prints a block, drum 2 prints the letter, and generated shapes fill the gaps.

### 4.4 Numeric floors drawn from the sources (for a "will it print" check)

- Fine rules: avoid below about 0.25 pt (0.09 mm) [U]. White-on-solid text: only large and bold [S-OxfordGreenPrint].
- Solids: cap at 85 to 90 % density [S-SAIC][S-Moniker]; large dark blocks go blotchy.
- Edge margin: 5 mm minimum from the paper edge, 7 to 10 mm preferred.
- Different-ink text and outline: at least 5 mm apart.
- Trap: about the page's misregistration, 1 to 2 mm at 1×.

## 5. Mark-by-mark proposals

Notation: **D1** is the first drum (printed first), **D2** the second. All marks sit in the page's single transform set (§2.5); an element never gets its own jitter. "Tone" marks use the screen of §2.1 and appear only on ramps.

Palette used below: **ink A = Riso Federal Blue `#3D5588`**, **ink B = Fluorescent Pink `#FF48B0`**, **ink C (optional, third drum) = Yellow `#FFE800` or Sunflower `#FFB511`**.

### 5.1 Drop initial (big)

- **Option 1: Slug and shadow.** A solid block of A (D1, 85 % density, so the flood mottle shows at its edges), the letter knocked out to bare paper. D2 prints B as a rule-bounded offset slab behind it, shifted by the drum transform (about 1 to 2 mm), which overlaps A where they meet as the violet third colour. The OFL face's letter is cut as a counter-hole. Ties to: offset shadows and knockouts in small-press comic/zine covers [U on a specific title]. Fits the user's "paint the ground, apply the letter".
- **Option 2: Overprinted letter.** The letter in B at full ink, laid over a large geometric mass of A (a circle, an arch, or a stepped square), where B-over-A forms the violet letter body. Overlap is the main event. The letter's own shape is lit by the overprint.
- **Option 3: Ramp letter.** The letter is solid A; a generated halftone gradient field of B (dot size grows along the drop's diagonal) sits behind it in the square. Dots exist because the ramp does. Ties to Spectrolite-style separations. Highest risk for the "digital dots" verdict; use a coarse screen and a clean 45° angle, and cap it to the square.
- Size: 3 to 5 lines high, a ground of at least 4.5 em so the drum offset is a small fraction.

### 5.2 Line initial (small)

- **Option 1:** the letter in A with a 0.6 em tint square of B behind it at 40 % (screen), offset by the transform.
- **Option 2:** the letter overprinted twice, once in A and once in B, with the real offset giving a coloured fringe (the 3D-glasses look is the cheap tell; keep the offset below 0.04 em and let the multiply overprint carry it).
- **Option 3:** a plain bold A letter and a B bar under it, the minimal two-drum cell.
- Floor: strokes at least 0.07 em at body sizes.

### 5.3 Paraph

- **Option 1:** a pilcrow in B with an A offset shadow (D2 = A). Overprint at the join.
- **Option 2:** two overlapping discs, A and B, the lens in violet (the Venn mark). The simplest possible demonstration of the process.
- **Option 3:** a filled square that is half A, half B on the diagonal, with a one-dot trap.

### 5.4 Line filler (the free end of a paragraph's last line)

- **Option 1: Bars.** Two parallel bars of different inks, offset by the transform, overlapping at the end; the overlap is a third colour. The bar length equals the free space; stop on emptiness.
- **Option 2: Tint ramp.** A single bar from solid at the text end to bare paper at the margin side, as a screen: dots exist because the bar is a gradient.
- **Option 3: Step wedge.** Four squares at 100, 75, 50, 25 % (a printer's tint step), real print furniture. Cost: the 25 % tint is the most visibly dotted element.

### 5.5 Heading run-out

- **Option 1:** an A rule from the heading's end to the margin with a B rule beneath, misregistered; both end in a crop-mark tick.
- **Option 2:** a registration-crosshair terminal (a circle, a cross), the only place riso's furniture is shown whole.
- **Option 3:** a halftone band that grows from the heading (one ink, a ramp, cell size set by the heading size).

### 5.6 Breaks (three ranks)

- **Small break:** three stepped discs (A, overprint, B) in a row, or one lens (§5.3 Option 2).
- **Major break:** a full-measure band, 4 to 8 mm tall, of overprinted stripes (A and B at a slight angle), the overlap as violet. Keep each ink's density at or below 85 %.
- **End mark:** a solid disc in A with a B disc offset by one transform step, with a registration crosshair in A on top. A "finished sheet" signature that doubles as the colophon device. Ties to riso furniture. Stop growth on a hold.

### 5.7 Frames

- **Quote.** A left rule in A (heavy), a B rule 3 to 4 mm left of it (offset by the transform, not by hand); text clear by at least 5 mm (§2.5). No fill under the text.
- **Figure.** A "sheet" frame: four crop marks at the corners in A and a hard offset shadow slab in B behind the image rectangle. The figure itself is not touched.
- **Code.** A tint panel of Light Gray or Mint at about 25 % (a coarse screen, or none), text above. "Line work over solid blocks … looks best." Because the panel is a tint, it needs a screen (cause: the ramp is a constant 25 %), or else choose a flat panel at a high density. Never a noise.
- **Pull quote.** A flood of A with the text left as paper (reversed), plus a B slab that overlaps one corner, so the corner is violet. The flood carries the authentic mottle; clamp to 85 %.
- **Aside.** A thin outline in B with an A inner rule offset from it; a one-ink box.
- Nav: a row of small discs/lenses, active in violet.

## 6. Typefaces

The drop is a letter, so the face carries the style. Requirements from the taste memory: a **credited OFL face, shapes not drawn by code**. Riso suits bold, flat, high-contrast masses with simple counters. I verified licences from the Google Fonts repository METADATA files (`license: "OFL"`) on 2026-11-10 and the Velvetyne repositories.

| Face | Designer | Licence | Why for riso | Link |
|---|---|---|---|---|
| **Bagel Fat One** | Kyungwon Kim, JAMO (2023) | OFL | Fat, round, big counters; prints well as a knock-out in a block; poster-like. | https://fonts.google.com/specimen/Bagel+Fat+One ; repo `ofl/bagelfatone` |
| **Dela Gothic One** | artakana (2020) | OFL | Heavy Japanese-poster sans; its Latin is thick and tight, fits the Japan-origin of the machine. | https://fonts.google.com/specimen/Dela+Gothic+One |
| **Fraunces** | Undercase Type, Phaedra Charles, Flavia Zimbardi (2020) | OFL | Variable (`opsz`, `wght`, `SOFT`, `WONK`); a soft, warm serif that gives the style a bookish side. | https://fonts.google.com/specimen/Fraunces |
| **Bluu Next** | Jean-Baptiste Morizot / Velvetyne (2014) | OFL (file `OFL_BluuNext.txt` in the repo, Reserved Font Name "BluuNext") | Bold serif with "a strong flavour"; Velvetyne is the open foundry with the closest ties to small-press riso (Hato commissioned Velvetyne's *Fungal*). | https://github.com/velvetyne/BluuNext ; https://velvetyne.fr |
| **Syne** | Bonjour Monde, Lucas Descroix, George Triantafyllakos (2020) | OFL | ExtraBold has a wide, quirky grotesque for poster-ish headings. | https://fonts.google.com/specimen/Syne |
| **Climate Crisis** | Daniel Coull, Eino Korkala (2022) | OFL | A variable "melting" display with a `YEAR` axis; too novel for the drop but fits a heading. | https://fonts.google.com/specimen/Climate+Crisis |
| **Shrikhand** | Jonny Pinhorn (2016) | OFL | A fat italic display script; fits Bubblegum-era riso. | https://fonts.google.com/specimen/Shrikhand |
| Also OFL | Gloock (Duarte Pinto), Alfa Slab One (JM Solé), Bowlby One and Rammetto One (Vernon Adams), Rubik Mono One (Hubert and Fischer), Bungee (David Jonathan Ross), Unbounded (NaN), Bricolage Grotesque (Mathieu Triay) | OFL | Heavy slabs and grotesques that print as solid masses. | `google/fonts` repo, `ofl/<name>/METADATA.pb` |

**Recommend four for the drop, in this order:**
1. **Fraunces** at heavy weight with `SOFT` high: a warm, round serif that sits well with the library's book heritage and gives a "crafted" letter that is not a poster sans. The strongest fit with the "permanent collection" bar.
2. **Bagel Fat One**: for a bold, graphic option with the largest counters (survives a 85 % solid).
3. **Dela Gothic One**: the Japan-poster option; its tight counters need the size floor (§4.4).
4. **Bluu Next**: for the serif/poster hybrid from an open foundry with riso ties. Check the Reserved Font Name: a modified or subsetted file may need renaming under OFL 1.1 (§7).

I did **not** find a source that lists the typefaces riso designers "actually use"; a Velvetyne-and-Hato link (*Fungal*) is the only riso-specific one. This list is chosen for how the letters print (large simple counters, uniform stroke, high contrast), not from a survey. Hand-lettering is common in riso work; we replace it with a face, per the standing decision.

## 7. Risks, rule conflicts and sources

### 7.1 Conflicts with the house rules (all flagged)

1. **"No random dots or speckle."** Riso's identity includes dots. Resolution: dots are allowed only as a **screen or dither of a tone field** (§2.1), never as an overlay. Flat solids carry none. **The conflict is real for the "ramp letter" and "tint step" options (§5.1 Option 3, §5.4 Option 3): both depend on visible dots.** Mark these as the only places dots appear and decide whether the user will accept them. Also: the old note in `02-analog.md` §5.6 ("Floyd-Steinberg grain", "solids × (1 − 0.15·fbm)") describes exactly the filter look and should be superseded by §2.1 and §2.3 here.
2. **Sub-pixel physical grain.** True riso grain is 42 µm: invisible at 1×. Faithfully modelling it would make the style look like nothing at normal size; making it visible means scaling it up, which is a design choice with no physical scale. Choose the coarse screen (0.24 to 0.60 mm cell) openly.
3. **Compositing law.** House `medium.js` composites ink as `paper·exp(−K·d)` (absorption-only), which is right for riso on light stock. On dark stock the same law gives black; opaque inks need an opaque/high-S branch. That is a second compositing mode in the engine.
4. **Dark mode.** The rule says designed, not inverted. Riso has no inverse. Options in §3.4. The fluorescent pink and the blue lose their identity on black; the dark mode is a different palette (gold, gray, white, mint), and "gold only small" applies.
5. **Animation.** Opacity ramps are forbidden. The riso-native growth (§0 item 8) is a front per drum. One more subtle point: the overprint cannot "fade in" either; it appears as the second drum's front crosses the first.
6. **Letters.** Riso work is often hand-lettered; our rule gives OFL faces only. The face must carry style through size, ink and overprint.
7. **Budget (≤200 ms).** Two or three ink layers, each a 2D bake (the pooling already in `10-rubricate.md`: "one per ink colour"), plus a shader that applies the page transform and the multiply: cheap. The risky parts are (a) screens drawn as dense `<pattern>`s (use a shader or analytic dots) and (b) the tone-field blur for flood. I have not measured anything.
8. **Overlap with Tarot** (§4.3). The register slip is Tarot's trick; riso must be distinguished by the drum model, multiply and the screens.

### 7.2 Source and licence risks

- **stencil.wiki is CC BY-NC-SA 4.0.** Hex and CIELAB values are factual and a handful of values with credit is low-risk; do not ship the whole table or copy page text into a permissively-licensed repo. Prefer: ship a dozen inks with their *names* and *our own fitted* values, and credit stencil.wiki.
- **`riso-colors` (npm, MIT)** is a scrape of that wiki and is 2019; the wiki disagrees on several inks. Do not depend on it.
- **"RISO" and "RISOGRAPH" are trademarks of Riso Kagaku Corporation** [U on the registrations]. Nominative use ("a style after risograph printing") is normal; do not use the logo or imply endorsement.
- **Unfetched or only snippet-checked sources:** Riso's MZ1090 spec PDF (failed download), the riso.co.jp site, the `us.riso.com` history page (search snippet), Moniker's colour charts (images, not text), Knust's own pages (fetch returned a domain-for-sale page for knust.nl; the correct site is extrapool.nl), Hato's, Risotto's and Colour Code's own sites (only status-checked). The 2019 package, the Riso HC5000 manual page and the 43/71/106 lpi list are snippets only.
- **Unverified claims in this document** are marked [U]. The biggest ones: dot gain and overprint magnitudes, the direction ratio of misregistration, roller-mark width, tooth skip, the driver's lpi and angles, and every "classic pair" statement. **Before building, take three measurements** on real riso prints (ask a studio such as Hato, Perfectly Acceptable or a local lab for swatches): a solid and a 50 % tint of the chosen two inks on cream and on a dark stock; the overprint patch at 100 %/100 %; a sheet with a long rule and a 10 mm square in both inks to read the translation, rotation and stretch.

### 7.3 Source list

Tags used above.
- **[SW]** stencil.wiki, CC BY-NC-SA 4.0. Pages: *Risograph* (https://stencil.wiki/index.php?title=Risograph), *Ink layer order*, *Elongation-shrinkage*, *Category:Riso inks* and each ink, *Knust*, *Hato Press*, *Colour Code Printing*, *Issue Press*, *Perfectly Acceptable Press*, *Metallic Gold*. Read through https://stencil.wiki/api.php and `index.php?action=raw`. Many tutorial pages there were migrated to web.archive.org and are not readable on the wiki.
- **[S-SAIC]** SAIC Service Bureau, *Everything Risograph* (2024): https://sites.saic.edu/servicebureau/wp-content/uploads/sites/20/2025/03/EverythingRiso_2024.pdf (MZ1090; hex for 15 inks, coverage, passes, bleed, registration, layer advice).
- **[S-OxfordGreenPrint]** *Design for Riso*: https://oxfordgreenprint.com/home/design-for-riso/ (1 to 2 mm miss; 5 mm clearance; 70 % limit; 600/300 dpi; fluorescent pink and orange weak).
- **[S-CCS]** College for Creative Studies Imaging Center: https://campus.collegeforcreativestudies.edu/imaging-center/2021/06/22/risograph-image-options/ and .../registration-trapping/ (Grain Touch vs screen, trapping).
- **[S-Moniker]** Moniker Press colours: https://www.monikerpress.ca/colours/ (opacity notes; no hex).
- **[S-MICA]**, **[S-Illinois]**, **[S-NextChapter]**: https://www.mica.edu/campus-life-and-resources/places-and-spaces/maker-spaces-fabrication-studios/printmaking-studio/risograph-file-prep/ ; https://web.faa.illinois.edu/app/uploads/sites/6/2021/05/riso_print_guide.pdf (not fetched, search summary only) ; https://nextchapterstudio.com/blogs/news/risograph-101-removing-unwanted-stripes-from-prints (idle-drum stripes).
- **History:** https://www.risoprinter.de/en/company/history ; https://riso.com.hk/%E6%AD%B7%E5%8F%B2-1945-1954-%E5%A4%96%E5%82%B3/ ; https://www.itsnicethat.com/articles/the-view-from-tokyo-risograph-in-japan-print-graphic-design-261124 ; https://wepresent.wetransfer.com/story/tools-of-the-trade-risograph ; https://www.commarts.com/columns/the-rise-of-riso ; https://en.wikipedia.org/wiki/Risograph ; https://en.wikipedia.org/wiki/Riso_Kagaku_Corporation .
- **Forums (anecdotal):** copytechnet.com digital-duplicator threads on MH9350 skew and fading drums.
- **Colour data package:** https://www.npmjs.com/package/riso-colors (MIT, 2019).
- **Fonts:** https://github.com/google/fonts (`ofl/<name>/METADATA.pb` for each face above); https://github.com/velvetyne/BluuNext ; https://github.com/velvetyne/Sporting-Grotesque (OFL, Reserved Font Name "Sporting Grotesque"; not recommended here, listed only because it was checked); https://velvetyne.fr/about/faq/ (Velvetyne: libre fonts; credit designer and foundry).
- **Internal:** `research/02-analog.md` §3.3 and §5.6 (earlier riso notes, to be superseded); `research/10-rubricate.md`; `research/18-tells.md`; `research/21-paint.md` (KM engine, reusable here); `research/24-pie.md` (rank map and the dark-section precedent).

### 7.4 Build order I would suggest

1. Measurements (§7.2) and the ink table with fitted K/S for six inks.
2. The page transform per ink, applied to a flat test sheet: two rules, a square, a disc. If that already reads as riso at 1×, the style works; if not, noise will not save it.
3. Overprint with the KM compositor; compare to the measured patches.
4. The drop in Option 1, then the screens.
5. Dark: opaque set and the knockout flood.
6. Growth: the per-drum front.

## Stage 1: the press and three directions (tests/riso-directions.html, tests/riso-medium.html)

**Name.** "Riso" and "Risograph" are Riso Kagaku's marks, so the style is proposed as **Duplicator** (the generic name
of the machine class, the stencil duplicator); the file prefix stays `riso-`. Not registered in kit/illum.js yet; no
shared file was changed (kit/medium.js is not used: its pen and absorption-only law fit neither the stencil nor dark stock).

**Corrections to the research above.** Fraunces (§6, recommended first) is on our own list of generated-design tells
(18-tells, "the editorial default"), so it is not used. The symmetric "thinner middle, heavier edges" of a solid (§2.3's
model) was built and read as a vignette (an inner glow round every block, and a halo round letters cut from a flood);
it is off by default. The drawdown along the feed is kept, and it is ours, not sourced [U].

**The press** (kit/styles/riso-press.js, ~150 lines, no dependency, no WebGL). A piece is plain vector shapes per drum
(Canvas2D, so a typeface glyph is a stencil for free), rasterised at device resolution and composited per pixel:
- *Stencil.* Coverage is the shape's own antialiased edge; solids have no grain. Knockouts are `destination-out` in the
  drum's own stencil.
- *Miss.* `drumSet(seed)`: drum 1 is the key (registered to the text); drum 2 is one rigid transform for the whole sheet:
  0.45–0.95 mm shift (dy larger), ±0.07°, ±0.2 % stretch along the feed, pivot at the lead edge's middle. Each piece is
  given its place on the sheet, so neighbours miss alike and the miss grows down the page.
- *Film.* In linear light. Translucent inks: transmission t^τ per channel, t the swatch on white (two passes through the
  film). Opaque inks (Cornflower, Bubblegum, Mint, White, Light Gray): hiding 1 − exp(−σ τ), σ ≈ 2. This one law covers
  both stocks, so dark mode is not a second engine: translucent inks vanish on black because they have nothing to filter.
- *Trap.* Drum 2's film is τ × 0.8 where drum 1's ink lies (wet on wet). The bench shows the plain multiply beside it.
- *Starving.* A heavy solid draws the drum's supply down: τ falls by up to 14 % along the feed behind it (an exponential
  over ~60 CSS px of the cells' own coverage, softened across the feed and normalised so a solid's sides get no rim),
  recovering over bare sheet. Below a cut, less is drawn down: a soft ghost along the feed, the duplicator's own.
- *Screen.* Only where a piece gives a tone (0 < T < 1): a 45° Euclidean round dot fixed to the page under the drum's
  transform, its threshold antialiased analytically. T = 1 is solid, T = 0 is paper.
- *Output.* sRGB colour with the alpha that reproduces the result exactly over the stock (the host's own ground).
- *The pass* (`writer`): the sheet goes through once. Drum 1's nip is a straight line moving down the sheet at
  0.55 px/ms; drum 2's nip trails it by 320 CSS px (the drums' spacing); each piece re-lays only the rows a nip crossed.
  Nothing fades or pops; the overprint appears where the second nip crosses the first ink.
- Not modelled yet: paper tooth (sub-pixel at 1×), roller tracks, wet-on-wet pick-up muddying (run position), dot gain.

**A · The overprint** (riso-overprint.js; Gloock, Duarte Pinto, OFL). Federal Blue `#3D5588` (drum 1: letter, rules)
under Fluorescent Pink `#FF48B0` (drum 2: masses); the crossing is the violet third colour. Drop: the capital before a
pink sun, sunrise, arch or fan (by seed). Paraph and break 1: two discs and their lens; break 2: three discs on a rule;
break 3: two great discs in conjunction, the horizon running out in each ink to its own side; quote: blue rule, pink
behind its outer half. No dots. Dark: Bubblegum then Cornflower (opaque), the order swapped so the letter is on top.

**B · The flood** (riso-flood.js; Dela Gothic One, artakana, OFL). Teal `#00838A` floods a solid and the design is cut
from it; Bright Red `#F15060` is laid into the cuts a trap wider, or off them as a shadow. Drop: a block with the capital
cut out, the red capital laid down-right of the cut (red where it meets paper, near-black where it crosses teal, a
cream sliver where it misses). Paraph: a square with its red dot; filler, run-out, quote: bars with a red channel;
breaks: a lozenge with a red heart, a slug with channel and dots, the sun cut from a block with the red sun off it. The
only direction where the film's drawdown is visible. No dots. Dark: Mint (opaque) on black, Red unchanged; it shows on
the Mint and sinks into the bare black, so the cut letter reads dark with a maroon shadow.

**C · The screen** (riso-screen.js; Alfa Slab One, JM Solé, OFL). Sunflower `#FFB511` carries ramps (drum 1), Medium
Blue `#3255A4` the letter and rules (drum 2). Dots only in ramps, on a coarse 17 lpi screen (cell 0.3 em). Drop: the
capital knocked out of a sunrise whose tone rises from the baseline (choked by 0.03 em so the miss shows as a hairline
gap, not a green rim); filler and run-out: a band solid from the words, its tail running out as dots; break 3: a
sunrise on the blue horizon; quote: a rule and a column whose tone runs out. Dark: White (opaque) ramps, Cornflower letter.

**Timings** (Chrome, this machine, whole specimen sheet: drop, paraph, filler, run-out, three breaks, quote; CPU only):
dpr 1: A 16–31 ms, B 22–42 ms, C 22–32 ms; dpr 2: A 31–48, B 32–76, C 40–55 ms (the first panel includes JIT warm-up).
The bench (≈45 patches) prints in ~200 ms at dpr 1. The pass costs one row band per piece per frame.

**My read.** B is the most convincingly *printed*: knockout, trap and shadow are what a duplicator does and nothing else
does, and the flood is the one place the film can show. A is the quietest and most legible on a text page; its
conjunction break is the best single piece, but its small pieces are close to flat vector. C answers the dots question:
the large sunrise earns its screen; the small ramps (filler, run-out, quote) are busier than the page needs. Distinct
from Tarot: no keyline anywhere, the colour *is* the form, the overprint is a colour of its own, and the miss is one
sheet-wide law rather than a stencil slipped under a line.

## Stage 1b: the ink poured, A and B only (the owner: "the art deco did a great job of feeling like a print and that is absent here")

C (the screen) is dropped, its module and the press's screen with it. A and B are printed two ways from the same shapes
and the same sheet (`?ink=flat|poured|both` on tests/riso-directions.html, `?ink=` on the bench), so the ink is judged alone.

**Real prints, measured** (Wikimedia Commons; crops in playground/tests/riso-refs/ with CREDITS.txt; reference only):
- Mario Felipe, two-colour risograph, A3, 2014 (CC BY 2.0), ~2.1 px/mm, white-balanced to the sheet: the red's edge
  goes from paper to full within one pixel (≤ 0.5 mm, the photograph's limit); black solid L 22.6, slow sd ~1.7 L; the
  red clips the camera's red channel (so no film numbers from it); the pink panels are dithered tints with a cloudy mottle.
- Quinn Daedal, a studio sheet fresh off the drum (CC BY-SA 2.0): every solid streaked along the feed and softly mottled;
  edges crisp; overprints mixed. Every shape is drawn or cut by hand (leaves, splats, flowers): none is a compass circle.
- Cetrl, macro of a red solid (CC0): the paper's tooth all through the film, as fine fibre-scale flecks.
- Not measurable from what is reachable under an open licence: a solid's variation in numbers, an overprint's colour.
  A flat 600 dpi scan of a known two-ink swatch sheet is still the missing reference (§7.2).

**The poured ink** (kit/styles/riso-press.js `pour`). The same route as Deco (research/22-deco.md, "the medium first"):
the stencil becomes a deposit poured into the ink engine (kit/medium.js), which creeps it into the fibre, levels and
dries it. Two differences, both because riso inks are translucent: (1) the engine runs on riso's own sheet (a second
`createMedium`, not kit/inkletter.js's shared one, which renders "over" a ground for opaque gouache), rendering a neutral
ink by multiply so the film `d` can be read back exactly; (2) that film goes through the stage-1 film law, so the
overprint stays a translucent mix and the trap still applies. The deposit, per cell:
- coverage: the drum's stencil through the drum's miss;
- ink: the drum's supply (the drawdown along the feed, stage 1) × the drum's own unevenness, streaks along the feed
  (±5 %, ~5 px across, ~70 px along; the squeegee feeding the screen unevenly across the drum's width) and a slow mottle
  (±4 %, ~25 px); seeded per page and drum, in page coordinates;
- dryness: 0.26, more where the supply is drawn down (+1.1 × the shortfall): a thin soy film catches the tooth's peaks,
  so the tooth shows low in a heavy solid. (0.36 read as worn grunge at 1×; kept below.)
- wetness 0.14, 14 steps of 16 ms. Dark: Deco's dark law (an opaque, lighter ink laid over the ground, its hiding from
  the film: the engine's 1 − exp(−3d), our 1 − exp(−σ τ)), applied in riso's own compositor, not through kit/inkletter.js's
  shared medium (locked in "over" mode, which would make the light-stock overprint opaque). So it reuses Deco's law, not
  its code, and the page has one more WebGL context (one per page, reused by every piece).

**Seeds.** A and B each take a page's hand from the seed, followed by every piece, so the page agrees with itself. A: the
axis every pair of discs crosses on (0°, ±45°, 90°), how deep, which ink leads, a break's beats (3, 5, 7), the side a band
rides, a rule's weight, the drop's mass. B: the hole's shape (round, lozenge, square), single or double channel, how bars
end (square, point, round), the shadow's side, the sun's rays (none, 8, 12, 16). The directions page shows six seeds.

**The geometry probe.** `opts.drawn` in riso-overprint.js redraws A's same composition with every shape cut by hand:
circles whose radius breathes ~2.5 % in two slow waves and are a little out of round; straight cuts leaning by their own
small angle (Deco's measured ~0.8°, held to a rule on a long bar), corners rounded by the blade. Poured, labelled.

**Timings** (Chrome, this machine, one sheet's every piece, poured): dpr 1, A 46–123 ms, B 44–80 ms; dpr 2, A 77–132 ms,
B 95–130 ms. The first panel on a page carries the engine's shader compile (~40–60 ms). Flat stays 12–64 ms.

**Known gaps.** The macro's tooth is finer and stronger than ours: the engine's paper is a field ≥ 2.5 device px, so at
6× our solid is smooth where the real one is fibrous (at 1× both read as fine). Stencil.wiki's Bright Red reads duller
than the photographed red. The dithered tint (the pink panels in Felipe's print) is a large part of the real look and is
out by the owner's decision on dots.

## Stage 2: the overprint, cut (the owner: poured ink only; B dropped; "sun, leaf, etc.")

riso-flood.js and its section are gone; the directions page (tests/riso-directions.html) shows only A, poured. The flat
compositor stays on the bench (`?ink=flat`) as a reference.

**Geometry.** Every shape is cut, after the studio sheet in tests/riso-refs (leaves, suns, strips; no compass anywhere).
One primitive, `cutShape`: a closed run of cuts, each a knife's straight run (sagitta 0) or a scissor's long arc (a cubic
whose two control offsets differ by up to ±30 %, so the bend is not even along the cut), meeting the next cut at a corner.
No jitter along an edge: the hand is in where the cuts start and end and how each bends.
- sun: 7–11 scissor cuts round (vertices ±15 % of a step apart, radius ±2.5 %, each cut's bend 0.8–1.2 × a circle's), rays
  as knife-cut wedges at 1.14–1.7 R; a rising sun is the half above the horizon, its base one straight cut
- leaf: two long scissor cuts to a point and a short straight cut across the stalk; a big leaf has its vein cut back out
- strip: two long knife runs (lean ≤ 0.2 %) and its own two end cuts (oblique 20–37°, a swallow's notch, or near square);
  a strip has body: 0.16–0.38 em, never a hairline
- hill: a knife's base, its top four scissor cuts; seed: four short scissor cuts round a lozenge

**The page's hand** (`hand(seed)`, followed by every piece): motif (suns or leaves), the drop's mass (sun, sunrise, leaf,
hill), strip ends, cuts round a sun (7–11), rays (none, 7, 9, 12), a break's beats (3, 5, 7), a lean, a weight, a side.

**The pieces.** Drop: the Gloock capital in blue crossing the cut pink mass. Paraph and break 1: the page's pair (a pink
sun with a blue seed across it, or a blue and a pink leaf in a V). Filler: a blue strip closed by a pink sun or leaf across
its end. Run-out: a wide pink strip under a blue one, the pair at the end. Break 2: a chain of cut shapes on two strips,
the inks alternating, the middle largest. Break 3: a sun rising behind a cut hill on the horizon, rays by the hand, two
veined leaves at its foot on a leaf page or a seed on a sun page, the horizon run out in strips. Quotation: a blue strip
and a wider pink one beside it, each cut at its own ends (a mark at its head read as a candle flame; removed).

**Ink, dark, timing.** As stage 1b, poured. Dark: Bubblegum then Cornflower on black. One sheet's every piece: 107–131 ms
light, 62–78 ms dark at dpr 2 (the first panel includes the engine's shader compile).

**My read, at 1× and 4× beside the refs.** It now reads as a cut separation printed, not a vector diagram: the suns and
leaves have the scissor's corners, the strips their cut ends, and the poured film streaks along the feed under them. Still
short of the studio sheet: its shapes are freer (splats, stems, irregular flowers) and its blue is a stroke, not a strip.
The paired leaves at paraph size read as two petals. Next: a third motif (a flower of five cut petals), a stroke cut as a
long tapering strip, and the sun's ray count tied to its size.

## Stage 3: grain, dark mode, the small marks (the owner: "more gritty/grainy"; "dark mode not working at all"; the
## paired leaf/sun "makes no sense")

**Dark mode: the root cause.** tests/riso-directions.html never read the theme. Outside `?bare` it ignored
`prefers-color-scheme`, `<html data-theme>` and `?theme` (what kit/theme-toggle.js sets), and it did not include the toggle.
On a desktop set to dark, the whole page stayed cream, its light specimen first, with one fixed dark panel beside it, so
nothing switched. The dark inks also had no character: the opaque law (σ 2.2) saturated, hiding the film's variation, so
the poured streaks vanished into flat pastel. Not a GPU or context problem (the dark panel rendered; one riso context per
page). Fixed: the page takes `?theme`, else `data-theme`, else the system scheme (live), puts that theme's panel first,
darkens its own chrome, and carries the toggle. Opaque inks now σ 1.5 (a full film hides ~76 % of the stock, so its
variation and grain show the black through), and the grain below applies to them too.

**Grain, measured** (tests/riso-refs/cetrl-macro.jpg and its closer crop, CC0; the scale from the zine's own bitmap
pixels, ~8 photo px each, so the mm are [U] on an assumed 150 dpi bitmap): a solid's fine variation sd 4.4–8.9 L at mean
81–91 (5–10 %); correlation half-width 2–3 photo px, near isotropic (x = y; the diagonal no longer); ≈ 0.05–0.1 mm, the
order of a paper fibre and of the master's 600 dpi pitch; light pinholes (> 2.5 sd) 0.7–0.9 % of a solid's area; the
variation 1.3–2.4× stronger at edges, where the film is thin. No grid shows.

**Grain, modelled** (riso-press.js `grainOf`, applied to the film read back from the engine, so it follows the film):
- fibre: a page-anchored field (fibres 0.07 × 0.15 mm along a per-sheet grain direction, over a 0.045 mm isotropic tooth);
  where a fibre stands high the film over it is thinner (film sd ~6 %); the part finer than a device pixel is averaged
  away, so at 1× it is a fine grit and at 4× its clumps show;
- pinholes: where the film is too thin to bridge the hollow between fibres, ~70 % of the ink skims off; the threshold is
  set from the field's own quantiles to give 0.8 % of a full solid and ~10–25 % as the film thins (edges, drawn-down
  solids);
- the master: the thermal head's holes at 0.042 mm, area-filtered to the pixel, so it vanishes below ~6×.
The bench (tests/riso-medium.html, section 0) shows the macro beside our red solid at 4× and a cut solid at 4×.

**The small marks.** The paired leaves and sun-with-seed are gone everywhere. Each small mark is one cut shape in one ink:
a sun (7–9 scissor cuts, 8–12 knife rays; pink), a star or asterisk (5, 6 or 8 knife-cut points; blue), a pointing hand
(the printer's manicule cut from one sheet, its cuff a separate cut; blue), an arrow (shaft and head one cut, barbed on a
swallow-tail page; blue). The page's hand picks one; `?mark=` fixes it; the page shows all four in place (paraph, filler,
run-out, breaks 1 and 2). Filler: a strip and the mark after it (an arrow page: the strip is the arrow's shaft). Break 2:
suns and stars as a spaced chain, the inks alternating; hands and arrows as a pair pointing in at a star. The overprint
stays only where it has room: the drop, the run-out's strips, break 3. The quotation is two strips, no head.

**Timing** (one panel, cold, shader compile included; grain on): dpr 1, 87–135 ms; dpr 2, 131–152 ms.

## Stage 4: no dots; the hand; breaks as print furniture (the owner: the grain "feels like ugly dots"; the hand approved
## as the selector mark; "the break with the sun/star/cloud still sucks")

**Grain.** Every discrete speck is gone: the pinholes, the master's grid, and the engine's own tooth-skip (the deposit's
dryness is 0: the engine's catch on the tooth skipped cells and read as flecks). What stays is continuous: the film's
density varies at the fibre's scale (fibres 0.07 × 0.15 mm over a 0.045 mm tooth, sd ~6 %, averaged below a pixel), the
drum's streaks along the feed and its slow mottle, and the edge where the ink creeps and thins. Nothing is taken out of
the film anywhere. The bench (tests/riso-medium.html section 0) shows two levels side by side, none and continuous tooth,
at 4× beside the macro and at 1× light and dark; the directions page takes `?grain=none`.

**The small mark** is the printer's pointing hand (the manicule, cut from one sheet, its cuff a second cut), one shape in
blue: the paraph, and the close of the filler and the run-out. The sun, star and arrow marks and `?mark` are gone.

**Breaks** are print furniture, not pictures (no suns, hills, clouds, stars or leaves). Three forms a rank, labelled on the
directions page (`brk(k, …, v)`, the page's own chosen by the seed):
- rank 1: a the hand; b two hands facing; c the hand at the end of its strip (one ink each: no overprint at this size);
- rank 2: a two bands crossing at a shallow angle, violet where they cross; b blocks overlapping (a pink block between two
  blue, two violet squares); c a banded rule (a wide pink band under a blue rule, a blue block at its middle);
- rank 3: a two broad bars crossing, each running on to the measure in a strip of its own ink; b the part's numeral in
  Gloock, blue, half on a cut pink block, strips out to each side; c registration furniture: a long overprinted bar
  between two cut registration marks printed by both drums, so the sheet's miss shows in them as it does on a real sheet.

**Kept:** the poured ink, the drop with its cut mass, the theme-following dark mode, the seed's hand (now: the drop's mass,
strip ends, each rank's form, tilt, weight, side). **Timing** (one panel, cold): dpr 1, 81–125 ms; dpr 2, 154–175 ms.

## Stage 5: Duplicator joins rubricate (kit/styles/riso.js; tests/riso.html, tests/riso.check.mjs)

The owner: "The riso is working. Refine it, optimize it, add levels of richness, ship it." Display name **Duplicator**;
internal key `riso`. Breaks: a part's (rank 1) the hand; a chapter's (rubricate rank 3) bands crossing in violet; the end
(rubricate rank 2) the overprinted bar between registration marks; at fine, variety (two hands facing, blocks overlapping,
the part's numeral on a cut block). Continuous tooth (stage 4) throughout.

**Every mark.** The drop (Gloock subset in fonts/riso/, its cut mass held to the letter's own box, never narrower than .95
of its height); the line's initial (the letter, a short cut pink strip along its foot); the paraph (the hand, set into the
indent's left room); fillers and run-outs (a strip and the hand; a short run-out the hand alone); three breaks; quote
(strips down the margin), pull (bands crossing above, below too at lavish), aside and code (banded rules), figure
(registration marks at its corners, printed by both drums), contents (blue ticks).

**Five levels**, as a small press goes from a one-colour flyer to a deluxe edition: plain prints one drum only (blue); modest
adds the pink drum (the drop's mass, the line initial's strip), hands at fillers on well-open lines, the quote's rule, the
contents' ticks; usual adds the run-out's band, the quote's second strip, the pull quote's bands, aside and code rules, two
registration marks at a figure; fine adds the breaks' variety and all four marks; lavish adds the pull quote's lower bands,
the aside's and code's foot rules, the hand on its strip.

**Registration.** The blue is always the key drum (registered to the text), in the dark too, where it prints second over the
opaque pink: otherwise the letter and the hands took the sheet's miss and touched the words.

**Ink.** The textured path (the drum's streaks along the feed and slow mottle on a 2 px grid, the continuous fibre tooth
from two page-anchored tiles of coprime sizes, the drawdown on pieces ≥ 40 px both ways, the film law) is the default:
at 4× it is not told apart from the engine-poured path, and it needs no WebGL context. `STYLES.riso.pour = true` pours
large pieces through kit/medium.js as stages 1b–4 did.

**?draw.** Each piece is two pours, drum 1 over the stock and what drum 2 adds over that (`pressSplit`), each revealed behind
a straight front moving down the piece (the nip), drum 2 starting a beat behind; nothing fades.

**Timing** (tests/riso.html, the whole page's ornament, cold, best of four on a loaded machine): dpr 1: plain 55, modest
77, usual 76, fine 74, lavish 82 ms; dpr 2: 81, 117, 113, 134, 139 ms.

**Check** (tests/riso.check.mjs): every level × seeds 1, 2, 3, 7 × 1440 and 390 × light and dark, the full line boxes
against every inked pixel and the page's edges: 160 pages pass.
