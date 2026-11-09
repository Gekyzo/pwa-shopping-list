// The steps of the list rules of `src/store.js`.

import assert from 'node:assert/strict';
import { apply, findItem as find, names as list, yesNo as yes } from '../world.js';
import {
  emptyState,
  addItem,
  renameItem,
  toggleBought,
  toggleRecurrent,
  postpone,
  startNewShopping,
  deleteItem,
  setQuantity,
  bringToList,
  bringAllBack,
  findByName,
  activeItems,
  matchesItem,
  filterGroups,
  canStartNewShopping,
  tripSummary,
  tripOutcome,
  postponedItems,
  openItems,
  comingBack,
  setGroup,
  setSort,
} from '#store';

const add = (world, name) => {
  const { state, error } = addItem(world.state, name, world.newId);
  assert.equal(error, undefined, `The add of "${name}" failed`);
  world.state = state;
  return state.items.at(-1);
};

const ITEM_COLUMNS = ['name', 'list', 'recurrent', 'bought', 'quantity', 'shops', 'aisle'];

// A value of an item as a table cell shows it.
const cell = (value) => {
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (Array.isArray(value)) return value.join(', ');
  return String(value ?? '');
};

const nameList = (items) => items.map((item) => item.name).join(', ');

// The rows of an outcome table: each cell a number.
const figures = (table) => Object.fromEntries(Object.entries(table.hashes[0]).map(([key, value]) => [key, Number(value)]));

const ids = (world, names) => names.map((name) => find(world, name).id);

