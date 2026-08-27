#!/usr/bin/env node

/**
 * Generate behaviors.html from behaviors.schema.json
 * Creates a complete showcase page with all behavior categories and demos
 *
 * IMPORTANT (#484): pages/behaviors.html was hand-fixed after #304/#390 to
 * (a) contain zero wb-* custom-behavior demos (they belong on
 * pages/behaviors.html instead -- gated by
 * tests/compliance/behaviors-page-no-wb-behaviors.spec.ts), (b) wrap each
 * distinctly-configured element in its own <div x-demo> rather than grouping
 * multiple elements into one (gated by
 * tests/compliance/demo-layout-standards.spec.ts's "no permutation-matrix"
 * check -- grouping is only correct where several elements are genuinely
 * ONE configured instance, e.g. a radio group sharing `name`, or
 * x-gallery's multi-image single instance), and (c) use plain v3 attributes
 * (`message`, `position`, `items`, ...) instead of legacy `data-*`.
 *
 * The functions below must keep producing that exact shape. If you add a
 * new behavior to behaviors.schema.json's behaviorInventory, add its demo
 * here following the same rules -- do NOT reintroduce a wb-* tag, a
 * grouped <div x-demo>, or a data-* attribute. Verify with:
 *   node scripts/generate-behaviors-page.js
 *   git diff pages/behaviors.html   (should be empty/expected)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the behaviors schema
const schemaPath = path.join(__dirname, '..', 'src', 'wb-models', 'behaviors.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// Generate HTML from schema
function generatePageFromSchema(schema) {
  const behaviorInventory = schema.behaviorInventory || {};

  // Start HTML structure.
  // pages/*.html are FRAGMENTS injected via innerHTML into the SPA shell
  // (see src/core/site-engine.js loadPage()) -- never emit <html>/<head>/
  // <body>, and page-specific CSS links must be root-relative (no leading
  // "../" or "/") since they resolve against the shell's document base,
  // not this file's own directory (tests/compliance/
  // injected-pages-root-relative-resources.spec.ts).
  let html = `<!-- ═══════════════════════════════════════════════════════════════════════════
     wb-starter - BEHAVIORS SHOWCASE
     Auto-generated from behaviors.schema.json
     ═══════════════════════════════════════════════════════════════════════════ -->
<link rel="stylesheet" href="src/styles/pages/behaviors.css">
`;

  // Generate header and nav from $view
  html += generateFromView(schema.$view);

  // Generate sections for each behavior category
  for (const [category, behaviors] of Object.entries(behaviorInventory.categories)) {
    html += generateCategorySection(category, behaviors);
  }

  // Add footer
  html += `
  <!-- FOOTER -->
  <footer id="footer">
    <p>wb-starter v{{WB_VERSION}} • ${countTotalBehaviors(behaviorInventory)} behaviors • 23 themes</p>
    <p><a href="?page=docs">Documentation</a> • <a href="?page=themes">Themes</a> • <a href="?page=home">Home</a></p>
  </footer>`;

  return html;
}

// Generate HTML from $view array
function generateFromView(viewArray) {
  const elements = new Map();
  let html = '';

  // Sort by parent relationships
  const sortedParts = [...viewArray].sort((a, b) => {
    const aDepth = a.parent ? 1 : 0;
    const bDepth = b.parent ? 1 : 0;
    return aDepth - bDepth;
  });

  // Build elements
  for (const part of sortedParts) {
    const tag = part.tag || 'div';
    let elementHtml = `<${tag}`;

    // Add attributes. Boolean `true` (or an empty string) renders as a
    // bare attribute (e.g. x-ignore) instead of x-ignore="true".
    if (part.attributes) {
      for (const [attr, value] of Object.entries(part.attributes)) {
        if (value === true || value === '') {
          elementHtml += ` ${attr}`;
        } else {
          elementHtml += ` ${attr}="${value}"`;
        }
      }
    }

    elementHtml += '>';

    // Add content
    if (part.content) {
      elementHtml += part.content;
    }

    // Close tag (self-closing for certain tags)
    const selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];
    if (selfClosingTags.includes(tag)) {
      elementHtml += ' />';
    } else {
      elementHtml += `</${tag}>`;
    }

    // Store for parent relationships
    elements.set(part.name, elementHtml);
  }

  // Build final HTML by nesting elements
  function buildNestedHtml(name) {
    const element = elements.get(name);
    if (!element) return '';

    // Find children
    const children = [];
    for (const [childName, childHtml] of elements) {
      const childPart = viewArray.find(p => p.name === childName);
      if (childPart && childPart.parent === name) {
        children.push(buildNestedHtml(childName));
      }
    }

    if (children.length === 0) {
      return element;
    }

    // Insert children before closing tag
    const selfClosingTags = ['img', 'input', 'br', 'hr', 'meta', 'link'];
    const tag = viewArray.find(p => p.name === name)?.tag || 'div';

    if (selfClosingTags.includes(tag)) {
      return element; // Can't have children
    }

    return element.replace(`</${tag}>`, children.join('\n') + `\n</${tag}>`);
  }

  // Start with root elements (no parent)
  const rootElements = sortedParts.filter(p => !p.parent);
  for (const root of rootElements) {
    html += buildNestedHtml(root.name) + '\n';
  }

  return html;
}

// Generate a section for a behavior category
function generateCategorySection(category, behaviors) {
  const categoryTitles = {
    buttons: '🔘 Buttons',
    inputs: '📝 Inputs',
    selection: '☑️ Selection',
    feedback: '📢 Feedback',
    overlays: '🪟 Overlays',
    navigation: '🧭 Navigation',
    data: '📊 Data',
    media: '🖼️ Media',
    effects: '✨ Effects',
    utilities: '🔧 Utilities'
  };

  // NOTE: some notes below deliberately call out which behaviors in this
  // category are wb-* behaviors (and therefore demoed on
  // pages/behaviors.html instead, not here) -- see the file-header
  // comment and tests/compliance/behaviors-page-no-wb-behaviors.spec.ts.
  const sectionNotes = {
    buttons: 'Button behaviors: Variants, sizes, and interactive effects like ripple and toast.',
    inputs: 'Input behaviors: Auto-enhanced inputs with validation variants, password toggle, and masking.',
    selection: 'Selection behaviors: Checkboxes, radios, selects, and steppers. (Switches and ratings are wb-* behaviors — see <a href="?page=behaviors">Behaviors</a>.)',
    feedback: 'Feedback behaviors: Toast notifications. (Alerts, badges, progress bars, and spinners are wb-* behaviors — see <a href="?page=behaviors">Behaviors</a>.)',
    overlays: 'Overlay behaviors: Tooltips, popovers, confirm dialogs, and lightboxes. (Modals and drawers are wb-* behaviors — see <a href="?page=behaviors">Behaviors</a>.)',
    navigation: 'Navigation behaviors: Breadcrumbs, pagination, and step wizards. (Tabs and accordion are wb-* behaviors — see <a href="?page=behaviors">Behaviors</a>.)',
    data: 'Data behaviors: Avatars, skeletons, timelines, and keyboard keys.',
    media: 'Media behaviors: Images with lazy loading, galleries, and YouTube embeds. (Audio player is a wb-* behavior — see <a href="?page=behaviors">Behaviors</a>.)',
    effects: 'Effect behaviors: Attention seekers, entrance animations, particle effects, and ripples.',
    utilities: 'Utility behaviors: Copy, share, print, fullscreen, clock, countdown, and dark mode toggle.'
  };

  let html = `
  <!-- ═══════════════════════════════════════════════════════════════════════════
     ${category.toUpperCase()}
     ═══════════════════════════════════════════════════════════════════════════ -->
  <section id="${category}">
    <h2>${categoryTitles[category]}</h2>
    <div class="section-note">
      <strong>${categoryTitles[category].split(' ')[1]} behaviors:</strong> ${sectionNotes[category]}
    </div>

`;

  // Generate demos for each behavior in this category
  html += generateBehaviorDemos(category, behaviors);

  html += '  </section>\n';

  return html;
}

// Generate demo HTML for behaviors in a category
function generateBehaviorDemos(category, behaviors) {
  // Generate appropriate demo based on category - pass ALL behaviors for the category
  switch (category) {
    case 'buttons':
      return generateButtonDemos(behaviors);
    case 'inputs':
      return generateInputDemos(behaviors);
    case 'selection':
      return generateSelectionDemos(behaviors);
    case 'feedback':
      return generateFeedbackDemos(behaviors);
    case 'overlays':
      return generateOverlayDemos(behaviors);
    case 'navigation':
      return generateNavigationDemos(behaviors);
    case 'data':
      return generateDataDemos(behaviors);
    case 'media':
      return generateMediaDemos(behaviors);
    case 'effects':
      return generateEffectDemos(behaviors);
    case 'utilities':
      return generateUtilityDemos(behaviors);
    default:
      return generateGenericDemos(behaviors);
  }
}

// Generate button demos.
// One <div x-demo> per distinctly-configured button -- no grouping.
function generateButtonDemos(behaviors) {
  let html = '';

  if (behaviors.some(b => b.name === 'x-btn')) {
    html += '    <div x-demo><button variant="primary">Primary</button></div>\n';
    html += '    <div x-demo><button variant="secondary">Secondary</button></div>\n';
    html += '    <div x-demo><button variant="ghost">Ghost</button></div>\n';
    html += '    <div x-demo><button variant="primary" disabled>Disabled</button></div>\n';
  }

  html += '\n    <h3>Button Sizes</h3>\n';
  html += '    <div x-demo><button variant="primary" size="sm">Small</button></div>\n';
  html += '    <div x-demo><button variant="primary">Medium</button></div>\n';
  html += '    <div x-demo><button variant="primary" size="lg">Large</button></div>\n';

  html += '\n    <h3>Button with Behaviors</h3>\n';
  if (behaviors.some(b => b.name === 'x-ripple')) {
    html += '    <div x-demo><button variant="primary" x-ripple>With Ripple</button></div>\n';
  }
  if (behaviors.some(b => b.name === 'x-toast')) {
    html += '    <div x-demo><button variant="primary" x-toast message="Action completed!" toast-variant="success">With Toast</button></div>\n';
  }
  if (behaviors.some(b => b.name === 'x-tooltip')) {
    html += '    <div x-demo><button variant="primary" x-tooltip="Helpful hint!" position="top">With Tooltip</button></div>\n';
  }

  return html;
}

// Generate input demos.
// One <div x-demo> per distinctly-configured input -- no grouping.
function generateInputDemos(behaviors) {
  let html = '    <h3>Basic Inputs</h3>\n';
  html += '    <div x-demo><input type="text" placeholder="Basic text input"></div>\n';
  html += '    <div x-demo><input type="email" placeholder="Email input"></div>\n';
  html += '    <div x-demo><input type="number" placeholder="Number input"></div>\n';

  if (behaviors.some(b => b.name === 'x-password' || b.name === 'x-search' || b.name === 'x-colorpicker')) {
    html += '\n    <h3>Special Input Types</h3>\n';
    if (behaviors.some(b => b.name === 'x-password')) {
      html += '    <div x-demo><input type="password" x-password placeholder="Password with toggle"></div>\n';
    }
    if (behaviors.some(b => b.name === 'x-search')) {
      html += '    <div x-demo><input type="text" x-search placeholder="Search with icon"></div>\n';
    }
    if (behaviors.some(b => b.name === 'x-colorpicker')) {
      html += '    <div x-demo><input type="text" x-colorpicker value="#6366f1"></div>\n';
    }
  }

  if (behaviors.some(b => b.name === 'x-masked')) {
    html += '\n    <h3>Masked Inputs</h3>\n';
    html += '    <div x-demo><input x-masked mask="(999) 999-9999" placeholder="Phone: (999) 999-9999"></div>\n';
    html += '    <div x-demo><input x-masked mask="99/99/9999" placeholder="Date: MM/DD/YYYY"></div>\n';
    html += '    <div x-demo><input x-masked mask="9999 9999 9999 9999" placeholder="Credit Card"></div>\n';
  }

  html += '\n    <h3>Textarea</h3>\n';
  html += '    <div x-demo><textarea placeholder="Standard textarea" rows="3"></textarea></div>\n';
  html += '    <div x-demo><textarea autosize placeholder="Auto-sizing textarea - grows as you type"></textarea></div>\n';

  return html;
}

// Generate selection demos.
// One <div x-demo> per distinctly-configured element, EXCEPT the radio group
// (all share name="demo-radio" -- one actual control group, per Standard
// §17) which stays in a single <div x-demo>. x-switch and x-rating are
// wb-* behaviors -- demoed on pages/behaviors.html instead, not here.
function generateSelectionDemos(behaviors) {
  let html = '';

  if (behaviors.some(b => b.name.includes('checkbox'))) {
    html += '    <h3>Checkboxes</h3>\n';
    html += '    <div x-demo><label class="selection-label"><input type="checkbox"> Unchecked</label></div>\n';
    html += '    <div x-demo><label class="selection-label"><input type="checkbox" checked> Checked</label></div>\n';
    html += '    <div x-demo><label class="selection-label"><input type="checkbox" disabled> Disabled</label></div>\n';
  }

  if (behaviors.some(b => b.name.includes('radio'))) {
    html += '\n    <h3>Radio Buttons</h3>\n    <div x-demo>\n';
    html += '      <label class="selection-label"><input type="radio" name="demo-radio" checked> Option A</label>\n';
    html += '      <label class="selection-label"><input type="radio" name="demo-radio"> Option B</label>\n';
    html += '      <label class="selection-label"><input type="radio" name="demo-radio"> Option C</label>\n';
    html += '    </div>\n';
  }

  if (behaviors.some(b => b.name.includes('select'))) {
    html += '\n    <h3>Select Dropdown</h3>\n    <div x-demo>\n';
    html += '      <select>\n';
    html += '        <option>Select an option</option>\n';
    html += '        <option>Option 1</option>\n';
    html += '        <option>Option 2</option>\n';
    html += '        <option>Option 3</option>\n';
    html += '      </select>\n';
    html += '    </div>\n';
    html += '    <div x-demo>\n';
    html += '      <select multiple size="3">\n';
    html += '        <option>Multiple 1</option>\n';
    html += '        <option>Multiple 2</option>\n';
    html += '        <option>Multiple 3</option>\n';
    html += '      </select>\n';
    html += '    </div>\n';
  }

  if (behaviors.some(b => b.name === 'x-stepper')) {
    html += '\n    <h3>Stepper & Range</h3>\n';
    html += '    <div x-demo><div x-stepper value="5" min="0" max="10"></div></div>\n';
    html += '    <div x-demo><input type="range" min="0" max="100" value="50"></div>\n';
  }

  return html;
}

// Generate feedback demos.
// x-alert/x-badge/x-progress/x-spinner are wb-* behaviors -- demoed
// on pages/behaviors.html instead, not here. Only the x-toast behavior
// (a real attribute-behavior, not a behavior) belongs on this page.
function generateFeedbackDemos(behaviors) {
  let html = '';

  if (behaviors.some(b => b.name === 'x-alert')) {
    html += '    <h3>Alerts</h3>\n';
    html += '    <div x-demo><div x-alert variant="info">Info alert message</div></div>\n';
    html += '    <div x-demo><div x-alert variant="success">Success alert message</div></div>\n';
    html += '    <div x-demo><div x-alert variant="warning">Warning alert message</div></div>\n';
    html += '    <div x-demo><div x-alert variant="error">Error alert message</div></div>\n';
  }

  if (behaviors.some(b => b.name === 'x-toast')) {
    html += '\n    <h3>Toast Notifications</h3>\n';
    html += '    <div x-demo><button variant="primary" x-toast message="Info message" toast-variant="info">Info Toast</button></div>\n';
    html += '    <div x-demo><button variant="primary" x-toast message="Success!" toast-variant="success">Success Toast</button></div>\n';
    html += '    <div x-demo><button variant="primary" x-toast message="Warning!" toast-variant="warning">Warning Toast</button></div>\n';
    html += '    <div x-demo><button variant="primary" x-toast message="Error!" toast-variant="error">Error Toast</button></div>\n';
  }

  return html;
}

// Generate overlay demos.
// x-modal/x-drawer are wb-* behaviors -- demoed on pages/behaviors.html
// instead, not here. One <div x-demo> per distinctly-configured element.
function generateOverlayDemos(behaviors) {
  let html = '';

  if (behaviors.some(b => b.name === 'x-tooltip')) {
    html += '    <h3>Tooltips</h3>\n';
    html += '    <div x-demo><button variant="secondary" x-tooltip="Top tooltip" position="top">Top</button></div>\n';
    html += '    <div x-demo><button variant="secondary" x-tooltip="Bottom tooltip" position="bottom">Bottom</button></div>\n';
    html += '    <div x-demo><button variant="secondary" x-tooltip="Left tooltip" position="left">Left</button></div>\n';
    html += '    <div x-demo><button variant="secondary" x-tooltip="Right tooltip" position="right">Right</button></div>\n';
  }

  if (behaviors.some(b => b.name === 'x-popover')) {
    html += '\n    <h3>Popover</h3>\n';
    html += '    <div x-demo><button variant="primary" x-popover popover-title="Popover Title" popover-content="This is additional information displayed in a popover.">Show Popover</button></div>\n';
  }

  if (behaviors.some(b => b.name === 'x-confirm' || b.name === 'x-prompt')) {
    html += '\n    <h3>Confirm & Prompt</h3>\n';
    if (behaviors.some(b => b.name === 'x-confirm')) {
      html += '    <div x-demo><button variant="primary" x-confirm confirm-title="Confirm Action" confirm-message="Are you sure you want to proceed?">Confirm Dialog</button></div>\n';
    }
    if (behaviors.some(b => b.name === 'x-prompt')) {
      html += '    <div x-demo><button variant="primary" x-prompt prompt-title="Enter Value" prompt-message="Please enter your name:">Prompt Dialog</button></div>\n';
    }
  }

  if (behaviors.some(b => b.name === 'x-lightbox')) {
    html += '\n    <h3>Lightbox</h3>\n';
    html += '    <div x-demo><button variant="primary" x-lightbox src="https://picsum.photos/1200/800?r=lb1">View Image 1</button></div>\n';
    html += '    <div x-demo><button variant="primary" x-lightbox src="https://picsum.photos/1200/800?r=lb2">View Image 2</button></div>\n';
  }

  return html;
}

// Generate navigation demos.
// x-tabs/x-accordion are wb-* behaviors -- demoed on
// pages/behaviors.html instead, not here.
function generateNavigationDemos(behaviors) {
  let html = '';

  if (behaviors.some(b => b.name === 'x-breadcrumb')) {
    html += '    <h3>Breadcrumb</h3>\n';
    html += '    <div x-demo><nav x-breadcrumb items="Home,Products,Electronics,Smartphones"></nav></div>\n';
  }

  if (behaviors.some(b => b.name === 'x-pagination')) {
    html += '\n    <h3>Pagination</h3>\n';
    html += '    <div x-demo><nav x-pagination total="100" per-page="10" current="5"></nav></div>\n';
  }

  if (behaviors.some(b => b.name === 'x-steps')) {
    html += '\n    <h3>Steps Wizard</h3>\n';
    html += '    <div x-demo><div x-steps items="Cart,Shipping,Payment,Confirm" current="2"></div></div>\n';
  }

  return html;
}

// Generate data demos.
function generateDataDemos(behaviors) {
  let html = '';

  // x-avatar and x-skeleton are catalogued as type:"element" in
  // behaviors.schema.json's "data" category -- real wb-* behaviors with no
  // x-* attribute form at all, not behaviors. This page exists to show one
  // demo per x-* behavior; genuine behaviors already have their own demos
  // on pages/behaviors.html (confirmed present there). Rendering them here
  // too made the Behaviors page show wb-* custom elements mixed in with
  // behaviors, contradicting its own purpose.

  if (behaviors.some(b => b.name === 'x-timeline')) {
    html += '    <h3>Timeline</h3>\n';
    html += '    <div x-demo><div x-timeline items="Project kickoff,Design phase,Development,Testing,Launch"></div></div>\n';
  }

  if (behaviors.some(b => b.name === 'x-kbd')) {
    html += '\n    <h3>Keyboard Keys</h3>\n';
    html += '    <div x-demo><p>Press <span x-kbd>Ctrl</span> + <span x-kbd>S</span> to save, or <span x-kbd>⌘</span> + <span x-kbd>K</span> on Mac.</p></div>\n';
  }

  return html;
}

// Generate media demos.
// x-audio is a wb-* behavior -- demoed on pages/behaviors.html instead,
// not here. Gallery stays a single <div x-demo> since x-gallery's multiple
// <img> children are ONE configured instance, not several distinct demos.
function generateMediaDemos(behaviors) {
  let html = '';

  if (behaviors.some(b => b.name === 'x-image')) {
    html += '    <h3>Enhanced Images</h3>\n';
    html += '    <div x-demo><img x-image src="https://picsum.photos/200/150?r=enh1" alt="Lazy loaded" lazy class="demo-image"></div>\n';
    html += '    <div x-demo><img x-image src="https://picsum.photos/200/150?r=enh2" alt="Zoomable" zoomable class="demo-image"></div>\n';
  }

  if (behaviors.some(b => b.name === 'x-gallery')) {
    html += '\n    <h3>Gallery</h3>\n    <div x-demo>\n';
    html += '      <div x-gallery columns="4">\n';
    html += '        <img src="https://picsum.photos/200/200?r=gal1" alt="Gallery 1">\n';
    html += '        <img src="https://picsum.photos/200/200?r=gal2" alt="Gallery 2">\n';
    html += '        <img src="https://picsum.photos/200/200?r=gal3" alt="Gallery 3">\n';
    html += '        <img src="https://picsum.photos/200/200?r=gal4" alt="Gallery 4">\n';
    html += '      </div>\n';
    html += '    </div>\n';
  }

  if (behaviors.some(b => b.name === 'x-youtube')) {
    html += '\n    <h3>YouTube Embed</h3>\n';
    html += '    <div x-demo class="youtube-container"><div x-youtube id="dQw4w9WgXcQ" ratio="16:9"></div></div>\n';
  }

  return html;
}

// Generate effects demos.
// One <div x-demo> per effect -- no grouping.
function generateEffectDemos(behaviors) {
  let html = '';

  // Attention seekers
  const attentionSeekers = behaviors.filter(b => b.type === 'action' && [
    'x-bounce', 'x-shake', 'x-pulse', 'x-flash', 'x-tada', 'x-wobble', 'x-jello', 'x-heartbeat'
  ].includes(b.name));

  if (attentionSeekers.length > 0) {
    html += '    <h3>Attention Seekers (click to trigger)</h3>\n';
    attentionSeekers.forEach(behavior => {
      const displayName = behavior.name.replace('x-', '').charAt(0).toUpperCase() + behavior.name.replace('x-', '').slice(1);
      const emoji = behavior.name === 'x-heartbeat' ? '💓 ' : '';
      html += `    <div x-demo><button class="effect-demo" ${behavior.name}>${emoji}${displayName}</button></div>\n`;
    });
  }

  // Entrance animations
  const entranceAnimations = behaviors.filter(b => b.type === 'action' && [
    'x-fadein', 'x-slidein', 'x-zoomin', 'x-flip'
  ].includes(b.name));

  if (entranceAnimations.length > 0) {
    html += '\n    <h3>Entrance Animations</h3>\n';
    entranceAnimations.forEach(behavior => {
      const displayName = behavior.name.replace('x-', '').charAt(0).toUpperCase() + behavior.name.replace('x-', '').slice(1);
      if (behavior.name === 'x-slidein') {
        html += `    <div x-demo><button class="effect-demo" ${behavior.name} direction="left">${displayName} Left</button></div>\n`;
        html += `    <div x-demo><button class="effect-demo" ${behavior.name} direction="right">${displayName} Right</button></div>\n`;
        html += `    <div x-demo><button class="effect-demo" ${behavior.name} direction="up">${displayName} Up</button></div>\n`;
      } else {
        html += `    <div x-demo><button class="effect-demo" ${behavior.name}>${displayName}</button></div>\n`;
      }
    });
  }

  // Special effects
  const specialEffects = behaviors.filter(b => b.type === 'action' && [
    'x-confetti', 'x-fireworks', 'x-snow', 'x-sparkle', 'x-glow', 'x-rainbow', 'x-ripple'
  ].includes(b.name));

  if (specialEffects.length > 0) {
    html += '\n    <h3>Special Effects</h3>\n';
    specialEffects.forEach(behavior => {
      const displayName = behavior.name.replace('x-', '').charAt(0).toUpperCase() + behavior.name.replace('x-', '').slice(1);
      const emoji = {
        'x-confetti': '🎊 ',
        'x-fireworks': '🎆 ',
        'x-snow': '❄️ ',
        'x-sparkle': '✨ ',
        'x-glow': '💡 ',
        'x-rainbow': '🌈 ',
        'x-ripple': ''
      }[behavior.name] || '';

      if (behavior.name === 'x-ripple') {
        html += `    <div x-demo><button variant="primary" ${behavior.name}>Click for Ripple</button></div>\n`;
        html += `    <div x-demo><div ${behavior.name} class="ripple-box">Ripple on any element</div></div>\n`;
      } else {
        html += `    <div x-demo><button variant="primary" ${behavior.name}>${emoji}${displayName}</button></div>\n`;
      }
    });
  }

  return html;
}

// Generate utility demos.
// One <div x-demo> per distinctly-configured element -- no grouping. Note
// share/print/fullscreen each get their OWN <div x-demo> and only x-share
// gets the share-title/share-url attributes (print/fullscreen take none),
// same for clock/countdown/relativetime -- they are three separate demos,
// not one shared block. x-themecontrol is header-only UI chrome (see
// src/core/site-engine.js), not a per-page demo, so it is never rendered
// here.
function generateUtilityDemos(behaviors) {
  let html = '';

  if (behaviors.some(b => b.name === 'x-copy')) {
    html += '    <h3>Copy functionality</h3>\n';
    html += '    <div x-demo><button variant="primary" x-copy copy-text="Text copied to clipboard!">📋 Copy Text</button></div>\n';
    html += '    <div x-demo><button variant="primary" x-copy copy-text="npm install x-framework">📋 Copy Command</button></div>\n';
  }

  if (behaviors.some(b => b.name === 'x-share' || b.name === 'x-print' || b.name === 'x-fullscreen')) {
    html += '\n    <h3>Share, Print & Fullscreen</h3>\n';
    if (behaviors.some(b => b.name === 'x-share')) {
      html += '    <div x-demo><button variant="secondary" x-share share-title="wb-starter" share-url="https://example.com">📤 Share</button></div>\n';
    }
    if (behaviors.some(b => b.name === 'x-print')) {
      html += '    <div x-demo><button variant="secondary" x-print>🖨️ Print</button></div>\n';
    }
    if (behaviors.some(b => b.name === 'x-fullscreen')) {
      html += '    <div x-demo><button variant="secondary" x-fullscreen>⛶ Fullscreen</button></div>\n';
    }
  }

  if (behaviors.some(b => b.name === 'x-clock' || b.name === 'x-countdown' || b.name === 'x-relativetime')) {
    html += '\n    <h3>Clock & Countdown</h3>\n';
    if (behaviors.some(b => b.name === 'x-clock')) {
      html += '    <div x-demo><div x-clock class="time-display"></div></div>\n';
    }
    if (behaviors.some(b => b.name === 'x-countdown')) {
      html += '    <div x-demo><div x-countdown to="2027-12-31" class="time-display"></div></div>\n';
    }
    if (behaviors.some(b => b.name === 'x-relativetime')) {
      html += '    <div x-demo><span x-relativetime date="2025-01-01" class="time-display">Jan 1, 2025</span></div>\n';
    }
  }

  if (behaviors.some(b => b.name === 'x-darkmode')) {
    html += '\n    <h3>Dark Mode Toggle</h3>\n';
    html += '    <div x-demo><button variant="primary" x-darkmode>🌙 Toggle Dark Mode</button></div>\n';
  }

  if (behaviors.some(b => b.name === 'x-truncate')) {
    html += '\n    <h3>Text Truncate</h3>\n    <div x-demo>\n';
    html += '      <p x-truncate lines="2" class="truncate-box">\n';
    html += '        This is a very long text that will be truncated after two lines. Lorem ipsum dolor sit amet, consectetur\n';
    html += '        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n';
    html += '      </p>\n';
    html += '    </div>\n';
  }

  return html;
}

// Generate generic demos for unknown categories
function generateGenericDemos(behaviors) {
  let html = '    <div x-demo>\n';
  behaviors.forEach(behavior => {
    const displayName = behavior.name.startsWith('wb-') ? behavior.name : behavior.name.replace('x-', '');
    html += `      <div class="behavior-demo" data-behavior="${behavior.name}">\n`;
    html += `        <h4>${displayName}</h4>\n`;
    html += `        <p>${behavior.description || 'No description available'}</p>\n`;
    html += '      </div>\n';
  });
  html += '    </div>\n';
  return html;
}

// Count total behaviors across all categories
function countTotalBehaviors(behaviorInventory) {
  let total = 0;
  for (const category of Object.values(behaviorInventory.categories)) {
    total += category.length;
  }
  return total;
}

// Main execution
try {
  const html = generatePageFromSchema(schema);
  const outputPath = path.join(__dirname, '..', 'pages', 'behaviors.html');
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`✅ Generated behaviors.html from behaviors.schema.json`);
  console.log(`📄 Output: ${outputPath}`);
} catch (error) {
  console.error('❌ Error generating behaviors.html:', error);
  process.exit(1);
}
