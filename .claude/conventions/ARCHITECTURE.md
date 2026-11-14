---
name: ARCHITECTURE
scope: local
load-order: 7
read-when: before a change that crosses a layer or module boundary
description: The shape of this component - its boundaries, its seams, and what it is responsible for.
---

# Architecture

An offline-first shopping list PWA, mobile first. One list, `Compra`, holds the items of the
current trip; an item can also be saved for later (`saved`) or postponed to the next trip
(`postponed`). A `Recetas` section holds recipes: a recipe is a name and a list of product names,
and one tap sends them to `Compra`. `Menú` plans the meals of the week and fills `Compra`. A
Google account syncs the data between devices and shares a list by email.

**Stack:** plain HTML, CSS and ES modules. No build step and no dependencies.
`node:test` for unit tests (Node 20 or later). A static HTTPS host serves the
repository root.

## Layers

| Module | Responsibility | May import |
|---|---|---|
| `src/store.js` | Pure state operations and derived views | nothing |
| `src/lists.js` | The combined state of a member: the own list and the shared list in one state, the split back into two, the list of an add, the manual move in one list, the fill of each list from its menu and the counts of the list chips | `store`, `menu` |
| `src/recipes.js` | Pure recipe operations; resolves product names against the items | `store` |
| `src/shops.js` | Pure shop operations and the list by shop | `store` |
| `src/aisles.js` | Pure aisle operations and the list by aisle | `store` |
| `src/swipe.js` | The rule that settles the swipe of an item row | nothing |
| `src/device.js` | The width classes of DSV-9, the parts of each class (NAV-28), the pointers that slide and what a click on a row does (ROW-1) | nothing |
| `src/sections.js` | The order of the sections, the address of each one, the rule of the slide that changes the section, the start of a launcher shortcut, and what an empty section says and offers, the collapse of the `+` button on a scroll | nothing |
| `src/layers.js` | The layers over a section: whether a sheet is open, and the top layer that `Escape` and the back close (`closeTop`) | nothing |
| `src/onboarding.js` | The pages of the walkthrough, the rule that shows it and the step between pages | nothing |
| `src/reorder.js` | The rules of a row move: drop place, gap, new order | nothing |
| `src/sheets.js` | The rules of a sheet: when a field save shows `Guardado`, and for how long | nothing |
| `src/suggest.js` | The rows above the add input: create first, then the matching items, and which are in the list | `store` |
| `src/menu.js` | Pure menu operations: the weeks, the meals of a day, the fill of the list from the menu | `store`, `recipes` |
| `src/storage.js` | Load, save, export, import, validation, the preferences of the device | `store`, `recipes`, `menu` |
| `src/records.js` | The state as records, one for each entity, and the diff of two sets (SYNC-1, SYNC-2) | nothing |
| `src/sync.js` | The queue of record changes, the merge of pulled records and the duplicates (SYNC-5 to SYNC-7) | `records` |
| `src/session.js` | The stored session, sync state and queue of the own lane and the shared lane (ACC-6, SHARE-12) | `storage` |
| `src/shares.js` | The rules of a shared space: which space a user syncs, and what `Compartir lista` shows (SHARE-1 to SHARE-9) | nothing |
| `src/config.js` | The API URL for the host that serves the app (ACC-12) | nothing |
| `src/pocketbase.js` | The REST client of the PocketBase server, with `fetch` and `EventSource` injected (ACC-12, SYNC-4) | `records` |
| `src/syncer.js` | The sync driver: queue, push, pull and merge of the own lane and the shared lane, login, logout and shares | `pocketbase`, `records`, `session`, `shares`, `storage`, `store`, `sync` |
| `src/install.js` | The install offer of the browser: `idle`, `available` or `installed` (INS-1) | nothing |
| `src/whatsnew.js` | The release notes of `release-notes/<lang>.md` and the versions to show after an update (VER-20) | `version` |
| `src/version.js` | Pure version rules: validation, comparison, the next version | nothing |
| `src/update.js` | Actualizar: a new worker of the host takes control, or the worker in control loads its shell again (VER-8) | nothing |
| `src/i18n.js` | The language to show (`resolveLanguage`) and the function `t(key, params)` of one language (`translator`) | `locales/*` |
| `src/locales/<lang>.js` | The text of one language: a flat object from key to a text or to `{ one, other }` | nothing |
| `src/ui/context.js` | The values that the views share, their setters, the toast, the save and `render`, the combined state of a member, the week of today | `store`, `storage`, `session`, `lists`, `menu`, `i18n`, `onboarding` |
| `src/ui/view.js` | What the screen shows of the state: the list chip and the list in view, the tag of a row, the target of an add, the search, the open row, the grouping | `store`, `recipes`, `shops`, `lists`, `shares`, `ui/context` |
| `src/ui/device.js` | The width class of the window in `ui.device` (NAV-28) | `device`, `ui/context` |
| `src/ui/motion.js` | The motion of rows: close, open, slide to a new place | `ui/context` |
| `src/ui/controls.js` | The controls that several views use: icons, the rename field and its `Guardado`, the more button | `sheets`, `ui/context` |
| `src/ui/edit.js` | The edit sheet `Editar` | `store`, `lists`, `shops`, `aisles`, `ui/context`, `ui/controls` |
| `src/ui/drag.js` | The manual order: the lift of a row, its move and its drop | `device`, `reorder`, `ui/context`, `ui/view`, `ui/motion` |
| `src/ui/rows.js` | The item rows, their side menus, their swipe and the hint of the swipe | `device`, `lists`, `store`, `swipe`, `storage`, `ui/context`, `ui/view`, `ui/motion`, `ui/controls`, `ui/edit`, `ui/drag` |
| `src/ui/recipes.js` | The section `Recetas` | `recipes`, `menu`, `lists`, `ui/context`, `ui/controls`, `ui/motion`, `ui/rows`, `ui/view` |
| `src/ui/menu.js` | The section `Menú` and its meal sheet | `recipes`, `menu`, `lists`, `i18n`, `ui/context`, `ui/controls`, `ui/recipes`, `ui/nav`, `ui/rows`, `ui/view` |
| `src/ui/arrange.js` | The arrange sheet: the grouping, the order, the row of shop lists | `store`, `shops`, `ui/context`, `ui/view`, `ui/motion` |
| `src/ui/list.js` | The list `Compra`: rows, search, list chips, shop lists, the dock and its shop picker, header, trip sheet | `store`, `recipes`, `shops`, `lists`, `shares`, `aisles`, `menu`, `sections`, `device`, `ui/context`, `ui/view`, `ui/controls`, `ui/motion`, `ui/rows`, `ui/recipes`, `ui/menu`, `ui/add`, `ui/nav` |
| `src/ui/panels.js` | The side panels of `Compra` and `Menú`: `Recetas en la lista`, `Próxima compra` and `Almacenamiento local` (LIST-38, LIST-39, LIST-43) | `menu`, `recipes`, `storage`, `store`, `ui/context`, `ui/controls`, `ui/menu`, `ui/nav`, `ui/recipes`, `ui/rows`, `ui/view` |
| `src/ui/add.js` | The add sheet | `store`, `recipes`, `shops`, `suggest`, `ui/context`, `ui/view` |
| `src/ui/onboarding.js` | The walkthrough and the load of the sample recipe | `onboarding`, `recipes`, `sections`, `storage`, `ui/context`, `ui/controls` |
| `src/ui/aisles.js` | The sheet of the aisles of `Ajustes` | `aisles`, `ui/context`, `ui/controls` |
| `src/ui/settings.js` | `Ajustes`: version and update, language, hand, theme, density, the end of a trip, the reach of a twin, export and import, the delete of the sample recipe, the delete of all data | `recipes`, `sections`, `storage`, `version`, `update`, `i18n`, `ui/account`, `ui/context`, `ui/onboarding` |
| `src/ui/account.js` | The account screens (`Iniciar sesión`, `Usar sin cuenta`, `Esperando aprobación`), the sync of the device and the row `Cuenta` of `Ajustes` (ACC-2, ACC-10, ACC-13) | `config`, `i18n`, `pocketbase`, `records`, `session`, `shares`, `storage`, `store`, `syncer`, `ui/context`, `ui/view` |
| `src/ui/share.js` | The sheet `Compartir lista` (SHARE-9) | `shares`, `ui/account`, `ui/context` |
| `src/ui/install.js` | The install button of `Ajustes` and the prompt of the browser (INS-1) | `install`, `ui/context` |
| `src/ui/whatsnew.js` | The sheet of the release notes after an update (VER-20) | `ds/sheet`, `i18n`, `onboarding`, `storage`, `ui/context`, `whatsnew` |
| `src/ui/nav.js` | The bottom bar and the change of section | `sections`, `device`, `layers`, `ui/context`, `ui/drag`, `ui/settings` |
| `src/app.js` | The start of the app: the render of the screen, the bind of each view, the listeners of the document | all of the above |
| `sw.js` | Offline cache of the app shell | nothing; it is not a module of the app |

