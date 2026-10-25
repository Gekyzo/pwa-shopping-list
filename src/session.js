import {
  SESSION_KEY, SYNC_KEY, QUEUE_KEY, BEFORE_LOGIN_KEY, STORAGE_KEY,
  SHARED_STORAGE_KEY, SHARED_SYNC_KEY, SHARED_QUEUE_KEY, normalizeState,
} from '#storage';

export { SESSION_KEY, SYNC_KEY, QUEUE_KEY, BEFORE_LOGIN_KEY, STORAGE_KEY, SHARED_STORAGE_KEY, SHARED_SYNC_KEY, SHARED_QUEUE_KEY };

// SHARE-12: the own lane and the shared lane keep a sync state and a queue each.
const KEYS = {
  own: { sync: SYNC_KEY, queue: QUEUE_KEY },
  shared: { sync: SHARED_SYNC_KEY, queue: SHARED_QUEUE_KEY },
};

const isObject = (value) => typeof value === 'object' && value !== null;

const read = (storage, key) => {
  try {
    const text = storage.getItem(key);
    return text === null ? null : JSON.parse(text);
  } catch {
    return null;
  }
};

const write = (storage, key, value) => {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

// The saved session, or null when there is none or the value is not one (ACC-6).
export const loadSession = (storage) => {
  const session = read(storage, SESSION_KEY);
  const valid = isObject(session) && typeof session.token === 'string' && isObject(session.user) && typeof session.user.id === 'string';
  return valid ? session : null;
};

export const saveSession = (storage, session) => write(storage, SESSION_KEY, session);

// Removes the account keys and the list, and nothing else: the preferences of the device stay (ACC-8, ACC-9).
export const clearAccountData = (storage) => {
  try {
    [SESSION_KEY, SYNC_KEY, QUEUE_KEY, BEFORE_LOGIN_KEY, STORAGE_KEY, SHARED_STORAGE_KEY, SHARED_SYNC_KEY, SHARED_QUEUE_KEY].forEach((key) => storage.removeItem(key));
    return true;
  } catch {
    return false;
  }
};

const emptySyncState = () => ({ owner: null, space: null, shares: [], cursor: '', server: new Map(), local: new Map(), ids: new Map() });

const MAPS = ['server', 'local', 'ids'];

const SHARE_FIELDS = ['id', 'owner', 'email', 'ownerEmail', 'member'];

const SCOPES = ['list', 'all'];

// SHARE-11: a share of v1.5.0 has no `ownerName`, `scope` or `cancelled`: they get their defaults.
const isShare = (share) =>
  isObject(share) &&
  SHARE_FIELDS.every((field) => typeof share[field] === 'string') &&
  (share.ownerName === undefined || typeof share.ownerName === 'string') &&
  (share.scope === undefined || SCOPES.includes(share.scope)) &&
  (share.cancelled === undefined || typeof share.cancelled === 'boolean');

const withDefaults = (share) => ({ ...share, ownerName: share.ownerName ?? '', scope: share.scope ?? 'all', cancelled: share.cancelled ?? false });

// SHARE-12: the state of the shared lane is a plain state. Absent or not valid gives null.
export const loadSharedState = (storage) => normalizeState(read(storage, SHARED_STORAGE_KEY));

export const saveSharedState = (storage, state) => {
  try {
    if (state === null) storage.removeItem(SHARED_STORAGE_KEY);
    else storage.setItem(SHARED_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
};

// The maps are stored as arrays of entries (SYNC-2, SYNC-4). A bad value gives the empty state.
export const loadSyncState = (storage, lane = 'own') => {
  const data = read(storage, KEYS[lane].sync);
  const valid =
    isObject(data) &&
    (data.owner === null || typeof data.owner === 'string') &&
    (data.space === undefined || data.space === null || typeof data.space === 'string') &&
    typeof data.cursor === 'string' &&
    MAPS.every((name) => Array.isArray(data[name]) && data[name].every((entry) => Array.isArray(entry) && entry.length === 2));
  if (!valid) return emptySyncState();
  return {
    owner: data.owner,
    // SHARE-6: the space of the stored data. A state of v1.4 has none: its data is the own space.
    space: typeof data.space === 'string' ? data.space : data.owner,
    shares: Array.isArray(data.shares) && data.shares.every(isShare) ? data.shares.map(withDefaults) : [],
    cursor: data.cursor,
    ...Object.fromEntries(MAPS.map((name) => [name, new Map(data[name])])),
    // The time of the last sync, for the row Cuenta (ACC-10). Absent until a first sync.
    ...(typeof data.lastSync === 'string' ? { lastSync: data.lastSync } : {}),
    // SHARE-12: the scope of the share that the shared lane syncs.
    ...(lane === 'shared' ? { scope: SCOPES.includes(data.scope) ? data.scope : 'all' } : {}),
  };
};

export const saveSyncState = (storage, state, lane = 'own') =>
  write(storage, KEYS[lane].sync, {
    owner: state.owner,
    space: state.space ?? state.owner,
    shares: state.shares ?? [],
    cursor: state.cursor,
    ...Object.fromEntries(MAPS.map((name) => [name, [...state[name]]])),
    lastSync: state.lastSync ?? null,
    ...(lane === 'shared' ? { scope: state.scope ?? 'all' } : {}),
  });

export const loadQueue = (storage, lane = 'own') => {
  const queue = read(storage, KEYS[lane].queue);
  return Array.isArray(queue) ? queue : [];
};

export const saveQueue = (storage, queue, lane = 'own') => write(storage, KEYS[lane].queue, queue);

const MARGIN = 60_000;

// True when the `exp` claim of the token is within 60 s of `now` (ms), or the token cannot be read (ACC-7).
export const tokenExpired = (token, now) => {
  try {
    const payload = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    const { exp } = JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    return typeof exp !== 'number' || exp * 1000 - MARGIN <= now;
  } catch {
    return true;
  }
};

// Where the start goes (ACC-1). It never reads the clock: a saved session opens the list at once (ACC-6).
export const routeAtStart = ({ session, hasLocalData }) => {
  if (session) return session.user.approved ? 'list' : 'waiting';
  return hasLocalData ? 'banner' : 'login';
};

// What a login does with the local data (ACC-8).
export const accountChange = ({ previousOwner, userId, queueLength }) => {
  if (previousOwner === null || previousOwner === userId) return 'continue';
  return queueLength > 0 ? 'ask-export' : 'clear';
};

// What the first login does with the local list (SYNC-8).
export const firstLogin = ({ previousOwner, serverCount, hasLocalData }) => {
  if (previousOwner !== null || !hasLocalData) return 'none';
  return serverCount === 0 ? 'upload' : 'take-account';
};
