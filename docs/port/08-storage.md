# Storage and backup

Load, save, validation, migration and failures of the stored state; the preferences of the
device; the backup file and the reset. Source modules: `src/storage.js`, its use in
`src/ui/context.js`, `src/app.js` and `src/ui/settings.js`. Shapes and samples are in
[data-contract.md](data-contract.md).

## Keys

| Store | Key | Content | Port target |
|---|---|---|---|
| `localStorage` | `shopping.v1` | The state, as JSON | State store (data-contract section 8) |
| `localStorage` | `shopping.v1.corrupt` | The last stored text that was not a valid state | Raw-text copy, or dropped (Q-data-6) |
| `localStorage` | `shopping.lang` | The language that the user chose ([09-languages.md](09-languages.md)) | Preference |
| `localStorage` | `shopping.hand` | `left` when the user chose **Izquierda** ([07-screen.md](07-screen.md), NAV-12) | Preference |
| `localStorage` | `shopping.theme` | `light` or `dark` when the user chose **Claro** or **Oscuro** ([07-screen.md](07-screen.md), NAV-17) | Preference |
| `localStorage` | `shopping.density` | `compact` when the user chose **Compacta** ([07-screen.md](07-screen.md), NAV-21) | Preference |
| `localStorage` | `shopping.tripEnd` | `save` when the user chose **Descartar** ([03-lists.md](03-lists.md), TRIP-8) | Preference |
| `localStorage` | `shopping.shopLists` | `hide` when the user hid the row of shop lists ([05-shops.md](05-shops.md), SHOP-25) | Preference |
| `localStorage` | `shopping.swipeHint` | `1` after `Compra` showed the slide of a row one time ([07-screen.md](07-screen.md), ROW-14) | Flag |
| `localStorage` | `shopping.onboarded` | `1` after the walkthrough of the first start closed ([07-screen.md](07-screen.md), ONB-7) | Flag |
| Cache API | `shopping-shell-v19` | The app shell ([10-offline-version.md](10-offline-version.md)) | Dropped |
| Cache API | `shopping-manifest` | The name, the description and the shortcut names of the manifest in the language of the screen (SW-13) | Dropped |

The `v1` of the key is the version of the key, not of the state. The state has its own `version`.

**STORE-12** [adapted] [new] The default value of a preference is never stored. A save of the default removes its key; a read of a missing or unknown value gives the default.
- Evidence: `src/storage.js:225-363`; tests: `tests/storage.test.js` "saveHand stores left and right removes the key", "saveTheme removes the key for an unknown theme", "saveDensity removes the key for an unknown density", "saveTripEnd stores save and keep removes the key", "saveShopLists stores hide and show removes the key", "loadLanguage returns null for no value and for an unsupported value".
- Target: Preferences DataStore (or another store, Q-data-2). Defaults: language `null` (follow the phone), hand `right`, theme `system`, density `normal`, trip end `keep`, shop lists `show`.

**STORE-13** [adapted] [new] The stored language is used only when it is one of the supported codes (`ca`, `de`, `en`, `es`, `fr`, `it`, `pt`). An empty or unknown value means "follow the phone".
- Evidence: `src/storage.js:225-232`, `src/ui/context.js:67`; tests: `tests/storage.test.js` "loadLanguage returns the stored language when it is supported", "loadLanguage returns null for no value and for an unsupported value".
- Note: LANG-4 of `docs/spec/09-languages.md` already states the ignore of an unknown value; this rule adds the storage side.
- Target: a preference, or the per-app language of Android 13+ (Q-data-2).

**STORE-14** [adapted] [new] The walkthrough flag and the swipe-hint flag count as set only when their stored value is exactly `1`.
- Evidence: `src/storage.js:372,404`; tests: `tests/storage.test.js` "loadOnboarded is false for no value and for another value", "loadSwipeHint is false for another value".
- Target: boolean preferences.

**STORE-15** [adapted] [new] The install counts as new only when the walkthrough flag is not set and no state is stored. A stored text that is not a valid state counts as a stored state.
- Evidence: `src/storage.js:388-394`, `src/onboarding.js:5`, `src/ui/context.js:95`; tests: `tests/storage.test.js` "hasStoredState is true for a stored text that is not a valid state", "hasStoredState is false for no stored state and for a storage that throws", `tests/onboarding.test.js` "shouldShow is true for no flag and no stored state", "shouldShow is false for a stored state".
- Target: the same check on the state store and the flag preference.

## Load and save

