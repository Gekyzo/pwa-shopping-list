# Order, groups and the manual move

The order and the grouping of `Compra`, the arrange sheet **Agrupar y ordenar**, and the manual move
of a row. Source modules: `src/store.js` (`setSort`, `setGroup`, `reorderItems`, `sortItems`,
`activeItems`, `filterGroups`), `src/recipes.js` (`recipeGroups`, `sharedItems`, `buyRecipe`),
`src/shops.js` (`shopGroups`), `src/aisles.js` (`aisleGroups`), `src/reorder.js`, `src/ui/view.js`
(`arrangeChoices`, `shownGroup`), `src/ui/arrange.js`, `src/ui/drag.js`, `src/ui/motion.js`, the
heads and scopes in `src/ui/rows.js`, and the list build in `src/ui/list.js`.

Units: the code uses CSS px. A CSS px on an Android browser is one dp, so each px value below is
the same value in dp.

## Arrange sheet

**SORT-1** [adapted] [stale] The header button `Agrupar y ordenar` (`arrange.label`) shows only in `Compra`, and only when the sheet has one part to show: a grouping (GROUP-2), the order (SORT-3), or the choice **Listas por tienda** (SHOP-25, shown when `Compra` has a shop chip). When no part shows, the sheet closes. A tap opens the sheet and closes any open side menu.
- Spec: "only when the sheet has a choice to offer: a grouping (GROUP-2) or an order (SORT-3)". Code: the shop-list choice also counts.
- Evidence: `src/ui/arrange.js:20-29,88-91`, `src/ui/view.js:23-33`; test: untested.
- Target: an `IconButton` in the `TopAppBar` that opens a `ModalBottomSheet`.

**SORT-2** [adapted] [untested] The sheet has, in this order, **Agrupar por** (`arrange.groupBy`), **Ordenar por** (`arrange.sortBy`) and **Listas por tienda** (`shops.lists`); a part with no choice is hidden. The sheet stays open after a choice, so that the group and the order change in one visit. A tap on the veil, **Listo**, a drag down of the head, `Escape` or the back of the phone closes it.
- Evidence: `index.html:199-230`, `src/ui/arrange.js:82-85,92`, `src/app.js:184-193,266-279`; test: `tests/markup.test.js` "each of the eight sheets has the grab, then a head with its title and Listo, then a body".

## Order

**SORT-3** [adapted] [untested] **Ordenar por** has two segmented buttons, **Nombre** (`arrange.name`, `name`) then **Personalizado** (`arrange.custom`, `custom`); the stored one is pressed. It shows when the list in view has two items or more, ticked items included.
- Evidence: `index.html:214-220`, `src/ui/view.js:26,31`, `src/ui/arrange.js:30,43-45`; test: untested.

**SORT-4** [core] [verified] One choice, `sort`, applies to `Compra`. The values are `custom` and `name`; the default is `custom`. Any other value gives `error.unknownSort` and the state does not change.
- Evidence: `src/store.js:2,11,100-101`; test: `tests/store.test.js` "setSort sets a known sort and rejects another one".

**SORT-5** [core] [verified] **Personalizado** is the order of `items`: the insertion order, changed by the moves of the user. A new item goes to the end. `sortItems` returns the same list object in this order.
- Evidence: `src/store.js:36,127`; tests: `tests/store.test.js` "sortItems keeps the insertion order when the sort is added", "activeItems lists active items, not bought first, in insertion order".

**SORT-6** [core] [verified] **Nombre** is the Spanish collation at base strength: no case and no accent distinction, and `ñ` sorts after `n` (`árbol, Banana, nata, Ñoquis, Oca, zumo`). Equal names keep their order. It does not change `items`. The same collation applies in every screen language.
- Evidence: `src/store.js:122-127`; tests: `tests/store.test.js` "sortItems gives the Spanish name order without case or accent distinction", "compareNames has no case and no accent distinction".
- Port: `java.text.Collator.getInstance(Locale("es"))` with `strength = Collator.PRIMARY`, and a stable sort. Check the JVM result against the test list (Q-arrange-1).

