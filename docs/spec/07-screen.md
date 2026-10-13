# Screen

Rules of `index.html`, `styles.css`, `src/app.js`, `src/swipe.js` and `src/sections.js`.

## Layout

From top to bottom: the header (ring, title, subtitle, search button, arrange button, trip
button), the content of the section, the `+` button above the bottom bar, and the bottom bar. The message shows below the top
edge. A sheet comes up from the bottom, over a veil.

## Sections

- **NAV-1** The bottom bar has four sections, in this order: `Actual`, `Próxima`, `Recetas`,
  `Ajustes`. The app starts in `Actual`.
- **NAV-2** A tap on the bottom bar changes the section. A change closes each open row, ends an
  edit, clears the recipe search and closes the search of a list (LIST-24).
- **NAV-3** A horizontal slide changes the section: to the left for the next one, to the right for
  the previous one. The slide is 60 px long at least and its horizontal part is two times its
  vertical part at least. It stops at `Actual` and at `Ajustes`.
- **NAV-4** The slide starts on the header or on the content, but not on an item row and not on a
  text field. It does nothing while a sheet is open or a row is lifted.
- **NAV-5** The content of the new section comes in from its side of the bottom bar, after a slide
  and after a tap.
- **NAV-6** `Ajustes` has four groups: **Copia de seguridad** (**Exportar copia**, **Importar
  copia**), **Idioma**, **Mano** and **Versión**. Each of the two buttons of the backup has an
  icon before its text: an arrow that goes up out of a tray for the export, an arrow that goes
  down into a tray for the import.
- **NAV-7** An empty section shows a text: `La lista está vacía. Toca + para añadir un artículo.`,
  `No hay nada para la próxima compra. Toca + para añadir lo que compras siempre.` or `No hay
  recetas. Toca + para crear una.`

## Item rows

- **ROW-1** A row of `Actual` has a checkbox, the name with the shops below it, the button
  `+ Próxima` when LIST-14 applies, and the recurrent mark.
- **ROW-2** A row of `Próxima` has the name with the shops, the mark `comprado hoy` when LIST-16
  applies, and the recurrent mark.
- **ROW-3** A slide of a row shows its actions, as icon buttons 64 px wide:

  | Row | Slide to the right | Slide to the left |
  |---|---|---|
  | `Actual` | **Renombrar**, shops | **Mover a Próxima**, **Eliminar** |
  | `Próxima`, `list: 'next'` | **Renombrar**, shops | **Mover a Actual**, **Eliminar** |
  | `Próxima`, `comprado hoy` | **Renombrar**, shops | **Quitar de Próxima** |

- **ROW-4** A drag becomes a slide after 10 px of horizontal move. A drag that is first vertical
  scrolls the list.
- **ROW-5** A side opens when the drag passes 40 % of the width of that side, 40 px at least. An
  open side closes with a drag back of the same length. If not, the row goes back to where it was.
- **ROW-6** One row is open at a time. A tap out of the open row closes it, and that tap still
  does its own work. An action closes the row, then runs.
- **ROW-7** **Renombrar** puts a text field in the row. `Enter` or a loss of focus saves; `Escape`
  cancels. An error leaves the old name and shows its message.
- **ROW-8** The click that follows a drag, a hold or a section slide is ignored for 350 ms, so it
  does not tick an item or press a button.
- **ROW-9** A ticked row closes in 200 ms before it goes to `N comprados`. A row that `Deshacer`
  puts back opens the same way.
- **ROW-10** A long press of a finger on a row does not open the menu of the browser.

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
  | Items | Tick, move to the other list, delete, **Quitar de Próxima**, an existing item brought by the add sheet, a manual move |
  | Trip | **Terminar compra**, `Traer N artículos de Próxima` |
  | Recipes | Send, delete, removal of a product, save and removal of a link |
  | Backup | Import |

- **MSG-6** These changes have no `Deshacer`: a new item, a rename, the recurrent mark,
  `+ Próxima`, the removal of a tick, a new recipe, a new product, the shops, the order and the
  grouping.
- **MSG-7** A rejected operation shows the text of its error and changes nothing.
- **MSG-8** When a save fails, the change stays on the screen and the message is `El cambio no se
  ha guardado: el almacenamiento no está disponible.` (STORE-9).

## Sheets

- **NAV-8** There are three sheets: add, arrange and shops. One is open at a time. A tap on the
  veil or `Escape` closes it. The `+` button does not show while a sheet is open.
- **NAV-9** The trip button of the header has three dots. It shows in `Actual`. A tap
  opens the trip menu below it, and a second tap closes the menu. The menu has one entry,
  **Terminar compra**, with `N vuelven · N se van` below its name.
- **NAV-10** A tap out of the trip menu or `Escape` closes it. That tap still does its own work.

## Hand

- **NAV-11** **Mano** of `Ajustes` has two values: `Derecha` and `Izquierda`. An app with no
  choice uses `Derecha`.
- **NAV-12** The choice is stored in `shopping.hand`. `Derecha` removes the key. It is a
  preference of the device, not a part of the state: `Deshacer` and an import do not change it.
- **NAV-13** With `Izquierda` the controls change side:

  | Part | `Derecha` | `Izquierda` |
  |---|---|---|
  | `+` button | Bottom right | Bottom left |
  | Header | Ring, text, buttons | Buttons, text, ring; the trip menu opens below the left end |
  | Row | Checkbox at the left, other controls at the right | Checkbox at the right, other controls at the left |

- **NAV-14** `Izquierda` does not change the alignment of text, the order of the bottom bar, the
  sheets or the sides of a slide of a row (ROW-3).

## Access and display

- **A11Y-1** Each icon button has an `aria-label` with the action and the name of its object, in
  the language of the screen.
- **A11Y-2** A toggle states its value with `aria-pressed`. A control that opens something states
  it with `aria-expanded`. The section in view has `aria-current="page"`.
- **A11Y-3** The message is a live region (`role="status"`, `aria-live="polite"`).
- **A11Y-4** The side menu that is closed is `inert`.
- **A11Y-5** With `prefers-reduced-motion: reduce`, the rows and the groups change with no
  animation.
- **A11Y-6** With `prefers-color-scheme: dark`, the app shows dark colours.
- **A11Y-7** The header, the bottom bar, the `+` button and the sheets keep out of the safe-area
  insets of the phone. The view resizes when the keyboard opens.
- **A11Y-8** User text goes into the page as `textContent`, never as markup.

## Limits

No move of a row with the keyboard, and no keyboard way to open a side menu of an item row. No
onboarding.
