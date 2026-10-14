# Specification

This is the specification of the app as it is on `main`. It states
what the app does, not how the work was planned. The code and its tests are the authority: when a
rule here and the code differ, one of the two has a defect.

The names of the screen are the Spanish ones, because `src/locales/es.js` is the source wording.

## Documents

| Document | Content |
|---|---|
| [01-product.md](01-product.md) | Purpose, user, constraints, what the app does not do |
| [02-data-model.md](02-data-model.md) | The state, its records and its invariants |
| [03-lists.md](03-lists.md) | Items, the two lists, the trip cycle, the add sheet |
| [04-arrange.md](04-arrange.md) | Order, groups and the manual move of a row |
| [05-shops.md](05-shops.md) | The shops of an item and the list by shop |
| [06-recipes.md](06-recipes.md) | Recipes, the send to `Actual`, the search |
| [07-screen.md](07-screen.md) | Sections, header, gestures, sheets, messages and undo, the walkthrough |
| [08-storage.md](08-storage.md) | The stored format, validation, migration, backup |
| [09-languages.md](09-languages.md) | The seven languages and the rules of the text |
| [10-offline-version.md](10-offline-version.md) | Service worker, version, deploy, installation |
| [11-integrations.md](11-integrations.md) | The reminder at the shop and the voice commands |
| [12-engineering.md](12-engineering.md) | Modules, code rules, tests and checks |
| [13-menu.md](13-menu.md) | The menu of the week and the fill of `Actual` |
| [14-modules.md](14-modules.md) | The modules that `Ajustes` turns off |
| [15-design-system.md](15-design-system.md) | Layers, tokens, components, icons and the catalogue |

## Rule identifiers

Each rule has an identifier, a prefix and a number, such as `LIST-7`. An identifier is stable: a
rule that goes away keeps its number, marked as removed, and a new rule gets the next number. Use
the identifier in a commit body or in a test name to point at a rule.

| Prefix | Document |
|---|---|
| `PROD` | 01-product |
| `DATA` | 02-data-model |
| `LIST`, `TRIP`, `ADD` | 03-lists |
| `SORT`, `GROUP`, `MOVE` | 04-arrange |
| `SHOP` | 05-shops |
| `REC` | 06-recipes |
| `NAV`, `ROW`, `MSG`, `A11Y`, `ONB` | 07-screen |
| `STORE`, `BACKUP` | 08-storage |
| `LANG` | 09-languages |
| `SW`, `VER` | 10-offline-version |
| `ARR`, `VOICE` | 11-integrations |
| `ENG` | 12-engineering |
| `MENU` | 13-menu |
| `MOD` | 14-modules |
| `DS` | 15-design-system |

## Words

| Word | Meaning |
|---|---|
| Item | A product to buy. One record, in one of the two lists |
| `Actual` | The list of the current trip. List id `active` |
| `Próxima` | The list of the next trip. List id `next` |
| Trip | The time from one **Terminar compra** to the next |
| Ticked | An item of `Actual` with `bought: true` |
| Recurrent | An item that comes back at each trip |
| One-time | An item that is not recurrent |
| `Próxima` view | The items that `Próxima` shows: the items of the list, and the ticked items of `Actual` that come back |
| Recipe | A name and a list of product names |
| Product | A name in a recipe. It is text, not an item |
| Shop | A name that one item or more have. It has no record of its own |
| Section | One of the five screens of the bottom bar |
| Meal | The lunch or the dinner of one day of the menu |
| Sheet | A panel that comes up from the bottom of the screen |
| Message | An error or a notice as `{ key, params }`, which the screen turns into text |

## Upkeep

A change of behaviour changes the rule here in the same commit as the code. A new feature adds its
rules to the document of its area, or adds a document and a row in the tables above.

`tests/spec.test.js` and `.githooks/pre-commit` enforce this; see the rules ENG-12 to ENG-15 in
[12-engineering.md](12-engineering.md).
