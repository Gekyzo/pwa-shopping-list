# Swipe actions on item rows — implementation plan

**Spec:** `docs/superpowers/specs/2026-10-12-shopping-list-pwa-design.md`, section `Layout`

## Context

An item row shows a `⋯` button that opens a strip of buttons below the row: `Renombrar`,
`Comprar siempre` / `Solo una vez`, `A Próxima` / `A Actual`, `Eliminar`. The user wants these
actions in a side menu that a slide of the row to the left or to the right shows.

Decisions from the user:

| Topic | Decision |
|---|---|
| Sides | Slide right shows `Renombrar` and `Comprar siempre`. Slide left shows `A Próxima` and `Eliminar` |
| `⋯` button | Removed from the item rows. The actions are reached only by the slide |
| Scope | Item rows of `Actual` and `Próxima`. Recipe rows keep their `⋯` |

Known cost of the second decision: a keyboard or a screen reader cannot reach the four actions.
A mouse can drag the row, because the gesture uses pointer events.

## Design

**Row structure** (`itemNode` in `src/app.js`): the `li.item` holds a `.swipe` box (`position:
relative; overflow: hidden`). In it, two `.side` strips sit behind the row, one at each edge, and
the `.row` slides over them with `transform: translateX()`.

```
li.item
└─ div.swipe
   ├─ div.side.start   Renombrar · Comprar siempre      (shows on a slide right)
   ├─ div.side.end     A Próxima · Eliminar (red)       (shows on a slide left)
   └─ div.row          checkbox · name · pill
```

**Actions for each row kind.** `activeRow` and `nextRow` return `{ row, start, end }` in place of
`{ row, actions }`, built from the existing `renameAction`, `recurrentAction`, `moveAction`,
`deleteAction`:

| Row | `start` (slide right) | `end` (slide left) |
|---|---|---|
| `Actual` | Renombrar, Comprar siempre / Solo una vez | A Próxima, Eliminar |
| `Próxima`, pending | Renombrar, Comprar siempre / Solo una vez | A Actual, Eliminar |
| `Próxima`, bought today | Renombrar | Quitar de Próxima |

**State.** `ui.openSide` (`'start'` / `'end'` / `null`) joins `ui.openId` and `ui.openGroup`, so the
open row is rendered from the state as today, and a shared item opens in one group only. A tap on
an action runs it and closes the row (the actions already call `apply` or `render`). A
`pointerdown` out of the open row closes it.

**Gesture** (`bindSwipe(row, sides, item, groupId)` in `src/app.js`, pointer events):

- `touch-action: pan-y` on `.row`: the browser keeps the vertical scroll and gives the horizontal
  move to the page.
- `pointerdown` stores the start point. `pointermove` starts a drag when the move is more than
  10 px and more horizontal than vertical; then the row follows the finger, clamped to the width
  of the side it shows. A side with no action does not open.
- `pointerup` asks the pure function for the result, writes `ui`, and renders. The open position
  is a CSS class (`open-start` / `open-end`) with a short `transition`.
- A drag suppresses the `click` that follows it, so a slide never ticks the item.

**Pure rule, with tests** — new module `src/swipe.js`, no DOM:

```js
// The side that stays open after a drag of `dx` px that started with `open` showing.
settle(dx, { start, end }, open) → 'start' | 'end' | null
```

- A drag of more than 40 % of the side width (40 px at least) opens that side.
- A drag back over the same limit closes an open side. A shorter drag keeps what was open.
- A side of width 0 never opens.

`CANONICAL.md` says that only `src/app.js` touches the DOM. The rule goes into a pure module so
that it has unit tests; the event binding stays in `src/app.js`.

**Removed:** `moreButton` on item rows and the `.actions` strip below an item. `moreButton`,
`.more` and `.actions` stay for the recipe rows.

**Styles** (`styles.css`): `.swipe`, `.side`, `.side button` (min 72 px wide, full row height,
`Eliminar` on the `--danger` colour), `.row` background `var(--surface)` so it covers the sides,
the transition, and the open classes. The row keeps its 56 px height.

**Out of scope:** a full slide that runs an action, the same menu on recipe rows, a hint that
teaches the gesture, access to the actions from the keyboard.

## Files

| File | Change |
|---|---|
| `src/swipe.js` | New. `settle` |
| `tests/swipe.test.js` | New |
| `src/app.js` | `itemNode`, `activeRow`, `nextRow`, `bindSwipe`, `ui.openSide`, close on outside tap |
| `styles.css` | swipe box, sides, open classes |
| `sw.js` | `./src/swipe.js` in `SHELL` |
| `docs/superpowers/specs/2026-10-12-shopping-list-pwa-design.md` | `Layout`: rows and their actions |
| `README.md`, `.claude/conventions/ARCHITECTURE.md` | how to reach the actions; the new module |

## Steps

Per `WORKFLOW.md`: commit this plan with its companion and the spec change, then
`plan-current.sh start`, and `task N start` / `task N land` for each task. One commit for each
task. No push unless the user asks.

### Task 1: Swipe rule

1. `tests/swipe.test.js`, failing: opens `end` on a long drag left and `start` on a long drag
   right; a short drag opens nothing; a side of width 0 does not open; with a side open, a drag
   back closes it and a short drag keeps it; a long drag across from one side opens the other.
2. `npm test`: fails with "Cannot find module".
3. `src/swipe.js`. `npm test`: passes. Commit.

### Task 2: Rows with side menus

1. `src/app.js`, `styles.css`, `sw.js`, docs as in the design.
2. `npm test`.
3. Browser check (below). Commit.

## Verification

- `npm test`: all tests pass.
- `http://localhost:8080` (server already running), `agent-browser` at 390 × 844 (`PATH` needs
  `/home/ciro/.nvm/versions/node/v24.11.1/bin`). Slides are synthetic `PointerEvent`s sent with
  `eval`; one check also uses the tool's real mouse drag.
  1. No `⋯` on item rows. Recipe rows still have it.
  2. Slide right on a row of `Actual`: `Renombrar` and `Comprar siempre` show. `Renombrar` opens
     the rename field; `Comprar siempre` adds the `↻ siempre` pill. The row closes after each.
  3. Slide left: `A Próxima` and `Eliminar` show. Each one works and offers `Deshacer`.
  4. A slide does not tick the item. A plain tap still ticks it.
  5. A short slide opens nothing. A vertical drag scrolls and opens nothing.
  6. A tap out of the open row closes it. Opening a second row closes the first.
  7. `Próxima`: a pending row has the same two sides with `A Actual`; a "bought today" row has
     `Renombrar` on one side and `Quitar de Próxima` on the other.
  8. Grouped `Actual`: a slide on `Huevos` in one group opens that copy only.
  9. Screenshots of an open row, each side, light scheme; look at them.
  10. Stop the server, reload: the app works offline. Start the server again.
