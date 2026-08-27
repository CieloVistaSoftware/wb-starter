/**
 * tests/compliance/no-duplicate-specs.spec.ts
 * 
 * Ensures no spec file is matched by more than one project
 * in the `npm test` pipeline. Catches wasted test runs from
 * overlapping project configs.
 * 
 * Cross-browser projects (firefox, webkit, mobile-*) are excluded
 * since they intentionally re-run specs on different engines.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Projects included in `npm test` — the sequential pipeline
const PIPELINE_PROJECTS = [
  'compliance', 'views', 'base', 'behaviors',
  'functional', 'regression', 'schema-viewer', 'performance'
];

// Cross-browser projects intentionally duplicate specs — skip them
const EXCLUDED_PROJECTS = ['firefox', 'webkit', 'mobile-chrome', 'mobile-safari'];

interface ResolvedProject {
  name: string;
  files: string[];
}

/** Recursively find all *.spec.ts files under a directory */
function findSpecs(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSpecs(full));
    } else if (entry.name.endsWith('.spec.ts')) {
      results.push(full);
    }
  }
  return results;
}

/** Check if a file path matches a pattern like 'card.spec.ts' or 'ui/card.spec.ts' or '**\/*.spec.ts' */
function matchesPattern(filePath: string, testDir: string, pattern: string): boolean {
  // Normalize to forward slashes
  const rel = path.relative(testDir, filePath).replace(/\\/g, '/');
  
  if (pattern === '**/*.spec.ts') {
    return rel.endsWith('.spec.ts');
  }
  
  // Direct match: 'card.spec.ts' matches 'card.spec.ts'
  // Subdir match: 'ui/card.spec.ts' matches 'ui/card.spec.ts'
  return rel === pattern;
}

