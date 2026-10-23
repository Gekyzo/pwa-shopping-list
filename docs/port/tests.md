# Test map

Each test of the source repository, the rules it covers, and how it ports.

- `unit` — a JVM unit test (JUnit or kotlin.test) over the pure Kotlin code.
- `instrumented` — needs Android: storage, resources, intents or a Compose UI test (Robolectric
  or an emulator).
- `none` — the test checks a web-only file or mechanism; it does not port.

`src/app.js`, `src/ui/`, most of `sw.js` and `.githooks/` have no unit test in the source. Their
rules are `untested`; on the target they need Compose UI tests. The `No test:` line of each area
lists them.

## Product, data model and storage (PROD, DATA, STORE, BACKUP)

| Test file | Test | Rules | Port kind | Note |
|---|---|---|---|---|
| tests/storage.test.js | (file) | STORE-5…18, BACKUP-1…8, DATA-2…15, DATA-23 | unit | Pure functions over a fake key-value storage; port the fake as an in-memory store |
| tests/storage.test.js | "save then load returns the same state" | STORE-16, PROD-4 | unit | |
| tests/storage.test.js | "load returns an empty state when the key is absent" | STORE-1, DATA-16 | unit | |
| tests/storage.test.js | "load keeps corrupt JSON under the corrupt key and returns an empty state" | STORE-5 | unit | |
| tests/storage.test.js | "load treats valid JSON with an invalid shape as corrupt" | STORE-5, STORE-6 | unit | |
| tests/storage.test.js | "load and save survive a storage that throws" | STORE-18, STORE-9 | unit | Port: a store that throws `IOException` |
| tests/storage.test.js | "exportFilename names the file with the local date and time", "exportFilename gives two exports of one day different names" | BACKUP-1 | unit | Local time zone of the JVM |
| tests/storage.test.js | "exportJson then importJson returns the same state" | BACKUP-2, BACKUP-8 | unit | |
| tests/storage.test.js | "importJson rejects text that is not JSON" | BACKUP-3 | unit | `error.invalidJson` |
| tests/storage.test.js | "importJson rejects an unknown version", "importJson rejects invalid items", "importJson rejects invalid recipes" | STORE-6, BACKUP-3, DATA-2, DATA-3, DATA-4, DATA-5 | unit | `error.notBackup` |
| tests/storage.test.js | "importJson drops unknown fields, moves Next to Actual and drops again" | STORE-7, STORE-8 | unit | |
| tests/storage.test.js | "emptyState is a version 9 state with no items, no recipes, no menu and the recipe grouping" | DATA-16 | unit | |
| tests/storage.test.js | "load migrates a version 1 state", "importJson migrates a version 1 backup", "load migrates a version 2 state", "importJson reads the grouping of a version 2 backup" | STORE-8, BACKUP-4 | unit | |
| tests/storage.test.js | "importJson keeps a known group and turns any other value into the recipe grouping", "a known group wins over the old grouped field" | STORE-7, STORE-17 | unit | |
| tests/storage.test.js | "importJson repairs the shops of an item", "importJson gives each shop the spelling of its first use" | STORE-7, DATA-8, DATA-9 | unit | |
| tests/storage.test.js | "importJson trims recipe names and products and drops unknown fields", "importJson accepts a recipe with no products and a recipe named as an item" | STORE-7, DATA-4 | unit | |
| tests/storage.test.js | "importJson gives an empty sent list to a version 2 state without one", "importJson keeps in sent only the ids of recipes, one time each" | STORE-7, DATA-10 | unit | |
| tests/storage.test.js | "importJson keeps a web link of a recipe and drops any other value" | STORE-7, DATA-20 | unit | Depends on URL parsing (Q-data-10) |
| tests/storage.test.js | "importJson keeps the name sort and turns any other value into custom", "the name sort survives save and load" | STORE-7, STORE-16 | unit | |
| tests/storage.test.js | "loadLanguage …" (2), "saveLanguage stores a language and null removes it", "the language functions do not throw when the storage does", "the language is not part of the state" | STORE-12, STORE-13, STORE-18, DATA-23 | instrumented | Unit if the preference store is abstracted |
| tests/storage.test.js | "loadHand …" (2), "saveHand stores left and right removes the key", "the hand functions do not throw when the storage does", "the hand is not part of the state" | STORE-12, STORE-18, DATA-23 | instrumented | Same note |
| tests/storage.test.js | "loadTripEnd returns save when stored and keep for no value and an unknown value", "saveTripEnd stores save and keep removes the key", "the trip end save survives a save and a load, and keep goes back to the default", "the trip end functions do not throw when the storage does", "the trip end is not part of the state" | STORE-12, STORE-18, DATA-23 | instrumented | Same note |
| tests/storage.test.js | "loadShopLists returns hide when stored and show for no value and an unknown value", "saveShopLists stores hide and show removes the key", "the shop list functions do not throw when the storage does, and are not part of the state" | STORE-12, STORE-18, DATA-23 | instrumented | Same note |
| tests/storage.test.js | "loadTheme …" (2), "saveTheme stores light and dark and system removes the key", "saveTheme removes the key for an unknown theme", "the theme functions do not throw when the storage does", "the theme is not part of the state" | STORE-12, STORE-18, DATA-23 | instrumented | Same note |
| tests/storage.test.js | "loadDensity …" (2), "saveDensity stores compact and normal removes the key", "saveDensity removes the key for an unknown density", "the density functions do not throw when the storage does", "the density is not part of the state" | STORE-12, STORE-18, DATA-23 | instrumented | Same note |
| tests/storage.test.js | "loadOnboarded is true when the flag is stored", "loadOnboarded is false for no value and for another value", "loadOnboarded is true for a storage that throws", "saveOnboarded stores the flag", "saveOnboarded is false for a storage that throws" | STORE-14, STORE-18 | instrumented | Same note |
| tests/storage.test.js | "hasStoredState is true for a stored state", "hasStoredState is true for a stored text that is not a valid state", "hasStoredState is false for no stored state and for a storage that throws" | STORE-15 | unit | |
| tests/storage.test.js | "the flag of the walkthrough is not part of the stored state" | DATA-23, BACKUP-2 | unit | |
| tests/storage.test.js | "load migrates a version 3 state with an empty menu", "importJson migrates a version 3 backup with an empty menu", "importJson gives an empty menu to a version 4 state without a menu list", "load reads a version 8 state and keeps its menu" | STORE-8, BACKUP-4 | unit | |
| tests/storage.test.js | "importJson keeps the valid meals of the menu in day and meal order and drops the others", "importJson keeps a dish of the menu and drops a bad one" | STORE-7, DATA-13, DATA-21 | unit | |
| tests/storage.test.js | "load migrates a version 4 state with no quantity on each item", "importJson trims a quantity and reads a quantity that is not text as none" | STORE-7, STORE-8 | unit | |
| tests/storage.test.js | "load migrates a version 5 state with no change of its items", "a saved item survives a save and a load, never ticked" | STORE-8, DATA-6 | unit | |
| tests/storage.test.js | "load migrates a version 6 state with no aisles", "importJson trims the aisles and drops an entry that is not text, is empty or is a duplicate", "importJson gives an item the spelling of its aisle and clears an aisle that is not in the aisles" | STORE-7, STORE-8, DATA-14, DATA-15 | unit | |
| tests/storage.test.js | "load migrates a version 7 state with an item of Next and a ticked item with again", "a ticked recurrent item with again keeps its tick when a version 7 state loads", "importJson accepts an item with no again field and rejects again that is not a boolean", "save writes a version 9 state with no again field" | STORE-6, STORE-8, STORE-16, DATA-7 | unit | |
| tests/storage.test.js | "loadSwipeHint is false when no hint was shown", "saveSwipeHint stores the hint, and loadSwipeHint then reads it as shown", "loadSwipeHint is false for another value", "loadSwipeHint is false and saveSwipeHint fails for a storage that throws" | STORE-14, STORE-18 | instrumented | Unit if the preference store is abstracted |
| tests/storage.test.js | "resetAll removes every key of the app and keeps the keys of other apps", "APP_KEYS holds the state, its corrupt copy and each preference of the device", "after resetAll the install counts as new", "resetAll fails for a storage that throws" | BACKUP-7, STORE-15 | instrumented | Reset clears every store of the port |
| tests/store.test.js | "addItem adds a one-time item to active", "addItem always creates a one-time item in active, with no again field", "addItem creates an item with no quantity" | DATA-18 | unit | Other tests of the file belong to 03-lists and 04-arrange |
| tests/store.test.js | "addItem rejects a duplicate in active or saved, without case distinction", "renameItem accepts a change of case of the same item", "a saved item keeps its name: search finds it and an add of the name is a duplicate" | DATA-3, DATA-22 | unit | |
| tests/store.test.js | "addItem does not change the input state", "startNewShopping does not change the input state", "setQuantity with the same text returns the same state object", "reorderItems returns the same state for the same order" | DATA-17 | unit | |
| tests/store.test.js | "setQuantity sets the trimmed text and does not change the input state", "setQuantity with an empty text clears the quantity" | DATA-19 | unit | |
| tests/store.test.js | "a saved item cannot be ticked" | DATA-6 | unit | |
| tests/store.test.js | "tripOutcome adds up to the items of Actual" | (02 Derived views) | unit | Rule owned by 03-lists |
| tests/onboarding.test.js | "shouldShow is true for no flag and no stored state", "shouldShow is false for a stored state", "shouldShow is false after the walkthrough was seen" | STORE-15 | unit | File owned by 07-screen |
| tests/recipes.test.js | "isWebUrl needs a host name with a dot and no space" | DATA-20 | unit | File owned by 06-recipes |
| tests/recipes.test.js | "deleteRecipe removes the recipe from sent" | DATA-10 | unit | File owned by 06-recipes |
| tests/recipes.test.js | "addRecipe rejects a duplicate name without case distinction", "addRecipeProduct rejects a duplicate without case distinction and an unknown recipe", "recipeGroups matches an item added by hand without case distinction", "sendRecipe matches an item without case distinction and creates no duplicate" | DATA-4, DATA-5, DATA-11 | unit | File owned by 06-recipes |
| tests/shops.test.js | "addItemShop takes the spelling of a shop in use", "shopNames gives each shop in use one time, in name order" | DATA-9, DATA-12 | unit | File owned by 05-shops |
| tests/aisles.test.js | "addAisle rejects a name that differs from an aisle only by case", "setItemAisle sets the aisle of an item in the spelling of the aisle" | DATA-14, DATA-15 | unit | File owned by 17-aisles |
| tests/spec.test.js | "the installed app turns with the device (INS-4)" | PROD-3 | none | Reads `manifest.webmanifest` |
| tests/spec.test.js | "the data model has the state version, the groups and the orders of the store", "the storage document has the keys of the storage and the name of the cache", "each key that Borrar todos los datos removes is a localStorage key of the storage document" | (doc checks) | none | Check `docs/spec/`, not behaviour |
| tests/vendor.test.js, tests/aliases.test.js | (file) | PROD-7 | none | Web build only |

