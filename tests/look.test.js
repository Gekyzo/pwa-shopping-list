import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The look of the Stitch screens of Bodega (DSV-11, DSV-15 and later) as facts of styles.css.
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

const tokensEnd = (() => {
  const start = css.indexOf('@layer tokens {');
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}' && (depth -= 1) === 0) return i + 1;
  }
  return css.length;
})();

// The light and the dark value of a token of the tokens layer, from `--name: light-dark(a, b)`.
const token = (name) => {
  const match = css.slice(0, tokensEnd).match(new RegExp(`${name}:\\s*light-dark\\((#[0-9a-f]+),\\s*(#[0-9a-f]+)\\)`, 'i'));
  return match ? { light: match[1].toLowerCase(), dark: match[2].toLowerCase() } : null;
};

// styles.css with no comments, so a selector list never holds the text of a comment.
const plain = css.replace(/\/\*[\s\S]*?\*\//g, '');

// The selectors of a list, split on the commas outside parentheses, so `:is(a, b)` stays whole.
const topLevel = (selectors) => {
  const parts = [''];
  let depth = 0;
  for (const char of selectors) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;
    if (char === ',' && depth === 0) parts.push('');
    else parts[parts.length - 1] += char;
  }
  return parts.map((part) => part.trim().replace(/\s+/g, ' '));
};

// The declarations of every rule whose selector list holds `selector` exactly, joined.
export const block = (selector, source = plain) =>
  [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => topLevel(selectors).includes(selector))
    .map(([, , body]) => body)
    .join('\n');

test('the light palette is the palette of the Stitch screens (DSV-11)', () => {
  const light = {
    '--bg': '#fff8f5',
    '--surface': '#ffffff',
    '--surface-2': '#fcf2eb',
    '--secondary': '#f6ece6',
    '--text': '#1f1b17',
    '--muted': '#3f4942',
    '--struck': '#6f7a71',
    '--line': '#bec9c0',
    '--control': '#6f7a71',
    '--done': '#13734b',
    '--warning': '#a23e18',
    '--danger': '#ba1a1a',
  };
  for (const [name, value] of Object.entries(light)) assert.equal(token(name)?.light, value, name);
});

test('each token of the palette has a dark value of its own (DSV-11)', () => {
  for (const name of ['--bg', '--surface', '--surface-2', '--secondary', '--text', '--muted', '--struck', '--line', '--control', '--done', '--warning']) {
    const value = token(name);
    assert.ok(value, name);
    assert.notEqual(value.dark, value.light, name);
  }
});

test('the dark canvas is the ink of the light theme (DSV-11)', () => {
  assert.equal(token('--bg').dark, '#1f1b17');
  assert.equal(token('--done').dark, '#82d8a8');
});

const ROW_LABEL = '.item-row-body:has(> .item-row-check) .item-row-label';

test('the name of a row of Compra keeps one line, then ends with an ellipsis (DSV-15)', () => {
  const body = block(ROW_LABEL);
  assert.match(body, /white-space:\s*nowrap/);
  assert.match(body, /overflow:\s*hidden/);
  assert.match(body, /text-overflow:\s*ellipsis/);
  assert.match(body, /display:\s*block/);
});

test('the quantity of a row is a tonal chip with no border from 600px, plain text below (DSV-15, DSV-33)', () => {
  const rules = [...plain.matchAll(/(^|\})\s*\.item-row-qty\s*\{([^{}]*)\}/g)].map(([, , body]) => body);
  const last = rules.at(-1);
  assert.match(last, /border:\s*0/);
  assert.match(last, /background:\s*none/);
  assert.match(block('.item-row-qty', from600), /background:\s*var\(--secondary\)/);
});

