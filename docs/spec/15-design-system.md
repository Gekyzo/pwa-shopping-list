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
  app has its own versions of `app-header`, `sheet`, `dock`, `item-row`, `group-head`, `empty-state`
  and `list-group`.
- **DSV-4** A change of a shared part is made in `pwa-design-system`, then `npm run ds` here.
  Nothing edits `vendor/` by hand.

## Exceptions

- **DSV-5** Retired: design system 0.5.0 puts the rail at the side of the hand (LAY-2), so the app
  has no version of `nav-bar`, `toast` and `fab` of its own. The layout is in DSV-8.
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
  centred frame (LAY-2, NAV-26); `styles.css` has no version of `nav-bar`. `body` pads
  `--rail-width` at the start and `--frame-side` at the end (LAY-4). The header and `main` share the
  side padding of LAY-1. From 840px the recipes of `Recetas` stand in two columns; the app has no
  list and detail section, so it has no `pane` layout.

- **DSV-9** The app has the four width classes of LAY-1. Its own columns: from 600px the panels of
  `Compra` and `Menú` (`side-panels`) stand below the content, and from 840px beside it,
  `--gutter` apart, with `--page-max` at `100%` so the content fills the area as a pane does
  (LIST-38, LIST-39, MENU-21). From 840px the recipe sheet is a pane (`side-pane`, REC-39), and
  `Ajustes` sets `--page-max` to `--settings-max` (NAV-27).

## Parts of the app

The parts of `styles.css`, by layer. The shared parts are in the design system.

| Layer | Parts |
|---|---|
| components | versions of `app-header`, `sheet`, `dock`, `item-row`, `group-head`, `empty-state`, `list-group` (DSV-3) |
| screens | list: `shop-lists`, `search`, `hint`, `trip-open` · recipes: `product-form`, `product-add`, `products` · menu: `day`, `meal` · settings: `settings`, `about`, `version-status` · onboarding: `onboarding`, `onboarding-art` |
