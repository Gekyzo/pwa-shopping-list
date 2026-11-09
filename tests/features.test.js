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

// The spec documents that the coverage check does not read yet. A task of the BDD coverage plan
// removes its documents from this set.
const PENDING = new Set(readdirSync(specDir).filter((file) => file.endsWith('.md') && file !== 'README.md'));

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