test('no hex colour outside the tokens layer', () => {
  assert.deepEqual(css.slice(tokensEnd).match(/#[0-9a-f]{3,8}\b/gi) ?? [], []);
});

test('the bought items stand in a card of their own, on --surface-2 (DSV-16)', () => {
  const head = block('.item-list > .bought-head');
  assert.match(head, /background:\s*var\(--surface-2\)/);
  assert.match(head, /border:\s*1px solid var\(--line\)/);
  assert.match(head, /border-radius:\s*var\(--radius-l\)/);
  assert.match(block('.bought-icon'), /color:\s*var\(--done\)/);
});

test('the dock floats over the list: no bar, its controls raised (DSV-17)', () => {
  const dock = block('.dock');
  assert.match(dock, /background:\s*transparent/);
  assert.match(dock, /border-top:\s*0/);
  const controls = block('.dock > :is(.chip, .button.icon, .button.accent):not(.dock-add)');
  assert.match(controls, /border:\s*var\(--border-control\) solid var\(--control\)/);
  assert.match(controls, /box-shadow:\s*var\(--shadow-l\)/);
  assert.match(block('.dock > .dock-add'), /box-shadow:\s*var\(--shadow-l\)/);
});

test('the tools of the header are tinted tiles (DSV-17)', () => {
  assert.match(block('.app-header .button.icon'), /background:\s*var\(--secondary\)/);
});

test('the toast is dark on the light theme, its action in the light emerald (DSV-17)', () => {
  assert.deepEqual(token('--toast-bg'), { light: '#342f2b', dark: '#eae1da' });
  assert.deepEqual(token('--toast-text'), { light: '#f9efe8', dark: '#1f1b17' });
  assert.deepEqual(token('--inverse-primary'), { light: '#82d8a8', dark: '#13734b' });
  assert.match(block('.toast .button.strong'), /color:\s*var\(--inverse-primary\)/);
});

test('a field of a sheet is an outlined box with its name inside, in small capitals (DSV-18)', () => {
  assert.match(block('.field.boxed > .field-label'), /position:\s*absolute/);
  assert.match(block('.field.boxed > .field-label'), /text-transform:\s*uppercase/);
  assert.match(block('.field.boxed > .field-input'), /border:\s*1px solid var\(--control\)/);
  assert.match(block('.field.boxed > .field-input:focus'), /border-color:\s*var\(--done\)/);
});

test('the repeat switch of Editar is a tonal card, and an idle switch is light (DSV-18)', () => {
  assert.match(block('.toggle-card'), /background:\s*var\(--surface-2\)/);
  assert.match(block('.toggle-card'), /border:\s*1px solid var\(--line\)/);
  assert.match(block('.switch-input'), /background:\s*var\(--secondary\)/);
});

test('an assigned shop is a pill with a cross, another shop a dashed suggestion (DSV-18)', () => {
  assert.match(block('.cluster.assign > .chip[aria-pressed="true"]::after'), /content:\s*"\\00d7"/);
  assert.match(block('.cluster.assign > .chip:not([aria-pressed="true"])'), /border-style:\s*dashed/);
  assert.match(block('.cluster.assign > .chip:not([aria-pressed="true"])::before'), /content:\s*"\+ "/);
});

test('Eliminar of a sheet is a text button in --danger (DSV-18)', () => {
  assert.match(block('.sheet-foot > .button.outline.danger'), /border-color:\s*transparent/);
});

test('the actions of a recipe card stand at its top end, the products below them full width (DSV-19)', () => {
  assert.match(block('.item-row.recipe .item-row-end'), /position:\s*absolute/);
  assert.match(block('.item-row.recipe .item-row-name > :not(.recipe-products)'), /padding-inline-end:/);
  assert.match(block('[data-hand="left"] .item-row.recipe .item-row-name > :not(.recipe-products)'), /padding-inline-start:/);
});

test('the count of Recetas in the header is an emerald pill (DSV-19)', () => {
  const pill = block('body:has([data-view="recipes"][aria-current="page"]) .app-header-subtitle');
  assert.match(pill, /background:\s*var\(--done-soft\)/);
  assert.match(pill, /border-radius:\s*var\(--radius-pill\)/);
});

test('a meal shows its kind as an icon at its top end, out of the flow (DSV-20)', () => {
  assert.match(block('.meal-icon'), /position:\s*absolute/);
  assert.match(block('.meal-icon'), /color:\s*var\(--done\)/);
  assert.match(block('.meal.dish .meal-icon'), /color:\s*var\(--muted\)/);
});

test('a free meal shows its call first and its name below, small (DSV-20)', () => {
  assert.match(block('.meal.free .meal-label'), /order:\s*1/);
});

test('the summary of the week is a muted line in small capitals (DSV-20)', () => {
  assert.match(block('.menu-summary'), /text-transform:\s*uppercase/);
  assert.match(block('.menu-summary'), /color:\s*var\(--muted\)/);
});

test('the count of Menú in the header is a neutral pill (DSV-20)', () => {
  const pill = block('body:has([data-view="menu"][aria-current="page"]) .app-header-subtitle');
  assert.match(pill, /background:\s*var\(--secondary\)/);
  assert.match(pill, /border-radius:\s*var\(--radius-pill\)/);
});

test('with its summary the action bar of Menú has a solid ground and a top line (DSV-20)', () => {
  const bar = block('.action-bar:has(> .menu-summary)');
  assert.match(bar, /background:\s*var\(--bg\)/);
  assert.match(bar, /border-top:\s*1px solid var\(--line\)/);
});

test('Ajustes: the icon of a group head, the irreversible tag and the count pill (DSV-21)', () => {
  assert.match(block('.list-group-icon'), /color:\s*var\(--muted\)/);
  assert.match(block('.settings-row-tag'), /text-transform:\s*uppercase/);
  assert.match(block('.settings-row-tag'), /color:\s*var\(--danger\)/);
  assert.match(block('.settings-row-count'), /border-radius:\s*var\(--radius-pill\)/);
  assert.match(block('.settings-row-count'), /background:\s*var\(--secondary\)/);
  assert.match(block('.settings-row-hint'), /color:\s*var\(--muted\)/);
});

test('Ajustes from 1024px: each row icon stands in a tinted tile; the update banner is tonal (DSV-21)', () => {
  assert.match(block('.settings .settings-row-icon'), /background:\s*var\(--surface-2\)/);
  assert.match(block('.settings .banner'), /border:\s*1px solid var\(--line\)/);
});

// The rules inside `@media (min-width: 1024px)`, as one text.
const wide = [...plain.matchAll(/@media \(min-width: 1024px\) \{([\s\S]*?)\n  \}\n/g)].map(([, inner]) => inner).join('\n');

test('the shadow of the current section is a 4px emerald bar (DSV-22)', () => {
  assert.match(css, /--shadow-current:\s*inset 4px 0 0 var\(--done\);/);
  assert.doesNotMatch(css, /--shadow-count/);
});

test('from 1024px the current section has an emerald bar at its start and an emerald count (DSV-22)', () => {
  assert.match(block('.nav-item[aria-current="page"]', wide), /box-shadow:\s*var\(--shadow-current\)/);
  assert.match(block('.nav-item[aria-current="page"]', wide), /background:\s*var\(--surface-high\)/);
  assert.match(block('.nav-item[aria-current="page"] .nav-count', wide), /background:\s*var\(--done\)/);
});

test('from 1024px a group head is the tinted top of its card, and the meta of a row is a pill (DSV-22)', () => {
  assert.match(block('.item-list:not(:has(> .item-row.recipe)) > .group-head', wide), /background:\s*var\(--surface-2\)/);
  assert.match(block('.item-row-body:has(> .item-row-check) > .item-row-name > .item-row-meta', wide), /border-radius:\s*var\(--radius-pill\)/);
  assert.match(block('.item-row-name > .item-row-qty', wide), /box-shadow:\s*inset 0 0 0 1px var\(--line\)/);
});

test('from 1024px a chip of the header is a 30px pill inside its tap size (DSV-27, TAP-1)', () => {
  const chips = '.app-header > :is(.shop-lists, .list-chips)';
  assert.match(block(':root', wide), /--chip-inset:\s*calc\(\(var\(--tap\) - 30px\) \/ 2\)/);
  assert.doesNotMatch(block(`${chips} > .chip`, wide), /min-height/);
  assert.match(block(`${chips} > .chip`, wide), /background:\s*transparent/);
  assert.match(block(`${chips} > .chip::before`, wide), /inset:\s*var\(--chip-inset\) 0/);
  assert.match(block(`${chips} > .chip[aria-pressed="true"]::before`, wide), /background:\s*var\(--done\)/);
  assert.match(block(chips, wide), /margin-top:\s*calc\(var\(--space-2\) - var\(--chip-inset\)\)/);
});

test('from 1024px every screen but Ajustes fills the content area (DSV-28)', () => {
  assert.match(block(':root', wide), /--page-max:\s*100%/);
});

test('from 1024px Ajustes is one centred 720px column of groups, heads above their rows (DSV-29)', () => {
  assert.match(block(':root', wide), /--settings-max:\s*720px/);
  assert.match(block('.settings-section', wide), /flex-direction:\s*column/);
  assert.match(block('.settings-section + .settings-section', wide), /border-top:\s*0/);
  assert.match(block('.settings-section > .list-group-head > .list-group-icon', wide), /order:\s*-1/);
  assert.match(block('.settings .settings-row.danger .settings-row-icon', wide), /var\(--danger-soft\)/);
  assert.match(block('.settings-row-tag', wide), /background:\s*var\(--danger-soft\)/);
});

test('from 1024px the content is 32px from its edges and the panels take a third of it (DSV-26)', () => {
  assert.match(block(':root', wide), /--gutter:\s*var\(--space-7\)/);
  assert.match(block(':root', wide), /--panel-width:\s*max\(240px, \(100vw - var\(--rail-width\) - var\(--space-7\) \* 4\) \/ 3\)/);
  assert.match(block('.item-list:not(:has(> .item-row.recipe)) > :is(.group-head, .section-head)', wide), /margin-top:\s*var\(--space-6\)/);
});

test('from 1024px the title keeps its text and the search field takes the room left (NAV-9)', () => {
  assert.match(block('.app-header > .app-header-text', wide), /min-width:\s*min-content/);
  const field = block('.app-header > .button.icon.header-search:not([hidden])', wide);
  assert.match(field, /flex:\s*10 1 0/);
  assert.match(field, /max-width:\s*var\(--search-field\)/);
  assert.match(field, /container-type:\s*inline-size/);
  assert.match(css, /@container \(max-width: 180px\) \{\s*\.header-search > \.header-search-key \{\s*display:\s*none;/);
  assert.match(css, /@container \(max-width: 100px\) \{\s*\.header-search > \.header-search-text \{\s*display:\s*none;/);
});

test('on a device that hovers, the end slot holds the button of more actions and the grip (ROW-16)', () => {
  const hover = [...plain.matchAll(/@media \(hover: hover\) and \(pointer: fine\) \{([\s\S]*?)\n  \}\n/g)].map(([, inner]) => inner).join('\n');
  assert.match(block('.row-more', hover), /visibility:\s*hidden/);
  assert.match(block('.item-row:is(:hover, :focus-within) .row-more', hover), /visibility:\s*visible/);
  assert.match(block('.item-row-body:has(> .item-row-check) > .item-row-end:not(:has(.pill))', hover), /width:\s*calc\(var\(--space-7\) \* 2\)/);
});

test('from 1024px the panels have a line below their head and an emerald 8px bar (DSV-26)', () => {
  assert.match(block('.side-panel-head', wide), /border-bottom:\s*1px solid var\(--line\)/);
  assert.match(block('.side-panel-card > .side-panel-bar', wide), /height:\s*var\(--space-2\)/);
  assert.match(block('.side-panel-card .side-panel-fill', wide), /background:\s*var\(--done\)/);
});

test('from 1024px Almacenamiento local is a small tinted card with its figure in monospace (DSV-26, LIST-43)', () => {
  assert.match(block('.side-panel-storage'), /display:\s*none/);
  const card = block('.side-panel-storage:not([hidden])', wide);
  assert.match(card, /display:\s*flex/);
  assert.match(card, /border-radius:\s*var\(--radius-s\)/);
  assert.match(block('.side-panel-storage-used', wide), /font-family:\s*var\(--font-mono\)/);
});

test('a past week of Semanas anteriores is a 4px tile, its names bordered pills (MENU-27, DSV-30)', () => {
  assert.match(block('.side-panel-week'), /border-radius:\s*var\(--radius-s\)/);
  assert.match(block('.side-panel-chip'), /border-radius:\s*var\(--radius-pill\)/);
  assert.match(block('.side-panel-count.done'), /background:\s*var\(--primary-soft\)/);
});

test('from 1024px the card of the fill has its storage as a foot, with a line above it (MENU-21, DSV-30)', () => {
  const foot = block('.side-panel-auto > .side-panel-storage:not([hidden])', wide);
  assert.match(foot, /border-top:\s*1px solid var\(--line\)/);
  assert.match(foot, /background:\s*none/);
  assert.match(block('.side-panel-auto > .side-panel-head', wide), /border-bottom:\s*0/);
});

test('from 1024px a recipe card ends with a foot of its actions, and the cards fill as many 288px columns as fit, beside the pane too (DSV-31)', () => {
  const end = block('.item-row.recipe .item-row-end', wide);
  assert.match(end, /position:\s*static/);
  assert.match(end, /border-top:\s*1px solid var\(--line\)/);
  assert.match(block('.recipe-send-text', wide), /display:\s*inline/);
  assert.match(block('body:has(.side-pane:not([hidden])) .item-list:has(> .item-row.recipe)', wide), /repeat\(auto-fill, minmax\(min\(100%, 18rem\), 1fr\)\)/);
  assert.match(block('.item-row.recipe.current', wide), /box-shadow:\s*0 0 0 1px var\(--primary\)/);
});

test('from 1024px the recipe pane shows its send across the foot; below it the send is hidden (REC-42, DSV-31)', () => {
  assert.match(block('.recipe-send'), /display:\s*none/);
  assert.match(block('.side-pane .recipe-send', wide), /display:\s*inline-flex/);
  assert.match(block('.side-pane .recipe-send-hint', wide), /display:\s*block/);
  assert.match(block('.side-pane .sheet-head > .sheet-title.main', wide), /display:\s*none/);
});

test('from 1024px Recetas puts its search on a second line with Filtros, and the chips fold (DSV-32)', () => {
  const recipes = 'body:has([data-view="recipes"][aria-current="page"])';
  assert.match(block(`${recipes} .app-header::after`, wide), /flex-basis:\s*100%/);
  assert.match(block(`${recipes} .app-header > .button.icon.header-search:not([hidden])`, wide), /order:\s*3/);
  assert.match(block('.app-header > .header-filter:not([hidden])', wide), /display:\s*inline-flex/);
  assert.match(block('.recipe-chips.folded', wide), /display:\s*none/);
  assert.match(block('.app-header-note', wide), /display:\s*inline/);
});

test('a product of a recipe starts with a dot, emerald when it is in Compra (REC-9)', () => {
  assert.match(block('.product::before'), /background:\s*var\(--line\)/);
  assert.match(block('.product.listed::before'), /background:\s*var\(--primary\)/);
});

test('from 1024px the outlined quantity chip wins over the tonal one: its rule is more specific (DSV-22)', () => {
  assert.match(block('.item-row-name > .item-row-qty', wide), /background:\s*var\(--surface-2\)/);
});

test('an empty boxed field shows its name once: the placeholder is transparent (DSV-18)', () => {
  assert.match(block('.field.boxed > .field-input::placeholder'), /color:\s*transparent/);
});

test('from 1024px the head of a closed group closes its card (DSV-22)', () => {
  const head = block('.item-list:not(:has(> .item-row.recipe)) > .group-head:not(:has(+ .item-row))', wide);
  assert.match(head, /border-bottom:\s*1px solid var\(--line\)/);
  assert.match(head, /border-radius:\s*var\(--radius-l\)/);
});

test('Cancelar of the search is a raised tile of the floating dock too (DSV-17)', () => {
  assert.match(block('.dock > :is(.chip, .button.icon, .button.accent):not(.dock-add)'), /background:\s*var\(--surface\)/);
});

// DSV-24: the rows and group cards of the desktop screen of Compra.
test('from 1024px a row has a 28px tick, a 16px semibold name and a monospace quantity chip (DSV-24)', () => {
  const root = block(':root', wide);
  assert.match(root, /--tick:\s*28px/);
  assert.match(root, /--text-row:\s*1rem/);
  assert.match(root, /--weight-row:\s*600/);
  assert.match(block('.item-row-name > .item-row-qty', wide), /font-family:\s*var\(--font-mono\)/);
});

test('from 1024px the recurrence is a terracotta pill beside the name, and its mark in the meta line goes (DSV-24)', () => {
  assert.match(block('.item-row-name > .item-row-title > .item-row-repeat', wide), /display:\s*inline-flex/);
  assert.match(block('.item-row-name > .item-row-title > .item-row-repeat', wide), /border:\s*1px solid var\(--warning-line\)/);
  assert.match(block('.item-row-name > .item-row-title > .item-row-repeat', wide), /background:\s*var\(--warning-soft\)/);
  assert.match(block('.item-row-meta > .item-row-repeat-meta', wide), /display:\s*none/);
  assert.match(block('.item-row-title > .item-row-repeat'), /display:\s*none/);
});

test('from 1024px the title of a group is 15px, with its count beside it (DSV-24)', () => {
  assert.match(block('.item-list:not(:has(> .item-row.recipe)) > .group-head', wide), /font-size:\s*var\(--text-label-lg\)/);
  assert.match(block('.group-head-button > .group-head-count', wide), /margin-inline-start:\s*0/);
});

test('the edit button of a row is the grip, an 18px mark in --struck (DSV-33)', () => {
  assert.match(block('.row-handle'), /color:\s*var\(--struck\)/);
  assert.match(block('.row-handle > .icon'), /width:\s*calc\(var\(--space-4\) \+ var\(--space-half\)\)/);
});

// DSV-33: the phone screen of Compra. `narrow` is styles.css outside its width queries.
const narrow = plain.replace(/@media \(min-width: \d+px\) \{[\s\S]*?\n  \}\n/g, '');
const from600 = [...plain.matchAll(/@media \(min-width: 600px\) \{([\s\S]*?)\n  \}\n/g)].map(([, inner]) => inner).join('\n');

test('below 600px the bar of Compra is a 56px band with a line below it, in place of the three dots (DSV-33)', () => {
  const bar = block('.app-bar:not([hidden])', narrow);
  assert.match(bar, /display:\s*flex/);
  assert.match(bar, /height:\s*calc\(56px \+ env\(safe-area-inset-top\)\)/);
  assert.match(bar, /border-bottom:\s*1px solid var\(--line\)/);
  assert.match(block('.app-bar', narrow), /display:\s*none/);
  assert.match(block('.app-bar > .app-bar-finish', narrow), /color:\s*var\(--done\)/);
  assert.match(block('.app-bar:not([hidden]) ~ .header-trip', narrow), /display:\s*none/);
  assert.match(block('.app-bar:not([hidden])', from600), /display:\s*none/);
  assert.match(block('.app-bar:not([hidden]) ~ .header-trip', from600), /display:\s*inline-flex/);
});

test('below 600px the toast stands at the top, and from 600px at the bottom (DSV-33)', () => {
  assert.match(block('.toast', narrow), /top:\s*calc\(var\(--space-2\) \+ env\(safe-area-inset-top\)\);\s*bottom:\s*auto/);
  assert.match(block('.toast', from600), /top:\s*auto/);
  assert.match(block('body:has(.sheet-layer:not([hidden])) .toast', narrow), /bottom:\s*auto/);
  assert.match(block('.toast.done > .toast-icon'), /display:\s*block/);
});

test('below 1024px a row is 60px from 600px, its quantity 15px, and a bought row fades with only its name struck (DSV-33)', () => {
  assert.match(block('.item-row-check', from600), /margin-block:\s*calc\(var\(--space-3\) \+ var\(--space-half\)\)/);
  assert.match(block('.item-row-qty', narrow), /font-size:\s*var\(--text-label-lg\)/);
  assert.match(block('.item-row.bought .item-row-body > *', narrow), /opacity:\s*0\.65/);
  assert.match(block('.item-row.bought .item-row-label', narrow), /line-through/);
  assert.match(block('.item-row.bought .item-row-name', wide), /line-through/);
  assert.match(block('.item-row.bought .item-row-body > *', wide), /opacity:\s*1/);
});

test('the shop chip of the dock is a round pill at its start, with the shop icon in --done (DSV-33)', () => {
  const chip = block('.dock .chip', narrow);
  assert.match(chip, /border-radius:\s*var\(--radius-pill\)/);
  assert.match(chip, /margin-inline-end:\s*auto/);
  assert.match(block('.dock-shop-icon', narrow), /color:\s*var\(--done\)/);
});

test('from 1024px the foot of the sidebar is a tonal chip below a line (DSV-25)', () => {
  const ds = readFileSync(new URL('../design-system/design-system.css', import.meta.url), 'utf8');
  assert.match(ds, /--sidebar-width:\s*256px;/);
  assert.match(ds, /\.nav-bar > \.nav-foot\.boxed:not\(\[hidden\]\) \{[^}]*background:\s*var\(--secondary\)/);
  assert.match(ds, /\.nav-bar > \.nav-foot\.boxed:not\(\[hidden\]\)::before \{[^}]*border-top:\s*1px solid var\(--line\)/);
});

test('an empty count of the sidebar takes no room (NAV-26)', () => {
  assert.match(readFileSync(new URL('../design-system/design-system.css', import.meta.url), 'utf8'), /\.nav-count:empty \{\s*display:\s*none;/);
});

test('below 600px a row of Compra is 48px with a 24px tick and a 16px name, and 60px from 600px (DSV-33)', () => {
  const body = '.item-row-body:has(> .item-row-check)';
  const name = '.item-row-body:has(> .item-row-check) > .item-row-name';
  assert.match(css.slice(0, tokensEnd), /--tick:\s*24px/);
  assert.match(block(':root', from600), /--tick:\s*32px/);
  assert.match(block('.item-row-check', narrow), /margin-block:\s*var\(--space-3\)/);
  assert.match(block(body, narrow), /min-height:\s*var\(--tap\)/);
  assert.match(block(name, narrow), /font-size:\s*var\(--text-m\)/);
  assert.match(block(body, from600), /min-height:\s*var\(--tap-l\)/);
  assert.match(block(name, from600), /font-size:\s*var\(--text-row\)/);
});

test('below 600px the rows of Compra run from edge to edge, and the cards of Recetas keep their gutter (DSV-13, DSV-33)', () => {
  assert.match(css.slice(0, tokensEnd), /--row-edge:\s*0px/);
  assert.match(css.slice(0, tokensEnd), /--row-corner:\s*0px/);
  assert.match(block(':root', from600), /--row-edge:\s*1px/);
  assert.match(block(':root', from600), /--row-corner:\s*var\(--radius-l\)/);
  assert.match(block('.item-list > .item-row'), /padding-inline:\s*var\(--row-edge\)/);
  const recipes = block('.item-list:has(> .item-row.recipe)', narrow);
  assert.match(recipes, /--row-edge:\s*1px/);
  assert.match(recipes, /margin-inline:\s*var\(--space-4\)/);
  assert.doesNotMatch(narrow, /\.item-list:not\(:has\(> \.item-row\.recipe\)\):has\(> \.item-row\) \{[^}]*margin-inline/);
});

test('below 600px the mark of a recurrent item is ↻ after the name, and its meta line goes (DSV-33)', () => {
  const mark = '.item-row-name:where(:has(> .item-row-meta.repeat-only)) > .item-row-title > .item-row-repeat';
  assert.match(block('.item-row-meta.repeat-only', narrow), /display:\s*none/);
  assert.match(block(mark, narrow), /display:\s*inline/);
  assert.match(block(`${mark}::before`, narrow), /content:\s*"↻" \/ ""/);
  assert.match(block('.item-row-meta.repeat-only', from600), /display:\s*block/);
  assert.match(block(mark, from600), /display:\s*none/);
  assert.match(block('.item-row-name > .item-row-title > .item-row-repeat::before', from600), /content:\s*none/);
});
