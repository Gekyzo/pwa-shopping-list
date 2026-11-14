# Design system

The base tokens, base rules, components, layouts and icon rules are in `design-system/`. They
started as a copy of `pwa-design-system` 0.9.0 (commit `ecb3edf`); since 2026-11-07 the app owns
them, and no other repository is needed. The rules DS-1 to DS-8 and LAY-1 to LAY-5 keep their
names from that design system: `design-system/rules.js` holds DS-1 to DS-8, and the comments of
`design-system/design-system.css` document LAY-1 to LAY-5. `tests/design.test.js` runs each rule of `design-system/rules.js` over the
files of the app and skips no rule (DSV-8). `designs/index.html` shows each part, shared and
own.

This document holds the rules of the app only.

## The base sheet

- **DSV-1** `design-system/` holds `design-system.css`, `catalog.js`, `rules.js`, `sheet.js` and
  the font `geist.woff2`, and no other file (`tests/design-files.test.js`).
- **DSV-2** `index.html` and `designs/index.html` link `design-system/design-system.css`
  before `styles.css`, and `SHELL` of `sw.js` has both (SW-2). A layer of the two sheets is one
  layer: a rule of `styles.css` comes after the shared rules of its layer.
- **DSV-3** `styles.css` starts with the same layer statement and holds the parts of the app only:
  its tokens, the `body` rule and the font of the controls, the screen parts, and its versions of
  shared components. A version of a shared component starts with the block `/* @extends <name> */`,
  in the same layer, so that it wins; the block documents the parts, variants and states that the
  app adds. A version holds only the rules that differ from the shared ones, so that a change of
  the shared sheet reaches the app. No other rule of `components` or `layouts` repeats a selector of the shared sheet. The
  app has its own versions of `app-header`, `sheet`, `dock`, `field`, `switch`, `cluster`,
  `input`, `item-row`, `group-head`, `section-head`, `empty-state`, `list-group`, `toast` and
  `nav-bar` (colour only, DSV-13).
- **DSV-4** A change of a base part is made in `design-system/` directly, with its test in
  `tests/design.test.js` or `tests/design-files.test.js`. `styles.css` keeps the parts of the app
  and its versions of base parts (DSV-3); a change of the layout of the rail goes to
  `design-system/design-system.css` (DSV-8).

## Exceptions

- **DSV-5** Retired: design system 0.5.0 puts the rail at the side of the hand (LAY-2), so the app
  has no layout of `nav-bar`, `toast` and `fab` of its own. The layout is in DSV-8.
- **DSV-6** From 840px a sheet with a head is the card of LAY-5, `--panel-width` wide, so it takes
  the column of the panels of `Compra` (LIST-38). The content of a view with no panels makes room
  for that column while the sheet is open, so the sheet covers no row. The recipe sheet is a pane
  instead (REC-39). The walkthrough content also keeps the width of the column. A side sheet
  hides its grab and does not close by a drag (NAV-23).
- **DSV-7** A window of at most 480px height (a phone on its side) gives more height to the
  content. The header has less padding, and the walkthrough has no logo.

## Layout

- **DSV-8** The app follows LAY-1 to LAY-5 with no exception, and `tests/design.test.js` skips no
  rule. Below 600px the bar is at the bottom, and the dock of `Compra` stands above it (SHOP-26).
  From 600px the bar is the rail at the left with either hand, and from 1024px a sidebar in a
  centred frame (LAY-2, NAV-26); `styles.css` has no layout of `nav-bar`: its version (DSV-13) sets colour and weight only. `body` pads
  `--rail-width` at the start and `--frame-side` at the end (LAY-4). The header and `main` share the
  side padding of LAY-1. From 840px the recipes of `Recetas` stand in two columns; the app has no
  list and detail section, so it has no `pane` layout.

- **DSV-9** The app has the four width classes of LAY-1. Its own columns: from 600px the panels of
  `Compra` and `Menú` (`side-panels`) stand below the content, and from 840px beside it,
  `--gutter` apart, with `--page-max` at `100%` so the content fills the area as a pane does
  (LIST-38, MENU-21, MENU-27). From 840px the recipe sheet is a pane (`side-pane`, REC-39), and
  `Ajustes` sets `--page-max` to `--settings-max` (NAV-27). From 1024px every screen but
  `Ajustes` fills the area (DSV-28); `Ajustes` is a centred 720px column (DSV-29). The code reads the class from
  `ui.device` (NAV-28), which `src/ui/device.js` keeps with one media query for each breakpoint; no
  other module of `src/` has a width query. A media query of the CSS uses only `min-width` at 600px,
  840px or 1024px, and no rule selects on `data-device` (`tests/breakpoints.test.js`).

