# Engineering

The code rules, the module layers, the checks and the upkeep of the specification. Source:
`src/store.js`, `src/storage.js`, `src/ui/context.js`, `package.json`, `index.html` (import map),
`.githooks/pre-commit`, `tests/aliases.test.js`, `tests/layers.test.js`, `tests/spec.test.js`.
Judged at commit `f822a77` (`main`); `npm test` passes 613 of 613.

## Modules

The web app has one ES module for each duty. The target keeps the split of duties, not the files.
Suggested Gradle modules and packages for the port:

| Web module(s) | Duty | Target |
|---|---|---|
| `src/store.js`, `recipes.js`, `shops.js`, `aisles.js`, `menu.js`, `suggest.js`, `version.js` | Pure state operations and derived views | `:core` (pure Kotlin/JVM module, no Android dependency) |
| `src/swipe.js`, `sections.js`, `layers.js`, `onboarding.js`, `reorder.js`, `sheets.js`, `install.js` | Pure rules of gestures, layers, walkthrough, sheet save note | `:core` (pure functions; `install.js` is dropped, see `11-install`) |
| `src/storage.js` | Load, save, validation, migration, export, import, device preferences | `:data` (DataStore or a file, JSON codec) |
| `src/i18n.js`, `src/locales/*.js` | Language choice, translator, catalogs | `res/values-*/strings.xml` and plurals, or a `:core` catalog |
| `src/ui/context.js` | Shared screen values, setters, toast, save, render | `ViewModel` with `StateFlow` |
| `src/ui/*.js` other views | The screens and sheets | `:app` Compose screens |
| `src/app.js` | Start, bind of the views, document listeners | `MainActivity` and the Compose root |
| `sw.js` | Offline cache of the shell | dropped (an installed APK is offline) |

The import table of `docs/spec/12-engineering.md` "Modules" holds at `f822a77`, with one
over-claim: `src/ui/recipes.js` may import `store` but does not.

## Code rules

**ENG-1** [core] [verified] A state operation is a pure function `(state, …) → { state }`. It never changes its input.
- Evidence: `src/store.js:31` (`addItem`), each export of `src/store.js`, `src/recipes.js`, `src/shops.js`, `src/aisles.js`, `src/menu.js`; test: `tests/store.test.js` "addItem does not change the input state", "reorderItems does not change its input", "startNewShopping does not change the input state".
- Target: top-level Kotlin functions over immutable `data class` values (`val` fields, `List` not `MutableList`); the result is a `data class Result(val state: State, val error: Message? = null)`.

**ENG-2** [core] [verified] A rejected operation returns `{ state, error }` with the same state object. Nothing throws for a user error. `error` is a message `{ key, params }`; with no params the message is `{ key }` only.
- Evidence: `src/store.js:15` (`reject`); test: `tests/store.test.js` "operations reject an unknown id" (asserts `{ key: 'error.itemNotFound' }` and the same state object); `tests/shops.test.js` "removeItemShop returns the same state for a shop that the item does not have".
- Target: `data class Message(val key: String, val params: Map<String, Any> = emptyMap())` or a sealed `Error` type with one subclass for each key; the result keeps the same `State` instance (`===`). No exception for a user error.

**ENG-3** [core] [verified] An operation that changes nothing returns the same state object, where a caller needs to know that: `reorderItems`, `sendRecipe`, `addItemShop`, `removeItemShop`, and `bringToList` with `changed: false`.
- Evidence: `src/store.js:110-120`, `src/store.js:184-189`, `src/recipes.js:92`, `src/shops.js:31-45`; test: `tests/store.test.js` "reorderItems returns the same state for the same order", "bringToList changes nothing for an item that is in active and not bought"; `tests/recipes.test.js` "sendRecipe a second time changes nothing and returns the same state"; `tests/shops.test.js` "addItemShop returns the same state for a shop that the item has", "removeItemShop returns the same state for a shop that the item does not have".
- Note: the caller compares by reference. The port keeps reference identity (`===`) or returns an explicit `changed` flag; structural `==` of data classes is not enough to tell "no change" from "same values".

**ENG-4** [adapted] [untested] The screen applies an operation, saves, then builds the page again from the state. A rejected operation shows its message as a toast and saves nothing. A save that fails shows `error.notSaved`. An operation with an undo text shows a toast with `Deshacer`; any other success hides the toast.
- Evidence: `src/ui/context.js:199-226` (`render`, `commit`, `apply`).
- Target: a `ViewModel` holds `StateFlow<State>`; an intent calls the pure operation, writes the result through the repository, then emits the new state; Compose recomposes from the state. The UI holds no data of its own (unidirectional data flow).

