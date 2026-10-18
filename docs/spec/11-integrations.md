# Integrations

## Reminder at the shop

Status: on `main`. Rules of `arrivalMessage` in `src/store.js` and of the start of `src/app.js`.

A PWA gets a position only while it is open, so it cannot detect an arrival. An Android automation
app (MacroDroid, Tasker) owns the geofence and opens the app with a parameter.

- **ARR-1** A start with `?arrival` in the URL shows `N artículos por comprar en Compra.`, in the
  language of the screen, where N is the count of items of `Compra` that are not ticked.
- **ARR-2** The message stays 10 seconds, because the app opened by itself.
- **ARR-3** With nothing left to buy the app shows no message.
- **ARR-4** The app removes `arrival` from the URL at once and keeps each other parameter, so a
  reload is silent.
- **ARR-5** The repository holds no coordinates. The place, the radius and the accuracy belong to
  the automation app.

Setup of the automation app: install the app from Chrome first, so that Android opens the URL in
the installed app and its data. Trigger: a geofence on entry, radius 100 to 150 m. Action: open
`https://gekyzo.github.io/pwa-shopping-list/?arrival`. The automation app needs the location
permission **Allow all the time** and no battery optimisation.

Limits: no geolocation in the app, no system notification, one message for each place, no setting
to turn the message off.

## Launcher shortcuts

Status: on `main`. Rules of `SHORTCUTS` and `shortcutStart` in `src/sections.js`, of `shortcuts` in
`manifest.webmanifest` and of the start of `src/app.js`.

A long press on the icon of the installed app shows its shortcuts. Android reads them from the
manifest when Chrome installs or updates the app.

- **SHORT-1** The manifest has four shortcuts, in this order: **Añadir artículo**
  (`./?open=add`), **Compra** (`./?open=active`), **Recetas** (`./?open=recipes`) and **Menú**
  (`./?open=menu`).
- **SHORT-2** A start with `?open=<name>` shows that section. `add` shows `Compra` and opens the
  add sheet there. An unknown name is ignored. While the walkthrough of a first start shows, the
  section changes below it and the add sheet does not open.
- **SHORT-3** The names of the shortcuts are the texts `add.item`, `list.active`, `nav.recipes`
  and `nav.menu` in the language of the screen, through the worker (SW-13).
- **SHORT-4** Each shortcut has an icon of 192 px: the line icon of its action, white on a disc of
  the theme colour (VER-15).
- **SHORT-5** The app removes `open` from the URL at once and keeps each other parameter, as ARR-4.

Limits: Android shows a change of the shortcuts, or of their names, only after the next update
check of Chrome for the installed app. The shortcuts work offline (SW-6, SW-7): the worker
ignores the query of the URL.

## Voice commands

Status: **not on `main`**. The work is on the branch `voice-commands` (3 commits:
`Add the rules of the spoken commands`, `Add the wrapper of the speech classes of the browser`,
`Add voice commands to the app`). On 2026-10-13 that branch is 28 commits behind `main`: it has no
languages, no shops and no state version 3. The rules below state the design of that branch. They
become rules of the app when the branch is merged, and they need a review at that time.

- **VOICE-1** The user speaks one command in Spanish (`es-ES`) for each tap, and the app says the
  answer.
- **VOICE-2** The commands: add items, hear what is left to buy, tick an item, delete an item, end
  the trip.
- **VOICE-3** A delete and the end of the trip ask for a spoken «sí» first. A tick and an add do
  not ask; `Deshacer` is sufficient.
- **VOICE-4** A spoken name selects the item with that exact name, or else each item whose name
  contains it, with no case or accent distinction. Two matches or more make a question.
- **VOICE-5** « y » and the comma separate items: «macarrones y queso» makes two items.
- **VOICE-6** A change goes through the same path as a tap, so it is saved and has `Deshacer`.
- **VOICE-7** A start with `?voice` begins a conversation. The entry **Hablar** of the `shortcuts`
  of the manifest opens it.
- **VOICE-8** `src/voice-commands.js` is pure: `interpret(state, text, { pending })` answers
  `{ state, reply, pending }`. `src/voice.js` wraps `SpeechRecognition` and `speechSynthesis`,
  which are parameters.

Limits of that design: Chrome sends the audio of a recognition to a server of Google, so a
recognition needs a connection, and it is the only data that would leave the phone (PROD-4). Chrome
can refuse to speak before the first touch of the page.

### "Ok Google" and Gemini

The aim of the user is the assistant of the phone as the only chat that adds to the list and reads
it. A web app cannot register a command with it. On 2026-10-13: App Actions were documented for
Google Assistant and `en-US` only; AppFunctions, the route of Gemini, needed a native app for
Android 16 and its link to Gemini was a private preview. A native app is not decided. The in-app
voice above is the interim.
