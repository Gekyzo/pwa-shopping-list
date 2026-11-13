# Menu

Rules of `src/menu.js`. The menu plans recipes and dishes for the meals of a week and fills
`Compra` with the products of its recipes in one action. Each week starts empty; the meals of
past weeks stay, read only, and the next weeks can be planned ahead.

## Week

- **MENU-1** The week has 7 days, Monday first (day 0), and 2 meals a day: `lunch`
  (`Comida`) and `dinner` (`Cena`). A week is the date of its Monday, `YYYY-MM-DD` in local
  time, and each meal holds its week. This week is the week of today: on Monday a new week starts
  with no meal, with no tap and with no write of the state. Each operation of the menu acts on
  one week, on the screen the week in view (MENU-23); a week that is not a Monday gives
  `error.unknownMeal`.
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
  recipe or its dish, or `Elegir receta`. The name of the day is a head in sentence case, in the
  colour of the text, at 18px (`--text-group`), after a 4px emerald bar (`--day-bar`). A meal
  with a recipe is a `--surface` tile with a `--line` border and a `--muted` label. A meal with a
  dish is a tile on `--surface-2` with a `--line` border and the label `Comida · sin receta`. A
  meal with neither has a dashed `--control` border on the ground and a `--muted` `Elegir
  receta`, centred. A full day looks the same as the other days. From 1024px the day and its meals
  follow the desktop screen (DSV-30).
  Below 600px wide the name stands above the meals; from 600px it stands at the start of the row,
  with the width of the longest name, so the week fits on the screen of a tablet or an unfolded
  phone. In the compact density below 600px the name above the meals is the short weekday of
  the language, also in sentence case (`Lun`), and the name of a meal takes up to two lines.
- **MENU-10** The header shows `Menú` and `N comidas planificadas`, or `Sin comidas
  planificadas`, for the week in view (MENU-23).
- **MENU-11** A tap on a meal opens the meal sheet, `Comida del lunes`. It has one chip for each
  recipe, in the order of the recipes; the chip of the recipe of the meal is on. A tap on a chip
  puts that recipe in the meal and closes the sheet. A meal with a recipe or a dish also has
  **Quitar**, with `Deshacer` and the message `Quitada del menú: «name».`
- **MENU-12** An action bar stays at the bottom of the list of `Menú`, above the bottom bar.
  For this week and a later week it has two buttons of equal width: **Llenar cesta** on the side of the hand and **Vaciar
  menú** beside it. **Llenar cesta** fills `Compra` from the week in view (MENU-5). It has the icon `cart-add`, the
  cart with a plus, before its text. Its message is `Menú: N añadidos, N ya estaban.` with
  `Deshacer`. A fill that changes nothing shows `Menú: todo estaba ya en la lista.` and keeps
  the `Deshacer` that is still on the screen.
- **MENU-13** **Vaciar menú** is an outline button in the danger color. It empties the week in view and
  shows `Deshacer` with the message `Menú vaciado.` It is disabled while the own menu of that week is empty. The
  header of `Menú` has no `⋮` button.
- **MENU-14** `Menú` shows the week also with no recipe, so that a meal can hold a dish. It has no
  empty text. The `+` button does not show in `Menú`, and below 600px `Menú` shows no dock.
- **MENU-15** **Terminar compra** does not change the menu.
- **MENU-16** The meal sheet has the field **Busca una receta o escribe un plato** above the
  chips. It filters the chips while the user types, with the match of REC-24. With no match the
  sheet shows `Ninguna receta coincide con «text».` With no recipe and no text it shows `Escribe
  el nombre de un plato.` The field takes 80 characters at most. The text is empty each time the sheet opens. The sheet keeps the height of its first render while
  it is open, so that the sheet does not shrink as the matches fall.

- **MENU-18** When the text of the field is not empty and no recipe has that name, with no case
  distinction, the meal sheet shows **Añadir «text» sin receta** below the chips. A tap on it, or
  `Enter` in the field, puts the text as a dish in the meal (MENU-3) and closes the sheet. With a
  recipe of that name `Enter` does nothing.
- **MENU-19** The meal sheet of a dish has **Crear receta** and **Quitar** side by side, each
  half of the line, with **Crear receta**, a primary button, at the side of the hand (NAV-12). The **Quitar** of a
  meal with a recipe takes the full line. A tap turns the dish
  into a recipe (MENU-17), closes the sheet, shows `Recetas` and opens the sheet of the recipe,
  with `Deshacer` and the message `Receta creada: «name».` The message is the same when the meals
  take a recipe that exists.

## Shared menu

- **MENU-21** From 600px wide, `Menú` with a planned meal in the week in view, this week or a later
  one, shows the card **Generación automática de cesta** (`panels.fill`), with the icon `sparkles`
  and an emerald title on `--surface-2`. Its text says what **Llenar cesta** adds to `Compra`: the
  products of the recipes of the week that are not to buy yet (`basketPreview`) and the recipes of
  the week with a product (`filledRecipes`), as `Al pulsar «Llenar cesta», la app añade a «Compra»
  los 13 productos que faltan de las 6 recetas planificadas.`, the two names in bold. With no such
  recipe it says `panels.fillNone`; with each product already to buy, `panels.fillDone`. From 1024px
  its foot is **Almacenamiento local** (LIST-43), after a `--line`. It does not say "IndexedDB" or
  "agrupados por pasillo": the app stores in `localStorage`, and a new item of the fill has no
  aisle. It stands as the panels of `Compra` do (LIST-38), after **Semanas anteriores**
  (MENU-27).
