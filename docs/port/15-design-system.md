# Design system

The look of the app: the shared tokens and components of `pwa-design-system` 0.7.2 (commit
`4dd6ea9f0f55180811a0a0af6abcaff7bbf103e2`, copied in `vendor/design-system/`), the tokens and
the component versions of the app in `styles.css` (at `HEAD`), the icons of `icons.svg` and
`icons/`. Source: `vendor/design-system/design-system.css`, `vendor/design-system/rules.js`,
`styles.css`, `icons.svg`, `scripts/make-icons.mjs`, `scripts/png.mjs`, `scripts/glyph.mjs`.

On the target the CSS copy, its layers and its checks go away. A Compose theme (a
`MaterialTheme` with a custom `ColorScheme` plus an app `CompositionLocal` for the roles that
Material has no slot for) carries the values of the "Theme tokens" section. 1 CSS px = 1 dp;
1 rem = 16 px = 16 sp.

## The copy

**DSV-1** [dropped] [verified] `vendor/design-system/` holds `design-system.css`, `catalog.js`, `rules.js`, `sheet.js`, the font `geist.woff2` and `SOURCE.json` (version, commit and sha256 of each file), and no other file. Only `npm run ds` writes it. A file that differs from its hash fails the tests.
- Evidence: `vendor/design-system/SOURCE.json`, `package.json:17`; test: `tests/vendor.test.js` "vendor/design-system/ has SOURCE.json with the version, the commit and the files", "vendor/design-system/ holds the files of SOURCE.json and SOURCE.json only", "each vendored file has the sha256 of SOURCE.json"; `tests/spec.test.js` "DSV-1 names each file of vendor/design-system/ (SOURCE.json)".
- Reason: a vendored CSS copy shared between web apps. Replacement: the theme values of this document as Kotlin constants in the app (or a shared Gradle module if several Android apps share them); `geist.woff2` becomes a font resource.

**DSV-2** [dropped] [verified] `index.html` and `designs/index.html` link `vendor/design-system/design-system.css` before `styles.css`, and `SHELL` of `sw.js` has both. A layer of the two sheets is one layer: a rule of `styles.css` comes after the shared rules of its layer.
- Evidence: `index.html:12-13`; test: `tests/vendor.test.js` "index.html links the shared stylesheet before styles.css", "designs/index.html links the shared stylesheet before styles.css", "SHELL of sw.js has each vendored stylesheet", "SHELL of sw.js has each vendored file that the page loads", "SHELL caches the font of the design system".
- Reason: CSS cascade and service-worker cache. Replacement: nothing; the app theme wraps the shared values in code.

**DSV-3** [dropped] [verified] `styles.css` starts with the layer statement `@layer tokens, base, components, layouts, screens;` and holds the parts of the app only: its tokens, the `body` rule and the font of the controls, the screen parts, and its versions of shared components. A version starts with `/* @extends <name> */`. The app has versions of `app-header`, `sheet`, `dock`, `item-row`, `group-head`, `empty-state` and `list-group`.
- Evidence: `styles.css:1`, `styles.css:65`, `:101`, `:128`, `:142`, `:224`, `:249`, `:301`, `:727`; test: `tests/vendor.test.js` "a rule of styles.css with a shared selector follows an @extends block", "an @extends block of styles.css names a shared component"; `tests/design.test.js` "the parts of the app are documented in styles.css (DSV-3)", rule "styles.css declares the five layers first, and each rule is in one of them (DS-1)".
- Reason: CSS layering. Replacement: the deltas of each version are in DSV-23; the port builds them into the app composables.

**DSV-4** [dropped] [verified] A change of a shared part is made in `pwa-design-system`, then `npm run ds` here. Nothing edits `vendor/` by hand.
- Evidence: `package.json:17`; test: `tests/vendor.test.js` "each vendored file has the sha256 of SOURCE.json".
- Reason: copy workflow of the web design system. Replacement: nothing, or a shared theme module.

## Theme tokens

