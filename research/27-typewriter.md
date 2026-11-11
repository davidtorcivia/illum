# 27 · The typewriter: the strike on the platen

Typewriter art and concrete poetry, c. 1898 to now, as a rubricate style. The canon is Houédard, Chopin, the Garniers, Cobbing, McCaffery, Andre, Wolf-Rehfeldt, Finlay and Mayer (the last two only adjacent, see §1), with Stacey, Nelson and Paul Smith as the amateur and office line, and ASCII and RTTY art as a later branch. This is stage 1: sources, mechanics, composition, mark proposals, palette, risks. Nothing is built, no code was written, and no other file was touched.

**Legend.** Facts without a tag were read in a source during this pass (the source is named). `[unverified]` means not confirmed in a primary source this pass, or taken from memory or a search summary. `[inferred]` means reasoning or arithmetic by the author of this file, not a citation. Many fetches returned thin text (Wikipedia stubs, 403s from MoMA, Dia, Chinati-adjacent pages); where that limits a claim it is said.

## 0. The verdict in twelve lines

1. **The style rests on a machine with a fingerprint.** A page typed on one machine has one set of per-key faults (this `e` sits 0.1 mm high, that `a` leans left, the `o` is always half-filled). Those faults repeat on every strike of that key. They are the "causes". Random per-strike jitter is the digital tell, and a font with a filter has no fingerprint.
2. **The grid is exact and that is authentic.** Escapement steps the carriage in fixed units (pica 10 cpi, elite 12 cpi) and the platen steps 6 lines per inch. The user has already called an exact lattice with tame wobble "digital" (illum-taste, Insular). Here the lattice is the medium. The hand shows in force, ink, per-key faults and the composer's decisions, never in wobbled positions.
3. **Letters come from one master face, `Courier Prime` (OFL, advance exactly 0.6 em).** Reject Special Elite: it is not monospaced and its outlines carry baked-in roughness (measured in §6.1). That is a hard conflict with two house rules.
4. **The typed grid maps onto illum's `lh` grid.** Pica: character pitch = 0.6 × row pitch. With Courier Prime at font-size = `lh`, one cell is 0.6 `lh` wide and 1 `lh` tall. Elite is 0.5 `lh` wide.
5. **The bichrome ribbon is rubrication.** Pitman's typewriter manual (1897) called it "variegated typewriting": red for emphasis, black for text. Map `--ink` to ribbon black and `--rubric` to ribbon red.
6. **The typist's own rank ladder** (Walker 2017) already is illum's law "rank follows the text": SPACED CAPS UNDERLINED > SPACED CAPS > CAPS UNDERLINED > CAPS > Upper-lower underlined > Upper-lower. Build heading run-outs and break ranks from it.
7. **Overstrike is growth.** Tone is made by passing over the same cells again. A solid that darkens in passes 1, 2, 3 is an animation that grows and never fades.
8. **The task's premise on M and W is backwards.** The one patent that speaks to it says small characters print more forcibly under equal force (§2.1). The correct model is density = force / glyph contact area, with the typist compensating by hand.
9. **Dark mode has two real answers:** opaque white cover-up pigment on black stock (the Correcting Selectric's Cover-Up tape), or blind impression (ribbon off, paper only) lit by raking light. Neither is an inversion.
10. **Biggest risks:** the "typewriter font" cliché; terminal/ASCII reading as the rejected "Cyber"; mosaics of characters reading as a dot-matrix bitmap; ornament made of letters being read as text.
11. **Rule conflicts** are listed in §8: ornament built from font glyphs, a periodic weave, "grows never pops" against an instantaneous strike, and Special Elite.
12. **Untested claims** are collected in §9.

---

## 1. History and canon

### 1.1 Before the avant-garde: the office and the amateur

| who | work | date | machine, medium | notes and where to look |
|---|---|---|---|---|
| Flora F. Stacey (1845 to 1909) | a typed butterfly in a frame, prize entry | *The Phonetic Journal*, 15 Oct 1898 (Alex Hamilton's 1975 *Guardian* piece gave the 16th; corrected) | Royal Bar-Lock typewriter | She was 53, a teacher of typewriting and shorthand in Earl's Court, not "young". A 1904 syndicated story ran in 50+ US papers; the Chicago Sunday Tribune and Boston Globe ran typewriter-art contests (Feb 1904 by file names). Forgotten until Alan Riddell's *Typewriter Art* (1975), which followed his 1974 Barbican Concourse Gallery show. Source: oztypewriter.blogspot.com/2020/02/flora-fanny-stacey-1845-1909-worlds.html. Contemporary notice, not read: paperspast.natlib.govt.nz/newspapers/OW18980922.2.193. A Wikipedia line dates typewriter art to 1867 with "better source needed"; `[unverified]`. |
| Julius Nelson | *Artyping* | 1939 (Artyping Bureau, Johnstown, Pa.); 2nd edition 1962 (Artistic Typing Headquarters, Baltimore) | manual typewriter | Nelson taught "Secretarial Science" at Windber High School. Contents per Lori Emerson's post: a border tutorial for the novice, cut-outs, lettering, cross-stitch patterns, letterhead, a portraiture tutorial for the advanced typist. Last line: "like stamp collecting, 'art typing' may easily turn into a profitable hobby." The brief says "manuals"; only this one title surfaced. A PDF is hosted on loriemerson.net/2014/01/26/artyping-in-1939/. Copyright status unstated and WorldCat found no copies: study only, do not redistribute or trace. Catalogue: archives.albany.edu/books/catalog/990005571500204808. The subject-matter list (shading, rotation, half-spacing) is not in any page read. `[unverified]` |
| Pitman and other typing manuals, 1890s to 1960s | exercises in "display", centred headings, borders, red emphasis | Pitman 1897 on "variegated typewriting" | | Sue Walker, "Modernity, method and minimal means: typewriters, typing manuals and document design", *Journal of Design History* 2017, doi:10.1093/jdh/epx018 (open copy: centaur.reading.ac.uk/69514/). She states that "many typing manuals contained exercises for creating borders and decorative elements for insertion into the text, using characters and character combinations, and that heralded what is now known as 'typewriter art'" (footnote 39 points to Kostelnick for examples; her footnote year reads 1994 in the text I read while the Kostelnick article I could find is 1990; `[unverified]` which). No individual 1930s to 60s border manual was identified by title. |
| Bette Nesmith Graham | Liquid Paper correction fluid | selling 500 bottles a week in 1956 by one account; named 1958 and patented that year by another | | The sources disagree on the date. Sold to Gillette 1979 for $47.5M or $48.5M, same disagreement. Wikipedia: en.wikipedia.org/wiki/Bette_Nesmith_Graham. |
| IBM | Correcting Selectric II, Lift-Off tape, Cover-Up tape | announced 1973 | | Selectric introduced 31 July 1961; Lift-Off tape works with Correctable Film ribbon whose binder does not bond permanently to the paper; white Cover-Up tape goes with other ribbons (Wikipedia, IBM Selectric typewriter). |

### 1.2 The concrete-poetry and typestract canon

"Typewriter" here is a narrower filter than "concrete poetry". Of the names in the brief, Finlay and Mayer worked mostly in print (letterpress, offset, Futura-based "typoems"); they are adjacent and give a typographic counterpoint, not typewriter models.

| who | work | date | machine and medium | where to look, and image licence |
|---|---|---|---|---|
| **Dom Sylvester Houédard** ("dsh", 1924 to 1992, Benedictine monk) | *typestracts* ("typewriter" plus "abstract"). *Sonic Water* (dsh 291064), *Transfer Module*, *Typescript 140469*, *Typestract 300367*, *Orbor ooo 030567*, *italic ode* | 1960s to 1971; titles are ddmmyy dates (291064 is 29 Oct 1964; 140469 is 14 Apr 1969; 300367 is 30 Mar 1967; 030567 is 3 May 1967) | The V&A record says all his typewriter "drawings" from 1950 to 1970 were made on an **Olivetti Lettera 22**. Machine pitch unknown; Lettera 22 shipped in pica and elite (a 1953 unit on Typewriter Database has the default face "Imperial Eletto", elite, 12 cpi). | **PAMM** (Sackner purchase): *Sonic Water*, 1964, "typewriter ink on paper", 7 × 8½ in., acc. 2016.253. "The text is comprised of single repeated letters rather than words", lowercase, forming **ten nested squares two letters wide, built from the letters of the title** (pamm.org/en/artwork/2016.253/). **V&A** CIRC.133-1970, *Transfer Module* (1969), 21 × 29.7 cm: three circles of widely spaced dots or "o" keys, small at the top, large at the bottom, a cross of "o"s at each centre; the record also links his work to the grading of Islamic calligraphy from cursive naskhi to abstract arabesque (collections.vam.ac.uk/item/O167878/). **Tate**: one holding, "no title", 1966, Prints and Drawings Room by appointment (tate.org.uk/art/artists/dom-sylvester-houedard-17788). **Richard Saltoun Gallery**: *Typescript 140469*, 1969, 29.7 × 20.8 cm, "ink typed on paper", described as three-dimensional in appearance, **built from dense typed underline marks in red and black** (richardsaltoun.com/artists/218-dom-sylvester-houedard/). **MoMA**: *OU Cinquième Saison* no. 22, 1964, with contributions (moma.org/collection/works/273919). Largest holding: the Sackner Archive (Design Observer); his archive is at the John Rylands Library, Manchester. Further reading: *Notes from the Cosmic Typewriter* (ed. Nicola Simpson, essay by Rick Poynor; not accessed). Estate images are in copyright; museum online terms vary (V&A: non-commercial, up to 768 px, five years). **Study and reconstruct from description; never embed or trace.** |
| **Henri Chopin** (1922 to 2008) | *dactylopoèmes*, typewriter poems; *La crevette amoureuse* (1967 to 73, shown in MoMA's *Ecstatic Alphabets/Heaps of Language*, 2012); editor of *Cinquième Saison* and *OU* (1958 to 74) | 1960s to 70s | Machine not named in any page read; the brief's "Olivetti" is `[unverified]`. Overstrike, layered tonal fields and rotated sheets are widely said of his work `[unverified]` here: not in the pages read. | Held by Conz (Verona), the Morra Foundation (Naples), the Sackner Archive (Wikipedia). MoMA holds several *OU* issues (e.g. moma.org/collection/works/273921). MoMA's Hoptman PDF: moma.org/interactives/exhibitions/2012/ecstaticalphabets/. Estate images in copyright. |
| **Pierre and Ilse Garnier** | *Poèmes mécaniques* (Éd. André Silvaire, 1965), the first volume of the series "Spatialisme"; took over the review *Les Lettres* in 1962; Pierre's manifesto "pour une poésie nouvelle visuelle et phonique" in *Les Lettres* no. 29 (sources say 1962 or January 1963) | 1962 to 65 | Mechanical poems; Solt's essay says the typewriter suited the work because it allows "objectivation, the introduction of speed to the concept of poetry, superposition, the progression of spaces" (ubu.punctumbooks.com/papers/solt/france.html) | MAMCO: mamco.ch/en/2076/Ilse-Garnier. Fondazione Bonotto record for *Poèmes mécaniques*. Dates of death conflict between sources (2014 or 2016 for Pierre); Ilse 1927 to 2020. |
| **Bob Cobbing** (1920 to 2002) | *ABC in Sound* (1964), *Processual* (1982 to 85, photocopier); Writers Forum press from 1963, 1000+ titles | | A 1987 lecture reprinted as a *Studies in Concrete Poetry* booklet lists "typewriter dirty clean" as a heading. His typewriter and stencil-duplicator technique is not described in any page read (`[unverified]`). | British Library holds *The Papers of Bob Cobbing* (acquired 2005). The Princeton Cobbing collection catalogue (PDF) was surfaced, not read. |
| **Steve McCaffery** | *Carnival: the First Panel 1967-70* (Coach House Press, Toronto, 1973); second panel 1977 | 1967 to 77 | typewriter. Built as panels meant to be laid in a square of four pages; "the arrangement of the panels is left up to the reader". Called "dirty concrete" (Lori Emerson). The brief's "8 × 8 ft" and "overstrike" are `[unverified]`. | Belkin Gallery, UBC (collection.belkin.ubc.ca) holds items (listed, not read). Sibling: Paul Dutton's *The Plastic Typewriter* (written 1977, visual work 1993): disassembled typewriter, rubbings of carbon ribbons on bond paper, "excessive overlay" (jacket2.org/commentary/inking-outside-fox-type-writing-itself). |
| **Carl Andre** | the typed poems, 1958 to 72 and after; *One Hundred Sonnets* (1963), *12 Dialogues* with Hollis Frampton (1962 to 63) | 1960 to 65 is his writing period | typewriter ink on paper; Artforum says Royal or Olympia, "forcing a uniform typestyle"; Dia says 1300+ pages in the 1960s; Chinati: nearly 500 pages, *Words* 1958 to 1972, "typed on a manual typewriter or hand-written", words "as a compositional module", "can also be read as drawings" | Dia (diaart.org, 403 to the fetch tool; facts from a search summary); Chinati (chinati.org/collection/carl-andre/); Morgan (themorgan.org/drawings/item/217141); Tate timeline notes the 1997 Paula Cooper show of *Typewriter drawings (1963)* (tate.org.uk/file/carl-andre-timeline). **No Lisson Gallery link found**, `[unverified]`. Stedelijk holds a collection per Wikipedia. |
| **Ruth Wolf-Rehfeldt** (1932 to 2024) | "typewritings"; manuscript *Signs Fiction*; *Cagy Being (Käfigwesen)*; *Strukturblätter* (mid 1980s); mail art | first typewritings 1972 | **Erika** typewriter, first used for a symposium on language in Wrocław, 1972. Originals and **carbon copies**, formats mostly A6 to A4. Self-taught typist from her teens (apprentice industrial clerk 1947). Mail art from 1974; zincographs from 1978; coloured-paper Xerox in the last phase. "Cubes, boxes and cages" made from **punctuation, special characters and letters**, interlocked and overlapping (DAS MINSK press kit: media.dasminsk.de/RWR_Pressemappe_EN_230209.pdf) | MoMA has an artist page (moma.org/artists/75084-ruth-wolf-rehfeldt, 403 to the fetch tool). documenta 14 (2017). Chert Lüdde, Berlin, published *Signs Fiction* (ed. Jennifer Chert, 2015). **"Signs Everywhere" (the brief's title) did not surface; `[unverified]`.** In copyright. |
| **Ian Hamilton Finlay** (1925 to 2006) | Wild Hawthorn Press (1961, with Jessie McGuffie); a 1964 Edinburgh book of facsimile typewriter designs printed red on white (dealer description only) | | Mostly print and "poem-prints". | Tate Liverpool: tate.org.uk/whats-on/tate-liverpool/ian-hamilton-finlay-and-wild-hawthorn-press-1958-91. MoMA: moma.org/artists/1878-ian-hamilton-finlay. Adjacent, not typewriter canon. |
| **Hansjörg Mayer** (b. 1943, Stuttgart) | Edition Hansjörg Mayer from 1964; *Konkrete poesie international* portfolio 1965 (40 copies; includes Finlay); *typoems*; *The First Alphabet* | | Typographic and offset. Sources describe typoems and artists' books, not typewriter work. | Kunstbibliothek Berlin, *Typoems and Artist Books*, Oct 2019 to Jan 2020 (smb.museum). Adjacent, not typewriter canon. |
| **Paul Smith** (1921 to 2007; sources disagree on age at death, 85 or 87, and on the age he found the typewriter, 11 or 16) | typed landscapes, trains, animals, portraits, recreations of the *Mona Lisa* and Rodin's *The Thinker*; a ray of light as signature | | Old manual typewriter; guided one hand with the other; **locked Shift** to avoid numerals so he used the top-row symbols; chose different symbols for different textures; adjusted character spacing; set line spacing by the **roller**; **pressed his thumb on the ribbon for shading**; planned everything because nothing could be erased (oshmanlaw.com/blog/the-remarkable-life-of-paul-smith, a law-firm blog, promotional, secondary). | The brief's Lochinvar, Mexico, Hudsonville, Beer Street and Lisa Oliveri details did not surface. `[unverified]`. Works are widely reposted; image rights unclear; do not use. |

**Anthologies and a bridge.** Alan Riddell (ed.), *Typewriter Art*, 1975 (cover: Houédard's *italic ode*, 1971). Barrie Tullett, *Typewriter Art: A Modern Anthology*, Laurence King, 2014. *Typewriter Poems* (anthology, 22 practitioners; its editor is Peter Finch `[unverified]`). Lori Emerson's "media studies and the typewriter poem" (loriemerson.net/2011/04/19/media-studies-typewriter-poem/).

**The Sackner Archive.** Founded 1979 by Ruth and Marvin Sackner; 70,000+ objects with notable strengths in typewriter art; about 400 works came to the Pérez Art Museum Miami (announced 2016), including typewriter poetry (finebooksmagazine.com, artforum.com news). Reported as now housed at the University of Iowa Libraries, date not found. `[unverified]`. PAMM's exhibition *A Human Document* ran 2013 to 2014 (pamm.org/?p=21769).

### 1.3 Later branch: teleprinter, line printer, ASCII

- Dag Hammarskjöld teleprinter portrait, 1961 to 62 (Wikipedia ASCII art page; creator not confirmed). Overprinting on line printers: Kenneth Knowlton and Leon Harmon, c. 1966, Bell Labs *Studies in Perception I*. Andries van Dam, IBM 1403 circuit drawings. PLATO overprinting c. 1973. VT100 animation c. 1970. (Wikipedia ASCII art, as fetched.)
- RTTY art uses 5-bit Baudot (uppercase letters and punctuation only), hence "ASCII art" is a misnomer for it (Hackaday 2016, hackaday.com/2016/06/28/retrotechtacular-ascii-art-in-the-19th-century). Amateur RTTY grew after WWII.
- Design relevance: this branch defines the glyph-density ramp (` .:-=+*#%@`) and the box `+--+ | |`. Both are typewriter inheritance. Both read as "terminal" to this user: the Cyber verdict (illum-taste: phosphor and line-printer directions were rejected as "terrible") is a warning, see §6.

---

## 2. The physical mechanics, as modelable causes

Each cause is a state that exists before the mark is made. Nothing here is per-strike noise. "Machine" below means a seeded object (`seed` from the page text) holding the per-key and per-ribbon state; every strike reads it.

### 2.0 The correction to the brief

The brief says heavy characters (M, W, @) print darker or emboss, and the outer keys and little finger strike lighter. What the sources support:

- **US 2,868,345** ("Device for adjusting the striking force of the type bars of electric typewriters"): "the small letters have less contact surface than the large letters", so "the small letters, numerals and symbols will be more forcibly printed than the large letters so that the typing produces a nonuniform copy." Cause given: contact area only.
- **US 2,907,436** states the ink is pressure sensitive, so density follows the impact energy of each bar, and that adjusting the energy per bar is the cure, with a second adjustment for upper case (patents.google.com/patent/US2907436A).
- IBM Selectric: period and underscore use a low-velocity selector latch "so the paper wasn't cut" (Wikipedia, IBM Selectric typewriter). So the dot-sized glyph is the one that punches.
- The "little finger strikes lighter" claim has no repair-source support in anything read. It is typing-pedagogy folklore (even touch was taught because fingers differ). `[unverified]`.

So the model: **density at a glyph = f(force at key, glyph contact area)**, where force = the machine's setting plus the typist's finger. A uniform-force machine prints the period darkest and the M palest. A hand-driven manual machine prints what the finger delivers, so an even-touch typist compensates for M and W by hitting harder, and the result is both: the M may emboss and still be pale in the centre. The engine should expose force and contact area as separate numbers; do not hard-code "M is dark".

### 2.1 The table

| # | cause | visible effect | modelable parameter | source |
|---|---|---|---|---|
| 1 | **Strike force** (finger, key, rhythm) | Per-glyph density and emboss depth. Small-area glyphs (`.` `,` `:` `'` `-` `_`) print dense and can punch through; wide glyphs (`M` `W` `@` `%`) print paler or with a pale centre unless the typist hits harder. | `force[key] = base + finger[key] + rhythm`, `density = g(force / area[glyph])`. Finger term `[unverified]`. A smooth slow drift for rhythm, not white noise. | US2868345; US2907436; IBM Selectric (Wikipedia); a forum post about letters piercing the paper (typewriter.boardhost.com/viewtopic.php?id=2758) |
| 2 | **Ribbon ink depletion along its length** | A page starts dense and fades as one band of ribbon is used. A worn band prints a **dotted** line: "when the ink is exhausted to such an extent that the impressions made on paper are not continuous lines but series of dots". | `ink(t)` slow monotone decay with the strike count on that band; a step up at a reversal (a fresh band comes round). Re-inking is "a messy procedure" and uneven (Wikipedia, Typewriter ribbon). Capillary recovery between uses `[unverified]`. | NBS Letter Circular 597 (June 1940), nvlpubs.nist.gov/nistpubs/Legacy/LC/nbslettercircular597.pdf; Wikipedia, Typewriter ribbon |
| 3 | **Ribbon reversal** | At the end of the spool the ribbon reverses; small eyelets or grommets can trigger it (Wikipedia, Typewriter ribbon); some machines (certain Olympias) do not use them `[unverified]`, from a search summary. | A discrete event every N strikes; ink level re-sampled from the other edge of the ribbon. | Wikipedia, Typewriter ribbon |
| 4 | **Ribbon fabric and weave** | A ribbon is woven cloth. The strike prints the weave when ink is low. Cotton holds more ink (spun staple yarn); silk is thin and gives sharp writing; nylon prints lighter and wears longer; rayon was hard to ink. NBS: thread count about **150 per inch in each direction**, federal minimum 148 and a sum of at least 300, thickness up to 0.0067 in.; "the writing will look less spotty if the counts are nearly equal." Selvage ribbons can run as low as 110 filling threads/in. | Thread pitch = 1/150 in = **0.17 mm**; per-thread ink load varies (spun yarn is irregular). Warp and filling threads differ slightly. **Polymer (carbon film) ribbon** has no weave: sharp, full-density, single pass, never re-struck. | NBS LC 597 (cotton, silk, thread counts); Wikipedia, Typewriter ribbon (polymer ribbons); US2918160 (staple versus continuous yarn); a buyer's note that nylon prints lighter (shopsavvy page) |
| 5 | **Typebar misalignment** | A given key prints high, low, tilted or off-centre in its cell, the same way on every strike. Slugs are slightly curved to match the platen; too high or too low gives an uneven impression; a high letter can tilt sideways too and fixing one disturbs the other (one of four Lettera 22s: an `a` "types too high and tilts to the left"). Repair is by bending slugs with pliers. | `dy[key]`, `rot[key]`, `dx[key]`, plus a **bottom-or-top faintness gradient** per key from slug tilt against the platen (typecast.munk.org/?p=3509 and ?p=3519; boardhost viewtopic 1270 and 176). Magnitudes `[unverified]`; start at ±5 to 12% of x-height, ±0.5 to 1.5°. | typecast.munk.org Typewriter Repair 101 posts; typewriter.boardhost.com threads |
| 6 | **Faint-bottom or faint-top letters** | Letters fade at the foot if the ribbon lift or vibrator is mis-set. | `lift` offset sets a vertical ink gradient on the whole line for that machine. | thecraftchronicle "Fix Faint Letters at Bottom of Typewriter" (search result; text not read); IBM CE manuals say to check ribbon strike height by typing tall characters (bitsavers, 25-6007-0). |
| 7 | **Platen hardness and paper backing** | A hard platen gives crisp, narrow, deeply debossed strokes; a soft or worn one gives broader, softer prints; a glazed or flattened one is uneven. New platens: **88 to 92 Shore A**; a Selectric around 95; 96+ is too hard for a manual. A 1935 patent gives about 90 for the outer jacket over a cushion near 50. More sheets behind (carbon packs) add cushion. | `spread = k·(100 − shoreA)`; emboss depth from force / hardness. Numbers are collector and forum figures (Peter Short quoted), not a standard. | typewriter.boardhost.com/viewtopic.php?id=2208; mrmrsvintagetypewriters.com blog on platen rubber; US2053107 (1935) `[unverified]`; badonoer.blogspot.com platen hardness posts |
| 8 | **Filled counters** | `e`, `o`, `a` (and `4`, `6`, `8`, `9`, `B`, `D`, `P`, `R`) clog with ink and lint and print as blobs. Cleaning each slug fixes it. | `dirt[key]` grows with that key's use count across the document (deterministic from the text), partly or fully closing the counter; cleaned between sessions. | typewriter.boardhost.com/viewtopic.php?id=1204 |
| 9 | **Bounce ghost** | A slug can bounce off the platen from excessive force and tap again, leaving a second, lighter, offset impression. | A second faint copy at (+dx, +dy) of 0.02 to 0.06 em for high-force strikes only. | forum post surfaced by search (typewriter.boardhost.com/viewtopic.php?id=1270; text paraphrased from a search summary) `[unverified]` |
| 10 | **Touch and spacing faults** | Uneven touch makes a well-adjusted machine "skip, pile, crowd, or shadow". Escapement spacing itself is exact. | A rare "crowd" (glyph shifted toward its neighbour by a fraction of a cell) where two fast keys follow each other, and "shadow" (a double strike). Deterministic from the character sequence. | oldbobsoldtypewriters.com Typewriter-Maintenance-General.pdf; |
| 11 | **Overstrike** | Struck again over the same cell: ink adds (multiplicatively, not additively), the paper is debossed twice, and the second strike lands a little off because the backspace slop and slug play differ. Exactly how Houédard's red-and-black dense underline planes (*Typescript 140469*) and tone ramps in typewriter art are made. | `1 − (1 − d₁)(1 − d₂)` for density; registration error σ ≈ 0.02 to 0.05 cell between passes `[inferred]`; multiply composite, never alpha-over (02-analog's rule). | Saltoun description of *Typescript 140469*; overprinting on PLATO and line printers (Wikipedia) |
| 12 | **Bichrome ribbon** | A half-inch ribbon is split lengthwise, usually black above and red below (Corona, Smith Corona); a selector raises or lowers the ribbon so the chosen half sits in front of the type. The paper position of a glyph does not change with colour. The seam between inks is on the ribbon, so a mis-set vibrator puts the seam *inside* the glyph: the top strikes one ink and the foot the other, or the glyph is half-faint. Reported bleed between the two inks on the ribbon. Red is the "preferred second colour" (Pitman 1897) and was used for emphasis and for stage directions. | `ribbonColour[key-state]` plus an optional seam height `h_seam`; **red and black deplete independently** (they are different bands). The brief's "offset" is a seam effect, not a shift of position. `[inferred]` from the construction; a mis-set vibrator is `[unverified]` for any specific machine. | typewriter-museum.blogspot.com/2023/01/stencil-mode.html (stencil position also described); Wikipedia, Typewriter ribbon ("bichrome ribbon switch"); Walker 2017 |
| 13 | **Stencil position** | Third selector setting: the ribbon is not raised; the slugs hit the paper directly. On a stencil sheet the type cuts the wax. On plain paper it leaves a blind impression. | `ribbon = none`; the strike is only a deformation. | typewriter-museum.blogspot.com/2023/01/stencil-mode.html (a single collector blog, not checked against a manual) |
| 14 | **Carbon copy** | Pigment-and-wax carbon on the back of the top sheet transfers to the sheet behind by the pressure of the glyph. Copies are softer, lower contrast and smudge easily; a **hard finish** gives sharper copies for 1 to 3 copies and smudges less; **soft finish** serves 10 to 15 copies; "the sharpness and clearness of carbon copies depend to a considerable extent upon the thickness and stiffness of the first and copy sheets". Carbon dyes are methyl violet and alkali blue (purple-blue). Onionskin is cotton fibre and lasts; manifold paper is low-grade wood pulp. | Edge radius grows with sheet depth; contrast = f(force, sheet depth, finish); a faint offset halo; smudge direction along the strike motion. | NBS LC 597; PSAP, psap.library.illinois.edu/format-id-guide/officeprintcopy |
| 15 | **Correction** | Liquid Paper (1950s) leaves an opaque white patch whose retyped letters sit slightly raised and differ in density; Lift-Off tape (1973) removes ink from a Correctable Film strike; Cover-Up tape lays a white film over it. The old impression remains debossed as a ghost. A typed `xxxx` over a word is the ordinary strike-through. | `patch` (opaque white, low-contrast edge) plus the buried emboss under it. | Wikipedia, Bette Nesmith Graham; Wikipedia, IBM Selectric typewriter |
| 16 | **Free vertical positioning** | The platen can be turned by hand when the line-space ratchet is released, so the carriage returns to any row. Houédard's drawn vertical and diagonal placements come from this, not from "half-spacing" as a key. The Lettera 22's own variable line spacer and ratchet release were **not found in any page read**; the existence of a platen release on typewriters is general knowledge. `[unverified]` for this model. The half-space step (1/12 in., half a row) is the standard approach to an offset. | `y` quantised to 1/12 in. (half rows) by default and continuous when the platen is turned by hand. | Olivetti Lettera 22: Wikipedia (Nizzoli, from Beccio's mechanical design, launched 1950, Compasso d'Oro 1954); Typewriter Database |
| 17 | **Paper skew** | The sheet is a few tenths of a degree out of square; every line is parallel to the next. | A single page-wide rotation, 0.1° to 0.4° `[inferred]`. | n/a |

**Scale arithmetic `[inferred]`.** If one pica cell is mapped to `lh` = 24 CSS px (a 12 pt face on a 12 pt line is 16 CSS px at 96 dpi, so this is 1.5×), the weave pitch of 0.17 mm is 0.64 CSS px at actual size and **0.96 CSS px at 1.5×**: right at the Nyquist limit at DPR 1 and only about 2 device px at DPR 2. So the weave can be *drawn* as a thread lattice only at DPR 2 or on zoom. At DPR 1 render its consequence instead (the dotted look of a worn ribbon, the dropout of fine strokes), computed from the same thread lattice at higher internal resolution. Courier-type hairlines are about as thin as one thread pitch, which is why a worn ribbon breaks them into dashes first.

### 2.2 What this is not

Do not add: a global paper grain, per-strike random rotation, a Gaussian blur on every glyph, ink splatter, or "ribbon texture" tiles. 02-analog already forbids periodic tiles and uniform grain overlays. The weave is the one genuinely periodic physical structure here; see the conflict in §8.

---

## 3. Composition techniques

### 3.1 The grid, and how it maps to `lh`

- Horizontal pitch: **pica 10 cpi, elite 12 cpi** (also condensed 17 to 20 cpi, enlarged 5 to 8). Vertical: **6 lines per inch** for both, "both fonts have the same x-height" (Wikipedia, Pitch (typewriter)). Half row: 1/12 in.
- Cell aspect (width : height): pica 0.1 : 0.1667 = **0.6**; elite 0.0833 : 0.1667 = **0.5**. Courier Prime's advance is 1228/2048 = **0.5996 em**, so at font-size = row pitch it is a pica machine. Cutive Mono is 1240/2048 = 0.6055 em; IBM Plex Mono 0.6 em exactly; Xanh Mono 0.5 em (a literal elite cell) but with large x-height and a different design.
- Mapping to the host: let the host's baseline unit be `lh`. A typed run of *n* cells has width **0.6·n·`lh`** with the face set at font-size `lh`. The typed row pitch equals `lh` (solid, 12 on 12). A body paragraph in a proportional face will not align to this cell width; typed ornament snaps to the *row* grid (vertical) and to its own *column* grid (horizontal), anchored at the paragraph's left edge. A filler therefore needs a count of whole cells, and the remainder becomes the right margin gap (the same thing a typist's margin bell produces).
- Half-row offsets (0.5 `lh`) double the vertical resolution. That is what lets a typed diagonal or a rounded initial exist without becoming a bitmap.

### 3.2 Techniques, each with a source or a precedent

| technique | how | who and where |
|---|---|---|
| **Fixed pitch construction** | One character per cell, no kerning, no scaling. Shapes come from choosing which cell receives which glyph. | Houédard, *Sonic Water* (ten nested squares from the letters of the title); Wolf-Rehfeldt's boxes, cubes and cages from punctuation. |
| **Rule-based text-as-form** | The page's letters generate the form: the title's letters are the shape's letters. | *Sonic Water* (PAMM). This is the strongest formal idea for illum: derive the end-mark from the page's own words. |
| **Overstrike density as tone** | The same cell struck 1, 2, 3, 4 times. Different characters give different ink areas: `.` `:` `-` `=` `+` `x` `o` `#` `@` (the standard ramp). | Typewriter art generally; Nelson's shading `[unverified]`; Knowlton and Harmon on line printers (overprinting). |
| **Character choice for texture** | `:` and `.` for sky or sand, `/` and `\` for hatching, `x` for cross-hatch and for striking out, `o` for beads and bubbles, `-` and `=` for horizontals, `#` and `@` for the darkest areas, `_` and `|` for ruled lines. | Paul Smith "used different symbols for different textures" and mostly top-row symbols with Shift locked. |
| **Half-line feeds** | Offset rows by 1/12 in.; makes slopes and curves smoother, interleaves two lattices (e.g. `/\` zigzags). | Free vertical movement: Houédard; Paul Smith "set line spacing by adjusting the roller". |
| **Rotating the paper** | Turn the sheet 90° and strike again so rows become columns, or turn it a few degrees for a skewed layer. | A known technique, widely described; not stated in any page read. `[unverified]` |
| **Masking** | Hold a cut card over part of the sheet so a field of strikes stops at an edge, leaving a clean reserve. | Nelson's "cut-outs" tutorial lists the topic only. `[unverified]` how it was done. |
| **Two ribbon colours** | Black text, red emphasis; or a dense two-colour underline field. | Pitman 1897 (Walker); Houédard, *Typescript 140469*. |
| **Carbon copy as multiple** | The same composition typed once, two or three sheets deep; each copy a decayed edition. | Wolf-Rehfeldt: originals and carbons, A6 to A4, sent as mail art. |
| **Disassembling the machine** | Free the keys from the grid, rub the carbon ribbon directly. | Dutton, *The Plastic Typewriter*. A contemporary extreme; not for illum. |
| **Typed ornament manuals** | Borders, lettering, cut-outs, cross-stitch patterns, letterhead. | Nelson 1939; Walker's reading of typing manuals (borders made from characters and character combinations). |
| **The typist's rank ladder** | SPACED CAPS UNDERLINED > SPACED CAPS > CAPS UNDERLINED > CAPS > Upper-lower underlined > Upper-lower. Centred headings with a double or treble space between words. | Walker 2017, quoting typing manuals; also the manual's rule "taste in typewriting is almost entirely limited to display". |

### 3.3 Timing of a human typist `[inferred]`

Forty words per minute is about 3 characters per second; fast office typing about 6 to 8. A repeated key (a filler `. . . .`, a rule `______`) can run 10 to 15 per second. A carriage return takes 0.3 to 0.6 s. A backspace-and-restrike pass is a distinct beat. These numbers are guesses for pacing; test by eye.

---

## 4. Mark-by-mark proposals

Grid shorthand: a cell is 0.6 `lh` wide, 1 `lh` high; half-rows are 0.5 `lh`. A "4-line drop" is a block 4 `lh` tall and about 6.7 columns wide for a square. Ranks follow the house: h1 frame, h2 initial, h3 penwork analogue; here rank is the typist's ladder.

### 4.1 Drop initial (big, ~4 lines)

A typewriter cannot strike a 4-line letter, so every option is an honest construction.

- **A · The mosaic capital (Nelson's "lettering" tutorial, Knowlton-style).** The capital's Courier Prime outline is rasterised on a 1/12 in. lattice (so 8 half-row rows for a 4-line drop) and each cell receives a character chosen by its coverage: `#` or `@` for stems, `x` for joins, `o` or `:` for curves. Overstruck for the darkest spine. *Risk:* a bitmap or dot-matrix read, the commonest "digital" look. *Mitigation:* the face only guides; use ≥ 2 overstrike passes and half-row offsets; pick the letter's characters by stem direction (`|` for verticals, `/` `\` for diagonals, `_` and `-` for horizontals) so it looks *struck by rule*, not thresholded.
- **B · The sunk capital (cut-out / mask).** A rectangle of overstruck `x` or `#` 3 passes deep makes a near-solid ribbon-black field; the capital is *reserved* (left unprinted) as if a cut card masked it. A single red hair-line underscore edge underneath. Strong at small sizes, quiet at large; the field's edge shows the weave and the worn-band dotting. This is the best option for the 400% crop test because the edge is a physical edge (a mask), not an outline. Tied to Nelson's cut-outs `[unverified]`.
- **C · The ruled capital (Houédard-style).** The letter is built from typed strokes: a column of `|` for a stem, `/` for a diagonal, `_` for the foot, with half-row offsets for slopes; open and airy. Red for the serif or foot. Pairs with 4.4 break compositions.
- **D · The plain typed capital (the honest fallback).** A 2-line capital in red ribbon at normal size, indented one cell. Typists never made drop caps. Keep only as the cheapest rank-3 initial.

**Recommendation.** B for h2 (rank 2), C for h3. A is a trap unless the dot-matrix read is solved.

### 4.2 Paraph (before a paragraph)

- **A · `¶` in the red half.** Courier Prime has ¶ (and § † ‡). One strike, red, slightly paler than the black body because the red band is a different, less loaded band (§2.1 #12), preceded by one cell of margin. The most literal rubric mark.
- **B · A Wolf-Rehfeldt sign.** A 2 × 2 or 3 × 3 cell figure built from `+ - | x o / \`, a "cage" or cube (*Cagy Being* is exactly this kind of figure), different per paragraph by seed but from one small vocabulary so it is a repeated "sign". The best match to "signs" as units.
- **C · A strike-over.** `x` struck onto `o` (a cross in a circle) or `/` over `\`. Houédard's crosses of `o`s are the source (*Transfer Module*).

### 4.3 Line filler (free end of a paragraph's last line)

- **A · The leader run** `. . . . .` (period, space). The typist's table-of-contents leader; periods are small-area glyphs, so they print densest and may deboss (§2.1 #1). Cell count = floor(gap ÷ 0.6 `lh`).
- **B · The rule** `________` or `-=-=-=-`. The underscore line with per-key fault (one underscore sits lower). A double rule struck twice with a half-row offset.
- **C · The void** `xxxxxx`. The ordinary typed way to cancel a gap on a form. Reads as intentional, a little bureaucratic; excellent for a paragraph's last line in a quiet section.
- **D · The Wolf-Rehfeldt run** `/ / / /` or `: : : :`. A repeated sign reads as a rhythm. Red for the very last cell only.

### 4.4 Heading run-out

Use the rank ladder.

- **A · The ladder.**
  - **h1:** SPACED CAPS, UNDERLINED, red; the underline continues to the right margin as a rule. (Walker: "the heading should be typed in capitals ... divide the letters by spacing after each, with a double or treble space between each word.")
  - **h2:** SPACED CAPS in black; a single leader run to the margin.
  - **h3:** CAPS UNDERLINED, no run-out.
- **B · Leader only.** The heading in ordinary capitals, then a dot-leader run to the margin with no rule (a table-of-contents line; Nelson's letterhead idiom `[unverified]`). Quiet; good for many h2s.
- **C · The red rule.** Heading case unchanged; a single underscore rule from the heading's end to the margin in the red half, struck once. Cheapest, and keeps red for rank only.

### 4.5 Section breaks (three ranks)

- **Small:** `*  *  *` or one `+` with a half-row offset; a short `x` pair.
- **Major:** a **typed band**, 3 half-rows deep: a row of `=`, a row of `:`, a row of `=`, with a central sign. The row of `:` is struck with the red ribbon half. Or a Wolf-Rehfeldt cube.
- **End, A · The *Sonic Water* panel.** The page title's letters (or the last sentence's letters) build nested squares or a spiral two letters wide. Same text, same panel; it is the one mark where the text's own letters are the ornament. It is also the place to spend the second colour fully.
- **End, B · The graded circles (*Transfer Module*).** Three circles of widely spaced `o`, small at the top and large at the bottom, a cross of `o` at each centre (V&A description). Half-row offsets carry the circles.
- **End, C · The quiet asterism.** A doubled `* * *` with a half-row offset between the two rows, struck once in black and once in red. Cheapest.

### 4.6 Frames (quote, figure, code, pull quote, nav)

- **Quote.** A · a left rule of `|` one cell out from the text, red, with a one-cell indent. B · a two-line `"` hanging mark in the margin with no rule. (The email `>` is the RTTY variant and reads as "reply"; avoid.)
- **Figure.** A · the typewriter box `+-----+ | | +-----+` with `+` at the corners; the `|` sides carry that key's fault; caption in spaced caps beneath. B · a *Cagy Being* corner-only frame (four small `+`-and-`|` corners, open sides). C · a single red left rule and the caption in spaced caps.
- **Code.** A · a **carbon copy** of the block: the same text, offset 0.2 cell right and down, in blue or purple carbon at lower contrast, the black original on top. B · a plain indented block with a `|` left rule and no colour (use when carbon would crowd the figure frames).
- **Pull quote.** A · two double rules `====` (struck twice, half-row offset), the quote in SPACED CAPS centred, in red. B · a carbon ghost: the quote typed twice, offset, blue carbon beneath. C · Andre's word-as-module block: the quote re-set as a justified rectangle of its own words, one word per module (Chinati: words "as a compositional module").
- **Nav.** A · a table of contents with dot leaders and right-aligned numbers, the most native typed form. B · a numbered list under a CAPS UNDERLINED heading, with no leaders.

### 4.7 Time and budget `[inferred]`

A page with 3 large marks (500 glyphs), 40 paraphs and fillers (10 to 40 glyphs each), and 6 frames (150 glyphs) is about 2 to 3k glyph strikes. Precompute one glyph atlas per (key, colour, 2 to 3 force levels), about 60 keys × 2 × 3, from the seeded machine, then composite with multiply. That is far inside 200 ms if done as stamps; as ink-engine strokes through WebGL2 it would not be. 10-rubricate.md puts line work through the medium's `Pen` and fills (Tarot pips, Kelmscott leaves, Riso overprint) with `marks`, with the stamped pen as fallback. A strike is a fill-class mark, so it goes through `marks` as a stamp and not through the `Pen`. (`playground/kit/medium.js` itself was not read.) Animation: strikes in reading order, row by row; overstrike passes as extra beats (a solid that darkens in passes is growth); a carriage return between rows; no fades.

---

## 5. Palette

All values below are **estimates, not sampled** (no suitable public-domain scan of a typed carbon or a red-ribbon sheet was retrieved). They should be sampled from real scans before the build, with the file named; candidates are Wikimedia Commons typescripts and archive.org typing manuals. Colour logic from NBS LC 597: carbon and copying ribbons are methyl violet, crystal violet and alkali blue dyes; ordinary ribbons black plus the dye lakes; hectograph (spirit duplicator) ribbons "nearly always methyl violet".

| name | hex (estimate) | role and cause |
|---|---|---|
| ribbon black, fresh | `#1b1b1e` | cotton ribbon with a violet-blue base; never `#000` |
| ribbon black, worn | `#4a4846` to `#5a5754` | depleted band; dotted |
| ribbon red, fresh | `#b02a22` | the bichrome lower band; slightly pink-orange in practice |
| ribbon red, worn | `#c25a4c` | |
| carbon blue | `#2d3a8c` (copy: `#4a5aa0`) | alkali-blue and methyl-violet carbon |
| carbon violet (duplicator purple) | `#5b3a8c` to `#8a6fb0` | hectograph and copying ribbons |
| carbon black | `#26262c` | |
| bond, new | `#f4f1e8` | the host owns `--paper`; use as a hint only |
| bond, aged | `#ebe4d0` | |
| onionskin | `#f1ede2` at 80% opacity over its backing | translucent; show-through of the sheet beneath |
| canary second sheet | `#f3e58a` to `#f2e49b` | pale yellow flimsy copy paper |
| pink copy | `#f2d3d0` | |
| cover-up white (dark mode) | `#ece8de` | opaque film |
| black card | `#16151a` | dark ground |

Notes:
- `--ink` takes ribbon black, `--rubric` takes ribbon red. In dark mode `--ink` becomes cover-up white and `--rubric` becomes a bright red that survives on black card (about `#e05a4a`, an estimate; no physical analogue found).
- The user's taste record says "flat paper, no visible texture" and "no random dots". Paper is flat; the only structure in the page is the ribbon weave inside a strike.

### Dark mode, two options

- **A · Cover-up on black card.** The strike lays opaque white film from the Correcting Selectric's Cover-Up tape. Density maps to opacity, not ink: a light strike shows the dark card through. The weave disappears (the tape is film). Depletion appears as pinholing. This is the physically caused option and it is a *designed* look, not an inversion.
- **B · Blind impression, raking light.** Ribbon off (stencil position), so the strike is a pure deformation on black or dark-grey stock, visible only where a light moves. It matches canon law 8 (ornament in a separate optical channel visible when the light catches it) and it gives the engine a legitimate reason to use the pointer or scroll light. Text stays A (white film); ornament is B. This is the more interesting of the two and the riskier.

A third, the dimmed second sheet (canary or grey stock, ribbon black), is an ordinary "night paper" and not a real alternative; it is the fallback.

No canonical white-on-black typewriter work was found in the sources read.

---

## 6. Fonts

### 6.1 Measured (this pass)

Fonts were downloaded from google/fonts and IBM/plex into the session scratchpad and checked with fontTools; licence from METADATA.pb and the name table; "o" and "M" outline point counts and advance widths measured; coverage tested for a set of ornament characters. (Scratchpad: `.../scratchpad/fonts/`.)

| face | licence | designer, basis | advance/em | cmap | box-drawing, blocks, `¶ § † ‡` | outline check | verdict |
|---|---|---|---|---|---|---|---|
| **Courier Prime** (Regular, Italic, Bold, Bold Italic) | **OFL 1.1** | Alan Dague-Greene (Quote-Unquote Apps); a "new take on IBM's Courier" (Kettler, 1956); crisper serifs, wider counters, darker bold | **0.5996** | 383 | has `¶ § † ‡ ¢ ° ± × ÷ « » ½ ¼ ¾`; **no** box drawing or blocks, no `№ ✠` | clean; `o` 32 points, `e` 40 | **master face** |
| **Cutive Mono** | **OFL 1.1** | Vernon Adams; "based on a number of classic typewriter typefaces, in particular the faces of IBM's 'Executive,' and the older 'Smith-Premier'" | 0.6055 | 447 | `¶ § † ‡` yes; no box drawing | clean; has a `liga` feature (disable); x-height 0.38 em, small like Elite faces | **alternate** (lighter, more period) |
| **IBM Plex Mono** | **OFL 1.1** | Mike Abbink, Bold Monday; IBM corporate face (a typewriter reference is `[unverified]`) | **0.6000** | 1049 | box drawing and blocks present; `¶ § † ‡` yes | clean; not typewriter-shaped | **ASCII and RTTY glyph source only** |
| **Cousine** | **OFL 1.1** | Steve Matteson; Courier New metric-compatible (sans design, `[unverified]`) | 0.6001 | 2282 | box drawing and blocks present | clean | RTTY/ASCII branch glyphs only |
| **Anonymous Pro** | **OFL 1.1** | Mark Simonson; a coding face | 0.546 | 623 | box drawing yes, no arrows | clean | not typewriter; reject |
| **Xanh Mono** | **OFL 1.1** | Yellow Type; a serif mono, Vietnamese | **0.5000** | 467 | no box drawing | clean | elite-width novelty; `[unverified]` fidelity; not chosen |
| **Special Elite** | **Apache 2.0** | Astigmatic (Brian J. Bonislawsky); "mimics the Smith Corona Special Elite Type Number NR6 and Remington Noiseless" and "a little bit of inked up grunge" | **varies: 10 distinct advances** (0.35 to 0.70) among `i I l m w W M o . @` | 368 | n/a | **`o` has 241 points** against 32 for Courier Prime's, `M` 413 vs 65: the outline carries baked-in roughness; category DISPLAY | **reject** |
| **TeX Gyre Cursor** | **GUST Font License (GFL)**, legally equivalent to the LPPL (CTAN; Font Squirrel page is marked preliminary) | extended URW Nimbus Mono L, a Courier clone | 0.6 | large | | not downloaded | free but not OFL; acceptable "or similar" with notice; no advantage over Courier Prime |
| FreeMono, Nimbus Mono PS | licences **not verified** this pass | | | | | | do not use until checked |

### 6.2 Fidelity to real typewriter type

None of the OFL or Apache faces here reproduce Olivetti Lettera 22 type (the Typewriter Database lists "Imperial Eletto" on a 1953 unit), IBM Selectric typeballs (Courier 72, Prestige Elite 72, Letter Gothic) or Remington faces. I found no open-licence copy of those. Courier Prime is *cleaner* than a real slug: its outlines are the drawing, not the print. That is the point: a clean master is correct, and the strike physics (§2) put the printing faults back with causes. The metal-type effects that a clean outline cannot give (ink squash at stroke ends, corner rounding from dot gain, serif fill) are produced by the engine's dot-gain and depletion model, not by a distressed font.

### 6.3 Recommendation

**Master: Courier Prime Regular, with Bold for the heavier struck marks** (a heavier forme, e.g. `#` and `@` overstrikes). OFL; exact 0.6 em; contains the paraph and section signs; the repository is github.com/quoteunquoteapps/CourierPrime. **Alternate: Cutive Mono** for an Executive or Smith-Premier flavour. **Glyph source for the ASCII/RTTY branch: IBM Plex Mono** (box drawing). Credit them in the colophon with the licence line. **Special Elite is excluded.**

---

## 7. Risks: where it reads as "a typewriter font"

| risk | why it reads cheap | how real typed work avoids it |
|---|---|---|
| **Typewriter font plus grunge filter** | Special Elite and every free "typewriter" style set on a paper texture: the roughness is the same on every glyph, noise-driven. | Faults are held by each key and by the ribbon. Every `e` is the same `e`. |
| **Every `e` identical and perfect** | A plain font is a stamp. | Per-key `dy`, `rot`, `dirt`, plus a slow density drift. |
| **Random jitter per strike** | White-noise misalignment is exactly what a manual machine does not do (escapement and slug fixed the position). | Offset is a property of the key; the *force* is the thing that varies, slowly. |
| **A bitmap read** | Character mosaics look like a dot-matrix print. | Half-row offsets, rule-based strokes (`|` `/` `_`), overstrike passes, a mask edge, and never a threshold of a raster. |
| **The terminal read** | ASCII, green, scanlines. The user rejected "B phosphor" and "C line-printer/punched tape" as "terrible" in the Cyber round. | Stay on paper: bond, bichrome, carbon, correction. Keep the RTTY branch out of the first build. |
| **Nostalgia cliché** | Kerouac scroll, Hemingway, a typewriter icon. | Concrete poetry is conceptual: a page made by a rule (Sonic Water), a sign system (Wolf-Rehfeldt), a constraint (Smith's locked Shift). |
| **Ornament made of letters is read as text** | `xxxx` and `oooo` parse as words to a reader and a screen reader. | `aria-hidden`; characters chosen from the glyphs of low legibility (`: . - = + x`); never type real words in an ornament except the generated end-mark, which is the point. |
| **An exact lattice with tame wobble** | The user's Insular verdict. | The typewriter lattice is real, so accept it; place the "hand" in force, ink, and the *decisions* (which cell, which pass), never in jitter on position. |
| **Pure black on pure white** | Looks printed from a laser. | Ribbon black `#1b1b1e`, paper off-white from the host, red band independent. |
| **Too much red** | Red ribbon used for everything flattens the rank. | Red for rubric only: paraph, h1, the single end mark. |
| **Gold** | n/a. The taste record says gold only small. This style has no gold. | |

---

## 8. House-rule conflicts (flagged)

1. **Ornament built from letters.** The rule "letters come from credited open-licence fonts; ornament is generated" is bent: here the ornament *is* font glyphs (`: . x o + = # @`) arranged by a generator. Proposed resolution: type the ornament with the same credited master face (so the glyphs are credited letters) and generate only the arrangement, force, ribbon and fault state. The alternative is to redraw punctuation as vectors, which risks the user's repeated rejection of procedurally drawn letterforms (illum-taste: five failed procedurally drawn letters). Decide before building.
2. **A periodic weave.** 02-analog says never use periodic tiles. A woven ribbon is periodic (about 150 threads/in. in both directions, NBS). Resolution: build a thread lattice with per-thread width, load and slack variation (selvage, spun-yarn irregularity), shown only inside strikes; never a tiled bitmap. Flagged because a strict reading forbids it.
3. **"Animation grows, never fades or pops."** A strike is a pop in reality (a typebar hits and the glyph is complete). Proposed resolution: the *sequence* is the growth (glyphs arrive in order at typing speed, a carriage moves along the row); each strike resolves over two to three frames as the ink spreads to its final dot gain; overstrike passes build tone. The two-to-three-frame bloom is `[inferred]` and may still read as a pop; test.
4. **Special Elite** conflicts with "letters from clean master faces so the engine adds variation with causes" (baked-in roughness) and with the fixed grid (non-monospaced). Rejected.
5. **No textures.** The weave and the debossing are generated inside a strike, with a cause, so they comply. Paper stays flat; a debossed paper height field (blind impression, dark mode B) is a *lighting* effect on the strike alone.
6. **Dark mode.** Option A or B in §5; not an inversion.
7. **Image licences.** Estate and museum images (Houédard, Chopin, Wolf-Rehfeldt, Andre, Cobbing, McCaffery) are in copyright; the museums' online terms are non-commercial, limited-size. No image is to be embedded, traced or sampled. The only candidates for any public-domain reference are the 1898 Stacey butterfly (a published 1898 notice, long out of copyright, from the Phonetic Journal; check the hosting scan's terms) and US government documents (NBS circulars). Nelson's *Artyping* has no stated status.
8. **Time budget** is a plan, not a measurement (§4.7).

## 9. Unverified or not found (one list)

- The brief's **"Signs Everywhere"** (and "Zeichen überall"): not found; the verified title is *Signs Fiction* (manuscript and 2015 book, ed. Jennifer Chert).
- **Carl Andre and Lisson Gallery:** no link found. Dia's *One Hundred Sonnets* page returned 403; facts from a search summary.
- **Paul Smith:** Lochinvar, Mexico, Hudsonville (Michigan), Beer Street, Lisa Oliveri not found; the biography is one law-firm blog; ages conflict.
- **Chopin's machine** (the brief says Olivetti): no source read names it.
- **Houédard's technique** beyond "typed ink on paper", the Lettera 22, red-and-black dense underlines and "o" and letter constructions: the Poynor essay and *Notes from the Cosmic Typewriter* were not accessed. His use of the variable line spacer, rotated paper and carbon is `[unverified]`.
- **Cobbing's typewriter methods** and **McCaffery's** overstrike and dimensions: not found.
- **Hansjörg Mayer and typewriter work:** not found; treated as typographic.
- **Kostelnick** year (1990 vs 1994) for the border examples cited in Walker's footnote 39.
- **MoMA, Dia, Chinati-adjacent pages** returned 403; links are given, contents not read.
- **Platen hardness** figures are collector and forum numbers. **Finger-strength** model has no repair source.
- **Sackner Archive at the University of Iowa:** date not found.
- **Tate holdings:** one Houédard drawing only (P80713, 1966); no Tate record found for Wolf-Rehfeldt, Cobbing, or Andre's typewriter poems.
- **All palette hexes** are estimates.
- **medium.js** was not read; the stamp-versus-stroke advice rests on 10-rubricate.md.

## 10. Source list with licences

Licence column: "PD" public domain; "text" = quote briefly, do not copy; "images" = rights of reproduction not granted by this document.

| source | URL | licence or rights |
|---|---|---|
| Walker, "Modernity, method and minimal means" (JDH 2017) | doi.org/10.1093/jdh/epx018 ; centaur.reading.ac.uk/69514/ | article; quote briefly |
| NBS Letter Circular 597, "Carbon paper and typewriter ribbons" (June 1940) | nvlpubs.nist.gov/nistpubs/Legacy/LC/nbslettercircular597.pdf | US government, PD |
| NBS Circular 431, typewriter ribbons and carbon paper | archive.org/details/circularofbureau431wate | US government, PD; not read |
| US patents 2,868,345; 2,907,436; 2,053,107; 2,918,160 | patents.google.com | PD |
| Olivetti Lettera 22 (Wikipedia); Typewriter Database | en.wikipedia.org/wiki/Olivetti_Lettera_22 ; typewriterdatabase.com/1953-olivetti-lettera-22.19241.typewriter | CC BY-SA text / database |
| Wikipedia: Typewriter ribbon; IBM Selectric typewriter; Pitch (typewriter); ASCII art; Bette Nesmith Graham; Henri Chopin; Ruth Wolf-Rehfeldt; Bob Cobbing; Steve McCaffery; Carl Andre | en.wikipedia.org | CC BY-SA text |
| DAS MINSK press kit, Ruth Wolf-Rehfeldt "Nichts Neues" (2023) | media.dasminsk.de/RWR_Pressemappe_EN_230209.pdf | press text; quote briefly; images not reproduced |
| Chert Lüdde, Berlin | chertluedde.com | gallery text |
| PAMM, Houédard *Sonic Water* 2016.253 | pamm.org/en/artwork/2016.253/ ; pamm.org/en/artist/dom-sylvester-houedard/ | text; images rights reserved |
| V&A CIRC.133-1970 | collections.vam.ac.uk/item/O167878/ | text citable; images non-commercial, up to 768 px, 5 years |
| Tate, Houédard | tate.org.uk/art/artists/dom-sylvester-houedard-17788 | text; images by appointment |
| Richard Saltoun Gallery, Houédard | richardsaltoun.com/artists/218-dom-sylvester-houedard/ | gallery text |
| Design Observer, "Dom Sylvester Houédard's cosmic typewriter" | designobserver.com/dom-sylvester-houedards-cosmic-typewriter/ | article |
| MoMA (Finlay, Wolf-Rehfeldt, OU issues, Ecstatic Alphabets) | moma.org/artists/1878-ian-hamilton-finlay ; moma.org/collection/works/273919 ; moma.org/artists/75084-ruth-wolf-rehfeldt ; moma.org/interactives/exhibitions/2012/ecstaticalphabets/ | pages 403 to the fetch tool; images rights reserved |
| Chinati; Morgan; Tate timeline (Andre) | chinati.org/collection/carl-andre/ ; themorgan.org/drawings/item/217141 ; tate.org.uk/file/carl-andre-timeline | text |
| Dia, Andre *One Hundred Sonnets* | diaart.org/collection/collection/andre-carl-one-hundred-sonnets-1963-2018-008-1-100 | 403; search summary only |
| Solt, *Concrete Poetry: A World View* (France) | ubu.punctumbooks.com/papers/solt/france.html | UbuWeb; text |
| MAMCO, Ilse Garnier | mamco.ch/en/2076/Ilse-Garnier | text |
| Oztypewriter blog on Flora Stacey | oztypewriter.blogspot.com/2020/02/flora-fanny-stacey-1845-1909-worlds.html | blog; text |
| Lori Emerson, "Artyping in 1939" and "media studies and the typewriter poem" | loriemerson.net/2014/01/26/artyping-in-1939/ ; loriemerson.net/2011/04/19/media-studies-typewriter-poem/ | blog text; PDF of *Artyping* hosted with no stated rights |
| Jacket2, "Inking outside the fox: type writing itself" | jacket2.org/commentary/inking-outside-fox-type-writing-itself | text |
| Oshman Law blog, Paul Smith | oshmanlaw.com/blog/the-remarkable-life-of-paul-smith | blog; promotional; secondary |
| Munk, Typewriter Repair 101 (alignment) | typecast.munk.org/?p=3509 ; typecast.munk.org/?p=3519 | blog |
| Typewriter forum threads (alignment, clogged counters, platen rubber) | typewriter.boardhost.com/viewtopic.php?id=1270 ; ?id=1204 ; ?id=2758 ; ?id=2208 | forum; paraphrase only |
| Typewriter Museum blog, stencil mode | typewriter-museum.blogspot.com/2023/01/stencil-mode.html | blog; single source |
| PSAP, office printing and copying | psap.library.illinois.edu/format-id-guide/officeprintcopy | text |
| Hackaday, "ASCII art in the 19th century" | hackaday.com/2016/06/28/retrotechtacular-ascii-art-in-the-19th-century | article |
| Kunstbibliothek Berlin, Hansjörg Mayer | smb.museum/en/exhibitions/detail/hansjoerg-mayer/ | text |
| Sackner / PAMM acquisition | pamm.org/?p=21769 ; finebooksmagazine.com ; artforum.com | news; text |
| Courier Prime | github.com/google/fonts/tree/main/ofl/courierprime ; github.com/quoteunquoteapps/CourierPrime | **OFL 1.1** |
| Cutive Mono | github.com/google/fonts/tree/main/ofl/cutivemono ; github.com/googlefonts/cutivemono | **OFL 1.1** |
| IBM Plex Mono | github.com/IBM/plex | **OFL 1.1** |
| Cousine, Anonymous Pro, Xanh Mono | github.com/google/fonts/tree/main/ofl/ | **OFL 1.1** |
| Special Elite | github.com/google/fonts/tree/main/apache/specialelite | Apache 2.0 (rejected) |
| TeX Gyre Cursor | ctan.org/pkg/tex-gyre-cursor | GUST Font License |

---

## Stage 1: the medium, two directions (tests/typewriter-medium.html, tests/typewriter-directions.html)

Built: kit/styles/typewriter-machine.js (the machine, the strike, the pour, the film law, the writer),
kit/styles/typewriter-variegated.js (A) and kit/styles/typewriter-typestract.js (B); fonts in
playground/fonts/typewriter/ (Courier Prime Regular and Bold, Cutive Mono, built to woff2 from the OFL TTFs, with the OFL);
reference crops in tests/typewriter-refs/ (CREDITS.md). Not registered in kit/illum.js; site/ untouched; no shared file
changed (the medium is used through `createMedium` only).

### What this pass checked in the research above

- **Courier Prime**: advance 1228/2048 = 0.5996 em, cap height 1187, x-height 924, and `¶ § † ‡ · × ÷ °` present
  (fontTools, this pass). **Cutive Mono**: advance 1240/2048, x-height 774, same signs; it has **no bold**, so its
  capital masks are the browser's synthetic bold (a known weakness of `?face=cutive`). Licences: both name tables say OFL 1.1.
- **Not re-checked** (left as the research has them): the NBS thread count, the patents' small-glyph claim, the platen
  figures, every `[unverified]` in §9. The model uses them only as directions and magnitudes, tuned against the scans.
- **Real typed sheets under open licences exist on Commons**, which §5 had not found: six crops are in
  tests/typewriter-refs/ (Teesdale c. 1910, Sterling's *Lilith* typescript 1918, the Salt Lake City complaint of 1886,
  Wichary's red overtyping, Werkman's tiksel 1923, the *Photoplay* typed portrait 1919). No open close-up of a
  red-and-black office sheet was found; the red is Wichary's red ribbon. The Utah caption (a column of colons with a
  star at its middle, a dash rule under) is a real typed ornament of 1886 and A uses it.

### Measured on the masters, and ours on the same measure

Darkness = 1 − reflectance / paper (gamma space), inside strokes eroded 2 px; per-glyph = each glyph's mean darkness
over the line's; scale from the character pitch taken as pica. Script: scratchpad `tw/meas.py`. Ours: the same lines
typed at 4× on the bench (`typewriter-medium.html?measure`, 18.1 px/mm, DPR 1), measured by the same script.

| | darkness mean ± sd | per-glyph cv (range) | edge 20–80 % | ink (white-balanced) |
|---|---|---|---|---|
| Teesdale, fresh | 0.72 ± 0.12 | 0.08 (0.76–1.25) | ~40 µm | 34 42 42 on 239 240 234 |
| ours, fresh | 0.70 ± 0.10 | 0.07 (0.89–1.12) | ~35 µm | 47 53 54 |
| Sterling, worn | 0.40 ± 0.10 | 0.11 (0.82–1.33) | ~55 µm | 128 122 134 on 232 221 209 |
| ours, worn | 0.44 ± 0.10 | 0.11 (0.78–1.27) | ~37 µm | 109 115 117 |

The masters' sd includes the scan's noise and the paper's own texture, so ours sits a little under on purpose. Still
short: the worn master's soft, fuzzy edge (ours is crisper) and its colour (a violet-grey; ours keeps the fresh ribbon's
cool black, thinned).

### The strike (typewriter-machine.js)

One machine per page, from the seed; every quantity has a cause and none is random per strike or per pixel.

| cause | model | magnitude |
|---|---|---|
| the key | per key per page: dy, dx, rot, spring; one in five keys badly high or low, one in seven leaning | dy sd .016 em (+ .03–.06 em on a bad key), rot sd .45° (+ 1–2°); foot sd measured ~140 µm, ours 140 µm |
| the platen | the ink squeezed past the slug's face: a soft dilation of the glyph; the ribbon's cloth softens the edge | .024–.046 em per machine |
| the faint side | a slug meeting the platen out of true: a plane across the glyph, one side lighter | one key in four, .12–.32 |
| clogged counters | closed spaces of e a o B D … filled from their walls inward, at .62 of a coat | the machine's dirt × the key |
| force over area | the typist's touch drifts (a smooth curve over ~9 strikes, ±5 %); ink ∝ (force / area)^0.2, capped .8–1.25 | a full stop prints denser than an M |
| the ribbon | the patch under the type guide drawn down by each strike (∝ area × force), wicking back with τ = 1.1 s; red and black are separate bands | a run of `#` fades ~25–35 %; a carriage return restores it |
| the paper | the fibres standing high take more ink: a continuous field anchored to the page, area-filtered | ±~12 % at 4×, less at 1× |
| the weave | 150 threads/in, ink heavier on threads; per-thread load; area-filtered (sinc² of the pixel); stronger as the ribbon dries | at page size only a slight density loss; at 4× a soft modulation, never a mesh |
| overstrike | ink added in the deposit (the engine's pour only merges); each pass off by the rack's slop at that column | ≤ .045 cell, fixed per column |
| the bichrome seam | a vibrator set short: the red glyph's top strikes the black half | bench only (off in the directions) |

Then each colour's deposit is poured into the ink engine (own `createMedium`, neutral ink, wetness .06, dryness 0: a dry
pour catches only the tooth's peaks, which is speckle), and the film is read back. **Light**: the ribbon inks filter the
stock (Beer–Lambert in linear light, per-channel transmittance from the measured ink). **Dark**: an opaque cover-up film
(the Correcting Selectric's white tape) and a vermilion film on black card, density as opacity, so a light strike shows
the card through. The page's theme is followed live (`prefers-color-scheme` and `<html data-theme>`, tested by setting
the attribute in a running page).

**Departures from the research.** A worn ribbon "prints dotted" (NBS) is rendered as continuous thinning and loss of
edge, by the owner's rule (no specks); no bounce ghost (`[unverified]`); no paper skew (the text is not skewed); no
"settle" of a strike over frames (a strike is instantaneous; the growth is the typing order).

**Animation** (`?draw`, or "type it"): the pieces are typed in reading order by one carriage, each in the typist's
rhythm (6 strikes a second, a repeated key 10, a carriage return half a second, an overstrike pass a backspaced return),
held to a few seconds a piece. A cell shows its film when its strike lands, and the next pass's film when struck again
(each pass level is its own pour). Nothing fades. Reduced motion: still.

### The directions

- **A · Variegated typewriting** (the office's bichrome ribbon). Drop: a red field typed on half-row feeds (`#`, `M` or
  `X`, the seed's), the capital (Courier Prime Bold, verbatim) reserved by a card laid on the sheet, its edge cutting the
  struck glyphs clean. Paraph `¶` red, struck once or twice. Filler: leader `. ` or `- `. Run-out: the red underscore to
  the margin (once or doubled). Breaks: three or five stars, the middle red; the Utah dash rule with a red star; a
  double rule with a red row between. Quotation: the Utah caption, a red colon a line and a black star at the middle.
- **B · Typestract** (Houédard, Werkman). Drop: the capital as a stencil, the paragraph's first word typed through it on
  quarter-row feeds, black and red rows in turn. Paraph: `o` with `x` or `+` over it, red. Filler: the paragraph's last
  letter every other cell, three passes thinning to one. Run-out: red and black underline marks on quarter-row feeds.
  Breaks: a cross of `o`; one ring of the heading's first letter; Sonic Water nested squares from the heading's word.
  Quotation: its first word typed down the margin, a red chain.
- **C · Typing-manual borders**: not built. Its one real source in hand (the Utah caption and dash rule) went into A;
  without an open-licence manual border plate the direction would be invented, not measured.

**Timing** (Chrome, the GPU via ANGLE, a machine shared with two other agents' renders, load ~15): a specimen panel's
whole ornament (drop, paraph, filler, run-out, three breaks, the quotation), typed and poured: DPR 1, 95–190 ms for the
first panel (with the engine's context and shader compile) and 35–80 ms for the next; DPR 2, 130–390 ms first, 50–150 ms
next. The engine's start-up is the one cost over budget, and a page shares it with every other engine style.

### Scores (05-the-bar, my read at 1440 and 390, 1× and 4×)

| | A variegated | B typestract |
|---|---|---|
| Beauty | 2 (quiet, true to the office page; the drop's red field is pale at 1×) | 2 (the drop and the end square are the strongest pieces; the filler's run of g reads as letters) |
| Craft at every scale | 2 | 2 |
| Living imperfection | 2 (per-key faults, ribbon, fibre: measured) | 2 |
| History without pastiche | 2 (the Utah caption is real; no typewriter-font cliché) | 2 (Houédard's grammar, not his images) |
| Restraint | 3 | 2 (the end square is dense by design) |

Risks to watch: ornament made of letters read as text (B's filler and rings: "gggg", "mmmm"); A's field key (`X` reads
cross-stitch, `M` heavy); the drop on a phone (3 lines) is small for either capital; the red ribbon (Wichary's measured
red, deepened a little to 214 74 58) is still pink-orange at 1×; a deeper red would carry rank better but leave the measure.

---

## Stage 2: A, variegated typewriting (the owner's choice)

B was dropped as a direction (its module, kit/styles/typewriter-typestract.js, was removed). Its nested squares, typed from the
heading's word, are now A's break 3. tests/typewriter-directions.html shows A only.

- **The drop, three ways** (`?drop=`; shown side by side at page size in its paragraph, both themes, and at 2×):
  `solid` (the capital's own letter struck on quarter-row feeds and half-space steps through a card cut to the
  capital), `card` (a field as dense, the capital reserved), `display` (one strike of a display slug, Courier Prime
  Bold cut to the drop's height, red, underscored in black). **Recommended: display.** It is the only one that reads as
  one clear letter at 1× and on a phone. Its contour is the face's, it carries the ladder's top rank (the capital
  underscored), and the medium shows only as a gentle mottle. `solid` reads as a woven, gingham-like mass. `card` is
  legible, but it is a block more than a letter. Neither the squash nor the cloth softening nor a key's faults scale
  with the slug: they are lengths on the paper, in the page's em. A display slug of a drop's size is our licence: the
  bulletin typewriters' faces were smaller.
- **The red** is now brick (172 52 36 at a full coat, on bond): Wichary's heaviest red strokes (207 77 60) taken on to
  a bichrome ribbon's lower band, so a thin strike thins to a warm salmon and never to pink. Dark: 226 100 70 as a film.
  This is an estimate: no open close-up of a bichrome sheet was found.
- **The clogged counter's rim** is gone. The clog is now filled on the slug as cut, before the platen's squash and the
  cloth soften it, so the fill and the strokes soften together. The fill thins inward with no edge of its own.
- **Grain at page size.** The paper's fibre is area-filtered by its true cell size (~0.18 mm): under ~2 device px it is
  seen only as its mean. At page size a strike is near-flat, and the grain opens as it is enlarged. The 18 px/mm
  measures are unchanged (fresh 0.70 ± 0.10, cv 0.07; worn 0.44 ± 0.10, cv 0.11).
- **Every mark varies with the seed** (the six-seed sheets, light and dark). The typist's choices are: the leader
  (`. ` `- ` `-.` wide dots), the run-out (single or double underscore, or `=`), the stars and their count, the dash
  rule's key and its centre, the rings' size and colours, the quotation's column (`:` or `|`) and its mark, the drop's
  rule, and the pilcrow (struck once or twice, underscored or not). The machine's faults come on top.
- **Phones:** at 390 px the drop is three lines (~70 px). The display capital stays whole and legible.
- **Timing.** A panel's pieces are poured as one sheet, one pour per colour (as plotter-pen.js printMany does), and
  the engine is made while the fonts load. At DPR 2, from a cold browser on a machine at load ~14: the first panel
  takes 95–150 ms (one run 228 ms), the second 70–100 ms.

### Stage 2b: the drop reworked on the card (the owner: "card is the only decent one")

The display and solid drops are removed. Every candidate now reserves the capital (Courier Prime Bold) as paper in a
typed field, under a card. Each was checked with B, A, W, O and S at page size and at 2×, in light and in dark.

| candidate | what it is | verdict |
|---|---|---|
| words | the paragraph's words typed on quarter-line feeds, in black and red pairs of rows | the letter reads, but the overlapping words look like a glitch at 2× |
| graded | one quiet key, with second and third passes over the lower part | legible; the cell gaps make vertical stripes, so it reads as a grid |
| tone | quiet keys a row each on quarter-line feeds (the seed's mix) | legible and lively; with `/` it reads as a hatch |
| **ruled** | underscores only, the platen turned a sixth of a line between rows, so the rules join into continuous lines; red, with a black rule every fourth or fifth row (or none) | **recommended**: legible as every letter at 1× and on a phone, and clean at 2× |
| outline (dropped) | the contour typed in keys that run its way | at drop size a scatter of bars |

The ruled drop comes from Houédard's red and black underline marks (*Typescript 140469*). The seed sets the rule
pitch (a sixth or a seventh of a line) and the black rule's cadence.

### Stage 2c: the drop family (the owner kept words, graded and tone; ruled removed)

The seed picks one of the three per page (`dropOf`). A richer page favours `words`: at rich .5 the odds are words
one half, graded and tone a quarter each. `?drop=` fixes one. The fixes:

- **All three:** a key the card would all but cover (≥ 80 % of its glyph's place) is not struck, so no slivers are
  left. The keys the card only partly cuts still draw the letter's clean edge.
- **words:** quarter-line feeds, the colour alternating every line, so each overlapping line is told from the next.
  At 2× it reads as interleaved red and black typing, not as collisions.
- **graded:** the first pass is on the pitch grid. The second goes over the lower two thirds a half space over,
  between the first pass's strikes. The third, back on the grid, goes over the lowest third. The tone builds toward
  the foot, with no vertical stripes.
- **tone:** only `=` and `-` (no `/` to hatch, no `:` or `.` to dot), and every other row a half space over: an even,
  brick-like tone.

The drop is four lines on a phone too: at three lines, the words drop lost its letter. All three were checked with B,
A, W, O and S at 1× and 2×, in light and dark, and at 390 px. graded is the most legible, then words, then tone (the
lightest). A panel's ornament takes 55–100 ms at DPR 2.

### Stage 2d: the words field made denser (the owner: "make words denser")

At 2×, the red and black lines on quarter-line feeds collided into fragments. The field is now the paragraph's own
words in red capitals, run together (as Sonic Water runs its letters), the platen turned .56 em a line: just less than
a capital's height. The lines close into an even field of typing, and the card's edge, and so the letter, is
unmistakable at 1× and 2×. Checked with B, A, W, O and S, light and dark.

## Stage 3: the style (kit/styles/typewriter.js, internal key `typewriter`)

Typewriter joins rubricate as a written style, after Rock, Plotter and Duplicator. Every SELECT mark is typed by the
page's one machine (setup's seed) and poured through the ink engine; a page's still pieces are gathered while the
host makes its cases and poured as one sheet per ribbon colour. Each sheet holds only the pieces that colour inks, each
cut to its ink, so a page costs one pour and one read-back per colour.

| mark | made of |
|---|---|
| drop (five lines; four on a narrow measure) | the capital reserved as paper in a typed field under a card: words, graded or tone, as the page's machine chooses (`dropOf`: a rich page favours words; lavish is always words; plain is tone in black) |
| line initial | the capital struck from a display slug, red, its top kept under the line box above |
| paraph | the pilcrow in red, struck once or twice (the seed’s), on the indent’s baseline |
| filler | a paragraph's open end: the leader on the machine's columns (usual and up, on lines left well open) |
| run-out | the heading's underscore to the margin in red (once, doubled, or an `=` rule: the seed's) |
| breaks | a part (rank 1): three or five stars, the middle red; a chapter (rank 3): the dash rule with a red star; the end (rank 2): a double rule with a red row between, and from fine up, nested squares typed from the title's longest word (Sonic Water) |
| quotation | the caption's column: a red colon each line, a black star at the middle line |
| aside, code | a typed rule `+-----+` at the head (usual), at the foot as well (lavish) |
| pull quote | a red `+=====+` over it (usual), under it as well (lavish) |
| figure | red corner marks: two corners (usual), four (fine) |
| contents | a red dash before each entry, as in a typed list (modest) |

**The five budgets** go from a memo to a typestract. Plain is one black ribbon: the drop's field in black, a black
pilcrow, the breaks in black. Modest brings the two-colour ribbon: red drop, red pilcrow, run-outs, red at the breaks'
hearts, the caption column, the contents' dashes. Usual adds leaders, the frames' rules and two corner marks. Fine
adds the nested-squares end, four corners, and breaks varied by their number. Lavish has the words drop always, foot
rules and the pilcrow struck twice.

**Dark mode** is a cover-up film on black card. The page's own `--paper` is the stock, read live under both the
system theme and `data-theme`.

**?draw** types each piece on a canvas of its own as you watch, in the typist's rhythm (the drop within ~4 s, small
pieces within ~2 s), then lays the still.

The face (Courier Prime Regular and Bold) ships subset and renamed as Illum Typewriter Courier in fonts/typewriter/,
with its note and the OFL. The full TTF-derived woff2 files and Cutive Mono beside it serve only the study pages.

**Timings.** The specimen (tests/typewriter.html, seed 7) was loaded cold in Chrome on the Arc GPU (ANGLE/Vulkan), on a
machine at load ~6, best of two. Each figure is the page's whole ornament, ms, rubricate's "all":

| | plain | modest | usual | fine | lavish |
|---|---|---|---|---|---|
| dpr 1, light | 48 | 70 | 82 | 81 | 82 |
| dpr 1, dark | 49 | 61 | 78 | 95 | 79 |
| dpr 2, light | 70 | 120 | 137 | 137 | 153 |
| dpr 2, dark | 68 | 113 | 140 | 134 | 141 |

Where it went (lavish, dpr 2): the slugs ~15 ms, the deposits ~30, the one pour and its read back ~50, the composite
~12. Four changes got it there:
- All of a page's pieces, black and red, go on one sheet: one pour and one read back for the page.
- Each cell is cut to its ink.
- A strike is stamped only over its glyph's own box.
- The fibre and weave are skipped where they would be finer than a pixel.

At load ~15, the same pages ran 1.3–1.6× slower.

**Checks.** tests/typewriter.check.mjs ran every budget × seeds 1, 2, 3, 7 × 1440 and 390 × light and dark. All 80
pages pass, with no ink on a line box and none at the page's edge. With `SITE=`, the built see page passes at every
budget (seeds 1 and 7, 40 pages). There is no `variant` getter, so the cold-load case is unchanged.

### Stage 3b: refined (the owner: "optimize, refine, seed, add richness")

- **Fillers read as lines, never as points.** The leader is a typed line: spaced hyphens, hyphens, underscores, `=`, or
  `-=` alternating. The machine chooses it from the budget's set (usual: `- `, `-`, `_`; fine: `-`, `=`, `_`, `-=`;
  lavish: `=`, `-=`, `_`). Periods and colons are gone from every leader, break and frame: the dash rule keys
  `- = _`, and the quotation's column is a typed bar `|` a line.
- **The line's initial** is now the capital typed at the text's own size in red, struck twice, with a typed underscore
  beneath (the ladder's raised word). It replaces the large struck capital, the treatment the owner rejected for the drop.
  A card-reserved field at a line's height (3 quarter-lines by 2 cells) could not hold its letter.
- **The words drop** has even feeds a little over a capital's height (.66 em), so no glyph overlaps the next. A capital
  the card would cover by more than .7 is not struck, so the card's edge keeps no fragments. It is still a dense field of
  the page's words, and the letter reads at 1×, 2× and on a phone.

## Stage 3c: drawn, the colour no longer pops in

The owner saw the colour pop in when Typewriter was written (?draw).

**Cause.** A drawn piece is its still, the page's batched print, seen through a window (kit/inkletter.js 'reveal'). The window was the machine's writer's own typed ink, so its opacity was the ink's opacity: about .6 for the ribbon's red and .7 for the black on bond, not 1. A struck cell therefore showed its still at about 60% strength while the piece was typed, and jumped to full when the piece was laid. Measured just before it was laid (f .995), against the share its strikes had laid by then:
- the drop showed 62% of its ink against 98% struck;
- a break showed 45–63% against 68–98%;
- the line initial showed 60% against 75%.

Ink that had crept more than 3 px past its glyph had no strike time, so it also waited for the end.

**Fix** (`typewriter-machine.js` writer `o.mask`, used by `typewriter.js`):
- The window is now the share of each pixel's final ink that has landed, so a cell shows its still's own colour at full strength the moment its key strikes, and a cell struck twice darkens at its second strike.
- Every crept pixel takes its nearest struck neighbour's moment, spreading outward through the pixels its pass's film reaches.

A key still strikes at once: a piece's last strike (a quotation's red bar, a break's red star) lands as the piece is laid.

**Checks** (`tests/typewriter.check.mjs`, new drawn part):
- The frame-sampled drawn page: before, 9 and 20 pieces came in whole at 17–45 ms frames; now none.
- The clock-free window test (every kind of piece, five budgets, two seeds, light and dark): every piece now shows what its strikes have laid. Its control, the old window, fails as it should.
- The still is unchanged: `tools/diff.mjs` is identical at 1440 and 390, light and dark.
