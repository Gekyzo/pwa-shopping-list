# Sharing the list

Rules of the share of the data of an account with other people, by email. Sharing is built on the
accounts and the sync of [18-account-sync.md](18-account-sync.md): each rule there holds for each
person of a share.

## Space

- **SHARE-1** The data of an account is a space, named by the id of its owner. Each record of the
  server has the owner of its space (SYNC-1), whoever wrote it. Each user has a space of their own.
  A member of a share works in their own space and in the space of the owner, side by side.
- **SHARE-2** A share holds the whole space: `Compra`, `Recetas`, `Menú` and the settings that sync
  (SYNC-1). A device preference never syncs, so each person keeps their own.
- **SHARE-3** The owner invites a person by their email. The server stores the email in lower case,
  so the case of the typed email does not count, and it emails the invite. The server refuses:
  - the email of the owner (`share.error.self`);
  - an email that has an active invite or share already (`share.error.taken`, server code
    `share_taken`): a person is a member of one space at most. A cancelled share (SHARE-11) does
    not count;
  - an invite by a user who is a member of a space: a share has no chain.
- **SHARE-4** An invite gives no account. A person with no account requests access (ACC-3), and
  the administrator approves the account as for any account (ACC-4). An account that is not
  approved sees no invite.
- **SHARE-5** The invitee accepts or declines in the sheet **Compartir lista**. The accept asks
  first (`share.acceptAsk`): `¿Compartir la lista de <email>? Su lista se mostrará junto a la
  tuya.` The sheet shows the warning `share.acceptWarning` above **Aceptar**: `Su lista se
  mostrará junto a la tuya. La tuya no cambia.` An accept keeps the own list of the invitee as it is: the list
  of the owner comes beside it (SHARE-7). An owner of a share (an invite or a member) cannot
  accept: the sheet says so (`share.blocked`), and the server refuses it too.

## Sync

- **SHARE-6** A sync has two lanes, each with its own sync state and queue (SHARE-12): the own
  lane syncs the space of the user, always; the shared lane syncs the space of the owner of the
  share whose member is the user (`sharedSpace`), while there is one. Each sync lists the shares
  of the user after the refresh of the token and before the push. Then the own lane pushes and
  pulls, then the shared lane does the same, with the same push, pull and merge (SYNC-4 to
  SYNC-7, and the guard of SYNC-2 in each lane). A save of the own part queues in the own lane, a
  save of the shared part in the shared lane: a change goes to the space of its list only. A stop
  of the shared lane (offline, rate limit, server error) stops the sync with that result and
  keeps what the own lane did. The realtime stream also follows the shares: an event of a share
  starts a sync, as an event of a record does (SYNC-3).
- **SHARE-7** The shared lane follows the share at each sync, before it sends anything:
  - a share now and none before (an accept on this device or on another device of the user): the
    lane starts with the empty state and pulls the space of the owner in full, as a device with
    no local data at its first login (SYNC-8);
  - a share before and none now (a leave, a decline, a cancel or a remove by the owner): the user
    can no longer write the shared space, so the shared queue is dropped. When it held changes,
    the app says so (`share.left`). The shared state and the shared sync state go;
  - scope `all` to `list`: the shared recipes and meals leave the shared state, its sync state and
    its queue. They stay on the server: nothing queues a delete. When the dropped queued changes
    are one or more, the app says so with `share.narrowed` (`Ya no compartes recetas ni menú. Se
    perdieron <n> cambios sin enviar.`), not with `share.left`: the share goes on. The syncer
    counts the two drops apart (`left` and `narrowed` of its status); when both happen in one
    sync, `share.left` counts both;
  - scope `list` to `all`: the shared lane pulls the space in full, so the recipes and meals come;
  - with scope `list` the shared lane sends changes of items only, never of the settings, of a
    recipe or of a meal. The settings of the owner hold `sent` ids of recipes that the member does
    not see; the validation drops them, and a push would wipe them on the server.

  The own list never changes at a start or an end of the share: nothing of one space goes into
  the other. A state that the shared lane puts in place is not a save: it queues nothing, and it
  removes the message and its `Deshacer` (PROD-9). A sync that lists the shares and fails stops as
  SYNC-4 says, and keeps both lanes. A share can end between the list and the push: when the
  server refuses a push of the shared lane as it refuses a token that is not valid (ACC-7), the
  sync lists the shares again, and ends the shared lane when the share ended, instead of an auth
  stop. A share request made while a sync runs waits for that sync, then starts a new one, which
  sees the change.
- **SHARE-13** A device of v1.5.0 that a member left in the shared space holds that space in
  `shopping.v1`, `shopping.sync` and `shopping.queue` (the `space` of `shopping.sync` differs from
  its `owner`). At the start the app moves that state, sync state and queue to the shared keys,
  and gives the own lane the empty state with an empty cursor, so the next sync pulls the own
  space in full (SYNC-8) and sends the shared queue to the shared space. The shared keys are
  written first: a stop halfway loses nothing.

## Screens

- **SHARE-8** The owner removes a person, a member leaves, an invitee declines: each is one tap with
  no confirmation and a `Deshacer` of 5 s (PROD-9). The request goes when the 5 s end. A remove by
  the owner deletes the share. A decline and a leave cancel it (SHARE-11): the row stays. A leave
  first sends the shared queue to the shared space, then cancels the share, then syncs. When the
  shared queue cannot be sent, the leave stops with `share.error.network` and the share stays. A
  remove, a decline or a leave deletes no record: the data of the owner and the own data of the
  member stay. ✕ on a cancelled person removes the row the same way. A change of scope and
  **Invitar de nuevo** go at once, with no `Deshacer`: a second tap undoes a change of scope.
