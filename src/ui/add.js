import * as store from '#store';
import * as recipes from '#recipes';
import * as shops from '#shops';
import * as barcode from '#barcode';
import { $, el, state, ui, t, say, textOf, showToast, apply, render } from '#ui/context';
import { inList, endSearch } from '#ui/view';
import { openScan } from '#ui/scan';

const whereText = (item) => {
  if (item.list === 'saved') return t('where.saved');
  return t(item.bought ? 'where.boughtRepeat' : 'where.inList');
};

export const renderSheet = () => {
  $('sheet').hidden = !ui.sheetOpen;
  if (!ui.sheetOpen) return;
  const forRecipe = ui.view === 'recipes';
  if (forRecipe) ui.pendingCode = null;
  const label = t(forRecipe ? 'add.recipeName' : ui.pendingCode ? 'scan.name' : 'add.itemLabel');
  $('add-scan').hidden = forRecipe || !ui.scan;
  $('add-submit').textContent = t(forRecipe ? 'add.create' : 'add.submit');
  $('add-name').placeholder = label;
  $('add-name').setAttribute('aria-label', label);
  $('add').setAttribute('aria-label', t(forRecipe ? 'add.recipe' : 'add.item'));
  if (forRecipe) {
    $('suggestions').replaceChildren();
    return;
  }
  const text = $('add-name').value.trim();
  const rows = store.searchItems(state, text).map((item) =>
    el('li', {}, [
      el('button', { type: 'button', className: 'list-row', onclick: () => useExisting(item) }, [
        el('span', { className: 'list-row-text', textContent: item.name }),
        el('span', { className: 'list-row-meta', textContent: whereText(item) }),
      ]),
    ]));
  if (text && !store.findByName(state, text)) {
    rows.push(
      el('li', {}, [el('button', { type: 'button', className: 'list-row accent', textContent: t('add.createNamed', { name: text }), onclick: submitAdd })]),
    );
  }
  $('suggestions').replaceChildren(...rows);
};

export const openSheet = () => {
  Object.assign(ui, { sheetOpen: true, openId: null });
  $('add-name').value = '';
  render();
  $('add-name').focus();
};

export const closeSheet = () => {
  Object.assign(ui, { sheetOpen: false, pendingCode: null });
  render();
};

// The scanned code that waits for a name also gets the name of the item of the add (CODE-10).
const withCode = (result, name) => {
  if (result.error || !ui.pendingCode) return result;
  const learned = barcode.learnCode(result.state, ui.pendingCode, name);
  if (learned.error) return result;
  ui.pendingCode = null;
  return { ...result, state: learned.state, learned: learned.state !== result.state };
};

// The shop that an add from the sheet puts on its item: the shop list in view, if any.
const pickedShop = () => (inList() ? ui.shop : null);

// Puts an item that exists already into Compra, in place of a duplicate. From a shop list the item
// also gets the shop, which is a change too.
const useExisting = (item) => {
  const brought = store.bringToList(state, item.id);
  const shopped = shops.withShop(brought, item.id, pickedShop());
  if (shopped.state !== brought.state) shopped.changed = true;
  const result = withCode(shopped, item.name);
  const params = { name: item.name, list: 'active' };
  $('add-name').value = '';
  ui.flashId = item.id;
  if (!result.error) endSearch();
  if (result.changed) apply(result, { undoText: say('toast.existsNowIn', params) });
  else if (result.learned) {
    apply(result);
    showToast(t('toast.codeLearned', { name: item.name }));
  } else {
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
  const name = input.value.trim();
  const added = store.addItem(state, input.value);
  const result = added.error ? added : withCode(shops.withShop(added, added.state.items.at(-1).id, pickedShop()), name);
  if (!result.error) endSearch();
  if (apply(result)) {
    input.value = '';
    renderSheet();
    showToast(say('toast.addedTo', { name, list: 'active' }));
  }
  input.focus();
};

// A known code does the add of its name (ADD-5); an unknown one waits for the name of the next add.
const useCode = (code) => {
  const input = $('add-name');
  const name = barcode.nameOfCode(state, code);
  ui.pendingCode = null;
  if (name) {
    input.value = name;
    submitAdd();
    return;
  }
  ui.pendingCode = code;
  input.value = '';
  render();
  showToast(t('toast.codeNew'));
  input.focus();
};

export const bind = () => {
  $('fab').addEventListener('click', openSheet);
  $('add-scan').addEventListener('click', () => openScan(useCode));
  $('veil').addEventListener('click', closeSheet);
  $('add-name').addEventListener('input', renderSheet);
  $('add').addEventListener('submit', (event) => {
    event.preventDefault();
    submitAdd();
  });
};
