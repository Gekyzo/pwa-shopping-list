import * as store from '#store';
import * as recipes from '#recipes';
import * as shops from '#shops';
import { state, ui, isOn } from '#ui/context';

// An item of two recipes, or of two shops, shows in two groups: `groupId` tells its rows apart.
export const isOpen = (id, groupId) => ui.openId === id && ui.openGroup === groupId;

export const inList = () => ui.view === 'active' || ui.view === 'next';

// The state of the shop list on the screen. The operations still run on the full state.
export const viewState = () => (inList() ? shops.shopState(state, ui.shop[ui.view]) : state);

// True for an item that the search of the list shows.
export const found = (item) => store.matchesItem(item, ui.query);
// True while the search field has a text.
export const searching = () => ui.query.trim() !== '';

// The choices that the arrange sheet has for the view: the recipe groups of Actual when a recipe
// has a group, the shop groups when an item of the view has a shop, and the order of a list with
// two items or more. A shop list has no shop groups.
export const arrangeChoices = () => {
  if (!inList()) return { recipe: false, shop: false, sort: false };
  const scoped = viewState();
  const items = ui.view === 'active' ? store.activeItems(scoped) : store.nextItems(scoped);
  return {
    recipe: isOn('recipes') && ui.view === 'active' && recipes.recipeGroups(scoped).groups.length > 0,
    shop: ui.shop[ui.view] === null && items.some((item) => item.shops.length > 0),
    sort: items.length > 1,
  };
};

// The grouping that the view shows: the choice of the user, when the view can show it.
export const shownGroup = () => {
  const { recipe, shop } = arrangeChoices();
  if (state.group === 'recipe' && recipe) return 'recipe';
  return state.group === 'shop' && shop ? 'shop' : 'none';
};

// An add closes the search of the list, so that the row that it brings is in view.
export const endSearch = () => Object.assign(ui, { searchOpen: false, query: '' });
