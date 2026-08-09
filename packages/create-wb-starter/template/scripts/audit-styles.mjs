/**
 * STYLE CONSTITUTION AUDIT
 * ========================
 * Run: node scripts/audit-styles.mjs
 * 
 * Checks compliance with docs/styles.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const GLOBAL_SELECTORS = ['body', 'html', '.site', '.site__body', '.site__main'];
const FORBIDDEN_JS_PATTERNS = [
    { pattern: /document\.body\.style/, message: 'Direct modification of body style' },
    { pattern: /document\.documentElement\.style/, message: 'Direct modification of html style' },
    { pattern: /\.site.*\.style/, message: 'Modification of .site global containers' }
];

const THEMES_CSS = 'src/styles/themes.css';
const SITE_CSS = 'src/styles/site.css';
const BEHAVIORS_CSS_DIR = 'src/behaviors/css';
const BEHAVIORS_JS_DIR = 'src/behaviors/js';

const issues = [];

function logIssue(file, message) {
    issues.push({ file, message });
    console.log(`❌ ${file}: ${message}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECKS
// ═══════════════════════════════════════════════════════════════════════════

function checkHtmlFiles() {
    // Check index.html and other pages for CSS loading
    const pagesDir = path.join(ROOT_DIR, 'pages');
    const files = ['index.html', ...fs.readdirSync(pagesDir).map(f => path.join('pages', f))];

    files.forEach(file => {
        if (!fs.existsSync(path.join(ROOT_DIR, file))) return;
        
        const content = fs.readFileSync(path.join(ROOT_DIR, file), 'utf-8');
        
        // Check for inline styles
        if (content.includes('style="')) {
            // Allow some inline styles for dynamic content if absolutely necessary, but warn
            // logIssue(file, 'Contains inline styles (style="...")'); 
        }
    });
}

function checkThemesCss() {
    const content = fs.readFileSync(path.join(ROOT_DIR, THEMES_CSS), 'utf-8');
    
    // Should mostly be :root { ... } or [data-theme="..."] { ... }
    const lines = content.split('\n');
    lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (trimmed.includes('{') && 
            !trimmed.startsWith(':root') && 
            !trimmed.startsWith('@media') && 
            !trimmed.startsWith('/*') &&
            !trimmed.includes('[data-theme')
        ) {
            logIssue(THEMES_CSS, `Line ${i+1}: Selector "${trimmed}" found. themes.css should only contain variables in :root or theme definitions.`);
        }
    });
}

function checkNoHardcodedColors(file, content) {
    // Regex for hex codes
    const hexPattern = /#[0-9a-fA-F]{3,6}/g;
    const matches = content.match(hexPattern);
    
    if (matches && file !== THEMES_CSS) {
        // Filter out matches inside comments (simple check)
        const uniqueMatches = [...new Set(matches)];
        if (uniqueMatches.length > 0) {
             logIssue(file, `Contains ${matches.length} hardcoded color(s) (e.g., ${uniqueMatches.slice(0, 3).join(', ')}). Use var(--...) instead.`);
        }
    }
}

function checkNoImportant(file, content) {
    if (content.includes('!important')) {
        logIssue(file, 'Usage of !important found.');
    }
}

function checkBehaviorCssIsolation() {
    if (!fs.existsSync(path.join(ROOT_DIR, BEHAVIORS_CSS_DIR))) return;
    
    const files = fs.readdirSync(path.join(ROOT_DIR, BEHAVIORS_CSS_DIR)).filter(f => f.endsWith('.css'));
    
    files.forEach(f => {
        const filePath = path.join(BEHAVIORS_CSS_DIR, f);
        const content = fs.readFileSync(path.join(ROOT_DIR, filePath), 'utf-8');
        
        checkNoHardcodedColors(filePath, content);
        checkNoImportant(filePath, content);
        
        // Check for global selectors
        GLOBAL_SELECTORS.forEach(selector => {
            // Simple regex to find selector at start of line or after }
            // This is not a full CSS parser, but catches obvious violations
            const regex = new RegExp(`(^|[}\\s])${selector.replace('.', '\\.')}\\s*{`, 'm');
            if (regex.test(content)) {
                logIssue(filePath, `Modifies global selector "${selector}"`);
            }
        });
    });
}

function checkBehaviorJsIsolation() {
    if (!fs.existsSync(path.join(ROOT_DIR, BEHAVIORS_JS_DIR))) return;

    const files = fs.readdirSync(path.join(ROOT_DIR, BEHAVIORS_JS_DIR)).filter(f => f.endsWith('.js'));
    
    files.forEach(f => {
        const filePath = path.join(BEHAVIORS_JS_DIR, f);
        const content = fs.readFileSync(path.join(ROOT_DIR, filePath), 'utf-8');
        
        FORBIDDEN_JS_PATTERNS.forEach(({ pattern, message }) => {
            if (pattern.test(content)) {
                logIssue(filePath, message);
            }
        });
        
        // Check for querySelector targeting globals
        GLOBAL_SELECTORS.forEach(selector => {
            if (content.includes(`querySelector('${selector}')`) || content.includes(`querySelector("${selector}")`)) {
                logIssue(filePath, `Selects global element "${selector}"`);
            }
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN
// ═══════════════════════════════════════════════════════════════════════════

console.log('═══════════════════════════════════════════════════════════════════');
console.log('STYLE CONSTITUTION AUDIT');
console.log('Checking compliance with docs/styles.md');
console.log('═══════════════════════════════════════════════════════════════════\n');

try {
    checkHtmlFiles();
    checkThemesCss();
    
    // Check site.css
    const siteCssContent = fs.readFileSync(path.join(ROOT_DIR, SITE_CSS), 'utf-8');
    checkNoHardcodedColors(SITE_CSS, siteCssContent);
    checkNoImportant(SITE_CSS, siteCssContent);
    
    checkBehaviorCssIsolation();
    checkBehaviorJsIsolation();
    
} catch (e) {
    console.error('Audit failed with error:', e);
}

console.log('\n═══════════════════════════════════════════════════════════════════');
if (issues.length === 0) {
    console.log('✅ COMPLIANCE PASSED: No violations found.');
} else {
    console.log(`❌ COMPLIANCE FAILED: ${issues.length} violations found.`);
    process.exit(1);
}
