import * as store from './store.js';
import * as recipes from './recipes.js';
import { settle } from './swipe.js';
import { load, save, exportJson, importJson } from './storage.js';
import { parseVersion, versionStatus } from './version.js';

const UNDO_MS = 5000;
const MESSAGE_MS = 3000;
// The app opens by itself at an arrival, so its message stays longer.
const ARRIVAL_MS = 10000;
// Width of one button of a side menu of a row, the same as in styles.css.
const SIDE_BUTTON = 64;
const DRAG_START = 10;
const CLICK_GUARD_MS = 350;
// The wait for the service worker to load the new deploy.
const REFRESH_MS = 15000;
// The wait for the deployed version: a weak network can leave the request open.
const CHECK_MS = 8000;
const LIST_LABELS = { active: 'Actual', next: 'Próxima' };

const $ = (id) => document.getElementById(id);

const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();

let state = storage ? load(storage) : store.emptyState();
// `view` is the screen of the bottom menu; `target` is the list that the add sheet writes to.
const ui = {
  view: 'active',
  editingId: null,
  openId: null,
  flashId: null,
  sheetOpen: false,
  target: 'active',
  boughtOpen: false,
  openRecipeId: null,
  // The text of the search field of Recetas. It is not stored.
  recipeQuery: '',
  // The group of Actual where the row actions are open: a recipe id, or null out of a group.
  openGroup: null,
  // The side menu of the open item row: 'start' (slide right), 'end' (slide left) or null.
  openSide: null,
  // Where the last drag left its row, so that the next render moves the row from there.
  settleFrom: null,
  focusProduct: false,
  // `running` is the version of the cached shell; `latest` is the deployed one, read when Ajustes opens.
  version: { running: null, latest: null, checking: false },
};
let toastTimer = null;
let undoState = null;

const showToast = (text, { undo = null, ms = undo ? UNDO_MS : MESSAGE_MS } = {}) => {
  clearTimeout(toastTimer);
  undoState = undo;
  $('toast-text').textContent = text;
  $('toast-undo').hidden = !undo;
  $('toast').hidden = false;
  toastTimer = setTimeout(hideToast, ms);
};

const hideToast = () => {
  clearTimeout(toastTimer);
  undoState = null;
  $('toast').hidden = true;
};

const commit = (next) => {
  state = next;
  const saved = storage !== null && save(storage, state);
  render();
  return saved;
};

// Applies a store operation. `undoText` makes the change reversible for a few seconds.
const apply = (result, { undoText = null } = {}) => {
  if (result.error) {
    showToast(result.error);
    return false;
  }
  const previous = state;
  const saved = commit(result.state);
  if (!saved) showToast('El cambio no se ha guardado: el almacenamiento no está disponible.');
  else if (undoText) showToast(undoText, { undo: previous });
  else hideToast();
  return true;
};

const finishTrip = (undoText = 'Compra terminada.') => {
  if (!apply(store.startNewShopping(state), { undoText })) return;
  Object.assign(ui, { view: 'active', editingId: null, openId: null });
  render();
};

// Rows

const renameInput = (entry, rename = (name) => store.renameItem(state, entry.id, name)) => {
  const input = el('input', { type: 'text', className: 'rename', value: entry.name, maxLength: 80 });
  input.setAttribute('aria-label', `Renombrar ${entry.name}`);
  let done = false;
  const finish = (keep) => {
    if (done) return;
    done = true;
    ui.editingId = null;
    const changed = keep && input.value.trim() !== entry.name;
    if (!changed || !apply(rename(input.value))) render();
  };
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') finish(true);
    if (event.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
  return input;
};

// An item of two recipes shows in two groups: `groupId` tells its copies apart.
const isOpen = (id, groupId) => ui.openId === id && ui.openGroup === groupId;
const isEditing = (id, groupId) => ui.editingId === id && ui.openGroup === groupId;

const moreButton = (item, groupId = null) => {
  const open = isOpen(item.id, groupId);
  const button = el('button', {
    type: 'button',
    className: 'more',
    textContent: '⋯',
    onclick: () => {
      Object.assign(ui, { openId: open ? null : item.id, openGroup: groupId, openSide: null });
      render();
    },
  });
  button.setAttribute('aria-label', `Más acciones: ${item.name}`);
  button.setAttribute('aria-expanded', String(open));
  return button;
};

const actionButton = (text, onClick, className = '') =>
  el('button', { type: 'button', textContent: text, className, onclick: onClick });

const SVG_NS = 'http://www.w3.org/2000/svg';

// A line icon, drawn as the icons of the bottom menu are.
const icon = (d) => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  svg.append(path);
  return svg;
};

