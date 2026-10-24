// The account screens (ACC-2): Iniciar sesión, Solicitar acceso and Esperando aprobación, the sync of the
// device (SYNC-3), its offline note (SYNC-11), the banner of a device with no session (ACC-11) and the
// row Cuenta of Ajustes (ACC-10).
import { createClient, PocketBaseError } from '#pocketbase';
import { createSyncer } from '#syncer';
import { loadSession, saveSession, loadSyncState, routeAtStart, SESSION_KEY, BEFORE_LOGIN_KEY } from '#session';
import { apiUrl } from '#config';
import { exportJson, exportFilename } from '#storage';
import { emptyState } from '#store';
import { toRecords, diffRecords } from '#records';
import { intlTag } from '#i18n';
import { $, storage, state, stateLost, ui, t, lang, showToast, render, replaceState, download } from '#ui/context';
import { inList } from '#ui/view';

// ACC-2: the length that Solicitar acceso asks of a password.
const PASSWORD_MIN = 8;
// In sessionStorage, for the time of the Google redirect only (ACC-5): the state and the verifier.
const OAUTH_KEY = 'shopping.oauth';
const SCREENS = ['login', 'request', 'waiting'];

// With no storage the app keeps no session and no sync: it works as before, local only.
const client = storage
  ? createClient({ url: apiUrl(location.hostname), fetch: window.fetch.bind(window), EventSource: window.EventSource })
  : null;

// The screen in view, or null; and whether it can close back to the list (the device has a list).
let screen = null;
let closable = false;
let status = { online: true, pending: 0, lastSync: null, auth: false };
let offline = !navigator.onLine;
// The close function of the realtime stream (SYNC-3), or null.
let stream = null;

const show = (name, { canClose = false } = {}) => {
  screen = name;
  closable = canClose;
  renderAccount(name);
  // The render gives a screen that can close its entry of the history (holdBack, NAV-25).
  render();
  $(`${name}-title`).focus();
};

const close = () => {
  screen = null;
  closable = false;
  renderAccount(null);
  render();
};

const onStatus = (next) => {
  const stopped = next.auth && !status.auth;
  status = next;
  // ACC-7: an auth error shows Iniciar sesión over the list; the state and the queue stay.
  if (stopped) {
    disconnect();
    show('login', { canClose: true });
  }
  renderSync();
};

export const syncer = client
  ? createSyncer({ client, storage, getState: () => state, setState: replaceState, onStatus, lost: stateLost })
  : null;

// ACC-1: the state differs from a new install, the settings too (the rule of the syncer). Kept for one
// state, since each render asks.
let dataOf = null;
let dataValue = false;
const hasLocalData = () => {
  if (dataOf !== state) {
    dataOf = state;
    dataValue = diffRecords(toRecords(emptyState()), toRecords(state)).length > 0;
  }
  return dataValue;
};

const sessionNow = () => (syncer ? loadSession(storage) : null);

// Import and Borrar todos los datos ask another question with a session (SYNC-9, SYNC-10).
export const signedIn = () => sessionNow() !== null;

const dropSession = () => {
  try {
    storage.removeItem(SESSION_KEY);
  } catch {
    // Nothing more to remove.
  }
};

const redirectUrl = () => `${location.origin}${location.pathname}`;

const showError = (name, key) => {
  const node = $(`${name}-error`);
  node.textContent = key ? t(key) : '';
  node.hidden = !key;
};

const errorKey = (error) => {
  if (!(error instanceof PocketBaseError)) return 'account.error.network';
  if (error.status === 429) return 'account.error.tooMany';
  if (error.type === 'network' || error.type === 'server') return 'account.error.network';
  return 'account.error.invalid';
};

// The buttons of a screen wait for its request, so that a second tap sends nothing (rate limit).
const busy = async (name, task) => {
  const buttons = [...$(name).querySelectorAll('button')];
  buttons.forEach((button) => {
    button.disabled = true;
  });
  try {
    await task();
  } finally {
    buttons.forEach((button) => {
      button.disabled = false;
    });
  }
};

