# Aisles

Rules of `src/aisles.js`. An aisle is a section of the store, such as `Lácteos`. The screen names
it `Sección`; the code and this document name it aisle, because a section is a screen of the
bottom bar (NAV-1).

## Rules

- **AISLE-1** The aisles are one list of the state, `aisles`, in the order of the walk through the
  store. Unlike a shop (DATA-12), an aisle has a record: it exists with no item.
- **AISLE-2** An aisle name is trimmed. An empty name gives `error.aisleRequired`. A name that is
  an aisle already, with no case distinction, gives `error.duplicateAisle`.
- **AISLE-3** A new aisle goes to the end of the list.
- **AISLE-4** A rename also renames the aisle of each item that has it. A rename that changes only
  the case is allowed. A rename to the same name changes nothing.
- **AISLE-5** A delete removes the aisle, and each item that has it gets no aisle.
- **AISLE-6** A move changes the place of an aisle by one, up or down. A move past an end changes
  nothing.
- **AISLE-7** An item has one aisle at most. A set of an aisle takes the spelling of the list; an
  empty name clears it. A name that is not an aisle gives `error.aisleNotFound`, as a rename, a
  delete or a move of an unknown aisle does.
- **AISLE-8** The usual aisles add each of their names that is not an aisle yet, in their order.
- **AISLE-9** The search of a list (LIST-22) also matches the aisle of an item.

## Sheet `Secciones de la tienda`

- **AISLE-10** `Ajustes` has the group **Secciones** with the row **Secciones de la tienda** and the
  count of the aisles. A tap opens the sheet of the aisles. A tap out of the sheet or `Escape`
  closes it.
- **AISLE-11** The sheet lists each aisle in its order, as a name field, `↑`, `↓` and `✕`. The `↑`
  of the first aisle and the `↓` of the last are disabled.
- **AISLE-12** The name field renames the aisle when it loses the focus or on `Enter` (AISLE-4).
  `Escape` puts the name back. An error keeps the old name.
- **AISLE-13** The field **Nueva sección** with **Añadir** adds an aisle (AISLE-3). The field takes
  40 characters at most and keeps the focus after an add.
- **AISLE-14** With no aisle, the sheet shows `Añade las secciones en el orden de tu tienda.` and the
  button **Usar secciones habituales**, which adds eight aisles in the language of the screen, in
  the order of a common walk (AISLE-8).
- **AISLE-15** `✕` deletes the aisle (AISLE-5) with the message `Sección "<name>" eliminada.` and
  `Deshacer`. An add, a rename and a move have no message.

## Aisle of an item

- **AISLE-16** The edit sheet `Editar` (ROW-7) shows, below the shops, a line and the title
  **Sección**, then each aisle as a chip, in its order. The chip of the aisle of the item is
  pressed.
- **AISLE-17** A tap on a chip sets that aisle on the item (AISLE-7). A tap on the pressed chip
  clears it. The sheet stays open. The change is saved at once and has no message and no
  `Deshacer`.
- **AISLE-18** With no aisle, the sheet shows `Crea las secciones en Ajustes.`

## Limits

No aisle on the products of a recipe, and no aisle field in the add sheet. One order of the aisles
for all shops.
