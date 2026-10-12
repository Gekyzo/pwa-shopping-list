---
name: WORKFLOW
scope: tree
stub: true
extends: ../../../.claude/conventions/WORKFLOW.md
---

# WORKFLOW conventions — shopping

This component inherits the WORKFLOW conventions of `personal/`.

**Read the file named in `extends:` above first. Anything under "Local overrides"
below wins over it; everything else there applies here unchanged.**

Do not restate the inherited rules in this file. A restated rule is a copy, and
copies drift — which is the whole reason this is a link.

## Local overrides

- **Definition of done:** the test command is `npm test`. A change to the user interface or to `sw.js` is also checked in a browser at a phone viewport, with the server stopped for the offline check.
