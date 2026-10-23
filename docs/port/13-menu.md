# Menu

The week menu: recipes and dishes in the meals of a week, the fill of `Compra` from the menu, the
section `Menú` and the meal sheet. Source: `src/menu.js`, `src/ui/menu.js`, and the menu parts of
`src/ui/list.js` and `src/ui/recipes.js`.

## Week

**MENU-1** [core] [verified] The week has 7 days, Monday first (day 0), and 2 meals a day, in this order: `lunch` (`Comida`, `meal.lunch`) and `dinner` (`Cena`, `meal.dinner`). The week has no date.
- Evidence: `src/menu.js:5-6`; test: `tests/menu.test.js` "the week has 7 days and 2 meals".

**MENU-2** [core] [verified] `menu` is a list of entries `{ day, meal, recipe }` or `{ day, meal, dish }`, at most one per meal, kept in day and meal order. A meal holds one recipe (by id), one dish or nothing (no entry). A dish is a name with no recipe. A recipe or a dish can be in more than one meal.
- Evidence: `src/menu.js:13`, `src/menu.js:21-23`; test: `tests/menu.test.js` "setMeal keeps the entries in day and meal order", "a dish counts as a planned meal and shows in menuWeek".

**MENU-3** [core] [verified] A recipe or a dish put in a meal replaces the recipe or the dish that the meal had. A day that is not an integer from 0 to 6, or a meal that is not `lunch` or `dinner`, gives `error.unknownMeal` (checked first). A recipe id that does not exist gives `error.recipeNotFound`. The name of a dish is trimmed; an empty name gives `error.nameRequired`. An error leaves the state as it was.
- Evidence: `src/menu.js:11`, `src/menu.js:26-38`; test: `tests/menu.test.js` "setMeal puts a recipe in a meal", "setMeal replaces the recipe of a meal", "setMeal rejects a recipe that does not exist", "setMeal rejects a day or a meal that does not exist", "setDish puts a dish by name in a meal, in place of its recipe", "setMeal replaces the dish of a meal", "setDish rejects an empty name and a meal that does not exist".

**MENU-4** [core] [verified] A meal can be emptied. **Vaciar menú** empties all the meals. An empty of an empty meal or of an empty menu returns the same state object. The count of planned meals is the number of entries, recipes and dishes alike.
- Evidence: `src/menu.js:66-73`; test: `tests/menu.test.js` "clearMeal empties a meal", "clearMeal of an empty meal returns the same state", "clearMenu empties the menu", "clearMenu of an empty menu returns the same state", "mealCount counts the planned meals".

**MENU-20** [core] [new] `menuWeek` gives the 7 days, each with its two meals and, per meal, the recipe object (or null) and the dish name (or null). An entry whose recipe id is not in `recipes` gives a meal with no recipe, but the entry still counts in MENU-4.
- Evidence: `src/menu.js:76-83`; test: `tests/menu.test.js` "menuWeek gives each day with its two meals and their recipes" (the stale id case is untested).

## Fill the basket

**MENU-5** [core] [verified] **Llenar cesta** sends each recipe of the menu to `Compra`, one time, in the day and meal order of its first meal. Each send follows REC-18 and REC-19, on the state of the send before it.
- Evidence: `src/menu.js:88-104`; test: `tests/menu.test.js` "fillMenu sends each recipe of the menu to Active, one time, in menu order", "fillMenu brings a saved item and counts an item to buy as already there".

**MENU-6** [core] [verified] A dish, a recipe with no product and an entry with an unknown recipe id are skipped. A menu with no entry gives `error.menuEmpty`. A menu whose entries give no recipe with a product gives `error.menuNoProducts`. An error leaves the state as it was.
- Evidence: `src/menu.js:89-92`; test: `tests/menu.test.js` "fillMenu skips a recipe with no product", "fillMenu rejects an empty menu", "fillMenu rejects a menu whose recipes have no product", "fillMenu skips a dish", "fillMenu rejects a menu of dishes only".

**MENU-7** [core] [verified] `added` and `already` are the sums of the sends (REC-20). A product of two recipes counts as added at the first send and as there already at the second. A fill that changes nothing returns the same state object.
- Evidence: `src/menu.js:93-103`; test: `tests/menu.test.js` "fillMenu sends each recipe of the menu to Active, one time, in menu order", "a second fillMenu changes nothing and returns the same state".

