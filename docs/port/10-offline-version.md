# Offline use, version and deploy

The offline cache, the version line of **Ajustes**, the update, the release and the deploy. Source
modules: `sw.js`, `src/version.js`, `src/ui/settings.js` (`renderVersion`, `readVersion`,
`checkVersion`, `refreshShell`, `applyLanguage`), `src/app.js:306-313`, `version.json`,
`scripts/bump-version.mjs`, `scripts/release.mjs`, `scripts/changelog.mjs`, `.githooks/pre-push`,
`.github/workflows/pages.yml`, `manifest.webmanifest`.

A native app is offline by construction and is updated by its store. Most of the service worker
rules are dropped. The version comparison (VER-3, VER-7) is core if the port shows an update state.

## Service worker

**SW-1** [dropped] [untested] `src/app.js` registers `sw.js` at each start; with no service worker the app works with a connection only.
- Evidence: `src/app.js:308`.
- Reason: web offline mechanism. Replacement: nothing; the APK holds every resource.

**SW-2** [dropped] [verified] The app shell is the list `SHELL` of `sw.js` (page, stylesheets, font, manifest, each module of `src/`, each catalog, `version.json`, the app icons, the shortcut icons, `icons/logo.png`, the sprite `icons.svg`).
- Evidence: `sw.js:3-62`; tests: `tests/layers.test.js` "SHELL of sw.js has each module of src", "SHELL of sw.js has the style sheet and the icons"; `tests/vendor.test.js` "SHELL of sw.js has each vendored stylesheet", "SHELL of sw.js has each vendored file that the page loads", "SHELL caches the font of the design system".
- Reason: web cache list. Replacement: APK resources (`res/`, the Geist font in `res/font/`, vector drawables for the sprite).

**SW-3** [dropped] [untested] At install the worker downloads the full shell past the HTTP cache (`cache: 'reload'`), then takes control at once (`skipWaiting`, `clients.claim`).
- Evidence: `sw.js:89-97,102-109`.
- Reason: web update atomicity. Replacement: an APK update is atomic.

**SW-4** [dropped] [verified] At activation the worker deletes each cache whose name starts with `shopping-` and is not the current one (`shopping-shell-v19`) or `shopping-manifest`. A cache of another app of the origin (`lists-…`) stays.
- Evidence: `sw.js:1,99-109`; test: `tests/sw.test.js` "the activate keeps the caches of another app".
- Reason: cache versioning. Replacement: nothing.

**SW-5** [dropped] [untested] The worker answers only `GET` requests of its own origin.
- Evidence: `sw.js:160`.
- Reason: fetch interception. Replacement: nothing.

**SW-6** [dropped] [untested] A request is answered stale-while-revalidate, matched with no query (`ignoreSearch`); a fresh `ok` copy goes into the cache in the background.
- Evidence: `sw.js:111-137`.
- Reason: web cache. Replacement: nothing.

**SW-7** [dropped] [untested] A request with no cached copy goes to the network; a failed navigation is answered with the cached `index.html`.
- Evidence: `sw.js:128-136`.
- Reason: web cache. Replacement: nothing.

**SW-8** [dropped] [untested] A request with the `latest` parameter is not answered by the worker (network only, VER-5).
- Evidence: `sw.js:162`.
- Reason: web cache bypass. Replacement: the update check of VER-5 has its own mechanism.

**SW-9** [dropped] [untested] The message `{ type: 'refresh' }` downloads the full shell again and answers `{ ok: true }` or `{ ok: false }` on the message port.
- Evidence: `sw.js:181-188`.
- Reason: web update. Replacement: the store update flow (VER-8).

**SW-10** [dropped] [untested] A change of the stored state that an old module cannot read needs a new cache name, so that the worker loads the full shell again.
- Evidence: process rule; `sw.js:1`.
- Reason: a web shell can mix module versions. Replacement: nothing; migrations of the stored state stay (`08-storage.md`).

**SW-13** [dropped] [verified] At each start and language change the page sends `{ type: 'manifest', lang, name, description, shortcuts }` to the active worker, with `app.title`, `app.description` and the shortcut names (`add.item`, `list.active`, `nav.recipes`, `nav.menu`) keyed by the `open` name. The worker stores it in the cache `shopping-manifest` and answers `manifest.webmanifest` with `lang`, `name`, `description` and each shortcut name (matched by `[?&]open=<name>` of its `url`) replaced when the stored value is a non-empty string; other members stay. With no stored text, or a manifest that is not JSON, the file is answered as it is.
- Evidence: `src/ui/settings.js:106-116`, `sw.js:64-87,139-155,170-179`; tests: `tests/sw.test.js` "localizeManifest takes the language, the name and the description of the text", "localizeManifest keeps the short name and the other members", "localizeManifest with no text returns the manifest as it is", "localizeManifest ignores a member of the text that is not a non-empty string", "localizeManifest does not change its input", "localizeManifest takes the name of each shortcut from the text, by its open parameter", "localizeManifest keeps the name of a shortcut that the text has not as a non-empty string", "localizeManifest ignores shortcuts of the text that are not an object", "localizeManifest does not change the shortcuts of its input".
- Reason: a web manifest is one file for all languages. Replacement: the launcher label and the shortcut labels are string resources, so Android shows them in the current app locale with no extra step. Dynamic shortcuts (`ShortcutManagerCompat`) must be pushed again after a language change (SHORT-3).

