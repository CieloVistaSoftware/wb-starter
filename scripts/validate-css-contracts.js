/**
 * HTML-CSS Contract Validator
 * ===========================
 * Catches mismatches between HTML classes and CSS selectors.
 * Can automatically fix dead CSS code.
 * 
 * Usage:
 *   node scripts/validate-css-contracts.js           # Report only
 *   node scripts/validate-css-contracts.js --fix     # Report and remove dead CSS
 *   node scripts/validate-css-contracts.js --verbose # Show all details
 * 
 * Output:
 *   - data/css-validation-report.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Parse CLI args
const args = process.argv.slice(2);
const FIX_MODE = args.includes('--fix');
const VERBOSE = args.includes('--verbose');

// Configuration
const CONFIG = {
  htmlFiles: [
    'builder.html',
    'index.html',
    'src/builder/views/*.html'
  ],
  cssFiles: [
    'src/styles/builder.css',
    'src/styles/components/*.css',
    'src/styles/site.css',
    'src/styles/themes.css'
  ],
  
  // Classes added by JavaScript at runtime (state classes)
  jsAddedClasses: [
    // Drawer states
    'wb-drawer--collapsed',
    'resizing',
    'collapsed',
    'dragging',
    'open',
    'visible',
    'active',
    'selected',
    'focused',
    'disabled',
    'loading',
    'error',
    'success',
    'warning',
    'valid',
    'invalid',
    // Animation states
    'drag-over',
    'show',
    'hide',
    // Panel states  
    'has-items',
    // Preview mode
    'preview-mode',
  ],
  
  // Classes for custom elements (wb-* components render their own markup)
  customElementPrefixes: [
    'wb-spinner',
    'wb-dialog',
    'wb-button',
    'wb-table',
    'wb-hero',
    'wb-glass',
    'wb-card',
    'wb-badge',
    'wb-progress',
    'wb-avatar',
    'wb-divider',
    'wb-notes',
    'wb-rackmount',
    'wb-btn',
    'wb-input',
    'wb-tag',
    'wb-dot',
    'wb-window',
    'wb-orb',
    'wb-gradient',
    'wb-animate',
    'wb-resizable',
    'wb-content',
    'wb-search',
    'wb-scroll',
  ],
  
  // Utility classes to ignore (framework utilities, dynamic)
  ignorePatterns: [
    /^btn-/,           // Button variants
    /^text-/,          // Text utilities
    /^bg-/,            // Background utilities
    /^p-\d/,           // Padding utilities
    /^m-\d/,           // Margin utilities
    /^grid-/,          // Grid utilities
    /^flex-/,          // Flex utilities
    /^hidden$/,        // Visibility
  ],
  
  // Dead code patterns - CSS that references old/removed HTML
  deadCodePatterns: [
    /\.wb-drawer-toggle[^_]/,
    /\.wb-drawer-handle[^_]/,
    /\.sidebar-left\.collapsed/,
    /\.sidebar-right\.collapsed/,
    /\.sidebar\.collapsed/,
    /\.panel-right\.collapsed/,
    /\.sidebar-toggle\s*\{/,
    /\.sidebar-toggle\s*\.toggle-icon\s*\{/,
    /\.sidebar-toggle:hover\s*\{/,
    /\.sidebar-collapsed-label\s*\{/,
    /\.sidebar-collapsed-label:hover\s*\{/,
    /\.sidebar-resize-handle\s*\{/,
    /\.sidebar-resize-handle::before\s*\{/,
    /\.sidebar-resize-handle:hover::before,?\s*\{/,
    /\.sidebar\.resizing\s*\.sidebar-resize-handle::before\s*\{/,
    /\.sidebar-resize-handle:hover\s*\{/,
    /\.panel-toggle\s*\{/,
    /\.panel-toggle\s*\.toggle-icon\s*\{/,
    /\.panel-toggle:hover\s*\{/,
    /\.panel-collapsed-label\s*\{/,
    /\.panel-collapsed-label:hover\s*\{/,
    /\.panel-resize-handle\s*\{/,
    /\.panel-resize-handle::before\s*\{/,
    /\.panel-resize-handle:hover::before,?\s*\{/,
    /\.panel-right\.resizing\s*\.panel-resize-handle::before\s*\{/,
    /\.panel-resize-handle:hover\s*\{/,
    /\.builder-footer\s*\{/,
    /\.builder-footer\s*p\s*\{/,
    /\.builder-footer\s*kbd\s*\{/,
  ]
};

// Expand glob patterns
function expandGlobs(patterns) {
  const files = [];
  for (const pattern of patterns) {
    const fullPattern = path.join(ROOT, pattern);
    if (pattern.includes('*')) {
      const dir = path.dirname(fullPattern);
      const filePattern = path.basename(pattern);
      if (fs.existsSync(dir)) {
        const dirFiles = fs.readdirSync(dir);
        const regex = new RegExp('^' + filePattern.replace(/\*/g, '.*') + '$');
        for (const file of dirFiles) {
          if (regex.test(file)) {
            files.push(path.join(dir, file));
          }
        }
      }
    } else if (fs.existsSync(fullPattern)) {
      files.push(fullPattern);
    }
  }
  return files;
}