## The look of the app

- **DSV-10** The app follows `DESIGN.md` (the Utilitarian Market Ledger of the Stitch project
  `Shopping`) in this app only: `styles.css` sets its tokens in the `tokens` layer over those of the
  design system, and the shared sheet does not change. The font is Hanken Grotesk, from the files
  `fonts/hanken-grotesk-latin.woff2` and `fonts/hanken-grotesk-latin-ext.woff2` of the app (SIL OFL,
  `fonts/OFL.txt`), both in `SHELL` of `sw.js` (SW-2), so it shows offline. No font comes from the
  network.
- **DSV-11** The palette is the one of the Stitch screens of Bodega: warm parchment, green-grey
  lines, one emerald and one terracotta. Light: canvas `#fff8f5` (`--bg`), rows and sheets
  `#ffffff` (`--surface`), tonal fill `#fcf2eb` (`--surface-2`), chip fill `#f6ece6`
  (`--secondary`), ink `#1f1b17`, muted ink `#3f4942`, struck ink `#6f7a71` (`--struck`), borders
  `#bec9c0` (`--line`) and `#6f7a71` (`--control`). The screens show no dark theme, so dark is
  derived from the same roles: canvas `#1f1b17`, rows `#2a2521`, tonal fill `#342f2b`, ink
  `#f9efe8`, muted ink `#bec9c0`. Emerald `#13734b` (dark `#82d8a8`) is `--done` and `--primary`:
  the main action, progress and the checked state. Error red `#ba1a1a` (dark `#ffb4ab`) is
  `--danger`: a destructive action and a failure. Terracotta `#a23e18` (dark `#ffb59c`) is
  `--warning`: an alert and the mark of a recurrent item. Controls, buttons and cards have 6px
  corners; depth comes from borders, and only a sheet or a lifted row has a shadow. The body text
  is 16px with tabular figures. `tests/look.test.js` checks the values.
- **DSV-12** The components of `DESIGN.md`, as versions of the app (DSV-3). The name of a row is
  18px at weight 500 (`--text-row`, `--weight-row`), and its quantity keeps one line. The check of
  a row is a round tick of 32px (`--tick`; 24px below 600px, DSV-33) with a `--struck` border, filled with `--done` when
  checked, with a short scale snap. A bought row stands on `--surface-2`, with its name in
  `--struck` and struck through. An input has a 1.5px `--control` border and a 2px `--done` border
  on focus. The head of a group is 18px (`--text-group`), with its count as muted second text
  (`group-head-end`).
- **DSV-13** The screens of the Stitch project `Shopping`, with no change of behaviour. The rows of
  a list group stand in a card from 600px: an inset `--line` border with 6px corners
  (`--row-edge`, `--row-corner`). Below 600px the rows of `Compra` run from edge to
  edge, with no border and no corners (DSV-33), and the cards of `Recetas` stand 16px from the
  edge. The card is below a head on the canvas with its count as a pill (`group-head-count`). The groups
  of `Ajustes` are `list-group card`, under a head in small capitals. The quantity of a row is a
  tonal chip, and the mark of a recurrent item (`item-row-repeat`) is `--warning`. The header is
  `--surface` with its tools as bordered tiles. The bar is `--surface`, and its current section is
  emerald with no pill, on `--secondary` with an emerald bar from 1024px (DSV-22). The name of a day of `Menú` is 18px after an
  emerald bar.
- **DSV-14** The detail of the Stitch screens, with no change of behaviour. The name of a recipe card is 18px at weight 600; its link button is
  a bordered tile and its send button an emerald tile, both 40px inside the 48px target (`--tap`).
  From 840px a card fills the height of its grid row. The week of `Menú` is a bordered bar on
  `--surface`. A meal is a tile of at least 88px (`--meal-min`, none in Compacta): a 13px label,
  then the name at 18px; a free meal centres its call, and a dish stands on `--surface-2`. An
  outline danger button is drawn in `--danger` on `--surface`. The chevron of a settings row is a
  drawn 24px mark. The bar shows crossed cutlery (`utensils`) for `Recetas` and an open book
  (`menu`) for `Menú`, as in the screens. Each row of `Ajustes` starts with an icon
  (`settings-row-icon`) in `--muted`, or in `--danger` on a danger row.

