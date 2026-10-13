# Engineering

## Modules

| Module | Responsibility | May import |
|---|---|---|
| `src/store.js` | Pure state operations and derived views | nothing |
| `src/recipes.js` | Pure recipe operations; resolves product names against the items | `store` |
| `src/shops.js` | Pure shop operations and the list by shop | `store` |
| `src/swipe.js` | The rule that settles the slide of an item row | nothing |
| `src/sections.js` | The order of the sections and the rule of the slide between them | nothing |
| `src/reorder.js` | The geometry of a row move: drop place, gap, new order | nothing |
| `src/storage.js` | Load, save, export, import, validation, the language key | `store`, `recipes` |
| `src/version.js` | Pure version rules | nothing |
| `src/i18n.js` | The language to show and the translator | `locales/*` |
| `src/locales/<lang>.js` | The text of one language | nothing |
| `src/app.js` | Render and event handling. The only module that touches the page | all of the above |
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
- **ENG-6** `src/app.js` is not imported by another module.
- **ENG-7** A module of `src/` is imported by its alias, `from '#store'`, never by a relative
  path. Node resolves `#name` through `imports` of `package.json`; the browser resolves it through
  the import map of `index.html`. `tests/aliases.test.js` checks that the two agree.
- **ENG-8** A new id comes from `crypto.randomUUID()`. An operation that creates a record takes
  the id function as a parameter, for the tests.

## Change guide

| Change | Do |
|---|---|
| A new list rule | An operation in `src/store.js` with its tests, then a control in `src/app.js` |
| A new recipe or shop rule | The same, in `src/recipes.js` or `src/shops.js` |
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
| `tests/store.test.js` | Items, the trip, the order, the search, the figures |
| `tests/recipes.test.js` | Recipes, the send, the groups, the search |
| `tests/shops.test.js` | Shops and the list by shop |
| `tests/storage.test.js` | Load, save, validation, migration, export, import, the language key |
| `tests/swipe.test.js` | The settle rule of a row slide |
| `tests/sections.test.js` | The slide between sections |
| `tests/reorder.test.js` | The geometry of a row move |
| `tests/version.test.js` | Version rules |
| `tests/i18n.test.js` | The language choice, the translator, the parity of the catalogs |
| `tests/markup.test.js` | `index.html` holds no text of its own |
| `tests/aliases.test.js` | The import map against `package.json` |
| `tests/png.test.js` | The PNG encoder and decoder of `scripts/png.mjs`, which `npm run icons` uses |
| `tests/changelog.test.js` | The release of `CHANGELOG.md` by `scripts/changelog.mjs`, which the version bump uses (VER-17) |
| `tests/spec.test.js` | The facts of this specification that the code can prove (ENG-12) |

A unit test uses `node:test` with `node:assert/strict`, one behaviour for each test, and checks
that the input state does not change.

## Checks with no test

- **ENG-9** `src/app.js`, `styles.css` and `sw.js` have no unit test. A change to one of them is
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
```
