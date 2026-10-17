---
name: GIT
scope: tree
stub: true
extends: ../../../.claude/conventions/GIT.md
---

# GIT conventions — shopping

This component inherits the GIT conventions of `personal/`.

**Read the file named in `extends:` above first. Anything under "Local overrides"
below wins over it; everything else there applies here unchanged.**

Do not restate the inherited rules in this file. A restated rule is a copy, and
copies drift — which is the whole reason this is a link.

## Local overrides

- **Remote:** `origin` is `git@github-personal:Gekyzo/pwa-shopping-list.git`. A push to `main` deploys nothing.
- **Releases:** a release is a tagged version, and only the push of its tag `vX.Y.Z` deploys (`.github/workflows/pages.yml` publishes the tagged commit to GitHub Pages). `npm run release [-- minor|major]` writes the commit `Bump version to X.Y.Z` (only `version.json`, `package.json` and the release of `Unreleased` in `CHANGELOG.md`) and the annotated tag; `git push --follow-tags` sends both. This is the one exception to "No tool writes commits of its own onto the trunk", and to "no version tags".
- **Tag check:** `.githooks/pre-push` stops the push of a tag `vX.Y.Z` whose commit has another version in `version.json`. Enable the hook with `npm run hooks`.
