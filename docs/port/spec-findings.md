# Spec findings

Proposed changes to `docs/spec/`, found while the port spec was checked against the code. Each
`stale` rule quotes the spec and the code; each gap is a `new` rule of `docs/port/` that
`docs/spec/` does not have. Nothing here is applied: `docs/spec/` is unchanged.

## Across areas

- **Code defect, AISLE-12.** `src/ui/aisles.js:33` calls `bindField(input, read, write)`, but
  `src/ui/controls.js:56` takes `bindField(input, { read, write })`. The rename of an aisle in
  `Secciones de la tienda` throws a `TypeError` on blur, `Enter` or `Escape`. This is a defect of
  the code, not of the spec (Q-domain-6). **Fixed on 2026-10-23.**
- **Source moved during the review.** The agents read `45dabc4`…`f822a77`; HEAD is now `296a2ec`.
  The commits between change `styles.css`, `index.html:306`, `docs/spec/17-aisles.md` (AISLE-11)
  and the version. AISLE-11 of `docs/port/` has the new wording.
- **Convention documents are stale.** `.claude/conventions/ARCHITECTURE.md` names the cache
  `shopping-shell-v17` (the code has `v19`), the lists `Actual` and `Próxima`, and leaves out five
  preference keys. `CANONICAL.md` gives a state shape with no `menu` or `aisles`.
- **`package.json:4`** describes features that do not exist: synced and shared lists, AI item
  entry, purchase history and a pantry.
- **Orientation.** PROD-3 and VER-14 say portrait; `manifest.webmanifest` has
  `orientation: any`, as INS-4 says.

## Product, data model and storage (PROD, DATA, STORE, BACKUP)


- **PROD-3** (`01-product.md`) — Spec: "The manifest locks the installed app to portrait." Code: `manifest.webmanifest:10` has `"orientation": "any"` (commit `c7517f3`), covered by `tests/spec.test.js` "the installed app turns with the device (INS-4)". Proposed: "The layout is for a phone in portrait. The installed app turns with the device (INS-4)."
- **PROD-9** (`01-product.md`) — Spec: "The import of a backup is the exception: it asks first, and it also has `Deshacer`." Code: **Borrar todos los datos** also asks (`src/ui/settings.js:173`), with no `Deshacer` (BACKUP-7). Proposed: "A destructive action has no confirmation. `Deshacer` restores the state for 5 seconds instead. Two actions ask first: the import of a backup, which also has `Deshacer`, and **Borrar todos los datos** (BACKUP-7), which has none."

### Other text of `docs/spec/` that the code contradicts

- `01-product.md` "Not in the product" lists "Quantities" and "categories" of an item. Code: an item has a free-text `quantity` (`src/store.js:46-52`) and one `aisle` (17-aisles). Proposed: remove both; write "Units, prices, notes and photos of an item."
- `01-product.md` "Functions": "Groups by recipe or by shop" misses the aisle group (`src/store.js:6`), and the table has no row for 17-aisles. Proposed: "Groups by recipe, by shop or by aisle" and a row "Aisles of the store | 17-aisles.md".
- `08-storage.md` BACKUP-2 lists the backup content without `quantity`, `aisle`, `aisles`; the "not held" list misses the row of shop lists and the swipe hint. Proposed: "The backup holds the items with their shops, quantity and aisle, the recipes, `sent`, `group`, `sort`, the menu and the aisles. It does not hold the language, the hand, the theme, the density, **Al terminar la compra**, the row of shop lists, the flag of the walkthrough or the swipe hint."
- `08-storage.md` BACKUP-4: "A backup of version 1, 2 or 3 is thus accepted." Code accepts 1 to 8 (`src/storage.js:140`). Proposed: "A backup of version 1 to 8 is thus accepted."
- `08-storage.md` STORE-6 omits: `version` must be a number (a string `"9"` is rejected); an item or recipe id must be non-empty; a recipe whose `products` is not a list is invalid. Proposed: add the three cases.
- `08-storage.md` STORE-7 `sent` row omits "Not a list: empty" (`src/storage.js:159`).
- `08-storage.md` STORE-8: row "Version 1" omits that a `recipes` field of a version 1 document is ignored (`src/storage.js:146`); row "Version 1 to 7" omits that a ticked recurrent item keeps its tick (test "a ticked recurrent item with again keeps its tick when a version 7 state loads").
- `.claude/conventions/ARCHITECTURE.md` "Boundaries" names the cache `shopping-shell-v17`; `sw.js:1` has `shopping-shell-v19`. It also omits the keys `shopping.hand`, `shopping.theme`, `shopping.density`, `shopping.tripEnd`, `shopping.shopLists`.
- `package.json` `description` names "an active list and a next list, … synced and shared lists, AI item entry, purchase history and a pantry". None exists in the code; it contradicts PROD-1 and "Not in the product".
- `shopping-sample.json` is in `.gitignore` (`.gitignore:7`): a local file, not part of the commit. No test or code reads it.

