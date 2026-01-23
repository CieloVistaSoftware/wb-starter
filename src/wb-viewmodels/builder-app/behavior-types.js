import * as Layouts from '../layouts.js';
import * as Effects from '../effects.js';
import * as Moves from '../move.js';
import * as Feedback from '../feedback.js';
import * as Enhancements from '../enhancements.js';
import * as Navigation from '../navigation.js';
import * as Media from '../media.js';
import * as Helpers from '../helpers.js';
import * as Overlay from '../overlay.js';
import * as ThemeControl from '../themecontrol.js';
import * as Validator from '../validator.js';
import * as Toggle from '../toggle.js';
import * as Copy from '../copy.js';
import * as Darkmode from '../darkmode.js';
import * as Issues from '../issues.js';
import * as Mdhtml from '../mdhtml.js';
import * as Tabs from '../tabs.js';
import * as Draggable from '../draggable.js';
import * as Resizable from '../resizable.js';
import * as Ripple from '../ripple.js';
import * as Card from '../card.js';
import * as Collapse from '../collapse.js';
import * as Dropdown from '../dropdown.js';
import * as Globe from '../globe.js';
import * as Hero from '../hero.js';
import * as Progressbar from '../progressbar.js';
import * as ScrollProgress from '../scroll-progress.js';
import * as Slider from '../slider.js';
import * as Tooltip from '../tooltip.js';

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
