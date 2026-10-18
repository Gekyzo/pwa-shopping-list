import { SAVED_MS, changedState, savedChange } from '#sheets';
import { el, state, apply } from '#ui/context';

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

// A button of a side menu: an icon, with the name of the action for a screen reader. `labelled`
// also shows the name below the icon.
export const iconButton = (name, label, onClick, { variant = '', labelled = false } = {}) => {
  const children = [icon(name), ...(labelled ? [el('span', { className: 'swipe-action-label', textContent: label })] : [])];
  const button = el('button', { type: 'button', className: ['swipe-action', variant].join(' '), title: label, onclick: onClick }, children);
  if (!labelled) button.setAttribute('aria-label', label);
  return button;
};

// Guardado shows in the foot of `sheet` for SAVED_MS. A new save starts the time again.
const savedTimers = new WeakMap();
export const flashSaved = (sheet) => {
  const note = sheet.querySelector('.sheet-saved');
  if (!note) return;
  clearTimeout(savedTimers.get(note));
  note.classList.add('on');
  savedTimers.set(note, setTimeout(() => note.classList.remove('on'), SAVED_MS));
};

// A closed sheet shows no Guardado: a reopen within SAVED_MS starts clean.
export const clearSaved = (sheet) => {
  const note = sheet.querySelector('.sheet-saved');
  if (!note) return;
  clearTimeout(savedTimers.get(note));
  savedTimers.delete(note);
  note.classList.remove('on');
};

// Applies an operation of a sheet, as `apply`, and shows Guardado when it changed the state.
export const applySaved = (sheet, result, options) => {
  const changed = changedState(state, result);
  const applied = apply(result, options);
  if (applied && changed) flashSaved(sheet);
  return applied;
};

// A field of a sheet saves when it loses the focus. `read` gives the stored value, or undefined
// when the sheet has no entry; `write` applies a new value and returns false on an error, which
// keeps the old value in the field. `onSaved` runs when the write changed the stored value.
export const bindField = (input, { read, write, onSaved = () => {} }) => {
  input.addEventListener('blur', () => {
    const value = read();
    if (value === undefined) return;
    if (input.value.trim() !== value) {
      const written = write(input.value);
      if (savedChange(value, read(), !written)) onSaved();
      if (written) return;
    }
    input.value = read() ?? value;
  });
  input.addEventListener('keydown', (event) => {
    // Enter saves the field; it does not submit a form.
    if (event.key === 'Enter') {
      event.preventDefault();
      input.blur();
    }
    // Escape puts the value back and keeps the sheet open.
    if (event.key === 'Escape') {
      event.stopPropagation();
      input.value = read() ?? input.value;
      input.blur();
    }
  });
};
