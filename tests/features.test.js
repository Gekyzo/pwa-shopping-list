import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRegistry } from './bdd/steps.js';
import { runFeatures, featureFiles } from './bdd/run.js';
import { parseFeature } from './bdd/gherkin.js';
import { readSpec, parseExempt, coverageGaps, coverageTags } from './bdd/coverage.js';
import { createWorld } from './bdd/world.js';
import { defineAllSteps } from './bdd/steps/index.js';

const root = new URL('../', import.meta.url).pathname;
const dir = `${root}tests/features/`;
const specDir = `${root}docs/spec/`;

const registry = createRegistry();
defineAllSteps(registry);
runFeatures({ dir, registry, world: createWorld });

test('the features cover each live rule of the specification', () => {
  const tags = coverageTags(featureFiles(dir).map((path) => parseFeature(readFileSync(path, 'utf8'), path)));
  const gaps = coverageGaps({
    rules: readSpec(specDir),
    tags,
    exempt: parseExempt(readFileSync(`${dir}exempt.txt`, 'utf8')),
    pending: new Set(),
    exists: (path) => existsSync(root + path),
  });
  assert.deepEqual(gaps, { untested: [], both: [], unknown: [], removed: [], noEvidence: [] });
});