No test: PROD-1, PROD-2, PROD-5, PROD-6, PROD-8, PROD-9, DATA-1, DATA-21 (except the dish limit), STORE-2, STORE-3, STORE-4, STORE-10, STORE-11, BACKUP-5, BACKUP-6. Partly tested: STORE-1 (load only), STORE-9 (the `false` result, not the message), STORE-17 (`grouped` at version 9 only), DATA-3 (`Cafe`/`Café`).

## Lists and arrange (LIST, TRIP, ADD, SORT, GROUP, MOVE)

| Test file | Test | Rules | Port | Note |
|---|---|---|---|---|
| tests/store.test.js | (file) | LIST, TRIP, ADD, SORT, GROUP, MOVE | unit | pure store; ports one to one |
| tests/store.test.js | "addItem adds a one-time item to active" | LIST-3, LIST-4 | unit | |
| tests/store.test.js | "addItem always creates a one-time item in active, with no again field" | LIST-3 | unit | |
| tests/store.test.js | "addItem trims the name and rejects an empty one" | LIST-1 | unit | |
| tests/store.test.js | "addItem rejects a duplicate in active or saved, without case distinction" | LIST-2 | unit | add an accent case after Q-lists-1 |
| tests/store.test.js | "addItem does not change the input state" | LIST-4 | unit | |
| tests/store.test.js | "renameItem renames and trims", "renameItem rejects an empty name and a duplicate of another item", "renameItem accepts a change of case of the same item" | LIST-5, LIST-2 | unit | |
| tests/store.test.js | "operations reject an unknown id" | LIST-5, LIST-7, LIST-8, LIST-10, ADD-3 | unit | |
| tests/store.test.js | "toggleRecurrent flips the flag and changes nothing else" | LIST-7 | unit | |
| tests/store.test.js | "toggleBought ticks an active item and keeps it in active", "toggleBought off unticks the item and changes nothing else" | LIST-10 | unit | |
| tests/store.test.js | "deleteItem removes the item", "a delete removes a saved item for good" | LIST-8 | unit | |
| tests/store.test.js | "activeItems lists active items, not bought first, in insertion order" | SORT-5, SORT-7, GROUP-10 | unit | |
| tests/store.test.js | "startNewShopping applies each rule", "… keeps the open items of keep in Actual", "… keeps the open items in keep and saves each other one-time item", "… ignores an id of keep that is not an open item", "… with keep does not change the input state", "… does not change the input state" | TRIP-2, TRIP-3 | unit | |
| tests/store.test.js | "startNewShopping rejects when nothing is ticked and nothing is open", "startNewShopping finishes with only open items" | TRIP-1 | unit | |
| tests/store.test.js | "openItems gives the one-time items of Actual that are not ticked", "openItems follows the order of Actual" | TRIP-6 | unit | |
| tests/store.test.js | "tripSummary …" (5 tests) | TRIP-9, LIST-33 | unit | |
| tests/store.test.js | "tripOutcome …" (3 tests) | TRIP-4 | unit | |
| tests/store.test.js | "startNewShopping empties the sent recipes and keeps the recipes", "an item operation keeps the recipes and the sent recipes" | TRIP-3 | unit | |
| tests/store.test.js | "searchItems …" (4 tests), "findByName finds the item with the same name, trimmed and without case distinction" | ADD-2 | unit | |
| tests/store.test.js | "bringToList …" (5 tests) | ADD-3, LIST-32 | unit | |
| tests/store.test.js | "arrivalMessage …" (3 tests) | (11-integrations ARR) | unit | not of this area |
| tests/store.test.js | "setSort sets a known sort and rejects another one" | SORT-4 | unit | |
| tests/store.test.js | "sortItems keeps the insertion order when the sort is added" | SORT-5 | unit | |
| tests/store.test.js | "sortItems gives the Spanish name order without case or accent distinction", "compareNames has no case and no accent distinction" | SORT-6 | unit | see Q-arrange-1 |
| tests/store.test.js | "activeItems sorts by name and keeps the bought items last" | SORT-7 | unit | |
| tests/store.test.js | "reorderItems …" (6 tests) | MOVE-8 | unit | |
| tests/store.test.js | "reorderItems from the name order …" (3 tests) | MOVE-9 | unit | |
| tests/store.test.js | "setGroup sets each known group and rejects another one" | GROUP-1 | unit | |
| tests/store.test.js | "matchesItem …" (4 tests) | LIST-22, LIST-29 | unit | |
| tests/store.test.js | "filterGroups …" (3 tests) | LIST-23, GROUP-8, GROUP-23 | unit | |
| tests/store.test.js | "addItem creates an item with no quantity", "setQuantity …" (4 tests) | LIST-4, LIST-27 | unit | |
| tests/store.test.js | "the end of a trip keeps the quantity" | LIST-28 | unit | |
| tests/store.test.js | "startNewShopping keeps a saved item as it is" | TRIP-2, LIST-28, LIST-30 | unit | |
| tests/store.test.js | "a saved item is in no list view and not in the trip figures" | LIST-30, LIST-33 | unit | |
| tests/store.test.js | "bringToList takes a saved item to active, not ticked" | LIST-32, ADD-3 | unit | |
| tests/store.test.js | "a saved item cannot be ticked" | LIST-10, LIST-32 | unit | |
| tests/store.test.js | "a saved item keeps its name: search finds it and an add of the name is a duplicate" | LIST-2, LIST-31 | unit | |
| tests/suggest.test.js | (file) | ADD-2, ADD-3, ADD-4 | unit | pure |
| tests/suggest.test.js | "empty or blank text gives no rows" | ADD-2 | unit | |
| tests/suggest.test.js | "no exact match: the first row is create", "no match at all: only create" | ADD-2, ADD-4 | unit | |
| tests/suggest.test.js | "an exact match (any case or accent) has no create row" | ADD-2 | unit | name says accent; checks case only (Q-lists-1) |
| tests/suggest.test.js | "inList is true only for an item to buy in the active list", "a saved item is not in the list" | ADD-3 | unit | |
| tests/suggest.test.js | "at most 6 rows, create included" | ADD-2 | unit | |
| tests/reorder.test.js | (file) | MOVE-6, MOVE-8 | unit | pure geometry |
| tests/reorder.test.js | "dropIndex …" (6 tests) | MOVE-6 | unit | |
| tests/reorder.test.js | "shifts …" (3 tests) | MOVE-6 | unit | |
| tests/reorder.test.js | "moveTo moves an id down, up and to the same place", "moveTo does not change its input" | MOVE-8 | unit | |
| tests/recipes.test.js | "recipeGroups …" (10 tests), "sharedItems …" (3 tests), "buyRecipe …" (5 tests) | GROUP-5, GROUP-6, GROUP-7, GROUP-8, GROUP-9, GROUP-20, GROUP-21, SORT-8 | unit | owned by 06-recipes; listed for cross-reference |
| tests/shops.test.js | "shopGroups …" (4 tests) | GROUP-11, GROUP-12, GROUP-13, GROUP-23, SORT-8 | unit | owned by 05-shops |
| tests/aisles.test.js | "aisleGroups …" (2 tests) | GROUP-17, GROUP-18, GROUP-23, SORT-8 | unit | owned by 17-aisles |
| tests/storage.test.js | "loadTripEnd …", "saveTripEnd …", "the trip end save survives …", "the trip end functions do not throw …", "the trip end is not part of the state" | TRIP-8 | instrumented | DataStore; the mapping logic can be a JVM unit test |
| tests/sections.test.js | "headerOf gives the ticked share in Compra only" | LIST-38 | unit | pure once `headerOf` takes the view as a parameter |
| tests/sections.test.js | "canSearch …" (2 tests), "emptyAction of a list search with no match adds the searched name", "emptyAction of a search that is only spaces is the empty list" | LIST-20, LIST-26 | unit | owned by 07-screen |
| tests/markup.test.js | "the trip button opens a sheet from the bottom, with a veil, and the header has no dropdown", "the finish banner is a done banner and the update notice a plain one" | TRIP-4 | instrumented | Compose UI test of the sheet and banner |
| tests/markup.test.js | "each of the eight sheets has the grab, then a head with its title and Listo, then a body" | ADD-8, SORT-2 | instrumented | |
| tests/markup.test.js | "the edit sheet has a veil, a dialog, the name and quantity fields and the shops" | LIST-6 | instrumented | max length of the name field |
| tests/layer-order.test.js | "closeTop gives the sheet first, then the row, then the search, then null" | LIST-21 | unit | owned by 07-screen |
| tests/sheets.test.js | "a value that differs only by the spaces at its ends is not a save" | LIST-5 | unit | owned by 07-screen |