## The screens of Bodega

The Stitch export `stitch_bodega_shopping_list` (2026-11-07), with no change of behaviour. Where
its screens disagree, `docs/bodega-inconsistencies.html` records the choice: the phone screen sets
each part.

- **DSV-15** The name of a row of `Compra` keeps one line, then ends with an ellipsis; its
  quantity is 15px with tabular figures: from 600px a tonal chip on `--secondary` with no edge and
  4px corners, below 600px plain `--muted` text (DSV-33). Below 1024px a bought quantity keeps the tonal chip and fades with its row
  (DSV-33); from 1024px it is drawn: a `--line` edge on `--surface`, in `--struck`.
- **DSV-16** `Comprados (N)` (LIST-12) is a card of its own: its head (`bought-head`) is the top
  of a box with a 1px `--line` border, 6px corners and a `--surface-2` ground, with a check in
  `--done` before the title at 18px and the chevron at its end; the bought rows close the box. A
  bought tick is filled. Below 1024px the content of a bought row is at 65% opacity, the tick
  with it, and only the name is struck (DSV-33); from 1024px the tick is at 70% opacity, and the
  name and its meta line are struck.
- **DSV-17** The dock floats over the list: no bar and no top line behind it. Each of its controls
  is a level 2 tile on `--surface`, with a `--border-control` `--control` border and `--shadow-l`;
  the add button keeps its emerald fill and takes the same shadow. The tools of the header are
  tiles on `--secondary`. The toast is the inverse surface (`--toast-bg` `#342f2b`, text
  `#f9efe8`; dark `#eae1da` and `#1f1b17`), its action in `--inverse-primary` (`#82d8a8`, dark
  `#13734b`). A toast with `Deshacer` reports a change that took place, so it starts with the
  check `check-circle` in `--inverse-primary` (the state `done`). A toast with no `Deshacer` has
  no icon, because it also shows errors. Below 600px the toast stands at the top (DSV-33).
- **DSV-18** The sheet `Editar` (ROW-7). A field is `field boxed`: an outlined box, 1px
  `--control` and 6px corners, with its name inside above the value in small capitals; the focus
  draws a 2px `--done` edge. The switch of the recurrence is a tonal card (`toggle-card`): the
  icon `repeat` in `--done`, the name with a muted hint below, the switch at the end. An idle
  switch is a light track (`--secondary`) with a `--line` edge. The shop chips are `cluster
  assign`: a shop of the item is a pill on `--secondary` with a cross, another shop a dashed pill
  in `--done` with a plus; a tap toggles it as before (SHOP-9). The aisle chips are `cluster
  pick`: the aisle of the item is tinted `--done-soft` with a `--done` edge. `Eliminar` is a text
  button in `--danger`. The quick quantities, the counter of characters and the select of the
  section of the Stitch screen are not taken: the app has no such behaviour.
- **DSV-19** A recipe card of `Recetas` (REC-40). Its actions stand at its top end, beside the
  name: the link tile, if the recipe has a link, then the send tile. The name, its count and its
  badge keep clear of them; the products take the full width of the card below. With the left
  hand the actions stand at the top start. The actions keep their place in the tab order, after the products,
  so the focus goes back up from the products to them. The count of `Recetas` in the header is a pill on
  `--done-soft` in `--done`.
- **DSV-20** `Menú` (MENU-26). The count in the header is a neutral pill: `--secondary` with a
  `--line` edge, in `--muted`. The week bar starts with a muted `calendar`. A planned meal shows
  its kind at its top end, out of the flow: `utensils` in `--done` for a recipe, `edit` in
  `--muted` for a dish; Compacta keeps the tile with no least height. A free meal shows the
  `plus-circle`, `Elegir receta`, then the name of the meal in `--struck`. The summary of the week
  (`menu-summary`) is a muted line in small capitals above the actions. **Vaciar menú** has the
  icon `trash`.
