import * as store from './store.js';
import { load, save, exportJson, importJson } from './storage.js';

const UNDO_MS = 5000;
const MESSAGE_MS = 3000;
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
const ui = { view: 'active', editingId: null, openId: null, flashId: null, sheetOpen: false, target: 'active' };
let toastTimer = null;
let undoState = null;

const showToast = (text, { undo = null } = {}) => {
  clearTimeout(toastTimer);
  undoState = undo;
  $('toast-text').textContent = text;
  $('toast-undo').hidden = !undo;
  $('toast').hidden = false;
  toastTimer = setTimeout(hideToast, undo ? UNDO_MS : MESSAGE_MS);
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

const renameInput = (item) => {
  const input = el('input', { type: 'text', className: 'rename', value: item.name, maxLength: 80 });
  input.setAttribute('aria-label', `Renombrar ${item.name}`);
  let done = false;
  const finish = (keep) => {
    if (done) return;
    done = true;
    ui.editingId = null;
    const changed = keep && input.value.trim() !== item.name;
    if (!changed || !apply(store.renameItem(state, item.id, input.value))) render();
  };
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') finish(true);
    if (event.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
  return input;
};

const moreButton = (item) => {
  const button = el('button', {
    type: 'button',
    className: 'more',
    textContent: '⋯',
    onclick: () => {
      ui.openId = ui.openId === item.id ? null : item.id;
      render();
    },
  });
  button.setAttribute('aria-label', `Más acciones: ${item.name}`);
  button.setAttribute('aria-expanded', String(ui.openId === item.id));
  return button;
};

const actionButton = (text, onClick, className = '') =>
  el('button', { type: 'button', textContent: text, className, onclick: onClick });

const renameAction = (item) =>
  actionButton('Renombrar', () => {
    Object.assign(ui, { editingId: item.id, openId: null });
    render();
  });

const recurrentAction = (item) =>
  actionButton(item.recurrent ? 'Solo una vez' : 'Comprar siempre', () => apply(store.toggleRecurrent(state, item.id)));

const moveAction = (item) => {
  const label = LIST_LABELS[item.list === 'active' ? 'next' : 'active'];
  return actionButton(`A ${label}`, () =>
    apply(store.moveItem(state, item.id), { undoText: `"${item.name}" movido a ${label}.` }));
};

const deleteAction = (item) =>
  actionButton('Eliminar', () => apply(store.deleteItem(state, item.id), { undoText: `"${item.name}" eliminado.` }), 'danger');

const alwaysPill = () => el('span', { className: 'pill', textContent: '↻ siempre' });

const activeRow = (item) => {
  const toggle = () => apply(store.toggleBought(state, item.id));
  const checkbox = el('input', { type: 'checkbox', checked: item.bought, onchange: toggle });
  checkbox.setAttribute('aria-label', `Comprado: ${item.name}`);
  const name =
    ui.editingId === item.id
      ? renameInput(item)
      : el('button', { type: 'button', className: 'name', textContent: item.name, tabIndex: -1, onclick: toggle });
  const row = [checkbox, name];
  if (item.recurrent) row.push(alwaysPill());
  else if (item.bought) {
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
  row.push(moreButton(item));
  return { row, actions: [renameAction(item), recurrentAction(item), moveAction(item), deleteAction(item)] };
};

const nextRow = (item) => {
  const pending = item.list === 'next';
  const name =
    ui.editingId === item.id ? renameInput(item) : el('span', { className: 'name', textContent: item.name });
  const row = [name];
  if (!pending) row.push(el('span', { className: 'pill', textContent: 'comprado hoy' }));
  else if (item.recurrent) row.push(alwaysPill());
  row.push(moreButton(item));
  const actions = pending
    ? [renameAction(item), recurrentAction(item), moveAction(item), deleteAction(item)]
    : [
        renameAction(item),
        actionButton('Quitar de Próxima', () =>
          apply(store.removeFromNext(state, item.id), { undoText: `"${item.name}" quitado de Próxima.` })),
      ];
  return { row, actions };
};

const itemNode = (item) => {
  const { row, actions } = ui.view === 'active' ? activeRow(item) : nextRow(item);
  const classes = ['item', item.bought && ui.view === 'active' && 'bought', ui.flashId === item.id && 'flash'];
  const node = el('li', { className: classes.filter(Boolean).join(' ') }, [el('div', { className: 'row' }, row)]);
  if (ui.openId === item.id) node.append(el('div', { className: 'actions' }, actions));
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

const renderList = (summary, next) => {
  const isList = ui.view !== 'settings';
  const items = ui.view === 'active' ? store.activeItems(state) : next;
  $('items').hidden = !isList;
  $('items').replaceChildren(...(isList ? items.map(itemNode) : []));
  if (isList && ui.view === 'next' && items.length) {
    $('items').append(el('p', { className: 'hint', textContent: 'Lo que marques como «siempre» vuelve aquí al comprarlo.' }));
  }

  $('empty').hidden = !(isList && items.length === 0);
  $('empty-text').textContent =
    ui.view === 'active'
      ? 'La lista está vacía. Toca + para añadir un artículo.'
      : 'No hay nada para la próxima compra. Toca + para añadir lo que compras siempre.';
  $('bring').hidden = !(ui.view === 'active' && summary.incoming > 0);
  $('bring').textContent = `Traer ${plural(summary.incoming, 'artículo', 'artículos')} de Próxima`;

  $('finish').hidden = !(ui.view === 'active' && summary.total > 0 && summary.left === 0);
  $('finish-text').textContent = finishText(summary);
};

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
  $('finish-setting').disabled = !store.canStartNewShopping(state);
  $('finish-setting-text').textContent = `${plural(summary.back, 'vuelve', 'vuelven')} · ${plural(summary.gone, 'se va', 'se van')}`;

  $('fab').hidden = ui.view === 'settings' || ui.sheetOpen;
  $('next-count').textContent = next.length || '';
  document.querySelectorAll('.bnav button').forEach((button) => {
    if (button.dataset.view === ui.view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  $('items').querySelector('.rename')?.focus();
  $('items').querySelector('.flash')?.scrollIntoView({ block: 'nearest' });
  ui.flashId = null;
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

const submitAdd = () => {
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
    Object.assign(ui, { view: button.dataset.view, editingId: null, openId: null });
    render();
  });
});

document.querySelectorAll('.seg button').forEach((button) => {
  button.addEventListener('click', () => {
    ui.target = button.dataset.target;
    renderSheet();
    $('add-name').focus();
  });
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

$('import-file').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  event.target.value = '';
  if (!file) return;
  const result = importJson(await file.text());
  if (result.error) {
    showToast(result.error);
    return;
  }
  const count = result.state.items.length;
  if (!window.confirm(`¿Sustituir las listas actuales por los ${count} artículos de la copia?`)) return;
  apply(result, { undoText: 'Copia importada.' });
});

render();
if (!storage) showToast('El almacenamiento no está disponible: los cambios no se guardan.');
navigator.storage?.persist?.().catch(() => {});
navigator.serviceWorker?.register('./sw.js').catch(() => {});
