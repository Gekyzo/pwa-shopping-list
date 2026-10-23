# Screen

Rules of `index.html`, `styles.css`, `src/app.js`, `src/ui/`, `src/swipe.js` and `src/sections.js`.

## Layout

From top to bottom: the header (title, subtitle, search button, arrange button, trip
button, and the bar of `Compra`), the content of the section, the `+` button above the bottom bar, and the bottom bar.
Below 600px wide the dock of `Compra` and `Recetas` stands above the bottom bar (SHOP-26) and holds
the `+` button at its end, and no `+` button floats over the list. The header has no search button
while the dock shows. The title keeps one line, with an
ellipsis. The message shows below the top
edge. A sheet comes up from the bottom, over a veil. The walkthrough of the first start covers all
of it.

From 600px wide (a tablet, an unfolded phone, a phone on its side) the bottom bar is a rail at the
side of the hand (NAV-13), and the header and the content form one centred column (DSV-8). The rules below name it
the bottom bar at each width.

## Sections

- **NAV-1** The bottom bar has four sections, in this order: `Compra`, `Recetas`, `Menú`,
  `Ajustes`. The app starts in `Compra`. A
  section shows its icon and its name, and no count. Its name is also the name of its button for a
  screen reader.
- **NAV-2** A tap on the bottom bar changes the section. A change closes each open row, ends an
  edit, and closes the search (LIST-24, REC-26).
- **NAV-3** A horizontal slide changes the section: to the left for the next one, to the right for
  the previous one. The slide is 60 px long at least and its horizontal part is two times its
  vertical part at least. It stops at `Compra` and at `Ajustes`.
- **NAV-4** The slide starts on the header or on the content, but not on an item row, not on the
  row of shop lists (SHOP-17), not on the dock (SHOP-26) and not on a text field. It does nothing while a sheet is open, a row is lifted or the walkthrough is open
  (ONB-10).
- **NAV-5** The content of the new section comes in from its side of the bottom bar, after a slide
  and after a tap.
- **NAV-6** `Ajustes` has six groups, each a title above one card of rows: **Copia de seguridad**
  (**Exportar**, **Importar**, **Borrar todos los datos**), **Preferencias** (**Idioma**, **Mano**, **Tema**, **Densidad**),
  **Al terminar la compra** (TRIP-7), **Secciones**, **Aplicación** (**Instalar la aplicación**) and
  **Ayuda** (**Ver la introducción**, **Borrar la receta de ejemplo**). A row is 56 px high or more.
  It has its name at the start. A row that opens something ends with a `›`; **Exportar**,
  **Importar**, **Secciones de la tienda** and **Ver la introducción** do. A row of **Preferencias**
  also shows its current value before the `›`, and a tap on the row opens the picker of the device
  (a `select` laid over the row). **Secciones de la tienda** shows the number of sections.
  **Borrar la receta de ejemplo** and **Borrar todos los datos** (BACKUP-7) have the colour of
  danger and no `›`. **Aplicación** is hidden,
  with its title, while the install is not offered (INS-1). The version line is at the end of
  `Ajustes`; while a newer version is deployed, a banner above it says `Versión X disponible` and
  `Tienes la Y.` (the version in use), with the button **Actualizar** across the full width.
- **NAV-7** An empty section shows a title and a text in the lower half of the list area, and
  one action as a wide button below them. `Compra` has the title `Aún no hay artículos`, the
  text `Añade lo que necesitas comprar y márcalo en la tienda.` and the button **+ Añadir
  artículo**, which opens the add sheet. As in `Recetas`, the title and the text stand in the
  middle of the room above the buttons, and the buttons at the bottom. With the sample recipe in
  the state it says `Añade tu primer artículo, o empieza con la receta «name».`; the button **+ Añadir artículo** opens the add sheet, and a second,
  outline button **Añadir la receta de ejemplo** below it sends that recipe to `Compra`. `Recetas` says `Aún no hay
  recetas` in the middle of the room above its button, and the button **+ Crear receta**, at the
  bottom, opens the add sheet. `Menú` always shows its week
  (MENU-14). A search with no match says `Ningún artículo
  coincide con «text».` in `Compra`, with the button **+ Añadir «text»**, which adds the name as
  the add sheet does and ends the search; in `Recetas` it says `Ninguna receta coincide con
  «text».` with no button. While the button shows, the `+` button hides.
