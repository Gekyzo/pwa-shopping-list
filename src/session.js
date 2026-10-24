import { SESSION_KEY, SYNC_KEY, QUEUE_KEY, BEFORE_LOGIN_KEY, STORAGE_KEY } from '#storage';

export { SESSION_KEY, SYNC_KEY, QUEUE_KEY, BEFORE_LOGIN_KEY, STORAGE_KEY };

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
    [SESSION_KEY, SYNC_KEY, QUEUE_KEY, BEFORE_LOGIN_KEY, STORAGE_KEY].forEach((key) => storage.removeItem(key));
    return true;
  } catch {
    return false;
  }
};

const emptySyncState = () => ({ owner: null, cursor: '', server: new Map(), local: new Map(), ids: new Map() });

const MAPS = ['server', 'local', 'ids'];

// The maps are stored as arrays of entries (SYNC-2, SYNC-4). A bad value gives the empty state.
export const loadSyncState = (storage) => {
  const data = read(storage, SYNC_KEY);
  const valid =
    isObject(data) &&
    (data.owner === null || typeof data.owner === 'string') &&
    typeof data.cursor === 'string' &&
    MAPS.every((name) => Array.isArray(data[name]) && data[name].every((entry) => Array.isArray(entry) && entry.length === 2));
  if (!valid) return emptySyncState();
  return { owner: data.owner, cursor: data.cursor, ...Object.fromEntries(MAPS.map((name) => [name, new Map(data[name])])) };
};

export const saveSyncState = (storage, state) =>
  write(storage, SYNC_KEY, {
    owner: state.owner,
    cursor: state.cursor,
    ...Object.fromEntries(MAPS.map((name) => [name, [...state[name]]])),
  });

export const loadQueue = (storage) => {
  const queue = read(storage, QUEUE_KEY);
  return Array.isArray(queue) ? queue : [];
};

export const saveQueue = (storage, queue) => write(storage, QUEUE_KEY, queue);

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
