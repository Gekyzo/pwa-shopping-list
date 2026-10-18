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
| `src/shops.js` | Pure shop operations and the list by shop | `store.js` |
| `src/aisles.js` | Pure aisle operations and the list by aisle | `store.js` |
| `src/barcode.js` | Pure barcode rules: a valid code, the learned name of a code | nothing |
| `src/swipe.js` | The rule that settles the swipe of an item row | nothing |
| `src/sections.js` | The order of the sections, the rule of the slide that changes the section, and the start of a launcher shortcut | nothing |
| `src/onboarding.js` | The pages of the walkthrough, the rule that shows it and the step between pages | nothing |
| `src/reorder.js` | The rules of a row move: drop place, gap, new order | nothing |
| `src/storage.js` | Load, save, export, import, validation | `store.js`, `recipes.js` |
| `src/version.js` | Pure version rules: validation, comparison, the next version | nothing |
| `src/i18n.js` | The language to show (`resolveLanguage`) and the function `t(key, params)` of one language (`translator`) | `locales/*` |
| `src/locales/<lang>.js` | The text of one language: a flat object from key to a text or to `{ one, other }` | nothing |
| `src/ui/context.js` | The values that the views share, their setters, the toast, the save and `render` | `store`, `storage`, `i18n`, `onboarding` |
| `src/ui/view.js` | What the screen shows of the state: the list in view, the search, the open row, the grouping | `store`, `recipes`, `shops`, `ui/context` |
| `src/ui/motion.js` | The motion of rows: close, open, slide to a new place | `ui/context` |
| `src/ui/controls.js` | The controls that several views use: icons, the rename field, the more button | `store`, `ui/context`, `ui/view` |
| `src/ui/edit.js` | The edit sheet `Editar` | `store`, `shops`, `aisles`, `ui/context` |
| `src/ui/drag.js` | The manual order: the lift of a row, its move and its drop | `store`, `reorder`, `ui/context`, `ui/view`, `ui/motion` |
| `src/ui/rows.js` | The item rows, their side menus and their swipe | `store`, `swipe`, `ui/context`, `ui/view`, `ui/motion`, `ui/controls`, `ui/edit`, `ui/drag` |
| `src/ui/recipes.js` | The section `Recetas` | `store`, `recipes`, `ui/context`, `ui/controls`, `ui/motion` |
| `src/ui/menu.js` | The section `Menú` and its meal sheet | `recipes`, `menu`, `i18n`, `ui/context`, `ui/recipes` |
| `src/ui/arrange.js` | The arrange sheet: the grouping, the order, the row of shop lists | `store`, `shops`, `ui/context`, `ui/view`, `ui/motion` |
| `src/ui/list.js` | The lists `Actual` and `Próxima`: rows, search, shop lists, header, trip sheet | `store`, `recipes`, `shops`, `aisles`, `menu`, `ui/context`, `ui/view`, `ui/rows`, `ui/recipes`, `ui/menu` |
| `src/ui/add.js` | The add sheet and the scanned code that waits for a name | `store`, `recipes`, `shops`, `barcode`, `ui/context`, `ui/view`, `ui/scan` |
| `src/ui/scan.js` | The scan sheet: the camera and the read of a barcode | `barcode`, `ui/context` |
| `src/ui/onboarding.js` | The walkthrough and the load of the sample recipe | `onboarding`, `recipes`, `sections`, `storage`, `ui/context`, `ui/controls` |
| `src/ui/aisles.js` | The sheet of the aisles of `Ajustes` | `aisles`, `ui/context`, `ui/controls` |
| `src/ui/settings.js` | `Ajustes`: version and update, language, hand, theme, export and import, the delete of the sample recipe | `store`, `recipes`, `sections`, `storage`, `version`, `i18n`, `ui/context`, `ui/onboarding` |
| `src/ui/nav.js` | The bottom bar and the change of section | `sections`, `ui/context`, `ui/drag`, `ui/settings` |
| `src/app.js` | The start of the app: the render of the screen, the bind of each view, the listeners of the document | all of the above |
| `sw.js` | Offline cache of the app shell | nothing; it is not a module of the app |

