# Storage and backup

Rules of `src/storage.js`, and of its use in `src/ui/context.js` and `src/ui/settings.js`.

## Keys

| Store | Key | Content |
|---|---|---|
| `localStorage` | `shopping.v1` | The state, as JSON |
| `localStorage` | `shopping.v1.corrupt` | The last stored text that was not a valid state |
| `localStorage` | `shopping.lang` | The language that the user chose ([09-languages.md](09-languages.md)) |
| `localStorage` | `shopping.hand` | `left` when the user chose **Izquierda** ([07-screen.md](07-screen.md), NAV-12) |
| `localStorage` | `shopping.theme` | `light` or `dark` when the user chose **Claro** or **Oscuro** ([07-screen.md](07-screen.md), NAV-17) |
| `localStorage` | `shopping.density` | `compact` when the user chose **Compacta** ([07-screen.md](07-screen.md), NAV-21) |
| `localStorage` | `shopping.tripEnd` | `save` when the user chose **Descartar** ([03-lists.md](03-lists.md), TRIP-8) |
| `localStorage` | `shopping.shopLists` | `hide` when the user hid the row of shop lists ([05-shops.md](05-shops.md), SHOP-25) |
| `localStorage` | `shopping.swipeHint` | `1` after `Compra` showed the slide of a row one time ([07-screen.md](07-screen.md), ROW-14) |
| `localStorage` | `shopping.onboarded` | `1` after the walkthrough of the first start closed ([07-screen.md](07-screen.md), ONB-7) |
| `localStorage` | `shopping.session` | The token and the user of the account ([18-account-sync.md](18-account-sync.md), ACC-6) |
| `localStorage` | `shopping.sync` | The last cursor and the last known server state (SYNC-2, SYNC-4) |
| `localStorage` | `shopping.queue` | The changes not sent to the server (SYNC-2) |
| `localStorage` | `shopping.v1.beforeLogin` | The local state that a first login replaced (SYNC-8) |
| Cache API | `shopping-shell-v20` | The app shell ([10-offline-version.md](10-offline-version.md)) |
| Cache API | `shopping-manifest` | The name, the description and the shortcut names of the manifest in the language of the screen (SW-13) |

The `v1` of the key is the version of the key, not of the state. The state has its own `version`.

## Load and save

- **STORE-1** The app reads the state one time, at the start, before the first render. With no
  stored state it starts with the empty state.
- **STORE-2** Each change writes the full state at once, in the same task as the change.
- **STORE-3** The state on the screen is always the state in memory. A render builds the lists
  from it; the page holds no data of its own.
- **STORE-4** The app asks the browser for persistent storage at each start
  (`navigator.storage.persist()`), and ignores the answer.

## Validation

- **STORE-5** A stored state is used only when it is valid. If not, the app copies the stored text
  to `shopping.v1.corrupt` and starts with the empty state. The first change then replaces
  `shopping.v1`.
- **STORE-6** A state is not valid when one of these is true:
  - it is not an object, its `version` is not 1 to 9, or `items` is not a list;
  - `recipes` is not a list, in version 2 to 9;
  - an item has no string `id`, no name, a `list` that is not `active`, `saved` or the
    old `next` (STORE-8), a flag (`recurrent`, `bought`) that is not a boolean, or an `again` that
    is present and not a boolean;
  - a recipe has no string `id`, no name, an empty product, a product that is not text, or two
    products with the same name;
  - two items or two recipes have the same id or the same name (DATA-2 to DATA-4).
- **STORE-7** A valid state is cleaned when it is read. These defects are repaired with no error:

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
  | `sent` | An id that is not text, is unknown or is a duplicate: dropped |
  | `menu` | Not a list: empty. A meal with an unknown day, meal or recipe, a dish that is not text, is empty, is longer than 80 characters or comes with a recipe, or a second record of one meal: dropped. A dish trimmed. The rest in day and meal order |
  | `group` | Unknown: from `grouped` (STORE-8) |
  | `sort` | Unknown: `custom` |
  | Unknown fields | Dropped |

