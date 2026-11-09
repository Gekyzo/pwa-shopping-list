import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFeature, parseRow } from './bdd/gherkin.js';
import { compile, createRegistry, dataTable } from './bdd/steps.js';
import { runScenario } from './bdd/run.js';
import { specRules, parseExempt, coverageGaps } from './bdd/coverage.js';

const texts = (scenario) => scenario.steps.map((step) => `${step.keyword} ${step.text}`);

test('parseFeature reads the feature, its tags, its description and its scenarios', () => {
  const feature = parseFeature(`
# a comment
@area
Feature: Lists
  Free text that describes the feature.

  @one @two # a trailing comment
  Scenario: Add
    Given an empty list
    When I add "Milk"
    Then the list has 1 item
    And there is no error
    But nothing else
    * one more
`);
  assert.equal(feature.name, 'Lists');
  assert.deepEqual(feature.tags, ['@area']);
  assert.equal(feature.scenarios.length, 1);
  const [scenario] = feature.scenarios;
  assert.equal(scenario.name, 'Add');
  assert.deepEqual(scenario.tags, ['@area', '@one', '@two']);
  assert.equal(scenario.line, 8);
  assert.deepEqual(texts(scenario), [
    'Given an empty list',
    'When I add "Milk"',
    'Then the list has 1 item',
    'And there is no error',
    'But nothing else',
    '* one more',
  ]);
});

test('parseFeature puts the Background steps before each scenario', () => {
  const feature = parseFeature(`Feature: F
  Background:
    Given a start
  Scenario: A
    When a
  Example: B
    When b
`);
  assert.deepEqual(feature.scenarios.map(texts), [
    ['Given a start', 'When a'],
    ['Given a start', 'When b'],
  ]);
});

test('parseFeature gives a scenario of a Rule the Background of the feature, then that of the rule', () => {
  const feature = parseFeature(`Feature: F
  Background:
    Given a feature start
  Scenario: Outside
    When outside
  @r
  Rule: R
    Background:
      Given a rule start
    Scenario: Inside
      When inside
`);
  const [outside, inside] = feature.scenarios;
  assert.equal(outside.rule, null);
  assert.deepEqual(texts(outside), ['Given a feature start', 'When outside']);
  assert.equal(inside.rule, 'R');
  assert.deepEqual(inside.tags, ['@r']);
  assert.deepEqual(texts(inside), ['Given a feature start', 'Given a rule start', 'When inside']);
});

test('parseFeature expands an outline into one scenario for each row of each Examples', () => {
  const feature = parseFeature(`Feature: F
  @o
  Scenario Outline: Add <name>
    When I add "<name>"
    Then I see:
      | name   | <unknown> |
      | <name> | x         |
    @first
    Examples:
      | name |
      | Milk |
    Scenarios:
      | name  |
      | Bread |
`);
  assert.deepEqual(feature.scenarios.map((s) => s.name), ['Add Milk', 'Add Bread']);
  assert.deepEqual(feature.scenarios.map((s) => s.tags), [['@o', '@first'], ['@o']]);
  assert.deepEqual(feature.scenarios.map((s) => s.line), [11, 14]);
  const [milk] = feature.scenarios;
  assert.equal(milk.steps[0].text, 'I add "Milk"');
  assert.deepEqual(milk.steps[1].table, [['name', '<unknown>'], ['Milk', 'x']]);
});

test('parseFeature numbers the scenarios of an outline whose name has no placeholder', () => {
  const feature = parseFeature(`Feature: F
  Scenario Template: Same
    When <a>
    Examples:
      | a |
      | x |
      | y |
`);
  assert.deepEqual(feature.scenarios.map((s) => s.name), ['Same #1', 'Same #2']);
  assert.deepEqual(feature.scenarios.map((s) => s.steps[0].text), ['x', 'y']);
});

test('parseFeature trims a step text that a placeholder leaves with a trailing space', () => {
  const feature = parseFeature(`Feature: F
  Scenario Outline: O
    When I finish <how>
    Examples:
      | how |
      |     |
`);
  assert.equal(feature.scenarios[0].steps[0].text, 'I finish');
});

test('parseFeature reads a doc string with the indent of its fence removed', () => {
  const feature = parseFeature(`Feature: F
  Scenario: S
    Given the text:
      """
      first
        second
      """
    And the code:
      \`\`\`
      x
      \`\`\`
`);
  const [text, code] = feature.scenarios[0].steps;
  assert.equal(text.docString, 'first\n  second');
  assert.equal(code.docString, 'x');
});

