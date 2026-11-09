import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRegistry } from './bdd/steps.js';
import { runFeatures, featureFiles } from './bdd/run.js';
import { parseFeature } from './bdd/gherkin.js';
import { readSpec, parseExempt, coverageGaps } from './bdd/coverage.js';
import { createWorld } from './bdd/world.js';
import { defineAllSteps } from './bdd/steps/index.js';

const root = new URL('../', import.meta.url).pathname;
const dir = `${root}tests/features/`;
const specDir = `${root}docs/spec/`;

// The spec documents that the coverage check reads. A task of the BDD coverage plan adds its
// documents; the others are pending.
const CHECKED = ['02-data-model.md', '03-lists.md', '04-arrange.md', '05-shops.md', '06-recipes.md', '07-screen.md', '08-storage.md', '09-languages.md', '10-offline-version.md', '11-integrations.md', '13-menu.md', '16-install.md', '17-aisles.md', '20-address.md'];
const PENDING = new Set(readdirSync(specDir).filter((file) => file.endsWith('.md') && !CHECKED.includes(file)));

const registry = createRegistry();
defineAllSteps(registry);
runFeatures({ dir, registry, world: createWorld });

test('the features cover each live rule of a checked spec document', () => {
  const tags = featureFiles(dir).flatMap((path) =>
    parseFeature(readFileSync(path, 'utf8'), path).scenarios.flatMap((scenario) => scenario.tags),
  );
  const gaps = coverageGaps({
    rules: readSpec(specDir),
    tags,
    exempt: parseExempt(readFileSync(`${dir}exempt.txt`, 'utf8')),
    pending: PENDING,
    exists: (path) => existsSync(root + path),
  });
  assert.deepEqual(gaps, { untested: [], both: [], unknown: [], removed: [], noEvidence: [] });
});
