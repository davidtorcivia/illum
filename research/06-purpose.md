# 06: Purpose. What illumination was *for*

`01-canon.md` records what illumination looks like. `05-the-bar.md` sets out how it will be judged. This file covers the reasons: what illumination did on the page, and what the people who made it believed they were doing. A library that copies the look without these reasons produces pastiche. One that keeps them can produce something new and still belong to the tradition.

**Conventions.** Text in quotation marks is verbatim from a page fetched on **2026-11-06**, and its URL is listed under the section's Sources. A claim that reached me only as a paraphrase in a search summary is given as a paraphrase and tagged `[unverified]`. Owen Jones's Propositions are quoted in full in `01-canon §5.1`, and Ruskin's test and the anti-patterns are in `05-the-bar`. I refer to those files rather than repeat them.

**The thesis in one paragraph.** A medieval, Islamic or East Asian maker did not think of ornament as something added to a finished page. Each one served a job. Light carried meaning. Memory needed places. Readers needed a way to find things before page numbers existed. A sacred text was owed honour. The margin held a second voice. The eye needed a breath. The maker wanted to be remembered and offered the work. Each job made specific demands: gold at openings, graded initials, red ink for instructions, empty space, a colophon. On the web most of these jobs are done badly or not at all, by hero images, uniform drop caps, cards, ads in the margin and infinite scroll. illum's task is to take the jobs back. Its look should follow from them.

---

## 1. Light

**The function.** Light was the purpose of illumination as well as a material in it: the page was meant to catch light and change under it. The Latin *illūminō* is "From *in-* ('in') + *lūminō* ('light up')". Its senses include "illuminate", "adorn" and "make conspicuous" (Wiktionary). The one verb covers lighting, decorating and drawing attention.

**What makers believed.** Abbot Suger (d. 1151) wrote of the gilded doors at Saint-Denis that the work was meant to lead the mind "To the true light, where Christ is the true door". His summary of the whole theory is "The dull mind rises to the truth through material things". Of gems and gold he wrote: "By the gift of God I can be transported in an anagogical manner from this inferior level to that superior one" (*De administratione*, trans. Burr). Behind Suger stands Pseudo-Dionysius, *Celestial Hierarchy* I. In it the divine Light "elevates to Itself, according to their capacity, those who turn towards It", and material light is "the earthly lights a figure of the immaterial enlightenment". Beauties seen are "images of the hidden beauty". Fitzwilliam Museum curators note that precious metals "embodied the most mysterious of God's creations – light". They add that gold initials "would have shone with particular intensity during services", "illuminated by the warm glow of lamps and candles". Light also served the reader's comfort. Cassiodorus equipped his scriptorium with "self-fueling mechanical lights made for study at night which maintain their bright flames", and with a sundial and a water clock.

**How it showed on the page.** Burnished leaf on a raised ground acts as a mirror: dark from one angle, blazing from another, so it changes when the reader's head or the candle moves. Shell gold is matte and steady. Punched dots in burnished gold scatter light so it "play[s] across the surface" (Fitzwilliam). Gold was expensive and placed by rank: at the opening of a book, a psalm or a feast, rarely in running text. The page was a time-based medium. Nobody saw it the same way twice, and nobody saw it lit evenly.

**What it asks of illum.**
- Gold is a material with a light model, not a yellow hex value. Burnished and shell gold are separate materials. Burnished gold has a specular lobe that responds to a light position. Shell gold is diffuse with fine grain.
- Light moves only when the reader moves: pointer, scroll, device tilt, or the real time of day (seed: *time-of-day lighting on gold*). Nothing loops by itself. Under `prefers-reduced-motion` the page shows one well-lit still, complete in itself.
- Gold is scarce and ranked. It appears at true openings (§3), and the budget scales with structural rank.
- Light reveals and never dazzles. Morris wanted pages that "should not dazzle the eye". A highlight never passes over body text, and text contrast never depends on the light state.
- Dark mode is night, not an inverted palette: a warm, local light source (the candle at the cursor) with gold reading as the brightest thing on the page.

**Sources.** Suger, *De administratione*, trans. David Burr, https://sourcebooks.fordham.edu/source/sugar.asp (fetched 2026-11-06). Pseudo-Dionysius, *Celestial Hierarchy* ch. I, https://ccel.org/ccel/dionysius/celestial.ii.html (fetched 2026-11-06; translator not shown on the page, probably Parker 1897 `[unverified]`). Fitzwilliam Museum, "Painting in gold and silver", https://colour-illuminated.fitzmuseum.cam.ac.uk/explore/painting-in-gold-and-silver (fetched 2026-11-06). Cassiodorus, *Institutions* I.30, trans. Halporn, https://faculty.georgetown.edu/jod/inst-trans.html (fetched 2026-11-06). Wiktionary, *illumino*, https://en.wiktionary.org/wiki/illumino (fetched 2026-11-06). The link between *illuminate* and English *limn*/*limner* is `[unverified]` (etymonline returned 403).

---

## 2. Memory

**The function.** The decorated page was something to memorise and to remember with. Readers trained their memories, and every distinctive feature of a page gave them a place to hang the text.

