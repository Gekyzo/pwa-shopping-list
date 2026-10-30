import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAGES, hasBack, isLast, offersSample, pageTextKey, shouldShow, step, textParts } from '#onboarding';
import { CATALOGS, LANGUAGES } from '#i18n';

test('PAGES has the six pages in their order, each one time', () => {
  assert.deepEqual(PAGES, ['lists', 'trip', 'row', 'sections', 'recipes', 'sample']);
  assert.equal(new Set(PAGES).size, PAGES.length);
});

test('shouldShow is true for no flag and no stored state', () => {
  assert.equal(shouldShow({ seen: false, hasState: false }), true);
});

test('shouldShow is false for a stored state', () => {
  assert.equal(shouldShow({ seen: false, hasState: true }), false);
});

test('shouldShow is false after the walkthrough was seen', () => {
  assert.equal(shouldShow({ seen: true, hasState: false }), false);
  assert.equal(shouldShow({ seen: true, hasState: true }), false);
});

test('step goes one page forward and one page back', () => {
  assert.equal(step(0, 1), 1);
  assert.equal(step(2, 1), 3);
  assert.equal(step(3, -1), 2);
  assert.equal(step(1, -1), 0);
});

test('step stays on the page for no direction', () => {
  assert.equal(step(2, 0), 2);
});

test('step does not go past the first and the last page', () => {
  assert.equal(step(0, -1), 0);
  assert.equal(step(PAGES.length - 1, 1), PAGES.length - 1);
});

test('isLast is true for the last page only', () => {
  assert.equal(isLast(PAGES.length - 1), true);
  assert.equal(isLast(0), false);
  assert.equal(isLast(PAGES.length - 2), false);
});

test('textParts marks the text between backticks as a key', () => {
  assert.deepEqual(textParts('Toca `↻` en lo de siempre.'), [
    { text: 'Toca ', key: false },
    { text: '↻', key: true },
    { text: ' en lo de siempre.', key: false },
  ]);
});

test('textParts gives one plain part for a text with no backtick', () => {
  assert.deepEqual(textParts('Desliza la pantalla.'), [{ text: 'Desliza la pantalla.', key: false }]);
});

test('textParts reads keys at the start and at the end, and leaves out empty parts', () => {
  assert.deepEqual(textParts('`+` y `↻`'), [
    { text: '+', key: true },
    { text: ' y ', key: false },
    { text: '↻', key: true },
  ]);
});

test('textParts keeps a backtick with no pair as text', () => {
  assert.deepEqual(textParts('Abre `menú'), [{ text: 'Abre `menú', key: false }]);
  assert.deepEqual(textParts('`+` y `fin'), [
    { text: '+', key: true },
    { text: ' y `fin', key: false },
  ]);
});

test('textParts reads an icon of the sprite at the start of a key, with or without text', () => {
  assert.deepEqual(textParts('Con `#cart-add`. En `#menu Menú` planificas.'), [
    { text: 'Con ', key: false },
    { text: '', key: true, icon: 'cart-add' },
    { text: '. En ', key: false },
    { text: 'Menú', key: true, icon: 'menu' },
    { text: ' planificas.', key: false },
  ]);
});

test('textParts reads a # that is not at the start of a key, or a lone #, as text', () => {
  assert.deepEqual(textParts('`a #menu` y `#`'), [
    { text: 'a #menu', key: true },
    { text: ' y ', key: false },
    { text: '#', key: true },
  ]);
});

test('textParts marks the text between two ** as strong', () => {
  assert.deepEqual(textParts('Toca **Usar sin cuenta** en Iniciar sesión.'), [
    { text: 'Toca ', key: false },
    { text: 'Usar sin cuenta', key: false, strong: true },
    { text: ' en Iniciar sesión.', key: false },
  ]);
  assert.deepEqual(textParts('**Todo**'), [{ text: 'Todo', key: false, strong: true }]);
});

test('textParts reads a key beside bold text and a key inside bold text', () => {
  assert.deepEqual(textParts('**Toca** `↻`'), [
    { text: 'Toca', key: false, strong: true },
    { text: ' ', key: false },
    { text: '↻', key: true },
  ]);
  assert.deepEqual(textParts('**Toca `#menu Menú` ya**'), [
    { text: 'Toca ', key: false, strong: true },
    { text: 'Menú', key: true, icon: 'menu', strong: true },
    { text: ' ya', key: false, strong: true },
  ]);
});

test('textParts keeps a ** with no pair as text', () => {
  assert.deepEqual(textParts('Abre **menú'), [{ text: 'Abre **menú', key: false }]);
  assert.deepEqual(textParts('**a** y **b'), [
    { text: 'a', key: false, strong: true },
    { text: ' y **b', key: false },
  ]);
  assert.deepEqual(textParts('**a `+` b'), [
    { text: '**a ', key: false },
    { text: '+', key: true },
    { text: ' b', key: false },
  ]);
});

test('textParts leaves a ** inside a key as the text of the key', () => {
  assert.deepEqual(textParts('`**` y **b**'), [
    { text: '**', key: true },
    { text: ' y ', key: false },
    { text: 'b', key: false, strong: true },
  ]);
});

test('hasBack is false on the first page and true on the others', () => {
  assert.equal(hasBack(0), false);
  assert.equal(hasBack(1), true);
  assert.equal(hasBack(PAGES.length - 1), true);
});

test('offersSample is true on the last page while the state has no items and no recipes (ONB-13)', () => {
  assert.equal(offersSample({ page: 'sample', items: 0, recipes: 0 }), true);
  assert.equal(offersSample({ page: 'recipes', items: 0, recipes: 0 }), false);
});

test('offersSample is false when the state has items or recipes, such as after a login with account data', () => {
  assert.equal(offersSample({ page: 'sample', items: 3, recipes: 0 }), false);
  assert.equal(offersSample({ page: 'sample', items: 0, recipes: 1 }), false);
});

test('the last page says nothing about the sample when it does not offer it (ONB-13)', () => {
  assert.equal(pageTextKey('sample', true), 'onboarding.sample.text');
  assert.equal(pageTextKey('sample', false), 'onboarding.sample.textNoSample');
  assert.equal(pageTextKey('lists', false), 'onboarding.lists.text');
  for (const lang of LANGUAGES) {
    const text = CATALOGS[lang]['onboarding.sample.textNoSample'];
    assert.ok(text, lang);
    assert.doesNotMatch(text, /\{name\}/, lang);
  }
});
