# Integrations

The start parameters that other apps and the launcher use: the reminder at the shop (`?arrival`),
the launcher shortcuts (`?open=<name>`), and the voice commands (not on `main`). Source modules:
`src/store.js` (`arrivalMessage`), `src/sections.js` (`SHORTCUTS`, `shortcutStart`),
`src/app.js:281-305`, `src/ui/settings.js:106-116`, `src/ui/context.js:28-29`,
`manifest.webmanifest`.

## Reminder at the shop

A PWA gets no position while it is closed, so an Android automation app (MacroDroid, Tasker) owns
the geofence and opens `https://gekyzo.github.io/pwa-shopping-list/?arrival`. The app holds no
coordinates. A native port can own the geofence itself (Q-platform-8).

**ARR-1** [adapted] [verified] A start with the parameter `arrival` (any value or none) shows the message `toast.arrival` with `count` = the number of items of `Compra` that are not ticked (recurrent items included) and `list` = the name of `Compra` in the language of the screen: `N artículos por comprar en Compra.` (plural by N). The message has no **Deshacer**.
- Evidence: `src/store.js:222-225,195-205`, `src/app.js:284-288`, `src/ui/context.js:88-92`; tests: `tests/store.test.js` "arrivalMessage counts the items of Active that are not bought", "arrivalMessage uses the singular for one item".
- Target: an intent extra or a deep link (`bodega://open?arrival` or an App Link to the same path) handled in `onCreate` and `onNewIntent`; with an in-app geofence, the tap on its notification carries the same extra (Q-platform-8). `arrivalMessage` ports as core.

**ARR-2** [adapted] [untested] The message stays 10000 ms (`ARRIVAL_MS`), against 3000 ms for a plain message, because the app opened by itself.
- Evidence: `src/ui/context.js:27-29`, `src/app.js:287`.
- Target: a snackbar with a custom duration of 10 s (`SnackbarDuration.Indefinite` plus a timed dismiss).

**ARR-3** [core] [verified] With no item left to buy (no item of `Compra`, or each one ticked) the app shows no message.
- Evidence: `src/store.js:224`; test: `tests/store.test.js` "arrivalMessage is null when no item of Active is left".

**ARR-4** [adapted] [untested] At the start the app removes `arrival` (and `open`, SHORT-5) from the address at once, keeps each other parameter and the hash, and adds no history entry. A reload then shows no message.
- Evidence: `src/app.js:292-300`.
- Target: consume the extra once (clear it from the `Intent` after handling, and do not handle it again after a configuration change or a recreation from saved state).

**ARR-5** [adapted] [untested] The repository holds no coordinates. The place, the radius and the accuracy belong to whatever owns the geofence.
- Evidence: no location code in `src/`.
- Target: if the port owns the geofence, the places are user data (Q-platform-8); none are built in.

**ARR-6** [core] [new] When the storage is not available, the start message `error.noStorage` comes after the arrival message and replaces it (one message shows at a time).
- Evidence: `src/app.js:285-288,306`, `src/ui/context.js:178-186`.

Setup of the automation app today: install the app from Chrome first, so that Android opens the URL
in the installed app; trigger a geofence on entry, radius 100 to 150 m; action: open the URL above;
location permission **Allow all the time**; no battery optimisation.

Limits: no geolocation in the app, no system notification, one message for each place, no setting to
turn the message off.

## Launcher shortcuts

A long press on the launcher icon shows the shortcuts. Android reads them from the manifest when
Chrome installs or updates the app.

**SHORT-1** [adapted] [verified] The app has four shortcuts, in this order: **Añadir artículo** (`open=add`), **Compra** (`open=active`), **Recetas** (`open=recipes`), **Menú** (`open=menu`).
- Evidence: `manifest.webmanifest:18-23`, `src/sections.js:41-43`; test: `tests/sections.test.js` "SHORTCUTS has each shortcut of the manifest, in its order".
- Target: static shortcuts in `res/xml/shortcuts.xml` (`<shortcut android:shortcutId="add|active|recipes|menu">`, `shortcutShortLabel` from string resources), each with an explicit `Intent` to the main activity with an extra `open=<name>`. Static shortcuts follow the app locale on their own (SHORT-3).

**SHORT-2** [core] [verified] A start with `open=<name>` shows that section: `add` shows `Compra` and opens the add sheet there; `active`, `recipes` and `menu` show that section with no sheet. Any other value (including `settings`, an empty value, `toString`) is ignored. While the walkthrough of a first start shows, the section changes below it and the add sheet does not open.
- Evidence: `src/sections.js:45-50`, `src/app.js:291,301-305`; tests: `tests/sections.test.js` "shortcutStart opens the add sheet of Compra for add", "shortcutStart opens the section of a section shortcut, with no sheet", "shortcutStart is null for an unknown name, for settings and for no name" (the walkthrough case: untested).
- Port: `shortcutStart` as a pure function; the activity applies it in `onCreate` and in `onNewIntent` (a shortcut tap while the app runs; see Q-platform-9).

