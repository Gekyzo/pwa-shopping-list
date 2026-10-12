# Recipe search — design

## Context

`Recetas` shows all recipes in insertion order. With many recipes, the user must scroll to find
one. A search field filters the list.

The queue item is `recetas: buscador`. These decisions are Claude's, taken without a question
because each one is reversible:

| Topic | Decision |
|---|---|
| What matches | The recipe name, or the name of one of its products |
| How | The text is contained, without case or accent distinction, as the item search does |
| Order | Insertion order, as the full list |
| Storage | None. The text is screen state and goes away with a section change or a reload |

## Behaviour

- **Field:** `Buscar receta o producto`, above the list of `Recetas`, when there is one recipe at
  least. It stays in place while the list below changes, so the keyboard stays open.
- **Filter:** each key filters the list. An empty text shows all recipes.
- **Product match:** `huevo` shows each recipe with a product `Huevos`. The recipe row is not
  changed and does not open.
- **No match:** `Ninguna receta coincide con «text».` in place of the list.
- **Rows:** a row in the filtered list works as before: open, send, link, `⋯`.
- **Header:** the count of the header stays the count of all recipes.
- **Reset:** a tap on another section empties the text. A new recipe empties it too, so that the
  new recipe shows.

## Design

- `src/store.js`: `fold` is exported, so the recipe search folds text as the item search does.
- `src/recipes.js`: `searchRecipes(state, query)` returns the recipes that match, or all recipes
  for an empty query.
- `index.html`: a `search` input in `main`, before the list. It is static, because `render`
  builds the list again and a field in the list would lose the cursor at each key.
- `src/app.js`: `ui.recipeQuery`; the list of `Recetas` comes from `searchRecipes`; the text for
  no match; the two resets.
- `styles.css`: the field, with the look of the product field.

## Out of scope

A search in `Actual` and `Próxima`, a ranking of the results, a mark on the text that matches, a
stored search.
