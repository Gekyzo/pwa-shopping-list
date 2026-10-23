# Recipes

The recipes, their products and link, the send of a recipe to `Compra`, the section `Recetas` and
the recipe sheet `Receta`. Source: `src/recipes.js`, `src/ui/recipes.js`, and the recipe parts of
`src/ui/add.js`, `src/ui/list.js`, `src/app.js`. The groups by recipe in `Compra` (`recipeGroups`,
`buyRecipe`, `sharedItems`) are in `04-arrange.md`.

## Recipe

**REC-1** [core] [verified] A recipe is `{ id, name, products, url }`: a name, a list of product names and a link (`''` for none). It has no quantities, no steps and no photo. A new recipe has no product and no link.
- Evidence: `src/recipes.js:21-27`; test: `tests/recipes.test.js` "addRecipe adds an empty recipe and returns its id".

**REC-2** [core] [verified] A recipe name is trimmed and not empty (`error.nameRequired`), and unique among the recipes with no case distinction (`error.duplicateRecipe` with the `name` of the other recipe). The name of an item does not count. A rename to a change of case of its own name is valid. A rename or a delete of an unknown id gives `error.recipeNotFound`.
- Evidence: `src/recipes.js:14-19`, `src/recipes.js:29-34`; test: `tests/recipes.test.js` "addRecipe rejects an empty name", "addRecipe rejects a duplicate name without case distinction", "addRecipe accepts the name of an item", "renameRecipe accepts a change of case of its own name", "renameRecipe rejects an empty name, a duplicate and an unknown id".

**REC-3** [adapted] [untested] The `+` button in `Recetas` opens the add sheet with the field `Nombre de la receta` and the button **Crear**, with no target choice. A valid name creates the recipe, closes the add sheet, clears and closes the search, and opens the recipe sheet (REC-33) with the cursor in its product field. An error shows its message as a toast and keeps the add sheet open.
- Evidence: `src/ui/add.js:88-100`, `src/app.js:125-126`; test: untested.
- Target: add sheet `ViewModel`; `FocusRequester` on the product field.

**REC-4** [adapted] [untested] A recipe row shows the name and, below it, the meta line `N productos` (`count.products`, `1 producto` for one), then `en la lista` when REC-35 applies and `con enlace` when the recipe has a link, joined by ` · `. A tap on the name opens the recipe sheet (REC-33). The send button of REC-17 stays at the end of the row.
- Evidence: `src/ui/recipes.js:108-125`; test: untested.
- Target: row composable.

**REC-5** [adapted] [stale] A recipe row slides as an item row (ROW-4 to ROW-6, ROW-8, ROW-10). A slide to the left shows **Eliminar**, an icon button 72 px wide (dp on the target) with its name under the icon; its text for a screen reader is `Eliminar {name}` (`row.delete`). A slide to the right sends the recipe at the release (REC-17), with the rule and the backdrop of ROW-11 and the icon `cart-add`.
- Spec: "an icon button 64 px wide". Code: `SIDE_BUTTON = 72`, "the same as in design-system.css".
- Evidence: `src/ui/recipes.js:92-104`, `src/ui/recipes.js:122-123`, `src/ui/context.js:30-31`; test: untested.
- Target: `AnchoredDraggable` / `SwipeToDismissBox`-style row with revealed actions.

**REC-6** [core] [verified] A delete removes the recipe, its id from `sent` and each meal of the menu that holds it. The items that the recipe sent stay in the lists. From the row and from the sheet the delete has `Deshacer` with the message `Receta «name» eliminada.` (`toast.recipeDeleted`).
- Evidence: `src/recipes.js:36-43`, `src/ui/recipes.js:98`, `src/ui/recipes.js:199-204`; test: `tests/recipes.test.js` "deleteRecipe removes the recipe and leaves the items", "deleteRecipe removes the recipe from sent", "deleteRecipe empties the meals of the recipe in the menu".

**REC-7** [adapted] [stale] The recipes show in the order of their creation. Below 840px wide they stand in one column; from 840px in two, filled row by row. An unfolded phone keeps one column.
- Spec: "Below 600px wide they stand in one column; from 600px in two … so more of them fit on the screen of a tablet or an unfolded phone." Code: the grid starts at `min-width: 840px`, and its comment says an unfolded phone keeps one column.
- Evidence: `src/recipes.js:26`, `src/ui/list.js:180`, `styles.css:228-236`; test: untested.
- Target: `LazyVerticalGrid` with 2 columns at the expanded width class (≥ 840dp).