const ICONS = {
  chain:
    'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  cart: 'M2 3h3l2.5 12h11L21 7H6M9 18.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3M18 18.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4',
  pencil: 'M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z',
  repeat: 'M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
  trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6',
};
// The cart with a plus in its basket and a calendar with a cross.
ICONS.cartPlus = `${ICONS.cart}M13 8.5v4M11 10.5h4`;
ICONS.calendarOff = `${ICONS.calendar}M10 13.5l4 4M14 13.5l-4 4`;

// A button of a side menu: an icon, with the name of the action for a screen reader.
const iconButton = (d, label, onClick, className = '') => {
  const button = el('button', { type: 'button', className, title: label, onclick: onClick }, [icon(d)]);
  button.setAttribute('aria-label', label);
  return button;
};

const startRename = (entry) => {
  Object.assign(ui, { editingId: entry.id, openId: null });
  render();
};

const renameAction = (item) => iconButton(ICONS.pencil, `Renombrar ${item.name}`, () => startRename(item));

// The recurrent mark of a row. It shows on each item and a tap changes it.
const recurrentToggle = (item) => {
  const button = el('button', { type: 'button', className: 'recur', onclick: () => apply(store.toggleRecurrent(state, item.id)) }, [
    icon(ICONS.repeat),
  ]);
  button.setAttribute('aria-pressed', String(item.recurrent));
  button.setAttribute('aria-label', `Comprar siempre: ${item.name}`);
  return button;
};

const moveAction = (item) => {
  const toNext = item.list === 'active';
  const label = LIST_LABELS[toNext ? 'next' : 'active'];
  return iconButton(toNext ? ICONS.calendar : ICONS.cart, `Mover a ${label}: ${item.name}`, () =>
    apply(store.moveItem(state, item.id), { undoText: `"${item.name}" movido a ${label}.` }));
};

const deleteAction = (item) =>
  iconButton(
    ICONS.trash,
    `Eliminar ${item.name}`,
    () => apply(store.deleteItem(state, item.id), { undoText: `"${item.name}" eliminado.` }),
    'danger',
  );

const activeRow = (item, groupId) => {
  // A ticked item goes into the collapsed section, so a wrong tap needs an undo.
  const toggle = () =>
    apply(store.toggleBought(state, item.id), item.bought ? {} : { undoText: `"${item.name}" comprado.` });
  const checkbox = el('input', { type: 'checkbox', checked: item.bought, onchange: toggle });
  checkbox.setAttribute('aria-label', `Comprado: ${item.name}`);
  const name = isEditing(item.id, groupId)
    ? renameInput(item)
    : el('button', { type: 'button', className: 'name', textContent: item.name, tabIndex: -1, onclick: toggle });
  const row = [checkbox, name];
  if (item.bought && !item.recurrent) {
    const again = el('button', {
      type: 'button',
      className: item.again ? 'pill' : 'pill ghost',
      textContent: item.again ? '✓ Próxima' : '+ Próxima',
      onclick: () => apply(store.toggleAgain(state, item.id)),
    });
    again.setAttribute('aria-pressed', String(item.again));
    again.setAttribute('aria-label', `Comprar otra vez la próxima: ${item.name}`);
    row.push(again);
  }
  row.push(recurrentToggle(item));
  return { row, start: [renameAction(item)], end: [moveAction(item), deleteAction(item)] };
};

const nextRow = (item) => {
  const pending = item.list === 'next';
  const name =
    ui.editingId === item.id ? renameInput(item) : el('span', { className: 'name', textContent: item.name });
  const row = [name];
  if (!pending) row.push(el('span', { className: 'pill', textContent: 'comprado hoy' }));
  row.push(recurrentToggle(item));
  if (pending) return { row, start: [renameAction(item)], end: [moveAction(item), deleteAction(item)] };
  const remove = iconButton(ICONS.calendarOff, `Quitar de Próxima: ${item.name}`, () =>
    apply(store.removeFromNext(state, item.id), { undoText: `"${item.name}" quitado de Próxima.` }));
  return { row, start: [renameAction(item)], end: [remove] };
};

