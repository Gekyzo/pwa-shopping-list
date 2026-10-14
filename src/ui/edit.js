import * as store from '#store';
import * as shops from '#shops';
import { $, el, state, ui, t, apply, render } from '#ui/context';

export const openEdit = (item) => {
  Object.assign(ui, { editId: item.id, openId: null, editingId: null });
  $('edit-name').value = item.name;
  $('edit-quantity').value = item.quantity;
  $('edit-shop').value = '';
  render();
};

export const closeEdit = () => {
  ui.editId = null;
  render();
};

// A tap on a chip of the edit sheet adds or removes that shop for the item of the sheet.
const toggleShop = (shop) => {
  const item = state.items.find((entry) => entry.id === ui.editId);
  if (!item) return;
  const has = item.shops.some((own) => own.toLowerCase() === shop.toLowerCase());
  apply((has ? shops.removeItemShop : shops.addItemShop)(state, item.id, shop));
};

// The edit sheet of one item: its name, and each shop in use as a chip, pressed when the item has it.
export const renderEdit = () => {
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

// The sheet stays open after a new shop, so that an item gets two shops in one visit.
const submitShop = () => {
  if (apply(shops.addItemShop(state, ui.editId, $('edit-shop').value))) $('edit-shop').value = '';
};
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

export const bind = () => {
  $('edit-veil').addEventListener('click', closeEdit);
  $('edit-form').addEventListener('submit', (event) => {
    event.preventDefault();
    submitShop();
  });
  // A suggestion that the user picks replaces the text of the field: it adds the shop at once.
  $('edit-shop').addEventListener('input', (event) => {
    const picked = event.inputType === 'insertReplacementText' || event.inputType === undefined;
    if (picked && shops.shopSuggestions(state, ui.editId).includes(event.target.value)) submitShop();
  });
  bindEditField($('edit-name'), 'name', store.renameItem);
  bindEditField($('edit-quantity'), 'quantity', store.setQuantity);
};
