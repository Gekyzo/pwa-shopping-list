// The steps of the screen rules that pure modules own: the sections and their addresses
// (`src/sections.js`), the layers (`src/layers.js`), the width classes and the pointers
// (`src/device.js`), the slides of a row (`src/swipe.js`) and the walkthrough (`src/onboarding.js`).
// `none` stands for null, and `yes` and `no` for a boolean.

import assert from 'node:assert/strict';
import { SECTIONS, slideTo, emptyAction, hashOfView, viewOfHash, historyDepth, fabState, keyAction } from '#sections';
import { sheetOpen, closeTop, keysBlocked, addHidden } from '#layers';
import { deviceClass, features, gesturePointer, rowClick, mouseMenu } from '#device';
import { settle, reached } from '#swipe';
import { PAGES, step, hasBack, isLast, shouldShow, offersSample, pageTextKey } from '#onboarding';
import { hasSample } from '#recipes';
import { loadOnboarded, saveOnboarded, hasStoredState, loadSwipeHint, saveSwipeHint, loadHand, saveHand, loadTheme, saveTheme, loadDensity, saveDensity } from '#storage';
import { yesNo, names } from '../world.js';

const orNone = (value) => value ?? 'none';
const pointerOf = (text) => (text === 'none' ? undefined : text);

// The state of the screen (`ui` of src/ui/context.js) with the layers that the text names.
const screenOf = (view, text) => ({
  view,
  sheetOpen: false,
  arrangeOpen: false,
  tripOpen: false,
  aislesOpen: false,
  shareOpen: false,
  shopPickOpen: false,
  whatsNewOpen: false,
  editId: text.includes('the edit sheet') ? 'id-1' : null,
  mealOpen: null,
  recipeId: text.includes('the recipe sheet') ? 'id-1' : null,
  openId: text.includes('a row') ? 'id-1' : null,
  searchOpen: text.includes('the search'),
});

const PREFERENCES = {
  hand: [loadHand, saveHand],
  theme: [loadTheme, saveTheme],
  density: [loadDensity, saveDensity],
};

const preference = (name) => {
  assert.ok(PREFERENCES[name], `No preference ${name}`);
  return PREFERENCES[name];
};

