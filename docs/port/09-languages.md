# Languages

The languages of the screen, the text catalogs and the language setting. Source modules:
`src/i18n.js`, `src/locales/*.js`, `src/ui/context.js` (language state, `say`, `textOf`),
`src/ui/settings.js` (`applyLanguage`, **Ajustes → Idioma**), `src/storage.js`
(`loadLanguage`, `saveLanguage`). The full key inventory and the map to Android resources are in
`text.md`.

## Languages

**LANG-1** [adapted] [verified] The screen is in one of seven languages, in this order: Catalan (`ca`), German (`de`), English (`en`), Spanish (`es`), French (`fr`), Italian (`it`), Portuguese (`pt`, European).
- Evidence: `src/i18n.js:9-10`; test: `tests/i18n.test.js` "the languages are the seven of the design".
- Target: one `values-<lang>/strings.xml` per language; `values/` (no qualifier) holds English (LANG-11). Portuguese resources go in `values-pt/`, and the locale of the app is `pt-PT` (LANG-10).

**LANG-2** [core] [verified] With no valid stored choice, the language is the first entry of the device language list whose base subtag (the part before the first `-`, lower-cased) is one of the seven. `es-MX` gives `es`, `EN-us` gives `en`, `ca-ES-valencia` gives `ca`, `pt-BR` gives `pt`. An entry that is empty, not text, or unknown is skipped. With no match the language is English (`en`). A single text value in place of a list resolves the same way.
- Evidence: `src/i18n.js:28-35`, `src/ui/context.js:67-68`; tests: `tests/i18n.test.js` "the first supported base of the preferred languages wins", "a regional language resolves to its base", "no supported preferred language gives the fallback", "one preferred language that is text, not a list, resolves too", "a stored language that is not supported is ignored".
- Note: a region subtag never selects a catalog; only the base matters. `pt-BR` shows the European Portuguese catalog.
- Port: keep `resolveLanguage(preferred, stored)` as a pure function with its tests; feed it `LocaleList.getDefault()` (as BCP 47 tags) when the app locale is empty. See Q-platform-1 for the case where Android resolves resources itself.

**LANG-3** [adapted] [untested] **Ajustes → Idioma** (`settings.language`) lists **Automático** (`settings.automatic`) first, then the seven languages in the order of LANG-1, each name in its own language: `Català`, `Deutsch`, `English`, `Español`, `Français`, `Italiano`, `Português`. The row shows the name of the selected option. A choice applies at once: each text of the screen changes with no reload, and the open view stays.
- Evidence: `src/i18n.js:13-21`, `src/ui/settings.js:126-130,180-183`, `src/ui/settings.js:34-39`; test: untested (the names: `tests/i18n.test.js` "each language has a catalog and a name").
- Target: `AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(tag))`. The activity is recreated; the UI state (current section, open sheet) must survive the recreation (saved state), so that the user sees no reload. The language names are fixed strings marked `translatable="false"`.

**LANG-4** [adapted] [verified] The choice is stored under `shopping.lang`. **Automático** removes the key. A stored value that is not one of the seven codes, or an empty value, counts as no choice. A storage that throws counts as no choice, and a choice then lasts until the app closes.
- Evidence: `src/storage.js:222-243`, `src/ui/context.js:67,233-239`; tests: `tests/storage.test.js` "loadLanguage returns the stored language when it is supported", "loadLanguage returns null for no value and for an unsupported value", "saveLanguage stores a language and null removes it", "the language functions do not throw when the storage does".
- Target: per-app language preference. Android 13+: the system stores it (`android:localeConfig` with the seven locales, so the choice also shows in system settings). Below 13: AppCompat `autoStoreLocales` in the manifest service `AppLocalesMetadataHolderService`. **Automático** = `LocaleListCompat.getEmptyLocaleList()`.

**LANG-5** [adapted] [verified] The language choice is a preference of the device. It is not part of the stored state and not part of the backup file. **Borrar todos los datos** removes it (it is one of the app keys).
- Evidence: `src/storage.js:222,421-437`; tests: `tests/storage.test.js` "the language is not part of the state", "APP_KEYS holds the state, its corrupt copy and each preference of the device".
- Target: the per-app locale lives outside the state store. The reset clears it with `setApplicationLocales(empty)`.