const shift = (side, widths) => (side === 'start' ? widths.start : side === 'end' ? -widths.end : 0);

const moveRow = (row, x) => {
  row.style.transform = x ? `translateX(${x}px)` : '';
};

let clickGuardUntil = 0;

// Lets a horizontal drag of the row show the side menu behind it. `settle` decides the result.
const bindSwipe = (row, widths, item, groupId) => {
  let drag = null;
  row.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || ui.editingId === item.id) return;
    const base = shift(isOpen(item.id, groupId) ? ui.openSide : null, widths);
    drag = { x: event.clientX, y: event.clientY, base, active: false };
  });
  row.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dy) > DRAG_START && Math.abs(dy) >= Math.abs(dx)) drag = null;
      if (!drag || Math.abs(dx) < DRAG_START) return;
      drag.active = true;
      row.setPointerCapture(event.pointerId);
      row.classList.add('dragging');
    }
    drag.at = Math.max(-widths.end, Math.min(widths.start, drag.base + dx));
    moveRow(row, drag.at);
  });
  const finish = (event) => {
    if (!drag) return;
    const { active, x, at } = drag;
    drag = null;
    if (!active) return;
    // The click that follows a drag must not tick the item.
    clickGuardUntil = Date.now() + CLICK_GUARD_MS;
    const open = isOpen(item.id, groupId) ? ui.openSide : null;
    const side = settle(event.clientX - x, widths, open);
    Object.assign(ui, { openId: side ? item.id : null, openSide: side, openGroup: groupId, editingId: null });
    ui.settleFrom = { id: item.id, groupId, x: at };
    render();
  };
  row.addEventListener('pointerup', finish);
  row.addEventListener('pointercancel', finish);
};

// A side action closes the row, then runs.
const closing = (button) => {
  const run = button.onclick;
  button.onclick = () => {
    ui.openId = null;
    run();
  };
  return button;
};

const itemNode = (item, groupId = null) => {
  const { row, start, end } = ui.view === 'active' ? activeRow(item, groupId) : nextRow(item);
  const open = isOpen(item.id, groupId) ? ui.openSide : null;
  const widths = { start: start.length * SIDE_BUTTON, end: end.length * SIDE_BUTTON };
  const rowNode = el('div', { className: 'row' }, row);
  const sides = ['start', 'end'].map((side) =>
    el('div', { className: `side ${side}`, inert: open !== side }, (side === 'start' ? start : end).map(closing)));
  const from = ui.settleFrom;
  if (from && from.id === item.id && from.groupId === groupId) {
    // Start where the drag ended, then move to the settled place with the CSS transition.
    moveRow(rowNode, from.x);
    requestAnimationFrame(() => requestAnimationFrame(() => moveRow(rowNode, shift(open, widths))));
  } else moveRow(rowNode, shift(open, widths));
  bindSwipe(rowNode, widths, item, groupId);
  const classes = ['item', item.bought && ui.view === 'active' && 'bought', ui.flashId === item.id && 'flash'];
  return el('li', { className: classes.filter(Boolean).join(' ') }, [
    el('div', { className: open ? 'swipe open' : 'swipe' }, [...sides, rowNode]),
  ]);
};

// The ticked items of Actual, behind one row that opens and closes them.
const boughtSection = (bought) => {
  const button = el('button', {
    type: 'button',
    onclick: () => {
      ui.boughtOpen = !ui.boughtOpen;
      render();
    },
  }, [
    el('span', { textContent: `${plural(bought.length, 'comprado', 'comprados')}` }),
    el('span', { className: 'chevron', textContent: ui.boughtOpen ? '▾' : '▸' }),
  ]);
  button.setAttribute('aria-expanded', String(ui.boughtOpen));
  return [el('li', { className: 'section' }, [button]), ...(ui.boughtOpen ? bought.map((item) => itemNode(item)) : [])];
};

const groupHead = (title, count) =>
  el('li', { className: 'group-head' }, [el('span', { textContent: title }), el('span', { textContent: count })]);

