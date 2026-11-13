# Install

Rules of `src/install.js`, `src/ui/install.js`, the `orientation` of `manifest.webmanifest` and the
Android wrapper of `twa/`.

- **INS-1** The install offer has three states: `idle` (no offer), `available` (Chrome gave
  `beforeinstallprompt`) and `installed`. `installNext` moves among them: `prompt` makes it
  `available`, `dismissed` makes it `idle` until the next prompt, and `installed` is final.
- **INS-2** Settings shows the group **Aplicación**, its title and its button **Instalar la
  aplicación**, only in the state `available` (NAV-6). A tap shows the prompt of Chrome. An accepted prompt makes the state `installed`; a dismissed one
  makes it `idle`.
- **INS-3** An app that starts in `display-mode: standalone` starts `installed`. The event
  `appinstalled` also makes it `installed`, whoever started the install.
- **INS-4** The installed app turns with the device (`orientation: any` in `manifest.webmanifest`),
  so a tablet or an unfolded phone shows it the right way up on its side. The layout of each width
  is in DSV-8.

## Android app

- **INS-5** The Android app is a Trusted Web Activity with id `io.github.polarisworks.bodega`. It opens
  `https://bodega.polarisworks.duckdns.org/` in Chrome, full screen, with Chrome's storage for that
  origin (VER-16). Version 1.0.0 opened the legacy `https://bodega.artisandevs.duckdns.org/`. It holds no code and no copy of the shell: a site release reaches it as it
  reaches the installed PWA.
- **INS-6** `.well-known/assetlinks.json` grants `delegate_permission/common.handle_all_urls` to
  `io.github.polarisworks.bodega`, with the SHA-256 fingerprint of each key that signs a published build:
  the upload key, and on Play the app signing key of Play too. Its fingerprints are those of
  `twa/twa-manifest.json`. Without a match, Chrome shows the app with a URL bar.
- **INS-7** `twa/twa-manifest.json` is the only source of the wrapper. Its name, launcher name,
  colours, icons, orientation and shortcuts are those of `manifest.webmanifest`, and its dark
  colours are the dark `theme-color` of `index.html`; Android adds one
  more shortcut, the site settings of Chrome, which the launcher of the wrapper needs. `npm run apk`
  builds the project from it, and the project is never committed.
- **INS-8** A wrapper release is a build of `npm run apk` with a new version in both
  `appVersionName` and `appVersion` (Bubblewrap builds with the second) and an `appVersionCode` 1
  higher; `npm run apk` stops when the two names differ. Its tag is `twa-vX.Y.Z`, never `vX.Y.Z` (VER-9), and its GitHub
  Release carries the signed APK. A change of the site needs no wrapper release.

## Limits

No banner and no toast offer the install. Chrome may never give the prompt, for example on a
second visit after a dismiss; the menu **Add to Home screen → Install** of Chrome still works
(VER-14).