**SORT-7** [core] [verified] In `Compra` the items to buy come before the ticked items, in each order.
- Evidence: `src/store.js:129-132`; test: `tests/store.test.js` "activeItems sorts by name and keeps the bought items last".

**SORT-8** [core] [verified] The order also applies inside each group and to the rows of `Otros`, `Sin tienda` and `Sin sección`. Recipes and their products have no order choice.
- Evidence: `src/recipes.js:124,138`, `src/shops.js:51`, `src/aisles.js:86`; tests: `tests/recipes.test.js` "recipeGroups sorts the members of a group and the rest by name"; `tests/shops.test.js` "shopGroups uses the order of the list inside a group"; `tests/aisles.test.js` "aisleGroups uses the order of the user and leaves out the saved items".

**SORT-9** [adapted] [untested] A change of order has no message and no `Deshacer`. The rows to buy move from their old to their new places in 200 ms, ease-out. With reduced motion they jump.
- Evidence: `src/ui/arrange.js:133-139`, `src/ui/motion.js:50-60`, `src/ui/context.js:42`; test: untested.
- Target: `LazyColumn` item keys plus `Modifier.animateItem(placementSpec = tween(200, easing = EaseOut))`; skip when the system animator scale is 0.
- Note: an open `Deshacer` of an earlier change stays and its undo also undoes this change (Q-arrange-2).

## Groups

**GROUP-1** [core] [verified] **Agrupar por** has four segmented buttons in this order: **Recetas** (`nav.recipes`, `recipe`), **Tiendas** (`arrange.shops`, `shop`), **Secciones** (`arrange.aisles`, `aisle`), **Nada** (`arrange.none`, `none`). One choice, `group`, applies to `Compra`. The default is `recipe`. Any other value gives `error.unknownGroup` and the state does not change.
- Evidence: `src/store.js:6,11,103-104`, `index.html:205-213`; test: `tests/store.test.js` "setGroup sets each known group and rejects another one".

**GROUP-2** [core] [untested] On the list in view (the full `Compra`, or a shop list), a choice shows only when the view can show it:
  - **Recetas**: when `recipeGroups` gives one group at least (GROUP-5, GROUP-6).
  - **Tiendas**: when an item of the view, ticked or not, has a shop, and the view is not a shop list.
  - **Secciones**: when an item of the view, ticked or not, has an aisle; also in a shop list.
  - **Nada**: each time one of the others shows.

  With none of the first three, **Agrupar por** is hidden.
- Evidence: `src/ui/view.js:23-33`, `src/ui/arrange.js:22,29,35-41`; test: untested.
- Port: keep `arrangeChoices` as a pure function of (state, shop list in view).

**GROUP-22** [adapted] [new] The segmented control of **Agrupar por** holds only the choices that show. Its selection marker has the width of one shown choice and sits on the pressed one among them (0 when none is pressed).
- Evidence: `src/ui/arrange.js:10-18,41`; test: untested.
- Target: `SingleChoiceSegmentedButtonRow` built from the shown choices only.

**GROUP-3** [core] [untested] The grouping in view is the stored `group` when the view can show it (GROUP-2), else none: the list is flat and the sheet presses **Nada**. The stored choice does not change. Example: with `group: 'shop'` in a shop list, the list is flat.
- Evidence: `src/ui/view.js:36-41`, `src/ui/arrange.js:37-41`; test: untested.

**GROUP-4** [adapted] [untested] A tap on the choice that the view shows changes nothing, except while the groups close for **Nada** (GROUP-15). So a tap on **Nada** in a view that is flat by GROUP-3 keeps the stored grouping. A tap on any other choice writes `group` with no message and no `Deshacer`.
- Evidence: `src/ui/arrange.js:94-132`; test: untested.

### By recipe

