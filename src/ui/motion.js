import { LEAVE_MS, $, ui } from '#ui/context';

// Closes rows of the list, then runs `done`.
export const collapse = (nodes, done) => {
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
export const expand = (nodes) => {
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

export const pendingRows = () => [...$('items').querySelectorAll('.item-row:not(.bought)')].filter((node) => node.dataset.id);

// The top of each row to buy. The key has the place of the row among the rows of its item,
// so that the first row of an item of two recipes is the row of the flat list.
export const rowTops = () => {
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
export const slide = (before) => {
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

// Closes `nodes`, then runs `done`. `key` names the row in `ui.leaving`, so that a second tap in
// that time does nothing.
export const leaveNode = (key, nodes, done) => {
  if (ui.leaving.has(key)) return;
  ui.leaving.add(key);
  collapse(nodes, () => {
    ui.leaving.delete(key);
    done();
  });
};

// Closes the rows of an item, then runs `done`. An item of two recipes has two rows.
export const leave = (item, done) => {
  const rows = [...$('items').querySelectorAll('.item-row')].filter((node) => node.dataset.id === item.id);
  leaveNode(item.id, rows, done);
};

// The rows that the flat list does not have: the group heads, and each row after the first of an item.
export const groupOnlyRows = () => {
  const seen = new Set();
  return [...$('items').querySelectorAll('.group-head, .item-row:not(.bought)')].filter((node) => {
    if (node.classList.contains('group-head')) return true;
    const again = seen.has(node.dataset.id);
    seen.add(node.dataset.id);
    return again;
  });
};

// The lists whose rows open and close when a change of the state or a section adds or removes them.
const ROW_LISTS = ['items', 'recipe-products'];

// A row is the same row when it has the same list, the same item or key, and the same tick.
// The first row of an item stands for the item: a second row of it, in a second group, is the
// part of a change of grouping, which arrange.js moves.
const rowKey = (list, node) => `${list}|${node.dataset.id ?? node.dataset.key}|${node.classList.contains('bought')}`;

// The rows of the lists, in screen order, before a render. `animateRows` compares them after it.
export const snapshotRows = () => {
  const rows = new Map();
  for (const list of ROW_LISTS) {
    for (const node of $(list).querySelectorAll('li[data-id], li[data-key]')) {
      const key = rowKey(list, node);
      if (!rows.has(key)) rows.set(key, node);
    }
  }
  return rows;
};

// After a render: a new row opens, and a row that is gone stays in its place and closes. A row
// that its own motion has already closed (`leaving`) or that `bringIn` opens (`flash`) is left alone.
export const animateRows = (before) => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const after = snapshotRows();
  expand([...after].filter(([key, node]) => !before.has(key) && !node.classList.contains('flash')).map(([, node]) => node));
  const old = [...before];
  old.forEach(([key, node], index) => {
    if (after.has(key) || node.classList.contains('leaving') || node.isConnected) return;
    // The ghost goes before the next row that is still there, or after the row before it.
    const next = old.slice(index + 1).find(([other]) => after.has(other));
    const previous = old.slice(0, index).reverse().find(([other]) => after.has(other));
    if (next) after.get(next[0]).before(node);
    else if (previous) after.get(previous[0]).after(node);
    else return;
    node.inert = true;
    node.style.pointerEvents = 'none';
    const still = { minHeight: 0, overflow: 'hidden' };
    node.animate(
      [
        { height: `${node.offsetHeight}px`, opacity: 1, ...still },
        { height: '0px', opacity: 0, ...still },
      ],
      { duration: LEAVE_MS, easing: 'ease-out' },
    ).finished.then(() => node.remove(), () => node.remove());
  });
};

// The keys of the recipe and product rows on the screen, in the list and in the recipe sheet.
export const rowKeys = () => new Set([...document.querySelectorAll('[data-key]')].map((node) => node.dataset.key));

// Flashes the rows of `keys` and opens them. A row inside another row of `keys` only flashes: it
// opens with the row around it.
export const flash = (keys) =>
  document.querySelectorAll('[data-key]').forEach((node) => keys.has(node.dataset.key) && node.classList.add('flash'));

export const bringIn = (keys) => {
  const nodes = [...document.querySelectorAll('[data-key]')].filter((node) => keys.has(node.dataset.key));
  nodes.forEach((node) => node.classList.add('flash'));
  expand(nodes.filter((node) => !nodes.some((other) => other !== node && other.contains(node))));
};
