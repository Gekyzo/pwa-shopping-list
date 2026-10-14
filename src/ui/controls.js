import * as store from '#store';
import { el, state, ui, t, apply, render } from '#ui/context';
import { isOpen } from '#ui/view';

export const renameInput = (entry, rename = (name) => store.renameItem(state, entry.id, name)) => {
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

export const moreButton = (item, groupId = null) => {
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

export const actionButton = (text, onClick, className = '') =>
  el('button', { type: 'button', textContent: text, className, onclick: onClick });

const SVG_NS = 'http://www.w3.org/2000/svg';

// A line icon, drawn as the icons of the bottom menu are.
export const icon = (d) => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  svg.append(path);
  return svg;
};

export const ICONS = {
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
export const iconButton = (d, label, onClick, className = '') => {
  const button = el('button', { type: 'button', className, title: label, onclick: onClick }, [icon(d)]);
  button.setAttribute('aria-label', label);
  return button;
};

export const startRename = (entry) => {
  Object.assign(ui, { editingId: entry.id, openId: null });
  render();
};
