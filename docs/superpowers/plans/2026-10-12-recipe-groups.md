# Group the Actual list by recipe — implementation plan

**Spec:** `docs/superpowers/specs/2026-10-12-recipes-design.md`, section `Groups in Actual`

## Context

`Actual` is one flat list. After a send of two or three recipes, the user cannot see which
product is for which meal. The user wants `Actual` grouped by recipe. A product that two recipes
share shows in each group, and a tick in one group ticks it in all groups.

Decisions from the user:

| Topic | Decision |
|---|---|
| Which recipes make a group | Only the recipes sent with `A la lista` in the current trip |
| When the grouped view shows | Always, when one sent recipe or more has items in `Actual`. No switch |
| Ticked items | They leave their groups and go one time to the `N comprados` section, as today |

An item stays one record. The groups are a derived view, so "a tick in one group ticks it in all"
needs no new rule: `toggleBought` changes the one record and each group reads it.

## Design

**State.** One new field, the recipes sent in this trip, in send order:

```js
{ version: 2, items, recipes, sent: ['<recipe id>', …] }
```

- The version stays 2. `sent` is optional on read (absent → `[]`), so stored data and old backups
  load with no migration. An old module that reads the new state drops the field and nothing breaks,
  so the cache name does not change.
- Membership is by name inside a sent recipe: an `Actual` item is in the group of a sent recipe when
  the recipe has a product with that name, without case distinction. `Huevos` added by hand shows
  under `Tortilla` only when `Tortilla` was sent. No field is added to an item.
- `sent` is emptied by `startNewShopping`. A deleted recipe leaves `sent`.

**Operations and views**

- `src/store.js`: `emptyState` gets `sent: []`. `startNewShopping` returns `{ ...state, items, sent: [] }`.
- `src/recipes.js`:
  - `sendRecipe` appends the recipe id to `sent` when it is not there. A send that changes no item
    and no `sent` still returns the same state object.
  - `deleteRecipe` removes the id from `sent`.
  - New view `recipeGroups(state) → { groups: [{ recipe, items, total }], rest }`.
    `items` are the members that are not ticked, in list order. `total` counts all members, ticked
    included. A sent recipe with no member in `Actual` gives no group. `rest` holds the not-ticked
    `Actual` items that are in no group. A stale id in `sent` is ignored.
- `src/storage.js` `normalizeState`: `sent` is the ids of `data.sent` that are strings and name a
  recipe of the state, without duplicates; any other value gives `[]`.

**Screen (`src/app.js`, `styles.css`)**

- `listNodes` for `Actual`: when `recipeGroups` returns groups, render for each group a header row
  (recipe name and `done/total`, for example `2/4`; a complete group shows `✓`), then its items.
  Then a header `Otros` with `rest`, only when `rest` has items. Then `boughtSection` as today.
  With no group, the list renders as today.
- A shared item renders one time in each group. `ui.openId` and `ui.editingId` would open the row
  actions and the rename field in each copy. Add `ui.openGroup` (recipe id, or `null` for `Otros`
  and the bought section): `itemNode(item, groupId)` shows actions and the rename field only in
  the copy where the user opened them. `moreButton` and `renameAction` set it.
- `sendToList`: apply with `Deshacer` when `result.state !== state`, so a send that only adds a
  group (all its products were pending already) is also reversible. The texts do not change.
- Header ring and subtitle of `Actual` do not change: `tripSummary` counts records, so a shared
  item counts one time.

Reused as they are: `store.activeItems`, `store.toggleBought`, `boughtSection`, `activeRow`,
`plural`, the `.section` row style for the group headers.

**Out of scope:** a switch for the flat view, a way to remove a group without the undo, groups in
`Próxima`, a reorder of groups.

## Files

| File | Change |
|---|---|
| `src/store.js` | `emptyState`, `startNewShopping` |
| `src/recipes.js` | `sendRecipe`, `deleteRecipe`, new `recipeGroups` |
| `src/storage.js` | `sent` in `normalizeState` |
| `src/app.js` | grouped `listNodes`, `ui.openGroup`, `sendToList` |
| `styles.css` | group header row |
| `tests/store.test.js`, `tests/recipes.test.js`, `tests/storage.test.js` | new and changed tests |
| `docs/superpowers/specs/2026-10-12-recipes-design.md` | new section `Groups in Actual`; data model |
| `README.md`, `.claude/conventions/ARCHITECTURE.md`, `CANONICAL.md` | state shape, the grouped view |

## Steps

Per `WORKFLOW.md`: commit this plan with its `.progress.md` companion and the spec section, then
run `plan-current.sh start`, and `task N start` / `task N land` for each task. Test first; one commit for each task. No push
unless the user asks.

### Task 1: State and operations

1. Failing tests:
   - `tests/storage.test.js`: `emptyState` has `sent: []`; a state without `sent` loads with `[]`;
     `sent` with an unknown id, a duplicate id and a non-string keeps only the valid ids; `sent`
     that is not an array gives `[]`; the samples get `sent`.
   - `tests/store.test.js`: `startNewShopping` empties `sent` and keeps `recipes`; `deleteItem`
     keeps `recipes` and `sent` (the gap the review found).
   - `tests/recipes.test.js`: `sendRecipe` adds the id one time; a second send returns the same
     state object; a send where all products were pending changes only `sent`; `deleteRecipe`
     removes the id from `sent`; `recipeGroups`: no sent recipe → `groups: []`; an item of two sent
     recipes is in the two groups; a ticked member leaves `items` and stays in `total`; an item
     added by hand joins by name without case distinction; an item in `Próxima` is in no group;
     a stale id is ignored; `rest` holds the other pending items; the input state does not change.
2. Run `npm test`, see them fail.
3. Implement in `src/store.js`, `src/storage.js`, `src/recipes.js`.
4. Run `npm test`, all pass. Commit.

### Task 2: Grouped screen and docs

1. `src/app.js` and `styles.css` as in the design. Docs and the spec section.
2. `npm test`.
3. Browser check (below). Commit.

## Verification

- `npm test`: all tests pass.
- `npm run serve` (already running on port 8080), `agent-browser` at 390 × 844
  (`PATH` needs `/home/ciro/.nvm/versions/node/v24.11.1/bin`):
  1. No sent recipe: `Actual` renders flat, as before.
  2. Recipes `Tortilla` (Huevos, Patatas, Cebolla) and `Flan` (Huevos, Leche); `Pan` added by hand.
     Send the two: `Actual` shows the group `Tortilla` with 3 items, `Flan` with 2, `Otros` with
     `Pan`. `Huevos` shows two times. The subtitle says 5 items.
  3. Tick `Huevos` in `Tortilla`: it leaves the two groups, the headers show `1/3` and `1/2`,
     `1 comprado` shows at the end. Untick it there: it is back in the two groups.
  4. `⋯` on `Huevos` in `Flan`: the actions open in that copy only. Rename from there works.
  5. `Deshacer` after a send removes the group and the items it added.
  6. Delete the recipe `Flan`: its group is gone, `Leche` shows in `Otros`.
  7. `Terminar compra`: the next trip renders flat.
  8. Reload: the groups persist. Export, clear, import: the groups come back.
  9. Stop the server, reload: the app works offline. Start the server again for the user.