No test: LIST-11, LIST-12, LIST-13, LIST-24, LIST-25, LIST-37, TRIP-5, TRIP-7, ADD-1, ADD-5, ADD-6, ADD-7, ADD-9, ADD-10, SORT-1, SORT-3, SORT-9, GROUP-2, GROUP-3, GROUP-4, GROUP-14, GROUP-15, GROUP-16, GROUP-19, GROUP-22, MOVE-1, MOVE-2, MOVE-3, MOVE-4, MOVE-5, MOVE-7, MOVE-10, MOVE-11, MOVE-12, MOVE-13.

## Shops, recipes, menu and aisles (SHOP, REC, MENU, AISLE)

| File | Test (or group) | Rules | Port kind | Note |
|---|---|---|---|---|
| tests/shops.test.js | (file, 30 tests) | SHOP-1..6, SHOP-11, SHOP-16..19, SHOP-22..24, SHOP-26, SHOP-29, SHOP-30, GROUP-11..14 | unit | Pure functions of `src/shops.js`; port one to one. |
| tests/shops.test.js | "addItemShop …" (5 tests: trimmed shop, order of add, empty name and unknown item, spelling of a shop in use, same state for a shop the item has) | SHOP-1, SHOP-2, SHOP-3, SHOP-4, SHOP-29 | unit | |
| tests/shops.test.js | "removeItemShop …" (2 tests) | SHOP-5, SHOP-29 | unit | |
| tests/shops.test.js | "shopNames gives each shop in use one time, in name order" | SHOP-1, SHOP-6 | unit | Expects `árbol, beta, Zeta`: needs the collator of Q-domain-1. |
| tests/shops.test.js | "shopGroups …", "a ticked item counts in the total and is not in the items or in the rest" (5 tests) | GROUP-11, GROUP-12, GROUP-13 | unit | Owned by 04-arrange. |
| tests/shops.test.js | "shopSuggestions …" (2 tests) | SHOP-11 | unit | The list only; the pick is UI. |
| tests/shops.test.js | "shopChips …" (3 tests) | SHOP-16, SHOP-17, SHOP-18 | unit | |
| tests/shops.test.js | "inShop takes each item for null, the items of a shop with no case distinction, and the items with no shop for an empty name" | SHOP-19 | unit | `null`/`''`/name encoding of the list; a Kotlin sealed type fits. |
| tests/shops.test.js | "shopState keeps only the items of the shop and returns the same state for null" | SHOP-19 | unit | Same-object identity: assert `===` (Kotlin `assertSame`). |
| tests/shops.test.js | "validShop keeps a shop of the view in its current spelling and gives null for a shop that went" | SHOP-22 | unit | |
| tests/shops.test.js | "nextShop …" (4 tests) | SHOP-23, SHOP-26, SHOP-30 | unit | |
| tests/shops.test.js | "withShop adds the shop to the item of the result and leaves Todas, Sin tienda and errors alone" | SHOP-24 | unit | |
| tests/shops.test.js | "previousShop …" (4 tests) | SHOP-26, SHOP-30 | unit | |
| tests/recipes.test.js | (file, 73 tests) | REC-1..2, REC-6, REC-8, REC-10, REC-14, REC-17..20, REC-24, REC-27, REC-28, REC-35, REC-39, GROUP-* | unit | Pure functions of `src/recipes.js`. |
| tests/recipes.test.js | "addRecipe …" (4 tests) | REC-1, REC-2 | unit | |
| tests/recipes.test.js | "renameRecipe …" (3 tests) | REC-2 | unit | |
| tests/recipes.test.js | "deleteRecipe …" (3 tests) | REC-6 | unit | |
| tests/recipes.test.js | "addRecipeProduct …" (4 tests) | REC-8 | unit | |
| tests/recipes.test.js | "removeRecipeProduct …" (2 tests) | REC-39 | unit | |
| tests/recipes.test.js | "sendRecipe …" (8 tests) | REC-17, REC-18, REC-19, REC-20 | unit | The counts only; the toast text is UI. |
| tests/recipes.test.js | "recipeGroups …" (11 tests) | GROUP-3..9 (04-arrange) | unit | Owned by 04-arrange. |
| tests/recipes.test.js | "buyRecipe …" (5 tests) | GROUP-21 (04-arrange) | unit | Owned by 04-arrange. |
| tests/recipes.test.js | "sharedItems …" (3 tests) | GROUP-* (04-arrange) | unit | Owned by 04-arrange. |
| tests/recipes.test.js | "productSuggestions …" (5 tests) | REC-10 | unit | Accent ranking needs the fold of Q-domain-2. |
| tests/recipes.test.js | "setRecipeUrl …" (5 tests), "isWebUrl needs a host name with a dot and no space" | REC-14 | unit | `isWebUrl` cases depend on the URL parser (Q-domain-4); keep all 17 cases. |
| tests/recipes.test.js | "searchRecipes …" (5 tests) | REC-24 | unit | |
| tests/recipes.test.js | "addSample …" (6 tests), "loadSample …" (3 tests), "hasSample …" (2 tests) | REC-27, REC-28 | unit | |
| tests/recipes.test.js | "inList …" (3 tests) | REC-35 | unit | |
| tests/menu.test.js | (file, 30 tests) | MENU-1..8, MENU-17, MENU-20, REC-24, REC-36 | unit | Pure functions of `src/menu.js`. |
| tests/menu.test.js | "the week has 7 days and 2 meals" | MENU-1 | unit | |
| tests/menu.test.js | "setMeal …" (6 tests) | MENU-2, MENU-3 | unit | |
| tests/menu.test.js | "setDish …" (2 tests) | MENU-3 | unit | |
| tests/menu.test.js | "clearMeal …", "clearMenu …", "mealCount counts the planned meals" (5 tests) | MENU-4 | unit | |
| tests/menu.test.js | "menuWeek gives each day with its two meals and their recipes", "a dish counts as a planned meal and shows in menuWeek" | MENU-2, MENU-20 | unit | |
| tests/menu.test.js | "fillMenu …" (7 tests), "a second fillMenu changes nothing and returns the same state" | MENU-5, MENU-6, MENU-7, MENU-8 | unit | |
| tests/menu.test.js | "dishRecipe …" (4 tests) | MENU-17 | unit | |
| tests/menu.test.js | "menuDishes …" (2 tests) | REC-36, REC-24 | unit | |
| tests/aisles.test.js | (file, 20 tests) | AISLE-1..8, GROUP-17, GROUP-18 | unit | Pure functions of `src/aisles.js`. |
| tests/aisles.test.js | "addAisle …" (3 tests) | AISLE-1, AISLE-2, AISLE-3 | unit | |
| tests/aisles.test.js | "renameAisle …" (4 tests) | AISLE-4 | unit | |
| tests/aisles.test.js | "deleteAisle …" (2 tests) | AISLE-5, AISLE-7 | unit | |
| tests/aisles.test.js | "moveAisle …" (3 tests) | AISLE-6, AISLE-7 | unit | |
| tests/aisles.test.js | "setItemAisle …" (4 tests) | AISLE-7 | unit | |
| tests/aisles.test.js | "addDefaultAisles …" (2 tests) | AISLE-8 | unit | |
| tests/aisles.test.js | "aisleGroups …" (2 tests) | GROUP-17, GROUP-18 | unit | Owned by 04-arrange. |