// The items of Actual still to buy, below the recipe that asks for each one.
// The choice between Actual by recipe and Actual as one list. It keeps the toast, and so the undo.
const groupToggle = () => {
  const option = (text, grouped) => {
    const button = actionButton(text, () => commit(recipes.setGrouped(state, grouped).state));
    button.setAttribute('aria-pressed', String(state.grouped === grouped));
    return button;
  };
  return el('li', { className: 'groupby' }, [
    el('span', { textContent: 'Agrupar por' }),
    el('div', {}, [option('Recetas', true), option('Nada', false)]),
  ]);
};

// The choice of the order of Actual and Próxima. As the group choice, it keeps the toast.
const sortToggle = () => {
  const option = (text, sort) => {
    const button = actionButton(text, () => commit(store.setSort(state, sort).state));
    button.setAttribute('aria-pressed', String(state.sort === sort));
    return button;
  };
  return el('li', { className: 'groupby' }, [
    el('span', { textContent: 'Ordenar por' }),
    el('div', {}, [option('Añadido', 'added'), option('Nombre', 'name')]),
  ]);
};

// `sort` holds the sort choice row, or nothing for a list too short to sort.
const pendingNodes = (sort) => {
  const { groups, rest } = recipes.recipeGroups(state);
  if (!groups.length) return [...sort, ...rest.map((item) => itemNode(item))];
  if (!state.grouped) {
    const pending = store.activeItems(state).filter((item) => !item.bought);
    return [groupToggle(), ...sort, ...pending.map((item) => itemNode(item))];
  }
  const grouped = groups.flatMap(({ recipe, items, total }) => [
    groupHead(recipe.name, items.length ? `${total - items.length}/${total}` : '✓'),
    ...items.map((item) => itemNode(item, recipe.id)),
  ]);
  const others = rest.length ? [groupHead('Otros', ''), ...rest.map((item) => itemNode(item))] : [];
  return [groupToggle(), ...sort, ...grouped, ...others];
};

const listNodes = (items) => {
  const sort = items.length > 1 ? [sortToggle()] : [];
  if (ui.view !== 'active') return [...sort, ...items.map((item) => itemNode(item))];
  const bought = items.filter((item) => item.bought);
  return bought.length ? [...pendingNodes(sort), ...boughtSection(bought)] : pendingNodes(sort);
};

// Recipes

const sendText = ({ added, already }) => {
  const parts = [];
  if (added) parts.push(plural(added, 'añadido', 'añadidos'));
  if (already) parts.push(`${already} ya ${already === 1 ? 'estaba' : 'estaban'}`);
  return parts.join(', ');
};

const sendToList = (recipe) => {
  const result = recipes.sendRecipe(state, recipe.id);
  if (result.error || result.state !== state) apply(result, { undoText: `«${recipe.name}»: ${sendText(result)}.` });
  // A second tap changes nothing: keep the undo of the send that is still on the screen.
  else showToast(`«${recipe.name}»: todo estaba ya en la lista.`, { undo: undoState });
};

const productNode = (recipe, product) => {
  const remove = el('button', {
    type: 'button',
    className: 'more',
    textContent: '✕',
    onclick: () =>
      apply(recipes.removeRecipeProduct(state, recipe.id, product), { undoText: `"${product}" quitado de «${recipe.name}».` }),
  });
  remove.setAttribute('aria-label', `Quitar ${product}`);
  return el('li', {}, [el('span', { textContent: product }), remove]);
};

// The product field with the items that match the text below it. A tap on one adds it.
const productForm = (recipe) => {
  const input = el('input', {
    type: 'text',
    className: 'product-name',
    maxLength: 80,
    placeholder: 'Añadir producto',
    enterKeyHint: 'done',
  });
  input.setAttribute('autocapitalize', 'sentences');
  input.setAttribute('aria-label', `Añadir producto a ${recipe.name}`);
  const add = (name) => {
    // The render builds a new field; `focusProduct` keeps the keyboard open for the next product.
    ui.focusProduct = true;
    if (apply(recipes.addRecipeProduct(state, recipe.id, name))) return;
    ui.focusProduct = false;
    input.focus();
  };
  const suggestions = el('ul', { className: 'suggestions' });
  suggestions.setAttribute('aria-label', 'Artículos que ya existen');
  const taken = new Set(recipe.products.map((product) => product.toLowerCase()));
  input.addEventListener('input', () => {
    const rows = store
      .searchItems(state, input.value, Infinity)
      .filter((item) => !taken.has(item.name.toLowerCase()))
      .slice(0, 5)
      .map((item) => el('li', {}, [el('button', { type: 'button', textContent: item.name, onclick: () => add(item.name) })]));
    suggestions.replaceChildren(...rows);
  });
  const form = el('form', { className: 'product-form', autocomplete: 'off' }, [
    input,
    el('button', { type: 'submit', className: 'primary', textContent: 'Añadir' }),
  ]);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    add(input.value);
  });
  return el('div', { className: 'product-add' }, [form, suggestions]);
};

