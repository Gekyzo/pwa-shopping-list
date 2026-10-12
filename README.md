# Shopping

An offline shopping list PWA for one phone. Plain HTML, CSS and ES modules. No build step and no
dependencies. The data stays in the `localStorage` of the browser.

## How it works

The app has two lists.

- **Active** is the list for the current trip. Tick an item when you buy it. A ticked item stays in the
  list, crossed out.
- **Next** is the list for the next trip.
  - A ticked recurrent item (`↻`) shows in **Next** automatically.
  - A ticked one-time item goes to **Next** only when you tap `+ Next`.
  - You can also add items to **Next** directly. Such an item is recurrent by default.
- **Start new shopping** ends the trip:
  - ticked items that are in **Next** go back to **Active**, not ticked
  - other ticked items are deleted
  - items that are not ticked stay in **Active**
  - items added to **Next** move to **Active**

Other actions:

- Tap a name to rename the item.
- Tap `↻` to make an item recurrent or one-time.
- Tap `⋯` to move an item to the other list or to delete it.
- `Undo` shows for 5 seconds after a delete, a move and **Start new shopping**.
- `⋮` → **Export backup** downloads the lists as a JSON file. **Import backup** replaces the lists with
  such a file.

A name is unique across the two lists, without case distinction.

## Develop

```sh
npm test         # unit tests (node:test), Node 20 or later
npm run serve    # http://localhost:8080
npm run icons    # write the PNG icons again after a change in scripts/make-icons.mjs
```

| Path | Purpose |
|---|---|
| `src/store.js` | Pure state functions. No DOM and no storage |
| `src/storage.js` | Load, save, export and import, with validation |
| `src/app.js` | Render and event handling |
| `sw.js` | Service worker: precache of the app shell, then stale-while-revalidate |
| `manifest.webmanifest`, `icons/` | Installation data |

When you add a file that the app loads, add it to `SHELL` in `sw.js`.

## Deploy

The app is a static site. Each host that serves the repository root over HTTPS is sufficient. All URLs
are relative, thus the app also works below a subpath such as `https://<user>.github.io/shopping/`.

GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**.

An update shows at the second start of the app after a deploy. The first start downloads the new files
in the background.

## Install on Android

1. Open the site URL in Chrome.
2. Open the Chrome menu and tap **Add to Home screen → Install**.
3. Start the app from the home screen. It works without a network connection.

The data is in the storage of the installed app. **Clear site data** in Chrome and the uninstall of the
app delete the lists. Export a backup before you do that.
