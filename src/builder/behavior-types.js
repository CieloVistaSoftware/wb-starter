import * as Layouts from '../behaviors/js/layouts.js';
import * as Effects from '../behaviors/js/effects.js';
import * as Moves from '../behaviors/js/move.js';
import * as Feedback from '../behaviors/js/feedback.js';
import * as Enhancements from '../behaviors/js/enhancements.js';
import * as Navigation from '../behaviors/js/navigation.js';
import * as Media from '../behaviors/js/media.js';
import * as Helpers from '../behaviors/js/helpers.js';
import * as Overlay from '../behaviors/js/overlay.js';
import * as ThemeControl from '../behaviors/js/themecontrol.js';
import * as Validator from '../behaviors/js/validator.js';
import * as Toggle from '../behaviors/js/toggle.js';
import * as Copy from '../behaviors/js/copy.js';
import * as Darkmode from '../behaviors/js/darkmode.js';
import * as Notes from '../behaviors/js/notes.js';
import * as Mdhtml from '../behaviors/js/mdhtml.js';
import * as Tabs from '../behaviors/js/tabs.js';
import * as Draggable from '../behaviors/js/draggable.js';
import * as Resizable from '../behaviors/js/resizable.js';
import * as Ripple from '../behaviors/js/ripple.js';
import * as Card from '../behaviors/js/card.js';
import * as Collapse from '../behaviors/js/collapse.js';
import * as Dropdown from '../behaviors/js/dropdown.js';
import * as Globe from '../behaviors/js/globe.js';
import * as Hero from '../behaviors/js/hero.js';
import * as Progressbar from '../behaviors/js/progressbar.js';
import * as ScrollProgress from '../behaviors/js/scroll-progress.js';
import * as Slider from '../behaviors/js/slider.js';
import * as Tooltip from '../behaviors/js/tooltip.js';

// Component type categorization
// Dynamically derived from behavior modules to avoid magic strings
const LAYOUT_MODIFIERS = ['center', 'cover', 'fixed', 'flex', 'imposter', 'frame', 'scrollable', 'sticky', 'icon'];
const ACTION_EFFECTS = ['confetti', 'fireworks', 'snow']; // Effects that were previously categorized as actions

// Helper to get keys excluding default
const getKeys = (module) => Object.keys(module).filter(k => k !== 'default');

const layoutKeys = getKeys(Layouts);
const effectKeys = getKeys(Effects);
const moveKeys = getKeys(Moves);
const feedbackKeys = getKeys(Feedback);
const enhancementKeys = getKeys(Enhancements);
const navigationKeys = getKeys(Navigation);
const mediaKeys = getKeys(Media);
const helperKeys = getKeys(Helpers);
const overlayKeys = getKeys(Overlay);
const themeControlKeys = getKeys(ThemeControl);
const validatorKeys = getKeys(Validator);
const toggleKeys = getKeys(Toggle);
const copyKeys = getKeys(Copy);
const darkmodeKeys = getKeys(Darkmode);
const notesKeys = getKeys(Notes);
const mdhtmlKeys = getKeys(Mdhtml);
const tabsKeys = getKeys(Tabs);
const draggableKeys = getKeys(Draggable);
const resizableKeys = getKeys(Resizable);
const rippleKeys = getKeys(Ripple);
const cardKeys = getKeys(Card);
const collapseKeys = getKeys(Collapse);
const dropdownKeys = getKeys(Dropdown);
const globeKeys = getKeys(Globe);
const heroKeys = getKeys(Hero);
const progressbarKeys = getKeys(Progressbar);
const scrollProgressKeys = getKeys(ScrollProgress);
const sliderKeys = getKeys(Slider);
const tooltipKeys = getKeys(Tooltip);

// Specific categorization overrides
const CONTAINER_OVERRIDES = [
  ...navigationKeys, // navbar, breadcrumb, etc. are usually containers
  ...notesKeys,
  ...mdhtmlKeys,
  ...tabsKeys,
  ...cardKeys,
  ...collapseKeys,
  ...dropdownKeys,
  ...heroKeys,
  'carousel', 'gallery', // Media containers
  'modal', 'drawer', 'offcanvas', 'sheet', // Overlay containers
  'group' // Legacy
];

const MODIFIER_OVERRIDES = [
  ...moveKeys,
  ...draggableKeys,
  ...resizableKeys,
  ...rippleKeys,
  ...tooltipKeys,
  ...scrollProgressKeys,
  'parallax', 'tilt', 'glare', 'spotlight', 'cursor', 'reveal', 'typewriter', 'counter', // Enhancements modifiers
  'lazy', 'scroll', 'truncate', 'highlight', 'visible', 'substring', // Helper modifiers
  'popover', // Overlay modifiers
  'autosize' // Legacy
];

const ACTION_OVERRIDES = [
  ...feedbackKeys, // toast, notify
  ...themeControlKeys,
  ...validatorKeys,
  ...toggleKeys,
  ...copyKeys,
  ...darkmodeKeys,
  'print', 'share', 'fullscreen', 'clipboard', 'hotkey', 'external', 'debug', // Helper actions
  'confirm', 'prompt', // Overlay actions
  'lightbox', 'zoom', // Media actions
  'backtotop', 'data', 'preview' // Legacy/Other
];

export const BEHAVIOR_TYPES = {
  // Containers - components that hold children
  containers: [
    ...layoutKeys.filter(k => !LAYOUT_MODIFIERS.includes(k)),
    ...CONTAINER_OVERRIDES
  ],

  // Effects/Modifiers - apply to existing elements
  modifiers: [
    ...effectKeys.filter(k => !ACTION_EFFECTS.includes(k)),
    ...layoutKeys.filter(k => LAYOUT_MODIFIERS.includes(k)),
    ...enhancementKeys.filter(k => !ACTION_OVERRIDES.includes(k) && !MODIFIER_OVERRIDES.includes(k)),
    ...MODIFIER_OVERRIDES
  ],

  // Actions - interactive triggers
  actions: [
    ...effectKeys.filter(k => ACTION_EFFECTS.includes(k)),
    ...ACTION_OVERRIDES
  ]
};

export function getComponentType(comp) {
  const behavior = comp.b || '';
  if (comp.container || BEHAVIOR_TYPES.containers.includes(behavior)) return 'container';
  if (BEHAVIOR_TYPES.modifiers.includes(behavior)) return 'modifier';
  if (BEHAVIOR_TYPES.actions.includes(behavior)) return 'action';
  return 'element';
}