Tests of other files that this area cites as evidence: `tests/markup.test.js` (SHOP-8, SHOP-10, SHOP-26, SHOP-27, REC-33, MENU-11, MENU-12, MENU-16, MENU-19: markup only, port kind `none`, replace with Compose UI tests = `instrumented`), `tests/sections.test.js` (SHOP-26, REC-23, REC-25, MENU-14: `unit`), `tests/store.test.js` (AISLE-9: `unit`).

No test: SHOP-7, SHOP-9, SHOP-12, SHOP-13, SHOP-14, SHOP-15, SHOP-20, SHOP-21, SHOP-25, SHOP-28, REC-3, REC-4, REC-5, REC-7, REC-9, REC-11, REC-12, REC-13, REC-15, REC-16, REC-21, REC-22, REC-26, REC-29, REC-30, REC-31, REC-32, REC-34, REC-37, REC-38, MENU-9, MENU-10, MENU-13, MENU-15, MENU-18, MENU-21, AISLE-10, AISLE-11, AISLE-12, AISLE-13, AISLE-14, AISLE-15, AISLE-16, AISLE-17, AISLE-18, AISLE-19, AISLE-20.

## Screen and install (NAV, ROW, MSG, A11Y, ONB, INS)

| Test file | Test | Rules | Port kind | Note |
|---|---|---|---|---|
| tests/sections.test.js | "headerOf gives the ticked share in Compra only" | LIST header table (03-lists) | unit | needs a stub of the page on the web; on JVM a pure header function |
| tests/sections.test.js | "SECTIONS has the order of the bottom bar" | NAV-1 | unit | |
| tests/sections.test.js | "slideDirection is 1 for a slide to the left and -1 for a slide to the right" | NAV-3, ONB-4 | unit | |
| tests/sections.test.js | "slideDirection is 0 for a short slide" | NAV-3, ONB-4 | unit | 59 / 60 px edge |
| tests/sections.test.js | "slideDirection is 0 for a slide that is not horizontal" | NAV-3, ONB-4 | unit | 2:1 edge |
| tests/sections.test.js | "slideTo goes to the next section on a slide to the left", "slideTo goes to the previous section on a slide to the right", "slideTo stops at the first and at the last section", "slideTo ignores a short slide", "slideTo ignores a slide that is not horizontal", "slideTo ignores a view that is not a section", "slideTo skips the sections that are not in the given list" | NAV-3 | unit | |
| tests/sections.test.js | "direction is 1 towards a later section and -1 towards an earlier one", "direction is 0 for the same section and for a view that is not a section", "direction uses the given list of sections" | NAV-5 | unit | |
| tests/sections.test.js | "shortcutStart opens the add sheet of Compra for add", "shortcutStart opens the section of a section shortcut, with no sheet", "shortcutStart is null for an unknown name, for settings and for no name" | NAV-1, NAV-25 (SHORT, 11-integrations) | unit | |
| tests/sections.test.js | "SHORTCUTS has each shortcut of the manifest, in its order" | SHORT (11-integrations) | none | reads `manifest.webmanifest`; on Android compare with `shortcuts.xml` (instrumented or a resource check) |
| tests/sections.test.js | "emptyAction of …" (8 tests) | NAV-7 | unit | |
| tests/sections.test.js | "canSearch is true for …", "canSearch is false for …" | LIST-20, LIST-21 (03-lists) | unit | |
| tests/sections.test.js | "fabState collapses …", "fabState opens … on any scroll up", "fabState opens … at the top of the list", "fabState keeps the state on a short scroll down" | NAV-24 | unit | |
| tests/sections.test.js | "dockShown …" (3 tests) | SHOP-26 (05-shops), NAV-28 | unit | |
| tests/sections.test.js | "the section slide does not start on the dock" | NAV-4 | none | reads the source of `nav.js`; replace with a Compose UI test (instrumented) |
| tests/layers.test.js | all (8 tests) | ENG-16 (12-engineering) | none | module-graph and service-worker rules of the web code; does not test `src/layers.js` |
| tests/layer-order.test.js | "sheetOpen is false with nothing open", "sheetOpen is true for each sheet", "sheetOpen is false for an open row or a search" | NAV-8, NAV-4, NAV-28 | unit | |
| tests/layer-order.test.js | "closeTop gives the sheet first, then the row, then the search, then null", "closeTop does not change the screen state" | NAV-25 | unit | |
| tests/onboarding.test.js | "PAGES has the six pages in their order, each one time" | ONB-1 | unit | |
| tests/onboarding.test.js | "shouldShow is true for no flag and no stored state", "shouldShow is false for a stored state", "shouldShow is false after the walkthrough was seen" | ONB-6 | unit | |
| tests/onboarding.test.js | "step goes one page forward and one page back", "step stays on the page for no direction", "step does not go past the first and the last page" | ONB-4 | unit | |
| tests/onboarding.test.js | "isLast is true for the last page only", "hasBack is false on the first page and true on the others" | ONB-3 | unit | |
| tests/onboarding.test.js | "textParts …" (6 tests) | ONB-2 | unit | |
| tests/sheets.test.js | "a write that leaves the value as it was is not a save", "a write with an error is not a save, even when the value differs", "a value that differs only by the spaces at its ends is not a save", "a write that changes the value is a save", "a value that is gone after the write is not a save" | NAV-22, ROW-7 | unit | |
| tests/sheets.test.js | "Guardado shows for 1.2 s" | NAV-22 | unit | |
| tests/sheets.test.js | "an operation that returns a new state is a save", "an operation that returns the same state object is not a save", "an operation with an error is not a save" | NAV-22 | unit | relies on identity of the state object (ENG-3); keep the rule "no change returns the same instance" in Kotlin |
| tests/swipe.test.js | "settle …" (7 tests) | ROW-5 | unit | |
| tests/swipe.test.js | "reached needs 35 % of a wide row", "reached needs 80 px at least on a narrow row", "reached is false with no drag or a drag to the left" | ROW-11, ROW-12 | unit | |
| tests/install.test.js | "an app opened standalone starts installed, else idle" | INS-3 | none | dropped |
| tests/install.test.js | "the prompt of the browser makes the install available", "a dismissed prompt goes back to idle until the next prompt", "installed is final", "an unknown event changes nothing" | INS-1 | none | dropped |
| tests/install.test.js | "the Install button shows only while the install is available" | INS-2 | none | dropped |
| tests/markup.test.js | "the header has a progress bar and no ring" | LIST header (03-lists) | instrumented | Compose UI test: a progress indicator with the subtitle as its label |
| tests/markup.test.js | "the page has translated text and translated attributes", "each key of the page is in the Spanish catalog", "an element with a text key is empty in the markup", "the markup has no text of its own" | LANG (09-languages) | none | DOM rules; on Android lint `HardcodedText` and a resource check replace them |
| tests/markup.test.js | "the walkthrough has one drawing for each page, in the order of the pages" | ONB-1 | instrumented | |
| tests/markup.test.js | "the walkthrough puts the app icon first inside the page group, with no text" | ONB-2 | instrumented | |
| tests/markup.test.js | "the walkthrough order is: top bar with Atrás and Saltar, the page, the dots, the next button" | ONB-3 | instrumented | |
| tests/markup.test.js | "the walkthrough title can take the focus, so no button shows a ring on load" | ONB-11 | instrumented | assert initial focus on the title |
| tests/markup.test.js | "the trip button opens a sheet from the bottom, with a veil, and the header has no dropdown" | NAV-9 | instrumented | |
| tests/markup.test.js | "each of the eight sheets has the grab, then a head with its title and Listo, then a body" | NAV-8, NAV-22 | instrumented | |
| tests/markup.test.js | "the edit and recipe sheets have a foot with Eliminar and Guardado; the other sheets have none" | NAV-22 | instrumented | |
| tests/markup.test.js | "the sheets with a title of their own give it an id; the others a fixed text" | NAV-22 | instrumented | |
| tests/markup.test.js | "the empty state of a list holds a title, a text and an action button, set by the view" | NAV-7 | instrumented | |
| tests/markup.test.js | "the edit sheet has a veil, a dialog, the name and quantity fields and the shops" | ROW-7, LIST-27 | instrumented | max lengths 80 / 20 / 40 can also be unit-tested on the filter |
| tests/markup.test.js | "the meal sheet has a recipe search between the title and the chips, a no-match text and the dish buttons" | MENU (13-menu) | instrumented | |
| tests/markup.test.js | "Llenar cesta and Vaciar menú stand together in the action bar of Menú", "the es text of menu.fill is Llenar cesta" | MENU (13-menu) | instrumented / unit | the catalog check is a unit test on `strings.xml` |
| tests/markup.test.js | "each group of Ajustes is a list-group-head and one full-width list-group" | NAV-6 | instrumented | six groups on the web, five on Android (no **Aplicación**) |
| tests/markup.test.js | "language, hand, theme and density are rows of the group Preferencias" | NAV-6, NAV-11, NAV-15, NAV-19 | instrumented | |
| tests/markup.test.js | "Borrar la receta de ejemplo is a danger row with no chevron" | NAV-6, ONB-14 | instrumented | |
| tests/markup.test.js | "the rows that open something end with a chevron" | NAV-6, INS-2 | instrumented | drop `install` from the list |
| tests/markup.test.js | "the finish banner is a done banner and the update notice a plain one" | NAV-27, TRIP (03-lists) | none / instrumented | update notice dropped; the finish banner part stays |
| tests/markup.test.js | "the update notice is a banner with a wide primary button above the version line" | NAV-27 | none | dropped |
| tests/markup.test.js | "the dock stands before the add button with the shop arrows, the shop chip and the search", "the dock ends with the add button", "the shop chip of the dock opens the shop picker, a sheet with a head" | SHOP-26, SHOP-27 (05-shops), NAV-24 | instrumented | |
| tests/markup.test.js | "each nav item shows its name" | NAV-1 | instrumented | |
| tests/markup.test.js | "an outline button is only a destructive one; other secondary actions are tonal" | DSV (15-design-system) | instrumented | |
| tests/storage.test.js | hand, theme, density, onboarded, hasStoredState, swipe hint groups (cited in the area docs) | NAV-11, NAV-12, NAV-15, NAV-17, NAV-19, NAV-21, ONB-6, ONB-7, ONB-8, ROW-14 | instrumented | DataStore; owned by the storage area, listed for cross-reference |
| tests/spec.test.js | "the installed app turns with the device (INS-4)" | INS-4 | instrumented | check that the activity has no orientation lock (manifest merge check) |

