import * as store from '#store';
import * as recipes from '#recipes';
import * as shops from '#shops';
import * as menu from '#menu';
import { reached, settle } from '#swipe';
import { direction, slideDirection, slideTo } from '#sections';
import { switchModule, visibleSections } from '#modules';
import { PARTICLE_SIZE, makeParticles, particleAt } from '#particles';
import { PAGES, isLast, step } from '#onboarding';
import { dropIndex, moveTo, shifts } from '#reorder';
import { exportJson, exportFilename, importJson, saveOnboarded } from '#storage';
import { parseVersion, versionStatus } from '#version';
import { LANGUAGES, LANGUAGE_NAMES, intlTag } from '#i18n';
import {
  ARRIVAL_MS,
  SIDE_BUTTON,
  DRAG_START,
  HOLD_MS,
  EDGE,
  EDGE_STEP,
  LEAVE_MS,
  REFRESH_MS,
  CHECK_MS,
  $,
  el,
  storage,
  scroller,
  chosen,
  lang,
  t,
  hand,
  theme,
  shopLists,
  off,
  navMotion,
  state,
  ui,
  undoState,
  clickGuardUntil,
  isOn,
  say,
  textOf,
  showToast,
  hideToast,
  setRender,
  render,
  commit,
  apply,
  guardClick,
  setLanguage,
  setHand,
  setTheme,
  setShopLists,
  setModules,
  setNavMotion,
} from '#ui/context';

// True while the groups of Actual close, before the list becomes flat.
let ungrouping = false;

const finishTrip = (undoText = t('toast.finished')) => {
  if (!apply(store.startNewShopping(state), { undoText })) return;
  Object.assign(ui, { view: 'active', editingId: null, openId: null, tripOpen: false });
  render();
};

// Rows

const renameInput = (entry, rename = (name) => store.renameItem(state, entry.id, name)) => {
  const input = el('input', { type: 'text', className: 'rename', value: entry.name, maxLength: 80 });
  input.setAttribute('aria-label', t('row.rename', { name: entry.name }));
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

// An item of two recipes, or of two shops, shows in two groups: `groupId` tells its rows apart.
const isOpen = (id, groupId) => ui.openId === id && ui.openGroup === groupId;

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
  button.setAttribute('aria-label', t('row.more', { name: item.name }));
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
  check: 'M4 12l5 5L20 6',
  chain:
    'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  cart: 'M2 3h3l2.5 12h11L21 7H6M9 18.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3M18 18.5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 1 0 0-3',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4',
  repeat: 'M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
  undo: 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
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

const openEdit = (item) => {
  Object.assign(ui, { editId: item.id, openId: null, editingId: null });
  $('edit-name').value = item.name;
  $('edit-quantity').value = item.quantity;
  $('edit-shop').value = '';
  render();
};

const closeEdit = () => {
  ui.editId = null;
  render();
};

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
    icon(ICONS.repeat),
  ]);
  button.setAttribute('aria-pressed', String(item.recurrent));
  button.setAttribute('aria-label', t('row.always', { name: item.name }));
  return button;
};

const moveAction = (item) => {
  const toNext = item.list === 'active';
  const params = { list: toNext ? 'next' : 'active', name: item.name };
  return iconButton(toNext ? ICONS.calendar : ICONS.cart, say('row.moveTo', params), () =>
    apply(store.moveItem(state, item.id), { undoText: say('toast.movedTo', params) }));
};

const deleteAction = (item) =>
  iconButton(
    ICONS.trash,
    t('row.delete', { name: item.name }),
    () => apply(store.deleteItem(state, item.id), { undoText: t('toast.deleted', { name: item.name }) }),
    'danger',
  );

// Closes rows of the list, then runs `done`.
const collapse = (nodes, done) => {
  if (!nodes.length || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    done();
    return;
  }
  nodes.forEach((node) => {
    node.style.height = `${node.offsetHeight}px`;
    // Read the layout, so that the height below starts a transition.
    node.getBoundingClientRect();
    node.classList.add('leaving');
    node.style.height = '0px';
  });
  setTimeout(done, LEAVE_MS);
};

// Opens rows that a render has just built. It is the opposite of `collapse`.
const expand = (nodes) => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  nodes.forEach((node) => {
    const still = { minHeight: 0, overflow: 'hidden' };
    node.animate(
      [
        { height: '0px', opacity: 0, ...still },
        { height: `${node.offsetHeight}px`, opacity: 1, ...still },
      ],
      { duration: LEAVE_MS, easing: 'ease-out' },
    );
  });
};

const pendingRows = () => [...$('items').querySelectorAll('.item:not(.bought)')].filter((node) => node.dataset.id);

// The top of each row to buy. The key has the place of the row among the rows of its item,
// so that the first row of an item of two recipes is the row of the flat list.
const rowTops = () => {
  const seen = new Map();
  return new Map(
    pendingRows().map((node) => {
      const nth = seen.get(node.dataset.id) ?? 0;
      seen.set(node.dataset.id, nth + 1);
      return [`${node.dataset.id}#${nth}`, { node, top: node.getBoundingClientRect().top }];
    }),
  );
};

// Moves each row from its place before a render (`before`, from `rowTops`) to its new place.
const slide = (before) => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  rowTops().forEach(({ node, top }, key) => {
    const from = before.get(key);
    if (!from || from.top === top) return;
    node.animate([{ transform: `translateY(${from.top - top}px)` }, { transform: 'none' }], {
      duration: LEAVE_MS,
      easing: 'ease-out',
    });
  });
};

// Closes the rows of an item, then runs `done`. An item of two recipes has two rows.
const leave = (item, done) => {
  if (ui.leaving.has(item.id)) return;
  ui.leaving.add(item.id);
  const rows = [...$('items').querySelectorAll('.item')].filter((node) => node.dataset.id === item.id);
  collapse(rows, () => {
    ui.leaving.delete(item.id);
    done();
  });
};

// The rows that the flat list does not have: the group heads, and each row after the first of an item.
const groupOnlyRows = () => {
  const seen = new Set();
  return [...$('items').querySelectorAll('.group-head, .item:not(.bought)')].filter((node) => {
    if (node.classList.contains('group-head')) return true;
    const again = seen.has(node.dataset.id);
    seen.add(node.dataset.id);
    return again;
  });
};

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
  return { row, end, right: { run: toggle, icon: item.bought ? ICONS.undo : ICONS.check } };
};

const nextRow = (item, groupId) => {
  const pending = item.list === 'next';
  const name = el('button', { type: 'button', className: 'name', tabIndex: -1, onclick: () => openEdit(item) }, nameParts(item));
  const row = [name];
  if (!pending) row.push(el('span', { className: 'pill', textContent: t('row.boughtToday') }));
  row.push(recurrentToggle(item));
  if (pending) {
    const right = { run: () => moveAction(item).onclick(), icon: ICONS.cart };
    return { row, end: [moveAction(item), deleteAction(item)], right };
  }
  const params = { list: 'next', name: item.name };
  const remove = iconButton(ICONS.calendarOff, say('row.removeFrom', params), () =>
    apply(store.removeFromNext(state, item.id), { undoText: say('toast.removedFrom', params) }));
  return { row, end: [remove], right: null };
};

const shift = (side, widths) => (side === 'start' ? widths.start : side === 'end' ? -widths.end : 0);

const moveRow = (row, x) => {
  row.style.transform = x ? `translateX(${x}px)` : '';
};

// The lifted row of a manual order, or null.
let reorder = null;

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

