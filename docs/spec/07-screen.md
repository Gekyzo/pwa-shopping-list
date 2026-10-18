# Screen

Rules of `index.html`, `styles.css`, `src/app.js`, `src/ui/`, `src/swipe.js` and `src/sections.js`.

## Layout

From top to bottom: the header (ring, title, subtitle, search button, arrange button, trip
button), the content of the section, the `+` button above the bottom bar, and the bottom bar. The message shows below the top
edge. A sheet comes up from the bottom, over a veil. The walkthrough of the first start covers all
of it.

From 600px wide (a tablet, an unfolded phone, a phone on its side) the bottom bar is a rail at the
side of the hand (NAV-13), and the header and the content form one centred column (DSV-5). The rules below name it
the bottom bar at each width.

## Sections

- **NAV-1** The bottom bar has four sections, in this order: `Compra`, `Recetas`, `Menú`,
  `Ajustes`. The app starts in `Compra`. A
  section shows no count.
- **NAV-2** A tap on the bottom bar changes the section. A change closes each open row, ends an
  edit, clears the recipe search and closes the search of a list (LIST-24).
- **NAV-3** A horizontal slide changes the section: to the left for the next one, to the right for
  the previous one. The slide is 60 px long at least and its horizontal part is two times its
  vertical part at least. It stops at `Compra` and at `Ajustes`.
- **NAV-4** The slide starts on the header or on the content, but not on an item row, not on the
  row of shop lists (SHOP-17) and not on a text field. It does nothing while a sheet is open, a row is lifted or the walkthrough is open
  (ONB-10).
- **NAV-5** The content of the new section comes in from its side of the bottom bar, after a slide
  and after a tap.
- **NAV-6** `Ajustes` has seven groups: **Copia de seguridad** (**Exportar**,
  **Importar**), **Idioma**, **Mano**, **Tema**, **Al terminar la compra** (TRIP-7), **Ayuda** (**Ver la introducción**) and **Versión**. Each of the
  two buttons of the backup has an icon before its text: an arrow that goes up out of a tray for
  the export, an arrow that goes down into a tray for the import.
- **NAV-7** An empty section shows a text: `La lista está vacía. Toca + para añadir un artículo.`,
  `No hay recetas. Toca + para crear una.` or, in `Menú`, `No hay recetas. Crea una en Recetas
  para planificar el menú.`
- **NAV-18** `Compra` and `Recetas` show a line drawing of the basket of the app icon
  behind the content, in the bottom corner on the other side of the `+` button (NAV-13). It is
  tilted 30° and at 6 % opacity, and the corner and the bottom bar (the rail from 600px) cut part of it. It takes the
  colour of the text, takes no tap and does not move with the scroll.

## Item rows

- **ROW-1** A row of `Compra` has a checkbox, the name with its quantity after it in a muted
  colour and the shops below it, and the recurrent mark (LIST-7). A tap on the name opens the edit
  sheet (ROW-7).
- **ROW-2** Removed: the app has one list, `Compra` (ROW-1).
- **ROW-3** A slide of a row to the left shows its actions, as icon buttons 64 px wide:

  | Row | Slide to the left |
  |---|---|
  | `Compra` | **Eliminar** |

- **ROW-4** A drag becomes a slide after 10 px of horizontal move. A drag that is first vertical
  scrolls the list.
- **ROW-5** The left side opens when the drag passes 40 % of the width of that side, 40 px at least. An
  open side closes with a drag back of the same length. If not, the row goes back to where it was.
- **ROW-6** One row is open at a time. A tap out of the open row closes it, and that tap still
  does its own work. An action closes the row, then runs.
- **ROW-7** The edit sheet `Editar` has the field **Nombre**, 80 characters at most, the field
  **Cantidad**, 20 characters at most (LIST-27), then the shops (SHOP-9 to SHOP-15). The name of
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
  which fills with the accent colour once the slide is long enough. A row with its left side open
  closes it.
- **ROW-12** A recipe row of `Recetas` slides with the same rules (REC-5).
- **ROW-13** Removed: a saved item has no row (LIST-35).

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
  | Items | Tick, by the checkbox or by a slide (ROW-11), delete, an existing item brought by the add sheet, a saved item brought back (LIST-35), a manual move |
  | Trip | **Terminar compra** |
  | Recipes | Send, delete, removal of a product, save and removal of a link |
  | Menu | **Llenar la cesta**, **Quitar** of a meal, **Vaciar menú** |
  | Backup | Import |

- **MSG-6** These changes have no `Deshacer`: a new item, a rename, the recurrent mark,
  the removal of a tick, a new recipe, a new product, the shops, the order, the
  grouping and a recipe put in a meal.
- **MSG-7** A rejected operation shows the text of its error and changes nothing.
- **MSG-8** When a save fails, the change stays on the screen and the message is `El cambio no se
  ha guardado: el almacenamiento no está disponible.` (STORE-9).

## Sheets

- **NAV-8** There are seven sheets: add, arrange (with the choice of shop lists, SHOP-25), trip,
  meal, edit (ROW-7), aisles (AISLE-10) and recipe (REC-33). One is open at a time. A tap on the
  veil or `Escape` closes it. The `+` button does not show while a sheet is open.
