# Contributing

How Bodega is specified, built, tested and released. To use the app, see the
[README](README.md).

## Specification

| Subject | Document |
|---|---|
| Purpose, user, constraints, what the app does not do | [01-product](docs/spec/01-product.md) |
| The list `Compra`, the trip and the add sheet | [03-lists](docs/spec/03-lists.md) |
| Order, groups, shops and store sections | [04-arrange](docs/spec/04-arrange.md), [05-shops](docs/spec/05-shops.md), [17-aisles](docs/spec/17-aisles.md) |
| Recipes and the menu of the week | [06-recipes](docs/spec/06-recipes.md), [13-menu](docs/spec/13-menu.md) |
| Sections, gestures, messages, undo and the walkthrough | [07-screen](docs/spec/07-screen.md) |
| Accounts, sync and sharing | [18-account-sync](docs/spec/18-account-sync.md), [19-sharing](docs/spec/19-sharing.md) |
| The stored format and the backup | [02-data-model](docs/spec/02-data-model.md), [08-storage](docs/spec/08-storage.md) |
| Languages | [09-languages](docs/spec/09-languages.md) |
| Offline use, version, update and installation | [10-offline-version](docs/spec/10-offline-version.md), [16-install](docs/spec/16-install.md) |
| Reminder at the shop, shortcuts and voice | [11-integrations](docs/spec/11-integrations.md) |
| Modules, code rules, tests and the design system | [12-engineering](docs/spec/12-engineering.md), [15-design-system](docs/spec/15-design-system.md) |

The full index, with the rule prefixes and the words of the app, is
[`docs/spec/README.md`](docs/spec/README.md).

## Develop

Plain HTML, CSS and ES modules, with no build step and no dependencies. Node 20 or later.

```sh
npm run hooks    # enable the git hooks of .githooks/ (one time)
npm test         # unit tests
npm run test:features  # the Gherkin scenarios of tests/features/, as a tree
npm run serve    # http://localhost:8080
npm run pair     # two users on :8081 and :8082 (docs/two-users.md)
npm run release  # bump, commit and tag vX.Y.Z; git push --follow-tags deploys
npm run apk      # build the signed APK and AAB of the Android app into twa/out/
```

A change of behaviour changes its rule in `docs/spec/` in the same commit. The deploy is in
[10-offline-version](docs/spec/10-offline-version.md) (VER-9), the design system in
[15-design-system](docs/spec/15-design-system.md).

## Android app

The Android app is a Trusted Web Activity: Chrome opens the deployed site full screen
([16-install](docs/spec/16-install.md), INS-5). `twa/twa-manifest.json` is its only source; Bubblewrap
generates the rest of `twa/`, which git ignores (INS-7).

Prerequisites, one time:

- JDK 17 at `/usr/lib/jvm/java-17-openjdk-amd64` and the Android SDK at `~/Android/Sdk`, named in
  `~/.bubblewrap/config.json`. Bubblewrap 1.27 wants `tools/` at the SDK root
  (`ln -s cmdline-tools/latest ~/Android/Sdk/tools`) and build-tools `36.1.0`.
- The signing key `~/.local/share/bodega/android.keystore`, alias `bodega`, outside the
  repository. Keep the keystore file and its password in the password manager: a lost key means
  no update can be published again.

Set the password from the password manager, with no quoting and no shell history:

```sh
read -rsp 'Keystore password: ' BUBBLEWRAP_KEYSTORE_PASSWORD; echo
export BUBBLEWRAP_KEYSTORE_PASSWORD BUBBLEWRAP_KEY_PASSWORD="$BUBBLEWRAP_KEYSTORE_PASSWORD"
```

The key was made from that variable, so the keystore and the password manager cannot differ:

```sh
keytool -genkeypair -keystore ~/.local/share/bodega/android.keystore -alias bodega \
  -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Bodega" \
  -storepass:env BUBBLEWRAP_KEYSTORE_PASSWORD
```

Build:

```sh
npm run apk      # twa/out/bodega-<version>.apk and .aab, both signed
```

Release a new wrapper (INS-8), only when `twa/` changes; a site release needs none:

1. In `twa/twa-manifest.json`, set `appVersionName` and `appVersion` to the new version and add 1
   to `appVersionCode`.
2. `npm run apk`, then install the APK on the phone and check it.
3. Commit, then `git tag -a twa-vX.Y.Z -m "Android wrapper X.Y.Z"` and `git push --follow-tags`.
   Never a `vX.Y.Z` tag: that one deploys the site.
4. `gh release create twa-vX.Y.Z twa/out/bodega-X.Y.Z.apk --title "Bodega Android X.Y.Z"`.

`npm run apk` signs the files itself: Bubblewrap 1.27 passes the passwords through a shell, which
changes a `$`, a backtick or a `\` in them.
