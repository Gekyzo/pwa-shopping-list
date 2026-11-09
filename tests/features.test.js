import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRegistry } from './bdd/steps.js';
import { runFeatures, featureFiles } from './bdd/run.js';
import { parseFeature } from './bdd/gherkin.js';
import { defineStoreSteps, storeWorld } from './bdd/steps/store.js';

const dir = new URL('./features/', import.meta.url).pathname;
const registry = createRegistry();
defineStoreSteps(registry);

runFeatures({ dir, registry, world: storeWorld });

test('each rule tag of a feature names a rule of docs/spec/', () => {
  const specDir = new URL('../docs/spec/', import.meta.url).pathname;
  const spec = readdirSync(specDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => readFileSync(specDir + file, 'utf8'))
    .join('\n');
  const defined = new Set([...spec.matchAll(/\*\*([A-Z]+-\d+)\*\*/g)].map(([, id]) => id));
  const tags = featureFiles(dir).flatMap((path) =>
    parseFeature(readFileSync(path, 'utf8'), path).scenarios.flatMap((scenario) => scenario.tags),
  );
  const rules = [...new Set(tags.filter((tag) => /^@[A-Z]+-\d+$/.test(tag)).map((tag) => tag.slice(1)))];
  assert.ok(rules.length > 0);
  assert.deepEqual(rules.filter((id) => !defined.has(id)), []);
});
