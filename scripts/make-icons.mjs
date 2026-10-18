// Writes the PNG icons of the PWA from the art of icons/source.png. No dependencies.
// Run: npm run icons
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { encodePng, decodePng, clearWhite, resizeRgba } from './png.mjs';
import { pathSegments, segmentDistance } from './glyph.mjs';

const WHITE = [255, 255, 255];
const SAMPLES = 4;

const outDir = new URL('../icons/', import.meta.url);
const art = decodePng(readFileSync(new URL('source.png', outDir)));

// Colour of the art at a point of the 0..1 square, between its four nearest pixels.
// The background of the art is white, and so is each point outside it.
const sampleArt = (u, v) => {
  if (u < 0 || u >= 1 || v < 0 || v >= 1) return WHITE;
  const x = Math.max(0, Math.min(art.width - 1, u * art.width - 0.5));
  const y = Math.max(0, Math.min(art.height - 1, v * art.height - 0.5));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(art.width - 1, x0 + 1);
  const y1 = Math.min(art.height - 1, y0 + 1);
  const pixel = (px, py, c) => art.rgba[(py * art.width + px) * 4 + c];
  return WHITE.map((_, c) => {
    const top = pixel(x0, y0, c) + (pixel(x1, y0, c) - pixel(x0, y0, c)) * (x - x0);
    const bottom = pixel(x0, y1, c) + (pixel(x1, y1, c) - pixel(x0, y1, c)) * (x - x0);
    return top + (bottom - top) * (y - y0);
  });
};

const insideRoundedSquare = (x, y, radius) => {
  const cx = Math.max(radius, Math.min(1 - radius, x));
  const cy = Math.max(radius, Math.min(1 - radius, y));
  return Math.hypot(x - cx, y - cy) <= radius;
};

// `radius` rounds the background; `scale` is the side of the art as a part of the icon.
const drawIcon = (size, { radius, scale }) => {
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let alpha = 0;
      const sum = [0, 0, 0];
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const u = (x + (sx + 0.5) / SAMPLES) / size;
          const v = (y + (sy + 0.5) / SAMPLES) / size;
          if (!insideRoundedSquare(u, v, radius)) continue;
          alpha++;
          sampleArt((u - 0.5) / scale + 0.5, (v - 0.5) / scale + 0.5).forEach((value, c) => (sum[c] += value));
        }
      }
      const offset = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) rgba[offset + c] = alpha ? Math.round(sum[c] / alpha) : 0;
      rgba[offset + 3] = Math.round((alpha / SAMPLES ** 2) * 255);
    }
  }
  return encodePng(size, rgba);
};

mkdirSync(outDir, { recursive: true });

// The art fills 0.94 of its square. At 0.64 its corners stay in the maskable safe zone,
// a circle of radius 0.4.
const ICONS = [
  ['icon-192.png', 192, { radius: 0.22, scale: 0.84 }],
  ['icon-512.png', 512, { radius: 0.22, scale: 0.84 }],
  ['icon-maskable-512.png', 512, { radius: 0, scale: 0.64 }],
];

ICONS.forEach(([name, size, options]) => {
  writeFileSync(new URL(name, outDir), drawIcon(size, options));
  console.log(`icons/${name}`);
});

// The logo of the walkthrough: the art with no background, three times its 96 px on screen.
const LOGO_SIZE = 288;
const logo = resizeRgba({ ...art, rgba: clearWhite(art) }, LOGO_SIZE);
writeFileSync(new URL('logo.png', outDir), encodePng(LOGO_SIZE, logo));
console.log('icons/logo.png');

// The icons of the shortcuts of the manifest: a white line icon of icons.svg on a disc of the theme
// colour. Arcs and cubic curves are drawn again as quadratic ones, which glyph.mjs reads.
const THEME = [0x1f, 0x7a, 0x4d];
const SHORTCUT_SIZE = 192;
const GLYPHS = {
  add: { d: 'M2 3h3l2.5 12h11L21 7H6M13 8.5v4M11 10.5h4', circles: [{ cx: 9, cy: 20, r: 1.5 }, { cx: 18, cy: 20, r: 1.5 }] },
  active: { d: 'M2 3h3l2.5 12h11L21 7H6', circles: [{ cx: 9, cy: 20, r: 1.5 }, { cx: 18, cy: 20, r: 1.5 }] },
  recipes: { d: 'M5 3H18Q19 3 19 4V21H6Q4 21 4 19V4Q4 3 5 3ZM4 17H19M9 8H15' },
  menu: { d: 'M7 3V21M4 3V8Q4 11 7 11Q10 11 10 8V3M17 21V3Q13 5 13 10V13H17' },
};

// The glyph is 24 units wide, with a stroke of 2, and fills `scale` of the disc.
const drawShortcut = (size, { d, circles = [] }, scale = 0.5) => {
  const segments = pathSegments(d, 12, circles);
  const unit = (size * scale) / 24;
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let [disc, ink] = [0, 0];
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const px = x + (sx + 0.5) / SAMPLES;
          const py = y + (sy + 0.5) / SAMPLES;
          if (Math.hypot(px - size / 2, py - size / 2) > size / 2) continue;
          disc++;
          const gx = (px - size / 2) / unit + 12;
          const gy = (py - size / 2) / unit + 12;
          if (segments.some((segment) => segmentDistance(gx, gy, segment) <= 1)) ink++;
        }
      }
      const offset = (y * size + x) * 4;
      const share = disc ? ink / disc : 0;
      THEME.forEach((value, c) => (rgba[offset + c] = Math.round(value + (255 - value) * share)));
      rgba[offset + 3] = Math.round((disc / SAMPLES ** 2) * 255);
    }
  }
  return encodePng(size, rgba);
};

Object.entries(GLYPHS).forEach(([name, glyph]) => {
  writeFileSync(new URL(`shortcut-${name}.png`, outDir), drawShortcut(SHORTCUT_SIZE, glyph));
  console.log(`icons/shortcut-${name}.png`);
});
