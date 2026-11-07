import { BREAKPOINTS, CLASSES } from '#device';
import { ui } from '#ui/context';

// Keeps `ui.device` on the width class of the window (NAV-28). The CSS lays out each class with its
// own media queries; this watcher gives the same class to the code.

const NAMES = ['foldable', 'tablet', 'desktop'];

// The widest class whose query matches. `matches` holds one boolean for each breakpoint.
export const classOf = (matches) => NAMES.reduce((cls, name) => (matches[name] ? name : cls), CLASSES[0]);

// The class after a change of the queries, or null when the class stays.
export const nextClass = (current, matches) => {
  const next = classOf(matches);
  return next === current ? null : next;
};

export const bind = (onChange) => {
  const queries = Object.fromEntries(NAMES.map((name) => [name, matchMedia(`(min-width: ${BREAKPOINTS[name]}px)`)]));
  const read = () => Object.fromEntries(NAMES.map((name) => [name, queries[name].matches]));
  const update = () => {
    const next = nextClass(ui.device, read());
    if (next === null) return false;
    ui.device = next;
    document.documentElement.dataset.device = next;
    return true;
  };
  ui.device = classOf(read());
  document.documentElement.dataset.device = ui.device;
  // One resize can cross two breakpoints and fire two queries: the second finds the class set.
  for (const query of Object.values(queries)) {
    query.addEventListener('change', () => {
      if (update()) onChange();
    });
  }
};
