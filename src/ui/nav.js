import { direction, slideTo } from '#sections';
import { sheetOpen } from '#layers';
import { $, scroller, ui, render, guardClick } from '#ui/context';
import { reorder } from '#ui/drag';
import { checkVersion } from '#ui/settings';

// Lets the content of the new section come in from the side that it is on in the bottom bar.
const enter = (way) => {
  scroller.classList.remove('enter-next', 'enter-previous');
  if (!way) return;
  // The read of the width starts the animation again when a change follows another one.
  void scroller.offsetWidth;
  scroller.classList.add(way > 0 ? 'enter-next' : 'enter-previous');
};

export const showView = (view) => {
  const way = direction(ui.view, view);
  // The field is shared: the focus of a list search must not go with it to Recetas.
  $('query').blur();
  Object.assign(ui, { view, openId: null, query: '', searchOpen: false, mealOpen: null, recipeId: null, shopPickOpen: false });
  render();
  enter(way);
  if (ui.view === 'settings') checkVersion();
};

export const bind = () => {
  // A child of the list area that shows later, as a banner does, must not come in from a side.
  scroller.addEventListener('animationend', (event) => {
    if (event.animationName === 'enter') scroller.classList.remove('enter-next', 'enter-previous');
  });
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', () => showView(button.dataset.view));
  });
  // A horizontal slide that starts out of the rows changes the section. A row keeps its drag for its
  // side menus, and a text field keeps its drag for the selection.
  let sectionSlide = null;
  document.addEventListener('pointerdown', (event) => {
    sectionSlide = null;
    if (!event.isPrimary || event.button !== 0 || reorder || sheetOpen(ui)) return;
    if (!event.target.closest('.app-header, main') || event.target.closest('.item-row-swipe, .shop-lists, .dock, input, textarea')) return;
    sectionSlide = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  });
  document.addEventListener('pointerup', (event) => {
    if (sectionSlide?.pointerId !== event.pointerId) return;
    const view = slideTo(ui.view, event.clientX - sectionSlide.x, event.clientY - sectionSlide.y);
    sectionSlide = null;
    if (!view) return;
    // The click that follows a slide must not press the button below the finger.
    guardClick();
    showView(view);
  });
  document.addEventListener('pointercancel', () => {
    sectionSlide = null;
  });
};