The data model and the behaviour rules are in `docs/spec/`: the state in
`docs/spec/02-data-model.md`, the storage in `docs/spec/08-storage.md`, the account and the sync in
`docs/spec/18-account-sync.md`, the shares in `docs/spec/19-sharing.md`.

## Boundaries

- **`localStorage`**, key `shopping.v1`: the only data store. The state is
  `{ version: 10, items, recipes, sent, group, sort, menu, aisles }`; a state of version 1 to 9 is migrated when it is read. Invalid content is
  kept under `shopping.v1.corrupt`.
- **`localStorage`**, key `shopping.lang`: the language that the user chose in `Ajustes`, one of
  `ca`, `de`, `en`, `es`, `fr`, `it`, `pt`. No key means that the app follows `navigator.languages`,
  with `en` as the fallback. It is not part of the state and not part of the backup.
- **`localStorage`**, key `shopping.onboarded`: `1` after the walkthrough of the first start closed. No
  key and no `shopping.v1` means a new install, which shows the walkthrough. It is not part of the
  state and not part of the backup.
- **`localStorage`**, key `shopping.swipeHint`: `1` after `Compra` showed the slide of a row one
  time (ROW-14). It is not part of the state and not part of the backup.
- **`localStorage`**, keys `shopping.shared.v1`, `shopping.shared.sync` and `shopping.shared.queue`: the
  shared lane of a member (SHARE-12). The first is a plain state of version 10 (the shared part, with no
  `shared` marker); the others are the sync state, with the `scope` of the share, and the queue of the
  shared space. `src/session.js` reads and writes them; `clearAccountData` and `resetAll` remove them.
