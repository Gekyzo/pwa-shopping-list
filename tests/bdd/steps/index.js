import { defineCommonSteps } from './common.js';
import { defineStoreSteps } from './store.js';
import { defineSuggestSteps } from './suggest.js';
import { defineStorageSteps } from './storage.js';
import { defineRecipeSteps } from './recipes.js';
import { defineAisleSteps } from './aisles.js';
import { defineArrangeSteps } from './arrange.js';
import { defineShopSteps } from './shops.js';

export const defineAllSteps = (registry) => {
  defineCommonSteps(registry);
  defineStoreSteps(registry);
  defineSuggestSteps(registry);
  defineStorageSteps(registry);
  defineRecipeSteps(registry);
  defineAisleSteps(registry);
  defineArrangeSteps(registry);
  defineShopSteps(registry);
};