- **DSV-21** `Ajustes` (NAV-6). The head of each group ends with its icon in `--muted`
  (`list-group-icon`): `users`, `export`, `filter`, `cart`, `users`, `aisle`, `download`, `info`.
  **Borrar todos los datos** ends with the tag `settings.irreversible` in small capitals in
  `--danger` (`settings-row-tag`). The count of the aisles is a pill on `--secondary`
  (`settings-row-count`). **Instalar la aplicación** has the hint `settings.installHint` below
  its name (`settings-row-hint`). A hint or a tag is the description of its control
  (`aria-describedby`), not part of its name. The update banner is a tonal card on `--secondary` with a
  `--line` edge. From 1024px each row icon stands in a 32px `--surface-2` tile (`--icon-tile`), and the
  head shows its icon first (DSV-29).
  The trip-end choice stays two segments: the switch of the screen would be a change of control.
- **DSV-22** From 1024px, as in the desktop screens. The current section of the rail is a band on
  `--surface-high` (surface-container-highest) with a 4px emerald bar at its start
  (`--shadow-current`, a shadow, so the rail keeps its layout, DSV-8), and its count an 11px
  emerald pill. A section row is 40px high with 2px corners, its name 14px. The
  head of a group of `Compra` is the tinted top of its card (`--surface-2`, a `--line` edge, 6px
  top corners); the meta line of a row is a small outlined pill; the quantity chip is outlined on
  `--surface-2` (DSV-26). Recipe cards keep their own parts.

## Parts of the app

The parts of `styles.css`, by layer. The shared parts are in the design system.

| Layer | Parts |
|---|---|
| components | versions of `app-header`, `nav-bar`, `sheet`, `dock`, `field`, `switch`, `cluster`, `input`, `item-row`, `section-head`, `group-head`, `empty-state`, `list-group`, `toast` (DSV-3) |
| screens | list: `shop-lists`, `search`, `hint`, `trip-open` · recipes: `product-form`, `product-add`, `products` · menu: `day`, `meal` · settings: `settings`, `about`, `version-status` · onboarding: `onboarding`, `onboarding-art` |
- **DSV-23** An outline button that is not a danger one is an outlined secondary action of the
  Stitch screens: **Filtros** of `Recetas` (DSV-32). The other
  secondary actions stay tonal. The side panels are bordered cards on `--surface`; a recipe tile
  of **Recetas en la lista** is a bordered tile on `--bg` (LIST-38).
- **DSV-24** The rows and group cards of the desktop screen of `Compra`, from 1024px: a 28px tick
  (`--tick`), the name at 16px and weight 600 (`--text-row`, `--weight-row`), the quantity in an
  outlined chip in `--font-mono`, and the recurrence as a terracotta pill on `--warning-soft`
  with a `--warning-line` edge beside the name (`item-row-title`), out of the meta line. The title
  of a group head is 15px (`--text-label-lg`) at weight 600, with its count pill beside it and the
  chevron at the end. At every width the edit button of a row is the grip `grip`, an 18px mark in
  `--struck` (`row-handle`, DSV-33), and a bought row has none. Below 1024px a row and a head keep the phone screen: the count at the end of
  the head, the recurrence in the meta line (beside the name below 600px, DSV-33), a sans
  quantity chip (plain text below 600px). This reverses the "no
  monospace" choice of `docs/bodega-inconsistencies.html` for the desktop row.
- **DSV-25** The sidebar of the desktop screens of Bodega, from 1024px: the frame fills the width
  (`--frame-max: 100vw`), the sidebar is tinted `--surface-2` with a `--line` at its end drawn as a
  shadow (`--shadow-sidebar`), so the rail keeps the layout of the design system (DSV-8). The
  brand is a 40px mark with an 18px name and the 11px status line `nav-brand-note`, the add is
  `nav-action`, and the foot is `nav-foot boxed` with its value `nav-foot-value`: optional parts
  of design system 0.9.0. The sidebar is 256px wide with 20px of padding; the foot is an 11px tonal
  chip on `--secondary` below a `--line` across the sidebar.