// Extract classes from HTML
function extractHtmlClasses(htmlContent, filePath) {
  const classes = new Map();
  const lines = htmlContent.split('\n');
  
  lines.forEach((line, index) => {
    const classMatches = line.matchAll(/class=["']([^"']+)["']/g);
    for (const match of classMatches) {
      const classNames = match[1].split(/\s+/).filter(Boolean);
      for (const className of classNames) {
        if (!classes.has(className)) {
          classes.set(className, []);
        }
        classes.get(className).push({
          file: filePath,
          line: index + 1,
          context: line.trim().substring(0, 80)
        });
      }
    }
  });
  
  return classes;
}

// Extract class selectors from CSS with line tracking
function extractCssClasses(cssContent, filePath) {
  const classes = new Map();
  const lines = cssContent.split('\n');
  
  lines.forEach((line, index) => {
    if (line.trim().startsWith('/*') || line.trim().startsWith('*') || line.trim().startsWith('@')) {
      return;
    }
    
    const classMatches = line.matchAll(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g);
    for (const match of classMatches) {
      const className = match[1];
      if (!classes.has(className)) {
        classes.set(className, []);
      }
      classes.get(className).push({
        file: filePath,
        line: index + 1,
        selector: line.trim().substring(0, 80)
      });
    }
  });
  
  return classes;
}

// Check if class should be ignored
function shouldIgnore(className) {
  // Utility patterns
  if (CONFIG.ignorePatterns.some(pattern => pattern.test(className))) {
    return true;
  }
  
  // JS-added state classes
  if (CONFIG.jsAddedClasses.includes(className)) {
    return true;
  }
  
  // Custom element classes (wb-spinner, wb-dialog, etc.)
  if (CONFIG.customElementPrefixes.some(prefix => className.startsWith(prefix))) {
    return true;
  }
  
  return false;
}

// Check if a CSS line contains dead code
function isDeadCode(line) {
  return CONFIG.deadCodePatterns.some(pattern => pattern.test(line));
}

// Remove dead CSS rules from a file
function removeDeadCss(filePath, deadLines) {
  if (deadLines.length === 0) return 0;
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Find rule blocks to remove (from selector to closing brace)
  const linesToRemove = new Set();
  
  for (const deadLine of deadLines) {
    // Find the start of the rule (the selector line)
    let startLine = deadLine - 1; // 0-indexed
    
    // Find the end of the rule (closing brace)
    let braceCount = 0;
    let endLine = startLine;
    let foundOpen = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('{')) {
        braceCount++;
        foundOpen = true;
      }
      if (line.includes('}')) {
        braceCount--;
      }
      if (foundOpen && braceCount === 0) {
        endLine = i;
        break;
      }
    }
    
    // Mark lines for removal
    for (let i = startLine; i <= endLine; i++) {
      linesToRemove.add(i);
    }
  }
  
  // Filter out dead lines
  const newLines = lines.filter((_, i) => !linesToRemove.has(i));
  
  // Clean up multiple blank lines
  let cleanedContent = newLines.join('\n');
  cleanedContent = cleanedContent.replace(/\n{3,}/g, '\n\n');
  
  fs.writeFileSync(filePath, cleanedContent);
  
  return linesToRemove.size;
}

