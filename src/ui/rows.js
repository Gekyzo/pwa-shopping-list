import * as store from '#store';
import { reached, settle } from '#swipe';
import { loadSwipeHint, saveSwipeHint } from '#storage';
import { SIDE_BUTTON, DRAG_START, HINT_WAIT_MS, HINT_SHIFT, el, storage, state, ui, t, apply, render, guardClick } from '#ui/context';
import { isOpen, searching, shownGroup } from '#ui/view';
import { leave, collapse, expand } from '#ui/motion';
import { icon, iconButton } from '#ui/controls';
import { openEdit } from '#ui/edit';
import { reorder, bindReorder } from '#ui/drag';

// The name of a row, with its quantity after it, and below it the shops of the item when the list
// is not by shop, the other recipes of an item of two recipe groups (`also`) and the mark of a
// recurrent item.
const nameParts = (item, also) => {
  const quantity = item.quantity ? [' ', el('span', { className: 'item-row-qty', textContent: item.quantity })] : [];
  const parts = [el('span', { className: 'item-row-label' }, [item.name, ...quantity])];
  const meta = [
    ...(item.shops.length && shownGroup() !== 'shop' ? [item.shops.join(' · ')] : []),
    ...(also.length ? [t('row.alsoIn', { recipes: also.join(', ') })] : []),
    ...(item.recurrent ? [t('row.repeats')] : []),
  ];
  if (meta.length) parts.push(el('small', { className: 'item-row-meta', textContent: meta.join(' · ') }));
  return parts;
};

const editAction = (item) => iconButton('edit', t('row.edit'), () => openEdit(item), { variant: 'neutral', labelled: true });

const repeatAction = (item) =>
  iconButton('repeat', t(item.recurrent ? 'row.noRepeat' : 'row.repeat'), () => apply(store.toggleRecurrent(state, item.id)), { labelled: true });

// Its visible name is Eliminar; a screen reader also hears the name of the item.
const deleteAction = (item) => {
  const button = iconButton(
    'trash',
    t('sheet.delete'),
    () => apply(store.deleteItem(state, item.id), { undoText: t('toast.deleted', { name: item.name }) }),
    { variant: 'danger', labelled: true },
  );
  button.setAttribute('aria-label', t('row.delete', { name: item.name }));
  return button;
};

// The edit button at the end of a row. It is out of the name, so a tap on it does not tick.
const editButton = (item) => {
  const edit = () => {
    // An open row closes first (ROW-6).
    Object.assign(ui, { openId: null, openSide: null });
    openEdit(item);
  };
  const button = el('button', { type: 'button', className: 'button icon', title: t('row.edit'), onclick: edit }, [icon('edit')]);
  button.setAttribute('aria-label', t('row.edit'));
  button.setAttribute('aria-haspopup', 'dialog');
  return button;
};

