// The move from the old address to the new one (ADDR-1 to ADDR-5): which origin this is, the
// backup packed into a URL fragment, and what the button does for each kind of user.
import { importJson } from '#storage';

export const OLD_HOST = 'polaris-works.github.io';
export const NEW_ORIGIN = 'https://bodega.artisandevs.duckdns.org';
// The whole `#import=…`, in characters. Chrome takes URLs of 2 MB; this leaves room.
export const MAX_HASH = 1_000_000;

const PREFIX = '#import=';
const NOT_BACKUP = { error: { key: 'error.notBackup' } };

export const isOldOrigin = (hostname) => hostname === OLD_HOST;

const pipe = async (bytes, stream) =>
  new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

// In chunks: one `String.fromCharCode(...bytes)` of a large backup overflows the call stack.
const toBase64url = (bytes) => {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
};

const fromBase64url = (text) => {
  if (!/^[\w-]+$/.test(text)) throw new Error('not base64url');
  const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

export const encodeMove = async (json) =>
  PREFIX + toBase64url(await pipe(new TextEncoder().encode(json), new CompressionStream('deflate-raw')));

// null: the hash is no move. Else the result of Import (BACKUP rules), or not a backup.
export const decodeMove = async (hash) => {
  if (!hash.startsWith(PREFIX)) return null;
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(await pipe(fromBase64url(hash.slice(PREFIX.length)), new DecompressionStream('deflate-raw')));
  } catch {
    return NOT_BACKUP;
  }
  return importJson(text);
};

export const moveUrl = (hash, search) => (hash.length > MAX_HASH ? null : `${NEW_ORIGIN}/${search}${hash}`);

// ADDR-2: a session never travels in a URL. A signed-in user sends the queue, then signs in again.
export const moveMode = ({ signedIn, queued, online }) => {
  if (!signedIn) return 'carry';
  if (queued === 0) return 'go';
  return online ? 'sync' : 'wait';
};
