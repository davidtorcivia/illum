// A quiet light/dark switch for the playground's preview pages: a small button in the top right corner that reloads the
// page with ?theme=light or ?theme=dark (every page that has a dark mode reads it). Not part of the library: a host
// site owns its own theme. Include with <script type="module" src="…/kit/theme-toggle.js"></script>.
const q = new URLSearchParams(location.search);
const now = q.get('theme') ?? document.documentElement.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const b = document.createElement('button'), next = now === 'dark' ? 'light' : 'dark';
b.type = 'button'; b.textContent = next === 'dark' ? '☾ dark' : '☀ light'; b.title = `Show this page in ${next} mode`;
b.setAttribute('aria-label', `Switch to ${next} mode`);
Object.assign(b.style, { position: 'fixed', top: '12px', right: '12px', zIndex: 1000, font: 'italic 14px/1 "EB Garamond", Garamond, serif',
  padding: '6px 10px', borderRadius: '14px', cursor: 'pointer', border: '1px solid', opacity: '.75',
  background: now === 'dark' ? 'rgb(43 39 35)' : 'rgb(250 246 238)', color: now === 'dark' ? 'rgb(226 218 204)' : 'rgb(60 48 38)',
  borderColor: now === 'dark' ? 'rgb(90 82 74)' : 'rgb(200 190 176)' });
b.addEventListener('mouseenter', () => b.style.opacity = '1'); b.addEventListener('mouseleave', () => b.style.opacity = '.75');
b.addEventListener('click', () => { q.set('theme', next); location.replace(`${location.pathname}?${q}${location.hash}`); });
document.body.appendChild(b);
