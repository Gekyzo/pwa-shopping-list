import { reorderItems } from '#store';
import { fillMenu } from '#menu';

// SHARE-12: the screen works on one combined state. For a member it holds the own entities and the
// shared ones, each shared one marked `shared: true`. Each id of the shared part, and each reference
// to one (a meal's `recipe`, `sent`), has the prefix `shared:` in it, so that an id of both lists
// names one entity. The marker and the prefix live only here: `split` removes them, so they never
// reach storage or sync. The combined state is never normalized: it may hold two items of one name,
// or two meals of one slot, one for each list.
export const isShared = (entity) => entity.shared === true;

const PREFIX = 'shared:';
// Both are idempotent: an operation on a shared part may mix the ids of the combined state with
// new plain ids.
const toCombined = (id) => (id.startsWith(PREFIX) ? id : `${PREFIX}${id}`);
const toPlain = (id) => (id.startsWith(PREFIX) ? id.slice(PREFIX.length) : id);

const withId = (entity, map) => ({ ...entity, id: map(entity.id) });
const withRecipe = (entry, map) => (entry.recipe ? { ...entry, recipe: map(entry.recipe) } : entry);

// The ids of a part, and the references to them, through `map`.
const mapIds = (part, map) => ({
  ...part,
  items: part.items.map((entity) => withId(entity, map)),
  recipes: part.recipes.map((entity) => withId(entity, map)),
  menu: part.menu.map((entry) => withRecipe(entry, map)),
  sent: part.sent.map(map),
});

const mark = (entity) => ({ ...entity, shared: true });
const unmark = ({ shared, ...entity }) => entity;
const own = (entities) => entities.filter((entity) => !isShared(entity));
const marked = (entities) => entities.filter(isShared).map(unmark);
const plainEntities = (entities) => marked(entities).map((entity) => withId(entity, toPlain));

// Scope `all` shares recipes and meals too; scope `list` shares the items only.
export const combine = (ownState, sharedState, scope) => {
  if (!sharedState) return ownState;
  const all = scope === 'all';
  const shared = mapIds(sharedState, toCombined);
  return {
    ...ownState,
    items: [...ownState.items, ...shared.items.map(mark)],
    recipes: all ? [...ownState.recipes, ...shared.recipes.map(mark)] : ownState.recipes,
    menu: all ? [...ownState.menu, ...shared.menu.map(mark)] : ownState.menu,
    sent: all ? [...ownState.sent, ...shared.sent] : ownState.sent,
  };
};

const only = (ids, recipes) => {
  const known = new Set(recipes.map((recipe) => recipe.id));
  return ids.filter((id) => known.has(id));
};

// The two plain states of a combined state. `sharedBase` is the shared state as saved: it gives
// the settings of the shared part, and under scope `list` its recipes, meals and `sent`.
export const split = (state, sharedBase, scope) => {
  if (!sharedBase) return { own: state, shared: null };
  const all = scope === 'all';
  const ownRecipes = own(state.recipes);
  const sharedRecipes = all ? plainEntities(state.recipes) : sharedBase.recipes;
  const sharedSent = only(state.sent, state.recipes.filter(isShared)).map(toPlain);
  return {
    own: {
      ...state,
      items: own(state.items),
      recipes: ownRecipes,
      menu: own(state.menu),
      sent: only(state.sent, ownRecipes),
    },
    shared: {
      ...sharedBase,
      items: plainEntities(state.items),
      recipes: sharedRecipes,
      menu: all ? marked(state.menu).map((entry) => withRecipe(entry, toPlain)) : sharedBase.menu,
      sent: all ? sharedSent : sharedBase.sent,
    },
  };
};

// The items of one list: `null` all, `'own'` the unmarked, `'shared'` the marked.
export const listView = (state, choice) => {
  if (!choice) return state;
  const wanted = choice === 'shared';
  return { ...state, items: state.items.filter((item) => isShared(item) === wanted) };
};

