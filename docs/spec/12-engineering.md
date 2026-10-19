# Engineering

## Modules

| Module | Responsibility | May import |
|---|---|---|
| `src/store.js` | Pure state operations and derived views | nothing |
| `src/recipes.js` | Pure recipe operations; resolves product names against the items | `store` |
| `src/shops.js` | Pure shop operations and the list by shop | `store` |
| `src/aisles.js` | Pure aisle operations and the list by aisle | `store` |
| `src/menu.js` | Pure menu operations and the fill of `Compra` | `store`, `recipes` |
| `src/swipe.js` | The rule that settles the slide of an item row | nothing |
| `src/sections.js` | The order of the sections, the rule of the slide between them, the start of a shortcut and what an empty section says and offers, the collapse of the `+` button on a scroll | nothing |
| `src/layers.js` | The layers over a section: whether a sheet is open, and the top layer that `Escape` and the back close (`closeTop`) | nothing |
| `src/onboarding.js` | The pages of the walkthrough, the rule that shows it and the step between pages | nothing |
| `src/reorder.js` | The geometry of a row move: drop place, gap, new order | nothing |
| `src/sheets.js` | The rules of a sheet: when a field save shows `Guardado`, and for how long | nothing |
| `src/suggest.js` | The rows above the add input: create first, then the matching items, and which are in the list | `store` |
| `src/storage.js` | Load, save, export, import, validation, the language key and the device preferences | `store`, `recipes`, `menu` |
| `src/version.js` | Pure version rules | nothing |
| `src/install.js` | The install offer state machine | nothing |
| `src/i18n.js` | The language to show and the translator | `locales/*` |
| `src/locales/<lang>.js` | The text of one language | nothing |
| `src/ui/context.js` | The values that the views share, their setters, the toast, the save and `render` | `store`, `storage`, `i18n`, `onboarding` |
| `src/ui/view.js` | What the screen shows of the state: the list in view, the search, the open row, the grouping | `store`, `recipes`, `shops`, `ui/context` |
| `src/ui/motion.js` | The motion of rows: close, open, slide to a new place | `ui/context` |
| `src/ui/controls.js` | The controls that several views use: icons, icon buttons, the save of a sheet field and the `Guardado` of a sheet save | `sheets`, `ui/context` |
| `src/ui/edit.js` | The edit sheet `Editar` | `store`, `shops`, `aisles`, `ui/context`, `ui/controls` |
| `src/ui/drag.js` | The manual order: the lift of a row, its move and its drop | `store`, `reorder`, `ui/context`, `ui/view`, `ui/motion` |
| `src/ui/rows.js` | The item rows, their side menus, their swipe and the hint of the swipe | `store`, `swipe`, `storage`, `ui/context`, `ui/view`, `ui/motion`, `ui/controls`, `ui/edit`, `ui/drag` |
| `src/ui/recipes.js` | The section `Recetas` and the recipe sheet | `store`, `recipes`, `menu`, `ui/context`, `ui/controls`, `ui/motion`, `ui/rows` |
| `src/ui/menu.js` | The section `Menú` and its meal sheet | `recipes`, `menu`, `i18n`, `ui/context`, `ui/recipes`, `ui/nav` |
| `src/ui/arrange.js` | The arrange sheet: the grouping, the order, the row of shop lists | `store`, `shops`, `ui/context`, `ui/view`, `ui/motion` |
| `src/ui/list.js` | The list `Compra`: rows, search, shop lists, the dock and its shop picker, header, trip sheet | `store`, `recipes`, `shops`, `aisles`, `menu`, `sections`, `ui/context`, `ui/view`, `ui/controls`, `ui/rows`, `ui/recipes`, `ui/menu`, `ui/add`, `ui/nav` |
| `src/ui/add.js` | The add sheet | `store`, `recipes`, `shops`, `suggest`, `ui/context`, `ui/view` |
| `src/ui/onboarding.js` | The walkthrough and the load of the sample recipe | `onboarding`, `recipes`, `sections`, `storage`, `ui/context`, `ui/controls` |
| `src/ui/aisles.js` | The sheet of the aisles of `Ajustes` | `aisles`, `ui/context`, `ui/controls` |
| `src/ui/install.js` | The Install button of `Ajustes` | `install`, `ui/context` |
| `src/ui/settings.js` | `Ajustes`: version and update, language, hand, theme, export and import, the delete of the sample recipe | `recipes`, `sections`, `storage`, `version`, `i18n`, `ui/context`, `ui/onboarding` |
| `src/ui/nav.js` | The bottom bar and the change of section | `sections`, `layers`, `ui/context`, `ui/drag`, `ui/settings` |
| `src/app.js` | The start of the app: the render of the screen, the bind of each view, the listeners of the document. With `src/ui/`, the only code that touches the page | all of the above |
| `sw.js` | Offline cache of the app shell. Not a module of the app | nothing |

