// See: the five styles on one text, and the instrument at the foot of the window that changes how it is shown.
import { mount, RICH } from './specimen.js';

const CREDIT = {
  blackletter: ['After German books of the fifteenth century, among them Johann Neudörffer’s <i>Eine gute Ordnung</i>, 1538, and the Winter Breviary of Constance, 1476–78. The Metropolitan Museum of Art.', 4],
  tarot: ['After the Tarot de Marseille of Nicolas Conver, 1760. Bibliothèque nationale de France.', 2],
  occult: ['After French copies of the <i>Clavicules de Salomon</i>, Wellcome MS 4670 and MS 4666, and John Dee’s <i>Monas hieroglyphica</i>, 1564. Wellcome Collection.', 2],
  astrology: ['After William Lilly’s <i>Christian Astrology</i>, 1647, and the volvelle of the <i>Clavis astrologiae elimata</i>. Wellcome Collection.', 2],
  draft: ['After the Apollo guidance drawings of the MIT Instrumentation Laboratory, 1963–66. National Archives.', 2],
};
// each style's own choices for its drop initial and frames: [key, label, [[value, label]...] | default text]
const OWN = {
  tarot: [['set', 'Initial', [['contour', 'Red letter'], ['solid', 'Black letter']]], ['title', 'Card title', 'Le Livre']],
  occult: [['set', 'Initial', [['ring', 'Solid ring'], ['band', 'Lettered band']]], ['title', 'Ring', 'ALPHA ET OMEGA PRINCIPIVM ET FINIS']],
  astrology: [['set', 'Initial', [['square', 'Square figure'], ['volvelle', 'Volvelle']]], ['figure', 'Figure', [['octagon', 'Octagon'], ['houses', 'Houses']]], ['title', 'Middle square', 'Anno Dom: 1853']],
  draft: [['set', 'Initial', [['part', 'In section'], ['views', 'Two views'], ['leroy', 'Lettering']]]],
};

const f = document.getElementById('tester'), $ = id => document.getElementById(id), esc = s => s.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
const q = new URLSearchParams(location.search), asked = q.get('style');
const seg = (name, opts, cur) => opts.map(([v, t]) => `<label><input type="radio" name="${name}" value="${v}"${v === cur ? ' checked' : ''}><span>${t}</span></label>`).join('');

let v;
// what changes with the style: the credit, the richness it has, its own choices
function dress(st) {
  const [credit, top] = CREDIT[st.style];
  $('credit').innerHTML = `${credit} <a href="sources.html#${st.style}">Sources</a>`;
  const lv = Math.min(top, Math.round(st.rich * 4));
  $('rich').innerHTML = '<legend>Richness</legend>' + seg('rich', RICH.slice(0, top + 1).map((t, i) => [String(i), t]), String(lv));
  $('own').innerHTML = (OWN[st.style] ?? []).map(([k, label, o]) => Array.isArray(o)
    ? `<fieldset class="seg"><legend>${label}</legend>${seg(k, o, st[k] ?? o[0][0])}</fieldset>`
    : `<div class="text"><label for="o-${k}">${label}</label><input type="text" id="o-${k}" name="${k}" value="${esc(st[k] ?? o)}" autocomplete="off" spellcheck="false"></div>`).join('');
  f.elements.style.value = st.style; f.elements.draw.value = st.draw;
}

v = mount(document.querySelector('.sheet'), { style: CREDIT[asked] ? asked : 'blackletter', styleParam: true,
  onStart: dress, onSeed: s => { $('seed').textContent = s; } });

f.addEventListener('submit', e => e.preventDefault());
f.addEventListener('change', e => { const t = e.target, n = t.name;
  if (n === 'style') v.update({ style: t.value, set: undefined, title: undefined, figure: undefined });
  else if (n === 'draw') v.update({ draw: t.value });
  else if (n === 'rich') v.update({ rich: +t.value / 4 });
  else if (n === 'set' || n === 'figure' || n === 'title') v.update({ [n]: t.value });
  else if (t.id === 'size') v.update({ size: +t.value });
});
const size = $('size'), say = () => $('sizeOut').value = size.value + ' px';
size.value = v.state.size ?? Math.round(parseFloat(getComputedStyle(document.querySelector('.sheet')).fontSize)); say();
size.addEventListener('input', say);
if (matchMedia('(prefers-reduced-motion: reduce)').matches) { const w = f.querySelector('input[name=draw][value=read]'); w.disabled = true; w.closest('label').title = 'Your system asks for reduced motion'; }
$('again').addEventListener('click', () => v.update({ seed: 1 + Math.floor(Math.random() * 9999998) }));
const more = $('more'), panel = $('adjust');
more.addEventListener('click', () => { const open = panel.hidden; panel.hidden = !open; more.setAttribute('aria-expanded', open); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { panel.hidden = true; more.setAttribute('aria-expanded', false); more.focus(); } });