The data model and the behaviour rules are in
`docs/superpowers/specs/2026-10-12-shopping-list-pwa-design.md`. Recipes and version 2
of the state are in `docs/superpowers/specs/2026-10-12-recipes-design.md`. Shops and version 3 of the
state are in `docs/superpowers/specs/2026-10-13-shops-design.md`.

## Boundaries

- **`localStorage`**, key `shopping.v1`: the only data store. The state is
  `{ version: 9, items, recipes, sent, group, sort, menu, aisles, codes }`; a state of version 1 to 8 is migrated when it is read. Invalid content is
  kept under `shopping.v1.corrupt`.
- **`localStorage`**, key `shopping.lang`: the language that the user chose in `Ajustes`, one of
  `ca`, `de`, `en`, `es`, `fr`, `it`, `pt`. No key means that the app follows `navigator.languages`,
  with `en` as the fallback. It is not part of the state and not part of the backup.
- **`localStorage`**, key `shopping.onboarded`: `1` after the walkthrough of the first start closed. No
  key and no `shopping.v1` means a new install, which shows the walkthrough. It is not part of the
  state and not part of the backup.
- **Cache API**, cache `shopping-shell-v14`: the app shell, served
  stale-while-revalidate. A request with the `latest` parameter goes to the network
  only. The message `{ type: 'refresh' }` loads the full shell again and answers
  `{ ok }` on the message port.
- **`version.json`**, `{ version, date }`: the semantic version of the deploy. The app reads the
  cached copy one time at the start (the running version) and the copy of the host
  when `Ajustes` opens (the deployed version). `scripts/bump-version.mjs` is its only writer, and
  writes the same version to `package.json`; `.githooks/pre-push` runs it for a patch.
- **Network:** only the static files of the same origin. There is no API and no
  account.
- **Camera:** only while the scan sheet is open, through `getUserMedia` and the native
  `BarcodeDetector`. No image leaves the phone.
- **Files:** the JSON backup that the user exports and imports.

## Seams

- A new text of the screen: one key in each catalog of `src/locales/`, with the same placeholders.
  The screen code, `src/app.js` and `src/ui/`, is the only code that calls `t`. A fixed text of `index.html` is a `data-i18n` key.
- A new language: a catalog, its entry in `CATALOGS` and in `LANGUAGE_NAMES` of `src/i18n.js`, its
  alias `#locales/<lang>` in the import map, and its file in `SHELL`.
- An error of a pure module is a message `{ key, params }`, never text. A `list` parameter holds a
  list id.
- A new file that the app loads: add it to `SHELL` in `sw.js`.
- A new module of `src/`: add its alias `#name` to the import map in `index.html`. Node resolves the
  alias through `imports` in `package.json` with no edit. `tests/aliases.test.js` checks the map.
- An import of a module of `src/` uses the alias (`from '#store'`), never a relative path.
- A change of the item shape: `normalizeItem` in `src/storage.js`, a new `version`
  and a migration in `load`.
- A new list rule: an operation in `src/store.js` with its tests, then a control in
  its view of `src/ui/`.
- A new shop rule: an operation in `src/shops.js` with its tests, then a control in
  its view of `src/ui/`.
- A new aisle rule: an operation in `src/aisles.js` with its tests, then a control in
  its view of `src/ui/`.
- A new recipe rule: an operation in `src/recipes.js` with its tests, then a control in
  its view of `src/ui/`.
- A new view: a module of `src/ui/` with a `bind()` that `src/app.js` calls. It reads the shared
  values from `#ui/context` and changes them only through a setter. `tests/layers.test.js` checks
  the layer rules.
- A change of the stored state that an old module cannot read: a new cache name in
  `sw.js`, so that the worker loads the full shell again.
- All URLs are relative, because the host serves the app below a subpath. This includes the
  addresses of the import map.
