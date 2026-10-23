# Install

The install offer of the browser and the turn of the screen. Source modules: `src/install.js`,
`src/ui/install.js`, the group **Aplicación** of `index.html`, and `orientation` of
`manifest.webmanifest`. On Android the app comes installed from the Play Store or an APK, so the
install offer has no equivalent.

**INS-1** [dropped] [verified] The install offer has three states: `idle` (no offer), `available` (Chrome gave `beforeinstallprompt`) and `installed`. `installNext` moves among them: `prompt` makes it `available`, `dismissed` makes it `idle` until the next prompt, `installed` is final, and an unknown event changes nothing.
- Evidence: `src/install.js:1-10`; test: `tests/install.test.js` "the prompt of the browser makes the install available", "a dismissed prompt goes back to idle until the next prompt", "installed is final", "an unknown event changes nothing".
- Reason: a state machine of the web install prompt. Replacement: nothing; the Play Store or the APK installer installs the app.

**INS-2** [dropped] [verified] `Ajustes` shows the group **Aplicación** (`settings.app`) with the row **Instalar la aplicación** (`settings.install`, with `›`) only in the state `available`. A tap shows the prompt of Chrome; an accepted prompt makes the state `installed`, a dismissed one `idle`. The prompt can be used one time.
- Evidence: `src/ui/install.js:4-34`; `src/install.js:10`; `index.html:120-125`; test: `tests/install.test.js` "the Install button shows only while the install is available"; `tests/markup.test.js` "the rows that open something end with a chevron".
- Reason: the web install prompt. Replacement: nothing; `Ajustes` on Android has no group **Aplicación** (NAV-6).

**INS-3** [dropped] [verified] An app that starts in `display-mode: standalone` starts `installed`; else it starts `idle`. The event `appinstalled` also makes it `installed`, whoever started the install.
- Evidence: `src/install.js:4`; `src/ui/install.js:17`, `:23-26`; test: `tests/install.test.js` "an app opened standalone starts installed, else idle".
- Reason: a browser display mode. Replacement: nothing; a native app is always installed.

**INS-4** [adapted] [verified] The installed app turns with the device (`orientation: any`), so a tablet, an unfolded phone or a phone on its side shows it the right way up. The layout of each width is in DSV-8 (rail from 600 dp).
- Evidence: `manifest.webmanifest` (`orientation`); test: `tests/spec.test.js` "the installed app turns with the device (INS-4)".
- Target: no `android:screenOrientation` lock on the activity (or `fullSensor`), and a layout by window size class. Not `dropped`: the user-visible behaviour (the app turns) stays.

## Limits

No banner and no message offer the install. On the web Chrome may never give the prompt; its menu
**Add to Home screen → Install** still works (VER-14). On Android none of this applies.
