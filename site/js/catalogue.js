// The styles the site shows, in one list. Adding a style is one entry here (and a run of tools/swatches.mjs for its
// swatch). family: where it sits in the catalogue; line: one line of provenance under its name; credit: the line
// under the specimen; rich: the highest richness level it has marks for (0 plain .. 4 lavish); own: its own choices,
// [option, label, [[value, label]...] | default text].
export const FAMILIES = [
  ['manuscript', 'Manuscript'], ['print', 'Print'], ['esoteric', 'Esoteric'], ['technical', 'Technical'], ['modern', 'Modern'],
];
export const CATALOGUE = [
  { key: 'blackletter', name: 'Blackletter', family: 'manuscript', line: 'German books, fifteenth century', rich: 4,
    credit: 'After German books of the fifteenth century, among them Johann Neudörffer’s <i>Eine gute Ordnung</i>, 1538, and the Winter Breviary of Constance, 1476–78. The Metropolitan Museum of Art.' },
  { key: 'tarot', name: 'Tarot', family: 'print', line: 'Tarot de Marseille, 1760', rich: 2,
    credit: 'After the Tarot de Marseille of Nicolas Conver, 1760. Bibliothèque nationale de France.',
    own: [['set', 'Initial', [['contour', 'Red letter'], ['solid', 'Black letter']]], ['title', 'Card title', 'Le Livre']] },
  { key: 'occult', name: 'Occult', family: 'esoteric', line: 'Clavicules de Salomon, about 1725', rich: 2,
    credit: 'After French copies of the <i>Clavicules de Salomon</i>, Wellcome MS 4670 and MS 4666, and John Dee’s <i>Monas hieroglyphica</i>, 1564. Wellcome Collection.',
    own: [['set', 'Initial', [['ring', 'Solid ring'], ['band', 'Lettered band']]], ['title', 'Ring', 'ALPHA ET OMEGA PRINCIPIVM ET FINIS']] },
  { key: 'astrology', name: 'Astrology', family: 'esoteric', line: 'Lilly, Christian Astrology, 1647', rich: 2,
    credit: 'After William Lilly’s <i>Christian Astrology</i>, 1647, and the volvelle of the <i>Clavis astrologiae elimata</i>. Wellcome Collection.',
    own: [['set', 'Initial', [['square', 'Square figure'], ['volvelle', 'Volvelle']]], ['figure', 'Figure', [['octagon', 'Octagon'], ['houses', 'Houses']]], ['title', 'Middle square', 'Anno Dom: 1853']] },
  { key: 'draft', name: 'Draft', family: 'technical', line: 'Apollo drawings, MIT, 1963–66', rich: 2,
    credit: 'After the Apollo guidance drawings of the MIT Instrumentation Laboratory, 1963–66. National Archives.',
    own: [['set', 'Initial', [['part', 'In section'], ['views', 'Two views'], ['leroy', 'Lettering']]]] },
];
export const byKey = Object.fromEntries(CATALOGUE.map(s => [s.key, s]));
