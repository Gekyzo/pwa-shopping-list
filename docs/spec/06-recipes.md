# Recipes

Rules of `src/recipes.js` and of the section `Recetas` in `src/ui/recipes.js`. The groups by recipe
in `Compra` are in [04-arrange.md](04-arrange.md).

## Recipe

- **REC-1** A recipe is a name, a list of product names and an optional link. It has no
  quantities, no steps and no photo.
- **REC-2** The name is trimmed and not empty (`error.nameRequired`), and unique among the recipes
  with no case distinction (`error.duplicateRecipe`).
- **REC-3** The `+` button in `Recetas` opens the add sheet with the field `Nombre de la receta`
  and the button **Crear**, with no target choice. The new recipe opens its sheet (REC-33), with
  the cursor in its product field, and the search is cleared.
- **REC-4** A recipe row shows the name and, below it, the meta line `N productos`, then
  `en la lista` when REC-35 applies and `con enlace` when the recipe has a link (REC-15), joined by
  ` · `. A tap on the name opens the sheet of the recipe (REC-33). The send button of REC-17 stays at the
  end of the row.
- **REC-5** A recipe row slides as an item row (ROW-4 to ROW-6, ROW-8, ROW-10). A slide to the
  left shows **Eliminar**, an icon button 64 px wide with its name under the icon. Its text for a screen reader
  is `Eliminar {name}`. A slide to the right sends the recipe at the
  release (REC-17), with the rule and the backdrop of ROW-11 and the icon `cart-add`.
- **REC-6** A delete removes the recipe, its id from `sent` and its meals from the menu. It has
  `Deshacer`. The items that the recipe sent stay in the lists.
- **REC-7** The recipes show in the order of their creation. Below 600px wide they stand in one column; from
  600px in two, filled row by row, so more of them fit on the screen of a tablet or an unfolded phone.
- **REC-35** A recipe whose products are all items of `Compra`, ticked or not, with no case
  distinction, adds `en la lista` to its meta line (REC-4). A recipe with no products has no such
  text. The rule of "all in `Compra`" is the one of the groups by recipe (GROUP-5).

## Products

- **REC-8** A product is a name, trimmed and not empty (`error.productRequired`), unique in its
  recipe with no case distinction (`error.duplicateProduct`).
- **REC-9** The sheet of a recipe lists its products under **Productos**, with no line above
  it, each with a `✕` button, and the field **Añadir producto**. The removal of a product has `Deshacer`; the add does not.
- **REC-10** While the user types a product, the recipe lists up to 5 names that contain the text,
  with no case and no accent distinction: the names of the items, then the products of the
  recipes, each name one time with no case distinction, with the spelling of the item first. The
  products of the recipe do not show. The exact match goes first, then the names that start with
  the text. A tap adds that name.
- **REC-11** After an add the product field is empty and keeps the focus, for the next product.
- **REC-12** A product is text. It does not create an item, and a later rename of an item does not
  change it (DATA-11).

## Link

- **REC-13** The link is edited in the field **Enlace** of the sheet of the recipe. It saves as the
  field **Nombre** (REC-33). An empty text removes the link. A text that gives the same address
  changes nothing.
- **REC-14** A text with no scheme gets `https://`. Only an `http` or `https` address is valid,
  with no space and a host name of two parts at least, such as `example.com`; another text gives
  `error.invalidLink`. A stored link that is not valid becomes empty (STORE-7).
- **REC-15** A recipe with a link adds `con enlace` to its meta line (REC-4). The sheet of the
  recipe shows an icon button with a chain symbol beside the field **Enlace** while the recipe has a
  link. It opens the address in a new browser context, with `noopener noreferrer`.
- **REC-16** A save and a removal of a link have `Deshacer`.

## Send to `Compra`

- **REC-17** A slide of the recipe row to the right sends the recipe (REC-5). So does the icon
  button `cart-add` at the end of the row, named `Añadir a Compra`, with the same toast. A recipe with no product gives `error.recipeEmpty`.
- **REC-18** For each product, in order:
  - an item with that name exists, with no case distinction: the item becomes "to buy" in `Compra`
    (it comes back from the saved items, or it loses its tick, or it stays as it is);
  - no such item exists: a one-time item with that name is created in `Compra`.
- **REC-19** The send adds the id of the recipe to `sent`, one time. A send never makes a
  duplicate item.
- **REC-20** The message is `«name»: N añadidos, N ya estaban.` with `Deshacer`. `añadidos` counts
  the items that were created or changed; `ya estaban` counts those that were to buy in `Compra`
  already.
- **REC-21** A send that changes nothing shows `«name»: todo estaba ya en la lista.` and keeps the
  `Deshacer` of the send that is still on the screen.
- **REC-22** `sent` lasts until **Terminar compra** (TRIP-3). The row of a recipe has no "sent"
  mark.

## Dishes with no recipe

- **REC-36** Below the recipes, `Recetas` shows the dishes of the menu (MENU-2) under the head
  `Platos sin receta` with their number. Each dish shows one time, with the spelling of its first
  meal, in menu order. With no dish the head does not show.
- **REC-37** A dish row shows the name and the meta line `En N comidas del menú`. It has no slide.
  A tap on the name or on the book button at the end turns the dish into a recipe (MENU-17) and
  opens its sheet (REC-33), with `Deshacer` and the message `Receta creada: «name».` The text of
  the book button for a screen reader is `Crear la receta de «name»`.

## Search

- **REC-23** The field **Buscar receta o producto** shows when one recipe or one dish of the menu
  (REC-36) exists at least. It filters the list while the user types.
- **REC-24** A recipe matches when its name or one of its products contains the text, with no case
  and no accent distinction. A dish matches when its name contains the text. An empty text shows
  all recipes and all dishes.
- **REC-25** With no match the list shows `Ninguna receta coincide con «text».`
- **REC-26** The text of the search is not stored. A change of section clears it.

## Sample recipe

- **REC-27** The sample recipe has the fixed id `sample-pasta`, so it stays the sample after a
  rename or an edit. Its name and products are in the language of the screen at the time it is
  added: `Pasta con salsa de tomate`, with `Salsa de tomate`, `Pasta`, `Ajo`, `Aceite de oliva`
  and `Sal`. It has no link, goes last in `recipes`, and is not put in the menu. The walkthrough sends
  it to `Compra` as REC-18 and REC-19 do (ONB-13).
- **REC-28** The add of the sample changes nothing when the sample exists, or when a recipe has
  its name with no case distinction (DATA-4).

## Effects

- **REC-29** A new recipe row opens, flashes and scrolls into view, below its sheet.
- **REC-30** A delete closes the recipe row before the recipe goes. A second tap in that time does
  nothing.
- **REC-31** A new product row of the sheet opens and flashes. A removed product row closes before it goes.
- **REC-32** A recipe or a product that `Deshacer` puts back opens and flashes.

## Sheet

- **REC-33** The sheet `Receta` comes up from the bottom over a veil, as the edit sheet (ROW-7).
  It has the field **Nombre**, 80 characters at most, the field **Enlace** (REC-13), then the
  products (REC-9 to REC-11). `Enter` or a loss of focus saves a field; an error shows its message
  and the field shows the old value again. `Escape` in a field puts the value back and keeps the
  sheet open. A rename has no `Deshacer`.
- **REC-34** A tap on the veil or `Escape` closes the sheet. It closes when its recipe goes, by a
  `Deshacer` or an import, and when the section changes.

## Limits

No quantity, unit, step, photo or category. No choice of products at send time. No rename of a product: remove it and add it again. No order of recipes or of products.