**REC-35** [core] [verified] A recipe whose products are all items of `Compra`, ticked or not, with no case distinction, adds `en la lista` (`recipe.inListShort`) to its meta line (REC-4). A recipe with no products never has this text. Items of `Siguiente` do not count.
- Evidence: `src/recipes.js:111-117`; test: `tests/recipes.test.js` "inList is true when each product of the recipe is an item of active, without case distinction", "inList counts a ticked item as a product in active", "inList is false for a product that is missing or saved, and for a recipe with no products".

## Products

**REC-8** [core] [verified] A product is a name, trimmed and not empty (`error.productRequired`), unique in its recipe with no case distinction (`error.duplicateProduct` with the `name` of the product there). The same product can be in two recipes. A new product goes to the end.
- Evidence: `src/recipes.js:71-80`; test: `tests/recipes.test.js` "addRecipeProduct appends a trimmed product", "addRecipeProduct rejects a name of spaces only", "addRecipeProduct rejects a duplicate without case distinction and an unknown recipe", "addRecipeProduct accepts the same product in two recipes".

**REC-39** [core] [new] A removal of a product compares the exact spelling. A product that is not in the recipe gives `error.productNotFound`; an unknown recipe gives `error.recipeNotFound`.
- Evidence: `src/recipes.js:82-87`; test: `tests/recipes.test.js` "removeRecipeProduct removes one product", "removeRecipeProduct rejects an unknown product and an unknown recipe".

**REC-9** [adapted] [untested] The recipe sheet lists its products under the title **Productos** (`recipe.products`), each with a `✕` button (`Quitar {name}` for a screen reader), then the field **Añadir producto** with **Añadir**. The removal of a product has `Deshacer` with the message `"{product}" quitado de «{name}».` (`toast.productRemoved`); the add has no message and no `Deshacer`.
- Evidence: `src/ui/recipes.js:24-41`, `src/ui/recipes.js:45-81`, `index.html:323-324`; test: untested.
- Target: list in the sheet; `IconButton` per product.

**REC-38** [adapted] [new] The product field takes 80 characters at most.
- Evidence: `src/ui/recipes.js:49`; test: untested.
- Target: input filter of 80 characters.

**REC-10** [core] [verified] While the user types a product, the sheet lists up to 5 names that contain the text, with no case and no accent distinction (`fold`, see Q-domain-2): the names of all items (any list), then the products of all recipes. Each name shows one time, with no case distinction (accents count: `Azúcar` and `Azucar` are two names), with the spelling of its first source, so the item wins. The products of the recipe in the sheet do not show. The exact match goes first, then the names that start with the text, then the rest, each part in source order. An empty text lists nothing. A tap on a name adds it.
- Evidence: `src/recipes.js:158-176`, `src/ui/recipes.js:66-71`; test: `tests/recipes.test.js` "productSuggestions offers a product of another recipe that is no item", "productSuggestions offers an item and a product of the same name one time, with the name of the item", "productSuggestions leaves out the products of the recipe, without case distinction", "productSuggestions ranks the exact match, then the prefix, without accent distinction, five at most", "productSuggestions returns nothing for an empty query or an unknown recipe".

**REC-11** [adapted] [untested] After an add the product field is empty, the suggestions clear, and the field keeps the focus for the next product. After an error the field keeps its text and the focus, and the error shows as a toast.
- Evidence: `src/ui/recipes.js:58-65`; test: untested.
- Target: field state in the sheet `ViewModel`.

**REC-12** [core] [untested] A product is text. It does not create an item, and a later rename of an item does not change it (DATA-11).
- Evidence: `src/recipes.js:71-80` (no write to `items`); test: untested.

## Link

**REC-13** [adapted] [untested] The link is edited in the field **Enlace** (`recipe.link`) of the recipe sheet. It saves on `Enter` or a loss of focus, as **Nombre** does (REC-33). An empty text removes the link. A text that gives the stored address (for example the same address with no scheme) changes nothing and shows no message.
- Evidence: `src/ui/recipes.js:215-225`; test: untested.
- Target: `OutlinedTextField` with `KeyboardType.Uri`; save on focus loss and IME action.

