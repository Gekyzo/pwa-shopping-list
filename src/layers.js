// The layers that open over a section: a sheet, an open row, the search of a list. `view` is the
// state of the screen (`ui` of src/ui/context.js).

// True while a sheet is open. One sheet is open at a time.
export const sheetOpen = (view) =>
  view.sheetOpen || view.arrangeOpen || view.tripOpen || view.menuMoreOpen || view.aislesOpen || view.shopPickOpen ||
  view.editId !== null || view.mealOpen !== null || view.recipeId !== null;

// The layer that `Escape` and the back of the phone close first: an open sheet, then an open row,
// then the search of a list. Null when nothing is open.
export const closeTop = (view) => {
  if (sheetOpen(view)) return 'sheet';
  if (view.openId !== null) return 'row';
  return view.searchOpen ? 'search' : null;
};
