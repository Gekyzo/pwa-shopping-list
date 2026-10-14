# Order, groups and the manual move

Rules of `setSort`, `setGroup`, `reorderItems` and `sortItems` in `src/store.js`, of
`recipeGroups` in `src/recipes.js`, of `shopGroups` in `src/shops.js`, of `src/reorder.js`, and of
the arrange sheet in `src/app.js`.

## Arrange sheet

- **SORT-1** The button at the right of the header opens the sheet **Agrupar y ordenar**. It shows
  only in `Actual` and in `Próxima`, and only when the sheet has a choice to offer: a grouping
  (GROUP-2) or an order (SORT-3).
- **SORT-2** The sheet stays open after a choice, so that the group and the order change in one
  visit. A tap out of the sheet or `Escape` closes it.

## Order

- **SORT-3** **Ordenar por** has **Nombre** and **Personalizado**. It shows when the view has two
  items or more.
- **SORT-4** One choice, `sort`, applies to the two lists. The default is `custom`.
- **SORT-5** **Personalizado** is the order of `items`: the insertion order, changed by the moves
  of the user. A new item goes to the end.
- **SORT-6** **Nombre** is alphabetical with no case and no accent distinction. It does not change
  `items`.
- **SORT-7** In `Actual` the items to buy come before the ticked items in each order.
- **SORT-8** The order also applies inside each group. The recipes and their products have no
  order choice.
- **SORT-9** A change of order has no message and no `Deshacer`. The rows move to their new places
  with an animation.

## Groups

- **GROUP-1** **Agrupar por** has **Recetas**, **Tiendas** and **Nada**. One choice, `group`,
  applies to the two lists. The default is `recipe`.
- **GROUP-2** A choice shows only when the view can show it:
  - **Recetas**: in `Actual`, when one recipe group exists at least (GROUP-5).
  - **Tiendas**: when an item of the view has a shop, and not in a shop list (SHOP-19).
  - **Nada**: each time that one of the two shows.
- **GROUP-3** A view that cannot show the stored choice shows a flat list, and the sheet marks
  **Nada**. The stored choice does not change. Example: with `group: 'recipe'`, `Próxima` is flat.
- **GROUP-4** A tap on the choice that the view shows already changes nothing. Thus a tap on
  **Nada** in a view that is flat by GROUP-3 keeps the stored grouping for the other list.

### By recipe

- **GROUP-5** The groups of `Actual` are, in this order:
  1. each recipe of `sent`, in send order;
  2. each other recipe that has products and whose products are all in `Actual`, ticked or not.
- **GROUP-6** The members of a group are the items of `Actual` whose name is a product of the
  recipe, with no case distinction. A group with no member does not show.
- **GROUP-7** An item of two recipes shows in the two groups. One tick takes it out of both.
- **GROUP-8** The head of a group shows the name of the recipe and `ticked/total`, or `✓` when all
  its members are ticked. The group lists only the members to buy.
- **GROUP-9** The items to buy that are in no group show below the head `Otros`.
- **GROUP-10** The ticked items show one time each in `N comprados`, with no group.

### By shop

- **GROUP-11** The groups are the shops of the items of the view, in name order. The head of a
  group of `Actual` has the count of GROUP-8; a head of `Próxima` has no count.
- **GROUP-12** An item of two shops shows in the two groups.
- **GROUP-13** The items with no shop show below the head `Sin tienda`.
- **GROUP-14** A row in a list by shop does not show the shops of the item below its name.

### Effect

- **GROUP-15** When a grouping opens, the heads and the extra rows open and the other rows move.
  When the choice goes to **Nada**, the groups close first and then the list becomes flat. A tap
  on a grouping while the groups close keeps them.

## Manual move

- **MOVE-1** A hold of a finger of 400 ms on a row lifts it. With a mouse, a vertical drag of
  10 px lifts it with no hold. The phone vibrates for 10 ms.
- **MOVE-2** A finger that moves 10 px before the hold ends does not lift the row: it scrolls the
  list or slides the row.
- **MOVE-3** A row moves only among the rows of its scope:

  | View | Rows that move | Scope |
  |---|---|---|
  | `Actual`, flat | Items to buy | The items to buy |
  | `Actual`, grouped | Items to buy | The group of the row, or `Otros` / `Sin tienda` |
  | `Próxima`, flat | Items of `list: 'next'` | Those items |
  | `Próxima`, by shop | Items of `list: 'next'` | The group of the row |

- **MOVE-4** A ticked row and a row `comprado hoy` do not move. A row does not move while its side
  menu is open or its name is in edit. A scope of one row does not move. No row moves while the
  search field of the list has a text (LIST-22): the hidden rows have no place on the screen.
- **MOVE-5** The scope is the run of rows of the same scope that are next to the lifted row. In
  the order **Nombre**, a row `comprado hoy` can be between two rows of `Próxima`; a move does not
  pass it.
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
products, no move with the keyboard, no different choice for each list.
