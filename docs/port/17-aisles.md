# Aisles

The aisles of the store, their order of the walk, the aisle of an item, the sheet `Secciones de la
tienda` of `Ajustes` and the aisle part of the edit sheet. The screen names an aisle `Sección`.
Source: `src/aisles.js`, `src/ui/aisles.js`, `src/ui/edit.js`. The list by aisle (`aisleGroups`)
is in `04-arrange.md` (GROUP-17 to GROUP-19).

## Rules

**AISLE-1** [core] [verified] The aisles are one list of the state, `aisles`, in the order of the walk through the store. Unlike a shop (DATA-12), an aisle has a record: it exists with no item. `item.aisle` is one of them or `''`.
- Evidence: `src/aisles.js:3-4`, `src/store.js:11`; test: `tests/aisles.test.js` "addAisle appends a trimmed aisle and does not change its input".

**AISLE-2** [core] [verified] An aisle name is trimmed. An empty name (also `null` or only spaces) gives `error.aisleRequired`. A name that is an aisle already, with no case distinction (`toLowerCase`, accents count), gives `error.duplicateAisle` with the `name` of that aisle. An error leaves the state as it was.
- Evidence: `src/aisles.js:8`, `src/aisles.js:24-35`; test: `tests/aisles.test.js` "addAisle rejects an empty name", "addAisle rejects a name that differs from an aisle only by case".

**AISLE-3** [core] [verified] A new aisle goes to the end of the list.
- Evidence: `src/aisles.js:33`; test: `tests/aisles.test.js` "addAisle appends a trimmed aisle and does not change its input".

**AISLE-4** [core] [verified] A rename keeps the place of the aisle and also renames the aisle of each item (any list) that has it. A rename that changes only the case is allowed. A rename to the same name after a trim returns the same state object. A rename to the name of another aisle gives `error.duplicateAisle`; an empty name gives `error.aisleRequired`.
- Evidence: `src/aisles.js:37-45`; test: `tests/aisles.test.js` "renameAisle renames the aisle in place and on each item that has it", "renameAisle changes only the case of a name", "renameAisle to the same name returns the same state object", "renameAisle rejects an unknown aisle, an empty name and the name of another aisle".

**AISLE-5** [core] [verified] A delete removes the aisle, and each item that has it gets no aisle (`''`). Items of other aisles keep theirs.
- Evidence: `src/aisles.js:48-52`; test: `tests/aisles.test.js` "deleteAisle removes the aisle and clears it on its items".

**AISLE-6** [core] [verified] A move swaps an aisle with its neighbour: `-1` one place up, `1` one place down. A move past an end returns the same state object.
- Evidence: `src/aisles.js:55-64`; test: `tests/aisles.test.js` "moveAisle moves an aisle one place up or down", "moveAisle past an end returns the same state object".

**AISLE-7** [core] [verified] An item has one aisle at most. A set of an aisle finds it with no case distinction after a trim and stores the spelling of the list; an empty name clears it. A set to the aisle that the item has returns the same state object. A name that is not an aisle gives `error.aisleNotFound`, as a rename, a delete or a move of an unknown aisle does. An unknown item gives `error.itemNotFound`.
- Evidence: `src/aisles.js:10`, `src/aisles.js:37-39`, `src/aisles.js:48-50`, `src/aisles.js:55-57`, `src/aisles.js:67-75`; test: `tests/aisles.test.js` "setItemAisle sets the aisle of an item in the spelling of the aisle", "setItemAisle with an empty name clears the aisle", "setItemAisle to the aisle that the item has returns the same state object", "setItemAisle rejects an unknown item and an unknown aisle", "deleteAisle rejects an unknown aisle", "moveAisle rejects an unknown aisle".

**AISLE-8** [core] [verified] The usual aisles add each of their names that is not an aisle yet (trimmed, no case distinction, empty names skipped), in their order, at the end. With nothing new the state object stays the same.
- Evidence: `src/aisles.js:78-81`; test: `tests/aisles.test.js` "addDefaultAisles adds the trimmed names that are not there, in their order", "addDefaultAisles with nothing new returns the same state object".

**AISLE-9** [core] [verified] The search of a list (LIST-22) also matches the aisle of an item, with no case and no accent distinction.
- Evidence: `src/store.js:144-147`; test: `tests/store.test.js` "matchesItem matches a part of the aisle with no accent distinction".

## Sheet `Secciones de la tienda`

**AISLE-10** [adapted] [untested] `Ajustes` has the group **Secciones** (`settings.aisles`) with the row **Secciones de la tienda** (`aisles.title`), a chevron, and the count of the aisles. A tap opens the sheet of the aisles with an empty new-aisle field. A tap on the veil, **Listo**, a drag down, `Escape` or the back button closes it, and the focus goes back to the row.
- Evidence: `index.html:116-119`, `index.html:298-313`, `src/ui/aisles.js:8-18`, `src/ui/aisles.js:75-76`, `src/app.js:191`; test: untested.
- Target: settings row + `ModalBottomSheet`.

