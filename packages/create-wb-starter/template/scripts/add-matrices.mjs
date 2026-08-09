/**
 * Add test.matrix.combinations to schemas that are missing them.
 * Each matrix entry includes the essential display attributes
 * so auto-showcase generates visible, working demos.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const MODELS = resolve('src/wb-models');

const matrices = {
  'card': [
    { title: 'Default Card', subtitle: 'A simple card', footer: 'Card footer' },
    { title: 'Glass Card', variant: 'glass', subtitle: 'With glass effect' },
    { title: 'Bordered Card', variant: 'bordered', footer: 'Bordered style' },
    { title: 'Flat Card', variant: 'flat', subtitle: 'Minimal look' },
    { title: 'Elevated Card', elevated: true, subtitle: 'With shadow' },
    { title: 'Clickable Card', clickable: true, subtitle: 'Click me', footer: 'Interactive' },
    { title: 'Small Card', size: 'sm', subtitle: 'Compact size' },
    { title: 'Large Card', size: 'lg', subtitle: 'Spacious layout', footer: 'Extra room' }
  ],
  'cardportfolio': [
    { name: 'Jane Smith', title: 'UX Designer', company: 'Anthropic', skills: 'Figma,CSS,React', bio: 'Creative designer with 8 years experience', availability: 'available' },
    { name: 'John Doe', title: 'Senior Engineer', company: 'Cielo Vista', skills: 'TypeScript,Node,SQL', variant: 'compact', availability: 'busy' },
    { name: 'Sarah Chen', title: 'Product Manager', company: 'TechCorp', variant: 'horizontal', bio: 'Building products users love', cta: 'Contact Me' },
    { name: 'Alex Rivera', title: 'Full Stack Dev', skills: 'Python,Go,Rust', variant: 'full', availability: 'open-to-opportunities', stats: '[{"label":"Projects","value":"24"},{"label":"Years","value":"10"}]' }
  ],
  'button': [
    { label: 'Primary', variant: 'primary' },
    { label: 'Secondary', variant: 'secondary' },
    { label: 'Success', variant: 'success' },
    { label: 'Warning', variant: 'warning' },
    { label: 'Error', variant: 'error' },
    { label: 'Ghost', variant: 'ghost' },
    { label: 'Outline', variant: 'outline' },
    { label: 'Small', variant: 'primary', size: 'sm' },
    { label: 'Large', variant: 'primary', size: 'lg' },
    { label: 'Loading...', variant: 'primary', loading: true },
    { label: '🚀 With Icon', variant: 'primary', icon: '🚀' }
  ],
  'checkbox': [
    { label: 'Default checkbox' },
    { label: 'Checked', checked: true },
    { label: 'Disabled', disabled: true },
    { label: 'Primary variant', variant: 'primary', label: 'Primary' },
    { label: 'Success variant', variant: 'success', checked: true },
    { label: 'Small', size: 'sm', label: 'Small checkbox' },
    { label: 'Large', size: 'lg', label: 'Large checkbox' }
  ],
  'input': [
    { label: 'Text Input', placeholder: 'Enter text...' },
    { label: 'Email', inputType: 'email', placeholder: 'you@example.com' },
    { label: 'Password', inputType: 'password', placeholder: '••••••••' },
    { label: 'With Helper', placeholder: 'Type here', helper: 'This is helper text' },
    { label: 'Error State', variant: 'error', error: 'This field is required', value: '' },
    { label: 'Success State', variant: 'success', value: 'Valid input' },
    { label: 'With Icon', icon: '🔍', placeholder: 'Search...', clearable: true },
    { label: 'Disabled', disabled: true, value: 'Cannot edit' },
    { label: 'Small Input', size: 'sm', placeholder: 'Small' },
    { label: 'Large Input', size: 'lg', placeholder: 'Large' }
  ],
  'search': [
    { placeholder: 'Search...' },
    { placeholder: 'Search docs...', size: 'lg' },
    { placeholder: 'Glass search', variant: 'glass' },
    { placeholder: 'Minimal', variant: 'minimal' },
    { placeholder: 'Instant search', instant: true },
    { placeholder: 'Loading...', loading: true }
  ],
  'slider': [
    { }
  ],
  'toggle': [
    { target: '#content' }
  ],
  'timeline': [
    { items: 'Project Kickoff,Design Phase,Development,Testing,Launch' },
    { items: 'Q1 Planning,Q2 Execution,Q3 Review,Q4 Delivery' },
    { items: 'Research,Prototype,Build,Ship' }
  ],
  'mdhtml': [
    { src: '../demos/code.md' },
    { gfm: true },
    { sanitize: true, gfm: true }
  ],
  'codecontrol': [
    { }
  ],
  'stagelight': [
    { variant: 'beam', color: '#6366f1', intensity: 0.7 },
    { variant: 'spotlight', color: '#f59e0b', intensity: 0.5, size: '400px' },
    { variant: 'fixture', color: '#ef4444', label: 'Red Light' },
    { variant: 'beam', color: '#22c55e', speed: '5s' }
  ],
  'draggable': [
    { axis: 'both' },
    { axis: 'x' },
    { axis: 'y' }
  ],
  'resizable': [
    { handles: 'se' }
  ],
  'copy': [
    { text: 'Hello World' },
    { text: 'npm install wb-starter' }
  ],
  'darkmode': [
    { }
  ],
  'themecontrol': [
    { }
  ],
  'collapse': [
    { expanded: false },
    { expanded: true }
  ],
  'hero': [
    { variant: 'default' },
    { variant: 'cosmic' }
  ],
  'views': [
    { }
  ]
};

let updated = 0;
let skipped = 0;

for (const [name, combos] of Object.entries(matrices)) {
  const filePath = resolve(MODELS, `${name}.schema.json`);
  try {
    const schema = JSON.parse(readFileSync(filePath, 'utf-8'));
    
    // Don't overwrite existing matrices
    if (schema.test?.matrix?.combinations?.length) {
      console.log(`  ⏭️  ${name} — already has ${schema.test.matrix.combinations.length} combos`);
      skipped++;
      continue;
    }

    // Ensure test object exists
    if (!schema.test) schema.test = {};
    if (!schema.test.matrix) schema.test.matrix = {};
    
    schema.test.matrix.combinations = combos;
    
    writeFileSync(filePath, JSON.stringify(schema, null, 2) + '\n', 'utf-8');
    console.log(`  ✅ ${name} — added ${combos.length} combinations`);
    updated++;
  } catch (e) {
    console.error(`  ❌ ${name} — ${e.message}`);
  }
}

console.log(`\n══════════════════════════════`);
console.log(`  Updated: ${updated}`);
console.log(`  Skipped: ${skipped}`);
console.log(`══════════════════════════════`);