### Gaps: new rules that `docs/spec/` should add

- **DATA-16** — "The empty state has `version` 9, no items, no recipes, no sent recipes, `group` `recipe`, `sort` `custom`, no meals and no aisles."
- **DATA-17** — "An operation never changes its input state. An operation that changes nothing returns the same state object."
- **DATA-18** — "A new item gets a new unique id, the trimmed name, `recurrent: false`, `list: 'active'`, `bought: false`, no shops, quantity `''` and aisle `''`."
- **DATA-19** — "The quantity is free text. It is trimmed; an empty text clears it."
- **DATA-20** — "The `url` of a recipe is `''` or a web address: no whitespace, scheme `http` or `https`, and a host name with at least one dot and a letter top-level domain."
- **DATA-21** — "The data has no length limit except the dish of a meal (80 characters). The input fields set the other limits: 80 for an item or recipe name, 20 for a quantity, 40 for a shop or an aisle."
- **DATA-22** — "The identity of a name is its trimmed text in lower case, with accents."
- **DATA-23** — "A preference of the device is not part of the state."
- **STORE-12** — "The default value of a preference is never stored. A save of the default removes its key; a read of a missing or unknown value gives the default."
- **STORE-13** — "The stored language is used only when it is one of the supported codes. An empty or unknown value means 'follow the phone'." Already stated by LANG-4; no change of `docs/spec/` is needed.
- **STORE-14** — "The walkthrough flag and the swipe-hint flag count as set only when their stored value is exactly `1`."
- **STORE-15** — "The install counts as new only when the walkthrough flag is not set and no state is stored. A stored text that is not a valid state counts as a stored state."
- **STORE-16** — "The stored state is compact JSON of the in-memory state, with no indent and no wrapper. A save then a load gives the same state."
- **STORE-17** — "The repairs of STORE-7 and STORE-8 apply to each version. A version 9 document with `list: 'next'`, `again` or `grouped` is read with the same rules. Only version 1 ignores `recipes`."
- **STORE-18** — "A storage that throws never stops the app: the load gives the empty state, a save gives `false`, each preference gives its default, except the walkthrough flag, which counts as seen."
- **BACKUP-8** — "An export, then an import of that file, gives the same state."

## Lists and arrange (LIST, TRIP, ADD, SORT, GROUP, MOVE)

