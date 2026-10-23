# Screen

The frame of the app: the four sections and the slide between them, the header, the bottom bar,
the `+` button, the sheets and their close, the layer stack and the back of the phone, the item
rows and their slides, messages and `Deshacer`, the walkthrough, accessibility, and the device
preferences **Mano**, **Tema** and **Densidad**. Source modules: `src/sections.js`,
`src/layers.js`, `src/onboarding.js`, `src/sheets.js`, `src/swipe.js`, `src/app.js`,
`src/ui/context.js`, `src/ui/nav.js`, `src/ui/rows.js`, `src/ui/motion.js`, `src/ui/controls.js`,
`src/ui/onboarding.js`, `src/ui/settings.js` (not backup), `index.html`, and
`vendor/design-system/sheet.js` and `design-system.css` for the sizes and the timings.

Sizes are CSS px. On Android, 1 CSS px of this layout = 1 dp. Durations are ms.

## Layout

From top to bottom: the header (title, subtitle, progress bar, search button, arrange button, trip
button, the row of shop lists of `Compra`), the content of the section, the `+` button, the dock
(below 600 dp, SHOP-26) and the bottom bar. From 600 dp the bottom bar is a rail of 80 dp at the
side of the hand (NAV-13). The header contents and its figures are in `03-lists.md`
(LIST-20, LIST-21, the header table). The message (MSG-9) stands above the `+` button, or at the
top while a sheet is open; the spec sentence "The message shows below the top edge" is stale.

Target: one `Scaffold` per window size class. Below 600 dp a `NavigationBar` with the dock above
it; from 600 dp a `NavigationRail` at the side of the hand.

## Sections

**NAV-1** [core] [verified] The bottom bar has four sections in this order: `Compra` (`list.active`), `Recetas` (`nav.recipes`), `Menú` (`nav.menu`), `Ajustes` (`nav.settings`). The app starts in `Compra`, unless a launcher shortcut names another section (SHORT, `11-integrations.md`). Each section button shows an icon and its name, no count, and its accessible name is its visible name.
- Evidence: `src/sections.js:2`; `src/ui/context.js:126`; `index.html:164-181`; `src/app.js:301-305`; test: `tests/sections.test.js` "SECTIONS has the order of the bottom bar"; `tests/markup.test.js` "each nav item shows its name".
- Target: the order is a `core` constant; the bar is a Compose `NavigationBar` / `NavigationRail` with `NavigationBarItem(label = …)`.

**NAV-2** [adapted] [untested] A tap on a section button changes the section. A change of section closes the open row, clears the search text, closes the search, closes the meal sheet, the recipe sheet and the shop picker, and takes the focus out of the search field. Outside `Compra` the trip sheet also closes. A change to `Ajustes` starts the version check (NAV-27).
- Evidence: `src/ui/nav.js:16-24`, `src/ui/nav.js:31-33`; `src/ui/list.js:232`; test: untested.
- Target: one `navigate(section)` event in the screen state holder that resets these fields; the focus clear is `LocalFocusManager.clearFocus()`.
- Note: the spec says "ends an edit". The code has no edit reset in `showView`; the edit sheet covers the bar, so a tap on the bar cannot happen while it is open. See Q-screen-1.

**NAV-3** [core] [verified] A horizontal slide changes the section: a slide to the left goes to the next section, a slide to the right to the previous one. The slide counts when |dx| ≥ 60 and |dx| ≥ 2·|dy|, measured from the press to the release. It stops at `Compra` and at `Ajustes`: no wrap.
- Evidence: `src/sections.js:5-22`; `src/ui/nav.js:43-51`; test: `tests/sections.test.js` "slideDirection is 0 for a short slide", "slideDirection is 0 for a slide that is not horizontal", "slideTo goes to the next section on a slide to the left", "slideTo goes to the previous section on a slide to the right", "slideTo stops at the first and at the last section".
- Note: the section does not follow the finger. The decision is made only at the release, from the start and end points. No velocity counts.

**NAV-4** [adapted] [untested] The section slide starts only from the primary pointer (the left button of a mouse), on the header or on the content. It does not start on an item row (the swipe box), on the row of shop lists (SHOP-17), on the dock (SHOP-26), or on a text field. It does not start while a sheet is open or a row is lifted (reorder). The walkthrough blocks it (ONB-10). A cancelled pointer ends it with no change.
- Evidence: `src/ui/nav.js:37-54`; test: `tests/sections.test.js` "the section slide does not start on the dock" (only the dock exclusion).
- Target: a `pointerInput` detector on the header and the content container that skips events consumed by row swipe, chip row, dock and text fields. Do not use `HorizontalPager`: it follows the finger and has other thresholds.

**NAV-5** [adapted] [untested] After a change of section, by slide or by tap, the content of the new section comes in from its side: from 48 dp to the right for a later section, from 48 dp to the left for an earlier one, with opacity 0 → 1, in 250 ms on the curve `cubic-bezier(0.2, 0.8, 0.2, 1)`. A change to the same section has no animation. With reduced motion the duration is 0.
- Evidence: `src/ui/nav.js:8-14`, `src/ui/nav.js:17`, `src/ui/nav.js:22`; `src/sections.js:36-39`; `vendor/design-system/design-system.css:90`, `:95-101`, `:190-209`; test: `tests/sections.test.js` "direction is 1 towards a later section and -1 towards an earlier one" (the direction only).
- Target: `AnimatedContent` with `slideInHorizontally(48.dp) + fadeIn`, `tween(250, CubicBezierEasing(0.2f, 0.8f, 0.2f, 1f))`; reduced motion = system animator scale 0.

**NAV-6** [adapted] [verified] `Ajustes` has six groups, each a title above one full-width group of rows, in this order: **Copia de seguridad** (`settings.backup`: **Exportar**, **Importar**, **Borrar todos los datos**), **Preferencias** (`settings.preferences`: **Idioma**, **Mano**, **Tema**, **Densidad**), **Al terminar la compra** (`settings.tripEnd`, TRIP-7, a hint line and a two-segment control), **Secciones** (`settings.aisles`: **Secciones de la tienda** with the count of aisles, AISLE-10), **Aplicación** (`settings.app`: **Instalar la aplicación**) and **Ayuda** (`settings.help`: **Ver la introducción**, **Borrar la receta de ejemplo**). A row is 56 dp high or more and has its name at the start. **Exportar**, **Importar**, **Secciones de la tienda**, **Ver la introducción** and **Instalar la aplicación** end with `›`. A row of **Preferencias** shows its current value (the text of the selected option) before the `›`; a tap opens the platform picker. **Borrar todos los datos** and **Borrar la receta de ejemplo** have the danger colour and no `›`. The group **Aplicación** is dropped on Android (INS-2). The version line and the update banner are NAV-26 and NAV-27.
- Evidence: `index.html:74-139`; `src/ui/settings.js:34-39`, `src/ui/settings.js:180-191`; test: `tests/markup.test.js` "each group of Ajustes is a list-group-head and one full-width list-group", "language, hand, theme and density are rows of the group Preferencias", "Borrar la receta de ejemplo is a danger row with no chevron", "the rows that open something end with a chevron".
- Target: a `LazyColumn` of grouped `ListItem`s. The picker of the device (a `select`) becomes an `ExposedDropdownMenu` or a single-choice dialog. Without the install group, Android has five groups.