const exportState = (data) => download(exportFilename(new Date()), exportJson(data));

const hasBeforeLogin = () => {
  try {
    return storage.getItem(BEFORE_LOGIN_KEY) !== null;
  } catch {
    return false;
  }
};

// SYNC-8: the list that the account replaced, as an export file, once, after that login.
const offerBeforeLogin = () => {
  if (!window.confirm(t('account.beforeLoginAsk'))) return;
  try {
    exportState(JSON.parse(storage.getItem(BEFORE_LOGIN_KEY)));
  } catch {
    // The copy cannot be read: it stays stored.
  }
};

// The realtime stream starts a sync at each change of the account (SYNC-3). Only after a finished login,
// online and with no auth stop; the first run has refreshed the token by then.
export const connect = () => {
  disconnect();
  const session = sessionNow();
  if (!session?.user.approved || offline || status.auth || loadSyncState(storage).owner !== session.user.id) return;
  const run = () => syncer.run();
  stream = client.subscribe(() => sessionNow()?.token ?? session.token, run, { onReconnect: run });
};

const disconnect = () => {
  stream?.();
  stream = null;
};

const runAndConnect = () => syncer.run().then(connect);

// The login of a session that the server gave: the questions of ACC-8 and SYNC-8, then the list or
// Esperando aprobación. A failed first pull removes the session (the syncer): Iniciar sesión again.
const enter = async (session) => {
  const before = hasBeforeLogin();
  let result;
  try {
    result = await syncer.login(session);
    if (result === 'ask-export') {
      if (window.confirm(t('account.exportAsk'))) exportState(state);
      result = await syncer.login(session, { discard: true });
    }
  } catch (error) {
    if (!(error instanceof PocketBaseError)) console.error(error);
    show('login', { canClose: hasLocalData() });
    showError('login', 'account.error.network');
    return;
  }
  if (result === 'waiting') {
    show('waiting');
    return;
  }
  // The first sync of the login stopped at an auth error: onStatus shows Iniciar sesión (ACC-7).
  if (syncer.status().auth) return;
  close();
  connect();
  renderSync();
  if (!before && hasBeforeLogin()) offerBeforeLogin();
};

const submitLogin = () =>
  busy('login', async () => {
    const email = $('login-email').value.trim();
    const password = $('login-password').value;
    if (!email) {
      showError('login', 'account.error.emailMissing');
      return;
    }
    showError('login', null);
    let session;
    try {
      session = await client.authWithPassword(email, password);
    } catch (error) {
      // PocketBase answers a wrong email or password with a 400.
      showError('login', error?.type === 'invalid' && error.status === 400 ? 'account.error.wrongPassword' : errorKey(error));
      return;
    }
    $('login-password').value = '';
    await enter(session);
  });

// The error of a sign-up, by the field that the server refused.
const requestErrorKey = (error) => {
  const { email, password } = error?.fields ?? {};
  if (email?.code === 'validation_not_unique') return 'account.error.emailTaken';
  if (password) return 'account.error.passwordShort';
  return errorKey(error);
};

const submitRequest = () =>
  busy('request', async () => {
    const name = $('request-name').value.trim();
    const email = $('request-email').value.trim();
    const password = $('request-password').value;
    if (!email) {
      showError('request', 'account.error.emailMissing');
      return;
    }
    if (password.length < PASSWORD_MIN) {
      showError('request', 'account.error.passwordShort');
      return;
    }
    showError('request', null);
    let session;
    try {
      session = await client.requestAccess({ name, email, password });
    } catch (error) {
      const key = requestErrorKey(error);
      // The account exists, for example after a sign-up whose login failed: Iniciar sesión, with its email.
      if (key === 'account.error.emailTaken') {
        $('login-email').value = email;
        show('login', { canClose: closable });
        showError('login', key);
        $('login-password').focus();
        return;
      }
      showError('request', key);
      return;
    }
    $('request-password').value = '';
    await enter(session);
  });

