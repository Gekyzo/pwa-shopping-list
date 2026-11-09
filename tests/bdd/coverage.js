// The coverage of the specification by the features: each live rule of `docs/spec/` is either
// tagged by a scenario or listed in `tests/features/exempt.txt` with its kind and reason.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KINDS = ['screen', 'static', 'prose'];

// Each `**ID**` of a spec text. A rule whose text starts with `Removed` is removed.
export const specRules = (text, doc) =>
  [...text.matchAll(/\*\*([A-Z]+-\d+)\*\*\s*(\S*)/g)].map(([, id, next]) => ({ id, doc, removed: next.startsWith('Removed') }));

export const readSpec = (dir) =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .sort()
    .flatMap((file) => specRules(readFileSync(join(dir, file), 'utf8'), file));

// `<ID> <kind> <reason>` on each line; blank lines and `#` lines are skipped.
export const parseExempt = (text) => {
  const exempt = new Map();
  text.split('\n').forEach((raw, index) => {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) return;
    const match = /^([A-Z]+-\d+)\s+(\S+)\s+(.+)$/.exec(line);
    if (!match) throw new SyntaxError(`exempt.txt:${index + 1}: expected "<ID> <kind> <reason>": ${line}`);
    const [, id, kind, reason] = match;
    if (!KINDS.includes(kind)) throw new SyntaxError(`exempt.txt:${index + 1}: unknown kind ${kind}`);
    if (exempt.has(id)) throw new SyntaxError(`exempt.txt:${index + 1}: ${id} is listed twice`);
    exempt.set(id, { kind, reason });
  });
  return exempt;
};

export const coverageGaps = ({ rules, tags, exempt, pending, exists }) => {
  const tagged = new Set(tags.filter((tag) => /^@[A-Z]+-\d+$/.test(tag)).map((tag) => tag.slice(1)));
  const byId = new Map(rules.map((rule) => [rule.id, rule]));
  const sorted = (ids) => [...new Set(ids)].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
  const live = rules.filter((rule) => !rule.removed);
  return {
    untested: sorted(live.filter((r) => !pending.has(r.doc) && !tagged.has(r.id) && !exempt.has(r.id)).map((r) => r.id)),
    both: sorted(live.filter((r) => tagged.has(r.id) && exempt.has(r.id)).map((r) => r.id)),
    unknown: sorted([...exempt.keys(), ...tagged].filter((id) => !byId.has(id))),
    removed: sorted(rules.filter((r) => r.removed && (tagged.has(r.id) || exempt.has(r.id))).map((r) => r.id)),
    noEvidence: sorted(
      [...exempt]
        .filter(([, { kind, reason }]) => kind === 'static')
        .filter(([, { reason }]) => !(reason.match(/tests\/[\w-]+\.test\.js/g) ?? []).some((path) => exists(path)))
        .map(([id]) => id),
    ),
  };
};
