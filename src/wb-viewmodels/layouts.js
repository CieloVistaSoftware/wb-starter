import { readFlag, readAttr, readOption, hasAuthoredAttr, authoredAttr } from '../core/read-attr.js';
import { setRule, clearRules, onlyChanged } from '../core/dynamic-style.js';
import { themeColor } from '../core/theme-color.js';
/**
 * Layout Behaviors - Extended
 * -----------------------------------------------------------------------------
 * Structural layout primitives for building responsive interfaces.
 * Includes Grid, Flex, Stack, Cluster, and Masonry layouts.
 * 
 * Custom Tag: <div>
 * -----------------------------------------------------------------------------
 * 
 * Usage:
 *   <div x-grid data-columns="3">...</div>
 *   <div data-justify="between">...</div>
 *
 * #779 -- no inline styles. Every declaration these primitives used to write
 * onto element.style now has a default in src/styles/behaviors/layout.css,
 * keyed on the class each one adds. What an author sets through an attribute
 * (gap="2rem", min-width="300px", ...) is a runtime value, so it travels as a
 * generated stylesheet rule (src/core/dynamic-style.js) holding ONLY the
 * values that differ from those defaults.
 */

/**
 * Give every current child of `element` the layout's item class, and return
 * the function that takes it off again. switcher, masonry and reel each
 * spelled this out by hand (#883).
 */
function classChildren(element, itemClass) {
  const children = Array.from(element.children);
  children.forEach(child => child.classList.add(itemClass));
  return () => children.forEach(child => child.classList.remove(itemClass));
}

/**
 * Grid - CSS Grid layout
 * Custom Tag: <div x-grid>
 */
export function grid(element, options = {}) {
  const config = {
    columns: readOption(element, options, 'columns') || '3',
    rows: readOption(element, options, 'rows') || '',
    gap: readOption(element, options, 'gap') || '1rem',
    minWidth: readOption(element, options, 'minWidth') || '',
    align: options.align || element.getAttribute('align') || '',
    justify: options.justify || element.getAttribute('justify') || '',
    center: options.center ?? element.hasAttribute('center'),
    background: options.background || element.getAttribute('background') || '',
    altRows: options.altRows ?? hasAuthoredAttr(element, 'alt-rows'),
    headers: options.headers || element.getAttribute('headers') || '',
    ...options
  };

  // #448: no classList.add('x-grid') -- layout.css already selects the
  // `x-grid` TAG directly (grid-template-columns default etc.), so the
  // class never did anything a tag selector couldn't.
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-grid> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-grid> tag does not get a redundant class.
  element.classList.add('x-grid');

  let gridTemplateColumns;
  if (config.minWidth) {
    // Explicit min-width: use auto-fit with minmax
    gridTemplateColumns = `repeat(auto-fit, minmax(${config.minWidth}, 1fr))`;
  } else {
    // Smart default: auto-fit with sensible min-width based on column count
    // This is mobile-first — columns collapse naturally on small screens
    const defaultMins = { '2': '280px', '3': '250px', '4': '200px', '5': '180px', '6': '150px' };
    const autoMin = defaultMins[config.columns] || '250px';
    gridTemplateColumns = `repeat(auto-fit, minmax(min(${autoMin}, 100%), 1fr))`;
  }

  // `center` is a shorthand for aligning + centering item content in one step.
  const alignItems = config.center ? 'center' : config.align;
  const justifyItems = config.center ? 'center' : config.justify;

  // display:grid, the 1rem gap and the 3-column template are layout.css's
  // .x-grid defaults; only what differs travels (#779).
  setRule(element, 'layout', onlyChanged({
    gap: config.gap,
    gridTemplateColumns,
    gridTemplateRows: config.rows ? `repeat(${config.rows}, auto)` : '',
    alignItems,
    justifyItems,
    textAlign: config.center ? 'center' : '',
    // #907: a theme name (background="bg-tertiary") or any CSS colour.
    background: themeColor(config.background),
  }, {
    gap: '1rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))',
  }));

  if (config.altRows) {
    element.classList.add('x-grid--alt-rows');
  }

  // Guard against re-wrapping on a second scan (re-running the behavior on an
  // already-processed element would otherwise duplicate the header cells).
  if (config.headers && !element.querySelector(':scope > .x-grid__header')) {
    const headerNames = config.headers.split(',').map((h) => h.trim()).filter(Boolean);
    const frag = document.createDocumentFragment();
    headerNames.forEach((name) => {
      const cell = document.createElement('div');
      cell.className = 'x-grid__header';
      cell.textContent = name;
      frag.appendChild(cell);
    });
    element.insertBefore(frag, element.firstChild);
  }

  return () => {
    clearRules(element);
    element.classList.remove('x-grid--alt-rows');
  };
}

