# Design system

The parts that the screen is built from, and the rules that keep them the same on each screen.
`designs/index.html` shows each part; `tests/design.test.js` checks the rules.

## Layers

- **DS-1** `styles.css` declares `@layer tokens, base, components, layouts, screens;`, and each
  rule is in one of the five layers. `tokens` holds `:root` and the themes, `base` the element
  defaults, `components` one block class per component, `layouts` the arrangement classes, and
  `screens` the parts of one section.

## Tokens

- **DS-2** A raw value of colour, spacing (`padding`, `margin`, `gap`, `inset`), font size, font
  weight, font family, radius, shadow or duration is only in `@layer tokens`. Other layers use
  the tokens. `0`, `1px` and `2px` border widths, `%`, `auto`, `inherit`, `currentColor`,
  `none` and `transparent` are always allowed. `width` and `height` are raw only in
  `components` and `layouts`.

## Names

- **DS-3** A component is a block class. A variant is a modifier class, valid only with its
  block: `class="button primary"`. A state is an attribute; the state classes of DS-6 are the
  exception.
- **DS-4** No selector styles a bare element inside a class of another component, and no
  selector has an id.

## Icons

- **DS-5** Each icon is a `<symbol>` of `icons.svg`, used as
  `<svg class="icon"><use href="icons.svg#id"/></svg>`. In `src/ui/` only `icon(name)` builds an
  SVG. The drawings of the walkthrough are inline art inside `onboarding-art`.

## Documentation

- **DS-6** Each component, layout and screen part has one comment block before its first rule,
  with the tags `@component`, `@summary`, `@scope`, `@part`, `@variant`, `@state` and
  `@example`. `@state` names a class that the code sets for a passing state.
- **DS-7** `designs/index.html`, served by `npm run serve`, shows the tokens, the icons and each
  documented part with its live examples, its snippet and the files that use it.

## Parts

The parts of the catalogue, by layer. A request for a screen names them.

| Layer | Parts |
|---|---|
| components | `icon` |