// The same message whether the address has an account or not.
const forgot = () =>
  busy('login', async () => {
    const email = $('login-email').value.trim();
    if (!email) {
      showError('login', 'account.error.emailMissing');
      return;
    }
    try {
      await client.requestPasswordReset(email);
    } catch (error) {
      if (error?.type === 'network' || error?.type === 'server' || error?.status === 429) {
        showError('login', errorKey(error));
        return;
      }
    }
    showError('login', null);
    showToast(t('account.resetSent'));
  });

// ACC-5: the server gives the URL of Google; the state and the verifier wait in sessionStorage.
const google = (name) =>
  busy(name, async () => {
    showError(name, null);
    try {
      const { url, pending } = await client.oauthStart(redirectUrl());
      sessionStorage.setItem(OAUTH_KEY, JSON.stringify(pending));
      location.assign(url);
    } catch (error) {
      showError(name, error?.type === 'network' || error?.type === 'server' ? errorKey(error) : 'account.error.google');
    }
  });

// ACC-5: the return from Google. app.js has removed `code` and `state` from the URL already.
// A return with `error` and no `code` (the user cancelled at Google) shows the error too.
export const finishOAuth = async ({ code, state: returned }) => {
  let pending = null;
  try {
    pending = JSON.parse(sessionStorage.getItem(OAUTH_KEY));
    sessionStorage.removeItem(OAUTH_KEY);
  } catch {
    // No pending sign-in: the error below.
  }
  show('login', { canClose: hasLocalData() });
  renderSync();
  if (!syncer) return;
  if (!pending || !code) {
    showError('login', 'account.error.google');
    return;
  }
  await busy('login', async () => {
    let session;
    try {
      session = await client.oauthFinish({ code, state: returned }, pending, redirectUrl());
    } catch (error) {
      showError('login', error?.type === 'network' || error?.type === 'server' ? errorKey(error) : 'account.error.google');
      return;
    }
    await enter(session);
  });
};

// Comprobar de nuevo: a fresh session carries `approved` (ACC-3, ACC-4).
const checkAgain = () =>
  busy('waiting', async () => {
    const session = sessionNow();
    if (!session) {
      show('login', { canClose: hasLocalData() });
      return;
    }
    let fresh;
    try {
      fresh = await client.refresh(session.token);
    } catch (error) {
      if (error?.type !== 'auth') {
        showToast(t(errorKey(error)));
        return;
      }
      dropSession();
      show('login', { canClose: hasLocalData() });
      return;
    }
    saveSession(storage, fresh);
    if (fresh.user.approved !== true) {
      showToast(t('account.waiting.still'));
      return;
    }
    await enter(fresh);
  });

// ACC-9: online the queue goes first; changes still not sent offer an export, then the logout clears.
// The first question can stop the logout: then nothing changes.
export const logout = async () => {
  disconnect();
  const result = await syncer.logout({ online: navigator.onLine });
  if (result === 'ask-export') {
    if (!window.confirm(t('account.logoutAsk'))) {
      connect();
      return;
    }
    if (window.confirm(t('account.logoutExport'))) exportState(state);
    await syncer.logout({ online: false, discard: true });
  }
  ui.view = 'active';
  show('login');
  render();
};

// BACKUP-7: Borrar todos los datos stops the sync before it clears the storage. A sync in progress
// becomes stale and saves nothing; the queue is dropped, as the reset drops it anyway (SYNC-10).
export const stopSync = async () => {
  if (!syncer) return;
  disconnect();
  await syncer.logout({ online: false, discard: true });
};

// Cerrar sesión of Esperando aprobación. ACC-4: an account that waits never owned the list of the
// device, so only its session goes and the list stays. The owner of the list logs out in full.
const leaveWaiting = () => {
  const session = sessionNow();
  if (session && loadSyncState(storage).owner === session.user.id) return logout();
  dropSession();
  if (hasLocalData()) close();
  else show('login');
  renderSync();
  return null;
};

// A saved session whose login is not finished (the question of ACC-8, a failed first pull).
const loginPending = (session) => session?.user.approved === true && loadSyncState(storage).owner !== session.user.id;

