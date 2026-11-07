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

// True when an add button of the section does not show. `place` is 'float' for the fab and the add
// of the dock, 'bar' for the add of the header and of the sidebar from 600px. An open sheet hides
// only the floating add (NAV-8): the bars keep their buttons under the veil, so they do not move.
// Beside the recipe pane (REC-39) the recipe is no sheet, so the add stays.
export const addHidden = (view, { place, emptyAction = false, recipePane = false }) => {
  if (['settings', 'menu'].includes(view.view) || emptyAction) return true;
  return place === 'float' && sheetOpen(recipePane ? { ...view, recipeId: null } : view);
};
