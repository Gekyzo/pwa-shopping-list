// The version of a deploy: `{ build, date }`, read from `version.json`.

// Returns the version in `data`, or null when the data is not a version.
export const parseVersion = (data) => {
  if (!data || typeof data !== 'object') return null;
  const { build, date } = data;
  if (!Number.isInteger(build) || build < 1) return null;
  if (typeof date !== 'string' || Number.isNaN(Date.parse(date))) return null;
  return { build, date };
};

// Compares the running version with the deployed one: 'current', 'outdated' or 'unknown'.
export const versionStatus = (running, latest) => {
  if (!running || !latest) return 'unknown';
  return latest.build > running.build ? 'outdated' : 'current';
};

export const nextVersion = (current, now) => ({
  build: current ? current.build + 1 : 1,
  date: now.toISOString(),
});
