# Accounts and sync between devices

Rules of the account screens, the session and the sync of the state with the server. The server is
PocketBase. The app talks to it with `fetch` and `EventSource`, with no SDK (PROD-7).

## Account

- **ACC-1** At the start the app routes by the session and the local data:
  - a saved session, approved: the list, online or not;
  - a saved session, not approved: **Esperando aprobación**;
  - no session and no `shopping.v1` data: **Iniciar sesión**;
  - no session and `shopping.v1` data: the list as before, with the banner of ACC-11.

  The route never reads the clock: an expired token does not change it (ACC-6, ACC-7). The device has
  `shopping.v1` data when the state differs from the state of a new install, the settings too. So
  the empty list that a logout leaves opens **Iniciar sesión**, and a device with a list is never
  locked out of it. When `shopping.v1` cannot be read at the start (STORE-5), the app
  starts with the empty state; with a session it then takes the empty state as the base of the sync
  and pulls the whole account again, so the lost state deletes nothing on the server. A saved
  session whose login is not finished (the question of ACC-8) refreshes its token before that
  login goes on: an auth error opens **Iniciar sesión**, a network error keeps the list, and the next
  start or `online` event tries again.
- **ACC-2** Three screens cover the list. **Iniciar sesión** has the Google button, the email,
  the password, **Entrar**, **¿Olvidaste la contraseña?** and the link to **Solicitar acceso**.
  **Solicitar acceso** has the Google button, the name, the email, the password (8 characters or more),
  **Enviar solicitud** and the link back to **Iniciar sesión**. **Esperando aprobación** has
  **Comprobar de nuevo** and **Cerrar sesión**. Their texts name the one who approves as the
  administrator, never by a person's name. The screens cover the app, the walkthrough too.
  When the device has a list, **Iniciar sesión** and **Solicitar acceso** also have **Volver a la
  lista**; `Escape` and the back of the phone close them too, as a layer of NAV-25. A screen that
  cannot close is not a layer: the back closes the layer below it. An error shows below the fields: `account.error.wrongPassword`,
  `account.error.network`, `account.error.emailTaken`, `account.error.passwordShort`. A password
  of less than 8 characters is refused before any request. A sign-up whose email has an account
  (such as a second try after a login that failed) opens **Iniciar sesión** with that email and
  `account.error.emailTaken`. **¿Olvidaste la contraseña?** asks the server for a reset email for the
  address of the field, and then shows `account.resetSent`, the same message whether the address has
  an account or not. A login that the account replaces (SYNC-8) then offers the old list as an
  export file, one time.
- **ACC-3** A sign-up with email and password creates an account that is not approved. The user then
  sees **Esperando aprobación**.
- **ACC-4** An account that is not approved makes no request for data. A device that holds a list
  before that login keeps it stored, unchanged, until the approval. Then SYNC-8 applies.
  **Comprobar de nuevo** refreshes the session: an approved account logs in, else the message
  `account.waiting.still`. **Cerrar sesión** of **Esperando aprobación** removes only the session when
  the account is not the owner of the stored data, so the list stays; the owner logs out as ACC-9.
- **ACC-5** Google sign-in is a redirect. The app asks the server for the URL of the provider, sends the
  browser there with the URL of the app as the return address, and exchanges the `code` on return.
  The server creates the account of an OAuth sign-up as not approved. The app removes `code`,
  `state` and `error` from the URL at once and keeps each other parameter, as ARR-4. A return
  with no `code` (a cancel at Google) or with a `state` that is not the one sent drops the pending
  sign-in and shows **Iniciar sesión** with `account.error.google`.
- **ACC-6** A saved session opens the app at once, with no connection. The token and the user are
  stored on the device.
- **ACC-7** A token counts as expired 60 s before its `exp` claim, or when the app cannot read it.
  Before the first request for data of a sync, the app refreshes the token when it is expired or
  when the last refresh is more than 10 minutes old. The answer of the refresh carries `approved`:
  an account that is no longer approved makes no request for data (ACC-4). The server answers a
  token that is not valid as a guest, so a push refused with a 400 and no field error also counts
  as an auth error. After an auth error the app shows **Iniciar sesión**. It keeps the local state
  and the queue. Until the next login a save goes into the queue and no sync makes a request, so
  the rate limit of the auth endpoints stays free for that login. A login of the same user
  continues the sync. **Iniciar sesión** shows over the list with **Volver a la lista**. Until the
  login, the list shows the banner of ACC-11 and the group **Cuenta** has **Inicia sesión para
  sincronizar**, so a dismissed **Iniciar sesión** can open again.
