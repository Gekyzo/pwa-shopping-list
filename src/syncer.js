// The sync driver: it queues each save, sends the queue, pulls the account and merges it into the state
// (SYNC-2 to SYNC-9), and runs the login and the logout of the account (ACC-4, ACC-7 to ACC-9).
// The client, the storage, the clock and the timer are injected, so a test runs with no network.
import { toRecords, fromRecords, diffRecords, recordKey } from '#records';
import { enqueue, mergePulled, dedupe, cursorOf } from '#sync';
import {
  loadSession, saveSession, clearAccountData, loadSyncState, saveSyncState, loadQueue, saveQueue,
  tokenExpired, accountChange, firstLogin, BEFORE_LOGIN_KEY, SESSION_KEY,
} from '#session';
import { normalizeState } from '#storage';
import { emptyState } from '#store';

// SYNC-3: a save starts a sync after this delay; a new save in that time starts the delay again.
const DEBOUNCE_MS = 1500;
// ACC-7: a token is refreshed at least this often, so that a lost approval stops the sync.
const REFRESH_MS = 10 * 60_000;

const emptySync = () => ({ owner: null, cursor: '', server: new Map(), local: new Map(), ids: new Map() });

// Why a request failed, as the result of the run. PocketBase answers a refused rule with a 400 and no
// field error (a token that is not valid counts as a guest), so that is an auth error too.
const stopOf = (error) => {
  if (error?.type === 'auth') return 'auth';
  if (error?.type === 'invalid' && Object.keys(error.fields ?? {}).length === 0) return 'auth';
  return 'offline';
};

const badData = (error) => error?.type === 'invalid' && Object.keys(error.fields ?? {}).length > 0;

const plain = ({ kind, key, data }) => ({ kind, key, data });

const hasData = (state) => diffRecords(toRecords(emptyState()), toRecords(state)).length > 0;

