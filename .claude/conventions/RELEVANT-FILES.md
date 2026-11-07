---
name: RELEVANT-FILES
scope: local
load-order: 6
read-when: when looking for where something lives, or which tests cover it
description: Where to look first in this component, what to ignore, and which peers it works with.
---

# Relevant files

## Entry points

- `index.html` loads `src/app.js` as a module.
- `sw.js` is registered by `src/app.js`.
- `manifest.webmanifest` is the installation data.
- `design-system/` is the base sheet of the app, owned here (DSV-1, DSV-4); `styles.css` holds the parts of the app.

## Look here first

- `docs/spec/` for what the app does, one identifier for each rule.
- `DESIGN.md` for the type, shapes and components of the app, from the Stitch project `Shopping`
  (`projects/6581702173965354921`), with the palette of the Stitch screens of Bodega (DSV-11). It is
  applied in this app only (DSV-10 to DSV-12): the tokens and component versions of `styles.css`
  override `design-system/`, and the font is in `fonts/`. Where the Bodega screens disagree
  with each other, `docs/bodega-inconsistencies.html` records the choice.
- `src/store.js` for a list rule.
- `src/shops.js` for a shop rule.
- `src/aisles.js` for an aisle rule (a section of the store).
- `src/app.js`, `src/ui/` and `styles.css` for the screen: one module of `src/ui/` for each view,
  and `src/ui/context.js` for the values that the views share.
- `src/storage.js` for the stored format and the backup.
- `sw.js` for offline behaviour.
- `src/version.js`, `version.json` and `.githooks/pre-push` for the version of a deploy.

## Tests

`tests/<module>.test.js` for `device`, `store`, `recipes`, `shops`, `aisles`, `swipe`, `sections`, `onboarding`, `reorder`, `storage` and `version`, `tests/sw.test.js` for `localizeManifest` of `sw.js`, `tests/png.test.js` for `scripts/png.mjs`, `tests/glyph.test.js` for `scripts/glyph.mjs` and `tests/changelog.test.js` for `scripts/changelog.mjs`, `tests/pair.test.js` for `scripts/pair.mjs`. Run
`npm test` (`node --test`). `src/app.js`, `src/ui/` and the rest of `sw.js` have no unit tests; check them in
a browser with `npm run serve`. `tests/spec.test.js` checks `docs/spec/` against the code, and
`tests/layers.test.js` the layer rules of `src/ui/`. `tests/design.test.js` runs the rules of the design system and
`tests/design-files.test.js` checks its files.
`.githooks/pre-push` and `.githooks/pre-commit` have no test; check them in a scratch clone, the
first one with a bare remote.

## Ignore

- `icons/icon-*.png`: written by `npm run icons` from `icons/source.png`, the art of the icon.
- `icons/shortcut-*.png`: written by `npm run icons` from the glyphs of `scripts/make-icons.mjs`.
- `docs/superpowers/plans/*.progress.md`: written by `plan-current.sh`.
- `version.json` and the `version` of `package.json`: written by `scripts/bump-version.mjs`. Do not edit them by hand.
- The version headings of `CHANGELOG.md`: written by `scripts/bump-version.mjs` from `Unreleased`. Write a change under `Unreleased` only.

## Siblings

<!-- Peer components under the same parent that carry their own conventions.
     Derived by the bootstrap skill; refreshed with `/bootstrap --again`. -->

- [`claude-guide`](../../../claude-guide/.claude/conventions/) —
- [`claude-sync`](../../../claude-sync/.claude/conventions/) —

This project consumes nothing from them.
