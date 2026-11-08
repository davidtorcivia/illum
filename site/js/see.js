// See: one text in any of the styles. The viewer names the current style (it opens the catalogue; ‹ › step through the
// list), shows still or written, and keeps the rest under Adjust. The catalogue is built from js/catalogue.js.
import { mount, RICH } from './specimen.js';
import { CATALOGUE, FAMILIES, byKey } from './catalogue.js';

const $ = id => document.getElementById(id), esc = s => String(s).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
const viewer = $('viewer'), dlg = $('catalogue'), panel = $('adjust'), more = $('more');
const q = new URLSearchParams(location.search), asked = q.get('style');
const seg = (name, opts, cur) => opts.map(([v, t]) => `<label><input type="radio" name="${name}" value="${esc(v)}"${v === cur ? ' checked' : ''}><span>${esc(t)}</span></label>`).join('');

// the catalogue: every style as its swatch, its name and a line of provenance, by family; one radio group, so the
// arrow keys walk it and the choice shows behind the dialog at once
$('cat-list').innerHTML = FAMILIES.map(([fam, label]) => { const in_ = CATALOGUE.filter(s => s.family === fam); if (!in_.length) return '';
  return `<section class="fam" aria-labelledby="fam-${fam}"><h3 id="fam-${fam}">${label}</h3><div class="swatches" role="radiogroup" aria-labelledby="fam-${fam}">` +
    in_.map(s => `<label class="sw"><input type="radio" name="pick" value="${s.key}">` +
      `<span class="img"><img class="l" src="swatches/${s.key}-light.webp" alt="" width="120" height="120" loading="lazy" decoding="async">` +
      `<img class="d" src="swatches/${s.key}-dark.webp" alt="" width="120" height="120" loading="lazy" decoding="async"></span>` +
      `<span class="nm">${s.name}</span><span class="ln">${s.line}</span></label>`).join('') + '</div></section>'; }).join('');

// what changes with the style: its name, the credit, the richness it has, its own choices
function dress(st) {
  const S = byKey[st.style];
  $('current-name').textContent = S.name; document.title = `${S.name} · See · illum`;
  $('credit').innerHTML = `${S.credit} <a href="sources.html#${S.key}">Sources</a>`;
  $('rich').innerHTML = '<legend>Richness</legend>' + seg('rich', RICH.slice(0, S.rich + 1).map((t, i) => [String(i), t]), String(Math.min(S.rich, Math.round(st.rich * 4))));
  $('own').innerHTML = (S.own ?? []).map(([k, label, o]) => Array.isArray(o)
    ? `<fieldset class="seg"><legend>${label}</legend>${seg(k, o, st[k] ?? o[0][0])}</fieldset>`
    : `<div class="text"><label for="o-${k}">${label}</label><input type="text" id="o-${k}" name="${k}" value="${esc(st[k] ?? o)}" autocomplete="off" spellcheck="false"></div>`).join('');
  viewer.querySelectorAll('input[name=draw]').forEach(i => i.checked = i.value === st.draw);
  dlg.querySelectorAll('input[name=pick]').forEach(i => i.checked = i.value === st.style);
}
const v = mount(document.querySelector('.sheet'), { style: byKey[asked] ? asked : CATALOGUE[0].key, styleParam: true,
  onStart: dress, onSeed: s => { $('seed').textContent = s; } });
const go = key => { if (key === v.state.style) return; const clear = { style: key, set: undefined, title: undefined, figure: undefined };
  for (const o of byKey[v.state.style].own ?? []) if (o[3]?.mod) clear[o[0]] = undefined;
  v.update(clear); };
const step = d => { const i = CATALOGUE.findIndex(s => s.key === v.state.style); go(CATALOGUE[(i + d + CATALOGUE.length) % CATALOGUE.length].key); };

// the viewer and Adjust
viewer.addEventListener('change', e => { const t = e.target, n = t.name;
  if (n === 'draw') v.update({ draw: t.value });
  else if (n === 'rich') v.update({ rich: +t.value / 4 });
  else if (n === 'set' || n === 'figure' || n === 'title' || (byKey[v.state.style].own ?? []).some(o => o[0] === n && o[3]?.mod)) v.update({ [n]: t.value });
  else if (t.id === 'size') v.update({ size: +t.value }); });
panel.addEventListener('submit', e => e.preventDefault());
viewer.querySelectorAll('.step').forEach(b => b.addEventListener('click', () => step(+b.dataset.step)));
const size = $('size'), say = () => $('sizeOut').value = size.value + ' px';
size.value = v.state.size ?? Math.round(parseFloat(getComputedStyle(document.querySelector('.sheet')).fontSize)); say();
size.addEventListener('input', say);
if (matchMedia('(prefers-reduced-motion: reduce)').matches) { const w = viewer.querySelector('input[name=draw][value=read]'); w.disabled = true; w.closest('label').title = 'Your system asks for reduced motion'; }
$('again').addEventListener('click', () => v.update({ seed: 1 + Math.floor(Math.random() * 9999998) }));
const fold = open => { panel.hidden = !open; more.setAttribute('aria-expanded', open); };
more.addEventListener('click', () => fold(panel.hidden));

// the catalogue: a modal dialog (focus kept inside, Escape closes); choosing a style shows it at once, a click or
// Enter closes it
$('current').addEventListener('click', () => { fold(false); dlg.showModal(); (dlg.querySelector('input[name=pick]:checked') ?? dlg.querySelector('input'))?.focus(); });
dlg.addEventListener('change', e => e.target.name === 'pick' && go(e.target.value));
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); else if (e.target.closest('label.sw') && e.detail) setTimeout(() => dlg.close(), 120); });
dlg.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.name === 'pick') { e.preventDefault(); dlg.close(); } });
dlg.addEventListener('close', () => $('current').focus());

// stepping without the catalogue: ← → on a desk (not while typing), a sideways swipe across the specimen on a phone
addEventListener('keydown', e => { if (dlg.open || e.altKey || e.ctrlKey || e.metaKey || /input|textarea|select/i.test(e.target.tagName)) return;
  if (e.key === 'ArrowRight') step(1); else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'Escape' && !panel.hidden) { fold(false); more.focus(); } });
let t0 = null; const sheet = document.querySelector('.sheet');
sheet.addEventListener('touchstart', e => { const t = e.touches[0]; t0 = e.touches.length === 1 ? [t.clientX, t.clientY, performance.now()] : null; }, { passive: true });
sheet.addEventListener('touchend', e => { if (!t0) return; const t = e.changedTouches[0], dx = t.clientX - t0[0], dy = t.clientY - t0[1], dt = performance.now() - t0[2]; t0 = null;
  if (Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(dy) && dt < 600) step(dx < 0 ? 1 : -1); }, { passive: true });
