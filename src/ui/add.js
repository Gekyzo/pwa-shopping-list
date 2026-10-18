import * as store from '#store';
import * as recipes from '#recipes';
import * as shops from '#shops';
import { suggestionRows } from '#suggest';
import { $, el, state, ui, t, say, textOf, showToast, apply, render } from '#ui/context';
import { inList, endSearch } from '#ui/view';

const whereText = (item) => {
  if (item.list === 'saved') return t('where.saved');
  return t(item.bought ? 'where.boughtRepeat' : 'where.inList');
};

export const renderSheet = () => {
  $('sheet').hidden = !ui.sheetOpen;
  if (!ui.sheetOpen) return;
  const forRecipe = ui.view === 'recipes';
  const label = t(forRecipe ? 'add.recipeName' : 'add.itemLabel');
  $('add-title').textContent = label;
  $('add-submit').textContent = t(forRecipe ? 'add.create' : 'add.submit');
  $('add-name').placeholder = label;
  $('add-name').setAttribute('aria-label', label);
  $('add').setAttribute('aria-label', t(forRecipe ? 'add.recipe' : 'add.item'));
  const text = $('add-name').value.trim();
  $('add-submit').disabled = !text;
  if (forRecipe) {
    $('suggestions').replaceChildren();
    return;
  }
  // The array runs from the best row to the worst; the list shows it upside down, so that the
  // first row sits next to the input.
  const rows = suggestionRows(state, text).map((row) => el('li', {}, [
    row.kind === 'create'
      ? el('button', { type: 'button', className: 'list-row accent', textContent: t('add.createNamed', { name: text }), onclick: submitAdd })
      : el('button', { type: 'button', className: 'list-row', onclick: () => useExisting(row.item) }, [
        el('span', { className: 'list-row-text', textContent: row.item.name }),
        el('span', { className: 'list-row-meta', textContent: whereText(row.item) }),
      ]),
  ]));
  $('suggestions').replaceChildren(...rows.reverse());
};

// The text under the input that says why an add did nothing. The next input clears it.
const setHelp = (text) => {
  $('add-help').textContent = text;
  $('add-help').hidden = !text;
  if (text) $('add-name').setAttribute('aria-invalid', 'true');
  else $('add-name').removeAttribute('aria-invalid');
};

export const openSheet = () => {
  Object.assign(ui, { sheetOpen: true, openId: null });
  $('add-name').value = '';
  setHelp('');
  render();
  $('add-name').focus();
};

export const closeSheet = () => {
  ui.sheetOpen = false;
  render();
};

// The shop that an add from the sheet puts on its item: the shop list in view, if any.
const pickedShop = () => (inList() ? ui.shop : null);

// Puts an item that exists already into Compra, in place of a duplicate. From a shop list the item
// also gets the shop, which is a change too.
const useExisting = (item) => {
  const brought = store.bringToList(state, item.id);
  const result = shops.withShop(brought, item.id, pickedShop());
  if (result.state !== brought.state) result.changed = true;
  if (!result.changed) {
    // Nothing changed: the text stays, and the help under the input says why. With no sheet, a toast.
    if (result.error) showToast(textOf(result.error));
    else if (!ui.sheetOpen) showToast(t('add.duplicate', { name: item.name }));
    else setHelp(t('add.duplicate', { name: item.name }));
    $('add-name').focus();
    return;
  }
  $('add-name').value = '';
  setHelp('');
  ui.flashId = item.id;
  endSearch();
  apply(result, { undoText: say('toast.existsNowIn', { name: item.name, list: 'active' }) });
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
  // The new recipe opens its sheet, with the cursor in its product field.
  Object.assign(ui, { sheetOpen: false, recipeId: result.id, focusProduct: true, query: '' });
  ui.bringKeys.add(`recipe:${result.id}`);
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
  if (addNew(input.value)) {
    input.value = '';
    setHelp('');
    renderSheet();
  }
  input.focus();
};

// Adds a name that is not in the list, with the toast of the add. True when it was added.
const addNew = (text) => {
  const name = text.trim();
  const added = store.addItem(state, text);
  const result = added.error ? added : shops.withShop(added, added.state.items.at(-1).id, pickedShop());
  if (!result.error) endSearch();
  if (!apply(result)) return false;
  showToast(say('toast.addedTo', { name, list: 'active' }));
  return true;
};

// The action of the empty state of a search with no match: adds the searched name, and the search ends.
export const addQuery = () => {
  const existing = store.findByName(state, ui.query);
  if (existing) useExisting(existing);
  else addNew(ui.query);
};

export const bind = () => {
  $('fab').addEventListener('click', openSheet);
  $('veil').addEventListener('click', closeSheet);
  $('add-name').addEventListener('input', () => {
    setHelp('');
    renderSheet();
  });
  $('add').addEventListener('submit', (event) => {
    event.preventDefault();
    submitAdd();
  });
};
