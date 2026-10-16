# Design system

The shared tokens, base rules, components, layouts and icon rules come from `pwa-design-system`.
Its rules DS-1 to DS-8 are in its `docs/spec/01-design-system.md`, and LAY-1 to LAY-4 in its
`docs/spec/02-layout.md`. `vendor/design-system/SOURCE.json` names the version and the commit that
this app uses. `tests/design.test.js` runs each rule of `vendor/design-system/rules.js` over the
files of the app, except the exceptions of DSV-5. `designs/index.html` shows each part, shared and
own.

This document holds the rules of the app only.

## The copy

- **DSV-1** `vendor/design-system/` holds `design-system.css`, `catalog.js`, `rules.js` and
  `SOURCE.json`: the version, the commit and the sha256 of each file, and no other file. Only
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
  app has its own versions of `icon`, `nav-bar`, `toast`, `item-row`, `group-head` and `fab`.
- **DSV-4** A change of a shared part is made in `pwa-design-system`, then `npm run ds` here.
  Nothing edits `vendor/` by hand.

## Exceptions

- **DSV-5** The app has one layout at each width: the bar stays at the bottom, with no rail and no
  `pane` layout (LAY-1 to LAY-3). Its versions of `nav-bar`, `toast` and `fab` reset the rules of
  the shared sheet for `min-width: 600px`. The app does not pad the page, the toast or the add
  button for a cutout of the phone (LAY-4); a change to that would show on the screen, and it is
  left to the user. `tests/design.test.js` skips the checks of LAY-3 and LAY-4.

## Parts of the app

The parts of `styles.css`, by layer. The shared parts are in the design system.

| Layer | Parts |
|---|---|
| components | versions of `icon`, `nav-bar`, `toast`, `item-row`, `group-head`, `fab` (DSV-3) |
| screens | list: `shop-lists`, `search`, `hint`, `trip-open` · recipes: `product-form`, `product-add`, `products` · menu: `day`, `meal`, `menu-actions` · settings: `settings`, `about`, `version-status` · nav: `dust` · onboarding: `onboarding`, `onboarding-art` |
