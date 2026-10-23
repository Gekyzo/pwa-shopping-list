# Shops

The shops of an item, the shops of the edit sheet `Editar`, and the shop lists of `Compra`
(chip row, dock, shop picker, end card). Source: `src/shops.js`, `src/ui/edit.js`, and the shop
parts of `src/ui/list.js`, `src/ui/add.js`, `src/ui/arrange.js`, `src/app.js`. The groups by shop
(`shopGroups`) are in `04-arrange.md` (GROUP-11 to GROUP-14).

## Rules

**SHOP-1** [core] [verified] An item has zero, one or more shops, in the order of their add. A shop is a name; it exists while an item of any list (`Compra` or `Siguiente`) has it. No shop record exists.
- Evidence: `src/shops.js:10-14`, `src/shops.js:21`; test: `tests/shops.test.js` "shopNames gives each shop in use one time, in name order", "addItemShop keeps the order in which the shops were added".

**SHOP-2** [core] [verified] A shop name is trimmed. An empty name (also `null` or only spaces) gives `error.shopRequired` and the state does not change.
- Evidence: `src/shops.js:34-35`; test: `tests/shops.test.js` "addItemShop adds a trimmed shop to the item and does not change its input", "addItemShop rejects an empty name and an unknown item".

**SHOP-3** [core] [verified] Two spellings that differ only by case are one shop. The comparison key is the name in lower case (`toLowerCase`, no locale, no accent folding: `Cafe` and `Café` are two shops). A typed name that matches a shop in use takes the spelling of that shop.
- Evidence: `src/shops.js:6`, `src/shops.js:36`; test: `tests/shops.test.js` "addItemShop takes the spelling of a shop in use".

**SHOP-4** [core] [verified] An add of a shop that the item has already (no case distinction) changes nothing, gives no error and returns the same state object.
- Evidence: `src/shops.js:37`; test: `tests/shops.test.js` "addItemShop returns the same state for a shop that the item has".

**SHOP-5** [core] [verified] A removal compares with no case distinction. A removal of a shop that the item does not have changes nothing, gives no error and returns the same state object.
- Evidence: `src/shops.js:40-45`; test: `tests/shops.test.js` "removeItemShop removes a shop with no case distinction", "removeItemShop returns the same state for a shop that the item does not have".

**SHOP-6** [core] [verified] The shops in use show one time each, with the spelling of their first use in `items` order, sorted by name with the Spanish collation at base strength (no case and no accent distinction: `árbol`, `beta`, `Zeta`).
- Evidence: `src/shops.js:10-14`, `src/store.js:122` (`localeCompare(b, 'es', { sensitivity: 'base' })`); test: `tests/shops.test.js` "shopNames gives each shop in use one time, in name order".
- Target: `java.text.Collator.getInstance(Locale("es"))` with strength `PRIMARY`; see Q-domain-1.

**SHOP-7** [adapted] [untested] A row shows the shops of its item below the name, as `A · B`, in the order of their add. A list by shop does not show them (GROUP-14).
- Evidence: `src/ui/rows.js:18`; test: untested.
- Target: Compose row composable; secondary text line.

**SHOP-29** [core] [new] An add or a removal of a shop for an item id that does not exist gives `error.itemNotFound` and the state does not change.
- Evidence: `src/shops.js:33`, `src/shops.js:42`; test: `tests/shops.test.js` "addItemShop rejects an empty name and an unknown item", "removeItemShop returns the same state for a shop that the item does not have".

## Shops of an item

**SHOP-8** [adapted] [verified] The shops of an item are in the edit sheet `Editar` (ROW-7), after the fields **Nombre**, **Cantidad** and the switch **Repetir en cada compra**, under the title **Tiendas** (`edit.shops`). A tap on the name of a row opens the sheet.
- Evidence: `index.html:282-289`, `src/ui/edit.js:7-13`; test: `tests/markup.test.js` "the edit sheet has a veil, a dialog, the name and quantity fields and the shops".
- Target: Compose `ModalBottomSheet`.

