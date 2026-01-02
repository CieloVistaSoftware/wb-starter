const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  // Handle duplicates? Just keep last for now, or list all.
  // Better: list all to be safe.
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
    // Heuristic: test filename "card.spec.ts" -> looks for "card.js"
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
    // Normalize to forward slashes for Playwright
    const normalizedPath = relPath.replace(/\\/g, '/');
    console.log(`[RUN] ${normalizedPath} (${reason})`);
    testsToRun.push(normalizedPath);
  } else {
    // console.log(`[SKIP] ${relPath}`);
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
  // We use env var to tell Playwright where to write the JSON report
  // Note: This depends on Playwright respecting PLAYWRIGHT_JSON_OUTPUT_NAME 
  // or we rely on standard output capture if that fails. 
  // Actually, standard Playwright JSON reporter prints to stdout.
  // A better way is to use the 'json' reporter option in config or via env.
  
  // Let's try a different approach: pipe to file in the shell command?
  // execSync is shell-dependent.
  
  // Safest: Use env var for output if supported, or just try to parse stdout better.
  // But let's try setting the env var which is common for CI.
  
  const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: REPORT_FILE };
  
  // We still capture stdio to show progress/errors to user if needed, 
  // but we primarily want the file.
  // Actually, if we use 'json' reporter, it goes to stdout. 
  // If we want it in a file, we usually do: --reporter=json > file.json
  // But let's try to just capture stdout and find the JSON start/end.
  
  const output = execSync(cmd, { 
    cwd: ROOT, 
    env: env,
    encoding: 'utf-8', 
    stdio: 'pipe', // Capture output
    maxBuffer: 1024 * 1024 * 10 
  });
  
  // If successful (exit code 0), output is in stdout
  processResults(output, REPORT_FILE);
  
} catch (e) {
  // If failed (exit code 1), output is in e.stdout
  if (e.stdout) {
    processResults(e.stdout.toString(), REPORT_FILE);
  } else {
    console.error('Test execution failed without output.');
  }
  // We don't exit 1 here yet, we want to save cache first
}

function processResults(stdout, reportFile) {
  let jsonStr = stdout;
  
  // Try reading from file if it exists (if env var worked)
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
    // Attempt to find JSON in stdout if file didn't work
    // JSON reporter output starts with { and ends with }
    // We look for the last occurrence of "suites" which is unique to the report
    
    let json = null;
    
    // 1. Try parsing full string
    try {
      json = JSON.parse(jsonStr);
    } catch (e) {
      // 2. Try finding the JSON blob
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
    
    // Helper to traverse the suite tree
    const traverse = (node) => {
      if (node.specs) {
        node.specs.forEach(spec => {
          // Check if all tests in this spec passed
          // spec.tests contains results for each project/worker
          // We consider it passed if spec.ok is true (Playwright aggregates this)
          if (spec.ok) {
            const filePath = spec.file;
            // Normalize path
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

    // Save cache
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`\n✅ Updated cache: ${passedCount} tests passed and saved.`);
    
    if (passedCount === 0) {
      console.log('JSON Content:', JSON.stringify(json, null, 2).substring(0, 1000));
    }

    // Cleanup
    // if (fs.existsSync(reportFile)) fs.unlinkSync(reportFile);

  } catch (e) {
    console.error('Error processing results:', e);
  }
}
