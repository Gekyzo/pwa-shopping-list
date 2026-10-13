# Shopping

An offline shopping list PWA for one Android phone. It has a list for the current trip, a list for
the next trip, recipes and shops, in seven languages. Plain HTML, CSS and ES modules, with no build
step and no dependencies. The data stays in the `localStorage` of the browser.

- App: https://gekyzo.github.io/shopping-list/
- Specification: [`docs/spec/`](docs/spec/README.md), with one identifier for each rule.
- Changes by version: [`CHANGELOG.md`](CHANGELOG.md).

## Install on Android

1. Open the app URL in Chrome.
2. Open the Chrome menu and tap **Add to Home screen → Install**.
3. Start the app from the home screen. It works without a network connection.

**Clear site data** in Chrome and the uninstall of the app delete the lists. Export a backup in
**Ajustes** before you do that.

## Develop

Node 20 or later.

```sh
npm run hooks    # enable the git hooks of .githooks/ in this clone (one time)
npm test         # unit tests (node:test)
npm run serve    # http://localhost:8080
npm run icons    # write the PNG icons again after a change in scripts/make-icons.mjs
```

A change of behaviour changes its rule in `docs/spec/` in the same commit. The `pre-commit` hook
stops a commit of the app that has no change of the specification; `git commit --no-verify` passes
a commit that changes no rule.

## Deploy

GitHub Pages serves `main` / root, so a push to `main` is a deploy. The `pre-push` hook makes the
commit `Bump version to X.Y.Z` and stops the push; a second `git push` passes.

## Where to read

| Subject | Document |
|---|---|
| What the app does, and what it does not do | [01-product](docs/spec/01-product.md) |
| The lists, the trip and the add sheet | [03-lists](docs/spec/03-lists.md) |
| Order, groups, shops and recipes | [04-arrange](docs/spec/04-arrange.md), [05-shops](docs/spec/05-shops.md), [06-recipes](docs/spec/06-recipes.md) |
| Gestures, messages and undo | [07-screen](docs/spec/07-screen.md) |
| The stored format and the backup | [02-data-model](docs/spec/02-data-model.md), [08-storage](docs/spec/08-storage.md) |
| Languages and the rules of the text | [09-languages](docs/spec/09-languages.md) |
| Offline use, version, deploy and installation | [10-offline-version](docs/spec/10-offline-version.md) |
| The reminder at the shop | [11-integrations](docs/spec/11-integrations.md) |
| Modules, code rules and tests | [12-engineering](docs/spec/12-engineering.md) |
