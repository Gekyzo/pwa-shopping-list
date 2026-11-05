// The move to the new address (ADDR-1 to ADDR-8): the screen of the old address, and the import of a
// moved backup on the new one.
import { NEW_ORIGIN, isOldOrigin, encodeMove, decodeMove, moveUrl, moveMode } from '#move';
import { loadQueue } from '#session';
import { exportJson } from '#storage';
import { $, storage, t, textOf, showToast, apply, onOwn, ownState } from '#ui/context';
import { signedIn, syncer, hasLocalData } from '#ui/account';
import { closeOnboarding } from '#ui/onboarding';

const queued = () => (storage ? loadQueue(storage).length + loadQueue(storage, 'shared').length : 0);

const say = (key) => {
  $('move-status').textContent = key ? t(key) : '';
};

// ADDR-2 to ADDR-4. `synced`: one sync already ran for this tap, so a queue left means it failed.
const go = async (synced = false) => {
  const mode = moveMode({ signedIn: signedIn(), queued: queued(), online: navigator.onLine });
  if (mode === 'carry') {
    const url = moveUrl(await encodeMove(exportJson(ownState())), location.search);
    if (url) location.assign(url);
    else {
      say('move.tooLarge');
      $('move-export').hidden = false;
    }
    return;
  }
  if (mode === 'go') {
    const query = new URLSearchParams(location.search);
    query.set('moved', '1');
    location.assign(`${NEW_ORIGIN}/?${query}`);
    return;
  }
  if (mode === 'wait') {
    say('move.waiting');
    window.addEventListener('online', () => go(), { once: true });
    return;
  }
  if (synced) {
    say('move.syncFailed');
    $('move-go').disabled = false;
    return;
  }
  say('move.syncing');
  $('move-go').disabled = true;
  await syncer.run();
  $('move-go').disabled = false;
  go(true);
};

const showOldScreen = () => {
  $('move-title').textContent = t('move.title', { host: new URL(NEW_ORIGIN).host });
  $('move').hidden = false;
  // Nothing behind the screen takes the focus, the account screen of ACC-1 neither.
  for (const node of document.body.children) if (node.id !== 'move') node.inert = true;
  $('move-go').addEventListener('click', () => go());
  $('move-export').addEventListener('click', () => $('export').click());
  $('move-go').focus();
};

// ADDR-5, ADDR-6. The fragment leaves the URL before the decode, so a reload imports nothing.
const importMoved = async () => {
  const hash = location.hash;
  history.replaceState(null, '', `${location.pathname}${location.search}`);
  const result = await decodeMove(hash);
  if (result.error) {
    showToast(textOf(result.error));
    return;
  }
  if (hasLocalData()) {
    const found = {
      items: t('count.items', { count: result.state.items.length }),
      recipes: t('count.recipes', { count: result.state.recipes.length }),
    };
    if (!window.confirm(t('move.replace', found))) return;
  }
  // A moved backup is data, not a first start: the walkthrough would cover it.
  closeOnboarding();
  apply(onOwn(() => result), { undoText: t('move.done'), explicit: true });
};

// Runs before the account starts, so ACC-1 routes on the moved data. `moved`: the old address sent
// a signed-in user here with no data (ADDR-2, ADDR-8).
export const startMove = async ({ moved = false } = {}) => {
  if (isOldOrigin(location.hostname)) {
    showOldScreen();
    return;
  }
  if (location.hash.startsWith('#import=')) await importMoved();
  else if (moved) showToast(t('move.install'));
};
