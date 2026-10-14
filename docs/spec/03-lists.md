# Lists

Rules of `src/store.js`, and of the rows and the add sheet in `src/app.js`.

## Items

- **LIST-1** A new item has a name that is trimmed and not empty. An empty name gives
  `error.nameRequired`.
- **LIST-2** A name that an item has already, in either list, gives `error.duplicateItem` with the
  name and the list of that item (DATA-3).
- **LIST-3** An item created in `Actual` is one-time. An item created in `Próxima` is recurrent.
- **LIST-4** A new item goes to the end of `items`, with no shop, not ticked.
- **LIST-5** A rename has the rules LIST-1 and LIST-2. The item keeps its own name without an
  error. A rename to the same text changes nothing.
- **LIST-6** A name field of the screen takes 80 characters at most. The store has no limit.
- **LIST-7** The recurrent mark shows on each row of the two lists. A tap changes `recurrent` and
  clears `again`.
- **LIST-8** A delete removes the item. Its shops go with it.
- **LIST-9** A move puts the item in the other list, not ticked, with `again` cleared. `recurrent`
  does not change.

## Tick

- **LIST-10** Only an item of `Actual` can be ticked. `Próxima` has no checkbox.
- **LIST-11** A tap on the checkbox or on the name of a row of `Actual` changes `bought`. Each
  change clears `again`.
- **LIST-12** A tick does not delete the item. The item goes to the section `N comprados` at the
  end of `Actual`, which is closed at first. A tap on that row opens and closes it.
- **LIST-13** A tick has `Deshacer`, because the row leaves the place where the finger is. A tap
  on a ticked item removes the tick with no `Deshacer`.
- **LIST-14** A ticked one-time item has the button `+ Próxima`. A tap sets `again`, and the button
  shows `✓ Próxima`. A second tap clears it. A ticked recurrent item has no such button.

## The `Próxima` view

- **LIST-15** `Próxima` shows the items of `list: 'next'`, then the ticked items of `Actual` that
  are recurrent or have `again`. In the order **Nombre** the two parts are one sorted list.
- **LIST-16** A row of the second part has the mark `comprado hoy`.
- **LIST-17** **Quitar de Próxima** on a row of the second part clears `recurrent` and `again`. The
  item stays ticked in `Actual`. On an item of `list: 'next'` the same operation is a delete; the
  screen shows **Mover a Actual** and **Eliminar** for that row instead.
- **LIST-18** A list with items ends with the hint `Un artículo con ↻ activo vuelve aquí al
  comprarlo.`
- **LIST-19** The bottom bar shows the count of the `Próxima` view beside its name. Zero shows
  nothing.

## Trip

- **TRIP-1** **Terminar compra** is available when an item is ticked or an item is in
  `list: 'next'`. If not, the operation gives `error.nothingToStart`.
- **TRIP-2** **Terminar compra** does this to each item:

  | Item | Result |
  |---|---|
  | Ticked, recurrent or with `again` | Stays in `Actual`, not ticked, `again` cleared |
  | Ticked, one-time, no `again` | Deleted |
  | In `Actual`, not ticked | Stays |
  | In `list: 'next'` | Moves to `Actual` |

- **TRIP-3** **Terminar compra** empties `sent`. `group` and `sort` do not change. The relative
  order of the items that stay does not change.
- **TRIP-4** The control shows in three places:
  1. A banner `¿Has terminado?` in `Actual`, when the list has items and all are ticked. Its text
     gives the count that comes back and the count that is deleted.
  2. The entry of the trip sheet of `Actual` (NAV-9), with `N vuelven · N se van`. It is disabled
     when TRIP-1 does not hold.
  3. The button `Traer N artículos de Próxima`, in the empty state of `Actual`, when items wait in
     `list: 'next'`. Its message is `Artículos traídos de Próxima.`
- **TRIP-5** After **Terminar compra** the screen shows `Actual`. `Deshacer` restores the full
  state of before.

## Header figures

