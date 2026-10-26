# Design system

The shared tokens, base rules, components, layouts and icon rules come from `pwa-design-system`.
Its rules DS-1 to DS-8 are in its `docs/spec/01-design-system.md`, and LAY-1 to LAY-4 in its
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
- **DSV-6** From 600px a sheet is at most `--content-max` wide and stands below the column. Its
  veil covers the rail. From 840px a sheet with a head is the side sheet of the design system,
  full height, next to the rail at the side of the hand. From 840px (DSV-9) a sheet with a head
  takes the column of the panels of `Compra` (LIST-38) with either hand: `--panel-width` wide, as high
  as its content, from 16px below the header, with the radius of a group, over the veil. The content
  of a view with no panels makes room for that column while the sheet is open, so the sheet covers
  no row. The recipe sheet is a pane instead (REC-39). The walkthrough content also keeps the width of the column.
- **DSV-7** A window of at most 480px height (a phone on its side) gives more height to the
  content. The header has less padding, and the walkthrough has no logo.

## Layout

- **DSV-8** The app follows LAY-1 to LAY-4 with one exception, DSV-9, and `tests/design.test.js` skips
  DS-8 only to run it again without the breakpoint of DSV-9. Below 600px the bar is at the bottom, and the dock of `Compra` stands above it (SHOP-26).
  From 600px the bar is the rail at the left with either hand (DSV-9, NAV-26); the toast and the
  `+` button clear it. `body` pads the rail and both safe-area insets (LAY-4). The
  header content and the content of `main` form one column of at most `--content-max`, centred
  beside the rail. From 840px the recipes of
  `Recetas` stand in two columns; the app has no list and detail section, so it has no `pane`
  layout. LAY-3 runs and passes, because it checks the `pane` block of the shared sheet.

- **DSV-9** The app has four width classes: phone (below 600px), foldable (600px), tablet (840px)
  and desktop (1024px). From 600px it breaks LAY-2: the rail stands at the start with either hand
  (NAV-26). From 1024px it also breaks LAY-1: it stands in a frame of at most `--frame-max`
  (1280px), centred, and the rail is a sidebar of `--sidebar-width` (232px). `--rail-width` is the
  frame's side margin plus the rail, and `--frame-side` is the end margin (0 below 1024px), so the
  toast, the `+` button and the side sheets clear both; at the side of the hand they clear the
  frame's end margin. `styles.css` changes `nav-bar` only inside its 600px and 1024px queries
  (`@extends nav-bar`, parts `nav-brand` and `nav-count`), and 1024px is the one width query outside
  DS-8. From 600px the panels of `Compra` and `Menú` (`side-panels`) stand below the content, and
  from 840px beside it (LIST-38, LIST-39, MENU-21). From 840px the recipe sheet is a pane
  (`side-pane`, REC-39). The other apps of the design system do not change.

## Parts of the app

The parts of `styles.css`, by layer. The shared parts are in the design system.

| Layer | Parts |
|---|---|
| components | versions of `app-header`, `sheet`, `dock`, `item-row`, `group-head`, `empty-state`, `list-group` (DSV-3) |
| screens | list: `shop-lists`, `search`, `hint`, `trip-open` · recipes: `product-form`, `product-add`, `products` · menu: `day`, `meal` · settings: `settings`, `about`, `version-status` · onboarding: `onboarding`, `onboarding-art` |
