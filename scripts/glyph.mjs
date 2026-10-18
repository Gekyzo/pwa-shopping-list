// The strokes of a line icon as straight segments, to draw it with no dependencies.
// A path reads M, L, H, V, Q and Z, absolute or relative. A segment is [x1, y1, x2, y2].

const ARGS = { M: 2, L: 2, H: 1, V: 1, Q: 4, Z: 0 };

export const pathSegments = (d, steps = 8, circles = []) => {
  const segments = [];
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)/g) ?? [];
  let [x, y, startX, startY] = [0, 0, 0, 0];
  let command = null;
  const line = (nx, ny) => {
    segments.push([x, y, nx, ny]);
    [x, y] = [nx, ny];
  };
  for (let i = 0; i < tokens.length; ) {
    if (/[a-zA-Z]/.test(tokens[i])) command = tokens[i++];
    const upper = command?.toUpperCase();
    if (!(upper in ARGS)) throw new Error(`command ${command} is not supported`);
    const relative = command !== upper;
    const args = tokens.slice(i, i + ARGS[upper]).map(Number);
    i += ARGS[upper];
    const [dx, dy] = relative ? [x, y] : [0, 0];
    if (upper === 'M') {
      [x, y] = [args[0] + dx, args[1] + dy];
      [startX, startY] = [x, y];
      // Pairs after a move are lines.
      command = relative ? 'l' : 'L';
    } else if (upper === 'L') line(args[0] + dx, args[1] + dy);
    else if (upper === 'H') line(args[0] + dx, y);
    else if (upper === 'V') line(x, args[0] + dy);
    else if (upper === 'Z') line(startX, startY);
    else {
      const [cx, cy, ex, ey] = [args[0] + dx, args[1] + dy, args[2] + dx, args[3] + dy];
      const [sx, sy] = [x, y];
      for (let step = 1; step <= steps; step++) {
        const t = step / steps;
        const u = 1 - t;
        line(u * u * sx + 2 * u * t * cx + t * t * ex, u * u * sy + 2 * u * t * cy + t * t * ey);
      }
    }
  }
  for (const { cx, cy, r } of circles) {
    const point = (step) => [cx + r * Math.cos((2 * Math.PI * step) / steps), cy + r * Math.sin((2 * Math.PI * step) / steps)];
    for (let step = 0; step < steps; step++) segments.push([...point(step), ...point(step + 1)]);
  }
  return segments;
};

export const segmentDistance = (px, py, [x1, y1, x2, y2]) => {
  const [dx, dy] = [x2 - x1, y2 - y1];
  const length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / length)) : 0;
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};
