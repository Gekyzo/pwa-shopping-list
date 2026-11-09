// The steps of the recipes, `src/recipes.js`.

import assert from 'node:assert/strict';
import {
  addRecipe,
  renameRecipe,
  deleteRecipe,
  addRecipeProduct,
  removeRecipeProduct,
  setRecipeUrl,
  sendRecipe,
  sendCount,
  buyRecipe,
  inList,
  listedProducts,
  recipeProgress,
  productSuggestions,
  searchRecipes,
  filterRecipes,
  filterCounts,
  linkInfo,
  addSample,
  loadSample,
} from '#recipes';
import { weekOf } from '#menu';
import { shopState } from '#shops';
import { apply, names, dateOf } from '../world.js';

export const findRecipe = (world, name) => {
  const recipe = world.state.recipes.find((candidate) => candidate.name === name);
  assert.ok(recipe, `No recipe named "${name}"`);
  return recipe;
};

const nameList = (recipes) => recipes.map((recipe) => recipe.name).join(', ');

// Adds a recipe and its products to a plain state.
export const withRecipe = (state, name, products, newId) => {
  const added = addRecipe(state, name, newId);
  assert.equal(added.error, undefined, `The add of the recipe "${name}" failed`);
  const { id } = added.state.recipes.at(-1);
  return names(products).reduce((current, product) => {
    const result = addRecipeProduct(current, id, product);
    assert.equal(result.error, undefined, `The add of "${product}" to "${name}" failed`);
    return result.state;
  }, added.state);
};

// The sample text of the walkthrough: its name and its products.
const sampleOf = (name, products) => ({ name, products: names(products) });

export const defineRecipeSteps = ({ Given, When, Then }) => {
  Given('a recipe {string} with {string}', (world, name, products) => {
    world.state = withRecipe(world.state, name, products, world.newId);
  });
  Given('the recipe {string} was sent', (world, name) => {
    const { id } = findRecipe(world, name);
    world.state = { ...world.state, sent: [...world.state.sent, id] };
  });
  Given('the recipe {string} has the link {string}', (world, name, url) => {
    const result = setRecipeUrl(world.state, findRecipe(world, name).id, url);
    assert.equal(result.error, undefined);
    world.state = result.state;
  });

  When('I add the recipe {string}', (world, name) => apply(world, (state) => addRecipe(state, name, world.newId)));
  When('I rename the recipe {string} to {string}', (world, from, to) => {
    const { id } = findRecipe(world, from);
    apply(world, (state) => renameRecipe(state, id, to));
  });
  // A delete from Recetas, in the week of today (REC-6).
  When('I delete the recipe {string}', (world, name) => {
    const { id } = findRecipe(world, name);
    apply(world, (state) => deleteRecipe(state, id, weekOf(dateOf(world.today))));
  });
  When('I add the product {string} to {string}', (world, product, name) => {
    const { id } = findRecipe(world, name);
    apply(world, (state) => addRecipeProduct(state, id, product));
  });
  When('I remove the product {string} from {string}', (world, product, name) => {
    const { id } = findRecipe(world, name);
    apply(world, (state) => removeRecipeProduct(state, id, product));
  });
  When('I set the link of {string} to {string}', (world, name, url) => {
    const { id } = findRecipe(world, name);
    apply(world, (state) => setRecipeUrl(state, id, url));
  });
  When('I send the recipe {string}', (world, name) => {
    const { id } = findRecipe(world, name);
    apply(world, (state) => sendRecipe(state, id, world.newId));
  });
  When('I slide the head of the recipe {string}', (world, name) => {
    const { id } = findRecipe(world, name);
    apply(world, (state) => buyRecipe(state, id));
  });
  When('I slide the head of the recipe {string} in the shop list {string}', (world, name, shop) => {
    const { id } = findRecipe(world, name);
    apply(world, (state) => buyRecipe(state, id, shopState(state, shop)));
  });
  When('I add the sample recipe {string} with {string}', (world, name, products) => {
    apply(world, (state) => addSample(state, sampleOf(name, products)));
  });
  When('I load the sample recipe {string} with {string}', (world, name, products) => {
    apply(world, (state) => loadSample(state, sampleOf(name, products), world.newId));
  });

  Then('{int} item(s) was/were ticked', (world, count) => {
    assert.equal(world.result.count, count);
  });
  // A column that the table leaves out is not compared.
  Then('the recipes are:', (world, table) => {
    const cells = { id: (r) => r.id, name: (r) => r.name, products: (r) => r.products.join(', '), link: (r) => r.url };
    const columns = table.raw[0];
    const shown = world.state.recipes.map((recipe) => Object.fromEntries(columns.map((column) => [column, cells[column](recipe)])));
    assert.deepEqual(shown, table.hashes);
  });
  Then('the link of {string} is {string}', (world, name, url) => {
    assert.equal(findRecipe(world, name).url, url);
  });
  Then('the link {string} shows the host {string} as a video', (world, url, host) => {
    assert.deepEqual(linkInfo(url), { host, video: true });
  });
  Then('the link {string} shows the host {string} as a page', (world, url, host) => {
    assert.deepEqual(linkInfo(url), { host, video: false });
  });
  Then('the sent recipes are {string}', (world, text) => {
    const byId = new Map(world.state.recipes.map((recipe) => [recipe.id, recipe.name]));
    assert.deepEqual(world.state.sent.map((id) => byId.get(id)), names(text));
  });
  Then('the send added {int} and found {int}', (world, added, already) => {
    assert.equal(world.result.added, added);
    assert.equal(world.result.already, already);
  });
  Then('the send of {string} adds {int}', (world, name, count) => {
    assert.equal(sendCount(world.state, findRecipe(world, name).id), count);
  });
  Then('the recipe {string} is in the list: {word}', (world, name, answer) => {
    assert.equal(inList(world.state, findRecipe(world, name)), answer === 'yes');
  });
  Then('the products of {string} in the list are {string}', (world, name, text) => {
    assert.deepEqual(listedProducts(world.state, findRecipe(world, name)), names(text));
  });
  Then('the recipe progress is:', (world, table) => {
    const shown = recipeProgress(world.state).map(({ recipe, inList: count, total }) => ({
      recipe: recipe.name,
      'in list': String(count),
      total: String(total),
    }));
    assert.deepEqual(shown, table.hashes);
  });
  Then('the products offered for {string} by {string} are {string}', (world, name, query, text) => {
    assert.deepEqual(productSuggestions(world.state, findRecipe(world, name).id, query), names(text));
  });
  Then('the recipes found for {string} are {string}', (world, query, text) => {
    assert.equal(nameList(searchRecipes(world.state, query)), names(text).join(', '));
  });
  Then('the recipes with the filter {word} are {string}', (world, filter, text) => {
    const shown = filterRecipes(world.state.recipes, filter, (recipe) => inList(world.state, recipe));
    assert.equal(nameList(shown), names(text).join(', '));
  });
  Then('the filter counts are:', (world, table) => {
    const counts = filterCounts(world.state.recipes, (recipe) => inList(world.state, recipe));
    assert.deepEqual(
      Object.fromEntries(Object.entries(counts).map(([filter, count]) => [filter, String(count)])),
      table.hashes[0],
    );
  });
};