**REC-14** [core] [verified] The link text is trimmed. A text with no scheme (no leading `letter[letters digits + . -]*:`) gets `https://`. Only an `http` or `https` address is valid, with no white space anywhere and a host of two labels at least: labels of letters, digits and inner hyphens, the last label of two letters at least or an `xn--` label (an international name passes in its ASCII form). Any other text gives `error.invalidLink` and the state does not change. The stored value is the text with its added scheme, not a normalised address. A stored link that is not valid becomes empty (STORE-7).
- Evidence: `src/recipes.js:47-69`; test: `tests/recipes.test.js` "setRecipeUrl stores a trimmed link and leaves the rest of the recipe", "setRecipeUrl adds https to a link with no scheme", "setRecipeUrl removes the link with an empty text", "setRecipeUrl rejects a text that is not a web address and an unknown recipe", "isWebUrl needs a host name with a dot and no space", "setRecipeUrl rejects a text with spaces, with or without a scheme".
- See Q-domain-4 (URL parser parity) and Q-domain-5 (`host:port` with no scheme).

**REC-15** [adapted] [untested] A recipe with a link adds `con enlace` (`recipe.hasLink`) to its meta line (REC-4). The recipe sheet shows an icon button with a chain symbol beside the field **Enlace** while the recipe has a link, labelled `Abrir el enlace de {name}` (`recipe.openLink`). It opens the address outside the app, with no referrer and no access back to the app.
- Evidence: `src/ui/recipes.js:112`, `src/ui/recipes.js:184-188`, `index.html:322`; test: untested.
- Target: `<a target=_blank rel=noopener noreferrer>` → `Intent(ACTION_VIEW, uri)` or a Custom Tab.

**REC-16** [adapted] [untested] A save of a link has `Deshacer` with `Enlace guardado.` (`toast.linkSaved`); a removal has `Deshacer` with `Enlace quitado.` (`toast.linkRemoved`). An invalid link shows its error, and the field shows the stored link again.
- Evidence: `src/ui/recipes.js:217-223`, `src/ui/controls.js:56-66`; test: untested.
- Target: snackbar with an undo action.

## Send to `Compra`

**REC-17** [adapted] [untested] A slide of the recipe row to the right sends the recipe (REC-5). So does the icon button `cart-add` at the end of the row, named `Añadir a Compra` (`recipe.send`), with the same toast. A recipe with no product gives `error.recipeEmpty`; an unknown recipe gives `error.recipeNotFound`.
- Evidence: `src/ui/recipes.js:15-22`, `src/ui/recipes.js:85-89`, `src/ui/recipes.js:122-123` (the slide), `src/recipes.js:93-95`; test: `tests/recipes.test.js` "sendRecipe rejects a recipe with no products and an unknown id" (the errors only).
- Target: row action and swipe callback.

**REC-18** [core] [verified] A send takes each product, in order. When an item of that name exists in any list, with no case distinction after a trim, the item becomes "to buy" in `Compra`: it comes back from `Siguiente`, or it loses its tick, or it stays as it is; its other fields (recurrence, shops, aisle) stay. When no such item exists, a new one-time item of that name is created in `Compra` (`recurrent: false`, `bought: false`, no shop, no quantity, no aisle). An item operation error stops the send and leaves the state as it was.
- Evidence: `src/recipes.js:92-108`, `src/store.js:31-37`, `src/store.js:162-165`, `src/store.js:184-190`; test: `tests/recipes.test.js` "sendRecipe creates a one-time active item for each new product", "sendRecipe brings a saved item, unticks a bought item and leaves a pending item", "sendRecipe matches an item without case distinction and creates no duplicate", "sendRecipe unticks a ticked recurrent item and keeps it recurrent".

**REC-19** [core] [verified] The send adds the id of the recipe to the end of `sent`, one time. A send never makes a duplicate item. A send that changes no item and finds the id in `sent` already returns the same state object.
- Evidence: `src/recipes.js:106`; test: `tests/recipes.test.js` "sendRecipe records the recipe in sent one time", "sendRecipe a second time changes nothing and returns the same state", "sendRecipe of products that are all pending changes only sent".