### Result for the user

**SW-11** [dropped] [untested] After the first load with a connection, the app starts and works with no connection.
- Reason: a native app needs no first load. Replacement: the port works offline from the first start; no rule needs a network (PROD-4).

**SW-12** [dropped] [untested] A deploy shows at the second start after it; **Actualizar** shows it at once (VER-8).
- Reason: web cache lag. Replacement: a store update installs a new APK; the next start runs it.

## Version

**VER-1** [adapted] [verified] `version.json` holds `{ version, date }`: a semantic version `major.minor.patch` and an ISO 8601 date-time (the time of the bump, UTC, `toISOString`). `package.json` has the same version.
- Evidence: `version.json`, `scripts/bump-version.mjs:26-29`; test: `tests/release.test.js` "release bumps the patch, commits the bump and tags it".
- Target: `versionName = "X.Y.Z"` and a monotonic `versionCode` in `build.gradle.kts`, read from one source file. A proposal for the code: `major × 10000 + minor × 100 + patch` (Q-platform-5). The date becomes a build-time field (`BuildConfig`).

**VER-2** [adapted] [verified] `scripts/bump-version.mjs [major|minor|patch]` (default `patch`) is the only writer of `version.json` and of the version of `package.json`. An unknown level stops with exit code 1 and the text `Unknown level "<level>". Use one of: major, minor, patch.`. With no readable valid `version.json` the next version is `1.0.0`. A bump of a part adds one to it and sets the lower parts to zero. The same run releases `CHANGELOG.md` (VER-17). It prints the new version.
- Evidence: `scripts/bump-version.mjs:11-39`, `src/version.js:31-37`; tests: `tests/version.test.js` "nextVersion adds one to the patch by default and takes the date of the bump", "nextVersion sets the lower parts to zero for a minor and a major bump", "nextVersion starts at 1.0.0 when there is no version".
- Target: the same script, which also writes the version source of Gradle.

**VER-3** [core] [verified] A value is a version only when it is an object with `version` matching `^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$` (no leading zero, no prefix, no suffix) and `date` a text that `Date.parse` accepts. Other members are dropped. Anything else is "no version" (null): `1.2`, `1.2.3.4`, `v1.2.3`, `1.2.x`, `1.2.3-beta`, `01.2.3`, an empty text, a number, a date such as `yesterday`, `null`, a text, an array.
- Evidence: `src/version.js:4,10-16`; tests: `tests/version.test.js` "parseVersion keeps the version and the date", "parseVersion rejects a version that is not major.minor.patch", "parseVersion rejects a date that is not valid", "parseVersion rejects data that is not an object".
- Port: needed only if the port reads a version file (Q-platform-4). The date check: accept ISO 8601 (`Instant.parse` / `OffsetDateTime.parse`); `Date.parse` accepts more forms (Q-platform-6).

**VER-4** [adapted] [untested] At the start the app reads the running version (`version.json` from the cache). The foot of **Ajustes** shows `Versión X.Y.Z · <date>` (`version.running`), then the status sign (VER-6), as plain text outside a group. The date is in the locale of the screen (`pt-PT` for `pt`) with the fields day (numeric), month (short), hour and minute (2-digit), and the hour cycle of the locale: `23 oct, 22:48` (`es`), `Oct 23, 10:48 PM` (`en`), `23/10, 22:48` (`pt-PT`), `23 oct., 22:48` (`fr`), in the time zone of the device. With no version it shows `Versión desconocida` (`version.none`).
- Evidence: `src/app.js:310-313`, `src/ui/settings.js:48-53,68-75`, `index.html:137`.
- Target: `PackageInfo.versionName` and the build date (`BuildConfig`), formatted with `DateTimeFormatter.ofLocalizedDateTime` or a skeleton `d MMM HH:mm` in the app locale. The version is always known, so `version.none` has no case (keep the key for parity).