**SHOP-9** [adapted] [untested] The sheet shows each shop in use (SHOP-6) as a chip. A chip is pressed when the item has the shop (no case distinction). A tap on a chip removes the shop when the item has it, else adds it.
- Evidence: `src/ui/edit.js:21-26`, `src/ui/edit.js:41-49`; test: untested.
- Target: `FilterChip` with `selected`.

**SHOP-10** [adapted] [verified] The field **Nueva tienda** (`shops.placeholder`) with **Añadir** (`shops.add`) adds a shop (SHOP-2, SHOP-3). The field takes 40 characters at most. After a successful add the field is empty; after an error it keeps its text.
- Evidence: `index.html:286-287`, `src/ui/edit.js:79-82`; test: `tests/markup.test.js` "the edit sheet has a veil, a dialog, the name and quantity fields and the shops".
- Target: `OutlinedTextField` with a 40-character input filter.

**SHOP-28** [adapted] [new] **Añadir** of the shop field is disabled while the field has no text after a trim.
- Evidence: `src/ui/edit.js:74-76`, `index.html:287`; test: untested.
- Target: `enabled = text.isNotBlank()`.

**SHOP-11** [adapted] [untested] The field offers the shops in use that the item does not have, in name order. A pick of one adds it at once, with no tap on **Añadir**.
- Evidence: `src/shops.js:24-27`, `src/ui/edit.js:52`, `src/ui/edit.js:100-104`; test: `tests/shops.test.js` "shopSuggestions gives the shops in use that the item does not have, in name order", "shopSuggestions is empty for an unknown item and for no shops" (the list only).
- Target: an `ExposedDropdownMenuBox` (autocomplete) whose item click adds the shop. The web detects a pick from a `datalist` by `inputType`; see Q-domain-7.

**SHOP-12** [adapted] [untested] The sheet stays open after each change, so that an item gets several shops in one visit. A tap on the veil, **Listo**, a drag down, `Escape` or the back button closes it (NAV-8).
- Evidence: `src/ui/edit.js:79-82`, `src/app.js:183-192`, `src/app.js:266-279`; test: untested.
- Target: sheet `onDismissRequest`; `BackHandler`.

**SHOP-13** [adapted] [untested] With no shop in use, the sheet shows `Escribe la primera tienda.` (`shops.empty`).
- Evidence: `src/ui/edit.js:50`, `index.html:284`; test: untested.
- Target: text in the sheet.

**SHOP-14** [adapted] [untested] A change of shops is saved at once. It has no message and no `Deshacer`. A change that gives a new state shows `Guardado` in the foot (NAV-22).
- Evidence: `src/ui/edit.js:25`, `src/ui/controls.js:46-51`, `src/ui/context.js:214-225`; test: untested.
- Target: write to the state store (DataStore/Room) at once.

**SHOP-15** [adapted] [untested] The edit sheet closes when its item goes away, for example by `Deshacer` or by an import.
- Evidence: `src/app.js:83`, `src/ui/edit.js:30-35`; test: untested.
- Target: the sheet state holds an item id; a missing item closes it.

## Shop lists

A shop list is a view of `Compra`, not a list in the data. `null` is **Todas**, `''` is **Sin
tienda**, a name is a shop. The rules of the list apply in it.

**SHOP-16** [adapted] [verified] From 600px wide `Compra` has a row of chips below the header: **Todas** (`shops.all`), then each shop of the items of `Compra` in name order (SHOP-6), then **Sin tienda** (`group.noShop`). A tap on a chip shows that list. The chip of the list in view is pressed. Below 600px, while the dock shows, the row is hidden and the dock holds the shop lists (SHOP-26).
- Evidence: `src/shops.js:69-79`, `src/ui/list.js:247-265`, `styles.css:320-333`; test: `tests/shops.test.js` "shopChips has Todas, the shops in name order and Sin tienda, with the items to buy".
- Target: a horizontally scrolling `LazyRow` of chips; window width class ≥ 600dp.

