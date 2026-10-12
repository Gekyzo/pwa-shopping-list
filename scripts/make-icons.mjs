// Writes the PNG icons of the PWA. No dependencies: the PNG encoder uses node:zlib only.
// Run: npm run icons
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const GREEN = [31, 122, 77];
const WHITE = [255, 255, 255];
const SAMPLES = 4;

// Check mark as two segments, in coordinates of a 0..1 square.
const MARK = [
  [[0.27, 0.53], [0.43, 0.69]],
  [[0.43, 0.69], [0.74, 0.35]],
];
const MARK_HALF_WIDTH = 0.055;

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
};

const encodePng = (size, rgba) => {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8); // 8 bits, RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

const distanceToSegment = (px, py, [[ax, ay], [bx, by]]) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

const insideRoundedSquare = (x, y, radius) => {
  const cx = Math.max(radius, Math.min(1 - radius, x));
  const cy = Math.max(radius, Math.min(1 - radius, y));
  return Math.hypot(x - cx, y - cy) <= radius;
};

// `radius` rounds the background; `scale` shrinks the mark into the maskable safe zone.
const drawIcon = (size, { radius, scale }) => {
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let alpha = 0;
      let white = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const u = (x + (sx + 0.5) / SAMPLES) / size;
          const v = (y + (sy + 0.5) / SAMPLES) / size;
          if (!insideRoundedSquare(u, v, radius)) continue;
          alpha++;
          const mu = (u - 0.5) / scale + 0.5;
          const mv = (v - 0.5) / scale + 0.5;
          if (MARK.some((segment) => distanceToSegment(mu, mv, segment) <= MARK_HALF_WIDTH)) white++;
        }
      }
      const mix = alpha ? white / alpha : 0;
      const offset = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) rgba[offset + c] = Math.round(GREEN[c] + (WHITE[c] - GREEN[c]) * mix);
      rgba[offset + 3] = Math.round((alpha / SAMPLES ** 2) * 255);
    }
  }
  return encodePng(size, rgba);
};

const outDir = new URL('../icons/', import.meta.url);
mkdirSync(outDir, { recursive: true });

const ICONS = [
  ['icon-192.png', 192, { radius: 0.22, scale: 1 }],
  ['icon-512.png', 512, { radius: 0.22, scale: 1 }],
  ['icon-maskable-512.png', 512, { radius: 0, scale: 0.72 }],
];

ICONS.forEach(([name, size, options]) => {
  writeFileSync(new URL(name, outDir), drawIcon(size, options));
  console.log(`icons/${name}`);
});
