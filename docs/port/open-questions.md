# Open questions

Decisions for the user before or during the port. Each entry gives the evidence and the options;
none is resolved here. **Weight** is how much the question blocks the port.

## Most blocking

| Question | Why it blocks |
|---|---|
| | **Decided on 2026-10-23:** Q-domain-6 (a), Q-dsv-1 (b), Q-platform-4 (a), Q-platform-8 (b). See each entry. |
| [Q-data-1](#q-data-1-where-the-state-lives-on-android) | The storage of the state (one JSON document, DataStore or Room) shapes the data layer and the import of an old backup. |
| [Q-domain-6](#q-domain-6-the-rename-of-an-aisle-in-secciones-de-la-tienda-is-broken) | The source has a defect in AISLE-12. Parity with the defect or with the rule. |
| [Q-dsv-1](#q-dsv-1-material-3-or-a-custom-theme) | Material 3 or a custom theme decides how every component of `15-design-system.md` is built. |
| [Q-platform-4](#q-platform-4-the-update-check-of-ajustes) | The update check of `Ajustes` (NAV-27, VER-*) has no web-free equivalent; Play In-App Updates, an APK check, or nothing. |
| [Q-platform-8](#q-platform-8-arrival-reminder-external-automation-or-in-app-geofence) | The arrival reminder (ARR-*) is external automation today; an in-app geofence adds permissions and background location. |

Related entries that one answer settles together:
- Collation of names: Q-domain-1, Q-arrange-1; also Q-domain-2, Q-domain-3, Q-data-3.
- Android Auto Backup: Q-data-9, Q-platform-7.
- Orientation and desktop: Q-data-12.
- Voice: Q-platform-10. The VOICE rules describe the branch `voice-commands`, not `main`.

## Product, data model and storage (PROD, DATA, STORE, BACKUP)

### Q-data-1 Where the state lives on Android

**Evidence:** The web app keeps the full state as one JSON text under `shopping.v1` and writes it whole at each change (`src/storage.js:195-202`, `src/ui/context.js:202-211`). Undo keeps the full previous state (`src/ui/context.js:214-225`). Import replaces the full state. Every list is ordered (items, recipes, products, shops of an item, aisles, sent). See `docs/port/data-contract.md` section 8.

**Options:**
1. One JSON document (DataStore with a JSON serializer, or a file with atomic replace), same text as the export.
2. Room tables with position columns; JSON only for import and export.
3. One JSON document now; Room later if a feature needs queries.

**Blocks:** STORE-1, STORE-2, STORE-5, STORE-16, BACKUP-1, BACKUP-5, BACKUP-7.

**Weight:** high

### Q-data-2 Where the preferences live

**Evidence:** Eight `localStorage` keys outside the state (`src/storage.js:221-417`); the default removes the key (STORE-12). `shopping.lang` stores a language code or nothing (follow the phone).

**Options:**
1. Preferences DataStore, one key each.
2. Fields of the same document as the state, kept out of the export.
3. Android per-app language (`AppCompatDelegate.setApplicationLocales`, Android 13+ system setting) for the language; DataStore for the rest.

**Blocks:** STORE-12, STORE-13, STORE-14, STORE-15, BACKUP-7.

**Weight:** medium

### Q-data-3 Parity of trim and lower case

**Evidence:** Identity and validation use ECMAScript `trim()` and `toLowerCase()` (`src/storage.js:17`, `src/store.js:25`). ECMAScript `trim()` removes the BOM `U+FEFF` and the Unicode space separators; Kotlin `String.trim()` uses `Char.isWhitespace`, which does not match `U+FEFF`. `toLowerCase()` has no locale; Kotlin `lowercase()` uses `Locale.ROOT`, which should match. A difference changes which imported files are valid (duplicate names) and how names are stored.

**Options:**
1. Write a trim with the exact ECMAScript white-space set; use `lowercase()`.
2. Use Kotlin `trim()` and `lowercase()`; accept rare differences.
3. Option 1, plus parity tests built from the JS tests.

**Blocks:** DATA-3, DATA-4, DATA-5, DATA-8, DATA-14, DATA-22, STORE-6, STORE-7.

**Weight:** medium

### Q-data-4 Repairs not tied to a version

**Evidence:** `normalizeItem` and `groupOf` read `next`, `again` and `grouped` in every version (`src/storage.js:41-45,88-91`); only version 1 ignores `recipes` (`src/storage.js:146`). A version 9 file with `again: true` on a ticked one-time item loses its tick on import.

**Options:**
1. Port as is (one normalisation for all versions).
2. Tie each repair to the versions that had the field.

**Blocks:** STORE-8, STORE-17, BACKUP-4.

**Weight:** low

### Q-data-5 Write timing and write failure on Android

**Evidence:** The web app writes synchronously in the same task as the change and shows `error.notSaved` at once when `setItem` throws (`src/ui/context.js:208,221`). DataStore and Room write asynchronously; the error comes later, after the render.

**Options:**
1. Write asynchronously; show `error.notSaved` when the write fails, after the fact.
2. Wait for the write before the screen shows the change.
3. Serialise writes in one queue; the last state always wins; show the message on failure.

**Blocks:** STORE-2, STORE-9.

**Weight:** medium

### Q-data-6 The corrupt copy

**Evidence:** An invalid stored text goes to `shopping.v1.corrupt` (`src/storage.js:188`); nothing reads it, and the next load of another invalid text overwrites it. The user cannot see it.

**Options:**
1. Keep a raw copy in a second file, as the web app does.
2. Keep it and offer it as an export in `Ajustes`.
3. Drop it; log only.

**Blocks:** STORE-5.

**Weight:** low

### Q-data-7 No storage at the start

**Evidence:** When `window.localStorage` throws, the app runs in memory and shows `error.noStorage` at the start (`src/ui/context.js:56-62`, `src/app.js:306`). App-private storage on Android is always present.

**Options:**
1. Drop the case; keep `error.notSaved` for write errors.
2. Show `error.noStorage` when the first read fails with an I/O error.

**Blocks:** STORE-10.

**Weight:** low

### Q-data-8 File export and import mechanism

**Evidence:** Export is a browser download with a fixed name `compra-YYYY-MM-DD-HHMMSS.json` and MIME `application/json` (`src/ui/settings.js:153-162`). Import is a file input with `accept="application/json,.json"` (`index.html:410`). On Android, some file managers report a `.json` file as `application/octet-stream` or `text/plain`.

**Options:**
1. SAF `ACTION_CREATE_DOCUMENT` (suggested name) and `ACTION_OPEN_DOCUMENT` with `application/json` only.
2. Same, but the import accepts `*/*` and lets `importJson` decide (`error.invalidJson`, `error.notBackup`).
3. Export through the share sheet; import through SAF.

**Blocks:** BACKUP-1, BACKUP-3.

**Weight:** medium

### Q-data-9 Android Auto Backup

**Evidence:** The web app has no automatic backup; the uninstall deletes the lists (`docs/spec/08-storage.md` "Loss of data", "Limits"). Android Auto Backup copies app data to the Google account by default.

**Options:**
1. Disable it (`allowBackup="false"`): same as the web app.
2. Enable it for the state only, not the flags.
3. Enable it for all data.

**Blocks:** STORE-15 (a restored state counts as not new), BACKUP-7.

**Weight:** medium

### Q-data-10 Validation of a recipe link

**Evidence:** `isWebUrl` uses the WHATWG `URL` parser, then a host-name regular expression (`src/recipes.js:47-60`). The WHATWG parser lowers the host and turns a Unicode host into punycode (`xn--`); `java.net.URI` and `android.net.Uri` do not. The normalisation drops a link that fails (`src/storage.js:107`).

**Options:**
1. Use OkHttp `HttpUrl` (WHATWG-like) then the same expression.
2. Use `java.net.URI` with `IDN.toASCII` on the host, then the same expression.
3. Port the expression only and accept differences on rare hosts.

**Blocks:** DATA-20, STORE-7.

**Weight:** medium

### Q-data-11 Length limits only on the screen

**Evidence:** Only the dish has a data limit (80, `src/storage.js:112`). The other limits are `maxlength` of inputs (`index.html`: 80, 20, 40). An imported file can hold longer names; the screen keeps them.

**Options:**
1. Port as is: limits on the text fields only.
2. Also enforce the limits in the model, and cut or reject on import.

**Blocks:** DATA-21.

**Weight:** low

### Q-data-12 Desktop use and orientation

**Evidence:** PROD-2 names a desktop browser with a mouse; PROD-3 and INS-4 (`manifest.webmanifest:10`, `orientation: any`) let the app turn with the device, with a layout for portrait.

**Options:**
1. Phone only; follow the rotation with the portrait layout.
2. Phone only; lock to portrait.
3. Also support tablets and landscape layouts.

**Blocks:** PROD-2, PROD-3.

**Weight:** low

### Q-data-13 Moving the data from the web app to the port

**Evidence:** The data is in the `localStorage` of the browser origin; a native app cannot read it. The only path is the backup file (BACKUP-1, BACKUP-4).

**Options:**
1. The user exports in the web app and imports in the port; nothing else.
2. The walkthrough of the port offers **Importar** on the first start.
3. Option 2, plus a text in the last web release that points to the export.

**Blocks:** BACKUP-3, BACKUP-4, STORE-15.

**Weight:** medium

### Q-data-14 JSON parser edge cases

**Evidence:** `JSON.parse` accepts `1.0` where an integer is expected (`Number.isInteger(1.0)` is true, so `version: 9.0` and `day: 1.0` are valid), keeps the last of two equal keys, and `file.text()` drops a UTF-8 BOM. Kotlin parsers can differ on each point (`src/storage.js:116,144,174-180`, `src/ui/settings.js:214`).

**Options:**
1. Parse to a generic JSON tree and apply the rules by hand (number checks as in JS).
2. Use typed decoding with lenient settings and accept differences.

**Blocks:** STORE-6, BACKUP-3, BACKUP-4.

**Weight:** low

## Lists and arrange (LIST, TRIP, ADD, SORT, GROUP, MOVE)

### Q-lists-1 Accents: duplicate check vs add-sheet matching

**Evidence**: `nameError` and `findByName` compare with `toLowerCase()` only (`src/store.js:25-27,162-165`); the add-sheet rows and their rank use `fold` (NFD, no diacritics) (`src/store.js:135-140,168-180`). Typing `jamon` with `Jamón` stored shows `+ Crear «jamon»` and `Jamón` (rank 0) together; a tap on create adds a second item `jamon`. The test "an exact match (any case or accent) has no create row" checks case only. Also, the exact set of `\p{Diacritic}` differs from `\p{Mn}` on the JVM.

**Options**:
1. Port as is: duplicate by lower-case only, rows by fold.
2. Make the duplicate check and `findByName` use fold too (a behaviour change to agree with the test name).
3. Keep as is, and port `fold` with the exact Unicode `Diacritic` property (ICU `UCharacter.hasBinaryProperty(DIACRITIC)`).

**Blocks**: LIST-2, LIST-5, ADD-2, ADD-4, ADD-5.

**Weight**: medium

### Q-lists-2 The add message hides a failed save

**Evidence**: `apply` returns true when the store accepts the change, also when the save fails and it shows `error.notSaved` (`src/ui/context.js:214-224`). `addNew` then shows `toast.addedTo` over it (`src/ui/add.js:127-128`).

**Options**:
1. Port as is.
2. Show `error.notSaved` and not `toast.addedTo` when the save fails.

**Blocks**: ADD-7.

**Weight**: low

### Q-lists-3 Enter on a blank add field

**Evidence**: **Añadir** is disabled while the text is blank (`src/ui/add.js:24`). The keyboard Enter submits the form; HTML skips an implicit submit when the default button is disabled, so nothing happens. This depends on browser behaviour.

**Options**:
1. The keyboard action does nothing on a blank field.
2. The keyboard action runs the submit and the store shows `error.nameRequired`.

**Blocks**: ADD-1, ADD-5.

**Weight**: low

### Q-lists-4 Width breakpoint of the search button

**Evidence**: the header search button hides below 600 px by a CSS `:has(.dock:not([hidden]))` rule (`styles.css:82-90` at HEAD); the dock shows only in `Compra` with an item.

**Options**:
1. `WindowSizeClass` compact (< 600 dp) → dock search; medium and up → header search.
2. Always the dock search on a phone.

**Blocks**: LIST-20, LIST-37.

**Weight**: low

### Q-arrange-1 Spanish collation on the JVM

**Evidence**: `localeCompare(b, 'es', { sensitivity: 'base' })` (`src/store.js:122`). The JVM `Collator` for `es` at PRIMARY strength can differ from ICU in the browser (for example on `ñ` vs `n`, and on punctuation and digits).

**Options**:
1. `java.text.Collator(Locale("es"))`, PRIMARY.
2. `android.icu.text.Collator` (ICU, closer to the browser), PRIMARY.
3. Port the test list as the acceptance check and choose whichever passes.

**Blocks**: SORT-6, GROUP-11, MOVE-9.

**Weight**: medium

### Q-arrange-2 An open Deshacer across a change of order or group

**Evidence**: a change of `sort` or `group` calls `commit` and does not touch the message (`src/ui/arrange.js:103,136`, `src/ui/context.js:201-211`). An open `Deshacer` of an earlier change (for example a tick) then restores the state before that change, which also undoes the new `sort` or `group`.

**Options**:
1. Port as is.
2. Hide the open message at a change of order or group.
3. Keep `sort` and `group` out of the undo snapshot.

**Blocks**: SORT-9, GROUP-4.

**Weight**: low

### Q-arrange-3 An item whose aisle is not in `aisles`

**Evidence**: `aisleGroups` puts an item in a group only by exact `item.aisle === aisle`, and in `Sin sección` only when `item.aisle` is empty (`src/aisles.js:88-94`). The load trims `aisle` but does not check it against `aisles` (`src/storage.js:54`). Such an item shows in no row of the list by aisle, but it makes **Secciones** a choice (`src/ui/view.js:30`).

**Options**:
1. Port as is (the item is hidden in that view).
2. Show it under `Sin sección`.
3. Clear such an aisle at load (a `08-storage.md` rule).

**Blocks**: GROUP-17, GROUP-18, GROUP-2.

**Weight**: low

### Q-arrange-4 Closed groups and process death

**Evidence**: the closed groups and the open state of `Comprados (N)` live in memory "until the app starts again" (`src/ui/context.js:147-149`). Android can kill the process in the background and restore the activity.

**Options**:
1. Plain view-model state: a restore opens every group.
2. `SavedStateHandle`: a restore keeps the closed groups; a cold start opens them.

**Blocks**: GROUP-16, LIST-12.

**Weight**: low

### Q-arrange-5 Hold time of the lift

**Evidence**: `HOLD_MS = 400` (`src/ui/context.js:38`). Compose `detectDragGesturesAfterLongPress` uses `ViewConfiguration.longPressTimeoutMillis` (system, often 400–500 ms, user-adjustable in accessibility settings).

**Options**:
1. A fixed 400 ms.
2. The system long-press timeout.

**Blocks**: MOVE-1, MOVE-2.

**Weight**: medium

### Q-arrange-6 Mouse lift with no hold

**Evidence**: a mouse lifts a row by a 10 px vertical drag with no hold (`src/ui/drag.js:110-131`). On Android a mouse is rare (ChromeOS, DeX).

**Options**:
1. Drop: every pointer needs the hold.
2. Port: `PointerType.Mouse` lifts on a vertical drag of 10 dp.

**Blocks**: MOVE-1.

**Weight**: low

### Q-arrange-7 Edge-scroll speed

**Evidence**: 8 px per `requestAnimationFrame` (`src/ui/context.js:41`, `src/ui/drag.js:25-34`): 480 px/s at 60 Hz, 960 px/s at 120 Hz.

**Options**:
1. 8 dp per frame (speed follows the refresh rate, as in the browser).
2. 480 dp/s, scaled by frame time.
3. The default of the reorder library in use.

**Blocks**: MOVE-7.

**Weight**: low

### Q-arrange-8 What cancels a drag

**Evidence**: each render of the screen ends a move with no change (`src/app.js:81`), because the DOM rows are built again. A render comes from any state change: a message timeout does not render, but an undo, an arrival at the shop, an import or a change of language do. Compose recomposes without losing the dragged row.

**Options**:
1. Cancel a drag on any change of `items` (or of the list in view) that is not the drag itself.
2. Cancel only on navigation, `Escape`/back and pointer cancel; let other changes recompose under the drag.
3. Cancel on any state change, as the web does.

**Blocks**: MOVE-11.

**Weight**: medium

## Shops, recipes, menu and aisles (SHOP, REC, MENU, AISLE)

### Q-domain-1 Shop name order: `localeCompare('es', base)` vs a Kotlin `Collator`

**Evidence**: `src/store.js:122` `compareNames = (a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })`, used by `src/shops.js:13` for the shop chips, the shop groups, the edit-sheet chips and the suggestions. Test `tests/shops.test.js` "shopNames gives each shop in use one time, in name order" expects `['árbol', 'beta', 'Zeta']`. V8 uses ICU with the CLDR `es` tailoring (`ñ` after `n`). `java.text.Collator.getInstance(Locale("es"))` on the JVM uses the JDK rules, and `android.icu.text.Collator` uses ICU; the two can differ for `ñ`, `ll`, punctuation and digits. Ties at base strength (`Lidl`/`lidl` cannot both exist, but `Ávila`/`avila` can) keep the input order in JS (stable sort).
**Options**: (a) `android.icu.text.Collator.getInstance(ULocale("es"))`, strength `PRIMARY`, in the app and in JVM tests via ICU4J; (b) `java.text.Collator` `PRIMARY` and accept small differences; (c) a fixed fold-then-compare (`fold(a).compareTo(fold(b))`) that is locale-free, and change the web to match.
**Blocks**: SHOP-6, SHOP-16, SHOP-23, SHOP-26, SHOP-30, GROUP-11.
**Weight**: medium

### Q-domain-2 The search fold: `NFD` + `\p{Diacritic}` has no direct Java regex equivalent

**Evidence**: `src/store.js:135-140` `fold = trim → toLowerCase → normalize('NFD') → replace(/\p{Diacritic}/gu, '')`. Used by `searchRecipes` (`src/recipes.js:190`), `productSuggestions` (`src/recipes.js:159`), `menuDishes` (`src/menu.js:56`), `matchesItem` (AISLE-9). `ñ` folds to `n`. Java regex supports `\p{M}` / `\p{Mn}` but not the `Diacritic` binary property; the two sets differ (`Diacritic` includes spacing modifiers such as `^`, `` ` ``, `¨`, and excludes some combining marks).
**Options**: (a) `java.text.Normalizer.normalize(s, NFD)` then remove `\p{Mn}`, and accept the edge differences; (b) ICU `UnicodeSet("[:Diacritic:]")` on Android (`android.icu`) and ICU4J in JVM tests, for exact parity; (c) a fixed table of Latin accents only.
**Blocks**: REC-10, REC-24, AISLE-9, MENU-16, REC-36.
**Weight**: medium

### Q-domain-3 Name keys use plain `toLowerCase` with no Unicode normalisation

**Evidence**: `src/shops.js:6`, `src/aisles.js:8`, `src/recipes.js:16`, `src/recipes.js:76`, `src/store.js:163`, `src/menu.js:43`. JS `toLowerCase()` is locale-free. A composed `é` (U+00E9) and a decomposed `e` + U+0301 are two keys, so two shops, two aisles or two items can look the same. Kotlin `lowercase()` uses `Locale.ROOT` and matches JS for most text; Android keyboards and imported JSON can give either form.
**Options**: (a) port as is (`lowercase()`, no normalisation) for parity; (b) normalise to NFC at every input and at import on both platforms; (c) normalise to NFC on Android only.
**Blocks**: SHOP-3, SHOP-4, SHOP-5, REC-2, REC-8, REC-18, AISLE-2, AISLE-7, MENU-17.
**Weight**: low

### Q-domain-4 Link check rests on the WHATWG `URL` parser

**Evidence**: `src/recipes.js:47-60` `isWebUrl` checks `new URL(text).protocol` and `url.hostname` against `HOST`. The browser parser lowercases the host, converts an international name to punycode (`https://ñam.es/receta` passes as `xn--am-zja.es`), and decodes or rejects percent-escapes in the host (`https://%20.com` fails). Test `tests/recipes.test.js` "isWebUrl needs a host name with a dot and no space" lists 12 invalid and 5 valid texts. `java.net.URI` does not apply IDNA and rejects some texts that `URL` takes; `android.net.Uri` parses with no check; `okhttp3.HttpUrl` is close to WHATWG.
**Options**: (a) `HttpUrl.parse` (OkHttp) then the same `HOST` regex on `host`; (b) `java.net.URI` + `java.net.IDN.toASCII(host)` then the regex; (c) a hand parser for `scheme://host[:port][/…]` only.
**Blocks**: REC-14, STORE-7.
**Weight**: medium

### Q-domain-5 A link with a port and no scheme is rejected

**Evidence**: `src/recipes.js:67` treats any leading `letter[letters digits + . -]*:` as a scheme. `cocina.es:8080/receta` has the "scheme" `cocina.es:` and gives `error.invalidLink`, while `https://cocina.es:8080/receta` is valid (test "isWebUrl needs a host name with a dot and no space"). Untested for the no-scheme case.
**Options**: (a) port as is; (b) add `https://` also when the "scheme" holds a dot, on both platforms.
**Blocks**: REC-14.
**Weight**: low

### Q-domain-6 The rename of an aisle in `Secciones de la tienda` is broken

**Evidence**: `src/ui/aisles.js:33` calls `bindField(input, () => …, (value) => …)`; `src/ui/controls.js:56` is `bindField = (input, { read, write, onSaved = () => {} })` since commit `6e87f39`. `read` is undefined; `blur` and `keydown` (`Enter`, `Escape`) throw `TypeError`. No test covers `src/ui/aisles.js`. The spec (AISLE-12) and the core (`renameAisle`, tested) both say a rename works.
**Options**: (a) the port implements the spec behaviour (rename on focus loss or IME action, `Escape`/back restores) and the web gets a one-line fix; (b) the port follows the code and has no rename in the sheet (delete and add again).
**Blocks**: AISLE-12, AISLE-4 (screen path).
**Weight**: high

**Decision (2026-10-23):** (a). The port follows the spec. The web app is fixed: `src/ui/aisles.js:33` passes `{ read, write }`, and `tests/controls.test.js` guards every call of `bindField`.

### Q-domain-7 The pick of a shop suggestion depends on `datalist` events

**Evidence**: `src/ui/edit.js:100-104` treats an `input` event with `inputType` `insertReplacementText` or `undefined` as a pick from the `datalist`, and adds the shop at once when the value is a suggestion. The browsers send different `inputType` values; on some, a typed text that equals a suggestion may also add at once. Android has no `datalist`.
**Options**: (a) an `ExposedDropdownMenuBox` whose item click adds the shop; typing never adds; (b) suggestion chips below the field, as the product field of REC-10 does.
**Blocks**: SHOP-11.
**Weight**: low

### Q-domain-8 Weekday names come from `Intl.DateTimeFormat`

**Evidence**: `src/ui/menu.js:9` formats 1 January 2024 + day with `weekday: 'long' | 'short'` in `intlTag(lang)`; `styles.css:471-473` makes the first letter upper case. ICU in V8 and `java.time.DayOfWeek.getDisplayName` can give different short forms (`lun` vs `lun.`) and cases in some of the 7 languages. The title `Comida del lunes` (`menu.title`) uses the long name as is, in lower case in Spanish.
**Options**: (a) `DayOfWeek.getDisplayName(TextStyle.FULL/SHORT, locale)` and accept small differences; (b) fixed weekday strings in the string resources of each locale; (c) `android.icu.text.DateFormatSymbols` for ICU parity.
**Blocks**: MENU-9, MENU-11.
**Weight**: low

### Q-domain-9 `Receta creada` shows also when no recipe is created

**Evidence**: `src/ui/recipes.js:129-134` always shows `toast.recipeCreated`. `dishRecipe` (`src/menu.js:47`) takes a recipe that exists when its name matches (test "dishRecipe takes the recipe of the same name when it exists"), and then no recipe is created. The toast also uses the name passed in, not the name of the recipe that the meals take.
**Options**: (a) port as is; (b) show a different message (for example "Comidas enlazadas a «name».") when the recipe existed.
**Blocks**: MENU-21, REC-37, MENU-19.
**Weight**: low

## Screen and install (NAV, ROW, MSG, A11Y, ONB, INS)

### Q-screen-1 What "ends an edit" means on a change of section (NAV-2)

**Evidence**: `src/ui/nav.js:16-24` resets `openId`, `query`, `searchOpen`, `mealOpen`, `recipeId`, `shopPickOpen` and blurs the search field. It does not reset `editId`, `sheetOpen`, `arrangeOpen` or `aislesOpen`. On the web a sheet veil covers the bar, so a tap on the bar cannot happen while the edit sheet is open. On Android, a `ModalBottomSheet` is its own window, so the same holds; a side sheet from 840 dp may not cover the rail.

**Options**:
1. A change of section closes every sheet (simple, safe).
2. Port the exact set of the code; leave other sheets open (they cannot be reached).
3. Drop "ends an edit" from the spec.

**Blocks**: NAV-2, NAV-8.

**Weight**: low

### Q-screen-2 The back of the phone while the walkthrough is open (NAV-25, ONB-5)

**Evidence**: `src/app.js:207-218`: `popstate` returns early while `ui.onboarding !== null`. `holdBack` (`src/app.js:62-73`) pushes an entry only for a sheet, a row or a search, so with the walkthrough open and nothing else open there is no entry: the back of the phone leaves the app (or goes back in the browser). `Escape` closes the walkthrough (`src/app.js:237-238`).

**Options**:
1. Back closes the walkthrough as **Saltar** does (writes `shopping.onboarded`).
2. Back goes to the previous page; on page 1 it closes the walkthrough.
3. Back leaves the app, as on the web today (the walkthrough shows again at the next start, ONB-7).

**Blocks**: NAV-25, ONB-5, ONB-7.

**Weight**: medium

### Q-screen-3 Drag-to-dismiss thresholds of a sheet (NAV-23)

**Evidence**: `vendor/design-system/sheet.js:4-9`: closes past 30 % of the height or above 0.5 px/ms (over the last 100 ms). The drag starts only on the grab or the head, not on its controls. Material 3 `ModalBottomSheet` uses its own positional and velocity thresholds and lets the body content drag the sheet too (nested scroll).

**Options**:
1. Use `ModalBottomSheet` defaults and accept other thresholds.
2. Custom `SheetState` / `AnchoredDraggable` with the 30 % and 0.5 dp/ms rules, drag only from the head.
3. `ModalBottomSheet` with `sheetGesturesEnabled = false` and a custom drag on the head.

**Blocks**: NAV-23.

**Weight**: low

### Q-screen-4 Colour of the system bars with a forced theme (NAV-16)

**Evidence**: `index.html:6-7`: the `theme-color` follows `prefers-color-scheme` only, so with **Tema** `Oscuro` on a light phone the status bar stays light (`#f4f3f1`). This is a browser limit, not a choice that the spec motivates.

**Options**:
1. Port as is: bar colours and icon contrast follow the phone.
2. Bars follow the theme of the app (edge-to-edge with `SystemBarStyle` from the chosen theme).

**Blocks**: NAV-16.

**Weight**: low

### Q-screen-5 Where the message shows while a sheet is open (MSG-9)

**Evidence**: `vendor/design-system/design-system.css:1144-1148` moves the toast to the top while a sheet layer shows. In Compose a `ModalBottomSheet` is a separate window above the `Scaffold`, so a `SnackbarHost` of the scaffold is under the scrim.

**Options**:
1. A second `SnackbarHost` inside the sheet content, at its top.
2. One host in a top-level overlay window above all sheets.
3. Show the message at the bottom inside the sheet.

**Blocks**: MSG-1, MSG-9, NAV-22 (the `Deshacer` of **Eliminar**).

**Weight**: medium

### Q-screen-6 Message times and accessibility timeouts (MSG-2)

**Evidence**: `src/ui/context.js:26-29`: fixed 3000, 5000 and 10000 ms. Android has `AccessibilityManager.getRecommendedTimeoutMillis` for content with controls (the `Deshacer` button), and Material snackbars with an action may stay longer under TalkBack.

**Options**:
1. Fixed times, as on the web.
2. Fixed times as the minimum, extended by the recommended timeout.
3. With TalkBack on, a message with `Deshacer` stays until dismissed.

**Blocks**: MSG-2, MSG-3.

**Weight**: low

### Q-screen-7 Size of the `+` button in `Compacta` (NAV-20)

**Evidence**: the spec says the `+` button is 48 px in `Compacta`. The design system gives the floating `+` a fixed 56 px (`vendor/design-system/design-system.css:1709-1716`) and the dock `+` a fixed 48 px (`:1902-1907`); neither follows `--tap-l`.

**Options**:
1. Port the code: the floating `+` stays 56 dp in both densities.
2. Port the spec: the floating `+` is 48 dp in `Compacta`.

**Blocks**: NAV-20, NAV-24.

**Weight**: low

### Q-screen-8 Side actions of a row for TalkBack (A11Y-4, ROW-3)

**Evidence**: the side actions are reachable only after a slide (`src/ui/rows.js:207`), and the spec Limits say there is no keyboard way to open them. With TalkBack on Android a horizontal slide on a row is not a normal gesture. On the web, **Editar** of the row and **Eliminar** in the edit sheet give a second way, but **Repetir** is only in the side menu and the edit switch.

**Options**:
1. Port as is: the edit button and the edit sheet are the accessible path.
2. Add `customActions` (Editar, Repetir / No repetir, Eliminar, and the tick) to each row's semantics.

**Blocks**: A11Y-4, ROW-3, ROW-11.

**Weight**: medium

### Q-screen-9 Section slide on a phone with gesture navigation (NAV-3, NAV-4)

**Evidence**: the slide starts anywhere on the header and the content (`src/ui/nav.js:37-51`). On Android with gesture navigation, a horizontal slide from the screen edge is the system back (and predictive back). The web app inside Chrome has the same conflict, but the native app must decide its system-gesture exclusion.

**Options**:
1. Leave the edges to the system; the section slide starts only away from the edges.
2. Exclude the content area from system gestures (`Modifier.systemGestureExclusion`, limited to 200 dp per edge).

**Blocks**: NAV-3, NAV-4, ONB-4.

**Weight**: medium

### Q-screen-10 A failed save during `Deshacer` (MSG-3, MSG-8)

**Evidence**: `src/app.js:248-257`: the undo calls `commit(undoState)` and ignores its result, then hides the message. A failed write during an undo shows no `error.notSaved`, while `apply` shows it for other changes (`src/ui/context.js:221`).

**Options**:
1. Port as is (no message on a failed undo save).
2. Show `error.notSaved` after a failed undo save, as for each other change.

**Blocks**: MSG-3, MSG-8.

**Weight**: low

## Languages, offline and version, integrations (LANG, SW, VER, ARR, SHORT, VOICE)

### Q-platform-1 Who resolves the language: the app or Android
**Evidence**: `src/i18n.js:28-35` resolves by base subtag over `navigator.languages`; Android resolves resources itself over the device `LocaleList` (with its own parent and region fallbacks), and plural rules and date forms follow the full device locale. With device `pt-BR` and no app choice, Android shows `values-pt` text but the Brazilian plural rule (0 → `one`), against LANG-10.
**Options**: (a) let Android resolve and accept the `pt-BR` plural difference; (b) at each start with no app choice, run `resolveLanguage` and set `setApplicationLocales` to the resolved tag (`pt` → `pt-PT`) without storing it; (c) wrap the `Context` with a resolved `Configuration` locale at each start.
**Blocks**: LANG-2, LANG-10, LANG-11.
**Weight**: medium

### Q-platform-2 Lint MissingQuantity for `many`
**Evidence**: CLDR gives `es`, `ca`, `fr`, `it`, `pt` the category `many`; the catalogs have only `one`/`other` (`tests/i18n.test.js` "a plural entry has the forms one and other, and no entry is empty"). Android falls back to `other`, but lint can report a missing `many`.
**Options**: (a) suppress `MissingQuantity` for these files; (b) add `many` items equal to `other` in the generated XML; (c) keep the warning.
**Blocks**: LANG-7, LANG-19.
**Weight**: low

### Q-platform-3 Pseudo-locale source
**Evidence**: `?lang=pseudo` pseudo-translates the Spanish catalog (`src/i18n.js:52-55`); Android pseudolocales `en-XA`/`ar-XB` work on the default (English) resources and have no address parameter.
**Options**: (a) use `en-XA` and accept English as the source; (b) make `values/` Spanish (breaks LANG-11 fallback to English); (c) a debug-only text wrapper that applies the `pseudo` function to Spanish strings; (d) drop LANG-18.
**Blocks**: LANG-18.
**Weight**: low

### Q-platform-4 The update check of Ajustes
**Evidence**: VER-5 reads `version.json?latest=` from the host and compares semantic versions (`src/version.js:19-28`, `src/ui/settings.js:77-87`); VER-18 shows the deployed version name. Play In-App Updates gives `availableVersionCode` (an integer), not a version name, and works only for Play installs. A sideloaded APK has no store check.
**Options**: (a) Play In-App Updates, show "update available" without a version name (change VER-6/VER-18 texts); (b) fetch a `version.json` of the latest GitHub release and keep VER-3/VER-7 as core; (c) drop the check and the notice (Play updates on its own); (d) (a) plus `versionName` from the Play listing where known.
**Blocks**: VER-3, VER-5, VER-6, VER-7, VER-8, VER-18.
**Weight**: high

**Decision (2026-10-23):** (a). Play In-App Updates. The update notice shows "update available" with no version name; VER-6 and VER-18 change their text in the port.

### Q-platform-5 The versionCode scheme
**Evidence**: the web has only `major.minor.patch` (`version.json`); Android needs a monotonic integer `versionCode` in addition to `versionName`.
**Options**: (a) `major × 10000 + minor × 100 + patch` (limits minor and patch to 99); (b) a counter that the release script increments; (c) the commit count of `main`.
**Blocks**: VER-1, VER-2, VER-10, VER-13.
**Weight**: medium

### Q-platform-6 The validity of the version date
**Evidence**: `parseVersion` accepts any `date` that `Date.parse` accepts (`src/version.js:14`), a browser-dependent set; the writer always writes `toISOString()`.
**Options**: (a) accept ISO 8601 only (`Instant.parse`); (b) accept ISO 8601 date or date-time (`OffsetDateTime`/`LocalDate`); (c) drop the date check when the version comes from the build.
**Blocks**: VER-3.
**Weight**: low

### Q-platform-7 Android Auto Backup of the data
**Evidence**: VER-16 and BACKUP rules say an uninstall removes the data and the backup file is the only copy; the language is a device preference (LANG-5). Android Auto Backup is on by default and restores app data (and on Android 13+ the per-app locale) after a reinstall.
**Options**: (a) `android:allowBackup="false"`; (b) allow backup of the state only, exclude preferences (`dataExtractionRules`); (c) allow everything and update the spec.
**Blocks**: VER-16, LANG-5.
**Weight**: medium

### Q-platform-8 Arrival reminder: external automation or in-app geofence
**Evidence**: ARR-* rely on an automation app that opens `…/?arrival` (`src/app.js:284-288`); the spec gives the reason ("A PWA gets a position only while it is open"), which a native app does not have. The limits state "no geolocation in the app, no system notification".
**Options**: (a) keep the external trigger: a deep link or intent extra `arrival`, no location code (ARR-5 holds); (b) in-app geofences (`GeofencingClient`, `ACCESS_BACKGROUND_LOCATION`, a notification with the ARR-1 text that opens the app); (c) both.
**Blocks**: ARR-1, ARR-2, ARR-4, ARR-5.
**Weight**: high

**Decision (2026-10-23):** (b). In-app geofences: `GeofencingClient`, `ACCESS_FINE_LOCATION` and `ACCESS_BACKGROUND_LOCATION`, and a notification with the ARR-1 text that opens `Compra`. The port needs the place of each shop, which the state does not hold today (a new field; see `data-contract.md`).

### Q-platform-9 A shortcut or an arrival while the app runs
**Evidence**: on the web each shortcut or `?arrival` is a new page load, so the start code (`src/app.js:281-305`) runs on a fresh screen. On Android a running activity gets `onNewIntent` with an open sheet, a search or a walkthrough on screen.
**Options**: (a) close every layer, then apply as a fresh start; (b) apply only the section change and keep the layers; (c) ignore the intent while the walkthrough shows (as the web keeps the walkthrough on top).
**Blocks**: SHORT-2, SHORT-5, ARR-1, ARR-4.
**Weight**: medium

### Q-platform-10 Voice in the port
**Evidence**: voice is only on the branch `voice-commands`, 360 commits behind `main`; the spec says a native app is the route to "Ok Google" / Gemini (App Actions, AppFunctions on Android 16).
**Options**: (a) no voice in the port (parity with `main`); (b) port the branch design with `SpeechRecognizer` and `TextToSpeech`; (c) App Actions built-in intents only; (d) AppFunctions for Gemini.
**Blocks**: VOICE-1 … VOICE-8.
**Weight**: medium

### Q-platform-11 The address of the arrival link
**Evidence**: existing automations open `https://gekyzo.github.io/pwa-shopping-list/?arrival`. An Android App Link for it needs `/.well-known/assetlinks.json` at the root of `gekyzo.github.io`, outside this repository.
**Options**: (a) a custom scheme (`bodega://arrival`) and a change of the automation; (b) App Link with `assetlinks.json` in the user site repository; (c) an explicit intent from the automation app (package + extra), no URL.
**Blocks**: ARR-1, SHORT-1.
**Weight**: low

## Engineering, modules and design system (ENG, MOD, DSV)

### Q-eng-1 Reference identity for "no change"
**Evidence:** ENG-3; `src/store.js:120`, `src/recipes.js:92`, `src/shops.js:31-45` return the same object, and callers compare with `===` (e.g. `src/ui/recipes.js:20`, `src/ui/menu.js:60`).
**Options:** (a) keep reference identity in Kotlin (`===`) and return the input instance; (b) return an explicit `changed: Boolean` in every result type; (c) compare with structural `==` (cost: a deep compare on each tap).
**Blocks:** ENG-3, ENG-1.
**Weight:** medium

### Q-eng-2 Error type shape
**Evidence:** ENG-2; `src/store.js:15`; messages are catalog keys with free params (`{ name, list }`).
**Options:** (a) `data class Message(key: String, params: Map<String, Any>)`, keys equal to the web keys; (b) a sealed class with one subclass per error key and typed params; (c) (b) plus a mapper to `R.string` ids.
**Blocks:** ENG-2, and every rule that names an `error.*` key.
**Weight:** medium

### Q-eng-3 Module split and the dependency check
**Evidence:** ENG-6, ENG-7, ENG-16; `tests/layers.test.js`, `tests/aliases.test.js`.
**Options:** (a) Gradle modules `:core` (pure JVM), `:data`, `:app`, the graph as the check; (b) one module with packages and a Konsist test; (c) one module with ArchUnit tests.
**Blocks:** ENG-6, ENG-16, ENG-12.
**Weight:** low

### Q-eng-4 Port of the spec-sync test and the pre-commit hook
**Evidence:** ENG-12, ENG-13; `tests/spec.test.js`, `.githooks/pre-commit`.
**Options:** (a) the Android repo keeps `docs/spec/` and a JVM test of the same facts; (b) it uses `docs/port/` as its spec and drops the web-only checks; (c) no spec test, review only.
**Blocks:** ENG-12 to ENG-15.
**Weight:** low

### Q-eng-5 Debug log on Android
**Evidence:** ENG-17; `src/ui/context.js:99-123` — the trigger is the host name of the dev server.
**Options:** (a) `BuildConfig.DEBUG` builds log to Logcat with tag `shopping`; (b) also keep an in-memory log that a debug menu copies to the clipboard (as `copy(shoppingLog...)`); (c) no debug log.
**Blocks:** ENG-17.
**Weight:** low

### Q-dsv-1 Material 3 or a custom theme
**Evidence:** DSV-10, DSV-21; the shared look is not Material: chips radius 6, buttons radius 8, toast is an `ink` box, nav current item is a `secondary` pill.
**Options:** (a) `MaterialTheme` with mapped colours and shapes, plus overrides per component; (b) a custom theme (`CompositionLocal`s) and own composables on Foundation; (c) Material components where they match, own composables for item rows, dock, toast.
**Blocks:** DSV-10 to DSV-24.
**Weight:** high

**Decision (2026-10-23):** (b). A custom theme: own `CompositionLocal`s for the tokens of `15-design-system.md`, and own composables on Compose Foundation. Material components are not the base.

### Q-dsv-2 Dynamic colour
**Evidence:** DSV-9, DSV-10 fix the colours; Android 12+ offers wallpaper-based dynamic colour.
**Options:** (a) no dynamic colour, exact tokens; (b) dynamic colour as an opt-in setting; (c) dynamic colour by default.
**Blocks:** DSV-9, DSV-10.
**Weight:** low

### Q-dsv-3 Height breakpoint of 480
**Evidence:** DSV-7; CSS `max-height: 480px` includes 480; Compose `WindowHeightSizeClass.COMPACT` is below 480 dp.
**Options:** (a) use the size class (480 dp exactly counts as medium); (b) compare the height to `<= 480.dp` directly.
**Blocks:** DSV-7.
**Weight:** low

### Q-dsv-4 Launcher icon art
**Evidence:** DSV-17; `icons/source.png` is a raster with a white ground; the maskable icon uses scale 0.64 against the web safe circle (radius 0.4); Android adaptive icons need a 66/108 dp safe zone and a monochrome layer for themed icons (Android 13+).
**Options:** (a) foreground from `source.png` with the white cleared (as `clearWhite`), white background layer; (b) redraw the art as a vector drawable; (c) the art on a coloured (`#1f7a4d`) background.
**Blocks:** DSV-17, DSV-18, DSV-19.
**Weight:** medium

### Q-dsv-5 Native select rows of Ajustes
**Evidence:** DSV-23 `list-group`; `styles.css:743-751` lays a real `<select>` over the row, so a tap opens the native picker of the browser.
**Options:** (a) a `DropdownMenu` anchored to the row; (b) a dialog with radio buttons; (c) a bottom sheet with the choices.
**Blocks:** DSV-23, NAV-11, NAV-15, NAV-19 (area `07-screen`).
**Weight:** medium

### Q-dsv-6 Font scale
**Evidence:** DSV-12 sizes are in rem, which follow the browser font size; the layout reserves fixed room (onboarding text 5 lines, title 2 lines, item label 2 lines).
**Options:** (a) `sp` everywhere, layout grows with the system font scale; (b) `sp` with a cap on the scale for fixed-room parts; (c) `dp` for fixed-room parts.
**Blocks:** DSV-12, DSV-24.
**Weight:** low
