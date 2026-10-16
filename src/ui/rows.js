import * as store from '#store';
import { reached, settle } from '#swipe';
import { SIDE_BUTTON, DRAG_START, el, state, ui, t, say, isOn, apply, render, guardClick } from '#ui/context';
import { isOpen, searching, shownGroup } from '#ui/view';
import { leave } from '#ui/motion';
import { icon, iconButton } from '#ui/controls';
import { openEdit } from '#ui/edit';
import { reorder, bindReorder } from '#ui/drag';

// The name of a row, with its quantity after it and the shops of the item below it when the list
// is not by shop.
const nameParts = (item) => {
  const quantity = item.quantity ? [' ', el('span', { className: 'item-row-qty', textContent: item.quantity })] : [];
  const parts = [el('span', {}, [item.name, ...quantity])];
  if (item.shops.length && shownGroup() !== 'shop') parts.push(el('small', { className: 'item-row-meta', textContent: item.shops.join(' · ') }));
  return parts;
};

// The recurrent mark of a row. It shows on each item and a tap changes it.
const recurrentToggle = (item) => {
  const button = el('button', { type: 'button', className: 'button icon toggle', onclick: () => apply(store.toggleRecurrent(state, item.id)) }, [
    icon('repeat'),
  ]);
  button.setAttribute('aria-pressed', String(item.recurrent));
  button.setAttribute('aria-label', t('row.always', { name: item.name }));
  return button;
};

const moveAction = (item) => {
  const toNext = item.list === 'active';
  const params = { list: toNext ? 'next' : 'active', name: item.name };
  return iconButton(toNext ? 'calendar' : 'cart', say('row.moveTo', params), () =>
    apply(store.moveItem(state, item.id), { undoText: say('toast.movedTo', params) }));
};

const deleteAction = (item) =>
  iconButton(
    'trash',
    t('row.delete', { name: item.name }),
    () => apply(store.deleteItem(state, item.id), { undoText: t('toast.deleted', { name: item.name }) }),
    { variant: 'danger' },
  );

const activeRow = (item, groupId) => {
  const toggle = () => {
    if (item.bought) {
      apply(store.toggleBought(state, item.id));
      return;
    }
    checkbox.checked = true;
    // A ticked item goes into the collapsed section, so a wrong tap needs an undo.
    leave(item, () => apply(store.toggleBought(state, item.id), { undoText: t('toast.bought', { name: item.name }) }));
  };
  const checkbox = el('input', { type: 'checkbox', className: 'item-row-check', checked: item.bought, onchange: toggle });
  checkbox.setAttribute('aria-label', t('row.bought', { name: item.name }));
  const name = el('button', { type: 'button', className: 'item-row-name', tabIndex: -1, onclick: () => openEdit(item) }, nameParts(item));
  const row = [checkbox, name];
  if (item.bought && !item.recurrent && isOn('next')) {
    const again = el('button', {
      type: 'button',
      className: item.again ? 'pill' : 'pill ghost',
      textContent: `${item.again ? '✓' : '+'} ${t('list.next')}`,
      onclick: () => apply(store.toggleAgain(state, item.id)),
    });
    again.setAttribute('aria-pressed', String(item.again));
    again.setAttribute('aria-label', t('row.again', { name: item.name }));
    row.push(again);
  }
  row.push(recurrentToggle(item));
  const end = isOn('next') ? [moveAction(item), deleteAction(item)] : [deleteAction(item)];
  return { row, end, right: { run: toggle, icon: item.bought ? 'undo' : 'check' } };
};

const nextRow = (item, groupId) => {
  const pending = item.list === 'next';
  const name = el('button', { type: 'button', className: 'item-row-name', tabIndex: -1, onclick: () => openEdit(item) }, nameParts(item));
  const row = [name];
  if (!pending) row.push(el('span', { className: 'pill', textContent: t('row.boughtToday') }));
  row.push(recurrentToggle(item));
  if (pending) {
    const right = { run: () => moveAction(item).onclick(), icon: 'cart' };
    return { row, end: [moveAction(item), deleteAction(item)], right };
  }
  const params = { list: 'next', name: item.name };
  const remove = iconButton('calendar-off', say('row.removeFrom', params), () =>
    apply(store.removeFromNext(state, item.id), { undoText: say('toast.removedFrom', params) }));
  return { row, end: [remove], right: null };
};

const shift = (side, widths) => (side === 'start' ? widths.start : side === 'end' ? -widths.end : 0);

export const moveRow = (row, x) => {
  row.style.transform = x ? `translateX(${x}px)` : '';
};

// Lets a horizontal drag of the row show the side menu behind it, or run the action of the slide
// to the right. `settle` and `reached` decide the result. `id` is the id of an item or a recipe.
const bindSwipe = (row, widths, id, groupId, right) => {
  let drag = null;
  row.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const base = shift(isOpen(id, groupId) ? ui.openSide : null, widths);
    drag = { x: event.clientX, y: event.clientY, base, active: false };
  });
  row.addEventListener('pointermove', (event) => {
    if (!drag || reorder) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.active) {
      if (Math.abs(dy) > DRAG_START && Math.abs(dy) >= Math.abs(dx)) drag = null;
      if (!drag || Math.abs(dx) < DRAG_START) return;
      drag.active = true;
      row.setPointerCapture(event.pointerId);
      row.classList.add('dragging');
    }
    // From a closed row, a row with an action follows the finger to the right up to its width.
    const max = right && drag.base === 0 ? row.offsetWidth : 0;
    drag.at = Math.max(-widths.end, Math.min(max, drag.base + dx));
    moveRow(row, drag.at);
    row.parentNode.classList.toggle('armed', drag.at > 0 && reached(drag.at, row.offsetWidth));
  });
  const finish = (event) => {
    if (!drag) return;
    const { active, x, at, base } = drag;
    drag = null;
    if (!active) return;
    // The click that follows a drag must not tick the item.
    guardClick();
    row.parentNode.classList.remove('armed');
    if (right && base === 0 && reached(at, row.offsetWidth)) {
      Object.assign(ui, { openId: null, openSide: null });
      // The row slides back while the tick closes it (ROW-9), or before the render of a move.
      row.classList.remove('dragging');
      moveRow(row, 0);
      right.run();
      return;
    }
    const open = isOpen(id, groupId) ? ui.openSide : null;
    const side = settle(event.clientX - x, widths, open);
    Object.assign(ui, { openId: side ? id : null, openSide: side, openGroup: groupId });
    ui.settleFrom = { id, groupId, x: at };
    render();
  };
  row.addEventListener('pointerup', finish);
  row.addEventListener('pointercancel', finish);
};

