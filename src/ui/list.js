import * as store from '#store';
import * as recipes from '#recipes';
import * as shops from '#shops';
import * as aisles from '#aisles';
import * as menu from '#menu';
import { $, el, state, ui, t, shopLists, tripEnd, apply, render } from '#ui/context';
import { inList, viewState, found, searching, shownGroup, endSearch } from '#ui/view';
import { itemNode, boughtSection, savedSection, groupHead, groupNodes } from '#ui/rows';
import { recipeNode } from '#ui/recipes';
import { dayNode } from '#ui/menu';

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
  const { groups, rest } = store.filterGroups(recipes.recipeGroups(viewState()), ui.query);
  const grouped = groups.flatMap(({ recipe, items, total, left }) => [
    groupHead(recipe.name, groupCount({ left, total }), recipe.id),
    ...groupNodes(recipe.id, items.map((item) => itemNode(item, recipe.id))),
  ]);
  const others = rest.length ? [groupHead(t('group.others'), '', 'others'), ...groupNodes('others', rest.map((item) => itemNode(item)))] : [];
  return [...grouped, ...others];
};

const listNodes = (items) => {
  const bought = items.filter((item) => item.bought && found(item));
  return bought.length ? [...pendingNodes(), ...boughtSection(bought)] : pendingNodes();
};

// Compra ends with the saved items; a tap brings one back.
const savedNodes = () => {
  const saved = store.savedItems(viewState()).filter(found);
  return saved.length ? savedSection(saved) : [];
};

const finishText = ({ back, saved }) => `${t('finish.back', { count: back })} ${t('finish.saved', { count: saved })}`;

const activeSubtitle = ({ total, left }) => {
  if (!total) return t('header.empty');
  if (!left) return t('header.allBought');
  return t('header.left', { count: left });
};

export const headerOf = (summary) => {
  if (ui.view === 'settings') return { title: t('nav.settings'), subtitle: t('header.settingsSubtitle'), ring: '⚙', pct: 0 };
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
  return { title: t('header.today'), subtitle: activeSubtitle(summary), ring: `${total - left}/${total}`, pct };
};

const EMPTY_KEYS = { active: 'empty.active', recipes: 'empty.recipes', menu: 'empty.menu' };

const emptyText = () => {
  if (searching()) return t(ui.view === 'recipes' ? 'empty.noMatch' : 'empty.noItemMatch', { query: ui.query.trim() });
  return EMPTY_KEYS[ui.view] ? t(EMPTY_KEYS[ui.view]) : '';
};

// One field serves the three sections: Recetas shows it when it has a recipe, and a list shows it
// after a tap on the search button, which a list with no item does not have.
const renderSearch = (items, searchable) => {
  const canOpen = inList() && (items.length > 0 || store.savedItems(viewState()).length > 0);
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

const nodesOf = (items) => {
  if (ui.view === 'settings') return [];
  // With no recipe there is nothing to plan: the empty text says where to create one.
  if (ui.view === 'menu') return state.recipes.length ? menu.menuWeek(state).map(dayNode) : [];
  return ui.view === 'recipes' ? recipes.searchRecipes(state, ui.query).map(recipeNode) : listNodes(items);
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
  $('shop-done-text').textContent = t('shops.nothingLeft', { shop: shopLabel(shop) });
  $('shop-done-next').textContent = shopLabel(next);
  $('shop-done-next').onclick = () => {
    ui.shop = next;
    render();
  };
};

export const renderList = (summary) => {
  const scoped = viewState();
  const items = ui.view === 'active' ? store.activeItems(scoped) : [];
  const searchable = ui.view === 'recipes' && state.recipes.length > 0;
  renderSearch(items, searchable);
  const nodes = nodesOf(items);
  const saved = inList() ? savedNodes() : [];
  $('items').hidden = ui.view === 'settings';
  $('items').replaceChildren(...nodes);
  $('saved').hidden = saved.length === 0;
  $('saved').replaceChildren(...saved);

  $('empty').hidden = ui.view === 'settings' || nodes.length > 0 || (saved.length > 0 && searching());
  $('empty-text').textContent = emptyText();

  $('menu-actions').hidden = !(ui.view === 'menu' && state.recipes.length > 0);
  $('menu-clear').disabled = menu.mealCount(state) === 0;

  $('finish').hidden = !(ui.view === 'active' && ui.shop === null && summary.total > 0 && summary.left === 0);
  renderShopDone(summary);
  $('finish-text').textContent = finishText(summary);
};

// The trip button of the header and its sheet.
export const renderTrip = () => {
  if (ui.view !== 'active') ui.tripOpen = false;
  $('trip-button').hidden = ui.view !== 'active';
  $('finish-menu').disabled = !store.canStartNewShopping(state);
  $('trip-button').setAttribute('aria-expanded', String(ui.tripOpen));
  $('trip').hidden = !ui.tripOpen;
  const outcome = store.tripOutcome(state, keptItems());
  // One part for each place an item goes, in this order; a part with no item does not show (TRIP-4).
  const parts = ['recurrent', 'kept', 'open', 'bought'].filter((key) => outcome[key] > 0);
  $('finish-menu-text').textContent = parts.map((key) => t(`trip.${key}`, { count: outcome[key] })).join(' · ');
  $('trip-open').hidden = store.openItems(state).length === 0;
  $('trip-open').textContent = t('trip.hint');
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

export const closeTrip = () => {
  Object.assign(ui, { tripOpen: false });
  render();
  $('trip-button').focus();
};

export const bind = () => {
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
    Object.assign(ui, { tripOpen: true, openId: null });
    render();
    $('finish-menu').focus();
  });
  $('trip-veil').addEventListener('click', closeTrip);
  $('finish-button').addEventListener('click', () => finishTrip());
  $('finish-menu').addEventListener('click', () => finishTrip(undefined, keptItems()));
};