- **MENU-20** For a member with scope `all` (SHARE-12), `Menú` shows the meals of both lists.
  Each list has its own week, so a slot holds one meal of each list at most: a slot with two
  shows both, the own one first, each name with the tag of its list (SHARE-14). The chips of the
  meal sheet show the tag of their recipe. A recipe put in a meal goes to the list of the recipe
  and replaces only the meal of that list (MENU-3); a dish goes to the own list. The meal sheet of
  a slot with two meals lists both above the field, each with its tag and a `✕` that empties only
  that meal (MENU-4); the **Quitar** of the foot does not show then, and with no dish the foot
  does not show at all. **Crear receta** turns the
  dish into a recipe of the list of the dish (MENU-17). **Llenar cesta** fills each list from its
  own menu: the own recipes go to the own list, the shared recipes to the shared list (MENU-5).
  A list with no meal, or with no product, is skipped; `error.menuEmpty` shows only when both
  menus are empty, `error.menuNoProducts` when no menu gives a product, and the counts of the
  message are the sums of both fills (MENU-7). **Vaciar menú** acts on the own menu only, and is
  disabled while the own menu is empty. With scope
  `list`, for the owner and with no share, `Menú` shows the own meals with no tag.

## Past weeks

- **MENU-22** A put of a meal (MENU-3) drops the meals of the weeks before the last 26, its own
  week included in the 26. Nothing else drops a past week.
- **MENU-23** A week bar stands above the days of `Menú`: `‹`, the week in view, `›`. The week in
  view is `Esta semana`, `Semana que viene` (`menu.comingWeek`) for the week after it, or `Semana
  del 26 oct` for another week, with the short date of the language. On a past week, `‹` shows
  the nearest earlier week that holds a meal of a list in view, and is disabled when there is none;
  `›` shows the nearest later past week that holds a meal, or this week. From this week on, `›`
  shows the week after, up to 4 weeks after this week (`FUTURE_WEEKS`), where it is disabled; `‹`
  on a later week shows the week before it, and on this week the nearest past week that holds a
  meal (`weekSteps` of `src/menu.js`). A later week works as this week: its meals take a recipe or
  a dish, and its action bar, its panel and its header act on it. A past week shows its days as this week does (MENU-9), with each meal a
  tile of no action whose name is `--muted`; an empty meal shows `—`. Its action bar holds
  **Repetir esta semana** alone (MENU-24) in place of **Llenar cesta** and **Vaciar menú**; it has no
  card **Generación automática de cesta** (MENU-21), and the header counts its meals (MENU-10). The week in view is not
  stored: the app starts on this week, and a past week that holds no meal any more, or a later week
  out of reach after a change of the clock, shows this week.

- **MENU-24** **Repetir esta semana** is a primary button with the icon `repeat` across the action
  bar of a past week. It puts the meals of that week in place of all the meals of this week, each in
  its day and meal, with its recipe or its dish, then shows this week, with `Deshacer` and the
  message `Semana repetida: N comidas.` For a member with scope `all` each list copies its own past
  week into its own week (MENU-20); a list with no meal in that week keeps its week as it is. A put
  of a meal drops the old weeks as MENU-22 says.
- **MENU-25** The dates of the week in view, as the Stitch screens show them. The week bar has the
  days of the week after its name, in the short form of the language (`Esta semana 2–8 nov`,
  `Intl.DateTimeFormat#formatRange`). The head of each day ends with its date in small capitals
  (`2 NOV`); from 600px the date stands below the name. A free meal has the icon `plus-circle`
  above `Elegir receta`. A slot with one meal ends with a status line after a dot: **Receta lista**
  (`menu.statusRecipe`) for a recipe, **Anotación rápida** (`menu.statusDish`) for a dish; a slot
  with two meals (MENU-20) has none, and Compacta (NAV-20) hides it. The status line is hidden from
  a screen reader, as the label of the tile already says it.
- **MENU-26** Above **Llenar cesta** and **Vaciar menú**, a line counts the slots of the week in
  view that hold a meal, of the 14, and the free ones, in small capitals (`menu.summary`:
  `9 de 14 comidas planificadas · 5 libres`). A slot with a meal of each list (MENU-20) counts
  once (`plannedSlots` of `src/menu.js`). The week bar starts with the icon `calendar`; a planned
  meal shows its kind at its top end (cutlery for a recipe, a pencil for a dish); a free meal
  shows `Elegir receta` first and the name of the meal below it; **Vaciar menú** has the icon
  `trash` (DSV-20).
- **MENU-27** From 600px wide, `Menú` shows the panel **Semanas anteriores** (`panels.weeks`) on any
  week while a past week other than the week in view holds a meal, also on an empty week. Its head
  has the icon `history` in a 32px `--surface-2` tile, the title and `Menús guardados de otras
  semanas`. It lists the 3 latest such weeks, newest first (`pastWeeks` of `src/menu.js`), each a
  tile with its days (`19–25 oct`, MENU-25), the planned slots as a pill (`8 comidas`; `14 comidas
  completas` on `--primary-soft` when the 14 are planned, MENU-26), the first 3 names of its meals in
  menu order, each name one time, as bordered pills, then `+N más` for the other names, and the
  outlined button **Repetir esta semana** with the icon `repeat`, labelled `Repetir la semana
  19–25 oct`. The button puts the meals of that week in place of all the meals of the week in view,
  or of this week when the week in view is past, as MENU-24 says, then shows that week.

## Limits

No week more than 4 weeks after this one, no edit of a past week, no third meal. No quantity.
**Repetir esta semana** of a past week copies into this week only (MENU-24); only the panel of
MENU-27 copies into a later week. `Recetas` lists the dishes of this week only
(REC-36).
