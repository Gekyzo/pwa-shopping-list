import { defineCommonSteps } from './common.js';
import { defineStoreSteps } from './store.js';

export const defineAllSteps = (registry) => {
  defineCommonSteps(registry);
  defineStoreSteps(registry);
};