const editLink = (recipe) => {
  const text = window.prompt(`Enlace de «${recipe.name}». Déjalo vacío para quitarlo.`, recipe.url);
  if (text === null) return;
  ui.openId = null;
  if (text.trim() === recipe.url) render();
  else apply(recipes.setRecipeUrl(state, recipe.id, text), { undoText: text.trim() ? 'Enlace guardado.' : 'Enlace quitado.' });
};

const linkNode = (recipe) => {
  const link = el('a', { className: 'recipe-link', href: recipe.url, target: '_blank', rel: 'noopener noreferrer' }, [
    icon(ICONS.chain),
  ]);
  link.setAttribute('aria-label', `Abrir el enlace de ${recipe.name}`);
  return link;
};

const recipeNode = (recipe) => {
  const open = ui.openRecipeId === recipe.id;
  let name;
  if (ui.editingId === recipe.id) name = renameInput(recipe, (value) => recipes.renameRecipe(state, recipe.id, value));
  else {
    name = el(
      'button',
      {
        type: 'button',
        className: 'name',
        onclick: () => {
          Object.assign(ui, { openRecipeId: open ? null : recipe.id, openId: null });
          render();
        },
      },
      [
        el('span', { textContent: recipe.name }),
        el('small', { textContent: plural(recipe.products.length, 'producto', 'productos') }),
      ],
    );
    name.setAttribute('aria-expanded', String(open));
  }
  const send = el('button', { type: 'button', className: 'send', onclick: () => sendToList(recipe) }, [icon(ICONS.cartPlus)]);
  send.setAttribute('aria-label', `Enviar a la lista: ${recipe.name}`);
  const row = recipe.url ? [name, linkNode(recipe), send, moreButton(recipe)] : [name, send, moreButton(recipe)];
  const node = el('li', { className: 'item recipe' }, [el('div', { className: 'row' }, row)]);
  if (ui.openId === recipe.id) {
    const remove = actionButton(
      'Eliminar',
      () => apply(recipes.deleteRecipe(state, recipe.id), { undoText: `Receta «${recipe.name}» eliminada.` }),
      'danger',
    );
    const link = actionButton(recipe.url ? 'Cambiar enlace' : 'Añadir enlace', () => editLink(recipe));
    node.append(el('div', { className: 'actions' }, [actionButton('Renombrar', () => startRename(recipe)), link, remove]));
  }
  if (open) {
    node.append(
      el('ul', { className: 'products' }, recipe.products.map((product) => productNode(recipe, product))),
      productForm(recipe),
    );
  }
  return node;
};

// Screen

const finishText = ({ back, gone }) => {
  const backText = `${plural(back, 'artículo vuelve', 'artículos vuelven')} en la próxima compra.`;
  const goneText = `${plural(gone, 'se elimina', 'se eliminan')}.`;
  return `${backText} ${goneText}`;
};

const activeSubtitle = ({ total, left }) => {
  if (!total) return 'La lista está vacía';
  if (!left) return 'Todo comprado';
  return `${left === 1 ? 'Queda' : 'Quedan'} ${plural(left, 'artículo', 'artículos')}`;
};

