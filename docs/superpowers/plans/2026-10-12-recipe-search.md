# Recipe search — implementation plan

**Spec:** `docs/superpowers/specs/2026-10-12-recipe-search-design.md`

## Files

| File | Change |
|---|---|
| `src/store.js` | Export `fold` |
| `src/recipes.js` | New view `searchRecipes` |
| `tests/recipes.test.js` | Tests of `searchRecipes` |
| `index.html`, `styles.css` | The search field |
| `src/app.js` | `ui.recipeQuery`, the filtered list, the text for no match, the resets |
| `README.md` | The search |

## Steps

Per `WORKFLOW.md`: commit this plan with its companion and the spec, then
`plan-current.sh start`, and `task N start` / `task N land` for each task. One commit for each
task. No push unless the user asks.

### Task 1: Recipe search rule

1. `tests/recipes.test.js`, failing: an empty query and a query of spaces return all recipes; a
   match on the name; a match on a product; no case and no accent distinction; insertion order;
   no match returns an empty list; the state does not change.
2. `npm test`: fails, `searchRecipes` is not exported.
3. `src/store.js`, `src/recipes.js`. `npm test`: passes. Commit.

### Task 2: Search field in Recetas

1. `index.html`, `styles.css`, `src/app.js`, `README.md` as in the spec.
2. `npm test`.
3. Browser check (below). Commit.

## Verification

- `npm test`: all tests pass.
- A server on a spare port, `agent-browser` at 390 × 844.
  1. `Recetas` with three recipes: the field shows. `Actual`, `Próxima` and `Ajustes` do not
     show it.
  2. Typed text filters by name; the field keeps the focus and its text.
  3. A text that is only a product name shows the recipes with that product. A text without
     its accent matches.
  4. A text with no match shows `Ninguna receta coincide con «…».`
  5. A row of the filtered list opens, and its products show.
  6. A tap on another section and back: the field is empty and all recipes show.
  7. A new recipe made while a filter is on: the field is empty and the new recipe shows.
  8. No recipe: no field, and the text `No hay recetas…` shows.
  9. A screenshot with a filter on; look at it.
  10. Stop the server, reload: the app works offline.
