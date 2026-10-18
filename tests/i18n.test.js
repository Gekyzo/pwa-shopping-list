import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CATALOGS, FALLBACK, LANGUAGES, LANGUAGE_NAMES, intlTag, pseudo, resolveLanguage, translator } from '#i18n';

const fake = {
  en: { hello: 'Hello {name}', items: { one: '{count} item', other: '{count} items' }, onlyEn: 'English only' },
  es: { hello: 'Hola {name}', items: { one: '{count} artículo', other: '{count} artículos' } },
};

test('a stored language that is supported wins', () => {
  assert.equal(resolveLanguage(['es-ES'], 'en'), 'en');
});

test('a stored language that is not supported is ignored', () => {
  assert.equal(resolveLanguage(['es-ES'], 'xx'), 'es');
  assert.equal(resolveLanguage(['es-ES'], ''), 'es');
});

test('the first supported base of the preferred languages wins', () => {
  assert.equal(resolveLanguage(['nl', 'es-MX', 'en'], null), 'es');
  assert.equal(resolveLanguage(['EN-us'], null), 'en');
});

test('no supported preferred language gives the fallback', () => {
  for (const preferred of [['nl'], ['zh-Hant-TW'], [''], [null, 42], [], undefined, null, 'nl']) {
    assert.equal(resolveLanguage(preferred, null), FALLBACK);
  }
});

test('one preferred language that is text, not a list, resolves too', () => {
  assert.equal(resolveLanguage('es-AR', null), 'es');
});

test('a regional language resolves to its base', () => {
  assert.equal(resolveLanguage(['pt-BR'], null), 'pt');
  assert.equal(resolveLanguage(['nl', 'de-AT'], null), 'de');
  assert.equal(resolveLanguage(['ca-ES-valencia'], null), 'ca');
});

test('the languages are the seven of the design', () => {
  assert.deepEqual(LANGUAGES, ['ca', 'de', 'en', 'es', 'fr', 'it', 'pt']);
});

test('t replaces each placeholder with its parameter', () => {
  const t = translator('es', fake);
  assert.equal(t('hello', { name: 'Ana' }), 'Hola Ana');
  assert.equal(t('hello'), 'Hola {name}');
});

test('t puts user text in as typed', () => {
  const t = translator('es', fake);
  assert.equal(t('hello', { name: '{count}', count: 3 }), 'Hola {count}');
  assert.equal(t('hello', { name: '$& $1' }), 'Hola $& $1');
});

test('t selects the plural form by the count', () => {
  const t = translator('en', fake);
  assert.equal(t('items', { count: 1 }), '1 item');
  assert.equal(t('items', { count: 0 }), '0 items');
  assert.equal(t('items', { count: 2 }), '2 items');
});

test('a plural category with no form, or no count, uses the other form', () => {
  // `es` has the category `many` for a million.
  assert.equal(translator('es', fake)('items', { count: 1000000 }), '1000000 artículos');
  assert.equal(translator('en', fake)('items'), '{count} items');
});

test('a missing key shows the fallback text, then the key', () => {
  const t = translator('es', fake);
  assert.equal(t('onlyEn'), 'English only');
  assert.equal(t('nowhere'), 'nowhere');
});

test('each language has a catalog and a name', () => {
  assert.deepEqual(Object.keys(CATALOGS).sort(), [...LANGUAGES].sort());
  assert.deepEqual(Object.keys(LANGUAGE_NAMES).sort(), [...LANGUAGES].sort());
  assert.ok(LANGUAGES.includes(FALLBACK));
});

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map(([, name]) => name).sort();
const shape = (entry) =>
  typeof entry === 'string' ? placeholders(entry) : { one: placeholders(entry.one), other: placeholders(entry.other) };

test('each catalog has the keys of the Spanish catalog', () => {
  const keys = Object.keys(CATALOGS.es).sort();
  for (const lang of LANGUAGES) assert.deepEqual(Object.keys(CATALOGS[lang]).sort(), keys, lang);
});

test('each entry has the kind and the placeholders of the Spanish entry', () => {
  for (const lang of LANGUAGES) {
    for (const [key, entry] of Object.entries(CATALOGS.es)) {
      assert.deepEqual(shape(CATALOGS[lang][key]), shape(entry), `${lang} ${key}`);
    }
  }
});

test('a plural entry has the forms one and other, and no entry is empty', () => {
  for (const lang of LANGUAGES) {
    for (const [key, entry] of Object.entries(CATALOGS[lang])) {
      const texts = typeof entry === 'string' ? [entry] : [entry.one, entry.other];
      if (typeof entry !== 'string') assert.deepEqual(Object.keys(entry).sort(), ['one', 'other'], `${lang} ${key}`);
      for (const text of texts) assert.ok(typeof text === 'string' && text.trim() !== '', `${lang} ${key}`);
    }
  }
});

test('the Spanish catalog has each message key of the pure modules', () => {
  for (const file of ['store', 'recipes', 'storage', 'shops']) {
    const source = readFileSync(new URL(`../src/${file}.js`, import.meta.url), 'utf8');
    const keys = [...source.matchAll(/'((?:error|toast)\.\w+)'/g)].map(([, key]) => key);
    assert.ok(keys.length > 0, file);
    for (const key of keys) assert.ok(Object.hasOwn(CATALOGS.es, key), `${file} ${key}`);
  }
});

test('Portuguese uses the European plural rule: zero is plural', () => {
  assert.equal(translator('pt')('count.products', { count: 0 }), '0 produtos');
  assert.equal(translator('pt')('count.products', { count: 1 }), '1 produto');
});

test('intlTag gives the regional tag of Portuguese and the code of each other language', () => {
  assert.equal(intlTag('pt'), 'pt-PT');
  for (const lang of LANGUAGES.filter((code) => code !== 'pt')) assert.equal(intlTag(lang), lang);
});

test('pseudo accents the vowels, wraps in brackets and pads to 1.4 times the length', () => {
  const text = pseudo('Compra');
  assert.ok(text.startsWith('[') && text.endsWith(']'));
  assert.ok(text.length >= 9);
  assert.equal(pseudo('Compra'), '[Cömprä~]');
});

test('pseudo keeps each placeholder intact', () => {
  assert.ok(pseudo('{count} left').includes('{count}'));
});

test('the pseudo translator applies pseudo over es, to each plural form, and fills the parameters', () => {
  const t = translator('pseudo', fake);
  assert.equal(t('hello', { name: 'Ana' }).startsWith('[Hölä Ana'), true);
  assert.ok(t('items', { count: 1 }).includes('1 '));
  assert.ok(t('items', { count: 2 }).includes('2 '));
  assert.notEqual(t('items', { count: 1 }), t('items', { count: 2 }));
});

test('pseudo is not a language and no navigator language or stored value selects it', () => {
  assert.ok(!LANGUAGES.includes('pseudo'));
  assert.equal(resolveLanguage(['pseudo', 'es'], 'pseudo'), 'es');
  assert.equal(resolveLanguage(['pseudo'], null), FALLBACK);
});
