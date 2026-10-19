import * as store from '#store';
import * as recipes from '#recipes';
import * as shops from '#shops';
import * as aisles from '#aisles';
import * as menu from '#menu';
import { emptyAction } from '#sections';
import { $, el, state, ui, t, shopLists, tripEnd, apply, render } from '#ui/context';
import { inList, viewState, found, searching, shownGroup, endSearch } from '#ui/view';
import { icon } from '#ui/controls';
import { itemNode, boughtSection, groupHead, groupNodes, hintSwipe } from '#ui/rows';
import { recipeNode, dishNode, sendToList } from '#ui/recipes';
import { dayNode } from '#ui/menu';
import { openSheet, addQuery } from '#ui/add';
import { showView } from '#ui/nav';

// `keep` holds the ids of the open items that stay in Compra (TRIP-6).
const finishTrip = (undoText = t('toast.finished'), keep = []) => {
  if (!apply(store.startNewShopping(state, keep), { undoText })) return;
  Object.assign(ui, { view: 'active', openId: null, tripOpen: false });
  render();
};

// The ids of the open items that stay in Compra with the choice of Ajustes (TRIP-6, TRIP-7).
const keptItems = () => (tripEnd === 'keep' ? store.openItems(state).map((item) => item.id) : []);

const groupCount = ({ left, total }) => (left ? `${total - left}/${total}` : '✓');

// The rows of the list below the shop of each item. A row of a shop has the group id `shop:<name>`.
const shopNodes = () => {
  const { groups, rest } = store.filterGroups(shops.shopGroups(viewState()), ui.query);
  const grouped = groups.flatMap((group) => {
    const key = `shop:${group.shop}`;
    return [groupHead(group.shop, groupCount(group), key), ...groupNodes(key, group.items.map((item) => itemNode(item, key)))];
  });
  const others = rest.length ? [groupHead(t('group.noShop'), '', 'noShop'), ...groupNodes('noShop', rest.map((item) => itemNode(item)))] : [];
  return [...grouped, ...others];
};

// The rows of the list below the aisle of each item, in the order of the walk. A row of an aisle
// has the group id `aisle:<name>`, so that it moves only inside its aisle.
const aisleNodes = () => {
  const { groups, rest } = store.filterGroups(aisles.aisleGroups(viewState()), ui.query);
  const grouped = groups.flatMap((group) => {
    const key = `aisle:${group.aisle}`;
    return [groupHead(group.aisle, groupCount(group), key), ...groupNodes(key, group.items.map((item) => itemNode(item, key)))];
  });
  const others = rest.length ? [groupHead(t('group.noAisle'), '', 'noAisle'), ...groupNodes('noAisle', rest.map((item) => itemNode(item)))] : [];
  return [...grouped, ...others];
};

// The items of Compra still to buy: flat, below the recipe that asks for each one, below the shop
// of each one, or below the aisle of each one.
const pendingNodes = () => {
  const group = shownGroup();
  if (group === 'shop') return shopNodes();
  if (group === 'aisle') return aisleNodes();
  if (group === 'none') {
    return store.activeItems(viewState()).filter((item) => !item.bought && found(item)).map((item) => itemNode(item));
  }
  const view = recipes.recipeGroups(viewState());
  // The shared items come from the groups before the search, so a search keeps the mark.
  const shared = recipes.sharedItems(view);
  const also = (item, recipe) => (shared.get(item.id) ?? []).filter((name) => name !== recipe.name);
  const { groups, rest } = store.filterGroups(view, ui.query);
  const grouped = groups.flatMap(({ recipe, items, total, left }) => [
    groupHead(recipe.name, groupCount({ left, total }), recipe.id),
    ...groupNodes(recipe.id, items.map((item) => itemNode(item, recipe.id, also(item, recipe)))),
  ]);
  const others = rest.length ? [groupHead(t('group.others'), '', 'others'), ...groupNodes('others', rest.map((item) => itemNode(item)))] : [];
  return [...grouped, ...others];
};

