// A parser for the subset of Gherkin that the features of `tests/features/` use: tags, Feature,
// Rule, Background, Scenario (Example), Scenario Outline (Scenario Template) with Examples, the
// step keywords, data tables and doc strings. English keywords only. An outline is expanded into
// one scenario for each row of its examples.

const KEYWORDS = {
  feature: ['Feature'],
  rule: ['Rule'],
  background: ['Background'],
  scenario: ['Scenario', 'Example'],
  outline: ['Scenario Outline', 'Scenario Template'],
  examples: ['Examples', 'Scenarios'],
};
const STEP = /^(Given|When|Then|And|But|\*)\s+(.*)$/;
const DOC_FENCE = /^("""|```)/;

const header = (line) => {
  for (const [kind, words] of Object.entries(KEYWORDS)) {
    // The longer keyword first, so that `Scenario Outline:` is not read as `Scenario:`.
    const word = [...words].sort((a, b) => b.length - a.length).find((w) => line.startsWith(`${w}:`));
    if (word) return { kind, name: line.slice(word.length + 1).trim() };
  }
  return null;
};

// A table row: the cells between the pipes, trimmed, with `\|`, `\n` and `\\` unescaped.
export const parseRow = (line) => {
  const cells = [];
  let cell = '';
  for (let i = 1; i < line.length; i += 1) {
    const char = line[i];
    if (char === '\\' && i + 1 < line.length) {
      const next = line[(i += 1)];
      cell += next === 'n' ? '\n' : next;
    } else if (char === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  return cells;
};

const fail = (file, line, message) => {
  throw new SyntaxError(`${file}:${line}: ${message}`);
};

const substitute = (text, row) => text.replace(/<([^<>]+)>/g, (match, key) => (key in row ? row[key] : match));

const expandStep = (step, row) => ({
  ...step,
  text: substitute(step.text, row).trim(),
  ...(step.table && { table: step.table.map((cells) => cells.map((cell) => substitute(cell, row))) }),
  ...(step.docString !== undefined && { docString: substitute(step.docString, row) }),
});

const expand = (outline, file) => {
  if (outline.examples.length === 0) fail(file, outline.line, `Scenario Outline "${outline.name}" has no Examples`);
  return outline.examples.flatMap((examples) => {
    const [keys, ...rows] = examples.table;
    if (!keys) fail(file, examples.line, 'Examples has no table');
    return rows.map((cells, index) => {
      const row = Object.fromEntries(keys.map((key, i) => [key, cells[i] ?? '']));
      const name = substitute(outline.name, row);
      return {
        // A name with no placeholder gets the number of its row, so that each test has its own name.
        name: name === outline.name ? `${name} #${index + 1}` : name,
        tags: [...outline.tags, ...examples.tags],
        line: examples.rowLines[index + 1],
        rule: outline.rule,
        steps: outline.steps.map((step) => expandStep(step, row)),
      };
    });
  });
};

// Parses the text of one `.feature` file. Throws a SyntaxError with the file and the line of the
// first problem.
export const parseFeature = (text, file = '<feature>') => {
  const lines = text.split(/\r?\n/);
  const feature = { name: '', tags: [], line: 0, background: [], scenarios: [] };
  const rules = new Map(); // rule name -> its background steps
  let tags = [];
  let rule = null; // { name, background }
  let block = null; // the block that receives steps: a background, a scenario or an outline
  let examples = null; // the Examples that receives table rows
  let lastStep = null;

  const takeTags = () => {
    const taken = tags;
    tags = [];
    return taken;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const number = i + 1;
    const line = lines[i].trim();
    if (line === '' || line.startsWith('#')) continue;

    if (DOC_FENCE.test(line)) {
      if (!lastStep) fail(file, number, 'A doc string must follow a step');
      const fence = line.slice(0, 3);
      const indent = lines[i].indexOf(fence);
      const body = [];
      for (i += 1; i < lines.length && lines[i].trim() !== fence; i += 1) {
        // Strip the indent of the opening fence, as Gherkin does.
        body.push(lines[i].slice(Math.min(indent, lines[i].length - lines[i].trimStart().length)));
      }
      if (i >= lines.length) fail(file, number, 'The doc string has no closing fence');
      lastStep.docString = body.join('\n');
      lastStep = null;
      continue;
    }

    if (line.startsWith('|')) {
      if (examples) {
        examples.table.push(parseRow(line));
        examples.rowLines.push(number);
      } else if (lastStep) {
        (lastStep.table ??= []).push(parseRow(line));
      } else {
        fail(file, number, 'A table must follow a step or Examples');
      }
      continue;
    }

    if (line.startsWith('@')) {
      tags.push(...line.split(/\s+#/)[0].split(/\s+/));
      continue;
    }

    const found = header(line);
    if (found) {
      lastStep = null;
      examples = null;
      if (found.kind === 'feature') {
        if (feature.line) fail(file, number, 'A file has one Feature');
        Object.assign(feature, { name: found.name, tags: takeTags(), line: number });
        block = null;
        continue;
      }
      if (!feature.line) fail(file, number, `${found.kind} before Feature`);
      if (found.kind === 'rule') {
        rule = { name: found.name, tags: takeTags(), background: [] };
        rules.set(found.name, rule);
        block = null;
      } else if (found.kind === 'background') {
        block = { steps: rule ? rule.background : feature.background, background: true };
        takeTags();
      } else if (found.kind === 'scenario' || found.kind === 'outline') {
        const scenario = {
          name: found.name,
          tags: [...feature.tags, ...(rule?.tags ?? []), ...takeTags()],
          line: number,
          rule: rule?.name ?? null,
          steps: [],
        };
        if (found.kind === 'outline') scenario.examples = [];
        feature.scenarios.push(scenario);
        block = scenario;
      } else if (found.kind === 'examples') {
        if (!block?.examples) fail(file, number, 'Examples must follow a Scenario Outline');
        examples = { tags: takeTags(), line: number, table: [], rowLines: [] };
        block.examples.push(examples);
      }
      continue;
    }

    const step = STEP.exec(line);
    if (step) {
      if (!block) fail(file, number, 'A step must be inside a Background or a Scenario');
      if (examples) fail(file, number, 'A step cannot follow Examples');
      lastStep = { keyword: step[1], text: step[2], line: number };
      block.steps.push(lastStep);
      continue;
    }

    // Free text: the description of a Feature, Rule or Scenario, before its first step.
    if (block && block.steps.length > 0) fail(file, number, `Unexpected line: ${line}`);
  }

  if (!feature.line) fail(file, 1, 'No Feature');
  feature.scenarios = feature.scenarios.flatMap((scenario) => (scenario.examples ? expand(scenario, file) : [scenario]));
  // Each scenario carries the steps of the Background of the feature and of its rule.
  feature.scenarios = feature.scenarios.map((scenario) => ({
    ...scenario,
    steps: [...feature.background, ...(rules.get(scenario.rule)?.background ?? []), ...scenario.steps],
  }));
  return feature;
};
