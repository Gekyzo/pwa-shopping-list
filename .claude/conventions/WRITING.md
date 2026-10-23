---
name: WRITING
scope: tree
stub: true
extends: ../../../.claude/conventions/WRITING.md
---

# WRITING conventions — shopping

This component inherits the WRITING conventions of `personal/`.

**Read the file named in `extends:` above first. Anything under "Local overrides"
below wins over it; everything else there applies here unchanged.**

Do not restate the inherited rules in this file. A restated rule is a copy, and
copies drift — which is the whole reason this is a link.

## Local overrides

- **Language:** the text that the app shows to the user is in the catalogs of `src/locales/`, each file in its language; `es.js` is the source wording, and a new text gets an entry in each of the seven. No other file of `src/` and no element of `index.html` holds text for the user. `manifest.webmanifest` is in Spanish. The living spec pages of `docs/specs/` (made with `/report:spec --es`) are in Spanish. Code, comments, tests names, other docs (`docs/spec/` included) and commits stay in English.