- **NAV-18** Retired: the Ledger look of design system 0.7.0 keeps the ground of a list plain,
  so no section shows a drawing behind its content.

## Item rows

- **ROW-1** A row of `Compra` has a check mark, the name with its quantity after it in a muted
  colour, a line below it with the shops, `También en «recipes»` for an item of two recipe groups
  (GROUP-20) and `↻ cada compra` for a recurrent item (LIST-7), joined by ` · `, and an
  edit button **Editar** at its end. The name keeps two lines, then ends with an ellipsis. A tap on
  the body of the row ticks or unticks the item (LIST-11); the check mark only shows the state. A
  tap on the edit button opens the edit sheet (ROW-7) and does not tick. With **Izquierda**
  (NAV-12) the edit button is at the start of the row and the check mark at its end. For the
  keyboard and a screen reader, the name is a checkbox: `Space` or `Enter` ticks it.
- **ROW-2** Removed: the app has one list, `Compra` (ROW-1).
- **ROW-3** A slide of a row to the left shows its actions, as buttons 72 px wide with an icon and
  its name below it:

  | Row | Slide to the left |
  |---|---|
  | `Compra` | **Editar**, **Repetir** (`No repetir` for a recurrent item, LIST-7), **Eliminar** |

- **ROW-4** A drag becomes a slide after 10 px of horizontal move. A drag that is first vertical
  scrolls the list.
- **ROW-5** The left side opens when the drag passes 40 % of the width of that side, 40 px at least. An
  open side closes with a drag back of the same length. If not, the row goes back to where it was.
  The actions of the side show behind the row during the drag, from its first pixel to the left.
- **ROW-6** One row is open at a time. A tap out of the open row closes it, and that tap still
  does its own work. A tap on the body of the open row only closes it. An action closes the row,
  then runs.
- **ROW-7** The edit sheet `Editar` has the field **Nombre**, 80 characters at most, the field
  **Cantidad**, 20 characters at most (LIST-27), the switch **Repetir en cada compra** (LIST-7), then the shops (SHOP-9 to SHOP-15). The name of
  a field shows inside it while it is empty, and moves onto its top border when it has a value or
  the focus. `Enter` or a
  loss of focus saves a field (LIST-5); an error shows its message and the field shows the old
  value again. `Escape` in a field puts the value back and keeps the sheet open. A change of
  quantity has no message and no `Deshacer`. The sheet opens with no focus in a field.
- **ROW-8** The click that follows a drag, a hold or a section slide is ignored for 350 ms, so it
  does not tick an item or press a button.
- **ROW-9** No row appears or disappears at once. A ticked row closes in 200 ms before it goes to
  `Comprados (N)`. After each
  other change of the state (add, delete, move, untick, **Terminar compra**, `Deshacer`) and each open
  or close of a section, a new row of `Compra`, `Recetas` or the
  products of `Receta` opens in 200 ms, and a row that is gone stays in its place and closes in
  200 ms. A change of the grouping or of the order moves the rows ([04-arrange.md](04-arrange.md)). With
  `prefers-reduced-motion` nothing moves.
- **ROW-10** A long press of a finger on a row does not open the menu of the browser.
- **ROW-11** A slide of a row to the right runs an action at the release: in `Compra` it ticks or
  unticks the item (LIST-11), with `Deshacer` for a tick (LIST-13). It runs when the slide passed 35 % of the width of the row, 80 px at least; a
  shorter slide puts the row back. The row slides over a backdrop with the icon of the action,
  which fills with the done colour (`--done`) once the slide is long enough. At that moment the phone
  vibrates for 10 ms, for a tick and for an untick. A row with its left side open closes it.
- **ROW-12** A recipe row of `Recetas` slides with the same rules (REC-5).
- **ROW-13** Removed: a saved item has no row (LIST-35).
- **ROW-14** The first time `Compra` shows a row, after 600 ms the body of its first row slides
  24 px to the left and back, so the user sees that a row slides. Then `shopping.swipeHint` is
  `1` and the hint does not play again. With `prefers-reduced-motion` it does not play.