**MENU-8** [core] [untested] The menu does not change at a fill.
- Evidence: `src/menu.js:88-104`; test: untested (`tests/menu.test.js` "fillMenu sends each recipe of the menu to Active, one time, in menu order" checks that the input state stays deep-equal, not the `menu` of the result).

## Dish to recipe

**MENU-17** [core] [verified] A dish turns into a recipe of its name (the spelling of its first meal), with no product and no link, at the end of `recipes`. Each meal with a dish of that name, with no case distinction after a trim, then holds the recipe. When a recipe of that name exists (no case distinction), the meals take it and no recipe is created. A name that is no dish of the menu gives `error.dishNotFound`. `Recetas` lists the dishes (REC-36).
- Evidence: `src/menu.js:42-51`; test: `tests/menu.test.js` "dishRecipe creates the recipe and puts it in each meal of that dish", "dishRecipe takes the recipe of the same name when it exists", "dishRecipe turns a dish into a recipe by its name", "dishRecipe rejects a name that is no dish of the menu".

**MENU-21** [adapted] [new] A dish to recipe always shows `Receta creada: «name».` with `Deshacer`, also when the meals took a recipe that existed and no recipe was created.
- Evidence: `src/ui/recipes.js:129-134`; test: untested. See Q-domain-9.
- Target: snackbar with an undo action.

## Screen

**MENU-9** [adapted] [untested] `Menú` shows one row for each day, with the name of the day in the language of the screen, and its two meals side by side in two equal columns. A meal shows `Comida` or `Cena` and the name of its recipe or its dish, on one line with an ellipsis, or `Elegir receta` (`menu.choose`). The name of the day is a head in sentence case (first letter in upper case), in the colour of the text, at `--text-label` size and medium weight. A meal with a recipe is a `--surface` tile with a 1 px `--line` border and a `--muted` label. A meal with a dish has a `--muted` border and the label `Comida · sin receta` (`menu.noRecipe`). A meal with neither has a dashed `--control` border, no fill, and a `--muted` `Elegir receta`. Below 600px wide the name stands above the meals; from 600px it stands at the start of the row, with the width of the longest name. In the compact density below 600px the name is the short weekday (`Lun`), and the name of a meal takes up to two lines. The text for a screen reader of a meal is `<Meal> del <day>: <name>`, and for a dish `<name>, sin receta`.
- Evidence: `src/ui/menu.js:9-17`, `src/ui/menu.js:35-53`, `styles.css:459-612`; test: untested.
- Target: day names from `DayOfWeek.getDisplayName(TextStyle.FULL / SHORT, locale)`; see Q-domain-8. Layout: Compose `Row` / grid by width class; tokens from the design system theme.

**MENU-10** [adapted] [untested] The header shows `Menú` and `N comidas planificadas` / `1 comida planificada` (`header.menuMeals`), or `Sin comidas planificadas` (`header.noMeals`), with no progress bar.
- Evidence: `src/ui/list.js:109-113`; test: untested.
- Target: top bar composable.

**MENU-11** [adapted] [untested] A tap on a meal opens the meal sheet, titled `<Meal> del <day>` (`menu.title`, for example `Comida del lunes`). It has one chip for each recipe that matches the field (MENU-16), in the order of the recipes; the chip of the recipe of the meal is pressed. A tap on a chip puts that recipe in the meal and closes the sheet, with no message. A meal with a recipe or a dish also has **Quitar** (`menu.remove`), which empties the meal and closes the sheet, with `Deshacer` and the message `Quitada del menú: «name».` (`toast.mealCleared`).
- Evidence: `src/ui/menu.js:19-22`, `src/ui/menu.js:71-113`, `src/ui/menu.js:151-157`; test: `tests/markup.test.js` "the meal sheet has a recipe search between the title and the chips, a no-match text and the dish buttons".
- Target: `ModalBottomSheet` with `FlowRow` of `FilterChip`.