**NAV-26** [adapted] [new] The last line of `Ajustes` is the version in use: `Versión {version} · {date}` (`version.running`), with the date of the build in the language of the screen as day (numeric), month (short), hour and minute (2 digits). With no version known it reads `Versión desconocida` (`version.none`).
- Evidence: `src/ui/settings.js:48-53`; `index.html:136-138`; `src/app.js:310-313`; test: untested.
- Target: `BuildConfig.VERSION_NAME` and a build-time constant for the date, formatted with `DateTimeFormatter` in the app locale. The read of `version.json` goes away.

**NAV-27** [dropped] [new] Each entry into `Ajustes` reads the deployed version (`version.json`, no cache, 8000 ms timeout) and shows a status after the version line: `Comprobando…`, `Al día`, `Versión X disponible` or `Sin conexión`. While a newer version is deployed, a plain banner above the version line says `Versión X disponible` and `Tienes la Y.` (`settings.updateReady`) with the wide button **Actualizar**. **Actualizar** asks the service worker to load the new shell (15000 ms timeout), then reloads; on a failure the button is enabled again and the message `No se pudo actualizar.` (`error.updateFailed`) shows.
- Evidence: `src/ui/nav.js:23`; `src/ui/settings.js:48-104`, `src/ui/settings.js:201-209`; `src/ui/context.js:44-46`; test: `tests/markup.test.js` "the update notice is a banner with a wide primary button above the version line", "the finish banner is a done banner and the update notice a plain one".
- Reason: it exists only for the service worker cache of a static host. Replacement: updates through the Play Store (optionally the Play In-App Updates API, flexible flow) or a new APK; the screen shows NAV-26 only.

**NAV-7** [core] [verified] An empty section shows a title, a text and up to two actions as wide buttons; the decision is `emptyAction(view, {query, hasRecipes, sample})`:
  - `Compra` with no item: title `Aún no hay artículos` (`empty.activeTitle`), text `Añade lo que necesitas comprar y márcalo en la tienda.` (`empty.active`), primary button **+ Añadir artículo** (`empty.addItem`) that opens the add sheet.
  - `Compra` with no item while the sample recipe exists: the same title, text `Añade tu primer artículo, o empieza con la receta «name».` (`empty.sample`), the same primary button, and a tonal button **Añadir la receta de ejemplo** (`empty.addSample`) that sends the sample to `Compra` as a send does (REC-18).
  - `Compra` with a search that has no match: no title, text `Ningún artículo coincide con «text».` (`empty.noItemMatch`, the trimmed text), button **+ Añadir «text»** (`empty.addQuery`) that adds the name as the add sheet does and ends the search.
  - `Recetas` with no recipe and no dish of the menu, or with a search and no recipe: title `Aún no hay recetas`, text `empty.recipes`, button **+ Crear receta** that opens the add sheet.
  - `Recetas` with a recipe or a dish and a search with no match: text `Ninguna receta coincide con «text».` (`empty.noMatch`), no button.
  - `Menú` always shows its week (MENU-14); `Ajustes` has no empty state.
  - A search of only spaces counts as no search.
  - With a title and an action, the title and the text stand in the middle of the room above the buttons, and the buttons stand at the bottom; else the block stands in the lower half of the list area.
- Evidence: `src/sections.js:68-79`; `src/ui/list.js:132-153`, `src/ui/list.js:221`; `index.html:53-58`; test: `tests/sections.test.js` "emptyAction of Recetas with no recipe creates one", "emptyAction of Menu has no empty text", "emptyAction of a list search with no match adds the searched name", "emptyAction of a search that is only spaces is the empty list", "emptyAction of a recipe search with no match has no action", "emptyAction of an empty list with the sample recipe has a title, adds an item, and its ingredients second", "emptyAction of an empty list without the sample has a title and adds an item, as Recetas creates a recipe", "emptyAction of a section with nothing to say is empty"; `tests/markup.test.js` "the empty state of a list holds a title, a text and an action button, set by the view".

**NAV-28** [adapted] [new] The `+` button (the floating one and the one of the dock) does not show in `Ajustes` and in `Menú`, while the action button of an empty state shows (NAV-7), and while a sheet is open (NAV-8). Its accessible name is `Añadir artículo` (`add.item`) in `Compra` and `Crear receta` (`add.recipe`) in `Recetas`.
- Evidence: `src/app.js:115-119`; test: untested.
- Target: a `FloatingActionButton` (from 600 dp) and an `IconButton` at the end of the dock (below 600 dp), both with `contentDescription`.

**NAV-18** [dropped] [removed] Retired: no section shows a drawing behind its content.

## Item rows

**ROW-1** [adapted] [untested] A row of `Compra` has a check mark, the name with its quantity after it in the muted colour, and a meta line below it, joined by ` · `: the shops of the item (only when the list is not grouped by shop), `También en {recipes}` (`row.alsoIn`) for an item of two recipe groups (GROUP-20), and `↻ cada compra` (`row.repeats`) for a recurrent item (LIST-7). The name keeps two lines, then ends with an ellipsis. The row ends with an edit button **Editar**. A tap on the body of the row ticks or unticks the item (LIST-11); the check mark only shows the state and takes no focus. A tap on the edit button closes an open row and opens the edit sheet (ROW-7); it does not tick. With **Izquierda** (NAV-13) the edit button is at the start and the check mark at the end. For the keyboard and a screen reader, the name is a checkbox with its state (`aria-checked`); `Space` or `Enter` ticks it.
- Evidence: `src/ui/rows.js:14-24`, `src/ui/rows.js:44-81`, `src/ui/rows.js:187-195`; test: untested.
- Target: the row body is `Modifier.toggleable(value = bought, role = Role.Checkbox)` with the name as its label; the check mark is `clearAndSetSemantics {}`; the edit button is an `IconButton`. `maxLines = 2, overflow = Ellipsis`.

**ROW-2** [dropped] [removed] Removed: the app has one list, `Compra` (ROW-1).

**ROW-3** [adapted] [untested] A slide of a row to the left shows its side actions behind the right end of the row. Each action is a button 72 dp wide with an icon and its name below it. For a row of `Compra` the actions are, in order: **Editar** (neutral), **Repetir** or `No repetir` for a recurrent item (LIST-7), **Eliminar** (danger). **Eliminar** deletes with `Deshacer` and the message `"{name}" eliminado.` (`toast.deleted`). The side is 3 × 72 = 216 dp wide.
- Evidence: `src/ui/rows.js:26-41`, `src/ui/rows.js:77`, `src/ui/rows.js:202`; `src/ui/context.js:31`; `vendor/design-system/design-system.css:1459-1465`; test: untested.
- Target: a custom swipe box (`AnchoredDraggable` with anchors 0 and −216 dp, or a `pointerInput` drag) with the action buttons behind the row content. `SwipeToDismissBox` does not fit: it has no open state.

