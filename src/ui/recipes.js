import * as recipes from '#recipes';
import * as menu from '#menu';
import { $, el, state, ui, t, undoState, showToast, apply, render } from '#ui/context';
import { icon, iconButton, bindField, flashSaved, applySaved, clearSaved } from '#ui/controls';
import { leaveNode } from '#ui/motion';
import { swipeBox } from '#ui/rows';

export const sendText = ({ added, already }) => {
  const parts = [];
  if (added) parts.push(t('send.added', { count: added }));
  if (already) parts.push(t('send.already', { count: already }));
  return parts.join(', ');
};

export const sendToList = (recipe) => {
  const result = recipes.sendRecipe(state, recipe.id);
  if (result.error || result.state !== state) {
    apply(result, { undoText: t('toast.sent', { name: recipe.name, summary: sendText(result) }) });
  }
  // A second send changes nothing: keep the undo of the send that is still on the screen.
  else showToast(t('toast.sentNothing', { name: recipe.name }), { undo: undoState });
};

const productNode = (recipe, product) => {
  const key = `product:${recipe.id}:${product.toLowerCase()}`;
  const remove = el('button', {
    type: 'button',
    className: 'button icon',
    textContent: '✕',
    onclick: () =>
      leaveNode(key, [node], () =>
        applySaved($('recipe-sheet'), recipes.removeRecipeProduct(state, recipe.id, product), {
          undoText: t('toast.productRemoved', { product, name: recipe.name }),
        }),
      ),
  });
  remove.setAttribute('aria-label', t('recipe.removeProduct', { name: product }));
  const node = el('li', { className: 'product' }, [el('span', { className: 'product-text', textContent: product }), remove]);
  node.dataset.key = key;
  return node;
};

// The product field with the items and the products of the recipes that match the text below it
// (REC-10). A tap on one adds it.
const productForm = (recipe) => {
  const input = el('input', {
    type: 'text',
    className: 'input product-name',
    maxLength: 80,
    placeholder: t('recipe.addProduct'),
    enterKeyHint: 'done',
  });
  input.setAttribute('autocapitalize', 'sentences');
  input.setAttribute('aria-label', t('recipe.addProductTo', { name: recipe.name }));
  const suggestions = el('ul', { className: 'list-group plain' });
  suggestions.setAttribute('aria-label', t('add.existing'));
  // The field stays through the renders of the sheet: it is empty and keeps the focus after an add.
  const add = (name) => {
    ui.bringKeys.add(`product:${recipe.id}:${name.trim().toLowerCase()}`);
    if (applySaved($('recipe-sheet'), recipes.addRecipeProduct(state, recipe.id, name))) {
      input.value = '';
      suggestions.replaceChildren();
    } else ui.bringKeys.clear();
    input.focus();
  };
  input.addEventListener('input', () => {
    const rows = recipes
      .productSuggestions(state, recipe.id, input.value)
      .map((name) => el('li', {}, [el('button', { type: 'button', className: 'list-row', textContent: name, onclick: () => add(name) })]));
    suggestions.replaceChildren(...rows);
  });
  const form = el('form', { className: 'input-row product-form', autocomplete: 'off' }, [
    input,
    el('button', { type: 'submit', className: 'button primary', textContent: t('add.submit') }),
  ]);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    add(input.value);
  });
  return el('div', { className: 'product-add' }, [form, suggestions]);
};

// The send button at the end of a recipe row. It is out of the name and runs what the slide to the
// right runs.
const sendButton = (recipe) => {
  const button = el('button', { type: 'button', className: 'button icon', title: t('recipe.send'), onclick: () => sendToList(recipe) }, [icon('cart-add')]);
  button.setAttribute('aria-label', t('recipe.send'));
  return button;
};

// Its visible name is Eliminar; a screen reader also hears the name of the recipe.
const deleteAction = (recipe, node) => {
  const button = iconButton(
    'trash',
    t('sheet.delete'),
    () =>
      leaveNode(node.dataset.key, [node], () =>
        apply(recipes.deleteRecipe(state, recipe.id), { undoText: t('toast.recipeDeleted', { name: recipe.name }) }),
      ),
    { variant: 'danger', labelled: true },
  );
  button.setAttribute('aria-label', t('row.delete', { name: recipe.name }));
  return button;
};

// A recipe row: a tap on the name opens its sheet, the send button stays at the end, a slide to the
// left shows Eliminar, and a slide to the right sends it.
export const recipeNode = (recipe) => {
  const meta = [
    t('count.products', { count: recipe.products.length }),
    ...(recipes.inList(state, recipe) ? [t('recipe.inListShort')] : []),
    ...(recipe.url ? [t('recipe.hasLink')] : []),
  ];
  const name = el('button', { type: 'button', className: 'item-row-name', onclick: () => openRecipe(recipe) }, [
    el('span', { className: 'item-row-label', textContent: recipe.name }),
    el('small', { className: 'item-row-meta', textContent: meta.join(' · ') }),
  ]);
  name.setAttribute('aria-haspopup', 'dialog');
  const row = [name, el('div', { className: 'item-row-end' }, [sendButton(recipe)])];
  const node = el('li', { className: 'item-row recipe' });
  node.dataset.key = `recipe:${recipe.id}`;
  const right = { run: () => sendToList(recipe), icon: 'cart-add' };
  node.append(swipeBox({ id: recipe.id, row, end: [deleteAction(recipe, node)], right }).box);
  return node;
};

