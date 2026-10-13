// The sections, in the order of the bottom bar.
export const SECTIONS = ['active', 'next', 'recipes', 'settings'];

// The length of a slide that changes the section.
const SLIDE_MIN = 60;

// The section that a slide of `dx`, `dy` px (right and down are positive) goes to from `view`:
// the next one on a slide to the left, the previous one on a slide to the right. Null for a slide
// that is short or not horizontal, and at the first and the last section.
export const slideTo = (view, dx, dy) => {
  if (Math.abs(dx) < SLIDE_MIN || Math.abs(dx) < 2 * Math.abs(dy)) return null;
  const index = SECTIONS.indexOf(view);
  if (index < 0) return null;
  return SECTIONS[index + (dx < 0 ? 1 : -1)] ?? null;
};
