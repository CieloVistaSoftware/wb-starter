// Automated fail-fast test watcher for WB
// Requires: chokidar, child_process

import { exec } from 'child_process';
import chokidar from 'chokidar';

let running = false;
let queued = false;

function runTests() {
  if (running) {
    queued = true;
    return;
  }
  running = true;
  console.log('\n[WB] Running fail-fast tests...');
  const proc = exec('npm run test:fast', (err, stdout, stderr) => {
    process.stdout.write(stdout);
    process.stderr.write(stderr);
    running = false;
    if (queued) {
      queued = false;
      runTests();
    }
  });
}

const watcher = chokidar.watch([
  'src/**/*.js',
  'src/**/*.ts',
  'src/**/*.json',
  'public/**/*.html',
  'tests/**/*.ts',
  'tests/**/*.js',
], {
  ignoreInitial: true,
});

watcher.on('all', (event, path) => {
  console.log(`[WB] File changed: ${path} (${event})`);
  runTests();
});

console.log('[WB] Fail-fast test watcher started.');
runTests();