- **STORE-8** An older state is migrated when it is read, and saved as version 9 at the next
  change:

  | From | Change |
  |---|---|
  | Version 1 | `recipes: []`, `sent: []` |
  | Version 1 or 2 | `group` is `none` when `grouped` is `false`, and `recipe` if not. Each item gets `shops: []`. `sort` is `custom` when absent |
  | Version 1, 2 or 3 | `menu: []` |
  | Version 1 to 4 | Each item gets `quantity: ''` |
  | Version 1 to 5 | No change of the data: version 6 adds `list: 'saved'` |
  | Version 1 to 6 | `aisles: []`, and each item gets `aisle: ''` |
  | Version 1 to 7 | An item of `list: 'next'` goes to `Compra`, not ticked. A ticked one-time item with `again: true` goes to `Compra`, not ticked. Each item loses `again` |
  | Version 1 to 8 | No change of the data: version 9 adds the dish of a meal |

## Failures

- **STORE-9** When a write fails, the change stays in memory and on the screen, and a message says
  that it was not saved (MSG-8).
- **STORE-10** When `localStorage` is not available, the app works in memory and says so at the
  start: `El almacenamiento no está disponible: los cambios no se guardan.` A choice of language,
  of hand, of theme, of density or of **Al terminar la compra** then lasts until the app closes, and the walkthrough shows only from `Ajustes`
  (ONB-8).
- **STORE-11** The app does not read a change that another tab makes. The last tab that writes
  wins.

## Backup

- **BACKUP-1** **Exportar** downloads the file `compra-YYYY-MM-DD-HHMMSS.json`, with the
  local date and time. Two exports of one day get two names.
  Its content is the state, as JSON with an indent of 2 spaces.
- **BACKUP-2** The backup holds the items with their shops, the recipes, `sent`, `group`,
  `sort` and the menu. It does not hold the language, the hand, the theme, the density, **Al terminar la compra** or the flag of the
  walkthrough.
- **BACKUP-3** **Importar** opens a file choice for a JSON file. A file that is not JSON
  gives `error.invalidJson`. A JSON that is not a valid state (STORE-6) gives `error.notBackup`.
- **BACKUP-4** A valid file is cleaned and migrated as a stored state is (STORE-7, STORE-8). A
  backup of version 1, 2 or 3 is thus accepted.
- **BACKUP-5** Before the import the app asks: `¿Sustituir los datos actuales por los de la copia
  (N artículos y N recetas)?` A yes replaces the full state. It does not merge. With a session the
  question is `import.confirmAccount`: `¿Sustituir los datos de tu cuenta por los de la copia (N
  artículos y N recetas)? Se sustituyen en todos tus dispositivos.` A yes then replaces the data of
  the account on every device (SYNC-9, [18-account-sync.md](18-account-sync.md)).
- **BACKUP-6** The import has `Deshacer`, with the message `Copia importada.`
- **BACKUP-7** **Borrar todos los datos** asks `¿Borrar todos los datos? Se borran las listas,
  las recetas, el menú, las secciones y las preferencias. Exporta una copia antes si quieres
  conservarlos.` A yes removes each `localStorage` key of the table above and loads the app again,
  which then starts as a new install, with the walkthrough (ONB-7). It has no `Deshacer`. When the
  removal fails, the message `error.resetFailed` says `No se pudieron borrar los datos.` and nothing
  else changes. The caches stay. With a session the question is `reset.confirmLocal`: `¿Borrar los datos de
  este dispositivo? Se borran las listas, las recetas, el menú, las secciones y las preferencias, y
  se cierra la sesión. Los datos de tu cuenta se conservan en el servidor.` A yes also logs out
  (SYNC-10, [18-account-sync.md](18-account-sync.md)).

## Loss of data

**Clear site data** in Chrome and the uninstall of the app delete the lists. An export before
that is the only protection.

## Limits

No automatic backup. No merge of two states. No sync between tabs. The sync between devices is in
[18-account-sync.md](18-account-sync.md). The state is in
`localStorage`; a move to IndexedDB is an open item.
