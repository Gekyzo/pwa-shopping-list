// The client of the PocketBase server (ACC-12, SYNC-4). `fetch` and `EventSource` are injected, so
// a test runs with no network. No SDK: the app calls the REST API of PocketBase directly.
import { recordKey } from '#records';

const USERS = '/api/collections/users';
const RECORDS = '/api/collections/shopping_records/records';
const SHARES = '/api/collections/shopping_shares/records';
const ACCESS = '/api/collections/app_access/records';
const APPS = '/api/collections/apps/records';
// The slug of this app on the server: one account serves every app, and access is per app.
const APP = 'shopping';
const PAGE = 500;

export class PocketBaseError extends Error {
  constructor(type, status = 0, fields = {}) {
    super(`PocketBase ${type} (${status})`);
    this.type = type;
    this.status = status;
    this.fields = fields;
  }
}

const typeOf = (status) => {
  if (status === 401 || status === 403) return 'auth';
  if (status === 400 || status === 404) return 'invalid';
  // The server limits the rate of requests: the request is fine, and it is worth a retry soon.
  if (status === 429) return 'rate';
  return 'server';
};

// PocketBase answers a duplicate (owner, kind, key) with a 400 whose field errors carry this code.
// A 400 with no field error (a refused rule) is not a duplicate.
export const isUniqueViolation = (error) =>
  error instanceof PocketBaseError &&
  error.status === 400 &&
  Object.values(error.fields).some((field) => field?.code === 'validation_not_unique');