// Main validation
async function validate() {
  console.log('🔍 HTML-CSS Contract Validator\n');
  if (FIX_MODE) {
    console.log('🔧 FIX MODE ENABLED - Will remove dead CSS\n');
  }
  
  const htmlFiles = expandGlobs(CONFIG.htmlFiles);
  const cssFiles = expandGlobs(CONFIG.cssFiles);
  
  console.log(`📄 HTML files: ${htmlFiles.length}`);
  console.log(`🎨 CSS files: ${cssFiles.length}\n`);
  
  // Collect all classes
  const htmlClasses = new Map();
  const cssClasses = new Map();
  
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const classes = extractHtmlClasses(content, path.relative(ROOT, file));
    for (const [className, locations] of classes) {
      if (!htmlClasses.has(className)) {
        htmlClasses.set(className, []);
      }
      htmlClasses.get(className).push(...locations);
    }
  }
  
  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const classes = extractCssClasses(content, path.relative(ROOT, file));
    for (const [className, locations] of classes) {
      if (!cssClasses.has(className)) {
        cssClasses.set(className, []);
      }
      cssClasses.get(className).push(...locations);
    }
  }
  
  // Find issues
  const report = {
    timestamp: new Date().toISOString(),
    fixMode: FIX_MODE,
    summary: {
      htmlClasses: htmlClasses.size,
      cssClasses: cssClasses.size,
      missingInCss: 0,
      deadCode: 0,
      unusedButValid: 0,
      fixed: 0
    },
    errors: [],
    deadCode: [],
    warnings: []
  };
  
  // Classes in HTML but not in CSS (ERRORS)
  for (const [className, locations] of htmlClasses) {
    if (shouldIgnore(className)) continue;
    if (!cssClasses.has(className)) {
      report.errors.push({
        type: 'MISSING_CSS',
        class: className,
        message: `Class "${className}" used in HTML but has no CSS rules`,
        locations: locations
      });
      report.summary.missingInCss++;
    }
  }
  
  // Find dead CSS code
  const deadCodeByFile = new Map();
  
  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const relPath = path.relative(ROOT, file);
    
    lines.forEach((line, index) => {
      if (isDeadCode(line)) {
        if (!deadCodeByFile.has(file)) {
          deadCodeByFile.set(file, []);
        }
        deadCodeByFile.get(file).push(index + 1);
        
        report.deadCode.push({
          type: 'DEAD_CODE',
          file: relPath,
          line: index + 1,
          content: line.trim().substring(0, 80)
        });
        report.summary.deadCode++;
      }
    });
  }
  
  // Classes in CSS but not in HTML (warnings - may be valid)
  for (const [className, locations] of cssClasses) {
    if (shouldIgnore(className)) continue;
    if (!htmlClasses.has(className)) {
      // Only warn for project-specific classes
      if (className.startsWith('builder-')) {
        report.warnings.push({
          type: 'UNUSED_CSS',
          class: className,
          message: `Class "${className}" defined in CSS but not found in HTML`,
          locations: locations
        });
        report.summary.unusedButValid++;
      }
    }
  }
  
  // Fix dead code if requested
  if (FIX_MODE && report.deadCode.length > 0) {
    console.log('🔧 FIXING DEAD CODE:\n');
    
    for (const [file, lines] of deadCodeByFile) {
      const relPath = path.relative(ROOT, file);
      const removed = removeDeadCss(file, lines);
      console.log(`   ✂️  ${relPath}: Removed ${removed} lines`);
      report.summary.fixed += removed;
    }
    console.log('');
  }
  
  // Output results
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                      VALIDATION RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (report.errors.length > 0) {
    console.log('❌ ERRORS (Classes in HTML with no CSS rules):\n');
    for (const error of report.errors) {
      console.log(`   .${error.class}`);
      for (const loc of error.locations.slice(0, 3)) {
        console.log(`      └─ ${loc.file}:${loc.line}`);
      }
      console.log('');
    }
  }
  
  if (report.deadCode.length > 0 && !FIX_MODE) {
    console.log('🗑️  DEAD CODE (Old selectors that should be removed):\n');
    for (const dead of report.deadCode.slice(0, 10)) {
      console.log(`   ${dead.file}:${dead.line}`);
      console.log(`      ${dead.content}`);
    }
    if (report.deadCode.length > 10) {
      console.log(`   ... and ${report.deadCode.length - 10} more`);
    }
    console.log('\n   💡 Run with --fix to automatically remove dead code\n');
  }
  
  if (VERBOSE && report.warnings.length > 0) {
    console.log('⚠️  WARNINGS (CSS classes not found in HTML):\n');
    for (const warning of report.warnings.slice(0, 10)) {
      console.log(`   .${warning.class}`);
    }
    if (report.warnings.length > 10) {
      console.log(`   ... and ${report.warnings.length - 10} more`);
    }
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                         SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   HTML classes found:    ${report.summary.htmlClasses}`);
  console.log(`   CSS classes found:     ${report.summary.cssClasses}`);
  console.log(`   ❌ Missing CSS rules:   ${report.summary.missingInCss}`);
  console.log(`   🗑️  Dead code lines:    ${report.summary.deadCode}`);
  if (FIX_MODE) {
    console.log(`   ✂️  Lines removed:      ${report.summary.fixed}`);
  }
  if (VERBOSE) {
    console.log(`   ⚠️  Unused (valid):     ${report.summary.unusedButValid}`);
  }
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Write report
  const reportPath = path.join(ROOT, 'data', 'css-validation-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Full report: ${path.relative(ROOT, reportPath)}`);
  
  // Exit codes
  if (report.errors.length > 0) {
    console.log('\n💥 Validation FAILED - fix the errors above');
    process.exit(1);
  } else if (report.deadCode.length > 0 && !FIX_MODE) {
    console.log('\n⚠️  Validation PASSED with warnings - run --fix to clean up');
    process.exit(0);
  } else {
    console.log('\n✅ Validation PASSED');
    process.exit(0);
  }
}

validate().catch(err => {
  console.error('Validation error:', err);
  process.exit(1);
});