- **`localStorage`**, the preferences of the device: `shopping.hand`, `shopping.theme`,
  `shopping.density`, `shopping.shopLists`, `shopping.tripEnd`, `shopping.twinReach` and
  `shopping.seen-version` (the newest version whose release notes the user saw, VER-20). They are
  not part of the state and not part of the backup.
- **`localStorage`**, the account of the own lane: `shopping.session`, `shopping.sync`,
  `shopping.queue`, `shopping.v1.beforeLogin` (the list that a first login replaced) and
  `shopping.offline` (`1` after `Usar sin cuenta`, ACC-13). `sessionStorage` key `shopping.oauth`
  holds the state and the verifier for the time of the Google redirect only (ACC-5).
- **Cache API**, cache `shopping-shell-v54`: the app shell, served
  stale-while-revalidate. A request with the `latest` parameter goes to the network
  only. The message `{ type: 'refresh' }` loads the full shell again and answers
  `{ ok }` on the message port. Cache `shopping-manifest` holds the text of the manifest in the
  language of the screen, which the page sends with the message `{ type: 'manifest' }`.
- **`version.json`**, `{ version, date }`: the semantic version of the deploy. The app reads the
  cached copy one time at the start (the running version) and the copy of the host
  when `Ajustes` opens (the deployed version). `scripts/bump-version.mjs` is its only writer, and
  writes the same version to `package.json`; `npm run release` runs it. `.githooks/pre-push` stops
  a push of a tag `vX.Y.Z` whose `version.json` has another version.
- **Network:** the static files of the same origin and the PocketBase API of the account,
  `https://api.polarisworks.duckdns.org` (`http://localhost:8090` on a local host, ACC-12). A
  device with no session sends nothing.
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