const listNodes = (items) => {
  const bought = items.filter((item) => item.bought && found(item));
  return bought.length ? [...pendingNodes(), ...boughtSection(bought)] : pendingNodes();
};

// One part for each place an item goes, in this order; a part with no item does not show (TRIP-4).
const OUTCOMES = [['recurrent', 'repeat'], ['kept', 'cart'], ['open', 'download'], ['bought', 'check']];

const outcomeRows = () => {
  const outcome = store.tripOutcome(state, keptItems());
  return OUTCOMES.filter(([key]) => outcome[key] > 0).map(([key, name]) => ({ icon: name, text: t(`outcome.${key}`, { count: outcome[key] }) }));
};

const finishText = () => outcomeRows().map(({ text }) => text).join(' · ');

// The subtitle of Compra holds the full figures; the ring holds the count left.
const activeSubtitle = ({ total, left }) => {
  if (!total) return t('header.empty');
  if (!left) return t('header.allBought');
  return t('header.bought', { done: total - left, count: total });
};

const activeRing = ({ total, left }) => (total && !left ? '✓' : String(left));

export const headerOf = (summary) => {
  // Ajustes has no figure: its ring does not show.
  if (ui.view === 'settings') return { title: t('nav.settings'), subtitle: t('header.settingsSubtitle'), ring: null, pct: 0 };
  if (ui.view === 'menu') {
    const count = menu.mealCount(state);
    const subtitle = count ? t('header.menuMeals', { count }) : t('header.noMeals');
    return { title: t('nav.menu'), subtitle, ring: String(count), pct: 0 };
  }
  if (ui.view === 'recipes') {
    const count = state.recipes.length;
    const subtitle = count ? t('count.recipes', { count }) : t('header.noRecipes');
    return { title: t('nav.recipes'), subtitle, ring: String(count), pct: 0 };
  }
  const { total, left } = summary;
  const pct = total ? Math.round(((total - left) / total) * 100) : 0;
  return { title: t('header.today'), subtitle: activeSubtitle(summary), ring: activeRing(summary), pct };
};

// The button text of each action of an empty section.
const ACTION_KEYS = { 'create-recipe': 'empty.createRecipe', 'add-query': 'empty.addQuery', 'add-item': 'empty.addItem', 'add-sample': 'empty.addSample' };

let emptyRun = null;
let secondaryRun = null;

// The title, the text and the action buttons of an empty section (STATE-1). With no action the add
// button of the screen is the action, and the buttons of the state stay hidden.
const renderEmpty = (shown) => {
  $('empty').hidden = !shown;
  const sample = state.recipes.find((recipe) => recipe.id === recipes.SAMPLE_ID);
  const { title, text, action, secondary } = emptyAction(ui.view, { query: ui.query, hasRecipes: state.recipes.length > 0 || menu.menuDishes(state).length > 0, sample: Boolean(sample) });
  const params = { query: ui.query.trim(), recipe: sample?.name ?? '' };
  $('empty-title').hidden = !title;
  $('empty-title').textContent = title ? t(title) : '';
  $('empty-text').textContent = text ? t(text, params) : '';
  $('empty-action').hidden = !shown || !action;
  $('empty-action').textContent = action ? t(ACTION_KEYS[action], params) : '';
  $('empty-secondary').hidden = !shown || !secondary;
  $('empty-secondary').textContent = secondary ? t(ACTION_KEYS[secondary], params) : '';
  const runs = {
    'create-recipe': openSheet,
    'add-query': addQuery,
    'add-item': openSheet,
    'add-sample': () => sendToList(sample),
  };
  emptyRun = runs[action] ?? null;
  secondaryRun = runs[secondary] ?? null;
};