**DSV-9** [adapted] [new] The app overrides the shared tokens: `--primary` = `--done`, `--on-primary` = `--on-done`, and it defines `--primary-soft` = `--done-soft`. So the main action, the badge, the `+` button, `button accent` text, `list-row accent` text and the walkthrough art are green (`#1f7a4d` light, `#5fc491` dark).
- Evidence: `styles.css:3-12` (commit `164c6aa` "Make green the main action colour again"); test: untested.
- Target: `primary = done` in both colour schemes.

**DSV-10** [adapted] [new] The colours are these roles, with a light and a dark value. The app token override of DSV-9 is applied (`primary` is green, not the black of the shared sheet).
- Evidence: `vendor/design-system/design-system.css:14-39`, `styles.css:3-12`; test: untested.
- Target: `lightColorScheme` / `darkColorScheme` plus an app colour class for `done`, `doneSoft`, `warning`, `knob`, `ink`. Suggested Material slots in the last column.

| Token | Light | Dark | Use | Material slot |
|---|---|---|---|---|
| `bg` | `#f4f3f1` | `#0f0f0e` | page, nav bar, dock, group head band | `background`, `surface` of screens |
| `surface` | `#ffffff` | `#191918` | rows, header, sheets, chips, inputs | `surfaceContainerLowest` / sheet `containerColor` |
| `surface-2` | `#eeedea` | `#232321` | a field, a track, a banner, a row set on `surface` | `surfaceContainerHigh` |
| `text` | `#0a0a0a` | `#ffffff` | text; focus ring and focus border | `onBackground`, `onSurface` |
| `muted` | `#5f5f5f` | `#b4b4b4` | second text, idle icons, switch off track, check border, grab bar | `onSurfaceVariant` |
| `line` | `#e6e5e2` | `#232321` | borders and separators (never a text colour) | `outlineVariant` |
| `control` | `#d4d3cf` | `#3d3d3a` | border of an input, chip, outline button | `outline` |
| `primary` | `#1f7a4d` | `#5fc491` | the main action (= `done`, DSV-9) | `primary` |
| `on-primary` | `#ffffff` | `#0c1a12` | text on `primary` | `onPrimary` |
| `primary-soft` | `#e2f2ea` | `#1d3327` | soft fill of the walkthrough art (= `done-soft`) | `primaryContainer` |
| `done` | `#1f7a4d` | `#5fc491` | progress, checked state, switch on, swipe right | app role |
| `on-done` | `#ffffff` | `#0c1a12` | text and tick on `done` | app role |
| `done-soft` | `#e2f2ea` | `#1d3327` | swipe action ground, flash, `banner done`, pill | app role |
| `ink` | `#141414` | `#ffffff` | selected chip or toggle fill, current walkthrough dot | `inverseSurface` |
| `on-ink` | `#ffffff` | `#0a0a0a` | text on `ink` | `inverseOnSurface` |
| `secondary` | `#e5e3de` | `#2a2a28` | tonal button fill, current nav item pill | `secondaryContainer` |
| `danger` | `#b3261e` | `#f08a9b` | destructive text, invalid border, `swipe-action danger` fill | `error` |
| `warning` | `#9a5b00` | `#f2b65c` | outdated version state | app role |
| `knob` | `#ffffff` | `#ffffff` | switch knob, both themes | app role |
| `scrim` | `rgb(0 0 0 / 0.45)` | same | veil behind a sheet | `scrim` (alpha 0.45) |

**DSV-11** [adapted] [new] The theme follows the phone unless `Tema` forces it: the colours resolve through `color-scheme: light dark`; `data-theme="light"` forces light and `data-theme="dark"` forces dark. The status bar colour is `#f4f3f1` (light) and `#0f0f0e` (dark).
- Evidence: `vendor/design-system/design-system.css:11-13`, `:110-116`; `src/ui/context.js:78-83`, `:247-251`; `index.html:6-7`; test: untested.
- Target: `isSystemInDarkTheme()` unless the stored choice is `light` or `dark` (NAV-15 to NAV-17); edge-to-edge with status and navigation bar icons that match the scheme.

