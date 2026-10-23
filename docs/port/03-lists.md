# Lists

Items, the list `Compra`, the trip cycle (**Terminar compra**), the search of `Compra` and the add
sheet. Source modules: `src/store.js`, `src/suggest.js`, `src/ui/list.js`, `src/ui/add.js`,
`src/ui/view.js`, the rows in `src/ui/rows.js`, the trip-end preference in `src/storage.js` and
`src/ui/settings.js`. Recipes in the add sheet are in `06-recipes.md`; the shop lists and the dock in
`05-shops.md`.

Matching conventions used below (all `core`):
- **lower** = `String.toLowerCase()` with no locale: case only, accents stay. Port: `lowercase(Locale.ROOT)`.
- **fold** = trim, lower, Unicode NFD, then remove every `\p{Diacritic}` code point (`src/store.js:135-140`).
  Port: `Normalizer.normalize(s.trim().lowercase(Locale.ROOT), NFD)` and remove `\p{Mn}` plus the other
  Diacritic code points (see Q-lists-1).

## Items

**LIST-1** [core] [verified] A new item name is trimmed. An empty name (after the trim) is rejected with `error.nameRequired` (`Escribe un nombre.`), and the state does not change.
- Evidence: `src/store.js:23-24,31-34`; test: `tests/store.test.js` "addItem trims the name and rejects an empty one".

**LIST-2** [core] [verified] A name whose **lower** form equals the **lower** name of another item, in `Compra` or saved, is rejected with `error.duplicateItem` and the parameters `name` (the stored spelling of that item) and `list` (`active` or `saved`). The text is `"{name}" ya está en {list}.`, where `list` reads `Compra` or `artículos guardados`. Accents count: `Jamon` is not a duplicate of `Jamón`.
- Evidence: `src/store.js:23-28`, `src/ui/context.js:89-92`, `src/locales/es.js:2-3,247`; tests: `tests/store.test.js` "addItem rejects a duplicate in active or saved, without case distinction", "renameItem rejects an empty name and a duplicate of another item", "a saved item keeps its name: search finds it and an add of the name is a duplicate".
- Note: the accent rule differs from the add-sheet matching (ADD-2), see Q-lists-1.

**LIST-3** [core] [verified] A new item is one-time (`recurrent: false`), in `Compra` (`list: 'active'`), not ticked. The add has no target choice and no `again` field.
- Evidence: `src/store.js:30-36`; test: `tests/store.test.js` "addItem always creates a one-time item in active, with no again field".

**LIST-4** [core] [verified] A new item goes to the end of `items` with a new UUID `id`, `shops: []`, `quantity: ''` and `aisle: ''`. The input state does not change.
- Evidence: `src/store.js:35-36`; tests: `tests/store.test.js` "addItem adds a one-time item to active", "addItem does not change the input state", "addItem creates an item with no quantity".
- Port: `UUID.randomUUID().toString()`; inject the id source for tests.

**LIST-5** [core] [verified] A rename has the rules LIST-1 and LIST-2, except that the item itself is not a duplicate: a change of case of its own name is accepted. An unknown id gives `error.itemNotFound`. The name field of the edit sheet writes only when its trimmed text differs from the stored name, so a rename to the same text changes nothing.
- Evidence: `src/store.js:39-44`, `src/ui/controls.js:56-66`, `src/ui/edit.js:111`; tests: `tests/store.test.js` "renameItem renames and trims", "renameItem accepts a change of case of the same item", "operations reject an unknown id"; `tests/sheets.test.js` "a value that differs only by the spaces at its ends is not a save".

**LIST-6** [adapted] [verified] The name fields of the screen (add sheet, edit sheet, list search) take 80 characters at most. The store has no length limit.
- Evidence: `index.html:48,155,192,279`; test: `tests/markup.test.js` "the edit sheet has a veil, a dialog, the name and quantity fields and the shops" (edit field only).
- Target: `TextField` with an input filter that keeps the first 80 characters (`take(80)` on change). Count UTF-16 code units, as HTML `maxlength` does.