## Code rules

- **ENG-1** A state operation is a pure function `(state, …) → { state }`. It never changes its
  input.
- **ENG-2** A rejected operation returns `{ state, error }` with the same state object. Nothing
  throws for a user error. `error` is a message `{ key, params }`.
- **ENG-3** An operation that changes nothing returns the same state object, where a caller needs
  to know that (`reorderItems`, `sendRecipe`, `addItemShop`, `removeItemShop`, `bringToList` with
  `changed`).
- **ENG-4** The screen applies an operation, saves, then builds the page again from the state.
- **ENG-5** A module with a side effect takes the object of that effect as a parameter (the
  storage object), so that a test passes a fake.
- **ENG-6** No module imports `src/app.js`. A view of `src/ui/` renders the screen through
  `render` of `src/ui/context.js`.
- **ENG-7** A module of `src/` is imported by its alias, `from '#store'`, never by a relative
  path. Node resolves `#name` through `imports` of `package.json`; the browser resolves it through
  the import map of `index.html`. `tests/aliases.test.js` checks that the two agree.
- **ENG-8** A new id comes from `crypto.randomUUID()`. An operation that creates a record takes
  the id function as a parameter, for the tests.
- **ENG-16** The screen code is `src/app.js` and the views of `src/ui/`. A view never imports
  `src/app.js`, a pure module never imports a view, and the imports among the views have no
  cycle. `src/ui/context.js` owns the values that the views share; another module reads them
  through its import and changes them only through a setter. `tests/layers.test.js` checks this.
- **ENG-17** On the dev server (`localhost`, `127.0.0.1` or `[::1]`, as `npm run serve` gives) the
  app writes a debug log to the console: the state at the start, each change of section, each change
  of the state as a list of item changes, each message and each `Deshacer`. Each line starts with
  `[shopping]`, and `copy(shoppingLog.join('\n'))` in the console copies the full log. On any other
  host, such as the deploy, it writes nothing and compares nothing.

## Change guide

| Change | Do |
|---|---|
| A new list rule | An operation in `src/store.js` with its tests, then a control in its view of `src/ui/` |
| A new view | A module of `src/ui/` with a `bind()` that `src/app.js` calls, its alias, its file in `SHELL` and its row in the module table |
| A new recipe, shop or aisle rule | The same, in `src/recipes.js`, `src/shops.js` or `src/aisles.js` |
| A change of the shape of an item | `normalizeItem` in `src/storage.js`, a new `version` and its migration |
| A new text | A key in each of the seven catalogs, with the same placeholders |
| A new module of `src/` | Its alias in the import map of `index.html`, and its file in `SHELL` of `sw.js` |
| A new file that the app loads | Its path in `SHELL` of `sw.js` |
| A stored state that an old module cannot read | A new cache name in `sw.js` |
| A change of behaviour | The rule in this specification, in the same commit |

## Tests

`npm test` runs `node --test` (Node 20 or later).

