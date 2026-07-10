import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
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

console.log('Checking for changes...');
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

// 4. Run Playwright, batched to stay well under OS command-line limits.
// Previously this joined every changed file path into one shell string
// (`npx playwright test <files> ...`) and ran it via execSync — with
// enough changed files (e.g. 284 on a checkout with a stale cache) that
// line exceeded Windows' ~8191-char cmd.exe limit, so execSync threw
// before Playwright ever started, and (since the process never produced
// stdout) the catch block's else branch swallowed the real error behind
// "Test execution failed without output." (#315). spawnSync with an argv
// array avoids shell command-line parsing entirely, and batching keeps
// each invocation small regardless of platform.
const BATCH_SIZE = 40;
// Invoke Playwright's CLI directly via `node` rather than the `npx`/`npx.cmd`
// shim — avoids needing shell:true on Windows (which Node's own deprecation
// warning flags: unescaped array args concatenated into a shell command line
// is a real injection risk in general, even though these particular args are
// just repo-internal file paths). `node <script>` is a real executable, so
// spawnSync can invoke it directly with an argv array, no shell involved.
const playwrightCli = path.join(ROOT, 'node_modules', '@playwright', 'test', 'cli.js');

console.log('Executing Playwright...');

for (let i = 0; i < testsToRun.length; i += BATCH_SIZE) {
  const batch = testsToRun.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(testsToRun.length / BATCH_SIZE);
  const batchReportFile = path.join(ROOT, `.test-results-temp-${i}.json`);

  console.log(`  Batch ${batchNum}/${totalBatches}: ${batch.length} files`);

  const result = spawnSync(process.execPath, [playwrightCli, 'test', ...batch, '--reporter=json', '--workers=8'], {
    cwd: ROOT,
    env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: batchReportFile },
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 10,
  });

  if (result.error) {
    console.error(`Batch ${batchNum} failed to launch:`, result.error.message);
    continue;
  }

  processResults(result.stdout || '', batchReportFile);
  try { fs.unlinkSync(batchReportFile); } catch { /* already cleaned up or never written */ }
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
