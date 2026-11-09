// The styles the site shows, in one list. Adding a style is one entry here (and a run of tools/swatches.mjs for its
// swatch). family: where it sits in the catalogue; line: one line of provenance under its name; credit: the line
// under the specimen; rich: the highest richness level it has marks for (0 plain .. 4 lavish); own: its own choices,
// [option, label, [[value, label]...] | default text, { mod: true }?].
export const FAMILIES = [
  ['manuscript', 'Manuscript'], ['print', 'Print'], ['esoteric', 'Esoteric'], ['technical', 'Technical'], ['modern', 'Modern'],
];
export const CATALOGUE = [
  { key: 'blackletter', name: 'Blackletter', family: 'manuscript', line: 'German books, fifteenth century', rich: 4,
    credit: 'After German books of the fifteenth century, among them Johann Neudörffer’s <i>Eine gute Ordnung</i>, 1538, and the Winter Breviary of Constance, 1476–78. The Metropolitan Museum of Art.' },
  { key: 'tarot', name: 'Tarot', family: 'print', line: 'Tarot de Marseille, 1760', rich: 4,
    credit: 'After the Tarot de Marseille of Nicolas Conver, 1760. Bibliothèque nationale de France.',
    own: [['set', 'Initial', [['contour', 'Red letter'], ['solid', 'Black letter']]], ['title', 'Card title', 'Le Livre']] },
  { key: 'occult', name: 'Occult', family: 'esoteric', line: 'Clavicules de Salomon, about 1725', rich: 4,
    credit: 'After French copies of the <i>Clavicules de Salomon</i>, Wellcome MS 4670 and MS 4666, and John Dee’s <i>Monas hieroglyphica</i>, 1564. Wellcome Collection.',
    own: [['set', 'Initial', [['ring', 'Solid ring'], ['band', 'Lettered band']]], ['title', 'Ring', 'ALPHA ET OMEGA PRINCIPIVM ET FINIS']] },
  { key: 'astrology', name: 'Astrology', family: 'esoteric', line: 'Lilly, Christian Astrology, 1647', rich: 4,
    credit: 'After William Lilly’s <i>Christian Astrology</i>, 1647, and the volvelle of the <i>Clavis astrologiae elimata</i>. Wellcome Collection.',
    own: [['set', 'Initial', [['square', 'Square figure'], ['volvelle', 'Volvelle']]], ['figure', 'Figure', [['octagon', 'Octagon'], ['houses', 'Houses']]], ['title', 'Middle square', 'Anno Dom: 1853']] },
  { key: 'kelmscott', name: 'Kelmscott', family: 'print', line: 'William Morris, Kelmscott Press, 1896', rich: 4,
    credit: 'After William Morris’s Kelmscott Press: the Chaucer, 1896, <i>The Well at the World’s End</i>, 1896, and <i>The Water of the Wondrous Isles</i>, 1897. Internet Archive and The Metropolitan Museum of Art.',
    // (mod: a setting on the style's own module rather than a rubricate option)
    own: [['caps', 'Initials', [['garden', 'Garden'], ['morris', 'Morris’s own']], { mod: true }],
      ['orn', 'Ornament', [['mix', 'Mixed'], ['plait', 'Plait'], ['vine2', 'Running vine']], { mod: true }],
      ['vine', 'Quotations', [['ink', 'Garden vine'], ['traced', 'Morris’s vine'], ['plait', 'Plait band'], ['none', 'None']], { mod: true }],
      ['fill', 'Line fillers', [['vine', 'Vine'], ['none', 'None']], { mod: true }]] },
  { key: 'nouveau', name: 'Nouveau', family: 'print', line: 'Grasset, Obrist, the Combinaisons ornementales, 1896–1901', rich: 4,
    credit: 'After Eugène Grasset’s <i>La plante et ses applications ornementales</i>, 1896, and the <i>Combinaisons ornementales</i> of Verneuil, Auriol and Mucha, 1901. Internet Archive.',
    own: [['kind', 'Manner', [['plante', 'La plante'], ['fouet', 'Le fouet']], { mod: true }],
      ['paint', 'Plante paint', [['watercolour', 'Watercolour'], ['printed', 'Printed']], { mod: true }],
      ['fpaint', 'Fouet paint', [['gouache', 'Gouache'], ['wash', 'Pen and wash']], { mod: true }],
      ['darkPaint', 'Dark ground', [['body', 'Body colour'], ['toned', 'Toned paper']], { mod: true }]] },
  { key: 'insular', name: 'Insular', family: 'manuscript', line: 'The Lindisfarne Gospels and the Book of Durrow, c. 680–715', rich: 4,
    credit: 'After the Lindisfarne Gospels, British Library, Cotton MS Nero D IV, f. 139r, and the Book of Durrow, Trinity College Dublin, MS 57, fol. 86r.',
    own: [['kind', 'Book', [['lind', 'Lindisfarne'], ['durrow', 'Durrow']], { mod: true }]] },
  { key: 'draft', name: 'Draft', family: 'technical', line: 'Apollo drawings, MIT, 1963–66', rich: 4,
    credit: 'After the Apollo guidance drawings of the MIT Instrumentation Laboratory, 1963–66. National Archives.',
    own: [['set', 'Initial', [['part', 'In section'], ['views', 'Two views'], ['leroy', 'Lettering']]]] },
];
export const byKey = Object.fromEntries(CATALOGUE.map(s => [s.key, s]));
