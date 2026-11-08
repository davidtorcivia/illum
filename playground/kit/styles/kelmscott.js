// Kelmscott: William Morris's Kelmscott Press (1891–98; the Chaucer, 1896; The Well at the World's End, 1896; The Water
// of the Wondrous Isles, 1897) — research/16-kelmscott.md. The initials are wood blocks: the black is the block's face and
// the white is what the graver cut out of it, so the vine and the letter are the paper left standing in the ink. The
// ornaments that set off a block of text are Morris's late vine drawings (the Water of the Wondrous Isles): a stem drawn
// in outline, curling, rising from a spreading foot and ending in a leaf. Every form is Morris's own, traced from public-
// domain scans (tools/tracecut.py) and refitted as curves into small webfonts (tools/kfont.py; playground/fonts/kelmscott/,
// one font per block, fetched only when a page uses it), drawn with fillText into a coverage mask and poured into the ink
// engine (kit/inkletter.js), so the black's edge spreads into the white a little as a press leaves it.
// A printed style of the one library (kit/illum.js: rubricate(root, { style: 'kelmscott' }), as tests/kelmscott.html,
// which puts it in the registry in place of the breadth-first entry of kit/wayfinding.js). Its parts return
// { marks: [], letters: [{ g, x, y, w, h, col, flip?, flipY?, v?, rect?, text? }] }: a glyph g of GLYPHS laid in the box
// (x, y, w, h, page px; col 'k' black, 'r' red); v: [v0, v1], the part of a tall glyph (in em) shown; a rule (rect); a
// capital of the page's face (text). initial.load() fetches the fonts the page needs before anything is measured.
//   initial(o) -> { letters, width }   paraph(x, base, u, seed, rich, n)   filler(x0, x1, yTop, yBase, kind, seed, rich)
//   breakMark(cx, y, measure, rank, seed, rich, u, n)   frames.{ quote, figure, code, pull, aside, nav }   palette.{ light, dark }
//   print(made, { dpr, kind, u, y, seed, animate }) -> { pours, letters, runs, y0, seq }   timeline(printed, kind, animate)
import { dist } from '../inkletter.js';
import { noise2 } from '../marks.js';
import { loadLetter, garden, drawGarden, bandOf, A as GARDEN_A } from './kelmscott-garden.js';