No test: NAV-2, NAV-26, NAV-28, ROW-1, ROW-3, ROW-4, ROW-6, ROW-7 (behaviour), ROW-8, ROW-9, ROW-10, ROW-12, ROW-14 (motion), MSG-1, MSG-2, MSG-3, MSG-4, MSG-5, MSG-6, MSG-7, MSG-8, MSG-9, NAV-10, NAV-13, NAV-14, NAV-16, NAV-20, NAV-23, ONB-5, ONB-9, ONB-10, ONB-11 (except the title focus), ONB-12, ONB-13 (screen part), ONB-14, A11Y-1, A11Y-2, A11Y-3, A11Y-4, A11Y-5, A11Y-6, A11Y-7, A11Y-8.

## Languages, offline and version, integrations (LANG, SW, VER, ARR, SHORT, VOICE)

| Test file | Test | Rules | Port kind | Note |
|---|---|---|---|---|
| tests/i18n.test.js | "a stored language that is supported wins", "a stored language that is not supported is ignored" | LANG-2, LANG-4 | unit | `resolveLanguage` ports as is |
| tests/i18n.test.js | "the first supported base of the preferred languages wins", "no supported preferred language gives the fallback", "one preferred language that is text, not a list, resolves too", "a regional language resolves to its base" | LANG-2 | unit | |
| tests/i18n.test.js | "the languages are the seven of the design", "each language has a catalog and a name" | LANG-1, LANG-3 | unit | becomes a check of `locales_config.xml` and the Idioma list |
| tests/i18n.test.js | "t replaces each placeholder with its parameter", "t puts user text in as typed" | LANG-9 | unit | over `String.format`; a missing argument throws on Android |
| tests/i18n.test.js | "t selects the plural form by the count", "a plural category with no form, or no count, uses the other form" | LANG-10, LANG-19 | instrumented | `getQuantityString` needs Android resources (Robolectric works) |
| tests/i18n.test.js | "a missing key shows the fallback text, then the key" | LANG-11 | instrumented | first half only; the second half has no case (compile-time ids) |
| tests/i18n.test.js | "each catalog has the keys of the Spanish catalog", "each entry has the kind and the placeholders of the Spanish entry", "a plural entry has the forms one and other, and no entry is empty" | LANG-7, LANG-8 | unit | parse `values*/strings.xml` on the JVM |
| tests/i18n.test.js | "the Spanish catalog has each message key of the pure modules" | LANG-13 | unit | compile-time with resource ids; keep if keys stay text |
| tests/i18n.test.js | "Portuguese uses the European plural rule: zero is plural", "intlTag gives the regional tag of Portuguese and the code of each other language" | LANG-10 | instrumented | needs `pt-PT` locale resources (Robolectric) |
| tests/i18n.test.js | "pseudo accents the vowels, wraps in brackets and pads to 1.4 times the length", "pseudo keeps each placeholder intact", "the pseudo translator applies pseudo over es, to each plural form, and fills the parameters", "pseudo is not a language and no navigator language or stored value selects it" | LANG-18 | none | only if Q-platform-3 keeps a custom pseudo function (then unit) |
| tests/version.test.js | "parseVersion keeps the version and the date", "parseVersion rejects a version that is not major.minor.patch", "parseVersion rejects a date that is not valid", "parseVersion rejects data that is not an object" | VER-3 | unit | only if Q-platform-4 keeps a version file |
| tests/version.test.js | "compareVersions compares each part as a number" | VER-7 | unit | |
| tests/version.test.js | "versionStatus is current when the deployed version is the running version", "versionStatus is outdated when the deployed version is newer", "versionStatus is current when the running version is newer than the deployed version", "versionStatus is unknown when one side is missing" | VER-6 | unit | |
| tests/version.test.js | "nextVersion adds one to the patch by default and takes the date of the bump", "nextVersion sets the lower parts to zero for a minor and a major bump", "nextVersion starts at 1.0.0 when there is no version" | VER-2 | none | release tooling stays in Node |
| tests/sw.test.js | "localizeManifest takes the language, the name and the description of the text", "localizeManifest keeps the short name and the other members", "localizeManifest with no text returns the manifest as it is", "localizeManifest ignores a member of the text that is not a non-empty string", "localizeManifest does not change its input" | SW-13 | none | web manifest only |
| tests/sw.test.js | "localizeManifest takes the name of each shortcut from the text, by its open parameter", "localizeManifest keeps the name of a shortcut that the text has not as a non-empty string", "localizeManifest ignores shortcuts of the text that are not an object", "localizeManifest does not change the shortcuts of its input" | SW-13, SHORT-3 | none | replaced by string resources of `shortcuts.xml` |
| tests/sw.test.js | "the activate keeps the caches of another app" | SW-4 | none | |
| tests/release.test.js | "release bumps the patch, commits the bump and tags it", "release takes a minor or a major step" | VER-1, VER-10, VER-11, VER-17 | none | release tooling; keep in Node if the script stays |
| tests/release.test.js | "release refuses an unknown level and changes nothing", "release refuses a branch that is not main", "release refuses a working tree with changes", "release refuses a version whose tag exists", "release refuses a main that is behind origin and writes nothing", "release accepts a main that is ahead of origin", "release refuses an origin that it cannot fetch and writes nothing" | VER-12 | none | release tooling |
| tests/changelog.test.js | "releaseChangelog gives the version and the date to the changes of Unreleased", "releaseChangelog keeps a changelog whose Unreleased has no change", "releaseChangelog keeps a changelog with no Unreleased heading", "releaseChangelog releases an Unreleased that is the last section", "releaseChangelog does not take a subheading or a longer heading for Unreleased", "localDate gives the day of the date in the local time zone" | VER-17 | none | release tooling |
| tests/storage.test.js | "loadLanguage returns the stored language when it is supported", "loadLanguage returns null for no value and for an unsupported value", "saveLanguage stores a language and null removes it", "the language functions do not throw when the storage does", "the language is not part of the state" | LANG-4, LANG-5 | instrumented | per-app locale API; owner of storage tests may list them too |
| tests/storage.test.js | "exportFilename names the file with the local date and time", "exportFilename gives two exports of one day different names" | LANG-17 | unit | |
| tests/store.test.js | "compareNames has no case and no accent distinction", "sortItems gives the Spanish name order without case or accent distinction" | LANG-15 | unit | `Collator` `es`, `PRIMARY` |
| tests/store.test.js | "arrivalMessage counts the items of Active that are not bought", "arrivalMessage uses the singular for one item", "arrivalMessage is null when no item of Active is left" | ARR-1, ARR-3 | unit | |
| tests/sections.test.js | "shortcutStart opens the add sheet of Compra for add", "shortcutStart opens the section of a section shortcut, with no sheet", "shortcutStart is null for an unknown name, for settings and for no name" | SHORT-2 | unit | |
| tests/sections.test.js | "SHORTCUTS has each shortcut of the manifest, in its order" | SHORT-1 | unit | against `res/xml/shortcuts.xml` |
| tests/markup.test.js | "the markup has no text of its own", "each key of the page is in the Spanish catalog", "an element with a text key is empty in the markup" | LANG-12 | none | replaced by lint `HardcodedText` / a literal check |
| tests/markup.test.js | "the update notice is a banner with a wide primary button above the version line" | VER-18 | instrumented | Compose UI test |
| tests/layers.test.js | "SHELL of sw.js has each module of src", "SHELL of sw.js has the style sheet and the icons" | SW-2 | none | |
| tests/vendor.test.js | "SHELL of sw.js has each vendored stylesheet", "SHELL of sw.js has each vendored file that the page loads", "SHELL caches the font of the design system" | SW-2 | none | |
| tests/spec.test.js | "the manifest id is the path of the deploy, unique on a shared origin (VER-14)", "the installed app turns with the device (INS-4)" | VER-14 | none | web manifest |

