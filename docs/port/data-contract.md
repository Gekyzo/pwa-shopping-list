# Data contract

The exact data that the web app stores and exchanges: the state under `shopping.v1`, its
normalisation and migration, the backup file, and every other storage key. Source modules:
`src/storage.js`, `src/store.js`, `src/ui/settings.js`, `src/ui/context.js`. Tests:
`tests/storage.test.js`, `tests/store.test.js`. A port that reads and writes this contract can
import a file exported by the web app, and the web app can import a file that the port exports.

Rules with IDs are in [02-data-model.md](02-data-model.md) and [08-storage.md](08-storage.md).
This document is the reference for the shapes and values.

## 1. Current schema version

- The current version is **9** (`src/store.js:11`, `src/storage.js:140,163`).
- The reader accepts the versions `1, 2, 3, 4, 5, 6, 7, 8, 9`, as the JSON number (`src/storage.js:140,144`).
  A string `"9"`, `10` or a missing `version` makes the document invalid
  (test `tests/storage.test.js` "importJson rejects an unknown version").
- The reader always returns a version 9 state. The writer always writes version 9.
- The `v1` of the key `shopping.v1` is the version of the key, not of the state.

## 2. Persisted state, key `shopping.v1`

The value is the state as JSON text, written with `JSON.stringify(state)`: no indent, no
wrapper (`src/storage.js:195-202`). The key is absent until the first change of the state
(`src/storage.js:185`, `src/ui/context.js:208`).

### State (root object)

The writer gives the keys in this order (`src/storage.js:162-171`, `src/store.js:11`). The
order is not significant to the reader.

| Field | Type | Default (empty state) | Allowed values | Notes |
|---|---|---|---|---|
| `version` | number | `9` | `9` on write; `1`–`9` on read | Integer |
| `items` | array of Item | `[]` | — | Order is significant: the custom order of the list (`src/store.js:1`) |
| `recipes` | array of Recipe | `[]` | — | Insertion order; significant |
| `sent` | array of string | `[]` | ids of `recipes` | The recipes sent to `Compra` in this trip, in send order; each id one time |
| `group` | string | `"recipe"` | `"recipe"`, `"shop"`, `"aisle"`, `"none"` | `src/store.js:6` |
| `sort` | string | `"custom"` | `"custom"`, `"name"` | `src/store.js:2` |
| `menu` | array of Meal | `[]` | — | In day order, then meal order (`lunch` before `dinner`) |
| `aisles` | array of string | `[]` | — | The sections of the store, in the order of the walk; significant |