test('parseRow trims the cells and reads the escapes', () => {
  assert.deepEqual(parseRow('| a | b \\| c |  |'), ['a', 'b | c', '']);
  assert.deepEqual(parseRow('| one\\ntwo | back\\\\slash |'), ['one\ntwo', 'back\\slash']);
});

test('parseFeature gives the file and the line of a syntax error', () => {
  const cases = [
    ['Scenario: S\n', /f\.feature:1: scenario before Feature/],
    ['', /f\.feature:1: No Feature/],
    ['Feature: A\nFeature: B\n', /f\.feature:2: A file has one Feature/],
    ['Feature: F\n  Given x\n', /f\.feature:2: A step must be inside/],
    ['Feature: F\n  Scenario: S\n    | a |\n', /f\.feature:3: A table must follow/],
    ['Feature: F\n  Scenario: S\n    Given x\n    """\n    y\n', /f\.feature:4: The doc string has no closing fence/],
    ['Feature: F\n  Scenario: S\n    Given x\n  Examples:\n', /f\.feature:4: Examples must follow a Scenario Outline/],
    ['Feature: F\n  Scenario Outline: S\n    Given <x>\n', /f\.feature:2: Scenario Outline "S" has no Examples/],
    ['Feature: F\n  Scenario: S\n    Given x\n    stray text\n', /f\.feature:4: Unexpected line: stray text/],
  ];
  for (const [text, message] of cases) {
    assert.throws(() => parseFeature(text, 'f.feature'), message);
  }
});

test('compile reads the parameter types and the optional text', () => {
  const { regex, parse } = compile('I add {string} and {int} item(s) at {float} in {word}');
  const match = regex.exec(`I add "Milk" and 2 items at 1.5 in active`);
  assert.deepEqual(parse(match.slice(1)), ['Milk', 2, 1.5, 'active']);
  const single = regex.exec(`I add 'Tea' and 1 item at -3 in saved`);
  assert.deepEqual(parse(single.slice(1)), ['Tea', 1, -3, 'saved']);
  assert.equal(regex.exec('I add "Milk" and 2 items at 1.5 in active and more'), null);
});

test('compile takes a regular expression and anchors it', () => {
  const { regex, parse } = compile(/I have (\d+) (?:apple|pear)s?/);
  assert.deepEqual(parse(regex.exec('I have 3 pears').slice(1)), ['3']);
  assert.equal(regex.exec('so I have 3 pears'), null);
});

test('compile escapes the special characters of the literal text', () => {
  const { regex } = compile('a total of $5.00 [net]?');
  assert.ok(regex.test('a total of $5.00 [net]?'));
  assert.equal(regex.test('a total of $5x00 [net]?'), false);
});

test('compile rejects an unknown parameter type', () => {
  assert.throws(() => compile('I see {colour}'), /Unknown parameter type \{colour\}/);
});

test('dataTable gives the raw rows and one object for each row after the first', () => {
  assert.deepEqual(dataTable([['name', 'list'], ['Milk', 'active']]), {
    raw: [['name', 'list'], ['Milk', 'active']],
    hashes: [{ name: 'Milk', list: 'active' }],
  });
  assert.deepEqual(dataTable([]).hashes, []);
});

test('the registry finds one definition, and rejects an undefined or an ambiguous step', () => {
  const registry = createRegistry();
  const fn = () => {};
  registry.Given('I add {string}', fn);
  registry.Then(/I add ".*"/, fn);
  registry.When('I tick {string}', fn);
  assert.deepEqual(registry.find('I tick "Milk"').args, ['Milk']);
  assert.throws(() => registry.find('I fly'), (error) => error.code === 'UNDEFINED_STEP' && /Undefined step: I fly/.test(error.message));
  assert.throws(() => registry.find('I add "Milk"'), /Ambiguous step: I add "Milk"/);
});

test('runScenario passes the world, the arguments and a table or doc string to each step', async () => {
  const registry = createRegistry();
  registry.Given('a count of {int}', (world, count) => {
    world.count = count;
  });
  registry.When('I add the rows:', (world, table) => {
    world.count += table.hashes.length;
  });
  registry.Then('the note is:', async (world, text) => {
    world.note = text;
  });
  const [scenario] = parseFeature(`Feature: F
  Scenario: S
    Given a count of 2
    When I add the rows:
      | n |
      | 1 |
      | 2 |
    Then the note is:
      """
      done
      """
`).scenarios;
  const world = {};
  await runScenario(scenario, registry, world);
  assert.deepEqual(world, { count: 4, note: 'done' });
});