**ROW-4** [adapted] [untested] A press on a row becomes a horizontal drag after 10 dp of horizontal move. A move that passes 10 dp vertically first, with |dy| ≥ |dx|, gives up the drag and lets the list scroll. A press with a mouse button other than the left one does nothing. While a row is lifted for a manual order (reorder), the row does not slide.
- Evidence: `src/ui/rows.js:93-108`; `src/ui/context.js:32`; test: untested.
- Target: `awaitTouchSlopOrCancellation` with a 10 dp slop and a horizontal-axis lock; the list keeps vertical scroll.

**ROW-5** [core] [verified] At the release, the side stays open when the row is left of its place by more than max(40, 40 % of the side width) dp; for the 216 dp side of `Compra` that is 86.4 dp. An open side closes with a drag back of more than the same limit; a shorter drag back keeps it open. Any other release puts the row back to its place. The side actions show behind the row from the first dp of the drag to the left, not only after the release. A side of width 0 never opens.
- Evidence: `src/swipe.js:1-14`; `src/ui/rows.js:110-114`, `src/ui/rows.js:136-140`; test: `tests/swipe.test.js` "settle opens the end side on a long drag to the left", "settle opens nothing on a short drag", "settle needs 40 px at least for a narrow side", "settle does not open a side that has no width", "settle closes an open side on a long drag back", "settle keeps an open side on a short drag or a drag further out", "settle opens the other side on a drag across the row".
- Note: `settle` also handles a start side (slide to the right). No row of the app has a start side today: the slide to the right is ROW-11.

**ROW-6** [adapted] [untested] One row is open at a time. A press out of the open row closes it at once, and that press still does its own work (a tap on another row ticks it, a tap on a button presses it). A tap on the body of the open row only closes it, with the slide back from its open place. A side action closes the row, then runs.
- Evidence: `src/app.js:151-165`; `src/ui/rows.js:175-195`; `src/ui/rows.js:138`; test: untested.
- Target: the open row id lives in the screen state; a pointer-down observer on the list closes it in the `Initial` pass without consuming the event.

**ROW-7** [adapted] [untested] The edit sheet `Editar` has the field **Nombre** (80 characters at most), the field **Cantidad** (20 at most, LIST-27), the switch **Repetir en cada compra** (LIST-7), then the shops (SHOP-9 to SHOP-15) and the aisle (AISLE). Its title is the name of the item. The name of a field shows inside it while it is empty and moves onto its top border when it has a value or the focus. `Enter` or a loss of focus saves the field (LIST-5); a value equal to the stored one, after a trim, is no save. An error shows its message and the field shows the stored value again. `Escape` in a field puts the stored value back, leaves the field and keeps the sheet open. A change of quantity or name has no `Deshacer`: it hides the current message. The sheet opens with no focus in a field.
- Evidence: `index.html:273-296`; `src/ui/controls.js:56-80`; `src/ui/edit.js:7-13`, `src/ui/edit.js:111-112`; `src/ui/context.js:214-225`; test: `tests/markup.test.js` "the edit sheet has a veil, a dialog, the name and quantity fields and the shops" (fields and limits only).
- Target: `OutlinedTextField` with `label` (the floating label) and a max-length filter; `KeyboardActions(onDone)` and `onFocusChanged` save; a hardware `Escape` key is an `onKeyEvent` on the field. The back of the phone in a field closes the keyboard first (platform), then the sheet.

**ROW-8** [adapted] [untested] For 350 ms after the end of a row drag, a hold (reorder lift or drop), a section slide or a walkthrough slide, a click is ignored, so the release does not tick an item or press a button.
- Evidence: `src/ui/context.js:36`, `src/ui/context.js:228-231`; `src/app.js:167-175`; `src/ui/rows.js:126`; `src/ui/nav.js:49`; `src/ui/onboarding.js:114`; `src/ui/drag.js:75`, `:138`; test: untested.
- Target: Compose gesture detectors consume the drag, so a tap does not fire after a drag. Keep a 350 ms guard only where a tap detector and a drag detector sit on different nodes (section slide over buttons).

**ROW-9** [adapted] [untested] No row appears or disappears at once. A ticked row closes in 200 ms (height to 0, ease-out), then the tick applies and it goes to `Comprados (N)`; a second tap in that time does nothing. After any other change of the state (add, delete, move, untick, **Terminar compra**, `Deshacer`) and each open or close of a group or of `Comprados (N)`, a new row of `Compra`, `Recetas` or of the products of a recipe opens in 200 ms (height 0 → full, opacity 0 → 1), and a row that is gone stays in its place and closes in 200 ms, with no input. A change of grouping or of order moves the rows (`04-arrange.md`). With reduced motion nothing moves.
- Evidence: `src/ui/context.js:42`; `src/ui/motion.js:4-32`, `src/ui/motion.js:64-77`, `src/ui/motion.js:112-136`; `src/ui/rows.js:59-68`; test: untested.
- Target: `LazyColumn` with stable keys and `Modifier.animateItem(fadeInSpec, placementSpec, fadeOutSpec)` at 200 ms; the tick close is a 200 ms `animateContentSize`/height collapse before the state change.

**ROW-10** [dropped] [untested] A long press of a finger on a row does not open the context menu of the browser.
- Evidence: `src/ui/drag.js:144-147`; test: untested.
- Reason: a browser menu exists only on the web. Replacement: nothing (a Compose row has no system long-press menu; the long press is the reorder hold of `04-arrange.md`).

**ROW-11** [adapted] [verified] A slide of a closed row to the right runs an action at the release when the slide reached max(80 dp, 35 % of the row width); a shorter slide puts the row back. The row follows the finger to the right up to its full width. Below the row a backdrop shows the icon of the action (`check` to tick, `undo` to untick); the backdrop fills with the done colour (`--done`) once the slide is long enough, and at that moment the phone vibrates 10 ms (each time the slide crosses the limit outward). In `Compra` the action ticks the item with `Deshacer` and `"{name}" comprado.` (`toast.bought`), or unticks a ticked item with no `Deshacer` (LIST-11, LIST-13). A row with its side open does not run the action: a slide to the right only closes the side (ROW-5).
- Evidence: `src/swipe.js:16-18`; `src/ui/rows.js:78`, `src/ui/rows.js:109-119`, `src/ui/rows.js:128-135`; test: `tests/swipe.test.js` "reached needs 35 % of a wide row", "reached needs 80 px at least on a narrow row", "reached is false with no drag or a drag to the left".
- Target: the same swipe box as ROW-3 with a right range up to the row width; the vibration is `HapticFeedbackType` / `View.performHapticFeedback` (or `Vibrator` 10 ms).

