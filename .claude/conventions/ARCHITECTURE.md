---
name: ARCHITECTURE
scope: local
load-order: 7
read-when: before a change that crosses a layer or module boundary
description: The shape of this component - its boundaries, its seams, and what it is responsible for.
---

# Architecture

An offline shopping list PWA for one Android phone, with an `Active` list for the
current trip and a `Next` list for the next trip. A `Recetas` section holds recipes: a
recipe is a name and a list of product names, and one tap sends them to `Active`.

**Stack:** plain HTML, CSS and ES modules. No build step and no dependencies.
`node:test` for unit tests (Node 20 or later). A static HTTPS host serves the
repository root.

## Layers

| Module | Responsibility | May import |
|---|---|---|
| `src/store.js` | Pure state operations and derived views | nothing |
| `src/recipes.js` | Pure recipe operations; resolves product names against the items | `store.js` |
| `src/storage.js` | Load, save, export, import, validation | `store.js` |
| `src/app.js` | Render and event handling | `store.js`, `recipes.js`, `storage.js` |
| `sw.js` | Offline cache of the app shell | nothing; it is not a module of the app |

The data model and the behaviour rules are in
`docs/superpowers/specs/2026-10-12-shopping-list-pwa-design.md`. Recipes and version 2
of the state are in `docs/superpowers/specs/2026-10-12-recipes-design.md`.

## Boundaries

- **`localStorage`**, key `shopping.v1`: the only data store. The state is
  `{ version: 2, items, recipes }`; a version 1 state is migrated when it is read. Invalid content is
  kept under `shopping.v1.corrupt`.
- **Cache API**, cache `shopping-shell-v2`: the app shell, served
  stale-while-revalidate.
- **Network:** only the static files of the same origin. There is no API and no
  account.
- **Files:** the JSON backup that the user exports and imports.

## Seams

- A new file that the app loads: add it to `SHELL` in `sw.js`.
- A change of the item shape: `normalizeItem` in `src/storage.js`, a new `version`
  and a migration in `load`.
- A new list rule: an operation in `src/store.js` with its tests, then a control in
  `src/app.js`.
- A new recipe rule: an operation in `src/recipes.js` with its tests, then a control in
  `src/app.js`.
- A change of the stored state that an old module cannot read: a new cache name in
  `sw.js`, so that the worker loads the full shell again.
- All URLs are relative, because the host serves the app below a subpath.