**REC-20** [core] [stale] `added` counts the items that were created or changed; `already` counts the products that were to buy in `Compra` already (`products.length - added`). The message is `«name»: <parts>.` (`toast.sent`) with `Deshacer`, where `<parts>` is `N añadidos` / `1 añadido` (`send.added`) and `N ya estaban` / `1 ya estaba` (`send.already`), joined by `, `; a part with a count of 0 does not show.
- Spec: "The message is `«name»: N añadidos, N ya estaban.`" Code: a part of 0 is left out (`«Tortilla»: 2 añadidos.`), and the count 1 takes the singular form.
- Evidence: `src/recipes.js:103-107`, `src/ui/recipes.js:8-13`, `src/ui/recipes.js:17-19`, `src/locales/es.js:108-109`, `src/locales/es.js:229`; test: `tests/recipes.test.js` "sendRecipe brings a saved item, unticks a bought item and leaves a pending item" (the counts; the text is untested).

**REC-21** [adapted] [untested] A send that returns the same state shows `«name»: todo estaba ya en la lista.` (`toast.sentNothing`) and keeps the `Deshacer` of the toast on the screen, whatever operation made it; with no toast on the screen it has no `Deshacer`.
- Evidence: `src/ui/recipes.js:21`, `src/ui/context.js:176-192`; test: untested.
- Target: snackbar that carries the current undo snapshot.

**REC-22** [core] [untested] `sent` lasts until **Terminar compra** empties it (TRIP-3). The row of a recipe has no "sent" mark.
- Evidence: `src/store.js:97`; test: untested in this area (see `tests/store.test.js`).

## Dishes with no recipe

**REC-36** [core] [verified] Below the recipes, `Recetas` shows the dishes of the menu (MENU-2) under the head `Platos sin receta` (`recipes.dishes`) with their number. Each dish shows one time (no case distinction), with the spelling of its first meal, in menu order. With no dish the head does not show.
- Evidence: `src/menu.js:55-64`, `src/ui/list.js:177-181`; test: `tests/menu.test.js` "menuDishes gives each dish of the menu one time, in menu order, with its number of meals".

**REC-37** [adapted] [untested] A dish row shows the name and the meta line `En N comidas del menú` / `En 1 comida del menú` (`count.menuMeals`). It has no slide. A tap on the name or on the button with a chef's hat (icon `book`, title `Crear receta`) turns the dish into a recipe (MENU-17) and opens its sheet (REC-33), with `Deshacer` and the message `Receta creada: «name».` (`toast.recipeCreated`). The text of that button for a screen reader is `Crear la receta de «name»` (`row.createRecipe`).
- Evidence: `src/ui/recipes.js:129-152`; test: untested.
- Target: row composable with no swipe.

## Search

**REC-23** [adapted] [verified] `Recetas` has a search when one recipe or one dish of the menu (REC-36) exists at least. It opens and closes as the search of `Compra`: from 600px wide with the search button of the header (LIST-20, LIST-21), below 600px with the search button of the dock (SHOP-26, LIST-37). The field is **Buscar receta o producto** (`recipes.search`). It filters the list while the user types.
- Evidence: `src/sections.js:54-55`, `src/ui/list.js:157-174`; test: `tests/sections.test.js` "canSearch is true for Compra with an item and for Recetas with a recipe or a dish", "canSearch is false for an empty Compra, an empty Recetas, Menú and Ajustes".
- Target: `SearchBar` / text field in the top bar or the dock.

**REC-24** [core] [verified] A recipe matches when its name or one of its products contains the text, with no case and no accent distinction (`fold`: trim, lower case, NFD, diacritics removed). A dish matches when its name contains the text. An empty text (or only spaces) shows all recipes and all dishes, in their order.
- Evidence: `src/recipes.js:189-193`, `src/menu.js:55-64`, `src/store.js:135-140`; test: `tests/recipes.test.js` "searchRecipes returns all recipes for an empty query", "searchRecipes matches a part of the recipe name", "searchRecipes matches a product, in insertion order", "searchRecipes makes no case and no accent distinction"; `tests/menu.test.js` "menuDishes keeps the dishes whose name contains the query, with no case or accent distinction".

**REC-25** [core] [verified] With no match the list shows `Ninguna receta coincide con «text».` (`empty.noMatch`, text trimmed), with no button.
- Evidence: `src/sections.js:71-72`, `src/ui/list.js:137`; test: `tests/sections.test.js` "emptyAction of a recipe search with no match has no action".