No test: LANG-3 (the Idioma list and the live change), LANG-6, LANG-13 (the `list` replacement), LANG-14, LANG-16, SW-1, SW-3, SW-5, SW-6, SW-7, SW-8, SW-9, SW-10, SW-11, SW-12, VER-4, VER-5, VER-8, VER-9, VER-13, VER-15, VER-16, ARR-2, ARR-4, ARR-5, ARR-6, SHORT-2 (walkthrough case), SHORT-4, SHORT-5, VOICE-1 … VOICE-8 (tests exist only on the branch `voice-commands`).

## Engineering, modules and design system (ENG, MOD, DSV)


| Test file | Test | Rules | Port kind | Note |
|---|---|---|---|---|
| tests/aliases.test.js | (file: 5 tests) | ENG-7 | none | import map and `#` aliases are web only |
| tests/aliases.test.js | "the import map of the page gives each module of src its alias" | ENG-7 | none | |
| tests/aliases.test.js | "each #ds/ alias of the page names a vendored module of the design system" | ENG-7, DSV-1 | none | |
| tests/aliases.test.js | "the import map comes before the module script of the page" | ENG-7 | none | |
| tests/aliases.test.js | "Node resolves an alias to the same file as the page" | ENG-7 | none | |
| tests/aliases.test.js | "no module of src imports another one by a relative path" | ENG-7 | none | |
| tests/layers.test.js | (file: 8 tests) | ENG-6, ENG-16 | unit | becomes a Konsist/ArchUnit test, or the Gradle graph |
| tests/layers.test.js | "the views exist" | ENG-16 | none | |
| tests/layers.test.js | "no module imports app" | ENG-6, ENG-16 | unit | no class depends on the app entry |
| tests/layers.test.js | "a pure module imports no view" | ENG-16 | unit | `:core` has no UI or Android import |
| tests/layers.test.js | "the imports among the views have no cycle" | ENG-16 | unit | package cycle check |
| tests/layers.test.js | "only the owner assigns a shared value" | ENG-16 | unit | `MutableStateFlow` private to the ViewModel |
| tests/layers.test.js | "SHELL of sw.js has each module of src" | (SW) | none | service worker only |
| tests/layers.test.js | "SHELL of sw.js has the style sheet and the icons" | (SW) | none | |
| tests/layers.test.js | "SHELL of sw.js has every path of the import map" | ENG-7 | none | |
| tests/layer-order.test.js | (file: 5 tests) | NAV-25 | unit | pure `sheetOpen`/`closeTop`; owned by area `07-screen` |
| tests/spec.test.js | "the specification has rules", "each rule identifier is defined one time", "each prefix of a rule is in the prefix table of the index, and each prefix of the table has a rule", "each rule that a text names is defined" | ENG-12 | unit | reads Markdown; ports as a JVM test of the spec |
| tests/spec.test.js | "each link to a document of the specification has its file", "the index lists each document" | ENG-12 | unit | |
| tests/spec.test.js | "the data model has the state version, the groups and the orders of the store" | ENG-12 | unit | against Kotlin constants |
| tests/spec.test.js | "the storage document has the keys of the storage and the name of the cache" | ENG-12 | unit | cache and manifest names dropped |
| tests/spec.test.js | "DSV-1 names each file of vendor/design-system/ (SOURCE.json)" | DSV-1, ENG-12 | none | vendor copy dropped |
| tests/spec.test.js | "each key that Borrar todos los datos removes is a localStorage key of the storage document" | ENG-12 | unit | DataStore keys |
| tests/spec.test.js | "the language document has each language and the fallback" | ENG-12 | unit | |
| tests/spec.test.js | "each message key that the specification names is in the Spanish catalog" | ENG-12 | unit | against `values-es/strings.xml` |
| tests/spec.test.js | "the module table has each module of src", "a module imports only the modules that the module table gives it" | ENG-12, ENG-16 | none | replaced by the dependency check of ENG-16 |
| tests/spec.test.js | "the test table has each test file" | ENG-12 | unit | if the port keeps a test table |
| tests/spec.test.js | "the manifest id is the path of the deploy, unique on a shared origin (VER-14)", "the installed app turns with the device (INS-4)" | ENG-12 | none | web manifest; owned by other areas |
| tests/design.test.js | "the rules read the shared stylesheet and styles.css", "the design system has rules to run" | DSV-8 | none | CSS only |
| tests/design.test.js | each rule of `rules.js` (DS-1 to DS-8, LAY-2 to LAY-4, TAP-1, TAP-2, TXT-1, FOCUS-1, SHEET-1, STATE-1, HAND-1, DS-6 catalogue) | DSV-3, DSV-8, DSV-14, DSV-16 | none | CSS/markup lint; on the target a Compose screenshot test may replace the visual parts |
| tests/design.test.js | "the parts of the app are documented in styles.css (DSV-3)" | DSV-3 | none | |
| tests/design.test.js | "the design test reads the classes of the item rows, states included" | DSV-21 | none | |
| tests/design.test.js | "a recipe row has one send button in the end slot and no mark" | DSV-23 | instrumented | Compose UI test of a recipe row |
| tests/design.test.js | "styles.css leaves the rail to the design system (LAY-2)" | DSV-5, DSV-8 | none | |
| tests/vendor.test.js | (file: 13 tests) | DSV-1, DSV-2, DSV-3, DSV-4 | none | vendor copy, hashes, link order, SHELL, `@extends` blocks: all web only |
| tests/markup.test.js | (file: 27 tests) | (I18N, NAV, ONB, SHOP, MENU…) | instrumented | `index.html` structure; owned by the screen areas; a Compose UI test replaces each structural check |
| tests/png.test.js | "decodePng gives back the pixels that encodePng wrote", "decodePng reads the filters of a PNG from another encoder", "decodePng rejects data that is not a PNG", "decodePng rejects a format other than 8-bit RGBA without interlace" | DSV-20 | none | build tool of the web repo |
| tests/png.test.js | "clearWhite makes the white that touches the edge transparent and keeps a white inside the art", "clearWhite turns an edge blended with the white into the colour at part alpha", "resizeRgba averages with the alpha, so a transparent pixel gives no colour" | DSV-19, DSV-20 | none | only if the port generates the logo itself |
| tests/glyph.test.js | (file: 6 tests) | DSV-18, DSV-20 | none | shortcut glyph rasteriser; vector drawables replace it |

No test: ENG-4, ENG-9, ENG-10, ENG-11, ENG-13, ENG-14, ENG-15, ENG-17, DSV-6, DSV-7, DSV-9, DSV-10, DSV-11, DSV-12, DSV-13, DSV-15, DSV-17, DSV-21, DSV-22, DSV-23, DSV-24. (MOD-1 to MOD-9 removed, DSV-5 removed.)
