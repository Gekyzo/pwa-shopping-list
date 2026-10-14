import * as store from '#store';
import { el, state, ui, t, apply, render } from '#ui/context';
import { isOpen } from '#ui/view';

export const renameInput = (entry, rename = (name) => store.renameItem(state, entry.id, name)) => {
  const input = el('input', { type: 'text', className: 'input rename', value: entry.name, maxLength: 80 });
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
    className: 'button icon',
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

export const actionButton = (text, onClick, { variant = 'outline' } = {}) =>
  el('button', { type: 'button', textContent: text, className: ['button', variant].join(' '), onclick: onClick });

const SVG_NS = 'http://www.w3.org/2000/svg';

// A line icon of icons.svg.
export const icon = (name, variant = '') => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', variant ? `icon ${variant}` : 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `icons.svg#${name}`);
  svg.append(use);
  return svg;
};

let sprite = null;

// The shapes of a symbol, for a copy of an icon that must stand alone, such as a data: image.
export const symbolNodes = async (name) => {
  sprite ??= fetch('icons.svg')
    .then((response) => response.text())
    .then((text) => new DOMParser().parseFromString(text, 'image/svg+xml'));
  const symbol = (await sprite).getElementById(name);
  return symbol ? [...symbol.childNodes].map((node) => node.cloneNode(true)) : [];
};

// A button of a side menu: an icon, with the name of the action for a screen reader.
export const iconButton = (name, label, onClick, { variant = '' } = {}) => {
  const button = el('button', { type: 'button', className: variant, title: label, onclick: onClick }, [icon(name)]);
  button.setAttribute('aria-label', label);
  return button;
};

export const startRename = (entry) => {
  Object.assign(ui, { editingId: entry.id, openId: null });
  render();
};
