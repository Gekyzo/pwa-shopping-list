// Writes the version of the next deploy to version.json and prints its build number.
// Run by .githooks/pre-push.
import { readFileSync, writeFileSync } from 'node:fs';
import { parseVersion, nextVersion } from '../src/version.js';

const file = new URL('../version.json', import.meta.url);

const read = () => {
  try {
    return parseVersion(JSON.parse(readFileSync(file, 'utf8')));
  } catch {
    return null;
  }
};

const version = nextVersion(read(), new Date());
writeFileSync(file, `${JSON.stringify(version, null, 2)}\n`);
console.log(version.build);
