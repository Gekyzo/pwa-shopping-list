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

- **Remote:** `origin` is `git@github.com:Gekyzo/shopping.git`. GitHub Pages serves `main` / root, so a push to `main` is a deploy.