**STORE-1** [adapted] [untested] The app reads the state one time, at the start, before the first render. With no stored state it starts with the empty state.
- Evidence: `src/ui/context.js:97`, `src/storage.js:182-193`; test: `tests/storage.test.js` "load returns an empty state when the key is absent" (the load); the order before the render is untested.
- Target: read the state store before the first composition (splash or a loading state while the first read completes).

**STORE-2** [adapted] [untested] Each change writes the full state at once, in the same task as the change.
- Evidence: `src/ui/context.js:202-211` (`commit`), `src/storage.js:195-202`; test: untested (UI).
- Target: each change writes the full state document; the write is asynchronous on Android (Q-data-5).

**STORE-3** [core] [untested] The state on the screen is always the state in memory. A render builds the lists from it; the screen holds no data of its own.
- Evidence: `src/ui/context.js:202-211`; test: untested (UI).

**STORE-4** [dropped] [untested] The app asks the browser for persistent storage at each start (`navigator.storage.persist()`), and ignores the answer.
- Evidence: `src/app.js:307`; test: untested.
- Reason: browser eviction of site data. Replacement: nothing; app-private storage is not evicted.

**STORE-16** [core] [new] The stored state is compact JSON of the in-memory state, with no indent and no wrapper. A save then a load gives the same state.
- Evidence: `src/storage.js:195-202`; tests: `tests/storage.test.js` "save then load returns the same state", "save writes a version 9 state with no again field".

## Validation

**STORE-5** [core] [verified] A stored state is used only when it is valid. If not, the app copies the stored text to `shopping.v1.corrupt` and starts with the empty state. The invalid text stays in `shopping.v1` until the first change replaces it.
- Evidence: `src/storage.js:182-193`; tests: `tests/storage.test.js` "load keeps corrupt JSON under the corrupt key and returns an empty state", "load treats valid JSON with an invalid shape as corrupt".
- Note: a second invalid load overwrites the corrupt copy. Nothing reads the copy.

**STORE-6** [core] [verified] A state is not valid when one of these is true:
  - it is not an object, its `version` is not a number from 1 to 9, or `items` is not a list;
  - `recipes` is not a list, in version 2 to 9;
  - an item is not an object, has no non-empty string `id`, no name, a `list` that is not `active`, `saved` or the old `next` (STORE-8), a flag (`recurrent`, `bought`) that is not a boolean, or an `again` that is present and not a boolean;
  - a recipe is not an object, has no non-empty string `id`, no name, a `products` that is not a list, an empty product, a product that is not text, or two products with the same name;
  - two items or two recipes have the same id or the same name (DATA-2 to DATA-4).
- Evidence: `src/storage.js:33-44,93-105,143-156`; tests: `tests/storage.test.js` "importJson rejects an unknown version", "importJson rejects invalid items", "importJson rejects invalid recipes", "importJson accepts an item with no again field and rejects again that is not a boolean".

**STORE-7** [core] [verified] A valid state is cleaned when it is read. These defects are repaired with no error:

  | Field | Repair |
  |---|---|
  | Names of items, recipes, products, shops | Trimmed |
  | `bought` of an item of `list: 'saved'` | `false` |
  | `quantity` | Not text: `''`. Text: trimmed |
  | `shops` | Not a list: empty. An entry that is not text, is empty or is a duplicate: dropped |
  | `aisles` | Not a list: empty. An entry that is not text, is empty or is a duplicate with no case distinction: dropped. The rest trimmed |
  | `aisle` of an item | Not text, or not an aisle of `aisles`: `''`. An aisle: the spelling of `aisles` |
  | Shop spellings | Each shop gets the spelling of its first use |
  | `url` of a recipe | Not a valid link (REC-14): `''` |
  | `sent` | Not a list: empty. An id that is not text, is unknown or is a duplicate: dropped |
  | `menu` | Not a list: empty. A meal with an unknown day, meal or recipe, a dish that is not text, is empty, is longer than 80 characters or comes with a recipe, or a second record of one meal: dropped. A dish trimmed. The rest in day and meal order |
  | `group` | Unknown: from `grouped` (STORE-8) |
  | `sort` | Unknown: `custom` |
  | Unknown fields | Dropped |

