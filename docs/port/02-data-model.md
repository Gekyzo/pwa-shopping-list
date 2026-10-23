# Data model

The state of the app, its records, invariants, derived views and name rules. Source modules:
`src/store.js` (state shape, `emptyState`, item operations), `src/storage.js` (validation on
read). The exact field table, defaults and samples are in [data-contract.md](data-contract.md).

## State

The app has one state object. Each operation returns a new object and never changes its input.

```js
{
  version: 9,
  items: [Item],      // insertion order, changed only by a manual move
  recipes: [Recipe],  // insertion order
  sent: [string],     // ids of the recipes sent to Compra in this trip, in send order
  group: 'recipe',    // 'recipe' | 'shop' | 'aisle' | 'none'
  sort: 'custom',     // 'custom' | 'name'
  menu: [Meal],       // the planned meals of the week, in day and meal order
  aisles: [string],   // the sections of the store, in the order of the walk
}
```

The empty state is `{ version: 9, items: [], recipes: [], sent: [], group: 'recipe', sort: 'custom', menu: [], aisles: [] }`.

**DATA-16** [core] [new] The empty state has `version` 9, no items, no recipes, no sent recipes, `group` `recipe`, `sort` `custom`, no meals and no aisles.
- Evidence: `src/store.js:11`; test: `tests/storage.test.js` "emptyState is a version 9 state with no items, no recipes, no menu and the recipe grouping".

**DATA-17** [core] [new] An operation never changes its input state. An operation that changes nothing returns the same state object.
- Evidence: `src/store.js:19-21,51,118`; tests: `tests/store.test.js` "addItem does not change the input state", "startNewShopping does not change the input state", "setQuantity with the same text returns the same state object", "reorderItems returns the same state for the same order".

## Item

```js
{
  id: string,         // crypto.randomUUID()
  name: string,       // trimmed, not empty
  recurrent: boolean, // comes back at each trip
  list: 'active' | 'saved', // 'saved': kept after a trip, out of Compra
  bought: boolean,    // ticked
  shops: [string],    // shop names
  quantity: string,   // free text, such as '2' or '1 kg'; trimmed; '' for none
  aisle: string,      // one name of `aisles`, or '' for none
}
```

**DATA-18** [core] [new] A new item gets a new unique id, the trimmed name, `recurrent: false`, `list: 'active'`, `bought: false`, no shops, quantity `''` and aisle `''`. It has no `again` field.
- Evidence: `src/store.js:31-37`; tests: `tests/store.test.js` "addItem adds a one-time item to active", "addItem always creates a one-time item in active, with no again field", "addItem creates an item with no quantity".
- Note: the id is `crypto.randomUUID()`; the port can use `UUID.randomUUID().toString()`. The reader accepts any non-empty string as an id (`seed-1`, `sample-pasta`).

**DATA-19** [core] [new] The quantity is free text. It is trimmed; an empty text clears it.
- Evidence: `src/store.js:46-52`; tests: `tests/store.test.js` "setQuantity sets the trimmed text and does not change the input state", "setQuantity with an empty text clears the quantity".

## Recipe

```js
{
  id: string,
  name: string,       // trimmed, not empty
  products: [string], // product names, trimmed, not empty
  url: string,        // an http or https address, or ''
}
```

**DATA-20** [core] [new] The `url` of a recipe is `''` or a web address: no whitespace, scheme `http` or `https`, and a host name with at least one dot and a letter top-level domain (or an `xn--` label).
- Evidence (Q-data-10): `src/recipes.js:47-60`, `src/storage.js:107`; tests: `tests/recipes.test.js` "isWebUrl needs a host name with a dot and no space", `tests/storage.test.js` "importJson keeps a web link of a recipe and drops any other value".

## Meal

```js
{
  day: number,        // 0 (Monday) to 6
  meal: 'lunch' | 'dinner',
  recipe: string,     // the id of a recipe, or absent with a dish
  dish: string,       // a name with no recipe, trimmed, 1 to 80 characters; absent with a recipe
}
```

A meal has a `recipe` or a `dish`, never both. A meal with no recipe and no dish has no record.
See [13-menu.md](13-menu.md).

## Invariants