const headerOf = (summary, next) => {
  if (ui.view === 'settings') return { title: 'Ajustes', subtitle: 'Lista de la compra', ring: '⚙', pct: 0 };
  if (ui.view === 'recipes') {
    const count = state.recipes.length;
    const subtitle = count ? plural(count, 'receta', 'recetas') : 'Sin recetas';
    return { title: 'Recetas', subtitle, ring: String(count), pct: 0 };
  }
  if (ui.view === 'next') {
    const boughtToday = next.length - summary.incoming;
    const parts = [next.length ? plural(next.length, 'artículo', 'artículos') : 'Nada preparado'];
    if (boughtToday) parts.push(plural(boughtToday, 'comprado hoy', 'comprados hoy'));
    return { title: 'Próxima compra', subtitle: parts.join(' · '), ring: String(next.length), pct: 0 };
  }
  const { total, left } = summary;
  const pct = total ? Math.round(((total - left) / total) * 100) : 0;
  return { title: 'Compra de hoy', subtitle: activeSubtitle(summary), ring: `${total - left}/${total}`, pct };
};

const EMPTY_TEXT = {
  active: 'La lista está vacía. Toca + para añadir un artículo.',
  next: 'No hay nada para la próxima compra. Toca + para añadir lo que compras siempre.',
  recipes: 'No hay recetas. Toca + para crear una.',
};

const nodesOf = (items) => {
  if (ui.view === 'settings') return [];
  return ui.view === 'recipes' ? recipes.searchRecipes(state, ui.recipeQuery).map(recipeNode) : listNodes(items);
};

const renderList = (summary, next) => {
  const items = ui.view === 'active' ? store.activeItems(state) : next;
  const searchable = ui.view === 'recipes' && state.recipes.length > 0;
  if (!searchable) ui.recipeQuery = '';
  $('recipe-search').hidden = !searchable;
  // The field is not built again by a render, so it keeps the cursor. Write it only after a reset.
  if ($('recipe-query').value !== ui.recipeQuery) $('recipe-query').value = ui.recipeQuery;
  const nodes = nodesOf(items);
  $('items').hidden = ui.view === 'settings';
  $('items').replaceChildren(...nodes);
  if (ui.view === 'next' && items.length) {
    $('items').append(el('p', { className: 'hint', textContent: 'Un artículo con ↻ activo vuelve aquí al comprarlo.' }));
  }

  $('empty').hidden = ui.view === 'settings' || nodes.length > 0;
  $('empty-text').textContent = searchable ? `Ninguna receta coincide con «${ui.recipeQuery.trim()}».` : (EMPTY_TEXT[ui.view] ?? '');
  $('bring').hidden = !(ui.view === 'active' && summary.incoming > 0);
  $('bring').textContent = `Traer ${plural(summary.incoming, 'artículo', 'artículos')} de Próxima`;

  $('finish').hidden = !(ui.view === 'active' && summary.total > 0 && summary.left === 0);
  $('finish-text').textContent = finishText(summary);
};

const VERSION_STATUS = {
  current: 'Al día',
  unknown: 'Sin conexión',
};

const renderVersion = () => {
  const { running, latest, checking } = ui.version;
  const status = versionStatus(running, latest);
  const date = running && new Date(running.date).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  $('version').textContent = running ? `Versión ${running.version} · ${date}` : 'Versión desconocida';
  $('version-status').textContent = checking
    ? 'Comprobando…'
    : status === 'outdated' ? `Versión ${latest.version} disponible` : VERSION_STATUS[status];
  $('update').hidden = checking || status !== 'outdated';
};

const readVersion = async (url, options) => {
  try {
    const response = await fetch(url, options);
    return response.ok ? parseVersion(await response.json()) : null;
  } catch {
    return null;
  }
};

