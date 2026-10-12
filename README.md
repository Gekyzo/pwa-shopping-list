# Shopping

An offline shopping list PWA for one phone. Plain HTML, CSS and ES modules. No build step and no
dependencies. The data stays in the `localStorage` of the browser.

## How it works

The user interface is in Spanish. A bottom menu has four screens.

- **Actual** is the list for the current trip. Tap an item to tick it. A ticked item moves to
  a collapsed section at the end of the list (`N comprados`); tap that row to open it. The header shows
  the progress of the trip.
- **Próxima** is the list for the next trip.
  - A ticked item marked `↻ siempre` (recurrent) shows in **Próxima** automatically.
  - A ticked one-time item goes to **Próxima** only when you tap `+ Próxima`.
  - You can also add items to **Próxima** directly. Such an item is recurrent by default.
- **Recetas** holds recipes. A recipe is a name and a list of products.
  - The `+` button creates a recipe. Tap a recipe to open it, then add and remove its products.
  - `⋯` → **Añadir enlace** stores an optional web address of the recipe. The recipe row then
    shows a chain symbol, which opens the page in the browser.
  - **A la lista** puts the products of the recipe in **Actual**. A product that is in the lists
    already is used again: no duplicate is made. A product that is new becomes a one-time item.
  - **Actual** then shows its items in groups, one for each recipe sent in this trip, and **Otros**
    for the rest. An item of two recipes shows in the two groups; one tick takes it out of both.
    **Terminar compra** ends the groups. **Agrupar por → Nada**, at the top of the list, shows one
    flat list.
  - A recipe and an item are independent. A rename of one does not change the other.
- **Ajustes** has **Terminar compra**, **Exportar copia** and **Importar copia**. The backup holds
  the items and the recipes.

**Terminar compra** ends the trip. It also shows as a banner in **Actual** when all items are ticked.

- ticked items that are in **Próxima** go back to **Actual**, not ticked
- other ticked items are deleted
- items that are not ticked stay in **Actual**
- items added to **Próxima** move to **Actual**

The `+` button opens the add sheet. The sheet is a search and an add in one. While you type, the items
that exist already show below the field. Tap one, or press **Añadir** with the same name, and the
existing item goes to the target list (**Para hoy** or **Para la próxima**). A new item is created only
when no item has that name, without case distinction.

Tap `⋯` on a row for **Renombrar**, **Comprar siempre** / **Solo una vez**, the move to the other list
and **Eliminar**. `Deshacer` shows for 5 seconds after a delete, a move, **Terminar compra** and
**A la lista**.

## Develop

```sh
npm test         # unit tests (node:test), Node 20 or later
npm run serve    # http://localhost:8080
npm run icons    # write the PNG icons again after a change in scripts/make-icons.mjs
```

| Path | Purpose |
|---|---|
| `src/store.js` | Pure state functions. No DOM and no storage |
| `src/recipes.js` | Pure recipe functions. No DOM and no storage |
| `src/storage.js` | Load, save, export and import, with validation |
| `src/app.js` | Render and event handling |
| `sw.js` | Service worker: precache of the app shell, then stale-while-revalidate |
| `manifest.webmanifest`, `icons/` | Installation data |

When you add a file that the app loads, add it to `SHELL` in `sw.js`.

## Deploy

The app is a static site. Each host that serves the repository root over HTTPS is sufficient. All URLs
are relative, thus the app also works below a subpath such as `https://gekyzo.github.io/shopping-list/`.

GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**.

An update shows at the second start of the app after a deploy. The first start downloads the new files
in the background.

## Install on Android

1. Open the site URL in Chrome.
2. Open the Chrome menu and tap **Add to Home screen → Install**.
3. Start the app from the home screen. It works without a network connection.

The data is in the storage of the installed app. **Clear site data** in Chrome and the uninstall of the
app delete the lists. Export a backup before you do that.
