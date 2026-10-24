import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { LANGUAGES } from '#i18n';

// sw.js is a classic script: run it with a stub `self` and return its pure functions.
const source = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const { localizeManifest, staleCaches, SHELL } = vm.runInNewContext(`${source}\n;({ localizeManifest, staleCaches, SHELL })`, {
  self: { addEventListener: () => {} },
});

// An object of the vm realm has another Object.prototype: compare a plain copy.
const plain = (value) => JSON.parse(JSON.stringify(value));

const build = () => ({
  name: 'Bodega - Lista de la compra',
  short_name: 'Bodega',
  description: 'Lista de la compra',
  lang: 'es',
  id: './',
  icons: [{ src: 'icons/icon-192.png' }],
});

test('localizeManifest takes the language, the name and the description of the text', () => {
  const manifest = localizeManifest(build(), { lang: 'en', name: 'Bodega - Shopping list', description: 'Shopping list' });
  assert.equal(manifest.lang, 'en');
  assert.equal(manifest.name, 'Bodega - Shopping list');
  assert.equal(manifest.description, 'Shopping list');
});

test('localizeManifest keeps the short name and the other members', () => {
  const manifest = localizeManifest(build(), { lang: 'en', name: 'Bodega - Shopping list', description: 'Shopping list' });
  assert.equal(manifest.short_name, 'Bodega');
  assert.equal(manifest.id, build().id);
  assert.deepEqual(manifest.icons, build().icons);
});

test('localizeManifest with no text returns the manifest as it is', () => {
  assert.deepEqual(plain(localizeManifest(build(), null)), build());
});

test('localizeManifest ignores a member of the text that is not a non-empty string', () => {
  const manifest = localizeManifest(build(), { lang: 'en', name: '', description: 42, short_name: 'Other' });
  assert.equal(manifest.lang, 'en');
  assert.equal(manifest.name, build().name);
  assert.equal(manifest.description, build().description);
  assert.equal(manifest.short_name, 'Bodega');
});

test('localizeManifest does not change its input', () => {
  const input = build();
  localizeManifest(input, { lang: 'en', name: 'Bodega - Shopping list', description: 'Shopping list' });
  assert.deepEqual(input, build());
});

const withShortcuts = () => ({
  ...build(),
  shortcuts: [
    { name: 'Añadir artículo', url: './?open=add', icons: [{ src: 'icons/shortcut-add.png' }] },
    { name: 'Compra', url: './?open=active' },
    { name: 'Otro', url: './?other=1' },
  ],
});

test('localizeManifest takes the name of each shortcut from the text, by its open parameter', () => {
  const manifest = localizeManifest(withShortcuts(), { shortcuts: { add: 'Add item', active: 'Shopping' } });
  assert.deepEqual(plain(manifest.shortcuts.map(({ name }) => name)), ['Add item', 'Shopping', 'Otro']);
  assert.deepEqual(plain(manifest.shortcuts[0].icons), withShortcuts().shortcuts[0].icons);
  assert.equal(manifest.shortcuts[0].url, './?open=add');
});

test('localizeManifest keeps the name of a shortcut that the text has not as a non-empty string', () => {
  const manifest = localizeManifest(withShortcuts(), { shortcuts: { add: '', active: 7 } });
  assert.deepEqual(plain(manifest.shortcuts.map(({ name }) => name)), ['Añadir artículo', 'Compra', 'Otro']);
});

test('localizeManifest ignores shortcuts of the text that are not an object', () => {
  for (const shortcuts of [null, 'add', ['Add item']]) {
    const manifest = localizeManifest(withShortcuts(), { shortcuts });
    assert.deepEqual(plain(manifest.shortcuts), withShortcuts().shortcuts);
  }
});

test('localizeManifest does not change the shortcuts of its input', () => {
  const input = withShortcuts();
  localizeManifest(input, { shortcuts: { add: 'Add item' } });
  assert.deepEqual(input, withShortcuts());
});

test('the activate keeps the caches of another app', () => {
  const keys = ['shopping-shell-v21', 'shopping-shell-v23', 'shopping-manifest', 'lists-shell-v1', 'lists-manifest'];
  assert.deepEqual(plain(staleCaches(keys)), ['shopping-shell-v21']);
});

test('SHELL has the release notes of each language, so they show offline (VER-20)', () => {
  for (const lang of LANGUAGES) assert.ok(SHELL.includes(`./release-notes/${lang}.md`), lang);
});
