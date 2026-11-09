// kit/illum.js with every style loaded before it is used: for a page that lists or switches between all of them (cases.html,
// 06), which reads STYLES at once, or a page of the pilot registry's styles (03, 07, the choir book), whose modules are then
// fetched with the page's own rather than after it. A page of one written style imports kit/illum.js, which loads only what
// it draws.
import './wayfinding.js';
import './initials.js';
import './frames.js';
import './styles/draft.js';
import './styles/occult.js';
import './styles/astrology.js';
import './styles/tarot.js';
import './styles/blackletter.js';
import './styles/kelmscott.js';
import './styles/nouveau.js';
import './styles/insular.js';
import './styles/deco.js';
import './styles/choirbook.js';
import './styles/copperplate.js';
import { loadAll } from './illum.js';
await loadAll();   // (all here already: this only puts them in the registry, in its order)
export * from './illum.js';
