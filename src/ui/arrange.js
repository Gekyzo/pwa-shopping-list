import * as store from '#store';
import * as shops from '#shops';
import { LEAVE_MS, $, state, ui, shopLists, commit, render, setShopLists } from '#ui/context';
import { inList, arrangeChoices, shownGroup } from '#ui/view';
import { collapse, expand, rowTops, slide, groupOnlyRows } from '#ui/motion';

// True while the groups of Compra close, before the list becomes flat.
let ungrouping = false;

export const renderArrange = () => {
  const { recipe, shop, aisle, sort } = arrangeChoices();
  const group = recipe || shop || aisle;
  // The choice of the row of shop lists shows when the view has the row to show.
  const lists = inList() && shops.shopChips(state, ui.view).length > 0;
  if (!group && !sort && !lists) ui.arrangeOpen = false;
  $('arrange-button').hidden = !group && !sort && !lists;
  $('arrange-button').setAttribute('aria-expanded', String(ui.arrangeOpen));
  $('arrange').hidden = !ui.arrangeOpen;
  $('arrange-group').hidden = !group;
  $('arrange-sort').hidden = !sort;
  $('arrange-lists').hidden = !lists;
  document.querySelectorAll('#arrange-lists button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.lists === shopLists));
  });
  const shows = { recipe, shop, aisle, none: true };
  // The view shows no group for a choice that it cannot show.
  const pressed = shownGroup();
  document.querySelectorAll('#arrange-group button').forEach((button) => {
    button.hidden = !shows[button.dataset.group];
    button.setAttribute('aria-pressed', String(button.dataset.group === pressed));
  });
  document.querySelectorAll('#arrange-sort button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.sort === state.sort));
  });
};

// The row of shop lists from open to closed. Its padding and its line close with it.
const chipFrames = (row) => {
  const { paddingTop, paddingBottom, borderBottomWidth } = getComputedStyle(row);
  const still = { overflow: 'hidden' };
  return [
    { height: `${row.offsetHeight}px`, paddingTop, paddingBottom, borderBottomWidth, opacity: 1, ...still },
    { height: '0px', paddingTop: '0px', paddingBottom: '0px', borderBottomWidth: '0px', opacity: 0, ...still },
  ];
};

// Ocultar closes the row before the render takes it away, so that the list moves up with it;
// Mostrar opens the row that the render brings back.
const changeShopLists = (choice) => {
  if (choice === shopLists) return;
  setShopLists(choice);
  const row = $('shop-chips');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (choice === 'show' || row.hidden || still) {
    render();
    if (choice === 'show' && !row.hidden && !still) {
      row.animate(chipFrames(row).reverse(), { duration: LEAVE_MS, easing: 'ease-out' });
    }
    return;
  }
  renderArrange();
  const closing = row.animate(chipFrames(row), { duration: LEAVE_MS, easing: 'ease-in', fill: 'forwards' });
  closing.finished.then(() => {
    const before = rowTops();
    render();
    closing.cancel();
    slide(before);
  });
};

export const closeArrange = () => {
  ui.arrangeOpen = false;
  render();
};

export const bind = () => {
  $('arrange-button').addEventListener('click', () => {
    Object.assign(ui, { arrangeOpen: true, openId: null });
    render();
  });
  $('arrange-veil').addEventListener('click', closeArrange);
  // The sheet stays open after a choice, so that the group and the order change in one visit.
  document.querySelectorAll('#arrange-group button').forEach((button) => {
    button.addEventListener('click', () => {
      const { group } = button.dataset;
      // A tap on the choice that the view shows changes nothing: the stored choice can be a
      // grouping that only the other list shows.
      if (group === shownGroup() && !ungrouping) return;
      // The rows that stay move to their new place.
      const set = () => {
        const before = rowTops();
        commit(store.setGroup(state, group).state);
        return before;
      };
      // The view can show no group for a choice that it cannot show.
      const flat = shownGroup() === 'none';
      if (group !== 'none' || flat) {
        const opens = group !== 'none' && flat;
        // A tap on a grouping while the groups close keeps them.
        ungrouping = false;
        const before = set();
        // `slide` reads the places after `expand` starts, so the two effects add up to one move.
        if (opens) expand(groupOnlyRows());
        slide(before);
        return;
      }
      if (ungrouping) return;
      ungrouping = true;
      // Show the choice at once; the render after the effect writes the same value.
      document.querySelectorAll('#arrange-group button').forEach((other) => {
        other.setAttribute('aria-pressed', String(other === button));
      });
      // The groups close before the list becomes flat.
      collapse(groupOnlyRows(), () => {
        if (!ungrouping) return;
        ungrouping = false;
        slide(set());
      });
    });
  });
  document.querySelectorAll('#arrange-sort button').forEach((button) => {
    button.addEventListener('click', () => {
      const before = rowTops();
      commit(store.setSort(state, button.dataset.sort).state);
      slide(before);
    });
  });
  document.querySelectorAll('#arrange-lists button').forEach((button) => {
    button.addEventListener('click', () => changeShopLists(button.dataset.lists === 'hide' ? 'hide' : 'show'));
  });
};
