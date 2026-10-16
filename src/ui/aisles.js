import * as aisles from '#aisles';
import { $, el, state, ui, t, apply, render } from '#ui/context';
import { bindField } from '#ui/controls';

// The usual aisles, in the order of a walk through a common supermarket (AISLE-8).
const USUAL = ['produce', 'bakery', 'meat', 'dairy', 'pantry', 'drinks', 'frozen', 'cleaning'];

export const openAisles = () => {
  Object.assign(ui, { aislesOpen: true, openId: null });
  $('aisles-new').value = '';
  render();
};

export const closeAisles = () => {
  ui.aislesOpen = false;
  render();
  $('aisles-open').focus();
};

const step = (aisle, label, by, disabled) => {
  const button = el('button', { type: 'button', className: 'button icon', textContent: by < 0 ? '↑' : '↓', disabled });
  button.addEventListener('click', () => apply(aisles.moveAisle(state, aisle, by)));
  button.setAttribute('aria-label', t(label, { name: aisle }));
  return button;
};

// One aisle: its name field, which renames it on blur or Enter, the two moves and the delete.
const aisleNode = (aisle, index) => {
  const input = el('input', { type: 'text', className: 'input', value: aisle, maxLength: 40, enterKeyHint: 'done' });
  input.setAttribute('autocapitalize', 'sentences');
  input.setAttribute('aria-label', t('aisles.name', { name: aisle }));
  const current = () => (state.aisles.includes(aisle) ? aisle : undefined);
  bindField(input, current, (value) => apply(aisles.renameAisle(state, aisle, value)));
  const remove = el('button', {
    type: 'button',
    className: 'button icon',
    textContent: '✕',
    onclick: () => apply(aisles.deleteAisle(state, aisle), { undoText: t('toast.aisleDeleted', { name: aisle }) }),
  });
  remove.setAttribute('aria-label', t('aisles.delete', { name: aisle }));
  const last = index === state.aisles.length - 1;
  return el('li', { className: 'product' }, [
    el('div', { className: 'input-row' }, [input, step(aisle, 'aisles.up', -1, index === 0), step(aisle, 'aisles.down', 1, last), remove]),
  ]);
};

// The row of Ajustes shows the count; the sheet lists each aisle, in the order of the walk.
export const renderAisles = () => {
  $('aisles-count').textContent = state.aisles.length ? String(state.aisles.length) : '';
  $('aisles').hidden = !ui.aislesOpen;
  if (!ui.aislesOpen) return;
  const none = state.aisles.length === 0;
  $('aisles-empty').hidden = !none;
  $('aisles-usual').hidden = !none;
  $('aisles-list').replaceChildren(...state.aisles.map(aisleNode));
};

export const bind = () => {
  $('aisles-open').addEventListener('click', openAisles);
  $('aisles-veil').addEventListener('click', closeAisles);
  // The sheet stays open after an add, so that the user writes the aisles one after another.
  $('aisles-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (apply(aisles.addAisle(state, $('aisles-new').value))) $('aisles-new').value = '';
    $('aisles-new').focus();
  });
  $('aisles-usual').addEventListener('click', () => {
    apply(aisles.addDefaultAisles(state, USUAL.map((key) => t(`aisles.usual.${key}`))));
    $('aisles-new').focus();
  });
};