/**
 * Flex - Flexbox layout
 * Custom Tag: <div x-flex> or <div>
 */
export function flex(element, options = {}) {
  const config = {
    direction: readOption(element, options, 'direction') || 'row',
    wrap: readOption(element, options, 'wrap') || 'wrap',
    justify: readOption(element, options, 'justify') || 'flex-start',
    align: readOption(element, options, 'align') || 'stretch',
    gap: readOption(element, options, 'gap') || '1rem',
    ...options
  };

  element.classList.add('x-flex');
  // Defaults are layout.css's .x-flex; only author changes travel (#779).
  setRule(element, 'layout', onlyChanged({
    flexDirection: config.direction,
    flexWrap: config.wrap,
    justifyContent: config.justify,
    alignItems: config.align,
    gap: config.gap,
  }, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'stretch', gap: '1rem' }));

  return () => { clearRules(element); element.classList.remove('x-flex'); };
}

/**
 * Container - Full-featured layout container
 * Supports: Stack (column), Row (horizontal), Grid (columns > 1)
 * User controls: direction, columns, gap, align, justify, wrap, padding
 * Custom Tag: <div x-container>
 */
export function container(element, options = {}) {
  const config = {
    direction: readOption(element, options, 'direction') || 'column',
    columns: parseInt(readOption(element, options, 'columns') || '1'),
    gap: readOption(element, options, 'gap') || '1rem',
    align: readOption(element, options, 'align') || 'stretch',
    justify: readOption(element, options, 'justify') || 'start',
    wrap: (options.wrap ?? readAttr(element, 'wrap') ?? element.getAttribute('wrap')) !== 'false',
    padding: options.padding || element.dataset.padding || element.getAttribute('padding') || '1rem',
    maxWidth: readOption(element, options, 'maxWidth') || '',
    ...options
  };

  // #448: no classList.add('x-container') -- effects.css's .x-container
  // selector was converted to the `x-container` TAG selector.
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-container> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-container> tag does not get a redundant class.
  element.classList.add('x-container');

  // Map align/justify values to CSS
  const alignMap = { start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch' };
  const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end', 'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly' };
  
  // Determine layout mode. layout.css's .x-container is the flex-mode
  // default and .x-container--grid the grid-mode one (#779); only what the
  // author changed from those travels as a generated rule.
  const decls = {
    alignItems: alignMap[config.align] || config.align,
    justifyContent: justifyMap[config.justify] || config.justify,
    gap: config.gap,
    padding: config.padding,
  };
  const defaults = { alignItems: 'stretch', justifyContent: 'flex-start', gap: '1rem', padding: '1rem' };
  if (config.columns === 1) {
    // FLEX MODE: Stack (column) or Row (row)
    decls.flexDirection = config.direction;
    decls.flexWrap = config.wrap ? 'wrap' : 'nowrap';
    Object.assign(defaults, { flexDirection: 'column', flexWrap: 'wrap' });
  } else {
    // GRID MODE: Multiple columns (mobile-first with auto-fit)
    element.classList.add('x-container--grid');
    const defaultMins = { 2: '280px', 3: '250px', 4: '200px', 5: '180px', 6: '150px' };
    const autoMin = defaultMins[config.columns] || '250px';
    decls.gridTemplateColumns = `repeat(auto-fit, minmax(min(${autoMin}, 100%), 1fr))`;
    defaults.gridTemplateColumns = 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))';
  }

  // Apply max-width if set
  if (config.maxWidth) {
    Object.assign(decls, { maxWidth: config.maxWidth, marginLeft: 'auto', marginRight: 'auto' });
  }
  setRule(element, 'layout', onlyChanged(decls, defaults));

  return () => {
    clearRules(element);
    element.classList.remove('x-container--grid');
  };
}

/**
 * Stack - Vertical stack layout
 * Custom Tag: <div x-stack> or <div>
 */
