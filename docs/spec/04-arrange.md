# Order, groups and the manual move

Rules of `setSort`, `setGroup`, `reorderItems` and `sortItems` in `src/store.js`, of
`recipeGroups` in `src/recipes.js`, of `shopGroups` in `src/shops.js`, of `aisleGroups` in `src/aisles.js`, of `src/reorder.js`, and of
the arrange sheet in `src/ui/arrange.js`.

## Arrange sheet

- **SORT-1** The button at the right of the header opens the sheet **Agrupar y ordenar**. It shows
  only in `Compra`, and only when the sheet has a choice to offer: a grouping
  (GROUP-2) or an order (SORT-3).
- **SORT-2** The sheet stays open after a choice, so that the group and the order change in one
  visit. A tap out of the sheet or `Escape` closes it.

## Order

- **SORT-3** **Ordenar por** has **Nombre** and **Personalizado**. It shows when the view has two
  items or more.
- **SORT-4** One choice, `sort`, applies to `Compra`. The default is `custom`.
- **SORT-5** **Personalizado** is the order of `items`: the insertion order, changed by the moves
  of the user. A new item goes to the end.
- **SORT-6** **Nombre** is alphabetical with no case and no accent distinction. It does not change
  `items`.
- **SORT-7** In `Compra` the items to buy come before the ticked items in each order.
- **SORT-8** The order also applies inside each group. The recipes and their products have no
  order choice.
- **SORT-9** A change of order has no message and no `Deshacer`. The rows move to their new places
  with an animation.

## Groups

- **GROUP-1** **Agrupar por** has **Recetas**, **Tiendas**, **Secciones** and **Nada**. One choice, `group`,
  applies to `Compra`. The default is `recipe`.
- **GROUP-2** A choice shows only when the view can show it:
  - **Recetas**: when one recipe group exists at least (GROUP-5).
  - **Tiendas**: when an item of the view has a shop, and not in a shop list (SHOP-19).
  - **Secciones**: when an item of the view has an aisle, also in a shop list (GROUP-17).
  - **Nada**: each time that one of the others shows.

  The sheet also has the choice of the row of shop lists (SHOP-25). The arrange button shows when
  the sheet has one choice at least.
- **GROUP-3** A view that cannot show the stored choice shows a flat list, and the sheet marks
  **Nada**. The stored choice does not change. Example: with `group: 'shop'` and no
  item with a shop, `Compra` is flat.
- **GROUP-4** A tap on the choice that the view shows already changes nothing. Thus a tap on
  **Nada** in a view that is flat by GROUP-3 keeps the stored grouping.

### By recipe

- **GROUP-5** The groups of `Compra` are, in this order:
  1. each recipe of `sent`, in send order;
  2. each other recipe that has products and whose products are all in `Compra`, ticked or not.
- **GROUP-6** The members of a group are the items of `Compra` whose name is a product of the
  recipe, with no case distinction. A group with no member does not show.
- **GROUP-7** An item of two recipes shows in the two groups. One tick takes it out of both.
- **GROUP-20** A row of an item to buy that shows in two recipe groups or more adds
  `También en «recipes»` below its name: the names of the other groups, in group order, joined by
  `, `. So two rows read as one product. The groups count before a search, so a search keeps the
  text.
- **GROUP-8** The head of a group shows the name of the recipe and `ticked/total`, or `✓` when all
  its members are ticked. The group lists only the members to buy.
- **GROUP-9** The items to buy that are in no group show below the head `Otros`.
- **GROUP-10** The ticked items show one time each in `Comprados (N)`, with no group.

### By shop

- **GROUP-11** The groups are the shops of the items of the view, in name order. The head of a
  group has the count of GROUP-8.
- **GROUP-12** An item of two shops shows in the two groups.
- **GROUP-13** The items with no shop show below the head `Sin tienda`.
- **GROUP-14** A row in a list by shop does not show the shops of the item below its name.

### By aisle

- **GROUP-17** The groups are the aisles of the items of the view, in the order of `aisles`
  (AISLE-1), not in name order. The heads have the counts of GROUP-11. A shop list can show its
  items by aisle: at one shop, the list follows the walk through it.
- **GROUP-18** An aisle with no item in the view does not show. The items with no aisle show last,
  below the head `Sin sección`.
- **GROUP-19** A row in a list by aisle shows its shops (SHOP-7), as in a flat list.

### Effect

- **GROUP-15** When a grouping opens, the heads and the extra rows open and the other rows move.
  When the choice goes to **Nada**, the groups close first and then the list becomes flat. A tap
  on a grouping while the groups close keeps them.
- **GROUP-16** A tap on the head of a group (a recipe, `Otros`, a shop, `Sin tienda`, an aisle or `Sin sección`) closes the
  rows of the group in 200 ms. The head stays, with its count and the chevron `▸`; a second tap opens
  the rows again in 200 ms. The list keeps its closed groups until the app starts again. A search
  shows each group open and disables its head (LIST-25).

## Manual move

- **MOVE-1** A hold of a finger of 400 ms on a row lifts it. With a mouse, a vertical drag of
  10 px lifts it with no hold. The phone vibrates for 10 ms.
- **MOVE-2** A finger that moves 10 px before the hold ends does not lift the row: it scrolls the
  list or slides the row.
- **MOVE-3** A row moves only among the rows of its scope:

  | View | Rows that move | Scope |
  |---|---|---|
  | `Compra`, flat | Items to buy | The items to buy |
  | `Compra`, grouped | Items to buy | The group of the row, or `Otros` / `Sin tienda` / `Sin sección` |

- **MOVE-4** A ticked row does not move. A row does not move while its side
  menu is open or its name is in edit. A scope of one row does not move. No row moves while the
  search field of the list has a text (LIST-22): the hidden rows have no place on the screen.
- **MOVE-5** The scope is the run of rows of the same scope that are next to the lifted row. A
  move does not pass a row of another scope.
- **MOVE-6** The lifted row follows the pointer and stays inside its scope. It takes the place of a
  neighbour when its leading edge passes the centre of that neighbour. The other rows open a gap.
- **MOVE-7** A pointer within 56 px of the top or the bottom of the list scrolls the list.
- **MOVE-8** The release writes the new order: the moved items exchange their places in `items`,
  and each other item keeps its place. A release at the start place writes nothing.
- **MOVE-9** A move in the order **Nombre** changes `sort` to `custom`. The custom order then
  starts from the alphabetical order of all items, with the move.
- **MOVE-10** The message is `Orden cambiado.`, or `Orden cambiado a «Personalizado».` for
  MOVE-9, with `Deshacer`.
- **MOVE-11** `Escape`, a lost pointer and a render of the list end the move with no change.
- **MOVE-12** The click that follows a release does not tick the item.

## Limits

No move between groups, no move of a ticked row, no order of the shops, no order of recipes or
products, no move with the keyboard.