- **ACC-8** A login of another user than the one of the stored data first clears the local data and
  the queue of the previous user. This clears `shopping.v1`, the session and the sync state, never
  a device preference. A device with no stored owner clears nothing. When the queue is not empty, the app first offers an export
  (BACKUP-1). A queue with no stored owner counts as the queue of another user. After the export,
  or when the user declines it, the login clears and continues.
- **ACC-9** **Cerrar sesión** when online sends the queue first, then clears the local data, the
  queue and the token. When the queue is still not empty after that (offline, or the sync
  stopped), the app warns that the changes not sent are lost and asks `account.logoutAsk`: a no
  stops the logout and changes nothing. A yes then offers an export (`account.logoutExport`).
  After the export, or when the user declines it, the logout clears the same data. A sync that is in
  progress at the logout, or at a login that clears, saves nothing and changes no state after it.
- **ACC-10** `Ajustes` has the row **Cuenta**: the email, the time of the last sync and
  **Cerrar sesión**. The time of the last sync is under the email, in the muted style, and a long
  email wraps inside the row. With no session the group has **Inicia sesión para sincronizar**, which opens
  **Iniciar sesión** with **Volver a la lista**.
- **ACC-11** With no session and with `shopping.v1` data, the list shows the banner
  **Inicia sesión para sincronizar**. The device works local-only until the user logs in. Its button
  opens **Iniciar sesión** with **Volver a la lista**.
- **ACC-12** The API URL is one config value. When the app is served from `localhost`, `127.0.0.1` or
  `[::1]`, it is `http://localhost:8090`. Else it is `https://artisandevs.duckdns.org`.

## Sync

- **SYNC-1** The server holds one record for each item, each recipe, each meal of the menu and the
  settings, for each space (SHARE-1). A record has `owner` (the owner of the space), `kind` (`item`, `recipe`, `meal` or `settings`), `key`, `data`, `deleted` and
  `updated`. The key is the `id` of an item or of a recipe, `<day>-<meal>` for a meal, and `settings` for
  the settings. A device preference does not sync: the language, the hand, the theme, the density,
  **Al terminar la compra**, the row of shop lists, the hint of the swipe and the flag of the
  walkthrough.
  Each space has one `settings` record. A member pulls the settings of the shared space with
  the shared list, and sends a change of them only with scope `all` (SHARE-7): with scope `list`
  the member does not see the recipes whose ids `sent` holds.
- **SYNC-2** Each save of the state is compared with the last state that the sync knows: the
  state of the last save or of the last merge. The upserts and the deletes go into the queue in
  `shopping.queue`. The state, `Deshacer` and the pure modules do not change. A state that held
  none of the items and recipes of the account since the start (a state that fell back to the
  empty one) does not delete them: the app logs the refusal, queues nothing, and the next merge
  puts the account back in place. The user who deletes them, one by one or all at once, and an
  import (SYNC-9) still delete them. A device with no
  session, or whose login is not finished, keeps no queue. The state that a merge puts in place
  is not a save: it queues nothing by itself. Each sync first compares the state with the last
  state that the sync knows, so a save that was not queued (no approval, the question of ACC-8)
  is queued then and the merge does not lose it.
- **SYNC-3** A sync starts at the start of the app, at the `online` event, after a save (1.5 s
  after the last save of a burst) and at a realtime event of the server. The realtime stream opens
  after the first sync of the start or of the `online` event. At each connect it sends the token
  that the device holds then, so a reconnect of the browser after a refresh uses the fresh token,
  and each connect after the first starts a sync, for the changes that the stream missed. It
  closes at the `offline` event, at an auth error and at a logout. A sync that starts while
  one runs is that same sync. When a merge queues changes (a tombstone of SYNC-7, a fix of the
  validation), a sync starts 1.5 s later to send them. When a sync stops at the rate limit of
  the server (a 429) or at a server error (a 5xx), the queue stays and a sync starts again after
  5 s, then 15 s, 30 s and 60 s, and then every 60 s; a sync that reaches the server ends the series.
  A stop at the network does not start a retry: the `online` event does.
- **SYNC-4** A sync is online only and runs in this order: the app lists the shares (SHARE-6), sends the queue in order,
  pulls each record with `updated` at or after the last cursor (a record pulled twice is harmless),
  merges the records into the state, and applies again the changes that are still queued.
  A change leaves the queue, and the queue is saved, only after the server took it, so a sync that
  stops sends no change twice as a new record. A network error or a server error (5xx) stops the
  sync before the pull and keeps the changes not sent: the changes go in the order of the saves,
  and a pull on the same connection fails too. The next sync starts again at the first change
  not sent. A change that the server refuses as bad data (a 400 with field errors) leaves the
  queue and stays local; the next changes go on. A rate limit (a 429) stops the sync and keeps
  the sync online (SYNC-3). An error that is not of the server or of the network is logged, and the
  sync stops as offline.
