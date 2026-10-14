import * as store from '#store';
import * as recipes from '#recipes';
import * as shops from '#shops';
import * as menu from '#menu';
import { $, el, state, ui, t, say, isOn, shopLists, apply, render } from '#ui/context';
import { inList, viewState, found, searching, shownGroup, endSearch } from '#ui/view';
import { itemNode, boughtSection, groupHead } from '#ui/rows';
import { recipeNode } from '#ui/recipes';
import { dayNode } from '#ui/menu';

const finishTrip = (undoText = t('toast.finished')) => {
  if (!apply(store.startNewShopping(state), { undoText })) return;
  Object.assign(ui, { view: 'active', openId: null, tripOpen: false });
  render();
};

// The rows of a list below the shop of each item. A row of a shop has the group id `shop:<name>`.
const shopNodes = (list) => {
  const { groups, rest } = store.filterGroups(shops.shopGroups(viewState(), list), ui.query);
  const count = ({ left, total }) => {
    if (list !== 'active') return '';
    return left ? `${total - left}/${total}` : '✓';
  };
  const grouped = groups.flatMap((group) => [
    groupHead(group.shop, count(group)),
    ...group.items.map((item) => itemNode(item, `shop:${group.shop}`)),
  ]);
  const others = rest.length ? [groupHead(t('group.noShop'), ''), ...rest.map((item) => itemNode(item))] : [];
  return [...grouped, ...others];
};

// The items of Actual still to buy: flat, below the recipe that asks for each one, or below
// the shop of each one.
const pendingNodes = () => {
  const group = shownGroup();
  if (group === 'shop') return shopNodes('active');
  if (group === 'none') {
    return store.activeItems(viewState()).filter((item) => !item.bought && found(item)).map((item) => itemNode(item));
  }
  const { groups, rest } = store.filterGroups(recipes.recipeGroups(viewState()), ui.query);
  const grouped = groups.flatMap(({ recipe, items, total, left }) => [
    groupHead(recipe.name, left ? `${total - left}/${total}` : '✓'),
    ...items.map((item) => itemNode(item, recipe.id)),
  ]);
  const others = rest.length ? [groupHead(t('group.others'), ''), ...rest.map((item) => itemNode(item))] : [];
  return [...grouped, ...others];
};

const listNodes = (items) => {
  if (ui.view !== 'active') return shownGroup() === 'shop' ? shopNodes('next') : items.filter(found).map((item) => itemNode(item));
  const bought = items.filter((item) => item.bought && found(item));
  return bought.length ? [...pendingNodes(), ...boughtSection(bought)] : pendingNodes();
};

const finishText = ({ back, gone }) => `${t('finish.back', { count: back })} ${t('finish.gone', { count: gone })}`;

const activeSubtitle = ({ total, left }) => {
  if (!total) return t('header.empty');
  if (!left) return t('header.allBought');
  return t('header.left', { count: left });
};

export const headerOf = (summary, next) => {
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
  if (ui.view === 'next') {
    const boughtToday = next.length - summary.incoming;
    const parts = [next.length ? t('count.items', { count: next.length }) : t('header.nothingReady')];
    if (boughtToday) parts.push(t('header.boughtToday', { count: boughtToday }));
    return { title: t('header.next'), subtitle: parts.join(' · '), ring: String(next.length), pct: 0 };
  }
  const { total, left } = summary;
  const pct = total ? Math.round(((total - left) / total) * 100) : 0;
  return { title: t('header.today'), subtitle: activeSubtitle(summary), ring: `${total - left}/${total}`, pct };
};

const EMPTY_KEYS = { active: 'empty.active', next: 'empty.next', recipes: 'empty.recipes', menu: 'empty.menu' };

const emptyText = () => {
  if (searching()) return t(ui.view === 'recipes' ? 'empty.noMatch' : 'empty.noItemMatch', { query: ui.query.trim() });
  return EMPTY_KEYS[ui.view] ? t(EMPTY_KEYS[ui.view]) : '';
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

const nodesOf = (items) => {
  if (ui.view === 'settings') return [];
  // With no recipe there is nothing to plan: the empty text says where to create one.
  if (ui.view === 'menu') return state.recipes.length ? menu.menuWeek(state).map(dayNode) : [];
  return ui.view === 'recipes' ? recipes.searchRecipes(state, ui.query).map(recipeNode) : listNodes(items);
};

// A shop list of Actual with nothing to buy, while other items are still to buy, points to the
// next shop list that has some.
const renderShopDone = (summary) => {
  const shop = ui.shop.active;
  const done = ui.view === 'active' && shop !== null && !searching() && summary.left > 0 &&
    store.tripSummary(viewState()).left === 0;
  $('shop-done').hidden = !done;
  if (!done) return;
  const next = shops.nextShop(state, shop);
  $('shop-done-text').textContent = t('shops.nothingLeft', { shop: shopLabel(shop) });
  $('shop-done-next').textContent = shopLabel(next);
  $('shop-done-next').onclick = () => {
    ui.shop.active = next;
    render();
  };
};

export const renderList = (summary) => {
  const scoped = viewState();
  const items = ui.view === 'active' ? store.activeItems(scoped) : store.nextItems(scoped);
  const searchable = ui.view === 'recipes' && state.recipes.length > 0;
  renderSearch(items, searchable);
  const nodes = nodesOf(items);
  $('items').hidden = ui.view === 'settings';
  $('items').replaceChildren(...nodes);
  if (ui.view === 'next' && nodes.length) {
    $('items').append(el('p', { className: 'hint', textContent: t('next.hint') }));
  }

  $('empty').hidden = ui.view === 'settings' || nodes.length > 0;
  $('empty-text').textContent = emptyText();
  $('bring').hidden = !(isOn('next') && ui.view === 'active' && summary.incoming > 0) || searching();
  $('bring').textContent = say('empty.bring', { count: summary.incoming, list: 'next' });

  $('menu-actions').hidden = !(ui.view === 'menu' && state.recipes.length > 0);
  $('menu-clear').disabled = menu.mealCount(state) === 0;

  $('finish').hidden = !(ui.view === 'active' && ui.shop.active === null && summary.total > 0 && summary.left === 0);
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
};

export const shopLabel = (shop) => (shop === null ? t('shops.all') : shop === '' ? t('group.noShop') : shop);

// The row of the shop lists of Actual and Próxima. A count of Actual is the items to buy.
export const renderShopChips = () => {
  const chips = inList() && shopLists === 'show' ? shops.shopChips(state, ui.view) : [];
  $('shop-chips').hidden = chips.length === 0;
  const count = (value) => (ui.view === 'active' && value === 0 ? '✓' : String(value));
  const buttons = chips.map(({ shop, count: value }) => {
    const pick = () => {
      Object.assign(ui, { openId: null, openSide: null });
      ui.shop[ui.view] = shop;
      render();
    };
    const button = el('button', { type: 'button', className: 'chip surface', onclick: pick }, [
      el('span', { textContent: shopLabel(shop) }),
      el('span', { className: 'count', textContent: count(value) }),
    ]);
    button.setAttribute('aria-pressed', String(shop === ui.shop[ui.view]));
    return button;
  });
  $('shop-chips').replaceChildren(...buttons);
};

export const closeSearch = () => {
  endSearch();
  render();
};

export const closeTrip = () => {
  ui.tripOpen = false;
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
  $('finish-menu').addEventListener('click', () => finishTrip());
  $('bring').addEventListener('click', () => finishTrip(say('toast.brought', { list: 'next' })));
};
