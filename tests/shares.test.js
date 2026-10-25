import { test } from 'node:test';
import assert from 'node:assert/strict';
import { targetSpace, shareCase, pendingInvite } from '#shares';

const share = (id, owner, email, member = '', ownerEmail = `${owner}@b.c`) => ({ id, owner, email, ownerEmail, member });
const user = (id, email = `${id}@b.c`) => ({ id, email, name: id, approved: true });

test('targetSpace is the own space with no share or with a pending invite (SHARE-6)', () => {
  assert.equal(targetSpace([], 'u1'), 'u1');
  assert.equal(targetSpace([share('s1', 'o1', 'u1@b.c')], 'u1'), 'u1');
});

test('targetSpace is the space of the owner of the share whose member is the user', () => {
  const shares = [share('s1', 'o1', 'u1@b.c', 'u1'), share('s2', 'u1', 'x@b.c')];
  assert.equal(targetSpace(shares, 'u1'), 'o1');
  assert.equal(targetSpace([share('s1', 'o1', 'u2@b.c', 'u2')], 'u1'), 'u1');
});

test('shareCase of an owner lists the people of the own space in invite order', () => {
  const shares = [share('s1', 'u1', 'a@b.c', 'a'), share('s2', 'u1', 'c@b.c'), share('s3', 'o9', 'z@b.c')];
  assert.deepEqual(shareCase(shares, user('u1')), { case: 'owner', people: [shares[0], shares[1]] });
  assert.deepEqual(shareCase([], user('u1')), { case: 'owner', people: [] });
});

test('shareCase of a member names the share', () => {
  const shares = [share('s1', 'o1', 'u1@b.c', 'u1')];
  assert.deepEqual(shareCase(shares, user('u1')), { case: 'member', share: shares[0] });
});

test('shareCase of an invitee compares the email with no regard to case (SHARE-3)', () => {
  const shares = [share('s1', 'o1', 'ana@b.c')];
  assert.deepEqual(shareCase(shares, user('u1', 'Ana@B.c')), { case: 'invited', share: shares[0], blocked: false });
});

test('shareCase of an invitee who owns a share is blocked (SHARE-5)', () => {
  const shares = [share('s1', 'o1', 'u1@b.c'), share('s2', 'u1', 'x@b.c')];
  assert.deepEqual(shareCase(shares, user('u1')), { case: 'invited', share: shares[0], blocked: true });
});

test('pendingInvite is the invite for the email of the user, and null for a member or with none', () => {
  const invite = share('s1', 'o1', 'u1@b.c');
  assert.equal(pendingInvite([invite], user('u1', 'U1@b.c')), invite);
  assert.equal(pendingInvite([share('s2', 'o1', 'u1@b.c', 'u1')], user('u1')), null);
  assert.equal(pendingInvite([share('s3', 'u1', 'x@b.c')], user('u1')), null);
  assert.equal(pendingInvite([], user('u1')), null);
});

test('the rules leave the shares unchanged', () => {
  const shares = Object.freeze([Object.freeze(share('s1', 'u1', 'a@b.c'))]);
  shareCase(shares, user('u1'));
  pendingInvite(shares, user('u1'));
  targetSpace(shares, 'u1');
});