// GLYPHS (tools/kfont.py; research/16 lists every source and box): per glyph its font file, its character, a (width /
// height), w (the 5th percentile of its white lines' widths, a fraction of its height) and k (the median of its black
// lines', for a line drawing): the gates for how small it may be laid. v*: the white-vine initials; s*: the two-line
// initials; the rest the ornaments. The comment is the font's size.
const GLYPHS = {
  vB: { f: 'kelmscott-vine-vB.woff2', c: "B", a: 1.0031, w: 0.0097, k: null },   // 4764 B; IA MorrisChaucer leaf n313 [990,773,1640,1421]
  vA: { f: 'kelmscott-vine-vA.woff2', c: "A", a: 0.9842, w: 0.0153, k: null },   // 2908 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n16 [279,364,466,554]
  vC: { f: 'kelmscott-vine-vC.woff2', c: "C", a: 0.9948, w: 0.0111, k: null },   // 3284 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n421 [1299,973,1489,1164]
  vD: { f: 'kelmscott-vine-vD.woff2', c: "D", a: 0.96, w: 0.011, k: null, m: 1 },   // 3496 B; composed: K's stem and the vine left of it (n415), and C's bowl turned to face it (n421)
  vE: { f: 'kelmscott-vine-vE.woff2', c: "E", a: 0.95, w: 0.011, k: null, m: 1 },   // 3348 B; composed: L (n421) with F's head and middle arms and the vine round them (n428)
  vF: { f: 'kelmscott-vine-vF.woff2', c: "F", a: 0.8587, w: 0.0121, k: null },   // 2840 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n428 [62,1253,220,1437]
  vG: { f: 'kelmscott-vine-vG.woff2', c: "G", a: 0.99, w: 0.011, k: null, m: 1 },   // 3632 B; composed: C (n421) with a beard of K's stem foot (n415) and F's middle arm for its spur (n428)
  vH: { f: 'kelmscott-vine-vH.woff2', c: "H", a: 0.9904, w: 0.0066, k: null },   // 5520 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n101 [1065,312,1373,623]
  vI: { f: 'kelmscott-vine-vI.woff2', c: "I", a: 0.8707, w: 0.01, k: null },   // 4376 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n362 [78,344,354,661]
  vK: { f: 'kelmscott-vine-vK.woff2', c: "K", a: 0.9577, w: 0.0132, k: null },   // 3312 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n415 [1279,1221,1460,1410]
  vL: { f: 'kelmscott-vine-vL.woff2', c: "L", a: 0.9516, w: 0.0157, k: null },   // 3108 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n421 [583,1124,760,1310]
  vM: { f: 'kelmscott-vine-vM.woff2', c: "M", a: 0.8717, w: 0.016, k: null },   // 2772 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n103 [385,1604,548,1791]
  vN: { f: 'kelmscott-vine-vN.woff2', c: "N", a: 0.7958, w: 0.0131, k: null },   // 2788 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n212 [83,1422,235,1613]
  vO: { f: 'kelmscott-vine-vO.woff2', c: "O", a: 1.0, w: 0.0156, k: null },   // 2468 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n98 [163,556,355,748]
  vP: { f: 'kelmscott-vine-vP.woff2', c: "P", a: 0.9731, w: 0.0134, k: null },   // 2948 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n248 [804,2042,985,2228]
  vQ: { f: 'kelmscott-vine-vQ.woff2', c: "Q", a: 1.0, w: 0.011, k: null, m: 1 },   // 3048 B; composed: O (n98) with K's leg and its vine for its tail (n415)
  vR: { f: 'kelmscott-vine-vR.woff2', c: "R", a: 0.97, w: 0.011, k: null, m: 1 },   // 3428 B; composed: P (n248) with K's leg from its junction, the join set at P's bowl foot (n415)
  vS: { f: 'kelmscott-vine-vS.woff2', c: "S", a: 0.9937, w: 0.0079, k: null },   // 5240 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n137 [393,1217,706,1532]
  vT: { f: 'kelmscott-vine-vT.woff2', c: "T", a: 0.9945, w: 0.0098, k: null },   // 3152 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n95 [1113,1482,1295,1665]
  vV: { f: 'kelmscott-vine-vV.woff2', c: "V", a: 0.9788, w: 0.0159, k: null },   // 2652 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n276 [830,1903,1015,2092]
  vW: { f: 'kelmscott-vine-vW.woff2', c: "W", a: 1.0127, w: 0.008, k: null },   // 5524 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n375 [569,343,887,657]
  vX: { f: 'kelmscott-vine-vX.woff2', c: "X", a: 0.96, w: 0.011, k: null, m: 1 },   // 3528 B; composed: K's arm and leg (n415) crossed by V's thick arm (n276) and A's left leg (n16)
  vY: { f: 'kelmscott-vine-vY.woff2', c: "Y", a: 0.96, w: 0.011, k: null, m: 1 },   // 4072 B; composed: the head of our X (V's thick arm and K's arm) over I's stem and its vine (n362)
  vZ: { f: 'kelmscott-vine-vZ.woff2', c: "Z", a: 1.0326, w: 0.0158, k: null },   // 2840 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n96 [931,1289,1121,1473]
  sB: { f: 'kelmscott-two-sB.woff2', c: "B", a: 1.0962, w: 0.0172, k: null },   // 3004 B; IA MorrisChaucer leaf n125 [3636,2244,3978,2556]
  sA: { f: 'kelmscott-two-sA.woff2', c: "A", a: 0.9756, w: 0.0251, k: null },   // 2168 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n21 [1297,738,1377,820]
  sE: { f: 'kelmscott-two-sE.woff2', c: "E", a: 1.0449, w: 0.0281, k: null },   // 2228 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n235 [389,623,482,712]
  sF: { f: 'kelmscott-two-sF.woff2', c: "F", a: 1.1364, w: 0.0234, k: null },   // 2200 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n43 [550,1051,650,1139]
  sG: { f: 'kelmscott-two-sG.woff2', c: "G", a: 0.9315, w: 0.0217, k: null },   // 1916 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n342 [77,1806,145,1879]
  sH: { f: 'kelmscott-two-sH.woff2', c: "H", a: 0.8916, w: 0.0301, k: null },   // 1852 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n75 [1451,1946,1525,2029]
  sI: { f: 'kelmscott-two-sI.woff2', c: "I", a: 0.9186, w: 0.026, k: null },   // 1828 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n37 [560,1117,639,1203]
  sK: { f: 'kelmscott-two-sK.woff2', c: "K", a: 1.0805, w: 0.0309, k: null },   // 2036 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n62 [908,1853,1002,1940]
  sL: { f: 'kelmscott-two-sL.woff2', c: "L", a: 1.1461, w: 0.0281, k: null },   // 1984 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n46 [161,1196,263,1285]
  sM: { f: 'kelmscott-two-sM.woff2', c: "M", a: 1.1889, w: 0.0229, k: null },   // 2040 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n29 [541,1246,648,1336]
  sN: { f: 'kelmscott-two-sN.woff2', c: "N", a: 1.0778, w: 0.0249, k: null },   // 2124 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n36 [145,1417,242,1507]
  sO: { f: 'kelmscott-two-sO.woff2', c: "O", a: 1.0795, w: 0.0227, k: null },   // 2100 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n27 [527,2154,622,2242]
  sP: { f: 'kelmscott-two-sP.woff2', c: "P", a: 1.1667, w: 0.0249, k: null },   // 2284 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n156 [835,588,940,678]
  sQ: { f: 'kelmscott-two-sQ.woff2', c: "Q", a: 1.1538, w: 0.0275, k: null },   // 2308 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n315 [1203,1719,1308,1810]
  sR: { f: 'kelmscott-two-sR.woff2', c: "R", a: 1.0, w: 0.018, k: null },   // 2140 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n75 [750,1911,838,1999]
  sS: { f: 'kelmscott-two-sS.woff2', c: "S", a: 1.0795, w: 0.0234, k: null },   // 2164 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n37 [1316,703,1411,791]
  sT: { f: 'kelmscott-two-sT.woff2', c: "T", a: 0.8256, w: 0.0233, k: null },   // 1980 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n23 [495,684,566,770]
  sV: { f: 'kelmscott-two-sV.woff2', c: "V", a: 1.129, w: 0.0204, k: null },   // 3220 B; W72.jpg [424,3547,774,3857]
  sW: { f: 'kelmscott-two-sW.woff2', c: "W", a: 1.0698, w: 0.0313, k: null },   // 1968 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n31 [1334,1683,1426,1769]
  sY: { f: 'kelmscott-two-sY.woff2', c: "Y", a: 1.0, w: 0.0291, k: null },   // 2028 B; BPL Chaucer (IA worksofgeoffreyc00chau_0) leaf n30 [902,941,988,1027]
  gE: { f: 'kelmscott-grown-gE.woff2', c: "E", a: 0.97, w: 0.008, k: null, m: 1, gen: 1 },   // 4776 B; tools/kgrow.py: tools/kgrow.py E 1
  gG: { f: 'kelmscott-grown-gG.woff2', c: "G", a: 0.97, w: 0.008, k: null, m: 1, gen: 1 },   // 4452 B; tools/kgrow.py: tools/kgrow.py G 2
  gR: { f: 'kelmscott-grown-gR.woff2', c: "R", a: 0.97, w: 0.008, k: null, m: 1, gen: 1 },   // 4472 B; tools/kgrow.py: tools/kgrow.py R 2
  gX: { f: 'kelmscott-grown-gX.woff2', c: "X", a: 0.97, w: 0.0085, k: null, m: 1, gen: 1 },   // 4492 B; tools/kgrow.py: tools/kgrow.py X 2
  gY: { f: 'kelmscott-grown-gY.woff2', c: "Y", a: 0.97, w: 0.0089, k: null, m: 1, gen: 1 },   // 4740 B; tools/kgrow.py: tools/kgrow.py Y 1
  // ?caps=gen: the letter from GL-Morris (Morris's Troy capitals; Gutenberg Labo, licence in fonts/kelmscott/GL-Morris-LICENSE.txt),
  // the vine his own block's, fitted and varied (research/kelmscott/gen: kdonor6.py LETTER DONOR SEED)
  nD: { f: 'kelmscott-gen-nD.woff2', c: "D", a: 0.95, w: 0.008, k: null, m: 1, gen: 2 },   // 2756 B; kdonor6.py D O 1
  nE: { f: 'kelmscott-gen-nE.woff2', c: "E", a: 0.95, w: 0.008, k: null, m: 1, gen: 2 },   // 3796 B; kdonor6.py E C 1
  nG: { f: 'kelmscott-gen-nG.woff2', c: "G", a: 0.95, w: 0.008, k: null, m: 1, gen: 2 },   // 3872 B; kdonor6.py G C 1
  nJ: { f: 'kelmscott-gen-nJ.woff2', c: "J", a: 0.95, w: 0.008, k: null, m: 1, gen: 2 },   // 3344 B; kdonor6.py J L 1
  nQ: { f: 'kelmscott-gen-nQ.woff2', c: "Q", a: 0.95, w: 0.008, k: null, m: 1, gen: 2 },   // 3040 B; kdonor6.py Q O 1
  nR: { f: 'kelmscott-gen-nR.woff2', c: "R", a: 0.95, w: 0.008, k: null, m: 1, gen: 2 },   // 3560 B; kdonor6.py R P 1
  nU: { f: 'kelmscott-gen-nU.woff2', c: "U", a: 0.95, w: 0.008, k: null, m: 1, gen: 2 },   // 3344 B; kdonor6.py U V 1
  nW: { f: 'kelmscott-gen-nW.woff2', c: "W", a: 0.95, w: 0.008, k: null, m: 1, gen: 2 },   // 3540 B; kdonor6.py W V 1
  nX: { f: 'kelmscott-gen-nX.woff2', c: "X", a: 0.95, w: 0.008, k: null, m: 1, gen: 2 },   // 3316 B; kdonor6.py X K 3
  nY: { f: 'kelmscott-gen-nY.woff2', c: "Y", a: 0.95, w: 0.008, k: null, m: 1, gen: 2 },   // 3180 B; kdonor6.py Y V 1
  // ?caps=gen2, all 26: GL-Morris's letter (as gen), the vine grown in the gaps round it: two to four main stems sweeping behind the
  // letter, branches and shoots off them, each thinner; a big lobed leaf in each large room; open black and dots (research/kelmscott/gen/kgap.py LETTER SEED)
  wA: { f: 'kelmscott-gen2-wA.woff2', c: "A", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 4052 B; kgap.py A 1
  wB: { f: 'kelmscott-gen2-wB.woff2', c: "B", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3840 B; kgap.py B 1
  wC: { f: 'kelmscott-gen2-wC.woff2', c: "C", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3560 B; kgap.py C 1
  wD: { f: 'kelmscott-gen2-wD.woff2', c: "D", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3864 B; kgap.py D 3
  wE: { f: 'kelmscott-gen2-wE.woff2', c: "E", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3756 B; kgap.py E 1
  wF: { f: 'kelmscott-gen2-wF.woff2', c: "F", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3732 B; kgap.py F 1
  wG: { f: 'kelmscott-gen2-wG.woff2', c: "G", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3596 B; kgap.py G 1
  wH: { f: 'kelmscott-gen2-wH.woff2', c: "H", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3976 B; kgap.py H 1
  wI: { f: 'kelmscott-gen2-wI.woff2', c: "I", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3628 B; kgap.py I 3
  wJ: { f: 'kelmscott-gen2-wJ.woff2', c: "J", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3456 B; kgap.py J 1
  wK: { f: 'kelmscott-gen2-wK.woff2', c: "K", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3972 B; kgap.py K 1
  wL: { f: 'kelmscott-gen2-wL.woff2', c: "L", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3700 B; kgap.py L 3
  wM: { f: 'kelmscott-gen2-wM.woff2', c: "M", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3592 B; kgap.py M 3
  wN: { f: 'kelmscott-gen2-wN.woff2', c: "N", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3544 B; kgap.py N 1
  wO: { f: 'kelmscott-gen2-wO.woff2', c: "O", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 4084 B; kgap.py O 2
  wP: { f: 'kelmscott-gen2-wP.woff2', c: "P", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3644 B; kgap.py P 2
  wQ: { f: 'kelmscott-gen2-wQ.woff2', c: "Q", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3656 B; kgap.py Q 3
  wR: { f: 'kelmscott-gen2-wR.woff2', c: "R", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3936 B; kgap.py R 1
  wS: { f: 'kelmscott-gen2-wS.woff2', c: "S", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3984 B; kgap.py S 1
  wT: { f: 'kelmscott-gen2-wT.woff2', c: "T", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3708 B; kgap.py T 3
  wU: { f: 'kelmscott-gen2-wU.woff2', c: "U", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 4000 B; kgap.py U 1
  wV: { f: 'kelmscott-gen2-wV.woff2', c: "V", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 4040 B; kgap.py V 1
  wW: { f: 'kelmscott-gen2-wW.woff2', c: "W", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3936 B; kgap.py W 1
  wX: { f: 'kelmscott-gen2-wX.woff2', c: "X", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3676 B; kgap.py X 2
  wY: { f: 'kelmscott-gen2-wY.woff2', c: "Y", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3556 B; kgap.py Y 1
  wZ: { f: 'kelmscott-gen2-wZ.woff2', c: "Z", a: 0.95, w: 0.009, k: null, m: 1, gen: 3 },   // 3624 B; kgap.py Z 1
  hedera: { f: 'kelmscott-ornaments-hedera.woff2', c: "\ue000", a: 1.4, w: 0.0375, k: null },   // 960 B; Met 354288 photograph 1 [3216,998,3272,1038]
  sprig: { f: 'kelmscott-ornaments-sprig.woff2', c: "\ue001", a: 1.3784, w: 0.0788, k: null },   // 908 B; Met 354288 photograph 0 [2991,395,3042,432]
  knot: { f: 'kelmscott-ornaments-knot.woff2', c: "\ue002", a: 3.52, w: 0.0333, k: null },   // 2500 B; Met 354288 photograph 1 [3082,361,3258,411]
  footGrape: { f: 'kelmscott-ornaments-footGrape.woff2', c: "\ue003", a: 5.4129, w: 0.0106, k: 0.0199 },   // 15676 B; Water of the Wondrous Isles (IA MorrisWaterWondrousIsles) leaf n21, isolated [107,80,3371,683]
  footRose: { f: 'kelmscott-ornaments-footRose.woff2', c: "\ue004", a: 5.4264, w: 0.0199, k: 0.0325 },   // 7852 B; Water of the Wondrous Isles leaf n22, isolated [155,215,2331,616]
  headRose: { f: 'kelmscott-ornaments-headRose.woff2', c: "\ue005", a: 6.7073, w: 0.0274, k: 0.0371 },   // 8028 B; Water of the Wondrous Isles leaf n22, isolated [77,112,2277,440]
  vine: { f: 'kelmscott-ornaments-vine.woff2', c: "\ue006", a: 0.1913, w: 0.002, k: 0.0031 },   // 3328 B; Water of the Wondrous Isles leaf n21, isolated [29,46,900,4600]
};
// ?caps=garden, all 26: drawn directly as vector geometry by kit/styles/kelmscott-garden.js (GL-Morris's letter, a garden grown in
// the gaps by space colonization; fonts/kelmscott/garden-X.json, the letter's outline, ~2.5 KB). No font: garden: 1. (w: large,
// so raster() never pares its white: the garden grows coarser on its own when the block is small on the device.)
for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') GLYPHS['q' + ch] = { c: ch, a: GARDEN_A, w: .05, k: null, m: 1, gen: 4, garden: 1 };

// ---- the fonts --------------------------------------------------------------------------------------------------------------
const fontDir = new URL('../../fonts/kelmscott/', import.meta.url);
const famOf = key => 'kelmscott-' + key, loading = new Map();
function loadGlyph(key) {
  if (!GLYPHS[key]) return Promise.resolve();
  if (GLYPHS[key].garden) return loadLetter(GLYPHS[key].c);
  if (!loading.has(key)) loading.set(key, new FontFace(famOf(key), `url(${new URL(GLYPHS[key].f, fontDir)})`).load().then(f => { document.fonts.add(f); return f; }).catch(e => console.warn('kelmscott:', e)));
  return loading.get(key);
}
// what a page needs, read from its markup before it is measured: the blocks for its initials, the leaf and the sprig, and
// the vine, the head and the foot only where a quotation, an aside, a pull quote or a break asks for them
// (ponytail: reads the document, not rubricate's root; pass the root in when the registry hands it over)
function needed() {
  const keys = new Set(['hedera', 'sprig']), has = s => !!document.querySelector(s);
  for (const s of document.querySelectorAll('.ini')) { const ch = letterOf(s.textContent); keys.add(shapeFor(ch, true)).add(shapeFor(ch, false)); }   // (only the blocks the chosen caps set will lay: a six-line one and a line one)
  if (has('blockquote, aside') && !QUIET) keys.add('vine');
  if (has('.pull') && !QUIET) keys.add('headRose').add('footRose');
  if (has('hr, .break, .book, .chapter')) keys.add('footRose').add('footGrape');
  if (FILL === 'knot') keys.add('knot');
  return [...keys].filter(k => GLYPHS[k]);
}

// ---- the blocks -------------------------------------------------------------------------------------------------------------
// one glyph laid h px tall (its em) with its top left at x, y
const block = (g, x, y, h, col = 'k', o = {}) => ({ g, x, y, w: GLYPHS[g].a * h, h, col, em: h, ...o });
const widthOf = (g, h) => GLYPHS[g].a * h;
const MIN_WHITE = 1.25, MIN_LINE = 1.3;   // px: no white line cut, and no black line drawn, finer than this

// A glyph's coverage at `res` cells a px, drawn with fillText (the em is the glyph's height, its foot on the baseline).
// A block too small to keep its white has its black pared back (a distance from the white) until its finest white is
// MIN_WHITE, as an engraver cutting a small block cuts the white wider; a line drawing too small to keep its line has its
// black thickened to MIN_LINE, as a smaller block is cut with a bolder line.
const cache = new Map();
function raster(b, res) {
  const key = [b.g, b.text, b.rect, b.x, b.y, b.w, b.h, b.em, b.v, b.sx, res, b.flip, b.flipY, b.seed].join('|'); if (cache.has(key)) return cache.get(key);
  const pad = 3, x0 = Math.floor(b.x - pad), y0 = Math.floor(b.y - pad), w = Math.ceil((b.x + b.w + pad - x0) * res), h = Math.ceil((b.y + b.h + pad - y0) * res);
  const c = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true }); c.setTransform(res, 0, 0, res, -x0 * res, -y0 * res); c.fillStyle = '#000';
  const G = b.g && GLYPHS[b.g], em = b.em ?? b.h;
  if (b.rect) c.fillRect(b.x, b.y, b.w, b.h);
  else if (b.text) { c.font = FACE; const m = c.measureText(b.text), k = b.h / c.measureText('H').actualBoundingBoxAscent;
    c.save(); c.translate(b.x + m.actualBoundingBoxLeft * k, b.y + b.h); c.scale(k, k); c.fillText(b.text, 0, 0); c.restore(); }
  else if (G.garden) { const geo = garden(G.c, b.seed ?? 1, bandOf(b.h * res)); if (geo) drawGarden(c, geo, b.x, b.y, b.h, res); else console.warn('kelmscott: garden not loaded', G.c); }   // (vector, drawn as it stands)
  else { const [v0] = b.v ?? [0, 1];
    c.save(); c.beginPath(); c.rect(b.x, b.y, b.w, b.h); c.clip();
    // the glyph's em box placed so that its row v0 is at the box's top (or, turned over, at its bottom), mirrored if asked
    // (sx: the glyph shown from that fraction of its width onward, as a mirrored half is)
    const sx = (b.sx ?? 0) * G.a * em; c.translate(b.flip ? b.x + b.w + sx : b.x - sx, b.flipY ? b.y + b.h + v0 * em : b.y - v0 * em); c.scale(b.flip ? -1 : 1, b.flipY ? -1 : 1);
    c.font = `${em}px "${famOf(b.g)}"`; c.textBaseline = 'alphabetic';
    if (document.fonts.check(c.font, G.c)) c.fillText(G.c, 0, em); else console.warn('kelmscott: not loaded', b.g);   // (never a fallback face's box)
    c.restore(); }
  const d = c.getImageData(0, 0, w, h).data, M = new Float32Array(w * h); for (let i = 0; i < w * h; i++) M[i] = d[i * 4 + 3] / 255;
  if (G?.garden) impress(M, w, h, res, b.seed ?? 1);
  if (G) { const open = G.k ? 0 : Math.max(0, MIN_WHITE - G.w * em), bold = G.k ? Math.max(0, MIN_LINE - G.k * em) : 0;
    if (open > .05) { const feat = new Uint8Array(w * h); for (let q = 0; q < w * h; q++) feat[q] = M[q] < .5; const D = dist(feat, w, h), o = Math.min(open, em * .02) * res;
      for (let q = 0; q < w * h; q++) if (M[q] > 0) M[q] *= Math.max(0, Math.min(1, D[q] - o + .5)); }
    if (bold > .05) { const feat = new Uint8Array(w * h); for (let q = 0; q < w * h; q++) feat[q] = M[q] >= .5; const D = dist(feat, w, h), o = bold / 2 * res;
      for (let q = 0; q < w * h; q++) M[q] = Math.max(M[q], Math.max(0, Math.min(1, o + .5 - D[q]))); } }
  const r = { M, w, h, x0, y0, res }; cache.set(key, r); if (cache.size > 64) cache.delete(cache.keys().next().value); return r;
}
// A garden block as a wood block prints: its edges not quite true (the antialiased rim pushed in or out a little by a slow
// grain, so a line's margin wavers by a fraction of a px), and here and there in the broad black a speck where the
// paper did not take the ink. The ink engine then pours it (grain, pooling, the faint spread at the edge).
const grain = noise2(4441), salt = noise2(9173);
function impress(M, w, h, res, seed) {
  const o = (typeof seed === 'number' ? seed : 1) % 97 * 13.1;
  for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) { const q = j * w + i, m = M[q];
    if (m > .02 && m < .98) M[q] = Math.max(0, Math.min(1, m + (grain(i / res / 1.6 + o, j / res / 1.6) - .5) * .7));
    else if (m >= .98 && M[q - 1] > .98 && M[q + 1] > .98 && M[q - w] > .98 && M[q + w] > .98 && salt(i / res / .9 + o, j / res / .9) > .86) M[q] = .45; }
}
// the silhouette: the black with the white it encloses filled (a flood of the paper from the box's edge)
function silhouette(L) {
  const { M, w, h } = L, out = new Uint8Array(w * h), Q = new Int32Array(w * h); let n = 0;
  const seed = q => { if (!out[q] && M[q] < .5) { out[q] = 1; Q[n++] = q; } };
  for (let i = 0; i < w; i++) { seed(i); seed((h - 1) * w + i); } for (let j = 0; j < h; j++) { seed(j * w); seed(j * w + w - 1); }
  for (let k = 0; k < n; k++) { const q = Q[k], i = q % w; if (i > 0) seed(q - 1); if (i < w - 1) seed(q + 1); if (q >= w) seed(q - w); if (q < w * (h - 1)) seed(q + w); }
  const S = new Float32Array(w * h); for (let q = 0; q < w * h; q++) S[q] = out[q] ? M[q] : 1; return S;
}

// ---- the drop initial --------------------------------------------------------------------------------------------------------
// Morris's initial, as tall as the drop (its top on the first line's cap height, its foot on the last line's baseline, as
// the Chaucer sets them), as wide as its block. Two families from the Chaucer: the white-vine initials (v*: a white letter
// in a black square thick with vine), and the two-line initials (s*: a black letter edged in white with a white leaf in its
// counter, on a scalloped ground). A drop deeper than 6 x-heights takes the white-vine block, a shallower one or a letter in
// the line the two-line block; each the other where its own is not cut. J is set as I and U as V, as the Chaucer sets
// them. The W is his large white-vine W (the Chaucer's Boece, "Weestow"). Morris cut no white-vine D, E, G, Q, R, X or Y
// that survives in the books searched: those blocks (m: 1 in GLYPHS) are grafted by us from pieces of his own blocks,
// each a letter's part with the vine round it (tools/kgraft.py: D from K's stem and C's bowl turned; E from L and F's arms;
// G from C, K's stem foot and F's middle arm; Q from O and K's leg; R from P and K's leg; X from K's arm and leg crossed by V's
// and A's strokes; Y from that X's head over I's stem; no mirrored halves), joined along seams of least difference through the black. Every letter has a block;
// a capital of the page's face in red stays only as the fallback for a character outside A–Z.
const ALIAS = { J: 'I', U: 'V' };
const letterOf = ch => String(ch).normalize('NFD')[0].toUpperCase();
// CAPS 'gen2' (?caps=gen2): every six-line letter A-Z generated: GL-Morris's letter (Morris's Troy capitals) with a vine grown in
// the gaps round it (gen: 3; research/kelmscott/gen/kgap.py), one consistent set. 'morris' (?caps=morris): his own traced
// blocks where he cut one, generated where he did not. 'gen' (?caps=gen): GL-Morris's letter in his own block's vine, fitted
// (gen: 2); 'grow': tools/kgrow.py's (gen: 1); 'graft' (?caps=graft): his blocks, and the grafted ones (m: 1; tools/kgraft.py).
// 'garden' (default): the letter and a garden grown in its gaps, drawn directly as vector (gen: 4; kelmscott-garden.js).
let CAPS = 'garden';
const GP = { gen: 'n', gen2: 'w', garden: 'q' };   // (the generated series' prefixes in GLYPHS)
const shapeFor = (ch, deep) => { const gp = GP[CAPS]; if (deep && gp && GLYPHS[gp + ch]) return gp + ch; if (deep && CAPS === 'morris') { const m = 'v' + (GLYPHS['v' + ch] ? ch : ALIAS[ch] ?? ch); return GLYPHS[m] && !GLYPHS[m].m ? m : GLYPHS['w' + ch] ? 'w' + ch : null; } const c = GLYPHS['v' + ch] || GLYPHS['s' + ch] ? ch : ALIAS[ch] ?? ch; return deep ? (gp && GLYPHS[gp + c] ? gp + c : CAPS === 'grow' && GLYPHS['g' + c] ? 'g' + c : GLYPHS['v' + c] ? 'v' + c : GLYPHS['s' + c] ? 's' + c : null) : (GLYPHS['s' + c] ? 's' + c : GLYPHS['v' + c] ? 'v' + c : null); };
const FACE = '600 100px "EB Garamond", Garamond, serif';
const capWidth = ch => { try { const c = new OffscreenCanvas(8, 8).getContext('2d'); c.font = FACE; const m = c.measureText(ch), H = c.measureText('H'); return (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) / H.actualBoundingBoxAscent; } catch { return .8; } };
function initial({ ch = 'B', G, big = true, rich = .5, seed = 1, u = 8 }) {
  ch = letterOf(ch); const [x0, y0, x1, y1] = G.box, H = y1 - y0, g = shapeFor(ch, big && H > u * 6);
  if (!g) return { marks: [], letters: [{ text: ch, x: x0, y: y0, w: capWidth(ch) * H, h: H, col: 'r' }], width: capWidth(ch) * H };
  // (the float is as wide as the letter's white-vine block; a two-line block, wider, is set a little smaller to fit it)
  const h = big && x1 > x0 ? Math.min(H, (x1 - x0) / GLYPHS[g].a) : H;
  return { marks: [], letters: [block(g, x0, y0 + (H - h) / 2, h, 'k', GLYPHS[g].garden ? { seed } : {})], width: widthOf(g, h) };
}
initial.width = ch => { const g = shapeFor(letterOf(ch), true); return g ? GLYPHS[g].a : capWidth(letterOf(ch)); };
initial.line = ch => { const g = shapeFor(letterOf(ch), false); return g ? GLYPHS[g].a : capWidth(letterOf(ch)); };
initial.lines = 6;     // the Chaucer's white-vine initials stand six lines deep (the host's data-lines rules)
initial.margin = .3;   // the gap to the words, in line heights (the Chaucer sets its type close against the block)
initial.fills = true;
initial.load = () => Promise.all(needed().map(loadGlyph));

// ---- the paraph: the hedera ----------------------------------------------------------------------------------------------------
// The leaf in the indent, its foot on the baseline, a little taller than the x-height, in red (or black, as the Well prints it)
let PARAPH_COL = 'r';
function paraph(x, base, u, seed, rich = .5) {
  const h = u * 1.5, w = widthOf('hedera', h), cx = x + u * .82;
  return { marks: [], letters: [block('hedera', cx - w / 2, base - h * .92, h, PARAPH_COL)] };
}

// ---- line-fillers ------------------------------------------------------------------------------------------------------------
// After a red chapter head, one or two sprigs in red, as the Well ends its heads. Morris's text pages run their paragraphs
// on and leave a short last line open, so a paragraph's is left open ('none'); ?fill=knot (or rich >= .75) closes it with
// the running heads' knots.
const FILLERS = ['knot'];
let FILL = 'none';
function filler(x0, x1, yTop, yBase, kind, seed, rich = .5) {
  const u = yBase - yTop, out = [];
  if (kind === 'none') return { marks: [], letters: [] };
  if (kind === 'knot') { const h = u * 1.4, w = widthOf('knot', h), gap = u * .12, n = Math.floor((x1 - x0 + gap) / (w + gap)); if (n < 1) return { marks: [], letters: [] };
    const sp = n > 1 ? (x1 - x0 - n * w) / (n - 1) : 0;
    for (let i = 0; i < n; i++) out.push(block('knot', x1 - w - i * (w + sp), yBase - h * .98, h, 'k'));
    return { marks: [], letters: out }; }
  const h = u * 1.25, w = widthOf('sprig', h), gap = u * .5, n = Math.max(1, Math.min(kind === 'rule' ? 2 : 3, Math.floor((x1 - x0 + gap) / (w + gap))));
  for (let i = 0; i < n; i++) out.push(block('sprig', x0 + i * (w + gap), yBase - h * .95, h, 'r'));
  return { marks: [], letters: out };
}

// ---- breaks ------------------------------------------------------------------------------------------------------------------
// The foot of one of the Water of the Wondrous Isles' column vines, where the stem comes down between the columns and spreads
// both ways under them: its stem cut where it meets the foot, the cut showing as Morris draws a cut stem (an open tube).
// Morris composed them balanced, not mirrored. rank 1 (?break=rose): the foot from leaf n22, a figure-of-eight knot with a
// bud at one end and a rose at the other; rank 2 (?break=grape): the vine-and-grapes foot from leaf n21. ?break=mirror: the
// rose foot made mirror-symmetric about its stem (its rose end turned to both sides; not Morris's composition).
// By default (?break=all) every foot has a role: a book's break the grape foot; a chapter's the rose foot and the rose foot
// mirrored in turn (the first chapter break the rose, the second the mirrored, and on), so a long page has variety and
// stays composed. ?break=rose | grape | mirror: that one everywhere.
let BREAK = 'all';
const STEM = { footRose: .37, footGrape: .459 };   // where the stem stood, a fraction of the foot's width
function breakMark(cx, y, measure, rank, seed, rich = .5, u = 8, n = 1) {
  const kind = BREAK !== 'all' ? BREAK : rank > 1 ? 'grape' : n % 2 ? 'rose' : 'mirror', g = kind === 'grape' ? 'footGrape' : 'footRose';
  const W = Math.min(measure * (g === 'footGrape' ? .78 : .56), u * (g === 'footGrape' ? 62 : 44)), h = W / GLYPHS[g].a;
  if (kind !== 'mirror') return { marks: [], letters: [block(g, cx - W / 2, y - h / 2, h)] };
  const half = (1 - STEM[g]) * W;   // the right-hand part (from the stem) kept, and its mirror image to the left
  return { marks: [], letters: [{ g, x: cx, y: y - h / 2, w: half, h, em: h, col: 'k', sx: STEM[g] }, { g, x: cx - half, y: y - h / 2, w: half, h, em: h, col: 'k', sx: STEM[g], flip: true }] };
}

// ---- frames ------------------------------------------------------------------------------------------------------------------
// As Morris set off a block of text in the Water of the Wondrous Isles: the column vine (the stem drawn in outline, curling
// as it goes, a leaf at its head), down the left side of a quotation or an aside, as long as it, the head's leaf above its
// first line and the same head turned over below its last; the head and the foot of a column vine above and below a pull
// quote, as they stand over and under his columns; a picture framed with a heavy rule and a light one inside it, as his
// woodcut pictures are; code in a single light rule; the contents marked by a red leaf at each entry.
const rect = (x, y, w, h) => ({ rect: true, x, y, w, h, col: 'k' });
const ruled = ([X0, Y0, X1, Y1], w) => [rect(X0, Y0, X1 - X0, w), rect(X0, Y1 - w, X1 - X0, w), rect(X0, Y0, w, Y1 - Y0), rect(X1 - w, Y0, w, Y1 - Y0)];
const linesBox = (box, lines) => !lines?.length ? box : [Math.min(...lines.map(L => L.left)), lines[0].top, Math.max(...lines.map(L => L.right)), lines.at(-1).base];
// the vine down the side: em sized so its line is ~1.5 px; its stem (.15–.20 em from the glyph's left, its curls included) a
// gap left of the words; its head (the leaf, reaching right) above the first line; its foot a little below the last, cut
// off as Morris draws a cut stem (the open tube of its outline). The traced stem is ~490 px at 1440; a taller block's vine
// goes on with a length of the same stem (VINE.loop: two rows of it where its outline stands at the same place with the same
// lean, so the stem runs on through the join; tools: the scratchpad's row match), as long as it needs.
const VINE = { stem: .098, right: .125, head: .083, loop: [.256, .747] };
function vineDown(xl, top, bot, u) {
  const k = GLYPHS.vine.k, guess = 1.5 / k, room = xl - u * .9 - (VINE.right - VINE.stem) * guess - 3;
  const em = Math.max(260, Math.min(guess, room / (GLYPHS.vine.a - VINE.stem))), stem = xl - u * .9 - (VINE.right - VINE.stem) * em;
  const x = stem - VINE.stem * em, w = GLYPHS.vine.a * em, y0 = top - VINE.head * em, L = bot + u * .6 - y0, out = [];
  const piece = (y, v0, h) => out.push({ g: 'vine', x, y, w, h, em, col: 'k', v: [v0, v0 + h / em] });
  if (L <= em) piece(y0, 0, L);
  else { const [a, b] = VINE.loop; piece(y0, 0, b * em); let y = y0 + b * em;
    while (y < y0 + L - .5) { const h = Math.min((b - a) * em, y0 + L - y); piece(y, a, h); y += h; } }
  return out;
}
let CODE = 'rule';
let QUIET = false;   // ?vine=none: the quotation and the aside left plain, the pull quote between two red sprigs
const sprigAt = (cx, y, u) => { const h = u * 1.4, w = widthOf('sprig', h); return block('sprig', cx - w / 2, y - h / 2, h, 'r'); };
const frames = {
  quote: ({ box, lines, u }) => { const L = linesBox(box, lines); return { marks: [], letters: QUIET ? [] : vineDown(L[0], L[1], box?.[3] ?? L[3], u) }; },
  aside: ({ box, lines, u }) => { const L = linesBox(box, lines); return { marks: [], letters: QUIET ? [] : vineDown(L[0], L[1], L[3] + u * .3, u) }; },
  pull: ({ cx, yTop, yBot, measure, u }) => { if (QUIET) return { marks: [], letters: [sprigAt(cx, yTop, u), sprigAt(cx, yBot, u)] }; const W = Math.min(measure * .46, u * 30), hh = W / GLYPHS.headRose.a, fh = W * .9 / GLYPHS.footRose.a;
    return { marks: [], letters: [block('headRose', cx - W / 2, yTop - hh * .85, hh), block('footRose', cx - W * .45, yBot - fh * .05, fh)] }; },
  figure: ({ box, cap, u, limit = [-1e9, 1e9] }) => { const room = Math.min(box[0] - limit[0], limit[1] - box[2]) - 2, B = [box[0], box[1], box[2], cap ?? box[3]], o = Math.max(4, Math.min(room, u * 1.1));
    return { marks: [], letters: [...ruled([B[0] - o, B[1] - o, B[2] + o, B[3] + o], 2.4), ...ruled([B[0] - o + 4.4, B[1] - o + 4.4, B[2] + o - 4.4, B[3] + o - 4.4], 1.3)] }; },
  code: ({ box, u }) => CODE === 'none' ? { marks: [], letters: [] } : { marks: [], letters: ruled([box[0] + u * .4, box[1] + u * .4, box[2] - u * .4, box[3] - u * .4], 1.3) },
  nav: ({ box, entries, u }) => { const h = u * 1.2, w = widthOf('hedera', h);
    return { marks: [], letters: entries.filter(Boolean).map(e => block('hedera', Math.max(4, box[0] - u * 1.1 - w), e.base - h * .92, h, 'r')) }; },
};

// ---- palette -----------------------------------------------------------------------------------------------------------------
// Light: the Chaucer's ink (a dense warm black, its median 47 39 33 on the scan's aged paper) and Morris's vermilion
// (179 56 50 on the scan; brought back toward the colour before the paper yellowed). Dark: the pale ink of the page's text,
// the red lifted. w: the cut, the page's own paper (read from --paper), so a block being engraved shows the page through it.
const css = () => { try { const v = getComputedStyle(document.documentElement).getPropertyValue('--paper'); const m = v.match(/\d+(\.\d+)?/g); return m ? m.slice(0, 3).map(Number) : null; } catch { return null; } };
export const palette = {
  light: { k: [38, 31, 27], g: [38, 31, 27], r: [184, 54, 40], get w() { return css() ?? [244, 238, 226]; } },
  dark: { k: [226, 216, 198], g: [204, 195, 178], r: [222, 112, 88], get w() { return css() ?? [28, 25, 22]; } },
};

// ---- printing ------------------------------------------------------------------------------------------------------------------
// A case made ready to lay: each glyph's coverage, and the order the press lays it in (seq: { pour | letter, d (s) }).
//   A block (an initial), still, light: its ink poured once. Drawn: its face (the box of its black) inked from the middle
//     out (letterWriter along its skeleton), the white cut into it along its stems (letterWriter in the paper's colour),
//     the ink pressed once more over the cut. Dark ('positive', the default): the page is the block's black and what the
//     graver left standing is printed in the pale ink (drawn: written along its stems); 'negative': the block pale. A
//     two-line initial is printed pale in the dark either way: its scalloped edge, flooded, leaves its white in specks.
//   A line drawing (the vine, a head, a foot): poured; drawn, written along its stems (letterWriter), as the vine grows.
//   A type ornament (a leaf, a sprig, a knot), a rule, a capital: stamped.
const BLOCK = g => /^[vsgnwq][A-Z]$/.test(g ?? ''), LINEART = new Set(['vine', 'headRose', 'footRose', 'footGrape']);
let DARK_CUT = 'positive';
const isDark = () => { try { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; } };
// (a white-vine block's face is the box of its own black, a little inside it so its antialiased rim is not left as a pale
// hairline in the dark; a two-line initial's, scalloped, is its black with the white it encloses filled)
const faceOf = (b, L) => { if (b.g[0] === 's') return silhouette(L); const { M, w, h } = L, S = new Float32Array(M.length); let i0 = w, j0 = h, i1 = -1, j1 = -1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (M[j * w + i] > .5) { if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; }
  const k = Math.ceil(2 * L.res);
  for (let j = j0 + k; j <= j1 - k; j++) for (let i = i0 + k; i <= i1 - k; i++) S[j * w + i] = 1;
  for (let q = 0; q < S.length; q++) S[q] = Math.max(S[q], M[q]); return S; };
// the white: the face less the black, its specks (an enclosed fleck of paper under ~3.5 px²) dropped, as the press fills them
const whiteOf = (b, L) => { const S = faceOf(b, L), { w, h } = L, n = w * h, W = new Float32Array(n); for (let q = 0; q < n; q++) W[q] = Math.max(0, S[q] - L.M[q]);
  const seen = new Uint8Array(n), st = new Int32Array(n), min = Math.round(3.5 * L.res * L.res);
  for (let q0 = 0; q0 < n; q0++) { if (seen[q0] || W[q0] < .5) continue; let top = 0, m = 0; st[top++] = q0; seen[q0] = 1; const comp = [];
    while (top) { const q = st[--top]; comp.push(q); m++; const i = q % w;
      for (const o of [i > 0 ? q - 1 : -1, i < w - 1 ? q + 1 : -1, q >= w ? q - w : -1, q < n - w ? q + w : -1]) if (o >= 0 && !seen[o] && W[o] >= .5) { seen[o] = 1; st[top++] = o; } }
    if (m < min) for (const q of comp) { W[q] = 0; for (const o of [q - 1, q + 1, q - w, q + w]) if (o >= 0 && o < n && W[o] < .5) W[o] = 0; } }
  return { S, W }; };
function print(made, { dpr = 1, animate = false, kind } = {}) {
  const res = dpr >= 1.5 ? 2 : 1, pours = [], letters = [], seq = [], dark = isDark() && DARK_CUT === 'positive';
  const pour = (p, d) => { pours.push(p); seq.push({ pour: p, d }); }, letter = (L, d) => { letters.push(L); seq.push({ letter: L, d }); };
  const pace = b => kind === 'drop' ? 4.2 : Math.min(1.6, .4 + (b.w + b.h) / 400);
  for (const b of made.letters ?? []) { const L = raster(b, res), gd = GLYPHS[b.g]?.garden, ink = { ...L, col: gd && b.col === 'k' ? 'g' : b.col, wet: gd ? .08 : .04, dry: gd ? .26 : .18 };   // (g: a garden block's ink; in the dark a light block, a shade below the text's pale ink so it does not glare)
    // (a garden block (q) is printed whole in the dark too: a light block on the dark page, its letter and vine the page showing through)
    if (BLOCK(b.g) && dark && 'vnw'.includes(b.g[0])) { const { W } = whiteOf(b, L), cut = { ...L, M: W, col: b.col, wet: ink.wet, dry: ink.dry }; animate ? letter(cut, pace(b)) : pour(cut, 0); }
    else if (BLOCK(b.g) && animate) { const { S, W } = whiteOf(b, L); letter({ ...L, M: S, col: b.col, wet: .02, dry: .1 }, kind === 'drop' ? .6 : .4); letter({ ...L, M: W, col: 'w', wet: .02, dry: 0 }, pace(b)); pour({ ...ink, wet: 0 }, .01); }
    else if (LINEART.has(b.g) && animate) letter(ink, Math.min(1.8, .5 + (b.w + b.h) / 500));
    else pour(ink, animate ? .15 : 0); }
  const ys = (made.letters ?? []).map(b => b.y);
  return { pours, letters, seq, runs: [], y0: ys.length ? Math.min(...ys) : 0 };
}
// A case on the press's clock (seconds), in the order print() set: still, every glyph laid at once; drawn, each step at
// its pace (an initial's cutting ~4 s; a vine's growing a second or so; a stamp, a beat).
function timeline(pr, kind, animate) {
  const own = []; let u = 0;
  for (const e of pr.seq) { const d = animate ? e.d : 0; own.push({ t0: u, t1: u + d, ...(e.pour ? { pour: e.pour } : { letter: e.letter }) }); u += animate ? d * .85 : 0; }
  return { own, u: Math.max(u, .01), cap: kind === 'drop' ? 6 : 2.4 };
}

export const kelmscott = { label: 'Kelmscott', minGap: 2, theme: { rubric: 'rgb(184 54 40)', rubricDark: 'rgb(222 112 88)' },
  setup: () => ({ kinds: FILLERS }), kinds: (v, rich) => FILL === 'knot' || rich >= .75 ? FILLERS : ['none'],
  fillAt: { gap: .6, head: 3, rise: 1 },
  hurry: [4, 1, 1.5, 1.6], steady: ['drop'],
  paraph, filler, breakMark, initial, frames, palette, print, timeline, FILLERS, GLYPHS, loadGlyph,
  set paraphCol(c) { PARAPH_COL = c === 'black' ? 'k' : 'r'; }, set fill(c) { FILL = c === 'knot' ? 'knot' : 'none'; },
  set darkCut(c) { DARK_CUT = c === 'negative' ? 'negative' : 'positive'; },
  set breaks(c) { BREAK = ['rose', 'grape', 'mirror'].includes(c) ? c : 'all'; },
  set code(c) { CODE = c === 'none' ? 'none' : 'rule'; }, set vine(c) { QUIET = c === 'none'; }, set caps(c) { CAPS = ['graft', 'grow', 'gen', 'gen2', 'morris'].includes(c) ? c : 'garden'; } };
export default kelmscott;
