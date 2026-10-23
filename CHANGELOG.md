# Changelog

The changes of the app that a user sees, by deployed version. The newest version is first. The
names of the screen are the Spanish ones, as in [`docs/spec/`](docs/spec/README.md).

A change that is not deployed goes under `Unreleased`, in the commit that makes the change. The
commit `Bump version to X.Y.Z` gives its version and its date to those changes. A version with
no change for the user has no entry.

## Unreleased

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
