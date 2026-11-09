// The steps of the aisles, `src/aisles.js`.

import assert from 'node:assert/strict';
import { addAisle, aisleKind } from '#aisles';
import { names } from '../world.js';

export const defineAisleSteps = ({ Given, Then }) => {
  Given('the aisles are {string}', (world, text) => {
    world.state = names(text).reduce((state, aisle) => {
      const result = addAisle(state, aisle);
      assert.equal(result.error, undefined, `The add of the aisle "${aisle}" failed`);
      return result.state;
    }, world.state);
  });
  Then('the kind of the aisle {string} is {word}', (world, name, kind) => {
    assert.equal(aisleKind(name) ?? 'none', kind);
  });
};
