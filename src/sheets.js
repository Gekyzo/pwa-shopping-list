// The rules of a sheet that need no page: when a field shows Guardado, and for how long.

// The time that Guardado shows in the foot of a sheet after a save.
export const SAVED_MS = 1200;

// True when a write of a field saved a new value: no error, and the stored value `after` differs
// from `before` by more than the spaces at its ends. A value that is gone after the write is no save.
export const savedChange = (before, after, error) =>
  !error && typeof after === 'string' && after.trim() !== String(before ?? '').trim();

// True when the operation `result` of a sheet saves a change: no error, and a new state object.
// An operation that changes nothing returns the same state (ENG-3).
export const changedState = (before, result) => !result.error && result.state !== before;
