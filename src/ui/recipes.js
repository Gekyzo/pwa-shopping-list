import * as store from '#store';
import * as recipes from '#recipes';
import { $, el, state, ui, t, undoState, showToast, apply, render } from '#ui/context';
import { icon, iconButton, bindField } from '#ui/controls';
import { leaveNode } from '#ui/motion';
import { swipeBox } from '#ui/rows';

export const sendText = ({ added, already }) => {
  const parts = [];
  if (added) parts.push(t('send.added', { count: added }));
  if (already) parts.push(t('send.already', { count: already }));
  return parts.join(', ');
};

const sendToList = (recipe) => {
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
        apply(recipes.removeRecipeProduct(state, recipe.id, product), {
          undoText: t('toast.productRemoved', { product, name: recipe.name }),
        }),
      ),
  });
  remove.setAttribute('aria-label', t('recipe.removeProduct', { name: product }));
  const node = el('li', { className: 'product' }, [el('span', { className: 'product-text', textContent: product }), remove]);
  node.dataset.key = key;
  return node;
};

// The product field with the items that match the text below it. A tap on one adds it.
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
    if (apply(recipes.addRecipeProduct(state, recipe.id, name))) {
      input.value = '';
      suggestions.replaceChildren();
    } else ui.bringKeys.clear();
    input.focus();
  };
  input.addEventListener('input', () => {
    const taken = new Set((openRecipeOf()?.products ?? []).map((product) => product.toLowerCase()));
    const rows = store
      .searchItems(state, input.value, Infinity)
      .filter((item) => !taken.has(item.name.toLowerCase()))
      .slice(0, 5)
      .map((item) => el('li', {}, [el('button', { type: 'button', className: 'list-row', textContent: item.name, onclick: () => add(item.name) })]));
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

const linkNode = (recipe) => {
  const link = el('a', { className: 'button icon accent', href: recipe.url, target: '_blank', rel: 'noopener noreferrer' }, [
    icon('link', 'small'),
  ]);
  link.setAttribute('aria-label', t('recipe.openLink', { name: recipe.name }));
  return link;
};

const deleteAction = (recipe, node) =>
  iconButton(
    'trash',
    t('row.delete', { name: recipe.name }),
    () =>
      leaveNode(node.dataset.key, [node], () =>
        apply(recipes.deleteRecipe(state, recipe.id), { undoText: t('toast.recipeDeleted', { name: recipe.name }) }),
      ),
    { variant: 'danger' },
  );

// A recipe row: a tap opens its sheet, a slide to the left shows Eliminar, a slide to the right sends it.
export const recipeNode = (recipe) => {
  const name = el('button', { type: 'button', className: 'item-row-name', onclick: () => openRecipe(recipe) }, [
    el('span', { textContent: recipe.name }),
    el('small', { className: 'item-row-meta', textContent: t('count.products', { count: recipe.products.length }) }),
  ]);
  name.setAttribute('aria-haspopup', 'dialog');
  const row = recipe.url ? [name, linkNode(recipe)] : [name];
  const node = el('li', { className: 'item-row recipe' });
  node.dataset.key = `recipe:${recipe.id}`;
  const right = { run: () => sendToList(recipe), icon: 'cart-add' };
  node.append(swipeBox({ id: recipe.id, row, end: [deleteAction(recipe, node)], right }).box);
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
    return;
  }
  $('recipe-sheet').setAttribute('aria-label', recipe.name);
  if (document.activeElement !== $('recipe-name')) $('recipe-name').value = recipe.name;
  if (document.activeElement !== $('recipe-url')) $('recipe-url').value = recipe.url;
  const products = el('ul', { className: 'products' }, recipe.products.map((product) => productNode(recipe, product)));
  if (shown?.id !== recipe.id || shown.name !== recipe.name) {
    $('recipe-products').replaceChildren(products, productForm(recipe));
  } else if (shown.products !== recipe.products) {
    $('recipe-products').firstChild.replaceWith(products);
  }
  shown = { id: recipe.id, name: recipe.name, products: recipe.products };
};

export const bind = () => {
  $('recipe-veil').addEventListener('click', closeRecipe);
  bindField(
    $('recipe-name'),
    () => openRecipeOf()?.name,
    (value) => apply(recipes.renameRecipe(state, ui.recipeId, value)),
  );
  bindField(
    $('recipe-url'),
    () => openRecipeOf()?.url,
    (value) => {
      const before = openRecipeOf().url;
      const result = recipes.setRecipeUrl(state, ui.recipeId, value);
      // A text that gives the same address, as one with no scheme, changes nothing.
      if (!result.error && result.state.recipes.find((recipe) => recipe.id === ui.recipeId).url === before) return false;
      return apply(result, { undoText: t(value.trim() ? 'toast.linkSaved' : 'toast.linkRemoved') });
    },
  );
};
