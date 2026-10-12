# Arrival toast — implementation plan

**Spec:** `docs/superpowers/specs/2026-10-12-arrival-toast-design.md`

## Files

| File | Change |
|---|---|
| `src/store.js` | New view `arrivalMessage` |
| `tests/store.test.js` | Tests of `arrivalMessage` |
| `src/app.js` | `showToast` option `ms`; the `?arrival` start |
| `README.md` | The URL and the automation setup |

## Steps

Per `WORKFLOW.md`: commit this plan with its companion and the spec, then
`plan-current.sh start`, and `task N start` / `task N land` for each task. One commit for each
task. No push unless the user asks.

### Task 1: Arrival message

1. `tests/store.test.js`, failing: the text for several items left, the singular text for one,
   `null` when all items are ticked, `null` for an empty state; items of `Próxima` do not count.
2. `npm test`: fails, `arrivalMessage` is not exported.
3. `src/store.js`. `npm test`: passes. Commit.

### Task 2: Toast at an arrival start

1. `src/app.js` and `README.md` as in the spec.
2. `npm test`.
3. Browser check (below). Commit.

## Verification

- `npm test`: all tests pass.
- `npm run serve`, `agent-browser` at 390 × 844.
  1. `/?arrival` with items left in `Actual`: the toast shows the count, without `Deshacer`. The
     address has no query after the load.
  2. `/` shows no toast.
  3. `/?arrival` with all items ticked, and with an empty `Actual`: no toast.
  4. Stop the server, open `/?arrival`: the app loads offline and shows the toast.