**ENG-5** [adapted] [verified] A module with a side effect takes the object of that effect as a parameter (the storage object), so that a test passes a fake. A storage that throws never stops the app.
- Evidence: `src/storage.js:182` (`load(storage)`), `src/storage.js:195` (`save(storage, state)`), `src/ui/context.js:56`; test: `tests/storage.test.js` "load and save survive a storage that throws", "the language functions do not throw when the storage does".
- Target: a repository interface (`StateStore`, `PreferencesStore`) injected into the `ViewModel`; JVM tests pass an in-memory fake; an I/O error maps to a value, not a crash.

**ENG-6** [adapted] [verified] No module imports `src/app.js`. A view renders the screen through `render` of `src/ui/context.js`.
- Evidence: `src/ui/context.js` (`render`, `commit`); test: `tests/layers.test.js` "no module imports app".
- Target: no class depends on `MainActivity` or the app entry package; screens read state from the `ViewModel`. Checked by a Konsist or ArchUnit test.

**ENG-7** [dropped] [verified] A module of `src/` is imported by its alias (`from '#store'`), never by a relative path; Node resolves `#name` through `imports` of `package.json`, the browser through the import map of `index.html`, and the two agree.
- Evidence: `package.json:6-9`, `index.html:412-459`; test: `tests/aliases.test.js` "the import map of the page gives each module of src its alias", "Node resolves an alias to the same file as the page", "no module of src imports another one by a relative path", "each #ds/ alias of the page names a vendored module of the design system", "the import map comes before the module script of the page".
- Reason: an import map exists only for ES modules in a browser. Replacement: Kotlin packages and Gradle module dependencies; nothing to keep in agreement.

**ENG-8** [adapted] [verified] A new id comes from `crypto.randomUUID()`. An operation that creates a record takes the id function as a parameter, for the tests.
- Evidence: `src/store.js:31`, `src/recipes.js:21`; test: `tests/store.test.js` (a `newId` counter, line 32, passed to `addItem` in each test).
- Target: `java.util.UUID.randomUUID().toString()` as the default of a `newId: () -> String` parameter. The id stays a string, so an exported backup keeps its ids.

**ENG-16** [adapted] [verified] The screen code is `src/app.js` and the views of `src/ui/`. A view never imports `src/app.js`, a pure module never imports a view, and the imports among the views have no cycle. `src/ui/context.js` owns the shared values (`chosen`, `lang`, `t`, `hand`, `theme`, `shopLists`, `state`, `undoState`, `clickGuardUntil`) and `src/ui/drag.js` owns `reorder`; another module reads them and changes them only through a setter.
- Evidence: `src/ui/context.js:20-260`; test: `tests/layers.test.js` "the views exist", "no module imports app", "a pure module imports no view", "the imports among the views have no cycle", "only the owner assigns a shared value".
- Target: `:core` has no dependency on `:app` or Android (enforced by the Gradle graph); a Konsist/ArchUnit test checks that no `core` class imports `androidx.*` or a UI package and that UI packages have no cycle. The shared values are `private val _x = MutableStateFlow` in the `ViewModel`, exposed as `StateFlow`, changed only through its functions.

**ENG-17** [adapted] [untested] On the dev server (`localhost`, `127.0.0.1` or `[::1]`) the app writes a debug log: the state at the start, each change of section, each change of the state as a list of item changes (`+` added, `-` removed, `~` changed, and changes of `sent`, `group`, `sort`, `version`), each message and each `Deshacer`. Each line starts with `[shopping]` and a local time. `shoppingLog` holds all lines for `copy(shoppingLog.join('\n'))`. On any other host it writes nothing.
- Evidence: `src/ui/context.js:99-123`, `src/ui/context.js:179`, `src/ui/context.js:201-204`, `src/app.js:77`, `src/app.js:251`.
- Target: debug builds only (`BuildConfig.DEBUG`) log to Logcat with the tag `shopping`; release builds log nothing. The `copy(...)` console helper has no equivalent (Logcat export replaces it).

## Change guide

The guide of `docs/spec/12-engineering.md` maps to the target as follows. It holds no rule IDs.

