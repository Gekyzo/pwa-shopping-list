// The rules of a shared space (SHARE-1 to SHARE-9): which space a user syncs, and what the sheet
// Compartir lista shows. Pure: no storage, no network, no DOM.

// SHARE-3: the server stores the invited email in lower case; a user email keeps its case.
const sameEmail = (a, b) => a.toLowerCase() === b.toLowerCase();

const membership = (shares, userId) => shares.find((share) => share.member === userId) ?? null;

// SHARE-6: the owner of the share whose member is the user, else the own space.
export const targetSpace = (shares, userId) => membership(shares, userId)?.owner ?? userId;

// SHARE-9: the pending invite for the email of the user; a member sees none.
export const pendingInvite = (shares, user) => {
  if (membership(shares, user.id)) return null;
  return shares.find((share) => share.member === '' && share.owner !== user.id && sameEmail(share.email, user.email)) ?? null;
};

// SHARE-9: the one case of the sheet. An owner of a share cannot accept an invite (SHARE-5).
export const shareCase = (shares, user) => {
  const member = membership(shares, user.id);
  if (member) return { case: 'member', share: member };
  const people = shares.filter((share) => share.owner === user.id);
  const invite = pendingInvite(shares, user);
  if (invite) return { case: 'invited', share: invite, blocked: people.length > 0 };
  return { case: 'owner', people };
};