**ROW-12** [adapted] [untested] A recipe row of `Recetas` slides with the same rules: to the right it sends the recipe to `Compra` (icon `cart-add`, REC-18); to the left it shows one side action, **Eliminar** (REC-5). A group head of a recipe in `Compra` slides to the right with the same threshold to buy the group (GROUP-21); a search stops that slide.
- Evidence: `src/ui/recipes.js` (`recipeNode`, `swipeBox` call); `src/ui/rows.js:270-298`; `src/ui/list.js:52-60`, `src/ui/list.js:77`; test: untested.

**ROW-13** [dropped] [removed] Removed: a saved item has no row (LIST-35).

**ROW-14** [adapted] [untested] The first time `Compra` shows a row that can be ticked, after 600 ms the body of the first closed row slides 24 dp to the left and back, in 2 × 250 = 500 ms on the curve `--ease`, so the user sees that a row slides. When it plays, `shopping.swipeHint` becomes `1` and the hint does not play again. If the section is not `Compra` at the end of the wait, it does not play and stays pending. With no storage it plays once per start. With reduced motion it does not play and the key stays unset.
- Evidence: `src/ui/context.js:34-35`; `src/ui/rows.js:146-168`; `src/ui/list.js:219`; `src/storage.js:398-415`; test: `tests/storage.test.js` "saveSwipeHint stores the hint, and loadSwipeHint then reads it as shown" (the key only).
- Target: `shopping.swipeHint` → a DataStore boolean; the move is an `Animatable` offset on the first row.

## Messages and undo

**MSG-1** [adapted] [untested] One message shows at a time. A new message replaces the old one and starts its time again.
- Evidence: `src/ui/context.js:178-186`; test: untested.
- Target: one `SnackbarHostState`; dismiss the current snackbar before a new one.

**MSG-2** [adapted] [untested] A plain message stays 3000 ms. A message with `Deshacer` stays 5000 ms. The arrival message stays 10000 ms (ARR-2).
- Evidence: `src/ui/context.js:26-29`, `src/ui/context.js:178`; `src/app.js:285-288`; test: untested.
- Target: `SnackbarDuration` values do not match: use `Indefinite` with a timed dismiss at 3000 / 5000 / 10000 ms. Note: Android accessibility may extend timeouts (`AccessibilityManager.getRecommendedTimeoutMillis`); see Q-screen-6.

**MSG-3** [core] [untested] `Deshacer` puts back the full state of before the change and saves it. It has one level: after the undo the message hides and no undo is left. The rows that come back open (ROW-9), and a recipe or product row that comes back flashes.
- Evidence: `src/app.js:248-257`; `src/ui/context.js:201-211`; `src/ui/motion.js:143-144`; test: untested.
- Target: the undo snapshot is the whole state value held by the view model (immutable), written through the repository.

**MSG-4** [core] [untested] A later change with no `Deshacer` of its own hides the message, and the earlier undo is lost. A change of order or of grouping in the arrange sheet is the exception: it does not touch the message, so the message stays and its `Deshacer` puts back the state of before the earlier change, which also holds the order and the grouping of before.
- Evidence: `src/ui/context.js:214-225`; `src/ui/arrange.js:103`, `src/ui/arrange.js:136` (they call `commit`, not `apply`); test: untested.

**MSG-5** [core] [untested] These changes show a message with `Deshacer` (from the code; the spec table misses the starred ones):

  | Area | Changes |
  |---|---|
  | Items | Tick by a tap on the row (ROW-1) or by a slide (ROW-11); delete from the row or from the edit sheet; an existing item brought by the add sheet, also a saved item brought back (LIST-35); a manual move (reorder) |
  | Groups | * The slide of a recipe head that buys the group (GROUP-21) |
  | Trip | **Terminar compra**, from the banner or from the trip sheet |
  | Recipes | Send; delete, from the row or the sheet; removal of a product; save and removal of a link; * a recipe made from a dish of the menu |
  | Menu | **Llenar cesta**, **Quitar** of a meal, **Vaciar menú** |
  | Aisles | * Delete of an aisle |
  | Backup | Import |
  | Sample | **Borrar la receta de ejemplo** (ONB-14) |

- Evidence: `src/ui/rows.js:36`, `:67`; `src/ui/edit.js:90`; `src/ui/add.js:84`; `src/ui/drag.js:86-87`; `src/ui/list.js:18-19`, `:58`; `src/ui/recipes.js:18`, `:33`, `:98`, `:131`, `:203`, `:222`; `src/ui/menu.js:58`, `:138`, `:156`; `src/ui/aisles.js:37`; `src/ui/settings.js:168`, `:224`; test: untested.

**MSG-6** [core] [stale] These changes have no `Deshacer` and hide the current message: a new item (it then shows `"{name}" añadido a Compra.`, `toast.addedTo`, 3000 ms), a rename, the quantity, the recurrent mark, the removal of a tick, a new recipe from the add sheet, a new product, the shops of an item, a rename, move or add of an aisle, and a recipe or a dish put in a meal. The order and the grouping keep the message (MSG-4).
- Spec: "These changes have no `Deshacer`: a new item, a rename, the recurrent mark, the removal of a tick, a new recipe, a new product, the shops, the order, the grouping and a recipe put in a meal." Code: a recipe made from a dish of the menu has `Deshacer` (`toast.recipeCreated`); the order and the grouping do not hide the message.
- Evidence: `src/ui/add.js:99`, `src/ui/add.js:122-130`; `src/ui/recipes.js:131`; `src/ui/rows.js:29`, `:62`; `src/ui/aisles.js:25`, `:33`, `:80`; `src/ui/menu.js:101`, `:126`; test: untested.

**MSG-7** [core] [untested] A rejected operation shows the text of its error as a plain message and changes nothing.
- Evidence: `src/ui/context.js:215-218`; test: untested.

**MSG-8** [adapted] [untested] When a save fails, the change stays on the screen and the message is `El cambio no se ha guardado: el almacenamiento no está disponible.` (`error.notSaved`, STORE-9), with no `Deshacer`.
- Evidence: `src/ui/context.js:208`, `src/ui/context.js:221`; test: untested.
- Target: a failed DataStore/Room write → the same message.

**MSG-9** [adapted] [new] The message stands at the bottom, above the `+` button and above the dock when it shows, in reach of the thumb. While a sheet is open it moves to the top of the screen, below the top inset. The message is a live region (A11Y-3).
- Evidence: `vendor/design-system/design-system.css:1082-1148`; test: untested.
- Target: a `SnackbarHost` aligned to the bottom over the FAB; while a `ModalBottomSheet` is open, a host aligned to the top inside the sheet window (a bottom sheet is its own window, so the scaffold host is under its scrim). See Q-screen-5.

## Sheets

