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

## Limits

No aisle on the products of a recipe, and no aisle field in the add sheet. One order of the aisles
for all shops.