**GROUP-5** [core] [verified] The recipe groups of `Compra` are, in this order:
  1. each recipe of `sent`, in send order; an id with no recipe is skipped;
  2. each other recipe, in the order of `recipes`, that has one product at least and whose products are all items of `Compra` (ticked or not), by **lower** name.
- Evidence: `src/recipes.js:111-113,123-130`; tests: `tests/recipes.test.js` "recipeGroups groups a recipe that was not sent when all its products are in active", "recipeGroups counts a ticked item as a product in active", "recipeGroups gives no group to a recipe that was not sent and has a product out of active", "recipeGroups puts the sent recipes first and each recipe one time", "recipeGroups ignores a saved item, a recipe with no item and a stale id".

**GROUP-6** [core] [verified] The members of a recipe group are the items of `Compra` whose **lower** name is a **lower** product of the recipe. A group lists only its members to buy. A group with no member to buy does not show, sent or not.
- Evidence: `src/recipes.js:131-137`; tests: `tests/recipes.test.js` "recipeGroups matches an item added by hand without case distinction", "recipeGroups drops a ticked item from each group and keeps it in the totals", "recipeGroups drops a group whose items are all ticked, sent or not".

**GROUP-7** [core] [verified] An item of two recipes shows in the two groups. One tick takes it out of both.
- Evidence: `src/recipes.js:133-135`; test: `tests/recipes.test.js` "recipeGroups puts a shared item in each group and the other items in rest".

**GROUP-20** [core] [verified] A row of an item to buy that is in two recipe groups or more adds `También en {recipes}` (`row.alsoIn`) to its meta line: the names of the other groups, in group order, joined by `, `. The groups are counted before the search, so a search keeps the text. The meta parts (shops, this text, `↻ cada compra`) are joined by ` · `.
- Evidence: `src/recipes.js:180-186`, `src/ui/list.js:72-78`, `src/ui/rows.js:14-23`; tests: `tests/recipes.test.js` "sharedItems names the recipes of each item to buy in two groups or more", "sharedItems leaves out a shared item that is ticked", "sharedItems is empty with no group".
- Note: the Spanish text has no `«»` around the names; `docs/spec/` writes `También en «recipes»`.

**GROUP-8** [core] [verified] The head of a group (recipe, shop or aisle) shows its name and `{done} de {count}` (`count.ticked`), where `count` is all its members and `done` the ticked ones, or `✓` when none is left to buy; then the chevron (GROUP-16). The counts are those of the full group, also during a search.
- Evidence: `src/ui/list.js:27,34,46,77`, `src/store.js:152-159`; tests: `tests/recipes.test.js` "recipeGroups drops a ticked item from each group and keeps it in the totals"; `tests/store.test.js` "filterGroups gives `left` the count of the full group, not of the matches".
- Note: a recipe group with nothing to buy does not show (GROUP-6), so `✓` shows only on shop and aisle heads (GROUP-23).

**GROUP-21** [adapted] [verified] Outside a search, the head of a recipe group slides to the right as a row does (ROW-11), with the icon `check`. The run closes the rows of the group in view in 200 ms, then ticks each member of the recipe that is to buy in the list in view (in a shop list, only the members of that list), and shows `«{name}»: {count} productos comprados.` (`toast.recipeBought`, plural on `count`) with `Deshacer`. A second slide while the rows close does nothing. A tap on the head still closes and opens the group (GROUP-16).
- Evidence: `src/ui/list.js:52-60,77`, `src/ui/rows.js:268-298`, `src/recipes.js:145-153`, `src/ui/motion.js:64-71`; tests: `tests/recipes.test.js` "buyRecipe ticks each item of the recipe still to buy, and only those", "buyRecipe matches the items without case distinction and skips a saved item", "buyRecipe ticks only the items of the scope", "buyRecipe with nothing to buy returns the same state", "buyRecipe rejects an unknown recipe".

**GROUP-9** [core] [verified] The items to buy that are in no recipe group show last, below the head `Otros` (`group.others`). That head has no count.
- Evidence: `src/recipes.js:138`, `src/ui/list.js:80`; test: `tests/recipes.test.js` "recipeGroups puts a shared item in each group and the other items in rest".

