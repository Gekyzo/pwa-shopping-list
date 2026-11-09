// The steps of a member of a shared list (SHARE-12): `world.state` is the combined state of
// `src/lists.js`, and `world.shared` holds the shared state as saved and the scope of the share.

import assert from 'node:assert/strict';
import { emptyState, addItem, setGroup, setSort, toggleBought, deleteItem } from '#store';
import { addRecipe, sendRecipe, inList } from '#recipes';
import { loadTwinReach } from '#storage';
import {
  combine, split, onList, listPart, listOf, isShared, listView, mergeTwins, listCounts, targetList, reorderList,
  twinIds, deletedKey, acrossTwins,
} from '#lists';
import { apply, names, yesNo } from '../world.js';
import { withRecipe } from './recipes.js';

const parts = (world) => split(world.state, world.shared.base, world.shared.scope);

// Runs `build` on the shared state alone, then combines it again with the own state.
const onShared = (world, build) => {
  const { own, shared } = parts(world);
  const next = build(shared);
  world.shared.base = next;
  world.state = combine(own, next, world.shared.scope);
};

// SHARE-14: the list chips by their name in a step: `all` is Todas.
const CHIPS = { all: null, own: 'own', shared: 'shared' };

const rowOfTodas = (world, name) => {
  const row = mergeTwins(world.state).items.find((item) => item.name === name && !isShared(item));
  assert.ok(row, `No own row "${name}" in Todas`);
  return row;
};

const findIn = (world, kind, name, which) => {
  const entity = world.state[kind].find((candidate) => candidate.name === name && listOf(candidate) === which);
  assert.ok(entity, `No ${kind} "${name}" in the ${which} list`);
  return entity;
};

