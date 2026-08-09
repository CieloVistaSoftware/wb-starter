/**
 * scripts/migrate-data-wb-pass2.mjs — FIXED
 * 
 * Second pass migration with:
 * - Skip files that intentionally test legacy data-wb detection
 * - Fix wb-wb-* double prefix for layout components
 * - setAttribute('data-wb', ...) → proper v3 syntax
 * - Remaining selectors and attribute checks
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const apply = process.argv.includes('--apply');

// Files that INTENTIONALLY test legacy data-wb detection — DO NOT MIGRATE
const LEGACY_TEST_FILES = new Set([
  'strict-mode-runtime.spec.ts',
  'v3-syntax-compliance.spec.ts',
  'legacy-pill.spec.ts',
  'auto-injection-compliance.spec.ts',  // Tests article with data-wb="card" → error
  'find-pill.spec.ts',                  // Debug tool checking legacy elements
]);

// Decoration behaviors → x-name attribute
const DECORATIONS = new Set([
  'ripple', 'draggable', 'sticky', 'scrollalong', 'move',
  'effects', 'confetti', 'fireworks', 'snow', 'autosize',
  'media', 'figure', 'moveup', 'movedown', 'moveleft', 'moveright', 'moveall',
]);

function findFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) results.push(...findFiles(full));
    else if (e.name.endsWith('.spec.ts')) results.push(full);
  }
  return results;
}

/**
 * Convert behavior name to proper wb-* tag selector.
 * Handles wb-grid → wb-grid (NOT wb-wb-grid)
 */
function toWbTag(behavior) {
  if (behavior.startsWith('wb-')) return behavior; // Already has wb- prefix
  return `wb-${behavior}`;
}

const files = findFiles(path.join(ROOT, 'tests'));
let totalChanges = 0;
let filesChanged = 0;

console.log(`\n${'='.repeat(60)}`);
console.log(apply ? '  APPLYING PASS 2' : '  DRY RUN PASS 2 (pass --apply to execute)');
console.log(`${'='.repeat(60)}\n`);

for (const filePath of files) {
  const fileName = path.basename(filePath);
  
  // Skip intentional legacy test files
  if (LEGACY_TEST_FILES.has(fileName)) {
    console.log(`⏭️  SKIP (legacy test): ${path.relative(ROOT, filePath)}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  const rel = path.relative(ROOT, filePath);
  const changes = [];

  if (!content.includes('data-wb')) continue;

  // ─── 1. setAttribute('data-wb', 'name') ───
  content = content.replace(
    /\.setAttribute\(['"]data-wb['"],\s*['"]([^'"]+)['"]\)/g,
    (match, behavior) => {
      if (DECORATIONS.has(behavior)) {
        changes.push(`setAttribute → x-${behavior}`);
        return `.setAttribute('x-${behavior}', '')`;
      } else {
        changes.push(`setAttribute → x-as-${behavior}`);
        return `.setAttribute('x-as-${behavior}', '')`;
      }
    }
  );

  // ─── 2. Remove injectAndScan [data-wb] → data-wb-eager loop ───
  content = content.replace(
    /const elements = container\.querySelectorAll\('\[data-wb\]'\);\s*\n\s*elements\.forEach\(el => el\.setAttribute\('data-wb-eager', ''\)\);/g,
    () => {
      changes.push('removed [data-wb] eager scan (not needed in v3)');
      return '// v3: eager loading handled by WB.scan()';
    }
  );

  // Also handle the /* eager removed */ leftover from pass 1
  content = content.replace(
    /const elements = container\.querySelectorAll\('\[data-wb\]'\);\s*\n\s*elements\.forEach\(el => \/\* eager removed \*\/\);/g,
    () => {
      changes.push('cleaned up eager removal leftover');
      return '// v3: eager loading handled by WB.scan()';
    }
  );

  // ─── 3. Remaining [data-wb="name"] selectors ───
  content = content.replace(
    /\[data-wb="([^"]+)"\]/g,
    (match, behavior) => {
      if (DECORATIONS.has(behavior)) {
        changes.push(`selector [data-wb="${behavior}"] → [x-${behavior}]`);
        return `[x-${behavior}]`;
      } else {
        const tag = toWbTag(behavior);
        changes.push(`selector [data-wb="${behavior}"] → ${tag}`);
        return tag;
      }
    }
  );

  // ─── 4. Remaining inline HTML data-wb="name" ───
  content = content.replace(
    /(<\w+[^>]*)\s+data-wb="([^"]+)"([^>]*>)/g,
    (match, before, behavior, after) => {
      if (DECORATIONS.has(behavior)) {
        changes.push(`html data-wb="${behavior}" → x-${behavior}`);
        return `${before} x-${behavior}${after}`;
      } else {
        changes.push(`html data-wb="${behavior}" → x-as-${behavior}`);
        return `${before} x-as-${behavior}${after}`;
      }
    }
  );

  // ─── 5. toHaveAttribute('data-wb', 'name') ───
  content = content.replace(
    /toHaveAttribute\(['"]data-wb['"],\s*['"](\w+)['"]\)/g,
    (match, behavior) => {
      if (DECORATIONS.has(behavior)) {
        changes.push(`toHaveAttribute → x-${behavior}`);
        return `toHaveAttribute('x-${behavior}', '')`;
      } else {
        changes.push(`toHaveAttribute → x-as-${behavior}`);
        return `toHaveAttribute('x-as-${behavior}', '')`;
      }
    }
  );

  // ─── 6. data-wb-autosize, data-wb-datepicker, etc. ───
  content = content.replace(/data-wb-autosize/g, () => { changes.push('data-wb-autosize → x-autosize'); return 'x-autosize'; });
  content = content.replace(/data-wb-datepicker/g, () => { changes.push('data-wb-datepicker → x-datepicker'); return 'x-datepicker'; });
  content = content.replace(/data-wb-timepicker/g, () => { changes.push('data-wb-timepicker → x-timepicker'); return 'x-timepicker'; });
  content = content.replace(/data-wb-diff(?=['"])/g, () => { changes.push('data-wb-diff → x-diff'); return 'x-diff'; });
  content = content.replace(/data-wb-demo/g, () => { changes.push('data-wb-demo → x-demo'); return 'x-demo'; });
  content = content.replace(/data-wb-ignore/g, () => { changes.push('data-wb-ignore → x-ignore'); return 'x-ignore'; });

  // ─── 7. getAttribute('data-wb') ───
  // In v3 there is no data-wb attribute. Tests checking it need rework.
  // For now, add a TODO comment
  content = content.replace(
    /getAttribute\(['"]data-wb['"]\)/g,
    (match) => {
      changes.push('getAttribute("data-wb") → TODO');
      return `getAttribute('data-wb') /* TODO: v3 check tagName or x-* attr */`;
    }
  );

  if (content !== original) {
    console.log(`📝 ${rel} (${changes.length} changes)`);
    changes.forEach(c => console.log(`   ${c}`));
    console.log();
    filesChanged++;
    totalChanges += changes.length;
    if (apply) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
}

console.log(`${'='.repeat(60)}`);
console.log(`  ${filesChanged} files, ${totalChanges} changes ${apply ? 'applied' : 'would apply'}`);
console.log(`${'='.repeat(60)}\n`);
