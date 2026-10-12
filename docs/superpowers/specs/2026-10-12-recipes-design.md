# Recipes — design

## Context

The app has an `Actual` list and a `Próxima` list. The user buys the same groups of products for
the same meals. A recipe stores one such group, and one tap sends its products to `Actual`.

A recipe is a name and a list of product names only. It has no quantities, no steps and no photo.

Decisions taken in the brainstorm:

| Topic | Decision |
|---|---|
| Recipe content | A name and a list of product names |
| Link to items | By name. A recipe holds no item id |
| Send | A one-tap action. The recipe keeps no "sent" state |
| Target list | Always `Actual` |
| Storage | The same `localStorage` key and the same backup file as the items |

A recipe holds names because `startNewShopping` deletes a bought one-time item. A recipe that held
item ids would lose its products after each trip.

## Behaviour

- **Section:** a fourth entry `Recetas` in the bottom menu, between `Próxima` and `Ajustes`.
- **Create:** the `+` button opens the add sheet without the `Para hoy` / `Para la próxima`
  selector and without suggestions. The field takes the recipe name. The new recipe shows expanded,
  ready for its products.
- **Read:** recipes in insertion order. A row shows the name, the product count, the `A la lista`
  button and the `⋯` button. A tap on the name expands or collapses the recipe. One recipe is
  expanded at a time.
- **Expanded recipe:** its products in insertion order, each with a `✕` button, then an
  `Añadir producto` field. While the user types, up to 5 existing items whose name contains the
  text show below the field, without case or accent distinction (`searchItems`). An item that is
  in the recipe already does not show. A tap on one adds it to the recipe.
- **Update:** `⋯` → `Renombrar` renames the recipe in place. Products are added and removed in the
  expanded recipe. A product has no rename; the user removes it and adds it again.
- **Delete:** `⋯` → `Eliminar`. No confirmation; a 5-second `Deshacer` message restores the recipe.
  The lists do not change.
- **Send (`A la lista`):** for each product, in order:
  - an item with that name exists (no case distinction) → `bringToList(state, id, 'active')`. An item
    in `Próxima` moves to `Actual`. A ticked item becomes not ticked. An item that is in `Actual` and
    not ticked does not change.
  - no item has that name → `addItem(state, name, 'active')`, so the item is one-time.
  - One `Deshacer` message restores the state from before the send.
  - The message gives the figures, for example `«Tortilla»: 3 añadidos, 1 ya estaba.` `añadidos`
    counts the created items and the items that changed. `ya estaba` counts the items that did not
    change. A part with a count of 0 is left out.
  - When no item changed, the message has no `Deshacer`: `«Tortilla»: todo estaba ya en la lista.`
  - The screen stays on `Recetas`.
- **Names:** trimmed, 80 characters at most. An empty name is rejected. A recipe name is unique
  among recipes, without case distinction. A product name is unique in its recipe, without case
  distinction. A recipe name and an item name do not conflict.
- **Empty recipe:** a recipe can have no products. `A la lista` on it is rejected with
  `La receta no tiene productos.`
- **Independence:** a rename or a delete of an item does not change a recipe. A change to a recipe
  does not change an item.
- **Header on `Recetas`:** title `Recetas`, subtitle `N recetas` or `Sin recetas`, the count in the ring.
- **Empty section:** `No hay recetas. Toca + para crear una.`
- **Backup:** `Exportar copia` includes the recipes. `Importar copia` accepts a version 1 file (no
  recipes) and a version 2 file. The confirmation gives the two counts.

## Groups in Actual

Added after the first version. `Actual` shows its items in groups, one for each recipe that the
user sent in the current trip.

- **Sent recipes:** `A la lista` records the recipe in `sent`, one time, in send order.
  `Terminar compra` empties `sent`. A deleted recipe leaves `sent`.
- **Membership:** an `Actual` item is in the group of a sent recipe when the recipe has a product
  with that name, without case distinction. An item added by hand joins the group of a sent recipe
  that has it. A recipe that was not sent makes no group.
- **Shared item:** an item of two sent recipes shows in the two groups. It is one record, so a tick
  in one group ticks it in all groups, and the header counts it one time.
- **Layout:** for each group, a header with the recipe name and `done/total` (`✓` when all its
  items are ticked), then its items that are not ticked. Then a header `Otros` with the items of no
  group, only when there are such items. Then the `N comprados` section, where a ticked item shows
  one time. A sent recipe with no item in `Actual` shows no group.
- **No sent recipe with items:** `Actual` is the flat list, as before.
- **Row actions:** the `⋯` actions and the rename field open only in the copy of the row where the
  user opened them.
- **Send:** a send that only adds a group, because all its products were pending already, also
  offers `Deshacer`.
- **Out of scope:** a switch for the flat view, a way to remove a group other than `Deshacer`,
  groups in `Próxima`, a reorder of groups.

`src/recipes.js` exports the view `recipeGroups(state) → { groups: [{ recipe, items, total }], rest }`.

## Recipe link

Added after the first version. A recipe can have one optional link to its page on the web, for
example `https://bonviveur.com/es/recetas/garbanzos-con-chorizo`.

- **Edit:** `⋯` → `Añadir enlace` or `Cambiar enlace` asks for the address in a prompt. An empty
  text removes the link. `Deshacer` restores the value from before.
- **Rules:** the text is trimmed. A text with no scheme gets `https://`. Only `http` and `https`
  addresses are accepted; any other text is rejected with `El enlace no es una dirección web válida.`
