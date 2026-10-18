import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SAVED_MS, savedChange } from '#sheets';

test('a write that leaves the value as it was is not a save', () => {
  assert.equal(savedChange('Leche', 'Leche', false), false);
  assert.equal(savedChange('', '', false), false);
});

test('a write with an error is not a save, even when the value differs', () => {
  assert.equal(savedChange('Leche', 'Pan', true), false);
});

test('a value that differs only by the spaces at its ends is not a save', () => {
  assert.equal(savedChange('Leche', '  Leche ', false), false);
});

test('a write that changes the value is a save', () => {
  assert.equal(savedChange('Leche', 'Leche entera', false), true);
  assert.equal(savedChange('2', '', false), true);
});

test('a value that is gone after the write is not a save', () => {
  assert.equal(savedChange('Leche', undefined, false), false);
});

test('Guardado shows for 1.2 s', () => {
  assert.equal(SAVED_MS, 1200);
});