**GROUP-10** [core] [verified] The ticked items show one time each in `Comprados (N)`, with no group, in every grouping.
- Evidence: `src/ui/list.js:84-87`, `src/store.js:129-132`; test: `tests/store.test.js` "activeItems lists active items, not bought first, in insertion order".

### By shop

**GROUP-11** [core] [verified] The shop groups are the shops of the items of `Compra` (ticked or not), one per **lower** name with the first spelling met, in name order (SORT-6). Each head has the count of GROUP-8.
- Evidence: `src/shops.js:6-14,50-58`; tests: `tests/shops.test.js` "shopGroups puts an item of two shops in the two groups and leaves out a saved item", "shopGroups counts a ticked recurrent item in the total and leaves it out of the items".

**GROUP-12** [core] [verified] An item of two shops shows in the two groups.
- Evidence: `src/shops.js:54`; test: `tests/shops.test.js` "shopGroups puts an item of two shops in the two groups and leaves out a saved item".

**GROUP-13** [core] [verified] The items to buy with no shop show last, below the head `Sin tienda` (`group.noShop`), with no count.
- Evidence: `src/shops.js:57`, `src/ui/list.js:36`; test: `tests/shops.test.js` "shopGroups with no shops has no groups and all the items in rest".

**GROUP-14** [core] [untested] A row in a list by shop does not show the shops of the item in its meta line.
- Evidence: `src/ui/rows.js:18`; test: untested.

**GROUP-23** [core] [new] A shop group or an aisle group whose members are all ticked still shows its head, with `✓` and no rows (a recipe group does not, GROUP-6). Outside a search it stays; a search removes it.
- Evidence: `src/shops.js:53-56`, `src/aisles.js:88-93`, `src/store.js:157`; tests: `tests/shops.test.js` "shopGroups counts a ticked recurrent item in the total and leaves it out of the items"; `tests/aisles.test.js` "aisleGroups follows the order of the aisles and keeps the ticked members in the total".

### By aisle

**GROUP-17** [core] [verified] The aisle groups are the entries of `aisles` (AISLE-1), in that order, that have one item of the view at least, ticked or not. The member test is the exact string `item.aisle === aisle`. Each head has the count of GROUP-8. A shop list can show its items by aisle.
- Evidence: `src/aisles.js:85-95`, `src/ui/view.js:30`; tests: `tests/aisles.test.js` "aisleGroups follows the order of the aisles and keeps the ticked members in the total", "aisleGroups uses the order of the user and leaves out the saved items".

**GROUP-18** [core] [verified] An aisle with no item in the view does not show. The items to buy with an empty aisle show last, below the head `Sin sección` (`group.noAisle`), with no count.
- Evidence: `src/aisles.js:93-94`, `src/ui/list.js:48`; test: `tests/aisles.test.js` "aisleGroups follows the order of the aisles and keeps the ticked members in the total".
- Note: an item whose aisle is not empty and not in `aisles` shows in no group (Q-arrange-3).

**GROUP-19** [core] [untested] A row in a list by aisle shows its shops (SHOP-7), as in a flat list.
- Evidence: `src/ui/rows.js:18`; test: untested.

### Effect

**GROUP-15** [adapted] [untested] When a grouping opens from a flat list, the heads and the second rows of shared items open in 200 ms, and the other rows move to their new places in 200 ms. When the choice goes to **Nada**, **Nada** is pressed at once, the heads and the second rows close in 200 ms, then the list becomes flat and the rows move. A tap on a grouping while the groups close cancels the close and writes that grouping. With reduced motion every step is instant.
- Evidence: `src/ui/arrange.js:94-132`, `src/ui/motion.js:4-32,50-60,80-88`; test: untested.
- Target: `AnimatedVisibility` for heads, `animateItem()` for moves; a cancellable coroutine for the close step.