## Messages and undo

- **MSG-1** One message shows at a time. A new message replaces the old one.
- **MSG-2** A plain message stays 3 seconds. A message with `Deshacer` stays 5 seconds. The
  arrival message stays 10 seconds (ARR-2).
- **MSG-3** `Deshacer` puts back the full state of before the change, and saves it. It has one
  level.
- **MSG-4** A later change with no `Deshacer` of its own hides the message, and the earlier undo
  is lost. A change of order or of grouping is the exception: the message stays, and its
  `Deshacer` then also puts back the order and the grouping of before.
- **MSG-5** These changes have `Deshacer`:

  | Area | Changes |
  |---|---|
  | Items | Tick, by a tap on the row (ROW-1) or by a slide (ROW-11), delete, an existing item brought by the add sheet, a saved item brought back (LIST-35), a manual move |
  | Trip | **Terminar compra** |
  | Recipes | Send, delete, removal of a product, save and removal of a link |
  | Menu | **Llenar cesta**, **Quitar** of a meal, **Vaciar menú** |
  | Backup | Import |

- **MSG-6** These changes have no `Deshacer`: a new item, a rename, the recurrent mark,
  the removal of a tick, a new recipe, a new product, the shops, the order, the
  grouping and a recipe put in a meal.
- **MSG-7** A rejected operation shows the text of its error and changes nothing.
- **MSG-8** When a save fails, the change stays on the screen and the message is `El cambio no se
  ha guardado: el almacenamiento no está disponible.` (STORE-9).

## Sheets

- **NAV-8** There are eight sheets: add, arrange (with the choice of shop lists, SHOP-25), shop
  picker (SHOP-27), trip, meal, edit (ROW-7), aisles (AISLE-10) and recipe (REC-33).
  One is open at a time. A tap on the
  veil, **Listo** or `Escape` closes it. The `+` button, also the one of the dock, does not show
  while a sheet is open.
- **NAV-22** Each sheet has a head: the grab, a title on one line and the button **Listo**, a tonal button. The
  title of the edit sheet is the name of the item, of the recipe sheet the name of the recipe, of
  the add sheet `Añadir artículo a la lista` or `Nombre de la receta` by the section. Only the body
  below the head scrolls. The edit and recipe sheets have a foot: **Eliminar** deletes the item or
  the recipe with `Deshacer` (the message of a delete from the row) and closes the sheet; `Guardado`
  shows for 1.2 s after each save that changed the item or the recipe (a field, a shop, the aisle,
  a product), and not after a loss of focus with no change or an error. A closed sheet shows no
  `Guardado`.
- **NAV-23** A drag down of the grab or the head of a sheet closes it when the drag passes 30 % of
  the height of the sheet, or when the release is faster than 0.5 px/ms. A shorter, slower drag
  puts the sheet back. A drag that starts on a button or a field of the head does nothing.
- **NAV-9** The trip button of the header has three dots. It shows in `Compra`. A tap
  opens the trip sheet from the bottom, as the arrange button opens its sheet. The sheet has the
  title `Opciones de la compra`, the line of where the items go (TRIP-4), the line of the open items
  (TRIP-6) and the button **Terminar compra**, in this order.
- **NAV-10** The trip sheet closes as each sheet does (NAV-8). The open puts the focus on
  **Terminar compra**, and the close puts it back on the trip button.

- **NAV-24** From 600px the `+` button floats above the bottom right of the list. It collapses to a
  square of the tap size (48 px) after a scroll of the list of more than 24 px down, and opens
  again on any scroll up and at the top of the list (`fabState`). Below 600px the `+` is the last
  button of the dock, with no collapse; it floats as from 600px only while the dock does not show.
- **NAV-25** `Escape` and the back of the phone close one layer, the top one first: an open sheet,
  then an open row, then the search of a list (`closeTop`). While a layer is open, one entry of the
  history stands for it, so the back closes the layer and not the app. A layer closed in another
  way takes its entry away, so the next back goes back as the browser does. A start from a
  shortcut or an arrival takes its query out of the address before it opens anything.

## Hand