**LIST-7** [core] [verified] `toggleRecurrent` flips `recurrent` and changes nothing else; an unknown id gives `error.itemNotFound`. A recurrent item of `Compra` shows `↻ cada compra` (`row.repeats`) in its meta line. The side action **Repetir** (`row.repeat`) reads **No repetir** (`row.noRepeat`) on a recurrent item. The switch **Repetir en cada compra** of the edit sheet flips it too and shows `Guardado`. The flip has no message and no `Deshacer`.
- Evidence: `src/store.js:54-58`, `src/ui/rows.js:20,28-29`, `src/ui/edit.js:108`; tests: `tests/store.test.js` "toggleRecurrent flips the flag and changes nothing else", "operations reject an unknown id".

**LIST-8** [core] [verified] A delete removes the item, its shops and its quantity with it; an unknown id gives `error.itemNotFound`. The side action **Eliminar** and the edit sheet show `"{name}" eliminado.` (`toast.deleted`) with `Deshacer`.
- Evidence: `src/store.js:67-70`, `src/ui/rows.js:32-41`, `src/ui/edit.js:86-90`; tests: `tests/store.test.js` "deleteItem removes the item", "a delete removes a saved item for good".

**LIST-9** [dropped] [removed] `Compra` is the only list; an item has no other list to move to.

## Quantity

**LIST-27** [core] [verified] `setQuantity` stores the trimmed text. An empty text clears it (`''`). The same trimmed text returns the same state object (no change). An unknown id gives `error.itemNotFound`.
- Evidence: `src/store.js:47-52`; tests: `tests/store.test.js` "setQuantity sets the trimmed text and does not change the input state", "setQuantity with the same text returns the same state object", "setQuantity with an empty text clears the quantity", "setQuantity rejects an unknown item with the same state".

**LIST-28** [core] [verified] A tick, **Terminar compra** and a bring back keep the quantity. A delete removes it with the item.
- Evidence: `src/store.js:60-65,87-98,184-190`; tests: `tests/store.test.js` "the end of a trip keeps the quantity", "startNewShopping keeps a saved item as it is".

**LIST-29** [core] [verified] The search of a list does not match the quantity (LIST-22).
- Evidence: `src/store.js:144-147`; tests: `tests/store.test.js` "matchesItem matches a part of the name with no case and no accent distinction" (the matched fields are name, shops, aisle only).

## Tick

**LIST-10** [core] [verified] Only an item of `Compra` can be ticked. A saved item gives `error.onlyActiveTick` with `list: 'active'` (`Solo se pueden marcar los artículos de Compra.`). An unknown id gives `error.itemNotFound`. A tick changes only `bought`.
- Evidence: `src/store.js:60-65`; tests: `tests/store.test.js` "toggleBought ticks an active item and keeps it in active", "toggleBought off unticks the item and changes nothing else", "a saved item cannot be ticked".

**LIST-11** [adapted] [untested] A tap on the body of a row of `Compra`, or a slide to the right past the run threshold (ROW-11), flips `bought`. The end slot (edit button) does not tick. A tap on a row whose side menu is open only closes the menu. A ticked row in `Comprados (N)` unticks the same way; its slide backdrop shows the icon `undo`, an open row shows `check`.
- Evidence: `src/ui/rows.js:59-81,187-195`; test: untested.
- Target: `Modifier.clickable` on the row body; the slide is a `SwipeToDismissBox`-style anchored drag (see `07-screen.md`).

**LIST-12** [adapted] [untested] A tick does not delete the item. The ticked items show, one row each, in the section `Comprados (N)` (`count.bought`) after all rows to buy. The section is closed at each start of the app. A tap on its head opens and closes it; the head ends with `chevron-right` while closed and `chevron-down` while open. The open state is not stored.
- Evidence: `src/ui/rows.js:245-261`, `src/ui/list.js:84-87`, `src/ui/context.js:147`; test: untested.
- Target: a `LazyColumn` section with an expandable header; open state in a `rememberSaveable` or view-model field, not in DataStore.

**LIST-13** [adapted] [untested] A tick of a row to buy first closes the rows of the item (all its rows, one per group) in 200 ms, then writes the tick and shows `"{name}" comprado.` (`toast.bought`) with `Deshacer` for 5000 ms. An untick writes at once, with no message, and hides an open message. A second tap on a row that is closing does nothing.
- Evidence: `src/ui/rows.js:60-67`, `src/ui/motion.js:64-79`, `src/ui/context.js:25,42,214-224`; test: untested.
- Target: `AnimatedVisibility`/`animateItem` exit of 200 ms, then the state write; snackbar with action, duration 5 s.

**LIST-14** [dropped] [removed] A ticked one-time item has no mark that keeps it for the next trip; `↻` and `Aplazar` do that.

