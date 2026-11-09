// The steps of the aisles, `src/aisles.js`.

import assert from 'node:assert/strict';
import { addAisle, renameAisle, deleteAisle, moveAisle, setItemAisle, addDefaultAisles, aisleKind } from '#aisles';
import { apply, findItem, names } from '../world.js';

const STEPS = { up: -1, down: 1 };

export const defineAisleSteps = ({ Given, When, Then }) => {
  Given('the aisles are {string}', (world, text) => {
    world.state = names(text).reduce((state, aisle) => {
      const result = addAisle(state, aisle);
      assert.equal(result.error, undefined, `The add of the aisle "${aisle}" failed`);
      return result.state;
    }, world.state);
  });

  When('I add the aisle {string}', (world, name) => apply(world, (state) => addAisle(state, name)));
  When('I rename the aisle {string} to {string}', (world, from, to) => apply(world, (state) => renameAisle(state, from, to)));
  When('I delete the aisle {string}', (world, name) => apply(world, (state) => deleteAisle(state, name)));
  When('I move the aisle {string} {word}', (world, name, direction) => {
    assert.ok(direction in STEPS, `A move is up or down, not ${direction}`);
    apply(world, (state) => moveAisle(state, name, STEPS[direction]));
  });
  When('I put {string} in the aisle {string}', (world, name, aisle) => {
    const { id } = findItem(world, name);
    apply(world, (state) => setItemAisle(state, id, aisle));
  });
  When('I add the usual aisles {string}', (world, text) => apply(world, (state) => addDefaultAisles(state, names(text))));

  Then('the aisles are now {string}', (world, text) => {
    assert.deepEqual(world.state.aisles, names(text));
  });
  Then('the kind of the aisle {string} is {word}', (world, name, kind) => {
    assert.equal(aisleKind(name) ?? 'none', kind);
  });
};
