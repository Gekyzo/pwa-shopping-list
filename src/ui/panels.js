import { comingBack, openItems } from '#store';
import { shopCounts } from '#shops';
import { basketPreview } from '#menu';
import { $, el, state, ui, t, tripEnd } from '#ui/context';
import { listState } from '#ui/view';

// The rows a panel shows before its `y N más` line.
const ROWS = 6;

const rows = (list, entries) => {
  const shown = entries.slice(0, ROWS);
  const more = entries.length - shown.length;
  list.replaceChildren(...shown, ...(more > 0 ? [el('li', { className: 'side-panel-more', textContent: t('panels.more', { count: more }) })] : []));
};

// Por tienda (LIST-38): each shop with the items left of its total, and a bar at the true ratio of
// the shop with the most left.
const renderShops = (view) => {
  const counts = shopCounts(view);
  const shown = counts.some(({ shop }) => shop !== '');
  $('panel-shops').hidden = !shown;
  if (!shown) return;
  const most = Math.max(1, ...counts.map(({ left }) => left));
  $('panel-shops-list').replaceChildren(
    ...counts.map(({ shop, left, total }) => {
      const bar = el('span', { className: 'side-panel-bar' }, [el('span', { className: 'side-panel-fill' })]);
      bar.firstChild.style.width = `${(left / most) * 100}%`;
      return el('li', { className: 'side-panel-row' }, [
        el('span', { textContent: shop || t('group.noShop') }),
        el('span', { className: 'side-panel-value', textContent: t('panels.ofTotal', { left, total }) }),
        bar,
      ]);
    }),
  );
};

// Próxima compra (LIST-39): the items that come back when the trip ends, with the choice of
// Al terminar la compra.
const renderNext = (view) => {
  const keep = tripEnd === 'keep' ? openItems(view).map((item) => item.id) : [];
  const items = comingBack(view, keep);
  $('panel-next').hidden = false;
  $('panel-next-count').textContent = String(items.length);
  const entries = items.map((item) =>
    el('li', { className: 'side-panel-row' }, [el('span', { textContent: item.name }), el('span', { className: 'side-panel-value', textContent: item.shops.join(', ') })]),
  );
  rows($('panel-next-list'), entries.length ? entries : [el('li', { className: 'side-panel-more', textContent: t('panels.nextEmpty') })]);
};

// Para la cesta (MENU-21): what Llenar cesta puts to buy.
const renderBasket = () => {
  const products = basketPreview(state);
  $('panel-basket').hidden = state.menu.length === 0;
  $('panel-basket-count').textContent = String(products.length);
  $('panel-basket-note').textContent = t('panels.basketNote', { fill: t('menu.fill') });
  const entries = products.map((name) => el('li', { className: 'side-panel-row' }, [el('span', { textContent: name })]));
  rows($('panel-basket-list'), entries.length ? entries : [el('li', { className: 'side-panel-more', textContent: t('recipe.inList') })]);
};

// The panels of Compra and Menú, from 600px (DSV-9): below the content until 840px, then beside it.
// Compra shows them while its list has an item; Menú while a meal is planned.
export const renderPanels = () => {
  const compra = ui.view === 'active';
  const view = listState();
  const shown = compra ? view.items.some((item) => item.list === 'active') : ui.view === 'menu' && state.menu.length > 0;
  $('panels').hidden = !shown;
  for (const id of ['panel-shops', 'panel-next', 'panel-basket']) $(id).hidden = true;
  if (!shown) return;
  if (compra) {
    renderShops(view);
    renderNext(view);
  } else renderBasket();
};
