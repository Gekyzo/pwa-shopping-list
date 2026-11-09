// The steps of the rows of the add sheet, `src/suggest.js`.

import assert from 'node:assert/strict';
import { suggestionRows } from '#suggest';

export const defineSuggestSteps = ({ When, Then }) => {
  When('I type {string} in the add sheet', (world, text) => {
    world.rows = suggestionRows(world.state, text);
  });
  Then('the add sheet rows are:', (world, table) => {
    const rows = world.rows.map((row) => ({
      kind: row.kind,
      name: row.item?.name ?? '',
      'in list': row.inList ? 'yes' : 'no',
    }));
    assert.deepEqual(rows, table.hashes);
  });
  Then('the add sheet has {int} row(s)', (world, count) => {
    assert.equal(world.rows.length, count);
  });
};
