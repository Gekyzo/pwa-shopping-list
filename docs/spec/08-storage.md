# Storage and backup

Rules of `src/storage.js`, and of its use in `src/app.js`.

## Keys

| Store | Key | Content |
|---|---|---|
| `localStorage` | `shopping.v1` | The state, as JSON |
| `localStorage` | `shopping.v1.corrupt` | The last stored text that was not a valid state |
| `localStorage` | `shopping.lang` | The language that the user chose ([09-languages.md](09-languages.md)) |
| Cache API | `shopping-shell-v7` | The app shell ([10-offline-version.md](10-offline-version.md)) |

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
  - it is not an object, its `version` is not 1, 2 or 3, or `items` is not a list;
  - `recipes` is not a list, in version 2 or 3;
  - an item has no string `id`, no name, a `list` that is not `active` or `next`, or a flag
    (`recurrent`, `bought`, `again`) that is not a boolean;
  - a recipe has no string `id`, no name, an empty product, a product that is not text, or two
    products with the same name;
  - two items or two recipes have the same id or the same name (DATA-2 to DATA-4).
- **STORE-7** A valid state is cleaned when it is read. These defects are repaired with no error:

  | Field | Repair |
  |---|---|
  | Names of items, recipes, products, shops | Trimmed |
  | `bought` of an item of `list: 'next'` | `false` |
  | `again` of an item not ticked, or recurrent | `false` |
  | `shops` | Not a list: empty. An entry that is not text, is empty or is a duplicate: dropped |
  | Shop spellings | Each shop gets the spelling of its first use |
  | `url` of a recipe | Not an `http` or `https` address: `''` |
  | `sent` | An id that is not text, is unknown or is a duplicate: dropped |
  | `group` | Unknown: from `grouped` (STORE-8) |
  | `sort` | Unknown: `custom` |
  | Unknown fields | Dropped |

- **STORE-8** An older state is migrated when it is read, and saved as version 3 at the next
  change:

  | From | Change |
  |---|---|
  | Version 1 | `recipes: []`, `sent: []` |
  | Version 1 or 2 | `group` is `none` when `grouped` is `false`, and `recipe` if not. Each item gets `shops: []`. `sort` is `custom` when absent |

## Failures

- **STORE-9** When a write fails, the change stays in memory and on the screen, and a message says
  that it was not saved (MSG-8).
- **STORE-10** When `localStorage` is not available, the app works in memory and says so at the
  start: `El almacenamiento no está disponible: los cambios no se guardan.` A choice of language
  then lasts until the app closes.
- **STORE-11** The app does not read a change that another tab makes. The last tab that writes
  wins.

## Backup

- **BACKUP-1** **Exportar copia** downloads the file `compra-YYYY-MM-DD.json`, with the UTC date.
  Its content is the state, as JSON with an indent of 2 spaces.
- **BACKUP-2** The backup holds the items with their shops, the recipes, `sent`, `group` and
  `sort`. It does not hold the language.
- **BACKUP-3** **Importar copia** opens a file choice for a JSON file. A file that is not JSON
  gives `error.invalidJson`. A JSON that is not a valid state (STORE-6) gives `error.notBackup`.
- **BACKUP-4** A valid file is cleaned and migrated as a stored state is (STORE-7, STORE-8). A
  backup of version 1 or 2 is thus accepted.
- **BACKUP-5** Before the import the app asks: `¿Sustituir los datos actuales por los de la copia
  (N artículos y N recetas)?` A yes replaces the full state. It does not merge.
- **BACKUP-6** The import has `Deshacer`, with the message `Copia importada.`

## Loss of data

**Clear site data** in Chrome and the uninstall of the app delete the lists. An export before
that is the only protection.

## Limits

No automatic backup. No merge of two states. No sync between tabs or devices. The state is in
`localStorage`; a move to IndexedDB is an open item.