## Removed: the second list

`Próxima` does not exist in the code: `list` is only `active` or `saved`.

**LIST-15** [dropped] [removed] The app has one list, `Compra`.

**LIST-16** [dropped] [removed] The app has one list, `Compra`.

**LIST-17** [dropped] [removed] The app has one list, `Compra`.

**LIST-18** [dropped] [removed] The app has one list, `Compra`.

**LIST-19** [dropped] [removed] The bottom bar shows no count.

## Trip

**TRIP-1** [core] [verified] **Terminar compra** is possible when an item of `Compra` is ticked or open (TRIP-6). If not, `startNewShopping` gives `error.nothingToStart` (`Nada que terminar: marca un artículo o añade uno.`) and the state does not change. An empty state also gives the error.
- Evidence: `src/store.js:77-78,88`; tests: `tests/store.test.js` "startNewShopping rejects when nothing is ticked and nothing is open", "startNewShopping finishes with only open items".

**TRIP-2** [core] [verified] `startNewShopping(state, keep)` maps each item. Every item that stays in `Compra` gets `bought: false`.

  | Item | Result |
  |---|---|
  | Saved | Same object, no change |
  | `Compra`, recurrent (ticked or not) | `Compra`, not ticked |
  | `Compra`, one-time, open, id in `keep` | `Compra`, not ticked (`Aplazar`) |
  | `Compra`, one-time, any other (ticked, or open and not in `keep`) | `list: 'saved'`, not ticked |

  An id of `keep` that is not an open item is ignored. `recurrent`, `shops`, `quantity`, `aisle`, `name` and `id` do not change. The input state does not change.
- Evidence: `src/store.js:80-98`; tests: `tests/store.test.js` "startNewShopping applies each rule", "startNewShopping keeps the open items of keep in Actual", "startNewShopping keeps the open items in keep and saves each other one-time item", "startNewShopping ignores an id of keep that is not an open item", "startNewShopping with keep does not change the input state", "startNewShopping does not change the input state", "startNewShopping keeps a saved item as it is".

**TRIP-3** [core] [verified] **Terminar compra** empties `sent` and keeps `recipes`. `group`, `sort`, `menu` and `aisles` do not change. The order of `items` does not change.
- Evidence: `src/store.js:92-97`; tests: `tests/store.test.js` "startNewShopping empties the sent recipes and keeps the recipes", "startNewShopping applies each rule" (order of names).

**TRIP-4** [adapted] [verified] The control shows in two places:
  1. The banner `¿Has terminado?` (`finish.question`) in `Compra`. It shows only when the view is **Todas** (no shop list, SHOP-21), `Compra` has an item, and every item of `Compra` is ticked. Its text is the outcome parts below, joined by ` · `. Its button **Terminar compra** (`finish.button`) is a tonal button across the width.
  2. The trip sheet, opened by the header button `Opciones de la compra` (`trip.menu`). The button shows in `Compra` at all times, also with an empty list, and never in another section. The sheet title is `¿Terminar la compra?` (`trip.question`). It lists one row per outcome, in this order, with an icon and the count; a row with a count of 0 does not show:
     | Outcome | Icon | Text key (es, `other`) |
     |---|---|---|
     | `recurrent`: items of `Compra` with `recurrent` | `repeat` | `outcome.recurrent` `{count} con ↻ vuelven` |
     | `kept`: open items kept with `Aplazar` | `cart` | `outcome.kept` `{count} sin comprar se aplazan` |
     | `open`: open items saved with `Descartar` | `download` | `outcome.open` `{count} sin comprar se guardan` |
     | `bought`: ticked one-time items | `check` | `outcome.bought` `{count} comprados salen de la lista` |

     Below the rows: the primary button **Terminar compra**, disabled when TRIP-1 does not hold, and the tonal button **Seguir comprando** (`trip.continue`), which closes the sheet. The banner and the sheet count on the full state, also in a shop list.
- Evidence: `src/ui/list.js:89-97,225,231-242`, `src/store.js:210-219`, `index.html:68-71,241-252`, `src/locales/es.js:75-86`; tests: `tests/store.test.js` "tripOutcome counts each item of Actual by where it goes", "tripOutcome adds up to the items of Actual", "tripOutcome of an empty state is all zero"; `tests/markup.test.js` "the trip button opens a sheet from the bottom, with a veil, and the header has no dropdown", "the finish banner is a done banner and the update notice a plain one".
- Target: `ModalBottomSheet` for the trip sheet; plurals in `plurals.xml`. The four counts are a pure function (`tripOutcome`) and port as `core`.