// The entities of one list in the combined state, with their markers: `null` gives the state as it
// is. Recetas and Menú read one list through it (REC-38, MENU-20).
export const listPart = (state, which) => {
  if (!which) return state;
  const wanted = which === 'shared';
  const mine = (entity) => isShared(entity) === wanted;
  const recipes = state.recipes.filter(mine);
  return { ...state, items: state.items.filter(mine), recipes, menu: state.menu.filter(mine), sent: only(state.sent, recipes) };
};

// Runs `op` on one list alone, so that its rules (a name is unique, a meal slot is free) hold
// inside that list. `op` gets the ids of the combined state, so an id of the screen works in it,
// and an `id` of its result is an id of the combined state. The error of `op` returns as it is.
export const onList = (state, which, op, sharedBase, scope) => {
  if (which === 'shared' && !sharedBase) return { error: { key: 'share.error.invalid' } };
  const parts = split(state, sharedBase, scope);
  const part = which === 'shared' ? mapIds(parts.shared, toCombined) : parts.own;
  const result = op(part);
  if (result.error) return { error: result.error };
  // An operation that changes nothing gives the same state, so the screen can tell (REC-21).
  if (result.state === part) return { ...result, state };
  if (which === 'own') return { ...result, state: combine(result.state, parts.shared, scope) };
  const id = typeof result.id === 'string' ? { id: toCombined(result.id) } : {};
  return { ...result, ...id, state: combine(parts.own, mapIds(result.state, toPlain), scope) };
};

// The list that holds an entity of the combined state.
export const listOf = (entity) => (isShared(entity) ? 'shared' : 'own');

// SHARE-15: a manual move runs in the list of its rows (no row moves in Todas, SHARE-14), so it
// never changes the order of the other list. The screen shows both lists in the own order: the
// moved list moves in that order. A move in the name order switches the own order to custom, with
// the own items in the name order, as `reorderItems` does; the order of the shared part stays its own.
export const reorderList = (state, ids, sharedBase, scope) => {
  const moved = state.items.find((entity) => entity.id === ids[0]);
  if (!moved) return { error: { key: 'error.itemNotFound' } };
  const which = listOf(moved);
  const inOrder = (part) => {
    const shown = part.sort === state.sort ? part : { ...part, sort: state.sort };
    const result = reorderItems(shown, ids);
    return result.state === shown ? { state: part } : result;
  };
  const result = onList(state, which, inOrder, sharedBase, scope);
  if (result.error || which === 'own' || state.sort !== 'name' || result.state === state) return result;
  return onList(result.state, 'own', (part) => reorderItems(part, []), sharedBase, scope);
};

// MENU-20: Llenar cesta fills each list from its own menu: the own one, then the shared one under
// scope `all`. A list with an empty menu, or with no product in it, is skipped; its error comes
// only when no list fills: `error.menuEmpty` when each menu is empty. `added` and `already` are the
// sums of the fills. A fill that changes nothing gives the same state.
export const fillLists = (state, sharedBase, scope, newId) => {
  const lists = sharedBase && scope === 'all' ? ['own', 'shared'] : ['own'];
  let next = state;
  let added = 0;
  let already = 0;
  const errors = [];
  for (const which of lists) {
    const result = onList(next, which, (part) => fillMenu(part, newId), sharedBase, scope);
    if (result.error && !['error.menuEmpty', 'error.menuNoProducts'].includes(result.error.key)) return { error: result.error };
    if (result.error) {
      errors.push(result.error);
      continue;
    }
    next = result.state;
    added += result.added;
    already += result.already;
  }
  if (errors.length < lists.length) return { state: next, added, already };
  return { error: errors.find((error) => error.key === 'error.menuNoProducts') ?? errors[0] };
};

// SHARE-15: the list that an add goes to. An add from Todas goes to the own list.
export const targetList = (choice) => (choice === 'shared' ? 'shared' : 'own');

// SHARE-14: the count of each list chip, the items to buy of that list.
export const listCounts = (state) => {
  const toBuy = state.items.filter((item) => item.list === 'active' && !item.bought);
  const shared = toBuy.filter(isShared).length;
  return { all: toBuy.length, own: toBuy.length - shared, shared };
};