const quoted = (text) => `"${String(text).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// `approved` is the access row of this app (ACC-4), not a field of the user.
const sessionOf = ({ token, record }, approved) => ({
  token,
  user: { id: record.id, email: record.email, name: record.name ?? '', approved },
});

const serverRecOf = ({ id, kind, key, data, deleted, updated }) => ({ id, kind, key, data, deleted: deleted === true, updated });

const shareOf = ({ id, owner, email, ownerEmail, ownerName, member, scope, cancelled }) => ({
  id, owner, email, ownerEmail: ownerEmail ?? '', ownerName: ownerName ?? '', member: member ?? '',
  scope: scope || 'all', cancelled: cancelled ?? false,
});

// SHARE-6: a member can read two spaces, so every request for records names the space.
const inSpace = (space) => {
  if (!space) throw new PocketBaseError('auth');
  return `owner = ${quoted(space)}`;
};

export const createClient = ({ url, fetch, EventSource }) => {
  const base = url.replace(/\/+$/, '');

  const call = async (method, path, { token, body, query } = {}) => {
    let response;
    try {
      response = await fetch(`${base}${path}${query ? `?${new URLSearchParams(query)}` : ''}`, {
        method,
        cache: 'no-store',
        headers: {
          ...(token ? { Authorization: token } : {}),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new PocketBaseError('network');
    }
    let json = null;
    try {
      json = await response.json();
    } catch {
      // An empty body (204) or a body that is not JSON.
    }
    if (!response.ok) throw new PocketBaseError(typeOf(response.status), response.status, json?.data ?? {});
    if (json === null && response.status !== 204) throw new PocketBaseError('server', response.status);
    return json;
  };

  const findAccess = async (token, userId) => (await call('GET', ACCESS, {
    token,
    query: { filter: `user = ${quoted(userId)} && app.slug = ${quoted(APP)}`, perPage: '1' },
  })).items[0] ?? null;

  // ACC-3: with no row, signing in asks for access with a pending row. A row made meanwhile by
  // another device (a duplicate) is read again.
  const accessOf = async (token, userId) => {
    const found = await findAccess(token, userId);
    if (found) return found.status;
    const app = (await call('GET', APPS, { token, query: { filter: `slug = ${quoted(APP)}`, perPage: '1' } })).items[0];
    if (!app) throw new PocketBaseError('invalid', 404);
    try {
      return (await call('POST', ACCESS, { token, body: { user: userId, app: app.id, status: 'pending' } })).status;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      return (await findAccess(token, userId))?.status ?? 'pending';
    }
  };

  const withAccess = async (auth) => sessionOf(auth, (await accessOf(auth.token, auth.record.id)) === 'approved');

  const authWithPassword = async (email, password) =>
    withAccess(await call('POST', `${USERS}/auth-with-password`, { body: { identity: email, password } }));

  // Both spaces of a member hold `settings:settings` and the meal keys, so the lookup names the space.
  const findRecord = async (token, { kind, key }, space) => {
    const page = await call('GET', RECORDS, {
      token,
      query: { filter: `${inSpace(space)} && kind = ${quoted(kind)} && key = ${quoted(key)}`, perPage: '1' },
    });
    return page.items[0] ? serverRecOf(page.items[0]) : null;
  };

  const patch = async (token, id, body) => serverRecOf(await call('PATCH', `${RECORDS}/${id}`, { token, body }));

  // SYNC-6: a tombstone keeps its data, so only the flag changes.
  const bodyOf = ({ op, data }) => (op === 'delete' ? { deleted: true } : { deleted: false, data });

  // SYNC-6: a delete never creates a record; with no record on the server it resolves to null.
  const patchFound = async (token, change, space) => {
    const found = await findRecord(token, change, space);
    return found ? patch(token, found.id, bodyOf(change)) : null;
  };

  // SHARE-1: a record has the owner of its space, whoever writes it.
  const create = async (token, change, space) => {
    try {
      return serverRecOf(
        await call('POST', RECORDS, { token, body: { owner: space, kind: change.kind, key: change.key, ...bodyOf(change) } }),
      );
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const found = await findRecord(token, change, space);
      if (!found) throw error;
      return patch(token, found.id, bodyOf(change));
    }
  };

  const pages = async (token, path, query, map) => {
    const all = [];
    for (let page = 1; ; page += 1) {
      const result = await call('GET', path, { token, query: { ...query, perPage: String(PAGE), page: String(page) } });
      all.push(...result.items.map(map));
      if (!(result.totalPages > page)) return all;
    }
  };

  return {
    authWithPassword,

    requestAccess: async ({ name, email, password }) => {
      await call('POST', `${USERS}/records`, { body: { email, password, passwordConfirm: password, name } });
      return authWithPassword(email, password);
    },

    oauthStart: async (redirectUrl) => {
      const methods = await call('GET', `${USERS}/auth-methods`);
      const provider = methods.oauth2?.providers?.find(({ name }) => name === 'google');
      if (!provider) throw new PocketBaseError('invalid', 404);
      return {
        url: provider.authURL + encodeURIComponent(redirectUrl),
        pending: { provider: provider.name, state: provider.state, codeVerifier: provider.codeVerifier },
      };
    },

    // The body carries no createData: access is a row of its own (ACC-3).
    oauthFinish: async ({ code, state }, pending, redirectUrl) => {
      if (state !== pending.state) throw new PocketBaseError('state');
      return withAccess(
        await call('POST', `${USERS}/auth-with-oauth2`, {
          body: { provider: pending.provider, code, codeVerifier: pending.codeVerifier, redirectURL: redirectUrl },
        }),
      );
    },

    refresh: async (token) => withAccess(await call('POST', `${USERS}/auth-refresh`, { token })),

    requestPasswordReset: async (email) => {
      await call('POST', `${USERS}/request-password-reset`, { body: { email } });
    },

    // SYNC-4: every record of the space with `updated` at or after the cursor; an empty cursor pulls
    // the whole space.
    pull: async (token, since, space) => {
      const filter = since ? `${inSpace(space)} && updated >= ${quoted(since)}` : inSpace(space);
      return pages(token, RECORDS, { filter, sort: 'updated' }, serverRecOf);
    },

    // SHARE-6: the shares where the user is the owner, the member or the invitee (the rules of the server).
    listShares: (token) => pages(token, SHARES, { sort: 'created' }, shareOf),

    // SHARE-11: the scope is `all` (the whole space) or `list` (the shared list only).
    invite: async (token, owner, email, scope = 'all') => shareOf(await call('POST', SHARES, { token, body: { owner, email, scope } })),

    // SHARE-11: the owner ends a share and keeps the row, so the person stays in the sheet as cancelled.
    cancelShare: async (token, id) => shareOf(await call('PATCH', `${SHARES}/${id}`, { token, body: { cancelled: true } })),

    setShareScope: async (token, id, scope) => shareOf(await call('PATCH', `${SHARES}/${id}`, { token, body: { scope } })),

    // SHARE-11: a new invite to a cancelled share: it is open again, with no member.
    reinvite: async (token, id) => shareOf(await call('PATCH', `${SHARES}/${id}`, { token, body: { cancelled: false, member: '' } })),

    acceptShare: async (token, id, userId) => shareOf(await call('PATCH', `${SHARES}/${id}`, { token, body: { member: userId } })),

    removeShare: async (token, id) => {
      await call('DELETE', `${SHARES}/${id}`, { token });
    },

    // `ids` is keyed by recordKey(kind, key). Resolves to the server record, or null for a delete of
    // a record that the server does not hold. A delete of a known record that the server does not
    // find throws `gone`: a token that is not valid gets the same answers, so the syncer checks the
    // token first (SYNC-6, ACC-7).
    push: async (token, change, ids, space) => {
      inSpace(space);
      const id = ids.get(recordKey(change.kind, change.key));
      if (id) {
        try {
          return await patch(token, id, bodyOf(change));
        } catch (error) {
          if (error.status !== 404) throw error;
          // The record is gone from the server: a delete has nothing left to do, an upsert creates it again.
          if (change.op === 'delete') {
            const found = await patchFound(token, change, space);
            if (found === null) throw new PocketBaseError('gone', 404);
            return found;
          }
        }
      } else if (change.op === 'delete') {
        return patchFound(token, change, space);
      }
      return create(token, change, space);
    },

    // The returned function closes the stream. A failed subscription is silent: SYNC-3 syncs at the
    // start, at `online` and after a save, so the stream only makes a sync sooner. `token` is a text or
    // a function that gives the token at each connect: the browser connects again by itself, and by
    // then the token may be a refreshed one. `onReconnect` runs at each connect after the first, since
    // the stream missed the changes of the time between (SYNC-3).
    subscribe: (token, onChange, { onReconnect = () => {} } = {}) => {
      const tokenOf = typeof token === 'function' ? token : () => token;
      const source = new EventSource(`${base}/api/realtime`);
      let connects = 0;
      source.addEventListener('PB_CONNECT', async (event) => {
        connects += 1;
        if (connects > 1) onReconnect();
        try {
          const { clientId } = JSON.parse(event.data);
          await call('POST', '/api/realtime', { token: tokenOf(), body: { clientId, subscriptions: ['shopping_records', 'shopping_shares'] } });
        } catch {
          // See above.
        }
      });
      source.addEventListener('shopping_records', (event) => {
        let rec;
        try {
          const { action, record } = JSON.parse(event.data);
          rec = serverRecOf(action === 'delete' ? { ...record, deleted: true } : record);
        } catch {
          return; // A malformed event is dropped.
        }
        onChange(rec);
      });
      // SHARE-6: a share that starts or ends changes the space to sync; the event carries no record.
      source.addEventListener('shopping_shares', () => onChange(null));
      return () => source.close();
    },
  };
};
