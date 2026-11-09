// Runs the `.feature` files of a folder with `node:test`: one suite for each feature, one test for
// each scenario. Each scenario gets a new world from `world()`, and each step function is called
// as `fn(world, ...args)`, with a data table (see `dataTable`) or a doc string as the last
// argument when the step has one. A scenario tagged `@skip` is skipped, one tagged `@todo` is a todo.

import { describe, test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parseFeature } from './gherkin.js';
import { dataTable } from './steps.js';

export const featureFiles = (dir) =>
  readdirSync(dir, { recursive: true })
    .filter((file) => file.endsWith('.feature'))
    .sort()
    .map((file) => join(dir, file));

export const runScenario = async (scenario, registry, world, file = '<feature>') => {
  for (const step of scenario.steps) {
    const extra = step.table ? [dataTable(step.table)] : step.docString !== undefined ? [step.docString] : [];
    try {
      const { definition, args } = registry.find(step.text);
      await definition.fn(world, ...args, ...extra);
    } catch (error) {
      error.message = `${step.keyword} ${step.text}\n  at ${file}:${step.line}\n${error.message}`;
      throw error;
    }
  }
};

export const runFeatures = ({ dir, registry, world = () => ({}) }) => {
  for (const path of featureFiles(dir)) {
    const file = relative(process.cwd(), path);
    const feature = parseFeature(readFileSync(path, 'utf8'), file);
    describe(`Feature: ${feature.name}`, () => {
      for (const scenario of feature.scenarios) {
        const name = scenario.rule ? `${scenario.rule} › ${scenario.name}` : scenario.name;
        const options = { skip: scenario.tags.includes('@skip'), todo: scenario.tags.includes('@todo') };
        test(name, options, () => runScenario(scenario, registry, world(), file));
      }
    });
  }
};