export const defineStoreSteps = ({ Given, When, Then }) => {
  Given('an empty list', (world) => {
    world.state = emptyState();
  });

  Given('the list has {string}', (world, name) => {
    add(world, name);
  });

  Given('the list has items:', (world, table) => {
    for (const row of table.hashes) {
      const item = add(world, row.name);
      const unknown = Object.keys(row).filter((column) => !ITEM_COLUMNS.includes(column));
      assert.deepEqual(unknown, [], `Unknown item columns: ${unknown.join(', ')}`);
      const patch = {
        ...(row.list && { list: row.list }),
        ...(row.recurrent && { recurrent: yes(row.recurrent) }),
        ...(row.bought && { bought: yes(row.bought) }),
        ...(row.quantity && { quantity: row.quantity }),
        ...(row.shops && { shops: list(row.shops) }),
        ...(row.aisle && { aisle: row.aisle }),
      };
      world.state = {
        ...world.state,
        items: world.state.items.map((candidate) => (candidate.id === item.id ? { ...candidate, ...patch } : candidate)),
      };
    }
  });

  When('I add {string}', (world, name) => apply(world, (state) => addItem(state, name, world.newId)));
  When('I rename {string} to {string}', (world, from, to) => {
    const { id } = find(world, from);
    apply(world, (state) => renameItem(state, id, to));
  });
  When('I tick {string}', (world, name) => {
    const { id } = find(world, name);
    apply(world, (state) => toggleBought(state, id));
  });
  When('I mark {string} as recurrent', (world, name) => {
    const { id } = find(world, name);
    apply(world, (state) => toggleRecurrent(state, id));
  });
  When('I postpone {string}', (world, name) => {
    const { id } = find(world, name);
    apply(world, (state) => postpone(state, id));
  });
  When('I delete {string}', (world, name) => {
    const { id } = find(world, name);
    apply(world, (state) => deleteItem(state, id));
  });
  When('I finish the trip', (world) => apply(world, (state) => startNewShopping(state)));
  When('I finish the trip keeping {string}', (world, names) => {
    const keep = ids(world, list(names));
    apply(world, (state) => startNewShopping(state, keep));
  });

  Then('the error is {string} for {string} in {word}', (world, key, name, listId) => {
    assert.deepEqual(world.result.error, { key, params: { name, list: listId } });
  });
  Then('the list has {int} item(s)', (world, count) => {
    assert.equal(world.state.items.length, count);
  });
  Then('the sent recipes are empty', (world) => {
    assert.deepEqual(world.state.sent, []);
  });

  // The rows name the items in the order of `items`. A column that the table leaves out is not
  // compared.
  Then('the items are:', (world, table) => {
    const columns = table.raw[0];
    const show = (item) =>
      Object.fromEntries(
        columns.map((column) => {
          return [column, cell(item[column])];
        }),
      );
    assert.deepEqual(world.state.items.map(show), table.hashes);
  });
  Given('the list is grouped by {word} in {word} order', (world, group, sort) => {
    world.state = setSort(setGroup(world.state, group).state, sort === 'name' ? 'name' : 'custom').state;
  });
  Then('the list is still grouped by {word} in {word} order', (world, group, sort) => {
    assert.equal(world.state.group, group);
    assert.equal(world.state.sort, sort === 'name' ? 'name' : 'custom');
  });

  When('I toggle Repetir on {string}', (world, name) => {
    const { id } = find(world, name);
    apply(world, (state) => toggleRecurrent(state, id));
  });
  When('I set the quantity of {string} to {string}', (world, name, quantity) => {
    const { id } = find(world, name);
    apply(world, (state) => setQuantity(state, id, quantity));
  });
  When('I bring back {string}', (world, name) => {
    const { id } = find(world, name);
    apply(world, (state) => bringToList(state, id));
  });
  When('I bring back all postponed items', (world) => apply(world, (state) => bringAllBack(state)));
  When('I bring back the postponed items {string}', (world, text) => {
    const wanted = ids(world, list(text));
    apply(world, (state) => bringAllBack(state, wanted));
  });
  // The add of the sheet, as src/ui/add.js does it: the name of an item brings that item back
  // (ADD-5), any other name creates an item.
  When('I add {string} from the add sheet', (world, name) => {
    const existing = findByName(world.state, name);
    apply(world, (state) => (existing ? bringToList(state, existing.id) : addItem(state, name, world.newId)));
  });

  Then('the bring back changed the list', (world) => {
    assert.equal(world.result.changed, true);
  });
  Then('the bring back changed nothing', (world) => {
    assert.equal(world.result.changed, false);
  });
  Then('{int} item(s) came back', (world, count) => {
    assert.equal(world.result.count, count);
  });
  Then('the items shown are {string}', (world, text) => {
    assert.equal(nameList(activeItems(world.state)), list(text).join(', '));
  });
  Then('the {word} items are {string}', (world, kind, text) => {
    const views = { postponed: postponedItems, open: openItems, 'coming-back': comingBack };
    assert.ok(views[kind], `No view of ${kind} items`);
    assert.equal(nameList(views[kind](world.state)), list(text).join(', '));
  });
  Then('the list search for {string} finds {string}', (world, query, text) => {
    const found = activeItems(world.state).filter((item) => matchesItem(item, query));
    assert.equal(nameList(found), list(text).join(', '));
  });

  Given('the groups of the list are:', (world, table) => {
    world.view = {
      groups: table.hashes.map((row) => ({ key: row.group, items: list(row.items).map((name) => find(world, name)) })),
      rest: [],
    };
  });
  When('I search the list for {string}', (world, query) => {
    world.shown = filterGroups(world.view, query);
  });
  Then('the groups shown are:', (world, table) => {
    const shown = world.shown.groups.map((group) => ({
      group: group.key,
      items: nameList(group.items),
      left: String(group.left),
    }));
    assert.deepEqual(shown, table.hashes);
  });

  Then('Terminar compra is offered: {word}', (world, offered) => {
    assert.equal(canStartNewShopping(world.state), yes(offered));
  });
  Then('the trip figures are:', (world, table) => {
    assert.deepEqual(tripSummary(world.state), figures(table));
  });
  Then('the trip figures keeping {string} are:', (world, text, table) => {
    assert.deepEqual(tripSummary(world.state, ids(world, list(text))), figures(table));
  });
  Then('the trip outcome keeping {string} is:', (world, text, table) => {
    assert.deepEqual(tripOutcome(world.state, ids(world, list(text))), figures(table));
  });
};