// One field serves the three sections: Recetas shows it when it has a recipe, and a list shows it
// after a tap on the search button, which a list with no item does not have.
const renderSearch = (items, searchable) => {
  const canOpen = inList() && items.length > 0;
  if (!canOpen) ui.searchOpen = false;
  const shown = searchable || ui.searchOpen;
  if (!shown) ui.query = '';
  $('search-button').hidden = !canOpen;
  $('search-button').setAttribute('aria-expanded', String(ui.searchOpen));
  $('search').hidden = !shown;
  const label = t(inList() ? 'search.items' : 'recipes.search');
  $('query').placeholder = label;
  $('query').setAttribute('aria-label', label);
  // The field is not built again by a render, so it keeps the cursor. Write it only after a reset.
  if ($('query').value !== ui.query) $('query').value = ui.query;
};

// The recipes, then the dishes of the menu with no recipe under their head.
const recipeNodes = () => {
  const dishes = menu.menuDishes(state, ui.query);
  const head = dishes.length ? [groupHead(t('recipes.dishes'), String(dishes.length))] : [];
  return [...recipes.searchRecipes(state, ui.query).map(recipeNode), ...head, ...dishes.map(dishNode)];
};

const nodesOf = (items) => {
  if (ui.view === 'settings') return [];
  // With no recipe the week still shows: a meal can hold a dish.
  if (ui.view === 'menu') return menu.menuWeek(state).map(dayNode);
  return ui.view === 'recipes' ? recipeNodes() : listNodes(items);
};

// A shop list of Compra with nothing to buy, while other items are still to buy, points to the
// next shop list that has some.
const renderShopDone = (summary) => {
  const shop = ui.shop;
  const done = ui.view === 'active' && shop !== null && !searching() && summary.left > 0 &&
    store.tripSummary(viewState()).left === 0;
  $('shop-done').hidden = !done;
  if (!done) return;
  const next = shops.nextShop(state, shop);
  $('shop-done-text').textContent = t('shops.done', { shop: shopLabel(shop) });
  $('shop-done-next').hidden = next === null;
  if (next) $('shop-done-next').textContent = t('shops.next', { shop: shopLabel(next.shop), count: next.count });
  $('shop-done-next').onclick = () => {
    ui.shop = next.shop;
    render();
  };
  $('shop-done-all').onclick = () => {
    ui.shop = null;
    render();
  };
};

export const renderList = (summary) => {
  const scoped = viewState();
  const items = ui.view === 'active' ? store.activeItems(scoped) : [];
  const searchable = ui.view === 'recipes' && (state.recipes.length > 0 || menu.menuDishes(state).length > 0);
  renderSearch(items, searchable);
  const nodes = nodesOf(items);
  $('items').hidden = ui.view === 'settings';
  $('items').replaceChildren(...nodes);
  if (ui.view === 'active') hintSwipe();

  renderEmpty(ui.view !== 'settings' && nodes.length === 0);

  $('menu-actions').hidden = ui.view !== 'menu';

  $('finish').hidden = !(ui.view === 'active' && ui.shop === null && summary.total > 0 && summary.left === 0);
  renderShopDone(summary);
  $('finish-text').textContent = finishText();
};

// The trip button of the header and its sheet.
export const renderTrip = () => {
  if (ui.view !== 'active') ui.tripOpen = false;
  const inMenu = ui.view === 'menu';
  $('trip-button').hidden = ui.view !== 'active' && !inMenu;
  // One button, two sheets: the trip options in Compra, the menu options in Menú.
  $('trip-button').setAttribute('aria-label', t(inMenu ? 'menu.more' : 'trip.menu'));
  $('trip-button').setAttribute('aria-controls', inMenu ? 'menu-more' : 'trip');
  $('finish-menu').disabled = !store.canStartNewShopping(state);
  $('trip-button').setAttribute('aria-expanded', String(inMenu ? ui.menuMoreOpen : ui.tripOpen));
  $('trip').hidden = !ui.tripOpen;
  $('trip-outcomes').replaceChildren(...outcomeRows().map(({ icon: name, text }) => el('li', { className: 'list-row' }, [
    icon(name),
    el('span', { className: 'list-row-text', textContent: text }),
  ])));
  $('trip-open').hidden = store.openItems(state).length === 0;
};

