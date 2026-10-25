# Product

## Purpose

Bodega is a shopping list for one person on one Android phone. It works in the shop with no
connection. It keeps one list, `Compra`, for the trip. At the end of a trip it keeps
the products that the user buys each time and the products not bought, so that the list for the
next trip is almost ready.

## User and device

- **PROD-1** One owner for each account, with one device or more (ACC-1,
  [18-account-sync.md](18-account-sync.md)). The owner can share the data of the account with
  other people by email (SHARE-1, [19-sharing.md](19-sharing.md)).
- **PROD-2** The target is Chrome on Android, with the app installed on the home screen. The app
  also works in a desktop browser with a mouse.
- **PROD-3** The layout is for a phone in portrait. The manifest locks the installed app to
  portrait.

## Constraints

- **PROD-4** The data lives on the device first, in the `localStorage` of the origin. It then syncs to
  the account of the user (SYNC-1). A device with no session sends nothing.
- **PROD-5** The network requests are the static files of the same origin and the API of the
  account, at `https://artisandevs.duckdns.org` (ACC-12).
- **PROD-6** Each function works with no connection after the first load, except the check of the
  deployed version and the update.
- **PROD-7** The app is plain HTML, CSS and ES modules. It has no build step and no dependency, at
  run time or for development.
- **PROD-8** All URLs are relative, so the app works below a subpath of its host. The one absolute
  URL is the API (ACC-12).
- **PROD-9** A destructive action has no confirmation. `Deshacer` restores the state for 5 seconds
  instead. The import of a backup is the exception: it asks first, and it also has `Deshacer`.
  A state that the sync puts in place (SYNC-4) removes the message and its `Deshacer`: the old
  state would undo the change of the other device and send that as a change of the user.

## Functions

| Function | Document |
|---|---|
| The list `Compra` and the trip cycle | [03-lists.md](03-lists.md) |
| Add with search, with no duplicate | [03-lists.md](03-lists.md) |
| Search in `Compra` | [03-lists.md](03-lists.md) |
| Order by name or custom, with a manual move | [04-arrange.md](04-arrange.md) |
| Groups by recipe or by shop | [04-arrange.md](04-arrange.md) |
| Shops of an item | [05-shops.md](05-shops.md) |
| A list for each shop, in `Compra` | [05-shops.md](05-shops.md) |
| Recipes that send their products to `Compra` | [06-recipes.md](06-recipes.md) |
| A menu of the week that fills `Compra` | [13-menu.md](13-menu.md) |
| Backup to a file and from a file | [08-storage.md](08-storage.md) |
| Seven languages | [09-languages.md](09-languages.md) |
| Walkthrough at the first start | [07-screen.md](07-screen.md) |
| Offline use, version and update | [10-offline-version.md](10-offline-version.md) |
| Reminder at the shop | [11-integrations.md](11-integrations.md) |
| Account and sync between devices | [18-account-sync.md](18-account-sync.md) |
| Share the list with other people by email | [19-sharing.md](19-sharing.md) |

## Not in the product

These are decisions, not gaps.

- Quantities, units, prices, categories, notes and photos of an item.
- More than one list for the trip, a list for a later trip, and a history of past trips.
- Google Tasks as a shared list: it was rejected for the share of SHARE-1.
- Geolocation in the app and system notifications.
- Steps, quantities and photos of a recipe.
- A screen of shops, a rename of a shop for all its items.
- Right-to-left languages.

Each feature document lists the limits of its own area.
