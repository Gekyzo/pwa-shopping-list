import * as store from '#store';
import * as recipes from '#recipes';
import * as shops from '#shops';
import { $, el, state, ui, t, say, textOf, isOn, showToast, apply, render } from '#ui/context';
import { inList, endSearch } from '#ui/view';

const whereText = (item) => {
  const inNextView = item.list === 'next' || (item.bought && (item.recurrent || item.again));
  if (ui.target === 'active') {
    if (item.list === 'next') return say('where.inNextBring', { list: 'next' });
    return t(item.bought ? 'where.boughtRepeat' : 'where.inList');
  }
  if (inNextView) return say('where.inNext', { list: 'next' });
  if (item.bought) return say('where.boughtAddNext', { list: 'next' });
  return say('where.inActiveMove', { list: 'active' });
};

export const renderSheet = () => {
  $('sheet').hidden = !ui.sheetOpen;
  if (!ui.sheetOpen) return;
  const forRecipe = ui.view === 'recipes';
  const label = t(forRecipe ? 'add.recipeName' : 'add.itemLabel');
  $('seg').hidden = forRecipe || !isOn('next');
  $('add-submit').textContent = t(forRecipe ? 'add.create' : 'add.submit');
  $('add-name').placeholder = label;
  $('add-name').setAttribute('aria-label', label);
  $('add').setAttribute('aria-label', t(forRecipe ? 'add.recipe' : 'add.item'));
  if (forRecipe) {
    $('suggestions').replaceChildren();
    return;
  }
  document.querySelectorAll('#seg button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.target === ui.target));
  });
  const text = $('add-name').value.trim();
  const rows = store.searchItems(state, text).map((item) =>
    el('li', {}, [
      el('button', { type: 'button', onclick: () => useExisting(item) }, [
        el('span', { className: 'suggestion-name', textContent: item.name }),
        el('span', { className: 'suggestion-where', textContent: whereText(item) }),
      ]),
    ]));
  if (text && !store.findByName(state, text)) {
    rows.push(
      el('li', {}, [el('button', { type: 'button', className: 'create', textContent: t('add.createNamed', { name: text }), onclick: submitAdd })]),
    );
  }
  $('suggestions').replaceChildren(...rows);
};

const openSheet = () => {
  Object.assign(ui, { sheetOpen: true, target: ui.view === 'next' && isOn('next') ? 'next' : 'active', openId: null, editingId: null });
  $('add-name').value = '';
  render();
  $('add-name').focus();
};

export const closeSheet = () => {
  ui.sheetOpen = false;
  render();
};

// The shop that an add from the sheet puts on its item: the shop list in view, if any.
const pickedShop = () => (inList() ? ui.shop[ui.view] : null);

// Puts an item that exists already into the target list, in place of a duplicate. From a shop
// list the item also gets the shop, which is a change too.
const useExisting = (item) => {
  const brought = store.bringToList(state, item.id, ui.target);
  const result = shops.withShop(brought, item.id, pickedShop());
  if (result.state !== brought.state) result.changed = true;
  const params = { name: item.name, list: ui.target };
  $('add-name').value = '';
  if (ui.target === ui.view) ui.flashId = item.id;
  if (!result.error) endSearch();
  if (result.changed) apply(result, { undoText: say('toast.existsNowIn', params) });
  else {
    render();
    showToast(result.error ? textOf(result.error) : say('error.duplicateItem', params));
  }
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
  // The new recipe shows expanded, with the cursor in its product field.
  Object.assign(ui, { sheetOpen: false, openRecipeId: result.id, focusProduct: true, query: '' });
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
  const name = input.value.trim();
  const added = store.addItem(state, input.value, ui.target);
  const result = added.error ? added : shops.withShop(added, added.state.items.at(-1).id, pickedShop());
  if (!result.error) endSearch();
  if (apply(result)) {
    input.value = '';
    renderSheet();
    showToast(say('toast.addedTo', { name, list: ui.target }));
  }
  input.focus();
};

export const bind = () => {
  document.querySelectorAll('#seg button').forEach((button) => {
    button.addEventListener('click', () => {
      ui.target = button.dataset.target;
      renderSheet();
      $('add-name').focus();
    });
  });
  $('fab').addEventListener('click', openSheet);
  $('veil').addEventListener('click', closeSheet);
  $('add-name').addEventListener('input', renderSheet);
  $('add').addEventListener('submit', (event) => {
    event.preventDefault();
    submitAdd();
  });
};