**DSV-12** [adapted] [new] The font is Geist, a variable font of weights 100 to 900, with the fallbacks `system-ui`, Roboto and `sans-serif`. The body text is 15 px with a line height of 1.4. Buttons and inputs take the body font. The type scale and weights are these:
- Evidence: `vendor/design-system/design-system.css:4-9`, `:41-52`; `styles.css:15-26`, `styles.css:57-61`; test: untested.
- Target: `geist.woff2` as `res/font` (`FontFamily` with `FontVariation.weight`), license OFL. `Typography` styles below; `font-mono` (`ui-monospace`, Menlo, Consolas) maps to `FontFamily.Monospace`.

| Token | Size | Use |
|---|---|---|
| `text-xs` | 12 sp | labels, badges, captions, nav labels, meta line, meal label, about |
| `text-s` | 13 sp | second text: subtitle, hint, quantity, group count, `Guardado`, banner text |
| `text-label` | 14 sp | group and section heads, chips, segments, field labels, sheet part titles |
| `text-m` | 15 sp | body (line height 1.4 = 21 sp) |
| `text-h` | 20 sp | sheet title, empty state title |
| `text-l` | 24 sp | screen title (line height 1.2, bold), walkthrough title, icon-button glyph |
| `text-xl` | 32 sp | the `+` of the add button |
| `weight-normal` | 400 | body |
| `weight-medium` | 600 | titles, selected labels, primary button text |
| `weight-strong` | 700 | screen title, selected segment, badge, `list-row accent`, onboarding key |

**DSV-13** [adapted] [new] Spacing, shape and sizes take these values (dp):
- Evidence: `vendor/design-system/design-system.css:54-87`; test: untested.
- Target: a `Dimens` object; `RoundedCornerShape` values; `Modifier.minimumInteractiveComponentSize()` for the tap size.

| Group | Values |
|---|---|
| Space | `space-half` 2, `space-1` 4, `space-2` 8, `space-3` 12, `space-4` 16, `space-5` 20, `space-6` 24, `space-7` 32 |
| Radius | `radius-s` 4 (check box, grab bar), `radius-control` 6 (inputs, chips), `radius-m` 8 (buttons, toast), `radius-l` 8 (groups, banner, add button, switch track), `radius-xl` 14 (top corners of a sheet), `radius-pill` 999 (fully round), `radius-round` 50 % |
| Size | `tap` 48 (least tap target), `tap-l` 56 (rows, add button, wide buttons of empty state and action bar), `icon` 24, `icon-s` 20, `arrow` 6 (select arrow), `nav-height` 64, `dock-height` 56, `rail-width` 80, `side-sheet` 400, `content-max` 640, `pane-list` 360 (unused), `art-width` 240, `logo` 96 |
| Shadow | `shadow-s` `0 1px 3px rgb(0 0 0 / 0.3)` (segment knob, switch knob) ≈ 1 dp elevation; `shadow-l` `0 8px 24px rgb(0 0 0 / 0.14)` (toast, add button, lifted row) ≈ 6–8 dp |
| Border | 1 dp `line` separators; 1 dp `control` on inputs, chips, outline buttons; 2 dp on `field-input`, `dock-field`, check box; focus ring 2 dp `text` at 2 dp offset |

**DSV-14** [adapted] [new] The motion has three durations and one curve: `motion-fast` 150 ms, `motion` 250 ms, `motion-slow` 1.2 s, curve `cubic-bezier(0.2, 0.8, 0.2, 1)`. With reduced motion the three durations are 0 ms, set in one place.
- Evidence: `vendor/design-system/design-system.css:89-101`; test: `tests/design.test.js` rule "reduced motion sets the motion tokens to 0ms in one place (DS-2)".
- Target: `CubicBezierEasing(0.2f, 0.8f, 0.2f, 1f)` and `tween(150 | 250 | 1200)`; durations 0 when `Settings.Global.ANIMATOR_DURATION_SCALE` is 0 ("Remove animations").
- Uses: section content enters with a 48 dp horizontal offset and a fade, 250 ms; a sheet slides up (side sheet: from its side) and the veil fades, 250 ms; the toast enters and leaves with a 12 dp vertical offset and a fade, 250 ms; a row slide, gap and switch knob move in 150 ms or 250 ms; the flash of a row that comes back fades from `done-soft` in 1.2 s; the version check icon spins once each 1.2 s, linear.