export const shopLabel = (shop) => (shop === null ? t('shops.all') : shop === '' ? t('group.noShop') : shop);

// The row of the shop lists of Compra. A count is the items to buy.
export const renderShopChips = () => {
  const chips = inList() && shopLists === 'show' ? shops.shopChips(state) : [];
  $('shop-chips').hidden = chips.length === 0;
  const count = (value) => (value === 0 ? '✓' : String(value));
  const buttons = chips.map(({ shop, count: value }) => {
    const pick = () => {
      Object.assign(ui, { openId: null, openSide: null });
      ui.shop = shop;
      render();
    };
    const button = el('button', { type: 'button', className: 'chip surface', onclick: pick }, [
      el('span', { textContent: shopLabel(shop) }),
      el('span', { className: 'count', textContent: count(value) }),
    ]);
    button.setAttribute('aria-pressed', String(shop === ui.shop));
    return button;
  });
  $('shop-chips').replaceChildren(...buttons);
};

export const closeSearch = () => {
  endSearch();
  render();
};

const pickShop = (shop) => {
  Object.assign(ui, { openId: null, openSide: null, shop });
  render();
};

// The dock of Compra below 600px (styles.css hides it from 600px): the shop list in view between the
// arrows of the previous and the next list, and the search button; while the search is open, the
// search field and Cancelar. It shows while Compra has an item.
export const renderDock = () => {
  const shown = inList() && store.activeItems(state).length > 0;
  $('dock').hidden = !shown;
  if (!shown) return;
  const chips = shopLists === 'show' ? shops.shopChips(state) : [];
  const search = ui.searchOpen;
  $('dock').classList.toggle('searching', search);
  for (const id of ['dock-prev', 'dock-shop', 'dock-next']) $(id).hidden = search || chips.length === 0;
  $('dock-search').hidden = search;
  $('dock-search').setAttribute('aria-expanded', String(search));
  $('dock-field').hidden = !search;
  $('dock-cancel').hidden = !search;
  $('dock-clear').hidden = ui.query === '';
  if ($('dock-query').value !== ui.query) $('dock-query').value = ui.query;
  if (!chips.length) return;
  const current = chips.find((chip) => chip.shop === ui.shop) ?? chips[0];
  $('dock-shop').replaceChildren(
    el('span', { textContent: shopLabel(current.shop) }),
    el('span', { className: 'count', textContent: current.count === 0 ? '✓' : String(current.count) }),
    el('span', { className: 'chevron', textContent: '▾', ariaHidden: 'true' }),
  );
  $('dock-shop').setAttribute('aria-expanded', String(ui.shopPickOpen));
  const previous = shops.previousShop(state, ui.shop);
  const next = shops.nextShop(state, ui.shop);
  $('dock-prev').disabled = previous === null;
  $('dock-next').disabled = next === null;
  $('dock-prev').onclick = () => previous && pickShop(previous.shop);
  $('dock-next').onclick = () => next && pickShop(next.shop);
};

// The shop picker of the dock: one entry for each shop list, with the count of its items to buy.
export const renderShopPick = () => {
  if (!inList()) ui.shopPickOpen = false;
  $('shop-pick').hidden = !ui.shopPickOpen;
  if (!ui.shopPickOpen) return;
  const chips = shopLists === 'show' ? shops.shopChips(state) : [];
  $('shop-pick').querySelector('.sheet-body').replaceChildren(...chips.map(({ shop, count }) => {
    const pick = () => {
      ui.shop = shop;
      closeShopPick();
    };
    const button = el('button', { type: 'button', className: 'button outline entry', onclick: pick }, [
      el('span', { textContent: shopLabel(shop) }),
      el('small', { className: 'entry-note', textContent: count ? t('header.left', { count }) : t('header.allBought') }),
    ]);
    button.setAttribute('aria-pressed', String(shop === ui.shop));
    return button;
  }));
};

