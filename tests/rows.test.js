import { test } from 'node:test';
import assert from 'node:assert/strict';

// The views read the page; a stub of the page lets node load them.
const stub = () => new Proxy(function () {}, { get: (_, key) => (key === Symbol.toPrimitive ? () => '' : stub()), apply: () => stub(), set: () => true });
Object.assign(globalThis, { document: globalThis.document ?? stub(), window: globalThis.window ?? stub(), location: globalThis.location ?? { search: '' } });
globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
const { openRowMenu, rowGroup } = await import('#ui/rows');
const { ui, setRender } = await import('#ui/context');

const keep = () => ({ openId: ui.openId, openSide: ui.openSide, openGroup: ui.openGroup, settleFrom: ui.settleFrom });

test('openRowMenu opens the actions of the row, as a settled slide to the left does (ROW-15)', () => {
  const before = keep();
  let renders = 0;
  setRender(() => renders++);
  try {
    Object.assign(ui, { openId: 'other', openSide: 'end', openGroup: null, settleFrom: { id: 'other', groupId: null, x: -40 } });
    openRowMenu('a', 'g1');
    assert.equal(ui.openId, 'a');
    assert.equal(ui.openSide, 'end');
    assert.equal(ui.openGroup, 'g1');
    assert.equal(ui.settleFrom, null);
    assert.equal(renders, 1);
  } finally {
    Object.assign(ui, before);
    setRender(() => {});
  }
});

test('openRowMenu takes a row with no group', () => {
  const before = keep();
  setRender(() => {});
  try {
    openRowMenu('b');
    assert.equal(ui.openId, 'b');
    assert.equal(ui.openGroup, null);
  } finally {
    Object.assign(ui, before);
  }
});

test('rowGroup reads the group of the slide, not the card of groupNodes (NAV-29)', () => {
  // A row of Otros, Sin tienda or Sin pasillo is in a card with a key but has no group of its own.
  assert.equal(rowGroup({ id: 'a', group: 'others' }), null);
  assert.equal(rowGroup({ id: 'a', group: 'r1', swipeGroup: 'r1' }), 'r1');
  assert.equal(rowGroup({ id: 'a' }), null);
});
