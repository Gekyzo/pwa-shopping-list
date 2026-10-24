// The state as records, one for each entity (SYNC-1), and the diff of two such sets (SYNC-2).
// Pure: no storage, no clock, no DOM.
const VERSION = 9;

export const recordKey = (kind, key) => `${kind}:${key}`;

const record = (kind, key, data) => [recordKey(kind, key), { kind, key, data }];

// A meal holds a recipe or a dish; the key is the slot.
const mealData = ({ day, meal, ...rest }) => rest;

// SYNC-1: the list order is the `position` of each item and recipe.
export const toRecords = (state) =>
  new Map([
    ...state.items.map((item, position) => record('item', item.id, { ...item, position })),
    ...state.recipes.map((recipe, position) => record('recipe', recipe.id, { ...recipe, position })),
    ...state.menu.map((entry) => record('meal', `${entry.day}-${entry.meal}`, mealData(entry))),
    record('settings', 'settings', { group: state.group, sort: state.sort, sent: state.sent, aisles: state.aisles }),
  ]);

const ofKind = (records, kind) => [...records.values()].filter((rec) => rec.kind === kind);

const byPosition = (recs) =>
  recs
    .map(({ data: { position, ...fields } }) => ({ position, fields }))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map(({ fields }) => fields);

// A raw state: callers pass it through `normalizeState`.
export const fromRecords = (records) => {
  const settings = records.get(recordKey('settings', 'settings'))?.data ?? {};
  const menu = ofKind(records, 'meal').map(({ key, data }) => {
    const [day, meal] = key.split('-');
    return { day: Number(day), meal, ...data };
  });
  return {
    version: VERSION,
    items: byPosition(ofKind(records, 'item')),
    recipes: byPosition(ofKind(records, 'recipe')),
    sent: settings.sent ?? [],
    group: settings.group,
    sort: settings.sort,
    menu,
    aisles: settings.aisles ?? [],
  };
};

const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((name) => [name, canonical(value[name])]));
  }
  return value;
};

const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

// Deletes first, then upserts, each by key.
export const diffRecords = (prev, next) => {
  const byKey = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  const deletes = [...prev.keys()]
    .filter((id) => !next.has(id))
    .sort(byKey)
    .map((id) => ({ kind: prev.get(id).kind, key: prev.get(id).key, op: 'delete' }));
  const upserts = [...next.keys()]
    .filter((id) => !prev.has(id) || !same(prev.get(id).data, next.get(id).data))
    .sort(byKey)
    .map((id) => ({ kind: next.get(id).kind, key: next.get(id).key, op: 'upsert', data: next.get(id).data }));
  return [...deletes, ...upserts];
};