export function stack(element, options = {}) {
  const config = {
    gap: readOption(element, options, 'gap') || '1rem',
    // Parity with the retired <div> custom element (v3: behavior, not a
    // class that `extends HTMLElement`). These are optional.
    justify: options.justify || element.getAttribute('justify') || '',
    align: options.align || element.getAttribute('align') || '',
    wrap: options.wrap || element.getAttribute('wrap') || '',
    // stack.schema.json declares these three with descriptions and worked
    // examples, so the docs and showcase have always offered them -- and
    // nothing read them (#861). Pass-through CSS values by design: the schema
    // says "any valid CSS colour / padding / border-radius", so there is no
    // enum to validate against and no modifier class to mint.
    bg: options.bg || element.getAttribute('bg') || '',
    pad: options.pad || element.getAttribute('pad') || '',
    radius: options.radius || element.getAttribute('radius') || '',
    ...options
  };

  // #448: no classList.add('x-stack') -- no CSS selector anywhere depends
  // on the bare class.
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-stack> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-stack> tag does not get a redundant class.
  element.classList.add('x-stack');
  // display/direction/1rem gap: layout.css's .x-stack (#779).
  setRule(element, 'layout', onlyChanged({
    gap: config.gap,
    justifyContent: config.justify,
    alignItems: config.align,
    flexWrap: config.wrap,
    background: themeColor(config.bg),   // #907: theme name or CSS colour
    padding: config.pad,
    borderRadius: config.radius,
  }, { gap: '1rem' }));

  return () => clearRules(element);
}

/**
 * Cluster - Horizontal cluster layout
 * Custom Tag: <div x-cluster>
 */
export function cluster(element, options = {}) {
  const config = {
    gap: readOption(element, options, 'gap') || '1rem',
    justify: readOption(element, options, 'justify') || 'flex-start',
    align: readOption(element, options, 'align') || 'center',
    ...options
  };

  // #448: no classList.add('x-cluster') -- no CSS selector anywhere
  // depends on the bare class.
  // #448 removed this class outright; restored WITH the tag-name guard.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <div x-cluster> the tag is "div" -- so without the class nothing covers
  // it. Guarded so a literal <x-cluster> tag does not get a redundant class.
  element.classList.add('x-cluster');
  // Defaults: layout.css's .x-cluster (#779).
  setRule(element, 'layout', onlyChanged({
    gap: config.gap,
    justifyContent: config.justify,
    alignItems: config.align,
  }, { gap: '1rem', justifyContent: 'flex-start', alignItems: 'center' }));

  return () => clearRules(element);
}

/**
 * Center - Center content
 * Custom Tag: <div x-center>
 */
export function center(element, options = {}) {
  const config = {
    maxWidth: readOption(element, options, 'maxWidth') || '',
    gutters: options.gutters || element.dataset.gutters || element.getAttribute('gutters') || '1rem',
    intrinsic: options.intrinsic ?? (readFlag(element, 'intrinsic') || element.hasAttribute('intrinsic')),
    ...options
  };

  element.classList.add('x-center');

  // .x-center / .x-center--intrinsic in layout.css (#779); max-width and
  // non-default gutters travel as a generated rule.
  if (config.intrinsic) {
    element.classList.add('x-center--intrinsic');
  } else {
    setRule(element, 'layout', onlyChanged({
      maxWidth: config.maxWidth,
      paddingLeft: config.gutters,
      paddingRight: config.gutters,
    }, { paddingLeft: '1rem', paddingRight: '1rem' }));
  }

  return () => {
    clearRules(element);
    element.classList.remove('x-center', 'x-center--intrinsic');
  };
}

/**
 * Sidebar Layout - Main content with sidebar
 * Custom Tag: <div>
 */
export function sidebarlayout(element, options = {}) {
  const config = {
    side: options.side || element.dataset.side || element.getAttribute('side') || 'left',
    sideWidth: options.sideWidth || element.dataset.sideWidth || authoredAttr(element, 'side-width') || '300px',
    contentMin: options.contentMin || element.dataset.contentMin || authoredAttr(element, 'content-min') || '50%',
    gap: readOption(element, options, 'gap') || '1rem',
    ...options
  };

  element.classList.add('x-sidebarlayout');
  // The side/main split is .x-sidebarlayout__side / __main in layout.css,
  // sized by custom properties that travel on the host as a generated rule
  // only when the author changed them (#779).
  setRule(element, 'layout', onlyChanged({
    gap: config.gap,
    '--x-sidebar-width': config.sideWidth,
    '--x-sidebar-content-min': config.contentMin,
  }, { gap: '1rem', '--x-sidebar-width': '300px', '--x-sidebar-content-min': '50%' }));

  const children = Array.from(element.children);
  let side = null;
  let main = null;
  if (children.length >= 2) {
    const sideIndex = config.side === 'left' ? 0 : 1;
    const mainIndex = config.side === 'left' ? 1 : 0;
    side = children[sideIndex];
    main = children[mainIndex];
    side.classList.add('x-sidebarlayout__side');
    main.classList.add('x-sidebarlayout__main');
  }

  return () => {
    clearRules(element);
    if (side) side.classList.remove('x-sidebarlayout__side');
    if (main) main.classList.remove('x-sidebarlayout__main');
    element.classList.remove('x-sidebarlayout');
  };
}

