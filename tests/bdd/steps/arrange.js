// The steps of Agrupar y ordenar: the order, the groups and the move of a row (`src/store.js`,
// `src/recipes.js`, `src/shops.js`, `src/aisles.js`, `src/reorder.js`).

import assert from 'node:assert/strict';
import { setGroup, setSort, reorderItems } from '#store';
import { recipeGroups } from '#recipes';
import { shopGroups } from '#shops';
import { aisleGroups } from '#aisles';
import { dropIndex, shifts, moveTo } from '#reorder';
import { apply, findItem, names } from '../world.js';

const GROUPINGS = {
  recipe: { groups: recipeGroups, key: (group) => group.recipe.name },
  shop: { groups: shopGroups, key: (group) => group.shop },
  aisle: { groups: aisleGroups, key: (group) => group.aisle },
};

const grouping = (kind) => {
  assert.ok(GROUPINGS[kind], `No grouping by ${kind}`);
  return GROUPINGS[kind];
};

const nameList = (items) => items.map((item) => item.name).join(', ');

export const defineArrangeSteps = ({ Given, When, Then }) => {
  When('I group by {word}', (world, group) => apply(world, (state) => setGroup(state, group)));
  When('I sort by {word}', (world, sort) => apply(world, (state) => setSort(state, sort)));

  Then('the {word} groups are:', (world, kind, table) => {
    const { groups, key } = grouping(kind);
    const shown = groups(world.state).groups.map((group) => ({
      group: key(group),
      items: nameList(group.items),
      total: String(group.total),
    }));
    assert.deepEqual(shown, table.hashes);
  });
  Then('the items in no {word} group are {string}', (world, kind, text) => {
    assert.equal(nameList(grouping(kind).groups(world.state).rest), names(text).join(', '));
  });
  Then('the order of the items is {string}', (world, text) => {
    assert.equal(nameList(world.state.items), names(text).join(', '));
  });

  // The rows of a scope, as `src/ui/drag.js` gives them: each name of `among`, in that order. The
  // place is counted from 1.
  When('I move {string} to place {int} among {string}', (world, name, place, among) => {
    const ids = names(among).map((other) => findItem(world, other).id);
    const from = ids.indexOf(findItem(world, name).id);
    apply(world, (state) => reorderItems(state, moveTo(ids, from, place - 1)));
  });

  Given('rows of heights {string}', (world, text) => {
    const heights = names(text).map(Number);
    const tops = heights.map((_, index) => heights.slice(0, index).reduce((sum, height) => sum + height, 0));
    world.rows = { heights, tops };
  });
  When('row {int} is dragged to the top {int}', (world, row, top) => {
    const { heights, tops } = world.rows;
    world.drag = { from: row - 1, to: dropIndex(tops, heights, row - 1, top) };
  });
  Then('it takes place {int}', (world, place) => {
    assert.equal(world.drag.to + 1, place);
  });
  Then('the other rows shift by {string}', (world, text) => {
    const { heights } = world.rows;
    const { from, to } = world.drag;
    assert.deepEqual(shifts(heights.length, from, to, heights[from]).map((shift) => shift + 0), names(text).map(Number));
  });
};
