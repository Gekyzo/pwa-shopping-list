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
  const quantity = item.quantity ? [' ', el('span', { className: 'qty', textContent: item.quantity })] : [];
  const parts = [el('span', {}, [item.name, ...quantity])];
  if (item.shops.length && shownGroup() !== 'shop') parts.push(el('small', { textContent: item.shops.join(' · ') }));
  return parts;
};

// The recurrent mark of a row. It shows on each item and a tap changes it.
const recurrentToggle = (item) => {
  const button = el('button', { type: 'button', className: 'recur', onclick: () => apply(store.toggleRecurrent(state, item.id)) }, [
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
  const checkbox = el('input', { type: 'checkbox', checked: item.bought, onchange: toggle });
  checkbox.setAttribute('aria-label', t('row.bought', { name: item.name }));
  const name = el('button', { type: 'button', className: 'name', tabIndex: -1, onclick: () => openEdit(item) }, nameParts(item));
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
  const name = el('button', { type: 'button', className: 'name', tabIndex: -1, onclick: () => openEdit(item) }, nameParts(item));
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
// to the right. `settle` and `reached` decide the result.
const bindSwipe = (row, widths, item, groupId, right) => {
  let drag = null;
  row.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || ui.editingId === item.id) return;
    const base = shift(isOpen(item.id, groupId) ? ui.openSide : null, widths);
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
      Object.assign(ui, { openId: null, openSide: null, editingId: null });
      // The row slides back while the tick closes it (ROW-9), or before the render of a move.
      row.classList.remove('dragging');
      moveRow(row, 0);
      right.run();
      return;
    }
    const open = isOpen(item.id, groupId) ? ui.openSide : null;
    const side = settle(event.clientX - x, widths, open);
    Object.assign(ui, { openId: side ? item.id : null, openSide: side, openGroup: groupId, editingId: null });
    ui.settleFrom = { id: item.id, groupId, x: at };
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

export const itemNode = (item, groupId = null) => {
  const { row, end, right } = ui.view === 'active' ? activeRow(item, groupId) : nextRow(item, groupId);
  const open = isOpen(item.id, groupId) ? ui.openSide : null;
  const widths = { start: 0, end: end.length * SIDE_BUTTON };
  const rowNode = el('div', { className: 'row' }, row);
  const layers = [el('div', { className: 'side end', inert: open !== 'end' }, end.map(closing))];
  // The slide to the right shows its action below the row.
  if (right) layers.unshift(el('div', { className: 'backdrop' }, [icon(right.icon)]));
  const from = ui.settleFrom;
  if (from && from.id === item.id && from.groupId === groupId) {
    // Start where the drag ended, then move to the settled place with the CSS transition.
    moveRow(rowNode, from.x);
    requestAnimationFrame(() => requestAnimationFrame(() => moveRow(rowNode, shift(open, widths))));
  } else moveRow(rowNode, shift(open, widths));
  bindSwipe(rowNode, widths, item, groupId, right);
  const classes = [
    'item',
    item.bought && ui.view === 'active' && 'bought',
    ui.flashId === item.id && 'flash',
    ui.leaving.has(item.id) && 'gone',
  ];
  const node = el('li', { className: classes.filter(Boolean).join(' ') }, [
    el('div', { className: open ? 'swipe open' : 'swipe' }, [...layers, rowNode]),
  ]);
  node.dataset.id = item.id;
  const scope = scopeOf(item, groupId);
  if (scope) node.dataset.scope = scope;
  bindReorder(rowNode, node, item, groupId);
  return node;
};

// The ticked items of Actual, behind one row that opens and closes them. A search keeps them open,
// so that a ticked match is in view.
export const boughtSection = (bought) => {
  const open = ui.boughtOpen || searching();
  const button = el('button', {
    type: 'button',
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
  return [el('li', { className: 'section' }, [button]), ...(open ? bought.map((item) => itemNode(item)) : [])];
};

export const groupHead = (title, count) =>
  el('li', { className: 'group-head' }, [el('span', { textContent: title }), el('span', { textContent: count })]);
