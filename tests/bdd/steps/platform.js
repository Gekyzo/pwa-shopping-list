// The steps of the languages (`src/i18n.js`), the version and the release notes (`src/version.js`,
// `src/whatsnew.js`, `src/onboarding.js`), the install offer (`src/install.js`), the shortcuts and
// the arrival (`src/sections.js`, `src/store.js`) and the pure functions of `sw.js`.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { LANGUAGES, resolveLanguage, translator, CATALOGS, intlTag } from '#i18n';
import { parseVersion, compareVersions, versionStatus, nextVersion } from '#version';
import { parseNotes, nextSeen } from '#whatsnew';
import { textParts } from '#onboarding';
import { installNext, installStart, showInstall } from '#install';
import { SHORTCUTS, shortcutStart } from '#sections';
import { arrivalMessage } from '#store';
import { loadLanguage, saveLanguage } from '#storage';
import { names, yesNo } from '../world.js';

// sw.js is a classic script: run it with a stub `self` and take its pure functions, as
// tests/sw.test.js does.
const source = readFileSync(new URL('../../../sw.js', import.meta.url), 'utf8');
const worker = vm.runInNewContext(`${source}\n;({ localizeManifest, staleCaches, keyOf })`, {
  self: { addEventListener: () => {} },
  URL,
});
// An object of the vm realm has another Object.prototype: compare a plain copy.
const plain = (value) => JSON.parse(JSON.stringify(value));

const versionOf = (text) => (text === 'none' ? null : { version: text, date: '2026-11-09' });
const ORDERS = { 'newer than': 1, 'older than': -1, 'the same as': 0 };

