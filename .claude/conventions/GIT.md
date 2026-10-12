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

- **Remote:** `origin` is `git@github.com:Gekyzo/shopping-list.git`. GitHub Pages serves `main` / root, so a push to `main` is a deploy.
- **Version bump:** `.githooks/pre-push` writes the commit `Bump version to N` (only `version.json`) and stops the push; a second `git push` passes. This is the one exception to "No tool writes commits of its own onto the trunk". Enable the hook with `npm run hooks`.
