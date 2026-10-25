// SHARE-12: the screen works on one combined state. For a member it holds the own entities and the
// shared ones, each shared one marked `shared: true`. The marker lives only here: `split` removes
// it, so it never reaches storage or sync. The combined state is never normalized: it may hold
// two items of one name, or two meals of one slot, one for each list.
export const isShared = (entity) => entity.shared === true;

const mark = (entity) => ({ ...entity, shared: true });
const unmark = ({ shared, ...entity }) => entity;
const own = (entities) => entities.filter((entity) => !isShared(entity));
const marked = (entities) => entities.filter(isShared).map(unmark);

// Scope `all` shares recipes and meals too; scope `list` shares the items only.
export const combine = (ownState, sharedState, scope) => {
  if (!sharedState) return ownState;
  const all = scope === 'all';
  return {
    ...ownState,
    items: [...ownState.items, ...sharedState.items.map(mark)],
    recipes: all ? [...ownState.recipes, ...sharedState.recipes.map(mark)] : ownState.recipes,
    menu: all ? [...ownState.menu, ...sharedState.menu.map(mark)] : ownState.menu,
    sent: all ? [...ownState.sent, ...sharedState.sent] : ownState.sent,
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
  const sharedRecipes = all ? marked(state.recipes) : sharedBase.recipes;
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
      items: marked(state.items),
      recipes: sharedRecipes,
      menu: all ? marked(state.menu) : sharedBase.menu,
      sent: all ? only(state.sent, sharedRecipes) : sharedBase.sent,
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
// inside that list. The error of `op` returns as it is.
export const onList = (state, which, op, sharedBase, scope) => {
  if (which === 'shared' && !sharedBase) return { error: { key: 'share.error.invalid' } };
  const parts = split(state, sharedBase, scope);
  const result = op(parts[which]);
  if (result.error) return { error: result.error };
  // An operation that changes nothing gives the same state, so the screen can tell (REC-21).
  if (result.state === parts[which]) return { ...result, state };
  return { ...result, state: combine(...(which === 'own' ? [result.state, parts.shared] : [parts.own, result.state]), scope) };
};

// The list that holds an entity of the combined state.
export const listOf = (entity) => (isShared(entity) ? 'shared' : 'own');

// SHARE-15: the list that an add goes to. An add from Todas goes to the own list.
export const targetList = (choice) => (choice === 'shared' ? 'shared' : 'own');

// SHARE-14: the count of each list chip, the items to buy of that list.
export const listCounts = (state) => {
  const toBuy = state.items.filter((item) => item.list === 'active' && !item.bought);
  const shared = toBuy.filter(isShared).length;
  return { all: toBuy.length, own: toBuy.length - shared, shared };
};