- **DSV-26** The main area of the desktop screen of `Compra`, from 1024px. The content is 32px
  from its edges (`--gutter`), and the panels take a third of it, at least 240px (`--panel-width`),
  as the 4 of 12 columns of the screen. The list starts 32px below the header and its cards stand
  24px apart. The head of a group starts its icon 16px from the edge, and its count is an 11px pill
  on `--secondary` in `--control`, with no edge. A row with a meta line has 10px above and below
  its text; the meta pill is 11px bold on `--surface-2`. The quantity chip is 13px on `--surface-2`
  with 2px corners, in `--muted`. The grip is 18px in `--control`. A panel has 20px of padding and
  a line below its head; its second texts are 11px; a tile of **Recetas en la lista** is on
  `--surface-2` with 4px corners and an 8px emerald bar on `--surface-high`, and its link **Ver**
  ends with the icon `arrow-right`. The card **Almacenamiento IndexedDB** of
  the screen is **Almacenamiento local** (LIST-43), as the app stores in `localStorage`: 14px of
  padding, 4px corners, a `--line` edge on `--surface-2`, 11px text in `--control`, the icon
  `database` and the figure in `--font-mono`.
- **DSV-27** The header of the desktop screen of `Compra`, from 1024px. It is on the canvas
  (`--bg`) with its `--line` below, 20px above and below its content, and the title is 32px
  (`--text-headline-l`). The tools stand 12px apart with 4px corners: the search field and the
  arrange button on `--surface-2` with a `--line` edge and 20px icons, the field text 13px in
  `--struck` and its key on `--surface-high`; the add is outlined with an emerald `+` and 13px
  text; **Terminar compra** is 15px at weight 600. The chips row stands 20px below the tools; a
  chip is a 30px pill, as in the screen, its label 11px bold, its count in `--struck`, and the
  count of the pressed chip is on `--done-fixed` in `--on-done-fixed`. The tools and the chips keep
  the tap size (TAP-1): only their look follows the screen. A chip draws its pill inside its 48px
  hit area, `--chip-inset` from its top and bottom, and the focus ring follows the pill. The button **Más filtros** of the screen is not built: the app
  has no such filter.
- **DSV-28** From 1024px every screen but `Ajustes` fills the content area, as the desktop
  screens do: `--page-max` is `100%`, so the header and the main area of `Recetas` and `Menú`
  stand `--gutter` from the rail and from the frame, as those of `Compra` do (DSV-26). Below
  1024px the columns of DSV-9 and NAV-27 stay.
- **DSV-29** From 1024px `Ajustes` is its desktop screen: one centred column of 720px
  (`--settings-max`), the header with no line below. The groups are 24px apart with no line
  between them; each head stands above its rows, 11px, with its 16px icon (`--icon-xs`) first in
  `--struck`, and its help below it at 13px. A row name is at weight 600, its value 15px, its
  chevron in `--struck`, and its icon is 20px in the 32px tile. A danger row draws its tile on
  `--danger-soft` at half strength, and its tag on `--danger-soft`. The update banner is on
  `--surface-2`. The **Modo sin conexión** badge of the header is not built: the rail already shows
  that state (NAV-26).
- **DSV-30** The main area of the desktop screen of `Menú`, from 1024px. Each day is a card on
  `--surface` with a `--line` edge and 4px corners, 8px apart; its name stands in a column of at
  least 128px after a 6px by 24px emerald pill, the name 14px, the date 11px bold in `--struck`. A
  meal has 4px corners: a recipe on `--surface-2`, a dish on `--surface`, a free meal on no ground;
  its label is 11px bold in `--struck`, its name 16px at weight 700 on two lines at most, and its
  status (MENU-25) is an 11px pill: on `--primary-soft` for a recipe, on `--surface-high` for a
  dish. When the meals of a day are at least 480px wide (a container query on `meals`), a meal is a
  row: its kind in a 28px `--surface-high` tile at the start, the label above the name, the pill at
  the end, and a free meal shows its call on one line; narrower, the kind stays at the top end and
  the pill stands below the name. The summary and the actions stand on a `--surface-2` card with a
  `--line` edge: the summary at the start, then a 192px bar of the planned slots of the 14
  (`--planned`, set by `src/ui/menu.js`). The right column holds the panel **Semanas
  anteriores** (MENU-27), its weeks 4px `--bg` tiles with a `--line` edge, and the card
  **Generación automática de cesta** (MENU-21) on `--surface-2` with no line below its head; the
  panel **Para la cesta** is gone. The week switcher in the header and the **Ajustar raciones**
  button of the screen are not built: the week bar of MENU-23 stays above the days, and the app has
  no portions.