// Puts the lifted row below the pointer and opens the gap among the other rows of its scope.
const placeLifted = () => {
  const { rows, from, tops, heights } = reorder;
  const last = rows.length - 1;
  const raw = reorder.pointerY - reorder.startY + scroller.scrollTop - reorder.scrollStart;
  const dy = Math.max(tops[0] - tops[from], Math.min(tops[last] + heights[last] - tops[from] - heights[from], raw));
  reorder.to = dropIndex(tops, heights, from, tops[from] + dy);
  const offsets = shifts(rows.length, from, reorder.to, heights[from]);
  rows.forEach((row, index) => {
    const y = index === from ? dy : offsets[index];
    row.style.transform = y ? `translateY(${y}px)` : '';
  });
};

// Scrolls the list while the pointer is near its top or its bottom edge.
const edgeScroll = () => {
  if (!reorder) return;
  const { top, bottom } = scroller.getBoundingClientRect();
  const step = reorder.pointerY < top + EDGE ? -EDGE_STEP : reorder.pointerY > bottom - EDGE ? EDGE_STEP : 0;
  if (step) {
    scroller.scrollTop += step;
    placeLifted();
  }
  reorder.frame = requestAnimationFrame(edgeScroll);
};

const lift = (node, rowNode, pointerId, y) => {
  // The rows of the scope that are next to the row. In the name order a row of Próxima that was
  // bought today can be between two rows of the scope; a move does not pass it.
  const inScope = (row) => row?.dataset.scope === node.dataset.scope;
  const rows = [node];
  for (let row = node.previousElementSibling; inScope(row); row = row.previousElementSibling) rows.unshift(row);
  for (let row = node.nextElementSibling; inScope(row); row = row.nextElementSibling) rows.push(row);
  if (rows.length < 2) return;
  try {
    rowNode.setPointerCapture(pointerId);
  } catch {
    // The pointer is gone: without its release the move would never end.
    return;
  }
  const rects = rows.map((row) => row.getBoundingClientRect());
  const from = rows.indexOf(node);
  reorder = {
    node,
    pointerId,
    rows,
    from,
    to: from,
    tops: rects.map((rect) => rect.top + scroller.scrollTop),
    heights: rects.map((rect) => rect.height),
    startY: y,
    pointerY: y,
    scrollStart: scroller.scrollTop,
  };
  node.classList.add('lifted');
  navigator.vibrate?.(10);
  reorder.frame = requestAnimationFrame(edgeScroll);
};

// Ends a move. `keep` writes the new order; without it the row goes back.
const endReorder = (keep) => {
  if (!reorder) return;
  const { node, rows, from, to, frame } = reorder;
  cancelAnimationFrame(frame);
  reorder = null;
  // The click that follows a drop must not tick the item.
  guardClick();
  // A render in the time of the move built new rows: the order of these rows is stale.
  const moved = keep && to !== from && node.isConnected;
  const before = moved ? rowTops() : null;
  node.classList.remove('lifted');
  rows.forEach((row) => {
    row.style.transform = '';
  });
  if (!moved) return;
  const ids = moveTo(rows.map((row) => row.dataset.id), from, to);
  // A move in the name order changes the order to the custom one.
  const undoText = t(state.sort === 'name' ? 'toast.orderCustom' : 'toast.order');
  if (apply(store.reorderItems(state, ids), { undoText })) slide(before);
};

// Lets a hold of a finger, or a vertical drag of the mouse, lift the row and move it in its scope.
const bindReorder = (rowNode, node, item, groupId) => {
  let pending = null;
  // True after a hold of the finger: the click of its release must not tick the item.
  let held = false;
  const forget = () => {
    clearTimeout(pending?.timer);
    pending = null;
  };
  const start = (pointerId, y) => {
    if (!node.isConnected) return;
    held = true;
    lift(node, rowNode, pointerId, y);
  };
  rowNode.addEventListener('pointerdown', (event) => {
    forget();
    held = false;
    // The rows that a search hides have no place on the screen, so a search stops the move.
    if (event.button !== 0 || reorder || !node.dataset.scope || searching()) return;
    if (ui.editingId === item.id || isOpen(item.id, groupId)) return;
    const mouse = event.pointerType === 'mouse';
    const { pointerId, clientX: x, clientY: y } = event;
    const timer = mouse
      ? null
      : setTimeout(() => {
          pending = null;
          start(pointerId, y);
        }, HOLD_MS);
    pending = { x, y, mouse, timer, pointerId };
  });
  rowNode.addEventListener('pointermove', (event) => {
    // A release out of the row gives it no pointerup: a later hover must not lift it.
    if (pending && (event.pointerId !== pending.pointerId || !(event.buttons & 1))) forget();
    if (pending) {
      const dx = Math.abs(event.clientX - pending.x);
      const dy = Math.abs(event.clientY - pending.y);
      if (Math.max(dx, dy) < DRAG_START) return;
      const { mouse, y } = pending;
      forget();
      // A finger that moves before the hold ends scrolls or swipes. The mouse needs no hold.
      if (mouse && dy > dx) lift(node, rowNode, event.pointerId, y);
    }
    if (reorder?.node !== node || reorder.pointerId !== event.pointerId) return;
    reorder.pointerY = event.clientY;
    placeLifted();
  });
  const finish = (keep) => (event) => {
    forget();
    if (held) guardClick();
    held = false;
    if (reorder?.node === node && reorder.pointerId === event.pointerId) endReorder(keep);
  };
  rowNode.addEventListener('pointerup', finish(true));
  rowNode.addEventListener('pointercancel', finish(false));
  // A long press of a finger must not open the menu of the browser.
  rowNode.addEventListener('contextmenu', (event) => {
    if (event.pointerType !== 'mouse') event.preventDefault();
  });
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
const boughtSection = (bought) => {
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

const groupHead = (title, count) =>
  el('li', { className: 'group-head' }, [el('span', { textContent: title }), el('span', { textContent: count })]);

const inList = () => ui.view === 'active' || ui.view === 'next';

// The state of the shop list on the screen. The operations still run on the full state.
const viewState = () => (inList() ? shops.shopState(state, ui.shop[ui.view]) : state);

// True for an item that the search of the list shows.
const found = (item) => store.matchesItem(item, ui.query);
// True while the search field has a text.
const searching = () => ui.query.trim() !== '';

// The rows of a list below the shop of each item. A row of a shop has the group id `shop:<name>`.
const shopNodes = (list) => {
  const { groups, rest } = store.filterGroups(shops.shopGroups(viewState(), list), ui.query);
  const count = ({ left, total }) => {
    if (list !== 'active') return '';
    return left ? `${total - left}/${total}` : '✓';
  };
  const grouped = groups.flatMap((group) => [
    groupHead(group.shop, count(group)),
    ...group.items.map((item) => itemNode(item, `shop:${group.shop}`)),
  ]);
  const others = rest.length ? [groupHead(t('group.noShop'), ''), ...rest.map((item) => itemNode(item))] : [];
  return [...grouped, ...others];
};

// The items of Actual still to buy: flat, below the recipe that asks for each one, or below
// the shop of each one.
const pendingNodes = () => {
  const group = shownGroup();
  if (group === 'shop') return shopNodes('active');
  if (group === 'none') {
    return store.activeItems(viewState()).filter((item) => !item.bought && found(item)).map((item) => itemNode(item));
  }
  const { groups, rest } = store.filterGroups(recipes.recipeGroups(viewState()), ui.query);
  const grouped = groups.flatMap(({ recipe, items, total, left }) => [
    groupHead(recipe.name, left ? `${total - left}/${total}` : '✓'),
    ...items.map((item) => itemNode(item, recipe.id)),
  ]);
  const others = rest.length ? [groupHead(t('group.others'), ''), ...rest.map((item) => itemNode(item))] : [];
  return [...grouped, ...others];
};

const listNodes = (items) => {
  if (ui.view !== 'active') return shownGroup() === 'shop' ? shopNodes('next') : items.filter(found).map((item) => itemNode(item));
  const bought = items.filter((item) => item.bought && found(item));
  return bought.length ? [...pendingNodes(), ...boughtSection(bought)] : pendingNodes();
};

// The choices that the arrange sheet has for the view: the recipe groups of Actual when a recipe
// has a group, the shop groups when an item of the view has a shop, and the order of a list with
// two items or more. A shop list has no shop groups.
const arrangeChoices = () => {
  if (!inList()) return { recipe: false, shop: false, sort: false };
  const scoped = viewState();
  const items = ui.view === 'active' ? store.activeItems(scoped) : store.nextItems(scoped);
  return {
    recipe: isOn('recipes') && ui.view === 'active' && recipes.recipeGroups(scoped).groups.length > 0,
    shop: ui.shop[ui.view] === null && items.some((item) => item.shops.length > 0),
    sort: items.length > 1,
  };
};

// The grouping that the view shows: the choice of the user, when the view can show it.
const shownGroup = () => {
  const { recipe, shop } = arrangeChoices();
  if (state.group === 'recipe' && recipe) return 'recipe';
  return state.group === 'shop' && shop ? 'shop' : 'none';
};

const renderArrange = () => {
  const { recipe, shop, sort } = arrangeChoices();
  const group = recipe || shop;
  // The choice of the row of shop lists shows when the view has the row to show.
  const lists = inList() && shops.shopChips(state, ui.view).length > 0;
  if (!group && !sort && !lists) ui.arrangeOpen = false;
  $('arrange-button').hidden = !group && !sort && !lists;
  $('arrange-button').setAttribute('aria-expanded', String(ui.arrangeOpen));
  $('arrange').hidden = !ui.arrangeOpen;
  $('arrange-group').hidden = !group;
  $('arrange-sort').hidden = !sort;
  $('arrange-lists').hidden = !lists;
  document.querySelectorAll('#arrange-lists button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.lists === shopLists));
  });
  const shows = { recipe, shop, none: true };
  // The view shows no group for a choice that it cannot show.
  const pressed = shownGroup();
  document.querySelectorAll('#arrange-group button').forEach((button) => {
    button.hidden = !shows[button.dataset.group];
    button.setAttribute('aria-pressed', String(button.dataset.group === pressed));
  });
  document.querySelectorAll('#arrange-sort button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.sort === state.sort));
  });
};

