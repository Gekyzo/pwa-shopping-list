// Two copies of the app for a local test of a feature between two people (a share): user A on
// http://localhost:8081 and user B on http://localhost:8082. Each origin has its own storage, so
// one browser holds two sessions. Both use the PocketBase of the local stack of `pwa-server`
// (ACC-12), where this script creates the two users and approves their access to the shopping app.
// No dependencies.
//
//   npm run pair [-- --reset] [-- --open]
//
// The app signs in with Google only, so the script signs each user in itself and writes the page
// .pair/<user>.html: opened on the origin of the user, it stores the session and opens the app.
// --reset deletes the two users first, with their records and shares (a cascade delete).
// --open opens the two login pages in the browser.
// PAIR_SU_EMAIL and PAIR_SU_PASSWORD override the superuser of `pwa-server/dev.env`.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { SESSION_KEY } from '../src/storage.js';

export const API = 'http://localhost:8090';
export const MAILPIT = 'http://localhost:8025';
export const PASSWORD = 'devpassword123';
export const USERS = [
  { name: 'A', email: 'usera@example.test', port: 8081 },
  { name: 'B', email: 'userb@example.test', port: 8082 },
];

export const originOf = (user) => `http://localhost:${user.port}`;

export const PAIR_DIR = '.pair';
export const loginUrl = (user) => `${originOf(user)}/${PAIR_DIR}/${user.name.toLowerCase()}.html`;

export const parseArgs = (argv) => {
  const known = new Set(['--reset', '--open']);
  const unknown = argv.filter((arg) => !known.has(arg));
  if (unknown.length > 0) throw new Error(`pair: unknown option ${unknown.join(' ')}`);
  return { reset: argv.includes('--reset'), open: argv.includes('--open') };
};

// True when PocketBase answers a request of `origin` with that origin, or with any origin.
export const allowsOrigin = (header, origin) => header === '*' || header === origin;

// The body that creates a user of the pair: verified, so it logs in at once. Its access is a row
// of its own (ACC-4), which `approve` writes.
export const userBody = (user) => ({
  email: user.email,
  name: `User ${user.name}`,
  password: PASSWORD,
  passwordConfirm: PASSWORD,
  verified: true,
});

// The session that the app stores (ACC-6): both users are approved.
export const pairSession = ({ token, record }) => ({
  token,
  user: { id: record.id, email: record.email, name: record.name ?? '', approved: true },
});

// The session as a string literal of a script: `<` escaped, so no text of it can close the tag.
export const loginPage = (session) => {
  const literal = JSON.stringify(JSON.stringify(session)).replaceAll('<', '\\u003c');
  return `<!doctype html>
<meta charset="utf-8">
<title>Pair login</title>
<script>
localStorage.setItem(${JSON.stringify(SESSION_KEY)}, ${literal});
location.replace('/');
</script>
`;
};

export const summary = (users) => [
  ...users.map((user) => `User ${user.name}: ${loginUrl(user)}  ${user.email} / ${PASSWORD}`),
  `Mailpit (invite emails): ${MAILPIT}`,
  'Ctrl-C stops the two servers.',
].join('\n');

const call = async (method, path, { token, body } = {}) => {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: token } : {}) },
    body: body && JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`pair: ${method} ${path} answered ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
};

const checkServer = async () => {
  try {
    await call('GET', '/api/health');
  } catch {
    throw new Error(`pair: no PocketBase at ${API}. Start the local stack of pwa-server (RUNBOOK.md, "Local run").`);
  }
  for (const user of USERS) {
    const response = await fetch(`${API}/api/health`, { headers: { origin: originOf(user) } });
    if (!allowsOrigin(response.headers.get('access-control-allow-origin'), originOf(user))) {
      throw new Error(`pair: PocketBase refuses ${originOf(user)}. Add it to PB_ORIGINS of pwa-server/dev.env, then recreate the pocketbase container.`);
    }
  }
};

const superuserToken = async () => {
  const identity = process.env.PAIR_SU_EMAIL ?? 'admin@example.test';
  const password = process.env.PAIR_SU_PASSWORD ?? 'devpassword123';
  try {
    return (await call('POST', '/api/collections/_superusers/auth-with-password', { body: { identity, password } })).token;
  } catch {
    throw new Error(`pair: the superuser ${identity} cannot log in. Create it as RUNBOOK.md of pwa-server says ("Dev superuser").`);
  }
};

const findUser = async (token, email) => {
  const filter = encodeURIComponent(`email="${email}"`);
  return (await call('GET', `/api/collections/users/records?filter=${filter}`, { token })).items[0] ?? null;
};

// An approved access row of the shopping app for the user: an update of the row, or a new one.
const approve = async (token, userId) => {
  const app = (await call('GET', `/api/collections/apps/records?filter=${encodeURIComponent('slug="shopping"')}`, { token })).items[0];
  if (!app) throw new Error('pair: the server has no shopping app. Run the migrations of pwa-server (migration 5).');
  const filter = encodeURIComponent(`user="${userId}" && app="${app.id}"`);
  const row = (await call('GET', `/api/collections/app_access/records?filter=${filter}`, { token })).items[0];
  if (row?.status === 'approved') return;
  if (row) await call('PATCH', `/api/collections/app_access/records/${row.id}`, { token, body: { status: 'approved' } });
  else await call('POST', '/api/collections/app_access/records', { token, body: { user: userId, app: app.id, status: 'approved' } });
};

// Creates each missing user; with `reset`, deletes it first. An existing user keeps its data.
const prepareUsers = async (token, { reset }) => {
  for (const user of USERS) {
    let found = await findUser(token, user.email);
    if (found && reset) {
      await call('DELETE', `/api/collections/users/records/${found.id}`, { token });
      found = null;
    }
    if (!found) found = await call('POST', '/api/collections/users/records', { token, body: userBody(user) });
    await approve(token, found.id);
  }
};

const root = fileURLToPath(new URL('..', import.meta.url));

// The app has no password login: each user signs in here, and its page carries the session.
const writeLoginPages = async () => {
  mkdirSync(`${root}/${PAIR_DIR}`, { recursive: true });
  for (const user of USERS) {
    const auth = await call('POST', '/api/collections/users/auth-with-password', { body: { identity: user.email, password: PASSWORD } });
    writeFileSync(`${root}/${PAIR_DIR}/${user.name.toLowerCase()}.html`, loginPage(pairSession(auth)));
  }
};

const serve = (user) => spawn('python3', ['-m', 'http.server', String(user.port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' });

// Windows Chrome from WSL when the helper exists, else the browser of the desktop.
const open = (urls) => {
  const helper = `${homedir()}/.claude/scripts/open-in-chrome.sh`;
  const [command, args] = existsSync(helper) ? [helper, urls] : ['xdg-open', urls.slice(0, 1)];
  spawn(command, args, { stdio: 'ignore', detached: true }).unref();
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  await checkServer();
  await prepareUsers(await superuserToken(), options);
  await writeLoginPages();
  const servers = USERS.map(serve);
  const stop = () => {
    servers.forEach((server) => server.kill());
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  servers.forEach((server, index) => server.on('exit', (code) => {
    if (code) console.error(`pair: the server of user ${USERS[index].name} stopped (port ${USERS[index].port} in use?)`);
  }));
  console.log(summary(USERS));
  if (options.open) open(USERS.map(loginUrl));
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
