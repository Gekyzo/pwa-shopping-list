# Accounts and sync between devices

Rules of the account screens, the session and the sync of the state with the server. The server is
PocketBase. The app talks to it with `fetch` and `EventSource`, with no SDK (PROD-7).

## Account

- **ACC-1** At the start the app routes by the session and the local data:
  - a saved session, approved: the list, online or not;
  - a saved session, not approved: **Esperando aprobación**;
  - no session and no `shopping.v1` data: **Iniciar sesión**;
  - no session and `shopping.v1` data: the list as before, with the banner of ACC-11.

  The route never reads the clock: an expired token does not change it (ACC-6, ACC-7).
- **ACC-2** Three screens cover the list. **Iniciar sesión** has the Google button, the email,
  the password, **Entrar**, **¿Olvidaste la contraseña?** and the link to **Solicitar acceso**.
  **Solicitar acceso** has the Google button, the name, the email, the password (8 characters or more),
  **Enviar solicitud** and the link back to **Iniciar sesión**. **Esperando aprobación** has
  **Comprobar de nuevo** and **Cerrar sesión**.
- **ACC-3** A sign-up with email and password creates an account that is not approved. The user then
  sees **Esperando aprobación**.
- **ACC-4** An account that is not approved makes no request for data. A device that holds a list
  before that login keeps it stored, unchanged, until the approval. Then SYNC-8 applies.
- **ACC-5** Google sign-in is a redirect. The app asks the server for the URL of the provider, sends the
  browser there with the URL of the app as the return address, and exchanges the `code` on return.
  The server creates the account of an OAuth sign-up as not approved. The app removes `code` and
  `state` from the URL at once and keeps each other parameter, as ARR-4.
- **ACC-6** A saved session opens the app at once, with no connection. The token and the user are
  stored on the device.
- **ACC-7** A token counts as expired 60 s before its `exp` claim, or when the app cannot read it.
  When online, the app refreshes the token. If the refresh fails with an auth error, the app
  shows **Iniciar sesión**. It keeps the local state and the queue. A login of the same user
  continues the sync.
- **ACC-8** A login of another user than the one of the stored data first clears the local data and
  the queue of the previous user. This clears `shopping.v1`, the session and the sync state, never
  a device preference. A device with no stored owner clears nothing. When the queue is not empty, the app first offers an export
  (BACKUP-1).
- **ACC-9** **Cerrar sesión** when online sends the queue first, then clears the local data, the
  queue and the token. When offline with a queue that is not empty, the app warns that the
  changes not sent are lost and offers an export first.
- **ACC-10** `Ajustes` has the row **Cuenta**: the email, the time of the last sync and
  **Cerrar sesión**.
- **ACC-11** With no session and with `shopping.v1` data, the list shows the banner
  **Inicia sesión para sincronizar**. The device works local-only until the user logs in.
- **ACC-12** The API URL is one config value. When the app is served from `localhost`, `127.0.0.1` or
  `[::1]`, it is `http://localhost:8090`. Else it is `https://artisandevs.duckdns.org`.

## Sync

- **SYNC-1** The server holds one record for each item, each recipe, each meal of the menu and the
  settings. A record has `kind` (`item`, `recipe`, `meal` or `settings`), `key`, `data`, `deleted` and
  `updated`. The key is the `id` of an item or of a recipe, `<day>-<meal>` for a meal, and `settings` for
  the settings. A device preference does not sync: the language, the hand, the theme, the density,
  **Al terminar la compra**, the row of shop lists, the hint of the swipe and the flag of the
  walkthrough.
- **SYNC-2** Each save of the state is compared with the last state that the server is known to
  hold. The upserts and the deletes go into the queue in `shopping.queue`. The state, `Deshacer` and the
  pure modules do not change.
- **SYNC-3** A sync starts at the start of the app, at the `online` event, after a save (with a
  delay) and at a realtime event of the server.
- **SYNC-4** A sync is online only and runs in this order: the app sends the queue in order,
  pulls each record with `updated` at or after the last cursor (a record pulled twice is harmless),
  merges the records into the state, and applies again the changes that are still queued.
- **SYNC-5** A change that is queued wins over a pulled record of the same `kind` and `key`.
- **SYNC-6** A delete is a record with `deleted: true`, so that the delete reaches the other devices.
  A delete of a record that the server does not hold creates nothing. An upsert whose record is gone from the server creates it again.
- **SYNC-7** The merge removes a duplicate before the validation (STORE-6). Of two items or of two
  recipes with one name, with no regard to case, the record with the newer `updated` stays and the other
  gets a tombstone that the app sends. A meal or a `sent` id of a removed recipe is dropped.
  The name is compared after a trim, as the validation does. The merge drops, with no tombstone, an item or
  a recipe record whose `data.name` is not a string or whose `data.id` is not its `key`.
  The merge never gives a state that the validation refuses.
- **SYNC-8** At the first login on a device with `shopping.v1` data:
  - an account with no data gets the local state as records;
  - an account with data replaces the local state, and the old local state stays in
    `shopping.v1.beforeLogin`. The app offers it as an export file. It never merges two lists.
- **SYNC-9** The import (BACKUP-5) replaces the data of the account, so on every device. The next sync
  sends a tombstone for each record of the server that the import does not hold, and an upsert for the
  others. With a session the question of the import is
  `import.confirmAccount` (BACKUP-5), which says so.
- **SYNC-10** **Borrar todos los datos** (BACKUP-7) clears this device only: the state, the queue,
  the last known server state and the token. It logs out and sends nothing. The data of the account
  stays on the server. With a session the question of the reset is
  `reset.confirmLocal` (BACKUP-7), which says so.
- **SYNC-11** While the device is offline, a note over the list says **Sin conexión · cambios
  guardados**.

## Keys

The keys `shopping.session`, `shopping.sync`, `shopping.queue` and `shopping.v1.beforeLogin` are in
the table of [08-storage.md](08-storage.md). `shopping.session` holds the token and the user.
`shopping.sync` holds the last cursor and the last known server state. `shopping.queue` holds the
changes not sent.

Limits: no sharing between users, and no merge of two lists. Two devices of one user can differ for
a short time, and the last change to arrive wins for each record.