export const definePlatformSteps = ({ Given, When, Then }) => {
  Then('the languages are {string}', (world, text) => {
    assert.deepEqual(LANGUAGES, names(text));
  });
  Then('the phone languages {string} with the stored choice {string} give {word}', (world, phone, stored, lang) => {
    assert.equal(resolveLanguage(names(phone), stored || null), lang);
  });
  When('I choose the language {string}', (world, lang) => {
    assert.equal(saveLanguage(world.storage, lang), true);
  });
  When('I choose the language Automático', (world) => {
    assert.equal(saveLanguage(world.storage, null), true);
  });
  Then('the stored language is {string}', (world, lang) => {
    assert.equal(loadLanguage(world.storage, LANGUAGES), lang);
  });
  Then('the stored language is none', (world) => {
    assert.equal(loadLanguage(world.storage, LANGUAGES), null);
  });
  Then('in {word} the text {string} reads {string}', (world, lang, key, text) => {
    assert.equal(translator(lang)(key), text);
  });
  Then('in {word} the text {string} with the name {string} reads {string}', (world, lang, key, name, text) => {
    assert.equal(translator(lang)(key, { name }), text);
  });
  Then('in {word} with a catalog that lacks {string} the text {string} reads {string}', (world, lang, missing, key, text) => {
    const catalogs = { ...CATALOGS, en: { ...CATALOGS.en, [missing]: text } };
    assert.equal(catalogs[lang][missing], undefined);
    assert.equal(translator(lang, catalogs)(key), text);
  });
  Then('in {word} the plural of {int} is {word}', (world, lang, count, form) => {
    assert.equal(new Intl.PluralRules(intlTag(lang)).select(count), form);
    const catalogs = { [lang]: { 'x.count': { one: 'one', other: 'other' } }, en: {} };
    assert.equal(translator(lang, catalogs)('x.count', { count }), form);
  });

  Then('the version file {string} is {word}', (world, json, result) => {
    assert.equal(parseVersion(JSON.parse(json))?.version ?? 'no', result === 'no' ? 'no' : result);
  });
  Then('the version file {string} is no version', (world, json) => {
    assert.equal(parseVersion(JSON.parse(json)), null);
  });
  Then(/the version (\S+) is (newer than|older than|the same as) (\S+)/, (world, a, order, b) => {
    assert.equal(Math.sign(compareVersions(a, b)), ORDERS[order]);
  });
  Then('the status of the running version {word} with the deployed version {word} is {word}', (world, running, latest, status) => {
    assert.equal(versionStatus(versionOf(running), versionOf(latest)), status);
  });
  Then('a {word} bump of {word} gives {word}', (world, level, from, to) => {
    assert.equal(nextVersion(versionOf(from), new Date('2026-11-09T10:00:00Z'), level).version, to);
  });

  Given('the release notes are:', (world, text) => {
    world.notes = text;
  });
  Then('the released notes are:', (world, table) => {
    const shown = parseNotes(world.notes).map(({ version, date, notes }) => ({ version, date, notes: notes.join(' · ') }));
    assert.deepEqual(shown, table.hashes);
  });
  Then(/at a start with the seen version (\S+), the running version (\S+), notes (read|lost) and (no cover|a cover), Novedades shows "([^"]*)" and stores (\S+)/,
    (world, seen, running, loaded, cover, show, store) => {
      const result = nextSeen({
        entries: parseNotes(world.notes),
        seen: seen === 'none' ? null : seen,
        running,
        loaded: loaded === 'read',
        blocked: cover === 'a cover',
      });
      assert.deepEqual(result.show.map(({ version }) => version), names(show));
      assert.equal(result.store ?? 'none', store);
    },
  );
  Then(/the note "([^"]*)" shows (.+)/, (world, note, text) => {
    const expected = [...text.matchAll(/(text|key|bold) "([^"]*)"(?: with the icon (\S+))?/g)].map(([, kind, part, icon]) => ({
      text: part,
      key: kind === 'key',
      ...(icon && { icon }),
      ...(kind === 'bold' && { strong: true }),
    }));
    assert.deepEqual(textParts(note), expected);
  });

  Then('from the install state {word} the event {word} gives {word}, and the Install button shows: {word}',
    (world, from, event, to, button) => {
      const next = installNext(from, event);
      assert.equal(next, to);
      assert.equal(showInstall(next), yesNo(button));
    },
  );
  Then(/an app that starts (standalone|in the browser) starts (\w+)/, (world, mode, state) => {
    assert.equal(installStart(mode === 'standalone'), state);
  });

  Then('a start with the shortcut {string} shows {word}, with the add sheet: {word}', (world, name, view, add) => {
    const start = shortcutStart(name);
    assert.equal(start?.view ?? 'none', view);
    assert.equal(Boolean(start?.add), yesNo(add));
  });
  Then('the shortcuts are {string}', (world, text) => {
    assert.deepEqual(SHORTCUTS, names(text));
  });
  Then('the arrival says {string} with {int} item(s)', (world, key, count) => {
    assert.deepEqual(arrivalMessage(world.state), { key, params: { count, list: 'active' } });
  });
  Then('the arrival says nothing', (world) => {
    assert.equal(arrivalMessage(world.state), null);
  });

  Given('the manifest is:', (world, json) => {
    world.manifest = JSON.parse(json);
  });
  When('the worker answers the manifest with the text:', (world, json) => {
    world.manifest = plain(worker.localizeManifest(world.manifest, JSON.parse(json)));
  });
  Then('the manifest has the name {string}, the short name {string}, the language {string} and the description {string}',
    (world, name, shortName, lang, description) => {
      const { manifest } = world;
      assert.deepEqual(
        { name: manifest.name, short_name: manifest.short_name, lang: manifest.lang, description: manifest.description },
        { name, short_name: shortName, lang, description },
      );
    },
  );
  Then('the manifest shortcuts are {string}', (world, text) => {
    assert.deepEqual(world.manifest.shortcuts.map((shortcut) => shortcut.name), names(text));
  });
  Then('of the caches {string} the activation deletes {string}', (world, keys, deleted) => {
    assert.deepEqual(plain(worker.staleCaches(names(keys))), names(deleted));
  });
  Then('the cache key of {string} is {string}', (world, url, key) => {
    assert.equal(worker.keyOf(url), key);
  });
};