**What makers believed.** Mary Carruthers argues that "medieval culture was fundamentally memorial, to the same profound degree that modern culture in the West is documentary" (*The Book of Memory*, 1990; quoted in a catalogue description, `[unverified]` page). The key primary text is Hugh of St Victor's preface to his *Chronicle*, *De tribus maximis circumstantiis gestorum* (c. 1130), addressed to boys starting their studies. Hugh tells them to learn a text together with its page: whether it stood on recto or verso, at the top, middle or bottom, and what colour and shape the letters and the ornament of the parchment had. They should recall the page as an image, and even the conditions under which they first learned it (paraphrased via Carruthers; translation in Carruthers & Ziolkowski, *The Medieval Craft of Memory*, 2002; `[unverified]` wording). In her review of Camille, Carruthers reads marginal images as mnemonic aids for meditative reading, with reading pictured as rumination and digestion. On this reading the strange beast in the margin is a hook for memory. Her later idea of *ductus*, the way a work is arranged to lead a person through it (*Rhetoric Beyond Words*, 2010, `[unverified]` wording), links memory to wayfinding (§3).

**How it showed on the page.** No two openings looked alike. A psalter's major initials had distinct subjects and colours, so a reader could find "the psalm with the harper in the B" again. Layout stayed fixed: a manuscript never reflowed, so its places were permanent.

**What it asks of illum.**
- **Determinism is a moral requirement.** The same text must always get the same illumination. Seed every piece from a hash of its content plus a stable section id, never from `Math.random()` per load. A reader who returns should find the heron where it was. Random re-rolls destroy memory places.
- **Distinctiveness.** Neighbouring sections must differ visibly in motif, accent pigment or initial subject. A page of identical ornaments has no places in it. Test: show a reader two sections' initials at thumbnail size. They should be able to tell which is which.
- **Anchor to content, not to the viewport.** On resize, ornament scales and reflows with its paragraph. It does not regenerate. Breakpoints may drop marginal pieces (§5) but must not re-seed them.
- **Edits are scoped.** Editing one paragraph changes only that paragraph's seed. The rest of the page keeps its places (hash per block, not per page).
- **The page may remember the reader too** (seed: *reading wear*). This is optional, kept per visitor in `localStorage`, and wrapped in try/catch.

**Sources.** Carruthers's review of Camille, *The Medieval Review* 94.04.02, https://scholarworks.iu.edu/journals/index.php/tmr/article/view/14218 (fetched 2026-11-06). Hugh of St Victor and the "fundamentally memorial" line come from search snippets only (Carruthers, "The Art of Memory and the Art of Page Layout in the Middle Ages", *Diogenes*; the Cambridge PDF host failed DNS) `[unverified]`. Ductus: review summaries only `[unverified]`.

---

## 3. Wayfinding: ornament as information architecture

**The function.** Books had no page numbers, indexes or search. Ornament was how readers navigated: how they found the start of a book, a chapter, a psalm, a verse or a gloss.