export const createSyncer = ({
  client,
  storage,
  getState,
  setState,
  now = Date.now,
  onStatus = () => {},
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) => {
  let sync = loadSyncState(storage);
  let queue = loadQueue(storage);
  let online = true;
  let lastRefresh = null;
  let running = null;
  let timer = null;

  const status = () => ({ online, pending: queue.length, lastSync: sync.lastSync ?? null });
  const report = () => onStatus(status());
  const persist = () => {
    saveQueue(storage, queue);
    saveSyncState(storage, sync);
  };

  // The run only syncs for the user that a finished login made the owner of the stored data.
  const activeSession = () => {
    const session = loadSession(storage);
    return session && session.user.approved === true && sync.owner === session.user.id ? session : null;
  };

  // ACC-7: refresh an expired token, and any token after REFRESH_MS. The answer carries `approved`.
  // Resolves to a token, or to the result of the run when there is none to use.
  const freshToken = async (session) => {
    if (!tokenExpired(session.token, now()) && lastRefresh !== null && now() - lastRefresh <= REFRESH_MS) return { token: session.token };
    let fresh;
    try {
      fresh = await client.refresh(session.token);
    } catch (error) {
      return { stop: error?.type === 'auth' ? 'auth' : 'offline' };
    }
    lastRefresh = now();
    saveSession(storage, fresh);
    // ACC-4: an account that is no longer approved makes no request for data.
    return fresh.user.approved === true ? { token: fresh.token } : { stop: 'ok' };
  };

  // SYNC-4: each change in order. A change leaves the queue only after the server took it, and the queue
  // is saved at once, so a run that stops resends nothing as a new record.
  const pushAll = async (token) => {
    for (let change = queue[0]; change; change = queue[0]) {
      let rec;
      try {
        rec = await client.push(token, change, sync.ids);
      } catch (error) {
        if (!badData(error)) return stopOf(error);
        // The server refuses this data (`rec` stays undefined): the change stays local and the next
        // changes go on.
      }
      const id = recordKey(change.kind, change.key);
      const server = new Map(sync.server);
      const ids = new Map(sync.ids);
      if (rec) {
        server.set(id, rec);
        ids.set(id, rec.id);
      } else if (rec === null) {
        // SYNC-6: a delete of a record that the server does not hold.
        server.delete(id);
        ids.delete(id);
      }
      sync = { ...sync, server, ids };
      // By identity: a save during the push may have replaced the change with a newer one.
      queue = queue.filter((queued) => queued !== change);
      persist();
    }
    return null;
  };

  // SYNC-4 to SYNC-7: the pulled records go into the state; a queued change wins.
  const merge = (pulled) => {
    const merged = mergePulled({ local: sync.local, server: sync.server, queue, pulled });
    const ids = new Map(sync.ids);
    for (const rec of pulled) ids.set(recordKey(rec.kind, rec.key), rec.id);
    const deduped = dedupe(merged.local, merged.server);
    queue = enqueue(queue, deduped.removed);
    // SYNC-7: the merge never gives a state that the validation refuses; then the state stays.
    const previous = getState();
    const next = normalizeState(fromRecords(deduped.local)) ?? previous;
    const nextRecords = toRecords(next);
    if (next !== previous && diffRecords(toRecords(previous), nextRecords).length > 0) setState(next);
    // The validation can drop a meal or a `sent` id of a removed recipe: the server gets that too.
    queue = enqueue(queue, diffRecords(deduped.local, nextRecords));
    sync = { ...sync, server: merged.server, ids, local: nextRecords, cursor: cursorOf(pulled, sync.cursor) };
  };

  const syncOnce = async () => {
    const session = activeSession();
    if (!session) return 'ok';
    const { token, stop } = await freshToken(session);
    if (stop) return stop;
    const stopped = await pushAll(token);
    if (stopped) return stopped;
    let pulled;
    try {
      pulled = await client.pull(token, sync.cursor);
    } catch (error) {
      return stopOf(error);
    }
    merge(pulled);
    sync = { ...sync, lastSync: new Date(now()).toISOString() };
    persist();
    return 'ok';
  };

  // A run while one is in progress gets the promise of that run.
  const run = () => {
    running ??= (async () => {
      try {
        const result = await syncOnce();
        // SYNC-11: only a stop at the network or at a server error counts as offline.
        online = result !== 'offline';
        // The merge can queue a tombstone (SYNC-7) or a fix of the validation: a sync soon sends it.
        if (result === 'ok' && queue.length > 0 && activeSession()) schedule();
        report();
        return result;
      } finally {
        running = null;
      }
    })();
    return running;
  };

  const schedule = () => {
    if (timer !== null) clearTimer(timer);
    timer = setTimer(() => {
      timer = null;
      return run();
    }, DEBOUNCE_MS);
  };

  // SYNC-2: the changes of a save against the last state that the syncer knows. The syncer never calls it
  // for its own setState. A device with no account keeps no queue.
  const notify = (state) => {
    if (!activeSession()) return;
    const records = toRecords(state);
    queue = enqueue(queue, diffRecords(sync.local, records));
    sync = { ...sync, local: records };
    persist();
    report();
    schedule();
  };

  const reset = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
    sync = emptySync();
    queue = [];
    lastRefresh = null;
    clearAccountData(storage);
    setState(emptyState());
  };

  // ACC-8, SYNC-8. With `discard` the user has exported, or declined, the queue of the previous user.
  // A failed pull of the first login throws, and removes the session, so that the login can start again.
  const login = async (session, { discard = false } = {}) => {
    saveSession(storage, session);
    lastRefresh = now();
    // ACC-4: no request for data, and the local list stays as it is.
    if (session.user.approved !== true) return 'waiting';
    const userId = session.user.id;
    let change = accountChange({ previousOwner: sync.owner, userId, queueLength: queue.length });
    // A queue with no owner is the queue of an unknown user.
    if (sync.owner === null && queue.length > 0) change = 'ask-export';
    if (change === 'ask-export' && !discard) return 'ask-export';
    if (change !== 'continue') {
      reset();
      saveSession(storage, session);
      lastRefresh = now();
    }
    const state = getState();
    const previousOwner = sync.owner;
    const hasLocalData = hasData(state);
    if (previousOwner === null && hasLocalData) {
      let pulled;
      try {
        pulled = await client.pull(session.token, '');
      } catch (error) {
        storage.removeItem(SESSION_KEY);
        throw error;
      }
      const live = pulled.filter((rec) => !rec.deleted);
      const plan = firstLogin({ previousOwner, serverCount: live.length, hasLocalData });
      if (plan === 'upload') {
        const records = toRecords(state);
        queue = enqueue(queue, diffRecords(new Map(), records));
        sync = { ...sync, local: records };
      } else if (plan === 'take-account') {
        try {
          storage.setItem(BEFORE_LOGIN_KEY, JSON.stringify(state));
        } catch {
          // Storage is full or not available: the account list still replaces the local one.
        }
        const local = new Map(live.map((rec) => [recordKey(rec.kind, rec.key), plain(rec)]));
        const server = new Map(pulled.map((rec) => [recordKey(rec.kind, rec.key), rec]));
        const ids = new Map(pulled.map((rec) => [recordKey(rec.kind, rec.key), rec.id]));
        sync = { ...sync, local, server, ids, cursor: cursorOf(pulled, '') };
        setState(normalizeState(fromRecords(local)) ?? emptyState());
      }
    }
    sync = { ...sync, owner: userId };
    persist();
    await run();
    return 'synced';
  };

  // ACC-9: online, the queue goes first. Changes that are still not sent need an export first.
  const logout = async ({ online: isOnline, discard = false }) => {
    if (isOnline) await run();
    if (queue.length > 0 && !discard) return 'ask-export';
    reset();
    online = true;
    report();
    return 'done';
  };

  return { notify, run, login, logout, status };
};
