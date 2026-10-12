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

## Look here first

- `src/store.js` for a list rule.
- `src/app.js` and `styles.css` for the screen.
- `src/storage.js` for the stored format and the backup.
- `sw.js` for offline behaviour.
- `src/version.js`, `version.json` and `.githooks/pre-push` for the version of a deploy.

## Tests

`tests/<module>.test.js` for `store`, `recipes`, `swipe`, `storage` and `version`. Run
`npm test` (`node --test`). `src/app.js` and `sw.js` have no unit tests; check them in
a browser with `npm run serve`. `.githooks/pre-push` has no test; check it in a scratch
clone with a bare remote.

## Ignore

- `icons/*.png`: written by `npm run icons` from `scripts/make-icons.mjs`.
- `docs/superpowers/plans/*.progress.md`: written by `plan-current.sh`.
- `version.json`: written by `.githooks/pre-push`. Do not edit it by hand.

## Siblings

<!-- Peer components under the same parent that carry their own conventions.
     Derived by the bootstrap skill; refreshed with `/bootstrap --again`. -->

- [`claude-guide`](../../../claude-guide/.claude/conventions/) —
- [`claude-sync`](../../../claude-sync/.claude/conventions/) —

This project consumes nothing from them.
