# Shopping

An offline shopping list PWA for one phone. Plain HTML, CSS and ES modules. No build step and no
dependencies. The data stays in the `localStorage` of the browser.

## How it works

The user interface is in Spanish. A bottom menu has four screens.

- **Actual** is the list for the current trip. Tap an item to tick it. A ticked item moves to
  a collapsed section at the end of the list (`N comprados`); tap that row to open it. The header shows
  the progress of the trip.
- **Próxima** is the list for the next trip.
  - Each row ends with a repeat icon. Tap it to make the item recurrent (green) or one-time (pale).
  - A ticked recurrent item shows in **Próxima** automatically.
  - A ticked one-time item goes to **Próxima** only when you tap `+ Próxima`.
  - You can also add items to **Próxima** directly. Such an item is recurrent by default.
- **Ordenar por**, at the top of **Actual** and of **Próxima**, has **Añadido** (the order in which
  you added the items) and **Nombre** (alphabetical). One choice applies to the two lists. It shows
  when the list has two items or more.
- **Recetas** holds recipes. A recipe is a name and a list of products.
  - The field **Buscar receta o producto** filters the recipes while you type. It finds a recipe by
    its name or by one of its products, without case or accent distinction.
  - The `+` button creates a recipe. Tap a recipe to open it, then add and remove its products.
  - `⋯` → **Añadir enlace** stores an optional web address of the recipe. The recipe row then
    shows a chain symbol, which opens the page in the browser.
  - The cart button with a plus (**A la lista**) puts the products of the recipe in **Actual**. A product that is in the lists
    already is used again: no duplicate is made. A product that is new becomes a one-time item.
  - **Actual** then shows its items in groups, one for each recipe sent in this trip, and **Otros**
    for the rest. A recipe that was not sent also makes a group while all its products are in
    **Actual**. An item of two recipes shows in the two groups; one tick takes it out of both.
    **Terminar compra** ends the groups of the sent recipes. **Agrupar por → Nada**, at the top of
    the list, shows one flat list.
  - A recipe and an item are independent. A rename of one does not change the other.
- **Ajustes** has **Terminar compra**, **Exportar copia** and **Importar copia**. The backup holds
  the items and the recipes.
  - **Versión** shows the version number and the date of the version that runs. With a connection, it
    also reads the deployed version and shows **Al día** or **Versión N disponible**. **Actualizar**
    then loads the new version. Without a connection it shows **Sin conexión**.

**Terminar compra** ends the trip. It also shows as a banner in **Actual** when all items are ticked.

- ticked items that are in **Próxima** go back to **Actual**, not ticked
- other ticked items are deleted
- items that are not ticked stay in **Actual**
- items added to **Próxima** move to **Actual**

The `+` button opens the add sheet. The sheet is a search and an add in one. While you type, the items
that exist already show below the field. Tap one, or press **Añadir** with the same name, and the
existing item goes to the target list (**Para hoy** or **Para la próxima**). A new item is created only
when no item has that name, without case distinction.

Slide an item row to see its actions. A slide to the right shows **Renombrar**. A slide to the left shows the move to the other list and **Eliminar**. A tap out of the
row closes it. A recipe row has a `⋯` button for its actions. `Deshacer` shows for 5 seconds after a delete, a move, **Terminar compra** and
**A la lista**.

## Voice

The microphone button, above the `+` button, starts a conversation in Spanish. Tap it, say one
command, and the app does it and says the answer. A second tap stops the conversation.

| Say | Result |
|---|---|
| «Añade leche», «Apunta leche, pan y huevos» | Adds the items to **Actual**. An item that exists already is used again |
| «Añade café para la próxima» | Adds the item to **Próxima** |
| «¿Qué me falta por comprar?», «Lee la lista» | Says the items of **Actual** that are not ticked |
| «¿Qué hay en la próxima?» | Says the items of **Próxima** |
| «Marca el café como comprado», «Ya tengo café» | Ticks the item |
| «Desmarca el café» | Removes the tick |
| «Borra el pan» | Asks «¿Borro «Pan»?», then deletes on «sí» |
| «Termina la compra» | Says how many items go and come back, then ends the trip on «sí» |
| «Ayuda» | Says examples of commands |

- A part of a name is sufficient: «marca el café» ticks **Café molido**. When two items match, the
  app asks «¿Cuál: Café molido o Café en grano?». Answer with the name, or with «el primero».