**SHOP-17** [core] [verified] The row has chips only when an item of `Compra` has a shop; items of `Siguiente` do not count. **Sin tienda** shows when an item of `Compra` has no shop. The row scrolls horizontally, and a slide on it does not change the section (NAV-4).
- Evidence: `src/shops.js:69-79`, `src/ui/nav.js:40`; test: `tests/shops.test.js` "shopChips is empty when no item of the view has a shop", "shopChips has no Sin tienda when each item has a shop and counts only the items to buy".

**SHOP-18** [core] [verified] A chip shows the count of its items to buy (not ticked), or `✓` for none.
- Evidence: `src/shops.js:73-76`, `src/ui/list.js:250`; test: `tests/shops.test.js` "shopChips has no Sin tienda when each item has a shop and counts only the items to buy".

**SHOP-19** [core] [verified] A shop list shows the items that have the shop (no case distinction). **Sin tienda** shows the items with no shop. **Todas** shows all. An item of two shops shows in the two lists, and one tick is a tick in each. The search, the order and the groups by recipe and by aisle apply in the list. **Tiendas** is not a choice there (GROUP-2). The operations run on the full state.
- Evidence: `src/shops.js:61-65`, `src/ui/view.js:12`, `src/ui/view.js:29`; test: `tests/shops.test.js` "inShop takes each item for null, the items of a shop with no case distinction, and the items with no shop for an empty name", "shopState keeps only the items of the shop and returns the same state for null".

**SHOP-20** [adapted] [untested] In a shop list the header shows the name of the list as its title. Its subtitle and its bar are those of the items of the list.
- Evidence: `src/app.js:91-92`; test: untested.
- Target: header composable fed from the scoped state.

**SHOP-21** [adapted] [untested] **Terminar compra** stays one operation on the full state (TRIP-2). The banner `¿Has terminado?` shows only in **Todas**.
- Evidence: `src/ui/list.js:225`; test: untested.
- Target: banner visibility condition.

**SHOP-22** [adapted] [verified] The choice of list is a state of the screen and is not stored. A start shows **Todas**. The choice stays while the app runs. At each render a choice whose chip went (a removal of a shop, `Deshacer`, **Terminar compra**, an import) goes back to **Todas**; a choice whose chip remains takes the current spelling of the chip.
- Evidence: `src/shops.js:82-86`, `src/app.js:87`; test: `tests/shops.test.js` "validShop keeps a shop of the view in its current spelling and gives null for a shop that went".
- Target: a `ViewModel` field (not saved state), validated on each state change.

**SHOP-23** [adapted] [verified] A shop list (not **Todas**) of `Compra` with no item to buy, while items of `Compra` are still to buy and no search text is set, shows an end card: the title `<list>: todo comprado` (`shops.done`), the tonal button `Siguiente: <list> (<count>) →` (`shops.next`) and the tonal button `Ver todas las tiendas` (`shops.seeAll`). The next list is the one after the list in view, in chip order and from the start after the end, that has an item to buy (`nextShop`); its count is the items to buy there. With no such list the button `Siguiente` does not show. A tap on it shows the next list. A tap on `Ver todas las tiendas` shows **Todas**.
- Evidence: `src/shops.js:90-95`, `src/ui/list.js:192-210`, `index.html:41-44`; test: `tests/shops.test.js` "nextShop gives the next shop with an item to buy and its count, in chip order, wrapping", "nextShop skips a shop with nothing to buy and gives null when every other shop is done", "nextShop counts an item of two shops in both".
- Target: card composable in the list.

**SHOP-24** [adapted] [verified] The add sheet opened from a shop list puts that shop on the item that it creates or brings (SHOP-4), so the row shows in the list. An item that the sheet finds already gets the shop too; the shop alone counts as a change, with the message and `Deshacer` of ADD-6. From **Todas** and **Sin tienda** the add puts no shop. An add with an error puts no shop.
- Evidence: `src/shops.js:107-110`, `src/ui/add.js:64`, `src/ui/add.js:68-71`, `src/ui/add.js:125`; test: `tests/shops.test.js` "withShop adds the shop to the item of the result and leaves Todas, Sin tienda and errors alone".
- Target: add-sheet `ViewModel` passes the list in view.