**DATA-1** [core] [untested] An item is one record. It is never copied; a view computes where it shows.
- Evidence: `src/store.js:129-132` (views filter `state.items`); test: untested as a rule.

**DATA-2** [core] [verified] Item ids are unique. Recipe ids are unique.
- Evidence: `src/storage.js:152,154`; test: `tests/storage.test.js` "importJson rejects invalid items", "importJson rejects invalid recipes".

**DATA-3** [core] [verified] Item names are unique with no case distinction, in `Compra` and saved. `Leche` and `leche` are one name; `Cafe` and `Café` are two.
- Evidence: `src/store.js:23-28`, `src/storage.js:153`; tests: `tests/store.test.js` "addItem rejects a duplicate in active or saved, without case distinction", `tests/storage.test.js` "importJson rejects invalid items". The `Cafe`/`Café` case is untested.
- Note: the identity is `toLowerCase()` of the trimmed name, with no locale.

**DATA-4** [core] [verified] Recipe names are unique with no case distinction.
- Evidence: `src/storage.js:155`; tests: `tests/storage.test.js` "importJson rejects invalid recipes", `tests/recipes.test.js` "addRecipe rejects a duplicate name without case distinction".

**DATA-5** [core] [verified] The products of one recipe are unique with no case distinction.
- Evidence: `src/storage.js:105`; tests: `tests/storage.test.js` "importJson rejects invalid recipes", `tests/recipes.test.js` "addRecipeProduct rejects a duplicate without case distinction and an unknown recipe".

**DATA-6** [core] [verified] `bought` is true only for an item of `list: 'active'`. A saved item is never ticked.
- Evidence: `src/store.js:63`, `src/storage.js:51`; tests: `tests/store.test.js` "a saved item cannot be ticked", `tests/storage.test.js` "a saved item survives a save and a load, never ticked".

**DATA-7** [dropped] [removed] Removed: an item has no `again` field (STORE-8).

**DATA-8** [core] [verified] The shops of one item are unique with no case distinction, trimmed and not empty.
- Evidence: `src/storage.js:20-31`; test: `tests/storage.test.js` "importJson repairs the shops of an item".

**DATA-9** [core] [verified] One shop has one spelling in the full state: the spelling of its first use.
- Evidence: `src/storage.js:81-85`; tests: `tests/storage.test.js` "importJson gives each shop the spelling of its first use", `tests/shops.test.js` "addItemShop takes the spelling of a shop in use".

**DATA-10** [core] [verified] `sent` holds only ids of recipes that exist, each one time.
- Evidence: `src/storage.js:158-160`, `src/recipes.js:39`; tests: `tests/storage.test.js` "importJson keeps in sent only the ids of recipes, one time each", `tests/recipes.test.js` "deleteRecipe removes the recipe from sent".

**DATA-11** [core] [verified] A recipe and an item have no link. A product matches an item by name, with no case distinction, at the time of use. A rename of one does not change the other.
- Evidence: `src/recipes.js:123` (`recipeGroups`); tests: `tests/recipes.test.js` "recipeGroups matches an item added by hand without case distinction", "sendRecipe matches an item without case distinction and creates no duplicate".

**DATA-12** [core] [verified] A shop has no record. It exists while an item has it.
- Evidence: `src/shops.js:21`; test: `tests/shops.test.js` "shopNames gives each shop in use one time, in name order".

**DATA-13** [core] [verified] `menu` has one record for each meal at most, in day and meal order. Its `recipe` is the id of a recipe that exists.
- Evidence: `src/storage.js:115-138`, `src/recipes.js:41`; test: `tests/storage.test.js` "importJson keeps the valid meals of the menu in day and meal order and drops the others".

**DATA-14** [core] [verified] The names of `aisles` are trimmed, not empty and unique with no case distinction.
- Evidence: `src/storage.js:60-71`; tests: `tests/storage.test.js` "importJson trims the aisles and drops an entry that is not text, is empty or is a duplicate", `tests/aisles.test.js` "addAisle rejects a name that differs from an aisle only by case".

**DATA-15** [core] [verified] `item.aisle` is `''` or a name of `aisles`, in the spelling of `aisles`. An item has one aisle at most. See [17-aisles.md](17-aisles.md).
- Evidence: `src/storage.js:75-78`; tests: `tests/storage.test.js` "importJson gives an item the spelling of its aisle and clears an aisle that is not in the aisles", `tests/aisles.test.js` "setItemAisle sets the aisle of an item in the spelling of the aisle".

