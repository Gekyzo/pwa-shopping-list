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
- `twa/twa-manifest.json` is the only source of the Android app (a Trusted Web Activity); `npm run apk`
  (`scripts/apk.mjs`) builds it, and Bubblewrap writes the rest of `twa/`, which git ignores.
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
- `src/recipes.js` and `src/menu.js` for a recipe rule and a menu rule.
- `src/lists.js` and `src/shares.js` for the shared list of a member.
- `src/syncer.js`, `src/sync.js`, `src/records.js`, `src/session.js` and `src/pocketbase.js` for the
  account and the sync.
- `src/app.js`, `src/ui/` and `styles.css` for the screen: one module of `src/ui/` for each view,
  and `src/ui/context.js` for the values that the views share.
- `src/storage.js` for the stored format and the backup.
- `sw.js` for offline behaviour.
- `src/version.js`, `version.json`, `scripts/release.mjs` and `.githooks/pre-push` for the version of a
  deploy, and `src/whatsnew.js` with `release-notes/<lang>.md` for the notes a user reads.
- `.github/workflows/pages.yml` for the deploy: a pushed tag `vX.Y.Z` publishes the site.

## Tests

Run `npm test` (`node --test`, every `tests/*.test.js`). Run `npm run test:features` for the
Gherkin scenarios only, as a tree.

- `tests/<module>.test.js` for each pure module of `src/`: `aisles`, `config`, `device`, `i18n`,
  `install`, `lists`, `menu`, `onboarding`, `pocketbase`, `recipes`, `records`, `reorder`,
  `sections`, `session`, `shares`, `sheets`, `shops`, `storage`, `store`, `suggest`, `swipe`,
  `sync`, `syncer`, `update`, `version` and `whatsnew`.
- `tests/rows.test.js`, `tests/context.test.js` and `tests/controls.test.js` for parts of `src/ui/`,
  with a stub of the page. `tests/layers.test.js` checks the layer rules of `src/ui/`,
  `tests/layer-order.test.js` the top layer of `src/layers.js`, and `tests/aliases.test.js` the import
  map of `index.html`.
- `tests/markup.test.js` for `index.html`, `tests/look.test.js` and `tests/breakpoints.test.js` for
  `styles.css`, `tests/design.test.js` for the rules of the design system and
  `tests/design-files.test.js` for its files.
- `tests/sw.test.js` for `localizeManifest` of `sw.js`.
- `tests/png.test.js`, `tests/glyph.test.js`, `tests/changelog.test.js`, `tests/pair.test.js`,
  `tests/release.test.js` and `tests/apk.test.js` for the scripts of `scripts/` of the same name.
  `tests/twa.test.js` checks `twa/twa-manifest.json` against `manifest.webmanifest`, and
  `tests/release-notes-files.test.js` the files of `release-notes/`.
- `tests/spec.test.js` checks `docs/spec/` against the code.
- The Gherkin scenarios of `tests/features/` run through `tests/features.test.js`, with their step
  definitions in `tests/bdd/steps/` and the shared fakes in `tests/fakes.js`;
  `tests/gherkin.test.js` checks the parser and the runner of `tests/bdd/`.
  `tests/features/exempt.txt` lists each rule that no scenario proves (ENG-18).

`src/app.js`, most of `src/ui/` and the rest of `sw.js` have no unit tests; check them in a browser
with `npm run serve`, and a share between two users with `npm run pair` (`docs/two-users.md`).
`.githooks/pre-push` and `.githooks/pre-commit` have no test; check them in a scratch clone, the
first one with a bare remote.

## Ignore

- `icons/icon-*.png`: written by `npm run icons` from `icons/source.png`, the art of the icon.
- `icons/shortcut-*.png`: written by `npm run icons` from the glyphs of `scripts/make-icons.mjs`.
- `docs/superpowers/plans/*.progress.md`: written by `plan-current.sh`.
- `version.json` and the `version` of `package.json`: written by `scripts/bump-version.mjs`. Do not edit them by hand.
- The version headings of `CHANGELOG.md` and of `release-notes/<lang>.md`: written by
  `scripts/bump-version.mjs` from `Unreleased`. Write a change under `Unreleased` only.
- `twa/` except `twa/twa-manifest.json` and `twa/.gitignore`: written by Bubblewrap.

## Siblings

<!-- Peer components under the same parent that carry their own conventions.
     Derived by the bootstrap skill; refreshed with `/bootstrap --again`. -->

- [`foodie`](../../../foodie/.claude/conventions/) —
- [`wardrobe`](../../../wardrobe/.claude/conventions/) —

This project consumes nothing from them.