// A row of Compra: a tap on its body ticks the item (D1), the check only shows the state, and the
// edit button stays at the end. The name is the checkbox for the keyboard and a screen reader: a
// button gives it Space and Enter, and its click reaches the body like a tap.
const itemRow = (item, also) => {
  const toggle = () => {
    if (item.bought) {
      apply(store.toggleBought(state, item.id));
      return;
    }
    check.checked = true;
    // A ticked item goes into the collapsed section, so a wrong tap needs an undo.
    leave(item, () => apply(store.toggleBought(state, item.id), { undoText: t('toast.bought', { name: item.name }) }));
  };
  const check = el('input', { type: 'checkbox', className: 'item-row-check', checked: item.bought, tabIndex: -1 });
  check.setAttribute('aria-hidden', 'true');
  const name = el('button', { type: 'button', className: 'item-row-name' }, nameParts(item, also));
  name.setAttribute('role', 'checkbox');
  name.setAttribute('aria-checked', String(item.bought));
  const row = [check, name, el('div', { className: 'item-row-end' }, [editButton(item)])];
  return {
    row,
    end: [editAction(item), repeatAction(item), deleteAction(item)],
    right: { run: toggle, icon: item.bought ? 'undo' : 'check' },
    tap: toggle,
  };
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
    // The side actions show while the row is left of its place, not only after the settle (ROW-5).
    row.parentNode.classList.toggle('open', drag.at < 0);
    const armed = drag.at > 0 && reached(drag.at, row.offsetWidth);
    // A short buzz when the slide becomes long enough to run its action.
    if (armed && !row.parentNode.classList.contains('armed')) navigator.vibrate?.(10);
    row.parentNode.classList.toggle('armed', armed);
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

// The first time Compra shows a row, its body slides a little to the left and back, so the user
// sees that it slides (ROW-14). It plays one time; with no storage, one time for each start.
let hinted = false;
export const hintSwipe = () => {
  if (hinted || (storage && loadSwipeHint(storage)) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!document.querySelector('#items .item-row-body.tick')) return;
  hinted = true;
  setTimeout(() => {
    // A render in the wait builds the rows again: take the first row of now.
    const body = document.querySelector('#items .item-row-swipe:not(.open) > .item-row-body.tick');
    if (!body || ui.view !== 'active') {
      hinted = false;
      return;
    }
    const style = getComputedStyle(body);
    const duration = 2 * (parseFloat(style.getPropertyValue('--motion')) || 200);
    body.animate(
      [{ transform: 'translateX(0)' }, { transform: `translateX(${-HINT_SHIFT}px)` }, { transform: 'translateX(0)' }],
      { duration, easing: style.getPropertyValue('--ease').trim() || 'ease' },
    );
    if (storage) saveSwipeHint(storage);
  }, HINT_WAIT_MS);
};

// The rows that a row can move among: its group, or the rows to buy of a flat list.
// Null for a row that does not move.
const scopeOf = (item, groupId) => (item.bought ? null : groupId ?? 'rest');

// A side action closes the row, then runs.
const closing = (button) => {
  const run = button.onclick;
  button.onclick = () => {
    ui.openId = null;
    run();
  };
  return button;
};

// A tap on the body of a row runs `tap`, except on its end slot. A tap on an open row only closes
// it (ROW-6), with the slide back from where it is. The click that follows a drag, a hold or a
// slide never comes here (ROW-8).
const tapBody = (event, opened, tap) => {
  if (event.target.closest('.item-row-end')) return;
  if (opened) {
    Object.assign(ui, { openId: null, openSide: null, settleFrom: opened });
    render();
    return;
  }
  tap();
};

// The box of a row that slides: the action of the slide to the right below it, the side actions
// (`end`) behind its right end, and the body with `row`. `right` is { run, icon } or null. `tap`,
// when given, makes the whole body the tick target.
export const swipeBox = ({ id, groupId = null, row, end, right, tap = null }) => {
  const open = isOpen(id, groupId) ? ui.openSide : null;
  const widths = { start: 0, end: end.length * SIDE_BUTTON };
  const body = el('div', { className: tap ? 'item-row-body tick' : 'item-row-body' }, row);
  // While the row is open, a tap closes it from its open place.
  const opened = open ? { id, groupId, x: shift(open, widths) } : null;
  if (tap) body.addEventListener('click', (event) => tapBody(event, opened, tap));
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

// `also` names the other recipe groups that show the item (GROUP-20).
export const itemNode = (item, groupId = null, also = []) => {
  const { row, end, right, tap } = itemRow(item, also);
  const { box, body } = swipeBox({ id: item.id, groupId, row, end, right, tap });
  const node = el('li', {
    className: [
      'item-row',
      item.bought && 'bought',
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

// The ticked items of Compra, behind one row that opens and closes them. A search keeps them open,
// so that a ticked match is in view.
export const boughtSection = (bought) => {
  const open = ui.boughtOpen || searching();
  const button = el('button', {
    type: 'button',
    className: 'section-head-button',
    disabled: searching(),
    onclick: () => {
      Object.assign(ui, { boughtOpen: !ui.boughtOpen, animate: true });
      render();
    },
  }, [
    el('span', { textContent: t('count.bought', { count: bought.length }) }),
    el('span', { className: 'chevron', textContent: open ? '▾' : '▸' }),
  ]);
  button.setAttribute('aria-expanded', String(open));
  return [el('li', { className: 'section-head' }, [button]), ...(open ? bought.map((item) => itemNode(item)) : [])];
};

// The rows of a group carry its key, so that its head can close and open them.
const groupRows = (key) => [...document.querySelectorAll('#items .item-row')].filter((node) => node.dataset.group === key);

// The head of a group: its title, its count and a chevron. A tap closes the rows of the group, and a
// second tap opens them. A search shows each group open. With no key the head does not close.
export const groupHead = (title, count, key = null) => {
  if (key === null) return el('li', { className: 'group-head' }, [el('span', { textContent: title }), el('span', { textContent: count })]);
  const id = `${ui.view}:${key}`;
  const open = !ui.closedGroups.has(id) || searching();
  const button = el('button', {
    type: 'button',
    className: 'group-head-button',
    disabled: searching(),
    onclick: () => {
      if (ui.closedGroups.has(id)) {
        ui.closedGroups.delete(id);
        render();
        expand(groupRows(key));
        return;
      }
      collapse(groupRows(key), () => {
        ui.closedGroups.add(id);
        render();
      });
    },
  }, [
    el('span', { textContent: title }),
    el('span', { className: 'group-head-end' }, [el('span', { textContent: count }), el('span', { className: 'chevron', textContent: open ? '▾' : '▸' })]),
  ]);
  button.setAttribute('aria-expanded', String(open));
  return el('li', { className: 'group-head' }, [button]);
};

// The rows of a group under its head, or none while the group is closed.
export const groupNodes = (key, rows) => {
  if (ui.closedGroups.has(`${ui.view}:${key}`) && !searching()) return [];
  rows.forEach((node) => {
    node.dataset.group = key;
  });
  return rows;
};