**AISLE-20** [adapted] [new] With no aisle, the row **Secciones de la tienda** shows no count (not `0`).
- Evidence: `src/ui/aisles.js:57`; test: untested.
- Target: settings row trailing text.

**AISLE-11** [adapted] [untested] The sheet lists each aisle in its order, as a name field (40 characters at most), `↑`, `↓` and `✕`. For a screen reader they are `Nombre de {name}`, `Subir {name}`, `Bajar {name}` and `Eliminar {name}` (`aisles.name`, `aisles.up`, `aisles.down`, `aisles.delete`). The `↑` of the first aisle and the `↓` of the last are disabled and faded. A tap on `↑` or `↓` moves the aisle (AISLE-6), with no message. The rows go across the sheet, as the rows of a list: the name field has no box, and one line below each row runs from the start of the name to the end.
- Evidence: `src/ui/aisles.js:23-53`, `index.html:306` (`products flush`), `styles.css` (`.flush`, commit `c90c4fe`); test: untested.
- Target: `LazyColumn` of rows with `IconButton(enabled = …)`.

**AISLE-12** [adapted] [verified] The name field renames the aisle when it loses the focus or on `Enter` (AISLE-4). `Escape` puts the old name back and keeps the sheet open. An error (an empty or a duplicate name) shows its message and keeps the old name.
- Evidence: `src/ui/aisles.js:33`, `src/ui/controls.js:56-80`, `src/aisles.js:37-45`; tests: `tests/controls.test.js` "each call of bindField passes read and write as one object (AISLE-12)", `tests/aisles.test.js` (`renameAisle`). Until the fix of 2026-10-23 the field threw a `TypeError` (Q-domain-6).
- Target: a `TextField` that saves on focus loss and on the IME action `Done`; back while it has the focus restores the old name.

**AISLE-13** [adapted] [untested] The field **Nueva sección** (`aisles.placeholder`) with **Añadir** adds an aisle (AISLE-3). The field takes 40 characters at most. After an add it is empty; it keeps the focus after an add and after an error.
- Evidence: `index.html:308-309`, `src/ui/aisles.js:78-83`; test: untested.
- Target: `OutlinedTextField` with an IME action.

**AISLE-19** [adapted] [new] **Añadir** of the new-aisle field is disabled while the field has no text after a trim.
- Evidence: `src/ui/aisles.js:69-72`, `src/ui/aisles.js:84`; test: untested.
- Target: `enabled = text.isNotBlank()`.

**AISLE-14** [adapted] [untested] With no aisle, the sheet shows `Añade las secciones en el orden de tu tienda.` (`aisles.empty`) and the button **Usar secciones habituales** (`aisles.usual`). The button adds eight aisles in the language of the screen, in this order (AISLE-8): `Fruta y verdura`, `Panadería`, `Carne y pescado`, `Lácteos y huevos`, `Despensa`, `Bebidas`, `Congelados`, `Limpieza e higiene` (keys `aisles.usual.produce`, `bakery`, `meat`, `dairy`, `pantry`, `drinks`, `frozen`, `cleaning`). It has no message, and the focus goes to the new-aisle field. With one aisle or more, the text and the button do not show.
- Evidence: `src/ui/aisles.js:6`, `src/ui/aisles.js:60-62`, `src/ui/aisles.js:85-88`, `src/locales/es.js:192-207`; test: untested.
- Target: string resources per locale; one button.

**AISLE-15** [adapted] [untested] `✕` deletes the aisle (AISLE-5) with the message `Sección "<name>" eliminada.` (`toast.aisleDeleted`) and `Deshacer`. An add, a rename and a move have no message.
- Evidence: `src/ui/aisles.js:35-38`, `src/ui/context.js:214-225`; test: untested.
- Target: snackbar with an undo action.

## Aisle of an item

**AISLE-16** [adapted] [untested] The edit sheet `Editar` (ROW-7) shows, below the shops, the title **Sección** (`edit.aisle`), then each aisle as a chip, in its order. The chip whose text is the aisle of the item is pressed.
- Evidence: `index.html:290-292`, `src/ui/edit.js:64-71`; test: untested.
- Target: `FlowRow` of `FilterChip`.

**AISLE-17** [adapted] [untested] A tap on a chip sets that aisle on the item (AISLE-7). A tap on the pressed chip clears it. The sheet stays open. The change is saved at once and has no message and no `Deshacer`; it shows `Guardado` (NAV-22).
- Evidence: `src/ui/edit.js:58-61`; test: untested.
- Target: single-select chip group with deselect.

**AISLE-18** [adapted] [untested] With no aisle, the sheet shows `Crea las secciones en Ajustes.` (`edit.noAisles`).
- Evidence: `src/ui/edit.js:70`, `index.html:292`; test: untested.
- Target: text in the sheet.

## Limits

No aisle on the products of a recipe, and no aisle field in the add sheet. One order of the aisles
for all shops.