**VER-5** [adapted] [untested] Each time **Ajustes** opens, the app reads the deployed version (`version.json?latest=<time>`, `cache: 'no-store'`). The request ends after 8000 ms at most. A failed request, a non-`ok` answer or a value that is not a version gives "not known". `Comprobando…` (`version.checking`) shows while it runs.
- Evidence: `src/ui/nav.js:23`, `src/ui/settings.js:77-87`, `src/ui/context.js:45-46`.
- Target: Play In-App Updates (`AppUpdateManager.appUpdateInfo`) or a fetch of a release file; see Q-platform-4. Keep the 8 s limit.

**VER-6** [adapted] [untested] The status is a line sign after the version, in the colour of its case. Its text is the tooltip and is read by a screen reader; only the text of an update shows on screen:

  | Case | Sign | Colour | Text | Update notice |
  |---|---|---|---|---|
  | The check runs (VER-5) | `refresh`, spins | muted | `Comprobando…` (`version.checking`) | hidden |
  | The deployed version is newer than the running one | `download` | warning (amber) | `Versión X.Y.Z disponible` (`version.available`) | shows (VER-18) |
  | The same or older | `check-circle` | `--done` (green) | `Al día` (`version.current`) | hidden |
  | One of the two is not known | `offline` | danger (red) | `Sin conexión` (`version.unknown`) | hidden |

  The status is `outdated` only when the deployed version compares greater than the running one; else `current`; `unknown` when either is missing.
- Evidence: `src/version.js:25-28`, `src/ui/settings.js:46,54-61`, `index.html:137`, `styles.css:395-436` (at HEAD); tests: `tests/version.test.js` "versionStatus is current when the deployed version is the running version", "versionStatus is outdated when the deployed version is newer", "versionStatus is current when the running version is newer than the deployed version", "versionStatus is unknown when one side is missing".
- Target: a Compose row with an icon, `contentDescription` = the text; the spin is an infinite rotation. `versionStatus` ports as core.

**VER-7** [core] [verified] Two versions compare part by part as numbers, major first: `1.10.0` is newer than `1.9.0`, `1.2.10` newer than `1.2.9`, `2.0.0` newer than `1.99.99`; equal versions give 0.
- Evidence: `src/version.js:19-22`; test: `tests/version.test.js` "compareVersions compares each part as a number".
- Port: if the port compares `versionCode` integers only, this rule is not needed (Q-platform-4).

**VER-18** [adapted] [new] When the status is `outdated` (and no check runs), an update notice shows above the version line: the title `Versión X.Y.Z disponible` (`version.available`, the deployed version), the text `Tienes la {version}.` (`settings.updateReady`, the running version) and the wide primary button **Actualizar** (`settings.update`). In each other case the notice is hidden.
- Evidence: `src/ui/settings.js:60-65`, `index.html:131-134`; test: `tests/markup.test.js` "the update notice is a banner with a wide primary button above the version line" (markup only).
- Target: a banner composable in **Ajustes**, driven by the update state.

**VER-8** [adapted] [untested] **Actualizar** is disabled while it runs. It asks the worker to load the new shell and waits 15000 ms at most. On success the page loads again. On failure or time-out the button is enabled again and the message `No se pudo actualizar.` (`error.updateFailed`) shows for 3000 ms. With no worker in control the page loads again at once.
- Evidence: `src/ui/settings.js:89-104,201-209`, `src/ui/context.js:43-44`.
- Target: Play In-App Updates `startUpdateFlowForResult` (immediate or flexible), or an intent to the Play Store page / the APK download. On failure the same `error.updateFailed` message.

## Deploy

**VER-9** [dropped] [untested] The app is a static site served at `https://gekyzo.github.io/pwa-shopping-list/`. The push of a tag `v*` runs `.github/workflows/pages.yml`, which uploads the repository root of the tagged commit to GitHub Pages (environment `github-pages`, concurrency group `pages`, no cancel). A push to `main` deploys nothing.
- Evidence: `.github/workflows/pages.yml:7-33`.
- Reason: static-host deploy. Replacement: a tag workflow that builds a signed release (AAB for Play, or an APK attached to a GitHub release).

**VER-10** [adapted] [verified] `npm run release [-- minor|major]` (default `patch`) on `main`: (1) runs the bump (VER-2); (2) commits `version.json`, `package.json` and `CHANGELOG.md` only, with the message `Bump version to X.Y.Z`; (3) adds the annotated tag `vX.Y.Z` with the message `Version X.Y.Z`; (4) prints `Tagged vX.Y.Z. Deploy it: git push --follow-tags`. `git push --follow-tags` deploys.
- Evidence: `scripts/release.mjs:11,41-44`; tests: `tests/release.test.js` "release bumps the patch, commits the bump and tags it", "release takes a minor or a major step".
- Target: the same flow; the commit also holds the Gradle version source.