**GROUP-16** [adapted] [untested] A tap on the head of a group (recipe, `Otros`, shop, `Sin tienda`, aisle, `Sin sección`) closes its rows in 200 ms; the head stays with its count and `chevron-right`. A second tap opens the rows in 200 ms with `chevron-down`. The closed groups are kept per section and group key in memory until the app starts again; they are not stored. During a search each group shows open and its head is disabled.
- Evidence: `src/ui/rows.js:240-241,264-307`, `src/ui/context.js:149`; test: untested.
- Target: a set of closed keys in the view model (keys: recipe id, `shop:<name>`, `aisle:<name>`, `others`, `noShop`, `noAisle`). See Q-arrange-4 for process death.

## Manual move

**MOVE-1** [adapted] [untested] A touch or pen hold of 400 ms on a row to buy lifts it, with a 10 ms vibration. With a mouse, a move of 10 px whose vertical part is larger than its horizontal part lifts it at once, with no hold. Only the primary button starts a lift.
- Evidence: `src/ui/context.js:31,38`, `src/ui/drag.js:64,104-135`; test: untested.
- Target: `Modifier.pointerInput { detectDragGesturesAfterLongPress }` with a 400 ms timeout, or a LazyColumn reorder library; `HapticFeedbackType.LongPress` (Q-arrange-5). Mouse: drop (Q-arrange-6).

**MOVE-2** [adapted] [untested] A finger that moves 10 px or more (largest of the horizontal and vertical distance) before the hold ends does not lift the row: a vertical move scrolls the list, a horizontal move slides the row (ROW-4). A move of another pointer, or with the primary button up, also cancels the hold.
- Evidence: `src/ui/drag.js:120-131`, `src/ui/rows.js:98-108`; test: untested.

**MOVE-3** [core] [untested] A row moves only among the rows of its scope:

  | View | Scope of a row to buy |
  |---|---|
  | Flat | `rest`: every row to buy |
  | By recipe | The recipe id; `Otros` has `rest` |
  | By shop | `shop:<name>`; `Sin tienda` has `rest` |
  | By aisle | `aisle:<name>`; `Sin sección` has `rest` |

  A ticked row has no scope.
- Evidence: `src/ui/rows.js:170-172,234-235`, `src/ui/list.js:30-82`; test: untested.

**MOVE-4** [adapted] [stale] A row does not lift when it is ticked, when its side menu is open, while another row is lifted, when it is the only row of its run (MOVE-5), and while the list search has text (the hidden rows have no place on the screen). A lift also fails when the pointer is gone.
- Spec: "A row does not move while its side menu is open or its name is in edit." Code: a row has no inline name edit; the edit sheet covers the list.
- Evidence: `src/ui/drag.js:42-48,104-109`, `src/ui/view.js:17`; test: untested.

**MOVE-5** [core] [untested] The rows that a lifted row can pass are the run of adjacent rows with the same scope around it. A head, the `Comprados (N)` head or a row of another scope ends the run. So a shared item in a second recipe group, and `rest` rows separated by heads, are separate runs.
- Evidence: `src/ui/drag.js:36-42`; test: untested.

**MOVE-6** [core] [verified] The lifted row follows the pointer vertically (pointer delta plus scroll delta since the lift), clamped so that it stays between the top of the first row and the bottom of the last row of the run. `dropIndex(tops, heights, from, y)` gives its target: moving down, it passes each next neighbour while its bottom edge (`y + heights[from]`) is strictly below that neighbour's centre; moving up, it passes each previous neighbour while its top `y` is strictly above that neighbour's centre. Each row uses its own height. `shifts(count, from, to, h)` moves the rows between: `−h` for `from < i ≤ to`, `+h` for `to ≤ i < from`, 0 else.
- Evidence: `src/reorder.js:5-21`, `src/ui/drag.js:11-22`; tests: `tests/reorder.test.js` "dropIndex keeps the place for a small move", "dropIndex takes the place of a neighbour when the leading edge passes its centre", "dropIndex gives the end place to a row that is on it", "dropIndex passes more than one row", "dropIndex stops at the two ends", "dropIndex uses the height of each row", "shifts opens the gap below for a move down", "shifts opens the gap above for a move up", "shifts moves no row for the same place".
- Port: `dropIndex` and `shifts` as pure functions; feed them the `LazyListItemInfo.offset`/`size` of the run, captured at the lift.

