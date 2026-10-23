# Port specification

This spec set lets a native Android app in Kotlin with Jetpack Compose reach behaviour parity with
the PWA, without reading the PWA's code. Scope: the whole app.

- **Source:** `main` at `296a2ec` (version 1.3.3). The rules were read at `45dabc4`…`f822a77`. The
  commits after that change the aisle sheet layout (AISLE-11, updated here), the trip sheet
  buttons (CSS only) and the version.
- **Base:** `docs/spec/`. Each rule of it is here with the same identifier. `docs/spec/` is
  unchanged. Proposed changes to it are in [spec-findings.md](spec-findings.md).
- **Authority:** the code and its tests. Where `docs/spec/` and the code differ, the rule here
  states what the code does and is tagged `stale`.
- **Mechanisms only.** No target code. A `Target:` line names the Android mechanism; a choice
  between mechanisms is an entry of [open-questions.md](open-questions.md).

## Legend

A rule is `**ID** [class] [status]`, then a sentence, then its evidence.

| Class | Meaning |
|---|---|
| `core` | Platform-neutral domain logic. Ports one to one; its tests port as JVM unit tests. |
| `adapted` | The behaviour stays; the mechanism changes. The `Target:` line names it. |
| `dropped` | Exists only because of the web platform. The `Reason:` line gives why and what replaces it, or `nothing`. |

| Status | Meaning |
|---|---|
| `verified` | The code confirms it, and a test covers it. |
| `untested` | The code confirms it; no test covers it. |
| `stale` | `docs/spec/` says something else. The rule quotes both and follows the code. |
| `new` | Not in `docs/spec/`; found in the code. It has the next free number of its prefix. |
| `removed` | Marked removed in `docs/spec/`. Kept so the identifier is not used again. |

Evidence is `file:line` of the source repository, and the test (`tests/x.test.js` "name") or
`untested`.

## Documents

| Document | Content |
|---|---|
| [01-product.md](01-product.md) | Purpose, user, constraints |
| [02-data-model.md](02-data-model.md) | The state, its records and invariants |
| [03-lists.md](03-lists.md) | Items, `Compra`, the trip, the add sheet |
| [04-arrange.md](04-arrange.md) | Order, groups, the manual move of a row |
| [05-shops.md](05-shops.md) | The shops of an item, the list by shop |
| [06-recipes.md](06-recipes.md) | Recipes, the send to `Compra`, the search |
| [07-screen.md](07-screen.md) | Sections, header, gestures, sheets, messages, undo, walkthrough |
| [08-storage.md](08-storage.md) | Load, save, validation, migration, backup |
| [09-languages.md](09-languages.md) | The seven languages and the rules of the text |
| [10-offline-version.md](10-offline-version.md) | Service worker, version, deploy (mostly dropped) |
| [11-integrations.md](11-integrations.md) | Arrival reminder, launcher shortcuts, voice |
| [12-engineering.md](12-engineering.md) | Code rules, modules, checks |
| [13-menu.md](13-menu.md) | The menu of the week and the fill of `Compra` |
| [14-modules.md](14-modules.md) | Removed modules |
| [15-design-system.md](15-design-system.md) | Theme tokens, components, icons |
| [16-install.md](16-install.md) | The install offer (dropped) |
| [17-aisles.md](17-aisles.md) | The sections of the store, the list by aisle |
| [data-contract.md](data-contract.md) | The persisted state, migrations, sample documents, the backup file format |
| [text.md](text.md) | Every text key, plurals, parameters, run-time keys, the map to Android resources |
| [tests.md](tests.md) | Each source test → rules → port kind; rules with no test |
| [parity.md](parity.md) | One row per rule; the port is checked off here |
| [spec-findings.md](spec-findings.md) | Proposed changes to `docs/spec/` |
| [open-questions.md](open-questions.md) | Decisions for the user, with evidence and options |

## Counts

| Document | Rules | core | adapted | dropped | verified | untested | stale | new | removed |
|---|---|---|---|---|---|---|---|---|---|
| [01-product.md](01-product.md) | 9 | 1 | 6 | 2 | 1 | 6 | 2 | 0 | 0 |
| [02-data-model.md](02-data-model.md) | 23 | 22 | 0 | 1 | 13 | 1 | 0 | 8 | 1 |
| [03-lists.md](03-lists.md) | 57 | 26 | 21 | 10 | 30 | 14 | 0 | 3 | 10 |
| [04-arrange.md](04-arrange.md) | 45 | 28 | 17 | 0 | 22 | 18 | 2 | 3 | 0 |
| [05-shops.md](05-shops.md) | 30 | 11 | 19 | 0 | 17 | 10 | 0 | 3 | 0 |
| [06-recipes.md](06-recipes.md) | 39 | 18 | 21 | 0 | 15 | 19 | 3 | 2 | 0 |
| [07-screen.md](07-screen.md) | 73 | 15 | 52 | 6 | 23 | 37 | 6 | 4 | 3 |
| [08-storage.md](08-storage.md) | 26 | 11 | 13 | 2 | 9 | 9 | 0 | 8 | 0 |
| [09-languages.md](09-languages.md) | 19 | 6 | 12 | 1 | 14 | 4 | 0 | 1 | 0 |
| [10-offline-version.md](10-offline-version.md) | 31 | 2 | 13 | 16 | 11 | 18 | 1 | 1 | 0 |
| [11-integrations.md](11-integrations.md) | 19 | 9 | 10 | 0 | 5 | 5 | 8 | 1 | 0 |
| [12-engineering.md](12-engineering.md) | 17 | 3 | 13 | 1 | 9 | 8 | 0 | 0 | 0 |
| [13-menu.md](13-menu.md) | 21 | 11 | 10 | 0 | 10 | 9 | 0 | 2 | 0 |
| [14-modules.md](14-modules.md) | 9 | 0 | 0 | 9 | 0 | 0 | 0 | 0 | 9 |
| [15-design-system.md](15-design-system.md) | 24 | 0 | 18 | 6 | 5 | 2 | 0 | 16 | 1 |
| [16-install.md](16-install.md) | 4 | 0 | 1 | 3 | 4 | 0 | 0 | 0 | 0 |
| [17-aisles.md](17-aisles.md) | 20 | 9 | 11 | 0 | 10 | 8 | 0 | 2 | 0 |
| **Total** | **466** | **172** | **237** | **57** | **198** | **168** | **22** | **54** | **24** |

The total counts each rule one time. `removed` rules have the class `dropped`.

## Before the port starts

- Read the "Most blocking" table of [open-questions.md](open-questions.md).
- Decided on 2026-10-23: Q-domain-6, Q-dsv-1, Q-platform-4, Q-platform-8. The arrival reminder
  becomes an in-app geofence, which needs a place for each shop: a new field of the state.
- The VOICE rules describe the branch `voice-commands`, not `main` (Q-platform-10).