**SHOP-25** [adapted] [untested] The arrange sheet has the choice **Listas por tienda**, **Mostrar** or **Ocultar**, while `Compra` has shop chips (SHOP-17). **Ocultar** hides the row and the dock chip in `Compra` and shows **Todas**. The choice is a preference of the device, stored in the key `shopping.shopLists` with the value `hide`; **Mostrar** removes the key; any other stored value reads as **Mostrar**. `Deshacer` and an import do not change it. The row closes (200 ms, `ease-in`) and opens (200 ms, `ease-out`) as a head of GROUP-15 does, and the rows below move with it; with reduced motion there is no animation.
- Evidence: `src/ui/arrange.js:24`, `src/ui/arrange.js:60-75`, `src/storage.js:269-290`, `src/app.js:87`, `src/ui/context.js:42`; test: untested in this area (see `tests/storage.test.js`).
- Target: `localStorage` → DataStore Preferences boolean; `AnimatedVisibility` with `expandVertically`/`shrinkVertically`.

**SHOP-26** [adapted] [verified] Below 600px wide a dock stands above the bottom bar while `Compra` has an item. It holds `‹`, a chip with the name of the list in view, its count of items to buy (`✓` for none) and `▾`, then `›`, then the search button (LIST-37) and the `+` button at the end. `›` shows the next list after the one in view (`nextShop`); `‹` the list before it, in chip order and from the end after the start (`previousShop`). An arrow with no such list is disabled. With no chip (SHOP-17) or with the row hidden (SHOP-25) the dock holds only the search button and the `+` button. A slide on the dock does not change the section (NAV-4). With `Izquierda` the `+` button is at the left end, the search button follows it, and `‹` chip `›` keep their order. In `Recetas` the dock shows while `Recetas` has no empty-state button (NAV-7); it holds the `+` and, while the section has a search, the search button (REC-23). The `+` of the dock shows under the conditions of the `+` of NAV-24.
- Evidence: `src/ui/list.js:282-312`, `src/sections.js:60-61`, `src/app.js:115-119`, `styles.css:134-160`; test: `tests/shops.test.js` "previousShop gives the shop before with an item to buy, in chip order, wrapping", "previousShop gives null when every other shop is done"; `tests/sections.test.js` "dockShown shows the dock in Compra with an item", "dockShown shows the dock in Recetas while the empty action does not show"; `tests/markup.test.js` "the dock ends with the add button".
- Target: a Compose bottom bar slot above `NavigationBar`, compact width only.

**SHOP-30** [core] [new] From **Todas**, or from a list whose chip is gone, `nextShop` gives the first list in chip order with an item to buy, and `previousShop` the last one. Neither counts the list in view. Both give nothing when no other list has an item to buy, and neither changes the state.
- Evidence: `src/shops.js:90-104`; test: `tests/shops.test.js` "nextShop from Todas or from a shop that is gone gives the first shop with an item to buy", "previousShop from Todas or from a shop that is gone gives the last shop with an item to buy", "previousShop does not change the state".

**SHOP-27** [adapted] [verified] A tap on the chip of the dock opens the shop picker, a sheet with the title `Listas por tienda` (`shops.lists`) and one entry for each chip of SHOP-16, with `Quedan N artículos` / `Queda 1 artículo` (`header.left`) or `Todo comprado` (`header.allBought`) below its name. The entry of the list in view is pressed and takes the focus at the open. A tap on an entry shows that list and closes the sheet; the focus goes back to the chip. The sheet closes as each sheet does (NAV-8). It closes when the section is not `Compra`.
- Evidence: `src/ui/list.js:315-338`, `src/ui/list.js:389-394`, `src/ui/nav.js:20`; test: `tests/markup.test.js` "the shop chip of the dock opens the shop picker, a sheet with a head".
- Target: `ModalBottomSheet` with a list of selectable entries; focus via `FocusRequester`.

## Limits

No screen of shops. No rename and no delete of a shop for all its items at one time. No custom
order of the shops. No memory of the shops of a deleted item. No shop on the products of a
recipe, and no shop field in the add sheet.
