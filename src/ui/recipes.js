import * as store from '#store';
import * as recipes from '#recipes';
import { $, el, state, ui, t, undoState, showToast, apply, render } from '#ui/context';
import { renameInput, moreButton, actionButton, icon, startRename } from '#ui/controls';
import { expand, leaveNode } from '#ui/motion';

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
  // A second tap changes nothing: keep the undo of the send that is still on the screen.
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
  const add = (name) => {
    // The render builds a new field; `focusProduct` keeps the keyboard open for the next product.
    ui.focusProduct = true;
    ui.bringKeys.add(`product:${recipe.id}:${name.trim().toLowerCase()}`);
    if (apply(recipes.addRecipeProduct(state, recipe.id, name))) return;
    ui.bringKeys.clear();
    ui.focusProduct = false;
    input.focus();
  };
  const suggestions = el('ul', { className: 'list-group plain' });
  suggestions.setAttribute('aria-label', t('add.existing'));
  const taken = new Set(recipe.products.map((product) => product.toLowerCase()));
  input.addEventListener('input', () => {
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

const editLink = (recipe) => {
  const text = window.prompt(t('recipe.linkPrompt', { name: recipe.name }), recipe.url);
  if (text === null) return;
  ui.openId = null;
  if (text.trim() === recipe.url) render();
  else apply(recipes.setRecipeUrl(state, recipe.id, text), { undoText: t(text.trim() ? 'toast.linkSaved' : 'toast.linkRemoved') });
};

const linkNode = (recipe) => {
  const link = el('a', { className: 'button icon accent', href: recipe.url, target: '_blank', rel: 'noopener noreferrer' }, [
    icon('link'),
  ]);
  link.setAttribute('aria-label', t('recipe.openLink', { name: recipe.name }));
  return link;
};

const bodyKey = (id) => `recipe-body:${id}`;
const bodyNode = (id) => $('items').querySelector(`[data-key="${bodyKey(id)}"]`);

// A tap closes the open recipe, then opens the tapped one. Each change slides.
const toggleRecipe = (recipe) => {
  const before = ui.openRecipeId;
  const show = () => {
    Object.assign(ui, { openRecipeId: before === recipe.id ? null : recipe.id, openId: null });
    render();
    if (ui.openRecipeId) expand([bodyNode(ui.openRecipeId)].filter(Boolean));
  };
  const open = before && bodyNode(before);
  if (open) leaveNode(bodyKey(before), [open], show);
  else show();
};

export const recipeNode = (recipe) => {
  const open = ui.openRecipeId === recipe.id;
  let name;
  if (ui.editingId === recipe.id) name = renameInput(recipe, (value) => recipes.renameRecipe(state, recipe.id, value));
  else {
    name = el(
      'button',
      {
        type: 'button',
        className: 'item-row-name',
        onclick: () => toggleRecipe(recipe),
      },
      [
        el('span', { textContent: recipe.name }),
        el('small', { className: 'item-row-meta', textContent: t('count.products', { count: recipe.products.length }) }),
      ],
    );
    name.setAttribute('aria-expanded', String(open));
  }
  const send = el('button', { type: 'button', className: 'button primary icon', onclick: () => sendToList(recipe) }, [icon('cart-add')]);
  send.setAttribute('aria-label', t('recipe.send', { name: recipe.name }));
  const row = recipe.url ? [name, linkNode(recipe), send, moreButton(recipe)] : [name, send, moreButton(recipe)];
  const node = el('li', { className: 'item-row recipe' }, [el('div', { className: 'item-row-body' }, row)]);
  node.dataset.key = `recipe:${recipe.id}`;
  if (ui.openId === recipe.id) {
    const remove = actionButton(
      t('recipe.delete'),
      () =>
        leaveNode(node.dataset.key, [node], () =>
          apply(recipes.deleteRecipe(state, recipe.id), { undoText: t('toast.recipeDeleted', { name: recipe.name }) }),
        ),
      { variant: 'outline danger' },
    );
    const link = actionButton(t('recipe.link'), () => editLink(recipe));
    node.append(el('div', { className: 'row-actions' }, [actionButton(t('recipe.rename'), () => startRename(recipe)), link, remove]));
  }
  if (open) {
    const body = el('div', { className: 'recipe-body' }, [
      el('ul', { className: 'products' }, recipe.products.map((product) => productNode(recipe, product))),
      productForm(recipe),
    ]);
    body.dataset.key = bodyKey(recipe.id);
    node.append(body);
  }
  return node;
};
