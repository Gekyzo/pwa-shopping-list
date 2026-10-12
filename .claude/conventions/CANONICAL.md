---
name: CANONICAL
scope: tree
load-order: 5
read-when: before creating a file or class, or reshaping one
description: The canonical files new code is copied from, and the design patterns in force.
---

# Canonical files and patterns

New code of a kind listed below **starts from its exemplar**, not from scratch and not
from whichever similar file happens to be nearest. When `/canon <type>` has a template
for that kind, use it — the template is the exemplar made executable.

## Canonical exemplars

| Kind | File | Why this one |
|---|---|---|
| State operation | `src/store.js` | Each export is a pure function `(state, …) → { state }` or `{ state, error }`. It has no DOM access and no storage access. |
| Module with a side effect | `src/storage.js` | The storage object is a parameter, so the tests pass a fake. Each read validates the data before the app uses it. |
| Unit test | `tests/store.test.js` | `node:test` with `node:assert/strict`, a `build` helper for the start state, one behaviour for each test, and a check that the input state does not change. |

## Patterns

- **Immutable state.** One object `{ version, items, recipes, sent, grouped, sort }`. An operation returns a new
  object and never changes its input.
- **Errors as values.** A rejected operation returns `{ state, error }` with the
  same state object. Nothing throws for a user error.
- **Render from state.** `src/app.js` applies an operation, saves, then builds the
  list again from the state. The DOM holds no data of its own.
- **Derived views.** The `Next` view is computed by `nextItems`, and the groups of `Active` by
  `recipeGroups`. The name order is computed by `sortItems`; `items` keeps the insertion order. An item is one
  record and is never copied between lists.
- **Text only.** DOM nodes get user text through `textContent`, never `innerHTML`.

## Do not copy

None found. `src/app.js` is the only file that touches the DOM; do not import it
from another module.

## Naming

- Files: lower case, one word where possible (`store.js`, `storage.js`).
- Exports: camelCase verbs for operations (`toggleBought`), nouns for views
  (`activeItems`), upper case for constants (`STORAGE_KEY`).
- Tests: `tests/<module>.test.js`.
