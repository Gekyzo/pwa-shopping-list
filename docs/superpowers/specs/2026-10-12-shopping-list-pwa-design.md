# Shopping list PWA — design

## Context

`~/code/personal/shopping` is empty. The goal is a shopping list app that is installed on one Android
phone and works offline in the store. One user, one device, no backend, no account.

Decisions taken in the brainstorm:

| Topic | Decision |
|---|---|
| List flow | Automatic cycle between an `Active` list and a `Next` list |
| Check-off | A ticked item is never deleted by the tick. It stays crossed out in `Active` until `Start new shopping` |
| Buy again | A ticked recurrent item shows in `Next` automatically. A ticked one-time item has a `+ Next` action |
| Item data | `name` and a `recurrent` flag only |
| Stack | Plain HTML, CSS and ES modules. No build step, no dependencies |
| Delivery | Static HTTPS host (GitHub Pages). Data stays on the phone |

## Behaviour

- **Tabs:** `Active` and `Next`. An input at the bottom adds an item to the tab that is open.
- **Create:** an item added in `Active` is one-time by default. An item added in `Next` is recurrent by default.
- **Read:** insertion order. In `Active`, bought items go below the items that are not bought.
- **Update:** tap the name to rename in place. Tap `↻` to toggle `recurrent`. A row action moves the item to the other list.
- **Delete:** a row action deletes the item. No confirmation; a 5-second `Undo` message restores it.
- **Tick:** only in `Active`. It toggles `bought`. The item stays in `Active`, crossed out. `Next` has no checkboxes.
- **Buy again:** a ticked one-time item has a `+ Next` toggle that sets `again`. A ticked recurrent item
  needs no action.
- **`Next` view** shows two groups, and each item is one record only:
  - items with `list: 'next'`
  - ticked `Active` items that are `recurrent` or `again`, with a `bought` mark
- **Remove from `Next`:** for an item with `list: 'next'` this is the delete action. For a ticked `Active`
  item it clears `again` and `recurrent`; the item stays ticked in `Active`.
- **Unticking** an item also removes it from the `Next` view. `again` is reset.
- **Start new shopping** (header button, enabled when the `Next` view has items or `Active` has ticked items):
  - ticked + (`recurrent` or `again`) → stays in `Active`, `bought` and `again` are reset
  - ticked one-time without `again` → deleted
  - not ticked → stays in `Active`
  - `list: 'next'` → moves to `Active`
  - a 5-second `Undo` message restores the state from before the action
- **Search and add:** the add field has the placeholder `Add item to list`. While the user types, up
  to 5 existing items whose name contains the text show above the field, from the two lists, without
  case or accent distinction. A tap on one, or a submit of a name that exists, calls `bringToList`
  in place of a create: in `Active` an item from `Next` moves there and a ticked item becomes not ticked;
  in `Next` a ticked one-time item gets `again` and an item that is not ticked moves there.
- **Names:** trimmed. An empty name is rejected. A name is unique across the two lists, without case
  distinction. A duplicate is rejected and the message says in which list the item is.
- **Backup:** a menu with `Export` (downloads a JSON file) and `Import` (replaces the state after a confirmation).
- **UI language:** English.

## Layout (design E, 2026-10-12)

This section replaces the tabs, the header button, the `⋮` menu and the bottom add field of the
first version. The rules above do not change. The mock-up is `designs/e-combinada.html` (a local file, not committed).

- **Header summary:** a progress ring, a title and one line of text for the open screen
  (`tripSummary` in `src/store.js` gives the figures).
- **Bottom menu:** `Actual`, `Próxima` with a count, `Ajustes`.
- **Rows:** a recurrent item shows the pill `↻ siempre`. The `⋯` button opens labelled actions:
  rename, recurrent toggle, move, delete. A tap on the name in `Actual` ticks the item.
- **Bought section:** in `Actual`, the ticked items are below one row, `N comprados`, that is
  closed at each start of the app. A tick shows an `Undo` message for 5 seconds.
- **Add:** a `+` button opens a bottom sheet with the search-and-add field and a choice of the
  target list. The sheet stays open after an add.
- **End of trip:** `Terminar compra` calls `startNewShopping`. It shows as a banner in `Actual`
  when all items are ticked, and in `Ajustes`. An empty `Actual` list offers to bring the items
  of `Próxima`.
