const { execSync } = require('child_process');

try {
  const out = execSync("git grep -n " + 'scrollIntoViewIfNeeded\\(\\)' + " -- 'tests/**/*.ts' || true", { encoding: 'utf8' });
  if (!out.trim()) {
    console.log('✅ no remaining scrollIntoViewIfNeeded() usages found in tests');
    process.exit(0);
  }
  console.error('❌ Found remaining scrollIntoViewIfNeeded() usages:\n' + out);
  process.exit(2);
} catch (err) {
  console.error('Error running check-safe-scroll:', err && err.message);
  process.exit(3);
}
