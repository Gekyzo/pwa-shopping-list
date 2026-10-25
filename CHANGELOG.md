# Changelog

Technical changes of the app, by deployed version. The newest version is first. What a user sees
of a version goes to [`release-notes/`](release-notes/), in each language of the app. The names of
the screen are the Spanish ones, as in [`docs/spec/`](docs/spec/README.md).

A change that is not deployed goes under `Unreleased`, in the commit that makes the change. The
commit `Bump version to X.Y.Z` gives its version and its date to those changes. A version with
no change has no entry.

## Unreleased

- Access per app (ACC-3, ACC-4, ACC-7): the server serves several apps with one account
  (`pwa-server` migration 5, `apps` and `app_access`). Each sign-in and each refresh reads the
  access row of `shopping`; with no row the app creates a `pending` one. `user.approved` of the
  session is that row, approved. `users.approved` of the server only mirrors the row for 1.6.0
  and goes away later. Deploy order: the server first (done 2026-10-25), then the app.
  `npm run pair` approves the pair through the access row.

## 1.6.0 - 2026-10-25

- Deploy order of separate shared lists: the `pwa-server` migration 4 (`scope`, `cancelled` and
  `ownerName` of `shopping_shares`) deploys first, then the app. An app that runs before the
  migration sends `scope` and `cancelled` to a server that has no such field. `docs/two-users.md`
  holds the two-user check of the feature, with the offline check.