export const defineScreenSteps = ({ Given, When, Then }) => {
  Then('the sections are {string}', (world, text) => {
    assert.deepEqual(SECTIONS, names(text));
  });
  Then('a slide of {int} by {int} px from {word} goes to {word}', (world, dx, dy, from, to) => {
    assert.equal(orNone(slideTo(from, dx, dy)), to);
  });
  Then('a {word} drag slides the screen: {word}', (world, pointer, answer) => {
    assert.equal(gesturePointer(pointerOf(pointer)), yesNo(answer));
  });
  Then(/the empty section (\w+) with the search "([^"]*)", recipes (yes|no) and the sample (yes|no) shows (\S+), (\S+), (\S+) and (\S+)/,
    (world, view, query, recipes, sample, title, text, action, secondary) => {
      const shown = emptyAction(view, { query, hasRecipes: yesNo(recipes), sample: yesNo(sample) });
      assert.deepEqual(
        [shown.title, shown.text, shown.action, shown.secondary].map(orNone),
        [title, text, action, secondary],
      );
    },
  );
  Then('the section {word} has the address {string}', (world, view, hash) => {
    assert.equal(hashOfView(view), hash);
  });
  Then('the hash {string} shows {word}', (world, hash, view) => {
    assert.equal(viewOfHash(hash), view);
  });

  Given(/the screen of the section (\w+) has (.+)/, (world, view, text) => {
    world.screen = screenOf(view, text);
  });
  Then('a sheet is open', (world) => {
    assert.equal(sheetOpen(world.screen), true);
  });
  Then('the floating add shows: {word}', (world, answer) => {
    assert.equal(!addHidden(world.screen, { place: 'float' }), yesNo(answer));
  });
  Then('the add of the bar shows: {word}', (world, answer) => {
    assert.equal(!addHidden(world.screen, { place: 'bar' }), yesNo(answer));
  });
  Then('beside the recipe pane the floating add shows: {word}', (world, answer) => {
    assert.equal(!addHidden(world.screen, { place: 'float', recipePane: true }), yesNo(answer));
  });
  Then('Escape closes the {word}', (world, top) => {
    assert.equal(orNone(closeTop(world.screen)), top === 'nothing' ? 'none' : top);
  });
  Then('the history holds {int} entries above the first', (world, depth) => {
    const { view } = world.screen;
    assert.equal(historyDepth(view, closeTop(world.screen) !== null), depth);
  });
  Then('the keys wait: {word}', (world, answer) => {
    assert.equal(keysBlocked(world.screen, { recipePane: false }), yesNo(answer));
  });
  Then('beside the recipe pane the keys wait: {word}', (world, answer) => {
    assert.equal(keysBlocked(world.screen, { recipePane: true }), yesNo(answer));
  });
  Then('after a scroll from {int} to {int} px the add button goes from {word} to {word}', (world, from, to, before, after) => {
    assert.equal(fabState(from, to, before), after);
  });

  Then('a window of {int} px is a {word} with the nav {word}, the dock {word}, the panels {word}, the recipe pane {word} and the search field {word}',
    (world, width, cls, nav, dock, panels, pane, field) => {
      assert.equal(deviceClass(width), cls);
      assert.deepEqual(features(cls), { nav, dock: yesNo(dock), panels, recipePane: yesNo(pane), searchField: yesNo(field) });
    },
  );
  Then(/the key "([^"]+)" with (nothing|ctrl|shift|alt|meta) (on the page|in a field|under a sheet|on a row) does (.+)/, (world, key, modifier, where, action) => {
    const found = keyAction({
      key,
      [modifier]: modifier !== 'nothing',
      inField: where === 'in a field',
      layer: where === 'under a sheet',
      onRow: where === 'on a row',
    });
    const shown = found === null ? 'nothing' : [found.type, found.view].filter(Boolean).join(' ');
    assert.equal(shown, action);
  });

  Then(/a click of a (\w+) with detail (\d+) on the (body|check mark) does (\w+)/, (world, pointer, detail, where, action) => {
    assert.equal(rowClick({ pointerType: pointerOf(pointer), detail: Number(detail), onCheck: where === 'check mark' }), action);
  });
  Then('a drag of {int} px of a row with sides of {int} and {int} px and {word} open settles on {word}',
    (world, dx, start, end, open, settles) => {
      assert.equal(orNone(settle(dx, { start, end }, open === 'none' ? null : open)), settles);
    },
  );
  Then('a slide to the right of {int} px on a row of {int} px runs: {word}', (world, dx, width, answer) => {
    assert.equal(reached(dx, width), yesNo(answer));
  });
  Then('a context menu of {word} with button {int} opens the actions: {word}', (world, pointer, button, answer) => {
    assert.equal(mouseMenu({ pointerType: pointerOf(pointer), button }), yesNo(answer));
  });
  When('the hint of the slide plays', (world) => {
    saveSwipeHint(world.storage);
  });
  Then('the hint of the slide has played: {word}', (world, answer) => {
    assert.equal(loadSwipeHint(world.storage), yesNo(answer));
  });

  Then('the pages of the walkthrough are {string}', (world, text) => {
    assert.deepEqual(PAGES, names(text));
  });
  Then('a move {word} from page {int} of the walkthrough shows page {int}, with Atrás {word} and the last page {word}',
    (world, move, page, to, back, last) => {
      const index = step(page - 1, { forward: 1, back: -1, nowhere: 0 }[move]);
      assert.equal(index + 1, to);
      assert.equal(hasBack(index), yesNo(back));
      assert.equal(isLast(index), yesNo(last));
    },
  );
  Then('the walkthrough shows at the start: {word}', (world, answer) => {
    const shows = shouldShow({ seen: loadOnboarded(world.storage), hasState: hasStoredState(world.storage) });
    assert.equal(shows, yesNo(answer));
  });
  When('the walkthrough closes', (world) => {
    saveOnboarded(world.storage);
  });
  Then('the page {word} with {int} items and {int} recipes offers the sample: {word}, with the text {string}',
    (world, page, items, recipes, answer, key) => {
      const offer = offersSample({ page, items, recipes });
      assert.equal(offer, yesNo(answer));
      assert.equal(pageTextKey(page, offer), key);
    },
  );
  Then('the sample recipe exists: {word}', (world, answer) => {
    assert.equal(hasSample(world.state), yesNo(answer));
  });

  When(/I choose the (hand|theme|density) (\w+)/, (world, name, value) => {
    assert.equal(preference(name)[1](world.storage, value), true);
  });
  Then(/the (hand|theme|density) is (\w+)/, (world, name, value) => {
    assert.equal(preference(name)[0](world.storage), value);
  });
};