// A tap on a chip of the edit sheet adds or removes that shop for the item of the sheet.
const toggleShop = (shop) => {
  const item = state.items.find((entry) => entry.id === ui.editId);
  if (!item) return;
  const has = item.shops.some((own) => own.toLowerCase() === shop.toLowerCase());
  apply((has ? shops.removeItemShop : shops.addItemShop)(state, item.id, shop));
};

// The edit sheet of one item: its name, and each shop in use as a chip, pressed when the item has it.
const renderEdit = () => {
  const item = state.items.find((entry) => entry.id === ui.editId);
  $('edit').hidden = !item;
  if (!item) return;
  $('edit-title').textContent = t('edit.title');
  $('edit-form').setAttribute('aria-label', t('edit.title'));
  if (document.activeElement !== $('edit-name')) $('edit-name').value = item.name;
  if (document.activeElement !== $('edit-quantity')) $('edit-quantity').value = item.quantity;
  const own = new Set(item.shops.map((shop) => shop.toLowerCase()));
  const names = shops.shopNames(state);
  // The chips stay when the shops in use do not change: the blur of the name field renders
  // between the press and the click of a chip, and a new chip would lose that click.
  const box = $('edit-chips');
  if ([...box.children].map((chip) => chip.textContent).join('\n') !== names.join('\n')) {
    box.replaceChildren(...names.map((shop) => el('button', { type: 'button', textContent: shop, onclick: () => toggleShop(shop) })));
  }
  for (const chip of box.children) chip.setAttribute('aria-pressed', String(own.has(chip.textContent.toLowerCase())));
  $('edit-empty').hidden = names.length > 0;
  // The field completes a typed name with a shop in use.
  $('edit-shops').replaceChildren(...shops.shopSuggestions(state, item.id).map((shop) => el('option', { value: shop })));
};

// Recipes

const sendText = ({ added, already }) => {
  const parts = [];
  if (added) parts.push(t('send.added', { count: added }));
  if (already) parts.push(t('send.already', { count: already }));
  return parts.join(', ');
};

const sendToList = (recipe) => {
  const result = recipes.sendRecipe(state, recipe.id);
  if (result.error || result.state !== state) {
    apply(result, { undoText: t('toast.sent', { name: recipe.name, summary: sendText(result) }) });
  }
  // A second tap changes nothing: keep the undo of the send that is still on the screen.
  else showToast(t('toast.sentNothing', { name: recipe.name }), { undo: undoState });
};

const productNode = (recipe, product) => {
  const remove = el('button', {
    type: 'button',
    className: 'more',
    textContent: '✕',
    onclick: () =>
      apply(recipes.removeRecipeProduct(state, recipe.id, product), {
        undoText: t('toast.productRemoved', { product, name: recipe.name }),
      }),
  });
  remove.setAttribute('aria-label', t('recipe.removeProduct', { name: product }));
  return el('li', {}, [el('span', { textContent: product }), remove]);
};

// The product field with the items that match the text below it. A tap on one adds it.
const productForm = (recipe) => {
  const input = el('input', {
    type: 'text',
    className: 'product-name',
    maxLength: 80,
    placeholder: t('recipe.addProduct'),
    enterKeyHint: 'done',
  });
  input.setAttribute('autocapitalize', 'sentences');
  input.setAttribute('aria-label', t('recipe.addProductTo', { name: recipe.name }));
  const add = (name) => {
    // The render builds a new field; `focusProduct` keeps the keyboard open for the next product.
    ui.focusProduct = true;
    if (apply(recipes.addRecipeProduct(state, recipe.id, name))) return;
    ui.focusProduct = false;
    input.focus();
  };
  const suggestions = el('ul', { className: 'suggestions' });
  suggestions.setAttribute('aria-label', t('add.existing'));
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
    el('button', { type: 'submit', className: 'primary', textContent: t('add.submit') }),
  ]);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    add(input.value);
  });
  return el('div', { className: 'product-add' }, [form, suggestions]);
};

const editLink = (recipe) => {
  const text = window.prompt(t('recipe.linkPrompt', { name: recipe.name }), recipe.url);
  if (text === null) return;
  ui.openId = null;
  if (text.trim() === recipe.url) render();
  else apply(recipes.setRecipeUrl(state, recipe.id, text), { undoText: t(text.trim() ? 'toast.linkSaved' : 'toast.linkRemoved') });
};

const linkNode = (recipe) => {
  const link = el('a', { className: 'recipe-link', href: recipe.url, target: '_blank', rel: 'noopener noreferrer' }, [
    icon(ICONS.chain),
  ]);
  link.setAttribute('aria-label', t('recipe.openLink', { name: recipe.name }));
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
        el('small', { textContent: t('count.products', { count: recipe.products.length }) }),
      ],
    );
    name.setAttribute('aria-expanded', String(open));
  }
  const send = el('button', { type: 'button', className: 'send', onclick: () => sendToList(recipe) }, [icon(ICONS.cartPlus)]);
  send.setAttribute('aria-label', t('recipe.send', { name: recipe.name }));
  const row = recipe.url ? [name, linkNode(recipe), send, moreButton(recipe)] : [name, send, moreButton(recipe)];
  const node = el('li', { className: 'item recipe' }, [el('div', { className: 'row' }, row)]);
  if (ui.openId === recipe.id) {
    const remove = actionButton(
      t('recipe.delete'),
      () => apply(recipes.deleteRecipe(state, recipe.id), { undoText: t('toast.recipeDeleted', { name: recipe.name }) }),
      'danger',
    );
    const link = actionButton(t('recipe.link'), () => editLink(recipe));
    node.append(el('div', { className: 'actions' }, [actionButton(t('recipe.rename'), () => startRename(recipe)), link, remove]));
  }
  if (open) {
    node.append(
      el('ul', { className: 'products' }, recipe.products.map((product) => productNode(recipe, product))),
      productForm(recipe),
    );
  }
  return node;
};

