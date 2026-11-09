// The steps that every area shares: the result of the last operation.

import assert from 'node:assert/strict';

export const defineCommonSteps = ({ Then }) => {
  Then('there is no error', (world) => {
    assert.equal(world.result.error, undefined);
  });
  Then('the error is {string}', (world, key) => {
    assert.equal(world.result.error?.key, key);
  });
  Then('the state did not change', (world) => {
    assert.equal(world.state, world.input, 'The operation returned a new state object');
  });
  Then('the input state did not change', (world) => {
    assert.deepEqual(world.input, world.copy);
  });
};