- Namespaced shared ids in the combined state (SHARE-12): `combine` gives each id of the shared
  part, and each reference to one (a meal's `recipe`, `sent`), the prefix `shared:`; `split`
  takes it away. Before, an id of both lists (the walkthrough sample `sample-pasta`, an item of
  an imported backup) sent a `sent` id to both parts, opened the own recipe for a tap on the
  shared one and ticked or deleted the item in both lists. `onList` gives its operation the shared
  part with the ids of the screen and gives a combined `id` back.
- Manual reorder in one list (SHARE-15): `reorderList(state, ids, sharedBase, scope)` of
  `src/lists.js` (`reorderOf` of `ui/context`) runs `reorderItems` in the list of the moved rows,
  in the order of the screen (the own `sort`). Before, `ui/drag` ran it on the combined state: in
  the name order it sorted the items of both lists and wrote a new order of the shared list. A
  move of the shared list in the name order also switches the own order to custom.
- `Llenar cesta` of a member (MENU-20): `fillLists(state, sharedBase, scope, newId)` of
  `src/lists.js` (`fillMenus` of `ui/context`) runs `fillMenu` in the own list, then in the
  shared list under scope `all`, and sums `added` and `already`. Before, it filled the own list
  only, so a member with an empty own menu got `error.menuEmpty` with the shared meals on the
  screen. `error.menuEmpty` now comes only when both menus are empty.
- Review fixes of the member's screen: the `Compartir lista` count of `Ajustes` counts the pending
  and joined people only (SHARE-9); the scope button of a person has the label
  `share.scopeChange` (`{current} — …{email}`), which starts with its text (SHARE-9, WCAG 2.5.3);
  while the list chips show, the entry of all shops is `shops.allShops` (new key) in the shop
  chips, the dock and its picker (SHARE-14), and the dock chip is a flex chip, so a long name ends
  in an ellipsis; the list tag is `pill ghost` (`tagNode` of `ui/rows`); the foot of the meal
  sheet hides with neither a dish nor one meal (MENU-20); the rename and the link of a recipe
  sheet do nothing when the recipe is gone.
- Scope and states in the sheet `Compartir lista` (SHARE-5, SHARE-8, SHARE-9): the invite form
  has two chips `#share-scope` (`list` chosen at each open) and `invite(email, scope)` sends the
  chosen one. Each person row shows the state of `personState` (`share.cancelled` new) and
  `share.scopeOf`; the scope of an active person is a button that calls `setScope` with
  `otherScope` (new in `src/shares.js`, with `scopeOf`); a cancelled row has `share.reinvite`
  (`reinvite`) beside ✕. The invitee and the member see the scope (`#share-invited-scope`,
  `#share-member-scope`); new accept texts `share.acceptWarning` and `share.acceptAsk`. The
  syncer status gets `narrowed` beside `left`: a narrowed scope counts there and `ui/account`
  shows `share.narrowed` instead of `share.left` (SHARE-7). New keys `share.scopeLabel`,
  `share.scope.list`, `share.scope.all`, `share.scopeOf`, `share.scopeChange`,
  `share.cancelled`, `share.reinvite`, `share.narrowed`; `share.text` names the choice.
- Tags and list routing in `Recetas` and `Menú` (REC-38, MENU-20): with scope `all` the recipe
  rows, the dish rows, the meals and the chips of the meal sheet show the `pill` tag of their list
  (`recipeTag` of `ui/view`, one `tagNode` of `ui/rows` for the whole app). New `listPart(state,
  which)` in `src/lists.js` gives the entities of one list; each list has its own week, so a slot
  shows up to two meals and the meal sheet lists both in `#meal-planned`, each with its own
  Quitar (`menu.removeMeal`). A send, an edit and a delete of a recipe run through
  `onListOf(listOf(recipe))`; a new recipe and a dish through `onOwn`; a dish turns into a recipe
  of the list of its menu; `setMeal` runs in the list of the recipe, `clearMeal` in the list of the meal;
  `clearMenu` on the own list. `onList` gives back the same combined state when its
  operation changes nothing (REC-21).
- List chips of a member in `Compra` (SHARE-14, SHARE-15): `ui.listChoice` (`null` | `'own'` |
  `'shared'`, not stored, reset by `setSharing(null, null)`) filters the combined state through
  `listView` before the shop list, so the shop chips, the dock and its picker show the shops of
  that list. New `#list-chips` row (`list-chips` component) with the counts of `listCounts`; in
  **Todas** a `pill` tag in the end slot of each row and no manual reorder. Adds run through
  `onListOf(targetList(choice))` and a rename through the list of its item (`listOf`); the
  suggestions and `findByName` read the target list only. New keys `lists.all`, `lists.own`,
  `lists.ownTag`, `lists.label`.
- Two-lane syncer (SHARE-6, SHARE-7, SHARE-8, SHARE-13): each run syncs the own space, then the
  shared space of a share whose member is the user, with the same push, pull and merge; the own
  space is always the user's, and the swap of space is gone. `createSyncer` takes `getShared` and
  `setShared(state | null, share | null)`; new `notifyShared`, `decline`, `setScope` and
  `reinvite`; `leave` and `decline` cancel the share, `remove` deletes it. `status()` drops `space`
  and gains `shared`; `pending` counts both queues. A start or an end of the share, a narrowed
  scope (recipes and meals dropped, no delete queued) and a widened scope (a pull in full) apply at
  each run. With scope `list` the shared lane sends items only. A device of v1.5.0 in a shared
  space moves that data to the shared keys and pulls its own space in full. `targetSpace` is
  removed. Until the screen shows both lists, `src/ui/account.js` saves the shared state with
  `saveSharedState` and the sheet declines with `decline`.
- The screen works on the combined state (SHARE-12, SYNC-9): `src/ui/context.js` holds `sharing`
  and `sharedBase`, and `commit` splits each save into the own part (`shopping.v1`, `notify`) and
  the shared part (`shopping.shared.v1`, `notifyShared`); the after-commit function takes
  `(own, shared, options)`. `replaceState` takes the own part, `setSharing(share, shared)` is the
  `setShared` of the syncer, `ownState` and `onOwn` serve the backup, the walkthrough sample and
  the delete of the sample. Export holds the own list only; import replaces the own part only. A
  member sees the shared items in `Compra` with no tag yet.
- Storage of the shared space (SHARE-12): keys `shopping.shared.v1`, `shopping.shared.sync` and
  `shopping.shared.queue`; `loadSharedState` and `saveSharedState`; `loadSyncState`, `saveSyncState`,
  `loadQueue` and `saveQueue` take a `lane` (`own` or `shared`); the shared sync state stores the
  `scope`. A stored share of v1.5.0 loads with `ownerName` '', `scope` `all` and `cancelled` false.
- Rules and client calls for the scope and the cancelled state of a share (SHARE-11): `shareOf`
  maps `ownerName`, `scope` and `cancelled`; `invite` takes a scope; new `cancelShare`,
  `setShareScope` and `reinvite`; `src/shares.js` has `sharedSpace`, `listName` and `personState`,
  and ignores cancelled shares. `share_taken` maps to `share.error.taken`.
- `npm run pair` (`scripts/pair.mjs`): user A on `localhost:8081` and user B on `localhost:8082`,
  each origin with its own storage, on the local `pwa-server` with the two users approved. It
  needs both origins in `PB_ORIGINS` of `pwa-server/dev.env`.

## 1.5.0 - 2026-10-25

- Share the data of an account by email (SHARE-1 to SHARE-10). A new collection `shopping_shares`
  on the server (`pwa-server` migration 3) holds the invites; the rules of `shopping_records` let a
  member act on the records of the owner. The sync state stores the space, each sync lists the
  shares before the push, and a change of space sends the own queue first or drops the queue of a
  shared space. New: `src/shares.js`, `src/ui/share.js`, the sheet `Compartir lista`, the banner of
  an invite. Cache `shopping-shell-v24`.

## 1.4.1 - 2026-10-24

- `Solicitar acceso` and `Esperando aprobación` name the administrator, not Ciro, as the one who approves an account; the 1.4.0 release notes say the same.
- A 429 of the server is the client error `rate`, not `server`. The syncer keeps the queue and the online status on it, and retries after 5 s, 15 s, 30 s and then every 60 s; a 5xx also retries, and still shows the offline note (`src/pocketbase.js`, `src/syncer.js`, SYNC-3, SYNC-11).
- The row `Cuenta` of `Ajustes` stacks the email and the last sync (`account-row`, ACC-10): the two spans overlapped at 390 px; a long email wraps anywhere in the row.
- The offline note clears when a sync reaches the server (the `reached` counter of the sync status grows while the note shows), and at `visibilitychange` to visible when `navigator.onLine` is true: some Android phones send no `online` event after airplane mode (`src/ui/account.js`, `src/app.js`, SYNC-11).
- Cache `shopping-shell-v23`, so that a phone with 1.4.0 installed takes the shell of these fixes.

## 1.4.0 - 2026-10-24

- Accounts and sync: the screens `Iniciar sesión`, `Solicitar acceso` and `Esperando aprobación` (`src/ui/account.js`), email and Google sign-in against PocketBase, the sync of the list between the devices of one account (queue, pull, realtime stream), the note `Sin conexión · cambios guardados`, the banner `Inicia sesión para sincronizar` of a device with a list and no session, and the row `Cuenta` of `Ajustes`. With a session the import and `Borrar todos los datos` ask `import.confirmAccount` and `reset.confirmLocal`. The walkthrough offers the sample recipe only while the state has no items and no recipes, so it adds nothing to an account after a login. Cache `shopping-shell-v22`.
- Release notes: `release-notes/<lang>.md`, one file per catalog, released with the version by `npm run release`, which stops when the languages disagree. The app shows the unseen versions in a What's new sheet after an update (`nextSeen`, seen version in storage) and every version from Settings › Help. This file is now the technical record.

## 1.3.5 - 2026-10-24

- The message that shows after an action, with its `Deshacer`, is a raised card in the colours of the screen. It is no longer a black box in light and a white box in dark.
- A privacy page, `privacy.html`, says what the app stores on the device and, with an account, on the server, and how to have it deleted.

## 1.3.4 - 2026-10-23

- In `Secciones de la tienda`, a new name for a section is saved again when the field loses the focus or on `Enter`, and `Escape` puts the old name back.

## 1.3.3 - 2026-10-23

- In `Agrupar y ordenar`, the knob of `Agrupar por` covers the whole chosen option, also when the view shows only two of the four groupings.
- In `Secciones de la tienda`, the up arrow of the first section and the down arrow of the last one look disabled, in place of a grey fill that looked pressed.
- The sections of `Secciones de la tienda` look like the rows of a list: across the sheet, the name with no box and one line below each row. The line of the section in edit is dark.
- In `¿Terminar la compra?`, a space separates `Seguir comprando` from `Terminar compra`.

## 1.3.2 - 2026-10-23

- The main action colour is green again, as before 1.3.0: the `+`, the main buttons and **Atrás** are green in place of terracotta. The drawings of the introduction take the same colour.

## 1.3.1 - 2026-10-23

- The head of a group shows its count as `1 de 4` and ends with a chevron icon: down while the group is open, right while it is closed. `Comprados (N)` has the same chevron.
- The name of a day in `Menú` is 14px, as the other heads.
- The names of the fields of a sheet stand above their boxes, and the titles `Tiendas` and `Sección` of the edit sheet look the same. `Repetir en cada compra` lines up with the fields.
- `Terminar compra` on the green banner is a white button, so it no longer looks disabled.
- The heads of `Ajustes` and `Comprados (N)` are in the colour of the text.
- With the left hand, the line below a row starts at the name, no longer under the pencil.
- New app icon: an orange shopping bag with bread, greens, a tomato and milk. The logo of the walkthrough is the same art.

## 1.3.0 - 2026-10-23

- A screen reader names the bar below the title of `Compra` with its subtitle, such as
  `3 de 5 comprados`.
- **Terminar compra** in the banner `¿Has terminado?` and **Siguiente** in the card of a shop with
  everything bought are grey buttons: the `+` stays the one terracotta button.
- On a phone, the end of the list in `Compra` and `Recetas` stops just above the bar with the `+`,
  with no empty room below it.
- In a list with checks, the line between two items starts at the text, after the check.
- A message at the bottom of the screen is black (white with dark colours), no longer dark green.
- The banner `Versión X disponible` in **Ajustes** is grey; the banner `¿Has terminado?` stays green.
- On a phone, **Llenar cesta** in `Menú` shows its full name.
- In the sheet `¿Terminar la compra?`, **Ajustes** is an underlined word inside the sentence.
- In `Compra`, the head of a recipe group has the same grey band as the other heads, and its
  count is grey and lighter.
- **Ajustes** shows its rows across the full width of the screen, under grey bands, in place of
  white cards.
- **Seguir comprando**, **Añadir la receta de ejemplo** and the other second buttons are grey
  buttons; only a button that deletes keeps a frame.
- Text is a little smaller, as in the new look. A sheet title is smaller and keeps to one line;
  button labels are less bold. A check is a square, chips and fields are white boxes
  with a grey border, and the bottom bar and the bar above it take the colour of the ground.
- `Compra` and `Recetas` no longer show the basket behind the list. In `Menú` the name of a day
  is a plain head, a planned meal is a white tile and a free meal has a dashed grey frame; a full
  day no longer changes colour. A control named in the walkthrough is bold, in the colour of the
  text.
- The bottom bar shows the name of each section under its icon, with new icons. **Listo** in the head of a sheet is now a grey button.
- On a phone the `+` button is the last button of the bar above the bottom bar, in place of the
  round button over the list. The bar shows in `Recetas` also with no search; its `+` creates a
  recipe. With **Izquierda** the `+` is at the left end. On a wider screen nothing changes.
- `Compra` shows a thin green bar below its title, with the share bought, in place of the ring. The
  other sections show no bar.
- A new look: a stone ground, white lists and the font Geist. The add button is terracotta; the
  progress, a bought item and `Al día` in **Ajustes** stay green. The head of a group is no longer
  in capitals. The bar of the phone takes the colour of the ground.
- `Menú`: **Vaciar menú** stands again beside **Llenar cesta**, at the bottom of the list. The
  header of `Menú` has no `⋮` button and no sheet `Menú`.
- An empty `Compra` looks like an empty `Recetas`: the title `Aún no hay artículos`, a text and the
  button **+ Añadir artículo** in place of `Toca + para añadir un artículo.`
- An empty `Compra` or `Recetas` shows its title and its text in the middle of the list; its buttons
  stay at the bottom.

## 1.2.5 - 2026-10-21

- In **Ajustes**, **Al terminar la compra** looks like a switch: a track, and a green knob that slides to **Descartar** or **Aplazar**.
- In **Ajustes**, the ring of a focused first or last row follows the round corners of its group. Before, the ring of **Idioma** was cut at the top and square at the bottom.

## 1.2.4 - 2026-10-20

- In `Compra` by recipe, a slide of the head of a recipe to the right ticks all its products.

## 1.2.3 - 2026-10-20

- The bottom bar shows the icon of each section with no name.
- The icon of `Ajustes` is a gear.
- The search of `Recetas` opens from a search button, as the search of `Compra`: in the bar
  above the bottom bar on a phone, in the header on a wider screen.
- In `Compra` by recipe, a recipe whose products are all ticked no longer shows its group.

## 1.2.2 - 2026-10-19

- The update no longer deletes the offline copy of another app of the same site, such as Stash.

## 1.2.1 - 2026-10-19

- In the sheet of a meal with a dish, **Crear receta** and **Quitar** stand side by side, and **Crear receta** is a primary button at the side of the hand.

## 1.2.0 - 2026-10-19

- In `Menú`, a meal can hold a dish with no recipe: type its name in the sheet of the meal and tap **Añadir «name» sin receta**. **Crear receta** in the sheet of the dish turns it into a recipe of `Recetas` and opens it, to add its products. **Llenar cesta** skips a dish. `Menú` shows the week also with no recipe.
- `Recetas` lists the dishes of `Menú` with no recipe under **Platos sin receta**. A tap on one creates its recipe and opens it.
- A slide of a row to the left shows **Editar**, **Repetir** and **Eliminar** while the finger moves, not only after the release.
- The product field of a recipe also suggests the products of the other recipes, not only the items of the lists.
- In **Compra** by recipe, an item of two recipes shows **También en «recipe»** below its name in each group, so the two rows read as one product.
- **Ajustes** has **Borrar todos los datos** in **Copia de seguridad**. After a confirmation, it deletes the lists, the recipes, the menu, the sections and the preferences, and the app starts again with the introduction.
- With the sample recipe, the empty **Compra** list offers **+ Añadir artículo** as its main button, which opens the add sheet. **Añadir la receta de ejemplo** becomes a second button below it, on a solid background.
- The empty **Compra** list no longer repeats `La lista está vacía` below the header.
- **Empezar** of the introduction, with **Añadir la receta de ejemplo** on, also puts the ingredients of the sample recipe in **Compra**.

## 1.1.0 - 2026-10-19

- Review fixes: an idle switch is darker and easier to see, a row of **Preferencias** shows a ring when the keyboard reaches it, **Añadir** of a shop or a section stays off while its field is empty, **Vaciar menú** off sends the focus to **Listo**, and the short day of **Compacta** shows in capitals.
- The address parameter `?lang=pseudo` shows every text longer and accented, to check that the layout holds. It is not a language of Ajustes and is never stored.
- The introduction has **Atrás** at the top left and **Saltar** at the top right, and one wide **Siguiente** at the bottom. The icon shows on the first page only, no button has a ring when it opens, and the controls named in a text show as bold accent text, not as boxes. The drawings and texts no longer show the old **↻** button at the end of a row.
- On a phone, the shop list and the search move to a dock above the bottom bar, in thumb reach: **‹** and **›** step to the previous and next shop with items, the shop chip opens a list of the shops, and the search opens there with **Cancelar**, matches nearest the field. The ring shows the items left and the subtitle **T de N comprados**; Ajustes has no ring. The **+** button gets smaller while the list scrolls down. **Escape** and the back button close the top sheet, open row or search first. From 840px the recipes stand in two columns and a sheet opens at the side; the rail follows the hand on every screen. **Compacta** also makes the bars shorter.
- The trip sheet asks **¿Terminar la compra?** and lists where the items go, one row with an icon and a count for each outcome; the banner says the same. **Seguir comprando** closes it, and **Ajustes** in its hint opens Ajustes. A shop list with everything bought shows **«shop»: todo comprado**, a button to the next shop with items (**Siguiente: shop (n) →**) and **Ver todas las tiendas**.
- An empty section shows a title and a text in the lower half of the screen, and a wide button with its next step: **+ Crear receta**, **Ir a Recetas**, **+ Añadir «name»** after a search with no match, or **Añadir ingredientes de «name»** with the sample recipe. The sheet of a meal keeps its height while its results change.
- `Ajustes` shows its settings as groups of rows. **Idioma**, **Mano**, **Tema** and **Densidad** are in **Preferencias** and show their value; a tap on the row opens the list. A pending update shows as a banner with a wide **Actualizar** button.
- In `Menú`, **Llenar cesta** stays at the bottom of the list. **Vaciar menú** moved to the `⋮` button of the header. In the compact density the days show a short name above their meals, and a meal name takes two lines.
- The buttons and rows are larger, the corners are softer, and the hint in Ajustes no longer stretches its lines.
- Each sheet has a head with its title and **Listo**, and a drag down closes it. The edit and recipe sheets show **Eliminar** at the bottom, and **Guardado** after a change.
- The add input stays at the bottom with the suggestions above it, and **Crear** sits next to it. A name that is on the list already shows a note under the input, not a toast.
- A tap on a row of Compra ticks it, and a pencil button at its end opens **Editar**. A slide to the left shows **Editar**, **Repetir** and **Eliminar** with their names, and a recurrent item says **↻ cada compra** under its name. The first row slides a little once to show that it slides. The edit sheet has the switch **Repetir en cada compra**.
- A recipe row has one send button at its end, and its line says if the recipe is on the list or has a link. The link opens from the recipe sheet.

## 1.0.39 - 2026-10-18

- **Densidad** in `Ajustes`: `Compacta` makes the rows of the lists and of `Recetas` lower, so
  more of them fit on one screen. In `Menú` it puts the name of each day beside its meals, so the
  whole week fits on the screen of a phone.
- On a tablet, an unfolded phone or a phone on its side, the bottom bar becomes a rail at the side
  of the hand chosen in **Mano**, and the lists, the sheets and the introduction form one centred
  column. A phone on its side gives more height to the list. On a phone held upright nothing
  changes.
- The installed app turns with the phone or the tablet; it is no longer held upright.
- On a tablet or an unfolded phone, `Menú` shows the name of each day beside its meals, so the
  whole week fits on the screen.
- On a tablet or an unfolded phone, `Recetas` shows the recipes in two columns.

## 1.0.38 - 2026-10-18

- A long press on the icon of the installed app shows four shortcuts: **Añadir artículo**,
  **Compra**, **Recetas** and **Menú**.

## 1.0.37 - 2026-10-17

- In `Recetas`, a recipe whose products are all in `Compra` shows a cart in its row.
- `Compra` no longer ends with `Volver a comprar`. The items that a trip takes out of the list stay
  stored: the add sheet still finds them, as `comprado antes · añadir`, and a tap brings one back.
  To delete one, bring it back, then **Eliminar**.
- `Próxima` is gone: the app has one list, `Compra`, which was `Actual`. The bottom bar has four
  sections, and the add sheet has no `Para hoy` / `Para la próxima` choice.
- The next trip comes from `Compra` itself. At **Terminar compra** an item with `↻` comes back
  not ticked, and an item not bought stays with `Aplazar`.
- **Al terminar la compra** is `Aplazar` at first. A user who wants the old behaviour picks
  `Descartar` in `Ajustes`.
- The `+ Próxima` button of a ticked item is gone. To keep an item for the next trip, mark it
  with `↻` or do not tick it.
- The items that were in `Próxima`, and the ticked items with `✓ Próxima`, are in `Compra`, not
  ticked, after the update.
- The **Módulos** group of `Ajustes` is gone. `Recetas` and `Menú` are always in the bottom bar,
  also on a phone that had them off.

## 1.0.36 - 2026-10-17

- `Opciones de la compra` counts the items of `Actual` by where each one goes, such as `2 con ↻
  vuelven · 1 sin comprar se aplaza · 4 se guardan en Volver a comprar`. The counts add up to the
  items of `Actual`, and the line below only says that `Ajustes` changes what happens to the items
  not bought.

## 1.0.35 - 2026-10-17

- **Terminar compra** in `Opciones de la compra` is a button that finishes with one tap. Above it,
  the sheet shows `N vuelven · N se descartan` and a line that says what happens to the items not
  bought, as **Al terminar la compra** sets, and that `Ajustes` can change it.

## 1.0.34 - 2026-10-17

- The app is now called **Bodega**.
- `Ajustes` has **Secciones de la tienda**: the sections of the store, such as `Lácteos`, in the
  order of your walk. Add, rename, move and delete them, or start with **Usar secciones
  habituales**.
- `Editar` sets the section of an item, below its shops.
- **Agrupar por** has **Secciones**: the list follows the order of the sections, also in a shop
  list. The search of a list also finds the items of a section.
- **Terminar compra** asks what to do with each item not bought: **Descartar** it to `Volver a
  comprar` or **Aplazar** it in `Actual`. **Al terminar la compra** in `Ajustes` sets the first
  choice with two buttons, **Descartar** and **Aplazar**, and a line that says what the choice is for. The entry
  **Terminar compra** counts the items that `se descartan`.

## 1.0.33 - 2026-10-16

- `Actual`, `Próxima` and `Recetas` show a faint drawing of the basket of the app icon in the
  bottom corner, on the other side of the `+` button.

## 1.0.31 - 2026-10-16

- **Terminar compra** keeps for the next trip only the items with `↻` or `+ Próxima`. It saves
  the other items of `Actual`, bought or not, in place of a delete or a carry-over. They are at the
  end of `Actual` and of `Próxima`, under `Volver a comprar`, and the add sheet finds them. A slide to the right brings one back to the
  list, with its shops and its quantity.
- A tap on the head of a group (a recipe, `Otros`, a shop) closes and opens its rows.
- The section of the ticked items reads `Comprados (N)`, in the form of `Volver a comprar (N)`.

## 1.0.30 - 2026-10-16

- A new app icon, drawn in the style that the family of apps shares.

## 1.0.29 - 2026-10-15

- `Ajustes → Aplicación → Instalar la aplicación` installs the app when Chrome offers it.

## 1.0.28 - 2026-10-15

- The app has an install id of its own, so the other apps of the site can be installed next to it.
  Install it again once: uninstall the old icon, then install from Settings.

## 1.0.27 - 2026-10-15

### Changed

- A recipe row has no send button. A slide of the row to the right sends the recipe.
- The link icon of a recipe row is smaller.
- The title **Productos** of the recipe sheet has no line above it.

## 1.0.26 - 2026-10-15

### Fixed

- A link with spaces, or with no domain such as `example.com`, is not valid any more.

### Changed

- A tap on a recipe opens its sheet from the bottom: the name, the link and the products. The
  link is a field of the sheet, no longer a dialog of the browser.
- A recipe row slides as an item row: to the left for **Eliminar**, to the right to send it to
  `Actual`. The `⋯` button goes.

## 1.0.25 - 2026-10-14

### Added

- The walkthrough has two new pages: `¿Qué comemos esta semana?`, and `Una receta para
  empezar` with the switch **Añadir la receta de ejemplo**, on by default. **Empezar** then adds
  the recipe `Pasta con salsa de tomate`.
- `Ajustes` has **Borrar la receta de ejemplo** while the sample recipe exists.

### Changed

- A recipe or a product that you add, or that `Deshacer` puts back, opens and flashes. One that
  you delete closes its row before it goes.
- The texts of the walkthrough are new and more friendly. The first page says that `Próxima`
  fills itself with what you always buy.
- The button **Comprar siempre** of a row shows the circular arrow of the walkthrough.

## 1.0.24 - 2026-10-14

### Changed

- The app icon of the walkthrough is larger, has no white square behind it, and sits in the
  middle of the space above the drawing.

## 1.0.23 - 2026-10-14

### Changed

- In `Ajustes`, the buttons of **Copia de seguridad** are **Exportar** and **Importar**, so their
  text stays on one line.
- The walkthrough shows the app icon at the top of its pages.

## 1.0.22 - 2026-10-14

### Changed

- The page **Desliza una fila** of the walkthrough says that a slide to the right in `Próxima`
  moves the item to `Actual`.

## 1.0.21 - 2026-10-14

### Changed

- The name of the installed app and its description follow the language of `Ajustes`. Android
  shows the new name after the next update of the app, and can ask to confirm it.
- The spaces, text sizes and corners of all screens follow one scale, so the same kind of part
  looks the same on each screen.
- The icons come from one set: the cart of **Llenar la cesta** and of a recipe is the cart of the
  bottom bar with a `+`, and the icons of the rows and of `Ajustes` are a little larger.

## 1.0.20 - 2026-10-14

### Added

- Each item has a quantity, such as `2` or `1 kg`. Set it in the field **Cantidad** of `Editar`;
  the row shows it after the name.

### Changed

- In `Editar`, the shops of the item are under a line and the title **Tiendas**.
- The fields of `Editar` keep their name in sight: it moves onto the border of the field when
  the field has a value.
- In `Menú`, **Llenar la cesta** is at the side of the hand: at the right with `Derecha`, at
  the left with `Izquierda`.
- In `Menú`, **Vaciar menú** and **Llenar la cesta** each take half of the line.
- In `Recetas`, the cart button that sends a recipe has the colour of **Llenar la cesta**.
- In `Recetas`, the `⋯` buttons are **Nombre**, **Enlace** and **Eliminar**, each a third of the
  line.

## 1.0.19 - 2026-10-14

### Fixed

- The version symbol in `Ajustes` is centred on the line of the version.

## 1.0.18 - 2026-10-14

### Changed

- The version symbols in `Ajustes` have colours: green when up to date, amber for an update,
  red with no connection, grey while it checks.

## 1.0.17 - 2026-10-14

### Changed

- The status of the version in `Ajustes` is a symbol: a turning arrow while it checks, a check
  when up to date, a struck-out cloud with no connection. An update keeps its text, with a down
  arrow, in the accent colour.

## 1.0.16 - 2026-10-14

### Changed

- A new app icon: a bag of groceries with bread, greens, a tomato and milk.
- The version in `Ajustes` is plain text at the foot, with no heading and no group.

## 1.0.15 - 2026-10-14

### Changed

- `Exportar copia` and `Importar copia` in `Ajustes` are side by side.

## 1.0.14 - 2026-10-14

### Fixed

- The arrow of the dropdowns in `Ajustes` has a margin from the right edge.

## 1.0.13 - 2026-10-14

### Added

- **Buscar receta o producto** in the sheet of a meal in `Menú`. It filters the recipes while you
  type.

### Changed

- The file of **Exportar copia** has the time in its name, as `compra-2026-10-14-090507.json`. Two
  exports of one day no longer get the same name.

## 1.0.12 - 2026-10-14

### Changed

- A tap on the name of an item opens the sheet `Editar`, with the name and the shops. The slide to
  the right no longer shows **Renombrar** and the shops. A tap on the name no longer ticks; the
  checkbox ticks.
- A slide of an item to the right ticks it in `Actual`, with `Deshacer`, and moves it to `Actual`
  from `Próxima`. A short slide puts the row back.

## 1.0.11 - 2026-10-14

### Added

- **Tema** in `Ajustes`: `Automático` follows the phone, `Claro` and `Oscuro` keep the light or
  the dark colours.
- **Módulos** in `Ajustes`: a switch turns off `Próxima`, and a switch turns off `Recetas` with
  `Menú`. A module that is off keeps its data. The switch-off of `Próxima` brings its items to
  `Actual`, with `Deshacer`. A section that goes breaks into dust in the bottom bar,
  and a section that comes back forms from dust.
- **Listas por tienda** in `Actual` and `Próxima`: a row of chips below the header, `Todas`, each
  shop and `Sin tienda`, shows the list of one shop. An item of two shops is in the two lists,
  and a tick in one is a tick in the other. A shop list with nothing left points to the next
  shop, and an add from a shop list puts that shop on the item. **Agrupar y ordenar** hides
  and shows the row.

### Changed

- The button `⋮` of `Actual` opens its options as a sheet from the bottom, as the arrange
  button does, in place of a menu below the button.
- **Saltar** of the walkthrough moves from the top to the bottom bar, at the left of
  **Siguiente**, each half of the bar wide. With **Mano** `Izquierda` it is at the right.

## 1.0.10 - 2026-10-14

### Added

- The section `Menú`, between `Recetas` and `Ajustes`: a week with a lunch and a dinner for each
  day. A tap on a meal chooses its recipe. **Llenar la cesta** puts the products of all the
  recipes of the menu in `Actual`, with `Deshacer`. **Vaciar menú** empties the week.

## 1.0.9 - 2026-10-13

### Added

- A walkthrough of four pages at the first start of a new install: the two lists, the trip, the
  slide of a row and the slide between sections. **Ayuda → Ver la introducción** in `Ajustes`
  shows it again.
- **Mano** in `Ajustes`. With `Izquierda` the `+` button, the buttons of the header and the
  controls of a row change side, for a phone held in the left hand.

### Changed

- The name of the app is Grocely. It replaces `Lista de la compra` and `Compra`. The title of the
  page and the full name of the installed app are `Grocely - Lista de la compra`.
- **Exportar copia** and **Importar copia** have an icon in `Ajustes`.
- The icon of the app has a new drawing of the bag of vegetables, with flat colours.
- **Terminar compra** is in the menu of a new button with three dots, in the header of `Actual`.
  `Ajustes` does not have the group **Compra**.

## 1.0.8 - 2026-10-13

### Changed

- The icon of the app is a bag of vegetables. It replaces the white check mark on green.

## 1.0.7 - 2026-10-13

### Added

- A search field in `Actual` and `Próxima`. It filters the items of the list, the ticked items
  included.
- A text that shows when no item matches the search.

### Changed

- The manual move of a row is off during a search.

## 1.0.6 - 2026-10-13

### Added

- Shops. An item has a sheet for its shops, and the shop field suggests the shops in use.
- The group choice `Tiendas`, which groups `Actual` or `Próxima` by shop.

### Changed

- The stored state is version 3. The app migrates an older state and an older backup.

## 1.0.5 - 2026-10-13

### Added

- Seven languages: Spanish, English, Catalan, German, French, Italian and Portuguese.
- A language setting in `Ajustes`.

## 1.0.4 - 2026-10-13

### Added

- A horizontal slide changes the section. The content of the new section comes in from its side.

## 1.0.3 - 2026-10-13

### Added

- A hold on a row moves it, to change the order of a list.

### Changed

- The group choice and the order choice are in a sheet of the header.
- The insertion order has the name `Personalizado`.
- A move of a row in the order `Nombre` changes the order to `Personalizado`.

### Fixed

- Three states where a row move could lock the list or tick an item.

## 1.0.2 - 2026-10-12

No change of the app. The repository stopped tracking the Claude files and the planning documents.

## 1.0.1 - 2026-10-12

### Changed

- `Actual` groups the items of a recipe only when all the products of the recipe are in the list.

## 1.0.0 - 2026-10-12

The first version with a version number. It has all the work before it.

### Added

- The lists `Actual` and `Próxima`, with recurrent items and one-time items.
- One add field that searches the items and creates a new one.
- A collapsed section for the ticked items.
- Side menus for the actions of an item, which a swipe on the row shows.
- A toggle on each row for the recurrent mark.
- Recipes: a name, a list of products and an optional link. The product field suggests the items
  that exist.
- The send of a recipe to `Actual`, with an undo on a second tap.
- A choice to group `Actual` by recipe.
- A search field in `Recetas`.
- A choice to order `Actual` and `Próxima` by name.
- A message with the count of `Actual` when the app starts with `?arrival` in the URL.
- The data in `localStorage`, with the export and the import of a backup.
- Offline use and installation on Android, with a manifest, icons and a service worker.
- The version in `Ajustes`, compared with the deployed version, and **Actualizar**.
- The user interface in Spanish.