**VER-11** [adapted] [verified] A minor or a major step: `npm run release -- minor|major`.
- Evidence: `scripts/release.mjs:12`; test: `tests/release.test.js` "release takes a minor or a major step".

**VER-12** [adapted] [verified] The release stops with exit code 1, a `release: …` message on stderr, and writes nothing, in this order of checks: the level is unknown; the current branch is not `main`; the working tree has a change; with a remote `origin`, `git fetch origin main` fails (`could not fetch origin. Connect and try again.`) or `main` is behind `origin/main` (`main is N commit(s) behind origin/main. Run git pull --rebase first.`); the tag of the next version exists (`the tag vX.Y.Z exists already.`). A `main` ahead of `origin/main` passes.
- Evidence: `scripts/release.mjs:21-39`; tests: `tests/release.test.js` "release refuses an unknown level and changes nothing", "release refuses a branch that is not main", "release refuses a working tree with changes", "release refuses a version whose tag exists", "release refuses a main that is behind origin and writes nothing", "release accepts a main that is ahead of origin", "release refuses an origin that it cannot fetch and writes nothing".

**VER-13** [adapted] [untested] The hook `.githooks/pre-push` (enabled with `npm run hooks`, which sets `core.hooksPath`) stops the push of a tag `refs/tags/v*` whose commit has no `version.json` or a version other than the tag, with exit code 1 and `pre-push: the tag <tag> points at a commit with version.json <version|missing>.` A tag deletion and any other ref pass.
- Evidence: `.githooks/pre-push:10-23`, `package.json` `scripts.hooks`.
- Target: the same hook, with the version source of Gradle in place of (or in addition to) `version.json`.

**VER-17** [adapted] [verified] A bump releases `CHANGELOG.md`: the first line `## Unreleased` (exact, trailing blanks allowed; not `### Unreleased`, not `## Unreleased changes`) becomes `## X.Y.Z - YYYY-MM-DD`, with the local day of the bump, and `## Unreleased\n\nNo change.\n\n` goes above it. The file stays as it is when the section is empty or is only `No change` / `No change.`, when there is no such heading, or when the file does not exist.
- Evidence: `scripts/changelog.mjs:3-24`, `scripts/bump-version.mjs:31-38`; tests: `tests/changelog.test.js` "releaseChangelog gives the version and the date to the changes of Unreleased", "releaseChangelog keeps a changelog whose Unreleased has no change", "releaseChangelog keeps a changelog with no Unreleased heading", "releaseChangelog releases an Unreleased that is the last section", "releaseChangelog does not take a subheading or a longer heading for Unreleased", "localDate gives the day of the date in the local time zone".
- Target: unchanged tooling; the released section can also feed the Play "What's new" text.

## Installation

**VER-14** [dropped] [stale] Spec: "It runs `standalone`, in portrait, with `start_url` and `scope` `./` and `id` `/shopping-list/`." Code: the manifest has `display: standalone`, `orientation: any` (the app turns with the device, INS-4), `start_url` and `scope` `./`, `id` `/shopping-list/`, `lang` `es`, `background_color` and `theme_color` `#f4f3f1`.
- Evidence: `manifest.webmanifest:5-12`; tests: `tests/spec.test.js` "the manifest id is the path of the deploy, unique on a shared origin (VER-14)", "the installed app turns with the device (INS-4)".
- Reason: web install. Replacement: install from Play or an APK. No `screenOrientation` lock in `AndroidManifest.xml` (follows INS-4). The splash and window background take `#f4f3f1` in light theme.

**VER-15** [adapted] [untested] The app icons are `icons/icon-192.png`, `icon-512.png` and `icon-maskable-512.png` (art inside a circle of radius 0.4 of the side), drawn by `npm run icons` from `icons/source.png`: an orange shopping bag with bread, greens, a tomato and milk, on white. `icons/logo.png` (288 px) is the same art with the white that touches the edge made transparent. The shortcut icons `icons/shortcut-<name>.png` (192 px) are a white line icon of `icons.svg` on a disc of the theme colour.
- Evidence: `manifest.webmanifest:13-23`, `scripts/make-icons.mjs`.
- Target: an adaptive launcher icon (`mipmap-anydpi-v26`, foreground from the maskable art, white background, monochrome layer for themed icons). Shortcut icons: `IconCompat` from vector drawables (the same line icons), on the shortcut's adaptive background.

**VER-16** [dropped] [untested] The installed app and the site in Chrome share one storage; **Clear site data** and the uninstall remove it.
- Reason: web origin storage. Replacement: app-private storage; **Clear storage** and the uninstall remove it. Android Auto Backup can bring the data back after a reinstall (Q-platform-7).

## Limits

No message that says a new version is ready (apart from the **Ajustes** notice). No way back to an older
version. No list of changes in the app.
