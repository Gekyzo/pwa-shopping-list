# Sort of the item lists — design

## Context

`Actual` and `Próxima` show their items in insertion order. The user wants to choose an
alphabetical order.

Decisions taken in the brainstorm:

| Topic | Decision |
|---|---|
| Lists | `Actual` and `Próxima`. One choice applies to the two lists |
| Order | A choice between insertion order and name order |
| Storage | In the state, as `grouped` is, so it stays over trips and reloads |

## Behaviour

- **Choice:** a row `Ordenar por` with `Añadido` and `Nombre` is the first row of `Actual` and of
  `Próxima`, when the list has two items or more. In `Actual` it comes after `Agrupar por`.
  `Añadido` is the insertion order, as before. The change keeps a pending `Deshacer`.
- **Name order:** by the Spanish alphabet, without case or accent distinction (`árbol` comes
  before `Banana`, `ñ` after `n`).
- **`Actual`:** the items to buy are in name order, then the `N comprados` section, in name order
  too. Ticked items stay below the items that are not ticked.
- **Grouped `Actual`:** the items of each recipe group and of `Otros` are in name order. The
  groups keep the send order.
- **`Próxima`:** one list in name order. An item bought today is no longer below the others.
- **Not changed:** the search of the add sheet, the recipes and their products, the backup file
  order. The sort is a view: the order of `items` in the state stays the insertion order.

## Data model

```js
{ version: 2, items, recipes, sent, grouped: true, sort: 'added' | 'name' }
```

- `sort` is `'added'` when it is absent or not known. The version stays 2: a state without `sort`
  is valid, and an old module that reads a state with `sort` drops the field. No new cache name
  in `sw.js`.

## Design

- `src/store.js`: `emptyState` has `sort: 'added'`. `setSort(state, sort)` rejects a sort that is
  not known. `sortItems(state, items)` returns the items in the chosen order and does not change
  its input. `activeItems` and `nextItems` use it.
- `src/recipes.js`: `recipeGroups` uses `sortItems` for the members of a group and for `rest`.
- `src/storage.js`: `normalizeState` keeps `sort`.
- `src/app.js`: `sortToggle`, built as `groupToggle` is, with the `.groupby` styles.

## Out of scope

A manual order, an order by shop section, a descending order, a sort of the recipes or of the
products of a recipe, a different choice for each list.