// Menu

// The name of a day of the week in the language of the screen. 1 January 2024 is a Monday.
const dayName = (day) => new Intl.DateTimeFormat(intlTag(lang), { weekday: 'long' }).format(new Date(2024, 0, 1 + day));

const mealTitle = (day, meal) => t('menu.title', { meal: t(`meal.${meal}`), day: dayName(day) });

const openMeal = (day, meal) => {
  Object.assign(ui, { mealOpen: { day, meal }, mealQuery: '' });
  render();
};

const closeMeal = () => {
  ui.mealOpen = null;
  render();
};

const mealNode = (day, { meal, recipe }) => {
  const button = el(
    'button',
    { type: 'button', className: recipe ? 'meal' : 'meal free', onclick: () => openMeal(day, meal) },
    [el('small', { textContent: t(`meal.${meal}`) }), el('span', { textContent: recipe ? recipe.name : t('menu.choose') })],
  );
  button.setAttribute('aria-label', `${mealTitle(day, meal)}: ${recipe ? recipe.name : t('menu.choose')}`);
  button.setAttribute('aria-haspopup', 'dialog');
  return button;
};

const dayNode = ({ day, meals }) =>
  el('li', { className: 'day' }, [
    el('h3', { textContent: dayName(day) }),
    el('div', { className: 'meals' }, meals.map((entry) => mealNode(day, entry))),
  ]);

const fillBasket = () => {
  const result = menu.fillMenu(state);
  if (result.error || result.state !== state) {
    apply(result, { undoText: t('toast.menuFilled', { summary: sendText(result) }) });
  }
  // A second tap changes nothing: keep the undo of the fill that is still on the screen.
  else showToast(t('toast.menuNothing'), { undo: undoState });
};

const renderMeal = () => {
  const open = ui.mealOpen;
  $('meal').hidden = !open;
  if (!open) return;
  const { day, meal } = open;
  const title = mealTitle(day, meal);
  $('meal-title').textContent = title;
  $('meal-sheet').setAttribute('aria-label', title);
  const current = menu.menuWeek(state)[day].meals.find((entry) => entry.meal === meal).recipe;
  if ($('meal-query').value !== ui.mealQuery) $('meal-query').value = ui.mealQuery;
  const matches = recipes.searchRecipes(state, ui.mealQuery);
  $('meal-empty').hidden = matches.length > 0;
  $('meal-empty').textContent = matches.length ? '' : t('empty.noMatch', { query: ui.mealQuery.trim() });
  const chips = matches.map((recipe) => {
    const chip = el('button', {
      type: 'button',
      textContent: recipe.name,
      onclick: () => {
        ui.mealOpen = null;
        apply(menu.setMeal(state, day, meal, recipe.id));
      },
    });
    chip.setAttribute('aria-pressed', String(recipe.id === current?.id));
    return chip;
  });
  $('meal-chips').replaceChildren(...chips);
  $('meal-remove').hidden = !current;
};

// Screen

const finishText = ({ back, gone }) => `${t('finish.back', { count: back })} ${t('finish.gone', { count: gone })}`;

const activeSubtitle = ({ total, left }) => {
  if (!total) return t('header.empty');
  if (!left) return t('header.allBought');
  return t('header.left', { count: left });
};

const headerOf = (summary, next) => {
  if (ui.view === 'settings') return { title: t('nav.settings'), subtitle: t('header.settingsSubtitle'), ring: '⚙', pct: 0 };
  if (ui.view === 'menu') {
    const count = menu.mealCount(state);
    const subtitle = count ? t('header.menuMeals', { count }) : t('header.noMeals');
    return { title: t('nav.menu'), subtitle, ring: String(count), pct: 0 };
  }
  if (ui.view === 'recipes') {
    const count = state.recipes.length;
    const subtitle = count ? t('count.recipes', { count }) : t('header.noRecipes');
    return { title: t('nav.recipes'), subtitle, ring: String(count), pct: 0 };
  }
  if (ui.view === 'next') {
    const boughtToday = next.length - summary.incoming;
    const parts = [next.length ? t('count.items', { count: next.length }) : t('header.nothingReady')];
    if (boughtToday) parts.push(t('header.boughtToday', { count: boughtToday }));
    return { title: t('header.next'), subtitle: parts.join(' · '), ring: String(next.length), pct: 0 };
  }
  const { total, left } = summary;
  const pct = total ? Math.round(((total - left) / total) * 100) : 0;
  return { title: t('header.today'), subtitle: activeSubtitle(summary), ring: `${total - left}/${total}`, pct };
};

const EMPTY_KEYS = { active: 'empty.active', next: 'empty.next', recipes: 'empty.recipes', menu: 'empty.menu' };

const emptyText = () => {
  if (searching()) return t(ui.view === 'recipes' ? 'empty.noMatch' : 'empty.noItemMatch', { query: ui.query.trim() });
  return EMPTY_KEYS[ui.view] ? t(EMPTY_KEYS[ui.view]) : '';
};

// One field serves the three sections: Recetas shows it when it has a recipe, and a list shows it
// after a tap on the search button, which a list with no item does not have.
const renderSearch = (items, searchable) => {
  const canOpen = inList() && items.length > 0;
  if (!canOpen) ui.searchOpen = false;
  const shown = searchable || ui.searchOpen;
  if (!shown) ui.query = '';
  $('search-button').hidden = !canOpen;
  $('search-button').setAttribute('aria-expanded', String(ui.searchOpen));
  $('search').hidden = !shown;
  const label = t(inList() ? 'search.items' : 'recipes.search');
  $('query').placeholder = label;
  $('query').setAttribute('aria-label', label);
  // The field is not built again by a render, so it keeps the cursor. Write it only after a reset.
  if ($('query').value !== ui.query) $('query').value = ui.query;
};

const nodesOf = (items) => {
  if (ui.view === 'settings') return [];
  // With no recipe there is nothing to plan: the empty text says where to create one.
  if (ui.view === 'menu') return state.recipes.length ? menu.menuWeek(state).map(dayNode) : [];
  return ui.view === 'recipes' ? recipes.searchRecipes(state, ui.query).map(recipeNode) : listNodes(items);
};

// A shop list of Actual with nothing to buy, while other items are still to buy, points to the
// next shop list that has some.
const renderShopDone = (summary) => {
  const shop = ui.shop.active;
  const done = ui.view === 'active' && shop !== null && !searching() && summary.left > 0 &&
    store.tripSummary(viewState()).left === 0;
  $('shop-done').hidden = !done;
  if (!done) return;
  const next = shops.nextShop(state, shop);
  $('shop-done-text').textContent = t('shops.nothingLeft', { shop: shopLabel(shop) });
  $('shop-done-next').textContent = shopLabel(next);
  $('shop-done-next').onclick = () => {
    ui.shop.active = next;
    render();
  };
};

