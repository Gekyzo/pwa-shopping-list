// The steps of the browser storage, `src/storage.js`: the keys, the preferences of the device and
// the storage figures.

import assert from 'node:assert/strict';
import { loadTripEnd, saveTripEnd, storedBytes, kilobytes } from '#storage';
import { brokenStorage } from '../../fakes.js';

export const defineStorageSteps = ({ Given, When, Then }) => {
  Given('the key {string} holds {string}', (world, key, value) => {
    world.storage.setItem(key, value);
  });
  Given('the key {string} holds {int} times {string}', (world, key, count, text) => {
    world.storage.setItem(key, text.repeat(count));
  });
  Given('the browser storage fails', (world) => {
    world.storage = brokenStorage();
  });

  When('I choose {word} at the end of a trip', (world, choice) => {
    assert.equal(saveTripEnd(world.storage, choice), true);
  });

  Then('the key {string} is not stored', (world, key) => {
    assert.equal(world.storage.getItem(key), null);
  });
  Then('the trip end choice is {word}', (world, choice) => {
    assert.equal(loadTripEnd(world.storage), choice);
  });
  Then('the storage card shows {int} KB', (world, kb) => {
    assert.equal(kilobytes(storedBytes(world.storage)), kb);
  });
  Then('the storage card does not show', (world) => {
    assert.equal(storedBytes(world.storage), null);
  });
};
