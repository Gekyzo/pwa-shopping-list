# Offline use, version and deploy

Rules of `sw.js`, `src/version.js`, `version.json`, `scripts/bump-version.mjs`,
`.githooks/pre-push` and `manifest.webmanifest`.

## Service worker

- **SW-1** `src/app.js` registers `sw.js` at each start. With no service worker the app works with
  a connection only.
- **SW-2** The app shell is the list `SHELL` of `sw.js`: the page, the styles, the manifest, each
  module of `src/`, each catalog, `version.json` and the icons. A file that the app loads and that
  is not in `SHELL` does not work offline at the first start.
- **SW-3** At its install the worker downloads the full shell past the HTTP cache, so the shell is
  never a mix of two deploys. It then takes control at once (`skipWaiting`, `clients.claim`).
- **SW-4** At its activation the worker deletes each cache that is not the current one. The cache
  name is `shopping-shell-v8`.
- **SW-5** The worker answers only `GET` requests of its own origin.
- **SW-6** A request is answered stale-while-revalidate: the cached copy at once, and a fresh copy
  goes into the cache in the background for the next start. The query of the URL is ignored for
  the match.
- **SW-7** A request with no cached copy goes to the network. If a navigation fails, the worker
  answers with the cached `index.html`.
- **SW-8** A request with the `latest` parameter goes to the network only (VER-5).
- **SW-9** The message `{ type: 'refresh' }` downloads the full shell again and answers `{ ok }`
  on the message port.
- **SW-10** A change of the stored state that an old module cannot read needs a new cache name, so
  that the worker loads the full shell again.

### Result for the user

- **SW-11** After the first load with a connection, the app starts and works with no connection.
- **SW-12** A deploy shows at the second start after it: the first start downloads the new files
  in the background. **Actualizar** shows it at once (VER-8).

## Version

- **VER-1** `version.json` holds `{ version, date }`: a semantic version `major.minor.patch` and
  an ISO date. `package.json` has the same version.
- **VER-2** `scripts/bump-version.mjs` is the only writer of the two files. With no valid
  `version.json` the next version is `1.0.0`. A bump of a part sets the lower parts to zero.
  The same run releases `CHANGELOG.md` (VER-17).
- **VER-3** A value that is not `{ version, date }` with a valid version and a valid date is "no
  version".
- **VER-4** At the start the app reads `version.json` from the cache: the running version.
  **Ajustes → Versión** shows `Versión X.Y.Z · date`, the date in the form of the language, or
  `Versión desconocida`.
- **VER-5** When `Ajustes` opens, the app reads `version.json?latest=<time>` from the host: the
  deployed version. The request ends after 8 seconds at most. `Comprobando…` shows in that time.
- **VER-6** The status is:

  | Case | Text | **Actualizar** |
  |---|---|---|
  | The deployed version is newer than the running one | `Versión X.Y.Z disponible` | Shows |
  | It is the same or older | `Al día` | Hidden |
  | One of the two is not known | `Sin conexión` | Hidden |

- **VER-7** Two versions compare by number, part by part: `1.10.0` is newer than `1.9.0`.
- **VER-8** **Actualizar** sends `refresh` to the worker and waits 15 seconds at most. On success
  the page loads again, with the new shell. On failure the message is `No se pudo actualizar.`
  With no worker in control the page loads again at once.

## Deploy

- **VER-9** The app is a static site: the repository root, served over HTTPS. GitHub Pages serves
  `main` / root at `https://gekyzo.github.io/shopping-list/`. A push to `main` is a deploy.
- **VER-10** Each deploy has a new version. The hook `.githooks/pre-push`, enabled one time in
  each clone with `npm run hooks`, does this at a push to `main`:
  1. If the push has no change of `version.json`, it adds one to the patch, sets the date, and
     makes the commit `Bump version to X.Y.Z` with `version.json`, `package.json` and
     `CHANGELOG.md` only.
  2. It stops the push, because a hook cannot add a commit to the push that runs.
  3. The second `git push` passes.
- **VER-11** A push that has a change of `version.json` already passes at the first try. For a
  minor or a major step: `node scripts/bump-version.mjs minor|major`, then a commit.
- **VER-12** The hook stops with an error, and writes nothing, when the current branch is not
  `main`, the pushed commit is not `HEAD`, or `version.json`, `package.json` or `CHANGELOG.md`
  has a change that is not committed.
- **VER-13** `git push --no-verify`, and a clone without `npm run hooks`, deploy with the old
  version. **Versión** then cannot show that deploy as new.
- **VER-17** A bump releases `CHANGELOG.md`: the heading `## Unreleased` becomes
  `## X.Y.Z - YYYY-MM-DD`, with the new version and the local day of the bump, and a new
  `## Unreleased` with the text `No change.` goes above it. The file stays as it is when
  `Unreleased` has no change or the file has no such heading. A deployed version with no change
  for the user has no entry.

## Installation

- **VER-14** The manifest makes the app installable from Chrome: **Add to Home screen →
  Install**. It runs `standalone`, in portrait, with `start_url` and `scope` `./`.
- **VER-15** The icons are `icons/icon-192.png`, `icon-512.png` and `icon-maskable-512.png`,
  written by `npm run icons` from the art of `icons/source.png`: a bag of vegetables on white.
  The tab shows `icon-192.png`. The art of the maskable icon stays in the safe zone, a circle
  of radius 0.4 of the side.
- **VER-16** The installed app and the site in Chrome share one storage. The data of the installed
  app goes away with **Clear site data** and with the uninstall.

## Limits

No message that says a new version is ready. No way back to an older version. No list of changes.
