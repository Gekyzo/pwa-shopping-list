import * as store from './store.js';
import { load, save, exportJson, importJson } from './storage.js';

const UNDO_MS = 5000;
const MESSAGE_MS = 3000;

const $ = (id) => document.getElementById(id);

const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();

let state = storage ? load(storage) : store.emptyState();
const ui = { tab: 'active', editingId: null, openId: null, flashId: null };
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
  if (!saved) showToast('The change is not saved: storage is not available.');
  else if (undoText) showToast(undoText, { undo: previous });
  else hideToast();
  return true;
};

const iconButton = (text, label, pressed, onClick) => {
  const button = el('button', { type: 'button', className: 'icon', textContent: text, onclick: onClick });
  button.setAttribute('aria-label', label);
  if (pressed !== null) button.setAttribute('aria-pressed', String(pressed));
  return button;
};

const renameInput = (item) => {
  const input = el('input', { type: 'text', className: 'rename', value: item.name, maxLength: 80 });
  input.setAttribute('aria-label', `Rename ${item.name}`);
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

const nameNode = (item) => {
  if (ui.editingId === item.id) return renameInput(item);
  return el('button', {
    type: 'button',
    className: 'name',
    textContent: item.name,
    title: 'Rename',
    onclick: () => {
      ui.editingId = item.id;
      render();
    },
  });
};

const recurrentButton = (item) =>
  iconButton('↻', `Recurrent: ${item.name}`, item.recurrent, () => apply(store.toggleRecurrent(state, item.id)));

const moreButton = (item) => {
  const button = iconButton('⋯', `More actions: ${item.name}`, null, () => {
    ui.openId = ui.openId === item.id ? null : item.id;
    render();
  });
  button.setAttribute('aria-expanded', String(ui.openId === item.id));
  return button;
};

const actionButton = (text, onClick, className = '') =>
  el('button', { type: 'button', textContent: text, className, onclick: onClick });

const deleteAction = (item) =>
  actionButton('Delete', () => apply(store.deleteItem(state, item.id), { undoText: `"${item.name}" deleted.` }), 'danger');

const activeRow = (item) => {
  const checkbox = el('input', {
    type: 'checkbox',
    checked: item.bought,
    onchange: () => apply(store.toggleBought(state, item.id)),
  });
  checkbox.setAttribute('aria-label', `Bought: ${item.name}`);
  const row = [checkbox, nameNode(item)];
  if (item.bought && !item.recurrent) {
    const again = el('button', {
      type: 'button',
      className: 'chip',
      textContent: item.again ? '✓ Next' : '+ Next',
      onclick: () => apply(store.toggleAgain(state, item.id)),
    });
    again.setAttribute('aria-pressed', String(item.again));
    again.setAttribute('aria-label', `Buy again next time: ${item.name}`);
    row.push(again);
  }
  row.push(recurrentButton(item), moreButton(item));
  const actions = [
    actionButton('Move to Next', () => apply(store.moveItem(state, item.id), { undoText: `"${item.name}" moved to Next.` })),
    deleteAction(item),
  ];
  return { row, actions };
};

const nextRow = (item) => {
  const pending = item.list === 'next';
  const row = [nameNode(item)];
  if (!pending) row.push(el('span', { className: 'badge', textContent: 'bought' }));
  row.push(recurrentButton(item), moreButton(item));
  const actions = pending
    ? [
        actionButton('Move to Active', () =>
          apply(store.moveItem(state, item.id), { undoText: `"${item.name}" moved to Active.` })),
        deleteAction(item),
      ]
    : [
        actionButton('Remove from Next', () =>
          apply(store.removeFromNext(state, item.id), { undoText: `"${item.name}" removed from Next.` })),
      ];
  return { row, actions };
};

const itemNode = (item) => {
  const { row, actions } = ui.tab === 'active' ? activeRow(item) : nextRow(item);
  const classes = ['item', item.bought && ui.tab === 'active' && 'bought', ui.flashId === item.id && 'flash'];
  const node = el('li', { className: classes.filter(Boolean).join(' ') }, [el('div', { className: 'row' }, row)]);
  if (ui.openId === item.id) node.append(el('div', { className: 'actions' }, actions));
  return node;
};

const EMPTY_TEXT = {
  active: 'The Active list is empty. Add an item below.',
  next: 'The Next list is empty. Add the items that you buy each time, or tick a recurrent item in Active.',
};

const render = () => {
  const active = store.activeItems(state);
  const next = store.nextItems(state);
  const items = ui.tab === 'active' ? active : next;

  $('items').replaceChildren(...items.map(itemNode));
  $('empty').hidden = items.length > 0;
  $('empty').textContent = EMPTY_TEXT[ui.tab];

  const counts = { active: active.filter((item) => !item.bought).length, next: next.length };
  document.querySelectorAll('.tabs button').forEach((tab) => {
    tab.setAttribute('aria-selected', String(tab.dataset.tab === ui.tab));
    tab.querySelector('.count').textContent = counts[tab.dataset.tab] || '';
  });

  $('start').disabled = !store.canStartNewShopping(state);
  $('items').querySelector('.rename')?.focus();
  $('items').querySelector('.flash')?.scrollIntoView({ block: 'nearest' });
  ui.flashId = null;
  renderSuggestions();
};

const LIST_LABELS = { active: 'Active', next: 'Next' };

const whereText = (item) => {
  if (item.list === 'next') return 'in Next';
  return item.bought ? 'in Active, bought' : 'in Active';
};

const renderSuggestions = () => {
  const matches = store.searchItems(state, $('add-name').value);
  $('suggestions').hidden = matches.length === 0;
  $('suggestions').replaceChildren(
    ...matches.map((item) =>
      el('li', {}, [
        el('button', { type: 'button', onclick: () => useExisting(item) }, [
          el('span', { className: 'suggestion-name', textContent: item.name }),
          el('span', { className: 'suggestion-where', textContent: whereText(item) }),
        ]),
      ])),
  );
};

// Puts an item that exists already into the open list, in place of a duplicate.
const useExisting = (item) => {
  const result = store.bringToList(state, item.id, ui.tab);
  const label = LIST_LABELS[ui.tab];
  $('add-name').value = '';
  ui.flashId = item.id;
  if (result.changed) apply(result, { undoText: `"${item.name}" exists already. It is now in ${label}.` });
  else {
    render();
    showToast(result.error ?? `"${item.name}" is already in ${label}.`);
  }
};

const download = (filename, text) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  el('a', { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

document.querySelectorAll('.tabs button').forEach((tab) => {
  tab.addEventListener('click', () => {
    Object.assign(ui, { tab: tab.dataset.tab, editingId: null, openId: null });
    render();
  });
});

$('add').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = $('add-name');
  const existing = store.findByName(state, input.value);
  if (existing) useExisting(existing);
  else if (apply(store.addItem(state, input.value, ui.tab))) {
    input.value = '';
    renderSuggestions();
  }
  input.focus();
});

$('add-name').addEventListener('input', renderSuggestions);

$('start').addEventListener('click', () => {
  if (!apply(store.startNewShopping(state), { undoText: 'New shopping started.' })) return;
  Object.assign(ui, { tab: 'active', editingId: null, openId: null });
  render();
});

$('toast-undo').addEventListener('click', () => {
  if (!undoState) return;
  commit(undoState);
  hideToast();
});

$('export').addEventListener('click', () => {
  $('menu').open = false;
  download(`shopping-${new Date().toISOString().slice(0, 10)}.json`, exportJson(state));
});

$('import').addEventListener('click', () => {
  $('menu').open = false;
  $('import-file').click();
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
  const count = result.state.items.length;
  if (!window.confirm(`Replace the current lists with the ${count} items of the backup?`)) return;
  apply(result, { undoText: 'Backup imported.' });
});

document.addEventListener('click', (event) => {
  if (!$('menu').contains(event.target)) $('menu').open = false;
});

render();
if (!storage) showToast('Storage is not available: changes are not saved.');
navigator.storage?.persist?.().catch(() => {});
navigator.serviceWorker?.register('./sw.js').catch(() => {});
