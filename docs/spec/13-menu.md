# Menu

Rules of `src/menu.js`. The menu plans recipes for the meals of a week and fills `Actual` with
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

- **MENU-5** **Llenar la cesta** sends each recipe of the menu to `Actual`, one time, in day
  and meal order of its first meal. Each send follows REC-18 and REC-19.
- **MENU-6** A recipe with no product is skipped. A menu with no meal gives
  `error.menuEmpty`. A menu whose recipes have no product gives `error.recipeEmpty`.
- **MENU-7** `añadidos` and `ya estaban` are the sums of the sends (REC-20). A product of two
  recipes counts as added at the first send and as there already at the second.
- **MENU-8** The menu does not change at a fill.

## Limits

No date, no week after this one, no third meal. No fill to `Próxima`. No quantity.
