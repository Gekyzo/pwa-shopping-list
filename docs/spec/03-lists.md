# Lists

Rules of `src/store.js`, and of the rows and the add sheet in `src/ui/rows.js` and `src/ui/add.js`.

## Items

- **LIST-1** A new item has a name that is trimmed and not empty. An empty name gives
  `error.nameRequired`.
- **LIST-2** A name that an item has already, in `Compra` or saved, gives `error.duplicateItem` with
  the name and the list of that item (DATA-3).
- **LIST-3** A new item is one-time and goes to `Compra`.
- **LIST-4** A new item goes to the end of `items`, with no shop, no quantity, not ticked.
- **LIST-5** A rename has the rules LIST-1 and LIST-2. The item keeps its own name without an
  error. A rename to the same text changes nothing.
- **LIST-6** A name field of the screen takes 80 characters at most. The store has no limit.
- **LIST-7** The recurrent mark `↻` shows on each row of `Compra`. A tap changes `recurrent`.
- **LIST-8** A delete removes the item. Its shops go with it.
- **LIST-9** Removed: `Compra` is the only list, so an item has no other list to move to.

## Quantity

- **LIST-27** An item has a quantity: free text, such as `2`, `1 kg` or `3 latas`, or none. The
  quantity is trimmed; an empty text clears it. The same text changes nothing.
- **LIST-28** A tick, **Terminar compra** and a bring back of a saved item keep the quantity. A
  delete removes it with the item.
- **LIST-29** The search of a list does not match the quantity (LIST-22).

## Tick

- **LIST-10** Only an item of `Compra` can be ticked. A saved item gives `error.onlyActiveTick`.
- **LIST-11** A tap on the checkbox or a slide to the right (ROW-11) of a row of `Compra` changes
  `bought`.
- **LIST-12** A tick does not delete the item. The item goes to the section `Comprados (N)` at the
  end of `Compra`, which is closed at first. A tap on that row opens and closes it.
- **LIST-13** A tick has `Deshacer`, because the row leaves the place where the finger is. A tap
  on the checkbox of a ticked item removes the tick with no `Deshacer`.
- **LIST-14** Removed: a ticked one-time item has no mark that keeps it for the next trip. `↻`
  and `Aplazar` do that.

## Removed: the second list

- **LIST-15** Removed: the app has one list, `Compra`.
- **LIST-16** Removed: the app has one list, `Compra`.
- **LIST-17** Removed: the app has one list, `Compra`.
- **LIST-18** Removed: the app has one list, `Compra`.
- **LIST-19** Removed: the bottom bar shows no count.

## Trip

- **TRIP-1** **Terminar compra** is available when an item is ticked or an item is open (TRIP-6).
  If not, the operation gives `error.nothingToStart`.
- **TRIP-2** **Terminar compra** does this to each item:

  | Item | Result |
  |---|---|
  | Ticked, recurrent | Stays in `Compra`, not ticked |
  | Ticked, one-time | Saved: `list: 'saved'`, not ticked (LIST-30) |
  | Saved | Does not change |
  | In `Compra`, not ticked, recurrent | Stays |
  | In `Compra`, not ticked, one-time | Stays in `Compra`, not ticked, with `Aplazar`, or is saved with `Descartar` (TRIP-6) |

- **TRIP-3** **Terminar compra** empties `sent`. `group` and `sort` do not change. The relative
  order of the items that stay does not change.
- **TRIP-4** The control shows in two places:
  1. A banner `¿Has terminado?` in `Compra`, when the list has items and all are ticked. Its text
     gives the count that comes back and the count that is saved.
  2. The button of the trip sheet of `Compra` (NAV-9), below a line that counts the items of
     `Compra` by where each one goes, such as `2 con ↻ vuelven · 1 sin comprar se aplaza · 4
     comprados salen de la lista`. Its parts, in this order: recurrent items, open items kept with
     `Aplazar`, open items saved with `Descartar`, ticked one-time items. A part with no item does
     not show. It is disabled when TRIP-1 does not hold.
- **TRIP-5** After **Terminar compra** the screen shows `Compra`. `Deshacer` restores the full
  state of before.
- **TRIP-6** An open item is an item of `Compra`, not ticked and not recurrent. **Terminar compra**
  keeps the open items in `Compra`, not ticked, when the choice of TRIP-7 is `Aplazar`. It saves
  them (LIST-30) when the choice is `Descartar`. The button of the trip sheet finishes at once.
  When an item is open, a line above the button says `Puedes cambiar qué pasa con lo no comprado
  en Ajustes.` The sheet has one step and no choice for each item. A tap on the veil closes the
  sheet and changes nothing. The banner never has an open item.
- **TRIP-7** **Al terminar la compra** of `Ajustes` has two buttons side by side: `Descartar` and
  `Aplazar`, and the chosen one is pressed. A line below the title says that the choice sets what
  happens to the items not bought: `Descartar` or `Aplazar` to the next trip. It applies to every
  open item at **Terminar compra**, and the trip sheet counts the open items with it.
  An app with no choice uses `Aplazar`.
