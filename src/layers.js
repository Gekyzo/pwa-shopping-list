// The layers that open over a section: a sheet, an open row, the search of a list. `view` is the
// state of the screen (`ui` of src/ui/context.js).

// True while a sheet is open. One sheet is open at a time.
export const sheetOpen = (view) =>
  view.sheetOpen || view.arrangeOpen || view.tripOpen || view.aislesOpen || view.shareOpen || view.shopPickOpen || view.whatsNewOpen ||
  view.editId !== null || view.mealOpen !== null || view.recipeId !== null;

// The layer that `Escape` and the back of the phone close first: an open sheet, then an open row,
// then the search of a list. Null when nothing is open.
export const closeTop = (view) => {
  if (sheetOpen(view)) return 'sheet';
  if (view.openId !== null) return 'row';
  return view.searchOpen ? 'search' : null;
};

// True while the keys of NAV-29 must wait: a sheet is open. From 840px the recipe is a pane beside
// the list, not a sheet (REC-39), so it does not block them.
export const keysBlocked = (view, { recipePane }) => sheetOpen(recipePane ? { ...view, recipeId: null } : view);