- **DSV-31** The desktop screen of `Recetas`, from 1024px. The count of the header is plain 15px
  text in `--muted`, not a pill. A recipe card has `--radius-m` corners and 20px of padding: the name at
  `--text-h`, then a meta line that starts with an 8px dot (`--struck`, emerald for a recipe in
  the list) and ends with `· en la lista` as plain text (REC-40), then the line of products, then a
  foot below a `--line` with the link button and the send button, both 4px tiles on
  `--surface-2`, the send with its text **Añadir** (`recipe-send-text`). The cards fill as many
  columns as fit, each 288px at least, beside the pane too (REC-39); the open card has a 2px emerald edge
  and its **Añadir** is emerald. The pane is a form: its head holds **Listo** alone, under a line;
  the name is its title, a 24px field with no box until the focus; the names of the fields are
  11px small capitals; the link card is an **Abrir enlace** button beside the field **Enlace**;
  the products have their count and their dots (REC-9); the add button is tonal; the foot starts
  with **Añadir a Compra** and its hint (REC-42). The parts of the screen with no data in the app
  are not built: the category label and the **Activa** pill of a card, the recipe code of the
  foot of a card, the print button (DSV-32), the quantities of the products, the **Receta activa** and **Modo edición** pills and the expand button of the pane, and
  the storage strip at the foot of the screen (the rail shows the offline state, NAV-26). The
  search stands on its own line of the header (DSV-32).
- **DSV-32** The header of the desktop screen of `Recetas`, from 1024px. The title and **Crear
  receta** stand on the first line; the search field takes the second line, 48px high, on
  `--surface` with a `--control` edge and 4px corners, its text 15px in `--muted`, and
  **Filtros** ends that line: an outlined button with the icon `filter`, on `--primary-soft` with
  an emerald edge while open. A filter other than Todas puts an emerald `1` on it. The chips of
  REC-40 show only while **Filtros** is open (`ui.recipeFiltersOpen`, not saved, closed at the
  start); below 1024px there is no **Filtros** and the chips show as before. The subtitle ends with
  `· guardadas localmente` with no account and `· sincronizadas` with one (NAV-26), and a narrow
  header cuts it with an ellipsis, so the title and the add keep one line. The print button of
  the screen is not built: the app does not print.
- **DSV-33** The phone screen of `Compra`, below 600px (the Stitch screen `compra_m_vil_lista_de_supermercado`).
  1. A bar stands above the title of `Compra`: 56px high, with a `--line` line below it. It shows
     the icon `basket` in `--done` and the name of the app (`app.name`, 18px, weight 700) at the
     start, and **Terminar compra** at the end: a text button in `--done`, 15px, that opens the
     trip sheet (TRIP-4) and is disabled when TRIP-1 does not hold. It takes the place of the
     three dots of NAV-9. The other sections have no bar. With `Izquierda` the bar is mirrored
     (NAV-13).
  2. The toast stands 8px below the top of the screen, over the bar, and comes in from above.
     From 600px it stands at the bottom, as in the design system.
  3. The dock holds the shop chip at its start: a white pill with the icon `store` in `--done`, the
     name of the list, its count and `▾`. The search button and the `+` stand at its end (SHOP-26).
  4. Below 600px a row of `Compra` is 48px (`--tap`): the 24px tick with 12px above and below it,
     the name at 16px, and the list from edge to edge with no card (DSV-13). The quantity is plain
     `--muted` text at 15px (DSV-15). A meta line that holds only the mark of a recurrent item does
     not show: the mark stands after the name as `↻` alone, and a screen reader hears its words. A
     meta line with shops keeps the mark. From 600px to 1023px a row is 60px: the 32px tick with
     14px above and below it, the 18px name and the 15px quantity chip. The grip is an 18px mark in
     `--struck`. A bought row has no grip: **Editar**
     stays in its side actions (ROW-7). Its content is at 65% opacity on its opaque ground, so
     the action below it never shows through, and only its name is struck.
  5. `Comprados (N)` is open at first (LIST-12).

  The parts of the screen with no behaviour or no data in the app are not built: the search tile
  of the header (the search stays in the dock, LIST-37), the drag of a row by its grip (the grip
  opens **Editar**), and the units of the quantities beyond the text of the item. The aisle groups
  keep their chevron (GROUP-16), and the sign-in banner stays (ACC-11). The emerald quantity chip
  of the first row of the screen is not taken: no other row has it. The grip keeps its 48px tap
  target (TAP-1), so a long name ends in an ellipsis sooner than in the screen.
