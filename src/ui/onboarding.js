import { PAGES, hasBack, isLast, step, textParts } from '#onboarding';
import { hasSample, loadSample } from '#recipes';
import { slideDirection } from '#sections';
import { saveOnboarded } from '#storage';
import { $, el, storage, state, ui, t, apply, guardClick } from '#ui/context';
import { icon } from '#ui/controls';

// A part of a page text: plain text, or a key with an optional icon. A key with an icon and no
// text gets the name of its control (`onboarding.icon.<name>`).
const keyNode = ({ text, key, icon: name }) => {
  if (!key) return text;
  const node = el('span', { className: 'onboarding-key' }, name ? [icon(name, 'small'), text] : [text]);
  if (name && !text) {
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', t(`onboarding.icon.${name}`));
  }
  return node;
};

const SAMPLE_PRODUCTS = ['tomatoSauce', 'pasta', 'garlic', 'oliveOil', 'salt'];

// The sample recipe in the language of the screen.
const sampleText = () => ({ name: t('sample.name'), products: SAMPLE_PRODUCTS.map((key) => t(`sample.${key}`)) });

// The switch shows on the last page while the state has no sample recipe (ONB-13).
const offersSample = () => PAGES[ui.onboarding] === 'sample' && !hasSample(state);

export const renderOnboarding = () => {
  const open = ui.onboarding !== null;
  $('onboarding').hidden = !open;
  // The walkthrough covers the app: no tap, no slide and no focus goes below it.
  document.querySelectorAll('.app-header, main, .fab, .nav-bar').forEach((node) => {
    node.inert = open;
  });
  if (!open) return;
  const page = PAGES[ui.onboarding];
  const away = !offersSample();
  $('onboarding-sample').classList.toggle('away', away);
  $('onboarding-sample').inert = away;
  // An SVG element has no `hidden` property, so the attribute is set.
  document.querySelectorAll('#onboarding svg[data-page]').forEach((drawing) => {
    drawing.toggleAttribute('hidden', drawing.dataset.page !== page);
  });
  $('onboarding-title').textContent = t(`onboarding.${page}.title`);
  const names = { active: t('list.active'), name: t('sample.name') };
  const parts = textParts(t(`onboarding.${page}.text`, names));
  $('onboarding-text').replaceChildren(...parts.map(keyNode));
  $('onboarding-dots').replaceChildren(...PAGES.map((id) => el('span', { className: id === page ? 'onboarding-dot on' : 'onboarding-dot' })));
  $('onboarding-dots').setAttribute('aria-label', t('onboarding.page', { page: ui.onboarding + 1, total: PAGES.length }));
  $('onboarding-logo').hidden = ui.onboarding !== 0;
  $('onboarding-back').hidden = !hasBack(ui.onboarding);
  $('onboarding-skip').hidden = isLast(ui.onboarding);
  $('onboarding-next').textContent = t(isLast(ui.onboarding) ? 'onboarding.start' : 'onboarding.next');
};

const openOnboarding = () => {
  ui.onboarding = 0;
  $('sample-switch').checked = true;
  renderOnboarding();
  // The title takes the focus, not a button: no ring shows on load (ONB-11).
  $('onboarding-title').focus();
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
  const leaving = document.activeElement;
  renderOnboarding();
  // Atrás goes away on the first page, and the focus must not go with it.
  if (leaving?.hidden) $('onboarding-next').focus();
  const page = $('onboarding-page');
  page.classList.remove('enter-next', 'enter-previous');
  // The read of the width starts the animation again when a change follows another one.
  void page.offsetWidth;
  page.classList.add(way > 0 ? 'enter-next' : 'enter-previous');
};

export const bind = () => {
  $('onboarding-next').addEventListener('click', () => {
    if (!isLast(ui.onboarding)) {
      turnOnboarding(1);
      return;
    }
    // Only Empezar loads the sample and its products; Saltar and Escape do not (ONB-13).
    if (offersSample() && $('sample-switch').checked) apply(loadSample(state, sampleText()));
    closeOnboarding();
  });
  $('onboarding-back').addEventListener('click', () => turnOnboarding(-1));
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
