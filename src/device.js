// The four width classes of DSV-9 and what each class has (NAV-28). The layout lives in the media
// queries of the CSS; this module gives the same classes to the code.

export const BREAKPOINTS = Object.freeze({ foldable: 600, tablet: 840, desktop: 1024 });

export const CLASSES = Object.freeze(['phone', 'foldable', 'tablet', 'desktop']);

export const FEATURES = Object.freeze({
  phone: Object.freeze({ nav: 'bar', dock: true, panels: 'none', recipePane: false, searchField: false }),
  foldable: Object.freeze({ nav: 'rail', dock: false, panels: 'below', recipePane: false, searchField: false }),
  tablet: Object.freeze({ nav: 'rail', dock: false, panels: 'beside', recipePane: true, searchField: false }),
  desktop: Object.freeze({ nav: 'sidebar', dock: false, panels: 'beside', recipePane: true, searchField: true }),
});

export const deviceClass = (width) => {
  if (!(width >= BREAKPOINTS.foldable)) return 'phone';
  if (width < BREAKPOINTS.tablet) return 'foldable';
  return width < BREAKPOINTS.desktop ? 'tablet' : 'desktop';
};

export const features = (cls) => (Object.hasOwn(FEATURES, cls) ? FEATURES[cls] : FEATURES.phone);

// A finger or a pen slides; a mouse drag selects. An empty type is an old browser: treat it as touch.
export const gesturePointer = (pointerType) => pointerType !== 'mouse';