- **SORT-1** stale. Spec: "only when the sheet has a choice to offer: a grouping (GROUP-2) or an order (SORT-3)". Code (`src/ui/arrange.js:24-26`): the button also shows when `Compra` has a shop chip, for the choice **Listas por tienda** (SHOP-25). Proposed wording: "It shows only in `Compra`, and only when the sheet has a part to show: a grouping (GROUP-2), an order (SORT-3) or **Listas por tienda** (SHOP-25)."
- **MOVE-4** stale. Spec: "A row does not move while its side menu is open or its name is in edit." Code (`src/ui/drag.js:104-109`): a row has no inline name edit; the guards are the open side menu, a lifted row, no scope (ticked), a search text, a run of one row. Proposed wording: drop "or its name is in edit"; add "No row lifts while another row is lifted."
- **GROUP-20** wording. Spec writes `También en «recipes»`; `src/locales/es.js:50` is `También en {recipes}` with no `«»`. Proposed wording: "`También en <recipes>`: the names of the other groups … joined by `, `, with no quotes."
- **GROUP-23** gap (new). A shop group or an aisle group whose members are all ticked keeps its head with `✓` and no rows; GROUP-8 says this only for recipe groups, which do not show. Proposed wording: "**GROUP-23** A group by shop or by aisle whose members are all ticked shows its head with `✓` and no rows. A search with no match removes it."
- **GROUP-22** gap (new). The segmented control of **Agrupar por** holds only the shown choices, and its marker is sized and placed among them (commit 45dabc4). Proposed wording: "**GROUP-22** **Agrupar por** shows only the choices of GROUP-2; its pressed mark has the width of one shown choice."
- **MOVE-13** gap (new). While a row is lifted, the row does not slide sideways and the section does not change by a slide (`src/ui/rows.js:99`, `src/ui/nav.js:39`). Proposed wording: "**MOVE-13** While a row is lifted, a horizontal move does not slide the row and does not change the section."
- **MOVE-7** detail. Spec gives the 56 px edge only. Code: 8 px per display frame (`src/ui/context.js:41`). Proposed addition: "…scrolls the list by 8 px each frame."
- **MOVE-1** detail. Spec: "With a mouse, a vertical drag of 10 px lifts it". Code: the vertical part must be larger than the horizontal part (`src/ui/drag.js:130`); a more horizontal drag slides the row. Proposed addition: "…a drag of 10 px that is more vertical than horizontal…".
- **TRIP-9** gap (new). The figures `total`, `left`, `back`, `saved` of `tripSummary` have no rule ID; `back + saved = total`. Proposed wording: "**TRIP-9** The trip figures count only the items of `Compra`: total, left (not ticked), back (recurrent and kept open), saved (one-time less kept)."
- **LIST-38** gap (new). The header figures table has no ID and no `Menú` row (`header.menuMeals`, `header.noMeals`, `src/ui/list.js:109-113`). Proposed: give the table the ID LIST-38 and add the row `Menú | Menú | N comidas planificadas or Sin comidas planificadas | None`.
- **ADD-10** gap (new). The pinned input and the reversed row list are layout, split out of ADD-2. Proposed wording: "**ADD-10** The rows stand above the input, which stays at the bottom of the sheet; the first row is next to the input."
- **TRIP-4** detail. The banner shows only in **Todas** (SHOP-21), and the header trip button shows in `Compra` also with an empty list. Proposed addition to TRIP-4: "The banner shows only in **Todas** (SHOP-21). The trip button shows in `Compra` at all times."
- **TRIP-5** detail. The message is `Compra terminada.` (`toast.finished`) with `Deshacer`; the spec names no text. Proposed addition: "…shows `Compra terminada.` with `Deshacer`."
- **ADD-9** detail. Only an existing item brought by the sheet flashes and scrolls into view; a new item opens with the row motion, with no flash and no scroll (`src/ui/add.js:82`). Proposed wording: "The row of an existing item that the sheet brought flashes and scrolls into view."
- **GROUP-5** detail. The unsent recipe groups follow the order of `recipes`; the spec gives no order. Proposed addition: "2. each other recipe …, in the order of the recipes."
- **GROUP-9/13/18** detail. The heads `Otros`, `Sin tienda`, `Sin sección` show no count. Proposed addition to GROUP-9: "Its head has no count."

## Shops, recipes, menu and aisles (SHOP, REC, MENU, AISLE)


Stale rules:

- **AISLE-12** (defect, high). Spec: "The name field renames the aisle when it loses the focus or on `Enter` (AISLE-4). `Escape` puts the name back. An error keeps the old name." Code: `src/ui/aisles.js:33` calls `bindField(input, read, write)` with positional functions; `bindField` takes `(input, { read, write, onSaved })` since commit `6e87f39` (2026-10-18), so `read` is undefined and the `blur` and `keydown` handlers throw. A rename in the sheet never saves; `Escape` does not restore the name and does not close the sheet. Proposed action: fix the code to `bindField(input, { read: …, write: … })` and keep the spec text. If the code stays, the spec wording would be: "The name field of an aisle does not save a rename." **Fixed on 2026-10-23**; no change of `docs/spec/` is needed.
- **REC-5**. Spec: "**Eliminar**, an icon button 64 px wide". Code: `SIDE_BUTTON = 72` (`src/ui/context.js:31`, "the same as in design-system.css"). Proposed wording: "an icon button 72 px wide".
- **REC-7**. Spec: "Below 600px wide they stand in one column; from 600px in two, … so more of them fit on the screen of a tablet or an unfolded phone." Code: `styles.css:230` uses `min-width: 840px`, and its comment says "An unfolded phone keeps one column." Proposed wording: "Below 840px wide they stand in one column; from 840px in two, filled row by row, so more of them fit on the screen of a tablet. An unfolded phone keeps one column."
- **REC-20**. Spec: "The message is `«name»: N añadidos, N ya estaban.`". Code: `src/ui/recipes.js:8-13` leaves out a part with a count of 0 and uses the singular form for 1 (`send.added`, `send.already`). Proposed wording: "The message is `«name»: N añadidos, N ya estaban.` with `Deshacer`; a part with a count of 0 does not show, and a count of 1 takes the singular (`1 añadido`, `1 ya estaba`)."

