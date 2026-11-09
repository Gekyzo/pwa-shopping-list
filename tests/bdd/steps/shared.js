// The steps of a member of a shared list (SHARE-12): `world.state` is the combined state of
// `src/lists.js`, and `world.shared` holds the shared state as saved and the scope of the share.

import assert from 'node:assert/strict';
import { emptyState, addItem } from '#store';
import { addRecipe, sendRecipe, inList } from '#recipes';
import { combine, split, onList, listPart, listOf, isShared } from '#lists';
import { apply, names } from '../world.js';
import { withRecipe } from './recipes.js';

const parts = (world) => split(world.state, world.shared.base, world.shared.scope);

// Runs `build` on the shared state alone, then combines it again with the own state.
const onShared = (world, build) => {
  const { own, shared } = parts(world);
  const next = build(shared);
  world.shared.base = next;
  world.state = combine(own, next, world.shared.scope);
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

  When('I send the recipe {string} of the {word} list', (world, name, which) => {
    const { id } = findIn(world, 'recipes', name, which);
    const { base, scope } = world.shared;
    apply(world, (state) => onList(state, which, (part) => sendRecipe(part, id, world.newId), base, scope));
  });
  When('I add the recipe {string} to the {word} list', (world, name, which) => {
    const { base, scope } = world.shared;
    apply(world, (state) => onList(state, which, (part) => addRecipe(part, name, world.newId), base, scope));
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