| Section | Title | Subtitle | Ring |
|---|---|---|---|
| `Actual` | `Compra de hoy` | `La lista está vacía`, `Todo comprado` or `Quedan N artículos` | `ticked/total`, filled to that share |
| `Próxima` | `Próxima compra` | `N artículos`, plus `N comprados hoy` when there are some; `Nada preparado` when empty | The count of the view |
| `Recetas` | `Recetas` | `N recetas` or `Sin recetas` | The count of recipes |
| `Ajustes` | `Ajustes` | `Grocely` | `⚙` |

## Add sheet

The `+` button opens the sheet in `Actual`, `Próxima` and `Recetas`. In `Recetas` it creates a
recipe (see [06-recipes.md](06-recipes.md)). The button does not show in `Ajustes` or while a
sheet is open.

- **ADD-1** The sheet has a name field, the button **Añadir** and the target choice **Para hoy** /
  **Para la próxima**. The target starts as `Próxima` when the sheet opens from `Próxima`, and as
  `Actual` if not.
- **ADD-2** While the user types, the sheet lists up to 5 items whose name contains the text, with
  no case or accent distinction: the exact match first, then the names that start with the text,
  then the others.
- **ADD-3** Each listed item says where it is and what a tap does:

  | Target | State of the item | Text | Effect of the tap |
  |---|---|---|---|
  | `Actual` | In `list: 'next'` | `en Próxima · traer` | Moves to `Actual` |
  | `Actual` | Ticked | `ya comprado · repetir` | Removes the tick |
  | `Actual` | To buy in `Actual` | `ya en la lista` | Nothing |
  | `Próxima` | In the `Próxima` view | `ya en Próxima` | Nothing |
  | `Próxima` | Ticked, not in the view | `comprado · añadir a Próxima` | Sets `again` |
  | `Próxima` | To buy in `Actual` | `en Actual · mover` | Moves to `Próxima` |

- **ADD-4** When no item has the typed name, the list ends with `+ Crear «name»`, which does the
  same as **Añadir**.
- **ADD-5** **Añadir** with the name of an item that exists does the effect of ADD-3 for that item.
  It never creates a duplicate.
- **ADD-6** An effect that changes the state shows `"name" ya existe. Ahora está en <list>.` with
  `Deshacer`. An effect that changes nothing shows `"name" ya está en <list>.`
- **ADD-7** A new item shows `"name" añadido a <list>.` with no `Deshacer`.
- **ADD-8** After each add the sheet stays open, with an empty field that has the focus, so that
  the user adds several items in one visit. A tap out of the sheet or `Escape` closes it.
- **ADD-9** When the target is the list on the screen, the row of an item that the sheet brought
  flashes and scrolls into view.

## Search

- **LIST-20** The header of `Actual` and of `Próxima` has a search button, at the left of the
  arrange button. It shows when the view has one item at least.
- **LIST-21** A tap on the button opens the field **Buscar artículo o tienda** with the focus. A
  second tap, `Escape`, or a loss of focus with an empty field closes it. A close clears the text.
- **LIST-22** The list shows only the items whose name or one of whose shops contains the text,
  with no case and no accent distinction. An empty text shows all items.
- **LIST-23** The order and the grouping stay. A group with no match to buy does not show. The
  count of a group head, the header figures and the count of the bottom bar stay those of the
  full list.
- **LIST-24** The text of the search is not stored. A change of section closes the search. An add
  from the add sheet closes it too, so that the row of the item is in view.
- **LIST-25** In `Actual` the search filters the ticked items too. `N comprados` counts the ticked
  matches and shows open while the field has a text, and its head does not close it in that time.
  With no ticked match the head does not show.
- **LIST-26** With no match the list shows `Ningún artículo coincide con «text».` The button
  `Traer N artículos de Próxima` and the hint of LIST-18 do not show.

## Limits

No quantity, no unit, no note. No add of several items from one text. No ranking of the results of
a list search, and no match by the recipe of an item.