Gaps (new rules):

- **SHOP-28** (new): "**Añadir** of the shop field of the edit sheet is disabled while the field has no text." Evidence `src/ui/edit.js:74-76`.
- **SHOP-29** (new): "An add or a removal of a shop for an unknown item gives `error.itemNotFound`." Evidence `src/shops.js:33`, `src/shops.js:42`.
- **SHOP-30** (new): "From **Todas**, or from a list whose chip is gone, `›` goes to the first list in chip order with an item to buy and `‹` to the last one." Evidence `src/shops.js:90-104`; tested.
- **SHOP-3** (precision): add "Case only: `Cafe` and `Café` are two shops." The key is `toLowerCase`, no accent folding (`src/shops.js:6`).
- **SHOP-17** (precision): the chips count only the items of `Compra`; a shop used only in `Siguiente` gives no chip (`src/shops.js:70`).
- **SHOP-22** (precision): a valid choice takes the current spelling of its chip (`validShop`).
- **SHOP-25** (precision): any stored value other than `hide` reads as **Mostrar** (`src/storage.js:272-278`).
- **REC-38** (new): "The product field takes 80 characters at most." Evidence `src/ui/recipes.js:49`.
- **REC-39** (new): "A removal of a product compares the exact spelling; a product not in the recipe gives `error.productNotFound`." Evidence `src/recipes.js:85`.
- **REC-10** (precision): the de-duplication of suggestions is by case only, not by accent (`Azúcar` and `Azucar` both show); the names of items of both lists count.
- **REC-14** (precision): the stored link is the trimmed text with its added scheme, not a normalised address.
- **MENU-20** (new): "A meal entry whose recipe id is gone shows as a meal with no recipe and still counts as planned." Evidence `src/menu.js:76-83`, `src/menu.js:73`.
- **MENU-21** (new): "A dish to recipe always shows `Receta creada: «name».`, also when it takes a recipe that exists." Evidence `src/ui/recipes.js:131`.
- **MENU-16** (precision): the field takes 80 characters at most (`index.html:261`).
- **AISLE-19** (new): "**Añadir** of the field **Nueva sección** is disabled while the field has no text." Evidence `src/ui/aisles.js:69-72`.
- **AISLE-20** (new): "With no aisle, the row **Secciones de la tienda** shows no count." Evidence `src/ui/aisles.js:57`.

## Screen and install (NAV, ROW, MSG, A11Y, ONB, INS)


Stale rules:

- **Layout** (07-screen.md, no ID): spec "The message shows below the top edge." Code: the message stands at the bottom above the `+` button (and above the dock), and moves to the top only while a sheet is open (`vendor/design-system/design-system.css:1082-1148`). Proposed wording: "The message shows above the `+` button; while a sheet is open it shows below the top edge." New rule MSG-9 states it.
- **NAV-9**: spec "The sheet has the title `Opciones de la compra`, the line of where the items go (TRIP-4), the line of the open items (TRIP-6) and the button **Terminar compra**, in this order." Code: title `¿Terminar la compra?` (`trip.question`); `Opciones de la compra` is the trip button name and the dialog label; a tonal **Seguir comprando** follows **Terminar compra** and closes the sheet; the hint line holds a button **Ajustes** (`index.html:241-253`, `src/ui/list.js:231-242`). Proposed: "The sheet, named `Opciones de la compra`, has the title `¿Terminar la compra?`, the rows of where the items go (TRIP-4), the line of the open items with **Ajustes** (TRIP-6), **Terminar compra** and **Seguir comprando**, in this order."
- **NAV-10**: add "and by **Seguir comprando**" to the ways the trip sheet closes (`src/ui/list.js:420`).
- **NAV-13**: spec table row "Walkthrough bar | **Saltar**, **Siguiente** | **Siguiente**, **Saltar**" contradicts ONB-3 and ONB-12, and the code has no hand rule in the walkthrough. Also the table misses parts that do mirror: sheet head and foot (`design-system.css:967-970`), `input-row` (`:1984-1986`), `hand-side` of a `split` (`:2007-2009`), the message from 600px (`:1137-1140`). Proposed: drop the walkthrough row; add rows "Sheet head and foot: mirrored", "Field and its add button: button first", "Primary of a two-button pair: left column".
- **NAV-14**: spec "`Izquierda` does not change … the sheets". Code: the head and foot of a sheet mirror. Proposed: "`Izquierda` does not change the alignment of text, the order of the sections in the bottom bar, the sides of a slide of a row (ROW-3, ROW-11) or the walkthrough."
- **NAV-20**: spec "the rows of `Compra` and of `Recetas` and the `+` button are 48 px high in place of 56 px … The sheets and `Ajustes` do not change." Code: the floating `+` has a fixed 56px size (`design-system.css:1709-1716`), the dock `+` is always 48px (`:1902-1907`); every part sized by `--tap-l` changes, `Ajustes` rows included (`design-system.css:1673`). Proposed: "`Compacta` makes `--tap-l` 48 px (rows of `Compra`, `Recetas` and `Ajustes`, the large buttons), the bottom bar 56 px and the dock 48 px. The floating `+` stays 56 px."
- **MSG-5**: the table misses changes that have `Deshacer` in the code: the slide of a recipe head that buys the group (GROUP-21, `src/ui/list.js:58`), a recipe made from a dish (`src/ui/recipes.js:131`), the delete of an aisle (`src/ui/aisles.js:37`), **Borrar la receta de ejemplo** (`src/ui/settings.js:168`). Proposed: add rows "Groups: the slide of a recipe head", "Aisles: delete", "Recipes: a recipe made from a dish", "Sample: Borrar la receta de ejemplo".
- **MSG-6**: spec lists "a new recipe" and "the order, the grouping" as changes with no `Deshacer`. Code: a recipe made from a dish has `Deshacer`; the order and the grouping keep the message and its undo (MSG-4), they do not hide it. Proposed: "… a new recipe from the add sheet …" and move the order and the grouping to MSG-4 only.
- **A11Y-1**: spec "Each icon button has an `aria-label` with the action and the name of its object". Code: the row edit button is `Editar` with no item name (`src/ui/rows.js:51`); header and dock buttons have fixed names; only **Eliminar** of a row (`row.delete`) and the product remove button (`recipe.removeProduct`) carry the object name. Proposed: "Each icon button has an accessible name in the language of the screen; a destructive one also names its object."
- **NAV-2** (wording): spec "A change … ends an edit". The code has no edit reset on a change of section (`src/ui/nav.js:16-24`); it closes the meal sheet, the recipe sheet and the shop picker, and the trip sheet outside `Compra`. Proposed: "A change closes the open row, the search, the meal and recipe sheets and the shop picker." (Q-screen-1.)

Gaps (new rules):

