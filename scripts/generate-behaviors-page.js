#!/usr/bin/env node

/**
 * Generate behaviors.html from behaviors.schema.json
 * Creates a complete showcase page with all behavior categories and demos
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

  // Start HTML structure
  let html = `<!-- ═══════════════════════════════════════════════════════════════════════════
     wb-starter - BEHAVIORS SHOWCASE
     Auto-generated from behaviors.schema.json
     ═══════════════════════════════════════════════════════════════════════════ -->
<html>

<head>
  <link rel="stylesheet" href="../src/styles/pages/behaviors.css">
</head>

<body>
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
    <p>wb-starter v3.0 • ${countTotalBehaviors(behaviorInventory)} behaviors • 23 themes</p>
    <p><a href="?page=docs">Documentation</a> • <a href="?page=themes">Themes</a> • <a href="?page=home">Home</a></p>
  </footer>

</body>

</html>`;

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

    // Add attributes
    if (part.attributes) {
      for (const [attr, value] of Object.entries(part.attributes)) {
        elementHtml += ` ${attr}="${value}"`;
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

  const sectionNotes = {
    buttons: 'Button behaviors: Variants, sizes, and interactive effects like ripple and toast.',
    inputs: 'Input behaviors: Auto-enhanced inputs with validation variants, password toggle, and masking.',
    selection: 'Selection behaviors: Checkboxes, radios, switches, selects, ratings, and steppers.',
    feedback: 'Feedback behaviors: Alerts, badges, progress bars, spinners, and toast notifications.',
    overlays: 'Overlay behaviors: Modals, drawers, tooltips, popovers, confirm dialogs, and lightboxes.',
    navigation: 'Navigation behaviors: Tabs, accordion, breadcrumbs, pagination, and step wizards.',
    data: 'Data behaviors: Avatars, skeletons, timelines, and keyboard keys.',
    media: 'Media behaviors: Images with lazy loading, galleries, YouTube embeds, and audio players.',
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

// Group behaviors by their type
function groupBehaviorsByType(behaviors) {
  const groups = {};

  for (const behavior of behaviors) {
    const type = behavior.type || 'element';
    if (!groups[type]) groups[type] = [];
    groups[type].push(behavior);
  }

  return groups;
}

// Generate a section for a specific behavior type
function generateTypeSection(category, type, behaviors) {
  const typeTitles = {
    element: getCategoryTypeTitle(category, type),
    modifier: getCategoryTypeTitle(category, type),
    action: getCategoryTypeTitle(category, type),
    container: getCategoryTypeTitle(category, type)
  };

  let html = `\n    <h3>${typeTitles[type] || type}</h3>\n`;

  // Generate appropriate demo based on category and type
  html += generateDemoForCategory(category, behaviors);

  return html;
}

// Get appropriate title for category/type combination
function getCategoryTypeTitle(category, type) {
  const titles = {
    buttons: {
      element: 'Button Components',
      modifier: 'Button Variants',
      action: 'Button Behaviors'
    },
    inputs: {
      element: 'Input Components',
      modifier: 'Input Enhancements',
      action: 'Input Behaviors'
    },
    selection: {
      element: 'Selection Components',
      modifier: 'Selection Enhancements',
      action: 'Selection Behaviors'
    },
    feedback: {
      element: 'Feedback Components',
      modifier: 'Feedback Variants',
      action: 'Feedback Behaviors'
    },
    overlays: {
      element: 'Overlay Components',
      modifier: 'Overlay Enhancements',
      action: 'Overlay Behaviors'
    },
    navigation: {
      element: 'Navigation Components',
      modifier: 'Navigation Enhancements',
      action: 'Navigation Behaviors'
    },
    data: {
      element: 'Data Components',
      modifier: 'Data Enhancements',
      action: 'Data Behaviors'
    },
    media: {
      element: 'Media Components',
      modifier: 'Media Enhancements',
      action: 'Media Behaviors'
    },
    effects: {
      element: 'Effect Components',
      modifier: 'Effect Variants',
      action: 'Effect Behaviors'
    },
    utilities: {
      element: 'Utility Components',
      modifier: 'Utility Enhancements',
      action: 'Utility Behaviors'
    }
  };

  return titles[category]?.[type] || `${category} ${type}`;
}

// Generate demo HTML for a specific category
function generateDemoForCategory(category, behaviors) {
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

// Generate button demos
function generateButtonDemos(behaviors) {
  let html = '    <wb-demo>\n';

  // Button variants
  if (behaviors.some(b => b.name === 'wb-btn')) {
    html += '      <button class="wb-btn wb-btn--primary">Primary</button>\n';
    html += '      <button class="wb-btn wb-btn--secondary">Secondary</button>\n';
    html += '      <button class="wb-btn wb-btn--ghost">Ghost</button>\n';
    html += '      <button class="wb-btn wb-btn--primary" disabled>Disabled</button>\n';
  }

  // Button sizes
  html += '    </wb-demo>\n\n    <h3>Button Sizes</h3>\n    <wb-demo>\n';
  html += '      <button class="wb-btn wb-btn--primary wb-btn--sm">Small</button>\n';
  html += '      <button class="wb-btn wb-btn--primary">Medium</button>\n';
  html += '      <button class="wb-btn wb-btn--primary wb-btn--lg">Large</button>\n';

  // Button with behaviors
  html += '    </wb-demo>\n\n    <h3>Button with Behaviors</h3>\n    <wb-demo>\n';
  if (behaviors.some(b => b.name === 'x-ripple')) {
    html += '      <button class="wb-btn wb-btn--primary" x-ripple>With Ripple</button>\n';
  }
  if (behaviors.some(b => b.name === 'x-toast')) {
    html += '      <button class="wb-btn wb-btn--primary" x-toast data-message="Action completed!" data-type="success">With Toast</button>\n';
  }
  if (behaviors.some(b => b.name === 'x-tooltip')) {
    html += '      <button class="wb-btn wb-btn--primary" x-tooltip="Helpful hint!" data-position="top">With Tooltip</button>\n';
  }

  html += '    </wb-demo>\n';
  return html;
}

// Generate input demos
function generateInputDemos(behaviors) {
  let html = '    <h3>Basic Inputs</h3>\n    <div class="demo-grid-3">\n';
  html += '      <input type="text" placeholder="Basic text input">\n';
  html += '      <input type="email" placeholder="Email input">\n';
  html += '      <input type="number" placeholder="Number input">\n';
  html += '    </div>\n\n';

  if (behaviors.some(b => b.name.includes('validation') || b.name.includes('variant'))) {
    html += '    <h3>Validation Variants</h3>\n    <div class="demo-grid-3">\n';
    html += '      <input type="text" placeholder="Success state" data-variant="success">\n';
    html += '      <input type="text" placeholder="Warning state" data-variant="warning">\n';
    html += '      <input type="text" placeholder="Error state" data-variant="error">\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-password' || b.name === 'x-search' || b.name === 'x-colorpicker')) {
    html += '    <h3>Special Input Types</h3>\n    <div class="demo-grid-3">\n';
    if (behaviors.some(b => b.name === 'x-password')) {
      html += '      <input type="password" x-password placeholder="Password with toggle">\n';
    }
    if (behaviors.some(b => b.name === 'x-search')) {
      html += '      <input type="text" x-search placeholder="Search with icon">\n';
    }
    if (behaviors.some(b => b.name === 'x-colorpicker')) {
      html += '      <input type="text" x-colorpicker value="#6366f1">\n';
    }
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-masked')) {
    html += '    <h3>Masked Inputs</h3>\n    <div class="demo-grid-3">\n';
    html += '      <input x-masked data-mask="(999) 999-9999" placeholder="Phone: (999) 999-9999">\n';
    html += '      <input x-masked data-mask="99/99/9999" placeholder="Date: MM/DD/YYYY">\n';
    html += '      <input x-masked data-mask="9999 9999 9999 9999" placeholder="Credit Card">\n';
    html += '    </div>\n\n';
  }

  html += '    <h3>Textarea</h3>\n    <div class="demo-grid-2">\n';
  html += '      <textarea placeholder="Standard textarea" rows="3"></textarea>\n';
  html += '      <textarea data-autosize placeholder="Auto-sizing textarea - grows as you type"></textarea>\n';
  html += '    </div>\n';

  return html;
}

// Generate selection demos
function generateSelectionDemos(behaviors) {
  let html = '';

  if (behaviors.some(b => b.name.includes('checkbox'))) {
    html += '    <h3>Checkboxes</h3>\n    <div class="demo-row">\n';
    html += '      <label class="checkbox-label"><input type="checkbox"> Unchecked</label>\n';
    html += '      <label class="checkbox-label"><input type="checkbox" checked> Checked</label>\n';
    html += '      <label class="checkbox-label"><input type="checkbox" disabled> Disabled</label>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name.includes('radio'))) {
    html += '    <h3>Radio Buttons</h3>\n    <div class="demo-row">\n';
    html += '      <label class="checkbox-label"><input type="radio" name="demo-radio" checked> Option A</label>\n';
    html += '      <label class="checkbox-label"><input type="radio" name="demo-radio"> Option B</label>\n';
    html += '      <label class="checkbox-label"><input type="radio" name="demo-radio"> Option C</label>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'wb-switch')) {
    html += '    <h3>Switch Toggle</h3>\n    <div class="demo-row">\n';
    html += '      <wb-switch label="Dark Mode"></wb-switch>\n';
    html += '      <wb-switch label="Notifications" checked></wb-switch>\n';
    html += '      <wb-switch label="Disabled" disabled></wb-switch>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name.includes('select'))) {
    html += '    <h3>Select Dropdown</h3>\n    <div class="demo-grid-2">\n';
    html += '      <select>\n';
    html += '        <option>Select an option</option>\n';
    html += '        <option>Option 1</option>\n';
    html += '        <option>Option 2</option>\n';
    html += '        <option>Option 3</option>\n';
    html += '      </select>\n';
    html += '      <select multiple size="3">\n';
    html += '        <option>Multiple 1</option>\n';
    html += '        <option>Multiple 2</option>\n';
    html += '        <option>Multiple 3</option>\n';
    html += '      </select>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'wb-rating')) {
    html += '    <h3>Rating</h3>\n    <div class="demo-row">\n';
    html += '      <wb-rating value="3" max="5"></wb-rating>\n';
    html += '      <wb-rating value="4" max="5" icon="❤️"></wb-rating>\n';
    html += '      <wb-rating value="2" max="5" icon="👍"></wb-rating>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-stepper')) {
    html += '    <h3>Stepper & Range</h3>\n    <div class="demo-grid-2">\n';
    html += '      <div x-stepper data-value="5" data-min="0" data-max="10"></div>\n';
    html += '      <input type="range" min="0" max="100" value="50">\n';
    html += '    </div>\n';
  }

  return html;
}

// Generate feedback demos
function generateFeedbackDemos(behaviors) {
  let html = '';

  if (behaviors.some(b => b.name === 'wb-alert')) {
    html += '    <h3>Alerts (All Variants)</h3>\n    <div class="alerts-stack">\n';
    html += '      <wb-alert type="info" title="Information" message="This is an informational message." data-dismissible></wb-alert>\n';
    html += '      <wb-alert type="success" title="Success" message="Operation completed successfully." data-dismissible></wb-alert>\n';
    html += '      <wb-alert type="warning" title="Warning" message="Please review before continuing." data-dismissible></wb-alert>\n';
    html += '      <wb-alert type="error" title="Error" message="Something went wrong." data-dismissible></wb-alert>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'wb-badge')) {
    html += '    <h3>Badges (All Variants)</h3>\n    <div class="demo-row">\n';
    html += '      <wb-badge>Default Badge</wb-badge>\n';
    html += '      <wb-badge variant="primary">Primary Badge</wb-badge>\n';
    html += '      <wb-badge variant="success">Success Badge</wb-badge>\n';
    html += '      <wb-badge variant="warning">Warning Badge</wb-badge>\n';
    html += '      <wb-badge variant="error">Error Badge</wb-badge>\n';
    html += '      <wb-badge variant="info">Info Badge</wb-badge>\n';
    html += '      <wb-badge data-pill>Pill Badge</wb-badge>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'wb-progress')) {
    html += '    <h3>Progress Bars</h3>\n    <div class="progress-stack">\n';
    html += '      <div class="progress-item">\n';
    html += '        <span class="progress-label">25%</span>\n';
    html += '        <wb-progress data-value="25"></wb-progress>\n';
    html += '      </div>\n';
    html += '      <div class="progress-item">\n';
    html += '        <span class="progress-label">50%</span>\n';
    html += '        <wb-progress data-value="50"></wb-progress>\n';
    html += '      </div>\n';
    html += '      <div class="progress-item">\n';
    html += '        <span class="progress-label">75% (striped)</span>\n';
    html += '        <wb-progress data-value="75" data-striped></wb-progress>\n';
    html += '      </div>\n';
    html += '      <div class="progress-item">\n';
    html += '        <span class="progress-label">100%</span>\n';
    html += '        <wb-progress data-value="100"></wb-progress>\n';
    html += '      </div>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'wb-spinner')) {
    html += '    <h3>Spinners</h3>\n    <div class="demo-row">\n';
    html += '      <wb-spinner></wb-spinner>\n';
    html += '      <wb-spinner color="success"></wb-spinner>\n';
    html += '      <wb-spinner color="warning"></wb-spinner>\n';
    html += '      <wb-spinner color="error"></wb-spinner>\n';
    html += '      <wb-spinner size="lg"></wb-spinner>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-toast')) {
    html += '    <h3>Toast Notifications</h3>\n    <div class="demo-row">\n';
    html += '      <button class="wb-btn wb-btn--primary" x-toast data-message="Info message" data-type="info">Info Toast</button>\n';
    html += '      <button class="wb-btn wb-btn--primary" x-toast data-message="Success!" data-type="success">Success Toast</button>\n';
    html += '      <button class="wb-btn wb-btn--primary" x-toast data-message="Warning!" data-type="warning">Warning Toast</button>\n';
    html += '      <button class="wb-btn wb-btn--primary" x-toast data-message="Error!" data-type="error">Error Toast</button>\n';
    html += '    </div>\n';
  }

  return html;
}

// Generate overlay demos
function generateOverlayDemos(behaviors) {
  let html = '';

  if (behaviors.some(b => b.name === 'wb-modal')) {
    html += '    <h3>Modal Dialog</h3>\n    <div class="demo-row">\n';
    html += '      <wb-modal class="wb-btn wb-btn--primary" data-modal-title="Modal Dialog" data-modal-content="This is a modal dialog. Press ESC or click outside to close.">Open Modal</wb-modal>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'wb-drawer')) {
    html += '    <h3>Drawer</h3>\n    <div class="demo-row">\n';
    html += '      <wb-drawer class="wb-btn wb-btn--primary" title="Left Drawer" content="Slide-out panel from the left." position="left">Left Drawer</wb-drawer>\n';
    html += '      <wb-drawer class="wb-btn wb-btn--primary" title="Right Drawer" content="Slide-out panel from the right." position="right">Right Drawer</wb-drawer>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-tooltip')) {
    html += '    <h3>Tooltips</h3>\n    <div class="demo-row">\n';
    html += '      <button class="wb-btn wb-btn--secondary" x-tooltip="Top tooltip" data-position="top">Top</button>\n';
    html += '      <button class="wb-btn wb-btn--secondary" x-tooltip="Bottom tooltip" data-position="bottom">Bottom</button>\n';
    html += '      <button class="wb-btn wb-btn--secondary" x-tooltip="Left tooltip" data-position="left">Left</button>\n';
    html += '      <button class="wb-btn wb-btn--secondary" x-tooltip="Right tooltip" data-position="right">Right</button>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-popover')) {
    html += '    <h3>Popover</h3>\n    <div class="demo-row">\n';
    html += '      <button class="wb-btn wb-btn--primary" x-popover data-title="Popover Title" data-content="This is additional information displayed in a popover.">Show Popover</button>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-confirm' || b.name === 'x-prompt')) {
    html += '    <h3>Confirm & Prompt</h3>\n    <div class="demo-row">\n';
    if (behaviors.some(b => b.name === 'x-confirm')) {
      html += '      <button class="wb-btn wb-btn--primary" x-confirm data-title="Confirm Action" data-message="Are you sure you want to proceed?">Confirm Dialog</button>\n';
    }
    if (behaviors.some(b => b.name === 'x-prompt')) {
      html += '      <button class="wb-btn wb-btn--primary" x-prompt data-title="Enter Value" data-message="Please enter your name:">Prompt Dialog</button>\n';
    }
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-lightbox')) {
    html += '    <h3>Lightbox</h3>\n    <div class="demo-row">\n';
    html += '      <button class="wb-btn wb-btn--primary" x-lightbox data-src="https://picsum.photos/1200/800?r=lb1">View Image 1</button>\n';
    html += '      <button class="wb-btn wb-btn--primary" x-lightbox data-src="https://picsum.photos/1200/800?r=lb2">View Image 2</button>\n';
    html += '    </div>\n';
  }

  return html;
}

// Generate navigation demos
function generateNavigationDemos(behaviors) {
  let html = '';

  if (behaviors.some(b => b.name === 'wb-tabs')) {
    html += '    <h3>Tabs</h3>\n    <div class="demo-full">\n';
    html += '      <wb-tabs>\n';
    html += '        <div data-tab-title="Overview">\n';
    html += '          <p>This is the overview tab content. Tabs organize content into separate views with keyboard navigation.</p>\n';
    html += '        </div>\n';
    html += '        <div data-tab-title="Features">\n';
    html += '          <p>Features include smooth transitions, responsive design, and full accessibility compliance.</p>\n';
    html += '        </div>\n';
    html += '        <div data-tab-title="Usage">\n';
    html += '          <p>Simply wrap your content in a wb-tabs element with data-tab-title on each panel.</p>\n';
    html += '        </div>\n';
    html += '      </wb-tabs>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'wb-accordion')) {
    html += '    <h3>Accordion</h3>\n    <div class="demo-full">\n';
    html += '      <wb-accordion>\n';
    html += '        <div data-accordion-title="What is wb-starter?">\n';
    html += '          <p>wb-starter is a zero-build web component library with behaviors and themes.</p>\n';
    html += '        </div>\n';
    html += '        <div data-accordion-title="How do I install it?">\n';
    html += '          <p>No installation needed! Just include the script and start using components immediately.</p>\n';
    html += '        </div>\n';
    html += '        <div data-accordion-title="Is it production ready?">\n';
    html += '          <p>Yes! wb-starter is schema-driven, fully tested, and enterprise hardened.</p>\n';
    html += '        </div>\n';
    html += '      </wb-accordion>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-breadcrumb')) {
    html += '    <h3>Breadcrumb</h3>\n    <div class="demo-full">\n';
    html += '      <nav x-breadcrumb data-items="Home,Products,Electronics,Smartphones"></nav>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-pagination')) {
    html += '    <h3>Pagination</h3>\n    <div class="demo-full">\n';
    html += '      <nav x-pagination data-total="100" data-per-page="10" data-current="5"></nav>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-steps')) {
    html += '    <h3>Steps Wizard</h3>\n    <div class="demo-full">\n';
    html += '      <div x-steps data-items="Cart,Shipping,Payment,Confirm" data-current="2"></div>\n';
    html += '    </div>\n';
  }

  return html;
}

// Generate data demos
function generateDataDemos(behaviors) {
  let html = '';

  if (behaviors.some(b => b.name === 'wb-avatar')) {
    html += '    <h3>Avatars</h3>\n    <div class="demo-row">\n';
    html += '      <wb-avatar src="https://i.pravatar.cc/150?img=1"></wb-avatar>\n';
    html += '      <wb-avatar src="https://i.pravatar.cc/150?img=2" size="lg"></wb-avatar>\n';
    html += '      <wb-avatar initials="JD"></wb-avatar>\n';
    html += '      <wb-avatar src="https://i.pravatar.cc/150?img=3" status="online"></wb-avatar>\n';
    html += '      <wb-avatar src="https://i.pravatar.cc/150?img=4" status="away"></wb-avatar>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'wb-skeleton')) {
    html += '    <h3>Skeleton Loaders</h3>\n    <div class="demo-row">\n';
    html += '      <wb-skeleton variant="text" lines="3" style="width: 200px;"></wb-skeleton>\n';
    html += '      <wb-skeleton variant="circle" width="60px"></wb-skeleton>\n';
    html += '      <wb-skeleton variant="rect" width="150px" height="100px"></wb-skeleton>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-timeline')) {
    html += '    <h3>Timeline</h3>\n    <div class="demo-full">\n';
    html += '      <div x-timeline data-items="Project kickoff,Design phase,Development,Testing,Launch"></div>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-kbd')) {
    html += '    <h3>Keyboard Keys</h3>\n    <div class="demo-row">\n';
    html += '      <p>Press <span x-kbd>Ctrl</span> + <span x-kbd>S</span> to save, or <span x-kbd>⌘</span> + <span x-kbd>K</span> on Mac.</p>\n';
    html += '    </div>\n';
  }

  return html;
}

// Generate media demos
function generateMediaDemos(behaviors) {
  let html = '';

  if (behaviors.some(b => b.name === 'x-image')) {
    html += '    <h3>Enhanced Images</h3>\n    <div class="demo-row">\n';
    html += '      <img x-image src="https://picsum.photos/200/150?r=enh1" alt="Lazy loaded" data-lazy class="demo-image">\n';
    html += '      <img x-image src="https://picsum.photos/200/150?r=enh2" alt="Zoomable" data-zoomable class="demo-image">\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-gallery')) {
    html += '    <h3>Gallery</h3>\n    <div class="demo-full">\n';
    html += '      <div x-gallery data-columns="4">\n';
    html += '        <img src="https://picsum.photos/200/200?r=gal1" alt="Gallery 1">\n';
    html += '        <img src="https://picsum.photos/200/200?r=gal2" alt="Gallery 2">\n';
    html += '        <img src="https://picsum.photos/200/200?r=gal3" alt="Gallery 3">\n';
    html += '        <img src="https://picsum.photos/200/200?r=gal4" alt="Gallery 4">\n';
    html += '      </div>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'wb-audio')) {
    html += '    <h3>Audio Player</h3>\n    <div class="demo-full">\n';
    html += '      <wb-audio data-src="https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3" data-show-eq="true" data-volume="0.7"></wb-audio>\n';
    html += '    </div>\n\n';
  }

  if (behaviors.some(b => b.name === 'x-youtube')) {
    html += '    <h3>YouTube Embed</h3>\n    <div class="demo-full youtube-container">\n';
    html += '      <div x-youtube data-id="dQw4w9WgXcQ" data-ratio="16:9"></div>\n';
    html += '    </div>\n';
  }

  return html;
}

// Generate effects demos
function generateEffectDemos(behaviors) {
  let html = '';

  // Attention seekers
  const attentionSeekers = behaviors.filter(b => b.type === 'action' && [
    'x-bounce', 'x-shake', 'x-pulse', 'x-flash', 'x-tada', 'x-wobble', 'x-jello', 'x-heartbeat'
  ].includes(b.name));

  if (attentionSeekers.length > 0) {
    html += '    <h3>Attention Seekers (click to trigger)</h3>\n    <div class="demo-row">\n';
    attentionSeekers.forEach(behavior => {
      const displayName = behavior.name.replace('x-', '').charAt(0).toUpperCase() + behavior.name.replace('x-', '').slice(1);
      const emoji = behavior.name === 'x-heartbeat' ? '💓 ' : '';
      html += `      <button class="effect-demo" ${behavior.name}>${emoji}${displayName}</button>\n`;
    });
    html += '    </div>\n\n';
  }

  // Entrance animations
  const entranceAnimations = behaviors.filter(b => b.type === 'action' && [
    'x-fadein', 'x-slidein', 'x-zoomin', 'x-flip'
  ].includes(b.name));

  if (entranceAnimations.length > 0) {
    html += '    <h3>Entrance Animations</h3>\n    <wb-demo>\n';
    entranceAnimations.forEach(behavior => {
      const displayName = behavior.name.replace('x-', '').charAt(0).toUpperCase() + behavior.name.replace('x-', '').slice(1);
      if (behavior.name === 'x-slidein') {
        html += `      <button class="effect-demo" ${behavior.name} data-direction="left">${displayName} Left</button>\n`;
        html += `      <button class="effect-demo" ${behavior.name} data-direction="right">${displayName} Right</button>\n`;
        html += `      <button class="effect-demo" ${behavior.name} data-direction="up">${displayName} Up</button>\n`;
      } else {
        html += `      <button class="effect-demo" ${behavior.name}>${displayName}</button>\n`;
      }
    });
    html += '    </wb-demo>\n\n';
  }

  // Special effects
  const specialEffects = behaviors.filter(b => b.type === 'action' && [
    'x-confetti', 'x-fireworks', 'x-snow', 'x-sparkle', 'x-glow', 'x-rainbow', 'x-ripple'
  ].includes(b.name));

  if (specialEffects.length > 0) {
    html += '    <h3>Special Effects</h3>\n    <wb-demo>\n';
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
        html += `      <button class="wb-btn wb-btn--primary" ${behavior.name}>Click for Ripple</button>\n`;
        html += `      <div ${behavior.name} class="ripple-box">Ripple on any element</div>\n`;
      } else {
        html += `      <button class="wb-btn wb-btn--primary" ${behavior.name}>${emoji}${displayName}</button>\n`;
      }
    });
    html += '    </wb-demo>\n';
  }

  return html;
}

// Generate utility demos
function generateUtilityDemos(behaviors) {
  let html = '';

  // Copy functionality
  if (behaviors.some(b => b.name === 'x-copy')) {
    html += '    <wb-demo title="Copy functionality">\n';
    html += '      <button class="wb-btn wb-btn--primary" x-copy data-copy="Text copied to clipboard!">📋 Copy Text</button>\n';
    html += '      <button class="wb-btn wb-btn--primary" x-copy data-copy="npm install wb-framework">📋 Copy Command</button>\n';
    html += '    </wb-demo>\n\n';
  }

  // Share, Print & Fullscreen
  const shareUtilities = behaviors.filter(b => ['x-share', 'x-print', 'x-fullscreen'].includes(b.name));
  if (shareUtilities.length > 0) {
    html += '    <h3>Share, Print & Fullscreen</h3>\n    <wb-demo>\n';
    shareUtilities.forEach(behavior => {
      const displayName = behavior.name.replace('x-', '').charAt(0).toUpperCase() + behavior.name.replace('x-', '').slice(1);
      const emoji = {
        'x-share': '📤 ',
        'x-print': '🖨️ ',
        'x-fullscreen': '⛶ '
      }[behavior.name] || '';
      html += `      <button class="wb-btn wb-btn--secondary" ${behavior.name} data-share-title="wb-starter" data-share-url="https://example.com">${emoji}${displayName}</button>\n`;
    });
    html += '    </wb-demo>\n\n';
  }

  // Clock & Countdown
  const timeUtilities = behaviors.filter(b => ['x-clock', 'x-countdown', 'x-relativetime'].includes(b.name));
  if (timeUtilities.length > 0) {
    html += '    <h3>Clock & Countdown</h3>\n    <wb-demo>\n';
    timeUtilities.forEach(behavior => {
      if (behavior.name === 'x-clock') {
        html += '      <div x-clock class="time-display"></div>\n';
      } else if (behavior.name === 'x-countdown') {
        html += '      <div x-countdown data-to="2027-12-31" class="time-display"></div>\n';
      } else if (behavior.name === 'x-relativetime') {
        html += '      <span x-relativetime data-date="2025-01-01" class="time-display">Jan 1, 2025</span>\n';
      }
    });
    html += '    </wb-demo>\n\n';
  }

  // Dark Mode Toggle
  if (behaviors.some(b => b.name === 'x-darkmode')) {
    html += '    <h3>Dark Mode Toggle</h3>\n    <wb-demo>\n';
    html += '      <button class="wb-btn wb-btn--primary" x-darkmode>🌙 Toggle Dark Mode</button>\n';
    html += '      <wb-themecontrol></wb-themecontrol>\n';
    html += '    </wb-demo>\n\n';
  }

  // Text Truncate
  if (behaviors.some(b => b.name === 'x-truncate')) {
    html += '    <h3>Text Truncate</h3>\n    <wb-demo>\n';
    html += '      <p x-truncate data-lines="2" class="truncate-box">\n';
    html += '        This is a very long text that will be truncated after two lines. Lorem ipsum dolor sit amet, consectetur\n';
    html += '        adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n';
    html += '      </p>\n';
    html += '    </wb-demo>\n';
  }

  return html;
}

// Generate generic demos for unknown categories
function generateGenericDemos(behaviors) {
  let html = '    <wb-demo>\n';
  behaviors.forEach(behavior => {
    const displayName = behavior.name.startsWith('wb-') ? behavior.name : behavior.name.replace('x-', '');
    html += `      <div class="behavior-demo" data-behavior="${behavior.name}">\n`;
    html += `        <h4>${displayName}</h4>\n`;
    html += `        <p>${behavior.description || 'No description available'}</p>\n`;
    html += '      </div>\n';
  });
  html += '    </wb-demo>\n';
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