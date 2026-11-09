// The steps of the list rules of `src/store.js`. The world holds the state, the result of the
// last operation, and the input of that operation with a deep copy of it, to prove ENG-1.

import assert from 'node:assert/strict';
import { emptyState, addItem, renameItem, toggleBought, toggleRecurrent, postpone, startNewShopping, deleteItem } from '#store';

export const storeWorld = () => {
  let counter = 0;
  return { state: emptyState(), result: null, input: null, copy: null, newId: () => `id-${(counter += 1)}` };
};

const yes = (text) => {
  if (text === 'yes') return true;
  if (text === 'no') return false;
  throw new Error(`Expected yes or no, got "${text}"`);
};

const find = (world, name) => {
  const item = world.state.items.find((candidate) => candidate.name === name);
  assert.ok(item, `No item named "${name}"`);
  return item;
};

const add = (world, name) => {
  const { state, error } = addItem(world.state, name, world.newId);
  assert.equal(error, undefined, `The add of "${name}" failed`);
  world.state = state;
  return state.items.at(-1);
};

// Applies an operation to the state as a user action: keeps the input to check that it does not
// change, and keeps the result for the Then steps.
const apply = (world, operation) => {
  world.input = world.state;
  world.copy = structuredClone(world.state);
  world.result = operation(world.state);
  world.state = world.result.state;
};

const ids = (world, names) => names.map((name) => find(world, name).id);
const list = (text) => text.split(',').map((name) => name.trim()).filter(Boolean);

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
      const patch = {
        ...(row.list && { list: row.list }),
        ...(row.recurrent && { recurrent: yes(row.recurrent) }),
        ...(row.bought && { bought: yes(row.bought) }),
        ...(row.quantity && { quantity: row.quantity }),
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

  Then('there is no error', (world) => {
    assert.equal(world.result.error, undefined);
  });
  Then('the error is {string}', (world, key) => {
    assert.equal(world.result.error?.key, key);
  });
  Then('the error is {string} for {string} in {word}', (world, key, name, listId) => {
    assert.deepEqual(world.result.error, { key, params: { name, list: listId } });
  });
  Then('the state did not change', (world) => {
    assert.equal(world.state, world.input, 'The operation returned a new state object');
  });
  Then('the input state did not change', (world) => {
    assert.deepEqual(world.input, world.copy);
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
          const value = item[column];
          return [column, typeof value === 'boolean' ? (value ? 'yes' : 'no') : String(value ?? '')];
        }),
      );
    assert.deepEqual(world.state.items.map(show), table.hashes);
  });
};
