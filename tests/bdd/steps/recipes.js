// The steps of the recipes, `src/recipes.js`.

import assert from 'node:assert/strict';
import { addRecipe, addRecipeProduct, buyRecipe } from '#recipes';
import { shopState } from '#shops';
import { apply, names } from '../world.js';

export const findRecipe = (world, name) => {
  const recipe = world.state.recipes.find((candidate) => candidate.name === name);
  assert.ok(recipe, `No recipe named "${name}"`);
  return recipe;
};

export const defineRecipeSteps = ({ Given, When, Then }) => {
  Given('a recipe {string} with {string}', (world, name, products) => {
    const added = addRecipe(world.state, name, world.newId);
    assert.equal(added.error, undefined, `The add of the recipe "${name}" failed`);
    const { id } = added.state.recipes.at(-1);
    world.state = names(products).reduce((state, product) => {
      const result = addRecipeProduct(state, id, product);
      assert.equal(result.error, undefined, `The add of "${product}" to "${name}" failed`);
      return result.state;
    }, added.state);
  });
  Given('the recipe {string} was sent', (world, name) => {
    const { id } = findRecipe(world, name);
    world.state = { ...world.state, sent: [...world.state.sent, id] };
  });

  When('I slide the head of the recipe {string}', (world, name) => {
    const { id } = findRecipe(world, name);
    apply(world, (state) => buyRecipe(state, id));
  });
  When('I slide the head of the recipe {string} in the shop list {string}', (world, name, shop) => {
    const { id } = findRecipe(world, name);
    apply(world, (state) => buyRecipe(state, id, shopState(state, shop)));
  });
  Then('{int} item(s) was/were ticked', (world, count) => {
    assert.equal(world.result.count, count);
  });
};
