import fs from 'fs';
import path from 'path';
import { execSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const CACHE_FILE = path.join(ROOT, '.test-cache.json');
const TESTS_DIR = path.join(ROOT, 'tests');
const SRC_DIR = path.join(ROOT, 'src');

// Load cache
let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  try {
    cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  } catch (e) {
    console.log('Corrupt cache, starting fresh.');
  }
}

// Helper to recursively find files
function findFiles(dir, ext, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findFiles(fullPath, ext, fileList);
    } else if (fullPath.endsWith(ext)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// 1. Map Source Files: basename -> fullPath
console.log('Scanning source files...');
const srcFiles = findFiles(SRC_DIR, '.js');
const srcMap = {};
srcFiles.forEach(f => {
  const base = path.basename(f, '.js');
  if (!srcMap[base]) srcMap[base] = [];
  srcMap[base].push(f);
});

// 2. Scan Test Files
console.log('Scanning test files...');
const testFiles = findFiles(TESTS_DIR, '.spec.ts');

// 3. Determine what to run
const testsToRun = [];
const now = Date.now();

// Prefer staged changes when available (fast path for developer iteration)
console.log('Checking for changes...');
let changedFiles = [];
try {
  const staged = execSync('git diff --name-only --cached', { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
  if (staged.length) changedFiles = staged;
} catch (err) {
  // ignore
}
if (changedFiles.length === 0) {
  try {
    const diff = execSync('git diff --name-only HEAD', { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
    changedFiles = diff;
  } catch (err) {
    changedFiles = [];
  }
}

if (changedFiles.length) {
  // Conservative mapping: try to find tests that mention the token or related src basenames
  const selected = new Set();
  const reasons = [];
  for (const f of changedFiles) {
    if (!f) continue;
    if (f.startsWith('tests/') && f.endsWith('.spec.ts')) {
      selected.add(f.replace(/\\/g, '/'));
      reasons.push({ file: f, reason: 'test file changed' });
      continue;
    }
    if (f.startsWith('src/')) {
      const base = path.basename(f).replace(/\.[^.]+$/, '').replace(/[-_.]/g, '');
      if (srcMap[base]) {
        srcMap[base].forEach(s => {
          // find tests that match this basename
          testFiles.forEach(t => { if (t.includes(base)) selected.add(path.relative(ROOT, t).replace(/\\/g, '/')); });
        });
        reasons.push({ file: f, reason: `matched srcMap token '${base}'` });
        continue;
      }
      // fallback: grep tests for token
      // Attempt to match tests by filename/token in the repository (portable — no external tools required)
      const tokenMatches = testFiles.filter(t => t.toLowerCase().includes(base.toLowerCase())).slice(0, 10);
      tokenMatches.forEach(m => selected.add(path.relative(ROOT, m).replace(/\\/g, '/')));
      if (tokenMatches.length) {
        reasons.push({ file: f, reason: `matched tests by filename for '${base}'`, matches: tokenMatches.slice(0,5).map(p => path.relative(ROOT, p)) });
      } else {
        reasons.push({ file: f, reason: `src change (no direct test match), defaulting to behavior tests` });
      }
      // conservative default for src changes
      selected.add('tests/behaviors/**');
      continue;
    }
    if (f.startsWith('docs/') || f.startsWith('pages/') || f.startsWith('demos/') || f.startsWith('public/')) {
      selected.add('tests/compliance/project-integrity.spec.ts');
      selected.add('tests/compliance/abbreviation-definitions.spec.ts');
      reasons.push({ file: f, reason: 'docs/pages change — run integrity & docs compliance' });
      continue;
    }
    // filename token heuristic
    const token = path.basename(f).replace(/\..*$/, '');
    if (token.length >= 4) {
      // portable fallback: search test file paths and contents for the token
    const tokenMatches = testFiles.filter(t => t.toLowerCase().includes(token.toLowerCase())).slice(0,10);
    tokenMatches.forEach(m => selected.add(path.relative(ROOT, m).replace(/\\/g, '/')));
    if (tokenMatches.length) reasons.push({ file: f, reason: `matched tests by filename for token '${token}'`, matches: tokenMatches.slice(0,5).map(p => path.relative(ROOT, p)) });
    } else {
      reasons.push({ file: f, reason: 'no mapping — will run fast smoke' });
    }
  }

  const sel = Array.from(selected).slice(0, 40);
  fs.writeFileSync(path.join(ROOT, 'tmp', 'test-incremental-selection.json'), JSON.stringify({ changedFiles, selection: sel, reasons }, null, 2));
  if (sel.length === 0) {
    console.log('No targeted tests identified from changes — running fast smoke path.');
    {
    const sp = spawnSync('npm', ['run', 'test:fast'], { stdio: 'inherit', shell: true });
    process.exit(sp.status || 0);
  }
  }
  console.log(`Selected ${sel.length} test targets from changed files.`);
  sel.forEach(s => console.log('  -', s));
  // run selected tests and exit
  const cmd = `npx playwright test ${sel.join(' ')} --reporter=json --workers=8`;
  console.log('Executing Playwright (targeted):', cmd);
  try {
    const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: REPORT_FILE };
    const output = execSync(cmd, { cwd: ROOT, env, encoding: 'utf-8', stdio: 'pipe', maxBuffer: 1024 * 1024 * 10 });
    processResults(output, REPORT_FILE);
    process.exit(0);
  } catch (e) {
    if (e.stdout) processResults(e.stdout.toString(), REPORT_FILE);
    process.exit(e.status || 1);
  }
}

// --- fallback: original mtime-based heuristic ---
for (const testFile of testFiles) {
  const relPath = path.relative(ROOT, testFile);
  const lastRun = cache[relPath] || 0;
  const testStat = fs.statSync(testFile);
  
  let needsRun = false;
  let reason = '';

  // Check test file itself
  if (testStat.mtimeMs > lastRun) {
    needsRun = true;
    reason = 'Test file changed';
  } else {
    // Check related source files
    const base = path.basename(testFile, '.spec.ts');
    const relatedSrcs = srcMap[base] || [];
    
    for (const srcFile of relatedSrcs) {
      const srcStat = fs.statSync(srcFile);
      if (srcStat.mtimeMs > lastRun) {
        needsRun = true;
        reason = `Source file changed: ${path.basename(srcFile)}`;
        break;
      }
    }
  }

  if (needsRun) {
    const normalizedPath = relPath.replace(/\\/g, '/');
    console.log(`[RUN] ${normalizedPath} (${reason})`);
    testsToRun.push(normalizedPath);
  }
}

if (testsToRun.length === 0) {
  console.log('✅ No changes detected. All tests up to date.');
  process.exit(0);
}

console.log(`\nRunning ${testsToRun.length} test files...`);

// 4. Run Playwright
const REPORT_FILE = path.join(ROOT, '.test-results-temp.json');
const cmd = `npx playwright test ${testsToRun.join(' ')} --reporter=json --workers=8`;

console.log('Executing Playwright...');

try {
  const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: REPORT_FILE };
  
  const output = execSync(cmd, { 
    cwd: ROOT, 
    env: env,
    encoding: 'utf-8', 
    stdio: 'pipe',
    maxBuffer: 1024 * 1024 * 10 
  });
  
  processResults(output, REPORT_FILE);
  
} catch (e) {
  if (e.stdout) {
    processResults(e.stdout.toString(), REPORT_FILE);
  } else {
    console.error('Test execution failed without output.');
  }
}

function processResults(stdout, reportFile) {
  let jsonStr = stdout;
  
  if (fs.existsSync(reportFile)) {
    try {
      console.log(`Reading report file: ${reportFile} (${fs.statSync(reportFile).size} bytes)`);
      jsonStr = fs.readFileSync(reportFile, 'utf-8');
    } catch (err) {
      console.log('Error reading report file:', err.message);
    }
  } else {
    console.log('Report file not found, using stdout.');
  }

  try {
    let json = null;
    
    try {
      json = JSON.parse(jsonStr);
    } catch (e) {
      const start = jsonStr.indexOf('{');
      const end = jsonStr.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        try {
          json = JSON.parse(jsonStr.substring(start, end + 1));
        } catch (e2) {
           console.log('Could not extract JSON from stdout/file');
        }
      }
    }

    if (!json) {
      console.error('Could not parse Playwright JSON report.');
      console.log('Output preview:', jsonStr.substring(0, 500));
      return;
    }
    
    let passedCount = 0;
    
    const traverse = (node) => {
      if (node.specs) {
        node.specs.forEach(spec => {
          if (spec.ok) {
            const filePath = spec.file;
            const relPath = path.relative(ROOT, filePath);
            cache[relPath] = now;
            passedCount++;
          }
        });
      }
      if (node.suites) {
        node.suites.forEach(traverse);
      }
    };
    
    if (json.suites) {
      json.suites.forEach(traverse);
    }

    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`\n✅ Updated cache: ${passedCount} tests passed and saved.`);
    
    if (passedCount === 0) {
      console.log('JSON Content:', JSON.stringify(json, null, 2).substring(0, 1000));
    }

  } catch (e) {
    console.error('Error processing results:', e);
  }
}