test('runScenario names the step and its line when a step fails, and runs no later step', async () => {
  const registry = createRegistry();
  const ran = [];
  registry.Given('a step', () => ran.push('a'));
  registry.When('it fails', () => {
    throw new Error('boom');
  });
  registry.Then('never', () => ran.push('never'));
  const [scenario] = parseFeature('Feature: F\n  Scenario: S\n    Given a step\n    When it fails\n    Then never\n').scenarios;
  await assert.rejects(runScenario(scenario, registry, {}, 'x.feature'), /When it fails\n {2}at x\.feature:4\nboom/);
  assert.deepEqual(ran, ['a']);
});

test('specRules finds each rule and marks the removed ones', () => {
  assert.deepEqual(specRules('- **A-1** Text.\n- **A-2** Removed: gone.', 'x.md'), [
    { id: 'A-1', doc: 'x.md', removed: false },
    { id: 'A-2', doc: 'x.md', removed: true },
  ]);
});

test('parseExempt reads id, kind and reason', () => {
  const exempt = parseExempt('# c\n\nA-1 screen The DOM only\n');
  assert.deepEqual([...exempt], [['A-1', { kind: 'screen', reason: 'The DOM only' }]]);
  assert.throws(() => parseExempt('A-1 maybe x'), /exempt\.txt:1: unknown kind maybe/);
  assert.throws(() => parseExempt('\nA-1'), /exempt\.txt:2: /);
});

test('coverageGaps reports each kind of gap', () => {
  const rules = [
    ...['A-1', 'A-2', 'A-3', 'A-4'].map((id) => ({ id, doc: 'a.md', removed: false })),
    { id: 'A-5', doc: 'a.md', removed: true },
    { id: 'B-1', doc: 'b.md', removed: false },
  ];
  const exempt = parseExempt('A-2 screen x\nA-3 static see tests/x.test.js\nZ-9 prose y\n');
  const gaps = coverageGaps({
    rules,
    tags: ['@A-1', '@A-2', '@A-5'],
    exempt,
    pending: new Set(['b.md']),
    exists: () => false,
  });
  assert.deepEqual(gaps, { untested: ['A-4'], both: ['A-2'], unknown: ['Z-9'], removed: ['A-5'], noEvidence: ['A-3'] });
});

test('coverageGaps accepts a static exempt whose test file exists', () => {
  const rules = [{ id: 'A-1', doc: 'a.md', removed: false }];
  const exempt = parseExempt('A-1 static tests/x.test.js proves it\n');
  const gaps = coverageGaps({ rules, tags: [], exempt, pending: new Set(), exists: (path) => path === 'tests/x.test.js' });
  assert.deepEqual(gaps, { untested: [], both: [], unknown: [], removed: [], noEvidence: [] });
});

test('compile reads an alternation of words', () => {
  const { regex, parse } = compile('{int} item(s) was/were ticked');
  assert.deepEqual(parse(regex.exec('1 item was ticked').slice(1)), [1]);
  assert.deepEqual(parse(regex.exec('2 items were ticked').slice(1)), [2]);
  assert.equal(regex.exec('2 items are ticked'), null);
  assert.ok(compile('a/b/c').regex.test('c'));
});

test('runScenario rejects a Then step that matches a Given or When definition, and the reverse', async () => {
  const registry = createRegistry();
  registry.Given('the key {string} holds {string}', () => {});
  registry.When('I act', () => {});
  registry.Then('it is done', () => {});
  const run = (steps) => runScenario(parseFeature(`Feature: F\n  Scenario: S\n${steps}`).scenarios[0], registry, {});
  await assert.rejects(run('    Given I act\n    Then the key "a" holds "b"\n'), /A Then step must check: the key "a" holds "b" is a Given step/);
  await assert.rejects(run('    When I act\n    Then it is done\n    And the key "a" holds "b"\n'), /A Then step must check/);
  await assert.rejects(run('    Given it is done\n'), /A Given step must act: it is done is a Then step/);
  await run('    Given the key "a" holds "b"\n    And I act\n    When I act\n    Then it is done\n    But it is done\n    * it is done\n');
});
