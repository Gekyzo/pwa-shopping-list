// The queue of record changes, the merge of pulled records and the duplicates (SYNC-5, SYNC-6, SYNC-7).
// Pure: no storage, no clock, no DOM. Every function returns new values and leaves its inputs alone.
import { recordKey } from '#records';

const changeKey = (change) => recordKey(change.kind, change.key);

// One entry for each record: a later change replaces an earlier one and moves to the end.
export const enqueue = (queue, changes) => {
  const latest = new Map();
  for (const change of [...queue, ...changes]) {
    latest.delete(changeKey(change));
    latest.set(changeKey(change), change);
  }
  return [...latest.values()];
};

const plain = ({ kind, key, data }) => ({ kind, key, data });

// SYNC-5: a queued change wins over a pulled record. SYNC-6: a pulled record with `deleted` removes the record.
export const mergePulled = ({ local, server, queue, pulled }) => {
  const queued = new Set(queue.map(changeKey));
  const nextLocal = new Map(local);
  const nextServer = new Map(server);
  for (const rec of pulled) {
    const id = recordKey(rec.kind, rec.key);
    nextServer.set(id, rec);
    if (queued.has(id)) continue;
    if (rec.deleted) nextLocal.delete(id);
    else nextLocal.set(id, plain(rec));
  }
  return { local: nextLocal, server: nextServer };
};

// The same comparison as the validation of `normalizeState` (STORE-6).
const nameOf = (rec) => rec.data.name.toLowerCase();

// A record that is not on the server yet counts as the newest. Equal ages: the greater record key wins.
const newer = (a, b, server) => {
  const ageA = server.get(recordKey(a.kind, a.key))?.updated ?? '￿';
  const ageB = server.get(recordKey(b.kind, b.key))?.updated ?? '￿';
  if (ageA !== ageB) return ageA > ageB ? a : b;
  return recordKey(a.kind, a.key) > recordKey(b.kind, b.key) ? a : b;
};

// SYNC-7: of two records of one kind with one name the newer stays; `removed` holds a delete for each loser.
export const dedupe = (local, server) => {
  const nextLocal = new Map(local);
  const removed = [];
  for (const kind of ['item', 'recipe']) {
    const winners = new Map();
    for (const rec of [...local.values()].filter((r) => r.kind === kind)) {
      const name = nameOf(rec);
      const other = winners.get(name);
      const winner = other ? newer(other, rec, server) : rec;
      if (other) {
        const loser = winner === rec ? other : rec;
        nextLocal.delete(recordKey(kind, loser.key));
        removed.push({ kind, key: loser.key, op: 'delete' });
      }
      winners.set(name, winner);
    }
  }
  return { local: nextLocal, removed };
};

export const cursorOf = (pulled, previous) =>
  pulled.reduce((greatest, rec) => (rec.updated > greatest ? rec.updated : greatest), previous);
