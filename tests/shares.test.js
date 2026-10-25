import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sharedSpace, listName, personState, shareCase, pendingInvite } from '#shares';

const share = (id, owner, email, member = '', ownerEmail = `${owner}@b.c`, extra = {}) => ({
  id, owner, email, ownerEmail, ownerName: '', member, scope: 'all', cancelled: false, ...extra,
});
const user = (id, email = `${id}@b.c`) => ({ id, email, name: id, approved: true });

test('sharedSpace is null with no share or with a pending invite (SHARE-6)', () => {
  assert.equal(sharedSpace([], 'u1'), null);
  assert.equal(sharedSpace([share('s1', 'o1', 'u1@b.c')], 'u1'), null);
});

test('sharedSpace is the space of the owner of the share whose member is the user', () => {
  const shares = [share('s1', 'o1', 'u1@b.c', 'u1'), share('s2', 'u1', 'x@b.c')];
  assert.equal(sharedSpace(shares, 'u1').owner, 'o1');
  assert.equal(sharedSpace([share('s1', 'o1', 'u2@b.c', 'u2')], 'u1'), null);
});

test('shareCase of an owner lists the people of the own space in invite order', () => {
  const shares = [share('s1', 'u1', 'a@b.c', 'a'), share('s2', 'u1', 'c@b.c'), share('s3', 'o9', 'z@b.c')];
  assert.deepEqual(shareCase(shares, user('u1')), {
    case: 'owner',
    people: [{ ...shares[0], state: 'joined' }, { ...shares[1], state: 'pending' }],
  });
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

test('sharedSpace ignores a cancelled share', () => {
  const cancelled = share('s1', 'o1', 'u1@b.c', 'u1', 'o1@b.c', { cancelled: true });
  assert.equal(sharedSpace([cancelled], 'u1'), null);
  assert.equal(sharedSpace([], 'u1'), null);
  assert.equal(sharedSpace([share('s2', 'o1', 'u1@b.c')], 'u1'), null);
});

test('sharedSpace returns the scope and the owner name', () => {
  const shares = [share('s1', 'o1', 'u1@b.c', 'u1', 'o1@b.c', { ownerName: 'Ana', scope: 'list' })];
  assert.deepEqual(sharedSpace(shares, 'u1'), { owner: 'o1', ownerName: 'Ana', ownerEmail: 'o1@b.c', scope: 'list', id: 's1' });
});

test('listName falls back to the email', () => {
  assert.equal(listName({ ownerName: 'Ana', ownerEmail: 'ana@b.c' }), 'Ana');
  assert.equal(listName({ ownerName: '', ownerEmail: 'ana@b.c' }), 'ana');
});

test('personState gives pending, joined and cancelled', () => {
  assert.equal(personState(share('s1', 'o', 'a@b.c')), 'pending');
  assert.equal(personState(share('s1', 'o', 'a@b.c', 'a')), 'joined');
  assert.equal(personState(share('s1', 'o', 'a@b.c', 'a', 'o@b.c', { cancelled: true })), 'cancelled');
  assert.equal(personState(share('s1', 'o', 'a@b.c', '', 'o@b.c', { cancelled: true })), 'cancelled');
});

test('a cancelled invite is not pending', () => {
  const cancelled = share('s1', 'o1', 'u1@b.c', '', 'o1@b.c', { cancelled: true });
  assert.equal(pendingInvite([cancelled], user('u1')), null);
  assert.deepEqual(shareCase([cancelled], user('u1')), { case: 'owner', people: [] });
});

test('blocked counts only active shares of the owner', () => {
  const invite = share('s1', 'o1', 'u1@b.c');
  const gone = share('s2', 'u1', 'x@b.c', '', 'u1@b.c', { cancelled: true });
  assert.equal(shareCase([invite, gone], user('u1')).blocked, false);
  assert.equal(shareCase([invite, gone, share('s3', 'u1', 'y@b.c')], user('u1')).blocked, true);
  assert.deepEqual(shareCase([gone], user('u1')), { case: 'owner', people: [{ ...gone, state: 'cancelled' }] });
});

test('the rules leave the shares unchanged', () => {
  const shares = Object.freeze([Object.freeze(share('s1', 'u1', 'a@b.c'))]);
  shareCase(shares, user('u1'));
  pendingInvite(shares, user('u1'));
  sharedSpace(shares, 'u1');
});