**DSV-15** [adapted] [new] The compact density (`Densidad` `Compacta`, NAV-20) changes three sizes only: `tap-l` 48, `nav-height` 56, `dock-height` 48. `tap` stays 48.
- Evidence: `vendor/design-system/design-system.css:104-108`; test: untested.
- Note: NAV-20 of `docs/spec/07-screen.md` gives the same values; this rule states them as tokens.
- Target: a second `Dimens` instance, chosen by the stored density.

## Icons

**DSV-16** [adapted] [new] `icons.svg` holds 25 line symbols, each on a 24 × 24 view box, drawn with `stroke: currentColor`, stroke width 2, round caps and joins, no fill: `search`, `filter`, `more`, `cart`, `cart-add`, `book`, `menu`, `settings`, `export`, `import`, `refresh`, `check-circle`, `download`, `offline`, `check`, `link`, `repeat`, `undo`, `edit`, `trash`, `chevron-left`, `chevron-right`, `chevron-down`, `plus`, `close`. An icon shows at 24 dp (`icon`) or 20 dp (`icon small`) in the colour of its text. Each symbol is used, and each icon that the code names exists.
- Evidence: `icons.svg`, `vendor/design-system/design-system.css:212-231`; test: `tests/design.test.js` rules "each svg of the page uses a symbol, except the drawings of the walkthrough (DS-5)", "each icon that the page or the code names is a symbol of icons.svg (DS-5)", "each symbol of icons.svg is used (DS-5)".
- Target: one `ImageVector` (or vector drawable) for each symbol, converted from the paths, stroke 2, round caps, tinted with `LocalContentColor`. Material Icons do not match the strokes; convert the originals.

**DSV-17** [adapted] [new] The launcher icons come from the art `icons/source.png` (white ground): `icon-192.png` and `icon-512.png` put the art at 0.84 of the side on a white rounded square with a corner radius of 0.22 of the side; `icon-maskable-512.png` puts the art at 0.64 of the side on a full white square, so the art stays in the safe circle of radius 0.4.
- Evidence: `scripts/make-icons.mjs:199-236`, `manifest.webmanifest` `icons`; test: untested.
- Target: an adaptive icon (`mipmap-anydpi-v26/ic_launcher.xml`): a white background layer and a foreground layer of the art at about 0.61 of the 108 dp canvas (inside the 66 dp safe zone); a monochrome layer for themed icons; legacy PNG mipmaps from `icon-512.png`.

**DSV-18** [adapted] [new] Each launcher shortcut icon is 192 px: a disc of `#1f7a4d` with a white line glyph, 24 glyph units wide at 0.5 of the disc, stroke 2 units. The glyphs: `add` (cart with a plus), `active` (cart), `recipes` (book), `menu` (fork and knife).
- Evidence: `scripts/make-icons.mjs:244-286`; the segment math in `scripts/glyph.mjs:1-54`, test: `tests/glyph.test.js` (segments only).
- Target: `ShortcutInfo` icons as adaptive icons (`Icon.createWithAdaptiveBitmap` or a vector drawable on a `#1f7a4d` background layer), one for each shortcut of `SHORT-1`.

**DSV-19** [adapted] [new] The walkthrough logo `icons/logo.png` is the art at 288 px with its white ground made transparent: only the light pixels (least channel 240 or more) that connect to the edge clear, a white inside the art stays, and an edge pixel blended with white takes its colour back at part alpha. It shows at 96 dp.
- Evidence: `scripts/make-icons.mjs:238-242`, `scripts/png.mjs:91-135`; test: `tests/png.test.js` "clearWhite makes the white that touches the edge transparent and keeps a white inside the art", "clearWhite turns an edge blended with the white into the colour at part alpha", "resizeRgba averages with the alpha, so a transparent pixel gives no colour".
- Target: ship `logo.png` (or a vector of the art) as a drawable, shown at 96 dp. The generator is not ported.

