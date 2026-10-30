import * as recipes from '#recipes';
import * as menu from '#menu';
import { listOf, listPart } from '#lists';
import { $, el, state, ui, t, undoState, showToast, apply, render, onOwn, onListOf } from '#ui/context';
import { icon, iconButton, bindField, flashSaved, applySaved, clearSaved } from '#ui/controls';
import { leaveNode } from '#ui/motion';
import { swipeBox, tagNode } from '#ui/rows';
import { recipeTag } from '#ui/view';

// REC-38: an operation on a recipe runs in the list that holds it, so its items, its `sent` and
// its name rule stay in that list.
const onRecipe = (recipe, op) => onListOf(listOf(recipe), op);
const recipeOf = (id) => state.recipes.find((recipe) => recipe.id === id);

export const sendText = ({ added, already }) => {
  const parts = [];
  if (added) parts.push(t('send.added', { count: added }));
  if (already) parts.push(t('send.already', { count: already }));
  return parts.join(', ');
};

export const sendToList = (recipe) => {
  const result = onRecipe(recipe, (part) => recipes.sendRecipe(part, recipe.id));
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
        applySaved($('recipe-sheet'), onRecipe(recipe, (part) => recipes.removeRecipeProduct(part, recipe.id, product)), {
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
    if (applySaved($('recipe-sheet'), onRecipe(recipe, (part) => recipes.addRecipeProduct(part, recipe.id, name)))) {
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

// The link button of a recipe row, before its send button: it opens the video, or the page, of the
// recipe out of the app (REC-15).
const linkButton = (recipe, link) => {
  const label = t(link.video ? 'recipe.watchLink' : 'recipe.openLink', { name: recipe.name });
  const anchor = el('a', { className: 'button icon', href: recipe.url, target: '_blank', rel: 'noopener noreferrer', title: label, draggable: false }, [
    icon(link.video ? 'play' : 'link'),
  ]);
  anchor.setAttribute('aria-label', label);
  return anchor;
};

// Its visible name is Eliminar; a screen reader also hears the name of the recipe.
const deleteAction = (recipe, node) => {
  const button = iconButton(
    'trash',
    t('sheet.delete'),
    () =>
      leaveNode(node.dataset.key, [node], () =>
        apply(onRecipe(recipe, (part) => recipes.deleteRecipe(part, recipe.id)), { undoText: t('toast.recipeDeleted', { name: recipe.name }) }),
      ),
    { variant: 'danger', labelled: true },
  );
  button.setAttribute('aria-label', t('row.delete', { name: recipe.name }));
  return button;
};

// A recipe row: a tap on the name opens its sheet, the link button and the send button stay at the
// end, a slide to the left shows Eliminar, and a slide to the right sends it.
export const recipeNode = (recipe) => {
  const meta = [
    t('count.products', { count: recipe.products.length }),
    // REC-38: a recipe is in the list that its send fills.
    ...(recipes.inList(listPart(state, listOf(recipe)), recipe) ? [t('recipe.inListShort')] : []),
  ];
  const name = el('button', { type: 'button', className: 'item-row-name', onclick: () => openRecipe(recipe) }, [
    el('span', { className: 'item-row-label', textContent: recipe.name }),
    el('small', { className: 'item-row-meta', textContent: meta.join(' · ') }),
  ]);
  name.setAttribute('aria-haspopup', 'dialog');
  const tag = recipeTag(recipe);
  const link = recipes.linkInfo(recipe.url);
  const end = [...(tag === null ? [] : [tagNode(tag)]), ...(link ? [linkButton(recipe, link)] : []), sendButton(recipe)];
  const row = [name, el('div', { className: 'item-row-end' }, end)];
  const node = el('li', { className: 'item-row recipe' });
  node.dataset.key = `recipe:${recipe.id}`;
  const right = { run: () => sendToList(recipe), icon: 'cart-add' };
  node.append(swipeBox({ id: recipe.id, row, end: [deleteAction(recipe, node)], right }).box);
  return node;
};

// A dish of the menu with no recipe becomes a recipe, and its sheet opens for the products. `show`
// runs between the two, to change the section. REC-38: the recipe goes to the list of the dish, so
// that its meals keep a recipe of their own list: a dish of the own menu gives an own recipe.
export const recipeFromDish = (name, which = 'own', show = () => {}) => {
  const result = onListOf(which, (part) => menu.dishRecipe(part, name));
  if (!apply(result, { undoText: t('toast.recipeCreated', { name }) })) return;
  show();
  openRecipe(recipeOf(result.id));
};

// A row of a dish of the menu with no recipe: a tap on the name or on the end button creates its
// recipe. `which` is the list of the menu that holds the dish.
export const dishNode = ({ name, meals }, which = 'own') => {
  const label = t('row.createRecipe', { name });
  const create = () => recipeFromDish(name, which);
  const nameButton = el('button', { type: 'button', className: 'item-row-name', onclick: create }, [
    el('span', { className: 'item-row-label', textContent: name }),
    el('small', { className: 'item-row-meta', textContent: t('count.menuMeals', { count: meals }) }),
  ]);
  const end = el('button', { type: 'button', className: 'button icon', title: t('menu.toRecipe'), onclick: create }, [icon('book')]);
  end.setAttribute('aria-label', label);
  const tag = recipeTag({ shared: which === 'shared' });
  // The layers of a recipe row with no side menu: the dish has no slide.
  const body = el('div', { className: 'item-row-body' }, [nameButton, el('div', { className: 'item-row-end' }, tag === null ? [end] : [tagNode(tag), end])]);
  const node = el('li', { className: 'item-row dish' }, [el('div', { className: 'item-row-swipe' }, [body])]);
  node.dataset.key = which === 'shared' ? `dish:shared:${name.toLowerCase()}` : `dish:${name.toLowerCase()}`;
  return node;
};

// The sheet of one recipe

const openRecipeOf = () => recipeOf(ui.recipeId);

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
  // The row of the open recipe is marked; from 840px it stands beside the pane (REC-39).
  document.querySelectorAll('.item-row.recipe').forEach((node) => {
    node.classList.toggle('current', node.dataset.key === `recipe:${recipe?.id}`);
  });
  if (!recipe) {
    shown = null;
    clearSaved($('recipe-sheet'));
    return;
  }
  $('recipe-sheet').setAttribute('aria-label', recipe.name);
  $('recipe-title').textContent = recipe.name;
  if (document.activeElement !== $('recipe-name')) $('recipe-name').value = recipe.name;
  if (document.activeElement !== $('recipe-url')) $('recipe-url').value = recipe.url;
  // The link card above the field Enlace (REC-15). Its title and its host are its name.
  const link = recipes.linkInfo(recipe.url);
  const open = $('recipe-open');
  open.hidden = !link;
  open.href = link ? recipe.url : '#';
  open.replaceChildren(
    ...(link
      ? [
          icon(link.video ? 'play' : 'link'),
          el('span', { className: 'link-card-text' }, [
            el('span', { className: 'link-card-title', textContent: t(link.video ? 'recipe.watch' : 'recipe.openSite') }),
            el('small', { className: 'link-card-host', textContent: link.host }),
          ]),
          icon('external', 'small'),
        ]
      : []),
  );
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
  if (apply(onRecipe(recipe, (part) => recipes.deleteRecipe(part, recipe.id)), { undoText: t('toast.recipeDeleted', { name: recipe.name }) })) ui.recipeId = null;
};

export const bind = () => {
  $('recipe-veil').addEventListener('click', closeRecipe);
  $('recipe-delete').addEventListener('click', deleteOpenRecipe);
  const onSaved = () => flashSaved($('recipe-sheet'));
  bindField($('recipe-name'), {
    read: () => openRecipeOf()?.name,
    write: (value) => {
      // A sync can take the recipe away while its sheet is open.
      const recipe = openRecipeOf();
      if (!recipe) return false;
      return apply(onRecipe(recipe, (part) => recipes.renameRecipe(part, recipe.id, value)));
    },
    onSaved,
  });
  bindField($('recipe-url'), {
    read: () => openRecipeOf()?.url,
    write: (value) => {
      const recipe = openRecipeOf();
      if (!recipe) return false;
      const result = onRecipe(recipe, (part) => recipes.setRecipeUrl(part, recipe.id, value));
      // A text that gives the same address, as one with no scheme, changes nothing.
      if (!result.error && result.state.recipes.find((entry) => entry.id === ui.recipeId).url === recipe.url) return false;
      return apply(result, { undoText: t(value.trim() ? 'toast.linkSaved' : 'toast.linkRemoved') });
    },
    onSaved,
  });
};
