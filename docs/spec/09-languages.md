# Languages

Rules of `src/i18n.js`, `src/locales/` and of the language setting in `src/ui/settings.js`.

## Languages

- **LANG-1** The screen is in one of seven languages: Catalan (`ca`), German (`de`), English
  (`en`), Spanish (`es`), French (`fr`), Italian (`it`) and Portuguese (`pt`, European).
- **LANG-2** With no stored choice, the app takes the first language of `navigator.languages`
  whose base language it has. `es-MX` gives `es`. With no match it shows English.
- **LANG-3** **Ajustes → Idioma** lists **Automático** and the seven languages, each name in its
  own language. A choice applies at once, with no reload.
- **LANG-4** The choice is stored in `shopping.lang`. **Automático** removes the key. A stored
  value that is not one of the seven is ignored.
- **LANG-5** The choice is a preference of the device. It is not part of the state and not part of
  the backup.
- **LANG-6** The `lang` attribute of the page follows the language.

## Text

- **LANG-7** Each text of the screen is an entry of the catalog of its language,
  `src/locales/<lang>.js`: a flat object from a key to a text, or to `{ one, other }` for a plural.
- **LANG-8** `es.js` is the source wording. Each catalog has the same keys, the same form for each
  key and the same placeholders. `tests/i18n.test.js` fails if not.
- **LANG-9** A text takes parameters as `{name}`. A parameter goes in as typed, in one pass: user
  text that holds `{name}` or `$&` is not read again.
- **LANG-10** A plural is selected by `count` with `Intl.PluralRules` of the language. Portuguese
  uses the tag `pt-PT`, for the plural rule and for the form of the date.
- **LANG-11** A key that the catalog of the language does not have takes the English text. A key
  that no catalog has shows as the key.
- **LANG-12** No module of `src/` apart from the catalogs, and no element of `index.html`, holds
  text for the user. A fixed text of the page is a `data-i18n="key"` attribute; an attribute is
  `data-i18n-attr="attribute:key"`. `tests/markup.test.js` checks this.
- **LANG-13** A pure module returns an error as a message `{ key, params }`. Only the screen code,
  `src/app.js` and `src/ui/`, turns a message into text. A `list` parameter holds a list id, which the screen replaces with
  the name of the list in the language.

## Pseudo-locale

- **LANG-18** The address parameter `?lang=pseudo` shows each text of the Spanish catalog with
  accented vowels, in `[ ]`, padded with `~` to 1.4 times its length. A `{name}` stays as it is,
  and each plural form changes. It is a tool for layout checks: it is not in the list of Idioma, it
  is not stored, no `navigator.languages` value selects it, and the `lang` attribute stays `es`.

## Not translated

- **LANG-14** The data of the user: the names of items, recipes, products and shops stay as typed.
- **LANG-15** The order by name uses the Spanish collation in each language (SORT-6).
- **LANG-16** The name of the app is `Bodega` in each language: the short name of
  `manifest.webmanifest` and the subtitle of `Ajustes`. The title of the page is `Bodega - Lista
  de la compra`, with the second part in the language of the screen (`app.title`). The title
  before the script runs is in Spanish. The name, the description and the shortcut names of the manifest
  follow the language of the screen (`app.title`, `app.description`, SHORT-3) through the worker (SW-13); before the
  page first sends them, and with no worker, they are in Spanish. An installed app shows a new
  name only after the next update check of Chrome, and Android can ask the user to confirm it.
- **LANG-17** The name of the backup file starts with `compra-` in each language.

## Add a language

A catalog with all keys; its entry in `CATALOGS` and in `LANGUAGE_NAMES` of `src/i18n.js`; its
alias `#locales/<lang>` in the import map of `index.html`; its file in `SHELL` of `sw.js`.

## Limits

No right-to-left language. The catalogs `ca`, `de`, `fr`, `it` and `pt` have had no review by a
native speaker.