- **Show:** an expanded recipe with a link shows the host of the address as its first row. A tap
  opens the page in the browser (`target="_blank"`, `rel="noopener noreferrer"`).
- **Data:** `url` in the recipe, `''` when there is no link. On read, a value that is absent or is
  not an `http` / `https` address becomes `''`; the recipe stays valid.
- `src/recipes.js` exports `setRecipeUrl(state, id, rawUrl)` and `isWebUrl(text)`. `src/storage.js`
  imports `isWebUrl`, so the two layers accept the same addresses.

## Data model

One `localStorage` key, `shopping.v1`. The key name does not change; the `version` field does.

```js
{
  version: 2,
  items: [{ id, name, recurrent, list: 'active' | 'next', bought, again }],
  recipes: [{ id, name, products: ['Huevos', 'Patatas'], url: '' }],
  sent: ['<recipe id>'],
}
```

**Migration:** `normalizeState` in `src/storage.js` accepts `version: 1` and `version: 2`. Version 1
has no `recipes`; the result gets `recipes: []`. The result is always version 2. `load` and
`importJson` use the same function, so the two migrate the same way. An unknown version is rejected
as before.

`sent` is optional on read: an absent or invalid value gives `[]`, and an id that is not a string,
names no recipe or is a duplicate is dropped. The version stays 2, because an older module drops
the field and loses nothing but the groups.

**Validation of a recipe** (`normalizeRecipe`): `id` is a string that is not empty, `name` is a
string that is not empty after a trim, `products` is an array of strings that are not empty after a
trim. Names and products are trimmed. Recipe ids are unique, recipe names are unique and the
products of one recipe are unique, without case distinction. One invalid recipe makes the state
invalid, as one invalid item does.

## Modules

| File | Change |
|---|---|
| `src/recipes.js` | New. Pure recipe operations. Imports `store.js` only |
| `src/store.js` | `emptyState` returns `{ version: 2, items: [], recipes: [] }` |
| `src/storage.js` | `normalizeRecipe`, version 1 and 2 in `normalizeState`, import messages |
| `src/app.js` | The `recipes` view, its rows, the sheet in recipe mode, the send action |
| `index.html` | The menu entry, the texts that depend on the view |
| `styles.css` | Recipe rows, product rows, the product field |
| `sw.js` | `./src/recipes.js` in `SHELL`; cache name `shopping-shell-v2` |
| `tests/recipes.test.js` | New |
| `tests/store.test.js`, `tests/storage.test.js` | `emptyState`, migration, recipe validation |
| `.claude/conventions/ARCHITECTURE.md`, `README.md` | The new module and the new section |

`src/recipes.js` exports, each one `(state, …) → { state }` or `{ state, error }`:

- `addRecipe(state, rawName, newId = () => crypto.randomUUID())` — also returns `id`.
- `renameRecipe(state, id, rawName)`
- `deleteRecipe(state, id)`
- `addRecipeProduct(state, id, rawName)`
- `removeRecipeProduct(state, id, name)`
- `sendRecipe(state, id, newId)` → `{ state, added, already }`. It calls `findByName`, `bringToList`
  and `addItem` from `store.js`. `newId` goes to `addItem`.

Every operation of `store.js` spreads the state (`{ ...state, items }`), so `recipes` passes through
them with no change.

`ui` in `src/app.js` gets `openRecipeId`. `ui.editingId` and `ui.openId` are reused, because an item
id and a recipe id never show on the same screen.

### Points that need care

- **Mixed shell versions:** a version 2 state that a version 1 `storage.js` reads is treated as
  invalid: the app starts empty and the text goes to `shopping.v1.corrupt`. The service worker
  refreshes each file on its own, so a failed refresh can leave new and old modules together. The
  cache name changes to `shopping-shell-v2`: the new worker precaches the full shell in one
  `addAll` and deletes the old cache on `activate`.
- **Old backup files:** a version 1 file must still import. A test covers it.
- **Undo of a send:** `sendRecipe` applies many operations but returns one state, so `apply` keeps
  one previous state and one `Deshacer` restores all of it.
- **Rendering:** recipe and product names go through `textContent`.
- **Language:** all new text on the screen is in Spanish. Code, comments, tests and this spec are
  in English.

## Out of scope

Quantities, units, steps, photos, categories, a "sent" mark on a recipe, a choice of products at
send time, a send to `Próxima`, a rename of a product, a reorder of recipes or products.

## Verification

- `npm test`: all `node:test` tests pass, with new tests for each export of `src/recipes.js`, for the
  version 1 migration and for recipe validation.
- `npm run serve`, then drive `http://localhost:8080` with the `agent-browser` skill at a phone
  viewport:
  1. With version 1 data in `localStorage`, load the app: the items are there and `Recetas` is empty.
  2. Create `Tortilla` with `Huevos`, `Patatas`, `Cebolla`, `Aceite`. Reload: the recipe is there.
  3. Put `Huevos` in `Actual` not ticked, `Patatas` in `Próxima`, `Cebolla` in `Actual` ticked.
     Tap `A la lista`: `Actual` shows the four items not ticked, the message says
     `3 añadidos, 1 ya estaba`. `Deshacer` restores the three lists.
  4. Tap `A la lista` two times: the second message says that all was in the list already.
  5. Rename the recipe, remove a product, delete the recipe, then `Deshacer`.
  6. Reject cases: an empty name, a duplicate recipe name, a duplicate product, a send of an empty recipe.
  7. Export, clear the storage, import: items and recipes come back.
  8. Stop the server and reload: the app works offline, `Recetas` included.
