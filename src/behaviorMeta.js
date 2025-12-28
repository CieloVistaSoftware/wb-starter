/**
 * WB Behavior Metadata
 * ====================
 * Defines how each behavior works in the builder:
 * - type: element | container | modifier | action
 * - element: preferred HTML element
 * - attachTo: what elements it can attach to
 * - target: whether action needs a target
 * - template: HTML template for complex behaviors
 */

export const behaviorMeta = {
  
  // ============================================
  // ELEMENTS - Standalone, have preferred element
  // ============================================
  
  // Cards (19) - all use <article> except special cases
  card:             { type: 'element', element: 'article', canContain: true },
  cardimage:        { type: 'element', element: 'article', canContain: true },
  cardvideo:        { type: 'element', element: 'article', canContain: true },
  cardbutton:       { type: 'element', element: 'article', canContain: true },
  cardhero:         { type: 'element', element: 'section', canContain: true },
  cardprofile:      { type: 'element', element: 'article', canContain: true },
  cardpricing:      { type: 'element', element: 'article', canContain: true },
  cardstats:        { type: 'element', element: 'article', canContain: true },
  cardtestimonial:  { type: 'element', element: 'blockquote', canContain: true },
  cardproduct:      { type: 'element', element: 'article', canContain: true },
  cardnotification: { type: 'element', element: 'article', canContain: true },
  cardfile:         { type: 'element', element: 'article', canContain: true },
  cardlink:         { type: 'element', element: 'a', canContain: true },
  cardhorizontal:   { type: 'element', element: 'article', canContain: true },
  carddraggable:    { type: 'element', element: 'article', canContain: true },
  cardexpandable:   { type: 'element', element: 'article', canContain: true },
  cardminimizable:  { type: 'element', element: 'article', canContain: true },
  cardoverlay:      { type: 'element', element: 'article', canContain: true },
  cardportfolio:    { type: 'element', element: 'article', canContain: true },
  
  // UI Core
  hero:        { type: 'element', element: 'section', canContain: true },
  details:     { type: 'element', element: 'details', canContain: true },
  collapse:    { type: 'element', element: 'details', canContain: true }, // alias
  progressbar: { type: 'element', element: 'progress' },
  progress:    { type: 'element', element: 'progress' },
  
  // Feedback (10)
  badge:    { type: 'element', element: 'span' },
  avatar:   { type: 'element', element: 'img', fallback: 'span' },
  chip:     { type: 'element', element: 'span' },
  alert:    { type: 'element', element: 'div', role: 'alert' },
  skeleton: { type: 'element', element: 'div' },
  divider:  { type: 'element', element: 'hr' },
  spinner:  { type: 'element', element: 'div', role: 'status' },
  
  // Navigation (8)
  breadcrumb: { type: 'element', element: 'nav', ariaLabel: 'Breadcrumb' },
  navbar:     { type: 'element', element: 'nav', canContain: true },
  sidebar:    { type: 'element', element: 'aside', canContain: true },
  menu:       { type: 'element', element: 'nav', canContain: true },
  pagination: { type: 'element', element: 'nav', ariaLabel: 'Pagination' },
  steps:      { type: 'element', element: 'ol', canContain: true },
  treeview:   { type: 'element', element: 'ul', canContain: true },
  link:       { type: 'element', element: 'a' },
  
  // Data Display (10)
  table:    { type: 'element', element: 'table', canContain: true },
  list:     { type: 'element', element: 'ul', canContain: true },
  desclist: { type: 'element', element: 'dl', canContain: true },
  timeline: { type: 'element', element: 'ol', canContain: true },
  stat:     { type: 'element', element: 'div' },
  empty:    { type: 'element', element: 'div' },
  code:     { type: 'element', element: 'pre' },
  json:     { type: 'element', element: 'pre' },
  diff:     { type: 'element', element: 'div' },
  kbd:      { type: 'element', element: 'kbd' },
  
  // Media (10)
  image:    { type: 'element', element: 'img' },
  video:    { type: 'element', element: 'video' },
  audio:    { type: 'element', element: 'audio' },
  youtube:  { type: 'element', element: 'iframe' },
  vimeo:    { type: 'element', element: 'iframe' },
  embed:    { type: 'element', element: 'iframe' },
  figure:   { type: 'element', element: 'figure', canContain: true },
  ratio:    { type: 'element', element: 'div', canContain: true },
  icon:     { type: 'element', element: 'span' },
  
  // Form Inputs - Native elements with datalist support where applicable
  input: { 
    type: 'element', 
    element: 'input',
    inputType: 'text'
  },
  textarea: { 
    type: 'element', 
    element: 'textarea' 
  },
  select: { 
    type: 'element', 
    element: 'select',
    canContain: true  // contains <option>
  },
  checkbox: { 
    type: 'element', 
    element: 'input',
    inputType: 'checkbox'
  },
  radio: { 
    type: 'element', 
    element: 'input',
    inputType: 'radio'
  },
  switch: { 
    type: 'element', 
    element: 'input',
    inputType: 'checkbox'
  },
  range: { 
    type: 'element', 
    element: 'input',
    inputType: 'range'
  },
  colorpicker: { 
    type: 'element', 
    element: 'input',
    inputType: 'color'
  },
  datepicker: { 
    type: 'element', 
    element: 'input',
    inputType: 'date'
  },
  timepicker: { 
    type: 'element', 
    element: 'input',
    inputType: 'time'
  },
  file: { 
    type: 'element', 
    element: 'input',
    inputType: 'file'
  },
  password: {
    type: 'element',
    element: 'input',
    inputType: 'password'
  },
  search: {
    type: 'element',
    element: 'search',  // Native HTML5 <search> element
    template: `
      <search class="wb-search">
        <input type="search" placeholder="Search...">
        <button type="submit">🔍</button>
      </search>
    `
  },
  
  // Form Inputs - Complex (need templates)
  autocomplete: {
    type: 'element',
    element: 'div',
    usesDatalist: true,
    template: `
      <div class="wb-autocomplete-group">
        <input type="text" list="{{id}}-list" class="wb-autocomplete" placeholder="Start typing...">
        <datalist id="{{id}}-list">
          <option value="Option 1">
          <option value="Option 2">
          <option value="Option 3">
        </datalist>
      </div>
    `
  },
  otp: {
    type: 'element',
    element: 'div',
    template: `
      <div class="wb-otp" data-wb="otp" data-length="6"></div>
    `
  },
  rating: {
    type: 'element',
    element: 'div',  // Could use <meter> for display-only
    template: `
      <div class="wb-rating" data-wb="rating" data-max="5" data-value="0"></div>
    `
  },
  tags: {
    type: 'element',
    element: 'div',
    template: `
      <div class="wb-tags" data-wb="tags"></div>
    `
  },
  
  // Form Enhancements
  form:          { type: 'element', element: 'form', canContain: true },
  fieldset:      { type: 'element', element: 'fieldset', canContain: true },
  label:         { type: 'element', element: 'label' },
  help:          { type: 'element', element: 'small' },
  error:         { type: 'element', element: 'span', role: 'alert' },
  inputgroup:    { type: 'container', element: 'div', canContain: true },
  formrow:       { type: 'container', element: 'div', canContain: true },
  stepper:       { type: 'element', element: 'div' },
  
  // Time elements - use native <time>
  clock: {
    type: 'element',
    element: 'time',
    template: `
      <time class="wb-clock" data-wb="clock" datetime=""></time>
    `
  },
  countdown: {
    type: 'element',
    element: 'time',
    template: `
      <time class="wb-countdown" data-wb="countdown" datetime=""></time>
    `
  },
  relativetime: {
    type: 'element',
    element: 'time'
  },
  
  // Markdown
  mdhtml: { type: 'element', element: 'div', canContain: true },
  
  // Notes
  notes: { type: 'element', element: 'div', canContain: true },
  
  // ============================================
  // CONTAINERS - Hold child elements
  // ============================================
  
  container:     { type: 'container', element: 'section', canContain: true },
  grid:          { type: 'container', element: 'div', canContain: true, dropZone: true },
  flex:          { type: 'container', element: 'div', canContain: true, dropZone: true },
  stack:         { type: 'container', element: 'div', canContain: true, dropZone: true },
  cluster:       { type: 'container', element: 'div', canContain: true, dropZone: true },
  center:        { type: 'container', element: 'div', canContain: true, dropZone: true },
  sidebarlayout: { type: 'container', element: 'div', canContain: true, dropZone: true },
  drawerLayout:  { type: 'container', element: 'div', canContain: true, dropZone: true },
  switcher:      { type: 'container', element: 'div', canContain: true, dropZone: true },
  masonry:       { type: 'container', element: 'div', canContain: true, dropZone: true },
  scrollable:    { type: 'container', element: 'div', canContain: true, dropZone: true },
  cover:         { type: 'container', element: 'div', canContain: true, dropZone: true },
  frame:         { type: 'container', element: 'div', canContain: true, dropZone: true },
  reel:          { type: 'container', element: 'div', canContain: true, dropZone: true },
  imposter:      { type: 'container', element: 'div', canContain: true },
  
  // Special containers with child templates
  accordion: { 
    type: 'container', 
    element: 'div', 
    canContain: true,
    childElement: 'details',
    dropZone: true
  },
  tabs: { 
    type: 'container', 
    element: 'div', 
    canContain: true,
    dropZone: true
  },
  gallery: { 
    type: 'container', 
    element: 'div', 
    canContain: true,
    childElement: 'img',
    dropZone: true
  },
  carousel: { 
    type: 'container', 
    element: 'div', 
    canContain: true,
    dropZone: true
  },
  
  // ============================================
  // MODIFIERS - Attach to existing elements
  // ============================================
  
  // Animation effects
  animate:    { type: 'modifier', attachTo: 'any', multiple: true },
  fadein:     { type: 'modifier', attachTo: 'any', multiple: true },
  fadeout:    { type: 'modifier', attachTo: 'any', multiple: true },
  slidein:    { type: 'modifier', attachTo: 'any', multiple: true },
  slideout:   { type: 'modifier', attachTo: 'any', multiple: true },
  zoomin:     { type: 'modifier', attachTo: 'any', multiple: true },
  zoomout:    { type: 'modifier', attachTo: 'any', multiple: true },
  bounce:     { type: 'modifier', attachTo: 'any', multiple: true },
  shake:      { type: 'modifier', attachTo: 'any', multiple: true },
  pulse:      { type: 'modifier', attachTo: 'any', multiple: true },
  flip:       { type: 'modifier', attachTo: 'any', multiple: true },
  rotate:     { type: 'modifier', attachTo: 'any', multiple: true },
  swing:      { type: 'modifier', attachTo: 'any', multiple: true },
  tada:       { type: 'modifier', attachTo: 'any', multiple: true },
  wobble:     { type: 'modifier', attachTo: 'any', multiple: true },
  jello:      { type: 'modifier', attachTo: 'any', multiple: true },
  heartbeat:  { type: 'modifier', attachTo: 'any', multiple: true },
  flash:      { type: 'modifier', attachTo: 'any', multiple: true },
  rubberband: { type: 'modifier', attachTo: 'any', multiple: true },
  typewriter: { type: 'modifier', attachTo: 'text', multiple: false },
  countup:    { type: 'modifier', attachTo: 'text', multiple: false },
  marquee:    { type: 'modifier', attachTo: 'any', multiple: false },
  parallax:   { type: 'modifier', attachTo: 'any', multiple: false },
  reveal:     { type: 'modifier', attachTo: 'any', multiple: true },
  
  // Visual effects
  sparkle:  { type: 'modifier', attachTo: 'any', multiple: true },
  glow:     { type: 'modifier', attachTo: 'any', multiple: true },
  rainbow:  { type: 'modifier', attachTo: 'any', multiple: true },
  ripple:   { type: 'modifier', attachTo: 'clickable', multiple: false },
  
  // Layout modifiers
  draggable: { type: 'modifier', attachTo: 'any', multiple: false },
  resizable: { type: 'modifier', attachTo: 'any', multiple: false },
  sticky:    { type: 'modifier', attachTo: 'any', multiple: false },
  fixed:     { type: 'modifier', attachTo: 'any', multiple: false },
  
  // Content modifiers
  lazy:      { type: 'modifier', attachTo: 'img,iframe', multiple: false },
  truncate:  { type: 'modifier', attachTo: 'text', multiple: false },
  highlight: { type: 'modifier', attachTo: 'text', multiple: true, nativeElement: 'mark' },
  visible:   { type: 'modifier', attachTo: 'any', multiple: false },
  
  // Form modifiers
  autosize:  { type: 'modifier', attachTo: 'textarea', multiple: false },
  validator: { type: 'modifier', attachTo: 'form,input', multiple: false },
  masked:    { type: 'modifier', attachTo: 'input', multiple: false },
  counter:   { type: 'modifier', attachTo: 'input,textarea', multiple: false },
  floatinglabel: { type: 'modifier', attachTo: 'input,textarea,select', multiple: false },
  
  // ============================================
  // ACTIONS - Self-contained (no target needed)
  // ============================================
  
  share: { 
    type: 'action', 
    trigger: 'button',
    target: null,
    template: `<button data-wb="share">📤 Share</button>`
  },
  darkmode: { 
    type: 'action', 
    trigger: 'button',
    target: null,
    template: `<button data-wb="darkmode">🌓 Toggle Theme</button>`
  },
  themecontrol: { 
    type: 'action', 
    trigger: 'button',
    target: null,
    template: `<button data-wb="themecontrol">🎨 Theme</button>`
  },
  backtotop: { 
    type: 'action', 
    trigger: 'button',
    target: null,
    template: `<button data-wb="backtotop">⬆️ Back to Top</button>`
  },
  
  // ============================================
  // ACTIONS - Targeted (need trigger + target)
  // ============================================
  
  copy: {
    type: 'action',
    trigger: 'button',
    target: 'required',
    group: true,
    template: `
      <div class="wb-action-group wb-copy-group">
        <div class="wb-action-target" contenteditable="true">Text to copy</div>
        <button data-wb="copy" data-target=".wb-action-target">📋 Copy</button>
      </div>
    `
  },
  clipboard: {
    type: 'action',
    trigger: 'button',
    target: 'required',
    group: true,
    template: `
      <div class="wb-action-group wb-clipboard-group">
        <code class="wb-action-target">npm install wb-framework</code>
        <button data-wb="clipboard" data-target=".wb-action-target">📋</button>
      </div>
    `
  },
  print: {
    type: 'action',
    trigger: 'button',
    target: 'required',
    group: true,
    template: `
      <div class="wb-action-group wb-print-group">
        <div class="wb-action-target">
          <h3>Printable Content</h3>
          <p>This content will be printed.</p>
        </div>
        <button data-wb="print" data-target=".wb-action-target">🖨️ Print</button>
      </div>
    `
  },
  fullscreen: {
    type: 'action',
    trigger: 'button',
    target: 'required',
    group: true,
    template: `
      <div class="wb-action-group wb-fullscreen-group">
        <div class="wb-action-target" style="min-height:200px;background:var(--bg-secondary);">
          <p>Fullscreen content area</p>
        </div>
        <button data-wb="fullscreen" data-target=".wb-action-target">⛶ Fullscreen</button>
      </div>
    `
  },
  scroll: {
    type: 'action',
    trigger: 'button',
    target: 'required',
    template: `<button data-wb="scroll" data-target="#section">↓ Scroll To</button>`
  },
  toggle: {
    type: 'action',
    trigger: 'button',
    target: 'required',
    group: true,
    template: `
      <div class="wb-action-group wb-toggle-group">
        <button data-wb="toggle" data-target=".wb-action-target">👁️ Toggle</button>
        <div class="wb-action-target">
          <p>This content can be toggled.</p>
        </div>
      </div>
    `
  },
  external: {
    type: 'action',
    trigger: 'a',
    target: null,
    template: `<a href="https://example.com" data-wb="external" target="_blank">External Link ↗</a>`
  },
  
  // ============================================
  // ACTIONS - Overlay triggers
  // ============================================
  
  modal: {
    type: 'action',
    trigger: 'button',
    target: null,
    createsOverlay: true,
    template: `<button data-wb="modal" data-modal-title="Modal Title" data-modal-content="Modal content here">Open Modal</button>`
  },
  tooltip: {
    type: 'modifier',  // Actually a modifier - attaches to element
    attachTo: 'any',
    multiple: false
  },
  popover: {
    type: 'action',
    trigger: 'button',
    target: null,
    createsOverlay: true,
    template: `<button data-wb="popover" data-content="Popover content">Show Popover</button>`
  },
  dropdown: {
    type: 'action',
    trigger: 'button',
    target: null,
    createsOverlay: true,
    template: `
      <div class="wb-dropdown-group">
        <button data-wb="dropdown">Dropdown ▼</button>
        <div class="wb-dropdown-menu">
          <a href="#">Option 1</a>
          <a href="#">Option 2</a>
          <a href="#">Option 3</a>
        </div>
      </div>
    `
  },
  drawer: {
    type: 'action',
    trigger: 'button',
    target: null,
    createsOverlay: true,
    template: `<button data-wb="drawer" data-position="right">☰ Open Drawer</button>`
  },
  lightbox: {
    type: 'modifier',  // Attaches to images
    attachTo: 'img',
    multiple: false
  },
  offcanvas: {
    type: 'action',
    trigger: 'button',
    target: null,
    createsOverlay: true,
    template: `<button data-wb="offcanvas">☰ Menu</button>`
  },
  sheet: {
    type: 'action',
    trigger: 'button',
    target: null,
    createsOverlay: true,
    template: `<button data-wb="sheet">Show Sheet</button>`
  },
  confirm: {
    type: 'action',
    trigger: 'button',
    target: null,
    createsOverlay: true,
    template: `<button data-wb="confirm" data-message="Are you sure?">Confirm Action</button>`
  },
  prompt: {
    type: 'action',
    trigger: 'button',
    target: null,
    createsOverlay: true,
    template: `<button data-wb="prompt" data-message="Enter value:">Show Prompt</button>`
  },
  notify: {
    type: 'action',
    trigger: 'button',
    target: null,
    template: `<button data-wb="notify" data-message="Notification!">Show Notification</button>`
  },
  toast: {
    type: 'action',
    trigger: 'button',
    target: null,
    template: `<button data-wb="toast" data-message="Toast message">Show Toast</button>`
  },
  
  // ============================================
  // SPECIAL - Particle effects (fire once)
  // ============================================
  
  confetti: {
    type: 'action',
    trigger: 'button',
    target: null,
    template: `<button data-wb="confetti">🎉 Confetti!</button>`
  },
  fireworks: {
    type: 'action',
    trigger: 'button',
    target: null,
    template: `<button data-wb="fireworks">🎆 Fireworks!</button>`
  },
  snow: {
    type: 'modifier',
    attachTo: 'any',
    multiple: false
  },
  particle: {
    type: 'modifier',
    attachTo: 'any',
    multiple: false
  },
  
  // ============================================
  // UTILITY - Various helpers
  // ============================================
  
  hotkey: {
    type: 'modifier',
    attachTo: 'any',
    multiple: true
  },
  offline: {
    type: 'modifier',
    attachTo: 'any',
    multiple: false
  },
  debug: {
    type: 'modifier',
    attachTo: 'any',
    multiple: false
  },
  
  // Move behaviors - special modifiers for builder
  moveup:    { type: 'modifier', attachTo: 'any', builderOnly: true },
  movedown:  { type: 'modifier', attachTo: 'any', builderOnly: true },
  moveleft:  { type: 'modifier', attachTo: 'any', builderOnly: true },
  moveright: { type: 'modifier', attachTo: 'any', builderOnly: true },
  moveall:   { type: 'modifier', attachTo: 'any', builderOnly: true },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get behavior metadata
 */
export function getBehaviorMeta(name) {
  return behaviorMeta[name] || null;
}

/**
 * Get all behaviors of a specific type
 */
export function getBehaviorsByType(type) {
  return Object.entries(behaviorMeta)
    .filter(([_, meta]) => meta.type === type)
    .map(([name, meta]) => ({ name, ...meta }));
}

/**
 * Check if behavior can be dropped on canvas
 */
export function canDropOnCanvas(name) {
  const meta = behaviorMeta[name];
  if (!meta) return false;
  return meta.type === 'element' || meta.type === 'container' || meta.type === 'action';
}

/**
 * Check if behavior must attach to existing element
 */
export function requiresElement(name) {
  const meta = behaviorMeta[name];
  if (!meta) return false;
  return meta.type === 'modifier';
}

/**
 * Check if behavior creates a group (action with target)
 */
export function createsGroup(name) {
  const meta = behaviorMeta[name];
  if (!meta) return false;
  return meta.type === 'action' && meta.group === true;
}

/**
 * Get the preferred element for a behavior
 */
export function getPreferredElement(name) {
  const meta = behaviorMeta[name];
  if (!meta) return 'div';
  return meta.element || 'div';
}

/**
 * Get template for a behavior
 */
export function getTemplate(name, id) {
  const meta = behaviorMeta[name];
  if (!meta || !meta.template) return null;
  return meta.template.replace(/\{\{id\}\}/g, id || `wb-${name}-${Date.now()}`);
}

/**
 * Categorize all behaviors for sidebar
 */
export function getCategorizedBehaviors() {
  const elements = [];
  const containers = [];
  const modifiers = [];
  const actions = [];
  
  for (const [name, meta] of Object.entries(behaviorMeta)) {
    if (meta.builderOnly) continue; // Skip builder-only behaviors
    
    const entry = { name, ...meta };
    
    switch (meta.type) {
      case 'element':
        elements.push(entry);
        break;
      case 'container':
        containers.push(entry);
        break;
      case 'modifier':
        modifiers.push(entry);
        break;
      case 'action':
        actions.push(entry);
        break;
    }
  }
  
  return { elements, containers, modifiers, actions };
}

export default behaviorMeta;
