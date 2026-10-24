// The client of the PocketBase server (ACC-12, SYNC-4). `fetch` and `EventSource` are injected, so
// a test runs with no network. No SDK: the app calls the REST API of PocketBase directly.
import { recordKey } from '#records';

const USERS = '/api/collections/users';
const RECORDS = '/api/collections/shopping_records/records';
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
  return 'server';
};

// PocketBase answers a duplicate (owner, kind, key) with a 400 whose field errors carry this code.
// A 400 with no field error (a refused rule) is not a duplicate.
export const isUniqueViolation = (error) =>
  error instanceof PocketBaseError &&
  error.status === 400 &&
  Object.values(error.fields).some((field) => field?.code === 'validation_not_unique');

// The `id` claim of the JWT of a user token.
const userIdOf = (token) => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).id ?? '';
  } catch {
    return '';
  }
};

const quoted = (text) => `"${String(text).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const sessionOf = ({ token, record }) => ({
  token,
  user: { id: record.id, email: record.email, name: record.name ?? '', approved: record.approved === true },
});

const serverRecOf = ({ id, kind, key, data, deleted, updated }) => ({ id, kind, key, data, deleted: deleted === true, updated });

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

  const authWithPassword = async (email, password) =>
    sessionOf(await call('POST', `${USERS}/auth-with-password`, { body: { identity: email, password } }));

  const findRecord = async (token, { kind, key }) => {
    const page = await call('GET', RECORDS, {
      token,
      query: { filter: `kind = ${quoted(kind)} && key = ${quoted(key)}`, perPage: '1' },
    });
    return page.items[0] ? serverRecOf(page.items[0]) : null;
  };

  const patch = async (token, id, body) => serverRecOf(await call('PATCH', `${RECORDS}/${id}`, { token, body }));

  // SYNC-6: a tombstone keeps its data, so only the flag changes.
  const bodyOf = ({ op, data }) => (op === 'delete' ? { deleted: true } : { deleted: false, data });

  // SYNC-6: a delete never creates a record; with no record on the server it resolves to null.
  const patchFound = async (token, change) => {
    const found = await findRecord(token, change);
    return found ? patch(token, found.id, bodyOf(change)) : null;
  };

  const create = async (token, change) => {
    const owner = userIdOf(token);
    if (!owner) throw new PocketBaseError('auth');
    try {
      return serverRecOf(
        await call('POST', RECORDS, { token, body: { owner, kind: change.kind, key: change.key, ...bodyOf(change) } }),
      );
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const found = await findRecord(token, change);
      if (!found) throw error;
      return patch(token, found.id, bodyOf(change));
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

    // The server creates an OAuth account as not approved by itself: the body carries no `approved`.
    oauthFinish: async ({ code, state }, pending, redirectUrl) => {
      if (state !== pending.state) throw new PocketBaseError('state');
      return sessionOf(
        await call('POST', `${USERS}/auth-with-oauth2`, {
          body: { provider: pending.provider, code, codeVerifier: pending.codeVerifier, redirectURL: redirectUrl },
        }),
      );
    },

    refresh: async (token) => sessionOf(await call('POST', `${USERS}/auth-refresh`, { token })),

    requestPasswordReset: async (email) => {
      await call('POST', `${USERS}/request-password-reset`, { body: { email } });
    },

    // SYNC-4: every record with `updated` at or after the cursor; an empty cursor pulls everything.
    pull: async (token, since) => {
      const pulled = [];
      for (let page = 1; ; page += 1) {
        const result = await call('GET', RECORDS, {
          token,
          query: { ...(since ? { filter: `updated >= ${quoted(since)}` } : {}), sort: 'updated', perPage: String(PAGE), page: String(page) },
        });
        pulled.push(...result.items.map(serverRecOf));
        if (!(result.totalPages > page)) return pulled;
      }
    },

    // `ids` is keyed by recordKey(kind, key). Resolves to the server record, or null for a delete of
    // a record that the server does not hold. A delete of a known record that the server does not
    // find throws `gone`: a token that is not valid gets the same answers, so the syncer checks the
    // token first (SYNC-6, ACC-7).
    push: async (token, change, ids) => {
      const id = ids.get(recordKey(change.kind, change.key));
      if (id) {
        try {
          return await patch(token, id, bodyOf(change));
        } catch (error) {
          if (error.status !== 404) throw error;
          // The record is gone from the server: a delete has nothing left to do, an upsert creates it again.
          if (change.op === 'delete') {
            const found = await patchFound(token, change);
            if (found === null) throw new PocketBaseError('gone', 404);
            return found;
          }
        }
      } else if (change.op === 'delete') {
        return patchFound(token, change);
      }
      return create(token, change);
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
          await call('POST', '/api/realtime', { token: tokenOf(), body: { clientId, subscriptions: ['shopping_records'] } });
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
      return () => source.close();
    },
  };
};
