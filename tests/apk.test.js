import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apkName, bundleName, missingSecrets, apksignerArgs, jarsignerArgs } from '../scripts/apk.mjs';

// The pure parts of npm run apk (INS-7); the build itself runs Bubblewrap.
test('the build files are named after the wrapper version', () => {
  assert.equal(apkName({ appVersionName: '1.0.0' }), 'bodega-1.0.0.apk');
  assert.equal(bundleName({ appVersionName: '1.0.0' }), 'bodega-1.0.0.aab');
});

test('a build with no signing secret names both', () => {
  assert.deepEqual(missingSecrets({}), ['BUBBLEWRAP_KEYSTORE_PASSWORD', 'BUBBLEWRAP_KEY_PASSWORD']);
});

test('a build with both signing secrets misses none', () => {
  assert.deepEqual(missingSecrets({ BUBBLEWRAP_KEYSTORE_PASSWORD: 'a', BUBBLEWRAP_KEY_PASSWORD: 'b' }), []);
});

test('an empty signing secret counts as missing', () => {
  assert.deepEqual(missingSecrets({ BUBBLEWRAP_KEYSTORE_PASSWORD: 'a', BUBBLEWRAP_KEY_PASSWORD: '' }), ['BUBBLEWRAP_KEY_PASSWORD']);
});

// Bubblewrap 1.27 puts the passwords in double quotes on a shell command line, so a `$`, a backtick
// or a `\\` in a password breaks the signature. apk.mjs signs by itself and names only the env vars.
const key = { path: '/keys/android.keystore', alias: 'bodega' };

test('the APK is signed with the passwords read from the environment', () => {
  assert.deepEqual(apksignerArgs(key, 'in.apk', 'out.apk'), [
    'sign', '--ks', '/keys/android.keystore', '--ks-key-alias', 'bodega',
    '--ks-pass', 'env:BUBBLEWRAP_KEYSTORE_PASSWORD', '--key-pass', 'env:BUBBLEWRAP_KEY_PASSWORD',
    '--out', 'out.apk', 'in.apk',
  ]);
});

test('the bundle is signed with the passwords read from the environment', () => {
  assert.deepEqual(jarsignerArgs(key, 'in.aab', 'out.aab'), [
    '-sigalg', 'SHA256withRSA', '-digestalg', 'SHA-256', '-keystore', '/keys/android.keystore',
    '-storepass:env', 'BUBBLEWRAP_KEYSTORE_PASSWORD', '-keypass:env', 'BUBBLEWRAP_KEY_PASSWORD',
    '-signedjar', 'out.aab', 'in.aab', 'bodega',
  ]);
});
