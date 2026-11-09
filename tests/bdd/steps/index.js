import { defineCommonSteps } from './common.js';
import { defineStoreSteps } from './store.js';
import { defineSuggestSteps } from './suggest.js';
import { defineStorageSteps } from './storage.js';

export const defineAllSteps = (registry) => {
  defineCommonSteps(registry);
  defineStoreSteps(registry);
  defineSuggestSteps(registry);
  defineStorageSteps(registry);
};