| Test file | Covers |
|---|---|
| `tests/store.test.js` | Items, the trip, the order, the search, the figures, the bring back of a saved item |
| `tests/recipes.test.js` | Recipes, the send, the groups, the search, the sample recipe |
| `tests/shops.test.js` | Shops and the list by shop |
| `tests/aisles.test.js` | Aisles, the aisle of an item and the list by aisle |
| `tests/menu.test.js` | The meals of the week and the fill |
| `tests/storage.test.js` | Load, save, validation, migration, export, import, the language key and the device preferences |
| `tests/swipe.test.js` | The settle rule of a row slide |
| `tests/sw.test.js` | The manifest text that the worker puts in place, with the names of the shortcuts (SW-13) |
| `tests/layer-order.test.js` | The open sheet and the order of the layers that `Escape` and the back close (NAV-25) |
| `tests/sections.test.js` | The slide between sections; the start of each shortcut and its place in the manifest (SHORT-1, SHORT-2) |
| `tests/onboarding.test.js` | The show rule and the page steps of the walkthrough |
| `tests/reorder.test.js` | The geometry of a row move |
| `tests/sheets.test.js` | When a save of a sheet shows `Guardado` (NAV-22) |
| `tests/suggest.test.js` | The rows above the add input: create first, the cap of 6, which are in the list (ADD-2) |
| `tests/version.test.js` | Version rules |
| `tests/install.test.js` | The install offer states (INS-1) |
| `tests/i18n.test.js` | The language choice, the translator, the parity of the catalogs |
| `tests/markup.test.js` | `index.html` holds no text of its own |
| `tests/aliases.test.js` | The import map against `package.json`; each `#ds/` alias names a vendored module |
| `tests/layers.test.js` | The layer rules: no import of `src/app.js`, no view in a pure module, no cycle among `src/ui/`, one owner for each shared value, `SHELL` (ENG-16) |
| `tests/design.test.js` | Each rule of `vendor/design-system/rules.js` over the two stylesheets, `index.html`, `icons.svg`, `src/ui/` and `designs/` (DSV-8); the classes of the item rows |
| `tests/vendor.test.js` | The copy of the design system: its files and hashes, its place in `index.html`, `designs/index.html` and `SHELL`, no copied rule in `styles.css` (DSV-1 to DSV-3) |
| `tests/png.test.js` | The PNG encoder and decoder of `scripts/png.mjs`, which `npm run icons` uses |
| `tests/glyph.test.js` | The segments of a line icon of `scripts/glyph.mjs`, which `npm run icons` draws for the shortcut icons |
| `tests/release.test.js` | The release of `scripts/release.mjs`: the bump commit, the tag and the refusals (VER-10 to VER-12) |
| `tests/changelog.test.js` | The release of `CHANGELOG.md` by `scripts/changelog.mjs`, which the version bump uses (VER-17) |
| `tests/spec.test.js` | The facts of this specification that the code can prove (ENG-12) |

A unit test uses `node:test` with `node:assert/strict`, one behaviour for each test, and checks
that the input state does not change.

## Checks with no test

- **ENG-9** `src/app.js`, the views of `src/ui/`, `styles.css` and `sw.js` have no unit test. A change to one of them is
  checked in a browser at a phone viewport, with `npm run serve`. The offline check runs with the
  server stopped.
- **ENG-10** `.githooks/pre-push` and `.githooks/pre-commit` have no test. They are checked in a
  scratch clone, the first one with a bare remote.
- **ENG-11** A task is done when `npm test` passes and, for a change of the screen or of `sw.js`,
  the browser check ran.

## Upkeep of this specification

Three mechanisms keep the specification and the code together. No one of them proves that the text
of a rule is correct; that stays a review by the author.

- **ENG-12** `tests/spec.test.js` compares the specification with the code: each rule identifier is
  defined one time and each named rule exists; each link has its file and the index lists each
  document; the state version, the groups and the orders; the storage keys and the cache name; the
  languages; each `error.*` and `toast.*` key that a document names; the module table against
  `src/` and against the imports of each module; the test table against `tests/`.
- **ENG-13** `.githooks/pre-commit`, enabled with `npm run hooks`, stops a commit that stages a
  change of the app with no staged change of `docs/spec/`. The app is `src/`, `sw.js`,
  `index.html` and `manifest.webmanifest`. Of the catalogs of `src/locales/`, only `es.js` counts.
- **ENG-14** A commit that changes no rule, such as a refactor, passes with
  `git commit --no-verify`, and its body says that no rule changed.
- **ENG-15** A change of behaviour changes its rule in the same commit as the code. This is part
  of the definition of done.

## Commands

```sh
npm test         # unit tests
npm run serve    # http://localhost:8080
npm run icons    # write the PNG icons again
npm run hooks    # enable .githooks/ in this clone
npm run release  # bump the version, commit it and tag it vX.Y.Z
```