- **NAV-11** **Mano** of `Ajustes` has two values: `Derecha` and `Izquierda`. An app with no
  choice uses `Derecha`.
- **NAV-12** The choice is stored in `shopping.hand`. `Derecha` removes the key. It is a
  preference of the device, not a part of the state: `Deshacer` and an import do not change it.
- **NAV-13** With `Izquierda` the controls change side:

  | Part | `Derecha` | `Izquierda` |
  |---|---|---|
  | `+` button | Dock, at its end; from 600px bottom right | Dock, at its start; from 600px bottom left |
  | Rail, from 600px wide (DSV-8) | Right | Left |
  | Dock, below 600px wide (SHOP-26) | Search, then `+`, at the right | `+`, then search, at the left |
  | Header | Text, buttons | Buttons, text |
  | Row | Checkbox at the left, other controls at the right | Checkbox at the right, other controls at the left |
  | Walkthrough bar | **Saltar**, **Siguiente** | **Siguiente**, **Saltar** |

- **NAV-14** `Izquierda` does not change the alignment of text, the order of the sections in the bottom bar, the
  sheets or the sides of a slide of a row (ROW-3, ROW-11).

## Theme

- **NAV-15** **Tema** of `Ajustes` has three values: `Automático`, `Claro` and `Oscuro`. An app
  with no choice uses `Automático`.
- **NAV-16** `Automático` follows the phone (A11Y-6). `Claro` shows the light colours and `Oscuro`
  the dark colours, whatever the phone uses. A change shows at once, with no restart. The bar of
  the phone takes the colour of the ground and follows the phone only: light, or dark when the
  phone uses dark colours.
- **NAV-17** The choice is stored in `shopping.theme`. `Automático` removes the key. It is a
  preference of the device, not a part of the state: `Deshacer` and an import do not change it.

## Density

- **NAV-19** **Densidad** of `Ajustes` has two values: `Normal` and `Compacta`. An app with no
  choice uses `Normal`.
- **NAV-20** `Compacta` is the compact token set of the design system: the rows of `Compra` and of
  `Recetas` and the `+` button are 48 px high in place of 56 px, the bottom bar 56 px in place of
  64 px and the dock 48 px in place of 56 px, so more rows fit on one screen. A tap target stays
  48 px at the least. In `Menú` the head of each day is shorter, and a meal is 48 px high at the
  least. The sheets and `Ajustes` do not change. A change shows at once, with no restart.
- **NAV-21** The choice is stored in `shopping.density`. `Normal` removes the key. It is a
  preference of the device, not a part of the state: `Deshacer` and an import do not change it.

## Onboarding

- **ONB-1** The walkthrough is a layer over the full app, with six pages in this order:

  | Page | Title | Teaches |
  |---|---|---|
  | 1 | `Tu próxima compra, casi hecha` | `Compra` is the trip of today; what you do not buy today stays in the list for the next trip (TRIP-2) |
  | 2 | `Marca lo de siempre` | The recurrent mark and the result of **Terminar compra** |
  | 3 | `Desliza una fila` | The tap on a row (ROW-1) and its two slides (ROW-3, ROW-11) |
  | 4 | `Desliza la pantalla` | The slide between sections (NAV-3), the bottom bar and the `+` button |
  | 5 | `¿Qué comemos esta semana?` | A recipe and its products, the send to `Compra` (REC-18) and the plan of the week in `Menú` |
  | 6 | `Una receta para empezar` | The switch that adds the sample recipe (ONB-13) |

- **ONB-2** A page has a drawing, a title and a text. A drawing has no text and does not move.
  A line break in the text of a catalog starts a new line. A text between two backticks, such as
  `↻` or `+`, names a control and shows as a key: its icon and its text in bold, in the colour of the text, with no border, box or monospace font.
  A key that starts with `#name` shows the icon `name` of `icons.svg`, then the rest of its text.
  A key with an icon and no text has the label `onboarding.icon.<name>`.
  The app icon shows on page 1 only, above the drawing and inside the page group, 96 px wide, with
  no background (`icons/logo.png`, VER-15). It is decorative (`alt=""`). The title keeps the room
  of two lines and the text the room of five lines, the longest title and text of a page in any
  language, so the drawing is at the same place on pages 2 to 6.
