# Modules

Rules of `src/modules.js`, and of its use in `src/app.js`.

- **MOD-1** `Ajustes` has the group **Módulos**, with a switch for `Próxima` and a switch for
  **Recetas y menú**. A switch is a toggle with a knob that slides to the right when it is on. A new install has the two modules on. `Actual` and `Ajustes` are always on.
- **MOD-2** The modules that are off are stored in `shopping.modules`, as a JSON list of their
  ids, `next` and `recipes`. All modules on removes the key. A missing key, a text that is not a
  JSON list and an unknown id read as on. It is a preference of the device, not a part of the
  state: `Deshacer`, an import and the backup do not change it.
- **MOD-3** A module that is off keeps its data in the state. When it is on again, the data shows
  as before.
- **MOD-4** With `Recetas` off, the bottom bar and the slide between sections (NAV-3) have no
  `Recetas` and no `Menú`. The arrange sheet has no group choice `Recetas`, and a stored group
  `recipe` shows the list with no group. The stored group does not change.
- **MOD-5** With `Próxima` off, the bottom bar and the slide between sections have no `Próxima`.
  The add sheet has no target choice: the target is `Actual`. A ticked item has no `+ Próxima`
  (LIST-14), a row has no **Mover a Próxima** (ROW-3), and `Actual` has no
  `Traer N artículos de Próxima` (TRIP-4).
- **MOD-6** The switch-off of `Próxima` moves each item of `list: 'next'` to `Actual`, as a move
  does (LIST-9), with the message `Artículos traídos de Próxima.` and `Deshacer`. `Deshacer` puts
  the items back in `list: 'next'`; the module stays off. With no item in `list: 'next'` the
  switch-off shows no message.
- **MOD-7** With `Próxima` off, the recurrent mark and **Terminar compra** keep their rules
  (TRIP-2): a ticked recurrent item comes back to `Actual`.
- **MOD-8** The walkthrough does not change with the modules.
