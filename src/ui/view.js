import * as store from '#store';
import * as recipes from '#recipes';
import * as shops from '#shops';
import { state, ui } from '#ui/context';

// An item of two recipes, or of two shops, shows in two groups: `groupId` tells its rows apart.
export const isOpen = (id, groupId) => ui.openId === id && ui.openGroup === groupId;

export const inList = () => ui.view === 'active';

// The state of the shop list on the screen. The operations still run on the full state.
export const viewState = () => (inList() ? shops.shopState(state, ui.shop) : state);

// True for an item that the search of the list shows.
export const found = (item) => store.matchesItem(item, ui.query);
// True while the search field has a text.
export const searching = () => ui.query.trim() !== '';

// The choices that the arrange sheet has for the view: the recipe groups of Compra when a recipe
// has a group, the shop groups when an item of the view has a shop, the aisle groups when an item
// of the view has an aisle, and the order of a list with two items or more. A shop list has no
// shop groups, but it has aisle groups: at one shop, the list follows its aisles.
export const arrangeChoices = () => {
  if (!inList()) return { recipe: false, shop: false, aisle: false, sort: false };
  const scoped = viewState();
  const items = store.activeItems(scoped);
  return {
    recipe: recipes.recipeGroups(scoped).groups.length > 0,
    shop: ui.shop === null && items.some((item) => item.shops.length > 0),
    aisle: items.some((item) => item.aisle !== ''),
    sort: items.length > 1,
  };
};

// The grouping that the view shows: the choice of the user, when the view can show it.
export const shownGroup = () => {
  const { recipe, shop, aisle } = arrangeChoices();
  if (state.group === 'recipe' && recipe) return 'recipe';
  if (state.group === 'aisle' && aisle) return 'aisle';
  return state.group === 'shop' && shop ? 'shop' : 'none';
};

// An add closes the search of the list, so that the row that it brings is in view.
export const endSearch = () => Object.assign(ui, { searchOpen: false, query: '' });