**MENU-12** [adapted] [verified] An action bar stays at the bottom of the list of `Menú`, above the bottom bar. It has two buttons of equal width: **Llenar cesta** (`menu.fill`), primary, on the side of the hand, and **Vaciar menú** beside it. **Llenar cesta** fills `Compra` (MENU-5). It has the icon `cart-add` before its text. Its message is `Menú: <parts>.` (`toast.menuFilled`, parts as REC-20) with `Deshacer`. An error shows its message. A fill that changes nothing shows `Menú: todo estaba ya en la lista.` (`toast.menuNothing`) and keeps the `Deshacer` that is on the screen.
- Evidence: `index.html:61-65`, `src/ui/menu.js:55-62`; test: `tests/markup.test.js` "Llenar cesta and Vaciar menú stand together in the action bar of Menú", "the es text of menu.fill is Llenar cesta".
- Target: bottom `Row` with two `weight(1f)` buttons; snackbar.

**MENU-13** [adapted] [untested] **Vaciar menú** (`menu.clear`) is an outline button in the danger colour. It empties the menu and shows `Deshacer` with the message `Menú vaciado.` (`toast.menuCleared`). It is disabled while the menu is empty. The header of `Menú` has no trip button.
- Evidence: `src/ui/menu.js:64-66`, `src/ui/menu.js:138`, `src/ui/list.js:233`; test: untested.
- Target: `OutlinedButton` with error colours.

**MENU-14** [adapted] [verified] `Menú` shows the week also with no recipe, so that a meal can hold a dish. It has no empty text. The `+` button does not show in `Menú`, and below 600px `Menú` shows no dock.
- Evidence: `src/ui/list.js:186`, `src/app.js:115`, `src/sections.js:60-61`, `src/sections.js:75`; test: `tests/sections.test.js` "emptyAction of Menu has no empty text", "dockShown hides the dock in Menú and in Ajustes".
- Target: no FAB on the menu destination.

**MENU-15** [core] [untested] **Terminar compra** does not change the menu.
- Evidence: `src/store.js:97` (only `items` and `sent` change); test: untested in this area.

**MENU-16** [adapted] [untested] The meal sheet has the field **Busca una receta o escribe un plato** (`menu.search`, 80 characters at most) above the chips. It filters the chips while the user types, with the match of REC-24. With no recipe and no text the sheet shows `Escribe el nombre de un plato.` (`menu.typeDish`). Else, with no match, it shows `Ninguna receta coincide con «text».` (`empty.noMatch`). The text is empty each time the sheet opens. The sheet keeps the height of its first render as its minimum height while it is open, so that it does not shrink as the matches fall.
- Evidence: `index.html:261`, `src/ui/menu.js:19-22`, `src/ui/menu.js:84-89`, `src/ui/menu.js:110-112`; test: `tests/markup.test.js` "the meal sheet has a recipe search between the title and the chips, a no-match text and the dish buttons".
- Target: measure the first height with `onGloballyPositioned`, then `heightIn(min = …)`.

**MENU-18** [adapted] [untested] When the trimmed text of the field is not empty and no recipe has that name, with no case distinction, the meal sheet shows **Añadir «text» sin receta** (`menu.addDish`) below the chips. A tap on it, or `Enter` in the field, puts the text as a dish in the meal (MENU-3), closes the sheet, and shows no message. With a recipe of that name, or an empty text, `Enter` does nothing. `Enter` during an IME composition does nothing.
- Evidence: `src/ui/menu.js:91-93`, `src/ui/menu.js:116-127`, `src/ui/menu.js:144-149`; test: untested.
- Target: `KeyboardActions(onDone = …)`.

**MENU-19** [adapted] [untested] The meal sheet of a dish has **Crear receta** (`menu.toRecipe`) and **Quitar** side by side, each half of the line, with **Crear receta**, a primary button, at the side of the hand (NAV-12). The **Quitar** of a meal with a recipe takes the full line. A tap on **Crear receta** turns the dish into a recipe (MENU-17), closes the sheet, shows `Recetas` and opens the sheet of the recipe, with `Deshacer` and the message `Receta creada: «name».`
- Evidence: `index.html:265-268`, `src/ui/menu.js:108-110`, `src/ui/menu.js:130-134`, `src/ui/recipes.js:129-134`, `styles.css:593-595`; test: `tests/markup.test.js` "the meal sheet has a recipe search between the title and the chips, a no-match text and the dish buttons".
- Target: two buttons in a `Row`; the order follows the hand setting.

## Limits

No date, no week after this one, no third meal. No quantity.
