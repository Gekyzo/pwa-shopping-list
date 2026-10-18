import { findByName, searchItems } from '#store';

// The rows above the add input: `create` first when no item has the typed name, then the items that
// match. The view reverses them so that `create` sits next to the input. `inList` is true for an
// item that is to buy in Compra, where an add changes nothing.
export const MAX_ROWS = 6;

export const suggestionRows = (state, text) => {
  const name = String(text ?? '').trim();
  if (!name) return [];
  const create = findByName(state, name) ? [] : [{ kind: 'create', inList: false }];
  const items = searchItems(state, name, MAX_ROWS - create.length).map((item) => ({
    kind: 'item',
    item,
    inList: item.list === 'active' && !item.bought,
  }));
  return [...create, ...items];
};