**LANG-6** [dropped] [untested] The `lang` attribute of the page follows the resolved language (a real code, also under the pseudo-locale).
- Evidence: `src/ui/settings.js:111`.
- Reason: DOM attribute. Replacement: the `Configuration` locale of the activity, which TalkBack and text layout read. Nothing to build.

## Text

**LANG-7** [adapted] [verified] Each text of the screen is an entry of the catalog of its language: a flat map from a key to a text, or to `{ one, other }` for a plural. No entry is empty. A plural has exactly the forms `one` and `other`.
- Evidence: `src/locales/es.js`, `src/i18n.js:51-62`; test: `tests/i18n.test.js` "a plural entry has the forms one and other, and no entry is empty".
- Target: `<string>` and `<plurals>` in `strings.xml`. Key → resource name: see `text.md` (dots and hyphens become `_`).

**LANG-8** [adapted] [verified] `es.js` is the source wording. Each catalog has the same keys as `es`, the same kind (text or plural) for each key and the same placeholders (the same names, the same count of each).
- Evidence: `src/locales/*.js`; tests: `tests/i18n.test.js` "each catalog has the keys of the Spanish catalog", "each entry has the kind and the placeholders of the Spanish entry".
- Target: a JVM unit test that parses each `values*/strings.xml` and compares names, kinds and the set of `%n$` positions with `values-es/`. Lint `MissingTranslation` and `ExtraTranslation` as errors.

**LANG-9** [adapted] [verified] A text takes parameters as `{name}`. Each `{name}` with a given parameter is replaced in one pass; a `{name}` with no given parameter stays as it is. A parameter value goes in as typed: a value that holds `{count}`, `$&` or `$1` is not read again.
- Evidence: `src/i18n.js:37-39`; tests: `tests/i18n.test.js` "t replaces each placeholder with its parameter", "t puts user text in as typed".
- Target: `getString(id, args)` / `stringResource(id, args)` with positional `%1$s`. `String.format` does not re-read its arguments, so user text with `%` or `{x}` is safe. A missing argument throws on Android (it does not stay as `{name}`): each call passes all arguments.

**LANG-10** [adapted] [verified] A plural is selected by the `count` parameter with the plural rules of the language. Portuguese uses the tag `pt-PT` for the plural rule and for date forms: zero is plural (`0 produtos`, `1 produto`). French takes the `one` form for 0 and 1.
- Evidence: `src/i18n.js:23-26,55,59`; tests: `tests/i18n.test.js` "t selects the plural form by the count", "Portuguese uses the European plural rule: zero is plural", "intlTag gives the regional tag of Portuguese and the code of each other language".
- Target: `resources.getQuantityString(id, count, args)` / `pluralStringResource`. The app locale for `pt` must be `pt-PT`, not `pt` (CLDR `pt` puts 0 in `one`). Dates use `DateTimeFormatter` with the same locale.

**LANG-19** [core] [new] A plural category that has no form (for example `many`, which `es`, `ca`, `fr`, `it` and `pt` have for 1 000 000), and a call with no `count`, take the `other` form.
- Evidence: `src/i18n.js:59`; test: `tests/i18n.test.js` "a plural category with no form, or no count, uses the other form".
- Target: Android falls back to `other` for a missing quantity. Lint `MissingQuantity` can ask for `many` in these languages (Q-platform-2).

**LANG-11** [adapted] [verified] A key that the catalog of the language does not have takes the English text. A key that no catalog has shows as the key itself.
- Evidence: `src/i18n.js:57-58`; test: `tests/i18n.test.js` "a missing key shows the fallback text, then the key".
- Target: `values/strings.xml` is English, so a missing translation resolves to English. A key in no catalog cannot exist (`R.string` is checked at compile time); the second half of the rule has no runtime case.

**LANG-12** [adapted] [verified] No module apart from the catalogs, and no element of the page markup, holds text for the user. A fixed text of the page is a text key (`data-i18n="key"`); an attribute text is `data-i18n-attr="attribute:key"`, and several pairs are comma-separated.
- Evidence: `src/ui/settings.js:117-125`, `index.html`; tests: `tests/markup.test.js` "the markup has no text of its own", "each key of the page is in the Spanish catalog", "an element with a text key is empty in the markup".
- Target: every Compose text and `contentDescription` comes from `stringResource`. Lint `HardcodedText` as error; a test or Detekt rule for string literals in `Text(...)`.