- Evidence: `src/storage.js:19-172`; tests: `tests/storage.test.js` "importJson repairs the shops of an item", "importJson gives each shop the spelling of its first use", "importJson trims recipe names and products and drops unknown fields", "importJson keeps in sent only the ids of recipes, one time each", "importJson keeps a web link of a recipe and drops any other value", "importJson keeps the name sort and turns any other value into custom", "importJson keeps the valid meals of the menu in day and meal order and drops the others", "importJson keeps a dish of the menu and drops a bad one", "importJson trims a quantity and reads a quantity that is not text as none", "importJson trims the aisles and drops an entry that is not text, is empty or is a duplicate", "importJson gives an item the spelling of its aisle and clears an aisle that is not in the aisles", "a saved item survives a save and a load, never ticked", "importJson drops unknown fields, moves Next to Actual and drops again".

**STORE-8** [core] [verified] An older state is migrated when it is read, and saved as version 9 at the next change:

  | From | Change |
  |---|---|
  | Version 1 | `recipes: []` (a `recipes` field is ignored), `sent: []` |
  | Version 1 or 2 | `group` is `none` when `grouped` is `false`, and `recipe` if not. Each item gets `shops: []`. `sort` is `custom` when absent |
  | Version 1, 2 or 3 | `menu: []` |
  | Version 1 to 4 | Each item gets `quantity: ''` |
  | Version 1 to 5 | No change of the data: version 6 adds `list: 'saved'` |
  | Version 1 to 6 | `aisles: []`, and each item gets `aisle: ''` |
  | Version 1 to 7 | An item of `list: 'next'` goes to `Compra`, not ticked. A ticked one-time item with `again: true` goes to `Compra`, not ticked. A ticked recurrent item keeps its tick. Each item loses `again` |
  | Version 1 to 8 | No change of the data: version 9 adds the dish of a meal |

- Evidence: `src/storage.js:10-13,45,87-91,140-172`; tests: `tests/storage.test.js` "load migrates a version 1 state", "load migrates a version 2 state", "importJson reads the grouping of a version 2 backup", "load migrates a version 3 state with an empty menu", "load migrates a version 4 state with no quantity on each item", "load migrates a version 5 state with no change of its items", "load migrates a version 6 state with no aisles", "load migrates a version 7 state with an item of Next and a ticked item with again", "a ticked recurrent item with again keeps its tick when a version 7 state loads", "load reads a version 8 state and keeps its menu".

**STORE-17** [core] [new] The repairs of STORE-7 and STORE-8 apply to each version, not only to old ones. A version 9 document with `list: 'next'`, `again` or `grouped` is read with the same rules. The only rule tied to a version: version 1 ignores `recipes`.
- Evidence: `src/storage.js:41-45,88-91,146`; test: `tests/storage.test.js` "a known group wins over the old grouped field" (a version 9 document with `grouped`); the `next` and `again` cases at version 9 are untested (Q-data-4).

## Failures

**STORE-9** [adapted] [untested] When a write fails, the change stays in memory and on the screen, and a message says that it was not saved (MSG-8): `error.notSaved`, `El cambio no se ha guardado: el almacenamiento no está disponible.`
- Evidence: `src/ui/context.js:208,219-221`; test: `tests/storage.test.js` "load and save survive a storage that throws" (the `false` result); the message is untested.
- Target: catch the I/O error of the state write and show the same message (Q-data-5).

**STORE-10** [adapted] [untested] When `localStorage` is not available, the app works in memory and says so at the start: `El almacenamiento no está disponible: los cambios no se guardan.` (`error.noStorage`). A choice of language, of hand, of theme, of density or of **Al terminar la compra** then lasts until the app closes, and the walkthrough shows only from `Ajustes` (ONB-8).
- Evidence: `src/ui/context.js:56-62,67-85,95`, `src/app.js:306`; test: untested (UI).
- Target: app-private storage is always present; the message has no trigger except a read error (Q-data-7).

**STORE-18** [core] [new] A storage that throws never stops the app. The load gives the empty state, a save gives `false`, and each preference gives its default, except the walkthrough flag, which counts as seen.
- Evidence: `src/storage.js:182-417` (each function in `try`/`catch`); tests: `tests/storage.test.js` "load and save survive a storage that throws", "the language functions do not throw when the storage does", "the hand functions do not throw when the storage does", "the theme functions do not throw when the storage does", "the density functions do not throw when the storage does", "the trip end functions do not throw when the storage does", "loadOnboarded is true for a storage that throws", "loadSwipeHint is false and saveSwipeHint fails for a storage that throws".

**STORE-11** [dropped] [untested] The app does not read a change that another tab makes. The last tab that writes wins.
- Evidence: no `storage` event listener in `src/`; test: untested.
- Reason: browser tabs. Replacement: nothing; one activity holds the state.

## Backup

