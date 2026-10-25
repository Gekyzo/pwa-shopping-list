import * as store from '#store';
import * as recipes from '#recipes';
import * as shops from '#shops';
import { listView, isShared, targetList } from '#lists';
import { listName } from '#shares';
import { state, sharing, ui, t } from '#ui/context';

// An item of two recipes, or of two shops, shows in two groups: `groupId` tells its rows apart.
export const isOpen = (id, groupId) => ui.openId === id && ui.openGroup === groupId;

export const inList = () => ui.view === 'active';

// SHARE-14: the list choice of a member; null (Todas) with no share.
export const listChoice = () => (sharing ? ui.listChoice : null);

// The state of the list chip on the screen: its items only. The shop lists work inside it.
export const listState = () => listView(state, listChoice());

// The state of the shop list on the screen. The operations still run on the full state.
export const viewState = () => (inList() ? shops.shopState(listState(), ui.shop) : state);

// True while Compra shows the items of both lists of a member, in Todas.
export const mixed = () => sharing !== null && ui.listChoice === null;

// The name of the list of an entity: `Mía` or the name of the shared list.
const tagText = (entity) => (isShared(entity) ? listName(sharing) : t('lists.ownTag'));

// SHARE-14: the tag of a row in Todas, the name of its list; null in the other choices.
export const tagOf = (item) => (mixed() ? tagText(item) : null);

// REC-38, MENU-20: with scope `all` the recipes and the meals of both lists show, each with the tag
// of its list. With scope `list`, or with no share, they show no tag.
export const listTags = () => sharing?.scope === 'all';
export const recipeTag = (entity) => (listTags() ? tagText(entity) : null);

// SHARE-15: the list of an add, and the part of the state that its suggestions and its duplicate
// check look at.
export const addTarget = () => targetList(listChoice());
export const targetState = () => (sharing ? listView(state, addTarget()) : state);

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
