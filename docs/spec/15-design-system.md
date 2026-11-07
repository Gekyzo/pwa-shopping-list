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
  app has its own versions of `app-header`, `sheet`, `dock`, `input`, `item-row`, `group-head`,
  `section-head`, `empty-state`, `list-group` and `nav-bar` (colour only, DSV-13).
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
  instead (REC-39). The walkthrough content also keeps the width of the column.
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
  (LIST-38, LIST-39, MENU-21). From 840px the recipe sheet is a pane (`side-pane`, REC-39), and
  `Ajustes` sets `--page-max` to `--settings-max` (NAV-27). The code reads the class from
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
  a row is a round tick of 32px (`--tick`) with a `--struck` border, filled with `--done` when
  checked, with a short scale snap. A bought row stands on `--surface-2`, with its name in
  `--struck` and struck through. An input has a 1.5px `--control` border and a 2px `--done` border
  on focus. The head of a group is 18px (`--text-group`), with its count as muted second text
  (`group-head-end`).
- **DSV-13** The screens of the Stitch project `Shopping`, with no change of behaviour. The rows of
  a list group stand in a card: an inset `--line` border with 6px corners, 16px from the edge
  below 600px, below a head on the canvas with its count as a pill (`group-head-count`). The groups
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
  quantity is a tonal chip on `--secondary` with no edge, 13px with tabular figures. A bought
  quantity is drawn: a `--line` edge on `--surface`, in `--struck`.
- **DSV-16** `Comprados (N)` (LIST-12) is a card of its own: its head (`bought-head`) is the top
  of a box with a 1px `--line` border, 6px corners and a `--surface-2` ground, with a check in
  `--done` before the title at 18px and the chevron at its end; the bought rows close the box. A
  bought tick is filled at 70% opacity.
- **DSV-17** The dock floats over the list: no bar and no top line behind it. Each of its controls
  is a level 2 tile on `--surface`, with a `--border-control` `--control` border and `--shadow-l`;
  the add button keeps its emerald fill and takes the same shadow. The tools of the header are
  tiles on `--secondary`. The toast is the inverse surface (`--toast-bg` `#342f2b`, text
  `#f9efe8`; dark `#eae1da` and `#1f1b17`), its action in `--inverse-primary` (`#82d8a8`, dark
  `#13734b`). It has no icon, because it also shows errors.
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
  `--line` edge. From 1024px each row icon stands in a 32px `--surface-2` tile (`--icon-tile`).
  The trip-end choice stays two segments: the switch of the screen would be a change of control.
- **DSV-22** From 1024px, as in the desktop screens. The current section of the rail is a band on
  `--secondary` with a 3px emerald bar at its start (`--shadow-current`), and its count an
  emerald pill (`--shadow-count`); both are shadows, so the rail keeps its layout (DSV-8). The
  head of a group of `Compra` is the tinted top of its card (`--surface-2`, a `--line` edge, 6px
  top corners); the meta line of a row is a small outlined pill; the quantity chip is outlined on
  `--surface`. Recipe cards keep their own parts.

## Parts of the app

The parts of `styles.css`, by layer. The shared parts are in the design system.

| Layer | Parts |
|---|---|
| components | versions of `app-header`, `nav-bar`, `sheet`, `dock`, `input`, `item-row`, `section-head`, `group-head`, `empty-state`, `list-group` (DSV-3) |
| screens | list: `shop-lists`, `search`, `hint`, `trip-open` · recipes: `product-form`, `product-add`, `products` · menu: `day`, `meal` · settings: `settings`, `about`, `version-status` · onboarding: `onboarding`, `onboarding-art` |
- **DSV-23** An outline button that is not a danger one is an outlined secondary action of the
  Stitch screens: **Posponer** of `Editar` and **Mover todos a la compra actual**. The other
  secondary actions stay tonal. The side panels are bordered cards on `--surface`; a recipe tile
  of **Recetas en la lista** is a bordered tile on `--bg` (LIST-38).
- **DSV-24** The rows and group cards of the desktop screen of `Compra`, from 1024px: a 28px tick
  (`--tick`), the name at 16px and weight 600 (`--text-row`, `--weight-row`), the quantity in an
  outlined chip in `--font-mono` at the normal weight, and the recurrence as a terracotta pill
  with a `currentColor` edge beside the name (`item-row-title`), out of the meta line. The title
  of a group head is 15px (`--text-label-lg`) at weight 600, with its count pill beside it and the
  chevron at the end. At every width the edit button of a row is the grip `grip` in `--muted`
  (`row-handle`). Below 1024px a row and a head keep the phone screen: the count at the end of
  the head, the recurrence in the meta line, a sans quantity chip. This reverses the "no
  monospace" choice of `docs/bodega-inconsistencies.html` for the desktop row.
- **DSV-25** The sidebar of the desktop screens of Bodega, from 1024px: the frame fills the width
  (`--frame-max: 100vw`), the sidebar is tinted `--surface-2` with a `--line` at its end drawn as a
  shadow (`--shadow-sidebar`), so the rail keeps the layout of the design system (DSV-8). The
  brand is a 40px mark with the status line `nav-brand-note`, the add is `nav-action`, and the
  foot is `nav-foot boxed` with its value `nav-foot-value`: optional parts of design system 0.9.0.
