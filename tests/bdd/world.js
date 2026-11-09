// The world of a scenario: one object that every step file shares. A new field starts here, never
// in a step file, so that no state carries from one scenario to the next.

import assert from 'node:assert/strict';
import { emptyState } from '#store';
import { fakeStorage } from '../fakes.js';

export const createWorld = () => {
  let counter = 0;
  return {
    state: emptyState(),
    result: null,
    input: null,
    copy: null,
    newId: () => `id-${(counter += 1)}`,
    storage: fakeStorage(),
    // Monday: the week of today is "2026-11-09".
    today: '2026-11-09',
    shared: null,
  };
};

// Applies an operation to the state as a user action: keeps the input and a deep copy of it, to
// check that it does not change (ENG-1), and the result for the Then steps.
export const apply = (world, operation) => {
  world.input = world.state;
  world.copy = structuredClone(world.state);
  world.result = operation(world.state);
  world.state = world.result.state;
};

export const findItem = (world, name) => {
  const item = world.state.items.find((candidate) => candidate.name === name);
  assert.ok(item, `No item named "${name}"`);
  return item;
};

export const yesNo = (text) => {
  if (text === 'yes') return true;
  if (text === 'no') return false;
  throw new Error(`Expected yes or no, got "${text}"`);
};

// A comma-separated list of names; an empty text is an empty list.
export const names = (text) => text.split(',').map((name) => name.trim()).filter(Boolean);

// The Monday of the week of a date `YYYY-MM-DD`, at noon local time so no time zone moves it.
export const dateOf = (text) => new Date(`${text}T12:00:00`);
