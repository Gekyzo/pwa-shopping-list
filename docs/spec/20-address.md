# The move to the new address

Rules of `src/move.js` and `src/ui/move.js`. The app moved from
`https://polaris-works.github.io/pwa-shopping-list/` (the old address) to
`https://bodega.artisandevs.duckdns.org/` (the new address, VER-9). Both serve the same files, and
the browser keeps the data of each origin apart (VER-16), so the data moves by a copy.

- **ADDR-1** On the old address (`polaris-works.github.io`) the app shows a full screen over the list:
  the app moved to the new address, and one button, **Mover mis datos**. The screen has no close,
  and the app does not leave by itself. On any other host the screen never shows.
- **ADDR-2** A session never goes into a URL. With a session, the button first sends the changes
  that are not sent, of both lanes (SYNC-3, SHARE-12), then opens the new address with no data:
  the user signs in there and gets the account (SYNC-8). Offline, the screen says that the move
  waits for the connection, and it goes on when the device is online. With no pending changes it
  opens the new address at once.
- **ADDR-3** With no session, the button packs the backup that Export writes (BACKUP rules, the own
  list only, SYNC-9) into the fragment `#import=<data>`, compressed (`deflate-raw`) and in
  base64url, and opens the new address with the query of the old one. The fragment never reaches a
  server.
- **ADDR-4** When the fragment would pass 1 000 000 characters, the button opens no address: the
  screen asks the user to export, then to import the file on the new address.
- **ADDR-5** At the start, the new address reads `#import=` and removes the fragment from the URL
  before anything else, so a reload or the back button imports nothing. Data that is not a backup
  gets the error of Import (BACKUP rules) as a message, and the state stays as it was.
- **ADDR-6** A backup that arrives on an app with no data is imported, with the message that the
  data moved and an undo. On an app with data the app asks first whether to replace this device's
  data; No keeps it. The move never merges.
- **ADDR-7** The old address keeps its data: the move copies it.
- **ADDR-8** After a move, the new address tells the user to install the new address and to remove
  the icon of the old one.