**NAV-8** [adapted] [verified] There are eight sheets: add, arrange (with the choice of shop lists, SHOP-25), shop picker (SHOP-27), trip, meal, edit (ROW-7), aisles (AISLE-10) and recipe (REC-33). One is open at a time. A tap on the veil (scrim), **Listo** or `Escape` closes it. The `+` button does not show while a sheet is open (NAV-28).
- Evidence: `index.html:183-328`; `src/layers.js:5-7`; `src/app.js:184-193`, `src/app.js:266-279`; veil handlers `src/ui/add.js:141`, `src/ui/edit.js:94`, `src/ui/list.js:394`, `:419`, `src/ui/recipes.js:207`, `src/ui/menu.js:139`, `src/ui/arrange.js:92`, `src/ui/aisles.js:76`; test: `tests/markup.test.js` "each of the eight sheets has the grab, then a head with its title and Listo, then a body"; `tests/layer-order.test.js` "sheetOpen is true for each sheet".
- Target: `ModalBottomSheet` (scrim tap and back close it through `onDismissRequest`); from 840 dp a side sheet. One `openSheet` field in the screen state.

**NAV-22** [adapted] [verified] Each sheet has a head: the grab, a title on one line and the button **Listo** (`edit.done`), a tonal button. The title of the edit sheet is the name of the item, of the recipe sheet the name of the recipe, of the add sheet `Añadir artículo a la lista` (`add.itemLabel`) in `Compra` or `Nombre de la receta` (`add.recipeName`) in `Recetas`, of the meal sheet the meal; the others have a fixed title. Only the body below the head scrolls. The edit and recipe sheets have a foot: **Eliminar** deletes the item or the recipe with `Deshacer` and closes the sheet; `Guardado` (`sheet.saved`) shows for 1200 ms after each save that changed the item or the recipe (a field, a shop, the aisle, a product). A save that leaves the value the same after a trim, or an error, shows no `Guardado`. A new save starts the 1200 ms again. A closed sheet shows no `Guardado`.
- Evidence: `index.html:187`, `:277`, `:294`, `:319`, `:326`; `src/ui/add.js:13-20`; `src/sheets.js:4-13`; `src/ui/controls.js:26-51`; test: `tests/markup.test.js` "the edit and recipe sheets have a foot with Eliminar and Guardado; the other sheets have none", "the sheets with a title of their own give it an id; the others a fixed text"; `tests/sheets.test.js` "Guardado shows for 1.2 s", "a write that leaves the value as it was is not a save", "a value that differs only by the spaces at its ends is not a save", "a write with an error is not a save, even when the value differs", "an operation that returns the same state object is not a save".
- Target: the `savedChange` and `changedState` predicates port as `core`; the foot is a fixed row below the scrolling body of the sheet content.

**NAV-23** [adapted] [untested] A drag down that starts on the grab or the head of a sheet closes it when, at the release, the drag passed 30 % of the sheet height, or the release speed is above 0.5 dp/ms (speed taken over the last 100 ms of moves; a pause of more than 100 ms before the release counts as 0). A shorter, slower drag puts the sheet back. The veil fades with the drag (opacity 1 − dy/height). A drag that starts on a button, field, link or select of the head does nothing. A cancelled pointer puts the sheet back. A side sheet (from 840 dp) does not drag.
- Evidence: `vendor/design-system/sheet.js:4-68`; `src/app.js:276-279`; test: untested (the design system says it needs a browser).
- Target: `ModalBottomSheet` has its own drag-to-dismiss with other thresholds; see Q-screen-3.

**NAV-9** [adapted] [stale] The trip button of the header (three dots, accessible name `Opciones de la compra`, `trip.menu`) shows only in `Compra`. A tap closes an open row and opens the trip sheet from the bottom. The sheet has the title `¿Terminar la compra?` (`trip.question`), then the rows of where the items go (TRIP-4), the hint line of the open items with a link button **Ajustes** (TRIP-6, TRIP-7), the primary button **Terminar compra** (disabled when TRIP-1 does not hold) and the tonal button **Seguir comprando** (`trip.continue`), which closes the sheet.
- Spec: "The sheet has the title `Opciones de la compra`, the line of where the items go (TRIP-4), the line of the open items (TRIP-6) and the button **Terminar compra**, in this order." Code: the title is `¿Terminar la compra?`; `Opciones de la compra` is the button name and the dialog label; a fourth control **Seguir comprando** follows. `03-lists.md` already says `¿Terminar la compra?`.
- Evidence: `index.html:27`, `:241-253`; `src/ui/list.js:231-242`, `src/ui/list.js:384-388`, `src/ui/list.js:419-426`; test: `tests/markup.test.js` "the trip button opens a sheet from the bottom, with a veil, and the header has no dropdown".

**NAV-10** [adapted] [untested] The trip sheet closes as each sheet does (NAV-8), and by **Seguir comprando**. The open puts the focus on **Terminar compra**; the close puts it back on the trip button. **Ajustes** in the hint closes the sheet and goes to `Ajustes`.
- Evidence: `src/ui/list.js:355-359`, `src/ui/list.js:384-388`, `src/ui/list.js:419-424`; test: untested.
- Target: `FocusRequester` on open; on dismiss, request focus on the trip button. For TalkBack, the initial accessibility focus follows the focus request.

**NAV-24** [core] [verified] From 600 dp the `+` button floats above the bottom corner of the list at the side of the hand (56 × 56 dp). It collapses to a square of the tap size (48 dp) after a scroll down of more than 24 dp since the last scroll up (or since the top), and opens again on any scroll up and at the top of the list (`fabState`). Below 600 dp the `+` is the last button of the dock, 48 dp, with no collapse; with no dock the floating button shows as from 600 dp.
- Evidence: `src/sections.js:24-32`; `src/app.js:220-234`; `vendor/design-system/design-system.css:1709-1728`, `:1902-1907`; test: `tests/sections.test.js` "fabState collapses the add button after a scroll down of more than 24 px", "fabState opens the add button on any scroll up", "fabState opens the add button at the top of the list", "fabState keeps the state on a short scroll down".
- Target: `fabState` ports as a pure function fed by the `LazyListState` scroll offset; the collapse is `ExtendedFloatingActionButton(expanded = …)` or an animated size.

**NAV-25** [adapted] [verified] `Escape` and the back of the phone close one layer, the top one first: an open sheet, then an open row, then the search of a list (`closeTop`). A lifted row (reorder) is put back first. With nothing open, the back leaves the app as the platform does. While the walkthrough is open, `Escape` closes it (ONB-5), and the back does not close a layer (see Q-screen-2). A start from a launcher shortcut or an arrival reads its request once, so a reload or recreate opens nothing again.
- Evidence: `src/layers.js:9-15`; `src/app.js:57-73`, `src/app.js:196-218`, `src/app.js:236-246`, `src/app.js:283-300`; test: `tests/layer-order.test.js` "closeTop gives the sheet first, then the row, then the search, then null", "closeTop does not change the screen state".
- Target: `closeTop` ports as `core`. The history entry becomes a `BackHandler(enabled = closeTop(ui) != null)` (or `PredictiveBackHandler`); a `ModalBottomSheet` handles back for itself. The address clean-up becomes "consume the intent extra once" (`intent.removeExtra` or a handled flag in `SavedStateHandle`). Hardware `Escape` maps to the same handler through `onKeyEvent`.