**MOVE-7** [adapted] [untested] While a row is lifted, a pointer within 56 px of the top or the bottom edge of the scroll area scrolls it by 8 px each display frame, toward that edge, and the lifted row keeps its place under the pointer. While a row is lifted, the page does not scroll under the finger.
- Evidence: `src/ui/context.js:40-41`, `src/ui/drag.js:25-34,150-159`; test: untested.
- Target: a frame loop (`withFrameNanos`) calling `LazyListState.scrollBy`; see Q-arrange-7 for the speed on 90/120 Hz screens.

**MOVE-8** [core] [verified] The release writes the new order: `moveTo(ids, from, to)` moves one id of the run, and `reorderItems` gives the places that the run's items have in `items` to the same items in the new order; each other item keeps its place. A release at the start place writes nothing. `reorderItems` with an id two times gives `error.invalidOrder`; with an unknown id `error.itemNotFound`; with the same order it returns the same state object.
- Evidence: `src/reorder.js:24-27`, `src/store.js:110-119`, `src/ui/drag.js:69-88`; tests: `tests/reorder.test.js` "moveTo moves an id down, up and to the same place", "moveTo does not change its input"; `tests/store.test.js` "reorderItems writes the new order of a full scope", "reorderItems moves the items of a sub-scope and leaves the others in place", "reorderItems does not change its input", "reorderItems returns the same state for the same order", "reorderItems rejects an id that is not known", "reorderItems rejects an id that is there two times".

**MOVE-9** [core] [verified] A move while `sort` is `name` sets `sort` to `custom`. The custom order first becomes the name order of all items (saved items included), then the move applies to it, so the lists stay as the screen showed them. An error leaves `sort: 'name'`.
- Evidence: `src/store.js:115-118`; tests: `tests/store.test.js` "reorderItems from the name order writes the name order, then the move, and sets the custom order", "reorderItems from the name order does not change its input", "reorderItems from the name order rejects an unknown id and keeps the name order".

**MOVE-10** [adapted] [untested] A written move shows `Orden cambiado.` (`toast.order`), or `Orden cambiado a «Personalizado».` (`toast.orderCustom`) for MOVE-9, with `Deshacer` for 5000 ms. The rows then move from their drop places to their new places in 200 ms.
- Evidence: `src/ui/drag.js:77-87`, `src/locales/es.js:227-228`; test: untested.

**MOVE-11** [adapted] [untested] `Escape`, the back of the phone, a cancelled pointer and any new render of the list end the move with no change; the rows go back to their places.
- Evidence: `src/app.js:81,216,244`, `src/ui/drag.js:69-82,136-143`; test: untested.
- Target: Compose recomposition does not rebuild rows; see Q-arrange-8 for which state changes must cancel a drag.

**MOVE-12** [adapted] [untested] The click that follows a release, or the release of a hold, does not tick the item: every click in the 350 ms after it is swallowed.
- Evidence: `src/ui/context.js:35,228-231`, `src/ui/drag.js:75,138`, `src/app.js:166-174`; test: untested.
- Target: Compose drag gestures consume the up event, so no click fires; keep a guard only if a test shows a click.

**MOVE-13** [adapted] [new] While a row is lifted, a horizontal move neither slides the row (ROW-4) nor slides to another section, and a long press of a finger opens no context menu.
- Evidence: `src/ui/rows.js:99`, `src/ui/nav.js:39`, `src/ui/drag.js:145-147`; test: untested.
- Target: the drag modifier consumes the pointer changes, so the row swipe and the pager do not see them.

## Limits

No move between groups, no move of a ticked row, no order of the shops, no order of recipes or
products, no move with the keyboard.
