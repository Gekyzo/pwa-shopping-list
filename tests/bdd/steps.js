// The step registry: a step definition is an expression and a function. An expression is a
// regular expression, or a text with the parameters `{string}`, `{int}`, `{float}` and `{word}`
// and optional text in parentheses, such as `{int} item(s)`. As in Cucumber, the keyword of a
// step (Given, When, Then) does not take part in the match.

const PARAMETERS = {
  string: { pattern: `"([^"]*)"|'([^']*)'`, groups: 2, parse: (a, b) => a ?? b },
  int: { pattern: '(-?\\d+)', groups: 1, parse: (text) => Number.parseInt(text, 10) },
  float: { pattern: '(-?\\d*\\.?\\d+)', groups: 1, parse: (text) => Number.parseFloat(text) },
  word: { pattern: '([^\\s]+)', groups: 1, parse: (text) => text },
};

const escape = (text) => text.replace(/[.*+?^$|[\]\\]/g, '\\$&');

// Compiles an expression into `{ regex, parse }`: `parse` turns the groups of a match into the
// arguments of the step function.
export const compile = (expression) => {
  if (expression instanceof RegExp) {
    return { regex: new RegExp(`^(?:${expression.source})$`, expression.flags), parse: (groups) => groups };
  }
  const parsers = [];
  let source = '';
  const tokens = expression.split(/(\{\w*\}|\([^()]*\))/);
  for (const token of tokens) {
    const parameter = /^\{(\w*)\}$/.exec(token);
    const optional = /^\(([^()]*)\)$/.exec(token);
    if (parameter) {
      const type = PARAMETERS[parameter[1]];
      if (!type) throw new Error(`Unknown parameter type {${parameter[1]}} in "${expression}"`);
      source += `(?:${type.pattern})`;
      parsers.push(type);
    } else if (optional) {
      source += `(?:${escape(optional[1])})?`;
    } else {
      source += escape(token).replace(/[{}()]/g, '\\$&');
    }
  }
  const parse = (groups) => {
    let at = 0;
    return parsers.map((type) => {
      const slice = groups.slice(at, (at += type.groups));
      return type.parse(...slice);
    });
  };
  return { regex: new RegExp(`^${source}$`), parse };
};

// A data table as a step receives it: `raw` is the rows of cells, `hashes` is one object for each
// row after the first, keyed by the first row.
export const dataTable = (raw) => {
  const [keys = [], ...rows] = raw;
  return { raw, hashes: rows.map((cells) => Object.fromEntries(keys.map((key, i) => [key, cells[i]]))) };
};

export const createRegistry = () => {
  const definitions = [];
  const define = (expression, fn) => {
    definitions.push({ expression, fn, ...compile(expression) });
  };

  // The definition that matches the text of a step, with its arguments. Throws when no definition
  // or more than one matches.
  const find = (text) => {
    const matches = definitions.flatMap((definition) => {
      const match = definition.regex.exec(text);
      return match ? [{ definition, args: definition.parse(match.slice(1)) }] : [];
    });
    if (matches.length === 0) {
      const error = new Error(`Undefined step: ${text}`);
      error.code = 'UNDEFINED_STEP';
      throw error;
    }
    if (matches.length > 1) {
      const list = matches.map(({ definition }) => `  ${definition.expression}`).join('\n');
      throw new Error(`Ambiguous step: ${text}\n${list}`);
    }
    return matches[0];
  };

  return { Given: define, When: define, Then: define, define, find, definitions };
};