// The rows that a row can move among: its group, or the rows to buy of a flat list.
// Null for a row that does not move.
const scopeOf = (item, groupId) => {
  if (ui.view === 'next') return item.list === 'next' ? groupId ?? 'next' : null;
  return item.bought ? null : groupId ?? 'rest';
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

// The box of a row that slides: the action of the slide to the right below it, the side actions
// (`end`) behind its right end, and the body with `row`. `right` is { run, icon } or null.
export const swipeBox = ({ id, groupId = null, row, end, right }) => {
  const open = isOpen(id, groupId) ? ui.openSide : null;
  const widths = { start: 0, end: end.length * SIDE_BUTTON };
  const body = el('div', { className: 'item-row-body' }, row);
  const layers = [el('div', { className: 'item-row-actions', inert: open !== 'end' }, end.map(closing))];
  // The slide to the right shows its action below the row.
  if (right) layers.unshift(el('div', { className: 'item-row-backdrop' }, [icon(right.icon)]));
  const from = ui.settleFrom;
  if (from && from.id === id && from.groupId === groupId) {
    // Start where the drag ended, then move to the settled place with the CSS transition.
    moveRow(body, from.x);
    requestAnimationFrame(() => requestAnimationFrame(() => moveRow(body, shift(open, widths))));
  } else moveRow(body, shift(open, widths));
  bindSwipe(body, widths, id, groupId, right);
  const box = el('div', { className: open ? 'item-row-swipe open' : 'item-row-swipe' }, [...layers, body]);
  return { box, body };
};

export const itemNode = (item, groupId = null) => {
  const { row, end, right } = ui.view === 'active' ? activeRow(item, groupId) : nextRow(item, groupId);
  const { box, body } = swipeBox({ id: item.id, groupId, row, end, right });
  const node = el('li', {
    className: [
      'item-row',
      item.bought && ui.view === 'active' && 'bought',
      ui.flashId === item.id && 'flash',
      ui.leaving.has(item.id) && 'gone',
    ].filter(Boolean).join(' '),
  }, [box]);
  node.dataset.id = item.id;
  const scope = scopeOf(item, groupId);
  if (scope) node.dataset.scope = scope;
  bindReorder(body, node, item, groupId);
  return node;
};

// The ticked items of Actual, behind one row that opens and closes them. A search keeps them open,
// so that a ticked match is in view.
export const boughtSection = (bought) => {
  const open = ui.boughtOpen || searching();
  const button = el('button', {
    type: 'button',
    className: 'section-head-button',
    disabled: searching(),
    onclick: () => {
      ui.boughtOpen = !ui.boughtOpen;
      render();
    },
  }, [
    el('span', { textContent: t('count.bought', { count: bought.length }) }),
    el('span', { className: 'chevron', textContent: open ? '▾' : '▸' }),
  ]);
  button.setAttribute('aria-expanded', String(open));
  return [el('li', { className: 'section-head' }, [button]), ...(open ? bought.map((item) => itemNode(item)) : [])];
};

// A saved item slides as an item row: to the right it comes back to `list`, to the left it shows
// the delete. A tap on its name opens the edit sheet.
const savedNode = (item, list) => {
  const bring = () => apply(store.bringToList(state, item.id, list), { undoText: say('toast.addedTo', { name: item.name, list }) });
  const name = el('button', { type: 'button', className: 'item-row-name', tabIndex: -1, onclick: () => openEdit(item) }, nameParts(item));
  const right = { run: bring, icon: list === 'active' ? 'cart-add' : 'calendar' };
  const { box } = swipeBox({ id: item.id, groupId: 'saved', row: [name], end: [deleteAction(item)], right });
  const node = el('li', { className: 'item-row' }, [box]);
  node.dataset.id = item.id;
  return node;
};

// The saved items, behind one row that opens and closes them, as the ticked items of Actual. A
// tap on an item brings it to `list`. A search keeps them open, so that a saved match is in view.
export const savedSection = (saved, list) => {
  const open = ui.savedOpen || searching();
  const button = el('button', {
    type: 'button',
    className: 'section-head-button',
    disabled: searching(),
    onclick: () => {
      ui.savedOpen = !ui.savedOpen;
      render();
    },
  }, [
    el('span', { textContent: t('count.saved', { count: saved.length }) }),
    el('span', { className: 'chevron', textContent: open ? '▾' : '▸' }),
  ]);
  button.setAttribute('aria-expanded', String(open));
  return [el('li', { className: 'section-head' }, [button]), ...(open ? saved.map((item) => savedNode(item, list)) : [])];
};

export const groupHead = (title, count) =>
  el('li', { className: 'group-head' }, [el('span', { textContent: title }), el('span', { textContent: count })]);
