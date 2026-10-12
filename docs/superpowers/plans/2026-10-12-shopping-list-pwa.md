# Shopping list PWA — implementation plan

Spec: `docs/superpowers/specs/2026-10-12-shopping-list-pwa-design.md`

One commit for each task. Tasks 1 and 2 are test-first.

### Task 1: State functions

`package.json`, `src/store.js`, `tests/store.test.js`. Pure functions, each one returns a new state.
A rejected operation returns `{ state, error }` with the state unchanged.

### Task 2: Storage

`src/storage.js`, `tests/storage.test.js`. `load`, `save`, `exportJson`, `importJson` and validation, with
an injected storage object.

### Task 3: User interface

`index.html`, `styles.css`, `src/app.js`. Tabs, rows, add form, `Undo` message, backup menu.

### Task 4: PWA shell

`manifest.webmanifest`, `icons/`, `scripts/make-icons.mjs`, `sw.js`, service worker registration.

### Task 5: README

Use, test, deploy and install steps.

### Task 6: Deploy

Create the GitHub repository and enable Pages from `main` / root. This step publishes the code. It needs
a confirmation, and the choice of public or private, before it runs.
