// A rubricated text on this site, and the controls beside it. The state lives in the URL, in the specimen pages' own
// terms (?draw, ?rich=0..1, ?size=px, #seed=n, and a style's ?set=, ?title=, ?figure=), so a view can be passed on.
import { rubricate } from '../kit/illum.js';

// what each style's specimen page passed to rubricate (playground/tests/<style>.html)
const FILLER = 'h2, .text > p:not(.sub):not(.pull):not(.bare)';
export const STYLE = {
  blackletter: { lines: 4, filler: FILLER },
  tarot: { lines: 4, filler: FILLER },
  occult: { lines: 4, filler: FILLER },
  astrology: { lines: null, filler: FILLER, title: 'Anno Dom: 1853' },
  draft: { lines: null, filler: '.text > p:not(.sub):not(.pull):not(.bare)' },
};
export const RICH = ['plain', 'modest', 'usual', 'fine', 'lavish'];
const still = matchMedia('(prefers-reduced-motion: reduce)');

export function mount(sheet, { style, form, onSeed } = {}) {
  const text = sheet.querySelector('.text'), q = new URLSearchParams(location.search);
  const state = {
    style, draw: q.has('draw') && !still.matches ? 'read' : 'still',
    rich: Math.max(0, Math.min(1, +(q.get('rich') ?? .5) || 0)),
    size: +q.get('size') || null,
    seed: +(location.hash.match(/seed=(\d+)/)?.[1] ?? 0) || undefined,
    set: q.get('set') ?? undefined, title: q.get('title') ?? undefined, figure: q.get('figure') ?? undefined,
  };
  let r = null;
  const opts = () => { const S = STYLE[state.style];
    return { style: state.style, rich: state.rich, seed: state.seed, draw: state.draw, select: { filler: S.filler },
      initial: { set: state.set, title: state.title ?? S.title }, frame: { form: state.figure },
      on: (st, t) => { const seed = r?.state.seed; if (seed != null) onSeed?.(seed);
        document.body.dataset.timing = t ? `in view ${t.view} ms, all ${t.all} ms` : st === 'written' ? 'drawn' : st; } }; };
  // the host markup a style's page used: a drop four lines deep, or the style's own depth
  const prepare = () => { sheet.dataset.style = state.style; const L = STYLE[state.style].lines;
    text.querySelectorAll('.ini.drop').forEach(s => L ? s.dataset.lines = L : delete s.dataset.lines);
    sheet.style.fontSize = state.size ? state.size + 'px' : ''; };
  const start = () => { r?.destroy(); prepare(); r = rubricate(text, opts()); window.R = r; };
  const url = () => { const u = new URL(location.href), p = u.searchParams;
    state.draw === 'read' ? p.set('draw', '') : p.delete('draw');
    state.rich !== .5 ? p.set('rich', state.rich) : p.delete('rich');
    state.size ? p.set('size', state.size) : p.delete('size');
    for (const k of ['set', 'title', 'figure']) state[k] != null && state[k] !== '' ? p.set(k, state[k]) : p.delete(k);
    if (form?.dataset.home && state.style !== form.dataset.home) p.set('style', state.style); else p.delete('style');
    u.hash = state.seed ? `seed=${state.seed}` : ''; history.replaceState(null, '', u.toString().replace('draw=&', 'draw&').replace(/draw=$/, 'draw')); };
  const update = patch => { Object.assign(state, patch); url();
    start(); };   // (a fresh rubricate each time: redraw() keeps a written style's marks made, so rich would not change)

  if (form) wire(form, state, update);
  addEventListener('themechange', () => r?.redraw());
  start();
  return { state, update, get r() { return r; } };
}

// the controls: any element with name= rich | size | draw | seed | set | title | figure | style
function wire(form, state, update) {
  const $ = n => form.elements.namedItem(n);
  form.addEventListener('submit', e => e.preventDefault());
  const rich = $('rich'), richOut = form.querySelector('output[for=rich]');
  if (rich) { rich.value = Math.round(state.rich * 4); const say = () => richOut && (richOut.value = RICH[+rich.value]); say();
    rich.addEventListener('input', say); rich.addEventListener('change', () => update({ rich: +rich.value / 4 })); }
  const size = $('size'), sizeOut = form.querySelector('output[for=size]');
  if (size) { const base = () => parseFloat(getComputedStyle(form.closest('main, body').querySelector('.sheet')).fontSize);
    size.value = state.size ?? Math.round(base()); const say = () => sizeOut && (sizeOut.value = size.value + ' px'); say();
    size.addEventListener('input', say); size.addEventListener('change', () => update({ size: +size.value })); }
  const draw = form.querySelectorAll('input[name=draw]');
  draw.forEach(i => { i.checked = i.value === state.draw; i.disabled = still.matches && i.value === 'read';
    i.addEventListener('change', () => i.checked && update({ draw: i.value })); });
  if (still.matches) form.querySelector('.still-note')?.removeAttribute('hidden');
  const seed = $('seed');
  seed?.addEventListener('change', () => update({ seed: Math.max(0, Math.floor(+seed.value)) || undefined }));
  form.querySelector('[data-reroll]')?.addEventListener('click', () => { const s = 1 + Math.floor(Math.random() * 9999998); seed.value = s; update({ seed: s }); });
  for (const n of ['set', 'figure', 'style']) form.querySelectorAll(`input[name=${n}]`).forEach(i => {
    if (n === 'style') i.checked = i.value === state.style; else i.checked = i.value === (state[n] ?? form.querySelector(`input[name=${n}][data-default]`)?.value);
    i.addEventListener('change', () => i.checked && update({ [n]: i.value })); });
  const title = $('title');
  if (title) { if (state.title != null) title.value = state.title;
    title.addEventListener('change', () => update({ title: title.value })); }
}
