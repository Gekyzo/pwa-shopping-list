# shopping

An offline shopping list PWA for one Android phone, with an `Active` list for the
current trip and a `Next` list for the next trip. Plain HTML, CSS and ES modules; no
build step and no dependencies.

## Commands

```sh
npm test         # unit tests (node --test)
npm run serve    # http://localhost:8080
npm run icons    # write the PNG icons again
npm run release  # bump, commit and tag vX.Y.Z; git push --follow-tags deploys
npm run ds       # copy the design system again from ../pwa-design-system
```

## Conventions

Read `.claude/conventions/` (loaded at session start): GIT, WRITING, CANONICAL,
WORKFLOW, AUTONOMY, ARCHITECTURE, RELEVANT-FILES.

## Changelog and release notes

- `CHANGELOG.md` is the technical record, in English.
- `release-notes/<lang>.md` is what a user reads in the app, one file for each catalog of
  `src/locales/`. A user-visible change adds a bullet under `Unreleased` in every file, in the
  same commit. `npm run release` stops when only some languages have one.
