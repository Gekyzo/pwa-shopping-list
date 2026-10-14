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

export const pendingRows = () => [...$('items').querySelectorAll('.item:not(.bought)')].filter((node) => node.dataset.id);

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

// Closes the rows of an item, then runs `done`. An item of two recipes has two rows.
export const leave = (item, done) => {
  if (ui.leaving.has(item.id)) return;
  ui.leaving.add(item.id);
  const rows = [...$('items').querySelectorAll('.item')].filter((node) => node.dataset.id === item.id);
  collapse(rows, () => {
    ui.leaving.delete(item.id);
    done();
  });
};

// The rows that the flat list does not have: the group heads, and each row after the first of an item.
export const groupOnlyRows = () => {
  const seen = new Set();
  return [...$('items').querySelectorAll('.group-head, .item:not(.bought)')].filter((node) => {
    if (node.classList.contains('group-head')) return true;
    const again = seen.has(node.dataset.id);
    seen.add(node.dataset.id);
    return again;
  });
};