// A dish of the menu with no recipe becomes a recipe, and its sheet opens for the products. `show`
// runs between the two, to change the section.
export const recipeFromDish = (name, show = () => {}) => {
  const result = menu.dishRecipe(state, name);
  if (!apply(result, { undoText: t('toast.recipeCreated', { name }) })) return;
  show();
  openRecipe(state.recipes.find((recipe) => recipe.id === result.id));
};

// A row of a dish of the menu with no recipe: a tap on the name or on the end button creates its
// recipe.
export const dishNode = ({ name, meals }) => {
  const label = t('row.createRecipe', { name });
  const create = () => recipeFromDish(name);
  const nameButton = el('button', { type: 'button', className: 'item-row-name', onclick: create }, [
    el('span', { className: 'item-row-label', textContent: name }),
    el('small', { className: 'item-row-meta', textContent: t('count.menuMeals', { count: meals }) }),
  ]);
  const end = el('button', { type: 'button', className: 'button icon', title: t('menu.toRecipe'), onclick: create }, [icon('book')]);
  end.setAttribute('aria-label', label);
  // The layers of a recipe row with no side menu: the dish has no slide.
  const body = el('div', { className: 'item-row-body' }, [nameButton, el('div', { className: 'item-row-end' }, [end])]);
  const node = el('li', { className: 'item-row dish' }, [el('div', { className: 'item-row-swipe' }, [body])]);
  node.dataset.key = `dish:${name.toLowerCase()}`;
  return node;
};

// The sheet of one recipe

const openRecipeOf = () => state.recipes.find((recipe) => recipe.id === ui.recipeId);

export const openRecipe = (recipe) => {
  Object.assign(ui, { recipeId: recipe.id, openId: null, openSide: null });
  render();
};

export const closeRecipe = () => {
  ui.recipeId = null;
  render();
};

// The products part is built again only when the recipe or its products change: a render between
// the press and the click of a suggestion must not lose the click.
let shown = null;

export const renderRecipe = () => {
  const recipe = openRecipeOf();
  $('recipe').hidden = !recipe;
  if (!recipe) {
    shown = null;
    clearSaved($('recipe-sheet'));
    return;
  }
  $('recipe-sheet').setAttribute('aria-label', recipe.name);
  $('recipe-title').textContent = recipe.name;
  if (document.activeElement !== $('recipe-name')) $('recipe-name').value = recipe.name;
  if (document.activeElement !== $('recipe-url')) $('recipe-url').value = recipe.url;
  const open = $('recipe-open');
  open.hidden = !recipe.url;
  open.href = recipe.url || '#';
  open.setAttribute('aria-label', t('recipe.openLink', { name: recipe.name }));
  open.title = t('recipe.openLink', { name: recipe.name });
  const products = el('ul', { className: 'products' }, recipe.products.map((product) => productNode(recipe, product)));
  if (shown?.id !== recipe.id || shown.name !== recipe.name) {
    $('recipe-products').replaceChildren(products, productForm(recipe));
  } else if (shown.products !== recipe.products) {
    $('recipe-products').firstChild.replaceWith(products);
  }
  shown = { id: recipe.id, name: recipe.name, products: recipe.products };
};

// Eliminar of the foot deletes the recipe, with Deshacer, and closes the sheet.
const deleteOpenRecipe = () => {
  const recipe = openRecipeOf();
  if (!recipe) return;
  // The render of the delete closes the sheet: its recipe is gone.
  if (apply(recipes.deleteRecipe(state, recipe.id), { undoText: t('toast.recipeDeleted', { name: recipe.name }) })) ui.recipeId = null;
};

export const bind = () => {
  $('recipe-veil').addEventListener('click', closeRecipe);
  $('recipe-delete').addEventListener('click', deleteOpenRecipe);
  const onSaved = () => flashSaved($('recipe-sheet'));
  bindField($('recipe-name'), {
    read: () => openRecipeOf()?.name,
    write: (value) => apply(recipes.renameRecipe(state, ui.recipeId, value)),
    onSaved,
  });
  bindField($('recipe-url'), {
    read: () => openRecipeOf()?.url,
    write: (value) => {
      const before = openRecipeOf().url;
      const result = recipes.setRecipeUrl(state, ui.recipeId, value);
      // A text that gives the same address, as one with no scheme, changes nothing.
      if (!result.error && result.state.recipes.find((recipe) => recipe.id === ui.recipeId).url === before) return false;
      return apply(result, { undoText: t(value.trim() ? 'toast.linkSaved' : 'toast.linkRemoved') });
    },
    onSaved,
  });
};
