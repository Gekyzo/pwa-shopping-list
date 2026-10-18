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

// The rows keep their nodes while the count of aisles stays, and each handler reads the aisle of
// its row when it runs: the blur of a renamed field renders between the press and the click of the
// next tap, and a new node would lose that click.
const step = (index, by) => {
  const button = el('button', { type: 'button', className: 'button icon', textContent: by < 0 ? '↑' : '↓' });
  button.addEventListener('click', () => apply(aisles.moveAisle(state, state.aisles[index], by)));
  return button;
};

// One aisle: its name field, which renames it on blur or Enter, the two moves and the delete.
const aisleNode = (_, index) => {
  const input = el('input', { type: 'text', className: 'input', maxLength: 40, enterKeyHint: 'done' });
  input.setAttribute('autocapitalize', 'sentences');
  bindField(input, () => state.aisles[index], (value) => apply(aisles.renameAisle(state, state.aisles[index], value)));
  const remove = el('button', { type: 'button', className: 'button icon', textContent: '✕' });
  remove.addEventListener('click', () => {
    const name = state.aisles[index];
    apply(aisles.deleteAisle(state, name), { undoText: t('toast.aisleDeleted', { name }) });
  });
  return el('li', { className: 'product' }, [el('div', { className: 'input-row' }, [input, step(index, -1), step(index, 1), remove])]);
};

// Writes the aisle of each row: the name of a field that is not in edit, the labels, the ends.
const fillRow = (row, index) => {
  const aisle = state.aisles[index];
  const [input, up, down, remove] = row.querySelectorAll('input, button');
  if (document.activeElement !== input) input.value = aisle;
  input.setAttribute('aria-label', t('aisles.name', { name: aisle }));
  up.setAttribute('aria-label', t('aisles.up', { name: aisle }));
  down.setAttribute('aria-label', t('aisles.down', { name: aisle }));
  remove.setAttribute('aria-label', t('aisles.delete', { name: aisle }));
  up.disabled = index === 0;
  down.disabled = index === state.aisles.length - 1;
};

// The row of Ajustes shows the count; the sheet lists each aisle, in the order of the walk.
export const renderAisles = () => {
  $('aisles-count').textContent = state.aisles.length ? String(state.aisles.length) : '';
  $('aisles').hidden = !ui.aislesOpen;
  if (!ui.aislesOpen) return;
  const none = state.aisles.length === 0;
  $('aisles-empty').hidden = !none;
  $('aisles-usual').hidden = !none;
  const list = $('aisles-list');
  if (list.children.length !== state.aisles.length) list.replaceChildren(...state.aisles.map(aisleNode));
  [...list.children].forEach(fillRow);
  syncSubmit();
};

// Añadir stays disabled while the field has no text.
const syncSubmit = () => {
  $('aisles-submit').disabled = !$('aisles-new').value.trim();
};

export const bind = () => {
  $('aisles-open').addEventListener('click', openAisles);
  $('aisles-veil').addEventListener('click', closeAisles);
  // The sheet stays open after an add, so that the user writes the aisles one after another.
  $('aisles-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (apply(aisles.addAisle(state, $('aisles-new').value))) $('aisles-new').value = '';
    syncSubmit();
    $('aisles-new').focus();
  });
  $('aisles-new').addEventListener('input', syncSubmit);
  $('aisles-usual').addEventListener('click', () => {
    apply(aisles.addDefaultAisles(state, USUAL.map((key) => t(`aisles.usual.${key}`))));
    $('aisles-new').focus();
  });
};