**TRIP-5** [adapted] [untested] After **Terminar compra** the screen shows `Compra`, closes the trip sheet and any open side menu, and shows `Compra terminada.` (`toast.finished`) with `Deshacer` for 5000 ms. `Deshacer` restores the full state of before. The shop list in view stays when its chip still exists (SHOP-22).
- Evidence: `src/ui/list.js:18-22`, `src/ui/context.js:214-224`, `src/app.js:87`; test: untested.

**TRIP-6** [core] [verified] An open item is an item of `Compra`, not ticked and not recurrent. `openItems` lists them in the order of `sort` (SORT-4). With the choice `Aplazar` the sheet button passes every open item as `keep`; with `Descartar` it passes none. The banner button always passes none; the banner never shows with an open item (TRIP-4). The button of the sheet finishes at once, with no confirmation and no choice per item. While an open item exists, the line `Puedes cambiar qué pasa con lo no comprado en` (`trip.hint`) plus the accent button **Ajustes** shows above the button; **Ajustes** closes the sheet and shows `Ajustes`. A tap on the veil, **Listo**, `Escape` or the back of the phone closes the sheet and changes nothing.
- Evidence: `src/store.js:72-75`, `src/ui/list.js:24-25,241,355-359,419-426`, `src/app.js:184-193,266-279`; tests: `tests/store.test.js` "openItems gives the one-time items of Actual that are not ticked", "openItems follows the order of Actual".

**TRIP-7** [adapted] [untested] **Ajustes → Al terminar la compra** (`settings.tripEnd`) has the hint `settings.tripEndHint` and two segmented buttons side by side, **Descartar** (`trip.discard`, value `save`) then **Aplazar** (`trip.postpone`, value `keep`). The chosen one is pressed. The choice applies to every open item at **Terminar compra**, and the trip sheet counts with it (`kept` vs `open`). An app with no choice uses `Aplazar`.
- Evidence: `index.html:109-115`, `src/ui/settings.js:148-149,193-196`, `src/ui/context.js:82,264-267`, `src/app.js:88-90`; test: untested.
- Target: `SingleChoiceSegmentedButtonRow`.

**TRIP-8** [adapted] [verified] The choice is stored under `shopping.tripEnd`: `save` for **Descartar**. **Aplazar**, and any other value passed to the save, removes the key. A stored value other than `save` (such as an old `keep`) reads as **Aplazar**. A storage that throws reads as **Aplazar** and the save reports failure. It is a preference of the device, not a part of the state: `Deshacer`, an import and the backup do not touch it.
- Evidence: `src/storage.js:291-312`; tests: `tests/storage.test.js` "loadTripEnd returns save when stored and keep for no value and an unknown value", "saveTripEnd stores save and keep removes the key", "the trip end save survives a save and a load, and keep goes back to the default", "the trip end functions do not throw when the storage does", "the trip end is not part of the state".
- Target: `localStorage` → Preferences DataStore key `shopping.tripEnd` (string), outside the state store.

**TRIP-9** [core] [new] The trip figures: `tripSummary(state, keep)` gives `total` (items of `Compra`), `left` (not ticked), `back` (recurrent + kept open) and `saved` (one-time − kept). `back + saved = total`. A saved item counts in no figure.
- Evidence: `src/store.js:195-206`; tests: `tests/store.test.js` "tripSummary counts the items of each kind", "tripSummary counts an item to buy as saved only when it is one-time", "tripSummary counts each item of Actual as back or saved", "tripSummary counts a kept open item as back", "tripSummary of an empty state is all zero".
- Note: `docs/spec/02-data-model.md:89,97-99` names the figures and states their content, with no rule id.

## Header figures

**LIST-38** [core] [new] The header of `Compra` has the title `Compra de hoy` (`header.today`), or the name of the shop list in view (SHOP-20). The subtitle is `La lista está vacía` (`header.empty`) with no item, `Todo comprado` (`header.allBought`) with none left, else `{done} de {count} comprados` (`header.bought`, plural on `count`), counted on the items of the list in view. The progress bar shows `round((total − left) / total × 100)` %, 0 for an empty list, only in `Compra`; the bar is labelled by the subtitle. `Recetas` shows `N recetas` (`count.recipes`) or `Sin recetas`, `Ajustes` shows `Bodega`, `Menú` shows `N comidas planificadas` or `Sin comidas planificadas`; they have no bar.
- Evidence: `src/ui/list.js:99-122`, `src/app.js:91-99`, `index.html:19,30`; test: `tests/sections.test.js` "headerOf gives the ticked share in Compra only".
- Note: `docs/spec/` has this as a table with no ID and no `Menú` row.