**DATA-21** [core] [new] The data has no length limit for a name, a quantity, a shop or an aisle. Only the dish of a meal has a limit, 80 characters. The input fields of the screen set the other limits: 80 for an item or recipe name, 20 for a quantity, 40 for a shop or an aisle.
- Evidence (Q-data-11): `src/storage.js:112,119`, `index.html:192,279,280,286,308,321`; test: `tests/storage.test.js` "importJson keeps a dish of the menu and drops a bad one" (dish only).

## Derived views

No view is stored. The rules of each view are in the document of its area.

| View | Function | Content | Rules in |
|---|---|---|---|
| `Compra` | `activeItems` (`src/store.js:129`) | The items of `list: 'active'`, those to buy first, then those ticked | 03-lists |
| Trip figures | `tripSummary` (`src/store.js:195`) | `total`, `left`, `back`, `saved` | 03-lists |
| Trip outcome | `tripOutcome` (`src/store.js:210`) | `recurrent`, `kept`, `open`, `bought` | 03-lists |
| Recipe groups | `recipeGroups` (`src/recipes.js:123`) | `Compra` by recipe | 06-recipes |
| Shop groups | `shopGroups` (`src/shops.js:50`) | `Compra` by shop | 05-shops |
| Shops in use | `shopNames` (`src/shops.js:21`) | Each shop of an item, in name order | 05-shops |
| Aisle groups | `aisleGroups` (`src/aisles.js:85`) | `Compra` by aisle, in the order of `aisles` | 17-aisles |

`tripSummary` gives: `total`, the items of `Compra`; `left`, those not ticked; `back`, the
recurrent items, ticked or not, and the open items kept with `Aplazar` (TRIP-6); `saved`, the
other one-time items of `Compra`, ticked or not. `tripOutcome` splits the items of `Compra` by
where each one goes (TRIP-4): `recurrent` come back; `kept`, open items kept with `Aplazar`;
`open`, the other open items, saved; `bought`, ticked one-time items, saved. The four add up to
`total` (test `tests/store.test.js` "tripOutcome adds up to the items of Actual").

## Name rules

| Use | Rule | Evidence |
|---|---|---|
| Identity of an item, a recipe, a product, a shop, an aisle | `toLowerCase()` of the trimmed text: no case distinction, accents count | `src/store.js:25`, `src/storage.js:17` |
| Search of items and of recipes | `fold`: trimmed, lower case, NFD, diacritics removed | `src/store.js:135-140` |
| Order by name | `localeCompare(…, 'es', { sensitivity: 'base' })`: no case and no accent distinction, in each language of the screen | `src/store.js:122` |

**DATA-22** [core] [new] The identity of a name is its trimmed text in lower case, with accents. Two names are the same when these forms are equal.
- Evidence: `src/store.js:23-28`, `src/storage.js:17`; tests: `tests/store.test.js` "addItem rejects a duplicate in active or saved, without case distinction", "renameItem accepts a change of case of the same item".
- Note: `trim()` and `toLowerCase()` follow ECMAScript; the port needs the same white-space set and a locale-free lower case (Q-data-3).

## Not in the state

- The language that the user chose and each other preference of the device. Each has its own
  key. See [08-storage.md](08-storage.md) and [data-contract.md](data-contract.md) section 7.
- The section that is open, an open row, the text of a search and each other state of the screen.
  A start of the app shows `Compra` with all rows closed.
- The state before the last change, which `Deshacer` uses. It lives only while its message shows
  (`src/ui/context.js:176-190`).

**DATA-23** [core] [new] A preference of the device is not part of the state: a saved language, hand, theme, density, trip-end choice, shop-list choice or walkthrough flag leaves the stored state absent.
- Evidence: `src/storage.js:221-417`; tests: `tests/storage.test.js` "the language is not part of the state", "the hand is not part of the state", "the theme is not part of the state", "the density is not part of the state", "the trip end is not part of the state", "the shop list functions do not throw when the storage does, and are not part of the state", "the flag of the walkthrough is not part of the stored state".
