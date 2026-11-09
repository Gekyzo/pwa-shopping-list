// The steps of the shops, `src/shops.js`. A shop list is named as its chip: `Todas`, a shop, or
// `Sin tienda`.

import assert from 'node:assert/strict';
import { addItem, bringToList, findByName, activeItems } from '#store';
import { addItemShop, removeItemShop, shopNames, shopSuggestions, shopChips, shopState, validShop, nextShop, withShop } from '#shops';
import { apply, findItem, names } from '../world.js';

// The value of a shop list in `src/shops.js`: null is Todas, '' is Sin tienda.
const LISTS = { Todas: null, 'Sin tienda': '' };
const listOf = (chip) => (chip in LISTS ? LISTS[chip] : chip);
const chipOf = (shop) => (shop === null ? 'Todas' : shop === '' ? 'Sin tienda' : shop);
const nameList = (items) => items.map((item) => item.name).join(', ');

export const defineShopSteps = ({ When, Then }) => {
  When('I add the shop {string} to {string}', (world, shop, name) => {
    const { id } = findItem(world, name);
    apply(world, (state) => addItemShop(state, id, shop));
  });
  When('I remove the shop {string} from {string}', (world, shop, name) => {
    const { id } = findItem(world, name);
    apply(world, (state) => removeItemShop(state, id, shop));
  });
  // The add of the sheet opened from a shop list, as src/ui/add.js does it (SHOP-24).
  When('I add {string} from the shop list {string}', (world, name, chip) => {
    const shop = listOf(chip);
    const existing = findByName(world.state, name);
    apply(world, (state) => {
      if (existing) return withShop(bringToList(state, existing.id), existing.id, shop);
      const added = addItem(state, name, world.newId);
      return added.error ? added : withShop(added, added.state.items.at(-1).id, shop);
    });
  });

  Then('the shops of {string} are {string}', (world, name, text) => {
    assert.deepEqual(findItem(world, name).shops, names(text));
  });
  Then('the shops in use are {string}', (world, text) => {
    assert.deepEqual(shopNames(world.state), names(text));
  });
  Then('the shops offered for {string} are {string}', (world, name, text) => {
    assert.deepEqual(shopSuggestions(world.state, findItem(world, name).id), names(text));
  });
  Then('the shop chips are:', (world, table) => {
    const chips = shopChips(world.state).map(({ shop, count }) => ({ chip: chipOf(shop), count: String(count) }));
    assert.deepEqual(chips, table.hashes);
  });
  Then('the shop list {string} shows {string}', (world, chip, text) => {
    assert.equal(nameList(activeItems(shopState(world.state, listOf(chip)))), names(text).join(', '));
  });
  Then('the shop list {string} is kept as {string}', (world, chip, kept) => {
    assert.equal(chipOf(validShop(world.state, listOf(chip))), kept);
  });
  Then('the next shop list after {string} is {string} with {int} item(s)', (world, chip, next, count) => {
    assert.deepEqual(nextShop(world.state, listOf(chip)), { shop: listOf(next), count });
  });
  Then('there is no next shop list after {string}', (world, chip) => {
    assert.equal(nextShop(world.state, listOf(chip)), null);
  });
};