/**
 * Switcher - Responsive switch layout
 * Custom Tag: <div x-switcher>
 */
export function switcher(element, options = {}) {
  const config = {
    threshold: readOption(element, options, 'threshold') || '30rem',
    gap: readOption(element, options, 'gap') || '1rem',
    limit: parseInt(readOption(element, options, 'limit') || '4'),
    ...options
  };

  // #557: only a host whose tag ISN'T already x-switcher needs the class --
  // the tag selector already covers styling for real <div x-switcher> elements,
  // so adding it unconditionally trips no-redundant-tag-name-class.spec.ts
  // (demos/layout-test.html). Same guard pattern as article()/articles()
  // (src/wb-viewmodels/article.js, #523/#528) and chip() (feedback.js, #521).
  element.classList.add('x-switcher');
  // The flex host and each child's grow/basis are layout.css's .x-switcher
  // and .x-switcher__item, reading --x-switcher-threshold (#779).
  setRule(element, 'layout', onlyChanged({
    gap: config.gap,
    '--x-switcher-threshold': config.threshold,
  }, { gap: '1rem', '--x-switcher-threshold': '30rem' }));

  const unclassChildren = classChildren(element, 'x-switcher__item');
  // #1279: limit was read and never used. More items than the limit stack.
  element.classList.toggle('x-switcher--stacked', element.children.length > config.limit);

  return () => {
    clearRules(element);
    unclassChildren();
    element.classList.remove('x-switcher', 'x-switcher--stacked');
  };
}

/**
 * Masonry - Masonry layout
 * Custom Tag: <div>
 */
export function masonry(element, options = {}) {
  const config = {
    columns: parseInt(readOption(element, options, 'columns') || '3'),
    gap: readOption(element, options, 'gap') || '1rem',
    ...options
  };

  element.classList.add('x-masonry');
  // .x-masonry / .x-masonry__item in layout.css read --x-masonry-gap (#779).
  setRule(element, 'layout', onlyChanged({
    columnCount: config.columns,
    '--x-masonry-gap': config.gap,
  }, { columnCount: 3, '--x-masonry-gap': '1rem' }));

  const unclassItems = classChildren(element, 'x-masonry__item');

  return () => {
    clearRules(element);
    unclassItems();
    element.classList.remove('x-masonry');
  };
}

/**
 * Sticky - Sticky positioning
 * Custom Tag: <div x-sticky>
 */
export function sticky(element, options = {}) {
  const config = {
    top: options.top || element.dataset.top || element.getAttribute('top') || '0',
    bottom: options.bottom || element.dataset.bottom || element.getAttribute('bottom') || '',
    zIndex: readOption(element, options, 'zIndex') || '100',
    ...options
  };

  element.classList.add('x-sticky', 'x-sticky--layout');
  // .x-sticky--layout in layout.css; author offsets travel as a rule (#779).
  setRule(element, 'layout', onlyChanged({
    top: config.top,
    bottom: config.bottom,
    zIndex: config.zIndex,
  }, { top: '0', zIndex: '100' }));

  return () => { clearRules(element); element.classList.remove('x-sticky', 'x-sticky--layout'); };
}

/**
 * Fixed - Fixed positioning
 */
export function fixed(element, options = {}) {
  const config = {
    position: readOption(element, options, 'position') || 'bottom-right',
    offset: readOption(element, options, 'offset') || '1rem',
    zIndex: readOption(element, options, 'zIndex') || '1000',
    ...options
  };

  // Placement per position is an .x-fixed--{position} class in layout.css,
  // reading --x-fixed-offset; only a changed offset/z-index travels (#779).
  const positions = ['top-left', 'top-right', 'top-center', 'bottom-left', 'bottom-right', 'bottom-center', 'center'];
  const position = positions.includes(config.position) ? config.position : 'bottom-right';
  element.classList.add('x-fixed', `x-fixed--${position}`);
  setRule(element, 'layout', onlyChanged({
    zIndex: config.zIndex,
    '--x-fixed-offset': config.offset,
  }, { zIndex: '1000', '--x-fixed-offset': '1rem' }));

  return () => { clearRules(element); element.classList.remove('x-fixed', `x-fixed--${position}`); };
}