- **NAV-26** (new): "The last line of `Ajustes` is `Versión {version} · {date}`, or `Versión desconocida`." Evidence `src/ui/settings.js:48-53`. NAV-6 now names it only in passing.
- **NAV-27** (new): "Each entry into `Ajustes` reads the deployed version (8 s timeout) and shows `Comprobando…`, `Al día`, `Versión X disponible` or `Sin conexión`; **Actualizar** waits 15 s for the service worker, then shows `No se pudo actualizar.`." Evidence `src/ui/nav.js:23`, `src/ui/settings.js:78-104`, `:201-209`. (Probably VER area: check `10-offline-version.md` for overlap.)
- **NAV-28** (new): "The `+` button does not show in `Ajustes` and in `Menú`, while the action of an empty state shows, or while a sheet is open. Its name is `Añadir artículo` in `Compra` and `Crear receta` in `Recetas`." Evidence `src/app.js:115-119`.
- **MSG-9** (new): "The message shows above the `+` button and the dock; while a sheet is open it shows below the top edge." Evidence `design-system.css:1082-1148`.
- **ROW-14** (detail): add the duration "in 500 ms (two times the motion time)" and "a section change in the wait leaves the hint for later" (`src/ui/rows.js:153-161`).
- **NAV-5** (detail): add "48 px, 250 ms" (`design-system.css:190-209`, `--motion: 250ms`).
- **NAV-23** (detail): add "the release speed is taken over the last 100 ms; a pause of more than 100 ms counts as 0; a side sheet does not drag" (`vendor/design-system/sheet.js:6-18`, `:42-43`).
- **ROW-11** (detail): add "a row with its side open does not run the action" and "the icon is `check` for a tick and `undo` for an untick" (`src/ui/rows.js:78`, `:110`, `:128`).
- **ROW-12** (detail): name the left side of a recipe row (**Eliminar**) and the slide of a recipe group head (GROUP-21).

## Languages, offline and version, integrations (LANG, SW, VER, ARR, SHORT, VOICE)

- **VER-14** stale. Spec: "It runs `standalone`, in portrait, with `start_url` and `scope` `./` and `id` `/shopping-list/`." Code: `manifest.webmanifest:10` has `orientation: any` (INS-4, `tests/spec.test.js` "the installed app turns with the device (INS-4)"). Proposed wording: "It runs `standalone` and turns with the device (`orientation: any`, INS-4), with `start_url` and `scope` `./` and `id` `/shopping-list/`." PROD-3 ("The manifest locks the installed app to portrait") has the same conflict; flag it to the owner of `01-product.md`.
- **VOICE-1 … VOICE-8** stale (status text). Spec: "On 2026-10-13 that branch is 28 commits behind `main`". Code: at 45dabc4 `voice-commands` is 360 commits behind `main` and 3 ahead; no voice module is on `main`. Proposed wording: keep the section as a design note and state the current distance, or drop the count ("far behind `main`; needs a rework before a merge").
- **SW-2** gap of detail. Spec lists "the icons of the app". Code (`sw.js:54-61`) also caches `icons/logo.png` and the four `icons/shortcut-<name>.png`. Proposed wording: "…`version.json`, the icons of the app, `icons/logo.png`, the four shortcut icons and the icon sprite `icons.svg`."
- Gap **LANG-19** (new): "A plural category that has no form (`many` for 1 000 000 in `es`, `ca`, `fr`, `it`, `pt`), and a call with no `count`, take the `other` form." Evidence `src/i18n.js:59`, test `tests/i18n.test.js` "a plural category with no form, or no count, uses the other form".
- Gap **VER-18** (new): "With the status `outdated`, an update notice shows above the version line: the title `version.available` (deployed version), the text `settings.updateReady` (`Tienes la {version}.`, running version) and **Actualizar**. Else it is hidden." Evidence `src/ui/settings.js:60-65`, `index.html:131-134`.
- Gap **ARR-6** (new): "When the storage is not available, the start message `error.noStorage` replaces the arrival message." Evidence `src/app.js:285-288,306`.
- Gap in LANG-12: the screen joins texts with fixed separators that are in no catalog: `, ` between `send.added` and `send.already` (`src/ui/recipes.js:12`, used by `toast.sent` and `toast.menuFilled`) and ` · ` in the meal label (`src/ui/menu.js:37`). Proposed addition to LANG-12: "Exception: the separators `, ` and ` · ` that join two catalog texts." Or move them into the catalogs.
- Gap in LANG-7/LANG-8: the key `recipe.inList` (`Todo está en Compra`) is in all seven catalogs and no code or markup uses it. Proposed: remove the key, or add a test that each catalog key is used (with the run-time key sets of `docs/port/text.md`).
- Gap in LANG-2: the spec gives only `es-MX`. Code and tests also fix: case-insensitive base (`EN-us`), script and variant subtags ignored (`ca-ES-valencia`), entries that are not text skipped, a single text accepted. Proposed sentence: "Only the base subtag, lower-cased, counts; `pt-BR` gives the European `pt` catalog."
- Gap in VER-4: the spec says "the date in the form of the language". Code: `toLocaleString(intlTag(lang), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })` (`src/ui/settings.js:51-52`), so `en` shows a 12-hour clock (`Oct 23, 10:48 PM`). Proposed: name the fields.

