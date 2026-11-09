// Fakes that several tests share. Not a test file: `node --test` runs only `*.test.js`.

// A `localStorage` in memory, with `length` and `key` for the code that walks the keys, and
// `keys()` for a test that reads them all.
export const fakeStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    get length() {
      return data.size;
    },
    key: (index) => [...data.keys()][index] ?? null,
    keys: () => [...data.keys()],
  };
};

// A storage that the browser denies: each access throws.
export const brokenStorage = () => {
  const deny = () => {
    throw new Error('denied');
  };
  return {
    getItem: deny,
    setItem: deny,
    removeItem: deny,
    get length() {
      return deny();
    },
    key: deny,
  };
};