## Add sheet

**ADD-1** [adapted] [untested] The `+` button opens the add sheet: title and placeholder `Añadir artículo a la lista` (`add.itemLabel`), a name field and the primary button **Añadir** (`add.submit`). The field is empty, has no help text and gets the focus. An add always goes to `Compra`; from a shop list it also puts that shop on the item (SHOP-24). The `+` button hides in `Ajustes`, in `Menú`, while the empty state shows its own action, and while any sheet is open.
- Evidence: `src/ui/add.js:13-25,50-56,63-64`, `src/app.js:115-119`; test: untested.
- Target: `ModalBottomSheet` with `TextField` and `FocusRequester`; keyboard opens with it.

**ADD-2** [core] [verified] While the trimmed text is not empty, the sheet lists at most 6 rows (`MAX_ROWS`). The first row is `+ Crear «{name}»` (`add.createNamed`, `name` = trimmed text) when no item has the same **lower** name (`findByName`). Then come the items whose **fold** name contains the **fold** text, from all items (to buy, ticked, saved): first the exact **fold** match, then the names that start with the text, then the others; inside a rank, the order of `items`. The item rows fill the rest of the 6. An empty or blank text gives no rows. **Añadir** is disabled while the trimmed text is empty. In `Recetas` the sheet lists no rows.
- Evidence: `src/suggest.js:6-18`, `src/store.js:162-180`, `src/ui/add.js:23-39`; tests: `tests/suggest.test.js` "empty or blank text gives no rows", "no exact match: the first row is create", "no match at all: only create", "an exact match (any case or accent) has no create row", "at most 6 rows, create included"; `tests/store.test.js` "searchItems returns nothing for an empty query", "searchItems matches part of a name in active and saved, without case or accent distinction", "searchItems puts the exact match first, then names that start with the query", "searchItems respects the limit", "findByName finds the item with the same name, trimmed and without case distinction".
- Note: the sort inside a rank is stable; keep a stable sort in the port. See Q-lists-1 for an accent-only difference.

**ADD-10** [adapted] [new] The rows stand above the input, which stays pinned at the bottom of the sheet. The list shows the rows in reverse order, so that the first row (the create row, when present) is next to the input.
- Evidence: `src/ui/add.js:29-39`, `index.html:188-195`; test: untested.
- Target: a `Column` with `reverseLayout`-like ordering (or `rows.asReversed()`) above an `imePadding` input row.
- Note: split from ADD-2, which mixes the pure list with its layout.

**ADD-3** [core] [verified] Each item row shows the name and a note of where the item is; a tap runs `bringToList`:

  | State of the item | Note | Effect of the tap |
  |---|---|---|
  | Saved | `comprado antes · añadir` (`where.saved`) | `list: 'active'`; `bought` and `recurrent` do not change |
  | `Compra`, ticked | `ya comprado · repetir` (`where.boughtRepeat`) | Untick |
  | `Compra`, to buy | `ya en la lista` (`where.inList`) | Nothing (`changed: false`, same state) |

  An unknown id gives `error.itemNotFound`.
- Evidence: `src/ui/add.js:8-11,68-86`, `src/store.js:184-190`, `src/suggest.js:13`; tests: `tests/store.test.js` "bringToList brings a saved item to active, not ticked", "bringToList unticks a bought item", "bringToList changes nothing for an item that is in active and not bought", "bringToList rejects an unknown id", "bringToList takes a saved item to active, not ticked"; `tests/suggest.test.js` "inList is true only for an item to buy in the active list", "a saved item is not in the list".

**ADD-4** [core] [verified] The create row does the same as **Añadir** with the field text.
- Evidence: `src/ui/add.js:33,102-119`; test: `tests/suggest.test.js` "no exact match: the first row is create" (the row); the tap is untested.

