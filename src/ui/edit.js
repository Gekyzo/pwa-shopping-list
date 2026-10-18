import * as store from '#store';
import * as shops from '#shops';
import * as aisles from '#aisles';
import { $, el, state, ui, t, apply, render } from '#ui/context';
import { bindField, flashSaved, applySaved, clearSaved } from '#ui/controls';

export const openEdit = (item) => {
  Object.assign(ui, { editId: item.id, openId: null });
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
  applySaved($('edit-form'), (has ? shops.removeItemShop : shops.addItemShop)(state, item.id, shop));
};

// The edit sheet of one item: its name, and each shop in use as a chip, pressed when the item has it.
export const renderEdit = () => {
  const item = state.items.find((entry) => entry.id === ui.editId);
  $('edit').hidden = !item;
  if (!item) {
    clearSaved($('edit-form'));
    return;
  }
  $('edit-title').textContent = item.name;
  $('edit-form').setAttribute('aria-label', t('edit.title'));
  if (document.activeElement !== $('edit-name')) $('edit-name').value = item.name;
  if (document.activeElement !== $('edit-quantity')) $('edit-quantity').value = item.quantity;
  $('edit-repeat').checked = item.recurrent;
  const own = new Set(item.shops.map((shop) => shop.toLowerCase()));
  const names = shops.shopNames(state);
  // The chips stay when the shops in use do not change: the blur of the name field renders
  // between the press and the click of a chip, and a new chip would lose that click.
  const box = $('edit-chips');
  if ([...box.children].map((chip) => chip.textContent).join('\n') !== names.join('\n')) {
    box.replaceChildren(...names.map((shop) => el('button', { type: 'button', className: 'chip', textContent: shop, onclick: () => toggleShop(shop) })));
  }
  for (const chip of box.children) chip.setAttribute('aria-pressed', String(own.has(chip.textContent.toLowerCase())));
  $('edit-empty').hidden = names.length > 0;
  // The field completes a typed name with a shop in use.
  $('edit-shops').replaceChildren(...shops.shopSuggestions(state, item.id).map((shop) => el('option', { value: shop })));
  renderAisleChips(item);
  syncShopSubmit();
};

// A tap on the chip of the aisle of the item clears it; a tap on another chip sets that aisle.
const pickAisle = (aisle) => {
  const item = state.items.find((entry) => entry.id === ui.editId);
  if (item) applySaved($('edit-form'), aisles.setItemAisle(state, item.id, item.aisle === aisle ? '' : aisle));
};

// One chip for each aisle, in the order of the walk, as the shop chips stay through a blur.
const renderAisleChips = (item) => {
  const box = $('edit-aisles');
  if ([...box.children].map((chip) => chip.textContent).join('\n') !== state.aisles.join('\n')) {
    box.replaceChildren(...state.aisles.map((aisle) => el('button', { type: 'button', className: 'chip', textContent: aisle, onclick: () => pickAisle(aisle) })));
  }
  for (const chip of box.children) chip.setAttribute('aria-pressed', String(chip.textContent === item.aisle));
  $('edit-aisles-empty').hidden = state.aisles.length > 0;
};

// Añadir stays disabled while the field has no text, as Añadir of the add sheet does.
const syncShopSubmit = () => {
  $('edit-shop-submit').disabled = !$('edit-shop').value.trim();
};

// The sheet stays open after a new shop, so that an item gets two shops in one visit.
const submitShop = () => {
  if (applySaved($('edit-form'), shops.addItemShop(state, ui.editId, $('edit-shop').value))) $('edit-shop').value = '';
  syncShopSubmit();
};
const editItem = () => state.items.find((entry) => entry.id === ui.editId);

// Eliminar of the foot deletes the item, with Deshacer, and closes the sheet.
const deleteItem = () => {
  const item = editItem();
  if (!item) return;
  // The render of the delete closes the sheet: its item is gone.
  if (apply(store.deleteItem(state, item.id), { undoText: t('toast.deleted', { name: item.name }) })) ui.editId = null;
};

export const bind = () => {
  $('edit-veil').addEventListener('click', closeEdit);
  $('edit-form').addEventListener('submit', (event) => {
    event.preventDefault();
    submitShop();
  });
  // A suggestion that the user picks replaces the text of the field: it adds the shop at once.
  $('edit-shop').addEventListener('input', (event) => {
    syncShopSubmit();
    const picked = event.inputType === 'insertReplacementText' || event.inputType === undefined;
    if (picked && shops.shopSuggestions(state, ui.editId).includes(event.target.value)) submitShop();
  });
  $('edit-delete').addEventListener('click', deleteItem);
  // The switch sets the recurrence of the item (LIST-7), as Repetir of the slide does.
  $('edit-repeat').addEventListener('change', () => {
    if (editItem()) applySaved($('edit-form'), store.toggleRecurrent(state, ui.editId));
  });
  const onSaved = () => flashSaved($('edit-form'));
  bindField($('edit-name'), { read: () => editItem()?.name, write: (value) => apply(store.renameItem(state, ui.editId, value)), onSaved });
  bindField($('edit-quantity'), { read: () => editItem()?.quantity, write: (value) => apply(store.setQuantity(state, ui.editId, value)), onSaved });
};