- **SHARE-9** The group **Cuenta** of `Ajustes` has the row **Compartir lista**, below the email,
  when the session is approved. It opens the sheet **Compartir lista**, which shows one case:
  - the owner: each person of the space with the email, the state (`Invitación enviada`,
    `Comparte la lista` or `Cancelada`) and the scope (`Comparte: Solo Compra` or `Comparte:
    Compra, Recetas y Menú`), and the remove button ✕ (`Quitar a <email>`). A tap on the scope of a
    pending or joined person sets the other scope (SHARE-11); the member's device follows it at
    its next sync (SHARE-7). A cancelled person also has **Invitar de nuevo**, which sets the share
    back to pending. Then the scope of the invite, two chips **Solo Compra** (`list`) and **Compra,
    Recetas y Menú** (`all`), with **Solo Compra** chosen at each open of the sheet; then the
    email field and **Invitar**, which invites with the chosen scope. An invite of the email of a
    cancelled person replaces that cancelled row with a new one;
  - an invitee: `<email> te invita a compartir su lista.`, the scope of the invite (`Comparte:
    <scope>`), the warning of SHARE-5, **Aceptar** and **Rechazar**;
  - a member: `Compartes la lista de <email>.`, the scope of the share (`Comparte: <scope>`) and
    **Dejar de compartir**.

  An error of an invite shows below the field: `share.error.self`, `share.error.taken`,
  `share.error.network`, `share.error.invalid`. While an invite waits, a banner over the list says
  who invites; its button **Ver invitación** opens the sheet. The sheet is a layer of NAV-25. The
  Deshacer of SHARE-8 cancels the request that waits, so the share stays as it was.

## Scope and cancel

- **SHARE-11** A share has a `scope`: `all` (the whole space, the default) or `list` (the shared
  list only), and a `cancelled` flag. The invitee (a decline) or the member (a leave) cancels a
  share with `cancelled: true`: the row stays, so the person shows in the sheet with the state
  `cancelled`, and a new invite by the owner (`cancelled: false`, no member) opens it again. A cancelled share is no invite and no
  membership: the space to sync, the pending invite and the case of the invitee ignore it, and it
  does not block an accept (SHARE-5). The owner lists each person as `pending`, `joined` or
  `cancelled`. The name of a shared list is the name of its owner, else the part of the owner
  email before `@`.

- **SHARE-12** A member works on one combined state: the own entities, then the shared ones, each
  shared one marked `shared`. With scope `all` the shared recipes and meals are in it; with scope
  `list` they are not, and the own `sent` is the whole `sent`. Each id of the shared part, and each
  reference to one (the recipe of a meal, `sent`), has the prefix `shared:` in the combined state:
  the two lists may hold one id each (the sample recipe of the walkthrough, an imported backup),
  and an id of the screen names one entity. The marker and the prefix never sync or save:
  each save splits the state into the own part and the shared part, and the shared part keeps its
  `group`, `sort` and `aisles`. An add, a rename, a recipe send and a meal act in one list, so the
  name rule (LIST-2) and the meal slot hold inside that list: two lists may each hold a `Leche`.
  The split happens at each save of the screen (`commit` of `src/ui/context.js`): the own part
  goes to `shopping.v1` and the own lane, the shared part to `shopping.shared.v1` and the shared
  lane. `Deshacer` puts back a combined state, so the split sends each restore to its list. A state
  that the sync puts in place, of either lane, is combined again with the other part and queues
  nothing. The shared part shows once the share is known: the stored sync state gives it at the
  start, and each status of the syncer after.

## The member's screen

- **SHARE-14** For a member, `Compra` shows a row of list chips below the header, at every width:
  **Todas**, **Mi lista** and the shared list, named as in SHARE-11. Each chip counts the items to
  buy of its list. **Todas** shows the items of both lists; the other chips show the items of one
  list. The shop lists work inside the list chip: their chips, the dock and its picker show the
  shops of that list. In **Todas** each row shows a tag of its list: `Mía` or the name of the
  shared list; the other chips show no tag. An item of one name in both lists shows as two rows. A
  manual reorder does not start in **Todas**. The owner, and a user with no share, see no list
  chips and no tags. The choice is not stored: it is **Todas** at each start and at the end of the
  share.

- **SHARE-15** An add from **Mi lista** and from **Todas** goes to the own list; an add from the
  shared chip goes to the shared list. The suggestions of the add sheet and its duplicate check
  (ADD-6) look at that list only. A rename runs in the list of its item. A tick, a delete, the
  other changes of an item and `Deshacer` act on the item in its own list. A manual reorder moves
  the rows of one list (SHARE-14) and changes the order of that list only. The screen shows both
  lists in the own order: in the name order a reorder of either list switches the own order to
  custom, with the own items kept in the name order; the order of the shared part stays its own.
  **Terminar compra** ends the trip of both lists in one operation.

## Limits

- **SHARE-10** A share has no roles: each member changes all the data of the space; only the owner
  invites and removes. A share never merges two lists. Between people, as between two devices of
  one person, the last change to arrive wins for each record (SYNC-5), and of two items or recipes
  with one name the newer stays (SYNC-7).
