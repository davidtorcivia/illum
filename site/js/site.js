// The theme switch every page has: the reader's system setting until they choose; their choice kept (if storage
// allows) and set as data-theme on <html>. Tells the page with a 'themechange' event so ornament can be redrawn.
const root = document.documentElement, mq = matchMedia('(prefers-color-scheme: dark)');
let kept = null; try { kept = localStorage.getItem('illum-theme'); } catch {}
if (kept === 'light' || kept === 'dark') root.dataset.theme = kept;
export const theme = () => root.dataset.theme || (mq.matches ? 'dark' : 'light');

const bs = document.querySelectorAll('.theme');
const label = () => { const next = theme() === 'dark' ? 'light' : 'dark';
  bs.forEach(b => { b.textContent = next === 'dark' ? 'Dark' : 'Light'; b.setAttribute('aria-label', `Switch to ${next} mode`); }); };
label();
bs.forEach(b => b.addEventListener('click', () => { const next = theme() === 'dark' ? 'light' : 'dark'; root.dataset.theme = next;
  try { localStorage.setItem('illum-theme', next); } catch {}
  label(); dispatchEvent(new CustomEvent('themechange', { detail: next })); }));
mq.addEventListener('change', () => { if (!root.dataset.theme) { label(); dispatchEvent(new CustomEvent('themechange', { detail: theme() })); } });