/**
 * Scrollable - Scrollable container
 */
export function scrollable(element, options = {}) {
  const config = {
    direction: readOption(element, options, 'direction') || 'both',
    maxHeight: readOption(element, options, 'maxHeight') || '',
    maxWidth: readOption(element, options, 'maxWidth') || '',
    ...options
  };

  element.classList.add('x-scrollable');

  // .x-scrollable--y / --x in layout.css; max sizes travel as a rule (#779).
  const decls = {};
  if (config.direction === 'vertical' || config.direction === 'both') {
    element.classList.add('x-scrollable--y');
    decls.maxHeight = config.maxHeight;
  }
  if (config.direction === 'horizontal' || config.direction === 'both') {
    element.classList.add('x-scrollable--x');
    decls.maxWidth = config.maxWidth;
  }
  setRule(element, 'layout', onlyChanged(decls));

  return () => {
    clearRules(element);
    element.classList.remove('x-scrollable', 'x-scrollable--x', 'x-scrollable--y');
  };
}

/**
 * Cover - Cover layout
 * Custom Tag: <div x-cover>
 */
export function cover(element, options = {}) {
  const config = {
    minHeight: options.minHeight || element.dataset.minHeight || authoredAttr(element, 'min-height') || '100vh',
    padding: options.padding || element.dataset.padding || element.getAttribute('padding') || '1rem',
    ...options
  };

  element.classList.add('x-cover');
  // .x-cover in layout.css; changed min-height/padding travel as a rule (#779).
  setRule(element, 'layout', onlyChanged({
    minHeight: config.minHeight,
    padding: config.padding,
  }, { minHeight: '100vh', padding: '1rem' }));

  // What gets centred is read from the markup itself, not from a marker
  // attribute (John: "what is data-principal? remove it"). A <header> and a
  // <footer> child pin to the top and bottom edges; everything between them is
  // centred as one group. With neither, the whole content is centred -- which
  // is what "Vertically centred" in the example always claimed and never did.
  const children = Array.from(element.children);
  const isEdge = (el) => el.tagName === 'HEADER' || el.tagName === 'FOOTER';
  const middle = children.filter((el) => !isEdge(el));
  if (middle.length && middle.length < children.length) {
    middle[0].classList.add('x-cover__middle-start');
    middle[middle.length - 1].classList.add('x-cover__middle-end');
  } else {
    element.classList.add('x-cover--centered');
  }

  return () => {
    clearRules(element);
    middle.forEach((el) => el.classList.remove('x-cover__middle-start', 'x-cover__middle-end'));
    element.classList.remove('x-cover', 'x-cover--centered');
  };
}

/**
 * Frame - Aspect ratio frame
 * Custom Tag: <div x-frame>
 */
export function frame(element, options = {}) {
  const config = {
    ratio: readOption(element, options, 'ratio') || '16/9',
    ...options
  };

  element.classList.add('x-frame');
  // #1003 -- only the ratio varies, so it travels as a custom property; the
  // rest is constant and lives in the stylesheet. #779: and that property is
  // a generated rule, not element.style, and only when it is not the 16/9
  // default the stylesheet already falls back to.
  setRule(element, 'layout', onlyChanged({ '--x-frame-ratio': config.ratio }, { '--x-frame-ratio': '16/9' }));

  const child = element.firstElementChild;
  if (child) child.classList.add('x-frame__content');

  return () => { clearRules(element); element.classList.remove('x-frame'); };
}

/**
 * Reel - Horizontal scroll reel
 * Custom Tag: <div x-reel>
 */
export function reel(element, options = {}) {
  const config = {
    itemWidth: options.itemWidth || element.dataset.itemWidth || authoredAttr(element, 'item-width') || 'auto',
    gap: readOption(element, options, 'gap') || '1rem',
    ...options
  };

  element.classList.add('x-reel');
  // .x-reel / .x-reel__item in layout.css (#779). An item-width is a
  // custom property the items read, and only under --sized, so an item's own
  // width is untouched unless the author asked for one.
  if (config.itemWidth !== 'auto') element.classList.add('x-reel--sized');
  setRule(element, 'layout', onlyChanged({
    gap: config.gap,
    '--x-reel-item-width': config.itemWidth,
  }, { gap: '1rem', '--x-reel-item-width': 'auto' }));

  const unclassChildren = classChildren(element, 'x-reel__item');

  return () => {
    clearRules(element);
    unclassChildren();
    element.classList.remove('x-reel', 'x-reel--sized');
  };
}