- **NAV-9** The trip button of the header has three dots. It shows in `Compra`. A tap
  opens the trip sheet from the bottom, as the arrange button opens its sheet. The sheet has the
  title `Opciones de la compra`, the line of where the items go (TRIP-4), the line of the open items
  (TRIP-6) and the button **Terminar compra**, in this order.
- **NAV-10** The trip sheet closes as each sheet does (NAV-8). The open puts the focus on
  **Terminar compra**, and the close puts it back on the trip button.

## Hand

- **NAV-11** **Mano** of `Ajustes` has two values: `Derecha` and `Izquierda`. An app with no
  choice uses `Derecha`.
- **NAV-12** The choice is stored in `shopping.hand`. `Derecha` removes the key. It is a
  preference of the device, not a part of the state: `Deshacer` and an import do not change it.
- **NAV-13** With `Izquierda` the controls change side:

  | Part | `Derecha` | `Izquierda` |
  |---|---|---|
  | `+` button | Bottom right | Bottom left |
  | Rail, from 600px wide (DSV-5) | Right | Left |
  | Basket behind a list (NAV-18) | Bottom left | Bottom right |
  | Header | Ring, text, buttons | Buttons, text, ring |
  | Row | Checkbox at the left, other controls at the right | Checkbox at the right, other controls at the left |
  | Walkthrough bar | **Saltar**, **Siguiente** | **Siguiente**, **Saltar** |
  | Buttons of `Menú` | **Vaciar menú**, **Llenar la cesta** | **Llenar la cesta**, **Vaciar menú** |

- **NAV-14** `Izquierda` does not change the alignment of text, the order of the sections in the bottom bar, the
  sheets or the sides of a slide of a row (ROW-3, ROW-11).

## Theme

- **NAV-15** **Tema** of `Ajustes` has three values: `Automático`, `Claro` and `Oscuro`. An app
  with no choice uses `Automático`.
- **NAV-16** `Automático` follows the phone (A11Y-6). `Claro` shows the light colours and `Oscuro`
  the dark colours, whatever the phone uses. A change shows at once, with no restart.
- **NAV-17** The choice is stored in `shopping.theme`. `Automático` removes the key. It is a
  preference of the device, not a part of the state: `Deshacer` and an import do not change it.

## Onboarding

- **ONB-1** The walkthrough is a layer over the full app, with six pages in this order:

  | Page | Title | Teaches |
  |---|---|---|
  | 1 | `Tu próxima compra, casi hecha` | `Compra` is the trip of today; what you do not buy today stays in the list for the next trip (TRIP-2) |
  | 2 | `Marca lo de siempre` | The recurrent mark and the result of **Terminar compra** |
  | 3 | `Desliza una fila` | The two slides of a row (ROW-3, ROW-11) and the tap on the name (ROW-7) |
  | 4 | `Desliza la pantalla` | The slide between sections (NAV-3), the bottom bar and the `+` button |
  | 5 | `¿Qué comemos esta semana?` | A recipe and its products, the send to `Compra` (REC-18) and the plan of the week in `Menú` |
  | 6 | `Una receta para empezar` | The switch that adds the sample recipe (ONB-13) |

- **ONB-2** A page has a drawing, a title and a text. A drawing has no text and does not move.
  A line break in the text of a catalog starts a new line. A text between two backticks, such as
  `↻` or `+`, names a control and shows as a key: a border and a monospace font, as inline code.
  A key that starts with `#name` shows the icon `name` of `icons.svg`, then the rest of its text.
  A key with an icon and no text has the label `onboarding.icon.<name>`.
  Above the pages, the art of the app icon shows centred in the band between the top of the
  walkthrough and the drawing, 96 px wide, with no background (`icons/logo.png`, VER-15). It
  is decorative (`alt=""`) and does not change or move with the page. The title keeps the room
  of two lines and the text the room of five lines, the longest title and text of a page in any
  language, so the drawing and the logo are at the same place on each page.
- **ONB-3** The bar at the bottom has **Saltar** at the left and **Siguiente** at the right, each
  half of the bar wide; **Mano** `Izquierda` swaps them (NAV-13). **Saltar** has a thin border. On the last page **Saltar** does not show
  and **Empezar** takes the full bar. One dot for each page shows the place of the page in view;
  a dot is not a button.
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
  The focus goes to the button at the bottom when it opens and at each change of page. The dots
  have the label `Página N de 6`. The title and the text are a live region.
- **ONB-12** With `prefers-reduced-motion: reduce` a page changes with no animation. The
  walkthrough keeps out of the safe-area insets. **Mano** changes only the order of its bar (ONB-3).
- **ONB-13** The last page has the switch **Añadir la receta de ejemplo**, on at each open of the
  walkthrough. It shows only while the state has no sample recipe (REC-27); on another page, or
  with the sample there, its room stays empty, so the page does not move. **Empezar** with the
  switch on adds the sample recipe, with no message. **Saltar**, `Escape` and **Empezar** with the
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