// ACC-7: the saved token goes to the server again only after a refresh: a token that is no longer
// valid counts as a guest, whose pull is empty, and the login would then upload the list into an
// account with data. An auth error opens Iniciar sesión; at a network error the list stays, and the
// next start or `online` event tries again.
const resumeLogin = async (session) => {
  let fresh;
  try {
    fresh = await client.refresh(session.token);
  } catch (error) {
    if (error?.type !== 'auth') return;
    dropSession();
    show('login', { canClose: hasLocalData() });
    renderSync();
    return;
  }
  saveSession(storage, fresh);
  await enter(fresh);
};

// The start (ACC-1). A saved session opens the list at once, online or not (ACC-6).
export const startAccount = () => {
  if (!syncer) return;
  const session = sessionNow();
  const route = routeAtStart({ session, hasLocalData: hasLocalData() });
  if (route === 'login' || route === 'waiting') show(route);
  else if (route === 'list' && loginPending(session)) {
    // A login that stopped at the question of ACC-8 asks it again.
    resumeLogin(session);
  } else if (route === 'list') runAndConnect();
  renderSync();
};

// SYNC-3 and SYNC-11: a sync at the `online` event; the note while offline.
export const goOnline = () => {
  offline = false;
  renderSync();
  if (!syncer || screen) return;
  const session = sessionNow();
  if (loginPending(session)) resumeLogin(session);
  else runAndConnect();
};

export const goOffline = () => {
  offline = true;
  disconnect();
  renderSync();
};

export const isAccountOpen = () => screen !== null;

// The screen can close back to the list, so it is a layer of the back of the phone (NAV-25).
export const accountClosable = () => screen !== null && closable;

// Volver a la lista, and Escape: only a device with a list goes back to it.
export const closeAccount = () => {
  if (closable) close();
};

export const renderAccount = (route = screen) => {
  $('auth').hidden = route === null;
  for (const name of SCREENS) $(name).hidden = name !== route;
  $('account-back').hidden = !closable;
  if (route) $('auth').setAttribute('aria-labelledby', `${route}-title`);
};

const lastSyncText = () => {
  if (!status.lastSync) return t('sync.never');
  const time = new Date(status.lastSync).toLocaleString(intlTag(lang), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return t('sync.lastSync', { time });
};

// The offline note (SYNC-11), the banner (ACC-11) and the row Cuenta (ACC-10).
export const renderSync = () => {
  $('account-group').hidden = !syncer;
  if (!syncer) return;
  const session = sessionNow();
  $('sync-offline').hidden = !session || ui.view === 'settings' || !(offline || !status.online);
  // ACC-7: after an auth stop the banner stays, so that a dismissed Iniciar sesión can open again.
  $('sync-banner').hidden = !inList() || (session !== null ? !status.auth : !hasLocalData());
  $('account-row').hidden = !session;
  $('logout').hidden = !session;
  $('account-login').hidden = session !== null && !status.auth;
  $('account-email').textContent = session ? session.user.email || session.user.name : '';
  $('account-sync').textContent = session ? lastSyncText() : '';
};

export const bind = () => {
  if (!syncer) return;
  status = syncer.status();
  $('login').addEventListener('submit', (event) => {
    event.preventDefault();
    submitLogin();
  });
  $('request').addEventListener('submit', (event) => {
    event.preventDefault();
    submitRequest();
  });
  $('login-forgot').addEventListener('click', forgot);
  $('to-request').addEventListener('click', () => {
    showError('request', null);
    show('request', { canClose: closable });
  });
  $('to-login').addEventListener('click', () => {
    showError('login', null);
    show('login', { canClose: closable });
  });
  for (const name of ['login', 'request']) $(name).querySelector('[data-google]').addEventListener('click', () => google(name));
  $('waiting-check').addEventListener('click', checkAgain);
  $('waiting-logout').addEventListener('click', leaveWaiting);
  $('account-back').addEventListener('click', closeAccount);
  const openLogin = () => {
    showError('login', null);
    show('login', { canClose: true });
  };
  $('sync-login').addEventListener('click', openLogin);
  $('account-login').addEventListener('click', openLogin);
  $('logout').addEventListener('click', logout);
};
