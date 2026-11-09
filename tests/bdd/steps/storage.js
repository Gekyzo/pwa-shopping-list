// The steps of the browser storage and the backup, `src/storage.js`: the keys, the load and the
// save of the state, the preferences of the device, the storage figures, the export and the import.

import assert from 'node:assert/strict';
import { emptyState } from '#store';
import { weekOf } from '#menu';
import {
  loadTripEnd,
  saveTripEnd,
  storedBytes,
  kilobytes,
  loadState,
  save,
  exportJson,
  exportFilename,
  importJson,
  resetAll,
  APP_KEYS,
} from '#storage';
import { brokenStorage } from '../../fakes.js';
import { names } from '../world.js';

const keysOf = (storage) => Array.from({ length: storage.length }, (_, index) => storage.key(index));

export const defineStorageSteps = ({ Given, When, Then }) => {
  Given('the key {string} holds {string}', (world, key, value) => {
    world.storage.setItem(key, value);
  });
  Given('the key {string} holds:', (world, key, text) => {
    world.storage.setItem(key, text);
  });
  Given('the key {string} holds {int} times {string}', (world, key, count, text) => {
    world.storage.setItem(key, text.repeat(count));
  });
  Given('the browser storage fails', (world) => {
    world.storage = brokenStorage();
  });
  Given('the browser storage holds each key of the app', (world) => {
    APP_KEYS.forEach((key) => world.storage.setItem(key, '1'));
  });

  When('I choose {word} at the end of a trip', (world, choice) => {
    assert.equal(saveTripEnd(world.storage, choice), true);
  });
  When('the app loads the state', (world) => {
    world.loaded = loadState(world.storage);
    world.state = world.loaded.state;
  });
  When('the app saves the state', (world) => {
    world.saved = save(world.storage, world.state);
  });
  When('I export the state', (world) => {
    world.exported = exportJson(world.state);
    world.beforeExport = world.state;
  });
  When('I import:', (world, text) => {
    world.result = importJson(text);
    if (world.result.state) world.state = world.result.state;
  });
  When('I import the export', (world) => {
    world.result = importJson(world.exported);
    if (world.result.state) world.state = world.result.state;
  });
  When('I delete all data', (world) => {
    world.reset = resetAll(world.storage);
  });

  Then('the key {string} is not stored', (world, key) => {
    assert.equal(world.storage.getItem(key), null);
  });
  Then('the key {string} holds the current state', (world, key) => {
    assert.deepEqual(JSON.parse(world.storage.getItem(key)), world.state);
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
  Then('the state is empty', (world) => {
    assert.deepEqual(world.state, emptyState());
  });
  Then('the load lost the stored state', (world) => {
    assert.equal(world.loaded.lost, true);
  });
  Then('the save succeeded', (world) => {
    assert.equal(world.saved, true);
  });
  Then('the save failed', (world) => {
    assert.equal(world.saved, false);
  });
  Then('the state field {string} is:', (world, field, json) => {
    assert.deepEqual(world.state[field], JSON.parse(json));
  });
  Then('the state has the fields {string}', (world, text) => {
    assert.deepEqual(Object.keys(world.state).sort(), names(text).sort());
  });
  Then('the menu has {int} meal(s), in the week of today', (world, count) => {
    assert.equal(world.state.menu.length, count);
    assert.ok(world.state.menu.every((meal) => meal.week === weekOf(new Date())));
  });
  Then('the export file name at {string} is {string}', (world, time, name) => {
    assert.equal(exportFilename(new Date(time)), name);
  });
  Then('the export is the state as JSON with an indent of 2', (world) => {
    assert.equal(world.exported, JSON.stringify(world.state, null, 2));
  });
  Then('the export has the fields {string}', (world, text) => {
    assert.deepEqual(Object.keys(JSON.parse(world.exported)).sort(), names(text).sort());
  });
  Then('the state is the one before the export', (world) => {
    assert.deepEqual(world.state, world.beforeExport);
  });
  Then('the delete of all data succeeded', (world) => {
    assert.equal(world.reset, true);
  });
  Then('the delete of all data failed', (world) => {
    assert.equal(world.reset, false);
  });
  Then('the browser storage holds only {string}', (world, text) => {
    assert.deepEqual(keysOf(world.storage), names(text));
  });
};