**BACKUP-1** [adapted] [verified] **Exportar** (`settings.export`) saves the file `compra-YYYY-MM-DD-HHMMSS.json`, with the local date and time. Two exports of one day get two names. Its content is the state, as JSON with an indent of 2 spaces, MIME type `application/json`.
- Evidence: `src/storage.js:204-212`, `src/ui/settings.js:153-162`; tests: `tests/storage.test.js` "exportFilename names the file with the local date and time", "exportFilename gives two exports of one day different names".
- Target: Storage Access Framework `ACTION_CREATE_DOCUMENT` with the same suggested name and MIME, or a share intent (Q-data-8).

**BACKUP-2** [core] [verified] The backup holds the items with their shops, quantity and aisle, the recipes, `sent`, `group`, `sort`, the menu and the aisles. It does not hold the language, the hand, the theme, the density, **Al terminar la compra**, the row of shop lists, the flag of the walkthrough or the swipe hint.
- Evidence: `src/storage.js:204`, `src/ui/settings.js:161`; tests: `tests/storage.test.js` "exportJson then importJson returns the same state", "the flag of the walkthrough is not part of the stored state".

**BACKUP-3** [adapted] [verified] **Importar** (`settings.import`) opens a file choice for a JSON file (`application/json`, `.json`). A file that is not JSON gives `error.invalidJson`. A JSON that is not a valid state (STORE-6) gives `error.notBackup`. An error changes nothing.
- Evidence: `index.html:410`, `src/storage.js:214-219`, `src/ui/settings.js:210-218`; tests: `tests/storage.test.js` "importJson rejects text that is not JSON", "importJson rejects an unknown version", "importJson rejects invalid items", "importJson rejects invalid recipes".
- Target: `ACTION_OPEN_DOCUMENT` with MIME `application/json` (Q-data-8: some file managers give `.json` another MIME).

**BACKUP-4** [core] [verified] A valid file is cleaned and migrated as a stored state is (STORE-7, STORE-8). A backup of version 1 to 8 is thus accepted.
- Evidence: `src/storage.js:214-219`; tests: `tests/storage.test.js` "importJson migrates a version 1 backup", "importJson migrates a version 3 backup with an empty menu".

**BACKUP-5** [adapted] [untested] Before the import the app asks: `¿Sustituir los datos actuales por los de la copia (N artículos y N recetas)?` (`import.confirm`), with the counts of the cleaned file. A yes replaces the full state. It does not merge. A no changes nothing.
- Evidence: `src/ui/settings.js:219-224`; test: untested (UI).
- Target: a confirmation dialog with the plural texts `count.items` and `count.recipes`.

**BACKUP-6** [adapted] [untested] The import has `Deshacer`, with the message `Copia importada.` (`toast.imported`), for 5000 ms.
- Evidence: `src/ui/settings.js:224`, `src/ui/context.js:26,214-225`; test: untested (UI).
- Target: a Snackbar with the action `Deshacer`.

**BACKUP-7** [adapted] [verified] **Borrar todos los datos** asks `¿Borrar todos los datos? Se borran las listas, las recetas, el menú, las secciones y las preferencias. Exporta una copia antes si quieres conservarlos.` (`reset.confirm`). A yes removes each `localStorage` key of the table above and loads the app again, which then starts as a new install, with the walkthrough (ONB-7). Keys of other apps stay. It has no `Deshacer`. When the removal fails, the message `error.resetFailed` says `No se pudieron borrar los datos.` and nothing else changes. The caches stay. With no storage, the reload alone clears the data in memory.
- Evidence: `src/storage.js:421-442`, `src/ui/settings.js:170-179`; tests: `tests/storage.test.js` "resetAll removes every key of the app and keeps the keys of other apps", "APP_KEYS holds the state, its corrupt copy and each preference of the device", "after resetAll the install counts as new", "resetAll fails for a storage that throws".
- Target: clear the state store, the preferences and the corrupt copy, then recreate the activity.

**BACKUP-8** [core] [new] An export, then an import of that file, gives the same state.
- Evidence: `src/storage.js:204,214-219`; test: `tests/storage.test.js` "exportJson then importJson returns the same state".

## Loss of data

**Clear site data** in Chrome and the uninstall of the app delete the lists. An export before
that is the only protection. On Android, "Clear storage" and the uninstall do the same; Auto
Backup can change this (Q-data-9).

## Limits

No automatic backup. No merge of two states. No sync between tabs or devices. The state is in
`localStorage`; a move to IndexedDB is an open item (web only).
