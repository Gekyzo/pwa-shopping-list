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

- **Definition of done:** the test command is `npm test`. A change to the user interface or to `sw.js` is also checked in a browser at the four breakpoints below, with the server stopped for the offline check.
- **Breakpoints:** the rule of `pwa-template` (`../pwa-template/.claude/conventions/WORKFLOW.md`), which is its source; here the four classes are those of DSV-9. Every user-interface change, and every design or prototype (a revamp gallery, a mockup under `.taste-skill/` or `designs/`), is checked at the four width classes of DSV-9, one width inside each: phone 390px (below 600px), foldable 700px (600-839px), tablet 900px (840-1023px) and desktop 1440px (1024px and up). A prototype has a layout for each of the four. The report of the change names the four widths and what each showed; a width not checked is reported as skipped. `inspect.mjs` labels 700px and 900px both `tablet`, so run it once for each of those widths into its own folder (`--widths 700 --out …/shots-700`).
- **Ask before:** a push of a verified change to `main` needs no question here; it deploys nothing. A release (`npm run release`, then `git push --follow-tags`) is a deploy to GitHub Pages and also needs no question when the user asks for it (the user's answer of 2026-10-12). "Verified" means `npm test` passes and a UI change was checked in a browser at the four breakpoints. A force-push still needs a yes.
- **Specification:** a change of behaviour changes its rule in `docs/spec/` in the same commit as the code; a new rule gets the next identifier of its prefix. `.githooks/pre-commit` stops a commit of `src/`, `sw.js`, `index.html` or `manifest.webmanifest` with no staged change of `docs/spec/`. Use `git commit --no-verify` only for a commit that changes no rule, and say so in its body. `tests/spec.test.js` checks the facts of the specification against the code.