The empty state (`src/store.js:11`; test `tests/storage.test.js` "emptyState is a version 9
state with no items, no recipes, no menu and the recipe grouping"):

```json
{"version":9,"items":[],"recipes":[],"sent":[],"group":"recipe","sort":"custom","menu":[],"aisles":[]}
```

### Item

| Field | Type | Default of a new item | Allowed values | Invariants |
|---|---|---|---|---|
| `id` | string | `crypto.randomUUID()` (`src/store.js:31`) | non-empty string | Unique in `items` (case-sensitive) |
| `name` | string | the trimmed input | non-empty after trim | Unique in `items` with `toLowerCase()`; accents count |
| `recurrent` | boolean | `false` | `true`, `false` | — |
| `list` | string | `"active"` | `"active"`, `"saved"` | `"next"` only on read of versions 1–7 |
| `bought` | boolean | `false` | `true`, `false` | `true` only when `list` is `"active"` |
| `shops` | array of string | `[]` | trimmed, non-empty | Unique in the item with `toLowerCase()`; one spelling per shop in the state |
| `quantity` | string | `""` | free text, trimmed | `""` means no quantity |
| `aisle` | string | `""` | `""` or a name of `aisles` | In the spelling of `aisles` |

Writer key order: `id, name, recurrent, list, bought, shops, quantity, aisle`
(`src/storage.js:46-55`, `src/store.js:35`).

A new item (`src/store.js:35`; test `tests/store.test.js` "addItem adds a one-time item to active"):

```json
{"id":"<uuid>","name":"Bread","recurrent":false,"list":"active","bought":false,"shops":[],"quantity":"","aisle":""}
```

### Recipe

| Field | Type | Allowed values | Invariants |
|---|---|---|---|
| `id` | string | non-empty | Unique in `recipes`. The sample recipe of the walkthrough has the fixed id `"sample-pasta"` (`src/recipes.js:196`) |
| `name` | string | non-empty after trim | Unique in `recipes` with `toLowerCase()`. A recipe may have the name of an item |
| `products` | array of string | each non-empty after trim | Unique in the recipe with `toLowerCase()`. May be empty |
| `url` | string | `""` or a web address (see below) | — |

Writer key order: `id, name, products, url` (`src/storage.js:108`).

A web address (`isWebUrl`, `src/recipes.js:47-60`): no whitespace in the text; the text parses
as a URL; the scheme is `http:` or `https:`; the host name matches
`^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+(?:[a-z]{2,}|xn--[a-z\d-]+)$` with no case distinction
(at least one dot, a letter top-level domain). So `localhost`, an IP address, `ftp:` and
`javascript:` are not web addresses.

### Meal (entry of `menu`)

| Field | Type | Allowed values |
|---|---|---|
| `day` | number | integer `0`–`6` (`0` is Monday; `DAYS = 7`, `src/menu.js:5`) |
| `meal` | string | `"lunch"`, `"dinner"` (`src/menu.js:6`) |
| `recipe` | string | the id of a recipe of the state. Absent when `dish` is present |
| `dish` | string | trimmed, 1–80 characters (UTF-16 code units, `DISH_LENGTH`, `src/storage.js:112`). Absent when `recipe` is present |

Writer key order: `day, meal, recipe` or `day, meal, dish` (`src/storage.js:117,119`).
Invariants: one entry per `(day, meal)` at most; an empty meal has no entry.

### State-level invariants (a violation makes the document invalid)

1. `items` is an array; each item is valid (Item table, with `list` in `active|saved|next`).
2. `recipes` is an array (versions 2–9); each recipe is valid.
3. Item ids unique; item names unique with `toLowerCase()` after trim.
4. Recipe ids unique; recipe names unique with `toLowerCase()` after trim.
5. Products of one recipe unique with `toLowerCase()` after trim.

Evidence: `src/storage.js:33-44,93-105,143-156`. Every other defect is repaired (section 3).

### Limits that only the screen sets

The data has no length limit, except for `dish` (80). The input fields of the screen limit the
text (`index.html`): item name 80 (`#add-name`, `#edit-name`), recipe name 80, quantity 20, shop
40, aisle 40, search and meal search 80. An imported file can hold longer texts; the reader
keeps them.

## 3. Normalisation on read (stored state and imported file)

One function, `normalizeState` (`src/storage.js:143-172`), reads every version. It is the same
for `load` and for `importJson`. It returns a clean version 9 state or "invalid".

Important: the repairs below are **not gated by the version**, with one exception. A version 9
document that holds `list: "next"`, `again` or `grouped` is read with the same rules as an old
one. The only version-gated rule: in version 1, the field `recipes` is ignored and taken as
`[]` (`src/storage.js:146`).

### Root

| Field | Missing or bad value | Result | Evidence |
|---|---|---|---|
| root | not an object, `null`, an array with no `items` | invalid | `src/storage.js:144`; test "importJson rejects invalid items" |
| `version` | not one of the numbers 1–9 | invalid | `src/storage.js:144`; test "importJson rejects an unknown version" |
| `items` | not an array | invalid | `src/storage.js:144`; test "importJson rejects invalid items" |
| `recipes` | version 1: any value | `[]` | `src/storage.js:146`; test "load migrates a version 1 state" |
| `recipes` | version 2–9: not an array (missing too) | invalid | `src/storage.js:147`; test "importJson rejects invalid recipes" |
| `sent` | not an array | `[]` | `src/storage.js:159`; test "importJson gives an empty sent list to a version 2 state without one" |
| `sent` entry | not a string, not a recipe id, a repeat | dropped; first occurrence kept, order kept | `src/storage.js:160`; test "importJson keeps in sent only the ids of recipes, one time each" |
| `group` | one of the four values | kept | `src/storage.js:89` |
| `group` | any other value or missing | `"none"` when `grouped === false`, else `"recipe"` | `src/storage.js:88-91`; tests "importJson reads the grouping of a version 2 backup", "importJson keeps a known group and turns any other value into the recipe grouping", "a known group wins over the old grouped field" |
| `grouped` | any | never written; only read as above | test "importJson reads the grouping of a version 2 backup" |
| `sort` | `"custom"` or `"name"` | kept | `src/storage.js:168` |
| `sort` | any other value or missing | `"custom"` | test "importJson keeps the name sort and turns any other value into custom" |
| `menu` | not an array (missing too) | `[]` | `src/storage.js:126`; test "importJson gives an empty menu to a version 4 state without a menu list" |
| `aisles` | not an array (missing too) | `[]` | `src/storage.js:61`; test "importJson trims the aisles and drops an entry that is not text, is empty or is a duplicate" |
| `aisles` entry | not a string; empty after trim; repeat with `toLowerCase()` | dropped; the rest trimmed; first spelling kept | `src/storage.js:60-71`; same test |
| unknown fields | any | dropped | `src/storage.js:162-171`; test "importJson drops unknown fields, moves Next to Actual and drops again" |

### Item

| Field | Missing or bad value | Result | Evidence |
|---|---|---|---|
| item | not an object | invalid | `src/storage.js:34` |
| `id` | not a string, or `""` | invalid | `src/storage.js:37-38` |
| `name` | not a string, or empty after trim | invalid; else trimmed | `src/storage.js:39-40,48`; test "importJson rejects invalid items" |
| `list` | not `active`, `saved` or `next` | invalid | `src/storage.js:41`; same test |
| `recurrent`, `bought` | not a boolean (missing too) | invalid | `src/storage.js:42`; same test |
| `again` | present and not a boolean | invalid | `src/storage.js:43`; test "importJson accepts an item with no again field and rejects again that is not a boolean" |
| `again` | absent or boolean | never written | test "save writes a version 9 state with no again field" |
| `list` | `"next"` | `"active"`, `bought: false` | `src/storage.js:45,50-51`; test "load migrates a version 7 state with an item of Next and a ticked item with again" |
| `list`, `bought` | `"active"`, `bought: true`, `recurrent: false`, `again: true` | `bought: false` | same; test above |
| `bought` | `"active"`, `bought: true`, `recurrent: true`, `again: true` | `bought: true` (kept) | test "a ticked recurrent item with again keeps its tick when a version 7 state loads" |
| `bought` | `list: "saved"` | `false` | `src/storage.js:51`; test "a saved item survives a save and a load, never ticked" |
| `shops` | not an array | `[]` | `src/storage.js:21`; test "importJson repairs the shops of an item" |
| `shops` entry | not a string; empty after trim; repeat with `toLowerCase()` in the item | dropped; the rest trimmed | `src/storage.js:20-31`; same test |
| `shops` spelling | one shop in two spellings across items | every item takes the spelling of the first use, in item order | `src/storage.js:81-85`; test "importJson gives each shop the spelling of its first use" |
| `quantity` | not a string | `""`; a string is trimmed | `src/storage.js:53`; test "importJson trims a quantity and reads a quantity that is not text as none" |
| `aisle` | not a string, or no match in `aisles` with `toLowerCase()` after trim | `""` | `src/storage.js:54,75-78`; test "importJson gives an item the spelling of its aisle and clears an aisle that is not in the aisles" |
| `aisle` | matches an aisle with `toLowerCase()` | the spelling of `aisles` | same test |
| unknown fields | any | dropped | test "importJson drops unknown fields, moves Next to Actual and drops again" |

The order of the repairs: items are cleaned one by one, then the uniqueness check runs on the
trimmed names, then shop spellings are unified, then aisles are matched (`src/storage.js:148-164`).

### Recipe

| Field | Missing or bad value | Result | Evidence |
|---|---|---|---|
| recipe | not an object | invalid | `src/storage.js:94`; test "importJson rejects invalid recipes" |
| `id` | not a string or `""` | invalid | `src/storage.js:97-98`; same test |
| `name` | not a string, or empty after trim | invalid; else trimmed | `src/storage.js:99-100`; same test |
| `products` | not an array | invalid | `src/storage.js:101`; same test |
| product | not a string, or empty after trim | invalid | `src/storage.js:102`; same test |
| products | two equal with `toLowerCase()` after trim | invalid | `src/storage.js:105`; same test |
| product | valid | trimmed | `src/storage.js:104`; test "importJson trims recipe names and products and drops unknown fields" |
| `url` | a string that is a web address after trim | trimmed | `src/storage.js:107`; test "importJson keeps a web link of a recipe and drops any other value" |
| `url` | any other value or missing | `""` | same test |
| unknown fields | any | dropped | test "importJson trims recipe names and products and drops unknown fields" |

### Meal

Evidence: `src/storage.js:115-138`; tests "importJson keeps the valid meals of the menu in day
and meal order and drops the others", "importJson keeps a dish of the menu and drops a bad one".

| Case | Result |
|---|---|
| entry not an object | dropped |
| `day` not an integer 0–6 (`1.5`, `"1"`, `7`) | dropped |
| `meal` not `lunch` or `dinner` | dropped |
| `dish` absent, `recipe` is the id of a recipe of the state | kept as `{day, meal, recipe}` |
| `dish` absent, `recipe` unknown or missing | dropped |
| `dish` present, `recipe` present | dropped |
| `dish` present, not a string, empty after trim, or longer than 80 after trim | dropped |
| `dish` present and valid, `recipe` absent | kept as `{day, meal, dish}`, `dish` trimmed |
| a second valid entry of one `(day, meal)` | dropped; the first valid one in input order wins |
| extra fields | dropped |
| order | sorted by `day`, then `lunch` before `dinner` |

## 4. Migration, version by version

The reader has no step functions. Each older version lacks fields; the normalisation of
section 3 fills them. This table states, per version, what the document lacks and what the
reader makes of it (`src/storage.js:10-13,87,122-124,140-172`; `docs/spec/08-storage.md`
STORE-8).

| From | The document lacks or holds | The reader gives |
|---|---|---|
| 1 | no `recipes`, no `sent` (a `recipes` field is ignored) | `recipes: []`, `sent: []`, so no meal with a recipe survives |
| 1–2 | `grouped: boolean` in place of `group`; items have no `shops`; maybe no `sort` | `group: "none"` when `grouped === false`, else `"recipe"`; `shops: []`; `sort: "custom"` |
| 1–3 | no `menu` | `menu: []` |
| 1–4 | items have no `quantity` | `quantity: ""` |
| 1–5 | no `list: "saved"` value yet | no change |
| 1–6 | no `aisles`, items have no `aisle` | `aisles: []`, `aisle: ""` |
| 1–7 | items with `list: "next"`; items with `again` | `next` → `active`, not ticked. Ticked one-time `active` item with `again: true` → not ticked. `again` dropped from every item |
| 1–8 | meals have no `dish` | no change |

A migrated state is not written back at load. It is written as version 9 at the next change
(`src/ui/context.js:208`; STORE-8).

## 5. Sample documents

All samples come from `tests/storage.test.js` unless named.

### Empty state

Test "load returns an empty state when the key is absent" and "emptyState is a version 9 state
with no items, no recipes, no menu and the recipe grouping":

```json
{ "version": 9, "items": [], "recipes": [], "sent": [], "group": "recipe", "sort": "custom", "menu": [], "aisles": [] }
```

### Full current state (version 9)

`sample()` (`tests/storage.test.js:79-92`), used by "save then load returns the same state" and
"exportJson then importJson returns the same state":

```json
{
  "version": 9,
  "items": [
    { "id": "a", "name": "Bread", "recurrent": false, "list": "active", "bought": true, "shops": ["Lidl", "Market"], "quantity": "2", "aisle": "Bakery" },
    { "id": "b", "name": "Milk", "recurrent": true, "list": "active", "bought": false, "shops": [], "quantity": "", "aisle": "" }
  ],
  "recipes": [
    { "id": "r1", "name": "Omelette", "products": ["Eggs", "Potatoes"], "url": "https://example.com/omelette" }
  ],
  "sent": ["r1"],
  "group": "shop",
  "sort": "custom",
  "menu": [{ "day": 0, "meal": "lunch", "recipe": "r1" }],
  "aisles": ["Bakery", "Dairy"]
}
```

A meal with a dish, from test "importJson keeps a dish of the menu and drops a bad one":
`{ "day": 1, "meal": "lunch", "dish": "Paella" }`.

A larger version 9 document is `shopping-sample.json` at the repository root (8 keys, 6 items
`seed-1`…`seed-6`, 5 recipes `seed-7`…`seed-11`, 8 meals, two of them dishes such as
`{ "day": 4, "meal": "dinner", "dish": "Pizza" }`). The file is in `.gitignore`: it is a local
file, not part of the commit, and no test reads it.

### Version 1 state and its migrated result

`sampleV1()` (`tests/storage.test.js:62-68`):

```json
{
  "version": 1,
  "items": [
    { "id": "a", "name": "Bread", "recurrent": false, "list": "active", "bought": true, "again": true },
    { "id": "b", "name": "Milk", "recurrent": true, "list": "next", "bought": false, "again": false }
  ]
}
```

Result, `migratedV1()` (`tests/storage.test.js:202-211`), tests "load migrates a version 1
state" and "importJson migrates a version 1 backup":

```json
{
  "version": 9,
  "items": [
    { "id": "a", "name": "Bread", "recurrent": false, "list": "active", "bought": false, "shops": [], "quantity": "", "aisle": "" },
    { "id": "b", "name": "Milk", "recurrent": true, "list": "active", "bought": false, "shops": [], "quantity": "", "aisle": "" }
  ],
  "recipes": [], "sent": [], "group": "recipe", "sort": "custom", "menu": [], "aisles": []
}
```

### Version 1 state with defects

Test "importJson drops unknown fields, moves Next to Actual and drops again":

```json
{ "version": 1, "extra": true, "items": [
  { "id": "a", "name": " Milk ", "recurrent": true, "list": "next", "bought": true, "again": true, "note": "x" },
  { "id": "b", "name": "Soap", "recurrent": false, "list": "active", "bought": false, "again": true }
] }
```

gives

```json
{ "version": 9, "items": [
  { "id": "a", "name": "Milk", "recurrent": true, "list": "active", "bought": false, "shops": [], "quantity": "", "aisle": "" },
  { "id": "b", "name": "Soap", "recurrent": false, "list": "active", "bought": false, "shops": [], "quantity": "", "aisle": "" }
], "recipes": [], "sent": [], "group": "recipe", "sort": "custom", "menu": [], "aisles": [] }
```

### Version 2 state

`sampleV2()` (`tests/storage.test.js:70-77`) is `sampleV1()` with `version: 2`,
`recipes: [{ id: "r1", name: "Omelette", products: ["Eggs", "Potatoes"], url: "https://example.com/omelette" }]`,
`sent: ["r1"]`, `grouped: true`, `sort: "custom"`. Test "load migrates a version 2 state" gives
the items of `migratedV1()`, the recipe and `sent` kept, `group: "recipe"`, `menu: []`,
`aisles: []`, and no `grouped`.

### Version 7 state

Test "load migrates a version 7 state with an item of Next and a ticked item with again":

| Input item | Output item |
|---|---|
| `Bread`, `list: "next"`, `bought: false`, `again: false` | `list: "active"`, `bought: false` |
| `Soap`, one-time, `list: "active"`, `bought: true`, `again: true` | `list: "active"`, `bought: false` |
| `Salt`, one-time, `list: "active"`, `bought: true`, `again: false` | `list: "active"`, `bought: true` |
| `Rice`, `list: "saved"`, `bought: false`, `again: false` | `list: "saved"`, `bought: false` |

No output item has `again`.

## 6. Export and import file

### Export

- Trigger: **Exportar** in `Ajustes` (`settings.export`) (`src/ui/settings.js:160-162`).
- Content: the in-memory state, `JSON.stringify(state, null, 2)` — UTF-8, indent of 2 spaces,
  no wrapper, no extra field (`src/storage.js:204`). It is the same object as the stored state
  (section 2), only indented.
- File name: `compra-YYYY-MM-DD-HHMMSS.json`, local date and time, each part padded with zeros
  (`src/storage.js:207-212`). Tests "exportFilename names the file with the local date and
  time" (`compra-2026-10-14-090507.json`) and "exportFilename gives two exports of one day
  different names".
- MIME type: `application/json` (`src/ui/settings.js:154`).
- The export works with no storage too: it writes the state in memory.

### Import

- Trigger: **Importar** opens a file choice with `accept="application/json,.json"`
  (`index.html:410`, `src/ui/settings.js:164`). No file chosen: nothing happens.
- The file text is read as UTF-8 (`file.text()`, `src/ui/settings.js:214`).
- `importJson(text)` (`src/storage.js:214-219`) parses and normalises as in section 3.
- On success, the app asks `import.confirm`, with the counts of the **normalised** state:
  `¿Sustituir los datos actuales por los de la copia ({items} y {recipes})?`, where `{items}` is
  `count.items` (`1 artículo` / `N artículos`) and `{recipes}` is `count.recipes`
  (`src/ui/settings.js:219-223`). Cancel: nothing changes.
- Yes: the normalised state replaces the full state (no merge), is saved, and the toast
  `toast.imported` (`Copia importada.`) shows with `Deshacer` for 5000 ms
  (`src/ui/settings.js:224`, `src/ui/context.js:26,214-225`).

### Import errors

| Message key | Spanish text | When | Evidence |
|---|---|---|---|
| `error.invalidJson` | `El archivo no es un JSON válido.` | The text does not parse as JSON | `src/storage.js:216`; test "importJson rejects text that is not JSON" |
| `error.notBackup` | `El archivo no es una copia de seguridad de la lista.` | The JSON is not a valid state: any "invalid" row of section 3 | `src/storage.js:218`; tests "importJson rejects an unknown version", "importJson rejects invalid items", "importJson rejects invalid recipes", "importJson accepts an item with no again field and rejects again that is not a boolean" |
| `error.notSaved` | `El cambio no se ha guardado: el almacenamiento no está disponible.` | The import is accepted but the write fails; the state stays in memory | `src/ui/context.js:219-221`; untested |

Each error shows as a toast for 3000 ms (`MESSAGE_MS`, `src/ui/context.js:27`). An error does not change the state.

### Compatibility

- Web → port: a file exported by the web app is a valid version 9 state. The port must read it
  with the normalisation of section 3, and must also accept versions 1–8 (BACKUP-4).
- Port → web: the web app imports a port file when the port writes `version: 9`, the field set
  of section 2, and the invariants of section 2. The web app drops any field it does not know,
  with no error, and rejects `version` 10 or higher. A new field in the port is lost in a round
  trip through the web app.
- Round trip: export, then import, gives the same state (test "exportJson then importJson
  returns the same state").

## 7. Other storage keys

All in `localStorage`, same origin. None is in the backup file. Every key of this table is in
`APP_KEYS` (`src/storage.js:421-432`) and **Borrar todos los datos** removes it
(`resetAll`, `src/storage.js:435-442`; tests "resetAll removes every key of the app and keeps
the keys of other apps", "APP_KEYS holds the state, its corrupt copy and each preference of the
device").

Rule of the preferences: the default value is never stored; the save of the default removes the
key. A read of an unknown value gives the default.

| Key | Stored value | Default (no key, unknown value) | Read when storage throws | Writer | Evidence |
|---|---|---|---|---|---|
| `shopping.v1` | the state, compact JSON | empty state | empty state | each change | `src/storage.js:5,182-202` |
| `shopping.v1.corrupt` | the last stored text of `shopping.v1` that was not a valid state, verbatim | absent | — | `load` only; overwrites an older copy | `src/storage.js:6,188`; test "load keeps corrupt JSON under the corrupt key and returns an empty state" |
| `shopping.lang` | `ca`, `de`, `en`, `es`, `fr`, `it` or `pt` | `null`: follow the phone | `null` | language select of `Ajustes`; `Automático` removes the key | `src/storage.js:222-243`; tests "loadLanguage …", "saveLanguage stores a language and null removes it" |
| `shopping.hand` | `left` | `right` | `right` | hand select; `right` removes the key | `src/storage.js:246-266`; tests "loadHand …", "saveHand stores left and right removes the key" |
| `shopping.theme` | `light` or `dark` | `system` | `system` | theme select; `system` or any other value removes the key | `src/storage.js:317-339`; tests "loadTheme …", "saveTheme …" |
| `shopping.density` | `compact` | `normal` | `normal` | density select; any other value removes the key | `src/storage.js:343-363`; tests "loadDensity …", "saveDensity …" |
| `shopping.tripEnd` | `save` | `keep` | `keep` | **Al terminar la compra** buttons; any other value removes the key | `src/storage.js:293-313`; tests "loadTripEnd …", "saveTripEnd stores save and keep removes the key" |
| `shopping.shopLists` | `hide` | `show` | `show` | the hide/show control of the row of shop lists; any other value removes the key | `src/storage.js:269-289`; tests "loadShopLists …", "saveShopLists stores hide and show removes the key" |
| `shopping.onboarded` | `1` | not seen (`false`); only `"1"` counts | **seen** (`true`) | the close of the walkthrough | `src/storage.js:367-385`; tests "loadOnboarded is true for a storage that throws", "loadOnboarded is false for no value and for another value" |
| `shopping.swipeHint` | `1` | not shown (`false`); only `"1"` counts | not shown (`false`) | `Compra` after the slide hint played | `src/storage.js:398-417`; tests "loadSwipeHint …", "saveSwipeHint stores the hint, and loadSwipeHint then reads it as shown" |

New install: the walkthrough shows only when `shopping.onboarded` is not `1` **and**
`shopping.v1` is absent. A corrupt `shopping.v1` counts as present (`src/storage.js:388-394`,
`src/onboarding.js:5`, `src/ui/context.js:95`; tests "hasStoredState is true for a stored text
that is not a valid state", `tests/onboarding.test.js` "shouldShow is false for a stored state").

Not `localStorage` (web only, not removed by reset): Cache API `shopping-shell-v20` (app shell)
and `shopping-manifest` (localised manifest text) (`sw.js:1,66`). See 10-offline-version.

Not stored anywhere: the open section, open rows, search text, the undo snapshot
(`src/ui/context.js:176`).

## 8. Target mapping

Options only. The choice goes to `open-questions.md` (Q-data-1, Q-data-2).

| Part | Option A | Option B | Option C |
|---|---|---|---|
| State (`shopping.v1`) | One JSON document in app-private storage (a DataStore with a JSON serializer, or a file with atomic replace). Same text as the export; the reader is the normalisation of section 3 | Room: tables `item`, `item_shop`, `recipe`, `recipe_product`, `meal`, `aisle`, `sent`, and one row for `group`, `sort`, `version`. Needs a position column for each ordered list (items, recipes, products, shops of an item, aisles, sent). JSON is only the import and export format | Hybrid: one JSON document for the state, Room only if a later feature needs queries |
| Preferences (`lang`, `hand`, `theme`, `density`, `tripEnd`, `shopLists`) | Preferences DataStore, one key each, default = key absent | Fields of the same JSON document as the state (they stay out of the export) | Android per-app language (`AppCompatDelegate.setApplicationLocales`) for `lang`, DataStore for the rest |
| Flags (`onboarded`, `swipeHint`) | Preferences DataStore | Same JSON document as the preferences | — |
| Corrupt copy (`shopping.v1.corrupt`) | A second file or DataStore key with the raw text | Dropped; log only | — |
| Undo snapshot | The previous state in memory (ViewModel) | — | — |
| Backup file | Storage Access Framework: `ACTION_CREATE_DOCUMENT` / `ACTION_OPEN_DOCUMENT`, MIME `application/json` | Share sheet (`ACTION_SEND`) for the export, SAF for the import | — |
| Reset | Clear the state document, the preferences and the corrupt copy, then restart the activity | — | — |
| Cache API keys | Dropped: no web shell | — | — |

Notes for each option:

- A single JSON document keeps the "write the full state at once" rule (STORE-2), the export
  format, the full-state undo and the replace-on-import with no mapping code.
- Room needs a transaction for every operation, a mapping to the JSON of section 2, and the
  same normalisation at import. The ordered lists need explicit positions.
- Android Auto Backup and device transfer can copy any of these stores. The web app has no
  automatic backup (`docs/spec/08-storage.md` Limits). See Q-data-9.