**LANG-13** [core] [verified] A pure module returns an error or a notice as a message `{ key, params }`, not as text. Only the screen code turns a message into text. A `list` parameter holds a list id (`active` or `saved`), which the screen replaces with the text `list.<id>` in the language before the fill.
- Evidence: `src/ui/context.js:88-92`, `src/store.js:27,63,224`; test: `tests/i18n.test.js` "the Spanish catalog has each message key of the pure modules" (the `list` replacement: untested).
- Port: domain functions return a message value (resource id or key enum + arguments); the UI layer resolves it. The `list` id maps to `R.string.list_active` / `R.string.list_saved`.

## Pseudo-locale

**LANG-18** [adapted] [verified] The address parameter `?lang=pseudo` shows each text of the Spanish catalog changed: each vowel `aeiouAEIOU` becomes `äéîöüÄÉÎÖÜ`, the text goes in `[` `]` and is padded with `~` before the `]` to `ceil(1.4 × length)` characters in all (length of the source text; never shorter than the text and its two brackets). `Compra` gives `[Cömprä~]`. A `{name}` stays as it is and is then filled. Each plural form changes, with the Spanish plural rule. It is not in the list of Idioma, it is not stored, no device language or stored value selects it, and the resolved language stays a real code.
- Evidence: `src/i18n.js:41-49,52-55`, `src/ui/context.js:69-72`; tests: `tests/i18n.test.js` "pseudo accents the vowels, wraps in brackets and pads to 1.4 times the length", "pseudo keeps each placeholder intact", "the pseudo translator applies pseudo over es, to each plural form, and fills the parameters", "pseudo is not a language and no navigator language or stored value selects it".
- Target: Android pseudolocales (`pseudoLocalesEnabled true` in the debug build type; developer option `en-XA`). They pseudo-translate the default (English) resources, not Spanish. See Q-platform-3.

## Not translated

**LANG-14** [core] [untested] The data of the user stays as typed in each language: the names of items, recipes, products, dishes, shops and aisles. The sample recipe and the usual aisles are written in the language of the screen when they are added, then they are user data.
- Evidence: `src/ui/onboarding.js:20-23`, `src/ui/aisles.js:86`.

**LANG-15** [core] [verified] The order by name uses the Spanish collation in each language, with no case and no accent distinction (SORT-6).
- Evidence: `src/store.js:122`; tests: `tests/store.test.js` "compareNames has no case and no accent distinction", "sortItems gives the Spanish name order without case or accent distinction".
- Port: `java.text.Collator.getInstance(Locale("es"))` with strength `PRIMARY`.

**LANG-16** [adapted] [untested] The name of the app is `Bodega` in each language: the short name of `manifest.webmanifest` and the subtitle of **Ajustes** (`header.settingsSubtitle`). The page title is `app.title` (`Bodega - Lista de la compra` in Spanish), set at each language change; before the script runs it is the Spanish text. The manifest name, description and shortcut names follow the language of the screen through the worker (SW-13).
- Evidence: `index.html:8`, `manifest.webmanifest:2-4`, `src/ui/settings.js:112-116`, `src/locales/es.js:29-31`.
- Target: `android:label="@string/app_name"` (`Bodega`, `translatable="false"`). There is no window title. The launcher label and the shortcut labels come from the resources of the current locale, with no worker (SW-13 is dropped).

**LANG-17** [core] [verified] The name of the backup file starts with `compra-` in each language: `compra-YYYY-MM-DD-HHMMSS.json`, local time.
- Evidence: `src/storage.js:207-211`; tests: `tests/storage.test.js` "exportFilename names the file with the local date and time", "exportFilename gives two exports of one day different names".

## Add a language

Web: a catalog with all keys; its entry in `CATALOGS` and `LANGUAGE_NAMES` of `src/i18n.js`; the alias
in the import map of `index.html`; the file in `SHELL` of `sw.js`. Port: a `values-<lang>/strings.xml`,
the locale in `res/xml/locales_config.xml`, the name in the Idioma list, and a row in the parity test
(LANG-8).

## Limits

No right-to-left language. The catalogs `ca`, `de`, `fr`, `it` and `pt` have had no review by a
native speaker. `recipe.inList` is a key that no code uses (see `text.md`).