| Web change | Target change |
|---|---|
| A new list, recipe, shop or aisle rule: an operation with its tests, then a control | The same: a pure function in `:core` with JVM tests, then a Compose control |
| A new view: a `src/ui/` module with `bind()`, its alias, its file in `SHELL`, its row in the table | A Compose screen and its `ViewModel` state; no alias, no `SHELL` |
| A change of the item shape: `normalizeItem`, a new `version`, a migration | The same in the JSON codec of `:data`; the backup format stays the web format |
| A new text: a key in each of the seven catalogs, with the same placeholders | A string in each `values-<lang>/strings.xml`, same placeholders |
| A new module of `src/`: alias in the import map, file in `SHELL` | dropped |
| A new file that the app loads: path in `SHELL` | dropped (resources are in the APK) |
| A stored state that an old module cannot read: a new cache name | dropped (an app update replaces all code at once) |
| A change of behaviour: the rule in the specification, same commit | The same (ENG-15) |

## Tests

`npm test` runs `node --test`. Each unit test uses `node:test` with `node:assert/strict`, one
behaviour for each test, and checks that the input state does not change. Target: JUnit 5 (or
`kotlin.test`) on the JVM for `:core` and `:data`; Compose UI tests and instrumented tests for the
screens. The per-file port kinds are in `tests.md`.

## Checks with no test

**ENG-9** [adapted] [untested] `src/app.js`, the views of `src/ui/`, `styles.css` and `sw.js` have no unit test. A change to one of them is checked in a browser at a phone viewport with `npm run serve`; the offline check runs with the server stopped.
- Evidence: no test imports `#app` or `#ui/*` (`tests/`); `tests/design.test.js` reads the source text only.
- Target: Compose UI tests (instrumented or Robolectric) for the screens, and a manual check on a phone or emulator. No offline check: the app has no network dependency.

**ENG-10** [adapted] [untested] `.githooks/pre-push` and `.githooks/pre-commit` have no test. They are checked in a scratch clone, `pre-push` with a bare remote.
- Evidence: `.githooks/pre-commit`, `.githooks/pre-push`.
- Target: the same hooks in the Android repository, with the app paths of ENG-13 changed.

**ENG-11** [adapted] [untested] A task is done when `npm test` passes and, for a change of the screen or of `sw.js`, the browser check ran.
- Evidence: process rule; no code.
- Target: `./gradlew test` (and the lint and dependency checks) pass and, for a screen change, the device or emulator check ran.

## Upkeep of this specification

**ENG-12** [adapted] [verified] `tests/spec.test.js` compares the specification with the code: each rule ID is defined one time and each named rule exists; each link has its file and the index lists each document; the state version, the groups and the orders; the storage keys and the cache name; the languages and the fallback `en`; each `error.*` and `toast.*` key that a document names is in the Spanish catalog; the module table against `src/` and the imports of each module; the test table against `tests/`; the manifest `id` and `orientation`.
- Evidence: `tests/spec.test.js:1-140`; test: `tests/spec.test.js` (all 17 tests).
- Target: a JVM test that reads the spec Markdown and checks the same facts against Kotlin constants: rule IDs, state version, `GROUPS`, `SORTS`, storage keys, languages, message keys in the Spanish strings. The cache-name, import-table and manifest checks are dropped; a module-dependency check (ENG-16) replaces the import table.

**ENG-13** [adapted] [untested] `.githooks/pre-commit`, enabled with `npm run hooks`, stops a commit that stages a change of the app with no staged change of `docs/spec/`. The app is `src/`, `sw.js`, `index.html` and `manifest.webmanifest`; of `src/locales/`, only `es.js` counts. The hook prints the app files and exits 1.
- Evidence: `.githooks/pre-commit:8-23`.
- Target: the same hook with the Android app paths (the Kotlin sources, `AndroidManifest.xml`, the Spanish `strings.xml` only).

**ENG-14** [adapted] [untested] A commit that changes no rule, such as a refactor, passes with `git commit --no-verify`, and its body says that no rule changed.
- Evidence: `.githooks/pre-commit:5`.
- Target: unchanged (git process).

**ENG-15** [adapted] [untested] A change of behaviour changes its rule in the same commit as the code. This is part of the definition of done.
- Evidence: process rule; `.githooks/pre-commit` enforces part of it.
- Target: unchanged (git process).

## Commands

| Web | Target |
|---|---|
| `npm test` | `./gradlew test` |
| `npm run serve` | install a debug build (`./gradlew installDebug`) |
| `npm run icons` | dropped: adaptive icon resources are kept in `res/` (see `15-design-system`) |
| `npm run hooks` | `git config core.hooksPath .githooks` (unchanged) |
| `npm run release` | a release Gradle task that bumps `versionName`/`versionCode` and tags `vX.Y.Z` |
| `npm run ds` | dropped: the theme tokens are Kotlin values (see `15-design-system`) |
