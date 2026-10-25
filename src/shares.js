// The rules of a shared space (SHARE-1 to SHARE-9): which space a user syncs, and what the sheet
// Compartir lista shows. Pure: no storage, no network, no DOM.

// SHARE-3: the server stores the invited email in lower case; a user email keeps its case.
const sameEmail = (a, b) => a.toLowerCase() === b.toLowerCase();

// SHARE-11: a cancelled share counts for nobody but the owner's list of people.
const active = (share) => !share.cancelled;

const membership = (shares, userId) => shares.find((share) => share.member === userId && active(share)) ?? null;

// SHARE-6, SHARE-11: the accepted, not cancelled share whose member is the user, else null.
export const sharedSpace = (shares, userId) => {
  const share = membership(shares, userId);
  return share && { owner: share.owner, ownerName: share.ownerName ?? '', ownerEmail: share.ownerEmail, scope: share.scope ?? 'all', id: share.id };
};

// Task 5 removes this: the syncer still asks for the space to sync.
export const targetSpace = (shares, userId) => sharedSpace(shares, userId)?.owner ?? userId;

// SHARE-11: the name of the shared list: the name of the owner, else the part of the email before `@`.
export const listName = (share) => share.ownerName || share.ownerEmail.split('@')[0];

// SHARE-11: the state of a person in the sheet of the owner.
export const personState = (share) => {
  if (share.cancelled) return 'cancelled';
  return share.member === '' ? 'pending' : 'joined';
};

// SHARE-9: the pending invite for the email of the user; a member sees none.
export const pendingInvite = (shares, user) => {
  if (membership(shares, user.id)) return null;
  return shares.find((share) => active(share) && share.member === '' && share.owner !== user.id && sameEmail(share.email, user.email)) ?? null;
};

// SHARE-9: the one case of the sheet. An owner of a share cannot accept an invite (SHARE-5); a
// cancelled share does not block (SHARE-11).
export const shareCase = (shares, user) => {
  const member = membership(shares, user.id);
  if (member) return { case: 'member', share: member };
  const own = shares.filter((share) => share.owner === user.id);
  const invite = pendingInvite(shares, user);
  if (invite) return { case: 'invited', share: invite, blocked: own.some(active) };
  return { case: 'owner', people: own.map((share) => ({ ...share, state: personState(share) })) };
};
