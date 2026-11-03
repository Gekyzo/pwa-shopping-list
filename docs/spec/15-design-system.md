# Design system

The shared tokens, base rules, components, layouts and icon rules come from `pwa-design-system`.
Its rules DS-1 to DS-8 are in its `docs/spec/01-design-system.md`, and LAY-1 to LAY-5 in its
`docs/spec/02-layout.md`. `vendor/design-system/SOURCE.json` names the version and the commit that
this app uses. `tests/design.test.js` runs each rule of `vendor/design-system/rules.js` over the
files of the app and skips no rule (DSV-8). `designs/index.html` shows each part, shared and
own.

This document holds the rules of the app only.

## The copy

- **DSV-1** `vendor/design-system/` holds `design-system.css`, `catalog.js`, `rules.js`,
  `sheet.js`, the font `geist.woff2` and `SOURCE.json`: the version, the commit and the sha256 of
  each file, and no other file. Only
  `npm run ds` writes it, from `../pwa-design-system` with no uncommitted change of those files. A
  file that differs from its hash fails `tests/vendor.test.js`. The tests read the copy only, so
  they pass with no `../pwa-design-system`.
- **DSV-2** `index.html` and `designs/index.html` link `vendor/design-system/design-system.css`
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
- **DSV-4** A change of a shared part is made in `pwa-design-system`, then `npm run ds` here.
  Nothing edits `vendor/` by hand.

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
  `Ajustes` sets `--page-max` to `--settings-max` (NAV-27).

## The look of the app

- **DSV-10** The app follows `DESIGN.md` (the Utilitarian Market Ledger of the Stitch project
  `Shopping`) in this app only: `styles.css` sets its tokens in the `tokens` layer over those of the
  design system, and the shared sheet does not change. The font is Hanken Grotesk, from the files
  `fonts/hanken-grotesk-latin.woff2` and `fonts/hanken-grotesk-latin-ext.woff2` of the app (SIL OFL,
  `fonts/OFL.txt`), both in `SHELL` of `sw.js` (SW-2), so it shows offline. No font comes from the
  network.
- **DSV-11** The palette is warm stone paper with one emerald and one terracotta, in both themes.
  Light: canvas `#f9f8f5` (`--bg`), rows and sheets `#ffffff`, ink `#1c1917`, muted ink `#78716c`,
  struck ink `#a8a29e` (`--struck`), borders `#e7e5e4` and `#d6d3d1`. Dark: canvas `#0c0a09`, rows
  `#1c1917`, ink `#f5f5f4`, muted ink `#a8a29e`. Emerald `#13734b` (dark `#4fbf88`) is `--done` and
  `--primary`: the main action, progress and the checked state. Error red `#ba1a1a` (dark
  `#ffb4ab`) is `--danger`: a destructive action and a failure. Terracotta `#b34a24` (dark
  `#f0906a`) is `--warning`: an alert and the mark of a recurrent item. Controls, buttons and cards have 6px corners; depth
  comes from borders, and only a sheet or a lifted row has a shadow. The body text is 16px with
  tabular figures.
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
  emerald with no pill, on `--done-soft` from 1024px. The name of a day of `Menú` is 18px after an
  emerald bar.
- **DSV-14** The detail of the Stitch screens, with no change of behaviour. The quantity chip of a
  row has a 1px `--line` border. The name of a recipe card is 18px at weight 600; its link button is
  a bordered tile and its send button an emerald tile, both 40px inside the 48px target (`--tap`).
  From 840px a card fills the height of its grid row. The week of `Menú` is a bordered bar on
  `--surface`. A meal is a tile of at least 88px (`--meal-min`, none in Compacta): a 13px label,
  then the name at 18px; a free meal centres its call, and a dish stands on `--surface-2`. An
  outline danger button is drawn in `--danger` on `--surface`. The chevron of a settings row is a
  drawn 24px mark. The bar shows crossed cutlery (`utensils`) for `Recetas` and an open book
  (`menu`) for `Menú`, as in the screens.

## Parts of the app

The parts of `styles.css`, by layer. The shared parts are in the design system.

| Layer | Parts |
|---|---|
| components | versions of `app-header`, `nav-bar`, `sheet`, `dock`, `input`, `item-row`, `section-head`, `group-head`, `empty-state`, `list-group` (DSV-3) |
| screens | list: `shop-lists`, `search`, `hint`, `trip-open` · recipes: `product-form`, `product-add`, `products` · menu: `day`, `meal` · settings: `settings`, `about`, `version-status` · onboarding: `onboarding`, `onboarding-art` |