const renderList = (summary) => {
  const scoped = viewState();
  const items = ui.view === 'active' ? store.activeItems(scoped) : store.nextItems(scoped);
  const searchable = ui.view === 'recipes' && state.recipes.length > 0;
  renderSearch(items, searchable);
  const nodes = nodesOf(items);
  $('items').hidden = ui.view === 'settings';
  $('items').replaceChildren(...nodes);
  if (ui.view === 'next' && nodes.length) {
    $('items').append(el('p', { className: 'hint', textContent: t('next.hint') }));
  }

  $('empty').hidden = ui.view === 'settings' || nodes.length > 0;
  $('empty-text').textContent = emptyText();
  $('bring').hidden = !(isOn('next') && ui.view === 'active' && summary.incoming > 0) || searching();
  $('bring').textContent = say('empty.bring', { count: summary.incoming, list: 'next' });

  $('menu-actions').hidden = !(ui.view === 'menu' && state.recipes.length > 0);
  $('menu-clear').disabled = menu.mealCount(state) === 0;

  $('finish').hidden = !(ui.view === 'active' && ui.shop.active === null && summary.total > 0 && summary.left === 0);
  renderShopDone(summary);
  $('finish-text').textContent = finishText(summary);
};

const VERSION_KEYS = { current: 'version.current', unknown: 'version.unknown' };

