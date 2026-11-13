import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The Android wrapper (INS-5, INS-7) against the web manifest it wraps.
const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const json = (path) => JSON.parse(read(path));

const web = json('manifest.webmanifest');
const twa = json('twa/twa-manifest.json');
const origin = 'https://bodega.artisandevs.duckdns.org/';
// Bubblewrap writes colours back in uppercase.
const colour = (value) => value.toLowerCase();
const darkTheme = read('index.html').match(/name="theme-color" media="\(prefers-color-scheme: dark\)" content="([^"]+)"/)[1];

test('the wrapper has the package id and the host of the app', () => {
  assert.equal(twa.packageId, 'io.github.polarisworks.bodega');
  assert.equal(twa.host, 'bodega.artisandevs.duckdns.org');
  assert.equal(twa.startUrl, '/');
  assert.equal(twa.display, 'standalone');
});

test('the wrapper names the app as the web manifest does', () => {
  assert.equal(twa.name, web.name);
  assert.equal(twa.launcherName, web.short_name);
});

test('the wrapper has the colours and orientation of the web manifest', () => {
  assert.equal(colour(twa.themeColor), web.theme_color);
  assert.equal(colour(twa.backgroundColor), web.background_color);
  assert.equal(colour(twa.navigationColor), web.background_color);
  assert.equal(colour(twa.themeColorDark), darkTheme);
  assert.equal(colour(twa.navigationColorDark), darkTheme);
  // Bubblewrap saves colours with no alpha, so a transparent divider comes back black: the divider
  // takes the colour of the navigation bar instead.
  assert.equal(colour(twa.navigationDividerColor), colour(twa.navigationColor));
  assert.equal(colour(twa.navigationDividerColorDark), colour(twa.navigationColorDark));
  assert.equal(twa.orientation, 'any');
  assert.equal(twa.orientation, web.orientation);
});

test('the wrapper icons are the icons of the web manifest', () => {
  assert.ok(twa.iconUrl.startsWith(origin));
  assert.ok(twa.iconUrl.endsWith('/icons/icon-512.png'));
  assert.ok(twa.maskableIconUrl.startsWith(origin));
  assert.ok(twa.maskableIconUrl.endsWith('/icons/icon-maskable-512.png'));
});

// Bubblewrap puts a shortcut url in `android:data` of the launch intent, so it is absolute.
test('the wrapper has each shortcut of the web manifest, in order', () => {
  const ours = twa.shortcuts.map(({ name, shortName, url }) => ({ name, shortName, url }));
  const theirs = web.shortcuts.map(({ name, url }) => ({ name, shortName: name, url: new URL(url, origin).href }));
  assert.deepEqual(ours, theirs);
});

test('the wrapper shortcut icons are the shortcut icons of the web manifest', () => {
  const theirs = web.shortcuts.map(({ icons: [icon] }) => new URL(icon.src, origin).href);
  assert.deepEqual(twa.shortcuts.map((shortcut) => shortcut.chosenIconUrl), theirs);
});

test('the wrapper version is semver and its code is a positive integer', () => {
  assert.match(twa.appVersionName, /^\d+\.\d+\.\d+$/);
  assert.ok(Number.isInteger(twa.appVersionCode) && twa.appVersionCode > 0);
  // Bubblewrap 1.27 reads the name from `appVersion` and writes both keys.
  assert.equal(twa.appVersion, twa.appVersionName);
});

// android-browser-helper 2.7.4, which Bubblewrap 1.27 builds with, declares minSdk 24.
test('the wrapper min SDK is the one of android-browser-helper', () => {
  assert.equal(twa.minSdkVersion, 24);
});

test('the wrapper signs with the key outside the repository', () => {
  assert.equal(twa.signingKey.path, '~/.local/share/bodega/android.keystore');
  assert.equal(twa.signingKey.alias, 'bodega');
});

test('the generated project is not committed', () => {
  const lines = read('twa/.gitignore').split('\n').map((line) => line.trim()).filter(Boolean);
  for (const pattern of ['*', '!twa-manifest.json', '!.gitignore']) assert.ok(lines.includes(pattern), pattern);
});

// Chrome shows the app with no URL bar only when the site names the package and its key (INS-6).
test('the asset links grant the app to the package of the wrapper', () => {
  const links = json('.well-known/assetlinks.json');
  assert.ok(Array.isArray(links) && links.length > 0);
  for (const { relation, target } of links) {
    assert.deepEqual(relation, ['delegate_permission/common.handle_all_urls']);
    assert.equal(target.namespace, 'android_app');
    assert.equal(target.package_name, twa.packageId);
  }
});

test('the asset links and the wrapper list the same fingerprints', () => {
  const links = json('.well-known/assetlinks.json');
  const listed = links.flatMap(({ target }) => target.sha256_cert_fingerprints).sort();
  assert.ok(listed.length > 0);
  assert.deepEqual(listed, twa.fingerprints.map(({ value }) => value).sort());
  for (const value of listed) assert.match(value, /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/);
});