## Engineering, modules and design system (ENG, MOD, DSV)


- **ENG-2** (gap, precision): the spec says "`error` is a message `{ key, params }`". The code omits `params` when there are none: `{ key }` only (`src/store.js:15`; `tests/store.test.js` "operations reject an unknown id" asserts `{ key: 'error.itemNotFound' }`). Proposed wording: "`error` is a message `{ key, params }`; with no params it is `{ key }`."
- **ENG-4** (gap): the spec does not say what `apply` does on a rejection, a failed save or an undo. Code (`src/ui/context.js:213-226`): a rejection shows the message as a toast and saves nothing; a failed save shows `error.notSaved`; an undo text shows a toast with `Deshacer`; any other success hides the toast. Proposed: add these four sentences to ENG-4.
- **ENG-12** (precision): the spec list omits the two manifest checks of `tests/spec.test.js` (VER-14 `id`, INS-4 `orientation`) and the `APP_KEYS` check. Proposed: add "the keys that `Borrar todos los datos` removes; the manifest `id` and `orientation`".
- **Module table** (`12-engineering.md` "Modules", over-claim): `src/ui/recipes.js` may import `store` but imports nothing from it at `f822a77`. `tests/spec.test.js` checks only stray imports, not unused allowances. Proposed: drop `store` from the row of `src/ui/recipes.js`.
- **ARCHITECTURE.md** (convention doc, stale; not `docs/spec/`): names cache `shopping-shell-v17` (code: `shopping-shell-v19`, `sw.js:1`); `src/storage.js` may import `store.js`, `recipes.js` (code also imports `menu`); `src/ui/list.js` "The lists `Actual` and `Próxima`" (the second list is gone); the rows of `ui/controls.js`, `ui/edit.js`, `ui/recipes.js` differ from the code and from `12-engineering.md`; no rows for `src/menu.js`, `src/install.js`, `src/ui/install.js`. Proposed: replace its table with a link to `docs/spec/12-engineering.md`.
- **CANONICAL.md** (convention doc, stale): "One object `{ version, items, recipes, sent, group, sort }`" — the state also has `menu` and `aisles` (`src/store.js:11`). Proposed: name the full shape or link `02-data-model.md`.
- **MOD trace** (`package.json:4`): the `description` names "synced and shared lists, AI item entry, purchase history and a pantry". No such feature exists in `src/`. Proposed: description = the manifest description. No other trace of the modules in `src/`, `index.html`, `styles.css`, `sw.js`, the manifest or the seven catalogs.
- **MOD-2** (precision): `shopping.modules` stays on an old install also after `Borrar todos los datos`, because it is not in `APP_KEYS` (`src/storage.js:421-432`). Proposed: add "`Borrar todos los datos` does not remove it", or add the key to `APP_KEYS`.
- **DSV-9** (new, gap): the app tokens of `styles.css:3-12` make `--primary` = `--done` (green) and define `--primary-soft` = `--done-soft`. `15-design-system.md` does not state this; DSV-3 says only "its tokens". Proposed new rule DSV-9: "The app sets `--primary` and `--on-primary` to `--done` and `--on-done`, and `--primary-soft` to `--done-soft`, so the main action is green."
- **DSV-17 to DSV-19** (new, gap): the icon geometry of `scripts/make-icons.mjs` (launcher 0.84 art on a 0.22-radius white square; maskable 0.64; shortcut disc `#1f7a4d` with a white glyph at 0.5; logo 288 px with the edge white cleared) has no rule in `docs/spec/`. Proposed: add them under a heading "Icons" of `15-design-system.md`.
- **DSV-10 to DSV-16, DSV-20 to DSV-24** (new, port only): the shared tokens and component measures. `docs/spec/` keeps the shared design system out by design ("This document holds the rules of the app only"). Proposed: no change to `docs/spec/`.
- **DSV-6** (precision): from 840px the side sheet hides its grab and cannot be dragged to close (`vendor/design-system/sheet.js:41-43`). NAV-23 says a drag of the grab or the head closes a sheet, with no exception. Proposed: add "From 840px a side sheet has no grab and no drag" to DSV-6 or NAV-23.