- **SYNC-5** A change that is queued wins over a pulled record of the same `kind` and `key`.
- **SYNC-6** A delete is a record with `deleted: true`, so that the delete reaches the other devices.
  The delete changes only that flag: the record keeps its `data`. A pulled record with `deleted`
  counts as absent. A delete of a record that the server does not hold creates nothing. An upsert whose record is gone from the server creates it again.
  A token that is not valid also finds no record, so a delete of a known record that the server
  does not find refreshes the token first: after a good refresh the record is gone and the delete
  leaves the queue; an auth error is an auth stop (ACC-7) and the delete stays queued.
- **SYNC-7** The merge removes a duplicate before the validation (STORE-6). Of two items or of two
  recipes with one name, with no regard to case, the record with the newer `updated` stays and the other
  gets a tombstone that the app sends. A meal or a `sent` id of a removed recipe is dropped.
  The name is compared after a trim, as the validation does. The merge drops, with no tombstone, an item or
  a recipe record whose `data.name` is not a string or whose `data.id` is not its `key`.
  The merge never gives a state that the validation refuses. When the validation refuses the merged
  records, the state, the queue and the cursor stay as they are, and the next sync pulls the same
  records again.
- **SYNC-8** At the first login on a device with `shopping.v1` data:
  - an account with no data gets the local state as records;
  - an account with data replaces the local state, and the old local state stays in
    `shopping.v1.beforeLogin`. The app offers it as an export file. It never merges two lists.
    When the app cannot save that copy, the login stops and the local state stays. The records of
    the account go through the same steps as a merge (SYNC-7): a duplicate gets a tombstone and a
    malformed record is dropped. When the validation still refuses them, the login stops, the
    local state stays and `shopping.v1.beforeLogin` is removed again. The device never takes an
    empty state in place of the account.
  - a device with no local data takes the data of the account, its settings too: the state at the
    login is the base of the first sync, so the default settings of the device are not a change
    and the sync does not send them.

  A login starts a sync of its own; a sync in progress with the token of before the login cannot
  stop it.
- **SYNC-9** The import (BACKUP-5) replaces the data of the account, so on every device. The next sync
  sends a tombstone for each record of the server that the import does not hold, and an upsert for the
  others. The import is the one save that can replace the whole account with no regard to SYNC-2. With a session the question of the import is
  `import.confirmAccount` (BACKUP-5), which says so. For a member (SHARE-12) the backup covers the
  own list only: **Exportar** writes the own part, with no shared entity and no `shared` marker, and
  the import replaces the own part and keeps the shared part. The shared list belongs to its owner.
- **SYNC-10** **Borrar todos los datos** (BACKUP-7) clears this device only: the state, the queue,
  the last known server state and the token. It logs out and sends nothing. The sync stops first: a
  sync in progress becomes stale and saves nothing, and the queue is dropped. The data of the account
  stays on the server. With a session the question of the reset is
  `reset.confirmLocal` (BACKUP-7), which says so.
- **SYNC-11** While the device is offline, a note over the list says **Sin conexión · cambios
  guardados**. With a session, the note shows after the `offline` event or after a sync that stopped
  at the network or at a server error, and goes at the `online` event or after a sync that reached
  the server. A stop at the rate limit (a 429) is not offline: the note does not show, and the
  retry of SYNC-3 sends the queue.
  A sync that reached the server (the server answered it: ok, a rate limit or an auth error) also clears the note and opens the stream
  again, even when the browser sent no `online` event, as some phones do after airplane mode.
  When the app shows again (`visibilitychange` to visible) and the browser says it is online, the
  note goes and a sync starts. A sync that stops as offline keeps the note.

## Keys

The keys `shopping.session`, `shopping.sync`, `shopping.queue` and `shopping.v1.beforeLogin` (and the three shared keys of SHARE-12) are in
the table of [08-storage.md](08-storage.md). `shopping.session` holds the token and the user.
`shopping.sync` holds the owner of the data, the space of the data and the last list of shares (SHARE-6), the last cursor, the last known server state, the
records of the last state that the sync knows and the time of the last sync. `shopping.queue` holds the
changes not sent.

Limits: no merge of two lists. Two devices of one user, or of two people of a share, can differ
for a short time, and the last change to arrive wins for each record (SHARE-10).