**DSV-20** [dropped] [new] `npm run icons` writes the PNG icons with an encoder and decoder of its own (8-bit RGBA, no interlace; it rejects other data with `not a PNG` or `only 8-bit RGBA without interlace`) and a reader of SVG path commands `M L H V Q Z` (it rejects any other command, such as `A`).
- Evidence: `scripts/png.mjs:1-89`, `scripts/glyph.mjs:1-54`; test: `tests/png.test.js` "decodePng gives back the pixels that encodePng wrote", "decodePng reads the filters of a PNG from another encoder", "decodePng rejects data that is not a PNG", "decodePng rejects a format other than 8-bit RGBA without interlace"; `tests/glyph.test.js` (all 6 tests).
- Reason: a no-dependency build tool of the web repo. Replacement: Android Studio Image Asset / vector drawables; nothing at run time.

## Exceptions

**DSV-5** [dropped] [removed] Retired: from design system 0.5.0 the rail stands at the side of the hand (LAY-2), so the app has no version of `nav-bar`, `toast` and `fab`.
- Evidence: `styles.css` has no `nav-bar` rule; test: `tests/design.test.js` "styles.css leaves the rail to the design system (LAY-2)".

**DSV-6** [adapted] [untested] From 600 dp a sheet is at most `content-max` (640 dp) wide, centred in the space beside the rail, and its veil covers the rail. From 840 dp a sheet with a head is the side sheet of the design system: 400 dp wide, full height, next to the rail at the side of the hand, with its outer corners at `radius-xl` and no grab (no drag to close). The walkthrough content also keeps the width of the column from 600 dp.
- Evidence: `styles.css:101-126`, `styles.css:810-815`; `vendor/design-system/design-system.css:1002-1062`; test: untested.
- Target: `ModalBottomSheet` with `sheetMaxWidth = 640.dp` on Medium width; on Expanded width a side sheet (a `Dialog` or a custom sheet, 400 dp, aligned to the hand side). Breakpoints from `WindowSizeClass`.

**DSV-7** [adapted] [untested] A window of at most 480 dp height (a phone on its side) gives more height to the content: the header pads 8 dp plus the top inset above and 8 dp below, and the walkthrough has no logo.
- Evidence: `styles.css:94-99`, `styles.css:819-823`; test: untested.
- Target: `WindowHeightSizeClass.COMPACT` (below 480 dp).

## Layout

**DSV-8** [adapted] [verified] The app follows LAY-1 to LAY-4 with no exception. Below 600 dp the bar is at the bottom, and the dock of `Compra` stands above it (SHOP-26). From 600 dp the bar is the rail at the side of the hand (NAV-13): right with `Derecha`, left with `Izquierda`; the toast and the `+` button clear it. The page pads the rail side and both side safe-area insets (LAY-4). The header content and the content of `main` form one column of at most 640 dp, centred beside the rail. From 840 dp the recipes of `Recetas` stand in two columns with an 8 dp gap; the app has no list and detail layout.
- Evidence: `styles.css:15-41`, `styles.css:76-80`, `styles.css:230-236`; test: `tests/design.test.js` rules "a width query uses only the breakpoints 600px and 840px, as min-width (DS-8)", "a rail at the start side has a rail at the end side for the right hand (LAY-2)", "the pane layout is documented with its parts (LAY-3)", "the content and the fixed controls keep out of a cutout on either side (LAY-4)", and "styles.css leaves the rail to the design system (LAY-2)".
- Target: `NavigationBar` below 600 dp, `NavigationRail` from 600 dp on the hand side; content `widthIn(max = 640.dp)` centred; `LazyVerticalGrid(2)` for recipes from 840 dp; `WindowInsets.safeDrawing` / `displayCutout` for the side insets. Compose `WindowWidthSizeClass` uses the same 600 and 840 breakpoints.

