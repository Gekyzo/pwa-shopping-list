import { PAGES, isLast, step } from '#onboarding';
import { slideDirection } from '#sections';
import { saveOnboarded } from '#storage';
import { $, el, storage, ui, t, guardClick } from '#ui/context';

export const renderOnboarding = () => {
  const open = ui.onboarding !== null;
  $('onboarding').hidden = !open;
  // The walkthrough covers the app: no tap, no slide and no focus goes below it.
  document.querySelectorAll('.head, main, .fab, .bnav').forEach((node) => {
    node.inert = open;
  });
  if (!open) return;
  const page = PAGES[ui.onboarding];
  // An SVG element has no `hidden` property, so the attribute is set.
  document.querySelectorAll('#onboarding svg[data-page]').forEach((drawing) => {
    drawing.toggleAttribute('hidden', drawing.dataset.page !== page);
  });
  $('onboarding-title').textContent = t(`onboarding.${page}.title`);
  $('onboarding-text').textContent = t(`onboarding.${page}.text`, { active: t('list.active'), next: t('list.next') });
  $('onboarding-dots').replaceChildren(...PAGES.map((id) => el('span', { className: id === page ? 'on' : '' })));
  $('onboarding-dots').setAttribute('aria-label', t('onboarding.page', { page: ui.onboarding + 1, total: PAGES.length }));
  $('onboarding-skip').hidden = isLast(ui.onboarding);
  $('onboarding-next').textContent = t(isLast(ui.onboarding) ? 'onboarding.start' : 'onboarding.next');
};

const openOnboarding = () => {
  ui.onboarding = 0;
  renderOnboarding();
  $('onboarding-next').focus();
};

// A close marks the walkthrough as seen. With no storage it shows only from Ajustes.
export const closeOnboarding = () => {
  ui.onboarding = null;
  if (storage) saveOnboarded(storage);
  renderOnboarding();
  if (ui.view === 'settings') $('show-onboarding').focus();
};

// Shows the next page for 1 and the previous one for -1. The page comes in from its side.
export const turnOnboarding = (way) => {
  const index = step(ui.onboarding, way);
  if (index === ui.onboarding) return;
  ui.onboarding = index;
  renderOnboarding();
  // The skip button goes away on the last page, and the focus must not go with it.
  $('onboarding-next').focus();
  const page = $('onboarding-page');
  page.classList.remove('enter-next', 'enter-previous');
  // The read of the width starts the animation again when a change follows another one.
  void page.offsetWidth;
  page.classList.add(way > 0 ? 'enter-next' : 'enter-previous');
};

export const bind = () => {
  $('onboarding-next').addEventListener('click', () => {
    if (isLast(ui.onboarding)) closeOnboarding();
    else turnOnboarding(1);
  });
  $('onboarding-skip').addEventListener('click', closeOnboarding);
  $('show-onboarding').addEventListener('click', openOnboarding);

  // A horizontal slide on the walkthrough changes its page, with the measures of the section slide.
  let onboardingSlide = null;
  $('onboarding').addEventListener('pointerdown', (event) => {
    const primary = event.isPrimary && event.button === 0;
    onboardingSlide = primary ? { pointerId: event.pointerId, x: event.clientX, y: event.clientY } : null;
  });
  $('onboarding').addEventListener('pointerup', (event) => {
    if (onboardingSlide?.pointerId !== event.pointerId) return;
    const way = slideDirection(event.clientX - onboardingSlide.x, event.clientY - onboardingSlide.y);
    onboardingSlide = null;
    if (!way) return;
    // The click that follows a slide must not press the button below the finger.
    guardClick();
    turnOnboarding(way);
  });
  $('onboarding').addEventListener('pointercancel', () => {
    onboardingSlide = null;
  });
};