## Hand

**NAV-11** [adapted] [verified] **Mano** (`settings.hand`) of `Ajustes` has two values: `Derecha` (`settings.handRight`) and `Izquierda` (`settings.handLeft`). With no choice, or an unknown stored value, the app uses `Derecha`.
- Evidence: `src/ui/settings.js:131-132`, `:185`; `src/ui/context.js:74`, `:241-245`; `src/storage.js:246-262`; test: `tests/storage.test.js` "loadHand returns right for no value and for an unknown value", "loadHand returns the stored hand".
- Target: DataStore preference.

**NAV-12** [adapted] [verified] The choice is stored in `shopping.hand` as `left`; `Derecha` removes the key. It is a preference of the device, not a part of the state: `Deshacer` and an import do not change it. A storage that throws does not break the change; with no storage the choice lasts until the app closes.
- Evidence: `src/storage.js:246-262`; `src/ui/context.js:241-245`; test: `tests/storage.test.js` "saveHand stores left and right removes the key", "the hand functions do not throw when the storage does", "the hand is not part of the state".
- Target: `shopping.hand` → a DataStore key outside the state document.

**NAV-13** [adapted] [stale] With `Izquierda` the controls change side:

  | Part | `Derecha` | `Izquierda` |
  |---|---|---|
  | `+` button | Dock, at its end; from 600 dp bottom right | Dock, at its start; from 600 dp bottom left, clear of the rail |
  | Rail, from 600 dp | Right | Left |
  | Dock, below 600 dp | Search, then `+`, at the right | `+`, then search, at the left |
  | Header | Text, buttons | Buttons, text |
  | Row | Check mark at the left, edit button at the right | Check mark at the right, edit button at the left |
  | Sheet head and foot | Title, **Listo**; **Eliminar**, `Guardado` | Mirrored: **Listo** at the left |
  | Field with its add button (`input-row`) | Field, button | Button, field |
  | Primary of a two-button pair (`hand-side`: **Llenar cesta**, the recipe of a meal) | Right column | Left column |
  | Message, from 600 dp | Clear of the rail at the right | Clear of the rail at the left |

- Spec: the table has the row "Walkthrough bar | **Saltar**, **Siguiente** | **Siguiente**, **Saltar**" and NAV-14 says `Izquierda` does not change the sheets. Code: the walkthrough has no hand rule (as ONB-3 and ONB-12 say), and the head and foot of a sheet, the `input-row` and `hand-side` mirror.
- Evidence: `src/ui/context.js:74-75`; `styles.css` at HEAD lines 36-39, 110-113, 146-161; `vendor/design-system/design-system.css:967-970`, `:1760-1814`, `:1909-1917`, `:1984-1986`, `:2007-2009`, `:1137-1140`; test: untested.
- Target: a `CompositionLocal` `Hand` read by the scaffold, the dock, the row and the sheet head. Do not use `LayoutDirection.Rtl`: it would also flip text and slides (NAV-14).

**NAV-14** [adapted] [stale] `Izquierda` does not change the alignment of text, the order of the sections in the bar, the sides of a row slide (ROW-3, ROW-11) or the walkthrough.
- Spec: "… the sheets or the sides of a slide of a row". Code: the head and foot of a sheet mirror (NAV-13).
- Evidence: `vendor/design-system/design-system.css:967-970`; `src/ui/rows.js:83`, `:110-111` (no hand in the slide); test: untested.

## Theme

**NAV-15** [adapted] [verified] **Tema** (`settings.theme`) of `Ajustes` has three values: `Automático` (`settings.automatic`), `Claro` and `Oscuro`. With no choice, or an unknown value, the app uses `Automático`.
- Evidence: `src/ui/settings.js:133-138`, `:187`; `src/ui/context.js:78`, `:247-251`; test: `tests/storage.test.js` "loadTheme returns system for no value and for an unknown value".

**NAV-16** [adapted] [untested] `Automático` follows the phone (A11Y-6). `Claro` shows the light colours and `Oscuro` the dark colours, whatever the phone uses. A change shows at once, with no restart. The system bar takes the colour of the ground and follows the phone only: `#f4f3f1`, or `#0f0f0e` when the phone uses dark colours, also with `Claro` or `Oscuro` chosen.
- Evidence: `src/ui/context.js:247-251`; `index.html:6-7`; `vendor/design-system/design-system.css:110-116`; test: untested.
- Target: `MaterialTheme` with a light or dark colour scheme chosen from the preference and `isSystemInDarkTheme()`; `enableEdgeToEdge` system bar style. See Q-screen-4 for the bar.

**NAV-17** [adapted] [verified] The choice is stored in `shopping.theme` (`light` or `dark`); `Automático` and an unknown value remove the key. It is a preference of the device: `Deshacer` and an import do not change it.
- Evidence: `src/storage.js:317-340`; test: `tests/storage.test.js` "saveTheme stores light and dark and system removes the key", "saveTheme removes the key for an unknown theme", "the theme functions do not throw when the storage does", "the theme is not part of the state".

## Density

**NAV-19** [adapted] [verified] **Densidad** (`settings.density`) of `Ajustes` has two values: `Normal` and `Compacta`. With no choice, or an unknown value, the app uses `Normal`.
- Evidence: `src/ui/settings.js:139-140`, `:189`; `src/ui/context.js:85-86`, `:253-257`; test: `tests/storage.test.js` "loadDensity returns normal for no value and for an unknown value".

**NAV-20** [adapted] [stale] `Compacta` sets the compact token set: the large tap size `--tap-l` is 48 dp in place of 56 dp (rows of `Compra` and `Recetas`, the settings rows, the walkthrough button, the add field), the bottom bar 56 dp in place of 64 dp and the dock 48 dp in place of 56 dp. The least tap target stays 48 dp. In `Menú` the head of each day is shorter and a meal is 48 dp high at the least. The floating `+` stays 56 dp and the `+` of the dock stays 48 dp. A change shows at once, with no restart.
- Spec: "the rows of `Compra` and of `Recetas` and the `+` button are 48 px high in place of 56 px … The sheets and `Ajustes` do not change." Code: the floating `+` has a fixed 56 px size and does not change; every part sized by `--tap-l` changes, `Ajustes` rows too (they have `min-height: var(--tap-l)`). See Q-screen-7.
- Evidence: `vendor/design-system/design-system.css:72`, `:76-77`, `:103-108`, `:1709-1728`; `styles.css` at HEAD lines 243-247, 511-560; test: untested.
- Target: two dimension sets in a `CompositionLocal`.