**REC-26** [adapted] [untested] The text of the search is not stored. A change of section closes the search and clears its text.
- Evidence: `src/ui/nav.js:20`; test: untested.
- Target: `ViewModel` field reset on navigation.

## Sample recipe

**REC-27** [core] [verified] The sample recipe has the fixed id `sample-pasta`, so it stays the sample after a rename or an edit. Its name and products are in the language of the screen at the time it is added: `Pasta con salsa de tomate`, with `Salsa de tomate`, `Pasta`, `Ajo`, `Aceite de oliva` and `Sal` (`sample.*`). The products are trimmed; empty ones and case duplicates go. It has no link, goes last in `recipes`, and is not put in the menu. The walkthrough sends it to `Compra` as REC-18 and REC-19 do (ONB-13).
- Evidence: `src/recipes.js:196-218`, `src/locales/es.js:181-186`; test: `tests/recipes.test.js` "addSample adds the sample recipe with its fixed id, products and no link", "addSample keeps the recipes that exist and adds the sample last", "addSample drops empty and duplicate products", "loadSample adds the sample recipe and sends its products to Active", "loadSample brings an item that exists instead of a copy", "hasSample is true for the renamed sample recipe".

**REC-28** [core] [verified] The add of the sample changes nothing (same state object) when the sample exists, when its name is empty, or when a recipe has its name with no case distinction (DATA-4). Then the walkthrough sends nothing.
- Evidence: `src/recipes.js:202-204`, `src/recipes.js:213-215`; test: `tests/recipes.test.js` "addSample returns the same state when the sample exists", "addSample returns the same state when a recipe has its name, with no case distinction", "addSample returns the same state for an empty name", "loadSample returns the same state when the sample is not added".

## Effects

**REC-29** [adapted] [untested] A new recipe row opens, flashes and scrolls into view, below its sheet.
- Evidence: `src/ui/add.js:98`, `src/app.js:127`; test: untested.
- Target: `LazyListState.animateScrollToItem` and `Modifier.animateItem`.

**REC-30** [adapted] [untested] A delete from the row closes the recipe row (200 ms) before the recipe goes. A second tap in that time does nothing.
- Evidence: `src/ui/recipes.js:96-99`, `src/ui/motion.js:64-71`, `src/ui/context.js:42`; test: untested.
- Target: exit animation; a guard set of leaving keys.

**REC-31** [adapted] [untested] A new product row of the sheet opens and flashes. A removed product row closes before it goes.
- Evidence: `src/ui/recipes.js:30-35`, `src/ui/recipes.js:59`; test: untested.
- Target: `animateItem` in the product list.

**REC-32** [adapted] [untested] A recipe or a product that `Deshacer` puts back opens and flashes.
- Evidence: `src/app.js:247-256`; test: untested.
- Target: enter animation keyed by row key.

## Sheet

**REC-33** [adapted] [untested] The sheet `Receta` comes up from the bottom over a veil, as the edit sheet (ROW-7). Its title is the recipe name. It has the field **Nombre**, 80 characters at most, the field **Enlace** (REC-13, no length limit), then the products (REC-9 to REC-11), and the foot of NAV-22 (**Eliminar**, `Guardado`). `Enter` or a loss of focus saves a field; an error shows its message and the field shows the stored value again. `Escape` in a field puts the stored value back and keeps the sheet open. A rename has no message and no `Deshacer`.
- Evidence: `index.html:315-327`, `src/ui/recipes.js:172-196`, `src/ui/recipes.js:206-214`, `src/ui/controls.js:56-80`; test: `tests/markup.test.js` "the edit and recipe sheets have a foot with Eliminar and Guardado; the other sheets have none".
- Target: `ModalBottomSheet`; `BackHandler` in a field restores the value.

**REC-34** [adapted] [untested] A tap on the veil, **Listo**, a drag down, `Escape` or the back button closes the sheet. It closes when its recipe goes (a `Deshacer`, an import, a delete) and when the section changes.
- Evidence: `src/ui/recipes.js:163-166`, `src/ui/recipes.js:207`, `src/app.js:84`, `src/ui/nav.js:20`; test: untested.
- Target: sheet state holds a recipe id; a missing recipe closes it.

## Limits

No quantity, unit, step, photo or category. No choice of products at send time. No rename of a
product: remove it and add it again. No order of recipes or of products.
