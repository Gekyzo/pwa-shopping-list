# Changelog

The changes of the app that a user sees, by deployed version. The newest version is first. The
names of the screen are the Spanish ones, as in [`docs/spec/`](docs/spec/README.md).

A change that is not deployed goes under `Unreleased`, in the commit that makes the change. The
commit `Bump version to X.Y.Z` gives its version and its date to those changes. A version with
no change for the user has no entry.

## Unreleased

No change.

## 1.0.8 - 2026-10-13

### Changed

- The icon of the app is a bag of vegetables. It replaces the white check mark on green.

## 1.0.7 - 2026-10-13

### Added

- A search field in `Actual` and `Próxima`. It filters the items of the list, the ticked items
  included.
- A text that shows when no item matches the search.

### Changed

- The manual move of a row is off during a search.

## 1.0.6 - 2026-10-13

### Added

- Shops. An item has a sheet for its shops, and the shop field suggests the shops in use.
- The group choice `Tiendas`, which groups `Actual` or `Próxima` by shop.

### Changed

- The stored state is version 3. The app migrates an older state and an older backup.

## 1.0.5 - 2026-10-13

### Added

- Seven languages: Spanish, English, Catalan, German, French, Italian and Portuguese.
- A language setting in `Ajustes`.

## 1.0.4 - 2026-10-13

### Added

- A horizontal slide changes the section. The content of the new section comes in from its side.

## 1.0.3 - 2026-10-13

### Added

- A hold on a row moves it, to change the order of a list.

### Changed

- The group choice and the order choice are in a sheet of the header.
- The insertion order has the name `Personalizado`.
- A move of a row in the order `Nombre` changes the order to `Personalizado`.

### Fixed

- Three states where a row move could lock the list or tick an item.

## 1.0.2 - 2026-10-12

No change of the app. The repository stopped tracking the Claude files and the planning documents.

## 1.0.1 - 2026-10-12

### Changed

- `Actual` groups the items of a recipe only when all the products of the recipe are in the list.

## 1.0.0 - 2026-10-12

The first version with a version number. It has all the work before it.

### Added

- The lists `Actual` and `Próxima`, with recurrent items and one-time items.
- One add field that searches the items and creates a new one.
- A collapsed section for the ticked items.
- Side menus for the actions of an item, which a swipe on the row shows.
- A toggle on each row for the recurrent mark.
- Recipes: a name, a list of products and an optional link. The product field suggests the items
  that exist.
- The send of a recipe to `Actual`, with an undo on a second tap.
- A choice to group `Actual` by recipe.
- A search field in `Recetas`.
- A choice to order `Actual` and `Próxima` by name.
- A message with the count of `Actual` when the app starts with `?arrival` in the URL.
- The data in `localStorage`, with the export and the import of a backup.
- Offline use and installation on Android, with a manifest, icons and a service worker.
- The version in `Ajustes`, compared with the deployed version, and **Actualizar**.
- The user interface in Spanish.
