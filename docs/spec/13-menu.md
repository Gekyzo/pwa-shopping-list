# Menu

Rules of `src/menu.js`. The menu plans recipes for the meals of a week and fills `Compra` with
their products in one action.

## Week

- **MENU-1** The week has 7 days, Monday first (day 0), and 2 meals a day: `lunch`
  (`Comida`) and `dinner` (`Cena`). The week has no date.
- **MENU-2** A meal holds one recipe or nothing. A recipe can be in more than one meal.
- **MENU-3** A recipe put in a meal replaces the recipe that the meal had. A recipe that does
  not exist gives `error.recipeNotFound`; a day or a meal that does not exist gives
  `error.unknownMeal`.
- **MENU-4** A meal can be emptied. **Vaciar menú** empties all the meals.

## Fill the basket

- **MENU-5** **Llenar cesta** sends each recipe of the menu to `Compra`, one time, in day
  and meal order of its first meal. Each send follows REC-18 and REC-19.
- **MENU-6** A recipe with no product is skipped. A menu with no meal gives
  `error.menuEmpty`. A menu whose recipes have no product gives `error.recipeEmpty`.
- **MENU-7** `añadidos` and `ya estaban` are the sums of the sends (REC-20). A product of two
  recipes counts as added at the first send and as there already at the second.
- **MENU-8** The menu does not change at a fill.

## Screen

- **MENU-9** `Menú` shows one row for each day, with the name of the day in the language of the
  screen, and its two meals side by side. A meal shows `Comida` or `Cena` and the name of its
  recipe, or `Elegir receta`. A meal with a recipe has a solid `--accent` border and an
  `--accent` label; a meal with no recipe has a dashed `--muted` border. A day with a recipe in
  both meals has an `--accent` name.
  Below 600px wide the name stands above the meals; from 600px it stands at the start of the row,
  with the width of the longest name, so the week fits on the screen of a tablet or an unfolded
  phone. In the compact density below 600px the name above the meals is the short weekday of
  the language (`lun`), and the name of a meal takes up to two lines.
- **MENU-10** The header shows `Menú` and `N comidas planificadas`, or `Sin comidas
  planificadas`. The ring shows the number of planned meals.
- **MENU-11** A tap on a meal opens the meal sheet, `Comida del lunes`. It has one chip for each
  recipe, in the order of the recipes; the chip of the recipe of the meal is on. A tap on a chip
  puts that recipe in the meal and closes the sheet. A meal with a recipe also has **Quitar**,
  with `Deshacer` and the message `Quitada del menú: «name».`
- **MENU-12** An action bar stays at the bottom of the list of `Menú`, above the bottom bar.
  Its one button, **Llenar cesta**, fills `Compra` (MENU-5). It has the icon `cart-add`, the
  cart with a plus, before its text, and the full width of the bar. Its message is
  `Menú: N añadidos, N ya estaban.` with `Deshacer`. A fill that changes nothing shows `Menú:
  todo estaba ya en la lista.` and keeps the `Deshacer` that is still on the screen.
- **MENU-13** The button `⋮` of the header shows in `Menú` and opens the sheet `Menú`, with
  **Listo** and one entry, **Vaciar menú**, and the note `Quita todas las comidas de la
  semana. Puedes deshacerlo.` The entry empties the menu, closes the sheet and shows
  `Deshacer` with the message `Menú vaciado.` It is disabled while the menu is empty. The
  label of the button is `Opciones del menú`.
- **MENU-14** With no recipe, `Menú` shows its empty text (NAV-7) and no week. The `+` button
  does not show in `Menú`.
- **MENU-15** **Terminar compra** does not change the menu.
- **MENU-16** The meal sheet has the field **Buscar receta o producto** above the chips. It
  filters the chips while the user types, with the match of REC-24. With no match the sheet
  shows `Ninguna receta coincide con «text».` The text is empty each time the sheet opens.

## Limits

No date, no week after this one, no third meal. No quantity.