- **TRIP-8** The choice is stored in `shopping.tripEnd`: the value `save` for `Descartar`.
  `Aplazar` removes the key. Any other stored value, such as a `keep` of an older version, reads as
  `Aplazar`. It is a preference of the device, not a part of the state: `Deshacer` and an import do
  not change it.

## Header figures

| Section | Title | Subtitle | Ring |
|---|---|---|---|
| `Compra` | `Compra de hoy` | `La lista está vacía`, `Todo comprado` or `Quedan N artículos` | `ticked/total`, filled to that share |
| `Recetas` | `Recetas` | `N recetas` or `Sin recetas` | The count of recipes |
| `Ajustes` | `Ajustes` | `Bodega` | `⚙` |

## Add sheet

The `+` button opens the sheet in `Compra` and `Recetas`. In `Recetas` it creates a recipe (see
[06-recipes.md](06-recipes.md)). The button does not show in `Ajustes` or while a sheet is open.

- **ADD-1** The sheet has a name field and the button **Añadir**. It has no target choice: an add
  always goes to `Compra`.
- **ADD-2** While the user types, the sheet lists up to 5 items whose name contains the text, with
  no case or accent distinction: the exact match first, then the names that start with the text,
  then the others.
- **ADD-3** Each listed item says where it is and what a tap does:

  | State of the item | Text | Effect of the tap |
  |---|---|---|
  | Ticked | `ya comprado · repetir` | Removes the tick |
  | To buy in `Compra` | `ya en la lista` | Nothing |
  | Saved | `comprado antes · añadir` | Goes to `Compra`, not ticked (LIST-32) |

- **ADD-4** When no item has the typed name, the list ends with `+ Crear «name»`, which does the
  same as **Añadir**.
- **ADD-5** **Añadir** with the name of an item that exists does the effect of ADD-3 for that item.
  It never creates a duplicate.
- **ADD-6** An effect that changes the state shows `"name" ya existe. Ahora está en <list>.` with
  `Deshacer`. An effect that changes nothing shows `"name" ya está en <list>.`
- **ADD-7** A new item shows `"name" añadido a <list>.` with no `Deshacer`.
- **ADD-8** After each add the sheet stays open, with an empty field that has the focus, so that
  the user adds several items in one visit. A tap out of the sheet or `Escape` closes it.
- **ADD-9** The row of an item that the sheet brought flashes and scrolls into view.

## Search

- **LIST-20** The header of `Compra` has a search button, at the left of the arrange button. It
  shows when the view has one item at least.
- **LIST-21** A tap on the button opens the field **Buscar artículo o tienda** with the focus. A
  second tap, `Escape`, or a loss of focus with an empty field closes it. A close clears the text.
- **LIST-22** The list shows only the items whose name, one of whose shops or whose aisle
  (AISLE-9) contains the text,
  with no case and no accent distinction. An empty text shows all items.
- **LIST-23** The order and the grouping stay. A group with no match to buy does not show. The
  count of a group head and the header figures stay those of the full list.
- **LIST-24** The text of the search is not stored. A change of section closes the search. An add
  from the add sheet closes it too, so that the row of the item is in view.
- **LIST-25** In `Compra` the search filters the ticked items too. `Comprados (N)` counts the ticked
  matches and shows open while the field has a text, and its head does not close it in that time.
  With no ticked match the head does not show.
- **LIST-26** With no match the list shows `Ningún artículo coincide con «text».`

## Saved items

- **LIST-30** **Terminar compra** saves each one-time item of `Compra` that is ticked, and each open
  item with `Descartar`: only `↻` (LIST-7) and `Aplazar` (TRIP-6) keep an item for the next trip.
  A saved item leaves `Compra` and keeps its name, its shops and its quantity. The screen does not
  show it, and has no delete for it: to delete it, bring it back (LIST-32), then **Eliminar**.
- **LIST-31** A saved item keeps its name (DATA-3). The add sheet finds it (ADD-3), and an add of
  its name brings it back (ADD-5). A recipe sent to `Compra` brings back a saved product.
- **LIST-32** A bring back puts a saved item in `Compra`, not ticked. `recurrent` does not change.
  A saved item cannot be ticked (LIST-10).
- **LIST-34** Removed: `Compra` has no section of the saved items (LIST-30). The add sheet is the
  only way to them (LIST-31).
- **LIST-35** Removed: a saved item has no row (LIST-34).
- **LIST-36** Removed: the search of the list (LIST-22) does not find a saved item. The search
  button shows when the list has an item.
- **LIST-33** A saved item counts in no header figure and in no trip figure.

## Limits

One list for the trip: no list for a later trip, and no mark on an item for a later trip. No unit
and no arithmetic of quantities, no quantity on the products of a recipe, no note. No add of
several items from one text. No ranking of the results of a list search, and no match by the
recipe of an item.