export const closeShopPick = () => {
  ui.shopPickOpen = false;
  render();
  $('dock-shop').focus();
};

// The search of the dock fills the list from the bottom, so the nearest match is next to the field.
// The list goes to its end when the search opens and when its text changes; another render, such as
// a tick, leaves the scroll where it is.
let scrolledQuery = null;
export const showDockMatches = () => {
  if (!ui.searchOpen || $('dock').hidden || matchMedia('(min-width: 600px)').matches) {
    scrolledQuery = null;
    return;
  }
  if (ui.query === scrolledQuery) return;
  scrolledQuery = ui.query;
  const main = document.querySelector('main');
  main.scrollTop = main.scrollHeight;
};

export const closeTrip = () => {
  Object.assign(ui, { tripOpen: false });
  render();
  $('trip-button').focus();
};

export const bind = () => {
  $('empty-action').addEventListener('click', () => emptyRun?.());
  $('empty-secondary').addEventListener('click', () => secondaryRun?.());
  $('query').addEventListener('input', (event) => {
    Object.assign(ui, { query: event.target.value, openId: null });
    render();
  });
  // The press must not take the focus out of the field: the blur would close the search, and the
  // click would then open it again.
  $('search-button').addEventListener('mousedown', (event) => event.preventDefault());
  $('search-button').addEventListener('click', () => {
    if (ui.searchOpen) {
      closeSearch();
      return;
    }
    Object.assign(ui, { searchOpen: true, openId: null });
    render();
    $('query').focus();
  });
  // An empty field of a list that loses the focus closes. The field of Recetas stays.
  $('query').addEventListener('blur', () => {
    if (ui.searchOpen && !ui.query.trim()) closeSearch();
  });
  $('trip-button').addEventListener('click', () => {
    if (ui.view === 'menu') {
      ui.menuMoreOpen = true;
      render();
      // An empty menu disables Vaciar menú: Listo takes the focus then.
      ($('menu-clear').disabled ? $('menu-more-sheet').querySelector('.sheet-head .button') : $('menu-clear')).focus();
      return;
    }
    Object.assign(ui, { tripOpen: true, openId: null });
    render();
    $('finish-menu').focus();
  });
  $('dock-shop').addEventListener('click', () => {
    Object.assign(ui, { shopPickOpen: true, openId: null, openSide: null });
    render();
    $('shop-pick').querySelector('.sheet-body').querySelector('[aria-pressed="true"]')?.focus();
  });
  $('shop-pick-veil').addEventListener('click', closeShopPick);
  $('dock-search').addEventListener('click', () => {
    Object.assign(ui, { searchOpen: true, openId: null });
    render();
    $('dock-query').focus();
  });
  $('dock-query').addEventListener('input', (event) => {
    Object.assign(ui, { query: event.target.value, openId: null });
    render();
  });
  // The clear and the cancel must not take the focus out of the field first: the blur of an empty
  // field closes the search.
  for (const id of ['dock-clear', 'dock-cancel']) $(id).addEventListener('pointerdown', (event) => event.preventDefault());
  $('dock-clear').addEventListener('click', () => {
    Object.assign(ui, { query: '', openId: null });
    render();
    $('dock-query').focus();
  });
  $('dock-cancel').addEventListener('click', () => {
    closeSearch();
    $('dock-search').focus();
  });
  $('dock-query').addEventListener('blur', () => {
    if (ui.searchOpen && !ui.query.trim()) closeSearch();
  });
  $('trip-veil').addEventListener('click', closeTrip);
  $('trip-continue').addEventListener('click', closeTrip);
  $('trip-settings').addEventListener('click', () => {
    ui.tripOpen = false;
    showView('settings');
  });
  $('finish-button').addEventListener('click', () => finishTrip());
  $('finish-menu').addEventListener('click', () => finishTrip(undefined, keptItems()));
};
