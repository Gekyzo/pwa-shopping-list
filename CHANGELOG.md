# Changelog

The changes of the app that a user sees, by deployed version. The newest version is first. The
names of the screen are the Spanish ones, as in [`docs/spec/`](docs/spec/README.md).

A change that is not deployed goes under `Unreleased`, in the commit that makes the change. The
commit `Bump version to X.Y.Z` gives its version and its date to those changes. A version with
no change for the user has no entry.

## Unreleased

- `Ajustes` has **Secciones de la tienda**: the sections of the store, such as `Lácteos`, in the
  order of your walk. Add, rename, move and delete them, or start with **Usar secciones
  habituales**.
- `Editar` sets the section of an item, below its shops.
- **Agrupar por** has **Secciones**: the list follows the order of the sections, also in a shop
  list. The search of a list also finds the items of a section.

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
