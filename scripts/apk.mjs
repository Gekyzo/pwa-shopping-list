// npm run apk: build the signed APK and AAB of the Android wrapper from twa/twa-manifest.json
// (INS-7). Bubblewrap regenerates the Gradle project in twa/ and builds it unsigned; this script
// signs both files and puts them in twa/out/.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const BUBBLEWRAP = '@bubblewrap/cli@1.27.0';
const BUILD_TOOLS = '36.1.0';
const STORE_SECRET = 'BUBBLEWRAP_KEYSTORE_PASSWORD';
const KEY_SECRET = 'BUBBLEWRAP_KEY_PASSWORD';

export const apkName = ({ appVersionName }) => `bodega-${appVersionName}.apk`;
export const bundleName = ({ appVersionName }) => `bodega-${appVersionName}.aab`;
export const missingSecrets = (env) => [STORE_SECRET, KEY_SECRET].filter((name) => !env[name]);

// Bubblewrap 1.27 passes the passwords through a shell, which changes a `$`, a backtick or a `\`
// in them. These name the env vars instead, so a password never reaches a command line.
export const apksignerArgs = ({ path, alias }, input, output) => [
  'sign', '--ks', path, '--ks-key-alias', alias,
  '--ks-pass', `env:${STORE_SECRET}`, '--key-pass', `env:${KEY_SECRET}`,
  '--out', output, input,
];
export const jarsignerArgs = ({ path, alias }, input, output) => [
  '-sigalg', 'SHA256withRSA', '-digestalg', 'SHA-256', '-keystore', path,
  '-storepass:env', STORE_SECRET, '-keypass:env', KEY_SECRET,
  '-signedjar', output, input, alias,
];

const main = () => {
  const missing = missingSecrets(process.env);
  if (missing.length) {
    console.error(`apk: set ${missing.join(' and ')} in the shell first.`);
    process.exit(1);
  }
  const { jdkPath, androidSdkPath } = JSON.parse(readFileSync(`${homedir()}/.bubblewrap/config.json`, 'utf8'));
  const env = { ...process.env, JAVA_HOME: jdkPath, PATH: `${jdkPath}/bin:${process.env.PATH}` };
  const twa = fileURLToPath(new URL('../twa/', import.meta.url));
  const manifest = JSON.parse(readFileSync(`${twa}twa-manifest.json`, 'utf8'));
  const unsigned = {
    apk: `${twa}app-release-unsigned-aligned.apk`,
    bundle: `${twa}app/build/outputs/bundle/release/app-release.aab`,
  };
  for (const file of Object.values(unsigned)) rmSync(file, { force: true });

  const bubblewrap = (...args) => execFileSync('npx', ['--yes', BUBBLEWRAP, ...args], { cwd: twa, stdio: 'inherit' });
  bubblewrap('update', '--skipVersionUpgrade');
  bubblewrap('build', '--skipPwaValidation', '--skipSigning');
  // Bubblewrap exits 0 when Gradle fails, so a missing file is the sign of a failed build.
  const absent = Object.values(unsigned).filter((file) => !existsSync(file));
  if (absent.length) {
    console.error(`apk: Bubblewrap wrote no ${absent.join(' and ')}. Read the Gradle output above.`);
    process.exit(1);
  }

  mkdirSync(`${twa}out`, { recursive: true });
  const apk = `${twa}out/${apkName(manifest)}`;
  const bundle = `${twa}out/${bundleName(manifest)}`;
  const run = (command, args) => execFileSync(command, args, { env, stdio: 'inherit' });
  run(`${androidSdkPath}/build-tools/${BUILD_TOOLS}/apksigner`, apksignerArgs(manifest.signingKey, unsigned.apk, apk));
  run(`${jdkPath}/bin/jarsigner`, jarsignerArgs(manifest.signingKey, unsigned.bundle, bundle));
  console.log(`apk: ${apk}\napk: ${bundle}`);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