**NAV-21** [adapted] [verified] The choice is stored in `shopping.density` as `compact`; `Normal` and an unknown value remove the key. It is a preference of the device: `Deshacer` and an import do not change it.
- Evidence: `src/storage.js:343-361`; test: `tests/storage.test.js` "saveDensity stores compact and normal removes the key", "saveDensity removes the key for an unknown density", "the density is not part of the state".

## Onboarding

**ONB-1** [core] [verified] The walkthrough is a layer over the full app, with six pages in this order: `lists` (`Tu próxima compra, casi hecha`), `trip` (`Marca lo de siempre`), `row` (`Desliza una fila`), `sections` (`Desliza la pantalla`), `recipes` (`¿Qué comemos esta semana?`), `sample` (`Una receta para empezar`). Title key `onboarding.<page>.title`, text key `onboarding.<page>.text` with the parameters `active` (the name of `Compra`) and `name` (the name of the sample recipe).
- Evidence: `src/onboarding.js:2`; `src/ui/onboarding.js:44-47`; `index.html:338-398`; test: `tests/onboarding.test.js` "PAGES has the six pages in their order, each one time"; `tests/markup.test.js` "the walkthrough has one drawing for each page, in the order of the pages".

**ONB-2** [core] [verified] A page has a drawing, a title and a text. A drawing has no text, does not move, and is in the main action colour (`--primary`), its ticked boxes too. A line break in a catalog text starts a new line. A text between two backticks is a key: its icon and its text in bold, in the text colour, with no border or box, and no line break inside. A key that starts with `#name` shows the icon `name`, then the rest of its text. A key with an icon and no text has the accessible name `onboarding.icon.<name>`. A backtick with no pair stays as text; empty parts are left out. The app icon (`icons/logo.png`, 96 dp, decorative) shows on page 1 only, above the drawing. The title keeps the room of two lines and the text the room of five lines (32 characters wide), so the drawing stands at the same place on each page.
- Evidence: `src/onboarding.js:15-37`; `src/ui/onboarding.js:10-18`, `:50`; `index.html:336`; `styles.css` at HEAD lines 834-869; test: `tests/onboarding.test.js` "textParts marks the text between backticks as a key", "textParts keeps a backtick with no pair as text", "textParts reads an icon of the sprite at the start of a key, with or without text", "textParts reads a # that is not at the start of a key, or a lone #, as text"; `tests/markup.test.js` "the walkthrough puts the app icon first inside the page group, with no text".
- Target: `textParts` ports as `core`; the key is an `AnnotatedString` span with an `InlineTextContent` icon; the fixed room is `minLines = 2` / `minLines = 5`.

**ONB-3** [adapted] [verified] The top bar has **Atrás** (`onboarding.back`, in `--primary`) at the start and **Saltar** (`onboarding.skip`) at the end, both with no border or fill. **Atrás** shows on pages 2 to 6 and shows the previous page. **Saltar** does not show on the last page. The bar keeps out of the top inset and does not follow **Mano**. **Siguiente** (`onboarding.next`) takes the full width at the bottom, 56 dp high (`--tap-l`); on the last page it reads **Empezar** (`onboarding.start`). One dot per page shows the place of the page; a dot is not a button.
- Evidence: `src/onboarding.js:10-13`; `src/ui/onboarding.js:48-53`; `index.html:330-408`; test: `tests/markup.test.js` "the walkthrough order is: top bar with Atrás and Saltar, the page, the dots, the next button"; `tests/onboarding.test.js` "hasBack is false on the first page and true on the others", "isLast is true for the last page only".

**ONB-4** [adapted] [verified] A horizontal slide with the measures of NAV-3 (60 dp, 2:1) anywhere on the walkthrough changes the page: to the left for the next one, to the right for the previous one. `ArrowRight` and `ArrowLeft` do the same. The move stops at the first and at the last page (no wrap, no close). The new page comes in from its side: 48 dp offset, opacity 0 → 1, 250 ms ease-out.
- Evidence: `src/onboarding.js:8`; `src/ui/onboarding.js:73-86`, `:103-119`; `src/app.js:237-241`; `styles.css` at HEAD lines 819-830; test: `tests/onboarding.test.js` "step goes one page forward and one page back", "step does not go past the first and the last page"; `tests/sections.test.js` "slideDirection is 1 for a slide to the left and -1 for a slide to the right".
- Target: the same release-time slide detector as NAV-3, not a `HorizontalPager`; arrow keys through `onKeyEvent`.

**ONB-5** [adapted] [untested] **Saltar**, **Empezar** and `Escape` close the walkthrough. While it is open, other keys do nothing to the app below.
- Evidence: `src/ui/onboarding.js:89-99`; `src/app.js:237-242`; test: untested.

**ONB-6** [core] [verified] At the start the walkthrough shows when the storage has no `shopping.v1` and no `shopping.onboarded`. A stored state that is not valid counts as a stored state, so a phone that has lists does not see it after an update.
- Evidence: `src/onboarding.js:5`; `src/ui/context.js:95`, `:146`; `src/storage.js:388-395`; test: `tests/onboarding.test.js` "shouldShow is true for no flag and no stored state", "shouldShow is false for a stored state", "shouldShow is false after the walkthrough was seen"; `tests/storage.test.js` "hasStoredState is true for a stored text that is not a valid state".

**ONB-7** [adapted] [verified] A close writes `1` to `shopping.onboarded`. An app that closes with the walkthrough open shows it again at the next start. The key is a preference of the device: `Deshacer` and an import do not change it.
- Evidence: `src/ui/onboarding.js:65-70`; `src/storage.js:367-385`; test: `tests/storage.test.js` "saveOnboarded stores the flag", "the flag of the walkthrough is not part of the stored state".
- Target: a DataStore boolean written on close.

**ONB-8** [adapted] [verified] With no storage, or a storage that cannot be read, the walkthrough does not show at the start.
- Evidence: `src/ui/context.js:95`; `src/storage.js:369-376`; test: `tests/storage.test.js` "loadOnboarded is true for a storage that throws".

**ONB-9** [adapted] [untested] **Ver la introducción** (`settings.onboarding`) of `Ajustes` shows the walkthrough from page 1 at any time. A close in `Ajustes` puts the focus on that button.
- Evidence: `src/ui/onboarding.js:56-62`, `:69`, `:100`; test: untested.

**ONB-10** [adapted] [untested] While the walkthrough is open, the header, the content, the dock, the `+` button and the bottom bar take no tap, no slide and no focus. A message of the start (for example `error.noStorage`) is not blocked.
- Evidence: `src/ui/onboarding.js:31-34`; test: untested.
- Target: a full-screen `Dialog` (`usePlatformDefaultWidth = false`) or an overlay that consumes input; content below is hidden from accessibility.

