// The place that a lifted row takes among the rows of its scope. `tops` and `heights` are those
// of the rows before the move, `from` is the index of the lifted row and `y` its top now. The row
// takes the place of a neighbour when its centre passes the centre of the neighbour.
export const dropIndex = (tops, heights, from, y) => {
  const centre = y + heights[from] / 2;
  const centreOf = (index) => tops[index] + heights[index] / 2;
  let index = from;
  while (index < tops.length - 1 && centre > centreOf(index + 1)) index += 1;
  while (index > 0 && centre < centreOf(index - 1)) index -= 1;
  return index;
};

// The vertical offset of each row of the scope that opens a gap at `to` for the row lifted
// from `from`, whose height is `height`. The lifted row has 0: it follows the pointer.
export const shifts = (count, from, to, height) =>
  Array.from({ length: count }, (_, index) => {
    if (index > from && index <= to) return -height;
    if (index < from && index >= to) return height;
    return 0;
  });

// The ids with the id at `from` moved to the place `to`.
export const moveTo = (ids, from, to) => {
  const rest = ids.filter((_, index) => index !== from);
  return [...rest.slice(0, to), ids[from], ...rest.slice(to)];
};