- **Ajustes:** `Terminar compra`, export and import.

## Data model

One `localStorage` key, `shopping.v1`:

```js
{ version: 1, items: [{ id, name, recurrent, list: 'active' | 'next', bought, again }] }
```

`id` comes from `crypto.randomUUID()`. `bought` and `again` are always `false` for an item in `next`.
`again` is `true` only while `bought` is `true`.

## Files

| File | Purpose |
|---|---|
| `index.html` | App shell: tabs, list container, add form, menu |
| `styles.css` | Mobile-first layout, 48 px touch targets, light and dark through `prefers-color-scheme` |
| `src/store.js` | Pure state functions. No DOM, no storage. Each one returns a new state |
| `src/storage.js` | `load`, `save`, `exportJson`, `importJson`, validation. The storage object is injected |
| `src/app.js` | Render and event handling. Calls `store.js`, then `save`, then renders again |
| `sw.js` | Service worker |
| `manifest.webmanifest` | `name`, `display: standalone`, `start_url: "./"`, `scope: "./"`, colours, icons |
| `icons/` | `icon.svg` source, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` |
| `tests/store.test.js`, `tests/storage.test.js` | `node:test` unit tests |
| `package.json` | `"type": "module"`, scripts `test` (`node --test`) and `serve` (`python3 -m http.server 8080`) |
| `README.md` | Use, test, deploy and install steps |
| `docs/superpowers/specs/2026-10-12-shopping-list-pwa-design.md` | The design above as the spec |

`store.js` exports: `addItem`, `renameItem`, `toggleRecurrent`, `toggleBought`, `toggleAgain`,
`deleteItem`, `moveItem`, `removeFromNext`, `startNewShopping`, `activeItems(state)`, `nextItems(state)`. A rejected operation returns
`{ state, error }` with the state unchanged.

### Points that need care

- **Subpath:** GitHub Pages serves the app at `/<repo>/`. All URLs are relative (`./sw.js`, `./src/app.js`).
  The manifest uses `start_url` and `scope` `./`.
- **Service worker:** precache the app shell on `install`. Serve same-origin `GET` requests
  stale-while-revalidate: answer from the cache at once and refresh the cache in the background. An
  update then shows at the second open after a deploy, and no cache version needs a manual change.
- **Data safety:** call `navigator.storage.persist()` at startup. `load` falls back to an empty state when
  the key is absent or the JSON is invalid, and keeps the invalid text under `shopping.v1.corrupt`.
- **Import:** validate the shape and the `version` before the state is replaced. Reject an invalid file
  with a message.
- **Icons:** Android needs PNG icons of 192 px and 512 px for installation. Write `icon.svg`, convert it
  one time with the tool that is installed (`rsvg-convert`, `magick` or `inkscape`) and commit the PNG files.
- **Rendering:** build rows with `textContent`, never `innerHTML`, so that an item name cannot inject markup.

## Verification

- `npm test`: all `node:test` tests pass.
- `npm run serve`, then drive `http://localhost:8080` with the `agent-browser` skill at a phone viewport:
  1. Add `Bread` and `Batteries` in `Active` and `Milk` in `Next`. Reload: the three items are still there.
  2. `Start new shopping`: `Milk` is in `Active`, `Next` is empty.
  3. Tick `Milk` and `Batteries`: the two stay in `Active`, crossed out. `Next` shows `Milk` only.
     Tap `+ Next` on `Batteries`: `Next` shows the two. Tap it again: `Next` shows `Milk` only.
  4. `Start new shopping`: `Batteries` is deleted, `Milk` and `Bread` are in `Active` and not ticked.
     `Undo` restores step 3.
  5. Rename, toggle `↻`, move, delete and `Undo` each work.
  6. Add `milk` again: the duplicate is rejected.
  7. Export, clear the storage, import: the state is restored.
- Offline: after one load, set the browser offline and reload. The app opens and edits persist.
- Chrome DevTools → Application → Manifest reports no installability error.
- On the phone, after the deploy: open the Pages URL in Chrome, `Install app`, enable airplane mode, open
  the app from the home screen and run flow 1 to 4.