- «No» and «cancela» end a question without a change.
- `Deshacer` shows after each change, as for a change by touch.
- The word « y » and the comma separate items. Thus «añade macarrones y queso» adds two items.

The voice uses the Web Speech API of the browser. Chrome sends the audio to a server of Google to
recognise it, so the recognition needs a connection. Without one, the app says
`El reconocimiento de voz necesita conexión.` The rest of the app works as before. The button does
not show in a browser that has no speech recognition.

The app does not answer to "Ok Google" or to Gemini: a web app cannot register a command with
them. The nearest thing is the shortcut **Hablar** of the installed app: hold the icon of the app
and tap **Hablar**, or drag it to the home screen to get a second icon. It opens the app with
`?voice` in the URL, and the app listens at once. An automation app can open the same URL:

```
https://gekyzo.github.io/shopping-list/?voice
```

## Reminder at the shop

A PWA gets a position only while it is open, so it cannot detect an arrival. An Android automation
app does that, and opens the app with `?arrival` in the URL:

```
https://gekyzo.github.io/shopping-list/?arrival
```

The app then shows `N artículos por comprar en Actual.` for 10 seconds. It shows nothing when no
item of **Actual** is left to buy.

Setup, for example with MacroDroid or Tasker:

1. Install the app from Chrome first (see below), so that Android opens the URL in the installed
   app and its data.
2. Trigger: a geofence, on entry, at the shop. Use a radius of 100 to 150 m.
3. Action: open the URL above.
4. Let the automation app run in the background: location permission **Allow all the time**, and
   no battery optimisation.

The automation app owns the place and the accuracy of the reminder. This repository holds no
coordinates.

## Develop

```sh
npm test         # unit tests (node:test), Node 20 or later
npm run serve    # http://localhost:8080
npm run icons    # write the PNG icons again after a change in scripts/make-icons.mjs
npm run hooks    # enable the git hooks of .githooks/ in this clone (one time)
```

| Path | Purpose |
|---|---|
| `src/store.js` | Pure state functions. No DOM and no storage |
| `src/recipes.js` | Pure recipe functions. No DOM and no storage |
| `src/swipe.js` | The rule that settles a row swipe. No DOM |
| `src/storage.js` | Load, save, export and import, with validation |
| `src/version.js` | Pure version rules: validation, comparison and the next version |
| `version.json` | The version of the deploy, `{ version, date }`. Written by the bump script |
| `scripts/bump-version.mjs`, `.githooks/pre-push` | The version bump before a push |
| `src/voice-commands.js` | Pure rules of the spoken commands: the text of a command to a new state and a reply |
| `src/voice.js` | Speech recognition and speech synthesis of the browser. No DOM |
| `src/app.js` | Render and event handling |
| `sw.js` | Service worker: precache of the app shell, then stale-while-revalidate |
| `manifest.webmanifest`, `icons/` | Installation data |

When you add a file that the app loads, add it to `SHELL` in `sw.js`.

## Deploy

The app is a static site. Each host that serves the repository root over HTTPS is sufficient. All URLs
are relative, thus the app also works below a subpath such as `https://gekyzo.github.io/shopping-list/`.

GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / root**.

An update shows at the second start of the app after a deploy. The first start downloads the new files
in the background. **Ajustes → Versión** shows which version runs, and **Actualizar** loads the new one
immediately.

### Version

A push to `main` is a deploy, and each deploy gets a new version. Run `npm run hooks` one time in each
clone. Then the `pre-push` hook does this at a `git push` to `main`:

1. If the push has no change of `version.json`, the hook adds one to the patch number, sets `date`,
   and makes the commit `Bump version to X.Y.Z`. `package.json` gets the same version.
2. The hook stops the push, because a hook cannot add a commit to the push that runs.
3. Run `git push` again. This push passes.

The version is a semantic version, `major.minor.patch`. For a larger step, run
`node scripts/bump-version.mjs minor` (or `major`) and commit `version.json` and `package.json`. The
hook then lets the push pass at the first try.

`git push --no-verify` skips the hook. A clone without `npm run hooks` deploys with the old version,
and then **Versión** cannot show that deploy as new.

## Install on Android

1. Open the site URL in Chrome.
2. Open the Chrome menu and tap **Add to Home screen → Install**.
3. Start the app from the home screen. It works without a network connection.

The data is in the storage of the installed app. **Clear site data** in Chrome and the uninstall of the
app delete the lists. Export a backup before you do that.