/**
 * Imposter - Overlay imposter
 */
export function imposter(element, options = {}) {
  const config = {
    breakout: options.breakout ?? (readFlag(element, 'breakout') || element.hasAttribute('breakout')),
    margin: options.margin || element.dataset.margin || element.getAttribute('margin') || '0',
    ...options
  };

  element.classList.add('x-imposter');
  // .x-imposter / --breakout / --contained in layout.css (#779); the margin
  // is an author value and travels as --x-imposter-margin.
  if (config.breakout) element.classList.add('x-imposter--breakout');
  if (config.margin !== '0') {
    element.classList.add('x-imposter--contained');
    setRule(element, 'layout', { '--x-imposter-margin': config.margin });
  }

  return () => {
    clearRules(element);
    element.classList.remove('x-imposter', 'x-imposter--breakout', 'x-imposter--contained');
  };
}

/**
 * Icon - Icon layout helper
 * Custom Tag: <span x-icon>
 */
export function icon(element, options = {}) {
  const config = {
    size: readOption(element, options, 'size') || '1em',
    space: options.space || element.dataset.space || element.getAttribute('space') || '0.5em',
    ...options
  };

  element.classList.add('x-icon');
  // .x-icon / .x-icon__svg in layout.css read --x-icon-size (#779).
  setRule(element, 'layout', onlyChanged({
    gap: config.space,
    '--x-icon-size': config.size,
  }, { gap: '0.5em', '--x-icon-size': '1em' }));

  const svg = element.querySelector('svg');
  if (svg) svg.classList.add('x-icon__svg');

  return () => {
    clearRules(element);
    if (svg) svg.classList.remove('x-icon__svg');
    element.classList.remove('x-icon');
  };
}

/**
 * Drawer Layout - Collapsible container that pulls to the edge
 * Custom Tag: <div x-drawer>
 */
