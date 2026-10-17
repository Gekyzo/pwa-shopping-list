# Modules

Rules of `src/modules.js`, and of its use in `src/ui/settings.js` and `src/ui/nav.js`.

- **MOD-1** `Ajustes` has the group **Módulos**, with a switch for **Recetas y menú**. A switch is
  a toggle with a knob that slides to the right when it is on. A new install has the module on. `Actual` and `Ajustes` are always on.
- **MOD-2** The modules that are off are stored in `shopping.modules`, as a JSON list of their
  ids. The only id is `recipes`. All modules on removes the key. A missing key and a text that is
  not a JSON list read as all on. An unknown id, such as the `next` of an older version, is
  ignored. It is a preference of the device, not a part of the
  state: `Deshacer`, an import and the backup do not change it.
- **MOD-3** A module that is off keeps its data in the state. When it is on again, the data shows
  as before.
- **MOD-4** With `Recetas` off, the bottom bar and the slide between sections (NAV-3) have no
  `Recetas` and no `Menú`. The arrange sheet has no group choice `Recetas`, and a stored group
  `recipe` shows the list with no group. The stored group does not change.
- **MOD-5** Removed: the module of the second list is gone with that list.
- **MOD-6** Removed: the module of the second list is gone with that list.
- **MOD-7** Removed: the module of the second list is gone with that list.
- **MOD-8** The walkthrough does not change with the modules.
- **MOD-9** A switch animates the bottom bar. The button of a section that goes breaks into dust
  in 900 ms: particles of 2 px leave from its left edge to its right edge, go up and to the right
  and fade out, and its place closes in 300 ms from the first third of the dust. The button of a
  section that comes back opens its place in 300 ms, then its particles come in and settle. The
  start of the app and `prefers-reduced-motion: reduce` show the bar with no animation.