**SHORT-3** [adapted] [verified] The names of the shortcuts are the texts `add.item`, `list.active`, `nav.recipes` and `nav.menu` in the language of the screen.
- Evidence: `src/ui/settings.js:106-116`, `sw.js:72-79`; tests: `tests/sw.test.js` "localizeManifest takes the name of each shortcut from the text, by its open parameter".
- Target: `android:shortcutShortLabel="@string/add_item"` etc.; the launcher resolves them in the app locale. Dynamic shortcuts would need `ShortcutManagerCompat.updateShortcuts` after each language change.

**SHORT-4** [adapted] [untested] Each shortcut has an icon: the line icon of its action, white on a disc of the theme colour (192 px PNG today, VER-15).
- Evidence: `manifest.webmanifest:19-22`, `scripts/make-icons.mjs`.
- Target: an adaptive shortcut icon (`android:icon` vector drawable, white glyph on the theme colour), the same four glyphs.

**SHORT-5** [adapted] [untested] The app removes `open` from the address at once and keeps each other parameter, as ARR-4. The removal happens before the add sheet opens, so the history entry of the sheet comes after an address with no query.
- Evidence: `src/app.js:292-300`.
- Target: consume the extra once, as ARR-4.

Limits: Android shows a change of the web shortcuts, or of their names, only after the next update
check of Chrome. The web shortcuts work offline because the worker ignores the query (SW-6). Both
limits disappear with static shortcuts.

## Voice commands

Status: **not on `main`**. The work is on the branch `voice-commands` (3 commits; it adds
`src/voice-commands.js`, `src/voice.js` and their tests, and a fifth manifest shortcut `./?voice`).
At commit 45dabc4 that branch is 360 commits behind `main`. No voice code is in `src/` on `main`, so
the port has no voice feature unless that branch is merged or the feature is decided again
(Q-platform-10). The rules state the design of the branch.

**VOICE-1** [adapted] [stale] Spec: "The user speaks one command in Spanish (`es-ES`) for each tap, and the app says the answer." Code on `main`: no voice input.
- Evidence: no `SpeechRecognition` in `src/` at HEAD; branch `voice-commands:src/voice.js`.
- Target (if kept): `SpeechRecognizer` / `RecognizerIntent.ACTION_RECOGNIZE_SPEECH` and `TextToSpeech`, in the language of the screen.

**VOICE-2** [core] [stale] Spec: the commands are add items, hear what is left to buy, tick an item, delete an item, end the trip. Code on `main`: none.
- Evidence: branch `voice-commands:src/voice-commands.js`.

**VOICE-3** [core] [stale] Spec: a delete and the end of the trip ask for a spoken «sí» first; a tick and an add do not ask (`Deshacer` is sufficient). Code on `main`: none.
- Evidence: branch `voice-commands:src/voice-commands.js`.

**VOICE-4** [core] [stale] Spec: a spoken name selects the item with that exact name, else each item whose name contains it, with no case or accent distinction; two matches or more make a question. Code on `main`: none.
- Evidence: branch `voice-commands:src/voice-commands.js`.

**VOICE-5** [core] [stale] Spec: « y » and the comma separate items: «macarrones y queso» makes two items. Code on `main`: none.
- Evidence: branch `voice-commands:src/voice-commands.js`.

**VOICE-6** [core] [stale] Spec: a change goes through the same path as a tap, so it is saved and has `Deshacer`. Code on `main`: none.
- Evidence: branch `voice-commands:src/app.js`.

**VOICE-7** [adapted] [stale] Spec: a start with `?voice` begins a conversation; the shortcut **Hablar** opens it. Code on `main`: the manifest has four shortcuts and no `voice` entry; `shortcutStart('voice')` is null.
- Evidence: `manifest.webmanifest:18-23`, `src/sections.js:43`; branch `voice-commands:manifest.webmanifest:18`.
- Target (if kept): a fifth static shortcut with an extra `voice`; for the phone assistant, App Actions (`shortcuts.xml` `<capability>` with a built-in intent such as `actions.intent.CREATE_ITEM_LIST` / `GET_THING`) or AppFunctions on Android 16 (Q-platform-10).

**VOICE-8** [core] [stale] Spec: `src/voice-commands.js` is pure, `interpret(state, text, { pending })` answers `{ state, reply, pending }`; `src/voice.js` wraps the speech classes, given as parameters. Code on `main`: neither module exists.
- Evidence: `ls src/` at HEAD; branch `voice-commands`.

Limits of that design: Chrome sends the audio to a Google server, so a recognition needs a
connection. A native `SpeechRecognizer` can run on device (`EXTRA_PREFER_OFFLINE`, on-device
recognizer on Android 13+), which removes that limit.

### "Ok Google" and Gemini

The aim of the user is the phone assistant as the only chat that adds to the list and reads it. A
web app cannot register a command with it. A native app can: App Actions with built-in intents
(documented for Google Assistant), or AppFunctions for Gemini (Android 16). This is the main gain of a
native port for this area and is not decided (Q-platform-10).