## Components

**DSV-21** [adapted] [new] The shared components have these measures. Unlisted states keep the values of their component.
- Evidence: `vendor/design-system/design-system.css:233-1925`; test: untested.
- Target: app composables built on Material 3 components with these overrides.

| Component | Measures |
|---|---|
| button | min height 48, padding 0 16, gap 8, radius 8, 1 dp transparent border. `primary`: `primary` fill, `on-primary` text, weight 600. `tonal`: `secondary` fill, `text`. `outline`: `control` border; only with `danger` in the app. `quiet`: `muted` text. `accent`: `primary` text, weight 600, no fill. `icon`: 48 × 48, no padding, `muted` icon unless primary or accent. `toggle` on: `ink` fill, `on-ink` icon. `wide`: full width. Disabled: opacity 0.4 |
| chip | min height 48, padding 0 16, 1 dp `control` border, radius 6, `surface` fill, 14 sp. Pressed: `ink` fill and border, `on-ink` text, weight 600. Count: 8 dp gap, `muted`, weight 400 |
| pill | padding 4 × 12, round, `done-soft` fill, `done` text, 12 sp; `ghost`: 1 dp dashed `muted` border |
| segmented | `surface-2` round track, padding 4; a `surface` round knob with `shadow-s` slides by whole segments in 250 ms; segment min height 48, 14 sp; chosen segment `text`, weight 700 |
| switch | row min height 56, padding 0 16, gap 12; track 44 × 26, radius 8, `muted` off, `done` on; knob 20 dp `knob` with `shadow-s`, 4 dp inset, moves 16 dp |
| input | height 48, padding 0 12, 1 dp `control` border, radius 6, `surface`; focus: `text` border; invalid: `danger` border also on focus; help line 13 sp `muted` (`danger` variant). `strong`: `text` border, 2 dp on focus |
| field | label above the box, 14 sp weight 600 `text`, 8 dp gap, 16 dp above the field; box border 2 dp `control`, `text` on focus; placeholder hidden |
| select (`Ajustes` row) | min height 56, padding 0 48 0 16, a `muted` chevron arrow of 6 dp |
| app-header | padding 16 + top inset, 16, 12; gap 12; 1 dp `line` bottom border; title 24 sp bold, one line, ellipsis; subtitle 13 sp `muted`, 2 dp above; icon buttons overlap by −8 dp |
| progress | 4 dp tall, round, `done` part on `line` |
| nav-bar | `bg`, 1 dp `line` top border, bottom inset padding. Item height 64, 12 sp `muted`, icon-label gap 2. Current: `text`, weight 600, icon on a `secondary` pill padded 4 × 20. Rail from 600 dp: 80 dp + side inset, items centred vertically, 1 dp `line` border on the content side |
| badge | top 8, left 50 % + 8; padding 0 8, round, `primary` fill, `on-primary`, 12 sp weight 700; hidden while empty |
| sheet | top corners 14, `surface`, max height 85 %; grab 48 dp tall with a 40 × 4 `muted` bar (radius 4); head padding 0 16 8, gap 12, title 20 sp weight 600, one line; body padding 0 16, scrolls; foot padding 12 16 (12 + bottom inset), gap 12, 1 dp `line` top border; `Guardado` 13 sp `muted`, fades in and out in 250 ms; part title 14 sp weight 600, 20 dp margin and 16 dp padding above a `line`; left hand mirrors head and foot |
| toast | min height 48, padding 4 4 4 16, gap 8, radius 8, 1 dp `line` border, `surface` fill (`surface-2` in dark), `text` text, `shadow-l`; side margins 12 + inset; bottom: nav 64 + inset + 56 + 24 (+ dock 56 when the dock shows); from 600 dp: inset + 56 + 24, clear of the rail; with a sheet open it stands at the top, 8 dp + top inset |
| banner | margin 16 × 12, padding 16, radius 8, `surface-2`; `done`: `done-soft`; a tonal button in it takes `surface`; text 13 sp, 4 dp above, 12 dp below |
| empty-state | margin 48 × 24, `muted`, centred; title 20 sp weight 600 `text`. `low`: column ending at the bottom, gap 8, min height 50 %, margin 0 20 24, buttons full width and 56 tall |
| item-row | `surface`, 1 dp `line` bottom divider (with a check it starts at the text: 8 × 3 + 4 × 2 + 24 = 56 dp from the start); body min height 56, padding 0 4 0 8 (end 12 with swipe), gap 8; check 24 × 24, 2 dp `muted` border, radius 4, margin 12 4 12 8, checked `done` fill with an `on-done` tick 10 × 5 at −45°; name min height 56, padding 0 4, label clamped to 2 lines; quantity 13 sp `muted`; meta 12 sp `muted`; end slot 96 dp (2 × 48). Left hand: the check and the end slot change side; text starts at 16 dp. Lifted: `shadow-l`, above its neighbours. Flash: body from `done-soft`, 1.2 s |
| swipe-action | width 72 (48 + 24), full height, 12 sp, icon-label gap 2; default `done-soft`/`done`; `neutral` `surface-2`/`text`; `danger` `danger`/`surface`; backdrop of the right slide `done-soft`/`done`, armed `done`/`on-done`, padding start 20 |
| group-head | min height 48, sticky at the top, padding 0 16, gap 8, 1 dp `line` bottom border, `bg`, 14 sp weight 600 |
| list-group | full width, `surface`, `line` top and bottom borders; row min height 56, padding 0 16, gap 12, `line` between rows; plain variant rows 48, padding 0 2; head 14 sp weight 600, margin 20 16 8; settings row padding 0 12 0 16, 15 sp, value `muted`, chevron `muted`, `danger` row `danger` weight 600 |
| fab (`+`) | 56 × 56, radius 8, `primary`, 32 sp `+`, `shadow-l`, 16 dp from the hand side and from the bar (+ dock 56 when the dock shows); collapsed 48 × 48 in 150 ms; hidden below 600 dp while the dock shows its own add button |
| action-bar | sticky at the bottom, padding 8 16, gap 8, over a fade from transparent to `bg` in 16 dp; buttons min height 56 |
| dock | fixed above the bar, height 56, padding 0 16 + insets, gap 8, `bg`, 1 dp `line` top border; chip flexes; field 48 tall (56 − 8), 2 dp `control` border (`text` on focus), round, `surface-2`; clear button 48 round `muted`; add button 48 × 48 radius 8. Hidden from 600 dp |
| cluster | wrap, gap 8, margin 12 0; `scroll`: one line, no scroll bar, end padding 24, a 32 dp fade at the end |
| input-row | gap 8; disabled submit `surface-2` fill and `muted` text at full opacity; `pinned`: sticky at the bottom, padding 8, `surface`; left hand mirrors |
| split | two equal columns, gap 8; `hand-side` child in the column of the hand |