**ADD-5** [adapted] [untested] **Añadir** (button or the keyboard action) with a text whose **lower** form names an item runs the tap of ADD-3 for that item, never a create. When the effect changes nothing (the item is to buy in `Compra`, and no shop is added by SHOP-24), the text stays in the field, the field is marked invalid, the help under it says `«{name}» ya está en la lista` (`add.duplicate`, the stored name), and the field keeps the focus. The next input clears the help and the mark. Outside the sheet (the empty-state button **+ Añadir «text»**) the same case shows the text as a 3000 ms message in place of the help.
- Evidence: `src/ui/add.js:42-48,68-79,102-112,132-137,142-145`; test: untested.
- Target: `TextField(isError = true, supportingText = …)`; the keyboard `ImeAction.Done` runs the submit.

**ADD-6** [adapted] [untested] An effect that changes the state empties the field, clears the help, ends the list search, and shows `"{name}" ya existe. Ahora está en Compra.` (`toast.existsNowIn`) with `Deshacer` for 5000 ms. The field keeps the focus.
- Evidence: `src/ui/add.js:80-85`, `src/ui/view.js:44`; test: untested.

**ADD-7** [adapted] [untested] A new item is created by LIST-1 to LIST-4 (plus the shop of SHOP-24). The field empties, the help clears, the list search ends, and the message `"{name}" añadido a Compra.` (`toast.addedTo`) shows for 3000 ms with no `Deshacer`. An error of the store shows its text as a 3000 ms message and the text stays.
- Evidence: `src/ui/add.js:113-130`, `src/ui/context.js:214-224`; test: untested.
- Note: when the save to storage fails, this message replaces `error.notSaved` (Q-lists-2).

**ADD-8** [adapted] [untested] After each add the sheet stays open, with an empty field that has the focus, so that the user adds several items in one visit. A tap on the veil, **Listo** (`edit.done`), a drag down of the sheet head, `Escape` or the back of the phone closes it.
- Evidence: `src/ui/add.js:58-61,113-118,141`, `src/app.js:184-193,266-279`; test: `tests/markup.test.js` "each of the eight sheets has the grab, then a head with its title and Listo, then a body".
- Target: `ModalBottomSheet` `onDismissRequest`; `BackHandler` closes the top layer first (NAV-25).

**ADD-9** [adapted] [untested] The row of an existing item that the sheet brought (ADD-6) flashes and scrolls into view (nearest edge). A new item (ADD-7) opens its row with the 200 ms open motion, with no flash and no scroll.
- Evidence: `src/ui/add.js:82`, `src/ui/rows.js:229`, `src/app.js:130-131`, `src/ui/motion.js:112-115`; test: untested.
- Target: `LazyListState.animateScrollToItem` to the item key, plus a highlight animation on that item.

## Search

**LIST-20** [adapted] [verified] The search shows when `Compra` (the list in view) has an item, ticked or not. From 600 dp wide the header has the search button, left of the arrange button. Below 600 dp the button is in the dock (SHOP-26) and the header has none. With no item the search closes and its text clears.
- Evidence: `src/ui/list.js:157-174`, `src/sections.js:54-55`, `styles.css:82-90` (HEAD); test: `tests/sections.test.js` "canSearch is true for Compra with an item and for Recetas with a recipe or a dish", "canSearch is false for an empty Compra, an empty Recetas, Menú and Ajustes".
- Target: `WindowSizeClass` width breakpoint at 600 dp.

**LIST-21** [adapted] [verified] A tap on the header button opens the field **Buscar artículo o tienda** (`search.items`) below the header, with the focus, and closes any open side menu. A second tap, `Escape` or the back of the phone (after any sheet and any open side menu, NAV-25), or a loss of focus with a blank field closes it. A close clears the text.
- Evidence: `src/ui/list.js:364-383`, `src/layers.js:11-15`, `src/app.js:196-204`; test: `tests/layer-order.test.js` "closeTop gives the sheet first, then the row, then the search, then null" (the close order only; the open, the focus and the blur are untested).

**LIST-37** [adapted] [untested] Below 600 dp a tap on the dock search button turns the dock into the field **Buscar artículo o tienda**, with the focus, a clear button while the field has text, and **Cancelar**. The clear button empties the text and keeps the focus. **Cancelar**, `Escape`, the back of the phone, or a loss of focus with a blank field close it; a close clears the text. While the field is open the list ends at the dock, and the list scrolls to its end when the search opens and each time the text changes (not on other updates), so the nearest match is next to the field.
- Evidence: `src/ui/list.js:282-312,340-353,395-418`, `styles.css:189-205` (HEAD); test: untested.