- **ONB-3** The top bar has **Atrás** at the start and **Saltar** at the end, both without a border
  or a fill. **Atrás** is in the main action colour (`--primary`) and shows on pages 2 to 6; a tap shows the previous
  page. **Saltar** does not show on the last page. The bar keeps out of the top safe-area inset
  and does not follow **Mano**. **Siguiente** takes the full width at the bottom, 56 px high
  (`--tap-l`); on the last page it reads **Empezar**. One dot for each page shows the place of the
  page in view; a dot is not a button.
- **ONB-4** A horizontal slide with the measures of NAV-3 changes the page: to the left for the
  next one, to the right for the previous one. `ArrowRight` and `ArrowLeft` do the same. The move
  stops at the first and at the last page. The new page comes in from its side.
- **ONB-5** **Saltar**, **Empezar** and `Escape` close the walkthrough.
- **ONB-6** At the start the walkthrough shows when `localStorage` has no `shopping.v1` and no
  `shopping.onboarded`. A stored state that is not valid counts as a stored state. A phone that
  has lists thus does not see it after an update.
- **ONB-7** A close writes `1` to `shopping.onboarded`. An app that closes with the walkthrough
  open shows it again at the next start. The key is a preference of the device, not a part of
  the state: `Deshacer` and an import do not change it.
- **ONB-8** With `localStorage` not available, or not readable, the walkthrough does not show at
  the start.
- **ONB-9** **Ver la introducción** of `Ajustes` shows the walkthrough from page 1, at any time. A
  close then puts the focus on that button.
- **ONB-10** While the walkthrough is open the app below is `inert`. A message of the start stays
  below it.
- **ONB-11** The walkthrough is a `role="dialog"` with `aria-modal` and the label `Introducción`.
  The focus goes to the title of the page when it opens, so no ring shows on load; a change of
  page keeps the focus on the button that was pressed, or moves it to **Siguiente** when that
  button goes away. The dots
  have the label `Página N de 6`. The title and the text are a live region.
- **ONB-12** With `prefers-reduced-motion: reduce` a page changes with no animation. The
  walkthrough keeps out of the safe-area insets. **Mano** changes nothing in the walkthrough.
- **ONB-13** The last page has the switch **Añadir la receta de ejemplo**, on at each open of the
  walkthrough. It shows only while the state has no sample recipe (REC-27); on another page, or
  with the sample there, its room stays empty, so the page does not move. **Empezar** with the
  switch on adds the sample recipe and sends its products to `Compra`, with no message. **Saltar**, `Escape` and **Empezar** with the
  switch off add nothing.
- **ONB-14** `Ajustes` has **Borrar la receta de ejemplo** in the group **Ayuda**, below **Ver la
  introducción**, while the sample recipe exists. It deletes the recipe as REC-6 does, with the
  message `toast.sampleDeleted` `Receta de ejemplo borrada.` and `Deshacer`. The focus goes to
  **Ver la introducción**.

## Access and display

- **A11Y-1** Each icon button has an `aria-label` with the action and the name of its object, in
  the language of the screen.
- **A11Y-2** A toggle states its value with `aria-pressed`. A control that opens something states
  it with `aria-expanded`. The section in view has `aria-current="page"`.
- **A11Y-3** The message is a live region (`role="status"`, `aria-live="polite"`).
- **A11Y-4** The side menu that is closed is `inert`.
- **A11Y-5** With `prefers-reduced-motion: reduce`, the rows and the groups change with no
  animation.
- **A11Y-6** With `prefers-color-scheme: dark` and **Tema** at `Automático`, the app shows dark
  colours (NAV-16).
- **A11Y-7** The header, the bottom bar, the `+` button and the sheets keep out of the safe-area
  insets of the phone. The view resizes when the keyboard opens.
- **A11Y-8** User text goes into the page as `textContent`, never as markup.

## Limits

No move of a row with the keyboard, and no keyboard way to open a side menu of an item row. The
walkthrough has no tour of shops, shop lists, quantities, backup or the settings of `Ajustes`,
and no marks on the real controls. The sample data is one recipe only: no item and no meal.
