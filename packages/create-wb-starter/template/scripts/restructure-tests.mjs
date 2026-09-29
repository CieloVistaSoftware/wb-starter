/**
 * scripts/restructure-tests.mjs
 * 
 * Moves existing test files into mirrored folder structure
 * and generates stub tests for uncovered behaviors.
 * 
 * DRY RUN by default — pass --apply to actually move files.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TESTS = path.join(ROOT, 'tests');
const SCHEMAS = path.join(ROOT, 'src/wb-models');
const VIEWMODELS = path.join(ROOT, 'src/wb-viewmodels');

const apply = process.argv.includes('--apply');

// ═══════════════════════════════════════════════════════════════════════
// MIGRATION MAP: existing file → new location
// ═══════════════════════════════════════════════════════════════════════

const MOVES = {
  // Builder tests → tests/builder/
  'behaviors/ui/builder-api.spec.ts':          'builder/builder-api.spec.ts',
  'behaviors/builder-mkel.spec.ts':            'builder/builder-mkel.spec.ts',
  'behaviors/ui/builder-sidebar.spec.ts':      'builder/builder-sidebar.spec.ts',
  'behaviors/ui/builder-permutations.spec.ts': 'builder/builder-permutations.spec.ts',

  // Card tests → tests/cards/
  'behaviors/ui/card.spec.ts':                 'cards/card.spec.ts',
  'behaviors/ui/cardbutton.spec.ts':           'cards/cardbutton.spec.ts',
  'behaviors/ui/cardchip.spec.ts':             'cards/cardchip.spec.ts',
  'behaviors/ui/cardhero.spec.ts':             'cards/cardhero.spec.ts',
  'behaviors/ui/cardoverlay.spec.ts':          'cards/cardoverlay.spec.ts',
  'behaviors/ui/cardportfolio.spec.ts':        'cards/cardportfolio.spec.ts',
  'behaviors/ui/cardproduct.spec.ts':          'cards/cardproduct.spec.ts',
  'behaviors/ui/cardprogressbar.spec.ts':      'cards/cardprogressbar.spec.ts',
  'behaviors/ui/cardspinner.spec.ts':          'cards/cardspinner.spec.ts',
  'behaviors/ui/card-image-render.spec.ts':    'cards/card-image-render.spec.ts',
  'behaviors/card-product.spec.ts':            'cards/card-product-behavior.spec.ts',
  'behaviors/card-styling.spec.ts':            'cards/card-styling.spec.ts',
  'behaviors/cardimage-render.spec.ts':        'cards/cardimage-render.spec.ts',
  'behaviors/cards-comprehensive.spec.ts':     'cards/cards-comprehensive.spec.ts',
  'behaviors/cards-showcase.spec.ts':          'cards/cards-showcase.spec.ts',
  'behaviors/clickable-card.spec.ts':          'cards/clickable-card.spec.ts',

  // Component tests → tests/components/
  'behaviors/ui/audio.spec.ts':                'components/audio.spec.ts',
  'behaviors/ui/figure.spec.ts':               'components/figure.spec.ts',
  'behaviors/ui/notes.spec.ts':                'components/notes.spec.ts',
  'behaviors/notes-updates.spec.ts':           'components/notes-updates.spec.ts',
  'behaviors/datepicker.spec.ts':              'components/datepicker.spec.ts',
  'behaviors/timepicker.spec.ts':              'components/timepicker.spec.ts',
  'behaviors/input-switch.spec.ts':            'components/input-switch.spec.ts',
  'behaviors/pill-shortcut.spec.ts':           'components/pill-shortcut.spec.ts',
  'behaviors/ui/feedback-visual.spec.ts':      'components/feedback-visual.spec.ts',
  'behaviors/diff.spec.ts':                    'components/diff.spec.ts',
  'behaviors/button-toasts.spec.ts':           'components/button-toasts.spec.ts',

  // Semantics tests → tests/semantics/
  'behaviors/semantics-new.spec.ts':           'semantics/semantics-new.spec.ts',
  'behaviors/semantics-code-scroll.spec.ts':   'semantics/semantics-code-scroll.spec.ts',
  'behaviors/js-syntax-compliance.spec.ts':    'semantics/js-syntax-compliance.spec.ts',

  // Page-level tests → tests/pages/
  'behaviors/components-page.spec.ts':         'pages/components-page.spec.ts',
  'behaviors/header.spec.ts':                  'pages/header.spec.ts',
  'behaviors/hero-variants-page.spec.ts':      'pages/hero-variants-page.spec.ts',
  'behaviors/ui/all-components.spec.ts':       'pages/all-components.spec.ts',

  // Behavior framework tests → tests/behaviors/ (stays, slimmed)
  'behaviors/behavior-validation.spec.ts':     'behaviors/behavior-validation.spec.ts',
  'behaviors/ui/behavior-verification.spec.ts':'behaviors/behavior-verification.spec.ts',
  'behaviors/ui/behaviors.spec.ts':            'behaviors/behaviors.spec.ts',
  'behaviors/behaviors-showcase.spec.ts':      'behaviors/behaviors-showcase.spec.ts',
  'behaviors/behaviors-showcase-definitive.spec.ts': 'behaviors/behaviors-showcase-definitive.spec.ts',
  'behaviors/behaviors-showcase-visual.spec.ts': 'behaviors/behaviors-showcase-visual.spec.ts',
  'behaviors/autoinject.spec.ts':              'behaviors/autoinject.spec.ts',
  'behaviors/auto-injection-compliance.spec.ts': 'behaviors/auto-injection-compliance.spec.ts',
  'behaviors/global-attributes.spec.ts':       'behaviors/global-attributes.spec.ts',
  'behaviors/permutation-compliance.spec.ts':  'behaviors/permutation-compliance.spec.ts',
  'behaviors/scrollalong.spec.ts':             'behaviors/scrollalong.spec.ts',
  'behaviors/sticky.spec.ts':                  'behaviors/sticky.spec.ts',
  'behaviors/autosize.spec.ts':                'behaviors/autosize.spec.ts',
  'behaviors/pce.spec.ts':                     'behaviors/pce.spec.ts',
  'behaviors/pce-demo.spec.ts':                'behaviors/pce-demo.spec.ts',
  'behaviors/functional-runner.spec.ts':       'behaviors/functional-runner.spec.ts',
  'behaviors/fixes-verification.spec.ts':      'behaviors/fixes-verification.spec.ts',

  // Deprecated/leftover in ui/
  'behaviors/ui/compliance.spec.ts':           'behaviors/_deprecated/compliance.spec.ts',
  'behaviors/ui/schema-compliance.spec.ts':    'behaviors/_deprecated/schema-compliance.spec.ts',
};

// ═══════════════════════════════════════════════════════════════════════
// EXECUTE
// ═══════════════════════════════════════════════════════════════════════

console.log(`\n${'='.repeat(60)}`);
console.log(apply ? '  APPLYING RESTRUCTURE' : '  DRY RUN (pass --apply to execute)');
console.log(`${'='.repeat(60)}\n`);

let moved = 0;
let skipped = 0;
let errors = 0;

for (const [from, to] of Object.entries(MOVES)) {
  const src = path.join(TESTS, from);
  const dst = path.join(TESTS, to);

  if (!fs.existsSync(src)) {
    console.log(`  SKIP (not found): ${from}`);
    skipped++;
    continue;
  }

  console.log(`  ${from}\n    → ${to}`);

  if (apply) {
    try {
      const dir = path.dirname(dst);
      fs.mkdirSync(dir, { recursive: true });
      fs.renameSync(src, dst);
      moved++;
    } catch (e) {
      console.log(`    ❌ ERROR: ${e.message}`);
      errors++;
    }
  } else {
    moved++;
  }
}

// Also move .bak and .html files
const extras = [
  'behaviors/components-page.spec.ts.bak',
  'behaviors/fix-card-layout.html',
];
for (const f of extras) {
  const src = path.join(TESTS, f);
  if (fs.existsSync(src)) {
    const base = path.basename(f);
    const dst = path.join(TESTS, 'behaviors/_misc', base);
    console.log(`  ${f}\n    → behaviors/_misc/${base}`);
    if (apply) {
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.renameSync(src, dst);
    }
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`  ${moved} moves, ${skipped} skipped, ${errors} errors`);
console.log(`${'='.repeat(60)}\n`);

// ═══════════════════════════════════════════════════════════════════════
// REPORT: What's left in behaviors/ and behaviors/ui/ after migration
// ═══════════════════════════════════════════════════════════════════════

if (!apply) {
  const remaining = (dir) => {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => f.endsWith('.spec.ts'));
  };

  const bLeft = remaining(path.join(TESTS, 'behaviors'));
  const uiLeft = remaining(path.join(TESTS, 'behaviors/ui'));

  const allMoved = new Set(Object.keys(MOVES));
  const unmoved_b = bLeft.filter(f => !allMoved.has(`behaviors/${f}`));
  const unmoved_ui = uiLeft.filter(f => !allMoved.has(`behaviors/ui/${f}`));

  if (unmoved_b.length || unmoved_ui.length) {
    console.log('⚠️  UNMAPPED FILES (still in old location):');
    unmoved_b.forEach(f => console.log(`  behaviors/${f}`));
    unmoved_ui.forEach(f => console.log(`  behaviors/ui/${f}`));
  } else {
    console.log('✅ All spec files are mapped.');
  }
}