export function drawerLayout(element, options = {}) {
  const config = {
    position: readOption(element, options, 'position') || 'left',
    width: readOption(element, options, 'width') || '250px',
    height: readOption(element, options, 'height') || '250px',
    minWidth: readOption(element, options, 'minWidth') || '1.5rem',
    minHeight: options.minHeight || element.dataset.minHeight || authoredAttr(element, 'min-height') || '1.5rem',
    maxWidth: readOption(element, options, 'maxWidth') || '50vw',
    maxHeight: readOption(element, options, 'maxHeight') || '50vh',
    resizable: options.resizable ?? (element.dataset.resizable === 'true' || element.getAttribute('resizable') === 'true'),
    saveState: options.saveState ?? (element.dataset.saveState === 'true' || authoredAttr(element, 'save-state') === 'true'),
    // Declared in drawerLayout.schema.json ("Initial collapsed state") and
    // read by nothing: every-declared-attribute.spec.ts only ever passed it
    // because the old inline style attribute serialised in a different
    // position on the probe than on its baseline, a difference in outerHTML
    // that had nothing to do with `collapsed`. With the inline styles gone
    // (#779) that accident went too, and the attribute was plainly inert.
    collapsed: options.collapsed ?? readFlag(element, 'collapsed'),
    id: options.id || element.id || 'drawer',
    toggleSelector: options.toggleSelector || element.dataset.toggleSelector || authoredAttr(element, 'toggle-selector'),
    handleSelector: options.handleSelector || element.dataset.handleSelector || authoredAttr(element, 'handle-selector'),
    ...options
  };

  // The host class is named for the behavior, drawerLayout -> x-drawerlayout
  // (#1096), not for the x-drawer-layout attribute that applies it.
  // permutation-compliance requires compliance.baseClass to cover the host
  // (classList.contains(cls) || tagName === cls), and on an attribute host
  // like <aside x-drawer-layout> the tag is "aside", so without the class
  // nothing covers it (#448). 'x-drawer' (below) is a different class that
  // layout.css's x-drawer visibility rules rely on.
  element.classList.add('x-drawerlayout');
  element.classList.add('x-drawer');
  
  const isVertical = config.position === 'top' || config.position === 'bottom';
  const storageKeyWidth = `x-drawer-${config.id}-width`;
  const storageKeyCollapsed = `x-drawer-${config.id}-collapsed`;
  
  // Restore state
  let savedWidth = config.saveState ? localStorage.getItem(storageKeyWidth) : null;
  // A saved state wins over the authored initial one, as a saved width does.
  const savedCollapsed = config.saveState ? localStorage.getItem(storageKeyCollapsed) : null;
  let isCollapsed = savedCollapsed !== null ? savedCollapsed === 'true' : !!config.collapsed;

  // Base styles: position/display/direction/transition are layout.css's
  // .x-drawerlayout (and --vertical); overflow/border while collapsed are
  // .x-drawerlayout.collapsed (#779). The size is the author's width/height
  // or a dragged one, so it travels as a generated rule -- one slot holding
  // size, min-size and flex-basis together, as the three always move as one.
  const setSize = (size) => setRule(element, 'size', isVertical
    ? { height: size, minHeight: size, flexBasis: size }
    : { width: size, minWidth: size, flexBasis: size });

  // The toggle button and handle are sized from the collapsed size; they read
  // it from these properties rather than having it written onto them.
  setRule(element, 'layout', onlyChanged({
    maxWidth: isVertical ? '' : config.maxWidth,
    maxHeight: isVertical ? config.maxHeight : '',
    '--x-drawer-min-width': config.minWidth,
    '--x-drawer-min-height': config.minHeight,
  }, { '--x-drawer-min-width': '1.5rem', '--x-drawer-min-height': '1.5rem' }));

  if (isVertical) {
     element.classList.add('x-drawerlayout--vertical');
     // Initial state
     const initialHeight = savedWidth || config.height;
     setSize(isCollapsed ? config.minHeight : initialHeight);
     element.dataset.originalSize = initialHeight;
  } else {
     // Initial state
     const initialWidth = savedWidth || config.width;
     setSize(isCollapsed ? config.minWidth : initialWidth);
     element.dataset.originalSize = initialWidth;
  }

  if (isCollapsed) {
    element.classList.add('collapsed');
  }
  
  // Arrow logic -- must live in this outer scope (not nested inside the
  // toggleSelector-less branch below where it's first used to set the
  // initial arrow) since toggle() below is a closure over THIS scope and
  // referenced getArrow before it was ever declared here (live error:
  // "getArrow is not defined" on every toggle click).
  const getArrow = (collapsed) => {
    if (config.position === 'left') return collapsed ? '▶' : '◀';
    if (config.position === 'right') return collapsed ? '◀' : '▶';
    if (config.position === 'top') return collapsed ? '▼' : '▲';
    if (config.position === 'bottom') return collapsed ? '▲' : '▼';
    return '?';
  };

  // Toggle Logic
  const toggle = () => {
    isCollapsed = !isCollapsed;
    if (config.saveState) localStorage.setItem(storageKeyCollapsed, isCollapsed);
    
    // Update arrow if using default button
    if (toggleBtn && !config.toggleSelector) {
      toggleBtn.innerHTML = getArrow(isCollapsed);
    }
    
    // The collapsed class hides overflow and the border (layout.css); taking
    // it off restores whatever border the stylesheet gives the drawer, so
    // nothing has to be remembered and written back.
    if (isCollapsed) {
      element.classList.add('collapsed');
      setSize(isVertical ? config.minHeight : config.minWidth);
    } else {
      element.classList.remove('collapsed');
      const restoredSize = element.dataset.originalSize || (isVertical ? config.height : config.width);
      setSize(restoredSize);
    }
    // #344: drawerLayout.schema.json declares this event; nothing fired it.
    element.dispatchEvent(new CustomEvent('wb:drawerLayout:toggle', { bubbles: true, detail: { collapsed: isCollapsed } }));
  };

  // Expose toggle function on element
  element.wbToggle = toggle;

  // Setup Toggle Button
  let toggleBtn;
  if (config.toggleSelector) {
    toggleBtn = document.querySelector(config.toggleSelector);
    if (toggleBtn) toggleBtn.addEventListener('click', toggle);
  } else {
    // Create default toggle button
    toggleBtn = document.createElement('button');
    toggleBtn.className = 'x-drawerlayout__toggle';
    
    toggleBtn.innerHTML = getArrow(isCollapsed);
    
    // Chrome and per-position placement: .x-drawerlayout__toggle and
    // .x-drawerlayout__toggle--{position} in layout.css (#779).
    toggleBtn.classList.add(`x-drawerlayout__toggle--${config.position}`);
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      toggle();
    };
    element.appendChild(toggleBtn);
  }

  // Resizable Logic
  let resizeCleanup = null;
  if (config.resizable) {
    let handle;
    if (config.handleSelector) {
      handle = document.querySelector(config.handleSelector);
    } else {
      handle = document.createElement('div');
      // Placement per position: .x-drawerlayout__handle--{position} in layout.css (#779).
      handle.className = `x-drawerlayout__handle x-drawerlayout__handle--${config.position}`;
      element.appendChild(handle);
    }

    if (handle) {
      let isResizing = false;
      let startX, startY, startSize;

      const onMouseDown = (e) => {
        // If collapsed, clicking handle expands it
        if (isCollapsed) {
          toggle();
          return;
        }
        
        e.preventDefault();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startSize = isVertical ? element.offsetHeight : element.offsetWidth;
        
        // Create overlay for cursor handling (Compliance: No body.style modification)
        const overlay = document.createElement('div');
        overlay.id = 'x-resize-overlay';
        // .x-drawerlayout__resize-overlay in layout.css (#779).
        overlay.className = `x-drawerlayout__resize-overlay x-drawerlayout__resize-overlay--${isVertical ? 'row' : 'col'}`;
        document.body.appendChild(overlay);
        
        element.classList.add('resizing');
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      let rAF = null;

      const onMouseMove = (e) => {
        if (!isResizing) return;
        
        const clientX = e.clientX;
        const clientY = e.clientY;

        if (rAF) return;

        rAF = requestAnimationFrame(() => {
          let newSize = startSize;
          if (config.position === 'left') newSize = startSize + (clientX - startX);
          else if (config.position === 'right') newSize = startSize - (clientX - startX);
          else if (config.position === 'top') newSize = startSize + (clientY - startY);
          else if (config.position === 'bottom') newSize = startSize - (clientY - startY);
          
          // Constraints
          // Calculate min in pixels
          let minStr = isVertical ? config.minHeight : config.minWidth;
          let min = 0;
          if (minStr && typeof minStr === 'string') {
            if (minStr.endsWith('rem')) {
              min = parseFloat(minStr) * 16; // Approx
            } else if (minStr.endsWith('px')) {
              min = parseFloat(minStr);
            } else {
              min = parseFloat(minStr);
            }
          }
          if (!min) min = 20; // Default fallback

          // Calculate max in pixels (handling vw, vh, %, px)
          let maxStr = isVertical ? config.maxHeight : config.maxWidth;
          let max;
          
          if (maxStr && typeof maxStr === 'string') {
            if (maxStr.endsWith('vw')) {
              max = (parseFloat(maxStr) / 100) * window.innerWidth;
            } else if (maxStr.endsWith('vh')) {
              max = (parseFloat(maxStr) / 100) * window.innerHeight;
            } else if (maxStr.endsWith('%')) {
               const parentSize = isVertical ? (element.parentElement?.clientHeight || window.innerHeight) : (element.parentElement?.clientWidth || window.innerWidth);
               max = (parseFloat(maxStr) / 100) * parentSize;
            } else {
              max = parseFloat(maxStr);
            }
          }
          
          if (!max) {
             max = (isVertical ? window.innerHeight : window.innerWidth) * 0.8;
          }
          
          newSize = Math.max(min, Math.min(max, newSize));
          
          setSize(newSize + 'px');
          rAF = null;
        });
      };

      const onMouseUp = () => {
        if (isResizing) {
          isResizing = false;
          if (rAF) {
            cancelAnimationFrame(rAF);
            rAF = null;
          }
          
          // Remove overlay
          const resizeOverlay = document.getElementById('x-resize-overlay');
          if (resizeOverlay) resizeOverlay.remove();
          
          element.classList.remove('resizing');
          
          // Save new size
          const finalSize = isVertical ? element.offsetHeight : element.offsetWidth;
          element.dataset.originalSize = finalSize + 'px';
          if (config.saveState) {
            localStorage.setItem(storageKeyWidth, finalSize);
          }
          
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        }
      };

      handle.addEventListener('mousedown', onMouseDown);
      resizeCleanup = () => {
        handle.removeEventListener('mousedown', onMouseDown);
        if (!config.handleSelector) handle.remove();
      };
    }
  }

  return () => {
    element.classList.remove('x-drawerlayout', 'x-drawer', 'collapsed', 'resizing');
    if (toggleBtn && !config.toggleSelector) toggleBtn.remove();
    if (config.toggleSelector && toggleBtn) toggleBtn.removeEventListener('click', toggle);
    if (resizeCleanup) resizeCleanup();
    
    clearRules(element);
    element.classList.remove('x-drawerlayout--vertical');
    delete element.wbToggle;
  };
}

export default {
  grid, flex, container, stack, cluster, center, sidebarlayout,
  switcher, masonry, sticky, fixed, scrollable, cover, frame, reel, imposter, icon, drawerLayout
};
