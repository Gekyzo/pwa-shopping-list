# Sharing the list

Rules of the share of the data of an account with other people, by email. Sharing is built on the
accounts and the sync of [18-account-sync.md](18-account-sync.md): each rule there holds for each
person of a share.

## Space

- **SHARE-1** The data of an account is a space, named by the id of its owner. Each record of the
  server has the owner of its space (SYNC-1), whoever wrote it. Each user has a space of their own.
  A member of a share works in the space of the owner instead, and their own space stays on the
  server, unchanged.
- **SHARE-2** A share holds the whole space: `Compra`, `Recetas`, `Menú` and the settings that sync
  (SYNC-1). A device preference never syncs, so each person keeps their own.
- **SHARE-3** The owner invites a person by their email. The server stores the email in lower case,
  so the case of the typed email does not count, and it emails the invite. The server refuses:
  - the email of the owner (`share.error.self`);
  - an email that has an invite or a share already (`share.error.taken`): a person is a member of
    one space at most;
  - an invite by a user who is a member of a space: a share has no chain.
- **SHARE-4** An invite gives no account. A person with no account requests access (ACC-3), and
  the administrator approves the account as for any account (ACC-4). An account that is not
  approved sees no invite.
- **SHARE-5** The invitee accepts or declines in the sheet **Compartir lista**. The accept asks
  first (`share.acceptWarning`): the device then shows the list of the owner in place of the
  list of the invitee, which stays in their account. An owner of a share (an invite or a member)
  cannot accept: the sheet says so (`share.blocked`), and the server refuses it too.

## Sync

- **SHARE-6** `shopping.sync` holds the space of the stored data. A sync pulls and sends the
  records of that space only: a member can read two spaces, their own and the shared one. Each
  sync lists the shares of the user after the refresh of the token and before the push. The
  space to sync is the owner of the share whose member is the user, else the user. The realtime
  stream also follows the shares: an event of a share starts a sync, as an event of a record
  does (SYNC-3).
- **SHARE-7** When the space to sync differs from the stored space, the sync changes space before
  it sends anything:
  - from the own space to a shared space (an accept on this device or on another device of the
    user): the queue holds changes of the own space, which the user can still write, so the sync
    sends it first;
  - from a shared space to the own space (a leave, a remove by the owner): the user can no longer
    write the shared space, so the queue is dropped. When the queue held changes, the app says so
    (`share.left`).

  Then the device drops the state, the queue and the sync state of the old space, and pulls the
  new space in full, as a device with no local data at its first login (SYNC-8). Nothing of one
  space goes into the other. The new state is not a save: it queues nothing, and it removes the
  message and its `Deshacer` (PROD-9). A sync that lists the shares and fails stops as SYNC-4 says,
  and keeps the stored space.

## Screens

- **SHARE-8** The owner removes a person, a member leaves, an invitee declines: each is one tap with
  no confirmation and a `Deshacer` of 5 s (PROD-9). The request goes when the 5 s end. A leave first
  sends the queue to the shared space, then removes the share, then syncs the own space. A remove
  or a leave deletes no record: the data of the owner and the own data of the member stay.
- **SHARE-9** The group **Cuenta** of `Ajustes` has the row **Compartir lista**, below the email,
  when the session is approved. It opens the sheet **Compartir lista**, which shows one case:
  - the owner: each person of the space with the email and `Invitación enviada` or `Comparte la
    lista`, and **Quitar**; then the email field and **Invitar**;
  - an invitee: `<email> te invita a compartir su lista.`, the warning of SHARE-5, **Aceptar** and
    **Rechazar**;
  - a member: `Compartes la lista de <email>.` and **Dejar de compartir**.

  An error of an invite shows below the field: `share.error.self`, `share.error.taken`,
  `share.error.network`, `share.error.invalid`. While an invite waits, a banner over the list says
  who invites; its button opens the sheet. The sheet is a layer of NAV-25.

## Limits

- **SHARE-10** A share has no roles: each member changes all the data of the space; only the owner
  invites and removes. A share never merges two lists. Between people, as between two devices of
  one person, the last change to arrive wins for each record (SYNC-5), and of two items or recipes
  with one name the newer stays (SYNC-7).
