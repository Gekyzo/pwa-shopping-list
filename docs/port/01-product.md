# Product

What the product is, for whom, and its limits. Source: `manifest.webmanifest`, `src/app.js`,
`src/ui/context.js`, `src/ui/settings.js`. The rules of each function are in its own document.

## Purpose

Bodega is a shopping list for one person on one Android phone. It works in the shop with no
connection. It keeps one list, `Compra` (`list.active`), for the trip. At the end of a trip it
keeps the products that the user buys each time and the products not bought, so that the list
for the next trip is almost ready.

## User and device

**PROD-1** [core] [untested] One user and one device. There is no account, no login and no sharing of a list.
- Evidence: no account or sync code in `src/`; the only `fetch` is the version check (`src/ui/settings.js:68-87`); test: untested.

**PROD-2** [adapted] [untested] The target is one Android phone, with the app installed on the home screen. The web app also works in a desktop browser with a mouse.
- Evidence: `manifest.webmanifest` (`display: standalone`); test: untested.
- Target: a native Android app installed from an APK or Play Store. Desktop and mouse use is out of scope (Q-data-12).

**PROD-3** [adapted] [stale] The layout is for a phone in portrait. The installed app turns with the device; it is not locked to portrait.
- Spec text: "The manifest locks the installed app to portrait." Code: `"orientation": "any"` (`manifest.webmanifest:10`), since commit `c7517f3` "Turn the installed app with the device"; it agrees with INS-4.
- Evidence: `manifest.webmanifest:10`; test: `tests/spec.test.js` "the installed app turns with the device (INS-4)".
- Target: the activity follows the device rotation (no `screenOrientation` lock); the layout is designed for portrait.

## Constraints

**PROD-4** [adapted] [verified] All data stays on the phone. The app sends no data to a server.
- Evidence: `src/storage.js:182-202` (only `localStorage`); `src/ui/settings.js:160-162` (export is a local download); test: `tests/storage.test.js` "save then load returns the same state".
- Target: app-private storage (DataStore or Room, see `data-contract.md` section 8). No network permission is needed for data.

**PROD-5** [adapted] [untested] The only network requests are the static files of the same origin. A recipe link opens in the browser by a user action; it is not a request of the app.
- Evidence: `src/ui/settings.js:81` (`version.json`), `sw.js`; test: untested.
- Target: the app makes no network request. A recipe link opens with an `ACTION_VIEW` intent.

**PROD-6** [adapted] [untested] Each function works with no connection after the first load, except the check of the deployed version and the update.
- Evidence: `sw.js` (shell cache), `src/ui/settings.js:78-87`; test: untested here (see 10-offline-version).
- Target: every function works offline from the install. The version check and update go to the store (see 10-offline-version).

**PROD-7** [dropped] [untested] The app is plain HTML, CSS and ES modules. It has no build step and no dependency.
- Evidence: `package.json` (no `dependencies`, no `devDependencies`), `index.html:412` import map; test: untested (`tests/vendor.test.js` and `tests/aliases.test.js` check the vendored files and the import map, not the absence of a dependency or a build step).
- Reason: a property of the web build. Replacement: a Kotlin and Jetpack Compose Gradle project.

**PROD-8** [dropped] [untested] All URLs are relative, so the app works below a subpath of its host.
- Evidence: `manifest.webmanifest` (`start_url: ./`, `scope: ./`); test: untested.
- Reason: static-host deploy. Replacement: nothing.

**PROD-9** [adapted] [stale] A destructive action has no confirmation. `Deshacer` restores the state for 5000 ms instead. Two actions ask first: the import of a backup, which also has `Deshacer`, and **Borrar todos los datos**, which has no `Deshacer`.
- Spec text: "The import of a backup is the exception." Code: the reset also asks with `window.confirm(t('reset.confirm'))` (`src/ui/settings.js:173`), as BACKUP-7 says.
- Evidence: `src/ui/context.js:26` (`UNDO_MS = 5000`), `src/ui/context.js:214-225`, `src/ui/settings.js:173,223`; test: untested (UI).
- Target: a Snackbar with the action `Deshacer` for 5000 ms; the two confirmations are dialogs.

## Functions

| Function | Document |
|---|---|
| The list `Compra` and the trip cycle | [03-lists.md](03-lists.md) |
| Add with search, with no duplicate | [03-lists.md](03-lists.md) |
| Search in `Compra` | [03-lists.md](03-lists.md) |
| Order by name or custom, with a manual move | [04-arrange.md](04-arrange.md) |
| Groups by recipe, by shop or by aisle | [04-arrange.md](04-arrange.md) |
| Shops of an item | [05-shops.md](05-shops.md) |
| A list for each shop, in `Compra` | [05-shops.md](05-shops.md) |
| Recipes that send their products to `Compra` | [06-recipes.md](06-recipes.md) |
| A menu of the week that fills `Compra` | [13-menu.md](13-menu.md) |
| Aisles (sections of the store) | [17-aisles.md](17-aisles.md) |
| Backup to a file and from a file | [08-storage.md](08-storage.md) |
| Seven languages (`ca`, `de`, `en`, `es`, `fr`, `it`, `pt`) | [09-languages.md](09-languages.md) |
| Walkthrough at the first start | [07-screen.md](07-screen.md) |
| Offline use, version and update | [10-offline-version.md](10-offline-version.md) |
| Reminder at the shop (`?arrival`) | [11-integrations.md](11-integrations.md) |

The aisle grouping and the aisles document are not in the table of `docs/spec/01-product.md`
(finding).

## Not in the product

These are decisions, not gaps. The spec list holds two entries that the code contradicts:

- An item has a free-text quantity (`quantity`, `src/store.js:46-52`). The spec says
  "Quantities … of an item" are not in the product (finding). Units, prices, notes and photos
  stay out.
- An item has one aisle (`aisle`, 17-aisles). The spec says "categories" are not in the product;
  an aisle is a section of the store, used as a category of the item (finding).

The rest holds in the code:

- More than one list for the trip, a list for a later trip, and a history of past trips.
- A sync between devices, an account, a shared list.
- Geolocation in the app and system notifications. The arrival reminder comes from an
  automation of the phone that opens `?arrival` (`src/app.js:283-288`).
- Steps, quantities and photos of a recipe.
- A screen of shops, a rename of a shop for all its items.
- Right-to-left languages.