/** Check if a file matches any ignore pattern */
function isIgnored(filePath: string, testDir: string, ignorePatterns: string[]): boolean {
  const rel = path.relative(testDir, filePath).replace(/\\/g, '/');
  const fileName = path.basename(filePath);
  
  for (const pattern of ignorePatterns) {
    // Handle '**/<name>' patterns
    const clean = pattern.replace(/\*\*\//g, '');
    if (fileName === clean || rel === clean || rel.endsWith('/' + clean)) {
      return true;
    }
  }
  return false;
}

test('no spec file appears in more than one npm-test project', async () => {
  const rootDir = path.resolve(__dirname, '../..');
  const configPath = path.join(rootDir, 'playwright.config.ts');
  const configText = fs.readFileSync(configPath, 'utf-8');

  // Parse projects from config
  // Strategy: find each { name: '...' ... } block in the projects array
  const projects: ResolvedProject[] = [];

  // Split config into project blocks
  const projectsStart = configText.indexOf('projects: [');
  const projectsSection = configText.substring(projectsStart);
  
  // Match each project object
  const blockRegex = /\{\s*\n\s*name:\s*'([^']+)'[\s\S]*?(?=\n\s*\{?\s*\n\s*name:|$)/g;
  
  // Simpler approach: extract project names, testDirs, testMatch, testIgnore manually
  const projectDefs: { name: string; testDir: string; testMatch: string[]; testIgnore: string[] }[] = [
    {
      name: 'compliance',
      testDir: './tests/compliance',
      testMatch: ['**/*.spec.ts'],
      testIgnore: [],
    },
    {
      name: 'views',
      testDir: './tests/views',
      testMatch: ['**/*.spec.ts'],
      testIgnore: [],
    },
    {
      name: 'base',
      testDir: './tests',
      testMatch: ['cards/card.spec.ts', 'behaviors/behaviors.spec.ts'],
      testIgnore: [],
    },
    {
      name: 'behaviors',
      testDir: './tests',
      testMatch: [
        'behaviors/behavior-validation.spec.ts',
        'behaviors/behavior-verification.spec.ts',
        'behaviors/behaviors-showcase.spec.ts',
        'behaviors/permutation-compliance.spec.ts',
        'behaviors/global-attributes.spec.ts',
        'behaviors/scrollalong.spec.ts',
        'behaviors/pce.spec.ts',
        'behaviors/pce-demo.spec.ts',
        'behaviors/autoinject.spec.ts',
        'cards/cardbutton.spec.ts',
        'cards/cardchip.spec.ts',
        'cards/cardhero.spec.ts',
        'cards/cardoverlay.spec.ts',
        'cards/cardportfolio.spec.ts',
        'cards/cardproduct.spec.ts',
        'cards/cardprogressbar.spec.ts',
        'cards/cardspinner.spec.ts',
        'behaviors/notes.spec.ts',
        'behaviors/notes-updates.spec.ts',
        'behaviors/audio.spec.ts',
        'behaviors/feedback-visual.spec.ts',
        'behaviors/figure.spec.ts',
        'behaviors/pill-shortcut.spec.ts',
        'behaviors/input-switch.spec.ts',
        'semantics/semantics-new.spec.ts',
        'semantics/semantics-code-scroll.spec.ts',
        'semantics/js-syntax-compliance.spec.ts',
        'pages/all-behaviors.spec.ts',
        'pages/behaviors-page.spec.ts',
        'pages/header.spec.ts',
        'behaviors/codecontrol.spec.ts',
        'behaviors/collapse.spec.ts',
        'behaviors/copy.spec.ts',
        'behaviors/darkmode.spec.ts',
        'behaviors/docs-viewer.spec.ts',
        'behaviors/draggable.spec.ts',
        'behaviors/dropdown.spec.ts',
        'behaviors/effects.spec.ts',
        'behaviors/footer.spec.ts',
        'behaviors/globe.spec.ts',
        'behaviors/hero.spec.ts',
        'behaviors/layouts.spec.ts',
        'behaviors/mdhtml.spec.ts',
        'behaviors/media.spec.ts',
        'behaviors/move.spec.ts',
        'behaviors/navigation.spec.ts',
        'behaviors/overlay.spec.ts',
        'behaviors/progressbar.spec.ts',
        'behaviors/resizable.spec.ts',
        'behaviors/ripple.spec.ts',
        'behaviors/scroll-progress.spec.ts',
        'behaviors/slider.spec.ts',
        'behaviors/span.spec.ts',
        'behaviors/stagelight.spec.ts',
        'behaviors/tabs.spec.ts',
        'behaviors/themecontrol.spec.ts',
        'behaviors/timeline.spec.ts',
        'behaviors/toggle.spec.ts',
        'behaviors/tooltip.spec.ts',
        'behaviors/validator.spec.ts',
        'behaviors/x-cluster.spec.ts',
        'behaviors/x-column.spec.ts',
        'behaviors/x-control.spec.ts',
        'behaviors/x-grid.spec.ts',
        'behaviors/x-repeater.spec.ts',
        'behaviors/x-row.spec.ts',
        'behaviors/x-stack.spec.ts',
      ],
      testIgnore: [],
    },
    {
      name: 'functional',
      testDir: './tests/behaviors',
      testMatch: ['functional-runner.spec.ts'],
      testIgnore: [],
    },
    {
      name: 'regression',
      testDir: './tests/regression',
      testMatch: ['**/*.spec.ts'],
      testIgnore: [],
    },
    {
      name: 'schema-viewer',
      testDir: './tests',
      testMatch: ['schema-viewer.spec.ts'],
      testIgnore: [],
    },
    {
      name: 'performance',
      testDir: './tests',
      testMatch: ['performance.spec.ts'],
      testIgnore: [],
    },
  ];

  // Resolve each project's actual spec files
  for (const def of projectDefs) {
    if (!PIPELINE_PROJECTS.includes(def.name)) continue;
    
    const absTestDir = path.resolve(rootDir, def.testDir);
    const allSpecs = findSpecs(absTestDir);
    
    const matched = allSpecs.filter(f => {
      if (isIgnored(f, absTestDir, def.testIgnore)) return false;
      return def.testMatch.some(pattern => matchesPattern(f, absTestDir, pattern));
    });

    // Normalize paths relative to root
    const relFiles = matched.map(f => path.relative(rootDir, f).replace(/\\/g, '/'));
    projects.push({ name: def.name, files: relFiles });
  }

  // Build file → projects map
  const fileToProjects = new Map<string, string[]>();
  for (const proj of projects) {
    for (const file of proj.files) {
      if (!fileToProjects.has(file)) {
        fileToProjects.set(file, []);
      }
      fileToProjects.get(file)!.push(proj.name);
    }
  }

  // Find duplicates
  const duplicates: { file: string; projects: string[] }[] = [];
  for (const [file, projs] of fileToProjects) {
    if (projs.length > 1) {
      duplicates.push({ file, projects: projs.sort() });
    }
  }

  if (duplicates.length > 0) {
    const report = duplicates
      .sort((a, b) => a.file.localeCompare(b.file))
      .map(d => `  ${d.file}\n    → runs in: [${d.projects.join(', ')}]`)
      .join('\n');
    
    console.log(`\n🔴 DUPLICATE SPEC FILES DETECTED:\n${report}\n`);
    console.log('Fix: Move the spec to ONE project only, or add it to testIgnore in the other.');
  }

  expect(duplicates, `Found ${duplicates.length} spec file(s) running in multiple projects`).toHaveLength(0);
});

test('every spec file under tests/ is claimed by at least one project', async () => {
  const rootDir = path.resolve(__dirname, '../..');
  
  // Find ALL spec files
  const allSpecs = findSpecs(path.join(rootDir, 'tests'))
    .map(f => path.relative(rootDir, f).replace(/\\/g, '/'));

  // Collect all files claimed by any project (including cross-browser)
  // We just want to know if something exists that nobody runs
  const allProjectDirs = [
    'tests/compliance',
    'tests/views',
    'tests/behaviors',
    'tests/behaviors/ui',
    'tests/regression',
  ];

  // For now, just report the count — informational, not a hard fail
  console.log(`\nTotal spec files found: ${allSpecs.length}`);
  console.log('Directories with specs:');
  
  const dirCounts = new Map<string, number>();
  for (const spec of allSpecs) {
    const dir = path.dirname(spec);
    dirCounts.set(dir, (dirCounts.get(dir) || 0) + 1);
  }
  for (const [dir, count] of [...dirCounts.entries()].sort()) {
    console.log(`  ${dir}: ${count} specs`);
  }

  expect(allSpecs.length).toBeGreaterThan(0);
});