const renderVersion = () => {
  const { running, latest, checking } = ui.version;
  const status = versionStatus(running, latest);
  const dateForm = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
  const date = running && new Date(running.date).toLocaleString(intlTag(lang), dateForm);
  $('version').textContent = running ? t('version.running', { version: running.version, date }) : t('version.none');
  const text = checking
    ? t('version.checking')
    : status === 'outdated' ? t('version.available', { version: latest.version }) : t(VERSION_KEYS[status]);
  $('version-status').dataset.status = checking ? 'checking' : status;
  $('version-status').title = text;
  $('version-status-text').textContent = text;
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

// The trip button of the header and its sheet.
const renderTrip = () => {
  if (ui.view !== 'active') ui.tripOpen = false;
  $('trip-button').hidden = ui.view !== 'active';
  $('finish-menu').disabled = !store.canStartNewShopping(state);
  $('trip-button').setAttribute('aria-expanded', String(ui.tripOpen));
  $('trip').hidden = !ui.tripOpen;
};

const shopLabel = (shop) => (shop === null ? t('shops.all') : shop === '' ? t('group.noShop') : shop);

// The row of the shop lists of Actual and Próxima. A count of Actual is the items to buy.
const renderShopChips = () => {
  const chips = inList() && shopLists === 'show' ? shops.shopChips(state, ui.view) : [];
  $('shop-chips').hidden = chips.length === 0;
  const count = (value) => (ui.view === 'active' && value === 0 ? '✓' : String(value));
  const buttons = chips.map(({ shop, count: value }) => {
    const pick = () => {
      Object.assign(ui, { openId: null, openSide: null, editingId: null });
      ui.shop[ui.view] = shop;
      render();
    };
    const button = el('button', { type: 'button', onclick: pick }, [
      el('span', { textContent: shopLabel(shop) }),
      el('span', { className: 'chip-count', textContent: count(value) }),
    ]);
    button.setAttribute('aria-pressed', String(shop === ui.shop[ui.view]));
    return button;
  });
  $('shop-chips').replaceChildren(...buttons);
};

const renderAll = () => {
  // A render builds new rows, so a lifted row loses its pointer and gets no release.
  endReorder(false);
  // The item of the edit sheet can go while the sheet is open: an undo, or an import.
  if (!state.items.some((item) => item.id === ui.editId)) ui.editId = null;
  // A shop list whose chip went shows Todas.
  // A hidden row leaves no list filtered.
  for (const list of ['active', 'next']) {
    ui.shop[list] = shopLists === 'show' ? shops.validShop(state, list, ui.shop[list]) : null;
  }
  const summary = store.tripSummary(state);
  const next = store.nextItems(state);
  const scoped = viewState();
  const header = headerOf(store.tripSummary(scoped), store.nextItems(scoped));
  if (inList() && ui.shop[ui.view] !== null) header.title = shopLabel(ui.shop[ui.view]);

  renderShopChips();
  $('title').textContent = header.title;
  $('subtitle').textContent = header.subtitle;
  $('ring-text').textContent = header.ring;
  $('ring').style.setProperty('--pct', `${header.pct}%`);

  renderList(summary);

  $('settings').hidden = ui.view !== 'settings';
  renderVersion();
  const outcome = [t('settings.back', { count: summary.back }), t('settings.gone', { count: summary.gone })];
  $('finish-menu-text').textContent = outcome.join(' · ');
  renderTrip();

  $('fab').hidden =
    ['settings', 'menu'].includes(ui.view) || ui.sheetOpen || ui.arrangeOpen || ui.tripOpen || ui.editId !== null || ui.mealOpen !== null;
  $('fab').setAttribute('aria-label', t(ui.view === 'recipes' ? 'add.recipe' : 'add.item'));
  $('next-count').textContent = next.length || '';
  const sections = visibleSections(off);
  document.querySelectorAll('.bnav button').forEach((button) => {
    showNavButton(button, sections.includes(button.dataset.view));
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
  renderArrange();
  renderEdit();
  renderMeal();
};
setRender(renderAll);

// The time of the dust of a button, and of the close or the open of its place in the bar.
const DUST_MS = 900;
const PLACE_MS = 300;

// The pixels of a button of the bottom bar: its icon, then its label, in their colours.
const drawButton = async (button) => {
  const box = button.getBoundingClientRect();
  const canvas = el('canvas', { width: Math.ceil(box.width), height: Math.ceil(box.height) });
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const icon = button.querySelector('svg');
  const place = icon.getBoundingClientRect();
  const look = getComputedStyle(icon);
  const copy = icon.cloneNode(true);
  Object.entries({
    xmlns: 'http://www.w3.org/2000/svg',
    width: place.width,
    height: place.height,
    fill: 'none',
    stroke: look.color,
    'stroke-width': look.strokeWidth,
    'stroke-linecap': look.strokeLinecap,
    'stroke-linejoin': look.strokeLinejoin,
  }).forEach(([name, value]) => copy.setAttribute(name, value));
  const image = new Image();
  image.src = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
  await image.decode();
  context.drawImage(image, place.left - box.left, place.top - box.top, place.width, place.height);
  const label = button.querySelector('span');
  const text = label.getBoundingClientRect();
  const font = getComputedStyle(label);
  context.font = `${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
  context.fillStyle = font.color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label.textContent, text.left - box.left + text.width / 2, text.top - box.top + text.height / 2);
  return { box, image: context.getImageData(0, 0, canvas.width, canvas.height) };
};

// Plays the dust of a picture at `box` on a canvas over the page: the particles leave, or with
// `back` they come in and settle. Resolves at the end, or at once when `run` is cancelled.
const playDust = ({ box, image }, back, run) =>
  new Promise((resolve) => {
    const particles = makeParticles(image);
    const pad = 80;
    const canvas = el('canvas', { className: 'dust', width: box.width + 2 * pad, height: box.height + 2 * pad });
    Object.assign(canvas.style, { left: `${box.left - pad}px`, top: `${box.top - pad}px` });
    document.body.append(canvas);
    const context = canvas.getContext('2d');
    run.stops.push(() => {
      canvas.remove();
      resolve();
    });
    const start = performance.now();
    const frame = (now) => {
      if (run.cancelled) return;
      const t = Math.min(1, (now - start) / DUST_MS);
      context.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        const { x, y, alpha } = particleAt(particle, back ? 1 - t : t);
        if (alpha <= 0) return;
        context.globalAlpha = alpha;
        context.fillStyle = particle.color;
        context.fillRect(pad + x, pad + y, PARTICLE_SIZE, PARTICLE_SIZE);
      });
      if (t < 1) requestAnimationFrame(frame);
      else {
        canvas.remove();
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });

// The open or the close of the place of a button in the bar.
const movePlace = (button, open, run, delay = 0) => {
  const frames = [{ flexGrow: 0, minWidth: 0 }, { flexGrow: 1, minWidth: 0 }];
  const motion = button.animate(frames, {
    duration: PLACE_MS,
    delay,
    easing: 'ease',
    direction: open ? 'normal' : 'reverse',
    fill: 'both',
  });
  run.stops.push(() => motion.cancel());
  return motion.finished.catch(() => {});
};

// The effects of the bar that run, by button. Each entry is the run that a later change cancels.
const navRuns = new Map();

const endRun = (button) => {
  const run = navRuns.get(button);
  if (!run) return;
  run.cancelled = true;
  run.stops.forEach((stop) => stop());
  button.style.opacity = '';
  button.style.overflow = '';
  navRuns.delete(button);
};

// A button that goes breaks into dust, then its place closes. A button that comes back opens its
// place, then its dust comes in and settles (MOD-9).
const runNavEffect = async (button, shown) => {
  const run = { shown, cancelled: false, stops: [] };
  navRuns.set(button, run);
  button.hidden = false;
  button.style.overflow = 'hidden';
  try {
    if (shown) {
      button.style.opacity = '0';
      await movePlace(button, true, run);
      if (run.cancelled) return;
      const picture = await drawButton(button);
      if (run.cancelled) return;
      await playDust(picture, true, run);
    } else {
      const picture = await drawButton(button);
      if (run.cancelled) return;
      button.style.opacity = '0';
      await Promise.all([playDust(picture, false, run), movePlace(button, false, run, DUST_MS * 0.35)]);
    }
  } catch {
    // A picture that cannot be drawn ends the effect: the button takes its place at once.
  }
  if (run.cancelled) return;
  endRun(button);
  button.hidden = !shown;
};

// Shows or hides the button of a section in the bottom bar. With `navMotion` the change is the
// effect of runNavEffect; a button keeps its effect until the effect ends or a change cancels it.
const showNavButton = (button, shown) => {
  const run = navRuns.get(button);
  if (run ? run.shown === shown : shown === !button.hidden) return;
  endRun(button);
  if (!navMotion || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    button.hidden = !shown;
    return;
  }
  runNavEffect(button, shown);
};

// Writes the fixed text of the page, then the text that a render builds.
const applyLanguage = () => {
  document.documentElement.lang = lang;
  document.title = t('app.title');
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-attr]').forEach((node) => {
    node.dataset.i18nAttr.split(',').forEach((pair) => {
      const [name, key] = pair.split(':');
      node.setAttribute(name, t(key));
    });
  });
  const option = (value, text) => el('option', { value, textContent: text, selected: value === (chosen ?? '') });
  $('language').replaceChildren(
    option('', t('settings.automatic')),
    ...LANGUAGES.map((code) => option(code, LANGUAGE_NAMES[code])),
  );
  const handOption = (value, key) => el('option', { value, textContent: t(key), selected: value === hand });
  $('hand').replaceChildren(handOption('right', 'settings.handRight'), handOption('left', 'settings.handLeft'));
  const themeOption = (value, key) => el('option', { value, textContent: t(key), selected: value === theme });
  $('theme').replaceChildren(
    themeOption('system', 'settings.automatic'),
    themeOption('light', 'settings.themeLight'),
    themeOption('dark', 'settings.themeDark'),
  );
  document.querySelectorAll('[data-module]').forEach((box) => {
    box.checked = isOn(box.dataset.module);
  });
  render();
  renderOnboarding();
};

// Onboarding

const renderOnboarding = () => {
  const open = ui.onboarding !== null;
  $('onboarding').hidden = !open;
  // The walkthrough covers the app: no tap, no slide and no focus goes below it.
  document.querySelectorAll('.head, main, .fab, .bnav').forEach((node) => {
    node.inert = open;
  });
  if (!open) return;
  const page = PAGES[ui.onboarding];
  // An SVG element has no `hidden` property, so the attribute is set.
  document.querySelectorAll('#onboarding svg[data-page]').forEach((drawing) => {
    drawing.toggleAttribute('hidden', drawing.dataset.page !== page);
  });
  $('onboarding-title').textContent = t(`onboarding.${page}.title`);
  $('onboarding-text').textContent = t(`onboarding.${page}.text`, { active: t('list.active'), next: t('list.next') });
  $('onboarding-dots').replaceChildren(...PAGES.map((id) => el('span', { className: id === page ? 'on' : '' })));
  $('onboarding-dots').setAttribute('aria-label', t('onboarding.page', { page: ui.onboarding + 1, total: PAGES.length }));
  $('onboarding-skip').hidden = isLast(ui.onboarding);
  $('onboarding-next').textContent = t(isLast(ui.onboarding) ? 'onboarding.start' : 'onboarding.next');
};

const openOnboarding = () => {
  ui.onboarding = 0;
  renderOnboarding();
  $('onboarding-next').focus();
};

// A close marks the walkthrough as seen. With no storage it shows only from Ajustes.
const closeOnboarding = () => {
  ui.onboarding = null;
  if (storage) saveOnboarded(storage);
  renderOnboarding();
  if (ui.view === 'settings') $('show-onboarding').focus();
};

// Shows the next page for 1 and the previous one for -1. The page comes in from its side.
const turnOnboarding = (way) => {
  const index = step(ui.onboarding, way);
  if (index === ui.onboarding) return;
  ui.onboarding = index;
  renderOnboarding();
  // The skip button goes away on the last page, and the focus must not go with it.
  $('onboarding-next').focus();
  const page = $('onboarding-page');
  page.classList.remove('enter-next', 'enter-previous');
  // The read of the width starts the animation again when a change follows another one.
  void page.offsetWidth;
  page.classList.add(way > 0 ? 'enter-next' : 'enter-previous');
};

// Add sheet

const whereText = (item) => {
  const inNextView = item.list === 'next' || (item.bought && (item.recurrent || item.again));
  if (ui.target === 'active') {
    if (item.list === 'next') return say('where.inNextBring', { list: 'next' });
    return t(item.bought ? 'where.boughtRepeat' : 'where.inList');
  }
  if (inNextView) return say('where.inNext', { list: 'next' });
  if (item.bought) return say('where.boughtAddNext', { list: 'next' });
  return say('where.inActiveMove', { list: 'active' });
};

const renderSheet = () => {
  $('sheet').hidden = !ui.sheetOpen;
  if (!ui.sheetOpen) return;
  const forRecipe = ui.view === 'recipes';
  const label = t(forRecipe ? 'add.recipeName' : 'add.itemLabel');
  $('seg').hidden = forRecipe || !isOn('next');
  $('add-submit').textContent = t(forRecipe ? 'add.create' : 'add.submit');
  $('add-name').placeholder = label;
  $('add-name').setAttribute('aria-label', label);
  $('add').setAttribute('aria-label', t(forRecipe ? 'add.recipe' : 'add.item'));
  if (forRecipe) {
    $('suggestions').replaceChildren();
    return;
  }
  document.querySelectorAll('#seg button').forEach((button) => {
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
      el('li', {}, [el('button', { type: 'button', className: 'create', textContent: t('add.createNamed', { name: text }), onclick: submitAdd })]),
    );
  }
  $('suggestions').replaceChildren(...rows);
};

const openSheet = () => {
  Object.assign(ui, { sheetOpen: true, target: ui.view === 'next' && isOn('next') ? 'next' : 'active', openId: null, editingId: null });
  $('add-name').value = '';
  render();
  $('add-name').focus();
};

const closeSheet = () => {
  ui.sheetOpen = false;
  render();
};

// An add closes the search of the list, so that the row that it brings is in view.
const endSearch = () => Object.assign(ui, { searchOpen: false, query: '' });

// The shop that an add from the sheet puts on its item: the shop list in view, if any.
const pickedShop = () => (inList() ? ui.shop[ui.view] : null);

// Puts an item that exists already into the target list, in place of a duplicate. From a shop
// list the item also gets the shop, which is a change too.
const useExisting = (item) => {
  const brought = store.bringToList(state, item.id, ui.target);
  const result = shops.withShop(brought, item.id, pickedShop());
  if (result.state !== brought.state) result.changed = true;
  const params = { name: item.name, list: ui.target };
  $('add-name').value = '';
  if (ui.target === ui.view) ui.flashId = item.id;
  if (!result.error) endSearch();
  if (result.changed) apply(result, { undoText: say('toast.existsNowIn', params) });
  else {
    render();
    showToast(result.error ? textOf(result.error) : say('error.duplicateItem', params));
  }
  $('add-name').focus();
};

const submitRecipe = () => {
  const input = $('add-name');
  const result = recipes.addRecipe(state, input.value);
  if (result.error) {
    showToast(textOf(result.error));
    input.focus();
    return;
  }
  // The new recipe shows expanded, with the cursor in its product field.
  Object.assign(ui, { sheetOpen: false, openRecipeId: result.id, focusProduct: true, query: '' });
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
  const added = store.addItem(state, input.value, ui.target);
  const result = added.error ? added : shops.withShop(added, added.state.items.at(-1).id, pickedShop());
  if (!result.error) endSearch();
  if (apply(result)) {
    input.value = '';
    renderSheet();
    showToast(say('toast.addedTo', { name, list: ui.target }));
  }
  input.focus();
};

// Events

const download = (filename, text) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  el('a', { href: url, download: filename }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Lets the content of the new section come in from the side that it is on in the bottom bar.
const enter = (way) => {
  scroller.classList.remove('enter-next', 'enter-previous');
  if (!way) return;
  // The read of the width starts the animation again when a change follows another one.
  void scroller.offsetWidth;
  scroller.classList.add(way > 0 ? 'enter-next' : 'enter-previous');
};

// A child of the list area that shows later, as a banner does, must not come in from a side.
scroller.addEventListener('animationend', (event) => {
  if (event.animationName === 'enter') scroller.classList.remove('enter-next', 'enter-previous');
});

const showView = (view) => {
  const way = direction(ui.view, view, visibleSections(off));
  // The field is shared: the focus of a list search must not go with it to Recetas.
  $('query').blur();
  Object.assign(ui, { view, editingId: null, openId: null, query: '', searchOpen: false, mealOpen: null });
  render();
  enter(way);
  if (ui.view === 'settings') checkVersion();
};

document.querySelectorAll('.bnav button').forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.view));
});

// A horizontal slide that starts out of the rows changes the section. A row keeps its drag for its
// side menus, and a text field keeps its drag for the selection.
let sectionSlide = null;
document.addEventListener('pointerdown', (event) => {
  sectionSlide = null;
  const sheet = ui.sheetOpen || ui.arrangeOpen || ui.tripOpen || ui.editId !== null || ui.mealOpen !== null;
  if (!event.isPrimary || event.button !== 0 || reorder || sheet) return;
  if (!event.target.closest('.head, main') || event.target.closest('.swipe, .shop-chips, input, textarea')) return;
  sectionSlide = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
});
document.addEventListener('pointerup', (event) => {
  if (sectionSlide?.pointerId !== event.pointerId) return;
  const view = slideTo(ui.view, event.clientX - sectionSlide.x, event.clientY - sectionSlide.y, visibleSections(off));
  sectionSlide = null;
  if (!view) return;
  // The click that follows a slide must not press the button below the finger.
  guardClick();
  showView(view);
});
document.addEventListener('pointercancel', () => {
  sectionSlide = null;
});

$('onboarding-next').addEventListener('click', () => {
  if (isLast(ui.onboarding)) closeOnboarding();
  else turnOnboarding(1);
});
$('onboarding-skip').addEventListener('click', closeOnboarding);
$('show-onboarding').addEventListener('click', openOnboarding);

// A horizontal slide on the walkthrough changes its page, with the measures of the section slide.
let onboardingSlide = null;
$('onboarding').addEventListener('pointerdown', (event) => {
  const primary = event.isPrimary && event.button === 0;
  onboardingSlide = primary ? { pointerId: event.pointerId, x: event.clientX, y: event.clientY } : null;
});
$('onboarding').addEventListener('pointerup', (event) => {
  if (onboardingSlide?.pointerId !== event.pointerId) return;
  const way = slideDirection(event.clientX - onboardingSlide.x, event.clientY - onboardingSlide.y);
  onboardingSlide = null;
  if (!way) return;
  // The click that follows a slide must not press the button below the finger.
  guardClick();
  turnOnboarding(way);
});
$('onboarding').addEventListener('pointercancel', () => {
  onboardingSlide = null;
});

document.querySelectorAll('#seg button').forEach((button) => {
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

// A lifted row follows the finger, so the list must not scroll below it.
document.addEventListener(
  'touchmove',
  (event) => {
    if (reorder) event.preventDefault();
  },
  { passive: false },
);

$('query').addEventListener('input', (event) => {
  Object.assign(ui, { query: event.target.value, editingId: null, openId: null });
  render();
});

const closeSearch = () => {
  endSearch();
  render();
};

// The press must not take the focus out of the field: the blur would close the search, and the
// click would then open it again.
$('search-button').addEventListener('mousedown', (event) => event.preventDefault());
$('search-button').addEventListener('click', () => {
  if (ui.searchOpen) {
    closeSearch();
    return;
  }
  Object.assign(ui, { searchOpen: true, openId: null, editingId: null });
  render();
  $('query').focus();
});
// An empty field of a list that loses the focus closes. The field of Recetas stays.
$('query').addEventListener('blur', () => {
  if (ui.searchOpen && !ui.query.trim()) closeSearch();
});

$('fab').addEventListener('click', openSheet);
$('veil').addEventListener('click', closeSheet);
$('arrange-button').addEventListener('click', () => {
  Object.assign(ui, { arrangeOpen: true, openId: null, editingId: null });
  render();
});
$('arrange-veil').addEventListener('click', () => {
  ui.arrangeOpen = false;
  render();
});
$('edit-veil').addEventListener('click', closeEdit);
// The sheet stays open after a new shop, so that an item gets two shops in one visit.
const submitShop = () => {
  if (apply(shops.addItemShop(state, ui.editId, $('edit-shop').value))) $('edit-shop').value = '';
};
$('edit-form').addEventListener('submit', (event) => {
  event.preventDefault();
  submitShop();
});
// A suggestion that the user picks replaces the text of the field: it adds the shop at once.
$('edit-shop').addEventListener('input', (event) => {
  const picked = event.inputType === 'insertReplacementText' || event.inputType === undefined;
  if (picked && shops.shopSuggestions(state, ui.editId).includes(event.target.value)) submitShop();
});
// A field of the edit sheet saves when it loses the focus. An error keeps the old value in the field.
const bindEditField = (input, field, operation) => {
  const save = () => {
    const item = state.items.find((entry) => entry.id === ui.editId);
    if (!item || input.value.trim() === item[field]) {
      if (item) input.value = item[field];
      return;
    }
    if (!apply(operation(state, item.id, input.value))) input.value = item[field];
  };
  input.addEventListener('blur', save);
  input.addEventListener('keydown', (event) => {
    // Enter saves the field; it does not submit the form, which adds a shop.
    if (event.key === 'Enter') {
      event.preventDefault();
      input.blur();
    }
    // Escape puts the value back and keeps the sheet open.
    if (event.key === 'Escape') {
      event.stopPropagation();
      const item = state.items.find((entry) => entry.id === ui.editId);
      if (item) input.value = item[field];
      input.blur();
    }
  });
};
bindEditField($('edit-name'), 'name', store.renameItem);
bindEditField($('edit-quantity'), 'quantity', store.setQuantity);
// The sheet stays open after a choice, so that the group and the order change in one visit.
document.querySelectorAll('#arrange-group button').forEach((button) => {
  button.addEventListener('click', () => {
    const { group } = button.dataset;
    // A tap on the choice that the view shows changes nothing: the stored choice can be a
    // grouping that only the other list shows.
    if (group === shownGroup() && !ungrouping) return;
    // The rows that stay move to their new place.
    const set = () => {
      const before = rowTops();
      commit(store.setGroup(state, group).state);
      return before;
    };
    // The view can show no group for a choice that it cannot show.
    const flat = shownGroup() === 'none';
    if (group !== 'none' || flat) {
      const opens = group !== 'none' && flat;
      // A tap on a grouping while the groups close keeps them.
      ungrouping = false;
      const before = set();
      // `slide` reads the places after `expand` starts, so the two effects add up to one move.
      if (opens) expand(groupOnlyRows());
      slide(before);
      return;
    }
    if (ungrouping) return;
    ungrouping = true;
    // Show the choice at once; the render after the effect writes the same value.
    document.querySelectorAll('#arrange-group button').forEach((other) => {
      other.setAttribute('aria-pressed', String(other === button));
    });
    // The groups close before the list becomes flat.
    collapse(groupOnlyRows(), () => {
      if (!ungrouping) return;
      ungrouping = false;
      slide(set());
    });
  });
});
document.querySelectorAll('#arrange-sort button').forEach((button) => {
  button.addEventListener('click', () => {
    const before = rowTops();
    commit(store.setSort(state, button.dataset.sort).state);
    slide(before);
  });
});
// The row of shop lists from open to closed. Its padding and its line close with it.
const chipFrames = (row) => {
  const { paddingTop, paddingBottom, borderBottomWidth } = getComputedStyle(row);
  const still = { overflow: 'hidden' };
  return [
    { height: `${row.offsetHeight}px`, paddingTop, paddingBottom, borderBottomWidth, opacity: 1, ...still },
    { height: '0px', paddingTop: '0px', paddingBottom: '0px', borderBottomWidth: '0px', opacity: 0, ...still },
  ];
};

// Ocultar closes the row before the render takes it away, so that the list moves up with it;
// Mostrar opens the row that the render brings back.
const changeShopLists = (choice) => {
  if (choice === shopLists) return;
  setShopLists(choice);
  const row = $('shop-chips');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (choice === 'show' || row.hidden || still) {
    render();
    if (choice === 'show' && !row.hidden && !still) {
      row.animate(chipFrames(row).reverse(), { duration: LEAVE_MS, easing: 'ease-out' });
    }
    return;
  }
  renderArrange();
  const closing = row.animate(chipFrames(row), { duration: LEAVE_MS, easing: 'ease-in', fill: 'forwards' });
  closing.finished.then(() => {
    const before = rowTops();
    render();
    closing.cancel();
    slide(before);
  });
};
document.querySelectorAll('#arrange-lists button').forEach((button) => {
  button.addEventListener('click', () => changeShopLists(button.dataset.lists === 'hide' ? 'hide' : 'show'));
});
$('add-name').addEventListener('input', renderSheet);
$('trip-button').addEventListener('click', () => {
  Object.assign(ui, { tripOpen: true, openId: null, editingId: null });
  render();
  $('finish-menu').focus();
});
const closeTrip = () => {
  ui.tripOpen = false;
  render();
  $('trip-button').focus();
};
$('trip-veil').addEventListener('click', closeTrip);
$('add').addEventListener('submit', (event) => {
  event.preventDefault();
  submitAdd();
});
document.addEventListener('keydown', (event) => {
  if (ui.onboarding !== null) {
    if (event.key === 'Escape') closeOnboarding();
    else if (event.key === 'ArrowRight') turnOnboarding(1);
    else if (event.key === 'ArrowLeft') turnOnboarding(-1);
    return;
  }
  if (event.key !== 'Escape') return;
  endReorder(false);
  if (ui.sheetOpen) closeSheet();
  if (ui.arrangeOpen) {
    ui.arrangeOpen = false;
    render();
  }
  if (ui.editId !== null) closeEdit();
  if (ui.mealOpen !== null) closeMeal();
  if (ui.searchOpen) closeSearch();
  if (ui.tripOpen) closeTrip();
});

$('finish-button').addEventListener('click', () => finishTrip());
$('finish-menu').addEventListener('click', () => finishTrip());
$('bring').addEventListener('click', () => finishTrip(say('toast.brought', { list: 'next' })));

$('toast-undo').addEventListener('click', () => {
  if (!undoState) return;
  const before = new Set(pendingRows().map((node) => node.dataset.id));
  commit(undoState);
  hideToast();
  // The rows that the undo puts back open, as a ticked row closes.
  expand(pendingRows().filter((node) => !before.has(node.dataset.id)));
});

$('menu-fill').addEventListener('click', fillBasket);
$('menu-clear').addEventListener('click', () => apply(menu.clearMenu(state), { undoText: t('toast.menuCleared') }));
$('meal-veil').addEventListener('click', closeMeal);
$('meal-query').addEventListener('input', (event) => {
  ui.mealQuery = event.target.value;
  renderMeal();
});
$('meal-remove').addEventListener('click', () => {
  const { day, meal } = ui.mealOpen;
  const name = menu.menuWeek(state)[day].meals.find((entry) => entry.meal === meal).recipe?.name ?? '';
  ui.mealOpen = null;
  apply(menu.clearMeal(state, day, meal), { undoText: t('toast.mealCleared', { name }) });
});

$('export').addEventListener('click', () => {
  download(exportFilename(new Date()), exportJson(state));
});

$('import').addEventListener('click', () => $('import-file').click());

$('language').addEventListener('change', (event) => {
  setLanguage(event.target.value || null);
  applyLanguage();
});

$('hand').addEventListener('change', (event) => setHand(event.target.value));

$('theme').addEventListener('change', (event) => setTheme(event.target.value));

document.querySelectorAll('[data-module]').forEach((box) => {
  box.addEventListener('change', () => {
    setModules(switchModule(off, box.dataset.module, box.checked));
    // The switch-off of Próxima brings its items to Actual (MOD-6).
    const result = box.dataset.module === 'next' && !box.checked ? store.bringAllToActual(state) : { state };
    setNavMotion(true);
    if (result.state !== state) apply(result, { undoText: say('toast.brought', { list: 'next' }) });
    else render();
    setNavMotion(false);
  });
});

$('update').addEventListener('click', async () => {
  $('update').disabled = true;
  if (await refreshShell()) {
    location.reload();
    return;
  }
  $('update').disabled = false;
  showToast(t('error.updateFailed'));
});

$('import-file').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  event.target.value = '';
  if (!file) return;
  const result = importJson(await file.text());
  if (result.error) {
    showToast(textOf(result.error));
    return;
  }
  const found = {
    items: t('count.items', { count: result.state.items.length }),
    recipes: t('count.recipes', { count: result.state.recipes.length }),
  };
  if (!window.confirm(t('import.confirm', found))) return;
  apply(result, { undoText: t('toast.imported') });
});

applyLanguage();
if (ui.onboarding !== null) $('onboarding-next').focus();
// An automation of the phone opens `?arrival` at the shop. The query goes away, so a reload is silent.
const params = new URLSearchParams(location.search);
if (params.has('arrival')) {
  const message = store.arrivalMessage(state);
  if (message) showToast(textOf(message), { ms: ARRIVAL_MS });
  params.delete('arrival');
  const query = params.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
}
if (!storage) showToast(t('error.noStorage'));
navigator.storage?.persist?.().catch(() => {});
navigator.serviceWorker?.register('./sw.js').catch(() => {});
// Read once at the start: the worker answers from the cache, then stores the file of the next deploy.
readVersion('./version.json').then((running) => {
  ui.version.running = running;
  renderVersion();
});
