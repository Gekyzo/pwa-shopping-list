# Modules

Removed in the web app: `Ajustes` has no group **Módulos**, and `Recetas` and `Menú` are always in
the bottom bar. The last web version with the modules is the tag `archive/settings-modules`. The
port builds none of it.

A search of `src/`, `index.html`, `styles.css`, `sw.js`, `manifest.webmanifest` and the seven
catalogs at `f822a77` finds no trace of the modules: no key `shopping.modules`, no group
**Módulos**, no dust effect of the bottom bar, no module of the second list. The only mention of
the second list is the migration of `next` in `src/storage.js:10-13`, which belongs to `08-storage`.

One stale text remains outside the code: the `description` of `package.json:4` names "synced and
shared lists, AI item entry, purchase history and a pantry". The app has none of these. The port
takes its description from `manifest.webmanifest` (`Lista de la compra que se prepara sola para la
próxima vez`).

## Rules

**MOD-1** [dropped] [removed] The group **Módulos** of `Ajustes` is gone.

**MOD-2** [dropped] [removed] The key `shopping.modules` is not read or written. A stored key stays, with no effect; `Borrar todos los datos` does not remove it (it is not in `APP_KEYS`, `src/storage.js:421-432`). The port has no such key.

**MOD-3** [dropped] [removed] The group **Módulos** of `Ajustes` is gone.

**MOD-4** [dropped] [removed] The group **Módulos** of `Ajustes` is gone.

**MOD-5** [dropped] [removed] The module of the second list is gone with that list.

**MOD-6** [dropped] [removed] The module of the second list is gone with that list.

**MOD-7** [dropped] [removed] The module of the second list is gone with that list.

**MOD-8** [dropped] [removed] The group **Módulos** of `Ajustes` is gone.

**MOD-9** [dropped] [removed] The bottom bar has no dust effect.