export const defineSharedSteps = ({ Given, When, Then }) => {
  Given('I am a member of a shared list with scope {word}', (world, scope) => {
    world.shared = { base: emptyState(), scope };
    world.state = combine(world.state, world.shared.base, scope);
  });
  Given('the shared list has a recipe {string} with {string}', (world, name, products) => {
    onShared(world, (shared) => withRecipe(shared, name, products, world.newId));
  });
  Given('the shared list has {string}', (world, name) => {
    onShared(world, (shared) => {
      const result = addItem(shared, name, world.newId);
      assert.equal(result.error, undefined);
      return result.state;
    });
  });

  Given('the shared list has items:', (world, table) => {
    onShared(world, (shared) =>
      table.hashes.reduce((state, row) => {
        const result = addItem(state, row.name, world.newId);
        assert.equal(result.error, undefined);
        const patch = { ...(row.list && { list: row.list }), ...(row.bought && { bought: yesNo(row.bought) }) };
        return { ...result.state, items: result.state.items.map((item, at, all) => (at === all.length - 1 ? { ...item, ...patch } : item)) };
      }, shared),
    );
  });
  Given('the shared list is grouped by {word} in {word} order with the aisles {string}', (world, group, sort, aisles) => {
    onShared(world, (shared) => ({ ...setSort(setGroup(shared, group).state, sort).state, aisles: names(aisles) }));
  });

  When('I add {string} to the {word} list', (world, name, which) => {
    const { base, scope } = world.shared;
    apply(world, (state) => onList(state, which, (part) => addItem(part, name, world.newId), base, scope));
  });
  When('I move {string} of the {word} list to the top', (world, name, which) => {
    const moved = findIn(world, 'items', name, which);
    const others = world.state.items.filter((item) => listOf(item) === which && item !== moved);
    const { base, scope } = world.shared;
    apply(world, (state) => reorderList(state, [moved.id, ...others.map((item) => item.id)], base, scope));
  });
  When('I tick the row {string} of Todas reaching {word}', (world, name, reach) => {
    const ids = twinIds(rowOfTodas(world, name), reach);
    apply(world, (state) => acrossTwins(state, ids, toggleBought));
  });
  When('I delete the row {string} of Todas reaching {word}', (world, name, reach) => {
    const row = rowOfTodas(world, name);
    world.toast = deletedKey(row, reach);
    apply(world, (state) => acrossTwins(state, twinIds(row, reach), deleteItem));
  });
  // Deshacer puts back the combined state of before the action.
  When('I undo the delete', (world) => {
    world.state = world.input;
  });

  When('I send the recipe {string} of the {word} list', (world, name, which) => {
    const { id } = findIn(world, 'recipes', name, which);
    const { base, scope } = world.shared;
    apply(world, (state) => onList(state, which, (part) => sendRecipe(part, id, world.newId), base, scope));
  });
  When('I add the recipe {string} to the {word} list', (world, name, which) => {
    const { base, scope } = world.shared;
    apply(world, (state) => onList(state, which, (part) => addRecipe(part, name, world.newId), base, scope));
  });

  Then('each shared entity of the combined state has the marker and an id that starts with {string}', (world, prefix) => {
    const shared = [...world.state.items, ...world.state.recipes].filter((entity) => entity.id.startsWith(prefix));
    assert.ok(shared.length > 0);
    assert.ok(shared.every(isShared));
    assert.ok(world.state.items.filter(isShared).every((item) => item.id.startsWith(prefix)));
  });
  Then('the parts of the combined state hold no marker and no prefix', (world) => {
    const { own, shared } = parts(world);
    for (const part of [own, shared]) {
      const text = JSON.stringify(part);
      assert.equal(text.includes('"shared"'), false, text);
      assert.equal(text.includes('shared:'), false, text);
    }
  });
  Then('the {word} part groups by {word} in {word} order with the aisles {string}', (world, which, group, sort, aisles) => {
    const part = parts(world)[which];
    assert.deepEqual({ group: part.group, sort: part.sort, aisles: part.aisles }, { group, sort, aisles: names(aisles) });
  });
  Then('Todas shows the rows:', (world, table) => {
    const rows = mergeTwins(world.state).items.map((item) => ({ name: item.name, lists: item.twin ? 'own, shared' : listOf(item) }));
    assert.deepEqual(rows, table.hashes);
  });
  Then('the {word} chip shows {string}', (world, chip, text) => {
    assert.ok(chip in CHIPS, `Unknown chip ${chip}`);
    assert.deepEqual(listView(world.state, CHIPS[chip]).items.map((item) => item.name), names(text));
  });
  Then('the list chips count {int} in Todas, {int} in Mi lista and {int} in the shared list', (world, all, own, shared) => {
    assert.deepEqual(listCounts(world.state), { all, own, shared });
  });
  Then('an add from the chip {word} goes to the {word} list', (world, chip, which) => {
    assert.ok(chip in CHIPS, `Unknown chip ${chip}`);
    assert.equal(targetList(CHIPS[chip]), which);
  });
  Then('the {word} item {string} is bought: {word}', (world, which, name, answer) => {
    assert.equal(findIn(world, 'items', name, which).bought, yesNo(answer));
  });
  Then('the {word} item {string} is in the list {word}', (world, which, name, list) => {
    assert.equal(findIn(world, 'items', name, which).list, list);
  });
  Then('the toast of the delete is {string}', (world, key) => {
    assert.equal(world.toast, key);
  });
  Then('the reach of a merged row is {word}', (world, reach) => {
    assert.equal(loadTwinReach(world.storage), reach);
  });

  Then('the recipes in view are:', (world, table) => {
    const shown = world.state.recipes.map((recipe) => ({ name: recipe.name, list: listOf(recipe) }));
    assert.deepEqual(shown, table.hashes);
  });
  Then('the {word} list has the items {string}', (world, which, text) => {
    assert.deepEqual(parts(world)[which].items.map((item) => item.name), names(text));
  });
  Then('the {word} list has sent {string}', (world, which, text) => {
    const part = parts(world)[which];
    const byId = new Map(part.recipes.map((recipe) => [recipe.id, recipe.name]));
    assert.deepEqual(part.sent.map((id) => byId.get(id)), names(text));
  });
  Then('the recipe {string} of the {word} list is in the list: {word}', (world, name, which, answer) => {
    const recipe = findIn(world, 'recipes', name, which);
    assert.equal(inList(listPart(world.state, which), recipe), answer === 'yes');
    assert.equal(isShared(recipe), which === 'shared');
  });
};
