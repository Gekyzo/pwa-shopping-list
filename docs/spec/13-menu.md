# Menu

Rules of `src/menu.js`. The menu plans recipes and dishes for the meals of a week and fills
`Compra` with the products of its recipes in one action.

## Week

- **MENU-1** The week has 7 days, Monday first (day 0), and 2 meals a day: `lunch`
  (`Comida`) and `dinner` (`Cena`). The week has no date.
- **MENU-2** A meal holds one recipe, one dish or nothing. A dish is a name with no recipe. A
  recipe or a dish can be in more than one meal.
- **MENU-3** A recipe or a dish put in a meal replaces the recipe or the dish that the meal had. A
  recipe that does not exist gives `error.recipeNotFound`; a dish with an empty name gives
  `error.nameRequired`; a day or a meal that does not exist gives `error.unknownMeal`. The name of
  a dish is trimmed.
- **MENU-4** A meal can be emptied. **Vaciar menú** empties all the meals.

## Fill the basket

- **MENU-5** **Llenar cesta** sends each recipe of the menu to `Compra`, one time, in day
  and meal order of its first meal. Each send follows REC-18 and REC-19.
- **MENU-6** A dish and a recipe with no product are skipped. A menu with no meal gives
  `error.menuEmpty`. A menu whose meals give no product gives `error.menuNoProducts`.
- **MENU-7** `añadidos` and `ya estaban` are the sums of the sends (REC-20). A product of two
  recipes counts as added at the first send and as there already at the second.
- **MENU-8** The menu does not change at a fill.

## Dish to recipe

- **MENU-17** A dish turns into a recipe of its name, with no product and no link. Each meal with a
  dish of that name, with no case distinction, then holds the recipe. When a recipe of that name
  exists, the meals take it and no recipe is created. A name that is no dish of the menu gives
  `error.dishNotFound`. `Recetas` lists the dishes (REC-36).

## Screen

- **MENU-9** `Menú` shows one row for each day, with the name of the day in the language of the
  screen, and its two meals side by side. A meal shows `Comida` or `Cena` and the name of its
  recipe or its dish, or `Elegir receta`. A meal with a recipe has a solid `--accent` border and an
  `--accent` label. A meal with a dish has a solid `--muted` border and the label `Comida · sin
  receta`. A meal with neither has a dashed `--muted` border. A day with a recipe or a dish in
  both meals has an `--accent` name.
  Below 600px wide the name stands above the meals; from 600px it stands at the start of the row,
  with the width of the longest name, so the week fits on the screen of a tablet or an unfolded
  phone. In the compact density below 600px the name above the meals is the short weekday of
  the language (`LUN`), and the name of a meal takes up to two lines.
- **MENU-10** The header shows `Menú` and `N comidas planificadas`, or `Sin comidas
  planificadas`. The ring shows the number of planned meals.
- **MENU-11** A tap on a meal opens the meal sheet, `Comida del lunes`. It has one chip for each
  recipe, in the order of the recipes; the chip of the recipe of the meal is on. A tap on a chip
  puts that recipe in the meal and closes the sheet. A meal with a recipe or a dish also has
  **Quitar**, with `Deshacer` and the message `Quitada del menú: «name».`
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
- **MENU-14** `Menú` shows the week also with no recipe, so that a meal can hold a dish. It has no
  empty text. The `+` button does not show in `Menú`.
- **MENU-15** **Terminar compra** does not change the menu.
- **MENU-16** The meal sheet has the field **Busca una receta o escribe un plato** above the
  chips. It filters the chips while the user types, with the match of REC-24. With no match the
  sheet shows `Ninguna receta coincide con «text».` With no recipe and no text it shows `Escribe
  el nombre de un plato.` The text is empty each time the sheet opens. The sheet keeps the height of its first render while
  it is open, so that the sheet does not shrink as the matches fall.

- **MENU-18** When the text of the field is not empty and no recipe has that name, with no case
  distinction, the meal sheet shows **Añadir «text» sin receta** below the chips. A tap on it, or
  `Enter` in the field, puts the text as a dish in the meal (MENU-3) and closes the sheet. With a
  recipe of that name `Enter` does nothing.
- **MENU-19** The meal sheet of a dish has **Crear receta** and **Quitar** side by side, each
  half of the line, with **Crear receta**, a primary button, at the side of the hand (NAV-12). The **Quitar** of a
  meal with a recipe takes the full line. A tap turns the dish
  into a recipe (MENU-17), closes the sheet, shows `Recetas` and opens the sheet of the recipe,
  with `Deshacer` and the message `Receta creada: «name».`

## Limits

No date, no week after this one, no third meal. No quantity.
