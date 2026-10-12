import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseVersion, versionStatus, nextVersion } from '../src/version.js';

const build = (number, date = '2026-10-12T21:41:00.000Z') => ({ build: number, date });

test('parseVersion keeps the build and the date', () => {
  assert.deepEqual(parseVersion({ build: 12, date: '2026-10-12T21:41:00.000Z', other: 1 }), build(12));
});

test('parseVersion rejects a build that is not a positive integer', () => {
  for (const value of [0, -1, 1.5, '12', null, undefined]) {
    assert.equal(parseVersion({ build: value, date: '2026-10-12T21:41:00.000Z' }), null);
  }
});

test('parseVersion rejects a date that is not valid', () => {
  for (const value of ['yesterday', '', 12, null, undefined]) {
    assert.equal(parseVersion({ build: 1, date: value }), null);
  }
});

test('parseVersion rejects data that is not an object', () => {
  for (const data of [null, undefined, 'text', 3, []]) {
    assert.equal(parseVersion(data), null);
  }
});

test('versionStatus is current when the deployed build is the running build', () => {
  assert.equal(versionStatus(build(12), build(12)), 'current');
});

test('versionStatus is outdated when the deployed build is newer', () => {
  assert.equal(versionStatus(build(12), build(13)), 'outdated');
});

test('versionStatus is current when the running build is newer than the deployed build', () => {
  assert.equal(versionStatus(build(13), build(12)), 'current');
});

test('versionStatus is unknown when one side is missing', () => {
  assert.equal(versionStatus(null, build(12)), 'unknown');
  assert.equal(versionStatus(build(12), null), 'unknown');
  assert.equal(versionStatus(null, null), 'unknown');
});

test('nextVersion adds one to the build and takes the date of the bump', () => {
  const current = build(12);
  const next = nextVersion(current, new Date('2026-10-13T08:00:00.000Z'));
  assert.deepEqual(next, build(13, '2026-10-13T08:00:00.000Z'));
  assert.deepEqual(current, build(12));
});

test('nextVersion starts at build 1 when there is no version', () => {
  assert.deepEqual(nextVersion(null, new Date('2026-10-13T08:00:00.000Z')), build(1, '2026-10-13T08:00:00.000Z'));
});