**What makers said and did.** "Medieval scribes understood that readers needed ways to help them navigate a text." The enlarged first letter "greatly helped introduce a new chapter or section" (Medievalists.net, drawing on Kwakkel's *Books before Print*). Thirteenth-century scholarly books formalised this as *ordinatio*, the arrangement of the page for finding. M. B. Parkes describes chapter divisions, running titles, alternating red and blue paraphs, graded initials and, later, alphabetical indexes as one system ("The Influence of the Concepts of Ordinatio and Compilatio", 1976/1991, `[unverified]`). Readers built their own finding devices too. Kwakkel found a medieval bookmark with a rotating disc that let a reader mark which column held the passage they wanted (Leiden University, `[unverified]`). The clearest case is the **pilcrow**. The scribe left a gap and the rubricator painted ¶ into it afterwards. When rubricators "ran out of time" the gap stayed empty, and that empty gap became the paragraph indent (Smithsonian, after Keith Houston, *Shady Characters*, `[unverified]` beyond the summaries). Our most invisible typographic convention is an ornament that was never painted. In the manuscript, information architecture and ornament were the same thing.

**How it showed on the page.** A strict ladder. A historiated or large painted initial opens a book or major division. A smaller champ or puzzle initial opens a chapter. A one-line penwork initial opens a verse. A paraph marks a sub-point. Line-fillers close short lines. Rubrics (in red) carry titles and instructions, and running heads say where you are. Initials alternate red and blue, so siblings can be counted. A reader could see the rank of every division on an opening at arm's length, and it worked while thumbing through, before any reading started.

**What it asks of illum.**
- **Initials only at true structural openings, ranked to match the heading hierarchy.** `h1` or document start gets a major initial. A section (`h2`) gets a minor initial. A subsection (`h3`) gets a penwork initial. The first paragraph after `h4` and below gets nothing or a coloured versal. Never decorate every paragraph. Never put a structural mark on non-structural content such as cards, CTAs or pull quotes, because that misleads the reader's navigation.
- **Rank readable at a glance.** Test: downscale a full-page screenshot to 10%. The section count and their order of importance should still be readable.
- **Alternation as an ordinal.** Sibling sections alternate accents (red/blue or the site's pair), and the alternation resets at each parent level.
- **Grow ornament from the DOM tree** (seed: *hierarchy-grown borders*). A border whose branching mirrors the heading tree works as a table of contents.
- **Scrolling stands in for thumbing.** Offer an optional margin rail of ranked marks (a miniature of the initials) that links to the anchors, plus catchwords at the foot of each viewport "leaf" (seed).
- **Structure stays in the markup.** An initial is the real first letter of the real text, styled; screen readers read it once. All ornament is `aria-hidden`. Navigation never depends on ornament alone.

**Sources.** Medievalists.net, "Seven things to look for in medieval manuscripts" (2023), https://www.medievalists.net/2023/10/seven-things-to-look-for-in-medieval-manuscripts/ (fetched 2026-11-06). Leiden bookmark: search snippet of https://www.universiteitleiden.nl/en/news/2014/10/rare-medieval-bookmark-found-in-leiden-university-library `[unverified]`. Pilcrow: Smithsonian https://www.smithsonianmag.com/arts-culture/the-origin-of-the-pilcrow-aka-the-strange-paragraph-symbol-8610683/ and the TUGboat review of Houston, search snippets only `[unverified]`. Parkes `[unverified]`.

---

## 4. Emphasis and rank: rubrication

**The function.** Emphasis meant changing the ink, not the weight of the letter. Red marked a different *kind* of text: a title, an instruction, a feast day (hence the "red-letter day"). It did not mark text the writer considered more important.

**What makers believed.** Pigment carried a price and a theology. Ultramarine came from lapis lazuli, and gold was what it was. Using either was a spending decision made by rank. The Jewish principle of *hiddur mitzvah*, beautifying a commandment, adds a limit. Shabbat 133b reads Exodus 15:2 ("This is my God and I will glorify Him") as a call to beautify one's observances, including "a beautiful Torah scroll" written by a skilled scribe with fine ink and pen and wrapped in silk. Bava Kamma 9b caps the extra spending on beauty at **one third** (*ad shelish*) (My Jewish Learning / Peninei Halakha summaries, `[unverified]` wording).

**How it showed on the page.** Red marked the voice that told you how to read: rubrics, headings, liturgical directions, the names of speakers. Blue, and above all gold, belonged to the top of the ladder in §3. One manuscript had a small palette used consistently.

**What it asks of illum.**
- **Rubricate meta-text, not opinion.** Rubrication applies to what the author's markup already distinguishes: `<dfn>` (first occurrence), `<time>`, labels, speaker names, instructions, small-caps run-ins. It never applies to sentences a heuristic guesses are important (the seed *rubrication by meaning* should stay opt-in and conservative).
- **One rubric colour per site**, used consistently.
- **A pigment budget.** Each page gets a fixed allowance of each pigment, and the highest-ranked opening spends the ultramarine and the gold (seed: *pigment budgets*).
- **The one-third rule.** Ornament may not exceed one third of an opening's visual weight. Measure it as ornament ink area against text ink area at the reading position, or as pixels of ornament against text block per viewport. Above that, the page is about the ornament.

**Sources.** Hiddur mitzvah: search snippets of https://www.myjewishlearning.com and https://ph.yhb.org.il/en/?p=11057 `[unverified]` (Sefaria's page did not render). Lapis and gold costs are general knowledge, `[unverified]` here; see `01-canon §2.5`.

---

## 5. Commentary and play: the margin

**The function.** The margin was a second voice beside the text. Glosses explained it, readers argued with it, and drolleries mocked, echoed or literalised it. It is where the reader's mind lives on the page.

**What makers and scholars said.** Michael Camille, *Image on the Edge* (1992), quoted with page numbers in Carruthers's review: marginal images "work to reinstate the very models they oppose" (p. 30). "[T]he centre is ... dependent upon the margins for its continued existence" (p. 10). Medieval readers were "eager to make images on the edge" (p. 10). Gothic marginal art "flourished ... by virtue of the absolute hegemony of the system it sought to subvert" (p. 160). Carruthers answers that the margins were mainly cognitive and ethical: prompts for memory and meditation, not class revolt. Both agree the margin is in conversation with the centre and is *about* the text. Kwakkel notes wide margins existed so readers could write in them, which "would have been popular with students".

**How it showed on the page.** Snails fighting knights. Visual puns that turn a word in the adjacent line into a picture. The glossed Bible, with the text in the centre and commentary set around it in a smaller hand. Manicules pointing at the passage that mattered. The margin used a different scale, a lighter hand and different rules, and it always pointed back at the text.

**What it asks of illum.**
- **The margin is a different register:** smaller, lighter, never in the reading line, and never competing with body contrast.
- **Commentary must be keyed to its text.** A marginal motif is triggered by the paragraph beside it (seed: *marginalia that comment*, a lexicon-to-motif table). At most one per screen. A motif that could sit beside any paragraph is wallpaper and should be deleted.
- **Wit is part of the tradition** and should be allowed. But a joke needs a text to play off, and permission to parody belongs to the author: an explicit `data-illum-play` opt-in, off by default.
- **Leave room for the reader.** Never fill a margin to its edge. A margin the reader can annotate (seed: *code illumination* treats comments as glosses) is worth more than one that is full.
- **On narrow screens commentary degrades on purpose.** Either it becomes an inline mark that expands, or it is dropped. A piece that can be dropped without loss of meaning is decoration. A piece that carries meaning needs a fallback.

**Sources.** Carruthers, review of Camille, https://scholarworks.iu.edu/journals/index.php/tmr/article/view/14218 (fetched 2026-11-06). All Camille quotations come through this review. Kwakkel via Medievalists.net (above). The glossed-Bible layout is general knowledge, `[unverified]` here.

---

## 6. Pacing and breath

**The function.** Ornament set the pace of reading: where to stop, where to cross a threshold, where to rest. Empty space was designed as carefully as the full.

**What makers believed.** Xie He's first principle, *qiyun shengdong* (spirit resonance, life-motion), puts living breath above everything else. Without it, he says, nothing else matters (see `01-canon §4.1`). Okakura, *The Book of Tea* (1906), after Laozi: the reality of a room lies in "the vacant space enclosed by the roof and the walls". "Vacuum is all potent because all containing." "In leaving something unsaid the beholder is given a chance to complete the idea." "True beauty could be discovered only by one who mentally completed the incomplete." In Shitao's *yihua*, the single stroke, a whole design "begins and ends with that one stroke" (Met, paraphrase of his 1699 fan inscription, `[unverified]` wording). Insular gospel books put a carpet page, a full page of pure ornament, before each gospel: a threshold to pause at before the text (`01-canon §1.4`). Morris: "the two pages making an opening are really the unit of the book".

**How it showed on the page.** Density came in pulses. A blazing opening was followed by long, plain columns, with only small marks of rank. Ornament gathered at thresholds and thinned in the reading runs. A book ended with an explicit, a finis, a colophon.

**What it asks of illum.**
- **Concentrate at thresholds, empty the runs.** Ornament density follows the structure (heavy at section openings, close to zero mid-section), not the space available. The seed *density ∝ importance, not area* is the rule.
- **Budget the void.** Every component declares how much empty space it needs around it. No generator fills all the space it is given.
- **A section break is a breath.** Treat `<hr>` and section ends as one gesture: a fleuron, a single brushed stroke, a line-filler. Do not run a pattern there.
- **Every page needs an end.** Ship a finis/colophon component, because infinite scroll has no last line. Recall Æthelberht's "Like a timely harbour to sailors is the last line to scribes."
- **Motion keeps reading pace.** Anything that draws itself does so once, at about the speed of a hand, then stops for good.
- **The opening is the unit** at widths where two columns or text plus margin fit. Compose text and margin as one spread, not as independent boxes.

**Sources.** Okakura, *The Book of Tea*, https://www.gutenberg.org/cache/epub/769/pg769-images.html (fetched 2026-11-06). Morris, "The Ideal Book" (1893), https://www.marxists.org/archive/morris/works/1893/ideal.htm (fetched 2026-11-06). Shitao: Met search snippet, https://www.metmuseum.org/art/collection/search/49175 `[unverified]`. Æthelberht: Vatican Pal. lat. 68 via Porck (§8 sources).

---

## 7. Honouring the text

**The function.** Ornament existed to honour the text. It dressed the words, framed them and declared their worth, and it never competed with them.

**What makers believed.**
- *Christian Latin.* Cassiodorus brought in bookbinders "with the object of covering the loveliness of sacred letters with external beauty". He compared this to the parable of the lord who "dressed in wedding garments" his guests. On this view ornament is the text's wedding clothes. Morris secularised the idea and kept it architectural: "a book quite un-ornamented can look actually and positively beautiful … if it be, so to say, architecturally good", and "The ornament must form as much a part of the page as the type itself, or it will miss its mark". From the Kelmscott *Note*: he tried "to keep in mind the necessity for making my decoration a part of the page of type".
- *Islamic.* Calligraphy ranks highest among the arts because it carries the revealed Word. The Qur'an speaks of God who "taught by the pen" (96:4) and swears "by the pen" (68:1) (`[unverified]` translation, quran.com did not render). Ibn Muqla's proportioned script (*al-khatt al-mansub*) derives every letter from "three sets of measurements: the dot, alif, and circle". The dot is the rhombus the reed nib makes, so beauty is fixed by the writing instrument. A saying records the calligrapher's standing: "Purity of writing is purity of the soul" (Asian Art Museum). Tezhip means "ornamenting with gold". It concentrates on opening pages, "heads of Qur'anic chapters" and end pages, and flower-shaped markers between verses are called *durak*, "pause" (Wikipedia; Turkish search snippet `[unverified]`). The illuminator frames, marks structure, and works around the word. A frequently cited hadith gives the wider basis: "God is beautiful and loves beauty" (Sahih Muslim, numbering varies, `[unverified]`).
- *Hebrew.* *Hiddur mitzvah* (§4): the scroll is beautified because it is holy, and only up to a limit. Hebrew micrography makes the masorah, the apparatus of word counts that protected the text, into ornamental shapes in minute script (Encyclopedia.com, `[unverified]` wording). Here the ornament is literally made of the words that guard the text.
- *Jain.* Kalpasutras were written in gold letters and donated to temple libraries (§9).
- *Modern.* Bringhurst, §1.1: "Typography exists to honor content."

**How it showed on the page.** Frames (unwan, sarlawh, shamsa) surrounded the text and never covered it. Verse markers gave the text's own divisions a jewel. The finest pigment went to the opening of the most important text. The script came first and the illumination was laid out around it.

**What it asks of illum.**
- **Never occlude.** Ornament never overlaps, sits under, or lowers the contrast of body text. Text keeps its own ground. Enforce this with an automated check of computed contrast and bounding-box intersection.
- **The author chooses what to honour.** Illumination is opt-in per element (`data-illum`), apart from structural defaults derived from markup. The library does not decide that a cookie banner deserves gold.
- **Typography first, then the last coat.** illum's base layer is a good text block: measure, leading, a real text face, and true small caps. Ornament is added only after the text passes. A page that fails the typographic baseline gets no ornament, plus a warning.
- **Ornament made from the text.** Where possible, ornament is derived from the content itself, the micrography principle. The seeds: the carpet page seeded from the letters that follow, initials grown from the glyph's own skeleton, borders whose rhythm counts the section's words.
- **Mark the text's own divisions.** Verse markers, list counters, footnote markers and section numbers are where small jewels belong (seed: *numbers as ornament*).

**Sources.** Cassiodorus, Halporn trans., https://faculty.georgetown.edu/jod/inst-trans.html (fetched 2026-11-06). Morris, "The Ideal Book", https://www.marxists.org/archive/morris/works/1893/ideal.htm (fetched 2026-11-06), and *A Note … on his Aims in Founding the Kelmscott Press*, https://www.gutenberg.org/files/31596/31596-h/31596-h.htm (fetched 2026-11-06). Asian Art Museum, "The History of Islamic Calligraphy", https://education.asianart.org/resources/the-history-of-islamic-calligraphy/ (fetched 2026-11-06). "Ottoman illumination", https://en.wikipedia.org/wiki/Ottoman_illumination (fetched 2026-11-06). Bringhurst §1.1 via http://www.hannahfarnham.com/binding/elements-of-typographic-style (fetched 2026-11-06). Micrography, hadith, and Qur'an verses `[unverified]`.

---

## 8. The visible hand and care

**The function.** The page bore witness that a person made it, with effort, over time, and for someone. The hand's traces were evidence of care and were not hidden.

**What makers said.** The scribes in their colophons (collected by Thijs Porck):
- "Tres digiti scribunt totum corpusque laborat": "Three fingers write and the whole body labours" (BL Royal 6 A.vi, f. 109r).
- "Dum digiti scribunt uix cetera membra quiescunt": "While the fingers write, the other members hardly rest" (BL Harley 3013, f. 96r).
- "Qui nescit scribere laborem esse non putat": "He who does not know how to write does not think that it is a labour" (BnF lat. 9561, f. 81v).
- "God helpe minum handum": "God help my hands" (BL Cotton Tiberius B.v, f. 28v).
- "Qui istum librum legat precat pro anima Sistan me scripsit": "Whoever may read this book, pray for the soul of Sigestan who wrote me" (BL Royal 8 B.xi, f. 145r).

Cassiodorus made the labour holy: "to preach to men with the hand, to set free tongues with one's fingers and in silence to give mankind salvation", and "Satan receive[s] as many wounds as the scribe writes words of the Lord." Ruskin made it political ("The Nature of Gothic"): "You must either make a tool of the creature, or a man of him". "No good work whatever can be perfect", and "the demand for perfection is always a sign of a misunderstanding of the ends of art". Gothic roughness shows "signs of the life and liberty of every workman who struck the stone". His rules for the buyer: "Never demand an exact finish for its own sake, but only for some practical or noble end". "Never encourage imitation or copying of any kind, except for the sake of preserving record of great works". Xie He's second principle, *gufa yongbi* (bone method in using the brush), ties stroke to character (`01-canon §4.1`). Japanese *wabi-sabi* values the same thing from the other side: the worn, the asymmetric and the incomplete as signs of time and of a hand (general knowledge, `[unverified]` here). Okakura's "mentally completed the incomplete" (§6) is the closest verified statement of it.

**How it showed on the page.** Strokes swell and taper with pressure. A border's penwork gets slightly looser towards the end of a long gathering. The scribe signs, complains and asks for prayers, *me scripsit*. The hand speaks in the first person on the page.

**What it asks of illum.**
- **Every irregularity has a cause.** This is the Ruskin test in `05-the-bar` §3.7: pressure, ink load, speed, fatigue along a long border, a motif squeezed because space ran out. Nothing is uniform noise.
- **Show the making, once.** On first visit a major initial may draw in its real stroke order at hand speed (seed: *slow-loading as a virtue*). After that it is simply there.
- **A colophon on every illuminated page.** It is small, at the end, and in the first person. It names the human maker, says illum generated it, and records the seed, the date and the rules applied ("me scripsit"). It is the one place a visitor can see who made the page and how.
- **The program proposes, a person keeps.** Seeds are curated, not taken from the first draw (see §12).

**Sources.** Thijs Porck, "Scribal complaints" (2017), https://thijsporck.com/2017/06/12/scribal-complaints/ (fetched 2026-11-06). Cassiodorus (above). Ruskin, *The Stones of Venice* II ch. VI, https://www.gutenberg.org/files/30755/30755-h/30755-h.htm (fetched 2026-11-06, offset 300000).

---

## 9. The gift to a reader

**The function.** An illuminated book was a gift: to God, to a saint, to a community, to a library, to later readers. Time spent on it was an offering, and the work was dedicated to someone.

**What makers believed.** The Lindisfarne Gospels' colophon (added by Aldred c. 950–970) says Eadfrith wrote the book for God and St Cuthbert, Æthelwald bound it, and Billfrith the anchorite adorned it with gold, gems and gilded silver. Scholars debate how literally to read it (Wikipedia, `[unverified]` wording). Among the Jains, *shastra-dana*, the gift of a manuscript to a temple library, earned spiritual merit. Merchant patrons commissioned illustrated copies, King Kumarapala is said to have endowed twenty-one libraries each with a gold-lettered Kalpasutra, and colophons name the donor families (search summaries, `[unverified]`). Cassiodorus's lamps and clocks were also gifts, comforts for readers working at night. Morris defined the ideal book as one "not limited by commercial exigencies of price". In the age of software, Robin Sloan: "I made a messaging app for, and with, my family." "It is ruthlessly simple; we love it; no one else will ever use it." "I am the programming equivalent of a home cook." Quoting Shirky: "Situated software … is personal from its inception."

**How it showed on the page.** Dedication pages. Donor portraits. The owner's arms in the bas-de-page. Work spent on folios a patron might never open. The book was made for these readers.

**What it asks of illum.**
- **The text arrives first; illumination follows as a gift.** Body text renders at full speed with no dependency on illum. Ornament paints afterwards with zero layout shift (reserve its boxes in CSS). A page with JS disabled is complete and plain.
- **The reader's device is the material being spent.** Set hard budgets on bytes, main-thread time and battery: no permanent animation loops, and canvases at rest when off screen. Loos's economics (§10) now apply to the reader's resources.
- **No extraction.** No tracking, no network calls of illum's own. Reading wear and similar features stay local.
- **Accessibility is part of the gift.** Reduced motion, forced colours and high contrast all produce a complete page. Screen readers get the text untouched. Print stylesheets get the ornament as a still (the gift leaves the screen).
- **Specific, not generic.** Encourage motifs, lexicons and palettes specific to the site. The defaults are a starting point. A dedication field ("for …") in the colophon is worth having.

**Sources.** Robin Sloan, "An app can be a home-cooked meal" (Feb 2020), https://www.robinsloan.com/notes/home-cooked-app/ (fetched 2026-11-06). Morris (above). Lindisfarne: https://en.wikipedia.org/wiki/Lindisfarne_Gospels, search snippet `[unverified]`. Jain: search summaries (chitrolekha.com, jainqq.org) `[unverified]`.

---

## 10. The counter-arguments, taken seriously

### Loos, "Ornament and Crime" (1908/1910)

Loos's case, in the translation on the University of Washington's Vienna site: "cultural evolution is equivalent to the removal of Ornament from articles in daily use". "Ornament is wasted labour and hence wasted health … Today, however, it is also wasted material, and both together add up to wasted capital." "As ornament is no longer organically linked with our culture, it is also no longer an expression of our culture." "Don't you see that the greatness of our age lies in its inability to produce a new form of decoration?" And: "a smooth piece of furniture more beautiful than all the inlaid and carved museum pieces."

The answer, point by point:
1. **The economic argument now applies to the reader's device, not to the maker's labour.** Generated ornament costs the maker almost nothing per copy, but every visitor pays in bytes, CPU and attention. That makes Loos a budget, not a refutation, and illum accepts it (§9's hard budgets; §4's one-third rule).
2. **"No longer organically linked with our culture" is a test illum must pass.** Pastiche fails it: a Book of Hours border pasted on a blog is exactly the dead ornament Loos meant. Ornament that grows from the page's own structure (§3) and responds to the medium (viewport, light, time, the reader's progress) is organically linked to the web, because it could not exist anywhere else. Owen Jones, Prop. 36: "The principles discoverable in the works of the past belong to us; not so the results" (`01-canon §5.1`). The same rule appears in `05-the-bar §3.9`.
3. **Loos himself makes an exception**: "I put up with the ornaments of the natives, the Persians, the Slovak peasant woman and my shoemaker's ornaments". These are ornaments still *meant* by their makers. His objection is to ornament that nobody means. illum's bar is that every piece is meant, with a traceable reason (§12).
4. **He is right about the plain object**, and illum agrees for the body text. The web's "plain" default is not plain anyway: hero images, gradients, glassmorphism and shadowed cards are ornament that doesn't admit to being ornament. illum is ornament that says so.
5. The essay's anthropology, ranking cultures by their distance from the tattoo, belongs to colonial criminology and is not part of the argument illum adopts.

Taking Loos seriously means: **off by default; a page without illum is complete; every ornament pays its way in function.**

### Warde, "The Crystal Goblet" (1930/1932)

Warde's case: the fine glass is right because "everything about it is calculated to reveal rather than to hide the beautiful thing that it was meant to contain". "The most important thing about printing is that it conveys thought, ideas, images, from one mind to other minds." "Type well used is invisible as type." The typographer can "put up a stained-glass window of marvelous beauty, but a failure as a window". "Printing demands a humility of mind." "Vulgar ostentation is twice as easy as discipline."

The answer:
1. **Concede the text column entirely.** Measure, leading, body face and contrast belong to Warde, and illum never touches their legibility (§7's never-occlude rule). Oliver Reichenstein's restatement for the web is right: "95% of the information on the web is written language." illum is a typography library first, and the 5% exists to serve the 95%.
2. **Stained glass was never a failed window.** Nobody built a cathedral's glass to give a view. It was a light source carrying a story, placed where a view didn't matter. The illuminated page works the same way: its glass is at the openings, the margins and the thresholds, and the text column stays clear.
3. **The goblet has a stem.** Warde's stem is the one that "obviates fingerprints". It is structure that serves the drinker. Ornament used for wayfinding (§3), memory (§2) and pacing (§6) is stem, not a cloud in the bowl.
4. **She gives the permission herself.** "With this clue, this purposiveness in the back of your mind, it is possible to do the most unheard-of things, and find that they justify you triumphantly." Each function in this file is such a purpose. And: "you will be able to capture beauty as the wise men capture happiness by aiming at something else". illum aims at memory, finding, honour and breath, and beauty follows from them.
5. **Bringhurst reconciles the two positions**: "typography must often draw attention to itself before it will be read. Yet in order to be read, it must relinquish the attention it has drawn." Illumination at a threshold draws attention, and the clear column gives it back. That one gesture is illum's whole design.

### Tschichold and Mod, briefly

Tschichold's arc, from *Die neue Typographie* (1928) to classical symmetry after his 1946 dispute with Max Bill ("Glaube und Wirklichkeit"), is a warning against dogma in either direction (`[unverified]` beyond catalogue summaries). His late verdict: "Personal typography is defective typography. Only beginners and fools will insist on using it" (*The Form of the Book*, p. 4, via digest). For a generator, the system's personality must serve the text and must not be the first thing the reader notices. Craig Mod (2010): "Formless Content can be reflowed into different formats and not lose any intrinsic meaning". Definite Content "embraces the container as a canvas". Printed books must "embrace their physicality," working "in concert with the content to illuminate the narrative." A web article is formless content. illum's task is to give it definite moments **without breaking reflow**: every ornament is computed from structure and laid out again on any measure.

**Sources.** Loos, https://depts.washington.edu/vienna/documents/Loos/Loos_Ornament.htm (fetched 2026-11-06; translator not named; the page's "tbe" OCR typo is corrected above). Warde, PDF reprint from *Graphic Design Theory*, https://openlab.citytech.cuny.edu/langecomd3504fa2019/files/2018/10/Warde_CrystalGoblet.pdf (fetched and text-extracted 2026-11-06). iA, "Web Design is 95% Typography" (2006), https://ia.net/topics/the-web-is-all-about-typography-period (fetched 2026-11-06). Bringhurst §1.1 (above). Tschichold digest, https://artequalswork.com/posts/form-of-the-book/ (fetched 2026-11-06). Mod, "Books in the Age of the iPad" (2010), https://craigmod.com/journal/ipad_and_books/ (fetched 2026-11-06).

---

## 11. What current web conventions do badly

| Historical function | Today's convention | Why it fails |
|---|---|---|
| Light | Autoplay hero video, scroll-jacked parallax | Light that moves by itself, demands attention and never gives it back; unrelated to the text |
| Memory | A/B-tested layouts, random "featured" images, redesigns that move everything | Pages have no stable places, so nothing can be remembered by location |
| Wayfinding | Hamburger-hidden TOC, scrollbar as the only finding aid, `::first-letter` drop cap on every post | An initial with no rank: it marks "a post began", never "this is the major division" |
| Emphasis | Bold and highlight everywhere, brand colour on CTAs | The colour of instruction has been taken over by persuasion |
| Commentary | Margins sold to ads, sticky CTAs, "related posts" rails | The reader's space is used to solicit the reader; nothing in it speaks to the text |
| Pacing | Infinite scroll, uniform card grids | No threshold, no breath, no end; every item equally dense |
| Honouring | Shadowed cards and stock heroes for every item | A frame on everything honours nothing |
| Visible hand | "Powered by …", AI header images | No maker speaks, and the ornament has no hand and no reason |
| Gift | Megabytes of JS before the first word, tracking | The reader pays to be extracted from |
| Night | Dark mode as colour inversion | A negative, not a candle |

---

## 12. Where intention lives when the maker is partly a program

Ruskin's choice was "a tool of the creature, or a man of him". Here **the program is the tool, and the person keeps the freedom.** In the manuscript, intention lived in the hand at each stroke. In illum it lives in five places, and each should be visible in the code and in the colophon:

1. **In the rules.** Every generator rule is written by a person and cites the function it serves (light, memory, wayfinding …). A rule that cannot name its function is removed. This is Loos's test applied to code.
2. **In the choice of what to honour.** The author marks the text (`data-illum`, heading structure, `<dfn>`), the way a patron chose which feasts got gold. illum ranks, and the author chooses.
3. **In curation.** The program proposes many seeds and a person keeps one. Keeping the seed freezes the decision (§2) and records it in the colophon. Choosing among candidates corresponds to the scribe's labour: three fingers write, and the whole body labours in judgement.
4. **In refusal.** The library maintains a list of what it will not decorate: body text grounds, form controls, ads, CTAs, anything the author didn't mark, and pages that fail the typographic baseline. Restraint is a choice that can be audited.
5. **In the signature.** The colophon names the human, the tool, the seed and the dedication. *Me scripsit*, and illum helped.

The time once spent per copy is now spent on the rules and the curation. That is still the offering, so it should be visible: the colophon links to the record of decisions.

---

## A credo for illum

1. The text comes first. Ornament is the last coat, and a page without it is complete.
2. Every ornament serves a function it can name, or it is removed.
3. Illumination marks the text's own structure. Rank is never invented and never misapplied.
4. The same text always receives the same illumination. Pages are places to remember.
5. Light moves only when the reader moves, and gold is spent by rank.
6. Ornament never covers, crowds, or dims a word.
7. The thresholds carry the weight and the reading runs stay clear. Emptiness is designed.
8. The margin is a second voice that speaks to the text beside it, and it leaves room for the reader's own.
9. Every irregularity has a cause in the making.
10. Principles are taken from the past, never results. Each piece must be native to the web.
11. The reader's time, device and privacy are the material being spent, and illum spends little.
12. Every illuminated page is signed and dedicated: who made it, with what, and for whom.

---

## Functions → features

| Historical function | Primary witness | Concrete illum features | Test / rule |
|---|---|---|---|
| **Light** | Suger; Ps.-Dionysius; Fitzwilliam | `gold` material (burnished: specular, light-tracked; shell: diffuse grain); light source from pointer/tilt/time of day; night mode as candle; reduced-motion still | Text contrast identical in every light state; no autonomous animation loops; gold only on rank ≥ minor initial |
| **Memory** | Hugh of St Victor; Carruthers | Content-hash seeding per block; stable section ids; distinct motif per sibling section; optional local *reading wear* | Reload yields pixel-identical ornament; editing block *n* changes only block *n*; sibling initials distinguishable at thumbnail size |
| **Wayfinding** | *Ordinatio*; Medievalists.net after Kwakkel; the pilcrow | Ranked initials mapped to h1–h3; alternating sibling accents; paraphs and line-fillers; *hierarchy-grown borders*; margin rail; catchwords | 10% downscale still shows section count and rank; no structural mark on non-structural nodes; ornament `aria-hidden`, initials are real text |
| **Emphasis** | Rubrics; pigment cost; *hiddur* limit | Rubric colour applied to `<dfn>`, `<time>`, labels, run-ins; per-page pigment budget; one-third ornament weight cap | One rubric hue per site; ornament ink ≤ ⅓ of text ink per viewport |
| **Commentary & play** | Camille; Carruthers; glosses | Lexicon→motif *marginalia that comment* (≤1 per screen); gloss register styles; opt-in `data-illum-play`; annotation-friendly margins | Every marginal motif traceable to a word beside it; mobile fallback declared or piece is droppable |
| **Pacing & breath** | Xie He; Okakura; carpet pages; Morris's opening | Density curve keyed to structure; designed `<hr>` single-gesture breaks; *carpet page* threshold; finis/colophon end mark; spread composition | Mid-section density ≈ 0; every generator declares void budget; one-time draw at hand speed |
| **Honouring the text** | Cassiodorus; Ibn Muqla; tezhip; micrography; Bringhurst | Typographic baseline layer (measure, leading, small caps); frames around, never under, text; ornament seeded from the text's own letters; jewelled verse/footnote/list markers | Automated no-overlap and contrast check; no ornament if baseline fails |
| **Visible hand & care** | Scribal colophons; Ruskin; wabi-sabi | Stroke physics (pressure, ink load, fatigue); stroke-order reveal on first visit; *pattern that breaks once* | Ruskin test: three irregularities, three causes |
| **The gift** | Lindisfarne; *shastra-dana*; Sloan | Text-first render, zero CLS; byte/CPU budgets; no network or tracking; print stylesheet; dedication field; site-specific motif packs | JS-off page complete; reduced-motion and forced-colours complete; budget CI check |
| **Intention / signature** | *me scripsit*; Ruskin's tool or man | Colophon component (maker, tool, seed, date, rules, dedication); seed curation UI in playground; refusal list in code | Every rule cites its function; every published page carries a kept seed |