**LIST-22** [core] [verified] The list shows only the items whose name, one of whose shops or whose aisle contains the **fold** text. A blank text shows all items.
- Evidence: `src/store.js:144-147`, `src/ui/view.js:15`; tests: `tests/store.test.js` "matchesItem matches a part of the name with no case and no accent distinction", "matchesItem matches a part of a shop", "matchesItem matches a part of the aisle with no accent distinction", "matchesItem matches each item for an empty query".

**LIST-23** [core] [verified] The order and the grouping stay. With a text, a group with no matching item to buy does not show. The count of a group head and the header figures stay those of the full list.
- Evidence: `src/store.js:152-159`, `src/app.js:91`; tests: `tests/store.test.js` "filterGroups keeps the matches, drops a group with no item left and keeps the totals", "filterGroups gives `left` the count of the full group, not of the matches", "filterGroups keeps each group and each item for an empty query".

**LIST-24** [adapted] [untested] The search text is not stored. A change of section closes the search. A successful add or bring from the add sheet closes it too (ADD-6, ADD-7), so that the row of the item is in view.
- Evidence: `src/ui/nav.js:19-20`, `src/ui/add.js:83,126`, `src/ui/view.js:44`; test: untested.

**LIST-25** [adapted] [untested] With a text the search filters the ticked items too. `Comprados (N)` counts the ticked matches and shows open, and its head is disabled. With no ticked match the head does not show. Group heads show open and disabled too (GROUP-16).
- Evidence: `src/ui/list.js:84-87`, `src/ui/rows.js:245-261`; test: untested.

**LIST-26** [adapted] [verified] With no row to show and a text, the list says `Ningún artículo coincide con «{query}».` (`empty.noItemMatch`, trimmed text) with the button **+ Añadir «{query}»** (`empty.addQuery`). The button adds the text as the add sheet does (ADD-5 to ADD-7) and ends the search.
- Evidence: `src/sections.js:76`, `src/ui/list.js:132-153`, `src/ui/add.js:133-137`; test: `tests/sections.test.js` "emptyAction of a list search with no match adds the searched name", "emptyAction of a search that is only spaces is the empty list".

## Saved items

**LIST-30** [core] [verified] **Terminar compra** saves each ticked one-time item and each open item not kept (TRIP-2). A saved item keeps its name, shops, quantity, aisle and `recurrent: false`, with `bought: false`. No list shows it and it has no delete on the screen: to delete it, bring it back (LIST-32), then **Eliminar**.
- Evidence: `src/store.js:92-96,129-132`; tests: `tests/store.test.js` "startNewShopping keeps a saved item as it is", "a saved item is in no list view and not in the trip figures".

**LIST-31** [core] [verified] A saved item keeps its name (LIST-2): the add sheet finds it (ADD-2, ADD-3), an add of its name brings it back (ADD-5), and a recipe sent to `Compra` brings it back.
- Evidence: `src/store.js:162-180`, `src/recipes.js:92-108`; tests: `tests/store.test.js` "a saved item keeps its name: search finds it and an add of the name is a duplicate"; `tests/recipes.test.js` "sendRecipe brings a saved item, unticks a bought item and leaves a pending item".

**LIST-32** [core] [verified] A bring back puts a saved item in `Compra`; `bought` and `recurrent` do not change. A saved item cannot be ticked (LIST-10).
- Evidence: `src/store.js:187`; tests: `tests/store.test.js` "bringToList brings a saved item to active, not ticked", "a saved item cannot be ticked".

**LIST-33** [core] [verified] A saved item counts in no header figure and in no trip figure, and alone it does not allow **Terminar compra**.
- Evidence: `src/store.js:77-78,195-219`; test: `tests/store.test.js` "a saved item is in no list view and not in the trip figures".

**LIST-34** [dropped] [removed] `Compra` has no section of the saved items; the add sheet is the only way to them.

**LIST-35** [dropped] [removed] A saved item has no row.

**LIST-36** [dropped] [removed] The list search does not find a saved item; the search button shows when the list has an item.

## Limits

One list for the trip: no list for a later trip, no mark on an item for a later trip. No unit and no
arithmetic of quantities, no quantity on the products of a recipe, no note. No add of several items
from one text. No ranking of the results of a list search, and no match by the recipe of an item.