**DSV-22** [adapted] [new] Below 600 dp the content of a section clears the bottom: 56 + 2 × 16 dp; with the dock, 56 + 32 + 56; with the add button in the dock, 56 + 16. `Menú` keeps no room at the end (its action bar ends the scroll).
- Evidence: `vendor/design-system/design-system.css:159-188`; `styles.css:620-622`; test: untested.
- Target: `contentPadding` of the lazy lists.

## Parts of the app

**DSV-23** [adapted] [new] The versions of the shared components in `styles.css` add these deltas:
- Evidence: `styles.css:64-298`, `styles.css:301-307`, `styles.css:727-751`; test: untested.
- Target: build the deltas into the app composables.

| Version | Delta |
|---|---|
| `app-header` | wraps: the progress bar of `Compra` takes a full line below the title and the buttons; from 600 dp the content lines up with the 640 dp column; below 600 dp, while the dock shows, the search button of the header is hidden |
| `sheet` | DSV-6 |
| `dock` | buttons gather at the end; with `Izquierda` the arrows and the shop chip keep their order, the search button and the add button go to the start (add first); while searching the dock mirrors as the shared one; the shop chip shrinks and its name ends in an ellipsis, chevron 8 dp after it; the field icon is `muted`, 12 dp from the start; below 600 dp, while searching, the list stands at the bottom of `main`, next to the dock |
| `item-row` | a bought item of `Compra`: name `muted` and struck through; a recipe row: name, meta line, one send button in the end slot; from 840 dp recipe rows stand in two columns with an 8 dp gap; compact density: the check keeps 8 dp above and below |
| `group-head` | a head with a button: the button fills the head, min height 48, padding 0 16, gap 8; its end holds the count (13 sp, `muted`, weight 400) and the chevron; a disabled head (search) keeps full opacity; a recipe head slides as a row and keeps the `bg` ground |
| `empty-state` | variant `apart` (empty `Compra` or `Recetas`): title and text in the middle of the room above the buttons, buttons at the bottom; the low empty state fills the area below the search |
| `list-group` (`Ajustes`) | each preference row holds an invisible native select over the full row (target: a row that opens a menu or dialog); keyboard focus draws a 2 dp `text` ring inside the row; a segmented control in a group has an 8 dp margin |

