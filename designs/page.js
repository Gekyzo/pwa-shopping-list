import { parseCatalog, classesInScript } from './catalog.js';

// A browser cannot list a directory, so the views are named here. tests/design.test.js keeps the
// list equal to src/ui/.
const UI = ['add', 'arrange', 'context', 'controls', 'drag', 'edit', 'list', 'menu', 'motion', 'nav', 'onboarding', 'recipes', 'rows', 'settings', 'view'];

const $ = (id) => document.getElementById(id);

const el = (tag, { dataset = {}, ...props } = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  Object.assign(node.dataset, dataset);
  node.append(...children);
  return node;
};

const get = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(url);
  return response.text();
};

// Where a class is used: the sections and sheets of index.html, by the id of the nearest box or
// the landmark around it, and the views of src/ui/.
const usesOf = (name, page, scripts) => {
  const place = (node) => {
    const box = node.closest('[id]');
    return box ? `#${box.id}` : (node.closest('header, nav, main, footer')?.localName ?? 'body');
  };
  const boxes = [...page.querySelectorAll(`.${CSS.escape(name)}`)].map(place);
  const files = scripts.filter(([, classes]) => classes.includes(name)).map(([file]) => `src/ui/${file}.js`);
  return [...new Set([...boxes, ...files])];
};

const swatch = (token) =>
  el('div', { className: 'ds-swatch', title: token.value }, [
    el('span', { style: `color-scheme: light; background: ${token.value}` }),
    el('span', { style: `color-scheme: dark; background: ${token.value}` }),
    el('code', { textContent: `${token.name}${token.note ? ` · ${token.note}` : ''}` }),
  ]);

const SAMPLES = {
  space: (value) => el('span', { style: `display: block; width: ${value}; height: 12px; background: var(--accent)` }),
  radius: (value) => el('span', { style: `display: block; width: 48px; height: 48px; border: 2px solid var(--accent); border-radius: ${value}` }),
  text: (value) => el('span', { style: `font-size: ${value}`, textContent: 'Leche entera' }),
  weight: (value) => el('span', { style: `font-weight: ${value}`, textContent: 'Leche entera' }),
  shadow: (value) => el('span', { style: `display: block; width: 96px; height: 40px; border-radius: 10px; background: var(--surface); box-shadow: ${value}` }),
  size: (value) => el('span', { style: `display: block; width: ${value}; height: 12px; background: var(--muted)` }),
};

const scaleRow = (token) =>
  el('div', { className: 'ds-scale', dataset: { name: token.name } }, [
    el('code', { textContent: `${token.name}: ${token.value}${token.note ? ` · ${token.note}` : ''}` }),
    SAMPLES[token.scale]?.(`var(${token.name})`) ?? el('span'),
  ]);

const example = (html) => {
  const box = el('div', { className: 'ds-example' });
  // The examples are the markup of styles.css itself, written by its author, so they go in as HTML.
  box.innerHTML = html.replaceAll('icons.svg#', '../icons.svg#');
  const copy = el('button', { className: 'button outline', type: 'button', textContent: 'Copy' });
  copy.addEventListener('click', async () => {
    await navigator.clipboard.writeText(html);
    copy.textContent = 'Copied';
    setTimeout(() => {
      copy.textContent = 'Copy';
    }, 1200);
  });
  return [box, el('div', { className: 'ds-code' }, [el('pre', { textContent: html }), copy])];
};

const list = (title, items) =>
  items.length ? [el('p', { className: 'ds-meta', textContent: `${title}: ${items.map((item) => `${item.name} — ${item.text}`).join(' · ')}` })] : [];

const card = (part, page, scripts) =>
  el('section', { className: 'ds-card', dataset: { name: [part.name, ...part.parts.map((p) => p.name), ...part.variants.map((v) => v.name)].join(' ') } }, [
    el('h3', { textContent: part.name }),
    el('p', { textContent: part.summary }),
    ...list('Variants', part.variants),
    ...list('Parts', part.parts),
    ...list('States', part.states),
    ...part.examples.flatMap(example),
    el('p', { className: 'ds-meta', textContent: `Used in: ${usesOf(part.name, page, scripts).join(', ') || 'nothing yet'}` }),
  ]);

const section = (title, children) => el('section', { className: 'ds-section' }, [el('h2', { textContent: title }), ...children]);

const render = ({ catalog, page, scripts }) => {
  const of = (layer) => catalog.components.filter((part) => part.layer === layer);
  const colours = catalog.tokens.filter((token) => token.scale === 'colour');
  const scales = catalog.tokens.filter((token) => token.scale !== 'colour');
  const scopes = [...new Set(of('screens').map((part) => part.scope))];
  $('out').replaceChildren(
    ...(catalog.errors.length ? [el('p', { className: 'ds-error', textContent: catalog.errors.join(' · ') })] : []),
    section('Colours · light | dark', [el('div', { className: 'ds-swatches' }, colours.map(swatch))]),
    section('Scales', [el('div', { className: 'ds-card' }, scales.map(scaleRow))]),
    section('Icons', [
      el('div', { className: 'ds-icons' }, catalog.icons.map((id) => {
        const tile = el('div', { dataset: { name: id } }, [el('code', { textContent: id })]);
        tile.insertAdjacentHTML('afterbegin', `<svg class="icon" aria-hidden="true"><use href="../icons.svg#${id}"/></svg>`);
        return tile;
      })),
    ]),
    section('Components', of('components').map((part) => card(part, page, scripts))),
    section('Layouts', of('layouts').map((part) => card(part, page, scripts))),
    section('Base', of('base').map((part) => card(part, page, scripts))),
    ...scopes.map((scope) => section(`Screen parts · ${scope}`, of('screens').filter((part) => part.scope === scope).map((part) => card(part, page, scripts)))),
  );
};

const filter = () => {
  const query = $('filter').value.trim().toLowerCase();
  document.querySelectorAll('#out [data-name]').forEach((node) => {
    node.hidden = query !== '' && !node.dataset.name.toLowerCase().includes(query);
  });
};

$('filter').addEventListener('input', filter);
$('theme').addEventListener('change', (event) => {
  if (event.target.value) document.documentElement.dataset.theme = event.target.value;
  else delete document.documentElement.dataset.theme;
});

const fail = (text) => $('out').replaceChildren(el('p', { className: 'ds-error', textContent: text }));

let sources = null;
try {
  sources = await Promise.all(['../styles.css', '../icons.svg', '../index.html', ...UI.map((name) => `../src/ui/${name}.js`)].map(get));
} catch (error) {
  fail(`Could not load ${error.message}. Run npm run serve and open http://localhost:8080/designs/.`);
}
if (sources) {
  const [css, sprite, html, ...views] = sources;
  render({
    catalog: parseCatalog({ css, sprite }),
    page: new DOMParser().parseFromString(html, 'text/html'),
    scripts: UI.map((name, index) => [name, classesInScript(views[index])]),
  });
}