// The time value in the URL goes past the cache of the host; the service worker lets `latest` through.
const checkVersion = async () => {
  ui.version.checking = true;
  renderVersion();
  const latest = await readVersion(`./version.json?latest=${Date.now()}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(CHECK_MS),
  });
  Object.assign(ui.version, { latest, checking: false });
  renderVersion();
};

// Asks the service worker to load the shell of the new deploy. Resolves to false when it cannot.
const refreshShell = () =>
  new Promise((resolve) => {
    const worker = navigator.serviceWorker?.controller;
    if (!worker) {
      resolve(true);
      return;
    }
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(false), REFRESH_MS);
    channel.port1.onmessage = (event) => {
      clearTimeout(timer);
      resolve(Boolean(event.data?.ok));
    };
    worker.postMessage({ type: 'refresh' }, [channel.port2]);
  });

const render = () => {
  const summary = store.tripSummary(state);
  const next = store.nextItems(state);
  const header = headerOf(summary, next);

  $('title').textContent = header.title;
  $('subtitle').textContent = header.subtitle;
  $('ring-text').textContent = header.ring;
  $('ring').style.setProperty('--pct', `${header.pct}%`);

  renderList(summary, next);

  $('settings').hidden = ui.view !== 'settings';
  renderVersion();
  $('finish-setting').disabled = !store.canStartNewShopping(state);
  $('finish-setting-text').textContent = `${plural(summary.back, 'vuelve', 'vuelven')} · ${plural(summary.gone, 'se va', 'se van')}`;

  $('fab').hidden = ui.view === 'settings' || ui.sheetOpen;
  $('fab').setAttribute('aria-label', ui.view === 'recipes' ? 'Crear receta' : 'Añadir artículo');
  $('next-count').textContent = next.length || '';
  document.querySelectorAll('.bnav button').forEach((button) => {
    if (button.dataset.view === ui.view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  $('items').querySelector('.rename')?.focus();
  if (ui.focusProduct) $('items').querySelector('.product-name')?.focus();
  ui.focusProduct = false;
  $('items').querySelector('.flash')?.scrollIntoView({ block: 'nearest' });
  ui.flashId = null;
  ui.settleFrom = null;
  renderSheet();
};

// Add sheet

const whereText = (item) => {
  const inNextView = item.list === 'next' || (item.bought && (item.recurrent || item.again));
  if (ui.target === 'active') {
    if (item.list === 'next') return 'en Próxima · traer';
    return item.bought ? 'ya comprado · repetir' : 'ya en la lista';
  }
  if (inNextView) return 'ya en Próxima';
  return item.bought ? 'comprado · añadir a Próxima' : 'en Actual · mover';
};

const renderSheet = () => {
  $('sheet').hidden = !ui.sheetOpen;
  if (!ui.sheetOpen) return;
  const forRecipe = ui.view === 'recipes';
  const label = forRecipe ? 'Nombre de la receta' : 'Añadir artículo a la lista';
  $('seg').hidden = forRecipe;
  $('add-submit').textContent = forRecipe ? 'Crear' : 'Añadir';
  $('add-name').placeholder = label;
  $('add-name').setAttribute('aria-label', label);
  $('add').setAttribute('aria-label', forRecipe ? 'Crear receta' : 'Añadir artículo');
  if (forRecipe) {
    $('suggestions').replaceChildren();
    return;
  }
  document.querySelectorAll('.seg button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.target === ui.target));
  });
  const text = $('add-name').value.trim();
  const rows = store.searchItems(state, text).map((item) =>
    el('li', {}, [
      el('button', { type: 'button', onclick: () => useExisting(item) }, [
        el('span', { className: 'suggestion-name', textContent: item.name }),
        el('span', { className: 'suggestion-where', textContent: whereText(item) }),
      ]),
    ]));
  if (text && !store.findByName(state, text)) {
    rows.push(
      el('li', {}, [el('button', { type: 'button', className: 'create', textContent: `+ Crear «${text}»`, onclick: submitAdd })]),
    );
  }
  $('suggestions').replaceChildren(...rows);
};

const openSheet = () => {
  Object.assign(ui, { sheetOpen: true, target: ui.view === 'next' ? 'next' : 'active', openId: null, editingId: null });
  $('add-name').value = '';
  render();
  $('add-name').focus();
};

const closeSheet = () => {
  ui.sheetOpen = false;
  render();
};

// Puts an item that exists already into the target list, in place of a duplicate.
const useExisting = (item) => {
  const result = store.bringToList(state, item.id, ui.target);
  const label = LIST_LABELS[ui.target];
  $('add-name').value = '';
  if (ui.target === ui.view) ui.flashId = item.id;
  if (result.changed) apply(result, { undoText: `"${item.name}" ya existe. Ahora está en ${label}.` });
  else {
    render();
    showToast(result.error ?? `"${item.name}" ya está en ${label}.`);
  }
  $('add-name').focus();
};

const submitRecipe = () => {
  const input = $('add-name');
  const result = recipes.addRecipe(state, input.value);
  if (result.error) {
    showToast(result.error);
    input.focus();
    return;
  }
  // The new recipe shows expanded, with the cursor in its product field.
  Object.assign(ui, { sheetOpen: false, openRecipeId: result.id, focusProduct: true, recipeQuery: '' });
  apply(result);
};

const submitAdd = () => {
  if (ui.view === 'recipes') {
    submitRecipe();
    return;
  }
  const input = $('add-name');
  const existing = store.findByName(state, input.value);
  if (existing) {
    useExisting(existing);
    return;
  }
  const name = input.value.trim();
  if (apply(store.addItem(state, input.value, ui.target))) {
    input.value = '';
    renderSheet();
    showToast(`"${name}" añadido a ${LIST_LABELS[ui.target]}.`);
  }
  input.focus();
};

// Events

const download = (filename, text) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  el('a', { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

document.querySelectorAll('.bnav button').forEach((button) => {
  button.addEventListener('click', () => {
    Object.assign(ui, { view: button.dataset.view, editingId: null, openId: null, recipeQuery: '' });
    render();
    if (ui.view === 'settings') checkVersion();
  });
});

document.querySelectorAll('.seg button').forEach((button) => {
  button.addEventListener('click', () => {
    ui.target = button.dataset.target;
    renderSheet();
    $('add-name').focus();
  });
});

// A tap out of the open row closes it, without a render, so that the tap still does its work.
document.addEventListener(
  'pointerdown',
  (event) => {
    const box = document.querySelector('.swipe.open');
    if (!box || box.contains(event.target)) return;
    Object.assign(ui, { openId: null, openSide: null });
    box.classList.remove('open');
    moveRow(box.querySelector('.row'), 0);
    box.querySelectorAll('.side').forEach((side) => {
      side.inert = true;
    });
  },
  true,
);

document.addEventListener(
  'click',
  (event) => {
    if (Date.now() >= clickGuardUntil) return;
    event.preventDefault();
    event.stopPropagation();
  },
  true,
);

$('recipe-query').addEventListener('input', (event) => {
  Object.assign(ui, { recipeQuery: event.target.value, editingId: null, openId: null });
  render();
});

$('fab').addEventListener('click', openSheet);
$('veil').addEventListener('click', closeSheet);
$('add-name').addEventListener('input', renderSheet);
$('add').addEventListener('submit', (event) => {
  event.preventDefault();
  submitAdd();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && ui.sheetOpen) closeSheet();
});

$('finish-button').addEventListener('click', () => finishTrip());
$('finish-setting').addEventListener('click', () => finishTrip());
$('bring').addEventListener('click', () => finishTrip('Artículos traídos de Próxima.'));

$('toast-undo').addEventListener('click', () => {
  if (!undoState) return;
  commit(undoState);
  hideToast();
});

$('export').addEventListener('click', () => {
  download(`compra-${new Date().toISOString().slice(0, 10)}.json`, exportJson(state));
});

$('import').addEventListener('click', () => $('import-file').click());

$('update').addEventListener('click', async () => {
  $('update').disabled = true;
  if (await refreshShell()) {
    location.reload();
    return;
  }
  $('update').disabled = false;
  showToast('No se pudo actualizar.');
});

$('import-file').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  event.target.value = '';
  if (!file) return;
  const result = importJson(await file.text());
  if (result.error) {
    showToast(result.error);
    return;
  }
  const found = [
    plural(result.state.items.length, 'artículo', 'artículos'),
    plural(result.state.recipes.length, 'receta', 'recetas'),
  ].join(' y ');
  if (!window.confirm(`¿Sustituir los datos actuales por los de la copia (${found})?`)) return;
  apply(result, { undoText: 'Copia importada.' });
});

render();
// An automation of the phone opens `?arrival` at the shop. The query goes away, so a reload is silent.
const params = new URLSearchParams(location.search);
if (params.has('arrival')) {
  const message = store.arrivalMessage(state);
  if (message) showToast(message, { ms: ARRIVAL_MS });
  params.delete('arrival');
  const query = params.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
}
if (!storage) showToast('El almacenamiento no está disponible: los cambios no se guardan.');
navigator.storage?.persist?.().catch(() => {});
navigator.serviceWorker?.register('./sw.js').catch(() => {});
// Read once at the start: the worker answers from the cache, then stores the file of the next deploy.
readVersion('./version.json').then((running) => {
  ui.version.running = running;
  renderVersion();
});