**ONB-11** [adapted] [untested] The walkthrough is a modal dialog with the label `Introducción` (`onboarding.label`). The focus goes to the page title when it opens, with no focus ring. A change of page keeps the focus on the pressed button, or moves it to **Siguiente** when that button goes away. The dots have the label `Página N de 6` (`onboarding.page`) as one image. The title and the text are a polite live region.
- Evidence: `index.html:330`, `:400-403`, `:406`; `src/ui/onboarding.js:49`, `:56-62`, `:77-80`; `src/app.js:282`; test: `tests/markup.test.js` "the walkthrough title can take the focus, so no button shows a ring on load" (the title only).
- Target: `Modifier.semantics { paneTitle = …; liveRegion = LiveRegionMode.Polite }` on the title and text; dots `contentDescription`; a `FocusRequester` on the title for TalkBack.

**ONB-12** [adapted] [untested] With reduced motion a page changes with no animation. The walkthrough keeps out of the four safe-area insets. **Mano** changes nothing in the walkthrough.
- Evidence: `vendor/design-system/design-system.css:95-101`; `styles.css` at HEAD lines 765-780; test: untested.
- Target: `WindowInsets.safeDrawing` padding; reduced motion = animator duration scale 0.

**ONB-13** [core] [untested] The last page has the switch **Añadir la receta de ejemplo** (`onboarding.sample.switch`), on at each open from `Ajustes` and at the first start. It shows only on the last page and only while the state has no sample recipe (REC-27); else its room stays empty and the page does not move. **Empezar** with the switch on adds the sample recipe in the language of the screen and sends its products to `Compra`, with no message (it hides the current one). **Saltar**, `Escape` and **Empezar** with the switch off add nothing.
- Evidence: `src/ui/onboarding.js:20-26`, `:36-39`, `:56-58`, `:89-97`; `index.html:404`; test: `tests/recipes.test.js` "loadSample adds the sample recipe and sends its products to Active", "hasSample is true only while the sample recipe exists" (the store part).

**ONB-14** [core] [untested] `Ajustes` has **Borrar la receta de ejemplo** (`settings.deleteSample`) in **Ayuda**, below **Ver la introducción**, while the sample recipe exists. It deletes the recipe as REC-6 does, with the message `Receta de ejemplo borrada.` (`toast.sampleDeleted`) and `Deshacer`. The focus goes to **Ver la introducción**.
- Evidence: `src/ui/settings.js:42-44`, `:165-169`; `index.html:129`; test: untested (`tests/markup.test.js` "Borrar la receta de ejemplo is a danger row with no chevron" covers the look).

## Access and display

**A11Y-1** [adapted] [stale] Each icon-only button has an accessible name in the language of the screen. The name of the edit button of a row is `Editar` (`row.edit`), with no item name; the side actions use their visible names (**Editar**, **Repetir**, `No repetir`), and **Eliminar** of a row is named `Eliminar {name}` (`row.delete`). The remove button of a product is named with the product (`recipe.removeProduct`). Header and dock buttons have a fixed name (`search.label`, `arrange.label`, `trip.menu`, `dock.previous`, `dock.next`, `search.clear`).
- Spec: "Each icon button has an `aria-label` with the action and the name of its object". Code: the row edit button and most header buttons have the action only.
- Evidence: `src/ui/controls.js:19-24`; `src/ui/rows.js:26-54`; `src/ui/recipes.js:37`; `index.html:21-29`, `:143-159`; test: untested.
- Target: `contentDescription` / `Modifier.semantics { contentDescription = … }`.

**A11Y-2** [adapted] [untested] A toggle states its value: the shop chips, the segments of the arrange sheet and of **Al terminar la compra**, and the entries of the shop picker are pressed or not. A control that opens or closes something states it: the search buttons, the trip button, the shop chip of the dock, a group head and `Comprados (N)` are expanded or collapsed. The section in view is the current page of the bar. The edit and trip buttons say they open a dialog.
- Evidence: `src/ui/list.js:168`, `:235`, `:261`, `:291`, `:305`, `:329`; `src/ui/rows.js:52`, `:259`, `:294`; `src/ui/settings.js:147-151`; `src/app.js:120-123`; test: untested.
- Target: `Modifier.selectable`/`toggleable` with `Role.Tab`/`Role.Switch` as fits; `stateDescription` plus `expand`/`collapse` semantics actions; `NavigationBarItem(selected = …)`; `Role.DropdownList` or `onClickLabel` for dialog openers.

**A11Y-3** [adapted] [untested] The message is a polite live region: TalkBack reads each new message without moving the focus.
- Evidence: `index.html:33-36`; test: untested.
- Target: Material `Snackbar` announces itself; a custom host needs `liveRegion = LiveRegionMode.Polite`.

**A11Y-4** [adapted] [untested] The side actions of a closed row are out of reach of focus and screen reader; they come into reach only while the side is open.
- Evidence: `src/ui/rows.js:207`; `src/app.js:159-161`; test: untested.
- Target: do not compose the actions, or hide them from semantics, while the row is closed. Add `customActions` (Editar, Repetir, Eliminar) on the row so TalkBack users reach them without a slide; see Q-screen-8.

**A11Y-5** [adapted] [untested] With reduced motion, the rows and the groups change with no animation (ROW-9), the section and the page come in with no move (NAV-5, ONB-12), and the swipe hint does not play (ROW-14).
- Evidence: `src/ui/motion.js:5`, `:21`, `:51`, `:113`; `src/ui/rows.js:150`; `vendor/design-system/design-system.css:95-101`; test: untested.
- Target: `Settings.Global.ANIMATOR_DURATION_SCALE == 0` (Remove animations).

**A11Y-6** [adapted] [untested] With the phone in dark mode and **Tema** at `Automático`, the app shows dark colours (NAV-16).
- Evidence: `src/ui/context.js:78`, `:83`; `vendor/design-system/design-system.css:110-116`; test: untested.
- Target: `isSystemInDarkTheme()`.

**A11Y-7** [adapted] [untested] The header, the bottom bar, the rail, the `+` button, the message and the sheets keep out of the safe-area insets. The view resizes when the keyboard opens.
- Evidence: `index.html:5`; `vendor/design-system/design-system.css:1089`, `:1146`; `styles.css` at HEAD lines 21-39, 96, 105-113; test: untested.
- Target: edge-to-edge with `WindowInsets.safeDrawing`; `imePadding()` (or `windowSoftInputMode=adjustResize`).

**A11Y-8** [dropped] [untested] User text goes into the page as `textContent`, never as markup.
- Evidence: `src/ui/rows.js:15-22`; `src/ui/list.js:139-144`; test: untested.
- Reason: a DOM rule. Replacement: nothing; Compose `Text` shows plain strings. Never pass user text to `AnnotatedString.fromHtml` or `Html.fromHtml`.

## Limits

No move of a row with the keyboard, and no keyboard way to open a side menu of an item row. The
walkthrough has no tour of shops, shop lists, quantities, backup or the settings of `Ajustes`, and
no marks on the real controls. The sample data is one recipe only: no item and no meal.
