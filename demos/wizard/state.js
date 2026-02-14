// wizard/state.js -- Shared mutable state + localStorage persistence

var STORAGE_KEY = 'wb-wizard-state';

var containerTags = new Set([
  'wb-demo', 'wb-grid', 'wb-flex', 'wb-stack', 'wb-cluster',
  'wb-container', 'wb-sidebar', 'wb-center', 'wb-cover',
  'wb-masonry', 'wb-switcher', 'wb-reel', 'wb-row', 'wb-column',
  'wb-frame', 'wb-drawer'
]);

export var state = {
  schemas: [],
  currentSchema: null,
  currentAttrs: {},
  previewStack: [],
  containerIndex: -1,
  selectedStackIdx: -1,
  selectedChildIdx: -1,
  // registered callbacks -- set by main.js to avoid circular deps
  onRefresh: null,
  onPropertyChange: null
};

export function isContainerTag(tag) {
  return containerTags.has(tag.toLowerCase());
}

export function saveState() {
  try {
    var data = {
      previewStack: state.previewStack,
      containerIndex: state.containerIndex,
      selectedStackIdx: state.selectedStackIdx,
      selectedChildIdx: state.selectedChildIdx
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) { /* quota or private mode */ }
}

export function loadState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    var data = JSON.parse(raw);
    if (!data.previewStack || !Array.isArray(data.previewStack) || data.previewStack.length === 0) return false;
    state.previewStack = data.previewStack;
    state.containerIndex = typeof data.containerIndex === 'number' ? data.containerIndex : -1;
    state.selectedStackIdx = typeof data.selectedStackIdx === 'number' ? data.selectedStackIdx : -1;
    state.selectedChildIdx = typeof data.selectedChildIdx === 'number' ? data.selectedChildIdx : -1;
    return true;
  } catch (e) { return false; }
}

export function clearState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}