**DSV-24** [adapted] [new] The screen parts of the app have these measures.
- Evidence: `styles.css:300-986`; test: untested.
- Target: app composables.

| Part | Measures |
|---|---|
| `shop-lists` | padding 8 12, 1 dp `line` bottom border; below 600 dp hidden while the dock shows |
| `search` | padding 8 12, 1 dp `line` bottom border; below 600 dp hidden while the dock shows |
| `hint` | padding 12 16, 13 sp `muted`; `trip-open` padding 4 0 12, its `Ajustes` link in `text`, underlined at 3 dp offset, a full stop after it, tap height kept |
| `product-form` | padding 12 0 8 |
| `product-add` | suggestion list with 8 dp below |
| `products` | rows min height 48, 1 dp `line` top border; leaving rows collapse in 250 ms; a new row flashes 1.2 s; a disabled move button has no fill and opacity 0.4 |
| `version-status` | icon and text, gap 4; `checking` icon spins (1.2 s, linear); `current` `done`; `outdated` `warning`, full line, centred, text shown; `unknown` `danger`; text hidden (screen reader only) except for `outdated` |
| `day` | padding 8 16; title 14 sp weight 600 `text`, first letter upper case, 8 dp below; meals in two equal columns, gap 8. From 600 dp the day name stands at the start of its row (all names as wide as the longest), gap 12. Compact below 600 dp: short day name, padding 4 above 8 below, meal min height 48 and padding 4, meal name up to 2 lines |
| `meal` | column, padding 8 12, 1 dp `line` border, `surface`; label 12 sp `muted`; name one line with ellipsis. `free`: 1 dp dashed `control` border, no fill, name `muted`. `dish`: border `muted` |
| `meal-actions` | a split; with one button shown it takes both columns |
| `action-bar` of `Menú` | the split takes the full width; buttons pad 12 at the sides; a long label ends in an ellipsis |
| `settings-hint` | padding 0 16 8, start aligned, hyphens |
| `about` | margin 24 12 0, 12 sp `muted`, centred; lines wrap, gap 4 × 8 |
| `onboarding` | full screen over the app, `bg`, padding 20 + each inset, gap 16; top bar `Atrás` at the start and `Saltar` at the end; logo 96 dp; page centred, gap 24; title 24 sp, room for 2 lines; text `muted`, max 32 characters wide, room for 5 lines, line breaks kept; dots 8 dp round, `muted`, current `ink`, gap 8; next button min height 56; page enters with a 48 dp slide, 250 ms, ease-out; sample switch on `surface`, radius 8, room kept on each page |
| `onboarding-art` | width 240 dp (at most 70 % of the screen width), stroke `muted` 2, round caps; `art-card` `surface` fill; `art-accent` `primary` stroke; `art-soft` `primary-soft` fill with `primary` stroke; `art-solid` `primary` fill; `art-on-solid` `on-primary` stroke |
