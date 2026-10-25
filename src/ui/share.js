// The sheet Compartir lista (SHARE-9): the people of the own space and the invite field of an owner,
// the invite of an invitee, or the share of a member. A remove, a decline and a leave wait 5 s with
// Deshacer before they go to the server (SHARE-8).
import { shareCase } from '#shares';
import { $, el, ui, t, showToast, render } from '#ui/context';
import { syncer, sessionNow, shareStatus } from '#ui/account';

const UNDO_MS = 5000;

// The ids of the shares whose remove waits for its Deshacer: the sheet hides them meanwhile.
const waiting = new Set();
let error = null;

const currentCase = () => {
  const session = sessionNow();
  return session ? shareCase(shareStatus().shares ?? [], session.user) : { case: 'owner', people: [] };
};

export const openShare = () => {
  Object.assign(ui, { shareOpen: true, openId: null });
  error = null;
  $('share-email').value = '';
  render();
};

export const closeShare = () => {
  ui.shareOpen = false;
  render();
  $('share-open').focus();
};

// SHARE-8: the request goes when the Deshacer of 5 s ends; Deshacer keeps the share.
const later = (id, text, request) => {
  waiting.add(id);
  const timer = setTimeout(async () => {
    waiting.delete(id);
    const result = await request();
    if (result?.error) showToast(t(result.error));
    render();
  }, UNDO_MS);
  showToast(text, {
    undo: () => {
      clearTimeout(timer);
      waiting.delete(id);
      render();
    },
    ms: UNDO_MS,
  });
  render();
};

const personNode = (share) => {
  const remove = el('button', { type: 'button', className: 'button icon', textContent: '✕' });
  remove.setAttribute('aria-label', t('share.remove', { email: share.email }));
  remove.addEventListener('click', () => later(share.id, t('share.removed', { email: share.email }), () => syncer.remove(share.id)));
  const label = el('span', { className: 'product-name', textContent: share.email });
  const state = el('span', { className: 'settings-row-value', textContent: t(share.member ? 'share.joined' : 'share.pending') });
  return el('li', { className: 'product' }, [el('div', { className: 'input-row' }, [el('div', { className: 'share-person' }, [label, state]), remove])]);
};

const syncSubmit = () => {
  $('share-submit').disabled = !$('share-email').value.trim();
};

export const renderShare = () => {
  $('share').hidden = !ui.shareOpen;
  if (!ui.shareOpen) return;
  const shown = currentCase();
  $('share-owner').hidden = shown.case !== 'owner';
  $('share-invited').hidden = shown.case !== 'invited';
  $('share-member').hidden = shown.case !== 'member';
  if (shown.case === 'owner') {
    $('share-people').replaceChildren(...shown.people.filter((share) => !waiting.has(share.id)).map(personNode));
    $('share-error').hidden = error === null;
    $('share-error').textContent = error ? t(error) : '';
    syncSubmit();
  } else if (shown.case === 'invited') {
    const hidden = waiting.has(shown.share.id);
    $('share-invited-text').textContent = t('share.invited', { email: shown.share.ownerEmail });
    $('share-warning').textContent = t(shown.blocked ? 'share.blocked' : 'share.acceptWarning');
    $('share-accept').hidden = shown.blocked || hidden;
    $('share-decline').hidden = hidden;
  } else {
    $('share-member-text').textContent = t('share.member', { email: shown.share.ownerEmail });
    $('share-leave').hidden = waiting.has(shown.share.id);
  }
};

const invite = async () => {
  const address = $('share-email').value;
  $('share-submit').disabled = true;
  const result = await syncer.invite(address);
  error = result?.error ?? null;
  if (!error) $('share-email').value = '';
  render();
  $('share-email').focus();
};

// SHARE-5: the accept asks first, since the list of the owner takes the place of the own list.
const accept = async () => {
  const shown = currentCase();
  if (shown.case !== 'invited' || shown.blocked) return;
  if (!window.confirm(t('share.acceptAsk', { email: shown.share.ownerEmail }))) return;
  const result = await syncer.accept(shown.share.id);
  if (result?.error) showToast(t(result.error));
  render();
};

const decline = () => {
  const shown = currentCase();
  if (shown.case !== 'invited') return;
  later(shown.share.id, t('share.declined'), () => syncer.decline(shown.share.id));
};

const leave = () => {
  const shown = currentCase();
  if (shown.case !== 'member') return;
  later(shown.share.id, t('share.leftList', { email: shown.share.ownerEmail }), () => syncer.leave(shown.share.id));
};

export const bind = () => {
  if (!syncer) return;
  $('share-open').addEventListener('click', openShare);
  $('share-banner-open').addEventListener('click', openShare);
  $('share-veil').addEventListener('click', closeShare);
  $('share-form').addEventListener('submit', (event) => {
    event.preventDefault();
    invite();
  });
  $('share-email').addEventListener('input', () => {
    error = null;
    $('share-error').hidden = true;
    syncSubmit();
  });
  $('share-accept').addEventListener('click', accept);
  $('share-decline').addEventListener('click', decline);
  $('share-leave').addEventListener('click', leave);
};
